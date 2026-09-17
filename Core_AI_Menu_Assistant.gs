/**
 * @fileoverview Assistente IA para Cardápios - Alimentação Escolar CRE-PP
 * @version 1.0.0
 * 
 * Intervenção 19/38: AI_MenuAssistant conforme Prompt 19
 * 
 * Utiliza a API do Gemini para:
 * - Sugerir variações de cardápio baseadas em estoque
 * - Considerar sazonalidade dos alimentos
 * - Gerar substituições inteligentes
 * - Otimizar cardápios nutricionalmente
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-25
 */

'use strict';

// ============================================================================
// AI MENU ASSISTANT - Assistente de Cardápios com Gemini
// ============================================================================

var AIMenuAssistant = (function() {
  
  // =========================================================================
  // CONFIGURAÇÃO
  // =========================================================================
  
  var CONFIG = {
    // Modelo Gemini
    MODEL: 'gemini-1.5-flash',
    API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/',
    
    // Limites
    MAX_TOKENS: 2048,
    TEMPERATURE: 0.7,
    
    // Cache de respostas (minutos)
    CACHE_TTL: 30,
    
    // Contexto do sistema
    SYSTEM_CONTEXT: `Você é um nutricionista especialista em alimentação escolar brasileira, 
seguindo as diretrizes do PNAE (Programa Nacional de Alimentação Escolar).

Suas responsabilidades:
- Sugerir cardápios nutritivos e balanceados
- Considerar a sazonalidade dos alimentos no Brasil
- Respeitar restrições alimentares (glúten, lactose, alergias)
- Priorizar alimentos da agricultura familiar
- Manter custos acessíveis
- Garantir variedade e aceitação pelos alunos

Regras PNAE:
- Mínimo 3x frutas por semana
- Mínimo 3x hortaliças por semana
- Proibido: refrigerantes, ultraprocessados, salgadinhos
- Máximo 10% de açúcar adicionado
- Preferir preparações assadas/grelhadas

Responda sempre em português brasileiro, de forma clara e objetiva.`,

    // Sazonalidade de alimentos no Brasil
    SAZONALIDADE: {
      VERAO: { // Dez-Fev
        frutas: ['melancia', 'manga', 'abacaxi', 'uva', 'pêssego', 'ameixa', 'coco'],
        hortalicas: ['pepino', 'tomate', 'abobrinha', 'berinjela', 'pimentão', 'quiabo']
      },
      OUTONO: { // Mar-Mai
        frutas: ['banana', 'maçã', 'caqui', 'goiaba', 'abacate', 'maracujá'],
        hortalicas: ['abóbora', 'batata-doce', 'beterraba', 'cenoura', 'inhame']
      },
      INVERNO: { // Jun-Ago
        frutas: ['laranja', 'tangerina', 'morango', 'kiwi', 'carambola'],
        hortalicas: ['couve', 'brócolis', 'couve-flor', 'espinafre', 'acelga', 'agrião']
      },
      PRIMAVERA: { // Set-Nov
        frutas: ['mamão', 'melão', 'jabuticaba', 'pitanga', 'acerola'],
        hortalicas: ['alface', 'rúcula', 'repolho', 'chuchu', 'vagem', 'ervilha']
      }
    }
  };
  
  // =========================================================================
  // FUNÇÕES PRIVADAS
  // =========================================================================
  
  /**
   * Obtém chave da API do Gemini
   * @private
   */
  function _getApiKey() {
    try {
      try {
        // Tenta obter do PropertiesManager
        if (typeof PropertiesManager !== 'undefined') {
          var key = PropertiesManager.get('GEMINI_API_KEY');
          if (key) return key;
        }
      
        // Fallback para Script Properties
        var props = PropertiesService.getScriptProperties();
        return props.getProperty('GEMINI_API_KEY');
      
      } catch (e) {
        console.error('Erro ao obter API key: ' + e.message);
        return null;
      }
    } catch (error) {
      Logger.log("Erro em _getApiKey: " + error.message);
      throw error;
    }
  }
  
  /**
   * Faz chamada à API do Gemini
   * @private
   */
  function _callGemini(prompt, options) {
    try {
      try {
        options = options || {};
    
        var apiKey = _getApiKey();
        if (!apiKey) {
          return { success: false, error: 'API key do Gemini não configurada' };
        }
    
        try {
          var url = CONFIG.API_URL + CONFIG.MODEL + ':generateContent?key=' + apiKey;
      
          var payload = {
            contents: [{
              parts: [{
                text: CONFIG.SYSTEM_CONTEXT + '\n\n' + prompt
              }]
            }],
            generationConfig: {
              temperature: options.temperature || CONFIG.TEMPERATURE,
              maxOutputTokens: options.maxTokens || CONFIG.MAX_TOKENS
            }
          };
      
          // Resiliência a falhas transitórias (helper global em Core_Gemini_Service.gs).
          var response = fetchGeminiComRetentativa_(url, {
            method: 'POST',
            contentType: 'application/json',
            payload: JSON.stringify(payload),
            muteHttpExceptions: true
          });

          var responseCode = response.getResponseCode();
          var responseText = response.getContentText();
      
          if (responseCode !== 200) {
            console.error('Erro Gemini: ' + responseText);
            return { success: false, error: 'Erro na API: ' + responseCode };
          }
      
          var data = JSON.parse(responseText);
      
          if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            var text = data.candidates[0].content.parts[0].text;
            return { success: true, response: text };
          }
      
          return { success: false, error: 'Resposta inválida da API' };
      
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em _callGemini: " + error.message);
        throw error;
      }
    } catch (error) {
      Logger.log("Erro em _callGemini: " + error.message);
      throw error;
    }
  }
  
  /**
   * Obtém estação do ano atual
   * @private
   */
  function _getEstacaoAtual() {
    var mes = new Date().getMonth() + 1;
    if (mes >= 12 || mes <= 2) return 'VERAO';
    if (mes >= 3 && mes <= 5) return 'OUTONO';
    if (mes >= 6 && mes <= 8) return 'INVERNO';
    return 'PRIMAVERA';
  }
  
  /**
   * Obtém alimentos da estação
   * @private
   */
  function _getAlimentosSazonais() {
    var estacao = _getEstacaoAtual();
    return CONFIG.SAZONALIDADE[estacao];
  }
  
  /**
   * Gera chave de cache para consulta
   * @private
   */
  function _getCacheKey(tipo, params) {
    try {
      return 'ai_' + tipo + '_' + JSON.stringify(params).hashCode();
    } catch (error) {
      Logger.log("Erro em _getCacheKey: " + error.message);
      throw error;
    }
  }
  
  /**
   * Verifica cache antes de chamar API
   * @private
   */
  function _checkCache(cacheKey) {
    try {
      if (typeof SmartCache !== 'undefined') {
        return SmartCache.get(cacheKey);
      }
      var cache = CacheService.getScriptCache();
      var cached = cache.get(cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  }
  
  /**
   * Salva resposta no cache
   * @private
   */
  function _saveCache(cacheKey, data) {
    try {
      try {
        if (typeof SmartCache !== 'undefined') {
          SmartCache.set(cacheKey, data, CONFIG.CACHE_TTL * 60);
          return;
        }
        var cache = CacheService.getScriptCache();
        cache.put(cacheKey, JSON.stringify(data), CONFIG.CACHE_TTL * 60);
      } catch (e) {
        console.warn('Erro ao salvar cache: ' + e.message);
      }
    } catch (error) {
      Logger.log("Erro em _saveCache: " + error.message);
      throw error;
    }
  }
  
  /**
   * Obtém estoque atual do sistema
   * @private
   */
  function _getEstoqueAtual() {
    try {
      if (typeof ItemsRepository !== 'undefined') {
        return ItemsRepository.listarComEstoque();
      }
      // Fallback: busca direto da planilha
      if (typeof DatabaseEngine !== 'undefined') {
        return DatabaseEngine.read('Itens_Cardapio', { ativo: true });
      }
      return [];
    } catch (e) {
      console.error('Erro ao obter estoque: ' + e.message);
      return [];
    }
  }
  
  /**
   * Formata lista de itens para prompt
   * @private
   */
  function _formatarItensParaPrompt(itens) {
    if (!itens || itens.length === 0) return 'Nenhum item disponível';
    
    return itens.map(function(item) {
      return '- ' + item.nome + ' (' + (item.grupo || 'Geral') + ')' + 
             (item.quantidade ? ' - Qtd: ' + item.quantidade : '');
    }).join('\n');
  }
  
  // =========================================================================
  // API PÚBLICA
  // =========================================================================
  
  /**
   * Sugere variações de cardápio baseadas no estoque
   * @param {Object} options - Opções de sugestão
   * @param {Array} options.itensDisponiveis - Itens em estoque
   * @param {string} options.tipoRefeicao - Tipo: almoco, lanche, jantar
   * @param {number} options.numAlunos - Número de alunos
   * @param {Array} options.restricoes - Restrições a considerar
   * @returns {Object} Sugestões de cardápio
   */
  function sugerirVariacoes(options) {
    try {
      options = options || {};
    
      var itens = options.itensDisponiveis || _getEstoqueAtual();
      var sazonais = _getAlimentosSazonais();
      var estacao = _getEstacaoAtual();
    
      // Verifica cache
      var cacheKey = _getCacheKey('variacoes', {
        tipo: options.tipoRefeicao,
        estacao: estacao,
        numItens: itens.length
      });
    
      var cached = _checkCache(cacheKey);
      if (cached) {
        return { success: true, data: cached, fromCache: true };
      }
    
      var prompt = `Com base nos seguintes itens disponíveis em estoque:

  ${_formatarItensParaPrompt(itens)}

  E considerando que estamos no ${estacao.toLowerCase()} brasileiro, com os seguintes alimentos da estação:
  - Frutas: ${sazonais.frutas.join(', ')}
  - Hortaliças: ${sazonais.hortalicas.join(', ')}

  Sugira 3 variações de cardápio para ${options.tipoRefeicao || 'almoço'} escolar.
  ${options.numAlunos ? 'Quantidade de alunos: ' + options.numAlunos : ''}
  ${options.restricoes && options.restricoes.length > 0 ? 'Restrições a considerar: ' + options.restricoes.join(', ') : ''}

  Para cada variação, forneça:
  1. Nome do cardápio
  2. Lista de itens/preparações
  3. Valor nutricional aproximado (calorias, proteínas)
  4. Custo estimado por porção
  5. Dica de preparo

  Responda em formato estruturado.`;

      var result = _callGemini(prompt);
    
      if (result.success) {
        var data = {
          sugestoes: result.response,
          estacao: estacao,
          alimentosSazonais: sazonais,
          geradoEm: new Date().toISOString()
        };
        _saveCache(cacheKey, data);
        return { success: true, data: data };
      }
    
      return result;
    } catch (error) {
      Logger.log("Erro em sugerirVariacoes: " + error.message);
      throw error;
    }
  }
  
  /**
   * Sugere substituições inteligentes para um item
   * @param {Object} options - Opções de substituição
   * @param {string} options.itemOriginal - Item a ser substituído
   * @param {string} options.motivo - Motivo da substituição
   * @param {Array} options.restricoes - Restrições alimentares
   * @returns {Object} Sugestões de substituição
   */
  function sugerirSubstituicoes(options) {
    try {
      if (!options || !options.itemOriginal) {
        return { success: false, error: 'Item original é obrigatório' };
      }
    
      var sazonais = _getAlimentosSazonais();
      var estoque = _getEstoqueAtual();
    
      var prompt = `Preciso substituir o seguinte item do cardápio escolar:

  Item original: ${options.itemOriginal}
  Motivo da substituição: ${options.motivo || 'Indisponibilidade'}
  ${options.restricoes ? 'Restrições a considerar: ' + options.restricoes.join(', ') : ''}

  Itens disponíveis em estoque:
  ${_formatarItensParaPrompt(estoque)}

  Alimentos da estação atual:
  - Frutas: ${sazonais.frutas.join(', ')}
  - Hortaliças: ${sazonais.hortalicas.join(', ')}

  Sugira 3 substituições adequadas, considerando:
  1. Valor nutricional equivalente
  2. Aceitação pelos alunos
  3. Facilidade de preparo
  4. Custo similar

  Para cada substituição, explique brevemente o motivo da escolha.`;

      var result = _callGemini(prompt);
    
      if (result.success) {
        return {
          success: true,
          data: {
            itemOriginal: options.itemOriginal,
            substituicoes: result.response,
            geradoEm: new Date().toISOString()
          }
        };
      }
    
      return result;
    } catch (error) {
      Logger.log("Erro em sugerirSubstituicoes: " + error.message);
      throw error;
    }
  }
  
  /**
   * Otimiza cardápio nutricionalmente
   * @param {Object} cardapio - Cardápio a otimizar
   * @param {Array} cardapio.itens - Lista de itens do cardápio
   * @param {string} cardapio.tipoRefeicao - Tipo de refeição
   * @returns {Object} Cardápio otimizado
   */
  function otimizarCardapio(cardapio) {
    try {
      if (!cardapio || !cardapio.itens || cardapio.itens.length === 0) {
        return { success: false, error: 'Cardápio com itens é obrigatório' };
      }
    
      var prompt = `Analise e otimize o seguinte cardápio escolar:

  Tipo de refeição: ${cardapio.tipoRefeicao || 'Almoço'}
  Itens atuais:
  ${cardapio.itens.map(function(i) { return '- ' + i; }).join('\n')}

  Considerando as diretrizes do PNAE, avalie:
  1. Equilíbrio nutricional (carboidratos, proteínas, gorduras)
  2. Presença de frutas e hortaliças
  3. Ausência de ultraprocessados
  4. Variedade de cores e texturas
  5. Adequação calórica para faixa etária escolar

  Forneça:
  1. Pontuação nutricional (0-100)
  2. Pontos positivos do cardápio
  3. Pontos a melhorar
  4. Sugestões de ajustes específicos
  5. Cardápio otimizado final`;

      var result = _callGemini(prompt);
    
      if (result.success) {
        return {
          success: true,
          data: {
            cardapioOriginal: cardapio,
            analise: result.response,
            geradoEm: new Date().toISOString()
          }
        };
      }
    
      return result;
    } catch (error) {
      Logger.log("Erro em otimizarCardapio: " + error.message);
      throw error;
    }
  }
  
  /**
   * Analisa dados de aceitação dos cardápios
   * @param {Object} options - Opções de análise
   * @param {Array} options.dadosAceitacao - Dados de resto-ingestão
   * @param {string} options.periodo - Período de análise
   * @returns {Object} Análise de aceitação
   */
  function analisarAceitacao(options) {
    try {
      try {
        options = options || {};
    
        // Busca dados de desperdício se não fornecidos
        var dados = options.dadosAceitacao;
        if (!dados && typeof WasteTracker !== 'undefined') {
          var relatorio = WasteTracker.gerarRelatorio({
            periodo: options.periodo || 'mes'
          });
          if (relatorio.success) {
            dados = relatorio.data;
          }
        }
    
        if (!dados) {
          return { success: false, error: 'Dados de aceitação não disponíveis' };
        }
    
        var prompt = `Analise os seguintes dados de aceitação/desperdício de cardápios escolares:

    ${JSON.stringify(dados, null, 2)}

    Período: ${options.periodo || 'Último mês'}

    Forneça uma análise detalhada incluindo:
    1. Itens com maior aceitação (menor desperdício)
    2. Itens com menor aceitação (maior desperdício)
    3. Padrões identificados (dia da semana, tipo de preparação)
    4. Recomendações para melhorar a aceitação
    5. Sugestões de substituições para itens problemáticos
    6. Estimativa de economia potencial com as melhorias`;

        var result = _callGemini(prompt);
    
        if (result.success) {
          return {
            success: true,
            data: {
              dadosAnalisados: dados,
              analise: result.response,
              periodo: options.periodo,
              geradoEm: new Date().toISOString()
            }
          };
        }
    
        return result;
      } catch (error) {
        Logger.log("Erro em analisarAceitacao: " + error.message);
        throw error;
      }
    } catch (error) {
      Logger.log("Erro em analisarAceitacao: " + error.message);
      throw error;
    }
  }
  
  /**
   * Gera cardápio semanal completo
   * @param {Object} options - Opções de geração
   * @param {number} options.numAlunos - Número de alunos
   * @param {Array} options.restricoes - Restrições gerais
   * @param {number} options.orcamento - Orçamento disponível
   * @returns {Object} Cardápio semanal
   */
  function gerarCardapioSemanal(options) {
    try {
      options = options || {};
    
      var estoque = _getEstoqueAtual();
      var sazonais = _getAlimentosSazonais();
      var estacao = _getEstacaoAtual();
    
      var prompt = `Gere um cardápio semanal completo (segunda a sexta) para alimentação escolar.

  Parâmetros:
  - Número de alunos: ${options.numAlunos || 500}
  - Orçamento semanal: R$ ${options.orcamento || 'Não especificado'}
  - Restrições gerais: ${options.restricoes ? options.restricoes.join(', ') : 'Nenhuma específica'}

  Estação atual: ${estacao}
  Alimentos da estação:
  - Frutas: ${sazonais.frutas.join(', ')}
  - Hortaliças: ${sazonais.hortalicas.join(', ')}

  Itens disponíveis em estoque:
  ${_formatarItensParaPrompt(estoque)}

  Para cada dia, forneça:
  1. Lanche da manhã
  2. Almoço (prato principal, acompanhamento, salada, sobremesa)
  3. Lanche da tarde

  Inclua para cada refeição:
  - Lista de ingredientes
  - Porcionamento por aluno
  - Valor nutricional aproximado
  - Custo estimado

  Garanta:
  - Variedade ao longo da semana
  - Mínimo 3 frutas diferentes
  - Mínimo 3 hortaliças diferentes
  - Nenhum prato repetido
  - Conformidade com PNAE`;

      var result = _callGemini(prompt, { maxTokens: 4096 });
    
      if (result.success) {
        return {
          success: true,
          data: {
            cardapio: result.response,
            parametros: options,
            estacao: estacao,
            alimentosSazonais: sazonais,
            geradoEm: new Date().toISOString()
          }
        };
      }
    
      return result;
    } catch (error) {
      Logger.log("Erro em gerarCardapioSemanal: " + error.message);
      throw error;
    }
  }
  
  /**
   * Verifica conformidade do cardápio com PNAE
   * @param {Object} cardapio - Cardápio a verificar
   * @returns {Object} Resultado da verificação
   */
  function verificarConformidadePNAE(cardapio) {
    try {
      try {
        if (!cardapio) {
          return { success: false, error: 'Cardápio é obrigatório' };
        }
    
        var prompt = `Verifique a conformidade do seguinte cardápio com as diretrizes do PNAE:

    ${JSON.stringify(cardapio, null, 2)}

    Analise os seguintes critérios obrigatórios:
    1. Oferta mínima de 3 porções de frutas por semana
    2. Oferta mínima de 3 porções de hortaliças por semana
    3. Ausência de refrigerantes e bebidas com baixo teor nutricional
    4. Ausência de alimentos ultraprocessados
    5. Máximo de 10% de açúcar adicionado
    6. Preferência por alimentos in natura ou minimamente processados
    7. Inclusão de alimentos da agricultura familiar (mínimo 30%)

    Para cada critério, indique:
    - Status: CONFORME / NÃO CONFORME / PARCIAL
    - Justificativa
    - Recomendação de ajuste (se necessário)

    Ao final, forneça:
    - Pontuação geral de conformidade (0-100%)
    - Resumo das não conformidades
    - Plano de ação para adequação`;

        var result = _callGemini(prompt);
    
        if (result.success) {
          return {
            success: true,
            data: {
              cardapioAnalisado: cardapio,
              verificacao: result.response,
              geradoEm: new Date().toISOString()
            }
          };
        }
    
        return result;
      } catch (error) {
        Logger.log("Erro em verificarConformidadePNAE: " + error.message);
        throw error;
      }
    } catch (error) {
      Logger.log("Erro em verificarConformidadePNAE: " + error.message);
      throw error;
    }
  }
  
  /**
   * Obtém informações de sazonalidade
   * @returns {Object} Dados de sazonalidade
   */
  function getSazonalidade() {
    var estacao = _getEstacaoAtual();
    return {
      success: true,
      data: {
        estacaoAtual: estacao,
        alimentos: CONFIG.SAZONALIDADE[estacao],
        todasEstacoes: CONFIG.SAZONALIDADE
      }
    };
  }
  
  /**
   * Verifica se API está configurada
   * @returns {Object} Status da configuração
   */
  function verificarConfiguracao() {
    var apiKey = _getApiKey();
    return {
      success: true,
      data: {
        apiConfigurada: !!apiKey,
        modelo: CONFIG.MODEL,
        maxTokens: CONFIG.MAX_TOKENS,
        cacheTTL: CONFIG.CACHE_TTL
      }
    };
  }
  
  // =========================================================================
  // API PÚBLICA DO MÓDULO
  // =========================================================================
  
  return {
    // Sugestões e variações
    sugerirVariacoes: sugerirVariacoes,
    sugerirSubstituicoes: sugerirSubstituicoes,
    
    // Otimização e análise
    otimizarCardapio: otimizarCardapio,
    analisarAceitacao: analisarAceitacao,
    
    // Geração de cardápios
    gerarCardapioSemanal: gerarCardapioSemanal,
    
    // Conformidade
    verificarConformidadePNAE: verificarConformidadePNAE,
    
    // Utilitários
    getSazonalidade: getSazonalidade,
    verificarConfiguracao: verificarConfiguracao
  };
  
})();

// ============================================================================
// FUNÇÕES GLOBAIS - API para Frontend
// ============================================================================

/**
 * Sugere variações de cardápio
 * @param {Object} options - Opções
 * @returns {Object} Sugestões
 */
function api_ai_sugerirVariacoes(options) {
  return AIMenuAssistant.sugerirVariacoes(options);
}

/**
 * Sugere substituições para item
 * @param {Object} options - Opções
 * @returns {Object} Substituições
 */
function api_ai_sugerirSubstituicoes(options) {
  return AIMenuAssistant.sugerirSubstituicoes(options);
}

/**
 * Otimiza cardápio nutricionalmente
 * @param {Object} cardapio - Cardápio
 * @returns {Object} Análise e otimização
 */
function api_ai_otimizarCardapio(cardapio) {
  return AIMenuAssistant.otimizarCardapio(cardapio);
}

/**
 * Analisa aceitação dos cardápios
 * @param {Object} options - Opções
 * @returns {Object} Análise
 */
function api_ai_analisarAceitacao(options) {
  return AIMenuAssistant.analisarAceitacao(options);
}

/**
 * Gera cardápio semanal completo
 * @param {Object} options - Opções
 * @returns {Object} Cardápio semanal
 */
function api_ai_gerarCardapioSemanal(options) {
  return AIMenuAssistant.gerarCardapioSemanal(options);
}

/**
 * Verifica conformidade PNAE
 * @param {Object} cardapio - Cardápio
 * @returns {Object} Verificação
 */
function api_ai_verificarConformidadePNAE(cardapio) {
  return AIMenuAssistant.verificarConformidadePNAE(cardapio);
}

/**
 * Obtém dados de sazonalidade
 * @returns {Object} Sazonalidade
 */
function api_ai_getSazonalidade() {
  return AIMenuAssistant.getSazonalidade();
}

/**
 * Verifica configuração da API
 * @returns {Object} Status
 */
function api_ai_verificarConfiguracao() {
  return AIMenuAssistant.verificarConfiguracao();
}

// ============================================================================
// REGISTRO DO MÓDULO
// ============================================================================

(function() {
  var moduleName = 'AIMenuAssistant';
  var moduleVersion = '1.0.0';
  
  try {
    // Registra no ServiceContainer se disponível
    if (typeof ServiceContainer !== 'undefined') {
      ServiceContainer.register(moduleName, AIMenuAssistant);
    }
    
    // Log de inicialização
    Logger.log('[' + moduleName + ' v' + moduleVersion + '] Módulo carregado com sucesso');
    Logger.log('[' + moduleName + '] Funções disponíveis: sugerirVariacoes, sugerirSubstituicoes, otimizarCardapio, analisarAceitacao, gerarCardapioSemanal, verificarConformidadePNAE');
    
  } catch (e) {
    console.error('[' + moduleName + '] Erro ao registrar módulo: ' + e.message);
  }
})();