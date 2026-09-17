/**
 * @fileoverview Fluxo de Atesto de Notas Fiscais - Alimentação Escolar CRE-PP
 * @version 1.0.0
 * 
 * Intervenção 26/38: InvoiceWorkflow conforme Prompt 26
 * 
 * Fluxo de Atesto:
 * 1. Recebimento na UE (Escola)
 * 2. Conferência na UNIAE
 * 3. Atesto do Executor
 * 4. Envio para Pagamento
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-25
 */

'use strict';

// ============================================================================
// INVOICE WORKFLOW - Fluxo de Atesto de NF
// ============================================================================

var InvoiceWorkflow = (function() {
  
  // =========================================================================
  // CONFIGURAÇÃO
  // =========================================================================
  
  var CONFIG = {
    // Planilha
    NF_SHEET: 'Notas_Fiscais',
    HISTORICO_SHEET: 'Historico_NF',
    
    // Status do workflow
    STATUS: {
      LANCADA: { codigo: 'LANCADA', nome: 'Lançada', ordem: 1, cor: '#9E9E9E' },
      RECEBIDA_UE: { codigo: 'RECEBIDA_UE', nome: 'Recebida na UE', ordem: 2, cor: '#2196F3' },
      CONFERENCIA: { codigo: 'CONFERENCIA', nome: 'Em Conferência', ordem: 3, cor: '#FF9800' },
      CONFERIDA: { codigo: 'CONFERIDA', nome: 'Conferida', ordem: 4, cor: '#8BC34A' },
      AGUARDANDO_ATESTO: { codigo: 'AGUARDANDO_ATESTO', nome: 'Aguardando Atesto', ordem: 5, cor: '#FFC107' },
      ATESTADA: { codigo: 'ATESTADA', nome: 'Atestada', ordem: 6, cor: '#4CAF50' },
      ENVIADA_PAGAMENTO: { codigo: 'ENVIADA_PAGAMENTO', nome: 'Enviada p/ Pagamento', ordem: 7, cor: '#3F51B5' },
      PAGA: { codigo: 'PAGA', nome: 'Paga', ordem: 8, cor: '#2E7D32' },
      RECUSADA: { codigo: 'RECUSADA', nome: 'Recusada', ordem: -1, cor: '#F44336' },
      CANCELADA: { codigo: 'CANCELADA', nome: 'Cancelada', ordem: -2, cor: '#9E9E9E' }
    },
    
    // Transições permitidas
    TRANSICOES: {
      LANCADA: ['RECEBIDA_UE', 'CANCELADA'],
      RECEBIDA_UE: ['CONFERENCIA', 'RECUSADA'],
      CONFERENCIA: ['CONFERIDA', 'RECUSADA'],
      CONFERIDA: ['AGUARDANDO_ATESTO'],
      AGUARDANDO_ATESTO: ['ATESTADA', 'RECUSADA'],
      ATESTADA: ['ENVIADA_PAGAMENTO'],
      ENVIADA_PAGAMENTO: ['PAGA'],
      PAGA: [],
      RECUSADA: ['LANCADA'],
      CANCELADA: []
    },
    
    // Perfis autorizados por etapa
    AUTORIZACOES: {
      RECEBIDA_UE: ['representante', 'gestor_ue'],
      CONFERENCIA: ['analista', 'conferente'],
      CONFERIDA: ['analista', 'conferente'],
      AGUARDANDO_ATESTO: ['analista'],
      ATESTADA: ['executor', 'gestor'],
      ENVIADA_PAGAMENTO: ['executor', 'gestor'],
      PAGA: ['financeiro', 'gestor']
    },
    
    // Prazos (dias úteis)
    PRAZOS: {
      RECEBIMENTO: 2,
      CONFERENCIA: 3,
      ATESTO: 5,
      PAGAMENTO: 30
    }
  };
  
  // =========================================================================
  // FUNÇÕES PRIVADAS
  // =========================================================================
  
  function _gerarId(prefixo) {
    try {
      return (prefixo || 'ID') + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    } catch (error) {
      Logger.log("Erro em _gerarId: " + error.message);
      throw error;
    }
  }
  
  function _formatarMoeda(valor) {
    try {
      return 'R$ ' + Number(valor || 0).toLocaleString('pt-BR', {
        minimumFractionDigits: 2, maximumFractionDigits: 2
      });
    } catch (error) {
      Logger.log("Erro em _formatarMoeda: " + error.message);
      throw error;
    }
  }
  
  function _getData(sheetName, filtros) {
    try {
      if (typeof DatabaseEngine !== 'undefined') {
        return DatabaseEngine.read(sheetName, filtros);
      }
      try {
        var ss = getSS();
        var sheet = ss.getSheetByName(sheetName);
        if (!sheet) return [];
      
        var data = sheet.getDataRange().getValues();
        if (data.length < 2) return [];
      
        var headers = data[0];
        var result = [];
      
        for (var i = 1; i < data.length; i++) {
          var row = {};
          for (var j = 0; j < headers.length; j++) {
            row[headers[j]] = data[i][j];
          }
          result.push(row);
        }
      
        if (filtros) {
          result = result.filter(function(item) {
            for (var key in filtros) {
              if (item[key] !== filtros[key]) return false;
            }
            return true;
          });
        }
      
        return result;
      } catch (e) {
        return [];
      }
    } catch (error) {
      Logger.log("Erro em _getData: " + error.message);
      throw error;
    }
  }
  
  function _saveData(sheetName, dados) {
    try {
      try {
        try {
          if (typeof DatabaseEngine !== 'undefined') {
            return DatabaseEngine.create(sheetName, dados);
          }
          try {
            var ss = getSS();
            var sheet = ss.getSheetByName(sheetName);
            if (!sheet) return null;
      
            var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
            var row = headers.map(function(h) { return dados[h] || ''; });
            sheet.appendRow(row);
            return dados;
          } catch (e) {
            return null;
          }
        } catch (error) {
          Logger.log("Erro em _saveData: " + error.message);
          throw error; // Re-lança para tratamento superior
        }
      } catch (error) {
        Logger.log("Erro em _saveData: " + error.message);
        throw error;
      }
    } catch (error) {
      Logger.log("Erro em _saveData: " + error.message);
      throw error;
    }
  }
  
  function _updateData(sheetName, id, dados) {
    if (typeof DatabaseEngine !== 'undefined') {
      return DatabaseEngine.update(sheetName, id, dados);
    }
    return null;
  }
  
  /**
   * Verifica se transição é permitida
   * @private
   */
  function _transicaoPermitida(statusAtual, novoStatus) {
    var permitidas = CONFIG.TRANSICOES[statusAtual];
    return permitidas && permitidas.indexOf(novoStatus) !== -1;
  }
  
  /**
   * Verifica autorização do usuário
   * @private
   */
  function _usuarioAutorizado(status, perfilUsuario) {
    var perfisAutorizados = CONFIG.AUTORIZACOES[status];
    if (!perfisAutorizados) return true;
    return perfisAutorizados.indexOf(perfilUsuario) !== -1;
  }
  
  /**
   * Registra histórico de transição
   * @private
   */
  function _registrarHistorico(nfId, statusAnterior, novoStatus, dados) {
    try {
      var historico = {
        id: _gerarId('HIST'),
        nota_fiscal_id: nfId,
        status_anterior: statusAnterior,
        status_novo: novoStatus,
        observacao: dados.observacao || '',
        usuario: Session.getActiveUser().getEmail(),
        data: new Date().toISOString()
      };
    
      _saveData(CONFIG.HISTORICO_SHEET, historico);
    
      // Auditoria
      if (typeof AuditService !== 'undefined') {
        AuditService.log('NF_TRANSICAO_STATUS', {
          nfId: nfId,
          de: statusAnterior,
          para: novoStatus
        });
      }
    
      return historico;
    } catch (error) {
      Logger.log("Erro em _registrarHistorico: " + error.message);
      throw error;
    }
  }
  
  /**
   * Envia notificação de mudança de status
   * @private
   */
  function _notificarMudancaStatus(nf, novoStatus, dados) {
    if (typeof NotificationService === 'undefined') return;
    
    var statusConfig = CONFIG.STATUS[novoStatus];
    var destinatarios = [];
    var mensagem = '';
    
    switch (novoStatus) {
      case 'RECEBIDA_UE':
        destinatarios = ['uniae@cre-pp.gov.br'];
        mensagem = 'NF ' + nf.numero + ' recebida na escola ' + (dados.escola || '');
        break;
      case 'CONFERIDA':
        destinatarios = [nf.fornecedor_email];
        mensagem = 'NF ' + nf.numero + ' conferida. Aguardando atesto.';
        break;
      case 'ATESTADA':
        destinatarios = [nf.fornecedor_email, 'financeiro@cre-pp.gov.br'];
        mensagem = 'NF ' + nf.numero + ' atestada. Valor: ' + _formatarMoeda(nf.valor_liquido);
        break;
      case 'PAGA':
        destinatarios = [nf.fornecedor_email];
        mensagem = 'NF ' + nf.numero + ' paga. Valor: ' + _formatarMoeda(nf.valor_pago);
        break;
      case 'RECUSADA':
        destinatarios = [nf.fornecedor_email];
        mensagem = 'NF ' + nf.numero + ' recusada. Motivo: ' + (dados.motivo || 'Não informado');
        break;
    }
    
    if (destinatarios.length > 0) {
      NotificationService.enviar({
        tipo: 'NF_STATUS_' + novoStatus,
        titulo: 'NF ' + nf.numero + ' - ' + statusConfig.nome,
        mensagem: mensagem,
        destinatarios: destinatarios,
        prioridade: novoStatus === 'RECUSADA' ? 'ALTA' : 'MEDIA'
      });
    }
  }

  // =========================================================================
  // API PÚBLICA - CRUD NF
  // =========================================================================
  
  /**
   * Lança nova Nota Fiscal
   * @param {Object} dados - Dados da NF
   * @returns {Object} Resultado
   */
  function lancarNF(dados) {
    try {
      if (!dados) {
        return { success: false, error: 'Dados são obrigatórios' };
      }
    
      var erros = [];
      if (!dados.numero) erros.push('Número da NF é obrigatório');
      if (!dados.chave_acesso || dados.chave_acesso.length !== 44) erros.push('Chave de acesso inválida');
      if (!dados.fornecedor_id) erros.push('Fornecedor é obrigatório');
      if (!dados.empenho_id) erros.push('Empenho é obrigatório');
      if (!dados.valor || dados.valor <= 0) erros.push('Valor deve ser maior que zero');
    
      if (erros.length > 0) {
        return { success: false, errors: erros };
      }
    
      // Verifica duplicidade
      var existente = _getData(CONFIG.NF_SHEET, { chave_acesso: dados.chave_acesso });
      if (existente && existente.length > 0) {
        return { success: false, error: 'NF já cadastrada com esta chave de acesso' };
      }
    
      // Verifica saldo do empenho
      if (typeof ContractService !== 'undefined') {
        var saldo = ContractService.consultarSaldo(dados.empenho_id);
        if (saldo.success && saldo.data.saldoDisponivel < dados.valor) {
          return {
            success: false,
            error: 'Saldo insuficiente no empenho',
            saldoDisponivel: saldo.data.saldoDisponivel
          };
        }
      }
    
      try {
        var nf = {
          id: _gerarId('NF'),
          numero: dados.numero,
          serie: dados.serie || '1',
          chave_acesso: dados.chave_acesso,
        
          // Fornecedor
          fornecedor_id: dados.fornecedor_id,
          fornecedor_nome: dados.fornecedor_nome || '',
          fornecedor_cnpj: dados.fornecedor_cnpj || '',
          fornecedor_email: dados.fornecedor_email || '',
        
          // Empenho/Contrato
          empenho_id: dados.empenho_id,
          empenho_numero: dados.empenho_numero || '',
          contrato_id: dados.contrato_id || '',
          contrato_numero: dados.contrato_numero || '',
        
          // Valores
          valor_bruto: Number(dados.valor),
          valor_glosas: 0,
          valor_liquido: Number(dados.valor),
          valor_pago: 0,
        
          // Datas
          data_emissao: dados.data_emissao ? new Date(dados.data_emissao).toISOString() : new Date().toISOString(),
          data_lancamento: new Date().toISOString(),
          data_recebimento: null,
          data_conferencia: null,
          data_atesto: null,
          data_pagamento: null,
        
          // Arquivos
          xml_arquivo_id: dados.xml_arquivo_id || '',
          pdf_arquivo_id: dados.pdf_arquivo_id || '',
        
          // Status
          status: CONFIG.STATUS.LANCADA.codigo,
          status_nome: CONFIG.STATUS.LANCADA.nome,
        
          // Escola destino
          escola_id: dados.escola_id || '',
          escola_nome: dados.escola_nome || '',
        
          // Metadados
          criado_por: Session.getActiveUser().getEmail(),
          criado_em: new Date().toISOString(),
          atualizado_em: new Date().toISOString()
        };
      
        var resultado = _saveData(CONFIG.NF_SHEET, nf);
      
        if (!resultado) {
          return { success: false, error: 'Erro ao salvar NF' };
        }
      
        // Registra histórico
        _registrarHistorico(nf.id, null, CONFIG.STATUS.LANCADA.codigo, {
          observacao: 'NF lançada no sistema'
        });
      
        return {
          success: true,
          data: nf,
          message: 'Nota Fiscal lançada com sucesso'
        };
      
      } catch (e) {
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em lancarNF: " + error.message);
      throw error;
    }
  }
  
  /**
   * Busca NF por ID
   * @param {string} id - ID da NF
   * @returns {Object} NF
   */
  function buscarNF(id) {
    if (!id) {
      return { success: false, error: 'ID é obrigatório' };
    }
    
    try {
      var nfs = _getData(CONFIG.NF_SHEET, { id: id });
      
      if (!nfs || nfs.length === 0) {
        return { success: false, error: 'NF não encontrada' };
      }
      
      var nf = nfs[0];
      
      // Adiciona informações do status
      nf.statusConfig = CONFIG.STATUS[nf.status];
      
      // Busca histórico
      nf.historico = _getData(CONFIG.HISTORICO_SHEET, { nota_fiscal_id: id });
      
      // Busca glosas
      if (typeof PenaltyService !== 'undefined') {
        var glosas = PenaltyService.getTotalGlosasNF(id);
        if (glosas.success) {
          nf.glosas = glosas.data;
        }
      }
      
      return { success: true, data: nf };
      
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
  
  /**
   * Lista NFs
   * @param {Object} filtros - Filtros
   * @returns {Object} Lista de NFs
   */
  function listarNFs(filtros) {
    try {
      filtros = filtros || {};
    
      try {
        var nfs = _getData(CONFIG.NF_SHEET, {});
      
        // Aplica filtros
        if (filtros.status) {
          nfs = nfs.filter(function(nf) { return nf.status === filtros.status; });
        }
      
        if (filtros.fornecedor_id) {
          nfs = nfs.filter(function(nf) { return nf.fornecedor_id === filtros.fornecedor_id; });
        }
      
        if (filtros.empenho_id) {
          nfs = nfs.filter(function(nf) { return nf.empenho_id === filtros.empenho_id; });
        }
      
        if (filtros.escola_id) {
          nfs = nfs.filter(function(nf) { return nf.escola_id === filtros.escola_id; });
        }
      
        // Adiciona config de status
        nfs = nfs.map(function(nf) {
          nf.statusConfig = CONFIG.STATUS[nf.status];
          return nf;
        });
      
        // Ordena por data de lançamento (mais recente primeiro)
        nfs.sort(function(a, b) {
          return new Date(b.data_lancamento) - new Date(a.data_lancamento);
        });
      
        // Calcula totais
        var valorTotal = nfs.reduce(function(sum, nf) { return sum + (nf.valor_bruto || 0); }, 0);
      
        return {
          success: true,
          data: {
            notas: nfs,
            total: nfs.length,
            valorTotal: valorTotal,
            valorTotalFormatado: _formatarMoeda(valorTotal)
          }
        };
      
      } catch (e) {
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em listarNFs: " + error.message);
      throw error;
    }
  }
  
  // =========================================================================
  // API PÚBLICA - TRANSIÇÕES DE STATUS
  // =========================================================================
  
  /**
   * Registra recebimento na UE
   * @param {string} nfId - ID da NF
   * @param {Object} dados - Dados do recebimento
   * @returns {Object} Resultado
   */
  function registrarRecebimentoUE(nfId, dados) {
    if (!nfId) {
      return { success: false, error: 'ID da NF é obrigatório' };
    }
    
    try {
      var nf = buscarNF(nfId);
      if (!nf.success) return nf;
      
      if (!_transicaoPermitida(nf.data.status, 'RECEBIDA_UE')) {
        return { success: false, error: 'Transição de status não permitida' };
      }
      
      var atualizacao = {
        status: CONFIG.STATUS.RECEBIDA_UE.codigo,
        status_nome: CONFIG.STATUS.RECEBIDA_UE.nome,
        data_recebimento: new Date().toISOString(),
        recebido_por: dados.responsavel || Session.getActiveUser().getEmail(),
        escola_id: dados.escola_id || nf.data.escola_id,
        escola_nome: dados.escola_nome || nf.data.escola_nome,
        atualizado_em: new Date().toISOString()
      };
      
      _updateData(CONFIG.NF_SHEET, nfId, atualizacao);
      
      _registrarHistorico(nfId, nf.data.status, 'RECEBIDA_UE', {
        observacao: 'Recebido na escola ' + atualizacao.escola_nome
      });
      
      _notificarMudancaStatus(nf.data, 'RECEBIDA_UE', dados);
      
      return {
        success: true,
        message: 'Recebimento registrado com sucesso'
      };
      
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
  
  /**
   * Inicia conferência na UNIAE
   * @param {string} nfId - ID da NF
   * @param {Object} dados - Dados
   * @returns {Object} Resultado
   */
  function iniciarConferencia(nfId, dados) {
    if (!nfId) {
      return { success: false, error: 'ID da NF é obrigatório' };
    }
    
    try {
      var nf = buscarNF(nfId);
      if (!nf.success) return nf;
      
      if (!_transicaoPermitida(nf.data.status, 'CONFERENCIA')) {
        return { success: false, error: 'Transição de status não permitida' };
      }
      
      _updateData(CONFIG.NF_SHEET, nfId, {
        status: CONFIG.STATUS.CONFERENCIA.codigo,
        status_nome: CONFIG.STATUS.CONFERENCIA.nome,
        conferente: dados ? dados.conferente : Session.getActiveUser().getEmail(),
        atualizado_em: new Date().toISOString()
      });
      
      _registrarHistorico(nfId, nf.data.status, 'CONFERENCIA', {
        observacao: 'Conferência iniciada'
      });
      
      return {
        success: true,
        message: 'Conferência iniciada'
      };
      
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
  
  /**
   * Finaliza conferência
   * @param {string} nfId - ID da NF
   * @param {Object} dados - Dados da conferência
   * @returns {Object} Resultado
   */
  function finalizarConferencia(nfId, dados) {
    if (!nfId) {
      return { success: false, error: 'ID da NF é obrigatório' };
    }
    
    dados = dados || {};
    
    try {
      var nf = buscarNF(nfId);
      if (!nf.success) return nf;
      
      if (!_transicaoPermitida(nf.data.status, 'CONFERIDA')) {
        return { success: false, error: 'Transição de status não permitida' };
      }
      
      // Calcula valor líquido (bruto - glosas)
      var valorGlosas = dados.valor_glosas || 0;
      var valorLiquido = nf.data.valor_bruto - valorGlosas;
      
      _updateData(CONFIG.NF_SHEET, nfId, {
        status: CONFIG.STATUS.CONFERIDA.codigo,
        status_nome: CONFIG.STATUS.CONFERIDA.nome,
        data_conferencia: new Date().toISOString(),
        valor_glosas: valorGlosas,
        valor_liquido: valorLiquido,
        parecer_conferencia: dados.parecer || '',
        atualizado_em: new Date().toISOString()
      });
      
      _registrarHistorico(nfId, nf.data.status, 'CONFERIDA', {
        observacao: 'Conferência finalizada. Glosas: ' + _formatarMoeda(valorGlosas)
      });
      
      _notificarMudancaStatus(nf.data, 'CONFERIDA', dados);
      
      return {
        success: true,
        data: {
          valorBruto: nf.data.valor_bruto,
          valorGlosas: valorGlosas,
          valorLiquido: valorLiquido
        },
        message: 'Conferência finalizada'
      };
      
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
  
  /**
   * Envia para atesto
   * @param {string} nfId - ID da NF
   * @returns {Object} Resultado
   */
  function enviarParaAtesto(nfId) {
    if (!nfId) {
      return { success: false, error: 'ID da NF é obrigatório' };
    }
    
    try {
      var nf = buscarNF(nfId);
      if (!nf.success) return nf;
      
      if (!_transicaoPermitida(nf.data.status, 'AGUARDANDO_ATESTO')) {
        return { success: false, error: 'Transição de status não permitida' };
      }
      
      _updateData(CONFIG.NF_SHEET, nfId, {
        status: CONFIG.STATUS.AGUARDANDO_ATESTO.codigo,
        status_nome: CONFIG.STATUS.AGUARDANDO_ATESTO.nome,
        atualizado_em: new Date().toISOString()
      });
      
      _registrarHistorico(nfId, nf.data.status, 'AGUARDANDO_ATESTO', {
        observacao: 'Enviada para atesto do executor'
      });
      
      return {
        success: true,
        message: 'NF enviada para atesto'
      };
      
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
  
  /**
   * Realiza atesto da NF
   * @param {string} nfId - ID da NF
   * @param {Object} dados - Dados do atesto
   * @returns {Object} Resultado
   */
  function atestarNF(nfId, dados) {
    try {
      if (!nfId) {
        return { success: false, error: 'ID da NF é obrigatório' };
      }
    
      dados = dados || {};
    
      try {
        var nf = buscarNF(nfId);
        if (!nf.success) return nf;
      
        if (!_transicaoPermitida(nf.data.status, 'ATESTADA')) {
          return { success: false, error: 'Transição de status não permitida' };
        }
      
        // Liquida no empenho
        if (typeof ContractService !== 'undefined' && nf.data.empenho_id) {
          var liquidacao = ContractService.liquidarEmpenho({
            empenho_id: nf.data.empenho_id,
            valor: nf.data.valor_liquido,
            nota_fiscal_id: nfId,
            nota_fiscal_numero: nf.data.numero
          });
        
          if (!liquidacao.success) {
            return {
              success: false,
              error: 'Erro ao liquidar empenho: ' + liquidacao.error
            };
          }
        }
      
        _updateData(CONFIG.NF_SHEET, nfId, {
          status: CONFIG.STATUS.ATESTADA.codigo,
          status_nome: CONFIG.STATUS.ATESTADA.nome,
          data_atesto: new Date().toISOString(),
          atestado_por: dados.executor || Session.getActiveUser().getEmail(),
          matricula_executor: dados.matricula || '',
          parecer_atesto: dados.parecer || 'Atesto que os serviços/produtos foram entregues conforme especificado.',
          atualizado_em: new Date().toISOString()
        });
      
        _registrarHistorico(nfId, nf.data.status, 'ATESTADA', {
          observacao: 'Atestada por ' + (dados.executor || Session.getActiveUser().getEmail())
        });
      
        _notificarMudancaStatus(nf.data, 'ATESTADA', dados);
      
        return {
          success: true,
          message: 'NF atestada com sucesso'
        };
      
      } catch (e) {
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em atestarNF: " + error.message);
      throw error;
    }
  }

  /**
   * Envia NF para pagamento
   * @param {string} nfId - ID da NF
   * @param {Object} dados - Dados
   * @returns {Object} Resultado
   */
  function enviarParaPagamento(nfId, dados) {
    if (!nfId) {
      return { success: false, error: 'ID da NF é obrigatório' };
    }
    
    try {
      var nf = buscarNF(nfId);
      if (!nf.success) return nf;
      
      if (!_transicaoPermitida(nf.data.status, 'ENVIADA_PAGAMENTO')) {
        return { success: false, error: 'Transição de status não permitida' };
      }
      
      _updateData(CONFIG.NF_SHEET, nfId, {
        status: CONFIG.STATUS.ENVIADA_PAGAMENTO.codigo,
        status_nome: CONFIG.STATUS.ENVIADA_PAGAMENTO.nome,
        data_envio_pagamento: new Date().toISOString(),
        processo_pagamento: dados ? dados.processo : '',
        atualizado_em: new Date().toISOString()
      });
      
      _registrarHistorico(nfId, nf.data.status, 'ENVIADA_PAGAMENTO', {
        observacao: 'Enviada para pagamento'
      });
      
      return {
        success: true,
        message: 'NF enviada para pagamento'
      };
      
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
  
  /**
   * Registra pagamento da NF
   * @param {string} nfId - ID da NF
   * @param {Object} dados - Dados do pagamento
   * @returns {Object} Resultado
   */
  function registrarPagamento(nfId, dados) {
    if (!nfId) {
      return { success: false, error: 'ID da NF é obrigatório' };
    }
    
    if (!dados || !dados.valor_pago) {
      return { success: false, error: 'Valor pago é obrigatório' };
    }
    
    try {
      var nf = buscarNF(nfId);
      if (!nf.success) return nf;
      
      if (!_transicaoPermitida(nf.data.status, 'PAGA')) {
        return { success: false, error: 'Transição de status não permitida' };
      }
      
      _updateData(CONFIG.NF_SHEET, nfId, {
        status: CONFIG.STATUS.PAGA.codigo,
        status_nome: CONFIG.STATUS.PAGA.nome,
        data_pagamento: new Date().toISOString(),
        valor_pago: Number(dados.valor_pago),
        documento_pagamento: dados.documento || '',
        banco_pagamento: dados.banco || '',
        observacao_pagamento: dados.observacao || '',
        atualizado_em: new Date().toISOString()
      });
      
      _registrarHistorico(nfId, nf.data.status, 'PAGA', {
        observacao: 'Pago: ' + _formatarMoeda(dados.valor_pago)
      });
      
      _notificarMudancaStatus(nf.data, 'PAGA', dados);
      
      return {
        success: true,
        message: 'Pagamento registrado com sucesso'
      };
      
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
  
  /**
   * Recusa NF
   * @param {string} nfId - ID da NF
   * @param {Object} dados - Dados da recusa
   * @returns {Object} Resultado
   */
  function recusarNF(nfId, dados) {
    if (!nfId) {
      return { success: false, error: 'ID da NF é obrigatório' };
    }
    
    if (!dados || !dados.motivo) {
      return { success: false, error: 'Motivo da recusa é obrigatório' };
    }
    
    try {
      var nf = buscarNF(nfId);
      if (!nf.success) return nf;
      
      if (!_transicaoPermitida(nf.data.status, 'RECUSADA')) {
        return { success: false, error: 'NF não pode ser recusada neste status' };
      }
      
      _updateData(CONFIG.NF_SHEET, nfId, {
        status: CONFIG.STATUS.RECUSADA.codigo,
        status_nome: CONFIG.STATUS.RECUSADA.nome,
        data_recusa: new Date().toISOString(),
        motivo_recusa: dados.motivo,
        detalhes_recusa: dados.detalhes || '',
        recusado_por: Session.getActiveUser().getEmail(),
        atualizado_em: new Date().toISOString()
      });
      
      _registrarHistorico(nfId, nf.data.status, 'RECUSADA', {
        observacao: 'Motivo: ' + dados.motivo
      });
      
      _notificarMudancaStatus(nf.data, 'RECUSADA', dados);
      
      return {
        success: true,
        message: 'NF recusada'
      };
      
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
  
  /**
   * Cancela NF
   * @param {string} nfId - ID da NF
   * @param {Object} dados - Dados do cancelamento
   * @returns {Object} Resultado
   */
  function cancelarNF(nfId, dados) {
    if (!nfId) {
      return { success: false, error: 'ID da NF é obrigatório' };
    }
    
    try {
      var nf = buscarNF(nfId);
      if (!nf.success) return nf;
      
      if (!_transicaoPermitida(nf.data.status, 'CANCELADA')) {
        return { success: false, error: 'NF não pode ser cancelada neste status' };
      }
      
      _updateData(CONFIG.NF_SHEET, nfId, {
        status: CONFIG.STATUS.CANCELADA.codigo,
        status_nome: CONFIG.STATUS.CANCELADA.nome,
        data_cancelamento: new Date().toISOString(),
        motivo_cancelamento: dados ? dados.motivo : '',
        cancelado_por: Session.getActiveUser().getEmail(),
        atualizado_em: new Date().toISOString()
      });
      
      _registrarHistorico(nfId, nf.data.status, 'CANCELADA', {
        observacao: dados ? dados.motivo : 'Cancelada'
      });
      
      return {
        success: true,
        message: 'NF cancelada'
      };
      
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
  
  // =========================================================================
  // API PÚBLICA - CONSULTAS
  // =========================================================================
  
  /**
   * Obtém histórico de uma NF
   * @param {string} nfId - ID da NF
   * @returns {Object} Histórico
   */
  function getHistorico(nfId) {
    try {
      if (!nfId) {
        return { success: false, error: 'ID da NF é obrigatório' };
      }
    
      try {
        var historico = _getData(CONFIG.HISTORICO_SHEET, { nota_fiscal_id: nfId });
      
        historico.sort(function(a, b) {
          return new Date(a.data) - new Date(b.data);
        });
      
        return {
          success: true,
          data: historico
        };
      
      } catch (e) {
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em getHistorico: " + error.message);
      throw error;
    }
  }
  
  /**
   * Obtém NFs por status
   * @param {string} status - Status
   * @returns {Object} Lista de NFs
   */
  function getNFsPorStatus(status) {
    return listarNFs({ status: status });
  }
  
  /**
   * Obtém resumo do workflow
   * @returns {Object} Resumo
   */
  function getResumoWorkflow() {
    try {
      try {
        var nfs = _getData(CONFIG.NF_SHEET, {});
      
        var resumo = {};
        Object.keys(CONFIG.STATUS).forEach(function(key) {
          resumo[key] = {
            quantidade: 0,
            valor: 0,
            config: CONFIG.STATUS[key]
          };
        });
      
        nfs.forEach(function(nf) {
          if (resumo[nf.status]) {
            resumo[nf.status].quantidade++;
            resumo[nf.status].valor += nf.valor_bruto || 0;
          }
        });
      
        // Formata valores
        Object.keys(resumo).forEach(function(key) {
          resumo[key].valorFormatado = _formatarMoeda(resumo[key].valor);
        });
      
        return {
          success: true,
          data: resumo
        };
      
      } catch (e) {
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em getResumoWorkflow: " + error.message);
      throw error;
    }
  }
  
  /**
   * Obtém próximas ações permitidas para uma NF
   * @param {string} nfId - ID da NF
   * @returns {Object} Ações permitidas
   */
  function getAcoesPermitidas(nfId) {
    try {
      var nf = buscarNF(nfId);
      if (!nf.success) return nf;
    
      var statusAtual = nf.data.status;
      var transicoesPermitidas = CONFIG.TRANSICOES[statusAtual] || [];
    
      var acoes = transicoesPermitidas.map(function(status) {
        return {
          status: status,
          nome: CONFIG.STATUS[status].nome,
          cor: CONFIG.STATUS[status].cor
        };
      });
    
      return {
        success: true,
        data: {
          statusAtual: statusAtual,
          statusAtualNome: CONFIG.STATUS[statusAtual].nome,
          acoes: acoes
        }
      };
    } catch (error) {
      Logger.log("Erro em getAcoesPermitidas: " + error.message);
      throw error;
    }
  }
  
  /**
   * Obtém configuração de status
   * @returns {Object} Status disponíveis
   */
  function getStatusConfig() {
    return {
      success: true,
      data: CONFIG.STATUS
    };
  }
  
  // =========================================================================
  // API PÚBLICA DO MÓDULO
  // =========================================================================
  
  return {
    // CRUD
    lancarNF: lancarNF,
    buscarNF: buscarNF,
    listarNFs: listarNFs,
    
    // Transições
    registrarRecebimentoUE: registrarRecebimentoUE,
    iniciarConferencia: iniciarConferencia,
    finalizarConferencia: finalizarConferencia,
    enviarParaAtesto: enviarParaAtesto,
    atestarNF: atestarNF,
    enviarParaPagamento: enviarParaPagamento,
    registrarPagamento: registrarPagamento,
    recusarNF: recusarNF,
    cancelarNF: cancelarNF,
    
    // Consultas
    getHistorico: getHistorico,
    getNFsPorStatus: getNFsPorStatus,
    getResumoWorkflow: getResumoWorkflow,
    getAcoesPermitidas: getAcoesPermitidas,
    getStatusConfig: getStatusConfig,
    
    // Constantes
    STATUS: CONFIG.STATUS
  };
  
})();

// ============================================================================
// FUNÇÕES GLOBAIS - API para Frontend
// ============================================================================

function api_nf_lancar(dados) {
  return InvoiceWorkflow.lancarNF(dados);
}

function api_nf_buscar(id) {
  return InvoiceWorkflow.buscarNF(id);
}

function api_nf_listar(filtros) {
  return InvoiceWorkflow.listarNFs(filtros);
}

function api_nf_registrarRecebimento(nfId, dados) {
  return InvoiceWorkflow.registrarRecebimentoUE(nfId, dados);
}

function api_nf_iniciarConferencia(nfId, dados) {
  return InvoiceWorkflow.iniciarConferencia(nfId, dados);
}

function api_nf_finalizarConferencia(nfId, dados) {
  return InvoiceWorkflow.finalizarConferencia(nfId, dados);
}

function api_nf_enviarParaAtesto(nfId) {
  return InvoiceWorkflow.enviarParaAtesto(nfId);
}

function api_nf_atestar(nfId, dados) {
  return InvoiceWorkflow.atestarNF(nfId, dados);
}

function api_nf_enviarParaPagamento(nfId, dados) {
  return InvoiceWorkflow.enviarParaPagamento(nfId, dados);
}

function api_nf_registrarPagamento(nfId, dados) {
  return InvoiceWorkflow.registrarPagamento(nfId, dados);
}

function api_nf_recusar(nfId, dados) {
  return InvoiceWorkflow.recusarNF(nfId, dados);
}

function api_nf_cancelar(nfId, dados) {
  return InvoiceWorkflow.cancelarNF(nfId, dados);
}

function api_nf_historico(nfId) {
  return InvoiceWorkflow.getHistorico(nfId);
}

function api_nf_resumoWorkflow() {
  return InvoiceWorkflow.getResumoWorkflow();
}

function api_nf_acoesPermitidas(nfId) {
  return InvoiceWorkflow.getAcoesPermitidas(nfId);
}

function api_nf_statusConfig() {
  return InvoiceWorkflow.getStatusConfig();
}

// ============================================================================
// REGISTRO DO MÓDULO
// ============================================================================

(function() {
  var moduleName = 'InvoiceWorkflow';
  var moduleVersion = '1.0.0';
  
  try {
    if (typeof ServiceContainer !== 'undefined') {
      ServiceContainer.register(moduleName, InvoiceWorkflow);
    }
    
    Logger.log('[' + moduleName + ' v' + moduleVersion + '] Módulo carregado');
    Logger.log('[' + moduleName + '] Fluxo: Lançada → Recebida UE → Conferência → Atestada → Paga');
    
  } catch (e) {
    console.error('[' + moduleName + '] Erro ao registrar: ' + e.message);
  }
})();
