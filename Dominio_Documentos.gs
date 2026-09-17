// Requer V8 runtime habilitado no Apps Script
'use strict';

/**
 * DOMINIO_DOCUMENTOS
 * Consolidado de : DocumentosRelatorios.gs, Entregas.gs, PrestacaoContas.gs
 * @version 2.0.0
 * @created 2025-11-04
 */


// ---- DocumentosRelatorios.gs ----
/**
 * DocumentosRelatorios.gs
 * Módulo para geração de documentos e relatórios oficiais
 */

// Função para gerar atesto para GEVMON (Gerência de Vigilância e Monitoramento)
function gerarAtestoGEVMON() {
  try {
    try {
      try {
        var ui = getSafeUi();
        var ss = getSS();

        // Coletar informações necessárias
        var response = ui.prompt(
          'Gerar Atesto para GEVMON',
          'Digite as NFs separadas por vírgula (ex : 16221,16222) : ',
          ui.ButtonSet.OK_CANCEL
        );

        if (response.getSelectedButton() != ui.Button.OK) {
          return;
        }

        var nfs = response.getResponseText().split(',').map(function(nf) { return nf.trim(); });

        // Buscar dados das NFs
        var nfSheet = ss.getSheetByName('Notas_Fiscais');
        if (!nfSheet) {
          safeAlert('Erro', 'Aba "Notas_Fiscais" não encontrada.', ui.ButtonSet.OK);
          return;
        }

        var data = nfSheet.getDataRange().getValues();
        var headers = data[0];
        var nfIdx = _findHeaderIndex(headers, ['nota fiscal', 'nf-e', 'numero']);
        var dataIdx = _findHeaderIndex(headers, ['data', 'data emissão']);
        var empenhoIdx = _findHeaderIndex(headers, ['empenho', 'nota de empenho']);
        var valorIdx = _findHeaderIndex(headers, ['valor', 'valor total']);

        var nfsEncontradas = [];
        var valorTotal = 0;

        for (var i = 1; i < data.length; i++) {
          var nf = String(data[i][nfIdx]).trim();
          if (nfs.indexOf(nf) >= 0) {
            var valor = Number(data[i][valorIdx]) || 0;
            valorTotal += valor;
            nfsEncontradas.push({
              nf : nf,
              data : data[i][dataIdx],
              empenho : data[i][empenhoIdx],
              valor : valor
            });
          }
        }

        // Buscar dados de glosas
        var glosasSheet = ss.getSheetByName('Glosas');
        var totalGlosas = 0;
        var glosasPorNF = {};

        if (glosasSheet && glosasSheet.getLastRow() > 1) {
          var glosasData = glosasSheet.getDataRange().getValues();
          var glosasHeaders = glosasData[0];
          var glosaNfIdx = glosasHeaders.indexOf('NF');
          var glosaValorIdx = glosasHeaders.indexOf('Valor Total Glosa');

          for (var i = 1; i < glosasData.length; i++) {
            var glosaNf = String(glosasData[i][glosaNfIdx]).trim();
            if (nfs.indexOf(glosaNf) >= 0) {
              var glosaValor = Number(glosasData[i][glosaValorIdx]) || 0;
              totalGlosas += glosaValor;
              glosasPorNF[glosaNf] = (glosasPorNF[glosaNf] || 0) + glosaValor;
            }
          }
        }

        // Buscar dados de recusas
        var recusasSheet = ss.getSheetByName('Recusas');
        var houveRecusa = false;
        var escolasRecusa = [];

        if (recusasSheet && recusasSheet.getLastRow() > 1) {
          var recusasData = recusasSheet.getDataRange().getValues();
          var recusasHeaders = recusasData[0];
          var recusaNfIdx = recusasHeaders.indexOf('NF');
          var recusaUnidadeIdx = recusasHeaders.indexOf('Unidade Escolar');

          for (var i = 1; i < recusasData.length; i++) {
            var recusaNf = String(recusasData[i][recusaNfIdx]).trim();
            if (nfs.indexOf(recusaNf) >= 0) {
              houveRecusa = true;
              var unidade = recusasData[i][recusaUnidadeIdx];
              if (escolasRecusa.indexOf(unidade) < 0) {
                escolasRecusa.push(unidade);
              }
            }
          }
        }

        // Gerar documento de atesto
        var atestoSheet = createTemporarySheet('Atesto_GEVMON', ['Campo', 'Valor', 'Observações']);

        var comissaoData = PropertiesService.getScriptProperties().getProperty('MEMBROS_COMISSAO');
        var membros;
        if (comissaoData) {
          membros = JSON.parse(comissaoData);
        } else {
          membros = [
            {nome : 'PATRICIA BENITES SANTOS', cargo : 'TITULAR'},
            {nome : 'MÁRCIA APARECIDA MARTINS DE GODOY', cargo : 'TITULAR'},
            {nome : 'ANTÔNIO CARLOS COSTA DE SOUZA', cargo : 'TITULAR'}
          ];
        }

        var documento = [
          ['GOVERNO DO DISTRITO FEDERAL'],
          ['SECRETARIA DE ESTADO DE EDUCAÇÃO'],
          ['COORDENAÇÃO REGIONAL DE ENSINO DO PLANO PILOTO E CRUZEIRO'],
          ['UNIDADE DE INFRAESTRUTURA, ALIMENTAÇÃO E ATENDIMENTO ESCOLAR - UNIAE'],
          [''],
          ['ATESTO DE RECEBIMENTO DE GÊNEROS ALIMENTÍCIOS'],
          [''],
          ['A Comissão de Recebimento de Gêneros Alimentícios, constituída por meio da Ordem de Serviço nº 03 de 16 de junho de 2025,'],
          ['publicada no DODF Nº 114, DE 23 DE JUNHO DE 2025, atesta o recebimento dos materiais descritos nos documentos fiscais'],
          ['discriminados no quadro abaixo. Atesta, ainda, a autenticidade da fatura por meio de consulta realizada no site da nota fiscal'],
          ['eletrônica em ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy') + '.'],
          [''],
          ['NOTA FISCAL', 'DATA DE EMISSÃO', 'NOTA DE EMPENHO', 'VALOR TOTAL', 'GLOSA', 'DATA(s) DE ENTREGA']
        ];

        nfsEncontradas.forEach(function(nf) {
          var glosa = glosasPorNF[nf.nf] || 0;
          documento.push([
            nf.nf,
            Utilities.formatDate(new Date(nf.data), Session.getScriptTimeZone(), 'dd/MM/yyyy'),
            nf.empenho,
            'R$ ' + nf.valor.toFixed(2),
            glosa > 0 ? 'R$ ' + glosa.toFixed(2) : 'R$ 0,00',
            '', // Será preenchido manualmente
          ]);
        });

        documento.push(['']);
        documento.push(['1. No ato do recebimento houve alguma recusa pelas unidades escolares ? ']);
        documento.push(['( ' + (houveRecusa ? 'X' : ' ') + ' ) SIM', '( ' + (!houveRecusa ? 'X' : ' ') + ' ) NÃO']);

        if (houveRecusa) {
          documento.push(['']);
          documento.push(['Escola(s) que recusou(aram) : ' + escolasRecusa.join(', ')]);
        }

        documento.push(['']);
        documento.push(['2. Foi realizada alguma glosa na nota fiscal ? ']);
        documento.push(['( ' + (totalGlosas > 0 ? 'X' : ' ') + ' ) SIM', '( ' + (totalGlosas > 0 ? ' ' : 'X') + ' ) NÃO']);

        if (totalGlosas > 0) {
          documento.push(['']);
          documento.push(['Valor total de glosas : R$ ' + totalGlosas.toFixed(2)]);
        }

        documento.push(['']);
        documento.push(['MEMBROS DA COMISSÃO : ']);
        documento.push(['']);

        membros.forEach(function(membro) {
          documento.push([membro.nome]);
          documento.push([membro.cargo]);
          documento.push(['']);
        });

        documento.push(['']);
        documento.push(['"Brasília Patrimônio Público da Humanidade"']);
        documento.push(['SGAN 607 Norte, Módulo D - Asa Norte - CEP 70297-400 - DF']);
        documento.push(['Telefone(s) : (61)3318-2680']);
        documento.push(['www.se.df.gov.br']);

        atestoSheet.getRange(1, 1, documento.length, 6).setValues(documento);

        // Formatação
        atestoSheet.getRange(1, 1, 5, 1).setFontWeight('bold').setHorizontalAlignment('center');
        atestoSheet.getRange(6, 1).setFontWeight('bold').setFontSize(14).setHorizontalAlignment('center');
        atestoSheet.setColumnWidth(1, 150);
        atestoSheet.setColumnWidth(2, 120);
        atestoSheet.setColumnWidth(3, 150);
        atestoSheet.setColumnWidth(4, 120);
        atestoSheet.setColumnWidth(5, 100);
        atestoSheet.setColumnWidth(6, 200);

        ss.setActiveSheet(atestoSheet);
        safeAlert('Atesto gerado com sucesso!',
          'O atesto para GEVMON foi criado na nova aba.\n\n' +
          'Revise o documento e preencha as datas de entrega antes de enviar.',
          ui.ButtonSet.OK);
      } catch (error) {
        Logger.log("Erro em gerarAtestoGEVMON: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em gerarAtestoGEVMON: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em gerarAtestoGEVMON: " + error.message);
    throw error;
  }
}

// Função para gerar relatório da comissão
function gerarRelatorioComissao() {
  try {
    try {
      try {
        var ui = getSafeUi();
        var ss = getSS();

        var relatorioSheet = createTemporarySheet('Relatorio_Comissao', ['Seção', 'Dados', 'Observações']);

        // Coletar estatísticas gerais
        var stats = {
          nfs : 0,
          entregas : 0,
          recusas : 0,
          glosas : 0,
          valorTotal : 0,
          valorGlosas : 0
        };

        var nfSheet = ss.getSheetByName('Notas_Fiscais');
        if (nfSheet && nfSheet.getLastRow() > 1) {
          stats.nfs = nfSheet.getLastRow() - 1;
          var data = nfSheet.getDataRange().getValues();
          var headers = data[0];
          var valorIdx = _findHeaderIndex(headers, ['valor', 'valor total']);
          for (var i = 1; i < data.length; i++) {
            stats.valorTotal += Number(data[i][valorIdx]) || 0;
          }
        }

        var entregasSheet = ss.getSheetByName('Entregas');
        if (entregasSheet && entregasSheet.getLastRow() > 1) {
          stats.entregas = entregasSheet.getLastRow() - 1;
        }

        var recusasSheet = ss.getSheetByName('Recusas');
        if (recusasSheet && recusasSheet.getLastRow() > 1) {
          stats.recusas = recusasSheet.getLastRow() - 1;
        }

        var glosasSheet = ss.getSheetByName('Glosas');
        if (glosasSheet && glosasSheet.getLastRow() > 1) {
          stats.glosas = glosasSheet.getLastRow() - 1;
          var data = glosasSheet.getDataRange().getValues();
          var headers = data[0];
          var valorIdx = headers.indexOf('Valor Total Glosa');
          for (var i = 1; i < data.length; i++) {
            stats.valorGlosas += Number(data[i][valorIdx]) || 0;
          }
        }

        var documento = [
          ['RELATÓRIO DA COMISSÃO DE RECEBIMENTO DE GÊNEROS ALIMENTÍCIOS'],
          ['CRE PLANO PILOTO E CRUZEIRO - UNIAE'],
          ['Período : ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'MMMM/yyyy')],
          ['Data de Emissão : ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH,mm')],
          [''],
          ['RESUMO EXECUTIVO'],
          [''],
          ['Total de Notas Fiscais Analisadas : ', stats.nfs],
          ['Total de Entregas Registradas : ', stats.entregas],
          ['Total de Recusas : ', stats.recusas],
          ['Total de Glosas Aplicadas : ', stats.glosas],
          [''],
          ['Valor Total das Notas Fiscais : ', 'R$ ' + stats.valorTotal.toFixed(2)],
          ['Valor Total das Glosas : ', 'R$ ' + stats.valorGlosas.toFixed(2)],
          ['Valor Líquido : ', 'R$ ' + (stats.valorTotal - stats.valorGlosas).toFixed(2)],
          [''],
          ['CONFORMIDADE COM A PORTARIA Nº 244/2006'],
          [''],
          ['A Comissão de Recebimento de Gêneros Alimentícios, instituída conforme Portaria nº 244, de 31 de julho de 2006,'],
          ['procedeu à conferência dos produtos entregues nas instituições educacionais vinculadas à CRE Plano Piloto e Cruzeiro.'],
          [''],
          ['PRINCIPAIS ATIVIDADES REALIZADAS : '],
          [''],
          ['1. Verificação da autenticidade das Notas Fiscais Eletrônicas (NF-e)'],
          ['2. Conferência de valores e quantidades'],
          ['3. Validação das Notas de Empenho'],
          ['4. Acompanhamento das entregas nas unidades escolares'],
          ['5. Registro e análise de recusas de produtos'],
          ['6. Aplicação de glosas quando necessário'],
          ['7. Verificação da qualidade dos produtos entregues'],
          [''],
          ['OBSERVAÇÕES E RECOMENDAÇÕES : '],
          [''],
          ['[Área para observações específicas do período]'],
          [''],
          [''],
          ['MEMBROS DA COMISSÃO : '],
          [''],
          ['_______________________________'],
          ['Nome - Cargo'],
          [''],
          ['_______________________________'],
          ['Nome - Cargo'],
          [''],
          ['_______________________________'],
          ['Nome - Cargo']
        ];

        relatorioSheet.getRange(1, 1, documento.length, 2).setValues(documento);

        // Formatação
        relatorioSheet.getRange(1, 1, 1, 2).merge().setFontWeight('bold').setFontSize(14).setHorizontalAlignment('center');
        relatorioSheet.getRange(2, 1, 1, 2).merge().setFontWeight('bold').setHorizontalAlignment('center');
        relatorioSheet.setColumnWidth(1, 400);
        relatorioSheet.setColumnWidth(2, 200);

        ss.setActiveSheet(relatorioSheet);
        safeAlert('Relatório gerado!',
          'O relatório da comissão foi criado.\n\n' +
          'Complete as observações e recomendações antes de finalizar.',
          ui.ButtonSet.OK);
      } catch (error) {
        Logger.log("Erro em gerarRelatorioComissao: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em gerarRelatorioComissao: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em gerarRelatorioComissao: " + error.message);
    throw error;
  }
}

// Função para gerar demonstrativo de consumo
function gerarDemonstrativoConsumo() {
  try {
    try {
      try {
        var ui = getSafeUi();
        var ss = getSS();

        var entregasSheet = ss.getSheetByName('Entregas');
        if (!entregasSheet || entregasSheet.getLastRow() <= 1) {
          ui.alert('Erro', 'Nenhum dado de entregas encontrado para gerar o demonstrativo.', ui.ButtonSet.OK);
          return;
        }

        var data = entregasSheet.getDataRange().getValues();
        var headers = data[0];
        var produtoIdx = headers.indexOf('Produto');
        var qtdEntregueIdx = headers.indexOf('Quantidade Entregue');
        var unidadeIdx = headers.indexOf('Unidade');
        var escolaIdx = headers.indexOf('Unidade Escolar');

        var consumoPorProduto = {};
        var consumoPorEscola = {};

        for (var i = 1; i < data.length; i++) {
          var produto = data[i][produtoIdx];
          var qtd = Number(data[i][qtdEntregueIdx]) || 0;
          var unidade = data[i][unidadeIdx];
          var escola = data[i][escolaIdx];

          // Por produto
          if (!consumoPorProduto[produto]) {
            consumoPorProduto[produto] = {total : 0, unidade : unidade};
          }
          consumoPorProduto[produto].total += qtd;

          // Por escola
          if (!consumoPorEscola[escola]) {
            consumoPorEscola[escola] = {produtos : {}, totalItens : 0};
          }
          if (!consumoPorEscola[escola].produtos[produto]) {
            consumoPorEscola[escola].produtos[produto] = 0;
            consumoPorEscola[escola].totalItens++
          }
          consumoPorEscola[escola].produtos[produto] += qtd;
        }

        var demonstrativoSheet = createTemporarySheet('Demonstrativo_Consumo', ['Unidade Escolar', 'Produto', 'Período', 'Qtd Solicitada', 'Qtd Entregue', 'Percentual']);

        var output = [
          ['DEMONSTRATIVO DE CONSUMO - GÊNEROS ALIMENTÍCIOS'],
          ['CRE PLANO PILOTO E CRUZEIRO'],
          ['Período : ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'MMMM/yyyy')],
          [''],
          ['CONSUMO POR PRODUTO : '],
          ['Produto', 'Quantidade Total', 'Unidade']
        ];

        for (var prod in consumoPorProduto) {
          output.push([
            prod,
            consumoPorProduto[prod].total.toFixed(2),
            consumoPorProduto[prod].unidade
          ]);
        }

        output.push(['']);
        output.push(['CONSUMO POR UNIDADE ESCOLAR : ']);
        output.push(['Unidade Escolar', 'Total de Itens Diferentes', 'Principais Produtos']);

        for (var escola in consumoPorEscola) {
          var principais = Object.keys(consumoPorEscola[escola].produtos)
            .sort(function(a, b) {
              return consumoPorEscola[escola].produtos[b] - consumoPorEscola[escola].produtos[a];
            })
            .slice(0, 3)
            .join(', ');

          output.push([
            escola,
            consumoPorEscola[escola].totalItens,
            principais
          ]);
        }

        demonstrativoSheet.getRange(1, 1, output.length, 3).setValues(output);
        demonstrativoSheet.getRange(1, 1).setFontWeight('bold').setFontSize(14);
        demonstrativoSheet.setColumnWidth(1, 300);
        demonstrativoSheet.setColumnWidth(2, 150);
        demonstrativoSheet.setColumnWidth(3, 300);

        ss.setActiveSheet(demonstrativoSheet);
        safeAlert('Demonstrativo gerado!',
          'O demonstrativo de consumo foi criado com sucesso.',
          ui.ButtonSet.OK);
      } catch (error) {
        Logger.log("Erro em gerarDemonstrativoConsumo: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em gerarDemonstrativoConsumo: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em gerarDemonstrativoConsumo: " + error.message);
    throw error;
  }
}

// Função para exportar dados para SEI
function exportarDadosSEI() {
  try {
    try {
      try {
        var ui = getSafeUi();
        var ss = getSS();

        var response = ui.alert(
          'Exportar para SEI',
          'Esta função preparará os dados para inserção no Sistema Eletrônico de Informações (SEI).\n\n' +
          'Deseja continuar ? ',
          ui.ButtonSet.YES_NO
        );

        if (response != ui.Button.YES) {
          return;
        }

        var exportSheet = createTemporarySheet('Exportacao_SEI', ['Tipo', 'Dados', 'Formato']);

        var output = [
          ['DADOS PARA EXPORTAÇÃO - SEI'],
          ['Data de Exportação : ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH,mm : ss')],
          [''],
          ['INSTRUÇÕES : '],
          ['1. Copie os dados abaixo'],
          ['2. Acesse o SEI'],
          ['3. Cole no documento apropriado'],
          [''],
          ['RESUMO DOS DADOS : ']
        ];

        // Adicionar resumo de cada aba
        var abas = ['Notas_Fiscais', 'Entregas', 'Recusas', 'Glosas'];
        abas.forEach(function(nomeAba) {
          var aba = ss.getSheetByName(nomeAba);
          if (aba && aba.getLastRow() > 1) {
            output.push(['']);
            output.push([nomeAba + ' : ' + (aba.getLastRow() - 1) + ' registros']);
          }
        });

        exportSheet.getRange(1, 1, output.length, 1).setValues(output);
        exportSheet.getRange(1, 1).setFontWeight('bold').setFontSize(12);

        ss.setActiveSheet(exportSheet);
        safeAlert('Exportação preparada',
          'Os dados foram preparados para exportação.\n\n' +
          'Revise o conteúdo antes de copiar para o SEI.',
          ui.ButtonSet.OK);
      } catch (error) {
        Logger.log("Erro em exportarDadosSEI: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em exportarDadosSEI: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em exportarDadosSEI: " + error.message);
    throw error;
  }
}


// ---- Entregas.gs ----
/**
 * Entregas.gs
 * Módulo para gerenciamento de entregas nas unidades escolares
 */

// Função para atualizar dados de entregas
function atualizarDadosEntregas() {
  try {
    try {
      try {
        var ui = getSafeUi();
        var ss = getSS();
        var sheet = ss.getSheetByName('Entregas') || ss.insertSheet('Entregas');

        // Criar estrutura inicial se não existir
        var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        if (!headers || headers.length == 0 || headers[0] == '') {
          var cabecalhos = [
            'Data Entrega',
            'Nota Fiscal',
            'Fornecedor',
            'Unidade Escolar',
            'Produto',
            'Quantidade Solicitada',
            'Quantidade Entregue',
            'Unidade',
            'Status',
            'Responsável Recebimento',
            'Observações'
          ];
          sheet.getRange(1, 1, 1, cabecalhos.length).setValues([cabecalhos]);
          sheet.getRange(1, 1, 1, cabecalhos.length).setFontWeight('bold').setBackground('#4CAF50').setFontColor('#FFFFFF');
        }

        safeAlert('Dados de entregas atualizados',
          'A estrutura para registro de entregas foi criada/atualizada.\n' +
          'Você pode agora registrar as entregas recebidas pelas unidades escolares.',
          ui.ButtonSet.OK);
      } catch (error) {
        Logger.log("Erro em atualizarDadosEntregas: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em atualizarDadosEntregas: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em atualizarDadosEntregas: " + error.message);
    throw error;
  }
}

// Função para registrar entregas por unidade escolar
function registrarEntregasPorUnidade() {
  try {
    try {
      try {
        var ui = getSafeUi();
        var ss = getSS();
        var sheet = ss.getSheetByName('Entregas');

        if (!sheet) {
          atualizarDadosEntregas();
          sheet = ss.getSheetByName('Entregas');
        }

        // Formulário para registrar nova entrega
        var response = safePrompt(
          'Registrar Entrega',
          'Digite os dados no formato : Data|NF|Fornecedor|Unidade|Produto|QtdSolic|QtdEntr|Unid|Responsável\n' +
          'Exemplo : 24/10/2025|16221|Contrigo|EC 01|Arroz|100|100|kg|João Silva',
          ui.ButtonSet.OK_CANCEL
        );

        if (response.getSelectedButton() != ui.Button.OK) {
          return;
        }

        var dados = response.getResponseText().split('|');
        if (dados.length < 9) {
          safeAlert('Erro', 'Formato inválido. Certifique-se de fornecer todos os campos separados por |', ui.ButtonSet.OK);
          return;
        }

        var qtdSolic = Number(dados[5]);
        var qtdEntr = Number(dados[6]);
        var status;
        if (qtdSolic == qtdEntr) {
          status = 'Entregue Completo';
        } else {
          status = qtdEntr > 0 ? 'Entregue Parcial' : 'Não Entregue';
        }

        var novaLinha = [
          dados[0],                    // Data
          dados[1],                    // NF
          dados[2],                    // Fornecedor
          dados[3],                    // Unidade
          dados[4],                    // Produto
          qtdSolic,                    // Qtd Solicitada
          qtdEntr,                     // Qtd Entregue
          dados[7],                    // Unidade
          status,                      // Status
          dados[8],                    // Responsável
          '',                           // Observações
        ];

        sheet.appendRow(novaLinha);

        safeAlert('Sucesso', 'Entrega registrada com sucesso!\nStatus : ' + status, ui.ButtonSet.OK);
      } catch (error) {
        Logger.log("Erro em registrarEntregasPorUnidade: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em registrarEntregasPorUnidade: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em registrarEntregasPorUnidade: " + error.message);
    throw error;
  }
}

// Função para registrar recusas de produtos
function registrarRecusas() {
  try {
    try {
      try {
        var ui = getSafeUi();
        var ss = getSS();
        var sheet = ss.getSheetByName('Recusas') || ss.insertSheet('Recusas');

        // Criar estrutura se não existir
        if (sheet.getLastRow() == 0) {
          var cabecalhos = [
            'Data Recusa',
            'Unidade Escolar',
            'Fornecedor',
            'Produto',
            'Quantidade Recusada',
            'Motivo',
            'NF',
            'Responsável',
            'Ação Tomada',
            'Status'
          ];
          sheet.getRange(1, 1, 1, cabecalhos.length).setValues([cabecalhos]);
          sheet.getRange(1, 1, 1, cabecalhos.length).setFontWeight('bold').setBackground('#F44336').setFontColor('#FFFFFF');
        }

        // Formulário para registro
        var response = safePrompt(
          'Registrar Recusa',
          'Selecione o motivo : \n' +
          '1 - Baixa Qualidade\n' +
          '2 - Fora da temperatura ideal/descongelado\n' +
          '3 - Estoque cheio\n' +
          '4 - Produto fora do prazo de validade\n' +
          '5 - Outro\n\n' +
          'Digite : Motivo|Unidade|Fornecedor|Produto|Quantidade|NF|Responsável\n' +
          'Exemplo : 1|EC 01|Contrigo|Carne|50kg|16221|Maria Silva',
          ui.ButtonSet.OK_CANCEL
        );

        if (response.getSelectedButton() != ui.Button.OK) {
          return;
        }

        var dados = response.getResponseText().split('|');
        if (dados.length < 7) {
          safeAlert('Erro', 'Formato inválido.', ui.ButtonSet.OK);
          return;
        }

        var motivos = {
          '1' : 'Baixa Qualidade',
          '2' : 'Fora da temperatura ideal/descongelado',
          '3' : 'Estoque cheio',
          '4' : 'Produto fora do prazo de validade',
          '5' : 'Outro'
        };

        var novaLinha = [
          new Date(),
          dados[1],                    // Unidade
          dados[2],                    // Fornecedor
          dados[3],                    // Produto
          dados[4],                    // Quantidade
          motivos[dados[0]] || dados[0], // Motivo
          dados[5],                    // NF
          dados[6],                    // Responsável
          'Pendente',                  // Ação Tomada
          'Aguardando Providências',    // Status
        ];

        sheet.appendRow(novaLinha);

        safeAlert('Sucesso',
          'Recusa registrada com sucesso!\n' +
          'Motivo : ' + (motivos[dados[0]] || dados[0]) + '\n\n' +
          'A recusa será considerada na análise de glosas.',
          ui.ButtonSet.OK);
      } catch (error) {
        Logger.log("Erro em registrarRecusas: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em registrarRecusas: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em registrarRecusas: " + error.message);
    throw error;
  }
}

// Função para verificar qualidade dos produtos
function verificarQualidadeProdutos() {
  try {
    try {
      try {
        var ui = getSafeUi();
        var ss = getSS();
        var entregasSheet = ss.getSheetByName('Entregas');
        var recusasSheet = ss.getSheetByName('Recusas');

        if (!entregasSheet && !recusasSheet) {
          ui.alert('Erro', 'Nenhum dado de entregas ou recusas encontrado.', ui.ButtonSet.OK);
          return;
        }

        // Análise de qualidade baseada em recusas
        var problemas = [];

        if (recusasSheet && recusasSheet.getLastRow() > 1) {
          var recusas = recusasSheet.getDataRange().getValues();
          var headers = recusas[0];

          var fornecedorIdx = headers.indexOf('Fornecedor');
          var motivoIdx = headers.indexOf('Motivo');
          var produtoIdx = headers.indexOf('Produto');

          var estatisticas = {};

          for (var i = 1; i < recusas.length; i++) {
            var fornecedor = recusas[i][fornecedorIdx];
            var motivo = recusas[i][motivoIdx];
            var produto = recusas[i][produtoIdx];

            if (!estatisticas[fornecedor]) {
              estatisticas[fornecedor] = {total : 0, motivos : {}, produtos : {}};
            }

            estatisticas[fornecedor].total++
            estatisticas[fornecedor].motivos[motivo] = (estatisticas[fornecedor].motivos[motivo] || 0) + 1;
            estatisticas[fornecedor].produtos[produto] = (estatisticas[fornecedor].produtos[produto] || 0) + 1;
          }

          // Identificar fornecedores problemáticos
          for (var f in estatisticas) {
            if (estatisticas[f].total >= 3) {
              problemas.push({
                fornecedor : f,
                totalRecusas : estatisticas[f].total,
                principais : estatisticas[f].motivos
              });
            }
          }
        }

        // Criar relatório
        var resultSheet = ss.getSheetByName('Analise_Qualidade') || ss.insertSheet('Analise_Qualidade');
        resultSheet.clear();

        var output = [
          ['Análise de Qualidade de Produtos'],
          ['Data : ', new Date()],
          [''],
          ['Fornecedores com Problemas de Qualidade : '],
          ['Fornecedor', 'Total de Recusas', 'Principais Motivos']
        ];

        problemas.forEach(function(p) {
          var motivos = Object.keys(p.principais).map(function(m) {}).join(', ');
          output.push([p.fornecedor, p.totalRecusas, motivos]);
        });

        if (problemas.length == 0) {
          output.push(['Nenhum problema significativo identificado']);
        }

        resultSheet.getRange(1, 1, output.length, 3).setValues(output);
        resultSheet.getRange(1, 1).setFontWeight('bold').setFontSize(12);

        ss.setActiveSheet(resultSheet);
        safeAlert('Análise concluída',
          'Fornecedores com problemas de qualidade : ' + problemas.length,
          ui.ButtonSet.OK);
      } catch (error) {
        Logger.log("Erro em verificarQualidadeProdutos: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em verificarQualidadeProdutos: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em verificarQualidadeProdutos: " + error.message);
    throw error;
  }
}

// Função para conferir atrasos nas entregas
function conferirAtrasosEntregas() {
  try {
    try {
      try {
        var ui = getSafeUi();
        var ss = getSS();
        var sheet = ss.getSheetByName('Entregas');

        if (!sheet || sheet.getLastRow() <= 1) {
          ui.alert('Erro', 'Nenhum dado de entregas encontrado.', ui.ButtonSet.OK);
          return;
        }

        var data = sheet.getDataRange().getValues();
        var headers = data[0];
        var dataIdx = headers.indexOf('Data Entrega');
        var nfIdx = headers.indexOf('Nota Fiscal');
        var fornecedorIdx = headers.indexOf('Fornecedor');
        var unidadeIdx = headers.indexOf('Unidade Escolar');

        var hoje = new Date();
        var atrasos = [];

        for (var i = 1; i < data.length; i++) {
          var dataEntrega = new Date(data[i][dataIdx]);
          var diasAtraso = Math.floor((hoje - dataEntrega) / (1000 * 60 * 60 * 24));

          // Considerar atraso se entrega foi marcada mas não confirmada, ou se passou muito tempo
          if (diasAtraso > 7) {
            atrasos.push({
              linha : i + 1,
              nf : data[i][nfIdx],
              fornecedor : data[i][fornecedorIdx],
              unidade : data[i][unidadeIdx],
              dataEntrega : dataEntrega,
              diasAtraso : diasAtraso
            });
          }
        }

        // Criar relatório
        var resultSheet = ss.getSheetByName('Atrasos_Entregas') || ss.insertSheet('Atrasos_Entregas');
        resultSheet.clear();

        var output = [
          ['Conferência de Atrasos nas Entregas'],
          ['Data da Análise : ', hoje],
          [''],
          ['Total de Entregas Analisadas : ', data.length - 1],
          ['Entregas com Possível Atraso : ', atrasos.length],
          [''],
          ['Detalhamento : '],
          ['NF', 'Fornecedor', 'Unidade', 'Data Entrega', 'Dias desde Entrega']
        ];

        atrasos.forEach(function(a) {
          output.push([
            a.nf,
            a.fornecedor,
            a.unidade,
            Utilities.formatDate(a.dataEntrega, Session.getScriptTimeZone(), 'dd/MM/yyyy'),
            a.diasAtraso
          ]);
        });

        resultSheet.getRange(1, 1, output.length, 5).setValues(output);
        resultSheet.getRange(1, 1).setFontWeight('bold').setFontSize(12);

        ss.setActiveSheet(resultSheet);
        safeAlert('Conferência concluída',
          'Possíveis atrasos identificados : ' + atrasos.length,
          ui.ButtonSet.OK);
      } catch (error) {
        Logger.log("Erro em conferirAtrasosEntregas: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em conferirAtrasosEntregas: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em conferirAtrasosEntregas: " + error.message);
    throw error;
  }
}

// Função para controlar substituições pendentes
function controlarSubstituicoesPendentes() {
  try {
    try {
      try {
        var ui = getSafeUi();
        var ss = getSS();
        var sheet = ss.getSheetByName('Substituicoes') || ss.insertSheet('Substituicoes');

        // Criar estrutura se não existir
        if (sheet.getLastRow() == 0) {
          var cabecalhos = [
            'Data Solicitação',
            'NF Original',
            'Fornecedor',
            'Produto',
            'Quantidade',
            'Motivo',
            'Prazo Substituição',
            'Status',
            'Data Substituição',
            'Dias Corridos',
            'Observações'
          ];
          sheet.getRange(1, 1, 1, cabecalhos.length).setValues([cabecalhos]);
          sheet.getRange(1, 1, 1, cabecalhos.length).setFontWeight('bold').setBackground('#FF9800').setFontColor('#FFFFFF');
        }

        // Analisar substituições pendentes
        var data = sheet.getDataRange().getValues();
        if (data.length <= 1) {
          safeAlert('Informação',
            'Nenhuma substituição registrada.\n\n' +
            'Use a opção "Registrar Recusas" para criar solicitações de substituição.',
            ui.ButtonSet.OK);
          return;
        }

        var headers = data[0];
        var statusIdx = headers.indexOf('Status');
        var prazoIdx = headers.indexOf('Prazo Substituição');
        var dataSolIdx = headers.indexOf('Data Solicitação');

        var pendentes = 0;
        var atrasadas = 0;
        var hoje = new Date();

        for (var i = 1; i < data.length; i++) {
          var status = data[i][statusIdx];
          if (status == 'Pendente' || status == 'Em Andamento') {
            pendentes++

            var prazo = new Date(data[i][prazoIdx]);
            if (hoje > prazo) {
              atrasadas++
              sheet.getRange(i + 1, statusIdx + 1).setBackground('#FF5252');
            }
          }
        }

        safeAlert('Controle de Substituições',
          'Substituições Pendentes : ' + pendentes + '\n' +
          'Substituições Atrasadas : ' + atrasadas + '\n\n' +
          'As substituições atrasadas foram destacadas em vermelho.',
          ui.ButtonSet.OK);
      } catch (error) {
        Logger.log("Erro em controlarSubstituicoesPendentes: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em controlarSubstituicoesPendentes: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em controlarSubstituicoesPendentes: " + error.message);
    throw error;
  }
}


// ---- PrestacaoContas.gs ----
/**
 * PrestacaoContas.gs - Prestação de Contas da Alimentação Escolar
 * Implementação do Manual da Alimentação Escolar do DF (Item 18)
 *
 * BASE LEGAL :
 * - Manual da Alimentação Escolar DF Item 18 : Prestação de contas
 * - Lei 11.947/2009 : Guarda de documentos por 5 anos
 * - Resolução FNDE 06/2020 : Documentação obrigatória
 * - Lei 14.133/2021 : Transparência e controle
 * - Instrução Normativa TCDF : Prestação de contas
 *
 * ESCOPO :
 * - Documentação obrigatória
 * - Demonstrativos de execução
 * - Controle de saldos
 * - Relatórios consolidados
 * - Guarda de documentos (5 anos)
 */

/**
 * DOCUMENTOS OBRIGATÓRIOS (Manual Item 18)
 */
var DOCUMENTOS_OBRIGATORIOS = {
  NOTAS_FISCAIS : {
    codigo : 'NF',
    nome : 'Notas Fiscais',
    prazo_guarda : 5, // anos
    base_legal : 'Lei 11.947/2009 Art. 15 §2º'
  },
      RECIBOS_ENTREGA : {
    codigo : 'RECIBO',
    nome : 'Recibos de Entrega',
    prazo_guarda : 5,
    base_legal : 'Manual Item 18'
  },
      ATESTACOES : {
    codigo : 'ATESTO',
    nome : 'Atestações da Comissão',
    prazo_guarda : 5,
    base_legal : 'Resolução FNDE 06/2020'
  },
      PDGP : {
    codigo : 'PDGP',
    nome : 'Plano de Distribuição de Gêneros Perecíveis',
    prazo_guarda : 5,
    base_legal : 'Manual Item 11.2'
  },
      PDGA : {
    codigo : 'PDGA',
    nome : 'Plano de Distribuição de Gêneros Não Perecíveis',
    prazo_guarda : 5,
    base_legal : 'Manual Item 11.1'
  },
      CARDAPIOS : {
    codigo : 'CARDAPIO',
    nome : 'Cardápios Executados',
    prazo_guarda : 5,
    base_legal : 'Resolução FNDE 06/2020'
  },
      TESTES_ACEITABILIDADE : {
    codigo : 'TESTE',
    nome : 'Testes de Aceitabilidade',
    prazo_guarda : 5,
    base_legal : 'Resolução FNDE 38/2009'
  }
};

/**
 * DEMONSTRATIVOS OBRIGATÓRIOS
 */
var DEMONSTRATIVOS = {
  CONSAL : {
    codigo : 'CONSAL',
    nome : 'Demonstrativo de Consumo e Saldo de Gêneros Alimentícios',
    periodicidade : 'Mensal',
    base_legal : 'Manual Item 18'
  },
      RETRIM : {
    codigo : 'RETRIM',
    nome : 'Resumo Trimestral do Atendimento da Merenda Escolar',
    periodicidade : 'Trimestral',
    base_legal : 'Manual Item 18'
  },
      RDSG : {
    codigo : 'RDSG',
    nome : 'Resumo Diário de Saída de Gêneros',
    periodicidade : 'Diário',
    base_legal : 'Manual Item 18'
  }
};

/**
 * PERÍODOS DE PRESTAÇÃO
 */
var PERIODOS_PRESTACAO = {
  MENSAL : 'Mensal',
  BIMESTRAL : 'Bimestral',
  TRIMESTRAL : 'Trimestral',
  SEMESTRAL : 'Semestral',
  ANUAL : 'Anual'
};

/**
 * STATUS DE PRESTAÇÃO
 */
var STATUS_PRESTACAO = {
  EM_ELABORACAO : 'Em Elaboração',
  AGUARDANDO_DOCUMENTOS : 'Aguardando Documentos',
  COMPLETA : 'Completa',
  ENVIADA : 'Enviada',
  APROVADA : 'Aprovada',
  PENDENTE_CORRECAO : 'Pendente de Correção',
  REJEITADA : 'Rejeitada'
};

/**
 * Service : Prestação de Contas
 */
function PrestacaoContasService(dependencies) {
  try {
    try {
      try {
        BaseService.call(this, dependencies);
        this.sheetPrestacoes = 'Prestacao_Contas';
        this.sheetDocumentos = 'Documentos_Prestacao';
        this.sheetDemonstrativos = 'Demonstrativos';
      } catch (error) {
        Logger.log("Erro em PrestacaoContasService: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em PrestacaoContasService: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em PrestacaoContasService: " + error.message);
    throw error;
  }
}

PrestacaoContasService.prototype = Object.create(BaseService.prototype);
PrestacaoContasService.prototype.constructor = PrestacaoContasService;

/**
 * Inicia nova prestação de contas (Manual Item 18)
 */
PrestacaoContasService.prototype.iniciarPrestacao = function(dados) {
  validateRequired(dados.unidadeEscolar, 'Unidade Escolar');
  validateRequired(dados.periodo, 'Período');
  validateRequired(dados.mesReferencia, 'Mês de Referência');
  validateRequired(dados.anoReferencia, 'Ano de Referência');

  var sheet = getOrCreateSheetSafe(this.sheetPrestacoes);

  var prestacao = {
    id : this.generateId(),
    dataInicio : new Date(),
    unidadeEscolar : dados.unidadeEscolar,
    cre : dados.cre || '',
    periodo : dados.periodo,
    mesReferencia : dados.mesReferencia,
    anoReferencia : dados.anoReferencia,
    responsavel : dados.responsavel || Session.getActiveUser().getEmail(),
    status : STATUS_PRESTACAO.EM_ELABORACAO,

    // Checklist de documentos obrigatórios,
    temNotasFiscais : false,
    temRecibosEntrega : false,
    temAtestacoes : false,
    temPDGP : false,
    temPDGA : false,
    temCardapios : false,
    temTestesAceitabilidade : false,

    // Demonstrativos,
    temCONSAL : false,
    temRETRIM : false,
    temRDSG : false,

    percentualCompleto : 0,
    observacoes : dados.observacoes || '',
    baseLegal : 'Manual Alimentação Escolar DF Item 18 + Lei 11.947/2009'
  };

  this.salvarPrestacao(prestacao);

  SystemLogger.info('Prestação de contas iniciada', {
    id : prestacao.id,
    unidade : dados.unidadeEscolar,
    periodo : dados.periodo + '/' + dados.anoReferencia
  });

};

/**
 * Registra documento na prestação
 */
PrestacaoContasService.prototype.registrarDocumento = function(dados) {
  validateRequired(dados.prestacaoId, 'ID da Prestação');
  validateRequired(dados.tipoDocumento, 'Tipo de Documento');
  validateRequired(dados.descricao, 'Descrição');

  var sheet = getOrCreateSheetSafe(this.sheetDocumentos);

  var documento = {
    id : this.generateId(),
    dataRegistro : new Date(),
    prestacaoId : dados.prestacaoId,
    tipoDocumento : dados.tipoDocumento,
    descricao : dados.descricao,
    numeroDocumento : dados.numeroDocumento || '',
    dataDocumento : dados.dataDocumento || null,
    valor : dados.valor || 0,
    linkArquivo : dados.linkArquivo || '',
    linkSEI : dados.linkSEI || '',
    responsavelRegistro : dados.responsavelRegistro || Session.getActiveUser().getEmail(),
    observacoes : dados.observacoes || ''
  };

  this.salvarDocumento(documento);

  // Atualizar checklist da prestação
  this.atualizarChecklistPrestacao(dados.prestacaoId, dados.tipoDocumento);

  SystemLogger.info('Documento registrado na prestação', {
    prestacaoId : dados.prestacaoId,
    tipo : dados.tipoDocumento
  });

};

/**
 * Atualiza checklist de documentos da prestação
 */
PrestacaoContasService.prototype.atualizarChecklistPrestacao = function(prestacaoId, tipoDocumento) {
  var prestacao = this.buscarPrestacaoPorId(prestacaoId);
  if (!prestacao) return;

  // Marcar documento como presente
  switch(tipoDocumento) {
    case DOCUMENTOS_OBRIGATORIOS.NOTAS_FISCAIS.codigo :
      prestacao.temNotasFiscais = true;
      break;
    case DOCUMENTOS_OBRIGATORIOS.RECIBOS_ENTREGA.codigo :
      prestacao.temRecibosEntrega = true;
      break;
    case DOCUMENTOS_OBRIGATORIOS.ATESTACOES.codigo :
      prestacao.temAtestacoes = true;
      break;
    case DOCUMENTOS_OBRIGATORIOS.PDGP.codigo :
      prestacao.temPDGP = true;
      break;
    case DOCUMENTOS_OBRIGATORIOS.PDGA.codigo :
      prestacao.temPDGA = true;
      break;
    case DOCUMENTOS_OBRIGATORIOS.CARDAPIOS.codigo :
      prestacao.temCardapios = true;
      break;
    case DOCUMENTOS_OBRIGATORIOS.TESTES_ACEITABILIDADE.codigo :
      prestacao.temTestesAceitabilidade = true;
      break;
  }

  // Calcular percentual de completude
  var totalItens = 7; // Total de documentos obrigatórios;
  var itensCompletos = 0;

  if (prestacao.temNotasFiscais) itensCompletos++
  if (prestacao.temRecibosEntrega) itensCompletos++
  if (prestacao.temAtestacoes) itensCompletos++
  if (prestacao.temPDGP) itensCompletos++
  if (prestacao.temPDGA) itensCompletos++
  if (prestacao.temCardapios) itensCompletos++
  if (prestacao.temTestesAceitabilidade) itensCompletos++

  prestacao.percentualCompleto = Math.round((itensCompletos / totalItens) * 100);

  // Atualizar status
  if (prestacao.percentualCompleto == 100) {
    prestacao.status = STATUS_PRESTACAO.COMPLETA;
  } else if (prestacao.percentualCompleto > 0) {
    prestacao.status = STATUS_PRESTACAO.EM_ELABORACAO;
  }

  this.atualizarPrestacao(prestacao);
};

/**
 * Gera demonstrativo CONSAL (Manual Item 18)
 */
PrestacaoContasService.prototype.gerarCONSAL = function(dados) {
  validateRequired(dados.unidadeEscolar, 'Unidade Escolar');
  validateRequired(dados.mesReferencia, 'Mês de Referência');
  validateRequired(dados.anoReferencia, 'Ano de Referência');

  // Buscar movimentações do estoque no período
  var armazenamentoService = DIContainer.resolve('armazenamentoGeneros');
  var todosItens = armazenamentoService.listarEstoque();

  var itensUnidade = todosItens.filter(function(item) {
    return item.unidadeEscolar == dados.unidadeEscolar;
  });

  var demonstrativo = {
    id : this.generateId(),
    tipo : DEMONSTRATIVOS.CONSAL.codigo,
    dataGeracao : new Date(),
    unidadeEscolar : dados.unidadeEscolar,
    cre : dados.cre || '',
    mesReferencia : dados.mesReferencia,
    anoReferencia : dados.anoReferencia,
    itens : [],
    totalProdutos : 0,
    baseLegal : 'Manual Item 18'
  };

  // Agrupar por produto
  var produtosAgrupados = {};

  itensUnidade.forEach(function(item) {
    if (!produtosAgrupados[item.produto]) {
      produtosAgrupados[item.produto] = {
        produto : item.produto,
        unidade : item.unidade,
        saldoInicial : 0,
        entradas : 0,
        saidas : 0,
        saldoFinal : item.quantidade
      };
    }
  });

  demonstrativo.itens = Object.values(produtosAgrupados);
  demonstrativo.totalProdutos = demonstrativo.itens.length;

  this.salvarDemonstrativo(demonstrativo);

  SystemLogger.info('CONSAL gerado', {
    unidade : dados.unidadeEscolar,
    periodo : dados.mesReferencia + '/' + dados.anoReferencia,
    produtos : demonstrativo.totalProdutos
  });

};

/**
 * Gera demonstrativo RETRIM (Manual Item 18)
 */
PrestacaoContasService.prototype.gerarRETRIM = function(dados) {
  validateRequired(dados.unidadeEscolar, 'Unidade Escolar');
  validateRequired(dados.trimestre, 'Trimestre');
  validateRequired(dados.anoReferencia, 'Ano de Referência');

  var demonstrativo = {
    id : this.generateId(),
    tipo : DEMONSTRATIVOS.RETRIM.codigo,
    dataGeracao : new Date(),
    unidadeEscolar : dados.unidadeEscolar,
    cre : dados.cre || '',
    trimestre : dados.trimestre,
    anoReferencia : dados.anoReferencia,

    // Dados do atendimento,
    totalAlunosMatriculados : dados.totalAlunosMatriculados || 0,
    totalDiasLetivos : dados.totalDiasLetivos || 0,
    totalRefeicoesServidas : dados.totalRefeicoesServidas || 0,
    mediaRefeicoesdia : 0,

    // Dados financeiros,
    valorRecebido : dados.valorRecebido || 0,
    valorExecutado : dados.valorExecutado || 0,
    saldoFinanceiro : 0,

      // baseLegal : 'Manual Item 18'
  };

  // Calcular médias
  if (demonstrativo.totalDiasLetivos > 0) {
    demonstrativo.mediaRefeicoesdia = Math.round(
      demonstrativo.totalRefeicoesServidas / demonstrativo.totalDiasLetivos
    );
  }

  demonstrativo.saldoFinanceiro = demonstrativo.valorRecebido - demonstrativo.valorExecutado;

  this.salvarDemonstrativo(demonstrativo);

  SystemLogger.info('RETRIM gerado', {
    unidade : dados.unidadeEscolar,
    trimestre : dados.trimestre + '/' + dados.anoReferencia
  });

};

/**
 * Envia prestação de contas
 */
PrestacaoContasService.prototype.enviarPrestacao = function(prestacaoId, dados) {
  validateRequired(dados.destinatario, 'Destinatário');
  validateRequired(dados.protocoloEnvio, 'Protocolo de Envio');

  var prestacao = this.buscarPrestacaoPorId(prestacaoId);
  if (!prestacao) {
    throw new Error('Prestação não encontrada : ' + prestacaoId);
  }

  if (prestacao.percentualCompleto < 100) {
    throw new Error('Prestação incompleta. Completude : ' + prestacao.percentualCompleto + '%');
  }

  prestacao.dataEnvio = new Date();
  prestacao.destinatario = dados.destinatario;
  prestacao.protocoloEnvio = dados.protocoloEnvio;
  prestacao.linkProcessoSEI = dados.linkProcessoSEI || '';
  prestacao.status = STATUS_PRESTACAO.ENVIADA;
  prestacao.observacoesEnvio = dados.observacoes || '';

  this.atualizarPrestacao(prestacao);

  SystemLogger.info('Prestação de contas enviada', {
    id : prestacaoId,
    protocolo : dados.protocoloEnvio
  });

};

/**
 * Verifica documentos pendentes de guarda (5 anos)
 */
PrestacaoContasService.prototype.verificarDocumentosPendenteGuarda = function(unidadeEscolar) {
  var documentos = this.listarTodosDocumentos();
  var hoje = new Date();
  var cincoAnosAtras = new Date();
  cincoAnosAtras.setFullYear(hoje.getFullYear() - 5);

  var documentosUnidade = documentos.filter(function(doc) {
    var prestacao = this.buscarPrestacaoPorId(doc.prestacaoId);
  }.bind(this));

  var pendentes = [];
  var podeDescartar = [];

  documentosUnidade.forEach(function(doc) {
    var dataDoc = new Date(doc.dataDocumento || doc.dataRegistro);

    if (dataDoc < cincoAnosAtras) {
      podeDescartar.push({
        id : doc.id,
        tipo : doc.tipoDocumento,
        data : dataDoc,
        diasAposLimite : Math.floor((hoje - cincoAnosAtras) / (1000 * 60 * 60 * 24))
      });
    } else {
      var diasRestantes = Math.floor((cincoAnosAtras - dataDoc) / (1000 * 60 * 60 * 24));
      if (diasRestantes < 365) { // Alertar no último ano
        pendentes.push({
          id : doc.id,
          tipo : doc.tipoDocumento,
          data : dataDoc,
          diasRestantes : Math.abs(diasRestantes)
        });
      }
    }
  });

  return {
    pendentesGuarda : pendentes,
    podeDescartar : podeDescartar,
    baseLegal : 'Lei 11.947/2009 Art. 15 §2º - Guarda por 5 anos'
  };
};

/**
 * Gera relatório consolidado de prestações
 */
PrestacaoContasService.prototype.gerarRelatorioConsolidado = function(filtros) {
  var prestacoes = this.listarTodasPrestacoes();

  if (filtros) {
    if (filtros.unidadeEscolar) {
      prestacoes = prestacoes.filter(function(p) { return p.unidadeEscolar == filtros.unidadeEscolar; });
    }
    if (filtros.anoReferencia) {
      prestacoes = prestacoes.filter(function(p) { return p.anoReferencia == filtros.anoReferencia; });
    }
    if (filtros.status) {
      prestacoes = prestacoes.filter(function(p) { return p.status == filtros.status; });
    }
  }

  var relatorio = {
    totalPrestacoes : prestacoes.length,
    porStatus : {},
    porPeriodo : {},
    mediaCompletude : 0,
    prestacoesCompletas : 0,
    prestacoesPendentes : 0
  };

  var somaCompletude = 0;

  prestacoes.forEach(function(p) {
    // Por status
    relatorio.porStatus[p.status] = (relatorio.porStatus[p.status] || 0) + 1;

    // Por período
    var chave = p.periodo + '/' + p.anoReferencia;
    relatorio.porPeriodo[chave] = (relatorio.porPeriodo[chave] || 0) + 1;

    // Completude
    somaCompletude += p.percentualCompleto || 0;
    if (p.percentualCompleto == 100) {
      relatorio.prestacoesCompletas++
    } else {
      relatorio.prestacoesPendentes++
    }
  });

  if (prestacoes.length > 0) {
    relatorio.mediaCompletude = Math.round(somaCompletude / prestacoes.length);
  }

};

/**
 * Métodos auxiliares - Prestações
 */
PrestacaoContasService.prototype.salvarPrestacao = function(prestacao) {
  var sheet = getOrCreateSheetSafe(this.sheetPrestacoes);
  var headers = this.getHeadersPrestacoes();

  if (sheet.getLastRow() == 0) {
    sheet.appendRow(headers);
  }

  var row = this.mapPrestacaoToRow(prestacao, headers);
  sheet.appendRow(row);
};

PrestacaoContasService.prototype.atualizarPrestacao = function(prestacao) {
  var sheet = getOrCreateSheetSafe(this.sheetPrestacoes);
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == prestacao.id) {
      var headers = data[0];
      var row = this.mapPrestacaoToRow(prestacao, headers);
      sheet.getRange(i + 1, 1, 1, row.length).setValues([row]);
    }
  }
};

PrestacaoContasService.prototype.buscarPrestacaoPorId = function(id) {
  var prestacoes = this.listarTodasPrestacoes();
};

PrestacaoContasService.prototype.listarTodasPrestacoes = function() {
  var sheet = getOrCreateSheetSafe(this.sheetPrestacoes);
  if (sheet.getLastRow() <= 1) return [];

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var prestacoes = [];

  for (var i = 1; i < data.length; i++) {
    prestacoes.push(this.mapRowToPrestacao(data[i], headers));
  }

};

PrestacaoContasService.prototype.getHeadersPrestacoes = function() {
          'Responsável', 'Status', 'Tem NF', 'Tem Recibos', 'Tem Atestações', 'Tem PDGP',
          'Tem PDGA', 'Tem Cardápios', 'Tem Testes', 'Tem CONSAL', 'Tem RETRIM', 'Tem RDSG',
          '% Completo', 'Data Envio', 'Protocolo', 'Observações', 'Base Legal'};

PrestacaoContasService.prototype.mapPrestacaoToRow = function(p, headers) {
    p.id, p.dataInicio, p.unidadeEscolar, p.cre || '', p.periodo, p.mesReferencia, p.anoReferencia,
    p.responsavel, p.status, p.temNotasFiscais, p.temRecibosEntrega, p.temAtestacoes,
    p.temPDGP, p.temPDGA, p.temCardapios, p.temTestesAceitabilidade, p.temCONSAL,
    p.temRETRIM, p.temRDSG, p.percentualCompleto, p.dataEnvio || '', p.protocoloEnvio || '',
    p.observacoes || '', p.baseLegal || ''
  };

PrestacaoContasService.prototype.mapRowToPrestacao = function(row, headers) {
  return {
    id : row[0], dataInicio : row[1], unidadeEscolar : row[2], cre : row[3], periodo : row[4],
    mesReferencia : row[5], anoReferencia : row[6], responsavel : row[7], status : row[8],
    temNotasFiscais : row[9], temRecibosEntrega : row[10], temAtestacoes : row[11],
    temPDGP : row[12], temPDGA : row[13], temCardapios : row[14], temTestesAceitabilidade : row[15],
    temCONSAL : row[16], temRETRIM : row[17], temRDSG : row[18], percentualCompleto : row[19],
    dataEnvio : row[20], protocoloEnvio : row[21], observacoes : row[22], baseLegal : row[23]
  };
};

/**
 * Métodos auxiliares - Documentos
 */
PrestacaoContasService.prototype.salvarDocumento = function(documento) {
  var sheet = getOrCreateSheetSafe(this.sheetDocumentos);
  var headers = this.getHeadersDocumentos();

  if (sheet.getLastRow() == 0) {
    sheet.appendRow(headers);
  }

  var row = this.mapDocumentoToRow(documento, headers);
  sheet.appendRow(row);
};

PrestacaoContasService.prototype.listarTodosDocumentos = function() {
  var sheet = getOrCreateSheetSafe(this.sheetDocumentos);
  if (sheet.getLastRow() <= 1) return [];

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var documentos = [];

  for (var i = 1; i < data.length; i++) {
    documentos.push(this.mapRowToDocumento(data[i], headers));
  }

};

PrestacaoContasService.prototype.getHeadersDocumentos = function() {
          'Número Documento', 'Data Documento', 'Valor', 'Link Arquivo', 'Link SEI',
          'Responsável', 'Observações'};

PrestacaoContasService.prototype.mapDocumentoToRow = function(d, headers) {
    d.id, d.dataRegistro, d.prestacaoId, d.tipoDocumento, d.descricao,
    d.numeroDocumento || '', d.dataDocumento || '', d.valor, d.linkArquivo || '',
    d.linkSEI || '', d.responsavelRegistro, d.observacoes || ''
  };

PrestacaoContasService.prototype.mapRowToDocumento = function(row, headers) {
  return {
    id : row[0], dataRegistro : row[1], prestacaoId : row[2], tipoDocumento : row[3],
    descricao : row[4], numeroDocumento : row[5], dataDocumento : row[6], valor : row[7],
    linkArquivo : row[8], linkSEI : row[9], responsavelRegistro : row[10], observacoes : row[11]
  };
};

/**
 * Métodos auxiliares - Demonstrativos
 */
PrestacaoContasService.prototype.salvarDemonstrativo = function(demonstrativo) {
  var sheet = getOrCreateSheetSafe(this.sheetDemonstrativos);
  var headers = this.getHeadersDemonstrativos();

  if (sheet.getLastRow() == 0) {
    sheet.appendRow(headers);
  }

  var row = this.mapDemonstrativoToRow(demonstrativo, headers);
  sheet.appendRow(row);
};

PrestacaoContasService.prototype.getHeadersDemonstrativos = function() {
          'Trimestre', 'Total Produtos', 'Total Alunos', 'Total Dias', 'Total Refeições',
          'Valor Recebido', 'Valor Executado', 'Base Legal'};

PrestacaoContasService.prototype.mapDemonstrativoToRow = function(d, headers) {
    d.id, d.tipo, d.dataGeracao, d.unidadeEscolar, d.cre || '', d.mesReferencia || '',
    d.anoReferencia, d.trimestre || '', d.totalProdutos || '', d.totalAlunosMatriculados || '',
    d.totalDiasLetivos || '', d.totalRefeicoesServidas || '', d.valorRecebido || '',
    d.valorExecutado || '', d.baseLegal || ''
  };

PrestacaoContasService.prototype.generateId = function() {
};

/**
 * Registrar serviço no DI Container
 */
function registerPrestacaoContas() {
  DIContainer.bind('prestacaoContas', function() {
    return new PrestacaoContasService({});
  }, true);

  SystemLogger.info('PrestacaoContas service registered');
}

