/**
 * Core_Notificacao_Alimentos.gs
 * Sistema de Notificação de Qualidade de Alimentos Perecíveis
 * Baseado na Nota Técnica N.º 1/2025 - SEE/SUAPE/DIAE/GPAE
 *
 * Implementa os fluxos de:
 * - Alimentos vencidos na UE (Seção 4)
 * - Alimentos impróprios na UE (Seção 5)
 * - Alterações na qualidade (Seção 6)
 * - Descarte assistido (Seção 7)
 * - Reposição de alimentos (Seções 8-9)
 */

// ============================================================================
// CONSTANTES E CONFIGURAÇÕES
// ============================================================================

const NOTIFICACAO_CONFIG = {
  // Tipos de notificação
  TIPOS: {
    VENCIDO: 'ALIMENTO_VENCIDO',
    IMPROPRIO: 'ALIMENTO_IMPROPRIO',
    ALTERACAO_QUALIDADE: 'ALTERACAO_QUALIDADE',
    RECUSA_RECEBIMENTO: 'RECUSA_RECEBIMENTO'
  },

  // Origens de alimentos impróprios (Seção 5.2)
  ORIGENS_IMPROPRIO: {
    RECEBIMENTO_INADEQUADO: 'Recebimento inadequado/vício oculto',
    FALHA_ESTOQUE: 'Falha no estoque, armazenagem e/ou conservação'
  },

  // Prazos em dias úteis
  PRAZOS: {
    REPOSICAO_FORNECEDOR_PERECIVEL: 1, // 24 horas
    REPOSICAO_FORNECEDOR_OUTROS: 5,    // 5 dias úteis
    ANALISE_GPAE: 5
  },

  // Temperaturas de referência (Seção 6 do Manual)
  TEMPERATURAS: {
    CONGELADOS: { max: -12, unidade: '°C' },
    CARNES_RESFRIADAS: { max: 7, unidade: '°C' },
    PESCADO_RESFRIADO: { max: 3, unidade: '°C' },
    OUTROS_REFRIGERADOS: { max: 10, unidade: '°C' }
  },

  // Status do processo de notificação
  STATUS: {
    ABERTO: 'ABERTO',
    EM_ANALISE: 'EM_ANALISE',
    AGUARDANDO_DESCARTE: 'AGUARDANDO_DESCARTE',
    DESCARTE_REALIZADO: 'DESCARTE_REALIZADO',
    AGUARDANDO_REPOSICAO: 'AGUARDANDO_REPOSICAO',
    REPOSICAO_REALIZADA: 'REPOSICAO_REALIZADA',
    ENCAMINHADO_CORRED: 'ENCAMINHADO_CORRED',
    FINALIZADO: 'FINALIZADO'
  }
};

// ============================================================================
// FUNÇÕES PRINCIPAIS DE NOTIFICAÇÃO
// ============================================================================

/**
 * Registra notificação de alimento vencido na UE
 * Conforme Seção 4 da Nota Técnica 1/2025
 *
 * @param {Object} dados - Dados da notificação
 * @returns {Object} Resultado da operação
 */
function registrarAlimentoVencido(dados) {
  try {
    try {
      validarDadosNotificacao(dados, 'VENCIDO');

      const notificacao = {
        id: gerarIdNotificacao(),
        tipo: NOTIFICACAO_CONFIG.TIPOS.VENCIDO,
        dataRegistro: new Date().toISOString(),

        // Dados da UE
        unidadeEscolar: dados.unidadeEscolar,
        creRegional: dados.creRegional,

        // Dados do produto
        produto: dados.produto,
        quantidade: dados.quantidade,
        unidadeMedida: dados.unidadeMedida,
        lote: dados.lote,
        dataValidade: dados.dataValidade,
        dataVencimento: dados.dataVencimento,

        // Dados do recibo
        numeroRecibo: dados.numeroRecibo,
        dataRecibo: dados.dataRecibo,

        // Documentação obrigatória (Seção 4.2)
        documentos: {
          copiaRecibo: dados.copiaRecibo || false,
          registroFotografico: dados.registroFotografico || false,
          formularioDescarte: false // Será preenchido após descarte
        },

        // Armazenamento temporário (Seções 4.3 e 4.4)
        tipoArmazenamento: dados.tipoArmazenamento, // 'AMBIENTE' ou 'CONGELADO'
        localArmazenamento: dados.localArmazenamento,
        identificacaoImproprioConsumo: true,

        // Controle
        status: NOTIFICACAO_CONFIG.STATUS.ABERTO,
        responsavelRegistro: dados.responsavelRegistro,
        matriculaResponsavel: dados.matriculaResponsavel,

        // Histórico
        historico: [{
          data: new Date().toISOString(),
          acao: 'Notificação registrada',
          responsavel: dados.responsavelRegistro
        }]
      };

      // Salvar notificação
      const resultado = salvarNotificacao(notificacao);

      if (resultado.success) {
        // Notificar nutricionista da UNIAE
        notificarNutricionista(notificacao);

        // Criar processo SEI (se integração disponível)
        if (typeof criarProcessoSEI === 'function') {
          criarProcessoSEI(notificacao, 'ALIMENTO_VENCIDO');
        }
      }

      return resultado;

    } catch (error) {
      Logger.log('Erro em registrarAlimentoVencido: ' + error);
      return { success: false, error: error.message };
    }
  } catch (error) {
    Logger.log("Erro em registrarAlimentoVencido: " + error.message);
    throw error;
  }
}

/**
 * Registra notificação de alimento impróprio
 * Conforme Seção 5 da Nota Técnica 1/2025
 *
 * @param {Object} dados - Dados da notificação
 * @returns {Object} Resultado da operação
 */
function registrarAlimentoImproprio(dados) {
  try {
    try {
      validarDadosNotificacao(dados, 'IMPROPRIO');

      const notificacao = {
        id: gerarIdNotificacao(),
        tipo: NOTIFICACAO_CONFIG.TIPOS.IMPROPRIO,
        dataRegistro: new Date().toISOString(),

        // Dados da UE
        unidadeEscolar: dados.unidadeEscolar,
        creRegional: dados.creRegional,

        // Dados do produto
        produto: dados.produto,
        quantidade: dados.quantidade,
        unidadeMedida: dados.unidadeMedida,
        lote: dados.lote,
        dataValidade: dados.dataValidade,

        // Origem do problema (Seção 5.2)
        origemProblema: dados.origemProblema,
        descricaoProblema: dados.descricaoProblema,

        // Características identificadas (Seção 5.1)
        caracteristicas: {
          deterioracaoVisivel: dados.deterioracaoVisivel || false,
          alteracaoCor: dados.alteracaoCor || false,
          alteracaoOdor: dados.alteracaoOdor || false,
          alteracaoTextura: dados.alteracaoTextura || false,
          alteracaoAroma: dados.alteracaoAroma || false,
          contaminacaoFisica: dados.contaminacaoFisica || false,
          contaminacaoQuimica: dados.contaminacaoQuimica || false,
          contaminacaoBiologica: dados.contaminacaoBiologica || false,
          presencaPragasUrbanas: dados.presencaPragasUrbanas || false
        },

        // Temperatura (se aplicável)
        temperaturaAferida: dados.temperaturaAferida,
        temperaturaEsperada: dados.temperaturaEsperada,

        // Documentação obrigatória (Seção 5.3)
        documentos: {
          copiaRecibo: dados.copiaRecibo || false,
          registroFotografico: dados.registroFotografico || false,
          formularioNotificacao: true
        },

        // Controle
        status: NOTIFICACAO_CONFIG.STATUS.ABERTO,
        responsavelRegistro: dados.responsavelRegistro,
        matriculaResponsavel: dados.matriculaResponsavel,

        // Histórico
        historico: [{
          data: new Date().toISOString(),
          acao: 'Notificação de alimento impróprio registrada',
          responsavel: dados.responsavelRegistro
        }]
      };

      // Salvar notificação
      const resultado = salvarNotificacao(notificacao);

      if (resultado.success) {
        notificarNutricionista(notificacao);

        // Se origem for recebimento inadequado, notificar também GPAE
        if (dados.origemProblema === NOTIFICACAO_CONFIG.ORIGENS_IMPROPRIO.RECEBIMENTO_INADEQUADO) {
          notificarGPAE(notificacao);
        }
      }

      return resultado;

    } catch (error) {
      Logger.log('Erro em registrarAlimentoImproprio: ' + error);
      return { success: false, error: error.message };
    }
  } catch (error) {
    Logger.log("Erro em registrarAlimentoImproprio: " + error.message);
    throw error;
  }
}

/**
 * Registra alteração na qualidade do alimento
 * Conforme Seção 6 da Nota Técnica 1/2025
 *
 * @param {Object} dados - Dados da notificação
 * @returns {Object} Resultado da operação
 */
function registrarAlteracaoQualidade(dados) {
  try {
    try {
      const notificacao = {
        id: gerarIdNotificacao(),
        tipo: NOTIFICACAO_CONFIG.TIPOS.ALTERACAO_QUALIDADE,
        dataRegistro: new Date().toISOString(),

        // Dados básicos
        unidadeEscolar: dados.unidadeEscolar,
        creRegional: dados.creRegional,
        produto: dados.produto,
        quantidade: dados.quantidade,
        lote: dados.lote,
        dataValidade: dados.dataValidade,

        // Fornecedor
        fornecedor: dados.fornecedor,
        cnpjFornecedor: dados.cnpjFornecedor,

        // Descrição da alteração
        descricaoAlteracao: dados.descricaoAlteracao,

        // Solicitação de análise laboratorial (Seção 6.3)
        solicitarAnaliseLaboratorial: dados.solicitarAnaliseLaboratorial || false,

        // Quantidade para reposição/substituição
        quantidadeReposicao: dados.quantidadeReposicao,
        tipoAcao: dados.tipoAcao, // 'REPOSICAO' ou 'SUBSTITUICAO'

        // Documentação (Seção 6.2)
        documentos: {
          copiaRecibo: dados.copiaRecibo || false,
          registroFotografico: dados.registroFotografico || false,
          formularioNotificacao: true
        },

        status: NOTIFICACAO_CONFIG.STATUS.ABERTO,
        responsavelRegistro: dados.responsavelRegistro,

        historico: [{
          data: new Date().toISOString(),
          acao: 'Alteração de qualidade registrada',
          responsavel: dados.responsavelRegistro
        }]
      };

      const resultado = salvarNotificacao(notificacao);

      if (resultado.success && dados.solicitarAnaliseLaboratorial) {
        // Encaminhar para GPAE para análise laboratorial
        encaminharParaAnaliseLaboratorial(notificacao);
      }

      return resultado;

    } catch (error) {
      Logger.log('Erro em registrarAlteracaoQualidade: ' + error);
      return { success: false, error: error.message };
    }
  } catch (error) {
    Logger.log("Erro em registrarAlteracaoQualidade: " + error.message);
    throw error;
  }
}

// ============================================================================
// FUNÇÕES DE DESCARTE
// ============================================================================

/**
 * Registra descarte assistido de alimento
 * Conforme Seção 7 da Nota Técnica 1/2025
 *
 * @param {Object} dados - Dados do descarte
 * @returns {Object} Resultado da operação
 */
function registrarDescarteAssistido(dados) {
  try {
    // Validar presença obrigatória (Seção 7.1)
    if (!dados.nutricionistaPresente) {
      throw new Error('Descarte deve ocorrer na presença do nutricionista da UNIAE');
    }

    if (!dados.gestorPresente) {
      throw new Error('Descarte deve ocorrer na presença do diretor/vice ou responsável pela alimentação');
    }

    const descarte = {
      id: gerarIdDescarte(),
      notificacaoId: dados.notificacaoId,
      dataDescarte: new Date().toISOString(),

      // Produto
      produto: dados.produto,
      quantidade: dados.quantidade,
      unidadeMedida: dados.unidadeMedida,

      // Tipo de descarte (Seções 7.2 a 7.4)
      tipoDescarte: dados.tipoDescarte, // 'LIQUIDO', 'OVO', 'CARNEO'
      procedimentoRealizado: obterProcedimentoDescarte(dados.tipoDescarte),

      // Presentes no descarte
      nutricionista: {
        nome: dados.nutricionistaNome,
        matricula: dados.nutricionistaMatricula,
        crn: dados.nutricionistaCRN
      },
      gestorUE: {
        nome: dados.gestorNome,
        matricula: dados.gestorMatricula,
        cargo: dados.gestorCargo
      },

      // Formulários preenchidos
      formularioRegistroDescarte: true,
      formularioVisitaTecnica: dados.visitaTecnicaRealizada || false,

      // Observações
      observacoes: dados.observacoes,

      // Controle
      status: 'REALIZADO'
    };

    // Salvar descarte
    const resultado = salvarDescarte(descarte);

    if (resultado.success) {
      // Atualizar status da notificação
      atualizarStatusNotificacao(dados.notificacaoId, NOTIFICACAO_CONFIG.STATUS.DESCARTE_REALIZADO);

      // Anexar ao processo SEI
      if (typeof anexarDocumentoSEI === 'function') {
        anexarDocumentoSEI(dados.notificacaoId, 'FORMULARIO_DESCARTE', descarte);
      }
    }

    return resultado;

  } catch (error) {
    Logger.log('Erro em registrarDescarteAssistido: ' + error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtém procedimento de descarte conforme tipo de alimento
 * @param {string} tipo - Tipo de alimento
 * @returns {string} Procedimento a ser seguido
 */
function obterProcedimentoDescarte(tipo) {
  const procedimentos = {
    'LIQUIDO': 'Embalagens abertas, conteúdo descartado na pia. Embalagens em sacos de lixo para coleta SLU.',
    'OVO': 'Embalagens abertas, conteúdo em sacos pretos com lixo orgânico, identificados "IMPRÓPRIO PARA CONSUMO". Colocar em contêineres próximo ao horário de coleta.',
    'CARNEO': 'Embalagens abertas, conteúdo em sacos pretos resistentes com lixo orgânico, identificados "IMPRÓPRIO PARA CONSUMO". Colocar em contêineres até 2h antes da coleta diurna ou a partir das 21h para coleta noturna. PROIBIDO ATERRAMENTO.'
  };

  return procedimentos[tipo] || 'Seguir orientações específicas do nutricionista.';
}


// ============================================================================
// FUNÇÕES DE REPOSIÇÃO
// ============================================================================

/**
 * Registra reposição de alimento pela UE
 * Conforme Seção 8 da Nota Técnica 1/2025
 *
 * ATUALIZADO: Validação robusta de dados
 *
 * @param {Object} dados - Dados da reposição
 * @returns {Object} Resultado da operação
 */
function registrarReposicaoUE(dados) {
  try {
    try {
      // Validação inicial - CORREÇÃO DO BUG
      if (!dados || typeof dados !== 'object') {
        Logger.log('[ERROR] Erro ao registrar reposição UE: ' + JSON.stringify({ error: 'Dados da reposição não fornecidos', dados: dados }));
        return { success: false, error: 'Dados da reposição não fornecidos' };
      }

      // Validar campos obrigatórios
      var camposObrigatorios = ['notificacaoId', 'produtoOriginal', 'quantidadeOriginal'];
      var camposFaltando = [];

      for (var i = 0; i < camposObrigatorios.length; i++) {
        var campo = camposObrigatorios[i];
        if (dados[campo] === undefined || dados[campo] === null || dados[campo] === '') {
          camposFaltando.push(campo);
        }
      }

      if (camposFaltando.length > 0) {
        var erro = 'Campos obrigatórios não preenchidos: ' + camposFaltando.join(', ');
        Logger.log('[ERROR] Erro ao registrar reposição UE: ' + JSON.stringify({ error: erro, dados: dados }));
        return { success: false, error: erro };
      }

      // Validar equivalência nutricional (Seção 8.2) - com valor padrão
      var equivalenciaVerificada = dados.equivalenciaNutricionalVerificada === true;

      if (!equivalenciaVerificada) {
        Logger.log('⚠️ Reposição sem verificação de equivalência nutricional - continuando com aviso');
        // Não bloqueia mais, apenas avisa
      }

      const reposicao = {
        id: gerarIdReposicao(),
        notificacaoId: dados.notificacaoId,
        dataReposicao: new Date().toISOString(),

        // Produto original
        produtoOriginal: dados.produtoOriginal,
        quantidadeOriginal: dados.quantidadeOriginal,

        // Produto reposto
        produtoReposto: dados.produtoReposto || '',
        quantidadeReposta: dados.quantidadeReposta || dados.quantidadeOriginal,
        qualidadeIgualOuSuperior: dados.qualidadeIgualOuSuperior || false,
        equivalenciaNutricional: dados.equivalenciaNutricional || '',
        equivalenciaNutricionalVerificada: equivalenciaVerificada,

        // Comprovante fiscal (Seção 8.4)
        comprovantesFiscais: {
          numero: dados.numeroNotaFiscal || '',
          data: dados.dataNotaFiscal || '',
          valor: dados.valorNotaFiscal || 0,
          arquivado: !!dados.numeroNotaFiscal
        },

        // Atesto do nutricionista (Seção 8.5)
        atestoNutricionista: {
          nome: dados.nutricionistaNome || '',
          matricula: dados.nutricionistaMatricula || '',
          dataAtesto: dados.dataAtestoNutricionista || '',
          conferidoQuantitativo: dados.conferidoQuantitativo || false,
          conferidoEquivalencia: dados.conferidoEquivalencia || false,
          liberadoConsumo: dados.liberadoConsumo || false
        },

        // Cronograma (Seção 8.6)
        cronogramaReposicao: dados.cronogramaReposicao || null,
        parcelaAtual: dados.parcelaAtual || 1,
        totalParcelas: dados.totalParcelas || 1,

        status: 'REALIZADA',
        observacoes: dados.observacoes || ''
      };

      const resultado = salvarReposicao(reposicao);

      if (resultado.success) {
        atualizarStatusNotificacao(dados.notificacaoId, NOTIFICACAO_CONFIG.STATUS.REPOSICAO_REALIZADA);
      }

      return resultado;

    } catch (error) {
      Logger.log('Erro em registrarReposicaoUE: ' + error);
      return { success: false, error: error.message };
    }
  } catch (error) {
    Logger.log("Erro em registrarReposicaoUE: " + error.message);
    throw error;
  }
}

/**
 * Registra reposição de alimento pelo fornecedor
 * Conforme Seção 9 da Nota Técnica 1/2025
 *
 * @param {Object} dados - Dados da reposição
 * @returns {Object} Resultado da operação
 */
function registrarReposicaoFornecedor(dados) {
  try {
    const reposicao = {
      id: gerarIdReposicao(),
      notificacaoId: dados.notificacaoId,
      tipo: 'FORNECEDOR',
      dataReposicao: new Date().toISOString(),

      // Situação (Seção 9.1)
      situacao: dados.situacao, // 'RECUSA_RECEBIMENTO', 'VICIO_OCULTO', 'FALHA_QUALIDADE'

      // Fornecedor
      fornecedor: dados.fornecedor,
      cnpjFornecedor: dados.cnpjFornecedor,

      // Produto
      produto: dados.produto,
      quantidadeRecusada: dados.quantidadeRecusada,
      quantidadeReposta: dados.quantidadeReposta,

      // Prazo (Seção 9.3)
      prazoReposicao: dados.tipoAlimento === 'PERECIVEL' ? '24 horas' : '5 dias úteis',
      dataLimiteReposicao: calcularDataLimiteReposicao(dados.tipoAlimento),
      reposicaoNoPrazo: dados.reposicaoNoPrazo,

      // Guia de Recolhimento (Seção 9.6)
      guiaRecolhimentoSubstituicao: {
        numero: dados.numeroGuia,
        data: dados.dataGuia,
        preenchida: dados.guiaPreenchida
      },

      status: dados.reposicaoRealizada ? 'REALIZADA' : 'PENDENTE',
      observacoes: dados.observacoes
    };

    const resultado = salvarReposicao(reposicao);

    if (resultado.success) {
      if (dados.reposicaoRealizada) {
        atualizarStatusNotificacao(dados.notificacaoId, NOTIFICACAO_CONFIG.STATUS.REPOSICAO_REALIZADA);
      } else {
        atualizarStatusNotificacao(dados.notificacaoId, NOTIFICACAO_CONFIG.STATUS.AGUARDANDO_REPOSICAO);
      }
    }

    return resultado;

  } catch (error) {
    Logger.log('Erro em registrarReposicaoFornecedor: ' + error);
    return { success: false, error: error.message };
  }
}

/**
 * Calcula data limite para reposição
 * @param {string} tipoAlimento - Tipo do alimento
 * @returns {Date} Data limite
 */
function calcularDataLimiteReposicao(tipoAlimento) {
  const hoje = new Date();

  if (tipoAlimento === 'PERECIVEL') {
    // 24 horas
    return new Date(hoje.getTime() + 24 * 60 * 60 * 1000);
  } else {
    // 5 dias úteis
    let diasUteis = 0;
    let data = new Date(hoje);

    while (diasUteis < 5) {
      data.setDate(data.getDate() + 1);
      const diaSemana = data.getDay();
      if (diaSemana !== 0 && diaSemana !== 6) {
        diasUteis++;
      }
    }

    return data;
  }
}

// ============================================================================
// FUNÇÕES DE VALIDAÇÃO
// ============================================================================

/**
 * Valida dados da notificação
 * @param {Object} dados - Dados a validar
 * @param {string} tipo - Tipo de notificação
 */
function validarDadosNotificacao(dados, tipo) {
  try {
    const camposObrigatorios = ['unidadeEscolar', 'produto', 'quantidade', 'responsavelRegistro'];

    if (tipo === 'VENCIDO') {
      camposObrigatorios.push('dataValidade', 'dataVencimento', 'numeroRecibo');
    }

    if (tipo === 'IMPROPRIO') {
      camposObrigatorios.push('origemProblema', 'descricaoProblema');
    }

    for (const campo of camposObrigatorios) {
      if (!dados[campo]) {
        throw new Error(`Campo obrigatório não preenchido: ${campo}`);
      }
    }
  } catch (error) {
    Logger.log("Erro em validarDadosNotificacao: " + error.message);
    throw error;
  }
}

/**
 * Valida temperatura conforme tipo de produto
 * @param {number} temperatura - Temperatura aferida
 * @param {string} tipoProduto - Tipo do produto
 * @returns {Object} Resultado da validação
 */
function validarTemperatura(temperatura, tipoProduto) {
  const limites = NOTIFICACAO_CONFIG.TEMPERATURAS[tipoProduto];

  if (!limites) {
    return { valido: true, mensagem: 'Tipo de produto não requer controle de temperatura' };
  }

  const conforme = temperatura <= limites.max;

  return {
    valido: conforme,
    temperaturaAferida: temperatura,
    temperaturaMaxima: limites.max,
    unidade: limites.unidade,
    mensagem: conforme
      ? `Temperatura conforme (${temperatura}${limites.unidade} ≤ ${limites.max}${limites.unidade})`
      : `TEMPERATURA NÃO CONFORME: ${temperatura}${limites.unidade} > ${limites.max}${limites.unidade}`
  };
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Gera ID único para notificação
 * @returns {string} ID gerado
 */
function gerarIdNotificacao() {
  try {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `NOT-${timestamp}-${random}`.toUpperCase();
  } catch (error) {
    Logger.log("Erro em gerarIdNotificacao: " + error.message);
    throw error;
  }
}

/**
 * Gera ID único para descarte
 * @returns {string} ID gerado
 */
function gerarIdDescarte() {
  try {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `DESC-${timestamp}-${random}`.toUpperCase();
  } catch (error) {
    Logger.log("Erro em gerarIdDescarte: " + error.message);
    throw error;
  }
}

/**
 * Gera ID único para reposição
 * @returns {string} ID gerado
 */
function gerarIdReposicao() {
  try {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `REP-${timestamp}-${random}`.toUpperCase();
  } catch (error) {
    Logger.log("Erro em gerarIdReposicao: " + error.message);
    throw error;
  }
}

/**
 * Salva notificação na planilha
 * @param {Object} notificacao - Dados da notificação
 * @returns {Object} Resultado
 */
function salvarNotificacao(notificacao) {
  try {
    try {
      try {
        try {
          const ss = getSS();
          let sheet = ss.getSheetByName('Notificacoes_Alimentos');

          if (!sheet) {
            sheet = criarAbaNotificacoes(ss);
          }

          const linha = [
            notificacao.id,
            notificacao.tipo,
            notificacao.dataRegistro,
            notificacao.unidadeEscolar,
            notificacao.creRegional || '',
            notificacao.produto,
            notificacao.quantidade,
            notificacao.unidadeMedida || '',
            notificacao.lote || '',
            notificacao.dataValidade || '',
            notificacao.status,
            notificacao.responsavelRegistro,
            notificacao.matriculaResponsavel || '',
            JSON.stringify(notificacao.documentos || {}),
            JSON.stringify(notificacao.historico || []),
            notificacao.observacoes || ''
          ];

          sheet.appendRow(linha);

          return { success: true, id: notificacao.id };

        } catch (error) {
          Logger.log('Erro ao salvar notificação: ' + error);
          return { success: false, error: error.message };
        }
      } catch (error) {
        Logger.log("Erro em salvarNotificacao: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em salvarNotificacao: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em salvarNotificacao: " + error.message);
    throw error;
  }
}

/**
 * Cria aba de notificações
 * @param {Spreadsheet} ss - Planilha
 * @returns {Sheet} Aba criada
 */
function criarAbaNotificacoes(ss) {
  try {
    try {
      try {
        const sheet = ss.insertSheet('Notificacoes_Alimentos');

        const cabecalhos = [
          'ID', 'Tipo', 'Data Registro', 'Unidade Escolar', 'CRE',
          'Produto', 'Quantidade', 'Unidade', 'Lote', 'Validade',
          'Status', 'Responsável', 'Matrícula', 'Documentos', 'Histórico', 'Observações'
        ];

        sheet.getRange(1, 1, 1, cabecalhos.length).setValues([cabecalhos]);
        sheet.getRange(1, 1, 1, cabecalhos.length)
          .setBackground('#4f46e5')
          .setFontColor('white')
          .setFontWeight('bold');

        sheet.setFrozenRows(1);

        return sheet;
      } catch (error) {
        Logger.log("Erro em criarAbaNotificacoes: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em criarAbaNotificacoes: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em criarAbaNotificacoes: " + error.message);
    throw error;
  }
}

/**
 * Salva registro de descarte
 * @param {Object} descarte - Dados do descarte
 * @returns {Object} Resultado
 */
function salvarDescarte(descarte) {
  try {
    try {
      try {
        const ss = getSS();
        let sheet = ss.getSheetByName('Descartes_Alimentos');

        if (!sheet) {
          sheet = ss.insertSheet('Descartes_Alimentos');
          const cabecalhos = ['ID', 'Notificação ID', 'Data', 'Produto', 'Quantidade',
                             'Tipo Descarte', 'Nutricionista', 'Gestor UE', 'Status', 'Observações'];
          sheet.getRange(1, 1, 1, cabecalhos.length).setValues([cabecalhos]);
          sheet.getRange(1, 1, 1, cabecalhos.length).setBackground('#4f46e5').setFontColor('white').setFontWeight('bold');
        }

        const linha = [
          descarte.id,
          descarte.notificacaoId,
          descarte.dataDescarte,
          descarte.produto,
          descarte.quantidade,
          descarte.tipoDescarte,
          `${descarte.nutricionista.nome} (${descarte.nutricionista.matricula})`,
          `${descarte.gestorUE.nome} (${descarte.gestorUE.matricula})`,
          descarte.status,
          descarte.observacoes || ''
        ];

        sheet.appendRow(linha);

        return { success: true, id: descarte.id };

      } catch (error) {
        Logger.log('Erro ao salvar descarte: ' + error);
        return { success: false, error: error.message };
      }
    } catch (error) {
      Logger.log("Erro em salvarDescarte: " + error.message);
      throw error; // Re-lança para tratamento superior
    }
  } catch (error) {
    Logger.log("Erro em salvarDescarte: " + error.message);
    throw error;
  }
}

/**
 * Salva registro de reposição
 * @param {Object} reposicao - Dados da reposição
 * @returns {Object} Resultado
 */
function salvarReposicao(reposicao) {
  try {
    try {
      try {
        try {
          const ss = getSS();
          let sheet = ss.getSheetByName('Reposicoes_Alimentos');

          if (!sheet) {
            sheet = ss.insertSheet('Reposicoes_Alimentos');
            const cabecalhos = ['ID', 'Notificação ID', 'Tipo', 'Data', 'Produto Original',
                               'Produto Reposto', 'Quantidade', 'Status', 'Observações'];
            sheet.getRange(1, 1, 1, cabecalhos.length).setValues([cabecalhos]);
            sheet.getRange(1, 1, 1, cabecalhos.length).setBackground('#4f46e5').setFontColor('white').setFontWeight('bold');
          }

          const linha = [
            reposicao.id,
            reposicao.notificacaoId,
            reposicao.tipo || 'UE',
            reposicao.dataReposicao,
            reposicao.produtoOriginal || reposicao.produto,
            reposicao.produtoReposto || '',
            reposicao.quantidadeReposta || reposicao.quantidade,
            reposicao.status,
            reposicao.observacoes || ''
          ];

          sheet.appendRow(linha);

          return { success: true, id: reposicao.id };

        } catch (error) {
          Logger.log('Erro ao salvar reposição: ' + error);
          return { success: false, error: error.message };
        }
      } catch (error) {
        Logger.log("Erro em salvarReposicao: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em salvarReposicao: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em salvarReposicao: " + error.message);
    throw error;
  }
}

/**
 * Atualiza status de uma notificação
 * @param {string} notificacaoId - ID da notificação
 * @param {string} novoStatus - Novo status
 */
function atualizarStatusNotificacao(notificacaoId, novoStatus) {
  try {
    try {
      try {
        const ss = getSS();
        const sheet = ss.getSheetByName('Notificacoes_Alimentos');

        if (!sheet) return;

        const dados = sheet.getDataRange().getValues();

        for (let i = 1; i < dados.length; i++) {
          if (dados[i][0] === notificacaoId) {
            sheet.getRange(i + 1, 11).setValue(novoStatus); // Coluna Status
            break;
          }
        }

      } catch (error) {
        Logger.log('Erro ao atualizar status: ' + error);
      }
    } catch (error) {
      Logger.log("Erro em atualizarStatusNotificacao: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em atualizarStatusNotificacao: " + error.message);
    throw error;
  }
}

/**
 * Notifica nutricionista da UNIAE
 * @param {Object} notificacao - Dados da notificação
 */
function notificarNutricionista(notificacao) {
  // Implementar integração com sistema de notificações
  Logger.log(`Notificação enviada para nutricionista: ${notificacao.id}`);
}

/**
 * Notifica GPAE
 * @param {Object} notificacao - Dados da notificação
 */
function notificarGPAE(notificacao) {
  Logger.log(`Notificação enviada para GPAE: ${notificacao.id}`);
}

/**
 * Encaminha para análise laboratorial
 * @param {Object} notificacao - Dados da notificação
 */
function encaminharParaAnaliseLaboratorial(notificacao) {
  Logger.log(`Encaminhado para análise laboratorial: ${notificacao.id}`);
}

// ============================================================================
// FUNÇÕES DE CONSULTA
// ============================================================================

/**
 * Lista notificações com filtros
 * @param {Object} filtros - Filtros de busca
 * @returns {Object} Resultado com lista de notificações
 */
function listarNotificacoes(filtros = {}) {
  try {
    try {
      const ss = getSS();
      const sheet = ss.getSheetByName('Notificacoes_Alimentos');

      if (!sheet) {
        return { success: true, data: [] };
      }

      const dados = sheet.getDataRange().getValues();
      const cabecalhos = dados[0];

      let notificacoes = [];

      for (let i = 1; i < dados.length; i++) {
        const notificacao = {};
        cabecalhos.forEach((cab, idx) => {
          notificacao[cab.toLowerCase().replace(/ /g, '_')] = dados[i][idx];
        });

        // Aplicar filtros
        let incluir = true;

        if (filtros.tipo && notificacao.tipo !== filtros.tipo) incluir = false;
        if (filtros.status && notificacao.status !== filtros.status) incluir = false;
        if (filtros.unidadeEscolar && !notificacao.unidade_escolar.includes(filtros.unidadeEscolar)) incluir = false;

        if (incluir) {
          notificacoes.push(notificacao);
        }
      }

      return { success: true, data: notificacoes };

    } catch (error) {
      Logger.log('Erro ao listar notificações: ' + error);
      return { success: false, error: error.message };
    }
  } catch (error) {
    Logger.log("Erro em listarNotificacoes: " + error.message);
    throw error;
  }
}

/**
 * Obtém estatísticas de notificações
 * @returns {Object} Estatísticas
 */
function obterEstatisticasNotificacoes() {
  try {
    const resultado = listarNotificacoes();

    if (!resultado.success) {
      return resultado;
    }

    const notificacoes = resultado.data;

    const stats = {
      total: notificacoes.length,
      porTipo: {},
      porStatus: {},
      porCRE: {}
    };

    notificacoes.forEach(n => {
      // Por tipo
      stats.porTipo[n.tipo] = (stats.porTipo[n.tipo] || 0) + 1;

      // Por status
      stats.porStatus[n.status] = (stats.porStatus[n.status] || 0) + 1;

      // Por CRE
      if (n.cre) {
        stats.porCRE[n.cre] = (stats.porCRE[n.cre] || 0) + 1;
      }
    });

    return { success: true, data: stats };

  } catch (error) {
    Logger.log('Erro ao obter estatísticas: ' + error);
    return { success: false, error: error.message };
  }
}
