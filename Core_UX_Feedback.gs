/**
 * @fileoverview Sistema de Feedback UX e Notificação Segura
 * @version 1.0.0
 * @author UNIAE CRE Team
 * @created 2025-12-17
 * 
 * @description
 * Implementa um ciclo de feedback robusto e não-bloqueante para operações
 * demoradas ou críticas. Melhora a percepção de desempenho e usabilidade
 * transformando operações de fundo em experiências transparentes.
 * 
 * @requires 0_Core_Safe_Globals.gs
 * @requires Core_Logger.gs
 * 
 * Funcionalidades:
 * - Wrapper executeSafeOperation para ciclo completo de feedback
 * - Indicador de progresso simulado para operações longas
 * - Notificações seguras com fallback para contextos sem UI
 * - Métricas de tempo de execução
 * - ID de transação único para rastreabilidade
 */

'use strict';

// ============================================================================
// MÓDULO DE FEEDBACK UX
// ============================================================================

var UXFeedback = (function() {
  
  // --------------------------------------------------------------------------
  // CONFIGURAÇÃO
  // --------------------------------------------------------------------------
  
  var CONFIG = {
    /** Tempo mínimo (ms) para mostrar indicador de progresso */
    PROGRESS_THRESHOLD_MS: 5000,
    
    /** Intervalo entre atualizações de progresso (ms) */
    PROGRESS_UPDATE_INTERVAL_MS: 2000,
    
    /** Nome da célula de status na planilha (opcional) */
    STATUS_CELL_RANGE: 'Status!A1',
    
    /** Prefixo para IDs de transação */
    TRANSACTION_ID_PREFIX: 'TXN',
    
    /** Habilitar logging detalhado de performance */
    ENABLE_PERFORMANCE_LOGGING: true,
    
    /** Mensagens padrão */
    MESSAGES: {
      STARTING: 'Iniciando operação...',
      PROCESSING: 'Processando...',
      SUCCESS: 'Operação concluída com sucesso!',
      ERROR: 'Ocorreu um erro. Por favor, contacte o suporte.',
      PROGRESS_25: '25% concluído...',
      PROGRESS_50: '50% concluído...',
      PROGRESS_75: '75% concluído...',
      PROGRESS_100: 'Finalizando...'
    }
  };
  
  // --------------------------------------------------------------------------
  // ESTADO INTERNO
  // --------------------------------------------------------------------------
  
  var state = {
    currentTransactionId: null,
    operationStartTime: null,
    progressStage: 0
  };
  
  // --------------------------------------------------------------------------
  // FUNÇÕES AUXILIARES PRIVADAS
  // --------------------------------------------------------------------------
  
  /**
   * Gera um ID de transação único para rastreabilidade
   * @returns {string} ID único no formato TXN-timestamp-random
   */
  function generateTransactionId() {
    try {
      var timestamp = new Date().getTime().toString(36);
      var random = Math.random().toString(36).substring(2, 8);
      return CONFIG.TRANSACTION_ID_PREFIX + '-' + timestamp + '-' + random;
    } catch (error) {
      Logger.log("Erro em generateTransactionId: " + error.message);
      throw error;
    }
  }
  
  /**
   * Obtém o tempo decorrido desde o início da operação
   * @returns {number} Tempo em milissegundos
   */
  function getElapsedTime() {
    if (!state.operationStartTime) return 0;
    return Date.now() - state.operationStartTime;
  }
  
  /**
   * Formata duração em formato legível
   * @param {number} ms - Milissegundos
   * @returns {string} Duração formatada (ex: "2.5s" ou "1m 30s")
   */
  function formatDuration(ms) {
    if (ms < 1000) return ms + 'ms';
    if (ms < 60000) return (ms / 1000).toFixed(1) + 's';
    var minutes = Math.floor(ms / 60000);
    var seconds = Math.round((ms % 60000) / 1000);
    return minutes + 'm ' + seconds + 's';
  }
  
  /**
   * Atualiza célula de status na planilha (indicador visual)
   * @param {string} message - Mensagem de status
   * @param {string} [color] - Cor de fundo opcional
   */
  function updateStatusCell(message, color) {
    try {
      var ss = getSS();
      if (!ss) return;
      
      // Tenta encontrar a aba Status ou usa a primeira aba
      var statusSheet = ss.getSheetByName('Status');
      if (!statusSheet) {
        // Não cria aba automaticamente, apenas loga
        return;
      }
      
      var cell = statusSheet.getRange('A1');
      cell.setValue(message);
      
      if (color) {
        cell.setBackground(color);
      }
      
      SpreadsheetApp.flush(); // Força atualização visual
    } catch (e) {
      // Silencioso - status cell é opcional
    }
  }
  
  /**
   * Limpa a célula de status
   */
  function clearStatusCell() {
    updateStatusCell('', '#ffffff');
  }
  
  /**
   * Exibe notificação segura ao usuário
   * @param {string} title - Título da notificação
   * @param {string} message - Mensagem
   * @param {string} [type='info'] - Tipo: 'info', 'success', 'warning', 'error'
   * @returns {boolean} true se UI estava disponível
   */
  function notifyUser(title, message, type) {
    type = type || 'info';
    
    // Ícones por tipo
    var icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };
    
    var icon = icons[type] || icons.info;
    var fullTitle = icon + ' ' + title;
    
    // Tenta usar safeAlert (definido em 0_Core_Safe_Globals.gs)
    if (typeof safeAlert === 'function') {
      var result = safeAlert(fullTitle, message);
      return result !== null;
    }
    
    // Fallback: tenta UI diretamente
    var ui = null;
    try {
      ui = SpreadsheetApp.getUi();
    } catch (e) {
      // UI não disponível
    }
    
    if (ui) {
      try {
        ui.alert(fullTitle, message, ui.ButtonSet.OK);
        return true;
      } catch (e) {
        // Falha ao exibir
      }
    }
    
    // Último fallback: log
    AppLogger.info('NOTIFICAÇÃO [' + type.toUpperCase() + ']: ' + title + ' - ' + message);
    return false;
  }
  
  /**
   * Registra métrica de performance
   * @param {string} operation - Nome da operação
   * @param {number} duration - Duração em ms
   * @param {Object} [metadata] - Dados adicionais
   */
  function logPerformance(operation, duration, metadata) {
    if (!CONFIG.ENABLE_PERFORMANCE_LOGGING) return;
    
    var logData = {
      transactionId: state.currentTransactionId,
      operation: operation,
      duration: duration,
      durationFormatted: formatDuration(duration)
    };
    
    if (metadata) {
      logData.metadata = metadata;
    }
    
    if (typeof AppLogger !== 'undefined' && AppLogger.performance) {
      AppLogger.performance(operation, duration, logData);
    } else if (typeof AppLogger !== 'undefined') {
      AppLogger.info('PERF: ' + operation + ' - ' + formatDuration(duration), logData);
    }
  }
  
  // --------------------------------------------------------------------------
  // API PÚBLICA
  // --------------------------------------------------------------------------
  
  return {
    
    /**
     * Configuração do módulo
     */
    CONFIG: CONFIG,
    
    /**
     * Executa uma operação com ciclo completo de feedback
     * 
     * Este é o wrapper principal que encapsula:
     * - Notificação de início
     * - Logging detalhado com métricas de tempo
     * - Indicador de progresso para operações longas
     * - Notificação de sucesso/erro
     * - ID de transação para rastreabilidade
     * 
     * @param {string} operationName - Nome descritivo da operação
     * @param {Function} callback - Função a ser executada
     * @param {Object} [options] - Opções de configuração
     * @param {boolean} [options.silent=false] - Não exibir alertas
     * @param {boolean} [options.showProgress=true] - Mostrar progresso
     * @param {string} [options.startMessage] - Mensagem de início customizada
     * @param {string} [options.successMessage] - Mensagem de sucesso customizada
     * @param {Object} [options.context] - Contexto adicional para logging
     * @returns {Object} Resultado com success, data/error, transactionId, duration
     * 
     * @example
     * var result = UXFeedback.executeSafeOperation(
     *   'Processamento de Notas Fiscais',
     *   function() {
     *     // Sua lógica aqui
     *     return { processed: 150 };
     *   },
     *   {
     *     successMessage: 'Notas processadas com sucesso!',
     *     context: { batchId: 'NF-2025-001' }
     *   }
     * );
     */
    executeSafeOperation: function(operationName, callback, options) {
      options = options || {};
      var silent = options.silent || false;
      var showProgress = options.showProgress !== false;
      var startMessage = options.startMessage || CONFIG.MESSAGES.STARTING;
      var successMessage = options.successMessage || CONFIG.MESSAGES.SUCCESS;
      var context = options.context || {};
      
      // Inicializa estado da operação
      state.currentTransactionId = generateTransactionId();
      state.operationStartTime = Date.now();
      state.progressStage = 0;
      
      var transactionId = state.currentTransactionId;
      
      // Log de início
      AppLogger.info('Operação iniciada: ' + operationName, {
        transactionId: transactionId,
        context: context
      });
      
      // Feedback de início (não-bloqueante via status cell)
      if (showProgress) {
        updateStatusCell('🔄 ' + operationName + ': ' + startMessage, '#fff3cd');
      }
      
      // Notificação de início (opcional, apenas para operações muito longas)
      if (!silent && options.notifyStart) {
        notifyUser(operationName, startMessage, 'info');
      }
      
      try {
        // Executa a operação
        var result = callback();
        
        // Calcula duração
        var duration = getElapsedTime();
        
        // Log de sucesso
        AppLogger.info('Operação concluída: ' + operationName, {
          transactionId: transactionId,
          duration: duration,
          durationFormatted: formatDuration(duration),
          result: result
        });
        
        // Métrica de performance
        logPerformance(operationName, duration, context);
        
        // Limpa status
        if (showProgress) {
          updateStatusCell('✅ ' + operationName + ': Concluído', '#d4edda');
          // Limpa após 3 segundos
          Utilities.sleep(100);
        }
        
        // Notificação de sucesso
        if (!silent) {
          var finalMessage = successMessage;
          if (result && typeof result === 'object') {
            // Tenta extrair informações úteis do resultado
            if (result.count !== undefined) {
              finalMessage += '\n' + result.count + ' registro(s) processado(s).';
            } else if (result.processed !== undefined) {
              finalMessage += '\n' + result.processed + ' item(ns) processado(s).';
            }
          }
          finalMessage += '\n\nTempo: ' + formatDuration(duration);
          finalMessage += '\nID: ' + transactionId;
          
          notifyUser(operationName, finalMessage, 'success');
        }
        
        // Retorna resultado padronizado
        return {
          success: true,
          data: result,
          transactionId: transactionId,
          duration: duration,
          durationFormatted: formatDuration(duration)
        };
        
      } catch (error) {
        // Calcula duração até o erro
        var errorDuration = getElapsedTime();
        
        // Log de erro detalhado
        AppLogger.error('Operação falhou: ' + operationName, {
          transactionId: transactionId,
          duration: errorDuration,
          error: error.message,
          stack: error.stack,
          context: context
        });
        
        // Limpa status com indicação de erro
        if (showProgress) {
          updateStatusCell('❌ ' + operationName + ': Erro', '#f8d7da');
        }
        
        // Notificação de erro amigável
        if (!silent) {
          var errorMessage = CONFIG.MESSAGES.ERROR;
          errorMessage += '\n\nID do erro: ' + transactionId;
          errorMessage += '\n\nDetalhes técnicos foram registrados no log.';
          
          // Para erros de validação, mostra mensagem específica
          if (error.name === 'ValidationError' || 
              error.message.includes('inválid') || 
              error.message.includes('obrigatório')) {
            errorMessage = error.message + '\n\nID: ' + transactionId;
          }
          
          notifyUser('Erro em ' + operationName, errorMessage, 'error');
        }
        
        // Retorna erro padronizado
        return {
          success: false,
          error: error.message,
          errorType: error.name || 'Error',
          transactionId: transactionId,
          duration: errorDuration,
          durationFormatted: formatDuration(errorDuration)
        };
        
      } finally {
        // Limpa estado
        state.currentTransactionId = null;
        state.operationStartTime = null;
        state.progressStage = 0;
      }
    },

    /**
     * Executa operação em lote com indicador de progresso
     * 
     * Ideal para operações que processam múltiplos itens e podem
     * demorar mais de 5 segundos. Atualiza o progresso periodicamente.
     * 
     * @param {string} operationName - Nome da operação
     * @param {Array} items - Array de itens a processar
     * @param {Function} processor - Função que processa cada item
     * @param {Object} [options] - Opções adicionais
     * @param {boolean} [options.silent=false] - Não exibir alertas
     * @param {boolean} [options.stopOnError=false] - Parar no primeiro erro
     * @param {number} [options.batchSize=10] - Tamanho do lote para flush
     * @returns {Object} Resultado com estatísticas de processamento
     * 
     * @example
     * var result = UXFeedback.executeBatchOperation(
     *   'Importação de Dados',
     *   registros,
     *   function(item, index) {
     *     // Processa cada item
     *     return processarRegistro(item);
     *   }
     * );
     */
    executeBatchOperation: function(operationName, items, processor, options) {
      options = options || {};
      var silent = options.silent || false;
      var stopOnError = options.stopOnError || false;
      var batchSize = options.batchSize || 10;
      
      var self = this;
      var totalItems = items.length;
      var processed = 0;
      var succeeded = 0;
      var failed = 0;
      var errors = [];
      var lastProgressUpdate = 0;
      
      return this.executeSafeOperation(operationName, function() {
        
        for (var i = 0; i < totalItems; i++) {
          var item = items[i];
          
          try {
            // Processa item
            var itemResult = processor(item, i);
            
            if (itemResult === false || (itemResult && itemResult.success === false)) {
              failed++;
              errors.push({
                index: i,
                item: item,
                error: itemResult ? itemResult.error : 'Falha no processamento'
              });
              
              if (stopOnError) {
                throw new Error('Processamento interrompido no item ' + (i + 1));
              }
            } else {
              succeeded++;
            }
            
          } catch (itemError) {
            failed++;
            errors.push({
              index: i,
              item: item,
              error: itemError.message
            });
            
            AppLogger.warn('Erro ao processar item ' + (i + 1) + '/' + totalItems, {
              error: itemError.message,
              item: item
            });
            
            if (stopOnError) {
              throw itemError;
            }
          }
          
          processed++;
          
          // Atualiza progresso a cada batchSize itens ou a cada 2 segundos
          var now = Date.now();
          if (processed % batchSize === 0 || (now - lastProgressUpdate) > CONFIG.PROGRESS_UPDATE_INTERVAL_MS) {
            var percentComplete = Math.round((processed / totalItems) * 100);
            var progressMessage = operationName + ': ' + percentComplete + '% (' + processed + '/' + totalItems + ')';
            
            updateStatusCell('🔄 ' + progressMessage, '#fff3cd');
            
            AppLogger.debug('Progresso: ' + progressMessage, {
              processed: processed,
              total: totalItems,
              succeeded: succeeded,
              failed: failed
            });
            
            lastProgressUpdate = now;
            
            // Força atualização visual
            SpreadsheetApp.flush();
          }
        }
        
        // Retorna estatísticas
        return {
          total: totalItems,
          processed: processed,
          succeeded: succeeded,
          failed: failed,
          errors: errors.length > 0 ? errors : undefined,
          successRate: totalItems > 0 ? Math.round((succeeded / totalItems) * 100) + '%' : 'N/A'
        };
        
      }, {
        silent: silent,
        successMessage: 'Processamento concluído!\n' +
          'Total: ' + totalItems + ' | Sucesso: ' + succeeded + ' | Falhas: ' + failed,
        context: {
          totalItems: totalItems,
          batchSize: batchSize
        }
      });
    },
    
    /**
     * Atualiza progresso manualmente durante operação longa
     * 
     * Use dentro de callbacks de executeSafeOperation para
     * atualizar o indicador de progresso em etapas específicas.
     * 
     * @param {number} percent - Percentual de conclusão (0-100)
     * @param {string} [message] - Mensagem de status opcional
     * 
     * @example
     * UXFeedback.executeSafeOperation('Relatório', function() {
     *   // Etapa 1
     *   carregarDados();
     *   UXFeedback.updateProgress(25, 'Dados carregados');
     *   
     *   // Etapa 2
     *   processarDados();
     *   UXFeedback.updateProgress(50, 'Dados processados');
     *   
     *   // Etapa 3
     *   gerarRelatorio();
     *   UXFeedback.updateProgress(75, 'Relatório gerado');
     *   
     *   // Etapa 4
     *   enviarEmail();
     *   UXFeedback.updateProgress(100, 'Email enviado');
     * });
     */
    updateProgress: function(percent, message) {
      percent = Math.min(100, Math.max(0, percent));
      
      var statusMessage = percent + '% concluído';
      if (message) {
        statusMessage += ' - ' + message;
      }
      
      // Cor baseada no progresso
      var color = '#fff3cd'; // Amarelo (em progresso)
      if (percent >= 100) {
        color = '#d4edda'; // Verde (concluído)
      }
      
      updateStatusCell('🔄 ' + statusMessage, color);
      
      // Log de progresso
      if (state.currentTransactionId) {
        AppLogger.debug('Progresso: ' + statusMessage, {
          transactionId: state.currentTransactionId,
          percent: percent,
          elapsed: formatDuration(getElapsedTime())
        });
      }
      
      // Força atualização visual
      try {
        SpreadsheetApp.flush();
      } catch (e) {
        // Ignora se não conseguir flush
      }
    },
    
    /**
     * Exibe notificação de sucesso
     * @param {string} title - Título
     * @param {string} message - Mensagem
     */
    notifySuccess: function(title, message) {
      return notifyUser(title, message, 'success');
    },
    
    /**
     * Exibe notificação de erro
     * @param {string} title - Título
     * @param {string} message - Mensagem
     */
    notifyError: function(title, message) {
      return notifyUser(title, message, 'error');
    },
    
    /**
     * Exibe notificação de aviso
     * @param {string} title - Título
     * @param {string} message - Mensagem
     */
    notifyWarning: function(title, message) {
      return notifyUser(title, message, 'warning');
    },
    
    /**
     * Exibe notificação informativa
     * @param {string} title - Título
     * @param {string} message - Mensagem
     */
    notifyInfo: function(title, message) {
      return notifyUser(title, message, 'info');
    },
    
    /**
     * Obtém o ID da transação atual
     * @returns {string|null} ID da transação ou null se não houver operação em andamento
     */
    getCurrentTransactionId: function() {
      return state.currentTransactionId;
    },
    
    /**
     * Obtém tempo decorrido da operação atual
     * @returns {number} Tempo em milissegundos
     */
    getElapsedTime: function() {
      return getElapsedTime();
    },
    
    /**
     * Formata duração para exibição
     * @param {number} ms - Milissegundos
     * @returns {string} Duração formatada
     */
    formatDuration: function(ms) {
      return formatDuration(ms);
    }
  };
})();

// ============================================================================
// FUNÇÕES GLOBAIS DE CONVENIÊNCIA
// ============================================================================

/**
 * Wrapper global para executar operações seguras
 * @see UXFeedback.executeSafeOperation
 */
function executeSafeOperation(operationName, callback, options) {
  return UXFeedback.executeSafeOperation(operationName, callback, options);
}

/**
 * Wrapper global para operações em lote
 * @see UXFeedback.executeBatchOperation
 */
function executeBatchOperation(operationName, items, processor, options) {
  return UXFeedback.executeBatchOperation(operationName, items, processor, options);
}

// ============================================================================
// REGISTRO DO MÓDULO
// ============================================================================

Logger.log('✅ Core_UX_Feedback carregado - Sistema de Feedback UX disponível');
