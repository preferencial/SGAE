/**
 * @fileoverview Repository Pattern - Abstração de Acesso a Dados
 * @version 1.0.0
 * @description Implementa o padrão Repository para acesso consistente aos dados
 */

'use strict';

/**
 * @typedef {Object} QueryOptions
 * @property {number} [limit] - Limite de resultados
 * @property {number} [offset] - Offset para paginação
 * @property {string} [orderBy] - Campo para ordenação
 * @property {'ASC'|'DESC'} [order] - Direção da ordenação
 */

/**
 * Base Repository - Classe abstrata para todos os repositories
 */
class BaseRepository {
  /**
   * @param {string} sheetName - Nome da planilha
   */
  constructor(sheetName) {
    this.sheetName = sheetName;
    this.cache = CacheService.getScriptCache();
    this.cachePrefix = `repo_${sheetName}_`;
    this.cacheTTL = 600; // 10 minutos
  }

  /**
   * Obtém a planilha
   * @returns {GoogleAppsScript.Spreadsheet.Sheet}
   * @private
   */
  getSheet() {
    const ss = getSS();
    const sheet = ss.getSheetByName(this.sheetName);

    if (!sheet) {
      throw new Error(`Sheet "${this.sheetName}" not found`);
    }

    return sheet;
  }

  /**
   * Obtém todos os dados da planilha
   * @returns {Array<Array>}
   * @private
   */
  getAllData() {
    const cacheKey = `${this.cachePrefix}all`;
    const cached = this.cache.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const sheet = this.getSheet();
    const data = sheet.getDataRange().getValues();

    this.cache.put(cacheKey, JSON.stringify(data), this.cacheTTL);
    return data;
  }

  /**
   * Converte linha em objeto
   * @param {Array} row - Linha de dados
   * @param {Array<string>} headers - Cabeçalhos
   * @param {number} rowIndex - Índice da linha
   * @returns {Object}
   * @private
   */
  rowToObject(row, headers, rowIndex) {
    const obj = { _rowIndex: rowIndex + 2 }; // +2 porque header é linha 1 e array é 0-based

    headers.forEach((header, index) => {
      obj[header] = row[index];
    });

    return obj;
  }

  /**
   * Converte objeto em linha
   * @param {Object} obj - Objeto de dados
   * @param {Array<string>} headers - Cabeçalhos
   * @returns {Array}
   * @private
   */
  objectToRow(obj, headers) {
    return headers.map(header => obj[header] !== undefined ? obj[header] : '');
  }

  /**
   * Busca todos os registros
   * @param {QueryOptions} [options] - Opções de consulta
   * @returns {Array<Object>}
   */
  findAll(options = {}) {
    const data = this.getAllData();
    if (data.length === 0) return [];

    const headers = data[0];
    let rows = data.slice(1);

    // Aplicar ordenação
    if (options.orderBy) {
      const index = headers.indexOf(options.orderBy);
      if (index !== -1) {
        rows.sort((a, b) => {
          const aVal = a[index];
          const bVal = b[index];
          const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
          return options.order === 'DESC' ? -comparison : comparison;
        });
      }
    }

    // Aplicar paginação
    if (options.offset) {
      rows = rows.slice(options.offset);
    }
    if (options.limit) {
      rows = rows.slice(0, options.limit);
    }

    return rows.map((row, idx) => this.rowToObject(row, headers, idx));
  }

  /**
   * Busca registro por índice de linha
   * @param {number} rowIndex - Índice da linha (1-based)
   * @returns {Object|null}
   */
  findByRowIndex(rowIndex) {
    const data = this.getAllData();
    if (data.length === 0 || rowIndex < 2) return null;

    const headers = data[0];
    const row = data[rowIndex - 1];

    if (!row) return null;

    return this.rowToObject(row, headers, rowIndex - 1);
  }

  /**
   * Busca registros por filtros
   * @param {Object} filters - Filtros de busca
   * @param {QueryOptions} [options] - Opções de consulta
   * @returns {Array<Object>}
   */
  findByFilters(filters, options = {}) {
    const all = this.findAll();

    const filtered = all.filter(item => {
      return Object.keys(filters).every(key => {
        const filterValue = filters[key];
        const itemValue = item[key];

        // Suporte a diferentes tipos de filtro
        if (typeof filterValue === 'function') {
          return filterValue(itemValue);
        }

        if (filterValue instanceof RegExp) {
          return filterValue.test(String(itemValue));
        }

        return itemValue === filterValue;
      });
    });

    // Aplicar opções de paginação e ordenação
    return this.applyQueryOptions(filtered, options);
  }

  /**
   * Aplica opções de consulta aos resultados
   * @param {Array<Object>} results - Resultados
   * @param {QueryOptions} options - Opções
   * @returns {Array<Object>}
   * @private
   */
  applyQueryOptions(results, options) {
    let processed = [...results];

    if (options.orderBy) {
      processed.sort((a, b) => {
        const aVal = a[options.orderBy];
        const bVal = b[options.orderBy];
        const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        return options.order === 'DESC' ? -comparison : comparison;
      });
    }

    if (options.offset) {
      processed = processed.slice(options.offset);
    }

    if (options.limit) {
      processed = processed.slice(0, options.limit);
    }

    return processed;
  }

  /**
   * Cria novo registro
   * @param {Object} data - Dados do registro
   * @returns {Object} Registro criado com _rowIndex
   */
  create(data) {
    const sheet = this.getSheet();
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    const row = this.objectToRow(data, headers);
    sheet.appendRow(row);

    const lastRow = sheet.getLastRow();
    this.invalidateCache();

    return { ...data, _rowIndex: lastRow };
  }

  /**
   * Atualiza registro por índice de linha
   * @param {number} rowIndex - Índice da linha
   * @param {Object} data - Dados para atualizar
   * @returns {Object} Registro atualizado
   */
  update(rowIndex, data) {
    const sheet = this.getSheet();
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    const current = this.findByRowIndex(rowIndex);
    if (!current) {
      throw new Error(`Record at row ${rowIndex} not found`);
    }

    const updated = { ...current, ...data };
    const row = this.objectToRow(updated, headers);

    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
    this.invalidateCache();

    return { ...updated, _rowIndex: rowIndex };
  }

  /**
   * Deleta registro por índice de linha
   * @param {number} rowIndex - Índice da linha
   * @returns {boolean} Sucesso da operação
   */
  delete(rowIndex) {
    const sheet = this.getSheet();

    if (rowIndex < 2) {
      throw new Error('Cannot delete header row');
    }

    sheet.deleteRow(rowIndex);
    this.invalidateCache();

    return true;
  }

  /**
   * Conta registros
   * @param {Object} [filters] - Filtros opcionais
   * @returns {number}
   */
  count(filters = null) {
    if (filters) {
      return this.findByFilters(filters).length;
    }

    const sheet = this.getSheet();
    return Math.max(0, sheet.getLastRow() - 1); // -1 para excluir header
  }

  /**
   * Verifica se registro existe
   * @param {Object} filters - Filtros de busca
   * @returns {boolean}
   */
  exists(filters) {
    return this.findByFilters(filters).length > 0;
  }

  /**
   * Invalida cache
   * @private
   */
  invalidateCache() {
    this.cache.remove(`${this.cachePrefix}all`);
  }

  /**
   * Executa operação em lote
   * @param {Array<Object>} records - Registros para criar
   * @returns {Array<Object>} Registros criados
   */
  bulkCreate(records) {
    const sheet = this.getSheet();
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    const rows = records.map(record => this.objectToRow(record, headers));

    const startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, rows.length, rows[0].length).setValues(rows);

    this.invalidateCache();

    return records.map((record, idx) => ({
      ...record,
      _rowIndex: startRow + idx
    }));
  }
}

/**
 * Repository para Notas Fiscais
 */
class NotaFiscalRepository extends BaseRepository {
  constructor() {
    super('Notas_Fiscais');
  }

  /**
   * Busca notas por fornecedor
   * @param {string} fornecedor - Nome do fornecedor
   * @returns {Array<Object>}
   */
  findByFornecedor(fornecedor) {
    return this.findByFilters({
      Fornecedor: (value) => String(value).toLowerCase().includes(fornecedor.toLowerCase())
    });
  }

  /**
   * Busca notas por status
   * @param {string} status - Status da nota
   * @returns {Array<Object>}
   */
  findByStatus(status) {
    return this.findByFilters({ Status_NF: status });
  }

  /**
   * Busca notas por período
   * @param {Date} dataInicio - Data inicial
   * @param {Date} dataFim - Data final
   * @returns {Array<Object>}
   */
  findByPeriodo(dataInicio, dataFim) {
    return this.findByFilters({
      Data_Emissao: (value) => {
        const data = new Date(value);
        return data >= dataInicio && data <= dataFim;
      }
    });
  }

  /**
   * Busca notas por chave de acesso
   * @param {string} chaveAcesso - Chave de acesso
   * @returns {Object|null}
   */
  findByChaveAcesso(chaveAcesso) {
    const results = this.findByFilters({ Chave_Acesso: chaveAcesso });
    return results.length > 0 ? results[0] : null;
  }
}

/**
 * Repository para Entregas
 */
class EntregaRepository extends BaseRepository {
  constructor() {
    super('Entregas');
  }

  /**
   * Busca entregas por nota fiscal
   * @param {string} numeroNF - Número da nota fiscal
   * @returns {Array<Object>}
   */
  findByNotaFiscal(numeroNF) {
    return this.findByFilters({ Numero_NF: numeroNF });
  }

  /**
   * Busca entregas pendentes
   * @returns {Array<Object>}
   */
  findPendentes() {
    return this.findByFilters({ Status_Entrega: 'PENDENTE' });
  }
}

/**
 * Repository para Fornecedores
 */
class FornecedorRepository extends BaseRepository {
  constructor() {
    super('Fornecedores');
  }

  /**
   * Busca fornecedor por CNPJ
   * @param {string} cnpj - CNPJ do fornecedor
   * @returns {Object|null}
   */
  findByCNPJ(cnpj) {
    const results = this.findByFilters({ CNPJ: cnpj });
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Busca fornecedores ativos
   * @returns {Array<Object>}
   */
  findAtivos() {
    return this.findByFilters({ Status: 'ATIVO' });
  }
}

/**
 * Factory para criar repositories
 */
class RepositoryFactory {
  /**
   * Cria repository apropriado
   * @param {string} entityName - Nome da entidade
   * @returns {BaseRepository}
   */
  static create(entityName) {
    switch (entityName.toLowerCase()) {
      case 'notafiscal':
      case 'notas_fiscais':
        return new NotaFiscalRepository();

      case 'entrega':
      case 'entregas':
        return new EntregaRepository();

      case 'fornecedor':
      case 'fornecedores':
        return new FornecedorRepository();

      default:
        return new BaseRepository(entityName);
    }
  }
}

// Exportar para uso global
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    BaseRepository,
    NotaFiscalRepository,
    EntregaRepository,
    FornecedorRepository,
    RepositoryFactory
  };
}
