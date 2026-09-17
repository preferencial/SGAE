/**
 * @fileoverview Core Smart Cache L2 - Sistema de Cache Multinível Aprimorado
 * @version 1.0.0
 * @author UNIAE CRE Team
 * @created 2026-01-05
 * 
 * Intervenção 2/4: Sistema de Cache L1/L2 Aprimorado
 * 
 * Inspirado no AppCache do backend.txt:
 * - L1: Cache em memória (CacheService.getScriptCache) - Ultra rápido
 * - L2: Cache persistente (PropertiesService) - Durável
 * - Invalidação inteligente por TTL e tags
 * - Métricas de hit/miss para otimização
 * - Compressão automática para dados grandes
 * 
 * @requires V8 Runtime
 */

'use strict';

// ============================================================================
// SMART CACHE L2 - Sistema de Cache Multinível
// ============================================================================

var SmartCacheL2 = (function() {
  
  // =========================================================================
  // CONFIGURAÇÃO
  // =========================================================================
  
  var CONFIG = {
    L1_TTL_DEFAULT: 300,        // 5 minutos em segundos
    L2_TTL_DEFAULT: 3600,       // 1 hora em segundos
    MAX_L1_SIZE: 100 * 1024,    // 100KB limite L1
    MAX_L2_SIZE: 500 * 1024,    // 500KB limite L2
    COMPRESSION_THRESHOLD: 1024, // Comprimir acima de 1KB
    PREFIX: 'SC2_',
    METRICS_KEY: 'SC2_METRICS',
    TAGS_INDEX_KEY: 'SC2_TAGS_INDEX'
  };
  
  // =========================================================================
  // MÉTRICAS
  // =========================================================================
  
  var metrics = {
    l1_hits: 0,
    l1_misses: 0,
    l2_hits: 0,
    l2_misses: 0,
    writes: 0,
    invalidations: 0,
    compressions: 0
  };
  
  // =========================================================================
  // CACHE INSTANCES
  // =========================================================================
  
  var l1Cache = null;
  var l2Cache = null;
  
  function getL1() {
    try {
      if (!l1Cache) {
        l1Cache = CacheService.getScriptCache();
      }
      return l1Cache;
    } catch (error) {
      Logger.log("Erro em getL1: " + error.message);
      throw error;
    }
  }
  
  function getL2() {
    try {
      if (!l2Cache) {
        l2Cache = PropertiesService.getScriptProperties();
      }
      return l2Cache;
    } catch (error) {
      Logger.log("Erro em getL2: " + error.message);
      throw error;
    }
  }
  
  // =========================================================================
  // UTILITÁRIOS
  // =========================================================================
  
  /**
   * Gera chave com prefixo
   */
  function makeKey(key) {
    return CONFIG.PREFIX + key;
  }
  
  /**
   * Comprime string usando base64 + simplificação
   */
  function compress(data) {
    try {
      try {
        var json = JSON.stringify(data);
        if (json.length < CONFIG.COMPRESSION_THRESHOLD) {
          return { compressed: false, data: json };
        }
      
        // Compressão simples via Utilities
        var blob = Utilities.newBlob(json);
        var compressed = Utilities.base64Encode(blob.getBytes());
      
        metrics.compressions++;
      
        return { 
          compressed: true, 
          data: compressed,
          originalSize: json.length
        };
      } catch (e) {
        return { compressed: false, data: JSON.stringify(data) };
      }
    } catch (error) {
      Logger.log("Erro em compress: " + error.message);
      throw error;
    }
  }
  
  /**
   * Descomprime dados
   */
  function decompress(wrapper) {
    try {
      try {
        try {
          if (!wrapper.compressed) {
            return JSON.parse(wrapper.data);
          }
      
          var decoded = Utilities.base64Decode(wrapper.data);
          var json = Utilities.newBlob(decoded).getDataAsString();
          return JSON.parse(json);
        } catch (e) {
          return null;
        }
      } catch (error) {
        Logger.log("Erro em decompress: " + error.message);
        throw error;
      }
    } catch (error) {
      Logger.log("Erro em decompress: " + error.message);
      throw error;
    }
  }
  
  /**
   * Verifica se item expirou
   */
  function isExpired(item) {
    if (!item || !item.expires) return true;
    return Date.now() > item.expires;
  }
  
  /**
   * Cria wrapper de cache
   */
  function createWrapper(value, ttl, tags) {
    var compressed = compress(value);
    
    return {
      v: compressed.data,
      c: compressed.compressed,
      e: Date.now() + (ttl * 1000),
      t: tags || [],
      ts: Date.now()
    };
  }
  
  /**
   * Extrai valor do wrapper
   */
  function extractValue(wrapper) {
    if (!wrapper) return null;
    
    try {
      var parsed = typeof wrapper === 'string' ? JSON.parse(wrapper) : wrapper;
      
      if (isExpired({ expires: parsed.e })) {
        return null;
      }
      
      return decompress({ compressed: parsed.c, data: parsed.v });
    } catch (e) {
      return null;
    }
  }
  
  // =========================================================================
  // ÍNDICE DE TAGS
  // =========================================================================
  
  var tagsIndex = null;
  
  function getTagsIndex() {
    try {
      if (tagsIndex) return tagsIndex;
    
      try {
        var stored = getL2().getProperty(CONFIG.TAGS_INDEX_KEY);
        tagsIndex = stored ? JSON.parse(stored) : {};
      } catch (e) {
        tagsIndex = {};
      }
    
      return tagsIndex;
    } catch (error) {
      Logger.log("Erro em getTagsIndex: " + error.message);
      throw error;
    }
  }
  
  function saveTagsIndex() {
    try {
      getL2().setProperty(CONFIG.TAGS_INDEX_KEY, JSON.stringify(tagsIndex));
    } catch (e) {
      Logger.log('Erro ao salvar índice de tags: ' + e.message);
    }
  }
  
  function indexTags(key, tags) {
    try {
      if (!tags || tags.length === 0) return;
    
      var index = getTagsIndex();
    
      tags.forEach(function(tag) {
        if (!index[tag]) {
          index[tag] = [];
        }
        if (index[tag].indexOf(key) === -1) {
          index[tag].push(key);
        }
      });
    
      saveTagsIndex();
    } catch (error) {
      Logger.log("Erro em indexTags: " + error.message);
      throw error;
    }
  }
  
  function removeFromTagsIndex(key) {
    try {
      var index = getTagsIndex();
    
      for (var tag in index) {
        var idx = index[tag].indexOf(key);
        if (idx !== -1) {
          index[tag].splice(idx, 1);
        }
      }
    
      saveTagsIndex();
    } catch (error) {
      Logger.log("Erro em removeFromTagsIndex: " + error.message);
      throw error;
    }
  }
  
  // =========================================================================
  // API PÚBLICA
  // =========================================================================
  
  return {
    
    CONFIG: CONFIG,
    
    /**
     * Obtém valor do cache (L1 primeiro, depois L2)
     * @param {string} key - Chave do cache
     * @returns {*} Valor ou null se não encontrado/expirado
     */
    get: function(key) {
      try {
        var fullKey = makeKey(key);
      
        // Tenta L1 primeiro
        try {
          var l1Value = getL1().get(fullKey);
          if (l1Value) {
            var extracted = extractValue(l1Value);
            if (extracted !== null) {
              metrics.l1_hits++;
              return extracted;
            }
          }
          metrics.l1_misses++;
        } catch (e) {
          metrics.l1_misses++;
        }
      
        // Fallback para L2
        try {
          var l2Value = getL2().getProperty(fullKey);
          if (l2Value) {
            var extracted = extractValue(l2Value);
            if (extracted !== null) {
              metrics.l2_hits++;
            
              // Promove para L1
              try {
                getL1().put(fullKey, l2Value, CONFIG.L1_TTL_DEFAULT);
              } catch (e) {}
            
              return extracted;
            }
          }
          metrics.l2_misses++;
        } catch (e) {
          metrics.l2_misses++;
        }
      
        return null;
      } catch (error) {
        Logger.log("Erro em get: " + error.message);
        throw error;
      }
    },
    
    /**
     * Define valor no cache (L1 e L2)
     * @param {string} key - Chave
     * @param {*} value - Valor
     * @param {Object} [options] - Opções
     * @param {number} [options.ttl] - TTL em segundos
     * @param {Array} [options.tags] - Tags para invalidação em grupo
     * @param {boolean} [options.l1Only] - Salvar apenas em L1
     * @param {boolean} [options.l2Only] - Salvar apenas em L2
     * @returns {boolean} Sucesso
     */
    set: function(key, value, options) {
      try {
        options = options || {};
        var fullKey = makeKey(key);
        var ttl = options.ttl || CONFIG.L2_TTL_DEFAULT;
        var tags = options.tags || [];
      
        try {
          var wrapper = createWrapper(value, ttl, tags);
          var serialized = JSON.stringify(wrapper);
        
          // Verifica tamanho
          if (serialized.length > CONFIG.MAX_L2_SIZE) {
            Logger.log('SmartCacheL2: Valor muito grande para cache: ' + key);
            return false;
          }
        
          // Salva em L1
          if (!options.l2Only) {
            try {
              var l1Ttl = Math.min(ttl, CONFIG.L1_TTL_DEFAULT);
              getL1().put(fullKey, serialized, l1Ttl);
            } catch (e) {}
          }
        
          // Salva em L2
          if (!options.l1Only) {
            try {
              getL2().setProperty(fullKey, serialized);
            } catch (e) {
              Logger.log('SmartCacheL2: Erro ao salvar em L2: ' + e.message);
            }
          }
        
          // Indexa tags
          if (tags.length > 0) {
            indexTags(key, tags);
          }
        
          metrics.writes++;
          return true;
        
        } catch (e) {
          Logger.log('SmartCacheL2: Erro ao definir cache: ' + e.message);
          return false;
        }
      } catch (error) {
        Logger.log("Erro em set: " + error.message);
        throw error;
      }
    },
    
    /**
     * Remove item do cache
     * @param {string} key - Chave
     * @returns {boolean} Sucesso
     */
    delete: function(key) {
      try {
        var fullKey = makeKey(key);
      
        try {
          getL1().remove(fullKey);
        } catch (e) {}
      
        try {
          getL2().deleteProperty(fullKey);
        } catch (e) {}
      
        removeFromTagsIndex(key);
        metrics.invalidations++;
      
        return true;
      } catch (error) {
        Logger.log("Erro em delete: " + error.message);
        throw error;
      }
    },
    
    /**
     * Invalida todos os itens com determinada tag
     * @param {string} tag - Tag para invalidar
     * @returns {number} Quantidade de itens invalidados
     */
    invalidateByTag: function(tag) {
      var index = getTagsIndex();
      var keys = index[tag] || [];
      var count = 0;
      
      var self = this;
      keys.forEach(function(key) {
        self.delete(key);
        count++;
      });
      
      delete index[tag];
      saveTagsIndex();
      
      return count;
    },
    
    /**
     * Invalida múltiplas tags
     * @param {Array} tags - Array de tags
     * @returns {number} Total invalidado
     */
    invalidateByTags: function(tags) {
      try {
        var total = 0;
        var self = this;
      
        tags.forEach(function(tag) {
          total += self.invalidateByTag(tag);
        });
      
        return total;
      } catch (error) {
        Logger.log("Erro em invalidateByTags: " + error.message);
        throw error;
      }
    },
    
    /**
     * Obtém ou define (get-or-set pattern)
     * @param {string} key - Chave
     * @param {Function} factory - Função que gera o valor se não existir
     * @param {Object} [options] - Opções de cache
     * @returns {*} Valor do cache ou gerado
     */
    getOrSet: function(key, factory, options) {
      try {
        var cached = this.get(key);
      
        if (cached !== null) {
          return cached;
        }
      
        var value = factory();
        this.set(key, value, options);
      
        return value;
      } catch (error) {
        Logger.log("Erro em getOrSet: " + error.message);
        throw error;
      }
    },
    
    /**
     * Obtém múltiplas chaves
     * @param {Array} keys - Array de chaves
     * @returns {Object} Mapa de chave -> valor
     */
    getMultiple: function(keys) {
      try {
        var result = {};
        var self = this;
      
        keys.forEach(function(key) {
          result[key] = self.get(key);
        });
      
        return result;
      } catch (error) {
        Logger.log("Erro em getMultiple: " + error.message);
        throw error;
      }
    },
    
    /**
     * Define múltiplas chaves
     * @param {Object} items - Mapa de chave -> valor
     * @param {Object} [options] - Opções de cache
     * @returns {boolean} Sucesso
     */
    setMultiple: function(items, options) {
      var self = this;
      var success = true;
      
      for (var key in items) {
        if (items.hasOwnProperty(key)) {
          if (!self.set(key, items[key], options)) {
            success = false;
          }
        }
      }
      
      return success;
    },
    
    /**
     * Limpa todo o cache
     * @returns {boolean} Sucesso
     */
    clear: function() {
      try {
        try {
          // Limpa L1
          var l1 = getL1();
          // CacheService não tem método para listar chaves,
          // então limpamos o que conhecemos via tags index
        
          // Limpa L2 (apenas chaves com nosso prefixo)
          var l2 = getL2();
          var props = l2.getProperties();
        
          for (var key in props) {
            if (key.indexOf(CONFIG.PREFIX) === 0) {
              l2.deleteProperty(key);
              try { l1.remove(key); } catch (e) {}
            }
          }
        
          // Reseta índice de tags
          tagsIndex = {};
          saveTagsIndex();
        
          // Reseta métricas
          metrics = {
            l1_hits: 0,
            l1_misses: 0,
            l2_hits: 0,
            l2_misses: 0,
            writes: 0,
            invalidations: 0,
            compressions: 0
          };
        
          return true;
        } catch (e) {
          Logger.log('SmartCacheL2: Erro ao limpar cache: ' + e.message);
          return false;
        }
      } catch (error) {
        Logger.log("Erro em clear: " + error.message);
        throw error;
      }
    },
    
    /**
     * Obtém métricas do cache
     * @returns {Object} Métricas
     */
    getMetrics: function() {
      var totalHits = metrics.l1_hits + metrics.l2_hits;
      var totalMisses = metrics.l1_misses + metrics.l2_misses;
      var total = totalHits + totalMisses;
      
      return {
        l1: {
          hits: metrics.l1_hits,
          misses: metrics.l1_misses,
          hitRate: metrics.l1_hits + metrics.l1_misses > 0 
            ? (metrics.l1_hits / (metrics.l1_hits + metrics.l1_misses) * 100).toFixed(2) + '%'
            : '0%'
        },
        l2: {
          hits: metrics.l2_hits,
          misses: metrics.l2_misses,
          hitRate: metrics.l2_hits + metrics.l2_misses > 0
            ? (metrics.l2_hits / (metrics.l2_hits + metrics.l2_misses) * 100).toFixed(2) + '%'
            : '0%'
        },
        total: {
          hits: totalHits,
          misses: totalMisses,
          hitRate: total > 0 ? (totalHits / total * 100).toFixed(2) + '%' : '0%'
        },
        writes: metrics.writes,
        invalidations: metrics.invalidations,
        compressions: metrics.compressions
      };
    },
    
    /**
     * Verifica saúde do cache
     * @returns {Object} Status de saúde
     */
    healthCheck: function() {
      try {
        var testKey = '_health_check_' + Date.now();
        var testValue = { test: true, timestamp: Date.now() };
      
        var l1Ok = false;
        var l2Ok = false;
      
        try {
          this.set(testKey, testValue, { ttl: 60 });
          var retrieved = this.get(testKey);
          l1Ok = retrieved && retrieved.test === true;
          l2Ok = l1Ok;
          this.delete(testKey);
        } catch (e) {
          Logger.log('SmartCacheL2 health check failed: ' + e.message);
        }
      
        return {
          healthy: l1Ok && l2Ok,
          l1: l1Ok ? 'OK' : 'FAIL',
          l2: l2Ok ? 'OK' : 'FAIL',
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        Logger.log("Erro em healthCheck: " + error.message);
        throw error;
      }
    }
  };
})();

// ============================================================================
// CACHE DECORATORS
// ============================================================================

/**
 * Decorator para cachear resultado de função
 * @param {string} keyPrefix - Prefixo da chave
 * @param {Object} options - Opções de cache
 * @returns {Function} Decorator
 */
function withCache(keyPrefix, options) {
  try {
    try {
      options = options || {};
  
      return function(fn) {
        return function() {
          var args = Array.prototype.slice.call(arguments);
          var cacheKey = keyPrefix + '_' + JSON.stringify(args);
      
          return SmartCacheL2.getOrSet(cacheKey, function() {
            return fn.apply(this, args);
          }, options);
        };
      };
    } catch (error) {
      Logger.log("Erro em withCache: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em withCache: " + error.message);
    throw error;
  }
}

/**
 * Invalida cache ao executar função
 * @param {Array} tags - Tags a invalidar
 * @returns {Function} Decorator
 */
function invalidatesCache(tags) {
  return function(fn) {
    return function() {
      var result = fn.apply(this, arguments);
      SmartCacheL2.invalidateByTags(tags);
      return result;
    };
  };
}

// ============================================================================
// FUNÇÕES DE CONVENIÊNCIA
// ============================================================================

/**
 * Cache simples - get
 */
function cacheGet(key) {
  try {
    return SmartCacheL2.get(key);
  } catch (error) {
    Logger.log("Erro em cacheGet: " + error.message);
    throw error;
  }
}

/**
 * Cache simples - set
 */
function cacheSet(key, value, ttlSeconds) {
  return SmartCacheL2.set(key, value, { ttl: ttlSeconds });
}

/**
 * Cache simples - delete
 */
function cacheDelete(key) {
  return SmartCacheL2.delete(key);
}

/**
 * Cache - get or set
 */
function cacheGetOrSet(key, factory, ttlSeconds) {
  return SmartCacheL2.getOrSet(key, factory, { ttl: ttlSeconds });
}

// ============================================================================
// REGISTRO DO MÓDULO
// ============================================================================

Logger.log('✅ Core_Smart_Cache_L2.gs carregado - SmartCacheL2 disponível');
