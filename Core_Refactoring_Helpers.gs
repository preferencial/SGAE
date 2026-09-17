/**
 * @fileoverview Helpers de Refatoração - Funções Utilitárias Centralizadas
 * @version 1.0.0
 * @description Módulo criado para reduzir god functions, centralizando
 * operações comuns e promovendo reutilização de código.
 * 
 * INTERVENÇÃO 3/16: Correção de God Functions
 * - Extrai lógica comum de funções grandes
 * - Promove Single Responsibility Principle
 * - Facilita testes unitários
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-26
 */

'use strict';

var RefactoringHelpers = (function() {

  // ============================================================================
  // HELPERS DE PLANILHA
  // ============================================================================

  /**
   * Encontra índice de coluna por nome (case-insensitive, múltiplos aliases)
   * @param {Array} headers - Array de headers
   * @param {Array|string} aliases - Nome(s) possíveis da coluna
   * @returns {number} Índice da coluna ou -1 se não encontrada
   */
  function findColumnIndex(headers, aliases) {
    try {
      if (!headers || !aliases) return -1;
    
      var aliasArray = Array.isArray(aliases) ? aliases : [aliases];
      var normalizedAliases = aliasArray.map(function(a) {
        return String(a).toLowerCase().replace(/[^a-z0-9]/g, '');
      });
    
      for (var i = 0; i < headers.length; i++) {
        var normalizedHeader = String(headers[i]).toLowerCase().replace(/[^a-z0-9]/g, '');
        for (var j = 0; j < normalizedAliases.length; j++) {
          if (normalizedHeader === normalizedAliases[j] || 
              normalizedHeader.indexOf(normalizedAliases[j]) !== -1) {
            return i;
          }
        }
      }
      return -1;
    } catch (error) {
      Logger.log("Erro em findColumnIndex: " + error.message);
      throw error;
    }
  }

  /**
   * Obtém dados de uma planilha com headers mapeados
   * @param {string} sheetName - Nome da aba
   * @param {Object} [options] - Opções
   * @param {number} [options.maxRows] - Máximo de linhas
   * @param {Array} [options.requiredColumns] - Colunas obrigatórias
   * @returns {Object} { success, data, headers, error }
   */
  function getSheetDataMapped(sheetName, options) {
    try {
      options = options || {};
    
      try {
        var ss = getSS();
        if (!ss) {
          return { success: false, error: 'Planilha não encontrada', data: [], headers: [] };
        }
      
        var sheet = ss.getSheetByName(sheetName);
        if (!sheet || sheet.getLastRow() <= 1) {
          return { success: false, error: 'Aba "' + sheetName + '" não encontrada ou vazia', data: [], headers: [] };
        }
      
        var lastRow = options.maxRows ? Math.min(sheet.getLastRow(), options.maxRows + 1) : sheet.getLastRow();
        var data = sheet.getRange(1, 1, lastRow, sheet.getLastColumn()).getValues();
        var headers = data[0];
      
        // Verifica colunas obrigatórias
        if (options.requiredColumns) {
          var missing = [];
          options.requiredColumns.forEach(function(col) {
            if (findColumnIndex(headers, col) === -1) {
              missing.push(col);
            }
          });
          if (missing.length > 0) {
            return { 
              success: false, 
              error: 'Colunas obrigatórias não encontradas: ' + missing.join(', '),
              data: [],
              headers: headers
            };
          }
        }
      
        // Mapeia dados para objetos
        var mappedData = [];
        for (var i = 1; i < data.length; i++) {
          var row = {};
          for (var j = 0; j < headers.length; j++) {
            var key = String(headers[j]).toLowerCase().replace(/[^a-z0-9_]/g, '');
            row[key] = data[i][j];
            row[headers[j]] = data[i][j]; // Mantém key original também
          }
          row._rowIndex = i + 1;
          mappedData.push(row);
        }
      
        return { success: true, data: mappedData, headers: headers };
      
      } catch (e) {
        return { success: false, error: e.message, data: [], headers: [] };
      }
    } catch (error) {
      Logger.log("Erro em getSheetDataMapped: " + error.message);
      throw error;
    }
  }

  /**
   * Cria ou obtém uma aba temporária
   * @param {string} name - Nome da aba
   * @param {Array} [headers] - Headers opcionais
   * @returns {Sheet} Objeto Sheet
   */
  function getOrCreateSheet(name, headers) {
    try {
      try {
        var ss = getSS();
        var sheet = ss.getSheetByName(name);
    
        if (!sheet) {
          sheet = ss.insertSheet(name);
          if (headers && headers.length > 0) {
            sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
            sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
            sheet.setFrozenRows(1);
          }
        }
    
        return sheet;
      } catch (error) {
        Logger.log("Erro em getOrCreateSheet: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em getOrCreateSheet: " + error.message);
      throw error;
    }
  }

  // ============================================================================
  // HELPERS DE VALIDAÇÃO
  // ============================================================================

  /**
   * Valida campos obrigatórios em um objeto
   * @param {Object} data - Dados a validar
   * @param {Array} requiredFields - Campos obrigatórios
   * @returns {Object} { valid, errors }
   */
  function validateRequired(data, requiredFields) {
    try {
      var errors = [];
    
      requiredFields.forEach(function(field) {
        var fieldName = typeof field === 'object' ? field.name : field;
        var fieldLabel = typeof field === 'object' ? field.label : field;
      
        var value = data[fieldName];
        if (value === undefined || value === null || String(value).trim() === '') {
          errors.push(fieldLabel + ' é obrigatório');
        }
      });
    
      return { valid: errors.length === 0, errors: errors };
    } catch (error) {
      Logger.log("Erro em validateRequired: " + error.message);
      throw error;
    }
  }

  /**
   * Valida formato de email
   * @param {string} email
   * @returns {boolean}
   */
  function isValidEmail(email) {
    try {
      if (!email) return false;
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
    } catch (error) {
      Logger.log("Erro em isValidEmail: " + error.message);
      throw error;
    }
  }

  /**
   * Valida CNPJ (apenas formato, não dígito verificador)
   * @param {string} cnpj
   * @returns {boolean}
   */
  function isValidCNPJFormat(cnpj) {
    try {
      if (!cnpj) return false;
      var cleaned = String(cnpj).replace(/\D/g, '');
      return cleaned.length === 14;
    } catch (error) {
      Logger.log("Erro em isValidCNPJFormat: " + error.message);
      throw error;
    }
  }

  /**
   * Valida CPF (apenas formato, não dígito verificador)
   * @param {string} cpf
   * @returns {boolean}
   */
  function isValidCPFFormat(cpf) {
    try {
      if (!cpf) return false;
      var cleaned = String(cpf).replace(/\D/g, '');
      return cleaned.length === 11;
    } catch (error) {
      Logger.log("Erro em isValidCPFFormat: " + error.message);
      throw error;
    }
  }

  // ============================================================================
  // HELPERS DE DATA/HORA
  // ============================================================================

  /**
   * Formata data para exibição
   * @param {Date|string} date - Data
   * @param {string} [format='dd/MM/yyyy'] - Formato
   * @returns {string}
   */
  function formatDate(date, format) {
    if (!date) return '';
    format = format || 'dd/MM/yyyy';
    
    try {
      var d = date instanceof Date ? date : new Date(date);
      if (isNaN(d.getTime())) return '';
      
      return Utilities.formatDate(d, Session.getScriptTimeZone(), format);
    } catch (e) {
      return '';
    }
  }

  /**
   * Calcula diferença em dias entre duas datas
   * @param {Date} date1
   * @param {Date} date2
   * @returns {number}
   */
  function daysBetween(date1, date2) {
    var d1 = date1 instanceof Date ? date1 : new Date(date1);
    var d2 = date2 instanceof Date ? date2 : new Date(date2);
    
    var diffTime = Math.abs(d2 - d1);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Adiciona dias úteis a uma data
   * @param {Date} date - Data inicial
   * @param {number} days - Dias úteis a adicionar
   * @returns {Date}
   */
  function addBusinessDays(date, days) {
    var result = new Date(date);
    var added = 0;
    
    while (added < days) {
      result.setDate(result.getDate() + 1);
      var dayOfWeek = result.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        added++;
      }
    }
    
    return result;
  }

  // ============================================================================
  // HELPERS DE FORMATAÇÃO
  // ============================================================================

  /**
   * Formata valor monetário
   * @param {number} value - Valor
   * @param {string} [currency='R$'] - Símbolo da moeda
   * @returns {string}
   */
  function formatCurrency(value, currency) {
    try {
      currency = currency || 'R$';
      var num = Number(value) || 0;
      return currency + ' ' + num.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    } catch (error) {
      Logger.log("Erro em formatCurrency: " + error.message);
      throw error;
    }
  }

  /**
   * Formata CNPJ
   * @param {string} cnpj
   * @returns {string}
   */
  function formatCNPJ(cnpj) {
    try {
      if (!cnpj) return '';
      var cleaned = String(cnpj).replace(/\D/g, '');
      if (cleaned.length !== 14) return cnpj;
      return cleaned.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    } catch (error) {
      Logger.log("Erro em formatCNPJ: " + error.message);
      throw error;
    }
  }

  /**
   * Formata CPF
   * @param {string} cpf
   * @returns {string}
   */
  function formatCPF(cpf) {
    try {
      if (!cpf) return '';
      var cleaned = String(cpf).replace(/\D/g, '');
      if (cleaned.length !== 11) return cpf;
      return cleaned.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
    } catch (error) {
      Logger.log("Erro em formatCPF: " + error.message);
      throw error;
    }
  }

  // ============================================================================
  // HELPERS DE AGREGAÇÃO
  // ============================================================================

  /**
   * Agrupa array por uma chave
   * @param {Array} array - Array de objetos
   * @param {string|Function} key - Chave ou função de agrupamento
   * @returns {Object}
   */
  function groupBy(array, key) {
    try {
      return array.reduce(function(result, item) {
        var groupKey = typeof key === 'function' ? key(item) : item[key];
        if (!result[groupKey]) {
          result[groupKey] = [];
        }
        result[groupKey].push(item);
        return result;
      }, {});
    } catch (error) {
      Logger.log("Erro em groupBy: " + error.message);
      throw error;
    }
  }

  /**
   * Soma valores de um array por uma propriedade
   * @param {Array} array - Array de objetos
   * @param {string} property - Propriedade a somar
   * @returns {number}
   */
  function sumBy(array, property) {
    try {
      return array.reduce(function(sum, item) {
        return sum + (Number(item[property]) || 0);
      }, 0);
    } catch (error) {
      Logger.log("Erro em sumBy: " + error.message);
      throw error;
    }
  }

  /**
   * Conta ocorrências por valor de uma propriedade
   * @param {Array} array - Array de objetos
   * @param {string} property - Propriedade a contar
   * @returns {Object}
   */
  function countBy(array, property) {
    try {
      return array.reduce(function(result, item) {
        var value = item[property] || 'undefined';
        result[value] = (result[value] || 0) + 1;
        return result;
      }, {});
    } catch (error) {
      Logger.log("Erro em countBy: " + error.message);
      throw error;
    }
  }

  // ============================================================================
  // HELPERS DE RELATÓRIO
  // ============================================================================

  /**
   * Gera cabeçalho padrão de relatório
   * @param {string} titulo - Título do relatório
   * @param {Object} [options] - Opções
   * @returns {Array} Array de linhas para o relatório
   */
  function generateReportHeader(titulo, options) {
    try {
      options = options || {};
      var lines = [];
    
      if (options.instituicao !== false) {
        lines.push(['GOVERNO DO DISTRITO FEDERAL']);
        lines.push(['SECRETARIA DE ESTADO DE EDUCAÇÃO']);
        lines.push(['COORDENAÇÃO REGIONAL DE ENSINO DO PLANO PILOTO E CRUZEIRO']);
        lines.push(['UNIDADE DE INFRAESTRUTURA, ALIMENTAÇÃO E ATENDIMENTO ESCOLAR - UNIAE']);
        lines.push(['']);
      }
    
      lines.push([titulo.toUpperCase()]);
      lines.push(['']);
      lines.push(['Data de Emissão: ' + formatDate(new Date(), 'dd/MM/yyyy HH:mm')]);
    
      if (options.periodo) {
        lines.push(['Período: ' + options.periodo]);
      }
    
      lines.push(['']);
    
      return lines;
    } catch (error) {
      Logger.log("Erro em generateReportHeader: " + error.message);
      throw error;
    }
  }

  /**
   * Gera rodapé padrão de relatório
   * @returns {Array} Array de linhas para o rodapé
   */
  function generateReportFooter() {
    return [
      [''],
      ['"Brasília Patrimônio Público da Humanidade"'],
      ['SGAN 607 Norte, Módulo D - Asa Norte - CEP 70297-400 - DF'],
      ['Telefone(s): (61)3318-2680'],
      ['www.se.df.gov.br']
    ];
  }

  // ============================================================================
  // HELPERS DE PROCESSAMENTO EM LOTE
  // ============================================================================

  /**
   * Processa array em lotes com callback
   * @param {Array} items - Itens a processar
   * @param {number} batchSize - Tamanho do lote
   * @param {Function} processor - Função de processamento
   * @param {Object} [options] - Opções
   * @returns {Object} { processed, errors, results }
   */
  function processBatch(items, batchSize, processor, options) {
    try {
      options = options || {};
      var results = [];
      var errors = [];
      var processed = 0;
    
      for (var i = 0; i < items.length; i += batchSize) {
        var batch = items.slice(i, Math.min(i + batchSize, items.length));
      
        try {
          var batchResult = processor(batch, i);
          if (batchResult) {
            results = results.concat(Array.isArray(batchResult) ? batchResult : [batchResult]);
          }
          processed += batch.length;
        
          // Callback de progresso
          if (options.onProgress) {
            options.onProgress({
              processed: processed,
              total: items.length,
              percentage: Math.round((processed / items.length) * 100)
            });
          }
        
          // Delay entre lotes
          if (options.delayMs && i + batchSize < items.length) {
            Utilities.sleep(options.delayMs);
          }
        
        } catch (e) {
          errors.push({ batch: Math.floor(i / batchSize), error: e.message });
          if (!options.continueOnError) {
            break;
          }
        }
      }
    
      return { processed: processed, total: items.length, results: results, errors: errors };
    } catch (error) {
      Logger.log("Erro em processBatch: " + error.message);
      throw error;
    }
  }

  // ============================================================================
  // API PÚBLICA
  // ============================================================================

  return {
    // Planilha
    findColumnIndex: findColumnIndex,
    getSheetDataMapped: getSheetDataMapped,
    getOrCreateSheet: getOrCreateSheet,
    
    // Validação
    validateRequired: validateRequired,
    isValidEmail: isValidEmail,
    isValidCNPJFormat: isValidCNPJFormat,
    isValidCPFFormat: isValidCPFFormat,
    
    // Data/Hora
    formatDate: formatDate,
    daysBetween: daysBetween,
    addBusinessDays: addBusinessDays,
    
    // Formatação
    formatCurrency: formatCurrency,
    formatCNPJ: formatCNPJ,
    formatCPF: formatCPF,
    
    // Agregação
    groupBy: groupBy,
    sumBy: sumBy,
    countBy: countBy,
    
    // Relatório
    generateReportHeader: generateReportHeader,
    generateReportFooter: generateReportFooter,
    
    // Processamento
    processBatch: processBatch
  };

})();

// ============================================================================
// ALIASES GLOBAIS PARA COMPATIBILIDADE
// ============================================================================

/**
 * Alias global para findColumnIndex (usado em Dominio_Documentos.gs)
 */
function _findHeaderIndex(headers, aliases) {
  return RefactoringHelpers.findColumnIndex(headers, aliases);
}

/**
 * Alias global para criar sheet temporária
 */
function createTemporarySheet(name, headers) {
  return RefactoringHelpers.getOrCreateSheet(name, headers);
}

Logger.log('✅ Core_Refactoring_Helpers.gs carregado');
