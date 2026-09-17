/**
 * @fileoverview Sistema de Propriedades e Ambiente - Alimentação Escolar CRE-PP
 * @version 1.0.0
 * 
 * Intervenção 2/38: PropertiesManager centralizado conforme Prompt 2
 * 
 * Gerencia:
 * - Chaves de API (Gemini, Maps)
 * - IDs de pastas do Drive (backups de NFs, relatórios de cardápios)
 * - Configurações de ambiente (Produção/Homologação)
 * - MAINTENANCE_MODE e versionamento de schema
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-25
 */

'use strict';

// ============================================================================
// PROPERTIES MANAGER - Gerenciador Centralizado de Propriedades
// ============================================================================

var PropertiesManager = (function() {
  
  // =========================================================================
  // CONSTANTES E CONFIGURAÇÃO
  // =========================================================================
  
  /**
   * Chaves padronizadas para propriedades do sistema
   * Organizadas por domínio para fácil manutenção
   */
  var PROPERTY_KEYS = {
    // -----------------------------------------------------------------------
    // SISTEMA E AMBIENTE
    // -----------------------------------------------------------------------
    ENVIRONMENT: 'SYSTEM_ENVIRONMENT',           // production, staging, development
    MAINTENANCE_MODE: 'MAINTENANCE_MODE',         // true/false
    MAINTENANCE_MESSAGE: 'MAINTENANCE_MESSAGE',   // Mensagem para usuários
    SCHEMA_VERSION: 'SCHEMA_VERSION',             // Versão do schema atual
    APP_VERSION: 'APP_VERSION',                   // Versão da aplicação
    LAST_MIGRATION: 'LAST_MIGRATION_DATE',        // Data da última migração
    
    // -----------------------------------------------------------------------
    // APIs EXTERNAS
    // -----------------------------------------------------------------------
    GEMINI_API_KEY: 'GEMINI_API_KEY',
    GEMINI_TEMPERATURE: 'GEMINI_TEMPERATURE',
    GEMINI_MODEL: 'GEMINI_MODEL',
    MAPS_API_KEY: 'MAPS_API_KEY',
    
    // -----------------------------------------------------------------------
    // GOOGLE DRIVE - Pastas
    // -----------------------------------------------------------------------
    DRIVE_ROOT_FOLDER: 'DRIVE_FOLDER_ID',
    DRIVE_BACKUP_FOLDER: 'DRIVE_BACKUP_FOLDER_ID',
    DRIVE_NF_FOLDER: 'DRIVE_NF_FOLDER_ID',           // PDFs de Notas Fiscais
    DRIVE_CARDAPIOS_FOLDER: 'DRIVE_CARDAPIOS_FOLDER_ID', // Relatórios de cardápios
    DRIVE_RELATORIOS_FOLDER: 'DRIVE_RELATORIOS_FOLDER_ID',
    DRIVE_EXPORTS_FOLDER: 'DRIVE_EXPORTS_FOLDER_ID',
    
    // -----------------------------------------------------------------------
    // PLANILHA
    // -----------------------------------------------------------------------
    SPREADSHEET_ID: 'SPREADSHEET_ID',
    SPREADSHEET_NAME: 'SPREADSHEET_NAME',
    
    // -----------------------------------------------------------------------
    // CONFIGURAÇÕES DE NEGÓCIO
    // -----------------------------------------------------------------------
    CRE_CODIGO: 'CRE_CODIGO',                     // Ex: CRE-PP
    CRE_NOME: 'CRE_NOME',                         // Ex: Plano Piloto
    FISCAL_CONTRATO: 'FISCAL_CONTRATO_DESIGNADO',
    UNIAE_ATRIBUICOES: 'UNIAE_ATRIBUICOES_FORMALIZADAS',
    COMISSAO_MEMBROS: 'COMISSAO_MEMBROS_JSON',
    TEXTO_PADRAO_ATESTO: 'TEXTO_PADRAO_ATESTO',
    
    // -----------------------------------------------------------------------
    // PROCESSAMENTO E LIMITES
    // -----------------------------------------------------------------------
    PROCESS_PERIOD: 'PROCESS_PERIOD',             // trimestre, semestre, ano
    PROCESS_MAX_RECORDS: 'PROCESS_MAX_RECORDS',
    BATCH_SIZE: 'PERF_BATCH_SIZE',
    CACHE_TTL: 'PERF_CACHE_TTL_SECONDS',
    
    // -----------------------------------------------------------------------
    // ESTATÍSTICAS E MÉTRICAS
    // -----------------------------------------------------------------------
    GEMINI_STATS: 'GEMINI_STATS',
    LAST_BACKUP_DATE: 'LAST_BACKUP_DATE',
    LAST_SYNC_DATE: 'LAST_SYNC_DATE'
  };
  
  /**
   * Valores padrão para propriedades
   */
  var DEFAULTS = {
    SYSTEM_ENVIRONMENT: 'production',
    MAINTENANCE_MODE: 'false',
    MAINTENANCE_MESSAGE: 'Sistema em manutenção. Tente novamente em alguns minutos.',
    SCHEMA_VERSION: '6.0.0',
    APP_VERSION: '6.0.0',
    GEMINI_TEMPERATURE: '0.7',
    GEMINI_MODEL: 'gemini-1.5-flash',
    PROCESS_PERIOD: 'trimestre',
    PROCESS_MAX_RECORDS: '200',
    PERF_BATCH_SIZE: '100',
    PERF_CACHE_TTL_SECONDS: '600',
    CRE_CODIGO: 'CRE-PP',
    CRE_NOME: 'Plano Piloto'
  };
  
  // =========================================================================
  // CACHE INTERNO
  // =========================================================================
  
  var _cache = {};
  var _cacheExpiry = {};
  var CACHE_TTL_MS = 60000; // 1 minuto
  
  // =========================================================================
  // FUNÇÕES PRIVADAS
  // =========================================================================
  
  /**
   * Obtém instância do PropertiesService
   * @private
   */
  function _getProps() {
    return PropertiesService.getScriptProperties();
  }
  
  /**
   * Verifica se cache está válido
   * @private
   */
  function _isCacheValid(key) {
    return _cache[key] !== undefined && 
           _cacheExpiry[key] && 
           new Date().getTime() < _cacheExpiry[key];
  }
  
  /**
   * Define valor no cache
   * @private
   */
  function _setCache(key, value) {
    _cache[key] = value;
    _cacheExpiry[key] = new Date().getTime() + CACHE_TTL_MS;
  }
  
  /**
   * Limpa cache de uma chave
   * @private
   */
  function _clearCache(key) {
    try {
      delete _cache[key];
      delete _cacheExpiry[key];
    } catch (error) {
      Logger.log("Erro em _clearCache: " + error.message);
      throw error;
    }
  }
  
  // =========================================================================
  // API PÚBLICA
  // =========================================================================
  
  return {
    
    /**
     * Expõe as chaves de propriedades
     */
    KEYS: PROPERTY_KEYS,
    
    /**
     * Expõe os valores padrão
     */
    DEFAULTS: DEFAULTS,
    
    // -----------------------------------------------------------------------
    // OPERAÇÕES BÁSICAS
    // -----------------------------------------------------------------------
    
    /**
     * Obtém uma propriedade com cache e fallback
     * @param {string} key - Chave da propriedade
     * @param {*} [defaultValue] - Valor padrão se não existir
     * @returns {string|null}
     */
    get: function(key, defaultValue) {
      try {
        // Verificar cache primeiro
        if (_isCacheValid(key)) {
          return _cache[key];
        }
        
        var props = _getProps();
        var value = props.getProperty(key);
        
        // Se não existe, usar default
        if (value === null || value === undefined) {
          value = defaultValue !== undefined ? defaultValue : (DEFAULTS[key] || null);
        }
        
        // Cachear resultado
        if (value !== null) {
          _setCache(key, value);
        }
        
        return value;
      } catch (e) {
        console.error('PropertiesManager.get erro para ' + key + ': ' + e.message);
        return defaultValue !== undefined ? defaultValue : (DEFAULTS[key] || null);
      }
    },
    
    /**
     * Define uma propriedade
     * @param {string} key - Chave da propriedade
     * @param {*} value - Valor a definir
     * @returns {boolean} Sucesso
     */
    set: function(key, value) {
      try {
        var props = _getProps();
        var strValue = String(value);
        props.setProperty(key, strValue);
        _setCache(key, strValue);
        return true;
      } catch (e) {
        console.error('PropertiesManager.set erro para ' + key + ': ' + e.message);
        return false;
      }
    },
    
    /**
     * Define múltiplas propriedades de uma vez
     * @param {Object} properties - Objeto com chave/valor
     * @returns {boolean} Sucesso
     */
    setMultiple: function(properties) {
      try {
        var props = _getProps();
        var strProps = {};
        for (var key in properties) {
          strProps[key] = String(properties[key]);
          _setCache(key, strProps[key]);
        }
        props.setProperties(strProps);
        return true;
      } catch (e) {
        console.error('PropertiesManager.setMultiple erro: ' + e.message);
        return false;
      }
    },
    
    /**
     * Remove uma propriedade
     * @param {string} key - Chave da propriedade
     * @returns {boolean} Sucesso
     */
    remove: function(key) {
      try {
        var props = _getProps();
        props.deleteProperty(key);
        _clearCache(key);
        return true;
      } catch (e) {
        console.error('PropertiesManager.remove erro para ' + key + ': ' + e.message);
        return false;
      }
    },
    
    /**
     * Verifica se uma propriedade existe
     * @param {string} key - Chave da propriedade
     * @returns {boolean}
     */
    exists: function(key) {
      try {
        var props = _getProps();
        return props.getProperty(key) !== null;
      } catch (e) {
        return false;
      }
    },
    
    /**
     * Lista todas as propriedades
     * @returns {Object}
     */
    getAll: function() {
      try {
        return _getProps().getProperties();
      } catch (e) {
        console.error('PropertiesManager.getAll erro: ' + e.message);
        return {};
      }
    },
    
    /**
     * Limpa o cache interno
     */
    clearCache: function() {
      _cache = {};
      _cacheExpiry = {};
    },
    
    // -----------------------------------------------------------------------
    // AMBIENTE E MANUTENÇÃO
    // -----------------------------------------------------------------------
    
    /**
     * Obtém o ambiente atual
     * @returns {string} 'production', 'staging', ou 'development'
     */
    getEnvironment: function() {
      return this.get(PROPERTY_KEYS.ENVIRONMENT, 'production');
    },
    
    /**
     * Define o ambiente
     * @param {string} env - 'production', 'staging', ou 'development'
     */
    setEnvironment: function(env) {
      var valid = ['production', 'staging', 'development'];
      if (valid.indexOf(env) === -1) {
        throw new Error('Ambiente inválido. Use: ' + valid.join(', '));
      }
      return this.set(PROPERTY_KEYS.ENVIRONMENT, env);
    },
    
    /**
     * Verifica se está em produção
     * @returns {boolean}
     */
    isProduction: function() {
      return this.getEnvironment() === 'production';
    },
    
    /**
     * Verifica se está em modo de manutenção
     * @returns {boolean}
     */
    isMaintenanceMode: function() {
      return this.get(PROPERTY_KEYS.MAINTENANCE_MODE, 'false') === 'true';
    },
    
    /**
     * Ativa modo de manutenção
     * @param {string} [message] - Mensagem para usuários
     */
    enableMaintenance: function(message) {
      this.set(PROPERTY_KEYS.MAINTENANCE_MODE, 'true');
      if (message) {
        this.set(PROPERTY_KEYS.MAINTENANCE_MESSAGE, message);
      }
      Logger.log('Modo de manutenção ATIVADO');
    },
    
    /**
     * Desativa modo de manutenção
     */
    disableMaintenance: function() {
      this.set(PROPERTY_KEYS.MAINTENANCE_MODE, 'false');
      Logger.log('Modo de manutenção DESATIVADO');
    },
    
    /**
     * Obtém mensagem de manutenção
     * @returns {string}
     */
    getMaintenanceMessage: function() {
      return this.get(PROPERTY_KEYS.MAINTENANCE_MESSAGE, DEFAULTS.MAINTENANCE_MESSAGE);
    },
    
    // -----------------------------------------------------------------------
    // VERSIONAMENTO
    // -----------------------------------------------------------------------
    
    /**
     * Obtém versão do schema
     * @returns {string}
     */
    getSchemaVersion: function() {
      return this.get(PROPERTY_KEYS.SCHEMA_VERSION, DEFAULTS.SCHEMA_VERSION);
    },
    
    /**
     * Define versão do schema
     * @param {string} version
     */
    setSchemaVersion: function(version) {
      this.set(PROPERTY_KEYS.SCHEMA_VERSION, version);
      this.set(PROPERTY_KEYS.LAST_MIGRATION, new Date().toISOString());
    },
    
    /**
     * Obtém versão da aplicação
     * @returns {string}
     */
    getAppVersion: function() {
      return this.get(PROPERTY_KEYS.APP_VERSION, DEFAULTS.APP_VERSION);
    },
    
    // -----------------------------------------------------------------------
    // APIs EXTERNAS
    // -----------------------------------------------------------------------
    
    /**
     * Obtém chave da API Gemini
     * @returns {string|null}
     */
    getGeminiApiKey: function() {
      return this.get(PROPERTY_KEYS.GEMINI_API_KEY);
    },
    
    /**
     * Define chave da API Gemini
     * @param {string} apiKey
     * @returns {boolean}
     */
    setGeminiApiKey: function(apiKey) {
      if (!apiKey || apiKey.length < 10) {
        throw new Error('API Key inválida');
      }
      return this.set(PROPERTY_KEYS.GEMINI_API_KEY, apiKey);
    },
    
    /**
     * Verifica se Gemini está configurado
     * @returns {boolean}
     */
    isGeminiConfigured: function() {
      var key = this.getGeminiApiKey();
      return key && key.length > 10;
    },
    
    /**
     * Obtém temperatura do Gemini
     * @returns {number}
     */
    getGeminiTemperature: function() {
      return parseFloat(this.get(PROPERTY_KEYS.GEMINI_TEMPERATURE, DEFAULTS.GEMINI_TEMPERATURE));
    },
    
    /**
     * Obtém chave da API Maps
     * @returns {string|null}
     */
    getMapsApiKey: function() {
      return this.get(PROPERTY_KEYS.MAPS_API_KEY);
    },
    
    /**
     * Verifica se Maps está configurado
     * @returns {boolean}
     */
    isMapsConfigured: function() {
      var key = this.getMapsApiKey();
      return key && key.length > 10;
    },
    
    // -----------------------------------------------------------------------
    // GOOGLE DRIVE
    // -----------------------------------------------------------------------
    
    /**
     * Obtém ID da pasta raiz no Drive
     * @returns {string|null}
     */
    getDriveRootFolder: function() {
      return this.get(PROPERTY_KEYS.DRIVE_ROOT_FOLDER);
    },
    
    /**
     * Define ID da pasta raiz no Drive
     * @param {string} folderId
     */
    setDriveRootFolder: function(folderId) {
      return this.set(PROPERTY_KEYS.DRIVE_ROOT_FOLDER, folderId);
    },
    
    /**
     * Obtém ID da pasta de backup
     * @returns {string|null}
     */
    getDriveBackupFolder: function() {
      return this.get(PROPERTY_KEYS.DRIVE_BACKUP_FOLDER);
    },
    
    /**
     * Obtém ID da pasta de Notas Fiscais
     * @returns {string|null}
     */
    getDriveNFFolder: function() {
      return this.get(PROPERTY_KEYS.DRIVE_NF_FOLDER);
    },
    
    /**
     * Obtém ID da pasta de Cardápios
     * @returns {string|null}
     */
    getDriveCardapiosFolder: function() {
      return this.get(PROPERTY_KEYS.DRIVE_CARDAPIOS_FOLDER);
    },
    
    /**
     * Obtém ID da pasta de Relatórios
     * @returns {string|null}
     */
    getDriveRelatoriosFolder: function() {
      return this.get(PROPERTY_KEYS.DRIVE_RELATORIOS_FOLDER);
    },
    
    /**
     * Configura todas as pastas do Drive de uma vez
     * @param {Object} folders - { root, backup, nf, cardapios, relatorios, exports }
     */
    setDriveFolders: function(folders) {
      var props = {};
      if (folders.root) props[PROPERTY_KEYS.DRIVE_ROOT_FOLDER] = folders.root;
      if (folders.backup) props[PROPERTY_KEYS.DRIVE_BACKUP_FOLDER] = folders.backup;
      if (folders.nf) props[PROPERTY_KEYS.DRIVE_NF_FOLDER] = folders.nf;
      if (folders.cardapios) props[PROPERTY_KEYS.DRIVE_CARDAPIOS_FOLDER] = folders.cardapios;
      if (folders.relatorios) props[PROPERTY_KEYS.DRIVE_RELATORIOS_FOLDER] = folders.relatorios;
      if (folders.exports) props[PROPERTY_KEYS.DRIVE_EXPORTS_FOLDER] = folders.exports;
      return this.setMultiple(props);
    },
    
    // -----------------------------------------------------------------------
    // PLANILHA
    // -----------------------------------------------------------------------
    
    /**
     * Obtém ID da planilha principal
     * @returns {string|null}
     */
    getSpreadsheetId: function() {
      return this.get(PROPERTY_KEYS.SPREADSHEET_ID);
    },
    
    /**
     * Define ID da planilha principal
     * @param {string} ssId
     */
    setSpreadsheetId: function(ssId) {
      return this.set(PROPERTY_KEYS.SPREADSHEET_ID, ssId);
    },
    
    // -----------------------------------------------------------------------
    // CONFIGURAÇÕES DE NEGÓCIO
    // -----------------------------------------------------------------------
    
    /**
     * Obtém código da CRE
     * @returns {string}
     */
    getCRECodigo: function() {
      return this.get(PROPERTY_KEYS.CRE_CODIGO, DEFAULTS.CRE_CODIGO);
    },
    
    /**
     * Obtém nome da CRE
     * @returns {string}
     */
    getCRENome: function() {
      return this.get(PROPERTY_KEYS.CRE_NOME, DEFAULTS.CRE_NOME);
    },
    
    /**
     * Obtém membros da comissão (JSON)
     * @returns {Array}
     */
    getComissaoMembros: function() {
      var json = this.get(PROPERTY_KEYS.COMISSAO_MEMBROS);
      if (!json) return [];
      try {
        return JSON.parse(json);
      } catch (e) {
        return [];
      }
    },
    
    /**
     * Define membros da comissão
     * @param {Array} membros
     */
    setComissaoMembros: function(membros) {
      return this.set(PROPERTY_KEYS.COMISSAO_MEMBROS, JSON.stringify(membros));
    },
    
    // -----------------------------------------------------------------------
    // LIMITES DE PROCESSAMENTO
    // -----------------------------------------------------------------------
    
    /**
     * Obtém período de processamento
     * @returns {string}
     */
    getProcessPeriod: function() {
      return this.get(PROPERTY_KEYS.PROCESS_PERIOD, DEFAULTS.PROCESS_PERIOD);
    },
    
    /**
     * Obtém máximo de registros por processamento
     * @returns {number}
     */
    getProcessMaxRecords: function() {
      return parseInt(this.get(PROPERTY_KEYS.PROCESS_MAX_RECORDS, DEFAULTS.PROCESS_MAX_RECORDS), 10);
    },
    
    /**
     * Obtém tamanho do batch
     * @returns {number}
     */
    getBatchSize: function() {
      return parseInt(this.get(PROPERTY_KEYS.BATCH_SIZE, DEFAULTS.PERF_BATCH_SIZE), 10);
    },
    
    /**
     * Obtém TTL do cache em segundos
     * @returns {number}
     */
    getCacheTTL: function() {
      return parseInt(this.get(PROPERTY_KEYS.CACHE_TTL, DEFAULTS.PERF_CACHE_TTL_SECONDS), 10);
    },
    
    // -----------------------------------------------------------------------
    // UTILITÁRIOS
    // -----------------------------------------------------------------------
    
    /**
     * Exporta configuração atual (para backup/debug)
     * @param {boolean} [includeSensitive=false] - Incluir dados sensíveis
     * @returns {Object}
     */
    exportConfig: function(includeSensitive) {
      var all = this.getAll();
      var result = {};
      
      var sensitiveKeys = [
        PROPERTY_KEYS.GEMINI_API_KEY,
        PROPERTY_KEYS.MAPS_API_KEY
      ];
      
      for (var key in all) {
        if (!includeSensitive && sensitiveKeys.indexOf(key) !== -1) {
          result[key] = '***REDACTED***';
        } else {
          result[key] = all[key];
        }
      }
      
      return result;
    },
    
    /**
     * Importa configuração (de backup)
     * @param {Object} config
     * @param {boolean} [overwrite=false] - Sobrescrever existentes
     * @returns {Object} Resultado da importação
     */
    importConfig: function(config, overwrite) {
      var imported = 0;
      var skipped = 0;
      var errors = [];
      
      for (var key in config) {
        try {
          if (!overwrite && this.exists(key)) {
            skipped++;
            continue;
          }
          this.set(key, config[key]);
          imported++;
        } catch (e) {
          errors.push({ key: key, error: e.message });
        }
      }
      
      return {
        imported: imported,
        skipped: skipped,
        errors: errors
      };
    },
    
    /**
     * Inicializa propriedades com valores padrão (se não existirem)
     * @returns {Object} Propriedades inicializadas
     */
    initializeDefaults: function() {
      var initialized = [];
      
      for (var key in DEFAULTS) {
        if (!this.exists(key)) {
          this.set(key, DEFAULTS[key]);
          initialized.push(key);
        }
      }
      
      return {
        initialized: initialized,
        count: initialized.length
      };
    },
    
    /**
     * Obtém estatísticas de uso das propriedades
     * @returns {Object}
     */
    getStats: function() {
      var all = this.getAll();
      var keys = Object.keys(all);
      var totalSize = JSON.stringify(all).length;
      var maxSize = 500000; // 500KB limite do GAS
      
      return {
        totalProperties: keys.length,
        totalSizeBytes: totalSize,
        maxSizeBytes: maxSize,
        usagePercent: Math.round((totalSize / maxSize) * 100),
        keys: keys
      };
    }
  };
})();


// ============================================================================
// FUNÇÕES GLOBAIS DE CONVENIÊNCIA
// ============================================================================

/**
 * Verifica se o sistema está em manutenção
 * Pode ser chamada de qualquer lugar do sistema
 * @returns {boolean}
 */
function isSystemInMaintenance() {
  return PropertiesManager.isMaintenanceMode();
}

/**
 * Obtém mensagem de manutenção formatada para UI
 * @returns {Object} { inMaintenance: boolean, message: string }
 */
function getMaintenanceStatus() {
  return {
    inMaintenance: PropertiesManager.isMaintenanceMode(),
    message: PropertiesManager.getMaintenanceMessage()
  };
}

/**
 * Ativa modo de manutenção via menu
 */
function ativarModoManutencao() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.prompt(
    'Modo de Manutenção',
    'Digite a mensagem para os usuários (ou deixe em branco para usar padrão):',
    ui.ButtonSet.OK_CANCEL
  );
  
  if (response.getSelectedButton() === ui.Button.OK) {
    var message = response.getResponseText().trim();
    PropertiesManager.enableMaintenance(message || null);
    ui.alert('Modo de manutenção ATIVADO');
  }
}

/**
 * Desativa modo de manutenção via menu
 */
function desativarModoManutencao() {
  PropertiesManager.disableMaintenance();
  SpreadsheetApp.getUi().alert('Modo de manutenção DESATIVADO');
}

/**
 * Exibe status das propriedades do sistema
 */
function exibirStatusPropriedades() {
  var stats = PropertiesManager.getStats();
  var config = PropertiesManager.exportConfig(false);
  
  var html = '<style>' +
    'body { font-family: Arial, sans-serif; padding: 16px; }' +
    'h2 { color: #2E7D32; }' +
    'table { border-collapse: collapse; width: 100%; margin-top: 16px; }' +
    'th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }' +
    'th { background: #2E7D32; color: white; }' +
    'tr:nth-child(even) { background: #f9f9f9; }' +
    '.stat { background: #E8F5E9; padding: 12px; border-radius: 8px; margin-bottom: 16px; }' +
    '</style>';
  
  html += '<h2>📊 Status das Propriedades do Sistema</h2>';
  
  html += '<div class="stat">';
  html += '<strong>Total de Propriedades:</strong> ' + stats.totalProperties + '<br>';
  html += '<strong>Tamanho Usado:</strong> ' + (stats.totalSizeBytes / 1024).toFixed(2) + ' KB<br>';
  html += '<strong>Limite:</strong> ' + (stats.maxSizeBytes / 1024).toFixed(0) + ' KB<br>';
  html += '<strong>Uso:</strong> ' + stats.usagePercent + '%';
  html += '</div>';
  
  html += '<h3>Configurações Atuais</h3>';
  html += '<table><tr><th>Chave</th><th>Valor</th></tr>';
  
  for (var key in config) {
    var value = config[key];
    if (value && value.length > 50) {
      value = value.substring(0, 47) + '...';
    }
    html += '<tr><td>' + key + '</td><td>' + (value || '<em>vazio</em>') + '</td></tr>';
  }
  
  html += '</table>';
  
  var htmlOutput = HtmlService.createHtmlOutput(html)
    .setWidth(600)
    .setHeight(500)
    .setTitle('Status das Propriedades');
  
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Status das Propriedades');
}

/**
 * Inicializa propriedades padrão do sistema
 */
function inicializarPropriedadesPadrao() {
  var result = PropertiesManager.initializeDefaults();
  
  if (result.count > 0) {
    SpreadsheetApp.getUi().alert(
      'Propriedades Inicializadas',
      'Foram inicializadas ' + result.count + ' propriedades:\n\n' + result.initialized.join('\n'),
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  } else {
    SpreadsheetApp.getUi().alert('Todas as propriedades já estavam configuradas.');
  }
}

/**
 * Configura pastas do Drive via interface
 */
function configurarPastasDrive() {
  var ui = SpreadsheetApp.getUi();
  
  var html = '<style>' +
    'body { font-family: Arial, sans-serif; padding: 16px; }' +
    'h2 { color: #2E7D32; margin-bottom: 16px; }' +
    'label { display: block; margin-top: 12px; font-weight: bold; }' +
    'input { width: 100%; padding: 8px; margin-top: 4px; border: 1px solid #ccc; border-radius: 4px; }' +
    'button { margin-top: 20px; padding: 12px 24px; background: #2E7D32; color: white; border: none; border-radius: 4px; cursor: pointer; }' +
    'button:hover { background: #1B5E20; }' +
    '.help { font-size: 12px; color: #666; margin-top: 4px; }' +
    '</style>';
  
  html += '<h2>🗂️ Configurar Pastas do Drive</h2>';
  html += '<p>Cole os IDs das pastas do Google Drive para cada categoria:</p>';
  
  var folders = [
    { key: 'root', label: 'Pasta Raiz', current: PropertiesManager.getDriveRootFolder() },
    { key: 'backup', label: 'Pasta de Backup', current: PropertiesManager.getDriveBackupFolder() },
    { key: 'nf', label: 'Pasta de Notas Fiscais', current: PropertiesManager.getDriveNFFolder() },
    { key: 'cardapios', label: 'Pasta de Cardápios', current: PropertiesManager.getDriveCardapiosFolder() },
    { key: 'relatorios', label: 'Pasta de Relatórios', current: PropertiesManager.getDriveRelatoriosFolder() }
  ];
  
  html += '<form id="folderForm">';
  folders.forEach(function(f) {
    html += '<label>' + f.label + '</label>';
    html += '<input type="text" name="' + f.key + '" value="' + (f.current || '') + '" placeholder="ID da pasta">';
    html += '<div class="help">Atual: ' + (f.current || 'não configurado') + '</div>';
  });
  
  html += '<button type="button" onclick="salvarPastas()">Salvar Configurações</button>';
  html += '</form>';
  
  html += '<script>' +
    'function salvarPastas() {' +
    '  var form = document.getElementById("folderForm");' +
    '  var data = {};' +
    '  var inputs = form.querySelectorAll("input");' +
    '  inputs.forEach(function(input) {' +
    '    if (input.value.trim()) data[input.name] = input.value.trim();' +
    '  });' +
    '  google.script.run.withSuccessHandler(function() {' +
    '    alert("Pastas configuradas com sucesso!");' +
    '    google.script.host.close();' +
    '  }).withFailureHandler(function(e) {' +
    '    alert("Erro: " + e.message);' +
    '  }).salvarPastasDriveConfig(data);' +
    '}' +
    '</script>';
  
  var htmlOutput = HtmlService.createHtmlOutput(html)
    .setWidth(500)
    .setHeight(450)
    .setTitle('Configurar Pastas do Drive');
  
  ui.showModalDialog(htmlOutput, 'Configurar Pastas do Drive');
}

/**
 * Callback para salvar configuração de pastas
 * @param {Object} folders
 */
function salvarPastasDriveConfig(folders) {
  PropertiesManager.setDriveFolders(folders);
}

/**
 * Alterna ambiente (Produção/Homologação/Desenvolvimento)
 */
function alternarAmbiente() {
  var ui = SpreadsheetApp.getUi();
  var atual = PropertiesManager.getEnvironment();
  
  var response = ui.prompt(
    'Alterar Ambiente',
    'Ambiente atual: ' + atual.toUpperCase() + '\n\n' +
    'Digite o novo ambiente:\n' +
    '• production\n' +
    '• staging\n' +
    '• development',
    ui.ButtonSet.OK_CANCEL
  );
  
  if (response.getSelectedButton() === ui.Button.OK) {
    var novoAmbiente = response.getResponseText().trim().toLowerCase();
    try {
      PropertiesManager.setEnvironment(novoAmbiente);
      ui.alert('Ambiente alterado para: ' + novoAmbiente.toUpperCase());
    } catch (e) {
      ui.alert('Erro: ' + e.message);
    }
  }
}

// ============================================================================
// COMPATIBILIDADE COM CÓDIGO LEGADO
// ============================================================================

/**
 * @deprecated Use PropertiesManager.get() diretamente
 * Mantido para compatibilidade com código existente
 */
function getScriptPropertyLegacy(key, defaultValue) {
  return PropertiesManager.get(key, defaultValue);
}

/**
 * @deprecated Use PropertiesManager.set() diretamente
 * Mantido para compatibilidade com código existente
 */
function setScriptPropertyLegacy(key, value) {
  return PropertiesManager.set(key, value);
}
