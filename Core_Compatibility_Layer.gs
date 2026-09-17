/**
 * @fileoverview Camada de Compatibilidade - UNIAE CRE
 * @version 5.0.0
 *
 * Garante compatibilidade com código legado mapeando funções antigas para novas.
 * Este arquivo deve ser carregado após todos os módulos principais.
 */

'use strict';

// ============================================================================
// ALIASES DE AUTENTICAÇÃO
// Agora delegam para AuthService (Core_Auth_Unified.gs)
// ============================================================================

/** @deprecated Use AuthService.login() ou api_auth_login() */
function login(email, senha) {
  if (typeof AuthService !== 'undefined') return AuthService.login(email, senha);
  if (typeof authLogin === 'function') return authLogin(email, senha);
  return { success: false, error: 'Sistema de autenticação não disponível' };
}

/** @deprecated Use AuthService.logout() ou api_auth_logout() */
function logout() {
  if (typeof AuthService !== 'undefined') return AuthService.logout();
  if (typeof authLogout === 'function') return authLogout();
  return { success: false, error: 'Sistema de autenticação não disponível' };
}

/** @deprecated Use AuthService.getSession() */
function getCurrentUser() {
  if (typeof AuthService !== 'undefined') return AuthService.getSession();
  if (typeof authGetCurrentUser === 'function') return authGetCurrentUser();
  return null;
}

/** @deprecated Use AuthService.hasPermission() */
function checkPermission(permission) {
  if (typeof AuthService !== 'undefined') {
    var session = AuthService.getSession();
    return AuthService.hasPermission(session, permission);
  }
  if (typeof authCheckPermission === 'function') return authCheckPermission(permission);
  return false;
}

/** @deprecated Use AuthService.listUsers() */
function listUsers() {
  if (typeof AuthService !== 'undefined') return AuthService.listUsers();
  if (typeof authListUsers === 'function') return authListUsers();
  return [];
}

// ============================================================================
// ALIASES DE CRUD
// ============================================================================

/** @deprecated Use getSheetByName() do Core_Sheet_Accessor */
// function getSheet(sheetName) {
//   if (typeof getSheetByName === 'function') {
//     return getSheetByName(sheetName);
//   }
//   try {
//     var ss = getSS();
//     return ss ? ss.getSheetByName(sheetName) : null;
//   } catch (e) {
//     return null;
//   }
// }

/** @deprecated Use readSheetOptimized() */
function lerDados(sheetName) {
  if (typeof readSheetOptimized === 'function') {
    return readSheetOptimized(sheetName);
  }
  var sheet = getSheet(sheetName);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  return data.length > 1 ? data.slice(1) : [];
}

/** @deprecated Use writeRowsOptimized() */
function escreverDados(sheetName, dados) {
  try {
    if (typeof writeRowsOptimized === 'function') {
      return writeRowsOptimized(sheetName, dados);
    }
    var sheet = getSheet(sheetName);
    if (!sheet || !dados || !dados.length) return false;
    sheet.getRange(sheet.getLastRow() + 1, 1, dados.length, dados[0].length).setValues(dados);
    return true;
  } catch (error) {
    Logger.log("Erro em escreverDados: " + error.message);
    throw error; // Re-lança para tratamento superior
  }
}

// ============================================================================
// ALIASES DE VALIDAÇÃO
// ============================================================================

/** @deprecated Use validateEmail() do Core_Validation_Utils */
function validarEmailLegado(email) {
  return typeof validateEmail === 'function' ? validateEmail(email) :
         /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** @deprecated Use validateCNPJ() do Core_Validation_Utils */
function validarCNPJLegado(cnpj) {
  return typeof validateCNPJ === 'function' ? validateCNPJ(cnpj) : true;
}

/** @deprecated Use validateCPF() do Core_Validation_Utils */
function validarCPFLegado(cpf) {
  return typeof validateCPF === 'function' ? validateCPF(cpf) : true;
}

// ============================================================================
// ALIASES DE UI
// ============================================================================

/** @deprecated Use getSafeUi() */
function getUiSafe() {
  return typeof getSafeUi === 'function' ? getSafeUi() : null;
}

/** @deprecated Use safeAlert() */
function alertaSafe(message) {
  if (typeof safeAlert === 'function') {
    return safeAlert(message);
  }
  try {
    SpreadsheetApp.getUi().alert(message);
  } catch (e) {
    Logger.log('Alert: ' + message);
  }
}

/** @deprecated Use safeToast() */
function toastSafe(message, title, timeout) {
  if (typeof safeToast === 'function') {
    return safeToast(message, title, timeout);
  }
  try {
    getSS().toast(message, title || 'Info', timeout || 3);
  } catch (e) {
    Logger.log('Toast: ' + (title || '') + ' - ' + message);
  }
}

// ============================================================================
// ALIASES DE LOGGING
// ============================================================================

/** @deprecated Use AppLogger.log() */
function logInfo(message, context) {
  if (typeof AppLogger !== 'undefined' && AppLogger.log) {
    return AppLogger.log(message, context);
  }
  Logger.log('[INFO] ' + message);
}

/** @deprecated Use AppLogger.error() */
function logError(message, error) {
  if (typeof AppLogger !== 'undefined' && AppLogger.error) {
    return AppLogger.error(message, error);
  }
  Logger.log('[ERROR] ' + message + (error ? ': ' + error : ''));
}

/** @deprecated Use AppLogger.warn() */
function logWarning(message) {
  if (typeof AppLogger !== 'undefined' && AppLogger.warn) {
    return AppLogger.warn(message);
  }
  Logger.log('[WARN] ' + message);
}

// ============================================================================
// ALIASES DE CACHE
// ============================================================================

/** @deprecated Use CACHE.get() */
function getCacheValue(key) {
  try {
    if (typeof CACHE !== 'undefined' && CACHE.get) {
      return CACHE.get(key);
    }
    try {
      return CacheService.getScriptCache().get(key);
    } catch (e) {
      return null;
    }
  } catch (error) {
    Logger.log("Erro em getCacheValue: " + error.message);
    throw error;
  }
}

/** @deprecated Use CACHE.set() */
function setCacheValue(key, value, ttl) {
  if (typeof CACHE !== 'undefined' && CACHE.set) {
    return CACHE.set(key, value, ttl);
  }
  try {
    CacheService.getScriptCache().put(key, JSON.stringify(value), ttl || 600);
    return true;
  } catch (e) {
    return false;
  }
}

// ============================================================================
// ALIASES DE FORMATAÇÃO
// ============================================================================

/** @deprecated Use formatCurrency() */
function formatarMoedaLegado(valor) {
  try {
    if (typeof formatCurrency === 'function') {
      return formatCurrency(valor);
    }
    return 'R$ ' + (valor || 0).toFixed(2).replace('.', ',');
  } catch (error) {
    Logger.log("Erro em formatarMoedaLegado: " + error.message);
    throw error;
  }
}

/** @deprecated Use formatDate() */
function formatarDataLegado(data) {
  try {
    if (typeof formatDate === 'function') {
      return formatDate(data);
    }
    if (!data) return '';
    var d = new Date(data);
    return d.toLocaleDateString('pt-BR');
  } catch (error) {
    Logger.log("Erro em formatarDataLegado: " + error.message);
    throw error;
  }
}

// ============================================================================
// ALIASES DE NOTAS FISCAIS
// ============================================================================

/** @deprecated Use api_listarNotasFiscais() */
function listarNotas(filtros) {
  return typeof api_listarNotasFiscais === 'function' ? api_listarNotasFiscais(filtros) : [];
}

/** @deprecated Use api_buscarNF() */
function buscarNota(numero) {
  return typeof api_buscarNF === 'function' ? api_buscarNF(numero) : null;
}

/** @deprecated Use api_criarNF() */
function criarNota(dados) {
  return typeof api_criarNF === 'function' ? api_criarNF(dados) : null;
}

// ============================================================================
// ALIASES DE PROCESSO SEI
// ============================================================================

/** @deprecated Use api_criarProcessoSEI() */
function criarProcesso(dados) {
  return typeof api_criarProcessoSEI === 'function' ? api_criarProcessoSEI(dados) : null;
}

/** @deprecated Use api_buscarProcessoSEI() */
function buscarProcesso(numero) {
  return typeof api_buscarProcessoSEI === 'function' ? api_buscarProcessoSEI(numero) : null;
}

/** @deprecated Use api_listarProcessos() */
function listarProcessos(filtros) {
  return typeof api_listarProcessos === 'function' ? api_listarProcessos(filtros) : [];
}

// ============================================================================
// ALIASES DE EMAIL
// ============================================================================

/** @deprecated Use enviarEmail() do Core_Email_Config */
function enviarEmailLegado(destinatario, assunto, corpo) {
  if (typeof enviarEmail === 'function') {
    return enviarEmail(destinatario, assunto, corpo);
  }
  try {
    MailApp.sendEmail(destinatario, assunto, corpo);
    return true;
  } catch (e) {
    return false;
  }
}

// ============================================================================
// FUNÇÕES UTILITÁRIAS LEGADAS
// ============================================================================

/** @deprecated Use generateUUID() */
function gerarId() {
  if (typeof generateUUID === 'function') {
    return generateUUID();
  }
  return Utilities.getUuid();
}

/** @deprecated Use safeGet() */
function obterValorSeguro(obj, caminho, padrao) {
  try {
    if (typeof safeGet === 'function') {
      return safeGet(obj, caminho, padrao);
    }
    if (!obj) return padrao;
    var partes = caminho.split('.');
    var atual = obj;
    for (var i = 0; i < partes.length; i++) {
      if (atual === null || atual === undefined) return padrao;
      atual = atual[partes[i]];
    }
    return atual !== undefined ? atual : padrao;
  } catch (error) {
    Logger.log("Erro em obterValorSeguro: " + error.message);
    throw error;
  }
}

// ============================================================================
// REGISTRO DE COMPATIBILIDADE
// ============================================================================

/**
 * Verifica se todas as funções de compatibilidade estão funcionando
 * @returns {Object} Status de cada alias
 */
function verificarCompatibilidade() {
  try {
    var status = {
      timestamp: new Date().toISOString(),
      aliases: {
        auth: {
          login: typeof login === 'function',
          logout: typeof logout === 'function',
          getCurrentUser: typeof getCurrentUser === 'function',
          checkPermission: typeof checkPermission === 'function',
          listUsers: typeof listUsers === 'function'
        },
        crud: {
          getSheet: typeof getSheet === 'function',
          lerDados: typeof lerDados === 'function',
          escreverDados: typeof escreverDados === 'function'
        },
        validacao: {
          validarEmailLegado: typeof validarEmailLegado === 'function',
          validarCNPJLegado: typeof validarCNPJLegado === 'function',
          validarCPFLegado: typeof validarCPFLegado === 'function'
        },
        ui: {
          getUiSafe: typeof getUiSafe === 'function',
          alertaSafe: typeof alertaSafe === 'function',
          toastSafe: typeof toastSafe === 'function'
        },
        logging: {
          logInfo: typeof logInfo === 'function',
          logError: typeof logError === 'function',
          logWarning: typeof logWarning === 'function'
        },
        cache: {
          getCacheValue: typeof getCacheValue === 'function',
          setCacheValue: typeof setCacheValue === 'function'
        }
      }
    };

    // Contar aliases funcionando
    var total = 0;
    var funcionando = 0;

    for (var categoria in status.aliases) {
      for (var alias in status.aliases[categoria]) {
        total++;
        if (status.aliases[categoria][alias]) funcionando++;
      }
    }

    status.resumo = {
      total: total,
      funcionando: funcionando,
      percentual: Math.round((funcionando / total) * 100) + '%'
    };

    return status;
  } catch (error) {
    Logger.log("Erro em verificarCompatibilidade: " + error.message);
    throw error;
  }
}

// ============================================================================
// BRIDGES DE INTEGRACAO DA SUPERFICIE PUBLICADA
// ============================================================================

/**
 * Normaliza respostas antigas de autenticação para as telas publicadas.
 * A sessão é lida do AuthService; nenhuma identidade é inventada no cliente.
 */
function _sgae_compat_session_() {
  try {
    return (typeof AuthService !== 'undefined' && AuthService.getSession) ? AuthService.getSession() : null;
  } catch (e) {
    Logger.log('Sessão SGAE indisponível: ' + e.message);
    return null;
  }
}

function _sgae_compat_user_(session) {
  if (!session) return null;
  return {
    id: session.id || '',
    email: session.email || '',
    nome: session.nome || session.email || '',
    perfil: session.perfil || session.tipoKey || session.tipo || '',
    tipo: session.tipo || '',
    role: session.tipoKey || session.perfil || '',
    crn: session.crn || '',
    admin: session.admin === true
  };
}

function api_getUsuarioLogado() {
  var session = _sgae_compat_session_();
  return { success: !!session, usuario: _sgae_compat_user_(session) };
}

function obterSessaoAtual() {
  var session = _sgae_compat_session_();
  return { success: !!session, usuario: _sgae_compat_user_(session), sessao: session || null };
}

/** Retorna métricas com o contrato consumido por AdvancedDashboard/UI_Dashboard. */
function getDashboardMetricsComplete() {
  var result = null;
  try {
    if (typeof _getDashboardMetricsComplete_WebApp === 'function') result = _getDashboardMetricsComplete_WebApp();
    if (result && result.success && result.data) return result;

    var basic = (typeof getDashboardMetricsUnificado === 'function') ? getDashboardMetricsUnificado() : null;
    if (basic && basic.success) {
      var data = basic.data || {};
      return {
        success: true,
        data: {
          notasFiscais: Number(data.notasFiscais || data.nfs || 0),
          entregas: Number(data.entregas || 0),
          recusas: Number(data.recusas || 0),
          glosas: Number(data.glosas || 0),
          valorTotalNFs: Number(data.valorTotalNFs || 0),
          valorTotalGlosas: Number(data.valorTotalGlosas || 0),
          fornecedores: Number(data.fornecedores || 0),
          alertas: [],
          resumoExecutivo: { statusGeral: 'REGULAR', pontuacaoGeral: 0 }
        }
      };
    }
    return { success: false, data: null, error: (basic && basic.error) || 'Métricas indisponíveis' };
  } catch (e) {
    return { success: false, data: null, error: e.message };
  }
}

function _sgae_compat_records_(sheetName) {
  try {
    var ss = getSS();
    var sheet = ss && ss.getSheetByName(sheetName);
    if (!sheet || sheet.getLastRow() < 2 || sheet.getLastColumn() < 1) return [];
    var values = sheet.getDataRange().getValues();
    var headers = values[0].map(function(h) { return String(h || '').trim(); });
    return values.slice(1).map(function(row, index) {
      var obj = { _rowIndex: index + 2 };
      headers.forEach(function(header, column) { obj[header] = row[column]; });
      return obj;
    }).filter(function(obj) {
      return Object.keys(obj).some(function(k) { return k !== '_rowIndex' && obj[k] !== '' && obj[k] !== null; });
    });
  } catch (e) {
    Logger.log('Leitura SGAE (' + sheetName + ') falhou: ' + e.message);
    return [];
  }
}

function _sgae_compat_value_(record, names, fallback) {
  for (var i = 0; i < names.length; i++) {
    if (record && record[names[i]] !== undefined && record[names[i]] !== '') return record[names[i]];
  }
  return fallback;
}

function _sgae_compat_update_(sheetName, rowIndex, updates) {
  var ss = getSS();
  var sheet = ss && ss.getSheetByName(sheetName);
  if (!sheet || !rowIndex) return false;
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  Object.keys(updates).forEach(function(key) {
    var index = headers.indexOf(key);
    if (index >= 0) sheet.getRange(rowIndex, index + 1).setValue(updates[key]);
  });
  return true;
}

/** Configuração persistente usada pelo processamento e pelo painel administrativo. */
function getProcessingConfig() {
  var defaults = { environment: 'production', batchSize: 50, maxRetries: 3, updatedAt: null };
  try {
    var raw = PropertiesService.getScriptProperties().getProperty('SGAE_PROCESSING_CONFIG');
    if (raw) {
      var parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        Object.keys(parsed).forEach(function(key) { defaults[key] = parsed[key]; });
      }
    }
  } catch (e) {
    Logger.log('Configuração de processamento inválida: ' + e.message);
  }
  return defaults;
}

function setProcessingConfig(config) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    throw new Error('Configuração de processamento inválida');
  }
  var current = getProcessingConfig();
  Object.keys(config).forEach(function(key) { current[key] = config[key]; });
  current.updatedAt = new Date().toISOString();
  PropertiesService.getScriptProperties().setProperty('SGAE_PROCESSING_CONFIG', JSON.stringify(current));
  return true;
}

function listarEscolasDisponiveis() {
  var candidates = ['Unidades_Escolares', 'Escolas', 'Unidades Escolares'];
  var names = {};
  candidates.some(function(sheetName) {
    var records = _sgae_compat_records_(sheetName);
    if (!records.length) return false;
    records.forEach(function(record) {
      var status = String(_sgae_compat_value_(record, ['Status', 'status', 'Ativo', 'ativo'], 'ATIVO')).toUpperCase();
      if (/INATIV|BLOQUEAD|^0$|^NAO$/.test(status)) return;
      var name = String(_sgae_compat_value_(record, ['Nome', 'Nome_Escola', 'Escola', 'Unidade_Escolar', 'Name', 'nome'], '')).trim();
      if (name) names[name] = true;
    });
    return Object.keys(names).length > 0;
  });
  return Object.keys(names).sort();
}

function obterMetricasWorkflows() {
  var nfs = _sgae_compat_records_('Workflow_NotasFiscais').concat(_sgae_compat_records_('Notas_Fiscais'));
  var recebimentos = _sgae_compat_records_('Workflow_Recebimentos').concat(_sgae_compat_records_('Entregas'));
  var analises = _sgae_compat_records_('Workflow_Analises').concat(_sgae_compat_records_('Analises'));
  var porStatus = {};
  nfs.forEach(function(nf) {
    var status = String(_sgae_compat_value_(nf, ['status', 'Status', 'Status_NF'], 'PENDENTE')).toUpperCase();
    porStatus[status] = (porStatus[status] || 0) + 1;
  });
  var valorTotal = nfs.reduce(function(total, nf) {
    return total + Number(_sgae_compat_value_(nf, ['valor_total', 'Valor_Total', 'valorTotal'], 0) || 0);
  }, 0);
  var valorAprovado = analises.reduce(function(total, item) {
    return total + Number(_sgae_compat_value_(item, ['valor_aprovado', 'valorAprovado'], 0) || 0);
  }, 0);
  var valorGlosa = analises.reduce(function(total, item) {
    return total + Number(_sgae_compat_value_(item, ['valor_glosa', 'valorGlosa'], 0) || 0);
  }, 0);
  var pendentes = nfs.filter(function(nf) {
    return /PENDENTE|ENVIADA|RECEBIDA|RECEBIMENTO|CONFERENCIA/.test(String(_sgae_compat_value_(nf, ['status', 'Status', 'Status_NF'], '')).toUpperCase());
  }).length;
  var taxaAprovacao = analises.length ? Math.round((analises.filter(function(a) { return /APROV|CONFORME/.test(String(_sgae_compat_value_(a, ['decisao', 'status', 'Status'], '')).toUpperCase()); }).length / analises.length) * 10000) / 100 : 0;
  var taxaGlosa = analises.length ? Math.round((analises.filter(function(a) { return Number(_sgae_compat_value_(a, ['valor_glosa', 'valorGlosa'], 0) || 0) > 0; }).length / analises.length) * 10000) / 100 : 0;
  return {
    success: true,
    metricas: {
      nfs: { total: nfs.length, valorTotal: valorTotal, porStatus: porStatus },
      recebimentos: { total: recebimentos.length },
      analises: { total: analises.length, valorAprovado: valorAprovado, valorGlosa: valorGlosa },
      indicadores: { taxaAprovacao: taxaAprovacao, taxaGlosa: taxaGlosa, nfsPendentes: pendentes, mediaRecebimentosPorNF: nfs.length ? Math.round((recebimentos.length / nfs.length) * 100) / 100 : 0 }
    }
  };
}

function obterAtividadesRecentes(limit) {
  var atividades = [];
  [['Workflow_NotasFiscais', 'NF', '📄'], ['Notas_Fiscais', 'NF', '📄'], ['Workflow_Recebimentos', 'RECEBIMENTO', '📦'], ['Entregas', 'RECEBIMENTO', '📦'], ['Workflow_Analises', 'ANALISE', '✅']].forEach(function(source) {
    _sgae_compat_records_(source[0]).forEach(function(record) {
      atividades.push({
        tipo: source[1],
        icone: source[2],
        descricao: String(_sgae_compat_value_(record, ['descricao', 'produto', 'Produto', 'numero_nf', 'Numero_NF', 'id', 'ID'], source[1])),
        data: _sgae_compat_value_(record, ['data', 'data_criacao', 'data_emissao', 'Data_Emissao', 'CreatedAt', 'Timestamp'], null),
        status: _sgae_compat_value_(record, ['status', 'Status', 'Status_NF'], ''),
        valor: Number(_sgae_compat_value_(record, ['valor_total', 'Valor_Total', 'valor'], 0) || 0)
      });
    });
  });
  atividades.sort(function(a, b) { return new Date(b.data || 0).getTime() - new Date(a.data || 0).getTime(); });
  return atividades.slice(0, Math.max(1, Number(limit) || 10));
}

function gerarRelatorioContabil() {
  var nfs = _sgae_compat_records_('Notas_Fiscais').concat(_sgae_compat_records_('Workflow_NotasFiscais'));
  var glosas = _sgae_compat_records_('Glosas');
  var valorTotalNFs = nfs.reduce(function(total, nf) { return total + Number(_sgae_compat_value_(nf, ['valor_total', 'Valor_Total', 'valor'], 0) || 0); }, 0);
  var valorTotalGlosas = glosas.reduce(function(total, glosa) { return total + Number(_sgae_compat_value_(glosa, ['valor', 'Valor', 'Valor_Glosado', 'valor_glosa'], 0) || 0); }, 0);
  return { success: true, relatorio: { valorTotalNFs: valorTotalNFs, valorTotalGlosas: valorTotalGlosas, valorTotalAprovado: Math.max(0, valorTotalNFs - valorTotalGlosas) } };
}

function gerarRelatorioConferencia() {
  var rows = _sgae_compat_records_('Controle_Conferencia');
  var etapas = { soma: 'Status_Soma', pdgp: 'Status_PDGP', consulta_nf: 'Status_Consulta_NF', atesto: 'Status_Atesto' };
  var detalhes = {};
  Object.keys(etapas).forEach(function(key) { detalhes[key] = { concluidos: 0, pendentes: 0, com_problema: 0 }; });
  rows.forEach(function(row) {
    Object.keys(etapas).forEach(function(key) {
      var status = String(row[etapas[key]] || 'PENDENTE').toUpperCase();
      if (status === 'CONCLUIDO') detalhes[key].concluidos++;
      else if (status === 'COM_PROBLEMA') detalhes[key].com_problema++;
      else detalhes[key].pendentes++;
    });
  });
  var concluidos = rows.filter(function(row) { return String(row.Status_Geral || '').toUpperCase() === 'CONCLUIDO' || Object.keys(etapas).every(function(key) { return String(row[etapas[key]] || '').toUpperCase() === 'CONCLUIDO'; }); }).length;
  var emConferencia = rows.filter(function(row) { return /CONFER|PENDENTE/.test(String(row.Status_Geral || '').toUpperCase()); }).length;
  var atrasados = rows.filter(function(row) { return Number(row.Dias_Pendente || 0) > 0 || (row.Prazo_Limite && new Date(row.Prazo_Limite).getTime() < Date.now()); }).length;
  return { total_controles: rows.length, concluidos: concluidos, em_conferencia: emConferencia, atrasados: atrasados, detalhes_por_etapa: detalhes };
}

function atualizarEtapaConferencia(idControle, etapa, status, responsavel, observacoes) {
  if (!idControle || !etapa) return false;
  var key = String(etapa).replace(/^Status_/, '').toLowerCase();
  var fieldMap = { soma: 'Status_Soma', pdgp: 'Status_PDGP', consulta_nf: 'Status_Consulta_NF', consulta: 'Status_Consulta_NF', atesto: 'Status_Atesto' };
  var statusField = fieldMap[key] || ('Status_' + String(etapa));
  var dateField = statusField.replace(/^Status_/, 'Data_');
  var responsibleField = statusField.replace(/^Status_/, 'Responsavel_');
  var noteField = statusField.replace(/^Status_/, 'Observacoes_');
  var row = _sgae_compat_records_('Controle_Conferencia').filter(function(item) { return String(item.ID_Controle || item.ID || '') === String(idControle); })[0];
  if (!row) return false;
  return _sgae_compat_update_('Controle_Conferencia', row._rowIndex, (function() { var updates = {}; updates[statusField] = status || 'CONCLUIDO'; updates[dateField] = new Date(); updates[responsibleField] = responsavel || ''; updates[noteField] = observacoes || ''; return updates; })());
}

function registrarOcorrencia(idControle, tipo, unidadeEC, item, motivo) {
  if (!idControle || !tipo || !motivo) return false;
  var rows = _sgae_compat_records_('Controle_Conferencia');
  var row = rows.filter(function(itemRow) { return String(itemRow.ID_Controle || itemRow.ID || '') === String(idControle); })[0];
  if (!row) return false;
  var stamp = new Date().toISOString();
  var detalhe = [stamp, tipo, unidadeEC || '', item || '', motivo].join(' | ');
  var anterior = String(row.Detalhes_Ocorrencias || '').trim();
  var ok = _sgae_compat_update_('Controle_Conferencia', row._rowIndex, { Detalhes_Ocorrencias: anterior ? anterior + '\n' + detalhe : detalhe, Registro_Proprio_Ocorrencias: 'SIM' });
  if (!ok) return false;
  try {
    var ss = getSS();
    var sheet = ss.getSheetByName('Workflow_Ocorrencias') || ss.insertSheet('Workflow_Ocorrencias');
    if (sheet.getLastRow() === 0) sheet.appendRow(['ID', 'Data', 'ID_Controle', 'Tipo', 'Unidade_Escolar', 'Item', 'Motivo']);
    sheet.appendRow([typeof gerarId === 'function' ? gerarId('OCOR') : 'OCOR_' + Date.now(), new Date(), idControle, tipo, unidadeEC || '', item || '', motivo]);
  } catch (e) {
    Logger.log('Registro detalhado da ocorrência não persistido: ' + e.message);
  }
  return true;
}

function processarFormularioGlosa(dados) {
  try {
    dados = dados || {};
    var nfId = dados.notaFiscalId || dados.nota_fiscal_id || dados.notaFiscal;
    var records = _sgae_compat_records_('Notas_Fiscais').concat(_sgae_compat_records_('Workflow_NotasFiscais'));
    var nf = records.filter(function(item) { return String(item.ID || item.id || item.Numero_NF || item.numero_nf || '') === String(nfId); })[0];
    if (nf) nfId = nf.ID || nf.id || nfId;
    var resultado = (typeof api_glosa_registrar === 'function') ? api_glosa_registrar({
      nota_fiscal_id: nfId,
      nota_fiscal_numero: nf ? (nf.Numero_NF || nf.numero_nf || '') : String(dados.notaFiscal || ''),
      fornecedor_nome: dados.fornecedor || '',
      tipo: dados.tipoGlosa || dados.tipo || 'QUALIDADE',
      valor: Number(dados.valorGlosa || dados.valor || 0),
      justificativa: dados.motivo || '',
      evidencias: dados.observacoes || '',
      item_nome: dados.produto || ''
    }) : { success: false, error: 'Serviço de glosas não disponível' };
    return resultado && resultado.success ? { sucesso: true, id: resultado.data && resultado.data.id, message: resultado.message } : { sucesso: false, erro: (resultado && (resultado.error || resultado.message)) || 'Não foi possível registrar a glosa' };
  } catch (e) {
    return { sucesso: false, erro: e.message };
  }
}

// Log de carregamento
Logger.log('✅ Core_Compatibility_Layer.gs carregado - Aliases de compatibilidade disponíveis');
