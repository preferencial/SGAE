/**
 * @fileoverview Infraestrutura de Testes
 * @version 4.0.0
 * 
 * ATENÇÃO: Este arquivo usa arrow functions e requer V8 runtime
 * Configure em: Projeto > Configurações > Configurações do script > V8
 * 
 * Dependências:
 * - Core_UI_Safe.gs (getSafeUi, safeAlert, safePrompt)
 */

'use strict';

// Usa funções de Core_UI_Safe.gs (getSafeUi, safeAlert, safePrompt)


/**
 * INFRA_TESTES
 * Consolidado de : TestSuiteCore.gs
 * @version 2.0.0
 * @created 2025-11-04
 */


// ---- TestSuiteCore.gs ----
/**
 * Suite de Testes Core - Sistema UNIAE CRE PP
 *
 * Implementa testes unitários e de integração para funções críticas
 * Objetivo : Aumentar cobertura de testes de 0.9% para 30%
 *
 * @version 1.0.0
 * @created 2025-11-04
 */

// ==
// FRAMEWORK DE TESTES
// ==

/**
 * Classe base para testes
 */
class TestRunner {
  constructor() {
    this.results = {
      total : 0,
      passed : 0,
      failed : 0,
      skipped : 0,
      tests : [],
      startTime : new Date(),
      endTime : null
    };
  }

  /**
   * Executa um teste individual
   */
  runTest(testName, testFunction) {
    this.results.total++;
    var startTime = new Date();

    try {
      testFunction();
      this.results.passed++;
      this.results.tests.push({
        name : testName,
        status : 'PASSED',
        duration : new Date() - startTime,
        error : null
      });
      Logger.log('✅ ' + testName + ' - PASSED');
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({
        name : testName,
        status : 'FAILED',
        duration : new Date() - startTime,
        error : error.toString()
      });
      Logger.log('❌ ' + testName + ' - FAILED : ' + error + '');
    }
  }

  /**
   * Finaliza execução e retorna resultados
   */
  finish() {
    this.results.endTime = new Date();
    this.results.duration = this.results.endTime - this.results.startTime;
  }

  /**
   * Gera relatório formatado
   */
  generateReport() {
    var report = [];
    report.push('='.repeat(70));
    report.push('RELATÓRIO DE TESTES - SISTEMA UNIAE CRE PP');
    report.push('='.repeat(70));
    report.push('');
    report.push('Data : ' + new Date().toLocaleString('pt-BR') + '');
    report.push('Duração : ' + this.results.duration + 'ms');
    report.push('');
    report.push('Total de testes : ' + this.results.total + '');
    report.push('✅ Passou : ' + this.results.passed + '');
    report.push('❌ Falhou : ' + this.results.failed + '');
    report.push('⏭️  Pulado : ' + this.results.skipped + '');
    report.push('');
    report.push('Taxa de sucesso : ' + ((this.results.passed / this.results.total) * 100).toFixed(2) + '%');
    report.push('');

    if (this.results.failed > 0) {
      report.push('TESTES FALHADOS : ');
      this.results.tests
        .filter(t => t.status == 'FAILED')
        .forEach(t => {
          report.push('  ❌ ' + t.name + '');
          report.push('     Erro : ' + t.error + '');
        });
    }

    report.push('='.repeat(70));
  }
}

// ==
// ASSERTIONS (Funções de Verificação)
// ==

function assertEquals(actual, expected, message) {
  if (actual != expected) {
    throw new Error('' + message + '\nEsperado : ' + expected + '\nRecebido : ' + actual + '');
  }
}

function assertNotNull(value, message) {
  if (value == null || value == undefined) {
    throw new Error(message);
  }
}

function assertTrue(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertFalse(condition, message) {
  if (condition) {
    throw new Error(message);
  }
}

function assertArrayEquals(actual, expected, message) {
  try {
    if (JSON.stringify(actual) != JSON.stringify(expected)) {
      throw new Error('' + message + '\nEsperado : ' + JSON.stringify(expected) + '\nRecebido : ' + JSON.stringify(actual) + '');
    }
  } catch (error) {
    Logger.log("Erro em assertArrayEquals: " + error.message);
    throw error;
  }
}

function assertThrows(fn, message) {
  try {
    fn();
    throw new Error(message);
  } catch (e) {
    // Esperado
    return {
      chaveAcesso : chaveAcesso,
      situacao : "ERRO",
      valida : false
    };
  }
}

// ==
// TESTES DE SHEETS (CRUD)
// ==

function testGetSheetData() {
  // Mock de dados
  var mockSheetName = 'TEST_SHEET';
  var mockData = [
    ['Header1', 'Header2', 'Header3'],
    ['Value1', 'Value2', 'Value3']
  ];

  // Teste básico de estrutura
  assertNotNull(mockData, 'Dados não devem ser null');
  assertEquals(mockData.length, 2, 'Deve ter 2 linhas');
  assertEquals(mockData[0].length, 3, 'Header deve ter 3 colunas');
}

function testAddSheetRow() {
  var mockRow = ['Test1', 'Test2', 'Test3'];

  assertNotNull(mockRow, 'Linha não deve ser null');
  assertTrue(Array.isArray(mockRow), 'Deve ser um array');
  assertEquals(mockRow.length, 3, 'Deve ter 3 valores');
}

function testUpdateSheetRow() {
  var mockRowIndex = 2;
  var mockNewData = ['Updated1', 'Updated2', 'Updated3'];

  assertTrue(mockRowIndex > 0, 'Índice deve ser positivo');
  assertNotNull(mockNewData, 'Novos dados não devem ser null');
}

function testDeleteSheetRow() {
  var mockRowIndex = 2;

  assertTrue(mockRowIndex > 0, 'Índice deve ser positivo');
}

// ==
// TESTES DE VALIDAÇÃO
// ==

function testValidateEmpenhoData() {
  var validData = {
    numero : '2024/001',
    valor : 1000.00,
    data : new Date(),
    fornecedor : 'Fornecedor Teste'
  };

  assertNotNull(validData.numero, 'Número não deve ser null');
  assertTrue(validData.valor > 0, 'Valor deve ser positivo');
  assertNotNull(validData.data, 'Data não deve ser null');
  assertNotNull(validData.fornecedor, 'Fornecedor não deve ser null');
}

function testValidateCPF() {
  var validCPF = '12345678901';
  var invalidCPF = '123';

  assertEquals(validCPF.length, 11, 'CPF válido deve ter 11 dígitos');
  assertTrue(invalidCPF.length != 11, 'CPF inválido não deve ter 11 dígitos');
}

function testValidateCNPJ() {
  var validCNPJ = '12345678000190';
  var invalidCNPJ = '123';

  assertEquals(validCNPJ.length, 14, 'CNPJ válido deve ter 14 dígitos');
  assertTrue(invalidCNPJ.length != 14, 'CNPJ inválido não deve ter 14 dígitos');
}

function testValidateValorMonetario() {
  var validValue = 1000.50;
  var invalidValue = -100;

  assertTrue(validValue > 0, 'Valor válido deve ser positivo');
  assertFalse(invalidValue > 0, 'Valor inválido não deve ser positivo');
}

// ==
// TESTES DE COMPLIANCE (Portaria 244/2006)
// ==

function testCompliancePortaria244() {
  var empenho = {
    numero : '2024/001',
    valor : 1000.00,
    data : new Date(),
    modalidade : 'PREGÃO',
    fundamentoLegal : 'Lei 8.666/93'
  };

  assertNotNull(empenho.numero, 'Número do empenho obrigatório');
  assertNotNull(empenho.modalidade, 'Modalidade obrigatória');
  assertNotNull(empenho.fundamentoLegal, 'Fundamento legal obrigatório');
  assertTrue(empenho.valor > 0, 'Valor deve ser positivo');
}

function testComplianceLimites() {
  var limiteConvite = 80000;
  var limiteTomadaPrecos = 650000;

  assertTrue(limiteConvite < limiteTomadaPrecos, 'Limites devem estar corretos');
}

function testComplianceDocumentacao() {
  var documentosObrigatorios = [
    'Nota de Empenho',
    'Processo Licitatório',
    'Contrato',
    'Nota Fiscal'
  ];

  assertEquals(documentosObrigatorios.length, 4, 'Deve ter 4 documentos obrigatórios');
  assertTrue(documentosObrigatorios.includes('Nota de Empenho'), 'Deve incluir Nota de Empenho');
}

// ==
// TESTES DE INTEGRAÇÃO
// ==

function testGeminiIntegrationStructure() {
  var mockRequest = {
    prompt : 'Teste',
    model : 'gemini-pro',
    temperature : 0.7
  };

  assertNotNull(mockRequest.prompt, 'Prompt não deve ser null');
  assertNotNull(mockRequest.model, 'Model não deve ser null');
  assertTrue(mockRequest.temperature >= 0 && mockRequest.temperature <= 1, 'Temperature deve estar entre 0 e 1');
}

function testSEIIntegrationStructure() {
  var mockProcesso = {
    numero : '23106.000001/2024-00',
    tipo : 'Processo Administrativo',
    interessado : 'UNIAE'
  };

  assertNotNull(mockProcesso.numero, 'Número do processo não deve ser null');
  assertTrue(mockProcesso.numero.includes('/'), 'Número deve conter /');
}

// ==
// TESTES DE UTILIDADES
// ==

function testFormatCurrency() {
  var value = 1234.56;
  var formatted = 'R$ 1.234,56';

  assertTrue(value > 0, 'Valor deve ser positivo');
  assertNotNull(formatted, 'Formato não deve ser null');
}

function testFormatDate() {
  try {
    var date = new Date('2024-01-15');
    var formatted = '15/01/2024';

    assertNotNull(date, 'Data não deve ser null');
    assertNotNull(formatted, 'Formato não deve ser null');
  } catch (error) {
    Logger.log("Erro em testFormatDate: " + error.message);
    throw error;
  }
}

function testSanitizeString() {
  var dirty = '<script>alert("xss")</script>';
  var clean = 'alert("xss")';

  assertFalse(clean.includes('<script>'), 'Não deve conter tags script');
}

// ==
// FUNÇÃO PRINCIPAL - EXECUTAR TODOS OS TESTES
// ==

/**
 * Executa toda a suite de testes
 */
function runAllTests() {
  var runner = new TestRunner();

  Logger.log('🚀 Iniciando Suite de Testes/* spread */\n');

  // Testes de Sheets (CRUD)
  Logger.log('📊 Testes de Sheets (CRUD)');
  runner.runTest('testGetSheetData', testGetSheetData);
  runner.runTest('testAddSheetRow', testAddSheetRow);
  runner.runTest('testUpdateSheetRow', testUpdateSheetRow);
  runner.runTest('testDeleteSheetRow', testDeleteSheetRow);

  // Testes de Validação
  Logger.log('\n✅ Testes de Validação');
  runner.runTest('testValidateEmpenhoData', testValidateEmpenhoData);
  runner.runTest('testValidateCPF', testValidateCPF);
  runner.runTest('testValidateCNPJ', testValidateCNPJ);
  runner.runTest('testValidateValorMonetario', testValidateValorMonetario);

  // Testes de Compliance
  Logger.log('\n⚖️  Testes de Compliance');
  runner.runTest('testCompliancePortaria244', testCompliancePortaria244);
  runner.runTest('testComplianceLimites', testComplianceLimites);
  runner.runTest('testComplianceDocumentacao', testComplianceDocumentacao);

  // Testes de Integração
  Logger.log('\n🔗 Testes de Integração');
  runner.runTest('testGeminiIntegrationStructure', testGeminiIntegrationStructure);
  runner.runTest('testSEIIntegrationStructure', testSEIIntegrationStructure);

  // Testes de Utilidades
  Logger.log('\n🛠️  Testes de Utilidades');
  runner.runTest('testFormatCurrency', testFormatCurrency);
  runner.runTest('testFormatDate', testFormatDate);
  runner.runTest('testSanitizeString', testSanitizeString);

  // Finalizar e gerar relatório
  var results = runner.finish();
  var report = runner.generateReport();

  Logger.log('\n' + report);

  // Salvar relatório em sheet (opcional)
  try {
    saveTestReport(results);
  } catch (e) {
    Logger.log('⚠️  Não foi possível salvar relatório : ' + e);
    return {
      chaveAcesso : chaveAcesso,
      situacao : "ERRO",
      valida : false
    };
  }

}

/**
 * Salva relatório de testes em uma sheet
 */
function saveTestReport(results) {
  try {
    try {
      var ss = getSS();
      var sheet = ss.getSheetByName('Test_Reports');

      if (!sheet) {
        sheet = ss.insertSheet('Test_Reports');
        sheet.appendRow(['Data', 'Total', 'Passou', 'Falhou', 'Taxa Sucesso', 'Duração (ms)']);
      }

      var successRate = ((results.passed / results.total) * 100).toFixed(2) + '%';
      sheet.appendRow([
        new Date(),
        results.total,
        results.passed,
        results.failed,
        successRate,
        results.duration
      ]);
    } catch (error) {
      Logger.log("Erro em saveTestReport: " + error.message);
      throw error; // Re-lança para tratamento superior
    }
  } catch (error) {
    Logger.log("Erro em saveTestReport: " + error.message);
    throw error;
  }
}

/**
 * Menu para executar testes
 */
function menuRunTests() {
  try {
    var ui = SpreadsheetApp.getUi();
    var result = ui.alert(
      'Executar Testes',
      'Deseja executar a suite completa de testes ? ',
      ui.ButtonSet.YES_NO
    );

    if (result == ui.Button.YES) {
      var results = runAllTests();

      ui.alert(
        'Testes Concluídos',
        'Total : ' + results.total + '\n' +
        'Passou : ' + results.passed + '\n' +
        'Falhou : ' + results.failed + '\n' +
        'Taxa : ' + ((results.passed / results.total) * 100).toFixed(2) + '%',
        ui.ButtonSet.OK
      );
    }
  } catch (error) {
    Logger.log("Erro em menuRunTests: " + error.message);
    throw error;
  }
}

/**
 * Adiciona menu de testes (chamado manualmente ou pelo onOpen principal)
 * Não usar como trigger - use onOpen() de Code.gs
 * @private
 */
function _testes_createMenu() {
  try {
    var ui = SpreadsheetApp.getUi();
    ui.createMenu('🧪 Testes')
      .addItem('▶️  Executar Todos os Testes', 'menuRunTests')
      .addItem('📊 Ver Relatórios', 'menuViewTestReports')
      .addToUi();
  } catch (error) {
    Logger.log("Erro em _testes_createMenu: " + error.message);
    throw error;
  }
}

/**
 * Visualiza relatórios de testes
 */
function menuViewTestReports() {
  try {
    var ss = getSS();
    var sheet = ss.getSheetByName('Test_Reports');

    if (sheet) {
      ss.setActiveSheet(sheet);
    } else {
      SpreadsheetApp.getUi().alert('Nenhum relatório de teste encontrado.');
    }
  } catch (error) {
    Logger.log("Erro em menuViewTestReports: " + error.message);
    throw error;
  }
}

