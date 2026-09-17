/**
 * @fileoverview Índice e Mapa do Projeto UNIAE CRE
 * @version 6.0.0
 *
 * Este arquivo documenta a estrutura do projeto e a ordem de carregamento.
 * NÃO CONTÉM CÓDIGO EXECUTÁVEL - apenas documentação.
 *
 * @author UNIAE CRE Team
 * @created 2025-12-04
 * @updated 2025-12-08 - Adicionados módulos de resiliência e observabilidade
 */

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ESTRUTURA DO PROJETO UNIAE CRE - SISTEMA DE ALIMENTAÇÃO ESCOLAR
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ORDEM DE CARREGAMENTO (Google Apps Script carrega em ordem alfabética):
 *
 * 1. 0_Core_Safe_Globals.gs    - Fallbacks e funções globais essenciais
 * 2. 0_Project_Index.gs        - Este arquivo (documentação)
 * 3. _DIAGNOSTIC_Tools.gs      - Ferramentas de diagnóstico
 * 4. _INIT_Bootstrap.gs        - Bootstrap do sistema
 * 5. _INIT_Main.gs             - Ponto de entrada principal (doGet)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * MÓDULOS CORE (Núcleo do Sistema)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * CONFIGURAÇÃO E CONSTANTES:
 * - Core_Config.gs             - Configurações gerais
 * - Core_Constants.gs          - Constantes do sistema (STATUS, LIMITES, etc.)
 * - Core_Schema_Definition.gs  - Definição do schema do banco (FONTE ÚNICA)
 * - Core_Feature_Flags.gs      - [NOVO] Feature flags para deploy gradual
 *
 * ACESSO A DADOS:
 * - Core_Sheet_Accessor.gs     - Acesso unificado às planilhas
 * - Core_CRUD.gs               - Operações CRUD básicas
 * - Core_Batch_Operations.gs   - Operações em lote otimizadas
 * - Core_Query_Optimizer.gs    - Otimização de consultas com índices
 * - Core_Transaction.gs        - [NOVO] Transações e operações atômicas
 * - Core_Data_Integrity.gs     - [NOVO] Validação de integridade referencial
 * - Core_Migrations.gs         - [NOVO] Versionamento de schema
 *
 * AUTENTICAÇÃO E SEGURANÇA:
 * - Core_Auth_Unified.gs       - [NOVO] Sistema de autenticação UNIFICADO (AuthService)
 * - Core_Auth.gs               - Sistema de autenticação (legado, delega para AuthService)
 * - Core_Auth_PlainText.gs     - Autenticação texto plano (legado, delega para AuthService)
 * - Core_Seguranca.gs          - Funções de segurança
 * - Core_Rate_Limiter.gs       - Controle de taxa de requisições
 *
 * VALIDAÇÃO:
 * - Core_Validation_Utils.gs   - Utilitários de validação unificados
 * - Core_Input_Validation.gs   - Validação de entrada
 *
 * PERFORMANCE E COTAS:
 * - Core_Quota_Manager.gs      - Gerenciamento de cotas do GAS
 * - Core_Cache.gs              - Sistema de cache
 * - Core_Metrics.gs            - [NOVO] Métricas e profiling avançado
 *
 * RESILIÊNCIA:
 * - Core_Retry_Strategy.gs     - [NOVO] Retry com backoff exponencial
 * - Core_Error.gs              - Tratamento de erros unificado
 *
 * LOGGING E OBSERVABILIDADE:
 * - Core_Logger.gs             - Sistema de logging
 * - Core_Event_Bus.gs          - [NOVO] Sistema de eventos (Pub/Sub)
 * - Core_Health_Check.gs       - Diagnóstico e monitoramento
 *
 * API E COMUNICAÇÃO:
 * - Core_API_Response.gs       - [NOVO] Padrão de resposta de API
 * - Core_Service_Container.gs  - [NOVO] Injeção de dependências
 *
 * UTILITÁRIOS:
 * - Core_Utils.gs              - Utilitários gerais
 * - Core_Function_Fixes.gs     - Correções de funções problemáticas
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * MÓDULOS DE DOMÍNIO (Regras de Negócio)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * - Dominio_NotasFiscais.gs    - Lógica de notas fiscais
 * - Dominio_Fornecedores.gs    - Lógica de fornecedores
 * - Dominio_Recebimento.gs     - Lógica de recebimento
 * - Dominio_Recusas.gs         - Lógica de recusas
 * - Dominio_PDGP.gs            - Plano de Distribuição
 * - Dominio_Nutricao.gs        - Lógica nutricional
 * - Dominio_Educacao.gs        - Lógica educacional
 * - Dominio_Empenhos.gs        - Lógica de empenhos
 * - Dominio_Analises.gs        - Análises e relatórios
 * - Dominio_Relatorios.gs      - Geração de relatórios
 * - Dominio_Documentos.gs      - Gestão de documentos
 * - Dominio_Legal.gs           - Aspectos legais
 * - Dominio_Pesquisa.gs        - Funcionalidades de pesquisa
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * MÓDULOS DE INFRAESTRUTURA
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * - Infra_API.gs               - APIs externas
 * - Infra_Configuracao.gs      - Configuração de infraestrutura
 * - Infra_Drive.gs             - Integração com Google Drive
 * - Infra_Sheets.gs            - Integração com Google Sheets
 * - Infra_Notificacoes.gs      - Sistema de notificações
 * - Infra_Relatorios.gs        - Infraestrutura de relatórios
 * - Infra_Testes.gs            - Infraestrutura de testes
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * MÓDULOS DE INTERFACE (UI)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * BACKEND:
 * - UI_Dashboard.gs            - Backend do dashboard
 * - UI_CRUD.gs                 - Backend CRUD
 * - UI_Menu.gs                 - Menus do sistema
 * - UI_WebApp.gs               - Web App handlers
 * - UI_Auth_Functions.gs       - Funções de autenticação UI
 *
 * FRONTEND (HTML):
 * - index.html                 - Página principal
 * - UI_Login.html              - Tela de login
 * - UI_Login_Mobile.html       - Login mobile
 * - UI_Dashboard_Intuitivo.html - Dashboard principal
 * - UI_Processo_SEI.html       - Gestão de processos SEI
 * - UI_CRUD_Page.html          - Página CRUD genérica
 * - UI_Atesto_Principal.html   - Tela de atesto
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * MÓDULOS ESPECÍFICOS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * - Core_Processo_SEI.gs       - Gestão de processos SEI
 * - Core_Email_Config.gs       - Configuração de email
 * - Core_Workflow_Atesto.gs    - Workflow de atesto
 * - Core_Cardapios_Especiais.gs - Cardápios especiais
 * - Core_Notificacao_Alimentos.gs - Notificações de alimentos
 * - Ajustes_Realidade_DF.gs    - Ajustes específicos do DF
 * - Validacoes_Especificas_DF.gs - Validações do DF
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * SETUP E CONFIGURAÇÃO
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * - Setup_Simples.gs           - Setup simplificado (RECOMENDADO)
 * - Setup_Database_Structure.gs - Estrutura do banco
 * - Setup_Usuarios_DF.gs       - Usuários padrão do DF
 * - Setup_Initial.gs           - Setup inicial
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * TESTES
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * - Test_Intervencao_3.gs      - Testes de Auth e UI Safe
 * - Test_Intervencao_5.gs      - Testes de Validação
 * - Test_Intervencao_6.gs      - Testes de Cotas
 * - Test_Auth_System.gs        - Testes de autenticação
 * - Test_Dados_Sinteticos.gs   - Dados sintéticos para teste
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ARQUIVOS LEGADOS (Manter para compatibilidade)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * - Core_Legacy_Aliases.gs     - Aliases para código antigo
 * - Core_Deduplication_Fix.gs  - Correções de duplicação
 * - Core_Fix_GetDataRange.gs   - Correções de getDataRange
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ARQUIVOS LEGADOS (Mantidos para compatibilidade)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * - Core_Auth_PlainText.gs     → Delega para Core_Auth_Unified.gs
 * - Core_Auth.gs               → Delega para Core_Auth_Unified.gs
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * LIMPEZA REALIZADA (2025-12-19)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Arquivos removidos por serem duplicados/obsoletos:
 * - Core_Batch_Optimizer.gs (usar Core_Batch_Operations.gs)
 * - Core_Quota.gs (usar Core_Quota_Manager.gs)
 * - Core_Cache_Advanced.gs (usar Core_Unified_Cache.gs)
 * - Core_Operacoes.gs (usar Core_Operacoes_Safe.gs)
 * - Core_PAE_Integration.gs (usar Core_PAE_Integration_Safe.gs)
 * - Core_Integracao.gs, Core_Dados.gs, Core_Seguranca.gs, Core_Validacao.gs
 * - 0_Core_Utils.gs
 * - Docs_*.gs, EXAMPLE_*.gs, EXEMPLO_*.gs (arquivos de exemplo)
 * - Test_Intervencao_*.gs (testes de debugging pontual)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

// Este arquivo é apenas documentação - não contém código executável
Logger.log('📚 0_Project_Index.gs carregado - Documentação do projeto');
