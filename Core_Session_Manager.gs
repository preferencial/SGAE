/**
 * @fileoverview Gerenciador de Sessões e Segurança - Alimentação Escolar CRE-PP
 * @version 1.0.0
 * 
 * Intervenção 6/38: SessionManager conforme Prompt 6
 * 
 * Complementa AuthService com:
 * - Tokens de sessão persistentes
 * - Proteção contra força bruta (bloqueio após 5 tentativas)
 * - Bloqueio por IP (simulado - GAS não tem acesso direto a IP)
 * - Arquitetura 100% digital (senha em texto plano conforme solicitado)
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-25
 * @requires Core_Auth_Unified.gs
 */

'use strict';

// ============================================================================
// SESSION MANAGER - Gerenciador de Sessões Avançado
// ============================================================================

var SessionManager = (function() {
  
  // =========================================================================
  // CONFIGURAÇÃO
  // =========================================================================
  
  var CONFIG = {
    // Sessão
    SESSION_TIMEOUT_MS: 8 * 60 * 60 * 1000,    // 8 horas
    SESSION_TIMEOUT_SECONDS: 28800,
    TOKEN_LENGTH: 32,
    REFRESH_THRESHOLD_MS: 30 * 60 * 1000,      // Renova se faltar 30 min
    
    // Segurança - Força Bruta
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION_MS: 30 * 60 * 1000,       // 30 minutos
    LOCKOUT_DURATION_SECONDS: 1800,
    
    // Segurança - IP (simulado via fingerprint)
    MAX_ATTEMPTS_PER_FINGERPRINT: 10,
    FINGERPRINT_LOCKOUT_MS: 60 * 60 * 1000,    // 1 hora
    
    // Persistência
    SESSIONS_SHEET: 'Sessoes',
    ENABLE_PERSISTENT_SESSIONS: true,
    
    // Auditoria
    LOG_ALL_ATTEMPTS: true
  };
  
  // =========================================================================
  // ESTADO INTERNO
  // =========================================================================
  
  var _activeSessions = {};
  
  // =========================================================================
  // FUNÇÕES PRIVADAS - TOKENS
  // =========================================================================
  
  /**
   * Gera token seguro
   * @private
   */
  function _generateToken() {
    try {
      var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      var token = '';
    
      for (var i = 0; i < CONFIG.TOKEN_LENGTH; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    
      // Adiciona timestamp para unicidade
      return token + '_' + Date.now().toString(36);
    } catch (error) {
      Logger.log("Erro em _generateToken: " + error.message);
      throw error;
    }
  }
  
  /**
   * Gera fingerprint do dispositivo (simulado)
   * @private
   */
  function _generateFingerprint(userAgent) {
    // Em GAS não temos acesso real ao User-Agent ou IP
    // Usamos o email do usuário efetivo como proxy
    try {
      var email = Session.getEffectiveUser().getEmail();
      return Utilities.computeDigest(
        Utilities.DigestAlgorithm.MD5,
        email + (userAgent || 'unknown')
      ).map(function(b) {
        return ('0' + (b & 0xFF).toString(16)).slice(-2);
      }).join('').substring(0, 16);
    } catch (e) {
      return 'unknown_' + Date.now();
    }
  }
  
  // =========================================================================
  // FUNÇÕES PRIVADAS - PROTEÇÃO FORÇA BRUTA
  // =========================================================================
  
  /**
   * Obtém dados de tentativas de login
   * @private
   */
  function _getLoginAttempts(identifier) {
    try {
      var cache = CacheService.getScriptCache();
      var key = 'login_attempts_' + identifier;
      var data = cache.get(key);
      
      if (data) {
        return JSON.parse(data);
      }
      
      return {
        count: 0,
        firstAttempt: null,
        lastAttempt: null,
        locked: false,
        lockExpires: null
      };
    } catch (e) {
      return { count: 0, locked: false };
    }
  }
  
  /**
   * Registra tentativa de login falha
   * @private
   */
  function _recordFailedAttempt(identifier, fingerprint) {
    try {
      try {
        try {
          var cache = CacheService.getScriptCache();
          var now = Date.now();
      
          // Por email
          var emailKey = 'login_attempts_' + identifier;
          var emailData = _getLoginAttempts(identifier);
      
          emailData.count++;
          emailData.lastAttempt = now;
          if (!emailData.firstAttempt) emailData.firstAttempt = now;
      
          // Verifica se deve bloquear
          if (emailData.count >= CONFIG.MAX_LOGIN_ATTEMPTS) {
            emailData.locked = true;
            emailData.lockExpires = now + CONFIG.LOCKOUT_DURATION_MS;
          }
      
          cache.put(emailKey, JSON.stringify(emailData), CONFIG.LOCKOUT_DURATION_SECONDS);
      
          // Por fingerprint (proteção adicional)
          if (fingerprint) {
            var fpKey = 'fp_attempts_' + fingerprint;
            var fpData = _getLoginAttempts('fp_' + fingerprint);
        
            fpData.count++;
            fpData.lastAttempt = now;
        
            if (fpData.count >= CONFIG.MAX_ATTEMPTS_PER_FINGERPRINT) {
              fpData.locked = true;
              fpData.lockExpires = now + CONFIG.FINGERPRINT_LOCKOUT_MS;
            }
        
            cache.put(fpKey, JSON.stringify(fpData), CONFIG.FINGERPRINT_LOCKOUT_MS / 1000);
          }
      
          // Log de segurança
          if (CONFIG.LOG_ALL_ATTEMPTS && typeof AuditService !== 'undefined') {
            AuditService.log({
              action: AuditService.ACTIONS.LOGIN_FAILED,
              entity: 'Sessoes',
              userId: identifier,
              severity: emailData.count >= 3 ? AuditService.SEVERITY.WARNING : AuditService.SEVERITY.INFO,
              notes: 'Tentativa ' + emailData.count + ' de ' + CONFIG.MAX_LOGIN_ATTEMPTS
            });
          }
      
          return emailData;
      
        } catch (e) {
          console.error('Erro ao registrar tentativa falha: ' + e.message);
          return { count: 0, locked: false };
        }
      } catch (error) {
        Logger.log("Erro em _recordFailedAttempt: " + error.message);
        throw error;
      }
    } catch (error) {
      Logger.log("Erro em _recordFailedAttempt: " + error.message);
      throw error;
    }
  }
  
  /**
   * Limpa tentativas após login bem-sucedido
   * @private
   */
  function _clearAttempts(identifier, fingerprint) {
    try {
      try {
        var cache = CacheService.getScriptCache();
        cache.remove('login_attempts_' + identifier);
      
        if (fingerprint) {
          cache.remove('fp_attempts_' + fingerprint);
        }
      } catch (e) {
        // Ignora
      }
    } catch (error) {
      Logger.log("Erro em _clearAttempts: " + error.message);
      throw error;
    }
  }
  
  /**
   * Verifica se está bloqueado
   * @private
   */
  function _isBlocked(identifier, fingerprint) {
    var now = Date.now();
    
    // Verifica bloqueio por email
    var emailData = _getLoginAttempts(identifier);
    if (emailData.locked && emailData.lockExpires > now) {
      var remainingMin = Math.ceil((emailData.lockExpires - now) / 60000);
      return {
        blocked: true,
        reason: 'email',
        remainingMinutes: remainingMin,
        message: 'Conta bloqueada. Tente novamente em ' + remainingMin + ' minutos.'
      };
    }
    
    // Verifica bloqueio por fingerprint
    if (fingerprint) {
      var fpData = _getLoginAttempts('fp_' + fingerprint);
      if (fpData.locked && fpData.lockExpires > now) {
        var remainingMin2 = Math.ceil((fpData.lockExpires - now) / 60000);
        return {
          blocked: true,
          reason: 'fingerprint',
          remainingMinutes: remainingMin2,
          message: 'Dispositivo bloqueado temporariamente. Tente novamente em ' + remainingMin2 + ' minutos.'
        };
      }
    }
    
    return { blocked: false };
  }
  
  // =========================================================================
  // FUNÇÕES PRIVADAS - PERSISTÊNCIA DE SESSÃO
  // =========================================================================
  
  /**
   * Obtém sheet de sessões
   * @private
   */
  function _getSessionsSheet() {
    try {
      try {
        var ss = getSS();
        if (!ss) return null;
      
        var sheet = ss.getSheetByName(CONFIG.SESSIONS_SHEET);
      
        if (!sheet && CONFIG.ENABLE_PERSISTENT_SESSIONS) {
          // Cria a aba
          sheet = ss.insertSheet(CONFIG.SESSIONS_SHEET);
        
          var headers = [
            'ID', 'Usuario_ID', 'Email', 'Token', 'Data_Inicio',
            'Data_Expiracao', 'Fingerprint', 'Dispositivo', 'Status',
            'Data_Ultimo_Acesso', 'dataCriacao'
          ];
        
          sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
          sheet.getRange(1, 1, 1, headers.length)
            .setBackground('#2E7D32')
            .setFontColor('white')
            .setFontWeight('bold');
        
          sheet.setFrozenRows(1);
        }
      
        return sheet;
      } catch (e) {
        return null;
      }
    } catch (error) {
      Logger.log("Erro em _getSessionsSheet: " + error.message);
      throw error;
    }
  }
  
  /**
   * Salva sessão na planilha
   * @private
   */
  function _persistSession(session) {
    if (!CONFIG.ENABLE_PERSISTENT_SESSIONS) return;
    
    try {
      var sheet = _getSessionsSheet();
      if (!sheet) return;
      
      var row = [
        session.id,
        session.userId || '',
        session.email,
        session.token,
        new Date(session.startTime),
        new Date(session.expiresAt),
        session.fingerprint || '',
        session.device || 'unknown',
        'ATIVA',
        new Date(),
        new Date()
      ];
      
      sheet.appendRow(row);
      
    } catch (e) {
      console.error('Erro ao persistir sessão: ' + e.message);
    }
  }
  
  /**
   * Atualiza status da sessão na planilha
   * @private
   */
  function _updateSessionStatus(token, status) {
    try {
      try {
        if (!CONFIG.ENABLE_PERSISTENT_SESSIONS) return;
    
        try {
          var sheet = _getSessionsSheet();
          if (!sheet || sheet.getLastRow() <= 1) return;
      
          var data = sheet.getDataRange().getValues();
          var headers = data[0];
          var tokenCol = headers.indexOf('Token');
          var statusCol = headers.indexOf('Status');
          var lastAccessCol = headers.indexOf('Data_Ultimo_Acesso');
      
          if (tokenCol === -1) return;
      
          for (var i = 1; i < data.length; i++) {
            if (data[i][tokenCol] === token) {
              if (statusCol !== -1) {
                sheet.getRange(i + 1, statusCol + 1).setValue(status);
              }
              if (lastAccessCol !== -1) {
                sheet.getRange(i + 1, lastAccessCol + 1).setValue(new Date());
              }
              break;
            }
          }
        } catch (e) {
          // Ignora
        }
      } catch (error) {
        Logger.log("Erro em _updateSessionStatus: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em _updateSessionStatus: " + error.message);
      throw error;
    }
  }
  
  // =========================================================================
  // API PÚBLICA
  // =========================================================================
  
  return {
    
    /**
     * Expõe configuração
     */
    CONFIG: CONFIG,
    
    // -----------------------------------------------------------------------
    // CRIAÇÃO E VALIDAÇÃO DE SESSÃO
    // -----------------------------------------------------------------------
    
    /**
     * Cria nova sessão após login bem-sucedido
     * @param {Object} user - Dados do usuário
     * @param {Object} [options] - Opções { fingerprint, device, persistent }
     * @returns {Object} Sessão criada
     */
    createSession: function(user, options) {
      try {
        options = options || {};
      
        var now = Date.now();
        var token = _generateToken();
        var fingerprint = options.fingerprint || _generateFingerprint();
      
        var session = {
          id: Utilities.getUuid(),
          token: token,
          email: user.email,
          userId: user.id || user.rowIndex,
          nome: user.nome,
          tipo: user.tipo,
          tipoKey: user.tipoKey,
          perfil: user.perfil,
          instituicao: user.instituicao,
          permissions: user.permissions || [],
          admin: user.admin || false,
          nivel: user.nivel || 0,
          fingerprint: fingerprint,
          device: options.device || 'unknown',
          startTime: now,
          expiresAt: now + CONFIG.SESSION_TIMEOUT_MS,
          lastAccess: now,
          persistent: options.persistent !== false
        };
      
        // Salva no cache
        try {
          var cache = CacheService.getUserCache();
          var sessionJson = JSON.stringify(session);
        
          cache.put('session_' + token, sessionJson, CONFIG.SESSION_TIMEOUT_SECONDS);
          cache.put('user_session', sessionJson, CONFIG.SESSION_TIMEOUT_SECONDS);
          cache.put('session_by_email_' + user.email, token, CONFIG.SESSION_TIMEOUT_SECONDS);
        
          // Salva em memória
          _activeSessions[token] = session;
        
        } catch (e) {
          console.error('Erro ao salvar sessão no cache: ' + e.message);
        }
      
        // Persiste na planilha
        if (session.persistent) {
          _persistSession(session);
        }
      
        // Limpa tentativas de login
        _clearAttempts(user.email, fingerprint);
      
        // Auditoria
        if (typeof AuditService !== 'undefined') {
          AuditService.logLogin(user.email, {
            sessionId: session.id,
            device: session.device
          });
        }
      
        return session;
      } catch (error) {
        Logger.log("Erro em createSession: " + error.message);
        throw error;
      }
    },
    
    /**
     * Valida e retorna sessão
     * @param {string} token - Token da sessão
     * @returns {Object|null} Sessão ou null se inválida
     */
    validateSession: function(token) {
      try {
        if (!token) return null;
      
        try {
          var now = Date.now();
        
          // Tenta memória primeiro
          if (_activeSessions[token]) {
            var memSession = _activeSessions[token];
            if (memSession.expiresAt > now) {
              // Atualiza último acesso
              memSession.lastAccess = now;
              return memSession;
            } else {
              delete _activeSessions[token];
            }
          }
        
          // Tenta cache
          var cache = CacheService.getUserCache();
          var sessionData = cache.get('session_' + token);
        
          if (sessionData) {
            var session = JSON.parse(sessionData);
          
            // Verifica expiração
            if (session.expiresAt <= now) {
              this.invalidateSession(token);
              return null;
            }
          
            // Atualiza último acesso
            session.lastAccess = now;
          
            // Renova se necessário (sliding expiration)
            if (session.expiresAt - now < CONFIG.REFRESH_THRESHOLD_MS) {
              session.expiresAt = now + CONFIG.SESSION_TIMEOUT_MS;
              cache.put('session_' + token, JSON.stringify(session), CONFIG.SESSION_TIMEOUT_SECONDS);
            }
          
            // Salva em memória
            _activeSessions[token] = session;
          
            return session;
          }
        
          return null;
        
        } catch (e) {
          console.error('Erro ao validar sessão: ' + e.message);
          return null;
        }
      } catch (error) {
        Logger.log("Erro em validateSession: " + error.message);
        throw error;
      }
    },
    
    /**
     * Invalida sessão (logout)
     * @param {string} token - Token da sessão
     * @returns {Object} Resultado
     */
    invalidateSession: function(token) {
      try {
        try {
          var session = _activeSessions[token];
        
          // Remove do cache
          var cache = CacheService.getUserCache();
          cache.remove('session_' + token);
          cache.remove('user_session');
        
          if (session) {
            cache.remove('session_by_email_' + session.email);
          }
        
          // Remove da memória
          delete _activeSessions[token];
        
          // Atualiza status na planilha
          _updateSessionStatus(token, 'ENCERRADA');
        
          // Auditoria
          if (session && typeof AuditService !== 'undefined') {
            AuditService.log({
              action: AuditService.ACTIONS.LOGOUT,
              entity: 'Sessoes',
              entityId: session.id,
              userId: session.email
            });
          }
        
          return { success: true, message: 'Sessão encerrada' };
        
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em invalidateSession: " + error.message);
        throw error;
      }
    },
    
    /**
     * Obtém sessão atual do usuário
     * @returns {Object|null}
     */
    getCurrentSession: function() {
      try {
        try {
          var cache = CacheService.getUserCache();
          var sessionData = cache.get('user_session');
        
          if (sessionData) {
            var session = JSON.parse(sessionData);
            return this.validateSession(session.token);
          }
        
          return null;
        } catch (e) {
          return null;
        }
      } catch (error) {
        Logger.log("Erro em getCurrentSession: " + error.message);
        throw error;
      }
    },
    
    // -----------------------------------------------------------------------
    // PROTEÇÃO CONTRA FORÇA BRUTA
    // -----------------------------------------------------------------------
    
    /**
     * Verifica se login está bloqueado
     * @param {string} email - Email do usuário
     * @param {string} [fingerprint] - Fingerprint do dispositivo
     * @returns {Object} Status de bloqueio
     */
    checkLoginBlock: function(email, fingerprint) {
      return _isBlocked(email, fingerprint);
    },
    
    /**
     * Registra tentativa de login falha
     * @param {string} email - Email
     * @param {string} [fingerprint] - Fingerprint
     * @returns {Object} Dados atualizados
     */
    recordFailedLogin: function(email, fingerprint) {
      return _recordFailedAttempt(email, fingerprint);
    },
    
    /**
     * Limpa bloqueio manualmente (admin)
     * @param {string} email - Email do usuário
     * @returns {Object} Resultado
     */
    clearLoginBlock: function(email) {
      _clearAttempts(email);
      return { success: true, message: 'Bloqueio removido para ' + email };
    },
    
    /**
     * Obtém status de tentativas de login
     * @param {string} email - Email
     * @returns {Object} Status
     */
    getLoginAttemptStatus: function(email) {
      try {
        var data = _getLoginAttempts(email);
        return {
          attempts: data.count,
          maxAttempts: CONFIG.MAX_LOGIN_ATTEMPTS,
          remaining: Math.max(0, CONFIG.MAX_LOGIN_ATTEMPTS - data.count),
          locked: data.locked,
          lockExpires: data.lockExpires ? new Date(data.lockExpires).toISOString() : null
        };
      } catch (error) {
        Logger.log("Erro em getLoginAttemptStatus: " + error.message);
        throw error;
      }
    },
    
    // -----------------------------------------------------------------------
    // GERENCIAMENTO DE SESSÕES
    // -----------------------------------------------------------------------
    
    /**
     * Lista sessões ativas de um usuário
     * @param {string} email - Email do usuário
     * @returns {Array} Sessões
     */
    getUserSessions: function(email) {
      if (!CONFIG.ENABLE_PERSISTENT_SESSIONS) return [];
      
      try {
        var sheet = _getSessionsSheet();
        if (!sheet || sheet.getLastRow() <= 1) return [];
        
        var data = sheet.getDataRange().getValues();
        var headers = data[0];
        var sessions = [];
        
        for (var i = 1; i < data.length; i++) {
          var row = {};
          headers.forEach(function(h, idx) {
            row[h] = data[i][idx];
          });
          
          if (row.Email === email && row.Status === 'ATIVA') {
            sessions.push({
              id: row.ID,
              device: row.Dispositivo,
              startTime: row.Data_Inicio,
              lastAccess: row.Data_Ultimo_Acesso,
              expiresAt: row.Data_Expiracao
            });
          }
        }
        
        return sessions;
        
      } catch (e) {
        return [];
      }
    },
    
    /**
     * Encerra todas as sessões de um usuário
     * @param {string} email - Email do usuário
     * @returns {Object} Resultado
     */
    invalidateAllUserSessions: function(email) {
      try {
        try {
          // Remove do cache
          var cache = CacheService.getUserCache();
          var token = cache.get('session_by_email_' + email);
        
          if (token) {
            cache.remove('session_' + token);
            delete _activeSessions[token];
          }
        
          cache.remove('session_by_email_' + email);
        
          // Atualiza planilha
          if (CONFIG.ENABLE_PERSISTENT_SESSIONS) {
            var sheet = _getSessionsSheet();
            if (sheet && sheet.getLastRow() > 1) {
              var data = sheet.getDataRange().getValues();
              var headers = data[0];
              var emailCol = headers.indexOf('Email');
              var statusCol = headers.indexOf('Status');
            
              for (var i = 1; i < data.length; i++) {
                if (data[i][emailCol] === email && data[i][statusCol] === 'ATIVA') {
                  sheet.getRange(i + 1, statusCol + 1).setValue('ENCERRADA');
                }
              }
            }
          }
        
          return { success: true, message: 'Todas as sessões encerradas' };
        
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em invalidateAllUserSessions: " + error.message);
        throw error;
      }
    },
    
    /**
     * Limpa sessões expiradas (manutenção)
     * @returns {Object} Resultado
     */
    cleanupExpiredSessions: function() {
      try {
        if (!CONFIG.ENABLE_PERSISTENT_SESSIONS) {
          return { success: true, cleaned: 0 };
        }
      
        try {
          var sheet = _getSessionsSheet();
          if (!sheet || sheet.getLastRow() <= 1) {
            return { success: true, cleaned: 0 };
          }
        
          var data = sheet.getDataRange().getValues();
          var headers = data[0];
          var expiresCol = headers.indexOf('Data_Expiracao');
          var statusCol = headers.indexOf('Status');
          var now = new Date();
          var cleaned = 0;
        
          for (var i = data.length - 1; i >= 1; i--) {
            var expires = new Date(data[i][expiresCol]);
            var status = data[i][statusCol];
          
            if (status === 'ATIVA' && expires < now) {
              sheet.getRange(i + 1, statusCol + 1).setValue('EXPIRADA');
              cleaned++;
            }
          }
        
          // Limpa memória
          var memKeys = Object.keys(_activeSessions);
          memKeys.forEach(function(key) {
            if (_activeSessions[key].expiresAt < Date.now()) {
              delete _activeSessions[key];
            }
          });
        
          return { success: true, cleaned: cleaned };
        
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em cleanupExpiredSessions: " + error.message);
        throw error;
      }
    },
    
    // -----------------------------------------------------------------------
    // UTILITÁRIOS
    // -----------------------------------------------------------------------
    
    /**
     * Gera fingerprint para o dispositivo atual
     * @param {string} [userAgent] - User-Agent (se disponível)
     * @returns {string} Fingerprint
     */
    generateFingerprint: function(userAgent) {
      return _generateFingerprint(userAgent);
    },
    
    /**
     * Obtém estatísticas de sessões
     * @returns {Object} Estatísticas
     */
    getStats: function() {
      try {
        var activeMem = Object.keys(_activeSessions).length;
        var stats = {
          activeInMemory: activeMem,
          config: {
            sessionTimeout: CONFIG.SESSION_TIMEOUT_MS / 1000 / 60 + ' minutos',
            maxLoginAttempts: CONFIG.MAX_LOGIN_ATTEMPTS,
            lockoutDuration: CONFIG.LOCKOUT_DURATION_MS / 1000 / 60 + ' minutos'
          }
        };
      
        if (CONFIG.ENABLE_PERSISTENT_SESSIONS) {
          try {
            var sheet = _getSessionsSheet();
            if (sheet && sheet.getLastRow() > 1) {
              var data = sheet.getDataRange().getValues();
              var statusCol = data[0].indexOf('Status');
              var ativas = 0, expiradas = 0, encerradas = 0;
            
              for (var i = 1; i < data.length; i++) {
                var status = data[i][statusCol];
                if (status === 'ATIVA') ativas++;
                else if (status === 'EXPIRADA') expiradas++;
                else if (status === 'ENCERRADA') encerradas++;
              }
            
              stats.persistent = {
                ativas: ativas,
                expiradas: expiradas,
                encerradas: encerradas,
                total: data.length - 1
              };
            }
          } catch (e) {
            // Ignora
          }
        }
      
        return stats;
      } catch (error) {
        Logger.log("Erro em getStats: " + error.message);
        throw error;
      }
    }
  };
})();


// ============================================================================
// INTEGRAÇÃO COM AUTHSERVICE
// ============================================================================

/**
 * Login seguro com proteção contra força bruta
 * Wrapper que integra AuthService com SessionManager
 * @param {string} email - Email do usuário
 * @param {string} senha - Senha (texto plano - arquitetura 100% digital)
 * @param {Object} [options] - Opções { fingerprint, device, persistent }
 * @returns {Object} Resultado do login
 */
function secureLogin(email, senha, options) {
  try {
    options = options || {};
  
    // Normaliza email
    email = String(email || '').trim().toLowerCase();
  
    if (!email || !senha) {
      return {
        success: false,
        error: 'Email e senha são obrigatórios',
        code: 'MISSING_CREDENTIALS'
      };
    }
  
    // Gera fingerprint
    var fingerprint = options.fingerprint || SessionManager.generateFingerprint();
  
    // Verifica bloqueio
    var blockStatus = SessionManager.checkLoginBlock(email, fingerprint);
    if (blockStatus.blocked) {
      return {
        success: false,
        error: blockStatus.message,
        code: 'ACCOUNT_LOCKED',
        remainingMinutes: blockStatus.remainingMinutes
      };
    }
  
    // Tenta login via AuthService
    var authResult;
    if (typeof AuthService !== 'undefined') {
      authResult = AuthService.login(email, senha);
    } else {
      return {
        success: false,
        error: 'Sistema de autenticação não disponível',
        code: 'AUTH_UNAVAILABLE'
      };
    }
  
    // Se falhou, registra tentativa
    if (!authResult.success) {
      var attemptData = SessionManager.recordFailedLogin(email, fingerprint);
    
      // Adiciona info de tentativas restantes
      authResult.attemptsRemaining = Math.max(0, SessionManager.CONFIG.MAX_LOGIN_ATTEMPTS - attemptData.count);
    
      if (attemptData.locked) {
        authResult.error = 'Conta bloqueada após múltiplas tentativas. Aguarde 30 minutos.';
        authResult.code = 'ACCOUNT_LOCKED';
      }
    
      return authResult;
    }
  
    // Login bem-sucedido - cria sessão avançada
    var session = SessionManager.createSession({
      id: authResult.usuario.id,
      email: authResult.usuario.email,
      nome: authResult.usuario.nome,
      tipo: authResult.usuario.tipo,
      tipoKey: authResult.usuario.tipoKey,
      perfil: authResult.usuario.perfil,
      permissions: authResult.usuario.permissoes,
      admin: authResult.usuario.admin,
      instituicao: authResult.session ? authResult.session.instituicao : ''
    }, {
      fingerprint: fingerprint,
      device: options.device || 'web',
      persistent: options.persistent !== false
    });
  
    return {
      success: true,
      message: 'Login realizado com sucesso',
      token: session.token,
      session: session,
      usuario: authResult.usuario
    };
  } catch (error) {
    Logger.log("Erro em secureLogin: " + error.message);
    throw error;
  }
}

/**
 * Logout seguro
 * @param {string} [token] - Token da sessão (opcional, usa sessão atual)
 * @returns {Object} Resultado
 */
function secureLogout(token) {
  if (!token) {
    var currentSession = SessionManager.getCurrentSession();
    if (currentSession) {
      token = currentSession.token;
    }
  }
  
  if (token) {
    return SessionManager.invalidateSession(token);
  }
  
  // Fallback para AuthService
  if (typeof AuthService !== 'undefined') {
    return AuthService.logout();
  }
  
  return { success: true, message: 'Logout realizado' };
}

/**
 * Verifica sessão atual
 * @returns {Object} Status da sessão
 */
function checkSession() {
  var session = SessionManager.getCurrentSession();
  
  return {
    success: true,
    authenticated: session !== null,
    session: session,
    user: session ? {
      email: session.email,
      nome: session.nome,
      tipo: session.tipo,
      admin: session.admin
    } : null
  };
}

/**
 * Valida token de sessão
 * @param {string} token - Token
 * @returns {Object} Resultado
 */
function validateToken(token) {
  var session = SessionManager.validateSession(token);
  
  return {
    success: session !== null,
    valid: session !== null,
    session: session
  };
}

// ============================================================================
// FUNÇÕES DE API PARA FRONTEND
// ============================================================================

/**
 * API: Login seguro
 */
function api_secure_login(email, senha, options) {
  return secureLogin(email, senha, options);
}

/**
 * API: Logout seguro
 */
function api_secure_logout(token) {
  return secureLogout(token);
}

/**
 * API: Verificar sessão
 */
function api_check_session() {
  return checkSession();
}

/**
 * API: Validar token
 */
function api_validate_token(token) {
  return validateToken(token);
}

/**
 * API: Obter status de bloqueio
 */
function api_get_login_status(email) {
  return SessionManager.getLoginAttemptStatus(email);
}

/**
 * API: Listar sessões do usuário (requer autenticação)
 */
function api_get_user_sessions() {
  var session = SessionManager.getCurrentSession();
  if (!session) {
    return { success: false, error: 'Não autenticado' };
  }
  
  return {
    success: true,
    sessions: SessionManager.getUserSessions(session.email)
  };
}

/**
 * API: Encerrar todas as sessões (requer autenticação)
 */
function api_logout_all_sessions() {
  var session = SessionManager.getCurrentSession();
  if (!session) {
    return { success: false, error: 'Não autenticado' };
  }
  
  return SessionManager.invalidateAllUserSessions(session.email);
}

/**
 * API: Limpar bloqueio (admin)
 */
function api_admin_clear_block(email) {
  var session = SessionManager.getCurrentSession();
  if (!session || !session.admin) {
    return { success: false, error: 'Acesso negado' };
  }
  
  return SessionManager.clearLoginBlock(email);
}

/**
 * API: Estatísticas de sessões (admin)
 */
function api_admin_session_stats() {
  var session = SessionManager.getCurrentSession();
  if (!session || !session.admin) {
    return { success: false, error: 'Acesso negado' };
  }
  
  return {
    success: true,
    stats: SessionManager.getStats()
  };
}

/**
 * API: Limpeza de sessões expiradas (admin)
 */
function api_admin_cleanup_sessions() {
  var session = SessionManager.getCurrentSession();
  if (!session || !session.admin) {
    return { success: false, error: 'Acesso negado' };
  }
  
  return SessionManager.cleanupExpiredSessions();
}

// ============================================================================
// TRIGGER PARA LIMPEZA AUTOMÁTICA
// ============================================================================

/**
 * Função para ser executada via trigger diário
 * Limpa sessões expiradas automaticamente
 */
function dailySessionCleanup() {
  var result = SessionManager.cleanupExpiredSessions();
  Logger.log('Limpeza de sessões: ' + result.cleaned + ' sessões expiradas processadas');
  return result;
}

// ============================================================================
// REGISTRO DO MÓDULO
// ============================================================================

Logger.log('✅ Core_Session_Manager carregado - SessionManager disponível');
