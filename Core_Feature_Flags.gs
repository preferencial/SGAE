/**
 * @fileoverview Sistema de Feature Flags
 * @version 1.0.0
 * @description Permite habilitar/desabilitar funcionalidades dinamicamente
 * sem necessidade de deploy.
 * 
 * BENEFÍCIOS:
 * - Deploy gradual de novas funcionalidades
 * - Rollback instantâneo sem deploy
 * - Testes A/B
 * - Funcionalidades por usuário/grupo
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-08
 */

'use strict';

const FeatureFlags = (function() {

  // ============================================================================
  // CONFIGURAÇÃO
  // ============================================================================

  const CACHE_KEY = 'feature_flags';
  const CACHE_TTL = 300; // 5 minutos
  const PROPERTY_KEY = 'FEATURE_FLAGS';

  /**
   * Flags padrão do sistema
   */
  const DEFAULT_FLAGS = {
    // Funcionalidades Core
    ENABLE_CACHE: {
      enabled: true,
      description: 'Habilita sistema de cache',
      category: 'performance'
    },
    ENABLE_BATCH_OPERATIONS: {
      enabled: true,
      description: 'Habilita operações em lote',
      category: 'performance'
    },
    ENABLE_RETRY_STRATEGY: {
      enabled: true,
      description: 'Habilita retry automático em falhas',
      category: 'resilience'
    },
    ENABLE_METRICS: {
      enabled: true,
      description: 'Habilita coleta de métricas',
      category: 'observability'
    },
    ENABLE_AUDIT_LOG: {
      enabled: true,
      description: 'Habilita log de auditoria',
      category: 'security'
    },

    // Funcionalidades de UI
    ENABLE_DARK_MODE: {
      enabled: false,
      description: 'Habilita modo escuro na interface',
      category: 'ui'
    },
    ENABLE_MOBILE_UI: {
      enabled: true,
      description: 'Habilita interface mobile',
      category: 'ui'
    },
    ENABLE_DASHBOARD_V2: {
      enabled: false,
      description: 'Habilita nova versão do dashboard',
      category: 'ui',
      rolloutPercentage: 0
    },

    // Funcionalidades de Negócio
    ENABLE_AUTO_ATESTO: {
      enabled: false,
      description: 'Habilita atesto automático para NFs conformes',
      category: 'business'
    },
    ENABLE_EMAIL_NOTIFICATIONS: {
      enabled: true,
      description: 'Habilita notificações por email',
      category: 'notifications'
    },
    ENABLE_SLACK_INTEGRATION: {
      enabled: false,
      description: 'Habilita integração com Slack',
      category: 'integrations'
    },

    // Funcionalidades Experimentais
    ENABLE_AI_SUGGESTIONS: {
      enabled: false,
      description: 'Habilita sugestões baseadas em IA',
      category: 'experimental'
    },
    ENABLE_PREDICTIVE_ANALYTICS: {
      enabled: false,
      description: 'Habilita análises preditivas',
      category: 'experimental'
    }
  };

  // Cache em memória
  let flagsCache = null;
  let cacheTimestamp = 0;

  // ============================================================================
  // CORE
  // ============================================================================

  /**
   * Carrega flags do armazenamento
   * @returns {Object} Flags carregadas
   */
  function loadFlags() {
    try {
      // Verifica cache em memória
      if (flagsCache && (Date.now() - cacheTimestamp) < CACHE_TTL * 1000) {
        return flagsCache;
      }

      try {
        // Tenta carregar do cache do script
        const cache = CacheService.getScriptCache();
        const cached = cache.get(CACHE_KEY);
      
        if (cached) {
          flagsCache = JSON.parse(cached);
          cacheTimestamp = Date.now();
          return flagsCache;
        }

        // Carrega das propriedades
        const props = PropertiesService.getScriptProperties();
        const stored = props.getProperty(PROPERTY_KEY);
      
        if (stored) {
          flagsCache = JSON.parse(stored);
        } else {
          // Usa defaults
          flagsCache = JSON.parse(JSON.stringify(DEFAULT_FLAGS));
          saveFlags(flagsCache);
        }

        // Atualiza cache
        cache.put(CACHE_KEY, JSON.stringify(flagsCache), CACHE_TTL);
        cacheTimestamp = Date.now();

        return flagsCache;

      } catch (e) {
        AppLogger.error('Erro ao carregar feature flags', e);
        return DEFAULT_FLAGS;
      }
    } catch (error) {
      Logger.log("Erro em loadFlags: " + error.message);
      throw error;
    }
  }

  /**
   * Salva flags no armazenamento
   * @param {Object} flags - Flags a salvar
   */
  function saveFlags(flags) {
    try {
      try {
        try {
          const props = PropertiesService.getScriptProperties();
          props.setProperty(PROPERTY_KEY, JSON.stringify(flags));

          const cache = CacheService.getScriptCache();
          cache.put(CACHE_KEY, JSON.stringify(flags), CACHE_TTL);

          flagsCache = flags;
          cacheTimestamp = Date.now();

          AppLogger.audit('FEATURE_FLAGS_UPDATED', { flags: Object.keys(flags) });

        } catch (e) {
          AppLogger.error('Erro ao salvar feature flags', e);
        }
      } catch (error) {
        Logger.log("Erro em saveFlags: " + error.message);
        throw error;
      }
    } catch (error) {
      Logger.log("Erro em saveFlags: " + error.message);
      throw error;
    }
  }

  /**
   * Verifica se uma flag está habilitada
   * @param {string} flagName - Nome da flag
   * @param {Object} [context] - Contexto (usuário, etc)
   * @returns {boolean}
   */
  function isEnabled(flagName, context) {
    const flags = loadFlags();
    const flag = flags[flagName];

    if (!flag) {
      AppLogger.warn('Feature flag não encontrada: ' + flagName);
      return false;
    }

    // Flag desabilitada globalmente
    if (!flag.enabled) {
      return false;
    }

    // Verifica rollout percentual
    if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
      return isInRollout(flagName, flag.rolloutPercentage, context);
    }

    // Verifica whitelist de usuários
    if (flag.allowedUsers && context && context.email) {
      return flag.allowedUsers.indexOf(context.email) !== -1;
    }

    // Verifica whitelist de tipos de usuário
    if (flag.allowedUserTypes && context && context.userType) {
      return flag.allowedUserTypes.indexOf(context.userType) !== -1;
    }

    return true;
  }

  /**
   * Verifica se usuário está no rollout percentual
   * @private
   */
  function isInRollout(flagName, percentage, context) {
    // Usa email ou ID para consistência
    const identifier = context && context.email ? context.email : 'anonymous';
    
    // Hash simples para distribuição consistente
    let hash = 0;
    const str = flagName + ':' + identifier;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    
    const bucket = Math.abs(hash) % 100;
    return bucket < percentage;
  }

  /**
   * Habilita uma flag
   * @param {string} flagName - Nome da flag
   * @param {Object} [options] - Opções adicionais
   */
  function enable(flagName, options) {
    try {
      const flags = loadFlags();
    
      if (!flags[flagName]) {
        flags[flagName] = { enabled: true, description: 'Custom flag' };
      } else {
        flags[flagName].enabled = true;
      }

      if (options) {
        Object.assign(flags[flagName], options);
      }

      saveFlags(flags);
    
      // Emite evento
      if (typeof EventBus !== 'undefined') {
        EventBus.publish('feature:enabled', { flag: flagName });
      }
    } catch (error) {
      Logger.log("Erro em enable: " + error.message);
      throw error;
    }
  }

  /**
   * Desabilita uma flag
   * @param {string} flagName - Nome da flag
   */
  function disable(flagName) {
    const flags = loadFlags();
    
    if (flags[flagName]) {
      flags[flagName].enabled = false;
      saveFlags(flags);

      // Emite evento
      if (typeof EventBus !== 'undefined') {
        EventBus.publish('feature:disabled', { flag: flagName });
      }
    }
  }

  /**
   * Define percentual de rollout
   * @param {string} flagName - Nome da flag
   * @param {number} percentage - Percentual (0-100)
   */
  function setRolloutPercentage(flagName, percentage) {
    const flags = loadFlags();
    
    if (flags[flagName]) {
      flags[flagName].rolloutPercentage = Math.max(0, Math.min(100, percentage));
      saveFlags(flags);
    }
  }

  /**
   * Obtém todas as flags
   * @returns {Object}
   */
  function getAll() {
    return loadFlags();
  }

  /**
   * Obtém flags por categoria
   * @param {string} category - Categoria
   * @returns {Object}
   */
  function getByCategory(category) {
    try {
      const flags = loadFlags();
      const result = {};

      Object.keys(flags).forEach(name => {
        if (flags[name].category === category) {
          result[name] = flags[name];
        }
      });

      return result;
    } catch (error) {
      Logger.log("Erro em getByCategory: " + error.message);
      throw error;
    }
  }

  /**
   * Reseta flags para valores padrão
   */
  function reset() {
    try {
      saveFlags(JSON.parse(JSON.stringify(DEFAULT_FLAGS)));
      AppLogger.audit('FEATURE_FLAGS_RESET', {});
    } catch (error) {
      Logger.log("Erro em reset: " + error.message);
      throw error;
    }
  }

  /**
   * Invalida cache
   */
  function invalidateCache() {
    try {
      flagsCache = null;
      cacheTimestamp = 0;
      try {
        CacheService.getScriptCache().remove(CACHE_KEY);
      } catch (e) {
        // Cache invalidation failure é não-crítico - memória já foi limpa
        if (typeof AppLogger !== 'undefined') {
          AppLogger.warn('Cache invalidation falhou (não-crítico)', { error: e.message });
        }
      }
    } catch (error) {
      Logger.log("Erro em invalidateCache: " + error.message);
      throw error;
    }
  }

  // ============================================================================
  // WRAPPER PARA EXECUÇÃO CONDICIONAL
  // ============================================================================

  /**
   * Executa função apenas se flag estiver habilitada
   * @param {string} flagName - Nome da flag
   * @param {Function} fn - Função a executar
   * @param {Function} [fallback] - Função alternativa se desabilitada
   * @param {Object} [context] - Contexto
   * @returns {*}
   */
  function executeIf(flagName, fn, fallback, context) {
    if (isEnabled(flagName, context)) {
      return fn();
    } else if (fallback) {
      return fallback();
    }
    return null;
  }

  /**
   * Decorator para funções com feature flag
   * @param {string} flagName - Nome da flag
   * @param {Function} fn - Função original
   * @param {Function} [fallback] - Função alternativa
   * @returns {Function}
   */
  function withFlag(flagName, fn, fallback) {
    return function() {
      const args = arguments;
      const context = args.length > 0 && args[args.length - 1] && args[args.length - 1]._context 
        ? args[args.length - 1]._context 
        : null;

      if (isEnabled(flagName, context)) {
        return fn.apply(null, args);
      } else if (fallback) {
        return fallback.apply(null, args);
      }
      return null;
    };
  }

  // ============================================================================
  // API PÚBLICA
  // ============================================================================

  return {
    // Core
    isEnabled: isEnabled,
    enable: enable,
    disable: disable,
    setRolloutPercentage: setRolloutPercentage,

    // Consulta
    getAll: getAll,
    getByCategory: getByCategory,
    get: function(flagName) {
      const flags = loadFlags();
      return flags[flagName] || null;
    },

    // Gerenciamento
    reset: reset,
    invalidateCache: invalidateCache,

    // Execução condicional
    executeIf: executeIf,
    withFlag: withFlag,

    // Constantes
    DEFAULT_FLAGS: DEFAULT_FLAGS
  };
})();

// ============================================================================
// FUNÇÕES GLOBAIS DE CONVENIÊNCIA
// ============================================================================

/**
 * Verifica se feature está habilitada
 */
function isFeatureEnabled(flagName, context) {
  return FeatureFlags.isEnabled(flagName, context);
}

/**
 * Executa se feature estiver habilitada
 */
function ifFeature(flagName, fn, fallback) {
  return FeatureFlags.executeIf(flagName, fn, fallback);
}
