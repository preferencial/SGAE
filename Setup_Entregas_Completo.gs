/**
 * @fileoverview Setup Completo de Entregas - Dados Sintéticos
 * @version 1.0.0
 * @description Cria dados sintéticos abrangentes para testar todos os
 * cenários de entregas do sistema UNIAE CRE.
 * 
 * CENÁRIOS COBERTOS:
 * - Entrega completa aceita
 * - Entrega parcial (quantidade menor)
 * - Entrega recusada totalmente
 * - Entrega agendada (futura)
 * - Entrega em trânsito
 * - Entrega com problema de qualidade
 * - Entrega cancelada
 * - Entregas de diferentes fornecedores
 * - Entregas para diferentes escolas
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-19
 */

'use strict';

// ============================================================================
// DADOS SINTÉTICOS DE ENTREGAS - CENÁRIOS COMPLETOS
// ============================================================================

var ENTREGAS_SINTETICAS = [
  {
    id: 'ENT-2025-0001',
    dataEntrega: new Date(2025, 11, 10),
    unidadeEscolar: 'EC 308 Sul',
    fornecedor: 'Laticínios Brasília LTDA',
    produtoCodigo: 'LAT001',
    produtoDescricao: 'Leite Integral UHT 1L',
    quantidadeSolicitada: 200,
    quantidadeEntregue: 200,
    unidadeMedida: 'litros',
    valorUnitario: 5.50,
    valorTotal: 1100.00,
    statusEntrega: 'ENTREGUE',
    qualidadeOK: 'SIM',
    responsavelRecebimento: 'Maria Silva Santos',
    observacoes: 'Entrega completa. Produtos em perfeito estado.',
    pdgpReferencia: 'PDGP-2025-001'
  },
  {
    id: 'ENT-2025-0002',
    dataEntrega: new Date(2025, 11, 11),
    unidadeEscolar: 'CEF 01 Taguatinga',
    fornecedor: 'Frigorífico Central DF',
    produtoCodigo: 'CAR001',
    produtoDescricao: 'Carne Bovina Moída Resfriada',
    quantidadeSolicitada: 100,
    quantidadeEntregue: 100,
    unidadeMedida: 'kg',
    valorUnitario: 32.00,
    valorTotal: 3200.00,
    statusEntrega: 'ENTREGUE',
    qualidadeOK: 'SIM',
    responsavelRecebimento: 'João Pedro Oliveira',
    observacoes: 'Temperatura verificada: 4°C. OK.',
    pdgpReferencia: 'PDGP-2025-002'
  },
  {
    id: 'ENT-2025-0003',
    dataEntrega: new Date(2025, 11, 12),
    unidadeEscolar: 'EC 05 Ceilândia',
    fornecedor: 'Panificadora Pão Dourado',
    produtoCodigo: 'PAN001',
    produtoDescricao: 'Pão Francês 50g',
    quantidadeSolicitada: 500,
    quantidadeEntregue: 380,
    unidadeMedida: 'unidades',
    valorUnitario: 0.80,
    valorTotal: 304.00,
    statusEntrega: 'PARCIAL',
    qualidadeOK: 'PARCIAL',
    responsavelRecebimento: 'Ana Paula Costa',
    observacoes: '120 unidades recusadas por embalagem violada.',
    pdgpReferencia: 'PDGP-2025-003'
  },
  {
    id: 'ENT-2025-0004',
    dataEntrega: new Date(2025, 11, 13),
    unidadeEscolar: 'CED 01 Samambaia',
    fornecedor: 'Laticínios Brasília LTDA',
    produtoCodigo: 'LAT002',
    produtoDescricao: 'Iogurte Natural 170g',
    quantidadeSolicitada: 200,
    quantidadeEntregue: 0,
    unidadeMedida: 'unidades',
    valorUnitario: 3.50,
    valorTotal: 0.00,
    statusEntrega: 'RECUSADA',
    qualidadeOK: 'NAO',
    responsavelRecebimento: 'Carlos Mendes',
    observacoes: 'Lote inteiro com validade vencida. Recusa total.',
    pdgpReferencia: 'PDGP-2025-004'
  },
  {
    id: 'ENT-2025-0005',
    dataEntrega: new Date(2025, 11, 14),
    unidadeEscolar: 'EC 102 Norte',
    fornecedor: 'Distribuidora Grãos do Cerrado',
    produtoCodigo: 'GRA001',
    produtoDescricao: 'Arroz Tipo 1 5kg',
    quantidadeSolicitada: 50,
    quantidadeEntregue: 20,
    unidadeMedida: 'pacotes',
    valorUnitario: 28.00,
    valorTotal: 560.00,
    statusEntrega: 'PARCIAL',
    qualidadeOK: 'SIM',
    responsavelRecebimento: 'Fernanda Lima',
    observacoes: 'Entrega parcial. Restante será entregue amanhã.',
    pdgpReferencia: 'PDGP-2025-005'
  },
  {
    id: 'ENT-2025-0006',
    dataEntrega: new Date(2025, 11, 20),
    unidadeEscolar: 'CEF 03 Gama',
    fornecedor: 'Hortifruti Central DF',
    produtoCodigo: 'HOR001',
    produtoDescricao: 'Maçã Fuji',
    quantidadeSolicitada: 100,
    quantidadeEntregue: 0,
    unidadeMedida: 'kg',
    valorUnitario: 8.50,
    valorTotal: 0.00,
    statusEntrega: 'AGENDADA',
    qualidadeOK: '',
    responsavelRecebimento: '',
    observacoes: 'Entrega agendada para 20/12/2025.',
    pdgpReferencia: 'PDGP-2025-006'
  },
  {
    id: 'ENT-2025-0007',
    dataEntrega: new Date(2025, 11, 19),
    unidadeEscolar: 'EC 01 Plano Piloto',
    fornecedor: 'Frigorífico Central DF',
    produtoCodigo: 'CAR002',
    produtoDescricao: 'Frango Inteiro Congelado',
    quantidadeSolicitada: 80,
    quantidadeEntregue: 0,
    unidadeMedida: 'kg',
    valorUnitario: 18.00,
    valorTotal: 0.00,
    statusEntrega: 'EM_TRANSITO',
    qualidadeOK: '',
    responsavelRecebimento: '',
    observacoes: 'Veículo saiu do depósito às 06:30.',
    pdgpReferencia: 'PDGP-2025-007'
  },
  {
    id: 'ENT-2025-0008',
    dataEntrega: new Date(2025, 11, 17),
    unidadeEscolar: 'CED 02 Recanto das Emas',
    fornecedor: 'Laticínios Brasília LTDA',
    produtoCodigo: 'LAT003',
    produtoDescricao: 'Queijo Mussarela Fatiado',
    quantidadeSolicitada: 50,
    quantidadeEntregue: 50,
    unidadeMedida: 'kg',
    valorUnitario: 45.00,
    valorTotal: 2250.00,
    statusEntrega: 'ENTREGUE',
    qualidadeOK: 'SIM',
    responsavelRecebimento: 'Marcos Pereira',
    observacoes: 'Entrega OK após substituição do lote anterior.',
    pdgpReferencia: 'PDGP-2025-008'
  },
  {
    id: 'ENT-2025-0009',
    dataEntrega: new Date(2025, 11, 18),
    unidadeEscolar: 'EC 10 Sobradinho',
    fornecedor: 'Distribuidora Grãos do Cerrado',
    produtoCodigo: 'GRA002',
    produtoDescricao: 'Feijão Carioca Tipo 1 1kg',
    quantidadeSolicitada: 100,
    quantidadeEntregue: 0,
    unidadeMedida: 'pacotes',
    valorUnitario: 9.50,
    valorTotal: 0.00,
    statusEntrega: 'RECUSADA',
    qualidadeOK: 'NAO',
    responsavelRecebimento: 'Lucia Ferreira',
    observacoes: 'Presença de carunchos. Recusa total.',
    pdgpReferencia: 'PDGP-2025-009'
  },
  {
    id: 'ENT-2025-0010',
    dataEntrega: new Date(2025, 11, 15),
    unidadeEscolar: 'CEF 04 Planaltina',
    fornecedor: 'Hortifruti Central DF',
    produtoCodigo: 'HOR002',
    produtoDescricao: 'Alface Crespa',
    quantidadeSolicitada: 80,
    quantidadeEntregue: 0,
    unidadeMedida: 'maços',
    valorUnitario: 4.00,
    valorTotal: 0.00,
    statusEntrega: 'CANCELADA',
    qualidadeOK: '',
    responsavelRecebimento: '',
    observacoes: 'Cancelada por falta de produto no fornecedor.',
    pdgpReferencia: 'PDGP-2025-010'
  }
];



// ============================================================================
// FUNÇÕES DE INICIALIZAÇÃO E VALIDAÇÃO
// ============================================================================

/**
 * Popula a aba Entregas com dados sintéticos
 * @returns {Object} Resultado da operação
 */
function popularEntregasSinteticas() {
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
          var sheetName = 'Entregas';
          var sheet = ss.getSheetByName(sheetName);
    
          if (!sheet) {
            sheet = ss.insertSheet(sheetName);
            Logger.log('Aba ' + sheetName + ' criada.');
          }
    
          var headers = [
            'ID', 'Data_Entrega', 'Unidade_Escolar', 'Fornecedor', 'Produto_Codigo',
            'Produto_Descricao', 'Quantidade_Solicitada', 'Quantidade_Entregue',
            'Unidade_Medida', 'Valor_Unitario', 'Valor_Total', 'Status_Entrega',
            'Qualidade_OK', 'Responsavel_Recebimento', 'Observacoes', 'PDGP_Referencia'
          ];
    
          sheet.clear();
          sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
          sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    
          var dados = ENTREGAS_SINTETICAS.map(function(ent) {
            return [
              ent.id, ent.dataEntrega, ent.unidadeEscolar, ent.fornecedor,
              ent.produtoCodigo, ent.produtoDescricao, ent.quantidadeSolicitada,
              ent.quantidadeEntregue, ent.unidadeMedida, ent.valorUnitario,
              ent.valorTotal, ent.statusEntrega, ent.qualidadeOK,
              ent.responsavelRecebimento, ent.observacoes, ent.pdgpReferencia
            ];
          });
    
          if (dados.length > 0) {
            sheet.getRange(2, 1, dados.length, headers.length).setValues(dados);
            resultado.registrosInseridos = dados.length;
          }
    
          resultado.sucesso = true;
          resultado.tempoExecucao = new Date() - startTime;
          Logger.log('✅ Entregas populadas: ' + resultado.registrosInseridos + ' registros');
    
        } catch (e) {
          resultado.erros.push(e.message);
          Logger.log('❌ Erro ao popular Entregas: ' + e.message);
        }
  
        return resultado;
      } catch (error) {
        Logger.log("Erro em popularEntregasSinteticas: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em popularEntregasSinteticas: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em popularEntregasSinteticas: " + error.message);
    throw error;
  }
}

/**
 * Valida a estrutura e dados da aba Entregas
 */
function validarEntregas() {
  try {
    try {
      var resultado = {
        valido: true,
        totalRegistros: 0,
        porStatus: {},
        erros: [],
        avisos: []
      };
  
      try {
        var ss = getSS();
        var sheet = ss.getSheetByName('Entregas');
    
        if (!sheet) {
          resultado.valido = false;
          resultado.erros.push('Aba Entregas não encontrada');
          return resultado;
        }
    
        var dados = sheet.getDataRange().getValues();
        if (dados.length <= 1) {
          resultado.avisos.push('Aba vazia ou apenas com headers');
          return resultado;
        }
    
        var headers = dados[0];
        resultado.totalRegistros = dados.length - 1;
    
        var statusIndex = headers.indexOf('Status_Entrega');
        if (statusIndex >= 0) {
          for (var i = 1; i < dados.length; i++) {
            var status = dados[i][statusIndex] || 'SEM_STATUS';
            resultado.porStatus[status] = (resultado.porStatus[status] || 0) + 1;
          }
        }
    
        Logger.log('✅ Validação Entregas: ' + resultado.totalRegistros + ' registros');
        Logger.log('   Por status: ' + JSON.stringify(resultado.porStatus));
    
      } catch (e) {
        resultado.valido = false;
        resultado.erros.push(e.message);
      }
  
      return resultado;
    } catch (error) {
      Logger.log("Erro em validarEntregas: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em validarEntregas: " + error.message);
    throw error;
  }
}

/**
 * Executa setup completo de Entregas
 */
function setupEntregasCompleto() {
  Logger.log('=== SETUP ENTREGAS COMPLETO ===');
  var resultadoPopular = popularEntregasSinteticas();
  var resultadoValidar = validarEntregas();
  return { popular: resultadoPopular, validar: resultadoValidar };
}
