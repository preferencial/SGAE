/**
 * @fileoverview Core_Validator_Empenho.gs
 * Módulo de validação de Notas de Empenho.
 * @version 1.0.0
 */

'use strict';

var EmpenhoValidator = (function() {

  /**
   * VALIDAR FORMATO DA NOTA DE EMPENHO
   */
  function validarFormatoNE(notaEmpenho) {
    // Simulação de validação de formato NE
    // Formato típico : AAAA/NNNNN (ano/número)
    var formatoNE = /^\d{4}\/\d{4,6}$/;
    return formatoNE.test(notaEmpenho) || /^\d{6,10}$/.test(notaEmpenho);
  }

  /**
   * SIMULAR CONSULTA AO SALDO DA NOTA DE EMPENHO
   */
  function simularConsultaSaldoNE(notaEmpenho, valorNecessario) {
    // Simulação de consulta ao SIG/Sistema de Empenhos
    // Em produção, aqui seria feita uma consulta real ao sistema

    var saldoSimulado = Math.random() * 50000 + 10000; // Simula saldo entre R$ 10k e R$ 60k;

    return {
      notaEmpenho: notaEmpenho,
      disponivel: saldoSimulado,
      necessario: valorNecessario,
      suficiente: saldoSimulado >= valorNecessario,
      percentualUtilizado: ((valorNecessario / saldoSimulado) * 100).toFixed(2)
    };
  }

  /**
   * VALIDAR NF CONTRA NOTA DE EMPENHO
   */
  function validarNFcontraNE(nf, linha) {
    try {
      var validacao = {
        numeroNF: nf.numero,
        linha: linha,
        conforme: true,
        problemas: [],
        verificacoes: []
      };

      // Verificação 1 : Nota de Empenho informada
      if (!nf.notaEmpenho) {
        validacao.conforme = false;
        validacao.problemas.push({
          tipo: 'ne_ausente',
          linha: linha,
          descricao: 'Nota de Empenho não informada'
        });
      } else {
        validacao.verificacoes.push('✅ NE informada : ' + nf.notaEmpenho);

        // Verificação 2 : Formato da NE (simulação de validação SIG)
        if (!validarFormatoNE(nf.notaEmpenho)) {
          validacao.conforme = false;
          validacao.problemas.push({
            tipo: 'ne_formato_invalido',
            linha: linha,
            descricao: 'Formato da NE inválido : ' + nf.notaEmpenho
          });
        } else {
          validacao.verificacoes.push('✅ Formato NE válido');
        }
      }

      // Verificação 3 : Valor da NF
      if (nf.valorTotal <= 0) {
        validacao.conforme = false;
        validacao.problemas.push({
          tipo: 'valor_invalido',
          linha: linha,
          descricao: 'Valor da NF inválido, R$ ' + nf.valorTotal
        });
      } else {
        validacao.verificacoes.push('✅ Valor válido : R$ ' + nf.valorTotal.toFixed(2));

        // Verificação 4 : Simulação de consulta ao saldo da NE
        var saldoNE = simularConsultaSaldoNE(nf.notaEmpenho, nf.valorTotal);
        if (!saldoNE.suficiente) {
          validacao.conforme = false;
          validacao.problemas.push({
            tipo: 'saldo_insuficiente',
            linha: linha,
            descricao: 'Saldo insuficiente na NE. Disponível, R$ ' + saldoNE.disponivel + ', Necessário : R$ ' + nf.valorTotal
          });
        } else {
          validacao.verificacoes.push('✅ Saldo suficiente na NE');
        }
      }

      // Verificação 5 : Data de emissão
      if (nf.dataEmissao) {
        try {
          var dataEmissao = new Date(nf.dataEmissao);
          var hoje = new Date();
          var diasDiferenca = Math.floor((hoje - dataEmissao) / (1000 * 60 * 60 * 24));

          if (diasDiferenca > 30) {
            validacao.problemas.push({
              tipo: 'nf_antiga',
              linha: linha,
              descricao: 'NF emitida há ' + diasDiferenca + ' dias (> 30 dias)'
            });
          } else {
            validacao.verificacoes.push('✅ Data de emissão recente');
          }
        } catch (e) {
          validacao.conforme = false;
          validacao.problemas.push({
            tipo: 'data_invalida',
            linha: linha,
            descricao: 'Data de emissão inválida'
          });
        }
      }

      // Verificação 6 : Status da NF
      var statusValidos = ['Recebida', 'Conferida', 'Atestada'];
      if (nf.status && statusValidos.indexOf(nf.status) == -1) {
        validacao.problemas.push({
          tipo: 'status_atencao',
          linha: linha,
          descricao: 'Status requer atenção : ' + nf.status
        });
      } else if (nf.status) {
        validacao.verificacoes.push('✅ Status adequado : ' + nf.status);
      }

      return validacao;
    } catch (error) {
      Logger.log("Erro em validarNFcontraNE: " + error.message);
      throw error;
    }
  }

  /**
   * EXECUTAR VALIDAÇÃO DE NOTAS DE EMPENHO
   */
  function executarValidacaoNE() {
    try {
      var nfData = getSheetData('Notas_Fiscais', 1000);
      var validacoes = [];
      var problemas = [];
      var conformes = 0;

      if (!nfData.data || nfData.data.length == 0) {
        return {
          validacoes: [],
          problemas: [{tipo: 'dados_ausentes', descricao: 'Nenhuma NF encontrada para validação'}],
          conformes: 0,
          total: 0,
          percentualConformidade: 0
        };
      }

      nfData.data.forEach(function(row, index) {
        try {
          var nf = {
            numero: row[1] || '', // Numero_NF
            dataEmissao: row[3] || '', // Data_Emissao
            fornecedor: row[6] || '', // Fornecedor_Nome
            notaEmpenho: row[7] || '', // Nota_Empenho
            valorTotal: Number(row[8]) || 0, // Valor_Total
            status: row[9] || '' // Status_NF
          };

          var validacao = validarNFcontraNE(nf, index + 2);
          validacoes.push(validacao);

          if (validacao.conforme) {
            conformes++;
          } else {
            problemas = problemas.concat(validacao.problemas);
          }

        } catch (e) {
          problemas.push({
            tipo: 'erro_processamento',
            linha: index + 2,
            descricao: 'Erro ao processar linha : ' + e.message
          });
        }
      });

      return {
        validacoes: validacoes,
        problemas: problemas,
        conformes: conformes,
        total: validacoes.length,
        percentualConformidade: validacoes.length > 0 ? (conformes / validacoes.length * 100).toFixed(2) : 0
      };
    } catch (error) {
      Logger.log("Erro em executarValidacaoNE: " + error.message);
      throw error;
    }
  }

  // Public API
  return {
    validarFormatoNE: validarFormatoNE,
    simularConsultaSaldoNE: simularConsultaSaldoNE,
    validarNFcontraNE: validarNFcontraNE,
    executarValidacaoNE: executarValidacaoNE
  };

})();
