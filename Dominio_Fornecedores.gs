'use strict';

/**
 * DOMINIO_FORNECEDORES
 * Consolidado de : Fornecedores.gs
 * @version 2.0.0
 * @created 2025-11-04
 */


// ---- Fornecedores.gs ----
/**
 * Fornecedores.gs
 * Módulo para gestão e análise de fornecedores
 */

// Função para avaliar desempenho por fornecedor
function avaliarDesempenhoFornecedor() {
  try {
    try {
      try {
        var ui = getSafeUi();
        var ss = getSS();

        var fornecedores = {};

        // Coletar dados de entregas
        var entregasSheet = ss.getSheetByName('Entregas');
        if (entregasSheet && entregasSheet.getLastRow() > 1) {
          var data = entregasSheet.getDataRange().getValues();
          var headers = data[0];
          var fornecedorIdx = headers.indexOf('Fornecedor');
          var statusIdx = headers.indexOf('Status');
          var qtdSolicIdx = headers.indexOf('Quantidade Solicitada');
          var qtdEntrIdx = headers.indexOf('Quantidade Entregue');

          for (var i = 1; i < data.length; i++) {
            var fornecedor = data[i][fornecedorIdx];
            if (!fornecedor) continue;

            if (!fornecedores[fornecedor]) {
              fornecedores[fornecedor] = {
                entregas : 0,
                entregasCompletas : 0,
                entregasParciais : 0,
                naoEntregues : 0,
                recusas : 0,
                glosas : 0,
                valorGlosas : 0,
                totalSolicitado : 0,
                totalEntregue : 0
              };
            }

            fornecedores[fornecedor].entregas++;
            var status = data[i][statusIdx];
            var qtdSolic = Number(data[i][qtdSolicIdx]) || 0;
            var qtdEntr = Number(data[i][qtdEntrIdx]) || 0;

            fornecedores[fornecedor].totalSolicitado += qtdSolic;
            fornecedores[fornecedor].totalEntregue += qtdEntr;

            if (status == 'Entregue Completo') {
              fornecedores[fornecedor].entregasCompletas++;
            } else if (status == 'Entregue Parcial') {
              fornecedores[fornecedor].entregasParciais++;
            } else if (status == 'Não Entregue') {
              fornecedores[fornecedor].naoEntregues++;
            }
          }
        }

        // Coletar dados de recusas
        var recusasSheet = ss.getSheetByName('Recusas');
        if (recusasSheet && recusasSheet.getLastRow() > 1) {
          var data = recusasSheet.getDataRange().getValues();
          var headers = data[0];
          var fornecedorIdx = headers.indexOf('Fornecedor');

          for (var i = 1; i < data.length; i++) {
            var fornecedor = data[i][fornecedorIdx];
            if (fornecedor && fornecedores[fornecedor]) {
              fornecedores[fornecedor].recusas++;
            }
          }
        }

        // Coletar dados de glosas
        var glosasSheet = ss.getSheetByName('Glosas');
        if (glosasSheet && glosasSheet.getLastRow() > 1) {
          var data = glosasSheet.getDataRange().getValues();
          var headers = data[0];
          var fornecedorIdx = headers.indexOf('Fornecedor');
          var valorIdx = headers.indexOf('Valor Total Glosa');

          for (var i = 1; i < data.length; i++) {
            var fornecedor = data[i][fornecedorIdx];
            if (fornecedor && fornecedores[fornecedor]) {
              fornecedores[fornecedor].glosas++;
              fornecedores[fornecedor].valorGlosas += Number(data[i][valorIdx]) || 0;
            }
          }
        }

        // Calcular indicadores de desempenho
        for (var f in fornecedores) {
          var forn = fornecedores[f];
          var taxaEntregaCompleta;
          if (forn.entregas > 0) {
            taxaEntregaCompleta = (forn.entregasCompletas / forn.entregas * 100);
          } else {
            taxaEntregaCompleta = 0;
          }
          var taxaRecusa;
          if (forn.entregas > 0) {
            taxaRecusa = (forn.recusas / forn.entregas * 100);
          } else {
            taxaRecusa = 0;
          }
          var taxaGlosa;
          if (forn.entregas > 0) {
            taxaGlosa = (forn.glosas / forn.entregas * 100);
          } else {
            taxaGlosa = 0;
          }
          var taxaAtendimento;
          if (forn.totalSolicitado > 0) {
            taxaAtendimento = (forn.totalEntregue / forn.totalSolicitado * 100);
          } else {
            taxaAtendimento = 0;
          }

          // Calcular nota de desempenho (0-100)
          forn.notaDesempenho = (
            forn.taxaEntregaCompleta * 0.4 +
            (100 - forn.taxaRecusa) * 0.3 +
            (100 - forn.taxaGlosa) * 0.2 +
            forn.taxaAtendimento * 0.1
          );

          // Classificação
          if (forn.notaDesempenho >= 90) {
            forn.classificacao = 'Excelente';
          } else if (forn.notaDesempenho >= 70) {
            forn.classificacao = 'Bom';
          } else if (forn.notaDesempenho >= 50) {
            forn.classificacao = 'Regular';
          } else {
            forn.classificacao = 'Insatisfatório';
          }
        }

        // Criar relatório
        var resultSheet = ss.getSheetByName('Avaliacao_Fornecedores') || ss.insertSheet('Avaliacao_Fornecedores');
        resultSheet.clear();

        var output = [
          ['AVALIAÇÃO DE DESEMPENHO DE FORNECEDORES'],
          ['CRE Plano Piloto e Cruzeiro - UNIAE'],
          ['Data : ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy')],
          [''],
          ['Fornecedor', 'Entregas', 'Completas', 'Parciais', 'Recusas', 'Glosas', 'Valor Glosas', 'Taxa Entrega', 'Taxa Recusa', 'Nota', 'Classificação']
        ];

        // Ordenar por nota de desempenho
        var fornecedoresArray = [];
        for (var f in fornecedores) {
          fornecedoresArray.push({nome : f, dados : fornecedores[f]});
        }
        fornecedoresArray.sort(function(a, b) {});

        fornecedoresArray.forEach(function(item) {
          var f = item.nome;
          var dados = item.dados;
          output.push([
            f,
            dados.entregas,
            dados.entregasCompletas,
            dados.entregasParciais,
            dados.recusas,
            dados.glosas,
            'R$ ' + dados.valorGlosas.toFixed(2),
            dados.taxaEntregaCompleta.toFixed(1) + '%',
            dados.taxaRecusa.toFixed(1) + '%',
            dados.notaDesempenho.toFixed(1),
            dados.classificacao
          ]);
        });

        resultSheet.getRange(1, 1, output.length, 11).setValues(output);

        // Formatação
        resultSheet.getRange(1, 1).setFontWeight('bold').setFontSize(14);
        resultSheet.getRange(5, 1, 1, 11).setFontWeight('bold').setBackground('#4CAF50').setFontColor('#FFFFFF');

        // Aplicar cores por classificação
        for (var i = 6; i <= output.length; i++) {
          var classificacao = resultSheet.getRange(i, 11).getValue();
          if (classificacao == 'Excelente') {
            resultSheet.getRange(i, 11).setBackground('#4CAF50').setFontColor('#FFFFFF');
          } else if (classificacao == 'Bom') {
            resultSheet.getRange(i, 11).setBackground('#8BC34A');
          } else if (classificacao == 'Regular') {
            resultSheet.getRange(i, 11).setBackground('#FFC107');
          } else if (classificacao == 'Insatisfatório') {
            resultSheet.getRange(i, 11).setBackground('#F44336').setFontColor('#FFFFFF');
          }
        }

        ss.setActiveSheet(resultSheet);
        safeAlert('Avaliação concluída',
          'Fornecedores avaliados : ' + fornecedoresArray.length + '\n\n' +
          'Os fornecedores foram classificados por nota de desempenho.',
          ui.ButtonSet.OK);
      } catch (error) {
        Logger.log("Erro em avaliarDesempenhoFornecedor: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em avaliarDesempenhoFornecedor: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em avaliarDesempenhoFornecedor: " + error.message);
    throw error;
  }
}

// Função para histórico de entregas por fornecedor
function historicoEntregasFornecedor() {
  try {
    try {
      var ui = getSafeUi();
      var ss = getSS();

      var response = ui.prompt(
        'Histórico de Entregas',
        'Digite o nome do fornecedor : ',
        ui.ButtonSet.OK_CANCEL
      );

      if (response.getSelectedButton() != ui.Button.OK) {
        return;
      }

      var fornecedor = response.getResponseText().trim();
      if (!fornecedor) {
        safeAlert('Erro', 'Nome do fornecedor não pode estar vazio.', ui.ButtonSet.OK);
        return;
      }

      var entregasSheet = ss.getSheetByName('Entregas');
      if (!entregasSheet || entregasSheet.getLastRow() <= 1) {
        safeAlert('Erro', 'Nenhum dado de entregas encontrado.', ui.ButtonSet.OK);
        return;
      }

      var data = entregasSheet.getDataRange().getValues();
      var headers = data[0];
      var fornecedorIdx = headers.indexOf('Fornecedor');

      var entregasFornecedor = [headers];

      for (var i = 1; i < data.length; i++) {
        var fornecedorRow = String(data[i][fornecedorIdx]).trim().toLowerCase();
        if (fornecedorRow.indexOf(fornecedor.toLowerCase()) >= 0) {
          entregasFornecedor.push(data[i]);
        }
      }

      if (entregasFornecedor.length <= 1) {
        safeAlert('Nenhum resultado',
          'Nenhuma entrega encontrada para o fornecedor : ' + fornecedor,
          ui.ButtonSet.OK);
      }

      // CORREÇÃO : Preparar dados para relatório no Drive

      var output = [
        ['HISTÓRICO DE ENTREGAS - ' + fornecedor.toUpperCase()],
        ['Data : ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy')],
        ['Total de Entregas : ' + (entregasFornecedor.length - 1)],
        ['']
      ];

      // Combinar dados de cabeçalho e entregas
      var allData = output.concat(entregasFornecedor);

      // CORREÇÃO : Criar relatório no Drive
      try {
        var report = createReportDocument('Historico_' + fornecedor.substring(0, 20), allData, ['Histórico de Entregas']);
        ui.alert('Histórico Gerado',
          'Relatório criado no Drive : ' + report.name + '\n\n' +
          'Acesse em : ' + report.url + '\n\n' +
          'Entregas encontradas : ' + (entregasFornecedor.length - 1),
          ui.ButtonSet.OK);
      } catch (e) {
        Logger.log('Erro ao criar histórico de fornecedor no Drive : ' + e.message);
        ui.alert('Erro', 'Erro ao gerar histórico : ' + e.message, ui.ButtonSet.OK);
      }
    } catch (error) {
      Logger.log("Erro em historicoEntregasFornecedor: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em historicoEntregasFornecedor: " + error.message);
    throw error;
  }
  }


// Função para listar problemas por fornecedor
function listarProblemasFornecedor() {
  try {
    try {
      try {
        var ui = getSafeUi();
        var ss = getSS();

        var problemasPorFornecedor = {};

        // Coletar recusas
        var recusasSheet = ss.getSheetByName('Recusas');
        if (recusasSheet && recusasSheet.getLastRow() > 1) {
          var data = recusasSheet.getDataRange().getValues();
          var headers = data[0];
          var fornecedorIdx = headers.indexOf('Fornecedor');
          var motivoIdx = headers.indexOf('Motivo');
          var produtoIdx = headers.indexOf('Produto');
          var dataIdx = headers.indexOf('Data Recusa');

          for (var i = 1; i < data.length; i++) {
            var fornecedor = data[i][fornecedorIdx];
            if (!fornecedor) continue;

            if (!problemasPorFornecedor[fornecedor]) {
              problemasPorFornecedor[fornecedor] = {recusas : [], glosas : [], totalProblemas : 0};
            }

            problemasPorFornecedor[fornecedor].recusas.push({
              tipo : 'Recusa',
              data : data[i][dataIdx],
              motivo : data[i][motivoIdx],
              produto : data[i][produtoIdx]
            });
            problemasPorFornecedor[fornecedor].totalProblemas++;
          }
        }

        // Coletar glosas
        var glosasSheet = ss.getSheetByName('Glosas');
        if (glosasSheet && glosasSheet.getLastRow() > 1) {
          var data = glosasSheet.getDataRange().getValues();
          var headers = data[0];
          var fornecedorIdx = headers.indexOf('Fornecedor');
          var motivoIdx = headers.indexOf('Motivo');
          var produtoIdx = headers.indexOf('Produto/Item');
          var dataIdx = headers.indexOf('Data Registro');
          var valorIdx = headers.indexOf('Valor Total Glosa');

          for (var i = 1; i < data.length; i++) {
            var fornecedor = data[i][fornecedorIdx];
            if (!fornecedor) continue;

            if (!problemasPorFornecedor[fornecedor]) {
              problemasPorFornecedor[fornecedor] = {recusas : [], glosas : [], totalProblemas : 0};
            }

            problemasPorFornecedor[fornecedor].glosas.push({
              tipo : 'Glosa',
              data : data[i][dataIdx],
              motivo : data[i][motivoIdx],
              produto : data[i][produtoIdx],
              valor : Number(data[i][valorIdx]) || 0
            });
            problemasPorFornecedor[fornecedor].totalProblemas++;
          }
        }

        if (Object.keys(problemasPorFornecedor).length == 0) {
          safeAlert('Informação', 'Nenhum problema registrado para fornecedores.', ui.ButtonSet.OK);
        }

        // Criar relatório
        var resultSheet = ss.getSheetByName('Problemas_Fornecedores') || ss.insertSheet('Problemas_Fornecedores');
        resultSheet.clear();

        var output = [
          ['PROBLEMAS POR FORNECEDOR'],
          ['Data : ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy')],
          [''],
          ['Fornecedor', 'Tipo', 'Data', 'Motivo', 'Produto', 'Valor']
        ];

        // Ordenar por total de problemas
        var fornecedoresArray = [];
        for (var f in problemasPorFornecedor) {
          fornecedoresArray.push({nome : f, dados : problemasPorFornecedor[f]});
        }
        fornecedoresArray.sort(function(a, b) {});

        fornecedoresArray.forEach(function(item) {
          var f = item.nome;
          var dados = item.dados;

          output.push([f, '--- Total : ' + dados.totalProblemas + ' ---', '', '', '', '']);

          dados.recusas.forEach(function(r) {
            output.push([
              '',
              r.tipo,
              Utilities.formatDate(new Date(r.data), Session.getScriptTimeZone(), 'dd/MM/yyyy'),
              r.motivo,
              r.produto,
              ''
            ]);
          });

          dados.glosas.forEach(function(g) {
            output.push([
              '',
              g.tipo,
              Utilities.formatDate(new Date(g.data), Session.getScriptTimeZone(), 'dd/MM/yyyy'),
              g.motivo,
              g.produto,
              'R$ ' + g.valor.toFixed(2)
            ]);
          });

          output.push(['', '', '', '', '', '']);
        });

        resultSheet.getRange(1, 1, output.length, 6).setValues(output);
        resultSheet.getRange(1, 1).setFontWeight('bold').setFontSize(14);
        resultSheet.getRange(4, 1, 1, 6).setFontWeight('bold').setBackground('#F44336').setFontColor('#FFFFFF');

        ss.setActiveSheet(resultSheet);
        safeAlert('Relatório gerado',
          'Fornecedores com problemas : ' + fornecedoresArray.length,
          ui.ButtonSet.OK);
      } catch (error) {
        Logger.log("Erro em listarProblemasFornecedor: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em listarProblemasFornecedor: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em listarProblemasFornecedor: " + error.message);
    throw error;
  }
}

