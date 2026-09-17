/**
 * @fileoverview Validações de Regras de Negócio
 * @version 1.0.0
 * @description Funções de validação para garantir integridade dos dados
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-26
 */

'use strict';

// ============================================================================
// VALIDADORES DE REGRAS DE NEGÓCIO
// ============================================================================

var ValidadorNegocio = {
  
  /**
   * Valida integridade financeira de uma análise
   * REGRA: valorAprovado + valorGlosa = valorNF
   */
  validarIntegridadeFinanceira: function(analise) {
    try {
      var valorNF = Number(analise.valorNF) || 0;
      var valorGlosa = Number(analise.valorGlosa) || 0;
      var valorAprovado = Number(analise.valorAprovado) || 0;
    
      var soma = valorAprovado + valorGlosa;
      var diferenca = Math.abs(soma - valorNF);
    
      return {
        valido: diferenca < 0.01,
        mensagem: diferenca < 0.01 
          ? 'OK' 
          : 'Erro: ' + valorAprovado + ' + ' + valorGlosa + ' = ' + soma + ' ≠ ' + valorNF,
        diferenca: diferenca
      };
    } catch (error) {
      Logger.log("Erro em validarIntegridadeFinanceira: " + error.message);
      throw error;
    }
  },
  
  /**
   * Valida que soma dos recebimentos não excede quantidade da NF
   */
  validarSomaRecebimentos: function(nf, recebimentos) {
    try {
      var qtdNF = Number(nf.quantidade) || 0;
      var somaRecebimentos = recebimentos.reduce(function(acc, r) {
        return acc + (Number(r.qtdRecebida) || 0);
      }, 0);
    
      return {
        valido: somaRecebimentos <= qtdNF,
        mensagem: somaRecebimentos <= qtdNF
          ? 'OK'
          : 'Erro: Soma recebimentos (' + somaRecebimentos + ') > NF (' + qtdNF + ')',
        somaRecebimentos: somaRecebimentos,
        qtdNF: qtdNF
      };
    } catch (error) {
      Logger.log("Erro em validarSomaRecebimentos: " + error.message);
      throw error;
    }
  },
  
  /**
   * Valida saldo de empenho
   */
  validarSaldoEmpenho: function(valorAprovado, empenho) {
    try {
      var saldo = Number(empenho.saldo) || 0;
      var valor = Number(valorAprovado) || 0;
    
      return {
        valido: valor <= saldo,
        mensagem: valor <= saldo
          ? 'OK'
          : 'Erro: Valor aprovado (' + valor + ') > Saldo empenho (' + saldo + ')',
        saldoRestante: saldo - valor
      };
    } catch (error) {
      Logger.log("Erro em validarSaldoEmpenho: " + error.message);
      throw error;
    }
  },
  
  /**
   * Valida temperatura de produtos refrigerados
   */
  validarTemperatura: function(temperatura, tipoProduto) {
    try {
      var limites = {
        'REFRIGERADO': 10,
        'CONGELADO': -12,
        'AMBIENTE': 30
      };
    
      var limite = limites[tipoProduto] || 30;
      var temp = Number(temperatura) || 0;
    
      return {
        valido: temp <= limite,
        mensagem: temp <= limite
          ? 'OK'
          : 'Erro: Temperatura (' + temp + '°C) > Limite (' + limite + '°C)',
        temperatura: temp,
        limite: limite
      };
    } catch (error) {
      Logger.log("Erro em validarTemperatura: " + error.message);
      throw error;
    }
  },
  
  /**
   * Valida validade mínima do produto
   */
  validarValidade: function(dataValidade, diasMinimos) {
    diasMinimos = diasMinimos || 30;
    
    var hoje = new Date();
    var validade = new Date(dataValidade);
    var diasRestantes = Math.floor((validade - hoje) / (1000 * 60 * 60 * 24));
    
    return {
      valido: diasRestantes >= diasMinimos,
      mensagem: diasRestantes >= diasMinimos
        ? 'OK'
        : 'Aviso: Produto vence em ' + diasRestantes + ' dias (mínimo: ' + diasMinimos + ')',
      diasRestantes: diasRestantes
    };
  },
  
  /**
   * Valida que glosa tem justificativa
   */
  validarJustificativaGlosa: function(valorGlosa, justificativa) {
    try {
      var temGlosa = Number(valorGlosa) > 0;
      var temJustificativa = justificativa && justificativa.trim().length > 10;
    
      return {
        valido: !temGlosa || temJustificativa,
        mensagem: !temGlosa 
          ? 'OK (sem glosa)'
          : temJustificativa 
            ? 'OK'
            : 'Erro: Glosa de R$ ' + valorGlosa + ' sem justificativa adequada'
      };
    } catch (error) {
      Logger.log("Erro em validarJustificativaGlosa: " + error.message);
      throw error;
    }
  },
  
  /**
   * Valida comissão de recebimento
   */
  validarComissao: function(membros) {
    try {
      var qtd = Array.isArray(membros) ? membros.length : 
                typeof membros === 'string' ? membros.split(',').length : 0;
    
      return {
        valido: qtd >= 3,
        mensagem: qtd >= 3
          ? 'OK (' + qtd + ' membros)'
          : 'Erro: Comissão com ' + qtd + ' membros (mínimo: 3)',
        qtdMembros: qtd
      };
    } catch (error) {
      Logger.log("Erro em validarComissao: " + error.message);
      throw error;
    }
  },

  /**
   * Valida status de fornecedor
   */
  validarFornecedor: function(fornecedor) {
    var statusValidos = ['ATIVO', 'APROVADO'];
    var status = fornecedor.status || '';
    
    return {
      valido: statusValidos.indexOf(status) !== -1,
      mensagem: statusValidos.indexOf(status) !== -1
        ? 'OK'
        : 'Erro: Fornecedor com status ' + status + ' (deve ser ATIVO)',
      status: status
    };
  },
  
  /**
   * Valida data de recebimento vs emissão
   */
  validarDatasRecebimento: function(dataEmissao, dataRecebimento) {
    var emissao = new Date(dataEmissao);
    var recebimento = new Date(dataRecebimento);
    
    return {
      valido: recebimento >= emissao,
      mensagem: recebimento >= emissao
        ? 'OK'
        : 'Erro: Data recebimento anterior à emissão da NF',
      diasDiferenca: Math.floor((recebimento - emissao) / (1000 * 60 * 60 * 24))
    };
  },
  
  /**
   * Executa todas as validações em uma análise
   */
  validarAnaliseCompleta: function(analise, nf, recebimentos, empenho) {
    try {
      var resultados = {
        valido: true,
        erros: [],
        avisos: []
      };
    
      // 1. Integridade financeira
      var r1 = this.validarIntegridadeFinanceira(analise);
      if (!r1.valido) {
        resultados.valido = false;
        resultados.erros.push(r1.mensagem);
      }
    
      // 2. Soma recebimentos
      if (nf && recebimentos) {
        var r2 = this.validarSomaRecebimentos(nf, recebimentos);
        if (!r2.valido) {
          resultados.valido = false;
          resultados.erros.push(r2.mensagem);
        }
      }
    
      // 3. Saldo empenho
      if (empenho) {
        var r3 = this.validarSaldoEmpenho(analise.valorAprovado, empenho);
        if (!r3.valido) {
          resultados.valido = false;
          resultados.erros.push(r3.mensagem);
        }
      }
    
      // 4. Justificativa de glosa
      var r4 = this.validarJustificativaGlosa(analise.valorGlosa, analise.justificativa);
      if (!r4.valido) {
        resultados.valido = false;
        resultados.erros.push(r4.mensagem);
      }
    
      // 5. Comissão
      var r5 = this.validarComissao(analise.membrosComissao);
      if (!r5.valido) {
        resultados.valido = false;
        resultados.erros.push(r5.mensagem);
      }
    
      return resultados;
    } catch (error) {
      Logger.log("Erro em validarAnaliseCompleta: " + error.message);
      throw error;
    }
  }
};

// ============================================================================
// FUNÇÕES DE TESTE DAS VALIDAÇÕES
// ============================================================================

/**
 * Testa todas as validações com dados de exemplo
 */
function testarValidacoes() {
  Logger.log('');
  Logger.log('╔═══════════════════════════════════════════════════════════════════╗');
  Logger.log('║     TESTE DAS VALIDAÇÕES DE NEGÓCIO                              ║');
  Logger.log('╚═══════════════════════════════════════════════════════════════════╝');
  Logger.log('');
  
  var testes = 0;
  var passou = 0;
  
  // Teste 1: Integridade financeira válida
  testes++;
  var r1 = ValidadorNegocio.validarIntegridadeFinanceira({
    valorNF: 1000.00,
    valorGlosa: 100.00,
    valorAprovado: 900.00
  });
  if (r1.valido) { passou++; Logger.log('✅ Teste 1: Integridade financeira válida'); }
  else { Logger.log('❌ Teste 1: ' + r1.mensagem); }
  
  // Teste 2: Integridade financeira inválida
  testes++;
  var r2 = ValidadorNegocio.validarIntegridadeFinanceira({
    valorNF: 1000.00,
    valorGlosa: 100.00,
    valorAprovado: 800.00  // Erro: 800 + 100 = 900 ≠ 1000
  });
  if (!r2.valido) { passou++; Logger.log('✅ Teste 2: Detectou integridade inválida'); }
  else { Logger.log('❌ Teste 2: Não detectou erro'); }
  
  // Teste 3: Soma recebimentos válida
  testes++;
  var r3 = ValidadorNegocio.validarSomaRecebimentos(
    { quantidade: 100 },
    [{ qtdRecebida: 60 }, { qtdRecebida: 40 }]
  );
  if (r3.valido) { passou++; Logger.log('✅ Teste 3: Soma recebimentos válida'); }
  else { Logger.log('❌ Teste 3: ' + r3.mensagem); }
  
  // Teste 4: Soma recebimentos excede
  testes++;
  var r4 = ValidadorNegocio.validarSomaRecebimentos(
    { quantidade: 100 },
    [{ qtdRecebida: 60 }, { qtdRecebida: 50 }]  // 110 > 100
  );
  if (!r4.valido) { passou++; Logger.log('✅ Teste 4: Detectou soma excedente'); }
  else { Logger.log('❌ Teste 4: Não detectou erro'); }
  
  // Teste 5: Temperatura válida
  testes++;
  var r5 = ValidadorNegocio.validarTemperatura(8, 'REFRIGERADO');
  if (r5.valido) { passou++; Logger.log('✅ Teste 5: Temperatura válida'); }
  else { Logger.log('❌ Teste 5: ' + r5.mensagem); }
  
  // Teste 6: Temperatura inválida
  testes++;
  var r6 = ValidadorNegocio.validarTemperatura(22, 'REFRIGERADO');
  if (!r6.valido) { passou++; Logger.log('✅ Teste 6: Detectou temperatura inválida'); }
  else { Logger.log('❌ Teste 6: Não detectou erro'); }
  
  // Teste 7: Glosa com justificativa
  testes++;
  var r7 = ValidadorNegocio.validarJustificativaGlosa(100, 'Produto com embalagem danificada');
  if (r7.valido) { passou++; Logger.log('✅ Teste 7: Glosa com justificativa'); }
  else { Logger.log('❌ Teste 7: ' + r7.mensagem); }
  
  // Teste 8: Glosa sem justificativa
  testes++;
  var r8 = ValidadorNegocio.validarJustificativaGlosa(100, '');
  if (!r8.valido) { passou++; Logger.log('✅ Teste 8: Detectou glosa sem justificativa'); }
  else { Logger.log('❌ Teste 8: Não detectou erro'); }
  
  // Teste 9: Comissão válida
  testes++;
  var r9 = ValidadorNegocio.validarComissao(['Ana', 'Carlos', 'Maria']);
  if (r9.valido) { passou++; Logger.log('✅ Teste 9: Comissão válida'); }
  else { Logger.log('❌ Teste 9: ' + r9.mensagem); }
  
  // Teste 10: Comissão inválida
  testes++;
  var r10 = ValidadorNegocio.validarComissao(['Ana', 'Carlos']);
  if (!r10.valido) { passou++; Logger.log('✅ Teste 10: Detectou comissão insuficiente'); }
  else { Logger.log('❌ Teste 10: Não detectou erro'); }
  
  Logger.log('');
  Logger.log('═══════════════════════════════════════════════════════════════════');
  Logger.log('  RESULTADO: ' + passou + '/' + testes + ' testes passaram');
  Logger.log('═══════════════════════════════════════════════════════════════════');
  
  return { total: testes, passou: passou, falhou: testes - passou };
}

// Expõe globalmente
var validarIntegridadeFinanceira = ValidadorNegocio.validarIntegridadeFinanceira.bind(ValidadorNegocio);
var validarSomaRecebimentos = ValidadorNegocio.validarSomaRecebimentos.bind(ValidadorNegocio);
var validarAnaliseCompleta = ValidadorNegocio.validarAnaliseCompleta.bind(ValidadorNegocio);
