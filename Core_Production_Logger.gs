/**
 * @fileoverview Logger de Produção - Substitui console.log
 * @version 1.0.0
 * @description Sistema de logging que pode ser desabilitado em produção
 * para evitar exposição de informações sensíveis e melhorar performance.
 * 
 * INTERVENÇÃO 6/16: Remoção de Console Logs em Produção
 * - Substitui console.log por Logger controlável
 * - Permite habilitar/desabilitar logs por ambiente
 * - Centraliza configuração de logging
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-26
 */

'use strict';

/**
 * Sistema de Logging de Produção
 */
const ProductionLogger = (function() {
  
  // ============================================================================
  // CONFIGURAÇÃO
  // ============================================================================
  
  const CONFIG = {
    // Níveis de log
    LEVELS: {
      DEBUG: 0,
      INFO: 1,
      WARN: 2,
      ERROR: 3,
      NONE: 4
    },
    
    // Nível mínimo para exibir logs (configurável)
    // Em produção, defina como WARN ou ERROR
    MIN_LEVEL: 1, // INFO por padrão
    
    // Habilita/desabilita logging completamente
    ENABLED: true,
    
    // Prefixos por nível
    PREFIXES: {
      DEBUG: '[DEBUG]',
      INFO: '[INFO]',
      WARN: '[WARN]',
      ERROR: '[ERROR]'
    }
  };
  
  // ============================================================================
  // FUNÇÕES PRIVADAS
  // ============================================================================
  
  /**
   * Verifica se deve logar baseado no nível
   * @private
   */
  function shouldLog(level) {
    if (!CONFIG.ENABLED) return false;
    return level >= CONFIG.MIN_LEVEL;
  }
  
  /**
   * Formata mensagem de log
   * @private
   */
  function formatMessage(prefix, message, data) {
    try {
      const timestamp = new Date().toISOString();
      let formatted = `${timestamp} ${prefix} ${message}`;
    
      if (data !== undefined && data !== null) {
        if (typeof data === 'object') {
          try {
            formatted += ' ' + JSON.stringify(data);
          } catch (e) {
            formatted += ' [Object]';
          }
        } else {
          formatted += ' ' + String(data);
        }
      }
    
      return formatted;
    } catch (error) {
      Logger.log("Erro em formatMessage: " + error.message);
      throw error;
    }
  }
  
  /**
   * Executa o log usando Logger do GAS
   * @private
   */
  function doLog(level, prefix, message, data) {
    if (!shouldLog(level)) return;
    
    const formatted = formatMessage(prefix, message, data);
    Logger.log(formatted);
  }
  
  // ============================================================================
  // API PÚBLICA
  // ============================================================================
  
  return {
    /**
     * Log de debug (desenvolvimento apenas)
     */
    debug: function(message, data) {
      doLog(CONFIG.LEVELS.DEBUG, CONFIG.PREFIXES.DEBUG, message, data);
    },
    
    /**
     * Log de informação
     */
    info: function(message, data) {
      doLog(CONFIG.LEVELS.INFO, CONFIG.PREFIXES.INFO, message, data);
    },
    
    /**
     * Log de aviso
     */
    warn: function(message, data) {
      doLog(CONFIG.LEVELS.WARN, CONFIG.PREFIXES.WARN, message, data);
    },
    
    /**
     * Log de erro
     */
    error: function(message, data) {
      doLog(CONFIG.LEVELS.ERROR, CONFIG.PREFIXES.ERROR, message, data);
    },
    
    /**
     * Log genérico (compatibilidade com console.log)
     */
    log: function(message, data) {
      doLog(CONFIG.LEVELS.INFO, '', message, data);
    },
    
    /**
     * Configura nível mínimo de log
     * @param {string} level - 'DEBUG', 'INFO', 'WARN', 'ERROR', 'NONE'
     */
    setLevel: function(level) {
      if (CONFIG.LEVELS[level] !== undefined) {
        CONFIG.MIN_LEVEL = CONFIG.LEVELS[level];
      }
    },
    
    /**
     * Habilita logging
     */
    enable: function() {
      CONFIG.ENABLED = true;
    },
    
    /**
     * Desabilita logging completamente
     */
    disable: function() {
      CONFIG.ENABLED = false;
    },
    
    /**
     * Verifica se logging está habilitado
     */
    isEnabled: function() {
      return CONFIG.ENABLED;
    },
    
    /**
     * Obtém nível atual
     */
    getLevel: function() {
      for (const key in CONFIG.LEVELS) {
        if (CONFIG.LEVELS[key] === CONFIG.MIN_LEVEL) {
          return key;
        }
      }
      return 'UNKNOWN';
    },
    
    // Expõe níveis para configuração externa
    LEVELS: CONFIG.LEVELS
  };
})();

// ============================================================================
// FUNÇÕES GLOBAIS DE CONVENIÊNCIA
// ============================================================================

/**
 * Substituto seguro para console.log
 * Usa Logger do GAS ao invés de console
 */
function safeLog(message, data) {
  ProductionLogger.log(message, data);
}

/**
 * Log de debug (pode ser desabilitado em produção)
 */
function debugLog(message, data) {
  ProductionLogger.debug(message, data);
}

/**
 * Log de informação
 */
function infoLog(message, data) {
  ProductionLogger.info(message, data);
}

/**
 * Log de aviso
 */
function warnLog(message, data) {
  ProductionLogger.warn(message, data);
}

/**
 * Log de erro
 */
function errorLog(message, data) {
  ProductionLogger.error(message, data);
}

/**
 * Configura logging para produção (apenas WARN e ERROR)
 */
function setProductionLogging() {
  ProductionLogger.setLevel('WARN');
}

/**
 * Configura logging para desenvolvimento (todos os níveis)
 */
function setDevelopmentLogging() {
  ProductionLogger.setLevel('DEBUG');
}

/**
 * Desabilita todos os logs (máxima performance)
 */
function disableAllLogging() {
  ProductionLogger.disable();
}

Logger.log('✅ Core_Production_Logger.gs carregado');
