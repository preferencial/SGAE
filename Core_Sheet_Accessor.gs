/**
 * @fileoverview Acessor Unificado de Planilhas
 * @version 5.0.0
 *
 * Fornece acesso padronizado às abas da planilha,
 * usando o SCHEMA como fonte única de verdade.
 *
 * Resolve problemas de:
 * - Nomes de abas inconsistentes
 * - Campos não encontrados
 * - Cache de referências
 *
 * @author UNIAE CRE Team
 * @created 2025-12-04
 */

'use strict';

/**
 * Cache de referências de sheets para evitar múltiplas chamadas
 */
var _sheetCache = {};
var _spreadsheetRef = null;

/**
 * Obtém referência à planilha principal
 * @returns {Spreadsheet}
 */
function getSpreadsheet() {
  if (!_spreadsheetRef) {
    try {
      // Tenta obter a planilha ativa
      _spreadsheetRef = getSS();

      // Se não houver planilha ativa, tenta pelo ID nas propriedades
      if (!_spreadsheetRef) {
        var props = PropertiesService.getScriptProperties();
        var ssId = props.getProperty('SPREADSHEET_ID');
        if (ssId) {
          _spreadsheetRef = SpreadsheetApp.openById(ssId);
        }
      }
    } catch (e) {
      if (typeof AppLogger !== 'undefined') {
        AppLogger.error('Erro ao obter spreadsheet', e);
      }
      throw new Error('Não foi possível acessar a planilha: ' + e.message);
    }
  }
  return _spreadsheetRef;
}

/**
 * Obtém uma aba da planilha pelo nome
 * Usa o SCHEMA para resolver aliases e nomes canônicos
 *
 * @param {string} sheetName - Nome da aba (canônico, alias ou real)
 * @param {boolean} [createIfMissing=false] - Criar aba se não existir
 * @returns {Sheet} Referência à aba
 * @throws {Error} Se a aba não existir e createIfMissing for false
 */
function getSheet(sheetName, createIfMissing) {
  try {
    // Resolve o nome real usando o SCHEMA
    var realName = sheetName;
    if (typeof SCHEMA !== 'undefined') {
      realName = SCHEMA.getSheetName(sheetName);
    }

    // Verifica cache
    if (_sheetCache[realName]) {
      return _sheetCache[realName];
    }

    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(realName);

    // Se não encontrou, tenta variações comuns
    if (!sheet) {
      var variations = [
        sheetName,
        sheetName.replace(/_/g, ''),
        sheetName.replace(/-/g, '_'),
        sheetName.toLowerCase(),
        sheetName.toUpperCase()
      ];

      for (var i = 0; i < variations.length; i++) {
        sheet = ss.getSheetByName(variations[i]);
        if (sheet) {
          realName = variations[i];
          break;
        }
      }
    }

    // Se ainda não encontrou e deve criar
    if (!sheet && createIfMissing) {
      sheet = _createSheetWithStructure(ss, sheetName);
      realName = sheet.getName();
    }

    // Se não encontrou e não deve criar, erro
    if (!sheet) {
      throw new Error('Aba não encontrada: ' + sheetName + ' (tentou: ' + realName + ')');
    }

    // Armazena no cache
    _sheetCache[realName] = sheet;

    return sheet;
  } catch (error) {
    Logger.log("Erro em getSheet: " + error.message);
    throw error;
  }
}

/**
 * Cria uma aba com a estrutura definida no SCHEMA
 * @private
 */
function _createSheetWithStructure(ss, sheetName) {
  try {
    var realName = sheetName;
    if (typeof SCHEMA !== 'undefined') {
      realName = SCHEMA.getSheetName(sheetName);
    }

    var sheet = ss.insertSheet(realName);

    // Obtém colunas do SCHEMA
    var columns = [];
    if (typeof SCHEMA !== 'undefined') {
      columns = SCHEMA.getColumns(sheetName);
    }

    if (columns.length > 0) {
      // Define headers
      var headerRange = sheet.getRange(1, 1, 1, columns.length);
      headerRange.setValues([columns]);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#4285f4');
      headerRange.setFontColor('#ffffff');

      // Congela primeira linha
      sheet.setFrozenRows(1);

      // Auto-resize
      for (var i = 1; i <= columns.length; i++) {
        sheet.autoResizeColumn(i);
      }

      // Aplica validações
      if (typeof SCHEMA !== 'undefined') {
        var validations = SCHEMA.getValidations(sheetName);
        _applyValidations(sheet, columns, validations);
      }
    }

    if (typeof AppLogger !== 'undefined') {
      AppLogger.log('Aba criada: ' + realName);
    }

    return sheet;
  } catch (error) {
    Logger.log("Erro em _createSheetWithStructure: " + error.message);
    throw error; // Re-lança para tratamento superior
  }
}

/**
 * Aplica validações de dados
 * @private
 */
function _applyValidations(sheet, columns, validations) {
  try {
    try {
      if (!validations) return;

      Object.keys(validations).forEach(function(columnName) {
        var colIndex = columns.indexOf(columnName);
        if (colIndex === -1) return;

        var values = validations[columnName];
        var rule = SpreadsheetApp.newDataValidation()
          .requireValueInList(values, true)
          .setAllowInvalid(false)
          .build();

        // Aplica da linha 2 até 1000
        var range = sheet.getRange(2, colIndex + 1, 999, 1);
        range.setDataValidation(rule);
      });
    } catch (error) {
      Logger.log("Erro em _applyValidations: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em _applyValidations: " + error.message);
    throw error;
  }
}

/**
 * Obtém os headers de uma aba
 * @param {string} sheetName - Nome da aba
 * @returns {Array<string>} Lista de headers
 */
function getSheetHeaders(sheetName) {
  try {
    try {
      var sheet = getSheet(sheetName);
      var lastCol = sheet.getLastColumn();

      if (lastCol === 0) {
        // Aba vazia, retorna do SCHEMA
        if (typeof SCHEMA !== 'undefined') {
          return SCHEMA.getColumns(sheetName);
        }
        return [];
      }

      return sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    } catch (error) {
      Logger.log("Erro em getSheetHeaders: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em getSheetHeaders: " + error.message);
    throw error;
  }
}

/**
 * Obtém o índice de uma coluna pelo nome
 * @param {string} sheetName - Nome da aba
 * @param {string} columnName - Nome da coluna
 * @returns {number} Índice (1-based) ou -1 se não encontrado
 */
function getColumnIndex(sheetName, columnName) {
  var headers = getSheetHeaders(sheetName);
  var index = headers.indexOf(columnName);
  return index >= 0 ? index + 1 : -1;
}

/**
 * Verifica se uma aba existe
 * @param {string} sheetName - Nome da aba
 * @returns {boolean}
 */
function sheetExists(sheetName) {
  try {
    var realName = sheetName;
    if (typeof SCHEMA !== 'undefined') {
      realName = SCHEMA.getSheetName(sheetName);
    }

    var ss = getSpreadsheet();
    return ss.getSheetByName(realName) !== null;
  } catch (e) {
    return false;
  }
}

/**
 * Limpa o cache de sheets
 * Útil após operações que modificam a estrutura
 */
function clearSheetCache() {
  _sheetCache = {};
  _spreadsheetRef = null;
}

/**
 * Obtém dados de uma aba como array de objetos
 * @param {string} sheetName - Nome da aba
 * @param {Object} [options] - Opções
 * @param {number} [options.startRow=2] - Linha inicial (1-based)
 * @param {number} [options.maxRows] - Máximo de linhas
 * @returns {Array<Object>} Array de objetos com dados
 */
function getSheetData(sheetName, options) {
  try {
    options = options || {};
    var startRow = options.startRow || 2;
    var maxRows = options.maxRows || 10000;

    var sheet = getSheet(sheetName);
    var headers = getSheetHeaders(sheetName);
    var lastRow = sheet.getLastRow();

    if (lastRow < startRow) {
      return [];
    }

    var numRows = Math.min(lastRow - startRow + 1, maxRows);
    var data = sheet.getRange(startRow, 1, numRows, headers.length).getValues();

    return data.map(function(row) {
      var obj = {};
      headers.forEach(function(header, index) {
        obj[header] = row[index];
      });
      return obj;
    }).filter(function(obj) {
      // Remove linhas vazias (onde ID está vazio)
      return obj.ID || obj.id || obj[headers[0]];
    });
  } catch (error) {
    Logger.log("Erro em getSheetData: " + error.message);
    throw error;
  }
}

/**
 * Adiciona uma linha à aba
 * @param {string} sheetName - Nome da aba
 * @param {Object} data - Dados a inserir
 * @returns {number} Número da linha inserida
 */
function appendToSheet(sheetName, data) {
  try {
    try {
      var sheet = getSheet(sheetName);
      var headers = getSheetHeaders(sheetName);

      var row = headers.map(function(header) {
        return data[header] !== undefined ? data[header] : '';
      });

      sheet.appendRow(row);
      return sheet.getLastRow();
    } catch (error) {
      Logger.log("Erro em appendToSheet: " + error.message);
      throw error; // Re-lança para tratamento superior
    }
  } catch (error) {
    Logger.log("Erro em appendToSheet: " + error.message);
    throw error;
  }
}

/**
 * Atualiza uma linha na aba
 * @param {string} sheetName - Nome da aba
 * @param {number} rowIndex - Índice da linha (1-based)
 * @param {Object} data - Dados a atualizar
 */
function updateSheetRow(sheetName, rowIndex, data) {
  try {
    try {
      var sheet = getSheet(sheetName);
      var headers = getSheetHeaders(sheetName);

      Object.keys(data).forEach(function(key) {
        var colIndex = headers.indexOf(key);
        if (colIndex >= 0) {
          sheet.getRange(rowIndex, colIndex + 1).setValue(data[key]);
        }
      });
    } catch (error) {
      Logger.log("Erro em updateSheetRow: " + error.message);
      throw error; // Re-lança para tratamento superior
    }
  } catch (error) {
    Logger.log("Erro em updateSheetRow: " + error.message);
    throw error;
  }
}

/**
 * Obtém dados de uma planilha de forma segura
 * @param {Sheet} sheet - A aba da planilha
 * @param {number} [maxRows] - Máximo de linhas a ler
 * @returns {Array<Array<*>>} Matriz de dados
 */
function getSafeDataRange(sheet, maxRows) {
  try {
    try {
      if (!sheet) return [];
      var lastRow = sheet.getLastRow();
      var lastCol = sheet.getLastColumn();
      if (lastRow === 0 || lastCol === 0) return [];
  
      var numRows = lastRow;
      if (maxRows && maxRows < lastRow) {
        numRows = maxRows;
      }
  
      return sheet.getRange(1, 1, numRows, lastCol).getValues();
    } catch (error) {
      Logger.log("Erro em getSafeDataRange: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em getSafeDataRange: " + error.message);
    throw error;
  }
}

// ============================================================================
// REGISTRO DO MÓDULO
// ============================================================================

if (typeof AppLogger !== 'undefined') {
  AppLogger.debug('Core_Sheet_Accessor carregado');
}
