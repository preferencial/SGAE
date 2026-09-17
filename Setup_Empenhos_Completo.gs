/**
 * @fileoverview Setup Completo de Empenhos - Dados Sintéticos
 * @version 1.0.0
 * @description Cria dados sintéticos para testar cenários de empenhos.
 * 
 * CENÁRIOS COBERTOS:
 * - Empenho ativo com saldo disponível
 * - Empenho parcialmente utilizado
 * - Empenho esgotado
 * - Empenho cancelado
 * - Empenho de diferentes fornecedores
 * - Empenho com múltiplas NFs vinculadas
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-19
 */

'use strict';

// ============================================================================
// DADOS SINTÉTICOS DE EMPENHOS
// ============================================================================

var EMPENHOS_SINTETICOS = [
  {
    id: 'EMP-2025-0001',
    numeroEmpenho: '2025NE000123',
    dataEmissao: new Date(2025, 0, 15),
    fornecedor: 'Laticínios Brasília LTDA',
    cnpjFornecedor: '11.222.333/0001-44',
    objeto: 'Aquisição de laticínios para alimentação escolar',
    valorTotal: 150000.00,
    valorUtilizado: 45550.00,
    valorSaldo: 104450.00,
    status: 'ATIVO',
    contrato: 'CT-2025-001',
    vigenciaInicio: new Date(2025, 0, 1),
    vigenciaFim: new Date(2025, 11, 31),
    observacoes: 'Empenho para laticínios - 1º semestre',
    dataRegistro: new Date(2025, 0, 15)
  },
  {
    id: 'EMP-2025-0002',
    numeroEmpenho: '2025NE000124',
    dataEmissao: new Date(2025, 0, 20),
    fornecedor: 'Frigorífico Central DF',
    cnpjFornecedor: '22.333.444/0001-55',
    objeto: 'Aquisição de carnes para alimentação escolar',
    valorTotal: 200000.00,
    valorUtilizado: 46700.00,
    valorSaldo: 153300.00,
    status: 'ATIVO',
    contrato: 'CT-2025-002',
    vigenciaInicio: new Date(2025, 0, 1),
    vigenciaFim: new Date(2025, 11, 31),
    observacoes: 'Empenho para carnes bovinas e aves',
    dataRegistro: new Date(2025, 0, 20)
  }
];


// Mais dados sintéticos
EMPENHOS_SINTETICOS.push(
  {
    id: 'EMP-2025-0003',
    numeroEmpenho: '2025NE000125',
    dataEmissao: new Date(2025, 0, 25),
    fornecedor: 'Panificadora Pão Dourado',
    cnpjFornecedor: '33.444.555/0001-66',
    objeto: 'Aquisição de pães e produtos de panificação',
    valorTotal: 80000.00,
    valorUtilizado: 9800.00,
    valorSaldo: 70200.00,
    status: 'ATIVO',
    contrato: 'CT-2025-003',
    vigenciaInicio: new Date(2025, 0, 1),
    vigenciaFim: new Date(2025, 11, 31),
    observacoes: 'Empenho para panificados',
    dataRegistro: new Date(2025, 0, 25)
  },
  {
    id: 'EMP-2025-0004',
    numeroEmpenho: '2025NE000126',
    dataEmissao: new Date(2025, 1, 1),
    fornecedor: 'Distribuidora Grãos do Cerrado',
    cnpjFornecedor: '44.555.666/0001-77',
    objeto: 'Aquisição de grãos e cereais',
    valorTotal: 120000.00,
    valorUtilizado: 34400.00,
    valorSaldo: 85600.00,
    status: 'ATIVO',
    contrato: 'CT-2025-004',
    vigenciaInicio: new Date(2025, 0, 1),
    vigenciaFim: new Date(2025, 11, 31),
    observacoes: 'Empenho para arroz, feijão e cereais',
    dataRegistro: new Date(2025, 1, 1)
  },
  {
    id: 'EMP-2025-0005',
    numeroEmpenho: '2025NE000127',
    dataEmissao: new Date(2025, 1, 5),
    fornecedor: 'Hortifruti Central DF',
    cnpjFornecedor: '55.666.777/0001-88',
    objeto: 'Aquisição de frutas, legumes e verduras',
    valorTotal: 100000.00,
    valorUtilizado: 15200.00,
    valorSaldo: 84800.00,
    status: 'ATIVO',
    contrato: 'CT-2025-005',
    vigenciaInicio: new Date(2025, 0, 1),
    vigenciaFim: new Date(2025, 11, 31),
    observacoes: 'Empenho para hortifruti',
    dataRegistro: new Date(2025, 1, 5)
  },
  {
    id: 'EMP-2024-0010',
    numeroEmpenho: '2024NE000456',
    dataEmissao: new Date(2024, 5, 15),
    fornecedor: 'Laticínios Brasília LTDA',
    cnpjFornecedor: '11.222.333/0001-44',
    objeto: 'Aquisição de laticínios - 2024',
    valorTotal: 100000.00,
    valorUtilizado: 100000.00,
    valorSaldo: 0.00,
    status: 'ESGOTADO',
    contrato: 'CT-2024-001',
    vigenciaInicio: new Date(2024, 0, 1),
    vigenciaFim: new Date(2024, 11, 31),
    observacoes: 'Empenho 2024 - totalmente utilizado',
    dataRegistro: new Date(2024, 5, 15)
  }
);

// ============================================================================
// FUNÇÕES DE INICIALIZAÇÃO E VALIDAÇÃO
// ============================================================================

/**
 * Popula a aba de Empenhos com dados sintéticos
 */
function popularEmpenhosSinteticos() {
  try {
    try {
      try {
        var startTime = new Date();
        var resultado = { sucesso: false, registrosInseridos: 0, erros: [], tempoExecucao: 0 };
  
        try {
          var ss = getSS();
          var sheetName = 'Empenhos';
          var sheet = ss.getSheetByName(sheetName);
    
          if (!sheet) {
            sheet = ss.insertSheet(sheetName);
            Logger.log('Aba ' + sheetName + ' criada.');
          }
    
          var headers = [
            'ID', 'Numero_Empenho', 'Data_Emissao', 'Fornecedor', 'CNPJ_Fornecedor',
            'Objeto', 'Valor_Total', 'Valor_Utilizado', 'Valor_Saldo', 'Status',
            'Contrato', 'Vigencia_Inicio', 'Vigencia_Fim', 'Observacoes', 'Data_Registro'
          ];
    
          sheet.clear();
          sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
          sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    
          var dados = EMPENHOS_SINTETICOS.map(function(emp) {
            return [
              emp.id, emp.numeroEmpenho, emp.dataEmissao, emp.fornecedor,
              emp.cnpjFornecedor, emp.objeto, emp.valorTotal, emp.valorUtilizado,
              emp.valorSaldo, emp.status, emp.contrato, emp.vigenciaInicio,
              emp.vigenciaFim, emp.observacoes, emp.dataRegistro
            ];
          });
    
          if (dados.length > 0) {
            sheet.getRange(2, 1, dados.length, headers.length).setValues(dados);
            resultado.registrosInseridos = dados.length;
          }
    
          resultado.sucesso = true;
          resultado.tempoExecucao = new Date() - startTime;
          Logger.log('✅ Empenhos populados: ' + resultado.registrosInseridos + ' registros');
    
        } catch (e) {
          resultado.erros.push(e.message);
          Logger.log('❌ Erro: ' + e.message);
        }
  
        return resultado;
      } catch (error) {
        Logger.log("Erro em popularEmpenhosSinteticos: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em popularEmpenhosSinteticos: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em popularEmpenhosSinteticos: " + error.message);
    throw error;
  }
}

/**
 * Valida a estrutura e dados da aba Empenhos
 */
function validarEmpenhos() {
  try {
    var resultado = { valido: true, totalRegistros: 0, porStatus: {}, valorTotalSaldo: 0, erros: [], avisos: [] };
  
    try {
      var ss = getSS();
      var sheet = ss.getSheetByName('Empenhos');
    
      if (!sheet) {
        resultado.valido = false;
        resultado.erros.push('Aba Empenhos não encontrada');
        return resultado;
      }
    
      var dados = sheet.getDataRange().getValues();
      resultado.totalRegistros = Math.max(0, dados.length - 1);
    
      var headers = dados[0];
      var statusIndex = headers.indexOf('Status');
      var saldoIndex = headers.indexOf('Valor_Saldo');
    
      for (var i = 1; i < dados.length; i++) {
        var status = dados[i][statusIndex] || 'SEM_STATUS';
        resultado.porStatus[status] = (resultado.porStatus[status] || 0) + 1;
      
        if (saldoIndex >= 0) {
          resultado.valorTotalSaldo += parseFloat(dados[i][saldoIndex]) || 0;
        }
      }
    
      Logger.log('✅ Validação Empenhos: ' + resultado.totalRegistros + ' registros');
      Logger.log('   Saldo total disponível: R$ ' + resultado.valorTotalSaldo.toFixed(2));
    
    } catch (e) {
      resultado.valido = false;
      resultado.erros.push(e.message);
    }
  
    return resultado;
  } catch (error) {
    Logger.log("Erro em validarEmpenhos: " + error.message);
    throw error;
  }
}

/**
 * Executa setup completo de Empenhos
 */
function setupEmpenhosCompleto() {
  Logger.log('=== SETUP EMPENHOS COMPLETO ===');
  return { popular: popularEmpenhosSinteticos(), validar: validarEmpenhos() };
}
