'use strict';

/**
 * DOMINIO_EDUCACAO
 * Consolidado de : EducacaoAlimentar.gs, TestesAceitabilidadeNT.gs
 * @version 2.0.0
 * @created 2025-11-04
 */


// ---- EducacaoAlimentar.gs ----
/**
 * EducacaoAlimentar.gs - Educação Alimentar e Nutricional (EAN)
 * Implementação do Manual da Alimentação Escolar do DF (Item 3)
 *
 * BASE LEGAL :
 * - Manual da Alimentação Escolar DF Item 3 : EAN nas escolas
 * - Lei 11.947/2009 Art. 2º : Ações de EAN
 * - Resolução FNDE 06/2020 : EAN como componente do PNAE
 * - Marco de Referência de EAN (2012)
 * - Guia Alimentar para População Brasileira (2014)
 *
 * ESCOPO :
 * - Planejamento de ações de EAN
 * - Execução de atividades educativas
 * - Formação de manipuladores
 * - Hortas escolares
 * - Campanhas educativas
 * - Avaliação de impacto
 */

/**
 * DEZ PASSOS PARA ALIMENTAÇÃO SAUDÁVEL (Manual Item 5)
 */
var DEZ_PASSOS_ALIMENTACAO = [
  'Fazer de alimentos in natura ou minimamente processados a base da alimentação',
  'Utilizar óleos, gorduras, sal e açúcar em pequenas quantidades',
  'Limitar o consumo de alimentos processados',
  'Evitar o consumo de alimentos ultraprocessados',
  'Comer com regularidade e atenção, em ambientes apropriados',
  'Fazer compras em locais que ofertem variedades de alimentos in natura',
  'Desenvolver, exercitar e partilhar habilidades culinárias',
  'Planejar o uso do tempo para dar à alimentação o espaço que ela merece',
  'Dar preferência a alimentos orgânicos e de base agroecológica',
  'Ser crítico quanto a informações, orientações e mensagens sobre alimentação'
];

/**
 * DOZE PASSOS PARA CRIANÇAS MENORES DE 2 ANOS (Manual Item 6)
 */
var DOZE_PASSOS_CRIANCAS = [
  'Amamentar até 2 anos ou mais, oferecendo somente leite materno até 6 meses',
  'Oferecer alimentos in natura ou minimamente processados',
  'Oferecer água própria para consumo',
  'Alimentar a criança com atenção e de forma responsiva',
  'Cuidar da higiene em todas as etapas da alimentação',
  'Oferecer alimentação adequada e saudável também fora de casa',
  'Proteger a criança da publicidade de alimentos',
  'Evitar açúcar nos alimentos da criança até 2 anos',
  'Evitar alimentos ultraprocessados',
  'Evitar oferecer bebidas açucaradas',
  'Oferecer alimentos complementares a partir dos 6 meses',
  'Zelar para que a hora da alimentação seja um momento de experiências positivas'
];

/**
 * TIPOS DE AÇÃO DE EAN
 */
var TIPOS_ACAO_EAN = {
  OFICINA_CULINARIA : {
    codigo : 'OFICINA',
    nome : 'Oficina Culinária',
    publico : 'Alunos',
    duracao_media : 120 // minutos
  },
  PALESTRA : {
    codigo : 'PALESTRA',
    nome : 'Palestra Educativa',
    publico : 'Alunos, Pais, Professores',
    duracao_media : 60
  },
  FORMACAO_MANIPULADORES : {
    codigo : 'FORMACAO',
    nome : 'Formação de Manipuladores',
    publico : 'Manipuladores de Alimentos',
    duracao_media : 180
  },
  HORTA_ESCOLAR : {
    codigo : 'HORTA',
    nome : 'Horta Escolar',
    publico : 'Alunos',
    duracao_media : null // contínuo
  },
  CAMPANHA : {
    codigo : 'CAMPANHA',
    nome : 'Campanha Educativa',
    publico : 'Comunidade Escolar',
    duracao_media : null // variável
  },
  TEATRO : {
    codigo : 'TEATRO',
    nome : 'Teatro/Apresentação',
    publico : 'Alunos',
    duracao_media : 45
  },
  DEGUSTACAO : {
    codigo : 'DEGUSTACAO',
    nome : 'Degustação de Alimentos',
    publico : 'Alunos',
    duracao_media : 30
  }
};

/**
 * TEMAS DE EAN (Marco de Referência)
 */
var TEMAS_EAN = {
  ALIMENTACAO_SAUDAVEL : 'Alimentação Saudável',
  DESPERDICIO_ALIMENTOS : 'Combate ao Desperdício',
  HIGIENE_ALIMENTOS : 'Higiene dos Alimentos',
  CULTURA_ALIMENTAR : 'Cultura Alimentar',
  SUSTENTABILIDADE : 'Sustentabilidade',
  ROTULAGEM : 'Leitura de Rótulos',
  ALIMENTOS_REGIONAIS : 'Alimentos Regionais',
  HORTA_ALIMENTACAO : 'Horta e Alimentação',
  PREVENCAO_OBESIDADE : 'Prevenção da Obesidade',
  ALEITAMENTO_MATERNO : 'Aleitamento Materno'
};

/**
 * STATUS DE AÇÃO EAN
 */
var STATUS_ACAO_EAN = {
  PLANEJADA : 'Planejada',
  EM_EXECUCAO : 'Em Execução',
  CONCLUIDA : 'Concluída',
  CANCELADA : 'Cancelada',
  ADIADA : 'Adiada'
};

/**
 * Service : Educação Alimentar e Nutricional
 */
function EducacaoAlimentarService(dependencies) {
  try {
    try {
      try {
        BaseService.call(this, dependencies);
        this.sheetAcoes = 'Acoes_EAN';
        this.sheetParticipantes = 'Participantes_EAN';
        this.sheetAvaliacoes = 'Avaliacoes_EAN';
      } catch (error) {
        Logger.log("Erro em EducacaoAlimentarService: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em EducacaoAlimentarService: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em EducacaoAlimentarService: " + error.message);
    throw error;
  }
}

EducacaoAlimentarService.prototype = Object.create(BaseService.prototype);
EducacaoAlimentarService.prototype.constructor = EducacaoAlimentarService;

/**
 * Planeja ação de EAN (Manual Item 3)
 */
EducacaoAlimentarService.prototype.planejarAcao = function(dados) {
  validateRequired(dados.titulo, 'Título da Ação');
  validateRequired(dados.tipoAcao, 'Tipo de Ação');
  validateRequired(dados.tema, 'Tema');
  validateRequired(dados.unidadeEscolar, 'Unidade Escolar');
  validateRequired(dados.dataRealizacao, 'Data de Realização');
  validateRequired(dados.publicoAlvo, 'Público Alvo');

  var sheet = getOrCreateSheetSafe(this.sheetAcoes);

  var acao = {
    id : this.generateId(),
    dataPlanejamento : new Date(),
    titulo : dados.titulo,
    tipoAcao : dados.tipoAcao,
    tema : dados.tema,
    descricao : dados.descricao || '',
    unidadeEscolar : dados.unidadeEscolar,
    cre : dados.cre || '',
    dataRealizacao : dados.dataRealizacao,
    horaInicio : dados.horaInicio || '',
    horaFim : dados.horaFim || '',
    local : dados.local || '',
    publicoAlvo : dados.publicoAlvo,
    numeroParticipantesEsperado : dados.numeroParticipantesEsperado || 0,
    responsavel : dados.responsavel || Session.getActiveUser().getEmail(),
    nutricionistaResponsavel : dados.nutricionistaResponsavel || '',
    materiaisNecessarios : dados.materiaisNecessarios || [],
    parceiros : dados.parceiros || [],
    status : STATUS_ACAO_EAN.PLANEJADA,
    observacoes : dados.observacoes || '',
    baseLegal : 'Manual Item 3 + Lei 11.947/2009 Art. 2º'
  };

  this.salvarAcao(acao);

  SystemLogger.info('Ação de EAN planejada', {
    id : acao.id,
    tipo : dados.tipoAcao,
    unidade : dados.unidadeEscolar,
    data : dados.dataRealizacao
  });

};

/**
 * Registra execução da ação de EAN
 */
EducacaoAlimentarService.prototype.registrarExecucao = function(idAcao, dados) {
  validateRequired(dados.dataExecucao, 'Data de Execução');
  validateRequired(dados.numeroParticipantes, 'Número de Participantes');

  var acao = this.buscarAcaoPorId(idAcao);
  if (!acao) {
    throw new Error('Ação não encontrada : ' + idAcao);
  }

  acao.dataExecucao = dados.dataExecucao;
  acao.numeroParticipantes = dados.numeroParticipantes;
  acao.horaInicioReal = dados.horaInicioReal || '';
  acao.horaFimReal = dados.horaFimReal || '';
  acao.metodologia = dados.metodologia || '';
  acao.materiaisUtilizados = dados.materiaisUtilizados || [];
  acao.fotografias = dados.fotografias || [];
  acao.relatorioExecucao = dados.relatorioExecucao || '';
  acao.status = STATUS_ACAO_EAN.CONCLUIDA;
  acao.observacoesExecucao = dados.observacoes || '';

  this.atualizarAcao(acao);

  SystemLogger.info('Execução de ação EAN registrada', {
    id : idAcao,
    participantes : dados.numeroParticipantes
  });

};

/**
 * Registra participante em ação de EAN
 */
EducacaoAlimentarService.prototype.registrarParticipante = function(dados) {
  validateRequired(dados.acaoId, 'ID da Ação');
  validateRequired(dados.nome, 'Nome do Participante');
  validateRequired(dados.tipo, 'Tipo de Participante');

  var sheet = getOrCreateSheetSafe(this.sheetParticipantes);

  var participante = {
    id : this.generateId(),
    dataRegistro : new Date(),
    acaoId : dados.acaoId,
    nome : dados.nome,
    tipo : dados.tipo, // Aluno, Professor, Manipulador, Pai/Responsável, Outro
    turma : dados.turma || '',
    idade : dados.idade || null,
    email : dados.email || '',
    telefone : dados.telefone || '',
    presente : dados.presente != false,
    observacoes : dados.observacoes || ''
  };

  this.salvarParticipante(participante);

};

/**
 * Registra avaliação da ação de EAN
 */
EducacaoAlimentarService.prototype.registrarAvaliacao = function(dados) {
  validateRequired(dados.acaoId, 'ID da Ação');
  validateRequired(dados.avaliacaoGeral, 'Avaliação Geral');

  var sheet = getOrCreateSheetSafe(this.sheetAvaliacoes);

  var avaliacao = {
    id : this.generateId(),
    dataAvaliacao : new Date(),
    acaoId : dados.acaoId,
    avaliacaoGeral : dados.avaliacaoGeral, // 1-5
    conteudoAdequado : dados.conteudoAdequado || null,
    metodologiaAdequada : dados.metodologiaAdequada || null,
    materiaisAdequados : dados.materiaisAdequados || null,
    duracaoAdequada : dados.duracaoAdequada || null,
    objetivosAlcancados : dados.objetivosAlcancados || null,
    pontosPositivos : dados.pontosPositivos || '',
    pontosMelhorar : dados.pontosMelhorar || '',
    sugestoes : dados.sugestoes || '',
    impactoPercebido : dados.impactoPercebido || '',
    observacoes : dados.observacoes || ''
  };

  this.salvarAvaliacao(avaliacao);

};

/**
 * Gera relatório consolidado de EAN
 */
EducacaoAlimentarService.prototype.gerarRelatorioConsolidado = function(filtros) {
  var acoes = this.listarTodasAcoes();

  if (filtros) {
    if (filtros.cre) {
      acoes = acoes.filter(function(a) { return a.cre == filtros.cre; });
    }
    if (filtros.periodo) {
      var dataInicio = new Date(filtros.periodo.inicio);
      var dataFim = new Date(filtros.periodo.fim);
      acoes = acoes.filter(function(a) {
        var data = new Date(a.dataRealizacao);
        return data >= dataInicio && data <= dataFim;
      });
    }
    if (filtros.tipoAcao) {
      acoes = acoes.filter(function(a) { return a.tipoAcao == filtros.tipoAcao; });
    }
  }

  var relatorio = {
    totalAcoes : acoes.length,
    acoesConcluidas : 0,
    acoesEmAndamento : 0,
    acoesCanceladas : 0,
    porTipoAcao : {},
    porTema : {},
    totalParticipantes : 0,
    mediaParticipantesPorAcao : 0,
    porUnidadeEscolar : {}
  };

  var somaParticipantes = 0;
  var acoesComParticipantes = 0;

  acoes.forEach(function(a) {
    // Por status
    if (a.status == STATUS_ACAO_EAN.CONCLUIDA) {
      relatorio.acoesConcluidas++
      if (a.numeroParticipantes) {
        somaParticipantes += a.numeroParticipantes;
        acoesComParticipantes++
      }
    } else if (a.status == STATUS_ACAO_EAN.EM_EXECUCAO) {
      relatorio.acoesEmAndamento++
    } else if (a.status == STATUS_ACAO_EAN.CANCELADA) {
      relatorio.acoesCanceladas++
    }

    // Por tipo
    relatorio.porTipoAcao[a.tipoAcao] = (relatorio.porTipoAcao[a.tipoAcao] || 0) + 1;

    // Por tema
    relatorio.porTema[a.tema] = (relatorio.porTema[a.tema] || 0) + 1;

    // Por unidade
    if (!relatorio.porUnidadeEscolar[a.unidadeEscolar]) {
      relatorio.porUnidadeEscolar[a.unidadeEscolar] = {
        acoes : 0,
        participantes : 0
      };
    }
    relatorio.porUnidadeEscolar[a.unidadeEscolar].acoes++
    if (a.numeroParticipantes) {
      relatorio.porUnidadeEscolar[a.unidadeEscolar].participantes += a.numeroParticipantes;
    }
  });

  relatorio.totalParticipantes = somaParticipantes;
  if (acoesComParticipantes > 0) {
    relatorio.mediaParticipantesPorAcao = Math.round(somaParticipantes / acoesComParticipantes);
  }

};

/**
 * Verifica cumprimento de meta de EAN
 */
EducacaoAlimentarService.prototype.verificarMetaEAN = function(unidadeEscolar, ano, metaMinima) {
  metaMinima = metaMinima || 4; // Mínimo 4 ações/ano por unidade

  var acoes = this.listarTodasAcoes();

  var acoesUnidade = acoes.filter(function(a) {
    if (a.unidadeEscolar != unidadeEscolar) return false;
    if (a.status != STATUS_ACAO_EAN.CONCLUIDA) return false;

    var dataAcao = new Date(a.dataRealizacao);
  });

  var cumprido = acoesUnidade.length >= metaMinima;

  return {
      // unidadeEscolar : unidadeEscolar,
    ano : ano,
    acoesRealizadas : acoesUnidade.length,
    metaMinima : metaMinima,
    cumprido : cumprido,
    faltam : cumprido ? 0 : metaMinima - acoesUnidade.length
  };
};

/**
 * Métodos auxiliares - Ações
 */
EducacaoAlimentarService.prototype.salvarAcao = function(acao) {
  var sheet = getOrCreateSheetSafe(this.sheetAcoes);
  var headers = this.getHeadersAcoes();

  if (sheet.getLastRow() == 0) {
    sheet.appendRow(headers);
  }

  var row = this.mapAcaoToRow(acao, headers);
  sheet.appendRow(row);
};

EducacaoAlimentarService.prototype.atualizarAcao = function(acao) {
  var sheet = getOrCreateSheetSafe(this.sheetAcoes);
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == acao.id) {
      var headers = data[0];
      var row = this.mapAcaoToRow(acao, headers);
      sheet.getRange(i + 1, 1, 1, row.length).setValues([row]);
    }
  }
};

EducacaoAlimentarService.prototype.buscarAcaoPorId = function(id) {
  var acoes = this.listarTodasAcoes();
};

EducacaoAlimentarService.prototype.listarTodasAcoes = function() {
  var sheet = getOrCreateSheetSafe(this.sheetAcoes);
  if (sheet.getLastRow() <= 1) return [];

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var acoes = [];

  for (var i = 1; i < data.length; i++) {
    acoes.push(this.mapRowToAcao(data[i], headers));
  }

};

EducacaoAlimentarService.prototype.getHeadersAcoes = function() {
          'Unidade Escolar', 'CRE', 'Data Realização', 'Hora Início', 'Hora Fim',
          'Local', 'Público Alvo', 'Participantes Esperados', 'Participantes Reais',
          'Responsável', 'Nutricionista', 'Status', 'Data Execução', 'Observações', 'Base Legal'};

EducacaoAlimentarService.prototype.mapAcaoToRow = function(a, headers) {
    a.id, a.dataPlanejamento, a.titulo, a.tipoAcao, a.tema, a.descricao || '',
    a.unidadeEscolar, a.cre || '', a.dataRealizacao, a.horaInicio || '', a.horaFim || '',
    a.local || '', a.publicoAlvo, a.numeroParticipantesEsperado, a.numeroParticipantes || '',
    a.responsavel, a.nutricionistaResponsavel || '', a.status, a.dataExecucao || '',
    a.observacoes || '', a.baseLegal || ''
  };

EducacaoAlimentarService.prototype.mapRowToAcao = function(row, headers) {
  return {
    id : row[0], dataPlanejamento : row[1], titulo : row[2], tipoAcao : row[3], tema : row[4],
    descricao : row[5], unidadeEscolar : row[6], cre : row[7], dataRealizacao : row[8],
    horaInicio : row[9], horaFim : row[10], local : row[11], publicoAlvo : row[12],
    numeroParticipantesEsperado : row[13], numeroParticipantes : row[14], responsavel : row[15],
    nutricionistaResponsavel : row[16], status : row[17], dataExecucao : row[18],
    observacoes : row[19], baseLegal : row[20]
  };
};

/**
 * Métodos auxiliares - Participantes
 */
EducacaoAlimentarService.prototype.salvarParticipante = function(participante) {
  var sheet = getOrCreateSheetSafe(this.sheetParticipantes);
  var headers = this.getHeadersParticipantes();

  if (sheet.getLastRow() == 0) {
    sheet.appendRow(headers);
  }

  var row = this.mapParticipanteToRow(participante, headers);
  sheet.appendRow(row);
};

EducacaoAlimentarService.prototype.getHeadersParticipantes = function() {
          'Email', 'Telefone', 'Presente', 'Observações'};

EducacaoAlimentarService.prototype.mapParticipanteToRow = function(p, headers) {
    p.id, p.dataRegistro, p.acaoId, p.nome, p.tipo, p.turma || '', p.idade || '',
    p.email || '', p.telefone || '', p.presente, p.observacoes || ''
  };

/**
 * Métodos auxiliares - Avaliações
 */
EducacaoAlimentarService.prototype.salvarAvaliacao = function(avaliacao) {
  var sheet = getOrCreateSheetSafe(this.sheetAvaliacoes);
  var headers = this.getHeadersAvaliacoes();

  if (sheet.getLastRow() == 0) {
    sheet.appendRow(headers);
  }

  var row = this.mapAvaliacaoToRow(avaliacao, headers);
  sheet.appendRow(row);
};

EducacaoAlimentarService.prototype.getHeadersAvaliacoes = function() {
          'Metodologia Adequada', 'Materiais Adequados', 'Duração Adequada',
          'Objetivos Alcançados', 'Pontos Positivos', 'Pontos a Melhorar',
          'Sugestões', 'Impacto Percebido', 'Observações'};

EducacaoAlimentarService.prototype.mapAvaliacaoToRow = function(av, headers) {
    av.id, av.dataAvaliacao, av.acaoId, av.avaliacaoGeral, av.conteudoAdequado || '',
    av.metodologiaAdequada || '', av.materiaisAdequados || '', av.duracaoAdequada || '',
    av.objetivosAlcancados || '', av.pontosPositivos || '', av.pontosMelhorar || '',
    av.sugestoes || '', av.impactoPercebido || '', av.observacoes || ''
  };

EducacaoAlimentarService.prototype.generateId = function() {
};

/**
 * Registrar serviço no DI Container
 */
function registerEducacaoAlimentar() {
  DIContainer.bind('educacaoAlimentar', function() {
    return new EducacaoAlimentarService({});
  }, true);

  SystemLogger.info('EducacaoAlimentar service registered');
}


// ---- TestesAceitabilidadeNT.gs ----
/**
 * TestesAceitabilidadeNT.gs - Testes de Aceitabilidade de Cardápios
 * Implementação da Nota Técnica N.º 3/2022 - SEE/SUAPE/DIAE/GPAE
 *
 * BASE LEGAL :
 * - Nota Técnica 3/2022 : Padronização de Testes de Aceitabilidade
 * - Lei 11.947/2009 : PNAE
 * - Resolução FNDE 38/2009 : Testes de aceitabilidade obrigatórios
 * - Resolução FNDE 26/2013 : Metodologia de aplicação
 * - Resolução FNDE 06/2020 : Atualização PNAE
 * - Manual FNDE 2ª Edição : Aplicação dos testes
 *
 * ESCOPO :
 * - Testes de aceitabilidade de novas preparações
 * - Testes de preparações já praticadas
 * - Definição de amostra representativa
 * - Frequência de aplicação
 * - Consolidação de resultados
 */

/**
 * MÉTODOS DE TESTE (Manual FNDE 2ª Edição)
 */
var METODOS_TESTE = {
  ESCALA_HEDONICA : {
    codigo : 'ESCALA_HEDONICA',
    nome : 'Escala Hedônica Facial',
    descricao : 'Para crianças não alfabetizadas',
    faixaEtaria : '0-6 anos',
    opcoes : ['Adorei', 'Gostei', 'Indiferente', 'Não Gostei', 'Detestei']
  },
  ESCALA_VERBAL : {
    codigo : 'ESCALA_VERBAL',
    nome : 'Escala Hedônica Verbal',
    descricao : 'Para crianças alfabetizadas e adolescentes',
    faixaEtaria : '7+ anos',
    opcoes : ['Adorei', 'Gostei', 'Indiferente', 'Não Gostei', 'Detestei']
  },
  RESTO_INGESTA : {
    codigo : 'RESTO_INGESTA',
    nome : 'Resto-Ingestão',
    descricao : 'Análise quantitativa do consumo',
    aplicacao : 'Complementar aos métodos hedônicos'
  }
};

/**
 * CRITÉRIOS DE ACEITABILIDADE (Resolução FNDE 38/2009)
 */
var CRITERIOS_ACEITABILIDADE = {
  MINIMO_ACEITACAO : 85, // 85% de aceitação (Adorei + Gostei)
  MINIMO_RESTO_INGESTA : 85, // 85% de consumo
  TAMANHO_AMOSTRA_MINIMO : 100, // Mínimo de alunos
  PERCENTUAL_AMOSTRA : 10 // 10% dos alunos atendidos
};

/**
 * FREQUÊNCIA DE APLICAÇÃO (NT 3/2022)
 */
var FREQUENCIA_APLICACAO = {
  NOVAS_PREPARACOES : {
    quando : 'Antes da inclusão no cardápio',
    obrigatorio : true,
    base_legal : 'Resolução FNDE 38/2009'
  },
      PREPARACOES_PRATICADAS : {
    frequencia : 'Anual',
    minimo_testes_ano : 2,
    base_legal : 'NT 3/2022'
  }
};

/**
 * TIPOS DE PREPARAÇÃO
 */
var TIPOS_PREPARACAO = {
  PRATO_PRINCIPAL : 'Prato Principal',
  GUARNICAO : 'Guarnição',
  SALADA : 'Salada',
  SOBREMESA : 'Sobremesa',
  BEBIDA : 'Bebida',
  LANCHE : 'Lanche',
  PRATO_UNICO : 'Prato Único'
};

/**
 * STATUS DO TESTE
 */
var STATUS_TESTE = {
  PLANEJADO : 'Planejado',
  EM_APLICACAO : 'Em Aplicação',
  AGUARDANDO_CONSOLIDACAO : 'Aguardando Consolidação',
  CONSOLIDADO : 'Consolidado',
  APROVADO : 'Aprovado (≥85%)',
  REPROVADO : 'Reprovado (<85%)',
  CANCELADO : 'Cancelado'
};

/**
 * Service : Testes de Aceitabilidade NT 3/2022
 */
function TestesAceitabilidadeNTService(dependencies) {
  try {
    try {
      try {
        BaseService.call(this, dependencies);
        this.sheetName = 'Testes_Aceitabilidade_NT';
        this.sheetResultados = 'Resultados_Testes_Detalhados';
      } catch (error) {
        Logger.log("Erro em TestesAceitabilidadeNTService: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em TestesAceitabilidadeNTService: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em TestesAceitabilidadeNTService: " + error.message);
    throw error;
  }
}

TestesAceitabilidadeNTService.prototype = Object.create(BaseService.prototype);
TestesAceitabilidadeNTService.prototype.constructor = TestesAceitabilidadeNTService;

/**
 * Planeja novo teste de aceitabilidade (NT 3/2022)
 */
TestesAceitabilidadeNTService.prototype.planejarTeste = function(dados) {
  validateRequired(dados.preparacao, 'Preparação');
  validateRequired(dados.tipoPreparacao, 'Tipo de Preparação');
  validateRequired(dados.unidadeEscolar, 'Unidade Escolar');
  validateRequired(dados.dataAplicacao, 'Data de Aplicação');
  validateRequired(dados.metodoTeste, 'Método de Teste');
  validateRequired(dados.totalAlunosAtendidos, 'Total de Alunos Atendidos');

  // Calcular tamanho da amostra
  var tamanhoAmostra = this.calcularTamanhoAmostra(dados.totalAlunosAtendidos);

  var sheet = getOrCreateSheetSafe(this.sheetName);
  var registro = {
    id : this.generateId(),
    dataRegistro : new Date(),
    preparacao : dados.preparacao,
    tipoPreparacao : dados.tipoPreparacao,
    descricaoPreparacao : dados.descricaoPreparacao || '',
    novaPreparacao : dados.novaPreparacao || false,
    unidadeEscolar : dados.unidadeEscolar,
    cre : dados.cre || '',
    dataAplicacao : dados.dataAplicacao,
    turno : dados.turno || 'Todos',
    metodoTeste : dados.metodoTeste,
    totalAlunosAtendidos : dados.totalAlunosAtendidos,
    tamanhoAmostra : tamanhoAmostra,
    faixaEtaria : dados.faixaEtaria || '',
    programaTrabalho : dados.programaTrabalho || '',
    nutricionistaResponsavel : dados.nutricionistaResponsavel || '',
    status : STATUS_TESTE.PLANEJADO,
    responsavelRegistro : Session.getActiveUser().getEmail(),
    observacoes : dados.observacoes || '',
    baseLegal : 'NT 3/2022 + Resolução FNDE 38/2009',
    distribuicao : dados.distribuicao || ''
  };

  this.salvarRegistro(registro);

  SystemLogger.info('Teste de aceitabilidade planejado', {
    id : registro.id,
    preparacao : dados.preparacao,
    unidade : dados.unidadeEscolar,
    amostra : tamanhoAmostra
  });

};

/**
 * Calcula tamanho da amostra (NT 3/2022)
 * Mínimo : 100 alunos ou 10% dos atendidos
 */
TestesAceitabilidadeNTService.prototype.calcularTamanhoAmostra = function(totalAlunos) {
  var amostra10Porcento = Math.ceil(totalAlunos * (CRITERIOS_ACEITABILIDADE.PERCENTUAL_AMOSTRA / 100));

};

/**
 * Registra resultados do teste (NT 3/2022)
 */
TestesAceitabilidadeNTService.prototype.registrarResultados = function(idTeste, resultados) {
  validateRequired(resultados.alunosParticipantes, 'Alunos Participantes');
  validateRequired(resultados.adorei, 'Quantidade Adorei');
  validateRequired(resultados.gostei, 'Quantidade Gostei');
  validateRequired(resultados.indiferente, 'Quantidade Indiferente');
  validateRequired(resultados.naoGostei, 'Quantidade Não Gostei');
  validateRequired(resultados.detestei, 'Quantidade Detestei');

  var registro = this.buscarPorId(idTeste);
  if (!registro) {
    throw new Error('Teste não encontrado : ' + idTeste);
  }

  // Validar soma das respostas
  var totalRespostas = resultados.adorei + resultados.gostei + resultados.indiferente +
                       resultados.naoGostei + resultados.detestei;

  if (totalRespostas != resultados.alunosParticipantes) {
    throw new Error('Soma das respostas (' + totalRespostas + ') diferente do total de participantes (' +
                    resultados.alunosParticipantes + ')');
  }

  // Calcular índices de aceitabilidade
  var indices = this.calcularIndicesAceitabilidade(resultados);

  // Atualizar registro
  registro.dataAplicacaoReal = resultados.dataAplicacaoReal || new Date();
  registro.alunosParticipantes = resultados.alunosParticipantes;
  registro.adorei = resultados.adorei;
  registro.gostei = resultados.gostei;
  registro.indiferente = resultados.indiferente;
  registro.naoGostei = resultados.naoGostei;
  registro.detestei = resultados.detestei;
  registro.percentualAceitacao = indices.percentualAceitacao;
  registro.percentualRejeicao = indices.percentualRejeicao;
  registro.percentualIndiferenca = indices.percentualIndiferenca;
  registro.aprovado = indices.aprovado;
  var status;
  if (indices.aprovado) {
    status = STATUS_TESTE.APROVADO;
  } else {
    status = STATUS_TESTE.REPROVADO;
  }
  registro.dataConsolidacao = new Date();
  registro.observacoesResultado = resultados.observacoes || '';
  registro.restoIngesta = resultados.restoIngesta || null;
  registro.percentualConsumo = resultados.percentualConsumo || null;

  this.atualizarRegistro(registro);

  SystemLogger.info('Resultados do teste registrados', {
    id : idTeste,
    aceitacao : indices.percentualAceitacao + '%',
    aprovado : indices.aprovado
  });

};

/**
 * Calcula índices de aceitabilidade
 */
TestesAceitabilidadeNTService.prototype.calcularIndicesAceitabilidade = function(resultados) {
  var total = resultados.alunosParticipantes;

  var aceitacao = resultados.adorei + resultados.gostei;
  var rejeicao = resultados.naoGostei + resultados.detestei;
  var indiferenca = resultados.indiferente;

  var percentualAceitacao = Math.round((aceitacao / total) * 100 * 10) / 10;
  var percentualRejeicao = Math.round((rejeicao / total) * 100 * 10) / 10;
  var percentualIndiferenca = Math.round((indiferenca / total) * 100 * 10) / 10;

  var aprovado = percentualAceitacao >= CRITERIOS_ACEITABILIDADE.MINIMO_ACEITACAO;

  return {
    percentualAceitacao : percentualAceitacao,
    percentualRejeicao : percentualRejeicao,
    percentualIndiferenca : percentualIndiferenca,
    aprovado : aprovado
  };
};

/**
 * Lista testes por unidade escolar
 */
TestesAceitabilidadeNTService.prototype.listarPorUnidadeEscolar = function(unidadeEscolar, periodo) {
  var todosRegistros = this.listarTodos();

    var matchUnidade = reg.unidadeEscolar == unidadeEscolar;

    if (periodo) {
      var dataInicio = new Date(periodo.inicio);
      var dataFim = new Date(periodo.fim);
      var dataAplicacao = new Date(reg.dataAplicacao);

    }

  };

/**
 * Lista testes por preparação
 */
TestesAceitabilidadeNTService.prototype.listarPorPreparacao = function(preparacao) {
  var todosRegistros = this.listarTodos();

  };

/**
 * Gera relatório consolidado de testes (NT 3/2022)
 */
TestesAceitabilidadeNTService.prototype.gerarRelatorioConsolidado = function(filtros) {
  var registros = this.listarTodos();

  // Aplicar filtros
  if (filtros) {
    if (filtros.cre) {
      registros = registros.filter(function(r) { return r.cre == filtros.cre; });
    }
    if (filtros.periodo) {
      var dataInicio = new Date(filtros.periodo.inicio);
      var dataFim = new Date(filtros.periodo.fim);
      registros = registros.filter(function(r) {
        var data = new Date(r.dataAplicacao);
      });
    }
    if (filtros.status) {
      registros = registros.filter(function(r) { return r.status == filtros.status; });
    }
  }

  var consolidado = {
    totalTestes : registros.length,
    testesAprovados : 0,
    testesReprovados : 0,
    mediaAceitacao : 0,
    preparacoesTestadas : {},
    porTipoPreparacao : {},
    porUnidadeEscolar : {},
    novasPreparacoes : 0,
    preparacoesPraticadas : 0
  };

  var somaAceitacao = 0;
  var testesComResultado = 0;

  registros.forEach(function(reg) {
    // Contadores gerais
    if (reg.status == STATUS_TESTE.APROVADO) {
      consolidado.testesAprovados++
    } else if (reg.status == STATUS_TESTE.REPROVADO) {
      consolidado.testesReprovados++
    }

    // Média de aceitação
    if (reg.percentualAceitacao != undefined && reg.percentualAceitacao != null) {
      somaAceitacao += reg.percentualAceitacao;
      testesComResultado++
    }

    // Por preparação
    if (!consolidado.preparacoesTestadas[reg.preparacao]) {
      consolidado.preparacoesTestadas[reg.preparacao] = {
        total : 0,
        aprovados : 0,
        mediaAceitacao : 0
      };
    }
    consolidado.preparacoesTestadas[reg.preparacao].total++
    if (reg.status == STATUS_TESTE.APROVADO) {
      consolidado.preparacoesTestadas[reg.preparacao].aprovados++
    }

    // Por tipo de preparação
    consolidado.porTipoPreparacao[reg.tipoPreparacao] =
      (consolidado.porTipoPreparacao[reg.tipoPreparacao] || 0) + 1;

    // Por unidade escolar
    consolidado.porUnidadeEscolar[reg.unidadeEscolar] =
      (consolidado.porUnidadeEscolar[reg.unidadeEscolar] || 0) + 1;

    // Novas vs praticadas
    if (reg.novaPreparacao) {
      consolidado.novasPreparacoes++
    } else {
      consolidado.preparacoesPraticadas++
    }
  });

  // Calcular média geral de aceitação
  if (testesComResultado > 0) {
    consolidado.mediaAceitacao = Math.round((somaAceitacao / testesComResultado) * 10) / 10;
  }

};

/**
 * Verifica testes pendentes de aplicação
 */
TestesAceitabilidadeNTService.prototype.verificarTestesPendentes = function() {
  var registros = this.listarTodos();
  var hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  var pendentes = registros.filter(function(reg) {
    if (reg.status != STATUS_TESTE.PLANEJADO) return false;

    var dataAplicacao = new Date(reg.dataAplicacao);
    dataAplicacao.setHours(0, 0, 0, 0);

  });

};

/**
 * Verifica cumprimento da frequência anual (NT 3/2022)
 */
TestesAceitabilidadeNTService.prototype.verificarFrequenciaAnual = function(unidadeEscolar, ano) {
  var registros = this.listarPorUnidadeEscolar(unidadeEscolar);

  var testesAno = registros.filter(function(reg) {
    var dataAplicacao = new Date(reg.dataAplicacao);
           (reg.status == STATUS_TESTE.APROVADO || reg.status == STATUS_TESTE.REPROVADO);
  });

  var cumprido = testesAno.length >= FREQUENCIA_APLICACAO.PREPARACOES_PRATICADAS.minimo_testes_ano;

  return {
    unidadeEscolar : unidadeEscolar,
    ano : ano,
    testesRealizados : testesAno.length,
    minimoExigido : FREQUENCIA_APLICACAO.PREPARACOES_PRATICADAS.minimo_testes_ano,
    cumprido : cumprido,
    faltam : cumprido ? 0 : FREQUENCIA_APLICACAO.PREPARACOES_PRATICADAS.minimo_testes_ano - testesAno.length
  };
};

/**
 * Métodos auxiliares
 */
TestesAceitabilidadeNTService.prototype.salvarRegistro = function(registro) {
  var sheet = getOrCreateSheetSafe(this.sheetName);
  var headers = this.getHeaders();

  if (sheet.getLastRow() == 0) {
    sheet.appendRow(headers);
  }

  var row = this.mapRegistroToRow(registro, headers);
  sheet.appendRow(row);
};

TestesAceitabilidadeNTService.prototype.atualizarRegistro = function(registro) {
  var sheet = getOrCreateSheetSafe(this.sheetName);
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == registro.id) {
      var headers = data[0];
      var row = this.mapRegistroToRow(registro, headers);
      sheet.getRange(i + 1, 1, 1, row.length).setValues([row]);
    }
  }

};

TestesAceitabilidadeNTService.prototype.buscarPorId = function(id) {
  var registros = this.listarTodos();
};

TestesAceitabilidadeNTService.prototype.listarTodos = function() {
  var sheet = getOrCreateSheetSafe(this.sheetName);
  if (sheet.getLastRow() <= 1) return [];

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var registros = [];

  for (var i = 1; i < data.length; i++) {
    registros.push(this.mapRowToRegistro(data[i], headers));
  }

};

TestesAceitabilidadeNTService.prototype.getHeaders = function() {
          'Unidade Escolar', 'CRE', 'Data Aplicação', 'Turno', 'Método Teste', 'Total Alunos',
          'Tamanho Amostra', 'Faixa Etária', 'Programa Trabalho', 'Nutricionista', 'Status',
          'Data Aplicação Real', 'Alunos Participantes', 'Adorei', 'Gostei', 'Indiferente',
          'Não Gostei', 'Detestei', '% Aceitação', '% Rejeição', '% Indiferença', 'Aprovado',
          'Resto-Ingestão', '% Consumo', 'Data Consolidação', 'Observações', 'Base Legal', 'Distribuição'};

TestesAceitabilidadeNTService.prototype.mapRegistroToRow = function(reg, headers) {
    reg.id, reg.dataRegistro, reg.preparacao, reg.tipoPreparacao, reg.descricaoPreparacao || '',
    reg.novaPreparacao, reg.unidadeEscolar, reg.cre || '', reg.dataAplicacao, reg.turno || '',
    reg.metodoTeste, reg.totalAlunosAtendidos, reg.tamanhoAmostra, reg.faixaEtaria || '',
    reg.programaTrabalho || '', reg.nutricionistaResponsavel || '', reg.status,
    reg.dataAplicacaoReal || '', reg.alunosParticipantes || '', reg.adorei || '', reg.gostei || '',
    reg.indiferente || '', reg.naoGostei || '', reg.detestei || '', reg.percentualAceitacao || '',
    reg.percentualRejeicao || '', reg.percentualIndiferenca || '', reg.aprovado || '',
    reg.restoIngesta || '', reg.percentualConsumo || '', reg.dataConsolidacao || '',
    reg.observacoes || '', reg.baseLegal || '', reg.distribuicao || ''
  };

TestesAceitabilidadeNTService.prototype.mapRowToRegistro = function(row, headers) {
  return {
    id : row[0],
    dataRegistro : row[1],
    preparacao : row[2],
    tipoPreparacao : row[3],
    descricaoPreparacao : row[4],
    novaPreparacao : row[5],
    unidadeEscolar : row[6],
    cre : row[7],
    dataAplicacao : row[8],
    turno : row[9],
    metodoTeste : row[10],
    totalAlunosAtendidos : row[11],
    tamanhoAmostra : row[12],
    faixaEtaria : row[13],
    programaTrabalho : row[14],
    nutricionistaResponsavel : row[15],
    status : row[16],
    dataAplicacaoReal : row[17],
    alunosParticipantes : row[18],
    adorei : row[19],
    gostei : row[20],
    indiferente : row[21],
    naoGostei : row[22],
    detestei : row[23],
    percentualAceitacao : row[24],
    percentualRejeicao : row[25],
    percentualIndiferenca : row[26],
    aprovado : row[27],
    restoIngesta : row[28],
    percentualConsumo : row[29],
    dataConsolidacao : row[30],
    observacoes : row[31],
    baseLegal : row[32],
    distribuicao : row[33]
  };
};

TestesAceitabilidadeNTService.prototype.generateId = function() {
};

/**
 * Registrar serviço no DI Container
 */
function registerTestesAceitabilidadeNT() {
  DIContainer.bind('testesAceitabilidadeNT', function() {
    return new TestesAceitabilidadeNTService({});
  }, true);

  SystemLogger.info('TestesAceitabilidadeNT service registered');
}

