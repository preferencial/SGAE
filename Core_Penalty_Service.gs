/**
 * @fileoverview Serviço de Glosas e Devoluções - Alimentação Escolar CRE-PP
 * @version 1.0.0
 * 
 * Intervenção 25/38: PenaltyService conforme Prompt 25
 * 
 * Funcionalidades:
 * - Cálculo automático de glosas
 * - Abatimento proporcional por qualidade/quantidade
 * - Registro de devoluções
 * - Histórico de penalidades por fornecedor
 * - Integração com NF e Empenhos
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-25
 */

'use strict';

// ============================================================================
// PENALTY SERVICE - Gestão de Glosas e Devoluções
// ============================================================================

var PenaltyService = (function() {
  
  // =========================================================================
  // CONFIGURAÇÃO
  // =========================================================================
  
  var CONFIG = {
    // Planilhas
    GLOSAS_SHEET: 'Glosas',
    DEVOLUCOES_SHEET: 'Devolucoes',
    
    // Tipos de glosa
    TIPOS_GLOSA: {
      QUANTIDADE: { codigo: 'QTD', nome: 'Quantidade Inferior', percentualBase: 100 },
      QUALIDADE: { codigo: 'QLT', nome: 'Qualidade Inadequada', percentualBase: 100 },
      TEMPERATURA: { codigo: 'TMP', nome: 'Temperatura Inadequada', percentualBase: 100 },
      EMBALAGEM: { codigo: 'EMB', nome: 'Embalagem Danificada', percentualBase: 50 },
      VALIDADE: { codigo: 'VAL', nome: 'Prazo de Validade Curto', percentualBase: 30 },
      ATRASO: { codigo: 'ATR', nome: 'Atraso na Entrega', percentualBase: 10 },
      DOCUMENTACAO: { codigo: 'DOC', nome: 'Documentação Irregular', percentualBase: 5 }
    },
    
    // Status de glosa
    STATUS_GLOSA: {
      PENDENTE: 'Pendente',
      APROVADA: 'Aprovada',
      CONTESTADA: 'Contestada',
      CANCELADA: 'Cancelada',
      APLICADA: 'Aplicada'
    },
    
    // Status de devolução
    STATUS_DEVOLUCAO: {
      SOLICITADA: 'Solicitada',
      AGENDADA: 'Agendada',
      REALIZADA: 'Realizada',
      CANCELADA: 'Cancelada'
    },
    
    // Limites
    PERCENTUAL_MAXIMO_GLOSA: 100,
    DIAS_CONTESTACAO: 5
  };
  
  // =========================================================================
  // FUNÇÕES PRIVADAS
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
   * Calcula valor da glosa baseado no tipo e quantidade
   * @private
   */
  function _calcularValorGlosa(tipo, valorItem, quantidade, quantidadeProblema) {
    var tipoConfig = CONFIG.TIPOS_GLOSA[tipo];
    if (!tipoConfig) return 0;
    
    var percentualBase = tipoConfig.percentualBase;
    var proporcao = quantidadeProblema / quantidade;
    
    return valorItem * proporcao * (percentualBase / 100);
  }

  // =========================================================================
  // API PÚBLICA - GLOSAS
  // =========================================================================
  
  /**
   * Calcula glosa sugerida para um item
   * @param {Object} dados - Dados para cálculo
   * @param {string} dados.tipo - Tipo de glosa
   * @param {number} dados.valorUnitario - Valor unitário do item
   * @param {number} dados.quantidadeEsperada - Quantidade esperada
   * @param {number} dados.quantidadeRecebida - Quantidade recebida
   * @param {number} dados.quantidadeProblema - Quantidade com problema
   * @returns {Object} Cálculo da glosa
   */
  function calcularGlosa(dados) {
    if (!dados || !dados.tipo) {
      return { success: false, error: 'Tipo de glosa é obrigatório' };
    }
    
    var tipoConfig = CONFIG.TIPOS_GLOSA[dados.tipo];
    if (!tipoConfig) {
      return { success: false, error: 'Tipo de glosa inválido' };
    }
    
    try {
      var valorUnitario = Number(dados.valorUnitario) || 0;
      var qtdEsperada = Number(dados.quantidadeEsperada) || 0;
      var qtdRecebida = Number(dados.quantidadeRecebida) || qtdEsperada;
      var qtdProblema = Number(dados.quantidadeProblema) || 0;
      
      // Calcula diferença de quantidade
      var diferencaQtd = qtdEsperada - qtdRecebida;
      
      // Valor total do item
      var valorTotalItem = valorUnitario * qtdEsperada;
      
      // Calcula glosa
      var valorGlosa = 0;
      var descricaoCalculo = '';
      
      if (dados.tipo === 'QUANTIDADE') {
        // Glosa por quantidade faltante
        valorGlosa = valorUnitario * diferencaQtd;
        descricaoCalculo = 'Quantidade faltante: ' + diferencaQtd + ' x R$ ' + valorUnitario.toFixed(2);
      } else {
        // Glosa por qualidade/outros problemas
        var percentualBase = tipoConfig.percentualBase;
        var proporcao = qtdProblema / qtdEsperada;
        valorGlosa = valorTotalItem * proporcao * (percentualBase / 100);
        descricaoCalculo = 'Qtd problema: ' + qtdProblema + ' (' + (proporcao * 100).toFixed(1) + '%) x ' + percentualBase + '%';
      }
      
      // Limita ao valor máximo do item
      valorGlosa = Math.min(valorGlosa, valorTotalItem);
      valorGlosa = Math.max(valorGlosa, 0);
      
      var percentualGlosa = valorTotalItem > 0 ? (valorGlosa / valorTotalItem * 100) : 0;
      
      return {
        success: true,
        data: {
          tipo: dados.tipo,
          tipoNome: tipoConfig.nome,
          valorUnitario: valorUnitario,
          quantidadeEsperada: qtdEsperada,
          quantidadeRecebida: qtdRecebida,
          quantidadeProblema: qtdProblema,
          valorTotalItem: valorTotalItem,
          valorGlosa: valorGlosa,
          percentualGlosa: percentualGlosa,
          descricaoCalculo: descricaoCalculo,
          
          // Formatado
          valorGlosaFormatado: _formatarMoeda(valorGlosa),
          valorTotalFormatado: _formatarMoeda(valorTotalItem)
        }
      };
      
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
  
  /**
   * Registra glosa para uma Nota Fiscal
   * @param {Object} dados - Dados da glosa
   * @returns {Object} Resultado
   */
  function registrarGlosa(dados) {
    try {
      if (!dados) {
        return { success: false, error: 'Dados são obrigatórios' };
      }
    
      var erros = [];
      if (!dados.nota_fiscal_id) erros.push('Nota Fiscal é obrigatória');
      if (!dados.tipo) erros.push('Tipo de glosa é obrigatório');
      if (!dados.valor || dados.valor <= 0) erros.push('Valor deve ser maior que zero');
    
      if (erros.length > 0) {
        return { success: false, errors: erros };
      }
    
      try {
        var tipoConfig = CONFIG.TIPOS_GLOSA[dados.tipo];
      
        var glosa = {
          id: _gerarId('GLOSA'),
          nota_fiscal_id: dados.nota_fiscal_id,
          nota_fiscal_numero: dados.nota_fiscal_numero || '',
          fornecedor_id: dados.fornecedor_id || '',
          fornecedor_nome: dados.fornecedor_nome || '',
          empenho_id: dados.empenho_id || '',
        
          // Tipo e valores
          tipo: dados.tipo,
          tipo_nome: tipoConfig ? tipoConfig.nome : dados.tipo,
          valor: Number(dados.valor),
          percentual: Number(dados.percentual) || 0,
        
          // Item afetado
          item_id: dados.item_id || '',
          item_nome: dados.item_nome || '',
          quantidade_esperada: dados.quantidade_esperada || 0,
          quantidade_recebida: dados.quantidade_recebida || 0,
          quantidade_problema: dados.quantidade_problema || 0,
        
          // Justificativa
          justificativa: dados.justificativa || '',
          evidencias: dados.evidencias || '', // IDs de fotos/documentos
        
          // Status
          status: CONFIG.STATUS_GLOSA.PENDENTE,
        
          // Datas
          data_registro: new Date().toISOString(),
          data_limite_contestacao: new Date(Date.now() + CONFIG.DIAS_CONTESTACAO * 24 * 60 * 60 * 1000).toISOString(),
        
          // Metadados
          criado_por: Session.getActiveUser().getEmail(),
          criado_em: new Date().toISOString()
        };
      
        var resultado = _saveData(CONFIG.GLOSAS_SHEET, glosa);
      
        if (!resultado) {
          return { success: false, error: 'Erro ao salvar glosa' };
        }
      
        // Notifica fornecedor
        if (typeof NotificationService !== 'undefined') {
          NotificationService.enviar({
            tipo: 'GLOSA_REGISTRADA',
            titulo: 'Nova Glosa Registrada',
            mensagem: 'Foi registrada uma glosa de ' + _formatarMoeda(glosa.valor) + 
                      ' na NF ' + glosa.nota_fiscal_numero + '. Motivo: ' + glosa.tipo_nome,
            destinatarios: [dados.fornecedor_email],
            prioridade: 'ALTA',
            dados: { glosaId: glosa.id }
          });
        }
      
        // Auditoria
        if (typeof AuditService !== 'undefined') {
          AuditService.log('GLOSA_REGISTRADA', {
            glosaId: glosa.id,
            notaFiscal: glosa.nota_fiscal_numero,
            tipo: glosa.tipo,
            valor: glosa.valor
          });
        }
      
        return {
          success: true,
          data: glosa,
          message: 'Glosa registrada com sucesso'
        };
      
      } catch (e) {
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em registrarGlosa: " + error.message);
      throw error;
    }
  }
  
  /**
   * Registra múltiplas glosas de uma conferência
   * @param {Object} dados - Dados da conferência
   * @returns {Object} Resultado
   */
  function registrarGlosasConferencia(dados) {
    try {
      if (!dados || !dados.nota_fiscal_id || !dados.itens) {
        return { success: false, error: 'Dados incompletos' };
      }
    
      try {
        var glosasRegistradas = [];
        var valorTotalGlosas = 0;
      
        dados.itens.forEach(function(item) {
          if (!item.problemas || item.problemas.length === 0) return;
        
          item.problemas.forEach(function(problema) {
            var calculo = calcularGlosa({
              tipo: problema.tipo,
              valorUnitario: item.valor_unitario,
              quantidadeEsperada: item.quantidade_esperada,
              quantidadeRecebida: item.quantidade_recebida,
              quantidadeProblema: problema.quantidade || item.quantidade_problema
            });
          
            if (calculo.success && calculo.data.valorGlosa > 0) {
              var resultado = registrarGlosa({
                nota_fiscal_id: dados.nota_fiscal_id,
                nota_fiscal_numero: dados.nota_fiscal_numero,
                fornecedor_id: dados.fornecedor_id,
                fornecedor_nome: dados.fornecedor_nome,
                empenho_id: dados.empenho_id,
                tipo: problema.tipo,
                valor: calculo.data.valorGlosa,
                percentual: calculo.data.percentualGlosa,
                item_id: item.id,
                item_nome: item.nome,
                quantidade_esperada: item.quantidade_esperada,
                quantidade_recebida: item.quantidade_recebida,
                quantidade_problema: problema.quantidade,
                justificativa: problema.observacao || ''
              });
            
              if (resultado.success) {
                glosasRegistradas.push(resultado.data);
                valorTotalGlosas += calculo.data.valorGlosa;
              }
            }
          });
        });
      
        return {
          success: true,
          data: {
            glosas: glosasRegistradas,
            quantidade: glosasRegistradas.length,
            valorTotal: valorTotalGlosas,
            valorTotalFormatado: _formatarMoeda(valorTotalGlosas)
          }
        };
      
      } catch (e) {
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em registrarGlosasConferencia: " + error.message);
      throw error;
    }
  }
  
  /**
   * Aprova glosa
   * @param {string} glosaId - ID da glosa
   * @param {Object} dados - Dados adicionais
   * @returns {Object} Resultado
   */
  function aprovarGlosa(glosaId, dados) {
    if (!glosaId) {
      return { success: false, error: 'ID da glosa é obrigatório' };
    }
    
    try {
      var glosas = _getData(CONFIG.GLOSAS_SHEET, { id: glosaId });
      if (!glosas || glosas.length === 0) {
        return { success: false, error: 'Glosa não encontrada' };
      }
      
      var glosa = glosas[0];
      
      if (glosa.status !== CONFIG.STATUS_GLOSA.PENDENTE) {
        return { success: false, error: 'Glosa não está pendente' };
      }
      
      _updateData(CONFIG.GLOSAS_SHEET, glosaId, {
        status: CONFIG.STATUS_GLOSA.APROVADA,
        aprovado_por: Session.getActiveUser().getEmail(),
        aprovado_em: new Date().toISOString(),
        observacao_aprovacao: dados ? dados.observacao : ''
      });
      
      // Auditoria
      if (typeof AuditService !== 'undefined') {
        AuditService.log('GLOSA_APROVADA', { glosaId: glosaId });
      }
      
      return {
        success: true,
        message: 'Glosa aprovada com sucesso'
      };
      
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
  
  /**
   * Contesta glosa (pelo fornecedor)
   * @param {string} glosaId - ID da glosa
   * @param {Object} dados - Dados da contestação
   * @returns {Object} Resultado
   */
  function contestarGlosa(glosaId, dados) {
    if (!glosaId) {
      return { success: false, error: 'ID da glosa é obrigatório' };
    }
    
    if (!dados || !dados.justificativa) {
      return { success: false, error: 'Justificativa é obrigatória' };
    }
    
    try {
      var glosas = _getData(CONFIG.GLOSAS_SHEET, { id: glosaId });
      if (!glosas || glosas.length === 0) {
        return { success: false, error: 'Glosa não encontrada' };
      }
      
      var glosa = glosas[0];
      
      // Verifica prazo de contestação
      if (new Date() > new Date(glosa.data_limite_contestacao)) {
        return { success: false, error: 'Prazo de contestação expirado' };
      }
      
      if (glosa.status !== CONFIG.STATUS_GLOSA.PENDENTE) {
        return { success: false, error: 'Glosa não pode ser contestada' };
      }
      
      _updateData(CONFIG.GLOSAS_SHEET, glosaId, {
        status: CONFIG.STATUS_GLOSA.CONTESTADA,
        contestacao_justificativa: dados.justificativa,
        contestacao_evidencias: dados.evidencias || '',
        contestado_por: Session.getActiveUser().getEmail(),
        contestado_em: new Date().toISOString()
      });
      
      // Notifica UNIAE
      if (typeof NotificationService !== 'undefined') {
        NotificationService.enviar({
          tipo: 'GLOSA_CONTESTADA',
          titulo: 'Glosa Contestada',
          mensagem: 'A glosa ' + glosaId + ' foi contestada pelo fornecedor.',
          destinatarios: ['uniae@cre-pp.gov.br'],
          prioridade: 'MEDIA'
        });
      }
      
      return {
        success: true,
        message: 'Contestação registrada com sucesso'
      };
      
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
  
  /**
   * Aplica glosa na NF (abate do valor)
   * @param {string} glosaId - ID da glosa
   * @returns {Object} Resultado
   */
  function aplicarGlosa(glosaId) {
    if (!glosaId) {
      return { success: false, error: 'ID da glosa é obrigatório' };
    }
    
    try {
      var glosas = _getData(CONFIG.GLOSAS_SHEET, { id: glosaId });
      if (!glosas || glosas.length === 0) {
        return { success: false, error: 'Glosa não encontrada' };
      }
      
      var glosa = glosas[0];
      
      if (glosa.status !== CONFIG.STATUS_GLOSA.APROVADA) {
        return { success: false, error: 'Glosa precisa estar aprovada para ser aplicada' };
      }
      
      // Atualiza status da glosa
      _updateData(CONFIG.GLOSAS_SHEET, glosaId, {
        status: CONFIG.STATUS_GLOSA.APLICADA,
        aplicado_por: Session.getActiveUser().getEmail(),
        aplicado_em: new Date().toISOString()
      });
      
      // Auditoria
      if (typeof AuditService !== 'undefined') {
        AuditService.log('GLOSA_APLICADA', {
          glosaId: glosaId,
          notaFiscal: glosa.nota_fiscal_numero,
          valor: glosa.valor
        });
      }
      
      return {
        success: true,
        data: {
          glosaId: glosaId,
          valorAbatido: glosa.valor,
          valorAbatidoFormatado: _formatarMoeda(glosa.valor)
        },
        message: 'Glosa aplicada com sucesso'
      };
      
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  /**
   * Lista glosas
   * @param {Object} filtros - Filtros
   * @returns {Object} Lista de glosas
   */
  function listarGlosas(filtros) {
    try {
      filtros = filtros || {};
    
      try {
        var glosas = _getData(CONFIG.GLOSAS_SHEET, {});
      
        // Aplica filtros
        if (filtros.nota_fiscal_id) {
          glosas = glosas.filter(function(g) { return g.nota_fiscal_id === filtros.nota_fiscal_id; });
        }
      
        if (filtros.fornecedor_id) {
          glosas = glosas.filter(function(g) { return g.fornecedor_id === filtros.fornecedor_id; });
        }
      
        if (filtros.status) {
          glosas = glosas.filter(function(g) { return g.status === filtros.status; });
        }
      
        if (filtros.tipo) {
          glosas = glosas.filter(function(g) { return g.tipo === filtros.tipo; });
        }
      
        // Ordena por data (mais recente primeiro)
        glosas.sort(function(a, b) {
          return new Date(b.criado_em) - new Date(a.criado_em);
        });
      
        // Calcula totais
        var valorTotal = glosas.reduce(function(sum, g) { return sum + (g.valor || 0); }, 0);
      
        return {
          success: true,
          data: {
            glosas: glosas,
            total: glosas.length,
            valorTotal: valorTotal,
            valorTotalFormatado: _formatarMoeda(valorTotal)
          }
        };
      
      } catch (e) {
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em listarGlosas: " + error.message);
      throw error;
    }
  }
  
  /**
   * Busca glosa por ID
   * @param {string} id - ID da glosa
   * @returns {Object} Glosa
   */
  function buscarGlosa(id) {
    if (!id) {
      return { success: false, error: 'ID é obrigatório' };
    }
    
    try {
      var glosas = _getData(CONFIG.GLOSAS_SHEET, { id: id });
      
      if (!glosas || glosas.length === 0) {
        return { success: false, error: 'Glosa não encontrada' };
      }
      
      return { success: true, data: glosas[0] };
      
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
  
  /**
   * Calcula total de glosas de uma NF
   * @param {string} notaFiscalId - ID da NF
   * @returns {Object} Total de glosas
   */
  function getTotalGlosasNF(notaFiscalId) {
    try {
      if (!notaFiscalId) {
        return { success: false, error: 'ID da NF é obrigatório' };
      }
    
      try {
        var glosas = _getData(CONFIG.GLOSAS_SHEET, { nota_fiscal_id: notaFiscalId });
      
        var totalPendente = 0;
        var totalAprovado = 0;
        var totalAplicado = 0;
      
        glosas.forEach(function(g) {
          switch (g.status) {
            case CONFIG.STATUS_GLOSA.PENDENTE:
            case CONFIG.STATUS_GLOSA.CONTESTADA:
              totalPendente += g.valor || 0;
              break;
            case CONFIG.STATUS_GLOSA.APROVADA:
              totalAprovado += g.valor || 0;
              break;
            case CONFIG.STATUS_GLOSA.APLICADA:
              totalAplicado += g.valor || 0;
              break;
          }
        });
      
        var totalGeral = totalPendente + totalAprovado + totalAplicado;
      
        return {
          success: true,
          data: {
            quantidade: glosas.length,
            totalPendente: totalPendente,
            totalAprovado: totalAprovado,
            totalAplicado: totalAplicado,
            totalGeral: totalGeral,
          
            // Formatado
            totalPendenteFormatado: _formatarMoeda(totalPendente),
            totalAprovadoFormatado: _formatarMoeda(totalAprovado),
            totalAplicadoFormatado: _formatarMoeda(totalAplicado),
            totalGeralFormatado: _formatarMoeda(totalGeral)
          }
        };
      
      } catch (e) {
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em getTotalGlosasNF: " + error.message);
      throw error;
    }
  }
  
  // =========================================================================
  // API PÚBLICA - DEVOLUÇÕES
  // =========================================================================
  
  /**
   * Registra devolução de produtos
   * @param {Object} dados - Dados da devolução
   * @returns {Object} Resultado
   */
  function registrarDevolucao(dados) {
    try {
      if (!dados) {
        return { success: false, error: 'Dados são obrigatórios' };
      }
    
      var erros = [];
      if (!dados.nota_fiscal_id) erros.push('Nota Fiscal é obrigatória');
      if (!dados.itens || dados.itens.length === 0) erros.push('Itens são obrigatórios');
      if (!dados.motivo) erros.push('Motivo é obrigatório');
    
      if (erros.length > 0) {
        return { success: false, errors: erros };
      }
    
      try {
        // Calcula valor total da devolução
        var valorTotal = dados.itens.reduce(function(sum, item) {
          return sum + (item.valor_unitario * item.quantidade);
        }, 0);
      
        var devolucao = {
          id: _gerarId('DEV'),
          nota_fiscal_id: dados.nota_fiscal_id,
          nota_fiscal_numero: dados.nota_fiscal_numero || '',
          fornecedor_id: dados.fornecedor_id || '',
          fornecedor_nome: dados.fornecedor_nome || '',
        
          // Itens
          itens: JSON.stringify(dados.itens),
          quantidade_itens: dados.itens.length,
        
          // Valores
          valor_total: valorTotal,
        
          // Motivo
          motivo: dados.motivo,
          observacoes: dados.observacoes || '',
        
          // Status
          status: CONFIG.STATUS_DEVOLUCAO.SOLICITADA,
        
          // Datas
          data_solicitacao: new Date().toISOString(),
          data_prevista_retirada: dados.data_prevista_retirada || '',
        
          // Metadados
          criado_por: Session.getActiveUser().getEmail(),
          criado_em: new Date().toISOString()
        };
      
        var resultado = _saveData(CONFIG.DEVOLUCOES_SHEET, devolucao);
      
        if (!resultado) {
          return { success: false, error: 'Erro ao salvar devolução' };
        }
      
        // Notifica fornecedor
        if (typeof NotificationService !== 'undefined') {
          NotificationService.enviar({
            tipo: 'DEVOLUCAO_SOLICITADA',
            titulo: 'Devolução Solicitada',
            mensagem: 'Foi solicitada a devolução de ' + dados.itens.length + ' item(ns) da NF ' + 
                      devolucao.nota_fiscal_numero + '. Valor: ' + _formatarMoeda(valorTotal),
            destinatarios: [dados.fornecedor_email],
            prioridade: 'ALTA'
          });
        }
      
        // Auditoria
        if (typeof AuditService !== 'undefined') {
          AuditService.log('DEVOLUCAO_REGISTRADA', {
            devolucaoId: devolucao.id,
            notaFiscal: devolucao.nota_fiscal_numero,
            valor: valorTotal
          });
        }
      
        return {
          success: true,
          data: devolucao,
          message: 'Devolução registrada com sucesso'
        };
      
      } catch (e) {
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em registrarDevolucao: " + error.message);
      throw error;
    }
  }
  
  /**
   * Agenda retirada de devolução
   * @param {string} devolucaoId - ID da devolução
   * @param {Object} dados - Dados do agendamento
   * @returns {Object} Resultado
   */
  function agendarRetirada(devolucaoId, dados) {
    try {
      if (!devolucaoId) {
        return { success: false, error: 'ID da devolução é obrigatório' };
      }
    
      if (!dados || !dados.data_retirada) {
        return { success: false, error: 'Data de retirada é obrigatória' };
      }
    
      try {
        _updateData(CONFIG.DEVOLUCOES_SHEET, devolucaoId, {
          status: CONFIG.STATUS_DEVOLUCAO.AGENDADA,
          data_retirada_agendada: new Date(dados.data_retirada).toISOString(),
          responsavel_retirada: dados.responsavel || '',
          atualizado_em: new Date().toISOString()
        });
      
        return {
          success: true,
          message: 'Retirada agendada com sucesso'
        };
      
      } catch (e) {
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em agendarRetirada: " + error.message);
      throw error;
    }
  }
  
  /**
   * Confirma realização da devolução
   * @param {string} devolucaoId - ID da devolução
   * @param {Object} dados - Dados da confirmação
   * @returns {Object} Resultado
   */
  function confirmarDevolucao(devolucaoId, dados) {
    try {
      if (!devolucaoId) {
        return { success: false, error: 'ID da devolução é obrigatório' };
      }
    
      try {
        _updateData(CONFIG.DEVOLUCOES_SHEET, devolucaoId, {
          status: CONFIG.STATUS_DEVOLUCAO.REALIZADA,
          data_retirada_realizada: new Date().toISOString(),
          responsavel_entrega: dados ? dados.responsavel : '',
          observacoes_retirada: dados ? dados.observacoes : '',
          atualizado_em: new Date().toISOString()
        });
      
        // Auditoria
        if (typeof AuditService !== 'undefined') {
          AuditService.log('DEVOLUCAO_REALIZADA', { devolucaoId: devolucaoId });
        }
      
        return {
          success: true,
          message: 'Devolução confirmada com sucesso'
        };
      
      } catch (e) {
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em confirmarDevolucao: " + error.message);
      throw error;
    }
  }
  
  /**
   * Lista devoluções
   * @param {Object} filtros - Filtros
   * @returns {Object} Lista de devoluções
   */
  function listarDevolucoes(filtros) {
    try {
      filtros = filtros || {};
    
      try {
        var devolucoes = _getData(CONFIG.DEVOLUCOES_SHEET, {});
      
        if (filtros.fornecedor_id) {
          devolucoes = devolucoes.filter(function(d) { return d.fornecedor_id === filtros.fornecedor_id; });
        }
      
        if (filtros.status) {
          devolucoes = devolucoes.filter(function(d) { return d.status === filtros.status; });
        }
      
        // Parse itens JSON
        devolucoes = devolucoes.map(function(d) {
          try {
            d.itens_parsed = JSON.parse(d.itens);
          } catch (e) {
            d.itens_parsed = [];
          }
          return d;
        });
      
        return {
          success: true,
          data: {
            devolucoes: devolucoes,
            total: devolucoes.length
          }
        };
      
      } catch (e) {
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em listarDevolucoes: " + error.message);
      throw error;
    }
  }
  
  // =========================================================================
  // API PÚBLICA - RELATÓRIOS
  // =========================================================================
  
  /**
   * Gera relatório de penalidades por fornecedor
   * @param {string} fornecedorId - ID do fornecedor
   * @param {Object} periodo - Período de análise
   * @returns {Object} Relatório
   */
  function getRelatorioFornecedor(fornecedorId, periodo) {
    try {
      if (!fornecedorId) {
        return { success: false, error: 'Fornecedor é obrigatório' };
      }
    
      try {
        var glosas = _getData(CONFIG.GLOSAS_SHEET, { fornecedor_id: fornecedorId });
        var devolucoes = _getData(CONFIG.DEVOLUCOES_SHEET, { fornecedor_id: fornecedorId });
      
        // Filtra por período se especificado
        if (periodo && periodo.inicio) {
          var dataInicio = new Date(periodo.inicio);
          var dataFim = periodo.fim ? new Date(periodo.fim) : new Date();
        
          glosas = glosas.filter(function(g) {
            var data = new Date(g.criado_em);
            return data >= dataInicio && data <= dataFim;
          });
        
          devolucoes = devolucoes.filter(function(d) {
            var data = new Date(d.criado_em);
            return data >= dataInicio && data <= dataFim;
          });
        }
      
        // Agrupa glosas por tipo
        var glosaPorTipo = {};
        glosas.forEach(function(g) {
          if (!glosaPorTipo[g.tipo]) {
            glosaPorTipo[g.tipo] = { quantidade: 0, valor: 0 };
          }
          glosaPorTipo[g.tipo].quantidade++;
          glosaPorTipo[g.tipo].valor += g.valor || 0;
        });
      
        // Totais
        var totalGlosas = glosas.reduce(function(sum, g) { return sum + (g.valor || 0); }, 0);
        var totalDevolucoes = devolucoes.reduce(function(sum, d) { return sum + (d.valor_total || 0); }, 0);
      
        return {
          success: true,
          data: {
            fornecedorId: fornecedorId,
            periodo: periodo,
          
            glosas: {
              quantidade: glosas.length,
              valorTotal: totalGlosas,
              porTipo: glosaPorTipo
            },
          
            devolucoes: {
              quantidade: devolucoes.length,
              valorTotal: totalDevolucoes
            },
          
            totalPenalidades: totalGlosas + totalDevolucoes,
            totalPenalidadesFormatado: _formatarMoeda(totalGlosas + totalDevolucoes)
          }
        };
      
      } catch (e) {
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em getRelatorioFornecedor: " + error.message);
      throw error;
    }
  }
  
  /**
   * Obtém tipos de glosa disponíveis
   * @returns {Object} Tipos de glosa
   */
  function getTiposGlosa() {
    return {
      success: true,
      data: CONFIG.TIPOS_GLOSA
    };
  }
  
  // =========================================================================
  // API PÚBLICA DO MÓDULO
  // =========================================================================
  
  return {
    // Cálculo
    calcularGlosa: calcularGlosa,
    
    // Glosas
    registrarGlosa: registrarGlosa,
    registrarGlosasConferencia: registrarGlosasConferencia,
    aprovarGlosa: aprovarGlosa,
    contestarGlosa: contestarGlosa,
    aplicarGlosa: aplicarGlosa,
    listarGlosas: listarGlosas,
    buscarGlosa: buscarGlosa,
    getTotalGlosasNF: getTotalGlosasNF,
    
    // Devoluções
    registrarDevolucao: registrarDevolucao,
    agendarRetirada: agendarRetirada,
    confirmarDevolucao: confirmarDevolucao,
    listarDevolucoes: listarDevolucoes,
    
    // Relatórios
    getRelatorioFornecedor: getRelatorioFornecedor,
    
    // Utilitários
    getTiposGlosa: getTiposGlosa,
    
    // Constantes
    TIPOS_GLOSA: CONFIG.TIPOS_GLOSA,
    STATUS_GLOSA: CONFIG.STATUS_GLOSA,
    STATUS_DEVOLUCAO: CONFIG.STATUS_DEVOLUCAO
  };
  
})();

// ============================================================================
// FUNÇÕES GLOBAIS - API para Frontend
// ============================================================================

function api_glosa_calcular(dados) {
  return PenaltyService.calcularGlosa(dados);
}

function api_glosa_registrar(dados) {
  return PenaltyService.registrarGlosa(dados);
}

function api_glosa_registrarConferencia(dados) {
  return PenaltyService.registrarGlosasConferencia(dados);
}

function api_glosa_aprovar(glosaId, dados) {
  return PenaltyService.aprovarGlosa(glosaId, dados);
}

function api_glosa_contestar(glosaId, dados) {
  return PenaltyService.contestarGlosa(glosaId, dados);
}

function api_glosa_aplicar(glosaId) {
  return PenaltyService.aplicarGlosa(glosaId);
}

function api_glosa_listar(filtros) {
  return PenaltyService.listarGlosas(filtros);
}

function api_glosa_buscar(id) {
  return PenaltyService.buscarGlosa(id);
}

function api_glosa_totalNF(notaFiscalId) {
  return PenaltyService.getTotalGlosasNF(notaFiscalId);
}

function api_devolucao_registrar(dados) {
  return PenaltyService.registrarDevolucao(dados);
}

function api_devolucao_agendar(devolucaoId, dados) {
  return PenaltyService.agendarRetirada(devolucaoId, dados);
}

function api_devolucao_confirmar(devolucaoId, dados) {
  return PenaltyService.confirmarDevolucao(devolucaoId, dados);
}

function api_devolucao_listar(filtros) {
  return PenaltyService.listarDevolucoes(filtros);
}

function api_penalidade_relatorioFornecedor(fornecedorId, periodo) {
  return PenaltyService.getRelatorioFornecedor(fornecedorId, periodo);
}

function api_glosa_getTipos() {
  return PenaltyService.getTiposGlosa();
}

// ============================================================================
// REGISTRO DO MÓDULO
// ============================================================================

(function() {
  var moduleName = 'PenaltyService';
  var moduleVersion = '1.0.0';
  
  try {
    if (typeof ServiceContainer !== 'undefined') {
      ServiceContainer.register(moduleName, PenaltyService);
    }
    
    Logger.log('[' + moduleName + ' v' + moduleVersion + '] Módulo carregado');
    Logger.log('[' + moduleName + '] Tipos de glosa: QTD, QLT, TMP, EMB, VAL, ATR, DOC');
    
  } catch (e) {
    console.error('[' + moduleName + '] Erro ao registrar: ' + e.message);
  }
})();
