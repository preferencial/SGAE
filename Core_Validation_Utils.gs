/**
 * @fileoverview Utilitários de Validação Unificados
 * @version 5.0.0
 *
 * Fornece validação robusta para todos os módulos do sistema.
 * Previne erros de "Cannot read properties of undefined".
 *
 * @author UNIAE CRE Team
 * @created 2025-12-04
 */

'use strict';

/**
 * Módulo de Validação Unificado
 */
var ValidationUtils = (function() {

  // ============================================================================
  // VALIDAÇÕES BÁSICAS
  // ============================================================================

  /**
   * Verifica se valor existe (não é null, undefined ou vazio)
   * @param {*} value - Valor a verificar
   * @returns {boolean}
   */
  function exists(value) {
    return value !== null && value !== undefined && value !== '';
  }

  /**
   * Verifica se é objeto válido
   * @param {*} obj - Objeto a verificar
   * @returns {boolean}
   */
  function isObject(obj) {
    return obj !== null && typeof obj === 'object' && !Array.isArray(obj);
  }

  /**
   * Verifica se é array válido
   * @param {*} arr - Array a verificar
   * @returns {boolean}
   */
  function isArray(arr) {
    try {
      return Array.isArray(arr);
    } catch (error) {
      Logger.log("Erro em isArray: " + error.message);
      throw error;
    }
  }

  /**
   * Verifica se é string não vazia
   * @param {*} str - String a verificar
   * @returns {boolean}
   */
  function isNonEmptyString(str) {
    try {
      return typeof str === 'string' && str.trim().length > 0;
    } catch (error) {
      Logger.log("Erro em isNonEmptyString: " + error.message);
      throw error;
    }
  }

  /**
   * Verifica se é número válido
   * @param {*} num - Número a verificar
   * @returns {boolean}
   */
  function isValidNumber(num) {
    return typeof num === 'number' && !isNaN(num) && isFinite(num);
  }

  /**
   * Verifica se é data válida
   * @param {*} date - Data a verificar
   * @returns {boolean}
   */
  function isValidDate(date) {
    if (!date) return false;
    var d = date instanceof Date ? date : new Date(date);
    return !isNaN(d.getTime());
  }

  // ============================================================================
  // ACESSO SEGURO A PROPRIEDADES
  // ============================================================================

  /**
   * Obtém propriedade de objeto de forma segura
   * @param {Object} obj - Objeto
   * @param {string} path - Caminho da propriedade (ex: "user.name" ou "items[0].id")
   * @param {*} defaultValue - Valor padrão se não encontrar
   * @returns {*} Valor da propriedade ou valor padrão
   */
  function safeGet(obj, path, defaultValue) {
    try {
      if (!obj || !path) return defaultValue;

      var parts = path.replace(/\[(\d+)\]/g, '.$1').split('.');
      var current = obj;

      for (var i = 0; i < parts.length; i++) {
        if (current === null || current === undefined) {
          return defaultValue;
        }
        current = current[parts[i]];
      }

      return current !== undefined ? current : defaultValue;
    } catch (error) {
      Logger.log("Erro em safeGet: " + error.message);
      throw error;
    }
  }

  /**
   * Define propriedade de objeto de forma segura
   * @param {Object} obj - Objeto
   * @param {string} path - Caminho da propriedade
   * @param {*} value - Valor a definir
   * @returns {Object} Objeto modificado
   */
  function safeSet(obj, path, value) {
    try {
      if (!obj || !path) return obj;

      var parts = path.replace(/\[(\d+)\]/g, '.$1').split('.');
      var current = obj;

      for (var i = 0; i < parts.length - 1; i++) {
        var part = parts[i];
        if (current[part] === undefined || current[part] === null) {
          current[part] = isNaN(parseInt(parts[i + 1])) ? {} : [];
        }
        current = current[part];
      }

      current[parts[parts.length - 1]] = value;
      return obj;
    } catch (error) {
      Logger.log("Erro em safeSet: " + error.message);
      throw error;
    }
  }

  // ============================================================================
  // VALIDAÇÃO DE OBJETOS
  // ============================================================================

  /**
   * Valida objeto contra schema
   * @param {Object} obj - Objeto a validar
   * @param {Object} schema - Schema de validação
   * @returns {Object} Resultado da validação
   */
  function validateObject(obj, schema) {
    try {
      var result = {
        valid: true,
        errors: [],
        warnings: []
      };

      if (!isObject(obj)) {
        result.valid = false;
        result.errors.push('Dados inválidos: esperado objeto');
        return result;
      }

      if (!isObject(schema)) {
        return result; // Sem schema, considera válido
      }

      // Valida campos obrigatórios
      if (schema.required && isArray(schema.required)) {
        schema.required.forEach(function(field) {
          if (!exists(obj[field])) {
            result.valid = false;
            result.errors.push(field + ' é obrigatório');
          }
        });
      }

      // Valida tipos
      if (schema.types && isObject(schema.types)) {
        Object.keys(schema.types).forEach(function(field) {
          if (exists(obj[field])) {
            var expectedType = schema.types[field];
            var actualType = typeof obj[field];

            if (expectedType === 'array' && !isArray(obj[field])) {
              result.valid = false;
              result.errors.push(field + ' deve ser um array');
            } else if (expectedType === 'date' && !isValidDate(obj[field])) {
              result.valid = false;
              result.errors.push(field + ' deve ser uma data válida');
            } else if (expectedType !== 'array' && expectedType !== 'date' && actualType !== expectedType) {
              result.valid = false;
              result.errors.push(field + ' deve ser do tipo ' + expectedType);
            }
          }
        });
      }

      // Valida valores permitidos
      if (schema.enum && isObject(schema.enum)) {
        Object.keys(schema.enum).forEach(function(field) {
          if (exists(obj[field])) {
            var allowedValues = schema.enum[field];
            if (isArray(allowedValues) && allowedValues.indexOf(obj[field]) === -1) {
              result.valid = false;
              result.errors.push(field + ' deve ser um dos valores: ' + allowedValues.join(', '));
            }
          }
        });
      }

      return result;
    } catch (error) {
      Logger.log("Erro em validateObject: " + error.message);
      throw error;
    }
  }

  // ============================================================================
  // VALIDAÇÕES ESPECÍFICAS DO DOMÍNIO
  // ============================================================================

  /**
   * Valida dados de nota fiscal
   * @param {Object} nf - Dados da nota fiscal
   * @returns {Object} Resultado da validação
   */
  function validateNotaFiscal(nf) {
    return validateObject(nf, {
      required: ['Numero_NF'],
      types: {
        Numero_NF: 'string',
        Valor_Total: 'number'
      },
      enum: {
        Status_NF: ['PENDENTE', 'RECEBIDA', 'CONFERIDA', 'ATESTADA', 'APROVADA', 'REJEITADA', 'CANCELADA']
      }
    });
  }

  /**
   * Valida dados de entrega
   * @param {Object} entrega - Dados da entrega
   * @returns {Object} Resultado da validação
   */
  function validateEntrega(entrega) {
    return validateObject(entrega, {
      required: ['Fornecedor', 'Unidade_Escolar'],
      types: {
        Quantidade_Solicitada: 'number',
        Quantidade_Entregue: 'number',
        Valor_Unitario: 'number'
      },
      enum: {
        Status_Entrega: ['AGENDADA', 'EM_TRANSITO', 'ENTREGUE', 'PARCIAL', 'RECUSADA', 'CANCELADA']
      }
    });
  }

  /**
   * Valida dados de recebimento
   * @param {Object} recebimento - Dados do recebimento
   * @returns {Object} Resultado da validação
   */
  function validateRecebimento(recebimento) {
    try {
      var result = {
        valid: true,
        errors: [],
        warnings: []
      };

      if (!isObject(recebimento)) {
        result.valid = false;
        result.errors.push('Dados de recebimento não fornecidos');
        return result;
      }

      // Campos obrigatórios
      var required = ['fornecedor', 'dataRecebimento'];
      required.forEach(function(field) {
        if (!exists(safeGet(recebimento, field))) {
          result.valid = false;
          result.errors.push(field.charAt(0).toUpperCase() + field.slice(1) + ' é obrigatório');
        }
      });

      // Valida temperatura se for produto perecível
      if (safeGet(recebimento, 'tipoGenero') === 'PERECIVEL') {
        if (!exists(safeGet(recebimento, 'temperatura'))) {
          result.warnings.push('Temperatura não informada para produto perecível');
        }
      }

      return result;
    } catch (error) {
      Logger.log("Erro em validateRecebimento: " + error.message);
      throw error;
    }
  }

  /**
   * Valida dados de processo SEI
   * @param {Object} processo - Dados do processo
   * @returns {Object} Resultado da validação
   */
  function validateProcessoSEI(processo) {
    try {
      var result = validateObject(processo, {
        required: ['Numero_Processo_SEI'],
        enum: {
          Status: ['ABERTO', 'EM_ANALISE', 'ATESTADO', 'LIQUIDADO', 'PAGO', 'CANCELADO']
        }
      });

      // Validação adicional do formato do número
      if (result.valid && processo.Numero_Processo_SEI) {
        var numero = processo.Numero_Processo_SEI.trim();
        if (numero.length < 10) {
          result.valid = false;
          result.errors.push('Número do processo SEI muito curto');
        }
      }

      return result;
    } catch (error) {
      Logger.log("Erro em validateProcessoSEI: " + error.message);
      throw error;
    }
  }

  /**
   * Valida dados de usuário
   * @param {Object} usuario - Dados do usuário
   * @returns {Object} Resultado da validação
   */
  function validateUsuario(usuario) {
    try {
      var result = validateObject(usuario, {
        required: ['email', 'nome'],
        types: {
          email: 'string',
          nome: 'string'
        }
      });

      // Valida formato do email
      if (result.valid && usuario.email) {
        if (!validarEmail(usuario.email)) {
          result.valid = false;
          result.errors.push('Email inválido');
        }
      }

      // Valida senha se fornecida
      if (usuario.senha && usuario.senha.length < 6) {
        result.valid = false;
        result.errors.push('Senha deve ter no mínimo 6 caracteres');
      }

      return result;
    } catch (error) {
      Logger.log("Erro em validateUsuario: " + error.message);
      throw error;
    }
  }

  // ============================================================================
  // SANITIZAÇÃO DE DADOS
  // ============================================================================

  /**
   * Sanitiza string removendo caracteres perigosos
   * @param {string} str - String a sanitizar
   * @returns {string} String sanitizada
   */
  function sanitizeString(str) {
    try {
      if (!str || typeof str !== 'string') return '';
      return str
        .replace(/[<>]/g, '') // Remove < e >
        .replace(/javascript:/gi, '') // Remove javascript:
        .replace(/on\w+=/gi, '') // Remove event handlers
        .trim();
    } catch (error) {
      Logger.log("Erro em sanitizeString: " + error.message);
      throw error;
    }
  }

  /**
   * Sanitiza objeto recursivamente
   * @param {Object} obj - Objeto a sanitizar
   * @returns {Object} Objeto sanitizado
   */
  function sanitizeObject(obj) {
    try {
      if (!isObject(obj)) return obj;

      var sanitized = {};
      Object.keys(obj).forEach(function(key) {
        var value = obj[key];
        if (typeof value === 'string') {
          sanitized[key] = sanitizeString(value);
        } else if (isObject(value)) {
          sanitized[key] = sanitizeObject(value);
        } else if (isArray(value)) {
          sanitized[key] = value.map(function(item) {
            return typeof item === 'string' ? sanitizeString(item) :
                   isObject(item) ? sanitizeObject(item) : item;
          });
        } else {
          sanitized[key] = value;
        }
      });

      return sanitized;
    } catch (error) {
      Logger.log("Erro em sanitizeObject: " + error.message);
      throw error;
    }
  }

  // ============================================================================
  // NORMALIZAÇÃO DE DADOS
  // ============================================================================

  /**
   * Normaliza dados de entrada preenchendo valores padrão
   * @param {Object} data - Dados de entrada
   * @param {Object} defaults - Valores padrão
   * @returns {Object} Dados normalizados
   */
  function normalizeWithDefaults(data, defaults) {
    try {
      if (!isObject(data)) data = {};
      if (!isObject(defaults)) return data;

      var result = {};

      // Copia defaults
      Object.keys(defaults).forEach(function(key) {
        result[key] = defaults[key];
      });

      // Sobrescreve com dados fornecidos
      Object.keys(data).forEach(function(key) {
        if (exists(data[key])) {
          result[key] = data[key];
        }
      });

      return result;
    } catch (error) {
      Logger.log("Erro em normalizeWithDefaults: " + error.message);
      throw error;
    }
  }

  // ============================================================================
  // API PÚBLICA
  // ============================================================================

  return {
    // Validações básicas
    exists: exists,
    isObject: isObject,
    isArray: isArray,
    isNonEmptyString: isNonEmptyString,
    isValidNumber: isValidNumber,
    isValidDate: isValidDate,

    // Acesso seguro
    safeGet: safeGet,
    safeSet: safeSet,

    // Validação de objetos
    validateObject: validateObject,

    // Validações específicas
    validateNotaFiscal: validateNotaFiscal,
    validateEntrega: validateEntrega,
    validateRecebimento: validateRecebimento,
    validateProcessoSEI: validateProcessoSEI,
    validateUsuario: validateUsuario,

    // Sanitização
    sanitizeString: sanitizeString,
    sanitizeObject: sanitizeObject,

    // Normalização
    normalizeWithDefaults: normalizeWithDefaults
  };
})();

// ============================================================================
// FUNÇÕES GLOBAIS DE CONVENIÊNCIA
// ============================================================================

/**
 * Obtém valor de propriedade de forma segura (global)
 * @param {Object} obj - Objeto
 * @param {string} path - Caminho
 * @param {*} defaultValue - Valor padrão
 * @returns {*}
 */
function safeGet(obj, path, defaultValue) {
  return ValidationUtils.safeGet(obj, path, defaultValue);
}

/**
 * Verifica se valor existe (global)
 * @param {*} value - Valor
 * @returns {boolean}
 */
function valueExists(value) {
  return ValidationUtils.exists(value);
}

/**
 * Valida e retorna erro ou null
 * @param {Object} data - Dados
 * @param {Array} requiredFields - Campos obrigatórios
 * @returns {string|null} Mensagem de erro ou null se válido
 */
function validateRequired(data, requiredFields) {
  if (!data) return 'Dados não fornecidos';

  for (var i = 0; i < requiredFields.length; i++) {
    var field = requiredFields[i];
    if (!ValidationUtils.exists(data[field])) {
      return field + ' é obrigatório';
    }
  }

  return null;
}

// Registro do módulo
if (typeof AppLogger !== 'undefined') {
  AppLogger.debug('Core_Validation_Utils carregado');
}
