/**
 * @fileoverview Sistema de Tratamento de Erros de Nível Profissional
 * @version 1.0.0
 * @author UNIAE CRE Team
 * @created 2025-12-17
 * 
 * @description
 * Sistema centralizado de tratamento de erros que:
 * - Captura e registra stack traces completos
 * - Gera IDs de transação únicos para rastreabilidade
 * - Apresenta mensagens amigáveis ao usuário
 * - Classifica erros por tipo para tratamento adequado
 * - Suporta erros personalizados de negócio
 * 
 * @requires 0_Core_Safe_Globals.gs
 * @requires Core_Logger.gs
 * @requires Core_UX_Feedback.gs
 * 
 * @see UX_Feedback_Policy.md para padrões de feedback
 */

'use strict';

// ============================================================================
// CLASSES DE ERRO PERSONALIZADAS
// ============================================================================

/**
 * Erro base personalizado do sistema
 * @class
 * @extends Error
 * @param {string} message - Mensagem de erro
 * @param {Object} [details] - Detalhes adicionais
 */
function SystemError(message, details) {
  this.name = 'SystemError';
  this.message = message || 'Erro de sistema';
  this.details = details || null;
  this.timestamp = new Date();
  this.transactionId = null; // Será preenchido pelo handler
  
  // Captura stack trace
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, SystemError);
  } else {
    this.stack = (new Error()).stack;
  }
}
SystemError.prototype = Object.create(Error.prototype);
SystemError.prototype.constructor = SystemError;

/**
 * Erro de validação de dados
 * @class
 * @extends SystemError
 * @param {string} message - Mensagem descritiva
 * @param {Object} [details] - Campos inválidos e motivos
 * 
 * @example
 * throw new ValidationError('CNPJ inválido', {
 *   field: 'cnpj',
 *   value: '123',
 *   reason: 'Deve ter 14 dígitos'
 * });
 */
function ValidationError(message, details) {
  SystemError.call(this, message, details);
  this.name = 'ValidationError';
  this.isUserFacing = true; // Mensagem pode ser exibida ao usuário
}
ValidationError.prototype = Object.create(SystemError.prototype);
ValidationError.prototype.constructor = ValidationError;

/**
 * Erro de permissão/autorização
 * @class
 * @extends SystemError
 */
function PermissionError(message, details) {
  SystemError.call(this, message, details);
  this.name = 'PermissionError';
  this.isUserFacing = true;
}
PermissionError.prototype = Object.create(SystemError.prototype);
PermissionError.prototype.constructor = PermissionError;

/**
 * Erro de recurso não encontrado
 * @class
 * @extends SystemError
 */
function NotFoundError(message, details) {
  SystemError.call(this, message, details);
  this.name = 'NotFoundError';
  this.isUserFacing = true;
}
NotFoundError.prototype = Object.create(SystemError.prototype);
NotFoundError.prototype.constructor = NotFoundError;

/**
 * Erro de quota/limite excedido
 * @class
 * @extends SystemError
 */
function QuotaError(message, details) {
  SystemError.call(this, message, details);
  this.name = 'QuotaError';
  this.isUserFacing = true;
}
QuotaError.prototype = Object.create(SystemError.prototype);
QuotaError.prototype.constructor = QuotaError;

/**
 * Erro de rede/conexão
 * @class
 * @extends SystemError
 */
function NetworkError(message, details) {
  SystemError.call(this, message, details);
  this.name = 'NetworkError';
  this.isUserFacing = true;
}
NetworkError.prototype = Object.create(SystemError.prototype);
NetworkError.prototype.constructor = NetworkError;

/**
 * Erro de regra de negócio
 * @class
 * @extends SystemError
 * 
 * @example
 * throw new BusinessError('Nota fiscal já atestada', {
 *   notaId: 'NF-001',
 *   status: 'Atestada'
 * });
 */
function BusinessError(message, details) {
  SystemError.call(this, message, details);
  this.name = 'BusinessError';
  this.isUserFacing = true;
}
BusinessError.prototype = Object.create(SystemError.prototype);
BusinessError.prototype.constructor = BusinessError;

/**
 * Erro de configuração do sistema
 * @class
 * @extends SystemError
 */
function ConfigurationError(message, details) {
  SystemError.call(this, message, details);
  this.name = 'ConfigurationError';
  this.isUserFacing = false; // Erro técnico, não exibir detalhes
}
ConfigurationError.prototype = Object.create(SystemError.prototype);
ConfigurationError.prototype.constructor = ConfigurationError;

// ============================================================================
// MÓDULO DE TRATAMENTO DE ERROS APRIMORADO
// ============================================================================

/**
 * Sistema centralizado de tratamento de erros
 * @namespace EnhancedErrorHandler
 */
var EnhancedErrorHandler = (function() {
  
  // --------------------------------------------------------------------------
  // CONFIGURAÇÃO
  // --------------------------------------------------------------------------
  
  var CONFIG = {
    /** Prefixo para IDs de erro */
    ERROR_ID_PREFIX: 'ERR',
    
    /** Se deve persistir erros na planilha */
    PERSIST_ERRORS: true,
    
    /** Nome da aba de log de erros */
    ERROR_LOG_SHEET: 'Error_Log',
    
    /** Máximo de erros a manter no log */
    MAX_ERROR_LOG_ROWS: 5000,
    
    /** Mensagem padrão para erros desconhecidos */
    DEFAULT_USER_MESSAGE: 'Ocorreu um erro inesperado. Por favor, tente novamente ou contacte o suporte.',
    
    /** Tipos de erro conhecidos */
    ERROR_TYPES: {
      VALIDATION: 'ValidationError',
      PERMISSION: 'PermissionError',
      NOT_FOUND: 'NotFoundError',
      QUOTA: 'QuotaError',
      NETWORK: 'NetworkError',
      BUSINESS: 'BusinessError',
      CONFIGURATION: 'ConfigurationError',
      SYSTEM: 'SystemError',
      UNKNOWN: 'UnknownError'
    }
  };
  
  // --------------------------------------------------------------------------
  // ESTADO INTERNO
  // --------------------------------------------------------------------------
  
  var _currentTransactionId = null;
  var _errorCount = 0;
  
  // --------------------------------------------------------------------------
  // FUNÇÕES AUXILIARES PRIVADAS
  // --------------------------------------------------------------------------
  
  /**
   * Gera ID único para o erro
   * @private
   * @returns {string} ID no formato ERR-timestamp-random
   */
  function _generateErrorId() {
    try {
      var timestamp = new Date().getTime().toString(36);
      var random = Math.random().toString(36).substring(2, 6);
      return CONFIG.ERROR_ID_PREFIX + '-' + timestamp + '-' + random;
    } catch (error) {
      Logger.log("Erro em _generateErrorId: " + error.message);
      throw error;
    }
  }
  
  /**
   * Obtém ou gera ID de transação
   * @private
   * @returns {string} ID de transação
   */
  function _getTransactionId() {
    // Tenta usar ID do UXFeedback se disponível
    if (typeof UXFeedback !== 'undefined' && UXFeedback.getCurrentTransactionId) {
      var txnId = UXFeedback.getCurrentTransactionId();
      if (txnId) return txnId;
    }
    
    // Usa ID interno ou gera novo
    if (!_currentTransactionId) {
      _currentTransactionId = _generateErrorId();
    }
    return _currentTransactionId;
  }
  
  /**
   * Classifica o tipo de erro baseado na mensagem e nome
   * @private
   * @param {Error} error - Erro a classificar
   * @returns {string} Tipo do erro
   */
  function _classifyError(error) {
    try {
      if (!error) return CONFIG.ERROR_TYPES.UNKNOWN;
    
      // Verifica se é um erro personalizado
      if (error.name && CONFIG.ERROR_TYPES[error.name.toUpperCase().replace('ERROR', '')]) {
        return error.name;
      }
    
      // Classifica por mensagem
      var message = (error.message || error.toString()).toLowerCase();
    
      if (message.includes('permiss') || message.includes('autoriza') || 
          message.includes('denied') || message.includes('acesso negado')) {
        return CONFIG.ERROR_TYPES.PERMISSION;
      }
    
      if (message.includes('não encontrad') || message.includes('not found') ||
          message.includes('does not exist')) {
        return CONFIG.ERROR_TYPES.NOT_FOUND;
      }
    
      if (message.includes('quota') || message.includes('limite') || 
          message.includes('exceeded') || message.includes('rate limit')) {
        return CONFIG.ERROR_TYPES.QUOTA;
      }
    
      if (message.includes('validação') || message.includes('inválid') || 
          message.includes('required') || message.includes('obrigatório')) {
        return CONFIG.ERROR_TYPES.VALIDATION;
      }
    
      if (message.includes('network') || message.includes('timeout') || 
          message.includes('conexão') || message.includes('fetch')) {
        return CONFIG.ERROR_TYPES.NETWORK;
      }
    
      if (message.includes('config') || message.includes('setup') ||
          message.includes('inicializ')) {
        return CONFIG.ERROR_TYPES.CONFIGURATION;
      }
    
      return CONFIG.ERROR_TYPES.UNKNOWN;
    } catch (error) {
      Logger.log("Erro em _classifyError: " + error.message);
      throw error;
    }
  }
  
  /**
   * Extrai stack trace formatado
   * @private
   * @param {Error} error - Erro
   * @returns {string} Stack trace formatado
   */
  function _extractStackTrace(error) {
    try {
      if (!error) return 'No stack trace available';
    
      if (error.stack) {
        // Limpa e formata o stack trace
        return error.stack
          .split('\n')
          .slice(0, 10) // Limita a 10 linhas
          .map(function(line) { return line.trim(); })
          .join('\n');
      }
    
      return 'Stack trace not captured';
    } catch (error) {
      Logger.log("Erro em _extractStackTrace: " + error.message);
      throw error;
    }
  }
  
  /**
   * Formata mensagem amigável para o usuário
   * @private
   * @param {Error} error - Erro
   * @param {string} context - Contexto da operação
   * @param {string} errorId - ID do erro
   * @returns {string} Mensagem formatada
   */
  function _formatUserMessage(error, context, errorId) {
    var errorType = _classifyError(error);
    var baseMsg = '';
    
    // Mensagens específicas por tipo
    switch (errorType) {
      case CONFIG.ERROR_TYPES.VALIDATION:
        // Erros de validação mostram a mensagem original
        baseMsg = error.message || 'Dados inválidos. Verifique os campos informados.';
        break;
        
      case CONFIG.ERROR_TYPES.PERMISSION:
        baseMsg = 'Você não tem permissão para realizar esta operação.\n' +
                  'Verifique se está logado com o usuário correto.';
        break;
        
      case CONFIG.ERROR_TYPES.NOT_FOUND:
        baseMsg = 'O recurso solicitado não foi encontrado.\n' +
                  'Verifique se os dados informados estão corretos.';
        break;
        
      case CONFIG.ERROR_TYPES.QUOTA:
        baseMsg = 'O limite de uso do sistema foi atingido.\n' +
                  'Aguarde alguns minutos ou tente novamente amanhã.';
        break;
        
      case CONFIG.ERROR_TYPES.NETWORK:
        baseMsg = 'Erro de conexão com o servidor.\n' +
                  'Verifique sua internet e tente novamente.';
        break;
        
      case CONFIG.ERROR_TYPES.BUSINESS:
        // Erros de negócio mostram a mensagem original
        baseMsg = error.message || 'Operação não permitida pelas regras de negócio.';
        break;
        
      case CONFIG.ERROR_TYPES.CONFIGURATION:
        baseMsg = 'Erro de configuração do sistema.\n' +
                  'Por favor, contacte o administrador.';
        break;
        
      default:
        baseMsg = CONFIG.DEFAULT_USER_MESSAGE;
    }
    
    // Adiciona contexto e ID
    var fullMessage = '';
    if (context) {
      fullMessage = 'Erro em: ' + context + '\n\n';
    }
    fullMessage += baseMsg;
    fullMessage += '\n\n─────────────────────────';
    fullMessage += '\nID do erro: ' + errorId;
    fullMessage += '\nInforme este ID ao suporte.';
    
    return fullMessage;
  }
  
  /**
   * Persiste erro na planilha de log
   * @private
   * @param {Object} errorData - Dados do erro
   */
  function _persistError(errorData) {
    if (!CONFIG.PERSIST_ERRORS) return;
    
    try {
      var ss = getSS();
      if (!ss) return;
      
      var sheet = ss.getSheetByName(CONFIG.ERROR_LOG_SHEET);
      
      // Cria aba se não existir
      if (!sheet) {
        sheet = ss.insertSheet(CONFIG.ERROR_LOG_SHEET);
        sheet.appendRow([
          'Timestamp', 'Error ID', 'Transaction ID', 'Type', 
          'Context', 'Message', 'User', 'Stack Trace', 'Details'
        ]);
        sheet.getRange(1, 1, 1, 9).setFontWeight('bold');
        sheet.setFrozenRows(1);
        
        // Protege a aba
        try {
          sheet.protect().setWarningOnly(true);
        } catch (e) { /* Ignora erro de proteção */ }
      }
      
      // Rotação de logs
      if (sheet.getLastRow() > CONFIG.MAX_ERROR_LOG_ROWS) {
        sheet.deleteRows(2, 1000);
      }
      
      // Adiciona registro
      sheet.appendRow([
        errorData.timestamp,
        errorData.errorId,
        errorData.transactionId,
        errorData.errorType,
        errorData.context,
        errorData.message,
        errorData.user,
        errorData.stackTrace,
        errorData.details ? JSON.stringify(errorData.details) : ''
      ]);
      
    } catch (e) {
      // Log silencioso se falhar persistência
      Logger.log('Falha ao persistir erro: ' + e.message);
    }
  }
  
  /**
   * Obtém email do usuário atual
   * @private
   * @returns {string} Email ou 'anonymous'
   */
  function _getCurrentUser() {
    try {
      try {
        return Session.getActiveUser().getEmail() || 'anonymous';
      } catch (e) {
        return 'anonymous';
      }
    } catch (error) {
      Logger.log("Erro em _getCurrentUser: " + error.message);
      throw error;
    }
  }
  
  // --------------------------------------------------------------------------
  // API PÚBLICA
  // --------------------------------------------------------------------------
  
  return {
    
    /**
     * Configuração do módulo
     */
    CONFIG: CONFIG,
    
    /**
     * Classes de erro exportadas
     */
    Errors: {
      SystemError: SystemError,
      ValidationError: ValidationError,
      PermissionError: PermissionError,
      NotFoundError: NotFoundError,
      QuotaError: QuotaError,
      NetworkError: NetworkError,
      BusinessError: BusinessError,
      ConfigurationError: ConfigurationError
    },

    /**
     * Trata um erro de forma centralizada
     * 
     * Esta é a função principal de tratamento de erros. Ela:
     * 1. Gera um ID único para o erro
     * 2. Captura o stack trace completo
     * 3. Registra no AppLogger com todos os detalhes
     * 4. Persiste na planilha Error_Log
     * 5. Exibe mensagem amigável ao usuário (se UI disponível)
     * 
     * @param {Error|string} error - Erro a tratar
     * @param {string} [context='Unknown'] - Contexto/operação onde ocorreu
     * @param {Object} [options] - Opções de tratamento
     * @param {boolean} [options.silent=false] - Não exibir alerta ao usuário
     * @param {boolean} [options.rethrow=false] - Re-lançar o erro após tratamento
     * @param {boolean} [options.persist=true] - Persistir no log de erros
     * @param {Object} [options.metadata] - Dados adicionais para logging
     * @returns {Object} Resultado padronizado do erro
     * 
     * @example
     * try {
     *   // operação arriscada
     * } catch (error) {
     *   return EnhancedErrorHandler.handle(error, 'Processamento de NF', {
     *     metadata: { notaId: 'NF-001' }
     *   });
     * }
     */
    handle: function(error, context, options) {
      options = options || {};
      context = context || 'Unknown Context';
      
      var silent = options.silent || false;
      var rethrow = options.rethrow || false;
      var persist = options.persist !== false;
      var metadata = options.metadata || null;
      
      _errorCount++;
      
      // Normaliza erro
      if (!error) {
        error = new Error('Erro desconhecido');
      } else if (typeof error === 'string') {
        error = new Error(error);
      }
      
      // Gera IDs
      var errorId = _generateErrorId();
      var transactionId = _getTransactionId();
      
      // Classifica erro
      var errorType = _classifyError(error);
      
      // Extrai stack trace
      var stackTrace = _extractStackTrace(error);
      
      // Monta dados do erro
      var errorData = {
        timestamp: new Date(),
        errorId: errorId,
        transactionId: transactionId,
        errorType: errorType,
        context: context,
        message: error.message || 'Erro desconhecido',
        user: _getCurrentUser(),
        stackTrace: stackTrace,
        details: error.details || metadata
      };
      
      // Log detalhado
      if (typeof AppLogger !== 'undefined') {
        AppLogger.error('Erro capturado: ' + context, {
          errorId: errorId,
          transactionId: transactionId,
          errorType: errorType,
          message: error.message,
          stack: stackTrace,
          details: errorData.details
        });
      } else {
        console.error('[ERROR] ' + context, errorData);
      }
      
      // Persiste no log
      if (persist) {
        _persistError(errorData);
      }
      
      // Exibe mensagem ao usuário
      if (!silent) {
        var userMessage = _formatUserMessage(error, context, errorId);
        
        if (typeof safeAlert === 'function') {
          safeAlert('❌ Erro', userMessage);
        } else {
          try {
            var ui = SpreadsheetApp.getUi();
            ui.alert('❌ Erro', userMessage, ui.ButtonSet.OK);
          } catch (uiError) {
            Logger.log('UI indisponível. Erro: ' + userMessage);
          }
        }
      }
      
      // Re-lança se solicitado
      if (rethrow) {
        throw error;
      }
      
      // Retorna resultado padronizado
      return {
        success: false,
        error: error.message || 'Erro desconhecido',
        errorId: errorId,
        transactionId: transactionId,
        errorType: errorType,
        context: context,
        timestamp: errorData.timestamp
      };
    },
    
    /**
     * Executa função com tratamento de erro automático
     * 
     * Wrapper que encapsula try/catch com tratamento centralizado.
     * 
     * @param {Function} fn - Função a executar
     * @param {string} [context] - Contexto da operação
     * @param {Object} [options] - Opções de tratamento
     * @returns {*} Resultado da função ou objeto de erro
     * 
     * @example
     * var result = EnhancedErrorHandler.tryCatch(function() {
     *   return processarDados(dados);
     * }, 'Processamento de Dados');
     * 
     * if (result.success !== false) {
     *   // Sucesso
     * }
     */
    tryCatch: function(fn, context, options) {
      try {
        var result = fn();
        // Se a função retornou um objeto com success, preserva
        if (result && typeof result === 'object' && 'success' in result) {
          return result;
        }
        return { success: true, data: result };
      } catch (error) {
        return this.handle(error, context, options);
      }
    },
    
    /**
     * Executa função assíncrona com tratamento de erro
     * 
     * @param {Function} fn - Função a executar
     * @param {string} [context] - Contexto
     * @param {Object} [options] - Opções
     * @returns {Object} Resultado ou erro
     */
    tryCatchAsync: function(fn, context, options) {
      var self = this;
      try {
        var result = fn();
        return { success: true, data: result };
      } catch (error) {
        return self.handle(error, context, options);
      }
    },
    
    /**
     * Cria um erro personalizado
     * 
     * @param {string} type - Tipo do erro (ValidationError, BusinessError, etc.)
     * @param {string} message - Mensagem
     * @param {Object} [details] - Detalhes adicionais
     * @returns {Error} Erro personalizado
     * 
     * @example
     * throw EnhancedErrorHandler.createError('ValidationError', 'CNPJ inválido', {
     *   field: 'cnpj',
     *   value: '123'
     * });
     */
    createError: function(type, message, details) {
      switch (type) {
        case 'ValidationError':
          return new ValidationError(message, details);
        case 'PermissionError':
          return new PermissionError(message, details);
        case 'NotFoundError':
          return new NotFoundError(message, details);
        case 'QuotaError':
          return new QuotaError(message, details);
        case 'NetworkError':
          return new NetworkError(message, details);
        case 'BusinessError':
          return new BusinessError(message, details);
        case 'ConfigurationError':
          return new ConfigurationError(message, details);
        default:
          return new SystemError(message, details);
      }
    },
    
    /**
     * Verifica se um erro é de um tipo específico
     * 
     * @param {Error} error - Erro a verificar
     * @param {string} type - Tipo esperado
     * @returns {boolean} true se for do tipo
     */
    isErrorType: function(error, type) {
      if (!error) return false;
      return error.name === type || _classifyError(error) === type;
    },
    
    /**
     * Define o ID de transação atual
     * 
     * @param {string} transactionId - ID de transação
     */
    setTransactionId: function(transactionId) {
      _currentTransactionId = transactionId;
    },
    
    /**
     * Limpa o ID de transação atual
     */
    clearTransactionId: function() {
      _currentTransactionId = null;
    },
    
    /**
     * Obtém estatísticas de erros
     * 
     * @returns {Object} Estatísticas
     */
    getStats: function() {
      return {
        errorCount: _errorCount,
        currentTransactionId: _currentTransactionId
      };
    },
    
    /**
     * Busca erros no log por critérios
     * 
     * @param {Object} criteria - Critérios de busca
     * @param {string} [criteria.errorId] - ID do erro
     * @param {string} [criteria.transactionId] - ID da transação
     * @param {string} [criteria.errorType] - Tipo do erro
     * @param {Date} [criteria.startDate] - Data inicial
     * @param {Date} [criteria.endDate] - Data final
     * @param {number} [criteria.limit=50] - Limite de resultados
     * @returns {Array} Erros encontrados
     */
    searchErrors: function(criteria) {
      try {
        criteria = criteria || {};
        var limit = criteria.limit || 50;
      
        try {
          var ss = getSS();
          var sheet = ss.getSheetByName(CONFIG.ERROR_LOG_SHEET);
        
          if (!sheet || sheet.getLastRow() < 2) {
            return [];
          }
        
          var data = sheet.getDataRange().getValues();
          var headers = data[0];
          var results = [];
        
          for (var i = data.length - 1; i >= 1 && results.length < limit; i--) {
            var row = data[i];
            var match = true;
          
            // Aplica filtros
            if (criteria.errorId && row[1] !== criteria.errorId) match = false;
            if (criteria.transactionId && row[2] !== criteria.transactionId) match = false;
            if (criteria.errorType && row[3] !== criteria.errorType) match = false;
            if (criteria.startDate && new Date(row[0]) < criteria.startDate) match = false;
            if (criteria.endDate && new Date(row[0]) > criteria.endDate) match = false;
          
            if (match) {
              var errorObj = {};
              headers.forEach(function(header, index) {
                errorObj[header.toLowerCase().replace(/ /g, '_')] = row[index];
              });
              results.push(errorObj);
            }
          }
        
          return results;
        
        } catch (e) {
          AppLogger.warn('Erro ao buscar logs de erro', { error: e.message });
          return [];
        }
      } catch (error) {
        Logger.log("Erro em searchErrors: " + error.message);
        throw error;
      }
    }
  };
})();

// ============================================================================
// FUNÇÕES GLOBAIS DE CONVENIÊNCIA
// ============================================================================

/**
 * Trata erro de forma centralizada
 * @param {Error} error - Erro
 * @param {string} context - Contexto
 * @param {Object} [options] - Opções
 * @returns {Object} Resultado
 */
function handleCriticalError(error, context, options) {
  return EnhancedErrorHandler.handle(error, context, options);
}

/**
 * Executa com tratamento de erro
 * @param {Function} fn - Função
 * @param {string} context - Contexto
 * @param {Object} [options] - Opções
 * @returns {*} Resultado
 */
function tryCatchSafe(fn, context, options) {
  return EnhancedErrorHandler.tryCatch(fn, context, options);
}

/**
 * Cria erro de validação
 * @param {string} message - Mensagem
 * @param {Object} [details] - Detalhes
 * @returns {ValidationError} Erro
 */
function createValidationError(message, details) {
  return new ValidationError(message, details);
}

/**
 * Cria erro de negócio
 * @param {string} message - Mensagem
 * @param {Object} [details] - Detalhes
 * @returns {BusinessError} Erro
 */
function createBusinessError(message, details) {
  return new BusinessError(message, details);
}

// ============================================================================
// COMPATIBILIDADE COM ErrorHandler EXISTENTE
// ============================================================================

// Estende ErrorHandler existente se disponível
if (typeof ErrorHandler !== 'undefined') {
  ErrorHandler.handleCritical = function(error, context, options) {
    return EnhancedErrorHandler.handle(error, context, options);
  };
  
  ErrorHandler.Errors = EnhancedErrorHandler.Errors;
}

// Alias global para compatibilidade
var EnhancedError = EnhancedErrorHandler;

// ============================================================================
// REGISTRO DO MÓDULO
// ============================================================================

Logger.log('✅ Core_Error_Enhanced carregado - Sistema de erros profissional disponível');
