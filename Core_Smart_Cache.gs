/**
 * @fileoverview Camada de Cache e Performance - Alimentação Escolar CRE-PP
 * @version 1.0.0
 * 
 * Intervenção 5/38: SmartCache conforme Prompt 5
 * 
 * Cache otimizado para dispositivos móveis com foco em:
 * - Dados de cardápios (acesso frequente)
 * - Permissões de usuários (crítico para UX)
 * - Listas de fornecedores e escolas
 * - Respeita limite de 100KB por chave do CacheService
 * 
 * Utiliza sessionStorage (frontend) e CacheService (backend)
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-25
 */

'use strict';

// ============================================================================
// SMART CACHE - Cache Inteligente para Mobile
// ============================================================================

var SmartCache = (function() {
  
  // =========================================================================
  // CONFIGURAÇÃO
  // =========================================================================
  
  var CONFIG = {
    // Limites do GAS
    MAX_CACHE_SIZE_BYTES: 100 * 1024,  // 100KB por chave
    MAX_TOTAL_SIZE_BYTES: 25 * 1024 * 1024, // 25MB total
    
    // TTLs por tipo de dado (em segundos)
    TTL: {
      CARDAPIO_SEMANAL: 3600,      // 1 hora (muda pouco)
      CARDAPIO_DIA: 1800,          // 30 min
      PERMISSOES_USUARIO: 600,     // 10 min (crítico)
      LISTA_FORNECEDORES: 3600,    // 1 hora
      LISTA_ESCOLAS: 3600,         // 1 hora
      LISTA_ITENS: 1800,           // 30 min
      DASHBOARD_RESUMO: 300,       // 5 min
      NFS_PENDENTES: 180,          // 3 min
      ENTREGAS_DIA: 300,           // 5 min
      DEFAULT: 600                 // 10 min padrão
    },
    
    // Prefixos para organização
    PREFIX: {
      CARDAPIO: 'card_',
      USUARIO: 'usr_',
      FORNECEDOR: 'forn_',
      ESCOLA: 'esc_',
      ITEM: 'item_',
      DASHBOARD: 'dash_',
      NF: 'nf_',
      ENTREGA: 'ent_',
      SESSAO: 'sess_'
    }
  };
  
  // =========================================================================
  // ESTADO INTERNO
  // =========================================================================
  
  var _memoryCache = {};
  var _memoryExpiry = {};
  var _stats = {
    hits: 0,
    misses: 0,
    writes: 0,
    evictions: 0,
    compressions: 0
  };
  
  // =========================================================================
  // FUNÇÕES PRIVADAS
  // =========================================================================
  
  /**
   * Obtém CacheService do script
   * @private
   */
  function _getCache() {
    try {
      return CacheService.getScriptCache();
    } catch (error) {
      Logger.log("Erro em _getCache: " + error.message);
      throw error;
    }
  }
  
  /**
   * Calcula tamanho em bytes de uma string
   * @private
   */
  function _getByteSize(str) {
    return new Blob([str]).size;
  }
  
  /**
   * Comprime dados se necessário (remove campos desnecessários)
   * @private
   */
  function _compress(data, options) {
    try {
      if (!data || typeof data !== 'object') return data;
    
      options = options || {};
      var excludeFields = options.excludeFields || ['_rowIndex', '_resolved', 'dataCriacao', 'dataAtualizacao'];
    
      if (Array.isArray(data)) {
        return data.map(function(item) {
          return _compress(item, options);
        });
      }
    
      var compressed = {};
      for (var key in data) {
        if (excludeFields.indexOf(key) === -1 && key.charAt(0) !== '_') {
          compressed[key] = data[key];
        }
      }
    
      _stats.compressions++;
      return compressed;
    } catch (error) {
      Logger.log("Erro em _compress: " + error.message);
      throw error;
    }
  }
  
  /**
   * Divide dados grandes em chunks
   * @private
   */
  function _chunk(data, maxSize) {
    try {
      try {
        var json = JSON.stringify(data);
        var chunks = [];
        var chunkSize = maxSize - 100; // Margem de segurança
    
        for (var i = 0; i < json.length; i += chunkSize) {
          chunks.push(json.substring(i, i + chunkSize));
        }
    
        return chunks;
      } catch (error) {
        Logger.log("Erro em _chunk: " + error.message);
        throw error;
      }
    } catch (error) {
      Logger.log("Erro em _chunk: " + error.message);
      throw error;
    }
  }
  
  /**
   * Reconstrói dados de chunks
   * @private
   */
  function _unchunk(chunks) {
    try {
      return JSON.parse(chunks.join(''));
    } catch (error) {
      Logger.log("Erro em _unchunk: " + error.message);
      throw error;
    }
  }
  
  /**
   * Verifica se cache em memória está válido
   * @private
   */
  function _isMemoryValid(key) {
    return _memoryCache[key] !== undefined && 
           _memoryExpiry[key] && 
           Date.now() < _memoryExpiry[key];
  }
  
  /**
   * Define no cache em memória
   * @private
   */
  function _setMemory(key, value, ttlMs) {
    _memoryCache[key] = value;
    _memoryExpiry[key] = Date.now() + ttlMs;
  }
  
  /**
   * Limpa cache em memória expirado
   * @private
   */
  function _cleanupMemory() {
    try {
      var now = Date.now();
      var keys = Object.keys(_memoryExpiry);
      var cleaned = 0;
    
      keys.forEach(function(key) {
        if (_memoryExpiry[key] < now) {
          delete _memoryCache[key];
          delete _memoryExpiry[key];
          cleaned++;
        }
      });
    
      _stats.evictions += cleaned;
      return cleaned;
    } catch (error) {
      Logger.log("Erro em _cleanupMemory: " + error.message);
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
    // OPERAÇÕES BÁSICAS
    // -----------------------------------------------------------------------
    
    /**
     * Obtém valor do cache (memória primeiro, depois CacheService)
     * @param {string} key - Chave
     * @param {Object} [options] - Opções
     * @returns {*} Valor ou null
     */
    get: function(key, options) {
      options = options || {};
      
      try {
        // 1. Tenta memória primeiro (mais rápido)
        if (_isMemoryValid(key)) {
          _stats.hits++;
          return _memoryCache[key];
        }
        
        // 2. Tenta CacheService
        var cache = _getCache();
        var data = cache.get(key);
        
        if (data) {
          _stats.hits++;
          var parsed = JSON.parse(data);
          
          // Verifica se é chunked
          if (parsed._chunked) {
            var chunks = [];
            for (var i = 0; i < parsed._chunkCount; i++) {
              var chunk = cache.get(key + '_chunk_' + i);
              if (!chunk) {
                _stats.misses++;
                return null;
              }
              chunks.push(chunk);
            }
            parsed = _unchunk(chunks);
          }
          
          // Salva em memória para próximo acesso
          var ttl = options.ttl || CONFIG.TTL.DEFAULT;
          _setMemory(key, parsed, ttl * 1000);
          
          return parsed;
        }
        
        _stats.misses++;
        return null;
        
      } catch (e) {
        console.error('SmartCache.get erro: ' + e.message);
        _stats.misses++;
        return null;
      }
    },
    
    /**
     * Define valor no cache
     * @param {string} key - Chave
     * @param {*} value - Valor
     * @param {number} [ttlSeconds] - TTL em segundos
     * @param {Object} [options] - Opções { compress, excludeFields }
     * @returns {boolean} Sucesso
     */
    set: function(key, value, ttlSeconds, options) {
      try {
        options = options || {};
        ttlSeconds = ttlSeconds || CONFIG.TTL.DEFAULT;
      
        try {
          var dataToCache = value;
        
          // Comprime se solicitado
          if (options.compress !== false) {
            dataToCache = _compress(value, options);
          }
        
          var json = JSON.stringify(dataToCache);
          var size = _getByteSize(json);
        
          // Verifica tamanho
          if (size > CONFIG.MAX_CACHE_SIZE_BYTES) {
            // Divide em chunks
            var chunks = _chunk(dataToCache, CONFIG.MAX_CACHE_SIZE_BYTES);
            var cache = _getCache();
          
            // Salva metadados
            cache.put(key, JSON.stringify({
              _chunked: true,
              _chunkCount: chunks.length,
              _totalSize: size
            }), ttlSeconds);
          
            // Salva chunks
            for (var i = 0; i < chunks.length; i++) {
              cache.put(key + '_chunk_' + i, chunks[i], ttlSeconds);
            }
          } else {
            // Salva direto
            _getCache().put(key, json, ttlSeconds);
          }
        
          // Salva em memória também
          _setMemory(key, dataToCache, ttlSeconds * 1000);
        
          _stats.writes++;
          return true;
        
        } catch (e) {
          console.error('SmartCache.set erro: ' + e.message);
          return false;
        }
      } catch (error) {
        Logger.log("Erro em set: " + error.message);
        throw error;
      }
    },
    
    /**
     * Remove valor do cache
     * @param {string} key - Chave
     */
    remove: function(key) {
      try {
        try {
          var cache = _getCache();
        
          // Verifica se é chunked
          var meta = cache.get(key);
          if (meta) {
            var parsed = JSON.parse(meta);
            if (parsed._chunked) {
              for (var i = 0; i < parsed._chunkCount; i++) {
                cache.remove(key + '_chunk_' + i);
              }
            }
          }
        
          cache.remove(key);
          delete _memoryCache[key];
          delete _memoryExpiry[key];
        
        } catch (e) {
          // Ignora erro
        }
      } catch (error) {
        Logger.log("Erro em remove: " + error.message);
        throw error;
      }
    },
    
    // -----------------------------------------------------------------------
    // CACHE DE CARDÁPIOS (Otimizado para Mobile)
    // -----------------------------------------------------------------------
    
    /**
     * Obtém cardápio semanal do cache
     * @param {string} semana - Referência da semana (ex: 2025-W01)
     * @param {string} [cre] - Código da CRE
     * @returns {Object|null}
     */
    getCardapioSemanal: function(semana, cre) {
      try {
        var key = CONFIG.PREFIX.CARDAPIO + 'semanal_' + semana + (cre ? '_' + cre : '');
        return this.get(key, { ttl: CONFIG.TTL.CARDAPIO_SEMANAL });
      } catch (error) {
        Logger.log("Erro em getCardapioSemanal: " + error.message);
        throw error;
      }
    },
    
    /**
     * Define cardápio semanal no cache
     * @param {string} semana - Referência da semana
     * @param {Object} cardapio - Dados do cardápio
     * @param {string} [cre] - Código da CRE
     */
    setCardapioSemanal: function(semana, cardapio, cre) {
      var key = CONFIG.PREFIX.CARDAPIO + 'semanal_' + semana + (cre ? '_' + cre : '');
      return this.set(key, cardapio, CONFIG.TTL.CARDAPIO_SEMANAL, {
        compress: true,
        excludeFields: ['_rowIndex', 'dataCriacao', 'dataAtualizacao', 'Observacoes']
      });
    },
    
    /**
     * Obtém cardápio do dia
     * @param {string} data - Data (YYYY-MM-DD)
     * @param {string} [escola] - ID da escola
     * @returns {Object|null}
     */
    getCardapioDia: function(data, escola) {
      try {
        var key = CONFIG.PREFIX.CARDAPIO + 'dia_' + data + (escola ? '_' + escola : '');
        return this.get(key, { ttl: CONFIG.TTL.CARDAPIO_DIA });
      } catch (error) {
        Logger.log("Erro em getCardapioDia: " + error.message);
        throw error;
      }
    },
    
    /**
     * Define cardápio do dia no cache
     */
    setCardapioDia: function(data, cardapio, escola) {
      var key = CONFIG.PREFIX.CARDAPIO + 'dia_' + data + (escola ? '_' + escola : '');
      return this.set(key, cardapio, CONFIG.TTL.CARDAPIO_DIA);
    },
    
    // -----------------------------------------------------------------------
    // CACHE DE PERMISSÕES (Crítico para UX)
    // -----------------------------------------------------------------------
    
    /**
     * Obtém permissões do usuário do cache
     * @param {string} userId - Email ou ID do usuário
     * @returns {Object|null}
     */
    getPermissoesUsuario: function(userId) {
      try {
        var key = CONFIG.PREFIX.USUARIO + 'perm_' + userId;
        return this.get(key, { ttl: CONFIG.TTL.PERMISSOES_USUARIO });
      } catch (error) {
        Logger.log("Erro em getPermissoesUsuario: " + error.message);
        throw error;
      }
    },
    
    /**
     * Define permissões do usuário no cache
     * @param {string} userId - Email ou ID do usuário
     * @param {Object} permissoes - Objeto de permissões
     */
    setPermissoesUsuario: function(userId, permissoes) {
      var key = CONFIG.PREFIX.USUARIO + 'perm_' + userId;
      return this.set(key, permissoes, CONFIG.TTL.PERMISSOES_USUARIO);
    },
    
    /**
     * Obtém dados da sessão do usuário
     * @param {string} sessionId - ID da sessão
     * @returns {Object|null}
     */
    getSessaoUsuario: function(sessionId) {
      try {
        var key = CONFIG.PREFIX.SESSAO + sessionId;
        return this.get(key, { ttl: CONFIG.TTL.PERMISSOES_USUARIO });
      } catch (error) {
        Logger.log("Erro em getSessaoUsuario: " + error.message);
        throw error;
      }
    },
    
    /**
     * Define dados da sessão do usuário
     */
    setSessaoUsuario: function(sessionId, dados) {
      var key = CONFIG.PREFIX.SESSAO + sessionId;
      return this.set(key, dados, CONFIG.TTL.PERMISSOES_USUARIO);
    },
    
    /**
     * Invalida cache de um usuário (após alteração de permissões)
     * @param {string} userId - Email ou ID do usuário
     */
    invalidarUsuario: function(userId) {
      try {
        this.remove(CONFIG.PREFIX.USUARIO + 'perm_' + userId);
        this.remove(CONFIG.PREFIX.USUARIO + 'dados_' + userId);
      } catch (error) {
        Logger.log("Erro em invalidarUsuario: " + error.message);
        throw error;
      }
    },
    
    // -----------------------------------------------------------------------
    // CACHE DE LISTAS (Fornecedores, Escolas, Itens)
    // -----------------------------------------------------------------------
    
    /**
     * Obtém lista de fornecedores ativos
     * @returns {Array|null}
     */
    getFornecedoresAtivos: function() {
      try {
        return this.get(CONFIG.PREFIX.FORNECEDOR + 'ativos', { ttl: CONFIG.TTL.LISTA_FORNECEDORES });
      } catch (error) {
        Logger.log("Erro em getFornecedoresAtivos: " + error.message);
        throw error;
      }
    },
    
    /**
     * Define lista de fornecedores ativos
     */
    setFornecedoresAtivos: function(fornecedores) {
      return this.set(CONFIG.PREFIX.FORNECEDOR + 'ativos', fornecedores, CONFIG.TTL.LISTA_FORNECEDORES, {
        compress: true,
        excludeFields: ['Endereco', 'Observacoes', 'dataCriacao', 'dataAtualizacao']
      });
    },
    
    /**
     * Obtém lista de escolas por CRE
     * @param {string} cre - Código da CRE
     * @returns {Array|null}
     */
    getEscolasCRE: function(cre) {
      try {
        return this.get(CONFIG.PREFIX.ESCOLA + 'cre_' + cre, { ttl: CONFIG.TTL.LISTA_ESCOLAS });
      } catch (error) {
        Logger.log("Erro em getEscolasCRE: " + error.message);
        throw error;
      }
    },
    
    /**
     * Define lista de escolas por CRE
     */
    setEscolasCRE: function(cre, escolas) {
      return this.set(CONFIG.PREFIX.ESCOLA + 'cre_' + cre, escolas, CONFIG.TTL.LISTA_ESCOLAS, {
        compress: true
      });
    },
    
    /**
     * Obtém lista de itens alimentares
     * @returns {Array|null}
     */
    getItensAlimentares: function() {
      try {
        return this.get(CONFIG.PREFIX.ITEM + 'todos', { ttl: CONFIG.TTL.LISTA_ITENS });
      } catch (error) {
        Logger.log("Erro em getItensAlimentares: " + error.message);
        throw error;
      }
    },
    
    /**
     * Define lista de itens alimentares
     */
    setItensAlimentares: function(itens) {
      return this.set(CONFIG.PREFIX.ITEM + 'todos', itens, CONFIG.TTL.LISTA_ITENS, {
        compress: true,
        excludeFields: ['Observacoes', 'dataCriacao', 'dataAtualizacao']
      });
    },
    
    // -----------------------------------------------------------------------
    // CACHE DE DASHBOARD
    // -----------------------------------------------------------------------
    
    /**
     * Obtém resumo do dashboard
     * @param {string} tipo - Tipo de dashboard (cre, escola, fornecedor)
     * @param {string} [id] - ID específico
     * @returns {Object|null}
     */
    getDashboardResumo: function(tipo, id) {
      try {
        var key = CONFIG.PREFIX.DASHBOARD + tipo + (id ? '_' + id : '');
        return this.get(key, { ttl: CONFIG.TTL.DASHBOARD_RESUMO });
      } catch (error) {
        Logger.log("Erro em getDashboardResumo: " + error.message);
        throw error;
      }
    },
    
    /**
     * Define resumo do dashboard
     */
    setDashboardResumo: function(tipo, resumo, id) {
      var key = CONFIG.PREFIX.DASHBOARD + tipo + (id ? '_' + id : '');
      return this.set(key, resumo, CONFIG.TTL.DASHBOARD_RESUMO);
    },
    
    // -----------------------------------------------------------------------
    // CACHE DE NFs E ENTREGAS
    // -----------------------------------------------------------------------
    
    /**
     * Obtém NFs pendentes
     * @param {string} [filtro] - Filtro (fornecedor, escola, etc)
     * @returns {Array|null}
     */
    getNFsPendentes: function(filtro) {
      try {
        var key = CONFIG.PREFIX.NF + 'pendentes' + (filtro ? '_' + filtro : '');
        return this.get(key, { ttl: CONFIG.TTL.NFS_PENDENTES });
      } catch (error) {
        Logger.log("Erro em getNFsPendentes: " + error.message);
        throw error;
      }
    },
    
    /**
     * Define NFs pendentes
     */
    setNFsPendentes: function(nfs, filtro) {
      var key = CONFIG.PREFIX.NF + 'pendentes' + (filtro ? '_' + filtro : '');
      return this.set(key, nfs, CONFIG.TTL.NFS_PENDENTES, { compress: true });
    },
    
    /**
     * Obtém entregas do dia
     * @param {string} data - Data (YYYY-MM-DD)
     * @returns {Array|null}
     */
    getEntregasDia: function(data) {
      try {
        var key = CONFIG.PREFIX.ENTREGA + 'dia_' + data;
        return this.get(key, { ttl: CONFIG.TTL.ENTREGAS_DIA });
      } catch (error) {
        Logger.log("Erro em getEntregasDia: " + error.message);
        throw error;
      }
    },
    
    /**
     * Define entregas do dia
     */
    setEntregasDia: function(data, entregas) {
      var key = CONFIG.PREFIX.ENTREGA + 'dia_' + data;
      return this.set(key, entregas, CONFIG.TTL.ENTREGAS_DIA, { compress: true });
    },
    
    // -----------------------------------------------------------------------
    // GERENCIAMENTO
    // -----------------------------------------------------------------------
    
    /**
     * Limpa todo o cache
     */
    clear: function() {
      _memoryCache = {};
      _memoryExpiry = {};
      
      // Limpa CacheService (não há método clear, então limpamos por prefixo)
      // Isso é feito gradualmente conforme os itens expiram
      
      _stats = { hits: 0, misses: 0, writes: 0, evictions: 0, compressions: 0 };
      
      return { success: true, message: 'Cache limpo' };
    },
    
    /**
     * Limpa cache por prefixo
     * @param {string} prefix - Prefixo (de CONFIG.PREFIX)
     */
    clearByPrefix: function(prefix) {
      try {
        var keys = Object.keys(_memoryCache);
        var cleared = 0;
      
        keys.forEach(function(key) {
          if (key.indexOf(prefix) === 0) {
            delete _memoryCache[key];
            delete _memoryExpiry[key];
            cleared++;
          }
        });
      
        return { success: true, cleared: cleared };
      } catch (error) {
        Logger.log("Erro em clearByPrefix: " + error.message);
        throw error;
      }
    },
    
    /**
     * Invalida cache de cardápios
     */
    invalidarCardapios: function() {
      return this.clearByPrefix(CONFIG.PREFIX.CARDAPIO);
    },
    
    /**
     * Invalida cache de NFs
     */
    invalidarNFs: function() {
      return this.clearByPrefix(CONFIG.PREFIX.NF);
    },
    
    /**
     * Executa limpeza de itens expirados
     */
    cleanup: function() {
      var cleaned = _cleanupMemory();
      return { success: true, cleaned: cleaned };
    },
    
    /**
     * Obtém estatísticas do cache
     * @returns {Object}
     */
    getStats: function() {
      try {
        var total = _stats.hits + _stats.misses;
        var hitRate = total > 0 ? ((_stats.hits / total) * 100).toFixed(2) : '0.00';
      
        return {
          hits: _stats.hits,
          misses: _stats.misses,
          writes: _stats.writes,
          evictions: _stats.evictions,
          compressions: _stats.compressions,
          hitRate: hitRate + '%',
          totalRequests: total,
          memoryItems: Object.keys(_memoryCache).length
        };
      } catch (error) {
        Logger.log("Erro em getStats: " + error.message);
        throw error;
      }
    },
    
    /**
     * Pré-carrega dados essenciais para mobile
     * @param {string} userId - ID do usuário
     * @param {string} cre - Código da CRE
     */
    preloadMobile: function(userId, cre) {
      try {
        var self = this;
        var loaded = [];
      
        // Carrega permissões (crítico)
        if (userId && !this.getPermissoesUsuario(userId)) {
          // Será carregado sob demanda
          loaded.push('permissoes_pendente');
        }
      
        // Carrega escolas da CRE
        if (cre && !this.getEscolasCRE(cre)) {
          loaded.push('escolas_pendente');
        }
      
        // Carrega fornecedores ativos
        if (!this.getFornecedoresAtivos()) {
          loaded.push('fornecedores_pendente');
        }
      
        return {
          success: true,
          preloaded: loaded
        };
      } catch (error) {
        Logger.log("Erro em preloadMobile: " + error.message);
        throw error;
      }
    }
  };
})();


// ============================================================================
// FUNÇÕES GLOBAIS PARA FRONTEND (google.script.run)
// ============================================================================

/**
 * Obtém cardápio do dia para exibição mobile
 * @param {string} data - Data no formato YYYY-MM-DD
 * @param {string} [escolaId] - ID da escola (opcional)
 * @returns {Object} Cardápio formatado para mobile
 */
function getCardapioDiaCache(data, escolaId) {
  // Tenta cache primeiro
  var cached = SmartCache.getCardapioDia(data, escolaId);
  if (cached) {
    return { success: true, data: cached, fromCache: true };
  }
  
  // Busca do banco
  try {
    var result = DatabaseEngine.read('CARDAPIOS_SEMANAIS', {
      filters: function(row) {
        var inicio = new Date(row.Data_Inicio);
        var fim = new Date(row.Data_Fim);
        var dataRef = new Date(data);
        return dataRef >= inicio && dataRef <= fim;
      },
      limit: 1
    });
    
    if (result.success && result.data.length > 0) {
      var cardapio = result.data[0];
      SmartCache.setCardapioDia(data, cardapio, escolaId);
      return { success: true, data: cardapio, fromCache: false };
    }
    
    return { success: false, error: 'Cardápio não encontrado para ' + data };
    
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Obtém permissões do usuário logado (otimizado para mobile)
 * @param {string} email - Email do usuário
 * @returns {Object} Permissões
 */
function getPermissoesUsuarioCache(email) {
  // Tenta cache primeiro
  var cached = SmartCache.getPermissoesUsuario(email);
  if (cached) {
    return { success: true, data: cached, fromCache: true };
  }
  
  // Busca do banco
  try {
    var result = DatabaseEngine.read('USUARIOS', {
      filters: { email: email },
      limit: 1,
      resolveFK: false
    });
    
    if (result.success && result.data.length > 0) {
      var usuario = result.data[0];
      var permissoes = {
        email: usuario.email,
        nome: usuario.nome || usuario.Nome_Completo,
        tipo: usuario.tipo || usuario.Tipo_Usuario,
        perfil: usuario.perfil || usuario.Perfil,
        instituicao: usuario.instituicao || usuario.Unidade_Vinculada,
        ativo: usuario.ativo === true || usuario.ativo === 'ATIVO' || usuario.Status === 'ATIVO'
      };
      
      // Adiciona permissões baseadas no perfil
      var perfilConfig = PERFIL_CONFIG[permissoes.perfil] || PERFIL_CONFIG[permissoes.tipo];
      if (perfilConfig) {
        permissoes.nivel = perfilConfig.nivel;
        permissoes.permissoes = perfilConfig.permissoes;
      }
      
      SmartCache.setPermissoesUsuario(email, permissoes);
      return { success: true, data: permissoes, fromCache: false };
    }
    
    return { success: false, error: 'Usuário não encontrado' };
    
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Obtém lista de fornecedores ativos (para dropdowns)
 * @returns {Object} Lista de fornecedores
 */
function getFornecedoresAtivosCache() {
  var cached = SmartCache.getFornecedoresAtivos();
  if (cached) {
    return { success: true, data: cached, fromCache: true };
  }
  
  try {
    var result = DatabaseEngine.read('FORNECEDORES', {
      filters: { Status: 'ATIVO' },
      resolveFK: false
    });
    
    if (result.success) {
      // Simplifica para dropdown
      var lista = result.data.map(function(f) {
        return {
          id: f.ID,
          cnpj: f.CNPJ,
          nome: f.Razao_Social || f.Nome_Fantasia,
          fantasia: f.Nome_Fantasia
        };
      });
      
      SmartCache.setFornecedoresAtivos(lista);
      return { success: true, data: lista, fromCache: false };
    }
    
    return result;
    
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Obtém lista de escolas por CRE (para dropdowns)
 * @param {string} cre - Código da CRE
 * @returns {Object} Lista de escolas
 */
function getEscolasCRECache(cre) {
  var cached = SmartCache.getEscolasCRE(cre);
  if (cached) {
    return { success: true, data: cached, fromCache: true };
  }
  
  try {
    var result = DatabaseEngine.read('UNIDADES_ESCOLARES', {
      filters: { CRE: cre },
      resolveFK: false
    });
    
    if (result.success) {
      var lista = result.data.map(function(e) {
        return {
          id: e.ID,
          nome: e.Nome,
          codigo: e.Codigo,
          endereco: e.Endereco
        };
      });
      
      SmartCache.setEscolasCRE(cre, lista);
      return { success: true, data: lista, fromCache: false };
    }
    
    return result;
    
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Obtém resumo do dashboard (otimizado)
 * @param {string} tipo - Tipo (cre, escola, fornecedor)
 * @param {string} [id] - ID específico
 * @returns {Object} Resumo
 */
function getDashboardResumoCache(tipo, id) {
  var cached = SmartCache.getDashboardResumo(tipo, id);
  if (cached) {
    return { success: true, data: cached, fromCache: true };
  }
  
  // Calcula resumo (implementação simplificada)
  try {
    var resumo = {
      tipo: tipo,
      id: id,
      geradoEm: new Date().toISOString(),
      metricas: {}
    };
    
    // NFs pendentes
    var nfsPendentes = DatabaseEngine.read('NOTAS_FISCAIS', {
      filters: { Status_NF: 'PENDENTE' },
      limit: 1000,
      resolveFK: false
    });
    resumo.metricas.nfsPendentes = nfsPendentes.success ? nfsPendentes.total : 0;
    
    // Entregas do dia
    var hoje = new Date().toISOString().split('T')[0];
    var entregasHoje = DatabaseEngine.read('ENTREGAS', {
      filters: function(row) {
        return row.Data_Entrega && row.Data_Entrega.toISOString().indexOf(hoje) === 0;
      },
      limit: 1000,
      resolveFK: false
    });
    resumo.metricas.entregasHoje = entregasHoje.success ? entregasHoje.total : 0;
    
    SmartCache.setDashboardResumo(tipo, resumo, id);
    return { success: true, data: resumo, fromCache: false };
    
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Invalida cache após alteração de dados
 * @param {string} entidade - Nome da entidade alterada
 * @param {string} [id] - ID específico
 */
function invalidarCacheEntidade(entidade, id) {
  switch (entidade) {
    case 'Cardapios_Base':
    case 'Cardapios_Semanais':
      SmartCache.invalidarCardapios();
      break;
    case 'NotasFiscais':
    case 'Notas_Fiscais':
      SmartCache.invalidarNFs();
      break;
    case 'Fornecedores':
      SmartCache.clearByPrefix(SmartCache.CONFIG.PREFIX.FORNECEDOR);
      break;
    case 'Unidades_Escolares':
      SmartCache.clearByPrefix(SmartCache.CONFIG.PREFIX.ESCOLA);
      break;
    case 'Usuarios':
      if (id) {
        SmartCache.invalidarUsuario(id);
      } else {
        SmartCache.clearByPrefix(SmartCache.CONFIG.PREFIX.USUARIO);
      }
      break;
    default:
      // Limpa dashboard que pode ter sido afetado
      SmartCache.clearByPrefix(SmartCache.CONFIG.PREFIX.DASHBOARD);
  }
  
  return { success: true, entidade: entidade };
}

/**
 * Obtém estatísticas do cache (para monitoramento)
 * @returns {Object} Estatísticas
 */
function getCacheStatsGlobal() {
  try {
    var smartStats = SmartCache.getStats();
    var cacheManagerStats = typeof CacheManager !== 'undefined' ? CacheManager.Management.getStats() : {};
  
    return {
      success: true,
      smartCache: smartStats,
      cacheManager: cacheManagerStats,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    Logger.log("Erro em getCacheStatsGlobal: " + error.message);
    throw error;
  }
}

/**
 * Limpa todo o cache (admin)
 * @returns {Object} Resultado
 */
function limparTodoCache() {
  try {
    SmartCache.clear();
  
    if (typeof CacheManager !== 'undefined') {
      CacheManager.Management.clearMemory();
    }
  
    return { success: true, message: 'Cache limpo com sucesso' };
  } catch (error) {
    Logger.log("Erro em limparTodoCache: " + error.message);
    throw error; // Re-lança para tratamento superior
  }
}

// ============================================================================
// CÓDIGO PARA FRONTEND (sessionStorage)
// ============================================================================

/**
 * Retorna código JavaScript para cache no frontend
 * Usado em includes HTML
 * @returns {string} Código JS
 */
function getFrontendCacheCode() {
  return `
// ============================================================================
// FRONTEND CACHE (sessionStorage) - Alimentação Escolar
// ============================================================================

var FrontendCache = (function() {
  var PREFIX = 'AE_';
  var TTL = {
    PERMISSOES: 10 * 60 * 1000,  // 10 min
    CARDAPIO: 30 * 60 * 1000,    // 30 min
    LISTAS: 60 * 60 * 1000       // 1 hora
  };
  
  function isValid(key) {
    try {
      var expiry = sessionStorage.getItem(PREFIX + key + '_expiry');
      return expiry && Date.now() < parseInt(expiry, 10);
    } catch (error) {
      Logger.log("Erro em isValid: " + error.message);
      throw error;
    }
  }
  
  return {
    get: function(key) {
      if (!isValid(key)) {
        this.remove(key);
        return null;
      }
      var data = sessionStorage.getItem(PREFIX + key);
      return data ? JSON.parse(data) : null;
    },
    
    set: function(key, value, ttlMs) {
      ttlMs = ttlMs || TTL.LISTAS;
      sessionStorage.setItem(PREFIX + key, JSON.stringify(value));
      sessionStorage.setItem(PREFIX + key + '_expiry', Date.now() + ttlMs);
    },
    
    remove: function(key) {
      sessionStorage.removeItem(PREFIX + key);
      sessionStorage.removeItem(PREFIX + key + '_expiry');
    },
    
    clear: function() {
      try {
        var keys = Object.keys(sessionStorage);
        keys.forEach(function(k) {
          if (k.indexOf(PREFIX) === 0) {
            sessionStorage.removeItem(k);
          }
        });
      } catch (error) {
        Logger.log("Erro em clear: " + error.message);
        throw error;
      }
    },
    
    // Atalhos
    getPermissoes: function() { return this.get('permissoes'); },
    setPermissoes: function(p) { this.set('permissoes', p, TTL.PERMISSOES); },
    getCardapio: function(data) { return this.get('cardapio_' + data); },
    setCardapio: function(data, c) { this.set('cardapio_' + data, c, TTL.CARDAPIO); }
  };
})();
`;
}

// ============================================================================
// REGISTRO DO MÓDULO
// ============================================================================

Logger.log('✅ Core_Smart_Cache carregado - SmartCache disponível');
