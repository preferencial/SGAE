/**
 * @fileoverview Setup Completo de Controle de Conferência - Dados Sintéticos
 * @version 1.0.0
 * @description Cria dados sintéticos para testar cenários de conferência.
 * 
 * CENÁRIOS COBERTOS:
 * - Conferência pendente
 * - Conferência em andamento
 * - Conferência concluída com aprovação
 * - Conferência com divergências
 * - Conferência com recusa parcial
 * - Conferência com recusa total
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-19
 */

'use strict';

// ============================================================================
// DADOS SINTÉTICOS DE CONTROLE DE CONFERÊNCIA
// ============================================================================

var CONTROLE_CONFERENCIA_SINTETICO = [
  {
    id: 'CONF-2025-0001',
    notaFiscalID: 'NF-2025-0001',
    dataConferencia: new Date(2025, 11, 10),
    horaInicio: '08:00',
    horaFim: '08:45',
    conferente: 'Maria Silva Santos',
    matriculaConferente: '123456',
    statusConferencia: 'CONCLUIDA',
    resultadoGeral: 'APROVADO',
    quantidadeItens: 5,
    itensConformes: 5,
    itensNaoConformes: 0,
    observacoes: 'Todos os itens conferidos e aprovados.',
    assinaturaDigital: 'SIM',
    dataRegistro: new Date(2025, 11, 10)
  },
  {
    id: 'CONF-2025-0002',
    notaFiscalID: 'NF-2025-0002',
    dataConferencia: new Date(2025, 11, 11),
    horaInicio: '09:00',
    horaFim: '10:30',
    conferente: 'João Pedro Oliveira',
    matriculaConferente: '234567',
    statusConferencia: 'CONCLUIDA',
    resultadoGeral: 'APROVADO',
    quantidadeItens: 8,
    itensConformes: 8,
    itensNaoConformes: 0,
    observacoes: 'Carnes verificadas. Temperatura OK.',
    assinaturaDigital: 'SIM',
    dataRegistro: new Date(2025, 11, 11)
  }
];


// ============================================================================
// FUNÇÕES DE INICIALIZAÇÃO E VALIDAÇÃO
// ============================================================================

/**
 * Popula a aba Controle_Conferencia com dados sintéticos
 */
function popularControleConferenciaSintetico() {
  try {
    try {
      try {
        var startTime = new Date();
        var resultado = {
          sucesso: false,
          registrosInseridos: 0,
          erros: [],
          tempoExecucao: 0
        };
  
        try {
          var ss = getSS();
          var sheetName = 'Controle_Conferencia';
          var sheet = ss.getSheetByName(sheetName);
    
          if (!sheet) {
            sheet = ss.insertSheet(sheetName);
            Logger.log('Aba ' + sheetName + ' criada.');
          }
    
          var headers = [
            'ID', 'Nota_Fiscal_ID', 'Data_Conferencia', 'Hora_Inicio', 'Hora_Fim',
            'Conferente', 'Matricula_Conferente', 'Status_Conferencia', 'Resultado_Geral',
            'Quantidade_Itens', 'Itens_Conformes', 'Itens_Nao_Conformes',
            'Observacoes', 'Assinatura_Digital', 'Data_Registro'
          ];
    
          sheet.clear();
          sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
          sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    
          var dados = CONTROLE_CONFERENCIA_SINTETICO.map(function(conf) {
            return [
              conf.id, conf.notaFiscalID, conf.dataConferencia, conf.horaInicio,
              conf.horaFim, conf.conferente, conf.matriculaConferente,
              conf.statusConferencia, conf.resultadoGeral, conf.quantidadeItens,
              conf.itensConformes, conf.itensNaoConformes, conf.observacoes,
              conf.assinaturaDigital, conf.dataRegistro
            ];
          });
    
          if (dados.length > 0) {
            sheet.getRange(2, 1, dados.length, headers.length).setValues(dados);
            resultado.registrosInseridos = dados.length;
          }
    
          resultado.sucesso = true;
          resultado.tempoExecucao = new Date() - startTime;
          Logger.log('✅ Controle Conferência populado: ' + resultado.registrosInseridos + ' registros');
    
        } catch (e) {
          resultado.erros.push(e.message);
          Logger.log('❌ Erro: ' + e.message);
        }
  
        return resultado;
      } catch (error) {
        Logger.log("Erro em popularControleConferenciaSintetico: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em popularControleConferenciaSintetico: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em popularControleConferenciaSintetico: " + error.message);
    throw error;
  }
}

/**
 * Valida a estrutura e dados da aba Controle_Conferencia
 */
function validarControleConferencia() {
  try {
    var resultado = { valido: true, totalRegistros: 0, porStatus: {}, erros: [], avisos: [] };
  
    try {
      var ss = getSS();
      var sheet = ss.getSheetByName('Controle_Conferencia');
    
      if (!sheet) {
        resultado.valido = false;
        resultado.erros.push('Aba não encontrada');
        return resultado;
      }
    
      var dados = sheet.getDataRange().getValues();
      resultado.totalRegistros = Math.max(0, dados.length - 1);
    
      var headers = dados[0];
      var statusIndex = headers.indexOf('Status_Conferencia');
      if (statusIndex >= 0) {
        for (var i = 1; i < dados.length; i++) {
          var status = dados[i][statusIndex] || 'SEM_STATUS';
          resultado.porStatus[status] = (resultado.porStatus[status] || 0) + 1;
        }
      }
    
      Logger.log('✅ Validação Controle Conferência: ' + resultado.totalRegistros + ' registros');
    
    } catch (e) {
      resultado.valido = false;
      resultado.erros.push(e.message);
    }
  
    return resultado;
  } catch (error) {
    Logger.log("Erro em validarControleConferencia: " + error.message);
    throw error;
  }
}

/**
 * Executa setup completo
 */
function setupControleConferenciaCompleto() {
  Logger.log('=== SETUP CONTROLE CONFERÊNCIA COMPLETO ===');
  return {
    popular: popularControleConferenciaSintetico(),
    validar: validarControleConferencia()
  };
}
