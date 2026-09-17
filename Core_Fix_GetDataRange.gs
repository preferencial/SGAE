/**
 * Core_Fix_GetDataRange.gs
 * Funções helper para substituir getDataRange() de forma segura
 */

/**
 * Substituto seguro para getDataRange().getValues()
 * Evita carregar células vazias desnecessárias
 *
 * @param {Sheet} sheet - Sheet para ler
 * @param {number} maxRows - Máximo de linhas (opcional)
 * @param {number} maxCols - Máximo de colunas (opcional)
 * @return {Array} Array 2D com valores
 */
function getSafeDataRange(sheet, maxRows, maxCols) {
  try {
    if (!sheet) return [[]];

    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();

    if (lastRow === 0 || lastCol === 0) return [[]];

    // Limitar se especificado
    if (maxRows && maxRows < lastRow) lastRow = maxRows;
    if (maxCols && maxCols < lastCol) lastCol = maxCols;

    return sheet.getRange(1, 1, lastRow, lastCol).getValues();
  } catch (error) {
    Logger.log("Erro em getSafeDataRange: " + error.message);
    throw error;
  }
}

/**
 * Lê dados de uma sheet com headers
 * Retorna array de objetos
 *
 * @param {Sheet} sheet - Sheet para ler
 * @param {number} limit - Limite de linhas (opcional)
 * @return {Array<Object>} Array de objetos
 */
function getSheetDataAsObjects(sheet, limit) {
  try {
    try {
      if (!sheet) return [];

      var lastRow = sheet.getLastRow();
      var lastCol = sheet.getLastColumn();

      if (lastRow <= 1 || lastCol === 0) return [];

      var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

      var numRows = limit ? Math.min(limit, lastRow - 1) : lastRow - 1;
      if (numRows <= 0) return [];

      var data = sheet.getRange(2, 1, numRows, lastCol).getValues();

      return data.map(function(row, index) {
        var obj = { _rowIndex: index + 2 }; // Guardar índice da linha
        headers.forEach(function(header, i) {
          obj[header] = row[i];
        });
        return obj;
      });
    } catch (error) {
      Logger.log("Erro em getSheetDataAsObjects: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em getSheetDataAsObjects: " + error.message);
    throw error;
  }
}

/**
 * Busca em uma sheet por valor em coluna específica
 * Mais eficiente que carregar tudo
 *
 * @param {Sheet} sheet - Sheet para buscar
 * @param {string} columnName - Nome da coluna
 * @param {*} value - Valor para buscar
 * @return {Object|null} Objeto encontrado ou null
 */
function findInSheet(sheet, columnName, value) {
  try {
    try {
      if (!sheet) return null;

      var lastRow = sheet.getLastRow();
      var lastCol = sheet.getLastColumn();

      if (lastRow <= 1 || lastCol === 0) return null;

      var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
      var colIndex = headers.indexOf(columnName);

      if (colIndex === -1) return null;

      // Buscar apenas na coluna específica
      var columnData = sheet.getRange(2, colIndex + 1, lastRow - 1, 1).getValues();

      for (var i = 0; i < columnData.length; i++) {
        if (columnData[i][0] === value) {
          // Encontrou! Agora pegar a linha completa
          var rowData = sheet.getRange(i + 2, 1, 1, lastCol).getValues()[0];
          var obj = { _rowIndex: i + 2 };
          headers.forEach(function(header, j) {
            obj[header] = rowData[j];
          });
          return obj;
        }
      }

      return null;
    } catch (error) {
      Logger.log("Erro em findInSheet: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em findInSheet: " + error.message);
    throw error;
  }
}

/**
 * Filtra dados de uma sheet por condição
 * Mais eficiente para grandes volumes
 *
 * @param {Sheet} sheet - Sheet para filtrar
 * @param {Function} filterFn - Função de filtro (recebe objeto, retorna boolean)
 * @param {number} limit - Limite de resultados (opcional)
 * @return {Array<Object>} Array de objetos filtrados
 */
function filterSheetData(sheet, filterFn, limit) {
  try {
    try {
      if (!sheet || typeof filterFn !== 'function') return [];

      var lastRow = sheet.getLastRow();
      var lastCol = sheet.getLastColumn();

      if (lastRow <= 1 || lastCol === 0) return [];

      var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
      var data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

      var results = [];

      for (var i = 0; i < data.length; i++) {
        var obj = { _rowIndex: i + 2 };
        headers.forEach(function(header, j) {
          obj[header] = data[i][j];
        });

        if (filterFn(obj)) {
          results.push(obj);
          if (limit && results.length >= limit) break;
        }
      }

      return results;
    } catch (error) {
      Logger.log("Erro em filterSheetData: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em filterSheetData: " + error.message);
    throw error;
  }
}

/**
 * Conta linhas que atendem condição
 * Sem carregar todos os dados
 *
 * @param {Sheet} sheet - Sheet para contar
 * @param {string} columnName - Nome da coluna
 * @param {*} value - Valor para contar
 * @return {number} Quantidade de linhas
 */
function countInSheet(sheet, columnName, value) {
  try {
    try {
      if (!sheet) return 0;

      var lastRow = sheet.getLastRow();
      var lastCol = sheet.getLastColumn();

      if (lastRow <= 1 || lastCol === 0) return 0;

      var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
      var colIndex = headers.indexOf(columnName);

      if (colIndex === -1) return 0;

      var columnData = sheet.getRange(2, colIndex + 1, lastRow - 1, 1).getValues();

      var count = 0;
      for (var i = 0; i < columnData.length; i++) {
        if (columnData[i][0] === value) count++;
      }

      return count;
    } catch (error) {
      Logger.log("Erro em countInSheet: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em countInSheet: " + error.message);
    throw error;
  }
}

/**
 * Obtém estatísticas de uma coluna numérica
 *
 * @param {Sheet} sheet - Sheet para analisar
 * @param {string} columnName - Nome da coluna
 * @return {Object} Estatísticas (sum, avg, min, max, count)
 */
function getColumnStats(sheet, columnName) {
  try {
    try {
      if (!sheet) return null;

      var lastRow = sheet.getLastRow();
      var lastCol = sheet.getLastColumn();

      if (lastRow <= 1 || lastCol === 0) return null;

      var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
      var colIndex = headers.indexOf(columnName);

      if (colIndex === -1) return null;

      var columnData = sheet.getRange(2, colIndex + 1, lastRow - 1, 1).getValues();

      var stats = {
        sum: 0,
        count: 0,
        min: null,
        max: null,
        avg: 0
      };

      for (var i = 0; i < columnData.length; i++) {
        var val = parseFloat(columnData[i][0]);
        if (!isNaN(val)) {
          stats.sum += val;
          stats.count++;
          if (stats.min === null || val < stats.min) stats.min = val;
          if (stats.max === null || val > stats.max) stats.max = val;
        }
      }

      if (stats.count > 0) {
        stats.avg = stats.sum / stats.count;
      }

      return stats;
    } catch (error) {
      Logger.log("Erro em getColumnStats: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em getColumnStats: " + error.message);
    throw error;
  }
}
