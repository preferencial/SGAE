/**
 * Core_Operacoes_Safe.gs
 * Operações com Validação Robusta
 *
 * PROBLEMAS CORRIGIDOS:
 * - TypeError: Cannot read properties of undefined
 * - Validação de dados antes de acessar propriedades
 * - Tratamento de erros consistente
 *
 * @version 1.0.0
 * @created 2025-12-04
 */

'use strict';

// ============================================================================
// VALIDADORES DE DADOS
// ============================================================================

var DataValidator = (function() {

  /**
   * Valida se objeto existe e não é null/undefined
   * @param {*} obj - Objeto a validar
   * @param {string} name - Nome do objeto para mensagem de erro
   * @returns {Object} Resultado da validação
   */
  function validateExists(obj, name) {
    if (obj === null || obj === undefined) {
      return {
        valid: false,
        error: (name || 'Dados') + ' não fornecidos'
      };
    }
    return { valid: true };
  }

  /**
   * Valida se objeto tem propriedade
   * @param {Object} obj - Objeto
   * @param {string} prop - Nome da propriedade
   * @param {string} objName - Nome do objeto para mensagem
   * @returns {Object} Resultado da validação
   */
  function validateProperty(obj, prop, objName) {
    if (!obj || obj[prop] === undefined || obj[prop] === null) {
      return {
        valid: false,
        error: 'Propriedade "' + prop + '" é obrigatória' + (objName ? ' em ' + objName : '')
      };
    }
    return { valid: true, value: obj[prop] };
  }

  /**
   * Valida múltiplas propriedades obrigatórias
   * @param {Object} obj - Objeto
   * @param {Array} props - Lista de propriedades obrigatórias
   * @param {string} objName - Nome do objeto
   * @returns {Object} Resultado da validação
   */
  function validateRequiredProps(obj, props, objName) {
    try {
      var validation = validateExists(obj, objName);
      if (!validation.valid) return validation;

      var missing = [];

      for (var i = 0; i < props.length; i++) {
        var prop = props[i];
        if (obj[prop] === undefined || obj[prop] === null || obj[prop] === '') {
          missing.push(prop);
        }
      }

      if (missing.length > 0) {
        return {
          valid: false,
          error: 'Campos obrigatórios não preenchidos: ' + missing.join(', '),
          missingFields: missing
        };
      }

      return { valid: true };
    } catch (error) {
      Logger.log("Erro em validateRequiredProps: " + error.message);
      throw error;
    }
  }

  /**
   * Valida tipo de dado
   * @param {*} value - Valor
   * @param {string} expectedType - Tipo esperado
   * @param {string} fieldName - Nome do campo
   * @returns {Object} Resultado
   */
  function validateType(value, expectedType, fieldName) {
    try {
      var actualType = typeof value;

      if (expectedType === 'array') {
        if (!Array.isArray(value)) {
          return {
            valid: false,
            error: fieldName + ' deve ser um array'
          };
        }
        return { valid: true };
      }

      if (actualType !== expectedType) {
        return {
          valid: false,
          error: fieldName + ' deve ser do tipo ' + expectedType + ', recebido: ' + actualType
        };
      }

      return { valid: true };
    } catch (error) {
      Logger.log("Erro em validateType: " + error.message);
      throw error;
    }
  }

  /**
   * Valida número positivo
   * @param {*} value - Valor
   * @param {string} fieldName - Nome do campo
   * @returns {Object} Resultado
   */
  function validatePositiveNumber(value, fieldName) {
    try {
      var num = Number(value);
      if (isNaN(num) || num <= 0) {
        return {
          valid: false,
          error: fieldName + ' deve ser um número positivo'
        };
      }
      return { valid: true, value: num };
    } catch (error) {
      Logger.log("Erro em validatePositiveNumber: " + error.message);
      throw error;
    }
  }

  /**
   * Valida email
   * @param {string} email - Email
   * @returns {Object} Resultado
   */
  function validateEmail(email) {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return {
        valid: false,
        error: 'Email inválido'
      };
    }
    return { valid: true };
  }

  /**
   * Valida CNPJ (formato básico)
   * @param {string} cnpj - CNPJ
   * @returns {Object} Resultado
   */
  function validateCNPJ(cnpj) {
    try {
      if (!cnpj) {
        return { valid: false, error: 'CNPJ é obrigatório' };
      }

      var cleaned = String(cnpj).replace(/[^\d]/g, '');
      if (cleaned.length !== 14) {
        return { valid: false, error: 'CNPJ deve ter 14 dígitos' };
      }

      return { valid: true, value: cleaned };
    } catch (error) {
      Logger.log("Erro em validateCNPJ: " + error.message);
      throw error;
    }
  }

  /**
   * Valida data
   * @param {*} date - Data
   * @param {string} fieldName - Nome do campo
   * @returns {Object} Resultado
   */
  function validateDate(date, fieldName) {
    if (!date) {
      return { valid: false, error: fieldName + ' é obrigatória' };
    }

    var d = new Date(date);
    if (isNaN(d.getTime())) {
      return { valid: false, error: fieldName + ' inválida' };
    }

    return { valid: true, value: d };
  }

  // API Pública
  return {
    validateExists: validateExists,
    validateProperty: validateProperty,
    validateRequiredProps: validateRequiredProps,
    validateType: validateType,
    validatePositiveNumber: validatePositiveNumber,
    validateEmail: validateEmail,
    validateCNPJ: validateCNPJ,
    validateDate: validateDate
  };
})();

// ============================================================================
// FUNÇÕES DE OPERAÇÃO SEGURAS
// ============================================================================

/**
 * Registra reposição pela UE - VERSÃO SEGURA
 * Corrige: TypeError: Cannot read properties of undefined (reading 'equivalenciaNutricionalVerificada')
 *
 * @param {Object} dados - Dados da reposição
 * @returns {Object} Resultado da operação
 */
function registrarReposicaoUESafe(dados) {
  try {
    try {
      // Validação inicial
      var validation = DataValidator.validateExists(dados, 'Dados da reposição');
      if (!validation.valid) {
        Logger.log('[ERROR] Erro ao registrar reposição UE: ' + JSON.stringify({ error: validation.error, dados: dados }));
        return { success: false, error: validation.error };
      }

      // Validar campos obrigatórios
      var requiredFields = [
        'notificacaoId',
        'produtoOriginal',
        'quantidadeOriginal',
        'produtoReposto',
        'quantidadeReposta'
      ];

      var propsValidation = DataValidator.validateRequiredProps(dados, requiredFields, 'dados da reposição');
      if (!propsValidation.valid) {
        Logger.log('[ERROR] Erro ao registrar reposição UE: ' + JSON.stringify({ error: propsValidation.error, dados: dados }));
        return { success: false, error: propsValidation.error };
      }

      // Validar equivalência nutricional (com valor padrão)
      var equivalenciaVerificada = dados.equivalenciaNutricionalVerificada === true;

      if (!equivalenciaVerificada) {
        // Aviso, mas não bloqueia - permite continuar com flag
        Logger.log('⚠️ Reposição sem verificação de equivalência nutricional');
      }

      // Construir objeto de reposição
      var reposicao = {
        id: gerarIdReposicaoSafe(),
        notificacaoId: dados.notificacaoId,
        dataReposicao: new Date().toISOString(),

        // Produto original
        produtoOriginal: dados.produtoOriginal,
        quantidadeOriginal: dados.quantidadeOriginal,

        // Produto reposto
        produtoReposto: dados.produtoReposto,
        quantidadeReposta: dados.quantidadeReposta,
        qualidadeIgualOuSuperior: dados.qualidadeIgualOuSuperior || false,
        equivalenciaNutricional: dados.equivalenciaNutricional || '',
        equivalenciaNutricionalVerificada: equivalenciaVerificada,

        // Comprovante fiscal (opcional)
        comprovantesFiscais: {
          numero: dados.numeroNotaFiscal || '',
          data: dados.dataNotaFiscal || '',
          valor: dados.valorNotaFiscal || 0,
          arquivado: !!dados.numeroNotaFiscal
        },

        // Atesto do nutricionista (opcional)
        atestoNutricionista: {
          nome: dados.nutricionistaNome || '',
          matricula: dados.nutricionistaMatricula || '',
          dataAtesto: dados.dataAtestoNutricionista || '',
          conferidoQuantitativo: dados.conferidoQuantitativo || false,
          conferidoEquivalencia: dados.conferidoEquivalencia || false,
          liberadoConsumo: dados.liberadoConsumo || false
        },

        // Cronograma (opcional)
        cronogramaReposicao: dados.cronogramaReposicao || null,
        parcelaAtual: dados.parcelaAtual || 1,
        totalParcelas: dados.totalParcelas || 1,

        status: 'REALIZADA',
        observacoes: dados.observacoes || ''
      };

      // Salvar reposição
      var resultado = salvarReposicaoSafe(reposicao);

      if (resultado.success) {
        // Atualizar status da notificação se função existir
        if (typeof atualizarStatusNotificacao === 'function') {
          try {
            atualizarStatusNotificacao(dados.notificacaoId, 'REPOSICAO_REALIZADA');
          } catch (e) {
            Logger.log('⚠️ Erro ao atualizar status da notificação: ' + e.message);
          }
        }

        Logger.log('✅ Reposição UE registrada: ' + reposicao.id);
      }

      return resultado;

    } catch (error) {
      Logger.log('❌ Erro em registrarReposicaoUESafe: ' + error.message);
      return { success: false, error: error.message };
    }
  } catch (error) {
    Logger.log("Erro em registrarReposicaoUESafe: " + error.message);
    throw error;
  }
}

/**
 * Registra entrega - VERSÃO SEGURA
 * @param {Object} dados - Dados da entrega
 * @returns {Object} Resultado
 */
function registrarEntregaSafe(dados) {
  try {
    try {
      try {
        // Validação inicial
        var validation = DataValidator.validateExists(dados, 'Dados da entrega');
        if (!validation.valid) {
          Logger.log('[ERROR] Erro ao registrar entrega: ' + JSON.stringify({ error: validation.error, dados: dados }));
          return { success: false, error: validation.error };
        }

        // Validar campos obrigatórios
        var requiredFields = ['unidadeEscolar'];
        var propsValidation = DataValidator.validateRequiredProps(dados, requiredFields, 'dados da entrega');
        if (!propsValidation.valid) {
          Logger.log('[ERROR] Erro ao registrar entrega: ' + JSON.stringify({ error: propsValidation.error, dados: dados }));
          return { success: false, error: propsValidation.error };
        }

        // Processar entrega
        var entrega = {
          id: 'ENT-' + Date.now().toString(36).toUpperCase(),
          unidadeEscolar: dados.unidadeEscolar,
          dataEntrega: dados.dataEntrega || new Date().toISOString(),
          fornecedor: dados.fornecedor || '',
          notaFiscal: dados.notaFiscal || '',
          itens: dados.itens || [],
          status: 'REGISTRADA',
          responsavel: dados.responsavel || Session.getActiveUser().getEmail(),
          observacoes: dados.observacoes || ''
        };

        // Salvar (implementar conforme necessidade)
        Logger.log('✅ Entrega registrada: ' + entrega.id);

        return { success: true, id: entrega.id, data: entrega };

      } catch (error) {
        Logger.log('❌ Erro em registrarEntregaSafe: ' + error.message);
        return { success: false, error: error.message };
      }
    } catch (error) {
      Logger.log("Erro em registrarEntregaSafe: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em registrarEntregaSafe: " + error.message);
    throw error;
  }
}

/**
 * Valida nota fiscal DF - VERSÃO SEGURA
 * @param {Object} dados - Dados da nota fiscal
 * @returns {Object} Resultado da validação
 */
function validarNotaFiscalDFSafe(dados) {
  try {
    try {
      // Validação inicial
      var validation = DataValidator.validateExists(dados, 'Dados da nota fiscal');
      if (!validation.valid) {
        Logger.log('ERRO: validarNotaFiscalDF chamada sem dados válidos');
        return { success: false, error: validation.error, valido: false };
      }

      var erros = [];
      var avisos = [];

      // Validar número da NF
      if (!dados.numero) {
        erros.push('Número da nota fiscal é obrigatório');
      }

      // Validar CNPJ do emitente
      if (dados.cnpjEmitente) {
        var cnpjValidation = DataValidator.validateCNPJ(dados.cnpjEmitente);
        if (!cnpjValidation.valid) {
          erros.push(cnpjValidation.error);
        }
      } else {
        erros.push('CNPJ do emitente é obrigatório');
      }

      // Validar data de emissão
      if (dados.dataEmissao) {
        var dateValidation = DataValidator.validateDate(dados.dataEmissao, 'Data de emissão');
        if (!dateValidation.valid) {
          erros.push(dateValidation.error);
        }
      }

      // Validar valor
      if (dados.valor !== undefined) {
        var valorValidation = DataValidator.validatePositiveNumber(dados.valor, 'Valor');
        if (!valorValidation.valid) {
          erros.push(valorValidation.error);
        }
      }

      // Validações específicas do DF
      if (dados.naturezaOperacao && dados.naturezaOperacao.indexOf('VENDA') === -1) {
        avisos.push('Natureza da operação pode não ser compatível com compra de alimentos');
      }

      var valido = erros.length === 0;

      return {
        success: true,
        valido: valido,
        erros: erros,
        avisos: avisos,
        dados: dados
      };

    } catch (error) {
      Logger.log('❌ Erro em validarNotaFiscalDFSafe: ' + error.message);
      return { success: false, error: error.message, valido: false };
    }
  } catch (error) {
    Logger.log("Erro em validarNotaFiscalDFSafe: " + error.message);
    throw error;
  }
}

// ============================================================================
// FUNÇÕES AUXILIARES SEGURAS
// ============================================================================

/**
 * Gera ID único para reposição
 * @returns {string} ID gerado
 */
function gerarIdReposicaoSafe() {
  try {
    var timestamp = Date.now().toString(36);
    var random = Math.random().toString(36).substr(2, 5);
    return ('REP-' + timestamp + '-' + random).toUpperCase();
  } catch (error) {
    Logger.log("Erro em gerarIdReposicaoSafe: " + error.message);
    throw error;
  }
}

/**
 * Salva reposição de forma segura
 * @param {Object} reposicao - Dados da reposição
 * @returns {Object} Resultado
 */
function salvarReposicaoSafe(reposicao) {
  try {
    try {
      try {
        try {
          var ss = getSS();
          var sheet = ss.getSheetByName('Reposicoes_Alimentos');

          if (!sheet) {
            // Criar aba se não existir
            sheet = ss.insertSheet('Reposicoes_Alimentos');
            var cabecalhos = ['ID', 'Notificação ID', 'Tipo', 'Data', 'Produto Original',
                             'Produto Reposto', 'Quantidade', 'Status', 'Equivalência Verificada', 'Observações'];
            sheet.getRange(1, 1, 1, cabecalhos.length).setValues([cabecalhos]);
            sheet.getRange(1, 1, 1, cabecalhos.length)
              .setBackground('#4f46e5')
              .setFontColor('white')
              .setFontWeight('bold');
          }

          var linha = [
            reposicao.id,
            reposicao.notificacaoId,
            'UE',
            reposicao.dataReposicao,
            reposicao.produtoOriginal,
            reposicao.produtoReposto,
            reposicao.quantidadeReposta,
            reposicao.status,
            reposicao.equivalenciaNutricionalVerificada ? 'SIM' : 'NÃO',
            reposicao.observacoes || ''
          ];

          sheet.appendRow(linha);

          return { success: true, id: reposicao.id };

        } catch (error) {
          Logger.log('❌ Erro ao salvar reposição: ' + error.message);
          return { success: false, error: error.message };
        }
      } catch (error) {
        Logger.log("Erro em salvarReposicaoSafe: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em salvarReposicaoSafe: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em salvarReposicaoSafe: " + error.message);
    throw error;
  }
}

// ============================================================================
// PATCHES PARA FUNÇÕES EXISTENTES
// ============================================================================

/**
 * Substitui registrarReposicaoUE pela versão segura
 */
if (typeof registrarReposicaoUE === 'function') {
  var _originalRegistrarReposicaoUE = registrarReposicaoUE;

  registrarReposicaoUE = function(dados) {
    // Usa versão segura
    return registrarReposicaoUESafe(dados);
  };
}

/**
 * Substitui validarNotaFiscalDF pela versão segura
 */
if (typeof validarNotaFiscalDF === 'function') {
  var _originalValidarNotaFiscalDF = validarNotaFiscalDF;

  validarNotaFiscalDF = function(dados) {
    return validarNotaFiscalDFSafe(dados);
  };
}

// ============================================================================
// REGISTRO DO MÓDULO
// ============================================================================

/**
 * Registra módulo
 */
function registrarCoreOperacoesSafe() {
  Logger.log('✅ Core Operações Safe carregado');
  Logger.log('   DataValidator disponível: SIM');
}
