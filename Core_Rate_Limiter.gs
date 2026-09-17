/**
 * @fileoverview Rate Limiter com Token Bucket e Sliding Window
 * @version 2.0.0
 * @description Controle sofisticado de taxa de requisições com múltiplas estratégias
 */

'use strict';

var RateLimiter = (function() {

  var buckets = {};
  var windows = {};

  var defaultConfig = {
    strategy: 'token_bucket',  // 'token_bucket', 'sliding_window', 'fixed_window'
    maxRequests: 100,
    windowSize: 60000,         // 1 minuto
    refillRate: 10,            // tokens por segundo
    burstSize: 20              // máximo de burst
  };

  /**
   * Token Bucket Algorithm
   */
  function tokenBucket(key, config) {
    var now = Date.now();

    if (!buckets[key]) {
      buckets[key] = {
        tokens: config.burstSize,
        lastRefill: now,
        config: config
      };
    }

    var bucket = buckets[key];

    // Reabastece tokens
    var timePassed = (now - bucket.lastRefill) / 1000;
    var tokensToAdd = timePassed * config.refillRate;
    bucket.tokens = Math.min(config.burstSize, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;

    // Verifica se há tokens disponíveis
    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return {
        allowed: true,
        remaining: Math.floor(bucket.tokens),
        resetIn: Math.ceil((config.burstSize - bucket.tokens) / config.refillRate * 1000)
      };
    }

    return {
      allowed: false,
      remaining: 0,
      resetIn: Math.ceil((1 - bucket.tokens) / config.refillRate * 1000)
    };
  }

  /**
   * Sliding Window Algorithm
   */
  function slidingWindow(key, config) {
    try {
      var now = Date.now();

      if (!windows[key]) {
        windows[key] = {
          requests: [],
          config: config
        };
      }

      var window = windows[key];

      // Remove requisições antigas
      window.requests = window.requests.filter(function(timestamp) {
        return now - timestamp < config.windowSize;
      });

      // Verifica limite
      if (window.requests.length < config.maxRequests) {
        window.requests.push(now);
        return {
          allowed: true,
          remaining: config.maxRequests - window.requests.length,
          resetIn: config.windowSize
        };
      }

      var oldestRequest = window.requests[0];
      var resetIn = config.windowSize - (now - oldestRequest);

      return {
        allowed: false,
        remaining: 0,
        resetIn: resetIn
      };
    } catch (error) {
      Logger.log("Erro em slidingWindow: " + error.message);
      throw error;
    }
  }

  /**
   * Fixed Window Algorithm
   */
  function fixedWindow(key, config) {
    var now = Date.now();
    var windowStart = Math.floor(now / config.windowSize) * config.windowSize;
    var windowKey = key + ':' + windowStart;

    if (!windows[windowKey]) {
      windows[windowKey] = {
        count: 0,
        start: windowStart,
        config: config
      };
    }

    var window = windows[windowKey];

    if (window.count < config.maxRequests) {
      window.count++;
      return {
        allowed: true,
        remaining: config.maxRequests - window.count,
        resetIn: windowStart + config.windowSize - now
      };
    }

    return {
      allowed: false,
      remaining: 0,
      resetIn: windowStart + config.windowSize - now
    };
  }

  /**
   * Limpa dados antigos
   */
  function cleanup() {
    try {
      var now = Date.now();
      var removed = 0;

      // Limpa windows antigas
      Object.keys(windows).forEach(function(key) {
        var window = windows[key];
        if (window.start && now - window.start > window.config.windowSize * 2) {
          delete windows[key];
          removed++;
        }
      });

      // Limpa buckets inativos
      Object.keys(buckets).forEach(function(key) {
        var bucket = buckets[key];
        if (now - bucket.lastRefill > 300000) { // 5 minutos
          delete buckets[key];
          removed++;
        }
      });

      if (removed > 0) {
        AppLogger.debug('RateLimiter cleanup: ' + removed + ' entries removed');
      }
    } catch (error) {
      Logger.log("Erro em cleanup: " + error.message);
      throw error;
    }
  }

  return {
    /**
     * Verifica se requisição é permitida
     */
    check: function(key, config) {
      try {
        config = Object.assign({}, defaultConfig, config || {});

        var result;
        switch (config.strategy) {
          case 'token_bucket':
            result = tokenBucket(key, config);
            break;
          case 'sliding_window':
            result = slidingWindow(key, config);
            break;
          case 'fixed_window':
            result = fixedWindow(key, config);
            break;
          default:
            result = tokenBucket(key, config);
        }

        if (!result.allowed) {
          AppLogger.warn('Rate limit exceeded for: ' + key);
        }

        return result;
      } catch (error) {
        Logger.log("Erro em check: " + error.message);
        throw error;
      }
    },

    /**
     * Wrapper para executar função com rate limiting
     */
    execute: function(key, fn, config) {
      var check = this.check(key, config);

      if (!check.allowed) {
        throw new Error('Rate limit exceeded. Try again in ' +
          Math.ceil(check.resetIn / 1000) + ' seconds');
      }

      return fn();
    },

    /**
     * Rate limiter por usuário
     */
    checkUser: function(config) {
      try {
        var user = Session.getActiveUser().getEmail();
        return this.check('user:' + user, config);
      } catch (error) {
        Logger.log("Erro em checkUser: " + error.message);
        throw error;
      }
    },

    /**
     * Rate limiter por operação
     */
    checkOperation: function(operation, config) {
      return this.check('operation:' + operation, config);
    },

    /**
     * Rate limiter por IP (simulado com user)
     */
    checkIP: function(config) {
      return this.checkUser(config);
    },

    /**
     * Obtém status de um limitador
     */
    getStatus: function(key) {
      if (buckets[key]) {
        return {
          type: 'token_bucket',
          tokens: Math.floor(buckets[key].tokens),
          lastRefill: buckets[key].lastRefill
        };
      }

      if (windows[key]) {
        return {
          type: 'window',
          requests: windows[key].requests ? windows[key].requests.length : windows[key].count,
          start: windows[key].start
        };
      }

      return { type: 'none', message: 'No limiter found' };
    },

    /**
     * Lista todos os limitadores ativos
     */
    list: function() {
      try {
        return {
          buckets: Object.keys(buckets).map(function(key) {
            return {
              key: key,
              tokens: Math.floor(buckets[key].tokens),
              lastRefill: new Date(buckets[key].lastRefill)
            };
          }),
          windows: Object.keys(windows).map(function(key) {
            var window = windows[key];
            return {
              key: key,
              requests: window.requests ? window.requests.length : window.count,
              start: window.start ? new Date(window.start) : null
            };
          })
        };
      } catch (error) {
        Logger.log("Erro em list: " + error.message);
        throw error;
      }
    },

    /**
     * Reseta limitador específico
     */
    reset: function(key) {
      delete buckets[key];
      delete windows[key];
      AppLogger.log('Rate limiter reset: ' + key);
    },

    /**
     * Reseta todos os limitadores
     */
    resetAll: function() {
      buckets = {};
      windows = {};
      AppLogger.log('All rate limiters reset');
    },

    /**
     * Limpa dados antigos
     */
    cleanup: cleanup,

    /**
     * Configuração padrão
     */
    defaults: defaultConfig
  };
})();

/**
 * Trigger para cleanup automático
 */
function rateLimiterCleanup() {
  RateLimiter.cleanup();
}
