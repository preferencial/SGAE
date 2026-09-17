/**
 * @fileoverview Fluxo de Aprovação de Cardápios - Alimentação Escolar CRE-PP
 * @version 1.0.0
 * 
 * Intervenção 15/38: MenuWorkflow conforme Prompt 15
 * 
 * Workflow de aprovação de cardápios:
 * - Nutricionista elabora cardápio
 * - Supervisor revisa e aprova/rejeita
 * - Status atualizado para 'Publicado'
 * - Registro de pareceres técnicos
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-25
 */

'use strict';

// ============================================================================
// MENU WORKFLOW - Fluxo de Aprovação de Cardápios
// ============================================================================

var MenuWorkflow = (function() {
  
  // =========================================================================
  // CONFIGURAÇÃO
  // =========================================================================
  
  var CONFIG = {
    SHEETS: {
      CARDAPIOS_BASE: 'Cardapios_Base',
      CARDAPIOS_SEMANAIS: 'Cardapios_Semanais',
      PARECERES: 'Pareceres_Tecnicos',
      WORKFLOW_HISTORICO: 'Workflow_Historico'
    },
    
    // Estados do workflow
    STATUS: {
      RASCUNHO: 'RASCUNHO',
      EM_ELABORACAO: 'EM_ELABORACAO',
      AGUARDANDO_REVISAO: 'AGUARDANDO_REVISAO',
      EM_REVISAO: 'EM_REVISAO',
      APROVADO: 'APROVADO',
      REPROVADO: 'REPROVADO',
      PUBLICADO: 'PUBLICADO',
      ARQUIVADO: 'ARQUIVADO',
      CANCELADO: 'CANCELADO'
    },
    
    // Transições permitidas
    TRANSICOES: {
      RASCUNHO: ['EM_ELABORACAO', 'CANCELADO'],
      EM_ELABORACAO: ['AGUARDANDO_REVISAO', 'RASCUNHO', 'CANCELADO'],
      AGUARDANDO_REVISAO: ['EM_REVISAO', 'EM_ELABORACAO'],
      EM_REVISAO: ['APROVADO', 'REPROVADO'],
      APROVADO: ['PUBLICADO', 'ARQUIVADO'],
      REPROVADO: ['EM_ELABORACAO', 'ARQUIVADO'],
      PUBLICADO: ['ARQUIVADO'],
      ARQUIVADO: [],
      CANCELADO: []
    },
    
    // Perfis e permissões
    PERFIS: {
      NUTRICIONISTA: {
        nome: 'Nutricionista',
        acoes: ['criar', 'editar', 'enviar_revisao', 'corrigir']
      },
      SUPERVISOR: {
        nome: 'Supervisor Nutricional',
        acoes: ['revisar', 'aprovar', 'reprovar', 'solicitar_correcao']
      },
      COORDENADOR: {
        nome: 'Coordenador CRE',
        acoes: ['publicar', 'arquivar', 'visualizar_todos']
      },
      ADMIN: {
        nome: 'Administrador',
        acoes: ['todas']
      }
    },
    
    // Tipos de parecer
    TIPOS_PARECER: {
      APROVACAO: 'APROVACAO',
      REPROVACAO: 'REPROVACAO',
      SOLICITACAO_CORRECAO: 'SOLICITACAO_CORRECAO',
      OBSERVACAO: 'OBSERVACAO'
    }
  };

  // =========================================================================
  // FUNÇÕES PRIVADAS
  // =========================================================================
  
  function _getSheet(nome) {
    try {
      var ss = getSS();
      return ss.getSheetByName(nome);
    } catch (error) {
      Logger.log("Erro em _getSheet: " + error.message);
      throw error;
    }
  }
  
  function _generateId(prefix) {
    try {
      return (prefix || 'WF') + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6);
    } catch (error) {
      Logger.log("Erro em _generateId: " + error.message);
      throw error;
    }
  }
  
  function _getCurrentUser() {
    try {
      return Session.getActiveUser().getEmail() || 'sistema';
    } catch (e) {
      return 'sistema';
    }
  }
  
  function _rowToObject(row, headers) {
    var obj = {};
    headers.forEach(function(h, idx) { obj[h] = row[idx]; });
    return obj;
  }
  
  /**
   * Verifica se transição é permitida
   * @private
   */
  function _transicaoPermitida(statusAtual, novoStatus) {
    var permitidas = CONFIG.TRANSICOES[statusAtual] || [];
    return permitidas.indexOf(novoStatus) !== -1;
  }
  
  /**
   * Registra histórico de transição
   * @private
   */
  function _registrarHistorico(entidade, entidadeId, statusAnterior, statusNovo, comentario) {
    try {
      var sheet = _getSheet(CONFIG.SHEETS.WORKFLOW_HISTORICO);
      if (!sheet) return;
      
      var registro = [
        _generateId('HIST'),
        entidade,
        entidadeId,
        statusAnterior,
        statusNovo,
        _getCurrentUser(),
        new Date(),
        comentario || ''
      ];
      
      sheet.appendRow(registro);
      
    } catch (e) {
      console.error('Erro ao registrar histórico: ' + e.message);
    }
  }
  
  /**
   * Atualiza status na planilha
   * @private
   */
  function _atualizarStatus(sheetName, id, novoStatus, camposExtras) {
    try {
      try {
        try {
          try {
            var sheet = _getSheet(sheetName);
            if (!sheet || sheet.getLastRow() <= 1) {
              return { success: false, error: 'Planilha não encontrada' };
            }
      
            var data = sheet.getDataRange().getValues();
            var headers = data[0];
            var statusCol = headers.indexOf('Status');
      
            for (var i = 1; i < data.length; i++) {
              if (data[i][0] === id) {
                var statusAnterior = data[i][statusCol];
          
                // Verifica transição
                if (!_transicaoPermitida(statusAnterior, novoStatus)) {
                  return {
                    success: false,
                    error: 'Transição não permitida: ' + statusAnterior + ' → ' + novoStatus
                  };
                }
          
                // Atualiza status
                sheet.getRange(i + 1, statusCol + 1).setValue(novoStatus);
          
                // Atualiza campos extras
                if (camposExtras) {
                  for (var campo in camposExtras) {
                    var colIdx = headers.indexOf(campo);
                    if (colIdx !== -1) {
                      sheet.getRange(i + 1, colIdx + 1).setValue(camposExtras[campo]);
                    }
                  }
                }
          
                // Registra histórico
                _registrarHistorico(sheetName, id, statusAnterior, novoStatus, camposExtras ? camposExtras.comentario : '');
          
                return {
                  success: true,
                  statusAnterior: statusAnterior,
                  statusNovo: novoStatus
                };
              }
            }
      
            return { success: false, error: 'Registro não encontrado' };
      
          } catch (e) {
            return { success: false, error: e.message };
          }
        } catch (error) {
          Logger.log("Erro em _atualizarStatus: " + error.message);
          throw error; // Re-lança para tratamento superior
        }
      } catch (error) {
        Logger.log("Erro em _atualizarStatus: " + error.message);
        throw error;
      }
    } catch (error) {
      Logger.log("Erro em _atualizarStatus: " + error.message);
      throw error;
    }
  }

  // =========================================================================
  // API PÚBLICA
  // =========================================================================
  
  return {
    CONFIG: CONFIG,
    
    // -----------------------------------------------------------------------
    // AÇÕES DO NUTRICIONISTA
    // -----------------------------------------------------------------------
    
    /**
     * Inicia elaboração de cardápio
     * @param {string} cardapioId - ID do cardápio
     * @returns {Object} Resultado
     */
    iniciarElaboracao: function(cardapioId) {
      return _atualizarStatus(CONFIG.SHEETS.CARDAPIOS_BASE, cardapioId, CONFIG.STATUS.EM_ELABORACAO, {
        Elaborado_Por: _getCurrentUser(),
        Data_Inicio_Elaboracao: new Date()
      });
    },
    
    /**
     * Envia cardápio para revisão do supervisor
     * @param {string} cardapioId - ID do cardápio
     * @param {string} [observacoes] - Observações do nutricionista
     * @returns {Object} Resultado
     */
    enviarParaRevisao: function(cardapioId, observacoes) {
      // Valida cardápio antes de enviar
      if (typeof NutritionValidator !== 'undefined') {
        var validacao = api_validar_cardapio_por_id(cardapioId);
        if (validacao && !validacao.aprovado) {
          return {
            success: false,
            error: 'Cardápio não passou na validação nutricional',
            validacao: validacao
          };
        }
      }
      
      var resultado = _atualizarStatus(CONFIG.SHEETS.CARDAPIOS_BASE, cardapioId, CONFIG.STATUS.AGUARDANDO_REVISAO, {
        Data_Envio_Revisao: new Date(),
        Observacoes_Nutricionista: observacoes || '',
        comentario: 'Enviado para revisão: ' + (observacoes || '')
      });
      
      // Notifica supervisor
      if (resultado.success && typeof NotificationService !== 'undefined') {
        NotificationService.criar({
          tipo: 'CARDAPIO_PENDENTE',
          titulo: 'Cardápio aguardando revisão',
          mensagem: 'Um novo cardápio foi enviado para sua revisão.',
          canal: 'INTERNO',
          prioridade: 2
        });
      }
      
      return resultado;
    },
    
    /**
     * Retorna cardápio para rascunho (cancelar envio)
     * @param {string} cardapioId - ID do cardápio
     * @returns {Object} Resultado
     */
    retornarParaRascunho: function(cardapioId) {
      return _atualizarStatus(CONFIG.SHEETS.CARDAPIOS_BASE, cardapioId, CONFIG.STATUS.RASCUNHO, {
        comentario: 'Retornado para rascunho pelo elaborador'
      });
    },
    
    // -----------------------------------------------------------------------
    // AÇÕES DO SUPERVISOR
    // -----------------------------------------------------------------------
    
    /**
     * Inicia revisão do cardápio
     * @param {string} cardapioId - ID do cardápio
     * @returns {Object} Resultado
     */
    iniciarRevisao: function(cardapioId) {
      return _atualizarStatus(CONFIG.SHEETS.CARDAPIOS_BASE, cardapioId, CONFIG.STATUS.EM_REVISAO, {
        Revisor: _getCurrentUser(),
        Data_Inicio_Revisao: new Date()
      });
    },
    
    /**
     * Aprova cardápio
     * @param {string} cardapioId - ID do cardápio
     * @param {string} parecer - Parecer técnico
     * @returns {Object} Resultado
     */
    aprovar: function(cardapioId, parecer) {
      var resultado = _atualizarStatus(CONFIG.SHEETS.CARDAPIOS_BASE, cardapioId, CONFIG.STATUS.APROVADO, {
        Aprovado_Por: _getCurrentUser(),
        Data_Aprovacao: new Date(),
        Parecer_Aprovacao: parecer || 'Aprovado',
        comentario: 'Aprovado: ' + (parecer || '')
      });
      
      if (resultado.success) {
        // Registra parecer técnico
        this._registrarParecer(cardapioId, CONFIG.TIPOS_PARECER.APROVACAO, parecer, 'APROVADO');
      }
      
      return resultado;
    },
    
    /**
     * Reprova cardápio
     * @param {string} cardapioId - ID do cardápio
     * @param {string} motivo - Motivo da reprovação
     * @param {Array} [pontosCorrecao] - Lista de pontos a corrigir
     * @returns {Object} Resultado
     */
    reprovar: function(cardapioId, motivo, pontosCorrecao) {
      try {
        var parecerCompleto = motivo;
        if (pontosCorrecao && pontosCorrecao.length > 0) {
          parecerCompleto += '\n\nPontos a corrigir:\n- ' + pontosCorrecao.join('\n- ');
        }
      
        var resultado = _atualizarStatus(CONFIG.SHEETS.CARDAPIOS_BASE, cardapioId, CONFIG.STATUS.REPROVADO, {
          Reprovado_Por: _getCurrentUser(),
          Data_Reprovacao: new Date(),
          Motivo_Reprovacao: parecerCompleto,
          comentario: 'Reprovado: ' + motivo
        });
      
        if (resultado.success) {
          this._registrarParecer(cardapioId, CONFIG.TIPOS_PARECER.REPROVACAO, parecerCompleto, 'REPROVADO');
        
          // Notifica nutricionista
          if (typeof NotificationService !== 'undefined') {
            NotificationService.criar({
              tipo: 'SISTEMA',
              titulo: 'Cardápio reprovado',
              mensagem: 'Seu cardápio foi reprovado. Motivo: ' + motivo,
              canal: 'INTERNO',
              prioridade: 2
            });
          }
        }
      
        return resultado;
      } catch (error) {
        Logger.log("Erro em reprovar: " + error.message);
        throw error;
      }
    },
    
    /**
     * Solicita correções no cardápio
     * @param {string} cardapioId - ID do cardápio
     * @param {string} observacoes - Observações/correções necessárias
     * @returns {Object} Resultado
     */
    solicitarCorrecao: function(cardapioId, observacoes) {
      var resultado = _atualizarStatus(CONFIG.SHEETS.CARDAPIOS_BASE, cardapioId, CONFIG.STATUS.EM_ELABORACAO, {
        Correcoes_Solicitadas: observacoes,
        Data_Solicitacao_Correcao: new Date(),
        comentario: 'Correções solicitadas: ' + observacoes
      });
      
      if (resultado.success) {
        this._registrarParecer(cardapioId, CONFIG.TIPOS_PARECER.SOLICITACAO_CORRECAO, observacoes, 'PENDENTE');
      }
      
      return resultado;
    },

    // -----------------------------------------------------------------------
    // AÇÕES DO COORDENADOR
    // -----------------------------------------------------------------------
    
    /**
     * Publica cardápio aprovado
     * @param {string} cardapioId - ID do cardápio
     * @returns {Object} Resultado
     */
    publicar: function(cardapioId) {
      var resultado = _atualizarStatus(CONFIG.SHEETS.CARDAPIOS_BASE, cardapioId, CONFIG.STATUS.PUBLICADO, {
        Publicado_Por: _getCurrentUser(),
        Data_Publicacao: new Date(),
        comentario: 'Cardápio publicado'
      });
      
      if (resultado.success) {
        // Notifica escolas
        if (typeof NotificationService !== 'undefined') {
          NotificationService.criar({
            tipo: 'SISTEMA',
            titulo: 'Novo cardápio publicado',
            mensagem: 'Um novo cardápio foi publicado e está disponível para consulta.',
            canal: 'INTERNO',
            prioridade: 3
          });
        }
      }
      
      return resultado;
    },
    
    /**
     * Arquiva cardápio
     * @param {string} cardapioId - ID do cardápio
     * @param {string} [motivo] - Motivo do arquivamento
     * @returns {Object} Resultado
     */
    arquivar: function(cardapioId, motivo) {
      return _atualizarStatus(CONFIG.SHEETS.CARDAPIOS_BASE, cardapioId, CONFIG.STATUS.ARQUIVADO, {
        Arquivado_Por: _getCurrentUser(),
        Data_Arquivamento: new Date(),
        Motivo_Arquivamento: motivo || '',
        comentario: 'Arquivado: ' + (motivo || 'Sem motivo informado')
      });
    },
    
    /**
     * Cancela cardápio
     * @param {string} cardapioId - ID do cardápio
     * @param {string} motivo - Motivo do cancelamento
     * @returns {Object} Resultado
     */
    cancelar: function(cardapioId, motivo) {
      return _atualizarStatus(CONFIG.SHEETS.CARDAPIOS_BASE, cardapioId, CONFIG.STATUS.CANCELADO, {
        Cancelado_Por: _getCurrentUser(),
        Data_Cancelamento: new Date(),
        Motivo_Cancelamento: motivo,
        comentario: 'Cancelado: ' + motivo
      });
    },
    
    // -----------------------------------------------------------------------
    // PARECERES TÉCNICOS
    // -----------------------------------------------------------------------
    
    /**
     * Registra parecer técnico
     * @private
     */
    _registrarParecer: function(cardapioId, tipo, parecer, resultado) {
      try {
        var sheet = _getSheet(CONFIG.SHEETS.PARECERES);
        if (!sheet) return;
        
        var registro = [
          _generateId('PAR'),
          'CARDAPIO',
          cardapioId,
          parecer,
          resultado,
          _getCurrentUser(),
          new Date(),
          '',  // Assinatura digital (futuro)
          ''   // Observações
        ];
        
        sheet.appendRow(registro);
        
      } catch (e) {
        console.error('Erro ao registrar parecer: ' + e.message);
      }
    },
    
    /**
     * Adiciona parecer/observação ao cardápio
     * @param {string} cardapioId - ID do cardápio
     * @param {string} parecer - Texto do parecer
     * @param {string} [tipo] - Tipo do parecer
     * @returns {Object} Resultado
     */
    adicionarParecer: function(cardapioId, parecer, tipo) {
      try {
        this._registrarParecer(
          cardapioId, 
          tipo || CONFIG.TIPOS_PARECER.OBSERVACAO, 
          parecer, 
          'REGISTRADO'
        );
        
        return { success: true, message: 'Parecer registrado' };
        
      } catch (e) {
        return { success: false, error: e.message };
      }
    },
    
    /**
     * Obtém pareceres de um cardápio
     * @param {string} cardapioId - ID do cardápio
     * @returns {Object} Lista de pareceres
     */
    obterPareceres: function(cardapioId) {
      try {
        var sheet = _getSheet(CONFIG.SHEETS.PARECERES);
        if (!sheet || sheet.getLastRow() <= 1) {
          return { success: true, pareceres: [] };
        }
        
        var data = sheet.getDataRange().getValues();
        var headers = data[0];
        var pareceres = [];
        
        for (var i = 1; i < data.length; i++) {
          var row = _rowToObject(data[i], headers);
          if (row.Referencia_ID === cardapioId) {
            pareceres.push(row);
          }
        }
        
        // Ordena por data (mais recente primeiro)
        pareceres.sort(function(a, b) {
          return new Date(b.Data_Parecer) - new Date(a.Data_Parecer);
        });
        
        return { success: true, pareceres: pareceres, count: pareceres.length };
        
      } catch (e) {
        return { success: false, error: e.message };
      }
    },

    // -----------------------------------------------------------------------
    // CONSULTAS E RELATÓRIOS
    // -----------------------------------------------------------------------
    
    /**
     * Obtém status atual do cardápio
     * @param {string} cardapioId - ID do cardápio
     * @returns {Object} Status e informações
     */
    obterStatus: function(cardapioId) {
      try {
        try {
          var sheet = _getSheet(CONFIG.SHEETS.CARDAPIOS_BASE);
          if (!sheet || sheet.getLastRow() <= 1) {
            return { success: false, error: 'Cardápio não encontrado' };
          }
        
          var data = sheet.getDataRange().getValues();
          var headers = data[0];
        
          for (var i = 1; i < data.length; i++) {
            if (data[i][0] === cardapioId) {
              var cardapio = _rowToObject(data[i], headers);
            
              return {
                success: true,
                id: cardapioId,
                status: cardapio.Status,
                transicoesPermitidas: CONFIG.TRANSICOES[cardapio.Status] || [],
                elaboradoPor: cardapio.Elaborado_Por,
                aprovadoPor: cardapio.Aprovado_Por,
                dataAprovacao: cardapio.Data_Aprovacao,
                parecer: cardapio.Parecer_Aprovacao || cardapio.Motivo_Reprovacao
              };
            }
          }
        
          return { success: false, error: 'Cardápio não encontrado' };
        
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em obterStatus: " + error.message);
        throw error;
      }
    },
    
    /**
     * Lista cardápios por status
     * @param {string} status - Status desejado
     * @returns {Object} Lista de cardápios
     */
    listarPorStatus: function(status) {
      try {
        try {
          var sheet = _getSheet(CONFIG.SHEETS.CARDAPIOS_BASE);
          if (!sheet || sheet.getLastRow() <= 1) {
            return { success: true, cardapios: [] };
          }
        
          var data = sheet.getDataRange().getValues();
          var headers = data[0];
          var cardapios = [];
        
          for (var i = 1; i < data.length; i++) {
            var row = _rowToObject(data[i], headers);
            if (row.Status === status) {
              cardapios.push(row);
            }
          }
        
          return { success: true, cardapios: cardapios, count: cardapios.length };
        
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em listarPorStatus: " + error.message);
        throw error;
      }
    },
    
    /**
     * Lista cardápios pendentes de revisão
     * @returns {Object} Lista
     */
    listarPendentesRevisao: function() {
      return this.listarPorStatus(CONFIG.STATUS.AGUARDANDO_REVISAO);
    },
    
    /**
     * Lista cardápios em elaboração
     * @returns {Object} Lista
     */
    listarEmElaboracao: function() {
      return this.listarPorStatus(CONFIG.STATUS.EM_ELABORACAO);
    },
    
    /**
     * Lista cardápios publicados
     * @returns {Object} Lista
     */
    listarPublicados: function() {
      return this.listarPorStatus(CONFIG.STATUS.PUBLICADO);
    },
    
    /**
     * Obtém histórico de workflow de um cardápio
     * @param {string} cardapioId - ID do cardápio
     * @returns {Object} Histórico
     */
    obterHistorico: function(cardapioId) {
      try {
        var sheet = _getSheet(CONFIG.SHEETS.WORKFLOW_HISTORICO);
        if (!sheet || sheet.getLastRow() <= 1) {
          return { success: true, historico: [] };
        }
        
        var data = sheet.getDataRange().getValues();
        var headers = data[0];
        var historico = [];
        
        for (var i = 1; i < data.length; i++) {
          var row = _rowToObject(data[i], headers);
          if (row.Entidade_ID === cardapioId) {
            historico.push(row);
          }
        }
        
        // Ordena por data
        historico.sort(function(a, b) {
          return new Date(a.Data_Transicao) - new Date(b.Data_Transicao);
        });
        
        return { success: true, historico: historico, count: historico.length };
        
      } catch (e) {
        return { success: false, error: e.message };
      }
    },
    
    /**
     * Obtém estatísticas do workflow
     * @returns {Object} Estatísticas
     */
    obterEstatisticas: function() {
      try {
        try {
          var sheet = _getSheet(CONFIG.SHEETS.CARDAPIOS_BASE);
          if (!sheet || sheet.getLastRow() <= 1) {
            return { success: true, estatisticas: {} };
          }
        
          var data = sheet.getDataRange().getValues();
          var headers = data[0];
          var statusCol = headers.indexOf('Status');
        
          var stats = {
            total: data.length - 1,
            porStatus: {}
          };
        
          // Inicializa contadores
          for (var s in CONFIG.STATUS) {
            stats.porStatus[CONFIG.STATUS[s]] = 0;
          }
        
          for (var i = 1; i < data.length; i++) {
            var status = data[i][statusCol];
            stats.porStatus[status] = (stats.porStatus[status] || 0) + 1;
          }
        
          stats.pendentesRevisao = stats.porStatus[CONFIG.STATUS.AGUARDANDO_REVISAO] || 0;
          stats.emElaboracao = stats.porStatus[CONFIG.STATUS.EM_ELABORACAO] || 0;
          stats.publicados = stats.porStatus[CONFIG.STATUS.PUBLICADO] || 0;
        
          return { success: true, estatisticas: stats };
        
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em obterEstatisticas: " + error.message);
        throw error;
      }
    },
    
    /**
     * Obtém configurações do workflow
     * @returns {Object} Configurações
     */
    obterConfiguracoes: function() {
      return {
        status: CONFIG.STATUS,
        transicoes: CONFIG.TRANSICOES,
        perfis: CONFIG.PERFIS,
        tiposParecer: CONFIG.TIPOS_PARECER
      };
    }
  };
})();


// ============================================================================
// FUNÇÕES GLOBAIS DE API
// ============================================================================

// --- Ações do Nutricionista ---

/**
 * API: Inicia elaboração
 */
function api_workflow_iniciar_elaboracao(cardapioId) {
  return MenuWorkflow.iniciarElaboracao(cardapioId);
}

/**
 * API: Envia para revisão
 */
function api_workflow_enviar_revisao(cardapioId, observacoes) {
  return MenuWorkflow.enviarParaRevisao(cardapioId, observacoes);
}

/**
 * API: Retorna para rascunho
 */
function api_workflow_retornar_rascunho(cardapioId) {
  return MenuWorkflow.retornarParaRascunho(cardapioId);
}

// --- Ações do Supervisor ---

/**
 * API: Inicia revisão
 */
function api_workflow_iniciar_revisao(cardapioId) {
  return MenuWorkflow.iniciarRevisao(cardapioId);
}

/**
 * API: Aprova cardápio
 */
function api_workflow_aprovar(cardapioId, parecer) {
  return MenuWorkflow.aprovar(cardapioId, parecer);
}

/**
 * API: Reprova cardápio
 */
function api_workflow_reprovar(cardapioId, motivo, pontosCorrecao) {
  return MenuWorkflow.reprovar(cardapioId, motivo, pontosCorrecao);
}

/**
 * API: Solicita correção
 */
function api_workflow_solicitar_correcao(cardapioId, observacoes) {
  return MenuWorkflow.solicitarCorrecao(cardapioId, observacoes);
}

// --- Ações do Coordenador ---

/**
 * API: Publica cardápio
 */
function api_workflow_publicar(cardapioId) {
  return MenuWorkflow.publicar(cardapioId);
}

/**
 * API: Arquiva cardápio
 */
function api_workflow_arquivar(cardapioId, motivo) {
  return MenuWorkflow.arquivar(cardapioId, motivo);
}

/**
 * API: Cancela cardápio
 */
function api_workflow_cancelar(cardapioId, motivo) {
  return MenuWorkflow.cancelar(cardapioId, motivo);
}

// --- Pareceres ---

/**
 * API: Adiciona parecer
 */
function api_workflow_adicionar_parecer(cardapioId, parecer, tipo) {
  return MenuWorkflow.adicionarParecer(cardapioId, parecer, tipo);
}

/**
 * API: Obtém pareceres
 */
function api_workflow_pareceres(cardapioId) {
  return MenuWorkflow.obterPareceres(cardapioId);
}

// --- Consultas ---

/**
 * API: Obtém status
 */
function api_workflow_status(cardapioId) {
  return MenuWorkflow.obterStatus(cardapioId);
}

/**
 * API: Lista por status
 */
function api_workflow_listar_por_status(status) {
  return MenuWorkflow.listarPorStatus(status);
}

/**
 * API: Lista pendentes de revisão
 */
function api_workflow_pendentes_revisao() {
  return MenuWorkflow.listarPendentesRevisao();
}

/**
 * API: Lista publicados
 */
function api_workflow_publicados() {
  return MenuWorkflow.listarPublicados();
}

/**
 * API: Obtém histórico
 */
function api_workflow_historico(cardapioId) {
  return MenuWorkflow.obterHistorico(cardapioId);
}

/**
 * API: Estatísticas
 */
function api_workflow_estatisticas() {
  return MenuWorkflow.obterEstatisticas();
}

/**
 * API: Configurações
 */
function api_workflow_config() {
  return MenuWorkflow.obterConfiguracoes();
}

// ============================================================================
// REGISTRO DO MÓDULO
// ============================================================================

Logger.log('✅ Core_Menu_Workflow.gs carregado - MenuWorkflow disponível');
