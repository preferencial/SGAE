/**
 * @fileoverview Sistema de Métricas e Profiling Avançado
 * @version 1.0.0
 * @description Coleta métricas de performance, uso e comportamento do sistema
 * para análise e otimização.
 * 
 * FUNCIONALIDADES:
 * - Profiling de funções
 * - Métricas de latência
 * - Contadores de operações
 * - Histogramas de distribuição
 * - Exportação para análise
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-08
 */

'use strict';

const Metrics = (function() {

  // ============================================================================
  // ARMAZENAMENTO DE MÉTRICAS
  // ============================================================================

  let metrics = {
    counters: {},      // Contadores simples
    gauges: {},        // Valores instantâneos
    histograms: {},    // Distribuições
    timers: {},        // Tempos de execução
    events: []         // Eventos timestamped
  };

  let activeTimers = {};
  const MAX_EVENTS = 1000;
  const MAX_HISTOGRAM_SAMPLES = 100;

  // ============================================================================
  // CONTADORES
  // ============================================================================

  /**
   * Incrementa um contador
   * @param {string} name - Nome do contador
   * @param {number} [value=1] - Valor a incrementar
   * @param {Object} [labels] - Labels para segmentação
   */
  function increment(name, value, labels) {
    value = value || 1;
    const key = buildKey(name, labels);
    
    if (!metrics.counters[key]) {
      metrics.counters[key] = { value: 0, labels: labels || {} };
    }
    metrics.counters[key].value += value;
  }

  /**
   * Obtém valor de um contador
   * @param {string} name - Nome do contador
   * @param {Object} [labels] - Labels
   * @returns {number}
   */
  function getCounter(name, labels) {
    const key = buildKey(name, labels);
    return metrics.counters[key] ? metrics.counters[key].value : 0;
  }

  // ============================================================================
  // GAUGES (Valores Instantâneos)
  // ============================================================================

  /**
   * Define valor de um gauge
   * @param {string} name - Nome do gauge
   * @param {number} value - Valor
   * @param {Object} [labels] - Labels
   */
  function setGauge(name, value, labels) {
    const key = buildKey(name, labels);
    metrics.gauges[key] = {
      value: value,
      labels: labels || {},
      timestamp: Date.now()
    };
  }

  /**
   * Obtém valor de um gauge
   * @param {string} name - Nome do gauge
   * @param {Object} [labels] - Labels
   * @returns {number|null}
   */
  function getGauge(name, labels) {
    const key = buildKey(name, labels);
    return metrics.gauges[key] ? metrics.gauges[key].value : null;
  }

  // ============================================================================
  // HISTOGRAMAS
  // ============================================================================

  /**
   * Registra valor em um histograma
   * @param {string} name - Nome do histograma
   * @param {number} value - Valor a registrar
   * @param {Object} [labels] - Labels
   */
  function observe(name, value, labels) {
    const key = buildKey(name, labels);
    
    if (!metrics.histograms[key]) {
      metrics.histograms[key] = {
        samples: [],
        sum: 0,
        count: 0,
        min: Infinity,
        max: -Infinity,
        labels: labels || {}
      };
    }

    const h = metrics.histograms[key];
    h.samples.push(value);
    h.sum += value;
    h.count++;
    h.min = Math.min(h.min, value);
    h.max = Math.max(h.max, value);

    // Limita amostras (mantém as mais recentes)
    if (h.samples.length > MAX_HISTOGRAM_SAMPLES) {
      h.samples.shift();
    }
  }

  /**
   * Obtém estatísticas de um histograma
   * @param {string} name - Nome do histograma
   * @param {Object} [labels] - Labels
   * @returns {Object|null}
   */
  function getHistogram(name, labels) {
    const key = buildKey(name, labels);
    let h = metrics.histograms[key];
    
    // Se não encontrou com labels, tenta buscar com qualquer label que comece com o nome
    if (!h) {
      for (const k in metrics.histograms) {
        if (k === name || k.indexOf(name + '{') === 0) {
          h = metrics.histograms[k];
          break;
        }
      }
    }
    
    if (!h) return null;

    // Calcula percentis
    const sorted = h.samples.slice().sort((a, b) => a - b);
    
    return {
      count: h.count,
      sum: h.sum,
      avg: h.count > 0 ? h.sum / h.count : 0,
      min: h.min === Infinity ? 0 : h.min,
      max: h.max === -Infinity ? 0 : h.max,
      p50: percentile(sorted, 50),
      p90: percentile(sorted, 90),
      p95: percentile(sorted, 95),
      p99: percentile(sorted, 99)
    };
  }

  /**
   * Calcula percentil
   * @private
   */
  function percentile(sorted, p) {
    if (sorted.length === 0) return 0;
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  // ============================================================================
  // TIMERS (Profiling)
  // ============================================================================

  /**
   * Inicia um timer
   * @param {string} name - Nome do timer
   * @returns {string} ID do timer
   */
  function startTimer(name) {
    const id = name + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    activeTimers[id] = {
      name: name,
      start: Date.now()
    };
    return id;
  }

  /**
   * Para um timer e registra a duração
   * @param {string} timerId - ID do timer
   * @param {Object} [labels] - Labels adicionais
   * @returns {number} Duração em ms
   */
  function stopTimer(timerId, labels) {
    const timer = activeTimers[timerId];
    if (!timer) return 0;

    const duration = Date.now() - timer.start;
    delete activeTimers[timerId];

    // Registra no histograma
    observe(timer.name + '_duration_ms', duration, labels);
    
    // Incrementa contador
    increment(timer.name + '_total', 1, labels);

    return duration;
  }

  /**
   * Mede tempo de execução de uma função
   * @param {string} name - Nome da métrica
   * @param {Function} fn - Função a executar
   * @param {Object} [labels] - Labels
   * @returns {*} Resultado da função
   */
  function timeFunction(name, fn, labels) {
    const timerId = startTimer(name);
    try {
      if (typeof fn !== 'function') {
        if (typeof AppLogger !== 'undefined') {
          AppLogger.warn('Metrics.timeFunction called with non-function for ' + name, { type: typeof fn });
        } else {
          Logger.log('Metrics.timeFunction called with non-function for ' + name);
        }
        return fn; // Return the value itself if it's not a function
      }
      const result = fn();
      stopTimer(timerId, Object.assign({}, labels, { status: 'success' }));
      return result;
    } catch (e) {
      stopTimer(timerId, Object.assign({}, labels, { status: 'error' }));
      throw e;
    }
  }

  /**
   * Decorator para medir tempo de funções
   * @param {string} name - Nome da métrica
   * @param {Function} fn - Função original
   * @returns {Function} Função instrumentada
   */
  function instrument(name, fn) {
    return function() {
      const args = arguments;
      return timeFunction(name, function() {
        return fn.apply(null, args);
      });
    };
  }

  // ============================================================================
  // EVENTOS
  // ============================================================================

  /**
   * Registra um evento
   * @param {string} name - Nome do evento
   * @param {Object} [data] - Dados do evento
   */
  function recordEvent(name, data) {
    metrics.events.push({
      name: name,
      data: data || {},
      timestamp: Date.now()
    });

    // Limita eventos
    if (metrics.events.length > MAX_EVENTS) {
      metrics.events.shift();
    }
  }

  /**
   * Obtém eventos recentes
   * @param {string} [name] - Filtrar por nome
   * @param {number} [limit=100] - Limite de eventos
   * @returns {Array}
   */
  function getEvents(name, limit) {
    limit = limit || 100;
    const filtered = name ? 
      metrics.events.filter(e => e.name === name) :
      metrics.events;
    return filtered.slice(-limit);
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  /**
   * Constrói chave única com labels
   * @private
   */
  function buildKey(name, labels) {
    if (!labels || Object.keys(labels).length === 0) {
      return name;
    }
    const labelStr = Object.keys(labels).sort().map(k => k + '=' + labels[k]).join(',');
    return name + '{' + labelStr + '}';
  }

  // ============================================================================
  // EXPORTAÇÃO E RELATÓRIOS
  // ============================================================================

  /**
   * Exporta todas as métricas
   * @returns {Object}
   */
  function exportAll() {
    return {
      timestamp: new Date().toISOString(),
      counters: metrics.counters,
      gauges: metrics.gauges,
      histograms: Object.keys(metrics.histograms).reduce(function(acc, key) {
        acc[key] = getHistogram(key.split('{')[0]);
        return acc;
      }, {}),
      recentEvents: metrics.events.slice(-50)
    };
  }

  /**
   * Gera relatório de performance
   * @returns {Object}
   */
  function generatePerformanceReport() {
    const report = {
      timestamp: new Date().toISOString(),
      operations: {},
      slowest: [],
      summary: {}
    };

    // Agrupa por operação
    Object.keys(metrics.histograms).forEach(key => {
      if (key.indexOf('_duration_ms') !== -1) {
        const name = key.split('_duration_ms')[0];
        const stats = getHistogram(key.split('{')[0]);
        if (stats) {
          report.operations[name] = stats;
        }
      }
    });

    // Identifica operações mais lentas
    const ops = Object.keys(report.operations).map(name => ({
      name: name,
      p95: report.operations[name].p95
    }));
    ops.sort((a, b) => b.p95 - a.p95);
    report.slowest = ops.slice(0, 10);

    // Sumário
    let totalOps = 0;
    let totalTime = 0;
    Object.keys(report.operations).forEach(name => {
      totalOps += report.operations[name].count;
      totalTime += report.operations[name].sum;
    });

    report.summary = {
      totalOperations: totalOps,
      totalTimeMs: totalTime,
      avgTimeMs: totalOps > 0 ? Math.round(totalTime / totalOps) : 0
    };

    return report;
  }

  /**
   * Reseta todas as métricas
   */
  function reset() {
    metrics = {
      counters: {},
      gauges: {},
      histograms: {},
      timers: {},
      events: []
    };
    activeTimers = {};
  }

  // ============================================================================
  // MÉTRICAS PRÉ-DEFINIDAS DO SISTEMA
  // ============================================================================

  /**
   * Registra métricas do sistema
   */
  function recordSystemMetrics() {
    // Cota de email
    try {
      const emailQuota = MailApp.getRemainingDailyQuota();
      setGauge('email_quota_remaining', emailQuota);
    } catch (e) {
      // Métrica de email não disponível - pode ser contexto sem permissão
      if (typeof AppLogger !== 'undefined') {
        AppLogger.debug('Não foi possível obter quota de email', { error: e.message });
      }
    }

    // Uso de cache
    try {
      const cacheStats = getCacheStats();
      if (cacheStats.success) {
        setGauge('cache_entries', cacheStats.data.sheetsCached);
        setGauge('cache_hit_rate', parseFloat(cacheStats.data.hitRate));
      }
    } catch (e) {
      // Métricas de cache não disponíveis
      if (typeof AppLogger !== 'undefined') {
        AppLogger.debug('Não foi possível obter stats de cache', { error: e.message });
      }
    }

    // Quota Manager
    if (typeof QuotaManager !== 'undefined') {
      const usage = QuotaManager.getDailyUsage();
      setGauge('daily_reads', usage.reads);
      setGauge('daily_writes', usage.writes);
      setGauge('daily_executions', usage.executions);
    }
  }

  // ============================================================================
  // API PÚBLICA
  // ============================================================================

  return {
    // Contadores
    increment: increment,
    getCounter: getCounter,
    
    // Gauges
    setGauge: setGauge,
    gauge: setGauge, // Alias para compatibilidade
    getGauge: getGauge,
    
    // Histogramas
    observe: observe,
    getHistogram: getHistogram,
    
    // Timers
    startTimer: startTimer,
    stopTimer: stopTimer,
    timeFunction: timeFunction,
    timing: function(name, duration) { observe(name + '_duration_ms', duration); }, // Alias para compatibilidade
    instrument: instrument,
    
    // Eventos
    recordEvent: recordEvent,
    getEvents: getEvents,
    
    // Exportação
    exportAll: exportAll,
    generatePerformanceReport: generatePerformanceReport,
    reset: reset,
    
    // Sistema
    recordSystemMetrics: recordSystemMetrics,
    
    // Compatibilidade com PAE.Metrics
    getAll: function() {
      return {
        counters: metrics.counters,
        gauges: metrics.gauges,
        timers: Object.keys(metrics.histograms).reduce(function(acc, key) {
          if (key.indexOf('_duration_ms') !== -1) {
            var name = key.split('_duration_ms')[0];
            var h = metrics.histograms[key];
            if (h) {
              acc[name] = {
                count: h.count,
                avg: h.count > 0 ? h.sum / h.count : 0,
                min: h.min === Infinity ? 0 : h.min,
                max: h.max === -Infinity ? 0 : h.max
              };
            }
          }
          return acc;
        }, {})
      };
    }
  };
})();

// ============================================================================
// FUNÇÕES GLOBAIS DE CONVENIÊNCIA
// ============================================================================

/**
 * Mede tempo de execução de uma função
 * @param {string} name - Nome da operação
 * @param {Function} fn - Função a executar
 * @returns {*} Resultado da função
 */
function measureTime(name, fn) {
  return Metrics.timeFunction(name, fn);
}

/**
 * Registra operação bem-sucedida
 * @param {string} operation - Nome da operação
 */
function trackSuccess(operation) {
  Metrics.increment(operation + '_success');
}

/**
 * Registra operação com erro
 * @param {string} operation - Nome da operação
 * @param {string} [errorType] - Tipo do erro
 */
function trackError(operation, errorType) {
  Metrics.increment(operation + '_error', 1, { type: errorType || 'unknown' });
}
