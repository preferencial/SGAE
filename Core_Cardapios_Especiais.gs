/**
 * Core_Cardapios_Especiais.gs
 * Sistema de Gestão de Cardápios para Alunos com Necessidades Especiais
 * Baseado na Nota Técnica N.º 2/2025 - SEE/SUAPE/DIAE/GPAE
 *
 * Implementa:
 * - Cadastro de alunos com necessidades alimentares especiais
 * - Gestão de laudos médicos
 * - Adaptação de cardápios por patologia
 * - Controle de aquisição de gêneros especiais via PDAF
 */

// ============================================================================
// CONSTANTES E CONFIGURAÇÕES
// ============================================================================

const CARDAPIOS_ESPECIAIS_CONFIG = {
  // Patologias principais (Seção 2.5.1)
  PATOLOGIAS_PRINCIPAIS: {
    APLV: {
      codigo: 'APLV',
      nome: 'Alergia à Proteína do Leite de Vaca',
      cid10: ['K52.2', 'L27.2'],
      restricoes: ['leite', 'derivados de leite', 'lactose', 'caseína', 'soro de leite'],
      tipo: 'PATOLOGIA'
    },
    DIABETES: {
      codigo: 'DIABETES',
      nome: 'Diabetes Mellitus',
      cid10: ['E10', 'E11', 'E13', 'E14'],
      restricoes: ['açúcar', 'doces', 'alimentos com alto índice glicêmico'],
      tipo: 'PATOLOGIA'
    },
    INTOLERANCIA_LACTOSE: {
      codigo: 'INTOLERANCIA_LACTOSE',
      nome: 'Intolerância à Lactose',
      cid10: ['E73'],
      restricoes: ['lactose', 'leite', 'derivados com lactose'],
      tipo: 'PATOLOGIA'
    },
    DOENCA_CELIACA: {
      codigo: 'DOENCA_CELIACA',
      nome: 'Alergia ou Intolerância ao Glúten (Doença Celíaca)',
      cid10: ['K90.0'],
      restricoes: ['glúten', 'trigo', 'centeio', 'cevada', 'aveia contaminada'],
      tipo: 'PATOLOGIA'
    },
    ALERGIA_OVO: {
      codigo: 'ALERGIA_OVO',
      nome: 'Alergia a Ovo',
      cid10: ['L27.2'],
      restricoes: ['ovo', 'clara de ovo', 'gema', 'albumina', 'ovomucina', 'ovoalbumina'],
      tipo: 'PATOLOGIA'
    },
    ALERGIA_AMENDOIM: {
      codigo: 'ALERGIA_AMENDOIM',
      nome: 'Alergia a Amendoim e Oleaginosas',
      cid10: ['T78.0'],
      restricoes: ['amendoim', 'castanhas', 'nozes', 'avelã', 'pistache', 'macadâmia'],
      tipo: 'PATOLOGIA'
    },
    FENILCETONURIA: {
      codigo: 'FENILCETONURIA',
      nome: 'Fenilcetonúria (PKU)',
      cid10: ['E70.0'],
      restricoes: ['fenilalanina', 'aspartame', 'proteínas em excesso'],
      tipo: 'PATOLOGIA'
    }
  },

  // Dietas por escolha (não médicas)
  DIETAS_ESPECIAIS: {
    VEGANO: {
      codigo: 'VEGANO',
      nome: 'Vegano - 100% Vegetal',
      cid10: [],
      restricoes: ['carne', 'frango', 'peixe', 'ovo', 'leite', 'mel', 'gelatina', 'qualquer produto animal'],
      tipo: 'DIETA',
      substituicoes: {
        'carne': 'proteína de soja, tofu, seitan, leguminosas',
        'leite': 'leite de soja, aveia, coco, amêndoas',
        'ovo': 'linhaça hidratada, chia, banana amassada',
        'mel': 'melado de cana, açúcar mascavo'
      }
    },
    VEGETARIANO: {
      codigo: 'VEGETARIANO',
      nome: 'Vegetariano (Ovolactovegetariano)',
      cid10: [],
      restricoes: ['carne', 'frango', 'peixe', 'frutos do mar'],
      tipo: 'DIETA',
      substituicoes: {
        'carne': 'ovo, queijo, tofu, leguminosas',
        'frango': 'proteína de soja, cogumelos'
      }
    },
    OVOLACTOVEGETARIANO: {
      codigo: 'OVOLACTOVEGETARIANO',
      nome: 'Ovolactovegetariano',
      cid10: [],
      restricoes: ['carne', 'frango', 'peixe'],
      tipo: 'DIETA',
      substituicoes: {
        'carne': 'ovo, queijo, leguminosas'
      }
    },
    PESCETARIANO: {
      codigo: 'PESCETARIANO',
      nome: 'Pescetariano',
      cid10: [],
      restricoes: ['carne vermelha', 'frango', 'aves'],
      tipo: 'DIETA',
      substituicoes: {
        'carne': 'peixe, frutos do mar, ovo'
      }
    }
  },

  // Modalidades de atendimento
  MODALIDADES: {
    PARCIAL: { codigo: 'PARCIAL', refeicoes: 1, descricao: 'Parcial (1 refeição)' },
    INTEGRAL: { codigo: 'INTEGRAL', refeicoes: 3, descricao: 'Integral (3 refeições)' },
    SEMI_INTEGRAL: { codigo: 'SEMI_INTEGRAL', refeicoes: 2, descricao: 'Semi-integral (2 refeições)' }
  },

  // Programas de trabalho por modalidade de ensino (Seção 1.3.1)
  PROGRAMAS_TRABALHO: {
    ENSINO_FUNDAMENTAL: '12.361.6221.2964.0001',
    CRECHE: '12.365.6221.2964.9317',
    PRE_ESCOLA: '12.365.6221.2964.9316',
    ENSINO_MEDIO: '12.362.6221.2964.0004',
    EJA: '12.366.6221.2964.9314',
    ENSINO_ESPECIAL: '12.367.6221.2964.9319'
  },

  // Prazo máximo do laudo médico (Seção 2.3.1)
  PRAZO_LAUDO_MESES: 12,

  // Status do cadastro
  STATUS: {
    ATIVO: 'ATIVO',
    INATIVO: 'INATIVO',
    PENDENTE_LAUDO: 'PENDENTE_LAUDO',
    LAUDO_VENCIDO: 'LAUDO_VENCIDO',
    TRANSFERIDO: 'TRANSFERIDO'
  }
};

// ============================================================================
// FUNÇÕES DE CADASTRO DE ALUNOS
// ============================================================================

/**
 * Cadastra aluno com necessidade alimentar especial
 * Conforme Seção 2.3 da Nota Técnica 2/2025
 *
 * @param {Object} dados - Dados do aluno
 * @returns {Object} Resultado da operação
 */
function cadastrarAlunoNecessidadeEspecial(dados) {
  try {
    try {
      // Validação de entrada
      if (!dados || typeof dados !== 'object') {
        Logger.log('Erro em cadastrarAlunoNecessidadeEspecial: ' + JSON.stringify({error: 'Dados não fornecidos', dados: dados}));
        return { success: false, error: 'Dados do aluno não fornecidos' };
      }
    
      // Validação básica
      if (!dados.nomeCompleto) return { success: false, error: 'Nome do aluno é obrigatório' };
      if (!dados.unidadeEscolar) return { success: false, error: 'Unidade escolar é obrigatória' };
      if (!dados.patologiaPrincipal) return { success: false, error: 'Patologia é obrigatória' };

      const aluno = {
        id: gerarIdAluno(),
        dataCadastro: new Date().toISOString(),

        // Dados do aluno
        nomeCompleto: dados.nomeCompleto,
        serie: dados.serie || '',
        turma: dados.turma || '',
        turno: dados.turno || '',

        // Unidade escolar
        unidadeEscolar: dados.unidadeEscolar,
        creRegional: dados.creRegional || '',

        // Patologia
        patologiaPrincipal: dados.patologiaPrincipal,
        outrasPatologias: dados.outrasPatologias || [],
        cid10: dados.cid10 || '',

        // Programa de trabalho e modalidade
        programaTrabalho: dados.programaTrabalho || '',
        modalidadeAtendimento: dados.modalidadeAtendimento || '',

        // Laudo médico
        laudo: {
          possui: dados.possuiLaudo || !!dados.validadeLaudo,
          dataLaudo: dados.dataLaudo || '',
          linkSEI: dados.linkLaudoSEI || '',
          profissionalSaude: dados.profissionalSaude || '',
          crmProfissional: dados.crmProfissional || '',
          valido: true
        },

        // Validade do laudo (campo direto do formulário)
        validadeLaudo: dados.validadeLaudo || '',

        // Observações
        observacoes: dados.observacoes || '',

        // Controle
        status: 'ATIVO',

        // Histórico
        historico: [{
          data: new Date().toISOString(),
          acao: 'Cadastro realizado',
          responsavel: dados.responsavelCadastro || Session.getActiveUser().getEmail()
        }]
      };

      const resultado = salvarAlunoNecessidadeEspecial(aluno);

      if (resultado.success) {
        // Notificar UNIAE para elaboração de cardápio
        notificarUNIAENovoAluno(aluno);
        Logger.log('[LGPD] Evento registrado; detalhes sensíveis omitidos.');
      }

      return resultado;

    } catch (error) {
      Logger.log('Erro em cadastrarAlunoNecessidadeEspecial: ' + error);
      return { success: false, error: error.message };
    }
  } catch (error) {
    Logger.log("Erro em cadastrarAlunoNecessidadeEspecial: " + error.message);
    throw error;
  }
}

/**
 * Atualiza dados de aluno com necessidade especial
 * @param {string} alunoId - ID do aluno
 * @param {Object} dados - Dados a atualizar
 * @returns {Object} Resultado
 */
function atualizarAlunoNecessidadeEspecial(alunoId, dados) {
  try {
    try {
      try {
        try {
          const ss = getSS();
          const sheet = ss.getSheetByName('Alunos_Necessidades_Especiais');

          if (!sheet) {
            return { success: false, error: 'Aba não encontrada' };
          }

          const dadosSheet = sheet.getDataRange().getValues();
          let linhaEncontrada = -1;

          for (let i = 1; i < dadosSheet.length; i++) {
            if (dadosSheet[i][0] === alunoId) {
              linhaEncontrada = i + 1;
              break;
            }
          }

          if (linhaEncontrada === -1) {
            return { success: false, error: 'Aluno não encontrado' };
          }

          // Atualizar campos específicos
          if (dados.status) {
            sheet.getRange(linhaEncontrada, 12).setValue(dados.status);
          }

          if (dados.dataLaudo) {
            const laudoValido = verificarValidadeLaudo(dados.dataLaudo);
            sheet.getRange(linhaEncontrada, 10).setValue(dados.dataLaudo);

            if (!laudoValido) {
              sheet.getRange(linhaEncontrada, 12).setValue(CARDAPIOS_ESPECIAIS_CONFIG.STATUS.LAUDO_VENCIDO);
            }
          }

          return { success: true, message: 'Aluno atualizado com sucesso' };

        } catch (error) {
          Logger.log('Erro em atualizarAlunoNecessidadeEspecial: ' + error);
          return { success: false, error: error.message };
        }
      } catch (error) {
        Logger.log("Erro em atualizarAlunoNecessidadeEspecial: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em atualizarAlunoNecessidadeEspecial: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em atualizarAlunoNecessidadeEspecial: " + error.message);
    throw error;
  }
}

/**
 * Verifica validade do laudo médico
 * Conforme Seção 2.3.1 - Prazo máximo de 1 ano
 *
 * @param {string} dataLaudo - Data do laudo
 * @returns {boolean} Se o laudo está válido
 */
function verificarValidadeLaudo(dataLaudo) {
  if (!dataLaudo) return false;

  const data = new Date(dataLaudo);
  const hoje = new Date();
  const diffMeses = (hoje.getFullYear() - data.getFullYear()) * 12 + (hoje.getMonth() - data.getMonth());

  return diffMeses <= CARDAPIOS_ESPECIAIS_CONFIG.PRAZO_LAUDO_MESES;
}

/**
 * Lista alunos com laudos vencidos ou próximos do vencimento
 * @param {number} diasAntecedencia - Dias de antecedência para alerta
 * @returns {Object} Lista de alunos
 */
function listarAlunosLaudoVencendo(diasAntecedencia) {
  try {
    diasAntecedencia = diasAntecedencia || 30;
    const resultado = listarAlunosNecessidadeEspecial({});

    if (!resultado.success) return resultado;

    const hoje = new Date();
    const alunosFiltrados = resultado.data.filter(function(aluno) {
      // Usar validadeLaudo ou calcular a partir de dataLaudo
      var dataValidade = aluno.validadeLaudo || aluno.dataLaudo;
      if (!dataValidade) return true; // Sem laudo = incluir no alerta

      var dataVencimento = new Date(dataValidade);
      
      // Se for dataLaudo (não validadeLaudo), adicionar 12 meses
      if (!aluno.validadeLaudo && aluno.dataLaudo) {
        dataVencimento.setMonth(dataVencimento.getMonth() + 12);
      }

      var diffDias = Math.ceil((dataVencimento - hoje) / (1000 * 60 * 60 * 24));

      return diffDias <= diasAntecedencia && diffDias >= 0;
    });

    Logger.log('listarAlunosLaudoVencendo: ' + alunosFiltrados.length + ' alunos com laudo vencendo em ' + diasAntecedencia + ' dias');
    return { success: true, data: alunosFiltrados };

  } catch (error) {
    Logger.log('Erro em listarAlunosLaudoVencendo: ' + error);
    return { success: false, data: [], error: error.message };
  }
}


// ============================================================================
// FUNÇÕES DE CARDÁPIO
// ============================================================================

/**
 * Gera cardápio especial para aluno
 * Conforme Seções 2.5 a 2.7 da Nota Técnica 2/2025
 *
 * @param {Object} dados - Dados para geração do cardápio
 * @returns {Object} Cardápio gerado
 */
function gerarCardapioEspecial(dados) {
  try {
    try {
      if (!dados) {
        return { success: false, error: 'Dados não fornecidos' };
      }

      if (!dados.patologia) {
        return { success: false, error: 'Patologia é obrigatória' };
      }

      // Buscar configuração da patologia ou dieta especial
      var patologiaConfig = null;
      var tipoDieta = 'PATOLOGIA';
      if (typeof CARDAPIOS_ESPECIAIS_CONFIG !== 'undefined') {
        // Primeiro busca nas patologias médicas
        if (CARDAPIOS_ESPECIAIS_CONFIG.PATOLOGIAS_PRINCIPAIS && CARDAPIOS_ESPECIAIS_CONFIG.PATOLOGIAS_PRINCIPAIS[dados.patologia]) {
          patologiaConfig = CARDAPIOS_ESPECIAIS_CONFIG.PATOLOGIAS_PRINCIPAIS[dados.patologia];
          tipoDieta = 'PATOLOGIA';
        }
        // Se não encontrou, busca nas dietas especiais (vegano, vegetariano, etc.)
        else if (CARDAPIOS_ESPECIAIS_CONFIG.DIETAS_ESPECIAIS && CARDAPIOS_ESPECIAIS_CONFIG.DIETAS_ESPECIAIS[dados.patologia]) {
          patologiaConfig = CARDAPIOS_ESPECIAIS_CONFIG.DIETAS_ESPECIAIS[dados.patologia];
          tipoDieta = 'DIETA';
        }
      }

      if (!patologiaConfig) {
        Logger.log('[LGPD] Evento registrado; detalhes sensíveis omitidos.');
        // Opcional: Retornar erro ou continuar com defaults?
        // Se continuar, helper functions vão falhar. Melhor retornar erro.
        return { success: false, error: 'Patologia não reconhecida: ' + dados.patologia };
      }

      // Buscar dados do aluno se alunoId foi fornecido
      var nomeAluno = dados.nomeAluno || '';
      var unidadeEscolar = dados.unidadeEscolar || '';
    
      if (dados.alunoId) {
        var buscaAluno = listarAlunosNecessidadeEspecial({});
        if (buscaAluno.success && buscaAluno.data) {
          var aluno = buscaAluno.data.find(function(a) { return a.id === dados.alunoId; });
          if (aluno) {
            nomeAluno = aluno.nomeCompleto;
            unidadeEscolar = aluno.unidadeEscolar;
          }
        }
      }

      const cardapio = {
        id: gerarIdCardapio(),
        dataGeracao: new Date().toISOString(),

        // Aluno
        alunoId: dados.alunoId || '',
        nomeAluno: nomeAluno,
        unidadeEscolar: unidadeEscolar,

        // Patologia ou Dieta
        patologia: dados.patologia,
        tipoDieta: tipoDieta,
        nomePatologia: patologiaConfig ? patologiaConfig.nome : dados.patologia,
        restricoes: patologiaConfig ? patologiaConfig.restricoes : [],
        substituicoes: patologiaConfig && patologiaConfig.substituicoes ? patologiaConfig.substituicoes : {},

        // Período
        distribuicao: dados.periodo || dados.distribuicao || 'SEMANAL',
        dataInicio: dados.dataInicio || new Date().toISOString().split('T')[0],
        dataFim: dados.dataFim || '',

        // Observações
        observacoes: dados.observacoes || '',

        // Responsável
        elaboradoPor: dados.elaboradoPor || Session.getActiveUser().getEmail(),
        nivelElaboracao: dados.nivelElaboracao || 'UNIAE',

        // Status
        status: 'ATIVO'
      };

      const resultado = salvarCardapioEspecial(cardapio);

      if (resultado.success) {
        Logger.log('[LGPD] Evento registrado; detalhes sensíveis omitidos.');
      }

      return resultado;

    } catch (error) {
      Logger.log('Erro em gerarCardapioEspecial: ' + error);
      return { success: false, error: error.message };
    }
  } catch (error) {
    Logger.log("Erro em gerarCardapioEspecial: " + error.message);
    throw error;
  }
}

/**
 * Gera substituições de alimentos conforme patologia
 * @param {Object} patologia - Dados da patologia
 * @param {Array} cardapioBase - Cardápio base
 * @returns {Array} Lista de substituições
 */
function gerarSubstituicoes(patologia, cardapioBase) {
  try {
    const substituicoes = [];

    // Validação de entrada
    if (!patologia || typeof patologia !== 'object') {
      Logger.log('gerarSubstituicoes: patologia inválida ou não fornecida');
      return substituicoes;
    }
  
    if (!patologia.codigo) {
      Logger.log('gerarSubstituicoes: patologia.codigo não definido');
      return substituicoes;
    }

    // Tabela de substituições por patologia
    const tabelaSubstituicoes = {
      'APLV': {
        'leite': 'bebida vegetal (soja, aveia)',
        'queijo': 'queijo vegetal ou tofu',
        'iogurte': 'iogurte vegetal',
        'manteiga': 'margarina sem leite',
        'creme de leite': 'creme vegetal'
      },
      'DIABETES': {
        'açúcar': 'adoçante culinário',
        'doce': 'fruta in natura',
        'suco industrializado': 'suco natural sem açúcar',
        'pão branco': 'pão integral'
      },
      'INTOLERANCIA_LACTOSE': {
        'leite': 'leite sem lactose ou bebida vegetal',
        'queijo': 'queijo sem lactose',
        'iogurte': 'iogurte sem lactose'
      },
      'DOENCA_CELIACA': {
        'pão': 'pão sem glúten',
        'macarrão': 'macarrão de arroz ou milho',
        'biscoito': 'biscoito sem glúten',
        'farinha de trigo': 'farinha de arroz ou fécula de batata',
        'aveia': 'aveia certificada sem glúten'
      }
    };

    const tabela = tabelaSubstituicoes[patologia.codigo] || {};

    if (cardapioBase && Array.isArray(cardapioBase)) {
      cardapioBase.forEach(item => {
        const alimentoLower = (item.alimento || '').toLowerCase();

        for (const [original, substituto] of Object.entries(tabela)) {
          if (alimentoLower.includes(original)) {
            substituicoes.push({
              alimentoOriginal: item.alimento,
              alimentoSubstituto: substituto,
              perCapitaOriginal: item.perCapita,
              perCapitaSubstituto: item.perCapita, // Manter equivalência
              observacao: `Substituição por ${patologia.nome}`
            });
          }
        }
      });
    }

    return substituicoes;
  } catch (error) {
    Logger.log("Erro em gerarSubstituicoes: " + error.message);
    throw error;
  }
}

/**
 * Calcula gêneros para aquisição via PDAF
 * Conforme Seção 3 da Nota Técnica 2/2025
 *
 * @param {Object} patologia - Dados da patologia
 * @param {Object} dados - Dados do cardápio
 * @returns {Array} Lista de gêneros para aquisição
 */
function calcularGenerosAquisicao(patologia, dados) {
  try {
    const generos = [];

    // Validação de entrada
    if (!patologia || typeof patologia !== 'object') {
      Logger.log('calcularGenerosAquisicao: patologia inválida ou não fornecida');
      return generos;
    }
  
    if (!patologia.codigo) {
      Logger.log('calcularGenerosAquisicao: patologia.codigo não definido');
      return generos;
    }

    // Gêneros específicos por patologia
    const generosEspecificos = {
      'APLV': [
        { produto: 'Bebida vegetal (soja/aveia)', unidade: 'L', perCapita: 0.2 },
        { produto: 'Margarina sem leite', unidade: 'KG', perCapita: 0.01 }
      ],
      'DIABETES': [
        { produto: 'Adoçante culinário', unidade: 'KG', perCapita: 0.005 }
      ],
      'INTOLERANCIA_LACTOSE': [
        { produto: 'Leite sem lactose', unidade: 'L', perCapita: 0.2 }
      ],
      'DOENCA_CELIACA': [
        { produto: 'Farinha sem glúten', unidade: 'KG', perCapita: 0.05 },
        { produto: 'Macarrão sem glúten', unidade: 'KG', perCapita: 0.08 },
        { produto: 'Pão sem glúten', unidade: 'UN', perCapita: 1 }
      ]
    };

    const lista = generosEspecificos[patologia.codigo] || [];
    const diasDistribuicao = dados.diasDistribuicao || 20;

    lista.forEach(item => {
      generos.push({
        ...item,
        quantidadeTotal: item.perCapita * diasDistribuicao,
        valorEstimado: null // A ser calculado com base em orçamentos
      });
    });

    return generos;
  } catch (error) {
    Logger.log("Erro em calcularGenerosAquisicao: " + error.message);
    throw error;
  }
}

// ============================================================================
// FUNÇÕES DE AQUISIÇÃO VIA PDAF
// ============================================================================

/**
 * Gera lista de aquisição para PDAF
 * Conforme Seção 3.1 da Nota Técnica 2/2025
 *
 * @param {string} unidadeEscolar - Nome da UE
 * @param {string} distribuicao - Período da distribuição
 * @returns {Object} Lista de aquisição
 */
function gerarListaAquisicaoPDAF(unidadeEscolar, distribuicao) {
  try {
    try {
      // Buscar alunos da UE com necessidades especiais
      const alunos = listarAlunosNecessidadeEspecial({ unidadeEscolar: unidadeEscolar });

      if (!alunos.success || alunos.data.length === 0) {
        return { success: true, data: [], message: 'Nenhum aluno com necessidade especial na UE' };
      }

      // Consolidar gêneros necessários
      const generosConsolidados = {};

      alunos.data.forEach(aluno => {
        const patologia = CARDAPIOS_ESPECIAIS_CONFIG.PATOLOGIAS_PRINCIPAIS[aluno.patologiaPrincipal];
        if (!patologia) return;

        const generos = calcularGenerosAquisicao(patologia, { diasDistribuicao: 20 });

        generos.forEach(g => {
          const chave = g.produto;
          if (!generosConsolidados[chave]) {
            generosConsolidados[chave] = {
              produto: g.produto,
              unidade: g.unidade,
              quantidadeTotal: 0,
              alunosAtendidos: 0
            };
          }
          generosConsolidados[chave].quantidadeTotal += g.quantidadeTotal;
          generosConsolidados[chave].alunosAtendidos++;
        });
      });

      const listaAquisicao = {
        unidadeEscolar: unidadeEscolar,
        distribuicao: distribuicao,
        dataGeracao: new Date().toISOString(),
        totalAlunos: alunos.data.length,
        generos: Object.values(generosConsolidados),

        // Documentação necessária (Seção 3.1)
        documentacaoNecessaria: [
          'Cópia dos laudos médicos',
          'Dados dos estudantes (nome, ano, turma, turno, endereço, telefone)',
          'Lista de gêneros a serem adquiridos',
          'Ata com apreciação do Conselho Escolar',
          'Três orçamentos',
          'Cópia dos comprovantes de despesas (notas fiscais)',
          'Cópia dos cheques nominais'
        ]
      };

      return { success: true, data: listaAquisicao };

    } catch (error) {
      Logger.log('Erro em gerarListaAquisicaoPDAF: ' + error);
      return { success: false, error: error.message };
    }
  } catch (error) {
    Logger.log("Erro em gerarListaAquisicaoPDAF: " + error.message);
    throw error;
  }
}

// ============================================================================
// FUNÇÕES DE VALIDAÇÃO
// ============================================================================

/**
 * Valida dados do aluno
 * @param {Object} dados - Dados a validar
 */
function validarDadosAluno(dados) {
  try {
    // Validação de entrada
    if (!dados || typeof dados !== 'object') {
      return { valido: false, erros: ['Dados do aluno não fornecidos ou inválidos'] };
    }
  
    const erros = [];
    const camposObrigatorios = ['nomeCompleto', 'unidadeEscolar', 'patologiaPrincipal'];

    for (const campo of camposObrigatorios) {
      if (!dados[campo]) {
        erros.push(`Campo obrigatório não preenchido: ${campo}`);
      }
    }

    // Validar patologia
    if (dados.patologiaPrincipal && 
        !CARDAPIOS_ESPECIAIS_CONFIG.PATOLOGIAS_PRINCIPAIS[dados.patologiaPrincipal] &&
        dados.patologiaPrincipal !== 'OUTRA') {
      erros.push('Patologia não reconhecida');
    }

    return {
      valido: erros.length === 0,
      erros: erros
    };
  } catch (error) {
    Logger.log("Erro em validarDadosAluno: " + error.message);
    throw error;
  }
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Gera ID único para aluno
 * @returns {string} ID gerado
 */
function gerarIdAluno() {
  try {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `ALU-${timestamp}-${random}`.toUpperCase();
  } catch (error) {
    Logger.log("Erro em gerarIdAluno: " + error.message);
    throw error;
  }
}

/**
 * Gera ID único para cardápio
 * @returns {string} ID gerado
 */
function gerarIdCardapio() {
  try {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `CARD-${timestamp}-${random}`.toUpperCase();
  } catch (error) {
    Logger.log("Erro em gerarIdCardapio: " + error.message);
    throw error;
  }
}

/**
 * Salva aluno com necessidade especial
 * @param {Object} aluno - Dados do aluno
 * @returns {Object} Resultado
 */
function salvarAlunoNecessidadeEspecial(aluno) {
  try {
    try {
      try {
        try {
          // Validação de entrada
          if (!aluno || typeof aluno !== 'object') {
            return { success: false, error: 'Dados do aluno não fornecidos' };
          }
    
          const ss = getSS();
          if (!ss) {
            return { success: false, error: 'Planilha não encontrada' };
          }
    
          let sheet = ss.getSheetByName('Alunos_Necessidades_Especiais');

          if (!sheet) {
            sheet = criarAbaAlunosNecessidadesEspeciais(ss);
          }

          // Calcular validade do laudo (1 ano após a data do laudo, se não informada)
          let validadeLaudo = aluno.validadeLaudo || '';
          if (!validadeLaudo && aluno.laudo && aluno.laudo.dataLaudo) {
            const dataLaudo = new Date(aluno.laudo.dataLaudo);
            dataLaudo.setFullYear(dataLaudo.getFullYear() + 1);
            validadeLaudo = dataLaudo.toISOString().split('T')[0];
          }

          const linha = [
            aluno.id,
            aluno.dataCadastro,
            aluno.nomeCompleto,
            aluno.serie || '',
            aluno.turma || '',
            aluno.turno || '',
            aluno.unidadeEscolar,
            aluno.creRegional || '',
            aluno.patologiaPrincipal,
            aluno.laudo ? aluno.laudo.dataLaudo || '' : '',
            aluno.laudo ? aluno.laudo.linkSEI || '' : '',
            aluno.status,
            aluno.programaTrabalho || '',
            aluno.modalidadeAtendimento || '',
            validadeLaudo || '',
            aluno.observacoes || ''
          ];

          sheet.appendRow(linha);

          return { success: true, id: aluno.id };

        } catch (error) {
          Logger.log('Erro ao salvar aluno: ' + error);
          return { success: false, error: error.message };
        }
      } catch (error) {
        Logger.log("Erro em salvarAlunoNecessidadeEspecial: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em salvarAlunoNecessidadeEspecial: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em salvarAlunoNecessidadeEspecial: " + error.message);
    throw error;
  }
}

/**
 * Cria aba de alunos com necessidades especiais
 * @param {Spreadsheet} ss - Planilha
 * @returns {Sheet} Aba criada
 */
/**
 * Cria aba de alunos com necessidades especiais
 * @param {Spreadsheet} ss - Planilha
 * @returns {Sheet} Aba criada
 */
function criarAbaAlunosNecessidadesEspeciais(ss) {
  try {
    try {
      try {
        // Validação de entrada
        if (!ss || typeof ss.insertSheet !== 'function') {
          ss = getSS();
          if (!ss) {
            throw new Error('Não foi possível obter a planilha ativa');
          }
        }
  
        let sheet = ss.getSheetByName('Alunos_Necessidades_Especiais');
        if (sheet) {
          return sheet;
        }
  
        sheet = ss.insertSheet('Alunos_Necessidades_Especiais');

        const cabecalhos = [
          'ID', 'Data Cadastro', 'Nome Completo', 'Série', 'Turma', 'Turno',
          'Unidade Escolar', 'CRE', 'Patologia Principal', 'Data Laudo',
          'Link Laudo SEI', 'Status', 'Programa Trabalho', 'Modalidade', 'Validade Laudo', 'Observacoes'
        ];

        sheet.getRange(1, 1, 1, cabecalhos.length).setValues([cabecalhos]);
        sheet.getRange(1, 1, 1, cabecalhos.length)
          .setBackground('#10b981')
          .setFontColor('white')
          .setFontWeight('bold');

        sheet.setFrozenRows(1);

        return sheet;
      } catch (error) {
        Logger.log("Erro em criarAbaAlunosNecessidadesEspeciais: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em criarAbaAlunosNecessidadesEspeciais: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em criarAbaAlunosNecessidadesEspeciais: " + error.message);
    throw error;
  }
}

/**
 * Salva cardápio especial
 * @param {Object} cardapio - Dados do cardápio
 * @returns {Object} Resultado
 */
function salvarCardapioEspecial(cardapio) {
  try {
    try {
      try {
        try {
          // Validação de entrada
          if (!cardapio || typeof cardapio !== 'object') {
            return { success: false, error: 'Dados do cardápio não fornecidos' };
          }
    
          if (!cardapio.id) {
            cardapio.id = gerarIdCardapio();
          }
    
          const ss = getSS();
          if (!ss) {
            return { success: false, error: 'Planilha não encontrada' };
          }
    
          let sheet = ss.getSheetByName('Cardapios_Especiais');

          if (!sheet) {
            sheet = ss.insertSheet('Cardapios_Especiais');
            const cabecalhos = ['ID', 'Data Geração', 'Aluno ID', 'Nome Aluno', 'UE',
                               'Patologia', 'Distribuição', 'Elaborado Por', 'Status'];
            sheet.getRange(1, 1, 1, cabecalhos.length).setValues([cabecalhos]);
            sheet.getRange(1, 1, 1, cabecalhos.length).setBackground('#10b981').setFontColor('white').setFontWeight('bold');
          }

          const linha = [
            cardapio.id,
            cardapio.dataGeracao,
            cardapio.alunoId,
            cardapio.nomeAluno,
            cardapio.unidadeEscolar,
            cardapio.patologia,
            cardapio.distribuicao,
            cardapio.elaboradoPor,
            cardapio.status
          ];

          sheet.appendRow(linha);

          return { success: true, id: cardapio.id, data: cardapio };

        } catch (error) {
          Logger.log('Erro ao salvar cardápio: ' + error);
          return { success: false, error: error.message };
        }
      } catch (error) {
        Logger.log("Erro em salvarCardapioEspecial: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em salvarCardapioEspecial: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em salvarCardapioEspecial: " + error.message);
    throw error;
  }
}

/**
 * Lista cardápios especiais cadastrados
 * @param {Object} filtros - Filtros opcionais
 * @returns {Object} Lista de cardápios
 */
function listarCardapiosEspeciais(filtros) {
  try {
    try {
      try {
        const ss = getSS();
        const sheet = ss.getSheetByName('Cardapios_Especiais');

        if (!sheet || sheet.getLastRow() <= 1) {
          return { success: true, data: [] };
        }

        const dados = sheet.getDataRange().getValues();
        const cabecalhos = dados[0];
        // Headers: ID[0], Data Geração[1], Aluno ID[2], Nome Aluno[3], UE[4], Patologia[5], Distribuição[6], Elaborado Por[7], Status[8]

        const cardapios = [];

        for (let i = 1; i < dados.length; i++) {
          const row = dados[i];
          if (!row[0]) continue; // Pular linhas vazias
      
          cardapios.push({
            id: row[0],
            dataGeracao: row[1],
            alunoId: row[2],
            alunoNome: row[3],
            unidadeEscolar: row[4],
            patologia: row[5],
            distribuicao: row[6],
            elaboradoPor: row[7],
            status: row[8] || 'ATIVO'
          });
        }

        // Ordenar por data de geração (mais recentes primeiro)
        cardapios.sort(function(a, b) {
          return new Date(b.dataGeracao) - new Date(a.dataGeracao);
        });

        Logger.log('listarCardapiosEspeciais: Retornando ' + cardapios.length + ' cardápios');
        return { success: true, data: cardapios };

      } catch (error) {
        Logger.log('Erro listarCardapiosEspeciais: ' + error.message);
        return { success: false, data: [], error: error.message };
      }
    } catch (error) {
      Logger.log("Erro em listarCardapiosEspeciais: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em listarCardapiosEspeciais: " + error.message);
    throw error;
  }
}

/**
 * Lista alunos com necessidades especiais
 * @param {Object} filtros - Filtros de busca
 * @returns {Object} Lista de alunos
 */
function listarAlunosNecessidadeEspecial(filtros = {}) {
  try {
    try {
      try {
        const ss = getSS();
        const sheet = ss.getSheetByName('Alunos_Necessidades_Especiais');

        if (!sheet || sheet.getLastRow() <= 1) {
          return { success: true, data: [] };
        }

        const dados = sheet.getDataRange().getValues();
        // Headers: ID[0], Data Cadastro[1], Nome Completo[2], Série[3], Turma[4], Turno[5],
        //          Unidade Escolar[6], CRE[7], Patologia Principal[8], Data Laudo[9],
        //          Link Laudo SEI[10], Status[11], Programa Trabalho[12], Modalidade[13], Validade Laudo[14]

        let alunos = [];

        for (let i = 1; i < dados.length; i++) {
          const row = dados[i];
          if (!row[0]) continue; // Pular linhas vazias
      
          const aluno = {
            id: row[0],
            dataCadastro: row[1],
            nomeCompleto: row[2],
            serie: row[3],
            turma: row[4],
            turno: row[5],
            unidadeEscolar: row[6],
            cre: row[7],
            patologiaPrincipal: row[8],
            dataLaudo: row[9],
            linkLaudoSEI: row[10],
            status: row[11] || 'ATIVO',
            programaTrabalho: row[12],
            modalidade: row[13],
            validadeLaudo: row[14] || row[9] // Usa validade ou data do laudo como fallback
          };

          // Aplicar filtros
          let incluir = true;

          if (filtros.unidadeEscolar && aluno.unidadeEscolar !== filtros.unidadeEscolar) incluir = false;
          if (filtros.patologia && aluno.patologiaPrincipal !== filtros.patologia) incluir = false;
          if (filtros.status && aluno.status !== filtros.status) incluir = false;
          if (filtros.creRegional && aluno.cre !== filtros.creRegional) incluir = false;

          if (incluir) {
            alunos.push(aluno);
          }
        }

        Logger.log('listarAlunosNecessidadeEspecial: Retornando ' + alunos.length + ' alunos');
        return { success: true, data: alunos };

      } catch (error) {
        Logger.log('Erro ao listar alunos: ' + error);
        return { success: false, data: [], error: error.message };
      }
    } catch (error) {
      Logger.log("Erro em listarAlunosNecessidadeEspecial: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em listarAlunosNecessidadeEspecial: " + error.message);
    throw error;
  }
}

/**
 * Notifica UNIAE sobre novo aluno cadastrado
 * @param {Object} aluno - Dados do aluno
 */
function notificarUNIAENovoAluno(aluno) {
  // Validação de entrada
  if (!aluno || typeof aluno !== 'object') {
    Logger.log('notificarUNIAENovoAluno: Dados do aluno não fornecidos');
    return;
  }
  
  var nomeAluno = aluno.nomeCompleto || 'Nome não informado';
  var patologia = aluno.patologiaPrincipal || 'Patologia não informada';
  
  Logger.log('[LGPD] Evento registrado; detalhes sensíveis omitidos.');
}

// ============================================================================
// FUNÇÕES DE RELATÓRIO
// ============================================================================

/**
 * Gera relatório consolidado de alunos por CRE
 * @returns {Object} Relatório
 */
function gerarRelatorioAlunosPorCRE() {
  try {
    const resultado = listarAlunosNecessidadeEspecial({});

    if (!resultado.success) return resultado;

    const relatorio = {
      dataGeracao: new Date().toISOString(),
      totalGeral: resultado.data.length,
      porCRE: {},
      porPatologia: {}
    };

    resultado.data.forEach(aluno => {
      // Por CRE
      const cre = aluno.cre || 'Não informada';
      if (!relatorio.porCRE[cre]) {
        relatorio.porCRE[cre] = { total: 0, porPatologia: {} };
      }
      relatorio.porCRE[cre].total++;

      // Por patologia dentro da CRE
      const pat = aluno.patologiaPrincipal || 'Não informada';
      relatorio.porCRE[cre].porPatologia[pat] = (relatorio.porCRE[cre].porPatologia[pat] || 0) + 1;

      // Total por patologia
      relatorio.porPatologia[pat] = (relatorio.porPatologia[pat] || 0) + 1;
    });

    return { success: true, data: relatorio };

  } catch (error) {
    Logger.log('Erro em gerarRelatorioAlunosPorCRE: ' + error);
    return { success: false, error: error.message };
  }
}

/**
 * Verifica e atualiza status de laudos vencidos
 * Deve ser executado periodicamente
 */
function verificarLaudosVencidos() {
  try {
    try {
      const resultado = listarAlunosNecessidadeEspecial({ status: CARDAPIOS_ESPECIAIS_CONFIG.STATUS.ATIVO });

      if (!resultado.success) return resultado;

      let atualizados = 0;

      resultado.data.forEach(aluno => {
        if (aluno.dataLaudo && !verificarValidadeLaudo(aluno.dataLaudo)) {
          atualizarAlunoNecessidadeEspecial(aluno.id, {
            status: CARDAPIOS_ESPECIAIS_CONFIG.STATUS.LAUDO_VENCIDO
          });
          atualizados++;
        }
      });

      return {
        success: true,
        message: `${atualizados} aluno(s) com laudo vencido identificado(s)`
      };

    } catch (error) {
      Logger.log('Erro em verificarLaudosVencidos: ' + error);
      return { success: false, error: error.message };
    }
  } catch (error) {
    Logger.log("Erro em verificarLaudosVencidos: " + error.message);
    throw error;
  }
}
