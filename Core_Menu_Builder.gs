/**
 * @fileoverview Engine de Composição de Cardápios - Alimentação Escolar CRE-PP
 * @version 1.0.0
 * 
 * Intervenção 12/38: MenuBuilder conforme Prompt 12
 * 
 * Lógica para compor cardápios semanais baseados em 'Cardápios Base':
 * - Arrastar itens para dias da semana
 * - Cálculo automático de custo total baseado em contratos vigentes
 * - Validação nutricional integrada
 * - Geração de cardápios por faixa etária
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-25
 */

'use strict';

// ============================================================================
// MENU BUILDER - Engine de Composição de Cardápios
// ============================================================================

var MenuBuilder = (function() {
  
  // =========================================================================
  // CONFIGURAÇÃO
  // =========================================================================
  
  var CONFIG = {
    SHEETS: {
      CARDAPIOS_BASE: 'Cardapios_Base',
      CARDAPIOS_SEMANAIS: 'Cardapios_Semanais',
      ITENS_CARDAPIO: 'Itens_Cardapio',
      ITENS_ALIMENTARES: 'Itens_Alimentares',
      CONTRATOS: 'Contratos_Empenho'
    },
    
    DIAS_SEMANA: ['Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta'],
    
    TIPOS_REFEICAO: {
      DESJEJUM: 'Desjejum',
      ALMOCO: 'Almoço',
      LANCHE: 'Lanche',
      JANTAR: 'Jantar'
    },
    
    FAIXAS_ETARIAS: {
      CRECHE_0_11M: { nome: 'Creche 0-11 meses', calorias: 200 },
      CRECHE_1_3A: { nome: 'Creche 1-3 anos', calorias: 300 },
      CRECHE_4_5A: { nome: 'Creche 4-5 anos', calorias: 270 },
      FUNDAMENTAL_6_10A: { nome: 'Fundamental 6-10 anos', calorias: 300 },
      FUNDAMENTAL_11_15A: { nome: 'Fundamental 11-15 anos', calorias: 435 },
      MEDIO_16_18A: { nome: 'Médio 16-18 anos', calorias: 435 },
      EJA: { nome: 'EJA Adulto', calorias: 435 },
      INTEGRAL: { nome: 'Tempo Integral', calorias: 1000 }
    },
    
    STATUS: {
      RASCUNHO: 'RASCUNHO',
      PENDENTE_APROVACAO: 'PENDENTE_APROVACAO',
      APROVADO: 'APROVADO',
      PUBLICADO: 'PUBLICADO',
      ARQUIVADO: 'ARQUIVADO'
    }
  };

  // =========================================================================
  // CACHE DE DADOS
  // =========================================================================
  
  var _cache = {
    itensAlimentares: null,
    precosContratos: null,
    lastUpdate: null
  };
  
  /**
   * Carrega itens alimentares em cache
   * @private
   */
  function _loadItensAlimentares() {
    try {
      if (_cache.itensAlimentares && _cache.lastUpdate && 
          (Date.now() - _cache.lastUpdate) < 300000) { // 5 min cache
        return _cache.itensAlimentares;
      }
    
      try {
        var ss = getSS();
        var sheet = ss.getSheetByName(CONFIG.SHEETS.ITENS_ALIMENTARES);
        if (!sheet || sheet.getLastRow() <= 1) return {};
      
        var data = sheet.getDataRange().getValues();
        var headers = data[0];
        var itens = {};
      
        for (var i = 1; i < data.length; i++) {
          var item = {};
          headers.forEach(function(h, idx) { item[h] = data[i][idx]; });
          if (item.ID && item.Ativo !== false) {
            itens[item.ID] = item;
          }
        }
      
        _cache.itensAlimentares = itens;
        _cache.lastUpdate = Date.now();
        return itens;
      
      } catch (e) {
        console.error('Erro ao carregar itens: ' + e.message);
        return {};
      }
    } catch (error) {
      Logger.log("Erro em _loadItensAlimentares: " + error.message);
      throw error;
    }
  }
  
  /**
   * Carrega preços dos contratos vigentes
   * @private
   */
  function _loadPrecosContratos() {
    try {
      try {
        try {
          var ss = getSS();
          var sheet = ss.getSheetByName(CONFIG.SHEETS.CONTRATOS);
          if (!sheet || sheet.getLastRow() <= 1) return {};
      
          var data = sheet.getDataRange().getValues();
          var headers = data[0];
          var precos = {};
          var hoje = new Date();
      
          for (var i = 1; i < data.length; i++) {
            var row = {};
            headers.forEach(function(h, idx) { row[h] = data[i][idx]; });
        
            // Verifica se contrato está vigente
            var dataFim = new Date(row.Data_Fim);
            if (row.Status === 'ATIVO' && dataFim >= hoje && row.Saldo > 0) {
              // Assume que há uma relação item-preço no contrato
              if (row.Item_ID && row.Preco_Unitario) {
                precos[row.Item_ID] = {
                  preco: Number(row.Preco_Unitario),
                  contratoId: row.ID,
                  fornecedorId: row.Fornecedor_ID,
                  saldo: Number(row.Saldo)
                };
              }
            }
          }
      
          _cache.precosContratos = precos;
          return precos;
      
        } catch (e) {
          console.error('Erro ao carregar preços: ' + e.message);
          return {};
        }
      } catch (error) {
        Logger.log("Erro em _loadPrecosContratos: " + error.message);
        throw error;
      }
    } catch (error) {
      Logger.log("Erro em _loadPrecosContratos: " + error.message);
      throw error;
    }
  }
  
  /**
   * Obtém usuário atual
   * @private
   */
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
  
  /**
   * Gera ID único
   * @private
   */
  function _generateId() {
    try {
      try {
        return Utilities.getUuid();
      } catch (error) {
        Logger.log("Erro em _generateId: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em _generateId: " + error.message);
      throw error;
    }
  }

  // =========================================================================
  // API PÚBLICA
  // =========================================================================
  
  return {
    CONFIG: CONFIG,
    
    // -----------------------------------------------------------------------
    // CARDÁPIO BASE
    // -----------------------------------------------------------------------
    
    /**
     * Cria um novo cardápio base
     * @param {Object} dados - Dados do cardápio
     * @returns {Object} Resultado
     */
    criarCardapioBase: function(dados) {
      try {
        var ss = getSS();
        var sheet = ss.getSheetByName(CONFIG.SHEETS.CARDAPIOS_BASE);
        
        if (!sheet) {
          return { success: false, error: 'Planilha de cardápios não encontrada' };
        }
        
        var id = _generateId();
        var now = new Date();
        
        var cardapio = [
          id,
          dados.nome || 'Cardápio ' + now.toLocaleDateString('pt-BR'),
          dados.tipoRefeicao || CONFIG.TIPOS_REFEICAO.ALMOCO,
          dados.faixaEtaria || 'FUNDAMENTAL_6_10A',
          0,  // Calorias (calculado depois)
          0,  // Custo (calculado depois)
          CONFIG.STATUS.RASCUNHO,
          _getCurrentUser(),
          now,
          true
        ];
        
        sheet.appendRow(cardapio);
        
        return {
          success: true,
          id: id,
          message: 'Cardápio base criado com sucesso'
        };
        
      } catch (e) {
        return { success: false, error: e.message };
      }
    },
    
    /**
     * Adiciona item ao cardápio
     * @param {string} cardapioId - ID do cardápio
     * @param {Object} item - Dados do item
     * @returns {Object} Resultado
     */
    adicionarItem: function(cardapioId, item) {
      try {
        try {
          var ss = getSS();
          var sheet = ss.getSheetByName(CONFIG.SHEETS.ITENS_CARDAPIO);
        
          if (!sheet) {
            return { success: false, error: 'Planilha de itens não encontrada' };
          }
        
          var id = _generateId();
        
          var registro = [
            id,
            cardapioId,
            item.itemId,
            item.quantidade || 100,  // gramas
            item.diaSemana || '',
            item.tipoPreparacao || '',
            item.observacoes || ''
          ];
        
          sheet.appendRow(registro);
        
          // Recalcula totais do cardápio
          this._recalcularCardapio(cardapioId);
        
          return {
            success: true,
            id: id,
            message: 'Item adicionado ao cardápio'
          };
        
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em adicionarItem: " + error.message);
        throw error;
      }
    },
    
    /**
     * Remove item do cardápio
     * @param {string} itemCardapioId - ID do registro item-cardápio
     * @returns {Object} Resultado
     */
    removerItem: function(itemCardapioId) {
      try {
        try {
          var ss = getSS();
          var sheet = ss.getSheetByName(CONFIG.SHEETS.ITENS_CARDAPIO);
        
          if (!sheet || sheet.getLastRow() <= 1) {
            return { success: false, error: 'Nenhum item encontrado' };
          }
        
          var data = sheet.getDataRange().getValues();
          var cardapioId = null;
        
          for (var i = 1; i < data.length; i++) {
            if (data[i][0] === itemCardapioId) {
              cardapioId = data[i][1];
              sheet.deleteRow(i + 1);
              break;
            }
          }
        
          if (cardapioId) {
            this._recalcularCardapio(cardapioId);
          }
        
          return { success: true, message: 'Item removido' };
        
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em removerItem: " + error.message);
        throw error;
      }
    },

    // -----------------------------------------------------------------------
    // CARDÁPIO SEMANAL
    // -----------------------------------------------------------------------
    
    /**
     * Cria cardápio semanal a partir de um cardápio base
     * @param {Object} dados - { cardapioBaseId, semana, ano, escolaId }
     * @returns {Object} Resultado
     */
    criarCardapioSemanal: function(dados) {
      try {
        try {
          var ss = getSS();
          var sheet = ss.getSheetByName(CONFIG.SHEETS.CARDAPIOS_SEMANAIS);
        
          if (!sheet) {
            return { success: false, error: 'Planilha não encontrada' };
          }
        
          // Obtém itens do cardápio base
          var itensBase = this.obterItensCardapio(dados.cardapioBaseId);
        
          var id = _generateId();
          var now = new Date();
        
          // Organiza itens por dia
          var diasObj = {};
          CONFIG.DIAS_SEMANA.forEach(function(dia) { diasObj[dia] = []; });
        
          itensBase.itens.forEach(function(item) {
            var dia = item.Dia_Semana || 'Segunda';
            if (diasObj[dia]) {
              diasObj[dia].push(item.Item_ID);
            }
          });
        
          var cardapioSemanal = [
            id,
            dados.cardapioBaseId,
            dados.semana || this._getSemanaAtual(),
            dados.ano || now.getFullYear(),
            dados.escolaId || '',
            JSON.stringify(diasObj.Segunda),
            JSON.stringify(diasObj.Terca),
            JSON.stringify(diasObj.Quarta),
            JSON.stringify(diasObj.Quinta),
            JSON.stringify(diasObj.Sexta),
            CONFIG.STATUS.RASCUNHO,
            '',  // Nutricionista
            '',  // Data aprovação
            ''   // Parecer
          ];
        
          sheet.appendRow(cardapioSemanal);
        
          return {
            success: true,
            id: id,
            message: 'Cardápio semanal criado'
          };
        
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em criarCardapioSemanal: " + error.message);
        throw error;
      }
    },
    
    /**
     * Atualiza dia específico do cardápio semanal
     * @param {string} cardapioSemanalId - ID do cardápio
     * @param {string} dia - Dia da semana
     * @param {Array} itensIds - IDs dos itens
     * @returns {Object} Resultado
     */
    atualizarDiaCardapio: function(cardapioSemanalId, dia, itensIds) {
      try {
        try {
          var ss = getSS();
          var sheet = ss.getSheetByName(CONFIG.SHEETS.CARDAPIOS_SEMANAIS);
        
          if (!sheet || sheet.getLastRow() <= 1) {
            return { success: false, error: 'Cardápio não encontrado' };
          }
        
          var data = sheet.getDataRange().getValues();
          var headers = data[0];
          var diaCol = headers.indexOf(dia);
        
          if (diaCol === -1) {
            return { success: false, error: 'Dia inválido: ' + dia };
          }
        
          for (var i = 1; i < data.length; i++) {
            if (data[i][0] === cardapioSemanalId) {
              sheet.getRange(i + 1, diaCol + 1).setValue(JSON.stringify(itensIds));
              return { success: true, message: 'Dia atualizado' };
            }
          }
        
          return { success: false, error: 'Cardápio não encontrado' };
        
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em atualizarDiaCardapio: " + error.message);
        throw error;
      }
    },
    
    /**
     * Obtém semana atual do ano
     * @private
     */
    _getSemanaAtual: function() {
      var now = new Date();
      var start = new Date(now.getFullYear(), 0, 1);
      var diff = now - start;
      var oneWeek = 1000 * 60 * 60 * 24 * 7;
      return Math.ceil(diff / oneWeek);
    },

    // -----------------------------------------------------------------------
    // CÁLCULOS
    // -----------------------------------------------------------------------
    
    /**
     * Calcula custo total do cardápio baseado em contratos vigentes
     * @param {string} cardapioId - ID do cardápio
     * @returns {Object} Resultado com custo detalhado
     */
    calcularCusto: function(cardapioId) {
      try {
        try {
          var itensResult = this.obterItensCardapio(cardapioId);
          if (!itensResult.success) return itensResult;
        
          var precos = _loadPrecosContratos();
          var itensAlimentares = _loadItensAlimentares();
        
          var custoTotal = 0;
          var detalhes = [];
          var itensSemPreco = [];
        
          itensResult.itens.forEach(function(itemCardapio) {
            var itemId = itemCardapio.Item_ID;
            var quantidade = Number(itemCardapio.Quantidade_g) || 100;
            var itemInfo = itensAlimentares[itemId] || {};
          
            if (precos[itemId]) {
              var precoUnitario = precos[itemId].preco;
              var custoItem = (quantidade / 1000) * precoUnitario; // Preço por kg
              custoTotal += custoItem;
            
              detalhes.push({
                item: itemInfo.Nome || itemId,
                quantidade: quantidade,
                precoKg: precoUnitario,
                custo: custoItem,
                fornecedor: precos[itemId].fornecedorId
              });
            } else {
              itensSemPreco.push(itemInfo.Nome || itemId);
            }
          });
        
          return {
            success: true,
            custoTotal: Math.round(custoTotal * 100) / 100,
            custoFormatado: 'R$ ' + custoTotal.toFixed(2).replace('.', ','),
            detalhes: detalhes,
            itensSemPreco: itensSemPreco,
            alertas: itensSemPreco.length > 0 
              ? ['Itens sem preço definido: ' + itensSemPreco.join(', ')] 
              : []
          };
        
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em calcularCusto: " + error.message);
        throw error;
      }
    },
    
    /**
     * Calcula valor nutricional do cardápio
     * @param {string} cardapioId - ID do cardápio
     * @returns {Object} Resultado com valores nutricionais
     */
    calcularNutricional: function(cardapioId) {
      try {
        try {
          var itensResult = this.obterItensCardapio(cardapioId);
          if (!itensResult.success) return itensResult;
        
          var itensAlimentares = _loadItensAlimentares();
        
          var totais = {
            calorias: 0,
            proteinas: 0,
            carboidratos: 0,
            gorduras: 0,
            fibras: 0
          };
        
          var detalhes = [];
          var alertas = [];
        
          itensResult.itens.forEach(function(itemCardapio) {
            var itemId = itemCardapio.Item_ID;
            var quantidade = Number(itemCardapio.Quantidade_g) || 100;
            var item = itensAlimentares[itemId];
          
            if (item) {
              var fator = quantidade / 100;
            
              var calorias = (Number(item.Calorias_100g) || 0) * fator;
              var proteinas = (Number(item.Proteinas_g) || 0) * fator;
              var carboidratos = (Number(item.Carboidratos_g) || 0) * fator;
              var gorduras = (Number(item.Gorduras_g) || 0) * fator;
              var fibras = (Number(item.Fibras_g) || 0) * fator;
            
              totais.calorias += calorias;
              totais.proteinas += proteinas;
              totais.carboidratos += carboidratos;
              totais.gorduras += gorduras;
              totais.fibras += fibras;
            
              detalhes.push({
                item: item.Nome,
                quantidade: quantidade,
                calorias: Math.round(calorias),
                proteinas: Math.round(proteinas * 10) / 10,
                carboidratos: Math.round(carboidratos * 10) / 10,
                gorduras: Math.round(gorduras * 10) / 10
              });
            
              // Alertas de alergênicos
              if (item.Contem_Gluten) alertas.push(item.Nome + ' contém glúten');
              if (item.Contem_Lactose) alertas.push(item.Nome + ' contém lactose');
            }
          });
        
          // Arredonda totais
          for (var key in totais) {
            totais[key] = Math.round(totais[key] * 10) / 10;
          }
        
          return {
            success: true,
            totais: totais,
            detalhes: detalhes,
            alertas: alertas
          };
        
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em calcularNutricional: " + error.message);
        throw error;
      }
    },
    
    /**
     * Recalcula totais do cardápio
     * @private
     */
    _recalcularCardapio: function(cardapioId) {
      try {
        try {
          var custo = this.calcularCusto(cardapioId);
          var nutri = this.calcularNutricional(cardapioId);
        
          var ss = getSS();
          var sheet = ss.getSheetByName(CONFIG.SHEETS.CARDAPIOS_BASE);
        
          if (!sheet || sheet.getLastRow() <= 1) return;
        
          var data = sheet.getDataRange().getValues();
          var headers = data[0];
          var caloriasCol = headers.indexOf('Calorias_Total');
          var custoCol = headers.indexOf('Custo_Estimado');
        
          for (var i = 1; i < data.length; i++) {
            if (data[i][0] === cardapioId) {
              if (caloriasCol !== -1 && nutri.success) {
                sheet.getRange(i + 1, caloriasCol + 1).setValue(nutri.totais.calorias);
              }
              if (custoCol !== -1 && custo.success) {
                sheet.getRange(i + 1, custoCol + 1).setValue(custo.custoTotal);
              }
              break;
            }
          }
        } catch (e) {
          console.error('Erro ao recalcular: ' + e.message);
        }
      } catch (error) {
        Logger.log("Erro em _recalcularCardapio: " + error.message);
        throw error;
      }
    },

    // -----------------------------------------------------------------------
    // CONSULTAS
    // -----------------------------------------------------------------------
    
    /**
     * Obtém itens de um cardápio
     * @param {string} cardapioId - ID do cardápio
     * @returns {Object} Resultado com itens
     */
    obterItensCardapio: function(cardapioId) {
      try {
        try {
          var ss = getSS();
          var sheet = ss.getSheetByName(CONFIG.SHEETS.ITENS_CARDAPIO);
        
          if (!sheet || sheet.getLastRow() <= 1) {
            return { success: true, itens: [] };
          }
        
          var data = sheet.getDataRange().getValues();
          var headers = data[0];
          var itens = [];
        
          for (var i = 1; i < data.length; i++) {
            if (data[i][1] === cardapioId) {
              var item = {};
              headers.forEach(function(h, idx) { item[h] = data[i][idx]; });
              itens.push(item);
            }
          }
        
          return { success: true, itens: itens };
        
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em obterItensCardapio: " + error.message);
        throw error;
      }
    },
    
    /**
     * Obtém cardápio completo com itens e cálculos
     * @param {string} cardapioId - ID do cardápio
     * @returns {Object} Cardápio completo
     */
    obterCardapioCompleto: function(cardapioId) {
      try {
        try {
          var ss = getSS();
          var sheet = ss.getSheetByName(CONFIG.SHEETS.CARDAPIOS_BASE);
        
          if (!sheet || sheet.getLastRow() <= 1) {
            return { success: false, error: 'Cardápio não encontrado' };
          }
        
          var data = sheet.getDataRange().getValues();
          var headers = data[0];
          var cardapio = null;
        
          for (var i = 1; i < data.length; i++) {
            if (data[i][0] === cardapioId) {
              cardapio = {};
              headers.forEach(function(h, idx) { cardapio[h] = data[i][idx]; });
              break;
            }
          }
        
          if (!cardapio) {
            return { success: false, error: 'Cardápio não encontrado' };
          }
        
          // Adiciona itens
          var itensResult = this.obterItensCardapio(cardapioId);
          cardapio.itens = itensResult.success ? itensResult.itens : [];
        
          // Adiciona cálculos
          var custoResult = this.calcularCusto(cardapioId);
          cardapio.custo = custoResult.success ? custoResult : null;
        
          var nutriResult = this.calcularNutricional(cardapioId);
          cardapio.nutricional = nutriResult.success ? nutriResult : null;
        
          return { success: true, cardapio: cardapio };
        
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em obterCardapioCompleto: " + error.message);
        throw error;
      }
    },
    
    /**
     * Lista cardápios base
     * @param {Object} [filtros] - { status, faixaEtaria, tipoRefeicao }
     * @returns {Object} Lista de cardápios
     */
    listarCardapiosBase: function(filtros) {
      try {
        filtros = filtros || {};
      
        try {
          var ss = getSS();
          var sheet = ss.getSheetByName(CONFIG.SHEETS.CARDAPIOS_BASE);
        
          if (!sheet || sheet.getLastRow() <= 1) {
            return { success: true, cardapios: [] };
          }
        
          var data = sheet.getDataRange().getValues();
          var headers = data[0];
          var cardapios = [];
        
          for (var i = 1; i < data.length; i++) {
            var row = {};
            headers.forEach(function(h, idx) { row[h] = data[i][idx]; });
          
            // Aplica filtros
            if (filtros.status && row.Status !== filtros.status) continue;
            if (filtros.faixaEtaria && row.Faixa_Etaria !== filtros.faixaEtaria) continue;
            if (filtros.tipoRefeicao && row.Tipo_Refeicao !== filtros.tipoRefeicao) continue;
            if (row.Ativo === false) continue;
          
            cardapios.push(row);
          }
        
          return { success: true, cardapios: cardapios, count: cardapios.length };
        
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em listarCardapiosBase: " + error.message);
        throw error;
      }
    },
    
    /**
     * Lista itens alimentares disponíveis
     * @param {Object} [filtros] - { grupoAlimentar }
     * @returns {Object} Lista de itens
     */
    listarItensDisponiveis: function(filtros) {
      try {
        filtros = filtros || {};
      
        var itens = _loadItensAlimentares();
        var lista = [];
      
        for (var id in itens) {
          var item = itens[id];
        
          if (filtros.grupoAlimentar && item.Grupo_Alimentar !== filtros.grupoAlimentar) continue;
        
          lista.push({
            id: item.ID,
            nome: item.Nome,
            grupo: item.Grupo_Alimentar,
            unidade: item.Unidade_Medida,
            calorias: item.Calorias_100g,
            contemGluten: item.Contem_Gluten,
            contemLactose: item.Contem_Lactose
          });
        }
      
        // Ordena por nome
        lista.sort(function(a, b) { return (a.nome || '').localeCompare(b.nome || ''); });
      
        return { success: true, itens: lista, count: lista.length };
      } catch (error) {
        Logger.log("Erro em listarItensDisponiveis: " + error.message);
        throw error;
      }
    },

    // -----------------------------------------------------------------------
    // VALIDAÇÃO
    // -----------------------------------------------------------------------
    
    /**
     * Valida cardápio conforme regras PNAE
     * @param {string} cardapioId - ID do cardápio
     * @returns {Object} Resultado da validação
     */
    validarCardapio: function(cardapioId) {
      try {
        var resultado = {
          valido: true,
          erros: [],
          alertas: [],
          pontuacao: 100
        };
      
        try {
          var cardapio = this.obterCardapioCompleto(cardapioId);
          if (!cardapio.success) {
            return { valido: false, erros: ['Cardápio não encontrado'] };
          }
        
          var c = cardapio.cardapio;
          var itens = c.itens || [];
          var nutri = c.nutricional;
        
          // 1. Verifica se tem itens
          if (itens.length === 0) {
            resultado.erros.push('Cardápio sem itens');
            resultado.valido = false;
            resultado.pontuacao -= 50;
          }
        
          // 2. Verifica calorias
          if (nutri && nutri.totais) {
            var faixaConfig = CONFIG.FAIXAS_ETARIAS[c.Faixa_Etaria];
            if (faixaConfig) {
              var caloriasRef = faixaConfig.calorias;
              var caloriasAtual = nutri.totais.calorias;
            
              if (caloriasAtual < caloriasRef * 0.85) {
                resultado.alertas.push('Calorias abaixo do recomendado (' + caloriasAtual + '/' + caloriasRef + ')');
                resultado.pontuacao -= 10;
              } else if (caloriasAtual > caloriasRef * 1.15) {
                resultado.alertas.push('Calorias acima do recomendado (' + caloriasAtual + '/' + caloriasRef + ')');
                resultado.pontuacao -= 5;
              }
            }
          }
        
          // 3. Verifica diversidade de grupos alimentares
          var itensAlimentares = _loadItensAlimentares();
          var grupos = {};
        
          itens.forEach(function(item) {
            var itemInfo = itensAlimentares[item.Item_ID];
            if (itemInfo && itemInfo.Grupo_Alimentar) {
              grupos[itemInfo.Grupo_Alimentar] = (grupos[itemInfo.Grupo_Alimentar] || 0) + 1;
            }
          });
        
          var numGrupos = Object.keys(grupos).length;
          if (numGrupos < 3) {
            resultado.alertas.push('Pouca diversidade de grupos alimentares (' + numGrupos + ' grupos)');
            resultado.pontuacao -= 15;
          }
        
          // 4. Verifica presença de frutas/hortaliças
          if (!grupos['FRUTAS'] && !grupos['HORTALICAS']) {
            resultado.erros.push('Cardápio deve conter frutas ou hortaliças');
            resultado.valido = false;
            resultado.pontuacao -= 20;
          }
        
          // 5. Verifica presença de proteínas
          if (!grupos['PROTEINAS']) {
            resultado.alertas.push('Cardápio sem fonte de proteína');
            resultado.pontuacao -= 10;
          }
        
          // Garante pontuação mínima de 0
          resultado.pontuacao = Math.max(0, resultado.pontuacao);
        
          // Valido se não tem erros críticos
          resultado.valido = resultado.erros.length === 0;
        
          return resultado;
        
        } catch (e) {
          return { valido: false, erros: [e.message] };
        }
      } catch (error) {
        Logger.log("Erro em validarCardapio: " + error.message);
        throw error;
      }
    },
    
    // -----------------------------------------------------------------------
    // WORKFLOW
    // -----------------------------------------------------------------------
    
    /**
     * Envia cardápio para aprovação
     * @param {string} cardapioId - ID do cardápio
     * @returns {Object} Resultado
     */
    enviarParaAprovacao: function(cardapioId) {
      try {
        // Valida antes de enviar
        var validacao = this.validarCardapio(cardapioId);
        if (!validacao.valido) {
          return {
            success: false,
            error: 'Cardápio não passou na validação',
            erros: validacao.erros
          };
        }
        
        return this._atualizarStatus(cardapioId, CONFIG.STATUS.PENDENTE_APROVACAO);
        
      } catch (e) {
        return { success: false, error: e.message };
      }
    },
    
    /**
     * Aprova cardápio
     * @param {string} cardapioId - ID do cardápio
     * @param {string} parecer - Parecer do nutricionista
     * @returns {Object} Resultado
     */
    aprovarCardapio: function(cardapioId, parecer) {
      try {
        try {
          var ss = getSS();
          var sheet = ss.getSheetByName(CONFIG.SHEETS.CARDAPIOS_SEMANAIS);
        
          if (sheet && sheet.getLastRow() > 1) {
            var data = sheet.getDataRange().getValues();
            var headers = data[0];
          
            for (var i = 1; i < data.length; i++) {
              if (data[i][0] === cardapioId || data[i][1] === cardapioId) {
                var nutriCol = headers.indexOf('Nutricionista_Responsavel');
                var dataAprovCol = headers.indexOf('Data_Aprovacao');
                var parecerCol = headers.indexOf('Parecer');
                var statusCol = headers.indexOf('Status');
              
                if (nutriCol !== -1) sheet.getRange(i + 1, nutriCol + 1).setValue(_getCurrentUser());
                if (dataAprovCol !== -1) sheet.getRange(i + 1, dataAprovCol + 1).setValue(new Date());
                if (parecerCol !== -1) sheet.getRange(i + 1, parecerCol + 1).setValue(parecer || '');
                if (statusCol !== -1) sheet.getRange(i + 1, statusCol + 1).setValue(CONFIG.STATUS.APROVADO);
              
                break;
              }
            }
          }
        
          return this._atualizarStatus(cardapioId, CONFIG.STATUS.APROVADO);
        
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em aprovarCardapio: " + error.message);
        throw error;
      }
    },
    
    /**
     * Atualiza status do cardápio
     * @private
     */
    _atualizarStatus: function(cardapioId, novoStatus) {
      try {
        try {
          var ss = getSS();
          var sheet = ss.getSheetByName(CONFIG.SHEETS.CARDAPIOS_BASE);
        
          if (!sheet || sheet.getLastRow() <= 1) {
            return { success: false, error: 'Planilha não encontrada' };
          }
        
          var data = sheet.getDataRange().getValues();
          var headers = data[0];
          var statusCol = headers.indexOf('Status');
        
          for (var i = 1; i < data.length; i++) {
            if (data[i][0] === cardapioId) {
              sheet.getRange(i + 1, statusCol + 1).setValue(novoStatus);
              return { success: true, message: 'Status atualizado para ' + novoStatus };
            }
          }
        
          return { success: false, error: 'Cardápio não encontrado' };
        
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em _atualizarStatus: " + error.message);
        throw error;
      }
    }
  };
})();


// ============================================================================
// FUNÇÕES GLOBAIS DE API
// ============================================================================

/**
 * API: Cria cardápio base
 */
function api_cardapio_criar(dados) {
  return MenuBuilder.criarCardapioBase(dados);
}

/**
 * API: Adiciona item ao cardápio
 */
function api_cardapio_adicionar_item(cardapioId, item) {
  return MenuBuilder.adicionarItem(cardapioId, item);
}

/**
 * API: Remove item do cardápio
 */
function api_cardapio_remover_item(itemCardapioId) {
  return MenuBuilder.removerItem(itemCardapioId);
}

/**
 * API: Cria cardápio semanal
 */
function api_cardapio_semanal_criar(dados) {
  return MenuBuilder.criarCardapioSemanal(dados);
}

/**
 * API: Atualiza dia do cardápio semanal
 */
function api_cardapio_semanal_atualizar_dia(cardapioId, dia, itensIds) {
  return MenuBuilder.atualizarDiaCardapio(cardapioId, dia, itensIds);
}

/**
 * API: Calcula custo do cardápio
 */
function api_cardapio_calcular_custo(cardapioId) {
  return MenuBuilder.calcularCusto(cardapioId);
}

/**
 * API: Calcula nutricional do cardápio
 */
function api_cardapio_calcular_nutricional(cardapioId) {
  return MenuBuilder.calcularNutricional(cardapioId);
}

/**
 * API: Obtém cardápio completo
 */
function api_cardapio_obter(cardapioId) {
  return MenuBuilder.obterCardapioCompleto(cardapioId);
}

/**
 * API: Lista cardápios base
 */
function api_cardapios_listar(filtros) {
  return MenuBuilder.listarCardapiosBase(filtros);
}

/**
 * API: Lista itens alimentares
 */
function api_itens_alimentares_listar(filtros) {
  return MenuBuilder.listarItensDisponiveis(filtros);
}

/**
 * API: Valida cardápio
 */
function api_cardapio_validar(cardapioId) {
  return MenuBuilder.validarCardapio(cardapioId);
}

/**
 * API: Envia para aprovação
 */
function api_cardapio_enviar_aprovacao(cardapioId) {
  return MenuBuilder.enviarParaAprovacao(cardapioId);
}

/**
 * API: Aprova cardápio
 */
function api_cardapio_aprovar(cardapioId, parecer) {
  return MenuBuilder.aprovarCardapio(cardapioId, parecer);
}

/**
 * API: Obtém configurações
 */
function api_cardapio_config() {
  return {
    diasSemana: MenuBuilder.CONFIG.DIAS_SEMANA,
    tiposRefeicao: MenuBuilder.CONFIG.TIPOS_REFEICAO,
    faixasEtarias: MenuBuilder.CONFIG.FAIXAS_ETARIAS,
    status: MenuBuilder.CONFIG.STATUS
  };
}

// ============================================================================
// REGISTRO DO MÓDULO
// ============================================================================

Logger.log('✅ Core_Menu_Builder.gs carregado - MenuBuilder disponível');
