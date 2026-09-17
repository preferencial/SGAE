/**
 * @fileoverview Schema Unificado da Aba Usuarios
 * @version 1.0.0
 * 
 * FONTE ÚNICA DE VERDADE para a estrutura da aba Usuarios.
 * Todos os arquivos devem referenciar este schema.
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-18
 */

'use strict';

// ============================================================================
// SCHEMA UNIFICADO - USUARIOS
// ============================================================================

/**
 * Headers oficiais da aba Usuarios
 * Esta é a ÚNICA definição que deve ser usada em todo o sistema
 */
var USUARIOS_SCHEMA = {
  /**
   * Nome da aba na planilha
   */
  SHEET_NAME: 'Usuarios',
  
  /**
   * Headers da aba (ordem importa!)
   * Total: 13 colunas
   */
  HEADERS: [
    'email',           // 1 - Email do usuário (chave única)
    'nome',            // 2 - Nome completo
    'senha',           // 3 - Senha (texto plano para testes)
    'tipo',            // 4 - Tipo: ADMIN, ANALISTA, FISCAL, GESTOR, REPRESENTANTE, FORNECEDOR, NUTRICIONISTA
    'instituicao',     // 5 - Instituição/Escola/Empresa
    'telefone',        // 6 - Telefone de contato
    'cpf',             // 7 - CPF (opcional)
    'cnpj',            // 8 - CNPJ (para fornecedores)
    'ativo',           // 9 - Status: true/false ou ATIVO/INATIVO
    'dataCriacao',     // 10 - Data de criação do registro
    'dataAtualizacao', // 11 - Data da última atualização
    'ultimoAcesso',    // 12 - Data/hora do último acesso
    'token'            // 13 - Token de sessão
  ],
  
  /**
   * Índices das colunas (0-based)
   */
  INDICES: {
    EMAIL: 0,
    NOME: 1,
    SENHA: 2,
    TIPO: 3,
    INSTITUICAO: 4,
    TELEFONE: 5,
    CPF: 6,
    CNPJ: 7,
    ATIVO: 8,
    DATA_CRIACAO: 9,
    DATA_ATUALIZACAO: 10,
    ULTIMO_ACESSO: 11,
    TOKEN: 12
  },
  
  /**
   * Tipos de usuário válidos
   */
  TIPOS_VALIDOS: [
    'ADMIN',
    'ANALISTA',
    'FISCAL',
    'GESTOR',
    'REPRESENTANTE',
    'FORNECEDOR',
    'NUTRICIONISTA'
  ],
  
  /**
   * Cor do header
   */
  HEADER_COLOR: '#4a5568',
  
  /**
   * Cor do texto do header
   */
  HEADER_TEXT_COLOR: '#ffffff'
};

// ============================================================================
// FUNÇÕES UTILITÁRIAS
// ============================================================================

/**
 * Retorna os headers da aba Usuarios
 * @returns {Array<string>} Lista de headers
 */
function getUsuariosHeaders() {
  try {
    return USUARIOS_SCHEMA.HEADERS.slice(); // Retorna cópia para evitar mutação
  } catch (error) {
    Logger.log("Erro em getUsuariosHeaders: " + error.message);
    throw error;
  }
}

/**
 * Retorna o índice de uma coluna pelo nome
 * @param {string} columnName - Nome da coluna
 * @returns {number} Índice (0-based) ou -1 se não encontrado
 */
function getUsuariosColumnIndex(columnName) {
  return USUARIOS_SCHEMA.HEADERS.indexOf(columnName);
}

/**
 * Valida se um tipo de usuário é válido
 * @param {string} tipo - Tipo a validar
 * @returns {boolean}
 */
function isValidUsuarioTipo(tipo) {
  return USUARIOS_SCHEMA.TIPOS_VALIDOS.indexOf(tipo) !== -1;
}

/**
 * Cria um objeto de usuário vazio com todos os campos
 * @returns {Object} Objeto com todos os campos do schema
 */
function createEmptyUsuario() {
  try {
    var usuario = {};
    USUARIOS_SCHEMA.HEADERS.forEach(function(header) {
      usuario[header] = '';
    });
    return usuario;
  } catch (error) {
    Logger.log("Erro em createEmptyUsuario: " + error.message);
    throw error;
  }
}

/**
 * Converte uma linha de dados em objeto de usuário
 * @param {Array} row - Linha de dados da planilha
 * @returns {Object} Objeto de usuário
 */
function rowToUsuario(row) {
  try {
    var usuario = {};
    USUARIOS_SCHEMA.HEADERS.forEach(function(header, index) {
      usuario[header] = row[index] !== undefined ? row[index] : '';
    });
    return usuario;
  } catch (error) {
    Logger.log("Erro em rowToUsuario: " + error.message);
    throw error;
  }
}

/**
 * Converte um objeto de usuário em linha de dados
 * @param {Object} usuario - Objeto de usuário
 * @returns {Array} Linha de dados para a planilha
 */
function usuarioToRow(usuario) {
  try {
    return USUARIOS_SCHEMA.HEADERS.map(function(header) {
      return usuario[header] !== undefined ? usuario[header] : '';
    });
  } catch (error) {
    Logger.log("Erro em usuarioToRow: " + error.message);
    throw error;
  }
}

/**
 * Verifica se os headers da planilha estão corretos
 * @param {Array} headers - Headers atuais da planilha
 * @returns {Object} Resultado da verificação
 */
function validateUsuariosHeaders(headers) {
  try {
    var expected = USUARIOS_SCHEMA.HEADERS;
  
    // Validação de entrada - headers pode ser undefined ou não ser array
    if (!headers || !Array.isArray(headers)) {
      return {
        valid: false,
        error: 'Headers inválidos ou não fornecidos',
        expected: expected,
        found: []
      };
    }
  
    var cleanHeaders = headers.filter(function(h) { return h !== ''; });
  
    if (cleanHeaders.length !== expected.length) {
      return {
        valid: false,
        error: 'Quantidade de colunas incorreta. Esperado: ' + expected.length + ', Encontrado: ' + cleanHeaders.length,
        expected: expected,
        found: cleanHeaders
      };
    }
  
    for (var i = 0; i < expected.length; i++) {
      if (cleanHeaders[i] !== expected[i]) {
        return {
          valid: false,
          error: 'Coluna ' + (i + 1) + ' incorreta. Esperado: "' + expected[i] + '", Encontrado: "' + cleanHeaders[i] + '"',
          expected: expected,
          found: cleanHeaders,
          firstDiffIndex: i
        };
      }
    }
  
    return {
      valid: true,
      expected: expected,
      found: cleanHeaders
    };
  } catch (error) {
    Logger.log("Erro em validateUsuariosHeaders: " + error.message);
    throw error;
  }
}

// ============================================================================
// DADOS DE TESTE PADRÃO
// ============================================================================

/**
 * Dados de teste padrão para a aba Usuarios
 * Senhas em TEXTO PLANO para ambiente de teste
 */
var USUARIOS_DADOS_TESTE = [
  {
    email: 'admin@uniae.gov.br',
    nome: 'Administrador Sistema',
    get senha() { return getSeedCredential_('admin@uniae.gov.br'); },
    tipo: 'ADMIN',
    instituicao: 'UNIAE/CRE-PP',
    telefone: '(61) 3333-0001',
    cpf: '000.000.000-01',
    cnpj: '',
    ativo: 'ATIVO',
    dataCriacao: new Date(),
    dataAtualizacao: '',
    ultimoAcesso: '',
    token: ''
  },
  {
    email: 'analista@uniae.gov.br',
    nome: 'Ana Paula Silva',
    get senha() { return getSeedCredential_('analista@uniae.gov.br'); },
    tipo: 'ANALISTA',
    instituicao: 'UNIAE/CRE-PP',
    telefone: '(61) 3333-0002',
    cpf: '000.000.000-02',
    cnpj: '',
    ativo: 'ATIVO',
    dataCriacao: new Date(),
    dataAtualizacao: '',
    ultimoAcesso: '',
    token: ''
  },
  {
    email: 'fiscal@uniae.gov.br',
    nome: 'Carlos Eduardo Santos',
    get senha() { return getSeedCredential_('fiscal@uniae.gov.br'); },
    tipo: 'FISCAL',
    instituicao: 'UNIAE/CRE-PP',
    telefone: '(61) 3333-0003',
    cpf: '000.000.000-03',
    cnpj: '',
    ativo: 'ATIVO',
    dataCriacao: new Date(),
    dataAtualizacao: '',
    ultimoAcesso: '',
    token: ''
  },
  {
    email: 'gestor@uniae.gov.br',
    nome: 'Maria Fernanda Costa',
    get senha() { return getSeedCredential_('gestor@uniae.gov.br'); },
    tipo: 'GESTOR',
    instituicao: 'UNIAE/CRE-PP',
    telefone: '(61) 3333-0004',
    cpf: '000.000.000-04',
    cnpj: '',
    ativo: 'ATIVO',
    dataCriacao: new Date(),
    dataAtualizacao: '',
    ultimoAcesso: '',
    token: ''
  },
  {
    email: 'escola@seedf.gov.br',
    nome: 'Roberto Lima',
    get senha() { return getSeedCredential_('escola@seedf.gov.br'); },
    tipo: 'REPRESENTANTE',
    instituicao: 'EC 01 Plano Piloto',
    telefone: '(61) 3333-0005',
    cpf: '000.000.000-05',
    cnpj: '',
    ativo: 'ATIVO',
    dataCriacao: new Date(),
    dataAtualizacao: '',
    ultimoAcesso: '',
    token: ''
  },
  {
    email: 'fornecedor@empresa.com.br',
    nome: 'João Pedro Almeida',
    get senha() { return getSeedCredential_('fornecedor@empresa.com.br'); },
    tipo: 'FORNECEDOR',
    instituicao: 'Alimentos Brasil LTDA',
    telefone: '(61) 3333-0006',
    cpf: '',
    cnpj: '12.345.678/0001-99',
    ativo: 'ATIVO',
    dataCriacao: new Date(),
    dataAtualizacao: '',
    ultimoAcesso: '',
    token: ''
  },
  {
    email: 'nutricionista@seedf.gov.br',
    nome: 'Patrícia Mendes',
    get senha() { return getSeedCredential_('nutricionista@seedf.gov.br'); },
    tipo: 'NUTRICIONISTA',
    instituicao: 'UNIAE/CRE-PP',
    telefone: '(61) 3333-0007',
    cpf: '000.000.000-07',
    cnpj: '',
    ativo: 'ATIVO',
    dataCriacao: new Date(),
    dataAtualizacao: '',
    ultimoAcesso: '',
    token: ''
  },
  {
    email: 'teste@teste.com',
    nome: 'Usuário de Teste',
    get senha() { return getSeedCredential_('teste@teste.com'); },
    tipo: 'ANALISTA',
    instituicao: 'Teste',
    telefone: '(61) 9999-9999',
    cpf: '000.000.000-00',
    cnpj: '',
    ativo: 'ATIVO',
    dataCriacao: new Date(),
    dataAtualizacao: '',
    ultimoAcesso: '',
    token: ''
  }
];

// Log de carregamento
Logger.log('✅ Core_Schema_Usuarios.gs carregado - Schema unificado disponível');
