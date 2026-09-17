/**
 * @fileoverview Sistema Unificado de Cache
 * @version 3.0.0
 * @description Consolida Core_Cache.gs e Core_Cache_Advanced.gs
 *
 * MIGRAÇÃO:
 * - CACHE global -> UnifiedCache.memory
 * - getCachedSheet() -> UnifiedCache.getSheet()
 * - AdvancedCache -> UnifiedCache (mantém compatibilidade)
 */

'use strict';

var UnifiedCache = (function() {

  // ============================================================================
  // CONFIGURAÇÃO
  // ============================================================================

  var CONFIG = {
    LAYERS: {
      MEMORY: 'memory',
      SCRIPT: 'script',
      DOCUMENT: 'document'
    },
    TTL: {
      VOLATILE: 10,      // 10 segundos
      REALTIME: 60,      // 1 minuto
      DYNAMIC: 300,      // 5 minutos
      STATIC: 3600,      // 1 hora
      PERSISTENT: 21600  // 6 horas
    },
    MAX_MEMORY_ITEMS: 100,
    MAX_CACHE_SIZE: 100000 // 100KB
  };

  // Cache em memória (mais rápido)
  var memoryCache = {};
  var memoryTimestamps = {};

  // Estatísticas
  var stats = {
    hits: 0,
    misses: 0,
    invalidations: 0
  };

  // Cache de objetos do Spreadsheet
  var spreadsheetCache = {
    ss: null,
    sheets: {},
    headers: {},
    lastAccess: {}
  };

  // ============================================================================
  // FUNÇÕES INTERNAS
  // ============================================================================

  function generateKey(namespace, key, params) {
    try {
      var paramStr = params ? JSON.stringify(params) : '';
      var hash = paramStr.length > 50 ?
        Utilities.base64Encode(paramStr).substring(0, 50) : paramStr;
      return namespace + ':' + key + (hash ? ':' + hash : '');
    } catch (error) {
      Logger.log("Erro em generateKey: " + error.message);
      throw error;
    }
  }

  function isExpired(timestamp, ttl) {
    return Date.now() - timestamp > ttl * 1000;
  }

  function getCacheService(layer) {
    switch (layer) {
      case CONFIG.LAYERS.DOCUMENT:
        return CacheService.getDocumentCache();
      case CONFIG.LAYERS.SCRIPT:
      default:
        return CacheService.getScriptCache();
    }
  }

  function cleanupMemory() {
    try {
      try {
        var keys = Object.keys(memoryCache);
        if (keys.length > CONFIG.MAX_MEMORY_ITEMS) {
          // Remove os mais antigos
          keys.sort(function(a, b) {
            return (memoryTimestamps[a] || 0) - (memoryTimestamps[b] || 0);
          });

          var toRemove = keys.slice(0, Math.floor(keys.length / 2));
          toRemove.forEach(function(key) {
            delete memoryCache[key];
            delete memoryTimestamps[key];
          });
        }
      } catch (error) {
        Logger.log("Erro em cleanupMemory: " + error.message);
        throw error;
      }
    } catch (error) {
      Logger.log("Erro em cleanupMemory: " + error.message);
      throw error;
    }
  }

  // ============================================================================
  // API PÚBLICA
  // ============================================================================

  return {
    // Expõe constantes
    LAYERS: CONFIG.LAYERS,
    TTL: CONFIG.TTL,

    /**
     * Armazena valor no cache
     */
    set: function(namespace, key, data, options) {
      options = options || {};
      var ttl = options.ttl || CONFIG.TTL.DYNAMIC;
      var layer = options.layer || CONFIG.LAYERS.SCRIPT;
      var cacheKey = generateKey(namespace, key, options.params);

      var cacheData = {
        data: data,
        timestamp: Date.now(),
        ttl: ttl
      };

      try {
        if (layer === CONFIG.LAYERS.MEMORY) {
          cleanupMemory();
          memoryCache[cacheKey] = cacheData;
          memoryTimestamps[cacheKey] = Date.now();
        } else {
          var service = getCacheService(layer);
          var serialized = JSON.stringify(cacheData);

          if (serialized.length < CONFIG.MAX_CACHE_SIZE) {
            service.put(cacheKey, serialized, ttl);
          }
        }
        return true;
      } catch (e) {
        if (typeof UnifiedLogger !== 'undefined') {
          UnifiedLogger.warn('Cache set failed: ' + cacheKey, e);
        }
        return false;
      }
    },

    /**
     * Recupera valor do cache
     */
    get: function(namespace, key, options) {
      options = options || {};
      var layers = options.layers || [CONFIG.LAYERS.MEMORY, CONFIG.LAYERS.SCRIPT];
      var cacheKey = generateKey(namespace, key, options.params);

      for (var i = 0; i < layers.length; i++) {
        var layer = layers[i];
        var cacheData = null;

        try {
          if (layer === CONFIG.LAYERS.MEMORY) {
            cacheData = memoryCache[cacheKey];
          } else {
            var service = getCacheService(layer);
            var cached = service.get(cacheKey);
            if (cached) {
              cacheData = JSON.parse(cached);
            }
          }

          if (cacheData && !isExpired(cacheData.timestamp, cacheData.ttl)) {
            stats.hits++;

            // Promove para memória se veio de camada inferior
            if (i > 0 && layers[0] === CONFIG.LAYERS.MEMORY) {
              memoryCache[cacheKey] = cacheData;
              memoryTimestamps[cacheKey] = Date.now();
            }

            return cacheData.data;
          }
        } catch (e) {
          // Continua para próxima camada
        }
      }

      stats.misses++;
      return null;
    },

    /**
     * Remove valor do cache
     */
    remove: function(namespace, key, options) {
      try {
        options = options || {};
        var cacheKey = generateKey(namespace, key, options.params);

        delete memoryCache[cacheKey];
        delete memoryTimestamps[cacheKey];

        try {
          CacheService.getScriptCache().remove(cacheKey);
          CacheService.getDocumentCache().remove(cacheKey);
        } catch (e) {
          // Ignora erros
        }

        stats.invalidations++;
      } catch (error) {
        Logger.log("Erro em remove: " + error.message);
        throw error;
      }
    },

    /**
     * Invalida cache por namespace
     */
    invalidate: function(namespace, pattern) {
      // Limpa memória
      Object.keys(memoryCache).forEach(function(key) {
        if (key.indexOf(namespace + ':') === 0) {
          if (!pattern || key.indexOf(pattern) !== -1) {
            delete memoryCache[key];
            delete memoryTimestamps[key];
          }
        }
      });

      stats.invalidations++;

      if (typeof UnifiedLogger !== 'undefined') {
        UnifiedLogger.debug('Cache invalidated: ' + namespace);
      }
    },

    /**
     * Wrapper para operações com cache automático
     */
    wrap: function(namespace, key, fn, options) {
      try {
        var cached = this.get(namespace, key, options);
        if (cached !== null) {
          return cached;
        }

        var result = fn();
        this.set(namespace, key, result, options);
        return result;
      } catch (error) {
        Logger.log("Erro em wrap: " + error.message);
        throw error;
      }
    },

    /**
     * Limpa todo o cache
     * @returns {Object} Resultado da operação
     */
    clear: function() {
      memoryCache = {};
      memoryTimestamps = {};

      try {
        // Não há método para limpar todo o cache, mas podemos resetar stats
        stats = { hits: 0, misses: 0, invalidations: 0 };
      } catch (e) {
        // Ignora
      }

      if (typeof UnifiedLogger !== 'undefined') {
        UnifiedLogger.log('All caches cleared');
      }
      
      return { success: true, message: 'Cache limpo com sucesso' };
    },

    /**
     * Obtém estatísticas
     */
    getStats: function() {
      var total = stats.hits + stats.misses;
      return {
        hits: stats.hits,
        misses: stats.misses,
        hitRate: total > 0 ? (stats.hits / total * 100).toFixed(2) + '%' : '0%',
        invalidations: stats.invalidations,
        memorySize: Object.keys(memoryCache).length
      };
    },

    // ========================================================================
    // CACHE DE SPREADSHEET (compatibilidade com Core_Cache.gs)
    // ========================================================================

    /**
     * Obtém spreadsheet com cache
     */
    getSpreadsheet: function() {
      if (!spreadsheetCache.ss) {
        spreadsheetCache.ss = getSS();
      }
      return spreadsheetCache.ss;
    },

    /**
     * Obtém sheet com cache
     */
    getSheet: function(sheetName) {
      try {
        var now = Date.now();
        var ttl = CONFIG.TTL.DYNAMIC * 1000;

        // Verifica expiração
        if (spreadsheetCache.sheets[sheetName] && spreadsheetCache.lastAccess[sheetName]) {
          if (now - spreadsheetCache.lastAccess[sheetName] > ttl) {
            delete spreadsheetCache.sheets[sheetName];
          }
        }

        if (!spreadsheetCache.sheets[sheetName]) {
          var ss = this.getSpreadsheet();
          spreadsheetCache.sheets[sheetName] = ss.getSheetByName(sheetName);
          spreadsheetCache.lastAccess[sheetName] = now;
        }

        return spreadsheetCache.sheets[sheetName];
      } catch (error) {
        Logger.log("Erro em getSheet: " + error.message);
        throw error;
      }
    },

    /**
     * Obtém headers com cache
     */
    getHeaders: function(sheetName) {
      try {
        var now = Date.now();
        var ttl = CONFIG.TTL.DYNAMIC * 1000;
        var cacheKey = 'headers_' + sheetName;

        // Verifica expiração
        if (spreadsheetCache.headers[sheetName] && spreadsheetCache.lastAccess[cacheKey]) {
          if (now - spreadsheetCache.lastAccess[cacheKey] > ttl) {
            delete spreadsheetCache.headers[sheetName];
          }
        }

        if (!spreadsheetCache.headers[sheetName]) {
          var sheet = this.getSheet(sheetName);
          if (sheet && sheet.getLastColumn() > 0) {
            spreadsheetCache.headers[sheetName] = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
            spreadsheetCache.lastAccess[cacheKey] = now;
          } else {
            return [];
          }
        }

        return spreadsheetCache.headers[sheetName] || [];
      } catch (error) {
        Logger.log("Erro em getHeaders: " + error.message);
        throw error;
      }
    },

    /**
     * Limpa cache de sheet específica
     */
    clearSheetCache: function(sheetName) {
      delete spreadsheetCache.sheets[sheetName];
      delete spreadsheetCache.headers[sheetName];
      delete spreadsheetCache.lastAccess[sheetName];
      delete spreadsheetCache.lastAccess['headers_' + sheetName];
    },

    /**
     * Limpa todo cache de spreadsheet
     */
    clearSpreadsheetCache: function() {
      spreadsheetCache = {
        ss: null,
        sheets: {},
        headers: {},
        lastAccess: {}
      };
    }
  };
})();

// ============================================================================
// ALIASES PARA COMPATIBILIDADE
// ============================================================================

// Compatibilidade com AdvancedCache
var AdvancedCache = UnifiedCache;

// NOTA: Funções globais de cache (getCachedSpreadsheet, clearCache, etc.)
// estão definidas em Core_Cache.gs para evitar duplicação.
// Use CacheManager para acesso direto ao cache.

function getCacheStats() {
  return UnifiedCache.getStats();
}
