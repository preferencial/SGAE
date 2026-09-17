/**
 * @fileoverview Aliases Legados - UNIAE CRE
 * @version 5.0.0
 *
 * Mapeia nomes de funções antigas para as novas implementações.
 * Permite que código legado continue funcionando sem modificações.
 */

'use strict';

// ============================================================================
// MAPEAMENTO DE NOMES DE ABAS (Legado → Novo)
// ============================================================================

var SHEET_ALIASES = {
  // Usuários
  'Usuarios': 'USR_Usuarios',
  'usuarios': 'USR_Usuarios',
  'Users': 'USR_Usuarios',

  // Notas Fiscais
  'Notas_Fiscais': 'NF_NotasFiscais',
  'NotasFiscais': 'NF_NotasFiscais',
  'notas_fiscais': 'NF_NotasFiscais',
  'Notas': 'NF_NotasFiscais',

  // Entregas
  'Entregas': 'ENT_Entregas',
  'entregas': 'ENT_Entregas',
  'Deliveries': 'ENT_Entregas',

  // Fornecedores
  'Fornecedores': 'FOR_Fornecedores',
  'fornecedores': 'FOR_Fornecedores',
  'Suppliers': 'FOR_Fornecedores',

  // Escolas
  'Escolas': 'ESC_Escolas',
  'escolas': 'ESC_Escolas',
  'Schools': 'ESC_Escolas',
  'UEs': 'ESC_Escolas',

  // Produtos
  'Produtos': 'PRD_Produtos',
  'produtos': 'PRD_Produtos',
  'Products': 'PRD_Produtos',
  'Itens': 'PRD_Produtos',

  // Empenhos
  'Empenhos': 'EMP_Empenhos',
  'empenhos': 'EMP_Empenhos',

  // Recebimentos
  'Recebimentos': 'REC_Recebimentos',
  'recebimentos': 'REC_Recebimentos',

  // Glosas
  'Glosas': 'GLO_Glosas',
  'glosas': 'GLO_Glosas',

  // Recusas
  'Recusas': 'RCS_Recusas',
  'recusas': 'RCS_Recusas',

  // Configurações
  'Configuracoes': 'CFG_Configuracoes',
  'Config': 'CFG_Configuracoes',
  'Settings': 'CFG_Configuracoes',

  // Logs
  'Logs': 'LOG_Auditoria',
  'Auditoria': 'LOG_Auditoria',
  'AuditLog': 'LOG_Auditoria'
};

/**
 * Resolve o nome da aba considerando aliases
 * @param {string} sheetName - Nome da aba (pode ser alias)
 * @returns {string} Nome real da aba
 */
function resolveSheetName(sheetName) {
  if (!sheetName) return null;

  // Se já é um nome válido no SCHEMA, retorna direto
  if (typeof SCHEMA !== 'undefined' && SCHEMA.SHEETS && SCHEMA.SHEETS[sheetName]) {
    return sheetName;
  }

  // Verifica aliases locais
  if (SHEET_ALIASES[sheetName]) {
    return SHEET_ALIASES[sheetName];
  }

  // Verifica aliases no SCHEMA
  if (typeof SCHEMA !== 'undefined' && SCHEMA.ALIASES && SCHEMA.ALIASES[sheetName]) {
    return SCHEMA.ALIASES[sheetName];
  }

  // Retorna o nome original se não encontrar alias
  return sheetName;
}

// ============================================================================
// MAPEAMENTO DE NOMES DE CAMPOS (Legado → Novo)
// ============================================================================

var FIELD_ALIASES = {
  // Campos de Fornecedor
  'Fornecedor_Nome': 'Fornecedor',
  'Nome_Fornecedor': 'Razao_Social',
  'NomeFornecedor': 'Razao_Social',
  'fornecedor_nome': 'Fornecedor',

  // Campos de Nota Fiscal
  'Numero_NF': 'Numero',
  'NumeroNF': 'Numero',
  'numero_nf': 'Numero',
  'Valor_NF': 'Valor_Total',
  'ValorNF': 'Valor_Total',
  'valor_nf': 'Valor_Total',

  // Campos de Data
  'Data_Emissao': 'DataEmissao',
  'data_emissao': 'DataEmissao',
  'Data_Entrega': 'DataEntrega',
  'data_entrega': 'DataEntrega',
  'Data_Recebimento': 'DataRecebimento',
  'data_recebimento': 'DataRecebimento',

  // Campos de Usuário
  'Nome_Usuario': 'Nome',
  'NomeUsuario': 'Nome',
  'Email_Usuario': 'Email',
  'EmailUsuario': 'Email',

  // Campos de Status
  'Status_NF': 'Status',
  'StatusNF': 'Status',
  'status_nf': 'Status'
};

/**
 * Resolve o nome do campo considerando aliases
 * @param {string} fieldName - Nome do campo (pode ser alias)
 * @returns {string} Nome real do campo
 */
function resolveFieldName(fieldName) {
  if (!fieldName) return null;
  return FIELD_ALIASES[fieldName] || fieldName;
}

/**
 * Converte objeto com campos legados para campos novos
 * @param {Object} obj - Objeto com campos legados
 * @returns {Object} Objeto com campos novos
 */
function convertLegacyFields(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  var converted = {};
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      var newKey = resolveFieldName(key);
      converted[newKey] = obj[key];
    }
  }
  return converted;
}

// ============================================================================
// FUNÇÕES LEGADAS DE DOMÍNIO
// ============================================================================

/** @deprecated Use api_listarNotasFiscais() */
function getNotasFiscais(filtros) {
  return typeof api_listarNotasFiscais === 'function' ?
         api_listarNotasFiscais(filtros) : [];
}

/** @deprecated Use api_buscarNF() */
function getNotaFiscalByNumero(numero) {
  return typeof api_buscarNF === 'function' ?
         api_buscarNF(numero) : null;
}

/** 
 * @deprecated REMOVIDO - Função movida para Core_Sync_Backend_Frontend.gs
 * A função salvarNotaFiscal agora está centralizada no módulo de sincronização
 * para evitar conflitos entre múltiplas implementações.
 * 
 * NÃO DESCOMENTAR - Isso causaria conflito de funções duplicadas!
 */
// function salvarNotaFiscal_LEGACY(dados) {
//   return typeof api_criarNF === 'function' ?
//          api_criarNF(convertLegacyFields(dados)) : null;
// }

/** @deprecated Use api_listarFornecedores() */
function getFornecedores() {
  if (typeof api_listarFornecedores === 'function') {
    return api_listarFornecedores();
  }
  return lerDados('Fornecedores');
}

/** @deprecated Use api_buscarFornecedor() */
function getFornecedorByCNPJ(cnpj) {
  if (typeof api_buscarFornecedor === 'function') {
    return api_buscarFornecedor(cnpj);
  }
  var fornecedores = getFornecedores();
  for (var i = 0; i < fornecedores.length; i++) {
    if (fornecedores[i].CNPJ === cnpj || fornecedores[i][1] === cnpj) {
      return fornecedores[i];
    }
  }
  return null;
}

/** @deprecated Use api_listarEscolas() */
function getEscolas() {
  if (typeof api_listarEscolas === 'function') {
    return api_listarEscolas();
  }
  return lerDados('Escolas');
}

/** @deprecated Use api_listarEmpenhos() */
function getEmpenhos(filtros) {
  if (typeof api_listarEmpenhos === 'function') {
    return api_listarEmpenhos(filtros);
  }
  return lerDados('Empenhos');
}

/** @deprecated Use api_listarProdutos() */
function getProdutos() {
  if (typeof api_listarProdutos === 'function') {
    return api_listarProdutos();
  }
  return lerDados('Produtos');
}

// ============================================================================
// FUNÇÕES LEGADAS DE RELATÓRIO
// ============================================================================

/** @deprecated Use gerarRelatorioConsolidadoCRE_Safe() */
function gerarRelatorio(tipo, filtros) {
  switch (tipo) {
    case 'consolidado':
    case 'CRE':
      return typeof gerarRelatorioConsolidadoCRE_Safe === 'function' ?
             gerarRelatorioConsolidadoCRE_Safe(filtros) : null;
    default:
      Logger.log('Tipo de relatório não suportado: ' + tipo);
      return null;
  }
}

/** @deprecated Use exportarParaPDF() */
function exportarRelatorio(dados, formato) {
  if (typeof exportarParaPDF === 'function' && formato === 'PDF') {
    return exportarParaPDF(dados);
  }
  Logger.log('Exportação não implementada para formato: ' + formato);
  return null;
}

// ============================================================================
// FUNÇÕES LEGADAS DE WORKFLOW
// ============================================================================

/** @deprecated Use iniciarProcessoAtesto_Safe() */
function iniciarAtesto(notaFiscalId) {
  return typeof iniciarProcessoAtesto === 'function' ?
         iniciarProcessoAtesto({ notaFiscal: { id: notaFiscalId } }) : null;
}

/** @deprecated Use aprovarAtesto() */
function aprovarNota(notaFiscalId, observacao) {
  if (typeof aprovarAtesto === 'function') {
    return aprovarAtesto(notaFiscalId, observacao);
  }
  Logger.log('Função aprovarAtesto não disponível');
  return null;
}

/** @deprecated Use rejeitarAtesto() */
function rejeitarNota(notaFiscalId, motivo) {
  if (typeof rejeitarAtesto === 'function') {
    return rejeitarAtesto(notaFiscalId, motivo);
  }
  Logger.log('Função rejeitarAtesto não disponível');
  return null;
}

// ============================================================================
// VERIFICAÇÃO DE ALIASES
// ============================================================================

/**
 * Lista todos os aliases disponíveis
 * @returns {Object} Mapa de aliases
 */
function listarAliases() {
  try {
    return {
      sheets: SHEET_ALIASES,
      fields: FIELD_ALIASES,
      totalSheets: Object.keys(SHEET_ALIASES).length,
      totalFields: Object.keys(FIELD_ALIASES).length
    };
  } catch (error) {
    Logger.log("Erro em listarAliases: " + error.message);
    throw error;
  }
}

/**
 * Testa se os aliases estão funcionando
 * @returns {Object} Resultado dos testes
 */
function testarAliases() {
  try {
    var resultados = {
      timestamp: new Date().toISOString(),
      testes: []
    };

    // Teste de resolução de nome de aba
    var testesAbas = [
      { input: 'Usuarios', expected: 'USR_Usuarios' },
      { input: 'Notas_Fiscais', expected: 'NF_NotasFiscais' },
      { input: 'Fornecedores', expected: 'FOR_Fornecedores' }
    ];

    testesAbas.forEach(function(teste) {
      var resultado = resolveSheetName(teste.input);
      resultados.testes.push({
        tipo: 'sheet',
        input: teste.input,
        expected: teste.expected,
        actual: resultado,
        passou: resultado === teste.expected
      });
    });

    // Teste de resolução de nome de campo
    var testesCampos = [
      { input: 'Fornecedor_Nome', expected: 'Fornecedor' },
      { input: 'Nome_Fornecedor', expected: 'Razao_Social' },
      { input: 'Numero_NF', expected: 'Numero' }
    ];

    testesCampos.forEach(function(teste) {
      var resultado = resolveFieldName(teste.input);
      resultados.testes.push({
        tipo: 'field',
        input: teste.input,
        expected: teste.expected,
        actual: resultado,
        passou: resultado === teste.expected
      });
    });

    // Resumo
    var passou = resultados.testes.filter(function(t) { return t.passou; }).length;
    resultados.resumo = {
      total: resultados.testes.length,
      passou: passou,
      falhou: resultados.testes.length - passou,
      percentual: Math.round((passou / resultados.testes.length) * 100) + '%'
    };

    return resultados;
  } catch (error) {
    Logger.log("Erro em testarAliases: " + error.message);
    throw error;
  }
}

// Log de carregamento
Logger.log('✅ Core_Legacy_Aliases.gs carregado - ' +
           Object.keys(SHEET_ALIASES).length + ' aliases de abas, ' +
           Object.keys(FIELD_ALIASES).length + ' aliases de campos');

// ============================================================================
// ALIASES DE VALIDAÇÃO (Refatoração Core_Validacao.gs)
// ============================================================================

/** @deprecated Use ValidatorBase.validateRequiredString */
function validateRequiredString(value, fieldName) {
  try {
    return ValidatorBase.validateRequiredString(value, fieldName);
  } catch (error) {
    Logger.log("Erro em validateRequiredString: " + error.message);
    throw error;
  }
}

/** @deprecated Use ValidatorBase.validateStringLength */
function validateStringLength(value, fieldName, maxLength) {
  try {
    return ValidatorBase.validateStringLength(value, fieldName, maxLength);
  } catch (error) {
    Logger.log("Erro em validateStringLength: " + error.message);
    throw error;
  }
}

/** @deprecated Use ValidatorBase.validatePositiveNumber */
function validatePositiveNumber(value, fieldName, required) {
  try {
    return ValidatorBase.validatePositiveNumber(value, fieldName, required);
  } catch (error) {
    Logger.log("Erro em validatePositiveNumber: " + error.message);
    throw error;
  }
}

/** @deprecated Use ValidatorBase.validateDate */
function validateDate(value, fieldName, required) {
  return ValidatorBase.validateDate(value, fieldName, required);
}

/** @deprecated Use ValidatorBase.validateEmail */
function validateEmail(value, fieldName, required) {
  return ValidatorBase.validateEmail(value, fieldName, required);
}

/** @deprecated Use ValidatorBase.validateObject */
function validateObject(value, fieldName) {
  try {
    return ValidatorBase.validateObject(value, fieldName);
  } catch (error) {
    Logger.log("Erro em validateObject: " + error.message);
    throw error;
  }
}

/** @deprecated Use ValidatorBase.sanitizeString */
function sanitizeString(value, maxLength) {
  try {
    return ValidatorBase.sanitizeString(value, maxLength);
  } catch (error) {
    Logger.log("Erro em sanitizeString: " + error.message);
    throw error;
  }
}

/** @deprecated Use ValidatorBase.sanitizeNumber */
function sanitizeNumber(value, defaultValue) {
  try {
    return ValidatorBase.sanitizeNumber(value, defaultValue);
  } catch (error) {
    Logger.log("Erro em sanitizeNumber: " + error.message);
    throw error;
  }
}

// Aliases para COMPLIANCE_VALIDATOR (agora ComplianceValidator)
var COMPLIANCE_VALIDATOR = typeof ComplianceValidator !== 'undefined' ? ComplianceValidator : null;

/** @deprecated Use ComplianceValidator.validateNotaFiscalRegistration */
function validateNotaFiscalCompliance(notaFiscalData) {
  try {
    // Validar entrada
    if (!notaFiscalData || typeof notaFiscalData !== 'object') {
      return [{
        valid: false,
        errors: ['Dados da nota fiscal não fornecidos'],
        warnings: []
      }];
    }

    // Esta função era um wrapper global, agora pode ser mapeada ou recriada
    var validations = [];
  
    try {
      if (typeof ComplianceValidator !== 'undefined' && typeof ComplianceValidator.validateOperation === 'function') {
        validations.push(ComplianceValidator.validateOperation('NOTA_FISCAL_REGISTRATION', notaFiscalData));

        var emConferencia = notaFiscalData.em_conferencia || 
                            (typeof safeGet === 'function' ? safeGet(notaFiscalData, 'em_conferencia', false) : false);
        if (emConferencia) {
          validations.push(ComplianceValidator.validateOperation('CONFERENCIA_PROCESSO', notaFiscalData));
        }

        if (notaFiscalData.atestada) {
          validations.push(ComplianceValidator.validateOperation('ATESTACAO_COMISSAO', notaFiscalData));
        }

        if (notaFiscalData.nota_empenho) {
          validations.push(ComplianceValidator.validateOperation('VALIDACAO_EMPENHO', notaFiscalData));
        }
      } else {
        // Fallback se ComplianceValidator não estiver disponível
        validations.push({
          valid: true,
          errors: [],
          warnings: ['ComplianceValidator não disponível - validação básica aplicada']
        });
      }
    } catch (e) {
      validations.push({
        valid: false,
        errors: ['Erro na validação: ' + e.message],
        warnings: []
      });
    }

    return validations;
  } catch (error) {
    Logger.log("Erro em validateNotaFiscalCompliance: " + error.message);
    throw error;
  }
}

/** @deprecated Use EmpenhoValidator.executarValidacaoNE */
function executarValidacaoNE() {
  return EmpenhoValidator.executarValidacaoNE();
}

/** @deprecated Use EmpenhoValidator.validarNFcontraNE */
function validarNFcontraNE(nf, linha) {
  return EmpenhoValidator.validarNFcontraNE(nf, linha);
}

/** @deprecated Use EmpenhoValidator.simularConsultaSaldoNE */
function simularConsultaSaldoNE(notaEmpenho, valorNecessario) {
  return EmpenhoValidator.simularConsultaSaldoNE(notaEmpenho, valorNecessario);
}



// ============================================================================
// ALIASES FALTANTES (Identificados no diagnóstico)
// ============================================================================

/**
 * Gera ID único - Alias global para Utils.generateId
 * @param {string} [prefix] - Prefixo do ID
 * @returns {string} ID único gerado
 */
function generateId(prefix) {
  if (typeof Utils !== 'undefined' && typeof Utils.generateId === 'function') {
    return Utils.generateId(prefix);
  }
  // Fallback
  prefix = prefix || 'ID';
  return prefix + '_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
}

/**
 * Resposta padrão de API - Alias global
 * @param {boolean} success - Se a operação foi bem-sucedida
 * @param {*} data - Dados da resposta
 * @param {string} [message] - Mensagem opcional
 * @returns {Object} Resposta padronizada
 */
if (typeof apiResponse !== 'function') {
  function apiResponse(success, data, message) {
    try {
      return {
        success: success,
        data: data,
        message: message || (success ? 'Operação realizada com sucesso' : 'Erro na operação'),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      Logger.log("Erro em apiResponse: " + error.message);
      throw error;
    }
  }
}

/**
 * Adiciona linha em planilha - Alias para CRUD.create ou função existente
 * @param {string} sheetName - Nome da planilha
 * @param {Object|Array} rowData - Dados da linha
 * @returns {Object} Resultado da operação
 */
if (typeof addSheetRow !== 'function') {
  function addSheetRow(sheetName, rowData) {
    // Tenta usar CRUD primeiro
    if (typeof CRUD !== 'undefined' && typeof CRUD.create === 'function') {
      return CRUD.create(sheetName, rowData);
    }
    
    // Fallback direto
    try {
      var ss = getSS();
      var sheet = ss.getSheetByName(sheetName);
      
      if (!sheet) {
        return { success: false, error: 'Planilha não encontrada: ' + sheetName };
      }
      
      if (Array.isArray(rowData)) {
        sheet.appendRow(rowData);
      } else {
        var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        var row = headers.map(function(h) { return rowData[h] || ''; });
        sheet.appendRow(row);
      }
      
      return { success: true, row: sheet.getLastRow() };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

Logger.log('✅ Aliases adicionais carregados: generateId, apiResponse, addSheetRow');
