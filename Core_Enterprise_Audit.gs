/**
 * Core_Enterprise_Audit.gs
 * Sistema de Auditoria Enterprise
 *
 * Implementa:
 * - Audit trail completo
 * - Logging estruturado
 * - Rastreabilidade de operações
 * - Compliance e governança
 *
 * @version 1.0.0
 * @created 2025-12-04
 * @enterprise true
 */

'use strict';

// ============================================================================
// SISTEMA DE AUDITORIA
// ============================================================================

var EnterpriseAudit = (function() {

  var AUDIT_SHEET = 'AUD_Auditoria_Enterprise';
  var LOG_SHEET = 'LOG_Sistema';

  var AUDIT_TYPES = {
    CREATE: 'CREATE',
    READ: 'READ',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    LOGIN: 'LOGIN',
    LOGOUT: 'LOGOUT',
    PERMISSION_CHANGE: 'PERMISSION_CHANGE',
    CONFIG_CHANGE: 'CONFIG_CHANGE',
    EXPORT: 'EXPORT',
    IMPORT: 'IMPORT',
    ERROR: 'ERROR',
    SECURITY: 'SECURITY'
  };

  var LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    FATAL: 4
  };

  var currentLogLevel = LOG_LEVELS.INFO;

  /**
   * Obtém ou cria aba de auditoria
   */
  function getAuditSheet() {
    try {
      var ss = getSS();
      var sheet = ss.getSheetByName(AUDIT_SHEET);

      if (!sheet) {
        sheet = ss.insertSheet(AUDIT_SHEET);

        var headers = [
          'ID', 'Timestamp', 'Tipo', 'Usuário', 'Email', 'IP',
          'Entidade', 'Entidade_ID', 'Ação', 'Dados_Anteriores',
          'Dados_Novos', 'Resultado', 'Duração_ms', 'Sessão_ID',
          'Request_ID', 'Metadata'
        ];

        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        sheet.getRange(1, 1, 1, headers.length)
          .setBackground('#1a1a2e')
          .setFontColor('white')
          .setFontWeight('bold');

        sheet.setFrozenRows(1);
        sheet.setTabColor('#dc2626');
      }

      return sheet;
    } catch (error) {
      Logger.log("Erro em getAuditSheet: " + error.message);
      throw error; // Re-lança para tratamento superior
    }
  }

  /**
   * Obtém ou cria aba de logs
   */
  function getLogSheet() {
    try {
      try {
        var ss = getSS();
        var sheet = ss.getSheetByName(LOG_SHEET);

        if (!sheet) {
          sheet = ss.insertSheet(LOG_SHEET);

          var headers = [
            'Timestamp', 'Level', 'Categoria', 'Mensagem',
            'Contexto', 'Stack', 'Request_ID'
          ];

          sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
          sheet.getRange(1, 1, 1, headers.length)
            .setBackground('#1e3a5f')
            .setFontColor('white')
            .setFontWeight('bold');

          sheet.setFrozenRows(1);
          sheet.setTabColor('#3b82f6');
        }

        return sheet;
      } catch (error) {
        Logger.log("Erro em getLogSheet: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em getLogSheet: " + error.message);
      throw error;
    }
  }

  /**
   * Gera ID único para auditoria
   */
  function generateAuditId() {
    try {
      var timestamp = Date.now().toString(36);
      var random = Math.random().toString(36).substr(2, 8);
      return ('AUD-' + timestamp + '-' + random).toUpperCase();
    } catch (error) {
      Logger.log("Erro em generateAuditId: " + error.message);
      throw error;
    }
  }

  /**
   * Gera Request ID para rastreamento
   */
  function generateRequestId() {
    try {
      return Utilities.getUuid().substr(0, 8);
    } catch (error) {
      Logger.log("Erro em generateRequestId: " + error.message);
      throw error;
    }
  }

  /**
   * Obtém informações do usuário atual
   */
  function getCurrentUser() {
    try {
      try {
        var email = Session.getActiveUser().getEmail();
        var effectiveEmail = Session.getEffectiveUser().getEmail();

        return {
          email: email || effectiveEmail || 'anonymous',
          effectiveEmail: effectiveEmail,
          isAnonymous: !email && !effectiveEmail
        };
      } catch (e) {
        return {
          email: 'system',
          effectiveEmail: 'system',
          isAnonymous: true
        };
      }
    } catch (error) {
      Logger.log("Erro em getCurrentUser: " + error.message);
      throw error;
    }
  }

  /**
   * Serializa dados para armazenamento
   */
  function serializeData(data) {
    try {
      try {
        if (!data) return '';

        try {
          if (typeof data === 'string') return data;
          return JSON.stringify(data);
        } catch (e) {
          return '[Não serializável]';
        }
      } catch (error) {
        Logger.log("Erro em serializeData: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em serializeData: " + error.message);
      throw error;
    }
  }

  return {
    TYPES: AUDIT_TYPES,
    LEVELS: LOG_LEVELS,

    /**
     * Registra evento de auditoria
     * @param {Object} event - Evento de auditoria
     */
    record: function(event) {
      try {
        try {
          var sheet = getAuditSheet();
          var user = getCurrentUser();
          var now = new Date();

          var row = [
            generateAuditId(),
            now.toISOString(),
            event.type || AUDIT_TYPES.READ,
            event.userName || user.email,
            user.email,
            '', // IP não disponível em Apps Script
            event.entity || '',
            event.entityId || '',
            event.action || '',
            serializeData(event.oldData),
            serializeData(event.newData),
            event.result || 'SUCCESS',
            event.duration || 0,
            event.sessionId || '',
            event.requestId || generateRequestId(),
            serializeData(event.metadata)
          ];

          sheet.appendRow(row);

          // Emitir evento
          if (typeof PAE !== 'undefined' && PAE.EventBus) {
            PAE.EventBus.emit('audit:recorded', event);
          }

          // Métricas
          if (typeof PAE !== 'undefined' && PAE.Metrics) {
            PAE.Metrics.increment('audit_events', 1, { type: event.type });
          }

        } catch (e) {
          Logger.log('Erro ao registrar auditoria: ' + e.message);
        }
      } catch (error) {
        Logger.log("Erro em record: " + error.message);
        throw error;
      }
    },

    /**
     * Registra operação CRUD
     * @param {string} operation - CREATE, READ, UPDATE, DELETE
     * @param {string} entity - Nome da entidade
     * @param {string} entityId - ID da entidade
     * @param {Object} oldData - Dados anteriores
     * @param {Object} newData - Dados novos
     */
    recordCRUD: function(operation, entity, entityId, oldData, newData) {
      this.record({
        type: operation,
        entity: entity,
        entityId: entityId,
        action: operation + ' ' + entity,
        oldData: oldData,
        newData: newData
      });
    },

    /**
     * Registra login
     * @param {string} email - Email do usuário
     * @param {boolean} success - Se foi bem-sucedido
     * @param {Object} metadata - Metadados adicionais
     */
    recordLogin: function(email, success, metadata) {
      this.record({
        type: AUDIT_TYPES.LOGIN,
        userName: email,
        action: success ? 'Login bem-sucedido' : 'Tentativa de login falhou',
        result: success ? 'SUCCESS' : 'FAILURE',
        metadata: metadata
      });
    },

    /**
     * Registra logout
     * @param {string} email - Email do usuário
     */
    recordLogout: function(email) {
      this.record({
        type: AUDIT_TYPES.LOGOUT,
        userName: email,
        action: 'Logout realizado'
      });
    },

    /**
     * Registra erro de segurança
     * @param {string} description - Descrição
     * @param {Object} details - Detalhes
     */
    recordSecurityEvent: function(description, details) {
      this.record({
        type: AUDIT_TYPES.SECURITY,
        action: description,
        metadata: details,
        result: 'ALERT'
      });
    },

    /**
     * Define nível de log
     * @param {number} level - Nível
     */
    setLogLevel: function(level) {
      currentLogLevel = level;
    },

    /**
     * Registra log
     * @param {number} level - Nível
     * @param {string} category - Categoria
     * @param {string} message - Mensagem
     * @param {Object} context - Contexto
     */
    log: function(level, category, message, context) {
      if (level < currentLogLevel) return;

      var levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];
      var levelName = levelNames[level] || 'INFO';

      // Log no console
      var prefix = '[' + levelName + '] [' + category + ']';
      Logger.log(prefix + ' ' + message);

      // Salvar em planilha para níveis importantes
      if (level >= LOG_LEVELS.WARN) {
        try {
          var sheet = getLogSheet();

          var row = [
            new Date().toISOString(),
            levelName,
            category,
            message,
            serializeData(context),
            context && context.stack ? context.stack : '',
            generateRequestId()
          ];

          sheet.appendRow(row);
        } catch (e) {
          // Ignora erro ao salvar log
        }
      }
    },

    /**
     * Log de debug
     */
    debug: function(category, message, context) {
      this.log(LOG_LEVELS.DEBUG, category, message, context);
    },

    /**
     * Log de info
     */
    info: function(category, message, context) {
      this.log(LOG_LEVELS.INFO, category, message, context);
    },

    /**
     * Log de warning
     */
    warn: function(category, message, context) {
      this.log(LOG_LEVELS.WARN, category, message, context);
    },

    /**
     * Log de erro
     */
    error: function(category, message, context) {
      this.log(LOG_LEVELS.ERROR, category, message, context);
    },

    /**
     * Log fatal
     */
    fatal: function(category, message, context) {
      this.log(LOG_LEVELS.FATAL, category, message, context);
    },

    /**
     * Busca registros de auditoria
     * @param {Object} filters - Filtros
     * @returns {Array} Registros
     */
    search: function(filters) {
      try {
        var sheet = getAuditSheet();
        var data = sheet.getDataRange().getValues();
        var headers = data[0];

        var results = [];

        for (var i = 1; i < data.length; i++) {
          var row = {};
          headers.forEach(function(h, idx) {
            row[h.toLowerCase().replace(/_/g, '')] = data[i][idx];
          });

          var match = true;

          if (filters.type && row.tipo !== filters.type) match = false;
          if (filters.user && row.email !== filters.user) match = false;
          if (filters.entity && row.entidade !== filters.entity) match = false;
          if (filters.startDate && new Date(row.timestamp) < new Date(filters.startDate)) match = false;
          if (filters.endDate && new Date(row.timestamp) > new Date(filters.endDate)) match = false;

          if (match) {
            results.push(row);
          }
        }

        return results;

      } catch (e) {
        Logger.log('Erro ao buscar auditoria: ' + e.message);
        return [];
      }
    },

    /**
     * Gera relatório de auditoria
     * @param {Object} options - Opções
     * @returns {Object} Relatório
     */
    generateReport: function(options) {
      try {
        options = options || {};

        var records = this.search(options);

        var report = {
          period: {
            start: options.startDate || 'início',
            end: options.endDate || 'agora'
          },
          totalRecords: records.length,
          byType: {},
          byUser: {},
          byEntity: {},
          byResult: {},
          timeline: []
        };

        records.forEach(function(r) {
          // Por tipo
          report.byType[r.tipo] = (report.byType[r.tipo] || 0) + 1;

          // Por usuário
          report.byUser[r.email] = (report.byUser[r.email] || 0) + 1;

          // Por entidade
          if (r.entidade) {
            report.byEntity[r.entidade] = (report.byEntity[r.entidade] || 0) + 1;
          }

          // Por resultado
          report.byResult[r.resultado] = (report.byResult[r.resultado] || 0) + 1;
        });

        return report;
      } catch (error) {
        Logger.log("Erro em generateReport: " + error.message);
        throw error;
      }
    }
  };
})();

// ============================================================================
// DECORATOR PARA AUDITORIA AUTOMÁTICA
// ============================================================================

/**
 * Wrapper para adicionar auditoria a uma função
 * @param {string} entity - Nome da entidade
 * @param {string} operation - Tipo de operação
 * @param {Function} fn - Função original
 * @returns {Function} Função com auditoria
 */
function withAudit(entity, operation, fn) {
  return function() {
    var startTime = Date.now();
    var args = Array.prototype.slice.call(arguments);
    var result;
    var error;

    try {
      result = fn.apply(this, args);

      EnterpriseAudit.record({
        type: operation,
        entity: entity,
        action: operation + ' ' + entity,
        newData: args.length > 0 ? args[0] : null,
        result: 'SUCCESS',
        duration: Date.now() - startTime
      });

      return result;
    } catch (e) {
      error = e;

      EnterpriseAudit.record({
        type: EnterpriseAudit.TYPES.ERROR,
        entity: entity,
        action: operation + ' ' + entity + ' (ERRO)',
        metadata: { error: e.message, stack: e.stack },
        result: 'ERROR',
        duration: Date.now() - startTime
      });

      throw e;
    }
  };
}

// ============================================================================
// COMPLIANCE CHECKER
// ============================================================================

var ComplianceChecker = (function() {

  var rules = [];

  return {
    /**
     * Adiciona regra de compliance
     * @param {Object} rule - Regra
     */
    addRule: function(rule) {
      try {
        rules.push({
          id: rule.id,
          name: rule.name,
          description: rule.description,
          check: rule.check,
          severity: rule.severity || 'warning'
        });
      } catch (error) {
        Logger.log("Erro em addRule: " + error.message);
        throw error;
      }
    },

    /**
     * Executa verificação de compliance
     * @returns {Object} Resultado
     */
    check: function() {
      try {
        var results = {
          passed: [],
          failed: [],
          timestamp: new Date().toISOString()
        };

        rules.forEach(function(rule) {
          try {
            var passed = rule.check();

            if (passed) {
              results.passed.push({
                id: rule.id,
                name: rule.name
              });
            } else {
              results.failed.push({
                id: rule.id,
                name: rule.name,
                description: rule.description,
                severity: rule.severity
              });
            }
          } catch (e) {
            results.failed.push({
              id: rule.id,
              name: rule.name,
              error: e.message,
              severity: 'error'
            });
          }
        });

        results.compliant = results.failed.length === 0;
        results.score = rules.length > 0
          ? Math.round((results.passed.length / rules.length) * 100)
          : 100;

        return results;
      } catch (error) {
        Logger.log("Erro em check: " + error.message);
        throw error;
      }
    }
  };
})();

// ============================================================================
// REGRAS DE COMPLIANCE PADRÃO
// ============================================================================

// Regra: Auditoria ativa
ComplianceChecker.addRule({
  id: 'AUDIT_001',
  name: 'Auditoria Ativa',
  description: 'Sistema de auditoria deve estar ativo',
  check: function() {
    return typeof EnterpriseAudit !== 'undefined';
  }
});

// Regra: Autenticação configurada
ComplianceChecker.addRule({
  id: 'AUTH_001',
  name: 'Autenticação Configurada',
  description: 'Sistema de autenticação deve estar configurado',
  check: function() {
    return typeof UnifiedAuth !== 'undefined' || typeof AUTH !== 'undefined';
  }
});

// Regra: Backup de dados
ComplianceChecker.addRule({
  id: 'DATA_001',
  name: 'Estrutura de Dados',
  description: 'Planilha principal deve existir',
  check: function() {
    try {
      return getSS() !== null;
    } catch (e) {
      return false;
    }
  }
});

// ============================================================================
// FUNÇÕES PÚBLICAS
// ============================================================================

/**
 * Obtém instância do sistema de auditoria
 */
function getAuditSystem() {
  return EnterpriseAudit;
}

/**
 * Executa verificação de compliance
 */
function runComplianceCheck() {
  try {
    var result = ComplianceChecker.check();

    Logger.log('=== VERIFICAÇÃO DE COMPLIANCE ===');
    Logger.log('Score: ' + result.score + '%');
    Logger.log('Compliant: ' + (result.compliant ? 'SIM' : 'NÃO'));
    Logger.log('Regras passaram: ' + result.passed.length);
    Logger.log('Regras falharam: ' + result.failed.length);

    if (result.failed.length > 0) {
      Logger.log('\nFalhas:');
      result.failed.forEach(function(f) {
        Logger.log('  - ' + f.name + ': ' + (f.description || f.error));
      });
    }

    return result;
  } catch (error) {
    Logger.log("Erro em runComplianceCheck: " + error.message);
    throw error;
  }
}

/**
 * Registra módulo
 */
function registrarCoreEnterpriseAudit() {
  Logger.log('✅ Core Enterprise Audit carregado');
}
