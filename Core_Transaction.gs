/**
 * @fileoverview Sistema de Transações para Operações Atômicas
 * @version 1.0.0
 * @description Implementa padrão de transação para garantir consistência
 * em operações que envolvem múltiplas escritas.
 * 
 * NOTA: Google Sheets não suporta transações nativas. Este módulo
 * implementa um padrão de "compensating transactions" (saga pattern)
 * para simular comportamento transacional.
 * 
 * FUNCIONALIDADES:
 * - Operações atômicas simuladas
 * - Rollback automático em caso de erro
 * - Log de operações para auditoria
 * - Locks otimistas
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-08
 */

'use strict';

var Transaction = (function() {

  // ============================================================================
  // ESTADO DA TRANSAÇÃO
  // ============================================================================

  var activeTransactions = {};
  var LOCK_TIMEOUT_MS = 30000; // 30 segundos

  /**
   * Cria uma nova transação
   * @param {string} [name] - Nome descritivo da transação
   * @returns {Object} Contexto da transação
   */
  function begin(name) {
    try {
      var txId = 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
      activeTransactions[txId] = {
        id: txId,
        name: name || 'unnamed',
        startTime: Date.now(),
        operations: [],
        state: 'ACTIVE', // ACTIVE, COMMITTED, ROLLED_BACK
        locks: []
      };

      AppLogger.info('Transação iniciada: ' + txId, { name: name });
    
      return {
        id: txId,
      
        /**
         * Adiciona operação à transação
         * @param {Object} operation - Operação a adicionar
         */
        addOperation: function(operation) {
          addOperation(txId, operation);
        },
      
        /**
         * Executa operação dentro da transação
         * @param {Function} fn - Função a executar
         * @param {Function} compensate - Função de compensação (rollback)
         * @returns {*} Resultado da função
         */
        execute: function(fn, compensate) {
          return executeInTransaction(txId, fn, compensate);
        },
      
        /**
         * Confirma a transação
         * @returns {Object} Resultado
         */
        commit: function() {
          return commit(txId);
        },
      
        /**
         * Desfaz a transação
         * @returns {Object} Resultado
         */
        rollback: function() {
          return rollback(txId);
        },
      
        /**
         * Obtém estado atual
         * @returns {Object}
         */
        getState: function() {
          return getTransactionState(txId);
        }
      };
    } catch (error) {
      Logger.log("Erro em begin: " + error.message);
      throw error;
    }
  }

  /**
   * Adiciona operação ao log da transação
   * @param {string} txId - ID da transação
   * @param {Object} operation - Operação
   */
  function addOperation(txId, operation) {
    try {
      var tx = activeTransactions[txId];
      if (!tx || tx.state !== 'ACTIVE') {
        throw new Error('Transação não está ativa: ' + txId);
      }

      tx.operations.push({
        index: tx.operations.length,
        timestamp: Date.now(),
        type: operation.type,
        sheet: operation.sheet,
        data: operation.data,
        compensate: operation.compensate,
        executed: false,
        result: null
      });
    } catch (error) {
      Logger.log("Erro em addOperation: " + error.message);
      throw error;
    }
  }

  /**
   * Executa função dentro do contexto da transação
   * @param {string} txId - ID da transação
   * @param {Function} fn - Função a executar
   * @param {Function} compensate - Função de compensação
   * @returns {*} Resultado
   */
  function executeInTransaction(txId, fn, compensate) {
    try {
      var tx = activeTransactions[txId];
      if (!tx || tx.state !== 'ACTIVE') {
        throw new Error('Transação não está ativa: ' + txId);
      }

      var opIndex = tx.operations.length;
    
      // Registra operação
      tx.operations.push({
        index: opIndex,
        timestamp: Date.now(),
        type: 'EXECUTE',
        compensate: compensate,
        executed: false,
        result: null
      });

      try {
        var result = fn();
        tx.operations[opIndex].executed = true;
        tx.operations[opIndex].result = result;
        return result;
      } catch (e) {
        tx.operations[opIndex].error = e.message;
        throw e;
      }
    } catch (error) {
      Logger.log("Erro em executeInTransaction: " + error.message);
      throw error;
    }
  }

  /**
   * Confirma a transação
   * @param {string} txId - ID da transação
   * @returns {Object} Resultado
   */
  function commit(txId) {
    var tx = activeTransactions[txId];
    if (!tx) {
      return { success: false, error: 'Transação não encontrada: ' + txId };
    }

    if (tx.state !== 'ACTIVE') {
      return { success: false, error: 'Transação não está ativa: ' + tx.state };
    }

    tx.state = 'COMMITTED';
    tx.endTime = Date.now();

    // Libera locks
    releaseLocks(txId);

    // Log de auditoria
    AppLogger.audit('TRANSACTION_COMMIT', {
      txId: txId,
      name: tx.name,
      operations: tx.operations.length,
      duration: tx.endTime - tx.startTime
    });

    // Limpa transação após um tempo
    setTimeout(function() {
      delete activeTransactions[txId];
    }, 60000);

    return {
      success: true,
      txId: txId,
      operations: tx.operations.length,
      duration: tx.endTime - tx.startTime
    };
  }

  /**
   * Desfaz a transação (rollback)
   * @param {string} txId - ID da transação
   * @returns {Object} Resultado
   */
  function rollback(txId) {
    var tx = activeTransactions[txId];
    if (!tx) {
      return { success: false, error: 'Transação não encontrada: ' + txId };
    }

    if (tx.state === 'ROLLED_BACK') {
      return { success: true, message: 'Transação já foi desfeita' };
    }

    var rollbackResults = [];
    var rollbackErrors = [];

    // Executa compensações em ordem reversa
    for (var i = tx.operations.length - 1; i >= 0; i--) {
      var op = tx.operations[i];
      
      if (op.executed && op.compensate) {
        try {
          op.compensate(op.result);
          rollbackResults.push({ index: i, success: true });
        } catch (e) {
          rollbackErrors.push({ index: i, error: e.message });
          AppLogger.error('Erro no rollback da operação ' + i, e);
        }
      }
    }

    tx.state = 'ROLLED_BACK';
    tx.endTime = Date.now();

    // Libera locks
    releaseLocks(txId);

    // Log de auditoria
    AppLogger.audit('TRANSACTION_ROLLBACK', {
      txId: txId,
      name: tx.name,
      operations: tx.operations.length,
      rollbackResults: rollbackResults.length,
      rollbackErrors: rollbackErrors.length
    });

    return {
      success: rollbackErrors.length === 0,
      txId: txId,
      rolledBack: rollbackResults.length,
      errors: rollbackErrors
    };
  }

  /**
   * Obtém estado da transação
   * @param {string} txId - ID da transação
   * @returns {Object|null}
   */
  function getTransactionState(txId) {
    var tx = activeTransactions[txId];
    if (!tx) return null;

    return {
      id: tx.id,
      name: tx.name,
      state: tx.state,
      operations: tx.operations.length,
      startTime: tx.startTime,
      endTime: tx.endTime,
      duration: tx.endTime ? tx.endTime - tx.startTime : Date.now() - tx.startTime
    };
  }

  // ============================================================================
  // LOCKS OTIMISTAS
  // ============================================================================

  var locks = {};

  /**
   * Adquire lock em um recurso
   * @param {string} txId - ID da transação
   * @param {string} resource - Identificador do recurso (ex: "sheet:row")
   * @returns {boolean} Se conseguiu o lock
   */
  function acquireLock(txId, resource) {
    try {
      var now = Date.now();
    
      // Verifica se já existe lock
      if (locks[resource]) {
        // Verifica se expirou
        if (now - locks[resource].timestamp > LOCK_TIMEOUT_MS) {
          // Lock expirado, pode sobrescrever
          AppLogger.warn('Lock expirado liberado: ' + resource);
        } else if (locks[resource].txId !== txId) {
          // Lock ativo de outra transação
          return false;
        }
      }

      locks[resource] = {
        txId: txId,
        timestamp: now
      };

      // Registra lock na transação
      var tx = activeTransactions[txId];
      if (tx) {
        tx.locks.push(resource);
      }

      return true;
    } catch (error) {
      Logger.log("Erro em acquireLock: " + error.message);
      throw error;
    }
  }

  /**
   * Libera lock de um recurso
   * @param {string} resource - Identificador do recurso
   */
  function releaseLock(resource) {
    delete locks[resource];
  }

  /**
   * Libera todos os locks de uma transação
   * @param {string} txId - ID da transação
   */
  function releaseLocks(txId) {
    try {
      var tx = activeTransactions[txId];
      if (tx && tx.locks) {
        tx.locks.forEach(function(resource) {
          if (locks[resource] && locks[resource].txId === txId) {
            delete locks[resource];
          }
        });
      }
    } catch (error) {
      Logger.log("Erro em releaseLocks: " + error.message);
      throw error;
    }
  }

  // ============================================================================
  // OPERAÇÕES TRANSACIONAIS PRÉ-DEFINIDAS
  // ============================================================================

  /**
   * Insere registro com suporte a transação
   * @param {Object} tx - Contexto da transação
   * @param {string} sheetName - Nome da aba
   * @param {Object} data - Dados a inserir
   * @returns {Object} Resultado
   */
  function transactionalInsert(tx, sheetName, data) {
    var insertedRow = null;

    return tx.execute(
      // Operação principal
      function() {
        var result = CRUD.create(sheetName, data);
        if (result.success) {
          insertedRow = result.id;
        }
        return result;
      },
      // Compensação (rollback)
      function(result) {
        if (result && result.success && result.id) {
          CRUD.delete(sheetName, result.id, true); // hard delete
        }
      }
    );
  }

  /**
   * Atualiza registro com suporte a transação
   * @param {Object} tx - Contexto da transação
   * @param {string} sheetName - Nome da aba
   * @param {number} rowIndex - Índice da linha
   * @param {Object} newData - Novos dados
   * @returns {Object} Resultado
   */
  function transactionalUpdate(tx, sheetName, rowIndex, newData) {
    // Captura dados anteriores para rollback
    var previousData = null;

    return tx.execute(
      // Operação principal
      function() {
        // Lê dados atuais
        var current = CRUD.findById(sheetName, rowIndex);
        if (current.success && current.data.length > 0) {
          previousData = current.data[0];
        }
        
        return CRUD.update(sheetName, rowIndex, newData);
      },
      // Compensação (rollback)
      function() {
        if (previousData) {
          CRUD.update(sheetName, rowIndex, previousData);
        }
      }
    );
  }

  /**
   * Deleta registro com suporte a transação (soft delete)
   * @param {Object} tx - Contexto da transação
   * @param {string} sheetName - Nome da aba
   * @param {number} rowIndex - Índice da linha
   * @returns {Object} Resultado
   */
  function transactionalDelete(tx, sheetName, rowIndex) {
    var previousData = null;

    return tx.execute(
      // Operação principal
      function() {
        // Lê dados atuais
        var current = CRUD.findById(sheetName, rowIndex);
        if (current.success && current.data.length > 0) {
          previousData = current.data[0];
        }
        
        return CRUD.delete(sheetName, rowIndex, false); // soft delete
      },
      // Compensação (rollback)
      function() {
        if (previousData) {
          // Restaura registro
          CRUD.update(sheetName, rowIndex, { deletado: false });
        }
      }
    );
  }

  // ============================================================================
  // WRAPPER DE ALTO NÍVEL
  // ============================================================================

  /**
   * Executa múltiplas operações em uma transação
   * @param {string} name - Nome da transação
   * @param {Function} operations - Função que recebe o contexto da transação
   * @returns {Object} Resultado
   */
  function runInTransaction(name, operations) {
    var tx = begin(name);
    
    try {
      var result = operations(tx);
      
      // Se chegou aqui sem erro, faz commit
      var commitResult = tx.commit();
      
      return {
        success: true,
        txId: tx.id,
        result: result,
        commit: commitResult
      };
      
    } catch (e) {
      // Erro - faz rollback
      AppLogger.error('Erro na transação ' + name, e);
      var rollbackResult = tx.rollback();
      
      return {
        success: false,
        txId: tx.id,
        error: e.message,
        rollback: rollbackResult
      };
    }
  }

  // ============================================================================
  // API PÚBLICA
  // ============================================================================

  return {
    // Core
    begin: begin,
    commit: commit,
    rollback: rollback,
    getTransactionState: getTransactionState,
    
    // Locks
    acquireLock: acquireLock,
    releaseLock: releaseLock,
    
    // Operações transacionais
    transactionalInsert: transactionalInsert,
    transactionalUpdate: transactionalUpdate,
    transactionalDelete: transactionalDelete,
    
    // Wrapper
    runInTransaction: runInTransaction,
    
    // Debug
    getActiveTransactions: function() {
      try {
        return Object.keys(activeTransactions).map(function(id) {
          return getTransactionState(id);
        });
      } catch (error) {
        Logger.log("Erro em getActiveTransactions: " + error.message);
        throw error;
      }
    }
  };
})();

// ============================================================================
// FUNÇÕES GLOBAIS DE CONVENIÊNCIA
// ============================================================================

/**
 * Executa operações em transação
 * @param {string} name - Nome da transação
 * @param {Function} fn - Função com operações
 * @returns {Object} Resultado
 */
function withTransaction(name, fn) {
  return Transaction.runInTransaction(name, fn);
}
