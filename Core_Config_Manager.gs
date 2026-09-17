/**
 * @fileoverview Gerenciador de Configuração Centralizado
 * @version 1.0.0
 * @description Configurações do sistema com suporte a ambientes
 * 
 * INTERVENÇÃO 14/16: Melhoria de Modularidade
 * - Configuração centralizada
 * - Suporte a múltiplos ambientes
 * - Validação de configurações
 * - Override por ambiente
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-26
 */

'use strict';

var ConfigManager = (function() {
  
  // =========================================================================
  // CONFIGURAÇÕES PADRÃO
  // =========================================================================
  
  var _defaults = {
    // Ambiente
    ENV: 'production',
    DEBUG: false,
    
    // Sistema
    SYSTEM_NAME: 'UNIAE CRE',
    SYSTEM_VERSION: '4.0.0',
    
    // Timeouts (ms)
    TIMEOUT_API: 30000,
    TIMEOUT_CACHE: 30000,
    TIMEOUT_SESSION: 3600000, // 1 hora
    
    // Limites
    MAX_RETRIES: 3,
    MAX_BATCH_SIZE: 100,
    MAX_CACHE_SIZE: 50,
    MAX_ROWS_PER_QUERY: 1000,
    
    // Paginação
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
    
    // Cache
    CACHE_ENABLED: true,
    CACHE_TTL_SHORT: 60000,    // 1 minuto
    CACHE_TTL_MEDIUM: 300000,  // 5 minutos
    CACHE_TTL_LONG: 3600000,   // 1 hora
    
    // Logging
    LOG_LEVEL: 'INFO',
    LOG_TO_SHEET: false,
    
    // Segurança
    SESSION_SECURE: true,
    REQUIRE_AUTH: true,
    
    // Features
    FEATURE_AUDIT: true,
    FEATURE_METRICS: true,
    FEATURE_NOTIFICATIONS: true,
    
    // Planilhas
    SPREADSHEET_ID: null, // Usa ativa por padrão
    
    // API
    API_BASE_URL: '',
    API_VERSION: 'v1'
  };
  
  // Configurações por ambiente
  var _envConfigs = {
    development: {
      DEBUG: true,
      LOG_LEVEL: 'DEBUG',
      CACHE_ENABLED: false,
      REQUIRE_AUTH: false
    },
    
    staging: {
      DEBUG: true,
      LOG_LEVEL: 'DEBUG',
      CACHE_TTL_SHORT: 30000
    },
    
    production: {
      DEBUG: false,
      LOG_LEVEL: 'WARN',
      CACHE_ENABLED: true
    }
  };
  
  // Configurações atuais (merged)
  var _config = {};
  var _initialized = false;
  
  // =========================================================================
  // FUNÇÕES PRIVADAS
  // =========================================================================
  
  /**
   * Merge de objetos (shallow)
   * @private
   */
  function _merge(target, source) {
    var result = {};
    
    for (var key in target) {
      result[key] = target[key];
    }
    
    for (var key in source) {
      if (source.hasOwnProperty(key)) {
        result[key] = source[key];
      }
    }
    
    return result;
  }
  
  /**
   * Carrega configurações do PropertiesService
   * @private
   */
  function _loadFromProperties() {
    try {
      var props = PropertiesService.getScriptProperties();
      var all = props.getProperties();
      var loaded = {};
      
      for (var key in all) {
        // Converte tipos
        var value = all[key];
        
        if (value === 'true') value = true;
        else if (value === 'false') value = false;
        else if (!isNaN(Number(value)) && value !== '') value = Number(value);
        
        loaded[key] = value;
      }
      
      return loaded;
    } catch (e) {
      return {};
    }
  }
  
  // =========================================================================
  // API PÚBLICA
  // =========================================================================
  
  return {
    
    /**
     * Inicializa configurações
     * @param {string} [env] - Ambiente (development, staging, production)
     * @returns {Object} this
     */
    init: function(env) {
      // Começa com defaults
      _config = _merge({}, _defaults);
      
      // Aplica configurações do ambiente
      env = env || _config.ENV;
      if (_envConfigs[env]) {
        _config = _merge(_config, _envConfigs[env]);
      }
      _config.ENV = env;
      
      // Carrega do PropertiesService (override)
      var propsConfig = _loadFromProperties();
      _config = _merge(_config, propsConfig);
      
      _initialized = true;
      
      return this;
    },
    
    /**
     * Obtém valor de configuração
     * @param {string} key - Chave da configuração
     * @param {*} [defaultValue] - Valor padrão se não encontrado
     * @returns {*}
     */
    get: function(key, defaultValue) {
      if (!_initialized) {
        this.init();
      }
      
      if (_config.hasOwnProperty(key)) {
        return _config[key];
      }
      
      return defaultValue !== undefined ? defaultValue : null;
    },
    
    /**
     * Define valor de configuração (runtime only)
     * @param {string} key - Chave
     * @param {*} value - Valor
     * @returns {Object} this
     */
    set: function(key, value) {
      if (!_initialized) {
        this.init();
      }
      
      _config[key] = value;
      return this;
    },
    
    /**
     * Verifica se está em modo debug
     * @returns {boolean}
     */
    isDebug: function() {
      try {
        return this.get('DEBUG', false);
      } catch (error) {
        Logger.log("Erro em isDebug: " + error.message);
        throw error;
      }
    },
    
    /**
     * Verifica se é ambiente de produção
     * @returns {boolean}
     */
    isProduction: function() {
      try {
        return this.get('ENV') === 'production';
      } catch (error) {
        Logger.log("Erro em isProduction: " + error.message);
        throw error;
      }
    },
    
    /**
     * Verifica se feature está habilitada
     * @param {string} feature - Nome da feature
     * @returns {boolean}
     */
    isFeatureEnabled: function(feature) {
      try {
        var key = 'FEATURE_' + feature.toUpperCase();
        return this.get(key, false);
      } catch (error) {
        Logger.log("Erro em isFeatureEnabled: " + error.message);
        throw error;
      }
    },
    
    /**
     * Obtém todas as configurações
     * @returns {Object}
     */
    getAll: function() {
      if (!_initialized) {
        this.init();
      }
      
      return _merge({}, _config);
    },
    
    /**
     * Salva configuração no PropertiesService
     * @param {string} key - Chave
     * @param {*} value - Valor
     */
    persist: function(key, value) {
      try {
        var props = PropertiesService.getScriptProperties();
        props.setProperty(key, String(value));
        _config[key] = value;
      } catch (e) {
        Logger.log('[ConfigManager] Erro ao persistir: ' + e.message);
      }
    },
    
    /**
     * Remove configuração do PropertiesService
     * @param {string} key - Chave
     */
    remove: function(key) {
      try {
        var props = PropertiesService.getScriptProperties();
        props.deleteProperty(key);
        
        // Restaura default se existir
        if (_defaults.hasOwnProperty(key)) {
          _config[key] = _defaults[key];
        } else {
          delete _config[key];
        }
      } catch (e) {
        Logger.log('[ConfigManager] Erro ao remover: ' + e.message);
      }
    },
    
    /**
     * Reseta para defaults
     */
    reset: function() {
      _config = _merge({}, _defaults);
      _initialized = true;
    },
    
    /**
     * Obtém configurações de timeout
     * @returns {Object}
     */
    getTimeouts: function() {
      try {
        return {
          api: this.get('TIMEOUT_API'),
          cache: this.get('TIMEOUT_CACHE'),
          session: this.get('TIMEOUT_SESSION')
        };
      } catch (error) {
        Logger.log("Erro em getTimeouts: " + error.message);
        throw error;
      }
    },
    
    /**
     * Obtém configurações de limite
     * @returns {Object}
     */
    getLimits: function() {
      try {
        return {
          maxRetries: this.get('MAX_RETRIES'),
          maxBatchSize: this.get('MAX_BATCH_SIZE'),
          maxCacheSize: this.get('MAX_CACHE_SIZE'),
          maxRowsPerQuery: this.get('MAX_ROWS_PER_QUERY')
        };
      } catch (error) {
        Logger.log("Erro em getLimits: " + error.message);
        throw error;
      }
    },
    
    /**
     * Obtém configurações de cache
     * @returns {Object}
     */
    getCacheConfig: function() {
      try {
        return {
          enabled: this.get('CACHE_ENABLED'),
          ttlShort: this.get('CACHE_TTL_SHORT'),
          ttlMedium: this.get('CACHE_TTL_MEDIUM'),
          ttlLong: this.get('CACHE_TTL_LONG')
        };
      } catch (error) {
        Logger.log("Erro em getCacheConfig: " + error.message);
        throw error;
      }
    }
  };
})();

// ============================================================================
// ALIASES GLOBAIS
// ============================================================================

/**
 * Obtém configuração (alias global)
 */
function getConfig(key, defaultValue) {
  try {
    return ConfigManager.get(key, defaultValue);
  } catch (error) {
    Logger.log("Erro em getConfig: " + error.message);
    throw error;
  }
}

/**
 * Verifica se está em debug (alias global)
 */
function isDebugMode() {
  return ConfigManager.isDebug();
}

/**
 * Verifica se feature está habilitada (alias global)
 */
function isFeatureEnabled(feature) {
  return ConfigManager.isFeatureEnabled(feature);
}

// ============================================================================
// INICIALIZAÇÃO AUTOMÁTICA
// ============================================================================

// Registra no ServiceLocator se disponível
if (typeof ServiceLocator !== 'undefined') {
  ServiceLocator.register('config', ConfigManager);
}
