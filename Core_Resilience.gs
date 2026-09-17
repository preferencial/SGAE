/**
 * @fileoverview Sistema de Resiliência e Fallbacks
 * @version 1.0.0
 * @description Adiciona robustez ao sistema com circuit breakers, fallbacks e retry
 */

'use strict';

var Resilience = (function() {

  // ============================================================================
  // CIRCUIT BREAKER
  // ============================================================================

  var circuitBreakers = {};

  var CircuitBreaker = {
    STATES: {
      CLOSED: 'closed',     // Normal - permite chamadas
      OPEN: 'open',         // Falha - bloqueia chamadas
      HALF_OPEN: 'half_open' // Teste - permite uma chamada
    },

    DEFAULT_CONFIG: {
      failureThreshold: 5,    // Falhas para abrir
      successThreshold: 2,    // Sucessos para fechar
      timeout: 30000          // Tempo em OPEN antes de HALF_OPEN
    },

    /**
     * Obtém ou cria circuit breaker
     */
    get: function(name, config) {
      if (!circuitBreakers[name]) {
        circuitBreakers[name] = {
          state: this.STATES.CLOSED,
          failures: 0,
          successes: 0,
          lastFailure: null,
          config: config || this.DEFAULT_CONFIG
        };
      }
      return circuitBreakers[name];
    },

    /**
     * Verifica se pode executar
     */
    canExecute: function(name) {
      try {
        var cb = this.get(name);

        if (cb.state === this.STATES.CLOSED) {
          return true;
        }

        if (cb.state === this.STATES.OPEN) {
          // Verifica timeout para transição para HALF_OPEN
          if (Date.now() - cb.lastFailure > cb.config.timeout) {
            cb.state = this.STATES.HALF_OPEN;
            cb.successes = 0;
            return true;
          }
          return false;
        }

        // HALF_OPEN - permite uma chamada
        return true;
      } catch (error) {
        Logger.log("Erro em canExecute: " + error.message);
        throw error;
      }
    },

    /**
     * Registra sucesso
     */
    recordSuccess: function(name) {
      try {
        var cb = this.get(name);

        if (cb.state === this.STATES.HALF_OPEN) {
          cb.successes++;
          if (cb.successes >= cb.config.successThreshold) {
            cb.state = this.STATES.CLOSED;
            cb.failures = 0;
          }
        } else {
          cb.failures = 0;
        }
      } catch (error) {
        Logger.log("Erro em recordSuccess: " + error.message);
        throw error;
      }
    },

    /**
     * Registra falha
     */
    recordFailure: function(name) {
      try {
        var cb = this.get(name);
        cb.failures++;
        cb.lastFailure = Date.now();

        if (cb.state === this.STATES.HALF_OPEN) {
          cb.state = this.STATES.OPEN;
        } else if (cb.failures >= cb.config.failureThreshold) {
          cb.state = this.STATES.OPEN;
        }
      } catch (error) {
        Logger.log("Erro em recordFailure: " + error.message);
        throw error;
      }
    },

    /**
     * Obtém status
     */
    getStatus: function(name) {
      try {
        var cb = this.get(name);
        return {
          name: name,
          state: cb.state,
          failures: cb.failures,
          lastFailure: cb.lastFailure
        };
      } catch (error) {
        Logger.log("Erro em getStatus: " + error.message);
        throw error;
      }
    },

    /**
     * Reset manual
     */
    reset: function(name) {
      if (circuitBreakers[name]) {
        circuitBreakers[name].state = this.STATES.CLOSED;
        circuitBreakers[name].failures = 0;
        circuitBreakers[name].successes = 0;
      }
    }
  };

  // ============================================================================
  // RETRY COM BACKOFF
  // ============================================================================

  var Retry = {
    /**
     * Executa com retry e backoff exponencial
     */
    execute: function(fn, options) {
      options = options || {};
      var maxRetries = options.maxRetries || 3;
      var initialDelay = options.initialDelay || 1000;
      var maxDelay = options.maxDelay || 30000;
      var factor = options.factor || 2;
      var retryOn = options.retryOn || function() { return true; };

      var lastError;

      for (var attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          return fn();
        } catch (e) {
          lastError = e;

          if (attempt === maxRetries || !retryOn(e)) {
            throw e;
          }

          var delay = Math.min(initialDelay * Math.pow(factor, attempt), maxDelay);
          // Adiciona jitter para evitar thundering herd
          delay = delay * (0.5 + Math.random() * 0.5);

          Utilities.sleep(delay);
        }
      }

      throw lastError;
    }
  };

  // ============================================================================
  // FALLBACK
  // ============================================================================

  var Fallback = {
    /**
     * Executa com fallback
     */
    execute: function(primary, fallback, options) {
      options = options || {};
      var circuitName = options.circuitBreaker;

      // Verifica circuit breaker
      if (circuitName && !CircuitBreaker.canExecute(circuitName)) {
        if (typeof UnifiedLogger !== 'undefined') {
          UnifiedLogger.warn('Circuit breaker OPEN: ' + circuitName);
        }
        return fallback();
      }

      try {
        var result = primary();

        if (circuitName) {
          CircuitBreaker.recordSuccess(circuitName);
        }

        return result;
      } catch (e) {
        if (circuitName) {
          CircuitBreaker.recordFailure(circuitName);
        }

        if (typeof UnifiedLogger !== 'undefined') {
          UnifiedLogger.warn('Primary failed, using fallback', { error: e.message });
        }

        return fallback();
      }
    },

    /**
     * Executa com múltiplos fallbacks
     */
    executeChain: function(functions, options) {
      options = options || {};
      var lastError;

      for (var i = 0; i < functions.length; i++) {
        try {
          return functions[i]();
        } catch (e) {
          lastError = e;
          if (typeof UnifiedLogger !== 'undefined') {
            UnifiedLogger.debug('Fallback ' + i + ' failed', { error: e.message });
          }
        }
      }

      throw lastError || new Error('All fallbacks failed');
    }
  };

  // ============================================================================
  // TIMEOUT
  // ============================================================================

  var Timeout = {
    /**
     * Executa com timeout (simulado - GAS não tem timeout real)
     * Usa checkpoints para verificar tempo decorrido
     */
    execute: function(fn, timeoutMs, options) {
      options = options || {};
      var startTime = Date.now();
      var checkInterval = options.checkInterval || 1000;

      // Para funções síncronas, apenas executa
      // O timeout real é controlado pelo próprio GAS (6 min)
      try {
        return fn();
      } catch (e) {
        var elapsed = Date.now() - startTime;
        if (elapsed > timeoutMs) {
          throw new Error('Operation timed out after ' + elapsed + 'ms');
        }
        throw e;
      }
    }
  };

  // ============================================================================
  // BULKHEAD (Isolamento)
  // ============================================================================

  var bulkheads = {};

  var Bulkhead = {
    /**
     * Obtém ou cria bulkhead
     */
    get: function(name, maxConcurrent) {
      if (!bulkheads[name]) {
        bulkheads[name] = {
          maxConcurrent: maxConcurrent || 5,
          current: 0,
          queue: []
        };
      }
      return bulkheads[name];
    },

    /**
     * Tenta adquirir slot
     */
    acquire: function(name) {
      try {
        var bh = this.get(name);
        if (bh.current < bh.maxConcurrent) {
          bh.current++;
          return true;
        }
        return false;
      } catch (error) {
        Logger.log("Erro em acquire: " + error.message);
        throw error;
      }
    },

    /**
     * Libera slot
     */
    release: function(name) {
      try {
        var bh = this.get(name);
        if (bh.current > 0) {
          bh.current--;
        }
      } catch (error) {
        Logger.log("Erro em release: " + error.message);
        throw error;
      }
    },

    /**
     * Executa com bulkhead
     */
    execute: function(name, fn, options) {
      options = options || {};
      var waitMs = options.waitMs || 5000;
      var startTime = Date.now();

      while (!this.acquire(name)) {
        if (Date.now() - startTime > waitMs) {
          throw new Error('Bulkhead ' + name + ' full - timeout waiting for slot');
        }
        Utilities.sleep(100);
      }

      try {
        return fn();
      } finally {
        this.release(name);
      }
    }
  };

  // ============================================================================
  // SAFE WRAPPERS
  // ============================================================================

  /**
   * Wrapper seguro para operações de planilha
   */
  function safeSheetOperation(sheetName, operation, fallbackValue) {
    try {
      return Fallback.execute(
        function() {
          return Retry.execute(function() {
            var ss = getSS();
            var sheet = ss.getSheetByName(sheetName);
            if (!sheet) {
              throw new Error('Sheet not found: ' + sheetName);
            }
            return operation(sheet);
          }, { maxRetries: 2, initialDelay: 500 });
        },
        function() {
          if (typeof UnifiedLogger !== 'undefined') {
            UnifiedLogger.warn('Sheet operation failed, returning fallback', { sheet: sheetName });
          }
          return fallbackValue;
        },
        { circuitBreaker: 'sheet_' + sheetName }
      );
    } catch (error) {
      Logger.log("Erro em safeSheetOperation: " + error.message);
      throw error;
    }
  }

  /**
   * Wrapper seguro para chamadas de API externa
   */
  function safeApiCall(name, apiCall, fallbackValue) {
    return Fallback.execute(
      function() {
        return Retry.execute(apiCall, {
          maxRetries: 3,
          initialDelay: 1000,
          retryOn: function(e) {
            // Retry apenas em erros de rede/timeout
            var msg = e.message || '';
            return msg.indexOf('timeout') !== -1 ||
                   msg.indexOf('network') !== -1 ||
                   msg.indexOf('503') !== -1 ||
                   msg.indexOf('429') !== -1;
          }
        });
      },
      function() {
        return fallbackValue;
      },
      { circuitBreaker: 'api_' + name }
    );
  }

  /**
   * Wrapper seguro para cache
   */
  function safeCacheGet(key, fetchFn, options) {
    try {
      options = options || {};
      var ttl = options.ttl || 300;

      // Tenta cache primeiro
      try {
        var cache = CacheService.getScriptCache();
        var cached = cache.get(key);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (e) {
        // Cache falhou, continua para fetch
      }

      // Busca dados
      var data = fetchFn();

      // Tenta salvar no cache
      try {
        var cache = CacheService.getScriptCache();
        cache.put(key, JSON.stringify(data), ttl);
      } catch (e) {
        // Ignora erro de cache
      }

      return data;
    } catch (error) {
      Logger.log("Erro em safeCacheGet: " + error.message);
      throw error;
    }
  }

  // ============================================================================
  // HEALTH CHECK
  // ============================================================================

  function healthCheck() {
    var health = {
      status: 'healthy',
      timestamp: new Date(),
      checks: {},
      circuitBreakers: {}
    };

    // Verifica spreadsheet
    try {
      var ss = getSS();
      health.checks.spreadsheet = ss ? 'ok' : 'error';
    } catch (e) {
      health.checks.spreadsheet = 'error';
      health.status = 'degraded';
    }

    // Verifica cache
    try {
      var cache = CacheService.getScriptCache();
      cache.put('health_check', 'ok', 10);
      health.checks.cache = cache.get('health_check') === 'ok' ? 'ok' : 'error';
    } catch (e) {
      health.checks.cache = 'error';
    }

    // Status dos circuit breakers
    for (var name in circuitBreakers) {
      health.circuitBreakers[name] = CircuitBreaker.getStatus(name);
      if (circuitBreakers[name].state === CircuitBreaker.STATES.OPEN) {
        health.status = 'degraded';
      }
    }

    return health;
  }

  // ============================================================================
  // API PÚBLICA
  // ============================================================================

  return {
    // Padrões de resiliência
    CircuitBreaker: CircuitBreaker,
    Retry: Retry,
    Fallback: Fallback,
    Timeout: Timeout,
    Bulkhead: Bulkhead,

    // Wrappers seguros
    safeSheetOperation: safeSheetOperation,
    safeApiCall: safeApiCall,
    safeCacheGet: safeCacheGet,

    // Health check
    healthCheck: healthCheck,

    /**
     * Executa operação com todas as proteções
     */
    execute: function(name, fn, options) {
      // Validação de parâmetros
      if (typeof fn !== 'function') {
        throw new Error('Resilience.execute: fn deve ser uma função');
      }
      
      options = options || {};

      var wrapped = fn;

      // Adiciona retry
      if (options.retry !== false) {
        var retryOpts = options.retry || {};
        wrapped = function() {
          return Retry.execute(fn, retryOpts);
        };
      }

      // Adiciona fallback
      if (options.fallback) {
        var fallbackFn = options.fallback;
        var prevWrapped = wrapped;
        wrapped = function() {
          return Fallback.execute(prevWrapped, fallbackFn, {
            circuitBreaker: options.circuitBreaker ? name : null
          });
        };
      }

      // Adiciona bulkhead
      if (options.bulkhead) {
        var bhName = options.bulkhead.name || name;
        var prevWrapped2 = wrapped;
        wrapped = function() {
          return Bulkhead.execute(bhName, prevWrapped2, options.bulkhead);
        };
      }

      return wrapped();
    },

    VERSION: '1.0.0'
  };
})();

// ============================================================================
// FUNÇÕES GLOBAIS DE CONVENIÊNCIA
// ============================================================================

/**
 * Executa operação de forma resiliente
 * @param {string} name - Nome da operação
 * @param {Function} fn - Função a executar
 * @param {Object} options - Opções de resiliência
 * @returns {*} Resultado da função
 */
function resilientExecute(name, fn, options) {
  // Validação de parâmetros
  if (typeof fn !== 'function') {
    Logger.log('resilientExecute: fn não é uma função válida para ' + name);
    return { success: false, error: 'Função não fornecida' };
  }
  return Resilience.execute(name, fn, options);
}

/**
 * Health check do sistema
 */
function systemHealthCheck() {
  return Resilience.healthCheck();
}
