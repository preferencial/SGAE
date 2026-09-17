/**
 * @fileoverview Configuração Centralizada do Sistema (Core Config)
 * @version 6.0.0
 * @description Fonte única de verdade para todas as configurações do sistema.
 * Substitui Config.gs e Core_Config_Unified.gs.
 */

'use strict';

// ============================================================================
// 1. SYSTEM CONFIGURATION
// ============================================================================

var SYSTEM_CONFIG = {
  INFO: {
    NAME: 'Sistema de Gestão de Alimentação Escolar',
    SHORT_NAME: 'UNIAE CRE',
    VERSION: '6.0.0',
    ORGANIZATION: 'CRE-PP/UNIAE',
    DESCRIPTION: 'Conferência e Atesto de Notas Fiscais de Gêneros Alimentícios',
    ENVIRONMENT: 'production' // 'development', 'staging', 'production'
  },

  /**
   * Configuração de Fuso Horário
   * @see Core_Timezone_Manager.gs para implementação completa
   */
  TIMEZONE: {
    /** Fuso horário canônico para exibição (Brasília) */
    CANONICAL: 'America/Sao_Paulo',
    /** Fuso horário para armazenamento interno */
    STORAGE: 'UTC',
    /** Offset padrão em horas (sem DST) */
    DEFAULT_OFFSET: -3,
    /** Locale para formatação */
    LOCALE: 'pt-BR'
  },

  EMAILS: (function() {
    var email = PropertiesService.getScriptProperties().getProperty('SYSTEM_EMAIL') || '';
    return {
      PRIMARY:       email,
      SUPPORT:       email,
      NOTIFICATIONS: email
    };
  }()),

  LIMITS: {
    EXECUTION_TIME_MS: 300000,      // 5 minutos (margem de segurança)
    EMAILS_PER_DAY: 100,
    URL_FETCH_PER_DAY: 20000,
    CACHE_SIZE_MB: 25,
    DAILY_QUOTA_LIMIT: 20000,
    QUOTA_WARNING_THRESHOLD: 15000
  },

  PERFORMANCE: {
    BATCH_SIZE: 100,
    CACHE_TTL_SECONDS: 600,         // 10 minutos
    MAX_ROWS_PER_READ: 1000,
    PAGE_SIZE_DEFAULT: 50,
    ENABLE_CACHE: true,
    ENABLE_QUOTA_CHECK: true
  },

  UI: {
    TOAST_DURATION: 3,
    MODAL_WIDTH: 900,
    MODAL_HEIGHT: 600,
    SIDEBAR_WIDTH: 300
  },

  // =========================================================================
  // CACHE KEYS (Performance Otimizada) - Intervenção 1/38
  // =========================================================================
  CACHE_KEYS: {
    // Cardápios e Nutrição
    CARDAPIO_SEMANAL: 'cache_cardapio_semanal_',
    CARDAPIO_BASE: 'cache_cardapio_base_',
    ITENS_ALIMENTARES: 'cache_itens_alimentares',
    GRUPOS_NUTRICIONAIS: 'cache_grupos_nutricionais',
    METAS_NUTRICIONAIS: 'cache_metas_nutricionais',
    CARDAPIOS_ESPECIAIS: 'cache_cardapios_especiais_',
    ALUNOS_NAE: 'cache_alunos_nae_',

    // Fornecedores e Pagamentos
    FORNECEDORES_ATIVOS: 'cache_fornecedores_ativos',
    CERTIDOES_VALIDAS: 'cache_certidoes_validas_',
    SALDOS_EMPENHO: 'cache_saldos_empenho_',
    NFS_PENDENTES: 'cache_nfs_pendentes_',
    PAGAMENTOS_MES: 'cache_pagamentos_mes_',

    // Operacional
    ESCOLAS_CRE: 'cache_escolas_cre_',
    ENTREGAS_DIA: 'cache_entregas_dia_',
    ESTOQUE_ESCOLA: 'cache_estoque_escola_',

    // Sistema
    USUARIO_SESSAO: 'cache_usuario_sessao_',
    PERMISSOES_USUARIO: 'cache_permissoes_',
    CONFIG_SISTEMA: 'cache_config_sistema',
    DASHBOARD_RESUMO: 'cache_dashboard_resumo_'
  }
};

// ============================================================================
// 2. SHEET NAMES (SCHEMA) - Sincronizado com Core_Schema_Definition.gs
// ============================================================================

var SHEET_CONFIG = {
  // =========================================================================
  // DOMÍNIO: CARDÁPIOS E NUTRIÇÃO
  // =========================================================================
  CARDAPIOS_BASE: 'Cardapios_Base',
  CARDAPIOS_SEMANAIS: 'Cardapios_Semanais',
  ITENS_CARDAPIO: 'Itens_Cardapio',
  GRUPOS_NUTRICIONAIS: 'Grupos_Nutricionais',
  FICHAS_TECNICAS: 'Fichas_Tecnicas',
  METAS_NUTRICIONAIS: 'Metas_Nutricionais',
  CARDAPIOS_ESPECIAIS: 'Cardapios_Especiais',
  ALUNOS_NAE: 'Alunos_Necessidades_Especiais',
  AVALIACOES_NUTRICIONISTA: 'Avaliacoes_Nutricionista',
  SUBSTITUICOES: 'Substituicoes_Alimentos',
  PARECERES_TECNICOS: 'Pareceres_Tecnicos',

  // =========================================================================
  // DOMÍNIO: FORNECEDORES E PAGAMENTOS
  // =========================================================================
  FORNECEDORES: 'Fornecedores',
  CERTIDOES: 'Certidoes_Fornecedores',
  CONTRATOS_EMPENHO: 'Contratos_Empenho',
  EMPENHOS: 'Empenhos',
  NOTAS_FISCAIS: 'NotasFiscais',
  PAGAMENTOS: 'Pagamentos',
  GLOSAS: 'Glosas',

  // =========================================================================
  // DOMÍNIO: OPERACIONAL E ENTREGAS
  // =========================================================================
  UNIDADES_ESCOLARES: 'Unidades_Escolares',
  ENTREGAS: 'Entregas',
  RECEBIMENTOS: 'Recebimento_Generos',
  RECUSAS: 'Recusas',
  OCORRENCIAS_DESCARTE: 'Ocorrencias_Descarte',
  REPOSICOES: 'Reposicoes_Alimentos',
  ESTOQUE_ESCOLAR: 'Estoque_Escolar',

  // =========================================================================
  // DOMÍNIO: PROCESSOS E WORKFLOW
  // =========================================================================
  PROCESSOS_ATESTO: 'Processos_Atesto',
  CONFERENCIA: 'Controle_Conferencia',
  COMISSAO_MEMBROS: 'Comissao_Membros',
  COMISSAO_ATESTACOES: 'Comissao_Atestacoes',

  // =========================================================================
  // DOMÍNIO: ADMINISTRAÇÃO E SISTEMA
  // =========================================================================
  USUARIOS: 'Usuarios',
  SESSOES: 'Sessoes',
  AUDITORIA: 'Auditoria_Log',
  LOGS: 'System_Logs',
  CONFIGURACOES: 'Configuracoes',
  TEXTOS: 'Textos_Padrao',

  // =========================================================================
  // DOMÍNIO: PLANEJAMENTO E REFERÊNCIA
  // =========================================================================
  PDGP: 'PDGP',
  PDGA: 'PDGA',
  PRODUTOS: 'Produtos',
  PRECOS_HISTORICO: 'Precos_Historico'
};

// ============================================================================
// 3. ENUMS & CONSTANTS
// ============================================================================

var STATUS_CONFIG = {
  NOTA_FISCAL: {
    PENDENTE: 'Pendente',
    RECEBIDA: 'Recebida',
    EM_CONFERENCIA: 'Em Conferência',
    CONFERIDA: 'Conferida',
    ATESTADA: 'Atestada',
    LIQUIDADA: 'Liquidada',
    PAGA: 'Paga',
    CANCELADA: 'Cancelada',
    GLOSADA: 'Glosada'
  },
  ENTREGA: {
    AGENDADA: 'Agendada',
    EM_TRANSITO: 'Em Trânsito',
    ENTREGUE: 'Entregue',
    ENTREGUE_PARCIAL: 'Entregue Parcial',
    RECUSADA: 'Recusada',
    CANCELADA: 'Cancelada'
  },
  USUARIO: {
    ATIVO: 'Ativo',
    INATIVO: 'Inativo',
    BLOQUEADO: 'Bloqueado',
    PENDENTE: 'Pendente'
  }
};

var PERFIL_CONFIG = {
  ADMIN: { nome: 'Administrador', nivel: 100, permissoes: ['*'] },
  GESTOR: { nome: 'Gestor', nivel: 80, permissoes: ['visualizar_tudo', 'editar_nf', 'aprovar_atesto'] },
  FISCAL: { nome: 'Fiscal', nivel: 60, permissoes: ['visualizar_tudo', 'editar_nf', 'registrar_recebimento'] },
  OPERADOR: { nome: 'Operador', nivel: 40, permissoes: ['visualizar_nf', 'registrar_recebimento'] },
  CONSULTA: { nome: 'Consulta', nivel: 20, permissoes: ['visualizar_nf', 'visualizar_relatorios'] }
};

var CRE_CONFIG = {
  'CRE-PP': { nome: 'Plano Piloto', codigo: 'PP' },
  'CRE-GU': { nome: 'Guará', codigo: 'GU' },
  'CRE-NU': { nome: 'Núcleo Bandeirante', codigo: 'NU' },
  'CRE-TA': { nome: 'Taguatinga', codigo: 'TA' },
  'CRE-BR': { nome: 'Brazlândia', codigo: 'BR' },
  'CRE-SO': { nome: 'Sobradinho', codigo: 'SO' },
  'CRE-PL': { nome: 'Planaltina', codigo: 'PL' },
  'CRE-PA': { nome: 'Paranoá', codigo: 'PA' },
  'CRE-CE': { nome: 'Ceilândia', codigo: 'CE' },
  'CRE-SA': { nome: 'Samambaia', codigo: 'SA' },
  'CRE-SM': { nome: 'Santa Maria', codigo: 'SM' },
  'CRE-GA': { nome: 'Gama', codigo: 'GA' },
  'CRE-RE': { nome: 'Recanto das Emas', codigo: 'RE' },
  'CRE-SS': { nome: 'São Sebastião', codigo: 'SS' }
};

// ============================================================================
// 4. GLOBAL HELPERS (ACCESSORS)
// ============================================================================

/**
 * Obtém configuração do sistema de forma segura
 */
function getConfig(key, defaultValue) {
  try {
    if (!key) return SYSTEM_CONFIG;
    var parts = key.split('.');
    var value = SYSTEM_CONFIG;
    for (var i = 0; i < parts.length; i++) {
      if (value === undefined || value === null) return defaultValue;
      value = value[parts[i]];
    }
    return value !== undefined ? value : defaultValue;
  } catch (error) {
    Logger.log("Erro em getConfig: " + error.message);
    throw error;
  }
}

/**
 * Obtém nome da aba mapeada
 */
function getSheetName(key) {
  return SHEET_CONFIG[key] || key;
}

/**
 * Obtém propriedade do script (wrapper para PropertiesService)
 * @deprecated Use PropertiesManager.get() para novas implementações
 */
function getScriptProperty(key, defaultValue) {
  try {
    // Delegar para PropertiesManager se disponível
    if (typeof PropertiesManager !== 'undefined') {
      return PropertiesManager.get(key, defaultValue);
    }
  
    // Fallback para implementação direta
    try {
      var props = PropertiesService.getScriptProperties();
      var value = props.getProperty(key);
      return value !== null ? value : defaultValue;
    } catch (e) {
      console.error('Erro ao obter propriedade ' + key + ': ' + e.message);
      return defaultValue;
    }
  } catch (error) {
    Logger.log("Erro em getScriptProperty: " + error.message);
    throw error;
  }
}

/**
 * Define propriedade do script
 * @deprecated Use PropertiesManager.set() para novas implementações
 */
function setScriptProperty(key, value) {
  try {
    // Delegar para PropertiesManager se disponível
    if (typeof PropertiesManager !== 'undefined') {
      return PropertiesManager.set(key, value);
    }
  
    // Fallback para implementação direta
    try {
      var props = PropertiesService.getScriptProperties();
      props.setProperty(key, String(value));
      return true;
    } catch (e) {
      console.error('Erro ao definir propriedade ' + key + ': ' + e.message);
      return false;
    }
  } catch (error) {
    Logger.log("Erro em setScriptProperty: " + error.message);
    throw error;
  }
}

// ============================================================================
// 5. BACKWARD COMPATIBILITY (LEGACY SUPPORT)
// ============================================================================

/**
 * @deprecated Use PropertiesManager ou SYSTEM_CONFIG diretamente
 * Mantido para compatibilidade com código existente
 */
var CONFIG = {
  // Funções que delegam para PropertiesManager quando disponível
  getFolderId: function() { 
    return typeof PropertiesManager !== 'undefined' 
      ? PropertiesManager.getDriveRootFolder() 
      : getScriptProperty('DRIVE_FOLDER_ID'); 
  },
  getSpreadsheetId: function() { 
    return typeof PropertiesManager !== 'undefined' 
      ? PropertiesManager.getSpreadsheetId() 
      : getScriptProperty('SPREADSHEET_ID'); 
  },
  getGeminiApiKey: function() { 
    return typeof PropertiesManager !== 'undefined' 
      ? PropertiesManager.getGeminiApiKey() 
      : getScriptProperty('GEMINI_API_KEY'); 
  },
  getGeminiTemperature: function() { 
    try {
      return typeof PropertiesManager !== 'undefined' 
        ? PropertiesManager.getGeminiTemperature() 
        : parseFloat(getScriptProperty('GEMINI_TEMPERATURE', '0.7')); 
    } catch (error) {
      Logger.log("Erro em getGeminiTemperature: " + error.message);
      throw error;
    }
  },
  
  // Novas funções via PropertiesManager
  isMaintenanceMode: function() {
    return typeof PropertiesManager !== 'undefined' 
      ? PropertiesManager.isMaintenanceMode() 
      : getScriptProperty('MAINTENANCE_MODE', 'false') === 'true';
  },
  getEnvironment: function() {
    return typeof PropertiesManager !== 'undefined' 
      ? PropertiesManager.getEnvironment() 
      : getScriptProperty('SYSTEM_ENVIRONMENT', 'production');
  },
  
  // Constantes
  SHEETS: SHEET_CONFIG,
  SISTEMA: {
    NOME: SYSTEM_CONFIG.INFO.NAME,
    VERSAO: SYSTEM_CONFIG.INFO.VERSION,
    ORGAO: SYSTEM_CONFIG.INFO.ORGANIZATION,
    DESCRICAO: SYSTEM_CONFIG.INFO.DESCRIPTION
  }
};

/**
 * @deprecated Use SYSTEM_CONFIG.PERFORMANCE
 */
var PERFORMANCE_LIMITS = SYSTEM_CONFIG.PERFORMANCE;
PERFORMANCE_LIMITS.DAILY_QUOTA_LIMIT = SYSTEM_CONFIG.LIMITS.DAILY_QUOTA_LIMIT;
PERFORMANCE_LIMITS.QUOTA_WARNING_THRESHOLD = SYSTEM_CONFIG.LIMITS.QUOTA_WARNING_THRESHOLD;
