/**
 * @fileoverview Otimização de Desempenho e Minimização de Chamadas de Serviço
 * @version 1.0.0
 * @author UNIAE CRE Team
 * @created 2025-12-17
 * 
 * @description
 * Módulo dedicado à otimização de desempenho do sistema, implementando:
 * - Batching de operações de leitura/escrita
 * - Cache inteligente com TTL configurável
 * - Minimização de chamadas de serviço
 * - Debounce para triggers de edição
 * - Métricas de performance
 * 
 * @requires 0_Core_Safe_Globals.gs
 * @requires Core_Logger.gs
 * @requires Core_Cache.gs
 * 
 * @see PERFORMANCE_REPORT.md para métricas e benchmarks
 */

'use strict';

// ============================================================================
// CONFIGURAÇÃO DE PERFORMANCE
// ============================================================================

/**
 * Configuração de otimização de performance
 * @constant {Object}
 */
var PERFORMANCE_CONFIG = {
  /** Tamanho padrão do lote para operações em massa */
  DEFAULT_BATCH_SIZE: 100,
  
  /** Máximo de linhas por leitura */
  MAX_ROWS_PER_READ: 1000,
  
  /** TTL padrão do cache em segundos */
  DEFAULT_CACHE_TTL: 600,
  
  /** Intervalo mínimo entre execuções de debounce (ms) */
  DEBOUNCE_INTERVAL_MS: 2000,
  
  /** Habilitar logging de performance */
  ENABLE_PERF_LOGGING: true,
  
  /** Threshold para alertar operações lentas (ms) */
  SLOW_OPERATION_THRESHOLD_MS: 5000
};

// ============================================================================
// MÓDULO DE OTIMIZAÇÃO DE PERFORMANCE
// ============================================================================

/**
 * Otimizador de Performance do Sistema
 * @namespace PerformanceOptimizer
 */
var PerformanceOptimizer = (function() {
  
  // --------------------------------------------------------------------------
  // CACHE DE OBJETOS CAROS
  // --------------------------------------------------------------------------
  
  /**
   * Cache de referências de objetos do GAS
   * @private
   * @type {Object}
   */
  var _objectCache = {
    spreadsheet: null,
    sheets: {},
    headers: {},
    ui: null,
    uiChecked: false
  };
  
  /**
   * Métricas de performance
   * @private
   * @type {Object}
   */
  var _metrics = {
    cacheHits: 0,
    cacheMisses: 0,
    serviceCallsSaved: 0,
    totalOperations: 0,
    totalDuration: 0
  };
  
  // --------------------------------------------------------------------------
  // FUNÇÕES DE CACHE DE OBJETOS
  // --------------------------------------------------------------------------
  
  /**
   * Obtém spreadsheet com cache
   * @returns {GoogleAppsScript.Spreadsheet.Spreadsheet}
   */
  function getSpreadsheetCached() {
    if (!_objectCache.spreadsheet) {
      _objectCache.spreadsheet = getSS();
      _metrics.cacheMisses++;
    } else {
      _metrics.cacheHits++;
      _metrics.serviceCallsSaved++;
    }
    return _objectCache.spreadsheet;
  }
  
  /**
   * Obtém sheet com cache
   * @param {string} sheetName - Nome da aba
   * @returns {GoogleAppsScript.Spreadsheet.Sheet}
   */
  function getSheetCached(sheetName) {
    try {
      if (!_objectCache.sheets[sheetName]) {
        var ss = getSpreadsheetCached();
        _objectCache.sheets[sheetName] = ss.getSheetByName(sheetName);
        _metrics.cacheMisses++;
      } else {
        _metrics.cacheHits++;
        _metrics.serviceCallsSaved++;
      }
      return _objectCache.sheets[sheetName];
    } catch (error) {
      Logger.log("Erro em getSheetCached: " + error.message);
      throw error;
    }
  }
  
  /**
   * Obtém headers com cache
   * @param {string} sheetName - Nome da aba
   * @returns {Array<string>}
   */
  function getHeadersCached(sheetName) {
    try {
      if (!_objectCache.headers[sheetName]) {
        var sheet = getSheetCached(sheetName);
        if (sheet && sheet.getLastColumn() > 0) {
          _objectCache.headers[sheetName] = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        } else {
          _objectCache.headers[sheetName] = [];
        }
        _metrics.cacheMisses++;
      } else {
        _metrics.cacheHits++;
        _metrics.serviceCallsSaved++;
      }
      return _objectCache.headers[sheetName];
    } catch (error) {
      Logger.log("Erro em getHeadersCached: " + error.message);
      throw error;
    }
  }
  
  /**
   * Obtém UI com cache e verificação segura
   * @returns {GoogleAppsScript.Base.Ui|null}
   */
  function getUiCached() {
    try {
      if (!_objectCache.uiChecked) {
        try {
          _objectCache.ui = SpreadsheetApp.getUi();
        } catch (e) {
          _objectCache.ui = null;
        }
        _objectCache.uiChecked = true;
      }
      return _objectCache.ui;
    } catch (error) {
      Logger.log("Erro em getUiCached: " + error.message);
      throw error;
    }
  }
  
  /**
   * Limpa cache de objetos
   */
  function clearObjectCache() {
    _objectCache = {
      spreadsheet: null,
      sheets: {},
      headers: {},
      ui: null,
      uiChecked: false
    };
  }
  
  // --------------------------------------------------------------------------
  // OPERAÇÕES EM LOTE (BATCHING)
  // --------------------------------------------------------------------------
  
  /**
   * Lê dados em lote de forma otimizada
   * 
   * @param {string} sheetName - Nome da aba
   * @param {Object} [options] - Opções de leitura
   * @param {number} [options.startRow=2] - Linha inicial
   * @param {number} [options.maxRows] - Máximo de linhas
   * @param {Array<string>} [options.columns] - Colunas específicas a ler
   * @returns {Array<Object>} Dados como array de objetos
   * 
   * @example
   * var dados = PerformanceOptimizer.batchRead('Fornecedores', {
   *   maxRows: 500,
   *   columns: ['nome', 'cnpj', 'status']
   * });
   */
  function batchRead(sheetName, options) {
    try {
      try {
        var startTime = Date.now();
        options = options || {};
    
        var startRow = options.startRow || 2;
        var maxRows = options.maxRows || PERFORMANCE_CONFIG.MAX_ROWS_PER_READ;
        var columnsFilter = options.columns || null;
    
        var sheet = getSheetCached(sheetName);
        if (!sheet) {
          return [];
        }
    
        var lastRow = sheet.getLastRow();
        var lastCol = sheet.getLastColumn();
    
        if (lastRow < startRow || lastCol === 0) {
          return [];
        }
    
        var numRows = Math.min(lastRow - startRow + 1, maxRows);
        var headers = getHeadersCached(sheetName);
    
        // Leitura em lote única
        var data = sheet.getRange(startRow, 1, numRows, lastCol).getValues();
    
        // Converte para objetos
        var result = [];
        for (var i = 0; i < data.length; i++) {
          var row = data[i];
      
          // Pula linhas vazias
          if (!row[0] && !row[1]) {
            continue;
          }
      
          var obj = {};
          for (var j = 0; j < headers.length; j++) {
            var header = headers[j];
        
            // Filtra colunas se especificado
            if (columnsFilter && columnsFilter.indexOf(header) === -1) {
              continue;
            }
        
            obj[header] = row[j];
          }
          obj._rowIndex = startRow + i;
          result.push(obj);
        }
    
        _logPerformance('batchRead', sheetName, Date.now() - startTime, result.length);
    
        return result;
      } catch (error) {
        Logger.log("Erro em batchRead: " + error.message);
        throw error;
      }
    } catch (error) {
      Logger.log("Erro em batchRead: " + error.message);
      throw error;
    }
  }
  
  /**
   * Escreve dados em lote de forma otimizada
   * 
   * @param {string} sheetName - Nome da aba
   * @param {Array<Object>} records - Registros a escrever
   * @param {Object} [options] - Opções de escrita
   * @param {boolean} [options.append=true] - Se true, adiciona ao final
   * @param {number} [options.startRow] - Linha inicial (se append=false)
   * @returns {Object} Resultado da operação
   * 
   * @example
   * var result = PerformanceOptimizer.batchWrite('Produtos', [
   *   { nome: 'Arroz', preco: 5.99 },
   *   { nome: 'Feijão', preco: 7.99 }
   * ]);
   */
  function batchWrite(sheetName, records, options) {
    try {
      try {
        try {
          var startTime = Date.now();
          options = options || {};
    
          if (!records || records.length === 0) {
            return { success: true, rowsWritten: 0 };
          }
    
          var sheet = getSheetCached(sheetName);
          if (!sheet) {
            return { success: false, error: 'Aba não encontrada: ' + sheetName };
          }
    
          var headers = getHeadersCached(sheetName);
          if (headers.length === 0) {
            return { success: false, error: 'Headers não encontrados' };
          }
    
          // Converte objetos para array de valores
          var values = [];
          for (var i = 0; i < records.length; i++) {
            var record = records[i];
            var row = [];
            for (var j = 0; j < headers.length; j++) {
              var value = record[headers[j]];
              row.push(value !== undefined ? value : '');
            }
            values.push(row);
          }
    
          // Determina linha inicial
          var targetRow;
          if (options.append !== false) {
            targetRow = sheet.getLastRow() + 1;
          } else {
            targetRow = options.startRow || 2;
          }
    
          // Escrita em lote única
          sheet.getRange(targetRow, 1, values.length, headers.length).setValues(values);
    
          // Invalida cache de headers se necessário
          delete _objectCache.headers[sheetName];
    
          _logPerformance('batchWrite', sheetName, Date.now() - startTime, values.length);
    
          return {
            success: true,
            rowsWritten: values.length,
            startRow: targetRow,
            endRow: targetRow + values.length - 1
          };
        } catch (error) {
          Logger.log("Erro em batchWrite: " + error.message);
          throw error; // Re-lança para tratamento superior
        }
      } catch (error) {
        Logger.log("Erro em batchWrite: " + error.message);
        throw error;
      }
    } catch (error) {
      Logger.log("Erro em batchWrite: " + error.message);
      throw error;
    }
  }
  
  /**
   * Atualiza múltiplas linhas em lote
   * 
   * @param {string} sheetName - Nome da aba
   * @param {Array<Object>} updates - Array de {rowIndex, data}
   * @returns {Object} Resultado
   */
  function batchUpdate(sheetName, updates) {
    try {
      try {
        try {
          var startTime = Date.now();
    
          if (!updates || updates.length === 0) {
            return { success: true, rowsUpdated: 0 };
          }
    
          var sheet = getSheetCached(sheetName);
          var headers = getHeadersCached(sheetName);
    
          if (!sheet || headers.length === 0) {
            return { success: false, error: 'Aba ou headers não encontrados' };
          }
    
          // Agrupa atualizações por coluna para minimizar chamadas
          var columnUpdates = {};
    
          for (var i = 0; i < updates.length; i++) {
            var update = updates[i];
            var rowIndex = update.rowIndex;
            var data = update.data;
      
            if (!rowIndex || !data) {
              continue;
            }
      
            var keys = Object.keys(data);
            for (var j = 0; j < keys.length; j++) {
              var key = keys[j];
              var colIndex = headers.indexOf(key);
        
              if (colIndex === -1) {
                continue;
              }
        
              if (!columnUpdates[colIndex]) {
                columnUpdates[colIndex] = [];
              }
        
              columnUpdates[colIndex].push({
                row: rowIndex,
                value: data[key]
              });
            }
          }
    
          // Aplica atualizações por coluna
          var colIndices = Object.keys(columnUpdates);
          for (var k = 0; k < colIndices.length; k++) {
            var colIdx = parseInt(colIndices[k], 10);
            var colUpdates = columnUpdates[colIdx];
      
            for (var m = 0; m < colUpdates.length; m++) {
              sheet.getRange(colUpdates[m].row, colIdx + 1).setValue(colUpdates[m].value);
            }
          }
    
          _logPerformance('batchUpdate', sheetName, Date.now() - startTime, updates.length);
    
          return {
            success: true,
            rowsUpdated: updates.length
          };
        } catch (error) {
          Logger.log("Erro em batchUpdate: " + error.message);
          throw error; // Re-lança para tratamento superior
        }
      } catch (error) {
        Logger.log("Erro em batchUpdate: " + error.message);
        throw error;
      }
    } catch (error) {
      Logger.log("Erro em batchUpdate: " + error.message);
      throw error;
    }
  }
  
  // --------------------------------------------------------------------------
  // CACHE DE DADOS
  // --------------------------------------------------------------------------
  
  /**
   * Obtém dados do cache ou executa função
   * 
   * @param {string} key - Chave do cache
   * @param {Function} fetchFn - Função para obter dados se não em cache
   * @param {number} [ttl] - Tempo de vida em segundos
   * @returns {*} Dados do cache ou resultado da função
   * 
   * @example
   * var config = PerformanceOptimizer.cacheGet('system_config', function() {
   *   return carregarConfiguracaoDoBanco();
   * }, 3600);
   */
  function cacheGet(key, fetchFn, ttl) {
    try {
      ttl = ttl || PERFORMANCE_CONFIG.DEFAULT_CACHE_TTL;
    
      try {
        var cache = CacheService.getScriptCache();
        var cached = cache.get(key);
      
        if (cached) {
          _metrics.cacheHits++;
          return JSON.parse(cached);
        }
      } catch (e) {
        // Cache indisponível, continua sem cache
      }
    
      _metrics.cacheMisses++;
    
      // Executa função para obter dados
      var data = fetchFn();
    
      // Armazena no cache
      try {
        var cache = CacheService.getScriptCache();
        cache.put(key, JSON.stringify(data), ttl);
      } catch (e) {
        // Falha ao cachear, ignora
      }
    
      return data;
    } catch (error) {
      Logger.log("Erro em cacheGet: " + error.message);
      throw error;
    }
  }
  
  /**
   * Invalida uma chave do cache
   * 
   * @param {string} key - Chave a invalidar
   */
  function cacheInvalidate(key) {
    try {
      try {
        var cache = CacheService.getScriptCache();
        cache.remove(key);
      } catch (e) {
        // Ignora erro
      }
    } catch (error) {
      Logger.log("Erro em cacheInvalidate: " + error.message);
      throw error;
    }
  }
  
  /**
   * Invalida múltiplas chaves do cache
   * 
   * @param {Array<string>} keys - Chaves a invalidar
   */
  function cacheInvalidateMultiple(keys) {
    try {
      var cache = CacheService.getScriptCache();
      cache.removeAll(keys);
    } catch (e) {
      // Ignora erro
    }
  }
  
  // --------------------------------------------------------------------------
  // DEBOUNCE PARA TRIGGERS
  // --------------------------------------------------------------------------
  
  /**
   * Implementa debounce para evitar execuções repetidas
   * 
   * @param {string} key - Identificador único da operação
   * @param {number} [intervalMs] - Intervalo mínimo entre execuções
   * @returns {boolean} true se pode executar, false se deve ignorar
   * 
   * @example
   * function onEdit(e) {
   *   if (!PerformanceOptimizer.debounce('onEdit_validation')) {
   *     return; // Ignora execução muito próxima
   *   }
   *   // Executa validação
   * }
   */
  function debounce(key, intervalMs) {
    intervalMs = intervalMs || PERFORMANCE_CONFIG.DEBOUNCE_INTERVAL_MS;
    
    var cacheKey = 'debounce_' + key;
    var now = Date.now();
    
    try {
      var cache = CacheService.getScriptCache();
      var lastRun = cache.get(cacheKey);
      
      if (lastRun) {
        var elapsed = now - parseInt(lastRun, 10);
        if (elapsed < intervalMs) {
          return false;
        }
      }
      
      cache.put(cacheKey, String(now), Math.ceil(intervalMs / 1000) + 1);
      return true;
      
    } catch (e) {
      // Se cache falhar, permite execução
      return true;
    }
  }
  
  // --------------------------------------------------------------------------
  // MEDIÇÃO DE PERFORMANCE
  // --------------------------------------------------------------------------
  
  /**
   * Mede tempo de execução de uma função
   * 
   * @param {string} operationName - Nome da operação
   * @param {Function} fn - Função a executar
   * @returns {Object} Resultado com dados e métricas
   * 
   * @example
   * var result = PerformanceOptimizer.measure('carregarDados', function() {
   *   return CRUD.read('Fornecedores');
   * });
   * Logger.log('Duração: ' + result.duration + 'ms');
   */
  function measure(operationName, fn) {
    var startTime = Date.now();
    var result;
    var error = null;
    
    try {
      result = fn();
    } catch (e) {
      error = e;
    }
    
    var duration = Date.now() - startTime;
    
    _metrics.totalOperations++;
    _metrics.totalDuration += duration;
    
    // Log se operação lenta
    if (duration > PERFORMANCE_CONFIG.SLOW_OPERATION_THRESHOLD_MS) {
      if (typeof AppLogger !== 'undefined') {
        AppLogger.warn('Operação lenta detectada: ' + operationName, {
          duration: duration,
          threshold: PERFORMANCE_CONFIG.SLOW_OPERATION_THRESHOLD_MS
        });
      }
    }
    
    _logPerformance(operationName, null, duration, null);
    
    if (error) {
      throw error;
    }
    
    return {
      data: result,
      duration: duration,
      operationName: operationName
    };
  }
  
  /**
   * Log interno de performance
   * @private
   */
  function _logPerformance(operation, context, duration, count) {
    if (!PERFORMANCE_CONFIG.ENABLE_PERF_LOGGING) {
      return;
    }
    
    if (typeof AppLogger !== 'undefined' && AppLogger.debug) {
      AppLogger.debug('PERF: ' + operation + (context ? ' [' + context + ']' : ''), {
        duration: duration + 'ms',
        count: count
      });
    }
  }
  
  // --------------------------------------------------------------------------
  // API PÚBLICA
  // --------------------------------------------------------------------------
  
  return {
    /** Configuração */
    CONFIG: PERFORMANCE_CONFIG,
    
    /** Cache de objetos */
    getSpreadsheetCached: getSpreadsheetCached,
    getSheetCached: getSheetCached,
    getHeadersCached: getHeadersCached,
    getUiCached: getUiCached,
    clearObjectCache: clearObjectCache,
    
    /** Operações em lote */
    batchRead: batchRead,
    batchWrite: batchWrite,
    batchUpdate: batchUpdate,
    
    /** Cache de dados */
    cacheGet: cacheGet,
    cacheInvalidate: cacheInvalidate,
    cacheInvalidateMultiple: cacheInvalidateMultiple,
    
    /** Debounce */
    debounce: debounce,
    
    /** Medição */
    measure: measure,
    
    /**
     * Obtém métricas de performance
     * @returns {Object} Métricas coletadas
     */
    getMetrics: function() {
      return {
        cacheHits: _metrics.cacheHits,
        cacheMisses: _metrics.cacheMisses,
        cacheHitRate: _metrics.cacheHits + _metrics.cacheMisses > 0 
          ? Math.round((_metrics.cacheHits / (_metrics.cacheHits + _metrics.cacheMisses)) * 100) + '%'
          : 'N/A',
        serviceCallsSaved: _metrics.serviceCallsSaved,
        totalOperations: _metrics.totalOperations,
        totalDuration: _metrics.totalDuration,
        avgDuration: _metrics.totalOperations > 0
          ? Math.round(_metrics.totalDuration / _metrics.totalOperations) + 'ms'
          : 'N/A'
      };
    },
    
    /**
     * Reseta métricas
     */
    resetMetrics: function() {
      _metrics = {
        cacheHits: 0,
        cacheMisses: 0,
        serviceCallsSaved: 0,
        totalOperations: 0,
        totalDuration: 0
      };
    }
  };
})();

// ============================================================================
// FUNÇÕES GLOBAIS DE CONVENIÊNCIA
// ============================================================================

/**
 * Leitura otimizada em lote
 * @param {string} sheetName - Nome da aba
 * @param {Object} [options] - Opções
 * @returns {Array<Object>} Dados
 */
function batchReadOptimized(sheetName, options) {
  return PerformanceOptimizer.batchRead(sheetName, options);
}

/**
 * Escrita otimizada em lote
 * @param {string} sheetName - Nome da aba
 * @param {Array<Object>} records - Registros
 * @param {Object} [options] - Opções
 * @returns {Object} Resultado
 */
function batchWriteOptimized(sheetName, records, options) {
  return PerformanceOptimizer.batchWrite(sheetName, records, options);
}

/**
 * Mede performance de uma operação
 * @param {string} name - Nome
 * @param {Function} fn - Função
 * @returns {Object} Resultado com métricas
 */
function measurePerformance(name, fn) {
  return PerformanceOptimizer.measure(name, fn);
}

// ============================================================================
// REGISTRO DO MÓDULO
// ============================================================================

Logger.log('✅ Core_Performance_Optimizer carregado - Otimização de performance disponível');
