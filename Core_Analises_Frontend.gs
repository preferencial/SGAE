/**
 * @fileoverview Funções de Análise para Frontend
 * @version 1.0.0
 * @description Funções chamadas pelo index.html para análises e relatórios
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-26
 */

'use strict';

// ============================================================================
// ANÁLISES DE NUTRIÇÃO E ALUNOS ESPECIAIS
// ============================================================================

/**
 * Análise de Alunos com Necessidades Especiais
 * @returns {Object} Resultado da análise
 */
function runAnaliseAlunosEspeciaisServer() {
  try {
    try {
      var ss = getSS();
      if (!ss) { Logger.log('getSS retornou null'); return { success: true, data: {}, _empty: true }; }
      var sheet = ss.getSheetByName('Alunos_Necessidades_Especiais') || 
                  ss.getSheetByName('Alunos_NAE');
    
      if (!sheet || sheet.getLastRow() <= 1) {
        return {
          success: true,
          data: {
            resumo: { total: 0, ativos: 0, porPatologia: {} },
            alunos: []
          }
        };
      }
    
      var data = sheet.getDataRange().getValues();
      var headers = data[0];
      var alunos = [];
      var porPatologia = {};
      var ativos = 0;
    
      for (var i = 1; i < data.length; i++) {
        var row = data[i];
        var aluno = {};
        headers.forEach(function(h, idx) {
          aluno[h] = row[idx];
        });
      
        var patologia = aluno.Patologia_Dieta || aluno.Tipo_Necessidade || aluno.patologia || 'Não especificada';
        var status = String(aluno.Status || aluno.status || 'ATIVO').toUpperCase();
      
        if (status === 'ATIVO') ativos++;
      
        porPatologia[patologia] = (porPatologia[patologia] || 0) + 1;
      
        alunos.push({
          nome: aluno.Nome_Completo || aluno.Nome || aluno.nome,
          escola: aluno.Unidade_Escolar || aluno.Escola || aluno.escola,
          patologia: patologia,
          status: status,
          validadeLaudo: aluno.Validade_Laudo || aluno.validade_laudo
        });
      }
    
      return {
        success: true,
        data: {
          resumo: {
            total: alunos.length,
            ativos: ativos,
            porPatologia: porPatologia
          },
          alunos: alunos.slice(0, 50)
        }
      };
    
    } catch (e) {
      Logger.log('Erro em runAnaliseAlunosEspeciaisServer: ' + e.message);
      return { success: false, error: e.message };
    }
  } catch (error) {
    Logger.log("Erro em runAnaliseAlunosEspeciaisServer: " + error.message);
    throw error;
  }
}

/**
 * Análise de Laudos Médicos (vencimentos e pendências)
 * @returns {Object} Resultado da análise
 */
function runAnaliseLaudosServer() {
  try {
    try {
      try {
        var ss = getSS();
        if (!ss) { Logger.log('getSS retornou null'); return { success: true, data: {}, _empty: true }; }
        var sheet = ss.getSheetByName('Alunos_Necessidades_Especiais') || 
                    ss.getSheetByName('Alunos_NAE');
    
        if (!sheet || sheet.getLastRow() <= 1) {
          return {
            success: true,
            data: {
              resumo: { total: 0, vencidos: 0, vencendo30dias: 0, validos: 0 },
              laudosVencendo: [],
              laudosVencidos: []
            }
          };
        }
    
        var data = sheet.getDataRange().getValues();
        var headers = data[0];
        var hoje = new Date();
        var em30dias = new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000);
    
        var vencidos = [];
        var vencendo = [];
        var validos = 0;
    
        for (var i = 1; i < data.length; i++) {
          var row = data[i];
          var aluno = {};
          headers.forEach(function(h, idx) {
            aluno[h] = row[idx];
          });
      
          var validadeLaudo = aluno.Validade_Laudo || aluno.validade_laudo;
          if (!validadeLaudo) continue;
      
          var dataValidade = new Date(validadeLaudo);
          if (isNaN(dataValidade.getTime())) continue;
      
          var registro = {
            nome: aluno.Nome_Completo || aluno.Nome || aluno.nome,
            escola: aluno.Unidade_Escolar || aluno.Escola || aluno.escola,
            patologia: aluno.Patologia_Dieta || aluno.Tipo_Necessidade || aluno.patologia,
            validadeLaudo: dataValidade.toLocaleDateString('pt-BR'),
            diasRestantes: Math.ceil((dataValidade - hoje) / (1000 * 60 * 60 * 24))
          };
      
          if (dataValidade < hoje) {
            vencidos.push(registro);
          } else if (dataValidade <= em30dias) {
            vencendo.push(registro);
          } else {
            validos++;
          }
        }
    
        // Ordenar por dias restantes
        vencendo.sort(function(a, b) { return a.diasRestantes - b.diasRestantes; });
        vencidos.sort(function(a, b) { return a.diasRestantes - b.diasRestantes; });
    
        return {
          success: true,
          data: {
            resumo: {
              total: vencidos.length + vencendo.length + validos,
              vencidos: vencidos.length,
              vencendo30dias: vencendo.length,
              validos: validos
            },
            laudosVencendo: vencendo.slice(0, 20),
            laudosVencidos: vencidos.slice(0, 20)
          }
        };
    
      } catch (e) {
        Logger.log('Erro em runAnaliseLaudosServer: ' + e.message);
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em runAnaliseLaudosServer: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em runAnaliseLaudosServer: " + error.message);
    throw error;
  }
}

/**
 * Análise de Cardápios Especiais
 * @returns {Object} Resultado da análise
 */
function runAnaliseCardapiosServer() {
  try {
    try {
      try {
        var ss = getSS();
        if (!ss) { Logger.log('getSS retornou null'); return { success: true, data: {}, _empty: true }; }
        var sheet = ss.getSheetByName('Cardapios_Especiais');
    
        if (!sheet || sheet.getLastRow() <= 1) {
          return {
            success: true,
            data: {
              resumo: { total: 0, porTipo: {}, porStatus: {} },
              cardapios: []
            }
          };
        }
    
        var data = sheet.getDataRange().getValues();
        var headers = data[0];
        var cardapios = [];
        var porTipo = {};
        var porStatus = {};
    
        for (var i = 1; i < data.length; i++) {
          var row = data[i];
          var cardapio = {};
          headers.forEach(function(h, idx) {
            cardapio[h] = row[idx];
          });
      
          var tipo = cardapio.Tipo_Dieta || cardapio.Patologia || cardapio.tipo || 'Geral';
          var status = cardapio.Status || cardapio.status || 'ATIVO';
      
          porTipo[tipo] = (porTipo[tipo] || 0) + 1;
          porStatus[status] = (porStatus[status] || 0) + 1;
      
          cardapios.push({
            id: cardapio.ID || cardapio.id,
            aluno: cardapio.Aluno_Nome || cardapio.aluno,
            tipo: tipo,
            status: status,
            dataCriacao: cardapio.Data_Criacao || cardapio.dataCriacao
          });
        }
    
        return {
          success: true,
          data: {
            resumo: {
              total: cardapios.length,
              porTipo: porTipo,
              porStatus: porStatus
            },
            cardapios: cardapios.slice(0, 30)
          }
        };
    
      } catch (e) {
        Logger.log('Erro em runAnaliseCardapiosServer: ' + e.message);
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em runAnaliseCardapiosServer: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em runAnaliseCardapiosServer: " + error.message);
    throw error;
  }
}

/**
 * Análise Nutricional
 * @returns {Object} Resultado da análise
 */
function runAnaliseNutricionalServer() {
  try {
    try {
      try {
        var ss = getSS();
    
        // Tenta obter dados de itens alimentares
        var sheet = ss.getSheetByName('Itens_Alimentares') || 
                    ss.getSheetByName('Produtos');
    
        if (!sheet || sheet.getLastRow() <= 1) {
          return {
            success: true,
            data: {
              resumo: { totalItens: 0, gruposAlimentares: {} },
              itens: []
            }
          };
        }
    
        var data = sheet.getDataRange().getValues();
        var headers = data[0];
        var itens = [];
        var gruposAlimentares = {};
    
        for (var i = 1; i < data.length; i++) {
          var row = data[i];
          var item = {};
          headers.forEach(function(h, idx) {
            item[h] = row[idx];
          });
      
          var grupo = item.Grupo_Alimentar || item.Categoria || item.grupo || 'Outros';
          gruposAlimentares[grupo] = (gruposAlimentares[grupo] || 0) + 1;
      
          itens.push({
            nome: item.Nome || item.Descricao || item.nome,
            grupo: grupo,
            calorias: item.Calorias_100g || item.calorias || 0,
            proteinas: item.Proteinas_g || item.proteinas || 0,
            carboidratos: item.Carboidratos_g || item.carboidratos || 0
          });
        }
    
        return {
          success: true,
          data: {
            resumo: {
              totalItens: itens.length,
              gruposAlimentares: gruposAlimentares
            },
            itens: itens.slice(0, 30)
          }
        };
    
      } catch (e) {
        Logger.log('Erro em runAnaliseNutricionalServer: ' + e.message);
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em runAnaliseNutricionalServer: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em runAnaliseNutricionalServer: " + error.message);
    throw error;
  }
}

// ============================================================================
// ANÁLISES COM INTELIGÊNCIA ARTIFICIAL (GEMINI)
// ============================================================================

/**
 * Análise Geral com IA (Gemini)
 * @returns {Object} Resultado da análise
 */
function runAnaliseIAGeralServer() {
  try {
    try {
      try {
        // Coleta dados para análise
        var ss = getSS();
        var resumo = {
          nfs: 0,
          entregas: 0,
          recusas: 0,
          valorTotal: 0
        };
    
        // Conta NFs
        var nfSheet = ss.getSheetByName('Notas_Fiscais');
        if (nfSheet && nfSheet.getLastRow() > 1) {
          resumo.nfs = nfSheet.getLastRow() - 1;
        }
    
        // Conta Entregas
        var entregasSheet = ss.getSheetByName('Entregas');
        if (entregasSheet && entregasSheet.getLastRow() > 1) {
          resumo.entregas = entregasSheet.getLastRow() - 1;
        }
    
        // Conta Recusas
        var recusasSheet = ss.getSheetByName('Recusas');
        if (recusasSheet && recusasSheet.getLastRow() > 1) {
          resumo.recusas = recusasSheet.getLastRow() - 1;
        }
    
        // Tenta usar Gemini se disponível
        var analiseIA = null;
        try {
          if (isGeminiConfigured()) {
            // Coleta produtos reais das NFs para enriquecer o prompt
            var prodResumo = {};
            var fornResumo = {};
            if (nfSheet && nfSheet.getLastRow() > 1) {
              var nfData2 = nfSheet.getDataRange().getValues();
              var nfHd2 = nfData2[0];
              var nfi2 = {};
              nfHd2.forEach(function(h, i) { nfi2[String(h).toLowerCase().replace(/[^a-z0-9]/g, '_')] = i; });
              var prodIdx2  = nfi2['produto'] !== undefined ? nfi2['produto'] : (nfi2['produto_nome'] !== undefined ? nfi2['produto_nome'] : -1);
              var fornIdx2  = nfi2['fornecedor'] !== undefined ? nfi2['fornecedor'] : (nfi2['fornecedor_nome'] !== undefined ? nfi2['fornecedor_nome'] : -1);
              var valIdx2   = nfi2['valor_total'] !== undefined ? nfi2['valor_total'] : -1;
              var statusIdx2 = nfi2['status'] !== undefined ? nfi2['status'] : (nfi2['status_nf'] !== undefined ? nfi2['status_nf'] : -1);
              for (var ri = 1; ri < nfData2.length; ri++) {
                var rw = nfData2[ri];
                if (!rw[0]) continue;
                var prod = prodIdx2 !== -1 ? String(rw[prodIdx2] || '').trim() : '';
                var forn = fornIdx2 !== -1 ? String(rw[fornIdx2] || '').trim() : '';
                var val  = valIdx2  !== -1 ? Number(rw[valIdx2]  || 0) : 0;
                var st   = statusIdx2 !== -1 ? String(rw[statusIdx2] || '').trim() : '';
                if (prod) { prodResumo[prod] = (prodResumo[prod] || 0) + 1; }
                if (forn) { fornResumo[forn] = (fornResumo[forn] || 0) + 1; }
              }
            }
            var topProdutos = Object.entries(prodResumo).sort(function(a,b){return b[1]-a[1];}).slice(0,10).map(function(e){return e[0]+' ('+e[1]+' NFs)';}).join(', ') || 'Nenhum produto encontrado';
            var topFornecedores = Object.entries(fornResumo).sort(function(a,b){return b[1]-a[1];}).slice(0,8).map(function(e){return e[0]+' ('+e[1]+' NFs)';}).join(', ') || 'Nenhum fornecedor encontrado';

            var prompt = 'Você é um especialista em gestão de alimentação escolar (PNAE/FNDE). ' +
                         'Analise os dados reais abaixo e forneça insights práticos e objetivos:\n\n' +
                         '## Resumo Quantitativo\n' +
                         '- Notas Fiscais registradas: ' + resumo.nfs + '\n' +
                         '- Entregas registradas: ' + resumo.entregas + '\n' +
                         '- Recusas registradas: ' + resumo.recusas + '\n\n' +
                         '## Produtos mais frequentes nas NFs\n' + topProdutos + '\n\n' +
                         '## Fornecedores com mais NFs\n' + topFornecedores + '\n\n' +
                         'Forneça:\n' +
                         '1. Análise da diversidade de produtos e conformidade com PNAE\n' +
                         '2. Pontos de atenção sobre fornecedores e concentração de compras\n' +
                         '3. Recomendações práticas para melhorar a gestão\n' +
                         'Seja específico e mencione os dados reais acima.';

            var response = sendMessageToGemini(prompt);
            analiseIA = (response && response.success) ? response.message : ('Erro: ' + (response ? response.error : 'Sem resposta'));
          } else {
            analiseIA = 'Configure GEMINI_API_KEY nas Propriedades do Script.';
          }
        } catch (e) {
          Logger.log('Erro Gemini: ' + e.message);
          analiseIA = 'Erro: ' + e.message;
        }
    
        return {
          success: true,
          data: {
            resumo: resumo,
            analiseIA: analiseIA,
            timestamp: new Date().toISOString()
          }
        };
    
      } catch (e) {
        Logger.log('Erro em runAnaliseIAGeralServer: ' + e.message);
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em runAnaliseIAGeralServer: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em runAnaliseIAGeralServer: " + error.message);
    throw error;
  }
}

/**
 * Análise Nutricional com IA
 * @returns {Object} Resultado da análise
 */
function runAnaliseIANutricaoServer() {
  try {
    var resultado = runAnaliseNutricionalServer();
    
    if (!resultado.success) {
      return resultado;
    }
    
    var analiseIA = null;
    try {
      if (isGeminiConfigured()) {
        var grupos = resultado.data.resumo.gruposAlimentares;
        var prompt = 'Você é um nutricionista especializado em alimentação escolar (PNAE). Analise a distribuição de grupos alimentares abaixo e sugira melhorias:\n\n' +
                     'Distribuição atual:\n' + JSON.stringify(grupos, null, 2) + '\n\n' +
                     'Considere as diretrizes do PNAE e FNDE. Forneça:\n' +
                     '1. Avaliação da distribuição atual\n' +
                     '2. Grupos alimentares que precisam de mais atenção\n' +
                     '3. Sugestões de cardápio equilibrado';
        
        var response = sendMessageToGemini(prompt);
        analiseIA = (response && response.success) ? response.message : ('Erro: ' + (response ? response.error : 'Sem resposta'));
      } else {
        analiseIA = 'Configure GEMINI_API_KEY nas Propriedades do Script.';
      }
    } catch (e) {
      Logger.log('Erro Gemini: ' + e.message);
      analiseIA = 'Erro: ' + e.message;
    }
    
    resultado.data.analiseIA = analiseIA;
    
    return resultado;
    
  } catch (e) {
    Logger.log('Erro em runAnaliseIANutricaoServer: ' + e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Previsão de Demanda com IA
 * @returns {Object} Resultado da análise
 */
function runAnaliseIAPrevisaoServer() {
  try {
    try {
      try {
        var ss = getSS();
    
        // Coleta histórico de entregas
        var entregasSheet = ss.getSheetByName('Entregas');
        var historico = [];
        var produtosContagem = {};

        if (entregasSheet && entregasSheet.getLastRow() > 1) {
          var data = entregasSheet.getDataRange().getValues();
          var headers = data[0];

          for (var i = 1; i < Math.min(data.length, 100); i++) {
            var row = data[i];
            var entrega = {};
            headers.forEach(function(h, idx) {
              entrega[h] = row[idx];
            });

            var produto = entrega.Produto || entrega.produto || entrega.Produto_Descricao || 'Não especificado';
            produtosContagem[produto] = (produtosContagem[produto] || 0) + 1;

            historico.push({
              data: entrega.Data_Entrega || entrega.data,
              quantidade: entrega.Quantidade || entrega.quantidade || 0,
              produto: produto
            });
          }
        }

        // Também lê Notas_Fiscais para enriquecer o histórico
        var nfSheet3 = ss.getSheetByName('Notas_Fiscais');
        if (nfSheet3 && nfSheet3.getLastRow() > 1) {
          var nfD = nfSheet3.getDataRange().getValues();
          var nfHd3 = nfD[0];
          var nfIdx3 = {};
          nfHd3.forEach(function(h, i) { nfIdx3[String(h).toLowerCase().replace(/[^a-z0-9]/g, '_')] = i; });
          var pIdx3 = nfIdx3['produto'] !== undefined ? nfIdx3['produto'] : (nfIdx3['produto_nome'] !== undefined ? nfIdx3['produto_nome'] : -1);
          var qIdx3 = nfIdx3['quantidade'] !== undefined ? nfIdx3['quantidade'] : -1;
          if (pIdx3 !== -1) {
            for (var j = 1; j < Math.min(nfD.length, 200); j++) {
              var rj = nfD[j];
              if (!rj[0]) continue;
              var prod3 = String(rj[pIdx3] || '').trim();
              var qty3  = qIdx3 !== -1 ? Number(rj[qIdx3] || 0) : 0;
              if (prod3) {
                produtosContagem[prod3] = (produtosContagem[prod3] || 0) + 1;
                historico.push({ produto: prod3, quantidade: qty3, origem: 'NF' });
              }
            }
          }
        }
    
        var analiseIA = null;
        try {
          if (isGeminiConfigured()) {
            var prompt = 'Você é um especialista em logística de alimentação escolar. Com base no histórico de entregas, faça uma previsão de demanda:\n\n' +
                         'Total de entregas analisadas: ' + historico.length + '\n' +
                         'Produtos mais frequentes:\n' + JSON.stringify(produtosContagem, null, 2) + '\n\n' +
                         'Forneça:\n' +
                         '1. Previsão de demanda para os próximos 30 dias\n' +
                         '2. Produtos que devem ter estoque prioritário\n' +
                         '3. Recomendações de planejamento de compras';
        
            var response = sendMessageToGemini(prompt);
            analiseIA = (response && response.success) ? response.message : ('Erro: ' + (response ? response.error : 'Sem resposta'));
          } else {
            analiseIA = 'Configure GEMINI_API_KEY nas Propriedades do Script.';
          }
        } catch (e) {
          Logger.log('Erro Gemini: ' + e.message);
          analiseIA = 'Erro: ' + e.message;
        }
    
        return {
          success: true,
          data: {
            historicoEntregas: historico.length,
            produtosMaisFrequentes: produtosContagem,
            previsao: analiseIA,
            timestamp: new Date().toISOString()
          }
        };
    
      } catch (e) {
        Logger.log('Erro em runAnaliseIAPrevisaoServer: ' + e.message);
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em runAnaliseIAPrevisaoServer: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em runAnaliseIAPrevisaoServer: " + error.message);
    throw error;
  }
}

/**
 * Alertas Inteligentes com IA
 * @returns {Object} Resultado da análise
 */
function runAnaliseIAAlertasServer() {
  try {
    try {
      try {
        var alertas = [];
        var ss = getSS();
    
        // Verifica laudos vencendo
        var laudosResult = runAnaliseLaudosServer();
        if (laudosResult.success && laudosResult.data.resumo.vencendo30dias > 0) {
          alertas.push({
            tipo: 'LAUDO_VENCENDO',
            severidade: 'ALTA',
            mensagem: laudosResult.data.resumo.vencendo30dias + ' laudo(s) vencendo nos próximos 30 dias',
            acao: 'Solicitar renovação dos laudos médicos'
          });
        }
    
        if (laudosResult.success && laudosResult.data.resumo.vencidos > 0) {
          alertas.push({
            tipo: 'LAUDO_VENCIDO',
            severidade: 'CRITICA',
            mensagem: laudosResult.data.resumo.vencidos + ' laudo(s) já vencido(s)',
            acao: 'Urgente: Regularizar situação dos alunos'
          });
        }
    
        // Verifica NFs pendentes
        var nfSheet = ss.getSheetByName('Notas_Fiscais');
        if (nfSheet && nfSheet.getLastRow() > 1) {
          var nfData = nfSheet.getDataRange().getValues();
          var headers = nfData[0];
          var statusCol = headers.indexOf('Status') !== -1 ? headers.indexOf('Status') : headers.indexOf('Status_NF');
      
          var pendentes = 0;
          for (var i = 1; i < nfData.length; i++) {
            var status = String(nfData[i][statusCol] || '').toUpperCase();
            if (status === 'PENDENTE' || status === 'EM_ANALISE') {
              pendentes++;
            }
          }
      
          if (pendentes > 5) {
            alertas.push({
              tipo: 'NF_PENDENTE',
              severidade: 'MEDIA',
              mensagem: pendentes + ' nota(s) fiscal(is) pendente(s) de análise',
              acao: 'Priorizar análise das NFs pendentes'
            });
          }
        }
    
        // Análise com IA se disponível
        var analiseIA = null;
        if (alertas.length > 0) {
          try {
            if (isGeminiConfigured()) {
              var prompt = 'Você é um gestor de alimentação escolar. Analise os seguintes alertas e sugira priorização e ações:\n\n' +
                           JSON.stringify(alertas, null, 2) + '\n\n' +
                           'Forneça:\n1. Ordem de prioridade\n2. Ações imediatas recomendadas\n3. Impacto se não resolvidos';
          
              var response = sendMessageToGemini(prompt);
              if (response && response.success) {
                analiseIA = response.message;
              }
            }
          } catch (e) {
            Logger.log('Erro Gemini alertas: ' + e.message);
          }
        }
    
        return {
          success: true,
          data: {
            totalAlertas: alertas.length,
            alertas: alertas,
            recomendacaoIA: analiseIA,
            timestamp: new Date().toISOString()
          }
        };
    
      } catch (e) {
        Logger.log('Erro em runAnaliseIAAlertasServer: ' + e.message);
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em runAnaliseIAAlertasServer: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em runAnaliseIAAlertasServer: " + error.message);
    throw error;
  }
}

// ============================================================================
// LOG DE CARREGAMENTO
// ============================================================================

Logger.log('✅ Core_Analises_Frontend.gs carregado - Funções de análise disponíveis');

