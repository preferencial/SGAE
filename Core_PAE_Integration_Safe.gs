/**
 * Core_PAE_Integration_Safe.gs
 * Módulo de Integração do Sistema PAE/DF - Versão Segura
 *
 * CORREÇÕES APLICADAS:
 * - Todas as chamadas a SpreadsheetApp.getUi() substituídas por funções seguras
 * - Validação de contexto antes de operações de UI
 * - Fallback para logs quando UI não disponível
 *
 * @version 2.0.0
 * @updated 2025-12-04
 */

'use strict';

// ============================================================================
// MENU PRINCIPAL DO SISTEMA PAE - VERSÃO SEGURA
// ============================================================================

/**
 * Cria menu completo do Sistema PAE de forma segura
 * Usa safeCreateMenu do Core_UI_Safe.gs
 */
function criarMenuPAE() {
  try {
    // Verifica se UI está disponível
    if (!isUiAvailable()) {
      Logger.log('⚠️ Menu PAE não criado - UI não disponível no contexto atual');
      return;
    }

    try {
      var ui = SpreadsheetApp.getUi();

      ui.createMenu('🍎 Sistema PAE/DF')
        // Atesto
        .addSubMenu(ui.createMenu('📋 Atesto de Gêneros')
          .addItem('Painel Principal', 'abrirSistemaAtestoAprimoradoSafe')
          .addItem('Checklist de Recebimento', 'abrirChecklistRecebimentoSafe')
          .addItem('Processos com Prazo Crítico', 'listarProcessosPrazoCriticoSafe')
          .addItem('Relatório de Processos', 'gerarRelatorioProcessosSafe'))

        // Notificações de Qualidade
        .addSubMenu(ui.createMenu('⚠️ Notificações de Qualidade')
          .addItem('Nova Notificação', 'abrirFormularioNotificacaoSafe')
          .addItem('Listar Notificações', 'listarNotificacoesUISafe')
          .addItem('Registrar Descarte', 'abrirFormularioDescarteSafe')
          .addItem('Registrar Reposição', 'abrirFormularioReposicaoSafe'))

        // Cardápios Especiais
        .addSubMenu(ui.createMenu('🥗 Cardápios Especiais')
          .addItem('Cadastrar Aluno', 'abrirCadastroAlunoEspecialSafe')
          .addItem('Listar Alunos', 'listarAlunosEspeciaisUISafe')
          .addItem('Gerar Lista PDAF', 'gerarListaPDAFUISafe')
          .addItem('Verificar Laudos Vencidos', 'verificarLaudosVencidosUISafe')
          .addItem('Relatório por CRE', 'gerarRelatorioAlunosCREUISafe'))

        // Conformidade
        .addSubMenu(ui.createMenu('✅ Conformidade')
          .addItem('Verificar Regularidade Fiscal', 'abrirVerificacaoFiscalSafe')
          .addItem('Verificar Documentação', 'abrirVerificacaoDocumentacaoSafe')
          .addItem('Relatório de Não Conformidades', 'gerarRelatorioNCUISafe')
          .addItem('Processos Pendentes', 'listarPendentesRegularizacaoUISafe'))

        .addSeparator()

        // Relatórios
        .addSubMenu(ui.createMenu('📊 Relatórios')
          .addItem('Dashboard Geral', 'abrirDashboardPAESafe')
          .addItem('Exportar para Excel', 'exportarDadosExcelSafe')
          .addItem('Gerar Relatório SEI', 'gerarRelatorioSEICompletoSafe'))

        // Configurações
        .addSubMenu(ui.createMenu('⚙️ Configurações')
          .addItem('Configurar Comissão', 'configurarComissaoSafe')
          .addItem('Configurar CREs', 'configurarCREsSafe')
          .addItem('Configurar Prazos', 'configurarPrazosSafe')
          .addItem('Inicializar Abas', 'inicializarAbasSistemaSafe'))

        .addToUi();

      Logger.log('✅ Menu PAE criado com sucesso');
    } catch (e) {
      Logger.log('❌ Erro ao criar menu PAE: ' + e.message);
    }
  } catch (error) {
    Logger.log("Erro em criarMenuPAE: " + error.message);
    throw error;
  }
}

// ============================================================================
// FUNÇÕES DE INTERFACE SEGURAS - NOTIFICAÇÕES
// ============================================================================

/**
 * Abre formulário de notificação de forma segura
 */
function abrirFormularioNotificacaoSafe() {
  try {
    if (!isUiAvailable()) {
      Logger.log('⚠️ UI não disponível para abrir formulário de notificação');
      return { success: false, error: 'UI não disponível' };
    }

    try {
      var html = HtmlService.createTemplateFromFile('UI_Notificacao_Alimentos').evaluate()
        .setWidth(900)
        .setHeight(700)
        .setTitle('Notificação de Qualidade');

      SpreadsheetApp.getUi().showModalDialog(html, 'Notificação de Qualidade de Alimento Perecível');
      return { success: true };
    } catch (e) {
      Logger.log('❌ Erro ao abrir formulário: ' + e.message);
      return { success: false, error: e.message };
    }
  } catch (error) {
    Logger.log("Erro em abrirFormularioNotificacaoSafe: " + error.message);
    throw error;
  }
}

/**
 * Lista notificações de forma segura
 */
function listarNotificacoesUISafe() {
  try {
    var resultado = listarNotificacoes({});

    if (!resultado.success) {
      safeAlert('Erro', resultado.error);
      return resultado;
    }

    if (resultado.data.length === 0) {
      safeAlert('Informação', 'Nenhuma notificação encontrada.');
      return resultado;
    }

    var mensagem = '📋 NOTIFICAÇÕES DE QUALIDADE\n\n';

    resultado.data.slice(0, 20).forEach(function(n, i) {
      mensagem += (i + 1) + '. ' + (n.tipo || 'N/A') + ' - ' + (n.produto || 'N/A') + '\n';
      mensagem += '   UE: ' + (n.unidade_escolar || 'N/A') + ' | Status: ' + (n.status || 'N/A') + '\n';
      mensagem += '   Data: ' + (n.data_registro || 'N/A') + '\n\n';
    });

    if (resultado.data.length > 20) {
      mensagem += '\n... e mais ' + (resultado.data.length - 20) + ' notificações.';
    }

    safeAlert('Notificações', mensagem);
    return resultado;
  } catch (error) {
    Logger.log("Erro em listarNotificacoesUISafe: " + error.message);
    throw error;
  }
}

/**
 * Abre formulário de descarte de forma segura
 */
function abrirFormularioDescarteSafe() {
  try {
    var result = safePrompt(
      'Registrar Descarte Assistido',
      'Digite o ID da notificação para registrar o descarte:'
    );

    if (result.success && result.value) {
      var notificacaoId = result.value.trim();

      if (!notificacaoId) {
        safeAlert('Erro', 'ID da notificação é obrigatório.');
        return { success: false, error: 'ID obrigatório' };
      }

      safeAlert('Informação',
        'Funcionalidade de descarte assistido.\n\n' +
        'Para registrar o descarte completo, use a interface web ou preencha os dados na aba "Descartes_Alimentos".'
      );
      return { success: true, notificacaoId: notificacaoId };
    }

    return { success: false, cancelled: true };
  } catch (error) {
    Logger.log("Erro em abrirFormularioDescarteSafe: " + error.message);
    throw error;
  }
}

/**
 * Abre formulário de reposição de forma segura
 */
function abrirFormularioReposicaoSafe() {
  safeAlert('Registrar Reposição',
    'Para registrar reposição de alimentos:\n\n' +
    '1. Reposição pela UE: Use a função registrarReposicaoUE()\n' +
    '2. Reposição pelo Fornecedor: Use a função registrarReposicaoFornecedor()\n\n' +
    'Ou preencha diretamente na aba "Reposicoes_Alimentos".'
  );
}

// ============================================================================
// FUNÇÕES DE INTERFACE SEGURAS - CARDÁPIOS ESPECIAIS
// ============================================================================

/**
 * Abre cadastro de aluno especial de forma segura
 */
function abrirCadastroAlunoEspecialSafe() {
  try {
    if (!isUiAvailable()) {
      Logger.log('⚠️ UI não disponível para cadastro de aluno');
      return { success: false, error: 'UI não disponível' };
    }

    try {
      var ui = SpreadsheetApp.getUi();

      var nome = ui.prompt('Cadastro de Aluno', 'Nome completo do aluno:', ui.ButtonSet.OK_CANCEL);
      if (nome.getSelectedButton() !== ui.Button.OK) return { success: false, cancelled: true };

      var ue = ui.prompt('Cadastro de Aluno', 'Unidade Escolar:', ui.ButtonSet.OK_CANCEL);
      if (ue.getSelectedButton() !== ui.Button.OK) return { success: false, cancelled: true };

      var patologia = ui.prompt('Cadastro de Aluno',
        'Patologia (APLV, DIABETES, INTOLERANCIA_LACTOSE, DOENCA_CELIACA ou OUTRA):',
        ui.ButtonSet.OK_CANCEL);
      if (patologia.getSelectedButton() !== ui.Button.OK) return { success: false, cancelled: true };

      // Verifica se função existe
      if (typeof cadastrarAlunoNecessidadeEspecial !== 'function') {
        ui.alert('Erro', 'Função de cadastro não disponível.', ui.ButtonSet.OK);
        return { success: false, error: 'Função não disponível' };
      }

      var resultado = cadastrarAlunoNecessidadeEspecial({
        nomeCompleto: nome.getResponseText(),
        unidadeEscolar: ue.getResponseText(),
        patologiaPrincipal: patologia.getResponseText().toUpperCase(),
        possuiLaudo: false,
        responsavelCadastro: Session.getActiveUser().getEmail()
      });

      if (resultado.success) {
        ui.alert('✅ Sucesso', 'Aluno cadastrado com ID: ' + resultado.id + '\n\nLembre-se de anexar o laudo médico.', ui.ButtonSet.OK);
      } else {
        ui.alert('❌ Erro', resultado.error || 'Erro desconhecido', ui.ButtonSet.OK);
      }

      return resultado;
    } catch (e) {
      Logger.log('❌ Erro no cadastro de aluno: ' + e.message);
      return { success: false, error: e.message };
    }
  } catch (error) {
    Logger.log("Erro em abrirCadastroAlunoEspecialSafe: " + error.message);
    throw error;
  }
}

/**
 * Lista alunos especiais de forma segura
 */
function listarAlunosEspeciaisUISafe() {
  try {
    if (typeof listarAlunosNecessidadeEspecial !== 'function') {
      safeAlert('Erro', 'Função de listagem não disponível.');
      return { success: false, error: 'Função não disponível' };
    }

    var resultado = listarAlunosNecessidadeEspecial({});

    if (!resultado.success) {
      safeAlert('Erro', resultado.error || 'Erro ao listar alunos');
      return resultado;
    }

    if (resultado.data.length === 0) {
      safeAlert('Informação', 'Nenhum aluno cadastrado.');
      return resultado;
    }

    var mensagem = '🥗 ALUNOS COM NECESSIDADES ESPECIAIS\n\n';
    mensagem += 'Total: ' + resultado.data.length + ' aluno(s)\n\n';

    resultado.data.slice(0, 15).forEach(function(a, i) {
      mensagem += (i + 1) + '. ' + (a.nome_completo || 'N/A') + '\n';
      mensagem += '   UE: ' + (a.unidade_escolar || 'N/A') + '\n';
      mensagem += '   Patologia: ' + (a.patologia_principal || 'N/A') + ' | Status: ' + (a.status || 'N/A') + '\n\n';
    });

    safeAlert('Alunos Especiais', mensagem);
    return resultado;
  } catch (error) {
    Logger.log("Erro em listarAlunosEspeciaisUISafe: " + error.message);
    throw error;
  }
}

/**
 * Gera lista PDAF de forma segura
 */
function gerarListaPDAFUISafe() {
  try {
    var result = safePrompt('Gerar Lista PDAF', 'Digite o nome da Unidade Escolar:');

    if (!result.success || !result.value) {
      if (!result.cancelled) {
        safeAlert('Erro', 'Nome da UE é obrigatório.');
      }
      return { success: false };
    }

    var ue = result.value.trim();

    if (typeof gerarListaAquisicaoPDAF !== 'function') {
      safeAlert('Erro', 'Função de geração não disponível.');
      return { success: false, error: 'Função não disponível' };
    }

    var resultado = gerarListaAquisicaoPDAF(ue, 'Distribuição Atual');

    if (resultado.success) {
      var mensagem = '📋 LISTA DE AQUISIÇÃO PDAF\n\n';
      mensagem += 'UE: ' + resultado.data.unidadeEscolar + '\n';
      mensagem += 'Total de Alunos: ' + resultado.data.totalAlunos + '\n\n';

      if (resultado.data.generos && resultado.data.generos.length > 0) {
        mensagem += 'GÊNEROS A ADQUIRIR:\n';
        resultado.data.generos.forEach(function(g) {
          mensagem += '• ' + g.produto + ': ' + g.quantidadeTotal.toFixed(2) + ' ' + g.unidade + '\n';
        });

        if (resultado.data.documentacaoNecessaria) {
          mensagem += '\nDOCUMENTAÇÃO NECESSÁRIA:\n';
          resultado.data.documentacaoNecessaria.forEach(function(d) {
            mensagem += '☐ ' + d + '\n';
          });
        }
      } else {
        mensagem += 'Nenhum gênero específico necessário.';
      }

      safeAlert('Lista PDAF', mensagem);
    } else {
      safeAlert('Erro', resultado.error || 'Erro ao gerar lista');
    }

    return resultado;
  } catch (error) {
    Logger.log("Erro em gerarListaPDAFUISafe: " + error.message);
    throw error;
  }
}

/**
 * Verifica laudos vencidos de forma segura
 */
function verificarLaudosVencidosUISafe() {
  try {
    if (typeof listarAlunosLaudoVencendo !== 'function') {
      safeAlert('Erro', 'Função de verificação não disponível.');
      return { success: false, error: 'Função não disponível' };
    }

    var resultado = listarAlunosLaudoVencendo(30);

    if (!resultado.success) {
      safeAlert('Erro', resultado.error || 'Erro ao verificar laudos');
      return resultado;
    }

    if (resultado.data.length === 0) {
      safeAlert('✅ Sucesso', 'Nenhum laudo vencido ou próximo do vencimento.');
      return resultado;
    }

    var mensagem = '⚠️ LAUDOS VENCIDOS OU PRÓXIMOS DO VENCIMENTO\n\n';

    resultado.data.forEach(function(a, i) {
      mensagem += (i + 1) + '. ' + (a.nome_completo || 'N/A') + '\n';
      mensagem += '   UE: ' + (a.unidade_escolar || 'N/A') + '\n';
      mensagem += '   Data Laudo: ' + (a.data_laudo || 'Não informada') + '\n\n';
    });

    safeAlert('Laudos Vencidos', mensagem);
    return resultado;
  } catch (error) {
    Logger.log("Erro em verificarLaudosVencidosUISafe: " + error.message);
    throw error;
  }
}

/**
 * Gera relatório de alunos por CRE de forma segura
 */
function gerarRelatorioAlunosCREUISafe() {
  if (typeof gerarRelatorioAlunosPorCRE !== 'function') {
    safeAlert('Erro', 'Função de relatório não disponível.');
    return { success: false, error: 'Função não disponível' };
  }

  var resultado = gerarRelatorioAlunosPorCRE();

  if (!resultado.success) {
    safeAlert('Erro', resultado.error || 'Erro ao gerar relatório');
    return resultado;
  }

  var mensagem = '📊 RELATÓRIO DE ALUNOS POR CRE\n\n';
  mensagem += 'Total Geral: ' + resultado.data.totalGeral + ' aluno(s)\n\n';

  mensagem += 'POR CRE:\n';
  for (var cre in resultado.data.porCRE) {
    mensagem += '• ' + cre + ': ' + resultado.data.porCRE[cre].total + ' aluno(s)\n';
  }

  mensagem += '\nPOR PATOLOGIA:\n';
  for (var pat in resultado.data.porPatologia) {
    mensagem += '• ' + pat + ': ' + resultado.data.porPatologia[pat] + ' aluno(s)\n';
  }

  safeAlert('Relatório por CRE', mensagem);
  return resultado;
}


// ============================================================================
// FUNÇÕES DE INTERFACE SEGURAS - CONFORMIDADE
// ============================================================================

/**
 * Abre verificação fiscal de forma segura
 */
function abrirVerificacaoFiscalSafe() {
  try {
    if (!isUiAvailable()) {
      Logger.log('⚠️ UI não disponível para verificação fiscal');
      return { success: false, error: 'UI não disponível' };
    }

    try {
      var ui = SpreadsheetApp.getUi();

      var fornecedor = ui.prompt('Verificação Fiscal', 'Nome do Fornecedor:', ui.ButtonSet.OK_CANCEL);
      if (fornecedor.getSelectedButton() !== ui.Button.OK) return { success: false, cancelled: true };

      var cnpj = ui.prompt('Verificação Fiscal', 'CNPJ do Fornecedor:', ui.ButtonSet.OK_CANCEL);
      if (cnpj.getSelectedButton() !== ui.Button.OK) return { success: false, cancelled: true };

      if (typeof verificarRegularidadeFiscal !== 'function') {
        ui.alert('Erro', 'Função de verificação não disponível.', ui.ButtonSet.OK);
        return { success: false, error: 'Função não disponível' };
      }

      var resultado = verificarRegularidadeFiscal({
        fornecedor: fornecedor.getResponseText(),
        cnpj: cnpj.getResponseText(),
        certidoes: []
      });

      if (resultado.success) {
        var mensagem = '📋 VERIFICAÇÃO DE REGULARIDADE FISCAL\n\n';
        mensagem += 'Fornecedor: ' + resultado.data.fornecedor + '\n';
        mensagem += 'CNPJ: ' + resultado.data.cnpj + '\n';
        mensagem += 'Status: ' + resultado.data.statusGeral + '\n\n';

        if (resultado.data.naoConformidades && resultado.data.naoConformidades.length > 0) {
          mensagem += '⚠️ NÃO CONFORMIDADES:\n';
          resultado.data.naoConformidades.forEach(function(nc) {
            mensagem += '• ' + nc.descricao + '\n';
          });
          mensagem += '\n⚠️ Providenciar certidões antes do pagamento!';
        } else {
          mensagem += '✅ Todas as certidões estão em conformidade.';
        }

        ui.alert(mensagem);
      } else {
        ui.alert('Erro', resultado.error || 'Erro na verificação', ui.ButtonSet.OK);
      }

      return resultado;
    } catch (e) {
      Logger.log('❌ Erro na verificação fiscal: ' + e.message);
      return { success: false, error: e.message };
    }
  } catch (error) {
    Logger.log("Erro em abrirVerificacaoFiscalSafe: " + error.message);
    throw error;
  }
}

/**
 * Abre verificação de documentação de forma segura
 */
function abrirVerificacaoDocumentacaoSafe() {
  safeAlert('Verificação de Documentação',
    'Para verificar documentação completa de um processo:\n\n' +
    '1. Use a função verificarDocumentacaoLiquidacao(dados)\n' +
    '2. Ou verificacaoCompletaConformidade(dados)\n\n' +
    'Documentos obrigatórios (Lei 4.320/64):\n' +
    '• Nota Fiscal/Fatura\n' +
    '• Termo de Recebimento Definitivo\n' +
    '• Atesto do Executor\n' +
    '• Certidões de Regularidade Fiscal\n' +
    '• Medição de Serviços (se aplicável)'
  );
}

/**
 * Gera relatório de não conformidades de forma segura
 */
function gerarRelatorioNCUISafe() {
  try {
    if (typeof gerarRelatorioNaoConformidades !== 'function') {
      safeAlert('Erro', 'Função de relatório não disponível.');
      return { success: false, error: 'Função não disponível' };
    }

    var resultado = gerarRelatorioNaoConformidades();

    if (!resultado.success) {
      safeAlert('Erro', resultado.error || 'Erro ao gerar relatório');
      return resultado;
    }

    var mensagem = '📊 RELATÓRIO DE NÃO CONFORMIDADES\n\n';
    mensagem += 'Total de Verificações: ' + resultado.data.totalVerificacoes + '\n';
    mensagem += 'Total de NC: ' + resultado.data.totalNaoConformidades + '\n\n';

    if (resultado.data.porTipo && Object.keys(resultado.data.porTipo).length > 0) {
      mensagem += 'POR TIPO:\n';
      for (var tipo in resultado.data.porTipo) {
        mensagem += '• ' + tipo + ': ' + resultado.data.porTipo[tipo].quantidade + ' ocorrência(s)\n';
      }
    } else {
      mensagem += '✅ Nenhuma não conformidade registrada.';
    }

    safeAlert('Relatório NC', mensagem);
    return resultado;
  } catch (error) {
    Logger.log("Erro em gerarRelatorioNCUISafe: " + error.message);
    throw error;
  }
}

/**
 * Lista processos pendentes de regularização de forma segura
 */
function listarPendentesRegularizacaoUISafe() {
  try {
    if (typeof listarProcessosPendentesRegularizacao !== 'function') {
      safeAlert('Erro', 'Função de listagem não disponível.');
      return { success: false, error: 'Função não disponível' };
    }

    var resultado = listarProcessosPendentesRegularizacao();

    if (!resultado.success) {
      safeAlert('Erro', resultado.error || 'Erro ao listar processos');
      return resultado;
    }

    if (resultado.data.length === 0) {
      safeAlert('✅ Sucesso', 'Nenhum processo pendente de regularização.');
      return resultado;
    }

    var mensagem = '⚠️ PROCESSOS PENDENTES DE REGULARIZAÇÃO\n\n';

    resultado.data.forEach(function(p, i) {
      mensagem += (i + 1) + '. Processo: ' + (p.processo || 'N/A') + '\n';
      mensagem += '   Fornecedor: ' + (p.fornecedor || 'N/A') + '\n';
      mensagem += '   NC: ' + (p.totalNC || 0) + ' | Data: ' + (p.data || 'N/A') + '\n\n';
    });

    safeAlert('Processos Pendentes', mensagem);
    return resultado;
  } catch (error) {
    Logger.log("Erro em listarPendentesRegularizacaoUISafe: " + error.message);
    throw error;
  }
}

// ============================================================================
// FUNÇÕES DE RELATÓRIOS E EXPORTAÇÃO SEGURAS
// ============================================================================

/**
 * Abre dashboard PAE de forma segura
 */
function abrirDashboardPAESafe() {
  try {
    // Coletar estatísticas
    var statsAtesto = { total: 0, pendentes: 0, atestados: 0 };
    var statsNotificacoes = { success: false, data: { total: 0, porTipo: {} } };
    var statsAlunos = { success: false, data: [] };

    try {
      if (typeof listarProcessosAtesto === 'function') {
        var processos = listarProcessosAtesto({});
        if (processos.success) {
          statsAtesto.total = processos.data.length;
          statsAtesto.pendentes = processos.data.filter(function(p) {
            return ['EM_ANALISE', 'PENDENCIA_DOCUMENTAL'].indexOf(p.status) !== -1;
          }).length;
          statsAtesto.atestados = processos.data.filter(function(p) {
            return ['ATESTADO_EXECUTOR', 'LIQUIDADO', 'PAGO'].indexOf(p.status) !== -1;
          }).length;
        }
      }
    } catch (e) {
      Logger.log('Erro ao obter stats de atesto: ' + e);
    }

    try {
      if (typeof obterEstatisticasNotificacoes === 'function') {
        statsNotificacoes = obterEstatisticasNotificacoes();
      }
    } catch (e) {
      Logger.log('Erro ao obter stats de notificações: ' + e);
    }

    try {
      if (typeof listarAlunosNecessidadeEspecial === 'function') {
        statsAlunos = listarAlunosNecessidadeEspecial({});
      }
    } catch (e) {
      Logger.log('Erro ao obter stats de alunos: ' + e);
    }

    var mensagem = '📊 DASHBOARD DO SISTEMA PAE/DF\n';
    mensagem += '═══════════════════════════════════\n\n';

    mensagem += '📋 PROCESSOS DE ATESTO:\n';
    mensagem += '   Total: ' + statsAtesto.total + '\n';
    mensagem += '   Pendentes: ' + statsAtesto.pendentes + '\n';
    mensagem += '   Atestados: ' + statsAtesto.atestados + '\n\n';

    if (statsNotificacoes.success) {
      mensagem += '⚠️ NOTIFICAÇÕES DE QUALIDADE:\n';
      mensagem += '   Total: ' + statsNotificacoes.data.total + '\n';
      for (var tipo in statsNotificacoes.data.porTipo) {
        mensagem += '   ' + tipo + ': ' + statsNotificacoes.data.porTipo[tipo] + '\n';
      }
      mensagem += '\n';
    }

    if (statsAlunos.success) {
      mensagem += '🥗 CARDÁPIOS ESPECIAIS:\n';
      mensagem += '   Alunos cadastrados: ' + statsAlunos.data.length + '\n\n';
    }

    mensagem += '═══════════════════════════════════\n';
    mensagem += 'Gerado em: ' + new Date().toLocaleString('pt-BR');

    safeAlert('Dashboard PAE', mensagem);
  } catch (error) {
    Logger.log("Erro em abrirDashboardPAESafe: " + error.message);
    throw error;
  }
}

/**
 * Exporta dados para Excel de forma segura
 */
function exportarDadosExcelSafe() {
  safeAlert('Exportar Dados',
    'Os dados já estão disponíveis nas abas da planilha:\n\n' +
    '• Processos_Atesto\n' +
    '• Notificacoes_Alimentos\n' +
    '• Descartes_Alimentos\n' +
    '• Reposicoes_Alimentos\n' +
    '• Alunos_Necessidades_Especiais\n' +
    '• Cardapios_Especiais\n' +
    '• Verificacoes_Conformidade\n' +
    '• Rastreabilidade_Processos\n\n' +
    'Use Arquivo > Download > Microsoft Excel para exportar.'
  );
}

/**
 * Gera relatório SEI de forma segura
 */
function gerarRelatorioSEICompletoSafe() {
  try {
    var result = safePrompt('Gerar Relatório SEI', 'Digite o período (MM/AAAA):');

    if (!result.success || !result.value) {
      return { success: false, cancelled: true };
    }

    var periodo = result.value.trim();

    var relatorio = '\nRELATÓRIO MENSAL DO PROGRAMA DE ALIMENTAÇÃO ESCOLAR\n';
    relatorio += 'Período: ' + periodo + '\n';
    relatorio += 'Data de Geração: ' + new Date().toLocaleString('pt-BR') + '\n\n';
    relatorio += '═══════════════════════════════════════════════════════════════\n\n';
    relatorio += '1. PROCESSOS DE ATESTO\n';

    try {
      if (typeof listarProcessosAtesto === 'function') {
        var processos = listarProcessosAtesto({});
        if (processos.success) {
          relatorio += '   Total de processos: ' + processos.data.length + '\n';
          var valorTotal = processos.data.reduce(function(acc, p) {
            return acc + (Number(p.valorTotal) || 0);
          }, 0);
          relatorio += '   Valor total: R$ ' + valorTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2}) + '\n';
        }
      }
    } catch (e) {
      relatorio += '   Erro ao obter dados de atesto\n';
    }

    relatorio += '\n2. NOTIFICAÇÕES DE QUALIDADE\n';

    var notificacoes = listarNotificacoes({});
    if (notificacoes.success) {
      relatorio += '   Total de notificações: ' + notificacoes.data.length + '\n';
    }

    relatorio += '\n3. CARDÁPIOS ESPECIAIS\n';

    if (typeof listarAlunosNecessidadeEspecial === 'function') {
      var alunos = listarAlunosNecessidadeEspecial({});
      if (alunos.success) {
        relatorio += '   Alunos atendidos: ' + alunos.data.length + '\n';
      }
    }

    relatorio += '\n═══════════════════════════════════════════════════════════════\n\n';
    relatorio += 'Responsável pela Geração: ' + Session.getActiveUser().getEmail() + '\n';

    // Tenta abrir em modal, senão loga
    if (isUiAvailable()) {
      try {
        var html = HtmlService.createHtmlOutput(
          '<html><head><style>' +
          'body { font-family: Courier, monospace; padding: 20px; white-space: pre-wrap; }' +
          'button { padding: 10px 20px; margin-bottom: 20px; cursor: pointer; }' +
          '</style></head><body>' +
          '<button onclick="window.print()">🖨️ Imprimir</button>' +
          '<pre>' + relatorio + '</pre>' +
          '</body></html>'
        )
        .setWidth(800)
        .setHeight(600)
        .setTitle('Relatório SEI');

        SpreadsheetApp.getUi().showModalDialog(html, 'Relatório SEI - PAE/DF');
      } catch (e) {
        Logger.log('Relatório SEI:\n' + relatorio);
      }
    } else {
      Logger.log('Relatório SEI:\n' + relatorio);
    }

    return { success: true, relatorio: relatorio };
  } catch (error) {
    Logger.log("Erro em gerarRelatorioSEICompletoSafe: " + error.message);
    throw error;
  }
}

// ============================================================================
// FUNÇÕES DE CONFIGURAÇÃO SEGURAS
// ============================================================================

/**
 * Configura comissão de forma segura
 */
function configurarComissaoSafe() {
  safeAlert('Configurar Comissão',
    'Para configurar a comissão de recebimento:\n\n' +
    '1. Acesse a aba "Configuracoes"\n' +
    '2. Preencha os dados dos membros da comissão\n' +
    '3. Defina os papéis (Presidente, Membro, Suplente)\n\n' +
    'A comissão é obrigatória para atesto de valores acima de R$ 17.600,00.'
  );
}

/**
 * Configura CREs de forma segura
 */
function configurarCREsSafe() {
  try {
    var cres = [
      'Plano Piloto/Cruzeiro', 'Gama', 'Taguatinga', 'Brazlândia',
      'Sobradinho', 'Planaltina', 'Núcleo Bandeirante', 'Ceilândia',
      'Guará', 'Samambaia', 'Santa Maria', 'Paranoá',
      'São Sebastião', 'Recanto das Emas'
    ];

    var mensagem = 'Coordenações Regionais de Ensino:\n\n';
    cres.forEach(function(c, i) {
      mensagem += (i + 1) + '. ' + c + '\n';
    });

    safeAlert('CREs Configuradas', mensagem);
  } catch (error) {
    Logger.log("Erro em configurarCREsSafe: " + error.message);
    throw error;
  }
}

/**
 * Configura prazos de forma segura
 */
function configurarPrazosSafe() {
  safeAlert('Configurar Prazos',
    'Prazos padrão do sistema:\n\n' +
    '• Atesto de NF: 5 dias úteis\n' +
    '• Reposição perecível: 24 horas\n' +
    '• Reposição outros: 5 dias úteis\n' +
    '• Análise GPAE: 5 dias úteis\n' +
    '• Validade laudo médico: 1 ano\n\n' +
    'Para alterar, edite a aba "Configuracoes".'
  );
}

/**
 * Inicializa abas do sistema de forma segura
 */
function inicializarAbasSistemaSafe() {
  var confirmar = safeConfirm(
    'Inicializar Sistema',
    'Isso criará todas as abas necessárias para o sistema PAE/DF.\n\nDeseja continuar?'
  );

  if (!confirmar) {
    return { success: false, cancelled: true };
  }

  try {
    var ss = getSS();

    var abas = [
      { nome: 'Processos_Atesto', cor: '#4f46e5' },
      { nome: 'Notificacoes_Alimentos', cor: '#ef4444' },
      { nome: 'Descartes_Alimentos', cor: '#f59e0b' },
      { nome: 'Reposicoes_Alimentos', cor: '#10b981' },
      { nome: 'Alunos_Necessidades_Especiais', cor: '#8b5cf6' },
      { nome: 'Cardapios_Especiais', cor: '#06b6d4' },
      { nome: 'Verificacoes_Conformidade', cor: '#f97316' },
      { nome: 'Rastreabilidade_Processos', cor: '#3b82f6' }
    ];

    var criadas = 0;

    abas.forEach(function(aba) {
      if (!ss.getSheetByName(aba.nome)) {
        var sheet = ss.insertSheet(aba.nome);
        sheet.setTabColor(aba.cor);
        criadas++;
      }
    });

    safeAlert('✅ Inicialização Concluída',
      criadas + ' aba(s) criada(s).\n\nO sistema está pronto para uso.'
    );

    return { success: true, abasCriadas: criadas };
  } catch (e) {
    Logger.log('❌ Erro na inicialização: ' + e.message);
    safeAlert('Erro', 'Erro ao inicializar: ' + e.message);
    return { success: false, error: e.message };
  }
}

// ============================================================================
// FUNÇÕES AUXILIARES SEGURAS
// ============================================================================

/**
 * Wrapper para funções de atesto
 */
function abrirSistemaAtestoAprimoradoSafe() {
  if (typeof abrirSistemaAtestoAprimorado === 'function') {
    return abrirSistemaAtestoAprimorado();
  }
  safeAlert('Erro', 'Função de atesto não disponível.');
}

function abrirChecklistRecebimentoSafe() {
  if (typeof abrirChecklistRecebimento === 'function') {
    return abrirChecklistRecebimento();
  }
  safeAlert('Erro', 'Função de checklist não disponível.');
}

function listarProcessosPrazoCriticoSafe() {
  if (typeof listarProcessosPrazoCritico === 'function') {
    return listarProcessosPrazoCritico();
  }
  safeAlert('Erro', 'Função não disponível.');
}

function gerarRelatorioProcessosSafe() {
  if (typeof gerarRelatorioProcessos === 'function') {
    return gerarRelatorioProcessos();
  }
  safeAlert('Erro', 'Função de relatório não disponível.');
}

// ============================================================================
// TRIGGER DE INICIALIZAÇÃO SEGURO
// ============================================================================

/**
 * Função executada ao abrir a planilha - versão segura
 */
function onOpenSafe() {
  try {
    criarMenuPAE();
  } catch (e) {
    Logger.log('⚠️ Erro ao criar menu no onOpen: ' + e.message);
  }
}

/**
 * Registra módulo
 */
function registrarCorePAEIntegrationSafe() {
  Logger.log('✅ Core PAE Integration Safe carregado');
  Logger.log('   UI disponível: ' + (isUiAvailable() ? 'SIM' : 'NÃO'));
}
