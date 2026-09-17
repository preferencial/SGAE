/**
 * @fileoverview Sistema CRUD Aprimorado com validação, logging e respostas padronizadas
 * @version 2.0.0
 * @description Operações CRUD seguindo melhores práticas identificadas nos relatórios
 */

'use strict';

/**
 * Sistema CRUD Aprimorado
 * @namespace CRUDEnhanced
 */
var CRUDEnhanced = (function() {
  
  /**
   * Configurações padrão
   */
  var CONFIG = {
    DEFAULT_PAGE_SIZE: 50,
    MAX_PAGE_SIZE: 500,
    CACHE_TTL: 300, // 5 minutos
    ENABLE_AUDIT: true
  };
  
  /**
   * Obtém uma planilha de forma segura
   * @private
   * @param {string} sheetName - Nome da planilha
   * @returns {GoogleAppsScript.Spreadsheet.Sheet|null}
   */
  function getSheetSafe_(sheetName) {
    try {
      var ss = getSS();
      return ss.getSheetByName(sheetName);
    } catch (e) {
      console.error('Erro ao obter planilha ' + sheetName + ': ' + e.message);
      return null;
    }
  }
  
  /**
   * Obtém headers de uma planilha
   * @private
   * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
   * @returns {Array<string>}
   */
  function getHeaders_(sheet) {
    try {
      if (!sheet || sheet.getLastColumn() === 0) return [];
      return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    } catch (e) {
      return [];
    }
  }
  
  /**
   * Converte linha em objeto
   * @private
   */
  function rowToObject_(headers, row) {
    try {
      var obj = {};
      headers.forEach(function(header, index) {
        obj[header] = row[index];
      });
      return obj;
    } catch (error) {
      Logger.log("Erro em rowToObject_: " + error.message);
      throw error;
    }
  }
  
  /**
   * Converte objeto em linha
   * @private
   */
  function objectToRow_(headers, obj) {
    return headers.map(function(header) {
      return obj[header] !== undefined ? obj[header] : '';
    });
  }
  
  /**
   * Registra operação de auditoria
   * @private
   */
  function audit_(operation, sheetName, details) {
    if (!CONFIG.ENABLE_AUDIT) return;
    
    try {
      var logEntry = {
        timestamp: new Date().toISOString(),
        operation: operation,
        entity: sheetName,
        user: Session.getActiveUser().getEmail() || 'anonymous',
        details: details
      };
      
      Logger.log('[AUDIT] ' + JSON.stringify(logEntry));
      
      // Tenta usar logger do sistema se disponível
      if (typeof AppLogger !== 'undefined' && AppLogger.log) {
        AppLogger.log(operation + ' em ' + sheetName, logEntry);
      }
    } catch (e) {
      // Falha silenciosa na auditoria
    }
  }
  
  /**
   * Invalida cache relacionado
   * @private
   */
  function invalidateCache_(sheetName) {
    try {
      try {
        var cache = CacheService.getScriptCache();
        cache.remove(sheetName + '_all');
        cache.remove(sheetName + '_count');
      } catch (e) {
        // Ignora erro de cache
      }
    } catch (error) {
      Logger.log("Erro em invalidateCache_: " + error.message);
      throw error;
    }
  }
  
  // ============================================================================
  // OPERAÇÕES CRUD
  // ============================================================================
  
  /**
   * Cria um novo registro
   * @param {string} sheetName - Nome da planilha
   * @param {Object} data - Dados do registro
   * @param {Object} [options] - Opções adicionais
   * @param {Function} [options.validator] - Função de validação customizada
   * @param {boolean} [options.skipValidation] - Pular validação
   * @returns {Object} Resposta padronizada
   */
  function create(sheetName, data, options) {
    try {
      try {
        try {
          try {
            options = options || {};
      
            // Validação de entrada
            if (!sheetName || typeof sheetName !== 'string') {
              return StandardResponse.error('Nome da planilha é obrigatório', 'INVALID_SHEET_NAME');
            }
      
            if (!data || typeof data !== 'object') {
              return StandardResponse.error('Dados são obrigatórios', 'INVALID_DATA');
            }
      
            // Validação customizada
            if (!options.skipValidation && options.validator) {
              var validation = options.validator(data);
              if (!validation.valid) {
                return StandardResponse.validationError(validation.errors);
              }
            }
      
            // Validação padrão por entidade
            if (!options.skipValidation && Validator.validators[sheetName.toLowerCase()]) {
              var entityValidation = Validator.validators[sheetName.toLowerCase()](data);
              if (!entityValidation.valid) {
                return StandardResponse.validationError(entityValidation.errors);
              }
            }
      
            var sheet = getSheetSafe_(sheetName);
            if (!sheet) {
              return StandardResponse.error('Planilha "' + sheetName + '" não encontrada', 'SHEET_NOT_FOUND');
            }
      
            var headers = getHeaders_(sheet);
            if (headers.length === 0) {
              return StandardResponse.error('Planilha sem cabeçalhos definidos', 'NO_HEADERS');
            }
      
            // Adiciona metadados
            var now = new Date();
            data.dataCriacao = data.dataCriacao || now;
            data.dataAtualizacao = now;
      
            // Gera ID se não existir
            if (!data.id && headers.indexOf('id') !== -1) {
              data.id = Utilities.getUuid();
            }
      
            var row = objectToRow_(headers, data);
            var nextRow = sheet.getLastRow() + 1;
      
            sheet.getRange(nextRow, 1, 1, row.length).setValues([row]);
      
            // Pós-processamento
            invalidateCache_(sheetName);
            audit_('CREATE', sheetName, { rowIndex: nextRow, id: data.id });
      
            return StandardResponse.crud('CREATE', {
              id: data.id || nextRow,
              rowIndex: nextRow,
              data: data
            }, sheetName);
      
          } catch (e) {
            console.error('Erro em create: ' + e.message);
            return StandardResponse.error(e.message, 'CREATE_ERROR');
          }
        } catch (error) {
          Logger.log("Erro em create: " + error.message);
          throw error; // Re-lança para tratamento superior
        }
      } catch (error) {
        Logger.log("Erro em create: " + error.message);
        throw error;
      }
    } catch (error) {
      Logger.log("Erro em create: " + error.message);
      throw error;
    }
  }
  
  /**
   * Lê registros com filtros e paginação
   * @param {string} sheetName - Nome da planilha
   * @param {Object} [options] - Opções de leitura
   * @param {Object} [options.filters] - Filtros a aplicar
   * @param {number} [options.page] - Página (começa em 1)
   * @param {number} [options.pageSize] - Tamanho da página
   * @param {string} [options.orderBy] - Campo para ordenação
   * @param {string} [options.orderDir] - Direção (asc/desc)
   * @param {boolean} [options.useCache] - Usar cache
   * @returns {Object} Resposta padronizada com dados
   */
  function read(sheetName, options) {
    try {
      try {
        try {
          options = options || {};
      
          if (!sheetName || typeof sheetName !== 'string') {
            return StandardResponse.error('Nome da planilha é obrigatório', 'INVALID_SHEET_NAME');
          }
      
          var page = Math.max(1, options.page || 1);
          var pageSize = Math.min(CONFIG.MAX_PAGE_SIZE, options.pageSize || CONFIG.DEFAULT_PAGE_SIZE);
          var filters = options.filters || {};
          var useCache = options.useCache !== false;
      
          // Tenta cache
          var cacheKey = sheetName + '_' + JSON.stringify(options);
          if (useCache) {
            try {
              var cached = CacheService.getScriptCache().get(cacheKey);
              if (cached) {
                return JSON.parse(cached);
              }
            } catch (e) {
              // Ignora erro de cache
            }
          }
      
          var sheet = getSheetSafe_(sheetName);
          if (!sheet) {
            return StandardResponse.error('Planilha "' + sheetName + '" não encontrada', 'SHEET_NOT_FOUND');
          }
      
          var lastRow = sheet.getLastRow();
          if (lastRow < 2) {
            return StandardResponse.paginated([], 0, page, pageSize);
          }
      
          var headers = getHeaders_(sheet);
          var dataRange = sheet.getRange(2, 1, lastRow - 1, headers.length);
          var values = dataRange.getValues();
      
          // Converte para objetos
          var records = values.map(function(row, index) {
            var obj = rowToObject_(headers, row);
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
                if (filterValue instanceof RegExp) {
                  return filterValue.test(String(recordValue));
                }
                return String(recordValue).toLowerCase().indexOf(String(filterValue).toLowerCase()) !== -1;
              });
            });
          }
      
          // Ordenação
          if (options.orderBy && headers.indexOf(options.orderBy) !== -1) {
            var dir = options.orderDir === 'desc' ? -1 : 1;
            records.sort(function(a, b) {
              var aVal = a[options.orderBy];
              var bVal = b[options.orderBy];
              if (aVal < bVal) return -1 * dir;
              if (aVal > bVal) return 1 * dir;
              return 0;
            });
          }
      
          // Paginação
          var total = records.length;
          var offset = (page - 1) * pageSize;
          var paginatedRecords = records.slice(offset, offset + pageSize);
      
          var result = StandardResponse.paginated(paginatedRecords, total, page, pageSize);
      
          // Salva no cache
          if (useCache) {
            try {
              CacheService.getScriptCache().put(cacheKey, JSON.stringify(result), CONFIG.CACHE_TTL);
            } catch (e) {
              // Ignora erro de cache
            }
          }
      
          return result;
      
        } catch (e) {
          console.error('Erro em read: ' + e.message);
          return StandardResponse.error(e.message, 'READ_ERROR');
        }
      } catch (error) {
        Logger.log("Erro em read: " + error.message);
        throw error;
      }
    } catch (error) {
      Logger.log("Erro em read: " + error.message);
      throw error;
    }
  }

  
  /**
   * Busca um registro por ID
   * @param {string} sheetName - Nome da planilha
   * @param {string|number} id - ID do registro
   * @param {string} [idField] - Nome do campo ID (padrão: 'id')
   * @returns {Object} Resposta padronizada
   */
  function findById(sheetName, id, idField) {
    try {
      try {
        if (!sheetName || !id) {
          return StandardResponse.error('Planilha e ID são obrigatórios', 'INVALID_PARAMS');
        }
      
        idField = idField || 'id';
      
        var filters = {};
        filters[idField] = function(val) {
          return String(val) === String(id);
        };
      
        var result = read(sheetName, { filters: filters, pageSize: 1 });
      
        if (result.success && result.data && result.data.length > 0) {
          return StandardResponse.success(result.data[0]);
        }
      
        return StandardResponse.error('Registro não encontrado', 'NOT_FOUND');
      
      } catch (e) {
        console.error('Erro em findById: ' + e.message);
        return StandardResponse.error(e.message, 'FIND_ERROR');
      }
    } catch (error) {
      Logger.log("Erro em findById: " + error.message);
      throw error;
    }
  }
  
  /**
   * Atualiza um registro existente
   * @param {string} sheetName - Nome da planilha
   * @param {number} rowIndex - Índice da linha (2+)
   * @param {Object} data - Dados a atualizar
   * @param {Object} [options] - Opções adicionais
   * @returns {Object} Resposta padronizada
   */
  function update(sheetName, rowIndex, data, options) {
    try {
      try {
        try {
          try {
            options = options || {};
      
            if (!sheetName || typeof sheetName !== 'string') {
              return StandardResponse.error('Nome da planilha é obrigatório', 'INVALID_SHEET_NAME');
            }
      
            if (!rowIndex || rowIndex < 2) {
              return StandardResponse.error('Índice de linha inválido', 'INVALID_ROW_INDEX');
            }
      
            if (!data || typeof data !== 'object') {
              return StandardResponse.error('Dados são obrigatórios', 'INVALID_DATA');
            }
      
            // Validação customizada
            if (!options.skipValidation && options.validator) {
              var validation = options.validator(data);
              if (!validation.valid) {
                return StandardResponse.validationError(validation.errors);
              }
            }
      
            var sheet = getSheetSafe_(sheetName);
            if (!sheet) {
              return StandardResponse.error('Planilha "' + sheetName + '" não encontrada', 'SHEET_NOT_FOUND');
            }
      
            if (rowIndex > sheet.getLastRow()) {
              return StandardResponse.error('Registro não encontrado', 'NOT_FOUND');
            }
      
            var headers = getHeaders_(sheet);
      
            // Atualiza apenas os campos fornecidos
            Object.keys(data).forEach(function(key) {
              var colIndex = headers.indexOf(key);
              if (colIndex !== -1) {
                sheet.getRange(rowIndex, colIndex + 1).setValue(data[key]);
              }
            });
      
            // Atualiza timestamp
            var updateCol = headers.indexOf('dataAtualizacao');
            if (updateCol !== -1) {
              sheet.getRange(rowIndex, updateCol + 1).setValue(new Date());
            }
      
            // Pós-processamento
            invalidateCache_(sheetName);
            audit_('UPDATE', sheetName, { rowIndex: rowIndex, fields: Object.keys(data) });
      
            return StandardResponse.crud('UPDATE', {
              rowIndex: rowIndex,
              updatedFields: Object.keys(data)
            }, sheetName);
      
          } catch (e) {
            console.error('Erro em update: ' + e.message);
            return StandardResponse.error(e.message, 'UPDATE_ERROR');
          }
        } catch (error) {
          Logger.log("Erro em update: " + error.message);
          throw error; // Re-lança para tratamento superior
        }
      } catch (error) {
        Logger.log("Erro em update: " + error.message);
        throw error;
      }
    } catch (error) {
      Logger.log("Erro em update: " + error.message);
      throw error;
    }
  }
  
  /**
   * Remove um registro (soft ou hard delete)
   * @param {string} sheetName - Nome da planilha
   * @param {number} rowIndex - Índice da linha
   * @param {Object} [options] - Opções
   * @param {boolean} [options.hard] - Se true, remove fisicamente a linha
   * @returns {Object} Resposta padronizada
   */
  function remove(sheetName, rowIndex, options) {
    try {
      try {
        try {
          try {
            options = options || {};
      
            if (!sheetName || typeof sheetName !== 'string') {
              return StandardResponse.error('Nome da planilha é obrigatório', 'INVALID_SHEET_NAME');
            }
      
            if (!rowIndex || rowIndex < 2) {
              return StandardResponse.error('Índice de linha inválido', 'INVALID_ROW_INDEX');
            }
      
            var sheet = getSheetSafe_(sheetName);
            if (!sheet) {
              return StandardResponse.error('Planilha "' + sheetName + '" não encontrada', 'SHEET_NOT_FOUND');
            }
      
            if (rowIndex > sheet.getLastRow()) {
              return StandardResponse.error('Registro não encontrado', 'NOT_FOUND');
            }
      
            if (options.hard) {
              // Hard delete - remove a linha
              sheet.deleteRow(rowIndex);
            } else {
              // Soft delete - marca como deletado
              var headers = getHeaders_(sheet);
              var deleteCol = headers.indexOf('deletado');
              var deleteAtCol = headers.indexOf('deletadoEm');
        
              if (deleteCol !== -1) {
                sheet.getRange(rowIndex, deleteCol + 1).setValue(true);
              }
              if (deleteAtCol !== -1) {
                sheet.getRange(rowIndex, deleteAtCol + 1).setValue(new Date());
              }
        
              // Marca visualmente
              sheet.getRange(rowIndex, 1, 1, sheet.getLastColumn()).setBackground('#ffcccc');
            }
      
            // Pós-processamento
            invalidateCache_(sheetName);
            audit_('DELETE', sheetName, { rowIndex: rowIndex, hard: !!options.hard });
      
            return StandardResponse.crud('DELETE', { rowIndex: rowIndex }, sheetName);
      
          } catch (e) {
            console.error('Erro em remove: ' + e.message);
            return StandardResponse.error(e.message, 'DELETE_ERROR');
          }
        } catch (error) {
          Logger.log("Erro em remove: " + error.message);
          throw error; // Re-lança para tratamento superior
        }
      } catch (error) {
        Logger.log("Erro em remove: " + error.message);
        throw error;
      }
    } catch (error) {
      Logger.log("Erro em remove: " + error.message);
      throw error;
    }
  }
  
  /**
   * Conta registros com filtros opcionais
   * @param {string} sheetName - Nome da planilha
   * @param {Object} [filters] - Filtros a aplicar
   * @returns {Object} Resposta padronizada com contagem
   */
  function count(sheetName, filters) {
    try {
      if (!sheetName) {
        return StandardResponse.error('Nome da planilha é obrigatório', 'INVALID_SHEET_NAME');
      }
      
      var result = read(sheetName, { filters: filters, pageSize: 1 });
      
      if (result.success) {
        return StandardResponse.success({
          count: result.meta.pagination.total
        });
      }
      
      return result;
      
    } catch (e) {
      console.error('Erro em count: ' + e.message);
      return StandardResponse.error(e.message, 'COUNT_ERROR');
    }
  }
  
  /**
   * Operação em lote - cria múltiplos registros
   * @param {string} sheetName - Nome da planilha
   * @param {Array<Object>} records - Lista de registros
   * @param {Object} [options] - Opções
   * @returns {Object} Resposta padronizada
   */
  function bulkCreate(sheetName, records, options) {
    try {
      try {
        try {
          try {
            options = options || {};
      
            if (!sheetName || !Array.isArray(records) || records.length === 0) {
              return StandardResponse.error('Planilha e registros são obrigatórios', 'INVALID_PARAMS');
            }
      
            var sheet = getSheetSafe_(sheetName);
            if (!sheet) {
              return StandardResponse.error('Planilha não encontrada', 'SHEET_NOT_FOUND');
            }
      
            var headers = getHeaders_(sheet);
            var now = new Date();
      
            // Prepara todas as linhas
            var rows = records.map(function(record) {
              record.dataCriacao = record.dataCriacao || now;
              record.dataAtualizacao = now;
              if (!record.id && headers.indexOf('id') !== -1) {
                record.id = Utilities.getUuid();
              }
              return objectToRow_(headers, record);
            });
      
            // Insere em lote
            var startRow = sheet.getLastRow() + 1;
            sheet.getRange(startRow, 1, rows.length, headers.length).setValues(rows);
      
            invalidateCache_(sheetName);
            audit_('BULK_CREATE', sheetName, { count: records.length });
      
            return StandardResponse.success({
              created: records.length,
              startRow: startRow,
              endRow: startRow + records.length - 1
            }, records.length + ' registros criados com sucesso');
      
          } catch (e) {
            console.error('Erro em bulkCreate: ' + e.message);
            return StandardResponse.error(e.message, 'BULK_CREATE_ERROR');
          }
        } catch (error) {
          Logger.log("Erro em bulkCreate: " + error.message);
          throw error; // Re-lança para tratamento superior
        }
      } catch (error) {
        Logger.log("Erro em bulkCreate: " + error.message);
        throw error;
      }
    } catch (error) {
      Logger.log("Erro em bulkCreate: " + error.message);
      throw error;
    }
  }
  
  /**
   * Exporta dados para JSON
   * @param {string} sheetName - Nome da planilha
   * @param {Object} [options] - Opções de filtro
   * @returns {Object} Resposta com dados em JSON
   */
  function exportToJson(sheetName, options) {
    try {
      try {
        var result = read(sheetName, Object.assign({}, options, { pageSize: CONFIG.MAX_PAGE_SIZE }));
      
        if (result.success) {
          return StandardResponse.success({
            sheetName: sheetName,
            exportedAt: new Date().toISOString(),
            count: result.data.length,
            data: result.data
          });
        }
      
        return result;
      
      } catch (e) {
        console.error('Erro em exportToJson: ' + e.message);
        return StandardResponse.error(e.message, 'EXPORT_ERROR');
      }
    } catch (error) {
      Logger.log("Erro em exportToJson: " + error.message);
      throw error;
    }
  }
  
  // ============================================================================
  // EXPORTAÇÃO
  // ============================================================================
  
  return {
    create: create,
    read: read,
    findById: findById,
    update: update,
    remove: remove,
    delete: remove, // Alias
    count: count,
    bulkCreate: bulkCreate,
    exportToJson: exportToJson,
    CONFIG: CONFIG
  };
  
})();

// Aliases globais para compatibilidade
var EnhancedCRUD = CRUDEnhanced;
