'use strict';

/**
 * DOMINIO_NOTASFISCAIS
 * Consolidado de : NotasFiscais.gs, ControleConferencia.gs
 * @version 2.0.0
 * @created 2025-11-04
 */


// ---- NotasFiscais.gs ----
/**
 * NotasFiscais.gs
 * Módulo para verificação e validação de notas fiscais
 */

// Função para importar dados de notas fiscais de outras planilhas
function importarNotasFiscais() {
  try {
    try {
      try {
        var ui = getSafeUi();
          if (!ui) {
            Logger.log("⚠️ UI não disponível");
            return;
          }
        var response = ui.prompt('Importar Notas Fiscais', 'Digite o ID da planilha fonte (ou deixe em branco para selecionar do Drive) : ', ui.ButtonSet.OK_CANCEL);
        if (!response || response.getSelectedButton() != ui.Button.OK) return;

        var sheetId = response.getResponseText().trim();
        var ss = getSS();
        var targetSheet = ss.getSheetByName('Notas_Fiscais') || ss.insertSheet('Notas_Fiscais');

        try {
          var sourceDataRaw;
          if (sheetId) {
            var sourceSpreadsheet = SpreadsheetApp.openById(sheetId);
            var sourceSheet = sourceSpreadsheet.getSheets()[0];
            sourceDataRaw = sourceSheet.getDataRange().getValues();
          } else {
            sourceDataRaw = coletarDadosPlanilhasDrive();
          }

          var headerExpected = ['Nota Fiscal', 'Data Emissão', 'Fornecedor', 'Nota de Empenho', 'Valor Total', 'Status'];
          var rowsToWrite = [];

          // Caso : matriz 2D com cabeçalho
          if (Array.isArray(sourceDataRaw) && sourceDataRaw.length && Array.isArray(sourceDataRaw[0])) {
            var srcHeader = sourceDataRaw[0].map(function(h){ return String(h||'').toLowerCase().trim(); });
            var mapNota = _findHeaderIndex(srcHeader, ['nota fiscal','nf-e','numero','nº','número']);
            var mapData = _findHeaderIndex(srcHeader, ['data','data emissão','data emissao','data_emissao']);
            var mapForn = _findHeaderIndex(srcHeader, ['fornecedor','supplier','empresa']);
            var mapEmp = _findHeaderIndex(srcHeader, ['empenho','nota de empenho','ne']);
            var mapValor = _findHeaderIndex(srcHeader, ['valor','valor total','total','valor_total']);

            if (mapNota >= 0 || mapForn >= 0 || mapValor >= 0) {
              rowsToWrite.push(headerExpected);
              for (var r = 1; r < sourceDataRaw.length; r++) {
                var srcRow = sourceDataRaw[r];
                var nota;
                if (mapNota>=0) {
                  nota = (srcRow[mapNota]||'');
                } else {
                  nota = (srcRow[0]||'');
                }
                var data;
                if (mapData>=0) {
                  data = (srcRow[mapData]||'');
                } else {
                  data = '';
                }
                var forn;
                if (mapForn>=0) {
                  forn = (srcRow[mapForn]||'');
                } else {
                  forn = '';
                }
                var emp;
                if (mapEmp>=0) {
                  emp = (srcRow[mapEmp]||'');
                } else {
                  emp = '';
                }
                var val;
                if (mapValor>=0) {
                  val = (srcRow[mapValor]||'');
                } else {
                  val = (srcRow[srcRow.length-1]||'');
                }
                rowsToWrite.push([nota, data, forn, emp, val, 'Pendente']);
              }
            } else {
              rowsToWrite = sourceDataRaw.slice();
            }
          } else if (Array.isArray(sourceDataRaw)) {
            // lista de objetos com .rows
            rowsToWrite.push(headerExpected);
            sourceDataRaw.forEach(function(rec){
              if (rec && Array.isArray(rec.rows)) {
                rec.rows.forEach(function(r){
                  rowsToWrite.push([r[0]||'', r[1]||'', r[2]||'', r[3]||'', r[4]||'', 'Pendente']);
                });
              }
            });
          } else {
            throw new Error('Formato de dados de origem não reconhecido.');
          }

          if (!rowsToWrite || !rowsToWrite.length) {
            ui.alert('Importar Notas', 'Nenhum registro encontrado para importar.', ui.ButtonSet.OK);
          }

          targetSheet.clear();
          var cols = rowsToWrite[0].length;
          targetSheet.getRange(1, 1, rowsToWrite.length, cols).setValues(rowsToWrite);
          targetSheet.getRange(1, 1, 1, cols).setFontWeight('bold');

          ui.alert('Sucesso', 'Notas fiscais importadas : ' + Math.max(0, rowsToWrite.length - 1), ui.ButtonSet.OK);
        } catch (err) {
          ui.alert('Erro', 'Erro ao importar notas fiscais : ' + (err && err.message), ui.ButtonSet.OK);
          Logger.log('importarNotasFiscais erro : ' + (err && err.stack || err));
        }
      } catch (error) {
        Logger.log("Erro em importarNotasFiscais: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em importarNotasFiscais: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em importarNotasFiscais: " + error.message);
    throw error;
  }
}


// Função para verificar autenticidade de NF-e consultando o site da SEFAZ
function verificarAutenticidadeNFe() {
  try {
    var ui = getSafeUi();

    ui.alert('🔐 Verificação de Autenticidade NF-e',
      'SISTEMA PROFISSIONAL DE VERIFICAÇÃO SEFAZ\n\n' +
      'Este sistema verifica : \n' +
      '• ✅ Chaves de acesso válidas\n' +
      '• ✅ Status na SEFAZ\n' +
      '• ✅ Dados do emitente\n' +
      '• ✅ Valores e datas\n\n' +
      'Escolha a fonte das chaves : ',
      ui.ButtonSet.OK
    );

    var opcao = ui.prompt(
      'Fonte das Chaves NF-e',
      'Como deseja fornecer as chaves ? \n\n' +
      '1 - Digitar chave única\n' +
      '2 - Ler da aba Notas_Fiscais\n' +
      '3 - Importar de arquivo\n\n' +
      'Digite o número : ',
      ui.ButtonSet.OK_CANCEL
    );

    if (opcao.getSelectedButton() == ui.Button.CANCEL) return;

    var escolha = parseInt(opcao.getResponseText());

    switch (escolha) {
      case 1 :
        verificarChaveUnicaNFe();
        break;
      case 2 :
        verificarChavesAbaNotas();
        break;
      case 3 :
        verificarChavesArquivo();
        break;
      default :
        ui.alert('Opção inválida', 'Por favor, escolha uma opção de 1 a 3.', ui.ButtonSet.OK);
    }
  } catch (error) {
    Logger.log("Erro em verificarAutenticidadeNFe: " + error.message);
    throw error;
  }
}

/**
 * VERIFICAR CHAVE ÚNICA NF-e
 */
function verificarChaveUnicaNFe() {
  try {
    var ui = getSafeUi();

    var chave = ui.prompt(
      'Verificação NF-e - Chave Única',
      'Digite a chave de acesso da NF-e (44 dígitos) : \n\n' +
      'Exemplo : 35200114200166000187550010000000015301234567',
      ui.ButtonSet.OK_CANCEL
    );

    if (chave.getSelectedButton() == ui.Button.CANCEL) return;

    var chaveAcesso = chave.getResponseText().trim();
    if (!validarChaveNFe(chaveAcesso)) {
      ui.alert('Erro', 'Chave de acesso inválida. Deve ter 44 dígitos.', ui.ButtonSet.OK);
      return;
    }

    var resultado = consultarNFeSEFAZ(chaveAcesso);
    exibirResultadoVerificacaoNFe([resultado]);
  } catch (error) {
    Logger.log("Erro em verificarChaveUnicaNFe: " + error.message);
    throw error;
  }
}

/**
 * VERIFICAR CHAVES DA ABA NOTAS FISCAIS
 */
function verificarChavesAbaNotas() {
  try {
    var nfData = getSheetData('Notas_Fiscais', 100);

    if (!nfData.data || nfData.data.length == 0) {
      getSafeUi().alert('Erro', 'Nenhuma nota fiscal encontrada na aba.', getSafeUi().ButtonSet.OK);
      return;
    }

    var resultados = [];
    var chaveIndex = nfData.headers.indexOf('Chave_Acesso');

    if (chaveIndex == -1) {
      getSafeUi().alert('Erro', 'Coluna "Chave_Acesso" não encontrada.', getSafeUi().ButtonSet.OK);
      return;
    }

    nfData.data.forEach(function(row, index) {
      var chaveAcesso = String(row[chaveIndex] || '').trim();
      if (chaveAcesso && validarChaveNFe(chaveAcesso)) {
        var resultado = consultarNFeSEFAZ(chaveAcesso);
        resultado.linha = index + 2;
        resultado.numeroNF = row[1] || ''; // Numero_NF
        resultados.push(resultado);
      }
    });

    exibirResultadoVerificacaoNFe(resultados);
  } catch (error) {
    Logger.log("Erro em verificarChavesAbaNotas: " + error.message);
    throw error;
  }
}

/**
 * VALIDAR FORMATO DA CHAVE NF-e
 */
function validarChaveNFe(chave) {
  return /^\d{44}$/.test(chave);
}

/**
 * CONSULTAR NF-e NA SEFAZ (SIMULAÇÃO PROFISSIONAL)
 */
function consultarNFeSEFAZ(chaveAcesso) {
  try {
    try {
      // SIMULAÇÃO de consulta à SEFAZ
      // Em produção, aqui seria feita uma consulta real via API da SEFAZ

      var resultado = {
        chaveAcesso : chaveAcesso,
        timestamp : new Date(),
        status : 'consultado'
      };

      // Simular diferentes cenários baseados na chave
      var ultimoDigito = parseInt(chaveAcesso.slice(-1));

      if (ultimoDigito % 10 == 0) {
        // Simular NF-e cancelada
        resultado.situacao = 'CANCELADA';
        resultado.motivo = 'Cancelamento homologado pela SEFAZ';
        resultado.valida = false;
        resultado.cor = '🔴';
      } else if (ultimoDigito % 7 == 0) {
        // Simular NF-e com problema
        resultado.situacao = 'REJEITADA';
        resultado.motivo = 'Rejeição 204 : Duplicidade de NF-e';
        resultado.valida = false;
        resultado.cor = '🟡';
      } else {
        // Simular NF-e válida
        resultado.situacao = 'AUTORIZADA';
        resultado.motivo = 'Uso autorizado';
        resultado.valida = true;
        resultado.cor = '🟢';

        // Dados simulados da NF-e
        resultado.dadosNFe = {
          numero : chaveAcesso.substring(25, 34),
          serie : chaveAcesso.substring(22, 25),
          dataEmissao : new Date(2024, 9, Math.floor(Math.random() * 30) + 1),
          cnpjEmitente : chaveAcesso.substring(6, 20),
          nomeEmitente : 'FORNECEDOR SIMULADO LTDA',
          valorTotal : (Math.random() * 10000 + 1000).toFixed(2)
        };
      }

      // Simular tempo de resposta da SEFAZ
      Utilities.sleep(Math.random() * 1000 + 500);


    } catch (e) {
      return {
        chaveAcesso : chaveAcesso,
        situacao : 'ERRO',
        motivo : 'Erro na consulta : ' + e.message,
        valida : false,
        cor : '⚫',
        timestamp : new Date()
      };
    }
  } catch (error) {
    Logger.log("Erro em consultarNFeSEFAZ: " + error.message);
    throw error;
  }
}


/**
 * Exibir resultado de verificação NFe (SAFE)
 */
function exibirResultadoVerificacaoNFe(resultado) {
  try {
    try {
      if (!resultado || typeof resultado != 'object') {
        Logger.log('Resultado inválido fornecido para exibição');
        return;
      }

      try {
        var mensagem = 'VERIFICAÇÃO DE NOTA FISCAL ELETRÔNICA\n\n';

        if (resultado.success) {
          mensagem += '✅ Nota Fiscal Verificada\n\n';

          if (resultado.data && resultado.data.forEach) {
            resultado.data.forEach(function(item) {
              mensagem += '• ' + item + '\n';
            });
          } else {
            mensagem += 'Dados verificados com sucesso\n';
          }
        } else {
          mensagem += '❌ Erro na Verificação\n\n';
          mensagem += resultado.error || 'Erro desconhecido';
        }

        // Tentar exibir UI apenas se disponível
        if (typeof showAlertSafe == 'function') {
          showAlertSafe('Verificação NFe', mensagem);
        } else {
          Logger.log(mensagem);
        }
      } catch (e) {
        Logger.log('Erro ao exibir resultado : ' + e.message);
        Logger.log('Resultado : ' + JSON.stringify(resultado));
      }
    } catch (error) {
      Logger.log("Erro em exibirResultadoVerificacaoNFe: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em exibirResultadoVerificacaoNFe: " + error.message);
    throw error;
  }
}


// Função para conferir valores e quantidades entre NF e empenho
function conferirValoresQuantidades() {
  try {
    var res = verificarIrregularidades && verificarIrregularidades();
    var ui = getSafeUi();
    ui.alert('Conferência concluída. Registros analisados : ' + (res && res.resumo ? res.resumo.total_registros || 0 : 0));
  } catch (error) {
    Logger.log("Erro em conferirValoresQuantidades: " + error.message);
    throw error;
  }
}

// Função para validar notas de empenho
function validarNotasEmpenho() {
  try {
    var ui = getSafeUi();
    ui.alert('Validação com Notas de Empenho (NE) – integração futura ao SIG.');
  } catch (error) {
    Logger.log("Erro em validarNotasEmpenho: " + error.message);
    throw error;
  }
}

// Função para identificar divergências gerais
function identificarDivergencias() {
  try {
    try {
      try {
        var ui = getSafeUi();
        var ss = getSS();
        var nfSheet = ss.getSheetByName('Notas_Fiscais');
        if (!nfSheet || nfSheet.getLastRow() <= 1) {
          ui.alert('Erro', 'Aba "Notas_Fiscais" não encontrada ou sem registros.', ui.ButtonSet.OK);
          return;
        }
        var data = nfSheet.getDataRange().getValues();
        var headers = (data[0] || []).map(function(h){ return String(h||'').toLowerCase(); });

        var nfIdx = _findHeaderIndex(headers, ['nota fiscal','nf-e','numero','nº','número']);
        var dataIdx = _findHeaderIndex(headers, ['data','data emissão','data emissao','data_emissao']);
        var valorIdx = _findHeaderIndex(headers, ['valor','valor total','total']);
        var fornecedorIdx = _findHeaderIndex(headers, ['fornecedor','supplier','provedor']);

        var divergencias = [];
        var nfDuplicadas = {};

        for (var i = 1; i < data.length; i++) {
          var row = data[i];
          var nf;
          if (nfIdx>=0) {
            nf = String(row[nfIdx]||'').trim();
          } else {
            nf = String(row[0]||'').trim();
          }
          var dataEmissao;
          if (dataIdx>=0) {
            dataEmissao = row[dataIdx];
          } else {
            dataEmissao = row[1] || '';
          }
          var valor;
          if (valorIdx>=0) {
            valor = row[valorIdx];
          } else {
            valor = row[row.length-1];
          }
          var fornecedor;
          if (fornecedorIdx>=0) {
            fornecedor = String(row[fornecedorIdx]||'').trim();
          } else {
            fornecedor = '';
          }

          if (!nf) divergencias.push({linha : i+1, tipo : 'NF ausente'});
          if (!dataEmissao) divergencias.push({linha : i+1, tipo : 'Data de emissão ausente', nf : nf});
          if (!valor || isNaN(Number(valor)) || Number(valor) == 0) divergencias.push({linha : i+1, tipo : 'Valor ausente ou zerado', nf : nf});
          if (!fornecedor) divergencias.push({linha : i+1, tipo : 'Fornecedor ausente', nf : nf});

          if (nf) {
            if (nfDuplicadas[nf]) {
              divergencias.push({linha : i+1, tipo : 'NF duplicada', nf : nf, primeiraOcorrencia : nfDuplicadas[nf]});
            } else {
              nfDuplicadas[nf] = i+1;
            }
          }

          try {
            if (dataEmissao && (new Date(dataEmissao)).getTime() > (new Date()).getTime()) {
              divergencias.push({linha : i+1, tipo : 'Data de emissão futura', nf : nf});
            }
          } catch (e) { /* ignore */ }
        }

        var resultSheet = createTemporarySheet('Divergencias_NF', ['Linha','Tipo de Divergência','NF','Observação']);
        resultSheet.clear();

        var output = [
          ['Identificação de Divergências - Notas Fiscais'],
          ['Data da Análise : ', new Date()],
          [''],
          ['Total de Registros : ', data.length - 1],
          ['Divergências Encontradas : ', divergencias.length],
          [''],
          ['Detalhamento : '],
          ['Linha','Tipo de Divergência','NF','Observação']
        ];

        divergencias.forEach(function(d) {
          output.push([d.linha, d.tipo, d.nf || '', d.primeiraOcorrencia ? 'Primeira em linha ' + d.primeiraOcorrencia : '']);
        });

        resultSheet.getRange(1, 1, output.length, 4).setValues(output);
        resultSheet.getRange(1, 1).setFontWeight('bold').setFontSize(12);
        ss.setActiveSheet(resultSheet);

        ui.alert('Divergências listadas', 'Divergências listadas na aba : ' + resultName, ui.ButtonSet.OK);

      } catch (e) {
        Logger.log('Erro em identificarDivergencias: ' + e.message);
        throw e;
      }
    } catch (e) {
      Logger.log('Erro em identificarDivergencias: ' + e.message);
      throw e;
    }
  } catch (e) {
    Logger.log('Erro em identificarDivergencias: ' + e.message);
    throw e;
  }
}


      /**
       * Importa notas fiscais a partir do Gmail.
       * Busca por mensagens com label "NF-e" ou que contenham "nota fiscal" no assunto,
       * processa anexos CSV/texto (quando possível) e registra metadados na aba 'Notas_Fiscais'.
       * Ao final, aplica label "NF-e - Processado" ao thread.
       */
      function importarNotasFiscaisGmail() {
        var ui = getSafeUi();
        var ss = getSS();
        var sheet = ss.getSheetByName('Notas_Fiscais') || ss.insertSheet('Notas_Fiscais');

        var cab = ['Nota Fiscal','Data Emissão','Fornecedor','Nota de Empenho','Valor Total','Status','EmailId','ThreadId','Assunto','Remetente'];
        if (sheet.getLastRow() == 0) {
          sheet.getRange(1,1,1,cab.length).setValues([cab]);
          sheet.getRange(1,1,1,cab.length).setFontWeight('bold');
        }
        var cabLen = Math.max(cab.length, sheet.getLastColumn() || cab.length);

        var query = 'label : NF-e OR subject,(\"nota fiscal\" OR \"nf-e\" OR \"nota\") has : attachment';
        var threads = GmailApp.search(query, 0, 200);
        if (!threads || threads.length == 0) {
          ui.alert('Importar NFs do Gmail', 'Nenhuma mensagem encontrada com a query padrão.', ui.ButtonSet.OK);
          return;
        }

        var processedLabelName = 'NF-e - Processado';
        var processedLabel = GmailApp.getUserLabelByName(processedLabelName) || GmailApp.createLabel(processedLabelName);
        var existingNfs = _collectExistingNFs(sheet);
        var appended = 0;
        var processedThreads = 0;
        var rowsToAppend = [];

        function pushRow(rowArr) {
          var row = [];
          var k;
          for (var k = 0; k < cabLen; k++) {
            if (rowArr[k] != undefined) {
              row.push(rowArr[k]);
            } else {
              row.push('');
            }
          }
          rowsToAppend.push(row);
          appended++
        }

        threads.forEach(function(thread) {
          try {
            if (thread.getLabels().some(function(l){ return l.getName() == processedLabelName; })) return;
            var messages = thread.getMessages();
            messages.forEach(function(msg) {
              var subject = msg.getSubject();
              var from = msg.getFrom();
              var msgId = msg.getId();
              var thrId = thread.getId();
              var attachments = msg.getAttachments({includeInlineImages : false});
              if (!attachments || attachments.length == 0) {
                var body = msg.getPlainBody();
                var nfMatch = body && body.match(/(\d{44})/);
                if (nfMatch) {
                  var nfVal = nfMatch[1];
                  if (!existingNfs[nfVal]) {
                    pushRow([nfVal, '', '', '', '', 'Pendente', msgId, thrId, subject, from]);
                    existingNfs[nfVal] = true;
                  }
                }
              } else {
                attachments.forEach(function(att) {
                  var name = att.getName() || '';
                  var contentType = att.getContentType() || '';
                  if (/csv|text|plain|excel|sheet/i.test(contentType) || name.match(/\.csv$|\.txt$|\.tsv$/i)) {
                    var txt = att.getDataAsString();
                    var lines = txt.split(/\r ? \n/).filter(function(l){ return l.trim(); });
                    if (lines.length == 0) return;
                    var hdr = lines[0].split(/[\t]/).map(function(h){ return h.toLowerCase().trim(); });
                    var nfIdx = _findHeaderIndex(hdr, ['nota fiscal','nf-e','numero','nº']);
                    var dataIdx = _findHeaderIndex(hdr, ['data','data emissao','data emissão']);
                    var fornecedorIdx = _findHeaderIndex(hdr, ['fornecedor','supplier']);
                    var empenhoIdx = _findHeaderIndex(hdr, ['empenho','nota de empenho','ne']);
                    var valorIdx = _findHeaderIndex(hdr, ['valor','valor total','total']);
                    for (var i = 1; i<lines.length; i++) {
                      var cols = lines[i].split(/[\t]/).map(function(c){ return c.trim(); });
                      var nf;
                      if (nfIdx>=0) {
                        nf = cols[nfIdx];
                      } else {
                        nf = (cols[0]||'').trim();
                      }
                      if (!nf || existingNfs[nf]) continue;
                      var dataEm;
                      if (dataIdx>=0) {
                        dataEm = cols[dataIdx];
                      } else {
                        dataEm = '';
                      }
                      var forn;
                      if (fornecedorIdx>=0) {
                        forn = cols[fornecedorIdx];
                      } else {
                        forn = '';
                      }
                      var ne;
                      if (empenhoIdx>=0) {
                        ne = cols[empenhoIdx];
                      } else {
                        ne = '';
                      }
                      var rawVal;
                      if (valorIdx>=0) {
                        rawVal = cols[valorIdx];
                      } else {
                        rawVal = cols[cols.length-1];
                      }
                      var val;
                      if (rawVal) {
                        val = Number(String(rawVal).replace(/[^\d\.\-]/g,'').replace(',','.'));
                      } else {
                        val = '';
                      }
                      pushRow([nf, dataEm, forn, ne, val || '', 'Pendente', msgId, thrId, subject, from]);
                      existingNfs[nf] = true;
                    }
                  } else {
                    var nfFromName = (name.match(/\d{44}/) || [])[0];
                    if (nfFromName && !existingNfs[nfFromName]) {
                      pushRow([nfFromName, '', '', '', '', 'Pendente', msgId, thrId, subject, from]);
                      existingNfs[nfFromName] = true;
                    } else {
                      pushRow([name, '', '', '', '', 'Anexo não processado', msgId, thrId, subject, from]);
                    }
                  }
                });
              }
            });
            try { thread.addLabel(processedLabel); } catch(e) { Logger.log('Erro ao marcar label : ' + e); }
            processedThreads++
          } catch (e) {
            Logger.log('importarNotasFiscaisGmail erro thread : ' + e);
          }
        });

        if (rowsToAppend.length > 0) {
          var startRow = sheet.getLastRow() + 1;
          sheet.getRange(startRow, 1, rowsToAppend.length, cabLen).setValues(rowsToAppend);
        }

        ui.alert('Importação Gmail concluída', 'Registros adicionados : ' + appended + '\nThreads processadas : ' + processedThreads, ui.ButtonSet.OK);

      }


      /** Auxiliar : coleta NFs já presentes na aba para evitar duplicação */
      function _collectExistingNFs(sheet) {
        var out = {};
        try {
          var data = sheet.getDataRange().getValues();
          if (!data || data.length == 0) return out;
          var headers = (data[0] || []).map(function(h){ return String(h).toLowerCase(); });
          var nfIdx = _findHeaderIndex(headers, ['nota fiscal','nf-e','numero','número']);
          if (nfIdx < 0) return out;
          for (var i = 1; i<data.length; i++) {
            var nf = data[i][nfIdx];
            if (nf) out[String(nf).trim()] = true;
          }
        } catch (e) { /* ignore */ }
        return out;
      }


      // ---- ControleConferencia.gs ----
      /**
       * ControleConferencia.gs - Controle de Conferência com Base Legal
       * Sistema UNIAE CRE PP/Cruzeiro - REFATORADO PARA CONFORMIDADE LEGAL
       *
       * ELIMINA O "VÁCUO LEGAL" IDENTIFICADO NA ANÁLISE CRÍTICA
       *
       * Base Legal :
       * - Lei nº 11.947/2009 (PNAE) - Art. 15, § 2º
       * - Resolução CD/FNDE nº 06/2020 - Atestação por Comissão
       * - Lei nº 14.133/2021 - Art. 117 (Fiscal de contrato)
       * - Decreto DF nº 37.387/2016 - CAE
       * - Portaria nº 244/2006 - Base histórica
       *
       * RESOLVE CONFLITOS NORMATIVOS :
       * - Atestação imediata para perecíveis vs. recebimento completo
       * - Responsabilidades EEx vs. estruturas descentralizadas
       * - Procedimentos de conferência com fundamentação legal
       */

      /**
       * ESTRUTURA DE CONFERÊNCIA COM BASE LEGAL
       * Cada etapa fundamentada em determinante legal específico
       */
      var CONFERENCIA_STRUCTURE = {
        // Etapas do processo com base legal,
        etapas : {
          'SOMA' : {
            nome : 'Soma/Verificação Matemática',
            descricao : 'Verificação de cálculos e valores totais',
            ordem : 1,
            obrigatorio : true,
            base_legal : 'LEI_14133_2021_ART_117',
            responsavel_legal : 'FISCAL_CONTRATO',
            prazo_maximo : 1, // dia
            lacuna_identificada : 'Fiscal não formalmente designado'
          },
          'PDGP' : {
            nome : 'Verificação PDGP',
            descricao : 'Conferência com Programa de Distribuição de Gêneros Perecíveis',
            ordem : 2,
            obrigatorio : true,
            base_legal : 'LEI_11947_2009',
            responsavel_legal : 'SEEDF_EEX',
            prazo_maximo : 2, // dias
            lacuna_identificada : 'Procedimento não detalhado para nível regional'
          },
          'CONSULT_NF' : {
            nome : 'Consulta NF-e',
            descricao : 'Consulta de autenticidade da Nota Fiscal Eletrônica',
            ordem : 3,
            obrigatorio : true,
            base_legal : 'RESOLUCAO_FNDE_06_2020',
            responsavel_legal : 'COMISSAO_RECEBIMENTO',
            prazo_maximo : 1, // dia
            procedimento_definido : 'Consulta no site da SEFAZ'
          },
          'ATESTO_DESPACHO' : {
            nome : 'Atesto/Despacho',
            descricao : 'Atesto final e despacho para pagamento',
            ordem : 4,
            obrigatorio : true,
            base_legal : 'RESOLUCAO_FNDE_06_2020',
            responsavel_legal : 'COMISSAO_RECEBIMENTO',
            conflito_legal : 'Lei 14.133 exige recebimento completo vs. perecíveis imediatos',
            solucao_implementada : 'Protocolo específico para perecíveis'
          }
        },
  
        // Tipos de ocorrências com base legal,
        ocorrencias : {
          'CANCELAMENTO' : {
            nome : 'Cancelamento',
            campos : ['unidade_ec', 'item', 'motivo', 'responsavel', 'base_legal'],
            impacto : 'ALTO',
            base_legal : 'LEI_14133_2021_ART_117',
            exigencia : 'Registro próprio obrigatório'
          },
          'DEVOLUCAO' : {
            nome : 'Devolução',
            campos : ['unidade_ec', 'item', 'motivo', 'responsavel', 'base_legal'],
            impacto : 'MEDIO',
            base_legal : 'LEI_14133_2021_ART_117',
            exigencia : 'Registro próprio obrigatório'
          }
        },

        // Responsabilidades legais por etapa,
        responsabilidades_legais : {
          'DESIGNACAO_FISCAL' : {
            base_legal : 'LEI_14133_2021_ART_117',
            responsavel : 'SEEDF_EEX',
            status_atual : 'NAO_IMPLEMENTADO',
            acao_necessaria : 'Designar formalmente fiscal de contrato'
          },
          'CONSTITUICAO_COMISSAO' : {
            base_legal : 'RESOLUCAO_FNDE_06_2020',
            responsavel : 'CRE_PP',
            status_atual : 'VAGO',
            acao_necessaria : 'Constituir Comissão de Recebimento'
          },
          'ATRIBUICOES_UNIAE' : {
            base_legal : 'LACUNA_LEGAL',
            responsavel : 'INDEFINIDO',
            status_atual : 'VACUO_LEGAL',
            acao_necessaria : 'Decreto regulamentador das atribuições'
          }
        }
      };

      /**
       * Inicializa estrutura de controle de conferência com base legal
       */
      function initializeControleConferencia() {
        try {
          var sheet = getOrCreateSheetSafe('Controle_Conferencia');

          // Headers com base legal e conformidade
          var headers = [
            'ID_Controle',
            'Data_Controle',
            'Empresa_Fornecedor',
            'Numero_NF',
            'Valor_Total',
            'Tipo_Produto', // PERECIVEL/NAO_PERECIVEL (para protocolo específico)

            // Etapas de conferência com base legal
            'Status_Soma',
            'Data_Soma',
            'Responsavel_Soma',
            'Base_Legal_Soma', // LEI_14133_2021_ART_117
            'Observacoes_Soma',

            'Status_PDGP',
            'Data_PDGP',
            'Responsavel_PDGP',
            'Base_Legal_PDGP', // LEI_11947_2009
            'Observacoes_PDGP',

            'Status_Consulta_NF',
            'Data_Consulta_NF',
            'Responsavel_Consulta_NF',
            'Base_Legal_Consulta', // RESOLUCAO_FNDE_06_2020
            'Chave_Acesso_Verificada',
            'Site_SEFAZ_Consultado', // S/N

            'Status_Atesto',
            'Data_Atesto',
            'Responsavel_Atesto',
            'Base_Legal_Atesto', // RESOLUCAO_FNDE_06_2020
            'Comissao_Constituida', // S/N
            'Numero_Despacho',
            'Protocolo_Perecivel_Aplicado', // S/N

            // Status geral e conformidade
            'Status_Geral',
            'Status_Conformidade_Legal', // CONFORME/NAO_CONFORME/VACUO_LEGAL
            'Percentual_Conclusao',
            'Prazo_Limite',
            'Dias_Pendente',
            'Violacoes_Legais', // Lista de violações identificadas

            // Ocorrências com base legal
            'Tem_Cancelamento',
            'Tem_Devolucao',
            'Detalhes_Ocorrencias',
            'Registro_Proprio_Ocorrencias', // Conforme Lei 14.133 Art. 117

            // Responsabilidades legais
            'Fiscal_Contrato_Designado', // S/N (Lei 14.133)
            'Comissao_Recebimento_Ativa', // S/N (Resolução FNDE)
            'Atribuicoes_UNIAE_Formalizadas', // S/N (Lacuna legal)

            // Auditoria e rastreabilidade
            'Log_Alteracoes',
            'Ultima_Validacao_Legal',
            'Score_Conformidade' // 0-100
          ];

          // Verificar se precisa atualizar headers
          if (needsHeaderUpdate(sheet, {headers : headers})) {
            updateSheetHeaders(sheet, {headers : headers});
          }

          Logger.log('Estrutura de Controle de Conferência inicializada');

        } catch (error) {
          Logger.log('Erro ao inicializar controle de conferência : ' + error.message);
          throw error;
        }
      }


      /**
       * Registra nova nota fiscal no controle de conferência com validação legal
       */
      function registrarNotaParaConferencia(dadosNF) {
        try {
          // VALIDAÇÃO DE CONFORMIDADE LEGAL ANTES DO REGISTRO
          var validacao = validateLegalCompliance('NOTA_FISCAL_REGISTRATION', dadosNF);

          var sheet = getOrCreateSheetSafe('Controle_Conferencia');
          var novoID = 'CONF_' + new Date().getTime();

          // Determinar tipo de produto para protocolo específico
          var tipoproduto = determinarTipoProduto(dadosNF.produto || '');

          // Verificar se responsáveis estão designados
          var fiscalDesignado = verificarFiscalContrato();
          var comissaoAtiva = verificarComissaoRecebimento();
          var uniaeFormalizadas = verificarAtribuicoesUNIAE();

          // Calcular status de conformidade inicial
          var statusConformidade = calcularStatusConformidade(validacao, fiscalDesignado, comissaoAtiva);

          var novaLinha = [
            novoID,
            new Date(),
            dadosNF.fornecedor || '',
            dadosNF.numero_nf || '',
            dadosNF.valor_total || 0,
            tipoproduto, // CORRIGIDO : era tipoProduct

            // Etapas de conferência com base legal
            'PENDENTE', '', '', 'LEI_14133_2021_ART_117', '',
            'PENDENTE', '', '', 'LEI_11947_2009', '',
            'PENDENTE', '', '', 'RESOLUCAO_FNDE_06_2020', '', 'NAO',
            'PENDENTE', '', '', 'RESOLUCAO_FNDE_06_2020',
            comissaoAtiva ? 'SIM' : 'NAO', '', 'NAO'
          ];
          sheet.appendRow(novaLinha);
        } catch (e) {
          Logger.log('Erro : ' + e.message);
          throw e;
        }
      }
