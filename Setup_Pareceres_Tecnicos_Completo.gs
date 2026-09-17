/**
 * @fileoverview Setup Completo de Pareceres Técnicos - Dados Sintéticos
 * @version 1.0.0
 * @description Cria dados sintéticos para testar cenários de pareceres técnicos.
 * 
 * CENÁRIOS COBERTOS:
 * - Parecer sobre produto
 * - Parecer sobre fornecedor
 * - Parecer sobre cardápio
 * - Parecer sobre substituição
 * - Parecer favorável
 * - Parecer favorável com ressalvas
 * - Parecer desfavorável
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-19
 */

'use strict';

// ============================================================================
// DADOS SINTÉTICOS DE PARECERES TÉCNICOS
// ============================================================================

var PARECERES_TECNICOS_SINTETICOS = [
  {
    id: 'PAR-2025-0001',
    dataEmissao: new Date(2025, 11, 5),
    tipo: 'PRODUTO',
    assunto: 'Análise de novo produto - Bebida Vegetal',
    referencia: 'Processo SEI 00000-00001234/2025-00',
    parecer: 'Produto analisado atende aos requisitos nutricionais para substituição.',
    conclusao: 'FAVORAVEL',
    recomendacoes: 'Incluir no cardápio como opção para alunos com APLV.',
    nutricionista: 'Dra. Ana Nutricionista',
    crn: 'CRN-1 12345',
    status: 'EMITIDO',
    dataCriacao: new Date(2025, 11, 5),
    dataAtualizacao: new Date(2025, 11, 5)
  },
  {
    id: 'PAR-2025-0002',
    dataEmissao: new Date(2025, 11, 10),
    tipo: 'FORNECEDOR',
    assunto: 'Avaliação de fornecedor - Hortifruti Central',
    referencia: 'Processo SEI 00000-00001235/2025-00',
    parecer: 'Fornecedor apresentou problemas recorrentes de qualidade.',
    conclusao: 'FAVORAVEL_COM_RESSALVAS',
    recomendacoes: 'Manter fornecedor com monitoramento intensificado.',
    nutricionista: 'Dra. Ana Nutricionista',
    crn: 'CRN-1 12345',
    status: 'EMITIDO',
    dataCriacao: new Date(2025, 11, 10),
    dataAtualizacao: new Date(2025, 11, 10)
  },
  {
    id: 'PAR-2025-0003',
    dataEmissao: new Date(2025, 11, 15),
    tipo: 'CARDAPIO',
    assunto: 'Revisão de cardápio especial - Diabetes',
    referencia: 'Processo SEI 00000-00001236/2025-00',
    parecer: 'Cardápio necessita ajustes no índice glicêmico das refeições.',
    conclusao: 'DESFAVORAVEL',
    recomendacoes: 'Revisar composição do desjejum e lanche da tarde.',
    nutricionista: 'Dra. Ana Nutricionista',
    crn: 'CRN-1 12345',
    status: 'EMITIDO',
    dataCriacao: new Date(2025, 11, 15),
    dataAtualizacao: new Date(2025, 11, 15)
  }
];


// Mais dados sintéticos
PARECERES_TECNICOS_SINTETICOS.push(
  {
    id: 'PAR-2025-0004',
    dataEmissao: new Date(2025, 11, 18),
    tipo: 'SUBSTITUICAO',
    assunto: 'Parecer sobre substituição de feijão',
    referencia: 'SUB-2025-0005',
    parecer: 'Substituição de feijão carioca por feijão preto é adequada.',
    conclusao: 'FAVORAVEL',
    recomendacoes: 'Manter proporções equivalentes.',
    nutricionista: 'Dra. Ana Nutricionista',
    crn: 'CRN-1 12345',
    status: 'EMITIDO',
    dataCriacao: new Date(2025, 11, 18),
    dataAtualizacao: new Date(2025, 11, 18)
  },
  {
    id: 'PAR-2025-0005',
    dataEmissao: new Date(2025, 11, 19),
    tipo: 'OUTRO',
    assunto: 'Análise de ocorrência de descarte',
    referencia: 'DESC-2025-0004',
    parecer: 'Descarte de feijão com carunchos é necessário e correto.',
    conclusao: 'FAVORAVEL',
    recomendacoes: 'Notificar fornecedor. Solicitar laudo de controle de pragas.',
    nutricionista: 'Dra. Ana Nutricionista',
    crn: 'CRN-1 12345',
    status: 'RASCUNHO',
    dataCriacao: new Date(2025, 11, 19),
    dataAtualizacao: new Date(2025, 11, 19)
  }
);

// ============================================================================
// FUNÇÕES DE INICIALIZAÇÃO E VALIDAÇÃO
// ============================================================================

/**
 * Popula a aba Pareceres_Tecnicos com dados sintéticos
 */
function popularPareceresTecnicos() {
  try {
    try {
      try {
        var startTime = new Date();
        var resultado = { sucesso: false, registrosInseridos: 0, erros: [], tempoExecucao: 0 };
  
        try {
          var ss = getSS();
          var sheetName = 'Pareceres_Tecnicos';
          var sheet = ss.getSheetByName(sheetName);
    
          if (!sheet) {
            sheet = ss.insertSheet(sheetName);
            Logger.log('Aba ' + sheetName + ' criada.');
          }
    
          var headers = [
            'ID', 'Data_Emissao', 'Tipo', 'Assunto', 'Referencia', 'Parecer',
            'Conclusao', 'Recomendacoes', 'Nutricionista', 'CRN', 'Status',
            'dataCriacao', 'dataAtualizacao'
          ];
    
          sheet.clear();
          sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
          sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    
          var dados = PARECERES_TECNICOS_SINTETICOS.map(function(par) {
            return [
              par.id, par.dataEmissao, par.tipo, par.assunto, par.referencia,
              par.parecer, par.conclusao, par.recomendacoes, par.nutricionista,
              par.crn, par.status, par.dataCriacao, par.dataAtualizacao
            ];
          });
    
          if (dados.length > 0) {
            sheet.getRange(2, 1, dados.length, headers.length).setValues(dados);
            resultado.registrosInseridos = dados.length;
          }
    
          resultado.sucesso = true;
          resultado.tempoExecucao = new Date() - startTime;
          Logger.log('✅ Pareceres Técnicos populados: ' + resultado.registrosInseridos + ' registros');
    
        } catch (e) {
          resultado.erros.push(e.message);
          Logger.log('❌ Erro: ' + e.message);
        }
  
        return resultado;
      } catch (error) {
        Logger.log("Erro em popularPareceresTecnicos: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em popularPareceresTecnicos: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em popularPareceresTecnicos: " + error.message);
    throw error;
  }
}

/**
 * Valida a estrutura e dados
 */
function validarPareceresTecnicos() {
  try {
    var resultado = { valido: true, totalRegistros: 0, porTipo: {}, porConclusao: {}, porStatus: {}, erros: [], avisos: [] };
  
    try {
      var ss = getSS();
      var sheet = ss.getSheetByName('Pareceres_Tecnicos');
    
      if (!sheet) {
        resultado.valido = false;
        resultado.erros.push('Aba não encontrada');
        return resultado;
      }
    
      var dados = sheet.getDataRange().getValues();
      resultado.totalRegistros = Math.max(0, dados.length - 1);
    
      var headers = dados[0];
      var tipoIndex = headers.indexOf('Tipo');
      var conclusaoIndex = headers.indexOf('Conclusao');
      var statusIndex = headers.indexOf('Status');
    
      for (var i = 1; i < dados.length; i++) {
        var tipo = dados[i][tipoIndex] || 'SEM_TIPO';
        var conclusao = dados[i][conclusaoIndex] || 'SEM_CONCLUSAO';
        var status = dados[i][statusIndex] || 'SEM_STATUS';
        resultado.porTipo[tipo] = (resultado.porTipo[tipo] || 0) + 1;
        resultado.porConclusao[conclusao] = (resultado.porConclusao[conclusao] || 0) + 1;
        resultado.porStatus[status] = (resultado.porStatus[status] || 0) + 1;
      }
    
      Logger.log('✅ Validação Pareceres Técnicos: ' + resultado.totalRegistros + ' registros');
    
    } catch (e) {
      resultado.valido = false;
      resultado.erros.push(e.message);
    }
  
    return resultado;
  } catch (error) {
    Logger.log("Erro em validarPareceresTecnicos: " + error.message);
    throw error;
  }
}

/**
 * Executa setup completo
 */
function setupPareceresTecnicosCompleto() {
  Logger.log('=== SETUP PARECERES TÉCNICOS COMPLETO ===');
  return { popular: popularPareceresTecnicos(), validar: validarPareceresTecnicos() };
}
