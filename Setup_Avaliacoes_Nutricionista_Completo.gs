/**
 * @fileoverview Setup Completo de Avaliações Nutricionista - Dados Sintéticos
 * @version 1.0.0
 * @description Cria dados sintéticos para testar cenários de avaliações nutricionais.
 * 
 * CENÁRIOS COBERTOS:
 * - Avaliação aprovada
 * - Avaliação reprovada
 * - Avaliação em revisão
 * - Avaliação com reavaliação agendada
 * - Diferentes tipos de restrição
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-19
 */

'use strict';

// ============================================================================
// DADOS SINTÉTICOS DE AVALIAÇÕES NUTRICIONISTA
// ============================================================================

var AVALIACOES_NUTRICIONISTA_SINTETICAS = [
  {
    id: 'AVAL-2025-0001',
    dataAvaliacao: new Date(2025, 1, 20),
    cardapioID: 'CARD-2025-0001',
    aluno: 'Pedro Henrique Silva',
    escola: 'EC 308 Sul',
    tipoRestricao: 'APLV',
    nutricionista: 'Dra. Ana Nutricionista',
    crn: 'CRN-1 12345',
    parecer: 'Aluno apresenta diagnóstico confirmado de APLV. Necessita cardápio especial.',
    recomendacoes: 'Seguir cardápio APLV. Evitar contaminação cruzada.',
    decisao: 'APROVADO',
    proximaReavaliacao: new Date(2025, 7, 20),
    observacoes: 'Laudo médico anexado ao SEI.',
    status: 'EMITIDO',
    dataCriacao: new Date(2025, 1, 20),
    dataAtualizacao: new Date(2025, 1, 20)
  },
  {
    id: 'AVAL-2025-0002',
    dataAvaliacao: new Date(2025, 2, 5),
    cardapioID: 'CARD-2025-0002',
    aluno: 'Maria Clara Souza',
    escola: 'CEF 01 Taguatinga',
    tipoRestricao: 'Doença Celíaca',
    nutricionista: 'Dra. Ana Nutricionista',
    crn: 'CRN-1 12345',
    parecer: 'Diagnóstico de doença celíaca confirmado por biópsia.',
    recomendacoes: 'Cardápio sem glúten. Utensílios separados.',
    decisao: 'APROVADO',
    proximaReavaliacao: new Date(2025, 8, 5),
    observacoes: 'Exames laboratoriais confirmam diagnóstico.',
    status: 'EMITIDO',
    dataCriacao: new Date(2025, 2, 5),
    dataAtualizacao: new Date(2025, 2, 5)
  }
];


// Mais dados sintéticos
AVALIACOES_NUTRICIONISTA_SINTETICAS.push(
  {
    id: 'AVAL-2025-0003',
    dataAvaliacao: new Date(2025, 2, 15),
    cardapioID: 'CARD-2025-0003',
    aluno: 'João Gabriel Lima',
    escola: 'EC 05 Ceilândia',
    tipoRestricao: 'Diabetes Mellitus Tipo 1',
    nutricionista: 'Dra. Ana Nutricionista',
    crn: 'CRN-1 12345',
    parecer: 'Aluno necessita cardápio com controle glicêmico rigoroso.',
    recomendacoes: 'Evitar açúcares simples. Preferir carboidratos complexos.',
    decisao: 'APROVADO',
    proximaReavaliacao: new Date(2025, 8, 15),
    observacoes: 'Monitorar glicemia antes e após refeições.',
    status: 'EMITIDO',
    dataCriacao: new Date(2025, 2, 15),
    dataAtualizacao: new Date(2025, 2, 15)
  },
  {
    id: 'AVAL-2025-0004',
    dataAvaliacao: new Date(2025, 3, 5),
    cardapioID: 'CARD-2025-0004',
    aluno: 'Ana Beatriz Ferreira',
    escola: 'EC 308 Sul',
    tipoRestricao: 'Disfagia',
    nutricionista: 'Dra. Ana Nutricionista',
    crn: 'CRN-1 12345',
    parecer: 'Aluna com disfagia necessita consistência pastosa.',
    recomendacoes: 'Processar todos os alimentos. Evitar líquidos ralos.',
    decisao: 'APROVADO',
    proximaReavaliacao: new Date(2025, 9, 5),
    observacoes: 'Acompanhamento fonoaudiológico em andamento.',
    status: 'EMITIDO',
    dataCriacao: new Date(2025, 3, 5),
    dataAtualizacao: new Date(2025, 3, 5)
  },
  {
    id: 'AVAL-2025-0005',
    dataAvaliacao: new Date(2025, 11, 10),
    cardapioID: 'CARD-2025-0005',
    aluno: 'Teste Revisão',
    escola: 'CEF 02 Samambaia',
    tipoRestricao: 'Alergia a Ovo',
    nutricionista: 'Dra. Ana Nutricionista',
    crn: 'CRN-1 12345',
    parecer: 'Laudo apresentado não especifica gravidade da alergia.',
    recomendacoes: 'Solicitar laudo complementar com detalhamento.',
    decisao: 'REVISAO',
    proximaReavaliacao: new Date(2025, 11, 25),
    observacoes: 'Aguardando documentação complementar.',
    status: 'RASCUNHO',
    dataCriacao: new Date(2025, 11, 10),
    dataAtualizacao: new Date(2025, 11, 10)
  }
);

// ============================================================================
// FUNÇÕES DE INICIALIZAÇÃO E VALIDAÇÃO
// ============================================================================

/**
 * Popula a aba Avaliacoes_Nutricionista com dados sintéticos
 */
function popularAvaliacoesNutricionista() {
  try {
    try {
      try {
        var startTime = new Date();
        var resultado = { sucesso: false, registrosInseridos: 0, erros: [], tempoExecucao: 0 };
  
        try {
          var ss = getSS();
          var sheetName = 'Avaliacoes_Nutricionista';
          var sheet = ss.getSheetByName(sheetName);
    
          if (!sheet) {
            sheet = ss.insertSheet(sheetName);
            Logger.log('Aba ' + sheetName + ' criada.');
          }
    
          var headers = [
            'ID', 'Data_Avaliacao', 'Cardapio_ID', 'Aluno', 'Escola', 'Tipo_Restricao',
            'Nutricionista', 'CRN', 'Parecer', 'Recomendacoes', 'Decisao',
            'Proxima_Reavaliacao', 'Observacoes', 'Status', 'dataCriacao', 'dataAtualizacao'
          ];
    
          sheet.clear();
          sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
          sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    
          var dados = AVALIACOES_NUTRICIONISTA_SINTETICAS.map(function(aval) {
            return [
              aval.id, aval.dataAvaliacao, aval.cardapioID, aval.aluno, aval.escola,
              aval.tipoRestricao, aval.nutricionista, aval.crn, aval.parecer,
              aval.recomendacoes, aval.decisao, aval.proximaReavaliacao,
              aval.observacoes, aval.status, aval.dataCriacao, aval.dataAtualizacao
            ];
          });
    
          if (dados.length > 0) {
            sheet.getRange(2, 1, dados.length, headers.length).setValues(dados);
            resultado.registrosInseridos = dados.length;
          }
    
          resultado.sucesso = true;
          resultado.tempoExecucao = new Date() - startTime;
          Logger.log('✅ Avaliações Nutricionista populadas: ' + resultado.registrosInseridos + ' registros');
    
        } catch (e) {
          resultado.erros.push(e.message);
          Logger.log('❌ Erro: ' + e.message);
        }
  
        return resultado;
      } catch (error) {
        Logger.log("Erro em popularAvaliacoesNutricionista: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em popularAvaliacoesNutricionista: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em popularAvaliacoesNutricionista: " + error.message);
    throw error;
  }
}

/**
 * Valida a estrutura e dados
 */
function validarAvaliacoesNutricionista() {
  try {
    var resultado = { valido: true, totalRegistros: 0, porDecisao: {}, porStatus: {}, erros: [], avisos: [] };
  
    try {
      var ss = getSS();
      var sheet = ss.getSheetByName('Avaliacoes_Nutricionista');
    
      if (!sheet) {
        resultado.valido = false;
        resultado.erros.push('Aba não encontrada');
        return resultado;
      }
    
      var dados = sheet.getDataRange().getValues();
      resultado.totalRegistros = Math.max(0, dados.length - 1);
    
      var headers = dados[0];
      var decisaoIndex = headers.indexOf('Decisao');
      var statusIndex = headers.indexOf('Status');
    
      for (var i = 1; i < dados.length; i++) {
        var decisao = dados[i][decisaoIndex] || 'SEM_DECISAO';
        var status = dados[i][statusIndex] || 'SEM_STATUS';
        resultado.porDecisao[decisao] = (resultado.porDecisao[decisao] || 0) + 1;
        resultado.porStatus[status] = (resultado.porStatus[status] || 0) + 1;
      }
    
      Logger.log('✅ Validação Avaliações: ' + resultado.totalRegistros + ' registros');
    
    } catch (e) {
      resultado.valido = false;
      resultado.erros.push(e.message);
    }
  
    return resultado;
  } catch (error) {
    Logger.log("Erro em validarAvaliacoesNutricionista: " + error.message);
    throw error;
  }
}

/**
 * Executa setup completo
 */
function setupAvaliacoesNutricionistaCompleto() {
  Logger.log('=== SETUP AVALIAÇÕES NUTRICIONISTA COMPLETO ===');
  return { popular: popularAvaliacoesNutricionista(), validar: validarAvaliacoesNutricionista() };
}
