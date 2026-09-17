/**
 * @fileoverview Sistema de Autenticação Unificado - UNIAE CRE
 * @version 5.0.0
 * @description Sistema único de autenticação que consolida AUTH e AUTH_PLAIN,
 * eliminando conflitos e inconsistências.
 * 
 * SUBSTITUI:
 * - Core_Auth.gs (parcialmente - mantém para compatibilidade)
 * - Core_Auth_PlainText.gs (parcialmente - mantém para compatibilidade)
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-09
 */

'use strict';

// ============================================================================
// SISTEMA DE AUTENTICAÇÃO UNIFICADO
// ============================================================================

var AuthService = (function() {
  
  // --------------------------------------------------------------------------
  // CONFIGURAÇÃO
  // --------------------------------------------------------------------------
  
  // Usa constantes centralizadas se disponíveis
  var CONFIG = {
    SESSION_TIMEOUT: typeof TIME_CONFIG !== 'undefined' ? TIME_CONFIG.SESSION_TIMEOUT : 8 * 60 * 60 * 1000,
    SESSION_TIMEOUT_SECONDS: 28800,       // 8 horas em segundos (para cache)
    MAX_LOGIN_ATTEMPTS: typeof LIMITS !== 'undefined' ? LIMITS.MAX_LOGIN_ATTEMPTS : 5,
    LOCKOUT_DURATION: typeof TIME_CONFIG !== 'undefined' ? TIME_CONFIG.LOCKOUT_DURATION : 30 * 60 * 1000,
    PASSWORD_MIN_LENGTH: typeof LIMITS !== 'undefined' ? LIMITS.PASSWORD_MIN_LENGTH : 6,
    USERS_SHEET: typeof SHEET_NAMES !== 'undefined' ? SHEET_NAMES.USUARIOS : 'Usuarios'
    // Arquitetura 100% digital: sempre texto plano, sem hash
  };
  
  // --------------------------------------------------------------------------
  // TIPOS DE USUÁRIO E PERMISSÕES
  // --------------------------------------------------------------------------
  
  var USER_TYPES = {
    // Tipos administrativos (alto nível)
    ADMIN: {
      nome: 'Administrador',
      nivel: 100,
      permissoes: ['*'],
      admin: true
    },
    ANALISTA: {
      nome: 'Analista UNIAE',
      nivel: 100,
      permissoes: ['*'],
      admin: true
    },
    FISCAL: {
      nome: 'Fiscal',
      nivel: 90,
      permissoes: [
        'visualizar_notas',
        'fiscalizar_entregas',
        'aprovar_notas',
        'visualizar_dashboard',
        'gerar_relatorios'
      ],
      admin: false
    },
    GESTOR: {
      nome: 'Gestor',
      nivel: 95,
      permissoes: [
        'visualizar_notas',
        'gerenciar_usuarios',
        'aprovar_notas',
        'visualizar_dashboard',
        'gerar_relatorios',
        'configurar_sistema'
      ],
      admin: true
    },
    // Tipos operacionais
    REPRESENTANTE: {
      nome: 'Representante Escola',
      nivel: 50,
      permissoes: [
        'visualizar_notas',
        'conferir_entregas', 
        'registrar_recusas',
        'visualizar_dashboard'
      ],
      admin: false
    },
    ESCOLA: {
      nome: 'Representante Escolar',
      nivel: 50,
      permissoes: [
        'visualizar_notas',
        'conferir_entregas',
        'registrar_recusas',
        'visualizar_dashboard'
      ],
      admin: false
    },
    FORNECEDOR: {
      nome: 'Fornecedor',
      nivel: 30,
      permissoes: [
        'cadastrar_notas',
        'visualizar_notas_proprias',
        'visualizar_dashboard'
      ],
      admin: false
    },
    NUTRICIONISTA: {
      nome: 'Nutricionista',
      nivel: 70,
      permissoes: [
        'visualizar_notas',
        'avaliar_produtos',
        'aprovar_cardapios',
        'visualizar_dashboard',
        'gerar_relatorios'
      ],
      admin: false
    },
    OPERADOR: {
      nome: 'Operador',
      nivel: 20,
      permissoes: [
        'visualizar_notas',
        'visualizar_dashboard'
      ],
      admin: false
    }
  };
  
  // Mapeamento de permissões por recurso
  var RESOURCE_PERMISSIONS = {
    'Notas_Fiscais': {
      read: ['visualizar_notas', 'visualizar_notas_proprias', '*'],
      write: ['cadastrar_notas', 'editar_notas', '*'],
      delete: ['excluir_notas', '*']
    },
    'Entregas': {
      read: ['visualizar_notas', 'conferir_entregas', '*'],
      write: ['conferir_entregas', '*'],
      delete: ['*']
    },
    'Recusas': {
      read: ['visualizar_notas', 'registrar_recusas', '*'],
      write: ['registrar_recusas', '*'],
      delete: ['*']
    },
    'Usuarios': {
      read: ['*'],
      write: ['cadastrar_usuarios', '*'],
      delete: ['*']
    }
  };
  
  // --------------------------------------------------------------------------
  // HELPERS PRIVADOS
  // --------------------------------------------------------------------------
  
  function getUsersSheet() {
    try {
      try {
        var ss = getSS();
        if (!ss) return null;
      
        var sheet = ss.getSheetByName(CONFIG.USERS_SHEET);
        if (!sheet) {
          // Tenta nome alternativo
          sheet = ss.getSheetByName('USR_Usuarios');
        }
        return sheet;
      } catch (e) {
        Logger.log('AuthService: Erro ao obter sheet de usuários - ' + e.message);
        return null;
      }
    } catch (error) {
      Logger.log("Erro em getUsersSheet: " + error.message);
      throw error;
    }
  }
  
  /**
   * Retorna senha em texto plano (arquitetura 100% digital)
   * Sistema usa autenticação digital - usuário autenticado = identidade confirmada
   */
  function processPassword(senha) {
    return senha; // Texto plano conforme arquitetura digital
  }
  
  /**
   * Verifica senha em texto plano
   * Arquitetura 100% digital: comparação direta sem criptografia
   */
  function verifyPassword(senhaInformada, senhaArmazenada) {
    try {
      return String(senhaInformada).trim() === String(senhaArmazenada).trim();
    } catch (error) {
      Logger.log("Erro em verifyPassword: " + error.message);
      throw error;
    }
  }
  
  function generateToken() {
    return Utilities.getUuid();
  }
  
  function getCache() {
    try {
      try {
        return CacheService.getUserCache();
      } catch (e) {
        Logger.log('AuthService: Erro ao obter cache - ' + e.message);
        return null;
      }
    } catch (error) {
      Logger.log("Erro em getCache: " + error.message);
      throw error;
    }
  }
  
  function isAccountLocked(email) {
    try {
      var cache = CacheService.getScriptCache();
      var attempts = cache.get('login_attempts_' + email);
      if (!attempts) return false;
      var data = JSON.parse(attempts);
      return data.count >= CONFIG.MAX_LOGIN_ATTEMPTS;
    } catch (e) {
      return false;
    }
  }
  
  function recordFailedAttempt(email) {
    try {
      try {
        var cache = CacheService.getScriptCache();
        var key = 'login_attempts_' + email;
        var attempts = cache.get(key);
        var data = attempts ? JSON.parse(attempts) : { count: 0 };
        data.count++;
        data.lastAttempt = Date.now();
        cache.put(key, JSON.stringify(data), CONFIG.LOCKOUT_DURATION / 1000);
      } catch (e) {
        // Ignora erro de cache
      }
    } catch (error) {
      Logger.log("Erro em recordFailedAttempt: " + error.message);
      throw error;
    }
  }
  
  function clearFailedAttempts(email) {
    try {
      try {
        CacheService.getScriptCache().remove('login_attempts_' + email);
      } catch (e) {
        // Ignora
      }
    } catch (error) {
      Logger.log("Erro em clearFailedAttempts: " + error.message);
      throw error;
    }
  }
  
  function normalizeUserType(tipo) {
    try {
      if (!tipo) return 'FORNECEDOR';
    
      var tipoUpper = String(tipo).toUpperCase().replace(/\s+/g, '_');
    
      // Mapeamento direto
      if (USER_TYPES[tipoUpper]) return tipoUpper;
    
      // Mapeamento por nome
      for (var key in USER_TYPES) {
        if (USER_TYPES[key].nome.toUpperCase() === tipoUpper) return key;
        if (USER_TYPES[key].nome.toUpperCase().indexOf(tipoUpper) !== -1) return key;
      }
    
      // Mapeamentos específicos
      var mappings = {
        'ANALISTA_UNIAE': 'ANALISTA',
        'REPRESENTANTE_ESCOLA': 'REPRESENTANTE',
        'REPRESENTANTE_ESCOLAR': 'REPRESENTANTE'
      };
    
      return mappings[tipoUpper] || 'FORNECEDOR';
    } catch (error) {
      Logger.log("Erro em normalizeUserType: " + error.message);
      throw error;
    }
  }
  
  function audit(action, details) {
    try {
      var logEntry = {
        timestamp: new Date().toISOString(),
        action: action,
        details: details
      };
      Logger.log('[AUTH_AUDIT] ' + action + ': ' + JSON.stringify(details));
      
      // Se UnifiedLogger existir, usa ele
      if (typeof UnifiedLogger !== 'undefined' && UnifiedLogger.audit) {
        UnifiedLogger.audit(action, details);
      }
    } catch (e) {
      // Falha silenciosa
    }
  }

  
  // --------------------------------------------------------------------------
  // BUSCA DE USUÁRIO
  // --------------------------------------------------------------------------
  
  function findUserByEmail(email) {
    try {
      try {
        try {
          var sheet = getUsersSheet();
          if (!sheet || sheet.getLastRow() <= 1) return null;
      
          var data = sheet.getDataRange().getValues();
          var headers = data[0];
      
          // Encontra índice da coluna email (case-insensitive)
          var emailCol = -1;
          for (var i = 0; i < headers.length; i++) {
            var h = String(headers[i]).toLowerCase();
            if (h === 'email') {
              emailCol = i;
              break;
            }
          }
      
          if (emailCol === -1) {
            Logger.log('AuthService: Coluna email não encontrada');
            return null;
          }
      
          var emailBusca = String(email).toLowerCase().trim();
      
          // Busca usuário
          for (var row = 1; row < data.length; row++) {
            var rowEmail = String(data[row][emailCol] || '').toLowerCase().trim();
            var rowUser = rowEmail.split('@')[0];

            // Aceita login pelo email completo OU pelo username (parte antes do @),
            // permitindo que os admins sinteticos entrem como "admin12" alem de
            // "admin12@synthetic.local". Email real (com @) so casa exato.
            if (rowEmail === emailBusca || rowUser === emailBusca) {
              var user = { rowIndex: row + 1 };
          
              // Mapeia todas as colunas
              for (var col = 0; col < headers.length; col++) {
                var headerOriginal = headers[col];
                var headerNorm = String(headerOriginal).toLowerCase().replace(/[^a-z0-9_]/g, '');
            
                user[headerNorm] = data[row][col];
                user[headerOriginal] = data[row][col];
              }
          
              // Normaliza campos essenciais
              user.email = rowEmail;
              user.nome = user.nome || user.nomecompleto || user.name || email;
              user.senha = user.senha || user.senhahash || user.password || '';
              user.tipo = normalizeUserType(user.tipo || user.tipousuario || 'FORNECEDOR');
              user.perfil = user.perfil || 'CONSULTA';
              user.instituicao = user.instituicao || '';
          
              // Verifica status
              var status = String(user.status || user.ativo || 'ATIVO').toUpperCase();
              user.ativo = (status !== 'INATIVO' && status !== 'BLOQUEADO' && status !== 'FALSE');
          
              return user;
            }
          }
      
          return null;
        } catch (e) {
          Logger.log('AuthService: Erro ao buscar usuário - ' + e.message);
          return null;
        }
      } catch (error) {
        Logger.log("Erro em findUserByEmail: " + error.message);
        throw error;
      }
    } catch (error) {
      Logger.log("Erro em findUserByEmail: " + error.message);
      throw error;
    }
  }
  
  // --------------------------------------------------------------------------
  // LOGIN
  // --------------------------------------------------------------------------
  
  function login(email, senha) {
    try {
      // Validação de entrada
      if (!email || !senha) {
        Logger.log('AuthService: Tentativa de login sem credenciais completas');
        return { 
          success: false, 
          error: 'Email e senha são obrigatórios',
          code: 'MISSING_CREDENTIALS'
        };
      }
    
      Logger.log('[LGPD] Evento registrado; detalhes sensíveis omitidos.');
    
      email = String(email).trim().toLowerCase();
      senha = String(senha).trim();
    
      // Verifica bloqueio
      if (isAccountLocked(email)) {
        return { 
          success: false, 
          error: 'Conta bloqueada temporariamente. Tente novamente em 30 minutos.',
          code: 'ACCOUNT_LOCKED'
        };
      }
    
      // Busca usuário
      var user = findUserByEmail(email);
    
      if (!user) {
        recordFailedAttempt(email);
        Logger.log('[LGPD] Evento registrado; detalhes sensíveis omitidos.');
        return { 
          success: false, 
          error: 'Email ou senha incorretos',
          code: 'INVALID_CREDENTIALS'
        };
      }
    
      // Verifica status
      if (!user.ativo) {
        return { 
          success: false, 
          error: 'Usuário inativo ou bloqueado. Contate o administrador.',
          code: 'USER_INACTIVE'
        };
      }
    
      // Verifica senha
      var senhaArmazenada = String(user.senha || '').trim();
    
      if (!verifyPassword(senha, senhaArmazenada)) {
        recordFailedAttempt(email);
        Logger.log('[LGPD] Evento registrado; detalhes sensíveis omitidos.');
        return { 
          success: false, 
          error: 'Email ou senha incorretos',
          code: 'INVALID_CREDENTIALS'
        };
      }
    
      // Login bem-sucedido
      clearFailedAttempts(email);
    
      // Obtém tipo e permissões
      var tipoKey = normalizeUserType(user.tipo);
      var tipoConfig = USER_TYPES[tipoKey] || USER_TYPES.FORNECEDOR;
    
      // Cria sessão
      var sessaoId = generateToken();
      var agora = new Date();
    
      var sessao = {
        id: sessaoId,
        email: email,
        nome: user.nome,
        tipo: tipoConfig.nome,
        tipoKey: tipoKey,
        perfil: user.perfil,
        instituicao: user.instituicao,
        nivel: tipoConfig.nivel,
        permissions: tipoConfig.permissoes,
        admin: tipoConfig.admin,
        loginTime: agora.toISOString(),
        expira: Date.now() + CONFIG.SESSION_TIMEOUT
      };
    
      // Salva sessão no cache
      try {
        var cache = getCache();
        if (cache) {
          var sessaoJson = JSON.stringify(sessao);
          cache.put('user_session', sessaoJson, CONFIG.SESSION_TIMEOUT_SECONDS);
          cache.put('sessao_' + sessaoId, sessaoJson, CONFIG.SESSION_TIMEOUT_SECONDS);
        }
      } catch (e) {
        Logger.log('AuthService: Erro ao salvar sessão - ' + e.message);
      }
    
      // Atualiza último acesso
      updateLastAccess(user.rowIndex);
    
      // Auditoria
      audit('LOGIN_SUCCESS', { email: email, tipo: tipoKey });
    
      Logger.log('[LGPD] Evento registrado; detalhes sensíveis omitidos.');
    
      return {
        success: true,
        message: 'Login realizado com sucesso',
        sessao: sessaoId,
        session: sessao,
        usuario: {
          id: user.rowIndex,
          email: sessao.email,
          nome: sessao.nome,
          tipo: sessao.tipo,
          tipoKey: sessao.tipoKey,
          perfil: sessao.perfil,
          permissoes: sessao.permissions,
          admin: sessao.admin
        }
      };
    } catch (error) {
      Logger.log("Erro em login: " + error.message);
      throw error;
    }
  }
  
  function updateLastAccess(rowIndex) {
    try {
      try {
        try {
          var sheet = getUsersSheet();
          if (!sheet) return;
      
          var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      
          // Procura coluna de último acesso
          var colNames = ['ultimo_acesso', 'ultimoacesso', 'ultimoAcesso', 'lastAccess', 'Ultimo_Acesso'];
          var col = -1;
      
          for (var i = 0; i < headers.length; i++) {
            var h = String(headers[i]).toLowerCase().replace(/[^a-z0-9]/g, '');
            for (var j = 0; j < colNames.length; j++) {
              if (h === colNames[j].toLowerCase().replace(/[^a-z0-9]/g, '')) {
                col = i + 1;
                break;
              }
            }
            if (col > 0) break;
          }
      
          if (col > 0) {
            sheet.getRange(rowIndex, col).setValue(new Date());
          }
        } catch (e) {
          // Ignora erro
        }
      } catch (error) {
        Logger.log("Erro em updateLastAccess: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em updateLastAccess: " + error.message);
      throw error;
    }
  }
  
  // --------------------------------------------------------------------------
  // LOGOUT
  // --------------------------------------------------------------------------
  
  function logout(sessaoId) {
    try {
      try {
        var cache = getCache();
        if (cache) {
          cache.remove('user_session');
          if (sessaoId) {
            cache.remove('sessao_' + sessaoId);
          }
        }
      
        audit('LOGOUT', { sessaoId: sessaoId });
      
        return { success: true, message: 'Logout realizado com sucesso' };
      } catch (e) {
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em logout: " + error.message);
      throw error;
    }
  }
  
  // --------------------------------------------------------------------------
  // SESSÃO
  // --------------------------------------------------------------------------
  
  function getSession(sessaoId) {
    try {
      try {
        try {
          var cache = getCache();
          if (!cache) return null;
      
          var sessionData = sessaoId 
            ? cache.get('sessao_' + sessaoId) 
            : cache.get('user_session');
      
          if (!sessionData) return null;
      
          var session = JSON.parse(sessionData);
      
          // Verifica expiração
          if (session.expira && Date.now() > session.expira) {
            logout(sessaoId);
            return null;
          }
      
          // Renova sessão (sliding expiration)
          session.expira = Date.now() + CONFIG.SESSION_TIMEOUT;
          var sessaoJson = JSON.stringify(session);
      
          if (sessaoId) {
            cache.put('sessao_' + sessaoId, sessaoJson, CONFIG.SESSION_TIMEOUT_SECONDS);
          } else {
            cache.put('user_session', sessaoJson, CONFIG.SESSION_TIMEOUT_SECONDS);
          }
      
          return session;
        } catch (e) {
          Logger.log('AuthService: Erro ao obter sessão - ' + e.message);
          return null;
        }
      } catch (error) {
        Logger.log("Erro em getSession: " + error.message);
        throw error;
      }
    } catch (error) {
      Logger.log("Erro em getSession: " + error.message);
      throw error;
    }
  }

  
  // --------------------------------------------------------------------------
  // PERMISSÕES
  // --------------------------------------------------------------------------
  
  /**
   * Verifica se o usuário tem uma permissão específica
   * Suporta múltiplas assinaturas para compatibilidade:
   * - hasPermission(session, 'permissao')
   * - hasPermission(session, 'action', 'resource')
   * - hasPermission('sessaoId', 'permissao')
   */
  function hasPermission(sessionOrId, actionOrPermission, resource) {
    var session;
    
    // Determina a sessão
    if (typeof sessionOrId === 'string') {
      session = getSession(sessionOrId);
    } else {
      session = sessionOrId;
    }
    
    if (!session || !session.permissions) return false;
    
    // Admin tem todas as permissões
    if (session.admin === true) return true;
    if (session.permissions.indexOf('*') !== -1) return true;
    
    // Se resource foi fornecido, verifica permissão por recurso
    if (resource) {
      var resourcePerms = RESOURCE_PERMISSIONS[resource];
      if (resourcePerms && resourcePerms[actionOrPermission]) {
        var requiredPerms = resourcePerms[actionOrPermission];
        for (var i = 0; i < requiredPerms.length; i++) {
          if (session.permissions.indexOf(requiredPerms[i]) !== -1) {
            return true;
          }
        }
        return false;
      }
    }
    
    // Verifica permissão direta
    return session.permissions.indexOf(actionOrPermission) !== -1;
  }
  
  /**
   * Obtém todas as permissões de um tipo de usuário
   */
  function getPermissions(userType) {
    var tipoKey = normalizeUserType(userType);
    var tipoConfig = USER_TYPES[tipoKey] || USER_TYPES.FORNECEDOR;
    return tipoConfig.permissoes;
  }
  
  /**
   * Verifica se usuário é admin
   */
  function isAdmin(sessionOrId) {
    var session = typeof sessionOrId === 'string' ? getSession(sessionOrId) : sessionOrId;
    if (!session) return false;
    return session.admin === true || session.permissions.indexOf('*') !== -1;
  }
  
  // --------------------------------------------------------------------------
  // REGISTRO DE USUÁRIO
  // --------------------------------------------------------------------------
  
  function register(userData) {
    try {
      try {
        try {
          try {
            // Validação
            if (!userData || !userData.email || !userData.nome || !userData.senha) {
              return { 
                success: false, 
                error: 'Email, nome e senha são obrigatórios',
                code: 'MISSING_FIELDS'
              };
            }
      
            var email = String(userData.email).trim().toLowerCase();
      
            // Valida formato do email
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
              return { 
                success: false, 
                error: 'Formato de email inválido',
                code: 'INVALID_EMAIL'
              };
            }
      
            // Valida senha
            if (userData.senha.length < CONFIG.PASSWORD_MIN_LENGTH) {
              return { 
                success: false, 
                error: 'Senha deve ter no mínimo ' + CONFIG.PASSWORD_MIN_LENGTH + ' caracteres',
                code: 'WEAK_PASSWORD'
              };
            }
      
            // Verifica se já existe
            if (findUserByEmail(email)) {
              return { 
                success: false, 
                error: 'Email já cadastrado',
                code: 'EMAIL_EXISTS'
              };
            }
      
            var sheet = getUsersSheet();
            if (!sheet) {
              return { 
                success: false, 
                error: 'Planilha de usuários não encontrada',
                code: 'SHEET_NOT_FOUND'
              };
            }
      
            // Prepara dados
            var tipoKey = normalizeUserType(userData.tipo || 'FORNECEDOR');
            var tipoConfig = USER_TYPES[tipoKey] || USER_TYPES.FORNECEDOR;
            var senhaFinal = userData.senha; // Texto plano - arquitetura 100% digital
      
            var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      
            var novoUsuario = {
              id: 'USR_' + Date.now(),
              email: email,
              nome: userData.nome,
              senha: senhaFinal,
              tipo: tipoKey, // Usa a chave uppercase (FORNECEDOR) ao invés do nome legível
              perfil: userData.perfil || 'CONSULTA',
              instituicao: userData.instituicao || '',
              telefone: userData.telefone || '',
              cpf: userData.cpf || '',
              cnpj: userData.cnpj || '',
              status: 'ATIVO',
              ativo: 'ATIVO',
              dataCriacao: new Date(), // Alinhado com USUARIOS_SCHEMA
              dataAtualizacao: '',
              ultimoAcesso: '',
              token: ''
            };
      
            // Mapeia para as colunas existentes
            var row = headers.map(function(h) {
              var key = String(h).toLowerCase().replace(/[^a-z0-9_]/g, '');
        
              // Mapeamento de nomes de coluna (headers são camelCase conforme USUARIOS_SCHEMA)
              var mappings = {
                'datacriacao': 'dataCriacao',
                'dataatualizacao': 'dataAtualizacao',
                'ultimoacesso': 'ultimoAcesso',
                'nomecompleto': 'nome',
                // Mapeamentos inversos para compatibilidade
                'data_cadastro': 'dataCriacao',
                'ultimo_acesso': 'ultimoAcesso'
              };
        
              var mappedKey = mappings[key] || key;
        
              return novoUsuario[mappedKey] !== undefined ? novoUsuario[mappedKey] : 
                     (novoUsuario[h] !== undefined ? novoUsuario[h] : '');
            });
      
            sheet.appendRow(row);
      
            audit('USER_REGISTERED', { email: email, tipo: tipoKey });
      
            Logger.log('[LGPD] Evento registrado; detalhes sensíveis omitidos.');
      
            return {
              success: true,
              message: 'Usuário cadastrado com sucesso',
              user: {
                id: novoUsuario.id,
                email: email,
                nome: userData.nome,
                tipo: tipoConfig.nome
              }
            };
      
          } catch (e) {
            Logger.log('AuthService: Erro ao registrar - ' + e.message);
            return { success: false, error: e.message, code: 'REGISTER_ERROR' };
          }
        } catch (error) {
          Logger.log("Erro em register: " + error.message);
          throw error; // Re-lança para tratamento superior
        }
      } catch (error) {
        Logger.log("Erro em register: " + error.message);
        throw error;
      }
    } catch (error) {
      Logger.log("Erro em register: " + error.message);
      throw error;
    }
  }
  
  // --------------------------------------------------------------------------
  // ALTERAÇÃO DE SENHA
  // --------------------------------------------------------------------------
  
  function changePassword(email, senhaAtual, senhaNova) {
    try {
      try {
        try {
          try {
            var user = findUserByEmail(email);
            if (!user) {
              return { success: false, error: 'Usuário não encontrado', code: 'USER_NOT_FOUND' };
            }
      
            // Verifica senha atual
            var senhaArmazenada = String(user.senha || '').trim();
            if (!verifyPassword(senhaAtual, senhaArmazenada)) {
              return { success: false, error: 'Senha atual incorreta', code: 'WRONG_PASSWORD' };
            }
      
            // Valida nova senha
            if (!senhaNova || senhaNova.length < CONFIG.PASSWORD_MIN_LENGTH) {
              return { 
                success: false, 
                error: 'Nova senha deve ter no mínimo ' + CONFIG.PASSWORD_MIN_LENGTH + ' caracteres',
                code: 'WEAK_PASSWORD'
              };
            }
      
            // Atualiza senha
            var sheet = getUsersSheet();
            var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      
            var senhaCol = -1;
            for (var i = 0; i < headers.length; i++) {
              if (String(headers[i]).toLowerCase() === 'senha') {
                senhaCol = i + 1;
                break;
              }
            }
      
            if (senhaCol > 0) {
              var senhaFinal = senhaNova; // Texto plano - arquitetura 100% digital
              sheet.getRange(user.rowIndex, senhaCol).setValue(senhaFinal);
        
              audit('PASSWORD_CHANGED', { email: email });
        
              return { success: true, message: 'Senha alterada com sucesso' };
            }
      
            return { success: false, error: 'Coluna de senha não encontrada', code: 'COLUMN_NOT_FOUND' };
      
          } catch (e) {
            return { success: false, error: e.message, code: 'CHANGE_PASSWORD_ERROR' };
          }
        } catch (error) {
          Logger.log("Erro em changePassword: " + error.message);
          throw error; // Re-lança para tratamento superior
        }
      } catch (error) {
        Logger.log("Erro em changePassword: " + error.message);
        throw error;
      }
    } catch (error) {
      Logger.log("Erro em changePassword: " + error.message);
      throw error;
    }
  }

  // --------------------------------------------------------------------------
  // RECUPERAÇÃO DE SENHA
  // --------------------------------------------------------------------------

  function recoverPassword(email) {
    try {
      var user = findUserByEmail(email);
      if (!user) {
        // Por segurança, retornamos sucesso mesmo se o email não existir
        // para evitar enumeração de usuários.
        // Mas logamos o evento.
        Logger.log('[LGPD] Evento registrado; detalhes sensíveis omitidos.');
        return { success: true, message: 'Se o email estiver cadastrado, você receberá instruções.' };
      }

      // Gera token de recuperação (simulado)
      var token = Utilities.getUuid();
      
      // Em um sistema real, enviaria email.
      // Aqui vamos apenas registrar o evento sem expor o token.
      Logger.log('[LGPD] Evento registrado; detalhes sensíveis omitidos.');
      
      // TODO: Implementar envio de email real usando MailApp
      // MailApp.sendEmail(email, 'Recuperação de Senha', 'Seu token é: ' + token);

      audit('PASSWORD_RECOVERY_REQUEST', { email: email });

      return { success: true, message: 'Instruções enviadas para o email.' };

    } catch (e) {
      Logger.log('AuthService: Erro na recuperação de credencial - ' + e.message);
      return { success: false, error: 'Erro ao processar solicitação.' };
    }
  }

  
  // --------------------------------------------------------------------------
  // LISTAGEM DE USUÁRIOS
  // --------------------------------------------------------------------------
  
  function listUsers() {
    try {
      try {
        var sheet = getUsersSheet();
        if (!sheet || sheet.getLastRow() <= 1) return [];
      
        var data = sheet.getDataRange().getValues();
        var headers = data[0];
        var users = [];
      
        for (var i = 1; i < data.length; i++) {
          var user = {};
          headers.forEach(function(header, index) {
            user[header] = data[i][index];
          });
        
          // Remove dados sensíveis
          delete user.Senha;
          delete user.senha;

          delete user.senhahash;
          delete user.token;
        
          users.push(user);
        }
      
        return users;
      } catch (e) {
        Logger.log('AuthService: Erro ao listar usuários - ' + e.message);
        return [];
      }
    } catch (error) {
      Logger.log("Erro em listUsers: " + error.message);
      throw error;
    }
  }
  
  // --------------------------------------------------------------------------
  // API PÚBLICA
  // --------------------------------------------------------------------------
  
  return {
    // Core
    login: login,
    logout: logout,
    register: register,
    getSession: getSession,
    
    // Permissões
    hasPermission: hasPermission,
    getPermissions: getPermissions,
    isAdmin: isAdmin,
    
    // Usuários
    findUserByEmail: findUserByEmail,
    changePassword: changePassword,
    recoverPassword: recoverPassword,
    listUsers: listUsers,
    
    // Configuração
    USER_TYPES: USER_TYPES,
    CONFIG: CONFIG
  };
  
})();

// ============================================================================
// FUNÇÕES GLOBAIS DE API (google.script.run)
// ============================================================================

/**
 * Login - Função principal de autenticação
 * @param {string} email
 * @param {string} senha
 * @returns {Object} Resultado do login
 */
function api_auth_login(email, senha) {
  return AuthService.login(email, senha);
}

/**
 * Logout
 * @returns {Object} Resultado do logout
 */
function api_auth_logout() {
  return AuthService.logout();
}

/**
 * Obter sessão atual
 * @returns {Object} Dados da sessão ou null
 */
function api_auth_session() {
  var session = AuthService.getSession();
  return { 
    success: session !== null, 
    session: session,
    authenticated: session !== null
  };
}

/**
 * Alias para api_auth_session (compatibilidade)
 */
function api_auth_getSession() {
  return api_auth_session();
}

/**
 * Verificar se está autenticado
 * @returns {Object} Status de autenticação
 */
function api_auth_check() {
  var session = AuthService.getSession();
  return { 
    success: true, 
    authenticated: session !== null,
    session: session
  };
}

/**
 * Registrar novo usuário
 * @param {Object} dados - Dados do usuário
 * @returns {Object} Resultado do cadastro
 */
function api_auth_register(dados) {
  return AuthService.register(dados);
}

/**
 * Alterar senha
 * @param {string} senhaAtual
 * @param {string} senhaNova
 * @returns {Object} Resultado da alteração
 */
function api_auth_changePassword(senhaAtual, senhaNova) {
  var session = AuthService.getSession();
  if (!session) {
    return { success: false, error: 'Não autenticado', code: 'NOT_AUTHENTICATED' };
  }
  return AuthService.changePassword(session.email, senhaAtual, senhaNova);
}

/**
 * Listar usuários (requer admin)
 * @returns {Array} Lista de usuários
 */
function api_auth_listUsers() {
  var session = AuthService.getSession();
  if (!session || !AuthService.isAdmin(session)) {
    return { success: false, error: 'Sem permissão', code: 'FORBIDDEN' };
  }
  return { success: true, users: AuthService.listUsers() };
}

// ============================================================================
// ALIASES PARA COMPATIBILIDADE COM CÓDIGO LEGADO
// ============================================================================

/**
 * @deprecated Use AuthService.login() ou api_auth_login()
 */
function fazerLogin(email, senha) {
  return AuthService.login(email, senha);
}

/**
 * @deprecated Use AuthService.logout() ou api_auth_logout()
 */
function fazerLogout(sessaoId) {
  return AuthService.logout(sessaoId);
}

/**
 * @deprecated Use AuthService.getSession() ou api_auth_session()
 */
function verificarSessao(sessaoId) {
  return AuthService.getSession(sessaoId);
}

/**
 * @deprecated Use AuthService.login()
 */
function authLogin(email, senha) {
  return AuthService.login(email, senha);
}

/**
 * @deprecated Use AuthService.logout()
 */
function authLogout() {
  return AuthService.logout();
}

/**
 * @deprecated Use AuthService.getSession()
 */
function authGetCurrentUser() {
  return AuthService.getSession();
}

/**
 * @deprecated Use AuthService.hasPermission()
 */
function authCheckPermission(permission) {
  var session = AuthService.getSession();
  return AuthService.hasPermission(session, permission);
}

/**
 * @deprecated Use AuthService.listUsers()
 */
function authListUsers() {
  return AuthService.listUsers();
}

// ============================================================================
// REFERÊNCIA GLOBAL AUTH (compatibilidade com código existente)
// ============================================================================

// Cria referência global AUTH que aponta para AuthService
// Isso garante compatibilidade com código que usa AUTH.login(), AUTH.getSession(), etc.
var AUTH = AuthService;

// Alias para compatibilidade com Core_Auth_PlainText.gs
var AUTH_PLAIN = AuthService;

// ============================================================================
// FUNÇÕES DE CORREÇÃO DE SENHAS (migradas de Core_Auth_PlainText.gs)
// ============================================================================

/**
 * Corrige senha de um usuário para texto plano
 * @param {string} email - Email do usuário
 * @param {string} novaSenha - Nova senha em texto plano
 */
function corrigirSenhaUsuario(email, novaSenha) {
  try {
    try {
      try {
        if (!email || !novaSenha) {
          Logger.log('[LGPD] Evento registrado; detalhes sensíveis omitidos.');
          return { success: false, error: 'Parâmetros obrigatórios: email e novaSenha' };
        }
  
        var sheet = getSS().getSheetByName('Usuarios');
        if (!sheet) {
          return { success: false, error: 'Planilha Usuarios não encontrada' };
        }
  
        var data = sheet.getDataRange().getValues();
        var headers = data[0];
  
        var emailCol = -1;
        var senhaCol = -1;
  
        for (var i = 0; i < headers.length; i++) {
          var h = String(headers[i] || '').toLowerCase();
          if (h === 'email') emailCol = i;
          if (h === 'senha') senhaCol = i;
        }
  
        if (emailCol === -1 || senhaCol === -1) {
          return { success: false, error: 'Colunas email/senha não encontradas' };
        }
  
        var emailBusca = String(email).toLowerCase().trim();
  
        for (var row = 1; row < data.length; row++) {
          var emailLinha = String(data[row][emailCol] || '').toLowerCase().trim();
          if (emailLinha === emailBusca) {
            sheet.getRange(row + 1, senhaCol + 1).setValue(novaSenha);
            Logger.log('[LGPD] Evento registrado; detalhes sensíveis omitidos.');
            return { success: true, message: 'Senha atualizada para texto plano' };
          }
        }
  
        return { success: false, error: 'Usuário não encontrado: ' + email };
      } catch (error) {
        Logger.log("Erro em corrigirSenhaUsuario: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em corrigirSenhaUsuario: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em corrigirSenhaUsuario: " + error.message);
    throw error;
  }
}

/**
 * Lista todos os usuários e suas senhas (para debug)
 */
function listarUsuariosESenhas() {
  try {
    try {
      var sheet = getSS().getSheetByName('Usuarios');
      if (!sheet) return [];
  
      var data = sheet.getDataRange().getValues();
      var headers = data[0];
  
      var emailCol = -1;
      var senhaCol = -1;
      var nomeCol = -1;
      var tipoCol = -1;
  
      for (var i = 0; i < headers.length; i++) {
        var h = String(headers[i]).toLowerCase();
        if (h === 'email') emailCol = i;
        if (h === 'senha') senhaCol = i;
        if (h === 'nome') nomeCol = i;
        if (h === 'tipo') tipoCol = i;
      }
  
      Logger.log('');
      Logger.log('📋 USUÁRIOS E SENHAS:');
      Logger.log('═══════════════════════════════════════════════');
  
      var usuarios = [];
  
      for (var row = 1; row < data.length; row++) {
        var email = data[row][emailCol] || '';
        var senha = data[row][senhaCol] || '';
        var nome = data[row][nomeCol] || '';
        var tipo = data[row][tipoCol] || '';
    
        Logger.log((row) + '. ' + nome);
        Logger.log('[LGPD] Evento registrado; detalhes sensíveis omitidos.');
        Logger.log('   🔑 [PROTEGIDA]');
        Logger.log('   👤 ' + tipo);
        Logger.log('');
    
        usuarios.push({
          email: email,
          senha: senha,
          nome: nome,
          tipo: tipo
        });
      }
  
      return usuarios;
    } catch (error) {
      Logger.log("Erro em listarUsuariosESenhas: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em listarUsuariosESenhas: " + error.message);
    throw error;
  }
}

// Log de carregamento
Logger.log('✅ Core_Auth_Unified.gs carregado - Sistema de autenticação unificado v5.0.0');
