'use strict';

/**
 * UI_MOBILE
 * Consolidado de : MobileBackend.gs
 * @version 2.0.0
 * @created 2025-11-04
 */


// ---- MobileBackend.gs ----
/**
 * MobileBackend.gs
 * Backend para Interface Mobile do Sistema UNIAE
 * Funções para servir a Web App e processar dados
 */

/**
 * Serve a interface mobile como Web App
 * RENOMEADO para evitar conflito com UI_WebApp.gs::doGet()
 */
function serveMobileInterface() {
  return HtmlService.createHtmlOutputFromFile('mobile-interface')
    .setTitle('UNIAE Mobile')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * FUNÇÕES DE ESTATÍSTICAS
 */

/**
 * Retorna estatísticas gerais do sistema
 */
function getSystemStats() {
  try {
    try {
      var stats = {
        notas_fiscais : 0,
        entregas : 0,
        pendentes : 0,
        glosas : 0
      };

      // Contar Notas Fiscais
      try {
        var nfSheet = getOrCreateSheetSafe('Notas_Fiscais');
        stats.notas_fiscais = Math.max(0, nfSheet.getLastRow() - 1);
      } catch (e) {
        Logger.log('Erro ao contar NFs : ' + e.message);
      }

      // Contar Entregas
      try {
        var entregasSheet = getOrCreateSheetSafe('Entregas');
        stats.entregas = Math.max(0, entregasSheet.getLastRow() - 1);
      } catch (e) {
        Logger.log('Erro ao contar entregas : ' + e.message);
      }

      // Contar Pendentes (Controle_Conferencia com status pendente)
      try {
        var confSheet = getOrCreateSheetSafe('Controle_Conferencia');
        var data = confSheet.getDataRange().getValues();
        if (data.length > 1) {
          var headers = data[0];
          var statusIdx = headers.indexOf('Status_Geral');
          if (statusIdx >= 0) {
            stats.pendentes = data.slice(1).filter(function(row) {
              return row[statusIdx] == 'PENDENTE' || row[statusIdx] == 'EM_CONFERENCIA';
            }).length;
          }
        }
      } catch (e) {
        Logger.log('Erro ao contar pendentes : ' + e.message);
      }

      // Contar Glosas
      try {
        var glosasSheet = getOrCreateSheetSafe('Glosas');
        stats.glosas = Math.max(0, glosasSheet.getLastRow() - 1);
      } catch (e) {
        Logger.log('Erro ao contar glosas : ' + e.message);
      }


    } catch (error) {
      Logger.log('Erro em getSystemStats : ' + error.message);
      return {
        notas_fiscais : 0,
        entregas : 0,
        pendentes : 0,
        glosas : 0
      };
    }
  } catch (error) {
    Logger.log("Erro em getSystemStats: " + error.message);
    throw error;
  }
}


/**
 * FUNÇÕES DE REGISTRO DE DADOS
 */

/**
 * Registra uma nova nota fiscal
 */
function registrarNotaFiscal(data) {
  try {
    try {
      try {
        try {
          var sheet = getOrCreateSheetSafe('Notas_Fiscais');
          var structure = SHEET_STRUCTURES['Notas_Fiscais'];

          if (!structure) {
            throw new Error('Estrutura Notas_Fiscais não encontrada');
          }

          // Preparar dados na ordem dos headers
          var row = [
            'NF_' + new Date().getTime(), // ID_NF
            data.numero_nf,               // Numero_NF
            data.chave_acesso,            // Chave_Acesso
            data.data_emissao,            // Data_Emissao
            new Date(),                   // Data_Recebimento
            data.cnpj,                    // Fornecedor_CNPJ
            data.fornecedor,              // Fornecedor_Nome
            data.nota_empenho,            // Nota_Empenho
            data.valor_total,             // Valor_Total
            'Recebida',                   // Status_NF
            '',                           // Responsavel_Conferencia
            '',                           // Data_Conferencia
            '',                           // Observacoes
            '', // Arquivo_PDF
          ];

          sheet.appendRow(row);
          return {
            success : true,
            message : 'Nota fiscal registrada com sucesso'
          };

        } catch (error) {
          Logger.log('Erro em registrarNotaFiscal : ' + error.message);
          throw new Error('Falha ao registrar nota fiscal : ' + error.message);
        }
      } catch (error) {
        Logger.log("Erro em registrarNotaFiscal: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em registrarNotaFiscal: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em registrarNotaFiscal: " + error.message);
    throw error;
  }
}


/**
 * Registra uma nova entrega (versão mobile)
 * @deprecated Use registrarEntrega() de UI_WebApp.gs para consistência
 */
function registrarEntrega_Mobile(data) {
  try {
    try {
      try {
        try {
          var sheet = getOrCreateSheetSafe('Entregas');
          var structure = SHEET_STRUCTURES['Entregas'];

          if (!structure) {
            throw new Error('Estrutura Entregas não encontrada');
          }

          var row = [
            'ENT_' + new Date().getTime(), // ID_Entrega
            data.data_entrega,             // Data_Entrega
            data.unidade_escolar,          // Unidade_Escolar
            data.fornecedor,               // Fornecedor_Nome
            '',                            // Produto_Codigo
            data.produto,                  // Produto_Nome
            '',                            // Quantidade_Solicitada
            data.quantidade,               // Quantidade_Entregue
            data.unidade_medida,           // Unidade_Medida
            '',                            // Valor_Unitario
            '',                            // Valor_Total
            'Entregue',                    // Status_Entrega
            data.qualidade_ok,             // Qualidade_OK
            Session.getActiveUser().getEmail(), // Responsavel_Recebimento
            '', // Observacoes
          ];

          sheet.appendRow(row);

          return {
            success: true,
            message: 'Entrega registrada com sucesso'
          };

        } catch (error) {
          Logger.log('Erro em registrarEntrega: ' + error.message);
          return {
            success: false,
            error: 'Falha ao registrar entrega: ' + error.message
          };
        }
      } catch (error) {
        Logger.log("Erro em registrarEntrega_Mobile: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em registrarEntrega_Mobile: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em registrarEntrega_Mobile: " + error.message);
    throw error;
  }
}


/**
 * Registra conferência de nota fiscal
 */
function registrarConferencia(data) {
  try {
    try {
      try {
        try {
          var sheet = getOrCreateSheetSafe('Controle_Conferencia');
          var structure = SHEET_STRUCTURES['Controle_Conferencia'];

          if (!structure) {
            throw new Error('Estrutura Controle_Conferencia não encontrada');
          }

          // Calcular percentual de conclusão
          var etapas = [data.status_soma, data.status_pdgp, data.status_consulta_nf];
          var concluidas = etapas.filter(function(s) { return s == 'CONCLUIDO'; }).length;
          var percentual = (concluidas / 3 * 100).toFixed(0);

          var row = [
            'CONF_' + new Date().getTime(), // ID_Controle
            new Date(), // Data_Controle
            '', // Empresa_Fornecedor
            data.numero_nf, // Numero_NF
            '', // Valor_Total
            data.status_soma, // Status_Soma
            new Date(), // Data_Soma
            data.responsavel, // Responsavel_Soma
            data.observacoes || '', // Observacoes_Soma
            data.status_pdgp, // Status_PDGP
            new Date(), // Data_PDGP
            data.responsavel, // Responsavel_PDGP
            '', // Observacoes_PDGP
            data.status_consulta_nf, // Status_Consulta_NF
            new Date(), // Data_Consulta_NF
            data.responsavel, // Responsavel_Consulta_NF
            '', // Chave_Acesso_Verificada
            'PENDENTE', // Status_Atesto
            '', // Data_Atesto
            '', // Responsavel_Atesto
            '', // Numero_Despacho
            'EM_CONFERENCIA', // Status_Geral
            percentual, // Percentual_Conclusao
            '', // Prazo_Limite
            0, // Dias_Pendente
            'NAO', // Tem_Cancelamento
            'NAO', // Tem_Devolucao
            '', // Detalhes_Ocorrencias
          ];

          sheet.appendRow(row);
          return {
            success : true,
            message : 'Conferência registrada com sucesso'
          };

        } catch (error) {
          Logger.log('Erro em registrarConferencia : ' + error.message);
          throw new Error('Falha ao registrar conferência : ' + error.message);
        }
      } catch (error) {
        Logger.log("Erro em registrarConferencia: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em registrarConferencia: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em registrarConferencia: " + error.message);
    throw error;
  }
}


/**
 * Registra uma recusa (versão mobile)
 * @deprecated Use registrarRecusa() de Core_Workflow_API.gs para fluxo completo
 */
function registrarRecusa_Mobile(data) {
  try {
    try {
      try {
        var sheet = getOrCreateSheetSafe('Recusas');
        var structure = SHEET_STRUCTURES['Recusas'];

        if (!structure) {
          throw new Error('Estrutura Recusas não encontrada');
        }

        var row = [
          'REC_' + new Date().getTime(), // ID_Recusa
          new Date(), // Data_Recusa
          data.fornecedor, // Fornecedor_Nome
          data.produto, // Produto_Nome
          data.quantidade, // Quantidade_Recusada
          '', // Unidade_Medida
          data.motivo, // Motivo_Recusa
          data.motivo, // Categoria_Problema
          data.responsavel, // Responsavel_Recusa
          'Pendente', // Status_Resolucao
          '', // Data_Resolucao
          '', // Acao_Tomada
          '', // Valor_Impacto
          '', // Observacoes
        ];

        sheet.appendRow(row);
        return {
          success : true,
          message : 'Recusa registrada com sucesso'
        };

      } catch (error) {
        Logger.log('Erro em registrarRecusa : ' + error.message);
        throw new Error('Falha ao registrar recusa : ' + error.message);
      }
    } catch (error) {
      Logger.log("Erro em registrarRecusa_Mobile: " + error.message);
      throw error; // Re-lança para tratamento superior
    }
  } catch (error) {
    Logger.log("Erro em registrarRecusa_Mobile: " + error.message);
    throw error;
  }
}


/**
 * Registra uma glosa
 */
function registrarGlosa(data) {
  try {
    try {
      try {
        try {
          var sheet = getOrCreateSheetSafe('Glosas');
          var structure = SHEET_STRUCTURES['Glosas'];

          if (!structure) {
            throw new Error('Estrutura Glosas não encontrada');
          }

          var row = [
            'GLO_' + new Date().getTime(), // ID_Glosa
            new Date(), // Data_Glosa
            data.numero_nf, // Numero_NF
            data.fornecedor, // Fornecedor_Nome
            data.produto, // Produto_Item
            '', // Quantidade_Glosada
            '', // Valor_Unitario
            data.valor_glosa, // Valor_Total_Glosa
            data.motivo, // Motivo_Glosa
            data.motivo, // Categoria_Glosa
            'Aplicada', // Status_Glosa
            data.responsavel, // Responsavel_Glosa
            '', // Data_Contestacao
            '', // Justificativa_Fornecedor
            '', // Decisao_Final
            '', // Observacoes
          ];

          sheet.appendRow(row);
          return {
            success : true,
            message : 'Glosa registrada com sucesso'
          };

        } catch (error) {
          Logger.log('Erro em registrarGlosa : ' + error.message);
          throw new Error('Falha ao registrar glosa : ' + error.message);
        }
      } catch (error) {
        Logger.log("Erro em registrarGlosa: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em registrarGlosa: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em registrarGlosa: " + error.message);
    throw error;
  }
}


/**
 * Registra um fornecedor
 */
function registrarFornecedor(data) {
  try {
    try {
      try {
        try {
          var sheet = getOrCreateSheetSafe('Fornecedores');
          var structure = SHEET_STRUCTURES['Fornecedores'];

          if (!structure) {
            throw new Error('Estrutura Fornecedores não encontrada');
          }

          var row = [
            'FORN_' + new Date().getTime(), // ID_Fornecedor
            data.cnpj, // CNPJ
            data.razao_social, // Razao_Social
            data.nome_fantasia || '', // Nome_Fantasia
            data.email || '', // Email_Contato
            data.telefone || '', // Telefone
            '', // Endereco_Completo
            '', // Responsavel_Comercial
            'Ativo', // Status_Fornecedor
            0, // Avaliacao_Geral
            0, // Total_Entregas
            0, // Total_Recusas
            0, // Total_Glosas
            100, // Percentual_Conformidade
            new Date(), // Data_Ultima_Avaliacao
            '', // Observacoes
          ];

          sheet.appendRow(row);
          return {
            success : true,
            message : 'Fornecedor cadastrado com sucesso'
          };

        } catch (error) {
          Logger.log('Erro em registrarFornecedor : ' + error.message);
          throw new Error('Falha ao cadastrar fornecedor : ' + error.message);
        }
      } catch (error) {
        Logger.log("Erro em registrarFornecedor: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em registrarFornecedor: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em registrarFornecedor: " + error.message);
    throw error;
  }
}


/**
 * Registra planejamento PDGP
 */
function registrarPDGP(data) {
  try {
    try {
      try {
        var sheet = getOrCreateSheetSafe('PDGP');
        var structure = SHEET_STRUCTURES['PDGP'];

        if (!structure) {
          throw new Error('Estrutura PDGP não encontrada');
        }

        var row = [
          'PDGP_' + new Date().getTime(), // ID_PDGP
          data.ano,                        // Ano_Referencia
          data.periodo,                    // Periodo
          data.unidade_escolar,            // Unidade_Escolar
          data.produto,                    // Produto_Nome
          '',                              // Categoria_Produto
          data.quantidade,                 // Quantidade_Planejada
          '',                              // Unidade_Medida
          '',                              // Valor_Estimado
          '',                              // Fornecedor_Previsto
          'Planejado',                     // Status_Planejamento
          '',                              // Data_Inicio_Prevista
          '',                              // Data_Fim_Prevista
          '', // Observacoes
        ];

        sheet.appendRow(row);

        return {
          success: true,
          message: 'Planejamento PDGP registrado com sucesso'
        };

      } catch (error) {
        Logger.log('Erro em registrarPDGP: ' + error.message);
        return {
          success: false,
          error: 'Falha ao registrar PDGP: ' + error.message
        };
      }
    } catch (error) {
      Logger.log("Erro em registrarPDGP: " + error.message);
      throw error; // Re-lança para tratamento superior
    }
  } catch (error) {
    Logger.log("Erro em registrarPDGP: " + error.message);
    throw error;
  }
}


/**
 * FUNÇÕES DE DASHBOARD
 */

/**
 * Retorna dados para o dashboard (versão mobile)
 * @deprecated Use getDashboardMetricsUnificado() de Core_CRUD_Frontend_Bridge.gs
 */
function getDashboardData_Mobile() {
  try {
    var data = {
      stats : getSystemStats(),
      recent_nfs : getRecentNotasFiscais(5),
      pending_conferences : getPendingConferences(5),
      recent_glosas : getRecentGlosas(5)
    };


  } catch (error) {
    Logger.log('Erro em getDashboardData : ' + error.message);
    return {
      stats : {},
      recent_nfs : [],
      pending_conferences : [],
      recent_glosas : []
    };
  }
}


/**
 * Retorna notas fiscais recentes
 */
function getRecentNotasFiscais(limit) {
  try {
    try {
      try {
        var sheet = getOrCreateSheetSafe('Notas_Fiscais');
        var data = sheet.getDataRange().getValues();

        if (data.length <= 1) return [];

        var headers = data[0];
        var rows = data.slice(1).slice(-limit);

        return rows.map(function(row) {
          var obj = {};
          headers.forEach(function(header, idx) {
            obj[header] = row[idx];
          });
        });

      } catch (error) {
        Logger.log('Erro em getRecentNotasFiscais : ' + error.message);
        return [];
      }
    } catch (error) {
      Logger.log("Erro em getRecentNotasFiscais: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em getRecentNotasFiscais: " + error.message);
    throw error;
  }
}


/**
 * Retorna conferências pendentes
 */
function getPendingConferences(limit) {
  try {
    try {
      try {
        var sheet = getOrCreateSheetSafe('Controle_Conferencia');
        var data = sheet.getDataRange().getValues();

        if (data.length <= 1) return [];

        var headers = data[0];
        var statusIdx = headers.indexOf('Status_Geral');

        var pending = data.slice(1).filter(function(row) {
          return row[statusIdx] == 'PENDENTE' || row[statusIdx] == 'EM_CONFERENCIA';
        }).slice(0, limit);

        return pending.map(function(row) {
          var obj = {};
          headers.forEach(function(header, idx) {
            obj[header] = row[idx];
          });
          return obj;
        });
      } catch (error) {
        Logger.log("Erro em getPendingConferences: " + error.message);
        throw error;
      }
    } catch (error) {
      Logger.log("Erro em getPendingConferences: " + error.message);
      throw error;
    }

  } catch (error) {
    Logger.log('Erro em getPendingConferences : ' + error.message);
    return [];
  }
}


/**
 * Retorna glosas recentes
 */
function getRecentGlosas(limit) {
  try {
    try {
      try {
        var sheet = getOrCreateSheetSafe('Glosas');
        var data = sheet.getDataRange().getValues();

        if (data.length <= 1) return [];

        var headers = data[0];
        var rows = data.slice(1).slice(-limit);

        return rows.map(function(row) {
          var obj = {};
          headers.forEach(function(header, idx) {
            obj[header] = row[idx];
          });
        });

      } catch (error) {
        Logger.log('Erro em getRecentGlosas : ' + error.message);
        return [];
      }
    } catch (error) {
      Logger.log("Erro em getRecentGlosas: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em getRecentGlosas: " + error.message);
    throw error;
  }
}


/**
 * FUNÇÃO PARA TESTAR A WEB APP
 */
function testarWebApp() {
  try {
    var url = ScriptApp.getService().getUrl();
    Logger.log('URL da Web App : ' + url);

    var ui = getSafeUi();
    ui.alert('Web App URL',
      'URL da aplicação mobile : \n\n' + url + '\n\n' +
      'Copie esta URL e abra em um navegador mobile ou desktop.',
      ui.ButtonSet.OK
    );

    return url;
  } catch (error) {
    Logger.log("Erro em testarWebApp: " + error.message);
    throw error;
  }
}

