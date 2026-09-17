/**
 * Core_Enterprise_Foundation.gs
 * Fundação Enterprise para o Sistema PAE/DF
 *
 * Este módulo estabelece padrões enterprise-grade:
 * - Arquitetura em camadas
 * - Injeção de dependências
 * - Padrões de design (Repository, Service, Factory)
 * - Observabilidade e métricas
 * - Resiliência e circuit breaker
 *
 * @version 1.0.0
 * @created 2025-12-04
 * @enterprise true
 */

'use strict';

// ============================================================================
// NAMESPACE GLOBAL DO SISTEMA
// ============================================================================

var PAE = PAE || {};

/**
 * Configuração global do sistema
 */
PAE.Config = {
  VERSION: '2.0.0',
  ENVIRONMENT: 'production',
  DEBUG: false,

  // Timeouts
  TIMEOUTS: {
    CACHE: 21600,        // 6 horas
    SESSION: 28800,      // 8 horas
    LOCK: 30000,         // 30 segundos
    API_CALL: 30000      // 30 segundos
  },

  // Limites
  LIMITS: {
    MAX_BATCH_SIZE: 100,
    MAX_RETRIES: 3,
    MAX_CONCURRENT: 5,
    RATE_LIMIT_PER_MINUTE: 60
  },

  // Feature flags
  FEATURES: {
    ENABLE_CACHE: true,
    ENABLE_AUDIT: true,
    ENABLE_METRICS: true,
    ENABLE_CIRCUIT_BREAKER: true,
    ENABLE_RATE_LIMITING: true
  }
};

// ============================================================================
// CONTAINER DE INJEÇÃO DE DEPENDÊNCIAS
// ============================================================================

PAE.Container = (function() {
  var services = {};
  var singletons = {};

  return {
    /**
     * Registra um serviço
     * @param {string} name - Nome do serviço
     * @param {Function} factory - Factory function
     * @param {boolean} singleton - Se é singleton
     */
    register: function(name, factory, singleton) {
      services[name] = {
        factory: factory,
        singleton: singleton !== false
      };
    },

    /**
     * Resolve um serviço
     * @param {string} name - Nome do serviço
     * @returns {*} Instância do serviço
     */
    resolve: function(name) {
      var service = services[name];

      if (!service) {
        throw new Error('Serviço não registrado: ' + name);
      }

      if (service.singleton) {
        if (!singletons[name]) {
          singletons[name] = service.factory(this);
        }
        return singletons[name];
      }

      return service.factory(this);
    },

    /**
     * Verifica se serviço existe
     * @param {string} name - Nome do serviço
     * @returns {boolean}
     */
    has: function(name) {
      return !!services[name];
    },

    /**
     * Lista serviços registrados
     * @returns {Array}
     */
    list: function() {
      try {
        return Object.keys(services);
      } catch (error) {
        Logger.log("Erro em list: " + error.message);
        throw error;
      }
    },

    /**
     * Limpa cache de singletons
     */
    clear: function() {
      singletons = {};
    }
  };
})();

// ============================================================================
// EVENT BUS - COMUNICAÇÃO ENTRE MÓDULOS
// ============================================================================

PAE.EventBus = (function() {
  var listeners = {};

  return {
    /**
     * Registra listener para evento
     * @param {string} event - Nome do evento
     * @param {Function} callback - Callback
     * @returns {Function} Função para remover listener
     */
    on: function(event, callback) {
      try {
        if (!listeners[event]) {
          listeners[event] = [];
        }
        listeners[event].push(callback);

        // Retorna função para remover
        return function() {
          var idx = listeners[event].indexOf(callback);
          if (idx > -1) {
            listeners[event].splice(idx, 1);
          }
        };
      } catch (error) {
        Logger.log("Erro em on: " + error.message);
        throw error;
      }
    },

    /**
     * Emite evento
     * @param {string} event - Nome do evento
     * @param {*} data - Dados do evento
     */
    emit: function(event, data) {
      try {
        if (listeners[event]) {
          listeners[event].forEach(function(callback) {
            try {
              callback(data);
            } catch (e) {
              Logger.log('Erro em listener de evento ' + event + ': ' + e.message);
            }
          });
        }
      } catch (error) {
        Logger.log("Erro em emit: " + error.message);
        throw error;
      }
    },

    /**
     * Remove todos os listeners de um evento
     * @param {string} event - Nome do evento
     */
    off: function(event) {
      delete listeners[event];
    }
  };
})();

// ============================================================================
// CIRCUIT BREAKER - RESILIÊNCIA
// ============================================================================

PAE.CircuitBreaker = (function() {
  var circuits = {};

  var STATES = {
    CLOSED: 'CLOSED',
    OPEN: 'OPEN',
    HALF_OPEN: 'HALF_OPEN'
  };

  function getCircuit(name) {
    try {
      if (!circuits[name]) {
        circuits[name] = {
          state: STATES.CLOSED,
          failures: 0,
          lastFailure: null,
          threshold: 5,
          timeout: 60000 // 1 minuto
        };
      }
      return circuits[name];
    } catch (error) {
      Logger.log("Erro em getCircuit: " + error.message);
      throw error;
    }
  }

  return {
    STATES: STATES,

    /**
     * Executa função com circuit breaker
     * @param {string} name - Nome do circuito
     * @param {Function} fn - Função a executar
     * @param {Function} fallback - Função de fallback
     * @returns {*} Resultado
     */
    execute: function(name, fn, fallback) {
      if (!PAE.Config.FEATURES.ENABLE_CIRCUIT_BREAKER) {
        return fn();
      }

      var circuit = getCircuit(name);

      // Verificar estado
      if (circuit.state === STATES.OPEN) {
        // Verificar se pode tentar novamente
        if (Date.now() - circuit.lastFailure > circuit.timeout) {
          circuit.state = STATES.HALF_OPEN;
        } else {
          Logger.log('⚡ Circuit breaker OPEN para: ' + name);
          if (fallback) return fallback();
          throw new Error('Circuit breaker aberto para: ' + name);
        }
      }

      try {
        var result = fn();

        // Sucesso - resetar
        if (circuit.state === STATES.HALF_OPEN) {
          circuit.state = STATES.CLOSED;
        }
        circuit.failures = 0;

        return result;
      } catch (e) {
        circuit.failures++;
        circuit.lastFailure = Date.now();

        if (circuit.failures >= circuit.threshold) {
          circuit.state = STATES.OPEN;
          Logger.log('⚡ Circuit breaker ABERTO para: ' + name);
          PAE.EventBus.emit('circuit:open', { name: name, error: e.message });
        }

        if (fallback) return fallback();
        throw e;
      }
    },

    /**
     * Obtém estado do circuito
     * @param {string} name - Nome do circuito
     * @returns {Object} Estado
     */
    getState: function(name) {
      return getCircuit(name);
    },

    /**
     * Reseta circuito
     * @param {string} name - Nome do circuito
     */
    reset: function(name) {
      if (circuits[name]) {
        circuits[name].state = STATES.CLOSED;
        circuits[name].failures = 0;
      }
    }
  };
})();

// ============================================================================
// RATE LIMITER
// ============================================================================

PAE.RateLimiter = (function() {
  var buckets = {};

  return {
    /**
     * Verifica se pode executar
     * @param {string} key - Chave do rate limit
     * @param {number} limit - Limite por minuto
     * @returns {boolean}
     */
    canExecute: function(key, limit) {
      try {
        if (!PAE.Config.FEATURES.ENABLE_RATE_LIMITING) {
          return true;
        }

        limit = limit || PAE.Config.LIMITS.RATE_LIMIT_PER_MINUTE;
        var now = Date.now();
        var windowStart = now - 60000; // 1 minuto

        if (!buckets[key]) {
          buckets[key] = [];
        }

        // Limpar entradas antigas
        buckets[key] = buckets[key].filter(function(ts) {
          return ts > windowStart;
        });

        if (buckets[key].length >= limit) {
          return false;
        }

        buckets[key].push(now);
        return true;
      } catch (error) {
        Logger.log("Erro em canExecute: " + error.message);
        throw error;
      }
    },

    /**
     * Obtém uso atual
     * @param {string} key - Chave
     * @returns {Object} Uso
     */
    getUsage: function(key) {
      try {
        var now = Date.now();
        var windowStart = now - 60000;

        if (!buckets[key]) {
          return { current: 0, limit: PAE.Config.LIMITS.RATE_LIMIT_PER_MINUTE };
        }

        var current = buckets[key].filter(function(ts) {
          return ts > windowStart;
        }).length;

        return {
          current: current,
          limit: PAE.Config.LIMITS.RATE_LIMIT_PER_MINUTE,
          remaining: PAE.Config.LIMITS.RATE_LIMIT_PER_MINUTE - current
        };
      } catch (error) {
        Logger.log("Erro em getUsage: " + error.message);
        throw error;
      }
    }
  };
})();

// ============================================================================
// METRICS COLLECTOR
// ============================================================================

PAE.Metrics = (function() {
  var metrics = {
    counters: {},
    gauges: {},
    histograms: {},
    timers: {}
  };

  return {
    /**
     * Incrementa contador
     * @param {string} name - Nome da métrica
     * @param {number} value - Valor (default 1)
     * @param {Object} tags - Tags
     */
    increment: function(name, value, tags) {
      try {
        if (!PAE.Config.FEATURES.ENABLE_METRICS) return;

        var key = name + (tags ? JSON.stringify(tags) : '');
        metrics.counters[key] = (metrics.counters[key] || 0) + (value || 1);
      } catch (error) {
        Logger.log("Erro em increment: " + error.message);
        throw error;
      }
    },

    /**
     * Define gauge
     * @param {string} name - Nome
     * @param {number} value - Valor
     */
    gauge: function(name, value) {
      if (!PAE.Config.FEATURES.ENABLE_METRICS) return;
      metrics.gauges[name] = value;
    },

    /**
     * Registra tempo de execução
     * @param {string} name - Nome
     * @param {number} duration - Duração em ms
     */
    timing: function(name, duration) {
      if (!PAE.Config.FEATURES.ENABLE_METRICS) return;

      if (!metrics.timers[name]) {
        metrics.timers[name] = {
          count: 0,
          total: 0,
          min: Infinity,
          max: 0
        };
      }

      var timer = metrics.timers[name];
      timer.count++;
      timer.total += duration;
      timer.min = Math.min(timer.min, duration);
      timer.max = Math.max(timer.max, duration);
    },

    /**
     * Cria timer
     * @param {string} name - Nome
     * @returns {Function} Função para parar timer
     */
    startTimer: function(name) {
      var start = Date.now();
      var self = this;

      return function() {
        self.timing(name, Date.now() - start);
      };
    },

    /**
     * Obtém todas as métricas
     * @returns {Object}
     */
    getAll: function() {
      try {
        return {
          counters: Object.assign({}, metrics.counters),
          gauges: Object.assign({}, metrics.gauges),
          timers: Object.keys(metrics.timers).reduce(function(acc, key) {
            var t = metrics.timers[key];
            acc[key] = {
              count: t.count,
              avg: t.count > 0 ? t.total / t.count : 0,
              min: t.min === Infinity ? 0 : t.min,
              max: t.max
            };
            return acc;
          }, {})
        };
      } catch (error) {
        Logger.log("Erro em getAll: " + error.message);
        throw error;
      }
    },

    /**
     * Reseta métricas
     */
    reset: function() {
      metrics = {
        counters: {},
        gauges: {},
        histograms: {},
        timers: {}
      };
    }
  };
})();

// ============================================================================
// HEALTH CHECK
// ============================================================================

PAE.HealthCheck = (function() {
  var checks = {};

  return {
    /**
     * Registra check de saúde
     * @param {string} name - Nome
     * @param {Function} checkFn - Função de verificação
     */
    register: function(name, checkFn) {
      checks[name] = checkFn;
    },

    /**
     * Executa todos os checks
     * @returns {Object} Resultado
     */
    run: function() {
      try {
        var results = {};
        var healthy = true;

        for (var name in checks) {
          try {
            var result = checks[name]();
            results[name] = {
              status: result ? 'healthy' : 'unhealthy',
              timestamp: new Date().toISOString()
            };
            if (!result) healthy = false;
          } catch (e) {
            results[name] = {
              status: 'error',
              error: e.message,
              timestamp: new Date().toISOString()
            };
            healthy = false;
          }
        }

        return {
          status: healthy ? 'healthy' : 'unhealthy',
          checks: results,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        Logger.log("Erro em run: " + error.message);
        throw error;
      }
    }
  };
})();

// ============================================================================
// REGISTRAR HEALTH CHECKS PADRÃO
// ============================================================================

PAE.HealthCheck.register('spreadsheet', function() {
  try {
    var ss = getSS();
    return ss !== null;
  } catch (e) {
    return false;
  }
});

PAE.HealthCheck.register('cache', function() {
  try {
    var cache = CacheService.getScriptCache();
    cache.put('health_check', 'ok', 10);
    return cache.get('health_check') === 'ok';
  } catch (e) {
    return false;
  }
});

// ============================================================================
// FUNÇÕES UTILITÁRIAS ENTERPRISE
// ============================================================================

/**
 * Executa função com métricas e resiliência
 * @param {string} name - Nome da operação
 * @param {Function} fn - Função
 * @param {Object} options - Opções
 * @returns {*} Resultado
 */
PAE.execute = function(name, fn, options) {
  options = options || {};

  // Rate limiting
  if (!PAE.RateLimiter.canExecute(name)) {
    PAE.Metrics.increment('rate_limit_exceeded', 1, { operation: name });
    throw new Error('Rate limit excedido para: ' + name);
  }

  // Métricas
  var stopTimer = PAE.Metrics.startTimer(name);
  PAE.Metrics.increment('operation_started', 1, { operation: name });

  try {
    var result;

    if (options.circuitBreaker !== false) {
      result = PAE.CircuitBreaker.execute(name, fn, options.fallback);
    } else {
      result = fn();
    }

    PAE.Metrics.increment('operation_success', 1, { operation: name });
    return result;
  } catch (e) {
    PAE.Metrics.increment('operation_error', 1, { operation: name });
    PAE.EventBus.emit('operation:error', { name: name, error: e.message });
    throw e;
  } finally {
    stopTimer();
  }
};

/**
 * Executa com retry
 * @param {Function} fn - Função
 * @param {number} maxRetries - Máximo de tentativas
 * @param {number} delay - Delay entre tentativas (ms)
 * @returns {*} Resultado
 */
PAE.retry = function(fn, maxRetries, delay) {
  maxRetries = maxRetries || PAE.Config.LIMITS.MAX_RETRIES;
  delay = delay || 1000;

  var lastError;

  for (var i = 0; i < maxRetries; i++) {
    try {
      return fn();
    } catch (e) {
      lastError = e;
      PAE.Metrics.increment('retry_attempt', 1);

      if (i < maxRetries - 1) {
        Utilities.sleep(delay * Math.pow(2, i)); // Exponential backoff
      }
    }
  }

  throw lastError;
};

// ============================================================================
// INICIALIZAÇÃO
// ============================================================================

/**
 * Inicializa sistema enterprise
 */
function initializeEnterprise() {
  try {
    Logger.log('🏢 Inicializando PAE Enterprise Foundation v' + PAE.Config.VERSION);

    // Registrar serviços padrão
    PAE.Container.register('logger', function() {
      return typeof UnifiedLogger !== 'undefined' ? UnifiedLogger : Logger;
    });

    PAE.Container.register('auth', function() {
      return typeof UnifiedAuth !== 'undefined' ? UnifiedAuth : AUTH;
    });

    PAE.Container.register('cache', function() {
      return typeof UnifiedCache !== 'undefined' ? UnifiedCache : CacheService.getScriptCache();
    });

    // Emitir evento de inicialização
    PAE.EventBus.emit('system:initialized', {
      version: PAE.Config.VERSION,
      timestamp: new Date().toISOString()
    });

    Logger.log('✅ PAE Enterprise Foundation inicializado');

    return PAE;
  } catch (error) {
    Logger.log("Erro em initializeEnterprise: " + error.message);
    throw error;
  }
}

/**
 * Obtém status do sistema
 */
function getSystemStatus() {
  try {
    return {
      version: PAE.Config.VERSION,
      environment: PAE.Config.ENVIRONMENT,
      health: PAE.HealthCheck.run(),
      metrics: PAE.Metrics.getAll(),
      services: PAE.Container.list()
    };
  } catch (error) {
    Logger.log("Erro em getSystemStatus: " + error.message);
    throw error;
  }
}

// Auto-inicialização
if (typeof PAE !== 'undefined') {
  // Registrar módulo
  Logger.log('✅ Core Enterprise Foundation carregado');
}
