/**
 * @fileoverview Setup Completo com Dados Sintéticos - Sistema UNIAE CRE
 * @version 2.0.0
 * @description Cria TODAS as planilhas do sistema com dados sintéticos
 * para testar todos os fluxos: NFs, Entregas, Glosas, Recusas, Cardápios, etc.
 * 
 * EXECUTE: setupCompletoSintetico()
 */

'use strict';

// ============================================================================
// CONFIGURAÇÃO COMPLETA DE TODAS AS SHEETS
// ============================================================================

var SETUP_COMPLETO = {
  
  // ═══════════════════════════════════════════════════════════════════════════
  // MÓDULO: USUÁRIOS E AUTENTICAÇÃO
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Usa schema unificado de Core_Schema_Usuarios.gs
  USR_Usuarios: {
    headers: (typeof USUARIOS_SCHEMA !== 'undefined') 
      ? USUARIOS_SCHEMA.HEADERS 
      : ['email', 'nome', 'senha', 'tipo', 'instituicao', 'telefone', 'cpf', 'cnpj', 'ativo', 'dataCriacao', 'dataAtualizacao', 'ultimoAcesso', 'token'],
    headerColor: '#4a86e8',
    dados: function() {
      var agora = new Date();
      // Dados alinhados com USUARIOS_SCHEMA.HEADERS (13 colunas, sem 'id' e 'perfil')
      return [
        ['admin@uniae.gov.br', 'Administrador Sistema', 'Admin@2025', 'ADMIN', 'UNIAE/CRE-PP', '(61) 3333-0001', '000.000.001-91', '', 'ATIVO', agora, '', '', ''],
        ['analista@uniae.gov.br', 'Ana Paula Silva', 'Analista@2025', 'ANALISTA', 'UNIAE/CRE-PP', '(61) 3333-0002', '000.000.002-82', '', 'ATIVO', agora, '', '', ''],
        ['fiscal@uniae.gov.br', 'Carlos Eduardo Santos', 'Fiscal@2025', 'FISCAL', 'UNIAE/CRE-PP', '(61) 3333-0003', '000.000.003-73', '', 'ATIVO', agora, '', '', ''],
        ['gestor@uniae.gov.br', 'Maria Fernanda Costa', 'Gestor@2025', 'GESTOR', 'UNIAE/CRE-PP', '(61) 3333-0004', '000.000.004-64', '', 'ATIVO', agora, '', '', ''],
        ['escola01@seedf.gov.br', 'Roberto Lima', 'Escola@2025', 'REPRESENTANTE', 'EC 01 Plano Piloto', '(61) 3333-0005', '000.000.005-55', '', 'ATIVO', agora, '', '', ''],
        ['escola02@seedf.gov.br', 'Fernanda Souza', 'Escola@2025', 'REPRESENTANTE', 'EC 02 Asa Sul', '(61) 3333-0006', '000.000.006-46', '', 'ATIVO', agora, '', '', ''],
        ['fornecedor@alimentosbrasil.com.br', 'João Pedro Almeida', 'Fornecedor@2025', 'FORNECEDOR', 'Alimentos Brasil LTDA', '(61) 3333-0007', '', '12.345.678/0001-99', 'ATIVO', agora, '', '', ''],
        ['fornecedor@granja.com.br', 'Marcos Pereira', 'Fornecedor@2025', 'FORNECEDOR', 'Granja Ovos Frescos', '(61) 3333-0008', '', '33.444.555/0001-88', 'ATIVO', agora, '', '', ''],
        ['nutricionista@seedf.gov.br', 'Patrícia Mendes', 'Nutri@2025', 'NUTRICIONISTA', 'UNIAE/CRE-PP', '(61) 3333-0009', '000.000.009-19', '', 'ATIVO', agora, '', '', ''],
        ['teste@teste.com', 'Usuário Teste', 'Teste@123', 'ANALISTA', 'Teste', '(61) 9999-9999', '000.000.010-00', '', 'ATIVO', agora, '', '', '']
      ];
    }
  },

  // Alias para compatibilidade - usa mesmo schema
  Usuarios: {
    headers: (typeof USUARIOS_SCHEMA !== 'undefined') 
      ? USUARIOS_SCHEMA.HEADERS 
      : ['email', 'nome', 'senha', 'tipo', 'instituicao', 'telefone', 'cpf', 'cnpj', 'ativo', 'dataCriacao', 'dataAtualizacao', 'ultimoAcesso', 'token'],
    headerColor: '#4a86e8',
    alias: 'USR_Usuarios'
  }
};


// ═══════════════════════════════════════════════════════════════════════════
// MÓDULO: FORNECEDORES
// ═══════════════════════════════════════════════════════════════════════════

SETUP_COMPLETO.Fornecedores = {
  headers: ['id', 'razao_social', 'nome_fantasia', 'cnpj', 'inscricao_estadual', 'endereco', 'cidade', 'uf', 'cep', 'telefone', 'email', 'contato', 'status', 'data_cadastro', 'observacoes'],
  headerColor: '#cc0000',
  dados: function() {
    return [
      ['FOR_001', 'Alimentos Brasil LTDA', 'Alimentos Brasil', '12.345.678/0001-99', '123456789', 'Rua das Flores, 100', 'Brasília', 'DF', '70000-000', '(61) 3333-1001', 'contato@alimentosbrasil.com.br', 'José Silva', 'ATIVO', new Date(), 'Fornecedor principal de grãos'],
      ['FOR_002', 'Distribuidora de Alimentos XYZ LTDA', 'Distribuidora XYZ', '98.765.432/0001-10', '987654321', 'Av. Central, 500', 'Brasília', 'DF', '70100-000', '(61) 3333-1002', 'vendas@xyz.com.br', 'Maria Santos', 'ATIVO', new Date(), 'Distribuidor geral'],
      ['FOR_003', 'Hortifruti Central EIRELI', 'Hortifruti Central', '11.222.333/0001-44', '112223334', 'CEASA Lote 15', 'Brasília', 'DF', '70200-000', '(61) 3333-1003', 'hortifruti@central.com.br', 'Pedro Oliveira', 'ATIVO', new Date(), 'Frutas e verduras - Maçãs'],
      ['FOR_004', 'Laticínios Bom Gosto S/A', 'Laticínios Bom Gosto', '44.555.666/0001-77', '445556667', 'Rod. BR-020 Km 50', 'Planaltina', 'DF', '73300-000', '(61) 3333-1004', 'comercial@bomgosto.com.br', 'Ana Costa', 'ATIVO', new Date(), 'Laticínios em geral'],
      ['FOR_005', 'Panificadora Pão Quente LTDA', 'Panificadora Pão Quente', '77.888.999/0001-00', '778889990', 'SIA Trecho 3', 'Brasília', 'DF', '71200-000', '(61) 3333-1005', 'pedidos@paoquente.com.br', 'Carlos Ferreira', 'ATIVO', new Date(), 'Pães e derivados - Pão Brioche'],
      ['FOR_006', 'Granja Ovos Frescos LTDA', 'Granja Ovos Frescos', '33.444.555/0001-88', '334445556', 'Núcleo Rural Sobradinho', 'Sobradinho', 'DF', '73100-000', '(61) 3333-1006', 'vendas@ovosfrescos.com.br', 'Marcos Pereira', 'ATIVO', new Date(), 'Ovos brancos e vermelhos'],
      ['FOR_007', 'Frigorífico Carnes Nobres', 'Carnes Nobres', '55.666.777/0001-22', '556667778', 'SIA Trecho 5', 'Brasília', 'DF', '71200-100', '(61) 3333-1007', 'vendas@carnesnobres.com.br', 'Ricardo Souza', 'ATIVO', new Date(), 'Carnes bovinas e suínas']
    ];
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// MÓDULO: UNIDADES ESCOLARES
// ═══════════════════════════════════════════════════════════════════════════

SETUP_COMPLETO.Unidades_Escolares = {
  headers: ['id', 'nome', 'codigo_inep', 'tipo', 'endereco', 'bairro', 'cep', 'telefone', 'email', 'diretor', 'cre', 'num_alunos', 'status'],
  headerColor: '#0b5394',
  dados: function() {
    return [
      ['UE_001', 'EC 01 Plano Piloto', '53001001', 'Escola Classe', 'SQS 108 Área Especial', 'Asa Sul', '70000-000', '(61) 3333-2001', 'ec01pp@seedf.gov.br', 'Maria Helena', 'CRE-PP', 450, 'ATIVA'],
      ['UE_002', 'EC 02 Asa Sul', '53001002', 'Escola Classe', 'SQS 208 Área Especial', 'Asa Sul', '70000-001', '(61) 3333-2002', 'ec02as@seedf.gov.br', 'João Carlos', 'CRE-PP', 380, 'ATIVA'],
      ['UE_003', 'CEF 01 Plano Piloto', '53001003', 'Centro de Ensino Fundamental', 'SQN 108 Área Especial', 'Asa Norte', '70000-002', '(61) 3333-2003', 'cef01pp@seedf.gov.br', 'Ana Paula', 'CRE-PP', 820, 'ATIVA'],
      ['UE_004', 'CED 01 Plano Piloto', '53001004', 'Centro Educacional', 'SGAS 908', 'Asa Sul', '70000-003', '(61) 3333-2004', 'ced01pp@seedf.gov.br', 'Roberto Souza', 'CRE-PP', 1200, 'ATIVA'],
      ['UE_005', 'JI 01 Plano Piloto', '53001005', 'Jardim de Infância', 'SQS 308 Área Especial', 'Asa Sul', '70000-004', '(61) 3333-2005', 'ji01pp@seedf.gov.br', 'Fernanda Lima', 'CRE-PP', 180, 'ATIVA'],
      ['UE_006', 'EC 03 Cruzeiro', '53001006', 'Escola Classe', 'SHCES Quadra 1', 'Cruzeiro', '70000-005', '(61) 3333-2006', 'ec03cr@seedf.gov.br', 'Paulo Santos', 'CRE-PP', 350, 'ATIVA']
    ];
  }
};

// Alias para lista de escolas
SETUP_COMPLETO.Escolas = {
  headers: ['nome'],
  headerColor: '#0b5394',
  dados: function() {
    return [
      ['EC 01 Plano Piloto'],
      ['EC 02 Asa Sul'],
      ['CEF 01 Plano Piloto'],
      ['CED 01 Plano Piloto'],
      ['JI 01 Plano Piloto'],
      ['EC 03 Cruzeiro'],
      ['EC 04 Guará'],
      ['EC 05 Taguatinga'],
      ['CEF 02 Cruzeiro'],
      ['CED 02 Guará']
    ];
  }
};


// ═══════════════════════════════════════════════════════════════════════════
// MÓDULO: EMPENHOS
// ═══════════════════════════════════════════════════════════════════════════

SETUP_COMPLETO.Empenhos = {
  headers: ['id', 'numero_empenho', 'ano', 'fornecedor_id', 'fornecedor_nome', 'valor_total', 'valor_utilizado', 'saldo', 'data_emissao', 'data_vigencia', 'natureza_despesa', 'fonte_recurso', 'status', 'observacoes'],
  headerColor: '#38761d',
  dados: function() {
    return [
      ['EMP_001', '2025NE00001', 2025, 'FOR_001', 'Alimentos Brasil LTDA', 100000.00, 25000.00, 75000.00, new Date(2025, 0, 15), new Date(2025, 11, 31), '339030', 'PNAE', 'VIGENTE', 'Empenho para grãos e cereais'],
      ['EMP_002', '2025NE00002', 2025, 'FOR_002', 'Distribuidora XYZ', 80000.00, 15000.00, 65000.00, new Date(2025, 0, 20), new Date(2025, 11, 31), '339030', 'PNAE', 'VIGENTE', 'Empenho geral'],
      ['EMP_003', '2025NE00003', 2025, 'FOR_003', 'Hortifruti Central', 50000.00, 8500.00, 41500.00, new Date(2025, 1, 1), new Date(2025, 11, 31), '339030', 'PDDE', 'VIGENTE', 'Frutas e verduras'],
      ['EMP_004', '2025NE00004', 2025, 'FOR_004', 'Laticínios Bom Gosto', 60000.00, 12000.00, 48000.00, new Date(2025, 1, 10), new Date(2025, 11, 31), '339030', 'PNAE', 'VIGENTE', 'Laticínios'],
      ['EMP_005', '2025NE00005', 2025, 'FOR_005', 'Panificadora Pão Quente', 30000.00, 5000.00, 25000.00, new Date(2025, 2, 1), new Date(2025, 11, 31), '339030', 'PNAE', 'VIGENTE', 'Pães'],
      ['EMP_006', '2025NE00006', 2025, 'FOR_006', 'Granja Ovos Frescos', 40000.00, 7200.00, 32800.00, new Date(2025, 2, 15), new Date(2025, 11, 31), '339030', 'PNAE', 'VIGENTE', 'Ovos'],
      ['EMP_007', '2025NE00007', 2025, 'FOR_007', 'Carnes Nobres', 90000.00, 20000.00, 70000.00, new Date(2025, 3, 1), new Date(2025, 11, 31), '339030', 'PNAE', 'VIGENTE', 'Carnes']
    ];
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// MÓDULO: NOTAS FISCAIS (Sistema Legado)
// ═══════════════════════════════════════════════════════════════════════════

SETUP_COMPLETO.Notas_Fiscais = {
  headers: ['id', 'numero_nf', 'serie', 'chave_acesso', 'fornecedor', 'cnpj', 'valor_total', 'valor_liquido', 'valor_glosa', 'data_emissao', 'data_cadastro', 'status', 'usuario_cadastro', 'nota_empenho', 'itens_quantidade', 'observacoes', 'data_recebimento', 'usuario_recebimento', 'data_atesto', 'usuario_atesto', 'parecer_atesto'],
  headerColor: '#6aa84f',
  dados: function() {
    var agora = new Date();
    return [
      // NFs PENDENTES (aguardando recebimento)
      ['NF_L001', '100001', '1', '53251212345678000199550010001000011234567001', 'Alimentos Brasil LTDA', '12.345.678/0001-99', 5000.00, 5000.00, 0, new Date(2025, 11, 1), agora, 'PENDENTE', 'analista@uniae.gov.br', '2025NE00001', 10, '', '', '', '', '', ''],
      ['NF_L002', '100002', '1', '53251298765432000110550010001000021234567002', 'Distribuidora XYZ', '98.765.432/0001-10', 3500.00, 3500.00, 0, new Date(2025, 11, 2), agora, 'PENDENTE', 'analista@uniae.gov.br', '2025NE00002', 8, '', '', '', '', '', ''],
      
      // NFs RECEBIDAS (aguardando atesto)
      ['NF_L003', '100003', '1', '53251211222333000144550010001000031234567003', 'Hortifruti Central', '11.222.333/0001-44', 2800.00, 2800.00, 0, new Date(2025, 11, 3), agora, 'RECEBIDA', 'analista@uniae.gov.br', '2025NE00003', 15, '', new Date(2025, 11, 5), 'escola01@seedf.gov.br', '', '', ''],
      ['NF_L004', '100004', '1', '53251244555666000177550010001000041234567004', 'Laticínios Bom Gosto', '44.555.666/0001-77', 4200.00, 4200.00, 0, new Date(2025, 11, 4), agora, 'RECEBIDA', 'analista@uniae.gov.br', '2025NE00004', 12, '', new Date(2025, 11, 6), 'escola02@seedf.gov.br', '', '', ''],
      
      // NFs ATESTADAS (completas)
      ['NF_L005', '100005', '1', '53251277888999000100550010001000051234567005', 'Panificadora Pão Quente', '77.888.999/0001-00', 1800.00, 1800.00, 0, new Date(2025, 11, 5), agora, 'ATESTADA', 'analista@uniae.gov.br', '2025NE00005', 20, '', new Date(2025, 11, 7), 'escola01@seedf.gov.br', new Date(2025, 11, 8), 'fiscal@uniae.gov.br', 'Todos os itens em conformidade'],
      
      // NFs COM GLOSA
      ['NF_L006', '100006', '1', '53251233444555000188550010001000061234567006', 'Granja Ovos Frescos', '33.444.555/0001-88', 3600.00, 3240.00, 360.00, new Date(2025, 11, 6), agora, 'ATESTADA_COM_GLOSA', 'analista@uniae.gov.br', '2025NE00006', 200, 'Glosa por ovos quebrados', new Date(2025, 11, 8), 'escola01@seedf.gov.br', new Date(2025, 11, 9), 'fiscal@uniae.gov.br', 'Glosa de 10% por avarias'],
      
      // NFs REJEITADAS
      ['NF_L007', '100007', '1', '53251255666777000122550010001000071234567007', 'Carnes Nobres', '55.666.777/0001-22', 8000.00, 0, 8000.00, new Date(2025, 11, 7), agora, 'REJEITADA', 'analista@uniae.gov.br', '2025NE00007', 50, 'Temperatura inadequada', new Date(2025, 11, 9), 'escola02@seedf.gov.br', new Date(2025, 11, 10), 'fiscal@uniae.gov.br', 'Carga rejeitada - temperatura acima do permitido']
    ];
  }
};
