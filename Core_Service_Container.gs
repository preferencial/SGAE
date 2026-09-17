/**
 * @fileoverview Container de Serviços e Injeção de Dependência
 * @version 1.0.0
 * @author UNIAE CRE Team
 * @created 2025-12-17
 * 
 * @description
 * Implementa um container de serviços simples para gerenciar dependências
 * entre módulos. Suporta:
 * - Registro de serviços com factory functions
 * - Singletons e instâncias transientes
 * - Injeção de dependência para testes
 * - Lazy loading de serviços
 * 
 * @requires 0_Core_Safe_Globals.gs
 * 
 * @see ARCHITECTURE.md para documentação da arquitetura
 */

'use strict';

// ============================================================================
// CONTAINER DE SERVIÇOS
// ============================================================================

/**
 * Container de Serviços para Injeção de Dependência
 * @namespace ServiceContainer
 */
var ServiceContainer = (function() {
  
  // --------------------------------------------------------------------------
  // ESTADO INTERNO
  // --------------------------------------------------------------------------
  
  /**
   * Registro de serviços
   * @private
   * @type {Object.<string, {factory: Function, singleton: boolean, tags: Array}>}
   */
  var _services = {};
  
  /**
   * Cache de singletons
   * @private
   * @type {Object.<string, *>}
   */
  var _singletons = {};
  
  /**
   * Aliases de serviços
   * @private
   * @type {Object.<string, string>}
   */
  var _aliases = {};
  
  /**
   * Flag de modo de teste
   * @private
   * @type {boolean}
   */
  var _testMode = false;
  
  /**
   * Mocks registrados para testes
   * @private
   * @type {Object.<string, *>}
   */
  var _mocks = {};
  
  // --------------------------------------------------------------------------
  // FUNÇÕES AUXILIARES PRIVADAS
  // --------------------------------------------------------------------------
  
  /**
   * Resolve nome do serviço (considera aliases)
   * @private
   * @param {string} name - Nome ou alias
   * @returns {string} Nome real do serviço
   */
  function _resolveName(name) {
    return _aliases[name] || name;
  }
  
  /**
   * Valida nome do serviço
   * @private
   * @param {string} name - Nome a validar
   */
  function _validateName(name) {
    if (!name || typeof name !== 'string') {
      throw new Error('Nome do serviço deve ser uma string não vazia');
    }
  }
  
  // --------------------------------------------------------------------------
  // API PÚBLICA
  // --------------------------------------------------------------------------
  
  return {
    
    /**
     * Registra um serviço no container
     * 
     * @param {string} name - Nome único do serviço
     * @param {Function} factory - Função que cria a instância
     * @param {Object} [options] - Opções de registro
     * @param {boolean} [options.singleton=false] - Se deve ser singleton
     * @param {Array<string>} [options.tags=[]] - Tags para agrupamento
     * @returns {ServiceContainer} Para encadeamento
     * 
     * @example
     * // Serviço transiente (nova instância a cada get)
     * ServiceContainer.register('validator', function(container) {
     *   return new Validator();
     * });
     * 
     * @example
     * // Serviço singleton
     * ServiceContainer.register('logger', function(container) {
     *   return AppLogger;
     * }, { singleton: true });
     * 
     * @example
     * // Com dependências
     * ServiceContainer.register('userService', function(container) {
     *   return new UserService(
     *     container.get('repository'),
     *     container.get('logger')
     *   );
     * }, { singleton: true, tags: ['service'] });
     */
    register: function(name, factory, options) {
      _validateName(name);
      
      if (typeof factory !== 'function') {
        throw new Error('Factory deve ser uma função');
      }
      
      options = options || {};
      
      _services[name] = {
        factory: factory,
        singleton: options.singleton || false,
        tags: options.tags || []
      };
      
      // Remove singleton cacheado se re-registrar
      if (_singletons[name]) {
        delete _singletons[name];
      }
      
      return this;
    },
    
    /**
     * Registra um valor diretamente (sem factory)
     * 
     * @param {string} name - Nome do serviço
     * @param {*} value - Valor a registrar
     * @returns {ServiceContainer} Para encadeamento
     * 
     * @example
     * ServiceContainer.registerValue('config', { apiUrl: 'https://...' });
     */
    registerValue: function(name, value) {
      _validateName(name);
      
      _services[name] = {
        factory: function() { return value; },
        singleton: true,
        tags: ['value']
      };
      
      _singletons[name] = value;
      
      return this;
    },
    
    /**
     * Registra um alias para um serviço
     * 
     * @param {string} alias - Nome do alias
     * @param {string} serviceName - Nome do serviço real
     * @returns {ServiceContainer} Para encadeamento
     * 
     * @example
     * ServiceContainer.alias('log', 'logger');
     * // Agora container.get('log') retorna o mesmo que container.get('logger')
     */
    alias: function(alias, serviceName) {
      _validateName(alias);
      _validateName(serviceName);
      
      _aliases[alias] = serviceName;
      
      return this;
    },
    
    /**
     * Obtém uma instância do serviço
     * 
     * @param {string} name - Nome do serviço
     * @returns {*} Instância do serviço
     * @throws {Error} Se serviço não estiver registrado
     * 
     * @example
     * var logger = ServiceContainer.get('logger');
     * logger.info('Mensagem');
     */
    get: function(name) {
      try {
        // Validação de entrada - evita erro com undefined/null
        if (name === undefined || name === null || name === '') {
          Logger.log('⚠️ ServiceContainer.get() chamado com nome inválido: ' + String(name));
          throw new Error('Nome do serviço inválido: ' + String(name));
        }
      
        var resolvedName = _resolveName(name);
      
        // Em modo de teste, retorna mock se disponível
        if (_testMode && _mocks[resolvedName]) {
          return _mocks[resolvedName];
        }
      
        var service = _services[resolvedName];
      
        if (!service) {
          throw new Error('Serviço não registrado: ' + name + 
            (name !== resolvedName ? ' (resolvido para: ' + resolvedName + ')' : ''));
        }
      
        // Singleton: retorna do cache ou cria
        if (service.singleton) {
          if (!_singletons[resolvedName]) {
            _singletons[resolvedName] = service.factory(this);
          }
          return _singletons[resolvedName];
        }
      
        // Transiente: sempre cria nova instância
        return service.factory(this);
      } catch (error) {
        Logger.log("Erro em get: " + error.message);
        throw error;
      }
    },
    
    /**
     * Obtém serviço ou retorna valor padrão se não existir
     * 
     * @param {string} name - Nome do serviço
     * @param {*} [defaultValue=null] - Valor padrão
     * @returns {*} Instância ou valor padrão
     */
    getOrDefault: function(name, defaultValue) {
      try {
        try {
          return this.get(name);
        } catch (e) {
          return defaultValue !== undefined ? defaultValue : null;
        }
      } catch (error) {
        Logger.log("Erro em getOrDefault: " + error.message);
        throw error;
      }
    },
    
    /**
     * Verifica se um serviço está registrado
     * 
     * @param {string} name - Nome do serviço
     * @returns {boolean} true se registrado
     */
    has: function(name) {
      var resolvedName = _resolveName(name);
      return !!_services[resolvedName];
    },
    
    /**
     * Remove um serviço do container
     * 
     * @param {string} name - Nome do serviço
     * @returns {boolean} true se removido
     */
    remove: function(name) {
      var resolvedName = _resolveName(name);
      
      if (_services[resolvedName]) {
        delete _services[resolvedName];
        delete _singletons[resolvedName];
        return true;
      }
      
      return false;
    },
    
    /**
     * Lista todos os serviços registrados
     * 
     * @returns {Array<string>} Nomes dos serviços
     */
    list: function() {
      try {
        return Object.keys(_services);
      } catch (error) {
        Logger.log("Erro em list: " + error.message);
        throw error;
      }
    },
    
    /**
     * Obtém serviços por tag
     * 
     * @param {string} tag - Tag a buscar
     * @returns {Array<string>} Nomes dos serviços com a tag
     */
    getByTag: function(tag) {
      try {
        var result = [];
      
        Object.keys(_services).forEach(function(name) {
          if (_services[name].tags.indexOf(tag) !== -1) {
            result.push(name);
          }
        });
      
        return result;
      } catch (error) {
        Logger.log("Erro em getByTag: " + error.message);
        throw error;
      }
    },
    
    /**
     * Limpa o cache de singletons
     * Útil para testes ou reset do sistema
     */
    clearSingletons: function() {
      _singletons = {};
    },
    
    /**
     * Reseta o container completamente
     * Remove todos os serviços, singletons e aliases
     */
    reset: function() {
      _services = {};
      _singletons = {};
      _aliases = {};
      _mocks = {};
      _testMode = false;
    },
    
    // ========================================================================
    // SUPORTE A TESTES
    // ========================================================================
    
    /**
     * Ativa modo de teste
     * Em modo de teste, mocks têm prioridade sobre serviços reais
     */
    enableTestMode: function() {
      _testMode = true;
      return this;
    },
    
    /**
     * Desativa modo de teste
     */
    disableTestMode: function() {
      _testMode = false;
      _mocks = {};
      return this;
    },
    
    /**
     * Verifica se está em modo de teste
     * @returns {boolean}
     */
    isTestMode: function() {
      return _testMode;
    },
    
    /**
     * Registra um mock para testes
     * 
     * @param {string} name - Nome do serviço a mockar
     * @param {*} mock - Objeto mock
     * @returns {ServiceContainer} Para encadeamento
     * 
     * @example
     * ServiceContainer.enableTestMode();
     * ServiceContainer.mock('logger', {
     *   info: function(msg) { testLogs.push(msg); },
     *   error: function(msg) { testErrors.push(msg); }
     * });
     */
    mock: function(name, mock) {
      _validateName(name);
      _mocks[_resolveName(name)] = mock;
      return this;
    },
    
    /**
     * Remove um mock
     * 
     * @param {string} name - Nome do serviço
     * @returns {ServiceContainer} Para encadeamento
     */
    unmock: function(name) {
      delete _mocks[_resolveName(name)];
      return this;
    },
    
    /**
     * Remove todos os mocks
     * @returns {ServiceContainer} Para encadeamento
     */
    clearMocks: function() {
      _mocks = {};
      return this;
    },
    
    // ========================================================================
    // INFORMAÇÕES
    // ========================================================================
    
    /**
     * Obtém informações sobre um serviço
     * 
     * @param {string} name - Nome do serviço
     * @returns {Object|null} Informações ou null
     */
    getInfo: function(name) {
      try {
        var resolvedName = _resolveName(name);
        var service = _services[resolvedName];
      
        if (!service) return null;
      
        return {
          name: resolvedName,
          singleton: service.singleton,
          tags: service.tags.slice(),
          instantiated: !!_singletons[resolvedName],
          hasMock: !!_mocks[resolvedName]
        };
      } catch (error) {
        Logger.log("Erro em getInfo: " + error.message);
        throw error;
      }
    },
    
    /**
     * Obtém estatísticas do container
     * @returns {Object} Estatísticas
     */
    getStats: function() {
      try {
        return {
          totalServices: Object.keys(_services).length,
          singletons: Object.keys(_singletons).length,
          aliases: Object.keys(_aliases).length,
          mocks: Object.keys(_mocks).length,
          testMode: _testMode
        };
      } catch (error) {
        Logger.log("Erro em getStats: " + error.message);
        throw error;
      }
    }
  };
})();

// ============================================================================
// REGISTRO DE SERVIÇOS PADRÃO
// ============================================================================

/**
 * Registra os serviços padrão do sistema
 */
function registerDefaultServices() {
  
  // Logger
  ServiceContainer.register('logger', function() {
    return typeof AppLogger !== 'undefined' ? AppLogger : console;
  }, { singleton: true, tags: ['core', 'logging'] });
  
  // Error Handler
  ServiceContainer.register('errorHandler', function() {
    if (typeof EnhancedErrorHandler !== 'undefined') {
      return EnhancedErrorHandler;
    }
    if (typeof ErrorHandler !== 'undefined') {
      return ErrorHandler;
    }
    return { handle: function(e) { console.error(e); } };
  }, { singleton: true, tags: ['core', 'error'] });
  
  // UX Feedback
  ServiceContainer.register('uxFeedback', function() {
    return typeof UXFeedback !== 'undefined' ? UXFeedback : null;
  }, { singleton: true, tags: ['core', 'ux'] });
  
  // Timezone Manager
  ServiceContainer.register('timezoneManager', function() {
    return typeof TimezoneManager !== 'undefined' ? TimezoneManager : null;
  }, { singleton: true, tags: ['core', 'datetime'] });
  
  // Sheet Accessor
  ServiceContainer.register('sheetAccessor', function() {
    return {
      getSheet: typeof getSheet === 'function' ? getSheet : null,
      getSheetHeaders: typeof getSheetHeaders === 'function' ? getSheetHeaders : null,
      getSheetData: typeof getSheetData === 'function' ? getSheetData : null,
      appendToSheet: typeof appendToSheet === 'function' ? appendToSheet : null,
      updateSheetRow: typeof updateSheetRow === 'function' ? updateSheetRow : null
    };
  }, { singleton: true, tags: ['infra', 'data'] });
  
  // Cache Service
  ServiceContainer.register('cache', function() {
    return CacheService.getScriptCache();
  }, { singleton: true, tags: ['infra', 'cache'] });
  
  // Properties Service
  ServiceContainer.register('properties', function() {
    return PropertiesService.getScriptProperties();
  }, { singleton: true, tags: ['infra', 'config'] });
  
  // Aliases comuns
  ServiceContainer.alias('log', 'logger');
  ServiceContainer.alias('errors', 'errorHandler');
  ServiceContainer.alias('feedback', 'uxFeedback');
  ServiceContainer.alias('timezone', 'timezoneManager');
  ServiceContainer.alias('sheets', 'sheetAccessor');
}

// Registra serviços padrão ao carregar
registerDefaultServices();

// ============================================================================
// FUNÇÕES GLOBAIS DE CONVENIÊNCIA
// ============================================================================

/**
 * Obtém serviço do container
 * @param {string} name - Nome do serviço
 * @returns {*} Instância do serviço
 */
function getService(name) {
  try {
    return ServiceContainer.get(name);
  } catch (error) {
    Logger.log("Erro em getService: " + error.message);
    throw error;
  }
}

/**
 * Verifica se serviço existe
 * @param {string} name - Nome do serviço
 * @returns {boolean}
 */
function hasService(name) {
  return ServiceContainer.has(name);
}

// ============================================================================
// REGISTRO DO MÓDULO
// ============================================================================

Logger.log('✅ Core_Service_Container carregado - ' + ServiceContainer.list().length + ' serviços registrados');
