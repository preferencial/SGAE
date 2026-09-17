/**
 * @fileoverview Sistema de Integridade e Consistência de Dados
 * @version 1.0.0
 * @description Garante integridade referencial, validação de constraints
 * e detecção de anomalias nos dados.
 * 
 * FUNCIONALIDADES:
 * - Validação de integridade referencial
 * - Detecção de duplicatas
 * - Verificação de constraints
 * - Auditoria de consistência
 * - Reparo automático de dados
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-08
 */

'use strict';

var DataIntegrity = (function() {

  // ============================================================================
  // CONFIGURAÇÃO DE RELACIONAMENTOS
  // ============================================================================

  /**
   * Define relacionamentos entre entidades (Foreign Keys)
   */
  var RELATIONSHIPS = {
    NOTAS_FISCAIS: {
      Fornecedor: { targetSheet: 'FORNECEDORES', targetColumn: 'Razao_Social' },
      Processo_Atesto_ID: { targetSheet: 'PROCESSOS_ATESTO', targetColumn: 'ID', nullable: true }
    },
    ENTREGAS: {
      Fornecedor: { targetSheet: 'FORNECEDORES', targetColumn: 'Razao_Social' },
      Unidade_Escolar: { targetSheet: 'UNIDADES_ESCOLARES', targetColumn: 'Nome', nullable: true }
    },
    RECUSAS: {
      Nota_Fiscal_ID: { targetSheet: 'NOTAS_FISCAIS', targetColumn: 'ID' }
    },
    GLOSAS: {
      Nota_Fiscal_ID: { targetSheet: 'NOTAS_FISCAIS', targetColumn: 'ID' }
    },
    COMISSAO_ATESTACOES: {
      Processo_ID: { targetSheet: 'PROCESSOS_ATESTO', targetColumn: 'ID' },
      Membro1_ID: { targetSheet: 'COMISSAO_MEMBROS', targetColumn: 'ID' },
      Membro2_ID: { targetSheet: 'COMISSAO_MEMBROS', targetColumn: 'ID', nullable: true },
      Membro3_ID: { targetSheet: 'COMISSAO_MEMBROS', targetColumn: 'ID', nullable: true }
    }
  };

  /**
   * Define constraints únicas por entidade
   */
  var UNIQUE_CONSTRAINTS = {
    USUARIOS: ['Email'],
    FORNECEDORES: ['CNPJ'],
    NOTAS_FISCAIS: ['Chave_Acesso'],
    PROCESSOS_ATESTO: ['Numero_Processo_SEI']
  };

  /**
   * Define campos obrigatórios por entidade
   */
  var REQUIRED_FIELDS = {
    USUARIOS: ['Email', 'Nome'],
    FORNECEDORES: ['CNPJ', 'Razao_Social'],
    NOTAS_FISCAIS: ['Numero_NF', 'Fornecedor'],
    ENTREGAS: ['Fornecedor', 'Produto_Descricao'],
    PROCESSOS_ATESTO: ['Numero_Processo_SEI']
  };

  // ============================================================================
  // VALIDAÇÃO DE INTEGRIDADE REFERENCIAL
  // ============================================================================

  /**
   * Verifica integridade referencial de uma entidade
   * @param {string} sheetName - Nome da aba
   * @param {Object} [options] - Opções
   * @returns {Object} Resultado da verificação
   */
  function checkReferentialIntegrity(sheetName, options) {
    try {
      options = options || {};
      var canonical = SCHEMA.getCanonicalName(sheetName);
      var relationships = RELATIONSHIPS[canonical];
    
      if (!relationships) {
        return { success: true, message: 'Sem relacionamentos definidos', violations: [] };
      }

      var result = {
        success: true,
        sheetName: sheetName,
        checked: 0,
        violations: [],
        timestamp: new Date().toISOString()
      };

      try {
        // Lê dados da aba principal
        var mainData = BatchOperations.readAll(SCHEMA.getSheetName(canonical));
        if (!mainData.data || mainData.data.length === 0) {
          return { success: true, message: 'Aba vazia', violations: [] };
        }

        // Cache de dados das abas relacionadas
        var relatedDataCache = {};

        // Verifica cada relacionamento
        Object.keys(relationships).forEach(function(column) {
          var rel = relationships[column];
          var targetSheetName = SCHEMA.getSheetName(rel.targetSheet);
        
          // Carrega dados da aba relacionada (com cache)
          if (!relatedDataCache[targetSheetName]) {
            relatedDataCache[targetSheetName] = BatchOperations.readAll(targetSheetName);
          }
          var targetData = relatedDataCache[targetSheetName];
        
          // Cria índice de valores válidos
          var validValues = new Set();
          if (targetData.data) {
            targetData.data.forEach(function(row) {
              var value = row[rel.targetColumn];
              if (value !== null && value !== undefined && value !== '') {
                validValues.add(String(value));
              }
            });
          }

          // Verifica cada registro
          mainData.data.forEach(function(row) {
            result.checked++;
            var value = row[column];
          
            // Pula se nullable e vazio
            if (rel.nullable && (!value || value === '')) {
              return;
            }
          
            // Verifica se valor existe na tabela relacionada
            if (value && !validValues.has(String(value))) {
              result.success = false;
              result.violations.push({
                type: 'REFERENTIAL_INTEGRITY',
                row: row._rowIndex,
                column: column,
                value: value,
                targetSheet: rel.targetSheet,
                targetColumn: rel.targetColumn,
                message: 'Valor "' + value + '" não encontrado em ' + rel.targetSheet + '.' + rel.targetColumn
              });
            }
          });
        });

      } catch (e) {
        result.success = false;
        result.error = e.message;
      }

      return result;
    } catch (error) {
      Logger.log("Erro em checkReferentialIntegrity: " + error.message);
      throw error;
    }
  }

  // ============================================================================
  // DETECÇÃO DE DUPLICATAS
  // ============================================================================

  /**
   * Detecta registros duplicados
   * @param {string} sheetName - Nome da aba
   * @param {Array<string>} [columns] - Colunas para verificar (usa UNIQUE_CONSTRAINTS se não especificado)
   * @returns {Object} Resultado com duplicatas encontradas
   */
  function findDuplicates(sheetName, columns) {
    try {
      var canonical = SCHEMA.getCanonicalName(sheetName);
      columns = columns || UNIQUE_CONSTRAINTS[canonical] || [];
    
      if (columns.length === 0) {
        return { success: true, message: 'Sem constraints únicas definidas', duplicates: [] };
      }

      var result = {
        success: true,
        sheetName: sheetName,
        columns: columns,
        duplicates: [],
        timestamp: new Date().toISOString()
      };

      try {
        var data = BatchOperations.readAll(SCHEMA.getSheetName(canonical));
        if (!data.data || data.data.length === 0) {
          return result;
        }

        // Para cada coluna única
        columns.forEach(function(column) {
          var valueMap = {}; // valor -> [rowIndices]
        
          data.data.forEach(function(row) {
            var value = row[column];
            if (value !== null && value !== undefined && value !== '') {
              var key = String(value).toLowerCase().trim();
              if (!valueMap[key]) {
                valueMap[key] = [];
              }
              valueMap[key].push(row._rowIndex);
            }
          });

          // Identifica duplicatas
          Object.keys(valueMap).forEach(function(key) {
            if (valueMap[key].length > 1) {
              result.success = false;
              result.duplicates.push({
                column: column,
                value: key,
                rows: valueMap[key],
                count: valueMap[key].length
              });
            }
          });
        });

      } catch (e) {
        result.success = false;
        result.error = e.message;
      }

      return result;
    } catch (error) {
      Logger.log("Erro em findDuplicates: " + error.message);
      throw error;
    }
  }

  // ============================================================================
  // VERIFICAÇÃO DE CAMPOS OBRIGATÓRIOS
  // ============================================================================

  /**
   * Verifica campos obrigatórios
   * @param {string} sheetName - Nome da aba
   * @returns {Object} Resultado da verificação
   */
  function checkRequiredFields(sheetName) {
    try {
      var canonical = SCHEMA.getCanonicalName(sheetName);
      var required = REQUIRED_FIELDS[canonical] || [];
    
      if (required.length === 0) {
        return { success: true, message: 'Sem campos obrigatórios definidos', violations: [] };
      }

      var result = {
        success: true,
        sheetName: sheetName,
        requiredFields: required,
        violations: [],
        timestamp: new Date().toISOString()
      };

      try {
        var data = BatchOperations.readAll(SCHEMA.getSheetName(canonical));
        if (!data.data || data.data.length === 0) {
          return result;
        }

        data.data.forEach(function(row) {
          required.forEach(function(field) {
            var value = row[field];
            if (value === null || value === undefined || value === '') {
              result.success = false;
              result.violations.push({
                type: 'REQUIRED_FIELD',
                row: row._rowIndex,
                field: field,
                message: 'Campo obrigatório "' + field + '" está vazio'
              });
            }
          });
        });

      } catch (e) {
        result.success = false;
        result.error = e.message;
      }

      return result;
    } catch (error) {
      Logger.log("Erro em checkRequiredFields: " + error.message);
      throw error;
    }
  }

  // ============================================================================
  // VERIFICAÇÃO DE TIPOS DE DADOS
  // ============================================================================

  /**
   * Verifica tipos de dados
   * @param {string} sheetName - Nome da aba
   * @param {Object} typeSchema - Schema de tipos {coluna: 'tipo'}
   * @returns {Object} Resultado da verificação
   */
  function checkDataTypes(sheetName, typeSchema) {
    try {
      var result = {
        success: true,
        sheetName: sheetName,
        violations: [],
        timestamp: new Date().toISOString()
      };

      if (!typeSchema || Object.keys(typeSchema).length === 0) {
        return result;
      }

      try {
        var data = BatchOperations.readAll(SCHEMA.getSheetName(sheetName));
        if (!data.data || data.data.length === 0) {
          return result;
        }

        data.data.forEach(function(row) {
          Object.keys(typeSchema).forEach(function(column) {
            var expectedType = typeSchema[column];
            var value = row[column];
          
            // Pula valores vazios
            if (value === null || value === undefined || value === '') {
              return;
            }

            var isValid = true;
            var actualType = typeof value;

            switch (expectedType) {
              case 'number':
                isValid = !isNaN(parseFloat(value)) && isFinite(value);
                break;
              case 'date':
                isValid = value instanceof Date || !isNaN(new Date(value).getTime());
                break;
              case 'email':
                isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));
                break;
              case 'cnpj':
                isValid = validarCNPJ(String(value));
                break;
              case 'boolean':
                isValid = typeof value === 'boolean' || 
                         value === 'true' || value === 'false' ||
                         value === 'SIM' || value === 'NAO' ||
                         value === true || value === false;
                break;
            }

            if (!isValid) {
              result.success = false;
              result.violations.push({
                type: 'DATA_TYPE',
                row: row._rowIndex,
                column: column,
                value: value,
                expectedType: expectedType,
                actualType: actualType,
                message: 'Valor "' + value + '" não é do tipo ' + expectedType
              });
            }
          });
        });

      } catch (e) {
        result.success = false;
        result.error = e.message;
      }

      return result;
    } catch (error) {
      Logger.log("Erro em checkDataTypes: " + error.message);
      throw error;
    }
  }

  // ============================================================================
  // AUDITORIA COMPLETA
  // ============================================================================

  /**
   * Executa auditoria completa de integridade
   * @param {string} [sheetName] - Nome da aba (ou null para todas)
   * @returns {Object} Relatório completo
   */
  function runFullAudit(sheetName) {
    try {
      var startTime = Date.now();
      var report = {
        timestamp: new Date().toISOString(),
        duration: 0,
        sheets: {},
        summary: {
          totalSheets: 0,
          totalViolations: 0,
          totalDuplicates: 0,
          health: 'HEALTHY'
        }
      };

      var sheetsToAudit = sheetName ? [sheetName] : Object.keys(RELATIONSHIPS);

      sheetsToAudit.forEach(function(sheet) {
        // Verifica tempo restante
        if (typeof QuotaManager !== 'undefined' && QuotaManager.shouldStop()) {
          report.interrupted = true;
          return;
        }

        var sheetReport = {
          referentialIntegrity: checkReferentialIntegrity(sheet),
          duplicates: findDuplicates(sheet),
          requiredFields: checkRequiredFields(sheet)
        };

        report.sheets[sheet] = sheetReport;
        report.summary.totalSheets++;

        // Conta violações
        if (sheetReport.referentialIntegrity.violations) {
          report.summary.totalViolations += sheetReport.referentialIntegrity.violations.length;
        }
        if (sheetReport.duplicates.duplicates) {
          report.summary.totalDuplicates += sheetReport.duplicates.duplicates.length;
        }
        if (sheetReport.requiredFields.violations) {
          report.summary.totalViolations += sheetReport.requiredFields.violations.length;
        }
      });

      // Determina saúde geral
      var totalIssues = report.summary.totalViolations + report.summary.totalDuplicates;
      if (totalIssues === 0) {
        report.summary.health = 'HEALTHY';
      } else if (totalIssues < 10) {
        report.summary.health = 'WARNING';
      } else if (totalIssues < 50) {
        report.summary.health = 'DEGRADED';
      } else {
        report.summary.health = 'CRITICAL';
      }

      report.duration = Date.now() - startTime;
      return report;
    } catch (error) {
      Logger.log("Erro em runFullAudit: " + error.message);
      throw error;
    }
  }

  // ============================================================================
  // REPARO DE DADOS
  // ============================================================================

  /**
   * Remove duplicatas mantendo o registro mais recente
   * @param {string} sheetName - Nome da aba
   * @param {string} column - Coluna para verificar duplicatas
   * @param {Object} [options] - Opções
   * @returns {Object} Resultado do reparo
   */
  function removeDuplicates(sheetName, column, options) {
    options = options || {};
    var keepFirst = options.keepFirst !== false; // Por padrão mantém o primeiro
    var dryRun = options.dryRun === true;

    var result = {
      success: true,
      sheetName: sheetName,
      column: column,
      removed: 0,
      rowsToRemove: [],
      dryRun: dryRun
    };

    try {
      var duplicates = findDuplicates(sheetName, [column]);
      
      if (duplicates.duplicates.length === 0) {
        result.message = 'Nenhuma duplicata encontrada';
        return result;
      }

      duplicates.duplicates.forEach(function(dup) {
        // Determina quais linhas remover
        var rowsToRemove = keepFirst ? dup.rows.slice(1) : dup.rows.slice(0, -1);
        result.rowsToRemove = result.rowsToRemove.concat(rowsToRemove);
      });

      if (!dryRun && result.rowsToRemove.length > 0) {
        // Remove linhas (de baixo para cima para não afetar índices)
        var sheet = getSheet(SCHEMA.getSheetName(sheetName));
        result.rowsToRemove.sort(function(a, b) { return b - a; });
        
        result.rowsToRemove.forEach(function(rowIndex) {
          sheet.deleteRow(rowIndex);
          result.removed++;
        });

        // Invalida cache
        BatchOperations.invalidateCache(sheetName);
      }

      result.message = dryRun ? 
        result.rowsToRemove.length + ' linhas seriam removidas' :
        result.removed + ' duplicatas removidas';

    } catch (e) {
      result.success = false;
      result.error = e.message;
    }

    return result;
  }

  // ============================================================================
  // API PÚBLICA
  // ============================================================================

  return {
    // Verificações
    checkReferentialIntegrity: checkReferentialIntegrity,
    findDuplicates: findDuplicates,
    checkRequiredFields: checkRequiredFields,
    checkDataTypes: checkDataTypes,
    
    // Auditoria
    runFullAudit: runFullAudit,
    
    // Reparo
    removeDuplicates: removeDuplicates,
    
    // Configuração
    RELATIONSHIPS: RELATIONSHIPS,
    UNIQUE_CONSTRAINTS: UNIQUE_CONSTRAINTS,
    REQUIRED_FIELDS: REQUIRED_FIELDS
  };
})();
