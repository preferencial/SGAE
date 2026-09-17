/**
 * @fileoverview Validador Nutricional PNAE - Alimentação Escolar CRE-PP
 * @version 1.0.0
 * 
 * Intervenção 14/38: NutritionValidator conforme Prompt 14
 * 
 * Validador que verifica se o cardápio atende às diretrizes do PNAE:
 * - Oferta mínima de frutas e hortaliças
 * - Restrição de açúcares e ultraprocessados
 * - Limites de sódio e gorduras
 * - Adequação calórica por faixa etária
 * 
 * Baseado na Resolução CD/FNDE nº 6/2020
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-25
 */

'use strict';

// ============================================================================
// NUTRITION VALIDATOR - Validador Nutricional PNAE
// ============================================================================

var NutritionValidator = (function() {
  
  // =========================================================================
  // DIRETRIZES PNAE (Resolução CD/FNDE nº 6/2020)
  // =========================================================================
  
  var DIRETRIZES = {
    
    // Necessidades nutricionais por faixa etária (por refeição)
    // Baseado em 20% das necessidades diárias para refeição parcial
    NECESSIDADES_REFEICAO: {
      CRECHE_0_5M: {
        nome: 'Creche 0-5 meses',
        calorias: { min: 90, max: 110 },
        proteinas: { min: 2, max: 4 },
        lipidios: { min: 3, max: 5 },
        carboidratos: { min: 12, max: 16 },
        fibras: { min: 0, max: 2 },
        calcio: { min: 40, max: 60 },
        ferro: { min: 0.5, max: 1 },
        sodio: { min: 0, max: 120 }
      },
      CRECHE_6_11M: {
        nome: 'Creche 6-11 meses',
        calorias: { min: 135, max: 165 },
        proteinas: { min: 3, max: 5 },
        lipidios: { min: 4, max: 6 },
        carboidratos: { min: 18, max: 24 },
        fibras: { min: 1, max: 3 },
        calcio: { min: 54, max: 66 },
        ferro: { min: 2, max: 3 },
        sodio: { min: 0, max: 150 }
      },
      CRECHE_1_3A: {
        nome: 'Creche 1-3 anos',
        calorias: { min: 270, max: 330 },
        proteinas: { min: 8, max: 12 },
        lipidios: { min: 8, max: 12 },
        carboidratos: { min: 40, max: 52 },
        fibras: { min: 3, max: 5 },
        calcio: { min: 140, max: 180 },
        ferro: { min: 1.4, max: 2 },
        sodio: { min: 0, max: 300 }
      },

      CRECHE_4_5A: {
        nome: 'Creche 4-5 anos',
        calorias: { min: 270, max: 330 },
        proteinas: { min: 8, max: 12 },
        lipidios: { min: 8, max: 12 },
        carboidratos: { min: 40, max: 52 },
        fibras: { min: 4, max: 6 },
        calcio: { min: 160, max: 200 },
        ferro: { min: 2, max: 3 },
        sodio: { min: 0, max: 300 }
      },
      FUNDAMENTAL_6_10A: {
        nome: 'Fundamental 6-10 anos',
        calorias: { min: 300, max: 370 },
        proteinas: { min: 9, max: 14 },
        lipidios: { min: 8, max: 12 },
        carboidratos: { min: 45, max: 60 },
        fibras: { min: 4, max: 6 },
        calcio: { min: 210, max: 260 },
        ferro: { min: 1.8, max: 2.5 },
        sodio: { min: 0, max: 400 }
      },
      FUNDAMENTAL_11_15A: {
        nome: 'Fundamental 11-15 anos',
        calorias: { min: 415, max: 510 },
        proteinas: { min: 13, max: 20 },
        lipidios: { min: 11, max: 17 },
        carboidratos: { min: 62, max: 82 },
        fibras: { min: 5, max: 8 },
        calcio: { min: 260, max: 320 },
        ferro: { min: 2.2, max: 3.5 },
        sodio: { min: 0, max: 400 }
      },
      MEDIO_EJA: {
        nome: 'Médio e EJA',
        calorias: { min: 415, max: 510 },
        proteinas: { min: 13, max: 20 },
        lipidios: { min: 11, max: 17 },
        carboidratos: { min: 62, max: 82 },
        fibras: { min: 5, max: 8 },
        calcio: { min: 260, max: 320 },
        ferro: { min: 2.6, max: 4 },
        sodio: { min: 0, max: 400 }
      },
      INTEGRAL: {
        nome: 'Tempo Integral (70%)',
        calorias: { min: 945, max: 1155 },
        proteinas: { min: 30, max: 45 },
        lipidios: { min: 26, max: 39 },
        carboidratos: { min: 140, max: 185 },
        fibras: { min: 12, max: 18 },
        calcio: { min: 590, max: 720 },
        ferro: { min: 6, max: 9 },
        sodio: { min: 0, max: 900 }
      }
    },
    
    // Percentuais obrigatórios por grupo alimentar (semanal)
    GRUPOS_OBRIGATORIOS: {
      frutas: {
        nome: 'Frutas',
        percentualMinimo: 0.15,
        frequenciaMinimaSemanal: 3,
        descricao: 'Mínimo 3x por semana'
      },
      hortalicas: {
        nome: 'Hortaliças',
        percentualMinimo: 0.15,
        frequenciaMinimaSemanal: 3,
        descricao: 'Mínimo 3x por semana'
      },
      leguminosas: {
        nome: 'Leguminosas',
        percentualMinimo: 0.05,
        frequenciaMinimaSemanal: 1,
        descricao: 'Mínimo 1x por semana'
      }
    },
    
    // Alimentos PROIBIDOS pelo PNAE
    PROIBIDOS: {
      bebidas_acucaradas: ['refrigerante', 'suco artificial', 'refresco em pó', 'néctar'],
      ultraprocessados: ['salgadinho', 'biscoito recheado', 'macarrão instantâneo', 'nuggets', 'salsicha', 'mortadela', 'presunto'],
      outros: ['bala', 'pirulito', 'chiclete', 'chocolate']
    },
    
    // Limites de restrição
    LIMITES: {
      acucarAdicionado: {
        percentualMaximo: 0.10,
        descricao: 'Máximo 10% das calorias de açúcar adicionado'
      },
      gorduraSaturada: {
        percentualMaximo: 0.10,
        descricao: 'Máximo 10% das calorias de gordura saturada'
      },
      gorduraTrans: {
        percentualMaximo: 0.01,
        descricao: 'Máximo 1% das calorias de gordura trans'
      },
      sodio: {
        mgPorRefeicao: 400,
        descricao: 'Máximo 400mg de sódio por refeição'
      }
    },
    
    // Agricultura Familiar (mínimo 30%)
    AGRICULTURA_FAMILIAR: {
      percentualMinimo: 0.30,
      descricao: 'Mínimo 30% dos recursos devem ser da agricultura familiar'
    }
  };

  // =========================================================================
  // FUNÇÕES PRIVADAS
  // =========================================================================
  
  /**
   * Identifica grupo alimentar de um item
   * @private
   */
  function _identificarGrupo(item) {
    if (!item) return 'outros';
    
    var nome = (item.Nome || '').toLowerCase();
    var grupo = (item.Grupo_Alimentar || '').toLowerCase();
    
    // Frutas
    var frutas = ['banana', 'maçã', 'laranja', 'mamão', 'melancia', 'manga', 'abacaxi', 
                  'uva', 'morango', 'pera', 'melão', 'goiaba', 'acerola', 'tangerina', 'limão'];
    for (var i = 0; i < frutas.length; i++) {
      if (nome.indexOf(frutas[i]) !== -1) return 'frutas';
    }
    if (grupo === 'frutas') return 'frutas';
    
    // Hortaliças
    var hortalicas = ['alface', 'tomate', 'cenoura', 'beterraba', 'chuchu', 'abobrinha',
                      'pepino', 'repolho', 'couve', 'brócolis', 'espinafre', 'abóbora',
                      'batata', 'mandioca', 'inhame', 'cebola', 'alho'];
    for (var j = 0; j < hortalicas.length; j++) {
      if (nome.indexOf(hortalicas[j]) !== -1) return 'hortalicas';
    }
    if (grupo === 'hortalicas') return 'hortalicas';
    
    // Leguminosas
    var leguminosas = ['feijão', 'lentilha', 'grão de bico', 'ervilha', 'soja'];
    for (var k = 0; k < leguminosas.length; k++) {
      if (nome.indexOf(leguminosas[k]) !== -1) return 'leguminosas';
    }
    if (grupo === 'leguminosas') return 'leguminosas';
    
    // Proteínas
    var proteinas = ['carne', 'frango', 'peixe', 'ovo', 'fígado'];
    for (var l = 0; l < proteinas.length; l++) {
      if (nome.indexOf(proteinas[l]) !== -1) return 'proteinas';
    }
    if (grupo === 'carnes') return 'proteinas';
    
    // Cereais
    var cereais = ['arroz', 'macarrão', 'pão', 'farinha', 'aveia', 'milho', 'fubá'];
    for (var m = 0; m < cereais.length; m++) {
      if (nome.indexOf(cereais[m]) !== -1) return 'cereais';
    }
    if (grupo === 'cereais') return 'cereais';
    
    // Laticínios
    var laticinios = ['leite', 'queijo', 'iogurte', 'requeijão'];
    for (var n = 0; n < laticinios.length; n++) {
      if (nome.indexOf(laticinios[n]) !== -1) return 'laticinios';
    }
    if (grupo === 'laticinios') return 'laticinios';
    
    return 'outros';
  }
  
  /**
   * Verifica se item é proibido pelo PNAE
   * @private
   */
  function _verificarProibido(item) {
    if (!item) return { proibido: false };
    
    var nome = (item.Nome || '').toLowerCase();
    
    for (var categoria in DIRETRIZES.PROIBIDOS) {
      var lista = DIRETRIZES.PROIBIDOS[categoria];
      for (var i = 0; i < lista.length; i++) {
        if (nome.indexOf(lista[i]) !== -1) {
          return {
            proibido: true,
            categoria: categoria,
            item: lista[i],
            motivo: 'Item proibido pelo PNAE: ' + lista[i]
          };
        }
      }
    }
    
    return { proibido: false };
  }
  
  // =========================================================================
  // API PÚBLICA
  // =========================================================================
  
  return {
    DIRETRIZES: DIRETRIZES,

    // -----------------------------------------------------------------------
    // VALIDAÇÃO COMPLETA DE CARDÁPIO
    // -----------------------------------------------------------------------
    
    /**
     * Valida cardápio completo conforme diretrizes PNAE
     * @param {Object} cardapio - Cardápio com itens e informações nutricionais
     * @param {string} faixaEtaria - Código da faixa etária
     * @returns {Object} Resultado detalhado da validação
     */
    validarCardapio: function(cardapio, faixaEtaria) {
      try {
        var resultado = {
          aprovado: true,
          pontuacao: 100,
          faixaEtaria: faixaEtaria,
          validacoes: {
            calorias: null,
            macronutrientes: null,
            gruposAlimentares: null,
            itensProibidos: null,
            sodio: null
          },
          errosCriticos: [],
          alertas: [],
          recomendacoes: []
        };
      
        try {
          var necessidades = DIRETRIZES.NECESSIDADES_REFEICAO[faixaEtaria];
          if (!necessidades) {
            necessidades = DIRETRIZES.NECESSIDADES_REFEICAO.FUNDAMENTAL_6_10A;
            resultado.alertas.push('Faixa etária não encontrada, usando padrão Fundamental 6-10 anos');
          }
        
          // Obtém itens e nutricionais
          var itens = cardapio.itens || [];
          var nutri = cardapio.nutricional || cardapio.totais || {};
        
          // 1. Validação de Calorias
          resultado.validacoes.calorias = this._validarCalorias(nutri, necessidades);
          if (!resultado.validacoes.calorias.adequado) {
            resultado.alertas.push(resultado.validacoes.calorias.mensagem);
            resultado.pontuacao -= 10;
          }
        
          // 2. Validação de Macronutrientes
          resultado.validacoes.macronutrientes = this._validarMacronutrientes(nutri, necessidades);
          resultado.validacoes.macronutrientes.detalhes.forEach(function(d) {
            if (!d.adequado) {
              resultado.alertas.push(d.mensagem);
              resultado.pontuacao -= 5;
            }
          });
        
          // 3. Validação de Grupos Alimentares
          resultado.validacoes.gruposAlimentares = this._validarGruposAlimentares(itens);
          if (!resultado.validacoes.gruposAlimentares.adequado) {
            resultado.validacoes.gruposAlimentares.faltando.forEach(function(g) {
              resultado.alertas.push('Grupo alimentar insuficiente: ' + g.nome);
              resultado.pontuacao -= 10;
            });
          }
        
          // 4. Verificação de Itens Proibidos
          resultado.validacoes.itensProibidos = this._verificarItensProibidos(itens);
          if (resultado.validacoes.itensProibidos.encontrados.length > 0) {
            resultado.aprovado = false;
            resultado.validacoes.itensProibidos.encontrados.forEach(function(p) {
              resultado.errosCriticos.push('PROIBIDO: ' + p.item + ' - ' + p.motivo);
            });
            resultado.pontuacao -= 30;
          }
        
          // 5. Validação de Sódio
          resultado.validacoes.sodio = this._validarSodio(nutri, necessidades);
          if (!resultado.validacoes.sodio.adequado) {
            resultado.alertas.push(resultado.validacoes.sodio.mensagem);
            resultado.pontuacao -= 10;
          }
        
          // Gera recomendações
          resultado.recomendacoes = this._gerarRecomendacoes(resultado);
        
          // Garante pontuação mínima
          resultado.pontuacao = Math.max(0, resultado.pontuacao);
        
          // Aprovado se não tem erros críticos e pontuação >= 60
          resultado.aprovado = resultado.errosCriticos.length === 0 && resultado.pontuacao >= 60;
        
          resultado.classificacao = this._classificarPontuacao(resultado.pontuacao);
        
        } catch (e) {
          resultado.aprovado = false;
          resultado.errosCriticos.push('Erro na validação: ' + e.message);
        }
      
        return resultado;
      } catch (error) {
        Logger.log("Erro em validarCardapio: " + error.message);
        throw error;
      }
    },

    // -----------------------------------------------------------------------
    // VALIDAÇÕES ESPECÍFICAS
    // -----------------------------------------------------------------------
    
    /**
     * Valida calorias
     * @private
     */
    _validarCalorias: function(nutri, necessidades) {
      try {
        var calorias = Number(nutri.calorias) || 0;
        var min = necessidades.calorias.min;
        var max = necessidades.calorias.max;
      
        var resultado = {
          valor: calorias,
          minimo: min,
          maximo: max,
          adequado: calorias >= min && calorias <= max
        };
      
        if (calorias < min) {
          resultado.mensagem = 'Calorias abaixo do mínimo: ' + calorias + ' kcal (mín: ' + min + ')';
          resultado.desvio = 'ABAIXO';
        } else if (calorias > max) {
          resultado.mensagem = 'Calorias acima do máximo: ' + calorias + ' kcal (máx: ' + max + ')';
          resultado.desvio = 'ACIMA';
        } else {
          resultado.mensagem = 'Calorias adequadas: ' + calorias + ' kcal';
          resultado.desvio = 'OK';
        }
      
        return resultado;
      } catch (error) {
        Logger.log("Erro em _validarCalorias: " + error.message);
        throw error;
      }
    },
    
    /**
     * Valida macronutrientes
     * @private
     */
    _validarMacronutrientes: function(nutri, necessidades) {
      try {
        var resultado = {
          adequado: true,
          detalhes: []
        };
      
        var macros = [
          { nome: 'Proteínas', campo: 'proteinas', unidade: 'g' },
          { nome: 'Carboidratos', campo: 'carboidratos', unidade: 'g' },
          { nome: 'Lipídios', campo: 'lipidios', unidade: 'g' },
          { nome: 'Fibras', campo: 'fibras', unidade: 'g' }
        ];
      
        macros.forEach(function(macro) {
          var valor = Number(nutri[macro.campo]) || 0;
          var ref = necessidades[macro.campo];
        
          if (!ref) {
            resultado.detalhes.push({
              nutriente: macro.nome,
              valor: valor,
              adequado: true,
              mensagem: macro.nome + ': ' + valor + macro.unidade + ' (sem referência)'
            });
            return;
          }
        
          var adequado = valor >= ref.min && valor <= ref.max;
        
          var detalhe = {
            nutriente: macro.nome,
            valor: valor,
            minimo: ref.min,
            maximo: ref.max,
            adequado: adequado
          };
        
          if (valor < ref.min) {
            detalhe.mensagem = macro.nome + ' abaixo: ' + valor + macro.unidade + ' (mín: ' + ref.min + ')';
            detalhe.desvio = 'ABAIXO';
          } else if (valor > ref.max) {
            detalhe.mensagem = macro.nome + ' acima: ' + valor + macro.unidade + ' (máx: ' + ref.max + ')';
            detalhe.desvio = 'ACIMA';
          } else {
            detalhe.mensagem = macro.nome + ' adequado: ' + valor + macro.unidade;
            detalhe.desvio = 'OK';
          }
        
          if (!adequado) resultado.adequado = false;
          resultado.detalhes.push(detalhe);
        });
      
        return resultado;
      } catch (error) {
        Logger.log("Erro em _validarMacronutrientes: " + error.message);
        throw error;
      }
    },
    
    /**
     * Valida grupos alimentares
     * @private
     */
    _validarGruposAlimentares: function(itens) {
      try {
        var contagem = {
          frutas: 0,
          hortalicas: 0,
          leguminosas: 0,
          proteinas: 0,
          cereais: 0,
          laticinios: 0,
          outros: 0
        };
      
        // Carrega itens alimentares se disponível
        var itensInfo = {};
        if (typeof ItemsRepository !== 'undefined') {
          var todosItens = ItemsRepository.listar({ apenasAtivos: true });
          if (todosItens.success) {
            todosItens.itens.forEach(function(item) {
              itensInfo[item.ID] = item;
            });
          }
        }
      
        // Conta itens por grupo
        itens.forEach(function(itemCardapio) {
          var itemId = itemCardapio.Item_ID || itemCardapio.id;
          var item = itensInfo[itemId] || itemCardapio;
          var grupo = _identificarGrupo(item);
          contagem[grupo] = (contagem[grupo] || 0) + 1;
        });
      
        var total = itens.length || 1;
        var resultado = {
          adequado: true,
          contagem: contagem,
          percentuais: {},
          faltando: []
        };
      
        // Calcula percentuais
        for (var g in contagem) {
          resultado.percentuais[g] = Math.round((contagem[g] / total) * 100);
        }
      
        // Verifica grupos obrigatórios
        for (var grupo in DIRETRIZES.GRUPOS_OBRIGATORIOS) {
          var regra = DIRETRIZES.GRUPOS_OBRIGATORIOS[grupo];
          var percentual = contagem[grupo] / total;
        
          if (percentual < regra.percentualMinimo || contagem[grupo] < 1) {
            resultado.adequado = false;
            resultado.faltando.push({
              grupo: grupo,
              nome: regra.nome,
              atual: contagem[grupo],
              percentualAtual: Math.round(percentual * 100),
              percentualMinimo: Math.round(regra.percentualMinimo * 100),
              descricao: regra.descricao
            });
          }
        }
      
        return resultado;
      } catch (error) {
        Logger.log("Erro em _validarGruposAlimentares: " + error.message);
        throw error;
      }
    },

    /**
     * Verifica itens proibidos
     * @private
     */
    _verificarItensProibidos: function(itens) {
      try {
        var resultado = {
          encontrados: [],
          verificados: itens.length
        };
      
        var itensInfo = {};
        if (typeof ItemsRepository !== 'undefined') {
          var todosItens = ItemsRepository.listar({ apenasAtivos: false });
          if (todosItens.success) {
            todosItens.itens.forEach(function(item) {
              itensInfo[item.ID] = item;
            });
          }
        }
      
        itens.forEach(function(itemCardapio) {
          var itemId = itemCardapio.Item_ID || itemCardapio.id;
          var item = itensInfo[itemId] || itemCardapio;
        
          var verificacao = _verificarProibido(item);
          if (verificacao.proibido) {
            resultado.encontrados.push({
              itemId: itemId,
              item: item.Nome || itemId,
              categoria: verificacao.categoria,
              motivo: verificacao.motivo
            });
          }
        });
      
        return resultado;
      } catch (error) {
        Logger.log("Erro em _verificarItensProibidos: " + error.message);
        throw error;
      }
    },
    
    /**
     * Valida sódio
     * @private
     */
    _validarSodio: function(nutri, necessidades) {
      try {
        var sodio = Number(nutri.sodio) || 0;
        var max = necessidades.sodio ? necessidades.sodio.max : DIRETRIZES.LIMITES.sodio.mgPorRefeicao;
      
        var resultado = {
          valor: sodio,
          maximo: max,
          adequado: sodio <= max
        };
      
        if (sodio > max) {
          resultado.mensagem = 'Sódio acima do limite: ' + sodio + 'mg (máx: ' + max + 'mg)';
          resultado.desvio = 'ACIMA';
        } else {
          resultado.mensagem = 'Sódio adequado: ' + sodio + 'mg';
          resultado.desvio = 'OK';
        }
      
        return resultado;
      } catch (error) {
        Logger.log("Erro em _validarSodio: " + error.message);
        throw error;
      }
    },
    
    /**
     * Gera recomendações baseadas na validação
     * @private
     */
    _gerarRecomendacoes: function(resultado) {
      try {
        var recomendacoes = [];
      
        // Calorias
        if (resultado.validacoes.calorias && resultado.validacoes.calorias.desvio === 'ABAIXO') {
          recomendacoes.push('Aumentar porções ou adicionar alimentos energéticos (cereais, tubérculos)');
        } else if (resultado.validacoes.calorias && resultado.validacoes.calorias.desvio === 'ACIMA') {
          recomendacoes.push('Reduzir porções ou substituir por preparações menos calóricas');
        }
      
        // Grupos alimentares
        if (resultado.validacoes.gruposAlimentares && resultado.validacoes.gruposAlimentares.faltando) {
          resultado.validacoes.gruposAlimentares.faltando.forEach(function(g) {
            if (g.grupo === 'frutas') {
              recomendacoes.push('Incluir frutas: banana, maçã, laranja ou frutas da estação');
            } else if (g.grupo === 'hortalicas') {
              recomendacoes.push('Incluir hortaliças: salada, legumes cozidos ou refogados');
            } else if (g.grupo === 'leguminosas') {
              recomendacoes.push('Incluir leguminosas: feijão, lentilha ou grão-de-bico');
            }
          });
        }
      
        // Sódio
        if (resultado.validacoes.sodio && resultado.validacoes.sodio.desvio === 'ACIMA') {
          recomendacoes.push('Reduzir sal e evitar alimentos industrializados');
          recomendacoes.push('Usar temperos naturais: alho, cebola, ervas');
        }
      
        // Macronutrientes
        if (resultado.validacoes.macronutrientes) {
          resultado.validacoes.macronutrientes.detalhes.forEach(function(d) {
            if (d.nutriente === 'Proteínas' && d.desvio === 'ABAIXO') {
              recomendacoes.push('Aumentar fontes de proteína: carnes magras, ovos, leguminosas');
            }
            if (d.nutriente === 'Fibras' && d.desvio === 'ABAIXO') {
              recomendacoes.push('Aumentar fibras: cereais integrais, frutas com casca, verduras');
            }
          });
        }
      
        return recomendacoes;
      } catch (error) {
        Logger.log("Erro em _gerarRecomendacoes: " + error.message);
        throw error;
      }
    },
    
    /**
     * Classifica pontuação
     * @private
     */
    _classificarPontuacao: function(pontuacao) {
      if (pontuacao >= 90) return { nivel: 'EXCELENTE', cor: '#2E7D32', emoji: '🌟' };
      if (pontuacao >= 80) return { nivel: 'BOM', cor: '#43A047', emoji: '✅' };
      if (pontuacao >= 70) return { nivel: 'REGULAR', cor: '#FFA000', emoji: '⚠️' };
      if (pontuacao >= 60) return { nivel: 'ATENÇÃO', cor: '#EF6C00', emoji: '⚡' };
      return { nivel: 'INADEQUADO', cor: '#D32F2F', emoji: '❌' };
    },

    // -----------------------------------------------------------------------
    // VALIDAÇÃO DE CARDÁPIO SEMANAL
    // -----------------------------------------------------------------------
    
    /**
     * Valida cardápio semanal completo
     * @param {Array} cardapiosSemana - Array de cardápios (Segunda a Sexta)
     * @param {string} faixaEtaria - Faixa etária
     * @returns {Object} Resultado consolidado
     */
    validarSemana: function(cardapiosSemana, faixaEtaria) {
      try {
        var resultado = {
          aprovado: true,
          pontuacaoMedia: 0,
          diasValidados: 0,
          validacoesDiarias: [],
          consolidado: {
            frutas: { dias: 0, minimo: 3 },
            hortalicas: { dias: 0, minimo: 3 },
            leguminosas: { dias: 0, minimo: 1 }
          },
          errosCriticos: [],
          alertas: []
        };
      
        var somaPontuacao = 0;
      
        cardapiosSemana.forEach(function(cardapio, idx) {
          var dia = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'][idx] || 'Dia ' + (idx + 1);
          var validacao = this.validarCardapio(cardapio, faixaEtaria);
        
          validacao.dia = dia;
          resultado.validacoesDiarias.push(validacao);
          resultado.diasValidados++;
          somaPontuacao += validacao.pontuacao;
        
          if (!validacao.aprovado) {
            resultado.aprovado = false;
            validacao.errosCriticos.forEach(function(e) {
              resultado.errosCriticos.push(dia + ': ' + e);
            });
          }
        
          // Conta grupos por dia
          if (validacao.validacoes.gruposAlimentares) {
            var grupos = validacao.validacoes.gruposAlimentares.contagem;
            if (grupos.frutas > 0) resultado.consolidado.frutas.dias++;
            if (grupos.hortalicas > 0) resultado.consolidado.hortalicas.dias++;
            if (grupos.leguminosas > 0) resultado.consolidado.leguminosas.dias++;
          }
        }.bind(this));
      
        // Calcula média
        resultado.pontuacaoMedia = Math.round(somaPontuacao / resultado.diasValidados);
      
        // Verifica frequência semanal
        for (var grupo in resultado.consolidado) {
          var g = resultado.consolidado[grupo];
          g.adequado = g.dias >= g.minimo;
          if (!g.adequado) {
            resultado.alertas.push(
              grupo.charAt(0).toUpperCase() + grupo.slice(1) + 
              ' presente em ' + g.dias + ' dias (mínimo: ' + g.minimo + ')'
            );
          }
        }
      
        resultado.classificacao = this._classificarPontuacao(resultado.pontuacaoMedia);
      
        return resultado;
      } catch (error) {
        Logger.log("Erro em validarSemana: " + error.message);
        throw error;
      }
    },
    
    // -----------------------------------------------------------------------
    // UTILITÁRIOS
    // -----------------------------------------------------------------------
    
    /**
     * Obtém necessidades nutricionais por faixa etária
     * @param {string} faixaEtaria - Código da faixa
     * @returns {Object} Necessidades
     */
    obterNecessidades: function(faixaEtaria) {
      try {
        return {
          success: true,
          faixaEtaria: faixaEtaria,
          necessidades: DIRETRIZES.NECESSIDADES_REFEICAO[faixaEtaria] || null,
          todasFaixas: Object.keys(DIRETRIZES.NECESSIDADES_REFEICAO)
        };
      } catch (error) {
        Logger.log("Erro em obterNecessidades: " + error.message);
        throw error;
      }
    },
    
    /**
     * Verifica se item específico é proibido
     * @param {string} nomeItem - Nome do item
     * @returns {Object} Resultado
     */
    verificarItemProibido: function(nomeItem) {
      return _verificarProibido({ Nome: nomeItem });
    },
    
    /**
     * Obtém lista de alimentos proibidos
     * @returns {Object} Lista
     */
    obterProibidos: function() {
      return {
        success: true,
        proibidos: DIRETRIZES.PROIBIDOS
      };
    },
    
    /**
     * Obtém diretrizes completas
     * @returns {Object} Diretrizes
     */
    obterDiretrizes: function() {
      return {
        success: true,
        diretrizes: DIRETRIZES
      };
    },
    
    /**
     * Calcula adequação percentual
     * @param {number} valor - Valor atual
     * @param {number} min - Mínimo
     * @param {number} max - Máximo
     * @returns {Object} Adequação
     */
    calcularAdequacao: function(valor, min, max) {
      var medio = (min + max) / 2;
      var percentual = (valor / medio) * 100;
      
      return {
        valor: valor,
        referencia: { min: min, max: max, medio: medio },
        percentual: Math.round(percentual),
        adequado: valor >= min && valor <= max,
        classificacao: percentual < 80 ? 'BAIXO' : (percentual > 120 ? 'ALTO' : 'ADEQUADO')
      };
    }
  };
})();


// ============================================================================
// FUNÇÕES GLOBAIS DE API
// ============================================================================

/**
 * API: Valida cardápio conforme PNAE
 */
function api_validar_cardapio_pnae(cardapio, faixaEtaria) {
  return NutritionValidator.validarCardapio(cardapio, faixaEtaria);
}

/**
 * API: Valida cardápio semanal
 */
function api_validar_semana_pnae(cardapiosSemana, faixaEtaria) {
  return NutritionValidator.validarSemana(cardapiosSemana, faixaEtaria);
}

/**
 * API: Obtém necessidades nutricionais
 */
function api_necessidades_nutricionais(faixaEtaria) {
  return NutritionValidator.obterNecessidades(faixaEtaria);
}

/**
 * API: Verifica item proibido
 */
function api_verificar_proibido(nomeItem) {
  return NutritionValidator.verificarItemProibido(nomeItem);
}

/**
 * API: Lista alimentos proibidos
 */
function api_alimentos_proibidos() {
  return NutritionValidator.obterProibidos();
}

/**
 * API: Obtém diretrizes PNAE
 */
function api_diretrizes_pnae() {
  return NutritionValidator.obterDiretrizes();
}

/**
 * API: Calcula adequação nutricional
 */
function api_calcular_adequacao(valor, min, max) {
  return NutritionValidator.calcularAdequacao(valor, min, max);
}

/**
 * Valida cardápio por ID (integração com MenuBuilder)
 */
function api_validar_cardapio_por_id(cardapioId, faixaEtaria) {
  if (typeof MenuBuilder === 'undefined') {
    return { success: false, error: 'MenuBuilder não disponível' };
  }
  
  var cardapioResult = MenuBuilder.obterCardapioCompleto(cardapioId);
  if (!cardapioResult.success) {
    return cardapioResult;
  }
  
  var cardapio = cardapioResult.cardapio;
  
  // Prepara dados para validação
  var dadosValidacao = {
    itens: cardapio.itens || [],
    nutricional: cardapio.nutricional ? cardapio.nutricional.totais : {},
    totais: cardapio.nutricional ? cardapio.nutricional.totais : {}
  };
  
  var faixa = faixaEtaria || cardapio.Faixa_Etaria || 'FUNDAMENTAL_6_10A';
  
  return NutritionValidator.validarCardapio(dadosValidacao, faixa);
}

// ============================================================================
// REGISTRO DO MÓDULO
// ============================================================================

Logger.log('✅ Core_Nutrition_Validator.gs carregado - NutritionValidator disponível');
