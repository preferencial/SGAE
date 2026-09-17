// ATENÇÃO : Este arquivo usa arrow functions e requer V8 runtime
// Configure em : Projeto > Configurações > Configurações do script > V8

'use strict';

/**
 * INFRA_MANUTENCAO
 * Consolidado de : AutomacaoManutencao.gs, Backup.gs, CorrecaoSistema.gs
 * @version 2.0.0
 * @created 2025-11-04
 */


// ---- AutomacaoManutencao.gs ----
/**
 * AutomacaoManutencao.gs
 * Sistema de Automação e Manutenção Preventiva
 * Triggers, validações e regeneração automática
 * Sistema UNIAE CRE PP/Cruzeiro - Portaria 244/2006
 */

/**
 * ==
 * CONFIGURAÇÃO DE TRIGGERS
 * ==
 */

/**
 * Instala todos os triggers automáticos do sistema
 */
function instalarTriggersAutomaticos() {
  try {
    try {
      // Remover triggers existentes para evitar duplicação
      removerTodosOsTriggers();

      // 1. Trigger diário - Validação de estrutura (2h da manhã)
      ScriptApp.newTrigger('validacaoEstruturaDiaria')
        .timeBased()
        .everyDays(1)
        .atHour(2)
        .create();

      // 2. Trigger semanal - Auditoria completa (domingo 3h)
      ScriptApp.newTrigger('auditoriaCompletaSemanal')
        .timeBased()
        .onWeekDay(ScriptApp.WeekDay.SUNDAY)
        .atHour(3)
        .create();

      // 3. Trigger semanal - Atualização de dados (segunda 1h)
      ScriptApp.newTrigger('atualizacaoDadosSemanal')
        .timeBased()
        .onWeekDay(ScriptApp.WeekDay.MONDAY)
        .atHour(1)
        .create();

      // 4. Trigger mensal - Limpeza e manutenção (dia 1, 4h)
      ScriptApp.newTrigger('manutencaoMensal')
        .timeBased()
        .onMonthDay(1)
        .atHour(4)
        .create();

      // 5 & 6 : triggers onEdit / onChange
      ScriptApp.newTrigger('onEditValidation')
        .forSpreadsheet(SpreadsheetApp.getActive())
        .onEdit()
        .create();
      ScriptApp.newTrigger('onChangeDetection')
        .forSpreadsheet(SpreadsheetApp.getActive())
        .onChange()
        .create();

      logSistema('TRIGGERS_INSTALADOS', 'Todos os triggers foram instalados com sucesso', 'INFO');
      getSafeUi().alert('Triggers Instalados', 'Triggers instalados com sucesso.', getSafeUi().ButtonSet.OK);

      return { success : true, installed : 6 };
    } catch (error) {
      logSistema('ERRO_TRIGGERS', error.message, 'ERRO');
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em instalarTriggersAutomaticos: " + error.message);
    throw error;
  }
}

/**
 * Remove todos os triggers do projeto
 */
function removerTodosOsTriggers() {
  try {
    var triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(function(trigger) {
      ScriptApp.deleteTrigger(trigger);
    });

    logSistema('TRIGGERS_REMOVIDOS', triggers.length + ' triggers removidos', 'INFO');
  } catch (error) {
    Logger.log("Erro em removerTodosOsTriggers: " + error.message);
    throw error;
  }
}

/**
 * Lista todos os triggers ativos
 */
function listarTriggersAtivos() {
  try {
    try {
      var triggers = ScriptApp.getProjectTriggers();
      var lista = [];

      triggers.forEach(function(trigger) {
        lista.push({
          funcao : trigger.getHandlerFunction(),
          tipo : trigger.getEventType().toString(),
          id : trigger.getUniqueId()
        });
      });

      Logger.log('Triggers ativos : ' + JSON.stringify(lista, null, 2));
    } catch (error) {
      Logger.log("Erro em listarTriggersAtivos: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em listarTriggersAtivos: " + error.message);
    throw error;
  }
}

/**
 * ==
 * FUNÇÕES EXECUTADAS POR TRIGGERS
 * ==
 */

/**
 * 1. Validação de Estrutura Diária
 */
function validacaoEstruturaDiaria() {
  try {
    try {
      logSistema('VALIDACAO_DIARIA', 'Iniciando validação diária', 'INFO');
      var resultado = {
        timestamp : new Date(),
        validacoes : [],
        erros : [],
        avisos : []
      };

      // Validar abas obrigatórias
      var abasResult = validarAbasObrigatorias();
      resultado.validacoes.push(abasResult);
      if (!abasResult.success) {
        resultado.erros = resultado.erros.concat(abasResult.erros || []);
      }

      // Validar headers
      var headersResult = validarHeadersTodasAbas();
      resultado.validacoes.push(headersResult);
      if (!headersResult.success) {
        resultado.erros = resultado.erros.concat(headersResult.erros || []);
      }

      // Validar fórmulas
      var formulasResult = validarFormulas();
      resultado.validacoes.push(formulasResult);
      if (!formulasResult.success) {
        resultado.avisos = resultado.avisos.concat(formulasResult.avisos || []);
      }

      var status;
      if (resultado.erros.length == 0) {
        status = 'SUCESSO';
      } else {
        status = 'ERRO';
      }
      logSistema('VALIDACAO_DIARIA_COMPLETA', 'Erros : ' + resultado.erros.length + ' | Avisos : ' + resultado.avisos.length, status);

      if (resultado.erros.length > 0) {
        notificarErrosCriticos(resultado.erros);
      }

      return resultado;
    } catch (error) {
      logSistema('ERRO_VALIDACAO_DIARIA', error.message, 'ERRO');
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em validacaoEstruturaDiaria: " + error.message);
    throw error;
  }
}

/**
 * 2. Auditoria Completa Semanal
 */
function auditoriaCompletaSemanal() {
  try {
    logSistema('AUDITORIA_SEMANAL', 'Iniciando auditoria semanal', 'INFO');

    // Executar auditoria completa
    var resultado = executarAuditoriaCompleta({
      maxRecords : 10000,
      autoFix : false
    });

    // Registrar resultado
    logSistema(
      'AUDITORIA_SEMANAL_COMPLETA',
      'Score : ' + resultado.resumo.score + '/100 | ' +
      'Conformes : ' + resultado.resumo.conforme + ' | ' +
      'Não conformes : ' + resultado.resumo.naoConforme,
      resultado.resumo.score >= 80 ? 'SUCESSO' : 'AVISO'
    );

    // Gerar relatório resumido
    gerarRelatorioAuditoriaSemanal(resultado);


  } catch (error) {
    logSistema('ERRO_AUDITORIA_SEMANAL', error.message, 'ERRO');
    throw error;
  }
}

/**
 * 3. Atualização de Dados Semanal
 */
function atualizacaoDadosSemanal() {
  try {
    logSistema('ATUALIZACAO_SEMANAL', 'Iniciando atualização semanal', 'INFO');

    var resultado = {
      timestamp : new Date(),
      atualizacoes : []
    };

    // Atualizar campos derivados
    var derivadosResult = atualizarCamposDerivados();
    resultado.atualizacoes.push(derivadosResult);

    // Sincronizar dados denormalizados
    var syncResult = syncDenormalizedData();
    resultado.atualizacoes.push(syncResult);

    // Atualizar métricas de fornecedores
    var metricsResult = atualizarMetricasFornecedores();
    resultado.atualizacoes.push(metricsResult);

    // Registrar resultado
    logSistema(
      'ATUALIZACAO_SEMANAL_COMPLETA',
      resultado.atualizacoes.length + ' atualizações realizadas',
      'SUCESSO'
    );


  } catch (error) {
    logSistema('ERRO_ATUALIZACAO_SEMANAL', error.message, 'ERRO');
    throw error;
  }
}

/**
 * 4. Manutenção Mensal
 */
function manutencaoMensal() {
  try {
    logSistema('MANUTENCAO_MENSAL', 'Iniciando manutenção mensal', 'INFO');

    var resultado = {
      timestamp : new Date(),
      tarefas : []
    };

    // Limpar logs antigos (> 90 dias)
    var limpezaResult = limparLogsAntigos(90);
    resultado.tarefas.push(limpezaResult);

    // Compactar dados históricos
    var compactResult = compactarDadosHistoricos();
    resultado.tarefas.push(compactResult);

    // Validar integridade referencial
    var integridadeResult = validateReferentialIntegrity();
    resultado.tarefas.push(integridadeResult);

    // Otimizar fórmulas
    var otimizacaoResult = otimizarFormulas();
    resultado.tarefas.push(otimizacaoResult);

    // Registrar resultado
    logSistema(
      'MANUTENCAO_MENSAL_COMPLETA',
      resultado.tarefas.length + ' tarefas executadas',
      'SUCESSO'
    );


  } catch (error) {
    logSistema('ERRO_MANUTENCAO_MENSAL', error.message, 'ERRO');
    throw error;
  }
}

/**
 * 5. Validação em Tempo Real (on edit)
 */
function onEditValidation(e) {
  try {
    try {
      try {
        if (!e || !e.range) return;

        var sheet = e.range.getSheet();
        var sheetName = sheet.getName();
        var row = e.range.getRow();
        var col = e.range.getColumn();

        // Ignorar edições no header
        if (row == 1) return;

        // Validar apenas abas do sistema
        if (ALLOWED_SHEETS.indexOf(sheetName) < 0) return;

        // Validar valor editado
        var structure = SHEET_STRUCTURES[sheetName];
        if (structure && structure.validations) {
          var header = structure.headers[col - 1];
          var validation = structure.validations[header];
          var value = e.range.getValue();

          if (validation) {
            var isValid = validarValor(value, validation);
            if (!isValid) {
              // Destacar célula com erro
              e.range.setBackground('#ffcccc');

              logSistema(
                'VALIDACAO_TEMPO_REAL',
                'Valor inválido em ' + sheetName + '!' + header + ' linha ' + row,
                'AVISO'
              );
            } else {
              // Remover destaque se válido
              e.range.setBackground(null);
            }
          }
        }

      } catch (error) {
        Logger.log('Erro onEditValidation : ' + error.message);
      }
    } catch (error) {
      Logger.log("Erro em onEditValidation: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em onEditValidation: " + error.message);
    throw error;
  }
}

/**
 * 6. Detecção de Mudanças Estruturais (on change)
 */
function onChangeDetection(e) {
  try {
    if (!e) return;

    var changeType = e.changeType;

    // Detectar mudanças estruturais
    if (changeType == 'INSERT_ROW' || changeType == 'INSERT_COLUMN' ||
        changeType == 'REMOVE_ROW' || changeType == 'REMOVE_COLUMN') {

      logSistema(
        'MUDANCA_ESTRUTURAL',
        'Tipo : ' + changeType,
        'INFO'
      );

      // Validar estrutura após mudança
      Utilities.sleep(1000); // Aguardar 1 segundo
      validarAbasObrigatorias();
    }

    // Detectar criação/remoção de abas
    if (changeType == 'INSERT_GRID' || changeType == 'REMOVE_GRID') {
      logSistema(
        'MUDANCA_ABAS',
        'Tipo : ' + changeType,
        'AVISO'
      );

      // Validar abas após mudança
      Utilities.sleep(1000);
      validarAbasObrigatorias();
    }

  } catch (error) {
    Logger.log('Erro onChangeDetection : ' + error.message);
  }
}


/**
 * ==
 * FUNÇÕES DE VALIDAÇÃO
 * ==
 */

/**
 * Valida se todas as abas obrigatórias existem
 */
function validarAbasObrigatorias() {
  try {
    try {
      var ss = getSS();
      var existingSheets = ss.getSheets().map(s => s.getName());
      var resultado = { success : true, erros : [], avisos : [], abasEncontradas : 0, abasFaltando : 0 };

      if (!Array.isArray(ALLOWED_SHEETS)) {
        resultado.success = false;
        resultado.erros.push('ALLOWED_SHEETS não definido');
        return resultado;
      }

      ALLOWED_SHEETS.forEach(function(sheetName) {
        if (existingSheets.indexOf(sheetName) >= 0) {
          resultado.abasEncontradas++
        } else {
          resultado.abasFaltando++
          resultado.erros.push('Aba obrigatória ausente : ' + sheetName);
        }
      });

      return resultado;
    } catch (e) {
      return { success : false, erros : [e.message] };
    }
  } catch (error) {
    Logger.log("Erro em validarAbasObrigatorias: " + error.message);
    throw error;
  }
}

/**
 * Valida headers de todas as abas
 */
function validarHeadersTodasAbas() {
  try {
    var resultado = { success : true, erros : [], avisos : [], abasValidadas : 0 };
    try {
      if (!Array.isArray(ALLOWED_SHEETS)) return resultado;
      ALLOWED_SHEETS.forEach(function(sheetName) {
        var structure;
        if ((typeof SHEET_STRUCTURES != 'undefined')) {
          structure = SHEET_STRUCTURES[sheetName];
        } else {
          structure = null;
        }
        if (!structure || !structure.headers) {
          resultado.avisos.push(sheetName + ' : estrutura não definida');
          return;
        }
        try {
          var sheet;
          if (getOrCreateSheetSafe) {
            sheet = getOrCreateSheetSafe(sheetName);
          } else {
            sheet = getSS().getSheetByName(sheetName);
          }
          if (!sheet) {
            resultado.erros.push(sheetName + ' : aba não encontrada');
            resultado.success = false;
            return;
          }
          var currentHeaders = sheet.getRange(1, 1, 1, structure.headers.length).getValues()[0];
          for (var i = 0; i < structure.headers.length; i++) {
            if (currentHeaders[i] != structure.headers[i]) {
              resultado.erros.push(sheetName + ' : Header incorreto na coluna ' + (i + 1));
              resultado.success = false;
              break;
            }
          }
          resultado.abasValidadas++
        } catch (e) {
          resultado.erros.push(sheetName + ' : Erro ao validar - ' + e.message);
          resultado.success = false;
        }
      });
    } catch (e) {
      resultado.success = false;
      resultado.erros.push(e.message);
    }
    return resultado;
  } catch (error) {
    Logger.log("Erro em validarHeadersTodasAbas: " + error.message);
    throw error;
  }
}

/**
 * Valida fórmulas nas abas
 */
function validarFormulas() {
  try {
    try {
      var resultado = {
        success : true,
        avisos : [],
        formulasValidadas : 0,
        formulasQuebradas : 0
      };

      try {
        // Validar fórmulas em Notas_Fiscais
        var nfSheet = getSheet('Notas_Fiscais');
        var lastRow = nfSheet.getLastRow();

        if (lastRow > 1) {
          // Verificar se campos derivados têm fórmulas
          var camposDerivados = [15, 16, 17, 18, 19, 20, 21, 22]; // Colunas com fórmulas;

          camposDerivados.forEach(function(col) {
            var formula = nfSheet.getRange(2, col).getFormula();
            if (!formula || formula == '') {
              resultado.avisos.push('Notas_Fiscais : Fórmula ausente na coluna ' + col);
              resultado.formulasQuebradas++
            } else {
              resultado.formulasValidadas++
            }
          });
        }

        // Validar fórmulas em Ref_Fornecedores
        var fornSheet = getSheet('Ref_Fornecedores');
        var lastRowForn = fornSheet.getLastRow();

        if (lastRowForn > 1) {
          var camposDerivadosForn = [17, 18, 19, 20, 21]; // Colunas com fórmulas;

          camposDerivadosForn.forEach(function(col) {
            var formula = fornSheet.getRange(2, col).getFormula();
            if (!formula || formula == '') {
              resultado.avisos.push('Ref_Fornecedores : Fórmula ausente na coluna ' + col);
              resultado.formulasQuebradas++
            } else {
              resultado.formulasValidadas++
            }
          });
        }

        if (resultado.formulasQuebradas > 0) {
          resultado.success = false;
        }

      } catch (error) {
        resultado.avisos.push('Erro ao validar fórmulas : ' + error.message);
        resultado.success = false;
      }

      return resultado;
    } catch (error) {
      Logger.log("Erro em validarFormulas: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em validarFormulas: " + error.message);
    throw error;
  }
}

/**
 * Valida um valor conforme regra de validação
 */
function validarValor(value, validation) {
  try {
    if (Array.isArray(validation)) {
      // Lista de valores válidos
      return validation.indexOf(value) >= 0;
    } else if (validation == 'number') {
      return !isNaN(Number(value));
    } else if (validation == 'date') {
      return value instanceof Date || !isNaN(new Date(value).getTime());
    }
  } catch (error) {
    Logger.log("Erro em validarValor: " + error.message);
    throw error;
  }
}

/**
 * ==
 * FUNÇÕES DE ATUALIZAÇÃO
 * ==
 */

/**
 * Atualiza todos os campos derivados
 */
function atualizarCamposDerivados() {
  try {
    var resultado = {
      tipo : 'CAMPOS_DERIVADOS',
      registrosAtualizados : 0,
      erros : []
    };

    try {
      // Atualizar Notas_Fiscais
      var nfData = readSheetData('Notas_Fiscais');

      nfData.data.forEach(function(row, index) {
        var nfId = row[0];
        if (nfId) {
          try {
            updateNFDerivedFields(nfId);
            resultado.registrosAtualizados++
          } catch (error) {
            resultado.erros.push('NF ' + nfId + ' : ' + error.message);
          }
        }
      });

      // Atualizar Ref_Fornecedores
      var fornData = readSheetData('Ref_Fornecedores');

      fornData.data.forEach(function(row, index) {
        var cnpj = row[1];
        if (cnpj) {
          try {
            updateFornecedorDerivedFields(cnpj);
            resultado.registrosAtualizados++
          } catch (error) {
            resultado.erros.push('Fornecedor ' + cnpj + ' : ' + error.message);
          }
        }
      });

    } catch (error) {
      resultado.erros.push('Erro geral : ' + error.message);
    }

    return resultado;
  } catch (error) {
    Logger.log("Erro em atualizarCamposDerivados: " + error.message);
    throw error;
  }
}

/**
 * Atualiza métricas de fornecedores
 */
function atualizarMetricasFornecedores() {
  try {
    var resultado = {
      tipo : 'METRICAS_FORNECEDORES',
      fornecedoresAtualizados : 0,
      erros : []
    };

    try {
      var fornData = readSheetData('Ref_Fornecedores');

      fornData.data.forEach(function(row, index) {
        var cnpj = row[1];
        if (cnpj) {
          try {
            // Calcular métricas
            var metricas = calcularMetricasFornecedor(cnpj);

            // Atualizar na planilha
            var rowNum = index + 2;
            var sheet = getSheet('Ref_Fornecedores');

            sheet.getRange(rowNum, 11).setValue(metricas.totalEntregas);
            sheet.getRange(rowNum, 12).setValue(metricas.totalRecusas);
            sheet.getRange(rowNum, 13).setValue(metricas.totalGlosas);
            sheet.getRange(rowNum, 14).setValue(metricas.percentualConformidade);
            sheet.getRange(rowNum, 15).setValue(new Date());

            resultado.fornecedoresAtualizados++
          } catch (error) {
            resultado.erros.push('Fornecedor ' + cnpj + ' : ' + error.message);
          }
        }
      });

    } catch (error) {
      resultado.erros.push('Erro geral : ' + error.message);
    }

    return resultado;
  } catch (error) {
    Logger.log("Erro em atualizarMetricasFornecedores: " + error.message);
    throw error;
  }
}

/**
 * Calcula métricas de um fornecedor
 */
function calcularMetricasFornecedor(cnpj) {
  try {
    var nfData = readSheetData('Notas_Fiscais');
    var entregasData = readSheetData('Entregas');
    var recusasData = readSheetData('Recusas');
    var glosasData = readSheetData('Glosas');

    var metricas = {
      totalEntregas : 0,
      totalRecusas : 0,
      totalGlosas : 0,
      percentualConformidade : 100
    };

    // Contar entregas
    entregasData.data.forEach(function(row) {
      var fornecedor = row[3];
      if (fornecedor && fornecedor.indexOf(cnpj) >= 0) {
        metricas.totalEntregas++
      }
    });

    // Contar recusas
    recusasData.data.forEach(function(row) {
      var fornecedor = row[2];
      if (fornecedor && fornecedor.indexOf(cnpj) >= 0) {
        metricas.totalRecusas++
      }
    });

    // Contar glosas
    glosasData.data.forEach(function(row) {
      var fornecedor = row[3];
      if (fornecedor && fornecedor.indexOf(cnpj) >= 0) {
        metricas.totalGlosas++
      }
    });

    // Calcular percentual de conformidade
    if (metricas.totalEntregas > 0) {
      var problemas = metricas.totalRecusas + metricas.totalGlosas;
      metricas.percentualConformidade = Math.max(0, 100 - ((problemas / metricas.totalEntregas) * 100));
    }

    return metricas;
  } catch (error) {
    Logger.log("Erro em calcularMetricasFornecedor: " + error.message);
    throw error;
  }
}

/**
 * ==
 * FUNÇÕES DE REGENERAÇÃO
 * ==
 */

/**
 * Regenera todas as fórmulas do sistema
 */
function regenerarFormulas() {
  try {
    try {
      logSistema('REGENERAR_FORMULAS', 'Iniciando regeneração de fórmulas', 'INFO');

      var resultado = {
        timestamp : new Date(),
        abas : [],
        formulasRegeneradas : 0
      };

      // Regenerar fórmulas em Notas_Fiscais
      var nfResult = regenerarFormulasNotasFiscais();
      resultado.abas.push(nfResult);
      resultado.formulasRegeneradas += nfResult.formulas;

      // Regenerar fórmulas em Entregas
      var entResult = regenerarFormulasEntregas();
      resultado.abas.push(entResult);
      resultado.formulasRegeneradas += entResult.formulas;

      // Regenerar fórmulas em Ref_Fornecedores
      var fornResult = regenerarFormulasFornecedores();
      resultado.abas.push(fornResult);
      resultado.formulasRegeneradas += fornResult.formulas;

      logSistema(
        'REGENERAR_FORMULAS_COMPLETO',
        resultado.formulasRegeneradas + ' fórmulas regeneradas',
        'SUCESSO'
      );

      getSafeUi().alert(
        'Fórmulas Regeneradas',
        'Total de fórmulas regeneradas : ' + resultado.formulasRegeneradas + '\n\n' +
        resultado.abas.map(function(a) {
          return '• ' + a.aba + ' : ' + a.formulas + ' fórmulas';
        }).join('\n'),
        getSafeUi().ButtonSet.OK
      );


    } catch (error) {
      logSistema('ERRO_REGENERAR_FORMULAS', error.message, 'ERRO');
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em regenerarFormulas: " + error.message);
    throw error;
  }
}


/**
 * Regenera fórmulas em Notas_Fiscais
 */
function regenerarFormulasNotasFiscais() {
  try {
    try {
      var sheet = getSheet('Notas_Fiscais');
      var lastRow = sheet.getLastRow();
      var formulas = 0;

      if (lastRow <= 1) {
        return {aba : 'Notas_Fiscais', formulas : 0};
      }

      // Fórmulas para campos derivados (colunas 15-22)
      for (var row = 2; row <= lastRow; row++) {
        // NF_DiasDesdeEmissao (col 15)
        sheet.getRange(row, 15).setFormula('=SE(D' + row + '<>"";HOJE()-D' + row + ';"")');

        // NF_DiasDesdeRecebimento (col 16)
        sheet.getRange(row, 16).setFormula('=SE(E' + row + '<>"";HOJE()-E' + row + ';"")');

        // NF_AtesteoPendente (col 17)
        sheet.getRange(row, 17).setFormula('=SE(J' + row + '<>"Atestada";"SIM";"NÃO")');

        // NF_PrazoAtesto (col 18)
        sheet.getRange(row, 18).setFormula('=SE(E' + row + '<>"";E' + row + '+5;"")');

        // NF_AtesteAtrasado (col 19)
        sheet.getRange(row, 19).setFormula('=SE(E(Q' + row + '="SIM";HOJE()>R' + row + ');"SIM";"NÃO")');

        // NF_TemGlosa (col 20)
        sheet.getRange(row, 20).setFormula('=CONT.SE(Glosas!C : C;B' + row + ')>0');

        // NF_ValorGlosado (col 21)
        sheet.getRange(row, 21).setFormula('=SOMASE(Glosas!C : C;B' + row + ';Glosas!H,H)');

        // NF_ValorLiquido (col 22)
        sheet.getRange(row, 22).setFormula('=I' + row + '-U' + row);

        formulas += 8;
      }

    } catch (error) {
      Logger.log("Erro em regenerarFormulasNotasFiscais: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em regenerarFormulasNotasFiscais: " + error.message);
    throw error;
  }
}

/**
 * Regenera fórmulas em Entregas
 */
function regenerarFormulasEntregas() {
  try {
    try {
      var sheet = getSheet('Entregas');
      var lastRow = sheet.getLastRow();
      var formulas = 0;

      if (lastRow <= 1) {
        return {aba : 'Entregas', formulas : 0};
      }

      for (var row = 2; row <= lastRow; row++) {
        // Entrega_DiasDesde (col 16)
        sheet.getRange(row, 16).setFormula('=SE(C' + row + '<>"";HOJE()-C' + row + ';"")');

        // Entrega_TemRecusa (col 17)
        sheet.getRange(row, 17).setFormula('=CONT.SE(Recusas!C : C;A' + row + ')>0');

        // Entrega_TemGlosa (col 18)
        sheet.getRange(row, 18).setFormula('=CONT.SE(Glosas!C : C;A' + row + ')>0');

        // Entrega_NF_Numero (col 19)
        sheet.getRange(row, 19).setFormula('=SEERRO(PROCV(B' + row + ';Notas_Fiscais!A : B;2;0);"")');

        // Entrega_Fornecedor (col 20)
        sheet.getRange(row, 20).setFormula('=SEERRO(PROCV(B' + row + ';Notas_Fiscais!A : G;7;0);"")');

        formulas += 5;
      }

    } catch (error) {
      Logger.log("Erro em regenerarFormulasEntregas: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em regenerarFormulasEntregas: " + error.message);
    throw error;
  }
}

/**
 * Regenera fórmulas em Ref_Fornecedores
 */
function regenerarFormulasFornecedores() {
  try {
    try {
      var sheet = getSheet('Ref_Fornecedores');
      var lastRow = sheet.getLastRow();
      var formulas = 0;

      if (lastRow <= 1) {
        return {aba : 'Ref_Fornecedores', formulas : 0};
      }

      for (var row = 2; row <= lastRow; row++) {
        var cnpjCell = 'B' + row;

        // Fornecedor_TotalNFs (col 17)
        sheet.getRange(row, 17).setFormula('=CONT.SE(Notas_Fiscais!F : F;' + cnpjCell + ')');

        // Fornecedor_ValorTotal (col 18)
        sheet.getRange(row, 18).setFormula('=SOMASE(Notas_Fiscais!F : F;' + cnpjCell + ';Notas_Fiscais!I,I)');

        // Fornecedor_ValorGlosado (col 20)
        sheet.getRange(row, 20).setFormula('=SOMASE(Notas_Fiscais!F : F;' + cnpjCell + ';Notas_Fiscais!U,U)');

        // Fornecedor_PercGlosa (col 21)
        sheet.getRange(row, 21).setFormula('=SE(R' + row + '>0;T' + row + '/R' + row + ';0)');
        sheet.getRange(row, 21).setNumberFormat('0.00%');

        formulas += 4;
      }

    } catch (error) {
      Logger.log("Erro em regenerarFormulasFornecedores: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em regenerarFormulasFornecedores: " + error.message);
    throw error;
  }
}

/**
 * Otimiza fórmulas (remove fórmulas desnecessárias)
 */
function otimizarFormulas() {
  try {
    try {
      var resultado = {
        tipo : 'OTIMIZACAO_FORMULAS',
        formulasOtimizadas : 0
      };

      try {
        // Identificar fórmulas que podem ser convertidas em valores
        // (fórmulas em linhas antigas que não mudam mais)

        var nfSheet = getSheet('Notas_Fiscais');
        var lastRow = nfSheet.getLastRow();

        if (lastRow > 100) {
          // Converter fórmulas em valores para linhas antigas (> 90 dias)
          var hoje = new Date();

          for (var row = 2; row <= lastRow; row++) {
            var dataReceb = nfSheet.getRange(row, 5).getValue();
            if (dataReceb) {
              var diasDesde = (hoje - new Date(dataReceb)) / (1000 * 60 * 60 * 24);

              if (diasDesde > 90) {
                // Converter fórmulas em valores
                var range = nfSheet.getRange(row, 15, 1, 8);
                var values = range.getValues();
                range.setValues(values);
                resultado.formulasOtimizadas += 8;
              }
            }
          }
        }

      } catch (error) {
        Logger.log('Erro otimizarFormulas : ' + error.message);
      }
    } catch (error) {
      Logger.log("Erro em otimizarFormulas: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em otimizarFormulas: " + error.message);
    throw error;
  }
}


/**
 * ==
 * FUNÇÕES DE LIMPEZA
 * ==
 */

/**
 * Limpa logs antigos
 */
function limparLogsAntigos(diasRetencao) {
  try {
    diasRetencao = diasRetencao || 90;

    var resultado = {
      tipo : 'LIMPEZA_LOGS',
      registrosRemovidos : 0
    };

    try {
      var sheet = getSheet('System_Logs');
      var data = sheet.getDataRange().getValues();
      var headers = data[0];
      var logs = data.slice(1);

      // Identificar linhas a remover (de trás para frente)
      for (var i = data.length - 1; i > 0; i--) {
        var dataLog = data[i][1];
        if (dataLog && new Date(dataLog) < cutoffDate) {
          sheet.deleteRow(i + 1);
          resultado.registrosRemovidos++
        }
      }

      logSistema(
        'LIMPEZA_LOGS',
        resultado.registrosRemovidos + ' logs removidos (> ' + diasRetencao + ' dias)',
        'INFO'
      );

    } catch (error) {
      Logger.log('Erro limparLogsAntigos : ' + error.message);
    }
  } catch (error) {
    Logger.log("Erro em limparLogsAntigos: " + error.message);
    throw error;
  }
}


/**
 * Compacta dados históricos
 */
function compactarDadosHistoricos() {
  try {
    var resultado = {
      tipo : 'COMPACTACAO_DADOS',
      registrosCompactados : 0
    };

    try {
      // Identificar registros antigos que podem ser arquivados
      // (NFs com mais de 1 ano e status "Paga")

      var nfData = readSheetData('Notas_Fiscais');
      var hoje = new Date();
      var umAnoAtras = new Date();
      umAnoAtras.setFullYear(hoje.getFullYear() - 1);

      var registrosParaArquivar = [];

      nfData.data.forEach(function(row, index) {
        var dataEmissao = row[3];
        var status = row[9];

        if (dataEmissao && new Date(dataEmissao) < umAnoAtras && status == 'Paga') {
          registrosParaArquivar.push({
            row : index + 2,
            data : row
          });
        }
      });

      if (registrosParaArquivar.length > 0) {
        // Criar relatório de arquivo no Drive
        var headers = nfData.headers;
        var dataParaArquivar = registrosParaArquivar.map(function(r) { return r.data; });

        var report = generateReport(
          'Arquivo_Historico_' + Utilities.formatDate(hoje, 'GMT-3', 'yyyy'),
          dataParaArquivar,
          headers
        );

        resultado.registrosCompactados = registrosParaArquivar.length;
        resultado.arquivoUrl = report.url;

        logSistema(
          'COMPACTACAO_DADOS',
          resultado.registrosCompactados + ' registros arquivados',
          'INFO'
        );
      }

    } catch (error) {
      Logger.log('Erro compactarDadosHistoricos : ' + error.message);
    }


  /**
   * ==
   * SISTEMA DE LOGS
   * ==
   */

  /**
   * Estrutura da aba System_Logs
   */
  var SYSTEM_LOGS_HEADERS = [
    'ID_Log',
    'Data_Hora',
    'Tipo_Evento',
    'Mensagem',
    'Nivel',
    'Usuario',
    'Detalhes'
  ];

  /**
   * Registra evento no log do sistema
   */
  function logSistema(tipo, mensagem, nivel) {
    try {
      try {
        try {
          // Garantir que aba System_Logs existe
          var ss = getSS();
          var sheet = ss.getSheetByName('System_Logs');

          if (!sheet) {
            sheet = ss.insertSheet('System_Logs');
            sheet.getRange(1, 1, 1, SYSTEM_LOGS_HEADERS.length)
              .setValues([SYSTEM_LOGS_HEADERS])
              .setFontWeight('bold')
              .setBackground('#1c4587')
              .setFontColor('#ffffff');
            sheet.setFrozenRows(1);
          }

          var logData = [
            'LOG_' + new Date().getTime(),
            new Date(),
            tipo,
            mensagem,
            nivel || 'INFO',
            Session.getActiveUser().getEmail(),
            ''
          ];

          sheet.appendRow(logData);

          // Também registrar no Logger do Apps Script
          Logger.log('[' + nivel + '] ' + tipo + ' : ' + mensagem);

        } catch (error) {
          Logger.log('Erro ao registrar log : ' + error.message);
        }
      } catch (error) {
        Logger.log("Erro em logSistema: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em logSistema: " + error.message);
      throw error;
    }
  }


  /**
   * Busca logs por filtro
   */
  function buscarLogs(filtro) {
    try {
      filtro = filtro || {};

      try {
        try {
          var sheet = getSheet('System_Logs');
          var data = sheet.getDataRange().getValues();
          var headers = data[0];
          var logs = data.slice(1);

          // Aplicar filtros
          var resultado = logs.filter(function(row) {
            var match = true;

            if (filtro.tipo && row[2] != filtro.tipo) {
              match = false;
            }

            if (filtro.nivel && row[4] != filtro.nivel) {
              match = false;
            }

            if (filtro.dataInicio && new Date(row[1]) < new Date(filtro.dataInicio)) {
              match = false;
            }

            if (filtro.dataFim && new Date(row[1]) > new Date(filtro.dataFim)) {
              match = false;
            }

          });

          return {
            // headers : headers,
            logs : resultado,
            total : resultado.length
          };
        } catch (error) {
          Logger.log("Erro em buscarLogs: " + error.message);
          throw error;
        }
      } catch (error) {
        Logger.log('Erro buscarLogs : ' + error.message);
        throw error;
      }
      } catch (error) {
        Logger.log('Erro buscarLogs : ' + error.message);
        throw error;
      }
    }
  } catch (error) {
    Logger.log("Erro em compactarDadosHistoricos: " + error.message);
    throw error;
  }
}


/**
 * Gera relatório de logs
 */
function gerarRelatorioLogs(filtro) {
  try {
    try {
      var logs = buscarLogs(filtro);

      if (logs.total == 0) {
        getSafeUi().alert('Nenhum log encontrado com os filtros especificados');
        return;
      }

      // Gerar relatório no Drive
      var report = generateReport('Logs_Sistema', logs.logs, logs.headers);

      getSafeUi().alert(
        'Relatório de Logs Gerado',
        'Total de logs : ' + logs.total + '\n\n' +
        'Acesse em : ' + report.url,
        getSafeUi().ButtonSet.OK
      );


    } catch (error) {
      logSistema('ERRO_RELATORIO_LOGS', error.message, 'ERRO');
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em gerarRelatorioLogs: " + error.message);
    throw error;
  }
}


/**
 * ==
 * FUNÇÕES DE NOTIFICAÇÃO
 * ==
 */

/**
 * Notifica erros críticos por email
 */
function notificarErrosCriticos(erros) {
  try {
    var destinatarios = obterEmailsAdministradores();

    if (destinatarios.length == 0) {
      Logger.log('Nenhum administrador configurado para notificações');
      return;
    }

    var assunto = '[UNIAE] Erros Críticos Detectados - ' +
                  Utilities.formatDate(new Date(), 'GMT-3', 'dd/MM/yyyy HH : mm');

    var corpo = 'Sistema UNIAE - Notificação de Erros Críticos\n\n' +
                'Data/Hora : ' + new Date().toString() + '\n' +
                'Total de erros : ' + erros.length + '\n\n' +
                'ERROS DETECTADOS : \n' +
                erros.map(function(e, i) {
                  return (i + 1) + '. ' + e;
                }).join('\n') + '\n\n' +
                'Acesse o sistema para mais detalhes : \n' +
                getSS().getUrl();

    destinatarios.forEach(function(email) {
      MailApp.sendEmail({
        to : email,
        subject : assunto,
        body : corpo
      });
    });

    logSistema(
      'NOTIFICACAO_ENVIADA',
      'Notificação de erros enviada para ' + destinatarios.length + ' administradores',
      'INFO'
    );

  } catch (error) {
    Logger.log('Erro ao enviar notificação : ' + error.message);
  }
}

/**
 * Obtém emails dos administradores
 */
function obterEmailsAdministradores() {
  try {
    try {
      var membrosData = readSheetData('Config_Membros_Comissao');
      var emails = [];

      membrosData.data.forEach(function(row) {
        var email = row[5]; // Email_Institucional;
        var status = row[6]; // Status_Ativo;

        if (email && status == 'S') {
          emails.push(email);
        }
      });


    } catch (error) {
      Logger.log('Erro obterEmailsAdministradores : ' + error.message);
    }
  } catch (error) {
    Logger.log("Erro em obterEmailsAdministradores: " + error.message);
    throw error;
  }
}


/**
 * ==
 * FUNÇÕES DE RELATÓRIO
 * ==
 */

/**
 * Gera relatório de auditoria semanal
 */
function gerarRelatorioAuditoriaSemanal(resultado) {
  try {
    try {
      var dados = [
        ['Métrica', 'Valor'],
        ['Data da Auditoria', new Date().toString()],
        ['Score Geral', resultado.resumo.score + '/100'],
        ['Total de Verificações', resultado.resumo.total],
        ['Conformes', resultado.resumo.conforme],
        ['Não Conformes', resultado.resumo.naoConforme],
        ['Alertas', resultado.resumo.alertas],
        ['Críticos', resultado.resumo.criticos],
        ['', ''],
        ['Verificações Realizadas', '']
      ];

      resultado.verificacoes.forEach(function(v) {
        dados.push([v.tipo, 'Score : ' + calcularScoreGeral(v) + '/100']);
      });

      // Adicionar na aba Auditoria_Log como seção
      appendReportToSheet('Auditoria_Log', dados, {
        section : 'AUDITORIA_SEMANAL',
        timestamp : true
      });

      logSistema(
        'RELATORIO_AUDITORIA_SEMANAL',
        'Relatório adicionado à aba Auditoria_Log',
        'INFO'
      );

    } catch (error) {
      Logger.log('Erro gerarRelatorioAuditoriaSemanal : ' + error.message);
    }
  } catch (error) {
    Logger.log("Erro em gerarRelatorioAuditoriaSemanal: " + error.message);
    throw error;
  }
}


/**
 * ==
 * FUNÇÕES DE INTERFACE
 * ==
 */

/**
 * Mostra status do sistema de automação
 */
function mostrarStatusAutomacao() {
  try {
    try {
      var triggers = listarTriggersAtivos();
      var ultimaValidacao = buscarLogs({tipo : 'VALIDACAO_DIARIA_COMPLETA', limite : 1});
      var ultimaAuditoria = buscarLogs({tipo : 'AUDITORIA_SEMANAL_COMPLETA', limite : 1});

      var mensagem = 'STATUS DO SISTEMA DE AUTOMAÇÃO\n\n' +
                     '📊 TRIGGERS ATIVOS : ' + triggers.length + '\n' +
                     triggers.map(function(t) {
                       return '  • ' + t.funcao + ' (' + t.tipo + ')';
                     }).join('\n') + '\n\n' +
                     '✅ ÚLTIMA VALIDAÇÃO : ' +
                     (ultimaValidacao.total > 0 ?
                       formatDateTime(ultimaValidacao.logs[0][1]) :
                       'Nunca executada') + '\n\n' +
                     '🔍 ÚLTIMA AUDITORIA : ' +
                     (ultimaAuditoria.total > 0 ?
                       formatDateTime(ultimaAuditoria.logs[0][1]) :
                       'Nunca executada');

      getSafeUi().alert('Status da Automação', mensagem, getSafeUi().ButtonSet.OK);

    } catch (error) {
      getSafeUi().alert('Erro', 'Erro ao obter status : ' + error.message, getSafeUi().ButtonSet.OK);
    }
  } catch (error) {
    Logger.log("Erro em mostrarStatusAutomacao: " + error.message);
    throw error;
  }
}


/**
 * Menu de manutenção manual
 */
function menuManutencao() {
  try {
    var ui = getSafeUi();

    var opcao = ui.prompt(
      'Manutenção do Sistema',
      'Escolha uma opção : \n\n' +
      '1 - Validar estrutura agora\n' +
      '2 - Executar auditoria completa\n' +
      '3 - Regenerar fórmulas\n' +
      '4 - Atualizar campos derivados\n' +
      '5 - Limpar logs antigos\n' +
      '6 - Ver status da automação\n' +
      '7 - Instalar/Reinstalar triggers\n\n' +
      'Digite o número : ',
      ui.ButtonSet.OK_CANCEL
    );

    if (opcao.getSelectedButton() == ui.Button.CANCEL) return;

    var escolha = parseInt(opcao.getResponseText());

    switch (escolha) {
      case 1 :
        validacaoEstruturaDiaria();
        safeAlert('Validação concluída! Verifique a aba System_Logs para detalhes.');
        break;
      case 2 :
        auditoriaCompletaSemanal();
        safeAlert('Auditoria concluída! Verifique a aba Auditoria_Log para resultados.');
        break;
      case 3 :
        regenerarFormulas();
        break;
      case 4 :
        atualizarCamposDerivados();
        safeAlert('Campos derivados atualizados!');
        break;
      case 5 :
        var dias = safePrompt('Limpar logs com mais de quantos dias ? ', '90', ui.ButtonSet.OK_CANCEL);
        if (dias.getSelectedButton() == ui.Button.OK) {
          var result = limparLogsAntigos(parseInt(dias.getResponseText()));
          safeAlert('Limpeza concluída! ' + result.registrosRemovidos + ' logs removidos.');
        }
        break;
      case 6 :
        mostrarStatusAutomacao();
        break;
      case 7 :
        instalarTriggersAutomaticos();
        break;
      default :
        safeAlert('Opção inválida');
    }
  } catch (error) {
    Logger.log("Erro em menuManutencao: " + error.message);
    throw error;
  }
}


// ---- Backup.gs ----
/**
 * Backup.gs
 * Sistema de backup manual e automático
 *
 * ⚠️ IMPORTANTE : Busca de pastas RESTRITA À PASTA RAIZ do Drive
 * Subpastas são IGNORADAS
 */

function backupManual() {
  try {
    var ui = getSafeUi();

    try {
      var ss = getSS();
      var ssFile = DriveApp.getFileById(ss.getId());
      var folderName = 'Backups_Notas_Menu';

      // Buscar APENAS na pasta raiz do Drive (sem subpastas)
      var rootFolder = DriveApp.getRootFolder();
      var folders = rootFolder.getFolders();
      var folder = null;

      while (folders.hasNext()) {
        var f = folders.next();
        if (f.getName() == folderName) {
          folder = f;
          break;
        }
      }

      // Se não encontrou, criar na pasta raiz
      if (!folder) {
        folder = rootFolder.createFolder(folderName);
      }

      var timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd'T'HHmmss");
      var copyName = ss.getName() + ' - backup ' + timestamp;
      ssFile.makeCopy(copyName, folder);
      var url = 'https : //drive.google.com/drive/folders/' + folder.getId();

      safeAlert('Backup Manual', 'Backup realizado com sucesso!\nPasta : ' + folderName + '\nLink : ' + url, ui.ButtonSet.OK);

      return { success : true, url : url };

    } catch (e) {
      if (e.message.indexOf('permissions') >= 0) {
        safeAlert('Erro de Permissão',
          'Para usar backup automático, é necessário autorizar acesso ao Drive.\n\n' +
          'Alternativa : Faça backup manual usando Arquivo > Fazer uma cópia no Google Sheets.',
          ui.ButtonSet.OK);
      } else {
        safeAlert('Erro no Backup', 'Erro : ' + e.message, ui.ButtonSet.OK);
      }
      Logger.log('Erro backupManual : ' + e.message);
      return {
        success : false,
        error : e.message
      };
    }
  } catch (error) {
    Logger.log("Erro em backupManual: " + error.message);
    throw error;
  }
}

function ativarBackupAutomatico() {
  try {
    var triggers = ScriptApp.getProjectTriggers();
    var exists = triggers.some(function(t) { return t.getHandlerFunction() == 'backupManual'; });
    if (!exists) {
      ScriptApp.newTrigger('backupManual').timeBased().everyDays(1).create();
      getSafeUi().alert('Backup automático ativado.');
    } else {
      getSafeUi().alert('Backup automático já estava ativado.');
    }
  } catch (error) {
    Logger.log("Erro em ativarBackupAutomatico: " + error.message);
    throw error;
  }
}

function desativarBackupAutomatico() {
  try {
    var triggers = ScriptApp.getProjectTriggers();
    var removed = 0;
    for (var i = 0; i < triggers.length; i++) {
      if (triggers[i].getHandlerFunction() == 'backupManual') {
        ScriptApp.deleteTrigger(triggers[i]);
        removed++
      }
    }
    getSafeUi().alert('Backup automático desativado. Triggers removidos : ' + removed);
  } catch (error) {
    Logger.log("Erro em desativarBackupAutomatico: " + error.message);
    throw error;
  }
}


// ---- CorrecaoSistema.gs ----
/**
 * CorrecaoSistema.gs
 * Funções para corrigir problemas comuns do sistema
 * Sistema UNIAE CRE PP/Cruzeiro
 */

/**
 * Função principal para corrigir problemas do sistema
 */
function corrigirProblemasComuns() {
  try {
    var ui = getSafeUi();

    ui.alert('Correção de Problemas do Sistema',
      'Esta função irá verificar e corrigir problemas comuns : \n\n' +
      '🔧 Estruturas de dados inconsistentes\n' +
      '🔧 Funções com erros\n' +
      '🔧 Permissões faltantes\n' +
      '🔧 Configurações incorretas\n\n' +
      'Iniciando correções/* spread */',
      ui.ButtonSet.OK
    );

    var problemas = [];
    var correcoes = [];

    try {
      // 1. Verificar e corrigir estruturas de dados
      var estruturasOK = verificarEstruturasSeguras();
      if (!estruturasOK.sucesso) {
        problemas.push('Estruturas de dados : ' + estruturasOK.erro);
        var corrigido = corrigirEstruturas();
        if (corrigido) {
          correcoes.push('✅ Estruturas de dados corrigidas');
        }
      } else {
        correcoes.push('✅ Estruturas de dados OK');
      }

      // 2. Verificar funções críticas
      var funcoesOK = verificarFuncoesCriticas();
      if (funcoesOK.problemas.length > 0) {
        problemas = problemas.concat(funcoesOK.problemas);
      }
      correcoes = correcoes.concat(funcoesOK.correcoes);

      // 3. Verificar configurações
      var configOK = verificarConfiguracoes();
      if (!configOK.sucesso) {
        problemas.push('Configurações : ' + configOK.erro);
        var configCorrigida = corrigirConfiguracoes();
        if (configCorrigida) {
          correcoes.push('✅ Configurações corrigidas');
        }
      } else {
        correcoes.push('✅ Configurações OK');
      }

      // 4. Testar funcionalidades básicas
      var testesOK = executarTestesBasicos();
      correcoes.push('✅ Testes básicos : ' + testesOK.passou + '/' + testesOK.total + ' passaram');

      // Exibir resultado
      var mensagem = '🔧 CORREÇÃO DE PROBLEMAS CONCLUÍDA\n\n';

      if (problemas.length > 0) {
        mensagem += '⚠️ PROBLEMAS ENCONTRADOS : \n• ' + problemas.join('\n• ') + '\n\n';
      }

      mensagem += '✅ CORREÇÕES APLICADAS : \n• ' + correcoes.join('\n• ') + '\n\n';

      if (problemas.length == 0) {
        mensagem += '🎉 SISTEMA ESTÁ FUNCIONANDO PERFEITAMENTE!';
      } else {
        mensagem += '⚠️ Alguns problemas podem precisar de atenção manual.';
      }

      safeAlert('Correção Concluída', mensagem, ui.ButtonSet.OK);

    } catch (e) {
      safeAlert('Erro na Correção', 'Erro durante a correção : ' + e.message, ui.ButtonSet.OK);
      Logger.log('Erro corrigirProblemasComuns : ' + e.message);
    }
  } catch (error) {
    Logger.log("Erro em corrigirProblemasComuns: " + error.message);
    throw error;
  }
}


/**
 * Verificar estruturas de dados de forma segura
 */
function verificarEstruturasSeguras() {
  try {
    // Verificar se SHEET_STRUCTURES existe e está bem formado
    if (typeof SHEET_STRUCTURES == 'undefined') {
      return {sucesso : false, erro : 'SHEET_STRUCTURES não definido'};
    }

    var estruturasValidas = 0;
    var estruturasTotal = 0;

    for (var sheetName in SHEET_STRUCTURES) {
      estruturasTotal++
      var structure = SHEET_STRUCTURES[sheetName];

      if (structure && structure.headers && Array.isArray(structure.headers)) {
        estruturasValidas++
      }
    }

    if (estruturasValidas == estruturasTotal && estruturasTotal > 0) {} else {}

  } catch (e) {
    Logger.log('Erro verificarEstruturasSeguras : ' + e.message);
  }
}


/**
 * Corrigir estruturas de dados
 */
function corrigirEstruturas() {
  try {
    try {
      // Verificar se as estruturas essenciais existem
      var estruturasEssenciais = ['Notas_Fiscais', 'Entregas', 'Recusas', 'Glosas'];
      var corrigidas = 0;

      estruturasEssenciais.forEach(function(nome) {
        if (!SHEET_STRUCTURES[nome] || !SHEET_STRUCTURES[nome].headers) {
          // Criar estrutura básica
          SHEET_STRUCTURES[nome] = {
            name : nome,
            description : 'Estrutura corrigida automaticamente',
            headers : ['ID', 'Data', 'Descricao', 'Status'],
            validations : {}
          };
          corrigidas++
        }
      });

    } catch (e) {
      Logger.log('Erro corrigirEstruturas : ' + e.message);
    }
  } catch (error) {
    Logger.log("Erro em corrigirEstruturas: " + error.message);
    throw error;
  }
}


/**
 * Verificar funções críticas
 */
function verificarFuncoesCriticas() {
  try {
    var funcoesCriticas = [
      'buildMenu',
      'getSafeUi',
      'safeNumber',
      '_findHeaderIndex',
      'getSheetData',
      'createReportSpreadsheet',
      'verificarIrregularidades',
      'buscaGlobalDrive'
    ];

    var problemas = [];
    var correcoes = [];

    funcoesCriticas.forEach(function(nomeFuncao) {
      try {
        if (typeof this[nomeFuncao] == 'function') {
          correcoes.push('✅ ' + nomeFuncao + ' disponível');
        } else {
          problemas.push('❌ Função ' + nomeFuncao + ' não encontrada');
        }
      } catch (e) {
        problemas.push('❌ Erro ao verificar ' + nomeFuncao + ' : ' + e.message);
      }
    });

    return { problemas: problemas, correcoes };
  } catch (error) {
    Logger.log("Erro em verificarFuncoesCriticas: " + error.message);
    throw error;
  }
}

/**
 * Verificar configurações do sistema
 */
function verificarConfiguracoes() {
  try {
    var props = PropertiesService.getScriptProperties();
    var configsEssenciais = ['PROCESS_PERIOD', 'PROCESS_MAX_RECORDS'];
    var configsOK = 0;

    configsEssenciais.forEach(function(config) {
      if (props.getProperty(config)) {
        configsOK++
      }
    });

    if (configsOK == configsEssenciais.length) {} else {}

  } catch (e) {
    Logger.log('Erro verificarConfiguracoes : ' + e.message);
  }
}


/**
 * Corrigir configurações
 */
function corrigirConfiguracoes() {
  try {
    var props = PropertiesService.getScriptProperties();
    var corrigidas = 0;

    // Configurações padrão
    var configsPadrao = {
      'PROCESS_PERIOD' : 'trimestre',
      'PROCESS_MAX_RECORDS' : '200',
      'ENV' : 'development'
    };

    for (var config in configsPadrao) {
      if (!props.getProperty(config)) {
        props.setProperty(config, configsPadrao[config]);
        corrigidas++
      }
    }

  } catch (e) {
    Logger.log('Erro corrigirConfiguracoes : ' + e.message);
  }
}


/**
 * Executar testes básicos - OTIMIZADO
 */
function executarTestesBasicos() {
  var testes = [
    {nome : 'getSafeUi', teste: function() { return typeof getSafeUi() == 'object'; }},
    {nome : 'safeNumber', teste: function() { return safeNumber(123) == 123; }},
    {nome : '_findHeaderIndex', teste: function() { return _findHeaderIndex(['a','b','c'], 'b') == 1; }},
    {nome : 'formatDate', teste: function() { return typeof formatDate(new Date()) == 'string'; }}
  ];

  var passou = 0;
  var total = testes.length;

  testes.forEach(function(t) {
    try {
      if (t.teste()) {
        passou++
      }
    } catch (e) {
      Logger.log('Erro no teste ' + t.nome + ' : ' + e.message);
    }
  });

  return { passou: passou, total };
}


/**
 * Diagnóstico completo do sistema
 */
function diagnosticoCompleto() {
  var ui = getSafeUi();

  ui.alert('Diagnóstico Completo do Sistema',
    'Executando diagnóstico abrangente/* spread */\n\nAguarde/* spread */',
    ui.ButtonSet.OK
  );

  var diagnostico = {
    estruturas : verificarEstruturasSeguras(),
    funcoes : verificarFuncoesCriticas(),
    configuracoes : verificarConfiguracoes(),
    testes : executarTestesBasicos(),
    menu : verificarMenu(),
    drive : verificarAcessoDrive()
  };

  // Criar relatório de diagnóstico
  var headers = ['Componente', 'Status', 'Detalhes', 'Recomendacao'];
  var data = [
    [
      'Estruturas de Dados',
      diagnostico.estruturas.sucesso ? '✅ OK' : '❌ Problema',
      diagnostico.estruturas.sucesso ? 'Todas as estruturas válidas' : diagnostico.estruturas.erro,
      diagnostico.estruturas.sucesso ? 'Nenhuma ação necessária' : 'Execute corrigirProblemasComuns()'
    ],
    [
      'Funções Críticas',
      diagnostico.funcoes.problemas.length == 0 ? '✅ OK' : '⚠️ Atenção',
      diagnostico.funcoes.problemas.length + ' problemas encontrados',
      diagnostico.funcoes.problemas.length == 0 ? 'Nenhuma ação necessária' : 'Verifique implementações'
    ],
    [
      'Configurações',
      diagnostico.configuracoes.sucesso ? '✅ OK' : '❌ Problema',
      diagnostico.configuracoes.sucesso ? 'Configurações válidas' : diagnostico.configuracoes.erro,
      diagnostico.configuracoes.sucesso ? 'Nenhuma ação necessária' : 'Execute corrigirProblemasComuns()'
    ],
    [
      'Testes Básicos',
      diagnostico.testes.passou == diagnostico.testes.total ? '✅ OK' : '⚠️ Atenção',
      diagnostico.testes.passou + '/' + diagnostico.testes.total + ' testes passaram',
      diagnostico.testes.passou == diagnostico.testes.total ? 'Nenhuma ação necessária' : 'Verifique funções com falha'
    ],
    [
      'Menu Principal',
      diagnostico.menu.disponivel ? '✅ OK' : '❌ Problema',
      diagnostico.menu.disponivel ? 'Menu funcionando' : 'Menu não disponível',
      diagnostico.menu.disponivel ? 'Nenhuma ação necessária' : 'Execute forcarCriacaoMenu()'
    ],
    [
      'Acesso ao Drive',
      diagnostico.drive.disponivel ? '✅ OK' : '❌ Problema',
      diagnostico.drive.disponivel ? 'Acesso funcionando' : diagnostico.drive.erro,
      diagnostico.drive.disponivel ? 'Nenhuma ação necessária' : 'Verifique permissões'
    ]
  ];

  var resultado = createReportSpreadsheet('Diagnostico_Sistema', 'diagnostico', headers, data);

  if (resultado.success) {
    var statusGeral = (diagnostico.estruturas.sucesso &&
                      diagnostico.funcoes.problemas.length == 0 &&
                      diagnostico.configuracoes.sucesso &&
                      diagnostico.testes.passou == diagnostico.testes.total) ?
                      '🎉 SISTEMA SAUDÁVEL' : '⚠️ REQUER ATENÇÃO';

    safeAlert('Diagnóstico Concluído',
      statusGeral + '\n\n' +
      '📊 RESUMO : \n' +
      '• Estruturas : ' + (diagnostico.estruturas.sucesso ? 'OK' : 'Problema') + '\n' +
      '• Funções : ' + diagnostico.funcoes.problemas.length + ' problemas\n' +
      '• Configurações : ' + (diagnostico.configuracoes.sucesso ? 'OK' : 'Problema') + '\n' +
      '• Testes : ' + diagnostico.testes.passou + '/' + diagnostico.testes.total + '\n\n' +
      '📄 Relatório : ' + resultado.fileName + '\n' +
      '🔗 Acesse : ' + resultado.url,
      ui.ButtonSet.OK
    );
  }
}

function verificarMenu() {
  try {
    return {disponivel : typeof buildMenu == 'function'};
  } catch (e) {
    return {disponivel : false, erro : e.message};
  }
}

function verificarAcessoDrive() {
  try {
    DriveApp.getRootFolder();
    return {disponivel : true};
  } catch (e) {
    return {disponivel : false, erro : e.message};
  }
}

/**
 * Status rápido do sistema - pode ser executado a qualquer momento
 */
function statusSistema() {
  try {
    Logger.log('== STATUS DO SISTEMA UNIAE ==');

    try {
      // Verificar funções críticas
      var funcoesCriticas = ['buildMenu', 'getSafeUi', 'safeNumber', 'buscaGlobalDrive', 'verificarIrregularidades'];
      var funcoesOK = 0;

      funcoesCriticas.forEach(function(nome) {
        if (typeof this[nome] == 'function') {
          Logger.log('✅ ' + nome + ' - OK');
          funcoesOK++
        } else {
          Logger.log('❌ ' + nome + ' - FALTANDO');
        }
      });

      // Verificar estruturas
      var estruturasOK = 0;
      if (typeof SHEET_STRUCTURES != 'undefined') {
        estruturasOK = Object.keys(SHEET_STRUCTURES).length;
        Logger.log('✅ Estruturas de dados : ' + estruturasOK + ' definidas');
      } else {
        Logger.log('❌ SHEET_STRUCTURES não definido');
      }

      // Verificar configurações
      var props = PropertiesService.getScriptProperties();
      var configsOK = 0;
      var configsEssenciais = ['PROCESS_PERIOD', 'PROCESS_MAX_RECORDS'];

      configsEssenciais.forEach(function(config) {
        if (props.getProperty(config)) {
          Logger.log('✅ Config ' + config + ' : ' + props.getProperty(config));
          configsOK++
        } else {
          Logger.log('❌ Config ' + config + ' - FALTANDO');
        }
      });

      // Verificar acesso ao Drive
      try {
        DriveApp.getRootFolder();
        Logger.log('✅ Acesso ao Drive - OK');
      } catch (e) {
        Logger.log('❌ Acesso ao Drive - ERRO : ' + e.message);
      }

      // Resumo
      Logger.log('== RESUMO ==');
      Logger.log('Funções críticas : ' + funcoesOK + '/' + funcoesCriticas.length);
      Logger.log('Estruturas : ' + estruturasOK);
      Logger.log('Configurações : ' + configsOK + '/' + configsEssenciais.length);
      var statusGeralDiag;
      if (funcoesOK == funcoesCriticas.length && estruturasOK > 0 && configsOK == configsEssenciais.length) {
        statusGeralDiag = 'SAUDÁVEL';
      } else {
        statusGeralDiag = 'COM_PROBLEMAS';
      }

      return {
        funcoes : funcoesOK + '/' + funcoesCriticas.length,
        estruturas : estruturasOK,
        configuracoes : configsOK + '/' + configsEssenciais.length,
        saudavel : funcoesOK == funcoesCriticas.length && estruturasOK > 0 && configsOK == configsEssenciais.length
      };

    } catch (e) {
      Logger.log('❌ Erro ao verificar status : ' + e.message);
    }
  } catch (error) {
    Logger.log("Erro em statusSistema: " + error.message);
    throw error;
  }
}


/**
 * Função de emergência - executa correções básicas sem UI
 */
function emergenciaCorrecao() {
  try {
    Logger.log('== CORREÇÃO DE EMERGÊNCIA ==');

    try {
      // 1. Configurações básicas
      var props = PropertiesService.getScriptProperties();
      if (!props.getProperty('PROCESS_PERIOD')) {
        props.setProperty('PROCESS_PERIOD', 'trimestre');
        Logger.log('✅ PROCESS_PERIOD configurado');
      }
      if (!props.getProperty('PROCESS_MAX_RECORDS')) {
        props.setProperty('PROCESS_MAX_RECORDS', '200');
        Logger.log('✅ PROCESS_MAX_RECORDS configurado');
      }

      // 2. Testar funções básicas
      try {
        var teste1 = safeNumber(123);
        Logger.log('✅ safeNumber funcionando : ' + teste1);
      } catch (e) {
        Logger.log('❌ safeNumber com erro : ' + e.message);
        return {
          chaveAcesso : chaveAcesso,
          situacao : "ERRO",
          valida : false
        };
      }

      try {
        var teste2 = _findHeaderIndex(['a', 'b', 'c'], 'b');
        Logger.log('✅ _findHeaderIndex funcionando : ' + teste2);
      } catch (e) {
        Logger.log('❌ _findHeaderIndex com erro : ' + e.message);
      }

      // 3. Verificar estruturas
      if (typeof SHEET_STRUCTURES != 'undefined') {
        Logger.log('✅ SHEET_STRUCTURES disponível : ' + Object.keys(SHEET_STRUCTURES).length + ' estruturas');
      } else {
        Logger.log('❌ SHEET_STRUCTURES não disponível');
      }

      Logger.log('== CORREÇÃO DE EMERGÊNCIA CONCLUÍDA ==');

    } catch (e) {
      Logger.log('❌ Erro na correção de emergência : ' + e.message);
    }
  } catch (error) {
    Logger.log("Erro em emergenciaCorrecao: " + error.message);
    throw error;
  }
}


