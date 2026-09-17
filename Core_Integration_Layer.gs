/**
 * @fileoverview Camada de Integração - Une todos os sistemas de otimização
 * @version 2.0.0
 * @description API unificada que integra cache, batch, query optimizer, monitoring e rate limiting
 */

'use strict';

// ============================================================================
// ALIAS: BatchOptimizer -> BatchOperations
// Compatibilidade com código que usa BatchOptimizer
// ============================================================================
var BatchOptimizer = (function() {
  var config = {
    maxSize: 100,
    maxWait: 2000,
    autoFlush: true
  };
  
  return {
    configure: function(options) {
      if (options) {
        if (options.maxSize) config.maxSize = options.maxSize;
        if (options.maxWait) config.maxWait = options.maxWait;
        if (options.autoFlush !== undefined) config.autoFlush = options.autoFlush;
        
        // Propaga para BatchOperations se disponível
        if (typeof BatchOperations !== 'undefined') {
          if (BatchOperations.setBufferSize) BatchOperations.setBufferSize(config.maxSize);
        }
      }
      return config;
    },
    
    getQueueStatus: function() {
      if (typeof BatchOperations !== 'undefined' && BatchOperations.getCacheStats) {
        var stats = BatchOperations.getCacheStats();
        return {
          size: stats.entries || 0,
          maxSize: config.maxSize,
          pending: 0
        };
      }
      return { size: 0, maxSize: config.maxSize, pending: 0 };
    },
    
    writeBatch: function(sheetName, records) {
      try {
        if (typeof BatchOperations !== 'undefined') {
          // Usa bufferWrite + flushWrites
          records.forEach(function(record) {
            BatchOperations.bufferWrite(sheetName, record);
          });
          return BatchOperations.flushWrites(sheetName);
        }
        return { success: false, error: 'BatchOperations não disponível' };
      } catch (error) {
        Logger.log("Erro em writeBatch: " + error.message);
        throw error;
      }
    },
    
    updateBatch: function(sheetName, updates) {
      if (typeof BatchOperations !== 'undefined' && BatchOperations.batchUpdate) {
        return BatchOperations.batchUpdate(sheetName, updates);
      }
      return { success: false, error: 'BatchOperations não disponível' };
    },
    
    readBatch: function(sheetName, rowIndices) {
      if (typeof BatchOperations !== 'undefined' && BatchOperations.readRows) {
        return BatchOperations.readRows(sheetName, rowIndices);
      }
      return { success: false, error: 'BatchOperations não disponível' };
    }
  };
})();

var OptimizedAPI = (function() {

  /**
   * Inicializa todos os sistemas
   */
  function initialize() {
    try {
      // Inicializa índices comuns
      QueryOptimizer.initializeCommonIndices();

      // Configura thresholds de performance
      PerformanceMonitor.setThresholds({
        slowQuery: 1000,
        highMemory: 50000000,
        quotaWarning: 0.8
      });

      // Configura batch optimizer
      BatchOptimizer.configure({
        maxSize: 100,
        maxWait: 2000,
        autoFlush: true
      });

      AppLogger.log('Sistema de otimização inicializado');
      return { success: true };
    } catch (e) {
      AppLogger.error('Erro ao inicializar sistema de otimização', e);
      return { success: false, error: e.message };
    }
  }

  /**
   * CREATE otimizado
   */
  function create(sheetName, data, options) {
    options = options || {};

    return PerformanceMonitor.monitor('create_' + sheetName, function() {
      // Rate limiting
      if (options.rateLimitKey) {
        var rateCheck = RateLimiter.check(options.rateLimitKey);
        if (!rateCheck.allowed) {
          throw new Error('Rate limit exceeded');
        }
      }

      // Executa criação
      var result = CRUD.create(sheetName, data);

      // Invalida cache
      if (result.success) {
        AdvancedCache.invalidate(sheetName);
      }

      return result;
    }, { type: 'create', sheet: sheetName });
  }

  /**
   * READ otimizado com cache e índices
   */
  function read(sheetName, filters, options) {
    try {
      options = options || {};

      return PerformanceMonitor.monitor('read_' + sheetName, function() {
        // Rate limiting
        if (options.rateLimitKey) {
          var rateCheck = RateLimiter.check(options.rateLimitKey);
          if (!rateCheck.allowed) {
            throw new Error('Rate limit exceeded');
          }
        }

        // Tenta cache primeiro
        var cacheKey = 'read_' + JSON.stringify(filters);
        var cached = AdvancedCache.get(sheetName, cacheKey, {
          params: options,
          layers: [AdvancedCache.LAYERS.MEMORY, AdvancedCache.LAYERS.SCRIPT]
        });

        if (cached !== null && options.cache !== false) {
          return cached;
        }

        // Tenta usar query optimizer
        var result;
        if (filters && Object.keys(filters).length > 0) {
          result = QueryOptimizer.execute(sheetName, filters, options);
        } else {
          result = CRUD.read(sheetName, options);
        }

        // Armazena em cache
        if (result.success && options.cache !== false) {
          AdvancedCache.set(sheetName, cacheKey, result, {
            params: options,
            ttl: options.cacheTTL || AdvancedCache.TTL.DYNAMIC,
            layer: AdvancedCache.LAYERS.SCRIPT
          });
        }

        return result;
      }, { type: 'read', sheet: sheetName });
    } catch (error) {
      Logger.log("Erro em read: " + error.message);
      throw error;
    }
  }

  /**
   * UPDATE otimizado
   */
  function update(sheetName, rowIndex, data, options) {
    options = options || {};

    return PerformanceMonitor.monitor('update_' + sheetName, function() {
      // Rate limiting
      if (options.rateLimitKey) {
        var rateCheck = RateLimiter.check(options.rateLimitKey);
        if (!rateCheck.allowed) {
          throw new Error('Rate limit exceeded');
        }
      }

      // Executa atualização
      var result = CRUD.update(sheetName, rowIndex, data);

      // Invalida cache
      if (result.success) {
        AdvancedCache.invalidate(sheetName);
      }

      return result;
    }, { type: 'update', sheet: sheetName });
  }

  /**
   * DELETE otimizado
   */
  function deleteRecord(sheetName, rowIndex, options) {
    options = options || {};

    return PerformanceMonitor.monitor('delete_' + sheetName, function() {
      // Rate limiting
      if (options.rateLimitKey) {
        var rateCheck = RateLimiter.check(options.rateLimitKey);
        if (!rateCheck.allowed) {
          throw new Error('Rate limit exceeded');
        }
      }

      // Executa deleção
      var result = CRUD.delete(sheetName, rowIndex, options.hard);

      // Invalida cache
      if (result.success) {
        AdvancedCache.invalidate(sheetName);
      }

      return result;
    }, { type: 'delete', sheet: sheetName });
  }

  /**
   * Batch CREATE otimizado
   */
  function batchCreate(sheetName, records, options) {
    options = options || {};

    return PerformanceMonitor.monitor('batch_create_' + sheetName, function() {
      var result = BatchOptimizer.writeBatch(sheetName, records);

      if (result.success) {
        AdvancedCache.invalidate(sheetName);
      }

      return result;
    }, { type: 'batch_create', sheet: sheetName, count: records.length });
  }

  /**
   * Batch UPDATE otimizado
   */
  function batchUpdate(sheetName, updates, options) {
    options = options || {};

    return PerformanceMonitor.monitor('batch_update_' + sheetName, function() {
      var result = BatchOptimizer.updateBatch(sheetName, updates);

      if (result.success) {
        AdvancedCache.invalidate(sheetName);
      }

      return result;
    }, { type: 'batch_update', sheet: sheetName, count: updates.length });
  }

  /**
   * Busca otimizada com múltiplos filtros
   */
  function search(sheetName, query, options) {
    try {
      options = options || {};

      return PerformanceMonitor.monitor('search_' + sheetName, function() {
        // Analisa query
        var analysis = QueryOptimizer.analyze(sheetName, query, options);

        if (analysis.suggestions.length > 0) {
          AppLogger.debug('Query suggestions: ' + JSON.stringify(analysis.suggestions));
        }

        // Executa busca otimizada
        return read(sheetName, query, options);
      }, { type: 'search', sheet: sheetName });
    } catch (error) {
      Logger.log("Erro em search: " + error.message);
      throw error;
    }
  }

  /**
   * Dashboard de métricas consolidadas
   */
  function getMetrics() {
    return {
      cache: AdvancedCache.getStats(),
      performance: PerformanceMonitor.analyzeBottlenecks(),
      queries: QueryOptimizer.getStats(),
      rateLimiter: RateLimiter.list(),
      batch: BatchOptimizer.getQueueStatus()
    };
  }

  /**
   * Relatório completo de performance
   */
  function getPerformanceReport() {
    return PerformanceMonitor.report();
  }

  /**
   * Health check do sistema
   */
  function healthCheck() {
    try {
      var health = {
        status: 'healthy',
        timestamp: new Date(),
        checks: {}
      };

      try {
        // Verifica cache
        var cacheStats = AdvancedCache.getStats();
        health.checks.cache = {
          status: 'ok',
          hitRate: cacheStats.hitRate,
          size: cacheStats.memorySize
        };

        // Verifica performance
        var perfStats = PerformanceMonitor.analyzeBottlenecks();
        var slowRate = perfStats.totalOperations > 0 ?
          perfStats.slowOperations / perfStats.totalOperations : 0;

        health.checks.performance = {
          status: slowRate < 0.1 ? 'ok' : 'warning',
          slowRate: (slowRate * 100).toFixed(2) + '%',
          avgDuration: perfStats.avgDuration
        };

        // Verifica índices
        var queryStats = QueryOptimizer.getStats();
        health.checks.indices = {
          status: 'ok',
          count: queryStats.indices,
          suggestions: queryStats.suggestions.length
        };

        // Status geral
        var warnings = Object.keys(health.checks).filter(function(key) {
          return health.checks[key].status === 'warning';
        });

        if (warnings.length > 0) {
          health.status = 'degraded';
        }

      } catch (e) {
        health.status = 'error';
        health.error = e.message;
      }

      return health;
    } catch (error) {
      Logger.log("Erro em healthCheck: " + error.message);
      throw error;
    }
  }

  /**
   * Manutenção automática
   */
  function maintenance() {
    AppLogger.log('Iniciando manutenção do sistema');

    var results = {
      cacheCleared: false,
      indicesCleaned: 0,
      rateLimiterCleaned: false
    };

    try {
      // Limpa índices antigos
      results.indicesCleaned = QueryOptimizer.cleanup(3600000); // 1 hora

      // Limpa rate limiters
      RateLimiter.cleanup();
      results.rateLimiterCleaned = true;

      // Limpa métricas antigas se necessário
      var perfStats = PerformanceMonitor.getMetrics();
      if (perfStats.operations.length > 500) {
        PerformanceMonitor.clear();
        results.metricsCleared = true;
      }

      AppLogger.log('Manutenção concluída', results);
    } catch (e) {
      AppLogger.error('Erro durante manutenção', e);
    }

    return results;
  }

  return {
    // Inicialização
    initialize: initialize,

    // CRUD otimizado
    create: create,
    read: read,
    update: update,
    delete: deleteRecord,

    // Batch operations
    batchCreate: batchCreate,
    batchUpdate: batchUpdate,

    // Busca
    search: search,

    // Métricas e monitoramento
    getMetrics: getMetrics,
    getPerformanceReport: getPerformanceReport,
    healthCheck: healthCheck,

    // Manutenção
    maintenance: maintenance,

    // Acesso direto aos módulos
    Cache: typeof AdvancedCache !== 'undefined' ? AdvancedCache : null,
    Batch: typeof BatchOperations !== 'undefined' ? BatchOperations : null,
    Query: typeof QueryOptimizer !== 'undefined' ? QueryOptimizer : null,
    Monitor: typeof PerformanceMonitor !== 'undefined' ? PerformanceMonitor : null,
    RateLimit: typeof RateLimiter !== 'undefined' ? RateLimiter : null
  };
})();

/**
 * Inicializa sistema na primeira execução
 */
function initializeOptimizedSystem() {
  return OptimizedAPI.initialize();
}

/**
 * Trigger para manutenção automática (configurar para rodar diariamente)
 */
function dailyMaintenance() {
  return OptimizedAPI.maintenance();
}
