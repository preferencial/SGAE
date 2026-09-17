/**
 * @fileoverview Dados Sintéticos v2 - Casos de Uso e Casos Omissos
 * @version 2.0.0
 * @description Dados sintéticos que evidenciam lógicas de negócio e casos omissos
 * 
 * CENÁRIOS COBERTOS:
 * 1. Fluxo Normal (Happy Path)
 * 2. Glosas parciais
 * 3. Rejeição total
 * 4. Recebimento parcial por múltiplas escolas
 * 5. Casos omissos (edge cases)
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-26
 */

'use strict';

// ============================================================================
// DADOS SINTÉTICOS - CENÁRIOS DE TESTE
// ============================================================================

var DADOS_SINTETICOS_V2 = {
  
  // =========================================================================
  // CENÁRIO 1: FLUXO COMPLETO - APROVAÇÃO TOTAL
  // NF de Arroz: 100 pacotes, todas as escolas recebem conforme
  // =========================================================================
  CENARIO_APROVACAO_TOTAL: {
    descricao: 'NF aprovada integralmente - todas as escolas receberam conforme',
    nf: {
      id: 'NF_ARROZ_001',
      numero: '100001',
      fornecedor: 'Alimentos Brasil LTDA',
      cnpj: '12.345.678/0001-99',
      produto: 'Arroz Tipo 1 - 5kg',
      quantidade: 100,
      unidade: 'PCT',
      valorUnitario: 25.00,
      valorTotal: 2500.00,
      empenho: '2025NE00001',
      status: 'APROVADO'
    },
    recebimentos: [
      { escola: 'EC 01 Plano Piloto', qtdEsperada: 60, qtdRecebida: 60, status: 'CONFORME' },
      { escola: 'EC 02 Asa Sul', qtdEsperada: 40, qtdRecebida: 40, status: 'CONFORME' }
    ],
    analise: {
      qtdNF: 100,
      qtdRecebida: 100,
      diferenca: 0,
      valorNF: 2500.00,
      valorGlosa: 0.00,
      valorAprovado: 2500.00,
      decisao: 'APROVADO_TOTAL',
      // INVARIANTE: valorAprovado + valorGlosa = valorNF
      invariante: 2500.00 + 0.00 === 2500.00
    }
  },

  // =========================================================================
  // CENÁRIO 2: GLOSA PARCIAL - PRODUTO COM PROBLEMA
  // NF de Ovos: 100 dúzias, EC02 recebe 30 de 40 (10 quebradas)
  // =========================================================================
  CENARIO_GLOSA_PARCIAL: {
    descricao: 'NF com glosa parcial - parte do produto com problema',
    nf: {
      id: 'NF_OVOS_001',
      numero: '100002',
      fornecedor: 'Granja Ovos Frescos LTDA',
      cnpj: '33.444.555/0001-88',
      produto: 'Ovos Brancos Tipo Grande',
      quantidade: 100,
      unidade: 'DZ',
      valorUnitario: 18.00,
      valorTotal: 1800.00,
      empenho: '2025NE00002',
      status: 'GLOSADO'
    },
    recebimentos: [
      { escola: 'EC 01 Plano Piloto', qtdEsperada: 60, qtdRecebida: 60, status: 'CONFORME' },
      { escola: 'EC 02 Asa Sul', qtdEsperada: 40, qtdRecebida: 30, status: 'PARCIAL', 
        motivo: '10 dúzias com ovos quebrados durante transporte' }
    ],
    analise: {
      qtdNF: 100,
      qtdRecebida: 90,
      diferenca: 10,
      valorNF: 1800.00,
      valorGlosa: 180.00,  // 10 dz × R$ 18,00
      valorAprovado: 1620.00,
      decisao: 'APROVADO_PARCIAL',
      // INVARIANTE: valorAprovado + valorGlosa = valorNF
      invariante: 1620.00 + 180.00 === 1800.00
    }
  },

  // =========================================================================
  // CENÁRIO 3: REJEIÇÃO TOTAL - PROBLEMA SANITÁRIO
  // NF de Ovos: 50 dúzias, todas rejeitadas por temperatura inadequada
  // =========================================================================
  CENARIO_REJEICAO_TOTAL: {
    descricao: 'NF totalmente rejeitada - problema sanitário grave',
    nf: {
      id: 'NF_OVOS_003',
      numero: '100003',
      fornecedor: 'Granja Ovos Frescos LTDA',
      cnpj: '33.444.555/0001-88',
      produto: 'Ovos Brancos Tipo Grande',
      quantidade: 50,
      unidade: 'DZ',
      valorUnitario: 18.00,
      valorTotal: 900.00,
      empenho: '2025NE00002',
      status: 'REJEITADO'
    },
    recebimentos: [
      { escola: 'EC 01 Plano Piloto', qtdEsperada: 30, qtdRecebida: 0, status: 'RECUSADO',
        motivo: 'Temperatura 22°C - máximo permitido 10°C' },
      { escola: 'EC 02 Asa Sul', qtdEsperada: 20, qtdRecebida: 0, status: 'RECUSADO',
        motivo: 'Temperatura 24°C - caminhão sem refrigeração' }
    ],
    analise: {
      qtdNF: 50,
      qtdRecebida: 0,
      diferenca: 50,
      valorNF: 900.00,
      valorGlosa: 900.00,  // 100% glosado
      valorAprovado: 0.00,
      decisao: 'REJEITADO',
      // INVARIANTE: valorAprovado + valorGlosa = valorNF
      invariante: 0.00 + 900.00 === 900.00
    }
  },

  // =========================================================================
  // CENÁRIO 4: CASOS OMISSOS - EDGE CASES
  // =========================================================================
  CASOS_OMISSOS: {
    
    // CASO 4.1: NF sem recebimento registrado (pendente)
    nf_sem_recebimento: {
      descricao: 'NF enviada mas nenhuma escola registrou recebimento',
      nf: {
        id: 'NF_PENDENTE_001',
        numero: '100010',
        status: 'ENVIADA',
        valorTotal: 1500.00
      },
      recebimentos: [],
      problema: 'Sistema deve alertar NFs sem recebimento após X dias',
      solucao: 'Trigger automático para notificar escolas'
    },
    
    // CASO 4.2: Recebimento maior que NF (erro de digitação)
    recebimento_maior_que_nf: {
      descricao: 'Escola registra quantidade maior que a NF',
      nf: {
        id: 'NF_ERRO_001',
        quantidade: 100,
        unidade: 'KG'
      },
      recebimento: {
        escola: 'EC 01 Plano Piloto',
        qtdRecebida: 120  // ERRO: maior que NF
      },
      problema: 'Validação deve impedir recebimento > quantidade NF',
      solucao: 'Validação no frontend e backend'
    },
    
    // CASO 4.3: Soma dos recebimentos maior que NF
    soma_recebimentos_excede: {
      descricao: 'Soma dos recebimentos de todas as escolas excede NF',
      nf: {
        id: 'NF_ERRO_002',
        quantidade: 100,
        unidade: 'UN'
      },
      recebimentos: [
        { escola: 'EC 01', qtdRecebida: 60 },
        { escola: 'EC 02', qtdRecebida: 50 }  // Total: 110 > 100
      ],
      problema: 'Sistema deve validar soma dos recebimentos',
      solucao: 'Validação em tempo real do saldo disponível'
    },
    
    // CASO 4.4: Glosa sem justificativa
    glosa_sem_justificativa: {
      descricao: 'Analista aplica glosa sem informar motivo',
      problema: 'Glosa deve ter justificativa obrigatória',
      solucao: 'Campo obrigatório no formulário de análise'
    },
    
    // CASO 4.5: NF com valor zero
    nf_valor_zero: {
      descricao: 'NF registrada com valor total zero',
      problema: 'Sistema deve rejeitar NF com valor <= 0',
      solucao: 'Validação de valor mínimo'
    },
    
    // CASO 4.6: Recebimento em data anterior à emissão da NF
    recebimento_antes_emissao: {
      descricao: 'Data de recebimento anterior à data de emissão da NF',
      problema: 'Inconsistência temporal',
      solucao: 'Validação: data_recebimento >= data_emissao_nf'
    },
    
    // CASO 4.7: Mesmo produto, preços diferentes na mesma NF
    precos_inconsistentes: {
      descricao: 'Produto com preços diferentes em linhas da mesma NF',
      problema: 'Pode indicar erro ou fraude',
      solucao: 'Alerta para revisão manual'
    },
    
    // CASO 4.8: Fornecedor bloqueado tentando entregar
    fornecedor_bloqueado: {
      descricao: 'NF de fornecedor com status BLOQUEADO',
      problema: 'Sistema deve impedir recebimento',
      solucao: 'Validação de status do fornecedor'
    },
    
    // CASO 4.9: Empenho sem saldo suficiente
    empenho_sem_saldo: {
      descricao: 'NF vinculada a empenho sem saldo',
      nf: { valorTotal: 5000.00 },
      empenho: { saldo: 3000.00 },
      problema: 'Valor NF > Saldo Empenho',
      solucao: 'Validação de saldo antes de aprovar'
    },
    
    // CASO 4.10: Produto vencido na entrega
    produto_vencido: {
      descricao: 'Produto entregue já vencido ou próximo do vencimento',
      problema: 'Risco sanitário',
      solucao: 'Campo de validade obrigatório, alerta se < 30 dias'
    }
  },

  // =========================================================================
  // CENÁRIO 5: ALUNOS COM NECESSIDADES ESPECIAIS
  // =========================================================================
  ALUNOS_ESPECIAIS: {
    
    // CASO 5.1: Aluno com múltiplas restrições
    multiplas_restricoes: {
      descricao: 'Aluno celíaco E com intolerância à lactose',
      aluno: {
        nome: 'Ana Beatriz Costa',
        patologia_primaria: 'DOENCA_CELIACA',
        patologia_secundaria: 'INTOLERANCIA_LACTOSE',
        restricoes: ['Glúten', 'Trigo', 'Lactose', 'Leite']
      },
      cardapio: 'Deve combinar restrições de ambas as patologias',
      problema: 'Cardápio deve atender TODAS as restrições simultaneamente'
    },
    
    // CASO 5.2: Laudo vencido
    laudo_vencido: {
      descricao: 'Aluno com laudo médico vencido',
      problema: 'Sistema deve alertar laudos próximos do vencimento',
      solucao: 'Notificação 30 dias antes do vencimento'
    },
    
    // CASO 5.3: Aluno transferido de escola
    aluno_transferido: {
      descricao: 'Aluno com necessidade especial muda de escola',
      problema: 'Histórico e cardápio devem acompanhar o aluno',
      solucao: 'Vinculação por ID do aluno, não por escola'
    },
    
    // CASO 5.4: Risco de anafilaxia
    risco_anafilaxia: {
      descricao: 'Aluno com APLV ou alergia severa',
      aluno: {
        nome: 'Miguel Souza Lima',
        patologia: 'APLV',
        risco: 'ANAFILAXIA'
      },
      problema: 'Contaminação cruzada pode ser fatal',
      solucao: 'Alerta especial, utensílios exclusivos, EpiPen disponível'
    }
  },

  // =========================================================================
  // REGRAS DE NEGÓCIO - INVARIANTES
  // =========================================================================
  REGRAS_NEGOCIO: {
    
    // REGRA 1: Integridade financeira
    integridade_financeira: {
      regra: 'valorAprovado + valorGlosa = valorNF',
      descricao: 'A soma do valor aprovado com o valor glosado deve ser igual ao valor da NF',
      validacao: function(analise) {
        return Math.abs((analise.valorAprovado + analise.valorGlosa) - analise.valorNF) < 0.01;
      }
    },
    
    // REGRA 2: Quantidade recebida
    quantidade_recebida: {
      regra: 'somaRecebimentos <= quantidadeNF',
      descricao: 'A soma dos recebimentos não pode exceder a quantidade da NF',
      validacao: function(nf, recebimentos) {
        try {
          var soma = recebimentos.reduce(function(acc, r) { return acc + r.qtdRecebida; }, 0);
          return soma <= nf.quantidade;
        } catch (error) {
          Logger.log("Erro em validacao: " + error.message);
          throw error;
        }
      }
    },
    
    // REGRA 3: Saldo de empenho
    saldo_empenho: {
      regra: 'valorAprovado <= saldoEmpenho',
      descricao: 'O valor aprovado não pode exceder o saldo do empenho',
      validacao: function(analise, empenho) {
        return analise.valorAprovado <= empenho.saldo;
      }
    },
    
    // REGRA 4: Comissão de recebimento
    comissao_recebimento: {
      regra: 'qtdMembrosComissao >= 3',
      descricao: 'A comissão de recebimento deve ter no mínimo 3 membros',
      validacao: function(analise) {
        return analise.qtdMembros >= 3;
      }
    },
    
    // REGRA 5: Temperatura de produtos refrigerados
    temperatura_refrigerados: {
      regra: 'temperatura <= 10°C para ovos e laticínios',
      descricao: 'Produtos refrigerados devem estar abaixo de 10°C',
      validacao: function(recebimento, produto) {
        if (produto.tipo === 'REFRIGERADO') {
          return recebimento.temperatura <= 10;
        }
        return true;
      }
    },
    
    // REGRA 6: Validade mínima
    validade_minima: {
      regra: 'diasParaVencer >= 30',
      descricao: 'Produtos devem ter no mínimo 30 dias de validade',
      validacao: function(produto) {
        var hoje = new Date();
        var validade = new Date(produto.dataValidade);
        var dias = Math.floor((validade - hoje) / (1000 * 60 * 60 * 24));
        return dias >= 30;
      }
    },
    
    // REGRA 7: Glosa obriga justificativa
    glosa_justificativa: {
      regra: 'valorGlosa > 0 => justificativa != vazio',
      descricao: 'Toda glosa deve ter justificativa',
      validacao: function(analise) {
        try {
          if (analise.valorGlosa > 0) {
            return analise.justificativa && analise.justificativa.trim().length > 0;
          }
          return true;
        } catch (error) {
          Logger.log("Erro em validacao: " + error.message);
          throw error;
        }
      }
    },
    
    // REGRA 8: Status válidos
    status_validos: {
      nf: ['PENDENTE', 'ENVIADA', 'EM_RECEBIMENTO', 'APROVADO', 'GLOSADO', 'REJEITADO'],
      recebimento: ['CONFORME', 'PARCIAL', 'RECUSADO'],
      analise: ['APROVADO_TOTAL', 'APROVADO_PARCIAL', 'REJEITADO']
    }
  }
};


// ============================================================================
// FUNÇÃO PARA POPULAR DADOS DE TESTE
// ============================================================================

/**
 * Popula as planilhas com dados sintéticos que evidenciam as lógicas de negócio
 */
function popularDadosSinteticosV2() {
  try {
    try {
      try {
        Logger.log('');
        Logger.log('╔═══════════════════════════════════════════════════════════════════╗');
        Logger.log('║     POPULANDO DADOS SINTÉTICOS V2                                ║');
        Logger.log('║     Cenários de Teste e Casos Omissos                            ║');
        Logger.log('╚═══════════════════════════════════════════════════════════════════╝');
        Logger.log('');
  
        var ss = getSS();
  
        // =========================================================================
        // 1. NOTAS FISCAIS - Workflow
        // =========================================================================
        var sheetNF = ss.getSheetByName('Workflow_NotasFiscais');
        if (sheetNF) {
          var nfData = [
            // Cenário 1: Aprovação Total
            ['NF_ARROZ_001', new Date(), '100001', '1', '53251212345678000199550010001000011234567001', 
             new Date(2025, 11, 20), '12.345.678/0001-99', 'Alimentos Brasil LTDA', 
             'Arroz Tipo 1 - 5kg', 100, 'PCT', 25.00, 2500.00, '2025NE00001', 'APROVADO', 'fornecedor@empresa.com.br'],
      
            // Cenário 2: Glosa Parcial
            ['NF_OVOS_001', new Date(), '100002', '1', '53251233444555000188550010001000021234567002',
             new Date(2025, 11, 21), '33.444.555/0001-88', 'Granja Ovos Frescos LTDA',
             'Ovos Brancos Tipo Grande', 100, 'DZ', 18.00, 1800.00, '2025NE00002', 'GLOSADO', 'fornecedor@empresa.com.br'],
      
            // Cenário 3: Rejeição Total
            ['NF_OVOS_003', new Date(), '100003', '1', '53251233444555000188550010001000031234567003',
             new Date(2025, 11, 15), '33.444.555/0001-88', 'Granja Ovos Frescos LTDA',
             'Ovos Brancos Tipo Grande', 50, 'DZ', 18.00, 900.00, '2025NE00002', 'REJEITADO', 'fornecedor@empresa.com.br'],
      
            // Caso Omisso: NF Pendente (sem recebimento)
            ['NF_PENDENTE_001', new Date(), '100010', '1', '53251244555666000177550010001000101234567010',
             new Date(2025, 11, 10), '44.555.666/0001-77', 'Laticínios Bom Gosto',
             'Leite Integral UHT 1L', 200, 'UN', 5.80, 1160.00, '2025NE00003', 'ENVIADA', 'fornecedor@empresa.com.br'],
      
            // Caso Omisso: NF em Recebimento (parcial)
            ['NF_PARCIAL_001', new Date(), '100011', '1', '53251211222333000144550010001000111234567011',
             new Date(2025, 11, 18), '11.222.333/0001-44', 'Hortifruti Central',
             'Maçã Fuji Nacional', 150, 'KG', 8.50, 1275.00, '2025NE00004', 'EM_RECEBIMENTO', 'fornecedor@empresa.com.br']
          ];
    
          var lastRow = sheetNF.getLastRow();
          if (lastRow > 1) {
            // Adiciona aos dados existentes
            sheetNF.getRange(lastRow + 1, 1, nfData.length, nfData[0].length).setValues(nfData);
          }
          Logger.log('✅ Workflow_NotasFiscais: ' + nfData.length + ' registros adicionados');
        }
  
        // =========================================================================
        // 2. RECEBIMENTOS - Workflow
        // =========================================================================
        var sheetRec = ss.getSheetByName('Workflow_Recebimentos');
        if (sheetRec) {
          var recData = [
            // Cenário 1: Aprovação Total - Ambas escolas recebem conforme
            ['REC_ARROZ_001_EC01', 'NF_ARROZ_001', '100001', 'EC 01 Plano Piloto', 'Arroz Tipo 1 - 5kg',
             100, 60, 'PCT', 25.00, 1500.00, 'Roberto Lima', '123456', new Date(2025, 11, 20), '08:00',
             'SIM', 'SIM', 'SIM', '', 'Recebido conforme', 'CONFORME', new Date()],
            ['REC_ARROZ_001_EC02', 'NF_ARROZ_001', '100001', 'EC 02 Asa Sul', 'Arroz Tipo 1 - 5kg',
             100, 40, 'PCT', 25.00, 1000.00, 'Fernanda Souza', '234567', new Date(2025, 11, 20), '09:00',
             'SIM', 'SIM', 'SIM', '', 'Recebido conforme', 'CONFORME', new Date()],
      
            // Cenário 2: Glosa Parcial - EC02 recebe menos
            ['REC_OVOS_001_EC01', 'NF_OVOS_001', '100002', 'EC 01 Plano Piloto', 'Ovos Brancos Tipo Grande',
             100, 60, 'DZ', 18.00, 1080.00, 'Roberto Lima', '123456', new Date(2025, 11, 21), '08:30',
             'SIM', 'SIM', 'SIM', '8', 'Ovos em perfeito estado', 'CONFORME', new Date()],
            ['REC_OVOS_001_EC02', 'NF_OVOS_001', '100002', 'EC 02 Asa Sul', 'Ovos Brancos Tipo Grande',
             100, 30, 'DZ', 18.00, 540.00, 'Fernanda Souza', '234567', new Date(2025, 11, 21), '09:30',
             'NAO', 'SIM', 'SIM', '10', '10 dúzias quebradas no transporte', 'PARCIAL', new Date()],
      
            // Cenário 3: Rejeição Total - Ambas escolas recusam
            ['REC_OVOS_003_EC01', 'NF_OVOS_003', '100003', 'EC 01 Plano Piloto', 'Ovos Brancos Tipo Grande',
             50, 0, 'DZ', 18.00, 0.00, 'Roberto Lima', '123456', new Date(2025, 11, 15), '08:00',
             'NAO', 'NAO', 'NAO', '22', 'RECUSADO: Temperatura 22°C, máximo 10°C', 'RECUSADO', new Date()],
            ['REC_OVOS_003_EC02', 'NF_OVOS_003', '100003', 'EC 02 Asa Sul', 'Ovos Brancos Tipo Grande',
             50, 0, 'DZ', 18.00, 0.00, 'Fernanda Souza', '234567', new Date(2025, 11, 15), '09:00',
             'NAO', 'NAO', 'NAO', '24', 'RECUSADO: Caminhão sem refrigeração', 'RECUSADO', new Date()],
      
            // Caso Omisso: Recebimento parcial (apenas uma escola recebeu)
            ['REC_PARCIAL_001_EC01', 'NF_PARCIAL_001', '100011', 'EC 01 Plano Piloto', 'Maçã Fuji Nacional',
             150, 90, 'KG', 8.50, 765.00, 'Roberto Lima', '123456', new Date(2025, 11, 18), '10:00',
             'SIM', 'SIM', 'SIM', '', 'Frutas em bom estado', 'CONFORME', new Date()]
            // EC 02 ainda não registrou recebimento - CASO OMISSO
          ];
    
          var lastRowRec = sheetRec.getLastRow();
          if (lastRowRec > 1) {
            sheetRec.getRange(lastRowRec + 1, 1, recData.length, recData[0].length).setValues(recData);
          }
          Logger.log('✅ Workflow_Recebimentos: ' + recData.length + ' registros adicionados');
        }
  
        Logger.log('');
        Logger.log('📊 Dados sintéticos V2 populados com sucesso!');
        Logger.log('');
        Logger.log('CENÁRIOS CRIADOS:');
        Logger.log('  1. Aprovação Total (NF_ARROZ_001)');
        Logger.log('  2. Glosa Parcial (NF_OVOS_001)');
        Logger.log('  3. Rejeição Total (NF_OVOS_003)');
        Logger.log('  4. NF Pendente sem recebimento (NF_PENDENTE_001)');
        Logger.log('  5. NF em recebimento parcial (NF_PARCIAL_001)');
  
        return { success: true };
      } catch (error) {
        Logger.log("Erro em popularDadosSinteticosV2: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em popularDadosSinteticosV2: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em popularDadosSinteticosV2: " + error.message);
    throw error;
  }
}


// ============================================================================
// FUNÇÃO PARA VALIDAR REGRAS DE NEGÓCIO
// ============================================================================

/**
 * Valida as regras de negócio nos dados existentes
 */
function validarRegrasNegocio() {
  try {
    try {
      Logger.log('');
      Logger.log('╔═══════════════════════════════════════════════════════════════════╗');
      Logger.log('║     VALIDAÇÃO DE REGRAS DE NEGÓCIO                               ║');
      Logger.log('╚═══════════════════════════════════════════════════════════════════╝');
      Logger.log('');
  
      var ss = getSS();
      var erros = [];
      var avisos = [];
  
      // =========================================================================
      // REGRA 1: Integridade Financeira (valorAprovado + valorGlosa = valorNF)
      // =========================================================================
      Logger.log('📋 Verificando Regra 1: Integridade Financeira...');
  
      var sheetAnalises = ss.getSheetByName('Workflow_Analises');
      if (sheetAnalises && sheetAnalises.getLastRow() > 1) {
        var dataAnalises = sheetAnalises.getDataRange().getValues();
        var headers = dataAnalises[0];
    
        var idxValorNF = headers.indexOf('Valor_NF');
        var idxValorGlosa = headers.indexOf('Valor_Glosa');
        var idxValorAprovado = headers.indexOf('Valor_Aprovado');
        var idxID = headers.indexOf('ID');
    
        for (var i = 1; i < dataAnalises.length; i++) {
          var row = dataAnalises[i];
          var valorNF = Number(row[idxValorNF]) || 0;
          var valorGlosa = Number(row[idxValorGlosa]) || 0;
          var valorAprovado = Number(row[idxValorAprovado]) || 0;
          var soma = valorAprovado + valorGlosa;
      
          if (Math.abs(soma - valorNF) > 0.01) {
            erros.push({
              regra: 'Integridade Financeira',
              registro: row[idxID],
              problema: 'valorAprovado (' + valorAprovado + ') + valorGlosa (' + valorGlosa + ') = ' + soma + ' ≠ valorNF (' + valorNF + ')'
            });
          }
        }
      }
  
      // =========================================================================
      // REGRA 2: Soma de Recebimentos <= Quantidade NF
      // =========================================================================
      Logger.log('📋 Verificando Regra 2: Soma de Recebimentos...');
  
      var sheetNF = ss.getSheetByName('Workflow_NotasFiscais');
      var sheetRec = ss.getSheetByName('Workflow_Recebimentos');
  
      if (sheetNF && sheetRec && sheetNF.getLastRow() > 1 && sheetRec.getLastRow() > 1) {
        var dataNF = sheetNF.getDataRange().getValues();
        var dataRec = sheetRec.getDataRange().getValues();
    
        var headersNF = dataNF[0];
        var headersRec = dataRec[0];
    
        var idxNFID = headersNF.indexOf('ID');
        var idxNFQtd = headersNF.indexOf('Quantidade');
        var idxRecNFID = headersRec.indexOf('NF_ID');
        var idxRecQtd = headersRec.indexOf('Qtd_Recebida');
    
        // Agrupa recebimentos por NF
        var recebimentosPorNF = {};
        for (var j = 1; j < dataRec.length; j++) {
          var nfId = dataRec[j][idxRecNFID];
          var qtdRec = Number(dataRec[j][idxRecQtd]) || 0;
          recebimentosPorNF[nfId] = (recebimentosPorNF[nfId] || 0) + qtdRec;
        }
    
        // Verifica cada NF
        for (var k = 1; k < dataNF.length; k++) {
          var nfID = dataNF[k][idxNFID];
          var qtdNF = Number(dataNF[k][idxNFQtd]) || 0;
          var somaRec = recebimentosPorNF[nfID] || 0;
      
          if (somaRec > qtdNF) {
            erros.push({
              regra: 'Soma Recebimentos',
              registro: nfID,
              problema: 'Soma recebimentos (' + somaRec + ') > Quantidade NF (' + qtdNF + ')'
            });
          }
        }
      }
  
      // =========================================================================
      // REGRA 3: NFs sem recebimento (pendentes há mais de 3 dias)
      // =========================================================================
      Logger.log('📋 Verificando Regra 3: NFs Pendentes...');
  
      if (sheetNF && sheetNF.getLastRow() > 1) {
        var dataNF2 = sheetNF.getDataRange().getValues();
        var headersNF2 = dataNF2[0];
    
        var idxStatus = headersNF2.indexOf('Status');
        var idxDataEmissao = headersNF2.indexOf('Data_Emissao');
        var idxID2 = headersNF2.indexOf('ID');
    
        var hoje = new Date();
    
        for (var m = 1; m < dataNF2.length; m++) {
          var status = dataNF2[m][idxStatus];
          var dataEmissao = new Date(dataNF2[m][idxDataEmissao]);
          var diasPendente = Math.floor((hoje - dataEmissao) / (1000 * 60 * 60 * 24));
      
          if ((status === 'ENVIADA' || status === 'PENDENTE') && diasPendente > 3) {
            avisos.push({
              regra: 'NF Pendente',
              registro: dataNF2[m][idxID2],
              problema: 'NF pendente há ' + diasPendente + ' dias sem recebimento'
            });
          }
        }
      }
  
      // =========================================================================
      // RELATÓRIO
      // =========================================================================
      Logger.log('');
      Logger.log('═══════════════════════════════════════════════════════════════════');
      Logger.log('  RESULTADO DA VALIDAÇÃO');
      Logger.log('═══════════════════════════════════════════════════════════════════');
  
      if (erros.length === 0 && avisos.length === 0) {
        Logger.log('  ✅ Todas as regras de negócio estão sendo respeitadas!');
      } else {
        if (erros.length > 0) {
          Logger.log('');
          Logger.log('  ❌ ERROS ENCONTRADOS: ' + erros.length);
          erros.forEach(function(e, idx) {
            Logger.log('     ' + (idx + 1) + '. [' + e.regra + '] ' + e.registro);
            Logger.log('        ' + e.problema);
          });
        }
    
        if (avisos.length > 0) {
          Logger.log('');
          Logger.log('  ⚠️ AVISOS: ' + avisos.length);
          avisos.forEach(function(a, idx) {
            Logger.log('     ' + (idx + 1) + '. [' + a.regra + '] ' + a.registro);
            Logger.log('        ' + a.problema);
          });
        }
      }
  
      Logger.log('═══════════════════════════════════════════════════════════════════');
  
      return {
        success: erros.length === 0,
        erros: erros,
        avisos: avisos
      };
    } catch (error) {
      Logger.log("Erro em validarRegrasNegocio: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em validarRegrasNegocio: " + error.message);
    throw error;
  }
}

// ============================================================================
// FUNÇÃO PARA LISTAR CASOS OMISSOS
// ============================================================================

/**
 * Lista todos os casos omissos identificados
 */
function listarCasosOmissos() {
  Logger.log('');
  Logger.log('╔═══════════════════════════════════════════════════════════════════╗');
  Logger.log('║     CASOS OMISSOS IDENTIFICADOS                                  ║');
  Logger.log('╚═══════════════════════════════════════════════════════════════════╝');
  Logger.log('');
  
  var casos = DADOS_SINTETICOS_V2.CASOS_OMISSOS;
  var idx = 1;
  
  for (var key in casos) {
    var caso = casos[key];
    Logger.log(idx + '. ' + caso.descricao);
    Logger.log('   Problema: ' + caso.problema);
    Logger.log('   Solução: ' + caso.solucao);
    Logger.log('');
    idx++;
  }
  
  Logger.log('Total de casos omissos: ' + (idx - 1));
}

// ============================================================================
// FUNÇÃO PRINCIPAL
// ============================================================================

/**
 * Executa setup completo com dados sintéticos V2
 */
function setupDadosSinteticosV2() {
  // 1. Popula dados
  popularDadosSinteticosV2();
  
  // 2. Valida regras
  validarRegrasNegocio();
  
  // 3. Lista casos omissos
  listarCasosOmissos();
  
  Logger.log('');
  Logger.log('✅ Setup de dados sintéticos V2 concluído!');
}
