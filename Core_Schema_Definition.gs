/**
 * @fileoverview Definição Unificada do Schema do Banco de Dados - Alimentação Escolar CRE-PP
 * @version 6.0.0
 *
 * FONTE ÚNICA DE VERDADE para estrutura de abas e colunas.
 * Schema-Driven Architecture para o Sistema de Gestão de Alimentação Escolar.
 *
 * Este arquivo define 28+ planilhas organizadas em domínios:
 * - Cardápios e Nutrição
 * - Fornecedores e Pagamentos
 * - Operacional e Entregas
 * - Administração e Auditoria
 *
 * @author UNIAE CRE Team
 * @created 2025-12-04
 * @updated 2025-12-25 - Intervenção 1/38: Schema Centralizado Completo
 */

'use strict';

/**
 * Schema unificado do banco de dados
 * Define todas as abas, colunas e validações
 */
var SCHEMA = (function() {

  // ============================================================================
  // MAPEAMENTO DE ABAS (Nome Canônico -> Nome Real na Planilha)
  // 28 Planilhas organizadas por domínio conforme Prompt 1
  // ============================================================================

  /**
   * Mapeamento de nomes de abas
   * Chave: nome canônico usado no código
   * Valor: nome real na planilha Google Sheets
   */
  var SHEET_NAMES = {
    // =========================================================================
    // DOMÍNIO: CARDÁPIOS E NUTRIÇÃO (8 abas)
    // =========================================================================
    CARDAPIOS_BASE: 'Cardapios_Base',                     // Modelos de cardápio padrão
    CARDAPIOS_SEMANAIS: 'Cardapios_Semanais',             // Planejamento semanal
    ITENS_CARDAPIO: 'Itens_Cardapio',                     // Gêneros alimentícios
    GRUPOS_NUTRICIONAIS: 'Grupos_Nutricionais',           // Classificação PNAE
    FICHAS_TECNICAS: 'Fichas_Tecnicas',                   // Preparo e porcionamento
    METAS_NUTRICIONAIS: 'Metas_Nutricionais',             // Diretrizes nutricionais
    CARDAPIOS_ESPECIAIS: 'Cardapios_Especiais',           // NAE - Necessidades Alimentares Especiais
    ALUNOS_NECESSIDADES_ESPECIAIS: 'Alunos_Necessidades_Especiais', // Cadastro de alunos NAE
    AVALIACOES_NUTRICIONISTA: 'Avaliacoes_Nutricionista', // Pareceres nutricionais
    SUBSTITUICOES_ALIMENTOS: 'Substituicoes_Alimentos',   // Trocas autorizadas
    PARECERES_TECNICOS: 'Pareceres_Tecnicos',             // Documentos técnicos

    // =========================================================================
    // DOMÍNIO: FORNECEDORES E PAGAMENTOS (7 abas)
    // =========================================================================
    FORNECEDORES: 'Fornecedores',                         // Cadastro de fornecedores
    CERTIDOES_FORNECEDORES: 'Certidoes_Fornecedores',     // CNDs e documentos
    CONTRATOS_EMPENHO: 'Contratos_Empenho',               // Contratos e saldos
    EMPENHOS: 'Empenhos',                                 // Notas de empenho
    NOTAS_FISCAIS: 'NotasFiscais',                        // Lançamento de NFs
    PAGAMENTOS: 'Pagamentos',                             // Registro de liquidação
    GLOSAS: 'Glosas',                                     // Penalidades aplicadas

    // =========================================================================
    // DOMÍNIO: OPERACIONAL E ENTREGAS (7 abas)
    // =========================================================================
    UNIDADES_ESCOLARES: 'Unidades_Escolares',             // Cadastro de escolas
    ENTREGAS: 'Entregas',                                 // Registro de entregas
    RECEBIMENTO_GENEROS: 'Recebimento_Generos',           // Conferência na UE
    RECUSAS: 'Recusas',                                   // Devoluções
    OCORRENCIAS_DESCARTE: 'Ocorrencias_Descarte',         // Registro de sobras/desperdício
    REPOSICOES_ALIMENTOS: 'Reposicoes_Alimentos',         // Solicitações de reposição
    ESTOQUE_ESCOLAR: 'Estoque_Escolar',                   // Controle de despensa
    HORTA_ESCOLAR: 'Horta_Escolar',                       // Produção da horta da UE

    // =========================================================================
    // DOMÍNIO: PROCESSOS E WORKFLOW (4 abas)
    // =========================================================================
    PROCESSOS_ATESTO: 'Processos_Atesto',                 // Fluxo de atesto
    CONTROLE_CONFERENCIA: 'Controle_Conferencia',         // Status de conferência
    COMISSAO_MEMBROS: 'Comissao_Membros',                 // Membros da comissão
    COMISSAO_ATESTACOES: 'Comissao_Atestacoes',           // Registro de atestações

    // =========================================================================
    // DOMÍNIO: ADMINISTRAÇÃO E SISTEMA (6 abas)
    // =========================================================================
    USUARIOS: 'Usuarios',                                 // Gestão de usuários
    SESSOES: 'Sessoes',                                   // Controle de sessões
    AUDITORIA_LOG: 'Auditoria_Log',                       // Trilha de auditoria
    SYSTEM_LOGS: 'System_Logs',                           // Logs técnicos
    CONFIGURACOES: 'Configuracoes',                       // Parâmetros do sistema
    TEXTOS_PADRAO: 'Textos_Padrao',                       // Templates de texto

    // =========================================================================
    // DOMÍNIO: PLANEJAMENTO E REFERÊNCIA (4 abas)
    // =========================================================================
    PDGP: 'PDGP',                                         // Programa de Distribuição
    PDGA: 'PDGA',                                         // Programa de Aquisição
    PRODUTOS: 'Produtos',                                 // Catálogo de produtos
    PRECOS_HISTORICO: 'Precos_Historico',                 // Histórico de preços

    // =========================================================================
    // LEGADO E COMPATIBILIDADE (mantidos para migração)
    // =========================================================================
    USR_USUARIOS: 'USR_Usuarios',
    NF_NOTAS_FISCAIS: 'NF_NotasFiscais',
    NF_ITENS: 'NF_Itens',
    ESC_ESCOLAS: 'ESC_Escolas',
    FORN_FORNECEDORES: 'FORN_Fornecedores',
    CONF_CONFERENCIAS: 'CONF_Conferencias',
    REC_RECUSAS: 'REC_Recusas',
    NUT_AVALIACOES: 'NUT_Avaliacoes',
    AUD_AUDITORIA: 'AUD_Auditoria',
    CONFIG_MEMBROS_COMISSAO: 'Config_Membros_Comissao',
    NOTAS: 'Notas',
    AUDIT_LOG: 'Audit_Log',
    CADASTROS: 'Cadastros',
    INSTRUCOES: '_INSTRUCOES'
  };

  // ============================================================================
  // ALIASES PARA COMPATIBILIDADE
  // ============================================================================

  /**
   * Aliases permitem que código antigo continue funcionando
   * Mapeia nomes alternativos para o nome canônico
   */
  var SHEET_ALIASES = {
    // Aliases para Usuarios
    'USR_Usuarios': 'USUARIOS',
    'Users': 'USUARIOS',
    'usuarios': 'USUARIOS',

    // Aliases para Notas Fiscais
    'NF_NotasFiscais': 'NOTAS_FISCAIS',
    'NotasFiscais': 'NOTAS_FISCAIS',
    'Notas_Fiscais': 'NOTAS_FISCAIS',
    'notas_fiscais': 'NOTAS_FISCAIS',

    // Aliases para Fornecedores
    'FORN_Fornecedores': 'FORNECEDORES',
    'fornecedores': 'FORNECEDORES',

    // Aliases para Entregas
    'entregas': 'ENTREGAS',
    'Deliveries': 'ENTREGAS',

    // Aliases para Recusas
    'REC_Recusas': 'RECUSAS',
    'recusas': 'RECUSAS',

    // Aliases para Cardápios (novos)
    'Cardapios': 'CARDAPIOS_BASE',
    'cardapios_base': 'CARDAPIOS_BASE',
    'Menu': 'CARDAPIOS_SEMANAIS',
    'cardapios_semanais': 'CARDAPIOS_SEMANAIS',

    // Aliases para Itens
    'Itens': 'ITENS_CARDAPIO',
    'Generos': 'ITENS_CARDAPIO',
    'itens_cardapio': 'ITENS_CARDAPIO',

    // Aliases para Contratos
    'Contratos': 'CONTRATOS_EMPENHO',
    'contratos_empenho': 'CONTRATOS_EMPENHO',

    // Aliases para Pagamentos
    'pagamentos': 'PAGAMENTOS',
    'Liquidacoes': 'PAGAMENTOS',

    // Aliases para Escolas
    'Escolas': 'UNIDADES_ESCOLARES',
    'ESC_Escolas': 'UNIDADES_ESCOLARES',
    'UEs': 'UNIDADES_ESCOLARES',

    // Aliases para Estoque
    'Estoque': 'ESTOQUE_ESCOLAR',
    'Despensa': 'ESTOQUE_ESCOLAR',

    // Aliases para Sessões
    'Sessions': 'SESSOES',
    'sessoes': 'SESSOES'
  };

  // ============================================================================
  // CHAVES DE CACHE (Performance Otimizada)
  // ============================================================================

  /**
   * Chaves padronizadas para CacheService
   * Limite: 100KB por chave
   */
  var CACHE_KEYS = {
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
  };

  // ============================================================================
  // DEFINIÇÃO DE COLUNAS POR ABA
  // ============================================================================

  /**
   * Estrutura de colunas para cada aba
   * Baseado na estrutura REAL extraída de Notas.mhtml
   * Expandido com novas abas de Cardápios e Pagamentos (Intervenção 1/38)
   */
  var COLUMNS = {

    // =========================================================================
    // DOMÍNIO: CARDÁPIOS E NUTRIÇÃO
    // =========================================================================

    // --- CARDAPIOS_BASE (Modelos de cardápio padrão) ---
    CARDAPIOS_BASE: [
      'ID',
      'Nome_Cardapio',
      'Tipo',                    // Regular, Especial, Emergencial
      'Faixa_Etaria',            // Creche, Pré-escola, Fundamental, Médio
      'Periodo_Refeicao',        // Desjejum, Almoço, Lanche, Jantar
      'Itens_IDs',               // JSON array de IDs de itens
      'Valor_Calorico_Total',
      'Custo_Estimado',
      'Nutricionista_Responsavel',
      'CRN',
      'Data_Elaboracao',
      'Status',                  // Rascunho, Aprovado, Publicado, Arquivado
      'Observacoes',
      'dataCriacao',
      'dataAtualizacao'
    ],

    // --- CARDAPIOS_SEMANAIS (Planejamento por data) ---
    CARDAPIOS_SEMANAIS: [
      'ID',
      'Semana_Referencia',       // Ex: 2025-W01
      'Data_Inicio',
      'Data_Fim',
      'CRE',
      'Segunda_Cardapio_ID',
      'Terca_Cardapio_ID',
      'Quarta_Cardapio_ID',
      'Quinta_Cardapio_ID',
      'Sexta_Cardapio_ID',
      'Custo_Total_Semana',
      'Nutricionista_Aprovador',
      'Data_Aprovacao',
      'Status',                  // Planejado, Aprovado, Em Execução, Concluído
      'Observacoes',
      'dataCriacao',
      'dataAtualizacao'
    ],

    // --- ITENS_CARDAPIO (Gêneros alimentícios) ---
    ITENS_CARDAPIO: [
      'ID',
      'Codigo_Item',
      'Descricao',
      'Grupo_Nutricional_ID',    // FK para Grupos_Nutricionais
      'Unidade_Medida',
      'Porcao_Padrao',
      'Valor_Calorico',          // kcal por porção
      'Proteinas',               // g
      'Carboidratos',            // g
      'Gorduras',                // g
      'Fibras',                  // g
      'Sodio',                   // mg
      'Contem_Gluten',           // SIM/NAO
      'Contem_Lactose',          // SIM/NAO
      'Alergenos',               // JSON array
      'Preco_Referencia',
      'Fornecedor_Preferencial_ID',
      'Status',
      'dataCriacao',
      'dataAtualizacao'
    ],

    // --- GRUPOS_NUTRICIONAIS (Classificação PNAE) ---
    GRUPOS_NUTRICIONAIS: [
      'ID',
      'Nome_Grupo',
      'Descricao',
      'Cor_Identificacao',       // Para UI
      'Frequencia_Minima_Semanal',
      'Frequencia_Maxima_Semanal',
      'Percentual_VCT',          // % do Valor Calórico Total
      'Exemplos',
      'Restricoes',
      'Status',
      'dataCriacao',
      'dataAtualizacao'
    ],

    // --- FICHAS_TECNICAS (Preparo e porcionamento) ---
    FICHAS_TECNICAS: [
      'ID',
      'Item_ID',                 // FK para Itens_Cardapio
      'Nome_Preparacao',
      'Rendimento_Porcoes',
      'Tempo_Preparo_Min',
      'Modo_Preparo',            // Texto longo
      'Ingredientes',            // JSON array
      'Utensilios',
      'Temperatura_Servico',
      'Validade_Apos_Preparo',
      'Foto_URL',
      'Nutricionista_Responsavel',
      'Data_Elaboracao',
      'Status',
      'dataCriacao',
      'dataAtualizacao'
    ],

    // --- METAS_NUTRICIONAIS (Diretrizes PNAE) ---
    METAS_NUTRICIONAIS: [
      'ID',
      'Faixa_Etaria',
      'Periodo_Refeicao',
      'VCT_Minimo',              // kcal
      'VCT_Maximo',
      'Proteinas_Min_Percent',
      'Proteinas_Max_Percent',
      'Carboidratos_Min_Percent',
      'Carboidratos_Max_Percent',
      'Gorduras_Min_Percent',
      'Gorduras_Max_Percent',
      'Fibras_Min_G',
      'Sodio_Max_MG',
      'Acucar_Max_Percent',
      'Frutas_Min_Porcoes',
      'Vegetais_Min_Porcoes',
      'Vigencia_Inicio',
      'Vigencia_Fim',
      'Fonte_Normativa',
      'Status',
      'dataCriacao',
      'dataAtualizacao'
    ],

    // =========================================================================
    // DOMÍNIO: FORNECEDORES E PAGAMENTOS
    // =========================================================================

    // --- CERTIDOES_FORNECEDORES (CNDs e documentos) ---
    CERTIDOES_FORNECEDORES: [
      'ID',
      'Fornecedor_ID',           // FK para Fornecedores
      'Tipo_Certidao',           // CND Federal, Estadual, Municipal, FGTS, Trabalhista
      'Numero_Certidao',
      'Data_Emissao',
      'Data_Validade',
      'Status',                  // Válida, Vencida, Pendente
      'Arquivo_URL',
      'Verificado_Por',
      'Data_Verificacao',
      'Observacoes',
      'dataCriacao',
      'dataAtualizacao'
    ],

    // --- CONTRATOS_EMPENHO (Contratos e saldos) ---
    CONTRATOS_EMPENHO: [
      'ID',
      'Numero_Contrato',
      'Fornecedor_ID',           // FK para Fornecedores
      'Objeto',
      'Valor_Total',
      'Saldo_Disponivel',
      'Data_Assinatura',
      'Vigencia_Inicio',
      'Vigencia_Fim',
      'Modalidade_Licitacao',
      'Numero_Processo_SEI',
      'Gestor_Contrato',
      'Fiscal_Contrato',
      'Status',                  // Vigente, Encerrado, Suspenso
      'Alerta_90_Percent',       // Flag para alerta de saldo
      'Observacoes',
      'dataCriacao',
      'dataAtualizacao'
    ],

    // --- PAGAMENTOS (Registro de liquidação) ---
    PAGAMENTOS: [
      'ID',
      'Nota_Fiscal_ID',          // FK para Notas_Fiscais
      'Processo_Atesto_ID',      // FK para Processos_Atesto
      'Empenho_ID',              // FK para Empenhos
      'Valor_Bruto',
      'Valor_Glosas',
      'Valor_Liquido',
      'Data_Liquidacao',
      'Numero_OB',               // Ordem Bancária
      'Data_Pagamento',
      'Banco',
      'Agencia',
      'Conta',
      'Responsavel_Liquidacao',
      'Status',                  // Pendente, Liquidado, Pago, Estornado
      'Observacoes',
      'dataCriacao',
      'dataAtualizacao'
    ],

    // =========================================================================
    // DOMÍNIO: OPERACIONAL E ENTREGAS
    // =========================================================================

    // --- ESTOQUE_ESCOLAR (Controle de despensa) ---
    ESTOQUE_ESCOLAR: [
      'ID',
      'Unidade_Escolar_ID',      // FK para Unidades_Escolares
      'Item_ID',                 // FK para Itens_Cardapio
      'Quantidade_Atual',
      'Unidade_Medida',
      'Lote',
      'Data_Validade',
      'Data_Ultima_Entrada',
      'Data_Ultima_Saida',
      'Quantidade_Minima',       // Para alerta de reposição
      'Localizacao_Armazem',
      'Responsavel_Atualizacao',
      'Status',                  // Normal, Baixo, Crítico, Vencido
      'Origem_Horta_Propria',    // S/N — indica se o item veio da horta da UE
      'Quantidade_Horta_Entrada',// Quantidade originada da última colheita da horta
      'Data_Ultima_Colheita',    // Data da colheita que gerou a entrada no estoque
      'Observacoes',
      'dataCriacao',
      'dataAtualizacao'
    ],

    // --- HORTA_ESCOLAR (Produção da horta da Unidade Escolar) ---
    HORTA_ESCOLAR: [
      'ID',
      'Unidade_Escolar_ID',      // FK para Unidades_Escolares
      'Produto_Nome',            // Nome do produto colhido
      'Item_ID',                 // FK para Itens_Cardapio (opcional)
      'Quantidade_Colhida',      // Quantidade colhida na data
      'Unidade_Medida',          // kg, unidade, maço etc.
      'Data_Colheita',           // Data efetiva da colheita
      'Responsavel_Colheita',    // Servidor ou responsável pelo registro
      'Destino_Producao',        // Cardapio_Dia | Estoque | Descarte
      'Status_Aprovacao',        // Pendente | Aprovado | Reprovado
      'Responsavel_Aprovacao',   // Nutricionista ou gestor que aprovou
      'Data_Aprovacao',          // Data da aprovação para uso
      'Lote_Estoque_ID',         // FK para Estoque_Escolar gerado (se aplicável)
      'Observacoes',
      'dataCriacao',
      'dataAtualizacao'
    ],

    // --- SESSOES (Controle de sessões de usuário) ---
    SESSOES: [
      'ID',
      'Usuario_ID',              // FK para Usuarios
      'Token_Sessao',
      'Data_Inicio',
      'Data_Expiracao',
      'IP_Origem',
      'User_Agent',
      'Dispositivo',             // Desktop, Mobile, Tablet
      'Status',                  // Ativa, Expirada, Encerrada
      'Data_Ultimo_Acesso',
      'dataCriacao'
    ],

    // --- PRECOS_HISTORICO (Histórico de preços para análise) ---
    PRECOS_HISTORICO: [
      'ID',
      'Item_ID',                 // FK para Itens_Cardapio
      'Fornecedor_ID',           // FK para Fornecedores
      'Contrato_ID',             // FK para Contratos_Empenho
      'Preco_Unitario',
      'Data_Vigencia_Inicio',
      'Data_Vigencia_Fim',
      'Indice_Reajuste',
      'Preco_CEASA_Referencia',  // Para comparativo
      'Variacao_Mercado_Percent',
      'Fonte_Dados',
      'Observacoes',
      'dataCriacao'
    ],

    // =========================================================================
    // ESTRUTURAS EXISTENTES (mantidas e organizadas)
    // =========================================================================

    // --- USUARIOS (Estrutura Simples) ---
    // NOTA: Use USUARIOS_SCHEMA de Core_Schema_Usuarios.gs como fonte única de verdade
    USUARIOS: (typeof USUARIOS_SCHEMA !== 'undefined') 
      ? USUARIOS_SCHEMA.HEADERS 
      : [
        'email', 'nome', 'senha', 'tipo', 'instituicao', 'telefone', 'cpf', 'cnpj',
        'ativo', 'dataCriacao', 'dataAtualizacao', 'ultimoAcesso', 'token'
      ],

    // --- USR_USUARIOS (Estrutura Prefixada) ---
    // Arquitetura 100% digital: senha em texto plano
    USR_USUARIOS: [
      'ID',
      'Email',
      'Nome_Completo',
      'Senha', // Texto plano - arquitetura 100% digital
      'Tipo_Usuario',
      'Unidade_Vinculada',
      'Status',
      'Data_Cadastro',
      'Ultimo_Acesso',
      'Telefone',
      'CPF',
      'Criado_Por',
      'Data_Atualizacao'
    ],

    // --- NOTAS_FISCAIS (Estrutura Simples) ---
    NOTAS_FISCAIS: [
      'ID',
      'Numero_NF',
      'Chave_Acesso',
      'Data_Emissao',
      'Data_Recebimento',
      'CNPJ_Fornecedor',
      'Fornecedor',
      'Nota_Empenho',
      'Valor_Total',
      'Status_NF',
      'Responsavel_Conferencia',
      'Data_Conferencia',
      'Observacoes',
      'Arquivo_PDF',
      'Processo_Atesto_ID',
      'Data_Registro',
      'dataAtualizacao'
    ],

    // --- ENTREGAS ---
    ENTREGAS: [
      'ID',
      'Data_Entrega',
      'Unidade_Escolar',
      'Fornecedor',
      'Produto_Codigo',
      'Produto_Descricao',
      'Quantidade_Solicitada',
      'Quantidade_Entregue',
      'Unidade_Medida',
      'Valor_Unitario',
      'Valor_Total',
      'Status_Entrega',
      'Qualidade_OK',
      'Responsavel_Recebimento',
      'Observacoes',
      'PDGP_Referencia'
    ],

    // --- FORNECEDORES ---
    FORNECEDORES: [
      'ID',
      'CNPJ',
      'Razao_Social',
      'Nome_Fantasia',
      'Endereco',
      'Cidade',
      'Estado',
      'CEP',
      'Telefone',
      'Email',
      'Contato_Nome',
      'Status',
      'Data_Cadastro'
    ],

    // --- RECUSAS ---
    RECUSAS: [
      'ID',
      'Nota_Fiscal_ID',
      'Data_Recusa',
      'Motivo',
      'Descricao',
      'Produto',
      'Quantidade_Recusada',
      'Valor_Recusado',
      'Responsavel',
      'Status',
      'Resolucao',
      'Data_Resolucao'
    ],

    // --- GLOSAS ---
    GLOSAS: [
      'ID',
      'Nota_Fiscal_ID',
      'Tipo_Glosa',
      'Motivo',
      'Valor_Glosado',
      'Data_Glosa',
      'Responsavel',
      'Status',
      'Justificativa'
    ],

    // --- REPOSICOES_ALIMENTOS ---
    REPOSICOES_ALIMENTOS: [
      'ID',
      'Notificacao_ID',
      'Tipo',
      'Data',
      'Produto_Original',
      'Produto_Reposto',
      'Quantidade',
      'Status',
      'Equivalencia_Verificada',
      'Observacoes'
    ],

    // --- PROCESSOS_ATESTO ---
    PROCESSOS_ATESTO: [
      'ID',
      'Numero_Processo_SEI',
      'Data_Abertura',
      'Status',
      'Notas_Fiscais_IDs',
      'Valor_Total',
      'Responsavel_UNIAE',
      'Data_Atesto',
      'Observacoes'
    ],

    // --- COMISSAO_MEMBROS ---
    COMISSAO_MEMBROS: [
      'ID',
      'Nome',
      'Matricula',
      'Cargo',
      'Funcao_Comissao',
      'Data_Inicio',
      'Data_Fim',
      'Status',
      'Portaria'
    ],

    // --- COMISSAO_ATESTACOES ---
    COMISSAO_ATESTACOES: [
      'ID',
      'Processo_ID',
      'Data_Atestacao',
      'Membro1_ID',
      'Membro1_Assinatura',
      'Membro2_ID',
      'Membro2_Assinatura',
      'Membro3_ID',
      'Membro3_Assinatura',
      'Status',
      'Observacoes'
    ],

    // --- PROCESSOS_ATESTO ---
    PROCESSOS_ATESTO: [
      'ID',
      'Numero_Processo_SEI',
      'Data_Abertura',
      'Status',
      'Notas_Fiscais_IDs',
      'Valor_Total',
      'Responsavel_UNIAE',
      'Data_Atesto',
      'Observacoes',
      'Data_Criacao',
      'Data_Atualizacao'
    ],

    // --- AUDITORIA_LOG ---
    AUDITORIA_LOG: [
      'ID',
      'Data_Hora',
      'Usuario',
      'Acao',
      'Tabela',
      'Registro_ID',
      'Dados_Anteriores',
      'Dados_Novos',
      'IP'
    ],

    // --- SYSTEM_LOGS ---
    SYSTEM_LOGS: [
      'ID',
      'Timestamp',
      'Level',
      'Module',
      'Message',
      'Details',
      'User',
      'Session_ID'
    ],
    
    // --- CARDAPIOS_ESPECIAIS ---
    CARDAPIOS_ESPECIAIS: [
      'ID',
      'Data_Criacao',
      'Tipo_Cardapio',
      'Patologia_Dieta',
      'Nome_Cardapio',
      'Descricao',
      'Elaborado_Por',
      'Nutricionista_Responsavel',
      'Periodo_Vigencia',
      'Refeicoes',
      'Substituicoes',
      'Observacoes',
      'Status',
      'dataCriacao',
      'dataAtualizacao'
    ],
    
    // --- AVALIACOES_NUTRICIONISTA ---
    AVALIACOES_NUTRICIONISTA: [
      'ID',
      'Data_Avaliacao',
      'Cardapio_ID',
      'Aluno',
      'Escola',
      'Tipo_Restricao',
      'Nutricionista',
      'CRN',
      'Parecer',
      'Recomendacoes',
      'Decisao',
      'Proxima_Reavaliacao',
      'Observacoes',
      'Status',
      'dataCriacao',
      'dataAtualizacao'
    ],
    
    // --- SUBSTITUICOES_ALIMENTOS ---
    SUBSTITUICOES_ALIMENTOS: [
      'ID',
      'Data_Solicitacao',
      'Escola',
      'Produto_Original',
      'Produto_Substituto',
      'Motivo',
      'Solicitante',
      'Nutricionista_Avaliador',
      'Data_Avaliacao',
      'Parecer_Nutricional',
      'Equivalencia_Nutricional',
      'Status',
      'Observacoes',
      'dataCriacao',
      'dataAtualizacao'
    ],
    
    // --- PARECERES_TECNICOS ---
    PARECERES_TECNICOS: [
      'ID',
      'Data_Emissao',
      'Tipo',
      'Assunto',
      'Referencia',
      'Parecer',
      'Conclusao',
      'Recomendacoes',
      'Nutricionista',
      'CRN',
      'Status',
      'dataCriacao',
      'dataAtualizacao'
    ],
    
    // --- OCORRENCIAS_DESCARTE ---
    OCORRENCIAS_DESCARTE: [
      'ID',
      'Data_Ocorrencia',
      'Escola',
      'Produto',
      'Quantidade',
      'Unidade',
      'Motivo_Descarte',
      'Lote',
      'Validade',
      'Fornecedor',
      'NF_Referencia',
      'Responsavel_Registro',
      'Nutricionista_Validacao',
      'Data_Validacao',
      'Parecer_Nutricional',
      'Acao_Corretiva',
      'Status',
      'Observacoes',
      'dataCriacao',
      'dataAtualizacao'
    ],
    
    // --- ALUNOS_NECESSIDADES_ESPECIAIS ---
    ALUNOS_NECESSIDADES_ESPECIAIS: [
      'ID',
      'Data_Cadastro',
      'Nome_Completo',
      'Data_Nascimento',
      'Unidade_Escolar',
      'CRE',
      'Serie_Turma',
      'Turno',
      'Tipo_Necessidade',
      'Patologia_Dieta',
      'Patologia_Secundaria',
      'Restricoes',
      'Possui_Laudo',
      'Data_Laudo',
      'Validade_Laudo',
      'Link_Laudo_SEI',
      'CID10',
      'Consistencia',
      'Observacoes',
      'Responsavel_Cadastro',
      'Status'
    ]
  };

  // ============================================================================
  // VALIDAÇÕES
  // ============================================================================

  var VALIDATIONS = {
    // =========================================================================
    // VALIDAÇÕES: CARDÁPIOS E NUTRIÇÃO
    // =========================================================================
    CARDAPIOS_BASE: {
      Tipo: ['REGULAR', 'ESPECIAL', 'EMERGENCIAL'],
      Faixa_Etaria: ['CRECHE', 'PRE_ESCOLA', 'FUNDAMENTAL_I', 'FUNDAMENTAL_II', 'MEDIO', 'EJA'],
      Periodo_Refeicao: ['DESJEJUM', 'COLACAO', 'ALMOCO', 'LANCHE', 'JANTAR', 'CEIA'],
      Status: ['RASCUNHO', 'EM_REVISAO', 'APROVADO', 'PUBLICADO', 'ARQUIVADO']
    },
    CARDAPIOS_SEMANAIS: {
      Status: ['PLANEJADO', 'APROVADO', 'EM_EXECUCAO', 'CONCLUIDO', 'CANCELADO']
    },
    ITENS_CARDAPIO: {
      Unidade_Medida: ['KG', 'G', 'L', 'ML', 'UN', 'PCT', 'CX', 'DZ'],
      Contem_Gluten: ['SIM', 'NAO'],
      Contem_Lactose: ['SIM', 'NAO'],
      Status: ['ATIVO', 'INATIVO', 'DESCONTINUADO']
    },
    GRUPOS_NUTRICIONAIS: {
      Status: ['ATIVO', 'INATIVO']
    },
    FICHAS_TECNICAS: {
      Status: ['RASCUNHO', 'APROVADA', 'ARQUIVADA']
    },
    METAS_NUTRICIONAIS: {
      Faixa_Etaria: ['CRECHE', 'PRE_ESCOLA', 'FUNDAMENTAL_I', 'FUNDAMENTAL_II', 'MEDIO', 'EJA'],
      Periodo_Refeicao: ['DESJEJUM', 'COLACAO', 'ALMOCO', 'LANCHE', 'JANTAR', 'CEIA'],
      Status: ['VIGENTE', 'REVOGADA']
    },

    // =========================================================================
    // VALIDAÇÕES: FORNECEDORES E PAGAMENTOS
    // =========================================================================
    CERTIDOES_FORNECEDORES: {
      Tipo_Certidao: ['CND_FEDERAL', 'CND_ESTADUAL', 'CND_MUNICIPAL', 'CRF_FGTS', 'CNDT_TRABALHISTA', 'SICAF'],
      Status: ['VALIDA', 'VENCIDA', 'PENDENTE', 'IRREGULAR']
    },
    CONTRATOS_EMPENHO: {
      Modalidade_Licitacao: ['PREGAO_ELETRONICO', 'PREGAO_PRESENCIAL', 'CONCORRENCIA', 'TOMADA_PRECOS', 'CONVITE', 'DISPENSA', 'INEXIGIBILIDADE', 'CHAMADA_PUBLICA'],
      Status: ['VIGENTE', 'ENCERRADO', 'SUSPENSO', 'RESCINDIDO']
    },
    PAGAMENTOS: {
      Status: ['PENDENTE', 'EM_PROCESSAMENTO', 'LIQUIDADO', 'PAGO', 'ESTORNADO', 'CANCELADO']
    },

    // =========================================================================
    // VALIDAÇÕES: OPERACIONAL
    // =========================================================================
    ESTOQUE_ESCOLAR: {
      Status: ['NORMAL', 'BAIXO', 'CRITICO', 'VENCIDO', 'BLOQUEADO']
    },
    SESSOES: {
      Dispositivo: ['DESKTOP', 'MOBILE', 'TABLET'],
      Status: ['ATIVA', 'EXPIRADA', 'ENCERRADA', 'BLOQUEADA']
    },

    // =========================================================================
    // VALIDAÇÕES EXISTENTES (mantidas)
    // =========================================================================
    USUARIOS: {
      Status: ['ATIVO', 'INATIVO', 'BLOQUEADO'],
      Perfil: ['ANALISTA', 'REPRESENTANTE', 'FORNECEDOR', 'NUTRICIONISTA', 'ADMIN']
    },
    USR_USUARIOS: {
      Tipo_Usuario: ['ANALISTA', 'ESCOLA', 'FORNECEDOR', 'NUTRICIONISTA'],
      Status: ['ATIVO', 'INATIVO', 'BLOQUEADO']
    },
    NOTAS_FISCAIS: {
      Status_NF: ['PENDENTE', 'RECEBIDA', 'CONFERIDA', 'ATESTADA', 'APROVADA', 'REJEITADA', 'CANCELADA']
    },
    ENTREGAS: {
      Status_Entrega: ['AGENDADA', 'EM_TRANSITO', 'ENTREGUE', 'PARCIAL', 'RECUSADA', 'CANCELADA'],
      Qualidade_OK: ['SIM', 'NAO', 'PARCIAL']
    },
    FORNECEDORES: {
      Status: ['ATIVO', 'INATIVO', 'BLOQUEADO', 'SUSPENSO']
    },
    RECUSAS: {
      Status: ['PENDENTE', 'ACEITA', 'CONTESTADA', 'RESOLVIDA'],
      Motivo: [
        'TEMPERATURA_INADEQUADA',
        'EMBALAGEM_VIOLADA',
        'PRODUTO_VENCIDO',
        'VALIDADE_INSUFICIENTE',
        'CARACTERISTICAS_ALTERADAS',
        'QUANTIDADE_DIVERGENTE',
        'PRODUTO_DIFERENTE',
        'PRESENCA_PRAGAS',
        'SEM_ROTULAGEM',
        'TRANSPORTE_INADEQUADO',
        'OUTROS'
      ]
    },
    GLOSAS: {
      Tipo_Glosa: ['PRECO', 'QUANTIDADE', 'QUALIDADE', 'CONTRATUAL', 'FISCAL'],
      Status: ['PENDENTE', 'APLICADA', 'CONTESTADA', 'CANCELADA']
    },
    PROCESSOS_ATESTO: {
      Status: ['ABERTO', 'EM_ANALISE', 'ATESTADO', 'LIQUIDADO', 'PAGO', 'CANCELADO']
    },
    CARDAPIOS_ESPECIAIS: {
      Tipo_Cardapio: ['PATOLOGIA', 'DIETA', 'CONSISTENCIA'],
      Status: ['ATIVO', 'INATIVO', 'EM_REVISAO', 'SUSPENSO']
    },
    AVALIACOES_NUTRICIONISTA: {
      Decisao: ['APROVADO', 'REPROVADO', 'REVISAO'],
      Status: ['RASCUNHO', 'EMITIDO', 'ARQUIVADO']
    },
    SUBSTITUICOES_ALIMENTOS: {
      Status: ['PENDENTE', 'APROVADO', 'REJEITADO'],
      Equivalencia_Nutricional: ['SIM', 'NAO', 'PARCIAL']
    },
    PARECERES_TECNICOS: {
      Tipo: ['PRODUTO', 'FORNECEDOR', 'CARDAPIO', 'SUBSTITUICAO', 'OUTRO'],
      Conclusao: ['FAVORAVEL', 'FAVORAVEL_COM_RESSALVAS', 'DESFAVORAVEL'],
      Status: ['RASCUNHO', 'EMITIDO', 'ARQUIVADO']
    },
    OCORRENCIAS_DESCARTE: {
      Motivo_Descarte: ['VALIDADE_VENCIDA', 'CARACTERISTICAS_ALTERADAS', 'EMBALAGEM_VIOLADA', 'TEMPERATURA_INADEQUADA', 'CONTAMINACAO', 'OUTROS'],
      Status: ['PENDENTE', 'VALIDADO', 'REJEITADO']
    },
    ALUNOS_NECESSIDADES_ESPECIAIS: {
      Tipo_Necessidade: ['PATOLOGIA', 'DIETA', 'OUTRA'],
      Consistencia: ['NORMAL', 'PICADO', 'MOIDO', 'AMASSADO', 'PURE', 'LIQUIDO'],
      Status: ['ATIVO', 'INATIVO', 'LAUDO_VENCIDO']
    }
  };

  // ============================================================================
  // FUNÇÕES PÚBLICAS
  // ============================================================================

  return {
    /**
     * Obtém o nome real da aba na planilha
     * @param {string} canonicalName - Nome canônico ou alias
     * @returns {string} Nome real da aba
     */
    getSheetName: function(canonicalName) {
      // Verifica se é um alias
      if (SHEET_ALIASES[canonicalName]) {
        canonicalName = SHEET_ALIASES[canonicalName];
      }

      // Retorna o nome real ou o próprio nome se não encontrado
      return SHEET_NAMES[canonicalName] || canonicalName;
    },

    /**
     * Obtém as colunas de uma aba
     * @param {string} sheetName - Nome da aba (canônico ou real)
     * @returns {Array<string>} Lista de colunas
     */
    getColumns: function(sheetName) {
      // Normaliza o nome
      var canonical = this.getCanonicalName(sheetName);
      return COLUMNS[canonical] || [];
    },

    /**
     * Obtém o nome canônico a partir de qualquer nome
     * @param {string} name - Nome da aba (qualquer formato)
     * @returns {string} Nome canônico
     */
    getCanonicalName: function(name) {
      // Se já é canônico
      if (SHEET_NAMES[name]) {
        return name;
      }

      // Se é um alias
      if (SHEET_ALIASES[name]) {
        return SHEET_ALIASES[name];
      }

      // Busca pelo valor (nome real)
      for (var key in SHEET_NAMES) {
        if (SHEET_NAMES[key] === name) {
          return key;
        }
      }

      return name;
    },

    /**
     * Obtém validações para uma aba
     * @param {string} sheetName - Nome da aba
     * @returns {Object} Objeto com validações por coluna
     */
    getValidations: function(sheetName) {
      var canonical = this.getCanonicalName(sheetName);
      return VALIDATIONS[canonical] || {};
    },

    /**
     * Obtém índice de uma coluna
     * @param {string} sheetName - Nome da aba
     * @param {string} columnName - Nome da coluna
     * @returns {number} Índice (0-based) ou -1 se não encontrado
     */
    getColumnIndex: function(sheetName, columnName) {
      var columns = this.getColumns(sheetName);
      return columns.indexOf(columnName);
    },

    /**
     * Verifica se uma aba existe no schema
     * @param {string} sheetName - Nome da aba
     * @returns {boolean}
     */
    sheetExists: function(sheetName) {
      return !!this.getCanonicalName(sheetName);
    },

    /**
     * Lista todas as abas definidas
     * @returns {Array<string>} Lista de nomes reais das abas
     */
    listAllSheets: function() {
      try {
        var sheets = [];
        for (var key in SHEET_NAMES) {
          sheets.push(SHEET_NAMES[key]);
        }
        return sheets;
      } catch (error) {
        Logger.log("Erro em listAllSheets: " + error.message);
        throw error;
      }
    },

    /**
     * Exporta o schema completo (para debug/documentação)
     * @returns {Object}
     */
    exportSchema: function() {
      return {
        sheets: SHEET_NAMES,
        aliases: SHEET_ALIASES,
        columns: COLUMNS,
        validations: VALIDATIONS
      };
    },

    // Constantes expostas
    SHEET_NAMES: SHEET_NAMES,
    COLUMNS: COLUMNS,
    VALIDATIONS: VALIDATIONS,
    CACHE_KEYS: CACHE_KEYS,
    SHEET_ALIASES: SHEET_ALIASES
  };
})();

// ============================================================================
// FUNÇÕES AUXILIARES GLOBAIS (Intervenção 1/38)
// ============================================================================

/**
 * Obtém chave de cache padronizada
 * @param {string} keyType - Tipo da chave (de CACHE_KEYS)
 * @param {string} [suffix] - Sufixo opcional (ex: ID do usuário)
 * @returns {string} Chave formatada
 */
function getCacheKey(keyType, suffix) {
  var baseKey = SCHEMA.CACHE_KEYS[keyType] || keyType;
  return suffix ? baseKey + suffix : baseKey;
}

/**
 * Verifica se uma aba pertence a um domínio específico
 * @param {string} sheetName - Nome da aba
 * @param {string} domain - Domínio (CARDAPIOS, FORNECEDORES, OPERACIONAL, ADMIN)
 * @returns {boolean}
 */
function isSheetInDomain(sheetName, domain) {
  var domains = {
    CARDAPIOS: ['CARDAPIOS_BASE', 'CARDAPIOS_SEMANAIS', 'ITENS_CARDAPIO', 'GRUPOS_NUTRICIONAIS', 
                'FICHAS_TECNICAS', 'METAS_NUTRICIONAIS', 'CARDAPIOS_ESPECIAIS', 
                'ALUNOS_NECESSIDADES_ESPECIAIS', 'AVALIACOES_NUTRICIONISTA', 
                'SUBSTITUICOES_ALIMENTOS', 'PARECERES_TECNICOS'],
    FORNECEDORES: ['FORNECEDORES', 'CERTIDOES_FORNECEDORES', 'CONTRATOS_EMPENHO', 
                   'EMPENHOS', 'NOTAS_FISCAIS', 'PAGAMENTOS', 'GLOSAS'],
    OPERACIONAL: ['UNIDADES_ESCOLARES', 'ENTREGAS', 'RECEBIMENTO_GENEROS', 'RECUSAS',
                  'OCORRENCIAS_DESCARTE', 'REPOSICOES_ALIMENTOS', 'ESTOQUE_ESCOLAR'],
    ADMIN: ['USUARIOS', 'SESSOES', 'AUDITORIA_LOG', 'SYSTEM_LOGS', 'CONFIGURACOES', 'TEXTOS_PADRAO']
  };
  
  var canonical = SCHEMA.getCanonicalName(sheetName);
  return domains[domain] ? domains[domain].indexOf(canonical) !== -1 : false;
}

/**
 * Lista todas as abas de um domínio
 * @param {string} domain - Domínio
 * @returns {Array<string>} Nomes reais das abas
 */
function getSheetsByDomain(domain) {
  try {
    var domains = {
      CARDAPIOS: ['CARDAPIOS_BASE', 'CARDAPIOS_SEMANAIS', 'ITENS_CARDAPIO', 'GRUPOS_NUTRICIONAIS', 
                  'FICHAS_TECNICAS', 'METAS_NUTRICIONAIS', 'CARDAPIOS_ESPECIAIS', 
                  'ALUNOS_NECESSIDADES_ESPECIAIS', 'AVALIACOES_NUTRICIONISTA', 
                  'SUBSTITUICOES_ALIMENTOS', 'PARECERES_TECNICOS'],
      FORNECEDORES: ['FORNECEDORES', 'CERTIDOES_FORNECEDORES', 'CONTRATOS_EMPENHO', 
                     'EMPENHOS', 'NOTAS_FISCAIS', 'PAGAMENTOS', 'GLOSAS'],
      OPERACIONAL: ['UNIDADES_ESCOLARES', 'ENTREGAS', 'RECEBIMENTO_GENEROS', 'RECUSAS',
                    'OCORRENCIAS_DESCARTE', 'REPOSICOES_ALIMENTOS', 'ESTOQUE_ESCOLAR'],
      ADMIN: ['USUARIOS', 'SESSOES', 'AUDITORIA_LOG', 'SYSTEM_LOGS', 'CONFIGURACOES', 'TEXTOS_PADRAO']
    };
  
    if (!domains[domain]) return [];
  
    return domains[domain].map(function(canonical) {
      return SCHEMA.getSheetName(canonical);
    });
  } catch (error) {
    Logger.log("Erro em getSheetsByDomain: " + error.message);
    throw error;
  }
}
