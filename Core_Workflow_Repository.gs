/**
 * @fileoverview Core_Workflow_Repository.gs
 * Camada de Acesso a Dados (Repository Pattern)
 * 
 * Centraliza TODAS as operações de leitura/escrita nas planilhas do Workflow.
 * Isolamento total do Google Drive App/SpreadsheetApp da camada de serviço.
 * 
 * INTERVENÇÃO 3/4: Extração de Repositório
 * @version 1.0.0
 */

var WorkflowRepository = (function() {
  
  'use strict';
  
  // ============================================================================
  // CONFIGURAÇÃO PRIVADA
  // ============================================================================
  
  var SHEETS = {
    NFS: 'Workflow_NotasFiscais',
    RECEBIMENTOS: 'Workflow_Recebimentos',
    ANALISES: 'Workflow_Analises',
    OCORRENCIAS: 'Workflow_Ocorrencias'
  };
  
  // Cache local para evitar múltiplas chamadas getSheet
  var _sheetCache = {};
  
  /**
   * Obtém instância segura da sheet, criando se necessário
   */
  function _getSheet(name, headers) {
    try {
      if (_sheetCache[name]) return _sheetCache[name];
    
      var ss = getSS();
      var sheet = ss.getSheetByName(name);
    
      if (!sheet) {
        sheet = ss.insertSheet(name);
        if (headers && headers.length > 0) {
          sheet.appendRow(headers);
        }
        Logger.log('Repository: Sheet criada - ' + name);
      }
    
      _sheetCache[name] = sheet;
      return sheet;
    } catch (error) {
      Logger.log("Erro em _getSheet: " + error.message);
      throw error; // Re-lança para tratamento superior
    }
  }
  
  /**
   * Helper para formatar linhas de dados
   */
  function _formatRow(data) {
    try {
      try {
        return data.map(function(cell) {
          return (cell === undefined || cell === null) ? '' : cell;
        });
      } catch (error) {
        Logger.log("Erro em _formatRow: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em _formatRow: " + error.message);
      throw error;
    }
  }

  // ============================================================================
  // REPOSITÓRIOS ESPECÍFICOS
  // ============================================================================
  
  return {
    
    /**
     * Repositório de Notas Fiscais
     */
    Invoices: {
      getHeaders: function() {
        return ['ID', 'Data_Criacao', 'Numero', 'Serie', 'Chave_Acesso', 'Data_Emissao',
                'CNPJ', 'Fornecedor', 'Produto', 'Quantidade', 'Unidade', 
                'Valor_Unitario', 'Valor_Total', 'Nota_Empenho', 'Status', 'Usuario'];
      },
      
      save: function(dados) {
        try {
          var sheet = _getSheet(SHEETS.NFS, this.getHeaders());
          var id = 'NF_' + new Date().getTime();
        
          var row = [
            id, new Date(), dados.numero, dados.serie || '1', dados.chaveAcesso,
            dados.dataEmissao, dados.cnpj, dados.fornecedor || '', dados.produto,
            dados.quantidade, dados.unidade, dados.valorUnitario, dados.valorTotal,
            dados.notaEmpenho || '', 'ENVIADA', Session.getActiveUser().getEmail()
          ];
        
          sheet.appendRow(_formatRow(row));
          return id;
        } catch (error) {
          Logger.log("Erro em save: " + error.message);
          throw error;
        }
      },
      
      listAll: function() {
        try {
          var sheet = _getSheet(SHEETS.NFS);
          if (sheet.getLastRow() <= 1) return [];
          var data = sheet.getDataRange().getValues();
          var nfs = [];
        
          // Skip header
          for (var i = 1; i < data.length; i++) {
            var r = data[i];
            if (!r[0]) continue;
            nfs.push({
              id: r[0], dataCriacao: r[1], numero: r[2], serie: r[3],
              chaveAcesso: r[4], dataEmissao: r[5], cnpj: r[6], fornecedor: r[7],
              produto: r[8], quantidade: r[9], unidade: r[10], valorUnitario: r[11],
              valorTotal: r[12], notaEmpenho: r[13], status: r[14], usuario: r[15]
            });
          }
          return nfs;
        } catch (error) {
          Logger.log("Erro em listAll: " + error.message);
          throw error;
        }
      },
      
      updateStatus: function(id, newStatus) {
        try {
          var sheet = _getSheet(SHEETS.NFS);
          var data = sheet.getDataRange().getValues();
        
          for (var i = 1; i < data.length; i++) {
            if (data[i][0] === id) {
              // Assumindo coluna Status é indice 14 (base 0) -> coluna 15
              sheet.getRange(i + 1, 15).setValue(newStatus);
              return true;
            }
          }
          return false;
        } catch (error) {
          Logger.log("Erro em updateStatus: " + error.message);
          throw error;
        }
      }
    },
    
    /**
     * Repositório de Recebimentos
     */
    Receipts: {
      getHeaders: function() {
        return ['ID', 'NF_ID', 'NF_Numero', 'Escola', 'Produto',
                'Qtd_Esperada', 'Qtd_Recebida', 'Qtd_Recusada', 'Unidade', 'Valor_Unitario',
                'Valor_Total_NF', 'Valor_Recebido', 'Valor_Recusado', 'Valor_Final_Pagar',
                'Responsavel', 'Matricula', 'Data_Recebimento', 'Hora',
                'Embalagem_OK', 'Validade_OK', 'Caracteristicas_OK', 'Temperatura',
                'Motivo_Recusa', 'Observacoes', 'Status', 'Data_Registro'];
      },
      
      save: function(dados) {
        try {
          var sheet = _getSheet(SHEETS.RECEBIMENTOS, this.getHeaders());
          var id = 'REC_' + new Date().getTime();
        
          var row = [
            id, dados.nfId, dados.nfNumero, dados.escola, dados.produto,
            dados.quantidadeEsperada, dados.quantidadeRecebida, dados.quantidadeRecusada,
            dados.unidade, dados.valorUnitario, dados.valorTotalNF, dados.valorRecebido,
            dados.valorRecusado, dados.valorFinalPagar, dados.responsavel, dados.matricula,
            dados.dataRecebimento, dados.horaRecebimento,
            dados.embalagemOk ? 'SIM' : 'NAO', dados.validadeOk ? 'SIM' : 'NAO',
            dados.caracteristicasOk ? 'SIM' : 'NAO', dados.temperatura || '',
            dados.motivoRecusa || '', dados.observacoes || '', dados.status, new Date()
          ];
        
          sheet.appendRow(_formatRow(row));
          return id;
        } catch (error) {
          Logger.log("Erro em save: " + error.message);
          throw error;
        }
      },
      
      findByNfId: function(nfId) {
        try {
          var sheet = _getSheet(SHEETS.RECEBIMENTOS);
          if (sheet.getLastRow() <= 1) return [];
          var data = sheet.getDataRange().getValues();
          var receipts = [];
        
          for (var i = 1; i < data.length; i++) {
            if (data[i][1] === nfId) {
              var r = data[i];
              receipts.push({
                id: r[0], nfId: r[1], escola: r[3], produto: r[4],
                qtdRecebida: r[6], dataRecebimento: r[16], responsavel: r[14], status: r[24]
              });
            }
          }
          return receipts;
        } catch (error) {
          Logger.log("Erro em findByNfId: " + error.message);
          throw error;
        }
      }
    },
    
    /**
     * Repositório de Análises
     */
    Analyses: {
      getHeaders: function() {
        return ['ID', 'Data_Analise', 'NF_ID', 'NF_Numero', 'Nota_Empenho', 'Fornecedor', 'Produto',
                'Qtd_NF', 'Qtd_Recebida', 'Diferenca', 'Unidade', 'Valor_Unitario',
                'Valor_NF', 'Valor_Glosa', 'Valor_Aprovado', 'Percentual_Glosa',
                'Membros_Comissao', 'Qtd_Membros', 'Decisao', 'Justificativa', 
                'Validacao_Contabil', 'Status', 'Usuario'];
      },
      
      save: function(dados) {
        try {
          var sheet = _getSheet(SHEETS.ANALISES, this.getHeaders());
          var id = 'ANA_' + new Date().getTime();
        
          var row = [
            id, new Date(), dados.nfId, dados.nfNumero, dados.notaEmpenho || '',
            dados.fornecedor, dados.produto, dados.quantidadeNF, dados.quantidadeRecebida,
            dados.diferenca, dados.unidade || '', dados.valorUnitario, dados.valorNF,
            dados.valorGlosa, dados.valorAprovado, dados.percentualGlosa + '%',
            (dados.membrosComissao || []).join(', '), (dados.membrosComissao || []).length,
            dados.decisao, dados.justificativa, dados.validacaoContabil, dados.status,
            Session.getActiveUser().getEmail()
          ];
        
          sheet.appendRow(_formatRow(row));
          return id;
        } catch (error) {
          Logger.log("Erro em save: " + error.message);
          throw error;
        }
      },
      
      listAll: function() {
        try {
          // Implementação simplificada para listagem
          var sheet = _getSheet(SHEETS.ANALISES);
          if (sheet.getLastRow() <= 1) return [];
          return sheet.getDataRange().getValues().slice(1);
        } catch (error) {
          Logger.log("Erro em listAll: " + error.message);
          throw error;
        }
      }
    },
    
    /**
     * Repositório de Ocorrências (Recusas, Descartes, etc)
     */
    Occurrences: {
      getHeaders: function() {
        return ['ID', 'Data', 'Tipo', 'NF_ID', 'Escola', 'Produto', 
                'Motivo', 'Acao_Tomada', 'Status', 'Usuario'];
      },
      
      save: function(dados) {
        try {
          var sheet = _getSheet(SHEETS.OCORRENCIAS, this.getHeaders());
          var id = dados.prefixo + new Date().getTime();
        
          var row = [
            id, new Date(), dados.tipo, dados.nfId, dados.escola, dados.produto,
            dados.motivo, dados.acaoTomada, dados.status, Session.getActiveUser().getEmail()
          ];
        
          sheet.appendRow(_formatRow(row));
          return id;
        } catch (error) {
          Logger.log("Erro em save: " + error.message);
          throw error;
        }
      }
    }
  };
})();
