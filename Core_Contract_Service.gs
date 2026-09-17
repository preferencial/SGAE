/**
 * @fileoverview Gestão de Contratos e Empenhos - Alimentação Escolar CRE-PP
 * @version 1.0.0
 * 
 * Intervenção 22/38: ContractService conforme Prompt 22
 * 
 * Funcionalidades:
 * - Controle de saldos de empenho
 * - Abatimento automático por Nota Fiscal
 * - Alertas de utilização (90%)
 * - Histórico de movimentações
 * - Vinculação Contrato -> Empenho -> NF
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-25
 */

'use strict';

// ============================================================================
// CONTRACT SERVICE - Gestão de Contratos e Empenhos
// ============================================================================

var ContractService = (function() {
  
  // =========================================================================
  // CONFIGURAÇÃO
  // =========================================================================
  
  var CONFIG = {
    // Planilhas
    CONTRATOS_SHEET: 'Contratos',
    EMPENHOS_SHEET: 'Contratos_Empenho',
    MOVIMENTACOES_SHEET: 'Movimentacoes_Empenho',
    
    // Alertas de utilização (%)
    ALERTAS_UTILIZACAO: [90, 95, 100],
    
    // Status de contrato
    STATUS_CONTRATO: {
      VIGENTE: 'Vigente',
      ENCERRADO: 'Encerrado',
      SUSPENSO: 'Suspenso',
      CANCELADO: 'Cancelado'
    },
    
    // Status de empenho
    STATUS_EMPENHO: {
      ATIVO: 'Ativo',
      PARCIAL: 'Parcialmente Utilizado',
      ESGOTADO: 'Esgotado',
      ANULADO: 'Anulado',
      CANCELADO: 'Cancelado'
    },
    
    // Tipos de empenho
    TIPOS_EMPENHO: {
      ORDINARIO: 'Ordinário',
      ESTIMATIVO: 'Estimativo',
      GLOBAL: 'Global'
    },
    
    // Tipos de movimentação
    TIPOS_MOVIMENTACAO: {
      EMISSAO: 'Emissão',
      REFORCO: 'Reforço',
      ANULACAO: 'Anulação Parcial',
      LIQUIDACAO: 'Liquidação',
      ESTORNO: 'Estorno'
    }
  };
  
  // =========================================================================
  // FUNÇÕES PRIVADAS - UTILITÁRIOS
  // =========================================================================
  
  /**
   * Gera ID único
   * @private
   */
  function _gerarId(prefixo) {
    try {
      return (prefixo || 'ID') + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    } catch (error) {
      Logger.log("Erro em _gerarId: " + error.message);
      throw error;
    }
  }
  
  /**
   * Formata valor monetário
   * @private
   */
  function _formatarMoeda(valor) {
    try {
      return 'R$ ' + Number(valor || 0).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    } catch (error) {
      Logger.log("Erro em _formatarMoeda: " + error.message);
      throw error;
    }
  }
  
  /**
   * Obtém dados do banco
   * @private
   */
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
      
      // Aplica filtros
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
      console.error('Erro ao ler dados: ' + e.message);
      return [];
    }
  }
  
  /**
   * Salva dados no banco
   * @private
   */
  function _saveData(sheetName, dados) {
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
          console.error('Erro ao salvar: ' + e.message);
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
  }
  
  /**
   * Atualiza dados no banco
   * @private
   */
  function _updateData(sheetName, id, dados) {
    if (typeof DatabaseEngine !== 'undefined') {
      return DatabaseEngine.update(sheetName, id, dados);
    }
    return null;
  }
  
  /**
   * Calcula percentual de utilização
   * @private
   */
  function _calcularUtilizacao(valorTotal, valorUtilizado) {
    if (!valorTotal || valorTotal <= 0) return 0;
    return Math.round((valorUtilizado / valorTotal) * 10000) / 100;
  }
  
  /**
   * Verifica e envia alertas de utilização
   * @private
   */
  function _verificarAlertaUtilizacao(empenho, percentual) {
    try {
      var alertaEnviado = false;
    
      CONFIG.ALERTAS_UTILIZACAO.forEach(function(limite) {
        if (percentual >= limite && (!empenho.alertas_enviados || empenho.alertas_enviados.indexOf(limite) === -1)) {
          // Envia notificação
          if (typeof NotificationService !== 'undefined') {
            NotificationService.enviar({
              tipo: 'ALERTA_EMPENHO',
              titulo: 'Empenho atingiu ' + limite + '% de utilização',
              mensagem: 'O empenho ' + empenho.numero + ' atingiu ' + percentual.toFixed(1) + 
                        '% de utilização. Saldo restante: ' + _formatarMoeda(empenho.saldo_disponivel),
              prioridade: limite >= 95 ? 'ALTA' : 'MEDIA',
              dados: {
                empenhoId: empenho.id,
                numero: empenho.numero,
                percentual: percentual
              }
            });
          }
        
          // Registra alerta enviado
          var alertas = empenho.alertas_enviados ? empenho.alertas_enviados.split(',') : [];
          alertas.push(String(limite));
          _updateData(CONFIG.EMPENHOS_SHEET, empenho.id, {
            alertas_enviados: alertas.join(',')
          });
        
          alertaEnviado = true;
        }
      });
    
      return alertaEnviado;
    } catch (error) {
      Logger.log("Erro em _verificarAlertaUtilizacao: " + error.message);
      throw error;
    }
  }
  
  /**
   * Registra movimentação de empenho
   * @private
   */
  function _registrarMovimentacao(empenhoId, tipo, valor, dados) {
    try {
      var movimentacao = {
        id: _gerarId('MOV'),
        empenho_id: empenhoId,
        tipo: tipo,
        valor: valor,
        nota_fiscal_id: dados.nota_fiscal_id || '',
        nota_fiscal_numero: dados.nota_fiscal_numero || '',
        descricao: dados.descricao || '',
        saldo_anterior: dados.saldo_anterior || 0,
        saldo_posterior: dados.saldo_posterior || 0,
        criado_em: new Date().toISOString(),
        criado_por: Session.getActiveUser().getEmail()
      };
    
      _saveData(CONFIG.MOVIMENTACOES_SHEET, movimentacao);
    
      // Auditoria
      if (typeof AuditService !== 'undefined') {
        AuditService.log('MOVIMENTACAO_EMPENHO', {
          empenhoId: empenhoId,
          tipo: tipo,
          valor: valor,
          notaFiscal: dados.nota_fiscal_numero
        });
      }
    
      return movimentacao;
    } catch (error) {
      Logger.log("Erro em _registrarMovimentacao: " + error.message);
      throw error;
    }
  }
  
  // =========================================================================
  // API PÚBLICA - CONTRATOS
  // =========================================================================
  
  /**
   * Cadastra novo contrato
   * @param {Object} dados - Dados do contrato
   * @returns {Object} Resultado
   */
  function cadastrarContrato(dados) {
    try {
      if (!dados) {
        return { success: false, error: 'Dados são obrigatórios' };
      }
    
      var erros = [];
    
      if (!dados.numero) erros.push('Número do contrato é obrigatório');
      if (!dados.fornecedor_id) erros.push('Fornecedor é obrigatório');
      if (!dados.objeto) erros.push('Objeto do contrato é obrigatório');
      if (!dados.valor_total || dados.valor_total <= 0) erros.push('Valor total deve ser maior que zero');
      if (!dados.data_inicio) erros.push('Data de início é obrigatória');
      if (!dados.data_fim) erros.push('Data de término é obrigatória');
    
      if (erros.length > 0) {
        return { success: false, errors: erros };
      }
    
      // Verifica fornecedor
      if (typeof SupplierManager !== 'undefined') {
        var fornecedor = SupplierManager.buscarPorId(dados.fornecedor_id);
        if (!fornecedor.success) {
          return { success: false, error: 'Fornecedor não encontrado' };
        }
      }
    
      try {
        var contrato = {
          id: _gerarId('CONT'),
          numero: dados.numero.trim(),
          ano: dados.ano || new Date().getFullYear(),
          fornecedor_id: dados.fornecedor_id,
          fornecedor_nome: dados.fornecedor_nome || '',
        
          // Dados do contrato
          objeto: dados.objeto,
          modalidade: dados.modalidade || 'Pregão Eletrônico',
          processo_sei: dados.processo_sei || '',
        
          // Valores
          valor_total: Number(dados.valor_total),
          valor_empenhado: 0,
          valor_liquidado: 0,
          valor_pago: 0,
          saldo_contratual: Number(dados.valor_total),
        
          // Vigência
          data_inicio: new Date(dados.data_inicio).toISOString(),
          data_fim: new Date(dados.data_fim).toISOString(),
          prazo_meses: dados.prazo_meses || 12,
        
          // Aditivos
          numero_aditivos: 0,
          valor_aditivos: 0,
        
          // Status
          status: CONFIG.STATUS_CONTRATO.VIGENTE,
          ativo: true,
        
          // Metadados
          criado_em: new Date().toISOString(),
          criado_por: Session.getActiveUser().getEmail(),
          atualizado_em: new Date().toISOString()
        };
      
        var resultado = _saveData(CONFIG.CONTRATOS_SHEET, contrato);
      
        if (!resultado) {
          return { success: false, error: 'Erro ao salvar contrato' };
        }
      
        // Auditoria
        if (typeof AuditService !== 'undefined') {
          AuditService.log('CONTRATO_CADASTRADO', {
            contratoId: contrato.id,
            numero: contrato.numero,
            valor: contrato.valor_total
          });
        }
      
        return {
          success: true,
          data: contrato,
          message: 'Contrato cadastrado com sucesso'
        };
      
      } catch (e) {
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em cadastrarContrato: " + error.message);
      throw error;
    }
  }
  
  /**
   * Busca contrato por ID
   * @param {string} id - ID do contrato
   * @returns {Object} Contrato
   */
  function buscarContrato(id) {
    if (!id) {
      return { success: false, error: 'ID é obrigatório' };
    }
    
    try {
      var contratos = _getData(CONFIG.CONTRATOS_SHEET, { id: id });
      
      if (!contratos || contratos.length === 0) {
        return { success: false, error: 'Contrato não encontrado' };
      }
      
      var contrato = contratos[0];
      
      // Busca empenhos vinculados
      contrato.empenhos = _getData(CONFIG.EMPENHOS_SHEET, { contrato_id: id });
      
      // Calcula totais
      contrato.total_empenhos = contrato.empenhos.length;
      contrato.percentual_empenhado = _calcularUtilizacao(contrato.valor_total, contrato.valor_empenhado);
      
      return { success: true, data: contrato };
      
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
  
  /**
   * Lista contratos
   * @param {Object} filtros - Filtros
   * @returns {Object} Lista de contratos
   */
  function listarContratos(filtros) {
    try {
      filtros = filtros || {};
    
      try {
        var contratos = _getData(CONFIG.CONTRATOS_SHEET, {});
      
        // Filtra por status
        if (filtros.status) {
          contratos = contratos.filter(function(c) {
            return c.status === filtros.status;
          });
        }
      
        // Filtra por fornecedor
        if (filtros.fornecedor_id) {
          contratos = contratos.filter(function(c) {
            return c.fornecedor_id === filtros.fornecedor_id;
          });
        }
      
        // Filtra apenas vigentes
        if (filtros.apenasVigentes) {
          var hoje = new Date();
          contratos = contratos.filter(function(c) {
            return c.status === CONFIG.STATUS_CONTRATO.VIGENTE &&
                   new Date(c.data_fim) >= hoje;
          });
        }
      
        // Adiciona percentuais
        contratos = contratos.map(function(c) {
          c.percentual_empenhado = _calcularUtilizacao(c.valor_total, c.valor_empenhado);
          c.percentual_liquidado = _calcularUtilizacao(c.valor_total, c.valor_liquidado);
          return c;
        });
      
        return {
          success: true,
          data: {
            contratos: contratos,
            total: contratos.length
          }
        };
      
      } catch (e) {
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em listarContratos: " + error.message);
      throw error;
    }
  }
  
  // =========================================================================
  // API PÚBLICA - EMPENHOS
  // =========================================================================
  
  /**
   * Emite novo empenho
   * @param {Object} dados - Dados do empenho
   * @returns {Object} Resultado
   */
  function emitirEmpenho(dados) {
    try {
      if (!dados) {
        return { success: false, error: 'Dados são obrigatórios' };
      }
    
      var erros = [];
    
      if (!dados.numero) erros.push('Número do empenho é obrigatório');
      if (!dados.contrato_id) erros.push('Contrato é obrigatório');
      if (!dados.fornecedor_id) erros.push('Fornecedor é obrigatório');
      if (!dados.valor || dados.valor <= 0) erros.push('Valor deve ser maior que zero');
    
      if (erros.length > 0) {
        return { success: false, errors: erros };
      }
    
      try {
        // Verifica fornecedor pode empenhar
        if (typeof SupplierManager !== 'undefined') {
          var podeEmpenhar = SupplierManager.podeEmpenhar(dados.fornecedor_id);
          if (!podeEmpenhar.success || !podeEmpenhar.data.podeEmpenhar) {
            return {
              success: false,
              error: 'Fornecedor não pode receber empenho',
              motivos: podeEmpenhar.data ? podeEmpenhar.data.motivos : []
            };
          }
        }
      
        // Verifica saldo do contrato
        var contrato = buscarContrato(dados.contrato_id);
        if (!contrato.success) {
          return { success: false, error: 'Contrato não encontrado' };
        }
      
        if (contrato.data.saldo_contratual < dados.valor) {
          return {
            success: false,
            error: 'Saldo contratual insuficiente',
            saldoDisponivel: contrato.data.saldo_contratual,
            valorSolicitado: dados.valor
          };
        }
      
        // Cria empenho
        var empenho = {
          id: _gerarId('EMP'),
          numero: dados.numero.trim(),
          ano: dados.ano || new Date().getFullYear(),
          contrato_id: dados.contrato_id,
          contrato_numero: contrato.data.numero,
          fornecedor_id: dados.fornecedor_id,
          fornecedor_nome: dados.fornecedor_nome || '',
        
          // Tipo
          tipo: dados.tipo || CONFIG.TIPOS_EMPENHO.ORDINARIO,
        
          // Valores
          valor_original: Number(dados.valor),
          valor_reforcos: 0,
          valor_anulacoes: 0,
          valor_atual: Number(dados.valor),
          valor_liquidado: 0,
          valor_pago: 0,
          saldo_disponivel: Number(dados.valor),
        
          // Descrição
          descricao: dados.descricao || '',
          elemento_despesa: dados.elemento_despesa || '',
          fonte_recurso: dados.fonte_recurso || '',
          programa_trabalho: dados.programa_trabalho || '',
        
          // Datas
          data_emissao: new Date().toISOString(),
          data_vencimento: dados.data_vencimento ? new Date(dados.data_vencimento).toISOString() : null,
        
          // Status
          status: CONFIG.STATUS_EMPENHO.ATIVO,
          percentual_utilizado: 0,
          alertas_enviados: '',
          ativo: true,
        
          // Metadados
          criado_em: new Date().toISOString(),
          criado_por: Session.getActiveUser().getEmail(),
          atualizado_em: new Date().toISOString()
        };
      
        var resultado = _saveData(CONFIG.EMPENHOS_SHEET, empenho);
      
        if (!resultado) {
          return { success: false, error: 'Erro ao salvar empenho' };
        }
      
        // Atualiza saldo do contrato
        _updateData(CONFIG.CONTRATOS_SHEET, dados.contrato_id, {
          valor_empenhado: contrato.data.valor_empenhado + dados.valor,
          saldo_contratual: contrato.data.saldo_contratual - dados.valor,
          atualizado_em: new Date().toISOString()
        });
      
        // Registra movimentação
        _registrarMovimentacao(empenho.id, CONFIG.TIPOS_MOVIMENTACAO.EMISSAO, dados.valor, {
          descricao: 'Emissão de empenho',
          saldo_anterior: 0,
          saldo_posterior: dados.valor
        });
      
        return {
          success: true,
          data: empenho,
          message: 'Empenho emitido com sucesso'
        };
      
      } catch (e) {
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em emitirEmpenho: " + error.message);
      throw error;
    }
  }
  
  /**
   * Busca empenho por ID
   * @param {string} id - ID do empenho
   * @returns {Object} Empenho
   */
  function buscarEmpenho(id) {
    if (!id) {
      return { success: false, error: 'ID é obrigatório' };
    }
    
    try {
      var empenhos = _getData(CONFIG.EMPENHOS_SHEET, { id: id });
      
      if (!empenhos || empenhos.length === 0) {
        return { success: false, error: 'Empenho não encontrado' };
      }
      
      var empenho = empenhos[0];
      
      // Busca movimentações
      empenho.movimentacoes = _getData(CONFIG.MOVIMENTACOES_SHEET, { empenho_id: id });
      
      return { success: true, data: empenho };
      
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
  
  /**
   * Busca empenho por número
   * @param {string} numero - Número do empenho
   * @param {number} ano - Ano (opcional)
   * @returns {Object} Empenho
   */
  function buscarEmpenhoPorNumero(numero, ano) {
    try {
      if (!numero) {
        return { success: false, error: 'Número é obrigatório' };
      }
    
      try {
        var filtros = { numero: numero.trim() };
        if (ano) filtros.ano = ano;
      
        var empenhos = _getData(CONFIG.EMPENHOS_SHEET, filtros);
      
        if (!empenhos || empenhos.length === 0) {
          return { success: false, error: 'Empenho não encontrado' };
        }
      
        return { success: true, data: empenhos[0] };
      
      } catch (e) {
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em buscarEmpenhoPorNumero: " + error.message);
      throw error;
    }
  }
  
  /**
   * Lista empenhos
   * @param {Object} filtros - Filtros
   * @returns {Object} Lista de empenhos
   */
  function listarEmpenhos(filtros) {
    try {
      filtros = filtros || {};
    
      try {
        var empenhos = _getData(CONFIG.EMPENHOS_SHEET, {});
      
        // Filtra por contrato
        if (filtros.contrato_id) {
          empenhos = empenhos.filter(function(e) {
            return e.contrato_id === filtros.contrato_id;
          });
        }
      
        // Filtra por fornecedor
        if (filtros.fornecedor_id) {
          empenhos = empenhos.filter(function(e) {
            return e.fornecedor_id === filtros.fornecedor_id;
          });
        }
      
        // Filtra por status
        if (filtros.status) {
          empenhos = empenhos.filter(function(e) {
            return e.status === filtros.status;
          });
        }
      
        // Filtra com saldo disponível
        if (filtros.comSaldo) {
          empenhos = empenhos.filter(function(e) {
            return e.saldo_disponivel > 0;
          });
        }
      
        // Ordena por data de emissão (mais recente primeiro)
        empenhos.sort(function(a, b) {
          return new Date(b.data_emissao) - new Date(a.data_emissao);
        });
      
        return {
          success: true,
          data: {
            empenhos: empenhos,
            total: empenhos.length
          }
        };
      
      } catch (e) {
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em listarEmpenhos: " + error.message);
      throw error;
    }
  }

  
  /**
   * Liquida valor do empenho (vincula NF)
   * @param {Object} dados - Dados da liquidação
   * @returns {Object} Resultado
   */
  function liquidarEmpenho(dados) {
    try {
      if (!dados || !dados.empenho_id) {
        return { success: false, error: 'Empenho é obrigatório' };
      }
    
      if (!dados.valor || dados.valor <= 0) {
        return { success: false, error: 'Valor deve ser maior que zero' };
      }
    
      try {
        var empenho = buscarEmpenho(dados.empenho_id);
        if (!empenho.success) {
          return empenho;
        }
      
        var emp = empenho.data;
      
        // Verifica saldo disponível
        if (emp.saldo_disponivel < dados.valor) {
          return {
            success: false,
            error: 'Saldo insuficiente no empenho',
            saldoDisponivel: emp.saldo_disponivel,
            valorSolicitado: dados.valor
          };
        }
      
        // Calcula novos valores
        var novoSaldo = emp.saldo_disponivel - dados.valor;
        var novoLiquidado = emp.valor_liquidado + dados.valor;
        var percentual = _calcularUtilizacao(emp.valor_atual, novoLiquidado);
      
        // Determina novo status
        var novoStatus = emp.status;
        if (novoSaldo <= 0) {
          novoStatus = CONFIG.STATUS_EMPENHO.ESGOTADO;
        } else if (novoLiquidado > 0) {
          novoStatus = CONFIG.STATUS_EMPENHO.PARCIAL;
        }
      
        // Atualiza empenho
        _updateData(CONFIG.EMPENHOS_SHEET, dados.empenho_id, {
          valor_liquidado: novoLiquidado,
          saldo_disponivel: novoSaldo,
          percentual_utilizado: percentual,
          status: novoStatus,
          atualizado_em: new Date().toISOString()
        });
      
        // Registra movimentação
        _registrarMovimentacao(dados.empenho_id, CONFIG.TIPOS_MOVIMENTACAO.LIQUIDACAO, dados.valor, {
          nota_fiscal_id: dados.nota_fiscal_id,
          nota_fiscal_numero: dados.nota_fiscal_numero,
          descricao: dados.descricao || 'Liquidação de NF',
          saldo_anterior: emp.saldo_disponivel,
          saldo_posterior: novoSaldo
        });
      
        // Atualiza contrato
        var contrato = buscarContrato(emp.contrato_id);
        if (contrato.success) {
          _updateData(CONFIG.CONTRATOS_SHEET, emp.contrato_id, {
            valor_liquidado: contrato.data.valor_liquidado + dados.valor,
            atualizado_em: new Date().toISOString()
          });
        }
      
        // Verifica alertas
        _verificarAlertaUtilizacao(emp, percentual);
      
        return {
          success: true,
          data: {
            empenhoId: dados.empenho_id,
            valorLiquidado: dados.valor,
            saldoAnterior: emp.saldo_disponivel,
            saldoAtual: novoSaldo,
            percentualUtilizado: percentual,
            status: novoStatus
          },
          message: 'Liquidação realizada com sucesso'
        };
      
      } catch (e) {
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em liquidarEmpenho: " + error.message);
      throw error;
    }
  }
  
  /**
   * Estorna liquidação
   * @param {Object} dados - Dados do estorno
   * @returns {Object} Resultado
   */
  function estornarLiquidacao(dados) {
    try {
      if (!dados || !dados.empenho_id) {
        return { success: false, error: 'Empenho é obrigatório' };
      }
    
      if (!dados.valor || dados.valor <= 0) {
        return { success: false, error: 'Valor deve ser maior que zero' };
      }
    
      try {
        var empenho = buscarEmpenho(dados.empenho_id);
        if (!empenho.success) {
          return empenho;
        }
      
        var emp = empenho.data;
      
        // Verifica se há valor liquidado suficiente
        if (emp.valor_liquidado < dados.valor) {
          return {
            success: false,
            error: 'Valor de estorno maior que valor liquidado',
            valorLiquidado: emp.valor_liquidado
          };
        }
      
        // Calcula novos valores
        var novoSaldo = emp.saldo_disponivel + dados.valor;
        var novoLiquidado = emp.valor_liquidado - dados.valor;
        var percentual = _calcularUtilizacao(emp.valor_atual, novoLiquidado);
      
        // Determina novo status
        var novoStatus = CONFIG.STATUS_EMPENHO.ATIVO;
        if (novoLiquidado > 0) {
          novoStatus = CONFIG.STATUS_EMPENHO.PARCIAL;
        }
      
        // Atualiza empenho
        _updateData(CONFIG.EMPENHOS_SHEET, dados.empenho_id, {
          valor_liquidado: novoLiquidado,
          saldo_disponivel: novoSaldo,
          percentual_utilizado: percentual,
          status: novoStatus,
          atualizado_em: new Date().toISOString()
        });
      
        // Registra movimentação
        _registrarMovimentacao(dados.empenho_id, CONFIG.TIPOS_MOVIMENTACAO.ESTORNO, dados.valor, {
          nota_fiscal_id: dados.nota_fiscal_id,
          nota_fiscal_numero: dados.nota_fiscal_numero,
          descricao: dados.motivo || 'Estorno de liquidação',
          saldo_anterior: emp.saldo_disponivel,
          saldo_posterior: novoSaldo
        });
      
        return {
          success: true,
          data: {
            empenhoId: dados.empenho_id,
            valorEstornado: dados.valor,
            saldoAtual: novoSaldo,
            status: novoStatus
          },
          message: 'Estorno realizado com sucesso'
        };
      
      } catch (e) {
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em estornarLiquidacao: " + error.message);
      throw error;
    }
  }
  
  /**
   * Reforça empenho (adiciona valor)
   * @param {Object} dados - Dados do reforço
   * @returns {Object} Resultado
   */
  function reforcarEmpenho(dados) {
    try {
      if (!dados || !dados.empenho_id) {
        return { success: false, error: 'Empenho é obrigatório' };
      }
    
      if (!dados.valor || dados.valor <= 0) {
        return { success: false, error: 'Valor deve ser maior que zero' };
      }
    
      try {
        var empenho = buscarEmpenho(dados.empenho_id);
        if (!empenho.success) {
          return empenho;
        }
      
        var emp = empenho.data;
      
        // Verifica saldo do contrato
        var contrato = buscarContrato(emp.contrato_id);
        if (!contrato.success) {
          return { success: false, error: 'Contrato não encontrado' };
        }
      
        if (contrato.data.saldo_contratual < dados.valor) {
          return {
            success: false,
            error: 'Saldo contratual insuficiente para reforço',
            saldoDisponivel: contrato.data.saldo_contratual
          };
        }
      
        // Calcula novos valores
        var novoValorAtual = emp.valor_atual + dados.valor;
        var novoSaldo = emp.saldo_disponivel + dados.valor;
        var novoReforcos = emp.valor_reforcos + dados.valor;
        var percentual = _calcularUtilizacao(novoValorAtual, emp.valor_liquidado);
      
        // Atualiza empenho
        _updateData(CONFIG.EMPENHOS_SHEET, dados.empenho_id, {
          valor_atual: novoValorAtual,
          valor_reforcos: novoReforcos,
          saldo_disponivel: novoSaldo,
          percentual_utilizado: percentual,
          status: CONFIG.STATUS_EMPENHO.ATIVO,
          atualizado_em: new Date().toISOString()
        });
      
        // Atualiza contrato
        _updateData(CONFIG.CONTRATOS_SHEET, emp.contrato_id, {
          valor_empenhado: contrato.data.valor_empenhado + dados.valor,
          saldo_contratual: contrato.data.saldo_contratual - dados.valor,
          atualizado_em: new Date().toISOString()
        });
      
        // Registra movimentação
        _registrarMovimentacao(dados.empenho_id, CONFIG.TIPOS_MOVIMENTACAO.REFORCO, dados.valor, {
          descricao: dados.justificativa || 'Reforço de empenho',
          saldo_anterior: emp.saldo_disponivel,
          saldo_posterior: novoSaldo
        });
      
        return {
          success: true,
          data: {
            empenhoId: dados.empenho_id,
            valorReforco: dados.valor,
            valorAtual: novoValorAtual,
            saldoDisponivel: novoSaldo
          },
          message: 'Reforço realizado com sucesso'
        };
      
      } catch (e) {
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em reforcarEmpenho: " + error.message);
      throw error;
    }
  }
  
  /**
   * Anula parcialmente empenho
   * @param {Object} dados - Dados da anulação
   * @returns {Object} Resultado
   */
  function anularParcialEmpenho(dados) {
    try {
      if (!dados || !dados.empenho_id) {
        return { success: false, error: 'Empenho é obrigatório' };
      }
    
      if (!dados.valor || dados.valor <= 0) {
        return { success: false, error: 'Valor deve ser maior que zero' };
      }
    
      try {
        var empenho = buscarEmpenho(dados.empenho_id);
        if (!empenho.success) {
          return empenho;
        }
      
        var emp = empenho.data;
      
        // Verifica saldo disponível para anulação
        if (emp.saldo_disponivel < dados.valor) {
          return {
            success: false,
            error: 'Valor de anulação maior que saldo disponível',
            saldoDisponivel: emp.saldo_disponivel
          };
        }
      
        // Calcula novos valores
        var novoValorAtual = emp.valor_atual - dados.valor;
        var novoSaldo = emp.saldo_disponivel - dados.valor;
        var novaAnulacao = emp.valor_anulacoes + dados.valor;
        var percentual = _calcularUtilizacao(novoValorAtual, emp.valor_liquidado);
      
        // Determina status
        var novoStatus = emp.status;
        if (novoSaldo <= 0 && emp.valor_liquidado > 0) {
          novoStatus = CONFIG.STATUS_EMPENHO.ESGOTADO;
        }
      
        // Atualiza empenho
        _updateData(CONFIG.EMPENHOS_SHEET, dados.empenho_id, {
          valor_atual: novoValorAtual,
          valor_anulacoes: novaAnulacao,
          saldo_disponivel: novoSaldo,
          percentual_utilizado: percentual,
          status: novoStatus,
          atualizado_em: new Date().toISOString()
        });
      
        // Devolve saldo ao contrato
        var contrato = buscarContrato(emp.contrato_id);
        if (contrato.success) {
          _updateData(CONFIG.CONTRATOS_SHEET, emp.contrato_id, {
            valor_empenhado: contrato.data.valor_empenhado - dados.valor,
            saldo_contratual: contrato.data.saldo_contratual + dados.valor,
            atualizado_em: new Date().toISOString()
          });
        }
      
        // Registra movimentação
        _registrarMovimentacao(dados.empenho_id, CONFIG.TIPOS_MOVIMENTACAO.ANULACAO, dados.valor, {
          descricao: dados.justificativa || 'Anulação parcial de empenho',
          saldo_anterior: emp.saldo_disponivel,
          saldo_posterior: novoSaldo
        });
      
        return {
          success: true,
          data: {
            empenhoId: dados.empenho_id,
            valorAnulado: dados.valor,
            valorAtual: novoValorAtual,
            saldoDisponivel: novoSaldo
          },
          message: 'Anulação parcial realizada com sucesso'
        };
      
      } catch (e) {
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em anularParcialEmpenho: " + error.message);
      throw error;
    }
  }
  
  /**
   * Consulta saldo de empenho
   * @param {string} empenhoId - ID do empenho
   * @returns {Object} Saldo
   */
  function consultarSaldo(empenhoId) {
    var empenho = buscarEmpenho(empenhoId);
    
    if (!empenho.success) {
      return empenho;
    }
    
    var emp = empenho.data;
    
    return {
      success: true,
      data: {
        empenhoId: emp.id,
        numero: emp.numero,
        valorOriginal: emp.valor_original,
        valorReforcos: emp.valor_reforcos,
        valorAnulacoes: emp.valor_anulacoes,
        valorAtual: emp.valor_atual,
        valorLiquidado: emp.valor_liquidado,
        saldoDisponivel: emp.saldo_disponivel,
        percentualUtilizado: emp.percentual_utilizado,
        status: emp.status,
        
        // Formatado
        saldoFormatado: _formatarMoeda(emp.saldo_disponivel),
        valorAtualFormatado: _formatarMoeda(emp.valor_atual)
      }
    };
  }
  
  /**
   * Lista movimentações de um empenho
   * @param {string} empenhoId - ID do empenho
   * @returns {Object} Movimentações
   */
  function listarMovimentacoes(empenhoId) {
    try {
      if (!empenhoId) {
        return { success: false, error: 'Empenho é obrigatório' };
      }
    
      try {
        var movimentacoes = _getData(CONFIG.MOVIMENTACOES_SHEET, { empenho_id: empenhoId });
      
        // Ordena por data (mais recente primeiro)
        movimentacoes.sort(function(a, b) {
          return new Date(b.criado_em) - new Date(a.criado_em);
        });
      
        return {
          success: true,
          data: {
            movimentacoes: movimentacoes,
            total: movimentacoes.length
          }
        };
      
      } catch (e) {
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em listarMovimentacoes: " + error.message);
      throw error;
    }
  }
  
  /**
   * Obtém resumo financeiro
   * @param {Object} filtros - Filtros
   * @returns {Object} Resumo
   */
  function getResumoFinanceiro(filtros) {
    try {
      filtros = filtros || {};
    
      try {
        var contratos = _getData(CONFIG.CONTRATOS_SHEET, {});
        var empenhos = _getData(CONFIG.EMPENHOS_SHEET, {});
      
        // Filtra por ano
        if (filtros.ano) {
          contratos = contratos.filter(function(c) { return c.ano == filtros.ano; });
          empenhos = empenhos.filter(function(e) { return e.ano == filtros.ano; });
        }
      
        // Calcula totais
        var totalContratado = contratos.reduce(function(sum, c) { return sum + (c.valor_total || 0); }, 0);
        var totalEmpenhado = contratos.reduce(function(sum, c) { return sum + (c.valor_empenhado || 0); }, 0);
        var totalLiquidado = contratos.reduce(function(sum, c) { return sum + (c.valor_liquidado || 0); }, 0);
        var totalPago = contratos.reduce(function(sum, c) { return sum + (c.valor_pago || 0); }, 0);
        var saldoContratual = contratos.reduce(function(sum, c) { return sum + (c.saldo_contratual || 0); }, 0);
      
        var saldoEmpenhos = empenhos.reduce(function(sum, e) { return sum + (e.saldo_disponivel || 0); }, 0);
      
        return {
          success: true,
          data: {
            contratos: {
              quantidade: contratos.length,
              valorTotal: totalContratado,
              valorEmpenhado: totalEmpenhado,
              valorLiquidado: totalLiquidado,
              valorPago: totalPago,
              saldoDisponivel: saldoContratual,
              percentualEmpenhado: _calcularUtilizacao(totalContratado, totalEmpenhado),
              percentualLiquidado: _calcularUtilizacao(totalContratado, totalLiquidado)
            },
            empenhos: {
              quantidade: empenhos.length,
              saldoTotal: saldoEmpenhos,
              ativos: empenhos.filter(function(e) { return e.status === CONFIG.STATUS_EMPENHO.ATIVO; }).length,
              esgotados: empenhos.filter(function(e) { return e.status === CONFIG.STATUS_EMPENHO.ESGOTADO; }).length
            },
            formatado: {
              totalContratado: _formatarMoeda(totalContratado),
              totalEmpenhado: _formatarMoeda(totalEmpenhado),
              totalLiquidado: _formatarMoeda(totalLiquidado),
              saldoDisponivel: _formatarMoeda(saldoContratual)
            }
          }
        };
      
      } catch (e) {
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em getResumoFinanceiro: " + error.message);
      throw error;
    }
  }
  
  // =========================================================================
  // API PÚBLICA DO MÓDULO
  // =========================================================================
  
  return {
    // Contratos
    cadastrarContrato: cadastrarContrato,
    buscarContrato: buscarContrato,
    listarContratos: listarContratos,
    
    // Empenhos
    emitirEmpenho: emitirEmpenho,
    buscarEmpenho: buscarEmpenho,
    buscarEmpenhoPorNumero: buscarEmpenhoPorNumero,
    listarEmpenhos: listarEmpenhos,
    
    // Operações de empenho
    liquidarEmpenho: liquidarEmpenho,
    estornarLiquidacao: estornarLiquidacao,
    reforcarEmpenho: reforcarEmpenho,
    anularParcialEmpenho: anularParcialEmpenho,
    
    // Consultas
    consultarSaldo: consultarSaldo,
    listarMovimentacoes: listarMovimentacoes,
    getResumoFinanceiro: getResumoFinanceiro,
    
    // Constantes
    STATUS_CONTRATO: CONFIG.STATUS_CONTRATO,
    STATUS_EMPENHO: CONFIG.STATUS_EMPENHO,
    TIPOS_EMPENHO: CONFIG.TIPOS_EMPENHO
  };
  
})();

// ============================================================================
// FUNÇÕES GLOBAIS - API para Frontend
// ============================================================================

function api_contrato_cadastrar(dados) {
  return ContractService.cadastrarContrato(dados);
}

function api_contrato_buscar(id) {
  return ContractService.buscarContrato(id);
}

function api_contrato_listar(filtros) {
  return ContractService.listarContratos(filtros);
}

function api_empenho_emitir(dados) {
  return ContractService.emitirEmpenho(dados);
}

function api_empenho_buscar(id) {
  return ContractService.buscarEmpenho(id);
}

function api_empenho_buscarPorNumero(numero, ano) {
  return ContractService.buscarEmpenhoPorNumero(numero, ano);
}

function api_empenho_listar(filtros) {
  return ContractService.listarEmpenhos(filtros);
}

function api_empenho_liquidar(dados) {
  return ContractService.liquidarEmpenho(dados);
}

function api_empenho_estornar(dados) {
  return ContractService.estornarLiquidacao(dados);
}

function api_empenho_reforcar(dados) {
  return ContractService.reforcarEmpenho(dados);
}

function api_empenho_anularParcial(dados) {
  return ContractService.anularParcialEmpenho(dados);
}

function api_empenho_consultarSaldo(empenhoId) {
  return ContractService.consultarSaldo(empenhoId);
}

function api_empenho_movimentacoes(empenhoId) {
  return ContractService.listarMovimentacoes(empenhoId);
}

function api_financeiro_resumo(filtros) {
  return ContractService.getResumoFinanceiro(filtros);
}

// ============================================================================
// REGISTRO DO MÓDULO
// ============================================================================

(function() {
  var moduleName = 'ContractService';
  var moduleVersion = '1.0.0';
  
  try {
    if (typeof ServiceContainer !== 'undefined') {
      ServiceContainer.register(moduleName, ContractService);
    }
    
    Logger.log('[' + moduleName + ' v' + moduleVersion + '] Módulo carregado');
    Logger.log('[' + moduleName + '] Alertas de utilização: 90%, 95%, 100%');
    
  } catch (e) {
    console.error('[' + moduleName + '] Erro ao registrar: ' + e.message);
  }
})();
