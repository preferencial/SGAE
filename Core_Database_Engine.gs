/**
 * @fileoverview Engine de CRUD Dinâmico - Alimentação Escolar CRE-PP
 * @version 1.0.0
 * 
 * Intervenção 3/38: DatabaseEngine conforme Prompt 3
 * 
 * Engine de CRUD genérica que utiliza SCHEMA_MAPPING com:
 * - Resolução automática de Foreign Keys (ex: vincular NF ao Fornecedor via ID)
 * - Auditoria automática em cada transação
 * - Validação baseada no schema
 * - Transações com rollback
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-25
 * @requires Core_Schema_Definition.gs
 * @requires Core_CRUD.gs
 */

'use strict';

// ============================================================================
// DATABASE ENGINE - Motor de Banco de Dados Schema-Driven
// ============================================================================

var DatabaseEngine = (function() {
  
  // =========================================================================
  // MAPEAMENTO DE FOREIGN KEYS
  // =========================================================================
  
  /**
   * Define relacionamentos entre tabelas
   * Formato: { tabela: { campo_fk: { tabela_ref, campo_ref, campo_display } } }
   */
  var FK_MAPPING = {
    // Notas Fiscais -> Fornecedores
    NOTAS_FISCAIS: {
      'CNPJ_Fornecedor': {
        refTable: 'FORNECEDORES',
        refField: 'CNPJ',
        displayField: 'Razao_Social'
      },
      'Processo_Atesto_ID': {
        refTable: 'PROCESSOS_ATESTO',
        refField: 'ID',
        displayField: 'Numero_Processo_SEI'
      }
    },
    
    // Entregas -> Fornecedores, Escolas
    ENTREGAS: {
      'Fornecedor': {
        refTable: 'FORNECEDORES',
        refField: 'Razao_Social',
        displayField: 'Razao_Social'
      },
      'Unidade_Escolar': {
        refTable: 'UNIDADES_ESCOLARES',
        refField: 'Nome',
        displayField: 'Nome'
      }
    },
    
    // Pagamentos -> Notas Fiscais, Empenhos
    PAGAMENTOS: {
      'Nota_Fiscal_ID': {
        refTable: 'NOTAS_FISCAIS',
        refField: 'ID',
        displayField: 'Numero_NF'
      },
      'Empenho_ID': {
        refTable: 'EMPENHOS',
        refField: 'ID',
        displayField: 'Numero_Empenho'
      },
      'Processo_Atesto_ID': {
        refTable: 'PROCESSOS_ATESTO',
        refField: 'ID',
        displayField: 'Numero_Processo_SEI'
      }
    },
    
    // Glosas -> Notas Fiscais
    GLOSAS: {
      'Nota_Fiscal_ID': {
        refTable: 'NOTAS_FISCAIS',
        refField: 'ID',
        displayField: 'Numero_NF'
      }
    },
    
    // Recusas -> Notas Fiscais
    RECUSAS: {
      'Nota_Fiscal_ID': {
        refTable: 'NOTAS_FISCAIS',
        refField: 'ID',
        displayField: 'Numero_NF'
      }
    },
    
    // Cardápios Semanais -> Cardápios Base
    CARDAPIOS_SEMANAIS: {
      'Segunda_Cardapio_ID': { refTable: 'CARDAPIOS_BASE', refField: 'ID', displayField: 'Nome_Cardapio' },
      'Terca_Cardapio_ID': { refTable: 'CARDAPIOS_BASE', refField: 'ID', displayField: 'Nome_Cardapio' },
      'Quarta_Cardapio_ID': { refTable: 'CARDAPIOS_BASE', refField: 'ID', displayField: 'Nome_Cardapio' },
      'Quinta_Cardapio_ID': { refTable: 'CARDAPIOS_BASE', refField: 'ID', displayField: 'Nome_Cardapio' },
      'Sexta_Cardapio_ID': { refTable: 'CARDAPIOS_BASE', refField: 'ID', displayField: 'Nome_Cardapio' }
    },
    
    // Itens Cardápio -> Grupos Nutricionais
    ITENS_CARDAPIO: {
      'Grupo_Nutricional_ID': {
        refTable: 'GRUPOS_NUTRICIONAIS',
        refField: 'ID',
        displayField: 'Nome_Grupo'
      },
      'Fornecedor_Preferencial_ID': {
        refTable: 'FORNECEDORES',
        refField: 'ID',
        displayField: 'Razao_Social'
      }
    },
    
    // Fichas Técnicas -> Itens
    FICHAS_TECNICAS: {
      'Item_ID': {
        refTable: 'ITENS_CARDAPIO',
        refField: 'ID',
        displayField: 'Descricao'
      }
    },
    
    // Certidões -> Fornecedores
    CERTIDOES_FORNECEDORES: {
      'Fornecedor_ID': {
        refTable: 'FORNECEDORES',
        refField: 'ID',
        displayField: 'Razao_Social'
      }
    },
    
    // Contratos -> Fornecedores
    CONTRATOS_EMPENHO: {
      'Fornecedor_ID': {
        refTable: 'FORNECEDORES',
        refField: 'ID',
        displayField: 'Razao_Social'
      }
    },
    
    // Estoque -> Escolas, Itens
    ESTOQUE_ESCOLAR: {
      'Unidade_Escolar_ID': {
        refTable: 'UNIDADES_ESCOLARES',
        refField: 'ID',
        displayField: 'Nome'
      },
      'Item_ID': {
        refTable: 'ITENS_CARDAPIO',
        refField: 'ID',
        displayField: 'Descricao'
      }
    },
    
    // Avaliações -> Cardápios
    AVALIACOES_NUTRICIONISTA: {
      'Cardapio_ID': {
        refTable: 'CARDAPIOS_ESPECIAIS',
        refField: 'ID',
        displayField: 'Nome_Cardapio'
      }
    },
    
    // Preços Histórico -> Itens, Fornecedores
    PRECOS_HISTORICO: {
      'Item_ID': {
        refTable: 'ITENS_CARDAPIO',
        refField: 'ID',
        displayField: 'Descricao'
      },
      'Fornecedor_ID': {
        refTable: 'FORNECEDORES',
        refField: 'ID',
        displayField: 'Razao_Social'
      },
      'Contrato_ID': {
        refTable: 'CONTRATOS_EMPENHO',
        refField: 'ID',
        displayField: 'Numero_Contrato'
      }
    }
  };
  
  // =========================================================================
  // CACHE DE REFERÊNCIAS
  // =========================================================================
  
  var _refCache = {};
  var _refCacheExpiry = {};
  var REF_CACHE_TTL = 300000; // 5 minutos
  
  // =========================================================================
  // FUNÇÕES PRIVADAS
  // =========================================================================
  
  /**
   * Obtém nome canônico da tabela
   * @private
   */
  function _getCanonicalName(tableName) {
    try {
      if (typeof SCHEMA !== 'undefined') {
        return SCHEMA.getCanonicalName(tableName);
      }
      return tableName.toUpperCase().replace(/[^A-Z_]/g, '_');
    } catch (error) {
      Logger.log("Erro em _getCanonicalName: " + error.message);
      throw error;
    }
  }
  
  /**
   * Obtém nome real da aba
   * @private
   */
  function _getSheetName(tableName) {
    if (typeof SCHEMA !== 'undefined') {
      return SCHEMA.getSheetName(tableName);
    }
    return tableName;
  }
  
  /**
   * Obtém colunas da tabela
   * @private
   */
  function _getColumns(tableName) {
    if (typeof SCHEMA !== 'undefined') {
      return SCHEMA.getColumns(tableName);
    }
    return [];
  }
  
  /**
   * Obtém validações da tabela
   * @private
   */
  function _getValidations(tableName) {
    if (typeof SCHEMA !== 'undefined') {
      return SCHEMA.getValidations(tableName);
    }
    return {};
  }
  
  /**
   * Carrega dados de referência para cache
   * @private
   */
  function _loadRefData(tableName) {
    var cacheKey = 'ref_' + tableName;
    var now = new Date().getTime();
    
    if (_refCache[cacheKey] && _refCacheExpiry[cacheKey] > now) {
      return _refCache[cacheKey];
    }
    
    try {
      var sheetName = _getSheetName(tableName);
      var result = CRUDService.read(sheetName, { limit: 5000, cache: false });
      
      if (result.success) {
        _refCache[cacheKey] = result.data;
        _refCacheExpiry[cacheKey] = now + REF_CACHE_TTL;
        return result.data;
      }
    } catch (e) {
      console.error('Erro ao carregar referência ' + tableName + ': ' + e.message);
    }
    
    return [];
  }
  
  /**
   * Resolve uma Foreign Key
   * @private
   */
  function _resolveFK(tableName, fieldName, value) {
    try {
      var canonical = _getCanonicalName(tableName);
      var fkConfig = FK_MAPPING[canonical] && FK_MAPPING[canonical][fieldName];
    
      if (!fkConfig || !value) {
        return { resolved: false, value: value };
      }
    
      var refData = _loadRefData(fkConfig.refTable);
      var found = refData.find(function(row) {
        return String(row[fkConfig.refField]) === String(value);
      });
    
      if (found) {
        return {
          resolved: true,
          value: value,
          display: found[fkConfig.displayField],
          refData: found
        };
      }
    
      return { resolved: false, value: value, error: 'Referência não encontrada' };
    } catch (error) {
      Logger.log("Erro em _resolveFK: " + error.message);
      throw error;
    }
  }
  
  /**
   * Valida Foreign Key existe
   * @private
   */
  function _validateFK(tableName, fieldName, value) {
    if (!value) return { valid: true }; // FK opcional
    
    var result = _resolveFK(tableName, fieldName, value);
    
    if (result.resolved || !FK_MAPPING[_getCanonicalName(tableName)]) {
      return { valid: true, display: result.display };
    }
    
    return { 
      valid: false, 
      error: 'Valor "' + value + '" não encontrado na tabela de referência'
    };
  }
  
  /**
   * Valida dados contra o schema
   * @private
   */
  function _validateData(tableName, data, isUpdate) {
    try {
      var errors = [];
      var canonical = _getCanonicalName(tableName);
      var validations = _getValidations(canonical);
      var columns = _getColumns(canonical);
    
      // Valida campos obrigatórios (apenas em create)
      if (!isUpdate) {
        var requiredFields = ['ID']; // Campos sempre obrigatórios
        requiredFields.forEach(function(field) {
          if (columns.indexOf(field) !== -1 && !data[field] && field !== 'ID') {
            errors.push({ field: field, error: 'Campo obrigatório' });
          }
        });
      }
    
      // Valida valores permitidos
      for (var field in validations) {
        if (data[field] !== undefined && data[field] !== '') {
          var allowedValues = validations[field];
          if (Array.isArray(allowedValues) && allowedValues.indexOf(data[field]) === -1) {
            errors.push({ 
              field: field, 
              error: 'Valor "' + data[field] + '" não permitido. Use: ' + allowedValues.join(', ')
            });
          }
        }
      }
    
      // Valida Foreign Keys
      var fkMapping = FK_MAPPING[canonical] || {};
      for (var fkField in fkMapping) {
        if (data[fkField] !== undefined && data[fkField] !== '') {
          var fkResult = _validateFK(tableName, fkField, data[fkField]);
          if (!fkResult.valid) {
            errors.push({ field: fkField, error: fkResult.error });
          }
        }
      }
    
      return {
        valid: errors.length === 0,
        errors: errors
      };
    } catch (error) {
      Logger.log("Erro em _validateData: " + error.message);
      throw error;
    }
  }
  
  /**
   * Registra auditoria
   * @private
   */
  function _audit(action, tableName, recordId, oldData, newData, userId) {
    try {
      try {
        var auditData = {
          ID: Utilities.getUuid(),
          Data_Hora: new Date(),
          Usuario: userId || Session.getActiveUser().getEmail() || 'sistema',
          Acao: action,
          Tabela: tableName,
          Registro_ID: recordId,
          Dados_Anteriores: oldData ? JSON.stringify(oldData) : '',
          Dados_Novos: newData ? JSON.stringify(newData) : '',
          IP: ''
        };
      
        // Usa CRUD direto para evitar recursão
        var auditSheet = _getSheetName('AUDITORIA_LOG');
        CRUDService.create(auditSheet, auditData, { silent: true });
      
      } catch (e) {
        console.error('Erro ao registrar auditoria: ' + e.message);
      }
    } catch (error) {
      Logger.log("Erro em _audit: " + error.message);
      throw error;
    }
  }
  
  /**
   * Obtém sheet
   * @private
   */
  function _getSheet(tableName) {
    try {
      var sheetName = _getSheetName(tableName);
      var ss = getSS();
      return ss ? ss.getSheetByName(sheetName) : null;
    } catch (error) {
      Logger.log("Erro em _getSheet: " + error.message);
      throw error;
    }
  }
  
  /**
   * Gera próximo ID
   * @private
   */
  function _generateId(tableName) {
    try {
      var sheetName = _getSheetName(tableName);
      var result = CRUDService.read(sheetName, { limit: 1, orderBy: { field: 'ID', direction: 'desc' } });
    
      if (result.success && result.data.length > 0) {
        var lastId = result.data[0].ID;
        if (typeof lastId === 'number') {
          return lastId + 1;
        }
        var numMatch = String(lastId).match(/\d+/);
        if (numMatch) {
          return parseInt(numMatch[0], 10) + 1;
        }
      }
      return 1;
    } catch (error) {
      Logger.log("Erro em _generateId: " + error.message);
      throw error;
    }
  }
  
  // =========================================================================
  // API PÚBLICA
  // =========================================================================
  
  return {
    
    /**
     * Expõe mapeamento de FKs
     */
    FK_MAPPING: FK_MAPPING,
    
    // -----------------------------------------------------------------------
    // OPERAÇÕES CRUD COM SCHEMA
    // -----------------------------------------------------------------------
    
    /**
     * Cria registro com validação de schema e auditoria
     * @param {string} tableName - Nome da tabela (canônico ou real)
     * @param {Object} data - Dados do registro
     * @param {Object} [options] - Opções { skipValidation, skipAudit, userId }
     * @returns {Object} Resultado
     */
    create: function(tableName, data, options) {
      options = options || {};
      var sheetName = _getSheetName(tableName);
      
      try {
        // Gera ID se não fornecido
        if (!data.ID) {
          data.ID = _generateId(tableName);
        }
        
        // Validação
        if (!options.skipValidation) {
          var validation = _validateData(tableName, data, false);
          if (!validation.valid) {
            return {
              success: false,
              error: 'Validação falhou',
              validationErrors: validation.errors
            };
          }
        }
        
        // Adiciona timestamps
        var now = new Date();
        data.dataCriacao = data.dataCriacao || now;
        data.dataAtualizacao = now;
        
        // Executa criação
        var result = CRUDService.create(sheetName, data, options);
        
        // Auditoria
        if (result.success && !options.skipAudit) {
          _audit('CREATE', tableName, data.ID, null, data, options.userId);
        }
        
        return result;
        
      } catch (e) {
        console.error('DatabaseEngine.create erro: ' + e.message);
        return { success: false, error: e.message };
      }
    },
    
    /**
     * Lê registros com resolução de FKs
     * @param {string} tableName - Nome da tabela
     * @param {Object} [options] - Opções { filters, limit, offset, resolveFK, orderBy }
     * @returns {Object} Resultado
     */
    read: function(tableName, options) {
      options = options || {};
      var sheetName = _getSheetName(tableName);
      
      try {
        var result = CRUDService.read(sheetName, options);
        
        // Resolve Foreign Keys se solicitado
        if (result.success && options.resolveFK !== false) {
          var canonical = _getCanonicalName(tableName);
          var fkMapping = FK_MAPPING[canonical] || {};
          
          if (Object.keys(fkMapping).length > 0) {
            result.data = result.data.map(function(record) {
              var enriched = Object.assign({}, record);
              enriched._resolved = {};
              
              for (var fkField in fkMapping) {
                if (record[fkField]) {
                  var resolved = _resolveFK(tableName, fkField, record[fkField]);
                  if (resolved.resolved) {
                    enriched._resolved[fkField] = {
                      display: resolved.display,
                      data: resolved.refData
                    };
                  }
                }
              }
              
              return enriched;
            });
          }
        }
        
        return result;
        
      } catch (e) {
        console.error('DatabaseEngine.read erro: ' + e.message);
        return { success: false, error: e.message };
      }
    },
    
    /**
     * Atualiza registro com validação e auditoria
     * @param {string} tableName - Nome da tabela
     * @param {number|string} id - ID do registro ou rowIndex
     * @param {Object} data - Dados a atualizar
     * @param {Object} [options] - Opções
     * @returns {Object} Resultado
     */
    update: function(tableName, id, data, options) {
      options = options || {};
      var sheetName = _getSheetName(tableName);
      
      try {
        // Busca registro atual para auditoria
        var oldRecord = null;
        var rowIndex = id;
        
        if (typeof id !== 'number' || id > 10000) {
          // ID é um identificador, não rowIndex
          var findResult = this.findById(tableName, id);
          if (!findResult.success || !findResult.data) {
            return { success: false, error: 'Registro não encontrado com ID: ' + id };
          }
          oldRecord = findResult.data;
          rowIndex = oldRecord._rowIndex;
        } else {
          // id é rowIndex
          var readResult = CRUDService.read(sheetName, { 
            filters: { _rowIndex: id }, 
            limit: 1 
          });
          if (readResult.success && readResult.data.length > 0) {
            oldRecord = readResult.data[0];
          }
        }
        
        // Validação
        if (!options.skipValidation) {
          var validation = _validateData(tableName, data, true);
          if (!validation.valid) {
            return {
              success: false,
              error: 'Validação falhou',
              validationErrors: validation.errors
            };
          }
        }
        
        // Atualiza timestamp
        data.dataAtualizacao = new Date();
        
        // Executa atualização
        var result = CRUDService.update(sheetName, rowIndex, data, options);
        
        // Auditoria
        if (result.success && !options.skipAudit) {
          _audit('UPDATE', tableName, id, oldRecord, data, options.userId);
        }
        
        return result;
        
      } catch (e) {
        console.error('DatabaseEngine.update erro: ' + e.message);
        return { success: false, error: e.message };
      }
    },
    
    /**
     * Deleta registro com auditoria
     * @param {string} tableName - Nome da tabela
     * @param {number|string} id - ID do registro ou rowIndex
     * @param {Object} [options] - Opções { hard, skipAudit }
     * @returns {Object} Resultado
     */
    delete: function(tableName, id, options) {
      options = options || {};
      var sheetName = _getSheetName(tableName);
      
      try {
        // Busca registro para auditoria
        var oldRecord = null;
        var rowIndex = id;
        
        if (typeof id !== 'number' || id > 10000) {
          var findResult = this.findById(tableName, id);
          if (!findResult.success || !findResult.data) {
            return { success: false, error: 'Registro não encontrado com ID: ' + id };
          }
          oldRecord = findResult.data;
          rowIndex = oldRecord._rowIndex;
        }
        
        // Executa deleção
        var result = CRUDService.delete(sheetName, rowIndex, options.hard, options);
        
        // Auditoria
        if (result.success && !options.skipAudit) {
          _audit('DELETE', tableName, id, oldRecord, null, options.userId);
        }
        
        return result;
        
      } catch (e) {
        console.error('DatabaseEngine.delete erro: ' + e.message);
        return { success: false, error: e.message };
      }
    },
    
    // -----------------------------------------------------------------------
    // CONSULTAS ESPECIALIZADAS
    // -----------------------------------------------------------------------
    
    /**
     * Busca por ID (campo ID, não rowIndex)
     * @param {string} tableName - Nome da tabela
     * @param {*} id - Valor do ID
     * @returns {Object} Resultado
     */
    findById: function(tableName, id) {
      var sheetName = _getSheetName(tableName);
      var result = CRUDService.read(sheetName, {
        filters: { ID: id },
        limit: 1
      });
      
      if (result.success && result.data.length > 0) {
        return { success: true, data: result.data[0] };
      }
      return { success: false, data: null };
    },
    
    /**
     * Busca por Foreign Key
     * @param {string} tableName - Nome da tabela
     * @param {string} fkField - Campo FK
     * @param {*} fkValue - Valor da FK
     * @returns {Object} Resultado
     */
    findByFK: function(tableName, fkField, fkValue) {
      var sheetName = _getSheetName(tableName);
      var filters = {};
      filters[fkField] = fkValue;
      
      return CRUDService.read(sheetName, { filters: filters });
    },
    
    /**
     * Busca com JOIN (resolve FKs e retorna dados relacionados)
     * @param {string} tableName - Nome da tabela principal
     * @param {Object} [options] - Opções de busca
     * @returns {Object} Resultado com dados enriquecidos
     */
    findWithRelations: function(tableName, options) {
      options = options || {};
      options.resolveFK = true;
      return this.read(tableName, options);
    },
    
    // -----------------------------------------------------------------------
    // VALIDAÇÃO E SCHEMA
    // -----------------------------------------------------------------------
    
    /**
     * Valida dados contra o schema
     * @param {string} tableName - Nome da tabela
     * @param {Object} data - Dados a validar
     * @returns {Object} Resultado da validação
     */
    validate: function(tableName, data) {
      return _validateData(tableName, data, false);
    },
    
    /**
     * Obtém schema de uma tabela
     * @param {string} tableName - Nome da tabela
     * @returns {Object} Schema da tabela
     */
    getTableSchema: function(tableName) {
      var canonical = _getCanonicalName(tableName);
      return {
        name: canonical,
        sheetName: _getSheetName(tableName),
        columns: _getColumns(canonical),
        validations: _getValidations(canonical),
        foreignKeys: FK_MAPPING[canonical] || {}
      };
    },
    
    /**
     * Lista todas as tabelas do schema
     * @returns {Array} Lista de tabelas
     */
    listTables: function() {
      if (typeof SCHEMA !== 'undefined') {
        return SCHEMA.listAllSheets();
      }
      return [];
    },
    
    // -----------------------------------------------------------------------
    // UTILITÁRIOS
    // -----------------------------------------------------------------------
    
    /**
     * Limpa cache de referências
     */
    clearRefCache: function() {
      _refCache = {};
      _refCacheExpiry = {};
    },
    
    /**
     * Resolve FK manualmente
     * @param {string} tableName - Tabela
     * @param {string} fieldName - Campo FK
     * @param {*} value - Valor
     * @returns {Object} Resultado da resolução
     */
    resolveFK: function(tableName, fieldName, value) {
      return _resolveFK(tableName, fieldName, value);
    },
    
    /**
     * Obtém opções para dropdown de FK
     * @param {string} tableName - Tabela de referência
     * @param {string} valueField - Campo para valor
     * @param {string} displayField - Campo para exibição
     * @returns {Array} Opções { value, label }
     */
    getFKOptions: function(tableName, valueField, displayField) {
      try {
        var data = _loadRefData(tableName);
        return data.map(function(row) {
          return {
            value: row[valueField],
            label: row[displayField] || row[valueField]
          };
        });
      } catch (error) {
        Logger.log("Erro em getFKOptions: " + error.message);
        throw error;
      }
    }
  };
})();


// ============================================================================
// TRANSAÇÕES E OPERAÇÕES EM LOTE
// ============================================================================

/**
 * Gerenciador de Transações
 * Permite agrupar operações com rollback em caso de erro
 */
var TransactionManager = (function() {
  
  var _activeTransaction = null;
  var _operations = [];
  
  return {
    
    /**
     * Inicia uma transação
     * @param {string} [name] - Nome da transação para log
     * @returns {Object} Contexto da transação
     */
    begin: function(name) {
      if (_activeTransaction) {
        throw new Error('Já existe uma transação ativa');
      }
      
      _activeTransaction = {
        id: Utilities.getUuid(),
        name: name || 'Transaction',
        startTime: new Date(),
        operations: []
      };
      
      _operations = [];
      
      console.log('Transação iniciada: ' + _activeTransaction.name);
      
      return {
        id: _activeTransaction.id,
        name: _activeTransaction.name
      };
    },
    
    /**
     * Adiciona operação à transação
     * @param {string} type - Tipo (CREATE, UPDATE, DELETE)
     * @param {string} tableName - Tabela
     * @param {Object} data - Dados
     * @param {Object} [rollbackData] - Dados para rollback
     */
    addOperation: function(type, tableName, data, rollbackData) {
      try {
        if (!_activeTransaction) {
          throw new Error('Nenhuma transação ativa');
        }
      
        _operations.push({
          type: type,
          tableName: tableName,
          data: data,
          rollbackData: rollbackData,
          executed: false,
          result: null
        });
      } catch (error) {
        Logger.log("Erro em addOperation: " + error.message);
        throw error;
      }
    },
    
    /**
     * Executa todas as operações da transação
     * @returns {Object} Resultado
     */
    commit: function() {
      try {
        if (!_activeTransaction) {
          throw new Error('Nenhuma transação ativa');
        }
      
        var results = [];
        var success = true;
        var failedIndex = -1;
      
        // Executa operações
        for (var i = 0; i < _operations.length; i++) {
          var op = _operations[i];
          var result;
        
          try {
            switch (op.type) {
              case 'CREATE':
                result = DatabaseEngine.create(op.tableName, op.data, { skipAudit: true });
                break;
              case 'UPDATE':
                result = DatabaseEngine.update(op.tableName, op.data.ID || op.data._rowIndex, op.data, { skipAudit: true });
                break;
              case 'DELETE':
                result = DatabaseEngine.delete(op.tableName, op.data.ID || op.data._rowIndex, { skipAudit: true });
                break;
            }
          
            op.executed = true;
            op.result = result;
            results.push(result);
          
            if (!result.success) {
              success = false;
              failedIndex = i;
              break;
            }
          
          } catch (e) {
            success = false;
            failedIndex = i;
            results.push({ success: false, error: e.message });
            break;
          }
        }
      
        // Se falhou, faz rollback
        if (!success && failedIndex >= 0) {
          console.log('Transação falhou na operação ' + failedIndex + ', iniciando rollback...');
          this.rollback(failedIndex);
        }
      
        // Limpa transação
        var transactionInfo = _activeTransaction;
        _activeTransaction = null;
        _operations = [];
      
        return {
          success: success,
          transactionId: transactionInfo.id,
          transactionName: transactionInfo.name,
          operationsCount: results.length,
          results: results,
          duration: new Date() - transactionInfo.startTime
        };
      } catch (error) {
        Logger.log("Erro em commit: " + error.message);
        throw error;
      }
    },
    
    /**
     * Faz rollback das operações executadas
     * @param {number} upToIndex - Índice até onde fazer rollback
     */
    rollback: function(upToIndex) {
      console.log('Executando rollback...');
      
      // Rollback em ordem reversa
      for (var i = upToIndex - 1; i >= 0; i--) {
        var op = _operations[i];
        
        if (!op.executed) continue;
        
        try {
          switch (op.type) {
            case 'CREATE':
              // Deleta o registro criado
              if (op.result && op.result.id) {
                DatabaseEngine.delete(op.tableName, op.result.id, { hard: true, skipAudit: true });
              }
              break;
              
            case 'UPDATE':
              // Restaura dados anteriores
              if (op.rollbackData) {
                DatabaseEngine.update(op.tableName, op.data.ID || op.data._rowIndex, op.rollbackData, { skipAudit: true });
              }
              break;
              
            case 'DELETE':
              // Recria o registro deletado
              if (op.rollbackData) {
                DatabaseEngine.create(op.tableName, op.rollbackData, { skipAudit: true });
              }
              break;
          }
          
          console.log('Rollback da operação ' + i + ' (' + op.type + ') concluído');
          
        } catch (e) {
          console.error('Erro no rollback da operação ' + i + ': ' + e.message);
        }
      }
    },
    
    /**
     * Cancela transação sem executar
     */
    abort: function() {
      if (_activeTransaction) {
        console.log('Transação abortada: ' + _activeTransaction.name);
        _activeTransaction = null;
        _operations = [];
      }
    },
    
    /**
     * Verifica se há transação ativa
     * @returns {boolean}
     */
    isActive: function() {
      return _activeTransaction !== null;
    },
    
    /**
     * Obtém info da transação ativa
     * @returns {Object|null}
     */
    getActiveTransaction: function() {
      return _activeTransaction ? {
        id: _activeTransaction.id,
        name: _activeTransaction.name,
        operationsCount: _operations.length
      } : null;
    }
  };
})();

// ============================================================================
// FUNÇÕES GLOBAIS DE CONVENIÊNCIA
// ============================================================================

/**
 * Wrapper para criar registro com validação e auditoria
 * @param {string} tableName - Nome da tabela
 * @param {Object} data - Dados
 * @returns {Object} Resultado
 */
function dbCreate(tableName, data) {
  return DatabaseEngine.create(tableName, data);
}

/**
 * Wrapper para ler registros
 * @param {string} tableName - Nome da tabela
 * @param {Object} [options] - Opções
 * @returns {Object} Resultado
 */
function dbRead(tableName, options) {
  return DatabaseEngine.read(tableName, options);
}

/**
 * Wrapper para atualizar registro
 * @param {string} tableName - Nome da tabela
 * @param {*} id - ID do registro
 * @param {Object} data - Dados
 * @returns {Object} Resultado
 */
function dbUpdate(tableName, id, data) {
  return DatabaseEngine.update(tableName, id, data);
}

/**
 * Wrapper para deletar registro
 * @param {string} tableName - Nome da tabela
 * @param {*} id - ID do registro
 * @param {boolean} [hard] - Deleção permanente
 * @returns {Object} Resultado
 */
function dbDelete(tableName, id, hard) {
  return DatabaseEngine.delete(tableName, id, { hard: hard });
}

/**
 * Busca registro por ID
 * @param {string} tableName - Nome da tabela
 * @param {*} id - ID
 * @returns {Object} Resultado
 */
function dbFindById(tableName, id) {
  return DatabaseEngine.findById(tableName, id);
}

/**
 * Busca registros com relações resolvidas
 * @param {string} tableName - Nome da tabela
 * @param {Object} [filters] - Filtros
 * @returns {Object} Resultado
 */
function dbFindWithRelations(tableName, filters) {
  return DatabaseEngine.findWithRelations(tableName, { filters: filters });
}

/**
 * Obtém opções para dropdown de FK
 * @param {string} tableName - Tabela de referência
 * @param {string} valueField - Campo valor
 * @param {string} displayField - Campo exibição
 * @returns {Array} Opções
 */
function dbGetFKOptions(tableName, valueField, displayField) {
  return DatabaseEngine.getFKOptions(tableName, valueField, displayField);
}

/**
 * Executa operações em transação
 * @param {Function} callback - Função com operações
 * @param {string} [name] - Nome da transação
 * @returns {Object} Resultado
 */
function dbTransaction(callback, name) {
  TransactionManager.begin(name);
  
  try {
    callback({
      create: function(table, data) {
        TransactionManager.addOperation('CREATE', table, data);
      },
      update: function(table, id, data, oldData) {
        TransactionManager.addOperation('UPDATE', table, Object.assign({ ID: id }, data), oldData);
      },
      delete: function(table, id, oldData) {
        TransactionManager.addOperation('DELETE', table, { ID: id }, oldData);
      }
    });
    
    return TransactionManager.commit();
    
  } catch (e) {
    TransactionManager.abort();
    return { success: false, error: e.message };
  }
}

// ============================================================================
// REGISTRO DO MÓDULO
// ============================================================================

Logger.log('✅ Core_Database_Engine carregado - DatabaseEngine e TransactionManager disponíveis');
