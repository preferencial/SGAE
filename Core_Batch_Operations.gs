/**
 * @fileoverview Operações em Lote Otimizadas
 * @version 1.0.0
 * @description Funções para processar grandes volumes de dados eficientemente
 * 
 * INTERVENÇÃO 12/16: Otimização de Performance
 * - Processamento em chunks para evitar timeout
 * - Operações de escrita em batch
 * - Progress tracking
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-26
 */

'use strict';

var BatchOperations = (function() {
  
  // =========================================================================
  // CONFIGURAÇÃO
  // =========================================================================
  
  var CONFIG = {
    DEFAULT_CHUNK_SIZE: 100,
    MAX_EXECUTION_TIME_MS: 270000, // 4.5 minutos (margem de segurança)
    PROGRESS_LOG_INTERVAL: 50
  };
  
  var _startTime = null;
  
  // =========================================================================
  // FUNÇÕES PRIVADAS
  // =========================================================================
  
  /**
   * Verifica se ainda há tempo de execução
   * @private
   */
  function _hasTimeRemaining() {
    if (!_startTime) return true;
    var elapsed = Date.now() - _startTime;
    return elapsed < CONFIG.MAX_EXECUTION_TIME_MS;
  }
  
  /**
   * Divide array em chunks
   * @private
   */
  function _chunk(array, size) {
    try {
      try {
        var chunks = [];
        for (var i = 0; i < array.length; i += size) {
          chunks.push(array.slice(i, i + size));
        }
        return chunks;
      } catch (error) {
        Logger.log("Erro em _chunk: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em _chunk: " + error.message);
      throw error;
    }
  }
  
  // =========================================================================
  // API PÚBLICA
  // =========================================================================
  
  return {
    
    /**
     * Processa array em chunks com callback
     * @param {Array} items - Items a processar
     * @param {Function} processor - Função de processamento (item, index) => result
     * @param {Object} [options] - Opções
     * @param {number} [options.chunkSize] - Tamanho do chunk
     * @param {Function} [options.onProgress] - Callback de progresso (processed, total)
     * @param {Function} [options.onChunkComplete] - Callback após cada chunk
     * @returns {Object} { results: Array, processed: number, interrupted: boolean }
     */
    processInChunks: function(items, processor, options) {
      options = options || {};
      var chunkSize = options.chunkSize || CONFIG.DEFAULT_CHUNK_SIZE;
      var onProgress = options.onProgress || function() {};
      var onChunkComplete = options.onChunkComplete || function() {};
      
      _startTime = Date.now();
      
      var results = [];
      var processed = 0;
      var interrupted = false;
      var chunks = _chunk(items, chunkSize);
      
      for (var c = 0; c < chunks.length; c++) {
        // Verifica tempo
        if (!_hasTimeRemaining()) {
          interrupted = true;
          Logger.log('[BatchOps] Interrompido por tempo após ' + processed + ' items');
          break;
        }
        
        var chunk = chunks[c];
        
        for (var i = 0; i < chunk.length; i++) {
          try {
            var result = processor(chunk[i], processed);
            results.push(result);
          } catch (e) {
            results.push({ error: e.message, item: chunk[i] });
          }
          
          processed++;
          
          // Log de progresso
          if (processed % CONFIG.PROGRESS_LOG_INTERVAL === 0) {
            onProgress(processed, items.length);
          }
        }
        
        onChunkComplete(c + 1, chunks.length, processed);
        
        // Pequena pausa entre chunks para evitar throttling
        if (c < chunks.length - 1) {
          Utilities.sleep(50);
        }
      }
      
      return {
        results: results,
        processed: processed,
        total: items.length,
        interrupted: interrupted,
        duration: Date.now() - _startTime
      };
    },
    
    /**
     * Escreve múltiplas linhas em uma sheet de forma otimizada
     * @param {string} sheetName - Nome da aba
     * @param {Array} rows - Linhas a escrever
     * @param {Object} [options] - Opções
     * @returns {Object} Resultado
     */
    writeRows: function(sheetName, rows, options) {
      options = options || {};
      
      if (!rows || rows.length === 0) {
        return { success: true, written: 0 };
      }
      
      try {
        var ss = getSS();
        var sheet = ss.getSheetByName(sheetName);
        
        if (!sheet) {
          return { success: false, error: 'Sheet não encontrada: ' + sheetName };
        }
        
        var startRow = options.startRow || (sheet.getLastRow() + 1);
        var numCols = rows[0].length;
        
        // Escreve todas as linhas de uma vez
        sheet.getRange(startRow, 1, rows.length, numCols).setValues(rows);
        
        // Invalida cache
        if (typeof DataCache !== 'undefined') {
          DataCache.invalidate(sheetName);
        }
        
        return {
          success: true,
          written: rows.length,
          startRow: startRow,
          endRow: startRow + rows.length - 1
        };
        
      } catch (e) {
        return { success: false, error: e.message };
      }
    },
    
    /**
     * Atualiza múltiplas linhas por ID
     * @param {string} sheetName - Nome da aba
     * @param {Array} updates - Array de { id: valor, data: { campo: valor } }
     * @param {string} [idColumn] - Nome da coluna de ID (default: 'ID')
     * @returns {Object} Resultado
     */
    updateByIds: function(sheetName, updates, idColumn) {
      try {
        idColumn = idColumn || 'ID';
      
        if (!updates || updates.length === 0) {
          return { success: true, updated: 0 };
        }
      
        try {
          var ss = getSS();
          var sheet = ss.getSheetByName(sheetName);
        
          if (!sheet) {
            return { success: false, error: 'Sheet não encontrada: ' + sheetName };
          }
        
          var data = sheet.getDataRange().getValues();
          var headers = data[0];
          var idIdx = headers.indexOf(idColumn);
        
          if (idIdx === -1) {
            return { success: false, error: 'Coluna ID não encontrada: ' + idColumn };
          }
        
          // Cria mapa de updates
          var updateMap = {};
          updates.forEach(function(u) {
            updateMap[u.id] = u.data;
          });
        
          var updated = 0;
        
          // Processa cada linha
          for (var i = 1; i < data.length; i++) {
            var rowId = data[i][idIdx];
          
            if (updateMap[rowId]) {
              var updateData = updateMap[rowId];
            
              for (var field in updateData) {
                var colIdx = headers.indexOf(field);
                if (colIdx !== -1) {
                  data[i][colIdx] = updateData[field];
                }
              }
            
              updated++;
            }
          }
        
          // Escreve dados atualizados
          if (updated > 0) {
            sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
          
            // Invalida cache
            if (typeof DataCache !== 'undefined') {
              DataCache.invalidate(sheetName);
            }
          }
        
          return {
            success: true,
            updated: updated,
            total: updates.length
          };
        
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em updateByIds: " + error.message);
        throw error;
      }
    },
    
    /**
     * Deleta múltiplas linhas por IDs
     * @param {string} sheetName - Nome da aba
     * @param {Array} ids - IDs a deletar
     * @param {string} [idColumn] - Nome da coluna de ID
     * @returns {Object} Resultado
     */
    deleteByIds: function(sheetName, ids, idColumn) {
      try {
        idColumn = idColumn || 'ID';
      
        if (!ids || ids.length === 0) {
          return { success: true, deleted: 0 };
        }
      
        try {
          var ss = getSS();
          var sheet = ss.getSheetByName(sheetName);
        
          if (!sheet) {
            return { success: false, error: 'Sheet não encontrada: ' + sheetName };
          }
        
          var data = sheet.getDataRange().getValues();
          var headers = data[0];
          var idIdx = headers.indexOf(idColumn);
        
          if (idIdx === -1) {
            return { success: false, error: 'Coluna ID não encontrada: ' + idColumn };
          }
        
          // Cria set de IDs para deletar
          var idsToDelete = {};
          ids.forEach(function(id) {
            idsToDelete[id] = true;
          });
        
          // Filtra linhas que NÃO devem ser deletadas
          var newData = [headers];
          var deleted = 0;
        
          for (var i = 1; i < data.length; i++) {
            var rowId = data[i][idIdx];
          
            if (idsToDelete[rowId]) {
              deleted++;
            } else {
              newData.push(data[i]);
            }
          }
        
          // Reescreve dados
          if (deleted > 0) {
            sheet.clearContents();
            if (newData.length > 0) {
              sheet.getRange(1, 1, newData.length, newData[0].length).setValues(newData);
            }
          
            // Invalida cache
            if (typeof DataCache !== 'undefined') {
              DataCache.invalidate(sheetName);
            }
          }
        
          return {
            success: true,
            deleted: deleted,
            remaining: newData.length - 1
          };
        
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em deleteByIds: " + error.message);
        throw error;
      }
    },
    
    /**
     * Executa operação com retry automático
     * @param {Function} operation - Operação a executar
     * @param {Object} [options] - Opções
     * @returns {Object} Resultado
     */
    withRetry: function(operation, options) {
      options = options || {};
      var maxRetries = options.maxRetries || 3;
      var delay = options.delay || 1000;
      
      var lastError = null;
      
      for (var attempt = 0; attempt < maxRetries; attempt++) {
        try {
          return { success: true, data: operation(), attempts: attempt + 1 };
        } catch (e) {
          lastError = e;
          
          if (attempt < maxRetries - 1) {
            Utilities.sleep(delay * Math.pow(2, attempt)); // Exponential backoff
          }
        }
      }
      
      return {
        success: false,
        error: lastError ? lastError.message : 'Max retries exceeded',
        attempts: maxRetries
      };
    },
    
    // Configuração
    CONFIG: CONFIG
  };
})();

// ============================================================================
// ALIASES GLOBAIS
// ============================================================================

/**
 * Processa items em chunks (alias global)
 */
function processInChunks(items, processor, options) {
  return BatchOperations.processInChunks(items, processor, options);
}

/**
 * Escreve linhas em batch (alias global)
 */
function batchWriteRows(sheetName, rows, options) {
  return BatchOperations.writeRows(sheetName, rows, options);
}

/**
 * Atualiza registros por IDs (alias global)
 */
function batchUpdateByIds(sheetName, updates, idColumn) {
  return BatchOperations.updateByIds(sheetName, updates, idColumn);
}

/**
 * Deleta registros por IDs (alias global)
 */
function batchDeleteByIds(sheetName, ids, idColumn) {
  return BatchOperations.deleteByIds(sheetName, ids, idColumn);
}
