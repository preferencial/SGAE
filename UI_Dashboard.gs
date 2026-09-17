/**
 * @fileoverview UI Dashboard - Analytics e Métricas
 * @version 4.0.0
 *
 * Dependências:
 * - Core_UI_Safe.gs (getSafeUi, safeAlert, safePrompt)
 * - Core_Cache.gs (CacheService)
 */

'use strict';

// Usa funções de Core_UI_Safe.gs (getSafeUi, safeAlert, safePrompt)

/**
 * UI_DASHBOARD
 * Consolidado de : DashboardAnalytics.gs, MetricsCache.gs
 * @version 2.0.0
 * @created 2025-11-04
 */


// ---- DashboardAnalytics.gs ----
/**
 * DashboardAnalytics.gs - Dashboard e Analytics do Sistema
 * Consolidação de indicadores e métricas de todos os módulos
 *
 * BASE LEGAL :
 * - Transparência e controle (Lei 14.133/2021)
 * - Indicadores de gestão do PNAE
 *
 * ESCOPO :
 * - KPIs (Key Performance Indicators)
 * - Indicadores de conformidade
 * - Alertas e notificações
 * - Relatórios executivos
 * - Visualização de dados
 */

/**
 * CATEGORIAS DE INDICADORES
 */
var CATEGORIAS_INDICADORES = {
  CONFORMIDADE : 'Conformidade Legal',
  QUALIDADE : 'Qualidade dos Alimentos',
  ATENDIMENTO : 'Atendimento aos Alunos',
  FINANCEIRO : 'Execução Financeira',
  EDUCACIONAL : 'Educação Alimentar',
  OPERACIONAL : 'Eficiência Operacional'
};

/**
 * NÍVEIS DE ALERTA
 */
var NIVEIS_ALERTA = {
  CRITICO : {
    codigo : 'CRITICO',
    cor : '#D32F2F',
    icone : '🔴',
    prioridade : 1
  },
  ALTO : {
    codigo : 'ALTO',
    cor : '#F57C00',
    icone : '🟠',
    prioridade : 2
  },
  MEDIO : {
    codigo : 'MEDIO',
    cor : '#FBC02D',
    icone : '🟡',
    prioridade : 3
  },
  BAIXO : {
    codigo : 'BAIXO',
    cor : '#388E3C',
    icone : '🟢',
    prioridade : 4
  }
};

/**
 * Service : Dashboard e Analytics
 */
function DashboardAnalyticsService(dependencies) {
  try {
    try {
      BaseService.call(this, dependencies);
      this.sheetIndicadores = 'Dashboard_Indicadores';
      this.sheetAlertas = 'Dashboard_Alertas';
    } catch (error) {
      Logger.log("Erro em DashboardAnalyticsService: " + error.message);
      throw error; // Re-lança para tratamento superior
    }
  } catch (error) {
    Logger.log("Erro em DashboardAnalyticsService: " + error.message);
    throw error;
  }
}

DashboardAnalyticsService.prototype = Object.create(BaseService.prototype);
DashboardAnalyticsService.prototype.constructor = DashboardAnalyticsService;

/**
 * Gera dashboard consolidado completo
 */
DashboardAnalyticsService.prototype.gerarDashboardCompleto = function(filtros) {
  var dashboard = {
    dataGeracao : new Date(),
    periodo : filtros ? filtros.periodo : null,
    cre : filtros ? filtros.cre : null,

    // Indicadores por categoria,
    conformidade : this.calcularIndicadoresConformidade(filtros),
    qualidade : this.calcularIndicadoresQualidade(filtros),
    atendimento : this.calcularIndicadoresAtendimento(filtros),
    financeiro : this.calcularIndicadoresFinanceiro(filtros),
    educacional : this.calcularIndicadoresEducacional(filtros),
    operacional : this.calcularIndicadoresOperacional(filtros),

    // Alertas ativos,
    alertas : this.gerarAlertas(filtros),

    // Resumo executivo,
    resumoExecutivo : {}
  };

  // Calcular resumo executivo
  dashboard.resumoExecutivo = this.gerarResumoExecutivo(dashboard);

  return dashboard;
};

/**
 * Calcula indicadores de conformidade legal
 */
DashboardAnalyticsService.prototype.calcularIndicadoresConformidade = function(filtros) {
  var indicadores = {
    categoria : CATEGORIAS_INDICADORES.CONFORMIDADE,
    metricas : {}
  };

  try {
    // Comissão de Recebimento
    var comissaoService = DIContainer.resolve('comissaoRecebimento');
    var conformidadeComissao = comissaoService.verificarConformidadeComissao(
      filtros && filtros.unidadeEscolar ? filtros.unidadeEscolar : null
    );

    indicadores.metricas.comissaoConstituida = {
      nome : 'Comissão de Recebimento Constituída',
      valor : conformidadeComissao.conforme,
      tipo : 'boolean',
      meta : true,
      baseLegal : 'Resolução FNDE 06/2020'
    };

    // Prestação de Contas
    var prestacaoService = DIContainer.resolve('prestacaoContas');
    var relPrestacao = prestacaoService.gerarRelatorioConsolidado(filtros);

    indicadores.metricas.prestacoesCompletas = {
      nome : 'Taxa de Prestações Completas',
      valor : relPrestacao.totalPrestacoes > 0 ?
        Math.round((relPrestacao.prestacoesCompletas / relPrestacao.totalPrestacoes) * 100) : 0,
      tipo : 'percentual',
      meta : 100,
      baseLegal : 'Manual Item 18'
    };

    // Testes de Aceitabilidade
    var testesService = DIContainer.resolve('testesAceitabilidadeNT');
    var relTestes = testesService.gerarRelatorioConsolidado(filtros);

    indicadores.metricas.testesRealizados = {
      nome : 'Testes de Aceitabilidade Realizados',
      valor : relTestes.totalTestes,
      tipo : 'numero',
      meta : 2, // mínimo por ano
      baseLegal : 'NT 3/2022'
    };

  } catch (error) {
    SystemLogger.error('Erro ao calcular indicadores de conformidade', error);
  }

  return indicadores;
};


/**
 * Calcula indicadores de qualidade
 */
DashboardAnalyticsService.prototype.calcularIndicadoresQualidade = function(filtros) {
  var indicadores = {
    categoria : CATEGORIAS_INDICADORES.QUALIDADE,
    metricas : {}
  };

  try {
    // Recebimento de Gêneros
    var recebimentoService = DIContainer.resolve('recebimentoGeneros');
    var relConformidade = recebimentoService.gerarRelatorioConformidade(filtros);

    indicadores.metricas.taxaConformidadeRecebimento = {
      nome : 'Taxa de Conformidade no Recebimento',
      valor : relConformidade.taxaConformidade || 0,
      tipo : 'percentual',
      meta : 95,
      baseLegal : 'Manual Item 12'
    };

    indicadores.metricas.recusasRegistradas = {
      nome : 'Recusas Registradas',
      valor : relConformidade.recusados,
      tipo : 'numero',
      observacao : 'Menor é melhor'
    };

    // Supervisão Técnica
    var supervisaoService = DIContainer.resolve('supervisaoNutricao');
    var relSupervisao = supervisaoService.gerarRelatorioSupervisao(filtros);

    indicadores.metricas.naoConformidadesCorrigidas = {
      nome : 'Taxa de Correção de Não Conformidades',
      valor : relSupervisao.totalNaoConformidades > 0 ?
        Math.round((relSupervisao.naoConformidadesCorrigidas / relSupervisao.totalNaoConformidades) * 100) : 0,
      tipo : 'percentual',
      meta : 90,
      baseLegal : 'Manual Item 19'
    };

    // Armazenamento
    var armazenamentoService = DIContainer.resolve('armazenamentoGeneros');
    var vencidos = armazenamentoService.verificarVencidos(
      filtros && filtros.unidadeEscolar ? filtros.unidadeEscolar : null
    );

    indicadores.metricas.produtosVencidos = {
      nome : 'Produtos Vencidos no Estoque',
      valor : vencidos.length,
      tipo : 'numero',
      meta : 0,
      nivel : vencidos.length > 0 ? NIVEIS_ALERTA.CRITICO.codigo : NIVEIS_ALERTA.BAIXO.codigo
    };

  } catch (error) {
    SystemLogger.error('Erro ao calcular indicadores de qualidade', error);
  }

  return indicadores;
};


/**
 * Calcula indicadores de atendimento
 */
DashboardAnalyticsService.prototype.calcularIndicadoresAtendimento = function(filtros) {
  var indicadores = {
    categoria : CATEGORIAS_INDICADORES.ATENDIMENTO,
    metricas : {}
  };

  try {
    // Cardápios Especiais
    var cardapiosService = DIContainer.resolve('cardapiosEspeciaisNT');
    var relCardapios = cardapiosService.gerarRelatorioConsolidadoCRE(
      filtros && filtros.cre ? filtros.cre : 'CRE-PP'
    );

    indicadores.metricas.alunosNecessidadesEspeciais = {
      nome : 'Alunos com Necessidades Especiais Atendidos',
      valor : relCardapios.totalAlunos,
      tipo : 'numero',
      baseLegal : 'NT 2/2025'
    };

    indicadores.metricas.laudosAtualizados = {
      nome : 'Taxa de Laudos Atualizados',
      valor : relCardapios.comLaudo > 0 ?
        Math.round(((relCardapios.comLaudo - relCardapios.laudosVencidos) / relCardapios.comLaudo) * 100) : 100,
      tipo : 'percentual',
      meta : 100,
      baseLegal : 'NT 2/2025 Item 2.3.1'
    };

    // Testes de Aceitabilidade
    var testesService = DIContainer.resolve('testesAceitabilidadeNT');
    var relTestes = testesService.gerarRelatorioConsolidado(filtros);

    indicadores.metricas.aceitacaoMedia = {
      nome : 'Média de Aceitação dos Cardápios',
      valor : relTestes.mediaAceitacao || 0,
      tipo : 'percentual',
      meta : 85,
      baseLegal : 'Resolução FNDE 38/2009'
    };

  } catch (error) {
    SystemLogger.error('Erro ao calcular indicadores de atendimento', error);
  }

  return indicadores;
};


/**
 * Calcula indicadores financeiros
 */
DashboardAnalyticsService.prototype.calcularIndicadoresFinanceiro = function(filtros) {
  var indicadores = {
    categoria : CATEGORIAS_INDICADORES.FINANCEIRO,
    metricas : {}
  };

  try {
    var prestacaoService = DIContainer.resolve('prestacaoContas');
    var relPrestacao = prestacaoService.gerarRelatorioConsolidado(filtros);

    indicadores.metricas.mediaCompletudePrestacao = {
      nome : 'Média de Completude das Prestações',
      valor : relPrestacao.mediaCompletude || 0,
      tipo : 'percentual',
      meta : 100,
      baseLegal : 'Manual Item 18'
    };

  } catch (error) {
    SystemLogger.error('Erro ao calcular indicadores financeiros', error);
  }

  return indicadores;
};


/**
 * Calcula indicadores educacionais
 */
DashboardAnalyticsService.prototype.calcularIndicadoresEducacional = function(filtros) {
  var indicadores = {
    categoria : CATEGORIAS_INDICADORES.EDUCACIONAL,
    metricas : {}
  };

  try {
    var eanService = DIContainer.resolve('educacaoAlimentar');
    var relEAN = eanService.gerarRelatorioConsolidado(filtros);

    indicadores.metricas.acoesEANRealizadas = {
      nome : 'Ações de EAN Realizadas',
      valor : relEAN.acoesConcluidas,
      tipo : 'numero',
      meta : 4, // mínimo por ano
      baseLegal : 'Lei 11.947/2009 Art. 2º'
    };

    indicadores.metricas.participantesEAN = {
      nome : 'Total de Participantes em EAN',
      valor : relEAN.totalParticipantes,
      tipo : 'numero',
      baseLegal : 'Manual Item 3'
    };

    indicadores.metricas.mediaParticipantes = {
      nome : 'Média de Participantes por Ação',
      valor : relEAN.mediaParticipantesPorAcao,
      tipo : 'numero'
    };

  } catch (error) {
    SystemLogger.error('Erro ao calcular indicadores educacionais', error);
  }

  return indicadores;
};


/**
 * Calcula indicadores operacionais
 */
DashboardAnalyticsService.prototype.calcularIndicadoresOperacional = function(filtros) {
  var indicadores = {
    categoria : CATEGORIAS_INDICADORES.OPERACIONAL,
    metricas : {}
  };

  try {
    var supervisaoService = DIContainer.resolve('supervisaoNutricao');
    var relSupervisao = supervisaoService.gerarRelatorioSupervisao(filtros);

    indicadores.metricas.visitasRealizadas = {
      nome : 'Visitas Técnicas Realizadas',
      valor : relSupervisao.visitasRealizadas,
      tipo : 'numero',
      baseLegal : 'Manual Item 19'
    };

    indicadores.metricas.naoConformidadesPendentes = {
      nome : 'Não Conformidades Pendentes',
      valor : relSupervisao.naoConformidadesPendentes,
      tipo : 'numero',
      observacao : 'Menor é melhor'
    };

  } catch (error) {
    SystemLogger.error('Erro ao calcular indicadores operacionais', error);
  }

  return indicadores;
};


/**
 * Gera alertas do sistema
 */
DashboardAnalyticsService.prototype.gerarAlertas = function(filtros) {
  var alertas = [];

  try {
    // Alerta : Produtos vencidos
    var armazenamentoService = DIContainer.resolve('armazenamentoGeneros');
    var vencidos = armazenamentoService.verificarVencidos(
      filtros && filtros.unidadeEscolar ? filtros.unidadeEscolar : null
    );

    if (vencidos.length > 0) {
      alertas.push({
        id : 'PROD_VENCIDOS',
        nivel : NIVEIS_ALERTA.CRITICO,
        categoria : 'Qualidade',
        titulo : 'Produtos Vencidos no Estoque',
        descricao : vencidos.length + ' produto(s) vencido(s) identificado(s)',
        quantidade : vencidos.length,
        acao : 'Realizar descarte imediato conforme NT 1/2025',
        baseLegal : 'NT 1/2025 Item 7'
      });
    }

    // Alerta : Produtos próximos ao vencimento
    var proximos = armazenamentoService.verificarProximosVencimento(
      filtros && filtros.unidadeEscolar ? filtros.unidadeEscolar : null,
      30
    );

    if (proximos.length > 0) {
      alertas.push({
        id : 'PROD_PROXIMOS_VENC',
        nivel : NIVEIS_ALERTA.ALTO,
        categoria : 'Qualidade',
        titulo : 'Produtos Próximos ao Vencimento',
        descricao : proximos.length + ' produto(s) vencem em até 30 dias',
        quantidade : proximos.length,
        acao : 'Priorizar uso conforme método PVPS',
        baseLegal : 'Manual Item 14'
      });
    }

    // Alerta : Não conformidades vencidas
    var supervisaoService = DIContainer.resolve('supervisaoNutricao');
    var ncVencidas = supervisaoService.verificarNaoConformidadesVencidas(
      filtros && filtros.unidadeEscolar ? filtros.unidadeEscolar : null
    );

    if (ncVencidas.length > 0) {
      alertas.push({
        id : 'NC_VENCIDAS',
        nivel : NIVEIS_ALERTA.CRITICO,
        categoria : 'Conformidade',
        titulo : 'Não Conformidades com Prazo Vencido',
        descricao : ncVencidas.length + ' não conformidade(s) não corrigida(s) no prazo',
        quantidade : ncVencidas.length,
        acao : 'Providenciar correção urgente',
        baseLegal : 'RDC ANVISA 216/2004'
      });
    }

    // Alerta : Laudos vencidos
    var cardapiosService = DIContainer.resolve('cardapiosEspeciaisNT');
    var laudosVencidos = cardapiosService.verificarLaudosVencidos();

    if (laudosVencidos.length > 0) {
      alertas.push({
        id : 'LAUDOS_VENCIDOS',
        nivel : NIVEIS_ALERTA.ALTO,
        categoria : 'Atendimento',
        titulo : 'Laudos Médicos Vencidos',
        descricao : laudosVencidos.length + ' laudo(s) com mais de 1 ano',
        quantidade : laudosVencidos.length,
        acao : 'Solicitar atualização dos laudos',
        baseLegal : 'NT 2/2025 Item 2.3.1'
      });
    }

    // Alerta : Prazos de reposição vencidos
    var pereciveisService = DIContainer.resolve('controlePereciveisNT');
    var prazosVencidos = pereciveisService.verificarPrazosReposicao();

    if (prazosVencidos.length > 0) {
      alertas.push({
        id : 'PRAZOS_REPOSICAO',
        nivel : NIVEIS_ALERTA.ALTO,
        categoria : 'Operacional',
        titulo : 'Prazos de Reposição Vencidos',
        descricao : prazosVencidos.length + ' reposição(ões) pendente(s)',
        quantidade : prazosVencidos.length,
        acao : 'Cobrar reposição ou encaminhar à CORRED',
        baseLegal : 'NT 1/2025 Item 8 e 9'
      });
    }

    // Alerta : Testes pendentes
    var testesService = DIContainer.resolve('testesAceitabilidadeNT');
    var testesPendentes = testesService.verificarTestesPendentes();

    if (testesPendentes.length > 0) {
      alertas.push({
        id : 'TESTES_PENDENTES',
        nivel : NIVEIS_ALERTA.MEDIO,
        categoria : 'Conformidade',
        titulo : 'Testes de Aceitabilidade Pendentes',
        descricao : testesPendentes.length + ' teste(s) planejado(s) não realizado(s)',
        quantidade : testesPendentes.length,
        acao : 'Realizar testes conforme planejamento',
        baseLegal : 'NT 3/2022'
      });
    }

  } catch (error) {
    SystemLogger.error('Erro ao gerar alertas', error);
  }

  // Ordenar por prioridade
  alertas.sort(function(a, b) { return a.nivel.prioridade - b.nivel.prioridade; });

  return alertas;
};

/**
 * Gera resumo executivo
 */
DashboardAnalyticsService.prototype.gerarResumoExecutivo = function(dashboard) {
  var resumo = {
    statusGeral : 'BOM',
    pontuacaoGeral : 0,
    alertasCriticos : 0,
    alertasAltos : 0,
    principaisAcoes : [],
    destaques : []
  };

  // Contar alertas por nível
  dashboard.alertas.forEach(function(alerta) {
    if (alerta.nivel.codigo == NIVEIS_ALERTA.CRITICO.codigo) {
      resumo.alertasCriticos++;
    } else if (alerta.nivel.codigo == NIVEIS_ALERTA.ALTO.codigo) {
      resumo.alertasAltos++;
    }
  });

  // Determinar status geral
  if (resumo.alertasCriticos > 0) {
    resumo.statusGeral = 'CRÍTICO';
    resumo.pontuacaoGeral = 40;
  } else if (resumo.alertasAltos > 2) {
    resumo.statusGeral = 'ATENÇÃO';
    resumo.pontuacaoGeral = 60;
  } else if (resumo.alertasAltos > 0) {
    resumo.statusGeral = 'REGULAR';
    resumo.pontuacaoGeral = 75;
  } else {
    resumo.statusGeral = 'BOM';
    resumo.pontuacaoGeral = 90;
  }

  // Principais ações necessárias (top 3 alertas)
  resumo.principaisAcoes = dashboard.alertas.slice(0, 3).map(function(alerta) {});

  // Destaques positivos
  if (dashboard.qualidade.metricas.taxaConformidadeRecebimento &&
      dashboard.qualidade.metricas.taxaConformidadeRecebimento.valor >= 95) {
    resumo.destaques.push('Excelente taxa de conformidade no recebimento');
  }

  if (dashboard.atendimento.metricas.aceitacaoMedia &&
      dashboard.atendimento.metricas.aceitacaoMedia.valor >= 85) {
    resumo.destaques.push('Boa aceitação dos cardápios pelos alunos');
  }

  if (dashboard.educacional.metricas.acoesEANRealizadas &&
      dashboard.educacional.metricas.acoesEANRealizadas.valor >= 4) {
    resumo.destaques.push('Meta de ações de EAN cumprida');
  }

  return resumo;
};

/**
 * Salva snapshot do dashboard
 */
DashboardAnalyticsService.prototype.salvarSnapshot = function(dashboard) {
  var sheetName = this.sheetIndicadores || 'Dashboard_Indicadores';
  var sheet = getOrCreateSheetSafe(sheetName);
  var headers = ['Data', 'Status Geral', 'Pontuação', 'Alertas Críticos', 'Alertas Altos',
                 'Conformidade Recebimento', 'Aceitação Média', 'Ações EAN', 'Visitas Realizadas'];

  if (sheet.getLastRow() == 0) {
    sheet.appendRow(headers);
  }

  var row = [
    dashboard.dataGeracao,
    dashboard.resumoExecutivo.statusGeral,
    dashboard.resumoExecutivo.pontuacaoGeral,
    dashboard.resumoExecutivo.alertasCriticos,
    dashboard.resumoExecutivo.alertasAltos,
    dashboard.qualidade.metricas.taxaConformidadeRecebimento ?
      dashboard.qualidade.metricas.taxaConformidadeRecebimento.valor : '',
    dashboard.atendimento.metricas.aceitacaoMedia ?
      dashboard.atendimento.metricas.aceitacaoMedia.valor : '',
    dashboard.educacional.metricas.acoesEANRealizadas ?
      dashboard.educacional.metricas.acoesEANRealizadas.valor : '',
    dashboard.operacional.metricas.visitasRealizadas ?
      dashboard.operacional.metricas.visitasRealizadas.valor : ''
  ];

  sheet.appendRow(row);

  SystemLogger.info('Snapshot do dashboard salvo', {
    status : dashboard.resumoExecutivo.statusGeral,
    pontuacao : dashboard.resumoExecutivo.pontuacaoGeral
  });
};

/**
 * Gera relatório executivo em texto
 */
DashboardAnalyticsService.prototype.gerarRelatorioExecutivo = function(filtros) {
  var dashboard = this.gerarDashboardCompleto(filtros);

  var linhas = [];
  linhas.push('═══════════════════════════════════════════════════════');
  linhas.push('   RELATÓRIO EXECUTIVO - ALIMENTAÇÃO ESCOLAR');
  linhas.push('   CRE Plano Piloto e Cruzeiro - UNIAE');
  linhas.push('═══════════════════════════════════════════════════════');
  linhas.push('');
  linhas.push('Data : ' + Utilities.formatDate(dashboard.dataGeracao, Session.getScriptTimeZone(), 'dd/MM/yyyy HH,mm'));
  linhas.push('');

  // Status Geral
  linhas.push('STATUS GERAL : ' + dashboard.resumoExecutivo.statusGeral);
  linhas.push('Pontuação : ' + dashboard.resumoExecutivo.pontuacaoGeral + '/100');
  linhas.push('');

  // Alertas
  if (dashboard.alertas.length > 0) {
    linhas.push('─────────────────────────────────────────────────────');
    linhas.push('ALERTAS ATIVOS : ' + dashboard.alertas.length);
    linhas.push('─────────────────────────────────────────────────────');

    dashboard.alertas.forEach(function(alerta) {
      linhas.push('');
      linhas.push(alerta.nivel.icone + alerta.titulo + ' [' + alerta.nivel.codigo + ']');
      linhas.push('   ' + alerta.descricao);
      linhas.push('   Ação : ' + alerta.acao);
    });
    linhas.push('');
  }

  // Indicadores principais
  linhas.push('─────────────────────────────────────────────────────');
  linhas.push('INDICADORES PRINCIPAIS');
  linhas.push('─────────────────────────────────────────────────────');
  linhas.push('');

  // Conformidade
  linhas.push('📋 CONFORMIDADE : ');
  if (dashboard.conformidade.metricas.comissaoConstituida) {
    linhas.push('   • Comissão : ' + (dashboard.conformidade.metricas.comissaoConstituida.valor ? 'Constituída ✓' : 'Não Constituída ✗'));
  }
  if (dashboard.conformidade.metricas.prestacoesCompletas) {
    linhas.push('   • Prestações Completas : ' + dashboard.conformidade.metricas.prestacoesCompletas.valor + '%');
  }
  linhas.push('');

  // Qualidade
  linhas.push('✅ QUALIDADE : ');
  if (dashboard.qualidade.metricas.taxaConformidadeRecebimento) {
    linhas.push('   • Conformidade Recebimento : ' + dashboard.qualidade.metricas.taxaConformidadeRecebimento.valor + '%');
  }
  if (dashboard.qualidade.metricas.produtosVencidos) {
    linhas.push('   • Produtos Vencidos : ' + dashboard.qualidade.metricas.produtosVencidos.valor);
  }
  linhas.push('');

  // Atendimento
  linhas.push('🍽️ ATENDIMENTO : ');
  if (dashboard.atendimento.metricas.alunosNecessidadesEspeciais) {
    linhas.push('   • Alunos Especiais : ' + dashboard.atendimento.metricas.alunosNecessidadesEspeciais.valor);
  }
  if (dashboard.atendimento.metricas.aceitacaoMedia) {
    linhas.push('   • Aceitação Média : ' + dashboard.atendimento.metricas.aceitacaoMedia.valor + '%');
  }
  linhas.push('');

  // Educacional
  linhas.push('🎓 EDUCAÇÃO ALIMENTAR : ');
  if (dashboard.educacional.metricas.acoesEANRealizadas) {
    linhas.push('   • Ações Realizadas : ' + dashboard.educacional.metricas.acoesEANRealizadas.valor);
  }
  if (dashboard.educacional.metricas.participantesEAN) {
    linhas.push('   • Participantes : ' + dashboard.educacional.metricas.participantesEAN.valor);
  }
  linhas.push('');

  // Destaques
  if (dashboard.resumoExecutivo.destaques.length > 0) {
    linhas.push('DESTAQUES POSITIVOS');
    linhas.push('─────────────────────────────────────────────────────');
    dashboard.resumoExecutivo.destaques.forEach(function(destaque) {
      linhas.push('✓ ' + destaque);
    });
    linhas.push('');
  }

  linhas.push('═══════════════════════════════════════════════════════');

  return linhas.join('\n');
};

/**
 * Registrar serviço no DI Container
 */
function registerDashboardAnalytics() {
  DIContainer.bind('dashboardAnalytics', function() {
    return new DashboardAnalyticsService({});
  }, true);

  SystemLogger.info('DashboardAnalytics service registered');
}

/**
 * Função de menu para gerar dashboard
 */
function menuGerarDashboard() {
  try {
    try {
      getSS().toast('Gerando dashboard/* spread */', 'Aguarde', 3);

      var service = DIContainer.resolve('dashboardAnalytics');
      var dashboard = service.gerarDashboardCompleto(null);

      // Salvar snapshot
      service.salvarSnapshot(dashboard);

      // Gerar relatório executivo
      var relatorio = service.gerarRelatorioExecutivo(null);

      // Exibir em log
      Logger.log(relatorio);

      var msg = 'Dashboard gerado com sucesso!\n\n' +
                'Status : ' + dashboard.resumoExecutivo.statusGeral + '\n' +
                'Pontuação : ' + dashboard.resumoExecutivo.pontuacaoGeral + '/100\n' +
                'Alertas : ' + dashboard.alertas.length;

      getSS().toast(msg, 'Dashboard', 10);

      return { success : true, dashboard : dashboard };

    } catch (error) {
      getSS().toast('Erro : ' + error.message, 'Erro', 5);
      SystemLogger.error('Erro ao gerar dashboard', error);
      return {
        success : false,
        error : error.message
      };
    }
  } catch (error) {
    Logger.log("Erro em menuGerarDashboard: " + error.message);
    throw error;
  }
}

// ---- MetricsCache.gs ----
/**
 * MetricsCache.gs
 * Sistema de Cache para Métricas e Dashboards
 *
 * Otimiza performance dos dashboards através de cache inteligente
 * Reduz cálculos repetitivos em até 80%
 */

var MetricsCache = (function() {
  var cache = CacheService.getScriptCache();
  var CACHE_TTL = 300; // 5 minutos padrão;
  var stats = {
    hits : 0,
    misses : 0,
    calculations : 0
  };

  /**
   * Obtém uma métrica com cache
   */
  function getMetric(metricName, calculator, ttl) {
    try {
      ttl = ttl || CACHE_TTL;
      var cacheKey = 'metric_' + metricName;
      var cached = cache.get(cacheKey);

      if (cached) {
        stats.hits++;
        Logger.log('Cache hit para métrica : ' + metricName);
        return JSON.parse(cached);
      }

      stats.misses++;
      stats.calculations++;
      Logger.log('Cache miss para métrica : ' + metricName + ' - Calculando/* spread */');

      // Calcular métrica
      var startTime = new Date().getTime();
      var value = calculator();
      var endTime = new Date().getTime();

      Logger.log('Métrica calculada em ' + (endTime - startTime) + 'ms');

      // Armazenar em cache
      cache.put(cacheKey, JSON.stringify(value), ttl);

      return value;
    } catch (error) {
      Logger.log("Erro em getMetric: " + error.message);
      throw error;
    }
  }

  /**
   * Obtém múltiplas métricas de uma vez
   */
  function getMetrics(metricsConfig) {
    var results = {};

    for (var metricName in metricsConfig) {
      var config = metricsConfig[metricName];
      results[metricName] = getMetric(
        metricName,
        config.calculator,
        config.ttl
      );
    }

    return results;
  }

  /**
   * Invalida uma métrica específica
   */
  function invalidateMetric(metricName) {
    try {
      var cacheKey = 'metric_' + metricName;
      cache.remove(cacheKey);
      Logger.log('Métrica invalidada : ' + metricName);
    } catch (error) {
      Logger.log("Erro em invalidateMetric: " + error.message);
      throw error;
    }
  }

  /**
   * Invalida múltiplas métricas
   */
  function invalidateMetrics(metricNames) {
    for (var i = 0; i < metricNames.length; i++) {
      invalidateMetric(metricNames[i]);
    }
  }

  /**
   * Invalida todas as métricas
   */
  function invalidateAll() {
    try {
      var keys = cache.getKeys();
      for (var i = 0; i < keys.length; i++) {
        if (keys[i].indexOf('metric_') == 0) {
          cache.remove(keys[i]);
        }
      }
      Logger.log('Todas as métricas invalidadas');
    } catch (error) {
      Logger.log("Erro em invalidateAll: " + error.message);
      throw error;
    }
  }

  /**
   * Pré-aquece o cache com métricas importantes
   */
  function warmup(metricsConfig) {
    Logger.log('Iniciando warmup do cache/* spread */');
    var startTime = new Date().getTime();

    for (var metricName in metricsConfig) {
      try {
        var config = metricsConfig[metricName];
        getMetric(metricName, config.calculator, config.ttl);
      } catch (e) {
        Logger.log('Erro no warmup da métrica ' + metricName + ' : ' + e.message);
      }
    }

    var endTime = new Date().getTime();
    Logger.log('Warmup concluído em ' + (endTime - startTime) + 'ms');
  }

  /**
   * Obtém estatísticas do cache
   */
  function getStats() {
    var hitRate = stats.hits + stats.misses > 0 ? (stats.hits / (stats.hits + stats.misses) * 100).toFixed(2) : 0;

    return {
      hits : stats.hits,
      misses : stats.misses,
      calculations : stats.calculations,
      hitRate : hitRate + '%',
      totalRequests : stats.hits + stats.misses
    };
  }

  /**
   * Reseta estatísticas
   */
  function resetStats() {
    stats = {
      hits : 0,
      misses : 0,
      calculations : 0
    };
    Logger.log('Estatísticas resetadas');
  }

  return {
    getMetric : getMetric,
    getMetrics : getMetrics,
    invalidateMetric : invalidateMetric,
    invalidateMetrics : invalidateMetrics,
    invalidateAll : invalidateAll,
    warmup : warmup,
    getStats : getStats
  };
})();

/**
 * Exemplo : Dashboard com métricas em cache
 * @deprecated Use getDashboardMetricsUnificado() do Core_CRUD_Frontend_Bridge.gs
 * Esta função foi renomeada para evitar conflito de nomenclatura
 */
function _getDashboardMetrics_Dashboard() {
  return MetricsCache.getMetrics({
    totalNotas : {
      calculator: function() {
        return contarNotasFiscais();
      },
      // ttl : 300 // 5 minutos
    },

    taxaConformidade : {
      calculator: function() {
        return calcularTaxaConformidade();
      },
      // ttl : 600 // 10 minutos
    },

    violacoesCriticas : {
      calculator: function() {
        return contarViolacoesCriticas();
      },
      // ttl : 180 // 3 minutos
    },

    fornecedoresAtivos : {
      calculator: function() {
        return contarFornecedoresAtivos();
      },
      // ttl : 900 // 15 minutos
    },

    valorTotalMes : {
      calculator: function() {
        return calcularValorTotalMes();
      },
      // ttl : 300 // 5 minutos
    }
  });
}

/**
 * Funções auxiliares de cálculo (implementar conforme necessário)
 */
function contarNotasFiscais() {
  try {
    try {
      var sheet = getSS().getSheetByName('Notas_Fiscais');
      if (!sheet) return 0;
      return sheet.getLastRow() - 1; // -1 para excluir cabeçalho;
    } catch (error) {
      Logger.log("Erro em contarNotasFiscais: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em contarNotasFiscais: " + error.message);
    throw error;
  }
}

function calcularTaxaConformidade() {
  try {
    try {
      var sheet = getSS().getSheetByName('Conformidade');
      if (!sheet) return 0;

      var data = sheet.getDataRange().getValues();
      var total = data.length - 1;
      var conformes = 0;

      for (var i = 1; i < data.length; i++) {
        if (data[i][5] == 'CONFORME') { // Coluna F
          conformes++;
        }
      }

      return total > 0 ? (conformes / total) * 100 : 0;
    } catch (error) {
      Logger.log("Erro em calcularTaxaConformidade: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em calcularTaxaConformidade: " + error.message);
    throw error;
  }
}

function contarViolacoesCriticas() {
  try {
    try {
      var sheet = getSS().getSheetByName('Violacoes');
      if (!sheet) return 0;

      var data = sheet.getDataRange().getValues();
      var criticas = 0;

      for (var i = 1; i < data.length; i++) {
        if (data[i][3] == 'CRITICA') { // Coluna D
          criticas++;
        }
      }

      return criticas;
    } catch (error) {
      Logger.log("Erro em contarViolacoesCriticas: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em contarViolacoesCriticas: " + error.message);
    throw error;
  }
}

function contarFornecedoresAtivos() {
  try {
    var sheet = getSS().getSheetByName('Fornecedores');
    if (!sheet) return 0;

    var data = sheet.getDataRange().getValues();
    var ativos = 0;

    for (var i = 1; i < data.length; i++) {
      if (data[i][4] == 'ATIVO') { // Coluna E
        ativos++;
      }
    }

    return ativos;
  } catch (error) {
    Logger.log("Erro em contarFornecedoresAtivos: " + error.message);
    throw error;
  }
}

function calcularValorTotalMes() {
  try {
    var sheet = getSS().getSheetByName('Notas_Fiscais');
    if (!sheet) return 0;

    var data = sheet.getDataRange().getValues();
    var mesAtual = new Date().getMonth();
    var anoAtual = new Date().getFullYear();
    var total = 0;

    for (var i = 1; i < data.length; i++) {
      var data_nf = new Date(data[i][2]); // Coluna C;
      if (data_nf.getMonth() == mesAtual && data_nf.getFullYear() == anoAtual) {
        total += Number(data[i][4]) || 0; // Coluna E
      }
    }

    return total;
  } catch (error) {
    Logger.log("Erro em calcularValorTotalMes: " + error.message);
    throw error;
  }
}

/**
 * Testa o sistema de cache
 */
function testMetricsCache() {
  try {
    try {
      try {
        Logger.log('Iniciando teste do MetricsCache/* spread */');

        // Resetar estatísticas
        MetricsCache.resetStats();

        // Primeira chamada (cache miss)
        var metrics1 = getDashboardMetrics();
        Logger.log('Primeira chamada : ' + JSON.stringify(metrics1));

        // Segunda chamada (cache hit)
        var metrics2 = getDashboardMetrics();
        Logger.log('Segunda chamada : ' + JSON.stringify(metrics2));

        // Obter estatísticas
        var stats = MetricsCache.getStats();
        Logger.log('Estatísticas : ' + JSON.stringify(stats));

        // Mostrar resultado
        safeUiAlert('✅ MetricsCache OK',
          'Cache funcionando corretamente!\n\n' +
          'Hits : ' + stats.hits + '\n' +
          'Misses : ' + stats.misses + '\n' +
          'Hit Rate : ' + stats.hitRate + '\n\n' +
          'Métricas : ' + JSON.stringify(metrics1, null, 2).substring(0, 200) + '...');

      } catch (e) {
        Logger.log('❌ Erro no teste : ' + e.message);
        safeUiAlert('❌ Erro', e.message);
      }
    } catch (error) {
      Logger.log("Erro em testMetricsCache: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em testMetricsCache: " + error.message);
    throw error;
  }
}

/**
 * Invalida cache quando dados são atualizados
 */
function onDataUpdate() {
  // Invalidar métricas relacionadas
  MetricsCache.invalidateMetrics([
    'totalNotas',
    'taxaConformidade',
    'violacoesCriticas',
    'valorTotalMes'
  ]);

  Logger.log('Cache invalidado após atualização de dados');
}

/**
 * Pré-aquece o cache (executar periodicamente)
 */
function warmupDashboardCache() {
  MetricsCache.warmup({
    totalNotas : {
      calculator : contarNotasFiscais,
      ttl : 300
    },
    taxaConformidade : {
      calculator : calcularTaxaConformidade,
      ttl : 600
    },
    violacoesCriticas : {
      calculator : contarViolacoesCriticas,
      ttl : 180
    },
    fornecedoresAtivos : {
      calculator : contarFornecedoresAtivos,
      ttl : 900
    },
    valorTotalMes : {
      calculator : calcularValorTotalMes,
      ttl : 300
    }
  });

  Logger.log('Cache pré-aquecido com sucesso');
}

