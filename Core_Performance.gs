// ATENÇÃO : Este arquivo usa arrow functions e requer V8 runtime
// Configure em : Projeto > Configurações > Configurações do script > V8

'use strict';

/**
 * CORE_PERFORMANCE
 * Gerenciamento de Performance e Quota para Google Apps Script
 * Otimizado para limites gratuitos
 * @version 1.0.0
 * @created 2025-11-05
 */

// ==
// CONFIGURAÇÕES DE PERFORMANCE
// ==

var PERFORMANCE_SETTINGS = {
  QUOTAS : {
    MAX_EXECUTION_TIME : 360000,      // 6 minutos
    DAILY_EXECUTION_TIME : 5400000,
    MAX_CACHE_SIZE : 102400,
    MAX_PROPERTIES_SIZE : 512000,
    MAX_SPREADSHEET_CELLS : 2000000
  },
  PROCESSING : {
    BATCH_SIZE : 100,
    MAX_ROWS_PER_EXECUTION : 1000,
    TIMEOUT_BUFFER : 30000,
    MIN_DELAY : 50,
    MAX_DELAY : 200
  },
  CACHE : {
    DEFAULT_TTL : 300,
    SHORT_TTL : 60,
    LONG_TTL : 900,
    MAX_ITEMS : 50
  }
};

// ==
// GERENCIADOR DE TEMPO DE EXECUÇÃO
// ==

var ExecutionTimer = {
  startTime : null,
  checkpoints : [],
  start: function() { this.startTime = new Date().getTime(); this.checkpoints = []; },
  checkpoint: function(label) {
    try {
      if (!this.startTime) this.start();
      var now = new Date().getTime();
      this.checkpoints.push({ label : label, timestamp : now, elapsed : now - this.startTime });
    } catch (error) {
      Logger.log("Erro em checkpoint: " + error.message);
      throw error;
    }
  },
  hasTimeRemaining: function(bufferMs) {
    if (!this.startTime) return true;
    bufferMs = bufferMs || PERFORMANCE_SETTINGS.PROCESSING.TIMEOUT_BUFFER;
    var elapsed = new Date().getTime() - this.startTime;
    return elapsed + bufferMs < PERFORMANCE_SETTINGS.QUOTAS.MAX_EXECUTION_TIME;
  },
  getElapsed: function() { return this.startTime ? (new Date().getTime() - this.startTime) : 0; },
  getRemaining: function() { return PERFORMANCE_SETTINGS.QUOTAS.MAX_EXECUTION_TIME - this.getElapsed(); },
  getReport: function() { return { startTime : this.startTime, elapsed : this.getElapsed(), remaining : this.getRemaining(), checkpoints : this.checkpoints }; },
  reset: function() { this.startTime = null; this.checkpoints = []; }
};

// ==
// CACHE DE DOIS NÍVEIS
// ==

var SmartCache = {
  get: function(key, options) {
    options = options || {};
    try {
      var cache = CacheService.getScriptCache();
      var cached = cache.get(key);
      if (cached) return JSON.parse(cached);
    } catch (e) {
      Logger.log('Erro ao obter cache : ' + e.message);
    }
    if (options.useProperties != false) {
      try {
        var props = PropertiesService.getScriptProperties();
        var stored = props.getProperty('cache_' + key);
        if (stored) {
          var data = JSON.parse(stored);
          if (!data.expires || data.expires > new Date().getTime()) {
            this.set(key, data.value, { ttl : (options.ttl || PERFORMANCE_SETTINGS.CACHE.DEFAULT_TTL), skipProperties : true });
            return data.value;
          }
        }
      } catch (e) {
        Logger.log('Erro ao obter propriedade : ' + e.message);
      }
    }
    return null;
  },
  set: function(key, value, options) {
    try {
      options = options || {};
      var ttl = options.ttl || PERFORMANCE_SETTINGS.CACHE.DEFAULT_TTL;
      try {
        var cache = CacheService.getScriptCache();
        var serialized = JSON.stringify(value);
        if (serialized.length < PERFORMANCE_SETTINGS.QUOTAS.MAX_CACHE_SIZE) cache.put(key, serialized, ttl);
      } catch (e) {
        Logger.log('Erro ao definir cache : ' + e.message);
      }
      if (options.useProperties != false && !options.skipProperties) {
        try {
          var props = PropertiesService.getScriptProperties();
          var data = { value : value, expires : new Date().getTime() + (ttl * 1000) };
          props.setProperty('cache_' + key, JSON.stringify(data));
        } catch (e) {
          Logger.log('Erro ao definir propriedade : ' + e.message);
        }
      }
    } catch (error) {
      Logger.log("Erro em set: " + error.message);
      throw error;
    }
  },
  remove: function(key) {
    try {
      CacheService.getScriptCache().remove(key);
    } catch (e) {
      Logger.log('Erro ao remover cache : ' + e.message);
    }
    try {
      PropertiesService.getScriptProperties().deleteProperty('cache_' + key);
    } catch (e) {
      Logger.log('Erro ao remover propriedade : ' + e.message);
    }
  },
  clear: function() {
    try {
      try {
        CacheService.getScriptCache().removeAll([]);
      } catch (e) {
        Logger.log('Erro ao limpar cache : ' + e.message);
      }
      try {
        var props = PropertiesService.getScriptProperties();
        props.getKeys().forEach(k => {
          if (k.indexOf('cache_') == 0) props.deleteProperty(k);
        });
      } catch (e) {
        Logger.log('Erro ao limpar propriedades : ' + e.message);
      }
    } catch (error) {
      Logger.log("Erro em clear: " + error.message);
      throw error;
    }
  },
  _getPropertiesSize: function() {
    try { var props = PropertiesService.getScriptProperties(); var all = props.getProperties(); return JSON.stringify(all).length; } catch (e) { return 0; }
  },
  getStats: function() { var size = this._getPropertiesSize(); return { propertiesSize : size, propertiesLimit : PERFORMANCE_SETTINGS.QUOTAS.MAX_PROPERTIES_SIZE, propertiesUsage : Math.round((size / PERFORMANCE_SETTINGS.QUOTAS.MAX_PROPERTIES_SIZE) * 100) }; }
};

// ==
// PROCESSADOR EM LOTES OTIMIZADO
// ==

var BatchProcessor = {
  process: function(data, processFn, options) {
    try {
      options = options || {};
      var batchSize = options.batchSize || PERFORMANCE_SETTINGS.PROCESSING.BATCH_SIZE;
      var onProgress = options.onProgress || function() {};
      var minDelay = options.minDelay || PERFORMANCE_SETTINGS.PROCESSING.MIN_DELAY;
      ExecutionTimer.start();
      var results = []; var errors = []; var processed = 0;
      for (var i = 0; i < data.length; i += batchSize) {
        if (!ExecutionTimer.hasTimeRemaining()) { Logger.log('BatchProcessor : timeout preventivo em ' + processed + '/' + data.length); break; }
        var batch = data.slice(i, Math.min(i + batchSize, data.length));
        try {
          var batchResults = processFn(batch, i);
          if (batchResults) Array.prototype.push.apply(results, batchResults);
          processed += batch.length;
        } catch (e) {
          errors.push({ batch : i / batchSize, error : e.message });
        }
        onProgress({ processed : processed, total : data.length, percentage : Math.round((processed / data.length) * 100) });
        if (i + batchSize < data.length && minDelay > 0) Utilities.sleep(minDelay);
      }
      return { success : errors.length == 0, processed : processed, total : data.length, results : results, errors : errors, elapsed : ExecutionTimer.getElapsed() };
    } catch (error) {
      Logger.log("Erro em process: " + error.message);
      throw error;
    }
  }
};

// ==
// OTIMIZADOR DE DELAYS
// ==

var SmartDelay = {
  wait: function(ms, options) {
    options = options || {};
    var force = options.force == true;
    var actualDelay = Math.min(ms, PERFORMANCE_SETTINGS.PROCESSING.MAX_DELAY);
    if (!force && !ExecutionTimer.hasTimeRemaining(60000)) { Logger.log('SmartDelay : pulando delay de ' + ms + 'ms (pouco tempo restante)'); return; }
    Utilities.sleep(actualDelay);
  },
  adaptive: function(baseMs) {
    var remaining = ExecutionTimer.getRemaining();
    var maxTime = PERFORMANCE_SETTINGS.QUOTAS.MAX_EXECUTION_TIME;
    var ratio = Math.max(0, Math.min(1, remaining / maxTime));
    var reducedDelay = Math.round(baseMs * ratio);
    Utilities.sleep(reducedDelay);
  }
};

// ==
// FUNÇÕES PÚBLICAS
// ==

/**
 * Inicia monitoramento de performance
 */
function startPerformanceMonitoring() { ExecutionTimer.start(); Logger.log('Performance monitoring iniciado'); }

/**
 * Obtém relatório de performance
 */
function getPerformanceReport() { return { execution : ExecutionTimer.getReport(), cache : SmartCache.getStats(), quotas : PERFORMANCE_SETTINGS.QUOTAS }; }

/**
 * Limpa cache e otimiza properties
 */
function optimizeStorage() {
  try {
    try {
      SmartCache.clear();
      try {
        var props = PropertiesService.getScriptProperties();
        var keys = props.getKeys();
        keys.forEach(k => {
          if (k.indexOf('cache_') == 0) {
            try {
              var data = JSON.parse(props.getProperty(k));
              if (data.expires && data.expires < new Date().getTime()) {
                props.deleteProperty(k);
              }
            } catch (parseError) {
              // Propriedade com formato inválido - remove para limpeza
              Logger.log('⚠️ Removendo propriedade inválida: ' + k);
              try { props.deleteProperty(k); } catch (delError) { /* ignora erro de deleção */ }
            }
          }
        });
      } catch (e) {
        Logger.log('⚠️ Erro na otimização de storage: ' + e.message);
      }
      Logger.log('Otimização concluída');
    } catch (error) {
      Logger.log("Erro em optimizeStorage: " + error.message);
      throw error; // Re-lança para tratamento superior
    }
  } catch (error) {
    Logger.log("Erro em optimizeStorage: " + error.message);
    throw error;
  }
}


/**
 * Testa performance do sistema
 */
function testPerformance() {
  try {
    Logger.log('== TESTE DE PERFORMANCE ==');

    startPerformanceMonitoring();

    // Teste 1 : Cache
    Logger.log('\n1. Teste de Cache');
    var testData = { test : 'data', timestamp : new Date() };

    SmartCache.set('test_key', testData);
    ExecutionTimer.checkpoint('Cache write');

    var retrieved = SmartCache.get('test_key');
    ExecutionTimer.checkpoint('Cache read');

    Logger.log('Cache funcionando : ' + (retrieved != null));

    // Teste 2 : Batch Processing
    Logger.log('\n2. Teste de Processamento em Lotes');
    var testArray = [];
    for (var i = 0; i < 500; i++) {
      testArray.push({ id : i, value : 'test_' + i });
    }

    var result = BatchProcessor.process(testArray, function(batch) {
      return batch.map(function(item) {
        return item.id * 2;
      });
    });

    ExecutionTimer.checkpoint('Batch processing');
    Logger.log('Processados : ' + result.processed + '/' + result.total);

    // Teste 3 : Smart Delay
    Logger.log('\n3. Teste de Smart Delay');
    SmartDelay.wait(100, { reason : 'test' });
    ExecutionTimer.checkpoint('Smart delay');

    // Relatório final
    var report = getPerformanceReport();
    Logger.log('\n== RELATÓRIO FINAL ==');
    Logger.log('Tempo total : ' + report.execution.elapsed + 'ms');
    Logger.log('Tempo restante : ' + report.execution.remaining + 'ms');
    Logger.log('Properties usage : ' + report.cache.propertiesUsage + '%');
    Logger.log('Checkpoints : ' + report.execution.checkpoints.length);

  } catch (error) {
    Logger.log("Erro em testPerformance: " + error.message);
    throw error;
  }
}
