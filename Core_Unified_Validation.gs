/**
 * @fileoverview Sistema Unificado de Validação
 * @version 3.0.0
 * @description Consolida Core_Validacao.gs e Core_Input_Validation.gs
 *
 * MIGRAÇÃO:
 * - validateNotaFiscal() -> UnifiedValidation.notaFiscal()
 * - InputValidation -> UnifiedValidation (mantém compatibilidade)
 * - COMPLIANCE_VALIDATOR -> UnifiedValidation.compliance
 */

'use strict';

var UnifiedValidation = (function() {

  // ============================================================================
  // CONFIGURAÇÃO
  // ============================================================================

  var CONFIG = {
    MAX_STRING_LENGTH: 500,
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    CNPJ_LENGTH: 14,
    CPF_LENGTH: 11,
    NFE_KEY_LENGTH: 44,
    PASSWORD_MIN_LENGTH: 6
  };

  var TEMPERATURE_LIMITS = {
    CONGELADO: { min: -18, max: -12, descricao: 'produtos congelados' },
    RESFRIADO: { min: 0, max: 10, descricao: 'produtos resfriados' },
    CARNE_RESFRIADA: { min: 0, max: 7, descricao: 'carnes resfriadas' },
    PESCADO_RESFRIADO: { min: 0, max: 3, descricao: 'pescado resfriado' }
  };

  // ============================================================================
  // VALIDADORES BÁSICOS
  // ============================================================================

  function createResult(valid, message) {
    return { valid: valid, message: message || '' };
  }

  function validateRequired(value, fieldName) {
    try {
      if (value === null || value === undefined || String(value).trim() === '') {
        return createResult(false, fieldName + ' é obrigatório');
      }
      return createResult(true);
    } catch (error) {
      Logger.log("Erro em validateRequired: " + error.message);
      throw error;
    }
  }

  function validateString(value, fieldName, maxLength) {
    try {
      maxLength = maxLength || CONFIG.MAX_STRING_LENGTH;
      var str = String(value || '');

      if (str.length > maxLength) {
        return createResult(false, fieldName + ' excede o tamanho máximo de ' + maxLength + ' caracteres');
      }
      return createResult(true);
    } catch (error) {
      Logger.log("Erro em validateString: " + error.message);
      throw error;
    }
  }

  function validateNumber(value, fieldName, options) {
    try {
      options = options || {};
      var required = options.required !== false;
      var min = options.min;
      var max = options.max;

      if (value === null || value === undefined || value === '') {
        if (required) {
          return createResult(false, fieldName + ' é obrigatório');
        }
        return createResult(true);
      }

      var num = Number(value);
      if (isNaN(num)) {
        return createResult(false, fieldName + ' deve ser um número válido');
      }

      if (min !== undefined && num < min) {
        return createResult(false, fieldName + ' deve ser maior ou igual a ' + min);
      }

      if (max !== undefined && num > max) {
        return createResult(false, fieldName + ' deve ser menor ou igual a ' + max);
      }

      return createResult(true);
    } catch (error) {
      Logger.log("Erro em validateNumber: " + error.message);
      throw error;
    }
  }

  function validateDate(value, fieldName, required) {
    required = required !== false;

    if (value === null || value === undefined || value === '') {
      if (required) {
        return createResult(false, fieldName + ' é obrigatório');
      }
      return createResult(true);
    }

    var date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) {
      return createResult(false, fieldName + ' deve ser uma data válida');
    }

    return createResult(true);
  }

  function validateEmail(value, fieldName, required) {
    try {
      required = required || false;

      if (!value || String(value).trim() === '') {
        if (required) {
          return createResult(false, fieldName + ' é obrigatório');
        }
        return createResult(true);
      }

      if (!CONFIG.EMAIL_REGEX.test(String(value).trim())) {
        return createResult(false, fieldName + ' deve ser um email válido');
      }

      return createResult(true);
    } catch (error) {
      Logger.log("Erro em validateEmail: " + error.message);
      throw error;
    }
  }

  // ============================================================================
  // VALIDADORES DE DOCUMENTOS
  // ============================================================================

  function validateCNPJ(cnpj) {
    try {
      if (!cnpj) return false;

      cnpj = String(cnpj).replace(/[^\d]/g, '');
      if (cnpj.length !== CONFIG.CNPJ_LENGTH) return false;
      if (/^(\d)\1+$/.test(cnpj)) return false;

      // Validação dos dígitos verificadores
      var tamanho = cnpj.length - 2;
      var numeros = cnpj.substring(0, tamanho);
      var digitos = cnpj.substring(tamanho);
      var soma = 0;
      var pos = tamanho - 7;

      for (var i = tamanho; i >= 1; i--) {
        soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--;
        if (pos < 2) pos = 9;
      }

      var resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
      if (resultado !== parseInt(digitos.charAt(0), 10)) return false;

      tamanho++;
      numeros = cnpj.substring(0, tamanho);
      soma = 0;
      pos = tamanho - 7;

      for (var j = tamanho; j >= 1; j--) {
        soma += parseInt(numeros.charAt(tamanho - j), 10) * pos--;
        if (pos < 2) pos = 9;
      }

      resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
      return resultado === parseInt(digitos.charAt(1), 10);
    } catch (error) {
      Logger.log("Erro em validateCNPJ: " + error.message);
      throw error;
    }
  }

  function validateCPF(cpf) {
    try {
      if (!cpf) return false;

      cpf = String(cpf).replace(/[^\d]/g, '');
      if (cpf.length !== CONFIG.CPF_LENGTH) return false;
      if (/^(\d)\1+$/.test(cpf)) return false;

      // Validação simplificada
      var soma = 0;
      for (var i = 0; i < 9; i++) {
        soma += parseInt(cpf.charAt(i), 10) * (10 - i);
      }
      var resto = (soma * 10) % 11;
      if (resto === 10 || resto === 11) resto = 0;
      if (resto !== parseInt(cpf.charAt(9), 10)) return false;

      soma = 0;
      for (var j = 0; j < 10; j++) {
        soma += parseInt(cpf.charAt(j), 10) * (11 - j);
      }
      resto = (soma * 10) % 11;
      if (resto === 10 || resto === 11) resto = 0;

      return resto === parseInt(cpf.charAt(10), 10);
    } catch (error) {
      Logger.log("Erro em validateCPF: " + error.message);
      throw error;
    }
  }

  function validateChaveNFe(chave) {
    try {
      if (!chave) return false;
      var chaveNumeros = String(chave).replace(/[^\d]/g, '');
      return chaveNumeros.length === CONFIG.NFE_KEY_LENGTH;
    } catch (error) {
      Logger.log("Erro em validateChaveNFe: " + error.message);
      throw error;
    }
  }

  // ============================================================================
  // VALIDADORES DE ENTIDADES
  // ============================================================================

  function validateNotaFiscal(data) {
    try {
      var erros = [];
      var avisos = [];

      // Validação de entrada
      if (!data || typeof data !== 'object') {
        return {
          valid: false,
          valido: false,
          erros: ['Dados da nota fiscal não fornecidos'],
          avisos: [],
          errors: ['Dados da nota fiscal não fornecidos'],
          message: 'Dados da nota fiscal não fornecidos'
        };
      }

      // Campos obrigatórios
      var numero = data.numeroNF || data.notaFiscal || data.numero_nf;
      if (!numero || String(numero).trim() === '') {
        erros.push('Número da Nota Fiscal é obrigatório');
      }

      if (!data.fornecedor || String(data.fornecedor).trim() === '') {
        erros.push('Fornecedor é obrigatório');
      }

      // Valor
      var valor = data.valorTotal || data.valor_total;
      if (valor !== undefined && valor !== null && valor !== '') {
        if (isNaN(Number(valor)) || Number(valor) < 0) {
          erros.push('Valor total deve ser um número positivo');
        }
      }

      // CNPJ
      if (data.cnpj || data.cnpjFornecedor) {
        if (!validateCNPJ(data.cnpj || data.cnpjFornecedor)) {
          erros.push('CNPJ do fornecedor inválido');
        }
      } else {
        avisos.push('CNPJ do fornecedor não informado');
      }

      // Chave de acesso
      if (data.chaveAcesso) {
        if (!validateChaveNFe(data.chaveAcesso)) {
          erros.push('Chave de acesso da NF-e inválida (deve ter 44 dígitos)');
        }
      } else {
        avisos.push('Chave de acesso não informada');
      }

      // Data de emissão
      if (data.dataEmissao) {
        var dateResult = validateDate(data.dataEmissao, 'Data de emissão', false);
        if (!dateResult.valid) {
          erros.push(dateResult.message);
        }
      }

      return {
        valid: erros.length === 0,
        valido: erros.length === 0,
        erros: erros,
        avisos: avisos,
        errors: erros,
        message: erros.length > 0 ? erros.join('; ') : 'Validação OK'
      };
    } catch (error) {
      Logger.log("Erro em validateNotaFiscal: " + error.message);
      throw error;
    }
  }

  function validateEntrega(data) {
    try {
      var erros = [];
      var avisos = [];

      if (!data.dataEntrega) erros.push('Data de entrega é obrigatória');
      if (!data.produto) erros.push('Produto é obrigatório');
      if (!data.quantidadeEntregue && data.quantidadeEntregue !== 0) {
        erros.push('Quantidade entregue é obrigatória');
      }

      // Validação de temperatura para perecíveis
      if (data.tipoGenero === 'PERECIVEL' && data.temperaturaAferida !== undefined) {
        var limites = TEMPERATURE_LIMITS[data.tipoConservacao] || TEMPERATURE_LIMITS.RESFRIADO;
        if (data.temperaturaAferida > limites.max) {
          erros.push('Temperatura ' + data.temperaturaAferida + '°C excede limite de ' + limites.max + '°C');
        }
      }

      return {
        valid: erros.length === 0,
        valido: erros.length === 0,
        erros: erros,
        avisos: avisos
      };
    } catch (error) {
      Logger.log("Erro em validateEntrega: " + error.message);
      throw error;
    }
  }

  function validateRecusa(data) {
    try {
      var erros = [];
      var avisos = [];

      if (!data.dataRecusa) erros.push('Data de recusa é obrigatória');
      if (!data.produto) erros.push('Produto é obrigatório');
      if (!data.motivo && !data.motivoDetalhado) erros.push('Motivo da recusa é obrigatório');
      if (!data.responsavel && !data.responsavelRecusa) erros.push('Responsável é obrigatório');

      if (!data.registradoNoTermo) {
        avisos.push('A recusa deve ser registrada no Termo de Recebimento');
      }

      return {
        valid: erros.length === 0,
        valido: erros.length === 0,
        erros: erros,
        avisos: avisos
      };
    } catch (error) {
      Logger.log("Erro em validateRecusa: " + error.message);
      throw error;
    }
  }

  function validateGlosa(data) {
    try {
      var erros = [];

      if (!data.produto) erros.push('Produto/Item é obrigatório');
      if (!data.motivo) erros.push('Motivo da glosa é obrigatório');

      var qtd = validateNumber(data.quantidadeGlosada, 'Quantidade glosada', { min: 0 });
      if (!qtd.valid) erros.push(qtd.message);

      return {
        valid: erros.length === 0,
        valido: erros.length === 0,
        erros: erros,
        avisos: []
      };
    } catch (error) {
      Logger.log("Erro em validateGlosa: " + error.message);
      throw error;
    }
  }

  function validateRecebimentoUE(dados) {
    try {
      var erros = [];
      var avisos = [];

      if (!dados.unidadeEscolar) erros.push('Unidade Escolar é obrigatória');
      if (!dados.dataEntrega) erros.push('Data de Entrega é obrigatória');
      if (!dados.responsavel) erros.push('Responsável é obrigatório');
      if (!dados.fornecedor) erros.push('Fornecedor é obrigatório');

      // Cronologia
      if (dados.dataAtesto && dados.dataEntrega) {
        if (new Date(dados.dataAtesto) < new Date(dados.dataEntrega)) {
          erros.push('Data do atesto não pode ser anterior à data de entrega');
        }
      }

      // Validade
      if (dados.dataValidade) {
        var diasAteVencer = Math.floor((new Date(dados.dataValidade) - new Date()) / (1000 * 60 * 60 * 24));
        if (diasAteVencer < 0) {
          erros.push('Produto vencido');
        } else if (diasAteVencer < 4) {
          avisos.push('Validade próxima: ' + diasAteVencer + ' dias');
        }
      }

      return {
        valido: erros.length === 0,
        erros: erros,
        avisos: avisos,
        totalErros: erros.length,
        totalAvisos: avisos.length
      };
    } catch (error) {
      Logger.log("Erro em validateRecebimentoUE: " + error.message);
      throw error;
    }
  }

  function validateAnaliseComissao(dados) {
    try {
      var erros = [];
      var avisos = [];
      var MINIMO_MEMBROS = 3;

      if (!dados.membrosPresentes || dados.membrosPresentes.length < MINIMO_MEMBROS) {
        erros.push('Mínimo de ' + MINIMO_MEMBROS + ' membros necessários');
      }

      if (!dados.somaVerificada) erros.push('Verificação da soma é obrigatória');
      if (!dados.atestoEscolarVerificado) erros.push('Verificação do atesto escolar é obrigatória');
      if (!dados.conformidadeNFVerificada) erros.push('Verificação da conformidade da NF é obrigatória');

      return {
        valido: erros.length === 0,
        erros: erros,
        avisos: avisos,
        totalErros: erros.length,
        totalAvisos: avisos.length
      };
    } catch (error) {
      Logger.log("Erro em validateAnaliseComissao: " + error.message);
      throw error;
    }
  }

  // ============================================================================
  // SANITIZAÇÃO
  // ============================================================================

  function sanitizeString(value, maxLength) {
    try {
      if (value === null || value === undefined) return '';

      maxLength = maxLength || CONFIG.MAX_STRING_LENGTH;
      return String(value)
        .trim()
        .substring(0, maxLength)
        .replace(/[<>\"\']/g, '');
    } catch (error) {
      Logger.log("Erro em sanitizeString: " + error.message);
      throw error;
    }
  }

  function sanitizeNumber(value, defaultValue) {
    try {
      if (value === null || value === undefined || value === '') {
        return defaultValue !== undefined ? defaultValue : 0;
      }

      var num = Number(value);
      return isNaN(num) || !isFinite(num) ? (defaultValue || 0) : num;
    } catch (error) {
      Logger.log("Erro em sanitizeNumber: " + error.message);
      throw error;
    }
  }

  function sanitizeDate(value, defaultValue) {
    if (!value) return defaultValue || new Date();

    try {
      var date = new Date(value);
      return isNaN(date.getTime()) ? (defaultValue || new Date()) : date;
    } catch (e) {
      return defaultValue || new Date();
    }
  }

  // ============================================================================
  // UTILITÁRIOS
  // ============================================================================

  function calcularDiasUteis(dataInicio, dataFim) {
    var diasUteis = 0;
    var dataAtual = new Date(dataInicio);

    while (dataAtual < dataFim) {
      dataAtual.setDate(dataAtual.getDate() + 1);
      var diaSemana = dataAtual.getDay();
      if (diaSemana !== 0 && diaSemana !== 6) {
        diasUteis++;
      }
    }

    return diasUteis;
  }

  function obterLimitesTemperatura(tipoConservacao) {
    return TEMPERATURE_LIMITS[tipoConservacao] || TEMPERATURE_LIMITS.RESFRIADO;
  }

  // ============================================================================
  // API PÚBLICA
  // ============================================================================

  return {
    // Validadores básicos
    required: validateRequired,
    string: validateString,
    number: validateNumber,
    date: validateDate,
    email: validateEmail,

    // Validadores de documentos
    cnpj: validateCNPJ,
    cpf: validateCPF,
    chaveNFe: validateChaveNFe,

    // Validadores de entidades
    notaFiscal: validateNotaFiscal,
    entrega: validateEntrega,
    recusa: validateRecusa,
    glosa: validateGlosa,
    recebimentoUE: validateRecebimentoUE,
    analiseComissao: validateAnaliseComissao,

    // Sanitização
    sanitizeString: sanitizeString,
    sanitizeNumber: sanitizeNumber,
    sanitizeDate: sanitizeDate,

    // Utilitários
    calcularDiasUteis: calcularDiasUteis,
    obterLimitesTemperatura: obterLimitesTemperatura,

    // Constantes
    TEMPERATURE_LIMITS: TEMPERATURE_LIMITS,
    CONFIG: CONFIG,

    VERSION: '3.0.0'
  };
})();

// ============================================================================
// ALIASES PARA COMPATIBILIDADE
// ============================================================================

// Compatibilidade com InputValidation
var InputValidation = {
  validarRecebimentoUE: UnifiedValidation.recebimentoUE,
  validarAnaliseComissao: UnifiedValidation.analiseComissao,
  validarRecusa: UnifiedValidation.recusa,
  validarNotaFiscal: UnifiedValidation.notaFiscal,
  obterLimitesTemperatura: UnifiedValidation.obterLimitesTemperatura,
  calcularDiasUteis: UnifiedValidation.calcularDiasUteis,
  validarCNPJ: UnifiedValidation.cnpj,
  validarChaveNFe: UnifiedValidation.chaveNFe,
  // Métodos de validação adicionais
  validateEmail: function(value, fieldName, required) {
    return UnifiedValidation.email(value, fieldName || 'Email', required);
  },
  validateString: function(value, fieldName, maxLength) {
    return UnifiedValidation.string(value, fieldName, maxLength);
  },
  validateNumber: function(value, fieldName, options) {
    return UnifiedValidation.number(value, fieldName, options);
  },
  validateRequired: function(value, fieldName) {
    return UnifiedValidation.required(value, fieldName);
  },
  validateDate: function(value, fieldName, required) {
    return UnifiedValidation.date(value, fieldName, required);
  },
  validateCNPJ: function(cnpj) {
    return UnifiedValidation.cnpj(cnpj);
  },
  validateCPF: function(cpf) {
    try {
      return UnifiedValidation.cpf(cpf);
    } catch (error) {
      Logger.log("Erro em validateCPF: " + error.message);
      throw error;
    }
  },
  VERSION: '3.0.0'
};

var INPUT_VALIDATION = InputValidation;

// Funções globais para compatibilidade
function validateRequiredString(value, fieldName) {
  return UnifiedValidation.required(value, fieldName);
}

function validateStringLength(value, fieldName, maxLength) {
  try {
    return UnifiedValidation.string(value, fieldName, maxLength);
  } catch (error) {
    Logger.log("Erro em validateStringLength: " + error.message);
    throw error;
  }
}

function validatePositiveNumber(value, fieldName, required) {
  return UnifiedValidation.number(value, fieldName, { required: required, min: 0 });
}

function validateDate(value, fieldName, required) {
  return UnifiedValidation.date(value, fieldName, required);
}

function validateEmail(value, fieldName, required) {
  return UnifiedValidation.email(value, fieldName, required);
}

function validateNotaFiscal(nfData) {
  return UnifiedValidation.notaFiscal(nfData);
}

function validateEntrega(entregaData) {
  return UnifiedValidation.entrega(entregaData);
}

function validateRecusa(recusaData) {
  return UnifiedValidation.recusa(recusaData);
}

function validateGlosa(glosaData) {
  return UnifiedValidation.glosa(glosaData);
}

function validateCNPJ(cnpj) {
  return UnifiedValidation.cnpj(cnpj);
}

function validateCPF(cpf) {
  try {
    return UnifiedValidation.cpf(cpf);
  } catch (error) {
    Logger.log("Erro em validateCPF: " + error.message);
    throw error;
  }
}

function sanitizeString(value, maxLength) {
  try {
    return UnifiedValidation.sanitizeString(value, maxLength);
  } catch (error) {
    Logger.log("Erro em sanitizeString: " + error.message);
    throw error;
  }
}

function sanitizeNumber(value, defaultValue) {
  try {
    return UnifiedValidation.sanitizeNumber(value, defaultValue);
  } catch (error) {
    Logger.log("Erro em sanitizeNumber: " + error.message);
    throw error;
  }
}

function validarEntrada(tipo, dados) {
  switch (tipo) {
    case 'recebimento':
      return UnifiedValidation.recebimentoUE(dados);
    case 'analise':
      return UnifiedValidation.analiseComissao(dados);
    case 'recusa':
      return UnifiedValidation.recusa(dados);
    case 'nf':
    case 'notafiscal':
      return UnifiedValidation.notaFiscal(dados);
    default:
      return { valido: false, erros: ['Tipo desconhecido: ' + tipo], avisos: [] };
  }
}

// ============================================================================
// FUNÇÕES AUXILIARES DE VALIDAÇÃO (migradas de Core_Input_Validation.gs)
// ============================================================================

/**
 * Verifica se horário está dentro do período contratual
 */
function verificarHorarioEntrega(horaEntrega) {
  try {
    if (!horaEntrega) return { dentroHorario: true, mensagem: '' };

    var partes = String(horaEntrega).split(':');
    var hora = parseInt(partes[0], 10);
    var minuto = parseInt(partes[1] || '0', 10);
    var totalMinutos = hora * 60 + minuto;

    // Manhã: 08:00 - 12:00
    var inicioManha = 8 * 60;
    var fimManha = 12 * 60;

    // Tarde: 14:00 - 18:00
    var inicioTarde = 14 * 60;
    var fimTarde = 18 * 60;

    var dentroHorario = (totalMinutos >= inicioManha && totalMinutos <= fimManha) ||
                        (totalMinutos >= inicioTarde && totalMinutos <= fimTarde);

    return {
      dentroHorario: dentroHorario,
      mensagem: dentroHorario ? '' : 'ENTREGA FORA DO HORÁRIO: Recebido às ' + horaEntrega + ' (horário contratual: 08:00-12:00 / 14:00-18:00)'
    };
  } catch (error) {
    Logger.log("Erro em verificarHorarioEntrega: " + error.message);
    throw error;
  }
}

/**
 * Valida formato de email
 */
function validarEmail(email) {
  try {
    if (!email) return false;
    var regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(String(email).trim());
  } catch (error) {
    Logger.log("Erro em validarEmail: " + error.message);
    throw error;
  }
}

/**
 * Valida formato de CNPJ
 */
function validarCNPJ(cnpj) {
  return UnifiedValidation.cnpj(cnpj);
}

/**
 * Valida formato de chave de acesso NF-e (44 dígitos)
 */
function validarChaveNFe(chave) {
  return UnifiedValidation.chaveNFe(chave);
}

Logger.log('✅ Core_Unified_Validation carregado - UnifiedValidation e InputValidation disponíveis');
