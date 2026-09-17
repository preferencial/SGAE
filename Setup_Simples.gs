'use strict';

/**
 * SETUP_SIMPLES.gs
 * Setup simplificado que funciona em qualquer contexto
 *
 * Use estas funções quando precisar executar setup sem UI
 * (triggers, execuções em background, etc.)
 *
 * @version 1.0.0
 * @created 2025-11-27
 */

// ============================================================================
// CONFIGURAÇÃO DA PASTA DO DRIVE
// ============================================================================

/**
 * ID da pasta padrão do Google Drive para o projeto UNIAE
 * https://drive.google.com/drive/folders/1w1_45AjB_wB4KMZbP6JevqD382FyBZ53
 */
var PASTA_DRIVE_UNIAE = '1w1_45AjB_wB4KMZbP6JevqD382FyBZ53';

/**
 * Atualiza a pasta do Google Drive nas propriedades do script
 * Execute esta função para garantir que a pasta correta está configurada
 */
function atualizarPastaDrive() {
  try {
    var props = PropertiesService.getScriptProperties();
  
    // Atualizar todas as propriedades relacionadas à pasta
    props.setProperty('DRIVE_FOLDER_ID', PASTA_DRIVE_UNIAE);
    props.setProperty('FOLDER_ID', PASTA_DRIVE_UNIAE);
  
    Logger.log('✅ Pasta do Drive atualizada com sucesso!');
    Logger.log('   ID: ' + PASTA_DRIVE_UNIAE);
    Logger.log('   URL: https://drive.google.com/drive/folders/' + PASTA_DRIVE_UNIAE);
  
    // Verificar se a pasta existe e está acessível
    try {
      var folder = DriveApp.getFolderById(PASTA_DRIVE_UNIAE);
      Logger.log('   Nome da pasta: ' + folder.getName());
      Logger.log('   Acesso: ✅ OK');
    } catch (e) {
      Logger.log('   ⚠️ Aviso: Não foi possível acessar a pasta. Verifique as permissões.');
      Logger.log('   Erro: ' + e.message);
    }
  
    return {
      success: true,
      folderId: PASTA_DRIVE_UNIAE,
      url: 'https://drive.google.com/drive/folders/' + PASTA_DRIVE_UNIAE
    };
  } catch (error) {
    Logger.log("Erro em atualizarPastaDrive: " + error.message);
    throw error;
  }
}

/**
 * Verifica a configuração atual da pasta do Drive
 */
function verificarPastaDrive() {
  var props = PropertiesService.getScriptProperties();
  var folderId = props.getProperty('DRIVE_FOLDER_ID') || props.getProperty('FOLDER_ID');
  
  Logger.log('=== CONFIGURAÇÃO DA PASTA DO DRIVE ===');
  Logger.log('Pasta configurada: ' + (folderId || 'NÃO CONFIGURADA'));
  Logger.log('Pasta esperada: ' + PASTA_DRIVE_UNIAE);
  Logger.log('Status: ' + (folderId === PASTA_DRIVE_UNIAE ? '✅ CORRETO' : '⚠️ DIFERENTE'));
  
  if (folderId !== PASTA_DRIVE_UNIAE) {
    Logger.log('');
    Logger.log('Execute atualizarPastaDrive() para corrigir.');
  }
  
  return {
    configurada: folderId,
    esperada: PASTA_DRIVE_UNIAE,
    correta: folderId === PASTA_DRIVE_UNIAE
  };
}

// ============================================================================

/**
 * Setup completo sem dependência de UI
 * Executa todas as etapas automaticamente
 */
function setupSimplesCompleto() {
  Logger.log('🚀 Iniciando Setup Simples...');
  Logger.log('');

  var resultados = {
    configuracao: false,
    abas: false,
    otimizacao: false,
    usuarios: false,
    sucesso: false
  };

  try {
    // 1. Configurar IDs
    Logger.log('📋 Etapa 1/4: Configurando IDs...');
    var configResult = configurarIDsAutomatico();
    resultados.configuracao = configResult.success;

    if (!configResult.success) {
      throw new Error('Falha na configuração de IDs: ' + configResult.message);
    }
    Logger.log('✅ IDs configurados');
    Logger.log('');

    // 2. Criar abas
    Logger.log('📋 Etapa 2/4: Criando abas...');
    var abasResult = criarAbasAutomatico();
    resultados.abas = abasResult.success;

    if (!abasResult.success) {
      throw new Error('Falha ao criar abas: ' + abasResult.message);
    }
    Logger.log('✅ Abas criadas: ' + abasResult.abasCriadas);
    Logger.log('');

    // 3. Inicializar otimização
    Logger.log('📋 Etapa 3/4: Inicializando otimização...');
    try {
      if (typeof initializeOptimizationSystem === 'function') {
        initializeOptimizationSystem();
        resultados.otimizacao = true;
        Logger.log('✅ Sistema de otimização inicializado');
      } else {
        Logger.log('⚠️ Sistema de otimização não disponível');
      }
    } catch (e) {
      Logger.log('⚠️ Erro ao inicializar otimização: ' + e.message);
    }
    Logger.log('');

    // 4. Criar usuários padrão
    Logger.log('📋 Etapa 4/4: Criando usuários padrão...');
    try {
      if (typeof criarUsuariosPadraoDF === 'function') {
        var usuariosResult = criarUsuariosPadraoDF(true);
        resultados.usuarios = usuariosResult.sucesso;

        if (usuariosResult.sucesso) {
          Logger.log('✅ Usuários criados: ' + usuariosResult.usuariosCriados);
        } else {
          Logger.log('⚠️ Usuários não criados: ' + usuariosResult.erro);
        }
      } else {
        Logger.log('⚠️ Função de criação de usuários não disponível');
      }
    } catch (e) {
      Logger.log('⚠️ Erro ao criar usuários: ' + e.message);
    }
    Logger.log('');

    // Verificar sucesso geral
    resultados.sucesso = resultados.configuracao && resultados.abas;

    // Resumo
    Logger.log('═══════════════════════════════════════');
    Logger.log('📊 RESUMO DO SETUP');
    Logger.log('═══════════════════════════════════════');
    Logger.log('✅ Configuração: ' + (resultados.configuracao ? 'OK' : 'FALHOU'));
    Logger.log('✅ Abas: ' + (resultados.abas ? 'OK' : 'FALHOU'));
    Logger.log('✅ Otimização: ' + (resultados.otimizacao ? 'OK' : 'PULADO'));
    Logger.log('✅ Usuários: ' + (resultados.usuarios ? 'OK' : 'PULADO'));
    Logger.log('═══════════════════════════════════════');

    if (resultados.sucesso) {
      Logger.log('');
      Logger.log('🎉 SETUP CONCLUÍDO COM SUCESSO!');
      Logger.log('');
      Logger.log('📧 CREDENCIAIS DE TESTE:');
      Logger.log('[LGPD] Evento registrado; detalhes sensíveis omitidos.');
      Logger.log('[LGPD] Evento registrado; detalhes sensíveis omitidos.');
      Logger.log('');
      Logger.log('🚀 Sistema pronto para uso!');
    } else {
      Logger.log('');
      Logger.log('❌ SETUP FALHOU');
      Logger.log('   Verifique os erros acima');
    }

    return resultados;

  } catch (e) {
    Logger.log('');
    Logger.log('❌ ERRO CRÍTICO NO SETUP');
    Logger.log('   ' + e.message);
    Logger.log('   Stack: ' + e.stack);

    resultados.erro = e.message;
    return resultados;
  }
}

/**
 * Configura IDs automaticamente
 */
function configurarIDsAutomatico() {
  try {
    var ss = getSS();
    var spreadsheetId = ss.getId();

    Logger.log('   Spreadsheet ID: ' + spreadsheetId);

    // Obter folder ID
    var folderId = '';
    try {
      var file = DriveApp.getFileById(spreadsheetId);
      var folders = file.getParents();
      if (folders.hasNext()) {
        folderId = folders.next().getId();
        Logger.log('   Folder ID: ' + folderId);
      }
    } catch (e) {
      Logger.log('   ⚠️ Não foi possível obter Folder ID: ' + e.message);
    }

    // Salvar nas propriedades
    var props = PropertiesService.getScriptProperties();
    props.setProperty('SPREADSHEET_ID', spreadsheetId);
    if (folderId) {
      props.setProperty('FOLDER_ID', folderId);
    }

    return {
      success: true,
      spreadsheetId: spreadsheetId,
      folderId: folderId
    };

  } catch (e) {
    return {
      success: false,
      message: e.message
    };
  }
}

/**
 * Cria abas automaticamente
 */
function criarAbasAutomatico() {
  try {
    var ss = getSS();
    var abasNecessarias = [
      'Usuarios',
      'Notas_Fiscais',
      'Entregas',
      'Recusas',
      'Glosas',
      'Fornecedores',
      'PDGP',
      'PDGA',
      'Controle_Conferencia',
      'Auditoria_Log',
      'Config_Membros_Comissao',
      'Textos_Padrao',
      'System_Logs'
    ];

    var abasCriadas = 0;
    var abasExistentes = 0;

    abasNecessarias.forEach(function(nomeAba) {
      var sheet = ss.getSheetByName(nomeAba);

      if (!sheet) {
        sheet = ss.insertSheet(nomeAba);
        abasCriadas++;
        Logger.log('   ✅ Aba criada: ' + nomeAba);
      } else {
        abasExistentes++;
        Logger.log('   ⚠️ Aba já existe: ' + nomeAba);
      }
    });

    return {
      success: true,
      abasCriadas: abasCriadas,
      abasExistentes: abasExistentes,
      total: abasNecessarias.length
    };

  } catch (e) {
    return {
      success: false,
      message: e.message
    };
  }
}

/**
 * Verifica status do sistema
 */
function verificarStatusSistema() {
  try {
    Logger.log('🔍 Verificando status do sistema...');
    Logger.log('');

    var status = {
      configuracao: false,
      abas: false,
      usuarios: false,
      otimizacao: false
    };

    // Verificar configuração
    try {
      var props = PropertiesService.getScriptProperties();
      var spreadsheetId = props.getProperty('SPREADSHEET_ID');
      status.configuracao = !!spreadsheetId;
      Logger.log('✅ Configuração: ' + (status.configuracao ? 'OK' : 'PENDENTE'));
    } catch (e) {
      Logger.log('❌ Configuração: ERRO - ' + e.message);
    }

    // Verificar abas
    try {
      var ss = getSS();
      var abasNecessarias = ['Usuarios', 'Notas_Fiscais', 'Entregas'];
      var abasEncontradas = 0;

      abasNecessarias.forEach(function(nome) {
        if (ss.getSheetByName(nome)) {
          abasEncontradas++;
        }
      });

      status.abas = abasEncontradas === abasNecessarias.length;
      Logger.log('✅ Abas: ' + abasEncontradas + '/' + abasNecessarias.length + ' encontradas');
    } catch (e) {
      Logger.log('❌ Abas: ERRO - ' + e.message);
    }

    // Verificar usuários
    try {
      var sheet = getSS().getSheetByName('Usuarios');
      if (sheet && sheet.getLastRow() > 1) {
        status.usuarios = true;
        Logger.log('✅ Usuários: ' + (sheet.getLastRow() - 1) + ' cadastrados');
      } else {
        Logger.log('⚠️ Usuários: Nenhum cadastrado');
      }
    } catch (e) {
      Logger.log('❌ Usuários: ERRO - ' + e.message);
    }

    // Verificar otimização
    try {
      if (typeof OptimizationSystem !== 'undefined') {
        status.otimizacao = true;
        Logger.log('✅ Otimização: Sistema disponível');
      } else {
        Logger.log('⚠️ Otimização: Sistema não carregado');
      }
    } catch (e) {
      Logger.log('❌ Otimização: ERRO - ' + e.message);
    }

    Logger.log('');
    Logger.log('═══════════════════════════════════════');

    var tudo_ok = status.configuracao && status.abas;

    if (tudo_ok) {
      Logger.log('✅ SISTEMA PRONTO PARA USO');

      if (!status.usuarios) {
        Logger.log('');
        Logger.log('💡 DICA: Execute criarUsuariosPadraoDF_Simples()');
        Logger.log('   para criar usuários de teste');
      }
    } else {
      Logger.log('⚠️ SISTEMA PRECISA DE SETUP');
      Logger.log('');
      Logger.log('💡 Execute: setupSimplesCompleto()');
    }

    Logger.log('═══════════════════════════════════════');

    return status;
  } catch (error) {
    Logger.log("Erro em verificarStatusSistema: " + error.message);
    throw error;
  }
}

/**
 * Limpa configuração (use com cuidado!)
 */
function limparConfiguracao() {
  try {
    Logger.log('⚠️ Limpando configuração...');

    try {
      var props = PropertiesService.getScriptProperties();
      props.deleteProperty('SPREADSHEET_ID');
      props.deleteProperty('FOLDER_ID');
      props.deleteProperty('GEMINI_API_KEY');

      Logger.log('✅ Configuração limpa');
      Logger.log('   Execute setupSimplesCompleto() para reconfigurar');

      return { success: true };
    } catch (e) {
      Logger.log('❌ Erro ao limpar: ' + e.message);
      return { success: false, erro: e.message };
    }
  } catch (error) {
    Logger.log("Erro em limparConfiguracao: " + error.message);
    throw error;
  }
}

/**
 * Registra módulo
 */
function registrarSetupSimples() {
  Logger.log('✅ Setup Simples carregado');
  Logger.log('   Funções disponíveis:');
  Logger.log('   - setupSimplesCompleto()');
  Logger.log('   - verificarStatusSistema()');
  Logger.log('   - configurarIDsAutomatico()');
  Logger.log('   - criarAbasAutomatico()');
}
