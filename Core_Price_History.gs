/**
 * @fileoverview Histórico de Preços e Análise de Inflação - Alimentação Escolar CRE-PP
 * @version 1.0.0
 * 
 * Intervenção 30/38: PriceHistory conforme Prompt 30
 * 
 * Funcionalidades:
 * - Análise histórica de preços por fornecedor
 * - Comparativo de preços entre fornecedores
 * - Cálculo de variação/inflação
 * - Suporte a licitações e reajustes
 * - Relatórios de tendência
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-25
 */

'use strict';

// ============================================================================
// PRICE HISTORY - Histórico de Preços
// ============================================================================

var PriceHistory = (function() {
  
  // =========================================================================
  // CONFIGURAÇÃO
  // =========================================================================
  
  var CONFIG = {
    // Planilhas
    PRECOS_SHEET: 'Historico_Precos',
    ITENS_SHEET: 'Itens_Cardapio',
    
    // Grupos de alimentos
    GRUPOS: {
      HORTIFRUTI: 'Hortifruti',
      CARNES: 'Carnes e Proteínas',
      LATICINIOS: 'Laticínios',
      GRAOS: 'Grãos e Cereais',
      PANIFICACAO: 'Panificação',
      BEBIDAS: 'Bebidas',
      OUTROS: 'Outros'
    },
    
    // Unidades de medida
    UNIDADES: ['kg', 'g', 'L', 'ml', 'un', 'pct', 'cx', 'dz'],
    
    // Limites de variação para alertas (%)
    ALERTA_VARIACAO: 15,
    ALERTA_CRITICO: 30
  };
  
  // =========================================================================
  // FUNÇÕES PRIVADAS
  // =========================================================================
  
  function _formatarMoeda(valor) {
    try {
      return 'R$ ' + Number(valor || 0).toLocaleString('pt-BR', {
        minimumFractionDigits: 2, maximumFractionDigits: 2
      });
    } catch (error) {
      Logger.log("Erro em _formatarMoeda: " + error.message);
      throw error;
    }
  }
  
  function _formatarData(data) {
    try {
      if (!data) return '-';
      var d = new Date(data);
      return d.toLocaleDateString('pt-BR');
    } catch (error) {
      Logger.log("Erro em _formatarData: " + error.message);
      throw error;
    }
  }
  
  function _formatarMesAno(data) {
    if (!data) return '-';
    var d = new Date(data);
    var meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return meses[d.getMonth()] + '/' + d.getFullYear();
  }
  
  function _calcularVariacao(valorAnterior, valorAtual) {
    if (!valorAnterior || valorAnterior === 0) return 0;
    return ((valorAtual - valorAnterior) / valorAnterior) * 100;
  }
  
  function _getData(sheetName, filtros) {
    if (typeof DatabaseEngine !== 'undefined') {
      return DatabaseEngine.read(sheetName, filtros);
    }
    try {
      var ss = getSS();
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) return [];
      
      var data = sheet.getDataRange().getValues();
      if (data.length < 2) return [];
      
      var headers = data[0];
      var result = [];
      
      for (var i = 1; i < data.length; i++) {
        var row = {};
        for (var j = 0; j < headers.length; j++) {
          row[headers[j]] = data[i][j];
        }
        result.push(row);
      }
      
      if (filtros) {
        result = result.filter(function(item) {
          for (var key in filtros) {
            if (item[key] !== filtros[key]) return false;
          }
          return true;
        });
      }
      
      return result;
    } catch (e) {
      return [];
    }
  }
  
  function _saveData(sheetName, dados) {
    try {
      try {
        try {
          if (typeof DatabaseEngine !== 'undefined') {
            return DatabaseEngine.create(sheetName, dados);
          }
          try {
            var ss = getSS();
            var sheet = ss.getSheetByName(sheetName);
            if (!sheet) return null;
      
            var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
            var row = headers.map(function(h) { return dados[h] || ''; });
            sheet.appendRow(row);
            return dados;
          } catch (e) {
            return null;
          }
        } catch (error) {
          Logger.log("Erro em _saveData: " + error.message);
          throw error; // Re-lança para tratamento superior
        }
      } catch (error) {
        Logger.log("Erro em _saveData: " + error.message);
        throw error;
      }
    } catch (error) {
      Logger.log("Erro em _saveData: " + error.message);
      throw error;
    }
  }
  
  function _gerarId() {
    try {
      return 'PRECO_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    } catch (error) {
      Logger.log("Erro em _gerarId: " + error.message);
      throw error;
    }
  }
  
  // =========================================================================
  // API PÚBLICA - REGISTRO DE PREÇOS
  // =========================================================================
  
  /**
   * Registra preço de um item
   * @param {Object} dados - Dados do preço
   * @returns {Object} Resultado
   */
  function registrarPreco(dados) {
    try {
      if (!dados) {
        return { success: false, error: 'Dados são obrigatórios' };
      }
    
      var erros = [];
      if (!dados.item_id && !dados.item_nome) erros.push('Item é obrigatório');
      if (!dados.fornecedor_id) erros.push('Fornecedor é obrigatório');
      if (!dados.preco || dados.preco <= 0) erros.push('Preço deve ser maior que zero');
    
      if (erros.length > 0) {
        return { success: false, errors: erros };
      }
    
      try {
        // Busca último preço para calcular variação
        var ultimoPreco = getUltimoPreco(dados.item_id, dados.fornecedor_id);
        var variacao = 0;
      
        if (ultimoPreco.success && ultimoPreco.data) {
          variacao = _calcularVariacao(ultimoPreco.data.preco, dados.preco);
        }
      
        var registro = {
          id: _gerarId(),
          item_id: dados.item_id || '',
          item_nome: dados.item_nome || '',
          item_grupo: dados.item_grupo || CONFIG.GRUPOS.OUTROS,
          unidade: dados.unidade || 'kg',
        
          fornecedor_id: dados.fornecedor_id,
          fornecedor_nome: dados.fornecedor_nome || '',
        
          preco: Number(dados.preco),
          preco_anterior: ultimoPreco.success && ultimoPreco.data ? ultimoPreco.data.preco : null,
          variacao_percentual: variacao,
        
          // Referência
          contrato_id: dados.contrato_id || '',
          nota_fiscal_id: dados.nota_fiscal_id || '',
          licitacao: dados.licitacao || '',
        
          // Data
          data_registro: new Date().toISOString(),
          mes_referencia: dados.mes_referencia || new Date().getMonth() + 1,
          ano_referencia: dados.ano_referencia || new Date().getFullYear(),
        
          // Metadados
          origem: dados.origem || 'MANUAL',
          criado_por: Session.getActiveUser().getEmail()
        };
      
        var resultado = _saveData(CONFIG.PRECOS_SHEET, registro);
      
        if (!resultado) {
          return { success: false, error: 'Erro ao salvar preço' };
        }
      
        // Alerta se variação alta
        if (Math.abs(variacao) >= CONFIG.ALERTA_VARIACAO) {
          if (typeof NotificationService !== 'undefined') {
            NotificationService.enviar({
              tipo: 'ALERTA_PRECO',
              titulo: 'Variação de Preço Significativa',
              mensagem: 'O item ' + registro.item_nome + ' teve variação de ' + 
                        variacao.toFixed(1) + '% no fornecedor ' + registro.fornecedor_nome,
              prioridade: Math.abs(variacao) >= CONFIG.ALERTA_CRITICO ? 'ALTA' : 'MEDIA'
            });
          }
        }
      
        return {
          success: true,
          data: registro,
          variacao: {
            percentual: variacao,
            alerta: Math.abs(variacao) >= CONFIG.ALERTA_VARIACAO
          }
        };
      
      } catch (e) {
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em registrarPreco: " + error.message);
      throw error;
    }
  }
  
  /**
   * Registra preços em lote (de uma NF)
   * @param {Object} dados - Dados do lote
   * @returns {Object} Resultado
   */
  function registrarPrecosLote(dados) {
    try {
      if (!dados || !dados.itens || dados.itens.length === 0) {
        return { success: false, error: 'Itens são obrigatórios' };
      }
    
      try {
        var registrados = [];
        var erros = [];
      
        dados.itens.forEach(function(item) {
          var resultado = registrarPreco({
            item_id: item.id,
            item_nome: item.nome,
            item_grupo: item.grupo,
            unidade: item.unidade,
            fornecedor_id: dados.fornecedor_id,
            fornecedor_nome: dados.fornecedor_nome,
            preco: item.preco_unitario,
            contrato_id: dados.contrato_id,
            nota_fiscal_id: dados.nota_fiscal_id,
            origem: 'NF'
          });
        
          if (resultado.success) {
            registrados.push(resultado.data);
          } else {
            erros.push({ item: item.nome, erro: resultado.error });
          }
        });
      
        return {
          success: true,
          data: {
            registrados: registrados.length,
            erros: erros.length,
            detalhesErros: erros
          }
        };
      
      } catch (e) {
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em registrarPrecosLote: " + error.message);
      throw error;
    }
  }
  
  /**
   * Obtém último preço registrado
   * @param {string} itemId - ID do item
   * @param {string} fornecedorId - ID do fornecedor (opcional)
   * @returns {Object} Último preço
   */
  function getUltimoPreco(itemId, fornecedorId) {
    if (!itemId) {
      return { success: false, error: 'Item é obrigatório' };
    }
    
    try {
      var filtros = { item_id: itemId };
      if (fornecedorId) {
        filtros.fornecedor_id = fornecedorId;
      }
      
      var precos = _getData(CONFIG.PRECOS_SHEET, filtros);
      
      if (!precos || precos.length === 0) {
        return { success: true, data: null };
      }
      
      // Ordena por data (mais recente primeiro)
      precos.sort(function(a, b) {
        return new Date(b.data_registro) - new Date(a.data_registro);
      });
      
      return { success: true, data: precos[0] };
      
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
  
  // =========================================================================
  // API PÚBLICA - HISTÓRICO E ANÁLISE
  // =========================================================================
  
  /**
   * Obtém histórico de preços de um item
   * @param {string} itemId - ID do item
   * @param {Object} periodo - Período de análise
   * @returns {Object} Histórico
   */
  function getHistoricoItem(itemId, periodo) {
    try {
      if (!itemId) {
        return { success: false, error: 'Item é obrigatório' };
      }
    
      periodo = periodo || {};
    
      try {
        var precos = _getData(CONFIG.PRECOS_SHEET, { item_id: itemId });
      
        // Filtra por período
        if (periodo.dataInicio) {
          var inicio = new Date(periodo.dataInicio);
          precos = precos.filter(function(p) {
            return new Date(p.data_registro) >= inicio;
          });
        }
      
        if (periodo.dataFim) {
          var fim = new Date(periodo.dataFim);
          precos = precos.filter(function(p) {
            return new Date(p.data_registro) <= fim;
          });
        }
      
        // Ordena por data
        precos.sort(function(a, b) {
          return new Date(a.data_registro) - new Date(b.data_registro);
        });
      
        // Calcula estatísticas
        var valores = precos.map(function(p) { return p.preco; });
        var precoMinimo = Math.min.apply(null, valores);
        var precoMaximo = Math.max.apply(null, valores);
        var precoMedio = valores.reduce(function(a, b) { return a + b; }, 0) / valores.length;
      
        // Variação total
        var variacaoTotal = 0;
        if (precos.length >= 2) {
          variacaoTotal = _calcularVariacao(precos[0].preco, precos[precos.length - 1].preco);
        }
      
        return {
          success: true,
          data: {
            itemId: itemId,
            itemNome: precos.length > 0 ? precos[0].item_nome : '',
            registros: precos.length,
            historico: precos,
            estatisticas: {
              precoMinimo: precoMinimo,
              precoMaximo: precoMaximo,
              precoMedio: precoMedio,
              variacaoTotal: variacaoTotal,
            
              // Formatado
              precoMinimoFormatado: _formatarMoeda(precoMinimo),
              precoMaximoFormatado: _formatarMoeda(precoMaximo),
              precoMedioFormatado: _formatarMoeda(precoMedio)
            }
          }
        };
      
      } catch (e) {
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em getHistoricoItem: " + error.message);
      throw error;
    }
  }
  
  /**
   * Compara preços entre fornecedores
   * @param {string} itemId - ID do item
   * @returns {Object} Comparativo
   */
  function compararFornecedores(itemId) {
    try {
      if (!itemId) {
        return { success: false, error: 'Item é obrigatório' };
      }
    
      try {
        var precos = _getData(CONFIG.PRECOS_SHEET, { item_id: itemId });
      
        // Agrupa por fornecedor (último preço de cada)
        var porFornecedor = {};
      
        precos.forEach(function(p) {
          if (!porFornecedor[p.fornecedor_id]) {
            porFornecedor[p.fornecedor_id] = {
              fornecedorId: p.fornecedor_id,
              fornecedorNome: p.fornecedor_nome,
              precos: []
            };
          }
          porFornecedor[p.fornecedor_id].precos.push(p);
        });
      
        // Processa cada fornecedor
        var comparativo = Object.values(porFornecedor).map(function(f) {
          // Ordena preços por data
          f.precos.sort(function(a, b) {
            return new Date(b.data_registro) - new Date(a.data_registro);
          });
        
          var ultimoPreco = f.precos[0];
          var precoAnterior = f.precos.length > 1 ? f.precos[1] : null;
        
          return {
            fornecedorId: f.fornecedorId,
            fornecedorNome: f.fornecedorNome,
            precoAtual: ultimoPreco.preco,
            precoAtualFormatado: _formatarMoeda(ultimoPreco.preco),
            dataUltimoPreco: ultimoPreco.data_registro,
            variacao: precoAnterior ? _calcularVariacao(precoAnterior.preco, ultimoPreco.preco) : 0,
            totalRegistros: f.precos.length
          };
        });
      
        // Ordena por preço (menor primeiro)
        comparativo.sort(function(a, b) {
          return a.precoAtual - b.precoAtual;
        });
      
        // Marca melhor preço
        if (comparativo.length > 0) {
          comparativo[0].melhorPreco = true;
        }
      
        // Calcula economia potencial
        var menorPreco = comparativo.length > 0 ? comparativo[0].precoAtual : 0;
        var maiorPreco = comparativo.length > 0 ? comparativo[comparativo.length - 1].precoAtual : 0;
        var economiaPotencial = maiorPreco - menorPreco;
      
        return {
          success: true,
          data: {
            itemId: itemId,
            itemNome: precos.length > 0 ? precos[0].item_nome : '',
            fornecedores: comparativo,
            totalFornecedores: comparativo.length,
            economiaPotencial: economiaPotencial,
            economiaPotencialFormatado: _formatarMoeda(economiaPotencial),
            diferencaPercentual: menorPreco > 0 ? ((maiorPreco - menorPreco) / menorPreco * 100) : 0
          }
        };
      
      } catch (e) {
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em compararFornecedores: " + error.message);
      throw error;
    }
  }

  /**
   * Analisa tendência de preços
   * @param {Object} filtros - Filtros de análise
   * @returns {Object} Análise de tendência
   */
  function analisarTendencia(filtros) {
    try {
      filtros = filtros || {};
    
      try {
        var precos = _getData(CONFIG.PRECOS_SHEET, {});
      
        // Filtra por grupo
        if (filtros.grupo) {
          precos = precos.filter(function(p) { return p.item_grupo === filtros.grupo; });
        }
      
        // Filtra por período (últimos 12 meses por padrão)
        var dataLimite = new Date();
        dataLimite.setMonth(dataLimite.getMonth() - (filtros.meses || 12));
      
        precos = precos.filter(function(p) {
          return new Date(p.data_registro) >= dataLimite;
        });
      
        // Agrupa por mês
        var porMes = {};
      
        precos.forEach(function(p) {
          var mesAno = _formatarMesAno(p.data_registro);
          if (!porMes[mesAno]) {
            porMes[mesAno] = {
              mes: mesAno,
              precos: [],
              total: 0,
              quantidade: 0
            };
          }
          porMes[mesAno].precos.push(p.preco);
          porMes[mesAno].total += p.preco;
          porMes[mesAno].quantidade++;
        });
      
        // Calcula média por mês
        var tendencia = Object.values(porMes).map(function(m) {
          return {
            mes: m.mes,
            precoMedio: m.total / m.quantidade,
            registros: m.quantidade
          };
        });
      
        // Ordena por data
        tendencia.sort(function(a, b) {
          var [mesA, anoA] = a.mes.split('/');
          var [mesB, anoB] = b.mes.split('/');
          var meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
          var dataA = new Date(anoA, meses.indexOf(mesA));
          var dataB = new Date(anoB, meses.indexOf(mesB));
          return dataA - dataB;
        });
      
        // Calcula variação acumulada
        var variacaoAcumulada = 0;
        if (tendencia.length >= 2) {
          variacaoAcumulada = _calcularVariacao(
            tendencia[0].precoMedio,
            tendencia[tendencia.length - 1].precoMedio
          );
        }
      
        // Calcula média mensal de variação
        var variacaoMensal = tendencia.length > 1 ? variacaoAcumulada / (tendencia.length - 1) : 0;
      
        return {
          success: true,
          data: {
            periodo: {
              meses: filtros.meses || 12,
              grupo: filtros.grupo || 'Todos'
            },
            tendencia: tendencia,
            analise: {
              variacaoAcumulada: variacaoAcumulada,
              variacaoMensal: variacaoMensal,
              tendenciaTexto: variacaoAcumulada > 5 ? 'Alta' : 
                             variacaoAcumulada < -5 ? 'Baixa' : 'Estável',
              inflacaoAnualizada: variacaoMensal * 12
            }
          }
        };
      
      } catch (e) {
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em analisarTendencia: " + error.message);
      throw error;
    }
  }
  
  /**
   * Gera relatório para licitação
   * @param {Object} filtros - Filtros
   * @returns {Object} Relatório
   */
  function gerarRelatorioLicitacao(filtros) {
    try {
      filtros = filtros || {};
    
      try {
        var itens = _getData(CONFIG.ITENS_SHEET, { ativo: true });
      
        // Filtra por grupo se especificado
        if (filtros.grupo) {
          itens = itens.filter(function(i) { return i.grupo === filtros.grupo; });
        }
      
        var relatorio = {
          dataGeracao: new Date().toISOString(),
          itens: []
        };
      
        itens.forEach(function(item) {
          var historico = getHistoricoItem(item.id, { meses: filtros.meses || 12 });
          var comparativo = compararFornecedores(item.id);
        
          var itemRelatorio = {
            id: item.id,
            nome: item.nome,
            grupo: item.grupo,
            unidade: item.unidade,
          
            precoReferencia: null,
            precoMinimo: null,
            precoMaximo: null,
            precoMedio: null,
          
            fornecedores: [],
            variacaoUltimoAno: 0
          };
        
          if (historico.success && historico.data.registros > 0) {
            itemRelatorio.precoMinimo = historico.data.estatisticas.precoMinimo;
            itemRelatorio.precoMaximo = historico.data.estatisticas.precoMaximo;
            itemRelatorio.precoMedio = historico.data.estatisticas.precoMedio;
            itemRelatorio.variacaoUltimoAno = historico.data.estatisticas.variacaoTotal;
          
            // Preço de referência = média dos últimos 3 meses
            var ultimos3Meses = historico.data.historico.slice(-3);
            if (ultimos3Meses.length > 0) {
              var soma = ultimos3Meses.reduce(function(s, p) { return s + p.preco; }, 0);
              itemRelatorio.precoReferencia = soma / ultimos3Meses.length;
            }
          }
        
          if (comparativo.success) {
            itemRelatorio.fornecedores = comparativo.data.fornecedores.slice(0, 5);
          }
        
          relatorio.itens.push(itemRelatorio);
        });
      
        // Ordena por grupo e nome
        relatorio.itens.sort(function(a, b) {
          if (a.grupo !== b.grupo) return a.grupo.localeCompare(b.grupo);
          return a.nome.localeCompare(b.nome);
        });
      
        return {
          success: true,
          data: relatorio
        };
      
      } catch (e) {
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em gerarRelatorioLicitacao: " + error.message);
      throw error;
    }
  }
  
  /**
   * Calcula reajuste contratual
   * @param {Object} dados - Dados do contrato
   * @returns {Object} Cálculo de reajuste
   */
  function calcularReajuste(dados) {
    try {
      if (!dados || !dados.contrato_id) {
        return { success: false, error: 'Contrato é obrigatório' };
      }
    
      try {
        // Busca preços do contrato
        var precos = _getData(CONFIG.PRECOS_SHEET, { contrato_id: dados.contrato_id });
      
        if (precos.length === 0) {
          return { success: false, error: 'Nenhum preço encontrado para o contrato' };
        }
      
        // Agrupa por item
        var porItem = {};
        precos.forEach(function(p) {
          if (!porItem[p.item_id]) {
            porItem[p.item_id] = {
              itemId: p.item_id,
              itemNome: p.item_nome,
              precos: []
            };
          }
          porItem[p.item_id].precos.push(p);
        });
      
        // Calcula variação por item
        var itensReajuste = Object.values(porItem).map(function(item) {
          item.precos.sort(function(a, b) {
            return new Date(a.data_registro) - new Date(b.data_registro);
          });
        
          var precoInicial = item.precos[0].preco;
          var precoAtual = item.precos[item.precos.length - 1].preco;
          var variacao = _calcularVariacao(precoInicial, precoAtual);
        
          return {
            itemId: item.itemId,
            itemNome: item.itemNome,
            precoInicial: precoInicial,
            precoAtual: precoAtual,
            variacao: variacao,
            reajusteSugerido: variacao > 0 ? variacao : 0
          };
        });
      
        // Calcula média de reajuste
        var somaVariacoes = itensReajuste.reduce(function(s, i) { return s + i.variacao; }, 0);
        var mediaReajuste = somaVariacoes / itensReajuste.length;
      
        // Índice de referência (pode ser IPCA, IGP-M, etc.)
        var indiceReferencia = dados.indice || 5.5; // Valor exemplo
      
        return {
          success: true,
          data: {
            contratoId: dados.contrato_id,
            itens: itensReajuste,
            resumo: {
              totalItens: itensReajuste.length,
              mediaVariacao: mediaReajuste,
              indiceReferencia: indiceReferencia,
              reajusteSugerido: Math.max(mediaReajuste, indiceReferencia),
            
              // Formatado
              mediaVariacaoFormatada: mediaReajuste.toFixed(2) + '%',
              reajusteSugeridoFormatado: Math.max(mediaReajuste, indiceReferencia).toFixed(2) + '%'
            }
          }
        };
      
      } catch (e) {
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em calcularReajuste: " + error.message);
      throw error;
    }
  }
  
  /**
   * Obtém itens com maior variação de preço
   * @param {Object} filtros - Filtros
   * @returns {Object} Lista de itens
   */
  function getItensComMaiorVariacao(filtros) {
    try {
      filtros = filtros || {};
      var limite = filtros.limite || 10;
    
      try {
        var itens = _getData(CONFIG.ITENS_SHEET, { ativo: true });
      
        var variacoes = [];
      
        itens.forEach(function(item) {
          var historico = getHistoricoItem(item.id, { meses: filtros.meses || 6 });
        
          if (historico.success && historico.data.registros >= 2) {
            variacoes.push({
              itemId: item.id,
              itemNome: item.nome,
              grupo: item.grupo,
              variacao: historico.data.estatisticas.variacaoTotal,
              precoAtual: historico.data.historico[historico.data.historico.length - 1].preco
            });
          }
        });
      
        // Ordena por variação absoluta (maior primeiro)
        variacoes.sort(function(a, b) {
          return Math.abs(b.variacao) - Math.abs(a.variacao);
        });
      
        return {
          success: true,
          data: {
            itens: variacoes.slice(0, limite),
            total: variacoes.length
          }
        };
      
      } catch (e) {
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em getItensComMaiorVariacao: " + error.message);
      throw error;
    }
  }
  
  /**
   * Obtém grupos de alimentos
   * @returns {Object} Grupos
   */
  function getGrupos() {
    return { success: true, data: CONFIG.GRUPOS };
  }
  
  // =========================================================================
  // API PÚBLICA DO MÓDULO
  // =========================================================================
  
  return {
    // Registro
    registrarPreco: registrarPreco,
    registrarPrecosLote: registrarPrecosLote,
    getUltimoPreco: getUltimoPreco,
    
    // Histórico e análise
    getHistoricoItem: getHistoricoItem,
    compararFornecedores: compararFornecedores,
    analisarTendencia: analisarTendencia,
    
    // Relatórios
    gerarRelatorioLicitacao: gerarRelatorioLicitacao,
    calcularReajuste: calcularReajuste,
    getItensComMaiorVariacao: getItensComMaiorVariacao,
    
    // Utilitários
    getGrupos: getGrupos,
    
    // Constantes
    GRUPOS: CONFIG.GRUPOS
  };
  
})();

// ============================================================================
// FUNÇÕES GLOBAIS - API para Frontend
// ============================================================================

function api_preco_registrar(dados) {
  return PriceHistory.registrarPreco(dados);
}

function api_preco_registrarLote(dados) {
  return PriceHistory.registrarPrecosLote(dados);
}

function api_preco_ultimo(itemId, fornecedorId) {
  return PriceHistory.getUltimoPreco(itemId, fornecedorId);
}

function api_preco_historico(itemId, periodo) {
  return PriceHistory.getHistoricoItem(itemId, periodo);
}

function api_preco_compararFornecedores(itemId) {
  return PriceHistory.compararFornecedores(itemId);
}

function api_preco_tendencia(filtros) {
  return PriceHistory.analisarTendencia(filtros);
}

function api_preco_relatorioLicitacao(filtros) {
  return PriceHistory.gerarRelatorioLicitacao(filtros);
}

function api_preco_calcularReajuste(dados) {
  return PriceHistory.calcularReajuste(dados);
}

function api_preco_maiorVariacao(filtros) {
  return PriceHistory.getItensComMaiorVariacao(filtros);
}

function api_preco_getGrupos() {
  return PriceHistory.getGrupos();
}

// ============================================================================
// REGISTRO DO MÓDULO
// ============================================================================

(function() {
  var moduleName = 'PriceHistory';
  var moduleVersion = '1.0.0';
  
  try {
    if (typeof ServiceContainer !== 'undefined') {
      ServiceContainer.register(moduleName, PriceHistory);
    }
    
    Logger.log('[' + moduleName + ' v' + moduleVersion + '] Módulo carregado');
    Logger.log('[' + moduleName + '] Alertas de variação: 15% (atenção), 30% (crítico)');
    
  } catch (e) {
    console.error('[' + moduleName + '] Erro ao registrar: ' + e.message);
  }
})();
