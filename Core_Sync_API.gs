/**
 * @fileoverview API de Sincronização e Diagnóstico
 * Centraliza funções de sincronização entre Backend e Frontend
 */

'use strict';

/**
 * Sincroniza dados entre as sheets do sistema
 * Garante que os dados estejam consistentes entre Notas_Fiscais e Workflow_NotasFiscais
 * @returns {Object} Resultado da sincronização
 */
function sincronizarDadosNF() {
  try {
    try {
      try {
        try {
          Logger.log('=== INICIANDO SINCRONIZAÇÃO DE NFs ===');
          var ss = getSS();
          var resultado = {
            success: true,
            sincronizados: 0,
            erros: [],
            detalhes: {}
          };
    
          // 1. Verificar sheet principal (Notas_Fiscais)
          var sheetPrincipal = ss.getSheetByName('Notas_Fiscais');
          if (!sheetPrincipal) {
            Logger.log('Sheet Notas_Fiscais não existe. Criando...');
            sheetPrincipal = ss.insertSheet('Notas_Fiscais');
            var headers = ['id', 'numero_nf', 'serie', 'chave_acesso', 'fornecedor', 'cnpj', 'valor_total', 'valor_liquido', 'valor_glosa', 'data_emissao', 'data_cadastro', 'status', 'usuario_cadastro', 'nota_empenho', 'itens_quantidade', 'observacoes', 'data_recebimento', 'usuario_recebimento', 'data_atesto', 'usuario_atesto', 'parecer_atesto'];
            sheetPrincipal.getRange(1, 1, 1, headers.length).setValues([headers]);
            sheetPrincipal.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#4a86e8').setFontColor('white');
          }
    
          resultado.detalhes.Notas_Fiscais = {
            linhas: sheetPrincipal.getLastRow()
          };
    
          // 2. Verificar sheet de workflow (Workflow_NotasFiscais)
          var sheetWorkflow = ss.getSheetByName('Workflow_NotasFiscais');
          if (sheetWorkflow && sheetWorkflow.getLastRow() > 1) {
            resultado.detalhes.Workflow_NotasFiscais = {
              linhas: sheetWorkflow.getLastRow()
            };
      
            // Obter IDs já existentes na sheet principal
            var idsExistentes = {};
            if (sheetPrincipal.getLastRow() > 1) {
              var dadosPrincipal = sheetPrincipal.getDataRange().getValues();
              for (var i = 1; i < dadosPrincipal.length; i++) {
                var id = dadosPrincipal[i][0];
                if (id) idsExistentes[id] = true;
              }
            }
      
            // Sincronizar dados do workflow para a sheet principal
            var dadosWorkflow = sheetWorkflow.getDataRange().getValues();
            var headersWF = dadosWorkflow[0];
            var headersPrincipal = sheetPrincipal.getRange(1, 1, 1, sheetPrincipal.getLastColumn()).getValues()[0];
      
            // Mapear índices do workflow
            var wfIdxMap = {};
            headersWF.forEach(function(h, i) { wfIdxMap[h.toLowerCase().replace(/[_\s]/g, '')] = i; });
      
            for (var j = 1; j < dadosWorkflow.length; j++) {
              var row = dadosWorkflow[j];
              var id = row[wfIdxMap['id'] !== undefined ? wfIdxMap['id'] : 0];
        
              // Pular se já existe ou se não tem ID
              if (!id || idsExistentes[id]) continue;
        
              // Mapear dados do workflow para o formato da sheet principal
              var novaLinha = headersPrincipal.map(function(h) {
                var key = h.toLowerCase().replace(/[_\s]/g, '');
                switch(key) {
                  case 'id': return id;
                  case 'numeronf': return row[wfIdxMap['numero'] !== undefined ? wfIdxMap['numero'] : 2];
                  case 'serie': return row[wfIdxMap['serie'] !== undefined ? wfIdxMap['serie'] : 3];
                  case 'chaveacesso': return row[wfIdxMap['chaveacesso'] !== undefined ? wfIdxMap['chaveacesso'] : 4];
                  case 'fornecedor': return row[wfIdxMap['fornecedor'] !== undefined ? wfIdxMap['fornecedor'] : 7];
                  case 'cnpj': return row[wfIdxMap['cnpj'] !== undefined ? wfIdxMap['cnpj'] : 6];
                  case 'valortotal': return row[wfIdxMap['valortotal'] !== undefined ? wfIdxMap['valortotal'] : 12];
                  case 'valorliquido': return row[wfIdxMap['valortotal'] !== undefined ? wfIdxMap['valortotal'] : 12];
                  case 'valorglosa': return 0;
                  case 'dataemissao': return row[wfIdxMap['dataemissao'] !== undefined ? wfIdxMap['dataemissao'] : 5];
                  case 'datacadastro': return row[wfIdxMap['datacriacao'] !== undefined ? wfIdxMap['datacriacao'] : 1];
                  case 'status': return row[wfIdxMap['status'] !== undefined ? wfIdxMap['status'] : 14];
                  case 'usuariocadastro': return row[wfIdxMap['usuario'] !== undefined ? wfIdxMap['usuario'] : 15];
                  case 'notaempenho': return row[wfIdxMap['notaempenho'] !== undefined ? wfIdxMap['notaempenho'] : 13];
                  case 'itensquantidade': return row[wfIdxMap['quantidade'] !== undefined ? wfIdxMap['quantidade'] : 9];
                  default: return '';
                }
              });
        
              sheetPrincipal.appendRow(novaLinha);
              resultado.sincronizados++;
              idsExistentes[id] = true;
            }
          }
    
          Logger.log('Sincronização concluída: ' + resultado.sincronizados + ' registros sincronizados');
          return resultado;
    
        } catch (e) {
          Logger.log('Erro na sincronização: ' + e.message);
          return {
            success: false,
            error: e.message,
            sincronizados: 0
          };
        }
      } catch (error) {
        Logger.log("Erro em sincronizarDadosNF: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em sincronizarDadosNF: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em sincronizarDadosNF: " + error.message);
    throw error;
  }
}

/**
 * Força refresh dos dados do frontend
 * Chama sincronização e retorna dados atualizados
 * @returns {Object} Dados atualizados
 */
function refreshDadosFrontend() {
  try {
    try {
      try {
        // 1. Sincronizar dados
        var syncResult = sincronizarDadosNF();
        Logger.log('Sincronização: ' + JSON.stringify(syncResult));
    
        // 2. Retornar dados atualizados
        // Assume que listNotasFiscais, listEntregas, etc. estão disponíveis globalmente
        var nfs = typeof listNotasFiscais === 'function' ? listNotasFiscais(100) : { data: [] };
        var entregas = typeof listEntregas === 'function' ? listEntregas(100) : { data: [] };
        var recusas = typeof listRecusas === 'function' ? listRecusas(100) : { data: [] };
        var glosas = typeof listGlosas === 'function' ? listGlosas(100) : { data: [] };
    
        return {
          success: true,
          data: {
            sincronizacao: syncResult,
            dados: {
              nfs: nfs.data || [],
              entregas: entregas.data || [],
              recusas: recusas.data || [],
              glosas: glosas.data || []
            },
            totais: {
              nfs: nfs.data ? nfs.data.length : 0,
              entregas: entregas.data ? entregas.data.length : 0,
              recusas: recusas.data ? recusas.data.length : 0,
              glosas: glosas.data ? glosas.data.length : 0
            }
          }
        };
    
      } catch (e) {
        Logger.log('Erro refreshDadosFrontend: ' + e.message);
        return { success: false, message: 'Erro ao atualizar dados: ' + e.message };
      }
    } catch (error) {
      Logger.log("Erro em refreshDadosFrontend: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em refreshDadosFrontend: " + error.message);
    throw error;
  }
}

/**
 * Verifica integridade dos dados e retorna diagnóstico
 * @returns {Object} Diagnóstico completo
 */
function diagnosticarDados() {
  try {
    try {
      try {
        var ss = getSS();
        var diagnostico = {
          timestamp: new Date().toISOString(),
          sheets: {},
          problemas: [],
          recomendacoes: []
        };
    
        // Verificar sheets principais
        var sheetsParaVerificar = [
          'Notas_Fiscais',
          'Workflow_NotasFiscais',
          'Entregas',
          'Recusas',
          'Glosas',
          'Fornecedores',
          'Unidades_Escolares'
        ];
    
        sheetsParaVerificar.forEach(function(nome) {
          var sheet = ss.getSheetByName(nome);
          if (sheet) {
            var lastRow = sheet.getLastRow();
            var lastCol = sheet.getLastColumn();
            diagnostico.sheets[nome] = {
              existe: true,
              linhas: lastRow,
              colunas: lastCol,
              temDados: lastRow > 1,
              headers: lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : []
            };
        
            if (lastRow <= 1) {
              diagnostico.problemas.push('Sheet ' + nome + ' está vazia (sem dados)');
            }
          } else {
            diagnostico.sheets[nome] = { existe: false };
            diagnostico.problemas.push('Sheet ' + nome + ' não existe');
            diagnostico.recomendacoes.push('Execute montarSistemaCompleto() para criar a sheet ' + nome);
          }
        });
    
        // Verificar consistência entre Notas_Fiscais e Workflow_NotasFiscais
        if (diagnostico.sheets.Notas_Fiscais && diagnostico.sheets.Workflow_NotasFiscais) {
          if (diagnostico.sheets.Notas_Fiscais.existe && diagnostico.sheets.Workflow_NotasFiscais.existe) {
            var totalNF = diagnostico.sheets.Notas_Fiscais.linhas - 1;
            var totalWF = diagnostico.sheets.Workflow_NotasFiscais.linhas - 1;
        
            if (totalWF > 0 && totalNF === 0) {
              diagnostico.problemas.push('Workflow_NotasFiscais tem dados mas Notas_Fiscais está vazia');
              diagnostico.recomendacoes.push('Execute sincronizarDadosNF() para sincronizar os dados');
            }
          }
        }
    
        // Resumo
        diagnostico.resumo = {
          totalProblemas: diagnostico.problemas.length,
          totalRecomendacoes: diagnostico.recomendacoes.length,
          status: diagnostico.problemas.length === 0 ? 'OK' : 'ATENÇÃO'
        };
    
        Logger.log('Diagnóstico: ' + JSON.stringify(diagnostico.resumo));
        return diagnostico;
    
      } catch (e) {
        Logger.log('Erro diagnosticarDados: ' + e.message);
        return { error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em diagnosticarDados: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em diagnosticarDados: " + error.message);
    throw error;
  }
}

/**
 * Teste simples de conectividade
 */
function testSyncConnectivity() {
  return "Sync API is online";
}
