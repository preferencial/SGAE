/**
 * @fileoverview Bootstrap - Inicialização do Projeto
 * @version 4.0.0
 * @description Resolve conflitos e garante inicialização correta do sistema
 * 
 * Dependências:
 * - Core_UI_Safe.gs (getSafeUi, safeAlert, safePrompt)
 */

'use strict';

// Usa funções de Core_UI_Safe.gs (getSafeUi, safeAlert, safePrompt)


/**
 * ============================================================================
 * Função de entrada simplificada para Web App
 * NOTA: Use doGet() de _INIT_Main.gs como entrada principal (mais completa)
 * Esta função é mantida como fallback
 * ============================================================================
 * @private
 */
function _bootstrap_doGet(e) {
  try {
    // Verificar se há parâmetro de página específica
    if (e && e.parameter && e.parameter.page) {
      return serveSpecificPage(e.parameter.page);
    }
    
    // Servir página padrão (Dashboard ou Login)
    return serveDefaultPage();
    
  } catch (error) {
    return serveErrorPage(error);
  }
}

/**
 * Serve página específica baseada no parâmetro
 * @param {string} pageName - Nome da página
 * @returns {HtmlOutput}
 */
function serveSpecificPage(pageName) {
  try {
    const pageMap = {
      'login': 'UI_Login',
      'dashboard': 'UI_Dashboard_Intuitivo',
      'mobile': 'UI_HTML_Mobile_FIXED',
      'index': 'UI_Login_Enhanced_v2'
    };
  
    const templateName = pageMap[pageName] || 'UI_Login';
  
    try {
      return HtmlService.createTemplateFromFile(templateName)
        .evaluate()
        .setTitle('UNIAE - Sistema de Gestão')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .addMetaTag('viewport', 'width=device-width, initial-scale=1');
    } catch (error) {
      console.error('Erro ao carregar página:', templateName, error);
      return serveErrorPage(error);
    }
  } catch (error) {
    Logger.log("Erro em serveSpecificPage: " + error.message);
    throw error;
  }
}

/**
 * Serve página padrão (verifica autenticação)
 * @returns {HtmlOutput}
 */
function serveDefaultPage() {
  try {
    // Verificar se usuário já está autenticado
    if (checkAuthentication()) {
      return serveSpecificPage('dashboard');
    }

    // Se não estiver autenticado, servir login
    return HtmlService.createTemplateFromFile('UI_Login_Enhanced_v2')
      .evaluate()
      .setTitle('UNIAE - Login')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  } catch (error) {
    console.error('Erro ao servir página padrão:', error);
    // Fallback para login simples
    try {
      return HtmlService.createTemplateFromFile('UI_Login')
        .evaluate()
        .setTitle('UNIAE - Login')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .addMetaTag('viewport', 'width=device-width, initial-scale=1');
    } catch (fallbackError) {
      return serveErrorPage(fallbackError);
    }
  }
}

/**
 * Verifica se usuário está autenticado
 * @returns {boolean}
 */
function checkAuthentication() {
  try {
    try {
      // 1. Tentar usar AuthService (método preferencial)
      if (typeof AuthService !== 'undefined' && AuthService.getSession) {
        var session = AuthService.getSession();
        return session !== null;
      }

      // 2. Verificar se há função global de autenticação
      if (typeof verificarAutenticacao === 'function') {
        return verificarAutenticacao();
      }
    
      // 3. Verificar Cache (fallback se AuthService não estiver acessível mas cache existir)
      try {
        var cache = CacheService.getUserCache();
        if (cache && cache.get('user_session')) {
          return true;
        }
      } catch (e) {
        // Ignora erro de cache
      }

      // 4. Verificar propriedades do usuário (legado)
      const userProps = PropertiesService.getUserProperties();
      const authToken = userProps.getProperty('auth_token');
    
      return authToken !== null;
    } catch (error) {
      console.warn('Erro ao verificar autenticação:', error);
      return false;
    }
  } catch (error) {
    Logger.log("Erro em checkAuthentication: " + error.message);
    throw error;
  }
}

/**
 * Serve página de erro
 * @param {Error} error - Erro ocorrido
 * @returns {HtmlOutput}
 */
function serveErrorPage(error) {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>UNIAE - Erro</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
          }
          .error-container {
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            max-width: 500px;
            text-align: center;
          }
          .error-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
          }
          h1 {
            color: #e74c3c;
            margin-bottom: 1rem;
          }
          .error-message {
            background: #fee;
            padding: 1rem;
            border-radius: 8px;
            margin: 1rem 0;
            font-family: monospace;
            font-size: 0.9rem;
            text-align: left;
            overflow-x: auto;
          }
          .btn {
            display: inline-block;
            padding: 0.75rem 1.5rem;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            margin-top: 1rem;
            transition: background 0.3s;
          }
          .btn:hover {
            background: #5568d3;
          }
        </style>
      </head>
      <body>
        <div class="error-container">
          <div class="error-icon">⚠️</div>
          <h1>Erro ao Carregar Sistema</h1>
          <p>Ocorreu um erro ao inicializar o sistema UNIAE.</p>
          <div class="error-message">
            ${error.message || 'Erro desconhecido'}
          </div>
          <p>Por favor, tente novamente ou contate o administrador.</p>
          <a href="?" class="btn">Tentar Novamente</a>
        </div>
      </body>
      </html>
    `;
  
    return HtmlService.createHtmlOutput(html)
      .setTitle('UNIAE - Erro')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (error) {
    Logger.log("Erro em serveErrorPage: " + error.message);
    throw error;
  }
}

// NOTA: Função include() centralizada em Core_HTML_Includes.gs
// As funções includeCSS() e includeJS() abaixo são auxiliares específicas do Bootstrap

/**
 * Serve arquivos CSS inline
 */
function includeCSS(filename) {
  try {
    const content = HtmlService.createHtmlOutputFromFile(filename).getContent();
    return `<style>${content}</style>`;
  } catch (error) {
    console.error('Erro ao incluir CSS:', filename, error);
    return `<!-- CSS ${filename} não encontrado -->`;
  }
}

/**
 * Serve arquivos JS inline
 */
function includeJS(filename) {
  try {
    const content = HtmlService.createHtmlOutputFromFile(filename).getContent();
    return `<script>${content}</script>`;
  } catch (error) {
    console.error('Erro ao incluir JS:', filename, error);
    return `<!-- JS ${filename} não encontrado -->`;
  }
}

/**
 * ============================================================================
 * FUNÇÕES DE COMPATIBILIDADE
 * ============================================================================
 * Garantem que funções essenciais existam mesmo se não definidas em outros arquivos
 */

/**
 * Obtém planilha de forma segura
 */
if (typeof getSheet !== 'function') {
  function getSheet(sheetName) {
    try {
      const ss = getSS();
      return ss.getSheetByName(sheetName);
    } catch (error) {
      console.error('Erro ao obter planilha:', sheetName, error);
      return null;
    }
  }
}

/**
 * Obtém dados de planilha de forma segura
 */
if (typeof getSafeDataRange !== 'function') {
  function getSafeDataRange(sheet, maxRows, maxCols) {
    try {
      try {
        if (!sheet) return [[]];
      
        const lastRow = sheet.getLastRow();
        const lastCol = sheet.getLastColumn();
      
        if (lastRow === 0 || lastCol === 0) return [[]];
      
        const numRows = maxRows ? Math.min(lastRow, maxRows) : lastRow;
        const numCols = maxCols ? Math.min(lastCol, maxCols) : lastCol;
      
        return sheet.getRange(1, 1, numRows, numCols).getValues();
      } catch (error) {
        console.error('Erro ao obter dados:', error);
        return [[]];
      }
    } catch (error) {
      Logger.log("Erro em getSafeDataRange: " + error.message);
      throw error;
    }
  }
}

/**
 * Gera ID único
 */
if (typeof generateId !== 'function') {
  function generateId() {
    return Utilities.getUuid();
  }
}

/**
 * Obtém ou cria planilha
 */
if (typeof getOrCreateSheetSafe !== 'function') {
  function getOrCreateSheetSafe(sheetName, customHeaders) {
    try {
      try {
        const ss = getSS();
        let sheet = ss.getSheetByName(sheetName);
      
        if (!sheet) {
          sheet = ss.insertSheet(sheetName);
        
          // Adicionar headers se fornecidos
          if (customHeaders && Array.isArray(customHeaders) && customHeaders.length > 0) {
            sheet.getRange(1, 1, 1, customHeaders.length).setValues([customHeaders]);
            sheet.getRange(1, 1, 1, customHeaders.length).setFontWeight('bold');
          }
        }
      
        return sheet;
      } catch (error) {
        console.error('Erro ao obter/criar planilha:', sheetName, error);
        throw error;
      }
    } catch (error) {
      Logger.log("Erro em getOrCreateSheetSafe: " + error.message);
      throw error;
    }
  }
}

/**
 * Adiciona linha em planilha
 */
if (typeof addSheetRow !== 'function') {
  function addSheetRow(sheetName, rowData) {
    try {
      try {
        try {
          const sheet = getOrCreateSheetSafe(sheetName);
          sheet.appendRow(rowData);
      
          return {
            success: true,
            rowIndex: sheet.getLastRow(),
            message: 'Linha adicionada com sucesso'
          };
        } catch (error) {
          console.error('Erro ao adicionar linha:', sheetName, error);
          return {
            success: false,
            error: error.message
          };
        }
      } catch (error) {
        Logger.log("Erro em addSheetRow: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em addSheetRow: " + error.message);
      throw error;
    }
  }
}

/**
 * Obtém dados de planilha
 */
if (typeof getSheetData !== 'function') {
  function getSheetData(sheetName, maxRows) {
    try {
      const sheet = getSheet(sheetName);
      if (!sheet) {
        return {
          success: false,
          count: 0,
          headers: [],
          data: []
        };
      }
      
      const data = getSafeDataRange(sheet, maxRows);
      
      return {
        success: true,
        count: data.length - 1, // Excluir header
        headers: data.length > 0 ? data[0] : [],
        data: data.length > 1 ? data.slice(1) : []
      };
    } catch (error) {
      console.error('Erro ao obter dados:', sheetName, error);
      return {
        success: false,
        count: 0,
        headers: [],
        data: [],
        error: error.message
      };
    }
  }
}

/**
 * Resposta padrão de API
 */
if (typeof apiResponse !== 'function') {
  function apiResponse(success, data, message) {
    try {
      return {
        success: success,
        data: data || null,
        message: message || '',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      Logger.log("Erro em apiResponse: " + error.message);
      throw error;
    }
  }
}

/**
 * ============================================================================
 * FUNÇÕES DE LOGGING COMPATÍVEIS
 * ============================================================================
 */

if (typeof logInfo !== 'function') {
  function logInfo(message, metadata) {
    try {
      Logger.log('[INFO] ' + message + ' ' + (metadata ? JSON.stringify(metadata) : ''));
    } catch (error) {
      Logger.log("Erro em logInfo: " + error.message);
      throw error;
    }
  }
}

if (typeof logWarn !== 'function') {
  function logWarn(message, metadata) {
    try {
      try {
        Logger.log('[WARN] ' + message + ' ' + (metadata ? JSON.stringify(metadata) : ''));
      } catch (error) {
        Logger.log("Erro em logWarn: " + error.message);
        throw error;
      }
    } catch (error) {
      Logger.log("Erro em logWarn: " + error.message);
      throw error;
    }
  }
}

if (typeof logError !== 'function') {
  function logError(message, metadata) {
    try {
      Logger.log('[ERROR] ' + message + ' ' + (metadata ? JSON.stringify(metadata) : ''));
    } catch (error) {
      Logger.log("Erro em logError: " + error.message);
      throw error;
    }
  }
}

/**
 * ============================================================================
 * INICIALIZAÇÃO DO MENU
 * ============================================================================
 */

/**
 * Menu auxiliar do Bootstrap (não usar como trigger principal)
 * Use onOpen() de Code.gs como trigger principal
 * @private
 */
function _bootstrap_createMenu() {
  try {
    try {
      const ui = getSafeUi();
      if (!ui) {
        return;
      }
    
      ui.createMenu('🏢 UNIAE')
        .addItem('📊 Dashboard', 'openDashboard')
        .addItem('📋 Notas Fiscais', 'openNotasFiscais')
        .addItem('🚚 Entregas', 'openEntregas')
        .addSeparator()
        .addItem('⚙️ Configurações', 'openConfiguracoes')
        .addItem('📖 Ajuda', 'openAjuda')
        .addToUi();
    } catch (error) {
      // Silencioso em caso de erro
    }
  } catch (error) {
    Logger.log("Erro em _bootstrap_createMenu: " + error.message);
    throw error;
  }
}

/**
 * Abre dashboard
 */
function openDashboard() {
  try {
    const html = HtmlService.createTemplateFromFile('UI_HTML_Dashboard')
      .evaluate()
      .setWidth(1200)
      .setHeight(800);
    
    safeShowModalDialog(html, 'UNIAE - Dashboard');
  } catch (error) {
    safeUiAlert('Erro', 'Erro ao abrir dashboard: ' + error.message);
  }
}

/**
 * Abre gestão de notas fiscais
 */
function openNotasFiscais() {
  try {
    try {
      const html = HtmlService.createHtmlOutput('<h1>Notas Fiscais</h1><p>Em desenvolvimento...</p>')
        .setWidth(800)
        .setHeight(600);
    
      safeShowModalDialog(html, 'UNIAE - Notas Fiscais');
    } catch (error) {
      safeUiAlert('Erro', error.message);
    }
  } catch (error) {
    Logger.log("Erro em openNotasFiscais: " + error.message);
    throw error;
  }
}

/**
 * Abre gestão de entregas
 */
function openEntregas() {
  try {
    try {
      const html = HtmlService.createHtmlOutput('<h1>Entregas</h1><p>Em desenvolvimento...</p>')
        .setWidth(800)
        .setHeight(600);
    
      safeShowModalDialog(html, 'UNIAE - Entregas');
    } catch (error) {
      safeUiAlert('Erro', error.message);
    }
  } catch (error) {
    Logger.log("Erro em openEntregas: " + error.message);
    throw error;
  }
}

/**
 * Abre configurações
 */
function openConfiguracoes() {
  safeUiAlert('Info', 'Configurações em desenvolvimento');
}

/**
 * Abre ajuda
 */
function openAjuda() {
  const html = HtmlService.createHtmlOutput(`
    <h2>Ajuda - Sistema UNIAE</h2>
    <p><strong>Versão:</strong> 2.0.0</p>
    <p><strong>Descrição:</strong> Sistema de Gestão de Notas Fiscais e Entregas</p>
    <h3>Funcionalidades:</h3>
    <ul>
      <li>Gestão de Notas Fiscais</li>
      <li>Controle de Entregas</li>
      <li>Registro de Recusas e Glosas</li>
      <li>Dashboard com Métricas</li>
    </ul>
    <p>Para mais informações, consulte a documentação ou contate o suporte.</p>
  `)
    .setWidth(500)
    .setHeight(400);
  
  safeShowModalDialog(html, 'UNIAE - Ajuda');
}

/**
 * ============================================================================
 * HEALTH CHECK
 * ============================================================================
 */

/**
 * Verifica saúde do sistema
 */
function healthCheck() {
  try {
    const checks = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      checks: {}
    };
  
    // Verificar acesso à planilha
    try {
      const ss = getSS();
      checks.checks.spreadsheet = {
        status: 'ok',
        id: ss.getId(),
        name: ss.getName()
      };
    } catch (error) {
      checks.checks.spreadsheet = {
        status: 'error',
        error: error.message
      };
      checks.status = 'unhealthy';
    }
  
    // Verificar usuário
    try {
      const user = Session.getActiveUser().getEmail();
      checks.checks.user = {
        status: 'ok',
        email: user
      };
    } catch (error) {
      checks.checks.user = {
        status: 'error',
        error: error.message
      };
    }
  
    // Verificar quotas
    try {
      const quotaRemaining = MailApp.getRemainingDailyQuota();
      checks.checks.quotas = {
        status: 'ok',
        emailQuota: quotaRemaining
      };
    } catch (error) {
      checks.checks.quotas = {
        status: 'warning',
        error: error.message
      };
    }
  
    return checks;
  } catch (error) {
    Logger.log("Erro em healthCheck: " + error.message);
    throw error;
  }
}

/**
 * ============================================================================
 * INICIALIZAÇÃO DO MÓDULO
 * ============================================================================
 * Logs removidos para produção - use Logger.log() apenas quando necessário
 */
