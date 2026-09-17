/**
 * @fileoverview Monitor de Performance em Tempo Real
 * @version 2.0.0
 * @description Sistema de monitoramento com métricas, alertas e análise de gargalos
 */

'use strict';

var PerformanceMonitor = (function() {

  var metrics = {
    operations: [],
    alerts: [],
    thresholds: {
      slowQuery: 1000,      // 1 segundo
      highMemory: 50000000, // 50MB
      quotaWarning: 0.8     // 80% da quota
    }
  };

  var activeOperations = {};

  /**
   * Inicia monitoramento de operação
   */
  function startOperation(operationId, metadata) {
    activeOperations[operationId] = {
      id: operationId,
      startTime: Date.now(),
      startMemory: getMemoryUsage(),
      metadata: metadata || {}
    };
    return operationId;
  }

  /**
   * Finaliza monitoramento de operação
   */
  function endOperation(operationId, result) {
    try {
      if (!activeOperations[operationId]) {
        AppLogger.warn('Operação não encontrada: ' + operationId);
        return null;
      }

      var op = activeOperations[operationId];
      var endTime = Date.now();
      var duration = endTime - op.startTime;
      var memoryDelta = getMemoryUsage() - op.startMemory;

      var metric = {
        id: operationId,
        duration: duration,
        memoryDelta: memoryDelta,
        timestamp: endTime,
        metadata: op.metadata,
        result: result,
        slow: duration > metrics.thresholds.slowQuery
      };

      metrics.operations.push(metric);
      delete activeOperations[operationId];

      // Mantém apenas últimas 1000 operações
      if (metrics.operations.length > 1000) {
        metrics.operations.shift();
      }

      // Verifica alertas
      checkThresholds(metric);

      return metric;
    } catch (error) {
      Logger.log("Erro em endOperation: " + error.message);
      throw error;
    }
  }

  /**
   * Obtém uso de memória aproximado
   */
  function getMemoryUsage() {
    try {
      try {
        // Apps Script não tem API direta, estimamos pelo cache
        return JSON.stringify(metrics).length;
      } catch (e) {
        return 0;
      }
    } catch (error) {
      Logger.log("Erro em getMemoryUsage: " + error.message);
      throw error;
    }
  }

  /**
   * Verifica thresholds e gera alertas
   */
  function checkThresholds(metric) {
    if (metric.duration > metrics.thresholds.slowQuery) {
      createAlert('SLOW_QUERY', 'Operação lenta detectada', {
        operationId: metric.id,
        duration: metric.duration,
        metadata: metric.metadata
      });
    }

    if (metric.memoryDelta > metrics.thresholds.highMemory) {
      createAlert('HIGH_MEMORY', 'Alto uso de memória', {
        operationId: metric.id,
        memoryDelta: metric.memoryDelta
      });
    }
  }

  /**
   * Cria alerta
   */
  function createAlert(type, message, details) {
    try {
      var alert = {
        type: type,
        message: message,
        details: details,
        timestamp: Date.now()
      };

      metrics.alerts.push(alert);
      AppLogger.warn('Performance Alert: ' + type + ' - ' + message, details);

      // Mantém apenas últimos 100 alertas
      if (metrics.alerts.length > 100) {
        metrics.alerts.shift();
      }
    } catch (error) {
      Logger.log("Erro em createAlert: " + error.message);
      throw error;
    }
  }

  /**
   * Analisa gargalos
   */
  function analyzeBottlenecks() {
    try {
      if (metrics.operations.length === 0) {
        return { message: 'Sem dados suficientes' };
      }

      var analysis = {
        totalOperations: metrics.operations.length,
        slowOperations: 0,
        avgDuration: 0,
        maxDuration: 0,
        bottlenecks: []
      };

      var totalDuration = 0;
      var operationsByType = {};

      metrics.operations.forEach(function(op) {
        totalDuration += op.duration;

        if (op.duration > analysis.maxDuration) {
          analysis.maxDuration = op.duration;
        }

        if (op.slow) {
          analysis.slowOperations++;
        }

        var type = op.metadata.type || 'unknown';
        if (!operationsByType[type]) {
          operationsByType[type] = {
            count: 0,
            totalDuration: 0,
            avgDuration: 0
          };
        }
        operationsByType[type].count++;
        operationsByType[type].totalDuration += op.duration;
      });

      analysis.avgDuration = totalDuration / metrics.operations.length;

      // Calcula médias por tipo
      Object.keys(operationsByType).forEach(function(type) {
        var stats = operationsByType[type];
        stats.avgDuration = stats.totalDuration / stats.count;

        if (stats.avgDuration > metrics.thresholds.slowQuery) {
          analysis.bottlenecks.push({
            type: type,
            avgDuration: stats.avgDuration,
            count: stats.count,
            severity: stats.avgDuration > metrics.thresholds.slowQuery * 2 ? 'high' : 'medium'
          });
        }
      });

      // Ordena gargalos por severidade
      analysis.bottlenecks.sort(function(a, b) {
        return b.avgDuration - a.avgDuration;
      });

      return analysis;
    } catch (error) {
      Logger.log("Erro em analyzeBottlenecks: " + error.message);
      throw error;
    }
  }

  /**
   * Gera relatório de performance
   */
  function generateReport() {
    try {
      var analysis = analyzeBottlenecks();
    
      // Obter stats de cache com fallback
      var cacheStats = { hitRate: '0%', hits: 0, misses: 0 };
      try {
        if (typeof AdvancedCache !== 'undefined' && typeof AdvancedCache.getStats === 'function') {
          cacheStats = AdvancedCache.getStats() || cacheStats;
        }
      } catch (e) {
        // Usar fallback
      }
    
      // Obter stats de query com fallback
      var queryStats = { indices: 0, suggestions: [] };
      try {
        if (typeof QueryOptimizer !== 'undefined' && typeof QueryOptimizer.getStats === 'function') {
          queryStats = QueryOptimizer.getStats() || queryStats;
        }
      } catch (e) {
        // Usar fallback
      }

      // Garantir que avgDuration e maxDuration são números válidos
      var avgDuration = typeof analysis.avgDuration === 'number' && !isNaN(analysis.avgDuration) 
        ? analysis.avgDuration.toFixed(2) 
        : '0.00';
      var maxDuration = typeof analysis.maxDuration === 'number' && !isNaN(analysis.maxDuration)
        ? analysis.maxDuration
        : 0;

      return {
        timestamp: new Date(),
        operations: {
          total: analysis.totalOperations || 0,
          slow: analysis.slowOperations || 0,
          avgDuration: avgDuration + 'ms',
          maxDuration: maxDuration + 'ms'
        },
        cache: cacheStats,
        queries: {
          totalIndices: queryStats.indices || 0,
          suggestions: queryStats.suggestions || []
        },
        bottlenecks: analysis.bottlenecks || [],
        alerts: {
          total: metrics.alerts.length,
          recent: metrics.alerts.slice(-10)
        },
        recommendations: generateRecommendations(analysis, cacheStats, queryStats)
      };
    } catch (error) {
      Logger.log("Erro em generateReport: " + error.message);
      throw error;
    }
  }

  /**
   * Gera recomendações de otimização
   */
  function generateRecommendations(analysis, cacheStats, queryStats) {
    try {
      var recommendations = [];

      // Garantir que cacheStats e queryStats existem
      cacheStats = cacheStats || { hitRate: '0%' };
      queryStats = queryStats || { suggestions: [] };
      analysis = analysis || { slowOperations: 0, totalOperations: 0, bottlenecks: [] };

      // Cache
      var hitRateStr = String(cacheStats.hitRate || '0%').replace('%', '');
      var hitRate = parseFloat(hitRateStr) || 0;
      if (hitRate < 50) {
        recommendations.push({
          priority: 'high',
          category: 'cache',
          message: 'Taxa de acerto do cache baixa (' + (cacheStats.hitRate || '0%') + '). Considere aumentar TTL ou revisar estratégia de cache.'
        });
      }

      // Queries
      var suggestions = queryStats.suggestions || [];
      if (suggestions.length > 0) {
        recommendations.push({
          priority: 'medium',
          category: 'queries',
          message: 'Criar índices pode melhorar performance em ' + suggestions.length + ' planilhas.'
        });
      }

      // Operações lentas
      var slowOps = analysis.slowOperations || 0;
      var totalOps = analysis.totalOperations || 1;
      if (slowOps > totalOps * 0.1) {
        recommendations.push({
          priority: 'high',
          category: 'performance',
          message: 'Alto número de operações lentas (' + slowOps + '). Revisar gargalos.'
        });
      }

      // Gargalos específicos
      var bottlenecks = analysis.bottlenecks || [];
      bottlenecks.forEach(function(bottleneck) {
        if (bottleneck && bottleneck.severity === 'high') {
          var avgDur = typeof bottleneck.avgDuration === 'number' ? bottleneck.avgDuration.toFixed(2) : '0.00';
          recommendations.push({
            priority: 'high',
            category: 'bottleneck',
            message: 'Gargalo crítico em ' + (bottleneck.type || 'desconhecido') + ' (média: ' + avgDur + 'ms)'
          });
        }
      });

      return recommendations;
    } catch (error) {
      Logger.log("Erro em generateRecommendations: " + error.message);
      throw error;
    }
  }

  return {
    /**
     * Inicia monitoramento
     */
    start: function(operationName, metadata) {
      var operationId = operationName + '_' + Date.now();
      return startOperation(operationId, metadata);
    },

    /**
     * Finaliza monitoramento
     */
    end: function(operationId, result) {
      return endOperation(operationId, result);
    },

    /**
     * Wrapper para monitorar função
     */
    monitor: function(operationName, fn, metadata) {
      var operationId = this.start(operationName, metadata);
      try {
        var result = fn();
        this.end(operationId, { success: true });
        return result;
      } catch (e) {
        this.end(operationId, { success: false, error: e.message });
        throw e;
      }
    },

    /**
     * Obtém métricas
     */
    getMetrics: function() {
      return {
        operations: metrics.operations.slice(-100),
        alerts: metrics.alerts,
        active: Object.keys(activeOperations).length
      };
    },

    /**
     * Analisa gargalos
     */
    analyzeBottlenecks: analyzeBottlenecks,

    /**
     * Gera relatório completo
     */
    report: generateReport,

    /**
     * Configura thresholds
     */
    setThresholds: function(thresholds) {
      try {
        Object.assign(metrics.thresholds, thresholds);
      } catch (error) {
        Logger.log("Erro em setThresholds: " + error.message);
        throw error;
      }
    },

    /**
     * Limpa métricas antigas
     */
    clear: function() {
      metrics.operations = [];
      metrics.alerts = [];
      activeOperations = {};
      AppLogger.log('Métricas de performance limpas');
    },

    /**
     * Dashboard de performance
     */
    dashboard: function() {
      try {
        var report = generateReport();

        var html = '<h2>Performance Dashboard</h2>';
        html += '<h3>Operações</h3>';
        html += '<ul>';
        html += '<li>Total: ' + report.operations.total + '</li>';
        html += '<li>Lentas: ' + report.operations.slow + '</li>';
        html += '<li>Duração Média: ' + report.operations.avgDuration + '</li>';
        html += '<li>Duração Máxima: ' + report.operations.maxDuration + '</li>';
        html += '</ul>';

        html += '<h3>Cache</h3>';
        html += '<ul>';
        html += '<li>Taxa de Acerto: ' + report.cache.hitRate + '</li>';
        html += '<li>Hits: ' + report.cache.hits + '</li>';
        html += '<li>Misses: ' + report.cache.misses + '</li>';
        html += '</ul>';

        html += '<h3>Recomendações</h3>';
        html += '<ul>';
        report.recommendations.forEach(function(rec) {
          html += '<li><strong>' + rec.priority.toUpperCase() + '</strong>: ' + rec.message + '</li>';
        });
        html += '</ul>';

        return html;
      } catch (error) {
        Logger.log("Erro em dashboard: " + error.message);
        throw error;
      }
    }
  };
})();
