'use strict';

/**
 * DOMINIO_PESQUISA
 * Consolidado de : PesquisaAvancada.gs, BuscaGmail.gs
 * @version 2.0.0
 * @created 2025-11-04
 */


// ---- PesquisaAvancada.gs ----
/**
 * PesquisaAvancada.gs
 * Sistema de pesquisa básica e avançada com dados cascateados
 * Sistema UNIAE CRE PP/Cruzeiro
 */

/**
 * PESQUISA BÁSICA - Interface simples
 */
function pesquisaBasica() {
  try {
    var ui = getSafeUi();

    var opcoes = [
      'Notas Fiscais por Fornecedor',
      'Entregas por Período',
      'Recusas por Motivo',
      'Glosas por Status',
      'Fornecedores por Avaliação'
    ];

    var escolha = safePrompt(
      'Pesquisa Básica - UNIAE',
      'Escolha o tipo de pesquisa : \n\n' +
      '1 - ' + opcoes[0] + '\n' +
      '2 - ' + opcoes[1] + '\n' +
      '3 - ' + opcoes[2] + '\n' +
      '4 - ' + opcoes[3] + '\n' +
      '5 - ' + opcoes[4] + '\n\n' +
      'Digite o número da opção : ',
      ui.ButtonSet.OK_CANCEL
    );

    if (escolha.getSelectedButton() == ui.Button.CANCEL) return;

    var opcaoEscolhida = parseInt(escolha.getResponseText());

    switch (opcaoEscolhida) {
      case 1 :
        pesquisarNotasFiscaisPorFornecedor();
        break;
      case 2 :
        pesquisarEntregasPorPeriodo();
        break;
      case 3 :
        pesquisarRecusasPorMotivo();
        break;
      case 4 :
        pesquisarGlosasPorStatus();
        break;
      case 5 :
        pesquisarFornecedoresPorAvaliacao();
        break;
      default :
        safeAlert('Opção inválida', 'Por favor, escolha uma opção de 1 a 5.', ui.ButtonSet.OK);
    }
  } catch (error) {
    Logger.log("Erro em pesquisaBasica: " + error.message);
    throw error;
  }
}

/**
 * PESQUISA AVANÇADA - Interface com filtros cascateados
 */
function pesquisaAvancada() {
  try {
    var ui = getSafeUi();

    ui.alert('Pesquisa Avançada - UNIAE',
      'A pesquisa avançada permite combinar múltiplos filtros : \n\n' +
      '• Filtros por período (data início/fim)\n' +
      '• Filtros por fornecedor\n' +
      '• Filtros por produto/categoria\n' +
      '• Filtros por status\n' +
      '• Filtros por valor (faixa)\n\n' +
      'Os filtros são aplicados em cascata para refinar os resultados.',
      ui.ButtonSet.OK
    );

    // Passo 1 : Escolher tipo de dados
    var tipoEscolha = safePrompt(
      'Pesquisa Avançada - Tipo de Dados',
      'Escolha o tipo de dados para pesquisar : \n\n' +
      '1 - Notas Fiscais\n' +
      '2 - Entregas\n' +
      '3 - Recusas\n' +
      '4 - Glosas\n' +
      '5 - Análise Cruzada (múltiplas abas)\n\n' +
      'Digite o número : ',
      ui.ButtonSet.OK_CANCEL
    );

    if (tipoEscolha.getSelectedButton() == ui.Button.CANCEL) return;

    var tipo = parseInt(tipoEscolha.getResponseText());

    switch (tipo) {
      case 1 :
        pesquisaAvancadaNotasFiscais();
        break;
      case 2 :
        pesquisaAvancadaEntregas();
        break;
      case 3 :
        pesquisaAvancadaRecusas();
        break;
      case 4 :
        pesquisaAvancadaGlosas();
        break;
      case 5 :
        pesquisaAvancadaCruzada();
        break;
      default :
        safeAlert('Opção inválida', 'Por favor, escolha uma opção de 1 a 5.', ui.ButtonSet.OK);
    }
  } catch (error) {
    Logger.log("Erro em pesquisaAvancada: " + error.message);
    throw error;
  }
}

/**
 * PESQUISAS BÁSICAS ESPECÍFICAS
 */

function pesquisarNotasFiscaisPorFornecedor() {
  try {
    var ui = getSafeUi();

    // Obter lista de fornecedores
    var fornecedores = obterListaFornecedores();

    if (fornecedores.length == 0) {
      ui.alert('Sem Dados', 'Nenhum fornecedor encontrado na base de dados.', ui.ButtonSet.OK);
      return;
    }

    var fornecedorEscolha = safePrompt(
      'Pesquisa por Fornecedor',
      'Fornecedores disponíveis : \n\n' +
      fornecedores.slice(0, 10).map(function(f, i) { return (i+1) + ' - ' + f; }).join('\n') +
      (fornecedores.length > 10 ? '\n/* spread */ e mais ' + (fornecedores.length - 10) + ' fornecedores' : '') +
      '\n\nDigite o nome do fornecedor (ou parte dele) : ',
      ui.ButtonSet.OK_CANCEL
    );

    if (fornecedorEscolha.getSelectedButton() == ui.Button.CANCEL) return;

    var termoBusca = fornecedorEscolha.getResponseText().toLowerCase();
    var resultados = pesquisarDados('Notas_Fiscais', 'Fornecedor_Nome', termoBusca);

    exibirResultadosPesquisa('Notas Fiscais por Fornecedor', resultados, termoBusca);
  } catch (error) {
    Logger.log("Erro em pesquisarNotasFiscaisPorFornecedor: " + error.message);
    throw error;
  }
}

function pesquisarEntregasPorPeriodo() {
  try {
    var ui = getSafeUi();

    var periodoEscolha = ui.prompt(
      'Pesquisa por Período',
      'Escolha o período : \n\n' +
      '1 - Última semana\n' +
      '2 - Último mês\n' +
      '3 - Último trimestre\n' +
      '4 - Período personalizado\n\n' +
      'Digite o número : ',
      ui.ButtonSet.OK_CANCEL
    );

    if (periodoEscolha.getSelectedButton() == ui.Button.CANCEL) return;

    var opcao = parseInt(periodoEscolha.getResponseText());
    var dataInicio, dataFim;
    var hoje = new Date();

    switch (opcao) {
      case 1 :
        dataInicio = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);
        dataFim = hoje;
        break;
      case 2 :
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, hoje.getDate());
        dataFim = hoje;
        break;
      case 3 :
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 3, hoje.getDate());
        dataFim = hoje;
        break;
      case 4 :
        var dataInicioStr = safePrompt('Data Início', 'Digite a data de início (dd/mm/aaaa) : ', ui.ButtonSet.OK_CANCEL);
        if (dataInicioStr.getSelectedButton() == ui.Button.CANCEL) return;
        var dataFimStr = safePrompt('Data Fim', 'Digite a data de fim (dd/mm/aaaa) : ', ui.ButtonSet.OK_CANCEL);
        if (dataFimStr.getSelectedButton() == ui.Button.CANCEL) return;

        try {
          dataInicio = parseDataBrasileira(dataInicioStr.getResponseText());
          dataFim = parseDataBrasileira(dataFimStr.getResponseText());
        } catch (e) {
          ui.alert('Erro', 'Formato de data inválido. Use dd/mm/aaaa', ui.ButtonSet.OK);
          return null;
        }
        break;
      default :
        ui.alert('Opção inválida', 'Por favor, escolha uma opção de 1 a 4.', ui.ButtonSet.OK);
    }

    var resultados = pesquisarPorPeriodo('Entregas', 'Data_Entrega', dataInicio, dataFim);
    exibirResultadosPesquisa('Entregas por Período', resultados,
      formatDate(dataInicio) + ' a ' + formatDate(dataFim));
  } catch (error) {
    Logger.log("Erro em pesquisarEntregasPorPeriodo: " + error.message);
    throw error;
  }
}

/**
 * PESQUISAS AVANÇADAS ESPECÍFICAS
 */

function pesquisaAvancadaNotasFiscais() {
  try {
    var ui = getSafeUi();
    var filtros = {};

    // Filtro 1 : Período
    var usarPeriodo = ui.alert('Filtro por Período', 'Deseja filtrar por período ? ', ui.ButtonSet.YES_NO);
    if (usarPeriodo == ui.Button.YES) {
      filtros.periodo = obterFiltroPeriodo();
    }

    // Filtro 2 : Fornecedor
    var usarFornecedor = safeAlert('Filtro por Fornecedor', 'Deseja filtrar por fornecedor ? ', ui.ButtonSet.YES_NO);
    if (usarFornecedor == ui.Button.YES) {
      filtros.fornecedor = obterFiltroFornecedor();
    }

    // Filtro 3 : Status
    var usarStatus = safeAlert('Filtro por Status', 'Deseja filtrar por status ? ', ui.ButtonSet.YES_NO);
    if (usarStatus == ui.Button.YES) {
      filtros.status = obterFiltroStatus(['Recebida', 'Conferida', 'Atestada', 'Paga', 'Glosada']);
    }

    // Filtro 4 : Valor
    var usarValor = safeAlert('Filtro por Valor', 'Deseja filtrar por faixa de valor ? ', ui.ButtonSet.YES_NO);
    if (usarValor == ui.Button.YES) {
      filtros.valor = obterFiltroValor();
    }

    // Aplicar filtros
    var resultados = aplicarFiltrosAvancados('Notas_Fiscais', filtros);
    exibirResultadosAvancados('Notas Fiscais', resultados, filtros);
  } catch (error) {
    Logger.log("Erro em pesquisaAvancadaNotasFiscais: " + error.message);
    throw error;
  }
}

function pesquisaAvancadaCruzada() {
  try {
    var ui = getSafeUi();

    ui.alert('Análise Cruzada',
      'A análise cruzada permite combinar dados de múltiplas abas : \n\n' +
      '• Notas Fiscais + Entregas\n' +
      '• Entregas + Recusas\n' +
      '• Fornecedores + Glosas\n' +
      '• Análise completa (todas as abas)',
      ui.ButtonSet.OK
    );

    var tipoAnalise = safePrompt(
      'Tipo de Análise Cruzada',
      'Escolha o tipo de análise : \n\n' +
      '1 - NFs vs Entregas (verificar entregas por NF)\n' +
      '2 - Entregas vs Recusas (análise de qualidade)\n' +
      '3 - Fornecedores vs Performance (entregas + recusas + glosas)\n' +
      '4 - Análise Completa (dashboard executivo)\n\n' +
      'Digite o número : ',
      ui.ButtonSet.OK_CANCEL
    );

    if (tipoAnalise.getSelectedButton() == ui.Button.CANCEL) return;

    var tipo = parseInt(tipoAnalise.getResponseText());

    switch (tipo) {
      case 1 :
        analiseCruzadaNFsEntregas();
        break;
      case 2 :
        analiseCruzadaEntregasRecusas();
        break;
      case 3 :
        analiseCruzadaFornecedoresPerformance();
        break;
      case 4 :
        analiseCompletaDashboard();
        break;
      default :
        safeAlert('Opção inválida', 'Por favor, escolha uma opção de 1 a 4.', ui.ButtonSet.OK);
    }
  } catch (error) {
    Logger.log("Erro em pesquisaAvancadaCruzada: " + error.message);
    throw error;
  }
}

/**
 * FUNÇÕES AUXILIARES DE PESQUISA
 */

function obterListaFornecedores() {
  var fornecedores = [];

  try {
    var nfData = getSheetData('Notas_Fiscais', 1000);
    if (nfData.data) {
      var fornecedorIndex = nfData.headers.indexOf('Fornecedor_Nome');
      if (fornecedorIndex >= 0) {
        nfData.data.forEach(function(row) {
          var fornecedor = row[fornecedorIndex];
          if (fornecedor && fornecedores.indexOf(fornecedor) == -1) {
            fornecedores.push(fornecedor);
          }
        });
      }
    }
  } catch (e) {
    Logger.log('Erro obterListaFornecedores : ' + e.message);
  }
}


function pesquisarDados(sheetName, campo, termo) {
  try {
    var data = getSheetData(sheetName, 1000);
    if (!data.data) return [];

    var campoIndex = data.headers.indexOf(campo);
    if (campoIndex == -1) return [];

    return data.data.filter(function(row) {
      var valor = String(row[campoIndex] || '').toLowerCase();
      return valor.indexOf(termo) >= 0;
    });
  } catch (e) {
    Logger.log('Erro pesquisarDados : ' + e.message);
    return [];
  }
}


function pesquisarPorPeriodo(sheetName, campoData, dataInicio, dataFim) {
  try {
    try {
      var data = getSheetData(sheetName, 1000);
      if (!data.data) return [];

      var dataIndex = data.headers.indexOf(campoData);
      if (dataIndex == -1) return [];

      return data.data.filter(function(row) {
        var dataRow = new Date(row[dataIndex]);
        return dataRow >= dataInicio && dataRow <= dataFim;
      });
    } catch (e) {
      Logger.log('Erro pesquisarPorPeriodo : ' + e.message);
    }
  } catch (error) {
    Logger.log("Erro em pesquisarPorPeriodo: " + error.message);
    throw error;
  }
  }


function aplicarFiltrosAvancados(sheetName, filtros) {
  try {
    try {
      var data = getSheetData(sheetName, 1000);
      if (!data.data) return [];

      var resultados = data.data;

      // Aplicar cada filtro
      if (filtros.periodo) {
        var dataIndex = data.headers.indexOf('Data_Emissao') || data.headers.indexOf('Data_Entrega');
        if (dataIndex >= 0) {
          resultados = resultados.filter(function(row) {
            var dataRow = new Date(row[dataIndex]);
            return dataRow >= filtros.periodo.inicio && dataRow <= filtros.periodo.fim;
          });
        }
      }

      if (filtros.fornecedor) {
        var fornecedorIndex = data.headers.indexOf('Fornecedor_Nome');
        if (fornecedorIndex >= 0) {
          resultados = resultados.filter(function(row) {
            var fornecedor = String(row[fornecedorIndex] || '').toLowerCase();
            return fornecedor.indexOf(filtros.fornecedor.toLowerCase()) >= 0;
          });
        }
      }

      if (filtros.status) {
        var statusIndex = data.headers.indexOf('Status_NF') || data.headers.indexOf('Status_Entrega');
        if (statusIndex >= 0) {
          resultados = resultados.filter(function(row) {
            return row[statusIndex] == filtros.status;
          });
        }
      }

      if (filtros.valor) {
        var valorIndex = data.headers.indexOf('Valor_Total');
        if (valorIndex >= 0) {
          resultados = resultados.filter(function(row) {
            var valor = Number(row[valorIndex]) || 0;
            return valor >= filtros.valor.min && valor <= filtros.valor.max;
          });
        }
      }

    } catch (e) {
      Logger.log('Erro aplicarFiltrosAvancados : ' + e.message);
    }
  } catch (error) {
    Logger.log("Erro em aplicarFiltrosAvancados: " + error.message);
    throw error;
  }
  }


function exibirResultadosPesquisa(titulo, resultados, criterio) {
  try {
    var headers = ['Resultado', 'Detalhes', 'Observacoes'];
    var data = [];

    if (resultados.length == 0) {
      data.push(['Nenhum resultado encontrado', criterio, 'Tente ajustar os critérios de pesquisa']);
    } else {
      resultados.slice(0, 50).forEach(function(row, index) {
        data.push([
          'Resultado ' + (index + 1),
          row.slice(0, 3).join(' | '), // Primeiros 3 campos
          'Total de ' + resultados.length + ' resultados encontrados'
        ]);
      });
    }

    var resultado = createReportSpreadsheet('Pesquisa_' + titulo.replace(/\s+/g, '_'), 'pesquisa', headers, data);

    if (resultado.success) {
      getSafeUi().alert('Pesquisa Concluída',
        titulo + '\n\n' +
        'Critério : ' + criterio + '\n' +
        'Resultados : ' + resultados.length + '\n\n' +
        'Relatório : ' + resultado.fileName + '\n' +
        'Acesse : ' + resultado.url,
        getSafeUi().ButtonSet.OK
      );
    }
  } catch (error) {
    Logger.log("Erro em exibirResultadosPesquisa: " + error.message);
    throw error;
  }
}

function parseDataBrasileira(dataStr) {
  try {
    var partes = dataStr.split('/');
    if (partes.length != 3) throw new Error('Formato inválido');
    return new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));
  } catch (error) {
    Logger.log("Erro em parseDataBrasileira: " + error.message);
    throw error;
  }
}

/**
 * FUNÇÕES DE PESQUISA BÁSICA FALTANTES
 */

function pesquisarRecusasPorMotivo() {
  try {
    var ui = getSafeUi();

    var motivoEscolha = ui.prompt(
      'Pesquisa de Recusas por Motivo',
      'Digite o motivo da recusa (ou parte dele) : \n\n' +
      'Exemplos : qualidade, prazo, quantidade, documentação',
      ui.ButtonSet.OK_CANCEL
    );

    if (motivoEscolha.getSelectedButton() == ui.Button.CANCEL) return;

    var termo = motivoEscolha.getResponseText().toLowerCase();
    var resultados = pesquisarDados('Recusas', 'Motivo_Recusa', termo);

    exibirResultadosPesquisa('Recusas por Motivo', resultados, termo);
  } catch (error) {
    Logger.log("Erro em pesquisarRecusasPorMotivo: " + error.message);
    throw error;
  }
}

function pesquisarGlosasPorStatus() {
  try {
    var ui = getSafeUi();

    var statusEscolha = ui.prompt(
      'Pesquisa de Glosas por Status',
      'Escolha o status : \n\n' +
      '1 - Aplicada\n' +
      '2 - Contestada\n' +
      '3 - Confirmada\n' +
      '4 - Estornada\n\n' +
      'Digite o número : ',
      ui.ButtonSet.OK_CANCEL
    );

    if (statusEscolha.getSelectedButton() == ui.Button.CANCEL) return;

    var opcao = parseInt(statusEscolha.getResponseText());
    var status = ['', 'Aplicada', 'Contestada', 'Confirmada', 'Estornada'][opcao];

    if (!status) {
      safeAlert('Opção inválida', 'Por favor, escolha uma opção de 1 a 4.', ui.ButtonSet.OK);
      return;
    }

    var resultados = pesquisarDados('Glosas', 'Status_Glosa', status.toLowerCase());
    exibirResultadosPesquisa('Glosas por Status', resultados, status);
  } catch (error) {
    Logger.log("Erro em pesquisarGlosasPorStatus: " + error.message);
    throw error;
  }
}

function pesquisarFornecedoresPorAvaliacao() {
  try {
    var ui = getSafeUi();

    var avaliacaoEscolha = ui.prompt(
      'Pesquisa de Fornecedores por Avaliação',
      'Escolha a faixa de avaliação : \n\n' +
      '1 - Excelente (4.5 - 5.0)\n' +
      '2 - Bom (3.5 - 4.4)\n' +
      '3 - Regular (2.5 - 3.4)\n' +
      '4 - Ruim (1.0 - 2.4)\n' +
      '5 - Todos os fornecedores\n\n' +
      'Digite o número : ',
      ui.ButtonSet.OK_CANCEL
    );

    if (avaliacaoEscolha.getSelectedButton() == ui.Button.CANCEL) return;

    var opcao = parseInt(avaliacaoEscolha.getResponseText());
    var faixas = [
      null,
      {min : 4.5, max : 5.0, nome : 'Excelente'},
      {min : 3.5, max : 4.4, nome : 'Bom'},
      {min : 2.5, max : 3.4, nome : 'Regular'},
      {min : 1.0, max : 2.4, nome : 'Ruim'},
      {min : 0, max : 5.0, nome : 'Todos'}
    ];

    var faixa = faixas[opcao];
    if (!faixa) {
      safeAlert('Opção inválida', 'Por favor, escolha uma opção de 1 a 5.', ui.ButtonSet.OK);
      return;
    }

    var resultados = pesquisarPorFaixaAvaliacao('Fornecedores', faixa.min, faixa.max);
    exibirResultadosPesquisa('Fornecedores por Avaliação', resultados, faixa.nome);
  } catch (error) {
    Logger.log("Erro em pesquisarFornecedoresPorAvaliacao: " + error.message);
    throw error;
  }
}

function pesquisarPorFaixaAvaliacao(sheetName, minAvaliacao, maxAvaliacao) {
  try {
    var data = getSheetData(sheetName, 1000);
    if (!data.data) return [];

    var avaliacaoIndex = data.headers.indexOf('Avaliacao_Geral');
    if (avaliacaoIndex == -1) return [];

    return data.data.filter(function(row) {
      var avaliacao = Number(row[avaliacaoIndex]) || 0;
      return avaliacao >= minAvaliacao && avaliacao <= maxAvaliacao;
    });
  } catch (e) {
    Logger.log('Erro pesquisarPorFaixaAvaliacao : ' + e.message);
  }
}


/**
 * FUNÇÕES AUXILIARES PARA FILTROS AVANÇADOS
 */

function obterFiltroPeriodo() {
  try {
    var ui = getSafeUi();

    var dataInicioStr = ui.prompt('Filtro de Período - Data Início', 'Digite a data de início (dd/mm/aaaa) : ', ui.ButtonSet.OK_CANCEL);
    if (dataInicioStr.getSelectedButton() == ui.Button.CANCEL) return null;

    var dataFimStr = ui.prompt('Filtro de Período - Data Fim', 'Digite a data de fim (dd/mm/aaaa) : ', ui.ButtonSet.OK_CANCEL);
    if (dataFimStr.getSelectedButton() == ui.Button.CANCEL) return null;

    try {
      return {
        inicio : parseDataBrasileira(dataInicioStr.getResponseText()),
        fim : parseDataBrasileira(dataFimStr.getResponseText())
      };
    } catch (e) {
      ui.alert('Erro', 'Formato de data inválido. Use dd/mm/aaaa', ui.ButtonSet.OK);
    }
  } catch (error) {
    Logger.log("Erro em obterFiltroPeriodo: " + error.message);
    throw error;
  }
  }


function obterFiltroFornecedor() {
  try {
    var ui = getSafeUi();
    var fornecedores = obterListaFornecedores();

    var fornecedorEscolha = ui.prompt(
      'Filtro por Fornecedor',
      'Fornecedores disponíveis : \n\n' +
      fornecedores.slice(0, 5).join('\n') +
      (fornecedores.length > 5 ? '\n/* spread */ e mais ' + (fornecedores.length - 5) + ' fornecedores' : '') +
      '\n\nDigite o nome do fornecedor (ou parte dele) : ',
      ui.ButtonSet.OK_CANCEL
    );

    if (fornecedorEscolha.getSelectedButton() == ui.Button.CANCEL) return null;

    return fornecedorEscolha.getResponseText();
  } catch (error) {
    Logger.log("Erro em obterFiltroFornecedor: " + error.message);
    throw error;
  }
}

function obterFiltroStatus(statusDisponiveis) {
  try {
    var ui = getSafeUi();

    var statusEscolha = ui.prompt(
      'Filtro por Status',
      'Status disponíveis : \n\n' +
      statusDisponiveis.map(function(s, i) { return (i+1) + ' - ' + s; }).join('\n') +
      '\n\nDigite o número do status : ',
      ui.ButtonSet.OK_CANCEL
    );

    if (statusEscolha.getSelectedButton() == ui.Button.CANCEL) return null;

    var opcao = parseInt(statusEscolha.getResponseText());
    return statusDisponiveis[opcao - 1] || null;
  } catch (error) {
    Logger.log("Erro em obterFiltroStatus: " + error.message);
    throw error;
  }
}

function obterFiltroValor() {
  try {
    var ui = getSafeUi();

    var valorMinStr = ui.prompt('Filtro de Valor - Mínimo', 'Digite o valor mínimo : ', ui.ButtonSet.OK_CANCEL);
    if (valorMinStr.getSelectedButton() == ui.Button.CANCEL) return null;

    var valorMaxStr = ui.prompt('Filtro de Valor - Máximo', 'Digite o valor máximo : ', ui.ButtonSet.OK_CANCEL);
    if (valorMaxStr.getSelectedButton() == ui.Button.CANCEL) return null;

    return {
      min : Number(valorMinStr.getResponseText()) || 0,
      max : Number(valorMaxStr.getResponseText()) || 999999999
    };
  } catch (error) {
    Logger.log("Erro em obterFiltroValor: " + error.message);
    throw error;
  }
}

function exibirResultadosAvancados(tipo, resultados, filtros) {
  try {
    var criterios = [];
    if (filtros.periodo) criterios.push('Período : ' + formatDate(filtros.periodo.inicio) + ' a ' + formatDate(filtros.periodo.fim));
    if (filtros.fornecedor) criterios.push('Fornecedor : ' + filtros.fornecedor);
    if (filtros.status) criterios.push('Status : ' + filtros.status);
    if (filtros.valor) criterios.push('Valor : R$ ' + filtros.valor.min + ' a R$ ' + filtros.valor.max);

    exibirResultadosPesquisa(tipo + ' (Pesquisa Avançada)', resultados, criterios.join(' | '));
  } catch (error) {
    Logger.log("Erro em exibirResultadosAvancados: " + error.message);
    throw error;
  }
}

/**
 * DASHBOARD EXECUTIVO
 */

function analiseCompletaDashboard() {
  try {
    var ui = getSafeUi();

    ui.alert('Dashboard Executivo',
      'Gerando dashboard executivo com : \n\n' +
      '📊 Resumo geral do sistema\n' +
      '📈 Indicadores de performance\n' +
      '⚠️ Alertas e problemas\n' +
      '🎯 Recomendações de ação\n\n' +
      'Isso pode levar alguns segundos/* spread */',
      ui.ButtonSet.OK
    );

    try {
      // Coletar dados de todas as abas
      var nfData = getSheetData('Notas_Fiscais', 1000);
      var entregasData = getSheetData('Entregas', 1000);
      var recusasData = getSheetData('Recusas', 1000);
      var glosasData = getSheetData('Glosas', 1000);

      // Calcular indicadores
      var indicadores = {
        totalNFs : nfData.data ? nfData.data.length : 0,
        totalEntregas : entregasData.data ? entregasData.data.length : 0,
        totalRecusas : recusasData.data ? recusasData.data.length : 0,
        totalGlosas : glosasData.data ? glosasData.data.length : 0,
        valorTotal : 0,
        taxaRecusa : 0,
        taxaGlosa : 0
      };

      // Calcular valor total
      if (nfData.data) {
        var valorIndex = nfData.headers.indexOf('Valor_Total');
        if (valorIndex >= 0) {
          indicadores.valorTotal = nfData.data.reduce(function(sum, row) {
            return sum + (Number(row[valorIndex]) || 0);
          }, 0);
        }
      }

      // Calcular taxas
      if (indicadores.totalEntregas > 0) {
        indicadores.taxaRecusa = (indicadores.totalRecusas / indicadores.totalEntregas * 100).toFixed(2);
      }
      if (indicadores.totalNFs > 0) {
        indicadores.taxaGlosa = (indicadores.totalGlosas / indicadores.totalNFs * 100).toFixed(2);
      }

      // Criar dashboard
      var headers = ['Indicador', 'Valor', 'Status', 'Observacoes'];
      var data = [
        ['Total de Notas Fiscais', indicadores.totalNFs, indicadores.totalNFs > 0 ? '✅ OK' : '⚠️ Baixo', 'Notas fiscais processadas'],
        ['Total de Entregas', indicadores.totalEntregas, indicadores.totalEntregas > 0 ? '✅ OK' : '⚠️ Baixo', 'Entregas realizadas'],
        ['Total de Recusas', indicadores.totalRecusas, indicadores.totalRecusas < 10 ? '✅ Baixo' : '⚠️ Alto', 'Produtos recusados'],
        ['Total de Glosas', indicadores.totalGlosas, indicadores.totalGlosas < 5 ? '✅ Baixo' : '⚠️ Alto', 'Glosas aplicadas'],
        ['Valor Total Processado', 'R$ ' + indicadores.valorTotal.toFixed(2), '📊 Info', 'Valor total das NFs'],
        ['Taxa de Recusa (%)', indicadores.taxaRecusa + '%', indicadores.taxaRecusa < 5 ? '✅ Boa' : '⚠️ Alta', 'Recusas / Entregas'],
        ['Taxa de Glosa (%)', indicadores.taxaGlosa + '%', indicadores.taxaGlosa < 3 ? '✅ Boa' : '⚠️ Alta', 'Glosas / NFs'],
        ['Data da Análise', formatDateTime(new Date()), '📅 Atual', 'Última atualização']
      ];

      var resultado = createReportDocument('Dashboard_Executivo', data, headers);

      if (resultado.success) {
        safeAlert('Dashboard Executivo Criado',
          '📊 INDICADORES PRINCIPAIS : \n\n' +
          '• NFs : ' + indicadores.totalNFs + '\n' +
          '• Entregas : ' + indicadores.totalEntregas + '\n' +
          '• Recusas : ' + indicadores.totalRecusas + ' (' + indicadores.taxaRecusa + '%)\n' +
          '• Glosas : ' + indicadores.totalGlosas + ' (' + indicadores.taxaGlosa + '%)\n' +
          '• Valor Total : R$ ' + indicadores.valorTotal.toFixed(2) + '\n\n' +
          '📋 Relatório : ' + resultado.fileName + '\n' +
          '🔗 Acesse : ' + resultado.url,
          ui.ButtonSet.OK
        );
      }

    } catch (e) {
      safeAlert('Erro', 'Erro ao gerar dashboard : ' + e.message, ui.ButtonSet.OK);
      Logger.log('Erro analiseCompletaDashboard : ' + e.message);
    }
  } catch (error) {
    Logger.log("Erro em analiseCompletaDashboard: " + error.message);
    throw error;
  }
  }


/**
 * ANÁLISES CRUZADAS ESPECÍFICAS
 */

function analiseCruzadaNFsEntregas() {
  try {
    var nfData = getSheetData('Notas_Fiscais', 500);
    var entregasData = getSheetData('Entregas', 500);

    var headers = ['NF_Numero', 'Fornecedor', 'Valor_NF', 'Total_Entregas', 'Status_Entrega'];
    var data = [];

    // Cruzar dados
    if (nfData.data && entregasData.data) {
      nfData.data.forEach(function(nfRow) {
        var numeroNF = nfRow[1]; // Numero_NF;
        var fornecedor = nfRow[6]; // Fornecedor_Nome;
        var valor = nfRow[8]; // Valor_Total;

        var entregasRelacionadas = entregasData.data.filter(function(entregaRow) {
          return entregaRow[3] == fornecedor; // Mesmo fornecedor;
        });

        data.push([
          numeroNF,
          fornecedor,
          valor,
          entregasRelacionadas.length,
          entregasRelacionadas.length > 0 ? 'Com Entregas' : 'Sem Entregas'
        ]);
      });
    }

    var resultado = createReportDocument('Analise_Cruzada_NFs_Entregas', data, headers);

    if (resultado.success) {
      getSafeUi().alert('Análise Cruzada - NFs vs Entregas',
        'Análise concluída!\n\n' +
        'NFs analisadas : ' + (nfData.data ? nfData.data.length : 0) + '\n' +
        'Entregas analisadas : ' + (entregasData.data ? entregasData.data.length : 0) + '\n\n' +
        'Relatório : ' + resultado.fileName + '\n' +
        'Acesse : ' + resultado.url,
        getSafeUi().ButtonSet.OK
      );
    }
  } catch (error) {
    Logger.log("Erro em analiseCruzadaNFsEntregas: " + error.message);
    throw error;
  }
}

// ---- BuscaGmail.gs ----
/**
 * BuscaGmail.gs
 * Sistema de busca avançada no Gmail por NF-e, Fornecedor e Gênero Alimentício
 * Sistema UNIAE CRE PP/Cruzeiro
 */

/**
 * CORTINA DE OPÇÕES PARA BUSCA NO GMAIL
 */
function cortinaBuscaGmail() {
  try {
    var ui = getSafeUi();
      if (!ui) {
        Logger.log("⚠️ UI não disponível");
        return;
      }

    ui.alert('🔍 BUSCA AVANÇADA NO GMAIL',
      'Sistema de busca inteligente no Gmail : \n\n' +
      '📧 Busca por NF-e (chaves de acesso)\n' +
      '🏢 Busca por Fornecedor\n' +
      '🍎 Busca por Gênero Alimentício\n' +
      '📅 Busca por Período\n' +
      '🔗 Busca Combinada\n\n' +
      'Escolha sua opção : ',
      ui.ButtonSet.OK
    );

    var opcao = ui.prompt(
      'Cortina de Busca Gmail',
      'Escolha o tipo de busca : \n\n' +
      '1 - 📧 Buscar NF-e por Chave de Acesso\n' +
      '2 - 🏢 Buscar por Fornecedor\n' +
      '3 - 🍎 Buscar por Gênero Alimentício\n' +
      '4 - 📅 Buscar por Período\n' +
      '5 - 🔗 Busca Combinada (múltiplos critérios)\n' +
      '6 - 📊 Estatísticas de E-mails\n\n' +
      'Digite o número : ',
      ui.ButtonSet.OK_CANCEL
    );

    // Verificar se o botão CANCEL foi pressionado
    if (!opcao || opcao.getSelectedButton() == ui.Button.CANCEL) return;

    var escolha = parseInt(opcao.getResponseText());

    switch (escolha) {
      case 1 :
        buscarNFeGmail();
        break;
      case 2 :
        buscarFornecedorGmail();
        break;
      case 3 :
        buscarGeneroAlimenticioGmail();
        break;
      case 4 :
        buscarPeriodoGmail();
        break;
      case 5 :
        buscaCombinadaGmail();
        break;
      case 6 :
        estatisticasEmailsGmail();
        break;
      default :
        ui.alert('Opção inválida', 'Por favor, escolha uma opção de 1 a 6.', ui.ButtonSet.OK);
    }
  } catch (error) {
    Logger.log("Erro em cortinaBuscaGmail: " + error.message);
    throw error;
  }
}

/**
 * BUSCA POR NF-e NO GMAIL
 */
function buscarNFeGmail() {
  try {
    var ui = getSafeUi();

    var chaveNFe = ui.prompt(
      'Busca NF-e no Gmail',
      'Digite a chave de acesso da NF-e (44 dígitos) : \n\n' +
      'Exemplo : 35200114200166000187550010000000015301234567\n\n' +
      'Ou parte da chave : ',
      ui.ButtonSet.OK_CANCEL
    );

    if (chaveNFe.getSelectedButton() == ui.Button.CANCEL) return;

    var chave = chaveNFe.getResponseText().trim();
    if (!chave) {
      ui.alert('Erro', 'Por favor, digite uma chave de acesso.', ui.ButtonSet.OK);
      return;
    }

    try {
      // Buscar no Gmail
      var query = 'subject : ("NF-e" OR "Nota Fiscal" OR "NFe") AND (' + chave + ')';
      var threads = GmailApp.search(query, 0, 50);

      var resultados = processarThreadsGmail(threads, 'NF-e : ' + chave);
      exibirResultadosGmail('Busca NF-e', resultados, chave);

    } catch (e) {
      ui.alert('Erro', 'Erro ao buscar no Gmail : ' + e.message, ui.ButtonSet.OK);
      Logger.log('Erro buscarNFeGmail : ' + e.message);
      return {
        chaveAcesso : chaveAcesso,
        situacao : "ERRO",
        valida : false
      };
    }
  } catch (error) {
    Logger.log("Erro em buscarNFeGmail: " + error.message);
    throw error;
  }
}

/**
 * BUSCA POR FORNECEDOR NO GMAIL
 */
function buscarFornecedorGmail() {
  try {
    var ui = getSafeUi();

    var fornecedor = ui.prompt(
      'Busca Fornecedor no Gmail',
      'Digite o nome do fornecedor : \n\n' +
      'Exemplos : \n' +
      '• FRIOLI\n' +
      '• BARBOSA\n' +
      '• COOPBRASIL\n' +
      '• JVC\n\n' +
      'Nome do fornecedor : ',
      ui.ButtonSet.OK_CANCEL
    );

    if (fornecedor.getSelectedButton() == ui.Button.CANCEL) return;

    var nome = fornecedor.getResponseText().trim();
    if (!nome) {
      ui.alert('Erro', 'Por favor, digite o nome do fornecedor.', ui.ButtonSet.OK);
      return;
    }

    try {
      // Buscar no Gmail com múltiplas variações
      var query = '(subject : ("' + nome + '") OR from : ("' + nome + '") OR body : ("' + nome + '")) AND ' +
                  '(subject : ("NF" OR "Nota" OR "Fiscal" OR "Entrega" OR "Pedido"))';
      var threads = GmailApp.search(query, 0, 100);

      var resultados = processarThreadsGmail(threads, 'Fornecedor : ' + nome);
      exibirResultadosGmail('Busca Fornecedor', resultados, nome);

    } catch (e) {
      ui.alert('Erro', 'Erro ao buscar fornecedor : ' + e.message, ui.ButtonSet.OK);
      Logger.log('Erro buscarFornecedorGmail : ' + e.message);
      return {
        chaveAcesso : chaveAcesso,
        situacao : "ERRO",
        valida : false
      };
    }
  } catch (error) {
    Logger.log("Erro em buscarFornecedorGmail: " + error.message);
    throw error;
  }
}

/**
 * BUSCA POR GÊNERO ALIMENTÍCIO NO GMAIL
 */
function buscarGeneroAlimenticioGmail() {
  try {
    var ui = getSafeUi();

    var genero = ui.prompt(
      'Busca Gênero Alimentício no Gmail',
      'Escolha o gênero alimentício : \n\n' +
      '1 - 🌾 Grãos (arroz, feijão, milho)\n' +
      '2 - 🥛 Laticínios (leite, queijo, iogurte)\n' +
      '3 - 🥩 Carnes (bovina, suína, frango, peixe)\n' +
      '4 - 🥬 Verduras e Legumes\n' +
      '5 - 🍎 Frutas\n' +
      '6 - 🍞 Panificação\n' +
      '7 - 🥄 Temperos e Condimentos\n' +
      '8 - 🔍 Busca personalizada\n\n' +
      'Digite o número : ',
      ui.ButtonSet.OK_CANCEL
    );

    if (genero.getSelectedButton() == ui.Button.CANCEL) return;

    var opcao = parseInt(genero.getResponseText());
    var termosBusca = [];
    var categoria = '';

    switch (opcao) {
      case 1 :
        termosBusca = ['arroz', 'feijão', 'feijao', 'milho', 'soja', 'trigo'];
        categoria = 'Grãos';
        break;
      case 2 :
        termosBusca = ['leite', 'queijo', 'iogurte', 'manteiga', 'muçarela', 'mussarela'];
        categoria = 'Laticínios';
        break;
      case 3 :
        termosBusca = ['carne', 'frango', 'peixe', 'suína', 'bovina', 'coxa', 'sobrecoxa'];
        categoria = 'Carnes';
        break;
      case 4 :
        termosBusca = ['alface', 'tomate', 'cebola', 'batata', 'cenoura', 'verdura'];
        categoria = 'Verduras e Legumes';
        break;
      case 5 :
        termosBusca = ['banana', 'maçã', 'laranja', 'mamão', 'abacaxi', 'melão'];
        categoria = 'Frutas';
        break;
      case 6 :
        termosBusca = ['pão', 'biscoito', 'farinha', 'fermento'];
        categoria = 'Panificação';
        break;
      case 7 :
        termosBusca = ['sal', 'açúcar', 'óleo', 'vinagre', 'alho', 'tempero'];
        categoria = 'Temperos e Condimentos';
        break;
      case 8 :
        var personalizado = safePrompt('Busca Personalizada', 'Digite os termos separados por vírgula : ');
        if (personalizado.getSelectedButton() == ui.Button.OK) {
          termosBusca = personalizado.getResponseText().split(',').map(function(t) { return t.trim(); });
          categoria = 'Personalizada';
        } else {
          return;
        }
        break;
      default :
        ui.alert('Opção inválida', 'Por favor, escolha uma opção de 1 a 8.', ui.ButtonSet.OK);
    }

    try {
      // Construir query para Gmail
      var queryTermos = termosBusca.map(function(termo) {
        return '("' + termo + '")';
      }).join(' OR ');

      var query = '(' + queryTermos + ') AND (subject : ("NF" OR "Nota" OR "Entrega" OR "Pedido"))';
      var threads = GmailApp.search(query, 0, 100);

      var resultados = processarThreadsGmail(threads, categoria + ' : ' + termosBusca.join(', '));
      exibirResultadosGmail('Busca ' + categoria, resultados, termosBusca.join(', '));

    } catch (e) {
      ui.alert('Erro', 'Erro ao buscar gênero alimentício : ' + e.message, ui.ButtonSet.OK);
      Logger.log('Erro buscarGeneroAlimenticioGmail : ' + e.message);
    }
  } catch (error) {
    Logger.log("Erro em buscarGeneroAlimenticioGmail: " + error.message);
    throw error;
  }
  }


/**
 * BUSCA POR PERÍODO NO GMAIL
 */
function buscarPeriodoGmail() {
  try {
    var ui = getSafeUi();

    var periodo = ui.prompt(
      'Busca por Período no Gmail',
      'Escolha o período : \n\n' +
      '1 - Última semana\n' +
      '2 - Último mês\n' +
      '3 - Últimos 3 meses\n' +
      '4 - Período personalizado\n\n' +
      'Digite o número : ',
      ui.ButtonSet.OK_CANCEL
    );

    if (periodo.getSelectedButton() == ui.Button.CANCEL) return;

    var opcao = parseInt(periodo.getResponseText());
    var query = '';
    var descricao = '';

    switch (opcao) {
      case 1 :
        query = 'newer_than : 7d AND (subject : ("NF" OR "Nota" OR "Fiscal"))';
        descricao = 'Última semana';
        break;
      case 2 :
        query = 'newer_than : 1m AND (subject : ("NF" OR "Nota" OR "Fiscal"))';
        descricao = 'Último mês';
        break;
      case 3 :
        query = 'newer_than : 3m AND (subject : ("NF" OR "Nota" OR "Fiscal"))';
        descricao = 'Últimos 3 meses';
        break;
      case 4 :
        var dataInicio = ui.prompt('Data Início', 'Digite a data de início (AAAA/MM/DD) : ', ui.ButtonSet.OK_CANCEL);
        if (dataInicio.getSelectedButton() == ui.Button.CANCEL) return;
        var dataFim = ui.prompt('Data Fim', 'Digite a data de fim (AAAA/MM/DD) : ', ui.ButtonSet.OK_CANCEL);
        if (dataFim.getSelectedButton() == ui.Button.CANCEL) return;

        query = 'after : ' + dataInicio.getResponseText() + ' before : ' + dataFim.getResponseText() +
                ' AND (subject : ("NF" OR "Nota" OR "Fiscal"))';
        descricao = 'Período : ' + dataInicio.getResponseText() + ' a ' + dataFim.getResponseText();
        break;
      default :
        ui.alert('Opção inválida', 'Por favor, escolha uma opção de 1 a 4.', ui.ButtonSet.OK);
        return;
    }

    try {
      var threads = GmailApp.search(query, 0, 200);
      var resultados = processarThreadsGmail(threads, descricao);
      exibirResultadosGmail('Busca por Período', resultados, descricao);

    } catch (e) {
      ui.alert('Erro', 'Erro ao buscar por período : ' + e.message, ui.ButtonSet.OK);
      Logger.log('Erro buscarPeriodoGmail : ' + e.message);
      return {
        chaveAcesso : chaveAcesso,
        situacao : "ERRO",
        valida : false
      };
    }
  } catch (error) {
    Logger.log("Erro em buscarPeriodoGmail: " + error.message);
    throw error;
  }
}

/**
 * BUSCA COMBINADA NO GMAIL
 */
function buscaCombinadaGmail() {
  try {
    var ui = getSafeUi();

    ui.alert('Busca Combinada Gmail',
      'Configure múltiplos critérios para busca avançada : \n\n' +
      '• Fornecedor + Período\n' +
      '• Gênero + Fornecedor\n' +
      '• NF-e + Data específica\n' +
      '• Combinação personalizada',
      ui.ButtonSet.OK
    );

    var criterios = {};

    // Critério 1 : Fornecedor
    var usarFornecedor = ui.alert('Critério : Fornecedor', 'Incluir filtro por fornecedor ? ', ui.ButtonSet.YES_NO);
    if (usarFornecedor == ui.Button.YES) {
      var fornecedor = ui.prompt('Fornecedor', 'Digite o nome do fornecedor : ', ui.ButtonSet.OK_CANCEL);
      if (fornecedor.getSelectedButton() == ui.Button.OK) {
        criterios.fornecedor = fornecedor.getResponseText();
      }
    }

    // Critério 2 : Período
    var usarPeriodo = ui.alert('Critério : Período', 'Incluir filtro por período ? ', ui.ButtonSet.YES_NO);
    if (usarPeriodo == ui.Button.YES) {
      var periodo = ui.prompt('Período', 'Digite o período (7d, 1m, 3m) ou data específica : ', ui.ButtonSet.OK_CANCEL);
      if (periodo.getSelectedButton() == ui.Button.OK) {
        criterios.periodo = periodo.getResponseText();
      }
    }

    // Critério 3 : Produto
    var usarProduto = ui.alert('Critério : Produto', 'Incluir filtro por produto ? ', ui.ButtonSet.YES_NO);
    if (usarProduto == ui.Button.YES) {
      var produto = ui.prompt('Produto', 'Digite o nome do produto : ', ui.ButtonSet.OK_CANCEL);
      if (produto.getSelectedButton() == ui.Button.OK) {
        criterios.produto = produto.getResponseText();
      }
    }

    if (Object.keys(criterios).length == 0) {
      ui.alert('Aviso', 'Nenhum critério foi definido.', ui.ButtonSet.OK);
    }

    try {
      // Construir query combinada
      var queryParts = [];
      var descricao = [];

      if (criterios.fornecedor) {
        queryParts.push('(from : ("' + criterios.fornecedor + '") OR subject : ("' + criterios.fornecedor + '"))');
        descricao.push('Fornecedor : ' + criterios.fornecedor);
      }

      if (criterios.periodo) {
        if (criterios.periodo.includes('d') || criterios.periodo.includes('m')) {
          queryParts.push('newer_than : ' + criterios.periodo);
        } else {
          queryParts.push('after : ' + criterios.periodo);
        }
        descricao.push('Período : ' + criterios.periodo);
      }

      if (criterios.produto) {
        queryParts.push('("' + criterios.produto + '")');
        descricao.push('Produto : ' + criterios.produto);
      }

      // Sempre incluir filtro de NF
      queryParts.push('(subject : ("NF" OR "Nota" OR "Fiscal"))');

      var query = queryParts.join(' AND ');
      var threads = GmailApp.search(query, 0, 150);

      var resultados = processarThreadsGmail(threads, descricao.join(' | '));
      exibirResultadosGmail('Busca Combinada', resultados, descricao.join(' | '));

    } catch (e) {
      safeAlert('Erro', 'Erro na busca combinada : ' + e.message);
      Logger.log('Erro buscaCombinadaGmail : ' + e.message);
    }
  } catch (error) {
    Logger.log("Erro em buscaCombinadaGmail: " + error.message);
    throw error;
  }
  }


/**
 * PROCESSAR THREADS DO GMAIL
 */
function processarThreadsGmail(threads, criterio) {
  try {
    var resultados = [];

    threads.forEach(function(thread) {
      try {
        var messages = thread.getMessages();
        var firstMessage = messages[0];

        resultados.push({
          assunto : thread.getFirstMessageSubject(),
          remetente : firstMessage.getFrom(),
          data : firstMessage.getDate(),
          snippet : thread.getMessages()[0].getPlainBody().substring(0, 200),
          threadId : thread.getId(),
          messageCount : messages.length,
          labels : thread.getLabels().map(function(label) { return label.getName(); }).join(', '),
          criterio : criterio
        });
      } catch (e) {
        Logger.log('Erro ao processar thread : ' + e.message);
      }
    });
    return resultados;
  } catch (error) {
    Logger.log("Erro em processarThreadsGmail: " + error.message);
    throw error;
  }
}


/**
 * EXIBIR RESULTADOS DA BUSCA GMAIL
 */
function exibirResultadosGmail(titulo, resultados, criterio) {
  try {
    var headers = [
      'Assunto',
      'Remetente',
      'Data',
      'Snippet',
      'Thread_ID',
      'Num_Mensagens',
      'Labels',
      'Criterio_Busca'
    ];

    var data = [];

    if (safeLength(resultados) == 0) {
      data.push([
        'Nenhum resultado encontrado',
        criterio,
        new Date(),
        'Tente ajustar os critérios de busca',
        '',
        0,
        '',
        criterio
      ]);
    } else {
      resultados.forEach(function(resultado) {
        data.push([
          resultado.assunto,
          resultado.remetente,
          resultado.data,
          resultado.snippet,
          resultado.threadId,
          resultado.messageCount,
          resultado.labels,
          resultado.criterio
        ]);
      });
    }

    var resultado = createReportSpreadsheet('Busca_Gmail_' + titulo.replace(/\s+/g, '_'), 'busca_gmail', headers, data);

    if (resultado.success) {
      getSafeUi().alert('🔍 Busca Gmail Concluída',
        titulo + '\n\n' +
        '📧 E-mails encontrados : ' + safeLength(resultados) + '\n' +
        '🔍 Critério : ' + criterio + '\n\n' +
        '📄 Relatório : ' + resultado.fileName + '\n' +
        '🔗 Acesse : ' + resultado.url,
        getSafeUi().ButtonSet.OK
      );
    } else {
      getSafeUi().alert('Erro', 'Erro ao criar relatório : ' + resultado.error, getSafeUi().ButtonSet.OK);
    }
  } catch (error) {
    Logger.log("Erro em exibirResultadosGmail: " + error.message);
    throw error;
  }
}

/**
 * ESTATÍSTICAS DE E-MAILS
 */
function estatisticasEmailsGmail() {
  try {
    var ui = getSafeUi();

    ui.alert('Coletando Estatísticas',
      'Analisando e-mails relacionados a NF-e/* spread */\n\nAguarde/* spread */',
      ui.ButtonSet.OK
    );

    try {
      var queries = [
        {nome : 'NF-e Total', query : 'subject : ("NF-e" OR "NFe" OR "Nota Fiscal")'},
        {nome : 'Última Semana', query : 'newer_than : 7d AND subject : ("NF" OR "Nota")'},
        {nome : 'Último Mês', query : 'newer_than : 1m AND subject : ("NF" OR "Nota")'},
        {nome : 'Com Anexos', query : 'has : attachment AND subject : ("NF" OR "Nota")'},
        {nome : 'Não Lidos', query : 'is : unread AND subject : ("NF" OR "Nota")'}
      ];

      var estatisticas = [];

      queries.forEach(function(q) {
        try {
          var threads = GmailApp.search(q.query, 0, 500);
          estatisticas.push({
            categoria : q.nome,
            quantidade : threads.length,
            query : q.query
          });
        } catch (e) {
          estatisticas.push({
            categoria : q.nome,
            quantidade : 'Erro : ' + e.message,
            query : q.query
          });
        }
      });

      // Criar relatório
      var headers = ['Categoria', 'Quantidade', 'Query_Utilizada'];
      var data = estatisticas.map(function(stat) {});

      var resultado = createReportSpreadsheet('Estatisticas_Gmail_NFe', 'estatisticas', headers, data);

      if (resultado.success) {
        ui.alert('📊 Estatísticas Gmail',
          'RESUMO DOS E-MAILS : \n\n' +
          estatisticas.map(function(s) { return '• ' + s.categoria + ' : ' + s.quantidade; }).join('\n') + '\n\n' +
          '📄 Relatório : ' + resultado.fileName + '\n' +
          '🔗 Acesse : ' + resultado.url,
          ui.ButtonSet.OK
        );
      }

    } catch (e) {
      ui.alert('Erro', 'Erro ao coletar estatísticas : ' + e.message, ui.ButtonSet.OK);
      Logger.log('Erro estatisticasEmailsGmail : ' + e.message);
    }
  } catch (error) {
    Logger.log("Erro em estatisticasEmailsGmail: " + error.message);
    throw error;
  }

}


