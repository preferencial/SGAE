'use strict';

/**
 * AJUSTES_REALIDADE_DF.gs
 * Ajustes finos baseados na realidade da alimentação escolar do Distrito Federal
 *
 * CONTEXTO ESPECÍFICO DO DF:
 * - Sistema descentralizado por CREs (14 Coordenações Regionais de Ensino)
 * - PDGP (Programa de Distribuição de Gêneros Perecíveis) semanal
 * - Contratos centralizados pela SEEDF com execução regional
 * - Cardápios padronizados pela DIAE/GPAE
 * - Agricultura Familiar (mínimo 30% PNAE)
 * - Especificidades climáticas do Cerrado
 *
 * @version 1.0.0
 * @created 2025-11-27
 */

// ============================================================================
// ESTRUTURA ORGANIZACIONAL DO DF
// ============================================================================

/**
 * CREs do Distrito Federal (14 Coordenações Regionais)
 */
var CRES_DF = {
  PLANO_PILOTO: {
    codigo: 'CRE-PP',
    nome: 'Coordenação Regional de Ensino do Plano Piloto',
    unidades: ['EC 308 Sul', 'EC 316 Sul', 'CEF 01', 'CED 01'],
    responsavel_nutricao: '',
    telefone: '(61) 3901-xxxx',
    email: 'crepp@se.df.gov.br'
  },
  GAMA: {
    codigo: 'CRE-GAMA',
    nome: 'Coordenação Regional de Ensino do Gama',
    unidades: [],
    responsavel_nutricao: '',
    telefone: '(61) 3901-xxxx'
  },
  TAGUATINGA: {
    codigo: 'CRE-TAG',
    nome: 'Coordenação Regional de Ensino de Taguatinga',
    unidades: [],
    responsavel_nutricao: ''
  },
  BRAZLANDIA: {
    codigo: 'CRE-BRA',
    nome: 'Coordenação Regional de Ensino de Brazlândia',
    unidades: []
  },
  SOBRADINHO: {
    codigo: 'CRE-SOB',
    nome: 'Coordenação Regional de Ensino de Sobradinho',
    unidades: []
  },
  PLANALTINA: {
    codigo: 'CRE-PLA',
    nome: 'Coordenação Regional de Ensino de Planaltina',
    unidades: []
  },
  PARANO: {
    codigo: 'CRE-PAR',
    nome: 'Coordenação Regional de Ensino do Paranoá',
    unidades: []
  },
  NUCLEO_BANDEIRANTE: {
    codigo: 'CRE-NB',
    nome: 'Coordenação Regional de Ensino do Núcleo Bandeirante',
    unidades: []
  },
  CEILANDIA: {
    codigo: 'CRE-CEI',
    nome: 'Coordenação Regional de Ensino de Ceilândia',
    unidades: []
  },
  GUARA: {
    codigo: 'CRE-GUA',
    nome: 'Coordenação Regional de Ensino do Guará',
    unidades: []
  },
  SAMAMBAIA: {
    codigo: 'CRE-SAM',
    nome: 'Coordenação Regional de Ensino de Samambaia',
    unidades: []
  },
  SANTA_MARIA: {
    codigo: 'CRE-SM',
    nome: 'Coordenação Regional de Ensino de Santa Maria',
    unidades: []
  },
  SAO_SEBASTIAO: {
    codigo: 'CRE-SS',
    nome: 'Coordenação Regional de Ensino de São Sebastião',
    unidades: []
  },
  RECANTO_DAS_EMAS: {
    codigo: 'CRE-RE',
    nome: 'Coordenação Regional de Ensino do Recanto das Emas',
    unidades: []
  }
};

/**
 * Estrutura hierárquica da alimentação escolar no DF
 */
var HIERARQUIA_DF = {
  FEDERAL: {
    orgao: 'FNDE - Fundo Nacional de Desenvolvimento da Educação',
    papel: 'Repasse de recursos PNAE',
    normativas: ['Lei 11.947/2009', 'Resolução FNDE 06/2020']
  },
  DISTRITAL: {
    orgao: 'SEEDF - Secretaria de Estado de Educação do DF',
    papel: 'Gestão centralizada de contratos',
    subdivisoes: {
      SUAPE: 'Subsecretaria de Administração Pública e Educacional',
      DIAE: 'Diretoria de Alimentação Escolar',
      GPAE: 'Gerência de Programas de Alimentação Escolar'
    }
  },
  REGIONAL: {
    orgao: 'CRE - Coordenação Regional de Ensino',
    papel: 'Execução regional e supervisão',
    quantidade: 14
  },
  LOCAL: {
    orgao: 'UNIAE - Unidade de Alimentação Escolar',
    papel: 'Recebimento, armazenamento e preparo',
    responsavel: 'Diretor da Unidade Escolar'
  }
};

// ============================================================================
// PDGP - PROGRAMA DE DISTRIBUIÇÃO DE GÊNEROS PERECÍVEIS
// ============================================================================

/**
 * Configurações específicas do PDGP no DF
 */
var PDGP_DF_CONFIG = {
  PERIODICIDADE: 'SEMANAL',
  DIA_ENTREGA_PADRAO: 'Segunda-feira',
  HORARIO_ENTREGA: '06:00 às 10:00',
  TOLERANCIA_ATRASO: 2, // horas

  // Produtos típicos do PDGP no DF
  PRODUTOS_PERECIVEIS: [
    'Pão francês',
    'Pão de forma integral',
    'Leite pasteurizado tipo A',
    'Iogurte natural',
    'Carne bovina (patinho)',
    'Frango (peito)',
    'Ovos brancos tipo extra',
    'Banana prata',
    'Maçã gala',
    'Mamão formosa',
    'Alface crespa',
    'Tomate',
    'Cenoura',
    'Batata inglesa'
  ],

  // Sazonalidade do Cerrado
  SAZONALIDADE_CERRADO: {
    CHUVAS: {
      periodo: 'Outubro a Abril',
      produtos_abundantes: ['Pequi', 'Mangaba', 'Cagaita', 'Hortaliças folhosas'],
      observacao: 'Maior disponibilidade de produtos da agricultura familiar'
    },
    SECA: {
      periodo: 'Maio a Setembro',
      produtos_escassos: ['Hortaliças folhosas', 'Frutas regionais'],
      observacao: 'Necessário planejamento antecipado e uso de produtos não perecíveis'
    }
  }
};

/**
 * Valida PDGP considerando especificidades do DF
 */
function validarPDGP_DF(dadosPDGP) {
  try {
    var erros = [];
    var alertas = [];

    // Validar se dadosPDGP existe
    if (!dadosPDGP) {
      return {
        valido: false,
        erros: ['Dados do PDGP não fornecidos'],
        alertas: []
      };
    }

    // Validar dia da semana
    if (!dadosPDGP.dataEntrega) {
      erros.push('Data de entrega não informada');
    } else {
      var dataEntrega = new Date(dadosPDGP.dataEntrega);
      var diaSemana = dataEntrega.getDay();

      if (diaSemana !== 1) { // Não é segunda-feira
        alertas.push('PDGP geralmente é entregue às segundas-feiras no DF');
      }

      // Validar horário
      var horaEntrega = dadosPDGP.horaEntrega;
      if (horaEntrega) {
        var hora = parseInt(horaEntrega.split(':')[0], 10);
        if (hora < 6 || hora > 12) {
          alertas.push('Horário de entrega fora do padrão (06:00 às 10:00)');
        }
      }

      // Validar sazonalidade
      var mes = dataEntrega.getMonth() + 1;
      var periodoSeco = mes >= 5 && mes <= 9;

      if (periodoSeco && dadosPDGP.produtos) {
        var produtosEscassos = ['alface', 'rúcula', 'agrião'];
        dadosPDGP.produtos.forEach(function(produto) {
          var produtoLower = produto.toLowerCase();
          if (produtosEscassos.some(function(p) { return produtoLower.indexOf(p) >= 0; })) {
            alertas.push('Produto ' + produto + ' pode ter disponibilidade reduzida no período seco');
          }
        });
      }
    }

    // Validar agricultura familiar (mínimo 30%)
    if (dadosPDGP.valorTotal && dadosPDGP.valorAgriculturaFamiliar) {
      var percentualAF = (dadosPDGP.valorAgriculturaFamiliar / dadosPDGP.valorTotal) * 100;
      if (percentualAF < 30) {
        erros.push('Percentual de Agricultura Familiar abaixo do mínimo legal (30%)');
      }
    }

    return {
      valido: erros.length === 0,
      erros: erros,
      alertas: alertas
    };
  } catch (error) {
    Logger.log("Erro em validarPDGP_DF: " + error.message);
    throw error;
  }
}

// ============================================================================
// CARDÁPIOS ESPECÍFICOS DO DF
// ============================================================================

/**
 * Cardápios padronizados pela DIAE/GPAE
 */
var CARDAPIOS_PADRAO_DF = {
  EDUCACAO_INFANTIL: {
    MANHA: {
      '08:00': 'Desjejum',
      '10:00': 'Colação',
      cardapio_tipo: 'Leite + Pão + Fruta'
    },
    TARDE: {
      '14:00': 'Almoço',
      '16:00': 'Lanche',
      cardapio_tipo: 'Refeição completa + Lanche'
    },
    INTEGRAL: {
      '08:00': 'Desjejum',
      '10:00': 'Colação',
      '12:00': 'Almoço',
      '15:00': 'Lanche',
      '17:00': 'Jantar',
      refeicoes_dia: 5
    }
  },

  ENSINO_FUNDAMENTAL: {
    MANHA: {
      '10:00': 'Lanche',
      cardapio_tipo: 'Lanche reforçado'
    },
    TARDE: {
      '15:00': 'Lanche',
      cardapio_tipo: 'Lanche reforçado'
    },
    INTEGRAL: {
      '10:00': 'Lanche manhã',
      '12:00': 'Almoço',
      '15:00': 'Lanche tarde',
      refeicoes_dia: 3
    }
  },

  ENSINO_MEDIO: {
    MANHA: {
      '10:00': 'Lanche',
      cardapio_tipo: 'Lanche'
    },
    TARDE: {
      '15:00': 'Lanche',
      cardapio_tipo: 'Lanche'
    },
    NOTURNO: {
      '20:00': 'Jantar',
      cardapio_tipo: 'Refeição completa'
    }
  }
};

/**
 * Per capita por modalidade (valores de referência DF)
 */
var PER_CAPITA_DF = {
  CRECHE: {
    valor_dia: 2.00,
    dias_letivos: 200,
    valor_anual: 400.00,
    base_legal: 'Resolução FNDE 06/2020'
  },
  PRE_ESCOLA: {
    valor_dia: 0.80,
    dias_letivos: 200,
    valor_anual: 160.00
  },
  FUNDAMENTAL: {
    valor_dia: 0.50,
    dias_letivos: 200,
    valor_anual: 100.00
  },
  MEDIO: {
    valor_dia: 0.50,
    dias_letivos: 200,
    valor_anual: 100.00
  },
  EJA: {
    valor_dia: 0.40,
    dias_letivos: 200,
    valor_anual: 80.00
  },
  INTEGRAL: {
    valor_dia: 2.00,
    dias_letivos: 200,
    valor_anual: 400.00
  },
  QUILOMBOLA_INDIGENA: {
    valor_dia: 1.30,
    dias_letivos: 200,
    valor_anual: 260.00
  }
};

// ============================================================================
// FORNECEDORES E CONTRATOS DO DF
// ============================================================================

/**
 * Tipos de fornecedores no DF
 */
var TIPOS_FORNECEDORES_DF = {
  AGRICULTURA_FAMILIAR: {
    tipo: 'Agricultura Familiar',
    percentual_minimo: 30,
    dispensa_licitacao: true,
    base_legal: 'Lei 11.947/2009 Art. 14',
    documentacao_exigida: ['DAP', 'Projeto de Venda'],
    limite_individual: 40000.00, // por agricultor/ano
    limite_grupo: 300000.00 // por organização/ano
  },

  LICITACAO_CONVENCIONAL: {
    tipo: 'Licitação Convencional',
    percentual_maximo: 70,
    modalidade: 'Pregão Eletrônico',
    base_legal: 'Lei 14.133/2021',
    orgao_licitante: 'SEEDF'
  },

  PDAF_EMERGENCIAL: {
    tipo: 'PDAF - Programa de Descentralização Administrativa e Financeira',
    uso: 'Compras emergenciais pela escola',
    limite_anual: 'Conforme repasse PDAF',
    aprovacao: 'Conselho Escolar',
    base_legal: 'Decreto DF 37.387/2016'
  }
};

/**
 * Valida fornecedor conforme regras do DF
 */
function validarFornecedorDF(dadosFornecedor) {
  try {
    var erros = [];
    var alertas = [];

    // Validar se dadosFornecedor existe
    if (!dadosFornecedor) {
      return {
        valido: false,
        erros: ['Dados do fornecedor não fornecidos'],
        alertas: []
      };
    }

    // Validar CNPJ/CPF
    if (!dadosFornecedor.cnpj && !dadosFornecedor.cpf) {
      erros.push('CNPJ ou CPF obrigatório');
    }

    // Validar Agricultura Familiar
    if (dadosFornecedor.tipo === 'AGRICULTURA_FAMILIAR') {
      if (!dadosFornecedor.dap) {
        erros.push('DAP (Declaração de Aptidão ao PRONAF) obrigatória para Agricultura Familiar');
      }

      if (dadosFornecedor.valorContrato > TIPOS_FORNECEDORES_DF.AGRICULTURA_FAMILIAR.limite_individual) {
        alertas.push('Valor acima do limite individual para agricultor familiar');
      }
    }

    // Validar documentação fiscal
    if (!dadosFornecedor.inscricaoEstadual && dadosFornecedor.tipo !== 'AGRICULTURA_FAMILIAR') {
      alertas.push('Inscrição Estadual recomendada');
    }

    return {
      valido: erros.length === 0,
      erros: erros,
      alertas: alertas
    };
  } catch (error) {
    Logger.log("Erro em validarFornecedorDF: " + error.message);
    throw error;
  }
}

// ============================================================================
// CONTROLE DE TEMPERATURA E QUALIDADE (CLIMA DO DF)
// ============================================================================

/**
 * Parâmetros de temperatura considerando clima do DF
 */
var CONTROLE_TEMPERATURA_DF = {
  AMBIENTE_EXTERNO: {
    VERAO: {
      periodo: 'Outubro a Março',
      temperatura_media: 28,
      temperatura_maxima: 35,
      umidade_baixa: true,
      cuidados: [
        'Reduzir tempo de exposição de perecíveis',
        'Aumentar frequência de verificação de refrigeração',
        'Atenção redobrada com produtos lácteos'
      ]
    },
    INVERNO: {
      periodo: 'Abril a Setembro',
      temperatura_media: 22,
      temperatura_minima: 12,
      umidade_muito_baixa: true,
      cuidados: [
        'Hidratação adequada de hortaliças',
        'Proteção contra ressecamento',
        'Atenção com produtos desidratados'
      ]
    }
  },

  TRANSPORTE: {
    REFRIGERADO: {
      temperatura_ideal: '2°C a 8°C',
      tolerancia: '±2°C',
      tempo_maximo_transporte: 4, // horas
      obrigatorio_para: ['Carnes', 'Laticínios', 'Frios']
    },
    CONGELADO: {
      temperatura_ideal: '-18°C',
      tolerancia: '±3°C',
      tempo_maximo_transporte: 6, // horas
      obrigatorio_para: ['Carnes congeladas', 'Pescados']
    },
    AMBIENTE: {
      temperatura_maxima: 26,
      protecao_sol: true,
      ventilacao: true,
      obrigatorio_para: ['Não perecíveis', 'Frutas resistentes']
    }
  },

  ARMAZENAMENTO: {
    REFRIGERADOR: {
      temperatura: '2°C a 8°C',
      verificacao: 'A cada 4 horas',
      registro_obrigatorio: true
    },
    FREEZER: {
      temperatura: '-18°C',
      verificacao: 'Diária',
      registro_obrigatorio: true
    },
    DESPENSA: {
      temperatura_maxima: 26,
      umidade_maxima: 70,
      ventilacao: 'Obrigatória',
      protecao_pragas: 'Obrigatória'
    }
  }
};

/**
 * Valida condições de recebimento considerando clima do DF
 */
function validarCondicoesRecebimentoDF(dados) {
  try {
    var erros = [];
    var alertas = [];

    // Validar se dados existe
    if (!dados) {
      return {
        valido: false,
        erros: ['Dados de recebimento não fornecidos'],
        alertas: []
      };
    }

    var mes = new Date().getMonth() + 1;
    var periodoVerao = mes >= 10 || mes <= 3;

    // Validar temperatura de transporte
    if (dados.temperaturaTransporte !== undefined && dados.temperaturaTransporte !== null &&
        String(dados.temperaturaTransporte).trim() !== '') {
      var valorTemperatura = dados.temperaturaTransporte;
      var temp = typeof valorTemperatura === 'number'
        ? valorTemperatura
        : Number(String(valorTemperatura).trim());

      if (!isFinite(temp)) {
        erros.push('Temperatura de transporte deve ser um número válido');
      } else {
        if (dados.tipoProduto === 'PERECIVEL_REFRIGERADO') {
          if (temp < 0 || temp > 10) {
            erros.push('Temperatura de transporte inadequada para produto refrigerado: ' + temp + '°C');
          } else if (temp > 8) {
            alertas.push('Temperatura próxima ao limite máximo: ' + temp + '°C');
          }
        }

        if (dados.tipoProduto === 'CONGELADO') {
          if (temp > -12) {
            erros.push('Temperatura inadequada para produto congelado: ' + temp + '°C');
          }
        }
      }
    }

    // Alertas específicos do período
    if (periodoVerao) {
      alertas.push('PERÍODO DE VERÃO: Atenção redobrada com produtos perecíveis');

      if (dados.horaEntrega) {
        var hora = parseInt(dados.horaEntrega.split(':')[0]);
        if (hora > 10) {
          alertas.push('Entrega após 10h no verão: risco aumentado de deterioração');
        }
      }
    }

    // Validar tempo de transporte
    if (dados.horaCarregamento && dados.horaEntrega) {
      var horaCarreg = new Date('2000-01-01 ' + dados.horaCarregamento);
      var horaEntreg = new Date('2000-01-01 ' + dados.horaEntrega);
      var diferencaHoras = (horaEntreg - horaCarreg) / (1000 * 60 * 60);

      if (dados.tipoProduto === 'PERECIVEL_REFRIGERADO' && diferencaHoras > 4) {
        erros.push('Tempo de transporte excede 4 horas para produto refrigerado');
      }
    }

    return {
      valido: erros.length === 0,
      erros: erros,
      alertas: alertas,
      periodo_climatico: periodoVerao ? 'VERAO' : 'INVERNO'
    };
  } catch (error) {
    Logger.log("Erro em validarCondicoesRecebimentoDF: " + error.message);
    throw error;
  }
}

// ============================================================================
// INTEGRAÇÃO COM SISTEMAS DO DF
// ============================================================================

/**
 * Sistemas utilizados pela SEEDF
 */
var SISTEMAS_SEEDF = {
  SEI: {
    nome: 'Sistema Eletrônico de Informações',
    uso: 'Processos administrativos e documentação oficial',
    url: 'https://sei.df.gov.br',
    obrigatorio: true
  },

  SIGPRO: {
    nome: 'Sistema de Gestão de Processos',
    uso: 'Gestão de contratos e licitações',
    responsavel: 'SUAPE'
  },

  I_EDUCAR: {
    nome: 'i-Educar',
    uso: 'Censo escolar e matrículas',
    dados_relevantes: ['Número de alunos', 'Modalidades de ensino']
  },

  PLANILHA_UNIAE: {
    nome: 'Sistema UNIAE (este sistema)',
    uso: 'Gestão operacional da alimentação escolar',
    nivel: 'Regional/Local'
  }
};

/**
 * Gera número de processo SEI padrão
 */
function gerarNumeroProcessoSEI() {
  try {
    var ano = new Date().getFullYear();
    var sequencial = Math.floor(Math.random() * 999999) + 1;
    var sequencialFormatado = ('000000' + sequencial).slice(-6);

    // Formato: 00080-XXXXXXX/YYYY-XX
    return '00080-' + sequencialFormatado + '/' + ano + '-77';
  } catch (error) {
    Logger.log("Erro em gerarNumeroProcessoSEI: " + error.message);
    throw error;
  }
}

// ============================================================================
// FUNÇÕES DE RELATÓRIO ESPECÍFICAS DO DF
// ============================================================================

/**
 * Gera relatório consolidado por CRE
 */
function gerarRelatorioConsolidadoCRE(codigoCRE, periodo) {
  try {
    var cre = null;
    for (var key in CRES_DF) {
      if (CRES_DF[key].codigo === codigoCRE) {
        cre = CRES_DF[key];
        break;
      }
    }

    if (!cre) {
      throw new Error('CRE não encontrada: ' + codigoCRE);
    }

    var relatorio = {
      cre: cre.nome,
      codigo: cre.codigo,
      periodo: periodo,
      data_geracao: new Date(),

      // Estatísticas gerais
      total_unidades: cre.unidades ? cre.unidades.length : 0,
      total_alunos: 0, // Buscar do i-Educar

      // Execução financeira
      valor_repassado_fnde: 0,
      valor_executado: 0,
      percentual_execucao: 0,

      // Agricultura Familiar
      valor_agricultura_familiar: 0,
      percentual_agricultura_familiar: 0,
      meta_30_porcento: false,

      // Qualidade
      total_entregas: 0,
      entregas_conformes: 0,
      total_recusas: 0,
      taxa_conformidade: 0,

      // PDGP
      pdgps_programados: 0,
      pdgps_realizados: 0,
      pdgps_atrasados: 0
    };

    // Aqui viriam as consultas às planilhas para preencher os dados
    // Por enquanto, estrutura do relatório

    return relatorio;

  } catch (e) {
    Logger.log('Erro ao gerar relatório CRE: ' + e.message);
    throw e;
  }
}

/**
 * Calcula indicadores de desempenho da alimentação escolar
 */
function calcularIndicadoresDF() {
  return {
    // Indicador 1: Percentual de Agricultura Familiar
    agricultura_familiar: {
      meta: 30,
      realizado: 0,
      status: 'PENDENTE'
    },

    // Indicador 2: Taxa de conformidade de entregas
    conformidade_entregas: {
      meta: 95,
      realizado: 0,
      status: 'PENDENTE'
    },

    // Indicador 3: Execução orçamentária
    execucao_orcamentaria: {
      meta: 100,
      realizado: 0,
      status: 'PENDENTE'
    },

    // Indicador 4: Pontualidade PDGP
    pontualidade_pdgp: {
      meta: 90,
      realizado: 0,
      status: 'PENDENTE'
    },

    // Indicador 5: Cardápios especiais atendidos
    cardapios_especiais: {
      meta: 100,
      realizado: 0,
      status: 'PENDENTE'
    }
  };
}

// ============================================================================
// EXPORTAR FUNÇÕES
// ============================================================================

/**
 * Registra ajustes no sistema
 */
function registrarAjustesRealidadeDF() {
  Logger.log('✅ Ajustes da realidade do DF carregados');
  Logger.log('   - 14 CREs configuradas');
  Logger.log('   - PDGP semanal configurado');
  Logger.log('   - Sazonalidade do Cerrado considerada');
  Logger.log('   - Agricultura Familiar (30% mínimo)');
  Logger.log('   - Controle de temperatura adaptado ao clima');
}
