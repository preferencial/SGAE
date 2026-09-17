'use strict';

/**
 * @fileoverview Serviço de Integração com Gemini API
 * @version 1.0.0
 * @description Fornece funcionalidades de IA para o sistema de Alimentação Escolar
 */

// ============================================================================
// CONFIGURAÇÃO DO GEMINI
// ============================================================================

var GEMINI_CONFIG = {
  MODEL: 'gemini-2.0-flash',
  BASE_URL: 'https://generativelanguage.googleapis.com/v1beta/models/',
  MAX_TOKENS: 2048,
  DEFAULT_TEMPERATURE: 0.7,
  TIMEOUT_MS: 30000
};

// FROTA-07: modelo lido da property do script, nunca hardcoded; cai no padrão local.
function geminiModel_() {
  try {
    return PropertiesService.getScriptProperties().getProperty('GEMINI_MODEL') || 'gemini-2.0-flash';
  } catch (e) {
    console.error('Core_Gemini_Service/FROTA-07 property indisponível:', e.message);
    return 'gemini-2.0-flash';
  }
}

/**
 * Contexto do sistema para o assistente de Alimentação Escolar
 */
var AE_SYSTEM_CONTEXT = [
  'Você é o Assistente de Alimentação Escolar (AE) do sistema UNIAE.',
  'Você ajuda gestores, fiscais e operadores com:',
  '- Gestão de Notas Fiscais de gêneros alimentícios',
  '- Controle de entregas nas Unidades Escolares',
  '- Registro de recusas e glosas',
  '- Conferência e atesto de documentos fiscais',
  '- Dúvidas sobre o PNAE (Programa Nacional de Alimentação Escolar)',
  '- Legislação: Portaria 244/2006, Lei 8.666/93, Lei 11.947/09',
  '',
  'Seja conciso, profissional e útil. Responda em português brasileiro.',
  'Se não souber algo específico do sistema, oriente o usuário a consultar o suporte.'
].join('\n');

// ============================================================================
// FUNÇÕES PRINCIPAIS
// ============================================================================

/**
 * Obtém a chave API do Gemini das propriedades do script
 * @returns {string|null}
 */
function getGeminiApiKey() {
  try {
    var props = PropertiesService.getScriptProperties();
    return props.getProperty('GEMINI_API_KEY');
  } catch (e) {
    console.error('Erro ao obter GEMINI_API_KEY:', e.message);
    return null;
  }
}

/**
 * Verifica se o Gemini está configurado
 * @returns {boolean}
 */
function isGeminiConfigured() {
  var apiKey = getGeminiApiKey();
  return apiKey !== null && apiKey.length > 10;
}

/**
 * Envia mensagem para o Gemini e retorna resposta
 * @param {string} userMessage - Mensagem do usuário
 * @param {string} [conversationHistory] - Histórico da conversa (opcional)
 * @returns {Object} Resposta formatada
 */
function sendMessageToGemini(userMessage, conversationHistory) {
  try {
    try {
      try {
        // Validar entrada
        if (!userMessage || typeof userMessage !== 'string') {
          return {
            success: false,
            error: 'Mensagem inválida',
            message: ''
          };
        }
    
        // Verificar configuração
        var apiKey = getGeminiApiKey();
        if (!apiKey) {
          return {
            success: false,
            error: 'API Key do Gemini não configurada',
            message: 'Por favor, configure a chave API nas propriedades do script.'
          };
        }

        // FROTA-05: bloqueio de rate limit / quota antes de atingir o provedor.
        try {
          if (typeof AiRateLimitService !== 'undefined') {
            var _rl = AiRateLimitService.check('sgaeAssistant', userMessage);
            if (_rl && _rl.dedupHit && _rl.cached) return _rl.cached;
          }
        } catch (rlErr) {
          if (rlErr && rlErr.isAiLimit) {
            return {
              success: false,
              error: rlErr.message,
              rateLimited: true,
              message: 'Muitas solicitações em sequência. Aguarde um instante e tente novamente.'
            };
          }
          throw rlErr;
        }
        var _t06 = Date.now();

        // Montar prompt com contexto
        var fullPrompt = AE_SYSTEM_CONTEXT + '\n\n';
    
        if (conversationHistory) {
          fullPrompt += 'Histórico da conversa:\n' + conversationHistory + '\n\n';
        }
    
        fullPrompt += 'Usuário: ' + userMessage + '\n\nAssistente:';
    
        // Configurar requisição
        var url = GEMINI_CONFIG.BASE_URL + geminiModel_() + ':generateContent?key=' + apiKey;
    
        var payload = {
          contents: [{
            parts: [{
              text: fullPrompt
            }]
          }],
          generationConfig: {
            temperature: getGeminiTemperature(),
            maxOutputTokens: GEMINI_CONFIG.MAX_TOKENS,
            topP: 0.95,
            topK: 40
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
          ]
        };
    
        var options = {
          method: 'post',
          contentType: 'application/json',
          payload: JSON.stringify(payload),
          muteHttpExceptions: true
        };
    
        // Fazer requisição (com resiliência a falhas transitórias)
        var response = fetchGeminiComRetentativa_(url, options);
        var responseCode = response.getResponseCode();
        var responseText = response.getContentText();
    
        if (responseCode !== 200) {
          console.error('Erro Gemini API:', responseCode, responseText);
          _recordGeminiAudit_(_t06, 'fail', 'HTTP_' + responseCode);
          return {
            success: false,
            error: 'Erro na API: ' + responseCode,
            message: 'Desculpe, ocorreu um erro ao processar sua mensagem.'
          };
        }
    
        // Processar resposta
        var jsonResponse = JSON.parse(responseText);
        var generatedText = '';
    
        if (jsonResponse.candidates && 
            jsonResponse.candidates[0] && 
            jsonResponse.candidates[0].content &&
            jsonResponse.candidates[0].content.parts &&
            jsonResponse.candidates[0].content.parts[0]) {
          generatedText = jsonResponse.candidates[0].content.parts[0].text;
        }
    
        // Registrar uso
        logGeminiUsage(userMessage.length, generatedText.length, true);
        // FROTA-06: auditoria mínima da geração (sem prompt nem resposta).
        _recordGeminiAudit_(_t06, 'ok', '');

        return {
          success: true,
          message: generatedText.trim(),
          tokensUsed: jsonResponse.usageMetadata || {}
        };

      } catch (e) {
        console.error('Erro em sendMessageToGemini:', e.message);
        logGeminiUsage(0, 0, false);
        _recordGeminiAudit_(typeof _t06 !== 'undefined' ? _t06 : Date.now(), 'fail', String(e.message).slice(0, 80));
        return {
          success: false,
          error: e.message,
          message: 'Desculpe, ocorreu um erro inesperado. Tente novamente.'
        };
      }
    } catch (error) {
      Logger.log("Erro em sendMessageToGemini: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em sendMessageToGemini: " + error.message);
    throw error;
  }
}

/**
 * FROTA-06: grava o registro técnico mínimo da geração no log de auditoria da
 * frota, sem reproduzir conteúdo sensível. Silencioso se o serviço não existir.
 * @param {number} startMs Timestamp do início da chamada.
 * @param {string} status  'ok' | 'fail'
 * @param {string} errorCode Código resumido do erro (vazio em sucesso).
 */
function _recordGeminiAudit_(startMs, status, errorCode) {
  try {
    if (typeof AiAuditLogService === 'undefined') return;
    AiAuditLogService.record({
      useCase: 'sgaeAssistant',
      model: geminiModel_(),
      durationMs: Date.now() - startMs,
      status: status,
      fallback: false,
      errorCode: errorCode || ''
    });
  } catch (_) { /* auditoria nunca quebra o fluxo */ }
}

/**
 * Wrapper de resiliência sobre UrlFetchApp.fetch: repete a chamada em falhas
 * transitórias do Gemini (HTTP 429/500/503 e exceções de rede) com backoff
 * exponencial. As opções devem manter muteHttpExceptions:true; quem chama
 * inspeciona o código HTTP, então a resposta final é devolvida como está.
 * @param {string} url
 * @param {Object} options
 * @returns {GoogleAppsScript.URL_Fetch.HTTPResponse}
 */
function fetchGeminiComRetentativa_(url, options) {
  try {
    var MAX_TENTATIVAS = 3;
    var esperaMs = 700;
    for (var tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {
      try {
        var resp = UrlFetchApp.fetch(url, options);
        var codigo = resp.getResponseCode();
        var transitorio = (codigo === 429 || codigo === 500 || codigo === 503);
        if (transitorio && tentativa < MAX_TENTATIVAS) {
          Utilities.sleep(esperaMs);
          esperaMs *= 2;
          continue;
        }
        return resp;
      } catch (e) {
        if (tentativa >= MAX_TENTATIVAS) throw e;
        Utilities.sleep(esperaMs);
        esperaMs *= 2;
      }
    }
  } catch (error) {
    Logger.log("Erro em fetchGeminiComRetentativa_: " + error.message);
    throw error; // Re-lança para tratamento superior
  }
}

/**
 * Obtém temperatura configurada para o Gemini
 * @returns {number}
 */
function getGeminiTemperature() {
  try {
    try {
      var props = PropertiesService.getScriptProperties();
      var temp = props.getProperty('GEMINI_TEMPERATURE');
      return temp ? parseFloat(temp) : GEMINI_CONFIG.DEFAULT_TEMPERATURE;
    } catch (e) {
      return GEMINI_CONFIG.DEFAULT_TEMPERATURE;
    }
  } catch (error) {
    Logger.log("Erro em getGeminiTemperature: " + error.message);
    throw error;
  }
}

// ============================================================================
// FUNÇÕES ESPECIALIZADAS PARA ALIMENTAÇÃO ESCOLAR
// ============================================================================

/**
 * Analisa uma Nota Fiscal com IA
 * @param {Object} nfData - Dados da NF
 * @returns {Object} Análise da NF
 */
function analisarNotaFiscalComIA(nfData) {
  try {
    if (!nfData) {
      console.error('analisarNotaFiscalComIA: nfData is undefined or null');
      return { success: false, error: 'Dados da NF não fornecidos' };
    }

    var prompt = [
      'Analise esta Nota Fiscal de gêneros alimentícios:',
      '',
      'Número: ' + (nfData.numero || 'N/A'),
      'Fornecedor: ' + (nfData.fornecedor || 'N/A'),
      'Valor Total: R$ ' + (nfData.valor || 'N/A'),
      'Data Emissão: ' + (nfData.dataEmissao || 'N/A'),
      'Produtos: ' + (nfData.produtos || 'N/A'),
      '',
      'Verifique:',
      '1. Se os valores parecem adequados para os produtos',
      '2. Possíveis inconsistências',
      '3. Pontos de atenção para a conferência',
      '',
      'Responda de forma objetiva e estruturada.'
    ].join('\n');
  
    return sendMessageToGemini(prompt);
  } catch (error) {
    Logger.log("Erro em analisarNotaFiscalComIA: " + error.message);
    throw error;
  }
}

/**
 * Sugere ações para problemas de entrega
 * @param {Object} problemaData - Dados do problema
 * @returns {Object} Sugestões
 */
function sugerirAcaoProblema(problemaData) {
  try {
    if (!problemaData) {
      console.error('sugerirAcaoProblema: problemaData is undefined or null');
      return { success: false, error: 'Dados do problema não fornecidos' };
    }

    var prompt = [
      'Um problema foi identificado em uma entrega de alimentos:',
      '',
      'Tipo: ' + (problemaData.tipo || 'Não especificado'),
      'Produto: ' + (problemaData.produto || 'N/A'),
      'Fornecedor: ' + (problemaData.fornecedor || 'N/A'),
      'Descrição: ' + (problemaData.descricao || 'N/A'),
      '',
      'Com base na legislação (Portaria 244/2006, Lei 8.666/93):',
      '1. Qual a ação recomendada?',
      '2. Deve ser registrada recusa ou glosa?',
      '3. Quais documentos devem ser gerados?',
      '',
      'Seja objetivo e cite a base legal quando aplicável.'
    ].join('\n');
  
    return sendMessageToGemini(prompt);
  } catch (error) {
    Logger.log("Erro em sugerirAcaoProblema: " + error.message);
    throw error;
  }
}

/**
 * Gera resumo executivo do período
 * @param {Object} dadosPeriodo - Dados do período
 * @returns {Object} Resumo
 */
function gerarResumoExecutivo(dadosPeriodo) {
  try {
    var prompt = [
      'Gere um resumo executivo para a gestão de alimentação escolar:',
      '',
      'Período: ' + (dadosPeriodo.periodo || 'Atual'),
      'Total de NFs: ' + (dadosPeriodo.totalNFs || 0),
      'Valor Total: R$ ' + (dadosPeriodo.valorTotal || 0),
      'Entregas Realizadas: ' + (dadosPeriodo.entregas || 0),
      'Recusas: ' + (dadosPeriodo.recusas || 0),
      'Glosas: ' + (dadosPeriodo.glosas || 0),
      '',
      'Inclua:',
      '1. Principais indicadores',
      '2. Pontos de atenção',
      '3. Recomendações',
      '',
      'Formato: texto conciso para relatório gerencial.'
    ].join('\n');
  
    return sendMessageToGemini(prompt);
  } catch (error) {
    Logger.log("Erro em gerarResumoExecutivo: " + error.message);
    throw error;
  }
}

// ============================================================================
// BUSCA NA BASE DE DADOS
// ============================================================================

/**
 * Busca inteligente na base de dados
 * @param {string} query - Termo de busca
 * @returns {Object} Resultados da busca
 */
function buscaInteligente(query) {
  try {
    try {
      try {
        if (!query || query.length < 2) {
          return { success: false, results: [], message: 'Termo de busca muito curto' };
        }
    
        var results = [];
        var queryLower = query.toLowerCase();
        var ss = getSS();
    
        // Buscar em Notas Fiscais
        var nfSheet = ss.getSheetByName('Notas_Fiscais');
        if (nfSheet && nfSheet.getLastRow() > 1) {
          var nfData = nfSheet.getDataRange().getValues();
          var nfHeaders = nfData[0];
      
          for (var i = 1; i < Math.min(nfData.length, 500); i++) {
            var row = nfData[i];
            var rowText = row.join(' ').toLowerCase();
        
            if (rowText.indexOf(queryLower) >= 0) {
              results.push({
                tipo: 'Nota Fiscal',
                id: row[0],
                descricao: 'NF ' + (row[1] || row[2] || 'N/A') + ' - ' + (row[6] || row[7] || 'Fornecedor'),
                dados: row
              });
            }
        
            if (results.length >= 20) break;
          }
        }
    
        // Buscar em Fornecedores
        var fornSheet = ss.getSheetByName('Fornecedores');
        if (fornSheet && fornSheet.getLastRow() > 1 && results.length < 20) {
          var fornData = fornSheet.getDataRange().getValues();
      
          for (var j = 1; j < Math.min(fornData.length, 200); j++) {
            var fornRow = fornData[j];
            var fornText = fornRow.join(' ').toLowerCase();
        
            if (fornText.indexOf(queryLower) >= 0) {
              results.push({
                tipo: 'Fornecedor',
                id: fornRow[0],
                descricao: fornRow[2] || fornRow[1] || 'Fornecedor',
                dados: fornRow
              });
            }
        
            if (results.length >= 20) break;
          }
        }
    
        return {
          success: true,
          results: results,
          total: results.length,
          message: results.length > 0 ? 'Encontrados ' + results.length + ' resultados' : 'Nenhum resultado encontrado'
        };
    
      } catch (e) {
        console.error('Erro em buscaInteligente:', e.message);
        return { success: false, results: [], message: 'Erro na busca: ' + e.message };
      }
    } catch (error) {
      Logger.log("Erro em buscaInteligente: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em buscaInteligente: " + error.message);
    throw error;
  }
}

// ============================================================================
// ESTATÍSTICAS E LOGGING
// ============================================================================

/**
 * Registra uso do Gemini
 */
function logGeminiUsage(inputLength, outputLength, success) {
  try {
    try {
      try {
        var props = PropertiesService.getScriptProperties();
        var stats = props.getProperty('GEMINI_STATS');
        var data = stats ? JSON.parse(stats) : {
          total_calls: 0,
          successful_calls: 0,
          failed_calls: 0,
          total_input_chars: 0,
          total_output_chars: 0,
          last_call: null
        };
    
        data.total_calls++;
        if (success) {
          data.successful_calls++;
        } else {
          data.failed_calls++;
        }
        data.total_input_chars += inputLength || 0;
        data.total_output_chars += outputLength || 0;
        data.last_call = new Date().toISOString();
    
        props.setProperty('GEMINI_STATS', JSON.stringify(data));
      } catch (e) {
        console.warn('Erro ao registrar uso do Gemini:', e.message);
      }
    } catch (error) {
      Logger.log("Erro em logGeminiUsage: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em logGeminiUsage: " + error.message);
    throw error;
  }
}

/**
 * Obtém estatísticas de uso do Gemini
 * @returns {Object}
 */
function getGeminiUsageStats() {
  try {
    try {
      try {
        var props = PropertiesService.getScriptProperties();
        var stats = props.getProperty('GEMINI_STATS');
        var data = stats ? JSON.parse(stats) : {
          total_calls: 0,
          successful_calls: 0,
          failed_calls: 0,
          total_input_chars: 0,
          total_output_chars: 0,
          last_call: null
        };
    
        data.configured = isGeminiConfigured();
        data.success_rate = data.total_calls > 0 
          ? Math.round((data.successful_calls / data.total_calls) * 100) 
          : 0;
    
        return data;
      } catch (e) {
        return { configured: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em getGeminiUsageStats: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em getGeminiUsageStats: " + error.message);
    throw error;
  }
}

/**
 * Configura a chave API do Gemini
 * @param {string} apiKey - Chave API
 */
function setupGeminiApiKey(apiKey) {
  try {
    try {
      if (apiKey && typeof apiKey === 'string' && apiKey.length > 10) {
        var props = PropertiesService.getScriptProperties();
        props.setProperty('GEMINI_API_KEY', apiKey);
        return { success: true, message: 'API Key configurada com sucesso' };
      }
    
      // Se não passou apiKey, tentar via UI
      var ui = getSafeUi();
      if (ui) {
        var response = ui.prompt(
          'Configurar Gemini API Key',
          'Cole sua API Key do Google AI Studio:',
          ui.ButtonSet.OK_CANCEL
        );
      
        if (response.getSelectedButton() === ui.Button.OK) {
          var key = response.getResponseText().trim();
          if (key.length > 10) {
            PropertiesService.getScriptProperties().setProperty('GEMINI_API_KEY', key);
            ui.alert('Sucesso', 'API Key configurada!', ui.ButtonSet.OK);
            return { success: true };
          }
        }
      }
    
      return { success: false, message: 'Chave inválida ou operação cancelada' };
    } catch (e) {
      return { success: false, message: e.message };
    }
  } catch (error) {
    Logger.log("Erro em setupGeminiApiKey: " + error.message);
    throw error;
  }
}

// ============================================================================
// API PARA FRONTEND
// ============================================================================

/**
 * Endpoint para o chatbot do frontend
 * @param {string} message - Mensagem do usuário
 * @param {string} history - Histórico (JSON string)
 * @returns {Object}
 */
function chatbotMessage(message, history) {
  return sendMessageToGemini(message, history);
}

/**
 * Verifica status do serviço Gemini
 * @returns {Object}
 */
function getGeminiStatus() {
  return {
    configured: isGeminiConfigured(),
    stats: getGeminiUsageStats(),
    model: geminiModel_()
  };
}
