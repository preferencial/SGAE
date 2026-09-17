'use strict';

/**
 * INFRA_INICIALIZACAO
 * Consolidado de : InicializarAbasCompleto.gs, SheetCreationConfig.gs
 * @version 2.0.0
 * @created 2025-11-04
 */


// ---- InicializarAbasCompleto.gs ----
/**
 * InicializarAbasCompleto.gs
 * Inicializa TODAS as 11 abas com suas colunas corretas
 * Sistema UNIAE CRE PP/Cruzeiro
 */

/**
 * Verifica se está em contexto de UI
 */
function isUIContext() {
  try {
    SpreadsheetApp.getUi();
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Inicializar todas as abas do sistema com headers corretos
 */
function inicializarTodasAsAbas() {
  // Verificar contexto de UI
  if (!isUIContext()) {
    Logger.log('⚠️ inicializarTodasAsAbas chamada fora do contexto de UI');
    Logger.log('Execute esta função do menu do Sheets, não do editor de scripts.');
    return { success: false, error: 'Cannot call SpreadsheetApp.getUi() from this context' };
  }

  var ui = getSafeUi();

  var resposta = ui.alert(
    '🚀 Inicializar Todas as Abas',
    'Esta ação irá : \n\n' +
    '1. Verificar todas as 11 abas do sistema\n' +
    '2. Criar abas que não existem\n' +
    '3. Atualizar headers desatualizados\n' +
    '4. Aplicar formatação padrão\n\n' +
    'Dados existentes serão preservados.\n\n' +
    'Deseja continuar ? ',
    ui.ButtonSet.YES_NO
  );

  if (resposta != ui.Button.YES) {
    safeAlert('Operação cancelada');
    return;
  }

  var ss = getSS();
  var resultado = {
    criadas : [],
    atualizadas : [],
    ok : [],
    erros : []
  };

  // Processar cada aba do SHEET_STRUCTURES
  for (var sheetName in SHEET_STRUCTURES) {
    try {
      var structure = SHEET_STRUCTURES[sheetName];
      var sheet = ss.getSheetByName(sheetName);

      if (!sheet) {
        // Criar aba
        sheet = ss.insertSheet(sheetName);
        aplicarHeaders(sheet, structure);
        resultado.criadas.push(sheetName);
        Logger.log('✅ Criada : ' + sheetName);
      } else {
        // Verificar se headers precisam atualização
        if (needsHeaderUpdate(sheet, structure)) {
          aplicarHeaders(sheet, structure);
          resultado.atualizadas.push(sheetName);
          Logger.log('🔄 Atualizada : ' + sheetName);
        } else {
          resultado.ok.push(sheetName);
          Logger.log('✓ OK : ' + sheetName);
        }
      }
    } catch (e) {
      resultado.erros.push({
        aba : sheetName,
        erro : e.message
      });
      Logger.log('❌ Erro em ' + sheetName + ' : ' + e.message);
    }
  }

  // Mostrar relatório
  mostrarRelatorioInicializacao(resultado);
}
/**
 * Aplicar headers e formatação em uma aba
 */
function aplicarHeaders(sheet, structure) {
  try {
    try {
      try {
        if (!structure || !structure.headers || structure.headers.length == 0) {
          return;
        }

        var headers = structure.headers;

        // Aplicar headers
        sheet.getRange(1, 1, 1, headers.length)
          .setValues([headers])
          .setFontWeight('bold')
          .setBackground('#1c4587')
          .setFontColor('#ffffff')
          .setBorder(true, true, true, true, true, true)
          .setHorizontalAlignment('center')
          .setVerticalAlignment('middle');

        // Auto-ajustar largura das colunas
        for (var i = 1; i <= headers.length; i++) {
          sheet.autoResizeColumn(i);
          // Garantir largura mínima
          if (sheet.getColumnWidth(i) < 100) {
            sheet.setColumnWidth(i, 100);
          }
        }

        // Congelar primeira linha
        sheet.setFrozenRows(1);

        // Aplicar validações se existirem
        if (structure.validations) {
          aplicarValidacoes(sheet, structure);
        }
      } catch (error) {
        Logger.log("Erro em aplicarHeaders: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em aplicarHeaders: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em aplicarHeaders: " + error.message);
    throw error;
  }
}

/**
 * Verificar se headers precisam atualização
 */
function needsHeaderUpdate(sheet, structure) {
  try {
    try {
      if (!structure || !structure.headers || structure.headers.length == 0) {
        return false;
      }

      try {
        var lastCol = sheet.getLastColumn();
        if (lastCol == 0) return true;

        var currentHeaders = sheet.getRange(1, 1, 1, Math.max(lastCol, structure.headers.length)).getValues()[0];

        // Verificar se todos os headers estão corretos
        for (var i = 0; i < structure.headers.length; i++) {
          if (currentHeaders[i] != structure.headers[i]) {
            return true;
          }
        }

        return true;
      } catch (e) {
        Logger.log('Erro ao verificar headers: ' + e.message);
        return false;
      }
    } catch (error) {
      Logger.log("Erro em needsHeaderUpdate: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em needsHeaderUpdate: " + error.message);
    throw error;
  }
}


/**
 * Aplicar validações de dados
 */
function aplicarValidacoes(sheet, structure) {
  try {
    if (!structure.validations) return;

    var headers = structure.headers;

    for (var field in structure.validations) {
      var columnIndex = headers.indexOf(field);
      if (columnIndex >= 0) {
        var validation = structure.validations[field];
        var range = sheet.getRange(2, columnIndex + 1, 1000, 1);

        try {
          if (Array.isArray(validation)) {
            // Lista de valores válidos
            var rule = SpreadsheetApp.newDataValidation()
              .requireValueInList(validation)
              .setAllowInvalid(false)
              .setHelpText('Valores válidos : ' + validation.join(', '))
              .build();
            range.setDataValidation(rule);
          } else if (validation == 'number') {
            // Validação numérica
            var rule = SpreadsheetApp.newDataValidation()
              .requireNumberGreaterThanOrEqualTo(0)
              .setAllowInvalid(false)
              .setHelpText('Digite apenas números')
              .build();
            range.setDataValidation(rule);
          } else if (validation == 'date') {
            // Validação de data
            var rule = SpreadsheetApp.newDataValidation()
              .requireDate()
              .setAllowInvalid(false)
              .setHelpText('Digite uma data válida')
              .build();
            range.setDataValidation(rule);
          }
        } catch (e) {
          Logger.log('Erro ao aplicar validação em ' + field + ' : ' + e.message);
        }
      }
    }
  } catch (error) {
    Logger.log("Erro em aplicarValidacoes: " + error.message);
    throw error;
  }
  }


/**
 * Mostrar relatório de inicialização
 */
function mostrarRelatorioInicializacao(resultado) {
  try {
    var ui = getSafeUi();

    var relatorio = '🚀 INICIALIZAÇÃO COMPLETA\n\n';

    var total = resultado.criadas.length + resultado.atualizadas.length + resultado.ok.length;
    relatorio += '📊 Total de abas : ' + total + '\n\n';

    if (resultado.criadas.length > 0) {
      relatorio += '✅ ABAS CRIADAS (' + resultado.criadas.length + ') : \n';
      resultado.criadas.forEach(function(aba) {
        relatorio += '  • ' + aba + '\n';
      });
      relatorio += '\n';
    }

    if (resultado.atualizadas.length > 0) {
      relatorio += '🔄 ABAS ATUALIZADAS (' + resultado.atualizadas.length + ') : \n';
      resultado.atualizadas.forEach(function(aba) {
        relatorio += '  • ' + aba + '\n';
      });
      relatorio += '\n';
    }

    if (resultado.ok.length > 0) {
      relatorio += '✓ ABAS JÁ CONFIGURADAS (' + resultado.ok.length + ') : \n';
      resultado.ok.forEach(function(aba) {
        relatorio += '  • ' + aba + '\n';
      });
      relatorio += '\n';
    }

    if (resultado.erros.length > 0) {
      relatorio += '❌ ERROS (' + resultado.erros.length + ') : \n';
      resultado.erros.forEach(function(erro) {
        relatorio += '  • ' + erro.aba + ' : ' + erro.erro + '\n';
      });
      relatorio += '\n';
    }

    if (resultado.erros.length == 0) {
      relatorio += '🎉 TODAS AS ABAS ESTÃO CONFIGURADAS!\n';
      relatorio += 'Sistema pronto para uso.';
    }

    safeAlert('Relatório de Inicialização', relatorio, ui.ButtonSet.OK);

    Logger.log(relatorio);
  } catch (error) {
    Logger.log("Erro em mostrarRelatorioInicializacao: " + error.message);
    throw error;
  }
}

/**
 * Gerar relatório visual de todas as abas
 */
function gerarRelatorioVisualAbas() {
  try {
    try {
      var ss = getSS();
      var relatorio = [];

      relatorio.push(['Aba', 'Status', 'Colunas Esperadas', 'Colunas Atuais', 'Headers Corretos', 'Observação']);

      for (var sheetName in SHEET_STRUCTURES) {
        var structure = SHEET_STRUCTURES[sheetName];
        var sheet = ss.getSheetByName(sheetName);

        var status, colunasEsperadas, colunasAtuais, headersCorretos, observacao;

        colunasEsperadas = structure.headers.length;

        if (!sheet) {
          status = '❌ NÃO EXISTE';
          colunasAtuais = 0;
          headersCorretos = 'N/A';
          observacao = 'Aba precisa ser criada';
        } else {
          colunasAtuais = sheet.getLastColumn();

          if (colunasAtuais == 0) {
            status = '⚠️ VAZIA';
            headersCorretos = 'Não';
            observacao = 'Aba existe mas está vazia';
          } else {
            var currentHeaders = sheet.getRange(1, 1, 1, colunasAtuais).getValues()[0];
            var todosCorretos = true;

            for (var i = 0; i < structure.headers.length; i++) {
              if (currentHeaders[i] != structure.headers[i]) {
                todosCorretos = false;
                break;
              }
            }

            if (todosCorretos && colunasAtuais == colunasEsperadas) {
              status = '✅ OK';
              headersCorretos = 'Sim';
              observacao = 'Configurada corretamente';
            } else if (colunasAtuais != colunasEsperadas) {
              status = '⚠️ INCOMPLETA';
              headersCorretos = 'Parcial';
              observacao = 'Faltam ' + (colunasEsperadas - colunasAtuais) + ' colunas';
            } else {
              status = '⚠️ DESATUALIZADA';
              headersCorretos = 'Não';
              observacao = 'Headers precisam atualização';
            }
          }
        }

        relatorio.push([sheetName, status, colunasEsperadas, colunasAtuais, headersCorretos, observacao]);
      }

    } catch (error) {
      Logger.log("Erro em gerarRelatorioVisualAbas: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em gerarRelatorioVisualAbas: " + error.message);
    throw error;
  }
}

/**
 * Mostrar relatório visual no console
 */
function mostrarRelatorioVisualAbas() {
  try {
    var relatorio = gerarRelatorioVisualAbas();
    var ui = getSafeUi();

    var texto = '📊 RELATÓRIO VISUAL DAS ABAS\n\n';

    relatorio.forEach(function(linha, index) {
      if (index == 0) {
        // Header
        texto += linha.join(' | ') + '\n';
        texto += '─'.repeat(80) + '\n';
      } else {
        texto += linha[0] + '\n';
        texto += '  Status : ' + linha[1] + '\n';
        texto += '  Colunas : ' + linha[3] + '/' + linha[2] + '\n';
        texto += '  Headers : ' + linha[4] + '\n';
        texto += '  ' + linha[5] + '\n\n';
      }
    });

    Logger.log(texto);

    // Contar status
    var stats = {
      ok : 0,
      problemas : 0,
      naoExiste : 0
    };

    relatorio.slice(1).forEach(function(linha) {
      if (linha[1] == '✅ OK') stats.ok++;
      else if (linha[1] == '❌ NÃO EXISTE') stats.naoExiste++;
      else stats.problemas++;
    });

    var resumo = '📈 RESUMO : \n\n';
    resumo += '✅ Configuradas : ' + stats.ok + '\n';
    resumo += '⚠️ Com problemas : ' + stats.problemas + '\n';
    resumo += '❌ Não existem : ' + stats.naoExiste + '\n\n';

    if (stats.problemas > 0 || stats.naoExiste > 0) {
      resumo += '💡 Execute "inicializarTodasAsAbas()" para corrigir.';
    } else {
      resumo += '🎉 Todas as abas estão OK!';
    }

    safeAlert('Relatório Visual das Abas', resumo + '\n\nDetalhes no log (Ctrl+Enter)', ui.ButtonSet.OK);
  } catch (error) {
    Logger.log("Erro em mostrarRelatorioVisualAbas: " + error.message);
    throw error;
  }
}

/**
 * Exportar relatório para nova aba (no Drive)
 */
function exportarRelatorioAbas() {
  try {
    var relatorio = gerarRelatorioVisualAbas();

    // Criar no Drive ao invés de aba
    var arquivo = criarArquivoNoDrive('Relatorio_Abas_Sistema', relatorio[0]);

    // Adicionar dados
    for (var i = 1; i < relatorio.length; i++) {
      arquivo.appendRow(relatorio[i]);
    }

    // Formatar
    var sheet = arquivo._sheet;
    sheet.getRange(1, 1, 1, relatorio[0].length)
      .setFontWeight('bold')
      .setBackground('#1c4587')
      .setFontColor('#ffffff');

    // Auto-ajustar colunas
    for (var col = 1; col <= relatorio[0].length; col++) {
      sheet.autoResizeColumn(col);
    }

    var ui = getSafeUi();
    ui.alert('Relatório Exportado',
      '📊 Relatório exportado para o Drive!\n\n' +
      '📁 Arquivo : Relatorio_Abas_Sistema\n' +
      '🔗 URL : ' + arquivo.getUrl(),
      ui.ButtonSet.OK);

    Logger.log('Relatório exportado : ' + arquivo.getUrl());

  } catch (error) {
    Logger.log("Erro em exportarRelatorioAbas: " + error.message);
    throw error; // Re-lança para tratamento superior
  }
}

/**
 * Listar todas as colunas de uma aba específica
 */
function listarColunasAba(sheetName) {
  try {
    try {
      var structure = SHEET_STRUCTURES[sheetName];

      if (!structure) {
        Logger.log('❌ Aba não encontrada em SHEET_STRUCTURES : ' + sheetName);
        return;
      }

      var ss = getSS();
      var sheet = ss.getSheetByName(sheetName);

      var ui = getSafeUi();
      var texto = '📋 COLUNAS DA ABA : ' + sheetName + '\n\n';
      texto += '📝 Descrição : ' + structure.description + '\n\n';
      texto += 'COLUNAS ESPERADAS (' + structure.headers.length + ') : \n\n';

      structure.headers.forEach(function(header, index) {
        texto += (index + 1) + '. ' + header;

        // Adicionar validação se existir
        if (structure.validations && structure.validations[header]) {
          var validation = structure.validations[header];
          if (Array.isArray(validation)) {
            texto += ' [' + validation.join('|') + ']';
          } else {
            texto += ' [' + validation + ']';
          }
        }

        texto += '\n';
      });

      if (sheet) {
        var colunasAtuais = sheet.getLastColumn();
        texto += '\n📊 COLUNAS ATUAIS : ' + colunasAtuais;

        if (colunasAtuais > 0) {
          var currentHeaders = sheet.getRange(1, 1, 1, colunasAtuais).getValues()[0];
          texto += '\n\nHEADERS ATUAIS : \n';
          currentHeaders.forEach(function(header, index) {
            var esperado = structure.headers[index];
            var status;
            if ((header == esperado)) {
              status = '✅';
            } else {
              status = '❌';
            }
            texto += status + (index + 1) + '. ' + header;
            if (header != esperado && esperado) {
              texto += ' (esperado : ' + esperado + ')';
            }
            texto += '\n';
          });
        }
      } else {
        texto += '\n\n❌ ABA NÃO EXISTE NA PLANILHA';
      }

      safeAlert('Colunas da Aba', texto, ui.ButtonSet.OK);
      Logger.log(texto);
    } catch (error) {
      Logger.log("Erro em listarColunasAba: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em listarColunasAba: " + error.message);
    throw error;
  }
}


// ---- SheetCreationConfig.gs ----
/**
 * SheetCreationConfig.gs
 * Configurações centralizadas para controle de criação de abas
 * Sistema UNIAE CRE PP/Cruzeiro - Portaria 244/2006
 *
 * SOLUÇÃO DEFINITIVA PARA O PROBLEMA DE ABAS CRIADAS SEM AUTORIZAÇÃO
 */

/**
 * Configurações globais do sistema de controle de abas
 */
var SHEET_CONTROL_CONFIG = {
  // ID da pasta do Drive onde devem ser salvos relatórios
  // Usar DRIVE_CONFIG.FOLDER_ID de Constants.gs
  get DRIVE_FOLDER_ID() { return DRIVE_CONFIG.FOLDER_ID || '1w1_45AjB_wB4KMZbP6JevqD382FyBZ53';
  },

  // Limite máximo de abas na planilha principal
  MAX_SHEETS_LIMIT : 50,

  // Abas que são permitidas na planilha principal (sistema)
  ALLOWED_SYSTEM_SHEETS : [
    'Notas_Fiscais',
    'Entregas',
    'Recusas',
    'Glosas',
    'PDGP',
    'Fornecedores',
    'Config_Membros_Comissao',
    'Auditoria_Log',
    'Textos_Padrao',
    'Config_Comissao',
    'Substituicoes'
  ],

  // Padrões de nomes que devem ser criados no Drive
  DRIVE_REPORT_PATTERNS : [
    'Relatorio_',
    'Historico_',
    'Analise_',
    'Resumo_',
    'Auditoria_',
    'Problemas_',
    'Divergencias_',
    'Atesto_',
    'Demonstrativo_',
    'Exportacao_',
    'Calculo_',
    'Avaliacao_',
    'PDGP_Check_',
    'Atestos_Missing_',
    'Substituicoes_Pendentes_'
  ],

  // Dias para limpeza automática de abas temporárias
  CLEANUP_DAYS : 7,

  // Ativar logs detalhados
  ENABLE_DETAILED_LOGGING : true
};

/**
 * Função principal para criar abas/documentos com controle inteligente
 * Decide automaticamente se deve criar aba ou documento no Drive
 */
function createSheetOrDocument(name, data, headers) {
  // Verificar se deve ser criado no Drive
  if (shouldCreateInDrive(name)) {
    return createReportDocument(extractReportType(name), data, headers);
  } else {
    // Verificar se é aba do sistema permitida
    if (isSystemSheetAllowed(name)) {
      return {
        sheet : getOrCreateSheetSafe(name, headers),
        name : name,
        location : 'sheet'
      };
    } else {
      // Forçar criação no Drive para abas não autorizadas
      Logger.log('SHEET_CONTROL : Aba não autorizada, criando no Drive : ' + name);
    }
  }
}

/**
 * Verifica se um nome deve ser criado no Drive
 */
function shouldCreateInDrive(sheetName) {
  try {
    var patterns = SHEET_CONTROL_CONFIG.DRIVE_REPORT_PATTERNS;

    for (var i = 0; i < patterns.length; i++) {
      if (sheetName.indexOf(patterns[i]) >= 0) {
        return true;
      }
    }

    // Verificar padrões de timestamp
    if (sheetName.match(/\d{8}_\d{6}$/)) {}

  } catch (error) {
    Logger.log("Erro em shouldCreateInDrive: " + error.message);
    throw error;
  }
}

/**
 * Verifica se uma aba do sistema é permitida
 */
function isSystemSheetAllowed(sheetName) {
  return SHEET_CONTROL_CONFIG.ALLOWED_SYSTEM_SHEETS.indexOf(sheetName) >= 0;
}

/**
 * Extrai o tipo de relatório do nome
 */
function extractReportType(sheetName) {
  try {
    var patterns = SHEET_CONTROL_CONFIG.DRIVE_REPORT_PATTERNS;

    for (var i = 0; i < patterns.length; i++) {
      var pattern = patterns[i];
      if (sheetName.indexOf(pattern) >= 0) {
        return sheetName.replace(pattern, '').replace(/[_\d]/g, '');
      }
    }

  } catch (error) {
    Logger.log("Erro em extractReportType: " + error.message);
    throw error;
  }
}

/**
 * Função de interceptação para substituir todas as chamadas insertSheet
 * IMPORTANTE : Esta função deve ser chamada no lugar de ss.insertSheet()
 */
function insertSheetSafe(sheetName, headers) {
  try {
    Logger.log('SHEET_CONTROL : Interceptando criação de aba : ' + sheetName);

    // Verificar se criação está bloqueada
    if (isCriacaoAbasBloqueada()) {
      throw new Error('CRIAÇÃO DE ABAS BLOQUEADA : Entre em contato com o administrador do sistema.');
    }

    // Usar função inteligente
    var result = createSheetOrDocument(sheetName, [], headers);

    if (result.sheet) {
      return result.sheet;
    } else {
      // Se foi criado no Drive, mostrar mensagem
      getSS().toast(
        'Relatório criado no Drive : ' + result.name,
        'Sistema de Controle de Abas'
      );

      // Retornar uma aba temporária para compatibilidade
      return createTemporarySheet('Redirect_' + sheetName.substring(0, 10),
        [['RELATÓRIO CRIADO NO DRIVE'], ['Nome : ' + result.name], ['URL : ' + result.url]]);
    }
  } catch (error) {
    Logger.log("Erro em insertSheetSafe: " + error.message);
    throw error;
  }
}

/**
 * Função para migrar abas existentes para o Drive
 */
function migrateExistingSheetsTorive() {
  try {
    var ss = getSS();
    var sheets = ss.getSheets();
    var ui = getSafeUi();

    var migrated = [];
    var errors = [];

    sheets.forEach(function(sheet) {
      var name = sheet.getName();

      // Verificar se deve ser migrada
      if (shouldCreateInDrive(name) && !isSystemSheetAllowed(name)) {
        try {
          // Obter dados da aba
          var data = sheet.getDataRange().getValues();
          var headers;
          if (data.length > 0) {
            headers = data[0];
          } else {
            headers = [];
          }
          var bodyData;
          if (data.length > 1) {
            bodyData = data.slice(1);
          } else {
            bodyData = [];
          }

          // Criar no Drive
          var report = createReportDocument(extractReportType(name), bodyData, headers);

          // Deletar aba original
          ss.deleteSheet(sheet);

          migrated.push(name + ' -> ' + report.name);
          Logger.log('SHEET_CONTROL : Migrada aba para Drive : ' + name);

        } catch (e) {
          errors.push(name + ' : ' + e.message);
          Logger.log('SHEET_CONTROL : Erro ao migrar aba : ' + name + ' - ' + e.message);
        }
      }
    });

    var message = 'MIGRAÇÃO DE ABAS PARA DRIVE CONCLUÍDA\n\n';

    if (migrated.length > 0) {
      message += 'MIGRADAS (' + migrated.length + ') : \n' + migrated.join('\n') + '\n\n';
    }

    if (errors.length > 0) {
      message += 'ERROS (' + errors.length + ') : \n' + errors.join('\n') + '\n\n';
    }

    if (migrated.length == 0 && errors.length == 0) {
      message += 'Nenhuma aba precisou ser migrada.';
    }

    safeAlert('Migração Concluída', message, ui.ButtonSet.OK);
  } catch (error) {
    Logger.log("Erro em migrateExistingSheetsTorive: " + error.message);
    throw error;
  }
}


/**
 * Função para verificar e corrigir todas as abas existentes
 */
function auditarECorrigirAbas() {
  try {
    var ss = getSS();
    var sheets = ss.getSheets();
    var ui = getSafeUi();

    var report = {
      system : [],
      unauthorized : [],
      temporary : [],
      total : sheets.length
    };

    sheets.forEach(function(sheet) {
      var name = sheet.getName();

      if (isSystemSheetAllowed(name)) {
        report.system.push(name);
      } else if (name.match(/\d{8}_\d{6}$/)) {
        report.temporary.push(name);
      } else {
        report.unauthorized.push(name);
      }
    });

    var message = 'AUDITORIA DE ABAS - SISTEMA UNIAE\n' +
      '==\n\n' +
      'Total de abas : ' + report.total + '\n\n' +
      '✅ Sistema (' + report.system.length + ') : ' + report.system.join(', ') + '\n\n' +
      '🟡 Temporárias (' + report.temporary.length + ') : ' + report.temporary.length + ' abas\n\n' +
      '❌ Não autorizadas (' + report.unauthorized.length + ') : ' + report.unauthorized.join(', ') + '\n\n';

    if (report.unauthorized.length > 0) {
      message += '⚠️ AÇÃO RECOMENDADA : Execute migrateExistingSheetsTorive() para migrar abas não autorizadas para o Drive.';
    } else {
      message += '🎉 SISTEMA OK : Todas as abas estão em conformidade!';
    }

    safeAlert('Auditoria de Abas', message, ui.ButtonSet.OK);

  } catch (error) {
    Logger.log("Erro em auditarECorrigirAbas: " + error.message);
    throw error;
  }
}

/**
 * Configurar monitoramento automático
 */
function configurarMonitoramentoAutomatico() {
  try {
    // Remover triggers existentes
    var triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(function(trigger) {
      if (trigger.getHandlerFunction() == 'monitoramentoAutomaticoAbas') {
        ScriptApp.deleteTrigger(trigger);
      }
    });

    // Criar novo trigger diário
    ScriptApp.newTrigger('monitoramentoAutomaticoAbas')
      .timeBased()
      .everyDays(1)
      .atHour(1)
      .create();

    getSafeUi().alert('Monitoramento Configurado',
      'Trigger criado para monitoramento automático diário às 1h da manhã.',
      getSafeUi().ButtonSet.OK);
  } catch (error) {
    Logger.log("Erro em configurarMonitoramentoAutomatico: " + error.message);
    throw error;
  }
}

/**
 * Função de monitoramento automático (executada por trigger)
 */
function monitoramentoAutomaticoAbas() {
  try {
    // Executar limpeza automática
    var deleted = cleanupTemporarySheets(SHEET_CONTROL_CONFIG.CLEANUP_DAYS);

    // Executar auditoria
    var audit = auditarECorrigirAbas();

    // Log dos resultados
    Logger.log('SHEET_CONTROL : Monitoramento automático executado');
    Logger.log('SHEET_CONTROL : Abas temporárias removidas : ' + deleted);
    Logger.log('SHEET_CONTROL : Abas não autorizadas : ' + audit.unauthorized.length);

    // Se houver muitas abas não autorizadas, alertar
    if (audit.unauthorized.length > 5) {
      Logger.log('SHEET_CONTROL : ALERTA - Muitas abas não autorizadas detectadas : ' + audit.unauthorized.length);
    }

  } catch (e) {
    Logger.log('SHEET_CONTROL : Erro no monitoramento automático : ' + e.message);
  }


}
