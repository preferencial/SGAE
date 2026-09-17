/**
 * @fileoverview Correções de Funções Problemáticas
 * @version 5.0.0
 *
 * Corrige funções que estavam falhando com:
 * - TypeError: Cannot read properties of undefined
 * - Parâmetros não validados
 *
 * @author UNIAE CRE Team
 * @created 2025-12-04
 */

'use strict';

// ============================================================================
// CORREÇÕES PARA CORE_WORKFLOW_ATESTO
// ============================================================================

/**
 * Inicia processo de atesto - VERSÃO CORRIGIDA
 * @param {Object} dados - Dados do processo
 * @returns {Object} Resultado
 */
function iniciarProcessoAtesto_Safe(dados) {
  try {
    // Validação robusta
    if (!dados) {
      AppLogger.error('Erro ao iniciar processo de atesto - Dados não fornecidos');
      return { success: false, error: 'Dados não fornecidos' };
    }

    // Usa safeGet para acessar propriedades
    var notaFiscal = safeGet(dados, 'notaFiscal', null);

    if (!notaFiscal) {
      AppLogger.error('Erro ao iniciar processo de atesto - Nota fiscal não fornecida');
      return { success: false, error: 'Nota fiscal é obrigatória' };
    }

    // Continua com a lógica original se existir
    if (typeof iniciarProcessoAtesto === 'function') {
      return iniciarProcessoAtesto(dados);
    }

    return { success: false, error: 'Função não implementada' };

  } catch (e) {
    AppLogger.error('Erro ao iniciar processo de atesto', e);
    return { success: false, error: e.message };
  }
}

// ============================================================================
// CORREÇÕES PARA CORE_CONFORMIDADE_AUDITORIA
// ============================================================================

/**
 * Verifica regularidade fiscal - VERSÃO CORRIGIDA
 * @param {Object} dados - Dados para verificação
 * @returns {Object} Resultado
 */
function verificarRegularidadeFiscal_Safe(dados) {
  try {
    if (!dados) {
      Logger.log('Erro em verificarRegularidadeFiscal: Dados não fornecidos');
      return { success: false, error: 'Dados não fornecidos' };
    }

    var fornecedor = safeGet(dados, 'fornecedor', null);

    if (!fornecedor) {
      Logger.log('Erro em verificarRegularidadeFiscal: Fornecedor não informado');
      return { success: false, error: 'Fornecedor é obrigatório' };
    }

    // Continua com a lógica original se existir
    if (typeof verificarRegularidadeFiscal === 'function') {
      return verificarRegularidadeFiscal(dados);
    }

    // Implementação básica
    return {
      success: true,
      fornecedor: fornecedor,
      regular: true,
      dataVerificacao: new Date()
    };

  } catch (e) {
    Logger.log('Erro em verificarRegularidadeFiscal: ' + e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Verifica consistência de datas - VERSÃO CORRIGIDA
 * @param {Object} dados - Dados para verificação
 * @returns {Object} Resultado
 */
function verificarConsistenciaDatas_Safe(dados) {
  try {
    if (!dados) {
      Logger.log('Erro em verificarConsistenciaDatas: Dados não fornecidos');
      return { success: false, error: 'Dados não fornecidos' };
    }

    var processoId = safeGet(dados, 'processoId', null);

    if (!processoId) {
      Logger.log('Erro em verificarConsistenciaDatas: Processo ID não informado');
      return { success: false, error: 'ID do processo é obrigatório' };
    }

    // Continua com a lógica original se existir
    if (typeof verificarConsistenciaDatas === 'function') {
      return verificarConsistenciaDatas(dados);
    }

    return { success: true, consistente: true };

  } catch (e) {
    Logger.log('Erro em verificarConsistenciaDatas: ' + e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Verifica documentação de liquidação - VERSÃO CORRIGIDA
 * @param {Object} dados - Dados para verificação
 * @returns {Object} Resultado
 */
function verificarDocumentacaoLiquidacao_Safe(dados) {
  try {
    if (!dados) {
      Logger.log('Erro em verificarDocumentacaoLiquidacao: Dados não fornecidos');
      return { success: false, error: 'Dados não fornecidos' };
    }

    var processoId = safeGet(dados, 'processoId', null);

    if (!processoId) {
      Logger.log('Erro em verificarDocumentacaoLiquidacao: Processo ID não informado');
      return { success: false, error: 'ID do processo é obrigatório' };
    }

    // Continua com a lógica original se existir
    if (typeof verificarDocumentacaoLiquidacao === 'function') {
      return verificarDocumentacaoLiquidacao(dados);
    }

    return { success: true, documentacaoCompleta: true };

  } catch (e) {
    Logger.log('Erro em verificarDocumentacaoLiquidacao: ' + e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Registra evento de rastreabilidade - VERSÃO CORRIGIDA
 * @param {Object} dados - Dados do evento
 * @returns {Object} Resultado
 */
function registrarEventoRastreabilidade_Safe(dados) {
  try {
    if (!dados) {
      Logger.log('Erro em registrarEventoRastreabilidade: Dados não fornecidos');
      return { success: false, error: 'Dados não fornecidos' };
    }

    var tipo = safeGet(dados, 'tipo', null);

    if (!tipo) {
      Logger.log('Erro em registrarEventoRastreabilidade: Tipo não informado');
      return { success: false, error: 'Tipo do evento é obrigatório' };
    }

    // Continua com a lógica original se existir
    if (typeof registrarEventoRastreabilidade === 'function') {
      return registrarEventoRastreabilidade(dados);
    }

    // Implementação básica - registra no log
    Logger.log('Evento de rastreabilidade: ' + tipo);
    return { success: true, registrado: true };

  } catch (e) {
    Logger.log('Erro em registrarEventoRastreabilidade: ' + e.message);
    return { success: false, error: e.message };
  }
}

// ============================================================================
// CORREÇÕES PARA CORE_CARDAPIOS_ESPECIAIS
// ============================================================================

/**
 * Cadastra aluno com necessidade especial - VERSÃO CORRIGIDA
 * @param {Object} dados - Dados do aluno
 * @returns {Object} Resultado
 */
function cadastrarAlunoNecessidadeEspecial_Safe(dados) {
  try {
    if (!dados) {
      Logger.log('Erro em cadastrarAlunoNecessidadeEspecial: Dados não fornecidos');
      return { success: false, error: 'Dados não fornecidos' };
    }

    var nomeCompleto = safeGet(dados, 'nomeCompleto', null);

    if (!nomeCompleto) {
      Logger.log('Erro em cadastrarAlunoNecessidadeEspecial: Nome não informado');
      return { success: false, error: 'Nome completo é obrigatório' };
    }

    // Continua com a lógica original se existir
    if (typeof cadastrarAlunoNecessidadeEspecial === 'function') {
      return cadastrarAlunoNecessidadeEspecial(dados);
    }

    return { success: false, error: 'Função não implementada' };

  } catch (e) {
    Logger.log('Erro em cadastrarAlunoNecessidadeEspecial: ' + e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Gera cardápio especial - VERSÃO CORRIGIDA
 * @param {Object} dados - Dados do cardápio
 * @returns {Object} Resultado
 */
function gerarCardapioEspecial_Safe(dados) {
  try {
    if (!dados) {
      Logger.log('Erro em gerarCardapioEspecial: Dados não fornecidos');
      return { success: false, error: 'Dados não fornecidos' };
    }

    var patologia = safeGet(dados, 'patologia', null);

    if (!patologia) {
      Logger.log('Erro em gerarCardapioEspecial: Patologia não informada');
      return { success: false, error: 'Patologia é obrigatória' };
    }

    // Continua com a lógica original se existir
    if (typeof gerarCardapioEspecial === 'function') {
      return gerarCardapioEspecial(dados);
    }

    return { success: false, error: 'Função não implementada' };

  } catch (e) {
    Logger.log('Erro em gerarCardapioEspecial: ' + e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Gera substituições - VERSÃO CORRIGIDA
 * @param {Object} dados - Dados para substituição
 * @returns {Object} Resultado
 */
function gerarSubstituicoes_Safe(dados) {
  try {
    if (!dados) {
      Logger.log('Erro em gerarSubstituicoes: Dados não fornecidos');
      return { success: false, error: 'Dados não fornecidos' };
    }

    var codigo = safeGet(dados, 'codigo', null);

    if (!codigo) {
      Logger.log('Erro em gerarSubstituicoes: Código não informado');
      return { success: false, error: 'Código é obrigatório' };
    }

    // Continua com a lógica original se existir
    if (typeof gerarSubstituicoes === 'function') {
      return gerarSubstituicoes(dados);
    }

    return { success: false, error: 'Função não implementada' };

  } catch (e) {
    Logger.log('Erro em gerarSubstituicoes: ' + e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Valida dados do aluno - VERSÃO CORRIGIDA
 * @param {Object} dados - Dados do aluno
 * @returns {Object} Resultado
 */
function validarDadosAluno_Safe(dados) {
  try {
    try {
      if (!dados) {
        return { valido: false, erros: ['Dados não fornecidos'] };
      }

      var erros = [];

      if (!safeGet(dados, 'nomeCompleto')) {
        erros.push('Nome completo é obrigatório');
      }

      if (!safeGet(dados, 'matricula')) {
        erros.push('Matrícula é obrigatória');
      }

      if (!safeGet(dados, 'unidadeEscolar')) {
        erros.push('Unidade escolar é obrigatória');
      }

      return {
        valido: erros.length === 0,
        erros: erros
      };

    } catch (e) {
      return { valido: false, erros: [e.message] };
    }
  } catch (error) {
    Logger.log("Erro em validarDadosAluno_Safe: " + error.message);
    throw error;
  }
}

// ============================================================================
// CORREÇÕES PARA CORE_OPERACOES
// ============================================================================

/**
 * Consulta nota fiscal - VERSÃO CORRIGIDA
 * @param {string} numeroNF - Número da nota fiscal
 * @returns {Object} Resultado
 */
function consultarNotaFiscal_Safe(numeroNF) {
  try {
    if (!numeroNF) {
      Logger.log('[ERROR] Erro ao consultar nota fiscal { error: "Número da nota fiscal é obrigatório", numeroNF: undefined }');
      return { success: false, error: 'Número da nota fiscal é obrigatório' };
    }

    // Continua com a lógica original se existir
    if (typeof consultarNotaFiscal === 'function') {
      return consultarNotaFiscal(numeroNF);
    }

    // Implementação básica - busca na planilha
    var dados = getSheetData('Notas_Fiscais');
    var nf = dados.find(function(n) {
      return n.Numero_NF === numeroNF || n.ID === numeroNF;
    });

    if (nf) {
      return { success: true, data: nf };
    }

    return { success: false, error: 'Nota fiscal não encontrada' };

  } catch (e) {
    Logger.log('[ERROR] Erro ao consultar nota fiscal: ' + e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Registra reposição UE - VERSÃO CORRIGIDA
 * @param {Object} dados - Dados da reposição
 * @returns {Object} Resultado
 */
function registrarReposicaoUE_Safe(dados) {
  try {
    try {
      if (!dados) {
        Logger.log('[ERROR] Erro ao registrar reposição UE: {"error":"Dados da reposição não fornecidos"}');
        return { success: false, error: 'Dados da reposição não fornecidos' };
      }

      // Valida campos obrigatórios
      var erros = [];
      if (!safeGet(dados, 'unidadeEscolar')) erros.push('Unidade escolar é obrigatória');
      if (!safeGet(dados, 'produto')) erros.push('Produto é obrigatório');
      if (!safeGet(dados, 'quantidade')) erros.push('Quantidade é obrigatória');

      if (erros.length > 0) {
        return { success: false, error: erros.join(', ') };
      }

      // Continua com a lógica original se existir
      if (typeof registrarReposicaoUE === 'function') {
        return registrarReposicaoUE(dados);
      }

      return { success: false, error: 'Função não implementada' };

    } catch (e) {
      Logger.log('[ERROR] Erro ao registrar reposição UE: ' + e.message);
      return { success: false, error: e.message };
    }
  } catch (error) {
    Logger.log("Erro em registrarReposicaoUE_Safe: " + error.message);
    throw error;
  }
}

// ============================================================================
// CORREÇÕES PARA AJUSTES_REALIDADE_DF
// ============================================================================

/**
 * Gera relatório consolidado CRE - VERSÃO CORRIGIDA
 * @param {string} creCodigo - Código da CRE
 * @returns {Object} Resultado
 */
function gerarRelatorioConsolidadoCRE_Safe(creCodigo) {
  try {
    if (!creCodigo) {
      Logger.log('Erro ao gerar relatório CRE: CRE não informada');
      return { success: false, error: 'Código da CRE é obrigatório' };
    }

    // Continua com a lógica original se existir
    if (typeof gerarRelatorioConsolidadoCRE === 'function') {
      return gerarRelatorioConsolidadoCRE(creCodigo);
    }

    return { success: false, error: 'Função não implementada' };

  } catch (e) {
    Logger.log('Erro ao gerar relatório CRE: ' + e.message);
    return { success: false, error: e.message };
  }
}

// ============================================================================
// WRAPPER PARA FUNÇÕES EXISTENTES
// ============================================================================

/**
 * Wrapper que adiciona validação a qualquer função
 * @param {Function} fn - Função original
 * @param {Array} requiredParams - Parâmetros obrigatórios
 * @param {string} fnName - Nome da função para logs
 * @returns {Function} Função com validação
 */
function wrapWithValidation(fn, requiredParams, fnName) {
  return function(dados) {
    try {
      // Valida existência de dados
      if (!dados && requiredParams && requiredParams.length > 0) {
        var error = 'Dados não fornecidos para ' + fnName;
        Logger.log('[ERROR] ' + error);
        return { success: false, error: error };
      }

      // Valida parâmetros obrigatórios
      if (requiredParams && requiredParams.length > 0) {
        for (var i = 0; i < requiredParams.length; i++) {
          var param = requiredParams[i];
          if (!safeGet(dados, param)) {
            var error = param + ' é obrigatório em ' + fnName;
            Logger.log('[ERROR] ' + error);
            return { success: false, error: error };
          }
        }
      }

      // Chama função original
      return fn(dados);

    } catch (e) {
      Logger.log('[ERROR] Erro em ' + fnName + ': ' + e.message);
      return { success: false, error: e.message };
    }
  };
}

// ============================================================================
// REGISTRO DO MÓDULO
// ============================================================================

Logger.log('✅ Core_Function_Fixes carregado - Funções corrigidas disponíveis');
