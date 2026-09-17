/**
 * @fileoverview Setup Completo de Ocorrências de Descarte - Dados Sintéticos
 * @version 1.0.0
 * @description Cria dados sintéticos para testar cenários de descarte de alimentos.
 * 
 * CENÁRIOS COBERTOS:
 * - Descarte por validade vencida
 * - Descarte por características alteradas
 * - Descarte por embalagem violada
 * - Descarte por temperatura inadequada
 * - Descarte por contaminação
 * - Descarte validado
 * - Descarte pendente de validação
 * - Descarte rejeitado
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-19
 */

'use strict';

// ============================================================================
// DADOS SINTÉTICOS DE OCORRÊNCIAS DE DESCARTE
// ============================================================================

var OCORRENCIAS_DESCARTE_SINTETICAS = [
  {
    id: 'DESC-2025-0001',
    dataOcorrencia: new Date(2025, 11, 10),
    escola: 'EC 308 Sul',
    produto: 'Iogurte Natural 170g',
    quantidade: 50,
    unidade: 'unidades',
    motivoDescarte: 'VALIDADE_VENCIDA',
    lote: 'IO20251101',
    validade: new Date(2025, 11, 8),
    fornecedor: 'Laticínios Brasília LTDA',
    nfReferencia: 'NF-2025-0004',
    responsavelRegistro: 'Maria Silva Santos',
    nutricionistaValidacao: 'Dra. Ana Nutricionista',
    dataValidacao: new Date(2025, 11, 10),
    parecerNutricional: 'Descarte necessário. Produto impróprio para consumo.',
    acaoCorretiva: 'Notificar fornecedor. Revisar controle de estoque.',
    status: 'VALIDADO',
    observacoes: 'Produto não foi substituído a tempo.',
    dataCriacao: new Date(2025, 11, 10),
    dataAtualizacao: new Date(2025, 11, 10)
  },
  {
    id: 'DESC-2025-0002',
    dataOcorrencia: new Date(2025, 11, 12),
    escola: 'CEF 01 Taguatinga',
    produto: 'Carne Bovina Moída',
    quantidade: 10,
    unidade: 'kg',
    motivoDescarte: 'CARACTERISTICAS_ALTERADAS',
    lote: 'CB20251210',
    validade: new Date(2025, 11, 18),
    fornecedor: 'Frigorífico Central DF',
    nfReferencia: 'NF-2025-0002',
    responsavelRegistro: 'João Pedro Oliveira',
    nutricionistaValidacao: 'Dra. Ana Nutricionista',
    dataValidacao: new Date(2025, 11, 12),
    parecerNutricional: 'Descarte validado. Produto apresentava odor alterado.',
    acaoCorretiva: 'Verificar cadeia de frio do fornecedor.',
    status: 'VALIDADO',
    observacoes: 'Possível quebra da cadeia de frio no transporte.',
    dataCriacao: new Date(2025, 11, 12),
    dataAtualizacao: new Date(2025, 11, 12)
  }
];


// Mais dados sintéticos
OCORRENCIAS_DESCARTE_SINTETICAS.push(
  {
    id: 'DESC-2025-0003',
    dataOcorrencia: new Date(2025, 11, 15),
    escola: 'EC 05 Ceilândia',
    produto: 'Pão Francês',
    quantidade: 120,
    unidade: 'unidades',
    motivoDescarte: 'EMBALAGEM_VIOLADA',
    lote: 'PF20251212',
    validade: new Date(2025, 11, 12),
    fornecedor: 'Panificadora Pão Dourado',
    nfReferencia: 'NF-2025-0003',
    responsavelRegistro: 'Ana Paula Costa',
    nutricionistaValidacao: 'Dra. Ana Nutricionista',
    dataValidacao: new Date(2025, 11, 15),
    parecerNutricional: 'Descarte necessário por risco de contaminação.',
    acaoCorretiva: 'Orientar fornecedor sobre acondicionamento.',
    status: 'VALIDADO',
    observacoes: 'Embalagens rasgadas durante transporte.',
    dataCriacao: new Date(2025, 11, 15),
    dataAtualizacao: new Date(2025, 11, 15)
  },
  {
    id: 'DESC-2025-0004',
    dataOcorrencia: new Date(2025, 11, 18),
    escola: 'EC 10 Sobradinho',
    produto: 'Feijão Carioca',
    quantidade: 100,
    unidade: 'pacotes',
    motivoDescarte: 'CONTAMINACAO',
    lote: 'FJ20251101',
    validade: new Date(2026, 4, 30),
    fornecedor: 'Distribuidora Grãos do Cerrado',
    nfReferencia: 'NF-2025-0009',
    responsavelRegistro: 'Lucia Ferreira',
    nutricionistaValidacao: '',
    dataValidacao: null,
    parecerNutricional: '',
    acaoCorretiva: '',
    status: 'PENDENTE',
    observacoes: 'Presença de carunchos. Aguardando validação.',
    dataCriacao: new Date(2025, 11, 18),
    dataAtualizacao: new Date(2025, 11, 18)
  },
  {
    id: 'DESC-2025-0005',
    dataOcorrencia: new Date(2025, 11, 19),
    escola: 'CEF 04 Planaltina',
    produto: 'Alface Crespa',
    quantidade: 50,
    unidade: 'maços',
    motivoDescarte: 'TEMPERATURA_INADEQUADA',
    lote: 'AL20251219',
    validade: new Date(2025, 11, 22),
    fornecedor: 'Hortifruti Central DF',
    nfReferencia: 'NF-2025-0010',
    responsavelRegistro: 'Eduardo Santos',
    nutricionistaValidacao: '',
    dataValidacao: null,
    parecerNutricional: '',
    acaoCorretiva: '',
    status: 'PENDENTE',
    observacoes: 'Transportado junto com produtos de limpeza.',
    dataCriacao: new Date(2025, 11, 19),
    dataAtualizacao: new Date(2025, 11, 19)
  }
);

// ============================================================================
// FUNÇÕES DE INICIALIZAÇÃO E VALIDAÇÃO
// ============================================================================

/**
 * Popula a aba Ocorrencias_Descarte com dados sintéticos
 */
function popularOcorrenciasDescarte() {
  try {
    try {
      try {
        var startTime = new Date();
        var resultado = { sucesso: false, registrosInseridos: 0, erros: [], tempoExecucao: 0 };
  
        try {
          var ss = getSS();
          var sheetName = 'Ocorrencias_Descarte';
          var sheet = ss.getSheetByName(sheetName);
    
          if (!sheet) {
            sheet = ss.insertSheet(sheetName);
            Logger.log('Aba ' + sheetName + ' criada.');
          }
    
          var headers = [
            'ID', 'Data_Ocorrencia', 'Escola', 'Produto', 'Quantidade', 'Unidade',
            'Motivo_Descarte', 'Lote', 'Validade', 'Fornecedor', 'NF_Referencia',
            'Responsavel_Registro', 'Nutricionista_Validacao', 'Data_Validacao',
            'Parecer_Nutricional', 'Acao_Corretiva', 'Status', 'Observacoes',
            'dataCriacao', 'dataAtualizacao'
          ];
    
          sheet.clear();
          sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
          sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    
          var dados = OCORRENCIAS_DESCARTE_SINTETICAS.map(function(desc) {
            return [
              desc.id, desc.dataOcorrencia, desc.escola, desc.produto, desc.quantidade,
              desc.unidade, desc.motivoDescarte, desc.lote, desc.validade,
              desc.fornecedor, desc.nfReferencia, desc.responsavelRegistro,
              desc.nutricionistaValidacao, desc.dataValidacao, desc.parecerNutricional,
              desc.acaoCorretiva, desc.status, desc.observacoes,
              desc.dataCriacao, desc.dataAtualizacao
            ];
          });
    
          if (dados.length > 0) {
            sheet.getRange(2, 1, dados.length, headers.length).setValues(dados);
            resultado.registrosInseridos = dados.length;
          }
    
          resultado.sucesso = true;
          resultado.tempoExecucao = new Date() - startTime;
          Logger.log('✅ Ocorrências Descarte populadas: ' + resultado.registrosInseridos + ' registros');
    
        } catch (e) {
          resultado.erros.push(e.message);
          Logger.log('❌ Erro: ' + e.message);
        }
  
        return resultado;
      } catch (error) {
        Logger.log("Erro em popularOcorrenciasDescarte: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em popularOcorrenciasDescarte: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em popularOcorrenciasDescarte: " + error.message);
    throw error;
  }
}

/**
 * Valida a estrutura e dados
 */
function validarOcorrenciasDescarte() {
  try {
    var resultado = { valido: true, totalRegistros: 0, porStatus: {}, porMotivo: {}, erros: [], avisos: [] };
  
    try {
      var ss = getSS();
      var sheet = ss.getSheetByName('Ocorrencias_Descarte');
    
      if (!sheet) {
        resultado.valido = false;
        resultado.erros.push('Aba não encontrada');
        return resultado;
      }
    
      var dados = sheet.getDataRange().getValues();
      resultado.totalRegistros = Math.max(0, dados.length - 1);
    
      var headers = dados[0];
      var statusIndex = headers.indexOf('Status');
      var motivoIndex = headers.indexOf('Motivo_Descarte');
    
      for (var i = 1; i < dados.length; i++) {
        var status = dados[i][statusIndex] || 'SEM_STATUS';
        var motivo = dados[i][motivoIndex] || 'SEM_MOTIVO';
        resultado.porStatus[status] = (resultado.porStatus[status] || 0) + 1;
        resultado.porMotivo[motivo] = (resultado.porMotivo[motivo] || 0) + 1;
      }
    
      Logger.log('✅ Validação Ocorrências Descarte: ' + resultado.totalRegistros + ' registros');
    
    } catch (e) {
      resultado.valido = false;
      resultado.erros.push(e.message);
    }
  
    return resultado;
  } catch (error) {
    Logger.log("Erro em validarOcorrenciasDescarte: " + error.message);
    throw error;
  }
}

/**
 * Executa setup completo
 */
function setupOcorrenciasDescarteCompleto() {
  Logger.log('=== SETUP OCORRÊNCIAS DESCARTE COMPLETO ===');
  return { popular: popularOcorrenciasDescarte(), validar: validarOcorrenciasDescarte() };
}
