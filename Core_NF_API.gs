/**
 * @fileoverview API de Notas Fiscais
 * @version 5.0.0
 *
 * Funções de API para gerenciamento de notas fiscais.
 *
 * @author UNIAE CRE Team
 * @created 2025-12-04
 */

'use strict';

/**
 * Lista notas fiscais com filtros opcionais
 * @param {Object} [filtros] - Filtros opcionais
 * @param {string} [filtros.status] - Filtrar por status
 * @param {string} [filtros.fornecedor] - Filtrar por fornecedor
 * @param {boolean} [filtros.semProcesso] - Apenas NFs sem processo vinculado
 * @returns {Object} Lista de notas fiscais
 */
function api_listarNotasFiscais(filtros) {
  try {
    try {
      filtros = filtros || {};

      var dados = getSheetData('Notas_Fiscais');

      // Aplica filtros
      if (filtros.status) {
        dados = dados.filter(function(nf) {
          return nf.Status_NF === filtros.status;
        });
      }

      if (filtros.fornecedor) {
        var fornecedorLower = filtros.fornecedor.toLowerCase();
        dados = dados.filter(function(nf) {
          return (nf.Fornecedor || '').toLowerCase().indexOf(fornecedorLower) >= 0;
        });
      }

      if (filtros.semProcesso) {
        dados = dados.filter(function(nf) {
          return !nf.Processo_Atesto_ID;
        });
      }

      // Ordena por data (mais recente primeiro)
      dados.sort(function(a, b) {
        return new Date(b.Data_Recebimento || b.Data_Registro) -
               new Date(a.Data_Recebimento || a.Data_Registro);
      });

      return {
        success: true,
        data: dados,
        total: dados.length
      };

    } catch (e) {
      AppLogger.error('Erro ao listar NFs', e);
      return { success: false, error: e.message, data: [] };
    }
  } catch (error) {
    Logger.log("Erro em api_listarNotasFiscais: " + error.message);
    throw error;
  }
}

/**
 * Busca nota fiscal por ID
 * @param {string} nfId - ID da nota fiscal
 * @returns {Object} Nota fiscal encontrada
 */
function api_buscarNF(nfId) {
  try {
    try {
      if (!nfId) {
        return { success: false, error: 'ID da NF é obrigatório' };
      }

      var sheet = getSheet('Notas_Fiscais');
      var data = sheet.getDataRange().getValues();
      var headers = data[0];

      var colId = headers.indexOf('ID');
      if (colId === -1) colId = 0;

      for (var i = 1; i < data.length; i++) {
        if (data[i][colId] === nfId) {
          var nf = {};
          headers.forEach(function(h, idx) {
            nf[h] = data[i][idx];
          });
          nf.rowIndex = i + 1;
          return { success: true, data: nf };
        }
      }

      return { success: false, error: 'NF não encontrada' };

    } catch (e) {
      AppLogger.error('Erro ao buscar NF', e);
      return { success: false, error: e.message };
    }
  } catch (error) {
    Logger.log("Erro em api_buscarNF: " + error.message);
    throw error;
  }
}

/**
 * Cria nova nota fiscal
 * @param {Object} dados - Dados da nota fiscal
 * @returns {Object} Resultado da operação
 */
function api_criarNF(dados) {
  try {
    if (!dados) {
      return { success: false, error: 'Dados da NF são obrigatórios' };
    }

    // Validações básicas
    if (!dados.Numero_NF) {
      return { success: false, error: 'Número da NF é obrigatório' };
    }

    // Verifica permissão
    if (!authHasPermission('write', 'Notas_Fiscais')) {
      return { success: false, error: 'Sem permissão para criar NF' };
    }

    // Prepara dados
    var nf = {
      ID: generateUniqueId('NF'),
      Numero_NF: dados.Numero_NF,
      Chave_Acesso: dados.Chave_Acesso || '',
      Data_Emissao: dados.Data_Emissao || '',
      Data_Recebimento: dados.Data_Recebimento || new Date(),
      CNPJ_Fornecedor: dados.CNPJ_Fornecedor || '',
      Fornecedor: dados.Fornecedor || '',
      Nota_Empenho: dados.Nota_Empenho || '',
      Valor_Total: dados.Valor_Total || 0,
      Status_NF: dados.Status_NF || 'PENDENTE',
      Responsavel_Conferencia: dados.Responsavel_Conferencia || '',
      Data_Conferencia: '',
      Observacoes: dados.Observacoes || '',
      Arquivo_PDF: dados.Arquivo_PDF || '',
      Processo_Atesto_ID: '',
      Data_Registro: new Date(),
      dataAtualizacao: new Date()
    };

    // Salva
    appendToSheet('Notas_Fiscais', nf);

    AppLogger.log('NF criada: ' + nf.Numero_NF);

    return {
      success: true,
      message: 'Nota fiscal criada com sucesso',
      data: nf
    };

  } catch (e) {
    AppLogger.error('Erro ao criar NF', e);
    return { success: false, error: e.message };
  }
}

/**
 * Atualiza nota fiscal
 * @param {string} nfId - ID da nota fiscal
 * @param {Object} dados - Dados a atualizar
 * @returns {Object} Resultado da operação
 */
function api_atualizarNF(nfId, dados) {
  try {
    if (!nfId) {
      return { success: false, error: 'ID da NF é obrigatório' };
    }

    // Verifica permissão
    if (!authHasPermission('write', 'Notas_Fiscais')) {
      return { success: false, error: 'Sem permissão para atualizar NF' };
    }

    // Busca NF
    var resultado = api_buscarNF(nfId);
    if (!resultado.success) {
      return resultado;
    }

    var nf = resultado.data;

    // Atualiza campos permitidos
    var camposPermitidos = [
      'Status_NF', 'Responsavel_Conferencia', 'Data_Conferencia',
      'Observacoes', 'Arquivo_PDF', 'Processo_Atesto_ID'
    ];

    camposPermitidos.forEach(function(campo) {
      if (dados[campo] !== undefined) {
        nf[campo] = dados[campo];
      }
    });

    nf.dataAtualizacao = new Date();

    // Salva
    updateSheetRow('Notas_Fiscais', nf.rowIndex, nf);

    AppLogger.log('NF atualizada: ' + nf.Numero_NF);

    return {
      success: true,
      message: 'Nota fiscal atualizada com sucesso',
      data: nf
    };

  } catch (e) {
    AppLogger.error('Erro ao atualizar NF', e);
    return { success: false, error: e.message };
  }
}

/**
 * Obtém estatísticas das notas fiscais
 * @returns {Object} Estatísticas
 */
function api_estatisticasNF() {
  try {
    try {
      var dados = getSheetData('Notas_Fiscais');

      var stats = {
        total: dados.length,
        porStatus: {},
        valorTotal: 0,
        pendentes: 0,
        atestadas: 0
      };

      dados.forEach(function(nf) {
        // Conta por status
        var status = nf.Status_NF || 'INDEFINIDO';
        stats.porStatus[status] = (stats.porStatus[status] || 0) + 1;

        // Soma valor
        stats.valorTotal += parseFloat(nf.Valor_Total) || 0;

        // Conta pendentes e atestadas
        if (status === 'PENDENTE' || status === 'RECEBIDA') {
          stats.pendentes++;
        } else if (status === 'ATESTADA' || status === 'APROVADA') {
          stats.atestadas++;
        }
      });

      return { success: true, data: stats };

    } catch (e) {
      AppLogger.error('Erro ao obter estatísticas', e);
      return { success: false, error: e.message };
    }
  } catch (error) {
    Logger.log("Erro em api_estatisticasNF: " + error.message);
    throw error;
  }
}

// ============================================================================
// FUNÇÕES DE INTERFACE
// ============================================================================

/**
 * Abre a interface de Processo SEI
 */
function abrirProcessoSEI() {
  try {
    var html = HtmlService.createTemplateFromFile('UI_Processo_SEI')
      .evaluate()
      .setTitle('Processo SEI - UNIAE CRE')
      .setWidth(900)
      .setHeight(700);

    var ui = getSafeUi();
    if (ui) {
      ui.showModalDialog(html, 'Processo SEI');
    } else {
      // Retorna URL para abrir em nova aba
      return ScriptApp.getService().getUrl() + '?page=processo_sei';
    }
  } catch (error) {
    Logger.log("Erro em abrirProcessoSEI: " + error.message);
    throw error;
  }
}

/**
 * Abre a interface de Notas Fiscais
 */
function abrirNotasFiscais() {
  try {
    var html = HtmlService.createTemplateFromFile('UI_CRUD_Page').evaluate()
      .setTitle('Notas Fiscais - UNIAE CRE')
      .setWidth(1000)
      .setHeight(700);

    var ui = getSafeUi();
    if (ui) {
      ui.showModalDialog(html, 'Notas Fiscais');
    }
  } catch (error) {
    Logger.log("Erro em abrirNotasFiscais: " + error.message);
    throw error;
  }
}

// Registro do módulo
if (typeof AppLogger !== 'undefined') {
  AppLogger.debug('Core_NF_API carregado');
}
