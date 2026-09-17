/**
 * @fileoverview Padrões de Código e Guia de Estilo - UNIAE CRE
 * @version 1.0.0
 * @description Documentação dos padrões de código adotados no projeto
 * 
 * INTERVENÇÃO 13/16: Documentação e Padronização
 * 
 * Este arquivo serve como referência para desenvolvedores.
 * NÃO CONTÉM CÓDIGO EXECUTÁVEL - apenas documentação.
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-26
 */

/**
 * ============================================================================
 * ÍNDICE DE MÓDULOS DO SISTEMA
 * ============================================================================
 * 
 * CORE - Módulos Fundamentais:
 * ├── 0_Core_Safe_Globals.gs      - Variáveis globais seguras
 * ├── Core_Auth_Unified.gs        - Autenticação e sessões
 * ├── Core_CRUD_Enhanced.gs       - Operações CRUD
 * ├── Core_Database_Engine.gs     - Engine de banco de dados
 * ├── Core_Business_Rules.gs      - Regras de negócio
 * ├── Core_Audit_Service.gs       - Auditoria e telemetria
 * ├── Core_Logger.gs              - Sistema de logging
 * ├── Core_Error_Enhanced.gs      - Tratamento de erros
 * ├── Core_Retry_Strategy.gs      - Retry com backoff
 * ├── Core_Feature_Flags.gs       - Feature flags
 * └── Core_Metrics.gs             - Métricas e monitoramento
 * 
 * HELPERS - Módulos Auxiliares (Intervenções):
 * ├── Core_Constants_Sheets.gs    - Constantes centralizadas
 * ├── Core_Document_Helpers.gs    - Helpers para documentos
 * ├── Core_Refactoring_Helpers.gs - Funções utilitárias
 * ├── Core_Data_Cache.gs          - Cache de dados
 * ├── Core_Batch_Operations.gs    - Operações em lote
 * ├── Core_Production_Logger.gs   - Logger de produção
 * └── Core_XSS_Protection.html    - Proteção XSS
 * 
 * WORKFLOW - Fluxos de Trabalho:
 * ├── Core_Workflow_Atesto.gs     - Workflow de atesto
 * ├── Core_Workflow_Nutricionista.gs - Workflow nutricionista
 * ├── Core_Invoice_Workflow.gs    - Workflow de NFs
 * └── Core_Menu_Workflow.gs       - Workflow de cardápios
 * 
 * UI - Interface do Usuário:
 * ├── UI_Login.html               - Tela de login
 * ├── UI_MainMenu.html            - Menu principal
 * ├── UI_Dashboard.gs             - Dashboard
 * ├── UI_CRUD.gs                  - Interface CRUD
 * └── UI_Workflow_*.html          - Interfaces de workflow
 * 
 * INFRA - Infraestrutura:
 * ├── Infra_Sheets.gs             - Operações de planilha
 * ├── Infra_Drive.gs              - Integração Drive
 * ├── Infra_Notificacoes.gs       - Sistema de notificações
 * └── Infra_Manutencao.gs         - Manutenção do sistema
 * 
 * SETUP - Configuração:
 * ├── Setup_Database_Structure.gs - Estrutura do banco
 * ├── Setup_Initial.gs            - Setup inicial
 * └── Setup_*_Completo.gs         - Dados sintéticos
 * 
 * TEST - Testes:
 * ├── Test_Unit_Helpers.gs        - Testes unitários
 * ├── Test_Security_Validation.gs - Testes de segurança
 * ├── Test_Integration_*.gs       - Testes de integração
 * └── Test_Auth_System.gs         - Testes de autenticação
 */

/**
 * ============================================================================
 * PADRÕES DE NOMENCLATURA
 * ============================================================================
 * 
 * ARQUIVOS:
 * - Core_*.gs       → Módulos fundamentais do sistema
 * - UI_*.gs/html    → Interface do usuário
 * - Infra_*.gs      → Infraestrutura e utilitários
 * - Setup_*.gs      → Scripts de configuração
 * - Test_*.gs       → Testes automatizados
 * - Dominio_*.gs    → Lógica de domínio específica
 * - _*.gs           → Arquivos de inicialização/bootstrap
 * 
 * FUNÇÕES:
 * - camelCase       → Funções públicas: getUserById(), createInvoice()
 * - _camelCase      → Funções privadas: _validateInput(), _formatDate()
 * - UPPER_SNAKE     → Constantes: MAX_RETRIES, DEFAULT_TIMEOUT
 * 
 * VARIÁVEIS:
 * - camelCase       → Variáveis locais: userName, totalValue
 * - UPPER_SNAKE     → Constantes: CONFIG, SHEET_NAMES
 * 
 * CLASSES/MÓDULOS:
 * - PascalCase      → Classes: UserService, InvoiceManager
 * - IIFE Pattern    → Módulos: var Module = (function() { ... })();
 */

/**
 * ============================================================================
 * PADRÕES DE CÓDIGO
 * ============================================================================
 * 
 * 1. USE CONST/LET AO INVÉS DE VAR (quando possível no GAS)
 *    ❌ var nome = 'teste';
 *    ✅ const nome = 'teste';  // valor imutável
 *    ✅ let contador = 0;      // valor mutável
 * 
 * 2. EVITE MAGIC STRINGS - USE CONSTANTES
 *    ❌ var sheet = ss.getSheetByName('Usuarios');
 *    ✅ var sheet = ss.getSheetByName(SHEET_NAMES.USUARIOS);
 * 
 * 3. SEMPRE TRATE ERROS - NUNCA USE CATCH VAZIO
 *    ❌ try { ... } catch (e) { }
 *    ✅ try { ... } catch (e) { Logger.log('Erro: ' + e.message); }
 * 
 * 4. VALIDE ENTRADAS
 *    ❌ function process(data) { return data.value * 2; }
 *    ✅ function process(data) {
 *         if (!data || typeof data.value !== 'number') {
 *           return { success: false, error: 'Dados inválidos' };
 *         }
 *         return { success: true, result: data.value * 2 };
 *       }
 * 
 * 5. USE EARLY RETURN
 *    ❌ function check(x) { if (x) { ... muito código ... } }
 *    ✅ function check(x) { if (!x) return; ... código ... }
   try {
   } catch (error) {
     Logger.log("Erro em check: " + error.message);
     throw error; // Re-lança para tratamento superior
   }
 *    ✅ function check(x) { if (!x) return; ... código ... }
   try {
   } catch (error) {
     Logger.log("Erro em check: " + error.message);
     throw error;
   }
 *    ✅ function check(x) { if (!x) return; ... código ... }
 * 
 * 6. DOCUMENTE FUNÇÕES PÚBLICAS COM JSDOC
 *    /**
 *     * Descrição da função
 *     * @param {string} nome - Descrição do parâmetro
 *     * @returns {Object} Descrição do retorno
 *     * /
 * 
 * 7. USE CACHE PARA DADOS FREQUENTES
 *    ❌ for (var i = 0; i < 100; i++) { sheet.getDataRange().getValues(); }
 *    ✅ var data = DataCache.getData('MinhaAba');
 * 
 * 8. PREFIRA OPERAÇÕES EM BATCH
 *    ❌ rows.forEach(r => sheet.appendRow(r));
 *    ✅ BatchOperations.writeRows('MinhaAba', rows);
 */

/**
 * ============================================================================
 * PADRÕES DE SEGURANÇA
 * ============================================================================
 * 
 * 1. NUNCA USE EVAL()
 *    ❌ eval('funcao_' + nome + '()');
 *    ✅ var funcMap = { funcao_a: funcaoA, funcao_b: funcaoB };
 *       if (funcMap[nome]) funcMap[nome]();
 * 
 * 2. SANITIZE INPUTS ANTES DE USAR EM HTML
 *    ❌ element.innerHTML = userInput;
 *    ✅ element.innerHTML = XSSProtection.sanitizeHtml(userInput);
 *    ✅ element.textContent = userInput; // Mais seguro
 * 
 * 3. VALIDE URLs
 *    ❌ window.location = userUrl;
 *    ✅ if (XSSProtection.sanitizeUrl(userUrl)) { ... }
 * 
 * 4. NÃO EXPONHA DADOS SENSÍVEIS EM LOGS
 *    ❌ Logger.log('Credencial configurada');
 *    ✅ Logger.log('Login tentado para: ' + email);
 * 
 * 5. USE PREPARED STATEMENTS PARA QUERIES
 *    ❌ "SELECT * FROM users WHERE id = " + userId
 *    ✅ Use filtros do DatabaseEngine com validação
 */

/**
 * ============================================================================
 * PADRÕES DE RETORNO DE FUNÇÕES
 * ============================================================================
 * 
 * Todas as funções de API devem retornar objetos padronizados:
 * 
 * SUCESSO:
 * {
 *   success: true,
 *   data: <resultado>,
 *   message: 'Operação realizada com sucesso' // opcional
 * }
 * 
 * ERRO:
 * {
 *   success: false,
 *   error: 'Descrição do erro',
 *   code: 'ERROR_CODE' // opcional
 * }
 * 
 * LISTA:
 * {
 *   success: true,
 *   data: [...],
 *   total: 100,
 *   page: 1,
 *   pageSize: 20
 * }
 */

/**
 * ============================================================================
 * ESTRUTURA DE MÓDULOS (IIFE PATTERN)
 * ============================================================================
 * 
 * var MeuModulo = (function() {
 *   
 *   // Configuração privada
 *   var CONFIG = {
 *     TIMEOUT: 5000
 *   };
 *   
 *   // Funções privadas
 *   function _helperPrivado() { ... }
 *   
 *   // API Pública
 *   return {
 *     funcaoPublica: function(param) {
 *       _helperPrivado();
 *       return resultado;
 *     },
 *     
 *     outraFuncao: function() { ... },
 *     
 *     // Expõe config se necessário
 *     CONFIG: CONFIG
 *   };
 * })();
 */

/**
 * ============================================================================
 * CHECKLIST DE CODE REVIEW
 * ============================================================================
 * 
 * □ Código tem documentação JSDoc adequada?
 * □ Funções têm menos de 50 linhas?
 * □ Não há uso de eval() ou new Function()?
 * □ Todos os catch blocks têm tratamento?
 * □ Inputs são validados antes de uso?
 * □ Não há magic strings (usar constantes)?
 * □ Operações de planilha usam cache/batch?
 * □ Retornos seguem padrão { success, data/error }?
 * □ Dados sensíveis não são logados?
 * □ HTML é sanitizado antes de innerHTML?
 */

// Este arquivo é apenas documentação - não há código executável
Logger.log('_DOCS_Code_Standards.gs carregado - arquivo de documentação');
