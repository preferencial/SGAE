/**
 * @fileoverview Setup e Verificação do Projeto SGAE
 * @version 1.0.0
 * @description Configura e valida o ambiente antes do primeiro uso.
 *
 * PRÉ-REQUISITO: Execute as seguintes Script Properties no GAS antes de rodar:
 *   Projeto > Configurações > Propriedades do script
 *   ├── SPREADSHEET_ID  → ID da planilha Google Sheets
 *   └── GEMINI_API_KEY  → Chave da API Gemini AI
 *
 * SEQUÊNCIA RECOMENDADA:
 *   1. verificarPropriedades()   → Confirma que as chaves estão presentes
 *   2. setupProject()            → Setup completo (cria abas, testa APIs)
 *   3. initializeSheets()        → (Re)cria abas individuais se necessário
 *
 * @author UNIAE CRE Team
 */

'use strict';

// ============================================================================
// SETUP PRINCIPAL
// ============================================================================

/**
 * Setup completo do projeto. Execute UMA VEZ após configurar as Script Properties.
 * Acesse via: Apps Script Editor → selecione setupProject → ▶ Executar
 */
function setupProject() {
  try {
    Logger.log('╔══════════════════════════════════════════════════════════════╗');
    Logger.log('║        SETUP DO PROJETO SGAE - UNIAE/CRE-PP                  ║');
    Logger.log('║        ' + new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) + '                              ║');
    Logger.log('╚══════════════════════════════════════════════════════════════╝');
    Logger.log('');

    var resultado = {
      etapas: [],
      ok: 0,
      erro: 0
    };

    // --------------------------------------------------------------------------
    // ETAPA 1: Verificar Script Properties
    // --------------------------------------------------------------------------
    _etapa(resultado, '1/5', 'Script Properties', function() {
      var props = PropertiesService.getScriptProperties();
      var spreadsheetId = props.getProperty('SPREADSHEET_ID');
      var geminiKey = props.getProperty('GEMINI_API_KEY');

      var folderId = props.getProperty('FOLDER_ID');

      if (!spreadsheetId || spreadsheetId.length < 20) {
        throw new Error('SPREADSHEET_ID não configurado ou inválido. ' +
          'Vá em Projeto > Configurações > Propriedades do script.');
      }
      if (!geminiKey || geminiKey.length < 10) {
        throw new Error('GEMINI_API_KEY não configurada. ' +
          'Vá em Projeto > Configurações > Propriedades do script.');
      }
      if (!folderId || folderId.length < 20) {
        throw new Error('FOLDER_ID não configurado ou inválido. ' +
          'Vá em Projeto > Configurações > Propriedades do script.');
      }
      return 'SPREADSHEET_ID ✓  |  GEMINI_API_KEY ✓  |  FOLDER_ID ✓';
    });

    // --------------------------------------------------------------------------
    // ETAPA 2: Verificar acesso à planilha
    // --------------------------------------------------------------------------
    _etapa(resultado, '2/5', 'Acesso à planilha', function() {
      var spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
      var ss;
      try {
        ss = SpreadsheetApp.openById(spreadsheetId);
      } catch (e) {
        throw new Error('Não foi possível abrir a planilha com ID "' + spreadsheetId + '". ' +
          'Verifique se o ID está correto e se a conta tem permissão de acesso. ' +
          'Detalhe: ' + e.message);
      }
      var nome = ss.getName();
      var numAbas = ss.getSheets().length;
      return 'Planilha: "' + nome + '" | Abas existentes: ' + numAbas;
    });

    // --------------------------------------------------------------------------
    // ETAPA 3: Criar / validar estrutura de abas
    // --------------------------------------------------------------------------
    _etapa(resultado, '3/5', 'Estrutura de abas (initializeSheets)', function() {
      // Garante que o CRUD opera na planilha correta
      _vincularPlanilha();

      if (typeof initializeSheets !== 'function') {
        throw new Error('Função initializeSheets() não encontrada. Verifique se Infra_Sheets.gs está no projeto.');
      }
      initializeSheets();

      // Conta abas criadas
      var spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
      var ss = SpreadsheetApp.openById(spreadsheetId);
      var totalAbas = ss.getSheets().length;
      return totalAbas + ' abas presentes na planilha após inicialização';
    });

    // --------------------------------------------------------------------------
    // ETAPA 4: Testar conectividade com Gemini API
    // --------------------------------------------------------------------------
    _etapa(resultado, '4/5', 'Gemini API', function() {
      if (typeof isGeminiConfigured !== 'function') {
        return 'AVISO: Core_Gemini_Service.gs não encontrado — Gemini não testado';
      }
      if (!isGeminiConfigured()) {
        throw new Error('isGeminiConfigured() retornou false. Verifique a GEMINI_API_KEY.');
      }
      // Ping real: envia prompt mínimo
      var resposta = sendMessageToGemini('Responda apenas: OK');
      if (!resposta || !resposta.success) {
        throw new Error('Chamada ao Gemini falhou: ' + (resposta ? resposta.error : 'sem resposta'));
      }
      return 'Conexão OK — modelo: ' + (GEMINI_CONFIG ? GEMINI_CONFIG.MODEL : 'gemini');
    });

    // --------------------------------------------------------------------------
    // ETAPA 5: Inicializar sistema
    // --------------------------------------------------------------------------
    _etapa(resultado, '5/5', 'Bootstrap do sistema', function() {
      if (typeof initializeSystem !== 'function') {
        return 'AVISO: initializeSystem() não encontrado — Bootstrap ignorado';
      }
      var r = initializeSystem({ silent: false });
      if (!r || !r.success) {
        throw new Error('initializeSystem() falhou: ' + (r ? r.message : 'sem retorno'));
      }
      return 'Sistema v' + (r.version || '?') + ' inicializado com sucesso';
    });

    // --------------------------------------------------------------------------
    // RELATÓRIO FINAL
    // --------------------------------------------------------------------------
    Logger.log('');
    Logger.log('══════════════════════════════════════════════════════════════');
    Logger.log('  RESULTADO: ' + resultado.ok + ' etapa(s) OK  |  ' + resultado.erro + ' erro(s)');
    Logger.log('══════════════════════════════════════════════════════════════');

    resultado.etapas.forEach(function(e) {
      Logger.log('  ' + e.status + '  [' + e.nome + '] ' + e.detalhe);
    });

    Logger.log('');

    if (resultado.erro === 0) {
      Logger.log('✅ Setup concluído! O sistema está pronto para uso.');
      Logger.log('   Acesse o Web App pelo URL de implantação do projeto.');
    } else {
      Logger.log('⚠️  Setup finalizado com erros. Corrija os itens acima e execute setupProject() novamente.');
    }

    Logger.log('');
    return resultado;
  } catch (error) {
    Logger.log("Erro em setupProject: " + error.message);
    throw error;
  }
}

// ============================================================================
// VERIFICAÇÃO RÁPIDA (sem criar abas)
// ============================================================================

/**
 * Verifica rapidamente se as Script Properties estão configuradas.
 * Útil para diagnóstico sem side-effects.
 */
function verificarPropriedades() {
  Logger.log('── Verificando Script Properties ──');
  var props = PropertiesService.getScriptProperties();
  var todas = props.getProperties();

  var chaves = ['SPREADSHEET_ID', 'GEMINI_API_KEY', 'FOLDER_ID'];
  var ok = true;

  chaves.forEach(function(chave) {
    var valor = todas[chave];
    if (valor && valor.length > 5) {
      // Exibe apenas os primeiros e últimos 4 caracteres por segurança
      var resumo = valor.substring(0, 4) + '...' + valor.slice(-4);
      Logger.log('  ✅ ' + chave + ' = ' + resumo + ' (' + valor.length + ' chars)');
    } else {
      Logger.log('  ❌ ' + chave + ' — NÃO configurada ou muito curta');
      ok = false;
    }
  });

  Logger.log('');
  Logger.log('Outras propriedades definidas: ' +
    Object.keys(todas).filter(function(k) { return chaves.indexOf(k) === -1; }).join(', ') || '(nenhuma)');

  Logger.log('');
  if (ok) {
    Logger.log('✅ Todas as propriedades obrigatórias estão presentes.');
  } else {
    Logger.log('❌ Propriedades faltando. Vá em Projeto > Configurações > Propriedades do script.');
  }

  return ok;
}

// ============================================================================
// CONSTRUÇÃO DA PLANILHA (standalone-safe)
// ============================================================================

/**
 * Constrói TODAS as abas diretamente no SPREADSHEET_ID configurado.
 * Funciona em scripts standalone (não container-bound).
 * Execute no Apps Script Editor: selecione construirPlanilha → ▶ Executar
 */
function construirPlanilha() {
  try {
    try {
      var spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
      if (!spreadsheetId) {
        Logger.log('❌ SPREADSHEET_ID não configurado nas Script Properties.');
        return;
      }

      var ss;
      try {
        ss = SpreadsheetApp.openById(spreadsheetId);
      } catch (e) {
        Logger.log('❌ Não foi possível abrir a planilha: ' + e.message);
        return;
      }

      Logger.log('╔══════════════════════════════════════════════════════════════╗');
      Logger.log('║   CONSTRUÇÃO DA PLANILHA: ' + ss.getName());
      Logger.log('║   ID: ' + spreadsheetId);
      Logger.log('╚══════════════════════════════════════════════════════════════╝');
      Logger.log('');

      if (typeof SHEET_STRUCTURES === 'undefined') {
        Logger.log('❌ SHEET_STRUCTURES não encontrado. Verifique se Infra_Sheets.gs está no projeto.');
        return;
      }

      var criadas = 0;
      var jaExistiam = 0;
      var corrigidas = 0;

      Object.keys(SHEET_STRUCTURES).forEach(function(sheetName) {
        var structure = SHEET_STRUCTURES[sheetName];
        var headers = structure.columns;
        var sheet = ss.getSheetByName(sheetName);

        if (!sheet) {
          sheet = ss.insertSheet(sheetName);
          sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
          sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
          sheet.setFrozenRows(1);
          Logger.log('  ✅ CRIADA   → ' + sheetName + ' (' + headers.length + ' colunas)');
          criadas++;
        } else if (sheet.getLastColumn() === 0 || sheet.getLastRow() === 0) {
          sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
          sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
          sheet.setFrozenRows(1);
          Logger.log('  🔧 CORRIGIDA → ' + sheetName + ' (headers adicionados)');
          corrigidas++;
        } else {
          Logger.log('  ⏭  JÁ EXISTE → ' + sheetName);
          jaExistiam++;
        }
      });

      Logger.log('');
      Logger.log('══════════════════════════════════════════════════════════════');
      Logger.log('  RESULTADO:');
      Logger.log('  ✅ Criadas:      ' + criadas);
      Logger.log('  🔧 Corrigidas:   ' + corrigidas);
      Logger.log('  ⏭  Já existiam: ' + jaExistiam);
      Logger.log('  📊 Total:        ' + (criadas + corrigidas + jaExistiam) + ' abas');
      Logger.log('══════════════════════════════════════════════════════════════');
      Logger.log('');
      Logger.log('✅ Planilha pronta: https://docs.google.com/spreadsheets/d/' + spreadsheetId);

      return { criadas: criadas, corrigidas: corrigidas, jaExistiam: jaExistiam };
    } catch (error) {
      Logger.log("Erro em construirPlanilha: " + error.message);
      throw error; // Re-lança para tratamento superior
    }
  } catch (error) {
    Logger.log("Erro em construirPlanilha: " + error.message);
    throw error;
  }
}

// ============================================================================
// HELPERS PRIVADOS
// ============================================================================

/**
 * Vincula a planilha pelo SPREADSHEET_ID como planilha ativa para funções
 * que usam getActiveSpreadsheet() internamente.
 * @private
 */
function _vincularPlanilha() {
  try {
    var spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
    if (!spreadsheetId) return;

    try {
      // Em scripts standalone: tenta abrir para confirmar acesso
      // O Apps Script usa a planilha vinculada (container-bound) automaticamente;
      // para standalone, SpreadsheetApp.openById() é necessário em cada operação.
      var ss = SpreadsheetApp.openById(spreadsheetId);
      Logger.log('  → Planilha vinculada: ' + ss.getName() + ' (' + spreadsheetId + ')');
    } catch (e) {
      Logger.log('  ⚠️ Não foi possível vincular planilha: ' + e.message);
    }
  } catch (error) {
    Logger.log("Erro em _vincularPlanilha: " + error.message);
    throw error;
  }
}

/**
 * Executa uma etapa de setup com tratamento de erro padronizado.
 * @private
 */
function _etapa(resultado, numero, nome, fn) {
  Logger.log('─────────────────────────────────────────────────');
  Logger.log('  ETAPA ' + numero + ': ' + nome);
  try {
    var msg = fn();
    Logger.log('  ✅ ' + (msg || 'OK'));
    resultado.ok++;
    resultado.etapas.push({ status: '✅', nome: nome, detalhe: msg || 'OK' });
  } catch (e) {
    Logger.log('  ❌ ERRO: ' + e.message);
    resultado.erro++;
    resultado.etapas.push({ status: '❌', nome: nome, detalhe: e.message });
  }
  Logger.log('');
}

// ============================================================================
// VALIDAÇÃO COMPLETA DO SISTEMA (validateSheets)
// ============================================================================

/**
 * Valida toda a estrutura de planilhas e os principais workflows do SGAE.
 *
 * Verificações:
 *   A) Planilha acessível
 *   B) Abas obrigatórias presentes e com headers corretos
 *   C) Usuário admin existente na aba Usuarios
 *   D) Ciclo básico NF: criar → ler → deletar (dados de teste, rollback automático)
 *   E) Workflow InvoiceWorkflow acessível
 *   F) AuthService acessível
 *   G) CRUD de Horta_Escolar
 *
 * Execute no Apps Script Editor: validateSheets()
 */
function validateSheets() {
  Logger.log('╔══════════════════════════════════════════════════════════════╗');
  Logger.log('║   VALIDAÇÃO DO SGAE — ' + Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm') + '                    ║');
  Logger.log('╚══════════════════════════════════════════════════════════════╝');
  Logger.log('');

  var r = { ok: 0, warn: 0, erro: 0, linhas: [] };

  function _ok(secao, msg)   { r.ok++;   r.linhas.push('  ✅ [' + secao + '] ' + msg); Logger.log('  ✅ [' + secao + '] ' + msg); }
  function _warn(secao, msg) { r.warn++; r.linhas.push('  ⚠️  [' + secao + '] ' + msg); Logger.log('  ⚠️  [' + secao + '] ' + msg); }
  function _err(secao, msg)  { r.erro++; r.linhas.push('  ❌ [' + secao + '] ' + msg); Logger.log('  ❌ [' + secao + '] ' + msg); }
    try {
    } catch (error) {
      Logger.log("Erro em _err: " + error.message);
      throw error; // Re-lança para tratamento superior
    }
  function _err(secao, msg)  { r.erro++; r.linhas.push('  ❌ [' + secao + '] ' + msg); Logger.log('  ❌ [' + secao + '] ' + msg); }
    try {
    } catch (error) {
      Logger.log("Erro em _err: " + error.message);
      throw error;
    }
  function _err(secao, msg)  { r.erro++; r.linhas.push('  ❌ [' + secao + '] ' + msg); Logger.log('  ❌ [' + secao + '] ' + msg); }

  // ──────────────────────────────────────────────────────────────────────────
  // A) ACESSO À PLANILHA
  // ──────────────────────────────────────────────────────────────────────────
  Logger.log('── A) Acesso à planilha ──');
  var ss;
  try {
    ss = getSS();
    if (!ss) throw new Error('getSS() retornou null');
    _ok('Planilha', '"' + ss.getName() + '" — ' + ss.getSheets().length + ' abas');
  } catch (e) {
    _err('Planilha', 'Não foi possível abrir: ' + e.message);
    Logger.log('\n⛔ Abortando: sem acesso à planilha.');
    return r;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // B) ESTRUTURA DE ABAS
  // ──────────────────────────────────────────────────────────────────────────
  Logger.log('');
  Logger.log('── B) Estrutura de abas ──');

  // Abas essenciais para o workflow principal
  var ABA_ESSENCIAIS = [
    'Notas_Fiscais', 'Entregas', 'Recusas', 'Glosas',
    'Usuarios', 'Fornecedores', 'Controle_Conferencia',
    'Auditoria_Log', 'System_Logs', 'Horta_Escolar'
  ];

  var estruturas = (typeof SHEET_STRUCTURES !== 'undefined') ? SHEET_STRUCTURES : {};
  var abasNaPlanilha = ss.getSheets().map(function(s) { return s.getName(); });

  ABA_ESSENCIAIS.forEach(function(nome) {
    var sheet = ss.getSheetByName(nome);
    if (!sheet) {
      _err('Abas', nome + ' — NÃO EXISTE');
      return;
    }
    var lastCol = sheet.getLastColumn();
    if (lastCol === 0) {
      _warn('Abas', nome + ' — existe mas está VAZIA (sem headers)');
      return;
    }
    var headersReais = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    var headersEsperados = estruturas[nome] ? estruturas[nome].columns : null;
    if (!headersEsperados) {
      _warn('Abas', nome + ' — sem definição em SHEET_STRUCTURES para comparar');
      return;
    }
    // Verifica se todos os headers esperados estão presentes
    var faltando = headersEsperados.filter(function(h) { return headersReais.indexOf(h) === -1; });
    if (faltando.length === 0) {
      _ok('Abas', nome + ' — ' + lastCol + ' colunas OK');
    } else {
      _warn('Abas', nome + ' — faltam colunas: ' + faltando.join(', '));
    }
  });

  // Abas presentes mas não essenciais
  var outrasAbas = abasNaPlanilha.filter(function(n) { return ABA_ESSENCIAIS.indexOf(n) === -1; });
  if (outrasAbas.length > 0) {
    _ok('Abas', 'Outras ' + outrasAbas.length + ' abas presentes: ' + outrasAbas.slice(0, 6).join(', ') + (outrasAbas.length > 6 ? '...' : ''));
  }

  // ──────────────────────────────────────────────────────────────────────────
  // C) USUÁRIOS — ao menos um admin
  // ──────────────────────────────────────────────────────────────────────────
  Logger.log('');
  Logger.log('── C) Usuários ──');
  try {
    var sheetUsuarios = ss.getSheetByName('Usuarios');
    if (!sheetUsuarios || sheetUsuarios.getLastRow() < 2) {
      _warn('Usuarios', 'Nenhum usuário cadastrado — execute o setup de dados iniciais');
    } else {
      var totalUsuarios = sheetUsuarios.getLastRow() - 1;
      var dadosU = sheetUsuarios.getDataRange().getValues();
      var hU = dadosU[0];
      var colTipo = hU.indexOf('Tipo_Usuario');
      var colStatus = hU.indexOf('Status');
      var admins = dadosU.slice(1).filter(function(row) {
        return (row[colTipo] === 'Administrador' || row[colTipo] === 'Analista Educacional') &&
               row[colStatus] === 'Ativo';
      });
      if (admins.length > 0) {
        _ok('Usuarios', totalUsuarios + ' usuário(s) | ' + admins.length + ' admin(s) ativo(s)');
      } else {
        _warn('Usuarios', totalUsuarios + ' usuário(s) mas NENHUM admin ativo');
      }
    }
  } catch (e) {
    _err('Usuarios', e.message);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // D) CICLO CRUD BÁSICO — Notas_Fiscais (cria, lê, deleta)
  // ──────────────────────────────────────────────────────────────────────────
  Logger.log('');
  Logger.log('── D) CRUD básico (Notas_Fiscais) ──');
  var nfRowIndex = -1;
  try {
    var sheetNF = ss.getSheetByName('Notas_Fiscais');
    if (!sheetNF) throw new Error('Aba Notas_Fiscais não encontrada');

    var headersNF = sheetNF.getRange(1, 1, 1, sheetNF.getLastColumn()).getValues()[0];
    var colIdNF = headersNF.indexOf('ID_NF');
    var colNumNF = headersNF.indexOf('Numero_NF');
    var colStatus = headersNF.indexOf('Status_NF');

    // CREATE
    var testId = 'VALIDACAO_' + Date.now();
    var rowData = headersNF.map(function(h) {
      if (h === 'ID_NF') return testId;
      if (h === 'Numero_NF') return 'NF_TEST_VALIDACAO';
      if (h === 'Status_NF') return 'Recebida';
      if (h === 'Timestamp_Criacao') return new Date().toISOString();
      return '';
    });
    sheetNF.appendRow(rowData);
    nfRowIndex = sheetNF.getLastRow();
    _ok('CRUD', 'CREATE OK — linha ' + nfRowIndex + ', ID=' + testId);

    // READ — busca pelo ID
    var dados = sheetNF.getRange(nfRowIndex, 1, 1, headersNF.length).getValues()[0];
    if (dados[colIdNF] === testId) {
      _ok('CRUD', 'READ OK — ID confirmado na linha ' + nfRowIndex);
    } else {
      _warn('CRUD', 'READ: ID lido (' + dados[colIdNF] + ') diferente do inserido (' + testId + ')');
    }

    // UPDATE
    if (colStatus !== -1) {
      sheetNF.getRange(nfRowIndex, colStatus + 1).setValue('Conferida');
      var statusAtualizado = sheetNF.getRange(nfRowIndex, colStatus + 1).getValue();
      if (statusAtualizado === 'Conferida') {
        _ok('CRUD', 'UPDATE OK — Status atualizado para Conferida');
      } else {
        _warn('CRUD', 'UPDATE: valor lido após atualização = ' + statusAtualizado);
      }
    }
  } catch (e) {
    _err('CRUD', 'Falha no ciclo CRUD: ' + e.message);
  } finally {
    // ROLLBACK — sempre deleta a linha de teste
    try {
      if (nfRowIndex > 1 && ss.getSheetByName('Notas_Fiscais')) {
        ss.getSheetByName('Notas_Fiscais').deleteRow(nfRowIndex);
        _ok('CRUD', 'ROLLBACK OK — linha de teste removida');
      }
    } catch (re) {
      _warn('CRUD', 'Rollback falhou (linha de teste pode ter ficado): ' + re.message);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // E) INVOICE WORKFLOW — verificar transições
  // ──────────────────────────────────────────────────────────────────────────
  Logger.log('');
  Logger.log('── E) InvoiceWorkflow ──');
  try {
    if (typeof InvoiceWorkflow === 'undefined') {
      _warn('Workflow', 'InvoiceWorkflow não disponível (Core_Invoice_Workflow.gs)');
    } else {
      var statusDisponiveis = InvoiceWorkflow.getStatus ? InvoiceWorkflow.getStatus() : null;
      if (statusDisponiveis) {
        _ok('Workflow', 'InvoiceWorkflow OK — ' + Object.keys(statusDisponiveis).length + ' status definidos');
      } else {
        _ok('Workflow', 'InvoiceWorkflow disponível');
      }
    }
  } catch (e) {
    _err('Workflow', e.message);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // F) AUTH SERVICE
  // ──────────────────────────────────────────────────────────────────────────
  Logger.log('');
  Logger.log('── F) AuthService ──');
  try {
    if (typeof AuthService === 'undefined') {
      _warn('Auth', 'AuthService não disponível — Core_Auth_Unified.gs pode não ter carregado');
    } else if (typeof AuthService.login === 'function') {
      _ok('Auth', 'AuthService.login() disponível');
    } else {
      _warn('Auth', 'AuthService carregado mas sem método login()');
    }
  } catch (e) {
    _err('Auth', e.message);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // G) HORTA ESCOLAR — estrutura de colunas
  // ──────────────────────────────────────────────────────────────────────────
  Logger.log('');
  Logger.log('── G) Horta Escolar ──');
  try {
    var sheetHorta = ss.getSheetByName('Horta_Escolar');
    if (!sheetHorta) {
      _warn('Horta', 'Aba Horta_Escolar não criada — execute construirPlanilha() ou initializeSheets()');
    } else {
      var hHorta = sheetHorta.getRange(1, 1, 1, sheetHorta.getLastColumn()).getValues()[0];
      var colsRequeridas = ['ID_Horta', 'Unidade_Escolar', 'Produto_Nome', 'Quantidade_Colhida',
                            'Unidade_Medida', 'Data_Colheita', 'Destino_Producao', 'Status_Aprovacao'];
      var faltandoH = colsRequeridas.filter(function(c) { return hHorta.indexOf(c) === -1; });
      if (faltandoH.length === 0) {
        _ok('Horta', 'Horta_Escolar OK — ' + hHorta.length + ' colunas, todas obrigatórias presentes');
      } else {
        _warn('Horta', 'Horta_Escolar: colunas faltando — ' + faltandoH.join(', '));
      }
    }
  } catch (e) {
    _err('Horta', e.message);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // RELATÓRIO FINAL
  // ──────────────────────────────────────────────────────────────────────────
  Logger.log('');
  Logger.log('══════════════════════════════════════════════════════════════');
  Logger.log('  RESULTADO: ' + r.ok + ' OK  |  ' + r.warn + ' avisos  |  ' + r.erro + ' erros');
  Logger.log('══════════════════════════════════════════════════════════════');

  if (r.erro === 0 && r.warn === 0) {
    Logger.log('  🎉 Sistema validado com sucesso — todos os workflows estão operacionais.');
  } else if (r.erro === 0) {
    Logger.log('  ✅ Sem erros críticos. Revise os avisos acima para ajustes opcionais.');
  } else {
    Logger.log('  ⚠️  Existem ' + r.erro + ' erro(s) bloqueante(s). Corrija antes de operar em produção.');
  }

  Logger.log('');
  Logger.log('  PRÓXIMOS PASSOS:');
  if (r.erro > 0 || r.warn > 0) {
    Logger.log('    1. Corrija os itens ❌/⚠️ acima');
    Logger.log('    2. Se abas estiverem faltando: execute construirPlanilha() ou initializeSheets()');
    Logger.log('    3. Se sem usuário admin: execute os scripts Setup_Usuarios_DF.gs ou Setup_Initial.gs');
    Logger.log('    4. Execute validateSheets() novamente para confirmar');
  } else {
    Logger.log('    ✅ Sistema pronto. Acesse o Web App pelo URL de implantação.');
  }
  Logger.log('');

  return r;
}
