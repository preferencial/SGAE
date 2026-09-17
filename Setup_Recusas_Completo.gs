/**
 * @fileoverview Setup Completo de Recusas - Dados Sintéticos
 * @version 1.0.0
 * @description Cria dados sintéticos abrangentes para testar todos os
 * cenários de recusa do sistema UNIAE CRE.
 * 
 * CENÁRIOS COBERTOS:
 * - Recusa por temperatura inadequada (perecíveis)
 * - Recusa por qualidade (aspecto alterado)
 * - Recusa por embalagem violada
 * - Recusa por validade vencida/insuficiente
 * - Recusa por quantidade divergente
 * - Recusa por produto diferente do pedido
 * - Recusa por documentação incompleta
 * - Recusa parcial (parte do lote)
 * - Recusa total (lote inteiro)
 * - Substituição no prazo
 * - Substituição fora do prazo
 * - Glosa por não substituição
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-19
 */

'use strict';

// ============================================================================
// DADOS SINTÉTICOS DE RECUSAS - CENÁRIOS COMPLETOS
// ============================================================================

var RECUSAS_SINTETICAS_COMPLETAS = [
  // -------------------------------------------------------------------------
  // CENÁRIO 1: Temperatura inadequada - Leite (perecível 24h)
  // -------------------------------------------------------------------------
  {
    id: 'REC-2025-001',
    dataRecusa: new Date(2025, 11, 10),
    horaRecusa: '08:30',
    unidadeEscolar: 'EC 308 Sul',
    fornecedor: 'Laticínios Brasília LTDA',
    cnpjFornecedor: '11.222.333/0001-44',
    notaFiscal: 'NF-2025-0001',
    termoRecebimento: 'TR-2025-0001',
    produto: 'Leite Integral UHT 1L',
    quantidade: 100,
    unidadeMedida: 'litros',
    lote: 'LT20251201',
    validade: new Date(2026, 2, 15),
    categoriaMotivo: 'TEMPERATURA_INADEQUADA',
    motivoDetalhado: 'Temperatura aferida: 12°C. Limite máximo para leite: 7°C conforme RDC 216/2004.',
    observacoes: 'Veículo de transporte com sistema de refrigeração defeituoso.',
    fotoAnexada: 'Sim',
    linkFoto: 'drive.google.com/foto001',
    responsavelRecusa: 'Maria Silva Santos',
    matriculaResponsavel: '123456',
    cargoResponsavel: 'Diretora',
    comunicadoUNIAE: 'Sim',
    dataComunicacao: new Date(2025, 11, 10),
    comunicadoFornecedor: 'Sim',
    prazoSubstituicao: '24 horas',
    dataLimiteSubstituicao: new Date(2025, 11, 11),
    statusSubstituicao: 'Substituído no Prazo',
    status: 'RESOLVIDA',
    impactoAlimentacao: 'Não',
    acaoImediata: 'Utilizado estoque de reserva da escola',
    registradoPor: 'maria.silva@seedf.gov.br',
    dataRegistro: new Date(2025, 11, 10)
  },
  
  // -------------------------------------------------------------------------
  // CENÁRIO 2: Qualidade - Carne com aspecto alterado
  // -------------------------------------------------------------------------
  {
    id: 'REC-2025-002',
    dataRecusa: new Date(2025, 11, 11),
    horaRecusa: '09:15',
    unidadeEscolar: 'CEF 01 Taguatinga',
    fornecedor: 'Frigorífico Central DF',
    cnpjFornecedor: '22.333.444/0001-55',
    notaFiscal: 'NF-2025-0002',
    termoRecebimento: 'TR-2025-0002',
    produto: 'Carne Bovina Moída Resfriada',
    quantidade: 50,
    unidadeMedida: 'kg',
    lote: 'CB20251210',
    validade: new Date(2025, 11, 18),
    categoriaMotivo: 'QUALIDADE_ALTERADA',
    motivoDetalhado: 'Coloração escurecida (marrom), odor desagradável, textura pegajosa.',
    observacoes: 'Produto apresentava sinais claros de deterioração. Possível quebra da cadeia de frio.',
    fotoAnexada: 'Sim',
    linkFoto: 'drive.google.com/foto002',
    responsavelRecusa: 'João Pedro Oliveira',
    matriculaResponsavel: '234567',
    cargoResponsavel: 'Vice-Diretor',
    comunicadoUNIAE: 'Sim',
    dataComunicacao: new Date(2025, 11, 11),
    comunicadoFornecedor: 'Sim',
    prazoSubstituicao: '24 horas',
    dataLimiteSubstituicao: new Date(2025, 11, 12),
    statusSubstituicao: 'Substituído no Prazo',
    status: 'RESOLVIDA',
    impactoAlimentacao: 'Sim',
    acaoImediata: 'Cardápio alternativo: frango desfiado',
    registradoPor: 'joao.oliveira@seedf.gov.br',
    dataRegistro: new Date(2025, 11, 11)
  },
  
  // -------------------------------------------------------------------------
  // CENÁRIO 3: Embalagem violada - Pão
  // -------------------------------------------------------------------------
  {
    id: 'REC-2025-003',
    dataRecusa: new Date(2025, 11, 12),
    horaRecusa: '07:00',
    unidadeEscolar: 'EC 05 Ceilândia',
    fornecedor: 'Panificadora Pão Dourado',
    cnpjFornecedor: '33.444.555/0001-66',
    notaFiscal: 'NF-2025-0003',
    termoRecebimento: 'TR-2025-0003',
    produto: 'Pão Francês 50g',
    quantidade: 300,
    unidadeMedida: 'unidades',
    lote: 'PF20251212',
    validade: new Date(2025, 11, 12),
    categoriaMotivo: 'EMBALAGEM_VIOLADA',
    motivoDetalhado: 'Sacos plásticos rasgados, produto exposto ao ambiente.',
    observacoes: 'Aproximadamente 120 unidades (40%) com embalagem violada.',
    fotoAnexada: 'Sim',
    linkFoto: 'drive.google.com/foto003',
    responsavelRecusa: 'Ana Paula Costa',
    matriculaResponsavel: '345678',
    cargoResponsavel: 'Supervisora',
    comunicadoUNIAE: 'Sim',
    dataComunicacao: new Date(2025, 11, 12),
    comunicadoFornecedor: 'Sim',
    prazoSubstituicao: '24 horas',
    dataLimiteSubstituicao: new Date(2025, 11, 13),
    statusSubstituicao: 'Substituído no Prazo',
    status: 'RESOLVIDA',
    impactoAlimentacao: 'Não',
    acaoImediata: 'Aceitas 180 unidades íntegras',
    registradoPor: 'ana.costa@seedf.gov.br',
    dataRegistro: new Date(2025, 11, 12)
  },
  
  // -------------------------------------------------------------------------
  // CENÁRIO 4: Validade vencida - Iogurte
  // -------------------------------------------------------------------------
  {
    id: 'REC-2025-004',
    dataRecusa: new Date(2025, 11, 13),
    horaRecusa: '08:45',
    unidadeEscolar: 'CED 01 Samambaia',
    fornecedor: 'Laticínios Brasília LTDA',
    cnpjFornecedor: '11.222.333/0001-44',
    notaFiscal: 'NF-2025-0004',
    termoRecebimento: 'TR-2025-0004',
    produto: 'Iogurte Natural 170g',
    quantidade: 200,
    unidadeMedida: 'unidades',
    lote: 'IO20251101',
    validade: new Date(2025, 11, 10), // VENCIDO!
    categoriaMotivo: 'VALIDADE_VENCIDA',
    motivoDetalhado: 'Produto com validade vencida há 3 dias. Data de validade: 10/12/2025.',
    observacoes: 'Todo o lote com validade vencida. Erro grave do fornecedor.',
    fotoAnexada: 'Sim',
    linkFoto: 'drive.google.com/foto004',
    responsavelRecusa: 'Carlos Mendes',
    matriculaResponsavel: '456789',
    cargoResponsavel: 'Diretor',
    comunicadoUNIAE: 'Sim',
    dataComunicacao: new Date(2025, 11, 13),
    comunicadoFornecedor: 'Sim',
    prazoSubstituicao: '24 horas',
    dataLimiteSubstituicao: new Date(2025, 11, 14),
    statusSubstituicao: 'Não Substituído',
    status: 'GLOSADA',
    impactoAlimentacao: 'Sim',
    acaoImediata: 'Substituído por fruta do estoque',
    registradoPor: 'carlos.mendes@seedf.gov.br',
    dataRegistro: new Date(2025, 11, 13)
  },
  
  // -------------------------------------------------------------------------
  // CENÁRIO 5: Quantidade divergente - Arroz
  // -------------------------------------------------------------------------
  {
    id: 'REC-2025-005',
    dataRecusa: new Date(2025, 11, 14),
    horaRecusa: '10:00',
    unidadeEscolar: 'EC 102 Norte',
    fornecedor: 'Distribuidora Grãos do Cerrado',
    cnpjFornecedor: '44.555.666/0001-77',
    notaFiscal: 'NF-2025-0005',
    termoRecebimento: 'TR-2025-0005',
    produto: 'Arroz Tipo 1 5kg',
    quantidade: 20, // Recebido 20, NF dizia 50
    unidadeMedida: 'pacotes',
    lote: 'AR20251201',
    validade: new Date(2026, 5, 30),
    categoriaMotivo: 'QUANTIDADE_DIVERGENTE',
    motivoDetalhado: 'NF indica 50 pacotes, recebidos apenas 20 pacotes. Diferença de 30 pacotes.',
    observacoes: 'Motorista alegou que restante ficou no depósito por engano.',
    fotoAnexada: 'Sim',
    linkFoto: 'drive.google.com/foto005',
    responsavelRecusa: 'Fernanda Lima',
    matriculaResponsavel: '567890',
    cargoResponsavel: 'Secretária',
    comunicadoUNIAE: 'Sim',
    dataComunicacao: new Date(2025, 11, 14),
    comunicadoFornecedor: 'Sim',
    prazoSubstituicao: '5 dias úteis',
    dataLimiteSubstituicao: new Date(2025, 11, 21),
    statusSubstituicao: 'Substituído no Prazo',
    status: 'RESOLVIDA',
    impactoAlimentacao: 'Não',
    acaoImediata: 'Aceitos 20 pacotes, aguardando complemento',
    registradoPor: 'fernanda.lima@seedf.gov.br',
    dataRegistro: new Date(2025, 11, 14)
  },
  
  // -------------------------------------------------------------------------
  // CENÁRIO 6: Produto diferente do pedido
  // -------------------------------------------------------------------------
  {
    id: 'REC-2025-006',
    dataRecusa: new Date(2025, 11, 15),
    horaRecusa: '09:30',
    unidadeEscolar: 'CEF 03 Gama',
    fornecedor: 'Hortifruti Central DF',
    cnpjFornecedor: '55.666.777/0001-88',
    notaFiscal: 'NF-2025-0006',
    termoRecebimento: 'TR-2025-0006',
    produto: 'Maçã Gala', // Pedido era Maçã Fuji
    quantidade: 80,
    unidadeMedida: 'kg',
    lote: 'MG20251215',
    validade: new Date(2025, 11, 30),
    categoriaMotivo: 'PRODUTO_DIFERENTE',
    motivoDetalhado: 'Pedido especificava Maçã Fuji, entregue Maçã Gala. Variedade diferente.',
    observacoes: 'Produto aceito parcialmente após consulta à nutricionista.',
    fotoAnexada: 'Não',
    linkFoto: '',
    responsavelRecusa: 'Roberto Alves',
    matriculaResponsavel: '678901',
    cargoResponsavel: 'Diretor',
    comunicadoUNIAE: 'Sim',
    dataComunicacao: new Date(2025, 11, 15),
    comunicadoFornecedor: 'Sim',
    prazoSubstituicao: '5 dias úteis',
    dataLimiteSubstituicao: new Date(2025, 11, 22),
    statusSubstituicao: 'Aceito com Ressalva',
    status: 'RESOLVIDA_COM_RESSALVA',
    impactoAlimentacao: 'Não',
    acaoImediata: 'Aceito após parecer nutricional favorável',
    registradoPor: 'roberto.alves@seedf.gov.br',
    dataRegistro: new Date(2025, 11, 15)
  },
  
  // -------------------------------------------------------------------------
  // CENÁRIO 7: Documentação incompleta
  // -------------------------------------------------------------------------
  {
    id: 'REC-2025-007',
    dataRecusa: new Date(2025, 11, 16),
    horaRecusa: '08:00',
    unidadeEscolar: 'EC 01 Plano Piloto',
    fornecedor: 'Frigorífico Central DF',
    cnpjFornecedor: '22.333.444/0001-55',
    notaFiscal: 'NF-2025-0007',
    termoRecebimento: 'TR-2025-0007',
    produto: 'Frango Inteiro Congelado',
    quantidade: 40,
    unidadeMedida: 'kg',
    lote: 'FC20251216',
    validade: new Date(2026, 2, 16),
    categoriaMotivo: 'DOCUMENTACAO_INCOMPLETA',
    motivoDetalhado: 'Ausência do SIF (Serviço de Inspeção Federal) na embalagem.',
    observacoes: 'Produto sem selo de inspeção sanitária obrigatório.',
    fotoAnexada: 'Sim',
    linkFoto: 'drive.google.com/foto007',
    responsavelRecusa: 'Patricia Souza',
    matriculaResponsavel: '789012',
    cargoResponsavel: 'Vice-Diretora',
    comunicadoUNIAE: 'Sim',
    dataComunicacao: new Date(2025, 11, 16),
    comunicadoFornecedor: 'Sim',
    prazoSubstituicao: '24 horas',
    dataLimiteSubstituicao: new Date(2025, 11, 17),
    statusSubstituicao: 'Substituído no Prazo',
    status: 'RESOLVIDA',
    impactoAlimentacao: 'Sim',
    acaoImediata: 'Cardápio alternativo: carne moída',
    registradoPor: 'patricia.souza@seedf.gov.br',
    dataRegistro: new Date(2025, 11, 16)
  },
  
  // -------------------------------------------------------------------------
  // CENÁRIO 8: Validade insuficiente - Queijo
  // -------------------------------------------------------------------------
  {
    id: 'REC-2025-008',
    dataRecusa: new Date(2025, 11, 17),
    horaRecusa: '07:45',
    unidadeEscolar: 'CED 02 Recanto das Emas',
    fornecedor: 'Laticínios Brasília LTDA',
    cnpjFornecedor: '11.222.333/0001-44',
    notaFiscal: 'NF-2025-0008',
    termoRecebimento: 'TR-2025-0008',
    produto: 'Queijo Mussarela Fatiado',
    quantidade: 30,
    unidadeMedida: 'kg',
    lote: 'QM20251210',
    validade: new Date(2025, 11, 19), // Apenas 2 dias de validade
    categoriaMotivo: 'VALIDADE_INSUFICIENTE',
    motivoDetalhado: 'Validade de apenas 2 dias. Mínimo exigido: 7 dias para produtos resfriados.',
    observacoes: 'Produto não atende prazo mínimo de validade conforme contrato.',
    fotoAnexada: 'Sim',
    linkFoto: 'drive.google.com/foto008',
    responsavelRecusa: 'Marcos Pereira',
    matriculaResponsavel: '890123',
    cargoResponsavel: 'Diretor',
    comunicadoUNIAE: 'Sim',
    dataComunicacao: new Date(2025, 11, 17),
    comunicadoFornecedor: 'Sim',
    prazoSubstituicao: '24 horas',
    dataLimiteSubstituicao: new Date(2025, 11, 18),
    statusSubstituicao: 'Substituído Fora do Prazo',
    status: 'RESOLVIDA_COM_ATRASO',
    impactoAlimentacao: 'Sim',
    acaoImediata: 'Substituído por presunto do estoque',
    registradoPor: 'marcos.pereira@seedf.gov.br',
    dataRegistro: new Date(2025, 11, 17)
  },
  
  // -------------------------------------------------------------------------
  // CENÁRIO 9: Presença de pragas - Feijão
  // -------------------------------------------------------------------------
  {
    id: 'REC-2025-009',
    dataRecusa: new Date(2025, 11, 18),
    horaRecusa: '10:30',
    unidadeEscolar: 'EC 10 Sobradinho',
    fornecedor: 'Distribuidora Grãos do Cerrado',
    cnpjFornecedor: '44.555.666/0001-77',
    notaFiscal: 'NF-2025-0009',
    termoRecebimento: 'TR-2025-0009',
    produto: 'Feijão Carioca Tipo 1 1kg',
    quantidade: 100,
    unidadeMedida: 'pacotes',
    lote: 'FJ20251101',
    validade: new Date(2026, 4, 30),
    categoriaMotivo: 'PRESENCA_PRAGAS',
    motivoDetalhado: 'Identificada presença de carunchos (insetos) em vários pacotes.',
    observacoes: 'Infestação visível. Produto impróprio para consumo.',
    fotoAnexada: 'Sim',
    linkFoto: 'drive.google.com/foto009',
    responsavelRecusa: 'Lucia Ferreira',
    matriculaResponsavel: '901234',
    cargoResponsavel: 'Diretora',
    comunicadoUNIAE: 'Sim',
    dataComunicacao: new Date(2025, 11, 18),
    comunicadoFornecedor: 'Sim',
    prazoSubstituicao: '5 dias úteis',
    dataLimiteSubstituicao: new Date(2025, 11, 25),
    statusSubstituicao: 'Aguardando',
    status: 'PENDENTE',
    impactoAlimentacao: 'Não',
    acaoImediata: 'Utilizado estoque existente',
    registradoPor: 'lucia.ferreira@seedf.gov.br',
    dataRegistro: new Date(2025, 11, 18)
  },
  
  // -------------------------------------------------------------------------
  // CENÁRIO 10: Transporte inadequado - Verduras
  // -------------------------------------------------------------------------
  {
    id: 'REC-2025-010',
    dataRecusa: new Date(2025, 11, 19),
    horaRecusa: '08:15',
    unidadeEscolar: 'CEF 04 Planaltina',
    fornecedor: 'Hortifruti Central DF',
    cnpjFornecedor: '55.666.777/0001-88',
    notaFiscal: 'NF-2025-0010',
    termoRecebimento: 'TR-2025-0010',
    produto: 'Alface Crespa',
    quantidade: 50,
    unidadeMedida: 'maços',
    lote: 'AL20251219',
    validade: new Date(2025, 11, 22),
    categoriaMotivo: 'TRANSPORTE_INADEQUADO',
    motivoDetalhado: 'Produto transportado junto com produtos de limpeza. Contaminação cruzada.',
    observacoes: 'Veículo não exclusivo para alimentos. Risco sanitário.',
    fotoAnexada: 'Sim',
    linkFoto: 'drive.google.com/foto010',
    responsavelRecusa: 'Eduardo Santos',
    matriculaResponsavel: '012345',
    cargoResponsavel: 'Diretor',
    comunicadoUNIAE: 'Sim',
    dataComunicacao: new Date(2025, 11, 19),
    comunicadoFornecedor: 'Sim',
    prazoSubstituicao: '24 horas',
    dataLimiteSubstituicao: new Date(2025, 11, 20),
    statusSubstituicao: 'Aguardando',
    status: 'REGISTRADA',
    impactoAlimentacao: 'Sim',
    acaoImediata: 'Cardápio sem salada hoje',
    registradoPor: 'eduardo.santos@seedf.gov.br',
    dataRegistro: new Date(2025, 11, 19)
  }
];


// ============================================================================
// FUNÇÕES DE INICIALIZAÇÃO E VALIDAÇÃO
// ============================================================================

/**
 * Popula a aba Recusas com dados sintéticos
 * @returns {Object} Resultado da operação
 */
function popularRecusasSinteticas() {
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
          var sheetName = 'Recusas';
          var sheet = ss.getSheetByName(sheetName);
    
          if (!sheet) {
            sheet = ss.insertSheet(sheetName);
            Logger.log('Aba ' + sheetName + ' criada.');
          }
    
          // Headers completos para recusas
          var headers = [
            'ID', 'Data_Recusa', 'Hora_Recusa', 'Unidade_Escolar', 'Fornecedor',
            'CNPJ_Fornecedor', 'Nota_Fiscal', 'Termo_Recebimento', 'Produto',
            'Quantidade', 'Unidade_Medida', 'Lote', 'Validade', 'Categoria_Motivo',
            'Motivo_Detalhado', 'Observacoes', 'Foto_Anexada', 'Link_Foto',
            'Responsavel_Recusa', 'Matricula_Responsavel', 'Cargo_Responsavel',
            'Comunicado_UNIAE', 'Data_Comunicacao', 'Comunicado_Fornecedor',
            'Prazo_Substituicao', 'Data_Limite_Substituicao', 'Status_Substituicao',
            'Status', 'Impacto_Alimentacao', 'Acao_Imediata', 'Registrado_Por', 'Data_Registro'
          ];
    
          // Limpa e insere headers
          sheet.clear();
          sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
          sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    
          // Prepara dados para inserção
          var dados = RECUSAS_SINTETICAS_COMPLETAS.map(function(rec) {
            return [
              rec.id,
              rec.dataRecusa,
              rec.horaRecusa,
              rec.unidadeEscolar,
              rec.fornecedor,
              rec.cnpjFornecedor,
              rec.notaFiscal,
              rec.termoRecebimento,
              rec.produto,
              rec.quantidade,
              rec.unidadeMedida,
              rec.lote,
              rec.validade,
              rec.categoriaMotivo,
              rec.motivoDetalhado,
              rec.observacoes,
              rec.fotoAnexada,
              rec.linkFoto,
              rec.responsavelRecusa,
              rec.matriculaResponsavel,
              rec.cargoResponsavel,
              rec.comunicadoUNIAE,
              rec.dataComunicacao,
              rec.comunicadoFornecedor,
              rec.prazoSubstituicao,
              rec.dataLimiteSubstituicao,
              rec.statusSubstituicao,
              rec.status,
              rec.impactoAlimentacao,
              rec.acaoImediata,
              rec.registradoPor,
              rec.dataRegistro
            ];
          });
    
          // Insere dados
          if (dados.length > 0) {
            sheet.getRange(2, 1, dados.length, headers.length).setValues(dados);
            resultado.registrosInseridos = dados.length;
          }
    
          resultado.sucesso = true;
          resultado.tempoExecucao = new Date() - startTime;
    
          Logger.log('✅ Recusas populadas: ' + resultado.registrosInseridos + ' registros');
    
        } catch (e) {
          resultado.erros.push(e.message);
          Logger.log('❌ Erro ao popular Recusas: ' + e.message);
        }
  
        return resultado;
      } catch (error) {
        Logger.log("Erro em popularRecusasSinteticas: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em popularRecusasSinteticas: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em popularRecusasSinteticas: " + error.message);
    throw error;
  }
}

/**
 * Valida a estrutura e dados da aba Recusas
 * @returns {Object} Resultado da validação
 */
function validarRecusas() {
  try {
    try {
      var resultado = {
        valido: true,
        totalRegistros: 0,
        porStatus: {},
        porMotivo: {},
        porFornecedor: {},
        erros: [],
        avisos: []
      };
  
      try {
        var ss = getSS();
        var sheet = ss.getSheetByName('Recusas');
    
        if (!sheet) {
          resultado.valido = false;
          resultado.erros.push('Aba Recusas não encontrada');
          return resultado;
        }
    
        var dados = sheet.getDataRange().getValues();
        if (dados.length <= 1) {
          resultado.avisos.push('Aba vazia ou apenas com headers');
          return resultado;
        }
    
        var headers = dados[0];
        resultado.totalRegistros = dados.length - 1;
    
        // Índices das colunas
        var statusIndex = headers.indexOf('Status');
        var motivoIndex = headers.indexOf('Categoria_Motivo');
        var fornecedorIndex = headers.indexOf('Fornecedor');
    
        // Conta por status, motivo e fornecedor
        for (var i = 1; i < dados.length; i++) {
          var status = dados[i][statusIndex] || 'SEM_STATUS';
          var motivo = dados[i][motivoIndex] || 'SEM_MOTIVO';
          var fornecedor = dados[i][fornecedorIndex] || 'SEM_FORNECEDOR';
      
          resultado.porStatus[status] = (resultado.porStatus[status] || 0) + 1;
          resultado.porMotivo[motivo] = (resultado.porMotivo[motivo] || 0) + 1;
          resultado.porFornecedor[fornecedor] = (resultado.porFornecedor[fornecedor] || 0) + 1;
        }
    
        // Validações específicas
        var statusValidos = ['REGISTRADA', 'PENDENTE', 'RESOLVIDA', 'RESOLVIDA_COM_RESSALVA', 'RESOLVIDA_COM_ATRASO', 'GLOSADA'];
        for (var status in resultado.porStatus) {
          if (statusValidos.indexOf(status) === -1 && status !== 'SEM_STATUS') {
            resultado.avisos.push('Status não reconhecido: ' + status);
          }
        }
    
        Logger.log('✅ Validação Recusas: ' + resultado.totalRegistros + ' registros');
        Logger.log('   Por status: ' + JSON.stringify(resultado.porStatus));
        Logger.log('   Por motivo: ' + JSON.stringify(resultado.porMotivo));
    
      } catch (e) {
        resultado.valido = false;
        resultado.erros.push(e.message);
      }
  
      return resultado;
    } catch (error) {
      Logger.log("Erro em validarRecusas: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em validarRecusas: " + error.message);
    throw error;
  }
}

/**
 * Executa setup completo de Recusas
 * @returns {Object} Resultado do setup
 */
function setupRecusasCompleto() {
  try {
    try {
      Logger.log('=== SETUP RECUSAS COMPLETO ===');
  
      var resultadoPopular = popularRecusasSinteticas();
      var resultadoValidar = validarRecusas();
  
      Logger.log('Resultado Popular: ' + JSON.stringify(resultadoPopular));
      Logger.log('Resultado Validar: ' + JSON.stringify(resultadoValidar));
  
      return {
        popular: resultadoPopular,
        validar: resultadoValidar
      };
    } catch (error) {
      Logger.log("Erro em setupRecusasCompleto: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em setupRecusasCompleto: " + error.message);
    throw error;
  }
}

/**
 * Gera relatório de recusas por período
 * @deprecated Use gerarRelatorioRecusas() de Dominio_Recusas.gs
 * @param {Date} dataInicio - Data inicial
 * @param {Date} dataFim - Data final
 * @returns {Object} Relatório de recusas
 */
function gerarRelatorioRecusas_Setup(dataInicio, dataFim) {
  try {
    var resultado = {
      periodo: { inicio: dataInicio, fim: dataFim },
      totalRecusas: 0,
      porMotivo: {},
      porFornecedor: {},
      porStatus: {},
      valorEstimadoImpacto: 0
    };
  
    try {
      var ss = getSS();
      var sheet = ss.getSheetByName('Recusas');
    
      if (!sheet) return resultado;
    
      var dados = sheet.getDataRange().getValues();
      var headers = dados[0];
    
      var dataIndex = headers.indexOf('Data_Recusa');
      var motivoIndex = headers.indexOf('Categoria_Motivo');
      var fornecedorIndex = headers.indexOf('Fornecedor');
      var statusIndex = headers.indexOf('Status');
    
      for (var i = 1; i < dados.length; i++) {
        var dataRecusa = new Date(dados[i][dataIndex]);
      
        if (dataRecusa >= dataInicio && dataRecusa <= dataFim) {
          resultado.totalRecusas++;
        
          var motivo = dados[i][motivoIndex] || 'OUTROS';
          var fornecedor = dados[i][fornecedorIndex] || 'N/A';
          var status = dados[i][statusIndex] || 'N/A';
        
          resultado.porMotivo[motivo] = (resultado.porMotivo[motivo] || 0) + 1;
          resultado.porFornecedor[fornecedor] = (resultado.porFornecedor[fornecedor] || 0) + 1;
          resultado.porStatus[status] = (resultado.porStatus[status] || 0) + 1;
        }
      }
    
    } catch (e) {
      Logger.log('Erro ao gerar relatório: ' + e.message);
    }
  
    return resultado;
  } catch (error) {
    Logger.log("Erro em gerarRelatorioRecusas_Setup: " + error.message);
    throw error;
  }
}
