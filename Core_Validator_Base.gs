/**
 * @fileoverview Core_Validator_Base.gs
 * Módulo base de validação com funções genéricas.
 * @version 1.0.0
 */

'use strict';

var ValidatorBase = (function() {

  /**
   * Resultado de validação
   * @typedef {Object} ValidationResult
   * @property {boolean} valid - Se a validação passou
   * @property {string} message - Mensagem de erro (se inválido)
   */

  /**
   * Valida se um valor é string não vazia
   * @param {*} value - Valor a validar
   * @param {string} fieldName - Nome do campo (para mensagem de erro)
   * @returns {ValidationResult|undefined}
   */
  function validateRequiredString(value, fieldName) {
    try {
      if (value == null || value == undefined || String(value).trim() == '') {
        return {
          valid: false,
          message: fieldName + ' é obrigatório'
        };
      }
    } catch (error) {
      Logger.log("Erro em validateRequiredString: " + error.message);
      throw error;
    }
  }

  /**
   * Valida string com limite de tamanho
   * @param {*} value - Valor a validar
   * @param {string} fieldName - Nome do campo
   * @param {number} maxLength - Tamanho máximo (padrão: 500)
   * @returns {ValidationResult|undefined}
   */
  function validateStringLength(value, fieldName, maxLength) {
    try {
      maxLength = maxLength || 500; // Default hardcoded if VALIDATION constant not available
      var str = String(value || '');

      if (str.length > maxLength) {
        return {
          valid: false,
          message: fieldName + ' excede o tamanho máximo de ' + maxLength + ' caracteres'
        };
      }
    } catch (error) {
      Logger.log("Erro em validateStringLength: " + error.message);
      throw error;
    }
  }

  /**
   * Valida número positivo
   * @param {*} value - Valor a validar
   * @param {string} fieldName - Nome do campo
   * @param {boolean} required - Se é obrigatório (padrão: true)
   * @returns {ValidationResult|undefined}
   */
  function validatePositiveNumber(value, fieldName, required) {
    try {
      required = required !== false;

      if (value == null || value == undefined || value === '') {
        if (required) {
          return {
            valid: false,
            message: fieldName + ' é obrigatório'
          };
        }
        return; // Optional and empty is valid
      }

      var num = Number(value);
      if (isNaN(num)) {
        return {
          valid: false,
          message: fieldName + ' deve ser um número válido'
        };
      }

      if (num < 0) {
        return {
          valid: false,
          message: fieldName + ' deve ser um número positivo'
        };
      }
    } catch (error) {
      Logger.log("Erro em validatePositiveNumber: " + error.message);
      throw error;
    }
  }

  /**
   * Valida data
   * @param {*} value - Valor a validar
   * @param {string} fieldName - Nome do campo
   * @param {boolean} required - Se é obrigatório (padrão: true)
   * @returns {ValidationResult|undefined}
   */
  function validateDate(value, fieldName, required) {
    required = required !== false;

    if (value == null || value == undefined || value === '') {
      if (required) {
        return {
          valid: false,
          message: fieldName + ' é obrigatório'
        };
      }
      return; // Optional and empty is valid
    }

    var date;
    if (value instanceof Date) {
      date = value;
    } else {
      date = new Date(value);
    }

    if (isNaN(date.getTime())) {
      return {
        valid: false,
        message: fieldName + ' deve ser uma data válida'
      };
    }
  }

  /**
   * Valida email
   * @param {*} value - Valor a validar
   * @param {string} fieldName - Nome do campo
   * @param {boolean} required - Se é obrigatório (padrão: false)
   * @returns {ValidationResult|undefined}
   */
  function validateEmail(value, fieldName, required) {
    try {
      required = required || false;

      if (value == null || value == undefined || String(value).trim() == '') {
        if (required) {
          return {
            valid: false,
            message: fieldName + ' é obrigatório'
          };
        }
        return;
      }

      var email = String(value).trim();
      var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Simple regex if VALIDATION constant not available
      if (!emailRegex.test(email)) {
        return {
          valid: false,
          message: fieldName + ' deve ser um email válido'
        };
      }
    } catch (error) {
      Logger.log("Erro em validateEmail: " + error.message);
      throw error;
    }
  }

  /**
   * Valida objeto (não nulo, é objeto)
   * @param {*} value - Valor a validar
   * @param {string} fieldName - Nome do campo
   * @returns {ValidationResult|undefined}
   */
  function validateObject(value, fieldName) {
    try {
      if (!value || typeof value != 'object' || Array.isArray(value)) {
        return {
          valid: false,
          message: fieldName + ' deve ser um objeto válido'
        };
      }
    } catch (error) {
      Logger.log("Erro em validateObject: " + error.message);
      throw error;
    }
  }

  /**
   * Sanitiza string removendo caracteres perigosos
   * @param {*} value - Valor a sanitizar
   * @param {number} maxLength - Tamanho máximo (padrão: 500)
   * @returns {string} String sanitizada
   */
  function sanitizeString(value, maxLength) {
    try {
      if (value == null || value == undefined) return '';

      maxLength = maxLength || 500;
      var str = String(value)
        .trim()
        .substring(0, maxLength)
        .replace(/[<>\"\']/g, ''); // Remove caracteres HTML perigosos

      return str;
    } catch (error) {
      Logger.log("Erro em sanitizeString: " + error.message);
      throw error;
    }
  }

  /**
   * Sanitiza número
   * @param {*} value - Valor a sanitizar
   * @param {number} defaultValue - Valor padrão se inválido
   * @returns {number} Número sanitizado
   */
  function sanitizeNumber(value, defaultValue) {
    try {
      if (value == null || value == undefined || value === '') {
        return defaultValue !== undefined ? defaultValue : 0;
      }

      var num = Number(value);
      if (isNaN(num) || !isFinite(num)) {
        return defaultValue !== undefined ? defaultValue : 0;
      }
      return num;
    } catch (error) {
      Logger.log("Erro em sanitizeNumber: " + error.message);
      throw error;
    }
  }

  // Public API
  return {
    validateRequiredString: validateRequiredString,
    validateStringLength: validateStringLength,
    validatePositiveNumber: validatePositiveNumber,
    validateDate: validateDate,
    validateEmail: validateEmail,
    validateObject: validateObject,
    sanitizeString: sanitizeString,
    sanitizeNumber: sanitizeNumber
  };

})();
