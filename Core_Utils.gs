/**
 * @fileoverview Core Utils - Funções Utilitárias Gerais
 * @version 1.0.0
 * @author UNIAE CRE Team
 * @created 2025-12-19
 * 
 * @description
 * Coleção de funções utilitárias para manipulação de strings, datas,
 * números e objetos, utilizadas em todo o sistema.
 */

'use strict';

var Utils = (function() {

  // ============================================================================
  // FORMATAÇÃO
  // ============================================================================

  function formatCNPJ(cnpj) {
    try {
      if (!cnpj) return '';
      var numeric = cnpj.replace(/\D/g, '');
      return numeric.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    } catch (error) {
      Logger.log("Erro em formatCNPJ: " + error.message);
      throw error;
    }
  }

  function formatCPF(cpf) {
    try {
      if (!cpf) return '';
      var numeric = cpf.replace(/\D/g, '');
      return numeric.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
    } catch (error) {
      Logger.log("Erro em formatCPF: " + error.message);
      throw error;
    }
  }

  function formatPhone(phone) {
    try {
      if (!phone) return '';
      var numeric = phone.replace(/\D/g, '');
      if (numeric.length === 11) {
        return numeric.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
      }
      return numeric.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
    } catch (error) {
      Logger.log("Erro em formatPhone: " + error.message);
      throw error;
    }
  }

  function formatCurrency(value) {
    try {
      if (value === undefined || value === null) return 'R$ 0,00';
      var num = Number(value);
      if (isNaN(num)) return 'R$ 0,00';
      return 'R$ ' + num.toFixed(2).replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    } catch (error) {
      Logger.log("Erro em formatCurrency: " + error.message);
      throw error;
    }
  }

  function formatDate(date, format) {
    try {
      if (!date) return '';
      if (!(date instanceof Date)) date = new Date(date);
      if (isNaN(date.getTime())) return '';
    
      format = format || 'dd/MM/yyyy';
      var day = String(date.getDate()).padStart(2, '0');
      var month = String(date.getMonth() + 1).padStart(2, '0');
      var year = date.getFullYear();
      var hours = String(date.getHours()).padStart(2, '0');
      var minutes = String(date.getMinutes()).padStart(2, '0');
      var seconds = String(date.getSeconds()).padStart(2, '0');
    
      return format
        .replace('dd', day)
        .replace('MM', month)
        .replace('yyyy', year)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
    } catch (error) {
      Logger.log("Erro em formatDate: " + error.message);
      throw error;
    }
  }

  // ============================================================================
  // MANIPULAÇÃO DE STRINGS
  // ============================================================================

  function removeAccents(str) {
    try {
      if (!str) return '';
      return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    } catch (error) {
      Logger.log("Erro em removeAccents: " + error.message);
      throw error;
    }
  }

  function capitalizeString(str) {
    try {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    } catch (error) {
      Logger.log("Erro em capitalizeString: " + error.message);
      throw error;
    }
  }

  function truncateString(str, length) {
    try {
      if (!str) return '';
      if (str.length <= length) return str;
      return str.substring(0, length) + '...';
    } catch (error) {
      Logger.log("Erro em truncateString: " + error.message);
      throw error;
    }
  }

  function checkEmptyValues(value) {
    try {
      if (value === undefined || value === null) return true;
      if (typeof value === 'string' && value.trim() === '') return true;
      if (Array.isArray(value) && value.length === 0) return true;
      if (typeof value === 'object' && Object.keys(value).length === 0) return true;
      return false;
    } catch (error) {
      Logger.log("Erro em checkEmptyValues: " + error.message);
      throw error;
    }
  }

  function validateEmail(email) {
    if (!email) return false;
    var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  // ============================================================================
  // DATAS
  // ============================================================================

  function calculateDaysDifference(date1, date2) {
    var d1 = new Date(date1);
    var d2 = new Date(date2);
    var diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  function addDaysToDate(date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  function checkBusinessDay(date) {
    var d = new Date(date);
    var day = d.getDay();
    return day !== 0 && day !== 6;
  }

  // ============================================================================
  // CONVERSÃO E TIPOS
  // ============================================================================

  function convertToNumberSafely(value, fallback) {
    try {
      var num = Number(value);
      return isNaN(num) ? (fallback !== undefined ? fallback : 0) : num;
    } catch (error) {
      Logger.log("Erro em convertToNumberSafely: " + error.message);
      throw error;
    }
  }

  function convertToBoolean(value) {
    if (typeof value === 'string') {
      var lower = value.toLowerCase();
      return lower === 'true' || lower === '1' || lower === 'sim' || lower === 'yes';
    }
    return Boolean(value);
  }

  function convertObjectToArray(obj, headers) {
    try {
      if (!obj) return [];
      // Se headers fornecidos, retorna valores na ordem dos headers
      if (headers && Array.isArray(headers)) {
        return headers.map(function(key) {
          return obj[key];
        });
      }
      // Caso contrário, retorna todos os valores
      return Object.keys(obj).map(function(key) {
        return obj[key];
      });
    } catch (error) {
      Logger.log("Erro em convertObjectToArray: " + error.message);
      throw error;
    }
  }

  function convertArrayToObject(arr, headers) {
    try {
      if (!arr) return {};
      var result = {};
      // Se headers fornecidos, mapeia array para objeto usando headers como chaves
      if (headers && Array.isArray(headers)) {
        headers.forEach(function(key, index) {
          result[key] = arr[index];
        });
        return result;
      }
      // Caso contrário, usa o campo keyField (comportamento legado)
      arr.forEach(function(item) {
        if (item && typeof item === 'object') {
          var keyField = Object.keys(item)[0];
          if (item[keyField]) {
            result[item[keyField]] = item;
          }
        }
      });
      return result;
    } catch (error) {
      Logger.log("Erro em convertArrayToObject: " + error.message);
      throw error;
    }
  }

  // ============================================================================
  // UTILITÁRIOS GERAIS
  // ============================================================================

  function generateId(prefix) {
    var uuid = Utilities.getUuid();
    if (prefix) {
      return prefix + '_' + uuid;
    }
    return uuid;
  }

  function generateUUID() {
    return Utilities.getUuid();
  }

  function cloneObject(obj) {
    try {
      try {
        if (!obj) return null;
        return JSON.parse(JSON.stringify(obj));
      } catch (error) {
        Logger.log("Erro em cloneObject: " + error.message);
        throw error;
      }
    } catch (error) {
      Logger.log("Erro em cloneObject: " + error.message);
      throw error;
    }
  }

  function mergeObjects(target, source) {
    var t = cloneObject(target) || {};
    var s = source || {};
    for (var key in s) {
      if (s.hasOwnProperty(key)) {
        t[key] = s[key];
      }
    }
    return t;
  }

  function safelyGetNestedProperty(obj, path) {
    if (!obj || !path) return undefined;
    var parts = path.split('.');
    var current = obj;
    for (var i = 0; i < parts.length; i++) {
      if (current === undefined || current === null) return undefined;
      current = current[parts[i]];
    }
    return current;
  }

  // ============================================================================
  // EXPORTAÇÃO PÚBLICA
  // ============================================================================

  return {
    // Estrutura aninhada para compatibilidade com testes
    format: {
      cnpj: formatCNPJ,
      cpf: formatCPF,
      phone: formatPhone,
      currency: formatCurrency,
      date: formatDate
    },
    string: {
      removeAccents: removeAccents,
      capitalize: capitalizeString,
      truncate: truncateString,
      isEmpty: checkEmptyValues,
      isValidEmail: validateEmail
    },
    date: {
      daysDiff: calculateDaysDifference,
      addDays: addDaysToDate,
      isBusinessDay: checkBusinessDay
    },
    convert: {
      toNumber: convertToNumberSafely,
      toBoolean: convertToBoolean,
      objectToArray: convertObjectToArray,
      arrayToObject: convertArrayToObject
    },

    // Exportações planas (mantidas para compatibilidade)
    formatCNPJ: formatCNPJ,
    formatCPF: formatCPF,
    formatPhone: formatPhone,
    formatCurrency: formatCurrency,
    formatDate: formatDate,
    removeAccents: removeAccents,
    capitalizeString: capitalizeString,
    truncateString: truncateString,
    checkEmptyValues: checkEmptyValues,
    validateEmail: validateEmail,
    calculateDaysDifference: calculateDaysDifference,
    addDaysToDate: addDaysToDate,
    checkBusinessDay: checkBusinessDay,
    convertToNumberSafely: convertToNumberSafely,
    convertToBoolean: convertToBoolean,
    convertObjectToArray: convertObjectToArray,
    convertArrayToObject: convertArrayToObject,
    generateId: generateId,
    generateUUID: generateUUID,
    cloneObject: cloneObject,
    clone: cloneObject, // Alias para testes
    mergeObjects: mergeObjects,
    merge: mergeObjects, // Alias para testes
    safelyGetNestedProperty: safelyGetNestedProperty,
    safeGet: safelyGetNestedProperty // Alias para testes
  };

})();

/**
 * Função global safeGet para compatibilidade
 */
function safeGet(obj, path, defaultValue) {
  return Utils.safelyGetNestedProperty(obj, path) !== undefined 
    ? Utils.safelyGetNestedProperty(obj, path) 
    : defaultValue;
}

Logger.log('✅ Core_Utils.gs carregado - Utils disponível');
