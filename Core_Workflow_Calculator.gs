/**
 * @fileoverview Core_Workflow_Calculator.gs
 * Módulo de Lógica de Domínio para Cálculos (Pure Functions)
 * 
 * Responsável por toda a lógica matemática e validação contábil do workflow.
 * Não possui dependências de serviços externos (Sheets, Drive, etc).
 * 
 * INTERVENÇÃO 2/4: Extração de Domínio
 * @version 1.0.0
 */

var WorkflowCalculator = (function() {
  
  'use strict';
  
  // ============================================================================
  // FUNÇÕES PRIVADAS (LOGIC CORE)
  // ============================================================================
  
  /**
   * Arredonda valores para 2 casas decimais para consistência financeira
   */
  function _round(value) {
    return Math.round(value * 100) / 100;
  }
  
  /**
   * Calcula percentual com proteção contra divisão por zero
   */
  function _calcPercent(numerator, denominator) {
    if (!denominator || denominator === 0) return 0;
    return Math.round((numerator / denominator) * 10000) / 100;
  }
  
  // ============================================================================
  // API PÚBLICA
  // ============================================================================
  
  return {
    
    /**
     * Calcula valores contábeis de uma NF com base nos recebimentos
     * @param {number} qtdNF - Quantidade na NF
     * @param {number} qtdRecebida - Quantidade total recebida
     * @param {number} valorUnitario - Valor unitário do produto
     * @returns {Object} Valores calculados
     */
    calculateAccountingValues: function(qtdNF, qtdRecebida, valorUnitario) {
      try {
        // Garantir números
        qtdNF = Number(qtdNF) || 0;
        qtdRecebida = Number(qtdRecebida) || 0;
        valorUnitario = Number(valorUnitario) || 0;
      
        var valorNF = qtdNF * valorUnitario;
        var diferenca = Math.max(0, qtdNF - qtdRecebida);
        var valorGlosa = diferenca * valorUnitario;
        var valorAprovado = valorNF - valorGlosa;
      
        // Arredondar valores monetários
        valorNF = _round(valorNF);
        valorGlosa = _round(valorGlosa);
        valorAprovado = _round(valorAprovado);
      
        // Validação de integridade matemática
        var somaCalculada = _round(valorAprovado + valorGlosa);
        var diff = Math.abs(somaCalculada - valorNF);
        var valido = diff < 0.01;
      
        return {
          qtdNF: qtdNF,
          qtdRecebida: qtdRecebida,
          diferenca: diferenca,
          valorNF: valorNF,
          valorGlosa: valorGlosa,
          valorAprovado: valorAprovado,
          percentualGlosa: _calcPercent(valorGlosa, valorNF),
          valido: valido
        };
      } catch (error) {
        Logger.log("Erro em calculateAccountingValues: " + error.message);
        throw error;
      }
    },
    
    /**
     * Valida integridade contábil de um objeto de dados de análise
     * @param {Object} dados - Objeto contendo valores a serem validados
     * @returns {Object} Resultado detalhado da validação
     */
    validateAccountingIntegrity: function(dados) {
      try {
        if (!dados) {
          return { 
            valid: false, 
            errors: ['Dados não fornecidos'], 
            calculated: null 
          };
        }
      
        var erros = [];
      
        // Valores com fallback
        var qtdNF = Number(dados.quantidadeNF) || 0;
        var qtdRec = Number(dados.quantidadeRecebida) || 0;
        var valorNF = Number(dados.valorNF) || 0;
        var valorGlosa = Number(dados.valorGlosa) || 0;
        var valorAprovado = Number(dados.valorAprovado) || 0;
      
        // Inferir unitário se não fornecido
        var valorUnitario = Number(dados.valorUnitario);
        if (!valorUnitario && qtdNF > 0) {
          valorUnitario = valorNF / qtdNF;
        }
      
        // Recalcular para comparar (Source of Truth)
        var calc = this.calculateAccountingValues(qtdNF, qtdRec, valorUnitario);
      
        // 1. Verificar Soma (Aprovado + Glosa = Total)
        var somaInformada = _round(valorAprovado + valorGlosa);
        if (valorNF > 0 && Math.abs(somaInformada - valorNF) > 0.01) {
          erros.push(
            'Inconsistência Contábil: Aprovado (' + valorAprovado + 
            ') + Glosa (' + valorGlosa + ') = ' + somaInformada + 
            ' (Esperado: ' + valorNF + ')'
          );
        }
      
        // 2. Verificar Valores Negativos
        if (valorGlosa < 0) erros.push('Valor de glosa não pode ser negativo');
        if (valorAprovado < 0) erros.push('Valor aprovado não pode ser negativo');
      
        // 3. Verificar Coerência da Decisão
        if (dados.decisao === 'APROVADO_TOTAL' && valorGlosa > 0.01) {
          erros.push('Decisão APROVADO_TOTAL incompatível com glosa > 0');
        }
        if (dados.decisao === 'REJEITADO' && valorAprovado > 0.01) {
          erros.push('Decisão REJEITADO incompatível com valor aprovado > 0');
        }
      
        return {
          valid: erros.length === 0,
          errors: erros,
          calculated: calc
        };
      } catch (error) {
        Logger.log("Erro em validateAccountingIntegrity: " + error.message);
        throw error;
      }
    }
  };
})();
