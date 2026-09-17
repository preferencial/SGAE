/**
 * @fileoverview Service Locator Pattern - Gerenciamento de Dependências
 * @version 1.0.0
 * @description Sistema de injeção de dependências e service locator
 * 
 * INTERVENÇÃO 14/16: Melhoria de Modularidade
 * - Service Locator para desacoplamento
 * - Lazy loading de serviços
 * - Suporte a mocks para testes
 * - Lifecycle management
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-26
 */

'use strict';

var ServiceLocator = (function() {
  
  // =========================================================================
  // ESTADO INTERNO
  // =========================================================================
  
  var _services = {};
  var _instances = {};
  var _factories = {};
  var _initializers = [];
  var _initialized = false;
  
  // =========================================================================
  // FUNÇÕES PRIVADAS
  // =========================================================================
  
  /**
   * Verifica se serviço existe
   * @private
   */
  function _hasService(name) {
    return _services.hasOwnProperty(name) || _factories.hasOwnProperty(name);
  }
  
  /**
   * Log interno
   * @private
   */
  function _log(message) {
    if (typeof Logger !== 'undefined') {
      Logger.log('[ServiceLocator] ' + message);
    }
  }
  
  // =========================================================================
  // API PÚBLICA
  // =========================================================================
  
  return {
    
    /**
     * Registra um serviço singleton
     * @param {string} name - Nome do serviço
     * @param {*} instance - Instância do serviço
     * @returns {Object} this (para chaining)
     */
    register: function(name, instance) {
      if (!name || typeof name !== 'string') {
        throw new Error('Nome do serviço deve ser uma string não vazia');
      }
      
      _services[name] = instance;
      _log('Registrado: ' + name);
      
      return this;
    },
    
    /**
     * Registra uma factory para criação lazy de serviço
     * @param {string} name - Nome do serviço
     * @param {Function} factory - Função que cria o serviço
     * @param {Object} [options] - Opções
     * @param {boolean} [options.singleton=true] - Se deve ser singleton
     * @returns {Object} this (para chaining)
     */
    registerFactory: function(name, factory, options) {
      if (!name || typeof name !== 'string') {
        throw new Error('Nome do serviço deve ser uma string não vazia');
      }
      if (typeof factory !== 'function') {
        throw new Error('Factory deve ser uma função');
      }
      
      options = options || {};
      
      _factories[name] = {
        factory: factory,
        singleton: options.singleton !== false // default true
      };
      
      _log('Factory registrada: ' + name);
      
      return this;
    },
    
    /**
     * Obtém um serviço
     * @param {string} name - Nome do serviço
     * @param {*} [defaultValue] - Valor padrão se não encontrado
     * @returns {*} Instância do serviço
     */
    get: function(name, defaultValue) {
      // Verifica instância direta
      if (_services.hasOwnProperty(name)) {
        return _services[name];
      }
      
      // Verifica singleton já criado
      if (_instances.hasOwnProperty(name)) {
        return _instances[name];
      }
      
      // Verifica factory
      if (_factories.hasOwnProperty(name)) {
        var config = _factories[name];
        var instance = config.factory();
        
        if (config.singleton) {
          _instances[name] = instance;
        }
        
        return instance;
      }
      
      // Retorna default ou null
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      
      _log('Serviço não encontrado: ' + name);
      return null;
    },
    
    /**
     * Verifica se serviço existe
     * @param {string} name - Nome do serviço
     * @returns {boolean}
     */
    has: function(name) {
      return _hasService(name);
    },
    
    /**
     * Remove um serviço
     * @param {string} name - Nome do serviço
     * @returns {boolean} Se foi removido
     */
    remove: function(name) {
      var removed = false;
      
      if (_services.hasOwnProperty(name)) {
        delete _services[name];
        removed = true;
      }
      
      if (_factories.hasOwnProperty(name)) {
        delete _factories[name];
        removed = true;
      }
      
      if (_instances.hasOwnProperty(name)) {
        delete _instances[name];
        removed = true;
      }
      
      if (removed) {
        _log('Removido: ' + name);
      }
      
      return removed;
    },
    
    /**
     * Substitui um serviço (útil para mocks em testes)
     * @param {string} name - Nome do serviço
     * @param {*} mock - Mock do serviço
     * @returns {*} Serviço original (para restaurar depois)
     */
    mock: function(name, mock) {
      try {
        var original = this.get(name);
      
        // Remove factory se existir
        if (_factories.hasOwnProperty(name)) {
          delete _factories[name];
        }
      
        // Remove instância se existir
        if (_instances.hasOwnProperty(name)) {
          delete _instances[name];
        }
      
        // Registra mock
        _services[name] = mock;
      
        _log('Mock aplicado: ' + name);
      
        return original;
      } catch (error) {
        Logger.log("Erro em mock: " + error.message);
        throw error;
      }
    },
    
    /**
     * Registra inicializador para ser executado no boot
     * @param {Function} initializer - Função de inicialização
     * @param {number} [priority=0] - Prioridade (maior = primeiro)
     */
    onInit: function(initializer, priority) {
      try {
        if (typeof initializer !== 'function') {
          throw new Error('Inicializador deve ser uma função');
        }
      
        _initializers.push({
          fn: initializer,
          priority: priority || 0
        });
      } catch (error) {
        Logger.log("Erro em onInit: " + error.message);
        throw error;
      }
    },
    
    /**
     * Executa todos os inicializadores
     * @returns {Object} Resultado { success, errors }
     */
    boot: function() {
      try {
        if (_initialized) {
          _log('Já inicializado');
          return { success: true, errors: [] };
        }
      
        var errors = [];
      
        // Ordena por prioridade (maior primeiro)
        _initializers.sort(function(a, b) {
          return b.priority - a.priority;
        });
      
        // Executa inicializadores
        _initializers.forEach(function(init, idx) {
          try {
            init.fn();
          } catch (e) {
            errors.push({
              index: idx,
              error: e.message
            });
            _log('Erro no inicializador ' + idx + ': ' + e.message);
          }
        });
      
        _initialized = true;
        _log('Boot completo. Erros: ' + errors.length);
      
        return {
          success: errors.length === 0,
          errors: errors
        };
      } catch (error) {
        Logger.log("Erro em boot: " + error.message);
        throw error;
      }
    },
    
    /**
     * Reseta o container (útil para testes)
     */
    reset: function() {
      _services = {};
      _instances = {};
      _factories = {};
      _initializers = [];
      _initialized = false;
      _log('Reset completo');
    },
    
    /**
     * Lista todos os serviços registrados
     * @returns {string[]}
     */
    list: function() {
      try {
        var names = {};
      
        Object.keys(_services).forEach(function(k) { names[k] = true; });
        Object.keys(_factories).forEach(function(k) { names[k] = true; });
        Object.keys(_instances).forEach(function(k) { names[k] = true; });
      
        return Object.keys(names).sort();
      } catch (error) {
        Logger.log("Erro em list: " + error.message);
        throw error;
      }
    },
    
    /**
     * Obtém estatísticas do container
     * @returns {Object}
     */
    stats: function() {
      try {
        return {
          services: Object.keys(_services).length,
          factories: Object.keys(_factories).length,
          instances: Object.keys(_instances).length,
          initializers: _initializers.length,
          initialized: _initialized
        };
      } catch (error) {
        Logger.log("Erro em stats: " + error.message);
        throw error;
      }
    }
  };
})();

// ============================================================================
// MÓDULO DE EVENTOS - Pub/Sub Pattern
// ============================================================================

var EventBus = (function() {
  
  var _listeners = {};
  
  return {
    
    /**
     * Registra listener para evento
     * @param {string} event - Nome do evento
     * @param {Function} callback - Callback
     * @returns {Function} Função para remover listener
     */
    on: function(event, callback) {
      try {
        if (!_listeners[event]) {
          _listeners[event] = [];
        }
      
        _listeners[event].push(callback);
      
        // Retorna função para remover
        return function() {
          var idx = _listeners[event].indexOf(callback);
          if (idx !== -1) {
            _listeners[event].splice(idx, 1);
          }
        };
      } catch (error) {
        Logger.log("Erro em on: " + error.message);
        throw error;
      }
    },
    
    /**
     * Registra listener que executa apenas uma vez
     * @param {string} event - Nome do evento
     * @param {Function} callback - Callback
     */
    once: function(event, callback) {
      var self = this;
      var wrapper = function() {
        self.off(event, wrapper);
        callback.apply(null, arguments);
      };
      this.on(event, wrapper);
    },
    
    /**
     * Remove listener
     * @param {string} event - Nome do evento
     * @param {Function} callback - Callback a remover
     */
    off: function(event, callback) {
      try {
        if (!_listeners[event]) return;
      
        var idx = _listeners[event].indexOf(callback);
        if (idx !== -1) {
          _listeners[event].splice(idx, 1);
        }
      } catch (error) {
        Logger.log("Erro em off: " + error.message);
        throw error;
      }
    },
    
    /**
     * Emite evento
     * @param {string} event - Nome do evento
     * @param {...*} args - Argumentos para os listeners
     */
    emit: function(event) {
      try {
        if (!_listeners[event]) return;
      
        var args = Array.prototype.slice.call(arguments, 1);
      
        _listeners[event].forEach(function(callback) {
          try {
            callback.apply(null, args);
          } catch (e) {
            Logger.log('[EventBus] Erro em listener de ' + event + ': ' + e.message);
          }
        });
      } catch (error) {
        Logger.log("Erro em emit: " + error.message);
        throw error;
      }
    },
    
    /**
     * Remove todos os listeners de um evento
     * @param {string} [event] - Nome do evento (se omitido, remove todos)
     */
    clear: function(event) {
      if (event) {
        delete _listeners[event];
      } else {
        _listeners = {};
      }
    },
    
    /**
     * Lista eventos com listeners
     * @returns {string[]}
     */
    events: function() {
      return Object.keys(_listeners);
    }
  };
})();

// ============================================================================
// REGISTRO DE SERVIÇOS CORE
// ============================================================================

/**
 * Registra serviços core do sistema
 */
function registerCoreServices() {
  
  // Logger
  ServiceLocator.registerFactory('logger', function() {
    if (typeof ProductionLogger !== 'undefined') {
      return ProductionLogger;
    }
    return {
      debug: function(m) { Logger.log('[DEBUG] ' + m); },
      info: function(m) { Logger.log('[INFO] ' + m); },
      warn: function(m) { Logger.log('[WARN] ' + m); },
      error: function(m) { Logger.log('[ERROR] ' + m); }
    };
  });
  
  // Cache
  ServiceLocator.registerFactory('cache', function() {
    if (typeof DataCache !== 'undefined') {
      return DataCache;
    }
    return null;
  });
  
  // Batch Operations
  ServiceLocator.registerFactory('batch', function() {
    if (typeof BatchOperations !== 'undefined') {
      return BatchOperations;
    }
    return null;
  });
  
  // Metrics
  ServiceLocator.registerFactory('metrics', function() {
    if (typeof Metrics !== 'undefined') {
      return Metrics;
    }
    return {
      increment: function() {},
      gauge: function() {},
      timing: function() {}
    };
  });
  
  // Audit
  ServiceLocator.registerFactory('audit', function() {
    if (typeof AuditService !== 'undefined') {
      return AuditService;
    }
    return {
      log: function() { return { success: true }; }
    };
  });
  
  // Event Bus
  ServiceLocator.register('events', EventBus);
  
  Logger.log('[ServiceLocator] Serviços core registrados');
}

// ============================================================================
// ALIASES GLOBAIS
// ============================================================================

/**
 * Obtém serviço do locator (alias global)
 */
function getService(name, defaultValue) {
  try {
    return ServiceLocator.get(name, defaultValue);
  } catch (error) {
    Logger.log("Erro em getService: " + error.message);
    throw error;
  }
}

/**
 * Registra serviço (alias global)
 */
function registerService(name, instance) {
  return ServiceLocator.register(name, instance);
}

/**
 * Emite evento (alias global)
 */
function emitEvent(event) {
  EventBus.emit.apply(EventBus, arguments);
}

/**
 * Escuta evento (alias global)
 */
function onEvent(event, callback) {
  return EventBus.on(event, callback);
}
