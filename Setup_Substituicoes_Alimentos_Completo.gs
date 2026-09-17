/**
 * @fileoverview Setup Completo de Substituições de Alimentos - Dados Sintéticos
 * @version 1.0.0
 * @description Cria dados sintéticos para testar cenários de substituições.
 * 
 * CENÁRIOS COBERTOS:
 * - Substituição aprovada
 * - Substituição rejeitada
 * - Substituição pendente
 * - Substituição por falta de produto
 * - Substituição por restrição alimentar
 * - Equivalência nutricional total/parcial
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-19
 */

'use strict';

// ============================================================================
// DADOS SINTÉTICOS DE SUBSTITUIÇÕES DE ALIMENTOS
// ============================================================================

var SUBSTITUICOES_ALIMENTOS_SINTETICAS = [
  {
    id: 'SUB-2025-0001',
    dataSolicitacao: new Date(2025, 11, 10),
    escola: 'EC 308 Sul',
    produtoOriginal: 'Leite Integral UHT 1L',
    produtoSubstituto: 'Bebida Vegetal de Aveia 1L',
    motivo: 'Aluno com APLV',
    solicitante: 'Maria Silva Santos',
    nutricionistaAvaliador: 'Dra. Ana Nutricionista',
    dataAvaliacao: new Date(2025, 11, 10),
    parecerNutricional: 'Substituição adequada para aluno com APLV.',
    equivalenciaNutricional: 'PARCIAL',
    status: 'APROVADO',
    observacoes: 'Complementar com fonte de cálcio.',
    dataCriacao: new Date(2025, 11, 10),
    dataAtualizacao: new Date(2025, 11, 10)
  },
  {
    id: 'SUB-2025-0002',
    dataSolicitacao: new Date(2025, 11, 12),
    escola: 'CEF 01 Taguatinga',
    produtoOriginal: 'Pão Francês 50g',
    produtoSubstituto: 'Tapioca 50g',
    motivo: 'Aluno celíaco',
    solicitante: 'João Pedro Oliveira',
    nutricionistaAvaliador: 'Dra. Ana Nutricionista',
    dataAvaliacao: new Date(2025, 11, 12),
    parecerNutricional: 'Substituição aprovada. Tapioca é isenta de glúten.',
    equivalenciaNutricional: 'SIM',
    status: 'APROVADO',
    observacoes: '',
    dataCriacao: new Date(2025, 11, 12),
    dataAtualizacao: new Date(2025, 11, 12)
  },
  {
    id: 'SUB-2025-0003',
    dataSolicitacao: new Date(2025, 11, 15),
    escola: 'EC 05 Ceilândia',
    produtoOriginal: 'Maçã Fuji',
    produtoSubstituto: 'Banana Prata',
    motivo: 'Falta de produto no fornecedor',
    solicitante: 'Ana Paula Costa',
    nutricionistaAvaliador: '',
    dataAvaliacao: null,
    parecerNutricional: '',
    equivalenciaNutricional: '',
    status: 'PENDENTE',
    observacoes: 'Aguardando avaliação nutricional.',
    dataCriacao: new Date(2025, 11, 15),
    dataAtualizacao: new Date(2025, 11, 15)
  }
];


// Mais dados sintéticos
SUBSTITUICOES_ALIMENTOS_SINTETICAS.push(
  {
    id: 'SUB-2025-0004',
    dataSolicitacao: new Date(2025, 11, 16),
    escola: 'CED 01 Samambaia',
    produtoOriginal: 'Iogurte Natural 170g',
    produtoSubstituto: 'Fruta (Banana)',
    motivo: 'Produto vencido - não substituído pelo fornecedor',
    solicitante: 'Carlos Mendes',
    nutricionistaAvaliador: 'Dra. Ana Nutricionista',
    dataAvaliacao: new Date(2025, 11, 16),
    parecerNutricional: 'Substituição emergencial aprovada.',
    equivalenciaNutricional: 'PARCIAL',
    status: 'APROVADO',
    observacoes: 'Substituição temporária até reposição.',
    dataCriacao: new Date(2025, 11, 16),
    dataAtualizacao: new Date(2025, 11, 16)
  },
  {
    id: 'SUB-2025-0005',
    dataSolicitacao: new Date(2025, 11, 17),
    escola: 'EC 10 Sobradinho',
    produtoOriginal: 'Feijão Carioca',
    produtoSubstituto: 'Feijão Preto',
    motivo: 'Lote recusado por presença de pragas',
    solicitante: 'Lucia Ferreira',
    nutricionistaAvaliador: 'Dra. Ana Nutricionista',
    dataAvaliacao: new Date(2025, 11, 17),
    parecerNutricional: 'Feijão preto é equivalente nutricionalmente.',
    equivalenciaNutricional: 'SIM',
    status: 'APROVADO',
    observacoes: '',
    dataCriacao: new Date(2025, 11, 17),
    dataAtualizacao: new Date(2025, 11, 17)
  },
  {
    id: 'SUB-2025-0006',
    dataSolicitacao: new Date(2025, 11, 18),
    escola: 'CEF 04 Planaltina',
    produtoOriginal: 'Carne Bovina Moída',
    produtoSubstituto: 'Frango Desfiado',
    motivo: 'Falta de produto no fornecedor',
    solicitante: 'Eduardo Santos',
    nutricionistaAvaliador: '',
    dataAvaliacao: null,
    parecerNutricional: '',
    equivalenciaNutricional: '',
    status: 'REJEITADO',
    observacoes: 'Substituição não autorizada. Aguardar reposição.',
    dataCriacao: new Date(2025, 11, 18),
    dataAtualizacao: new Date(2025, 11, 18)
  }
);

// ============================================================================
// FUNÇÕES DE INICIALIZAÇÃO E VALIDAÇÃO
// ============================================================================

/**
 * Popula a aba Substituicoes_Alimentos com dados sintéticos
 */
function popularSubstituicoesAlimentos() {
  try {
    try {
      try {
        var startTime = new Date();
        var resultado = { sucesso: false, registrosInseridos: 0, erros: [], tempoExecucao: 0 };
  
        try {
          var ss = getSS();
          var sheetName = 'Substituicoes_Alimentos';
          var sheet = ss.getSheetByName(sheetName);
    
          if (!sheet) {
            sheet = ss.insertSheet(sheetName);
            Logger.log('Aba ' + sheetName + ' criada.');
          }
    
          var headers = [
            'ID', 'Data_Solicitacao', 'Escola', 'Produto_Original', 'Produto_Substituto',
            'Motivo', 'Solicitante', 'Nutricionista_Avaliador', 'Data_Avaliacao',
            'Parecer_Nutricional', 'Equivalencia_Nutricional', 'Status', 'Observacoes',
            'dataCriacao', 'dataAtualizacao'
          ];
    
          sheet.clear();
          sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
          sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    
          var dados = SUBSTITUICOES_ALIMENTOS_SINTETICAS.map(function(sub) {
            return [
              sub.id, sub.dataSolicitacao, sub.escola, sub.produtoOriginal,
              sub.produtoSubstituto, sub.motivo, sub.solicitante,
              sub.nutricionistaAvaliador, sub.dataAvaliacao, sub.parecerNutricional,
              sub.equivalenciaNutricional, sub.status, sub.observacoes,
              sub.dataCriacao, sub.dataAtualizacao
            ];
          });
    
          if (dados.length > 0) {
            sheet.getRange(2, 1, dados.length, headers.length).setValues(dados);
            resultado.registrosInseridos = dados.length;
          }
    
          resultado.sucesso = true;
          resultado.tempoExecucao = new Date() - startTime;
          Logger.log('✅ Substituições Alimentos populadas: ' + resultado.registrosInseridos + ' registros');
    
        } catch (e) {
          resultado.erros.push(e.message);
          Logger.log('❌ Erro: ' + e.message);
        }
  
        return resultado;
      } catch (error) {
        Logger.log("Erro em popularSubstituicoesAlimentos: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em popularSubstituicoesAlimentos: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em popularSubstituicoesAlimentos: " + error.message);
    throw error;
  }
}

/**
 * Valida a estrutura e dados
 */
function validarSubstituicoesAlimentos() {
  try {
    var resultado = { valido: true, totalRegistros: 0, porStatus: {}, porEquivalencia: {}, erros: [], avisos: [] };
  
    try {
      var ss = getSS();
      var sheet = ss.getSheetByName('Substituicoes_Alimentos');
    
      if (!sheet) {
        resultado.valido = false;
        resultado.erros.push('Aba não encontrada');
        return resultado;
      }
    
      var dados = sheet.getDataRange().getValues();
      resultado.totalRegistros = Math.max(0, dados.length - 1);
    
      var headers = dados[0];
      var statusIndex = headers.indexOf('Status');
      var equivIndex = headers.indexOf('Equivalencia_Nutricional');
    
      for (var i = 1; i < dados.length; i++) {
        var status = dados[i][statusIndex] || 'SEM_STATUS';
        var equiv = dados[i][equivIndex] || 'NAO_AVALIADO';
        resultado.porStatus[status] = (resultado.porStatus[status] || 0) + 1;
        resultado.porEquivalencia[equiv] = (resultado.porEquivalencia[equiv] || 0) + 1;
      }
    
      Logger.log('✅ Validação Substituições: ' + resultado.totalRegistros + ' registros');
    
    } catch (e) {
      resultado.valido = false;
      resultado.erros.push(e.message);
    }
  
    return resultado;
  } catch (error) {
    Logger.log("Erro em validarSubstituicoesAlimentos: " + error.message);
    throw error;
  }
}

/**
 * Executa setup completo
 */
function setupSubstituicoesAlimentosCompleto() {
  Logger.log('=== SETUP SUBSTITUIÇÕES ALIMENTOS COMPLETO ===');
  return { popular: popularSubstituicoesAlimentos(), validar: validarSubstituicoesAlimentos() };
}
