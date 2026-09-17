/**
 * @fileoverview Serviço de Processamento de Pagamentos - Alimentação Escolar CRE-PP
 * @version 1.0.0
 * 
 * Intervenção 27/38: PaymentService conforme Prompt 27
 * 
 * Funcionalidades:
 * - Registro de ordens de pagamento
 * - Data de liquidação e documento bancário
 * - Atualização de status da NF para 'Pago'
 * - Histórico de pagamentos
 * - Relatórios financeiros
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-25
 */

'use strict';

// ============================================================================
// PAYMENT SERVICE - Processamento de Pagamentos
// ============================================================================

var PaymentService = (function() {
  
  // =========================================================================
  // CONFIGURAÇÃO
  // =========================================================================
  
  var CONFIG = {
    // Planilhas
    PAGAMENTOS_SHEET: 'Pagamentos',
    LOTES_SHEET: 'Lotes_Pagamento',
    
    // Status de pagamento
    STATUS: {
      PENDENTE: 'Pendente',
      PROCESSANDO: 'Processando',
      LIQUIDADO: 'Liquidado',
      PAGO: 'Pago',
      ESTORNADO: 'Estornado',
      CANCELADO: 'Cancelado'
    },
    
    // Tipos de pagamento
    TIPOS: {
      ORDEM_BANCARIA: 'Ordem Bancária',
      TRANSFERENCIA: 'Transferência',
      DOC: 'DOC',
      TED: 'TED',
      PIX: 'PIX'
    },
    
    // Bancos
    BANCOS: {
      '001': 'Banco do Brasil',
      '104': 'Caixa Econômica',
      '033': 'Santander',
      '341': 'Itaú',
      '237': 'Bradesco',
      '756': 'Sicoob',
      '748': 'Sicredi'
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
  
  function _formatarData(data) {
    try {
      if (!data) return '-';
      var d = new Date(data);
      return d.toLocaleDateString('pt-BR');
    } catch (error) {
      Logger.log("Erro em _formatarData: " + error.message);
      throw error;
    }
  }
  
  function _getData(sheetName, filtros) {
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
   * Gera número de ordem de pagamento
   * @private
   */
  function _gerarNumeroOP() {
    try {
      try {
        try {
          var ano = new Date().getFullYear();
          var seq = PropertiesService.getScriptProperties().getProperty('OP_SEQ_' + ano) || '0';
          seq = parseInt(seq) + 1;
          PropertiesService.getScriptProperties().setProperty('OP_SEQ_' + ano, String(seq));
          return ano + 'OP' + String(seq).padStart(6, '0');
        } catch (error) {
          Logger.log("Erro em _gerarNumeroOP: " + error.message);
          throw error; // Re-lança para tratamento superior
        }
      } catch (error) {
        Logger.log("Erro em _gerarNumeroOP: " + error.message);
        throw error;
      }
    } catch (error) {
      Logger.log("Erro em _gerarNumeroOP: " + error.message);
      throw error;
    }
  }
  
  // =========================================================================
  // API PÚBLICA - ORDENS DE PAGAMENTO
  // =========================================================================
  
  /**
   * Registra ordem de pagamento
   * @param {Object} dados - Dados do pagamento
   * @returns {Object} Resultado
   */
  function registrarOrdemPagamento(dados) {
    try {
      if (!dados) {
        return { success: false, error: 'Dados são obrigatórios' };
      }
    
      var erros = [];
      if (!dados.nota_fiscal_id) erros.push('Nota Fiscal é obrigatória');
      if (!dados.valor || dados.valor <= 0) erros.push('Valor deve ser maior que zero');
    
      if (erros.length > 0) {
        return { success: false, errors: erros };
      }
    
      try {
        // Busca dados da NF
        var nf = null;
        if (typeof InvoiceWorkflow !== 'undefined') {
          var nfResult = InvoiceWorkflow.buscarNF(dados.nota_fiscal_id);
          if (nfResult.success) {
            nf = nfResult.data;
          }
        }
      
        var pagamento = {
          id: _gerarId('PAG'),
          numero_op: _gerarNumeroOP(),
        
          // NF
          nota_fiscal_id: dados.nota_fiscal_id,
          nota_fiscal_numero: nf ? nf.numero : dados.nota_fiscal_numero || '',
        
          // Fornecedor
          fornecedor_id: nf ? nf.fornecedor_id : dados.fornecedor_id || '',
          fornecedor_nome: nf ? nf.fornecedor_nome : dados.fornecedor_nome || '',
          fornecedor_cnpj: nf ? nf.fornecedor_cnpj : dados.fornecedor_cnpj || '',
        
          // Empenho
          empenho_id: nf ? nf.empenho_id : dados.empenho_id || '',
          empenho_numero: nf ? nf.empenho_numero : dados.empenho_numero || '',
        
          // Valores
          valor_bruto: nf ? nf.valor_bruto : dados.valor,
          valor_glosas: nf ? nf.valor_glosas : 0,
          valor_liquido: Number(dados.valor),
        
          // Dados bancários
          banco_codigo: dados.banco_codigo || '',
          banco_nome: CONFIG.BANCOS[dados.banco_codigo] || dados.banco_nome || '',
          agencia: dados.agencia || '',
          conta: dados.conta || '',
          tipo_conta: dados.tipo_conta || 'Corrente',
          pix: dados.pix || '',
        
          // Tipo de pagamento
          tipo_pagamento: dados.tipo_pagamento || CONFIG.TIPOS.ORDEM_BANCARIA,
        
          // Status
          status: CONFIG.STATUS.PENDENTE,
        
          // Datas
          data_emissao: new Date().toISOString(),
          data_vencimento: dados.data_vencimento ? new Date(dados.data_vencimento).toISOString() : null,
          data_liquidacao: null,
          data_pagamento: null,
        
          // Documento
          documento_bancario: '',
        
          // Observações
          observacoes: dados.observacoes || '',
        
          // Metadados
          criado_por: Session.getActiveUser().getEmail(),
          criado_em: new Date().toISOString()
        };
      
        var resultado = _saveData(CONFIG.PAGAMENTOS_SHEET, pagamento);
      
        if (!resultado) {
          return { success: false, error: 'Erro ao salvar ordem de pagamento' };
        }
      
        // Auditoria
        if (typeof AuditService !== 'undefined') {
          AuditService.log('OP_REGISTRADA', {
            pagamentoId: pagamento.id,
            numeroOP: pagamento.numero_op,
            valor: pagamento.valor_liquido
          });
        }
      
        return {
          success: true,
          data: pagamento,
          message: 'Ordem de pagamento registrada: ' + pagamento.numero_op
        };
      
      } catch (e) {
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em registrarOrdemPagamento: " + error.message);
      throw error;
    }
  }
  
  /**
   * Registra liquidação do pagamento
   * @param {string} pagamentoId - ID do pagamento
   * @param {Object} dados - Dados da liquidação
   * @returns {Object} Resultado
   */
  function registrarLiquidacao(pagamentoId, dados) {
    if (!pagamentoId) {
      return { success: false, error: 'ID do pagamento é obrigatório' };
    }
    
    try {
      var pagamentos = _getData(CONFIG.PAGAMENTOS_SHEET, { id: pagamentoId });
      if (!pagamentos || pagamentos.length === 0) {
        return { success: false, error: 'Pagamento não encontrado' };
      }
      
      var pagamento = pagamentos[0];
      
      if (pagamento.status !== CONFIG.STATUS.PENDENTE && 
          pagamento.status !== CONFIG.STATUS.PROCESSANDO) {
        return { success: false, error: 'Pagamento não pode ser liquidado neste status' };
      }
      
      _updateData(CONFIG.PAGAMENTOS_SHEET, pagamentoId, {
        status: CONFIG.STATUS.LIQUIDADO,
        data_liquidacao: new Date().toISOString(),
        documento_liquidacao: dados ? dados.documento : '',
        liquidado_por: Session.getActiveUser().getEmail()
      });
      
      // Auditoria
      if (typeof AuditService !== 'undefined') {
        AuditService.log('OP_LIQUIDADA', {
          pagamentoId: pagamentoId,
          numeroOP: pagamento.numero_op
        });
      }
      
      return {
        success: true,
        message: 'Liquidação registrada com sucesso'
      };
      
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
  
  /**
   * Confirma pagamento efetivado
   * @param {string} pagamentoId - ID do pagamento
   * @param {Object} dados - Dados do pagamento
   * @returns {Object} Resultado
   */
  function confirmarPagamento(pagamentoId, dados) {
    if (!pagamentoId) {
      return { success: false, error: 'ID do pagamento é obrigatório' };
    }
    
    if (!dados || !dados.documento_bancario) {
      return { success: false, error: 'Documento bancário é obrigatório' };
    }
    
    try {
      var pagamentos = _getData(CONFIG.PAGAMENTOS_SHEET, { id: pagamentoId });
      if (!pagamentos || pagamentos.length === 0) {
        return { success: false, error: 'Pagamento não encontrado' };
      }
      
      var pagamento = pagamentos[0];
      
      _updateData(CONFIG.PAGAMENTOS_SHEET, pagamentoId, {
        status: CONFIG.STATUS.PAGO,
        data_pagamento: dados.data_pagamento ? new Date(dados.data_pagamento).toISOString() : new Date().toISOString(),
        documento_bancario: dados.documento_bancario,
        comprovante_id: dados.comprovante_id || '',
        pago_por: Session.getActiveUser().getEmail()
      });
      
      // Atualiza NF para paga
      if (typeof InvoiceWorkflow !== 'undefined' && pagamento.nota_fiscal_id) {
        InvoiceWorkflow.registrarPagamento(pagamento.nota_fiscal_id, {
          valor_pago: pagamento.valor_liquido,
          documento: dados.documento_bancario,
          banco: pagamento.banco_nome
        });
      }
      
      // Notifica fornecedor
      if (typeof NotificationService !== 'undefined') {
        NotificationService.enviar({
          tipo: 'PAGAMENTO_REALIZADO',
          titulo: 'Pagamento Realizado',
          mensagem: 'O pagamento da NF ' + pagamento.nota_fiscal_numero + 
                    ' foi realizado. Valor: ' + _formatarMoeda(pagamento.valor_liquido),
          destinatarios: [pagamento.fornecedor_email],
          prioridade: 'MEDIA'
        });
      }
      
      // Auditoria
      if (typeof AuditService !== 'undefined') {
        AuditService.log('PAGAMENTO_CONFIRMADO', {
          pagamentoId: pagamentoId,
          numeroOP: pagamento.numero_op,
          documento: dados.documento_bancario,
          valor: pagamento.valor_liquido
        });
      }
      
      return {
        success: true,
        message: 'Pagamento confirmado com sucesso'
      };
      
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  /**
   * Estorna pagamento
   * @param {string} pagamentoId - ID do pagamento
   * @param {Object} dados - Dados do estorno
   * @returns {Object} Resultado
   */
  function estornarPagamento(pagamentoId, dados) {
    if (!pagamentoId) {
      return { success: false, error: 'ID do pagamento é obrigatório' };
    }
    
    if (!dados || !dados.motivo) {
      return { success: false, error: 'Motivo do estorno é obrigatório' };
    }
    
    try {
      var pagamentos = _getData(CONFIG.PAGAMENTOS_SHEET, { id: pagamentoId });
      if (!pagamentos || pagamentos.length === 0) {
        return { success: false, error: 'Pagamento não encontrado' };
      }
      
      var pagamento = pagamentos[0];
      
      if (pagamento.status !== CONFIG.STATUS.PAGO) {
        return { success: false, error: 'Apenas pagamentos efetivados podem ser estornados' };
      }
      
      _updateData(CONFIG.PAGAMENTOS_SHEET, pagamentoId, {
        status: CONFIG.STATUS.ESTORNADO,
        data_estorno: new Date().toISOString(),
        motivo_estorno: dados.motivo,
        documento_estorno: dados.documento || '',
        estornado_por: Session.getActiveUser().getEmail()
      });
      
      // Estorna liquidação no empenho
      if (typeof ContractService !== 'undefined' && pagamento.empenho_id) {
        ContractService.estornarLiquidacao({
          empenho_id: pagamento.empenho_id,
          valor: pagamento.valor_liquido,
          nota_fiscal_id: pagamento.nota_fiscal_id,
          motivo: dados.motivo
        });
      }
      
      // Auditoria
      if (typeof AuditService !== 'undefined') {
        AuditService.log('PAGAMENTO_ESTORNADO', {
          pagamentoId: pagamentoId,
          motivo: dados.motivo,
          valor: pagamento.valor_liquido
        });
      }
      
      return {
        success: true,
        message: 'Pagamento estornado com sucesso'
      };
      
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
  
  /**
   * Cancela ordem de pagamento
   * @param {string} pagamentoId - ID do pagamento
   * @param {Object} dados - Dados do cancelamento
   * @returns {Object} Resultado
   */
  function cancelarPagamento(pagamentoId, dados) {
    if (!pagamentoId) {
      return { success: false, error: 'ID do pagamento é obrigatório' };
    }
    
    try {
      var pagamentos = _getData(CONFIG.PAGAMENTOS_SHEET, { id: pagamentoId });
      if (!pagamentos || pagamentos.length === 0) {
        return { success: false, error: 'Pagamento não encontrado' };
      }
      
      var pagamento = pagamentos[0];
      
      if (pagamento.status === CONFIG.STATUS.PAGO) {
        return { success: false, error: 'Pagamentos efetivados não podem ser cancelados. Use estorno.' };
      }
      
      _updateData(CONFIG.PAGAMENTOS_SHEET, pagamentoId, {
        status: CONFIG.STATUS.CANCELADO,
        data_cancelamento: new Date().toISOString(),
        motivo_cancelamento: dados ? dados.motivo : '',
        cancelado_por: Session.getActiveUser().getEmail()
      });
      
      return {
        success: true,
        message: 'Ordem de pagamento cancelada'
      };
      
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
  
  // =========================================================================
  // API PÚBLICA - LOTES DE PAGAMENTO
  // =========================================================================
  
  /**
   * Cria lote de pagamento
   * @param {Object} dados - Dados do lote
   * @returns {Object} Resultado
   */
  function criarLotePagamento(dados) {
    try {
      if (!dados || !dados.pagamentos || dados.pagamentos.length === 0) {
        return { success: false, error: 'Pagamentos são obrigatórios' };
      }
    
      try {
        // Valida pagamentos
        var pagamentosValidos = [];
        var valorTotal = 0;
      
        dados.pagamentos.forEach(function(pagId) {
          var pags = _getData(CONFIG.PAGAMENTOS_SHEET, { id: pagId });
          if (pags && pags.length > 0 && pags[0].status === CONFIG.STATUS.PENDENTE) {
            pagamentosValidos.push(pags[0]);
            valorTotal += pags[0].valor_liquido || 0;
          }
        });
      
        if (pagamentosValidos.length === 0) {
          return { success: false, error: 'Nenhum pagamento válido para o lote' };
        }
      
        var lote = {
          id: _gerarId('LOTE'),
          numero: 'LOTE-' + new Date().getFullYear() + '-' + Date.now().toString(36).toUpperCase(),
        
          // Pagamentos
          pagamentos_ids: dados.pagamentos.join(','),
          quantidade_pagamentos: pagamentosValidos.length,
          valor_total: valorTotal,
        
          // Status
          status: 'Criado',
        
          // Datas
          data_criacao: new Date().toISOString(),
          data_processamento: null,
        
          // Metadados
          descricao: dados.descricao || '',
          criado_por: Session.getActiveUser().getEmail()
        };
      
        var resultado = _saveData(CONFIG.LOTES_SHEET, lote);
      
        if (!resultado) {
          return { success: false, error: 'Erro ao criar lote' };
        }
      
        // Atualiza status dos pagamentos
        pagamentosValidos.forEach(function(pag) {
          _updateData(CONFIG.PAGAMENTOS_SHEET, pag.id, {
            status: CONFIG.STATUS.PROCESSANDO,
            lote_id: lote.id
          });
        });
      
        return {
          success: true,
          data: {
            lote: lote,
            pagamentos: pagamentosValidos.length,
            valorTotal: valorTotal,
            valorTotalFormatado: _formatarMoeda(valorTotal)
          },
          message: 'Lote criado com ' + pagamentosValidos.length + ' pagamentos'
        };
      
      } catch (e) {
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em criarLotePagamento: " + error.message);
      throw error;
    }
  }
  
  /**
   * Processa lote de pagamento
   * @param {string} loteId - ID do lote
   * @param {Object} dados - Dados do processamento
   * @returns {Object} Resultado
   */
  function processarLote(loteId, dados) {
    try {
      try {
        if (!loteId) {
          return { success: false, error: 'ID do lote é obrigatório' };
        }
    
        try {
          var lotes = _getData(CONFIG.LOTES_SHEET, { id: loteId });
          if (!lotes || lotes.length === 0) {
            return { success: false, error: 'Lote não encontrado' };
          }
      
          var lote = lotes[0];
          var pagamentosIds = lote.pagamentos_ids.split(',');
          var processados = 0;
          var erros = [];
      
          pagamentosIds.forEach(function(pagId) {
            var resultado = confirmarPagamento(pagId, {
              documento_bancario: dados.documento_bancario || lote.numero,
              data_pagamento: dados.data_pagamento
            });
        
            if (resultado.success) {
              processados++;
            } else {
              erros.push({ id: pagId, erro: resultado.error });
            }
          });
      
          // Atualiza lote
          _updateData(CONFIG.LOTES_SHEET, loteId, {
            status: erros.length === 0 ? 'Processado' : 'Processado com erros',
            data_processamento: new Date().toISOString(),
            pagamentos_processados: processados,
            erros: JSON.stringify(erros)
          });
      
          return {
            success: true,
            data: {
              processados: processados,
              erros: erros.length,
              detalhesErros: erros
            },
            message: processados + ' pagamentos processados'
          };
      
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em processarLote: " + error.message);
        throw error;
      }
    } catch (error) {
      Logger.log("Erro em processarLote: " + error.message);
      throw error;
    }
  }
  
  // =========================================================================
  // API PÚBLICA - CONSULTAS
  // =========================================================================
  
  /**
   * Busca pagamento por ID
   * @param {string} id - ID do pagamento
   * @returns {Object} Pagamento
   */
  function buscarPagamento(id) {
    if (!id) {
      return { success: false, error: 'ID é obrigatório' };
    }
    
    try {
      var pagamentos = _getData(CONFIG.PAGAMENTOS_SHEET, { id: id });
      
      if (!pagamentos || pagamentos.length === 0) {
        return { success: false, error: 'Pagamento não encontrado' };
      }
      
      return { success: true, data: pagamentos[0] };
      
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
  
  /**
   * Lista pagamentos
   * @param {Object} filtros - Filtros
   * @returns {Object} Lista de pagamentos
   */
  function listarPagamentos(filtros) {
    try {
      filtros = filtros || {};
    
      try {
        var pagamentos = _getData(CONFIG.PAGAMENTOS_SHEET, {});
      
        // Aplica filtros
        if (filtros.status) {
          pagamentos = pagamentos.filter(function(p) { return p.status === filtros.status; });
        }
      
        if (filtros.fornecedor_id) {
          pagamentos = pagamentos.filter(function(p) { return p.fornecedor_id === filtros.fornecedor_id; });
        }
      
        if (filtros.data_inicio && filtros.data_fim) {
          var inicio = new Date(filtros.data_inicio);
          var fim = new Date(filtros.data_fim);
          pagamentos = pagamentos.filter(function(p) {
            var data = new Date(p.data_emissao);
            return data >= inicio && data <= fim;
          });
        }
      
        // Ordena por data (mais recente primeiro)
        pagamentos.sort(function(a, b) {
          return new Date(b.data_emissao) - new Date(a.data_emissao);
        });
      
        // Calcula totais
        var valorTotal = pagamentos.reduce(function(sum, p) { return sum + (p.valor_liquido || 0); }, 0);
      
        return {
          success: true,
          data: {
            pagamentos: pagamentos,
            total: pagamentos.length,
            valorTotal: valorTotal,
            valorTotalFormatado: _formatarMoeda(valorTotal)
          }
        };
      
      } catch (e) {
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em listarPagamentos: " + error.message);
      throw error;
    }
  }
  
  /**
   * Obtém resumo de pagamentos
   * @param {Object} filtros - Filtros
   * @returns {Object} Resumo
   */
  function getResumoPagamentos(filtros) {
    try {
      filtros = filtros || {};
    
      try {
        var pagamentos = _getData(CONFIG.PAGAMENTOS_SHEET, {});
      
        // Filtra por período
        if (filtros.ano) {
          pagamentos = pagamentos.filter(function(p) {
            return new Date(p.data_emissao).getFullYear() === filtros.ano;
          });
        }
      
        if (filtros.mes) {
          pagamentos = pagamentos.filter(function(p) {
            return new Date(p.data_emissao).getMonth() + 1 === filtros.mes;
          });
        }
      
        // Agrupa por status
        var porStatus = {};
        Object.keys(CONFIG.STATUS).forEach(function(key) {
          porStatus[key] = { quantidade: 0, valor: 0 };
        });
      
        pagamentos.forEach(function(p) {
          var status = p.status;
          if (porStatus[status]) {
            porStatus[status].quantidade++;
            porStatus[status].valor += p.valor_liquido || 0;
          }
        });
      
        // Formata valores
        Object.keys(porStatus).forEach(function(key) {
          porStatus[key].valorFormatado = _formatarMoeda(porStatus[key].valor);
        });
      
        // Totais
        var totalGeral = pagamentos.reduce(function(sum, p) { return sum + (p.valor_liquido || 0); }, 0);
        var totalPago = porStatus.PAGO ? porStatus.PAGO.valor : 0;
        var totalPendente = porStatus.PENDENTE ? porStatus.PENDENTE.valor : 0;
      
        return {
          success: true,
          data: {
            porStatus: porStatus,
            totais: {
              quantidade: pagamentos.length,
              valorGeral: totalGeral,
              valorPago: totalPago,
              valorPendente: totalPendente,
              valorGeralFormatado: _formatarMoeda(totalGeral),
              valorPagoFormatado: _formatarMoeda(totalPago),
              valorPendenteFormatado: _formatarMoeda(totalPendente)
            }
          }
        };
      
      } catch (e) {
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em getResumoPagamentos: " + error.message);
      throw error;
    }
  }
  
  /**
   * Obtém pagamentos por fornecedor
   * @param {string} fornecedorId - ID do fornecedor
   * @returns {Object} Pagamentos
   */
  function getPagamentosFornecedor(fornecedorId) {
    if (!fornecedorId) {
      return { success: false, error: 'Fornecedor é obrigatório' };
    }
    
    return listarPagamentos({ fornecedor_id: fornecedorId });
  }
  
  /**
   * Obtém tipos de pagamento
   * @returns {Object} Tipos
   */
  function getTiposPagamento() {
    return { success: true, data: CONFIG.TIPOS };
  }
  
  /**
   * Obtém lista de bancos
   * @returns {Object} Bancos
   */
  function getBancos() {
    return { success: true, data: CONFIG.BANCOS };
  }
  
  // =========================================================================
  // API PÚBLICA DO MÓDULO
  // =========================================================================
  
  return {
    // Ordens de pagamento
    registrarOrdemPagamento: registrarOrdemPagamento,
    registrarLiquidacao: registrarLiquidacao,
    confirmarPagamento: confirmarPagamento,
    estornarPagamento: estornarPagamento,
    cancelarPagamento: cancelarPagamento,
    
    // Lotes
    criarLotePagamento: criarLotePagamento,
    processarLote: processarLote,
    
    // Consultas
    buscarPagamento: buscarPagamento,
    listarPagamentos: listarPagamentos,
    getResumoPagamentos: getResumoPagamentos,
    getPagamentosFornecedor: getPagamentosFornecedor,
    
    // Utilitários
    getTiposPagamento: getTiposPagamento,
    getBancos: getBancos,
    
    // Constantes
    STATUS: CONFIG.STATUS,
    TIPOS: CONFIG.TIPOS
  };
  
})();

// ============================================================================
// FUNÇÕES GLOBAIS - API para Frontend
// ============================================================================

function api_pagamento_registrarOP(dados) {
  return PaymentService.registrarOrdemPagamento(dados);
}

function api_pagamento_liquidar(pagamentoId, dados) {
  return PaymentService.registrarLiquidacao(pagamentoId, dados);
}

function api_pagamento_confirmar(pagamentoId, dados) {
  return PaymentService.confirmarPagamento(pagamentoId, dados);
}

function api_pagamento_estornar(pagamentoId, dados) {
  return PaymentService.estornarPagamento(pagamentoId, dados);
}

function api_pagamento_cancelar(pagamentoId, dados) {
  return PaymentService.cancelarPagamento(pagamentoId, dados);
}

function api_pagamento_criarLote(dados) {
  return PaymentService.criarLotePagamento(dados);
}

function api_pagamento_processarLote(loteId, dados) {
  return PaymentService.processarLote(loteId, dados);
}

function api_pagamento_buscar(id) {
  return PaymentService.buscarPagamento(id);
}

function api_pagamento_listar(filtros) {
  return PaymentService.listarPagamentos(filtros);
}

function api_pagamento_resumo(filtros) {
  return PaymentService.getResumoPagamentos(filtros);
}

function api_pagamento_porFornecedor(fornecedorId) {
  return PaymentService.getPagamentosFornecedor(fornecedorId);
}

function api_pagamento_getTipos() {
  return PaymentService.getTiposPagamento();
}

function api_pagamento_getBancos() {
  return PaymentService.getBancos();
}

// ============================================================================
// REGISTRO DO MÓDULO
// ============================================================================

(function() {
  var moduleName = 'PaymentService';
  var moduleVersion = '1.0.0';
  
  try {
    if (typeof ServiceContainer !== 'undefined') {
      ServiceContainer.register(moduleName, PaymentService);
    }
    
    Logger.log('[' + moduleName + ' v' + moduleVersion + '] Módulo carregado');
    Logger.log('[' + moduleName + '] Status: Pendente → Liquidado → Pago');
    
  } catch (e) {
    console.error('[' + moduleName + '] Erro ao registrar: ' + e.message);
  }
})();
