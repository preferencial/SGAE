/**
 * @fileoverview Otimizador de Consultas com Índices e Query Planning
 * @version 2.0.0
 * @description Sistema inteligente de otimização de queries com índices em memória
 */

'use strict';

var QueryOptimizer = (function() {

  var indices = {};
  var queryStats = {};

  /**
   * Cria índice para campo específico
   */
  function createIndex(sheetName, field) {
    try {
      try {
        var key = sheetName + ':' + field;

        if (indices[key]) {
          AppLogger.debug('Índice já existe: ' + key);
          return indices[key];
        }

        var sheet = getSheet(sheetName);
        var data = sheet.getDataRange().getValues();
        var headers = data[0];
        var fieldIndex = headers.indexOf(field);

        if (fieldIndex === -1) {
          throw new Error('Campo não encontrado: ' + field);
        }

        var index = {};
        for (var i = 1; i < data.length; i++) {
          var value = data[i][fieldIndex];
          if (!index[value]) {
            index[value] = [];
          }
          index[value].push(i + 1); // rowIndex
        }

        indices[key] = {
          field: field,
          index: index,
          created: Date.now(),
          size: Object.keys(index).length
        };

        AppLogger.log('Índice criado: ' + key + ' (' + indices[key].size + ' valores únicos)');
        return indices[key];
      } catch (e) {
        AppLogger.error('Erro ao criar índice', e);
        return null;
      }
    } catch (error) {
      Logger.log("Erro em createIndex: " + error.message);
      throw error;
    }
  }

  /**
   * Analisa query e sugere otimizações
   */
  function analyzeQuery(sheetName, filters, options) {
    try {
      var analysis = {
        sheetName: sheetName,
        filters: filters,
        suggestions: [],
        estimatedCost: 0,
        canUseIndex: false
      };

      // Verifica se há índices disponíveis
      Object.keys(filters).forEach(function(field) {
        var indexKey = sheetName + ':' + field;
        if (indices[indexKey]) {
          analysis.canUseIndex = true;
          analysis.suggestions.push('Usar índice existente para ' + field);
          analysis.estimatedCost += 1;
        } else {
          analysis.suggestions.push('Criar índice para ' + field + ' pode melhorar performance');
          analysis.estimatedCost += 10;
        }
      });

      // Verifica se há muitos filtros
      if (Object.keys(filters).length > 3) {
        analysis.suggestions.push('Considere reduzir número de filtros ou criar índice composto');
      }

      // Verifica se há ordenação
      if (options && options.orderBy) {
        analysis.estimatedCost += 5;
        analysis.suggestions.push('Ordenação adiciona custo - considere cache');
      }

      return analysis;
    } catch (error) {
      Logger.log("Erro em analyzeQuery: " + error.message);
      throw error;
    }
  }

  /**
   * Executa query otimizada usando índices
   */
  function executeOptimized(sheetName, filters, options) {
    try {
      try {
        options = options || {};
        var startTime = Date.now();

        // Tenta usar índice para o primeiro filtro
        var firstFilter = Object.keys(filters)[0];
        var indexKey = sheetName + ':' + firstFilter;

        if (indices[indexKey] && typeof filters[firstFilter] !== 'function') {
          // Usa índice
          var rowIndices = indices[indexKey].index[filters[firstFilter]] || [];

          if (rowIndices.length === 0) {
            return { success: true, data: [], total: 0, usedIndex: true };
          }

          // Busca apenas as linhas indexadas
          var results = BatchOptimizer.readBatch(sheetName, rowIndices);

          if (!results.success) {
            throw new Error(results.error);
          }

          var data = results.data;

          // Aplica filtros adicionais
          var remainingFilters = Object.keys(filters).slice(1);
          if (remainingFilters.length > 0) {
            data = data.filter(function(record) {
              return remainingFilters.every(function(key) {
                var filterValue = filters[key];
                if (typeof filterValue === 'function') {
                  return filterValue(record[key]);
                }
                return record[key] === filterValue;
              });
            });
          }

          // Aplica ordenação
          if (options.orderBy) {
            data.sort(function(a, b) {
              var aVal = a[options.orderBy.field];
              var bVal = b[options.orderBy.field];
              var direction = options.orderBy.direction === 'desc' ? -1 : 1;
              return aVal < bVal ? -1 * direction : aVal > bVal ? 1 * direction : 0;
            });
          }

          // Aplica paginação
          var total = data.length;
          var offset = options.offset || 0;
          var limit = options.limit || 100;
          data = data.slice(offset, offset + limit);

          var duration = Date.now() - startTime;
          recordQueryStats(sheetName, duration, true);

          return {
            success: true,
            data: data,
            total: total,
            usedIndex: true,
            duration: duration
          };
        }

        // Fallback para query normal
        var duration = Date.now() - startTime;
        recordQueryStats(sheetName, duration, false);

        return CRUD.read(sheetName, options);
      } catch (e) {
        AppLogger.error('Erro em executeOptimized', e);
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em executeOptimized: " + error.message);
      throw error;
    }
  }

  /**
   * Registra estatísticas de query
   */
  function recordQueryStats(sheetName, duration, usedIndex) {
    if (!queryStats[sheetName]) {
      queryStats[sheetName] = {
        count: 0,
        totalDuration: 0,
        indexedQueries: 0,
        avgDuration: 0
      };
    }

    var stats = queryStats[sheetName];
    stats.count++;
    stats.totalDuration += duration;
    if (usedIndex) stats.indexedQueries++;
    stats.avgDuration = stats.totalDuration / stats.count;
  }

  /**
   * Sugere índices baseado em padrões de uso
   */
  function suggestIndices() {
    try {
      var suggestions = [];

      Object.keys(queryStats).forEach(function(sheetName) {
        var stats = queryStats[sheetName];
        var indexRate = stats.indexedQueries / stats.count;

        if (indexRate < 0.5 && stats.count > 10) {
          suggestions.push({
            sheetName: sheetName,
            reason: 'Baixa taxa de uso de índices (' + (indexRate * 100).toFixed(1) + '%)',
            avgDuration: stats.avgDuration.toFixed(2) + 'ms',
            priority: 'high'
          });
        }
      });

      return suggestions;
    } catch (error) {
      Logger.log("Erro em suggestIndices: " + error.message);
      throw error;
    }
  }

  return {
    /**
     * Cria índice para otimização
     */
    createIndex: createIndex,

    /**
     * Cria múltiplos índices
     */
    createIndices: function(sheetName, fields) {
      try {
        var results = [];
        fields.forEach(function(field) {
          results.push(createIndex(sheetName, field));
        });
        return results;
      } catch (error) {
        Logger.log("Erro em createIndices: " + error.message);
        throw error;
      }
    },

    /**
     * Remove índice
     */
    dropIndex: function(sheetName, field) {
      var key = sheetName + ':' + field;
      if (indices[key]) {
        delete indices[key];
        AppLogger.log('Índice removido: ' + key);
        return true;
      }
      return false;
    },

    /**
     * Lista índices existentes
     */
    listIndices: function() {
      try {
        return Object.keys(indices).map(function(key) {
          return {
            key: key,
            size: indices[key].size,
            age: Date.now() - indices[key].created
          };
        });
      } catch (error) {
        Logger.log("Erro em listIndices: " + error.message);
        throw error;
      }
    },

    /**
     * Analisa query
     */
    analyze: analyzeQuery,

    /**
     * Executa query otimizada
     */
    execute: executeOptimized,

    /**
     * Obtém estatísticas
     */
    getStats: function() {
      try {
        return {
          indices: Object.keys(indices).length,
          queries: queryStats,
          suggestions: suggestIndices()
        };
      } catch (error) {
        Logger.log("Erro em getStats: " + error.message);
        throw error;
      }
    },

    /**
     * Limpa índices antigos
     */
    cleanup: function(maxAge) {
      try {
        maxAge = maxAge || 3600000; // 1 hora
        var now = Date.now();
        var removed = 0;

        Object.keys(indices).forEach(function(key) {
          if (now - indices[key].created > maxAge) {
            delete indices[key];
            removed++;
          }
        });

        AppLogger.log('Cleanup: ' + removed + ' índices removidos');
        return removed;
      } catch (error) {
        Logger.log("Erro em cleanup: " + error.message);
        throw error;
      }
    },

    /**
     * Inicializa índices comuns
     * CORRIGIDO: Usa nomes de campos corretos baseados no SCHEMA real das planilhas
     */
    initializeCommonIndices: function() {
      try {
        // Campos corrigidos conforme estrutura real das planilhas (Setup_Sheets_Builder.gs)
        var commonIndices = [
          // Notas_Fiscais: id, numero_nf, serie, chave_acesso, fornecedor, cnpj, valor_total, ...
          { sheet: 'Notas_Fiscais', fields: ['status', 'fornecedor', 'cnpj'] },
          // Entregas: id, nota_fiscal_id, numero_nf, fornecedor, unidade_escolar, data_entrega, ...
          { sheet: 'Entregas', fields: ['status', 'data_entrega', 'fornecedor'] },
          // Fornecedores: id, razao_social, nome_fantasia, cnpj, ...
          { sheet: 'Fornecedores', fields: ['cnpj', 'razao_social', 'status'] },
          // Workflow_NotasFiscais: ID, Data_Criacao, Numero, Serie, ...
          { sheet: 'Workflow_NotasFiscais', fields: ['Status', 'Fornecedor', 'CNPJ'] },
          // Workflow_Recebimentos: ID, NF_ID, NF_Numero, Escola, ...
          { sheet: 'Workflow_Recebimentos', fields: ['Status', 'Escola', 'NF_ID'] }
        ];

        var created = 0;
        var errors = 0;

        commonIndices.forEach(function(config) {
          // Verifica se a aba existe antes de tentar criar índices
          try {
            var sheet = typeof getSheet === 'function' ? getSheet(config.sheet) : null;
            if (!sheet) {
              if (typeof AppLogger !== 'undefined') {
                AppLogger.warn('Aba não encontrada para índices: ' + config.sheet);
              }
              return;
            }
          } catch (e) {
            // Aba não existe, pula
            return;
          }

          config.fields.forEach(function(field) {
            try {
              var result = createIndex(config.sheet, field);
              if (result) {
                created++;
              }
            } catch (e) {
              errors++;
              if (typeof AppLogger !== 'undefined') {
                AppLogger.debug('Índice não criado para ' + config.sheet + '.' + field + ': ' + e.message);
              }
            }
          });
        });

        if (typeof AppLogger !== 'undefined') {
          AppLogger.log('Índices comuns inicializados (' + created + ' criados, ' + errors + ' ignorados)');
        }
      } catch (error) {
        Logger.log("Erro em initializeCommonIndices: " + error.message);
        throw error;
      }
    }
  };
})();
