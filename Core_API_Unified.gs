/**
 * @fileoverview API Unificada para Frontend
 * @version 1.0.0
 * @description Camada de API que expõe funções seguras e padronizadas para o frontend
 */

'use strict';

/**
 * API Unificada - Ponto de entrada para todas as operações do frontend
 * @namespace UnifiedAPI
 */
var UnifiedAPI = (function() {
  
  /**
   * Wrapper para executar operações com tratamento de erro padronizado
   * @private
   */
  function safeExecute(operation, operationName) {
    try {
      return operation();
    } catch (e) {
      console.error('[UnifiedAPI] Erro em ' + operationName + ': ' + e.message);
      return StandardResponse.error(
        'Erro ao executar operação: ' + e.message,
        'API_ERROR',
        { operation: operationName, stack: e.stack }
      );
    }
  }
  
  /**
   * Obtém o serviço de autenticação
   * @private
   */
  function getAuth() {
    if (typeof AuthService !== 'undefined') return AuthService;
    if (typeof AUTH !== 'undefined') return AUTH;
    return null;
  }
  
  /**
   * Verifica autenticação antes de executar operação
   * @private
   */
  function requireAuth(operation, operationName) {
    return safeExecute(function() {
      var auth = getAuth();
      if (!auth) {
        return StandardResponse.error('Sistema de autenticação não disponível', 'AUTH_UNAVAILABLE');
      }
      var session = auth.getSession();
      if (!session) {
        return StandardResponse.error('Não autenticado', 'UNAUTHORIZED');
      }
      return operation(session);
    }, operationName);
  }
  
  /**
   * Verifica permissão específica
   * @private
   */
  function requirePermission(permission, operation, operationName) {
    return requireAuth(function(session) {
      var auth = getAuth();
      if (auth && !auth.hasPermission(session, permission)) {
        return StandardResponse.error('Sem permissão para esta operação', 'FORBIDDEN');
      }
      return operation(session);
    }, operationName);
  }
  
  // ============================================================================
  // AUTENTICAÇÃO
  // ============================================================================
  
  /**
   * Realiza login
   * @param {string} email
   * @param {string} senha
   * @returns {Object} Resposta padronizada
   */
  function login(email, senha) {
    return safeExecute(function() {
      var auth = getAuth();
      if (!auth) {
        return StandardResponse.error('Sistema de autenticação não disponível', 'AUTH_UNAVAILABLE');
      }
      
      // Validação de entrada (se Validator existir)
      if (typeof Validator !== 'undefined' && Validator.validateObject) {
        var validation = Validator.validateObject(
          { email: email, senha: senha },
          { email: ['required', 'email'], senha: ['required'] }
        );
        
        if (!validation.valid) {
          return StandardResponse.validationError(validation.errors);
        }
      }
      
      return auth.login(email, senha);
    }, 'login');
  }
  
  /**
   * Realiza logout
   * @returns {Object} Resposta padronizada
   */
  function logout() {
    return safeExecute(function() {
      var auth = getAuth();
      if (!auth) {
        return StandardResponse.error('Sistema de autenticação não disponível', 'AUTH_UNAVAILABLE');
      }
      return auth.logout();
    }, 'logout');
  }
  
  /**
   * Obtém sessão atual
   * @returns {Object} Resposta padronizada com dados da sessão
   */
  function getSession() {
    return safeExecute(function() {
      var auth = getAuth();
      if (!auth) {
        return StandardResponse.error('Sistema de autenticação não disponível', 'AUTH_UNAVAILABLE');
      }
      var session = auth.getSession();
      if (session) {
        return StandardResponse.success(session);
      }
      return StandardResponse.error('Sessão não encontrada', 'NO_SESSION');
    }, 'getSession');
  }
  
  /**
   * Registra novo usuário
   * @param {Object} userData
   * @returns {Object} Resposta padronizada
   */
  function register(userData) {
    return safeExecute(function() {
      var auth = getAuth();
      if (!auth) {
        return StandardResponse.error('Sistema de autenticação não disponível', 'AUTH_UNAVAILABLE');
      }
      
      // Validação (se Validator existir)
      if (typeof Validator !== 'undefined' && Validator.validators && Validator.validators.usuario) {
        var validation = Validator.validators.usuario(userData);
        if (!validation.valid) {
          return StandardResponse.validationError(validation.errors);
        }
      }
      
      return auth.register(userData);
    }, 'register');
  }
  
  /**
   * Altera senha do usuário
   * @param {string} senhaAtual
   * @param {string} senhaNova
   * @returns {Object} Resposta padronizada
   */
  function changePassword(senhaAtual, senhaNova) {
    return requireAuth(function(session) {
      var auth = getAuth();
      if (!senhaNova || senhaNova.length < 6) {
        return StandardResponse.validationError(['Nova senha deve ter no mínimo 6 caracteres']);
      }
      return auth.changePassword(session.email, senhaAtual, senhaNova);
    }, 'changePassword');
  }
  
  // ============================================================================
  // NOTAS FISCAIS
  // ============================================================================
  
  /**
   * Lista notas fiscais com filtros e paginação
   * @param {Object} options - Opções de filtro e paginação
   * @returns {Object} Resposta padronizada
   */
  function listarNotasFiscais(options) {
    return requireAuth(function(session) {
      options = options || {};
      
      // Aplica filtros baseados no tipo de usuário
      if (session.tipo === 'FORNECEDOR') {
        options.filters = options.filters || {};
        options.filters.fornecedorCNPJ = session.instituicao;
      }
      
      return CRUDEnhanced.read('Notas_Fiscais', options);
    }, 'listarNotasFiscais');
  }
  
  /**
   * Busca nota fiscal por ID
   * @param {string} id
   * @returns {Object} Resposta padronizada
   */
  function buscarNotaFiscal(id) {
    return requireAuth(function() {
      return CRUDEnhanced.findById('Notas_Fiscais', id, 'ID_NF');
    }, 'buscarNotaFiscal');
  }
  
  /**
   * Cria nova nota fiscal
   * @param {Object} data
   * @returns {Object} Resposta padronizada
   */
  function criarNotaFiscal(data) {
    return requirePermission('cadastrar_notas', function(session) {
      // Validação
      var validation = Validator.validators.notaFiscal(data);
      if (!validation.valid) {
        return StandardResponse.validationError(validation.errors);
      }
      
      // Adiciona metadados
      data.responsavelCadastro = session.email;
      data.dataCadastro = new Date();
      data.statusNF = data.statusNF || 'Recebida';
      
      return CRUDEnhanced.create('Notas_Fiscais', data);
    }, 'criarNotaFiscal');
  }
  
  /**
   * Atualiza nota fiscal
   * @param {number} rowIndex
   * @param {Object} data
   * @returns {Object} Resposta padronizada
   */
  function atualizarNotaFiscal(rowIndex, data) {
    return requirePermission('editar_notas', function(session) {
      data.ultimaAtualizacaoPor = session.email;
      data.dataAtualizacao = new Date();
      
      return CRUDEnhanced.update('Notas_Fiscais', rowIndex, data);
    }, 'atualizarNotaFiscal');
  }
  
  // ============================================================================
  // ENTREGAS
  // ============================================================================
  
  /**
   * Lista entregas
   * @param {Object} options
   * @returns {Object} Resposta padronizada
   */
  function listarEntregas(options) {
    return requireAuth(function() {
      return CRUDEnhanced.read('Entregas', options);
    }, 'listarEntregas');
  }
  
  /**
   * Registra nova entrega
   * @param {Object} data
   * @returns {Object} Resposta padronizada
   */
  function registrarEntrega(data) {
    return requirePermission('conferir_entregas', function(session) {
      var validation = Validator.validators.entrega(data);
      if (!validation.valid) {
        return StandardResponse.validationError(validation.errors);
      }
      
      data.responsavelRegistro = session.email;
      data.dataRegistro = new Date();
      
      return CRUDEnhanced.create('Entregas', data);
    }, 'registrarEntrega');
  }
  
  // ============================================================================
  // RECUSAS
  // ============================================================================
  
  /**
   * Lista recusas
   * @param {Object} options
   * @returns {Object} Resposta padronizada
   */
  function listarRecusas(options) {
    return requireAuth(function() {
      return CRUDEnhanced.read('Recusas', options);
    }, 'listarRecusas');
  }
  
  /**
   * Registra nova recusa
   * @param {Object} data
   * @returns {Object} Resposta padronizada
   */
  function registrarRecusa(data) {
    return requirePermission('registrar_recusas', function(session) {
      var validation = Validator.validators.recusa(data);
      if (!validation.valid) {
        return StandardResponse.validationError(validation.errors);
      }
      
      data.responsavelRecusa = session.email;
      data.dataRecusa = new Date();
      data.statusResolucao = 'Pendente';
      
      return CRUDEnhanced.create('Recusas', data);
    }, 'registrarRecusa');
  }
  
  // ============================================================================
  // DASHBOARD
  // ============================================================================
  
  /**
   * Obtém dados do dashboard
   * @returns {Object} Resposta padronizada com métricas
   */
  function getDashboardData() {
    return requireAuth(function(session) {
      var metrics = {};
      
      // Contagem de notas fiscais
      var nfResult = CRUDEnhanced.count('Notas_Fiscais');
      metrics.totalNotasFiscais = nfResult.success ? nfResult.data.count : 0;
      
      // Contagem de entregas
      var entregasResult = CRUDEnhanced.count('Entregas');
      metrics.totalEntregas = entregasResult.success ? entregasResult.data.count : 0;
      
      // Contagem de recusas
      var recusasResult = CRUDEnhanced.count('Recusas');
      metrics.totalRecusas = recusasResult.success ? recusasResult.data.count : 0;
      
      // Notas pendentes
      var pendentesResult = CRUDEnhanced.read('Notas_Fiscais', {
        filters: { Status_NF: 'Pendente' },
        pageSize: 1
      });
      metrics.notasPendentes = pendentesResult.success ? pendentesResult.meta.pagination.total : 0;
      
      // Últimas atividades
      var recentResult = CRUDEnhanced.read('Notas_Fiscais', {
        orderBy: 'Data_Recebimento',
        orderDir: 'desc',
        pageSize: 5
      });
      metrics.ultimasNotas = recentResult.success ? recentResult.data : [];
      
      return StandardResponse.success(metrics);
    }, 'getDashboardData');
  }
  
  // ============================================================================
  // RELATÓRIOS
  // ============================================================================
  
  /**
   * Gera relatório de notas fiscais
   * @param {Object} filtros
   * @returns {Object} Resposta padronizada
   */
  function gerarRelatorioNF(filtros) {
    return requirePermission('gerar_relatorios', function() {
      return CRUDEnhanced.exportToJson('Notas_Fiscais', { filters: filtros });
    }, 'gerarRelatorioNF');
  }
  
  /**
   * Gera relatório de recusas
   * @param {Object} filtros
   * @returns {Object} Resposta padronizada
   */
  function gerarRelatorioRecusas(filtros) {
    return requirePermission('gerar_relatorios', function() {
      return CRUDEnhanced.exportToJson('Recusas', { filters: filtros });
    }, 'gerarRelatorioRecusas');
  }
  
  // ============================================================================
  // EXPORTAÇÃO
  // ============================================================================
  
  return {
    // Auth
    login: login,
    logout: logout,
    getSession: getSession,
    register: register,
    changePassword: changePassword,
    
    // Notas Fiscais
    listarNotasFiscais: listarNotasFiscais,
    buscarNotaFiscal: buscarNotaFiscal,
    criarNotaFiscal: criarNotaFiscal,
    atualizarNotaFiscal: atualizarNotaFiscal,
    
    // Entregas
    listarEntregas: listarEntregas,
    registrarEntrega: registrarEntrega,
    
    // Recusas
    listarRecusas: listarRecusas,
    registrarRecusa: registrarRecusa,
    
    // Dashboard
    getDashboardData: getDashboardData,
    
    // Relatórios
    gerarRelatorioNF: gerarRelatorioNF,
    gerarRelatorioRecusas: gerarRelatorioRecusas
  };
  
})();

// ============================================================================
// FUNÇÕES EXPOSTAS PARA FRONTEND (google.script.run)
// ============================================================================

// Auth
function api_login(email, senha) { return UnifiedAPI.login(email, senha); }
function api_logout() { return UnifiedAPI.logout(); }
function api_getSession() { return UnifiedAPI.getSession(); }
function api_register(userData) { return UnifiedAPI.register(userData); }
function api_changePassword(atual, nova) { return UnifiedAPI.changePassword(atual, nova); }

// Notas Fiscais
// NOTA: api_listarNotasFiscais está em Core_NF_API.gs com implementação mais completa
function api_listarNotasFiscais_Unified(options) { return UnifiedAPI.listarNotasFiscais(options); }
function api_buscarNotaFiscal(id) { return UnifiedAPI.buscarNotaFiscal(id); }
function api_criarNotaFiscal(data) { return UnifiedAPI.criarNotaFiscal(data); }
function api_atualizarNotaFiscal(rowIndex, data) { return UnifiedAPI.atualizarNotaFiscal(rowIndex, data); }

// Entregas
function api_listarEntregas(options) { return UnifiedAPI.listarEntregas(options); }
function api_registrarEntrega(data) { return UnifiedAPI.registrarEntrega(data); }

// Recusas
function api_listarRecusas(options) { return UnifiedAPI.listarRecusas(options); }
function api_registrarRecusa(data) { return UnifiedAPI.registrarRecusa(data); }

// Dashboard
function api_getDashboardData() { return UnifiedAPI.getDashboardData(); }

// Relatórios
function api_gerarRelatorioNF(filtros) { return UnifiedAPI.gerarRelatorioNF(filtros); }
function api_gerarRelatorioRecusas(filtros) { return UnifiedAPI.gerarRelatorioRecusas(filtros); }

// ============================================================================
// HORTA ESCOLAR — funções expostas ao frontend (google.script.run)
// ============================================================================

/**
 * Registra uma colheita da horta escolar de forma independente
 * (sem vínculo obrigatório com nota fiscal ou entrega).
 *
 * Payload mínimo: { unidadeEscolar, itens: [{produto, quantidade, unidade}],
 *                   dataColheita, responsavelColheita, destinoPadrao }
 *
 * Campos opcionais: observacoes, itemId (por item)
 */
function api_registrarColheitaHorta(dados) {
  try {
    try {
      try {
        try {
          if (!dados) return { success: false, error: 'Payload ausente' };
          if (!dados.unidadeEscolar) return { success: false, error: 'unidadeEscolar é obrigatório' };
          if (!dados.itens || !dados.itens.length) return { success: false, error: 'Informe pelo menos um item colhido' };

          var ss = getSS();
          if (!ss) return { success: false, error: 'Planilha não encontrada' };

          // ── Garante que a aba existe com os headers corretos ──
          var HORTA_HEADERS = [
            'ID_Horta', 'Unidade_Escolar', 'Produto_Nome', 'Item_ID',
            'Quantidade_Colhida', 'Unidade_Medida', 'Data_Colheita',
            'Responsavel_Colheita', 'Destino_Producao', 'Status_Aprovacao',
            'Responsavel_Aprovacao', 'Data_Aprovacao', 'Lote_Estoque_ID',
            'Criado_Por', 'Timestamp_Criacao', 'Observacoes'
          ];

          var sheet = ss.getSheetByName('Horta_Escolar');
          if (!sheet) {
            sheet = ss.insertSheet('Horta_Escolar');
            sheet.getRange(1, 1, 1, HORTA_HEADERS.length).setValues([HORTA_HEADERS]);
            sheet.getRange(1, 1, 1, HORTA_HEADERS.length)
                 .setFontWeight('bold').setBackground('#2e7d32').setFontColor('white');
            SpreadsheetApp.flush();
            Logger.log('[api_registrarColheitaHorta] Aba Horta_Escolar criada com headers.');
          }

          // Lê headers reais (pode haver colunas extras)
          var realHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

          var now = new Date();
          var usuario = '';
          try { usuario = Session.getActiveUser().getEmail(); } catch(e) {}

          var dataColheita = dados.dataColheita ? new Date(dados.dataColheita) : now;
          var dataStr = Utilities.formatDate(dataColheita, 'America/Sao_Paulo', 'dd/MM/yyyy');
          var ids = [];

          dados.itens.forEach(function(item) {
            if (!item.produto || !String(item.produto).trim()) return;

            var id = 'HRT-' + Utilities.formatDate(now, 'America/Sao_Paulo', 'yyyyMMddHHmmss') +
                     '-' + Math.floor(Math.random() * 9000 + 1000);

            var rec = {
              ID_Horta:             id,
              Unidade_Escolar:      dados.unidadeEscolar,
              Produto_Nome:         String(item.produto).trim(),
              Item_ID:              item.itemId || '',
              Quantidade_Colhida:   parseFloat(item.quantidade) || 0,
              Unidade_Medida:       item.unidade || 'kg',
              Data_Colheita:        dataStr,
              Responsavel_Colheita: dados.responsavelColheita || '',
              Destino_Producao:     item.destino || dados.destinoPadrao || 'Cardapio_Dia',
              Status_Aprovacao:     'Pendente',
              Responsavel_Aprovacao:'',
              Data_Aprovacao:       '',
              Lote_Estoque_ID:      '',
              Criado_Por:           usuario,
              Timestamp_Criacao:    now.toISOString(),
              Observacoes:          dados.observacoes || ''
            };

            // Monta linha na ordem dos headers reais
            var row = realHeaders.map(function(h) {
              var v = rec[h];
              return (v !== undefined && v !== null) ? v : '';
            });
            // Se a aba estiver vazia (só header), row pode ser vazia — garantir mínimo
            if (row.every(function(c){ return c === ''; })) {
              // Fallback: escrever na ordem padrão
              row = HORTA_HEADERS.map(function(h) {
                var v = rec[h];
                return (v !== undefined && v !== null) ? v : '';
              });
            }
            sheet.appendRow(row);
            ids.push(id);
          });

          SpreadsheetApp.flush();

          if (!ids.length) {
            return { success: false, error: 'Nenhum item válido foi fornecido (verifique o nome do produto).' };
          }

          Logger.log('[api_registrarColheitaHorta] ' + ids.length + ' colheita(s) salvas em Horta_Escolar: ' + ids.join(', '));
          return {
            success: true,
            ids: ids,
            mensagem: ids.length + ' colheita(s) registrada(s) com sucesso na aba Horta_Escolar.'
          };

        } catch (e) {
          Logger.log('Erro api_registrarColheitaHorta: ' + e.message + ' | ' + e.stack);
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em api_registrarColheitaHorta: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em api_registrarColheitaHorta: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em api_registrarColheitaHorta: " + error.message);
    throw error;
  }
}

/**
 * Lista colheitas registradas da horta escolar.
 * @param {string} [escola]  Filtra por Unidade_Escolar (opcional). Se omitido retorna tudo.
 * @param {number} [limite]  Máximo de registros a retornar (padrão: 200).
 */
function api_listarColheitasHorta(escola, limite) {
  try {
    try {
      try {
        var ss = getSS();
        var sheet = ss.getSheetByName('Horta_Escolar');
        if (!sheet || sheet.getLastRow() <= 1) return { success: true, registros: [], total: 0 };

        var data   = sheet.getDataRange().getValues();
        var headers = data[0];
        var max    = limite || 200;
        var registros = [];

        for (var i = 1; i < data.length; i++) {
          var row = data[i];
          if (!row[0]) continue; // linha vazia

          var rec = {};
          headers.forEach(function(h, idx) { rec[h] = row[idx]; });

          if (escola && rec['Unidade_Escolar'] !== escola) continue;
          registros.push(rec);
          if (registros.length >= max) break;
        }

        return { success: true, registros: registros, total: registros.length };

      } catch (e) {
        Logger.log('Erro api_listarColheitasHorta: ' + e.message);
        return { success: false, error: e.message, registros: [] };
      }
    } catch (error) {
      Logger.log("Erro em api_listarColheitasHorta: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em api_listarColheitasHorta: " + error.message);
    throw error;
  }
}

/**
 * Relatório cruzado: Horta Escolar × Fornecedores
 * Identifica sobreposição entre o que as escolas cultivam e o que recebem via compras.
 */
function api_relatorioHortaFornecedores() {
  try {
    try {
      try {
        var ss = getSS();
        if (!ss) return { success: false, error: 'Planilha não encontrada' };

        // ── Ler Horta_Escolar ──────────────────────────────────────
        var hortaMap = {}; // { escola: { prodKey: { qtd, unidade, produtoOriginal } } }
        var hortaSheet = ss.getSheetByName('Horta_Escolar');
        if (hortaSheet && hortaSheet.getLastRow() > 1) {
          var hData = hortaSheet.getDataRange().getValues();
          var hH = hData[0];
          var hi = {};
          hH.forEach(function(h, i) { hi[h] = i; });
          for (var r = 1; r < hData.length; r++) {
            var row = hData[r];
            if (!row[0]) continue;
            var escola  = String(row[hi['Unidade_Escolar']] || '').trim();
            var produto = String(row[hi['Produto_Nome']]    || '').trim();
            var qtd     = Number(row[hi['Quantidade_Colhida']] || 0);
            var unidade = String(row[hi['Unidade_Medida']]  || 'kg').trim();
            var status  = String(row[hi['Status_Aprovacao']] || '').trim();
            if (!escola || !produto || status === 'Reprovado') continue;
            var key = _normProduto(produto);
            if (!hortaMap[escola]) hortaMap[escola] = {};
            if (!hortaMap[escola][key]) hortaMap[escola][key] = { qtd: 0, unidade: unidade, produtoOriginal: produto };
            hortaMap[escola][key].qtd += qtd;
          }
        }

        // ── Ler Entregas (escola-específico) ──────────────────────
        var entregaMap = {}; // { escola: { prodKey: { qtd, fornecedores: {} } } }
        var entSheet = ss.getSheetByName('Entregas');
        if (entSheet && entSheet.getLastRow() > 1) {
          var eData = entSheet.getDataRange().getValues();
          var eH = eData[0];
          var ei = {};
          eH.forEach(function(h, i) { ei[String(h).toLowerCase().replace(/[^a-z0-9]/g, '_')] = i; });
          for (var r2 = 1; r2 < eData.length; r2++) {
            var row2 = eData[r2];
            if (!row2[0]) continue;
            var escola2   = String(row2[ei['unidade_escolar'] !== undefined ? ei['unidade_escolar'] : -1] || '').trim();
            var produto2  = String(row2[ei['produto_nome']    !== undefined ? ei['produto_nome']    : (ei['produto'] !== undefined ? ei['produto'] : -1)] || '').trim();
            var qtd2      = Number(row2[ei['quantidade_entregue'] !== undefined ? ei['quantidade_entregue'] : (ei['quantidade'] !== undefined ? ei['quantidade'] : -1)] || 0);
            var forn2     = String(row2[ei['fornecedor_nome'] !== undefined ? ei['fornecedor_nome'] : (ei['fornecedor'] !== undefined ? ei['fornecedor'] : -1)] || '').trim();
            if (!escola2 || !produto2) continue;
            var key2 = _normProduto(produto2);
            if (!entregaMap[escola2]) entregaMap[escola2] = {};
            if (!entregaMap[escola2][key2]) entregaMap[escola2][key2] = { qtd: 0, fornecedores: {}, produtoOriginal: produto2 };
            entregaMap[escola2][key2].qtd += qtd2;
            if (forn2) entregaMap[escola2][key2].fornecedores[forn2] = true;
          }
        }

        // ── Ler Notas_Fiscais (mapa global por produto) ───────────
        // As NFs não têm coluna de escola, então ficam num mapa global
        var nfGlobalMap = {}; // { prodKey: { qtd, fornecedores: {}, produtoOriginal } }
        var nfSheet2 = ss.getSheetByName('Notas_Fiscais');
        if (nfSheet2 && nfSheet2.getLastRow() > 1) {
          var nfData = nfSheet2.getDataRange().getValues();
          var nfHd = nfData[0];
          var nfi = {};
          nfHd.forEach(function(h, i) { nfi[String(h).toLowerCase().replace(/[^a-z0-9]/g, '_')] = i; });
          var nfProdIdx  = nfi['produto'] !== undefined ? nfi['produto'] : (nfi['produto_nome'] !== undefined ? nfi['produto_nome'] : -1);
          var nfQtyIdx   = nfi['quantidade'] !== undefined ? nfi['quantidade'] : -1;
          var nfFornIdx  = nfi['fornecedor'] !== undefined ? nfi['fornecedor'] : (nfi['fornecedor_nome'] !== undefined ? nfi['fornecedor_nome'] : -1);
          if (nfProdIdx !== -1) {
            for (var r3 = 1; r3 < nfData.length; r3++) {
              var row3 = nfData[r3];
              if (!row3[0]) continue;
              var prod3 = String(row3[nfProdIdx] || '').trim();
              if (!prod3) continue;
              var qty3  = nfQtyIdx !== -1 ? Number(row3[nfQtyIdx] || 0) : 0;
              var forn3 = nfFornIdx !== -1 ? String(row3[nfFornIdx] || '').trim() : '';
              var key3  = _normProduto(prod3);
              if (!nfGlobalMap[key3]) nfGlobalMap[key3] = { qtd: 0, fornecedores: {}, produtoOriginal: prod3 };
              nfGlobalMap[key3].qtd += qty3;
              if (forn3) nfGlobalMap[key3].fornecedores[forn3] = true;
            }
          }
        }

        // ── Cruzamento ─────────────────────────────────────────────
        var sobreposicoes = [];
        var somenteHorta  = [];
        var todasEscolas  = {};
        var kgTotal = 0;

        for (var escola in hortaMap) {
          todasEscolas[escola] = true;
          for (var pKey in hortaMap[escola]) {
            var h = hortaMap[escola][pKey];
            kgTotal += h.qtd;

            // 1º — busca correspondência específica de escola em Entregas
            var entMatch = null;
            if (entregaMap[escola]) {
              if (entregaMap[escola][pKey]) {
                entMatch = entregaMap[escola][pKey];
              } else {
                for (var ek in entregaMap[escola]) {
                  if (ek.indexOf(pKey) !== -1 || pKey.indexOf(ek) !== -1) {
                    entMatch = entregaMap[escola][ek];
                    break;
                  }
                }
              }
            }

            // 2º — fallback: busca no mapa global de Notas_Fiscais
            var nfMatch = null;
            if (!entMatch) {
              if (nfGlobalMap[pKey]) {
                nfMatch = nfGlobalMap[pKey];
              } else {
                for (var nk in nfGlobalMap) {
                  if (nk.indexOf(pKey) !== -1 || pKey.indexOf(nk) !== -1) {
                    nfMatch = nfGlobalMap[nk];
                    break;
                  }
                }
              }
            }

            var matchData   = entMatch || nfMatch;
            var matchSource = entMatch ? 'Entregas' : (nfMatch ? 'Notas Fiscais' : null);

            if (matchData) {
              var total = h.qtd + matchData.qtd;
              sobreposicoes.push({
                escola: escola,
                produto: h.produtoOriginal,
                kgCultivado: h.qtd,
                kgRecebido: matchData.qtd,
                percentualAutoSuficiencia: total > 0 ? Math.round(h.qtd / total * 100) : 0,
                fornecedores: Object.keys(matchData.fornecedores),
                fonte: matchSource
              });
            } else {
              somenteHorta.push({ escola: escola, produto: h.produtoOriginal, qtd: h.qtd, unidade: h.unidade });
            }
          }
        }

        sobreposicoes.sort(function(a, b) { return b.percentualAutoSuficiencia - a.percentualAutoSuficiencia; });

        var totalProdutos = Object.keys(hortaMap).reduce(function(acc, e) {
          return acc + Object.keys(hortaMap[e]).length;
        }, 0);

        return {
          success: true,
          data: {
            resumo: {
              totalEscolas:        Object.keys(todasEscolas).length,
              totalProdutosHorta:  totalProdutos,
              totalSobreposicoes:  sobreposicoes.length,
              kgCultivadoTotal:    kgTotal
            },
            sobreposicoes: sobreposicoes,
            somenteHorta:  somenteHorta
          }
        };
      } catch (e) {
        Logger.log('Erro api_relatorioHortaFornecedores: ' + e.message);
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em api_relatorioHortaFornecedores: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em api_relatorioHortaFornecedores: " + error.message);
    throw error;
  }
}

function _normProduto(nome) {
  try {
    return String(nome).toLowerCase()
      .replace(/[áàãâä]/g, 'a').replace(/[éêèë]/g, 'e').replace(/[íîì]/g, 'i')
      .replace(/[óôõö]/g, 'o').replace(/[úûù]/g, 'u').replace(/[ç]/g, 'c')
      .replace(/[^a-z0-9\s]/g, '').trim()
      .split(/\s+/)[0]; // primeira palavra para correspondência ampla
  } catch (error) {
    Logger.log("Erro em _normProduto: " + error.message);
    throw error;
  }
}

/**
 * Diagnóstico geral: lista todas as abas e contagem de linhas.
 * Usado pela UI para confirmar que os dados chegaram à planilha.
 */
function api_diagnosticoGeral() {
  try {
    try {
      var ss = getSS();
      if (!ss) return { success: false, error: 'Planilha não encontrada — configure SPREADSHEET_ID nas propriedades.' };

      var sheets = ss.getSheets();
      var abas = sheets.map(function(s) {
        var lastRow = s.getLastRow();
        return {
          nome: s.getName(),
          linhas: Math.max(0, lastRow - 1), // descontar header
          headerRow: lastRow > 0 ? s.getRange(1, 1, 1, Math.min(s.getLastColumn(), 8)).getValues()[0].join(' | ') : ''
        };
      });

      return {
        success: true,
        spreadsheetId: ss.getId(),
        spreadsheetName: ss.getName(),
        totalAbas: abas.length,
        abas: abas
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  } catch (error) {
    Logger.log("Erro em api_diagnosticoGeral: " + error.message);
    throw error;
  }
}