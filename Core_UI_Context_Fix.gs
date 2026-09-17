/**
 * @fileoverview Correção de Contexto UI - UNIAE CRE
 * @version 5.0.0
 *
 * Este arquivo fornece funções seguras para operações de UI que podem
 * falhar quando executadas fora do contexto adequado (triggers, web apps, etc.)
 *
 * PROBLEMA: SpreadsheetApp.getUi() lança erro quando chamado de:
 * - Triggers (onEdit, onOpen, time-based)
 * - Web Apps (doGet, doPost)
 * - Execuções via API
 *
 * SOLUÇÃO: Funções wrapper que verificam o contexto antes de executar
 */

'use strict';

// ============================================================================
// VERIFICAÇÃO DE CONTEXTO
// ============================================================================

/**
 * Verifica se estamos em um contexto onde UI está disponível
 * @returns {boolean}
 */
function isUiContextAvailable() {
  try {
    var ui = SpreadsheetApp.getUi();
    return ui !== null && typeof ui.alert === 'function';
  } catch (e) {
    return false;
  }
}

/**
 * Obtém UI de forma segura
 * @returns {GoogleAppsScript.Base.Ui|null}
 */
function getUiSafely() {
  try {
    return SpreadsheetApp.getUi();
  } catch (e) {
    Logger.log('[UI] Contexto UI não disponível: ' + e.message);
    return null;
  }
}

// ============================================================================
// DIÁLOGOS SEGUROS
// ============================================================================

/**
 * Mostra alert de forma segura
 * @param {string} title - Título do alert
 * @param {string} message - Mensagem
 * @param {GoogleAppsScript.Base.ButtonSet} [buttons] - Botões
 * @returns {GoogleAppsScript.Base.Button|null}
 */
function safeUiAlert(title, message, buttons) {
  var ui = getUiSafely();
  if (!ui) {
    Logger.log('[ALERT] ' + title + ': ' + message);
    return null;
  }

  try {
    if (buttons) {
      return ui.alert(title, message, buttons);
    } else if (message) {
      return ui.alert(title, message, ui.ButtonSet.OK);
    } else {
      return ui.alert(title);
    }
  } catch (e) {
    Logger.log('[ALERT ERROR] ' + title + ': ' + message + ' - ' + e.message);
    return null;
  }
}

/**
 * Mostra prompt de forma segura
 * @param {string} title - Título
 * @param {string} message - Mensagem
 * @param {GoogleAppsScript.Base.ButtonSet} [buttons] - Botões
 * @returns {GoogleAppsScript.Base.PromptResponse|null}
 */
function safeUiPrompt(title, message, buttons) {
  try {
    var ui = getUiSafely();
    if (!ui) {
      Logger.log('[PROMPT] ' + title + ': ' + message + ' (UI não disponível)');
      return null;
    }

    try {
      if (buttons) {
        return ui.prompt(title, message, buttons);
      } else {
        return ui.prompt(title, message, ui.ButtonSet.OK_CANCEL);
      }
    } catch (e) {
      Logger.log('[PROMPT ERROR] ' + e.message);
      return null;
    }
  } catch (error) {
    Logger.log("Erro em safeUiPrompt: " + error.message);
    throw error;
  }
}

/**
 * Mostra modal dialog de forma segura
 * @param {GoogleAppsScript.HTML.HtmlOutput} html - HTML a mostrar
 * @param {string} title - Título do modal
 * @returns {boolean} true se mostrou, false se não
 */
function safeShowModalDialog(html, title) {
  try {
    var ui = getUiSafely();
    if (!ui) {
      Logger.log('[MODAL] ' + title + ' - UI não disponível');
      return false;
    }

    try {
      ui.showModalDialog(html, title);
      return true;
    } catch (e) {
      Logger.log('[MODAL ERROR] ' + title + ': ' + e.message);
      return false;
    }
  } catch (error) {
    Logger.log("Erro em safeShowModalDialog: " + error.message);
    throw error;
  }
}

/**
 * Mostra sidebar de forma segura
 * @param {GoogleAppsScript.HTML.HtmlOutput} html - HTML a mostrar
 * @returns {boolean}
 */
function safeShowSidebar(html) {
  try {
    var ui = getUiSafely();
    if (!ui) {
      Logger.log('[SIDEBAR] UI não disponível');
      return false;
    }

    try {
      ui.showSidebar(html);
      return true;
    } catch (e) {
      Logger.log('[SIDEBAR ERROR] ' + e.message);
      return false;
    }
  } catch (error) {
    Logger.log("Erro em safeShowSidebar: " + error.message);
    throw error;
  }
}

/**
 * Mostra modeless dialog de forma segura
 * @param {GoogleAppsScript.HTML.HtmlOutput} html - HTML
 * @param {string} title - Título
 * @returns {boolean}
 */
function safeShowModelessDialog(html, title) {
  try {
    var ui = getUiSafely();
    if (!ui) {
      Logger.log('[MODELESS] ' + title + ' - UI não disponível');
      return false;
    }

    try {
      ui.showModelessDialog(html, title);
      return true;
    } catch (e) {
      Logger.log('[MODELESS ERROR] ' + title + ': ' + e.message);
      return false;
    }
  } catch (error) {
    Logger.log("Erro em safeShowModelessDialog: " + error.message);
    throw error;
  }
}

// ============================================================================
// MENUS SEGUROS
// ============================================================================

/**
 * Cria menu de forma segura
 * @param {string} name - Nome do menu
 * @returns {GoogleAppsScript.Base.Menu|null}
 */
function safeCreateMenu(name) {
  var ui = getUiSafely();
  if (!ui) {
    Logger.log('[MENU] Não foi possível criar menu: ' + name);
    return null;
  }

  try {
    return ui.createMenu(name);
  } catch (e) {
    Logger.log('[MENU ERROR] ' + name + ': ' + e.message);
    return null;
  }
}

/**
 * Adiciona menu ao UI de forma segura
 * @param {string} name - Nome do menu
 * @param {Array} items - Itens do menu [{name, functionName}]
 * @returns {boolean}
 */
function safeAddMenu(name, items) {
  var menu = safeCreateMenu(name);
  if (!menu) return false;

  try {
    items.forEach(function(item) {
      if (item.separator) {
        menu.addSeparator();
      } else if (item.submenu) {
        var submenu = SpreadsheetApp.getUi().createMenu(item.name);
        item.submenu.forEach(function(subitem) {
          if (subitem.separator) {
            submenu.addSeparator();
          } else {
            submenu.addItem(subitem.name, subitem.functionName);
          }
        });
        menu.addSubMenu(submenu);
      } else {
        menu.addItem(item.name, item.functionName);
      }
    });

    menu.addToUi();
    return true;
  } catch (e) {
    Logger.log('[MENU ERROR] Erro ao adicionar menu: ' + e.message);
    return false;
  }
}

// ============================================================================
// TOAST SEGURO
// ============================================================================

/**
 * Mostra toast de forma segura
 * @param {string} message - Mensagem
 * @param {string} [title] - Título
 * @param {number} [timeout] - Timeout em segundos
 * @returns {boolean}
 */
function safeShowToast(message, title, timeout) {
  try {
    try {
      var ss = getSS();
      if (ss) {
        ss.toast(message, title || 'Info', timeout || 3);
        return true;
      }
    } catch (e) {
      Logger.log('[TOAST] ' + (title || '') + ': ' + message);
    }
    return false;
  } catch (error) {
    Logger.log("Erro em safeShowToast: " + error.message);
    throw error;
  }
}

// ============================================================================
// WRAPPERS PARA FUNÇÕES EXISTENTES
// ============================================================================

/**
 * Wrapper para abrir dashboard de forma segura
 * @param {string} htmlFile - Nome do arquivo HTML
 * @param {string} title - Título do modal
 * @param {number} [width] - Largura
 * @param {number} [height] - Altura
 * @returns {boolean}
 */
function safeOpenHtmlDialog(htmlFile, title, width, height) {
  if (!isUiContextAvailable()) {
    Logger.log('[DIALOG] UI não disponível para: ' + title);
    return false;
  }

  try {
    var html = HtmlService.createHtmlOutputFromFile(htmlFile)
      .setWidth(width || 900)
      .setHeight(height || 600);

    return safeShowModalDialog(html, title);
  } catch (e) {
    Logger.log('[DIALOG ERROR] ' + title + ': ' + e.message);
    safeUiAlert('Erro', 'Não foi possível abrir: ' + title + '\n' + e.message);
    return false;
  }
}

/**
 * Wrapper para confirmação de ação
 * @param {string} title - Título
 * @param {string} message - Mensagem
 * @returns {boolean} true se confirmou, false se não
 */
function safeConfirm(title, message) {
  try {
    var ui = getUiSafely();
    if (!ui) {
      Logger.log('[CONFIRM] ' + title + ': ' + message + ' - Assumindo NÃO (UI indisponível)');
      return false;
    }

    try {
      var response = ui.alert(title, message, ui.ButtonSet.YES_NO);
      return response === ui.Button.YES;
    } catch (e) {
      Logger.log('[CONFIRM ERROR] ' + e.message);
      return false;
    }
  } catch (error) {
    Logger.log("Erro em safeConfirm: " + error.message);
    throw error;
  }
}

/**
 * Solicita input do usuário de forma segura
 * @param {string} title - Título
 * @param {string} message - Mensagem
 * @returns {string|null} Texto digitado ou null
 */
function safeInput(title, message) {
  var response = safeUiPrompt(title, message);
  if (!response) return null;

  try {
    var ui = SpreadsheetApp.getUi();
    if (response.getSelectedButton() === ui.Button.OK) {
      return response.getResponseText();
    }
  } catch (e) {
    Logger.log('[INPUT ERROR] ' + e.message);
  }
  return null;
}

// ============================================================================
// FUNÇÕES DE CONVENIÊNCIA GLOBAIS
// ============================================================================

// Aliases globais para facilitar uso
var UI = {
  isAvailable: isUiContextAvailable,
  get: getUiSafely,
  alert: safeUiAlert,
  prompt: safeUiPrompt,
  confirm: safeConfirm,
  input: safeInput,
  toast: safeShowToast,
  showModal: safeShowModalDialog,
  showSidebar: safeShowSidebar,
  showModeless: safeShowModelessDialog,
  createMenu: safeCreateMenu,
  addMenu: safeAddMenu,
  openDialog: safeOpenHtmlDialog
};

// ============================================================================
// TESTES
// ============================================================================

/**
 * Testa as funções de UI seguras
 */
function testUiContextFix() {
  try {
    Logger.log('═══════════════════════════════════════════════════════════');
    Logger.log('   TESTE DE CORREÇÃO DE CONTEXTO UI');
    Logger.log('═══════════════════════════════════════════════════════════');

    var results = [];

    // Teste 1: Verificar disponibilidade
    var available = isUiContextAvailable();
    results.push({
      test: 'isUiContextAvailable',
      result: typeof available === 'boolean',
      value: available
    });
    Logger.log('1. UI disponível: ' + available);

    // Teste 2: getUiSafely não lança erro
    var passed = true;
    try {
      var ui = getUiSafely();
      results.push({
        test: 'getUiSafely',
        result: true,
        value: ui !== null ? 'UI obtida' : 'null (esperado em alguns contextos)'
      });
    } catch (e) {
      passed = false;
      results.push({
        test: 'getUiSafely',
        result: false,
        error: e.message
      });
    }
    Logger.log('2. getUiSafely: ' + (passed ? 'OK' : 'FALHOU'));

    // Teste 3: safeShowToast não lança erro
    passed = true;
    try {
      safeShowToast('Teste de toast', 'Teste', 2);
      results.push({ test: 'safeShowToast', result: true });
    } catch (e) {
      passed = false;
      results.push({ test: 'safeShowToast', result: false, error: e.message });
    }
    Logger.log('3. safeShowToast: ' + (passed ? 'OK' : 'FALHOU'));

    // Teste 4: UI object está definido
    results.push({
      test: 'UI object',
      result: typeof UI === 'object' && typeof UI.alert === 'function',
      value: Object.keys(UI).join(', ')
    });
    Logger.log('4. UI object: ' + (typeof UI === 'object' ? 'OK' : 'FALHOU'));

    // Resumo
    var passedCount = results.filter(function(r) { return r.result; }).length;
    Logger.log('');
    Logger.log('Resultado: ' + passedCount + '/' + results.length + ' testes passaram');
    Logger.log('═══════════════════════════════════════════════════════════');

    return {
      success: passedCount === results.length,
      results: results
    };
  } catch (error) {
    Logger.log("Erro em testUiContextFix: " + error.message);
    throw error;
  }
}

Logger.log('✅ Core_UI_Context_Fix.gs carregado - Funções UI seguras disponíveis');
