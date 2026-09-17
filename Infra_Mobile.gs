'use strict';

/**
 * INFRA_MOBILE
 * Consolidado de : mobile-integration-examples.gs
 * @version 2.0.0
 * @created 2025-11-04
 */


// ---- mobile-integration-examples.gs ----
/**
 * mobile-integration-examples.gs
 * Exemplos de integração entre Mobile App e Google Apps Script
 */

/**
 * Serve a aplicação mobile
 * RENOMEADO para evitar conflito com UI_WebApp.gs::doGet()
 */
function serveMobileApp() {
  return HtmlService.createHtmlOutputFromFile('mobile-app')
    .setTitle('UNIAE Mobile - Sistema de Gestão')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover');
}

/**
 * ==
 * ENDPOINTS PARA MOBILE APP
 * ==
 */

/**
 * Retorna estatísticas do dashboard
 */
function getDashboardStats() {
  try {
    var stats = {
      notasFiscais : getNotasFiscaisCount(),
      entregas : getEntregasCount(),
      conformidade : getConformidadeScore(),
      pendencias : getPendenciasCount()
    };

    return {
      success : true,
      data : stats
    };

  } catch (error) {
    return {
      success : false,
      error : error.message
    };
  }
}


/**
 * Retorna lista de notas fiscais para mobile
 * @deprecated Use listNotasFiscaisUnificado() do Core_CRUD_Frontend_Bridge.gs
 * Esta função foi renomeada para evitar conflito de nomenclatura
 */
function getNotasFiscais_Mobile(filtro) {
  try {
    try {
      try {
        var ss = getSS();
        var sheet = ss.getSheetByName('Notas_Fiscais');

        if (!sheet) {
          return { success : false, error : 'Aba não encontrada' };
        }

        var data = sheet.getDataRange().getValues();
        var headers = data[0];
        var rows = data.slice(1);

        // Converter para objetos
        var notas = rows.map(function(row) {
          var nota = {};
          headers.forEach(function(header, index) {
            nota[header] = row[index];
          });
          return nota;
        });

        // Aplicar filtro se fornecido
        if (filtro && filtro != 'todas') {
          notas = notas.filter(function(nota) {
            return nota.Status && nota.Status.toLowerCase() == filtro.toLowerCase();
          });
        }

        return {
          success : true,
          data : notas,
          count : notas.length
        };

      } catch (error) {
        return {
          success : false,
          error : error.message
        };
      }
    } catch (error) {
      Logger.log("Erro em getNotasFiscais_Mobile: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em getNotasFiscais_Mobile: " + error.message);
    throw error;
  }
}


/**
 * Retorna detalhes de uma nota fiscal
 */
function getNotaFiscalById(id) {
  try {
    try {
      var ss = getSS();
      var sheet = ss.getSheetByName('Notas_Fiscais');

      if (!sheet) {
        return { success : false, error : 'Aba não encontrada' };
      }

      var data = sheet.getDataRange().getValues();
      var headers = data[0];

      // Encontrar índice da coluna ID
      var idIndex;
      if (headers.indexOf('ID') >= 0) {
        idIndex = headers.indexOf('ID');
      } else {
        idIndex = 0;
      }

      // Buscar nota
      for (var i = 1; i < data.length; i++) {
        if (data[i][idIndex] == id) {
          var nota = {};
          headers.forEach(function(header, index) {
            nota[header] = data[i][index];
          });

          return {
            success : true,
            data : nota
          };
        }
      }

      return {
        success : false,
        error : 'Nota fiscal não encontrada'
      };

    } catch (error) {
      return {
        success : false,
        error : error.message
      };
    }
  } catch (error) {
    Logger.log("Erro em getNotaFiscalById: " + error.message);
    throw error;
  }
}


/**
 * Cria nova nota fiscal
 */
function createNotaFiscal(dados) {
  try {
    try {
      try {
        try {
          var ss = getSS();
          var sheet = ss.getSheetByName('Notas_Fiscais');

          if (!sheet) {
            return { success : false, error : 'Aba não encontrada' };
          }

          // Validar dados obrigatórios
          if (!dados.numero || !dados.fornecedor || !dados.valor) {
            return {
              success : false,
              error : 'Dados obrigatórios faltando'
            };
          }

          // Preparar linha
          var novaLinha = [
            new Date(),                         // Data
            dados.numero,                       // Número
            dados.fornecedor,                   // Fornecedor
            dados.valor,                        // Valor
            dados.produto || '',                // Produto
            dados.quantidade || 0,              // Quantidade
            'Pendente',                         // Status
            Session.getActiveUser().getEmail()  // Usuário
          ];

          // Adicionar linha
          sheet.appendRow(novaLinha);

          return {
            success : true,
            message : 'Nota fiscal criada com sucesso',
            id : sheet.getLastRow()
          };

        } catch (error) {
          return {
            success : false,
            error : error.message
          };
        }
      } catch (error) {
        Logger.log("Erro em createNotaFiscal: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em createNotaFiscal: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em createNotaFiscal: " + error.message);
    throw error;
  }
}


/**
 * Atualiza nota fiscal
 * @deprecated MOVIDO para Core_Sync_Backend_Frontend.gs
 */
function updateNotaFiscal_Mobile(id, dados) {
  try {
    // Redireciona para a função centralizada se existir
    if (typeof updateNotaFiscal === 'function') {
      // A função centralizada usa rowIndex, não id
      // Precisamos encontrar o rowIndex pelo id
      return updateNotaFiscal(id, dados);
    }

    try {
      var ss = getSS();
      var sheet = ss.getSheetByName('Notas_Fiscais');

      if (!sheet) {
        return { success: false, error: 'Aba não encontrada' };
      }

      var data = sheet.getDataRange().getValues();
      var headers = data[0];
      var idIndex = headers.indexOf('ID') >= 0 ? headers.indexOf('ID') : 0;

      // Encontrar linha
      for (var i = 1; i < data.length; i++) {
        if (data[i][idIndex] == id) {
          // Atualizar campos
          Object.keys(dados).forEach(function(key) {
            var colIndex = headers.indexOf(key);
            if (colIndex >= 0) {
              sheet.getRange(i + 1, colIndex + 1).setValue(dados[key]);
            }
          });
          return { success: true, message: 'Nota fiscal atualizada' };
        }
      }

      return { success: false, error: 'Nota fiscal não encontrada' };

    } catch (error) {
      return { success: false, error: error.message };
    }
  } catch (error) {
    Logger.log("Erro em updateNotaFiscal_Mobile: " + error.message);
    throw error;
  }
}


/**
 * Busca global no sistema
 */
function searchGlobal(query) {
  try {
    if (!query || query.length < 2) {
      return {
        success : false,
        error : 'Query muito curta'
      };
    }

    var results = [];
    query = query.toLowerCase();

    // Buscar em Notas Fiscais
    var nfResults = searchInSheet('Notas_Fiscais', query, 'nf');
    results = results.concat(nfResults);

    // Buscar em Entregas
    var entregaResults = searchInSheet('Entregas', query, 'entrega');
    results = results.concat(entregaResults);

    // Buscar em Fornecedores
    var fornecedorResults = searchInSheet('Fornecedores', query, 'fornecedor');
    results = results.concat(fornecedorResults);

    return {
      success : true,
      data : results,
      count : results.length
    };

  } catch (error) {
    return {
      success : false,
      error : error.message
    };
  }
}


/**
 * Busca em uma aba específica
 */
function searchInSheet(sheetName, query, type) {
  try {
    try {
      try {
        var ss = getSS();
        var sheet = ss.getSheetByName(sheetName);

        if (!sheet) return [];

        var data = sheet.getDataRange().getValues();
        var headers = data[0];
        var results = [];

        for (var i = 1; i < data.length && results.length < 10; i++) {
          var row = data[i];
          var match = false;

          // Verificar se alguma célula contém a query
          for (var j = 0; j < row.length; j++) {
            var cellValue = String(row[j]).toLowerCase();
            if (cellValue.indexOf(query) >= 0) {
              match = true;
              break;
            }
          }

          if (match) {
            results.push({
              type : type,
              title : row[1] || row[0],   // Segunda ou primeira coluna
              subtitle : row[2] || '',    // Terceira coluna
              id : row[0]                 // Primeira coluna como ID
            });
          }
        }

        return results;

      } catch (error) {
        Logger.log('Erro em searchInSheet : ' + error.message);
        return [];
      }
    } catch (error) {
      Logger.log("Erro em searchInSheet: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em searchInSheet: " + error.message);
    throw error;
  }
}


/**
 * Gera relatório mobile
 */
function generateMobileReport(tipo) {
  try {
    var resultado;

    switch(tipo) {
      case 'conformidade' :
        resultado = gerarRelatorioConformidade();
        break;
      case 'comissao' :
        resultado = gerarRelatorioComissao();
        break;
      case 'fornecedores' :
        resultado = gerarRelatorioFornecedores();
        break;
      default :
        return {
          success : false,
          error : 'Tipo de relatório inválido'
        };
    }

    return {
      success : true,
      data : resultado
    };

  } catch (error) {
    return {
      success : false,
      error : error.message
    };
  }
}


/**
 * Sincroniza dados mobile
 */
function syncMobileData() {
  try {
    var timestamp = new Date();

    var data = {
      stats : getDashboardStats().data,
      notas : getNotasFiscais('todas').data,
      timestamp : timestamp.toISOString()
    };

    return {
      success : true,
      data : data,
      message : 'Dados sincronizados com sucesso'
    };

  } catch (error) {
    return {
      success : false,
      error : error.message
    };
  }
}


/**
 * ==
 * FUNÇÕES AUXILIARES
 * ==
 */

function getNotasFiscaisCount() {
  try {
    try {
      var sheet = getSS().getSheetByName('Notas_Fiscais');
      return sheet ? sheet.getLastRow() - 1 : 0;
    } catch (e) {
      return 0;
    }
  } catch (error) {
    Logger.log("Erro em getNotasFiscaisCount: " + error.message);
    throw error;
  }
}

function getEntregasCount() {
  try {
    var sheet = getSS().getSheetByName('Entregas');
    return sheet ? sheet.getLastRow() - 1 : 0;
  } catch (e) {
    return 0;
  }
}

function getConformidadeScore() {
  try {
    // Calcular score de conformidade
    // Implementar lógica real
    return 95;
  } catch (e) {
    return 0;
  }
}

function getPendenciasCount() {
  try {
    try {
      var sheet = getSS().getSheetByName('Notas_Fiscais');
      if (!sheet) return 0;

      var data = sheet.getDataRange().getValues();
      var count = 0;

      for (var i = 1; i < data.length; i++) {
        if (data[i][6] == 'Pendente') { // Coluna Status
          count++;
        }
      }

      return count;

    } catch (e) {
      return 0;
    }
  } catch (error) {
    Logger.log("Erro em getPendenciasCount: " + error.message);
    throw error;
  }
}


/**
 * ==
 * TESTES
 * ==
 */

function testMobileEndpoints() {
  try {
    try {
      Logger.log('== Testando Endpoints Mobile ==');

      // Teste 1 : Dashboard Stats
      Logger.log('\n1. Dashboard Stats : ');
      var stats = getDashboardStats();
      Logger.log(JSON.stringify(stats, null, 2));

      // Teste 2 : Notas Fiscais
      Logger.log('\n2. Notas Fiscais : ');
      var notas = getNotasFiscais('todas');
      Logger.log('Total : ' + notas.count);

      // Teste 3 : Busca Global
      Logger.log('\n3. Busca Global : ');
      var search = searchGlobal('fornecedor');
      Logger.log('Resultados : ' + search.count);

      Logger.log('\n== Testes Concluídos ==');
    } catch (error) {
      Logger.log("Erro em testMobileEndpoints: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em testMobileEndpoints: " + error.message);
    throw error;
  }
}
