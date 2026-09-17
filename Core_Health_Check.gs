/**
 * @fileoverview Sistema de Health Check e Monitoramento
 * @version 1.0.0
 * @description Verifica saúde do sistema e seus componentes
 * 
 * INTERVENÇÃO 15/16: Health Check e Monitoramento
 * - Verificação de componentes do sistema
 * - Status de planilhas e serviços
 * - Métricas de performance
 * - Alertas automáticos
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-26
 */

'use strict';

var HealthCheck = (function() {
  
  // =========================================================================
  // CONFIGURAÇÃO
  // =========================================================================
  
  var CONFIG = {
    TIMEOUT_MS: 5000,
    CRITICAL_THRESHOLD: 0.5,  // 50% de falhas = crítico
    WARNING_THRESHOLD: 0.2    // 20% de falhas = warning
  };
  
  // Status possíveis
  var STATUS = {
    HEALTHY: 'HEALTHY',
    DEGRADED: 'DEGRADED',
    UNHEALTHY: 'UNHEALTHY',
    UNKNOWN: 'UNKNOWN'
  };
  
  // =========================================================================
  // CHECKS INDIVIDUAIS
  // =========================================================================
  
  /**
   * Verifica acesso à planilha
   */
  function checkSpreadsheet() {
    var start = Date.now();
    
    try {
      var ss = getSS();
      if (!ss) {
        return {
          name: 'Spreadsheet',
          status: STATUS.UNHEALTHY,
          message: 'Planilha não encontrada',
          duration: Date.now() - start
        };
      }
      
      var name = ss.getName();
      var sheets = ss.getSheets().length;
      
      return {
        name: 'Spreadsheet',
        status: STATUS.HEALTHY,
        message: 'OK - ' + sheets + ' abas',
        details: { name: name, sheets: sheets },
        duration: Date.now() - start
      };
      
    } catch (e) {
      return {
        name: 'Spreadsheet',
        status: STATUS.UNHEALTHY,
        message: 'Erro: ' + e.message,
        duration: Date.now() - start
      };
    }
  }
  
  /**
   * Verifica abas críticas do sistema
   */
  function checkCriticalSheets() {
    var start = Date.now();
    var criticalSheets = ['Usuarios', 'Notas_Fiscais', 'Configuracoes'];
    var missing = [];
    var found = [];
    
    try {
      var ss = getSS();
      if (!ss) {
        return {
          name: 'Critical Sheets',
          status: STATUS.UNHEALTHY,
          message: 'Planilha não acessível',
          duration: Date.now() - start
        };
      }
      
      criticalSheets.forEach(function(sheetName) {
        var sheet = ss.getSheetByName(sheetName);
        if (sheet) {
          found.push(sheetName);
        } else {
          missing.push(sheetName);
        }
      });
      
      var status = missing.length === 0 ? STATUS.HEALTHY :
                   missing.length < criticalSheets.length ? STATUS.DEGRADED :
                   STATUS.UNHEALTHY;
      
      return {
        name: 'Critical Sheets',
        status: status,
        message: found.length + '/' + criticalSheets.length + ' abas encontradas',
        details: { found: found, missing: missing },
        duration: Date.now() - start
      };
      
    } catch (e) {
      return {
        name: 'Critical Sheets',
        status: STATUS.UNHEALTHY,
        message: 'Erro: ' + e.message,
        duration: Date.now() - start
      };
    }
  }
  
  /**
   * Verifica PropertiesService
   */
  function checkProperties() {
    try {
      var start = Date.now();
    
      try {
        var props = PropertiesService.getScriptProperties();
        var all = props.getProperties();
        var count = Object.keys(all).length;
      
        return {
          name: 'Properties Service',
          status: STATUS.HEALTHY,
          message: 'OK - ' + count + ' propriedades',
          details: { count: count },
          duration: Date.now() - start
        };
      
      } catch (e) {
        return {
          name: 'Properties Service',
          status: STATUS.UNHEALTHY,
          message: 'Erro: ' + e.message,
          duration: Date.now() - start
        };
      }
    } catch (error) {
      Logger.log("Erro em checkProperties: " + error.message);
      throw error;
    }
  }
  
  /**
   * Verifica CacheService
   */
  function checkCache() {
    try {
      var start = Date.now();
    
      try {
        var cache = CacheService.getScriptCache();
        var testKey = '_health_check_' + Date.now();
        var testValue = 'test';
      
        cache.put(testKey, testValue, 10);
        var retrieved = cache.get(testKey);
        cache.remove(testKey);
      
        if (retrieved === testValue) {
          return {
            name: 'Cache Service',
            status: STATUS.HEALTHY,
            message: 'OK - Read/Write funcionando',
            duration: Date.now() - start
          };
        } else {
          return {
            name: 'Cache Service',
            status: STATUS.DEGRADED,
            message: 'Cache inconsistente',
            duration: Date.now() - start
          };
        }
      
      } catch (e) {
        return {
          name: 'Cache Service',
          status: STATUS.UNHEALTHY,
          message: 'Erro: ' + e.message,
          duration: Date.now() - start
        };
      }
    } catch (error) {
      Logger.log("Erro em checkCache: " + error.message);
      throw error;
    }
  }
  
  /**
   * Verifica Session
   */
  function checkSession() {
    try {
      var start = Date.now();
    
      try {
        var user = Session.getActiveUser();
        var email = user.getEmail();
      
        return {
          name: 'Session',
          status: STATUS.HEALTHY,
          message: email ? 'Usuário: ' + email : 'Sessão anônima',
          details: { email: email || 'anonymous' },
          duration: Date.now() - start
        };
      
      } catch (e) {
        return {
          name: 'Session',
          status: STATUS.DEGRADED,
          message: 'Sessão limitada: ' + e.message,
          duration: Date.now() - start
        };
      }
    } catch (error) {
      Logger.log("Erro em checkSession: " + error.message);
      throw error;
    }
  }
  
  /**
   * Verifica módulos core
   */
  function checkCoreModules() {
    try {
      var start = Date.now();
      var modules = [
        { name: 'DataCache', obj: typeof DataCache },
        { name: 'BatchOperations', obj: typeof BatchOperations },
        { name: 'ConfigManager', obj: typeof ConfigManager },
        { name: 'ServiceLocator', obj: typeof ServiceLocator },
        { name: 'AuditService', obj: typeof AuditService },
        { name: 'RetryStrategy', obj: typeof RetryStrategy }
      ];
    
      var loaded = [];
      var missing = [];
    
      modules.forEach(function(m) {
        if (m.obj !== 'undefined') {
          loaded.push(m.name);
        } else {
          missing.push(m.name);
        }
      });
    
      var status = missing.length === 0 ? STATUS.HEALTHY :
                   missing.length <= 2 ? STATUS.DEGRADED :
                   STATUS.UNHEALTHY;
    
      return {
        name: 'Core Modules',
        status: status,
        message: loaded.length + '/' + modules.length + ' módulos carregados',
        details: { loaded: loaded, missing: missing },
        duration: Date.now() - start
      };
    } catch (error) {
      Logger.log("Erro em checkCoreModules: " + error.message);
      throw error;
    }
  }
  
  /**
   * Verifica quota de execução
   */
  function checkQuota() {
    var start = Date.now();
    
    try {
      // Verifica tempo restante aproximado
      var remainingTime = 360000; // 6 minutos padrão
      
      if (typeof QuotaManager !== 'undefined' && QuotaManager.getRemainingTime) {
        remainingTime = QuotaManager.getRemainingTime();
      }
      
      var status = remainingTime > 60000 ? STATUS.HEALTHY :
                   remainingTime > 30000 ? STATUS.DEGRADED :
                   STATUS.UNHEALTHY;
      
      return {
        name: 'Execution Quota',
        status: status,
        message: 'Tempo restante: ~' + Math.round(remainingTime / 1000) + 's',
        details: { remainingMs: remainingTime },
        duration: Date.now() - start
      };
      
    } catch (e) {
      return {
        name: 'Execution Quota',
        status: STATUS.UNKNOWN,
        message: 'Não foi possível verificar',
        duration: Date.now() - start
      };
    }
  }
  
  /**
   * Verifica memória (aproximado)
   */
  function checkMemory() {
    try {
      var start = Date.now();
    
      try {
        // Tenta alocar array para testar memória
        var testArray = [];
        for (var i = 0; i < 10000; i++) {
          testArray.push({ index: i, data: 'test' });
        }
        testArray = null; // Libera
      
        return {
          name: 'Memory',
          status: STATUS.HEALTHY,
          message: 'OK - Alocação funcionando',
          duration: Date.now() - start
        };
      
      } catch (e) {
        return {
          name: 'Memory',
          status: STATUS.UNHEALTHY,
          message: 'Erro de memória: ' + e.message,
          duration: Date.now() - start
        };
      }
    } catch (error) {
      Logger.log("Erro em checkMemory: " + error.message);
      throw error;
    }
  }
  
  // =========================================================================
  // API PÚBLICA
  // =========================================================================
  
  return {
    
    STATUS: STATUS,
    
    /**
     * Executa todos os health checks
     * @returns {Object} Resultado completo
     */
    runAll: function() {
      try {
        var startTime = Date.now();
      
        var checks = [
          checkSpreadsheet(),
          checkCriticalSheets(),
          checkProperties(),
          checkCache(),
          checkSession(),
          checkCoreModules(),
          checkQuota(),
          checkMemory()
        ];
      
        // Calcula status geral
        var healthy = 0;
        var degraded = 0;
        var unhealthy = 0;
      
        checks.forEach(function(c) {
          if (c.status === STATUS.HEALTHY) healthy++;
          else if (c.status === STATUS.DEGRADED) degraded++;
          else if (c.status === STATUS.UNHEALTHY) unhealthy++;
        });
      
        var total = checks.length;
        var failureRate = (unhealthy + degraded * 0.5) / total;
      
        var overallStatus = failureRate >= CONFIG.CRITICAL_THRESHOLD ? STATUS.UNHEALTHY :
                            failureRate >= CONFIG.WARNING_THRESHOLD ? STATUS.DEGRADED :
                            STATUS.HEALTHY;
      
        return {
          status: overallStatus,
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime,
          summary: {
            healthy: healthy,
            degraded: degraded,
            unhealthy: unhealthy,
            total: total
          },
          checks: checks
        };
      } catch (error) {
        Logger.log("Erro em runAll: " + error.message);
        throw error;
      }
    },
    
    /**
     * Executa check rápido (apenas críticos)
     * @returns {Object}
     */
    runQuick: function() {
      try {
        var startTime = Date.now();
      
        var checks = [
          checkSpreadsheet(),
          checkCriticalSheets()
        ];
      
        var allHealthy = checks.every(function(c) {
          return c.status === STATUS.HEALTHY;
        });
      
        return {
          status: allHealthy ? STATUS.HEALTHY : STATUS.UNHEALTHY,
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime,
          checks: checks
        };
      } catch (error) {
        Logger.log("Erro em runQuick: " + error.message);
        throw error;
      }
    },
    
    /**
     * Verifica componente específico
     * @param {string} component - Nome do componente
     * @returns {Object}
     */
    check: function(component) {
      var checkMap = {
        'spreadsheet': checkSpreadsheet,
        'sheets': checkCriticalSheets,
        'properties': checkProperties,
        'cache': checkCache,
        'session': checkSession,
        'modules': checkCoreModules,
        'quota': checkQuota,
        'memory': checkMemory
      };
      
      var checkFn = checkMap[component.toLowerCase()];
      if (!checkFn) {
        return {
          name: component,
          status: STATUS.UNKNOWN,
          message: 'Componente desconhecido'
        };
      }
      
      return checkFn();
    },
    
    /**
     * Retorna status formatado para log
     * @returns {string}
     */
    getStatusReport: function() {
      try {
        var result = this.runAll();
        var lines = [];
      
        lines.push('═══════════════════════════════════════════════');
        lines.push('  HEALTH CHECK - ' + result.timestamp);
        lines.push('═══════════════════════════════════════════════');
        lines.push('  Status Geral: ' + result.status);
        lines.push('  Duração: ' + result.duration + 'ms');
        lines.push('───────────────────────────────────────────────');
      
        result.checks.forEach(function(c) {
          var icon = c.status === STATUS.HEALTHY ? '✅' :
                     c.status === STATUS.DEGRADED ? '⚠️' :
                     c.status === STATUS.UNHEALTHY ? '❌' : '❓';
          lines.push('  ' + icon + ' ' + c.name + ': ' + c.message);
        });
      
        lines.push('───────────────────────────────────────────────');
        lines.push('  Resumo: ' + result.summary.healthy + ' OK, ' +
                   result.summary.degraded + ' degradados, ' +
                   result.summary.unhealthy + ' falhas');
        lines.push('═══════════════════════════════════════════════');
      
        return lines.join('\n');
      } catch (error) {
        Logger.log("Erro em getStatusReport: " + error.message);
        throw error;
      }
    },
    
    /**
     * Verifica se sistema está saudável
     * @returns {boolean}
     */
    isHealthy: function() {
      var result = this.runQuick();
      return result.status === STATUS.HEALTHY;
    }
  };
})();

// ============================================================================
// SISTEMA DE ALERTAS
// ============================================================================

var SystemAlerts = (function() {
  
  var _alerts = [];
  var _maxAlerts = 100;
  
  return {
    
    /**
     * Adiciona alerta
     * @param {string} type - Tipo (INFO, WARNING, ERROR, CRITICAL)
     * @param {string} message - Mensagem
     * @param {Object} [details] - Detalhes adicionais
     */
    add: function(type, message, details) {
      try {
        var alert = {
          id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
          type: type,
          message: message,
          details: details || {},
          timestamp: new Date().toISOString(),
          acknowledged: false
        };
      
        _alerts.unshift(alert);
      
        // Limita tamanho
        if (_alerts.length > _maxAlerts) {
          _alerts = _alerts.slice(0, _maxAlerts);
        }
      
        // Log
        Logger.log('[ALERT:' + type + '] ' + message);
      
        // Emite evento se EventBus disponível
        if (typeof EventBus !== 'undefined') {
          EventBus.emit('system.alert', alert);
        }
      
        return alert.id;
      } catch (error) {
        Logger.log("Erro em add: " + error.message);
        throw error;
      }
    },
    
    /**
     * Adiciona alerta de erro
     */
    error: function(message, details) {
      return this.add('ERROR', message, details);
    },
    
    /**
     * Adiciona alerta de warning
     */
    warning: function(message, details) {
      return this.add('WARNING', message, details);
    },
    
    /**
     * Adiciona alerta crítico
     */
    critical: function(message, details) {
      return this.add('CRITICAL', message, details);
    },
    
    /**
     * Adiciona alerta informativo
     */
    info: function(message, details) {
      return this.add('INFO', message, details);
    },
    
    /**
     * Obtém alertas
     * @param {Object} [filters] - Filtros
     * @returns {Array}
     */
    get: function(filters) {
      try {
        filters = filters || {};
      
        var result = _alerts;
      
        if (filters.type) {
          result = result.filter(function(a) {
            return a.type === filters.type;
          });
        }
      
        if (filters.unacknowledged) {
          result = result.filter(function(a) {
            return !a.acknowledged;
          });
        }
      
        if (filters.limit) {
          result = result.slice(0, filters.limit);
        }
      
        return result;
      } catch (error) {
        Logger.log("Erro em get: " + error.message);
        throw error;
      }
    },
    
    /**
     * Marca alerta como reconhecido
     * @param {string} id - ID do alerta
     */
    acknowledge: function(id) {
      try {
        var alert = _alerts.find(function(a) {
          return a.id === id;
        });
      
        if (alert) {
          alert.acknowledged = true;
          alert.acknowledgedAt = new Date().toISOString();
        }
      } catch (error) {
        Logger.log("Erro em acknowledge: " + error.message);
        throw error;
      }
    },
    
    /**
     * Limpa alertas
     * @param {Object} [filters] - Filtros
     */
    clear: function(filters) {
      try {
        if (!filters) {
          _alerts = [];
          return;
        }
      
        if (filters.acknowledged) {
          _alerts = _alerts.filter(function(a) {
            return !a.acknowledged;
          });
        }
      
        if (filters.olderThan) {
          var cutoff = new Date(Date.now() - filters.olderThan);
          _alerts = _alerts.filter(function(a) {
            return new Date(a.timestamp) > cutoff;
          });
        }
      } catch (error) {
        Logger.log("Erro em clear: " + error.message);
        throw error;
      }
    },
    
    /**
     * Conta alertas por tipo
     * @returns {Object}
     */
    count: function() {
      try {
        var counts = { INFO: 0, WARNING: 0, ERROR: 0, CRITICAL: 0, total: 0 };
      
        _alerts.forEach(function(a) {
          counts[a.type] = (counts[a.type] || 0) + 1;
          counts.total++;
        });
      
        return counts;
      } catch (error) {
        Logger.log("Erro em count: " + error.message);
        throw error;
      }
    }
  };
})();

// ============================================================================
// FUNÇÕES GLOBAIS
// ============================================================================

/**
 * Executa health check completo
 */
function runHealthCheck() {
  var report = HealthCheck.getStatusReport();
  Logger.log(report);
  return HealthCheck.runAll();
}

/**
 * Executa health check rápido
 */
function runQuickHealthCheck() {
  return HealthCheck.runQuick();
}

/**
 * Verifica se sistema está saudável
 */
function isSystemHealthy() {
  return HealthCheck.isHealthy();
}

/**
 * Obtém alertas do sistema
 */
function getSystemAlerts(filters) {
  try {
    return SystemAlerts.get(filters);
  } catch (error) {
    Logger.log("Erro em getSystemAlerts: " + error.message);
    throw error;
  }
}

/**
 * Adiciona alerta ao sistema
 */
function addSystemAlert(type, message, details) {
  return SystemAlerts.add(type, message, details);
}

// ============================================================================
// REGISTRO NO SERVICE LOCATOR
// ============================================================================

if (typeof ServiceLocator !== 'undefined') {
  ServiceLocator.register('healthCheck', HealthCheck);
  ServiceLocator.register('alerts', SystemAlerts);
}
