/**
 * @fileoverview Estratégia de Retry com Backoff Exponencial
 * @version 1.0.0
 * @description Implementa padrões de resiliência para operações que podem falhar
 * temporariamente (rate limiting, timeouts, erros de rede).
 * 
 * PADRÕES IMPLEMENTADOS:
 * - Exponential Backoff com Jitter
 * - Circuit Breaker
 * - Retry com condições customizáveis
 * - Dead Letter Queue para falhas persistentes
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-08
 */

'use strict';

const RetryStrategy = (function() {

  // ============================================================================
  // CONFIGURAÇÃO
  // ============================================================================

  const CONFIG = {
    DEFAULT_MAX_RETRIES: 3,
    DEFAULT_BASE_DELAY_MS: 1000,
    DEFAULT_MAX_DELAY_MS: 30000,
    JITTER_FACTOR: 0.3,
    CIRCUIT_BREAKER_THRESHOLD: 5,
    CIRCUIT_BREAKER_RESET_MS: 60000
  };

  // Estado do Circuit Breaker por operação
  const circuitBreakers = {};

  // Dead Letter Queue
  let deadLetterQueue = [];

  // ============================================================================
  // EXPONENTIAL BACKOFF
  // ============================================================================

  /**
   * Calcula delay com backoff exponencial e jitter
   * @param {number} attempt - Número da tentativa (0-based)
   * @param {number} baseDelay - Delay base em ms
   * @param {number} maxDelay - Delay máximo em ms
   * @returns {number} Delay calculado em ms
   */
  function calculateBackoff(attempt, baseDelay, maxDelay) {
    baseDelay = baseDelay || CONFIG.DEFAULT_BASE_DELAY_MS;
    maxDelay = maxDelay || CONFIG.DEFAULT_MAX_DELAY_MS;

    // Exponential: baseDelay * 2^attempt
    const exponentialDelay = baseDelay * Math.pow(2, attempt);
    
    // Cap no máximo
    const cappedDelay = Math.min(exponentialDelay, maxDelay);
    
    // Adiciona jitter (±30% por padrão)
    const jitter = cappedDelay * CONFIG.JITTER_FACTOR * (Math.random() * 2 - 1);
    
    return Math.max(0, Math.round(cappedDelay + jitter));
  }

  // ============================================================================
  // CIRCUIT BREAKER
  // ============================================================================

  /**
   * Obtém ou cria estado do circuit breaker
   * @param {string} operationId - ID da operação
   * @returns {Object} Estado do circuit breaker
   */
  function getCircuitBreaker(operationId) {
    if (!circuitBreakers[operationId]) {
      circuitBreakers[operationId] = {
        failures: 0,
        lastFailure: null,
        state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
        successCount: 0
      };
    }
    return circuitBreakers[operationId];
  }

  /**
   * Verifica se circuit breaker permite execução
   * @param {string} operationId - ID da operação
   * @returns {boolean}
   */
  function isCircuitOpen(operationId) {
    const cb = getCircuitBreaker(operationId);
    
    if (cb.state === 'CLOSED') return false;
    
    if (cb.state === 'OPEN') {
      // Verifica se pode tentar reset
      const timeSinceFailure = Date.now() - cb.lastFailure;
      if (timeSinceFailure >= CONFIG.CIRCUIT_BREAKER_RESET_MS) {
        cb.state = 'HALF_OPEN';
        return false;
      }
      return true;
    }
    
    return false; // HALF_OPEN permite uma tentativa
  }

  /**
   * Registra sucesso no circuit breaker
   * @param {string} operationId - ID da operação
   */
  function recordSuccess(operationId) {
    const cb = getCircuitBreaker(operationId);
    
    if (cb.state === 'HALF_OPEN') {
      cb.successCount++;
      if (cb.successCount >= 2) {
        // Reset completo
        cb.state = 'CLOSED';
        cb.failures = 0;
        cb.successCount = 0;
      }
    } else {
      cb.failures = 0;
    }
  }

  /**
   * Registra falha no circuit breaker
   * @param {string} operationId - ID da operação
   */
  function recordFailure(operationId) {
    const cb = getCircuitBreaker(operationId);
    cb.failures++;
    cb.lastFailure = Date.now();
    cb.successCount = 0;
    
    if (cb.failures >= CONFIG.CIRCUIT_BREAKER_THRESHOLD) {
      cb.state = 'OPEN';
      AppLogger.warn('Circuit breaker OPEN para: ' + operationId, {
        failures: cb.failures
      });
    }
  }

  // ============================================================================
  // RETRY PRINCIPAL
  // ============================================================================

  /**
   * Executa função com retry automático
   * @param {Function} fn - Função a executar
   * @param {Object} [options] - Opções de retry
   * @param {number} [options.maxRetries=3] - Máximo de tentativas
   * @param {number} [options.baseDelay=1000] - Delay base em ms
   * @param {number} [options.maxDelay=30000] - Delay máximo em ms
   * @param {Function} [options.shouldRetry] - Função que determina se deve retry
   * @param {Function} [options.onRetry] - Callback em cada retry
   * @param {string} [options.operationId] - ID para circuit breaker
   * @param {boolean} [options.useCircuitBreaker=true] - Usar circuit breaker
   * @returns {Object} Resultado da execução
   */
  function execute(fn, options) {
    options = options || {};
    const maxRetries = options.maxRetries !== undefined ? options.maxRetries : CONFIG.DEFAULT_MAX_RETRIES;
    const baseDelay = options.baseDelay || CONFIG.DEFAULT_BASE_DELAY_MS;
    const maxDelay = options.maxDelay || CONFIG.DEFAULT_MAX_DELAY_MS;
    const shouldRetry = options.shouldRetry || defaultShouldRetry;
    const onRetry = options.onRetry || function() {};
    const operationId = options.operationId || 'default';
    const useCircuitBreaker = options.useCircuitBreaker !== false;

    // Verifica circuit breaker
    if (useCircuitBreaker && isCircuitOpen(operationId)) {
      return {
        success: false,
        error: 'Circuit breaker aberto para: ' + operationId,
        circuitOpen: true,
        attempts: 0
      };
    }

    let lastError = null;
    let attempts = 0;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      attempts++;
      
      try {
        // Verifica tempo restante antes de tentar
        if (typeof QuotaManager !== 'undefined' && QuotaManager.shouldStop()) {
          return {
            success: false,
            error: 'Tempo de execução insuficiente para retry',
            attempts: attempts,
            interrupted: true
          };
        }

        const result = fn();
        
        // Sucesso
        if (useCircuitBreaker) {
          recordSuccess(operationId);
        }
        
        return {
          success: true,
          data: result,
          attempts: attempts
        };

      } catch (error) {
        lastError = error;
        
        // Verifica se deve fazer retry
        if (attempt < maxRetries && shouldRetry(error, attempt)) {
          const delay = calculateBackoff(attempt, baseDelay, maxDelay);
          
          onRetry({
            attempt: attempt + 1,
            maxRetries: maxRetries,
            error: error.message,
            nextDelay: delay
          });

          AppLogger.warn('Retry ' + (attempt + 1) + '/' + maxRetries + ' para ' + operationId, {
            error: error.message,
            delay: delay
          });

          Utilities.sleep(delay);
        } else {
          break;
        }
      }
    }

    // Falha após todas as tentativas
    if (useCircuitBreaker) {
      recordFailure(operationId);
    }

    // Adiciona à Dead Letter Queue
    addToDeadLetterQueue(operationId, lastError, options);

    return {
      success: false,
      error: lastError ? lastError.message : 'Falha após ' + attempts + ' tentativas',
      attempts: attempts,
      lastError: lastError
    };
  }

  /**
   * Função padrão para determinar se deve fazer retry
   * @param {Error} error - Erro ocorrido
   * @param {number} attempt - Número da tentativa
   * @returns {boolean}
   */
  function defaultShouldRetry(error, attempt) {
    if (!error) return false;
    
    const message = (error.message || '').toLowerCase();
    
    // Erros que justificam retry
    const retryableErrors = [
      'timeout',
      'rate limit',
      'quota',
      'temporarily unavailable',
      'service unavailable',
      'internal error',
      'connection',
      'network',
      'econnreset',
      'socket hang up'
    ];

    for (let i = 0; i < retryableErrors.length; i++) {
      if (message.indexOf(retryableErrors[i]) !== -1) {
        return true;
      }
    }

    // Erros que NÃO justificam retry
    const nonRetryableErrors = [
      'permission',
      'not found',
      'invalid',
      'unauthorized',
      'forbidden'
    ];

    for (let j = 0; j < nonRetryableErrors.length; j++) {
      if (message.indexOf(nonRetryableErrors[j]) !== -1) {
        return false;
      }
    }

    // Por padrão, tenta retry para erros desconhecidos
    return true;
  }

  // ============================================================================
  // DEAD LETTER QUEUE
  // ============================================================================

  /**
   * Adiciona falha à Dead Letter Queue
   * @param {string} operationId - ID da operação
   * @param {Error} error - Erro ocorrido
   * @param {Object} context - Contexto da operação
   */
  function addToDeadLetterQueue(operationId, error, context) {
    try {
      deadLetterQueue.push({
        operationId: operationId,
        error: error ? error.message : 'Unknown error',
        stack: error ? error.stack : null,
        context: context,
        timestamp: new Date().toISOString()
      });

      // Limita tamanho da queue
      if (deadLetterQueue.length > 100) {
        deadLetterQueue.shift();
      }
    } catch (error) {
      Logger.log("Erro em addToDeadLetterQueue: " + error.message);
      throw error;
    }
  }

  /**
   * Obtém itens da Dead Letter Queue
   * @returns {Array}
   */
  function getDeadLetterQueue() {
    try {
      return deadLetterQueue.slice();
    } catch (error) {
      Logger.log("Erro em getDeadLetterQueue: " + error.message);
      throw error;
    }
  }

  /**
   * Limpa Dead Letter Queue
   */
  function clearDeadLetterQueue() {
    deadLetterQueue = [];
  }

  // ============================================================================
  // WRAPPERS DE CONVENIÊNCIA
  // ============================================================================

  /**
   * Wrapper para operações de planilha
   * @param {Function} fn - Função a executar
   * @param {string} [operationName] - Nome da operação
   * @returns {Object}
   */
  function withSheetRetry(fn, operationName) {
    return execute(fn, {
      operationId: 'sheet_' + (operationName || 'operation'),
      maxRetries: 3,
      baseDelay: 500,
      shouldRetry: function(error) {
        const msg = (error.message || '').toLowerCase();
        return msg.indexOf('service') !== -1 || 
               msg.indexOf('timeout') !== -1 ||
               msg.indexOf('quota') !== -1;
      }
    });
  }

  /**
   * Wrapper para chamadas de API externa
   * @param {Function} fn - Função a executar
   * @param {string} [apiName] - Nome da API
   * @returns {Object}
   */
  function withApiRetry(fn, apiName) {
    return execute(fn, {
      operationId: 'api_' + (apiName || 'external'),
      maxRetries: 5,
      baseDelay: 1000,
      maxDelay: 60000
    });
  }

  /**
   * Wrapper para envio de email
   * @param {Function} fn - Função a executar
   * @returns {Object}
   */
  function withEmailRetry(fn) {
    return execute(fn, {
      operationId: 'email',
      maxRetries: 2,
      baseDelay: 2000,
      shouldRetry: function(error) {
        const msg = (error.message || '').toLowerCase();
        // Não faz retry se for erro de cota
        if (msg.indexOf('quota') !== -1) return false;
        return msg.indexOf('service') !== -1;
      }
    });
  }

  // ============================================================================
  // API PÚBLICA
  // ============================================================================

  return {
    // Core
    execute: execute,
    calculateBackoff: calculateBackoff,
    
    // Circuit Breaker
    isCircuitOpen: isCircuitOpen,
    getCircuitBreakerState: function(operationId) {
      return getCircuitBreaker(operationId);
    },
    resetCircuitBreaker: function(operationId) {
      if (circuitBreakers[operationId]) {
        circuitBreakers[operationId] = {
          failures: 0,
          lastFailure: null,
          state: 'CLOSED',
          successCount: 0
        };
      }
    },
    
    // Dead Letter Queue
    getDeadLetterQueue: getDeadLetterQueue,
    clearDeadLetterQueue: clearDeadLetterQueue,
    
    // Wrappers
    withSheetRetry: withSheetRetry,
    withApiRetry: withApiRetry,
    withEmailRetry: withEmailRetry,
    
    // Configuração
    CONFIG: CONFIG
  };
})();
