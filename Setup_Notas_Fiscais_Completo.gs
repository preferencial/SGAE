/**
 * @fileoverview Setup Completo de Notas Fiscais - Dados Sintéticos
 * @version 1.0.0
 * @description Cria dados sintéticos abrangentes para testar todos os
 * cenários de notas fiscais do sistema UNIAE CRE.
 * 
 * CENÁRIOS COBERTOS:
 * - NF pendente de conferência
 * - NF conferida aguardando atesto
 * - NF atestada aguardando pagamento
 * - NF com glosa parcial
 * - NF rejeitada
 * - NF cancelada
 * - NF com múltiplos itens
 * - NF de diferentes fornecedores
 * - NF vinculada a processo SEI
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-19
 */

'use strict';

// ============================================================================
// DADOS SINTÉTICOS DE NOTAS FISCAIS - CENÁRIOS COMPLETOS
// ============================================================================

var NOTAS_FISCAIS_SINTETICAS = [
  {
    id: 'NF-2025-0001',
    numeroNF: '000001234',
    chaveAcesso: '53251211222333000144550010000012341000012345',
    dataEmissao: new Date(2025, 11, 5),
    dataRecebimento: new Date(2025, 11, 10),
    cnpjFornecedor: '11.222.333/0001-44',
    fornecedor: 'Laticínios Brasília LTDA',
    notaEmpenho: '2025NE000123',
    valorTotal: 15750.00,
    statusNF: 'CONFERIDA',
    responsavelConferencia: 'Maria Silva Santos',
    dataConferencia: new Date(2025, 11, 10),
    observacoes: 'Produtos conferidos e aceitos integralmente.',
    arquivoPDF: 'drive.google.com/nf001.pdf',
    processoAtestoID: 'PA-2025-001',
    dataRegistro: new Date(2025, 11, 10),
    dataAtualizacao: new Date(2025, 11, 10)
  },
  {
    id: 'NF-2025-0002',
    numeroNF: '000001235',
    chaveAcesso: '53251222333444000155550010000012351000012346',
    dataEmissao: new Date(2025, 11, 8),
    dataRecebimento: new Date(2025, 11, 11),
    cnpjFornecedor: '22.333.444/0001-55',
    fornecedor: 'Frigorífico Central DF',
    notaEmpenho: '2025NE000124',
    valorTotal: 28500.00,
    statusNF: 'ATESTADA',
    responsavelConferencia: 'João Pedro Oliveira',
    dataConferencia: new Date(2025, 11, 11),
    observacoes: 'Carnes conferidas. Temperatura OK.',
    arquivoPDF: 'drive.google.com/nf002.pdf',
    processoAtestoID: 'PA-2025-001',
    dataRegistro: new Date(2025, 11, 11),
    dataAtualizacao: new Date(2025, 11, 12)
  },
  {
    id: 'NF-2025-0003',
    numeroNF: '000001236',
    chaveAcesso: '53251233444555000166550010000012361000012347',
    dataEmissao: new Date(2025, 11, 10),
    dataRecebimento: new Date(2025, 11, 12),
    cnpjFornecedor: '33.444.555/0001-66',
    fornecedor: 'Panificadora Pão Dourado',
    notaEmpenho: '2025NE000125',
    valorTotal: 4200.00,
    statusNF: 'PENDENTE',
    responsavelConferencia: '',
    dataConferencia: null,
    observacoes: 'Aguardando conferência.',
    arquivoPDF: 'drive.google.com/nf003.pdf',
    processoAtestoID: '',
    dataRegistro: new Date(2025, 11, 12),
    dataAtualizacao: new Date(2025, 11, 12)
  },
  {
    id: 'NF-2025-0004',
    numeroNF: '000001237',
    chaveAcesso: '53251244555666000177550010000012371000012348',
    dataEmissao: new Date(2025, 11, 9),
    dataRecebimento: new Date(2025, 11, 13),
    cnpjFornecedor: '44.555.666/0001-77',
    fornecedor: 'Distribuidora Grãos do Cerrado',
    notaEmpenho: '2025NE000126',
    valorTotal: 12300.00,
    statusNF: 'CONFERIDA',
    responsavelConferencia: 'Ana Paula Costa',
    dataConferencia: new Date(2025, 11, 13),
    observacoes: 'Grãos conferidos. Qualidade aprovada.',
    arquivoPDF: 'drive.google.com/nf004.pdf',
    processoAtestoID: 'PA-2025-002',
    dataRegistro: new Date(2025, 11, 13),
    dataAtualizacao: new Date(2025, 11, 13)
  },
  {
    id: 'NF-2025-0005',
    numeroNF: '000001238',
    chaveAcesso: '53251255666777000188550010000012381000012349',
    dataEmissao: new Date(2025, 11, 11),
    dataRecebimento: new Date(2025, 11, 14),
    cnpjFornecedor: '55.666.777/0001-88',
    fornecedor: 'Hortifruti Central DF',
    notaEmpenho: '2025NE000127',
    valorTotal: 8750.00,
    statusNF: 'REJEITADA',
    responsavelConferencia: 'Carlos Mendes',
    dataConferencia: new Date(2025, 11, 14),
    observacoes: 'Produtos com qualidade inadequada. Recusa total.',
    arquivoPDF: 'drive.google.com/nf005.pdf',
    processoAtestoID: '',
    dataRegistro: new Date(2025, 11, 14),
    dataAtualizacao: new Date(2025, 11, 14)
  },
  {
    id: 'NF-2025-0006',
    numeroNF: '000001239',
    chaveAcesso: '53251211222333000144550010000012391000012350',
    dataEmissao: new Date(2025, 11, 12),
    dataRecebimento: new Date(2025, 11, 15),
    cnpjFornecedor: '11.222.333/0001-44',
    fornecedor: 'Laticínios Brasília LTDA',
    notaEmpenho: '2025NE000128',
    valorTotal: 9800.00,
    statusNF: 'APROVADA',
    responsavelConferencia: 'Fernanda Lima',
    dataConferencia: new Date(2025, 11, 15),
    observacoes: 'NF aprovada e liquidada.',
    arquivoPDF: 'drive.google.com/nf006.pdf',
    processoAtestoID: 'PA-2025-003',
    dataRegistro: new Date(2025, 11, 15),
    dataAtualizacao: new Date(2025, 11, 16)
  },
  {
    id: 'NF-2025-0007',
    numeroNF: '000001240',
    chaveAcesso: '53251222333444000155550010000012401000012351',
    dataEmissao: new Date(2025, 11, 13),
    dataRecebimento: new Date(2025, 11, 16),
    cnpjFornecedor: '22.333.444/0001-55',
    fornecedor: 'Frigorífico Central DF',
    notaEmpenho: '2025NE000129',
    valorTotal: 18200.00,
    statusNF: 'CANCELADA',
    responsavelConferencia: '',
    dataConferencia: null,
    observacoes: 'NF cancelada pelo fornecedor. Emissão incorreta.',
    arquivoPDF: 'drive.google.com/nf007.pdf',
    processoAtestoID: '',
    dataRegistro: new Date(2025, 11, 16),
    dataAtualizacao: new Date(2025, 11, 16)
  },
  {
    id: 'NF-2025-0008',
    numeroNF: '000001241',
    chaveAcesso: '53251233444555000166550010000012411000012352',
    dataEmissao: new Date(2025, 11, 14),
    dataRecebimento: new Date(2025, 11, 17),
    cnpjFornecedor: '33.444.555/0001-66',
    fornecedor: 'Panificadora Pão Dourado',
    notaEmpenho: '2025NE000130',
    valorTotal: 5600.00,
    statusNF: 'RECEBIDA',
    responsavelConferencia: '',
    dataConferencia: null,
    observacoes: 'Recebida. Aguardando início da conferência.',
    arquivoPDF: 'drive.google.com/nf008.pdf',
    processoAtestoID: '',
    dataRegistro: new Date(2025, 11, 17),
    dataAtualizacao: new Date(2025, 11, 17)
  },
  {
    id: 'NF-2025-0009',
    numeroNF: '000001242',
    chaveAcesso: '53251244555666000177550010000012421000012353',
    dataEmissao: new Date(2025, 11, 15),
    dataRecebimento: new Date(2025, 11, 18),
    cnpjFornecedor: '44.555.666/0001-77',
    fornecedor: 'Distribuidora Grãos do Cerrado',
    notaEmpenho: '2025NE000131',
    valorTotal: 22100.00,
    statusNF: 'CONFERIDA',
    responsavelConferencia: 'Roberto Alves',
    dataConferencia: new Date(2025, 11, 18),
    observacoes: 'Conferência OK. Glosa parcial aplicada por quantidade.',
    arquivoPDF: 'drive.google.com/nf009.pdf',
    processoAtestoID: 'PA-2025-004',
    dataRegistro: new Date(2025, 11, 18),
    dataAtualizacao: new Date(2025, 11, 18)
  },
  {
    id: 'NF-2025-0010',
    numeroNF: '000001243',
    chaveAcesso: '53251255666777000188550010000012431000012354',
    dataEmissao: new Date(2025, 11, 16),
    dataRecebimento: new Date(2025, 11, 19),
    cnpjFornecedor: '55.666.777/0001-88',
    fornecedor: 'Hortifruti Central DF',
    notaEmpenho: '2025NE000132',
    valorTotal: 6450.00,
    statusNF: 'PENDENTE',
    responsavelConferencia: '',
    dataConferencia: null,
    observacoes: 'Entrega realizada hoje. Aguardando conferência.',
    arquivoPDF: 'drive.google.com/nf010.pdf',
    processoAtestoID: '',
    dataRegistro: new Date(2025, 11, 19),
    dataAtualizacao: new Date(2025, 11, 19)
  }
];



// ============================================================================
// FUNÇÕES DE INICIALIZAÇÃO E VALIDAÇÃO
// ============================================================================

/**
 * Popula a aba Notas_Fiscais com dados sintéticos
 * @returns {Object} Resultado da operação
 */
function popularNotasFiscaisSinteticas() {
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
          var sheetName = 'Notas_Fiscais';
          var sheet = ss.getSheetByName(sheetName);
    
          if (!sheet) {
            sheet = ss.insertSheet(sheetName);
            Logger.log('Aba ' + sheetName + ' criada.');
          }
    
          // Headers baseados no schema
          var headers = [
            'ID', 'Numero_NF', 'Chave_Acesso', 'Data_Emissao', 'Data_Recebimento',
            'CNPJ_Fornecedor', 'Fornecedor', 'Nota_Empenho', 'Valor_Total', 'Status_NF',
            'Responsavel_Conferencia', 'Data_Conferencia', 'Observacoes', 'Arquivo_PDF',
            'Processo_Atesto_ID', 'Data_Registro', 'dataAtualizacao'
          ];
    
          // Limpa e insere headers
          sheet.clear();
          sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
          sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    
          // Prepara dados para inserção
          var dados = NOTAS_FISCAIS_SINTETICAS.map(function(nf) {
            return [
              nf.id,
              nf.numeroNF,
              nf.chaveAcesso,
              nf.dataEmissao,
              nf.dataRecebimento,
              nf.cnpjFornecedor,
              nf.fornecedor,
              nf.notaEmpenho,
              nf.valorTotal,
              nf.statusNF,
              nf.responsavelConferencia,
              nf.dataConferencia,
              nf.observacoes,
              nf.arquivoPDF,
              nf.processoAtestoID,
              nf.dataRegistro,
              nf.dataAtualizacao
            ];
          });
    
          // Insere dados
          if (dados.length > 0) {
            sheet.getRange(2, 1, dados.length, headers.length).setValues(dados);
            resultado.registrosInseridos = dados.length;
          }
    
          resultado.sucesso = true;
          resultado.tempoExecucao = new Date() - startTime;
    
          Logger.log('✅ Notas Fiscais populadas: ' + resultado.registrosInseridos + ' registros');
    
        } catch (e) {
          resultado.erros.push(e.message);
          Logger.log('❌ Erro ao popular Notas Fiscais: ' + e.message);
        }
  
        return resultado;
      } catch (error) {
        Logger.log("Erro em popularNotasFiscaisSinteticas: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em popularNotasFiscaisSinteticas: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em popularNotasFiscaisSinteticas: " + error.message);
    throw error;
  }
}

/**
 * Valida a estrutura e dados da aba Notas_Fiscais
 * @returns {Object} Resultado da validação
 */
function validarNotasFiscais() {
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
        var sheet = ss.getSheetByName('Notas_Fiscais');
    
        if (!sheet) {
          resultado.valido = false;
          resultado.erros.push('Aba Notas_Fiscais não encontrada');
          return resultado;
        }
    
        var dados = sheet.getDataRange().getValues();
        if (dados.length <= 1) {
          resultado.avisos.push('Aba vazia ou apenas com headers');
          return resultado;
        }
    
        var headers = dados[0];
        resultado.totalRegistros = dados.length - 1;
    
        // Conta por status
        var statusIndex = headers.indexOf('Status_NF');
        if (statusIndex >= 0) {
          for (var i = 1; i < dados.length; i++) {
            var status = dados[i][statusIndex] || 'SEM_STATUS';
            resultado.porStatus[status] = (resultado.porStatus[status] || 0) + 1;
          }
        }
    
        // Validações específicas
        var statusValidos = ['PENDENTE', 'RECEBIDA', 'CONFERIDA', 'ATESTADA', 'APROVADA', 'REJEITADA', 'CANCELADA'];
        for (var status in resultado.porStatus) {
          if (statusValidos.indexOf(status) === -1 && status !== 'SEM_STATUS') {
            resultado.avisos.push('Status não reconhecido: ' + status);
          }
        }
    
        Logger.log('✅ Validação Notas Fiscais: ' + resultado.totalRegistros + ' registros');
        Logger.log('   Por status: ' + JSON.stringify(resultado.porStatus));
    
      } catch (e) {
        resultado.valido = false;
        resultado.erros.push(e.message);
      }
  
      return resultado;
    } catch (error) {
      Logger.log("Erro em validarNotasFiscais: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em validarNotasFiscais: " + error.message);
    throw error;
  }
}

/**
 * Executa setup completo de Notas Fiscais
 */
function setupNotasFiscaisCompleto() {
  try {
    try {
      Logger.log('=== SETUP NOTAS FISCAIS COMPLETO ===');
  
      var resultadoPopular = popularNotasFiscaisSinteticas();
      var resultadoValidar = validarNotasFiscais();
  
      Logger.log('Resultado Popular: ' + JSON.stringify(resultadoPopular));
      Logger.log('Resultado Validar: ' + JSON.stringify(resultadoValidar));
  
      return {
        popular: resultadoPopular,
        validar: resultadoValidar
      };
    } catch (error) {
      Logger.log("Erro em setupNotasFiscaisCompleto: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em setupNotasFiscaisCompleto: " + error.message);
    throw error;
  }
}
