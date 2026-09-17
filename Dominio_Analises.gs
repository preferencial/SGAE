// ATENÇÃO : Este arquivo usa arrow functions e requer V8 runtime
// Configure em : Projeto > Configurações > Configurações do script > V8

'use strict';

/**
 * DOMINIO_ANALISES
 * Consolidado de : AnalisesAdicionais.gs, AnalysisDeterministic.gs, AnalysisGenerative.gs
 * @version 2.0.0
 * @created 2025-11-04
 */


// ---- AnalisesAdicionais.gs ----
/**
 * AnalisesAdicionais.gs
 * Módulo com análises específicas para conformidade e auditoria
 */

// Função para verificar conformidade com Portaria 244/2006
function verificarConformidade() {
  try {
    var ui = getSafeUi();

    var checklist = [
      {
        item : 'Comissão Regional instituída',
        descricao : 'Verificar se há Ordem de Serviço instituindo a Comissão',
        status : 'Verificar manualmente',
        base_legal : 'Art. 1º da Portaria 244/2006'
      },
      {
        item : 'Conferência de produtos realizada',
        descricao : 'Verificar se há registros de conferência dos produtos',
        status : verificarRegistrosConferencia() ? 'Conforme' : 'Não Conforme',
        base_legal : 'Art. 1º da Portaria 244/2006'
      },
      {
        item : 'Atesto de Notas Fiscais',
        descricao : 'Verificar se as NFs foram atestadas pela Comissão',
        status : verificarAtestoNFs() ? 'Conforme' : 'Não Conforme',
        base_legal : 'Art. 1º da Portaria 244/2006'
      },
      {
        item : 'Registro de entregas nas unidades',
        descricao : 'Verificar se há registro de entregas nas escolas',
        status : verificarRegistroEntregas() ? 'Conforme' : 'Não Conforme',
        base_legal : 'Art. 1º da Portaria 244/2006'
      },
      {
        item : 'Tratamento de recusas',
        descricao : 'Verificar se recusas foram registradas e tratadas',
        status : verificarTratamentoRecusas() ? 'Conforme' : 'Verificar',
        base_legal : 'Boas práticas'
      },
      {
        item : 'Aplicação de glosas',
        descricao : 'Verificar se glosas estão devidamente justificadas',
        status : verificarGlosasJustificadas() ? 'Conforme' : 'Verificar',
        base_legal : 'Lei 8.666/93'
      }
    ];

    var output = [
      ['VERIFICAÇÃO DE CONFORMIDADE COM A PORTARIA Nº 244/2006'],
      ['Data : ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH,mm')],
      [''],
      ['A Portaria nº 244, de 31 de julho de 2006, determina que as Diretorias Regionais de Ensino'],
      ['instituam Comissão Regional de Recebimento de Gêneros Alimentícios, com a finalidade de'],
      ['proceder à conferência dos produtos, bem como atestar as Notas Fiscais referentes à entrega'],
      ['dos mesmos nas instituições educacionais vinculadas à respectiva DRE.'],
      [''],
      ['CHECKLIST DE CONFORMIDADE : '],
      ['Item', 'Descrição', 'Status', 'Base Legal']
    ];

    var conformes = 0;
    var naoConformes = 0;

    checklist.forEach(function(item) {
      output.push([item.item, item.descricao, item.status, item.base_legal]);
      if (item.status == 'Conforme') conformes++;
      if (item.status == 'Não Conforme') naoConformes++;
    });

    output.push(['']);
    output.push(['RESUMO : ']);
    output.push(['Itens Conformes : ', conformes]);
    output.push(['Itens Não Conformes : ', naoConformes]);
    output.push(['Itens a Verificar : ', checklist.length - conformes - naoConformes]);
    output.push(['']);
    output.push(['OBSERVAÇÕES : ']);
    output.push(['- Os itens marcados como "Verificar manualmente" requerem análise documental adicional']);
    output.push(['- Recomenda-se manter documentação comprobatória de todas as atividades da Comissão']);
    output.push(['- Registros devem ser mantidos para fins de auditoria e controle']);

    // Criar relatório em planilha separada no Drive
    var resultadosConformidade = checklist.map(function(item) {
      return {
        item : item.item,
        status : item.status,
        detalhes : item.descricao,
        acao : item.status == 'Não Conforme' ? 'Requer correção' : 'Manter conformidade',
        prazo : item.status == 'Não Conforme' ? '30 dias' : 'N/A'
      };
    });

    var resultado = criarRelatorioConformidade(resultadosConformidade);

    if (resultado.success) {
      safeAlert('Verificação de Conformidade - Portaria 244/2006',
        'Relatório criado com sucesso!\n\n' +
        'Arquivo : ' + resultado.fileName + '\n' +
        'Itens Conformes : ' + conformes + '\n' +
        'Itens Não Conformes : ' + naoConformes + '\n' +
        'Itens a Verificar : ' + (checklist.length - conformes - naoConformes) + '\n\n' +
        'Acesse : ' + resultado.url,
        ui.ButtonSet.OK);
    } else {
      safeAlert('Erro', 'Erro ao criar relatório de conformidade : ' + resultado.error, ui.ButtonSet.OK);
    }
  } catch (error) {
    Logger.log("Erro em verificarConformidade: " + error.message);
    throw error;
  }
}

// Funções auxiliares para verificação de conformidade
function verificarRegistrosConferencia() {
  try {
    try {
      var ss = getSS();
      var entregasSheet = ss.getSheetByName('Entregas');
      return entregasSheet && entregasSheet.getLastRow() > 1;
    } catch (error) {
      Logger.log("Erro em verificarRegistrosConferencia: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em verificarRegistrosConferencia: " + error.message);
    throw error;
  }
}

function verificarAtestoNFs() {
  try {
    try {
      var ss = getSS();
      var nfSheet = ss.getSheetByName('Notas_Fiscais');
      return nfSheet && nfSheet.getLastRow() > 1;
    } catch (error) {
      Logger.log("Erro em verificarAtestoNFs: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em verificarAtestoNFs: " + error.message);
    throw error;
  }
}

function verificarRegistroEntregas() {
  try {
    var ss = getSS();
    var entregasSheet = ss.getSheetByName('Entregas');
    return entregasSheet && entregasSheet.getLastRow() > 1;
  } catch (error) {
    Logger.log("Erro em verificarRegistroEntregas: " + error.message);
    throw error;
  }
}

function verificarTratamentoRecusas() {
  try {
    try {
      var ss = getSS();
      var recusasSheet = ss.getSheetByName('Recusas');
      if (!recusasSheet || recusasSheet.getLastRow() <= 1) return true; // Sem recusas = conforme

      var data = recusasSheet.getDataRange().getValues();
      var headers = data[0];
      var statusIdx = headers.indexOf('Status');

      // Verificar se há recusas pendentes há muito tempo
      var pendentesAntigos = 0;
      for (var i = 1; i < data.length; i++) {
        if (data[i][statusIdx] == 'Aguardando Providências') {
          pendentesAntigos++;
        }
      }

    } catch (error) {
      Logger.log("Erro em verificarTratamentoRecusas: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em verificarTratamentoRecusas: " + error.message);
    throw error;
  }
}

function verificarGlosasJustificadas() {
  try {
    try {
      var ss = getSS();
      var glosasSheet = ss.getSheetByName('Glosas');
      if (!glosasSheet || glosasSheet.getLastRow() <= 1) return true;

      var data = glosasSheet.getDataRange().getValues();
      var headers = data[0];
      var motivoIdx = headers.indexOf('Motivo');

      var semJustificativa = 0;
      for (var i = 1; i < data.length; i++) {
        if (!data[i][motivoIdx] || data[i][motivoIdx] == '') {
          semJustificativa++;
        }
      }

    } catch (error) {
      Logger.log("Erro em verificarGlosasJustificadas: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em verificarGlosasJustificadas: " + error.message);
    throw error;
  }
}

// Função para detectar preços antieconômicos - OTIMIZADO
function detectarPrecosAntieconomicos() {
  try {
    try {
      try {
        var startTime = new Date().getTime();
        var ui = getSafeUi();
        var ss = getSS();

        // Usar apenas planilha atual para evitar timeout
        var dados = coletarDadosPlanilhasDrive({currentOnly : true});
        var precosPorProduto = {};

        // Coletar preços por produto (com limite)
        var sheetsProcessed = 0;
        var maxSheets = 5;

        for (var s = 0; s < Math.min(dados.length, maxSheets); s++) {
          var sheetRec = dados[s];
          sheetsProcessed++;

          // Verificar timeout
          if (!hasExecutionTimeRemaining(startTime, 30000)) {
            Logger.log('detectarPrecosAntieconomicos : timeout iminente após ' + sheetsProcessed + ' abas');
            break;
          }
          var headers = sheetRec.headers;
          var produtoIdx = _findHeaderIndex(headers, ['produto', 'item', 'genero']);
          var precoIdx = _findHeaderIndex(headers, ['preco', 'preço', 'preco_unitario', 'valor']);
          var fornecedorIdx = _findHeaderIndex(headers, ['fornecedor', 'supplier']);
          var dataIdx = _findHeaderIndex(headers, ['data', 'date']);

          // Processar no máximo 500 linhas por aba
          var maxRows = Math.min(sheetRec.rows.length, 500);
          for (var r = 0; r < maxRows; r++) {
            var row = sheetRec.rows[r];
            var produto;
            if (produtoIdx >= 0) {
              produto = String(row[produtoIdx]).trim();
            } else {
              produto = '';
            }
            var preco;
            if (precoIdx >= 0) {
              preco = Number(row[precoIdx]);
            } else {
              preco = NaN;
            }
            var fornecedor;
            if (fornecedorIdx >= 0) {
              fornecedor = String(row[fornecedorIdx]).trim();
            } else {
              fornecedor = '';
            }
            var data;
            if (dataIdx >= 0) {
              data = row[dataIdx];
            } else {
              data = null;
            }

            if (produto && !isNaN(preco) && isFinite(preco) && preco > 0) {
              if (!precosPorProduto[produto]) {
                precosPorProduto[produto] = [];
              }
              precosPorProduto[produto].push({
                preco : preco,
                fornecedor : fornecedor,
                data : data,
                fonte : sheetRec.fileName
              });
            }
          }
        }

        // Analisar preços antieconômicos (limitar produtos)
        var problemasPrecos = [];
        var produtosAnalisados = 0;
        var maxProdutos = 200; // Limitar análise;

        for (var produto in precosPorProduto) {
          // Limitar número de produtos analisados
          if (produtosAnalisados >= maxProdutos) {
            Logger.log('Limite de ' + maxProdutos + ' produtos atingido');
            break;
          }

          var precos = precosPorProduto[produto];
          if (precos.length < 2) continue;

          produtosAnalisados++;

          // Calcular estatísticas
          var valores = precos.map(function(p) { return p.preco; });
          valores.sort(function(a, b) { return a - b; });

          var n = valores.length;
          var media = valores.reduce(function(a, b) { return a + b; }, 0) / n;
          var mediana;
          if (n % 2 == 1) {
            mediana = valores[(n - 1) / 2];
          } else {
            mediana = (valores[n / 2 - 1] + valores[n / 2]) / 2;
          }
          var desvioPadrao = Math.sqrt(
            valores.reduce(function(a, b) { return a + Math.pow(b - media, 2); }, 0) / (n - 1)
          );

          // Identificar outliers (preços > média + 2*desvio ou > 1.5x mediana)
          precos.forEach(function(p) {
            var limiteDesvio = media + 2 * desvioPadrao;
            var limiteMediana = mediana * 1.5;

            if (p.preco > limiteDesvio || p.preco > limiteMediana) {
              var percentualAcima = ((p.preco / mediana) - 1) * 100;
              problemasPrecos.push({
                produto : produto,
                preco : p.preco,
                fornecedor : p.fornecedor,
                media : media,
                mediana : mediana,
                percentualAcima : percentualAcima,
                fonte : p.fonte
              });
            }
          });
        }

        // Criar relatório
        var resultSheet = ss.getSheetByName('Precos_Antieconomicos') || ss.insertSheet('Precos_Antieconomicos');
        resultSheet.clear();

        var output = [
          ['DETECÇÃO DE PREÇOS ANTIECONÔMICOS'],
          ['Data : ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy')],
          [''],
          ['Conforme auditoria do TCDF (Processo 8920/2015), foram detectados indícios de preços'],
          ['antieconômicos em contratos de fornecimento. Esta análise identifica preços significativamente'],
          ['acima da média ou mediana praticada.'],
          [''],
          ['PRODUTOS COM POSSÍVEIS PREÇOS ANTIECONÔMICOS : '],
          ['Produto', 'Fornecedor', 'Preço Praticado', 'Preço Médio', 'Preço Mediana', '% Acima Mediana', 'Fonte']
        ];

        problemasPrecos.sort(function(a, b) {});

        problemasPrecos.forEach(function(p) {
          output.push([
            p.produto,
            p.fornecedor,
            'R$ ' + p.preco.toFixed(2),
            'R$ ' + p.media.toFixed(2),
            'R$ ' + p.mediana.toFixed(2),
            p.percentualAcima.toFixed(1) + '%',
            p.fonte
          ]);
        });

        if (problemasPrecos.length == 0) {
          output.push(['Nenhum preço antieconômico detectado com os critérios atuais']);
        }

        output.push(['']);
        output.push(['CRITÉRIOS DE DETECÇÃO : ']);
        output.push(['- Preço > Média + 2 Desvios Padrão']);
        output.push(['- Preço > 1,5x Mediana']);
        output.push(['']);
        output.push(['OBSERVAÇÃO : Esta análise é indicativa. Recomenda-se análise detalhada dos casos identificados.']);

        resultSheet.getRange(1, 1, output.length, 7).setValues(output);
        resultSheet.getRange(1, 1).setFontWeight('bold').setFontSize(14);
        resultSheet.getRange(9, 1, 1, 7).setFontWeight('bold').setBackground('#FF5722').setFontColor('#FFFFFF');

        // Destacar casos graves (>50% acima)
        for (var i = 10; i <= 9 + problemasPrecos.length; i++) {
          var percentual = resultSheet.getRange(i, 6).getValue();
          if (percentual && parseFloat(percentual) > 50) {
            resultSheet.getRange(i, 1, 1, 7).setBackground('#FFCDD2');
          }
        }

        ss.setActiveSheet(resultSheet);
        safeAlert('Análise concluída',
          'Possíveis preços antieconômicos detectados : ' + problemasPrecos.length + '\n\n' +
          'Veja os detalhes na aba criada.',
          ui.ButtonSet.OK);
      } catch (error) {
        Logger.log("Erro em detectarPrecosAntieconomicos: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em detectarPrecosAntieconomicos: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em detectarPrecosAntieconomicos: " + error.message);
    throw error;
  }
}

/* --- Novas rotinas de auditoria (inspiradas no Auditoria.txt) --- */

/**
 * Helper : encontra índice de header por lista de nomes possíveis (case-insensitive)
 */
function _indexOfHeader(headers, candidates) {
  try {
    if (!headers || !headers.length) return -1;
    candidates = candidates || [];
    for (var i = 0; i < headers.length; i++) {
      var h = String(headers[i] || '').toLowerCase();
      for (var j = 0; j < candidates.length; j++) {
        if (h == String(candidates[j] || '').toLowerCase()) return i;
        if (h.indexOf(String(candidates[j] || '').toLowerCase()) >= 0) return i;
      }
    }
  } catch (error) {
    Logger.log("Erro em _indexOfHeader: " + error.message);
    throw error;
  }
}

/**
 * Checa PDGP(s) vs entregas e gera aba com divergências por produto/unidade.
 */
function checarPDGPs() {
  try {
    var startTime = new Date().getTime();
    var ss = getSS();
    var ui = getSafeUi();
    var pdgpSheet = ss.getSheetByName('PDGP') || ss.getSheetByName('PDGA') || ss.getSheetByName('PDGPs');
    if (!pdgpSheet) {
      ui.alert('Checagem PDGP', 'Nenhuma aba "PDGP"/"PDGA" encontrada. Crie a aba com o planejamento para ativar esta checagem.', ui.ButtonSet.OK);
      return;
    }
    var entregas = ss.getSheetByName('Entregas');
    if (!entregas) {
      ui.alert('Checagem PDGP', 'Aba "Entregas" não encontrada. Esta checagem requer a planilha de entregas.', ui.ButtonSet.OK);
      return;
    }

    // Limitar linhas processadas
    var pdgpData = getSheetDataSafe(pdgpSheet, 500);
    if (!pdgpData || pdgpData.length == 0) {
      safeAlert('Checagem PDGP', 'Aba PDGP está vazia.', ui.ButtonSet.OK);
      return;
    }
    var pdgpHeaders = pdgpData[0] || [];
    var pdProdutoIdx = _indexOfHeader(pdgpHeaders, ['produto','genero','item','descricao']);
    var pdUnidadeIdx = _indexOfHeader(pdgpHeaders, ['unidade','escola','local']);
    var pdQtdIdx = _indexOfHeader(pdgpHeaders, ['quantidade','qtd','kg','qtde']);

    // Limitar linhas processadas
    var entData = getSheetDataSafe(entregas, 500);
    if (!entData || entData.length == 0) {
      safeAlert('Checagem PDGP', 'Aba Entregas está vazia.', ui.ButtonSet.OK);
      return;
    }
    var entHeaders = entData[0] || [];
    var eProdutoIdx = _indexOfHeader(entHeaders, ['produto','genero','item','descricao']);
    var eUnidadeIdx = _indexOfHeader(entHeaders, ['unidade','escola','local']);
    var eQtdIdx = _indexOfHeader(entHeaders, ['quantidade','qtd','kg','qtde']);

    var mapaPDGP = {};
    for (var i = 1; i < pdgpData.length; i++) {
      var row = pdgpData[i];
      var key;
      var key = '';
      if (pdUnidadeIdx >= 0) {
        key += String(row[pdUnidadeIdx] || '');
      }
      key += '||';
      if (pdProdutoIdx >= 0) {
        key += String(row[pdProdutoIdx] || '');
      }
      key = key.trim().toLowerCase();
      var qtd;
      if (pdQtdIdx>=0) {
        qtd = Number(row[pdQtdIdx]);
      } else {
        qtd = NaN;
      }
      if (!isFinite(qtd)) qtd = 0;
      mapaPDGP[key] = (mapaPDGP[key]||0) + qtd;
    }

    var mapaEnt = {};
    for (var j = 1; j < entData.length; j++) {
      var r = entData[j];
      var key2;
      var key2 = '';
      if (eUnidadeIdx >= 0) {
        key2 += String(r[eUnidadeIdx] || '');
      }
      key2 += '||';
      if (eProdutoIdx >= 0) {
        key2 += String(r[eProdutoIdx] || '');
      }
      key2 = key2.trim().toLowerCase();
      var qtd2;
      if (eQtdIdx>=0) {
        qtd2 = Number(r[eQtdIdx]);
      } else {
        qtd2 = NaN;
      }
      if (!isFinite(qtd2)) qtd2 = 0;
      mapaEnt[key2] = (mapaEnt[key2]||0) + qtd2;
    }

    // CORREÇÃO : Criar relatório no Drive ao invés de aba na planilha
    var reportData = [];
    var headers = ['Unidade','Produto','PDGP_Qtd','Entregue_Qtd','Diferenca'];

    // Coletar dados primeiro
    var tempData = [];

    var rowOut = 2;
    var keys = Object.keys(mapaPDGP);
    // union keys from both maps
    var allKeys = {};
    Object.keys(mapaPDGP).forEach(function(k){ allKeys[k]=true; });
    Object.keys(mapaEnt).forEach(function(k){ allKeys[k]=true; });

    Object.keys(allKeys).forEach(function(k){
      var pd = mapaPDGP[k]||0;
      var en = mapaEnt[k]||0;
      var diff = en - pd;
      if (Math.abs(diff) > 0.01) { // report non-zero differences
        var parts = k.split('||');
        tempData.push([parts[0]||'', parts[1]||'', pd, en, diff]);
      }
    });

    // CORREÇÃO : Criar relatório no Drive
    try {
      var report = createReportDocument('PDGP_Check', tempData, headers);
      ui.alert('Checagem PDGP',
        'Relatório criado no Drive : ' + report.name + '\n\n' +
        'Acesse em : ' + report.url + '\n\n' +
        'Total de diferenças encontradas : ' + tempData.length,
        ui.ButtonSet.OK);
    } catch (e) {
      Logger.log('Erro ao criar relatório PDGP no Drive : ' + e.message);
      ui.alert('Erro', 'Erro ao gerar relatório : ' + e.message, ui.ButtonSet.OK);
    }
  } catch (error) {
    Logger.log("Erro em checarPDGPs: " + error.message);
    throw error;
  }
}

/**
 * Identifica Notas Fiscais sem atesto/comprovante de recebimento.
 * Procura colunas com possíveis nomes e gera aba com itens faltantes.
 */
function checarAtestosRecebimentos() {
  try {
    var startTime = new Date().getTime();
    var ss = getSS();
    var ui = getSafeUi();
    var nf = ss.getSheetByName('Notas_Fiscais');
    if (!nf) { ui.alert('Notas_Fiscais não encontrada.'); return; }

    // Limitar linhas processadas
    var data = getSheetDataSafe(nf, 500);
    if (!data || data.length == 0) {
      ui.alert('Notas_Fiscais está vazia.');
      return;
    }
    var headers = data[0] || [];
    var nfIdx = _indexOfHeader(headers, ['nota fiscal','nf','numero','número']);
    var fornecedorIdx = _indexOfHeader(headers, ['fornecedor','supplier']);
    var atestoIdx = _indexOfHeader(headers, ['atesto','atestou','atestado','atestado_comissao','atestado_comissão','recebido']);

    // CORREÇÃO : Coletar dados para relatório no Drive
    var reportData = [];
    var reportHeaders = ['Linha','NotaFiscal','Fornecedor','AtestoCampoEncontrado'];

    for (var i = 1;i<data.length;i++) {
      var r = data[i];
      var nfval;
      if (nfIdx>=0) {
        nfval = r[nfIdx];
      } else {
        nfval = '';
      }
      var fornv;
      if (fornecedorIdx>=0) {
        fornv = r[fornecedorIdx];
      } else {
        fornv = '';
      }
      var atv;
      if (atestoIdx>=0) {
        atv = r[atestoIdx];
      } else {
        atv = '';
      }
      if (atestoIdx < 0) {
        // nenhum campo de atesto identificado : marcar todos como sem atesto
        reportData.push([i+1,nfval,fornv,'Campo de atesto não identificado']);
      } else {
        var s = String(atv||'').trim();
        if (!s) {
          reportData.push([i+1,nfval,fornv,'Vazio/Não atestado']);
        }
      }
    }

    // CORREÇÃO : Criar relatório no Drive
    try {
      var report = createReportDocument('Atestos_Missing', reportData, reportHeaders);
      ui.alert('Checagem de Atestos',
        'Relatório criado no Drive : ' + report.name + '\n\n' +
        'Acesse em : ' + report.url + '\n\n' +
        'Total de atestos faltantes : ' + reportData.length,
        ui.ButtonSet.OK);
    } catch (e) {
      Logger.log('Erro ao criar relatório de atestos no Drive : ' + e.message);
      ui.alert('Erro', 'Erro ao gerar relatório : ' + e.message, ui.ButtonSet.OK);
    }
  } catch (error) {
    Logger.log("Erro em checarAtestosRecebimentos: " + error.message);
    throw error;
  }
}

/**
 * Relatório de substituições / glosas / recusas pendentes.
 * Procura pela aba "Substituicoes" ou "Recolhimento" ou usa "Glosas"/"Recusas".
 * Lista itens com status pendente e idade em dias.
 */
function relatorioSubstituicoesPendentes(daysThreshold) {
  try {
    var startTime = new Date().getTime();
    daysThreshold = Number(daysThreshold || 30);
    var ss = getSS();
    var ui = getSafeUi();

    var candidates = ['Substituicoes','Substituições','Recolhimento_Substituicao','Recolhimento','Glosas','Recusas'];
    var sheet = null;
    for (var i = 0;i<candidates.length;i++) { if (ss.getSheetByName(candidates[i])) { sheet = ss.getSheetByName(candidates[i]); break; } }
    if (!sheet) {
      ui.alert('Nenhuma aba de Substituições/Glosas/Recusas encontrada. Crie aba "Substituicoes" ou "Glosas" ou "Recusas".');
      return;
    }

    // Limitar linhas processadas
    var data = getSheetDataSafe(sheet, 500);
    if (!data || data.length == 0) {
      safeAlert('Aba está vazia.');
      return;
    }
    var headers = data[0] || [];
    var statusIdx = _indexOfHeader(headers, ['status','situacao','sítuação','situação','estado']);
    var dataIdx = _indexOfHeader(headers, ['data','data notificacao','data_notificacao','data de notificação','data_notificação','data_oficio']);
    var notaIdx = _indexOfHeader(headers, ['nf','nota','nota fiscal']);
    var fornecedorIdx = _indexOfHeader(headers, ['fornecedor','supplier','empresa']);

    // CORREÇÃO : Coletar dados para relatório no Drive
    var reportData = [];
    var reportHeaders = ['Linha','Nota/Ref','Fornecedor','Status','Dias Atraso','Data Registro'];
    var now = new Date();

    for (var r = 1;r<data.length;r++) {
      var row = data[r];
      var status;
      if (statusIdx>=0) {
        status = String(row[statusIdx]||'').trim();
      } else {
        status = '';
      }
      var d;
      if (dataIdx>=0) {
        d = row[dataIdx];
      } else {
        d = null;
      }
      var ref;
      if (notaIdx>=0) {
        ref = row[notaIdx];
      } else {
        ref = '';
      }
      var forn;
      if (fornecedorIdx>=0) {
        forn = row[fornecedorIdx];
      } else {
        forn = '';
      }
      var age = '';
      if (d) {
        var dObj = new Date(d);
        if (!isNaN(dObj.getTime())) {
          var diff = Math.floor((now - dObj)/(1000*60*60*24));
          age = diff;
        }
      }
      var pendente = (!status || /pendente|aguardando|em aberto|a aguardar/i.test(status));
      if (pendente || (age != '' && age > daysThreshold)) {
        reportData.push([r+1,ref||'',forn||'',status||'SEM_STATUS',age||'', d || '']);
      }
    }

    // CORREÇÃO : Criar relatório no Drive
    try {
      var report = createReportDocument('Substituicoes_Pendentes', reportData, reportHeaders);
      ui.alert('Substituições Pendentes',
        'Relatório criado no Drive : ' + report.name + '\n\n' +
        'Acesse em : ' + report.url + '\n\n' +
        'Total de substituições pendentes : ' + reportData.length,
        ui.ButtonSet.OK);
    } catch (e) {
      Logger.log('Erro ao criar relatório de substituições no Drive : ' + e.message);
      ui.alert('Erro', 'Erro ao gerar relatório : ' + e.message, ui.ButtonSet.OK);
    }


  /**
   * Gera resumo de auditoria executando checks principais e criando aba consolidadora.
   */
  function gerarAuditoriaResumo() {
    var ss = getSS();
    var ui = getSafeUi();
    var created = [];

    try {
      checarPDGPs(); // gera aba PDGP_Check_/* spread */
      created.push('PDGP checks');
    } catch(e) { /* silent */ }

    try {
      checarAtestosRecebimentos();
      created.push('Atestos checks');
    } catch(e) { /* silent */ }

    try {
      relatorioSubstituicoesPendentes(30);
      created.push('Substituições pendentes');
    } catch(e) { /* silent */ }

    // CORREÇÃO : Criar documento de resumo no Drive
    var resumoData = [
      ['Auditoria resumo gerada em : ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH,mm')],
      [''],
      ['Relatórios criados : '],
      [created.join(' | ')],
      [''],
      ['Observação : Analises geradas automaticamente; recomenda-se revisão documental detalhada conforme Auditoria.txt']
    ];

    // CORREÇÃO : Criar documento de resumo no Drive
    try {
      var report = createReportDocument('Auditoria_Resumo', resumoData, ['Resumo de Auditoria']);
      ui.alert('Auditoria Resumida',
        'Resumo criado no Drive : ' + report.name + '\n\n' +
        'Acesse em : ' + report.url + '\n\n' +
        'Relatórios executados : ' + created.length,
        ui.ButtonSet.OK);
    } catch (e) {
      Logger.log('Erro ao criar resumo de auditoria no Drive : ' + e.message);
      ui.alert('Erro', 'Erro ao gerar resumo : ' + e.message, ui.ButtonSet.OK);
    }
  }


  // ---- AnalysisDeterministic.gs ----
  // FUNÇÃO _findHeaderIndex REMOVIDA - USAR A VERSÃO CENTRALIZADA EM Utils.gs
  // A função _findHeaderIndex agora está disponível globalmente através de Utils.gs

  function verificarIrregularidades() {
    var dados = coletarDadosPlanilhasDrive();
    var problemas = [];
    var idMap = {};
    var supplierPrices = {};
    var registros = [];
    dados.forEach(function(sheetRec) {
      var headers = sheetRec.headers;
      var idxFornecedor = _findHeaderIndex(headers, ['fornecedor','supplier','provedor']);
      var idxQuantidade = _findHeaderIndex(headers, ['quantidade','qty','quant']);
      var idxPreco = _findHeaderIndex(headers, ['preco','preço','preco_unitario','preco unitario','price','valor']);
      var idxData = _findHeaderIndex(headers, ['data','date']);
      var idxId = _findHeaderIndex(headers, ['id','numero','número','pedido','invoice','nota']);
      sheetRec.rows.forEach(function(row, rIdx) {
        var rec = {
          fileName : sheetRec.fileName,
          sheetName : sheetRec.sheetName,
          rowIndex : rIdx+2,
          fornecedor : idxFornecedor>=0 ? String(row[idxFornecedor]).trim() : '',
          quantidade : idxQuantidade>=0 ? Number(row[idxQuantidade]) : NaN,
          preco : idxPreco>=0 ? Number(row[idxPreco]) : NaN,
          data : idxData>=0 ? row[idxData] : '',
          id : idxId>=0 ? String(row[idxId]).trim() : ''
        };
        registros.push(rec);
        if (rec.fornecedor && !isNaN(rec.preco) && isFinite(rec.preco)) {
          supplierPrices[rec.fornecedor] = supplierPrices[rec.fornecedor] || [];
          supplierPrices[rec.fornecedor].push(rec.preco);
        }
      });
    });
    var stats = {};
    for (var s in supplierPrices) {
      var arr = supplierPrices[s];
      var n = arr.length;
      var sum = arr.reduce(function(a,b){return a+b;},0);
      var mean = sum / n;
      var sq = arr.reduce(function(a,b){return a + Math.pow(b - mean,2);},0);
      var std;
      if (n>1) {
        std = Math.sqrt(sq/(n-1));
      } else {
        std = 0;
      }
      stats[s] = {count : n, mean,mean, std : std};
    }
    var duplicateIds = {};
    registros.forEach(function(rec) {
      if (!rec.fornecedor || isNaN(rec.quantidade) || isNaN(rec.preco) || !rec.data) {
        problemas.push({tipo : 'faltando_campos', rec,rec});
      }
      if (!isNaN(rec.quantidade) && rec.quantidade <= 0) {
        problemas.push({tipo : 'quantidade_invalida', rec,rec});
      }
      if (rec.id) {
        if (idMap[rec.id]) {
          duplicateIds[rec.id] = duplicateIds[rec.id] || [];
          duplicateIds[rec.id].push(rec);
        } else {
          idMap[rec.id] = rec;
        }
      }
      var s = rec.fornecedor;
      if (s && stats[s] && stats[s].count >= 3 && !isNaN(rec.preco) && isFinite(rec.preco)) {
        var mean = stats[s].mean;
        if (mean > 0 && Math.abs(rec.preco - mean) / mean > 0.3) {
          problemas.push({tipo : 'preco_anomalo', rec,rec, fornecedorStats : stats[s]});
        }
      }
    });
    for (var did in duplicateIds) {
      problemas.push({tipo : 'id_duplicado', id,did, registros : duplicateIds[did]});
    }
    var resumo = {
      total_registros : registros.length,
      total_problemas : problemas.length,
      problemas_por_tipo : {},
      amostras_fornecedor : Object.keys(stats).length
    };
    problemas.forEach(function(p){ resumo.problemas_por_tipo[p.tipo] = (resumo.problemas_por_tipo[p.tipo]||0)+1; });
    var output = {resumo : resumo, problemas, problemas, registros : registros, fornecedorStats : stats};
    safeAlert('Verificação concluída. Problemas encontrados : ' + resumo.total_problemas);
  }

  function identificarTendencias() {
    var dados = coletarDadosPlanilhasDrive();
    var monthlyBySupplier = {};
    dados.forEach(function(sheetRec) {
      var headers = sheetRec.headers;
      var idxFornecedor = _findHeaderIndex(headers, ['fornecedor','supplier','provedor']);
      var idxQuantidade = _findHeaderIndex(headers, ['quantidade','qty','quant']);
      var idxData = _findHeaderIndex(headers, ['data','date']);
      if (idxFornecedor < 0 || idxQuantidade < 0 || idxData < 0) return;
      sheetRec.rows.forEach(function(row) {
        var fornecedor = String(row[idxFornecedor]).trim();
        var quantidade = Number(row[idxQuantidade]) || 0;
        var rawDate = row[idxData];
        var d = new Date(rawDate);
        if (isNaN(d.getTime())) return;
        var month = Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM');
        monthlyBySupplier[fornecedor] = monthlyBySupplier[fornecedor] || {};
        monthlyBySupplier[fornecedor][month] = (monthlyBySupplier[fornecedor][month] || 0) + quantidade;
      });
    });
    var suppliers = Object.keys(monthlyBySupplier);
    var trends = [];
    suppliers.forEach(function(s) {
      var months = Object.keys(monthlyBySupplier[s]).sort();
      if (months.length < 4) return;
      var lastMonths = months.slice(-3);
      var prevMonths = months.slice(-6, -3);
      var sum = function(arr){ return arr.reduce(function(a,b){return a+b;},0); };
      var lastSum = sum(lastMonths.map(function(m){ return monthlyBySupplier[s][m] || 0; }));
      var prevSum = sum(prevMonths.map(function(m){ return monthlyBySupplier[s][m] || 0; }));
      var growth;
      if (prevSum > 0) {
        growth = (lastSum - prevSum) / prevSum;
      } else {
        growth = (lastSum > 0 ? 1 : 0);
      }
      trends.push({fornecedor : s, prevSum,prevSum, lastSum : lastSum, growth : growth});
    });
    trends.sort(function(a,b){ return b.growth - a.growth; });
    var result = {countSuppliers : suppliers.length, trends, trends, topIncreasing : trends.slice(0,5), topDecreasing : trends.slice(-5).reverse()};
    safeAlert('Identificação de tendências concluída. Fornecedores analisados : ' + result.countSuppliers);
  }


  // ---- AnalysisGenerative.gs ----
  function chamarGeminiAPI(prompt) {
    try {
      try {
        var apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY') || '';
        if (!apiKey) return 'Chave GEMINI_API_KEY não encontrada nas propriedades do script.';
        var url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=' + apiKey; // [reparo pre-push] endpoint reconstruido
        var payload = {
          "prompt" : {
            "text" : prompt
          },
          "temperature" : 0.7,
          "maxOutputTokens" : 800
        };
        var options = {
          'method' : 'post',
          'contentType' : 'application/json',
          'payload' : JSON.stringify(payload),
          'muteHttpExceptions' : true,
          'followRedirects' : true,
          'timeout' : 120000
        };
        var response = UrlFetchApp.fetch(url, options);
        var code = response.getResponseCode();
        var text = response.getContentText();
        if (code >= 200 && code < 300) {
          try {
            var parsed = JSON.parse(text);
            if (parsed && parsed.candidates && parsed.candidates[0] && parsed.candidates[0].content) {
              var parts = parsed.candidates[0].content.parts || [];
              return parts.map(function(p){ return p.text || ''; }).join('\n') || text;
            }
            return text;
          } catch (e) {
            // [reparo pre-push] handler reconstruido (conteudo original corrompido).
            return 'Erro ao interpretar resposta do Gemini : ' + e.message;
          }
        }
        return 'Gemini HTTP ' + code + ' : ' + text;
      } catch (e) {
        // [reparo pre-push] handler reconstruido (conteudo original corrompido).
        return 'Erro ao chamar Gemini : ' + e.message;
      }
    } catch (error) {
      Logger.log("Erro em chamarGeminiAPI: " + error.message);
      throw error;
    }
  }


  function analiseGenerativaGemini() {
    try {
      try {
        var ui = getSafeUi();
          if (!ui) {
            try {
              Logger.log("⚠️ UI não disponível");
              return;
            } catch (error) {
              Logger.log("Erro em analiseGenerativaGemini: " + error.message);
              throw error;
            }
          }
        var props = PropertiesService.getScriptProperties();
        var defaultPeriod = props.getProperty('PROCESS_PERIOD') || 'trimestre';
        var defaultMax = Number(props.getProperty('PROCESS_MAX_RECORDS') || 200);
        var groupsJson = props.getProperty('PRODUCT_GROUPS_JSON') || '{}';
        var productGroups = {};
        try { productGroups = JSON.parse(groupsJson); } catch (e) { productGroups = {}; }

        // Perguntar ao usuário se deseja usar restrições
        var resp = ui.alert('Análise Generativa (Gemini)',
          'Deseja aplicar restrições de processamento (reduz tempo de execução) ? \nPeríodo padrão : ' + defaultPeriod + '\nMáx registros : ' + defaultMax,
          ui.ButtonSet.YES_NO);
        var options = { period : defaultPeriod, maxRecords : defaultMax, groups : [] };
        if (resp == ui.Button.YES) {
          // permitir seleção simples de grupos
          var groupNames = Object.keys(productGroups);
          var groupPrompt = 'Informe os grupos separados por virgula ou deixe em branco para todos : \n' + groupNames.join(', '); // [reparo pre-push] inicio da string reconstruido
          var gResp = ui.prompt('Selecionar Grupos (opcional)', groupPrompt, ui.ButtonSet.OK_CANCEL);
          if (gResp.getSelectedButton() == ui.Button.OK) {
            var chosen = (gResp.getResponseText() || '').split(',').map(function(s){ return s.trim(); }).filter(Boolean);
            options.groups = chosen;
          }
        } else {
          // sem restrições => limitar por segurança
          options.maxRecords = Math.min(defaultMax, 500);
        }

        // Executar análises determinísticas com restrições
        var irregular = verificarIrregularidades({ period : options.period, maxRecords : options.maxRecords, groups : options.groups });
        var trends = identificarTendencias({ period : options.period, maxRecords : options.maxRecords, groups : options.groups });

        var resumoDeterministico = {
          resumo : irregular.resumo,
          top_trends : trends.topIncreasing,
          bottom_trends : trends.topDecreasing
        };

        var prompt = "Resumo deterministico das analises : \n" + JSON.stringify(resumoDeterministico) + "\nGere insights acionáveis e recomendações concisas (máx 300 tokens)."; // [reparo pre-push] inicio da string reconstruido

        // garantir prompt enxuto
        if (prompt.length > 8000) {
          prompt = prompt.substring(0, 7800);
        }

        var resposta = chamarGeminiAPI(prompt);
        var ss = getSS();
        var nomeAba = 'Analise_Generativa_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmmss');
        var sheet = ss.insertSheet(nomeAba);
        var lines = String(resposta).split('\n');
        for (var i = 0;i<lines.length;i++) {
          sheet.getRange(i+1,1).setValue(lines[i]);
        }

        ui.alert('Análise generativa realizada. Resultado salvo na aba : ' + nomeAba + '\nRegistros processados : ' + (irregular.resumo ? irregular.resumo.registros_processados : 'n/a'));
      } catch (error) {
        Logger.log("Erro em analiseGenerativaGemini: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em analiseGenerativaGemini: " + error.message);
      throw error;
    }
  }

  } catch (error) {
    Logger.log("Erro em relatorioSubstituicoesPendentes: " + error.message);
    throw error;
  }

}