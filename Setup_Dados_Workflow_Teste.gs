/**
 * @fileoverview Gerador de Dados Sintéticos para Teste do Workflow
 * @version 1.0.0
 * @description Cria dados de teste que demonstram claramente o fluxo:
 *   NF (1 gênero) → Distribuição para Escolas → Recebimentos → Análise → Pagamento
 * 
 * EXECUTE: gerarDadosWorkflowTeste()
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-22
 */

'use strict';

// ============================================================================
// CONFIGURAÇÃO DOS CENÁRIOS DE TESTE
// ============================================================================

/**
 * Cenários de teste para demonstrar o workflow completo
 * Cada cenário representa uma NF com distribuição para múltiplas escolas
 */
var CENARIOS_TESTE = {
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CENÁRIO 1: APROVAÇÃO TOTAL (100% recebido conforme)
  // ═══════════════════════════════════════════════════════════════════════════
  ARROZ: {
    nf: {
      id: 'NF_ARROZ_001',
      numero: '2025001',
      fornecedor: 'Distribuidora Grãos do Cerrado',
      cnpj: '12.345.678/0001-90',
      produto: 'Arroz Tipo 1 - Pacote 5kg',
      quantidade: 200,
      unidade: 'PCT',
      valorUnitario: 25.00,
      valorTotal: 5000.00,
      notaEmpenho: '2025NE00100',
      status: 'APROVADO'
    },
    distribuicao: [
      { escola: 'EC 01 Plano Piloto', qtdProgramada: 80, responsavel: 'Roberto Lima', matricula: '123456' },
      { escola: 'EC 02 Asa Sul', qtdProgramada: 60, responsavel: 'Fernanda Souza', matricula: '234567' },
      { escola: 'EC 03 Asa Norte', qtdProgramada: 60, responsavel: 'Carlos Mendes', matricula: '345678' }
    ],
    recebimentos: [
      { escola: 'EC 01 Plano Piloto', qtdRecebida: 80, status: 'CONFORME', obs: 'Pacotes íntegros, dentro da validade' },
      { escola: 'EC 02 Asa Sul', qtdRecebida: 60, status: 'CONFORME', obs: 'Recebido conforme programação' },
      { escola: 'EC 03 Asa Norte', qtdRecebida: 60, status: 'CONFORME', obs: 'Produto em perfeito estado' }
    ],
    resultado: {
      totalRecebido: 200,
      percentual: 100,
      valorGlosa: 0,
      valorAprovado: 5000.00,
      decisao: 'APROVADO_TOTAL'
    }
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CENÁRIO 2: APROVAÇÃO PARCIAL COM GLOSA (recusa parcial em uma escola)
  // ═══════════════════════════════════════════════════════════════════════════
  LEITE: {
    nf: {
      id: 'NF_LEITE_001',
      numero: '2025002',
      fornecedor: 'Laticínios Planalto Central',
      cnpj: '23.456.789/0001-01',
      produto: 'Leite Integral UHT 1L',
      quantidade: 500,
      unidade: 'L',
      valorUnitario: 6.50,
      valorTotal: 3250.00,
      notaEmpenho: '2025NE00101',
      status: 'GLOSADO'
    },
    distribuicao: [
      { escola: 'EC 01 Plano Piloto', qtdProgramada: 200, responsavel: 'Roberto Lima', matricula: '123456' },
      { escola: 'EC 02 Asa Sul', qtdProgramada: 150, responsavel: 'Fernanda Souza', matricula: '234567' },
      { escola: 'EC 04 Lago Sul', qtdProgramada: 150, responsavel: 'Ana Paula Costa', matricula: '456789' }
    ],
    recebimentos: [
      { escola: 'EC 01 Plano Piloto', qtdRecebida: 200, status: 'CONFORME', obs: 'Temperatura adequada (4°C)' },
      { escola: 'EC 02 Asa Sul', qtdRecebida: 150, status: 'CONFORME', obs: 'Embalagens íntegras' },
      { escola: 'EC 04 Lago Sul', qtdRecebida: 100, status: 'PARCIAL', obs: '50 litros com embalagem estufada - RECUSADOS por risco sanitário' }
    ],
    resultado: {
      totalRecebido: 450,
      percentual: 90,
      valorGlosa: 325.00, // 50 × R$ 6,50
      valorAprovado: 2925.00,
      decisao: 'APROVADO_PARCIAL'
    }
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CENÁRIO 3: REJEIÇÃO TOTAL (problema grave em toda a carga)
  // ═══════════════════════════════════════════════════════════════════════════
  FRANGO: {
    nf: {
      id: 'NF_FRANGO_001',
      numero: '2025003',
      fornecedor: 'Frigorífico Aves do Brasil',
      cnpj: '34.567.890/0001-12',
      produto: 'Frango Congelado Inteiro',
      quantidade: 100,
      unidade: 'KG',
      valorUnitario: 18.00,
      valorTotal: 1800.00,
      notaEmpenho: '2025NE00102',
      status: 'REJEITADO'
    },
    distribuicao: [
      { escola: 'EC 01 Plano Piloto', qtdProgramada: 40, responsavel: 'Roberto Lima', matricula: '123456' },
      { escola: 'EC 02 Asa Sul', qtdProgramada: 30, responsavel: 'Fernanda Souza', matricula: '234567' },
      { escola: 'EC 03 Asa Norte', qtdProgramada: 30, responsavel: 'Carlos Mendes', matricula: '345678' }
    ],
    recebimentos: [
      { escola: 'EC 01 Plano Piloto', qtdRecebida: 0, status: 'RECUSADO', obs: 'RECUSADO: Temperatura de 8°C (máx permitido -12°C). Cadeia de frio comprometida.' },
      { escola: 'EC 02 Asa Sul', qtdRecebida: 0, status: 'RECUSADO', obs: 'RECUSADO: Produto parcialmente descongelado. Risco sanitário.' },
      { escola: 'EC 03 Asa Norte', qtdRecebida: 0, status: 'RECUSADO', obs: 'RECUSADO: Caminhão sem refrigeração adequada.' }
    ],
    resultado: {
      totalRecebido: 0,
      percentual: 0,
      valorGlosa: 1800.00,
      valorAprovado: 0,
      decisao: 'REJEITADO'
    }
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CENÁRIO 4: EM ANDAMENTO (aguardando recebimento de algumas escolas)
  // ═══════════════════════════════════════════════════════════════════════════
  FEIJAO: {
    nf: {
      id: 'NF_FEIJAO_001',
      numero: '2025004',
      fornecedor: 'Cooperativa Agrícola do DF',
      cnpj: '45.678.901/0001-23',
      produto: 'Feijão Carioca Tipo 1 - 1kg',
      quantidade: 300,
      unidade: 'KG',
      valorUnitario: 9.80,
      valorTotal: 2940.00,
      notaEmpenho: '2025NE00103',
      status: 'EM_RECEBIMENTO'
    },
    distribuicao: [
      { escola: 'EC 01 Plano Piloto', qtdProgramada: 100, responsavel: 'Roberto Lima', matricula: '123456' },
      { escola: 'EC 02 Asa Sul', qtdProgramada: 100, responsavel: 'Fernanda Souza', matricula: '234567' },
      { escola: 'EC 05 Guará', qtdProgramada: 100, responsavel: 'Marcos Silva', matricula: '567890' }
    ],
    recebimentos: [
      { escola: 'EC 01 Plano Piloto', qtdRecebida: 100, status: 'CONFORME', obs: 'Recebido em perfeito estado' },
      { escola: 'EC 02 Asa Sul', qtdRecebida: 100, status: 'CONFORME', obs: 'Embalagens íntegras, dentro da validade' }
      // EC 05 Guará ainda não recebeu
    ],
    resultado: {
      totalRecebido: 200,
      percentual: 67,
      valorGlosa: null, // Ainda não calculado
      valorAprovado: null,
      decisao: 'AGUARDANDO_RECEBIMENTOS'
    }
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CENÁRIO 5: ENVIADA (aguardando início dos recebimentos)
  // ═══════════════════════════════════════════════════════════════════════════
  BANANA: {
    nf: {
      id: 'NF_BANANA_001',
      numero: '2025005',
      fornecedor: 'Hortifruti Cerrado Verde',
      cnpj: '56.789.012/0001-34',
      produto: 'Banana Prata - Caixa 20kg',
      quantidade: 10,
      unidade: 'CX',
      valorUnitario: 85.00,
      valorTotal: 850.00,
      notaEmpenho: '2025NE00104',
      status: 'ENVIADA'
    },
    distribuicao: [
      { escola: 'EC 01 Plano Piloto', qtdProgramada: 4, responsavel: 'Roberto Lima', matricula: '123456' },
      { escola: 'EC 02 Asa Sul', qtdProgramada: 3, responsavel: 'Fernanda Souza', matricula: '234567' },
      { escola: 'EC 03 Asa Norte', qtdProgramada: 3, responsavel: 'Carlos Mendes', matricula: '345678' }
    ],
    recebimentos: [],
    resultado: {
      totalRecebido: 0,
      percentual: 0,
      valorGlosa: null,
      valorAprovado: null,
      decisao: 'AGUARDANDO_ENTREGA'
    }
  }
};

// ============================================================================
// FUNÇÃO PRINCIPAL - GERAR DADOS DE TESTE
// ============================================================================

/**
 * Gera todos os dados sintéticos para teste do workflow
 * Limpa as abas existentes e recria com dados novos
 */
function gerarDadosWorkflowTeste() {
  try {
    var ss = getSS();
    var ui = SpreadsheetApp.getUi();
  
    var resposta = ui.alert(
      '⚠️ Gerar Dados de Teste',
      'Esta ação irá SUBSTITUIR os dados das abas:\n\n' +
      '• Workflow_NotasFiscais\n' +
      '• Workflow_Recebimentos\n' +
      '• Workflow_Analises\n\n' +
      'Deseja continuar?',
      ui.ButtonSet.YES_NO
    );
  
    if (resposta !== ui.Button.YES) {
      ui.alert('Operação cancelada.');
      return;
    }
  
    try {
      Logger.log('=== INICIANDO GERAÇÃO DE DADOS DE TESTE ===');
    
      // 1. Gerar Notas Fiscais
      var nfsGeradas = _gerarNotasFiscaisTeste(ss);
      Logger.log('✅ ' + nfsGeradas + ' Notas Fiscais geradas');
    
      // 2. Gerar Recebimentos
      var recGerados = _gerarRecebimentosTeste(ss);
      Logger.log('✅ ' + recGerados + ' Recebimentos gerados');
    
      // 3. Gerar Análises
      var analGeradas = _gerarAnalisesTeste(ss);
      Logger.log('✅ ' + analGeradas + ' Análises geradas');
    
      ui.alert(
        '✅ Dados Gerados com Sucesso!',
        'Foram criados:\n\n' +
        '• ' + nfsGeradas + ' Notas Fiscais\n' +
        '• ' + recGerados + ' Recebimentos\n' +
        '• ' + analGeradas + ' Análises\n\n' +
        'Os dados demonstram os seguintes cenários:\n' +
        '1. ARROZ - Aprovação Total (100%)\n' +
        '2. LEITE - Glosa Parcial (90%)\n' +
        '3. FRANGO - Rejeição Total (0%)\n' +
        '4. FEIJÃO - Em Recebimento (67%)\n' +
        '5. BANANA - Enviada (aguardando)',
        ui.ButtonSet.OK
      );
    
      return { success: true, nfs: nfsGeradas, recebimentos: recGerados, analises: analGeradas };
    
    } catch (e) {
      Logger.log('❌ ERRO: ' + e.message);
      ui.alert('Erro', 'Erro ao gerar dados: ' + e.message, ui.ButtonSet.OK);
      return { success: false, error: e.message };
    }
  } catch (error) {
    Logger.log("Erro em gerarDadosWorkflowTeste: " + error.message);
    throw error;
  }
}


// ============================================================================
// FUNÇÕES DE GERAÇÃO DE DADOS
// ============================================================================

/**
 * Gera as Notas Fiscais de teste
 * @private
 */
function _gerarNotasFiscaisTeste(ss) {
  try {
    try {
      try {
        var sheet = ss.getSheetByName('Workflow_NotasFiscais');
  
        if (!sheet) {
          sheet = ss.insertSheet('Workflow_NotasFiscais');
        }
  
        // Limpar dados existentes (manter headers)
        if (sheet.getLastRow() > 1) {
          sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clear();
        }
  
        // Headers
        var headers = ['ID', 'Data_Criacao', 'Numero', 'Serie', 'Chave_Acesso', 'Data_Emissao', 'CNPJ', 'Fornecedor', 'Produto', 'Quantidade', 'Unidade', 'Valor_Unitario', 'Valor_Total', 'Nota_Empenho', 'Status', 'Usuario'];
  
        if (sheet.getLastRow() === 0) {
          sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
          sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1a73e8').setFontColor('white');
        }
  
        // Gerar dados
        var dados = [];
        var dataBase = new Date();
        var cenarios = Object.keys(CENARIOS_TESTE);
  
        for (var i = 0; i < cenarios.length; i++) {
          var cenario = CENARIOS_TESTE[cenarios[i]];
          var nf = cenario.nf;
          var dataEmissao = new Date(dataBase.getTime() - (i * 2 * 24 * 60 * 60 * 1000)); // Cada NF 2 dias antes
    
          dados.push([
            nf.id,
            new Date(),
            nf.numero,
            '1',
            _gerarChaveAcesso(nf.cnpj, nf.numero),
            dataEmissao,
            nf.cnpj,
            nf.fornecedor,
            nf.produto,
            nf.quantidade,
            nf.unidade,
            nf.valorUnitario,
            nf.valorTotal,
            nf.notaEmpenho,
            nf.status,
            'sistema@uniae.gov.br'
          ]);
        }
  
        if (dados.length > 0) {
          sheet.getRange(2, 1, dados.length, headers.length).setValues(dados);
        }
  
        // Formatar
        sheet.autoResizeColumns(1, headers.length);
  
        return dados.length;
      } catch (error) {
        Logger.log("Erro em _gerarNotasFiscaisTeste: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em _gerarNotasFiscaisTeste: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em _gerarNotasFiscaisTeste: " + error.message);
    throw error;
  }
}

/**
 * Gera os Recebimentos de teste
 * @private
 */
function _gerarRecebimentosTeste(ss) {
  try {
    try {
      try {
        var sheet = ss.getSheetByName('Workflow_Recebimentos');
  
        if (!sheet) {
          sheet = ss.insertSheet('Workflow_Recebimentos');
        }
  
        // Limpar dados existentes
        if (sheet.getLastRow() > 1) {
          sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clear();
        }
  
        // Headers
        var headers = ['ID', 'NF_ID', 'NF_Numero', 'Escola', 'Produto', 'Qtd_Esperada', 'Qtd_Recebida', 'Unidade', 'Valor_Unitario', 'Valor_Parcial', 'Responsavel', 'Matricula', 'Data_Recebimento', 'Hora', 'Embalagem_OK', 'Validade_OK', 'Caracteristicas_OK', 'Temperatura', 'Observacoes', 'Status', 'Data_Registro'];
  
        if (sheet.getLastRow() === 0) {
          sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
          sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#0d652d').setFontColor('white');
        }
  
        // Gerar dados
        var dados = [];
        var dataBase = new Date();
        var cenarios = Object.keys(CENARIOS_TESTE);
  
        for (var i = 0; i < cenarios.length; i++) {
          var cenario = CENARIOS_TESTE[cenarios[i]];
          var nf = cenario.nf;
          var distribuicao = cenario.distribuicao;
          var recebimentos = cenario.recebimentos;
    
          for (var j = 0; j < recebimentos.length; j++) {
            var rec = recebimentos[j];
            var dist = distribuicao.find(function(d) { return d.escola === rec.escola; }) || distribuicao[j];
            var dataRec = new Date(dataBase.getTime() - (i * 2 * 24 * 60 * 60 * 1000) + (j * 60 * 60 * 1000));
      
            var embalagemOK = rec.status === 'CONFORME' ? 'SIM' : 'NAO';
            var validadeOK = rec.status === 'CONFORME' ? 'SIM' : (rec.status === 'PARCIAL' ? 'SIM' : 'NAO');
            var caracteristicasOK = rec.status === 'CONFORME' ? 'SIM' : 'NAO';
      
            dados.push([
              'REC_' + cenarios[i] + '_' + (j + 1),
              nf.id,
              nf.numero,
              rec.escola,
              nf.produto,
              nf.quantidade, // Qtd total da NF
              rec.qtdRecebida,
              nf.unidade,
              nf.valorUnitario,
              rec.qtdRecebida * nf.valorUnitario,
              dist.responsavel,
              dist.matricula,
              dataRec,
              _formatarHora(dataRec),
              embalagemOK,
              validadeOK,
              caracteristicasOK,
              rec.status === 'RECUSADO' ? '15' : '',
              rec.obs,
              rec.status,
              new Date()
            ]);
          }
        }
  
        if (dados.length > 0) {
          sheet.getRange(2, 1, dados.length, headers.length).setValues(dados);
        }
  
        // Formatar
        sheet.autoResizeColumns(1, headers.length);
  
        // Colorir por status
        _colorirPorStatus(sheet, 20, {
          'CONFORME': '#d9ead3',
          'PARCIAL': '#fff2cc',
          'RECUSADO': '#f4cccc'
        });
  
        return dados.length;
      } catch (error) {
        Logger.log("Erro em _gerarRecebimentosTeste: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em _gerarRecebimentosTeste: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em _gerarRecebimentosTeste: " + error.message);
    throw error;
  }
}

/**
 * Gera as Análises de teste
 * @private
 */
function _gerarAnalisesTeste(ss) {
  try {
    try {
      try {
        var sheet = ss.getSheetByName('Workflow_Analises');
  
        if (!sheet) {
          sheet = ss.insertSheet('Workflow_Analises');
        }
  
        // Limpar dados existentes
        if (sheet.getLastRow() > 1) {
          sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clear();
        }
  
        // Headers
        var headers = ['ID', 'Data_Analise', 'NF_ID', 'NF_Numero', 'Nota_Empenho', 'Fornecedor', 'Produto', 'Qtd_NF', 'Qtd_Recebida', 'Diferenca', 'Unidade', 'Valor_Unitario', 'Valor_NF', 'Valor_Glosa', 'Valor_Aprovado', 'Percentual_Glosa', 'Membros_Comissao', 'Qtd_Membros', 'Decisao', 'Justificativa', 'Validacao_Contabil', 'Status', 'Usuario'];
  
        if (sheet.getLastRow() === 0) {
          sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
          sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#7c3aed').setFontColor('white');
        }
  
        // Gerar dados apenas para cenários concluídos
        var dados = [];
        var cenarios = Object.keys(CENARIOS_TESTE);
        var membrosComissao = 'Ana Paula Silva, Carlos Eduardo Santos, Maria Fernanda Costa';
  
        for (var i = 0; i < cenarios.length; i++) {
          var cenario = CENARIOS_TESTE[cenarios[i]];
          var nf = cenario.nf;
          var resultado = cenario.resultado;
    
          // Só gera análise para cenários concluídos
          if (resultado.decisao === 'AGUARDANDO_RECEBIMENTOS' || resultado.decisao === 'AGUARDANDO_ENTREGA') {
            continue;
          }
    
          var diferenca = nf.quantidade - resultado.totalRecebido;
          var percentualGlosa = resultado.valorGlosa > 0 ? Math.round((resultado.valorGlosa / nf.valorTotal) * 100) + '%' : '0%';
    
          var justificativa = _gerarJustificativa(cenarios[i], resultado, nf);
    
          dados.push([
            'ANA_' + cenarios[i] + '_001',
            new Date(),
            nf.id,
            nf.numero,
            nf.notaEmpenho,
            nf.fornecedor,
            nf.produto,
            nf.quantidade,
            resultado.totalRecebido,
            diferenca,
            nf.unidade,
            nf.valorUnitario,
            nf.valorTotal,
            resultado.valorGlosa,
            resultado.valorAprovado,
            percentualGlosa,
            membrosComissao,
            3,
            resultado.decisao,
            justificativa,
            'OK',
            resultado.decisao === 'REJEITADO' ? 'REJEITADO' : (resultado.valorGlosa > 0 ? 'GLOSADO' : 'APROVADO'),
            'analista@uniae.gov.br'
          ]);
        }
  
        if (dados.length > 0) {
          sheet.getRange(2, 1, dados.length, headers.length).setValues(dados);
        }
  
        // Formatar
        sheet.autoResizeColumns(1, headers.length);
  
        return dados.length;
      } catch (error) {
        Logger.log("Erro em _gerarAnalisesTeste: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em _gerarAnalisesTeste: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em _gerarAnalisesTeste: " + error.message);
    throw error;
  }
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Gera uma chave de acesso fictícia
 */
function _gerarChaveAcesso(cnpj, numero) {
  try {
    var cnpjLimpo = cnpj.replace(/\D/g, '');
    return '53' + cnpjLimpo + '55001' + numero.padStart(9, '0') + '1' + Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
  } catch (error) {
    Logger.log("Erro em _gerarChaveAcesso: " + error.message);
    throw error;
  }
}

/**
 * Formata hora no formato HH:MM
 */
function _formatarHora(data) {
  try {
    var h = data.getHours().toString().padStart(2, '0');
    var m = data.getMinutes().toString().padStart(2, '0');
    return h + ':' + m;
  } catch (error) {
    Logger.log("Erro em _formatarHora: " + error.message);
    throw error;
  }
}

/**
 * Colore linhas por status
 */
function _colorirPorStatus(sheet, colStatus, cores) {
  try {
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return;
  
    var statusRange = sheet.getRange(2, colStatus, lastRow - 1, 1);
    var valores = statusRange.getValues();
  
    for (var i = 0; i < valores.length; i++) {
      var status = valores[i][0];
      if (cores[status]) {
        sheet.getRange(i + 2, 1, 1, sheet.getLastColumn()).setBackground(cores[status]);
      }
    }
  } catch (error) {
    Logger.log("Erro em _colorirPorStatus: " + error.message);
    throw error;
  }
}

/**
 * Gera justificativa para análise
 */
function _gerarJustificativa(cenario, resultado, nf) {
  switch (resultado.decisao) {
    case 'APROVADO_TOTAL':
      return 'Quantidade total recebida conforme NF. Todas as ' + nf.quantidade + ' ' + nf.unidade + 
             ' de ' + nf.produto + ' foram entregues em perfeito estado. Pagamento integral de R$ ' + 
             nf.valorTotal.toFixed(2) + ' autorizado.';
    
    case 'APROVADO_PARCIAL':
      var diferenca = nf.quantidade - resultado.totalRecebido;
      return 'Recebimento parcial: ' + resultado.totalRecebido + ' de ' + nf.quantidade + ' ' + nf.unidade + 
             ' (' + resultado.percentual + '%). Diferença de ' + diferenca + ' ' + nf.unidade + 
             ' não recebida por problemas de qualidade. Glosa de R$ ' + resultado.valorGlosa.toFixed(2) + 
             ' aplicada. Valor aprovado: R$ ' + resultado.valorAprovado.toFixed(2) + '.';
    
    case 'REJEITADO':
      return 'CARGA TOTALMENTE REJEITADA. Todas as escolas recusaram o recebimento por problemas graves de qualidade/temperatura. ' +
             'Nenhuma unidade de ' + nf.produto + ' foi aceita. Fornecedor notificado formalmente. ' +
             'Sem pagamento autorizado. Glosa total de R$ ' + nf.valorTotal.toFixed(2) + '.';
    
    default:
      return 'Análise em andamento.';
  }
}

// ============================================================================
// MENU
// ============================================================================

/**
 * Adiciona item ao menu
 */
function onOpen_DadosTeste() {
  try {
    try {
      var ui = SpreadsheetApp.getUi();
      ui.createMenu('🧪 Dados de Teste')
        .addItem('📊 Gerar Dados do Workflow', 'gerarDadosWorkflowTeste')
        .addItem('🗑️ Limpar Dados de Teste', 'limparDadosTeste')
        .addToUi();
    } catch (e) {
      Logger.log('Erro ao criar menu: ' + e.message);
    }
  } catch (error) {
    Logger.log("Erro em onOpen_DadosTeste: " + error.message);
    throw error;
  }
}

/**
 * Limpa os dados de teste (versão Workflow)
 */
function limparDadosTeste_Workflow() {
  try {
    var ss = getSS();
    var ui = SpreadsheetApp.getUi();
  
    var resposta = ui.alert(
      '⚠️ Limpar Dados de Teste',
      'Esta ação irá APAGAR todos os dados das abas de workflow.\n\nDeseja continuar?',
      ui.ButtonSet.YES_NO
    );
  
    if (resposta !== ui.Button.YES) return;
  
    var abas = ['Workflow_NotasFiscais', 'Workflow_Recebimentos', 'Workflow_Analises'];
  
    for (var i = 0; i < abas.length; i++) {
      var sheet = ss.getSheetByName(abas[i]);
      if (sheet && sheet.getLastRow() > 1) {
        sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clear();
      }
    }
  
    ui.alert('✅ Dados limpos com sucesso!');
  } catch (error) {
    Logger.log("Erro em limparDadosTeste_Workflow: " + error.message);
    throw error; // Re-lança para tratamento superior
  }
}


// ============================================================================
// API PARA FRONTEND
// ============================================================================

/**
 * Gera dados de teste - chamável do frontend
 * @returns {Object} Resultado da operação
 */
function api_gerarDadosTeste() {
  try {
    if (PropertiesService.getScriptProperties().getProperty('SGAE_ENABLE_TEST_DATA') !== 'true') {
      return { success: false, error: 'Geração de dados de teste está desabilitada em produção' };
    }
    var ss = getSS();
    
    Logger.log('=== API: GERANDO DADOS DE TESTE ===');
    
    var nfsGeradas = _gerarNotasFiscaisTeste(ss);
    var recGerados = _gerarRecebimentosTeste(ss);
    var analGeradas = _gerarAnalisesTeste(ss);
    
    return {
      success: true,
      message: 'Dados gerados com sucesso!',
      data: {
        notasFiscais: nfsGeradas,
        recebimentos: recGerados,
        analises: analGeradas
      },
      cenarios: [
        { nome: 'ARROZ', status: 'APROVADO', descricao: '100% recebido - Aprovação Total' },
        { nome: 'LEITE', status: 'GLOSADO', descricao: '90% recebido - Glosa de 10%' },
        { nome: 'FRANGO', status: 'REJEITADO', descricao: '0% recebido - Rejeição Total' },
        { nome: 'FEIJÃO', status: 'EM_RECEBIMENTO', descricao: '67% recebido - Aguardando' },
        { nome: 'BANANA', status: 'ENVIADA', descricao: 'Aguardando entrega' }
      ]
    };
    
  } catch (e) {
    Logger.log('Erro api_gerarDadosTeste: ' + e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Retorna os cenários de teste disponíveis
 * @returns {Object} Lista de cenários
 */
function api_getCenariosTeste() {
  try {
    if (PropertiesService.getScriptProperties().getProperty('SGAE_ENABLE_TEST_DATA') !== 'true') {
      return { success: false, error: 'Cenários de teste estão disponíveis apenas com SGAE_ENABLE_TEST_DATA=true' };
    }
    var cenarios = [];
    var keys = Object.keys(CENARIOS_TESTE);
  
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var c = CENARIOS_TESTE[key];
      cenarios.push({
        id: key,
        produto: c.nf.produto,
        fornecedor: c.nf.fornecedor,
        quantidade: c.nf.quantidade + ' ' + c.nf.unidade,
        valorTotal: c.nf.valorTotal,
        status: c.nf.status,
        escolas: c.distribuicao.length,
        recebimentos: c.recebimentos.length,
        resultado: c.resultado.decisao
      });
    }
  
    return { success: true, data: cenarios };
  } catch (error) {
    Logger.log("Erro em api_getCenariosTeste: " + error.message);
    throw error;
  }
}
