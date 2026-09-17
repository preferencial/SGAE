/**
 * @fileoverview Repositório de Itens Alimentares - Alimentação Escolar CRE-PP
 * @version 1.0.0
 * 
 * Intervenção 11/38: ItemsRepository conforme Prompt 11
 * 
 * Gestão de itens (gêneros alimentícios) incluindo:
 * - Grupo alimentar
 * - Unidade de medida
 * - Valor calórico e informações nutricionais
 * - Restrições (glúten, lactose, alergênicos)
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-25
 */

'use strict';

// ============================================================================
// ITEMS REPOSITORY - Repositório de Gêneros Alimentícios
// ============================================================================

var ItemsRepository = (function() {
  
  // =========================================================================
  // CONFIGURAÇÃO
  // =========================================================================
  
  var CONFIG = {
    SHEET_NAME: 'Itens_Alimentares',
    
    // Grupos alimentares conforme PNAE
    GRUPOS: {
      CEREAIS: { nome: 'Cereais e Derivados', cor: '#FFF59D' },
      LEGUMINOSAS: { nome: 'Leguminosas', cor: '#A5D6A7' },
      HORTALICAS: { nome: 'Hortaliças', cor: '#81C784' },
      FRUTAS: { nome: 'Frutas', cor: '#FFCC80' },
      CARNES: { nome: 'Carnes e Ovos', cor: '#FFAB91' },
      LATICINIOS: { nome: 'Leite e Derivados', cor: '#B3E5FC' },
      OLEOS: { nome: 'Óleos e Gorduras', cor: '#FFE082' },
      ACUCARES: { nome: 'Açúcares e Doces', cor: '#F8BBD9' },
      BEBIDAS: { nome: 'Bebidas', cor: '#B2DFDB' },
      TEMPEROS: { nome: 'Temperos e Condimentos', cor: '#D7CCC8' },
      OUTROS: { nome: 'Outros', cor: '#CFD8DC' }
    },
    
    // Unidades de medida
    UNIDADES: {
      G: 'Gramas (g)',
      KG: 'Quilogramas (kg)',
      ML: 'Mililitros (ml)',
      L: 'Litros (L)',
      UN: 'Unidade',
      DZ: 'Dúzia',
      PCT: 'Pacote',
      CX: 'Caixa',
      LT: 'Lata',
      BD: 'Bandeja',
      MC: 'Maço'
    },

    // Alergênicos principais (RDC 26/2015 ANVISA)
    ALERGENICOS: {
      GLUTEN: 'Glúten',
      LEITE: 'Leite e derivados',
      OVO: 'Ovos',
      AMENDOIM: 'Amendoim',
      SOJA: 'Soja',
      NOZES: 'Nozes e castanhas',
      PEIXE: 'Peixes',
      CRUSTACEOS: 'Crustáceos',
      TRIGO: 'Trigo',
      SULFITOS: 'Sulfitos'
    },
    
    // Categorias de armazenamento
    ARMAZENAMENTO: {
      AMBIENTE: { nome: 'Temperatura Ambiente', tempMin: 15, tempMax: 25 },
      REFRIGERADO: { nome: 'Refrigerado', tempMin: 0, tempMax: 5 },
      CONGELADO: { nome: 'Congelado', tempMin: -18, tempMax: -12 },
      RESFRIADO: { nome: 'Resfriado', tempMin: 0, tempMax: 4 }
    }
  };
  
  // =========================================================================
  // FUNÇÕES PRIVADAS
  // =========================================================================
  
  /**
   * Obtém planilha de itens
   * @private
   */
  function _getSheet() {
    try {
      var ss = getSS();
      return ss.getSheetByName(CONFIG.SHEET_NAME);
    } catch (error) {
      Logger.log("Erro em _getSheet: " + error.message);
      throw error;
    }
  }
  
  /**
   * Gera ID único
   * @private
   */
  function _generateId() {
    try {
      return 'ITEM_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6);
    } catch (error) {
      Logger.log("Erro em _generateId: " + error.message);
      throw error;
    }
  }
  
  /**
   * Obtém usuário atual
   * @private
   */
  function _getCurrentUser() {
    try {
      return Session.getActiveUser().getEmail() || 'sistema';
    } catch (e) {
      return 'sistema';
    }
  }
  
  /**
   * Converte linha para objeto
   * @private
   */
  function _rowToObject(row, headers) {
    try {
      try {
        var obj = {};
        headers.forEach(function(h, idx) {
          obj[h] = row[idx];
        });
        return obj;
      } catch (error) {
        Logger.log("Erro em _rowToObject: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em _rowToObject: " + error.message);
      throw error;
    }
  }
  
  // =========================================================================
  // API PÚBLICA
  // =========================================================================
  
  return {
    CONFIG: CONFIG,
    
    // -----------------------------------------------------------------------
    // CRUD DE ITENS
    // -----------------------------------------------------------------------
    
    /**
     * Cria novo item alimentar
     * @param {Object} dados - Dados do item
     * @returns {Object} Resultado
     */
    criar: function(dados) {
      try {
        try {
          var sheet = _getSheet();
          if (!sheet) {
            return { success: false, error: 'Planilha de itens não encontrada' };
          }
        
          // Validações
          if (!dados.nome) {
            return { success: false, error: 'Nome do item é obrigatório' };
          }
        
          var id = _generateId();
          var now = new Date();
        
          var item = [
            id,
            dados.nome,
            dados.grupoAlimentar || 'OUTROS',
            dados.unidadeMedida || 'G',
            Number(dados.calorias100g) || 0,
            Number(dados.proteinas) || 0,
            Number(dados.carboidratos) || 0,
            Number(dados.gorduras) || 0,
            Number(dados.fibras) || 0,
            dados.contemGluten === true || dados.contemGluten === 'SIM',
            dados.contemLactose === true || dados.contemLactose === 'SIM',
            dados.alergenicos || '',
            true  // Ativo
          ];
        
          sheet.appendRow(item);
        
          return {
            success: true,
            id: id,
            message: 'Item criado com sucesso'
          };
        
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em criar: " + error.message);
        throw error;
      }
    },

    /**
     * Atualiza item existente
     * @param {string} itemId - ID do item
     * @param {Object} dados - Dados a atualizar
     * @returns {Object} Resultado
     */
    atualizar: function(itemId, dados) {
      try {
        try {
          var sheet = _getSheet();
          if (!sheet || sheet.getLastRow() <= 1) {
            return { success: false, error: 'Item não encontrado' };
          }
        
          var data = sheet.getDataRange().getValues();
          var headers = data[0];
        
          for (var i = 1; i < data.length; i++) {
            if (data[i][0] === itemId) {
              // Atualiza campos fornecidos
              var colMap = {};
              headers.forEach(function(h, idx) { colMap[h] = idx; });
            
              if (dados.nome !== undefined && colMap['Nome'] !== undefined) {
                sheet.getRange(i + 1, colMap['Nome'] + 1).setValue(dados.nome);
              }
              if (dados.grupoAlimentar !== undefined && colMap['Grupo_Alimentar'] !== undefined) {
                sheet.getRange(i + 1, colMap['Grupo_Alimentar'] + 1).setValue(dados.grupoAlimentar);
              }
              if (dados.calorias100g !== undefined && colMap['Calorias_100g'] !== undefined) {
                sheet.getRange(i + 1, colMap['Calorias_100g'] + 1).setValue(Number(dados.calorias100g));
              }
              if (dados.proteinas !== undefined && colMap['Proteinas_g'] !== undefined) {
                sheet.getRange(i + 1, colMap['Proteinas_g'] + 1).setValue(Number(dados.proteinas));
              }
              if (dados.carboidratos !== undefined && colMap['Carboidratos_g'] !== undefined) {
                sheet.getRange(i + 1, colMap['Carboidratos_g'] + 1).setValue(Number(dados.carboidratos));
              }
              if (dados.gorduras !== undefined && colMap['Gorduras_g'] !== undefined) {
                sheet.getRange(i + 1, colMap['Gorduras_g'] + 1).setValue(Number(dados.gorduras));
              }
              if (dados.contemGluten !== undefined && colMap['Contem_Gluten'] !== undefined) {
                sheet.getRange(i + 1, colMap['Contem_Gluten'] + 1).setValue(dados.contemGluten === true);
              }
              if (dados.contemLactose !== undefined && colMap['Contem_Lactose'] !== undefined) {
                sheet.getRange(i + 1, colMap['Contem_Lactose'] + 1).setValue(dados.contemLactose === true);
              }
              if (dados.alergenicos !== undefined && colMap['Alergenos'] !== undefined) {
                sheet.getRange(i + 1, colMap['Alergenos'] + 1).setValue(dados.alergenicos);
              }
            
              return { success: true, message: 'Item atualizado' };
            }
          }
        
          return { success: false, error: 'Item não encontrado' };
        
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em atualizar: " + error.message);
        throw error;
      }
    },
    
    /**
     * Desativa item (soft delete)
     * @param {string} itemId - ID do item
     * @returns {Object} Resultado
     */
    desativar: function(itemId) {
      try {
        try {
          var sheet = _getSheet();
          if (!sheet || sheet.getLastRow() <= 1) {
            return { success: false, error: 'Item não encontrado' };
          }
        
          var data = sheet.getDataRange().getValues();
          var headers = data[0];
          var ativoCol = headers.indexOf('Ativo');
        
          for (var i = 1; i < data.length; i++) {
            if (data[i][0] === itemId) {
              sheet.getRange(i + 1, ativoCol + 1).setValue(false);
              return { success: true, message: 'Item desativado' };
            }
          }
        
          return { success: false, error: 'Item não encontrado' };
        
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em desativar: " + error.message);
        throw error;
      }
    },
    
    /**
     * Reativa item
     * @param {string} itemId - ID do item
     * @returns {Object} Resultado
     */
    reativar: function(itemId) {
      try {
        try {
          var sheet = _getSheet();
          if (!sheet || sheet.getLastRow() <= 1) {
            return { success: false, error: 'Item não encontrado' };
          }
        
          var data = sheet.getDataRange().getValues();
          var headers = data[0];
          var ativoCol = headers.indexOf('Ativo');
        
          for (var i = 1; i < data.length; i++) {
            if (data[i][0] === itemId) {
              sheet.getRange(i + 1, ativoCol + 1).setValue(true);
              return { success: true, message: 'Item reativado' };
            }
          }
        
          return { success: false, error: 'Item não encontrado' };
        
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em reativar: " + error.message);
        throw error;
      }
    },

    // -----------------------------------------------------------------------
    // CONSULTAS
    // -----------------------------------------------------------------------
    
    /**
     * Obtém item por ID
     * @param {string} itemId - ID do item
     * @returns {Object} Resultado com item
     */
    obterPorId: function(itemId) {
      try {
        try {
          var sheet = _getSheet();
          if (!sheet || sheet.getLastRow() <= 1) {
            return { success: false, error: 'Item não encontrado' };
          }
        
          var data = sheet.getDataRange().getValues();
          var headers = data[0];
        
          for (var i = 1; i < data.length; i++) {
            if (data[i][0] === itemId) {
              var item = _rowToObject(data[i], headers);
              item.grupoInfo = CONFIG.GRUPOS[item.Grupo_Alimentar] || CONFIG.GRUPOS.OUTROS;
              return { success: true, item: item };
            }
          }
        
          return { success: false, error: 'Item não encontrado' };
        
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em obterPorId: " + error.message);
        throw error;
      }
    },
    
    /**
     * Lista todos os itens
     * @param {Object} [filtros] - Filtros opcionais
     * @returns {Object} Resultado com lista de itens
     */
    listar: function(filtros) {
      try {
        filtros = filtros || {};
      
        try {
          var sheet = _getSheet();
          if (!sheet || sheet.getLastRow() <= 1) {
            return { success: true, itens: [], count: 0 };
          }
        
          var data = sheet.getDataRange().getValues();
          var headers = data[0];
          var itens = [];
        
          for (var i = 1; i < data.length; i++) {
            var item = _rowToObject(data[i], headers);
          
            // Aplica filtros
            if (filtros.apenasAtivos !== false && item.Ativo === false) continue;
            if (filtros.grupo && item.Grupo_Alimentar !== filtros.grupo) continue;
            if (filtros.semGluten && item.Contem_Gluten === true) continue;
            if (filtros.semLactose && item.Contem_Lactose === true) continue;
            if (filtros.busca) {
              var busca = filtros.busca.toLowerCase();
              if ((item.Nome || '').toLowerCase().indexOf(busca) === -1) continue;
            }
          
            // Adiciona info do grupo
            item.grupoInfo = CONFIG.GRUPOS[item.Grupo_Alimentar] || CONFIG.GRUPOS.OUTROS;
            itens.push(item);
          }
        
          // Ordena por nome
          itens.sort(function(a, b) {
            return (a.Nome || '').localeCompare(b.Nome || '');
          });
        
          // Aplica limite
          if (filtros.limite && itens.length > filtros.limite) {
            itens = itens.slice(0, filtros.limite);
          }
        
          return { success: true, itens: itens, count: itens.length };
        
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em listar: " + error.message);
        throw error;
      }
    },
    
    /**
     * Lista itens por grupo alimentar
     * @param {string} grupo - Código do grupo
     * @returns {Object} Resultado
     */
    listarPorGrupo: function(grupo) {
      return this.listar({ grupo: grupo });
    },
    
    /**
     * Busca itens por nome
     * @param {string} termo - Termo de busca
     * @returns {Object} Resultado
     */
    buscar: function(termo) {
      return this.listar({ busca: termo });
    },
    
    /**
     * Lista itens sem glúten
     * @returns {Object} Resultado
     */
    listarSemGluten: function() {
      return this.listar({ semGluten: true });
    },
    
    /**
     * Lista itens sem lactose
     * @returns {Object} Resultado
     */
    listarSemLactose: function() {
      return this.listar({ semLactose: true });
    },
    
    /**
     * Lista itens seguros para alergênicos específicos
     * @param {Array} alergenicosEvitar - Lista de alergênicos a evitar
     * @returns {Object} Resultado
     */
    listarSeguros: function(alergenicosEvitar) {
      try {
        var todosItens = this.listar({ apenasAtivos: true });
        if (!todosItens.success) return todosItens;
        
        var itensSeguros = todosItens.itens.filter(function(item) {
          var alergenosItem = (item.Alergenos || '').toLowerCase();
          
          for (var i = 0; i < alergenicosEvitar.length; i++) {
            var alergeno = alergenicosEvitar[i].toLowerCase();
            if (alergenosItem.indexOf(alergeno) !== -1) {
              return false;
            }
            // Verifica glúten e lactose separadamente
            if (alergeno === 'gluten' && item.Contem_Gluten) return false;
            if (alergeno === 'lactose' && item.Contem_Lactose) return false;
          }
          
          return true;
        });
        
        return { success: true, itens: itensSeguros, count: itensSeguros.length };
        
      } catch (e) {
        return { success: false, error: e.message };
      }
    },

    // -----------------------------------------------------------------------
    // INFORMAÇÕES NUTRICIONAIS
    // -----------------------------------------------------------------------
    
    /**
     * Calcula informação nutricional para quantidade específica
     * @param {string} itemId - ID do item
     * @param {number} quantidadeG - Quantidade em gramas
     * @returns {Object} Informação nutricional
     */
    calcularNutricional: function(itemId, quantidadeG) {
      try {
        var itemResult = this.obterPorId(itemId);
        if (!itemResult.success) return itemResult;
        
        var item = itemResult.item;
        var fator = (quantidadeG || 100) / 100;
        
        return {
          success: true,
          item: item.Nome,
          quantidade: quantidadeG,
          nutricional: {
            calorias: Math.round((Number(item.Calorias_100g) || 0) * fator),
            proteinas: Math.round((Number(item.Proteinas_g) || 0) * fator * 10) / 10,
            carboidratos: Math.round((Number(item.Carboidratos_g) || 0) * fator * 10) / 10,
            gorduras: Math.round((Number(item.Gorduras_g) || 0) * fator * 10) / 10,
            fibras: Math.round((Number(item.Fibras_g) || 0) * fator * 10) / 10
          },
          restricoes: {
            contemGluten: item.Contem_Gluten === true,
            contemLactose: item.Contem_Lactose === true,
            alergenicos: item.Alergenos || ''
          }
        };
        
      } catch (e) {
        return { success: false, error: e.message };
      }
    },
    
    /**
     * Calcula nutricional de múltiplos itens
     * @param {Array} itens - Array de { itemId, quantidadeG }
     * @returns {Object} Totais nutricionais
     */
    calcularNutricionalMultiplo: function(itens) {
      try {
        try {
          var totais = {
            calorias: 0,
            proteinas: 0,
            carboidratos: 0,
            gorduras: 0,
            fibras: 0
          };
        
          var detalhes = [];
          var alertas = [];
        
          for (var i = 0; i < itens.length; i++) {
            var calc = this.calcularNutricional(itens[i].itemId, itens[i].quantidadeG);
          
            if (calc.success) {
              totais.calorias += calc.nutricional.calorias;
              totais.proteinas += calc.nutricional.proteinas;
              totais.carboidratos += calc.nutricional.carboidratos;
              totais.gorduras += calc.nutricional.gorduras;
              totais.fibras += calc.nutricional.fibras;
            
              detalhes.push({
                item: calc.item,
                quantidade: calc.quantidade,
                nutricional: calc.nutricional
              });
            
              // Coleta alertas de restrições
              if (calc.restricoes.contemGluten) {
                alertas.push(calc.item + ' contém GLÚTEN');
              }
              if (calc.restricoes.contemLactose) {
                alertas.push(calc.item + ' contém LACTOSE');
              }
              if (calc.restricoes.alergenicos) {
                alertas.push(calc.item + ': ' + calc.restricoes.alergenicos);
              }
            }
          }
        
          // Arredonda totais
          totais.proteinas = Math.round(totais.proteinas * 10) / 10;
          totais.carboidratos = Math.round(totais.carboidratos * 10) / 10;
          totais.gorduras = Math.round(totais.gorduras * 10) / 10;
          totais.fibras = Math.round(totais.fibras * 10) / 10;
        
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
        Logger.log("Erro em calcularNutricionalMultiplo: " + error.message);
        throw error;
      }
    },
    
    // -----------------------------------------------------------------------
    // SUBSTITUIÇÕES
    // -----------------------------------------------------------------------
    
    /**
     * Sugere substituições para um item
     * @param {string} itemId - ID do item a substituir
     * @param {Object} [restricoes] - { semGluten, semLactose, alergenicosEvitar }
     * @returns {Object} Lista de substituições sugeridas
     */
    sugerirSubstituicoes: function(itemId, restricoes) {
      try {
        restricoes = restricoes || {};
      
        try {
          var itemResult = this.obterPorId(itemId);
          if (!itemResult.success) return itemResult;
        
          var itemOriginal = itemResult.item;
          var grupoOriginal = itemOriginal.Grupo_Alimentar;
        
          // Busca itens do mesmo grupo
          var filtros = {
            grupo: grupoOriginal,
            apenasAtivos: true
          };
        
          if (restricoes.semGluten) filtros.semGluten = true;
          if (restricoes.semLactose) filtros.semLactose = true;
        
          var candidatos = this.listar(filtros);
          if (!candidatos.success) return candidatos;
        
          // Filtra alergênicos
          var substituicoes = candidatos.itens.filter(function(item) {
            // Não sugere o próprio item
            if (item.ID === itemId) return false;
          
            // Verifica alergênicos a evitar
            if (restricoes.alergenicosEvitar && restricoes.alergenicosEvitar.length > 0) {
              var alergenosItem = (item.Alergenos || '').toLowerCase();
              for (var i = 0; i < restricoes.alergenicosEvitar.length; i++) {
                if (alergenosItem.indexOf(restricoes.alergenicosEvitar[i].toLowerCase()) !== -1) {
                  return false;
                }
              }
            }
          
            return true;
          });
        
          // Ordena por similaridade calórica
          var caloriasOriginal = Number(itemOriginal.Calorias_100g) || 0;
          substituicoes.sort(function(a, b) {
            var diffA = Math.abs((Number(a.Calorias_100g) || 0) - caloriasOriginal);
            var diffB = Math.abs((Number(b.Calorias_100g) || 0) - caloriasOriginal);
            return diffA - diffB;
          });
        
          return {
            success: true,
            itemOriginal: {
              id: itemOriginal.ID,
              nome: itemOriginal.Nome,
              grupo: grupoOriginal,
              calorias: caloriasOriginal
            },
            substituicoes: substituicoes.slice(0, 10).map(function(s) {
              return {
                id: s.ID,
                nome: s.Nome,
                calorias: s.Calorias_100g,
                diferencaCalorica: Math.round((Number(s.Calorias_100g) || 0) - caloriasOriginal)
              };
            }),
            count: Math.min(substituicoes.length, 10)
          };
        
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em sugerirSubstituicoes: " + error.message);
        throw error;
      }
    },

    // -----------------------------------------------------------------------
    // ESTATÍSTICAS E RELATÓRIOS
    // -----------------------------------------------------------------------
    
    /**
     * Obtém estatísticas do repositório
     * @returns {Object} Estatísticas
     */
    obterEstatisticas: function() {
      try {
        var todosItens = this.listar({ apenasAtivos: false });
        if (!todosItens.success) return todosItens;
        
        var stats = {
          total: todosItens.itens.length,
          ativos: 0,
          inativos: 0,
          porGrupo: {},
          comGluten: 0,
          comLactose: 0,
          comAlergenicos: 0
        };
        
        // Inicializa contagem por grupo
        for (var grupo in CONFIG.GRUPOS) {
          stats.porGrupo[grupo] = 0;
        }
        
        todosItens.itens.forEach(function(item) {
          if (item.Ativo !== false) {
            stats.ativos++;
          } else {
            stats.inativos++;
          }
          
          var grupo = item.Grupo_Alimentar || 'OUTROS';
          stats.porGrupo[grupo] = (stats.porGrupo[grupo] || 0) + 1;
          
          if (item.Contem_Gluten) stats.comGluten++;
          if (item.Contem_Lactose) stats.comLactose++;
          if (item.Alergenos) stats.comAlergenicos++;
        });
        
        return { success: true, estatisticas: stats };
        
      } catch (e) {
        return { success: false, error: e.message };
      }
    },
    
    /**
     * Obtém configurações disponíveis
     * @returns {Object} Configurações
     */
    obterConfiguracoes: function() {
      return {
        grupos: CONFIG.GRUPOS,
        unidades: CONFIG.UNIDADES,
        alergenicos: CONFIG.ALERGENICOS,
        armazenamento: CONFIG.ARMAZENAMENTO
      };
    },
    
    // -----------------------------------------------------------------------
    // IMPORTAÇÃO EM LOTE
    // -----------------------------------------------------------------------
    
    /**
     * Importa itens em lote
     * @param {Array} itens - Array de objetos de itens
     * @returns {Object} Resultado da importação
     */
    importarLote: function(itens) {
      var resultado = {
        total: itens.length,
        sucesso: 0,
        erros: 0,
        detalhes: []
      };
      
      try {
        for (var i = 0; i < itens.length; i++) {
          var item = itens[i];
          var createResult = this.criar({
            nome: item.nome || item.Nome,
            grupoAlimentar: item.grupoAlimentar || item.Grupo_Alimentar || 'OUTROS',
            unidadeMedida: item.unidadeMedida || item.Unidade_Medida || 'G',
            calorias100g: item.calorias100g || item.Calorias_100g || 0,
            proteinas: item.proteinas || item.Proteinas_g || 0,
            carboidratos: item.carboidratos || item.Carboidratos_g || 0,
            gorduras: item.gorduras || item.Gorduras_g || 0,
            fibras: item.fibras || item.Fibras_g || 0,
            contemGluten: item.contemGluten || item.Contem_Gluten || false,
            contemLactose: item.contemLactose || item.Contem_Lactose || false,
            alergenicos: item.alergenicos || item.Alergenos || ''
          });
          
          if (createResult.success) {
            resultado.sucesso++;
            resultado.detalhes.push({ nome: item.nome || item.Nome, status: 'OK', id: createResult.id });
          } else {
            resultado.erros++;
            resultado.detalhes.push({ nome: item.nome || item.Nome, status: 'ERRO', erro: createResult.error });
          }
        }
        
        resultado.success = true;
        resultado.message = 'Importados: ' + resultado.sucesso + '/' + resultado.total;
        
      } catch (e) {
        resultado.success = false;
        resultado.error = e.message;
      }
      
      return resultado;
    }
  };
})();


// ============================================================================
// FUNÇÕES GLOBAIS DE API
// ============================================================================

/**
 * API: Cria item alimentar
 */
function api_item_criar(dados) {
  return ItemsRepository.criar(dados);
}

/**
 * API: Atualiza item
 */
function api_item_atualizar(itemId, dados) {
  return ItemsRepository.atualizar(itemId, dados);
}

/**
 * API: Desativa item
 */
function api_item_desativar(itemId) {
  return ItemsRepository.desativar(itemId);
}

/**
 * API: Reativa item
 */
function api_item_reativar(itemId) {
  return ItemsRepository.reativar(itemId);
}

/**
 * API: Obtém item por ID
 */
function api_item_obter(itemId) {
  return ItemsRepository.obterPorId(itemId);
}

/**
 * API: Lista itens
 */
function api_itens_listar(filtros) {
  return ItemsRepository.listar(filtros);
}

/**
 * API: Busca itens
 */
function api_itens_buscar(termo) {
  return ItemsRepository.buscar(termo);
}

/**
 * API: Lista por grupo
 */
function api_itens_por_grupo(grupo) {
  return ItemsRepository.listarPorGrupo(grupo);
}

/**
 * API: Lista sem glúten
 */
function api_itens_sem_gluten() {
  return ItemsRepository.listarSemGluten();
}

/**
 * API: Lista sem lactose
 */
function api_itens_sem_lactose() {
  return ItemsRepository.listarSemLactose();
}

/**
 * API: Lista seguros para alergênicos
 */
function api_itens_seguros(alergenicosEvitar) {
  return ItemsRepository.listarSeguros(alergenicosEvitar);
}

/**
 * API: Calcula nutricional
 */
function api_item_nutricional(itemId, quantidadeG) {
  return ItemsRepository.calcularNutricional(itemId, quantidadeG);
}

/**
 * API: Calcula nutricional múltiplo
 */
function api_itens_nutricional(itens) {
  return ItemsRepository.calcularNutricionalMultiplo(itens);
}

/**
 * API: Sugere substituições
 */
function api_item_substituicoes(itemId, restricoes) {
  return ItemsRepository.sugerirSubstituicoes(itemId, restricoes);
}

/**
 * API: Estatísticas do repositório
 */
function api_itens_estatisticas() {
  return ItemsRepository.obterEstatisticas();
}

/**
 * API: Configurações disponíveis
 */
function api_itens_config() {
  return ItemsRepository.obterConfiguracoes();
}

/**
 * API: Importa itens em lote
 */
function api_itens_importar(itens) {
  return ItemsRepository.importarLote(itens);
}

// ============================================================================
// DADOS INICIAIS DE EXEMPLO
// ============================================================================

/**
 * Popula planilha com itens alimentares básicos
 * Executar uma vez para ter dados iniciais
 */
function popularItensBasicos() {
  try {
    try {
      var itensBasicos = [
        { nome: 'Arroz branco', grupoAlimentar: 'CEREAIS', calorias100g: 130, proteinas: 2.7, carboidratos: 28, gorduras: 0.3, fibras: 0.4 },
        { nome: 'Feijão carioca', grupoAlimentar: 'LEGUMINOSAS', calorias100g: 76, proteinas: 4.8, carboidratos: 13.6, gorduras: 0.5, fibras: 8.5 },
        { nome: 'Frango (peito)', grupoAlimentar: 'CARNES', calorias100g: 159, proteinas: 32, carboidratos: 0, gorduras: 3.2, fibras: 0 },
        { nome: 'Carne bovina (patinho)', grupoAlimentar: 'CARNES', calorias100g: 133, proteinas: 26.4, carboidratos: 0, gorduras: 3.2, fibras: 0 },
        { nome: 'Ovo de galinha', grupoAlimentar: 'CARNES', calorias100g: 143, proteinas: 13, carboidratos: 0.7, gorduras: 9.5, fibras: 0 },
        { nome: 'Leite integral', grupoAlimentar: 'LATICINIOS', calorias100g: 61, proteinas: 3.2, carboidratos: 4.5, gorduras: 3.5, fibras: 0, contemLactose: true },
        { nome: 'Queijo mussarela', grupoAlimentar: 'LATICINIOS', calorias100g: 330, proteinas: 22, carboidratos: 3, gorduras: 26, fibras: 0, contemLactose: true },
        { nome: 'Banana prata', grupoAlimentar: 'FRUTAS', calorias100g: 98, proteinas: 1.3, carboidratos: 26, gorduras: 0.1, fibras: 2 },
        { nome: 'Maçã', grupoAlimentar: 'FRUTAS', calorias100g: 56, proteinas: 0.3, carboidratos: 15.2, gorduras: 0, fibras: 1.3 },
        { nome: 'Laranja', grupoAlimentar: 'FRUTAS', calorias100g: 37, proteinas: 1, carboidratos: 8.9, gorduras: 0.1, fibras: 0.8 },
        { nome: 'Alface', grupoAlimentar: 'HORTALICAS', calorias100g: 11, proteinas: 1.3, carboidratos: 1.7, gorduras: 0.2, fibras: 1 },
        { nome: 'Tomate', grupoAlimentar: 'HORTALICAS', calorias100g: 15, proteinas: 1.1, carboidratos: 3.1, gorduras: 0.2, fibras: 1.2 },
        { nome: 'Cenoura', grupoAlimentar: 'HORTALICAS', calorias100g: 34, proteinas: 1.3, carboidratos: 7.7, gorduras: 0.2, fibras: 3.2 },
        { nome: 'Batata inglesa', grupoAlimentar: 'HORTALICAS', calorias100g: 52, proteinas: 1.2, carboidratos: 11.9, gorduras: 0, fibras: 1.3 },
        { nome: 'Pão francês', grupoAlimentar: 'CEREAIS', calorias100g: 300, proteinas: 8, carboidratos: 58.6, gorduras: 3.1, fibras: 2.3, contemGluten: true },
        { nome: 'Macarrão', grupoAlimentar: 'CEREAIS', calorias100g: 371, proteinas: 10, carboidratos: 78, gorduras: 1.2, fibras: 2.9, contemGluten: true },
        { nome: 'Óleo de soja', grupoAlimentar: 'OLEOS', calorias100g: 884, proteinas: 0, carboidratos: 0, gorduras: 100, fibras: 0 },
        { nome: 'Açúcar refinado', grupoAlimentar: 'ACUCARES', calorias100g: 387, proteinas: 0, carboidratos: 99.5, gorduras: 0, fibras: 0 }
      ];
  
      var resultado = ItemsRepository.importarLote(itensBasicos);
      Logger.log('Itens básicos populados: ' + JSON.stringify(resultado));
  
      SpreadsheetApp.getUi().alert('Itens Básicos', 
        'Importados: ' + resultado.sucesso + ' de ' + resultado.total,
        SpreadsheetApp.getUi().ButtonSet.OK);
  
      return resultado;
    } catch (error) {
      Logger.log("Erro em popularItensBasicos: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em popularItensBasicos: " + error.message);
    throw error;
  }
}

// ============================================================================
// REGISTRO DO MÓDULO
// ============================================================================

Logger.log('✅ Core_Items_Repository.gs carregado - ItemsRepository disponível');
