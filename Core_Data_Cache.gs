/**
 * @fileoverview Cache de Dados de Planilhas - Otimização de Performance
 * @version 1.0.0
 * @description Cache em memória para reduzir chamadas repetidas a getDataRange().getValues()
 * 
 * INTERVENÇÃO 12/16: Otimização de Performance
 * - Cache de dados de planilhas em memória
 * - Invalidação automática por tempo
 * - Batch operations para escrita
 * - Redução de chamadas à API do Sheets
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-26
 */

'use strict';

var DataCache = (function() {
  
  // =========================================================================
  // CONFIGURAÇÃO
  // =========================================================================
  
  var CONFIG = {
    DEFAULT_TTL_MS: 30000,      // 30 segundos de cache padrão
    MAX_CACHE_SIZE: 50,         // Máximo de sheets em cache
    ENABLE_LOGGING: false       // Log de debug
  };
  
  // =========================================================================
  // ESTADO DO CACHE
  // =========================================================================
  
  var _cache = {};
  var _cacheStats = {
    hits: 0,
    misses: 0,
    invalidations: 0
  };
  
  // =========================================================================
  // FUNÇÕES PRIVADAS
  // =========================================================================
  
  /**
   * Gera chave de cache para uma sheet
   * @private
   */
  function _getCacheKey(sheetName, spreadsheetId) {
    spreadsheetId = spreadsheetId || 'active';
    return spreadsheetId + '::' + sheetName;
  }
  
  /**
   * Verifica se entrada de cache é válida
   * @private
   */
  function _isValid(entry, ttl) {
    if (!entry) return false;
    var age = Date.now() - entry.timestamp;
    return age < (ttl || CONFIG.DEFAULT_TTL_MS);
  }
  
  /**
   * Limpa entradas expiradas
   * @private
   */
  function _cleanup() {
    try {
      var keys = Object.keys(_cache);
      var now = Date.now();
    
      keys.forEach(function(key) {
        if (now - _cache[key].timestamp > CONFIG.DEFAULT_TTL_MS * 2) {
          delete _cache[key];
        }
      });
    
      // Limita tamanho do cache
      keys = Object.keys(_cache);
      if (keys.length > CONFIG.MAX_CACHE_SIZE) {
        // Remove entradas mais antigas
        keys.sort(function(a, b) {
          return _cache[a].timestamp - _cache[b].timestamp;
        });
      
        var toRemove = keys.length - CONFIG.MAX_CACHE_SIZE;
        for (var i = 0; i < toRemove; i++) {
          delete _cache[keys[i]];
        }
      }
    } catch (error) {
      Logger.log("Erro em _cleanup: " + error.message);
      throw error;
    }
  }
  
  /**
   * Log de debug
   * @private
   */
  function _log(message) {
    try {
      try {
        if (CONFIG.ENABLE_LOGGING) {
          Logger.log('[DataCache] ' + message);
        }
      } catch (error) {
        Logger.log("Erro em _log: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em _log: " + error.message);
      throw error;
    }
  }
  
  // =========================================================================
  // API PÚBLICA
  // =========================================================================
  
  return {
    
    /**
     * Obtém dados de uma sheet com cache
     * @param {string} sheetName - Nome da aba
     * @param {Object} [options] - Opções
     * @param {number} [options.ttl] - TTL em ms
     * @param {boolean} [options.forceRefresh] - Força refresh
     * @param {string} [options.spreadsheetId] - ID da planilha (default: ativa)
     * @returns {Array} Dados da sheet
     */
    getData: function(sheetName, options) {
      try {
        options = options || {};
        var key = _getCacheKey(sheetName, options.spreadsheetId);
        var ttl = options.ttl || CONFIG.DEFAULT_TTL_MS;
      
        // Verifica cache
        if (!options.forceRefresh && _cache[key] && _isValid(_cache[key], ttl)) {
          _cacheStats.hits++;
          _log('HIT: ' + sheetName);
          return _cache[key].data;
        }
      
        // Cache miss - busca dados
        _cacheStats.misses++;
        _log('MISS: ' + sheetName);
      
        var ss = options.spreadsheetId 
          ? SpreadsheetApp.openById(options.spreadsheetId)
          : getSS();
      
        if (!ss) return [];
      
        var sheet = ss.getSheetByName(sheetName);
        if (!sheet) return [];
      
        var data = sheet.getDataRange().getValues();
      
        // Armazena no cache
        _cache[key] = {
          data: data,
          timestamp: Date.now(),
          rowCount: data.length
        };
      
        // Cleanup periódico
        if (Math.random() < 0.1) {
          _cleanup();
        }
      
        return data;
      } catch (error) {
        Logger.log("Erro em getData: " + error.message);
        throw error;
      }
    },
    
    /**
     * Obtém dados com headers mapeados
     * @param {string} sheetName - Nome da aba
     * @param {Object} [options] - Opções
     * @returns {Object} { headers: Array, rows: Array, mapped: Array }
     */
    getDataMapped: function(sheetName, options) {
      try {
        var data = this.getData(sheetName, options);
      
        if (data.length === 0) {
          return { headers: [], rows: [], mapped: [] };
        }
      
        var headers = data[0];
        var rows = data.slice(1);
      
        var mapped = rows.map(function(row) {
          var obj = {};
          headers.forEach(function(header, idx) {
            obj[header] = row[idx];
          });
          return obj;
        });
      
        return {
          headers: headers,
          rows: rows,
          mapped: mapped
        };
      } catch (error) {
        Logger.log("Erro em getDataMapped: " + error.message);
        throw error;
      }
    },
    
    /**
     * Invalida cache de uma sheet
     * @param {string} sheetName - Nome da aba
     * @param {string} [spreadsheetId] - ID da planilha
     */
    invalidate: function(sheetName, spreadsheetId) {
      var key = _getCacheKey(sheetName, spreadsheetId);
      if (_cache[key]) {
        delete _cache[key];
        _cacheStats.invalidations++;
        _log('INVALIDATE: ' + sheetName);
      }
    },
    
    /**
     * Invalida todo o cache
     */
    invalidateAll: function() {
      _cache = {};
      _cacheStats.invalidations++;
      _log('INVALIDATE ALL');
    },
    
    /**
     * Obtém estatísticas do cache
     * @returns {Object}
     */
    getStats: function() {
      try {
        var total = _cacheStats.hits + _cacheStats.misses;
        return {
          hits: _cacheStats.hits,
          misses: _cacheStats.misses,
          invalidations: _cacheStats.invalidations,
          hitRate: total > 0 ? Math.round(_cacheStats.hits / total * 100) : 0,
          cachedSheets: Object.keys(_cache).length
        };
      } catch (error) {
        Logger.log("Erro em getStats: " + error.message);
        throw error;
      }
    },
    
    /**
     * Reseta estatísticas
     */
    resetStats: function() {
      _cacheStats = { hits: 0, misses: 0, invalidations: 0 };
    },
    
    /**
     * Pré-carrega múltiplas sheets no cache
     * @param {string[]} sheetNames - Nomes das abas
     * @param {Object} [options] - Opções
     */
    preload: function(sheetNames, options) {
      try {
        var self = this;
        sheetNames.forEach(function(name) {
          self.getData(name, options);
        });
        _log('PRELOAD: ' + sheetNames.length + ' sheets');
      } catch (error) {
        Logger.log("Erro em preload: " + error.message);
        throw error;
      }
    },
    
    // Configuração
    CONFIG: CONFIG
  };
})();

// ============================================================================
// BATCH WRITER - Escrita em Lote
// ============================================================================

var BatchWriter = (function() {
  
  var _pendingWrites = {};
  var _flushTimeout = null;
  
  return {
    
    /**
     * Adiciona escrita ao lote
     * @param {string} sheetName - Nome da aba
     * @param {number} row - Linha (1-based)
     * @param {number} col - Coluna (1-based)
     * @param {*} value - Valor
     */
    setValue: function(sheetName, row, col, value) {
      try {
        if (!_pendingWrites[sheetName]) {
          _pendingWrites[sheetName] = [];
        }
      
        _pendingWrites[sheetName].push({
          row: row,
          col: col,
          value: value
        });
      } catch (error) {
        Logger.log("Erro em setValue: " + error.message);
        throw error;
      }
    },
    
    /**
     * Adiciona linha ao lote
     * @param {string} sheetName - Nome da aba
     * @param {Array} rowData - Dados da linha
     */
    appendRow: function(sheetName, rowData) {
      try {
        if (!_pendingWrites[sheetName]) {
          _pendingWrites[sheetName] = [];
        }
      
        _pendingWrites[sheetName].push({
          type: 'append',
          data: rowData
        });
      } catch (error) {
        Logger.log("Erro em appendRow: " + error.message);
        throw error;
      }
    },
    
    /**
     * Executa todas as escritas pendentes
     * @returns {Object} Resultado
     */
    flush: function() {
      try {
        var results = { success: true, written: 0, errors: [] };
        var ss = getSS();
      
        for (var sheetName in _pendingWrites) {
          try {
            var sheet = ss.getSheetByName(sheetName);
            if (!sheet) {
              results.errors.push('Sheet não encontrada: ' + sheetName);
              continue;
            }
          
            var writes = _pendingWrites[sheetName];
            var appends = [];
            var updates = [];
          
            // Separa appends de updates
            writes.forEach(function(w) {
              if (w.type === 'append') {
                appends.push(w.data);
              } else {
                updates.push(w);
              }
            });
          
            // Executa appends em batch
            if (appends.length > 0) {
              var lastRow = sheet.getLastRow();
              sheet.getRange(lastRow + 1, 1, appends.length, appends[0].length)
                .setValues(appends);
              results.written += appends.length;
            }
          
            // Executa updates
            updates.forEach(function(u) {
              sheet.getRange(u.row, u.col).setValue(u.value);
              results.written++;
            });
          
            // Invalida cache
            DataCache.invalidate(sheetName);
          
          } catch (e) {
            results.success = false;
            results.errors.push(sheetName + ': ' + e.message);
          }
        }
      
        // Limpa pendentes
        _pendingWrites = {};
      
        return results;
      } catch (error) {
        Logger.log("Erro em flush: " + error.message);
        throw error;
      }
    },
    
    /**
     * Obtém contagem de escritas pendentes
     * @returns {number}
     */
    getPendingCount: function() {
      var count = 0;
      for (var key in _pendingWrites) {
        count += _pendingWrites[key].length;
      }
      return count;
    },
    
    /**
     * Cancela escritas pendentes
     */
    cancel: function() {
      _pendingWrites = {};
    }
  };
})();

// ============================================================================
// QUERY HELPER - Consultas Otimizadas
// ============================================================================

var QueryHelper = (function() {
  
  return {
    
    /**
     * Busca registros por filtro
     * @param {string} sheetName - Nome da aba
     * @param {Object} filters - Filtros { campo: valor }
     * @param {Object} [options] - Opções
     * @returns {Array} Registros encontrados
     */
    find: function(sheetName, filters, options) {
      try {
        options = options || {};
        var data = DataCache.getDataMapped(sheetName, options);
      
        if (data.mapped.length === 0) return [];
      
        return data.mapped.filter(function(row) {
          for (var key in filters) {
            if (row[key] !== filters[key]) {
              return false;
            }
          }
          return true;
        });
      } catch (error) {
        Logger.log("Erro em find: " + error.message);
        throw error;
      }
    },
    
    /**
     * Busca primeiro registro por filtro
     * @param {string} sheetName - Nome da aba
     * @param {Object} filters - Filtros
     * @param {Object} [options] - Opções
     * @returns {Object|null}
     */
    findOne: function(sheetName, filters, options) {
      try {
        var results = this.find(sheetName, filters, options);
        return results.length > 0 ? results[0] : null;
      } catch (error) {
        Logger.log("Erro em findOne: " + error.message);
        throw error;
      }
    },
    
    /**
     * Conta registros por filtro
     * @param {string} sheetName - Nome da aba
     * @param {Object} [filters] - Filtros opcionais
     * @param {Object} [options] - Opções
     * @returns {number}
     */
    count: function(sheetName, filters, options) {
      try {
        if (!filters || Object.keys(filters).length === 0) {
          var data = DataCache.getData(sheetName, options);
          return Math.max(0, data.length - 1); // Exclui header
        }
        return this.find(sheetName, filters, options).length;
      } catch (error) {
        Logger.log("Erro em count: " + error.message);
        throw error;
      }
    },
    
    /**
     * Agrupa registros por campo
     * @param {string} sheetName - Nome da aba
     * @param {string} groupField - Campo para agrupar
     * @param {Object} [options] - Opções
     * @returns {Object} { valor: [registros] }
     */
    groupBy: function(sheetName, groupField, options) {
      try {
        var data = DataCache.getDataMapped(sheetName, options);
        var groups = {};
      
        data.mapped.forEach(function(row) {
          var key = row[groupField] || '_null_';
          if (!groups[key]) groups[key] = [];
          groups[key].push(row);
        });
      
        return groups;
      } catch (error) {
        Logger.log("Erro em groupBy: " + error.message);
        throw error;
      }
    },
    
    /**
     * Soma valores de um campo
     * @param {string} sheetName - Nome da aba
     * @param {string} sumField - Campo para somar
     * @param {Object} [filters] - Filtros opcionais
     * @param {Object} [options] - Opções
     * @returns {number}
     */
    sum: function(sheetName, sumField, filters, options) {
      try {
        var records = filters 
          ? this.find(sheetName, filters, options)
          : DataCache.getDataMapped(sheetName, options).mapped;
      
        return records.reduce(function(total, row) {
          var val = parseFloat(row[sumField]) || 0;
          return total + val;
        }, 0);
      } catch (error) {
        Logger.log("Erro em sum: " + error.message);
        throw error;
      }
    },
    
    /**
     * Obtém valores únicos de um campo
     * @param {string} sheetName - Nome da aba
     * @param {string} field - Campo
     * @param {Object} [options] - Opções
     * @returns {Array}
     */
    distinct: function(sheetName, field, options) {
      try {
        var data = DataCache.getDataMapped(sheetName, options);
        var values = {};
      
        data.mapped.forEach(function(row) {
          var val = row[field];
          if (val !== null && val !== undefined && val !== '') {
            values[val] = true;
          }
        });
      
        return Object.keys(values);
      } catch (error) {
        Logger.log("Erro em distinct: " + error.message);
        throw error;
      }
    }
  };
})();

// ============================================================================
// ALIASES GLOBAIS
// ============================================================================

/**
 * Obtém dados de sheet com cache (alias global)
 */
function getCachedData(sheetName, options) {
  return DataCache.getData(sheetName, options);
}

/**
 * Obtém dados mapeados com cache (alias global)
 */
function getCachedDataMapped(sheetName, options) {
  return DataCache.getDataMapped(sheetName, options);
}

/**
 * Invalida cache de uma sheet (alias global)
 */
function invalidateSheetCache(sheetName) {
  DataCache.invalidate(sheetName);
}

/**
 * Busca registros com cache (alias global)
 */
function findRecords(sheetName, filters, options) {
  try {
    return QueryHelper.find(sheetName, filters, options);
  } catch (error) {
    Logger.log("Erro em findRecords: " + error.message);
    throw error;
  }
}

/**
 * Conta registros com cache (alias global)
 */
function countRecords(sheetName, filters, options) {
  return QueryHelper.count(sheetName, filters, options);
}
