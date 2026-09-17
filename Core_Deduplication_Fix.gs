/**
 * @fileoverview Correção de Duplicações - Sistema de Atesto
 *
 * Este arquivo documenta as correções de duplicações realizadas no sistema.
 * As funções getSafeUi, safeAlert, safePrompt agora estão centralizadas em Core_UI_Safe.gs
 *
 * @version 4.0.0
 */

'use strict';

/**
 * Verifica se há conflitos de nomes de função no sistema
 */
function verificarConflitosNomes() {
  try {
    Logger.log('=== VERIFICAÇÃO DE CONFLITOS DE NOMES ===\n');

    var funcoesVerificadas = [
      'getSafeUi',
      'safeAlert',
      'safePrompt',
      'validarCNPJ',
      'validarEmail',
      'formatarData'
    ];

    Logger.log('Funções verificadas:');
    // Mapa seguro de funções - evita uso de eval() (vulnerabilidade de injection)
    var funcaoMap = {
      'getSafeUi': typeof getSafeUi !== 'undefined' ? getSafeUi : null,
      'safeAlert': typeof safeAlert !== 'undefined' ? safeAlert : null,
      'safePrompt': typeof safePrompt !== 'undefined' ? safePrompt : null,
      'validarCNPJ': typeof validarCNPJ !== 'undefined' ? validarCNPJ : null,
      'validarEmail': typeof validarEmail !== 'undefined' ? validarEmail : null,
      'formatarData': typeof formatarData !== 'undefined' ? formatarData : null
    };

    funcoesVerificadas.forEach(function(funcao, index) {
      try {
        var fn = funcaoMap[funcao];
        if (typeof fn === 'function') {
          Logger.log((index + 1) + '. ' + funcao + ' - ✅ Definida');
        } else if (fn === null) {
          Logger.log((index + 1) + '. ' + funcao + ' - ❌ Não encontrada');
        } else {
          Logger.log((index + 1) + '. ' + funcao + ' - ⚠️ Não é função');
        }
      } catch (e) {
        Logger.log((index + 1) + '. ' + funcao + ' - ❌ Erro: ' + e.message);
      }
    });

    Logger.log('\n=== VERIFICAÇÃO CONCLUÍDA ===');
  } catch (error) {
    Logger.log("Erro em verificarConflitosNomes: " + error.message);
    throw error;
  }
}

/**
 * Lista arquivos que foram corrigidos na remoção de duplicações
 */
function listarArquivosCorrigidos() {
  try {
    Logger.log('=== ARQUIVOS CORRIGIDOS (v4.0.0) ===\n');

    var arquivosCorrigidos = [
      { arquivo: '_DIAGNOSTIC_Tools.gs', status: '✅ Corrigido' },
      { arquivo: '_INIT_Bootstrap.gs', status: '✅ Corrigido' },
      { arquivo: 'Code.gs', status: '✅ Corrigido' },
      { arquivo: 'Core_Server_Optimization.gs', status: '✅ Corrigido' },
      { arquivo: 'Docs_Examples_Optimization.gs', status: '✅ Corrigido' },
      { arquivo: 'Dominio_Recusas.gs', status: '✅ Corrigido' },
      { arquivo: 'Infra_Testes.gs', status: '✅ Corrigido' },
      { arquivo: 'Setup_Initial.gs', status: '✅ Corrigido' },
      { arquivo: 'Setup_Usuarios_DF.gs', status: '✅ Corrigido' },
      { arquivo: 'Test_Auth_System.gs', status: '✅ Corrigido' },
      { arquivo: 'UI_Auth_Functions.gs', status: '✅ Corrigido' },
      { arquivo: 'UI_CRUD.gs', status: '✅ Corrigido' },
      { arquivo: 'UI_Dashboard.gs', status: '✅ Corrigido' },
      { arquivo: 'UI_Menu_Legacy.gs', status: '✅ Corrigido' },
      { arquivo: 'UI_Standards.gs', status: '✅ Corrigido' },
      { arquivo: 'UI_UX.gs', status: '✅ Corrigido' }
    ];

    Logger.log('Total de arquivos corrigidos: ' + arquivosCorrigidos.length);
    Logger.log('');

    arquivosCorrigidos.forEach(function(item, index) {
      Logger.log((index + 1) + '. ' + item.arquivo + ' - ' + item.status);
    });

    Logger.log('\n=== LOCALIZAÇÃO DAS FUNÇÕES CENTRALIZADAS ===');
    Logger.log('');
    Logger.log('📁 Core_UI_Safe.gs:');
    Logger.log('   - getSafeUi()');
    Logger.log('   - safeAlert()');
    Logger.log('   - safePrompt()');
    Logger.log('   - safeChoice()');
    Logger.log('   - logFormatted()');
    Logger.log('');
    Logger.log('📁 Core_Input_Validation.gs:');
    Logger.log('   - validarCNPJ()');
    Logger.log('   - validarCPF()');
    Logger.log('   - validarEmail()');
    Logger.log('');
    Logger.log('📁 Core_Utils.gs:');
    Logger.log('   - formatarData()');
    Logger.log('   - formatarValor()');
    Logger.log('');

    Logger.log('=== FIM DA LISTAGEM ===');
  } catch (error) {
    Logger.log("Erro em listarArquivosCorrigidos: " + error.message);
    throw error;
  }
}

/**
 * Executa verificação completa do sistema após correções
 */
function verificarSistemaAposCorrecoes() {
  Logger.log('╔════════════════════════════════════════════════════════════╗');
  Logger.log('║     VERIFICAÇÃO DO SISTEMA APÓS CORREÇÕES v4.0.0          ║');
  Logger.log('╚════════════════════════════════════════════════════════════╝\n');

  var resultados = {
    sucessos: 0,
    falhas: 0,
    avisos: 0
  };

  // Teste 1: Verificar getSafeUi
  Logger.log('1. Testando getSafeUi()...');
  try {
    var ui = getSafeUi();
    if (ui !== null && ui !== undefined) {
      Logger.log('   ✅ getSafeUi() retornou UI válida');
      resultados.sucessos++;
    } else {
      Logger.log('   ⚠️ getSafeUi() retornou null (contexto sem UI)');
      resultados.avisos++;
    }
  } catch (e) {
    Logger.log('   ❌ Erro: ' + e.message);
    resultados.falhas++;
  }

  // Teste 2: Verificar safeAlert
  Logger.log('\n2. Testando safeAlert()...');
  try {
    // Não exibe alerta, apenas verifica se a função existe
    if (typeof safeAlert === 'function') {
      Logger.log('   ✅ safeAlert() está definida');
      resultados.sucessos++;
    } else {
      Logger.log('   ❌ safeAlert() não está definida');
      resultados.falhas++;
    }
  } catch (e) {
    Logger.log('   ❌ Erro: ' + e.message);
    resultados.falhas++;
  }

  // Teste 3: Verificar safePrompt
  Logger.log('\n3. Testando safePrompt()...');
  try {
    if (typeof safePrompt === 'function') {
      Logger.log('   ✅ safePrompt() está definida');
      resultados.sucessos++;
    } else {
      Logger.log('   ❌ safePrompt() não está definida');
      resultados.falhas++;
    }
  } catch (e) {
    Logger.log('   ❌ Erro: ' + e.message);
    resultados.falhas++;
  }

  // Teste 4: Verificar safeChoice
  Logger.log('\n4. Testando safeChoice()...');
  try {
    if (typeof safeChoice === 'function') {
      Logger.log('   ✅ safeChoice() está definida');
      resultados.sucessos++;
    } else {
      Logger.log('   ⚠️ safeChoice() não está definida (opcional)');
      resultados.avisos++;
    }
  } catch (e) {
    Logger.log('   ⚠️ safeChoice() não disponível: ' + e.message);
    resultados.avisos++;
  }

  // Teste 5: Verificar logFormatted
  Logger.log('\n5. Testando logFormatted()...');
  try {
    if (typeof logFormatted === 'function') {
      logFormatted('info', 'Teste', 'Mensagem de teste');
      Logger.log('   ✅ logFormatted() funcionando');
      resultados.sucessos++;
    } else {
      Logger.log('   ⚠️ logFormatted() não está definida (opcional)');
      resultados.avisos++;
    }
  } catch (e) {
    Logger.log('   ⚠️ logFormatted() não disponível: ' + e.message);
    resultados.avisos++;
  }

  // Resumo
  Logger.log('\n╔════════════════════════════════════════════════════════════╗');
  Logger.log('║                      RESUMO                                 ║');
  Logger.log('╚════════════════════════════════════════════════════════════╝');
  Logger.log('');
  Logger.log('✅ Sucessos: ' + resultados.sucessos);
  Logger.log('⚠️ Avisos: ' + resultados.avisos);
  Logger.log('❌ Falhas: ' + resultados.falhas);
  Logger.log('');

  if (resultados.falhas === 0) {
    Logger.log('🎉 SISTEMA VERIFICADO COM SUCESSO!');
  } else {
    Logger.log('⚠️ Algumas verificações falharam. Revise os logs acima.');
  }

  return resultados;
}

/**
 * Executa todas as verificações
 */
function executarTodasVerificacoes() {
  listarArquivosCorrigidos();
  Logger.log('\n' + '─'.repeat(60) + '\n');
  verificarConflitosNomes();
  Logger.log('\n' + '─'.repeat(60) + '\n');
  verificarSistemaAposCorrecoes();
}
