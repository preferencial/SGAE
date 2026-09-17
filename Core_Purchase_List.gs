/**
 * @fileoverview Gerador de Lista de Compras - Alimentação Escolar CRE-PP
 * @version 1.0.0
 * 
 * Intervenção 16/38: PurchaseListGenerator conforme Prompt 16
 * 
 * Consolida cardápios de todas as UEs da CRE-PP e gera:
 * - Lista de quantidades necessárias por fornecedor
 * - Agrupamento por período selecionado
 * - Cálculo de custos estimados
 * - Verificação de saldos de empenho
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-25
 */

'use strict';

// ============================================================================
// PURCHASE LIST GENERATOR - Gerador de Lista de Compras
// ============================================================================

var PurchaseListGenerator = (function() {
  
  // =========================================================================
  // CONFIGURAÇÃO
  // =========================================================================
  
  var CONFIG = {
    SHEETS: {
      CARDAPIOS_SEMANAIS: 'Cardapios_Semanais',
      ITENS_CARDAPIO: 'Itens_Cardapio',
      ITENS_ALIMENTARES: 'Itens_Alimentares',
      ESCOLAS: 'Escolas',
      CONTRATOS: 'Contratos_Empenho',
      FORNECEDORES: 'Fornecedores',
      LISTAS_COMPRAS: 'Listas_Compras'
    },
    
    // Margem de segurança para quantidades
    MARGEM_SEGURANCA: 1.05, // 5% extra
    
    // Status de lista
    STATUS: {
      RASCUNHO: 'RASCUNHO',
      GERADA: 'GERADA',
      APROVADA: 'APROVADA',
      ENVIADA: 'ENVIADA',
      FINALIZADA: 'FINALIZADA'
    },
    
    // Unidades de conversão (para kg)
    CONVERSAO_KG: {
      'g': 0.001,
      'kg': 1,
      'mg': 0.000001,
      'un': 0.1,      // Estimativa média
      'dz': 0.6,      // Estimativa (dúzia de ovos ~600g)
      'l': 1,         // 1L ≈ 1kg para líquidos
      'ml': 0.001
    }
  };
  
  // =========================================================================
  // FUNÇÕES PRIVADAS
  // =========================================================================
  
  function _getSheet(nome) {
    try {
      var ss = getSS();
      return ss.getSheetByName(nome);
    } catch (error) {
      Logger.log("Erro em _getSheet: " + error.message);
      throw error;
    }
  }
  
  function _generateId(prefix) {
    try {
      return (prefix || 'LC') + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6);
    } catch (error) {
      Logger.log("Erro em _generateId: " + error.message);
      throw error;
    }
  }
  
  function _getCurrentUser() {
    try {
      try {
        return Session.getActiveUser().getEmail() || 'sistema';
      } catch (e) {
        return 'sistema';
      }
    } catch (error) {
      Logger.log("Erro em _getCurrentUser: " + error.message);
      throw error;
    }
  }
  
  function _rowToObject(row, headers) {
    var obj = {};
    headers.forEach(function(h, idx) { obj[h] = row[idx]; });
    return obj;
  }
  
  /**
   * Carrega dados de uma planilha como objeto indexado por ID
   * @private
   */
  function _loadSheetData(sheetName, keyField) {
    try {
      keyField = keyField || 'ID';
      var sheet = _getSheet(sheetName);
      if (!sheet || sheet.getLastRow() <= 1) return {};
    
      var data = sheet.getDataRange().getValues();
      var headers = data[0];
      var result = {};
    
      for (var i = 1; i < data.length; i++) {
        var row = _rowToObject(data[i], headers);
        if (row[keyField]) {
          result[row[keyField]] = row;
        }
      }
    
      return result;
    } catch (error) {
      Logger.log("Erro em _loadSheetData: " + error.message);
      throw error;
    }
  }
  
  /**
   * Converte quantidade para kg
   * @private
   */
  function _converterParaKg(quantidade, unidade) {
    try {
      try {
        var un = (unidade || 'g').toLowerCase();
        var fator = CONFIG.CONVERSAO_KG[un] || CONFIG.CONVERSAO_KG['g'];
        return quantidade * fator;
      } catch (error) {
        Logger.log("Erro em _converterParaKg: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em _converterParaKg: " + error.message);
      throw error;
    }
  }

  // =========================================================================
  // API PÚBLICA
  // =========================================================================
  
  return {
    CONFIG: CONFIG,
    
    // -----------------------------------------------------------------------
    // GERAÇÃO DE LISTA DE COMPRAS
    // -----------------------------------------------------------------------
    
    /**
     * Gera lista de compras consolidada para período
     * @param {Object} params - { semanaInicio, semanaFim, ano, escolaIds }
     * @returns {Object} Lista de compras consolidada
     */
    gerarLista: function(params) {
      try {
        try {
          params = params || {};
          var ano = params.ano || new Date().getFullYear();
          var semanaInicio = params.semanaInicio || 1;
          var semanaFim = params.semanaFim || semanaInicio;
          var escolaIds = params.escolaIds || null; // null = todas
        
          // Carrega dados necessários
          var itensAlimentares = _loadSheetData(CONFIG.SHEETS.ITENS_ALIMENTARES);
          var escolas = _loadSheetData(CONFIG.SHEETS.ESCOLAS);
          var contratos = _loadSheetData(CONFIG.SHEETS.CONTRATOS);
          var fornecedores = _loadSheetData(CONFIG.SHEETS.FORNECEDORES);
        
          // Obtém cardápios do período
          var cardapiosSheet = _getSheet(CONFIG.SHEETS.CARDAPIOS_SEMANAIS);
          var itensCardapioSheet = _getSheet(CONFIG.SHEETS.ITENS_CARDAPIO);
        
          if (!cardapiosSheet || cardapiosSheet.getLastRow() <= 1) {
            return { success: false, error: 'Nenhum cardápio encontrado' };
          }
        
          var cardapiosData = cardapiosSheet.getDataRange().getValues();
          var cardapiosHeaders = cardapiosData[0];
        
          // Filtra cardápios do período
          var cardapiosFiltrados = [];
          for (var i = 1; i < cardapiosData.length; i++) {
            var cardapio = _rowToObject(cardapiosData[i], cardapiosHeaders);
          
            // Verifica período
            if (cardapio.Ano !== ano) continue;
            if (cardapio.Semana < semanaInicio || cardapio.Semana > semanaFim) continue;
          
            // Verifica escola
            if (escolaIds && escolaIds.length > 0) {
              if (escolaIds.indexOf(cardapio.Escola_ID) === -1) continue;
            }
          
            // Verifica status (apenas publicados)
            if (cardapio.Status !== 'PUBLICADO' && cardapio.Status !== 'APROVADO') continue;
          
            cardapiosFiltrados.push(cardapio);
          }
        
          if (cardapiosFiltrados.length === 0) {
            return { success: false, error: 'Nenhum cardápio publicado no período' };
          }
        
          // Consolida itens
          var consolidado = {};
          var escolasIncluidas = {};
        
          // Obtém itens dos cardápios
          var itensData = itensCardapioSheet ? itensCardapioSheet.getDataRange().getValues() : [];
          var itensHeaders = itensData.length > 0 ? itensData[0] : [];
        
          cardapiosFiltrados.forEach(function(cardapio) {
            var escolaId = cardapio.Escola_ID;
            var escola = escolas[escolaId] || { Nome: escolaId, Num_Alunos: 100 };
            var numAlunos = Number(escola.Num_Alunos) || 100;
          
            escolasIncluidas[escolaId] = {
              nome: escola.Nome,
              alunos: numAlunos
            };
          
            // Busca itens deste cardápio
            for (var j = 1; j < itensData.length; j++) {
              var itemCardapio = _rowToObject(itensData[j], itensHeaders);
            
              if (itemCardapio.Cardapio_ID !== cardapio.ID && 
                  itemCardapio.Cardapio_ID !== cardapio.Cardapio_Base_ID) continue;
            
              var itemId = itemCardapio.Item_ID;
              var itemInfo = itensAlimentares[itemId] || { Nome: itemId, Unidade_Medida: 'g' };
              var quantidadePorAluno = Number(itemCardapio.Quantidade_g) || 100;
              var quantidadeTotal = quantidadePorAluno * numAlunos;
            
              if (!consolidado[itemId]) {
                consolidado[itemId] = {
                  itemId: itemId,
                  nome: itemInfo.Nome,
                  grupo: itemInfo.Grupo_Alimentar,
                  unidade: itemInfo.Unidade_Medida || 'g',
                  quantidadeTotal: 0,
                  quantidadeKg: 0,
                  escolas: {},
                  cardapios: []
                };
              }
            
              consolidado[itemId].quantidadeTotal += quantidadeTotal;
              consolidado[itemId].escolas[escolaId] = (consolidado[itemId].escolas[escolaId] || 0) + quantidadeTotal;
              consolidado[itemId].cardapios.push(cardapio.ID);
            }
          });
        
          // Converte para kg e aplica margem
          var itensLista = [];
          for (var id in consolidado) {
            var item = consolidado[id];
            item.quantidadeKg = _converterParaKg(item.quantidadeTotal, item.unidade);
            item.quantidadeComMargem = item.quantidadeKg * CONFIG.MARGEM_SEGURANCA;
            item.quantidadeComMargem = Math.ceil(item.quantidadeComMargem * 100) / 100;
            item.numEscolas = Object.keys(item.escolas).length;
            itensLista.push(item);
          }
        
          // Ordena por grupo e nome
          itensLista.sort(function(a, b) {
            if (a.grupo !== b.grupo) return (a.grupo || '').localeCompare(b.grupo || '');
            return (a.nome || '').localeCompare(b.nome || '');
          });
        
          // Gera resultado
          var resultado = {
            success: true,
            id: _generateId('LC'),
            periodo: {
              ano: ano,
              semanaInicio: semanaInicio,
              semanaFim: semanaFim,
              descricao: 'Semana ' + semanaInicio + (semanaFim !== semanaInicio ? ' a ' + semanaFim : '') + '/' + ano
            },
            escolas: escolasIncluidas,
            numEscolas: Object.keys(escolasIncluidas).length,
            cardapiosProcessados: cardapiosFiltrados.length,
            itens: itensLista,
            totalItens: itensLista.length,
            geradoEm: new Date(),
            geradoPor: _getCurrentUser()
          };
        
          return resultado;
        
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em gerarLista: " + error.message);
        throw error;
      }
    },

    // -----------------------------------------------------------------------
    // AGRUPAMENTO POR FORNECEDOR
    // -----------------------------------------------------------------------
    
    /**
     * Agrupa lista de compras por fornecedor
     * @param {Object} lista - Lista gerada por gerarLista()
     * @returns {Object} Lista agrupada por fornecedor
     */
    agruparPorFornecedor: function(lista) {
      try {
        try {
          if (!lista || !lista.itens) {
            return { success: false, error: 'Lista inválida' };
          }
        
          var contratos = _loadSheetData(CONFIG.SHEETS.CONTRATOS);
          var fornecedores = _loadSheetData(CONFIG.SHEETS.FORNECEDORES);
        
          // Mapeia itens para fornecedores via contratos
          var itemFornecedor = {};
          for (var contratoId in contratos) {
            var contrato = contratos[contratoId];
            if (contrato.Status === 'ATIVO' && contrato.Item_ID) {
              itemFornecedor[contrato.Item_ID] = {
                fornecedorId: contrato.Fornecedor_ID,
                contratoId: contratoId,
                precoUnitario: Number(contrato.Preco_Unitario) || 0,
                saldo: Number(contrato.Saldo) || 0
              };
            }
          }
        
          // Agrupa por fornecedor
          var porFornecedor = {};
          var semFornecedor = [];
        
          lista.itens.forEach(function(item) {
            var vinculo = itemFornecedor[item.itemId];
          
            if (vinculo) {
              var fornecedorId = vinculo.fornecedorId;
              var fornecedor = fornecedores[fornecedorId] || { Razao_Social: fornecedorId };
            
              if (!porFornecedor[fornecedorId]) {
                porFornecedor[fornecedorId] = {
                  fornecedorId: fornecedorId,
                  razaoSocial: fornecedor.Razao_Social,
                  cnpj: fornecedor.CNPJ,
                  email: fornecedor.Email,
                  telefone: fornecedor.Telefone,
                  itens: [],
                  valorTotal: 0,
                  saldoDisponivel: 0
                };
              }
            
              var custoItem = item.quantidadeComMargem * vinculo.precoUnitario;
            
              porFornecedor[fornecedorId].itens.push({
                itemId: item.itemId,
                nome: item.nome,
                quantidade: item.quantidadeComMargem,
                unidade: 'kg',
                precoUnitario: vinculo.precoUnitario,
                custoEstimado: Math.round(custoItem * 100) / 100,
                contratoId: vinculo.contratoId,
                saldoContrato: vinculo.saldo
              });
            
              porFornecedor[fornecedorId].valorTotal += custoItem;
              porFornecedor[fornecedorId].saldoDisponivel = Math.max(
                porFornecedor[fornecedorId].saldoDisponivel,
                vinculo.saldo
              );
            
            } else {
              semFornecedor.push({
                itemId: item.itemId,
                nome: item.nome,
                quantidade: item.quantidadeComMargem,
                unidade: 'kg',
                motivo: 'Sem contrato ativo'
              });
            }
          });
        
          // Converte para array e calcula alertas
          var fornecedoresLista = [];
          for (var fId in porFornecedor) {
            var f = porFornecedor[fId];
            f.valorTotal = Math.round(f.valorTotal * 100) / 100;
            f.totalItens = f.itens.length;
          
            // Alerta se valor excede saldo
            f.alertaSaldo = f.valorTotal > f.saldoDisponivel;
          
            fornecedoresLista.push(f);
          }
        
          // Ordena por valor total (maior primeiro)
          fornecedoresLista.sort(function(a, b) {
            return b.valorTotal - a.valorTotal;
          });
        
          return {
            success: true,
            periodo: lista.periodo,
            fornecedores: fornecedoresLista,
            totalFornecedores: fornecedoresLista.length,
            itensSemFornecedor: semFornecedor,
            valorTotalGeral: fornecedoresLista.reduce(function(sum, f) { return sum + f.valorTotal; }, 0)
          };
        
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em agruparPorFornecedor: " + error.message);
        throw error;
      }
    },

    // -----------------------------------------------------------------------
    // AGRUPAMENTO POR GRUPO ALIMENTAR
    // -----------------------------------------------------------------------
    
    /**
     * Agrupa lista por grupo alimentar
     * @param {Object} lista - Lista gerada
     * @returns {Object} Lista agrupada
     */
    agruparPorGrupo: function(lista) {
      try {
        try {
          if (!lista || !lista.itens) {
            return { success: false, error: 'Lista inválida' };
          }
        
          var porGrupo = {};
        
          lista.itens.forEach(function(item) {
            var grupo = item.grupo || 'OUTROS';
          
            if (!porGrupo[grupo]) {
              porGrupo[grupo] = {
                grupo: grupo,
                itens: [],
                quantidadeTotalKg: 0
              };
            }
          
            porGrupo[grupo].itens.push(item);
            porGrupo[grupo].quantidadeTotalKg += item.quantidadeComMargem;
          });
        
          // Converte para array
          var grupos = [];
          for (var g in porGrupo) {
            var grupo = porGrupo[g];
            grupo.quantidadeTotalKg = Math.round(grupo.quantidadeTotalKg * 100) / 100;
            grupo.totalItens = grupo.itens.length;
            grupos.push(grupo);
          }
        
          // Ordena por quantidade
          grupos.sort(function(a, b) {
            return b.quantidadeTotalKg - a.quantidadeTotalKg;
          });
        
          return {
            success: true,
            periodo: lista.periodo,
            grupos: grupos,
            totalGrupos: grupos.length
          };
        
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em agruparPorGrupo: " + error.message);
        throw error;
      }
    },
    
    // -----------------------------------------------------------------------
    // VERIFICAÇÃO DE SALDOS
    // -----------------------------------------------------------------------
    
    /**
     * Verifica saldos de empenho para a lista
     * @param {Object} listaFornecedores - Lista agrupada por fornecedor
     * @returns {Object} Análise de saldos
     */
    verificarSaldos: function(listaFornecedores) {
      try {
        try {
          if (!listaFornecedores || !listaFornecedores.fornecedores) {
            return { success: false, error: 'Lista inválida' };
          }
        
          var analise = {
            fornecedoresOk: [],
            fornecedoresAlerta: [],
            fornecedoresCritico: [],
            resumo: {
              total: 0,
              ok: 0,
              alerta: 0,
              critico: 0
            }
          };
        
          listaFornecedores.fornecedores.forEach(function(f) {
            analise.resumo.total++;
          
            var percentualUso = f.saldoDisponivel > 0 
              ? (f.valorTotal / f.saldoDisponivel) * 100 
              : 100;
          
            var status = {
              fornecedor: f.razaoSocial,
              fornecedorId: f.fornecedorId,
              valorNecessario: f.valorTotal,
              saldoDisponivel: f.saldoDisponivel,
              percentualUso: Math.round(percentualUso),
              diferenca: f.saldoDisponivel - f.valorTotal
            };
          
            if (percentualUso <= 80) {
              status.situacao = 'OK';
              analise.fornecedoresOk.push(status);
              analise.resumo.ok++;
            } else if (percentualUso <= 100) {
              status.situacao = 'ALERTA';
              status.mensagem = 'Saldo próximo do limite (' + status.percentualUso + '%)';
              analise.fornecedoresAlerta.push(status);
              analise.resumo.alerta++;
            } else {
              status.situacao = 'CRITICO';
              status.mensagem = 'Saldo INSUFICIENTE - Faltam R$ ' + Math.abs(status.diferenca).toFixed(2);
              analise.fornecedoresCritico.push(status);
              analise.resumo.critico++;
            }
          });
        
          analise.success = true;
          analise.temProblemas = analise.resumo.critico > 0;
          analise.temAlertas = analise.resumo.alerta > 0;
        
          return analise;
        
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em verificarSaldos: " + error.message);
        throw error;
      }
    },

    // -----------------------------------------------------------------------
    // EXPORTAÇÃO
    // -----------------------------------------------------------------------
    
    /**
     * Exporta lista para formato de pedido por fornecedor
     * @param {Object} listaFornecedores - Lista agrupada por fornecedor
     * @param {string} fornecedorId - ID do fornecedor específico (opcional)
     * @returns {Object} Dados formatados para pedido
     */
    exportarPedido: function(listaFornecedores, fornecedorId) {
      try {
        var fornecedores = listaFornecedores.fornecedores;
        
        if (fornecedorId) {
          fornecedores = fornecedores.filter(function(f) {
            return f.fornecedorId === fornecedorId;
          });
        }
        
        var pedidos = fornecedores.map(function(f) {
          return {
            fornecedor: {
              id: f.fornecedorId,
              razaoSocial: f.razaoSocial,
              cnpj: f.cnpj,
              email: f.email,
              telefone: f.telefone
            },
            periodo: listaFornecedores.periodo,
            itens: f.itens.map(function(item) {
              return {
                descricao: item.nome,
                quantidade: item.quantidade,
                unidade: item.unidade,
                precoUnitario: item.precoUnitario,
                valorTotal: item.custoEstimado
              };
            }),
            valorTotal: f.valorTotal,
            observacoes: '',
            dataEmissao: new Date(),
            emitidoPor: _getCurrentUser()
          };
        });
        
        return {
          success: true,
          pedidos: pedidos,
          totalPedidos: pedidos.length
        };
        
      } catch (e) {
        return { success: false, error: e.message };
      }
    },
    
    /**
     * Gera resumo executivo da lista
     * @param {Object} lista - Lista gerada
     * @param {Object} listaFornecedores - Lista agrupada por fornecedor
     * @returns {Object} Resumo executivo
     */
    gerarResumo: function(lista, listaFornecedores) {
      try {
        try {
          var resumo = {
            titulo: 'Lista de Compras - ' + lista.periodo.descricao,
            geradoEm: lista.geradoEm,
            geradoPor: lista.geradoPor,
          
            escolas: {
              quantidade: lista.numEscolas,
              lista: Object.keys(lista.escolas).map(function(id) {
                return lista.escolas[id].nome;
              })
            },
          
            cardapios: {
              processados: lista.cardapiosProcessados
            },
          
            itens: {
              total: lista.totalItens,
              porGrupo: {}
            },
          
            financeiro: {
              valorTotal: listaFornecedores ? listaFornecedores.valorTotalGeral : 0,
              valorFormatado: listaFornecedores 
                ? 'R$ ' + listaFornecedores.valorTotalGeral.toFixed(2).replace('.', ',')
                : 'R$ 0,00',
              fornecedores: listaFornecedores ? listaFornecedores.totalFornecedores : 0
            },
          
            alertas: []
          };
        
          // Conta itens por grupo
          lista.itens.forEach(function(item) {
            var grupo = item.grupo || 'OUTROS';
            resumo.itens.porGrupo[grupo] = (resumo.itens.porGrupo[grupo] || 0) + 1;
          });
        
          // Adiciona alertas
          if (listaFornecedores && listaFornecedores.itensSemFornecedor.length > 0) {
            resumo.alertas.push({
              tipo: 'AVISO',
              mensagem: listaFornecedores.itensSemFornecedor.length + ' itens sem fornecedor definido'
            });
          }
        
          var verificacao = this.verificarSaldos(listaFornecedores);
          if (verificacao.temProblemas) {
            resumo.alertas.push({
              tipo: 'CRITICO',
              mensagem: verificacao.resumo.critico + ' fornecedor(es) com saldo insuficiente'
            });
          }
          if (verificacao.temAlertas) {
            resumo.alertas.push({
              tipo: 'ALERTA',
              mensagem: verificacao.resumo.alerta + ' fornecedor(es) com saldo próximo do limite'
            });
          }
        
          resumo.success = true;
          return resumo;
        
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em gerarResumo: " + error.message);
        throw error;
      }
    },
    
    // -----------------------------------------------------------------------
    // SALVAR E RECUPERAR LISTAS
    // -----------------------------------------------------------------------
    
    /**
     * Salva lista de compras
     * @param {Object} lista - Lista a salvar
     * @returns {Object} Resultado
     */
    salvarLista: function(lista) {
      try {
        try {
          var sheet = _getSheet(CONFIG.SHEETS.LISTAS_COMPRAS);
          if (!sheet) {
            // Cria planilha se não existir
            var ss = getSS();
            sheet = ss.insertSheet(CONFIG.SHEETS.LISTAS_COMPRAS);
            sheet.appendRow(['ID', 'Periodo', 'Ano', 'Semana_Inicio', 'Semana_Fim', 
                            'Num_Escolas', 'Num_Itens', 'Valor_Total', 'Status',
                            'Dados_JSON', 'Gerado_Por', 'Data_Geracao']);
          }
        
          var id = lista.id || _generateId('LC');
        
          var registro = [
            id,
            lista.periodo.descricao,
            lista.periodo.ano,
            lista.periodo.semanaInicio,
            lista.periodo.semanaFim,
            lista.numEscolas,
            lista.totalItens,
            lista.valorTotal || 0,
            CONFIG.STATUS.GERADA,
            JSON.stringify(lista),
            _getCurrentUser(),
            new Date()
          ];
        
          sheet.appendRow(registro);
        
          return { success: true, id: id, message: 'Lista salva com sucesso' };
        
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em salvarLista: " + error.message);
        throw error;
      }
    }
  };
})();


// ============================================================================
// FUNÇÕES GLOBAIS DE API
// ============================================================================

/**
 * API: Gera lista de compras para período
 */
function api_lista_compras_gerar(params) {
  return PurchaseListGenerator.gerarLista(params);
}

/**
 * API: Agrupa lista por fornecedor
 */
function api_lista_compras_por_fornecedor(lista) {
  return PurchaseListGenerator.agruparPorFornecedor(lista);
}

/**
 * API: Agrupa lista por grupo alimentar
 */
function api_lista_compras_por_grupo(lista) {
  return PurchaseListGenerator.agruparPorGrupo(lista);
}

/**
 * API: Verifica saldos de empenho
 */
function api_lista_compras_verificar_saldos(listaFornecedores) {
  return PurchaseListGenerator.verificarSaldos(listaFornecedores);
}

/**
 * API: Exporta pedido para fornecedor
 */
function api_lista_compras_exportar_pedido(listaFornecedores, fornecedorId) {
  return PurchaseListGenerator.exportarPedido(listaFornecedores, fornecedorId);
}

/**
 * API: Gera resumo executivo
 */
function api_lista_compras_resumo(lista, listaFornecedores) {
  return PurchaseListGenerator.gerarResumo(lista, listaFornecedores);
}

/**
 * API: Salva lista
 */
function api_lista_compras_salvar(lista) {
  return PurchaseListGenerator.salvarLista(lista);
}

/**
 * Função completa: Gera lista, agrupa e retorna resumo
 */
function api_gerar_lista_compras_completa(params) {
  // 1. Gera lista base
  var lista = PurchaseListGenerator.gerarLista(params);
  if (!lista.success) return lista;
  
  // 2. Agrupa por fornecedor
  var porFornecedor = PurchaseListGenerator.agruparPorFornecedor(lista);
  
  // 3. Agrupa por grupo alimentar
  var porGrupo = PurchaseListGenerator.agruparPorGrupo(lista);
  
  // 4. Verifica saldos
  var saldos = PurchaseListGenerator.verificarSaldos(porFornecedor);
  
  // 5. Gera resumo
  var resumo = PurchaseListGenerator.gerarResumo(lista, porFornecedor);
  
  return {
    success: true,
    lista: lista,
    porFornecedor: porFornecedor,
    porGrupo: porGrupo,
    verificacaoSaldos: saldos,
    resumo: resumo
  };
}

/**
 * Gera lista de compras para semana atual
 */
function api_lista_compras_semana_atual() {
  var hoje = new Date();
  var inicio = new Date(hoje.getFullYear(), 0, 1);
  var semana = Math.ceil(((hoje - inicio) / 86400000 + inicio.getDay() + 1) / 7);
  
  return api_gerar_lista_compras_completa({
    ano: hoje.getFullYear(),
    semanaInicio: semana,
    semanaFim: semana
  });
}

// ============================================================================
// REGISTRO DO MÓDULO
// ============================================================================

Logger.log('✅ Core_Purchase_List.gs carregado - PurchaseListGenerator disponível');
