/**
 * @fileoverview Core Error - Sistema de Tratamento de Erros Unificado
 * @version 6.0.0
 * @author UNIAE CRE Team
 * @created 2025-12-18
 * 
 * @description
 * Sistema profissional de tratamento de erros com:
 * - Classificação automática de erros
 * - Transaction IDs para rastreabilidade
 * - Logging estruturado
 * - Mensagens amigáveis ao usuário
 * - Integração com sistema de auditoria
 * 
 * @requires V8 Runtime
 */

'use strict';

// ============================================================================
// TIPOS DE ERRO
// ============================================================================

/**
 * Tipos de erro do sistema
 * @constant {Object}
 */
var ERROR_TYPES = {
  VALIDATION: 'ValidationError',
  PERMISSION: 'PermissionError',
  NOT_FOUND: 'NotFoundError',
  QUOTA: 'QuotaError',
  NETWORK: 'NetworkError',
  TIMEOUT: 'TimeoutError',
  BUSINESS: 'BusinessError',
  SYSTEM: 'SystemError',
  UNKNOWN: 'UnknownError'
};

/**
 * Severidade dos erros
 * @constant {Object}
 */
var ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// ============================================================================
// MÓDULO DE TRATAMENTO DE ERROS
// ============================================================================

/**
 * Sistema de Tratamento de Erros
 * @namespace ErrorHandler
 */
var ErrorHandler = (function() {
  
  // --------------------------------------------------------------------------
  // CONFIGURAÇÃO
  // --------------------------------------------------------------------------
  
  var _config = {
    /** Habilita logging detalhado */
    verbose: true,
    
    /** Habilita persistência de erros */
    persist: true,
    
    /** Nome da aba de logs */
    logSheet: 'Error_Log',
    
    /** Máximo de erros em memória */
    maxMemoryErrors: 100
  };
  
  /** @type {Array} Buffer de erros recentes */
  var _errorBuffer = [];
  
  // --------------------------------------------------------------------------
  // HELPERS PRIVADOS
  // --------------------------------------------------------------------------
  
  /**
   * Gera Transaction ID único
   * @private
   * @returns {string} Transaction ID
   */
  function _generateTransactionId() {
    try {
      var timestamp = Date.now().toString(36);
      var random = Math.random().toString(36).substring(2, 8);
      return 'ERR-' + timestamp + '-' + random.toUpperCase();
    } catch (error) {
      Logger.log("Erro em _generateTransactionId: " + error.message);
      throw error;
    }
  }
  
  /**
   * Classifica erro automaticamente
   * @private
   * @param {Error} error - Erro a classificar
   * @returns {string} Tipo do erro
   */
  function _classifyError(error) {
    try {
      if (!error) return ERROR_TYPES.UNKNOWN;
    
      var message = String(error.message || error).toLowerCase();
    
      // Padrões de classificação
      var patterns = [
        { type: ERROR_TYPES.PERMISSION, keywords: ['permiss', 'autoriza', 'denied', 'forbidden', 'acesso negado'] },
        { type: ERROR_TYPES.NOT_FOUND, keywords: ['não encontrad', 'not found', 'inexistente', 'does not exist'] },
        { type: ERROR_TYPES.QUOTA, keywords: ['quota', 'limite', 'exceeded', 'rate limit', 'too many'] },
        { type: ERROR_TYPES.VALIDATION, keywords: ['validação', 'inválid', 'required', 'obrigatório', 'formato'] },
        { type: ERROR_TYPES.NETWORK, keywords: ['network', 'conexão', 'connection', 'fetch', 'dns'] },
        { type: ERROR_TYPES.TIMEOUT, keywords: ['timeout', 'tempo limite', 'timed out', 'exceeded time'] },
        { type: ERROR_TYPES.BUSINESS, keywords: ['regra de negócio', 'business rule', 'não permitido'] }
      ];
    
      for (var i = 0; i < patterns.length; i++) {
        var pattern = patterns[i];
        for (var j = 0; j < pattern.keywords.length; j++) {
          if (message.indexOf(pattern.keywords[j]) !== -1) {
            return pattern.type;
          }
        }
      }
    
      return ERROR_TYPES.UNKNOWN;
    } catch (error) {
      Logger.log("Erro em _classifyError: " + error.message);
      throw error;
    }
  }
  
  /**
   * Determina severidade do erro
   * @private
   * @param {string} errorType - Tipo do erro
   * @returns {string} Severidade
   */
  function _getSeverity(errorType) {
    switch (errorType) {
      case ERROR_TYPES.QUOTA:
      case ERROR_TYPES.SYSTEM:
        return ERROR_SEVERITY.CRITICAL;
      case ERROR_TYPES.PERMISSION:
      case ERROR_TYPES.NETWORK:
        return ERROR_SEVERITY.HIGH;
      case ERROR_TYPES.NOT_FOUND:
      case ERROR_TYPES.BUSINESS:
        return ERROR_SEVERITY.MEDIUM;
      default:
        return ERROR_SEVERITY.LOW;
    }
  }
  
  /**
   * Formata mensagem amigável para usuário
   * @private
   * @param {string} errorType - Tipo do erro
   * @param {string} originalMessage - Mensagem original
   * @param {string} context - Contexto
   * @returns {string} Mensagem formatada
   */
  function _formatUserMessage(errorType, originalMessage, context) {
    var prefix = context ? 'Erro em ' + context + ':\n\n' : '';
    
    var messages = {
      ValidationError: 'Dados inválidos. Verifique as informações e tente novamente.',
      PermissionError: 'Você não tem permissão para realizar esta ação.',
      NotFoundError: 'O recurso solicitado não foi encontrado.',
      QuotaError: 'Limite de uso excedido. Tente novamente mais tarde.',
      NetworkError: 'Erro de conexão. Verifique sua internet.',
      TimeoutError: 'A operação demorou muito. Tente novamente.',
      BusinessError: 'Operação não permitida pelas regras do sistema.',
      SystemError: 'Erro interno do sistema. Contate o suporte.',
      UnknownError: 'Ocorreu um erro inesperado.'
    };
    
    var baseMessage = messages[errorType] || messages.UnknownError;
    
    // Adiciona detalhes se for erro de validação
    if (errorType === ERROR_TYPES.VALIDATION && originalMessage) {
      baseMessage = originalMessage;
    }
    
    return prefix + baseMessage;
  }
  
  /**
   * Persiste erro na planilha de logs
   * @private
   * @param {Object} errorData - Dados do erro
   */
  function _persistError(errorData) {
    try {
      if (!_config.persist) return;
    
      try {
        var ss = getSS();
        var sheet = ss.getSheetByName(_config.logSheet);
      
        if (!sheet) {
          sheet = ss.insertSheet(_config.logSheet);
          sheet.appendRow([
            'Transaction ID', 'Timestamp', 'Tipo', 'Severidade',
            'Contexto', 'Mensagem', 'Stack', 'Usuário'
          ]);
          sheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#f0f0f0');
        }
      
        var user = '';
        try {
          user = Session.getActiveUser().getEmail();
        } catch (e) {
          user = 'unknown';
        }
      
        sheet.appendRow([
          errorData.transactionId,
          new Date(),
          errorData.type,
          errorData.severity,
          errorData.context,
          errorData.message,
          errorData.stack || '',
          user
        ]);
      
      } catch (e) {
        console.error('Falha ao persistir erro: ' + e.message);
      }
    } catch (error) {
      Logger.log("Erro em _persistError: " + error.message);
      throw error;
    }
  }
  
  /**
   * Adiciona erro ao buffer em memória
   * @private
   * @param {Object} errorData - Dados do erro
   */
  function _bufferError(errorData) {
    try {
      _errorBuffer.push(errorData);
    
      if (_errorBuffer.length > _config.maxMemoryErrors) {
        _errorBuffer.shift();
      }
    } catch (error) {
      Logger.log("Erro em _bufferError: " + error.message);
      throw error;
    }
  }
  
  // --------------------------------------------------------------------------
  // API PÚBLICA
  // --------------------------------------------------------------------------
  
  return {
    /** Tipos de erro */
    TYPES: ERROR_TYPES,
    
    /** Severidades */
    SEVERITY: ERROR_SEVERITY,
    
    /**
     * Trata um erro de forma padronizada
     * @param {Error|string} error - Erro a tratar
     * @param {string} [context] - Contexto onde ocorreu
     * @param {Object} [options] - Opções
     * @param {boolean} [options.silent=false] - Não exibir alerta
     * @param {boolean} [options.rethrow=false] - Relançar erro
     * @param {Object} [options.metadata] - Dados adicionais
     * @returns {Object} Resultado padronizado
     */
    handle: function(error, context, options) {
      try {
        options = options || {};
        context = context || 'Operação';
      
        // Normaliza erro
        if (!error) {
          error = new Error('Erro desconhecido');
        } else if (typeof error === 'string') {
          error = new Error(error);
        }
      
        // Classifica e analisa
        var errorType = error.name && ERROR_TYPES[error.name] 
          ? error.name 
          : _classifyError(error);
        var severity = _getSeverity(errorType);
        var transactionId = _generateTransactionId();
      
        // Monta dados do erro
        var errorData = {
          transactionId: transactionId,
          type: errorType,
          severity: severity,
          context: context,
          message: error.message || String(error),
          stack: error.stack || null,
          timestamp: new Date().toISOString(),
          metadata: options.metadata || null
        };
      
        // Log
        if (_config.verbose) {
          console.error('[' + transactionId + '] ' + errorType + ' em ' + context + ': ' + errorData.message);
          if (error.stack) {
            console.error(error.stack);
          }
        }
      
        // Usa AppLogger se disponível
        if (typeof AppLogger !== 'undefined') {
          AppLogger.error(context + ' [' + transactionId + ']', error);
        }
      
        // Buffer e persistência
        _bufferError(errorData);
        _persistError(errorData);
      
        // Alerta UI
        if (!options.silent) {
          try {
            var ui = SpreadsheetApp.getUi();
            var userMessage = _formatUserMessage(errorType, error.message, context);
            userMessage += '\n\nID: ' + transactionId;
            ui.alert('⚠️ Atenção', userMessage, ui.ButtonSet.OK);
          } catch (e) {
            // UI não disponível (contexto de API)
          }
        }
      
        // Rethrow se solicitado
        if (options.rethrow) {
          throw error;
        }
      
        return {
          success: false,
          error: errorData.message,
          errorType: errorType,
          severity: severity,
          transactionId: transactionId,
          context: context
        };
      } catch (error) {
        Logger.log("Erro em handle: " + error.message);
        throw error;
      }
    },
    
    /**
     * Executa função com tratamento de erro automático
     * @param {Function} fn - Função a executar
     * @param {string} [context] - Contexto
     * @param {Object} [options] - Opções de tratamento
     * @returns {*} Resultado da função ou erro tratado
     */
    tryCatch: function(fn, context, options) {
      try {
        return fn();
      } catch (error) {
        return this.handle(error, context, options);
      }
    },
    
    /**
     * Cria erro tipado
     * @param {string} type - Tipo do erro (de ERROR_TYPES)
     * @param {string} message - Mensagem
     * @param {Object} [details] - Detalhes adicionais
     * @returns {Error} Erro criado
     */
    create: function(type, message, details) {
      var error = new Error(message);
      error.name = type;
      error.details = details || null;
      return error;
    },
    
    /**
     * Cria erro de validação
     * @param {string} message - Mensagem
     * @param {string} [field] - Campo com erro
     * @returns {Error} Erro de validação
     */
    validation: function(message, field) {
      return this.create(ERROR_TYPES.VALIDATION, message, { field: field });
    },
    
    /**
     * Cria erro de permissão
     * @param {string} [message] - Mensagem
     * @param {string} [resource] - Recurso negado
     * @returns {Error} Erro de permissão
     */
    permission: function(message, resource) {
      return this.create(
        ERROR_TYPES.PERMISSION, 
        message || 'Acesso negado', 
        { resource: resource }
      );
    },
    
    /**
     * Cria erro de não encontrado
     * @param {string} resource - Recurso não encontrado
     * @returns {Error} Erro de não encontrado
     */
    notFound: function(resource) {
      return this.create(
        ERROR_TYPES.NOT_FOUND,
        resource + ' não encontrado(a)',
        { resource: resource }
      );
    },
    
    /**
     * Cria erro de cota excedida
     * @param {string} [message] - Mensagem
     * @returns {Error} Erro de cota
     */
    quota: function(message) {
      try {
        return this.create(
          ERROR_TYPES.QUOTA,
          message || 'Limite de uso excedido. Tente novamente mais tarde.',
          { timestamp: new Date().toISOString() }
        );
      } catch (error) {
        Logger.log("Erro em quota: " + error.message);
        throw error;
      }
    },
    
    /**
     * Cria erro de regra de negócio
     * @param {string} message - Mensagem
     * @param {string} [rule] - Regra violada
     * @returns {Error} Erro de negócio
     */
    business: function(message, rule) {
      return this.create(
        ERROR_TYPES.BUSINESS,
        message,
        { rule: rule }
      );
    },
    
    /**
     * Obtém erros recentes do buffer
     * @param {number} [limit=10] - Limite de erros
     * @returns {Array} Erros recentes
     */
    getRecent: function(limit) {
      try {
        limit = limit || 10;
        return _errorBuffer.slice(-limit).reverse();
      } catch (error) {
        Logger.log("Erro em getRecent: " + error.message);
        throw error;
      }
    },
    
    /**
     * Limpa buffer de erros
     */
    clearBuffer: function() {
      _errorBuffer = [];
    },
    
    /**
     * Configura o handler
     * @param {Object} options - Opções
     */
    configure: function(options) {
      if (options.verbose !== undefined) _config.verbose = options.verbose;
      if (options.persist !== undefined) _config.persist = options.persist;
      if (options.logSheet) _config.logSheet = options.logSheet;
      if (options.maxMemoryErrors) _config.maxMemoryErrors = options.maxMemoryErrors;
    }
  };
})();

// ============================================================================
// FUNÇÕES GLOBAIS DE COMPATIBILIDADE
// ============================================================================

/**
 * @deprecated Use ErrorHandler.handle()
 */
function handleError(error, context) {
  return ErrorHandler.handle(error, context);
}

// ============================================================================
// REGISTRO DO MÓDULO
// ============================================================================

Logger.log('✅ Core_Error carregado - ErrorHandler disponível');
