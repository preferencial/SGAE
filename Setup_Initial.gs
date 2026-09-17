/**
 * @fileoverview Setup Inicial do Sistema
 * @version 4.0.0
 * 
 * Dependências:
 * - Core_UI_Safe.gs (getSafeUi, safeAlert, safePrompt)
 * - Core_Constants.gs (constantes do sistema)
 * - Core_Auth_System.gs (AUTH)
 */

'use strict';

// Usa funções de Core_UI_Safe.gs (getSafeUi, safeAlert, safePrompt)


/**
 * Configuração inicial do sistema - VERSÃO AUTOMÁTICA
 * Execute esta função PRIMEIRO antes de usar o sistema
 */
function setupInicial() {
  try {
    try {
      // Verifica se está em contexto de UI
      var hasUI = isUIContext();
      var ui = hasUI ? SpreadsheetApp.getUi() : null;
    
      // Confirmação antes de iniciar (apenas se houver UI)
      if (hasUI) {
        var response = ui.alert(
          '🚀 Setup Inicial do Sistema',
          'Este processo irá:\n\n' +
          '✓ Configurar IDs automaticamente\n' +
          '✓ Criar 13 abas com estrutura completa\n' +
          '✓ Inicializar sistema de otimização\n' +
          '✓ Preparar sistema de autenticação\n\n' +
          'Deseja continuar?',
          ui.ButtonSet.YES_NO
        );
      
        if (response !== ui.Button.YES) {
          ui.alert('Setup Cancelado', 'Nenhuma alteração foi feita.', ui.ButtonSet.OK);
          return { success: false, message: 'Cancelado pelo usuário' };
        }
      } else {
        Logger.log('⚠️ Executando setup sem interface de usuário');
        Logger.log('Continuando automaticamente...');
      }
    
      Logger.log('=== INICIANDO SETUP ===');
    
      // Passo 1: Obter IDs
      var ss = getSS();
      var spreadsheetId = ss.getId();
    
      Logger.log('Spreadsheet ID: ' + spreadsheetId);
    
      // Tenta obter folder ID
      var file = DriveApp.getFileById(spreadsheetId);
      var folders = file.getParents();
      var folderId = folders.hasNext() ? folders.next().getId() : null;
    
      Logger.log('Folder ID: ' + (folderId || 'Não encontrado'));
    
      // Passo 2: Configurar propriedades
      var props = PropertiesService.getScriptProperties();
    
      props.setProperty('SPREADSHEET_ID', spreadsheetId);
    
      if (folderId) {
        props.setProperty('DRIVE_FOLDER_ID', folderId);
      } else {
        // Cria uma pasta se não existir
        Logger.log('Criando pasta UNIAE_CRE_Files...');
        var folder = DriveApp.createFolder('UNIAE_CRE_Files');
        props.setProperty('DRIVE_FOLDER_ID', folder.getId());
        file.moveTo(folder);
        folderId = folder.getId();
        Logger.log('Pasta criada: ' + folderId);
      }
    
      // Configurações opcionais
      props.setProperty('GEMINI_TEMPERATURE', '0.7');
    
      Logger.log('✅ Propriedades configuradas');
    
      // Passo 3: Criar abas necessárias
      if (hasUI) {
        ui.alert('Criando Abas', 'Criando estrutura de 13 abas...', ui.ButtonSet.OK);
      }
      criarAbasNecessarias();
      Logger.log('✅ Abas verificadas/criadas');
    
      // Passo 4: Inicializar sistema de otimização
      var initResult = { success: true };
      try {
        if (typeof OptimizedAPI !== 'undefined' && OptimizedAPI.initialize) {
          initResult = OptimizedAPI.initialize();
          Logger.log('✅ Sistema de otimização inicializado');
        } else {
          Logger.log('⚠️ OptimizedAPI não encontrado, pulando inicialização');
        }
      } catch (e) {
        Logger.log('⚠️ Aviso ao inicializar otimização: ' + e.message);
      }
    
      // Passo 5: Mensagem de sucesso
      Logger.log('\n=== SETUP COMPLETO ===');
      Logger.log('Spreadsheet ID: ' + spreadsheetId);
      Logger.log('Folder ID: ' + folderId);
      Logger.log('Otimização: ' + (initResult.success ? 'OK' : 'Aviso'));
    
      var successMessage = '✅ Sistema Configurado com Sucesso!\n\n';
      successMessage += '📊 13 abas criadas com estrutura completa\n';
      successMessage += '⚡ Sistema de otimização inicializado\n';
      successMessage += '🔐 Sistema de autenticação pronto\n\n';
      successMessage += '🎯 Próximos Passos:\n\n';
      successMessage += '1️⃣ Feche e abra a planilha novamente\n';
      successMessage += '2️⃣ Menu → ⚙️ Setup → 🔑 Criar Primeiro Admin\n';
      successMessage += '3️⃣ Menu → 🔐 Login → Entrar\n';
      successMessage += '4️⃣ Menu → 🚀 Otimização → 📊 Dashboard\n\n';
      successMessage += '📚 Consulte START_HERE.md para mais detalhes';
    
      if (hasUI) {
        ui.alert('🎉 Setup Completo!', successMessage, ui.ButtonSet.OK);
      } else {
        Logger.log('\n' + successMessage.replace(/\n/g, '\n'));
      }
    
      return {
        success: true,
        spreadsheetId: spreadsheetId,
        folderId: folderId,
        optimizationInitialized: initResult.success
      };
    
    } catch (e) {
      Logger.log('❌ ERRO NO SETUP: ' + e.message);
      Logger.log('Stack: ' + e.stack);
    
      // Tenta mostrar alerta apenas se houver UI
      if (isUIContext()) {
        try {
          SpreadsheetApp.getUi().alert(
            '❌ Erro no Setup',
            'Ocorreu um erro durante o setup:\n\n' + e.message + '\n\n' +
            'Verifique os logs para mais detalhes.',
            SpreadsheetApp.getUi().ButtonSet.OK
          );
        } catch (uiError) {
          Logger.log('⚠️ Não foi possível exibir alerta de erro: ' + uiError.message);
        }
      }
    
      return { success: false, error: e.message };
    }
  } catch (error) {
    Logger.log("Erro em setupInicial: " + error.message);
    throw error;
  }
}

/**
 * Cria abas necessárias com estrutura completa
 */
function criarAbasNecessarias() {
  try {
    try {
      try {
        var ss = getSS();
  
        var estruturas = {
          // Usa schema unificado de Core_Schema_Usuarios.gs
          'Usuarios': (typeof USUARIOS_SCHEMA !== 'undefined') 
            ? USUARIOS_SCHEMA.HEADERS 
            : ['email', 'nome', 'senha', 'tipo', 'instituicao', 'telefone', 'cpf', 'cnpj',
               'ativo', 'dataCriacao', 'dataAtualizacao', 'ultimoAcesso', 'token'],
          'Notas_Fiscais': [
            'ID', 'Numero_NF', 'Serie', 'Data_Emissao', 'Data_Recebimento',
            'Fornecedor_Nome', 'Fornecedor_CNPJ', 'Valor_Total', 'Valor_Produtos',
            'Valor_Servicos', 'ICMS', 'IPI', 'Status_NF', 'Observacoes',
            'Usuario_Registro', 'Data_Registro', 'dataAtualizacao'
          ],
          'Entregas': [
            'ID', 'NF_ID', 'Numero_NF', 'Data_Entrega', 'Data_Prevista',
            'Fornecedor_Nome', 'Escola_Destino', 'Status_Entrega',
            'Quantidade_Itens', 'Valor_Total', 'Responsavel_Recebimento',
            'Observacoes', 'Usuario_Registro', 'Data_Registro', 'dataAtualizacao'
          ],
          'Recusas': [
            'ID', 'NF_ID', 'Entrega_ID', 'Data_Recusa', 'Motivo_Recusa',
            'Tipo_Recusa', 'Produto', 'Quantidade_Recusada', 'Valor_Recusado',
            'Fornecedor_Nome', 'Escola', 'Responsavel', 'Status',
            'Acao_Tomada', 'Observacoes', 'Usuario_Registro', 'Data_Registro'
          ],
          'Glosas': [
            'ID', 'NF_ID', 'Data_Glosa', 'Tipo_Glosa', 'Motivo',
            'Valor_Total_Glosa', 'Valor_Aprovado', 'Fornecedor_Nome',
            'Status', 'Responsavel_Analise', 'Data_Analise', 'Justificativa',
            'Observacoes', 'Usuario_Registro', 'Data_Registro'
          ],
          'Fornecedores': [
            'ID', 'Nome_Fornecedor', 'CNPJ', 'Razao_Social', 'Inscricao_Estadual',
            'Endereco', 'Cidade', 'Estado', 'CEP', 'Telefone', 'Email',
            'Contato_Nome', 'Contato_Cargo', 'Banco', 'Agencia', 'Conta',
            'Status', 'Data_Cadastro', 'dataAtualizacao'
          ],
          'PDGP': [
            'ID', 'Periodo', 'Escola', 'Produto', 'Categoria', 'Unidade',
            'Quantidade_Prevista', 'Quantidade_Entregue', 'Valor_Unitario',
            'Valor_Total', 'Fornecedor', 'Status', 'Observacoes',
            'Data_Registro', 'dataAtualizacao'
          ],
          'PDGA': [
            'ID', 'Ano', 'Mes', 'Escola', 'Categoria', 'Orcamento_Previsto',
            'Orcamento_Realizado', 'Percentual_Execucao', 'Status',
            'Observacoes', 'Data_Registro', 'dataAtualizacao'
          ],
          'Controle_Conferencia': [
            'ID', 'NF_ID', 'Entrega_ID', 'Data_Conferencia', 'Conferente',
            'Tipo_Conferencia', 'Itens_Conferidos', 'Itens_Conformes',
            'Itens_Nao_Conformes', 'Status', 'Observacoes',
            'Data_Registro', 'dataAtualizacao'
          ],
          'Auditoria_Log': [
            'ID', 'Data_Hora', 'Usuario', 'Acao', 'Tabela', 'Registro_ID',
            'Dados_Anteriores', 'Dados_Novos', 'IP', 'Observacoes'
          ],
          'Config_Membros_Comissao': [
            'ID', 'Nome', 'Cargo', 'Email', 'Telefone', 'Tipo_Membro',
            'Ativo', 'Data_Inicio', 'Data_Fim', 'Observacoes'
          ],
          'Textos_Padrao': [
            'ID', 'Tipo', 'Titulo', 'Conteudo', 'Categoria', 'Ativo',
            'Data_Criacao', 'dataAtualizacao'
          ],
          'System_Logs': [
            'timestamp', 'level', 'message', 'context', 'user'
          ]
        };
  
        Object.keys(estruturas).forEach(function(nomeAba) {
          var sheet = ss.getSheetByName(nomeAba);
    
          if (!sheet) {
            Logger.log('Criando aba: ' + nomeAba);
            sheet = ss.insertSheet(nomeAba);
      
            // Adiciona headers
            var headers = estruturas[nomeAba];
            sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
            // Formata header
            var headerRange = sheet.getRange(1, 1, 1, headers.length);
            headerRange.setBackground('#4a5568');
            headerRange.setFontColor('#ffffff');
            headerRange.setFontWeight('bold');
            headerRange.setHorizontalAlignment('center');
      
            // Congela primeira linha
            sheet.setFrozenRows(1);
      
            // Ajusta largura das colunas
            sheet.autoResizeColumns(1, headers.length);
      
            Logger.log('✅ Aba criada com estrutura: ' + nomeAba);
          } else {
            Logger.log('⚠️ Aba já existe: ' + nomeAba);
          }
        });
  
        Logger.log('✅ Todas as abas verificadas/criadas');
      } catch (error) {
        Logger.log("Erro em criarAbasNecessarias: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em criarAbasNecessarias: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em criarAbasNecessarias: " + error.message);
    throw error;
  }
}

/**
 * Verifica se o sistema está configurado
 */
function verificarConfiguracao() {
  try {
    var props = PropertiesService.getScriptProperties();
    var spreadsheetId = props.getProperty('SPREADSHEET_ID');
    var folderId = props.getProperty('DRIVE_FOLDER_ID');
  
    var configurado = !!(spreadsheetId && folderId);
  
    Logger.log('=== STATUS DA CONFIGURAÇÃO ===');
    Logger.log('Spreadsheet ID: ' + (spreadsheetId || 'NÃO CONFIGURADO'));
    Logger.log('Folder ID: ' + (folderId || 'NÃO CONFIGURADO'));
    Logger.log('Status: ' + (configurado ? '✅ CONFIGURADO' : '❌ NÃO CONFIGURADO'));
  
    if (!configurado) {
      Logger.log('\n⚠️ Execute setupInicial() para configurar o sistema');
    }
  
    return {
      configurado: configurado,
      spreadsheetId: spreadsheetId,
      folderId: folderId
    };
  } catch (error) {
    Logger.log("Erro em verificarConfiguracao: " + error.message);
    throw error;
  }
}

/**
 * Limpa configuração (use com cuidado)
 */
function limparConfiguracao() {
  try {
    var ui = SpreadsheetApp.getUi();
    var response = ui.alert(
      'Limpar Configuração',
      'Tem certeza que deseja limpar todas as configurações?\n\nVocê precisará executar setupInicial() novamente.',
      ui.ButtonSet.YES_NO
    );
  
    if (response === ui.Button.YES) {
      var props = PropertiesService.getScriptProperties();
      props.deleteAllProperties();
    
      ui.alert('Configuração limpa', 'Execute setupInicial() para reconfigurar', ui.ButtonSet.OK);
      Logger.log('✅ Configuração limpa');
      return { success: true };
    }
  
    return { success: false, message: 'Cancelado' };
  } catch (error) {
    Logger.log("Erro em limparConfiguracao: " + error.message);
    throw error;
  }
}

/**
 * Configurar API Key do Gemini (opcional)
 */
function configurarGeminiApiKey(apiKey) {
  try {
    // Se API Key foi passada como parâmetro, usar diretamente
    if (apiKey) {
      var props = PropertiesService.getScriptProperties();
      props.setProperty('GEMINI_API_KEY', apiKey);
      Logger.log('✅ Gemini API Key configurada');
      return { success: true };
    }
    
    // Tentar usar UI apenas se disponível
    try {
      var ui = SpreadsheetApp.getUi();
      var response = safePrompt(
        'Configurar Gemini API Key',
        'Cole sua API Key do Gemini (ou deixe em branco para pular):',
        ui.ButtonSet.OK_CANCEL
      );
      
      if (response.getSelectedButton() === ui.Button.OK) {
        var apiKeyInput = response.getResponseText().trim();
        
        if (apiKeyInput) {
          var props = PropertiesService.getScriptProperties();
          props.setProperty('GEMINI_API_KEY', apiKeyInput);
          
          safeAlert('Sucesso', 'API Key configurada com sucesso!', ui.ButtonSet.OK);
          Logger.log('✅ Gemini API Key configurada');
          return { success: true };
        }
      }
    } catch (uiError) {
      // UI não disponível, pular configuração
      // A API Key deve ser configurada nas propriedades do script em script.google.com
      Logger.log('⚠️ UI não disponível - Configure a GEMINI_API_KEY nas propriedades do script');
      return { success: false, message: 'UI não disponível' };
    }
    
    return { success: false, message: 'Cancelado ou vazio' };
    
  } catch (e) {
    Logger.log('❌ Erro ao configurar Gemini API Key: ' + e.message);
    return { success: false, message: e.message };
  }
}

/**
 * Cria primeiro administrador
 */
function criarPrimeiroAdmin() {
  try {
    var ui = getSafeUi();
      if (!ui) {
        Logger.log("⚠️ UI não disponível");
        return;
      }
  
    // Verifica se já existe admin
    try {
      var sheet = getSS().getSheetByName('Usuarios');
      if (!sheet) {
        ui.alert('⚠️ Aba Usuarios não encontrada', 
          'Execute primeiro: Menu → ⚙️ Setup → 🚀 Setup Inicial', 
          ui.ButtonSet.OK);
        return;
      }
    
      if (sheet.getLastRow() > 1) {
        var response = ui.alert('⚠️ Já existem usuários cadastrados', 
          'Deseja criar outro administrador?', 
          ui.ButtonSet.YES_NO);
      
        if (response !== ui.Button.YES) {
          return;
        }
      }
    } catch (e) {
      // Continua se houver erro
    }
  
    // Solicita dados
    var nomeResponse = ui.prompt('👤 Nome do Administrador', 
      'Digite o nome completo:', 
      ui.ButtonSet.OK_CANCEL);
  
    if (nomeResponse.getSelectedButton() !== ui.Button.OK) {
      return;
    }
  
    var emailResponse = ui.prompt('📧 Email do Administrador', 
      'Digite o email:', 
      ui.ButtonSet.OK_CANCEL);
  
    if (emailResponse.getSelectedButton() !== ui.Button.OK) {
      return;
    }
  
    var senhaResponse = ui.prompt('🔒 Senha do Administrador', 
      'Digite a senha (mínimo 6 caracteres):', 
      ui.ButtonSet.OK_CANCEL);
  
    if (senhaResponse.getSelectedButton() !== ui.Button.OK) {
      return;
    }
  
    var cpfResponse = ui.prompt('🆔 CPF do Administrador', 
      'Digite o CPF (opcional):', 
      ui.ButtonSet.OK_CANCEL);
  
    if (cpfResponse.getSelectedButton() !== ui.Button.OK) {
      return;
    }
  
    // Cria admin
    try {
      var result = AUTH.register({
        tipo: 'ANALISTA',
        nome: nomeResponse.getResponseText().trim(),
        email: emailResponse.getResponseText().trim(),
        senha: senhaResponse.getResponseText(),
        cpf: cpfResponse.getResponseText().trim() || '000.000.000-00'
      });
    
      if (result.success) {
        ui.alert('✅ Administrador Criado!', 
          'Administrador criado com sucesso!\n\n' +
          'Nome: ' + result.user.nome + '\n' +
          'Email: ' + result.user.email + '\n\n' +
          '🔐 Faça login agora:\n' +
          'Menu → 🔐 Login → Entrar', 
          ui.ButtonSet.OK);
      } else {
        ui.alert('❌ Erro', 
          'Erro ao criar administrador:\n\n' + result.error, 
          ui.ButtonSet.OK);
      }
    } catch (e) {
      ui.alert('❌ Erro', 
        'Erro ao criar administrador:\n\n' + e.message, 
        ui.ButtonSet.OK);
    }
  } catch (error) {
    Logger.log("Erro em criarPrimeiroAdmin: " + error.message);
    throw error;
  }
}

/**
 * Menu de setup
 */
function criarMenuSetup() {
  try {
    try {
      var ui = SpreadsheetApp.getUi();
    
      ui.createMenu('⚙️ Setup')
        .addItem('🚀 Setup Inicial', 'setupInicial')
        .addItem('🔑 Criar Primeiro Admin', 'criarPrimeiroAdmin')
        .addSeparator()
        .addItem('🔍 Verificar Configuração', 'verificarConfiguracao')
        .addItem('🔧 Corrigir Aba Usuarios', 'corrigirAbaUsuarios')
        .addItem('🔑 Configurar Gemini API Key', 'configurarGeminiApiKey')
        .addSeparator()
        .addItem('🗑️ Limpar Configuração', 'limparConfiguracao')
        .addToUi();
    } catch (e) {
      Logger.log('⚠️ Não foi possível criar menu de setup (provavelmente sem contexto de UI): ' + e.message);
    }
  } catch (error) {
    Logger.log("Erro em criarMenuSetup: " + error.message);
    throw error;
  }
}

/**
 * Adiciona menu de setup ao onOpen
 */
function onOpenWithSetup() {
  try {
    // Verifica se está em contexto de UI
    if (!isUIContext()) {
      Logger.log('⚠️ onOpen chamado fora do contexto da UI');
      return;
    }
  
    try {
      criarMenuSetup();
    
      // Verifica se está configurado
      var props = PropertiesService.getScriptProperties();
      var spreadsheetId = props.getProperty('SPREADSHEET_ID');
      var folderId = props.getProperty('DRIVE_FOLDER_ID');
      var configurado = !!(spreadsheetId && folderId);
    
      if (configurado) {
        // Adiciona menu de autenticação
        try {
          if (typeof addAuthMenu === 'function') {
            addAuthMenu();
          }
        } catch (e) {
          Logger.log('Aviso ao adicionar menu de auth: ' + e.message);
        }
      
        // Se configurado, adiciona menu de otimização
        try {
          if (typeof addOptimizationMenuItems === 'function') {
            addOptimizationMenuItems();
          }
          if (typeof OptimizedAPI !== 'undefined') {
            OptimizedAPI.initialize();
          }
        } catch (e) {
          Logger.log('Aviso ao inicializar: ' + e.message);
        }
      } else {
        // Se não configurado, apenas loga
        Logger.log('⚠️ Sistema não configurado. Execute setupInicial()');
      }
    } catch (e) {
      Logger.log('Erro no onOpen: ' + e.message);
    }
  } catch (error) {
    Logger.log("Erro em onOpenWithSetup: " + error.message);
    throw error;
  }
}

// NOTA: Função isUIContext() movida para Infra_Inicializacao.gs para evitar duplicação
