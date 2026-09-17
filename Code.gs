/**
 * @fileoverview Code.gs - Arquivo Principal do Sistema UNIAE
 * @version 6.0.0
 *
 * Sistema de Gestão de Alimentação Escolar - UNIAE/CRE-PP
 * Conferência e Atesto de Notas Fiscais de Gêneros Alimentícios
 *
 * Dependências:
 * - Core_UI_Safe.gs (getSafeUi, safeAlert, safePrompt)
 * - Core_Constants.gs (constantes do sistema)
 * - Core_System_Init.gs (inicialização centralizada)
 *
 * @author UNIAE CRE Team
 * @updated 2025-12-08
 */

'use strict';

// Usa funções de Core_UI_Safe.gs (getSafeUi, safeAlert, safePrompt)

/**
 * UNIAE - Funções de Utilidade para Design System
 */

// NOTA: Função include() centralizada em Core_HTML_Includes.gs para evitar duplicação

/**
 * Exemplo de função para servir uma página com o Design System
 */
function showDesignSystemDemo() {
  try {
    var html = HtmlService.createTemplateFromFile('ExemploDesignSystem');
    return html.evaluate()
      .setTitle('UNIAE - Design System')
      .setWidth(1200)
      .setHeight(800);
  } catch (error) {
    Logger.log("Erro em showDesignSystemDemo: " + error.message);
    throw error;
  }
}

/**
 * Função principal para criar menus no Google Sheets
 * Sistema de Atesto de Gêneros Alimentícios - UNIAE/CRE-PP
 *
 * IMPORTANTE: Esta é a ÚNICA função onOpen que deve ser usada como trigger.
 * Todas as outras foram renomeadas para evitar conflitos.
 */
function onOpen() {
  try {
    try {
      var ui = SpreadsheetApp.getUi();

      // MENU RÁPIDO - Menos cliques, mais ação!
      ui.createMenu('🚀 UNIAE Rápido')
        .addItem('📊 Abrir Dashboard', 'abrirDashboardIntuitivo')
        .addSeparator()
        .addItem('➕ Nova NF', 'abrirNovaNFDireto')
        .addItem('🚚 Registrar Entrega', 'abrirEntregaDireto')
        .addItem('✅ Atestar NFs', 'abrirAtestarDireto')
        .addItem('❌ Registrar Problema', 'abrirProblemaDireto')
        .addToUi();

      // Menu Completo (para quem precisa de mais opções)
      ui.createMenu('📋 Sistema Completo')
        .addItem('🚀 Abrir Interface Principal', 'abrirInterfaceAtesto')
        .addItem('⚙️ Inicializar Sistema', 'inicializarSistemaAtesto')
        .addSeparator()
        .addItem('📝 Novo Processo de Atesto', 'novoProcessoAtestoMenu')
        .addItem('📦 Registrar Recebimento', 'registrarRecebimentoMenu')
        .addItem('✅ Análise da Comissão', 'analiseComissaoMenu')
        .addSeparator()
        .addItem('📊 Dashboard Completo', 'abrirDashboardAtesto')
        .addItem('📄 Gerar Relatório SEI', 'gerarRelatorioSEIMenu')
        .addSeparator()
        .addItem('ℹ️ Sobre o Sistema', 'sobreSistemaAtesto')
        .addToUi();

      // Menu de Workflows UNIAE - Gêneros Alimentícios
      ui.createMenu('📱 Workflows')
        .addItem('📊 Dashboard', 'abrirWorkflowDashboard')
        .addSeparator()
        .addItem('📋 Fornecedor: Lançar NF', 'abrirWorkflowFornecedor')
        .addItem('📦 Escola: Registrar Recebimento', 'abrirWorkflowRepresentante')
        .addItem('⚖️ Analista: Validar e Pagar', 'abrirWorkflowAnalista')
        .addSeparator()
        .addItem('📄 Relatório Contábil', 'mostrarRelatorioContabil')
        .addItem('🔍 Diagnóstico Workflows', 'executarDiagnosticoWorkflows')
        .addToUi();

      // Menu de Ferramentas e Administração
      ui.createMenu('🔧 Ferramentas')
        .addItem('📖 Ver Design System', 'showDesignSystemDemo')
        .addItem('🎨 Showcase', 'showShowcase')
        .addSeparator()
        .addSubMenu(ui.createMenu('⚙️ Administração')
          .addItem('🆕 Criar Estrutura', 'criarEstruturaBancoDados')
          .addItem('🔄 Atualizar Estrutura', 'atualizarEstruturaMenu')
          .addItem('✅ Verificar Integridade', 'verificarIntegridadeMenu')
          .addItem('📦 Executar Migrations', 'runMigrations'))
        .addSubMenu(ui.createMenu('📊 Monitoramento')
          .addItem('🏥 Health Check', 'runHealthCheck')
          .addItem('📈 Métricas', 'showMetricsReport')
          .addItem('🔍 Diagnóstico Completo', 'runDiagnostics'))
        .addSubMenu(ui.createMenu('🧪 Testes')
          .addItem('▶️ Executar Testes Core', 'runCoreTests')
          .addItem('🔬 Verificar Integridade Dados', 'runDataIntegrityCheck'))
        .addSubMenu(ui.createMenu('📱 Setup Workflows')
          .addItem('🚀 Inicializar Sistema', 'inicializarSistema')
          .addItem('📦 Montar Workflows', 'montarWorkflowsCompleto')
          .addItem('🔄 Resetar Workflows', 'resetarWorkflows')
          .addItem('✅ Validar Dados', 'validarDadosTesteWorkflows'))
        .addSeparator()
        .addItem('🔍 Diagnóstico do Sistema', 'diagnosticoSistemaUX')
        .addItem('👥 Gerenciar Usuários', 'gerenciarUsuariosUI')
        .addToUi();

      // Menu adicional do módulo de Alimentação Escolar.
      // O módulo não pode declarar outro onOpen(), pois todos os arquivos
      // .gs compartilham o namespace global do Apps Script.
      _addMenuAdministracaoAE_(ui);

    } catch (e) {
      // Silencioso em execução background
      Logger.log('onOpen executado em contexto sem UI: ' + e.message);
    }
  } catch (error) {
    Logger.log("Erro em onOpen: " + error.message);
    throw error;
  }
}

/**
 * Mostra o showcase do design system
 */
function showShowcase() {
  try {
    var html = HtmlService.createTemplateFromFile('ShowcaseDesignSystem');
    return html.evaluate()
      .setTitle('UNIAE - Showcase')
      .setWidth(1400)
      .setHeight(900);
  } catch (error) {
    Logger.log("Erro em showShowcase: " + error.message);
    throw error;
  }
}

// ============================================================================
// FUNÇÕES DE MONITORAMENTO E DIAGNÓSTICO
// ============================================================================

/**
 * Exibe relatório de métricas
 */
function showMetricsReport() {
  try {
    if (typeof Metrics === 'undefined') {
      safeAlert('Erro', 'Módulo de métricas não disponível');
      return;
    }

    var report = Metrics.generatePerformanceReport();
    Logger.log('═══════════════════════════════════════════════════════════');
    Logger.log('   RELATÓRIO DE MÉTRICAS');
    Logger.log('═══════════════════════════════════════════════════════════');
    Logger.log(JSON.stringify(report, null, 2));
  
    safeAlert('Métricas', 
      'Total de operações: ' + report.summary.totalOperations + '\n' +
      'Tempo total: ' + report.summary.totalTimeMs + 'ms\n' +
      'Tempo médio: ' + report.summary.avgTimeMs + 'ms\n\n' +
      'Veja o log para detalhes completos.');
  } catch (error) {
    Logger.log("Erro em showMetricsReport: " + error.message);
    throw error;
  }
}

/**
 * Executa verificação de integridade de dados
 */
function runDataIntegrityCheck() {
  try {
    if (typeof DataIntegrity === 'undefined') {
      safeAlert('Erro', 'Módulo de integridade não disponível');
      return;
    }

    var report = DataIntegrity.runFullAudit();
  
    Logger.log('═══════════════════════════════════════════════════════════');
    Logger.log('   RELATÓRIO DE INTEGRIDADE DE DADOS');
    Logger.log('═══════════════════════════════════════════════════════════');
    Logger.log(JSON.stringify(report, null, 2));

    var message = 'Saúde: ' + report.summary.health + '\n' +
      'Violações: ' + report.summary.totalViolations + '\n' +
      'Duplicatas: ' + report.summary.totalDuplicates + '\n' +
      'Tempo: ' + report.duration + 'ms';

    safeAlert('Integridade de Dados', message);
  } catch (error) {
    Logger.log("Erro em runDataIntegrityCheck: " + error.message);
    throw error;
  }
}

/**
 * Inicializa o sistema com todos os módulos
 */
function initializeFullSystem() {
  if (typeof SystemInit !== 'undefined') {
    return SystemInit.initialize({ runMigrations: true });
  } else if (typeof initializeSystem === 'function') {
    return initializeSystem();
  }
  return { success: false, error: 'Módulo de inicialização não disponível' };
}

// ============================================================================
// WEB APP ENTRY POINTS
// ============================================================================

/**
 * DESATIVADO: Função doGet movida para _INIT_Main.gs
 * 
 * A implementação canônica do doGet está em _INIT_Main.gs que inclui:
 * - Verificação de estrutura do banco
 * - Autenticação e sessões
 * - Roteamento completo de páginas
 * - Tratamento de erros robusto
 * 
 * @deprecated Use _INIT_Main.gs como ponto de entrada principal
 */
/*
// RENOMEADO: doGet canonico fica em _INIT_Main.gs (evita colisao global).
function _code_legacy_doGet(e) {
  // Extrair parametros da URL
  var params = e && e.parameter ? e.parameter : {};
  var token = params.tok;
  var page = params.page;
  
  // Validar token se presente
  if (token && typeof isAuthenticatedByToken === 'function' && isAuthenticatedByToken(token)) {
    // Usuario autenticado via token

  // Inicializa sistema se necessário
  if (typeof SystemInit !== 'undefined' && !SystemInit.isReady()) {
    SystemInit.initialize();
  }

  var page = e && e.parameter && e.parameter.page ? e.parameter.page : 'index';
  
  try {
        var template = HtmlService.createTemplateFromFile(page);
        return template.evaluate()
          .setTitle('UNIAE - Sistema de Alimentação Escolar')
          .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  } catch (err) {
    // Fallback para página principal
    var template = HtmlService.createTemplateFromFile('index');
    return template.evaluate()
      .setTitle('UNIAE - Sistema de Alimentação Escolar')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
}
*/

/**
 * Ponto de entrada para Web App (POST)
 * @param {Object} e - Evento da requisição
 * @returns {TextOutput}
 */
function doPost(e) {
  try {
    try {
      // Validação de entrada
      if (!e || !e.postData || !e.postData.contents) {
        return _jsonResponse({ success: false, error: 'Requisição inválida' });
      }
    
      var data;
      try {
        data = JSON.parse(e.postData.contents);
      } catch (parseError) {
        return _jsonResponse({ success: false, error: 'JSON inválido' });
      }
    
      var action = data.action;
      var params = data.params || {};

      // Única ação pública. Todas as demais exigem o bearer token no corpo,
      // validado em ScriptProperties (o deployment executa como proprietário).
      if (action !== 'login') {
        var token = String(data.token || params.token || params.sessaoId || '').trim();
        if (!token || typeof isAuthenticatedByToken !== 'function' || !isAuthenticatedByToken(token)) {
          return _jsonResponse({ success: false, code: 'UNAUTHORIZED', error: 'Sessão ausente, inválida ou expirada.' });
        }
      }

      // Roteamento de ações
      var result;
      switch (action) {
        case 'login':
          if (typeof AUTH !== 'undefined' && AUTH.login) {
            result = AUTH.login(params.email, params.senha);
          } else if (typeof api_auth_login === 'function') {
            result = api_auth_login(params.email, params.senha);
          } else {
            result = { success: false, error: 'Sistema de autenticação não disponível' };
          }
          break;
        
        case 'logout':
          if (typeof AUTH !== 'undefined' && AUTH.logout) {
            result = AUTH.logout(params.sessaoId);
          } else if (typeof api_auth_logout === 'function') {
            result = api_auth_logout(params.sessaoId);
          } else {
            result = { success: true, message: 'Logout realizado' };
          }
          break;
        
        case 'healthCheck':
          result = typeof runHealthCheck === 'function' 
            ? runHealthCheck() 
            : { success: true, status: 'OK', timestamp: new Date().toISOString() };
          break;
        
        default:
          result = { success: false, error: 'Ação não reconhecida: ' + action };
      }

      return _jsonResponse(result);

    } catch (err) {
      AppLogger.error('Erro em doPost', err);
      return _jsonResponse({
        success: false,
        error: err.message || 'Erro interno do servidor'
      });
    }
  } catch (error) {
    Logger.log("Erro em doPost: " + error.message);
    throw error;
  }
}

/**
 * Helper para criar resposta JSON
 * @private
 */
function _jsonResponse(data) {
  try {
    try {
      return ContentService.createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON);
    } catch (error) {
      Logger.log("Erro em _jsonResponse: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em _jsonResponse: " + error.message);
    throw error;
  }
}
