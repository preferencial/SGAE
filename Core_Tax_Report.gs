/**
 * @fileoverview Relatório de Regularidade Fiscal - Alimentação Escolar CRE-PP
 * @version 1.0.0
 * 
 * Intervenção 29/38: TaxReport conforme Prompt 29
 * 
 * Funcionalidades:
 * - Consolidação da situação fiscal de fornecedores
 * - Visão única de todas as certidões
 * - Alertas de vencimento
 * - Exportação de relatórios
 * - Dashboard de regularidade
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-25
 */

'use strict';

// ============================================================================
// TAX REPORT - Relatório de Regularidade Fiscal
// ============================================================================

var TaxReport = (function() {
  
  // =========================================================================
  // CONFIGURAÇÃO
  // =========================================================================
  
  var CONFIG = {
    // Certidões monitoradas
    CERTIDOES: {
      CND_FEDERAL: { nome: 'CND Federal (Receita/PGFN)', sigla: 'CND-F', obrigatoria: true },
      CND_ESTADUAL: { nome: 'CND Estadual', sigla: 'CND-E', obrigatoria: true },
      CND_MUNICIPAL: { nome: 'CND Municipal', sigla: 'CND-M', obrigatoria: true },
      CRF_FGTS: { nome: 'CRF - FGTS', sigla: 'CRF', obrigatoria: true },
      CNDT: { nome: 'CNDT - Trabalhista', sigla: 'CNDT', obrigatoria: true },
      ALVARA: { nome: 'Alvará de Funcionamento', sigla: 'ALV', obrigatoria: false },
      LICENCA_SANITARIA: { nome: 'Licença Sanitária', sigla: 'LIC', obrigatoria: false }
    },
    
    // Status de regularidade
    STATUS: {
      REGULAR: { codigo: 'REGULAR', nome: 'Regular', cor: '#4CAF50', icone: 'check_circle' },
      ATENCAO: { codigo: 'ATENCAO', nome: 'Atenção', cor: '#FF9800', icone: 'warning' },
      IRREGULAR: { codigo: 'IRREGULAR', nome: 'Irregular', cor: '#F44336', icone: 'error' },
      PENDENTE: { codigo: 'PENDENTE', nome: 'Pendente', cor: '#9E9E9E', icone: 'help' }
    },
    
    // Limites de alerta (dias)
    LIMITE_ATENCAO: 30,
    LIMITE_CRITICO: 7
  };
  
  // =========================================================================
  // FUNÇÕES PRIVADAS
  // =========================================================================
  
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
  
  function _formatarCNPJ(cnpj) {
    try {
      if (!cnpj) return '-';
      cnpj = String(cnpj).replace(/[^\d]/g, '');
      return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    } catch (error) {
      Logger.log("Erro em _formatarCNPJ: " + error.message);
      throw error;
    }
  }
  
  function _diasAteVencimento(dataVencimento) {
    if (!dataVencimento) return -999;
    var hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    var venc = new Date(dataVencimento);
    venc.setHours(0, 0, 0, 0);
    return Math.ceil((venc - hoje) / (1000 * 60 * 60 * 24));
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
  
  /**
   * Determina status de regularidade baseado nas certidões
   * @private
   */
  function _determinarStatus(certidoes) {
    try {
      var certidoesObrigatorias = Object.keys(CONFIG.CERTIDOES).filter(function(key) {
        return CONFIG.CERTIDOES[key].obrigatoria;
      });
    
      var temVencida = false;
      var temProximaVencer = false;
      var temPendente = false;
    
      certidoesObrigatorias.forEach(function(tipo) {
        var cert = certidoes.find(function(c) { return c.tipo === tipo && c.ativo; });
      
        if (!cert) {
          temPendente = true;
        } else {
          var dias = _diasAteVencimento(cert.data_vencimento);
          if (dias < 0) {
            temVencida = true;
          } else if (dias <= CONFIG.LIMITE_ATENCAO) {
            temProximaVencer = true;
          }
        }
      });
    
      if (temVencida || temPendente) {
        return CONFIG.STATUS.IRREGULAR;
      } else if (temProximaVencer) {
        return CONFIG.STATUS.ATENCAO;
      }
    
      return CONFIG.STATUS.REGULAR;
    } catch (error) {
      Logger.log("Erro em _determinarStatus: " + error.message);
      throw error;
    }
  }
  
  /**
   * Monta detalhes das certidões de um fornecedor
   * @private
   */
  function _montarDetalhesCertidoes(fornecedorId) {
    try {
      var certidoes = _getData('Certidoes_Fornecedores', { fornecedor_id: fornecedorId, ativo: true });
    
      var detalhes = {};
    
      Object.keys(CONFIG.CERTIDOES).forEach(function(tipo) {
        var config = CONFIG.CERTIDOES[tipo];
        var cert = certidoes.find(function(c) { return c.tipo === tipo; });
      
        if (cert) {
          var dias = _diasAteVencimento(cert.data_vencimento);
          var status = 'REGULAR';
        
          if (dias < 0) {
            status = 'VENCIDA';
          } else if (dias <= CONFIG.LIMITE_CRITICO) {
            status = 'CRITICO';
          } else if (dias <= CONFIG.LIMITE_ATENCAO) {
            status = 'ATENCAO';
          }
        
          detalhes[tipo] = {
            tipo: tipo,
            nome: config.nome,
            sigla: config.sigla,
            obrigatoria: config.obrigatoria,
            numero: cert.numero || '-',
            dataEmissao: cert.data_emissao,
            dataVencimento: cert.data_vencimento,
            diasVencimento: dias,
            status: status,
            statusTexto: dias < 0 ? 'Vencida há ' + Math.abs(dias) + ' dias' :
                         dias === 0 ? 'Vence hoje' :
                         'Vence em ' + dias + ' dias'
          };
        } else {
          detalhes[tipo] = {
            tipo: tipo,
            nome: config.nome,
            sigla: config.sigla,
            obrigatoria: config.obrigatoria,
            status: 'PENDENTE',
            statusTexto: 'Não cadastrada'
          };
        }
      });
    
      return detalhes;
    } catch (error) {
      Logger.log("Erro em _montarDetalhesCertidoes: " + error.message);
      throw error;
    }
  }
  
  // =========================================================================
  // API PÚBLICA
  // =========================================================================
  
  /**
   * Gera relatório consolidado de regularidade fiscal
   * @param {Object} filtros - Filtros opcionais
   * @returns {Object} Relatório
   */
  function gerarRelatorioConsolidado(filtros) {
    try {
      filtros = filtros || {};
    
      try {
        // Busca fornecedores ativos
        var fornecedores = _getData('Fornecedores', { ativo: true });
      
        // Filtra por status se especificado
        if (filtros.apenasIrregulares) {
          // Será filtrado após análise
        }
      
        var relatorio = {
          dataGeracao: new Date().toISOString(),
          periodo: filtros.periodo || 'Atual',
        
          resumo: {
            totalFornecedores: 0,
            regulares: 0,
            atencao: 0,
            irregulares: 0,
            pendentes: 0
          },
        
          fornecedores: [],
        
          alertas: {
            vencidas: [],
            proximasVencer: [],
            pendentes: []
          }
        };
      
        fornecedores.forEach(function(forn) {
          var certidoes = _getData('Certidoes_Fornecedores', { fornecedor_id: forn.id, ativo: true });
          var status = _determinarStatus(certidoes);
          var detalhes = _montarDetalhesCertidoes(forn.id);
        
          var fornecedorRelatorio = {
            id: forn.id,
            razaoSocial: forn.razao_social,
            nomeFantasia: forn.nome_fantasia,
            cnpj: forn.documento_formatado || _formatarCNPJ(forn.documento),
            tipo: forn.tipo,
            status: status,
            certidoes: detalhes,
          
            // Resumo das certidões
            certidoesRegulares: 0,
            certidoesAtencao: 0,
            certidoesVencidas: 0,
            certidoesPendentes: 0
          };
        
          // Conta certidões por status
          Object.values(detalhes).forEach(function(cert) {
            if (!cert.obrigatoria) return;
          
            switch (cert.status) {
              case 'REGULAR':
                fornecedorRelatorio.certidoesRegulares++;
                break;
              case 'ATENCAO':
              case 'CRITICO':
                fornecedorRelatorio.certidoesAtencao++;
                relatorio.alertas.proximasVencer.push({
                  fornecedor: forn.razao_social,
                  cnpj: fornecedorRelatorio.cnpj,
                  certidao: cert.nome,
                  vencimento: cert.dataVencimento,
                  dias: cert.diasVencimento
                });
                break;
              case 'VENCIDA':
                fornecedorRelatorio.certidoesVencidas++;
                relatorio.alertas.vencidas.push({
                  fornecedor: forn.razao_social,
                  cnpj: fornecedorRelatorio.cnpj,
                  certidao: cert.nome,
                  vencimento: cert.dataVencimento,
                  diasVencida: Math.abs(cert.diasVencimento)
                });
                break;
              case 'PENDENTE':
                fornecedorRelatorio.certidoesPendentes++;
                relatorio.alertas.pendentes.push({
                  fornecedor: forn.razao_social,
                  cnpj: fornecedorRelatorio.cnpj,
                  certidao: cert.nome
                });
                break;
            }
          });
        
          // Atualiza resumo
          relatorio.resumo.totalFornecedores++;
          switch (status.codigo) {
            case 'REGULAR': relatorio.resumo.regulares++; break;
            case 'ATENCAO': relatorio.resumo.atencao++; break;
            case 'IRREGULAR': relatorio.resumo.irregulares++; break;
            case 'PENDENTE': relatorio.resumo.pendentes++; break;
          }
        
          // Aplica filtro de irregulares
          if (filtros.apenasIrregulares && status.codigo === 'REGULAR') {
            return;
          }
        
          relatorio.fornecedores.push(fornecedorRelatorio);
        });
      
        // Ordena alertas por urgência
        relatorio.alertas.vencidas.sort(function(a, b) { return b.diasVencida - a.diasVencida; });
        relatorio.alertas.proximasVencer.sort(function(a, b) { return a.dias - b.dias; });
      
        // Ordena fornecedores (irregulares primeiro)
        relatorio.fornecedores.sort(function(a, b) {
          var ordemStatus = { IRREGULAR: 0, ATENCAO: 1, PENDENTE: 2, REGULAR: 3 };
          return ordemStatus[a.status.codigo] - ordemStatus[b.status.codigo];
        });
      
        return {
          success: true,
          data: relatorio
        };
      
      } catch (e) {
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em gerarRelatorioConsolidado: " + error.message);
      throw error;
    }
  }
  
  /**
   * Obtém situação fiscal de um fornecedor específico
   * @param {string} fornecedorId - ID do fornecedor
   * @returns {Object} Situação fiscal
   */
  function getSituacaoFornecedor(fornecedorId) {
    if (!fornecedorId) {
      return { success: false, error: 'Fornecedor é obrigatório' };
    }
    
    try {
      var fornecedores = _getData('Fornecedores', { id: fornecedorId });
      if (!fornecedores || fornecedores.length === 0) {
        return { success: false, error: 'Fornecedor não encontrado' };
      }
      
      var forn = fornecedores[0];
      var certidoes = _getData('Certidoes_Fornecedores', { fornecedor_id: fornecedorId, ativo: true });
      var status = _determinarStatus(certidoes);
      var detalhes = _montarDetalhesCertidoes(fornecedorId);
      
      return {
        success: true,
        data: {
          fornecedor: {
            id: forn.id,
            razaoSocial: forn.razao_social,
            cnpj: forn.documento_formatado || _formatarCNPJ(forn.documento)
          },
          status: status,
          certidoes: detalhes,
          podeEmpenhar: status.codigo === 'REGULAR',
          dataConsulta: new Date().toISOString()
        }
      };
      
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
  
  /**
   * Obtém resumo geral de regularidade
   * @returns {Object} Resumo
   */
  function getResumoRegularidade() {
    try {
      var relatorio = gerarRelatorioConsolidado();
      
      if (!relatorio.success) {
        return relatorio;
      }
      
      var resumo = relatorio.data.resumo;
      var total = resumo.totalFornecedores;
      
      return {
        success: true,
        data: {
          total: total,
          regulares: {
            quantidade: resumo.regulares,
            percentual: total > 0 ? Math.round((resumo.regulares / total) * 100) : 0
          },
          atencao: {
            quantidade: resumo.atencao,
            percentual: total > 0 ? Math.round((resumo.atencao / total) * 100) : 0
          },
          irregulares: {
            quantidade: resumo.irregulares,
            percentual: total > 0 ? Math.round((resumo.irregulares / total) * 100) : 0
          },
          alertas: {
            certidoesVencidas: relatorio.data.alertas.vencidas.length,
            proximasVencer: relatorio.data.alertas.proximasVencer.length,
            pendentes: relatorio.data.alertas.pendentes.length
          }
        }
      };
      
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
  
  /**
   * Lista certidões próximas do vencimento
   * @param {number} dias - Dias para vencimento (padrão: 30)
   * @returns {Object} Lista de certidões
   */
  function getCertidoesProximasVencer(dias) {
    try {
      dias = dias || CONFIG.LIMITE_ATENCAO;
    
      try {
        var relatorio = gerarRelatorioConsolidado();
      
        if (!relatorio.success) {
          return relatorio;
        }
      
        var certidoes = relatorio.data.alertas.proximasVencer.filter(function(c) {
          return c.dias <= dias;
        });
      
        return {
          success: true,
          data: {
            certidoes: certidoes,
            total: certidoes.length,
            diasLimite: dias
          }
        };
      
      } catch (e) {
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em getCertidoesProximasVencer: " + error.message);
      throw error;
    }
  }
  
  /**
   * Lista certidões vencidas
   * @returns {Object} Lista de certidões vencidas
   */
  function getCertidoesVencidas() {
    try {
      var relatorio = gerarRelatorioConsolidado();
      
      if (!relatorio.success) {
        return relatorio;
      }
      
      return {
        success: true,
        data: {
          certidoes: relatorio.data.alertas.vencidas,
          total: relatorio.data.alertas.vencidas.length
        }
      };
      
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  /**
   * Exporta relatório para planilha
   * @param {Object} filtros - Filtros
   * @returns {Object} URL da planilha
   */
  function exportarParaPlanilha(filtros) {
    try {
      try {
        try {
          try {
            var relatorio = gerarRelatorioConsolidado(filtros);
      
            if (!relatorio.success) {
              return relatorio;
            }
      
            var ss = getSS();
            var nomeAba = 'Regularidade_' + Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'yyyyMMdd_HHmm');
      
            var sheet = ss.insertSheet(nomeAba);
      
            // Cabeçalho
            sheet.getRange('A1').setValue('RELATÓRIO DE REGULARIDADE FISCAL');
            sheet.getRange('A1').setFontSize(14).setFontWeight('bold');
            sheet.getRange('A2').setValue('Gerado em: ' + _formatarData(new Date()));
      
            // Resumo
            sheet.getRange('A4').setValue('RESUMO');
            sheet.getRange('A4').setFontWeight('bold');
            sheet.getRange('A5:B8').setValues([
              ['Total de Fornecedores', relatorio.data.resumo.totalFornecedores],
              ['Regulares', relatorio.data.resumo.regulares],
              ['Atenção', relatorio.data.resumo.atencao],
              ['Irregulares', relatorio.data.resumo.irregulares]
            ]);
      
            // Cabeçalho da tabela
            var headers = ['Fornecedor', 'CNPJ', 'Status', 'CND-F', 'CND-E', 'CND-M', 'CRF', 'CNDT'];
            sheet.getRange(10, 1, 1, headers.length).setValues([headers]);
            sheet.getRange(10, 1, 1, headers.length).setFontWeight('bold').setBackground('#E8F5E9');
      
            // Dados
            var dados = relatorio.data.fornecedores.map(function(f) {
              return [
                f.razaoSocial,
                f.cnpj,
                f.status.nome,
                f.certidoes.CND_FEDERAL ? f.certidoes.CND_FEDERAL.statusTexto : '-',
                f.certidoes.CND_ESTADUAL ? f.certidoes.CND_ESTADUAL.statusTexto : '-',
                f.certidoes.CND_MUNICIPAL ? f.certidoes.CND_MUNICIPAL.statusTexto : '-',
                f.certidoes.CRF_FGTS ? f.certidoes.CRF_FGTS.statusTexto : '-',
                f.certidoes.CNDT ? f.certidoes.CNDT.statusTexto : '-'
              ];
            });
      
            if (dados.length > 0) {
              sheet.getRange(11, 1, dados.length, headers.length).setValues(dados);
            }
      
            // Formatação
            sheet.autoResizeColumns(1, headers.length);
      
            // Formatação condicional para status
            var range = sheet.getRange(11, 3, dados.length, 1);
            var rules = sheet.getConditionalFormatRules();
      
            rules.push(SpreadsheetApp.newConditionalFormatRule()
              .whenTextEqualTo('Regular')
              .setBackground('#C8E6C9')
              .setRanges([range])
              .build());
      
            rules.push(SpreadsheetApp.newConditionalFormatRule()
              .whenTextEqualTo('Atenção')
              .setBackground('#FFE0B2')
              .setRanges([range])
              .build());
      
            rules.push(SpreadsheetApp.newConditionalFormatRule()
              .whenTextEqualTo('Irregular')
              .setBackground('#FFCDD2')
              .setRanges([range])
              .build());
      
            sheet.setConditionalFormatRules(rules);
      
            return {
              success: true,
              data: {
                sheetName: nomeAba,
                url: ss.getUrl() + '#gid=' + sheet.getSheetId()
              },
              message: 'Relatório exportado com sucesso'
            };
      
          } catch (e) {
            return { success: false, error: e.message };
          }
        } catch (error) {
          Logger.log("Erro em exportarParaPlanilha: " + error.message);
          throw error; // Re-lança para tratamento superior
        }
      } catch (error) {
        Logger.log("Erro em exportarParaPlanilha: " + error.message);
        throw error;
      }
    } catch (error) {
      Logger.log("Erro em exportarParaPlanilha: " + error.message);
      throw error;
    }
  }
  
  /**
   * Gera HTML do relatório para impressão/PDF
   * @param {Object} filtros - Filtros
   * @returns {Object} HTML do relatório
   */
  function gerarHTMLRelatorio(filtros) {
    try {
      try {
        var relatorio = gerarRelatorioConsolidado(filtros);
      
        if (!relatorio.success) {
          return relatorio;
        }
      
        var dados = relatorio.data;
      
        var html = '<!DOCTYPE html><html><head><meta charset="UTF-8">' +
          '<style>' +
          'body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; }' +
          'h1 { color: #2E7D32; font-size: 18px; }' +
          'h2 { color: #333; font-size: 14px; margin-top: 20px; }' +
          '.resumo { display: flex; gap: 20px; margin: 20px 0; }' +
          '.resumo-item { padding: 15px; border-radius: 8px; text-align: center; min-width: 100px; }' +
          '.resumo-item.regular { background: #E8F5E9; }' +
          '.resumo-item.atencao { background: #FFF3E0; }' +
          '.resumo-item.irregular { background: #FFEBEE; }' +
          '.resumo-valor { font-size: 24px; font-weight: bold; }' +
          '.resumo-label { font-size: 11px; color: #666; }' +
          'table { width: 100%; border-collapse: collapse; margin-top: 15px; }' +
          'th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }' +
          'th { background: #E8F5E9; font-weight: bold; }' +
          '.status-regular { color: #4CAF50; }' +
          '.status-atencao { color: #FF9800; }' +
          '.status-irregular { color: #F44336; }' +
          '.footer { margin-top: 30px; font-size: 10px; color: #666; }' +
          '</style></head><body>';
      
        html += '<h1>Relatório de Regularidade Fiscal</h1>';
        html += '<p>CRE Plano Piloto - Alimentação Escolar</p>';
        html += '<p>Gerado em: ' + _formatarData(new Date()) + '</p>';
      
        // Resumo
        html += '<div class="resumo">';
        html += '<div class="resumo-item regular"><div class="resumo-valor">' + dados.resumo.regulares + '</div><div class="resumo-label">Regulares</div></div>';
        html += '<div class="resumo-item atencao"><div class="resumo-valor">' + dados.resumo.atencao + '</div><div class="resumo-label">Atenção</div></div>';
        html += '<div class="resumo-item irregular"><div class="resumo-valor">' + dados.resumo.irregulares + '</div><div class="resumo-label">Irregulares</div></div>';
        html += '</div>';
      
        // Tabela de fornecedores
        html += '<h2>Situação por Fornecedor</h2>';
        html += '<table><thead><tr><th>Fornecedor</th><th>CNPJ</th><th>Status</th><th>CND-F</th><th>CND-E</th><th>CND-M</th><th>CRF</th><th>CNDT</th></tr></thead><tbody>';
      
        dados.fornecedores.forEach(function(f) {
          var statusClass = 'status-' + f.status.codigo.toLowerCase();
          html += '<tr>';
          html += '<td>' + f.razaoSocial + '</td>';
          html += '<td>' + f.cnpj + '</td>';
          html += '<td class="' + statusClass + '">' + f.status.nome + '</td>';
          html += '<td>' + (f.certidoes.CND_FEDERAL ? f.certidoes.CND_FEDERAL.statusTexto : '-') + '</td>';
          html += '<td>' + (f.certidoes.CND_ESTADUAL ? f.certidoes.CND_ESTADUAL.statusTexto : '-') + '</td>';
          html += '<td>' + (f.certidoes.CND_MUNICIPAL ? f.certidoes.CND_MUNICIPAL.statusTexto : '-') + '</td>';
          html += '<td>' + (f.certidoes.CRF_FGTS ? f.certidoes.CRF_FGTS.statusTexto : '-') + '</td>';
          html += '<td>' + (f.certidoes.CNDT ? f.certidoes.CNDT.statusTexto : '-') + '</td>';
          html += '</tr>';
        });
      
        html += '</tbody></table>';
      
        // Alertas
        if (dados.alertas.vencidas.length > 0) {
          html += '<h2 style="color: #F44336;">⚠️ Certidões Vencidas (' + dados.alertas.vencidas.length + ')</h2>';
          html += '<table><thead><tr><th>Fornecedor</th><th>Certidão</th><th>Vencida há</th></tr></thead><tbody>';
          dados.alertas.vencidas.forEach(function(a) {
            html += '<tr><td>' + a.fornecedor + '</td><td>' + a.certidao + '</td><td>' + a.diasVencida + ' dias</td></tr>';
          });
          html += '</tbody></table>';
        }
      
        html += '<div class="footer">Sistema de Alimentação Escolar - CRE Plano Piloto</div>';
        html += '</body></html>';
      
        return {
          success: true,
          data: { html: html }
        };
      
      } catch (e) {
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em gerarHTMLRelatorio: " + error.message);
      throw error;
    }
  }
  
  /**
   * Envia relatório por email
   * @param {Object} dados - Dados do envio
   * @returns {Object} Resultado
   */
  function enviarRelatorioPorEmail(dados) {
    if (!dados || !dados.email) {
      return { success: false, error: 'Email é obrigatório' };
    }
    
    try {
      var htmlResult = gerarHTMLRelatorio(dados.filtros);
      
      if (!htmlResult.success) {
        return htmlResult;
      }
      
      MailApp.sendEmail({
        to: dados.email,
        subject: 'Relatório de Regularidade Fiscal - ' + _formatarData(new Date()),
        htmlBody: htmlResult.data.html
      });
      
      return {
        success: true,
        message: 'Relatório enviado para ' + dados.email
      };
      
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
  
  /**
   * Obtém configuração de certidões
   * @returns {Object} Configuração
   */
  function getConfigCertidoes() {
    return {
      success: true,
      data: CONFIG.CERTIDOES
    };
  }
  
  // =========================================================================
  // API PÚBLICA DO MÓDULO
  // =========================================================================
  
  return {
    // Relatórios
    gerarRelatorioConsolidado: gerarRelatorioConsolidado,
    getSituacaoFornecedor: getSituacaoFornecedor,
    getResumoRegularidade: getResumoRegularidade,
    
    // Alertas
    getCertidoesProximasVencer: getCertidoesProximasVencer,
    getCertidoesVencidas: getCertidoesVencidas,
    
    // Exportação
    exportarParaPlanilha: exportarParaPlanilha,
    gerarHTMLRelatorio: gerarHTMLRelatorio,
    enviarRelatorioPorEmail: enviarRelatorioPorEmail,
    
    // Configuração
    getConfigCertidoes: getConfigCertidoes,
    
    // Constantes
    STATUS: CONFIG.STATUS,
    CERTIDOES: CONFIG.CERTIDOES
  };
  
})();

// ============================================================================
// FUNÇÕES GLOBAIS - API para Frontend
// ============================================================================

function api_fiscal_relatorioConsolidado(filtros) {
  return TaxReport.gerarRelatorioConsolidado(filtros);
}

function api_fiscal_situacaoFornecedor(fornecedorId) {
  return TaxReport.getSituacaoFornecedor(fornecedorId);
}

function api_fiscal_resumo() {
  return TaxReport.getResumoRegularidade();
}

function api_fiscal_proximasVencer(dias) {
  return TaxReport.getCertidoesProximasVencer(dias);
}

function api_fiscal_vencidas() {
  return TaxReport.getCertidoesVencidas();
}

function api_fiscal_exportarPlanilha(filtros) {
  return TaxReport.exportarParaPlanilha(filtros);
}

function api_fiscal_gerarHTML(filtros) {
  return TaxReport.gerarHTMLRelatorio(filtros);
}

function api_fiscal_enviarEmail(dados) {
  return TaxReport.enviarRelatorioPorEmail(dados);
}

// ============================================================================
// REGISTRO DO MÓDULO
// ============================================================================

(function() {
  var moduleName = 'TaxReport';
  var moduleVersion = '1.0.0';
  
  try {
    if (typeof ServiceContainer !== 'undefined') {
      // Usa registerValue para registrar objeto diretamente (não factory)
      if (typeof ServiceContainer.registerValue === 'function') {
        ServiceContainer.registerValue(moduleName, TaxReport);
      } else {
        // Fallback: envolve em função factory
        ServiceContainer.register(moduleName, function() { return TaxReport; }, { singleton: true });
      }
    }
    
    Logger.log('[' + moduleName + ' v' + moduleVersion + '] Módulo carregado');
    Logger.log('[' + moduleName + '] Certidões monitoradas: CND-F, CND-E, CND-M, CRF, CNDT');
    
  } catch (e) {
    console.error('[' + moduleName + '] Erro ao registrar: ' + e.message);
  }
})();
