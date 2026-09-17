/**
 * @fileoverview Setup Unificado do Sistema UNIAE CRE
 * @version 5.0.0
 *
 * Este arquivo centraliza TODAS as funções de setup do sistema.
 * Substitui: Setup_Initial.gs, Setup_Simples.gs, Setup_Database_Structure.gs
 *
 * @author UNIAE CRE Team
 * @created 2025-12-04
 */

'use strict';

// ============================================================================
// SETUP PRINCIPAL
// ============================================================================

/**
 * Setup completo do sistema - FUNÇÃO PRINCIPAL
 * Execute esta função para configurar o sistema do zero
 * @param {Object} [options] - Opções de setup
 * @returns {Object} Resultado do setup
 */
function setupCompleto(options) {
  try {
    options = options || {};

    var resultado = {
      success: false,
      timestamp: new Date().toISOString(),
      etapas: [],
      erros: [],
      avisos: []
    };

    Logger.log('═══════════════════════════════════════════════════════════');
    Logger.log('   SETUP COMPLETO DO SISTEMA UNIAE CRE v5.0.0');
    Logger.log('═══════════════════════════════════════════════════════════');
    Logger.log('');

    try {
      // Etapa 1: Configurar propriedades
      Logger.log('📋 Etapa 1: Configurando propriedades...');
      var propsResult = _setupPropriedades();
      resultado.etapas.push({ nome: 'Propriedades', ...propsResult });
      if (!propsResult.success) {
        resultado.erros.push('Falha ao configurar propriedades');
      }

      // Etapa 2: Criar estrutura de abas
      Logger.log('📊 Etapa 2: Criando estrutura de abas...');
      var abasResult = _setupAbas(options.forceRecreate);
      resultado.etapas.push({ nome: 'Abas', ...abasResult });
      if (!abasResult.success) {
        resultado.avisos.push('Algumas abas não foram criadas');
      }

      // Etapa 3: Criar usuário admin
      Logger.log('👤 Etapa 3: Configurando usuário admin...');
      var adminResult = _setupAdmin();
      resultado.etapas.push({ nome: 'Admin', ...adminResult });

      // Etapa 4: Inicializar cache e índices
      Logger.log('⚡ Etapa 4: Inicializando cache e índices...');
      var cacheResult = _setupCache();
      resultado.etapas.push({ nome: 'Cache', ...cacheResult });

      // Etapa 5: Criar menus
      Logger.log('📑 Etapa 5: Criando menus...');
      var menuResult = _setupMenus();
      resultado.etapas.push({ nome: 'Menus', ...menuResult });

      // Resultado final
      resultado.success = resultado.erros.length === 0;

      Logger.log('');
      Logger.log('═══════════════════════════════════════════════════════════');
      if (resultado.success) {
        Logger.log('   ✅ SETUP CONCLUÍDO COM SUCESSO!');
      } else {
        Logger.log('   ⚠️ SETUP CONCLUÍDO COM AVISOS');
        resultado.erros.forEach(function(e) { Logger.log('   ❌ ' + e); });
      }
      Logger.log('═══════════════════════════════════════════════════════════');

      // Mostrar toast se possível
      safeShowToast('Setup concluído!', resultado.success ? '✅ Sucesso' : '⚠️ Avisos', 5);

    } catch (e) {
      resultado.success = false;
      resultado.erros.push(e.message);
      Logger.log('❌ ERRO NO SETUP: ' + e.message);
    }

    return resultado;
  } catch (error) {
    Logger.log("Erro em setupCompleto: " + error.message);
    throw error;
  }
}

// ============================================================================
// ETAPAS DO SETUP
// ============================================================================

/**
 * Configura propriedades do script
 * @private
 */
function _setupPropriedades() {
  try {
    var ss = getSS();
    if (!ss) {
      return { success: false, message: 'Planilha não encontrada' };
    }

    var spreadsheetId = ss.getId();
    var props = PropertiesService.getScriptProperties();

    // Salvar ID da planilha
    props.setProperty('SPREADSHEET_ID', spreadsheetId);
    Logger.log('   ✅ SPREADSHEET_ID: ' + spreadsheetId);

    // Tentar obter pasta pai
    try {
      var file = DriveApp.getFileById(spreadsheetId);
      var folders = file.getParents();
      if (folders.hasNext()) {
        var folderId = folders.next().getId();
        props.setProperty('DRIVE_FOLDER_ID', folderId);
        Logger.log('   ✅ DRIVE_FOLDER_ID: ' + folderId);
      }
    } catch (e) {
      Logger.log('   ⚠️ Não foi possível obter pasta: ' + e.message);
    }

    // Configurações padrão
    if (!props.getProperty('GEMINI_TEMPERATURE')) {
      props.setProperty('GEMINI_TEMPERATURE', '0.7');
    }

    return { success: true, message: 'Propriedades configuradas' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Cria estrutura de abas
 * @private
 */
function _setupAbas(forceRecreate) {
  try {
    var ss = getSS();
    if (!ss) {
      return { success: false, message: 'Planilha não encontrada' };
    }

    var abasCriadas = [];
    var abasExistentes = [];
    var erros = [];

    // Lista de abas a criar (usa SCHEMA se disponível)
    var abas = _getAbasParaCriar();

    abas.forEach(function(aba) {
      try {
        var sheet = ss.getSheetByName(aba.nome);

        if (sheet && !forceRecreate) {
          abasExistentes.push(aba.nome);
          Logger.log('   ⏭️ ' + aba.nome + ' (já existe)');
        } else {
          if (sheet && forceRecreate) {
            ss.deleteSheet(sheet);
          }

          sheet = ss.insertSheet(aba.nome);

          // Adicionar headers
          if (aba.headers && aba.headers.length > 0) {
            sheet.getRange(1, 1, 1, aba.headers.length).setValues([aba.headers]);
            sheet.getRange(1, 1, 1, aba.headers.length).setFontWeight('bold');
            sheet.setFrozenRows(1);
          }

          abasCriadas.push(aba.nome);
          Logger.log('   ✅ ' + aba.nome + ' (criada)');
        }
      } catch (e) {
        erros.push(aba.nome + ': ' + e.message);
        Logger.log('   ❌ ' + aba.nome + ': ' + e.message);
      }
    });

    return {
      success: erros.length === 0,
      criadas: abasCriadas.length,
      existentes: abasExistentes.length,
      erros: erros
    };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Retorna lista de abas para criar
 * @private
 */
function _getAbasParaCriar() {
  try {
    // Se SCHEMA estiver disponível, usa ele
    if (typeof SCHEMA !== 'undefined' && SCHEMA.SHEETS) {
      var abas = [];
      for (var key in SCHEMA.SHEETS) {
        if (SCHEMA.SHEETS.hasOwnProperty(key)) {
          var config = SCHEMA.SHEETS[key];
          abas.push({
            nome: config.name,
            headers: config.columns || []
          });
        }
      }
      return abas;
    }

    // Usa constantes SHEET_NAMES se disponíveis
    var SN = typeof SHEET_NAMES !== 'undefined' ? SHEET_NAMES : {
      USUARIOS: 'Usuarios',
      NOTAS_FISCAIS: 'Notas_Fiscais',
      ENTREGAS: 'Entregas',
      FORNECEDORES: 'Fornecedores',
      ESCOLAS: 'Escolas',
      PRODUTOS: 'Produtos',
      PROCESSOS_ATESTO: 'Processos_Atesto',
      RECUSAS: 'Recusas',
      GLOSAS: 'Glosas',
      AUDITORIA: 'Auditoria_Log',
      CONFIGURACOES: 'Configuracoes'
    };

    // Fallback: lista básica
    // NOTA: Use USUARIOS_SCHEMA de Core_Schema_Usuarios.gs como fonte única de verdade
    var usuariosHeaders = (typeof USUARIOS_SCHEMA !== 'undefined') 
      ? USUARIOS_SCHEMA.HEADERS 
      : ['email', 'nome', 'senha', 'tipo', 'instituicao', 'telefone', 'cpf', 'cnpj', 'ativo', 'dataCriacao', 'dataAtualizacao', 'ultimoAcesso', 'token'];
  
    return [
      { nome: SN.USUARIOS, headers: usuariosHeaders },
      { nome: SN.NOTAS_FISCAIS, headers: ['ID', 'Numero', 'Serie', 'Fornecedor', 'CNPJ', 'Data_Emissao', 'Valor_Total', 'Status', 'Observacoes'] },
      { nome: SN.ENTREGAS, headers: ['ID', 'NF_ID', 'Escola', 'Data_Entrega', 'Responsavel', 'Status', 'Observacoes'] },
      { nome: 'Recebimentos', headers: ['ID', 'Entrega_ID', 'Data_Recebimento', 'Conferente', 'Status', 'Observacoes'] },
      { nome: SN.FORNECEDORES, headers: ['ID', 'CNPJ', 'Razao_Social', 'Nome_Fantasia', 'Contato', 'Telefone', 'Email', 'Status'] },
      { nome: SN.ESCOLAS, headers: ['ID', 'INEP', 'Nome', 'CRE', 'Endereco', 'Telefone', 'Diretor', 'Status'] },
      { nome: SN.PRODUTOS, headers: ['ID', 'Codigo', 'Descricao', 'Unidade', 'Categoria', 'Status'] },
      { nome: SN.PROCESSOS_ATESTO, headers: ['ID', 'Numero_SEI', 'NF_ID', 'Status', 'Data_Abertura', 'Data_Fechamento', 'Responsavel'] },
      { nome: SN.RECUSAS, headers: ['ID', 'Entrega_ID', 'Motivo', 'Descricao', 'Data', 'Responsavel'] },
      { nome: SN.GLOSAS, headers: ['ID', 'NF_ID', 'Valor', 'Motivo', 'Data', 'Responsavel'] },
      { nome: SN.AUDITORIA, headers: ['ID', 'Data', 'Usuario', 'Acao', 'Entidade', 'Entidade_ID', 'Detalhes'] },
      { nome: SN.CONFIGURACOES, headers: ['Chave', 'Valor', 'Descricao', 'Ultima_Atualizacao'] }
    ];
  } catch (error) {
    Logger.log("Erro em _getAbasParaCriar: " + error.message);
    throw error;
  }
}

/**
 * Configura usuário admin
 * @private
 */
function _setupAdmin() {
  try {
    try {
      try {
        try {
          var ss = getSS();
          // Usa constante SHEET_NAMES para evitar magic strings
          var sheetName = typeof SHEET_NAMES !== 'undefined' ? SHEET_NAMES.USUARIOS : 'Usuarios';
          var sheet = ss.getSheetByName(sheetName);

          if (!sheet) {
            return { success: false, message: getErrorMessage('SHEET', 'SHEET_NOT_FOUND', sheetName) };
          }

          // Verificar se já existe admin
          var data = sheet.getDataRange().getValues();
          var hasAdmin = false;
          var adminType = typeof USER_TYPES !== 'undefined' ? USER_TYPES.ADMIN : 'ADMIN';

          for (var i = 1; i < data.length; i++) {
            if (data[i][4] === adminType || data[i][4] === 'Administrador') {
              hasAdmin = true;
              break;
            }
          }

          if (hasAdmin) {
            Logger.log('   ⏭️ Admin já existe');
            return { success: true, message: 'Admin já existe' };
          }

          // Criar admin padrão - arquitetura 100% digital
          var adminId = 'USR-' + new Date().getTime();
          var senhaTextoPlano = 'Admin@2025'; // Texto plano - arquitetura 100% digital

          var adminRow = [
            adminId,
            'Administrador',
            'admin@uniae.df.gov.br',
            senhaTextoPlano, // Texto plano - não usar hash
            adminType,
            typeof STATUS !== 'undefined' ? STATUS.ATIVO : 'Ativo',
            'CRE-PP',
            new Date(),
            ''
          ];

          sheet.appendRow(adminRow);
          Logger.log('   ✅ Admin criado com credencial inicial configurada.');

          return { success: true, message: 'Admin criado' };
        } catch (e) {
          return { success: false, message: e.message };
        }
      } catch (error) {
        Logger.log("Erro em _setupAdmin: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em _setupAdmin: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em _setupAdmin: " + error.message);
    throw error;
  }
}

/**
 * Retorna senha em texto plano (arquitetura 100% digital)
 * Sistema usa autenticação digital - usuário autenticado = identidade confirmada
 * @private
 * @deprecated Mantido apenas para compatibilidade - não usar hash
 */
function _hashSenha(senha) {
  return senha; // Texto plano - arquitetura 100% digital
}

/**
 * Inicializa cache e índices
 * @private
 */
function _setupCache() {
  try {
    try {
      // Limpar cache antigo
      try {
        CacheService.getScriptCache().removeAll(['index_*']);
      } catch (e) {
        // Cache cleanup é não-crítico, apenas loga para diagnóstico
        Logger.log('⚠️ Cache cleanup falhou (não-crítico): ' + e.message);
      }

      // Inicializar índices se QueryOptimizer disponível
      if (typeof QueryOptimizer !== 'undefined' && QueryOptimizer.initializeCommonIndices) {
        QueryOptimizer.initializeCommonIndices();
        Logger.log('   ✅ Índices inicializados');
      } else {
        Logger.log('   ⏭️ QueryOptimizer não disponível');
      }

      return { success: true, message: 'Cache configurado' };
    } catch (e) {
      return { success: false, message: e.message };
    }
  } catch (error) {
    Logger.log("Erro em _setupCache: " + error.message);
    throw error;
  }
}

/**
 * Cria menus do sistema
 * @private
 */
function _setupMenus() {
  try {
    try {
      var ui = getUiSafely();
      if (!ui) {
        Logger.log('   ⏭️ UI não disponível');
        return { success: true, message: 'UI não disponível' };
      }

      ui.createMenu('🍎 UNIAE CRE')
        .addItem('🏠 Dashboard', 'openDashboard')
        .addItem('📋 Notas Fiscais', 'openNotasFiscais')
        .addItem('🚚 Entregas', 'openEntregas')
        .addSeparator()
        .addSubMenu(ui.createMenu('⚙️ Configurações')
          .addItem('👤 Usuários', 'abrirCadastroUsuario')
          .addItem('📊 Auditoria', 'abrirAuditoria'))
        .addSeparator()
        .addItem('❓ Ajuda', 'openAjuda')
        .addToUi();

      Logger.log('   ✅ Menu criado');
      return { success: true, message: 'Menu criado' };
    } catch (e) {
      return { success: false, message: e.message };
    }
  } catch (error) {
    Logger.log("Erro em _setupMenus: " + error.message);
    throw error;
  }
}

// ============================================================================
// FUNÇÕES DE SETUP ESPECÍFICAS
// ============================================================================

/**
 * Setup rápido - apenas verifica e cria abas faltantes
 */
function setupRapido() {
  Logger.log('🚀 Setup Rápido iniciado...');

  var resultado = _setupAbas(false);

  if (resultado.success) {
    safeShowToast('Setup rápido concluído!', '✅', 3);
  }

  return resultado;
}

/**
 * Verifica integridade da estrutura
 */
function verificarEstrutura() {
  try {
    var ss = getSS();
    if (!ss) {
      return { success: false, message: 'Planilha não encontrada' };
    }

    var abas = _getAbasParaCriar();
    var existentes = [];
    var faltando = [];

    abas.forEach(function(aba) {
      var sheet = ss.getSheetByName(aba.nome);
      if (sheet) {
        existentes.push(aba.nome);
      } else {
        faltando.push(aba.nome);
      }
    });

    return {
      success: faltando.length === 0,
      total: abas.length,
      existentes: existentes,
      faltando: faltando
    };
  } catch (error) {
    Logger.log("Erro em verificarEstrutura: " + error.message);
    throw error;
  }
}

/**
 * Reseta o sistema (CUIDADO!)
 */
function resetarSistema() {
  try {
    var ui = getUiSafely();

    if (ui) {
      var response = ui.alert(
        '⚠️ ATENÇÃO - OPERAÇÃO DESTRUTIVA',
        'Esta operação irá APAGAR TODOS OS DADOS!\n\n' +
        'Tem certeza que deseja continuar?',
        ui.ButtonSet.YES_NO
      );

      if (response !== ui.Button.YES) {
        return { success: false, message: 'Cancelado pelo usuário' };
      }
    }

    return setupCompleto({ forceRecreate: true });
  } catch (error) {
    Logger.log("Erro em resetarSistema: " + error.message);
    throw error;
  }
}

// ============================================================================
// TESTES
// ============================================================================

/**
 * Testa o setup
 */
function testSetupUnified() {
  Logger.log('═══════════════════════════════════════════════════════════');
  Logger.log('   TESTE DE SETUP UNIFICADO');
  Logger.log('═══════════════════════════════════════════════════════════');

  var passed = 0;
  var failed = 0;

  // Teste 1: setupCompleto existe
  var test1 = typeof setupCompleto === 'function';
  Logger.log((test1 ? '✅' : '❌') + ' setupCompleto existe');
  if (test1) passed++; else failed++;

  // Teste 2: setupRapido existe
  var test2 = typeof setupRapido === 'function';
  Logger.log((test2 ? '✅' : '❌') + ' setupRapido existe');
  if (test2) passed++; else failed++;

  // Teste 3: verificarEstrutura existe
  var test3 = typeof verificarEstrutura === 'function';
  Logger.log((test3 ? '✅' : '❌') + ' verificarEstrutura existe');
  if (test3) passed++; else failed++;

  // Teste 4: _getAbasParaCriar retorna array
  var test4 = Array.isArray(_getAbasParaCriar());
  Logger.log((test4 ? '✅' : '❌') + ' _getAbasParaCriar retorna array');
  if (test4) passed++; else failed++;

  // Teste 5: verificarEstrutura funciona
  var estrutura = verificarEstrutura();
  var test5 = typeof estrutura === 'object' && 'faltando' in estrutura;
  Logger.log((test5 ? '✅' : '❌') + ' verificarEstrutura funciona');
  if (test5) passed++; else failed++;

  Logger.log('');
  Logger.log('Resultado: ' + passed + '/' + (passed + failed) + ' testes passaram');
  Logger.log('═══════════════════════════════════════════════════════════');

  return { passed: passed, failed: failed };
}

Logger.log('✅ Core_Setup_Unified.gs carregado');
