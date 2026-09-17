/**
 * @fileoverview Setup Completo de Glosas - Dados Sintéticos
 * @version 1.0.0
 * @description Cria dados sintéticos para testar cenários de glosas.
 * 
 * CENÁRIOS COBERTOS:
 * - Glosa por preço divergente
 * - Glosa por quantidade divergente
 * - Glosa por qualidade inadequada
 * - Glosa contratual
 * - Glosa fiscal
 * - Glosa pendente
 * - Glosa aplicada
 * - Glosa contestada
 * - Glosa cancelada
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-19
 */

'use strict';

// ============================================================================
// DADOS SINTÉTICOS DE GLOSAS
// ============================================================================

var GLOSAS_SINTETICAS = [
  {
    id: 'GLO-2025-0001',
    notaFiscalID: 'NF-2025-0004',
    tipoGlosa: 'QUANTIDADE',
    motivo: 'Quantidade entregue inferior à faturada',
    valorGlosado: 840.00,
    dataGlosa: new Date(2025, 11, 14),
    responsavel: 'Ana Paula Costa',
    status: 'APLICADA',
    justificativa: 'NF indica 50 pacotes, recebidos apenas 20. Glosa de 30 pacotes x R$28,00.'
  },
  {
    id: 'GLO-2025-0002',
    notaFiscalID: 'NF-2025-0005',
    tipoGlosa: 'QUALIDADE',
    motivo: 'Produtos com qualidade inadequada',
    valorGlosado: 8750.00,
    dataGlosa: new Date(2025, 11, 14),
    responsavel: 'Carlos Mendes',
    status: 'APLICADA',
    justificativa: 'Recusa total por qualidade. Glosa integral da NF.'
  },
  {
    id: 'GLO-2025-0003',
    notaFiscalID: 'NF-2025-0009',
    tipoGlosa: 'QUANTIDADE',
    motivo: 'Diferença de quantidade verificada na conferência',
    valorGlosado: 1200.00,
    dataGlosa: new Date(2025, 11, 18),
    responsavel: 'Roberto Alves',
    status: 'PENDENTE',
    justificativa: 'Aguardando manifestação do fornecedor.'
  },
  {
    id: 'GLO-2025-0004',
    notaFiscalID: 'NF-2025-0003',
    tipoGlosa: 'PRECO',
    motivo: 'Preço unitário acima do contratado',
    valorGlosado: 420.00,
    dataGlosa: new Date(2025, 11, 12),
    responsavel: 'Fernanda Lima',
    status: 'CONTESTADA',
    justificativa: 'Fornecedor alega reajuste contratual. Em análise.'
  }
];


// Mais dados sintéticos
GLOSAS_SINTETICAS.push(
  {
    id: 'GLO-2025-0005',
    notaFiscalID: 'NF-2025-0007',
    tipoGlosa: 'FISCAL',
    motivo: 'NF cancelada pelo fornecedor',
    valorGlosado: 18200.00,
    dataGlosa: new Date(2025, 11, 16),
    responsavel: 'Patricia Souza',
    status: 'CANCELADA',
    justificativa: 'Glosa cancelada pois NF foi cancelada pelo fornecedor.'
  },
  {
    id: 'GLO-2025-0006',
    notaFiscalID: 'NF-2025-0002',
    tipoGlosa: 'CONTRATUAL',
    motivo: 'Atraso na entrega superior a 24h',
    valorGlosado: 570.00,
    dataGlosa: new Date(2025, 11, 11),
    responsavel: 'João Pedro Oliveira',
    status: 'APLICADA',
    justificativa: 'Multa de 2% por atraso conforme cláusula contratual.'
  }
);

// ============================================================================
// FUNÇÕES DE INICIALIZAÇÃO E VALIDAÇÃO
// ============================================================================

/**
 * Popula a aba Glosas com dados sintéticos
 */
function popularGlosasSinteticas() {
  try {
    try {
      try {
        var startTime = new Date();
        var resultado = { sucesso: false, registrosInseridos: 0, erros: [], tempoExecucao: 0 };
  
        try {
          var ss = getSS();
          var sheetName = 'Glosas';
          var sheet = ss.getSheetByName(sheetName);
    
          if (!sheet) {
            sheet = ss.insertSheet(sheetName);
            Logger.log('Aba ' + sheetName + ' criada.');
          }
    
          var headers = [
            'ID', 'Nota_Fiscal_ID', 'Tipo_Glosa', 'Motivo', 'Valor_Glosado',
            'Data_Glosa', 'Responsavel', 'Status', 'Justificativa'
          ];
    
          sheet.clear();
          sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
          sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    
          var dados = GLOSAS_SINTETICAS.map(function(glo) {
            return [
              glo.id, glo.notaFiscalID, glo.tipoGlosa, glo.motivo, glo.valorGlosado,
              glo.dataGlosa, glo.responsavel, glo.status, glo.justificativa
            ];
          });
    
          if (dados.length > 0) {
            sheet.getRange(2, 1, dados.length, headers.length).setValues(dados);
            resultado.registrosInseridos = dados.length;
          }
    
          resultado.sucesso = true;
          resultado.tempoExecucao = new Date() - startTime;
          Logger.log('✅ Glosas populadas: ' + resultado.registrosInseridos + ' registros');
    
        } catch (e) {
          resultado.erros.push(e.message);
          Logger.log('❌ Erro: ' + e.message);
        }
  
        return resultado;
      } catch (error) {
        Logger.log("Erro em popularGlosasSinteticas: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em popularGlosasSinteticas: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em popularGlosasSinteticas: " + error.message);
    throw error;
  }
}

/**
 * Valida a estrutura e dados da aba Glosas
 */
function validarGlosas() {
  try {
    var resultado = { valido: true, totalRegistros: 0, porStatus: {}, porTipo: {}, valorTotalGlosado: 0, erros: [], avisos: [] };
  
    try {
      var ss = getSS();
      var sheet = ss.getSheetByName('Glosas');
    
      if (!sheet) {
        resultado.valido = false;
        resultado.erros.push('Aba Glosas não encontrada');
        return resultado;
      }
    
      var dados = sheet.getDataRange().getValues();
      resultado.totalRegistros = Math.max(0, dados.length - 1);
    
      var headers = dados[0];
      var statusIndex = headers.indexOf('Status');
      var tipoIndex = headers.indexOf('Tipo_Glosa');
      var valorIndex = headers.indexOf('Valor_Glosado');
    
      for (var i = 1; i < dados.length; i++) {
        var status = dados[i][statusIndex] || 'SEM_STATUS';
        var tipo = dados[i][tipoIndex] || 'SEM_TIPO';
        resultado.porStatus[status] = (resultado.porStatus[status] || 0) + 1;
        resultado.porTipo[tipo] = (resultado.porTipo[tipo] || 0) + 1;
      
        if (valorIndex >= 0 && status === 'APLICADA') {
          resultado.valorTotalGlosado += parseFloat(dados[i][valorIndex]) || 0;
        }
      }
    
      Logger.log('✅ Validação Glosas: ' + resultado.totalRegistros + ' registros');
      Logger.log('   Valor total glosado (aplicadas): R$ ' + resultado.valorTotalGlosado.toFixed(2));
    
    } catch (e) {
      resultado.valido = false;
      resultado.erros.push(e.message);
    }
  
    return resultado;
  } catch (error) {
    Logger.log("Erro em validarGlosas: " + error.message);
    throw error;
  }
}

/**
 * Executa setup completo de Glosas
 */
function setupGlosasCompleto() {
  Logger.log('=== SETUP GLOSAS COMPLETO ===');
  return { popular: popularGlosasSinteticas(), validar: validarGlosas() };
}
