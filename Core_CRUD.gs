/**
 * @fileoverview Core CRUD - Sistema de Operações CRUD Unificado
 * @version 4.0.0
 * @author UNIAE CRE Team
 * @created 2025-12-18
 * 
 * @description
 * Sistema completo de operações CRUD com:
 * - Create, Read, Update, Delete
 * - Operações em lote (bulk)
 * - Cache integrado
 * - Feedback UX
 * - Paginação e filtros
 * 
 * @requires V8 Runtime
 * @requires Core_Cache, Core_Logger, Core_UX_Feedback
 */

'use strict';

// ============================================================================
// MÓDULO CRUD
// ============================================================================

/**
 * Sistema CRUD Unificado
 * @namespace CRUDService
 */
var CRUDService = (function() {
  
  // --------------------------------------------------------------------------
  // HELPERS PRIVADOS
  // --------------------------------------------------------------------------
  
  /**
   * Obtém spreadsheet ativa
   * @private
   * @returns {GoogleAppsScript.Spreadsheet.Spreadsheet}
   */
  function _getSpreadsheet() {
    try {
      if (typeof CacheManager !== 'undefined') {
        return CacheManager.Spreadsheet.get();
      }
      return getSS();
    } catch (error) {
      Logger.log("Erro em _getSpreadsheet: " + error.message);
      throw error;
    }
  }
  
  /**
   * Obtém sheet por nome
   * @private
   * @param {string} sheetName - Nome da aba
   * @returns {GoogleAppsScript.Spreadsheet.Sheet|null}
   */
  function _getSheet(sheetName) {
    try {
      if (typeof CacheManager !== 'undefined') {
        return CacheManager.Sheet.get(sheetName);
      }
      return _getSpreadsheet().getSheetByName(sheetName);
    } catch (error) {
      Logger.log("Erro em _getSheet: " + error.message);
      throw error;
    }
  }
  
  /**
   * Obtém headers de uma sheet
   * @private
   * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - Sheet
   * @returns {Array<string>}
   */
  function _getHeaders(sheet) {
    try {
      try {
        if (sheet.getLastColumn() === 0) return [];
        return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      } catch (error) {
        Logger.log("Erro em _getHeaders: " + error.message);
        throw error;
      }
    } catch (error) {
      Logger.log("Erro em _getHeaders: " + error.message);
      throw error;
    }
  }
  
  /**
   * Converte linha para objeto
   * @private
   * @param {Array} headers - Cabeçalhos
   * @param {Array} row - Valores da linha
   * @returns {Object}
   */
  function _rowToObject(headers, row) {
    var obj = {};
    for (var i = 0; i < headers.length; i++) {
      obj[headers[i]] = row[i];
    }
    return obj;
  }
  
  /**
   * Converte objeto para linha
   * @private
   * @param {Array} headers - Cabeçalhos
   * @param {Object} data - Dados
   * @returns {Array}
   */
  function _objectToRow(headers, data) {
    try {
      return headers.map(function(header) {
        return data[header] !== undefined ? data[header] : '';
      });
    } catch (error) {
      Logger.log("Erro em _objectToRow: " + error.message);
      throw error;
    }
  }
  
  /**
   * Invalida cache da sheet
   * @private
   * @param {string} sheetName - Nome da aba
   */
  function _invalidateCache(sheetName) {
    try {
      if (typeof CacheManager !== 'undefined') {
        CacheManager.Management.clearSheet(sheetName);
      }
      CacheService.getScriptCache().remove(sheetName + '_all');
    } catch (e) {
      // Ignora erro de cache
    }
  }
  
  /**
   * Formata nova linha
   * @private
   * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - Sheet
   * @param {number} row - Número da linha
   */
  function _formatNewRow(sheet, row) {
    try {
      try {
        var range = sheet.getRange(row, 1, 1, sheet.getLastColumn());
        range.setFontSize(10);
        range.setBorder(true, true, true, true, false, false);
      
        if (row % 2 === 0) {
          range.setBackground('#f8f9fa');
        }
      } catch (e) {
        // Ignora erro de formatação
      }
    } catch (error) {
      Logger.log("Erro em _formatNewRow: " + error.message);
      throw error;
    }
  }
  
  /**
   * Log de operação
   * @private
   * @param {string} operation - Operação
   * @param {string} sheetName - Nome da aba
   * @param {*} details - Detalhes
   */
  function _log(operation, sheetName, details) {
    try {
      try {
        if (typeof AppLogger !== 'undefined') {
          AppLogger.info(operation + ' em ' + sheetName, details);
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
  
  // --------------------------------------------------------------------------
  // OPERAÇÕES CRUD
  // --------------------------------------------------------------------------
  
  var Operations = {
    
    /**
     * Cria novo registro
     * @param {string} sheetName - Nome da planilha
     * @param {Object} data - Dados do registro
     * @param {Object} [options] - Opções
     * @returns {Object} Resultado
     */
    create: function(sheetName, data, options) {
      try {
        options = options || {};
      
        try {
          if (!data || typeof data !== 'object') {
            throw new Error('Dados inválidos para criação');
          }
        
          var sheet = _getSheet(sheetName);
          if (!sheet) {
            throw new Error('Planilha "' + sheetName + '" não encontrada');
          }
        
          var headers = _getHeaders(sheet);
          if (headers.length === 0) {
            throw new Error('Planilha sem cabeçalhos');
          }
        
          var values = _objectToRow(headers, data);
        
          // Adiciona timestamps se existirem colunas
          var now = new Date();
          var criadoIdx = headers.indexOf('dataCriacao');
          var atualizadoIdx = headers.indexOf('dataAtualizacao');
        
          if (criadoIdx !== -1) values[criadoIdx] = now;
          if (atualizadoIdx !== -1) values[atualizadoIdx] = now;
        
          var nextRow = sheet.getLastRow() + 1;
          sheet.getRange(nextRow, 1, 1, values.length).setValues([values]);
        
          _formatNewRow(sheet, nextRow);
          _invalidateCache(sheetName);
          _log('CREATE', sheetName, { row: nextRow });
        
          return {
            success: true,
            id: nextRow,
            data: _rowToObject(headers, values),
            message: 'Registro criado com sucesso'
          };
        
        } catch (error) {
          if (typeof AppLogger !== 'undefined') {
            AppLogger.error('Erro ao criar registro em ' + sheetName, error);
          }
          return { success: false, error: error.message };
        }
      } catch (error) {
        Logger.log("Erro em create: " + error.message);
        throw error;
      }
    },
    
    /**
     * Lê registros com filtros e paginação
     * @param {string} sheetName - Nome da planilha
     * @param {Object} [options] - Opções de leitura
     * @returns {Object} Resultado com dados
     */
    read: function(sheetName, options) {
      try {
        options = options || {};
      
        try {
          var filters = options.filters || {};
          var limit = options.limit || 100;
          var offset = options.offset || 0;
          var orderBy = options.orderBy || null;
          var useCache = options.cache !== false;
        
          // Tenta cache
          if (useCache) {
            var cacheKey = sheetName + '_' + JSON.stringify(options);
            try {
              var cached = CacheService.getScriptCache().get(cacheKey);
              if (cached) {
                return JSON.parse(cached);
              }
            } catch (e) {
              // Ignora erro de cache
            }
          }
        
          var sheet = _getSheet(sheetName);
          if (!sheet) {
            throw new Error('Planilha "' + sheetName + '" não encontrada');
          }
        
          var lastRow = sheet.getLastRow();
          if (lastRow < 2) {
            return { success: true, data: [], total: 0 };
          }
        
          var headers = _getHeaders(sheet);
          var dataRange = sheet.getRange(2, 1, lastRow - 1, headers.length);
          var values = dataRange.getValues();
        
          // Converte para objetos
          var records = values.map(function(row, index) {
            var obj = _rowToObject(headers, row);
            obj._rowIndex = index + 2;
            return obj;
          });
        
          // Aplica filtros
          if (Object.keys(filters).length > 0) {
            records = records.filter(function(record) {
              return Object.keys(filters).every(function(key) {
                var filterValue = filters[key];
                var recordValue = record[key];
              
                if (typeof filterValue === 'function') {
                  return filterValue(recordValue);
                }
                return recordValue === filterValue;
              });
            });
          }
        
          // Ordena
          if (orderBy) {
            records.sort(function(a, b) {
              var aVal = a[orderBy.field];
              var bVal = b[orderBy.field];
              var direction = orderBy.direction === 'desc' ? -1 : 1;
            
              if (aVal < bVal) return -1 * direction;
              if (aVal > bVal) return 1 * direction;
              return 0;
            });
          }
        
          var total = records.length;
          var paginatedRecords = records.slice(offset, offset + limit);
        
          var result = {
            success: true,
            data: paginatedRecords,
            total: total,
            limit: limit,
            offset: offset,
            hasMore: offset + limit < total
          };
        
          // Salva no cache
          if (useCache) {
            try {
              CacheService.getScriptCache().put(cacheKey, JSON.stringify(result), 300);
            } catch (e) {
              // Ignora erro de cache
            }
          }
        
          return result;
        
        } catch (error) {
          if (typeof AppLogger !== 'undefined') {
            AppLogger.error('Erro ao ler registros de ' + sheetName, error);
          }
          return { success: false, error: error.message };
        }
      } catch (error) {
        Logger.log("Erro em read: " + error.message);
        throw error;
      }
    },
    
    /**
     * Atualiza registro existente
     * @param {string} sheetName - Nome da planilha
     * @param {number} rowIndex - Índice da linha
     * @param {Object} data - Dados a atualizar
     * @param {Object} [options] - Opções
     * @returns {Object} Resultado
     */
    update: function(sheetName, rowIndex, data, options) {
      try {
        options = options || {};
      
        try {
          if (!data || typeof data !== 'object') {
            throw new Error('Dados inválidos para atualização');
          }
        
          var sheet = _getSheet(sheetName);
          if (!sheet) {
            throw new Error('Planilha "' + sheetName + '" não encontrada');
          }
        
          if (rowIndex < 2 || rowIndex > sheet.getLastRow()) {
            throw new Error('Índice de linha inválido: ' + rowIndex);
          }
        
          var headers = _getHeaders(sheet);
        
          // Atualiza campos
          var keys = Object.keys(data);
          for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var colIndex = headers.indexOf(key);
            if (colIndex !== -1) {
              sheet.getRange(rowIndex, colIndex + 1).setValue(data[key]);
            }
          }
        
          // Atualiza timestamp
          var updateCol = headers.indexOf('dataAtualizacao');
          if (updateCol !== -1) {
            sheet.getRange(rowIndex, updateCol + 1).setValue(new Date());
          }
        
          _invalidateCache(sheetName);
          _log('UPDATE', sheetName, { row: rowIndex, fields: keys });
        
          return {
            success: true,
            id: rowIndex,
            message: 'Registro atualizado com sucesso'
          };
        
        } catch (error) {
          if (typeof AppLogger !== 'undefined') {
            AppLogger.error('Erro ao atualizar registro em ' + sheetName, error);
          }
          return { success: false, error: error.message };
        }
      } catch (error) {
        Logger.log("Erro em update: " + error.message);
        throw error;
      }
    },
    
    /**
     * Deleta registro
     * @param {string} sheetName - Nome da planilha
     * @param {number} rowIndex - Índice da linha
     * @param {boolean} [hard=false] - Deleção permanente
     * @param {Object} [options] - Opções
     * @returns {Object} Resultado
     */
    delete: function(sheetName, rowIndex, hard, options) {
      options = options || {};
      
      try {
        var sheet = _getSheet(sheetName);
        if (!sheet) {
          throw new Error('Planilha "' + sheetName + '" não encontrada');
        }
        
        if (rowIndex < 2 || rowIndex > sheet.getLastRow()) {
          throw new Error('Índice de linha inválido: ' + rowIndex);
        }
        
        if (hard) {
          sheet.deleteRow(rowIndex);
        } else {
          // Soft delete
          var headers = _getHeaders(sheet);
          var deleteCol = headers.indexOf('deletado');
          
          if (deleteCol !== -1) {
            sheet.getRange(rowIndex, deleteCol + 1).setValue(true);
            sheet.getRange(rowIndex, 1, 1, sheet.getLastColumn()).setBackground('#ffcccc');
          } else {
            // Se não tem coluna deletado, faz hard delete
            sheet.deleteRow(rowIndex);
          }
        }
        
        _invalidateCache(sheetName);
        _log('DELETE', sheetName, { row: rowIndex, hard: hard });
        
        return {
          success: true,
          message: 'Registro deletado com sucesso'
        };
        
      } catch (error) {
        if (typeof AppLogger !== 'undefined') {
          AppLogger.error('Erro ao deletar registro em ' + sheetName, error);
        }
        return { success: false, error: error.message };
      }
    }
  };
  
  // --------------------------------------------------------------------------
  // OPERAÇÕES DE BUSCA
  // --------------------------------------------------------------------------
  
  var Queries = {
    
    /**
     * Busca registro por ID (rowIndex)
     * @param {string} sheetName - Nome da planilha
     * @param {number} id - ID do registro
     * @returns {Object} Resultado
     */
    findById: function(sheetName, id) {
      var result = Operations.read(sheetName, {
        filters: { _rowIndex: id },
        limit: 1
      });
      
      if (result.success && result.data.length > 0) {
        return { success: true, data: result.data[0] };
      }
      return { success: false, data: null };
    },
    
    /**
     * Busca um único registro
     * @param {string} sheetName - Nome da planilha
     * @param {Object} filters - Filtros
     * @returns {Object} Resultado
     */
    findOne: function(sheetName, filters) {
      var result = Operations.read(sheetName, {
        filters: filters,
        limit: 1
      });
      
      if (result.success && result.data.length > 0) {
        return { success: true, data: result.data[0] };
      }
      return { success: false, data: null };
    },
    
    /**
     * Conta registros
     * @param {string} sheetName - Nome da planilha
     * @param {Object} [filters] - Filtros
     * @returns {Object} Resultado com count
     */
    count: function(sheetName, filters) {
      var result = Operations.read(sheetName, {
        filters: filters || {},
        limit: 10000
      });
      
      return {
        success: result.success,
        count: result.total || 0
      };
    }
  };
  
  // --------------------------------------------------------------------------
  // OPERAÇÕES EM LOTE
  // --------------------------------------------------------------------------
  
  var Bulk = {
    
    /**
     * Importa múltiplos registros
     * @param {string} sheetName - Nome da planilha
     * @param {Array<Object>} records - Registros
     * @param {Object} [options] - Opções
     * @returns {Object} Resultado
     */
    import: function(sheetName, records, options) {
      options = options || {};
      
      if (!Array.isArray(records) || records.length === 0) {
        return { success: false, error: 'Nenhum registro para importar' };
      }
      
      var succeeded = 0;
      var failed = 0;
      var errors = [];
      
      for (var i = 0; i < records.length; i++) {
        try {
          // Validação customizada
          if (options.validator && !options.validator(records[i])) {
            throw new Error('Validação falhou');
          }
          
          var result = Operations.create(sheetName, records[i], { silent: true });
          
          if (result.success) {
            succeeded++;
          } else {
            throw new Error(result.error);
          }
        } catch (e) {
          failed++;
          errors.push({ index: i, error: e.message });
          
          if (options.stopOnError) break;
        }
        
        // Atualiza progresso
        if (typeof UXFeedback !== 'undefined' && !options.silent) {
          UXFeedback.updateProgress(
            'Importando...',
            Math.round(((i + 1) / records.length) * 100)
          );
        }
      }
      
      return {
        success: failed === 0,
        total: records.length,
        succeeded: succeeded,
        failed: failed,
        errors: errors.length > 0 ? errors : undefined
      };
    },
    
    /**
     * Atualiza múltiplos registros
     * @param {string} sheetName - Nome da planilha
     * @param {Array<Object>} updates - Array de {rowIndex, data}
     * @param {Object} [options] - Opções
     * @returns {Object} Resultado
     */
    update: function(sheetName, updates, options) {
      options = options || {};
      
      if (!Array.isArray(updates) || updates.length === 0) {
        return { success: false, error: 'Nenhuma atualização para processar' };
      }
      
      var succeeded = 0;
      var failed = 0;
      
      for (var i = 0; i < updates.length; i++) {
        try {
          if (!updates[i].rowIndex || !updates[i].data) {
            throw new Error('rowIndex e data são obrigatórios');
          }
          
          var result = Operations.update(sheetName, updates[i].rowIndex, updates[i].data, { silent: true });
          
          if (result.success) {
            succeeded++;
          } else {
            throw new Error(result.error);
          }
        } catch (e) {
          failed++;
          if (options.stopOnError) break;
        }
      }
      
      return {
        success: failed === 0,
        total: updates.length,
        succeeded: succeeded,
        failed: failed
      };
    },
    
    /**
     * Deleta múltiplos registros
     * @param {string} sheetName - Nome da planilha
     * @param {Array<number>} rowIndexes - Índices das linhas
     * @param {boolean} [hard=false] - Deleção permanente
     * @returns {Object} Resultado
     */
    delete: function(sheetName, rowIndexes, hard) {
      try {
        if (!Array.isArray(rowIndexes) || rowIndexes.length === 0) {
          return { success: false, error: 'Nenhum registro para deletar' };
        }
      
        // Ordena em ordem decrescente para não afetar índices
        var sorted = rowIndexes.slice().sort(function(a, b) { return b - a; });
      
        var succeeded = 0;
        var failed = 0;
      
        for (var i = 0; i < sorted.length; i++) {
          var result = Operations.delete(sheetName, sorted[i], hard, { silent: true });
        
          if (result.success) {
            succeeded++;
          } else {
            failed++;
          }
        }
      
        return {
          success: failed === 0,
          total: rowIndexes.length,
          succeeded: succeeded,
          failed: failed
        };
      } catch (error) {
        Logger.log("Erro em delete: " + error.message);
        throw error;
      }
    }
  };
  
  // --------------------------------------------------------------------------
  // API PÚBLICA
  // --------------------------------------------------------------------------
  
  return {
    /**
     * Cria registro
     */
    create: function(sheetName, data, options) {
      return Operations.create(sheetName, data, options);
    },
    
    /**
     * Lê registros
     */
    read: function(sheetName, options) {
      return Operations.read(sheetName, options);
    },
    
    /**
     * Atualiza registro
     */
    update: function(sheetName, rowIndex, data, options) {
      return Operations.update(sheetName, rowIndex, data, options);
    },
    
    /**
     * Deleta registro
     */
    delete: function(sheetName, rowIndex, hard, options) {
      return Operations.delete(sheetName, rowIndex, hard, options);
    },
    
    /**
     * Busca por ID
     */
    findById: function(sheetName, id) {
      return Queries.findById(sheetName, id);
    },
    
    /**
     * Busca um registro
     */
    findOne: function(sheetName, filters) {
      return Queries.findOne(sheetName, filters);
    },
    
    /**
     * Conta registros
     */
    count: function(sheetName, filters) {
      return Queries.count(sheetName, filters);
    },
    
    /**
     * Importação em lote
     */
    bulkImport: function(sheetName, records, options) {
      return Bulk.import(sheetName, records, options);
    },
    
    /**
     * Atualização em lote
     */
    bulkUpdate: function(sheetName, updates, options) {
      return Bulk.update(sheetName, updates, options);
    },
    
    /**
     * Deleção em lote
     */
    bulkDelete: function(sheetName, rowIndexes, hard) {
      return Bulk.delete(sheetName, rowIndexes, hard);
    }
  };
})();

// ============================================================================
// ALIAS GLOBAL PARA COMPATIBILIDADE
// ============================================================================

var CRUD = CRUDService;

// ============================================================================
// REGISTRO DO MÓDULO
// ============================================================================

Logger.log('✅ Core_CRUD carregado - CRUDService disponível');
