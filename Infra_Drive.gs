'use strict';

/**
 * INFRA_DRIVE
 * Consolidado de : DriveFileCreator.gs, DriveFileManager.gs
 * @version 2.0.0
 * @created 2025-11-04
 */


// ---- DriveFileCreator.gs ----
/**
 * DriveFileCreator.gs
 * Funções para criar arquivos no Drive ao invés de abas
 * Pasta do Drive : 1w1_45AjB_wB4KMZbP6JevqD382FyBZ53
 * Gerado automaticamente por transform_sheets_to_drive.py
 */


// Transformado : Criar arquivo no Drive ao invés de aba
function criarPrecos_AntieconomicosNoDrive(dados, opcoes) {
    try {
      opcoes = opcoes || {};
      var folderId = opcoes.folderId || '1w1_45AjB_wB4KMZbP6JevqD382FyBZ53';
      var folder = DriveApp.getFolderById(folderId);

      var timestamp = Utilities.formatDate(new Date(), 'GMT-3', 'yyyyMMdd_HHmmss');
      var fileName = opcoes.fileName || 'Precos_Antieconomicos_' + timestamp;

      var ss = SpreadsheetApp.create(fileName);
      var sheet = ss.getActiveSheet();
      sheet.setName('Precos_Antieconomicos');

      // Escrever dados
      if (dados && dados.length > 0) {
        sheet.getRange(1, 1, dados.length, dados[0].length).setValues(dados);

        // Formatar cabeçalho se especificado
        if (opcoes.formatHeader) {
          sheet.getRange(1, 1, 1, dados[0].length)
            .setFontWeight('bold')
            .setBackground('#eeeeee');
        }

        // Auto-resize colunas
        if (opcoes.autoResize != false) {
          for (var i = 1; i <= dados[0].length; i++) {
            sheet.autoResizeColumn(i);
          }
        }
      }

      // Mover para pasta
      var fileId = ss.getId();
      var file = DriveApp.getFileById(fileId);
      folder.addFile(file);
      DriveApp.getRootFolder().removeFile(file);

      return {
        success : true,
        fileId : fileId,
        fileName : fileName,
        url : ss.getUrl(),
        sheetName : 'Precos_Antieconomicos'
      };

    } catch (error) {
      Logger.log('Erro ao criar Precos_Antieconomicos no Drive : ' + error.message);
      return {
        success : false,
        error : error.message
      };
    }
}


  // Transformado : Criar arquivo no Drive ao invés de aba
  function criarAnalise_GenerativaNoDrive(dados, opcoes) {
    try {
      opcoes = opcoes || {};
      var folderId = opcoes.folderId || '1w1_45AjB_wB4KMZbP6JevqD382FyBZ53';
      var folder = DriveApp.getFolderById(folderId);

      var timestamp = Utilities.formatDate(new Date(), 'GMT-3', 'yyyyMMdd_HHmmss');
      var fileName = opcoes.fileName || 'Analise_Generativa_' + timestamp;

      var ss = SpreadsheetApp.create(fileName);
      var sheet = ss.getActiveSheet();
      sheet.setName('Analise_Generativa');

      // Escrever dados
      if (dados && dados.length > 0) {
        sheet.getRange(1, 1, dados.length, dados[0].length).setValues(dados);

        // Formatar cabeçalho se especificado
        if (opcoes.formatHeader) {
          sheet.getRange(1, 1, 1, dados[0].length)
            .setFontWeight('bold')
            .setBackground('#eeeeee');
        }

        // Auto-resize colunas
        if (opcoes.autoResize != false) {
          for (var i = 1; i <= dados[0].length; i++) {
            sheet.autoResizeColumn(i);
          }
        }
      }

      // Mover para pasta
      var fileId = ss.getId();
      var file = DriveApp.getFileById(fileId);
      folder.addFile(file);
      DriveApp.getRootFolder().removeFile(file);

      return {
        success : true,
        fileId : fileId,
        fileName : fileName,
        url : ss.getUrl(),
        sheetName : 'Analise_Generativa'
      };

    } catch (error) {
      Logger.log('Erro ao criar Analise_Generativa no Drive : ' + error.message);
      return {
        success : false,
        error : error.message
      };
    }
}


  // Transformado : Criar arquivo no Drive ao invés de aba
  function criarnomeAbaNoDrive(dados, opcoes) {
    try {
      opcoes = opcoes || {};
      var folderId = opcoes.folderId || '1w1_45AjB_wB4KMZbP6JevqD382FyBZ53';
      var folder = DriveApp.getFolderById(folderId);

      var timestamp = Utilities.formatDate(new Date(), 'GMT-3', 'yyyyMMdd_HHmmss');
      var fileName = opcoes.fileName || 'nomeAba_' + timestamp;

      var ss = SpreadsheetApp.create(fileName);
      var sheet = ss.getActiveSheet();
      sheet.setName('nomeAba');

      // Escrever dados
      if (dados && dados.length > 0) {
        sheet.getRange(1, 1, dados.length, dados[0].length).setValues(dados);

        // Formatar cabeçalho se especificado
        if (opcoes.formatHeader) {
          sheet.getRange(1, 1, 1, dados[0].length)
            .setFontWeight('bold')
            .setBackground('#eeeeee');
        }

        // Auto-resize colunas
        if (opcoes.autoResize != false) {
          for (var i = 1; i <= dados[0].length; i++) {
            sheet.autoResizeColumn(i);
          }
        }
      }

      // Mover para pasta
      var fileId = ss.getId();
      var file = DriveApp.getFileById(fileId);
      folder.addFile(file);
      DriveApp.getRootFolder().removeFile(file);

      return {
        success : true,
        fileId : fileId,
        fileName : fileName,
        url : ss.getUrl(),
        sheetName : 'nomeAba'
      };

    } catch (error) {
      Logger.log('Erro ao criar nomeAba no Drive : ' + error.message);
      return {
        success : false,
        error : error.message
      };
    }
}


  // Transformado : Criar arquivo no Drive ao invés de aba
  function criarConfig_ComissaoNoDrive(dados, opcoes) {
    try {
      opcoes = opcoes || {};
      var folderId = opcoes.folderId || '1w1_45AjB_wB4KMZbP6JevqD382FyBZ53';
      var folder = DriveApp.getFolderById(folderId);

      var timestamp = Utilities.formatDate(new Date(), 'GMT-3', 'yyyyMMdd_HHmmss');
      var fileName = opcoes.fileName || 'Config_Comissao_' + timestamp;

      var ss = SpreadsheetApp.create(fileName);
      var sheet = ss.getActiveSheet();
      sheet.setName('Config_Comissao');

      // Escrever dados
      if (dados && dados.length > 0) {
        sheet.getRange(1, 1, dados.length, dados[0].length).setValues(dados);

        // Formatar cabeçalho se especificado
        if (opcoes.formatHeader) {
          sheet.getRange(1, 1, 1, dados[0].length)
            .setFontWeight('bold')
            .setBackground('#eeeeee');
        }

        // Auto-resize colunas
        if (opcoes.autoResize != false) {
          for (var i = 1; i <= dados[0].length; i++) {
            sheet.autoResizeColumn(i);
          }
        }
      }

      // Mover para pasta
      var fileId = ss.getId();
      var file = DriveApp.getFileById(fileId);
      folder.addFile(file);
      DriveApp.getRootFolder().removeFile(file);

      return {
        success : true,
        fileId : fileId,
        fileName : fileName,
        url : ss.getUrl(),
        sheetName : 'Config_Comissao'
      };

    } catch (error) {
      Logger.log('Erro ao criar Config_Comissao no Drive : ' + error.message);
      return {
        success : false,
        error : error.message
      };
    }
}


  // Transformado : Criar arquivo no Drive ao invés de aba
  function criarConfig_Textos_PadraoNoDrive(dados, opcoes) {
    try {
      opcoes = opcoes || {};
      var folderId = opcoes.folderId || '1w1_45AjB_wB4KMZbP6JevqD382FyBZ53';
      var folder = DriveApp.getFolderById(folderId);

      var timestamp = Utilities.formatDate(new Date(), 'GMT-3', 'yyyyMMdd_HHmmss');
      var fileName = opcoes.fileName || 'Config_Textos_Padrao_' + timestamp;

      var ss = SpreadsheetApp.create(fileName);
      var sheet = ss.getActiveSheet();
      sheet.setName('Config_Textos_Padrao');

      // Escrever dados
      if (dados && dados.length > 0) {
        sheet.getRange(1, 1, dados.length, dados[0].length).setValues(dados);

        // Formatar cabeçalho se especificado
        if (opcoes.formatHeader) {
          sheet.getRange(1, 1, 1, dados[0].length)
            .setFontWeight('bold')
            .setBackground('#eeeeee');
        }

        // Auto-resize colunas
        if (opcoes.autoResize != false) {
          for (var i = 1; i <= dados[0].length; i++) {
            sheet.autoResizeColumn(i);
          }
        }
      }

      // Mover para pasta
      var fileId = ss.getId();
      var file = DriveApp.getFileById(fileId);
      folder.addFile(file);
      DriveApp.getRootFolder().removeFile(file);

      return {
        success : true,
        fileId : fileId,
        fileName : fileName,
        url : ss.getUrl(),
        sheetName : 'Config_Textos_Padrao'
      };

    } catch (error) {
      Logger.log('Erro ao criar Config_Textos_Padrao no Drive : ' + error.message);
      return {
        success : false,
        error : error.message
      };
    }
}


  // Transformado : Criar arquivo no Drive ao invés de aba
  function criarAtesto_GEVMONNoDrive(dados, opcoes) {
    try {
      opcoes = opcoes || {};
      var folderId = opcoes.folderId || '1w1_45AjB_wB4KMZbP6JevqD382FyBZ53';
      var folder = DriveApp.getFolderById(folderId);

      var timestamp = Utilities.formatDate(new Date(), 'GMT-3', 'yyyyMMdd_HHmmss');
      var fileName = opcoes.fileName || 'Atesto_GEVMON_' + timestamp;

      var ss = SpreadsheetApp.create(fileName);
      var sheet = ss.getActiveSheet();
      sheet.setName('Atesto_GEVMON');

      // Escrever dados
      if (dados && dados.length > 0) {
        sheet.getRange(1, 1, dados.length, dados[0].length).setValues(dados);

        // Formatar cabeçalho se especificado
        if (opcoes.formatHeader) {
          sheet.getRange(1, 1, 1, dados[0].length)
            .setFontWeight('bold')
            .setBackground('#eeeeee');
        }

        // Auto-resize colunas
        if (opcoes.autoResize != false) {
          for (var i = 1; i <= dados[0].length; i++) {
            sheet.autoResizeColumn(i);
          }
        }
      }

      // Mover para pasta
      var fileId = ss.getId();
      var file = DriveApp.getFileById(fileId);
      folder.addFile(file);
      DriveApp.getRootFolder().removeFile(file);

      return {
        success : true,
        fileId : fileId,
        fileName : fileName,
        url : ss.getUrl(),
        sheetName : 'Atesto_GEVMON'
      };

    } catch (error) {
      Logger.log('Erro ao criar Atesto_GEVMON no Drive : ' + error.message);
      return {
        success : false,
        error : error.message
      };
    }


  // Transformado : Criar relatório no Drive ao invés de aba
  function criarRelatorio_ComissaoNoDrive(dados) {
    try {
      var folderId = '1w1_45AjB_wB4KMZbP6JevqD382FyBZ53';
      var folder = DriveApp.getFolderById(folderId);

      var timestamp = Utilities.formatDate(new Date(), 'GMT-3', 'yyyyMMdd_HHmmss');
      var fileName = 'Relatorio_Comissao_' + timestamp;

      // Criar arquivo no Drive
      var file;
      if ('spreadsheet' == 'spreadsheet') {
        var ss = SpreadsheetApp.create(fileName);
        var sheet = ss.getActiveSheet();

        // Escrever dados
        if (dados && dados.length > 0) {
          sheet.getRange(1, 1, dados.length, dados[0].length).setValues(dados);
        }

        // Mover para pasta correta
        var fileId = ss.getId();
        file = DriveApp.getFileById(fileId);
        folder.addFile(file);
        DriveApp.getRootFolder().removeFile(file);

        return {
          success : true,
          fileId : fileId,
          fileName : fileName,
          url : ss.getUrl()
        };
      } else {
        // Criar documento
        var doc = DocumentApp.create(fileName);
        var body = doc.getBody();

        // Escrever dados
        if (dados && dados.length > 0) {
          dados.forEach(function(row) {
            body.appendParagraph(row.join(' | '));
          });
        }

        // Mover para pasta correta
        var fileId = doc.getId();
        file = DriveApp.getFileById(fileId);
        folder.addFile(file);
        DriveApp.getRootFolder().removeFile(file);

        return {
          success : true,
          fileId : fileId,
          fileName : fileName,
          url : doc.getUrl()
        };
      }
    } catch (error) {
      Logger.log('Erro ao criar Relatorio_Comissao no Drive : ' + error.message);
      return {
        success : false,
        error : error.message
      };
    }
}


  // Transformado : Criar arquivo no Drive ao invés de aba
  function criarDemonstrativo_ConsumoNoDrive(dados, opcoes) {
    try {
        opcoes = opcoes || {};
        var folderId = opcoes.folderId || '1w1_45AjB_wB4KMZbP6JevqD382FyBZ53';
        var folder = DriveApp.getFolderById(folderId);

        var timestamp = Utilities.formatDate(new Date(), 'GMT-3', 'yyyyMMdd_HHmmss');
        var fileName = opcoes.fileName || 'Demonstrativo_Consumo_' + timestamp;

        var ss = SpreadsheetApp.create(fileName);
        var sheet = ss.getActiveSheet();
        sheet.setName('Demonstrativo_Consumo');

        // Escrever dados
        if (dados && dados.length > 0) {
          sheet.getRange(1, 1, dados.length, dados[0].length).setValues(dados);

          // Formatar cabeçalho se especificado
          if (opcoes.formatHeader) {
            sheet.getRange(1, 1, 1, dados[0].length)
              .setFontWeight('bold')
              .setBackground('#eeeeee');
          }

          // Auto-resize colunas
          if (opcoes.autoResize != false) {
            for (var i = 1; i <= dados[0].length; i++) {
              sheet.autoResizeColumn(i);
            }
          }
        }

        // Mover para pasta
        var fileId = ss.getId();
        var file = DriveApp.getFileById(fileId);
        folder.addFile(file);
        DriveApp.getRootFolder().removeFile(file);

        return {
          success : true,
          fileId : fileId,
          fileName : fileName,
          url : ss.getUrl(),
          sheetName : 'Demonstrativo_Consumo'
        };

      } catch (error) {
        Logger.log('Erro ao criar Demonstrativo_Consumo no Drive : ' + error.message);
        return {
          success : false,
          error : error.message
        };
      }
}


    // Transformado : Criar arquivo no Drive ao invés de aba
    function criarExportacao_SEINoDrive(dados, opcoes) {
      try {
        opcoes = opcoes || {};
        var folderId = opcoes.folderId || '1w1_45AjB_wB4KMZbP6JevqD382FyBZ53';
        var folder = DriveApp.getFolderById(folderId);

        var timestamp = Utilities.formatDate(new Date(), 'GMT-3', 'yyyyMMdd_HHmmss');
        var fileName = opcoes.fileName || 'Exportacao_SEI_' + timestamp;

        var ss = SpreadsheetApp.create(fileName);
        var sheet = ss.getActiveSheet();
        sheet.setName('Exportacao_SEI');

        // Escrever dados
        if (dados && dados.length > 0) {
          sheet.getRange(1, 1, dados.length, dados[0].length).setValues(dados);

          // Formatar cabeçalho se especificado
          if (opcoes.formatHeader) {
            sheet.getRange(1, 1, 1, dados[0].length)
              .setFontWeight('bold')
              .setBackground('#eeeeee');
          }

          // Auto-resize colunas
          if (opcoes.autoResize != false) {
            for (var i = 1; i <= dados[0].length; i++) {
              sheet.autoResizeColumn(i);
            }
          }
        }
  } catch (error) {
    Logger.log("Erro em criarPrecos_AntieconomicosNoDrive: " + error.message);
    throw error;
  }

}
}
