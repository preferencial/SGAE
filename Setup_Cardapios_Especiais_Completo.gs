/**
 * @fileoverview Setup Completo de Cardápios Especiais - Dados Sintéticos
 * @version 1.0.0
 * @description Cria dados sintéticos para testar cenários de cardápios especiais.
 * 
 * CENÁRIOS COBERTOS:
 * - Cardápio para APLV (alergia ao leite)
 * - Cardápio para celíacos
 * - Cardápio para diabéticos
 * - Cardápio por consistência (pastoso, líquido)
 * - Cardápio ativo
 * - Cardápio em revisão
 * - Cardápio suspenso
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-19
 */

'use strict';

// ============================================================================
// DADOS SINTÉTICOS DE CARDÁPIOS ESPECIAIS
// ============================================================================

var CARDAPIOS_ESPECIAIS_SINTETICOS = [
  {
    id: 'CARD-2025-0001',
    dataCriacao: new Date(2025, 1, 1),
    tipoCardapio: 'PATOLOGIA',
    patologiaDieta: 'APLV - Alergia à Proteína do Leite de Vaca',
    nomeCardapio: 'Cardápio APLV - Educação Infantil',
    descricao: 'Cardápio adaptado para alunos com APLV na educação infantil',
    elaboradoPor: 'Dra. Ana Nutricionista',
    nutricionistaResponsavel: 'CRN-1 12345',
    periodoVigencia: '2025',
    refeicoes: 'Desjejum, Almoço, Lanche',
    substituicoes: 'Leite por bebida vegetal, queijo por pasta de grão-de-bico',
    observacoes: 'Verificar sempre rótulos para traços de leite',
    status: 'ATIVO',
    dataCriacaoRegistro: new Date(2025, 1, 1),
    dataAtualizacao: new Date(2025, 1, 1)
  },
  {
    id: 'CARD-2025-0002',
    dataCriacao: new Date(2025, 1, 5),
    tipoCardapio: 'PATOLOGIA',
    patologiaDieta: 'Doença Celíaca',
    nomeCardapio: 'Cardápio Sem Glúten - Ensino Fundamental',
    descricao: 'Cardápio adaptado para alunos celíacos',
    elaboradoPor: 'Dra. Ana Nutricionista',
    nutricionistaResponsavel: 'CRN-1 12345',
    periodoVigencia: '2025',
    refeicoes: 'Desjejum, Almoço, Lanche',
    substituicoes: 'Pão por tapioca, macarrão por arroz',
    observacoes: 'Atenção à contaminação cruzada na cozinha',
    status: 'ATIVO',
    dataCriacaoRegistro: new Date(2025, 1, 5),
    dataAtualizacao: new Date(2025, 1, 5)
  }
];


// Mais dados sintéticos
CARDAPIOS_ESPECIAIS_SINTETICOS.push(
  {
    id: 'CARD-2025-0003',
    dataCriacao: new Date(2025, 1, 10),
    tipoCardapio: 'PATOLOGIA',
    patologiaDieta: 'Diabetes Mellitus',
    nomeCardapio: 'Cardápio Diabético - Ensino Fundamental',
    descricao: 'Cardápio com baixo índice glicêmico para alunos diabéticos',
    elaboradoPor: 'Dra. Ana Nutricionista',
    nutricionistaResponsavel: 'CRN-1 12345',
    periodoVigencia: '2025',
    refeicoes: 'Desjejum, Almoço, Lanche',
    substituicoes: 'Açúcar por adoçante, suco por fruta in natura',
    observacoes: 'Evitar carboidratos simples. Preferir integrais.',
    status: 'ATIVO',
    dataCriacaoRegistro: new Date(2025, 1, 10),
    dataAtualizacao: new Date(2025, 1, 10)
  },
  {
    id: 'CARD-2025-0004',
    dataCriacao: new Date(2025, 2, 1),
    tipoCardapio: 'CONSISTENCIA',
    patologiaDieta: 'Disfagia',
    nomeCardapio: 'Cardápio Pastoso - Todas as Etapas',
    descricao: 'Cardápio com consistência pastosa para alunos com disfagia',
    elaboradoPor: 'Dra. Ana Nutricionista',
    nutricionistaResponsavel: 'CRN-1 12345',
    periodoVigencia: '2025',
    refeicoes: 'Desjejum, Almoço, Lanche',
    substituicoes: 'Alimentos sólidos por purês e papas',
    observacoes: 'Processar todos os alimentos. Evitar grãos inteiros.',
    status: 'ATIVO',
    dataCriacaoRegistro: new Date(2025, 2, 1),
    dataAtualizacao: new Date(2025, 2, 1)
  },
  {
    id: 'CARD-2025-0005',
    dataCriacao: new Date(2025, 3, 1),
    tipoCardapio: 'PATOLOGIA',
    patologiaDieta: 'Alergia a Ovo',
    nomeCardapio: 'Cardápio Sem Ovo - Educação Infantil',
    descricao: 'Cardápio adaptado para alunos com alergia a ovo',
    elaboradoPor: 'Dra. Ana Nutricionista',
    nutricionistaResponsavel: 'CRN-1 12345',
    periodoVigencia: '2025',
    refeicoes: 'Desjejum, Almoço, Lanche',
    substituicoes: 'Ovo por proteína vegetal, bolos por versões sem ovo',
    observacoes: 'Verificar rótulos para traços de ovo.',
    status: 'EM_REVISAO',
    dataCriacaoRegistro: new Date(2025, 3, 1),
    dataAtualizacao: new Date(2025, 11, 15)
  }
);

// ============================================================================
// FUNÇÕES DE INICIALIZAÇÃO E VALIDAÇÃO
// ============================================================================

/**
 * Popula a aba Cardapios_Especiais com dados sintéticos
 */
function popularCardapiosEspeciais() {
  try {
    try {
      try {
        var startTime = new Date();
        var resultado = { sucesso: false, registrosInseridos: 0, erros: [], tempoExecucao: 0 };
  
        try {
          var ss = getSS();
          var sheetName = 'Cardapios_Especiais';
          var sheet = ss.getSheetByName(sheetName);
    
          if (!sheet) {
            sheet = ss.insertSheet(sheetName);
            Logger.log('Aba ' + sheetName + ' criada.');
          }
    
          var headers = [
            'ID', 'Data_Criacao', 'Tipo_Cardapio', 'Patologia_Dieta', 'Nome_Cardapio',
            'Descricao', 'Elaborado_Por', 'Nutricionista_Responsavel', 'Periodo_Vigencia',
            'Refeicoes', 'Substituicoes', 'Observacoes', 'Status', 'dataCriacao', 'dataAtualizacao'
          ];
    
          sheet.clear();
          sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
          sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    
          var dados = CARDAPIOS_ESPECIAIS_SINTETICOS.map(function(card) {
            return [
              card.id, card.dataCriacao, card.tipoCardapio, card.patologiaDieta,
              card.nomeCardapio, card.descricao, card.elaboradoPor,
              card.nutricionistaResponsavel, card.periodoVigencia, card.refeicoes,
              card.substituicoes, card.observacoes, card.status,
              card.dataCriacaoRegistro, card.dataAtualizacao
            ];
          });
    
          if (dados.length > 0) {
            sheet.getRange(2, 1, dados.length, headers.length).setValues(dados);
            resultado.registrosInseridos = dados.length;
          }
    
          resultado.sucesso = true;
          resultado.tempoExecucao = new Date() - startTime;
          Logger.log('✅ Cardápios Especiais populados: ' + resultado.registrosInseridos + ' registros');
    
        } catch (e) {
          resultado.erros.push(e.message);
          Logger.log('❌ Erro: ' + e.message);
        }
  
        return resultado;
      } catch (error) {
        Logger.log("Erro em popularCardapiosEspeciais: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em popularCardapiosEspeciais: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em popularCardapiosEspeciais: " + error.message);
    throw error;
  }
}

/**
 * Valida a estrutura e dados
 */
function validarCardapiosEspeciais() {
  try {
    var resultado = { valido: true, totalRegistros: 0, porStatus: {}, porTipo: {}, erros: [], avisos: [] };
  
    try {
      var ss = getSS();
      var sheet = ss.getSheetByName('Cardapios_Especiais');
    
      if (!sheet) {
        resultado.valido = false;
        resultado.erros.push('Aba não encontrada');
        return resultado;
      }
    
      var dados = sheet.getDataRange().getValues();
      resultado.totalRegistros = Math.max(0, dados.length - 1);
    
      var headers = dados[0];
      var statusIndex = headers.indexOf('Status');
      var tipoIndex = headers.indexOf('Tipo_Cardapio');
    
      for (var i = 1; i < dados.length; i++) {
        var status = dados[i][statusIndex] || 'SEM_STATUS';
        var tipo = dados[i][tipoIndex] || 'SEM_TIPO';
        resultado.porStatus[status] = (resultado.porStatus[status] || 0) + 1;
        resultado.porTipo[tipo] = (resultado.porTipo[tipo] || 0) + 1;
      }
    
      Logger.log('✅ Validação Cardápios Especiais: ' + resultado.totalRegistros + ' registros');
    
    } catch (e) {
      resultado.valido = false;
      resultado.erros.push(e.message);
    }
  
    return resultado;
  } catch (error) {
    Logger.log("Erro em validarCardapiosEspeciais: " + error.message);
    throw error;
  }
}

/**
 * Executa setup completo
 */
function setupCardapiosEspeciaisCompleto() {
  Logger.log('=== SETUP CARDÁPIOS ESPECIAIS COMPLETO ===');
  return { popular: popularCardapiosEspeciais(), validar: validarCardapiosEspeciais() };
}
