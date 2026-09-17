/**
 * @fileoverview Gestão de Cardápios Especiais - Alimentação Escolar CRE-PP
 * @version 1.0.0
 * 
 * Intervenção 13/38: SpecialMenus conforme Prompt 13
 * 
 * Módulo para alunos com Necessidades Alimentares Especiais (NAE):
 * - Cadastro de patologias (diabetes, celíacos, intolerantes)
 * - Geração automática de substituições no cardápio padrão
 * - Controle de laudos médicos
 * - Alertas de restrições
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-25
 */

'use strict';

// ============================================================================
// SPECIAL MENUS - Cardápios para Necessidades Alimentares Especiais
// ============================================================================

var SpecialMenus = (function() {
  
  // =========================================================================
  // CONFIGURAÇÃO
  // =========================================================================
  
  var CONFIG = {
    SHEETS: {
      ALUNOS_NAE: 'Alunos_NAE',
      CARDAPIOS_ESPECIAIS: 'Cardapios_Especiais',
      SUBSTITUICOES: 'Substituicoes_Alimentos'
    },
    
    // Patologias/Condições comuns
    PATOLOGIAS: {
      DIABETES_TIPO_1: {
        codigo: 'DM1',
        nome: 'Diabetes Mellitus Tipo 1',
        cid: 'E10',
        restricoes: ['ACUCARES', 'alto_indice_glicemico'],
        orientacoes: 'Controlar carboidratos simples, preferir integrais'
      },
      DIABETES_TIPO_2: {
        codigo: 'DM2',
        nome: 'Diabetes Mellitus Tipo 2',
        cid: 'E11',
        restricoes: ['ACUCARES', 'alto_indice_glicemico'],
        orientacoes: 'Controlar carboidratos, evitar açúcares refinados'
      },
      DOENCA_CELIACA: {
        codigo: 'CEL',
        nome: 'Doença Celíaca',
        cid: 'K90.0',
        restricoes: ['gluten', 'trigo', 'cevada', 'centeio', 'aveia'],
        orientacoes: 'Dieta 100% sem glúten, atenção à contaminação cruzada'
      },
      INTOLERANCIA_LACTOSE: {
        codigo: 'IL',
        nome: 'Intolerância à Lactose',
        cid: 'E73',
        restricoes: ['lactose', 'leite', 'derivados_leite'],
        orientacoes: 'Substituir por leite sem lactose ou vegetais'
      },

      ALERGIA_LEITE: {
        codigo: 'APLV',
        nome: 'Alergia à Proteína do Leite de Vaca',
        cid: 'K52.2',
        restricoes: ['leite', 'derivados_leite', 'caseina', 'lactalbumina'],
        orientacoes: 'Evitar TODO contato com proteínas do leite'
      },
      ALERGIA_OVO: {
        codigo: 'AOV',
        nome: 'Alergia a Ovo',
        cid: 'T78.1',
        restricoes: ['ovo', 'albumina', 'lecitina_ovo'],
        orientacoes: 'Evitar ovos e derivados, verificar rótulos'
      },
      ALERGIA_AMENDOIM: {
        codigo: 'AAM',
        nome: 'Alergia a Amendoim',
        cid: 'T78.1',
        restricoes: ['amendoim', 'oleaginosas'],
        orientacoes: 'RISCO ANAFILÁTICO - evitar contaminação cruzada'
      },
      ALERGIA_FRUTOS_MAR: {
        codigo: 'AFM',
        nome: 'Alergia a Frutos do Mar',
        cid: 'T78.1',
        restricoes: ['peixe', 'crustaceos', 'moluscos'],
        orientacoes: 'Evitar todos os frutos do mar'
      },
      ALERGIA_SOJA: {
        codigo: 'ASJ',
        nome: 'Alergia a Soja',
        cid: 'T78.1',
        restricoes: ['soja', 'lecitina_soja', 'proteina_soja'],
        orientacoes: 'Verificar rótulos - soja presente em muitos produtos'
      },
      FENILCETONURIA: {
        codigo: 'PKU',
        nome: 'Fenilcetonúria',
        cid: 'E70.0',
        restricoes: ['fenilalanina', 'aspartame', 'proteinas_alto_teor'],
        orientacoes: 'Dieta com baixo teor de fenilalanina'
      },
      HIPERTENSAO: {
        codigo: 'HAS',
        nome: 'Hipertensão Arterial',
        cid: 'I10',
        restricoes: ['sodio', 'sal', 'embutidos'],
        orientacoes: 'Reduzir sódio, evitar alimentos industrializados'
      },
      OBESIDADE: {
        codigo: 'OBS',
        nome: 'Obesidade',
        cid: 'E66',
        restricoes: ['alto_calorico', 'frituras', 'acucares'],
        orientacoes: 'Controle calórico, preferir preparações assadas/grelhadas'
      },
      DISLIPIDEMIA: {
        codigo: 'DLP',
        nome: 'Dislipidemia',
        cid: 'E78',
        restricoes: ['gordura_saturada', 'colesterol', 'frituras'],
        orientacoes: 'Reduzir gorduras saturadas, preferir azeite'
      },
      VEGETARIANO: {
        codigo: 'VEG',
        nome: 'Vegetariano (opção alimentar)',
        cid: null,
        restricoes: ['carnes', 'aves', 'peixes'],
        orientacoes: 'Garantir proteínas vegetais adequadas'
      },
      VEGANO: {
        codigo: 'VGN',
        nome: 'Vegano (opção alimentar)',
        cid: null,
        restricoes: ['carnes', 'aves', 'peixes', 'ovos', 'leite', 'mel'],
        orientacoes: 'Garantir B12, ferro, cálcio de fontes vegetais'
      }
    },
    
    // Mapeamento de substituições padrão
    SUBSTITUICOES_PADRAO: {
      'leite': ['leite_sem_lactose', 'bebida_vegetal_arroz', 'bebida_vegetal_aveia'],
      'queijo': ['queijo_sem_lactose', 'tofu'],
      'pao': ['pao_sem_gluten', 'tapioca', 'cuscuz'],
      'macarrao': ['macarrao_sem_gluten', 'macarrao_arroz'],
      'farinha_trigo': ['farinha_arroz', 'fecula_batata', 'polvilho'],
      'acucar': ['adocante_stevia', 'adocante_sucralose'],
      'ovo': ['chia_hidratada', 'linhaca_hidratada'],
      'carne': ['proteina_soja', 'grao_bico', 'lentilha', 'feijao']
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
      return (prefix || 'NAE') + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6);
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
    var obj = {};
    headers.forEach(function(h, idx) { obj[h] = row[idx]; });
    return obj;
  }
  
  /**
   * Verifica se item contém alguma restrição
   * @private
   */
  function _itemContemRestricao(item, restricoes) {
    try {
      try {
        if (!item || !restricoes || restricoes.length === 0) return false;
    
        var nomeItem = (item.Nome || '').toLowerCase();
        var grupoItem = (item.Grupo_Alimentar || '').toLowerCase();
        var alergenosItem = (item.Alergenos || '').toLowerCase();
    
        for (var i = 0; i < restricoes.length; i++) {
          var restricao = restricoes[i].toLowerCase();
      
          // Verifica no nome
          if (nomeItem.indexOf(restricao) !== -1) return true;
      
          // Verifica no grupo
          if (grupoItem.indexOf(restricao) !== -1) return true;
      
          // Verifica nos alergênicos
          if (alergenosItem.indexOf(restricao) !== -1) return true;
      
          // Verifica glúten/lactose específicos
          if (restricao === 'gluten' && item.Contem_Gluten) return true;
          if (restricao === 'lactose' && item.Contem_Lactose) return true;
        }
    
        return false;
      } catch (error) {
        Logger.log("Erro em _itemContemRestricao: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em _itemContemRestricao: " + error.message);
      throw error;
    }
  }
  
  // =========================================================================
  // API PÚBLICA
  // =========================================================================
  
  return {
    CONFIG: CONFIG,
    
    // -----------------------------------------------------------------------
    // GESTÃO DE ALUNOS NAE
    // -----------------------------------------------------------------------
    
    /**
     * Cadastra aluno com necessidade alimentar especial
     * @param {Object} dados - Dados do aluno
     * @returns {Object} Resultado
     */
    cadastrarAluno: function(dados) {
      try {
        try {
          var sheet = _getSheet(CONFIG.SHEETS.ALUNOS_NAE);
          if (!sheet) {
            return { success: false, error: 'Planilha de alunos NAE não encontrada' };
          }
        
          // Validações
          if (!dados.nome) return { success: false, error: 'Nome é obrigatório' };
          if (!dados.escolaId) return { success: false, error: 'Escola é obrigatória' };
          if (!dados.patologia) return { success: false, error: 'Patologia é obrigatória' };
        
          var id = _generateId('ALUNO');
          var now = new Date();
        
          // Obtém info da patologia
          var patologiaInfo = CONFIG.PATOLOGIAS[dados.patologia] || {};
        
          var aluno = [
            id,
            dados.nome,
            dados.escolaId,
            dados.turma || '',
            dados.patologia,
            patologiaInfo.cid || dados.cid || '',
            dados.laudoMedico || '',
            JSON.stringify(patologiaInfo.restricoes || dados.restricoes || []),
            dados.responsavel || '',
            dados.contato || '',
            true  // Ativo
          ];
        
          sheet.appendRow(aluno);
        
          return {
            success: true,
            id: id,
            patologiaInfo: patologiaInfo,
            message: 'Aluno cadastrado com sucesso'
          };
        
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em cadastrarAluno: " + error.message);
        throw error;
      }
    },

    /**
     * Atualiza dados do aluno NAE
     * @param {string} alunoId - ID do aluno
     * @param {Object} dados - Dados a atualizar
     * @returns {Object} Resultado
     */
    atualizarAluno: function(alunoId, dados) {
      try {
        try {
          var sheet = _getSheet(CONFIG.SHEETS.ALUNOS_NAE);
          if (!sheet || sheet.getLastRow() <= 1) {
            return { success: false, error: 'Aluno não encontrado' };
          }
        
          var data = sheet.getDataRange().getValues();
          var headers = data[0];
        
          for (var i = 1; i < data.length; i++) {
            if (data[i][0] === alunoId) {
              var colMap = {};
              headers.forEach(function(h, idx) { colMap[h] = idx; });
            
              if (dados.nome && colMap['Nome'] !== undefined) {
                sheet.getRange(i + 1, colMap['Nome'] + 1).setValue(dados.nome);
              }
              if (dados.turma && colMap['Turma'] !== undefined) {
                sheet.getRange(i + 1, colMap['Turma'] + 1).setValue(dados.turma);
              }
              if (dados.laudoMedico && colMap['Laudo_Medico'] !== undefined) {
                sheet.getRange(i + 1, colMap['Laudo_Medico'] + 1).setValue(dados.laudoMedico);
              }
              if (dados.restricoes && colMap['Restricoes_Alimentares'] !== undefined) {
                sheet.getRange(i + 1, colMap['Restricoes_Alimentares'] + 1).setValue(JSON.stringify(dados.restricoes));
              }
              if (dados.responsavel && colMap['Responsavel'] !== undefined) {
                sheet.getRange(i + 1, colMap['Responsavel'] + 1).setValue(dados.responsavel);
              }
              if (dados.contato && colMap['Contato'] !== undefined) {
                sheet.getRange(i + 1, colMap['Contato'] + 1).setValue(dados.contato);
              }
            
              return { success: true, message: 'Aluno atualizado' };
            }
          }
        
          return { success: false, error: 'Aluno não encontrado' };
        
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em atualizarAluno: " + error.message);
        throw error;
      }
    },
    
    /**
     * Obtém aluno por ID
     * @param {string} alunoId - ID do aluno
     * @returns {Object} Resultado
     */
    obterAluno: function(alunoId) {
      try {
        try {
          var sheet = _getSheet(CONFIG.SHEETS.ALUNOS_NAE);
          if (!sheet || sheet.getLastRow() <= 1) {
            return { success: false, error: 'Aluno não encontrado' };
          }
        
          var data = sheet.getDataRange().getValues();
          var headers = data[0];
        
          for (var i = 1; i < data.length; i++) {
            if (data[i][0] === alunoId) {
              var aluno = _rowToObject(data[i], headers);
            
              // Parse restrições
              try {
                aluno.restricoesList = JSON.parse(aluno.Restricoes_Alimentares || '[]');
              } catch (e) {
                aluno.restricoesList = [];
              }
            
              // Adiciona info da patologia
              aluno.patologiaInfo = CONFIG.PATOLOGIAS[aluno.Patologia] || null;
            
              return { success: true, aluno: aluno };
            }
          }
        
          return { success: false, error: 'Aluno não encontrado' };
        
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em obterAluno: " + error.message);
        throw error;
      }
    },
    
    /**
     * Lista alunos NAE
     * @param {Object} [filtros] - { escolaId, patologia, apenasAtivos }
     * @returns {Object} Resultado
     */
    listarAlunos: function(filtros) {
      try {
        filtros = filtros || {};
      
        try {
          var sheet = _getSheet(CONFIG.SHEETS.ALUNOS_NAE);
          if (!sheet || sheet.getLastRow() <= 1) {
            return { success: true, alunos: [], count: 0 };
          }
        
          var data = sheet.getDataRange().getValues();
          var headers = data[0];
          var alunos = [];
        
          for (var i = 1; i < data.length; i++) {
            var aluno = _rowToObject(data[i], headers);
          
            // Aplica filtros
            if (filtros.apenasAtivos !== false && aluno.Ativo === false) continue;
            if (filtros.escolaId && aluno.Escola_ID !== filtros.escolaId) continue;
            if (filtros.patologia && aluno.Patologia !== filtros.patologia) continue;
          
            // Parse restrições
            try {
              aluno.restricoesList = JSON.parse(aluno.Restricoes_Alimentares || '[]');
            } catch (e) {
              aluno.restricoesList = [];
            }
          
            aluno.patologiaInfo = CONFIG.PATOLOGIAS[aluno.Patologia] || null;
            alunos.push(aluno);
          }
        
          return { success: true, alunos: alunos, count: alunos.length };
        
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em listarAlunos: " + error.message);
        throw error;
      }
    },

    // -----------------------------------------------------------------------
    // GERAÇÃO DE CARDÁPIOS ESPECIAIS
    // -----------------------------------------------------------------------
    
    /**
     * Gera cardápio especial para aluno baseado no cardápio padrão
     * @param {string} alunoId - ID do aluno NAE
     * @param {string} cardapioBaseId - ID do cardápio padrão
     * @returns {Object} Cardápio adaptado
     */
    gerarCardapioEspecial: function(alunoId, cardapioBaseId) {
      try {
        try {
          // Obtém dados do aluno
          var alunoResult = this.obterAluno(alunoId);
          if (!alunoResult.success) return alunoResult;
        
          var aluno = alunoResult.aluno;
          var restricoes = aluno.restricoesList || [];
        
          // Adiciona restrições da patologia
          if (aluno.patologiaInfo && aluno.patologiaInfo.restricoes) {
            restricoes = restricoes.concat(aluno.patologiaInfo.restricoes);
          }
        
          // Remove duplicatas
          restricoes = restricoes.filter(function(r, idx, arr) {
            return arr.indexOf(r) === idx;
          });
        
          // Obtém itens do cardápio base
          var itensCardapio = [];
          if (typeof MenuBuilder !== 'undefined') {
            var itensResult = MenuBuilder.obterItensCardapio(cardapioBaseId);
            if (itensResult.success) {
              itensCardapio = itensResult.itens;
            }
          }
        
          // Obtém detalhes dos itens alimentares
          var itensAlimentares = {};
          if (typeof ItemsRepository !== 'undefined') {
            var todosItens = ItemsRepository.listar({ apenasAtivos: true });
            if (todosItens.success) {
              todosItens.itens.forEach(function(item) {
                itensAlimentares[item.ID] = item;
              });
            }
          }
        
          // Analisa cada item e gera substituições
          var cardapioAdaptado = {
            alunoId: alunoId,
            alunoNome: aluno.Nome,
            patologia: aluno.Patologia,
            cardapioBaseId: cardapioBaseId,
            restricoes: restricoes,
            itensOriginais: [],
            itensSubstituidos: [],
            itensRemovidos: [],
            alertas: []
          };
        
          itensCardapio.forEach(function(itemCardapio) {
            var itemId = itemCardapio.Item_ID;
            var itemInfo = itensAlimentares[itemId] || { Nome: itemId };
          
            // Verifica se item contém restrição
            if (_itemContemRestricao(itemInfo, restricoes)) {
              // Busca substituição
              var substituicao = this._buscarSubstituicao(itemInfo, restricoes, itensAlimentares);
            
              if (substituicao) {
                cardapioAdaptado.itensSubstituidos.push({
                  original: {
                    id: itemId,
                    nome: itemInfo.Nome,
                    quantidade: itemCardapio.Quantidade_g
                  },
                  substituto: {
                    id: substituicao.ID,
                    nome: substituicao.Nome,
                    quantidade: itemCardapio.Quantidade_g,
                    motivo: 'Restrição: ' + restricoes.join(', ')
                  }
                });
              } else {
                cardapioAdaptado.itensRemovidos.push({
                  id: itemId,
                  nome: itemInfo.Nome,
                  motivo: 'Sem substituto disponível para restrição'
                });
              
                cardapioAdaptado.alertas.push(
                  'Item "' + itemInfo.Nome + '" removido sem substituição'
                );
              }
            } else {
              cardapioAdaptado.itensOriginais.push({
                id: itemId,
                nome: itemInfo.Nome,
                quantidade: itemCardapio.Quantidade_g
              });
            }
          }.bind(this));
        
          // Salva cardápio especial
          this._salvarCardapioEspecial(cardapioAdaptado);
        
          return {
            success: true,
            cardapio: cardapioAdaptado,
            resumo: {
              mantidos: cardapioAdaptado.itensOriginais.length,
              substituidos: cardapioAdaptado.itensSubstituidos.length,
              removidos: cardapioAdaptado.itensRemovidos.length,
              alertas: cardapioAdaptado.alertas.length
            }
          };
        
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em gerarCardapioEspecial: " + error.message);
        throw error;
      }
    },
    
    /**
     * Busca substituição para item restrito
     * @private
     */
    _buscarSubstituicao: function(itemOriginal, restricoes, itensDisponiveis) {
      var nomeOriginal = (itemOriginal.Nome || '').toLowerCase();
      var grupoOriginal = itemOriginal.Grupo_Alimentar;
      
      // Primeiro tenta substituições padrão
      for (var chave in CONFIG.SUBSTITUICOES_PADRAO) {
        if (nomeOriginal.indexOf(chave) !== -1) {
          var opcoes = CONFIG.SUBSTITUICOES_PADRAO[chave];
          
          for (var i = 0; i < opcoes.length; i++) {
            var opcaoNome = opcoes[i].toLowerCase();
            
            // Busca item com esse nome
            for (var id in itensDisponiveis) {
              var item = itensDisponiveis[id];
              if ((item.Nome || '').toLowerCase().indexOf(opcaoNome) !== -1) {
                // Verifica se substituto não tem as mesmas restrições
                if (!_itemContemRestricao(item, restricoes)) {
                  return item;
                }
              }
            }
          }
        }
      }
      
      // Se não encontrou, busca item do mesmo grupo sem restrições
      for (var id in itensDisponiveis) {
        var item = itensDisponiveis[id];
        if (item.Grupo_Alimentar === grupoOriginal && 
            item.ID !== itemOriginal.ID &&
            !_itemContemRestricao(item, restricoes)) {
          return item;
        }
      }
      
      return null;
    },
    
    /**
     * Salva cardápio especial na planilha
     * @private
     */
    _salvarCardapioEspecial: function(cardapio) {
      try {
        try {
          var sheet = _getSheet(CONFIG.SHEETS.CARDAPIOS_ESPECIAIS);
          if (!sheet) return;
        
          var id = _generateId('CESP');
          var now = new Date();
        
          var registro = [
            id,
            cardapio.alunoId,
            cardapio.cardapioBaseId,
            cardapio.patologia,
            JSON.stringify(cardapio.restricoes),
            JSON.stringify({
              originais: cardapio.itensOriginais,
              substituidos: cardapio.itensSubstituidos,
              removidos: cardapio.itensRemovidos
            }),
            _getCurrentUser(),
            now,
            true
          ];
        
          sheet.appendRow(registro);
        
        } catch (e) {
          console.error('Erro ao salvar cardápio especial: ' + e.message);
        }
      } catch (error) {
        Logger.log("Erro em _salvarCardapioEspecial: " + error.message);
        throw error;
      }
    },

    // -----------------------------------------------------------------------
    // GERAÇÃO EM LOTE
    // -----------------------------------------------------------------------
    
    /**
     * Gera cardápios especiais para todos os alunos NAE de uma escola
     * @param {string} escolaId - ID da escola
     * @param {string} cardapioBaseId - ID do cardápio padrão
     * @returns {Object} Resultado
     */
    gerarCardapiosEscola: function(escolaId, cardapioBaseId) {
      try {
        var alunosResult = this.listarAlunos({ escolaId: escolaId, apenasAtivos: true });
        if (!alunosResult.success) return alunosResult;
        
        var resultado = {
          total: alunosResult.alunos.length,
          gerados: 0,
          erros: 0,
          detalhes: []
        };
        
        alunosResult.alunos.forEach(function(aluno) {
          var cardapioResult = this.gerarCardapioEspecial(aluno.ID, cardapioBaseId);
          
          if (cardapioResult.success) {
            resultado.gerados++;
            resultado.detalhes.push({
              aluno: aluno.Nome,
              patologia: aluno.Patologia,
              status: 'OK',
              resumo: cardapioResult.resumo
            });
          } else {
            resultado.erros++;
            resultado.detalhes.push({
              aluno: aluno.Nome,
              status: 'ERRO',
              erro: cardapioResult.error
            });
          }
        }.bind(this));
        
        resultado.success = true;
        resultado.message = 'Gerados ' + resultado.gerados + ' de ' + resultado.total + ' cardápios';
        
        return resultado;
        
      } catch (e) {
        return { success: false, error: e.message };
      }
    },
    
    // -----------------------------------------------------------------------
    // CONSULTAS E RELATÓRIOS
    // -----------------------------------------------------------------------
    
    /**
     * Obtém cardápio especial de um aluno
     * @param {string} alunoId - ID do aluno
     * @param {string} [cardapioBaseId] - ID do cardápio base (opcional)
     * @returns {Object} Resultado
     */
    obterCardapioAluno: function(alunoId, cardapioBaseId) {
      try {
        try {
          var sheet = _getSheet(CONFIG.SHEETS.CARDAPIOS_ESPECIAIS);
          if (!sheet || sheet.getLastRow() <= 1) {
            return { success: false, error: 'Nenhum cardápio especial encontrado' };
          }
        
          var data = sheet.getDataRange().getValues();
          var headers = data[0];
        
          // Busca do mais recente para o mais antigo
          for (var i = data.length - 1; i >= 1; i--) {
            var row = _rowToObject(data[i], headers);
          
            if (row.Aluno_ID === alunoId) {
              if (!cardapioBaseId || row.Cardapio_Base_ID === cardapioBaseId) {
                // Parse JSON
                try {
                  row.restricoesList = JSON.parse(row.Restricoes || '[]');
                  row.substituicoesObj = JSON.parse(row.Substituicoes_JSON || '{}');
                } catch (e) {
                  row.restricoesList = [];
                  row.substituicoesObj = {};
                }
              
                return { success: true, cardapio: row };
              }
            }
          }
        
          return { success: false, error: 'Cardápio especial não encontrado' };
        
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em obterCardapioAluno: " + error.message);
        throw error;
      }
    },
    
    /**
     * Lista alunos NAE por patologia
     * @param {string} patologia - Código da patologia
     * @returns {Object} Resultado
     */
    listarPorPatologia: function(patologia) {
      return this.listarAlunos({ patologia: patologia });
    },
    
    /**
     * Obtém estatísticas de alunos NAE
     * @param {string} [escolaId] - Filtrar por escola
     * @returns {Object} Estatísticas
     */
    obterEstatisticas: function(escolaId) {
      try {
        var filtros = { apenasAtivos: true };
        if (escolaId) filtros.escolaId = escolaId;
        
        var alunosResult = this.listarAlunos(filtros);
        if (!alunosResult.success) return alunosResult;
        
        var stats = {
          total: alunosResult.alunos.length,
          porPatologia: {},
          porEscola: {},
          restricoesMaisComuns: {}
        };
        
        alunosResult.alunos.forEach(function(aluno) {
          // Por patologia
          var pat = aluno.Patologia || 'NAO_INFORMADA';
          stats.porPatologia[pat] = (stats.porPatologia[pat] || 0) + 1;
          
          // Por escola
          var esc = aluno.Escola_ID || 'NAO_INFORMADA';
          stats.porEscola[esc] = (stats.porEscola[esc] || 0) + 1;
          
          // Restrições
          (aluno.restricoesList || []).forEach(function(r) {
            stats.restricoesMaisComuns[r] = (stats.restricoesMaisComuns[r] || 0) + 1;
          });
        });
        
        return { success: true, estatisticas: stats };
        
      } catch (e) {
        return { success: false, error: e.message };
      }
    },
    
    /**
     * Verifica se aluno tem restrição para item específico
     * @param {string} alunoId - ID do aluno
     * @param {string} itemId - ID do item alimentar
     * @returns {Object} Resultado
     */
    verificarRestricao: function(alunoId, itemId) {
      try {
        try {
          var alunoResult = this.obterAluno(alunoId);
          if (!alunoResult.success) return alunoResult;
        
          var restricoes = alunoResult.aluno.restricoesList || [];
          if (alunoResult.aluno.patologiaInfo && alunoResult.aluno.patologiaInfo.restricoes) {
            restricoes = restricoes.concat(alunoResult.aluno.patologiaInfo.restricoes);
          }
        
          // Obtém item
          var itemInfo = null;
          if (typeof ItemsRepository !== 'undefined') {
            var itemResult = ItemsRepository.obterPorId(itemId);
            if (itemResult.success) {
              itemInfo = itemResult.item;
            }
          }
        
          if (!itemInfo) {
            return { success: false, error: 'Item não encontrado' };
          }
        
          var temRestricao = _itemContemRestricao(itemInfo, restricoes);
        
          return {
            success: true,
            aluno: alunoResult.aluno.Nome,
            item: itemInfo.Nome,
            temRestricao: temRestricao,
            restricoesAplicaveis: temRestricao ? restricoes : [],
            orientacao: temRestricao && alunoResult.aluno.patologiaInfo 
              ? alunoResult.aluno.patologiaInfo.orientacoes 
              : null
          };
        
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em verificarRestricao: " + error.message);
        throw error;
      }
    },
    
    /**
     * Obtém lista de patologias disponíveis
     * @returns {Object} Patologias
     */
    obterPatologias: function() {
      return {
        success: true,
        patologias: CONFIG.PATOLOGIAS
      };
    },
    
    /**
     * Obtém substituições padrão
     * @returns {Object} Substituições
     */
    obterSubstituicoesPadrao: function() {
      return {
        success: true,
        substituicoes: CONFIG.SUBSTITUICOES_PADRAO
      };
    }
  };
})();


// ============================================================================
// FUNÇÕES GLOBAIS DE API
// ============================================================================

/**
 * API: Cadastra aluno NAE
 */
function api_aluno_nae_cadastrar(dados) {
  return SpecialMenus.cadastrarAluno(dados);
}

/**
 * API: Atualiza aluno NAE
 */
function api_aluno_nae_atualizar(alunoId, dados) {
  return SpecialMenus.atualizarAluno(alunoId, dados);
}

/**
 * API: Obtém aluno NAE
 */
function api_aluno_nae_obter(alunoId) {
  return SpecialMenus.obterAluno(alunoId);
}

/**
 * API: Lista alunos NAE
 */
function api_alunos_nae_listar(filtros) {
  return SpecialMenus.listarAlunos(filtros);
}

/**
 * API: Lista por patologia
 */
function api_alunos_nae_por_patologia(patologia) {
  return SpecialMenus.listarPorPatologia(patologia);
}

/**
 * API: Gera cardápio especial para aluno
 */
function api_cardapio_especial_gerar(alunoId, cardapioBaseId) {
  return SpecialMenus.gerarCardapioEspecial(alunoId, cardapioBaseId);
}

/**
 * API: Gera cardápios especiais para escola
 */
function api_cardapios_especiais_escola(escolaId, cardapioBaseId) {
  return SpecialMenus.gerarCardapiosEscola(escolaId, cardapioBaseId);
}

/**
 * API: Obtém cardápio especial do aluno
 */
function api_cardapio_especial_obter(alunoId, cardapioBaseId) {
  return SpecialMenus.obterCardapioAluno(alunoId, cardapioBaseId);
}

/**
 * API: Verifica restrição aluno x item
 */
function api_verificar_restricao(alunoId, itemId) {
  return SpecialMenus.verificarRestricao(alunoId, itemId);
}

/**
 * API: Estatísticas NAE
 */
function api_nae_estatisticas(escolaId) {
  return SpecialMenus.obterEstatisticas(escolaId);
}

/**
 * API: Lista patologias disponíveis
 */
function api_patologias_listar() {
  return SpecialMenus.obterPatologias();
}

/**
 * API: Lista substituições padrão
 */
function api_substituicoes_padrao() {
  return SpecialMenus.obterSubstituicoesPadrao();
}

// ============================================================================
// REGISTRO DO MÓDULO
// ============================================================================

Logger.log('✅ Core_Special_Menus.gs carregado - SpecialMenus disponível');
