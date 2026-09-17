/**
 * @fileoverview Padrão de Resposta Unificado para todas as operações CRUD
 * @version 1.0.0
 * @description Define estruturas de resposta padronizadas para garantir consistência
 * em todas as operações do sistema.
 */

'use strict';

/**
 * Classe para criar respostas padronizadas
 * @namespace StandardResponse
 */
var StandardResponse = (function() {
  
  /**
   * Cria uma resposta de sucesso padronizada
   * @param {*} data - Dados a serem retornados
   * @param {string} [message] - Mensagem opcional de sucesso
   * @param {Object} [meta] - Metadados adicionais (paginação, etc)
   * @returns {Object} Resposta padronizada de sucesso
   */
  function success(data, message, meta) {
    try {
      var response = {
        success: true,
        data: data,
        message: message || 'Operação realizada com sucesso',
        timestamp: new Date().toISOString()
      };
    
      if (meta) {
        response.meta = meta;
      }
    
      return response;
    } catch (error) {
      Logger.log("Erro em success: " + error.message);
      throw error;
    }
  }
  
  /**
   * Cria uma resposta de erro padronizada
   * @param {string} message - Mensagem de erro
   * @param {string} [code] - Código do erro
   * @param {Object} [details] - Detalhes adicionais do erro
   * @returns {Object} Resposta padronizada de erro
   */
  function error(message, code, details) {
    try {
      var response = {
        success: false,
        error: {
          message: message || 'Erro desconhecido',
          code: code || 'UNKNOWN_ERROR',
          timestamp: new Date().toISOString()
        }
      };
    
      if (details) {
        response.error.details = details;
      }
    
      return response;
    } catch (error) {
      Logger.log("Erro em error: " + error.message);
      throw error;
    }
  }
  
  /**
   * Cria uma resposta de lista paginada
   * @param {Array} items - Lista de itens
   * @param {number} total - Total de itens
   * @param {number} page - Página atual
   * @param {number} pageSize - Tamanho da página
   * @returns {Object} Resposta padronizada com paginação
   */
  function paginated(items, total, page, pageSize) {
    return success(items, null, {
      pagination: {
        total: total,
        page: page,
        pageSize: pageSize,
        totalPages: Math.ceil(total / pageSize),
        hasNext: (page * pageSize) < total,
        hasPrev: page > 1
      }
    });
  }
  
  /**
   * Cria uma resposta de validação com erros
   * @param {Array} validationErrors - Lista de erros de validação
   * @returns {Object} Resposta padronizada de erro de validação
   */
  function validationError(validationErrors) {
    try {
      var errorList = Array.isArray(validationErrors) ? validationErrors : [validationErrors];
      return {
        success: false,
        data: null,
        error: 'Dados inválidos',
        code: 'VALIDATION_ERROR',
        validationErrors: errorList,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      Logger.log("Erro em validationError: " + error.message);
      throw error;
    }
  }
  
  /**
   * Cria uma resposta de operação CRUD
   * @param {string} operation - Tipo de operação (CREATE, READ, UPDATE, DELETE)
   * @param {*} data - Dados resultantes
   * @param {string} entityName - Nome da entidade
   * @returns {Object} Resposta padronizada de CRUD
   */
  function crud(operation, data, entityName) {
    var messages = {
      CREATE: entityName + ' criado(a) com sucesso',
      READ: entityName + ' recuperado(a) com sucesso',
      UPDATE: entityName + ' atualizado(a) com sucesso',
      DELETE: entityName + ' removido(a) com sucesso'
    };
    
    return success(data, messages[operation] || 'Operação realizada');
  }
  
  /**
   * Wrapper para executar função com tratamento de erro padronizado
   * @param {Function} fn - Função a ser executada
   * @param {string} [errorCode] - Código de erro padrão
   * @returns {Object} Resposta padronizada
   */
  function wrap(fn, errorCode) {
    try {
      var result = fn();
      if (result && typeof result === 'object' && 'success' in result) {
        return result;
      }
      return success(result);
    } catch (e) {
      console.error('Erro em operação: ' + e.message);
      return error(e.message, errorCode || 'OPERATION_ERROR', {
        stack: e.stack
      });
    }
  }
  
  /**
   * Cria uma resposta de recurso não encontrado
   * @param {string} message - Mensagem de erro
   * @returns {Object} Resposta padronizada de erro
   */
  function notFound(message) {
    return error(message || 'Recurso não encontrado', 'NOT_FOUND');
  }

  /**
   * Valida dados de entrada
   * @param {Object} data - Dados a validar
   * @param {Array} requiredFields - Campos obrigatórios
   * @returns {Object} {valid: boolean, errors: Array}
   */
  function validateInput(data, requiredFields) {
    try {
      var errors = [];
      if (!data) {
        return { valid: false, errors: ['Dados não fornecidos'] };
      }
    
      // Garantir que requiredFields é um array
      var fields = Array.isArray(requiredFields) ? requiredFields : [];
    
      fields.forEach(function(field) {
        if (data[field] === undefined || data[field] === null || data[field] === '') {
          errors.push('Campo obrigatório ausente: ' + field);
        }
      });
    
      return {
        valid: errors.length === 0,
        errors: errors
      };
    } catch (error) {
      Logger.log("Erro em validateInput: " + error.message);
      throw error;
    }
  }

  return {
    success: success,
    error: error,
    paginated: paginated,
    validationError: validationError,
    notFound: notFound,
    validateInput: validateInput,
    crud: crud,
    wrap: wrap
  };
  
})();

// Aliases globais para compatibilidade
var ApiResponse = StandardResponse;

// Funções globais de conveniência
function apiSuccess(data, message) {
  return StandardResponse.success(data, message);
}

function apiError(message, code) {
  return StandardResponse.error(message, code);
}

function apiResponse(success, data, message) {
  if (success) {
    return StandardResponse.success(data, message);
  } else {
    return StandardResponse.error(message || 'Erro na operação', 'OPERATION_ERROR');
  }
}

Logger.log('✅ Core_Standard_Response carregado - StandardResponse e ApiResponse disponíveis');
