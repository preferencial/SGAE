/**
 * @fileoverview Utilitários para Modo Estrito - UNIAE CRE
 * @version 5.0.0
 *
 * Este arquivo fornece funções utilitárias que ajudam a evitar
 * problemas comuns de variáveis globais implícitas e outros
 * erros de JavaScript.
 *
 * PROBLEMA: Em JavaScript, atribuir valor a uma variável não declarada
 * cria uma variável global implícita, o que pode causar bugs difíceis
 * de rastrear.
 *
 * SOLUÇÃO: Usar 'use strict' e funções auxiliares para garantir
 * que variáveis sejam sempre declaradas.
 */

'use strict';

// ============================================================================
// FUNÇÕES DE ATRIBUIÇÃO SEGURA
// ============================================================================

/**
 * Atribui valor com fallback seguro (evita undefined)
 * @param {*} value - Valor a verificar
 * @param {*} defaultValue - Valor padrão se value for undefined/null
 * @returns {*} value ou defaultValue
 */
function assignWithDefault(value, defaultValue) {
  return (value !== undefined && value !== null) ? value : defaultValue;
}

/**
 * Atribui valor apenas se for válido (não undefined, não null, não NaN)
 * @param {*} value - Valor a verificar
 * @param {*} fallback - Valor fallback
 * @returns {*}
 */
function assignIfValid(value, fallback) {
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'number' && isNaN(value)) return fallback;
  return value;
}

/**
 * Garante que um valor seja um array
 * @param {*} value - Valor a verificar
 * @returns {Array}
 */
function ensureArray(value) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null) return [];
  return [value];
}

/**
 * Garante que um valor seja um objeto
 * @param {*} value - Valor a verificar
 * @returns {Object}
 */
function ensureObject(value) {
  try {
    if (value && typeof value === 'object' && !Array.isArray(value)) return value;
    return {};
  } catch (error) {
    Logger.log("Erro em ensureObject: " + error.message);
    throw error;
  }
}

/**
 * Garante que um valor seja uma string
 * @param {*} value - Valor a verificar
 * @param {string} [defaultValue=''] - Valor padrão
 * @returns {string}
 */
function ensureString(value, defaultValue) {
  try {
    if (typeof value === 'string') return value;
    if (value === undefined || value === null) return defaultValue || '';
    return String(value);
  } catch (error) {
    Logger.log("Erro em ensureString: " + error.message);
    throw error;
  }
}

/**
 * Garante que um valor seja um número
 * @param {*} value - Valor a verificar
 * @param {number} [defaultValue=0] - Valor padrão
 * @returns {number}
 */
function ensureNumber(value, defaultValue) {
  try {
    var num = Number(value);
    if (isNaN(num)) return defaultValue !== undefined ? defaultValue : 0;
    return num;
  } catch (error) {
    Logger.log("Erro em ensureNumber: " + error.message);
    throw error;
  }
}

/**
 * Garante que um valor seja um booleano
 * @param {*} value - Valor a verificar
 * @param {boolean} [defaultValue=false] - Valor padrão
 * @returns {boolean}
 */
function ensureBoolean(value, defaultValue) {
  if (typeof value === 'boolean') return value;
  if (value === undefined || value === null) return defaultValue !== undefined ? defaultValue : false;
  return Boolean(value);
}

// ============================================================================
// FUNÇÕES DE INICIALIZAÇÃO SEGURA
// ============================================================================

/**
 * Inicializa opções com valores padrão
 * @param {Object} options - Opções fornecidas
 * @param {Object} defaults - Valores padrão
 * @returns {Object} Opções mescladas
 */
function initOptions(options, defaults) {
  options = ensureObject(options);
  defaults = ensureObject(defaults);

  var result = {};

  // Copiar defaults
  for (var key in defaults) {
    if (defaults.hasOwnProperty(key)) {
      result[key] = defaults[key];
    }
  }

  // Sobrescrever com options
  for (var key in options) {
    if (options.hasOwnProperty(key) && options[key] !== undefined) {
      result[key] = options[key];
    }
  }

  return result;
}

/**
 * Inicializa um contador seguro
 * @param {*} value - Valor inicial
 * @returns {number}
 */
function initCounter(value) {
  try {
    var num = Number(value);
    return isNaN(num) ? 0 : Math.floor(num);
  } catch (error) {
    Logger.log("Erro em initCounter: " + error.message);
    throw error;
  }
}

/**
 * Inicializa um acumulador seguro
 * @param {*} value - Valor inicial
 * @returns {number}
 */
function initAccumulator(value) {
  try {
    var num = Number(value);
    return isNaN(num) ? 0 : num;
  } catch (error) {
    Logger.log("Erro em initAccumulator: " + error.message);
    throw error;
  }
}

// ============================================================================
// FUNÇÕES DE LOOP SEGURO
// ============================================================================

/**
 * Itera sobre um array de forma segura
 * @param {Array} arr - Array a iterar
 * @param {Function} callback - Função callback(item, index, array)
 * @param {*} [thisArg] - Contexto para callback
 */
function safeForEach(arr, callback, thisArg) {
  arr = ensureArray(arr);
  for (var i = 0; i < arr.length; i++) {
    callback.call(thisArg, arr[i], i, arr);
  }
}

/**
 * Mapeia um array de forma segura
 * @param {Array} arr - Array a mapear
 * @param {Function} callback - Função callback(item, index, array)
 * @param {*} [thisArg] - Contexto para callback
 * @returns {Array}
 */
function safeMap(arr, callback, thisArg) {
  try {
    arr = ensureArray(arr);
    var result = [];
    for (var i = 0; i < arr.length; i++) {
      result.push(callback.call(thisArg, arr[i], i, arr));
    }
    return result;
  } catch (error) {
    Logger.log("Erro em safeMap: " + error.message);
    throw error;
  }
}

/**
 * Filtra um array de forma segura
 * @param {Array} arr - Array a filtrar
 * @param {Function} callback - Função callback(item, index, array)
 * @param {*} [thisArg] - Contexto para callback
 * @returns {Array}
 */
function safeFilter(arr, callback, thisArg) {
  try {
    arr = ensureArray(arr);
    var result = [];
    for (var i = 0; i < arr.length; i++) {
      if (callback.call(thisArg, arr[i], i, arr)) {
        result.push(arr[i]);
      }
    }
    return result;
  } catch (error) {
    Logger.log("Erro em safeFilter: " + error.message);
    throw error;
  }
}

/**
 * Reduz um array de forma segura
 * @param {Array} arr - Array a reduzir
 * @param {Function} callback - Função callback(accumulator, item, index, array)
 * @param {*} initialValue - Valor inicial
 * @returns {*}
 */
function safeReduce(arr, callback, initialValue) {
  arr = ensureArray(arr);
  var accumulator = initialValue;
  var startIndex = 0;

  if (initialValue === undefined) {
    if (arr.length === 0) {
      throw new TypeError('Reduce of empty array with no initial value');
    }
    accumulator = arr[0];
    startIndex = 1;
  }

  for (var i = startIndex; i < arr.length; i++) {
    accumulator = callback(accumulator, arr[i], i, arr);
  }

  return accumulator;
}

// ============================================================================
// FUNÇÕES DE OBJETO SEGURO
// ============================================================================

/**
 * Obtém chaves de um objeto de forma segura
 * @param {Object} obj - Objeto
 * @returns {Array}
 */
function safeKeys(obj) {
  try {
    obj = ensureObject(obj);
    var keys = [];
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        keys.push(key);
      }
    }
    return keys;
  } catch (error) {
    Logger.log("Erro em safeKeys: " + error.message);
    throw error;
  }
}

/**
 * Obtém valores de um objeto de forma segura
 * @param {Object} obj - Objeto
 * @returns {Array}
 */
function safeValues(obj) {
  try {
    obj = ensureObject(obj);
    var values = [];
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        values.push(obj[key]);
      }
    }
    return values;
  } catch (error) {
    Logger.log("Erro em safeValues: " + error.message);
    throw error;
  }
}

/**
 * Obtém entradas de um objeto de forma segura
 * @param {Object} obj - Objeto
 * @returns {Array} Array de [key, value]
 */
function safeEntries(obj) {
  try {
    obj = ensureObject(obj);
    var entries = [];
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        entries.push([key, obj[key]]);
      }
    }
    return entries;
  } catch (error) {
    Logger.log("Erro em safeEntries: " + error.message);
    throw error;
  }
}

// ============================================================================
// FUNÇÕES DE STRING SEGURA
// ============================================================================

/**
 * Faz trim de forma segura
 * @param {*} value - Valor
 * @returns {string}
 */
function safeTrim(value) {
  try {
    return ensureString(value).trim();
  } catch (error) {
    Logger.log("Erro em safeTrim: " + error.message);
    throw error;
  }
}

/**
 * Converte para maiúsculas de forma segura
 * @param {*} value - Valor
 * @returns {string}
 */
function safeUpperCase(value) {
  try {
    return ensureString(value).toUpperCase();
  } catch (error) {
    Logger.log("Erro em safeUpperCase: " + error.message);
    throw error;
  }
}

/**
 * Converte para minúsculas de forma segura
 * @param {*} value - Valor
 * @returns {string}
 */
function safeLowerCase(value) {
  try {
    return ensureString(value).toLowerCase();
  } catch (error) {
    Logger.log("Erro em safeLowerCase: " + error.message);
    throw error;
  }
}

/**
 * Faz split de forma segura
 * @param {*} value - Valor
 * @param {string} separator - Separador
 * @returns {Array}
 */
function safeSplit(value, separator) {
  try {
    var str = ensureString(value);
    if (!str) return [];
    return str.split(separator);
  } catch (error) {
    Logger.log("Erro em safeSplit: " + error.message);
    throw error;
  }
}

// ============================================================================
// FUNÇÕES DE DATA SEGURA
// ============================================================================

/**
 * Cria uma data de forma segura
 * @param {*} value - Valor de data
 * @returns {Date|null}
 */
function safeDate(value) {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;

  var date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Formata data de forma segura
 * @param {*} value - Valor de data
 * @param {string} [format='dd/MM/yyyy'] - Formato
 * @returns {string}
 */
function safeDateFormat(value, format) {
  try {
    var date = safeDate(value);
    if (!date) return '';

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
    Logger.log("Erro em safeDateFormat: " + error.message);
    throw error;
  }
}

// ============================================================================
// FUNÇÕES DE VALIDAÇÃO DE TIPO
// ============================================================================

/**
 * Verifica se é um array válido
 * @param {*} value - Valor
 * @returns {boolean}
 */
function isValidArray(value) {
  return Array.isArray(value) && value.length > 0;
}

/**
 * Verifica se é um objeto válido
 * @param {*} value - Valor
 * @returns {boolean}
 */
function isValidObject(value) {
  try {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  } catch (error) {
    Logger.log("Erro em isValidObject: " + error.message);
    throw error;
  }
}

/**
 * Verifica se é uma string válida (não vazia)
 * @param {*} value - Valor
 * @returns {boolean}
 */
function isValidString(value) {
  try {
    return typeof value === 'string' && value.trim().length > 0;
  } catch (error) {
    Logger.log("Erro em isValidString: " + error.message);
    throw error;
  }
}

/**
 * Verifica se é um número válido
 * @param {*} value - Valor
 * @returns {boolean}
 */
function isValidNumber(value) {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Verifica se é uma data válida
 * @param {*} value - Valor
 * @returns {boolean}
 */
function isValidDate(value) {
  if (!value) return false;
  var date = value instanceof Date ? value : new Date(value);
  return !isNaN(date.getTime());
}

// ============================================================================
// CONSTANTES ÚTEIS
// ============================================================================

/**
 * Valores padrão comuns
 */
var DEFAULTS = {
  STRING: '',
  NUMBER: 0,
  ARRAY: [],
  OBJECT: {},
  BOOLEAN: false,
  DATE: null,
  LIMIT: 100,
  PAGE_SIZE: 20,
  TIMEOUT: 30000,
  RETRY_COUNT: 3
};

// ============================================================================
// TESTES
// ============================================================================

/**
 * Testa as funções de modo estrito
 */
function testStrictModeUtils() {
  try {
    Logger.log('═══════════════════════════════════════════════════════════');
    Logger.log('   TESTE DE UTILITÁRIOS DE MODO ESTRITO');
    Logger.log('═══════════════════════════════════════════════════════════');

    var passed = 0;
    var failed = 0;

    // Teste assignWithDefault
    var test1 = assignWithDefault(undefined, 'default') === 'default';
    Logger.log((test1 ? '✅' : '❌') + ' assignWithDefault(undefined, "default")');
    if (test1) passed++; else failed++;

    var test2 = assignWithDefault('value', 'default') === 'value';
    Logger.log((test2 ? '✅' : '❌') + ' assignWithDefault("value", "default")');
    if (test2) passed++; else failed++;

    // Teste ensureArray
    var test3 = ensureArray(null).length === 0;
    Logger.log((test3 ? '✅' : '❌') + ' ensureArray(null)');
    if (test3) passed++; else failed++;

    var test4 = ensureArray([1,2,3]).length === 3;
    Logger.log((test4 ? '✅' : '❌') + ' ensureArray([1,2,3])');
    if (test4) passed++; else failed++;

    // Teste ensureNumber
    var test5 = ensureNumber('abc', 10) === 10;
    Logger.log((test5 ? '✅' : '❌') + ' ensureNumber("abc", 10)');
    if (test5) passed++; else failed++;

    var test6 = ensureNumber('42') === 42;
    Logger.log((test6 ? '✅' : '❌') + ' ensureNumber("42")');
    if (test6) passed++; else failed++;

    // Teste initOptions
    var test7 = initOptions({a: 1}, {a: 0, b: 2}).b === 2;
    Logger.log((test7 ? '✅' : '❌') + ' initOptions merge');
    if (test7) passed++; else failed++;

    // Teste safeMap
    var test8 = safeMap([1,2,3], function(x) { return x * 2; }).join(',') === '2,4,6';
    Logger.log((test8 ? '✅' : '❌') + ' safeMap');
    if (test8) passed++; else failed++;

    // Teste safeFilter
    var test9 = safeFilter([1,2,3,4], function(x) { return x > 2; }).length === 2;
    Logger.log((test9 ? '✅' : '❌') + ' safeFilter');
    if (test9) passed++; else failed++;

    // Teste isValidString
    var test10 = isValidString('hello') === true && isValidString('') === false;
    Logger.log((test10 ? '✅' : '❌') + ' isValidString');
    if (test10) passed++; else failed++;

    Logger.log('');
    Logger.log('Resultado: ' + passed + '/' + (passed + failed) + ' testes passaram');
    Logger.log('═══════════════════════════════════════════════════════════');

    return { passed: passed, failed: failed };
  } catch (error) {
    Logger.log("Erro em testStrictModeUtils: " + error.message);
    throw error;
  }
}

Logger.log('✅ Core_Strict_Mode_Utils.gs carregado');
