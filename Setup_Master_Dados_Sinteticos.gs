/**
 * @fileoverview Setup Master - Executa todos os setups de dados sintéticos
 * @version 1.0.0
 * @description Função centralizadora para popular todas as abas do sistema
 * com dados sintéticos para testes e demonstração.
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-19
 */

'use strict';

// ============================================================================
// FUNÇÃO MASTER DE SETUP
// ============================================================================

/**
 * Executa todos os setups de dados sintéticos
 * @returns {Object} Resultado consolidado de todos os setups
 */
function executarSetupMasterCompleto() {
  try {
    var startTime = new Date();
    Logger.log('╔══════════════════════════════════════════════════════════════╗');
    Logger.log('║     SETUP MASTER - DADOS SINTÉTICOS UNIAE CRE               ║');
    Logger.log('║     Iniciado em: ' + startTime.toLocaleString() + '                    ║');
    Logger.log('╚══════════════════════════════════════════════════════════════╝');
  
    var resultados = {
      sucesso: true,
      totalAbas: 0,
      abasPopuladas: 0,
      totalRegistros: 0,
      erros: [],
      detalhes: {}
    };
  
    // Lista de setups a executar - nomes corrigidos para corresponder às funções reais
    var setups = [
      { nome: 'Notas Fiscais', funcao: 'setupNotasFiscaisCompleto' },
      { nome: 'Entregas', funcao: 'setupEntregasCompleto' },
      { nome: 'Recusas', funcao: 'setupRecusasCompleto' },
      { nome: 'Glosas', funcao: 'setupGlosasCompleto' },
      { nome: 'Processos Atesto', funcao: 'setupProcessosAtestoTeste' },
      { nome: 'Empenhos', funcao: 'setupEmpenhosCompleto' },
      { nome: 'Controle Conferência', funcao: 'setupControleConferenciaCompleto' },
      { nome: 'Alunos Necessidades Especiais', funcao: 'setupAlunosNecessidadesEspeciaisCompleto' },
      { nome: 'Cardápios Especiais', funcao: 'setupCardapiosEspeciaisCompleto' },
      { nome: 'Avaliações Nutricionista', funcao: 'setupAvaliacoesNutricionistaCompleto' },
      { nome: 'Substituições Alimentos', funcao: 'setupSubstituicoesAlimentosCompleto' },
      { nome: 'Pareceres Técnicos', funcao: 'setupPareceresTecnicosCompleto' },
      { nome: 'Ocorrências Descarte', funcao: 'setupOcorrenciasDescarteCompleto' }
    ];
  
    resultados.totalAbas = setups.length;
  
    // Executa cada setup
    for (var i = 0; i < setups.length; i++) {
      var setup = setups[i];
      Logger.log('\n▶ Executando: ' + setup.nome + '...');
    
      try {
        // Mapa seguro de funções de setup - evita uso de eval() (vulnerabilidade de injection)
        var setupFunctionMap = {
          'setupNotasFiscaisCompleto': typeof setupNotasFiscaisCompleto !== 'undefined' ? setupNotasFiscaisCompleto : null,
          'setupEntregasCompleto': typeof setupEntregasCompleto !== 'undefined' ? setupEntregasCompleto : null,
          'setupRecusasCompleto': typeof setupRecusasCompleto !== 'undefined' ? setupRecusasCompleto : null,
          'setupGlosasCompleto': typeof setupGlosasCompleto !== 'undefined' ? setupGlosasCompleto : null,
          'setupProcessosAtestoTeste': typeof setupProcessosAtestoTeste !== 'undefined' ? setupProcessosAtestoTeste : null,
          'setupEmpenhosCompleto': typeof setupEmpenhosCompleto !== 'undefined' ? setupEmpenhosCompleto : null,
          'setupControleConferenciaCompleto': typeof setupControleConferenciaCompleto !== 'undefined' ? setupControleConferenciaCompleto : null,
          'setupAlunosNecessidadesEspeciaisCompleto': typeof setupAlunosNecessidadesEspeciaisCompleto !== 'undefined' ? setupAlunosNecessidadesEspeciaisCompleto : null,
          'setupCardapiosEspeciaisCompleto': typeof setupCardapiosEspeciaisCompleto !== 'undefined' ? setupCardapiosEspeciaisCompleto : null,
          'setupAvaliacoesNutricionistaCompleto': typeof setupAvaliacoesNutricionistaCompleto !== 'undefined' ? setupAvaliacoesNutricionistaCompleto : null,
          'setupSubstituicoesAlimentosCompleto': typeof setupSubstituicoesAlimentosCompleto !== 'undefined' ? setupSubstituicoesAlimentosCompleto : null,
          'setupPareceresTecnicosCompleto': typeof setupPareceresTecnicosCompleto !== 'undefined' ? setupPareceresTecnicosCompleto : null,
          'setupOcorrenciasDescarteCompleto': typeof setupOcorrenciasDescarteCompleto !== 'undefined' ? setupOcorrenciasDescarteCompleto : null
        };
      
        var fn = setupFunctionMap[setup.funcao] || null;

        if (typeof fn === 'function') {
          var resultado = fn();
          resultados.detalhes[setup.nome] = resultado;
        
          if (resultado.popular && resultado.popular.sucesso) {
            resultados.abasPopuladas++;
            resultados.totalRegistros += resultado.popular.registrosInseridos || 0;
            Logger.log('  ✅ ' + setup.nome + ': ' + (resultado.popular.registrosInseridos || 0) + ' registros');
          } else {
            Logger.log('  ⚠️ ' + setup.nome + ': Função executada mas sem confirmação de sucesso');
          }
        } else {
          Logger.log('  ⚠️ Função ' + setup.funcao + ' não encontrada');
          resultados.erros.push('Função não encontrada: ' + setup.funcao);
        }
      } catch (e) {
        Logger.log('  ❌ Erro em ' + setup.nome + ': ' + e.message);
        resultados.erros.push(setup.nome + ': ' + e.message);
        resultados.sucesso = false;
      }
    }
  
    // Resumo final
    var tempoTotal = (new Date() - startTime) / 1000;
  
    Logger.log('\n╔══════════════════════════════════════════════════════════════╗');
    Logger.log('║                    RESUMO DO SETUP                          ║');
    Logger.log('╠══════════════════════════════════════════════════════════════╣');
    Logger.log('║ Abas processadas: ' + resultados.abasPopuladas + '/' + resultados.totalAbas);
    Logger.log('║ Total de registros: ' + resultados.totalRegistros);
    Logger.log('║ Tempo de execução: ' + tempoTotal.toFixed(2) + ' segundos');
    Logger.log('║ Status: ' + (resultados.sucesso ? '✅ SUCESSO' : '❌ COM ERROS'));
    if (resultados.erros.length > 0) {
      Logger.log('║ Erros: ' + resultados.erros.length);
    }
    Logger.log('╚══════════════════════════════════════════════════════════════╝');
  
    return resultados;
  } catch (error) {
    Logger.log("Erro em executarSetupMasterCompleto: " + error.message);
    throw error;
  }
}

/**
 * Valida todas as abas após o setup
 */
function validarTodasAbas() {
  Logger.log('=== VALIDAÇÃO GERAL DE TODAS AS ABAS ===\n');
  
  var validacoes = [
    { nome: 'Notas_Fiscais', funcao: validarNotasFiscais },
    { nome: 'Entregas', funcao: validarEntregas },
    { nome: 'Recusas', funcao: validarRecusas },
    { nome: 'Glosas', funcao: validarGlosas },
    { nome: 'Empenhos', funcao: validarEmpenhos },
    { nome: 'Controle_Conferencia', funcao: validarControleConferencia },
    { nome: 'Alunos_Necessidades_Especiais', funcao: validarAlunosNecessidadesEspeciais },
    { nome: 'Cardapios_Especiais', funcao: validarCardapiosEspeciais },
    { nome: 'Avaliacoes_Nutricionista', funcao: validarAvaliacoesNutricionista },
    { nome: 'Substituicoes_Alimentos', funcao: validarSubstituicoesAlimentos },
    { nome: 'Pareceres_Tecnicos', funcao: validarPareceresTecnicos },
    { nome: 'Ocorrencias_Descarte', funcao: validarOcorrenciasDescarte }
  ];
  
  var resultado = { totalAbas: validacoes.length, abasValidas: 0, totalRegistros: 0, detalhes: {} };
  
  for (var i = 0; i < validacoes.length; i++) {
    try {
      if (typeof validacoes[i].funcao === 'function') {
        var val = validacoes[i].funcao();
        resultado.detalhes[validacoes[i].nome] = val;
        if (val.valido) resultado.abasValidas++;
        resultado.totalRegistros += val.totalRegistros || 0;
      }
    } catch (e) {
      Logger.log('Erro validando ' + validacoes[i].nome + ': ' + e.message);
    }
  }
  
  Logger.log('\n=== RESUMO VALIDAÇÃO ===');
  Logger.log('Abas válidas: ' + resultado.abasValidas + '/' + resultado.totalAbas);
  Logger.log('Total registros: ' + resultado.totalRegistros);
  
  return resultado;
}

/**
 * Menu para executar setup via interface
 */
function menuSetupDadosSinteticos() {
  try {
    // Usar getSafeUi para evitar erro de contexto
    var ui = typeof getSafeUi === 'function' ? getSafeUi() : null;
  
    if (!ui) {
      Logger.log('⚠️ Função menuSetupDadosSinteticos deve ser executada a partir do menu da planilha');
      Logger.log('Executando setup diretamente...');
      var resultado = executarSetupMasterCompleto();
      Logger.log('Setup concluído: ' + resultado.abasPopuladas + ' abas, ' + resultado.totalRegistros + ' registros');
      return;
    }
  
    var response = ui.alert(
      'Setup de Dados Sintéticos',
      'Isso irá popular todas as abas com dados de teste.\n\nDeseja continuar?',
      ui.ButtonSet.YES_NO
    );
  
    if (response === ui.Button.YES) {
      var resultado = executarSetupMasterCompleto();
      ui.alert(
        'Setup Concluído',
        'Abas populadas: ' + resultado.abasPopuladas + '/' + resultado.totalAbas + '\n' +
        'Total de registros: ' + resultado.totalRegistros + '\n' +
        'Erros: ' + resultado.erros.length,
        ui.ButtonSet.OK
      );
    }
  } catch (error) {
    Logger.log("Erro em menuSetupDadosSinteticos: " + error.message);
    throw error;
  }
}
