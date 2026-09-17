/**
 * Core_Spreadsheet_Helper.gs
 * Funções helper para acesso otimizado a spreadsheets
 * 
 * NOTA: As funções getSpreadsheet, getSheet e getSheetHeaders estão definidas
 * canonicamente em Core_Sheet_Accessor.gs. Este arquivo delega para lá.
 * 
 * @see Core_Sheet_Accessor.gs para implementação principal
 */

// NOTA: getSpreadsheet, getSheet e getSheetHeaders são definidos em Core_Sheet_Accessor.gs
// Não redefinir aqui para evitar conflitos de nomenclatura

/**
 * Obtém headers de uma sheet (wrapper para compatibilidade)
 * @deprecated Use getSheetHeaders() de Core_Sheet_Accessor.gs diretamente
 * @param {string} sheetName
 * @return {Array}
 */
function getHeaders(sheetName) {
  // Delega para a implementação canônica
  if (typeof getSheetHeaders === 'function') {
    return getSheetHeaders(sheetName);
  }
  return getCachedHeaders(sheetName);
}

/**
 * Obtém sheet ou cria se não existir
 * @param {string} sheetName
 * @param {Array} headers - Headers opcionais
 * @return {Sheet}
 */
function getOrCreateSheet(sheetName, headers) {
  try {
    var sheet = getSheet(sheetName);

    if (!sheet) {
      var ss = getSpreadsheet();
      sheet = ss.insertSheet(sheetName);

      if (headers && headers.length > 0) {
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      }

      // Limpar cache para forçar reload
      clearSheetCache(sheetName);
    }

    return sheet;
  } catch (error) {
    Logger.log("Erro em getOrCreateSheet: " + error.message);
    throw error; // Re-lança para tratamento superior
  }
}

/**
 * Lê dados de uma sheet com cache de headers
 * @param {string} sheetName
 * @param {number} startRow - Linha inicial (padrão: 2)
 * @param {number} maxRows - Máximo de linhas (opcional)
 * @return {Array} Array de objetos com dados
 */
function readSheetData(sheetName, startRow, maxRows) {
  try {
    try {
      startRow = startRow || 2;

      var sheet = getSheet(sheetName);
      if (!sheet) return [];

      var lastRow = sheet.getLastRow();
      if (lastRow < startRow) return [];

      var headers = getHeaders(sheetName);
      if (headers.length === 0) return [];

      var numRows = maxRows ? Math.min(maxRows, lastRow - startRow + 1) : lastRow - startRow + 1;
      if (numRows <= 0) return [];

      var data = sheet.getRange(startRow, 1, numRows, headers.length).getValues();

      // Converter para array de objetos
      return data.map(function(row) {
        var obj = {};
        headers.forEach(function(header, index) {
          obj[header] = row[index];
        });
        return obj;
      });
    } catch (error) {
      Logger.log("Erro em readSheetData: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em readSheetData: " + error.message);
    throw error;
  }
}

/**
 * Escreve dados em uma sheet
 * @param {string} sheetName
 * @param {Array} data - Array de arrays ou objetos
 * @param {boolean} append - Se true, adiciona ao final
 * @return {boolean} Sucesso
 */
function writeSheetData(sheetName, data, append) {
  try {
    try {
      try {
        if (!data || data.length === 0) return false;

        var sheet = getSheet(sheetName);
        if (!sheet) return false;

        var headers = getHeaders(sheetName);

        // Converter objetos para arrays se necessário
        var rows = data.map(function(item) {
          if (Array.isArray(item)) {
            return item;
          } else {
            return headers.map(function(header) {
              return item[header] === undefined || item[header] === null
                ? ''
                : item[header];
            });
          }
        });

        if (append) {
          var lastRow = sheet.getLastRow();
          sheet.getRange(lastRow + 1, 1, rows.length, rows[0].length).setValues(rows);
        } else {
          sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
        }

        return true;
      } catch (error) {
        Logger.log("Erro em writeSheetData: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em writeSheetData: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em writeSheetData: " + error.message);
    throw error;
  }
}

/**
 * Busca índice de coluna por nome do header
 * @param {string} sheetName
 * @param {string} headerName
 * @return {number} Índice (1-based) ou -1 se não encontrado
 */
function getColumnIndex(sheetName, headerName) {
  var headers = getHeaders(sheetName);
  var index = headers.indexOf(headerName);
  return index >= 0 ? index + 1 : -1;
}

/**
 * Atualiza uma célula específica
 * @param {string} sheetName
 * @param {number} row
 * @param {string} columnName
 * @param {*} value
 * @return {boolean} Sucesso
 */
function updateCell(sheetName, row, columnName, value) {
  try {
    var sheet = getSheet(sheetName);
    if (!sheet) return false;

    var colIndex = getColumnIndex(sheetName, columnName);
    if (colIndex < 0) return false;

    sheet.getRange(row, colIndex).setValue(value);
    return true;
  } catch (error) {
    Logger.log("Erro em updateCell: " + error.message);
    throw error; // Re-lança para tratamento superior
  }
}

/**
 * Deleta uma linha
 * @param {string} sheetName
 * @param {number} rowIndex
 * @return {boolean} Sucesso
 */
function deleteRow(sheetName, rowIndex) {
  try {
    try {
      var sheet = getSheet(sheetName);
      if (!sheet) return false;

      if (rowIndex < 2 || rowIndex > sheet.getLastRow()) return false;

      sheet.deleteRow(rowIndex);
      return true;
    } catch (error) {
      Logger.log("Erro em deleteRow: " + error.message);
      throw error; // Re-lança para tratamento superior
    }
  } catch (error) {
    Logger.log("Erro em deleteRow: " + error.message);
    throw error;
  }
}
