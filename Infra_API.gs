/**
 * @fileoverview API Backend Unificada
 * @version 2.0.0
 * @requires Core_CRUD.gs, Core_Logger.gs, ErrorHandler.gs
 */

'use strict';

// ==
// FUNÇÕES AUXILIARES
// ==

/**
 * Busca registro por ID
 */
function findById(sheetName, id) {
  return ErrorHandler.tryCatch(function() {
    var result = CRUD.findById(sheetName, id);
    if (result.success && result.data && result.data.length > 0) {
      return { success: true, data: result.data[0] };
    }
    return { success: false, error: 'Registro não encontrado' };
  }, 'findById(' + sheetName + ', ' + id + ')');
}

/**
 * Busca registro por campo específico
 */
function findByField(sheetName, fieldName, fieldValue) {
  return ErrorHandler.tryCatch(function() {
    var filters = {};
    filters[fieldName] = fieldValue;
    var result = CRUD.read(sheetName, { filters: filters, limit: 1 });
    if (result.success && result.data && result.data.length > 0) {
      return { success: true, data: result.data[0] };
    }
    return { success: false, error: 'Registro não encontrado' };
  }, 'findByField(' + sheetName + ', ' + fieldName + ')');
}

/**
 * Retorna estrutura de uma sheet (versão local)
 * @deprecated Use getSheetStructure() de Core_Dados.gs
 */
function _infra_getSheetStructure(sheetName) {
  try {
    try {
      var ss = SpreadsheetApp.openById(CONFIG.getSpreadsheetId());
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) return null;

      var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      return {
        name: sheetName,
        columns: headers,
        rowCount: sheet.getLastRow() - 1
      };
    } catch (e) {
      AppLogger.error('Erro ao obter estrutura de ' + sheetName, e);
      return null;
    }
  } catch (error) {
    Logger.log("Erro em _infra_getSheetStructure: " + error.message);
    throw error;
  }
}

/**
 * Retorna estruturas de todas as sheets (versão local)
 * @deprecated Use getAllSheetStructures() de Core_Dados.gs
 */
function _infra_getSheetStructures() {
  try {
    var structures = {};
    var sheetNames = Object.keys(CONFIG.SHEETS).map(function(key) {
      return CONFIG.SHEETS[key];
    });

    sheetNames.forEach(function(sheetName) {
      var structure = _infra_getSheetStructure(sheetName);
      if (structure) {
        structures[sheetName] = structure;
      }
    });

    return structures;
  } catch (error) {
    Logger.log("Erro em _infra_getSheetStructures: " + error.message);
    throw error;
  }
}

// ==
// OPERAÇÕES GENÉRICAS
// ==

/**
 * CREATE genérico
 */
function api_create(sheetName, data) {
  return ErrorHandler.tryCatch(function() {
    return CRUD.create(sheetName, data);
  }, 'api_create(' + sheetName + ')');
}

/**
 * READ genérico
 */
function api_read(sheetName, filters, options) {
  return ErrorHandler.tryCatch(function() {
    options = options || {};
    options.filters = filters || {};
    return CRUD.read(sheetName, options);
  }, 'api_read(' + sheetName + ')');
}

/**
 * UPDATE genérico
 */
function api_update(sheetName, rowIndex, data) {
  return ErrorHandler.tryCatch(function() {
    return CRUD.update(sheetName, rowIndex, data);
  }, 'api_update(' + sheetName + ')');
}

/**
 * DELETE genérico
 */
function api_delete(sheetName, rowIndex) {
  return ErrorHandler.tryCatch(function() {
    return CRUD.delete(sheetName, rowIndex);
  }, 'api_delete(' + sheetName + ')');
}

// ==
// NOTAS FISCAIS
// ==

function api_notas_create(data) {
  return api_create('Notas_Fiscais', data);
}

function api_notas_list(filters) {
  return api_read('Notas_Fiscais', filters);
}

function api_notas_get(id) {
  return findById('Notas_Fiscais', id);
}

function api_notas_update(rowIndex, data) {
  return api_update('Notas_Fiscais', rowIndex, data);
}

function api_notas_delete(rowIndex) {
  return api_delete('Notas_Fiscais', rowIndex);
}

function api_notas_search(filters) {
  return api_read('Notas_Fiscais', filters);
}

// ==
// ENTREGAS
// ==

function api_entregas_create(data) {
  return api_create('Entregas', data);
}

function api_entregas_list(filters) {
  return api_read('Entregas', filters);
}

function api_entregas_get(id) {
  return findById('Entregas', id);
}

function api_entregas_update(rowIndex, data) {
  return api_update('Entregas', rowIndex, data);
}

function api_entregas_delete(rowIndex) {
  return api_delete('Entregas', rowIndex);
}

// ==
// RECUSAS
// ==

function api_recusas_create(data) {
  return api_create('Recusas', data);
}

function api_recusas_list(filters) {
  return api_read('Recusas', filters);
}

function api_recusas_get(id) {
  return findById('Recusas', id);
}

function api_recusas_update(rowIndex, data) {
  return api_update('Recusas', rowIndex, data);
}

function api_recusas_delete(rowIndex) {
  return api_delete('Recusas', rowIndex);
}

// ==
// GLOSAS
// ==

function api_glosas_create(data) {
  return api_create('Glosas', data);
}

function api_glosas_list(filters) {
  return api_read('Glosas', filters);
}

function api_glosas_get(id) {
  return findById('Glosas', id);
}

function api_glosas_update(rowIndex, data) {
  return api_update('Glosas', rowIndex, data);
}

function api_glosas_delete(rowIndex) {
  return api_delete('Glosas', rowIndex);
}

// ==
// FORNECEDORES
// ==

function api_fornecedores_create(data) {
  return api_create('Fornecedores', data);
}

function api_fornecedores_list(filters) {
  return api_read('Fornecedores', filters);
}

function api_fornecedores_get(id) {
  return findById('Fornecedores', id);
}

function api_fornecedores_update(rowIndex, data) {
  return api_update('Fornecedores', rowIndex, data);
}

function api_fornecedores_delete(rowIndex) {
  return api_delete('Fornecedores', rowIndex);
}

function api_fornecedores_search(cnpj) {
  return findByField('Fornecedores', 'CNPJ', cnpj);
}

// ==
// PDGP (Programa de Distribuição de Gêneros Perecíveis)
// ==

function api_pdgp_create(data) {
  return api_create('PDGP', data);
}

function api_pdgp_list(filters) {
  return api_read('PDGP', filters);
}

function api_pdgp_get(id) {
  return findById('PDGP', id);
}

function api_pdgp_update(rowIndex, data) {
  return api_update('PDGP', rowIndex, data);
}

function api_pdgp_delete(rowIndex) {
  return api_delete('PDGP', rowIndex);
}

// ==
// PDGA (Planejamento de Demanda e Gestão Anual)
// ==

function api_pdga_create(data) {
  return api_create('PDGA', data);
}

function api_pdga_list(filters) {
  return api_read('PDGA', filters);
}

function api_pdga_get(id) {
  return findById('PDGA', id);
}

function api_pdga_update(rowIndex, data) {
  return api_update('PDGA', rowIndex, data);
}

function api_pdga_delete(rowIndex) {
  return api_delete('PDGA', rowIndex);
}

// ==
// CONTROLE DE CONFERÊNCIA
// ==

function api_conferencia_create(data) {
  return api_create('Controle_Conferencia', data);
}

function api_conferencia_list(filters) {
  return api_read('Controle_Conferencia', filters);
}

function api_conferencia_get(id) {
  return findById('Controle_Conferencia', id);
}

function api_conferencia_update(rowIndex, data) {
  return api_update('Controle_Conferencia', rowIndex, data);
}

function api_conferencia_delete(rowIndex) {
  return api_delete('Controle_Conferencia', rowIndex);
}

// ==
// AUDITORIA LOG
// ==

function api_auditoria_create(data) {
  return api_create('Auditoria_Log', data);
}

function api_auditoria_list(filters) {
  return api_read('Auditoria_Log', filters);
}

function api_auditoria_get(id) {
  return findById('Auditoria_Log', id);
}

// ==
// USUÁRIOS
// ==

function api_usuarios_create(data) {
  return api_create('Usuarios', data);
}

function api_usuarios_list(filters) {
  return api_read('Usuarios', filters);
}

function api_usuarios_get(id) {
  return findById('Usuarios', id);
}

function api_usuarios_update(rowIndex, data) {
  return api_update('Usuarios', rowIndex, data);
}

function api_usuarios_delete(rowIndex) {
  return api_delete('Usuarios', rowIndex);
}

function api_usuarios_findByEmail(email) {
  return findByField('Usuarios', 'Email', email);
}

// ==
// CONFIG MEMBROS COMISSÃO
// ==

function api_membros_create(data) {
  return api_create('Config_Membros_Comissao', data);
}

function api_membros_list(filters) {
  return api_read('Config_Membros_Comissao', filters);
}

function api_membros_get(id) {
  return findById('Config_Membros_Comissao', id);
}

function api_membros_update(rowIndex, data) {
  return api_update('Config_Membros_Comissao', rowIndex, data);
}

function api_membros_delete(rowIndex) {
  return api_delete('Config_Membros_Comissao', rowIndex);
}

// ==
// TEXTOS PADRÃO
// ==

function api_textos_create(data) {
  return api_create('Textos_Padrao', data);
}

function api_textos_list(filters) {
  return api_read('Textos_Padrao', filters);
}

function api_textos_get(id) {
  return findById('Textos_Padrao', id);
}

function api_textos_update(rowIndex, data) {
  return api_update('Textos_Padrao', rowIndex, data);
}

function api_textos_delete(rowIndex) {
  return api_delete('Textos_Padrao', rowIndex);
}

// ==
// SYSTEM LOGS
// ==

function api_logs_create(data) {
  return api_create('System_Logs', data);
}

function api_logs_list(filters) {
  return api_read('System_Logs', filters);
}

// ==
// DASHBOARD E MÉTRICAS
// ==

/**
 * Retorna métricas consolidadas para dashboard
 */
function api_dashboard_metrics() {
  try {
    try {
      return ErrorHandler.tryCatch(function() {
        var ss = getSS();
        var metrics = {
          notasFiscais: 0,
          entregas: 0,
          recusas: 0,
          glosas: 0,
          fornecedores: 0,
          valorTotalNFs: 0,
          valorTotalGlosas: 0,
          pendentes: 0
        };

        var sheets = ['Notas_Fiscais', 'Entregas', 'Recusas', 'Glosas', 'Fornecedores'];
        sheets.forEach(function(sheetName) {
          var sheet = ss.getSheetByName(sheetName);
          if (sheet && sheet.getLastRow() > 1) {
            var count = sheet.getLastRow() - 1;
            var key = sheetName.toLowerCase().replace('_', '');
            metrics[key] = count;
          }
        });

        var nfSheet = ss.getSheetByName('Notas_Fiscais');
        if (nfSheet && nfSheet.getLastRow() > 1) {
          var data = nfSheet.getDataRange().getValues();
          var headers = data[0];
          var valorIdx = headers.indexOf('Valor_Total');
          var statusIdx = headers.indexOf('Status_NF');

          for (var i = 1; i < data.length; i++) {
            metrics.valorTotalNFs += Number(data[i][valorIdx]) || 0;
            if (data[i][statusIdx] === CONSTANTS.STATUS_NF.RECEBIDA ||
                data[i][statusIdx] === CONSTANTS.STATUS_NF.PENDENTE) {
              metrics.pendentes++;
            }
          }
        }

        var glosasSheet = ss.getSheetByName('Glosas');
        if (glosasSheet && glosasSheet.getLastRow() > 1) {
          var data = glosasSheet.getDataRange().getValues();
          var headers = data[0];
          var valorIdx = headers.indexOf('Valor_Total_Glosa');

          for (var i = 1; i < data.length; i++) {
            metrics.valorTotalGlosas += Number(data[i][valorIdx]) || 0;
          }
        }

        return { success: true, data: metrics };
      }, 'api_dashboard_metrics');
    } catch (error) {
      Logger.log("Erro em api_dashboard_metrics: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em api_dashboard_metrics: " + error.message);
    throw error;
  }
}

/**
 * Retorna estruturas de todas as sheets
 * Usa a função canônica de Core_Dados.gs se disponível
 */
function api_get_structures() {
  // Usa a função canônica de Core_Dados.gs ou fallback local
  var structures = typeof getAllSheetStructures === 'function' 
    ? getAllSheetStructures() 
    : _infra_getSheetStructures();
  return { success : true, data : structures };
}

/**
 * Retorna estrutura de uma sheet específica
 * Usa a função canônica de Core_Dados.gs se disponível
 */
function api_get_structure(sheetName) {
  // Usa a função canônica de Core_Dados.gs ou fallback local
  var structure = typeof getSheetStructure === 'function' 
    ? getSheetStructure(sheetName) 
    : _infra_getSheetStructure(sheetName);
  if (structure) {
    return { success : true, data : structure };
  }
  return { success : false, error : 'Estrutura não encontrada' };
}
