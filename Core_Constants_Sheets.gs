/**
 * @fileoverview Constantes Centralizadas - Nomes de Abas e Strings do Sistema
 * @version 1.0.0
 * @description Centraliza todas as magic strings do sistema para facilitar
 * manutenção e evitar erros de digitação.
 * 
 * INTERVENÇÃO 5/16: Eliminação de Magic Strings
 * - Nomes de abas de planilha
 * - Status de processos
 * - Tipos de usuário
 * - Mensagens de erro comuns
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-26
 */

'use strict';

/**
 * Nomes das abas de planilha do sistema
 * Use estas constantes ao invés de strings literais
 */
const SHEET_NAMES = {
  // Abas principais de dados
  USUARIOS: 'Usuarios',
  USR_USUARIOS: 'USR_Usuarios',
  NOTAS_FISCAIS: 'Notas_Fiscais',
  ENTREGAS: 'Entregas',
  RECUSAS: 'Recusas',
  GLOSAS: 'Glosas',
  FORNECEDORES: 'Fornecedores',
  ESCOLAS: 'Escolas',
  PRODUTOS: 'Produtos',
  EMPENHOS: 'Empenhos',
  
  // Abas de workflow
  WORKFLOW_NOTAS_FISCAIS: 'Workflow_NotasFiscais',
  WORKFLOW_RECEBIMENTOS: 'Workflow_Recebimentos',
  WORKFLOW_ANALISES: 'Workflow_Analises',
  PROCESSOS_ATESTO: 'Processos_Atesto',
  
  // Abas de controle
  CONTROLE_CONFERENCIA: 'Controle_Conferencia',
  SUBSTITUICOES_ALIMENTOS: 'Substituicoes_Alimentos',
  PARECERES_TECNICOS: 'Pareceres_Tecnicos',
  OCORRENCIAS_DESCARTE: 'Ocorrencias_Descarte',
  
  // Abas de nutrição
  CARDAPIOS_ESPECIAIS: 'Cardapios_Especiais',
  AVALIACOES_NUTRICIONISTA: 'Avaliacoes_Nutricionista',
  ALUNOS_NECESSIDADES_ESPECIAIS: 'Alunos_Necessidades_Especiais',
  
  // Abas de auditoria e configuração
  AUDITORIA: 'Auditoria_Log',
  AUD_AUDITORIA: 'AUD_Auditoria',
  CONFIGURACOES: 'Configuracoes',
  
  // Abas de relatórios
  CONFORMIDADE: 'Conformidade',
  VIOLACOES: 'Violacoes',
  PDGP: 'PDGP',
  
  // Abas temporárias
  CHART_TEMP: '_ChartTemp'
};

/**
 * Status de processos e registros
 */
const STATUS = {
  // Status gerais
  ATIVO: 'ATIVO',
  INATIVO: 'INATIVO',
  BLOQUEADO: 'BLOQUEADO',
  PENDENTE: 'PENDENTE',
  CONCLUIDO: 'CONCLUIDO',
  CANCELADO: 'CANCELADO',
  
  // Status de notas fiscais
  NF: {
    PENDENTE: 'PENDENTE',
    EM_ANALISE: 'EM_ANALISE',
    APROVADA: 'APROVADA',
    APROVADA_PARCIAL: 'APROVADA_PARCIAL',
    REJEITADA: 'REJEITADA',
    GLOSADA: 'GLOSADA',
    PAGA: 'PAGA'
  },
  
  // Status de entregas
  ENTREGA: {
    AGENDADA: 'AGENDADA',
    EM_TRANSITO: 'EM_TRANSITO',
    ENTREGUE: 'ENTREGUE',
    ENTREGUE_PARCIAL: 'ENTREGUE_PARCIAL',
    RECUSADA: 'RECUSADA',
    CANCELADA: 'CANCELADA'
  },
  
  // Status de recusas
  RECUSA: {
    REGISTRADA: 'REGISTRADA',
    EM_ANALISE: 'EM_ANALISE',
    SUBSTITUICAO_PENDENTE: 'SUBSTITUICAO_PENDENTE',
    SUBSTITUIDA: 'SUBSTITUIDA',
    GLOSADA: 'GLOSADA',
    RESOLVIDA: 'RESOLVIDA'
  },
  
  // Status de glosas
  GLOSA: {
    PENDENTE: 'PENDENTE',
    APLICADA: 'APLICADA',
    CONTESTADA: 'CONTESTADA',
    REVERTIDA: 'REVERTIDA',
    CONFIRMADA: 'CONFIRMADA'
  },
  
  // Status de processos SEI
  PROCESSO: {
    ABERTO: 'ABERTO',
    EM_TRAMITACAO: 'EM_TRAMITACAO',
    AGUARDANDO_ATESTO: 'AGUARDANDO_ATESTO',
    ATESTADO: 'ATESTADO',
    LIQUIDADO: 'LIQUIDADO',
    PAGO: 'PAGO',
    ARQUIVADO: 'ARQUIVADO'
  }
};

/**
 * Tipos de usuário do sistema
 */
const USER_TYPES = {
  ADMIN: 'ADMIN',
  ANALISTA: 'ANALISTA',
  FISCAL: 'FISCAL',
  GESTOR: 'GESTOR',
  REPRESENTANTE: 'REPRESENTANTE',
  ESCOLA: 'ESCOLA',
  FORNECEDOR: 'FORNECEDOR',
  NUTRICIONISTA: 'NUTRICIONISTA',
  OPERADOR: 'OPERADOR'
};

/**
 * Motivos de recusa padronizados
 */
/**
 * Motivos de recusa padronizados
 */
const SHEET_MOTIVOS_RECUSA = {
  TEMPERATURA_INADEQUADA: 'Temperatura inadequada',
  EMBALAGEM_VIOLADA: 'Embalagem violada ou danificada',
  PRODUTO_VENCIDO: 'Produto vencido',
  VALIDADE_INSUFICIENTE: 'Validade insuficiente',
  CARACTERISTICAS_ALTERADAS: 'Características organolépticas alteradas',
  QUANTIDADE_DIVERGENTE: 'Quantidade divergente',
  PRODUTO_DIFERENTE: 'Produto diferente do solicitado',
  PRESENCA_PRAGAS: 'Presença de pragas ou sujidades',
  SEM_ROTULAGEM: 'Sem rotulagem ou rotulagem incompleta',
  TRANSPORTE_INADEQUADO: 'Transporte inadequado',
  SEM_INSCRICAO_INSTITUCIONAL: 'Sem inscrição institucional',
  MARCA_DIVERGENTE: 'Marca diferente da contratada'
};

/**
 * Tipos de conservação de alimentos
 */
const TIPOS_CONSERVACAO = {
  CONGELADO: 'CONGELADO',
  RESFRIADO: 'RESFRIADO',
  AMBIENTE: 'AMBIENTE',
  REFRIGERADO: 'REFRIGERADO'
};

/**
 * Limites de temperatura por tipo de conservação (em °C)
 */
const LIMITES_TEMPERATURA = {
  CONGELADO: { min: -18, max: -12 },
  RESFRIADO: { min: 0, max: 10 },
  CARNES_RESFRIADAS: { min: 0, max: 7 },
  PESCADO_RESFRIADO: { min: 0, max: 3 },
  REFRIGERADO: { min: 0, max: 10 }
};

/**
 * Mensagens de erro comuns
 */
const ERROR_MESSAGES = {
  // Erros de autenticação
  AUTH: {
    MISSING_CREDENTIALS: 'Email e senha são obrigatórios',
    INVALID_CREDENTIALS: 'Email ou senha incorretos',
    ACCOUNT_LOCKED: 'Conta bloqueada temporariamente. Tente novamente em 30 minutos.',
    USER_INACTIVE: 'Usuário inativo ou bloqueado. Contate o administrador.',
    NOT_AUTHENTICATED: 'Usuário não autenticado',
    SESSION_EXPIRED: 'Sessão expirada. Faça login novamente.',
    PERMISSION_DENIED: 'Permissão negada para esta operação'
  },
  
  // Erros de planilha
  SHEET: {
    NOT_FOUND: 'Planilha não encontrada',
    SHEET_NOT_FOUND: 'Aba não encontrada: ',
    NO_DATA: 'Nenhum dado encontrado',
    COLUMN_NOT_FOUND: 'Coluna não encontrada: '
  },
  
  // Erros de validação
  VALIDATION: {
    REQUIRED_FIELD: 'Campo obrigatório: ',
    INVALID_EMAIL: 'Formato de email inválido',
    INVALID_CNPJ: 'CNPJ inválido',
    INVALID_CPF: 'CPF inválido',
    INVALID_DATE: 'Data inválida',
    INVALID_VALUE: 'Valor inválido'
  },
  
  // Erros de operação
  OPERATION: {
    FAILED: 'Operação falhou',
    TIMEOUT: 'Tempo limite excedido',
    QUOTA_EXCEEDED: 'Cota excedida'
  }
};

/**
 * Mensagens de sucesso comuns
 */
const SUCCESS_MESSAGES = {
  SAVED: 'Dados salvos com sucesso',
  UPDATED: 'Dados atualizados com sucesso',
  DELETED: 'Registro excluído com sucesso',
  LOGIN_SUCCESS: 'Login realizado com sucesso',
  LOGOUT_SUCCESS: 'Logout realizado com sucesso',
  OPERATION_SUCCESS: 'Operação realizada com sucesso'
};

/**
 * Configurações de cache
 */
const CACHE_KEYS = {
  USER_SESSION: 'user_session',
  FEATURE_FLAGS: 'feature_flags',
  SHEET_DATA_PREFIX: 'sheet_data_',
  INDEX_PREFIX: 'index_',
  STATS_PREFIX: 'stats_'
};

/**
 * Configurações de tempo (em milissegundos)
 */
const TIME_CONFIG = {
  SESSION_TIMEOUT: 8 * 60 * 60 * 1000,      // 8 horas
  CACHE_TTL_SHORT: 60 * 1000,                // 1 minuto
  CACHE_TTL_MEDIUM: 5 * 60 * 1000,           // 5 minutos
  CACHE_TTL_LONG: 30 * 60 * 1000,            // 30 minutos
  LOCKOUT_DURATION: 30 * 60 * 1000,          // 30 minutos
  MAX_EXECUTION_TIME: 6 * 60 * 1000          // 6 minutos (limite GAS)
};

/**
 * Configurações de limites
 */
const LIMITS = {
  MAX_LOGIN_ATTEMPTS: 5,
  PASSWORD_MIN_LENGTH: 6,
  MAX_ROWS_PER_BATCH: 100,
  MAX_CACHE_SIZE: 100 * 1024,                // 100KB
  MAX_PROPERTIES_SIZE: 500 * 1024            // 500KB
};

// ============================================================================
// FUNÇÕES HELPER
// ============================================================================

/**
 * Obtém uma aba pelo nome usando constantes
 * @param {string} sheetName - Nome da aba (use SHEET_NAMES)
 * @returns {Sheet|null}
 */
function getSheetByConstant(sheetName) {
  try {
    const ss = getSS();
    if (!ss) return null;
    return ss.getSheetByName(sheetName);
  } catch (e) {
    Logger.log('Erro ao obter aba ' + sheetName + ': ' + e.message);
    return null;
  }
}

/**
 * Verifica se uma aba existe
 * @param {string} sheetName - Nome da aba
 * @returns {boolean}
 */
function sheetExists(sheetName) {
  return getSheetByConstant(sheetName) !== null;
}

/**
 * Obtém mensagem de erro formatada
 * @param {string} category - Categoria (AUTH, SHEET, VALIDATION, OPERATION)
 * @param {string} key - Chave da mensagem
 * @param {string} [detail] - Detalhe adicional
 * @returns {string}
 */
function getErrorMessage(category, key, detail) {
  const messages = ERROR_MESSAGES[category];
  if (!messages || !messages[key]) {
    return 'Erro desconhecido';
  }
  return detail ? messages[key] + detail : messages[key];
}

Logger.log('✅ Core_Constants_Sheets.gs carregado');
