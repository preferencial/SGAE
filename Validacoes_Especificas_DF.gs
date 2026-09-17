'use strict';

/**
 * VALIDACOES_ESPECIFICAS_DF.gs
 * Validações específicas para processos da alimentação escolar do DF
 *
 * Implementa regras de negócio específicas do Distrito Federal:
 * - Validação de notas fiscais conforme padrões SEFAZ-DF
 * - Verificação de conformidade com contratos SEEDF
 * - Validação de PDGP semanal
 * - Controle de per capita por modalidade
 * - Verificação de agricultura familiar (30% mínimo)
 *
 * @version 1.0.0
 * @created 2025-11-27
 */

// ============================================================================
// VALIDAÇÕES DE NOTA FISCAL
// ============================================================================

/**
 * Valida nota fiscal conforme padrões do DF
 */
function validarNotaFiscalDF(dadosNF) {
  try {
    // Validar entrada
    if (!dadosNF || typeof dadosNF !== 'object') {
      Logger.log('ERRO: validarNotaFiscalDF chamada sem dados válidos');
      return {
        valido: false,
        erros: ['Dados de nota fiscal inválidos ou ausentes'],
        alertas: [],
        avisos: [],
        score: 0
      };
    }

    var erros = [];
    var alertas = [];
    var avisos = [];

    // 1. Validar chave de acesso NF-e (44 dígitos)
    if (dadosNF.chaveAcesso) {
      if (!/^\d{44}$/.test(dadosNF.chaveAcesso)) {
        erros.push('Chave de acesso deve ter 44 dígitos numéricos');
      } else {
        // Validar UF (posições 1-2 devem ser 53 para DF)
        var uf = dadosNF.chaveAcesso.substring(0, 2);
        if (uf !== '53') {
          alertas.push('Chave de acesso não é do DF (UF: ' + uf + ')');
        }
      }
    }

    // 2. Validar CNPJ do fornecedor
    if (dadosNF.cnpjFornecedor) {
      if (!validarCNPJ(dadosNF.cnpjFornecedor)) {
        erros.push('CNPJ do fornecedor inválido');
      }
    } else if (!dadosNF.cpfFornecedor) {
      erros.push('CNPJ ou CPF do fornecedor obrigatório');
    }

    // 3. Validar valor total
    if (!dadosNF.valorTotal || dadosNF.valorTotal <= 0) {
      erros.push('Valor total deve ser maior que zero');
    }

    // 4. Validar data de emissão
    if (dadosNF.dataEmissao) {
      var dataEmissao = new Date(dadosNF.dataEmissao);
      var hoje = new Date();
      var diasDiferenca = Math.floor((hoje - dataEmissao) / (1000 * 60 * 60 * 24));

      if (dataEmissao > hoje) {
        erros.push('Data de emissão não pode ser futura');
      }

      if (diasDiferenca > 90) {
        alertas.push('Nota fiscal com mais de 90 dias de emissão');
      }
    } else {
      erros.push('Data de emissão obrigatória');
    }

    // 5. Validar número da nota
    if (!dadosNF.numeroNF) {
      erros.push('Número da nota fiscal obrigatório');
    }

    // 6. Validar série
    if (!dadosNF.serie) {
      avisos.push('Série da nota fiscal não informada');
    }

    // 7. Validar itens da nota
    if (dadosNF.itens && dadosNF.itens.length > 0) {
      var somaItens = 0;
      dadosNF.itens.forEach(function(item, index) {
        if (!item.descricao) {
          erros.push('Item ' + (index + 1) + ': descrição obrigatória');
        }
        if (!item.quantidade || item.quantidade <= 0) {
          erros.push('Item ' + (index + 1) + ': quantidade inválida');
        }
        if (!item.valorUnitario || item.valorUnitario <= 0) {
          erros.push('Item ' + (index + 1) + ': valor unitário inválido');
        }
        if (item.quantidade && item.valorUnitario) {
          somaItens += item.quantidade * item.valorUnitario;
        }
      });

      // Validar soma dos itens vs valor total
      if (Math.abs(somaItens - dadosNF.valorTotal) > 0.02) {
        alertas.push('Divergência entre soma dos itens (R$ ' + somaItens.toFixed(2) +
                     ') e valor total (R$ ' + dadosNF.valorTotal.toFixed(2) + ')');
      }
    }

    // 8. Validar vinculação com contrato/empenho
    if (!dadosNF.numeroEmpenho && !dadosNF.numeroContrato) {
      alertas.push('Nota fiscal sem vinculação a empenho ou contrato');
    }

    return {
      valido: erros.length === 0,
      erros: erros,
      alertas: alertas,
      avisos: avisos,
      score: calcularScoreValidacao(erros, alertas, avisos)
    };
  } catch (error) {
    Logger.log("Erro em validarNotaFiscalDF: " + error.message);
    throw error;
  }
}

/**
 * Valida CNPJ (versão específica DF)
 * @deprecated Use validarCNPJ() de Core_Unified_Validation.gs
 * @param {string} cnpj - CNPJ a ser validado
 * @returns {boolean} true se válido, false caso contrário
 */
function validarCNPJ_DF(cnpj) {
  try {
    // Tratar valores nulos ou undefined
    if (cnpj === null || cnpj === undefined) {
      return false;
    }

    // Converter para string e remover caracteres não numéricos
    var cnpjStr = String(cnpj).replace(/[^\d]/g, '');

    if (cnpjStr.length !== 14) return false;
    if (/^(\d)\1+$/.test(cnpjStr)) return false;

    // Validar dígitos verificadores
    var tamanho = cnpjStr.length - 2;
    var numeros = cnpjStr.substring(0, tamanho);
    var digitos = cnpjStr.substring(tamanho);
    var soma = 0;
    var pos = tamanho - 7;

    for (var i = tamanho; i >= 1; i--) {
      soma += numeros.charAt(tamanho - i) * pos--;
      if (pos < 2) pos = 9;
    }

    var resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    if (resultado != digitos.charAt(0)) return false;

    tamanho = tamanho + 1;
    numeros = cnpjStr.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;

    for (var i = tamanho; i >= 1; i--) {
      soma += numeros.charAt(tamanho - i) * pos--;
      if (pos < 2) pos = 9;
    }

    resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    if (resultado != digitos.charAt(1)) return false;

    return true;
  } catch (error) {
    Logger.log("Erro em validarCNPJ_DF: " + error.message);
    throw error;
  }
}

// ============================================================================
// VALIDAÇÕES DE RECEBIMENTO
// ============================================================================

/**
 * Valida recebimento de produtos conforme critérios do DF
 */
function validarRecebimentoDF(dadosRecebimento) {
  try {
    // Validar entrada
    if (!dadosRecebimento || typeof dadosRecebimento !== 'object') {
      Logger.log('ERRO: validarRecebimentoDF chamada sem dados válidos');
      return {
        valido: false,
        erros: ['Dados de recebimento inválidos ou ausentes'],
        alertas: [],
        avisos: [],
        recomendacao: 'RECUSAR',
        score: 0
      };
    }

    var erros = [];
    var alertas = [];
    var avisos = [];

    // 1. Validar horário de recebimento
    if (dadosRecebimento.horaRecebimento) {
      var hora = parseInt(dadosRecebimento.horaRecebimento.split(':')[0]);

      if (hora < 6 || hora > 18) {
        alertas.push('Recebimento fora do horário padrão (06:00 às 18:00)');
      }

      // PDGP deve ser recebido pela manhã
      if (dadosRecebimento.tipoProduto === 'PERECIVEL' && hora > 10) {
        alertas.push('Produtos perecíveis devem ser recebidos preferencialmente até 10:00');
      }
    }

    // 2. Validar temperatura
    if (dadosRecebimento.temperaturaAferida !== undefined) {
      var temp = parseFloat(dadosRecebimento.temperaturaAferida);

      if (dadosRecebimento.tipoConservacao === 'REFRIGERADO') {
        if (temp < 0 || temp > 10) {
          erros.push('Temperatura inadequada para produto refrigerado: ' + temp + '°C (deve estar entre 0°C e 10°C)');
        } else if (temp > 8) {
          alertas.push('Temperatura próxima ao limite para refrigerado: ' + temp + '°C');
        }
      }

      if (dadosRecebimento.tipoConservacao === 'CONGELADO') {
        if (temp > -12) {
          erros.push('Temperatura inadequada para produto congelado: ' + temp + '°C (deve estar abaixo de -12°C)');
        } else if (temp > -15) {
          alertas.push('Temperatura próxima ao limite para congelado: ' + temp + '°C');
        }
      }
    } else if (dadosRecebimento.tipoConservacao !== 'AMBIENTE') {
      avisos.push('Temperatura não aferida para produto que requer controle');
    }

    // 3. Validar validade dos produtos
    if (dadosRecebimento.dataValidade) {
      var dataValidade = new Date(dadosRecebimento.dataValidade);
      var hoje = new Date();
      var diasRestantes = Math.floor((dataValidade - hoje) / (1000 * 60 * 60 * 24));

      if (diasRestantes < 0) {
        erros.push('Produto vencido');
      } else if (diasRestantes < 30) {
        alertas.push('Produto com validade inferior a 30 dias (' + diasRestantes + ' dias)');
      } else if (diasRestantes < 60) {
        avisos.push('Produto com validade inferior a 60 dias (' + diasRestantes + ' dias)');
      }
    }

    // 4. Validar embalagem
    if (dadosRecebimento.estadoEmbalagem) {
      if (dadosRecebimento.estadoEmbalagem === 'VIOLADA' ||
          dadosRecebimento.estadoEmbalagem === 'DANIFICADA') {
        erros.push('Embalagem violada ou danificada - produto deve ser recusado');
      }
    }

    // 5. Validar quantidade vs nota fiscal
    if (dadosRecebimento.quantidadeRecebida && dadosRecebimento.quantidadeNF) {
      if (dadosRecebimento.quantidadeRecebida !== dadosRecebimento.quantidadeNF) {
        var diferenca = Math.abs(dadosRecebimento.quantidadeRecebida - dadosRecebimento.quantidadeNF);
        var percentualDiferenca = (diferenca / dadosRecebimento.quantidadeNF) * 100;

        if (percentualDiferenca > 5) {
          erros.push('Divergência significativa entre quantidade recebida e nota fiscal: ' +
                     percentualDiferenca.toFixed(1) + '%');
        } else {
          alertas.push('Pequena divergência entre quantidade recebida e nota fiscal: ' +
                       percentualDiferenca.toFixed(1) + '%');
        }
      }
    }

    // 6. Validar responsável pelo recebimento
    if (!dadosRecebimento.responsavelRecebimento) {
      erros.push('Responsável pelo recebimento não identificado');
    }

    // 7. Validar comissão de recebimento (para valores acima de R$ 10.000)
    if (dadosRecebimento.valorTotal && dadosRecebimento.valorTotal > 10000) {
      if (!dadosRecebimento.comissaoRecebimento || dadosRecebimento.comissaoRecebimento.length < 3) {
        alertas.push('Recebimento acima de R$ 10.000 deve ser feito por Comissão (mínimo 3 membros)');
      }
    }

    return {
      valido: erros.length === 0,
      erros: erros,
      alertas: alertas,
      avisos: avisos,
      recomendacao: erros.length > 0 ? 'RECUSAR' : (alertas.length > 0 ? 'RECEBER_COM_RESSALVAS' : 'RECEBER'),
      score: calcularScoreValidacao(erros, alertas, avisos)
    };
  } catch (error) {
    Logger.log("Erro em validarRecebimentoDF: " + error.message);
    throw error;
  }
}

// ============================================================================
// VALIDAÇÕES DE AGRICULTURA FAMILIAR
// ============================================================================

/**
 * Valida cumprimento da meta de 30% de Agricultura Familiar
 */
function validarAgriculturaFamiliarDF(periodo) {
  try {
    try {
      try {
        var ss = getSS();
        var sheetNF = ss.getSheetByName('Notas_Fiscais');

        if (!sheetNF || sheetNF.getLastRow() <= 1) {
          return {
            valido: false,
            erro: 'Sem dados de notas fiscais para análise',
            percentual: 0,
            meta: 30
          };
        }

        var data = sheetNF.getDataRange().getValues();
        var headers = data[0];

        // Identificar colunas
        var colValor = headers.indexOf('Valor_Total');
        var colTipo = headers.indexOf('Tipo_Fornecedor');
        var colData = headers.indexOf('Data_Emissao');

        if (colValor === -1 || colTipo === -1) {
          return {
            valido: false,
            erro: 'Colunas necessárias não encontradas',
            percentual: 0,
            meta: 30
          };
        }

        var valorTotal = 0;
        var valorAgriculturaFamiliar = 0;

        for (var i = 1; i < data.length; i++) {
          var row = data[i];

          // Filtrar por período se especificado
          if (periodo && colData !== -1) {
            var dataEmissao = new Date(row[colData]);
            var dataInicio = new Date(periodo.inicio);
            var dataFim = new Date(periodo.fim);

            if (dataEmissao < dataInicio || dataEmissao > dataFim) {
              continue;
            }
          }

          var valor = parseFloat(row[colValor]) || 0;
          var tipo = String(row[colTipo]).toUpperCase();

          valorTotal += valor;

          if (tipo.indexOf('AGRICULTURA') >= 0 || tipo.indexOf('FAMILIAR') >= 0 || tipo === 'AF') {
            valorAgriculturaFamiliar += valor;
          }
        }

        var percentual = valorTotal > 0 ? (valorAgriculturaFamiliar / valorTotal) * 100 : 0;
        var meta = 30;
        var valido = percentual >= meta;

        return {
          valido: valido,
          percentual: percentual.toFixed(2),
          meta: meta,
          valorTotal: valorTotal.toFixed(2),
          valorAgriculturaFamiliar: valorAgriculturaFamiliar.toFixed(2),
          diferenca: (percentual - meta).toFixed(2),
          status: valido ? 'CONFORME' : 'NAO_CONFORME',
          mensagem: valido ?
            'Meta de Agricultura Familiar atingida (' + percentual.toFixed(1) + '%)' :
            'Meta de Agricultura Familiar NÃO atingida (' + percentual.toFixed(1) + '% de ' + meta + '%)'
        };

      } catch (e) {
        Logger.log('Erro ao validar Agricultura Familiar: ' + e.message);
        return {
          valido: false,
          erro: e.message,
          percentual: 0,
          meta: 30
        };
      }
    } catch (error) {
      Logger.log("Erro em validarAgriculturaFamiliarDF: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em validarAgriculturaFamiliarDF: " + error.message);
    throw error;
  }
}

// ============================================================================
// VALIDAÇÕES DE CARDÁPIO
// ============================================================================

/**
 * Valida cardápio conforme padrões nutricionais do DF
 */
function validarCardapioDF(dadosCardapio) {
  try {
    // Validar entrada
    if (!dadosCardapio || typeof dadosCardapio !== 'object') {
      Logger.log('ERRO: validarCardapioDF chamada sem dados válidos');
      return {
        valido: false,
        erros: ['Dados de cardápio inválidos ou ausentes'],
        alertas: [],
        avisos: [],
        score: 0
      };
    }

    var erros = [];
    var alertas = [];
    var avisos = [];

    // 1. Validar modalidade de ensino
    if (!dadosCardapio.modalidade) {
      erros.push('Modalidade de ensino obrigatória');
    }

    // 2. Validar número de refeições
    var refeicoesEsperadas = {
      'EDUCACAO_INFANTIL_INTEGRAL': 5,
      'ENSINO_FUNDAMENTAL_INTEGRAL': 3,
      'EDUCACAO_INFANTIL_PARCIAL': 2,
      'ENSINO_FUNDAMENTAL_PARCIAL': 1,
      'ENSINO_MEDIO_PARCIAL': 1
    };

    var esperado = refeicoesEsperadas[dadosCardapio.modalidade];
    if (esperado && dadosCardapio.numeroRefeicoes !== esperado) {
      alertas.push('Número de refeições (' + dadosCardapio.numeroRefeicoes +
                   ') diferente do esperado (' + esperado + ') para ' + dadosCardapio.modalidade);
    }

    // 3. Validar valor per capita
    if (dadosCardapio.valorPerCapita && dadosCardapio.modalidade) {
      var perCapitaEsperado = {
        'CRECHE': 2.00,
        'PRE_ESCOLA': 0.80,
        'FUNDAMENTAL': 0.50,
        'MEDIO': 0.50,
        'INTEGRAL': 2.00
      };

      var esperadoPC = perCapitaEsperado[dadosCardapio.modalidade.split('_')[0]];
      if (esperadoPC && Math.abs(dadosCardapio.valorPerCapita - esperadoPC) > 0.10) {
        alertas.push('Valor per capita (R$ ' + dadosCardapio.valorPerCapita.toFixed(2) +
                     ') diverge do padrão (R$ ' + esperadoPC.toFixed(2) + ')');
      }
    }

    // 4. Validar grupos alimentares
    if (dadosCardapio.gruposAlimentares) {
      var gruposObrigatorios = ['CEREAIS', 'PROTEINAS', 'HORTALICAS', 'FRUTAS'];
      var gruposPresentes = dadosCardapio.gruposAlimentares;

      gruposObrigatorios.forEach(function(grupo) {
        if (gruposPresentes.indexOf(grupo) === -1) {
          avisos.push('Grupo alimentar ' + grupo + ' não presente no cardápio');
        }
      });
    }

    // 5. Validar restrições alimentares
    if (dadosCardapio.alunosRestricoes && dadosCardapio.alunosRestricoes > 0) {
      if (!dadosCardapio.cardapioAlternativo) {
        erros.push('Existem ' + dadosCardapio.alunosRestricoes +
                   ' alunos com restrições mas não há cardápio alternativo');
      }
    }

    return {
      valido: erros.length === 0,
      erros: erros,
      alertas: alertas,
      avisos: avisos,
      score: calcularScoreValidacao(erros, alertas, avisos)
    };
  } catch (error) {
    Logger.log("Erro em validarCardapioDF: " + error.message);
    throw error;
  }
}

// ============================================================================
// VALIDAÇÕES DE PDGP
// ============================================================================

/**
 * Valida PDGP semanal
 */
function validarPDGPSemanal(dadosPDGP) {
  try {
    // Validar entrada
    if (!dadosPDGP || typeof dadosPDGP !== 'object') {
      Logger.log('ERRO: validarPDGPSemanal chamada sem dados válidos');
      return {
        valido: false,
        erros: ['Dados de PDGP inválidos ou ausentes'],
        alertas: [],
        avisos: [],
        score: 0
      };
    }

    var erros = [];
    var alertas = [];
    var avisos = [];

    // 1. Validar dia da semana (segunda-feira é padrão)
    if (dadosPDGP.dataEntrega) {
      var data = new Date(dadosPDGP.dataEntrega);
      var diaSemana = data.getDay();

      if (diaSemana !== 1) {
        var diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        alertas.push('PDGP programado para ' + diasSemana[diaSemana] +
                     '. Padrão é Segunda-feira');
      }
    }

    // 2. Validar horário
    if (dadosPDGP.horarioEntrega) {
      var hora = parseInt(dadosPDGP.horarioEntrega.split(':')[0]);
      if (hora < 6 || hora > 10) {
        alertas.push('Horário de entrega fora do padrão (06:00 às 10:00)');
      }
    }

    // 3. Validar produtos perecíveis
    if (dadosPDGP.produtos) {
      var produtosNaoPerec = [];
      dadosPDGP.produtos.forEach(function(produto) {
        var produtoLower = produto.toLowerCase();
        var ehPerecivel = ['pão', 'leite', 'carne', 'frango', 'fruta', 'verdura', 'legume', 'iogurte']
          .some(function(p) { return produtoLower.indexOf(p) >= 0; });

        if (!ehPerecivel) {
          produtosNaoPerec.push(produto);
        }
      });

      if (produtosNaoPerec.length > 0) {
        avisos.push('Produtos não perecíveis no PDGP: ' + produtosNaoPerec.join(', '));
      }
    }

    // 4. Validar frequência (deve ser semanal)
    if (dadosPDGP.ultimaEntrega) {
      var ultimaEntrega = new Date(dadosPDGP.ultimaEntrega);
      var proximaEntrega = new Date(dadosPDGP.dataEntrega);
      var diasDiferenca = Math.floor((proximaEntrega - ultimaEntrega) / (1000 * 60 * 60 * 24));

      if (diasDiferenca < 6 || diasDiferenca > 8) {
        alertas.push('Intervalo entre entregas (' + diasDiferenca + ' dias) fora do padrão semanal');
      }
    }

    return {
      valido: erros.length === 0,
      erros: erros,
      alertas: alertas,
      avisos: avisos,
      score: calcularScoreValidacao(erros, alertas, avisos)
    };
  } catch (error) {
    Logger.log("Erro em validarPDGPSemanal: " + error.message);
    throw error;
  }
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Calcula score de validação (0-100)
 */
function calcularScoreValidacao(erros, alertas, avisos) {
  // Garante que são arrays
  var errosArr = Array.isArray(erros) ? erros : [];
  var alertasArr = Array.isArray(alertas) ? alertas : [];
  var avisosArr = Array.isArray(avisos) ? avisos : [];

  var score = 100;
  score -= errosArr.length * 20;
  score -= alertasArr.length * 10;
  score -= avisosArr.length * 5;
  return Math.max(0, score);
}

/**
 * Valida múltiplos aspectos de uma operação
 */
function validarOperacaoCompleta(dados) {
  try {
    // Validar entrada
    if (!dados || typeof dados !== 'object') {
      Logger.log('ERRO: validarOperacaoCompleta chamada sem dados válidos');
      return {
        notaFiscal: null,
        recebimento: null,
        cardapio: null,
        pdgp: null,
        agriculturaFamiliar: null,
        scoreGeral: 0,
        validoGeral: false,
        erro: 'Dados de entrada inválidos ou ausentes'
      };
    }

    var resultados = {
      notaFiscal: null,
      recebimento: null,
      cardapio: null,
      pdgp: null,
      agriculturaFamiliar: null,
      scoreGeral: 0,
      validoGeral: true
    };

    // Validar nota fiscal
    if (dados.notaFiscal) {
      resultados.notaFiscal = validarNotaFiscalDF(dados.notaFiscal);
      if (!resultados.notaFiscal.valido) {
        resultados.validoGeral = false;
      }
    }

    // Validar recebimento
    if (dados.recebimento) {
      resultados.recebimento = validarRecebimentoDF(dados.recebimento);
      if (!resultados.recebimento.valido) {
        resultados.validoGeral = false;
      }
    }

    // Validar cardápio
    if (dados.cardapio) {
      resultados.cardapio = validarCardapioDF(dados.cardapio);
      if (!resultados.cardapio.valido) {
        resultados.validoGeral = false;
      }
    }

    // Validar PDGP
    if (dados.pdgp) {
      resultados.pdgp = validarPDGPSemanal(dados.pdgp);
      if (!resultados.pdgp.valido) {
        resultados.validoGeral = false;
      }
    }

    // Calcular score geral
    var scores = [];
    if (resultados.notaFiscal) scores.push(resultados.notaFiscal.score);
    if (resultados.recebimento) scores.push(resultados.recebimento.score);
    if (resultados.cardapio) scores.push(resultados.cardapio.score);
    if (resultados.pdgp) scores.push(resultados.pdgp.score);

    if (scores.length > 0) {
      resultados.scoreGeral = scores.reduce(function(a, b) { return a + b; }) / scores.length;
    }

    return resultados;
  } catch (error) {
    Logger.log("Erro em validarOperacaoCompleta: " + error.message);
    throw error;
  }
}

/**
 * Registra validações no sistema
 */
function registrarValidacoesDF() {
  Logger.log('✅ Validações específicas do DF carregadas');
  Logger.log('   - Validação de NF-e SEFAZ-DF');
  Logger.log('   - Validação de recebimento com controle de temperatura');
  Logger.log('   - Validação de Agricultura Familiar (30%)');
  Logger.log('   - Validação de cardápios nutricionais');
  Logger.log('   - Validação de PDGP semanal');
}
