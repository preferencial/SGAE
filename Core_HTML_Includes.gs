/**
 * UNIAE - Core HTML Includes
 * Helper para incluir arquivos HTML no Google Apps Script
 * @version 1.0.0
 * @created 2025-11-27
 */

/**
 * Função helper para incluir arquivos HTML
 * Uso: <?!= include('nome-do-arquivo'); ?>
 */
function include(filename) {
  if (!filename) {
    console.warn('⚠️ Tentativa de incluir arquivo com nome indefinido');
    return '<!-- Erro: Nome do arquivo não definido -->';
  }
  try {
    // Avalia o template para que scriptlets aninhados em partials
    // (ex: design-system.html) também sejam processados.
    return HtmlService.createTemplateFromFile(filename).evaluate().getContent();
  } catch (e) {
    console.warn(`⚠️ Arquivo não encontrado para include: ${filename}`);
    return `<!-- Erro: Arquivo ${filename} não encontrado -->`;
  }
}

/**
 * Compacta dados estáticos para uso em data URLs (como logos base64)
 * Remove todos os espaços em branco para otimizar o tamanho
 * Uso: <?!= includeInlineData('BrandLogoBase64'); ?>
 */
function includeInlineData(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent().replace(/\s+/g, '');
}

/**
 * Inclui o Design System completo (CSS)
 * Uso: <?!= includeDesignSystem(); ?>
 */
function includeDesignSystem() {
  try {
    const css = HtmlService.createHtmlOutputFromFile('design-system').getContent();
    const animations = HtmlService.createHtmlOutputFromFile('design-system-animations').getContent();
    const performance = HtmlService.createHtmlOutputFromFile('design-system-performance').getContent();

    return `<style>
${css}
${animations}
${performance}
</style>`;
  } catch (error) {
    console.error('Erro ao incluir Design System:', error);
    return '<!-- Design System não disponível -->';
  }
}

/**
 * Inclui o sistema de Error Handling
 * Uso: <?!= includeErrorHandling(); ?>
 * @deprecated Arquivo GAS_error-handling.html foi removido - use tratamento inline
 */
function includeErrorHandling() {
  // Retorna código de tratamento de erro básico inline
  return `
    window.handleError = function(error, context) {
      console.error('[' + (context || 'App') + ']', error);
      if (typeof showToast === 'function') {
        showToast('Erro: ' + (error.message || error), 'error');
      }
    };
  `;
}

/**
 * Inclui as utilidades de validação
 * Uso: <?!= includeValidationUtils(); ?>
 * @deprecated Arquivo GAS_validation-utils.html foi removido - use validação inline
 */
function includeValidationUtils() {
  try {
    // Retorna código de validação básico inline
    return `
      window.validateRequired = function(value, fieldName) {
        if (!value || (typeof value === 'string' && !value.trim())) {
          return { valid: false, message: fieldName + ' é obrigatório' };
        }
        return { valid: true };
      };
      window.validateEmail = function(email) {
        var re = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
        return { valid: re.test(email), message: 'Email inválido' };
      };
    `;
  } catch (error) {
    Logger.log("Erro em includeValidationUtils: " + error.message);
    throw error;
  }
}

/**
 * Inclui performance optimization
 * Uso: <?!= includePerformanceOptimization(); ?>
 */
function includePerformanceOptimization() {
  try {
    return HtmlService.createHtmlOutputFromFile('performance-optimization').getContent();
  } catch (error) {
    Logger.log("Erro em includePerformanceOptimization: " + error.message);
    throw error;
  }
}

/**
 * Cria uma página HTML completa com todos os recursos
 * @param {string} title - Título da página
 * @param {string} bodyContent - Conteúdo HTML do body
 * @param {Object} options - Opções adicionais
 * @returns {HtmlOutput}
 */
function createCompletePage(title, bodyContent, options = {}) {
  try {
    const {
      includeDesignSystem: includeDS = true,
      includeErrorHandling: includeEH = true,
      includeValidation = true,
      includePerformance = false,
      additionalCSS = '',
      additionalJS = ''
    } = options;

    let html = `<!DOCTYPE html>
  <html lang="pt-BR">
  <head>
    <base target="_top">
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">

    <!-- Material Symbols -->
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet">
  `;

    if (includeDS) {
      html += `  ${includeDesignSystem()}\n`;
    }

    if (additionalCSS) {
      html += `  <style>${additionalCSS}</style>\n`;
    }

    html += `</head>
  <body>
    ${bodyContent}
  `;

    if (includeEH) {
      html += `  ${includeErrorHandling()}\n`;
    }

    if (includeValidation) {
      html += `  ${includeValidationUtils()}\n`;
    }

    if (includePerformance) {
      html += `  <script>${includePerformanceOptimization()}</script>\n`;
    }

    if (additionalJS) {
      html += `  <script>${additionalJS}</script>\n`;
    }

    html += `</body>
  </html>`;

    return HtmlService.createHtmlOutput(html)
      .setTitle(title)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (error) {
    Logger.log("Erro em createCompletePage: " + error.message);
    throw error;
  }
}

/**
 * Exemplo de uso do createCompletePage
 */
function exemploUsoPaginaCompleta() {
  const bodyContent = `
    <div class="container" style="padding: 40px 20px;">
      <div class="card">
        <div class="card-header">
          <h1 class="card-title">Bem-vindo ao UNIAE</h1>
          <p class="card-subtitle">Sistema de Gestão Escolar</p>
        </div>
        <div class="card-body">
          <p>Esta é uma página de exemplo criada com o sistema completo.</p>
          <button class="btn btn-primary" onclick="testarFeedback()">
            Testar Feedback
          </button>
        </div>
      </div>
    </div>
  `;

  const additionalJS = `
    function testarFeedback() {
      window.feedback.showSuccess('Sucesso!', 'O sistema está funcionando perfeitamente!');
    }
  `;

  return createCompletePage(
    'UNIAE - Exemplo',
    bodyContent,
    {
      includeDesignSystem: true,
      includeErrorHandling: true,
      includeValidation: true,
      additionalJS: additionalJS
    }
  );
}

/**
 * Serve uma página HTML do projeto
 * @param {string} filename - Nome do arquivo HTML
 * @returns {HtmlOutput}
 */
function serveHtmlPage(filename) {
  try {
    // Validar filename
    if (!filename || typeof filename !== 'string' || filename.trim() === '') {
      Logger.log('⚠️ serveHtmlPage: filename inválido ou não fornecido');
      // Retornar página de erro amigável
      return HtmlService.createHtmlOutput(
        '<html><head><title>Erro</title></head>' +
        '<body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">' +
        '<h1>⚠️ Página não encontrada</h1>' +
        '<p>O arquivo solicitado não foi especificado ou é inválido.</p>' +
        '<p><a href="?page=index">Voltar ao início</a></p>' +
        '</body></html>'
      ).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }

    try {
      return HtmlService.createHtmlOutputFromFile(filename)
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    } catch (e) {
      Logger.log('❌ Erro ao carregar arquivo HTML: ' + filename + ' - ' + e.message);
      return HtmlService.createHtmlOutput(
        '<html><head><title>Erro</title></head>' +
        '<body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">' +
        '<h1>❌ Erro ao carregar página</h1>' +
        '<p>Não foi possível carregar o arquivo: <strong>' + filename + '</strong></p>' +
        '<p>Erro: ' + e.message + '</p>' +
        '<p><a href="?page=index">Voltar ao início</a></p>' +
        '</body></html>'
      ).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }
  } catch (error) {
    Logger.log("Erro em serveHtmlPage: " + error.message);
    throw error;
  }
}

/**
 * Exemplo de roteamento de páginas (não usar como doGet principal)
 * Use doGet() de _INIT_Bootstrap.gs como entrada principal
 * @private
 */
function _htmlIncludes_routePage(e) {
  e = e || {};
  e.parameter = e.parameter || {};

  const page = e.parameter.page || 'login';

  switch(page) {
    case 'exemplo':
      return exemploUsoPaginaCompleta();
    case 'login':
      return serveHtmlPage('UI_Login_Enhanced_v2');
    case 'dashboard':
      return serveHtmlPage('UI_HTML_Dashboard');
    default:
      return serveHtmlPage('UI_Login_Enhanced_v2');
  }
}
