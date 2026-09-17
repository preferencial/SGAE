/**
 * @fileoverview Core Cache - Sistema de Cache Unificado
 * @version 3.0.0
 * @author UNIAE CRE Team
 * @created 2025-12-18
 * 
 * @description
 * Sistema de cache em múltiplas camadas para otimização de performance:
 * - Cache em memória (runtime)
 * - Cache do Script (CacheService)
 * - Estatísticas e monitoramento
 * 
 * @requires V8 Runtime
 */

'use strict';

// ============================================================================
// CONFIGURAÇÃO DO CACHE
// ============================================================================

/**
 * Configuração do sistema de cache
 * @constant {Object}
 */
var CACHE_CONFIG = {
  /** TTL padrão em milissegundos (5 minutos) */
  DEFAULT_TTL_MS: 5 * 60 * 1000,
  
  /** TTL para CacheService em segundos (10 minutos) */
  SERVICE_TTL_SECONDS: 600,
  
  /** Tamanho máximo do cache em memória */
  MAX_MEMORY_ITEMS: 100,
  
  /** Prefixo para chaves no CacheService */
  KEY_PREFIX: 'UNIAE_'
};

// ============================================================================
// MÓDULO DE CACHE
// ============================================================================

/**
 * Sistema de Cache Unificado
 * @namespace CacheManager
 */
var CacheManager = (function() {
  
  // --------------------------------------------------------------------------
  // ESTADO INTERNO
  // --------------------------------------------------------------------------
  
  /** @type {Object} Cache em memória */
  var _memoryCache = {
    spreadsheet: null,
    sheets: {},
    headers: {},
    data: {},
    timestamps: {}
  };
  
  /** @type {Object} Estatísticas */
  var _stats = {
    hits: 0,
    misses: 0,
    writes: 0,
    evictions: 0
  };
  
  /** @type {number} TTL atual */
  var _ttl = CACHE_CONFIG.DEFAULT_TTL_MS;
  
  // --------------------------------------------------------------------------
  // HELPERS PRIVADOS
  // --------------------------------------------------------------------------
  
  /**
   * Verifica se item expirou
   * @private
   * @param {string} key - Chave do item
   * @returns {boolean} True se expirado
   */
  function _isExpired(key) {
    var timestamp = _memoryCache.timestamps[key];
    if (!timestamp) return true;
    return (Date.now() - timestamp) > _ttl;
  }
  
  /**
   * Atualiza timestamp
   * @private
   * @param {string} key - Chave do item
   */
  function _touch(key) {
    _memoryCache.timestamps[key] = Date.now();
  }
  
  /**
   * Gera chave normalizada
   * @private
   * @param {string} namespace - Namespace
   * @param {string} key - Chave
   * @returns {string} Chave normalizada
   */
  function _makeKey(namespace, key) {
    return namespace + ':' + key;
  }
  
  /**
   * Limpa itens expirados
   * @private
   */
  function _cleanup() {
    try {
      var now = Date.now();
      var keys = Object.keys(_memoryCache.timestamps);
    
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if ((now - _memoryCache.timestamps[key]) > _ttl) {
          _evict(key);
        }
      }
    } catch (error) {
      Logger.log("Erro em _cleanup: " + error.message);
      throw error;
    }
  }
  
  /**
   * Remove item do cache
   * @private
   * @param {string} key - Chave
   */
  function _evict(key) {
    try {
      var parts = key.split(':');
      var namespace = parts[0];
      var itemKey = parts.slice(1).join(':');
    
      if (namespace === 'sheet') {
        delete _memoryCache.sheets[itemKey];
      } else if (namespace === 'headers') {
        delete _memoryCache.headers[itemKey];
      } else if (namespace === 'data') {
        delete _memoryCache.data[itemKey];
      }
    
      delete _memoryCache.timestamps[key];
      _stats.evictions++;
    } catch (error) {
      Logger.log("Erro em _evict: " + error.message);
      throw error;
    }
  }
  
  // --------------------------------------------------------------------------
  // CACHE DE SPREADSHEET
  // --------------------------------------------------------------------------
  
  var SpreadsheetCache = {
    
    /**
     * Obtém spreadsheet ativa com cache
     * @returns {GoogleAppsScript.Spreadsheet.Spreadsheet|null}
     */
    get: function() {
      try {
        if (_memoryCache.spreadsheet && !_isExpired('spreadsheet')) {
          _stats.hits++;
          return _memoryCache.spreadsheet;
        }
        
        _stats.misses++;
        // Standalone-safe: getSS() definida em 0_Core_Safe_Globals.gs
        var ss = getSS();
        if (!ss) {
          var ssId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
          if (ssId) ss = SpreadsheetApp.openById(ssId);
        }
        _memoryCache.spreadsheet = ss;
        _touch('spreadsheet');
        
        return _memoryCache.spreadsheet;
      } catch (e) {
        if (typeof AppLogger !== 'undefined') {
          AppLogger.error('Erro ao obter spreadsheet', e);
        }
        return null;
      }
    },
    
    /**
     * Obtém spreadsheet por ID com cache
     * @param {string} spreadsheetId - ID da planilha
     * @returns {GoogleAppsScript.Spreadsheet.Spreadsheet|null}
     */
    getById: function(spreadsheetId) {
      try {
        var key = _makeKey('ss', spreadsheetId);
        
        if (_memoryCache.data[key] && !_isExpired(key)) {
          _stats.hits++;
          return _memoryCache.data[key];
        }
        
        _stats.misses++;
        var ss = SpreadsheetApp.openById(spreadsheetId);
        _memoryCache.data[key] = ss;
        _touch(key);
        
        return ss;
      } catch (e) {
        if (typeof AppLogger !== 'undefined') {
          AppLogger.error('Erro ao obter spreadsheet por ID', e);
        }
        return null;
      }
    }
  };
  
  // --------------------------------------------------------------------------
  // CACHE DE SHEETS
  // --------------------------------------------------------------------------
  
  var SheetCache = {
    
    /**
     * Obtém sheet por nome com cache
     * @param {string} sheetName - Nome da aba
     * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} [spreadsheet] - Planilha
     * @returns {GoogleAppsScript.Spreadsheet.Sheet|null}
     */
    get: function(sheetName, spreadsheet) {
      try {
        if (!sheetName || typeof sheetName !== 'string') {
          return null;
        }
        
        var key = _makeKey('sheet', sheetName);
        
        if (_memoryCache.sheets[sheetName] && !_isExpired(key)) {
          _stats.hits++;
          return _memoryCache.sheets[sheetName];
        }
        
        _stats.misses++;
        var ss = spreadsheet || SpreadsheetCache.get();
        if (!ss) return null;
        
        var sheet = ss.getSheetByName(sheetName);
        if (sheet) {
          _memoryCache.sheets[sheetName] = sheet;
          _touch(key);
        }
        
        return sheet;
      } catch (e) {
        if (typeof AppLogger !== 'undefined') {
          AppLogger.error('Erro ao obter sheet: ' + sheetName, e);
        }
        return null;
      }
    },
    
    /**
     * Invalida cache de uma sheet
     * @param {string} sheetName - Nome da aba
     */
    invalidate: function(sheetName) {
      delete _memoryCache.sheets[sheetName];
      delete _memoryCache.headers[sheetName];
      delete _memoryCache.timestamps[_makeKey('sheet', sheetName)];
      delete _memoryCache.timestamps[_makeKey('headers', sheetName)];
    },

    /**
     * Verifica se sheet está em cache
     * @param {string} sheetName - Nome da aba
     * @returns {boolean}
     */
    isCached: function(sheetName) {
      var key = _makeKey('sheet', sheetName);
      return !!_memoryCache.sheets[sheetName] && !_isExpired(key);
    }
  };
  
  // --------------------------------------------------------------------------
  // CACHE DE HEADERS
  // --------------------------------------------------------------------------
  
  var HeaderCache = {
    
    /**
     * Obtém headers de uma sheet com cache
     * @param {string} sheetName - Nome da aba
     * @returns {Array<string>}
     */
    get: function(sheetName) {
      try {
        if (!sheetName || typeof sheetName !== 'string') {
          return [];
        }
        
        var key = _makeKey('headers', sheetName);
        
        if (_memoryCache.headers[sheetName] && !_isExpired(key)) {
          _stats.hits++;
          return _memoryCache.headers[sheetName];
        }
        
        _stats.misses++;
        var sheet = SheetCache.get(sheetName);
        
        if (!sheet || sheet.getLastColumn() === 0) {
          return [];
        }
        
        var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        _memoryCache.headers[sheetName] = headers;
        _touch(key);
        
        return headers;
      } catch (e) {
        if (typeof AppLogger !== 'undefined') {
          AppLogger.error('Erro ao obter headers: ' + sheetName, e);
        }
        return [];
      }
    }
  };
  
  // --------------------------------------------------------------------------
  // CACHE GENÉRICO (CacheService)
  // --------------------------------------------------------------------------
  
  var DataCache = {
    /**
     * Remove item do cache
     * @param {string} key - Chave
     * @param {string} [scope='script'] - Escopo
     */
    remove: function(key, scope) {
      try {
        try {
          var cache = this._getService(scope);
          cache.remove(CACHE_CONFIG.KEY_PREFIX + key);
          return true;
        } catch (e) {
          return false;
        }
      } catch (error) {
        Logger.log("Erro em remove: " + error.message);
        throw error;
      }
    },
    
    /**
     * Obtém valor do cache
     * @param {string} key - Chave
     * @param {string} [scope='script'] - Escopo: 'script', 'user', 'document'
     * @returns {*} Valor ou null
     */
    get: function(key, scope) {
      try {
        var cache = this._getService(scope);
        var data = cache.get(CACHE_CONFIG.KEY_PREFIX + key);
        
        if (data) {
          _stats.hits++;
          return JSON.parse(data);
        }
        
        _stats.misses++;
        return null;
      } catch (e) {
        return null;
      }
    },
    
    /**
     * Define valor no cache
     * @param {string} key - Chave
     * @param {*} value - Valor (será serializado)
     * @param {number} [ttlSeconds] - TTL em segundos
     * @param {string} [scope='script'] - Escopo
     * @returns {boolean} Sucesso
     */
    set: function(key, value, ttlSeconds, scope) {
      try {
        try {
          var cache = this._getService(scope);
          var ttl = ttlSeconds || CACHE_CONFIG.SERVICE_TTL_SECONDS;
        
          cache.put(CACHE_CONFIG.KEY_PREFIX + key, JSON.stringify(value), ttl);
          _stats.writes++;
        
          return true;
        } catch (e) {
          return false;
        }
      } catch (error) {
        Logger.log("Erro em set: " + error.message);
        throw error;
      }
    },
    
    /**
     * Remove valor do cache
     * @param {string} key - Chave
     * @param {string} [scope='script'] - Escopo
     */
    remove: function(key, scope) {
      try {
        var cache = this._getService(scope);
        cache.remove(CACHE_CONFIG.KEY_PREFIX + key);
      } catch (e) {
        // Ignora erro
      }
    },
    
    /**
     * Obtém serviço de cache por escopo
     * @private
     * @param {string} scope - Escopo
     * @returns {GoogleAppsScript.Cache.Cache}
     */
    _getService: function(scope) {
      switch (scope) {
        case 'user':
          return CacheService.getUserCache();
        case 'document':
          return CacheService.getDocumentCache();
        default:
          return CacheService.getScriptCache();
      }
    }
  };
  
  // --------------------------------------------------------------------------
  // GERENCIAMENTO
  // --------------------------------------------------------------------------
  
  var Management = {
    
    /**
     * Limpa todo o cache em memória
     * @returns {Object} Resultado
     */
    clearMemory: function() {
      var previousStats = this.getStats();
      
      _memoryCache = {
        spreadsheet: null,
        sheets: {},
        headers: {},
        data: {},
        timestamps: {}
      };
      
      _stats = { hits: 0, misses: 0, writes: 0, evictions: 0 };
      
      return {
        success: true,
        message: 'Cache em memória limpo',
        previousStats: previousStats
      };
    },
    
    /**
     * Limpa cache de uma sheet específica
     * @param {string} sheetName - Nome da aba
     * @returns {Object} Resultado
     */
    clearSheet: function(sheetName) {
      try {
        SheetCache.invalidate(sheetName);
        DataCache.remove(sheetName + '_all');
      
        return {
          success: true,
          message: 'Cache da sheet ' + sheetName + ' limpo'
        };
      } catch (error) {
        Logger.log("Erro em clearSheet: " + error.message);
        throw error;
      }
    },
    
    /**
     * Obtém estatísticas do cache
     * @returns {Object} Estatísticas
     */
    getStats: function() {
      try {
        var total = _stats.hits + _stats.misses;
        var hitRate = total > 0 ? ((_stats.hits / total) * 100).toFixed(2) : '0.00';
      
        return {
          hits: _stats.hits,
          misses: _stats.misses,
          writes: _stats.writes,
          evictions: _stats.evictions,
          hitRate: hitRate + '%',
          totalRequests: total,
          cachedSheets: Object.keys(_memoryCache.sheets).length,
          cachedHeaders: Object.keys(_memoryCache.headers).length
        };
      } catch (error) {
        Logger.log("Erro em getStats: " + error.message);
        throw error;
      }
    },
    
    /**
     * Define TTL do cache em memória
     * @param {number} ttlMs - TTL em milissegundos
     * @returns {Object} Resultado
     */
    setTTL: function(ttlMs) {
      if (typeof ttlMs !== 'number' || ttlMs < 0) {
        return { success: false, error: 'TTL inválido' };
      }
      
      _ttl = ttlMs;
      return { success: true, ttl: ttlMs };
    },
    
    /**
     * Executa limpeza de itens expirados
     * @returns {Object} Resultado
     */
    cleanup: function() {
      var before = _stats.evictions;
      _cleanup();
      var evicted = _stats.evictions - before;
      
      return {
        success: true,
        evicted: evicted
      };
    }
  };
  
  // --------------------------------------------------------------------------
  // API PÚBLICA
  // --------------------------------------------------------------------------
  
  return {
    /** Cache de Spreadsheet */
    Spreadsheet: SpreadsheetCache,
    
    /** Cache de Sheets */
    Sheet: SheetCache,
    
    /** Cache de Headers */
    Header: HeaderCache,
    
    /** Cache de Dados (CacheService) */
    Data: DataCache,
    
    /** Gerenciamento */
    Management: Management,
    
    /** Configuração */
    CONFIG: CACHE_CONFIG
  };
})();

// ============================================================================
// FUNÇÕES GLOBAIS DE COMPATIBILIDADE
// ============================================================================

/**
 * @deprecated Use CacheManager.Spreadsheet.get()
 */
function getCachedSpreadsheet() {
  try {
    return CacheManager.Spreadsheet.get();
  } catch (error) {
    Logger.log("Erro em getCachedSpreadsheet: " + error.message);
    throw error;
  }
}

/**
 * @deprecated Use CacheManager.Sheet.get()
 */
function getCachedSheet(sheetName) {
  try {
    return CacheManager.Sheet.get(sheetName);
  } catch (error) {
    Logger.log("Erro em getCachedSheet: " + error.message);
    throw error;
  }
}

/**
 * @deprecated Use CacheManager.Header.get()
 */
function getCachedHeaders(sheetName) {
  try {
    return CacheManager.Header.get(sheetName);
  } catch (error) {
    Logger.log("Erro em getCachedHeaders: " + error.message);
    throw error;
  }
}

/**
 * @deprecated Use CacheManager.Management.clearMemory()
 */
function clearCache() {
  return CacheManager.Management.clearMemory();
}

/**
 * @deprecated Use CacheManager.Management.clearSheet()
 */
function clearSheetCache(sheetName) {
  return CacheManager.Management.clearSheet(sheetName);
}

/**
 * @deprecated Use CacheManager.Management.getStats()
 */
function getCacheStats() {
  return { success: true, data: CacheManager.Management.getStats() };
}

/**
 * @deprecated Use CacheManager.Management.setTTL()
 */
function setCacheTTL(ttlMs) {
  return CacheManager.Management.setTTL(ttlMs);
}

/**
 * Verifica se uma aba está em cache (Compatibilidade)
 * @param {string} sheetName
 * @returns {boolean}
 */
function isSheetCached(sheetName) {
  try {
    return CacheManager.Sheet.isCached(sheetName);
  } catch (error) {
    Logger.log("Erro em isSheetCached: " + error.message);
    throw error;
  }
}

// Alias global para compatibilidade
var CACHE = {
  get spreadsheet() { return CacheManager.Spreadsheet.get(); },
  sheets: {},
  headers: {},
  stats: { hits: 0, misses: 0 }
};

// ============================================================================
// REGISTRO DO MÓDULO
// ============================================================================

Logger.log('✅ Core_Cache carregado - CacheManager disponível');
