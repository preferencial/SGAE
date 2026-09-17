/**
 * @fileoverview Setup Completo de Alunos com Necessidades Especiais - Dados Sintéticos
 * @version 1.0.0
 * @description Cria dados sintéticos para testar cenários de alunos com
 * necessidades alimentares especiais.
 * 
 * CENÁRIOS COBERTOS:
 * - Aluno com alergia alimentar (leite, ovo, glúten)
 * - Aluno com intolerância à lactose
 * - Aluno celíaco
 * - Aluno diabético
 * - Aluno com dieta por consistência
 * - Aluno com laudo válido
 * - Aluno com laudo vencido
 * - Aluno inativo
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-19
 */

'use strict';

// ============================================================================
// DADOS SINTÉTICOS DE ALUNOS COM NECESSIDADES ESPECIAIS
// ============================================================================

var ALUNOS_NECESSIDADES_ESPECIAIS_SINTETICOS = [
  {
    id: 'ANE-2025-0001',
    dataCadastro: new Date(2025, 1, 15),
    nomeCompleto: 'Pedro Henrique Silva',
    dataNascimento: new Date(2015, 3, 10),
    unidadeEscolar: 'EC 308 Sul',
    cre: 'CRE Plano Piloto',
    serieTurma: '4º Ano A',
    turno: 'Matutino',
    tipoNecessidade: 'PATOLOGIA',
    patologiaDieta: 'Alergia à Proteína do Leite de Vaca (APLV)',
    patologiaSecundaria: '',
    restricoes: 'Leite e derivados, traços de leite',
    possuiLaudo: 'SIM',
    dataLaudo: new Date(2025, 1, 10),
    validadeLaudo: new Date(2026, 1, 10),
    linkLaudoSEI: 'sei.df.gov.br/laudo001',
    cid10: 'K52.2',
    consistencia: 'NORMAL',
    observacoes: 'Substituir leite por bebida vegetal. Atenção a traços.',
    responsavelCadastro: 'nutricionista@seedf.gov.br',
    status: 'ATIVO'
  }
];


// Mais dados sintéticos
ALUNOS_NECESSIDADES_ESPECIAIS_SINTETICOS.push(
  {
    id: 'ANE-2025-0002',
    dataCadastro: new Date(2025, 2, 1),
    nomeCompleto: 'Maria Clara Souza',
    dataNascimento: new Date(2014, 7, 22),
    unidadeEscolar: 'CEF 01 Taguatinga',
    cre: 'CRE Taguatinga',
    serieTurma: '5º Ano B',
    turno: 'Vespertino',
    tipoNecessidade: 'PATOLOGIA',
    patologiaDieta: 'Doença Celíaca',
    patologiaSecundaria: '',
    restricoes: 'Glúten (trigo, centeio, cevada, aveia contaminada)',
    possuiLaudo: 'SIM',
    dataLaudo: new Date(2025, 1, 25),
    validadeLaudo: new Date(2026, 1, 25),
    linkLaudoSEI: 'sei.df.gov.br/laudo002',
    cid10: 'K90.0',
    consistencia: 'NORMAL',
    observacoes: 'Atenção à contaminação cruzada. Utensílios separados.',
    responsavelCadastro: 'nutricionista@seedf.gov.br',
    status: 'ATIVO'
  },
  {
    id: 'ANE-2025-0003',
    dataCadastro: new Date(2025, 2, 10),
    nomeCompleto: 'João Gabriel Lima',
    dataNascimento: new Date(2016, 0, 5),
    unidadeEscolar: 'EC 05 Ceilândia',
    cre: 'CRE Ceilândia',
    serieTurma: '3º Ano A',
    turno: 'Matutino',
    tipoNecessidade: 'PATOLOGIA',
    patologiaDieta: 'Diabetes Mellitus Tipo 1',
    patologiaSecundaria: '',
    restricoes: 'Açúcar refinado, doces concentrados',
    possuiLaudo: 'SIM',
    dataLaudo: new Date(2025, 2, 5),
    validadeLaudo: new Date(2026, 2, 5),
    linkLaudoSEI: 'sei.df.gov.br/laudo003',
    cid10: 'E10',
    consistencia: 'NORMAL',
    observacoes: 'Monitorar glicemia. Lanche com baixo índice glicêmico.',
    responsavelCadastro: 'nutricionista@seedf.gov.br',
    status: 'ATIVO'
  },
  {
    id: 'ANE-2025-0004',
    dataCadastro: new Date(2025, 3, 1),
    nomeCompleto: 'Ana Beatriz Ferreira',
    dataNascimento: new Date(2017, 5, 15),
    unidadeEscolar: 'EC 308 Sul',
    cre: 'CRE Plano Piloto',
    serieTurma: '2º Ano C',
    turno: 'Matutino',
    tipoNecessidade: 'DIETA',
    patologiaDieta: 'Disfagia',
    patologiaSecundaria: 'Paralisia Cerebral',
    restricoes: 'Alimentos sólidos inteiros',
    possuiLaudo: 'SIM',
    dataLaudo: new Date(2025, 2, 20),
    validadeLaudo: new Date(2025, 8, 20),
    linkLaudoSEI: 'sei.df.gov.br/laudo004',
    cid10: 'R13',
    consistencia: 'PASTOSO',
    observacoes: 'Todos os alimentos devem ser processados. Acompanhamento fonoaudiológico.',
    responsavelCadastro: 'nutricionista@seedf.gov.br',
    status: 'ATIVO'
  },
  {
    id: 'ANE-2024-0010',
    dataCadastro: new Date(2024, 1, 15),
    nomeCompleto: 'Lucas Oliveira Santos',
    dataNascimento: new Date(2013, 9, 10),
    unidadeEscolar: 'CEF 03 Gama',
    cre: 'CRE Gama',
    serieTurma: '6º Ano A',
    turno: 'Matutino',
    tipoNecessidade: 'PATOLOGIA',
    patologiaDieta: 'Intolerância à Lactose',
    patologiaSecundaria: '',
    restricoes: 'Leite e derivados com lactose',
    possuiLaudo: 'SIM',
    dataLaudo: new Date(2024, 1, 10),
    validadeLaudo: new Date(2025, 1, 10),
    linkLaudoSEI: 'sei.df.gov.br/laudo010',
    cid10: 'E73.9',
    consistencia: 'NORMAL',
    observacoes: 'Laudo vencido. Aguardando renovação.',
    responsavelCadastro: 'nutricionista@seedf.gov.br',
    status: 'LAUDO_VENCIDO'
  }
);

// ============================================================================
// FUNÇÕES DE INICIALIZAÇÃO E VALIDAÇÃO
// ============================================================================

/**
 * Popula a aba Alunos_Necessidades_Especiais com dados sintéticos
 */
function popularAlunosNecessidadesEspeciais() {
  try {
    try {
      try {
        var startTime = new Date();
        var resultado = { sucesso: false, registrosInseridos: 0, erros: [], tempoExecucao: 0 };
  
        try {
          var ss = getSS();
          var sheetName = 'Alunos_Necessidades_Especiais';
          var sheet = ss.getSheetByName(sheetName);
    
          if (!sheet) {
            sheet = ss.insertSheet(sheetName);
            Logger.log('Aba ' + sheetName + ' criada.');
          }
    
          var headers = [
            'ID', 'Data_Cadastro', 'Nome_Completo', 'Data_Nascimento', 'Unidade_Escolar',
            'CRE', 'Serie_Turma', 'Turno', 'Tipo_Necessidade', 'Patologia_Dieta',
            'Patologia_Secundaria', 'Restricoes', 'Possui_Laudo', 'Data_Laudo',
            'Validade_Laudo', 'Link_Laudo_SEI', 'CID10', 'Consistencia',
            'Observacoes', 'Responsavel_Cadastro', 'Status'
          ];
    
          sheet.clear();
          sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
          sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    
          var dados = ALUNOS_NECESSIDADES_ESPECIAIS_SINTETICOS.map(function(aluno) {
            return [
              aluno.id, aluno.dataCadastro, aluno.nomeCompleto, aluno.dataNascimento,
              aluno.unidadeEscolar, aluno.cre, aluno.serieTurma, aluno.turno,
              aluno.tipoNecessidade, aluno.patologiaDieta, aluno.patologiaSecundaria,
              aluno.restricoes, aluno.possuiLaudo, aluno.dataLaudo, aluno.validadeLaudo,
              aluno.linkLaudoSEI, aluno.cid10, aluno.consistencia, aluno.observacoes,
              aluno.responsavelCadastro, aluno.status
            ];
          });
    
          if (dados.length > 0) {
            sheet.getRange(2, 1, dados.length, headers.length).setValues(dados);
            resultado.registrosInseridos = dados.length;
          }
    
          resultado.sucesso = true;
          resultado.tempoExecucao = new Date() - startTime;
          Logger.log('✅ Alunos Necessidades Especiais populados: ' + resultado.registrosInseridos + ' registros');
    
        } catch (e) {
          resultado.erros.push(e.message);
          Logger.log('❌ Erro: ' + e.message);
        }
  
        return resultado;
      } catch (error) {
        Logger.log("Erro em popularAlunosNecessidadesEspeciais: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em popularAlunosNecessidadesEspeciais: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em popularAlunosNecessidadesEspeciais: " + error.message);
    throw error;
  }
}

/**
 * Valida a estrutura e dados
 */
function validarAlunosNecessidadesEspeciais() {
  try {
    var resultado = { valido: true, totalRegistros: 0, porStatus: {}, porTipo: {}, laudosVencidos: 0, erros: [], avisos: [] };
  
    try {
      var ss = getSS();
      var sheet = ss.getSheetByName('Alunos_Necessidades_Especiais');
    
      if (!sheet) {
        resultado.valido = false;
        resultado.erros.push('Aba não encontrada');
        return resultado;
      }
    
      var dados = sheet.getDataRange().getValues();
      resultado.totalRegistros = Math.max(0, dados.length - 1);
    
      var headers = dados[0];
      var statusIndex = headers.indexOf('Status');
      var tipoIndex = headers.indexOf('Tipo_Necessidade');
      var validadeIndex = headers.indexOf('Validade_Laudo');
      var hoje = new Date();
    
      for (var i = 1; i < dados.length; i++) {
        var status = dados[i][statusIndex] || 'SEM_STATUS';
        var tipo = dados[i][tipoIndex] || 'SEM_TIPO';
        resultado.porStatus[status] = (resultado.porStatus[status] || 0) + 1;
        resultado.porTipo[tipo] = (resultado.porTipo[tipo] || 0) + 1;
      
        if (validadeIndex >= 0 && dados[i][validadeIndex]) {
          var validade = new Date(dados[i][validadeIndex]);
          if (validade < hoje) {
            resultado.laudosVencidos++;
          }
        }
      }
    
      Logger.log('✅ Validação Alunos NE: ' + resultado.totalRegistros + ' registros');
      Logger.log('   Laudos vencidos: ' + resultado.laudosVencidos);
    
    } catch (e) {
      resultado.valido = false;
      resultado.erros.push(e.message);
    }
  
    return resultado;
  } catch (error) {
    Logger.log("Erro em validarAlunosNecessidadesEspeciais: " + error.message);
    throw error;
  }
}

/**
 * Executa setup completo
 */
function setupAlunosNecessidadesEspeciaisCompleto() {
  Logger.log('=== SETUP ALUNOS NECESSIDADES ESPECIAIS COMPLETO ===');
  return { popular: popularAlunosNecessidadesEspeciais(), validar: validarAlunosNecessidadesEspeciais() };
}
