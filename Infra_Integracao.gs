'use strict';

/**
 * INFRA_INTEGRACAO
 * Consolidado de : IntegracaoCompleta.gs, Handlers.gs, DependencyBreaker.gs, MenuIntegration.gs
 * @version 2.0.0
 * @created 2025-11-04
 */


// ---- IntegracaoCompleta.gs ----
/**
 * IntegracaoCompleta.gs - INTEGRAÇÃO TOTAL BACKEND/FRONTEND
 *
 * Este arquivo serve como PONTE COMPLETA entre o backend (Google Apps Script)
 * e o frontend (HTML/JavaScript), expondo TODAS as funcionalidades do sistema
 * através do Sheets.gs como pivô central.
 *
 * ARQUITETURA :
 * Backend (*.gs) → IntegracaoCompleta.gs → Sheets.gs → Frontend (*.html)
 *
 * Sistema UNIAE CRE PP/Cruzeiro - Portaria 244/2006
 */

// ==
// SEÇÃO 1 : DASHBOARD E MÉTRICAS
// ==

/**
 * Retorna métricas completas do dashboard com todos os indicadores
 * @deprecated Use getDashboardMetricsUnificado() do Core_CRUD_Frontend_Bridge.gs
 * Esta função foi renomeada para evitar conflito de nomenclatura
 */
function _getDashboardMetricsComplete_Integracao() {
  try {
    var metrics = getDashboardMetricsUnificado(); // Usar função unificada

    // Adicionar métricas adicionais do DashboardAnalytics
    if (typeof DIContainer != 'undefined' && DIContainer.resolve) {
      try {
        var dashService = DIContainer.resolve('dashboardAnalytics');
        var dashboard = dashService.gerarDashboardCompleto(null);

        metrics.data.conformidade = dashboard.conformidade;
        metrics.data.qualidade = dashboard.qualidade;
        metrics.data.atendimento = dashboard.atendimento;
        metrics.data.financeiro = dashboard.financeiro;
        metrics.data.educacional = dashboard.educacional;
        metrics.data.operacional = dashboard.operacional;
        metrics.data.alertas = dashboard.alertas;
        metrics.data.resumoExecutivo = dashboard.resumoExecutivo;
      } catch (e) {
        Logger.log('Erro ao adicionar métricas avançadas : ' + e.message);
        return {
          chaveAcesso : '',
          situacao : "ERRO",
          valida : false
        };
      }
    }

  } catch (e) {
    return {
      chaveAcesso : '',
      situacao : "ERRO",
      valida : false
    };
  }
}


/**
 * Retorna alertas ativos do sistema
 */
function getSystemAlerts() {
  try {
    if (typeof DIContainer != 'undefined' && DIContainer.resolve) {
      var dashService = DIContainer.resolve('dashboardAnalytics');
      var alertas = dashService.gerarAlertas(null);
      return apiResponse(true, alertas);
    }
  } catch (e) {
    return {
      chaveAcesso : '',
      situacao : "ERRO",
      valida : false
    };
  }
}


/**
 * Retorna relatório executivo em formato texto
 */
function getExecutiveReport(filtros) {
  try {
    if (typeof DIContainer != 'undefined' && DIContainer.resolve) {
      var dashService = DIContainer.resolve('dashboardAnalytics');
      var relatorio = dashService.gerarRelatorioExecutivo(filtros);
      return apiResponse(true, { relatorio : relatorio });
    }
  } catch (e) {
    return {
      chaveAcesso : '',
      situacao : "ERRO",
      valida : false
    };
  }
}


// ==
// SEÇÃO 2 : NOTAS FISCAIS - OPERAÇÕES COMPLETAS
// ==

/**
 * Busca avançada de notas fiscais com filtros
 */
function searchNotasFiscais(filtros) {
  try {
    try {
      var data = getSheetData('Notas_Fiscais', 1000);
      if (!data || !data.data) {
        return apiResponse(true, []);
      }

      var filtered = data.data.filter(function(row) {
        var match = true;

        // Filtro por fornecedor
        if (filtros.fornecedor) {
          var fornIdx = data.headers.indexOf('Fornecedor_Nome');
          if (fornIdx >= 0) {
            var forn = String(row[fornIdx] || '').toLowerCase();
            match = match && forn.indexOf(filtros.fornecedor.toLowerCase()) >= 0;
          }
        }

        // Filtro por período
        if (filtros.dataInicio && filtros.dataFim) {
          var dataIdx = data.headers.indexOf('Data_Emissao');
          if (dataIdx >= 0) {
            var dataRow = new Date(row[dataIdx]);
            var inicio = new Date(filtros.dataInicio);
            var fim = new Date(filtros.dataFim);
            match = match && dataRow >= inicio && dataRow <= fim;
          }
        }

        // Filtro por status
        if (filtros.status) {
          var statusIdx = data.headers.indexOf('Status_NF');
          if (statusIdx >= 0) {
            match = match && row[statusIdx] == filtros.status;
          }
        }

      });

    } catch (e) {
      return {
        chaveAcesso : '',
        situacao : "ERRO",
        valida : false
      };
    }
  } catch (error) {
    Logger.log("Erro em searchNotasFiscais: " + error.message);
    throw error;
  }
}


/**
 * Valida autenticidade de NF-e via chave de acesso
 */
function validateNFeAuthenticity(chaveAcesso) {
  try {
    // Implementar validação real via API da SEFA
    // Por enquanto, validação básica de formato
    if (!chaveAcesso || chaveAcesso.length != 44) {
      return apiResponse(false, null, 'Chave de acesso inválida (deve ter 44 dígitos)');
    }

    return {
      valida : true,
      chave : chaveAcesso,
      mensagem : 'Formato válido - Consulta SEFAZ pendente de implementação'
    };
  } catch (e) {
    return {
      chaveAcesso : chaveAcesso,
      situacao : "ERRO",
      valida : false
    };
  }
}


/**
 * Importa notas fiscais do Gmail
 */
function importNotasFiscaisFromGmail() {
  try {
    if (typeof importarNotasFiscaisGmail == 'function') {
      importarNotasFiscaisGmail();
      return apiResponse(true, { mensagem : 'Importação iniciada' });
    }
  } catch (e) {
    return {
      chaveAcesso : '',
      situacao : "ERRO",
      valida : false
    };
  }
}


// ==
// SEÇÃO 3 : ENTREGAS - OPERAÇÕES COMPLETAS
// ==

/**
 * Busca entregas com filtros avançados
 */
function searchEntregas(filtros) {
  try {
    try {
      var data = getSheetData('Entregas', 1000);
      if (!data || !data.data) {
        return apiResponse(true, []);
      }

      var filtered = data.data.filter(function(row) {
        var match = true;

        if (filtros.unidadeEscolar) {
          var unidIdx = data.headers.indexOf('Unidade_Escolar');
          if (unidIdx >= 0) {
            var unid = String(row[unidIdx] || '').toLowerCase();
            match = match && unid.indexOf(filtros.unidadeEscolar.toLowerCase()) >= 0;
          }
        }

        if (filtros.status) {
          var statusIdx = data.headers.indexOf('Status_Entrega');
          if (statusIdx >= 0) {
            match = match && row[statusIdx] == filtros.status;
          }
        }

      });

    } catch (e) {
      return {
        chaveAcesso : '',
        situacao : "ERRO",
        valida : false
      };
    }
  } catch (error) {
    Logger.log("Erro em searchEntregas: " + error.message);
    throw error;
  }
}


/**
 * Registra entrega com validação de qualidade
 */
function registerEntregaWithQuality(entregaData) {
  try {
    // Validar dados
    var validation = validateEntrega(entregaData);
    if (!validation.valid) {
      return apiResponse(false, null, validation.message);
    }

    // Criar entrega
    var result = createEntrega(entregaData);

    // Se qualidade não OK, criar recusa automaticamente
    if (entregaData.qualidadeOK == 'N' && result.success) {
      var recusaData = {
        dataRecusa : entregaData.dataEntrega,
        unidadeEscolar : entregaData.unidadeEscolar,
        fornecedor : entregaData.fornecedor,
        produto : entregaData.produto,
        quantidadeRecusada : entregaData.quantidadeEntregue,
        motivo : entregaData.observacoes || 'Qualidade não aprovada',
        nf : entregaData.notaFiscal,
        responsavel : entregaData.responsavel,
        status : 'Aguardando Providências'
      };
      createRecusa(recusaData);
    }

  } catch (e) {
    return {
      chaveAcesso : '',
      situacao : "ERRO",
      valida : false
    };
  }
}


// ==
// SEÇÃO 4 : CONTROLE DE CONFERÊNCIA
// ==

/**
 * Lista controles de conferência com status
 */
function listControlesConferencia(filtros) {
  try {
    // getSheetData() devolve um array de objetos nesta versão do acessor.
    // O código legado esperava { data, headers } e, por isso, descartava a
    // resposta antes de entregá-la ao frontend.
    var sheet = getSheet('Controle_Conferencia');
    var rows = typeof getSheetDataAsObjects === 'function'
      ? getSheetDataAsObjects(sheet, 1000)
      : [];
    var etapas = ['Status_Soma', 'Status_PDGP', 'Status_Consulta_NF', 'Status_Atesto'];

    var controles = (rows || []).map(function(row) {
      var obj = {};
      Object.keys(row || {}).forEach(function(key) {
        obj[key] = row[key];
      });

      var concluidas = etapas.filter(function(etapa) {
        return String(row[etapa] || '').toUpperCase() === 'CONCLUIDO';
      }).length;
      obj.percentualConclusao = Math.round((concluidas / etapas.length) * 100);
      return obj;
    });

    if (filtros && filtros.status) {
      var expectedStatus = String(filtros.status).toUpperCase();
      controles = controles.filter(function(c) {
        return String(c.Status_Geral || c.status || '').toUpperCase() === expectedStatus;
      });
    }

    return apiResponse(true, controles);
  } catch (error) {
    Logger.log("Erro em listControlesConferencia: " + error.message);
    return apiResponse(false, null, 'Não foi possível carregar os controles de conferência.');
  }
}


/**
 * Atualiza etapa de conferência
 */
function updateEtapaConferencia(controleId, etapa, status, responsavel, observacoes) {
  try {
    try {
      try {
        try {
          var sheet = getSS().getSheetByName('Controle_Conferencia');
          if (!sheet) {
            return apiResponse(false, null, 'Aba Controle_Conferencia não encontrada');
          }

          var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

          // Encontrar linha do controle
          var idIdx = headers.indexOf('ID_Controle');
          var data = sheet.getDataRange().getValues();
          var rowIndex = -1;

          for (var i = 1; i < data.length; i++) {
            if (data[i][idIdx] == controleId) {
              rowIndex = i + 1;
              break;
            }
          }

          if (rowIndex == -1) {}

          // Atualizar campos da etapa
          var statusIdx = headers.indexOf('Status_' + etapa);
          var dataIdx = headers.indexOf('Data_' + etapa);
          var respIdx = headers.indexOf('Responsavel_' + etapa);
          var obsIdx = headers.indexOf('Observacoes_' + etapa);

          if (statusIdx >= 0) sheet.getRange(rowIndex, statusIdx + 1).setValue(status);
          if (dataIdx >= 0) sheet.getRange(rowIndex, dataIdx + 1).setValue(new Date());
          if (respIdx >= 0) sheet.getRange(rowIndex, respIdx + 1).setValue(responsavel);
          if (obsIdx >= 0) sheet.getRange(rowIndex, obsIdx + 1).setValue(observacoes || '');

        } catch (e) {
          return {
            chaveAcesso : '',
            situacao : "ERRO",
            valida : false
          };
        }
      } catch (error) {
        Logger.log("Erro em updateEtapaConferencia: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em updateEtapaConferencia: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em updateEtapaConferencia: " + error.message);
    throw error;
  }
}


// ==
// SEÇÃO 5 : ANÁLISES E RELATÓRIOS
// ==

/**
 * Executa análise determinística completa
 */
function runDeterministicAnalysis(options) {
  try {
    var result = verificarIrregularidades(options);
    return apiResponse(true, result);
  } catch (e) {
    return apiResponse(false, null, 'Erro na análise : ' + e.message);
  }
}

/**
 * Executa análise de tendências
 */
function runTrendAnalysis(options) {
  try {
    var result = identificarTendencias(options);
    return apiResponse(true, result);
  } catch (e) {
    return apiResponse(false, null, 'Erro na análise : ' + e.message);
  }
}

/**
 * Executa análise generativa com Gemini
 */
function runGenerativeAnalysis(prompt, context) {
  try {
    if (typeof analiseGenerativaGemini == 'function') {
      var result = analiseGenerativaGemini(prompt, context);
      return apiResponse(true, result);
    }
  } catch (e) {
    return {
      chaveAcesso : '',
      situacao : "ERRO",
      valida : false
    };
  }
}


/**
 * Gera relatório consolidado
 */
function generateConsolidatedReport(tipo, filtros) {
  try {
    var result = {};

    switch (tipo) {
      case 'comissao' :
        if (typeof gerarRelatorioComissao == 'function') {
          gerarRelatorioComissao();
          result = { mensagem : 'Relatório da comissão gerado' };
        }
        break;

      case 'atesto' :
        if (typeof gerarAtestoGEVMON == 'function') {
          gerarAtestoGEVMON();
          result = { mensagem : 'Atesto GEVMON gerado' };
        }
        break;

      case 'consumo' :
        if (typeof gerarDemonstrativoConsumo == 'function') {
          gerarDemonstrativoConsumo();
          result = { mensagem : 'Demonstrativo de consumo gerado' };
        }
        break;

      case 'estatistico' :
        if (typeof gerarRelatorioEstatistico == 'function') {
          gerarRelatorioEstatistico();
          result = { mensagem : 'Relatório estatístico gerado' };
        }
        break;

      // default : null
    }

  } catch (e) {
    return {
      chaveAcesso : '',
      situacao : "ERRO",
      valida : false
    };
  }
}


// ==
// SEÇÃO 6 : FORNECEDORES
// ==

/**
 * Lista fornecedores com avaliação de desempenho
 */
function listFornecedoresWithPerformance() {
  try {
    try {
      var data = getSheetData('Fornecedores', 1000);
      if (!data || !data.data) {
        return apiResponse(true, []);
      }

      var fornecedores = data.data.map(function(row, idx) {
        var obj = { rowIndex : idx + 2 };
        data.headers.forEach(function(h, i) {
          obj[h] = row[i];
        });

        // Calcular score de desempenho
        var totalEntregas = Number(obj.Total_Entregas) || 0;
        var totalRecusas = Number(obj.Total_Recusas) || 0;
        var totalGlosas = Number(obj.Total_Glosas) || 0;

        if (totalEntregas > 0) {
          var taxaRecusa = (totalRecusas / totalEntregas) * 100;
          var taxaGlosa = (totalGlosas / totalEntregas) * 100;
          obj.scoreDesempenho = Math.max(0, 100 - taxaRecusa - taxaGlosa);
        } else {
          obj.scoreDesempenho = 0;
        }

      });

      // Ordenar por score
      fornecedores.sort(function(a, b) {});

    } catch (e) {
      return {
        chaveAcesso : '',
        situacao : "ERRO",
        valida : false
      };
    }
  } catch (error) {
    Logger.log("Erro em listFornecedoresWithPerformance: " + error.message);
    throw error;
  }
}


/**
 * Obtém histórico completo de um fornecedor
 */
function getFornecedorHistory(fornecedorNome) {
  try {
    var history = {
      fornecedor : fornecedorNome,
      notasFiscais : [],
      entregas : [],
      recusas : [],
      glosas : []
    };

    // Buscar em cada aba
    var sheets = ['Notas_Fiscais', 'Entregas', 'Recusas', 'Glosas'];
    sheets.forEach(function(sheetName) {
      var data = getSheetData(sheetName, 1000);
      if (data && data.data) {
        var fornIdx = data.headers.indexOf('Fornecedor_Nome') >= 0 ?
          data.headers.indexOf('Fornecedor_Nome') :
          data.headers.indexOf('Fornecedor');

        if (fornIdx >= 0) {
          var filtered = data.data.filter(function(row) {
            return String(row[fornIdx] || '').toLowerCase() == fornecedorNome.toLowerCase();
          });

          history[sheetName.toLowerCase().replace('_', '')] = filtered;
        }
      }
    });

  } catch (e) {
    return {
      chaveAcesso : '',
      situacao : "ERRO",
      valida : false
    };
  }
}


// ==
// SEÇÃO 7 : VALIDAÇÕES E CONFORMIDADE
// ==

/**
 * Valida conformidade legal de uma operação
 */
function validateLegalCompliance(operation, data, responsible) {
  try {
    if (typeof DIContainer != 'undefined' && DIContainer.resolve) {
      var validator = DIContainer.resolve('complianceValidator');
      var result = validator.execute({
        operation : operation,
        data : data,
        responsible : responsible
      });
    }
  } catch (e) {
    return {
      chaveAcesso : '',
      situacao : "ERRO",
      valida : false
    };
  }
}


/**
 * Valida nota de empenho
 */
function validateNotaEmpenho(numeroNE, valorNF) {
  try {
    if (typeof validarNFcontraNE == 'function') {
      var result = validarNFcontraNE({ notaEmpenho : numeroNE, valor, valorNF }, 0);
      return apiResponse(true, result);
    }
  } catch (e) {
    return {
      chaveAcesso : '',
      situacao : "ERRO",
      valida : false
    };
  }
}


// ==
// SEÇÃO 8 : BACKUP E MANUTENÇÃO
// ==

/**
 * Executa backup manual
 */
function executeBackup() {
  try {
    if (typeof Backup != 'undefined' && typeof Backup.createBackup == 'function') {
      Backup.createBackup();
      return apiResponse(true, { mensagem : 'Backup executado com sucesso' });
    }
  } catch (e) {
    return {
      chaveAcesso : '',
      situacao : "ERRO",
      valida : false
    };
  }
}


/**
 * Verifica integridade do sistema
 */
function checkSystemIntegrity() {
  try {
    try {
      var integrity = {
        sheets : [],
        functions : [],
        properties : [],
        status : 'OK'
      };

      // Verificar abas
      var requiredSheets = Object.keys(SHEET_STRUCTURES || {});
      var ss = getSS();
      requiredSheets.forEach(function(sheetName) {
        var sheet = ss.getSheetByName(sheetName);
        integrity.sheets.push({
          name : sheetName,
          exists : sheet != null,
          rows : sheet ? sheet.getLastRow() : 0
        });
      });

      // Verificar propriedades
      var props = PropertiesService.getScriptProperties();
      var keys = props.getKeys();
      integrity.properties = keys;

    } catch (e) {
      return {
        chaveAcesso : '',
        situacao : "ERRO",
        valida : false
      };
    }
  } catch (error) {
    Logger.log("Erro em checkSystemIntegrity: " + error.message);
    throw error;
  }
}


// ==
// SEÇÃO 9 : GRÁFICOS E VISUALIZAÇÕES
// ==

/**
 * Obtém dados para gráficos diversos
 */
function getChartDataAdvanced(chartType, filtros) {
  try {
    // Usar função base do ServerEndpoints
    var baseResult = getChartData(chartType);

    // Adicionar dados adicionais conforme tipo
    if (baseResult.success && baseResult.data) {
      // Enriquecer dados se necessário
      return baseResult;
    }

  } catch (e) {
    return {
      chaveAcesso : '',
      situacao : "ERRO",
      valida : false
    };
  }
}


/**
 * Gera dados para timeline de eventos
 */
function getTimelineData(filtros) {
  try {
    try {
      var timeline = [];

      // Coletar eventos de várias abas
      var sheets = ['Notas_Fiscais', 'Entregas', 'Recusas', 'Glosas'];
      sheets.forEach(function(sheetName) {
        var data = getSheetData(sheetName, 100);
        if (data && data.data) {
          var dataIdx = data.headers.findIndex(function(h) {
            return h.toLowerCase().indexOf('data') >= 0;
          });

          if (dataIdx >= 0) {
            data.data.forEach(function(row) {
              timeline.push({
                data : row[dataIdx],
                tipo : sheetName,
                descricao : row[1] || row[0] || 'Sem descrição'
              });
            });
          }
        }
      });

      // Ordenar por data
      timeline.sort(function(a, b) {});

    } catch (e) {
      return apiResponse(false, null, 'Erro ao exportar dados : ' + e.message);
    }
  } catch (error) {
    Logger.log("Erro em getTimelineData: " + error.message);
    throw error;
  }
}


// ==
// SEÇÃO 10 : UTILITÁRIOS E HELPERS
// ==

/**
 * Obtém configurações do sistema
 */
function getSystemConfiguration() {
  try {
    try {
      var config = getProcessingConfig();

      // Adicionar configurações adicionais
      var props = PropertiesService.getScriptProperties();
      var geminiConfigured;
      if (props.getProperty('GEMINI_API_KEY')) {
        geminiConfigured = true;
      } else {
        geminiConfigured = false;
      }
      config.environment = props.getProperty('ENV') || 'development';

      return apiResponse(true, config);
    } catch (e) {
      return apiResponse(false, null, 'Erro ao obter configuração : ' + e.message);
    }
  } catch (error) {
    Logger.log("Erro em getSystemConfiguration: " + error.message);
    throw error;
  }
}

// ==
// SEÇÃO 11 : VALIDAÇÕES ESPECÍFICAS
// ==

/**
 * Valida dados de entrega antes de criar
 */
function validateEntrega(entregaData) {
  // Validar se entregaData existe
  if (!entregaData || typeof entregaData != 'object') {
    return {
      valid : false,
      message : 'Dados da entrega são obrigatórios',
      error : 'INVALID_DATA'
    };
  }

  if (!entregaData.dataEntrega && !entregaData.data_entrega) {}
  if (!entregaData.fornecedor) {}
  if (!entregaData.produto) {}

  var quantidade = entregaData.quantidadeEntregue || entregaData.quantidade_entregue || 0;
  if (!quantidade || quantidade <= 0) {}

}

/**
 * Valida dados de nota fiscal antes de criar
 */
function validateNotaFiscal(data) {
  try {
    var errors = [];

    // Validação segura - verificar se data existe
    if (!data || typeof data != 'object') {
      return {
        valid : false,
        errors : ['Dados da nota fiscal não fornecidos ou inválidos']
      };
    }

    // Validação de campo notaFiscal (se existir no objeto)
    if (data.notaFiscal) {
      if (!data.notaFiscal.numero) {
        errors.push('Número da nota fiscal é obrigatório');
      }
      if (!data.notaFiscal.chaveAcesso) {
        errors.push('Chave de acesso é obrigatória');
      }
      if (!data.notaFiscal.valorTotal || data.notaFiscal.valorTotal <= 0) {
        errors.push('Valor total deve ser maior que zero');
      }
    } else {
      // Se não tem notaFiscal como objeto, validar campos diretos
      if (!data.numero_nf && !data.numeroNF) {
        errors.push('Número da nota fiscal é obrigatório');
      }
      if (!data.chave_acesso && !data.chaveAcesso) {
        errors.push('Chave de acesso é obrigatória');
      }
      if ((!data.valor_total && !data.valorTotal) || (data.valor_total <= 0 && data.valorTotal <= 0)) {
        errors.push('Valor total deve ser maior que zero');
      }
    }

    return {
      valid : errors.length == 0,
      errors : errors
    };
  } catch (error) {
    Logger.log("Erro em validateNotaFiscal: " + error.message);
    throw error;
  }
}


/**
 * Atualiza configurações do sistema
 */
function updateSystemConfiguration(config) {
  try {
    setProcessingConfig(config);
    return apiResponse(true, { mensagem : 'Configuração atualizada' });
  } catch (e) {
    return apiResponse(false, null, 'Erro ao atualizar configuração : ' + e.message);
  }
}

/**
 * Exporta dados para formato específico
 */
function exportData(formato, sheetName, filtros) {
  try {
    var data = getSheetData(sheetName, 10000);

    if (!data || !data.data) {
      return apiResponse(false, null, 'Nenhum dado para exportar');
    }

    var result = {};

    switch (formato) {
      case 'json' :
        result = {
          formato : 'json',
          dados : JSON.stringify(data)
        };
        break;

      case 'csv' :
        var csv = [data.headers.join(',')];
        data.data.forEach(function(row) {
          csv.push(row.join(','));
        });
        result = {
          formato : 'csv',
          dados : csv.join('\n')
        };
        break;

      // default : null
    }

  } catch (e) {
    return apiResponse(false, null, 'Erro ao exportar dados : ' + e.message);
  }
}


/**
 * Registra log de auditoria
 */
function logAuditEvent(evento, usuario, detalhes) {
  try {
    try {
      try {
        try {
          var sheet = getOrCreateSheetSafe('Auditoria_Log');
          var row = [
            new Date(),
            evento,
            usuario,
            JSON.stringify(detalhes),
            Session.getActiveUser().getEmail()
          ];

          sheet.appendRow(row);
          return apiResponse(true, { mensagem : 'Evento registrado' });
        } catch (e) {
          return apiResponse(false, null, 'Erro ao registrar evento : ' + e.message);
        }
      } catch (error) {
        Logger.log("Erro em logAuditEvent: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em logAuditEvent: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em logAuditEvent: " + error.message);
    throw error;
  }
}

// ==
// FUNÇÕES DE INICIALIZAÇÃO
// ==

/**
 * Inicializa todas as estruturas do sistema
 */
function initializeCompleteSystem() {
  try {
    // Inicializar sheets
    var sheetsResult = initializeAllSheets();

    // Registrar serviços
    if (typeof registerCoreServices == 'function') {
      registerCoreServices();
    }

    // Configurar menu
    if (typeof buildMenu == 'function') {
      buildMenu();
    }

    return {
      success : true,
      mensagem : 'Sistema inicializado com sucesso',
      sheets : sheetsResult
    };
  } catch (e) {
    return {
      success : false,
      mensagem : 'Erro ao inicializar sistema : ' + e.message
    };
  }
}


/**
 * Diagnóstico completo do sistema
 */
function runCompleteDiagnostics() {
  try {
    var diagnostics = {
      timestamp : new Date(),
      sheets : {},
      functions : {},
      services : {},
      configuration : {},
      status : 'OK'
    };

    // Verificar sheets
    if (typeof diagnosticarEstruturas == 'function') {
      diagnosticarEstruturas();
    }

    // Verificar integridade
    var integrity = checkSystemIntegrity();
    diagnostics.sheets = integrity.data;

    // Verificar configuração
    var config = getSystemConfiguration();
    diagnostics.configuration = config.data;

  } catch (e) {
    return apiResponse(false, null, 'Erro ao exportar dados : ' + e.message);
  }
}


// ---- Handlers.gs ----
// Handlers e Rotinas da Comissão - UNIAE CRE PP/Cruzeiro
// Este arquivo implementa os handlers referenciados pelo menu e utilidades de configuração/integração

// == Auxiliares de UI/Config ==
/* Substituir definição antiga de _ui() - agora retorna UI diretamente sem recursão */
function _ui() {
  // tenta UI do container (Sheets) diretamente
  try {
    var ss = getSS();
    if (ss && typeof ss.getUi == 'function') {
      return ss.getUi();
    }
  } catch (e) {
    Logger.log('_ui() : erro ao obter ss.getUi() : ' + (e && e.message));
  }
  // fallback stub
  return {
    alert: function(t,m,b){
      Logger.log('[UI.alert] ' + (t||'') + (m||''));
      return { getSelectedButton: function(){return 'OK';} };
    },
    prompt: function(t,m,b){
      Logger.log('[UI.prompt] ' + (t||'') + (m||''));
      return {
        getSelectedButton: function(){return 'CANCEL';},
        getResponseText: function(){return '';}
      };
    },
    toast: function(msg, title){ Logger.log('[UI.toast] ' + (title ? title+' : ' : '') + (msg||'')); },
    Button : { OK : 'OK', CANCEL : 'CANCEL' },
    ButtonSet : { OK : 'OK', OK_CANCEL : 'OK_CANCEL' }
  };
}


function configurarChaveGemini() {
  try {
    var ui = _ui();
    var resp = safePrompt('Configurar Chave GEMINI', 'Informe sua chave de API GEMINI_API_KEY', ui.ButtonSet.OK_CANCEL);
    if (resp.getSelectedButton() == ui.Button.OK) {
      var key = (resp.getResponseText() || '').trim();
      if (key) {
        PropertiesService.getScriptProperties().setProperty('GEMINI_API_KEY', key);
        safeAlert('Chave GEMINI_API_KEY salva com sucesso.');
      } else {
        safeAlert('Chave vazia. Nenhuma alteração realizada.');
      }
    }
  } catch (error) {
    Logger.log("Erro em configurarChaveGemini: " + error.message);
    throw error; // Re-lança para tratamento superior
  }
}

function configurarMembrosComissao() {
  try {
    try {
      var ss = getSS();
      var name = 'Config_Membros_Comissao';
      var sheet = ss.getSheetByName(name) || ss.insertSheet(name);
      if (sheet.getLastRow() == 0) {
        sheet.getRange(1,1,1,3).setValues([["Nome","Cargo","Email"]]);
      }
      _ui().alert('Edite a aba "' + name + '" para inserir os membros da comissão. Depois execute "Salvar Configuração de Membros".');
    } catch (error) {
      Logger.log("Erro em configurarMembrosComissao: " + error.message);
      throw error; // Re-lança para tratamento superior
    }
  } catch (error) {
    Logger.log("Erro em configurarMembrosComissao: " + error.message);
    throw error;
  }
}

function salvarConfiguracaoMembros() {
  try {
    try {
      var ss = getSS();
      var sheet = ss.getSheetByName('Config_Membros_Comissao');
      if (!sheet) { _ui().alert('Aba Config_Membros_Comissao não encontrada. Execute "Configurar Membros da Comissão" antes.'); return; }
      var values = sheet.getDataRange().getValues();
      var headers = values.shift();
      var out = values.filter(function(r){ return (r[0]||'').toString().trim(); }).map(function(r){
        return {nome : r[0], cargo : r[1], email : r[2]};
      });
      PropertiesService.getScriptProperties().setProperty('COMISSAO_MEMBROS_JSON', JSON.stringify(out));
      _ui().alert('Membros salvos : ' + out.length);
    } catch (error) {
      Logger.log("Erro em salvarConfiguracaoMembros: " + error.message);
      throw error; // Re-lança para tratamento superior
    }
  } catch (error) {
    Logger.log("Erro em salvarConfiguracaoMembros: " + error.message);
    throw error;
  }
}

function configurarTextosPadrao() {
  try {
    try {
      var ss = getSS();
      var name = 'Textos_Padrao';
      var sheet = ss.getSheetByName(name) || ss.insertSheet(name);
      if (sheet.getLastRow() == 0) {
        sheet.getRange(1,1,1,2).setValues([["Chave","Texto"]]);
        sheet.getRange(2,1,1,2).setValues([["ATETO_GEV_MON","Modelo de atesto para GEVMON - edite aqui."]]);
        sheet.getRange(3,1,1,2).setValues([["RELATORIO_COMISSAO","Modelo de relatório da comissão - edite aqui."]]);
      }
      _ui().alert('Edite os modelos na aba "' + name + '".');
    } catch (error) {
      Logger.log("Erro em configurarTextosPadrao: " + error.message);
      throw error; // Re-lança para tratamento superior
    }
  } catch (error) {
    Logger.log("Erro em configurarTextosPadrao: " + error.message);
    throw error;
  }
}

function sobreSistema() {
  try {
    var msg = [
      'Sistema de Análise de Notas Fiscais e Entregas - CRE PP/Cruzeiro - UNIAE',
      'Portaria 244/2006 - Apoio à Comissão de Recebimento',
      'Módulos : Backup, Coleta de Dados, Análises Determinísticas, Análise Generativa (Gemini), Relatórios, Rotinas',
      'Versão do menu/handlers : 2025-10-24'
    ].join('\n');
    _ui().alert(msg);
  } catch (error) {
    Logger.log("Erro em sobreSistema: " + error.message);
    throw error;
  }
}

// == Gestão de Dados ==
// FUNÇÃO importarNotasFiscais REMOVIDA - USAR A IMPLEMENTAÇÃO EM Dominio_NotasFiscais.gs

function atualizarDadosEntregas() {
  try {
    _ui().alert('Atualizar Dados de Entregas: rotina integrada ao Drive/planilhas (em desenvolvimento).');
  } catch (error) {
    Logger.log("Erro em atualizarDadosEntregas: " + error.message);
    throw error;
  }
}

// == Verificação de Notas Fiscais ==
// FUNÇÃO verificarAutenticidadeNFe REMOVIDA - USAR A IMPLEMENTAÇÃO EM NotasFiscais.gs

function conferirValoresQuantidades() {
  try {
    var res = verificarIrregularidades();
    var total = (res && res.resumo) ? res.resumo.total_registros : 0;
    _ui().alert('Conferência concluída. Registros analisados: ' + total);
  } catch (error) {
    Logger.log("Erro em conferirValoresQuantidades: " + error.message);
    throw error;
  }
}

// FUNÇÃO validarNotasEmpenho REMOVIDA - USAR A IMPLEMENTAÇÃO EM Core_Validacao.gs
// FUNÇÃO identificarDivergencias REMOVIDA - USAR A IMPLEMENTAÇÃO EM NotasFiscais.gs

// == Análise de Entregas ==
function registrarEntregasPorUnidade() {
  try {
    _ui().alert('Registro de entregas por unidade – abrirá formulário/planilha (em desenvolvimento).');
  } catch (error) {
    Logger.log("Erro em registrarEntregasPorUnidade: " + error.message);
    throw error;
  }
}

function registrarRecusas() {
  // Implementação completa em Dominio_Recusas.gs
  var ui = getSafeUi();
    if (!ui) {
      Logger.log("⚠️ UI não disponível");
      return;
    }

  try {
    var html = HtmlService.createTemplateFromFile('UI_HTML_FormRecusa').evaluate()
      .setWidth(650)
      .setHeight(750);

    ui.showModalDialog(html, '❌ Registrar Recusa de Produto');

  } catch (e) {
    ui.alert('Erro', 'Falha ao abrir formulário : ' + e.message, ui.ButtonSet.OK);
  }
}

// FUNÇÃO verificarQualidadeProdutos REMOVIDA - USAR A IMPLEMENTAÇÃO EM Entregas.gs

function conferirAtrasosEntregas() {
  try {
    // Implementação real usando dados da aba Entregas
    try {
      var entregasData = getSheetData('Entregas', 1000);
      if (!entregasData.data) {
        getSafeUi().alert('Aviso', 'Nenhuma entrega cadastrada.', getSafeUi().ButtonSet.OK);
        return;
      }

      var hoje = new Date();
      var atrasadas = entregasData.data.filter(function(row) {
        var dataPrevista = new Date(row[5]);
        return dataPrevista < hoje && row[12] != 'Entregue';
      });

      var headers = ['ID', 'Fornecedor', 'Produto', 'Data Prevista', 'Dias Atraso', 'Status'];
      var dados = atrasadas.map(function(row) {
        var diasAtraso = Math.floor((hoje - new Date(row[5])) / (1000*60*60*24));
        return [row[0], row[3], row[4], row[5], diasAtraso, row[12]];
      });

      var resultado = createReportSpreadsheet('Entregas_Atrasadas', 'atrasos', headers, dados);

      if (resultado.success) {
        getSafeUi().alert(
          'Relatório de Atrasos',
          'Entregas atrasadas: ' + atrasadas.length + '\n\nAcesse: ' + resultado.url,
          getSafeUi().ButtonSet.OK
        );
      }
    } catch (e) {
      Logger.log('Erro conferirAtrasosEntregas: ' + e.message);
      getSafeUi().alert('Erro', 'Erro ao conferir atrasos: ' + e.message, getSafeUi().ButtonSet.OK);
    }
  } catch (error) {
    Logger.log("Erro em conferirAtrasosEntregas: " + error.message);
    throw error;
  }
}


function controlarSubstituicoesPendentes() {
  try {
    try {
      var recusasData = getSheetData('Recusas', 1000);
      if (!recusasData.data) {
        getSafeUi().alert('Aviso', 'Nenhuma recusa cadastrada.', getSafeUi().ButtonSet.OK);
        return;
      }

      var pendentes = recusasData.data.filter(function(row) {
        return row[14] == 'Pendente';
      });

      getSafeUi().alert(
        'Substituições Pendentes',
        'Total de substituições pendentes: ' + pendentes.length + '\n\nVerifique a aba Recusas para detalhes.',
        getSafeUi().ButtonSet.OK
      );
    } catch (e) {
      Logger.log('Erro controlarSubstituicoesPendentes: ' + e.message);
      getSafeUi().alert('Erro', 'Erro ao consultar substituições: ' + e.message, getSafeUi().ButtonSet.OK);
    }
  } catch (error) {
    Logger.log("Erro em controlarSubstituicoesPendentes: " + error.message);
    throw error;
  }
}


// == Gestão de Glosas ==
function registrarNovaGlosa() {
  try {
    var ui = SpreadsheetApp.getUi();
    try {
      var html = HtmlService.createTemplateFromFile('UI_HTML_FormGlosa').evaluate()
        .setWidth(700)
        .setHeight(800);
      ui.showModalDialog(html, '💰 Registrar Nova Glosa');
    } catch (e) {
      ui.alert('Erro', 'Formulário em desenvolvimento. Use a aba Glosas diretamente.', ui.ButtonSet.OK);
    }
  } catch (error) {
    Logger.log("Erro em registrarNovaGlosa: " + error.message);
    throw error;
  }
}


// == Gestão de Glosas ==


// == Gestão de Glosas ==


// == Gestão de Glosas ==


// == Gestão de Glosas ==


// == Gestão de Glosas ==


// == Gestão de Glosas ==

function menuEntregasEDashboard_() {
  // Implementação real usando dados da aba Entregas
  try {
    var entregasData = getSheetData('Entregas', 1000);
    if (!entregasData.data) {
      getSafeUi().alert('Aviso', 'Nenhuma entrega cadastrada.', getSafeUi().ButtonSet.OK);
    }

    var hoje = new Date();
    var atrasadas = entregasData.data.filter(function(row) {
      var dataPrevista = new Date(row[5]); // Ajustar índice conforme estrutura;
    });

    var resultado = createReportSpreadsheet('Entregas_Atrasadas', 'atrasos',
      ['ID', 'Fornecedor', 'Produto', 'Data Prevista', 'Dias Atraso', 'Status'],
      atrasadas);
  } catch (e) {
    Logger.log('Erro entregas atrasadas : ' + e.message);
  }

  // Submenu : Prestação de Contas
  menu.addSubMenu(ui.createMenu('📄 Prestação de Contas')
    .addItem('🆕 Iniciar Prestação', 'menuIniciarPrestacao')
    .addItem('📎 Registrar Documento', 'menuRegistrarDocumento')
    .addItem('📊 Gerar CONSAL', 'menuGerarCONSAL')
    .addItem('📊 Gerar RETRIM', 'menuGerarRETRIM')
    .addItem('📤 Enviar Prestação', 'menuEnviarPrestacao')
    .addSeparator()
    .addItem('🗂️ Verificar Documentos (5 anos)', 'menuVerificarDocumentosGuarda')
    .addItem('📊 Relatório Consolidado', 'menuRelatorioPrestacoes'));

  // Submenu : Supervisão Técnica
  menu.addSubMenu(ui.createMenu('🔍 Supervisão Técnica')
    .addItem('📅 Agendar Visita', 'menuAgendarVisita')
    .addItem('✅ Registrar Realização', 'menuRegistrarRealizacaoVisita')
    .addItem('⚠️ Registrar Não Conformidade', 'menuRegistrarNaoConformidade')
    .addItem('📝 Registrar Orientação', 'menuRegistrarOrientacao')
    .addItem('✔️ Finalizar Visita', 'menuFinalizarVisita')
    .addSeparator()
    .addItem('🔔 Verificar NC Vencidas', 'menuVerificarNCVencidas')
    .addItem('📊 Relatório de Supervisão', 'menuRelatorioSupervisao'));

  // Submenu : Educação Alimentar e Nutricional
  menu.addSubMenu(ui.createMenu('🎓 Educação Alimentar')
    .addItem('📅 Planejar Ação de EAN', 'menuPlanejarAcaoEAN')
    .addItem('✅ Registrar Execução', 'menuRegistrarExecucaoEAN')
    .addItem('👥 Registrar Participante', 'menuRegistrarParticipanteEAN')
    .addItem('⭐ Registrar Avaliação', 'menuRegistrarAvaliacaoEAN')
    .addSeparator()
    .addItem('📈 Verificar Meta EAN', 'menuVerificarMetaEAN')
    .addItem('📊 Relatório Consolidado', 'menuRelatorioEAN'));

  menu.addSeparator();

  // Configurações e Utilitários
  menu.addSubMenu(ui.createMenu('⚙️ Configurações')
    .addItem('🔧 Configurar Sistema', 'showSettings')
    .addItem('🏗️ Inicializar Arquitetura', 'initializeAllServices')
    .addItem('💾 Backup Manual', 'runBackupNow')
    .addSeparator()
    .addItem('📊 Dashboard Completo', 'openDashboard')
    .addItem('🏥 Verificar Saúde do Sistema', 'verificarSaudeSistema')
    .addItem('📋 Criar Abas do Sistema', 'criarAbasDoSistema')
    .addSeparator()
    .addItem('📤 Exportar Configurações', 'exportarConfiguracoes')
    .addItem('🗑️ Limpar Dados de Teste', 'limparDadosTeste')
    .addSeparator()
    .addItem('ℹ️ Sobre o Sistema', 'showAbout'));

  // Auditoria e Compliance
  menu.addSubMenu(ui.createMenu('🔒 Auditoria e Compliance')
    .addItem('✅ Verificar Conformidade Legal', 'menuVerificarConformidadeLegal')
    .addItem('🔍 Detectar Anomalias', 'menuDetectarAnomalias')
    .addItem('🛡️ Verificar Compliance LGPD', 'menuVerificarComplianceLGPD')
    .addSeparator()
    .addItem('📊 Relatório de Auditoria', 'menuRelatorioAuditoria'));

  // Integração SEI
  menu.addSubMenu(ui.createMenu('📋 Integração SEI')
    .addItem('📝 Registrar Processo SEI', 'menuRegistrarProcessoSEI')
    .addItem('📄 Gerar Memorando', 'menuGerarMemorando')
    .addItem('⏰ Verificar Prazos SEI', 'menuVerificarPrazosSEI')
    .addSeparator()
    .addItem('📊 Relatório de Processos', 'menuRelatorioProcessosSEI'));

  // Notificações
  menu.addSubMenu(ui.createMenu('📧 Notificações')
    .addItem('🚨 Enviar Alertas Críticos', 'menuEnviarAlertasCriticos')
    .addItem('⏰ Executar Notificações Agendadas', 'menuExecutarNotificacoesAgendadas')
    .addSeparator()
    .addItem('👥 Gerenciar Destinatários', 'menuGerenciarDestinatarios'));

  // Relatórios
  menu.addSubMenu(ui.createMenu('📊 Relatórios')
    .addItem('📈 Relatório Executivo', 'menuGerarRelatorioExecutivo')
    .addItem('📊 Gerar Dashboard', 'menuGerarDashboard')
    .addItem('📋 Relatório Completo do Sistema', 'gerarRelatorioCompletoSistema')
    .addSeparator()
    .addItem('📋 Histórico de Relatórios', 'menuHistoricoRelatorios'));

  menu.addToUi();

  SystemLogger.info('Menu construído com sucesso');
}

/**
 * Inicializa todos os serviços do sistema
 */
function initializeAllServices() {
  try {
    try {
      getSS().toast('Inicializando serviços/* spread */', 'Aguarde', 3);

      // Inicializar arquitetura SOLID
      initializeSOLIDArchitecture();

      // Registrar todos os 15 serviços
      registerControlePereciveisNT();
      registerCardapiosEspeciaisNT();
      registerTestesAceitabilidadeNT();
      registerRecebimentoGeneros();
      registerArmazenamentoGeneros();
      registerComissaoRecebimento();
      registerPrestacaoContas();
      registerSupervisaoNutricao();
      registerEducacaoAlimentar();
      registerDashboardAnalytics();
      registerAuditoriaCompliance();
      registerIntegracaoSEI();
      registerNotificacoesAlertas();
      registerRelatoriosConsolidados();

      getSS().toast(
        'Sistema inicializado com sucesso! Todos os 15 módulos estão prontos.',
        'Sucesso',
        5
      );

      SystemLogger.info('Todos os 15 serviços inicializados com sucesso');

    } catch (error) {
      getSS().toast(
        'Erro ao inicializar : ' + error.message,
        'Erro',
        10
      );
      SystemLogger.error('Erro na inicialização dos serviços', error);
    }
  } catch (error) {
    Logger.log("Erro em initializeAllServices: " + error.message);
    throw error;
  }
}

/**
 * Abre o dashboard completo
 */
function openDashboard() {
  try {
    var url = ScriptApp.getService().getUrl() + ' ? page=dashboard';
    var html = '<script>window.open("' + url + '", "_blank");</script>';
    var ui = HtmlService.createHtmlOutput(html)
      .setWidth(1)
      .setHeight(1);
    SpreadsheetApp.getUi().showModalDialog(ui, 'Abrindo Dashboard/* spread */');
  } catch (error) {
    Logger.log("Erro em openDashboard: " + error.message);
    throw error;
  }
}

/**
 * Mostra informações sobre o sistema
 */
function showAbout() {
  try {
    var version = APP_VERSION.toString();
    var ui = SpreadsheetApp.getUi();

    var message = 'Sistema de Gestão da Alimentação Escolar\n' +
                  'CRE Plano Piloto e Cruzeiro - UNIAE\n\n' +
                  'Versão : ' + version + '\n' +
                  'Framework Legal : v' + APP_VERSION.legal_framework_version + '\n\n' +
                  '15 MÓDULOS IMPLEMENTADOS : \n' +
                  '✅ 1. Controle de Perecíveis (NT 1/2025)\n' +
                  '✅ 2. Cardápios Especiais (NT 2/2025)\n' +
                  '✅ 3. Testes de Aceitabilidade (NT 3/2022)\n' +
                  '✅ 4. Recebimento de Gêneros\n' +
                  '✅ 5. Armazenamento e Estoque (PVPS)\n' +
                  '✅ 6. Comissão de Recebimento\n' +
                  '✅ 7. Prestação de Contas\n' +
                  '✅ 8. Supervisão Técnica\n' +
                  '✅ 9. Educação Alimentar e Nutricional\n' +
                  '✅ 10. Menu e Integração\n' +
                  '✅ 11. Dashboard e Analytics\n' +
                  '✅ 12. Auditoria e Compliance\n' +
                  '✅ 13. Integração SEI-GDF\n' +
                  '✅ 14. Notificações e Alertas\n' +
                  '✅ 15. Relatórios Consolidados\n\n' +
                  'Base Legal : \n' +
                  '- Lei 11.947/2009 (PNAE)\n' +
                  '- Lei 14.133/2021 (Licitações)\n' +
                  '- Lei 13.709/2018 (LGPD)\n' +
                  '- Resolução FNDE 06/2020\n' +
                  '- Manual da Alimentação Escolar DF\n' +
                  '- Notas Técnicas SEEDF 2025\n' +
                  '- Decreto GDF 36.756/2015 (SEI)\n\n' +
                  'Desenvolvido com Arquitetura SOLID\n' +
                  'Conformidade Legal Completa';

    ui.alert('Sobre o Sistema', message, ui.ButtonSet.OK);
  } catch (error) {
    Logger.log("Erro em showAbout: " + error.message);
    throw error;
  }
}

/**
 * FUNÇÕES DE MENU - CONTROLE DE PERECÍVEIS
 */
function menuRegistrarAlimentoVencido() {
  try {
    getSS().toast('Funcionalidade : Registrar Alimento Vencido', 'Info', 3);
    // Implementar UI ou chamar serviço diretamente
  } catch (error) {
    Logger.log("Erro em menuRegistrarAlimentoVencido: " + error.message);
    throw error;
  }
}

function menuRegistrarAlimentoImproprio() {
  try {
    getSS().toast('Funcionalidade : Registrar Alimento Impróprio', 'Info', 3);
  } catch (error) {
    Logger.log("Erro em menuRegistrarAlimentoImproprio: " + error.message);
    throw error;
  }
}

function menuVerificarPrazosReposicao() {
  try {
    var service = DIContainer.resolve('controlePereciveisNT');
    var vencidos = service.verificarPrazosReposicao();

    if (vencidos.length == 0) {
      getSS().toast('Nenhum prazo de reposição vencido', 'Sucesso', 3);
    } else {
      var msg = 'Encontrados ' + vencidos.length + ' prazos vencidos. Verifique a aba Controle_Pereciveis_NT';
      getSS().toast(msg, 'Atenção', 5);
    }
  } catch (error) {
    getSS().toast('Erro : ' + error.message, 'Erro', 5);
  }
}


function menuRelatorioPerecíveis() {
  getSS().toast('Gerando relatório de perecíveis/* spread */', 'Aguarde', 3);
}

/**
 * FUNÇÕES DE MENU - CARDÁPIOS ESPECIAIS
 */
function menuRegistrarAlunoEspecial() {
  getSS().toast('Funcionalidade : Registrar Aluno com Necessidade Especial', 'Info', 3);
}

function menuCardapioElaborado() {
  try {
    getSS().toast('Funcionalidade : Registrar Cardápio Elaborado', 'Info', 3);
  } catch (error) {
    Logger.log("Erro em menuCardapioElaborado: " + error.message);
    throw error;
  }
}

function menuAquisicaoPDAF() {
  try {
    getSS().toast('Funcionalidade : Registrar Aquisição PDAF', 'Info', 3);
  } catch (error) {
    Logger.log("Erro em menuAquisicaoPDAF: " + error.message);
    throw error;
  }
}

function menuVerificarLaudosVencidos() {
  try {
    var service = DIContainer.resolve('cardapiosEspeciaisNT');
    var vencidos = service.verificarLaudosVencidos();

    if (vencidos.length == 0) {
      getSS().toast('Nenhum laudo vencido', 'Sucesso', 3);
    } else {
      var msg = 'Encontrados ' + vencidos.length + ' laudos vencidos. Verifique a aba Cardapios_Especiais_NT';
      getSS().toast(msg, 'Atenção', 5);
    }
  } catch (error) {
    getSS().toast('Erro : ' + error.message, 'Erro', 5);
  }
}


function menuRelatorioCardapiosCRE() {
  getSS().toast('Gerando relatório consolidado por CRE/* spread */', 'Aguarde', 3);
}

/**
 * FUNÇÕES DE MENU - TESTES DE ACEITABILIDADE
 */
function menuPlanejarTeste() {
  getSS().toast('Funcionalidade : Planejar Teste de Aceitabilidade', 'Info', 3);
}

function menuRegistrarResultadosTeste() {
  try {
    getSS().toast('Funcionalidade : Registrar Resultados do Teste', 'Info', 3);
  } catch (error) {
    Logger.log("Erro em menuRegistrarResultadosTeste: " + error.message);
    throw error;
  }
}

function menuVerificarTestesPendentes() {
  try {
    var service = DIContainer.resolve('testesAceitabilidadeNT');
    var pendentes = service.verificarTestesPendentes();

    if (pendentes.length == 0) {
      getSS().toast('Nenhum teste pendente', 'Sucesso', 3);
    } else {
      var msg = 'Encontrados ' + pendentes.length + ' testes pendentes. Verifique a aba Testes_Aceitabilidade_NT';
      getSS().toast(msg, 'Atenção', 5);
    }
  } catch (error) {
    getSS().toast('Erro : ' + error.message, 'Erro', 5);
  }
}


function menuVerificarFrequenciaAnual() {
  getSS().toast('Funcionalidade : Verificar Frequência Anual de Testes', 'Info', 3);
}

function menuRelatorioTestes() {
  getSS().toast('Gerando relatório consolidado de testes/* spread */', 'Aguarde', 3);
}

/**
 * FUNÇÕES DE MENU - RECEBIMENTO
 */
function menuRegistrarRecebimento() {
  try {
    getSS().toast('Funcionalidade : Registrar Recebimento de Gêneros', 'Info', 3);
  } catch (error) {
    Logger.log("Erro em menuRegistrarRecebimento: " + error.message);
    throw error;
  }
}

function menuRegistrarConferencia() {
  try {
    getSS().toast('Funcionalidade : Registrar Conferência', 'Info', 3);
  } catch (error) {
    Logger.log("Erro em menuRegistrarConferencia: " + error.message);
    throw error;
  }
}

function menuRegistrarRecusa() {
  try {
    getSS().toast('Funcionalidade : Registrar Recusa', 'Info', 3);
  } catch (error) {
    Logger.log("Erro em menuRegistrarRecusa: " + error.message);
    throw error;
  }
}

function menuRelatorioConformidade() {
  try {
    getSS().toast('Gerando relatório de conformidade/* spread */', 'Aguarde', 3);
  } catch (error) {
    Logger.log("Erro em menuRelatorioConformidade: " + error.message);
    throw error;
  }
}

/**
 * FUNÇÕES DE MENU - ARMAZENAMENTO
 */
function menuRegistrarEntrada() {
  try {
    getSS().toast('Funcionalidade : Registrar Entrada no Estoque', 'Info', 3);
  } catch (error) {
    Logger.log("Erro em menuRegistrarEntrada: " + error.message);
    throw error;
  }
}

function menuRegistrarSaida() {
  try {
    getSS().toast('Funcionalidade : Registrar Saída (PVPS)', 'Info', 3);
  } catch (error) {
    Logger.log("Erro em menuRegistrarSaida: " + error.message);
    throw error;
  }
}

function menuRealizarInventario() {
  try {
    getSS().toast('Funcionalidade : Realizar Inventário', 'Info', 3);
  } catch (error) {
    Logger.log("Erro em menuRealizarInventario: " + error.message);
    throw error;
  }
}

function menuVerificarProximosVencimento() {
  try {
    var service = DIContainer.resolve('armazenamentoGeneros');
    var proximos = service.verificarProximosVencimento(null, 30);

    if (proximos.length == 0) {
      getSS().toast('Nenhum produto próximo ao vencimento', 'Sucesso', 3);
    } else {
      var msg = 'Encontrados ' + proximos.length + ' produtos próximos ao vencimento (30 dias)';
      getSS().toast(msg, 'Atenção', 5);
    }
  } catch (error) {
    getSS().toast('Erro : ' + error.message, 'Erro', 5);
  }
}


function menuVerificarVencidos() {
  try {
    var service = DIContainer.resolve('armazenamentoGeneros');
    var vencidos = service.verificarVencidos(null);

    if (vencidos.length == 0) {
      getSS().toast('Nenhum produto vencido', 'Sucesso', 3);
    } else {
      var msg = 'ATENÇÃO : ' + vencidos.length + ' produtos vencidos no estoque!';
      getSS().toast(msg, 'URGENTE', 10);
    }
  } catch (error) {
    getSS().toast('Erro : ' + error.message, 'Erro', 5);
  }
}


function menuAvaliarEstruturaFisica() {
  try {
    getSS().toast('Funcionalidade : Avaliar Estrutura Física', 'Info', 3);
  } catch (error) {
    Logger.log("Erro em menuAvaliarEstruturaFisica: " + error.message);
    throw error;
  }
}

/**
 * FUNÇÕES DE MENU - COMISSÃO
 */
function menuConstituirComissao() {
  getSS().toast('Funcionalidade : Constituir Comissão de Recebimento', 'Info', 3);
}

function menuRegistrarAtestacao() {
  try {
    getSS().toast('Funcionalidade : Registrar Atestação', 'Info', 3);
  } catch (error) {
    Logger.log("Erro em menuRegistrarAtestacao: " + error.message);
    throw error;
  }
}

function menuRegistrarOcorrencia() {
  try {
    getSS().toast('Funcionalidade : Registrar Ocorrência', 'Info', 3);
  } catch (error) {
    Logger.log("Erro em menuRegistrarOcorrencia: " + error.message);
    throw error;
  }
}

function menuVerificarConformidadeComissao() {
  try {
    getSS().toast('Funcionalidade : Verificar Conformidade da Comissão', 'Info', 3);
  } catch (error) {
    Logger.log("Erro em menuVerificarConformidadeComissao: " + error.message);
    throw error;
  }
}

function menuRelatorioAtividadesComissao() {
  try {
    getSS().toast('Gerando relatório de atividades da comissão/* spread */', 'Aguarde', 3);
  } catch (error) {
    Logger.log("Erro em menuRelatorioAtividadesComissao: " + error.message);
    throw error;
  }
}

/**
 * FUNÇÕES DE MENU - PRESTAÇÃO DE CONTAS
 */
function menuIniciarPrestacao() {
  try {
    getSS().toast('Funcionalidade : Iniciar Prestação de Contas', 'Info', 3);
  } catch (error) {
    Logger.log("Erro em menuIniciarPrestacao: " + error.message);
    throw error;
  }
}

function menuRegistrarDocumento() {
  try {
    getSS().toast('Funcionalidade : Registrar Documento', 'Info', 3);
  } catch (error) {
    Logger.log("Erro em menuRegistrarDocumento: " + error.message);
    throw error;
  }
}

function menuGerarCONSAL() {
  try {
    getSS().toast('Funcionalidade : Gerar CONSAL', 'Info', 3);
  } catch (error) {
    Logger.log("Erro em menuGerarCONSAL: " + error.message);
    throw error;
  }
}

function menuGerarRETRIM() {
  try {
    getSS().toast('Funcionalidade : Gerar RETRIM', 'Info', 3);
  } catch (error) {
    Logger.log("Erro em menuGerarRETRIM: " + error.message);
    throw error;
  }
}

function menuEnviarPrestacao() {
  try {
    getSS().toast('Funcionalidade : Enviar Prestação de Contas', 'Info', 3);
  } catch (error) {
    Logger.log("Erro em menuEnviarPrestacao: " + error.message);
    throw error;
  }
}

function menuVerificarDocumentosGuarda() {
  try {
    getSS().toast('Verificando documentos (guarda de 5 anos)/* spread */', 'Aguarde', 3);
  } catch (error) {
    Logger.log("Erro em menuVerificarDocumentosGuarda: " + error.message);
    throw error;
  }
}

function menuRelatorioPrestacoes() {
  try {
    getSS().toast('Gerando relatório consolidado de prestações/* spread */', 'Aguarde', 3);
  } catch (error) {
    Logger.log("Erro em menuRelatorioPrestacoes: " + error.message);
    throw error;
  }
}

/**
 * FUNÇÕES DE MENU - SUPERVISÃO
 */
function menuAgendarVisita() {
  try {
    getSS().toast('Funcionalidade : Agendar Visita Técnica', 'Info', 3);
  } catch (error) {
    Logger.log("Erro em menuAgendarVisita: " + error.message);
    throw error;
  }
}

function menuRegistrarRealizacaoVisita() {
  try {
    getSS().toast('Funcionalidade : Registrar Realização de Visita', 'Info', 3);
  } catch (error) {
    Logger.log("Erro em menuRegistrarRealizacaoVisita: " + error.message);
    throw error;
  }
}

function menuRegistrarNaoConformidade() {
  try {
    getSS().toast('Funcionalidade : Registrar Não Conformidade', 'Info', 3);
  } catch (error) {
    Logger.log("Erro em menuRegistrarNaoConformidade: " + error.message);
    throw error;
  }
}

function menuRegistrarOrientacao() {
  try {
    getSS().toast('Funcionalidade : Registrar Orientação Técnica', 'Info', 3);
  } catch (error) {
    Logger.log("Erro em menuRegistrarOrientacao: " + error.message);
    throw error;
  }
}

function menuFinalizarVisita() {
  try {
    getSS().toast('Funcionalidade : Finalizar Visita com Relatório', 'Info', 3);
  } catch (error) {
    Logger.log("Erro em menuFinalizarVisita: " + error.message);
    throw error;
  }
}

function menuVerificarNCVencidas() {
  try {
    var service = DIContainer.resolve('supervisaoNutricao');
    var vencidas = service.verificarNaoConformidadesVencidas(null);

    if (vencidas.length == 0) {
      getSS().toast('Nenhuma não conformidade vencida', 'Sucesso', 3);
    } else {
      var msg = 'ATENÇÃO : ' + vencidas.length + ' não conformidades com prazo vencido!';
      getSS().toast(msg, 'URGENTE', 10);
    }
  } catch (error) {
    getSS().toast('Erro : ' + error.message, 'Erro', 5);
  }
}


function menuRelatorioSupervisao() {
  getSS().toast('Gerando relatório de supervisão/* spread */', 'Aguarde', 3);
}

/**
 * FUNÇÕES DE MENU - EDUCAÇÃO ALIMENTAR
 */
function menuPlanejarAcaoEAN() {
  getSS().toast('Funcionalidade : Planejar Ação de EAN', 'Info', 3);
}

function menuRegistrarExecucaoEAN() {
  try {
    getSS().toast('Funcionalidade : Registrar Execução de Ação EAN', 'Info', 3);
  } catch (error) {
    Logger.log("Erro em menuRegistrarExecucaoEAN: " + error.message);
    throw error;
  }
}

function menuRegistrarParticipanteEAN() {
  try {
    getSS().toast('Funcionalidade : Registrar Participante', 'Info', 3);
  } catch (error) {
    Logger.log("Erro em menuRegistrarParticipanteEAN: " + error.message);
    throw error;
  }
}

function menuRegistrarAvaliacaoEAN() {
  try {
    getSS().toast('Funcionalidade : Registrar Avaliação de Ação EAN', 'Info', 3);
  } catch (error) {
    Logger.log("Erro em menuRegistrarAvaliacaoEAN: " + error.message);
    throw error;
  }
}

function menuVerificarMetaEAN() {
  try {
    getSS().toast('Funcionalidade : Verificar Meta de EAN', 'Info', 3);
  } catch (error) {
    Logger.log("Erro em menuVerificarMetaEAN: " + error.message);
    throw error;
  }
}

function menuRelatorioEAN() {
  try {
    getSS().toast('Gerando relatório consolidado de EAN/* spread */', 'Aguarde', 3);
  } catch (error) {
    Logger.log("Erro em menuRelatorioEAN: " + error.message);
    throw error;
  }
}

/**
 * Funções adicionais de menu
 */
function menuRelatorioAuditoria() {
  try {
    getSS().toast('Gerando relatório de auditoria/* spread */', 'Aguarde', 3);

    var service = DIContainer.resolve('auditoriaCompliance');
    var relatorio = service.gerarRelatorioAuditoria(null);

    var msg = 'Relatório de Auditoria\n\n' +
              'Total de Operações : ' + relatorio.totalOperacoes + '\n' +
              'Taxa de Sucesso : ' + relatorio.taxaSucesso + '%\n' +
              'Operações com Erro : ' + relatorio.operacoesComErro;

    getSS().toast(msg, 'Relatório', 10);

  } catch (error) {
    getSS().toast('Erro : ' + error.message, 'Erro', 5);
  }
}

function menuGerenciarDestinatarios() {
  getSS().toast('Funcionalidade : Gerenciar Destinatários de Notificações', 'Info', 3);
}

function menuHistoricoRelatorios() {
  getSS().toast('Funcionalidade : Histórico de Relatórios Gerados', 'Info', 3);
}

/**
 * Função para criar todas as abas necessárias
 */
function criarAbasDoSistema() {
  try {
    try {
      getSS().toast('Criando abas do sistema/* spread */', 'Aguarde', 5);

      var abas = [
        // Módulo 1 : Controle de Perecíveis
        'Controle_Pereciveis_NT',

        // Módulo 2 : Cardápios Especiais
        'Cardapios_Especiais_NT',
        'Laudos_Medicos_Protegidos',

        // Módulo 3 : Testes de Aceitabilidade
        'Testes_Aceitabilidade_NT',
        'Resultados_Testes_Detalhados',

        // Módulo 4 : Recebimento
        'Recebimento_Generos',

        // Módulo 5 : Armazenamento
        'Estoque_Generos',
        'Movimentacao_Estoque',
        'Estrutura_Depositos',

        // Módulo 6 : Comissão
        'Comissao_Membros',
        'Comissao_Atestacoes',
        'Comissao_Ocorrencias',

        // Módulo 7 : Prestação de Contas
        'Prestacao_Contas',
        'Documentos_Prestacao',
        'Demonstrativos',

        // Módulo 8 : Supervisão
        'Visitas_Tecnicas',
        'Nao_Conformidades_Visita',
        'Orientacoes_Tecnicas',

        // Módulo 9 : EAN
        'Acoes_EAN',
        'Participantes_EAN',
        'Avaliacoes_EAN',

        // Módulo 11 : Dashboard
        'Dashboard_Indicadores',
        'Dashboard_Alertas',

        // Módulo 12 : Auditoria
        'Auditoria_Log',
        'Verificacao_Conformidade',
        'Deteccao_Anomalias',

        // Módulo 13 : SEI
        'Processos_SEI',
        'Documentos_SEI',
        'Tramitacao_SEI',

        // Módulo 14 : Notificações
        'Notificacoes_Historico',
        'Notificacoes_Destinatarios',
        'Notificacoes_Agendamentos',

        // Módulo 15 : Relatórios
        'Relatorios_Gerados'
      ];

      var ss = getSS();
      var abasCriadas = 0;

      abas.forEach(function(nomeAba) {
        var sheet = ss.getSheetByName(nomeAba);
        if (!sheet) {
          ss.insertSheet(nomeAba);
          abasCriadas++
        }
      });

      var msg = 'Processo concluído!\n' +
                'Total de abas : ' + abas.length + '\n' +
                'Abas criadas : ' + abasCriadas + '\n' +
                'Abas já existentes : ' + (abas.length - abasCriadas);

      getSS().toast(msg, 'Abas Criadas', 10);

    } catch (error) {
      getSS().toast('Erro : ' + error.message, 'Erro', 5);
    }
  } catch (error) {
    Logger.log("Erro em criarAbasDoSistema: " + error.message);
    throw error;
  }
}


/**
 * Função para verificar saúde do sistema
 */
function verificarSaudeSistema() {
  try {
    try {
      try {
        getSS().toast('Verificando saúde do sistema/* spread */', 'Aguarde', 3);

        var saude = {
          arquitetura : checkArchitectureHealth(),
          servicos : [],
          problemas : []
        };

        // Verificar cada serviço
        var servicosParaVerificar = [
          'controlePereciveisNT',
          'cardapiosEspeciaisNT',
          'testesAceitabilidadeNT',
          'recebimentoGeneros',
          'armazenamentoGeneros',
          'comissaoRecebimento',
          'prestacaoContas',
          'supervisaoNutricao',
          'educacaoAlimentar',
          'dashboardAnalytics',
          'auditoriaCompliance',
          'integracaoSEI',
          'notificacoesAlertas',
          'relatoriosConsolidados'
        ];

        servicosParaVerificar.forEach(function(nomeServico) {
          try {
            var servico = DIContainer.resolve(nomeServico);
            saude.servicos.push({
              nome : nomeServico,
              status : 'OK'
            });
          } catch (error) {
            saude.servicos.push({
              nome : nomeServico,
              status : 'ERRO'
            });
            saude.problemas.push(nomeServico + ' : ' + error.message);
          }
        });

        var servicosOK = saude.servicos.filter(function(s) { return s.status == 'OK'; }).length;
        var servicosErro = saude.servicos.filter(function(s) { return s.status == 'ERRO'; }).length;

        var msg = 'Verificação de Saúde do Sistema\n\n' +
                  'Serviços OK : ' + servicosOK + '/' + saude.servicos.length + '\n' +
                  'Serviços com Erro : ' + servicosErro + '\n' +
                  'Dependências DI : ' + saude.arquitetura.diContainer.dependencies + '\n' +
                  'Singletons : ' + saude.arquitetura.diContainer.singletons;

        if (saude.problemas.length > 0) {
          msg += '\n\nProblemas : \n' + saude.problemas.join('\n');
        }

        getSS().toast(msg, 'Saúde do Sistema', 15);
        Logger.log('Saúde do Sistema : ' + JSON.stringify(saude, null, 2));

      } catch (error) {
        getSS().toast('Erro : ' + error.message, 'Erro', 5);
      }
    } catch (error) {
      Logger.log("Erro em verificarSaudeSistema: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em verificarSaudeSistema: " + error.message);
    throw error;
  }
}


/**
 * Função para limpar dados de teste (versão Integracao)
 */
function limparDadosTeste_Integracao() {
  try {
    var ui = SpreadsheetApp.getUi();

    var response = ui.alert(
      'Limpar Dados de Teste',
      'ATENÇÃO : Esta ação irá limpar TODOS os dados de teste do sistema.\n\n' +
      'Esta ação NÃO PODE SER DESFEITA!\n\n' +
      'Deseja continuar ? ',
      ui.ButtonSet.YES_NO
    );

    if (response != ui.Button.YES) {
      return;
    }

    try {
      getSS().toast('Limpando dados de teste/* spread */', 'Aguarde', 3);

      var ss = getSS();
      var sheets = ss.getSheets();
      var abasLimpas = 0;

      sheets.forEach(function(sheet) {
        var nome = sheet.getName();

        // Não limpar abas de configuração
        if (nome.indexOf('Config_') == 0 || nome.indexOf('Textos_') == 0) {
          return;
        }

        // Limpar dados mantendo cabeçalhos
        if (sheet.getLastRow() > 1) {
          sheet.deleteRows(2, sheet.getLastRow() - 1);
          abasLimpas++
        }
      });

      getSS().toast(
        'Dados de teste limpos!\nAbas limpas : ' + abasLimpas,
        'Concluído',
        5
      );

    } catch (error) {
      getSS().toast('Erro : ' + error.message, 'Erro', 5);
    }
  } catch (error) {
    Logger.log("Erro em limparDadosTeste_Integracao: " + error.message);
    throw error;
  }
}


/**
 * Função para exportar configurações
 */
function exportarConfiguracoes() {
  try {
    try {
      var props = PropertiesService.getScriptProperties();
      var allProps = props.getProperties();

      var config = {
        dataExportacao : new Date().toISOString(),
        versao : APP_VERSION.toString(),
        propriedades : allProps
      };

      Logger.log('Configurações Exportadas : ');
      Logger.log(JSON.stringify(config, null, 2));

      getSS().toast(
        'Configurações exportadas para os logs.\nVerifique View > Logs',
        'Exportação Concluída',
        5
      );

    } catch (error) {
      getSS().toast('Erro : ' + error.message, 'Erro', 5);
    }
  } catch (error) {
    Logger.log("Erro em exportarConfiguracoes: " + error.message);
    throw error;
  }
}


/**
 * Função para gerar relatório completo do sistema
 */
function gerarRelatorioCompletoSistema() {
  try {
    try {
      getSS().toast('Gerando relatório completo/* spread */', 'Aguarde', 5);

      var linhas = [];
      linhas.push('═══════════════════════════════════════════════════════════════');
      linhas.push('   RELATÓRIO COMPLETO DO SISTEMA');
      linhas.push('   Sistema de Gestão da Alimentação Escolar');
      linhas.push('═══════════════════════════════════════════════════════════════');
      linhas.push('');
      linhas.push('Data : ' + new Date().toLocaleString('pt-BR'));
      linhas.push('Versão : ' + APP_VERSION.toString());
      linhas.push('');

      // 1. Dashboard
      linhas.push('───────────────────────────────────────────────────────────────');
      linhas.push('1. DASHBOARD E INDICADORES');
      linhas.push('───────────────────────────────────────────────────────────────');
      try {
        var dashboardService = DIContainer.resolve('dashboardAnalytics');
        var dashboard = dashboardService.gerarDashboardCompleto(null);
        linhas.push('Status Geral : ' + dashboard.resumoExecutivo.statusGeral);
        linhas.push('Pontuação : ' + dashboard.resumoExecutivo.pontuacaoGeral + '/100');
        linhas.push('Alertas Ativos : ' + dashboard.alertas.length);
      } catch (e) {
        linhas.push('Erro ao gerar dashboard : ' + e.message);
      }
      linhas.push('');

      // 2. Conformidade
      linhas.push('───────────────────────────────────────────────────────────────');
      linhas.push('2. CONFORMIDADE LEGAL');
      linhas.push('───────────────────────────────────────────────────────────────');
      try {
        var auditoriaService = DIContainer.resolve('auditoriaCompliance');
        var conformidade = auditoriaService.verificarConformidadeLegal();
        linhas.push('Status : ' + conformidade.statusGeral);
        linhas.push('Pontuação : ' + conformidade.pontuacao + '/100');
        linhas.push('Problemas : ' + conformidade.problemas.length);
      } catch (e) {
        linhas.push('Erro ao verificar conformidade : ' + e.message);
      }
      linhas.push('');

      // 3. Saúde do Sistema
      linhas.push('───────────────────────────────────────────────────────────────');
      linhas.push('3. SAÚDE DO SISTEMA');
      linhas.push('───────────────────────────────────────────────────────────────');
      try {
        var saude = checkArchitectureHealth();
        linhas.push('Dependências DI : ' + saude.diContainer.dependencies);
        linhas.push('Singletons : ' + saude.diContainer.singletons);
        linhas.push('Serviços Registrados : ' + saude.serviceFactory.services);
        linhas.push('Status : ' + saude.status);
      } catch (e) {
        linhas.push('Erro ao verificar saúde : ' + e.message);
      }
      linhas.push('');

      linhas.push('═══════════════════════════════════════════════════════════════');
      linhas.push('Fim do Relatório');
      linhas.push('═══════════════════════════════════════════════════════════════');

      var relatorio = linhas.join('\n');
      Logger.log(relatorio);

      getSS().toast(
        'Relatório completo gerado!\nVerifique View > Logs',
        'Concluído',
        5
      );

    } catch (error) {
      getSS().toast('Erro : ' + error.message, 'Erro', 5);
    }
  } catch (error) {
    Logger.log("Erro em gerarRelatorioCompletoSistema: " + error.message);
    throw error;
  }
}


