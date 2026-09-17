/**
 * @fileoverview Módulo de Gestão de Fuso Horário Canônico
 * @version 1.0.0
 * @author UNIAE CRE Team
 * @created 2025-12-17
 * 
 * @description
 * Gerencia todas as operações de data/hora do sistema, garantindo
 * consistência temporal e conformidade com o fuso horário canônico.
 * 
 * O fuso horário de exibição é America/Sao_Paulo (UTC-3), que é o
 * fuso horário de operação do cliente (Distrito Federal, Brasil).
 * Internamente, datas são armazenadas em UTC para consistência.
 * 
 * @requires 0_Core_Safe_Globals.gs
 * @requires Core_Config.gs
 * 
 * Funcionalidades:
 * - Conversão entre UTC e fuso horário local
 * - Formatação de datas para exibição ao usuário
 * - Parsing de datas inseridas pelo usuário
 * - Detecção de horário de verão (DST)
 * - Validação de datas
 */

'use strict';

// ============================================================================
// CONFIGURAÇÃO DE FUSO HORÁRIO
// ============================================================================

/**
 * Configuração de fuso horário do sistema
 * @constant {Object}
 */
var TIMEZONE_CONFIG = {
  /**
   * Fuso horário canônico para exibição ao usuário
   * America/Sao_Paulo = UTC-3 (ou UTC-2 durante horário de verão)
   * 
   * Justificativa: O sistema opera no Distrito Federal, Brasil,
   * onde o fuso horário oficial é o de Brasília (America/Sao_Paulo).
   */
  CANONICAL_TIMEZONE: 'America/Sao_Paulo',
  
  /**
   * Fuso horário para armazenamento interno
   * Todas as datas são armazenadas em UTC para consistência
   */
  STORAGE_TIMEZONE: 'UTC',
  
  /**
   * Offset padrão em horas (sem DST)
   * Brasília = UTC-3
   */
  DEFAULT_OFFSET_HOURS: -3,
  
  /**
   * Formatos de data padrão
   */
  FORMATS: {
    /** Formato brasileiro completo: 17/12/2025 14:30:45 */
    DATETIME_BR: 'dd/MM/yyyy HH:mm:ss',
    
    /** Formato brasileiro sem segundos: 17/12/2025 14:30 */
    DATETIME_BR_SHORT: 'dd/MM/yyyy HH:mm',
    
    /** Apenas data brasileira: 17/12/2025 */
    DATE_BR: 'dd/MM/yyyy',
    
    /** Apenas hora: 14:30:45 */
    TIME_FULL: 'HH:mm:ss',
    
    /** Hora sem segundos: 14:30 */
    TIME_SHORT: 'HH:mm',
    
    /** Formato ISO 8601: 2025-12-17T14:30:45 */
    ISO_8601: "yyyy-MM-dd'T'HH:mm:ss",
    
    /** Formato ISO apenas data: 2025-12-17 */
    ISO_DATE: 'yyyy-MM-dd',
    
    /** Formato para logs: 2025-12-17 14:30:45.123 */
    LOG_FORMAT: 'yyyy-MM-dd HH:mm:ss.SSS',
    
    /** Formato para nomes de arquivo: 2025-12-17_143045 */
    FILENAME: 'yyyy-MM-dd_HHmmss'
  },
  
  /**
   * Meses em português
   */
  MONTHS_PT: [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ],
  
  /**
   * Dias da semana em português
   */
  WEEKDAYS_PT: [
    'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
    'Quinta-feira', 'Sexta-feira', 'Sábado'
  ],
  
  /**
   * Dias da semana abreviados
   */
  WEEKDAYS_SHORT_PT: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
};

// ============================================================================
// MÓDULO TIMEZONE MANAGER
// ============================================================================

var TimezoneManager = (function() {
  
  // --------------------------------------------------------------------------
  // FUNÇÕES AUXILIARES PRIVADAS
  // --------------------------------------------------------------------------
  
  /**
   * Obtém o fuso horário do script (configurado no projeto GAS)
   * @private
   * @returns {string} Fuso horário do script
   */
  function getScriptTimezone() {
    try {
      return Session.getScriptTimeZone();
    } catch (e) {
      return TIMEZONE_CONFIG.CANONICAL_TIMEZONE;
    }
  }
  
  /**
   * Valida se o valor é uma data válida
   * @private
   * @param {*} value - Valor a validar
   * @returns {boolean} true se for data válida
   */
  function isValidDate(value) {
    if (!value) return false;
    if (value instanceof Date) {
      return !isNaN(value.getTime());
    }
    var parsed = new Date(value);
    return !isNaN(parsed.getTime());
  }
  
  /**
   * Converte valor para objeto Date
   * @private
   * @param {*} value - Valor a converter
   * @returns {Date|null} Objeto Date ou null se inválido
   */
  function toDate(value) {
    if (!value) return null;
    if (value instanceof Date) {
      return isNaN(value.getTime()) ? null : value;
    }
    var parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  
  /**
   * Calcula informações de DST para uma data específica
   * @private
   * @param {Date} date - Data a verificar
   * @returns {Object} Informações de DST
   */
  function getDSTInfo(date) {
    if (!date || !(date instanceof Date)) {
      date = new Date();
    }
    
    // Obtém offset atual
    var jan = new Date(date.getFullYear(), 0, 1);
    var jul = new Date(date.getFullYear(), 6, 1);
    
    var janOffset = jan.getTimezoneOffset();
    var julOffset = jul.getTimezoneOffset();
    var currentOffset = date.getTimezoneOffset();
    
    // No hemisfério sul, DST é no verão (dezembro-março)
    var standardOffset = Math.max(janOffset, julOffset);
    var dstOffset = Math.min(janOffset, julOffset);
    
    // Se offsets são iguais, não há DST neste ano
    if (janOffset === julOffset) {
      return {
        isDST: false,
        currentOffset: currentOffset,
        standardOffset: currentOffset,
        dstOffset: currentOffset,
        offsetHours: -currentOffset / 60
      };
    }
    
    var isDST = currentOffset === dstOffset;
    
    return {
      isDST: isDST,
      currentOffset: currentOffset,
      standardOffset: standardOffset,
      dstOffset: dstOffset,
      offsetHours: -currentOffset / 60
    };
  }
  
  // --------------------------------------------------------------------------
  // API PÚBLICA
  // --------------------------------------------------------------------------
  
  return {
    
    /**
     * Configuração exportada
     */
    CONFIG: TIMEZONE_CONFIG,
    
    /**
     * Obtém a data/hora atual no fuso horário canônico
     * 
     * @returns {Date} Data atual
     * 
     * @example
     * var agora = TimezoneManager.getCanonicalNow();
     * // Retorna Date no fuso America/Sao_Paulo
     */
    getCanonicalNow: function() {
      return new Date();
    },
    
    /**
     * Obtém a data/hora atual formatada para exibição
     * 
     * @param {string} [format] - Formato desejado (padrão: DATETIME_BR)
     * @returns {string} Data formatada
     * 
     * @example
     * var agora = TimezoneManager.getNowFormatted();
     * // "17/12/2025 14:30:45"
     * 
     * var agoraISO = TimezoneManager.getNowFormatted('ISO_8601');
     * // "2025-12-17T14:30:45"
     */
    getNowFormatted: function(format) {
      return this.formatDateForUser(new Date(), format);
    },
    
    /**
     * Formata uma data para exibição ao usuário no fuso horário canônico
     * 
     * @param {Date|string|number} date - Data a formatar
     * @param {string} [format] - Formato (chave de FORMATS ou string de formato)
     * @returns {string} Data formatada ou string vazia se inválida
     * 
     * @example
     * var formatted = TimezoneManager.formatDateForUser(new Date(), 'DATE_BR');
     * // "17/12/2025"
     * 
     * var custom = TimezoneManager.formatDateForUser(date, 'dd/MM/yyyy HH:mm');
     * // "17/12/2025 14:30"
     */
    formatDateForUser: function(date, format) {
      var dateObj = toDate(date);
      if (!dateObj) return '';
      
      // Resolve formato
      var formatString = format || 'DATETIME_BR';
      if (TIMEZONE_CONFIG.FORMATS[formatString]) {
        formatString = TIMEZONE_CONFIG.FORMATS[formatString];
      }
      
      try {
        return Utilities.formatDate(
          dateObj,
          TIMEZONE_CONFIG.CANONICAL_TIMEZONE,
          formatString
        );
      } catch (e) {
        AppLogger.warn('Erro ao formatar data', { date: date, format: format, error: e.message });
        return '';
      }
    },
    
    /**
     * Converte uma data para UTC para armazenamento
     * 
     * @param {Date|string} date - Data no fuso horário local
     * @returns {Date} Data em UTC
     * 
     * @example
     * var utcDate = TimezoneManager.dateToUTC(localDate);
     */
    dateToUTC: function(date) {
      var dateObj = toDate(date);
      if (!dateObj) return null;
      
      // Cria nova data com os componentes UTC
      return new Date(Date.UTC(
        dateObj.getFullYear(),
        dateObj.getMonth(),
        dateObj.getDate(),
        dateObj.getHours(),
        dateObj.getMinutes(),
        dateObj.getSeconds(),
        dateObj.getMilliseconds()
      ));
    },
    
    /**
     * Converte uma data UTC para o fuso horário canônico
     * 
     * @param {Date|string} utcDate - Data em UTC
     * @returns {Date} Data no fuso horário local
     */
    utcToLocal: function(utcDate) {
      try {
        var dateObj = toDate(utcDate);
        if (!dateObj) return null;
      
        // Formata em UTC e parseia no fuso local
        var utcString = Utilities.formatDate(
          dateObj,
          'UTC',
          "yyyy-MM-dd'T'HH:mm:ss"
        );
      
        return new Date(utcString);
      } catch (error) {
        Logger.log("Erro em utcToLocal: " + error.message);
        throw error;
      }
    },

    /**
     * Analisa uma string de data inserida pelo usuário
     * Assume que a data está no fuso horário canônico (America/Sao_Paulo)
     * 
     * @param {string} dateString - String de data (ex: "17/12/2025" ou "17/12/2025 14:30")
     * @param {string} [format] - Formato esperado (padrão: detecta automaticamente)
     * @returns {Date|null} Objeto Date ou null se inválido
     * 
     * @example
     * var date = TimezoneManager.parseDateFromUser('17/12/2025');
     * var dateTime = TimezoneManager.parseDateFromUser('17/12/2025 14:30');
     */
    parseDateFromUser: function(dateString, format) {
      try {
        if (!dateString || typeof dateString !== 'string') return null;
      
        dateString = dateString.trim();
        if (!dateString) return null;
      
        var day, month, year, hours, minutes, seconds;
        hours = 0; minutes = 0; seconds = 0;
      
        // Tenta formato brasileiro: dd/MM/yyyy [HH:mm[:ss]]
        var brMatch = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
        if (brMatch) {
          day = parseInt(brMatch[1], 10);
          month = parseInt(brMatch[2], 10) - 1; // Mês é 0-indexed
          year = parseInt(brMatch[3], 10);
          if (brMatch[4]) hours = parseInt(brMatch[4], 10);
          if (brMatch[5]) minutes = parseInt(brMatch[5], 10);
          if (brMatch[6]) seconds = parseInt(brMatch[6], 10);
        
          var date = new Date(year, month, day, hours, minutes, seconds);
          return isValidDate(date) ? date : null;
        }
      
        // Tenta formato ISO: yyyy-MM-dd[THH:mm[:ss]]
        var isoMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?$/);
        if (isoMatch) {
          year = parseInt(isoMatch[1], 10);
          month = parseInt(isoMatch[2], 10) - 1;
          day = parseInt(isoMatch[3], 10);
          if (isoMatch[4]) hours = parseInt(isoMatch[4], 10);
          if (isoMatch[5]) minutes = parseInt(isoMatch[5], 10);
          if (isoMatch[6]) seconds = parseInt(isoMatch[6], 10);
        
          var isoDate = new Date(year, month, day, hours, minutes, seconds);
          return isValidDate(isoDate) ? isoDate : null;
        }
      
        // Fallback: tenta parsing nativo
        var parsed = new Date(dateString);
        return isValidDate(parsed) ? parsed : null;
      } catch (error) {
        Logger.log("Erro em parseDateFromUser: " + error.message);
        throw error;
      }
    },
    
    /**
     * Verifica se o horário de verão (DST) está ativo para uma data
     * 
     * Nota: O Brasil suspendeu o horário de verão em 2019, mas esta
     * função permanece para compatibilidade e auditoria histórica.
     * 
     * @param {Date} [date] - Data a verificar (padrão: agora)
     * @returns {boolean} true se DST está ativo
     * 
     * @example
     * var isDST = TimezoneManager.isDSTActive(new Date('2018-12-15'));
     * // true (antes da suspensão do DST)
     */
    isDSTActive: function(date) {
      var info = getDSTInfo(date);
      return info.isDST;
    },
    
    /**
     * Obtém informações detalhadas sobre DST para uma data
     * 
     * @param {Date} [date] - Data a verificar
     * @returns {Object} Informações de DST
     * 
     * @example
     * var info = TimezoneManager.getDSTInfo();
     * // { isDST: false, currentOffset: 180, offsetHours: -3, ... }
     */
    getDSTInfo: function(date) {
      return getDSTInfo(date);
    },
    
    /**
     * Obtém o offset atual em horas
     * 
     * @returns {number} Offset em horas (ex: -3 para Brasília)
     */
    getCurrentOffsetHours: function() {
      var info = getDSTInfo(new Date());
      return info.offsetHours;
    },
    
    /**
     * Valida se uma data é válida
     * 
     * @param {*} value - Valor a validar
     * @returns {boolean} true se for data válida
     */
    isValidDate: function(value) {
      return isValidDate(value);
    },
    
    /**
     * Converte para objeto Date de forma segura
     * 
     * @param {*} value - Valor a converter
     * @returns {Date|null} Date ou null
     */
    toDate: function(value) {
      return toDate(value);
    },
    
    /**
     * Obtém o nome do mês em português
     * 
     * @param {number|Date} monthOrDate - Índice do mês (0-11) ou Date
     * @returns {string} Nome do mês
     */
    getMonthName: function(monthOrDate) {
      try {
        var index;
        if (monthOrDate instanceof Date) {
          index = monthOrDate.getMonth();
        } else {
          index = parseInt(monthOrDate, 10);
        }
        return TIMEZONE_CONFIG.MONTHS_PT[index] || '';
      } catch (error) {
        Logger.log("Erro em getMonthName: " + error.message);
        throw error;
      }
    },
    
    /**
     * Obtém o nome do dia da semana em português
     * 
     * @param {number|Date} dayOrDate - Índice do dia (0-6) ou Date
     * @param {boolean} [short=false] - Se true, retorna abreviado
     * @returns {string} Nome do dia
     */
    getWeekdayName: function(dayOrDate, short) {
      try {
        var index;
        if (dayOrDate instanceof Date) {
          index = dayOrDate.getDay();
        } else {
          index = parseInt(dayOrDate, 10);
        }
      
        if (short) {
          return TIMEZONE_CONFIG.WEEKDAYS_SHORT_PT[index] || '';
        }
        return TIMEZONE_CONFIG.WEEKDAYS_PT[index] || '';
      } catch (error) {
        Logger.log("Erro em getWeekdayName: " + error.message);
        throw error;
      }
    },
    
    /**
     * Formata data de forma amigável (ex: "Hoje às 14:30", "Ontem às 10:00")
     * 
     * @param {Date|string} date - Data a formatar
     * @returns {string} Data formatada de forma amigável
     */
    formatRelative: function(date) {
      var dateObj = toDate(date);
      if (!dateObj) return '';
      
      var now = new Date();
      var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      var dateDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
      
      var diffDays = Math.floor((today - dateDay) / (1000 * 60 * 60 * 24));
      var timeStr = this.formatDateForUser(dateObj, 'TIME_SHORT');
      
      if (diffDays === 0) {
        return 'Hoje às ' + timeStr;
      } else if (diffDays === 1) {
        return 'Ontem às ' + timeStr;
      } else if (diffDays === -1) {
        return 'Amanhã às ' + timeStr;
      } else if (diffDays > 0 && diffDays < 7) {
        return this.getWeekdayName(dateObj) + ' às ' + timeStr;
      } else {
        return this.formatDateForUser(dateObj, 'DATE_BR') + ' às ' + timeStr;
      }
    },
    
    /**
     * Calcula diferença entre duas datas
     * 
     * @param {Date} date1 - Primeira data
     * @param {Date} date2 - Segunda data
     * @param {string} [unit='days'] - Unidade: 'days', 'hours', 'minutes', 'seconds'
     * @returns {number} Diferença na unidade especificada
     */
    dateDiff: function(date1, date2, unit) {
      var d1 = toDate(date1);
      var d2 = toDate(date2);
      if (!d1 || !d2) return NaN;
      
      var diffMs = d2.getTime() - d1.getTime();
      
      switch (unit) {
        case 'seconds':
          return Math.floor(diffMs / 1000);
        case 'minutes':
          return Math.floor(diffMs / (1000 * 60));
        case 'hours':
          return Math.floor(diffMs / (1000 * 60 * 60));
        case 'days':
        default:
          return Math.floor(diffMs / (1000 * 60 * 60 * 24));
      }
    },
    
    /**
     * Adiciona tempo a uma data
     * 
     * @param {Date} date - Data base
     * @param {number} amount - Quantidade a adicionar
     * @param {string} unit - Unidade: 'days', 'hours', 'minutes', 'months', 'years'
     * @returns {Date} Nova data
     */
    addTime: function(date, amount, unit) {
      var dateObj = toDate(date);
      if (!dateObj) return null;
      
      var result = new Date(dateObj.getTime());
      
      switch (unit) {
        case 'years':
          result.setFullYear(result.getFullYear() + amount);
          break;
        case 'months':
          result.setMonth(result.getMonth() + amount);
          break;
        case 'days':
          result.setDate(result.getDate() + amount);
          break;
        case 'hours':
          result.setHours(result.getHours() + amount);
          break;
        case 'minutes':
          result.setMinutes(result.getMinutes() + amount);
          break;
        case 'seconds':
          result.setSeconds(result.getSeconds() + amount);
          break;
      }
      
      return result;
    },
    
    /**
     * Obtém início do dia (00:00:00)
     * 
     * @param {Date} [date] - Data (padrão: hoje)
     * @returns {Date} Início do dia
     */
    startOfDay: function(date) {
      var dateObj = toDate(date) || new Date();
      return new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 0, 0, 0, 0);
    },
    
    /**
     * Obtém fim do dia (23:59:59.999)
     * 
     * @param {Date} [date] - Data (padrão: hoje)
     * @returns {Date} Fim do dia
     */
    endOfDay: function(date) {
      var dateObj = toDate(date) || new Date();
      return new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 23, 59, 59, 999);
    },
    
    /**
     * Verifica se uma data está dentro de um período
     * 
     * @param {Date} date - Data a verificar
     * @param {Date} startDate - Início do período
     * @param {Date} endDate - Fim do período
     * @returns {boolean} true se está no período
     */
    isDateInRange: function(date, startDate, endDate) {
      var d = toDate(date);
      var start = toDate(startDate);
      var end = toDate(endDate);
      
      if (!d || !start || !end) return false;
      
      return d >= start && d <= end;
    },
    
    /**
     * Obtém o fuso horário canônico configurado
     * 
     * @returns {string} Nome do fuso horário
     */
    getCanonicalTimezone: function() {
      return TIMEZONE_CONFIG.CANONICAL_TIMEZONE;
    },
    
    /**
     * Obtém o fuso horário do script GAS
     * 
     * @returns {string} Fuso horário do script
     */
    getScriptTimezone: function() {
      return getScriptTimezone();
    }
  };
})();

// ============================================================================
// FUNÇÕES GLOBAIS DE CONVENIÊNCIA
// ============================================================================

/**
 * Formata data para exibição (substitui formatDate de 0_Core_Safe_Globals.gs)
 * @param {Date|string} date - Data a formatar
 * @param {string} [format] - Formato desejado
 * @returns {string} Data formatada
 */
function formatDateForUser(date, format) {
  return TimezoneManager.formatDateForUser(date, format);
}

/**
 * Obtém data/hora atual formatada
 * @param {string} [format] - Formato desejado
 * @returns {string} Data formatada
 */
function getNowFormatted(format) {
  return TimezoneManager.getNowFormatted(format);
}

/**
 * Analisa data inserida pelo usuário
 * @param {string} dateString - String de data
 * @returns {Date|null} Objeto Date
 */
function parseDateFromUser(dateString) {
  return TimezoneManager.parseDateFromUser(dateString);
}

// ============================================================================
// REGISTRO DO MÓDULO
// ============================================================================

Logger.log('✅ Core_Timezone_Manager carregado - Fuso horário: ' + TIMEZONE_CONFIG.CANONICAL_TIMEZONE);
