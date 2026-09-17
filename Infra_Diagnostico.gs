'use strict';

/**
 * INFRA_DIAGNOSTICO
 * Consolidado de : DiagnosticoFinal.gs
 * @version 2.0.0
 * @created 2025-11-04
 */


// ---- DiagnosticoFinal.gs ----
/**
 * DiagnosticoFinal.gs
 * Sistema de Teste e Diagnóstico Final
 * Verifica integridade completa do sistema
 * Compara com NotasFiscais.xlsx (modelo de referência)
 * Gera relatório consolidado na aba Diagnóstico
 * Sistema UNIAE CRE PP/Cruzeiro - Portaria 244/2006
 */

/**
 * ==
 * ESTRUTURA DE REFERÊNCIA (NotasFiscais.xlsx)
 * ==
 */

var ESTRUTURA_REFERENCIA = {
  'Notas_Fiscais' : {
    colunas : [
      'ID_NF',
      'Numero_NF',
      'Chave_Acesso',
      'Data_Emissao',
      'Data_Recebimento',
      'Fornecedor_CNPJ',
      'Fornecedor_Nome',
      'Nota_Empenho',
      'Valor_Total',
      'Status_NF',
      'Responsavel_Conferencia',
      'Data_Conferencia',
      'Observacoes',
      'Arquivo_PDF',
      // Campos derivados (aprimoramento)
      'NF_DiasDesdeEmissao',
      'NF_DiasDesdeRecebimento',
      'NF_AtesteoPendente',
      'NF_PrazoAtesto',
      'NF_AtesteAtrasado',
      'NF_TemGlosa',
      'NF_ValorGlosado',
      'NF_ValorLiquido',
      // Campos de auditoria (aprimoramento)
      'Audit_DataCriacao',
      'Audit_UsuarioCriacao',
      'Audit_DataUltAlt',
      'Audit_UsuarioUltAlt'
    ],
    // obrigatorias : ['Numero_NF', 'Chave_Acesso', 'Data_Emissao', 'Fornecedor_CNPJ', 'Valor_Total'],
    derivadas : ['NF_DiasDesdeEmissao', 'NF_DiasDesdeRecebimento', 'NF_AtesteoPendente', 'NF_PrazoAtesto',
                'NF_AtesteAtrasado', 'NF_TemGlosa', 'NF_ValorGlosado', 'NF_ValorLiquido']
      // auditoria : ['Audit_DataCriacao', 'Audit_UsuarioCriacao', 'Audit_DataUltAlt', 'Audit_UsuarioUltAlt']
  },

  'Entregas' : {
    colunas : [
      'ID_Entrega',
      'NF_ID',
      'Data_Entrega',
      'Unidade_Escolar',
      'Responsavel_Recebimento',
      'Produtos_Entregues',
      'Quantidades',
      'Qualidade_Produtos',
      'Temperatura_Recebimento',
      'Condicoes_Transporte',
      'Documentos_Anexos',
      'Status_Entrega',
      'Observacoes_Entrega',
      'Data_Registro',
      'Usuario_Registro',
      // Campos derivados (aprimoramento)
      'Entrega_DiasDesde',
      'Entrega_TemRecusa',
      'Entrega_TemGlosa',
      'Entrega_NF_Numero',
      'Entrega_Fornecedor'
    ],
      // obrigatorias : ['NF_ID', 'Data_Entrega', 'Unidade_Escolar', 'Responsavel_Recebimento'],
    derivadas : ['Entrega_DiasDesde', 'Entrega_TemRecusa', 'Entrega_TemGlosa', 'Entrega_NF_Numero', 'Entrega_Fornecedor']
  },

  'Recusas' : {
    colunas : [
      'ID_Recusa',
      'NF_ID',
      'Entrega_ID',
      'Data_Recusa',
      'Motivo_Recusa',
      'Produtos_Recusados',
      'Quantidades_Recusadas',
      'Responsavel_Recusa',
      'Evidencias',
      'Acao_Corretiva',
      'Status_Resolucao',
      'Data_Resolucao',
      'Observacoes_Recusa',
      'Usuario_Registro',
      // Campos derivados (aprimoramento)
      'Recusa_DiasDesde',
      'Recusa_DiasResolucao',
      'Recusa_PendenteHaMais5',
      'Recusa_GeraGlosa'
    ],
      // obrigatorias : ['NF_ID', 'Data_Recusa', 'Motivo_Recusa', 'Responsavel_Recusa'],
    derivadas : ['Recusa_DiasDesde', 'Recusa_DiasResolucao', 'Recusa_PendenteHaMais5', 'Recusa_GeraGlosa']
  },

  'Glosas' : {
    colunas : [
      'ID_Glosa',
      'NF_ID',
      'Entrega_ID',
      'Recusa_ID',
      'Data_Glosa',
      'Tipo_Glosa',
      'Motivo_Glosa',
      'Valor_Glosado',
      'Responsavel_Glosa',
      'Base_Legal',
      'Status_Glosa',
      'Recurso_Fornecedor',
      'Data_Recurso',
      'Data_Resolucao',
      'Observacoes_Glosa',
      'Usuario_Registro',
      // Campos derivados (aprimoramento)
      'Glosa_DiasDesde',
      'Glosa_PercNF',
      'Glosa_TemRecurso',
      'Glosa_DiasRecurso',
      'Glosa_NF_Numero'
    ],
      // obrigatorias : ['NF_ID', 'Data_Glosa', 'Tipo_Glosa', 'Valor_Glosado', 'Responsavel_Glosa'],
    derivadas : ['Glosa_DiasDesde', 'Glosa_PercNF', 'Glosa_TemRecurso', 'Glosa_DiasRecurso', 'Glosa_NF_Numero']
  }
};

/**
 * ==
 * FUNÇÃO PRINCIPAL DE DIAGNÓSTICO
 * ==
 */

/**
 * Executa diagnóstico completo da planilha
 * Gera relatório consolidado na aba Diagnóstico
 */
function diagnosticoPlanilha() {
  try {
    try {
      var ui = getSafeUi();

      ui.alert(
        '🔍 Diagnóstico Completo do Sistema',
        'Iniciando diagnóstico completo/* spread */\n\n' +
        'Verificações : \n' +
        '✓ Existência de abas essenciais\n' +
        '✓ Integridade de estruturas\n' +
        '✓ Comparação com NotasFiscais.xlsx\n' +
        '✓ Divergências de colunas\n' +
        '✓ Validação de dados\n' +
        '✓ Análise de performance\n\n' +
        'Aguarde/* spread */',
        ui.ButtonSet.OK
      );

      var resultado = {
        timestamp : new Date(),
        versao : '1.0.0',
        sistema : 'UNIAE CRE PP/Cruzeiro',
        diagnosticos : [],
        resumo : {
          total : 0,
          sucesso : 0,
          avisos : 0,
          erros : 0,
          criticos : 0
        },
        // recomendacoes : []
      };

      // 1. Verificar abas essenciais
      var abasResult = verificarAbasEssenciais();
      resultado.diagnosticos.push(abasResult);
      atualizarResumo(resultado.resumo, abasResult);

      // 2. Verificar estrutura de cada aba
      var estruturaResult = verificarEstruturaColunas();
      resultado.diagnosticos.push(estruturaResult);
      atualizarResumo(resultado.resumo, estruturaResult);

      // 3. Comparar com modelo de referência
      var comparacaoResult = compararComReferencia();
      resultado.diagnosticos.push(comparacaoResult);
      atualizarResumo(resultado.resumo, comparacaoResult);

      // 4. Validar integridade de dados
      var integridadeResult = validarIntegridadeDados();
      resultado.diagnosticos.push(integridadeResult);
      atualizarResumo(resultado.resumo, integridadeResult);

      // 5. Verificar fórmulas e campos derivados
      var formulasResult = verificarFormulasDerivadas();
      resultado.diagnosticos.push(formulasResult);
      atualizarResumo(resultado.resumo, formulasResult);

      // 6. Analisar performance
      var performanceResult = analisarPerformance();
      resultado.diagnosticos.push(performanceResult);
      atualizarResumo(resultado.resumo, performanceResult);

      // 7. Verificar integridade referencial
      var referencialResult = verificarIntegridadeReferencial();
      resultado.diagnosticos.push(referencialResult);
      atualizarResumo(resultado.resumo, referencialResult);

      // 8. Gerar recomendações
      resultado.recomendacoes = gerarRecomendacoes(resultado);

      // 9. Calcular score geral
      resultado.scoreGeral = calcularScoreGeral(resultado.resumo);

      // 10. Gerar relatório na aba Diagnóstico
      gerarRelatorioDiagnostico(resultado);

      // 11. Mostrar resultado
      mostrarResultadoDiagnostico(resultado);


    } catch (error) {
      Logger.log('Erro diagnosticoPlanilha : ' + error.message);
      getSafeUi().alert('Erro', 'Erro ao executar diagnóstico : \n\n' + error.message, getSafeUi().ButtonSet.OK);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em diagnosticoPlanilha: " + error.message);
    throw error;
  }
}


/**
 * ==
 * VERIFICAÇÕES ESPECÍFICAS
 * ==
 */

/**
 * 1. Verifica existência de abas essenciais
 */
function verificarAbasEssenciais() {
  try {
    var resultado = {
      tipo : 'ABAS_ESSENCIAIS',
      titulo : 'Verificação de Abas Essenciais',
      sucesso : 0,
      avisos : 0,
      erros : 0,
      criticos : 0,
      detalhes : []
    };

    var ss = getSS();
    var existingSheets = ss.getSheets().map(function(s) { return s.getName(); });

    var abasEssenciais = ['Notas_Fiscais', 'Entregas', 'Recusas', 'Glosas'];

    abasEssenciais.forEach(function(abaName) {
      if (existingSheets.indexOf(abaName) >= 0) {
        resultado.sucesso++
        resultado.detalhes.push({
          status : 'OK',
          aba : abaName,
          mensagem : 'Aba encontrada'
        });
      } else {
        resultado.criticos++
        resultado.erros++
        resultado.detalhes.push({
          status : 'CRITICO',
          aba : abaName,
          mensagem : 'Aba essencial ausente',
          acao : 'Criar aba com estrutura padrão'
        });
      }
    });

    // Verificar abas adicionais (aprimoramentos)
    var abasAdicionais = [
      'PDGP',
      'Ref_Fornecedores',
      'Ref_Unidades',
      'Ref_MotivosRecusa',
      'Ref_TiposGlosa',
      'Config_Membros_Comissao',
      'Auditoria_Log',
      'System_Logs',
      'Textos_Padrao',
      'Controle_Conferencia',
      'Substituicoes'
    ];

    abasAdicionais.forEach(function(abaName) {
      if (existingSheets.indexOf(abaName) >= 0) {
        resultado.sucesso++
        resultado.detalhes.push({
          status : 'OK',
          aba : abaName,
          mensagem : 'Aba de aprimoramento encontrada'
        });
      } else {
        resultado.avisos++
        resultado.detalhes.push({
          status : 'AVISO',
          aba : abaName,
          mensagem : 'Aba de aprimoramento ausente (opcional)',
          acao : 'Considerar criar para funcionalidades avançadas'
        });
      }
    });

  } catch (error) {
    Logger.log("Erro em verificarAbasEssenciais: " + error.message);
    throw error;
  }
}

/**
 * 2. Verifica estrutura de colunas
 */
function verificarEstruturaColunas() {
  try {
    try {
      var resultado = {
        tipo : 'ESTRUTURA_COLUNAS',
        titulo : 'Verificação de Estrutura de Colunas',
        sucesso : 0,
        avisos : 0,
        erros : 0,
        criticos : 0,
        detalhes : []
      };

      var ss = getSS();

      for (var abaName in ESTRUTURA_REFERENCIA) {
        var sheet = ss.getSheetByName(abaName);

        if (!sheet) {
          resultado.criticos++
          resultado.erros++
          resultado.detalhes.push({
            status : 'CRITICO',
            aba : abaName,
            mensagem : 'Aba não encontrada para verificação'
          });
          continue;
        }

        var estruturaEsperada = ESTRUTURA_REFERENCIA[abaName];
        var lastCol = sheet.getLastColumn();

        if (lastCol == 0) {
          resultado.avisos++
          resultado.detalhes.push({
            status : 'AVISO',
            aba : abaName,
            mensagem : 'Aba vazia (sem colunas)'
          });
          continue;
        }

        var headersAtuais = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
        var colunasEsperadas = estruturaEsperada.colunas;

        // Verificar colunas básicas (modelo original)
        var colunasBasicas = colunasEsperadas.filter(function(col) {
          return (!estruturaEsperada.auditoria || estruturaEsperada.auditoria.indexOf(col) < 0);
        });

        var faltando = [];
        var extras = [];

        colunasBasicas.forEach(function(colEsperada) {
          if (headersAtuais.indexOf(colEsperada) < 0) {
            faltando.push(colEsperada);
          }
        });

        headersAtuais.forEach(function(colAtual) {
          if (colunasEsperadas.indexOf(colAtual) < 0 && colAtual != '') {
            extras.push(colAtual);
          }
        });

        if (faltando.length == 0 && extras.length == 0) {
          resultado.sucesso++
          resultado.detalhes.push({
            status : 'OK',
            aba : abaName,
            mensagem : 'Estrutura básica conforme modelo',
            colunas : headersAtuais.length
          });
        } else {
          if (faltando.length > 0) {
            resultado.erros++
            resultado.detalhes.push({
              status : 'ERRO',
              aba : abaName,
              mensagem : 'Colunas faltando : ' + faltando.join(', '),
              acao : 'Adicionar colunas faltantes'
            });
          }

          if (extras.length > 0) {
            resultado.avisos++
            resultado.detalhes.push({
              status : 'AVISO',
              aba : abaName,
              mensagem : 'Colunas extras encontradas : ' + extras.join(', '),
              acao : 'Verificar se são personalizações válidas'
            });
          }
        }
      }

    } catch (error) {
      Logger.log("Erro em verificarEstruturaColunas: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em verificarEstruturaColunas: " + error.message);
    throw error;
  }
}

/**
 * 3. Compara com modelo de referência (NotasFiscais.xlsx)
 */
function compararComReferencia() {
  try {
    try {
      var resultado = {
        tipo : 'COMPARACAO_REFERENCIA',
        titulo : 'Comparação com NotasFiscais.xlsx (Modelo de Referência)',
        sucesso : 0,
        avisos : 0,
        erros : 0,
        criticos : 0,
        detalhes : []
      };

      var ss = getSS();

      for (var abaName in ESTRUTURA_REFERENCIA) {
        var sheet = ss.getSheetByName(abaName);
        if (!sheet) continue;

        var estruturaEsperada = ESTRUTURA_REFERENCIA[abaName];
        var lastCol = sheet.getLastColumn();

        if (lastCol == 0) continue;

        var headersAtuais = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

        // Verificar aprimoramentos implementados
        var aprimoramentos = {
          derivadas : 0,
          auditoria : 0,
          total : 0
        };

        if (estruturaEsperada.derivadas) {
          estruturaEsperada.derivadas.forEach(function(col) {
            if (headersAtuais.indexOf(col) >= 0) {
              aprimoramentos.derivadas++
              aprimoramentos.total++
            }
          });
        }

        if (estruturaEsperada.auditoria) {
          estruturaEsperada.auditoria.forEach(function(col) {
            if (headersAtuais.indexOf(col) >= 0) {
              aprimoramentos.auditoria++
              aprimoramentos.total++
            }
          });
        }

        var percAprimoramento = 0;
        var totalAprimoramentos;
        if (estruturaEsperada.derivadas) {
          totalAprimoramentos = estruturaEsperada.derivadas.length;
        } else {
          totalAprimoramentos = 0;
        }
        totalAprimoramentos += (estruturaEsperada.auditoria ? estruturaEsperada.auditoria.length : 0);

        if (totalAprimoramentos > 0) {
          percAprimoramento = Math.round((aprimoramentos.total / totalAprimoramentos) * 100);
        }

        if (percAprimoramento == 100) {
          resultado.sucesso++
          resultado.detalhes.push({
            status : 'EXCELENTE',
            aba : abaName,
            mensagem : 'Modelo aprimorado 100% implementado',
            aprimoramentos : aprimoramentos.total + ' campos adicionais',
            derivadas : aprimoramentos.derivadas,
            auditoria : aprimoramentos.auditoria
          });
        } else if (percAprimoramento >= 50) {
          resultado.avisos++
          resultado.detalhes.push({
            status : 'BOM',
            aba : abaName,
            mensagem : 'Modelo parcialmente aprimorado (' + percAprimoramento + '%)',
            aprimoramentos : aprimoramentos.total + '/' + totalAprimoramentos + ' campos',
            acao : 'Considerar implementar campos restantes'
          });
        } else if (percAprimoramento > 0) {
          resultado.avisos++
          resultado.detalhes.push({
            status : 'BASICO',
            aba : abaName,
            mensagem : 'Modelo básico com poucos aprimoramentos (' + percAprimoramento + '%)',
            aprimoramentos : aprimoramentos.total + '/' + totalAprimoramentos + ' campos',
            acao : 'Recomendado implementar aprimoramentos'
          });
        } else {
          resultado.avisos++
          resultado.detalhes.push({
            status : 'BASICO',
            aba : abaName,
            mensagem : 'Modelo básico sem aprimoramentos',
            acao : 'Considerar adicionar campos derivados e auditoria'
          });
        }
      }

    } catch (error) {
      Logger.log("Erro em compararComReferencia: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em compararComReferencia: " + error.message);
    throw error;
  }
}

/**
 * 4. Valida integridade de dados
 */
function validarIntegridadeDados() {
  try {
    try {
      var resultado = {
        tipo : 'INTEGRIDADE_DADOS',
        titulo : 'Validação de Integridade de Dados',
        sucesso : 0,
        avisos : 0,
        erros : 0,
        criticos : 0,
        detalhes : []
      };

      var ss = getSS();

      for (var abaName in ESTRUTURA_REFERENCIA) {
        var sheet = ss.getSheetByName(abaName);
        if (!sheet) continue;

        var lastRow = sheet.getLastRow();
        if (lastRow <= 1) {
          resultado.avisos++
          resultado.detalhes.push({
            status : 'AVISO',
            aba : abaName,
            mensagem : 'Aba sem dados (apenas header)'
          });
          continue;
        }

        var estruturaEsperada = ESTRUTURA_REFERENCIA[abaName];
        var lastCol = sheet.getLastColumn();
        var headersAtuais = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
        var data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

        var problemas = {
          camposVazios : 0,
          valoresInvalidos : 0,
          duplicidades : 0
        };

        // Verificar campos obrigatórios
        estruturaEsperada.obrigatorias.forEach(function(campoObrigatorio) {
          var colIndex = headersAtuais.indexOf(campoObrigatorio);
          if (colIndex < 0) return;

          data.forEach(function(row, rowIndex) {
            if (!row[colIndex] || String(row[colIndex]).trim() == '') {
              problemas.camposVazios++
            }
          });
        });

        // Verificar duplicidades de ID
        var idColIndex;
        if (headersAtuais.indexOf('ID_' + abaName.replace('_', '').substring(0, abaName.indexOf('_'))) > 0) {
          idColIndex = abaName.indexOf('_');
        } else {
          idColIndex = abaName.length;
        }
        if (idColIndex < 0) {
          idColIndex = 0; // Primeira coluna como fallback
        }

        var idsVistos = {};
        data.forEach(function(row, rowIndex) {
          var id = row[idColIndex];
          if (id) {
            if (idsVistos[id]) {
              problemas.duplicidades++
            } else {
              idsVistos[id] = true;
            }
          }
        });

        if (problemas.camposVazios == 0 && problemas.valoresInvalidos == 0 && problemas.duplicidades == 0) {
          resultado.sucesso++
          resultado.detalhes.push({
            status : 'OK',
            aba : abaName,
            mensagem : 'Integridade de dados OK',
            registros : data.length
          });
        } else {
          if (problemas.camposVazios > 0) {
            resultado.erros++
            resultado.detalhes.push({
              status : 'ERRO',
              aba : abaName,
              mensagem : problemas.camposVazios + ' campos obrigatórios vazios',
              acao : 'Preencher campos obrigatórios'
            });
          }

          if (problemas.duplicidades > 0) {
            resultado.erros++
            resultado.detalhes.push({
              status : 'ERRO',
              aba : abaName,
              mensagem : problemas.duplicidades + ' IDs duplicados',
              acao : 'Corrigir duplicidades'
            });
          }
        }
      }

    } catch (error) {
      Logger.log("Erro em validarIntegridadeDados: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em validarIntegridadeDados: " + error.message);
    throw error;
  }
}

/**
 * 5. Verifica fórmulas e campos derivados
 */
function verificarFormulasDerivadas() {
  try {
    try {
      var resultado = {
        tipo : 'FORMULAS_DERIVADAS',
        titulo : 'Verificação de Fórmulas e Campos Derivados',
        sucesso : 0,
        avisos : 0,
        erros : 0,
        criticos : 0,
        detalhes : []
      };

      var ss = getSS();

      for (var abaName in ESTRUTURA_REFERENCIA) {
        var sheet = ss.getSheetByName(abaName);
        if (!sheet) continue;

        var estruturaEsperada = ESTRUTURA_REFERENCIA[abaName];
        if (!estruturaEsperada.derivadas || estruturaEsperada.derivadas.length == 0) continue;

        var lastRow = sheet.getLastRow();
        if (lastRow <= 1) continue;

        var lastCol = sheet.getLastColumn();
        var headersAtuais = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

        var formulasEncontradas = 0;
        var formulasQuebradas = 0;
        var formulasAusentes = 0;

        estruturaEsperada.derivadas.forEach(function(campoDerivado) {
          var colIndex = headersAtuais.indexOf(campoDerivado);
          if (colIndex < 0) {
            formulasAusentes++
            return;
          }

          // Verificar se tem fórmula na linha 2
          var formula = sheet.getRange(2, colIndex + 1).getFormula();
          if (formula && formula != '') {
            formulasEncontradas++

            // Verificar se fórmula está quebrada
            var valor = sheet.getRange(2, colIndex + 1).getValue();
            if (String(valor).indexOf('#REF!') >= 0 || String(valor).indexOf('#VALOR!') >= 0 || 
                String(valor).indexOf('#N/D') >= 0 || String(valor).indexOf('#NOME ? ') >= 0) {
              formulasQuebradas++
            }
          } else {
            formulasAusentes++
          }
        });

        if (formulasEncontradas == estruturaEsperada.derivadas.length && formulasQuebradas == 0) {
          resultado.sucesso++
          resultado.detalhes.push({
            status : 'OK',
            aba : abaName,
            mensagem : 'Todas as fórmulas derivadas OK',
            formulas : formulasEncontradas
          });
        } else {
          if (formulasAusentes > 0) {
            resultado.avisos++
            resultado.detalhes.push({
              status : 'AVISO',
              aba : abaName,
              mensagem : formulasAusentes + ' fórmulas derivadas ausentes',
              acao : 'Executar regenerarFormulas()'
            });
          }

          if (formulasQuebradas > 0) {
            resultado.erros++
            resultado.detalhes.push({
              status : 'ERRO',
              aba : abaName,
              mensagem : formulasQuebradas + ' fórmulas quebradas',
              acao : 'Corrigir referências e regenerar fórmulas'
            });
          }
        }
      }

    } catch (error) {
      Logger.log("Erro em verificarFormulasDerivadas: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em verificarFormulasDerivadas: " + error.message);
    throw error;
  }
}

/**
 * 6. Analisa performance
 */
function analisarPerformance() {
  try {
    try {
      var resultado = {
        tipo : 'PERFORMANCE',
        titulo : 'Análise de Performance',
        sucesso : 0,
        avisos : 0,
        erros : 0,
        criticos : 0,
        detalhes : []
      };

      var ss = getSS();
      var totalSheets = ss.getSheets().length;
      var totalCells = 0;
      var totalFormulas = 0;

      ss.getSheets().forEach(function(sheet) {
        var lastRow = sheet.getLastRow();
        var lastCol = sheet.getLastColumn();
        var cells = lastRow * lastCol;
        totalCells += cells;

        // Estimar fórmulas (verificar apenas primeira linha de dados)
        if (lastRow > 1 && lastCol > 0) {
          var row = sheet.getRange(2, 1, 1, lastCol).getFormulas()[0];
          var formulas = row.filter(function(f) { return f != ''; }).length;
          totalFormulas += formulas * (lastRow - 1);
        }
      });

      // Avaliar performance
      if (totalCells < 100000) {
        resultado.sucesso++
        resultado.detalhes.push({
          status : 'EXCELENTE',
          mensagem : 'Performance excelente',
          totalAbas : totalSheets,
          totalCelulas : totalCells,
          totalFormulas : totalFormulas,
          estimativaCarregamento : '< 2 segundos'
        });
      } else if (totalCells < 500000) {
        resultado.sucesso++
        resultado.detalhes.push({
          status : 'BOA',
          mensagem : 'Performance boa',
          totalAbas : totalSheets,
          totalCelulas : totalCells,
          totalFormulas : totalFormulas,
          estimativaCarregamento : '2-5 segundos'
        });
      } else if (totalCells < 1000000) {
        resultado.avisos++
        resultado.detalhes.push({
          status : 'MODERADA',
          mensagem : 'Performance moderada',
          totalAbas : totalSheets,
          totalCelulas : totalCells,
          totalFormulas : totalFormulas,
          estimativaCarregamento : '5-10 segundos',
          acao : 'Considerar otimizar fórmulas'
        });
      } else {
        resultado.erros++
        resultado.detalhes.push({
          status : 'LENTA',
          mensagem : 'Performance pode ser lenta',
          totalAbas : totalSheets,
          totalCelulas : totalCells,
          totalFormulas : totalFormulas,
          estimativaCarregamento : '> 10 segundos',
          acao : 'Recomendado otimizar, converter fórmulas antigas em valores'
        });
      }

    } catch (error) {
      Logger.log("Erro em analisarPerformance: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em analisarPerformance: " + error.message);
    throw error;
  }
}

/**
 * 7. Verifica integridade referencial
 */
function verificarIntegridadeReferencial() {
  try {
    try {
      var resultado = {
        tipo : 'INTEGRIDADE_REFERENCIAL',
        titulo : 'Verificação de Integridade Referencial',
        sucesso : 0,
        avisos : 0,
        erros : 0,
        criticos : 0,
        detalhes : []
      };

      var ss = getSS();

      // Verificar Entregas → Notas_Fiscais
      var nfSheet = ss.getSheetByName('Notas_Fiscais');
      var entSheet = ss.getSheetByName('Entregas');

      if (nfSheet && entSheet) {
        var nfData = nfSheet.getDataRange().getValues();
        var entData = entSheet.getDataRange().getValues();

        var nfIds = nfData.slice(1).map(function(row) { return row[0]; });
        var refsInvalidas = 0;

        entData.slice(1).forEach(function(row) {
          var nfId = row[1]; // NF_ID;
          if (nfId && nfIds.indexOf(nfId) < 0) {
            refsInvalidas++
          }
        });

        if (refsInvalidas == 0) {
          resultado.sucesso++
          resultado.detalhes.push({
            status : 'OK',
            relacao : 'Entregas → Notas_Fiscais',
            mensagem : 'Integridade referencial OK'
          });
        } else {
          resultado.erros++
          resultado.detalhes.push({
            status : 'ERRO',
            relacao : 'Entregas → Notas_Fiscais',
            mensagem : refsInvalidas + ' referências inválidas',
            acao : 'Corrigir IDs de NF em Entregas'
          });
        }
      }

      // Verificar Recusas → Notas_Fiscais
      var recSheet = ss.getSheetByName('Recusas');

      if (nfSheet && recSheet) {
        var nfData2 = nfSheet.getDataRange().getValues();
        var recData = recSheet.getDataRange().getValues();

        var nfIds2 = nfData2.slice(1).map(function(row) { return row[0]; });
        var refsInvalidas2 = 0;

        recData.slice(1).forEach(function(row) {
          var nfId = row[1]; // NF_ID;
          if (nfId && nfIds2.indexOf(nfId) < 0) {
            refsInvalidas2++
          }
        });

        if (refsInvalidas2 == 0) {
          resultado.sucesso++
          resultado.detalhes.push({
            status : 'OK',
            relacao : 'Recusas → Notas_Fiscais',
            mensagem : 'Integridade referencial OK'
          });
        } else {
          resultado.erros++
          resultado.detalhes.push({
            status : 'ERRO',
            relacao : 'Recusas → Notas_Fiscais',
            mensagem : refsInvalidas2 + ' referências inválidas',
            acao : 'Corrigir IDs de NF em Recusas'
          });
        }
      }

    } catch (error) {
      Logger.log("Erro em verificarIntegridadeReferencial: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em verificarIntegridadeReferencial: " + error.message);
    throw error;
  }
}

/**
 * ==
 * FUNÇÕES DE ANÁLISE E RELATÓRIO
 * ==
 */

/**
 * Atualiza resumo com resultados de diagnóstico
 */
function atualizarResumo(resumo, diagnostico) {
  resumo.total++
  resumo.sucesso += diagnostico.sucesso || 0;
  resumo.avisos += diagnostico.avisos || 0;
  resumo.erros += diagnostico.erros || 0;
  resumo.criticos += diagnostico.criticos || 0;
}

/**
 * Calcula score geral do diagnóstico
 */
function calcularScoreGeral(resumo) {
  var total = resumo.sucesso + resumo.avisos + resumo.erros + resumo.criticos;
  if (total == 0) return 100;

  var pontos = (resumo.sucesso * 100) + (resumo.avisos * 50) + (resumo.erros * 0) + (resumo.criticos * -50);
  var maxPontos = total * 100;

  var score = Math.max(0, Math.min(100, (pontos / maxPontos) * 100));
  return Math.round(score);
}

/**
 * Gera recomendações baseadas nos resultados
 */
function gerarRecomendacoes(resultado) {
  try {
    var recomendacoes = [];

    // Analisar cada diagnóstico
    resultado.diagnosticos.forEach(function(diag) {
      diag.detalhes.forEach(function(detalhe) {
        if (detalhe.acao) {
          recomendacoes.push({
            prioridade : detalhe.status == 'CRITICO' ? 'ALTA' :
                       detalhe.status == 'ERRO' ? 'MEDIA' : 'BAIXA',
        // categoria : diag.tipo,
            aba : detalhe.aba || 'Geral',
            acao : detalhe.acao
          });
        }
      });
    });

    // Ordenar por prioridade
    recomendacoes.sort(function(a, b) {
      var prioridades = {'ALTA' : 3, 'MEDIA' : 2, 'BAIXA' : 1};
    });

  } catch (error) {
    Logger.log("Erro em gerarRecomendacoes: " + error.message);
    throw error;
  }
}

/**
 * Gera relatório consolidado na aba Diagnóstico
 */
function gerarRelatorioDiagnostico(resultado) {
  try {
    try {
      try {
        var ss = getSS();
        var sheet = ss.getSheetByName('Diagnostico');

        if (!sheet) {
          sheet = ss.insertSheet('Diagnostico');
        } else {
          sheet.clear();
        }

        var dados = [];

        // CABEÇALHO
        dados.push(['DIAGNÓSTICO COMPLETO DO SISTEMA UNIAE']);
        dados.push(['']);
        dados.push(['Data/Hora : ', formatDateTime(resultado.timestamp)]);
        dados.push(['Versão : ', resultado.versao]);
        dados.push(['Sistema : ', resultado.sistema]);
        dados.push(['']);

        // RESUMO EXECUTIVO
        dados.push(['== RESUMO EXECUTIVO ==']);
        dados.push(['']);
        dados.push(['Score Geral : ', resultado.scoreGeral + '/100']);
        dados.push(['Total de Verificações : ', resultado.resumo.total]);
        dados.push(['Sucessos : ', resultado.resumo.sucesso]);
        dados.push(['Avisos : ', resultado.resumo.avisos]);
        dados.push(['Erros : ', resultado.resumo.erros]);
        dados.push(['Críticos : ', resultado.resumo.criticos]);
        dados.push(['']);

        // CLASSIFICAÇÃO
        var classificacao = '';
        if (resultado.scoreGeral >= 90) {
          classificacao = '🏆 EXCELENTE - Sistema em ótimo estado';
        } else if (resultado.scoreGeral >= 75) {
          classificacao = '✅ BOM - Sistema funcional com pequenos ajustes';
        } else if (resultado.scoreGeral >= 60) {
          classificacao = '⚠️ REGULAR - Sistema necessita melhorias';
        } else {
          classificacao = '❌ CRÍTICO - Sistema necessita correções urgentes';
        }
        dados.push(['Classificação : ', classificacao]);
        dados.push(['']);
        dados.push(['']);

        // DETALHES POR VERIFICAÇÃO
        resultado.diagnosticos.forEach(function(diag) {
          dados.push(['== ' + diag.titulo + ' ==']);
          dados.push(['']);
          dados.push(['Sucessos : ', diag.sucesso]);
          dados.push(['Avisos : ', diag.avisos]);
          dados.push(['Erros : ', diag.erros]);
          dados.push(['Críticos : ', diag.criticos]);
          dados.push(['']);

          // Detalhes
          dados.push(['Status', 'Aba/Item', 'Mensagem', 'Ação Recomendada']);
          diag.detalhes.forEach(function(detalhe) {
            dados.push([
              detalhe.status || '',
              detalhe.aba || detalhe.relacao || '',
              detalhe.mensagem || '',
              detalhe.acao || ''
            ]);
          });
          dados.push(['']);
          dados.push(['']);
        });

        // RECOMENDAÇÕES
        dados.push(['== RECOMENDAÇÕES PRIORITÁRIAS ==']);
        dados.push(['']);
        dados.push(['Prioridade', 'Categoria', 'Aba', 'Ação']);

        resultado.recomendacoes.slice(0, 20).forEach(function(rec) {
          dados.push([
            rec.prioridade,
            rec.categoria,
            rec.aba,
            rec.acao
          ]);
        });

        dados.push(['']);
        dados.push(['']);

        // COMPARAÇÃO COM MODELO
        dados.push(['== COMPARAÇÃO COM NotasFiscais.xlsx ==']);
        dados.push(['']);
        dados.push(['O sistema foi comparado com o modelo de referência NotasFiscais.xlsx']);
        dados.push(['Aprimoramentos implementados : ']);
        dados.push(['']);
        dados.push(['Aba', 'Status', 'Campos Básicos', 'Campos Derivados', 'Campos Auditoria']);

        for (var abaName in ESTRUTURA_REFERENCIA) {
          var estrutura = ESTRUTURA_REFERENCIA[abaName];
          var basicos = estrutura.colunas.length -
                        (estrutura.derivadas ? estrutura.derivadas.length : 0) -
                        (estrutura.auditoria ? estrutura.auditoria.length : 0);

          dados.push([
            abaName,
            'Modelo Aprimorado',
            basicos,
            estrutura.derivadas ? estrutura.derivadas.length : 0,
            estrutura.auditoria ? estrutura.auditoria.length : 0
          ]);
        }

        dados.push(['']);
        dados.push(['']);
        dados.push(['== LEGENDA ==']);
        dados.push(['OK/EXCELENTE : Funcionando perfeitamente']);
        dados.push(['BOM : Funcionando bem, pequenos ajustes opcionais']);
        dados.push(['AVISO : Atenção necessária, não crítico']);
        dados.push(['ERRO : Problema que deve ser corrigido']);
        dados.push(['CRITICO : Problema grave que impede funcionamento']);

        // Escrever dados
        if (dados.length > 0) {
          sheet.getRange(1, 1, dados.length, 4).setValues(dados);

          // Formatação
          sheet.getRange(1, 1).setFontSize(14).setFontWeight('bold');
          sheet.getRange('A : A').setFontWeight('bold');

          // Auto-ajustar colunas
          sheet.autoResizeColumn(1);
          sheet.autoResizeColumn(2);
          sheet.autoResizeColumn(3);
          sheet.autoResizeColumn(4);

          // Congelar primeira linha
          sheet.setFrozenRows(1);
        }

        logSistema('DIAGNOSTICO_COMPLETO', 'Relatório gerado na aba Diagnóstico', 'INFO');
      } catch (error) {
        Logger.log("Erro em gerarRelatorioDiagnostico: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em gerarRelatorioDiagnostico: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em gerarRelatorioDiagnostico: " + error.message);
    throw error;
  }
}

/**
 * Mostra resultado do diagnóstico
 */
function mostrarResultadoDiagnostico(resultado) {
  try {
    var ui = getSafeUi();

    var classificacao = '';
    var emoji = '';

    if (resultado.scoreGeral >= 90) {
      classificacao = 'EXCELENTE';
      emoji = '🏆';
    } else if (resultado.scoreGeral >= 75) {
      classificacao = 'BOM';
      emoji = '✅';
    } else if (resultado.scoreGeral >= 60) {
      classificacao = 'REGULAR';
      emoji = '⚠️';
    } else {
      classificacao = 'CRÍTICO';
      emoji = '❌';
    }

    var mensagem = emoji + ' DIAGNÓSTICO COMPLETO\n\n' +
                   'Score Geral : ' + resultado.scoreGeral + '/100\n' +
                   'Classificação : ' + classificacao + '\n\n' +
                   'RESUMO : \n' +
                   '✓ Sucessos : ' + resultado.resumo.sucesso + '\n' +
                   '⚠ Avisos : ' + resultado.resumo.avisos + '\n' +
                   '✗ Erros : ' + resultado.resumo.erros + '\n' +
                   '⚠ Críticos : ' + resultado.resumo.criticos + '\n\n' +
                   'VERIFICAÇÕES REALIZADAS : \n';

    resultado.diagnosticos.forEach(function(diag) {
      mensagem += '• ' + diag.titulo + '\n';
    });

    mensagem += '\n' +
                'RECOMENDAÇÕES : ' + resultado.recomendacoes.length + '\n\n' +
                'Relatório completo gerado na aba "Diagnóstico"';

    safeAlert('Diagnóstico Completo', mensagem, ui.ButtonSet.OK);
  } catch (error) {
    Logger.log("Erro em mostrarResultadoDiagnostico: " + error.message);
    throw error;
  }
}

/**
 * ==
 * FUNÇÕES AUXILIARES DE DIAGNÓSTICO
 * ==
 */

/**
 * Diagnóstico rápido (versão simplificada)
 */
function diagnosticoRapido() {
  try {
    var ui = getSafeUi();

    var resultado = {
      abas : 0,
      erros : []
    };

    var ss = getSS();
    var abasEssenciais = ['Notas_Fiscais', 'Entregas', 'Recusas', 'Glosas'];

    abasEssenciais.forEach(function(abaName) {
      var sheet = ss.getSheetByName(abaName);
      if (sheet) {
        resultado.abas++
      } else {
        resultado.erros.push('Aba ausente : ' + abaName);
      }
    });

    var mensagem = 'DIAGNÓSTICO RÁPIDO\n\n' +
                   'Abas essenciais : ' + resultado.abas + '/4\n\n';

    if (resultado.erros.length > 0) {
      mensagem += 'PROBLEMAS : \n' + resultado.erros.join('\n') + '\n\n';
      mensagem += 'Execute diagnosticoPlanilha() para análise completa.';
    } else {
      mensagem += '✅ Todas as abas essenciais presentes!\n\n' +
                  'Execute diagnosticoPlanilha() para análise detalhada.';
    }

    safeAlert('Diagnóstico Rápido', mensagem, ui.ButtonSet.OK);
  } catch (error) {
    Logger.log("Erro em diagnosticoRapido: " + error.message);
    throw error;
  }
}

/**
 * Corrige problemas automaticamente (quando possível)
 */
function corrigirProblemasAutomaticamente() {
  try {
    var ui = getSafeUi();

    var resposta = ui.alert(
      'Correção Automática',
      'Esta função tentará corrigir automaticamente : \n\n' +
      '• Criar abas essenciais faltantes\n' +
      '• Adicionar colunas faltantes\n' +
      '• Regenerar fórmulas quebradas\n' +
      '• Corrigir headers\n\n' +
      'Deseja continuar ? ',
      ui.ButtonSet.YES_NO
    );

    if (resposta != ui.Button.YES) return;

    var resultado = {
      abasCriadas : 0,
      colunasCriadas : 0,
      formulasRegeneradas : 0,
      erros : []
    };

    try {
      // 1. Criar abas essenciais faltantes
      var ss = getSS();
      var abasEssenciais = ['Notas_Fiscais', 'Entregas', 'Recusas', 'Glosas'];

      abasEssenciais.forEach(function(abaName) {
        var sheet = ss.getSheetByName(abaName);
        if (!sheet) {
          try {
            sheet = createSheetWithStructure(abaName);
            resultado.abasCriadas++
          } catch (error) {
            resultado.erros.push('Erro ao criar ' + abaName + ' : ' + error.message);
            return {
              chaveAcesso : chaveAcesso,
              situacao : "ERRO",
              valida : false
            };
          }
        }
      });

      // 2. Regenerar fórmulas
      try {
        var formulasResult = regenerarFormulas();
        resultado.formulasRegeneradas = formulasResult.formulasRegeneradas || 0;
      } catch (error) {
        resultado.erros.push('Erro ao regenerar fórmulas : ' + error.message);
      }

      // 3. Mostrar resultado
      var mensagem = 'CORREÇÃO AUTOMÁTICA CONCLUÍDA\n\n' +
                     'Abas criadas : ' + resultado.abasCriadas + '\n' +
                     'Fórmulas regeneradas : ' + resultado.formulasRegeneradas + '\n';

      if (resultado.erros.length > 0) {
        mensagem += '\nERROS : \n' + resultado.erros.join('\n');
      }

      mensagem += '\n\nExecute diagnosticoPlanilha() novamente para verificar.';

      safeAlert('Correção Concluída', mensagem, ui.ButtonSet.OK);

    } catch (error) {
      safeAlert('Erro', 'Erro na correção automática : \n\n' + error.message, ui.ButtonSet.OK);
      }
    } catch (error) {
    Logger.log("Erro em corrigirProblemasAutomaticamente: " + error.message);
    throw error;
  }
    };


/**
 * Menu de diagnóstico
 */
function menuDiagnostico() {
  try {
    var ui = getSafeUi();

    var opcao = ui.prompt(
      'Menu de Diagnóstico',
      'Escolha uma opção : \n\n' +
      '1 - Diagnóstico completo\n' +
      '2 - Diagnóstico rápido\n' +
      '3 - Corrigir problemas automaticamente\n' +
      '4 - Ver relatório anterior\n\n' +
      'Digite o número : ',
      ui.ButtonSet.OK_CANCEL
    );

    if (opcao.getSelectedButton() == ui.Button.CANCEL) return;

    var escolha = parseInt(opcao.getResponseText());

    switch (escolha) {
      case 1 :
        diagnosticoPlanilha();
        break;
      case 2 :
        diagnosticoRapido();
        break;
      case 3 :
        corrigirProblemasAutomaticamente();
        break;
      case 4 :
        var ss = getSS();
        var sheet = ss.getSheetByName('Diagnostico');
        if (sheet) {
          ss.setActiveSheet(sheet);
          safeAlert('Relatório de diagnóstico aberto na aba Diagnóstico');
        } else {
          safeAlert('Nenhum relatório anterior encontrado. Execute o diagnóstico completo.');
        }
        break;
      default :
        safeAlert('Opção inválida');
    }
  } catch (error) {
    Logger.log("Erro em menuDiagnostico: " + error.message);
    throw error;
  }
}

