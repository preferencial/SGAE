/**
 * @fileoverview Sistema de Eventos (Event Bus / Pub-Sub)
 * @version 1.0.0
 * @description Implementa padrão Publish-Subscribe para comunicação
 * desacoplada entre módulos do sistema.
 * 
 * BENEFÍCIOS:
 * - Desacoplamento entre módulos
 * - Extensibilidade (adicionar handlers sem modificar código existente)
 * - Auditoria centralizada de eventos
 * - Suporte a eventos síncronos e assíncronos
 * 
 * EVENTOS DO SISTEMA:
 * - user:login, user:logout, user:created
 * - nf:created, nf:updated, nf:atestada
 * - entrega:recebida, entrega:recusada
 * - processo:aberto, processo:atestado, processo:liquidado
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-08
 */

'use strict';

var EventBus = (function() {

  // ============================================================================
  // ESTADO
  // ============================================================================

  var subscribers = {};
  var eventHistory = [];
  var MAX_HISTORY = 500;

  // ============================================================================
  // CORE
  // ============================================================================

  /**
   * Registra um handler para um evento
   * @param {string} eventName - Nome do evento (suporta wildcards: "user:*")
   * @param {Function} handler - Função handler
   * @param {Object} [options] - Opções
   * @param {number} [options.priority=0] - Prioridade (maior = executa primeiro)
   * @param {boolean} [options.once=false] - Executar apenas uma vez
   * @returns {Function} Função para cancelar a inscrição
   */
  function subscribe(eventName, handler, options) {
    try {
      options = options || {};
    
      if (!subscribers[eventName]) {
        subscribers[eventName] = [];
      }

      var subscription = {
        handler: handler,
        priority: options.priority || 0,
        once: options.once || false,
        context: options.context || null,
        id: generateId()
      };

      subscribers[eventName].push(subscription);
    
      // Ordena por prioridade (maior primeiro)
      subscribers[eventName].sort(function(a, b) {
        return b.priority - a.priority;
      });

      // Retorna função de unsubscribe
      return function unsubscribe() {
        var subs = subscribers[eventName];
        if (subs) {
          var index = subs.findIndex(function(s) { return s.id === subscription.id; });
          if (index !== -1) {
            try {
              subs.splice(index, 1);
            } catch (error) {
              Logger.log("Erro em unsubscribe: " + error.message);
              throw error;
            }
          }
        }
      };
    } catch (error) {
      Logger.log("Erro em subscribe: " + error.message);
      throw error;
    }
  }

  /**
   * Registra handler que executa apenas uma vez
   * @param {string} eventName - Nome do evento
   * @param {Function} handler - Função handler
   * @returns {Function} Função para cancelar
   */
  function once(eventName, handler) {
    return subscribe(eventName, handler, { once: true });
  }

  /**
   * Publica um evento
   * @param {string} eventName - Nome do evento
   * @param {*} [data] - Dados do evento
   * @param {Object} [options] - Opções
   * @returns {Object} Resultado da publicação
   */
  function publish(eventName, data, options) {
    try {
      options = options || {};
      var startTime = Date.now();

      var event = {
        name: eventName,
        data: data,
        timestamp: new Date().toISOString(),
        source: options.source || 'system'
      };

      // Registra no histórico
      recordEvent(event);

      // Encontra handlers (incluindo wildcards)
      var handlers = findHandlers(eventName);
      var results = [];
      var errors = [];

      handlers.forEach(function(sub) {
        try {
          var result = sub.handler.call(sub.context, event);
          results.push({ handler: sub.id, result: result });

          // Remove se era "once"
          if (sub.once) {
            var subs = subscribers[sub.eventPattern];
            if (subs) {
              var index = subs.findIndex(function(s) { return s.id === sub.id; });
              if (index !== -1) {
                subs.splice(index, 1);
              }
            }
          }
        } catch (e) {
          errors.push({ handler: sub.id, error: e.message });
          AppLogger.error('Erro no handler de evento ' + eventName, e);
        }
      });

      var duration = Date.now() - startTime;

      // Métricas
      if (typeof Metrics !== 'undefined') {
        Metrics.increment('events_published', 1, { event: eventName });
        Metrics.observe('event_processing_ms', duration, { event: eventName });
      }

      return {
        event: eventName,
        handlers: handlers.length,
        results: results,
        errors: errors,
        duration: duration
      };
    } catch (error) {
      Logger.log("Erro em publish: " + error.message);
      throw error;
    }
  }

  /**
   * Encontra handlers para um evento (incluindo wildcards)
   * @private
   */
  function findHandlers(eventName) {
    try {
      var handlers = [];
      var parts = eventName.split(':');

      Object.keys(subscribers).forEach(function(pattern) {
        var matches = false;

        if (pattern === eventName) {
          matches = true;
        } else if (pattern.endsWith(':*')) {
          // Wildcard: "user:*" matches "user:login", "user:logout"
          var prefix = pattern.slice(0, -2);
          matches = eventName.startsWith(prefix + ':');
        } else if (pattern === '*') {
          // Global wildcard
          matches = true;
        }

        if (matches) {
          subscribers[pattern].forEach(function(sub) {
            handlers.push(Object.assign({}, sub, { eventPattern: pattern }));
          });
        }
      });

      // Ordena por prioridade
      handlers.sort(function(a, b) { return b.priority - a.priority; });

      return handlers;
    } catch (error) {
      Logger.log("Erro em findHandlers: " + error.message);
      throw error;
    }
  }

  /**
   * Registra evento no histórico
   * @private
   */
  function recordEvent(event) {
    try {
      eventHistory.push(event);
    
      if (eventHistory.length > MAX_HISTORY) {
        eventHistory.shift();
      }
    } catch (error) {
      Logger.log("Erro em recordEvent: " + error.message);
      throw error;
    }
  }

  /**
   * Gera ID único
   * @private
   */
  function generateId() {
    try {
      return 'sub_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
    } catch (error) {
      Logger.log("Erro em generateId: " + error.message);
      throw error;
    }
  }

  // ============================================================================
  // EVENTOS DO SISTEMA PRÉ-DEFINIDOS
  // ============================================================================

  var SYSTEM_EVENTS = {
    // Usuários
    USER_LOGIN: 'user:login',
    USER_LOGOUT: 'user:logout',
    USER_CREATED: 'user:created',
    USER_UPDATED: 'user:updated',
    USER_PASSWORD_CHANGED: 'user:password_changed',

    // Notas Fiscais
    NF_CREATED: 'nf:created',
    NF_UPDATED: 'nf:updated',
    NF_CONFERIDA: 'nf:conferida',
    NF_ATESTADA: 'nf:atestada',
    NF_CANCELADA: 'nf:cancelada',

    // Entregas
    ENTREGA_AGENDADA: 'entrega:agendada',
    ENTREGA_RECEBIDA: 'entrega:recebida',
    ENTREGA_PARCIAL: 'entrega:parcial',
    ENTREGA_RECUSADA: 'entrega:recusada',

    // Processos
    PROCESSO_ABERTO: 'processo:aberto',
    PROCESSO_EM_ANALISE: 'processo:em_analise',
    PROCESSO_ATESTADO: 'processo:atestado',
    PROCESSO_LIQUIDADO: 'processo:liquidado',

    // Sistema
    SYSTEM_STARTUP: 'system:startup',
    SYSTEM_ERROR: 'system:error',
    QUOTA_WARNING: 'system:quota_warning',
    CACHE_CLEARED: 'system:cache_cleared'
  };

  // ============================================================================
  // HANDLERS PADRÃO DO SISTEMA
  // ============================================================================

  /**
   * Registra handlers padrão do sistema
   */
  function registerSystemHandlers() {
    // Log de todos os eventos (baixa prioridade)
    subscribe('*', function(event) {
      AppLogger.debug('Event: ' + event.name, event.data);
    }, { priority: -100 });

    // Auditoria de eventos importantes
    subscribe('user:*', function(event) {
      AppLogger.audit('USER_EVENT', {
        event: event.name,
        data: event.data
      });
    }, { priority: 50 });

    subscribe('nf:atestada', function(event) {
      AppLogger.audit('NF_ATESTADA', event.data);
    }, { priority: 50 });

    subscribe('processo:atestado', function(event) {
      AppLogger.audit('PROCESSO_ATESTADO', event.data);
    }, { priority: 50 });

    // Alerta de quota
    subscribe(SYSTEM_EVENTS.QUOTA_WARNING, function(event) {
      AppLogger.warn('Alerta de quota', event.data);
    }, { priority: 100 });
  }

  // ============================================================================
  // UTILITÁRIOS
  // ============================================================================

  /**
   * Obtém histórico de eventos
   * @param {Object} [filter] - Filtros
   * @returns {Array}
   */
  function getHistory(filter) {
    try {
      filter = filter || {};
      var result = eventHistory;

      if (filter.name) {
        result = result.filter(function(e) {
          return e.name === filter.name || e.name.startsWith(filter.name.replace('*', ''));
        });
      }

      if (filter.since) {
        var since = new Date(filter.since).getTime();
        result = result.filter(function(e) {
          return new Date(e.timestamp).getTime() >= since;
        });
      }

      if (filter.limit) {
        result = result.slice(-filter.limit);
      }

      return result;
    } catch (error) {
      Logger.log("Erro em getHistory: " + error.message);
      throw error;
    }
  }

  /**
   * Obtém estatísticas de eventos
   * @returns {Object}
   */
  function getStats() {
    try {
      var stats = {
        totalSubscribers: 0,
        subscribersByEvent: {},
        totalEventsPublished: eventHistory.length,
        eventsByType: {}
      };

      // Conta subscribers
      Object.keys(subscribers).forEach(function(event) {
        var count = subscribers[event].length;
        stats.totalSubscribers += count;
        stats.subscribersByEvent[event] = count;
      });

      // Conta eventos por tipo
      eventHistory.forEach(function(event) {
        var type = event.name.split(':')[0];
        stats.eventsByType[type] = (stats.eventsByType[type] || 0) + 1;
      });

      return stats;
    } catch (error) {
      Logger.log("Erro em getStats: " + error.message);
      throw error;
    }
  }

  /**
   * Remove todos os subscribers de um evento
   * @param {string} eventName - Nome do evento
   */
  function clearSubscribers(eventName) {
    if (eventName) {
      delete subscribers[eventName];
    } else {
      subscribers = {};
    }
  }

  /**
   * Limpa histórico de eventos
   */
  function clearHistory() {
    eventHistory = [];
  }

  // ============================================================================
  // API PÚBLICA
  // ============================================================================

  return {
    // Core
    subscribe: subscribe,
    on: subscribe, // Alias
    once: once,
    publish: publish,
    emit: publish, // Alias

    // Utilitários
    getHistory: getHistory,
    getStats: getStats,
    clearSubscribers: clearSubscribers,
    clearHistory: clearHistory,

    // Sistema
    registerSystemHandlers: registerSystemHandlers,
    EVENTS: SYSTEM_EVENTS
  };
})();

// ============================================================================
// FUNÇÕES GLOBAIS DE CONVENIÊNCIA
// ============================================================================

/**
 * Publica evento
 */
function emitEvent(name, data) {
  return EventBus.publish(name, data);
}

/**
 * Registra handler de evento
 */
function onEvent(name, handler) {
  return EventBus.subscribe(name, handler);
}

// Registra handlers do sistema na inicialização (com verificação segura)
(function() {
  try {
    if (typeof EventBus !== 'undefined' && typeof EventBus.registerSystemHandlers === 'function') {
      // Só registra se AppLogger existir
      if (typeof AppLogger !== 'undefined') {
        EventBus.registerSystemHandlers();
      }
    }
  } catch (e) {
    // Silencia erro se AppLogger não existir ainda
    Logger.log('[EventBus] Handlers do sistema serão registrados posteriormente');
  }
})();
