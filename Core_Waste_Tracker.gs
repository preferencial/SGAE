/**
 * @fileoverview Registro de Sobras e Desperdício - Alimentação Escolar CRE-PP
 * @version 1.0.0
 * 
 * Intervenção 18/38: WasteTracker conforme Prompt 18
 * 
 * Formulário de registro de 'Resto-Ingestão' para:
 * - Monitorar aceitação dos cardápios
 * - Identificar itens com alto índice de desperdício
 * - Gerar relatórios de aproveitamento
 * - Subsidiar ajustes nos cardápios
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-25
 */

'use strict';

// ============================================================================
// WASTE TRACKER - Controle de Sobras e Desperdício
// ============================================================================

var WasteTracker = (function() {
  
  // =========================================================================
  // CONFIGURAÇÃO
  // =========================================================================
  
  var CONFIG = {
    SHEETS: {
      RESTO_INGESTAO: 'Resto_Ingestao',
      ESCOLAS: 'Escolas',
      CARDAPIOS_SEMANAIS: 'Cardapios_Semanais',
      ITENS_ALIMENTARES: 'Itens_Alimentares'
    },
    
    // Tipos de registro
    TIPOS: {
      SOBRA_LIMPA: 'SOBRA_LIMPA',      // Alimento preparado não servido
      RESTO_INGESTAO: 'RESTO_INGESTAO', // Alimento servido não consumido
      DESCARTE: 'DESCARTE'              // Alimento descartado (vencido, estragado)
    },
    
    // Motivos de descarte
    MOTIVOS_DESCARTE: {
      VENCIDO: 'Produto vencido',
      ESTRAGADO: 'Produto estragado',
      CONTAMINADO: 'Contaminação',
      TEMPERATURA: 'Temperatura inadequada',
      PREPARO: 'Erro no preparo',
      EXCESSO: 'Excesso de produção',
      REJEICAO: 'Rejeição pelos alunos',
      OUTRO: 'Outro motivo'
    },
    
    // Níveis de aceitação
    NIVEIS_ACEITACAO: {
      EXCELENTE: { min: 90, cor: '#2E7D32', emoji: '🌟' },
      BOM: { min: 75, cor: '#4CAF50', emoji: '✅' },
      REGULAR: { min: 60, cor: '#FFC107', emoji: '⚠️' },
      RUIM: { min: 40, cor: '#FF9800', emoji: '⚡' },
      CRITICO: { min: 0, cor: '#F44336', emoji: '❌' }
    },
    
    // Meta de aproveitamento (%)
    META_APROVEITAMENTO: 85
  };
  
  // =========================================================================
  // FUNÇÕES PRIVADAS
  // =========================================================================
  
  function _getSheet(nome) {
    try {
      try {
        var ss = getSS();
        var sheet = ss.getSheetByName(nome);
    
        // Cria planilha se não existir
        if (!sheet && nome === CONFIG.SHEETS.RESTO_INGESTAO) {
          sheet = ss.insertSheet(nome);
          var headers = [
            'ID', 'Data', 'Escola_ID', 'Cardapio_ID', 'Refeicao',
            'Item_ID', 'Item_Nome', 'Tipo', 'Quantidade_Preparada_Kg',
            'Quantidade_Servida_Kg', 'Quantidade_Sobra_Kg', 'Quantidade_Resto_Kg',
            'Percentual_Aproveitamento', 'Num_Alunos_Presentes', 'Motivo_Descarte',
            'Observacoes', 'Responsavel', 'Data_Registro'
          ];
          sheet.appendRow(headers);
          sheet.getRange(1, 1, 1, headers.length)
            .setBackground('#2E7D32')
            .setFontColor('white')
            .setFontWeight('bold');
          sheet.setFrozenRows(1);
          sheet.setTabColor('#2E7D32');
        }
    
        return sheet;
      } catch (error) {
        Logger.log("Erro em _getSheet: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em _getSheet: " + error.message);
      throw error;
    }
  }
  
  function _generateId() {
    try {
      return 'RI_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6);
    } catch (error) {
      Logger.log("Erro em _generateId: " + error.message);
      throw error;
    }
  }
  
  function _getCurrentUser() {
    try {
      try {
        return Session.getActiveUser().getEmail() || 'sistema';
      } catch (e) {
        return 'sistema';
      }
    } catch (error) {
      Logger.log("Erro em _getCurrentUser: " + error.message);
      throw error;
    }
  }
  
  function _rowToObject(row, headers) {
    try {
      var obj = {};
      headers.forEach(function(h, idx) { obj[h] = row[idx]; });
      return obj;
    } catch (error) {
      Logger.log("Erro em _rowToObject: " + error.message);
      throw error;
    }
  }
  
  /**
   * Calcula percentual de aproveitamento
   * @private
   */
  function _calcularAproveitamento(preparado, sobra, resto) {
    if (!preparado || preparado <= 0) return 0;
    var consumido = preparado - (sobra || 0) - (resto || 0);
    return Math.round((consumido / preparado) * 100);
  }
  
  /**
   * Classifica nível de aceitação
   * @private
   */
  function _classificarAceitacao(percentual) {
    try {
      try {
        for (var nivel in CONFIG.NIVEIS_ACEITACAO) {
          if (percentual >= CONFIG.NIVEIS_ACEITACAO[nivel].min) {
            return {
              nivel: nivel,
              config: CONFIG.NIVEIS_ACEITACAO[nivel]
            };
          }
        }
        return { nivel: 'CRITICO', config: CONFIG.NIVEIS_ACEITACAO.CRITICO };
      } catch (error) {
        Logger.log("Erro em _classificarAceitacao: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em _classificarAceitacao: " + error.message);
      throw error;
    }
  }

  // =========================================================================
  // API PÚBLICA
  // =========================================================================
  
  return {
    CONFIG: CONFIG,
    
    // -----------------------------------------------------------------------
    // REGISTRO DE RESTO-INGESTÃO
    // -----------------------------------------------------------------------
    
    /**
     * Registra resto-ingestão de uma refeição
     * @param {Object} dados - Dados do registro
     * @returns {Object} Resultado
     */
    registrar: function(dados) {
      try {
        try {
          var sheet = _getSheet(CONFIG.SHEETS.RESTO_INGESTAO);
          if (!sheet) {
            return { success: false, error: 'Não foi possível acessar planilha' };
          }
        
          // Validações
          if (!dados.escolaId) return { success: false, error: 'Escola é obrigatória' };
          if (!dados.data) return { success: false, error: 'Data é obrigatória' };
          if (!dados.refeicao) return { success: false, error: 'Refeição é obrigatória' };
        
          var id = _generateId();
          var now = new Date();
        
          var preparado = Number(dados.quantidadePreparada) || 0;
          var servido = Number(dados.quantidadeServida) || preparado;
          var sobra = Number(dados.quantidadeSobra) || 0;
          var resto = Number(dados.quantidadeResto) || 0;
        
          var aproveitamento = _calcularAproveitamento(preparado, sobra, resto);
        
          var registro = [
            id,
            new Date(dados.data),
            dados.escolaId,
            dados.cardapioId || '',
            dados.refeicao,
            dados.itemId || '',
            dados.itemNome || '',
            dados.tipo || CONFIG.TIPOS.RESTO_INGESTAO,
            preparado,
            servido,
            sobra,
            resto,
            aproveitamento,
            Number(dados.numAlunosPresentes) || 0,
            dados.motivoDescarte || '',
            dados.observacoes || '',
            _getCurrentUser(),
            now
          ];
        
          sheet.appendRow(registro);
        
          var classificacao = _classificarAceitacao(aproveitamento);
        
          return {
            success: true,
            id: id,
            aproveitamento: aproveitamento,
            classificacao: classificacao,
            message: 'Registro salvo com sucesso'
          };
        
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em registrar: " + error.message);
        throw error;
      }
    },
    
    /**
     * Registra múltiplos itens de uma refeição
     * @param {Object} dadosRefeicao - Dados gerais da refeição
     * @param {Array} itens - Array de itens com quantidades
     * @returns {Object} Resultado
     */
    registrarRefeicaoCompleta: function(dadosRefeicao, itens) {
      try {
        var resultado = {
          success: true,
          registros: [],
          resumo: {
            total: itens.length,
            sucesso: 0,
            erros: 0,
            aproveitamentoMedio: 0
          }
        };
      
        var somaAproveitamento = 0;
      
        itens.forEach(function(item) {
          var registro = this.registrar({
            escolaId: dadosRefeicao.escolaId,
            data: dadosRefeicao.data,
            cardapioId: dadosRefeicao.cardapioId,
            refeicao: dadosRefeicao.refeicao,
            numAlunosPresentes: dadosRefeicao.numAlunosPresentes,
            itemId: item.itemId,
            itemNome: item.itemNome,
            tipo: item.tipo || CONFIG.TIPOS.RESTO_INGESTAO,
            quantidadePreparada: item.quantidadePreparada,
            quantidadeServida: item.quantidadeServida,
            quantidadeSobra: item.quantidadeSobra,
            quantidadeResto: item.quantidadeResto,
            motivoDescarte: item.motivoDescarte,
            observacoes: item.observacoes
          });
        
          if (registro.success) {
            resultado.resumo.sucesso++;
            somaAproveitamento += registro.aproveitamento;
            resultado.registros.push({
              item: item.itemNome,
              aproveitamento: registro.aproveitamento,
              classificacao: registro.classificacao
            });
          } else {
            resultado.resumo.erros++;
          }
        }.bind(this));
      
        resultado.resumo.aproveitamentoMedio = resultado.resumo.sucesso > 0
          ? Math.round(somaAproveitamento / resultado.resumo.sucesso)
          : 0;
      
        resultado.classificacaoGeral = _classificarAceitacao(resultado.resumo.aproveitamentoMedio);
      
        return resultado;
      } catch (error) {
        Logger.log("Erro em registrarRefeicaoCompleta: " + error.message);
        throw error;
      }
    },

    // -----------------------------------------------------------------------
    // CONSULTAS
    // -----------------------------------------------------------------------
    
    /**
     * Obtém registros por período
     * @param {Object} filtros - { escolaId, dataInicio, dataFim, refeicao, itemId }
     * @returns {Object} Registros
     */
    consultar: function(filtros) {
      try {
        filtros = filtros || {};
      
        try {
          var sheet = _getSheet(CONFIG.SHEETS.RESTO_INGESTAO);
          if (!sheet || sheet.getLastRow() <= 1) {
            return { success: true, registros: [], count: 0 };
          }
        
          var data = sheet.getDataRange().getValues();
          var headers = data[0];
          var registros = [];
        
          var dataInicio = filtros.dataInicio ? new Date(filtros.dataInicio) : null;
          var dataFim = filtros.dataFim ? new Date(filtros.dataFim) : null;
        
          for (var i = 1; i < data.length; i++) {
            var row = _rowToObject(data[i], headers);
          
            // Aplica filtros
            if (filtros.escolaId && row.Escola_ID !== filtros.escolaId) continue;
            if (filtros.refeicao && row.Refeicao !== filtros.refeicao) continue;
            if (filtros.itemId && row.Item_ID !== filtros.itemId) continue;
          
            var dataRegistro = new Date(row.Data);
            if (dataInicio && dataRegistro < dataInicio) continue;
            if (dataFim && dataRegistro > dataFim) continue;
          
            // Adiciona classificação
            row.classificacao = _classificarAceitacao(row.Percentual_Aproveitamento);
            registros.push(row);
          }
        
          // Ordena por data (mais recente primeiro)
          registros.sort(function(a, b) {
            return new Date(b.Data) - new Date(a.Data);
          });
        
          return { success: true, registros: registros, count: registros.length };
        
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em consultar: " + error.message);
        throw error;
      }
    },
    
    /**
     * Obtém itens com maior desperdício
     * @param {Object} filtros - { escolaId, dataInicio, dataFim, limite }
     * @returns {Object} Ranking de desperdício
     */
    rankingDesperdicio: function(filtros) {
      try {
        filtros = filtros || {};
        var limite = filtros.limite || 10;
      
        try {
          var consultaResult = this.consultar(filtros);
          if (!consultaResult.success) return consultaResult;
        
          // Agrupa por item
          var porItem = {};
        
          consultaResult.registros.forEach(function(reg) {
            var itemKey = reg.Item_ID || reg.Item_Nome;
            if (!itemKey) return;
          
            if (!porItem[itemKey]) {
              porItem[itemKey] = {
                itemId: reg.Item_ID,
                itemNome: reg.Item_Nome,
                totalPreparado: 0,
                totalSobra: 0,
                totalResto: 0,
                registros: 0,
                somaAproveitamento: 0
              };
            }
          
            porItem[itemKey].totalPreparado += Number(reg.Quantidade_Preparada_Kg) || 0;
            porItem[itemKey].totalSobra += Number(reg.Quantidade_Sobra_Kg) || 0;
            porItem[itemKey].totalResto += Number(reg.Quantidade_Resto_Kg) || 0;
            porItem[itemKey].registros++;
            porItem[itemKey].somaAproveitamento += Number(reg.Percentual_Aproveitamento) || 0;
          });
        
          // Calcula médias e converte para array
          var ranking = [];
          for (var key in porItem) {
            var item = porItem[key];
            item.aproveitamentoMedio = Math.round(item.somaAproveitamento / item.registros);
            item.desperdicioTotal = item.totalSobra + item.totalResto;
            item.percentualDesperdicio = item.totalPreparado > 0
              ? Math.round((item.desperdicioTotal / item.totalPreparado) * 100)
              : 0;
            item.classificacao = _classificarAceitacao(item.aproveitamentoMedio);
            ranking.push(item);
          }
        
          // Ordena por desperdício (maior primeiro)
          ranking.sort(function(a, b) {
            return b.percentualDesperdicio - a.percentualDesperdicio;
          });
        
          return {
            success: true,
            ranking: ranking.slice(0, limite),
            totalItens: ranking.length
          };
        
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em rankingDesperdicio: " + error.message);
        throw error;
      }
    },
    
    /**
     * Obtém itens mais aceitos
     * @param {Object} filtros - { escolaId, dataInicio, dataFim, limite }
     * @returns {Object} Ranking de aceitação
     */
    rankingAceitacao: function(filtros) {
      try {
        var result = this.rankingDesperdicio(filtros);
        if (!result.success) return result;
      
        // Inverte ordenação (maior aproveitamento primeiro)
        result.ranking.sort(function(a, b) {
          return b.aproveitamentoMedio - a.aproveitamentoMedio;
        });
      
        return result;
      } catch (error) {
        Logger.log("Erro em rankingAceitacao: " + error.message);
        throw error;
      }
    },

    // -----------------------------------------------------------------------
    // RELATÓRIOS E ESTATÍSTICAS
    // -----------------------------------------------------------------------
    
    /**
     * Gera relatório de aproveitamento por período
     * @param {Object} filtros - { escolaId, dataInicio, dataFim }
     * @returns {Object} Relatório
     */
    relatorioAproveitamento: function(filtros) {
      try {
        try {
          var consultaResult = this.consultar(filtros);
          if (!consultaResult.success) return consultaResult;
        
          var registros = consultaResult.registros;
        
          if (registros.length === 0) {
            return {
              success: true,
              relatorio: {
                periodo: filtros,
                totalRegistros: 0,
                mensagem: 'Nenhum registro encontrado no período'
              }
            };
          }
        
          // Calcula totais
          var totais = {
            preparado: 0,
            servido: 0,
            sobra: 0,
            resto: 0,
            alunos: 0
          };
        
          var porRefeicao = {};
          var porDia = {};
          var somaAproveitamento = 0;
        
          registros.forEach(function(reg) {
            totais.preparado += Number(reg.Quantidade_Preparada_Kg) || 0;
            totais.servido += Number(reg.Quantidade_Servida_Kg) || 0;
            totais.sobra += Number(reg.Quantidade_Sobra_Kg) || 0;
            totais.resto += Number(reg.Quantidade_Resto_Kg) || 0;
            totais.alunos += Number(reg.Num_Alunos_Presentes) || 0;
            somaAproveitamento += Number(reg.Percentual_Aproveitamento) || 0;
          
            // Por refeição
            var refeicao = reg.Refeicao || 'OUTROS';
            if (!porRefeicao[refeicao]) {
              porRefeicao[refeicao] = { registros: 0, somaAproveitamento: 0 };
            }
            porRefeicao[refeicao].registros++;
            porRefeicao[refeicao].somaAproveitamento += Number(reg.Percentual_Aproveitamento) || 0;
          
            // Por dia da semana
            var data = new Date(reg.Data);
            var diaSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][data.getDay()];
            if (!porDia[diaSemana]) {
              porDia[diaSemana] = { registros: 0, somaAproveitamento: 0 };
            }
            porDia[diaSemana].registros++;
            porDia[diaSemana].somaAproveitamento += Number(reg.Percentual_Aproveitamento) || 0;
          });
        
          // Calcula médias
          var aproveitamentoMedio = Math.round(somaAproveitamento / registros.length);
        
          for (var ref in porRefeicao) {
            porRefeicao[ref].aproveitamentoMedio = Math.round(
              porRefeicao[ref].somaAproveitamento / porRefeicao[ref].registros
            );
          }
        
          for (var dia in porDia) {
            porDia[dia].aproveitamentoMedio = Math.round(
              porDia[dia].somaAproveitamento / porDia[dia].registros
            );
          }
        
          // Calcula desperdício total
          totais.desperdicio = totais.sobra + totais.resto;
          totais.consumido = totais.preparado - totais.desperdicio;
        
          // Per capita
          var perCapita = totais.alunos > 0 ? {
            preparado: Math.round((totais.preparado / totais.alunos) * 1000), // gramas
            desperdicio: Math.round((totais.desperdicio / totais.alunos) * 1000)
          } : null;
        
          var relatorio = {
            periodo: filtros,
            totalRegistros: registros.length,
            totais: {
              preparadoKg: Math.round(totais.preparado * 100) / 100,
              consumidoKg: Math.round(totais.consumido * 100) / 100,
              sobraKg: Math.round(totais.sobra * 100) / 100,
              restoKg: Math.round(totais.resto * 100) / 100,
              desperdicioKg: Math.round(totais.desperdicio * 100) / 100,
              totalAlunos: totais.alunos
            },
            aproveitamento: {
              medio: aproveitamentoMedio,
              meta: CONFIG.META_APROVEITAMENTO,
              atingiuMeta: aproveitamentoMedio >= CONFIG.META_APROVEITAMENTO,
              classificacao: _classificarAceitacao(aproveitamentoMedio)
            },
            perCapita: perCapita,
            porRefeicao: porRefeicao,
            porDiaSemana: porDia
          };
        
          return { success: true, relatorio: relatorio };
        
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em relatorioAproveitamento: " + error.message);
        throw error;
      }
    },
    
    /**
     * Compara aproveitamento entre escolas
     * @param {Object} filtros - { dataInicio, dataFim }
     * @returns {Object} Comparativo
     */
    comparativoEscolas: function(filtros) {
      try {
        try {
          var consultaResult = this.consultar(filtros);
          if (!consultaResult.success) return consultaResult;
        
          var porEscola = {};
        
          consultaResult.registros.forEach(function(reg) {
            var escolaId = reg.Escola_ID;
            if (!escolaId) return;
          
            if (!porEscola[escolaId]) {
              porEscola[escolaId] = {
                escolaId: escolaId,
                registros: 0,
                somaAproveitamento: 0,
                totalPreparado: 0,
                totalDesperdicio: 0
              };
            }
          
            porEscola[escolaId].registros++;
            porEscola[escolaId].somaAproveitamento += Number(reg.Percentual_Aproveitamento) || 0;
            porEscola[escolaId].totalPreparado += Number(reg.Quantidade_Preparada_Kg) || 0;
            porEscola[escolaId].totalDesperdicio += (Number(reg.Quantidade_Sobra_Kg) || 0) + 
                                                     (Number(reg.Quantidade_Resto_Kg) || 0);
          });
        
          // Calcula médias e converte para array
          var escolas = [];
          for (var id in porEscola) {
            var escola = porEscola[id];
            escola.aproveitamentoMedio = Math.round(escola.somaAproveitamento / escola.registros);
            escola.classificacao = _classificarAceitacao(escola.aproveitamentoMedio);
            escolas.push(escola);
          }
        
          // Ordena por aproveitamento
          escolas.sort(function(a, b) {
            return b.aproveitamentoMedio - a.aproveitamentoMedio;
          });
        
          return {
            success: true,
            escolas: escolas,
            totalEscolas: escolas.length
          };
        
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em comparativoEscolas: " + error.message);
        throw error;
      }
    },

    // -----------------------------------------------------------------------
    // ALERTAS E RECOMENDAÇÕES
    // -----------------------------------------------------------------------
    
    /**
     * Gera alertas baseados nos dados de desperdício
     * @param {Object} filtros - Filtros de período
     * @returns {Object} Alertas
     */
    gerarAlertas: function(filtros) {
      try {
        try {
          var relatorio = this.relatorioAproveitamento(filtros);
          if (!relatorio.success) return relatorio;
        
          var alertas = [];
          var rel = relatorio.relatorio;
        
          // Alerta de meta não atingida
          if (!rel.aproveitamento.atingiuMeta) {
            alertas.push({
              tipo: 'META',
              severidade: 'ALTA',
              titulo: 'Meta de aproveitamento não atingida',
              mensagem: 'Aproveitamento médio de ' + rel.aproveitamento.medio + 
                       '% está abaixo da meta de ' + CONFIG.META_APROVEITAMENTO + '%',
              acao: 'Revisar cardápios e porcionamento'
            });
          }
        
          // Alerta de desperdício alto
          if (rel.totais.desperdicioKg > 50) {
            alertas.push({
              tipo: 'DESPERDICIO',
              severidade: 'MEDIA',
              titulo: 'Alto volume de desperdício',
              mensagem: rel.totais.desperdicioKg + ' kg desperdiçados no período',
              acao: 'Ajustar quantidades preparadas'
            });
          }
        
          // Alertas por refeição
          for (var ref in rel.porRefeicao) {
            if (rel.porRefeicao[ref].aproveitamentoMedio < 60) {
              alertas.push({
                tipo: 'REFEICAO',
                severidade: 'MEDIA',
                titulo: 'Baixa aceitação: ' + ref,
                mensagem: 'Aproveitamento de ' + rel.porRefeicao[ref].aproveitamentoMedio + '%',
                acao: 'Revisar cardápio desta refeição'
              });
            }
          }
        
          // Ranking de itens problemáticos
          var ranking = this.rankingDesperdicio(filtros);
          if (ranking.success && ranking.ranking.length > 0) {
            var piores = ranking.ranking.filter(function(item) {
              return item.aproveitamentoMedio < 50;
            }).slice(0, 3);
          
            piores.forEach(function(item) {
              alertas.push({
                tipo: 'ITEM',
                severidade: 'BAIXA',
                titulo: 'Item com baixa aceitação: ' + item.itemNome,
                mensagem: 'Aproveitamento médio de ' + item.aproveitamentoMedio + '%',
                acao: 'Considerar substituição ou ajuste no preparo'
              });
            });
          }
        
          return {
            success: true,
            alertas: alertas,
            totalAlertas: alertas.length,
            temAlertasCriticos: alertas.some(function(a) { return a.severidade === 'ALTA'; })
          };
        
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em gerarAlertas: " + error.message);
        throw error;
      }
    },
    
    /**
     * Gera recomendações para melhorar aproveitamento
     * @param {string} escolaId - ID da escola
     * @returns {Object} Recomendações
     */
    gerarRecomendacoes: function(escolaId) {
      try {
        try {
          var filtros = { escolaId: escolaId };
          var ranking = this.rankingDesperdicio(filtros);
          var relatorio = this.relatorioAproveitamento(filtros);
        
          var recomendacoes = [];
        
          if (relatorio.success && relatorio.relatorio.aproveitamento) {
            var aprov = relatorio.relatorio.aproveitamento.medio;
          
            if (aprov < 60) {
              recomendacoes.push({
                prioridade: 1,
                titulo: 'Revisão urgente do cardápio',
                descricao: 'Aproveitamento muito baixo. Considerar pesquisa de preferências com alunos.'
              });
            }
          
            if (aprov >= 60 && aprov < 75) {
              recomendacoes.push({
                prioridade: 2,
                titulo: 'Ajuste de porcionamento',
                descricao: 'Verificar se as porções estão adequadas à faixa etária.'
              });
            }
          }
        
          if (ranking.success && ranking.ranking.length > 0) {
            var piores = ranking.ranking.slice(0, 3);
            piores.forEach(function(item, idx) {
              if (item.aproveitamentoMedio < 70) {
                recomendacoes.push({
                  prioridade: 3 + idx,
                  titulo: 'Substituir ou ajustar: ' + item.itemNome,
                  descricao: 'Item com ' + item.percentualDesperdicio + '% de desperdício. ' +
                            'Considerar nova forma de preparo ou substituição.'
                });
              }
            });
          }
        
          // Recomendações gerais
          recomendacoes.push({
            prioridade: 10,
            titulo: 'Educação alimentar',
            descricao: 'Promover atividades de educação alimentar para conscientização.'
          });
        
          return {
            success: true,
            recomendacoes: recomendacoes.sort(function(a, b) { return a.prioridade - b.prioridade; })
          };
        
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em gerarRecomendacoes: " + error.message);
        throw error;
      }
    },
    
    /**
     * Obtém configurações do módulo
     * @returns {Object} Configurações
     */
    obterConfiguracoes: function() {
      return {
        tipos: CONFIG.TIPOS,
        motivosDescarte: CONFIG.MOTIVOS_DESCARTE,
        niveisAceitacao: CONFIG.NIVEIS_ACEITACAO,
        metaAproveitamento: CONFIG.META_APROVEITAMENTO
      };
    }
  };
})();


// ============================================================================
// FUNÇÕES GLOBAIS DE API
// ============================================================================

/**
 * API: Registra resto-ingestão
 */
function api_resto_ingestao_registrar(dados) {
  return WasteTracker.registrar(dados);
}

/**
 * API: Registra refeição completa
 */
function api_resto_ingestao_refeicao(dadosRefeicao, itens) {
  return WasteTracker.registrarRefeicaoCompleta(dadosRefeicao, itens);
}

/**
 * API: Consulta registros
 */
function api_resto_ingestao_consultar(filtros) {
  return WasteTracker.consultar(filtros);
}

/**
 * API: Ranking de desperdício
 */
function api_resto_ingestao_ranking_desperdicio(filtros) {
  return WasteTracker.rankingDesperdicio(filtros);
}

/**
 * API: Ranking de aceitação
 */
function api_resto_ingestao_ranking_aceitacao(filtros) {
  return WasteTracker.rankingAceitacao(filtros);
}

/**
 * API: Relatório de aproveitamento
 */
function api_resto_ingestao_relatorio(filtros) {
  return WasteTracker.relatorioAproveitamento(filtros);
}

/**
 * API: Comparativo entre escolas
 */
function api_resto_ingestao_comparativo_escolas(filtros) {
  return WasteTracker.comparativoEscolas(filtros);
}

/**
 * API: Gera alertas
 */
function api_resto_ingestao_alertas(filtros) {
  return WasteTracker.gerarAlertas(filtros);
}

/**
 * API: Gera recomendações
 */
function api_resto_ingestao_recomendacoes(escolaId) {
  return WasteTracker.gerarRecomendacoes(escolaId);
}

/**
 * API: Configurações
 */
function api_resto_ingestao_config() {
  return WasteTracker.obterConfiguracoes();
}

// ============================================================================
// REGISTRO DO MÓDULO
// ============================================================================

Logger.log('✅ Core_Waste_Tracker.gs carregado - WasteTracker disponível');
