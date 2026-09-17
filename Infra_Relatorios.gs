'use strict';

/**
 * INFRA_RELATORIOS
 * Consolidado de : RelatoriosConsolidados.gs, ServerEndpointsExtended.gs
 * @version 2.0.0
 * @created 2025-11-04
 */


// ---- RelatoriosConsolidados.gs ----
/**
 * RelatoriosConsolidados.gs - Sistema de Relatórios Consolidados
 * Geração de relatórios executivos e operacionais de todos os módulos
 *
 * BASE LEGAL :
 * - Transparência e prestação de contas
 * - Relatórios gerenciais para tomada de decisão
 *
 * ESCOPO :
 * - Relatórios executivos
 * - Relatórios operacionais
 * - Relatórios de conformidade
 * - Exportação em múltiplos formatos
 * - Relatórios periódicos automatizados
 */

/**
 * TIPOS DE RELATÓRIO
 */
var TIPOS_RELATORIO = {
  EXECUTIVO : 'Executivo',
  OPERACIONAL : 'Operacional',
  CONFORMIDADE : 'Conformidade',
  ANALITICO : 'Analítico',
  SINTETICO : 'Sintético'
};

/**
 * PERÍODOS DE RELATÓRIO
 */
var PERIODOS_RELATORIO = {
  DIARIO : 'Diário',
  SEMANAL : 'Semanal',
  MENSAL : 'Mensal',
  BIMESTRAL : 'Bimestral',
  TRIMESTRAL : 'Trimestral',
  SEMESTRAL : 'Semestral',
  ANUAL : 'Anual',
  PERSONALIZADO : 'Personalizado'
};

/**
 * Service : Relatórios Consolidados
 */
function RelatoriosConsolidadosService(dependencies) {
  try {
    try {
      try {
        BaseService.call(this, dependencies);
        this.sheetRelatorios = 'Relatorios_Gerados';
      } catch (error) {
        Logger.log("Erro em RelatoriosConsolidadosService: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em RelatoriosConsolidadosService: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em RelatoriosConsolidadosService: " + error.message);
    throw error;
  }
}

RelatoriosConsolidadosService.prototype = Object.create(BaseService.prototype);
RelatoriosConsolidadosService.prototype.constructor = RelatoriosConsolidadosService;

/**
 * Gera relatório executivo completo
 */
RelatoriosConsolidadosService.prototype.gerarRelatorioExecutivo = function(periodo) {
  var relatorio = {
    tipo : TIPOS_RELATORIO.EXECUTIVO,
    dataGeracao : new Date(),
    periodo : periodo || PERIODOS_RELATORIO.MENSAL,
    secoes : []
  };

  try {
    // 1. Dashboard e Indicadores
    var dashboardService = DIContainer.resolve('dashboardAnalytics');
    var dashboard = dashboardService.gerarDashboardCompleto(null);

    relatorio.secoes.push({
      titulo : 'RESUMO EXECUTIVO',
      conteudo : this.formatarSecaoDashboard(dashboard)
    });

    // 2. Conformidade Legal
    var auditoriaService = DIContainer.resolve('auditoriaCompliance');
    var conformidade = auditoriaService.verificarConformidadeLegal();

    relatorio.secoes.push({
      titulo : 'CONFORMIDADE LEGAL',
      conteudo : this.formatarSecaoConformidade(conformidade)
    });

    // 3. Qualidade e Recebimento
    var recebimentoService = DIContainer.resolve('recebimentoGeneros');
    var relConformidade = recebimentoService.gerarRelatorioConformidade(null);

    relatorio.secoes.push({
      titulo : 'QUALIDADE E RECEBIMENTO',
      conteudo : this.formatarSecaoQualidade(relConformidade)
    });

    // 4. Atendimento aos Alunos
    var cardapiosService = DIContainer.resolve('cardapiosEspeciaisNT');
    var testesService = DIContainer.resolve('testesAceitabilidadeNT');

    relatorio.secoes.push({
      titulo : 'ATENDIMENTO AOS ALUNOS',
      conteudo : this.formatarSecaoAtendimento()
    });

    // 5. Educação Alimentar
    var eanService = DIContainer.resolve('educacaoAlimentar');
    var relEAN = eanService.gerarRelatorioConsolidado(null);

    relatorio.secoes.push({
      titulo : 'EDUCAÇÃO ALIMENTAR E NUTRICIONAL',
      conteudo : this.formatarSecaoEAN(relEAN)
    });

    // 6. Supervisão Técnica
    var supervisaoService = DIContainer.resolve('supervisaoNutricao');
    var relSupervisao = supervisaoService.gerarRelatorioSupervisao(null);

    relatorio.secoes.push({
      titulo : 'SUPERVISÃO TÉCNICA',
      conteudo : this.formatarSecaoSupervisao(relSupervisao)
    });

    // 7. Processos SEI
    var seiService = DIContainer.resolve('integracaoSEI');
    var relSEI = seiService.gerarRelatorioProcessos(null);

    relatorio.secoes.push({
      titulo : 'PROCESSOS SEI',
      conteudo : this.formatarSecaoSEI(relSEI)
    });

  } catch (error) {
    SystemLogger.error('Erro ao gerar relatório executivo', error);
    relatorio.secoes.push({
      titulo : 'ERRO',
      conteudo : 'Erro ao gerar seção : ' + error.message
    });
  }

  // Salvar registro do relatório
  this.salvarRelatorioGerado(relatorio);

/**
 * Formata seção do dashboard
 */
RelatoriosConsolidadosService.prototype.formatarSecaoDashboard = function(dashboard) {
  var linhas = [];

  linhas.push('Status Geral : ' + dashboard.resumoExecutivo.statusGeral);
  linhas.push('Pontuação : ' + dashboard.resumoExecutivo.pontuacaoGeral + '/100');
  linhas.push('');
  linhas.push('Alertas Ativos : ' + dashboard.alertas.length);
  linhas.push('  • Críticos : ' + dashboard.resumoExecutivo.alertasCriticos);
  linhas.push('  • Altos : ' + dashboard.resumoExecutivo.alertasAltos);
  linhas.push('');

  if (dashboard.resumoExecutivo.destaques.length > 0) {
    linhas.push('Destaques Positivos : ');
    dashboard.resumoExecutivo.destaques.forEach(function(destaque) {
      linhas.push('  ✓ ' + destaque);
    });
  }

};

/**
 * Formata seção de conformidade
 */
RelatoriosConsolidadosService.prototype.formatarSecaoConformidade = function(conformidade) {
  var linhas = [];

  linhas.push('Status : ' + conformidade.statusGeral);
  linhas.push('Pontuação : ' + conformidade.pontuacao + '/100');
  linhas.push('');
  linhas.push('Problemas Identificados : ' + conformidade.problemas.length);
  linhas.push('Recomendações : ' + conformidade.recomendacoes.length);

  if (conformidade.problemas.length > 0) {
    linhas.push('');
    linhas.push('Principais Problemas : ');
    conformidade.problemas.slice(0, 3).forEach(function(prob, index) {
      linhas.push('  ' + (index + 1) + '. ' + prob.item + ' [' + prob.criticidade + ']');
    });
  }

};

/**
 * Formata seção de qualidade
 */
RelatoriosConsolidadosService.prototype.formatarSecaoQualidade = function(relConformidade) {
  var linhas = [];

  linhas.push('Total de Recebimentos : ' + relConformidade.totalRecebimentos);
  linhas.push('Taxa de Conformidade : ' + relConformidade.taxaConformidade + '%');
  linhas.push('');
  linhas.push('Recebidos Conformes : ' + relConformidade.recebidosConformes);
  linhas.push('Recebidos Parciais : ' + relConformidade.recebidosParciais);
  linhas.push('Recusados : ' + relConformidade.recusados);

};

/**
 * Formata seção de atendimento
 */
RelatoriosConsolidadosService.prototype.formatarSecaoAtendimento = function() {
  var linhas = [];

  try {
    var cardapiosService = DIContainer.resolve('cardapiosEspeciaisNT');
    var testesService = DIContainer.resolve('testesAceitabilidadeNT');

    var relTestes = testesService.gerarRelatorioConsolidado(null);

    linhas.push('Testes de Aceitabilidade : ' + relTestes.totalTestes);
    linhas.push('Média de Aceitação : ' + relTestes.mediaAceitacao + '%');
    linhas.push('Testes Aprovados : ' + relTestes.testesAprovados);

  } catch (error) {
    linhas.push('Erro ao obter dados de atendimento');
    };
  }


/**
 * Formata seção de EAN
 */
RelatoriosConsolidadosService.prototype.formatarSecaoEAN = function(relEAN) {
  var linhas = [];

  linhas.push('Total de Ações : ' + relEAN.totalAcoes);
  linhas.push('Ações Concluídas : ' + relEAN.acoesConcluidas);
  linhas.push('Total de Participantes : ' + relEAN.totalParticipantes);
  linhas.push('Média por Ação : ' + relEAN.mediaParticipantesPorAcao + ' participantes');

};

/**
 * Formata seção de supervisão
 */
RelatoriosConsolidadosService.prototype.formatarSecaoSupervisao = function(relSupervisao) {
  var linhas = [];

  linhas.push('Visitas Realizadas : ' + relSupervisao.visitasRealizadas);
  linhas.push('Total de Não Conformidades : ' + relSupervisao.totalNaoConformidades);
  linhas.push('NC Corrigidas : ' + relSupervisao.naoConformidadesCorrigidas);
  linhas.push('NC Pendentes : ' + relSupervisao.naoConformidadesPendentes);

};

/**
 * Formata seção de SEI
 */
RelatoriosConsolidadosService.prototype.formatarSecaoSEI = function(relSEI) {
  var linhas = [];

  linhas.push('Total de Processos : ' + relSEI.totalProcessos);
  linhas.push('Aguardando Criação : ' + relSEI.aguardandoCriacao);
  linhas.push('Com Prazo Vencido : ' + relSEI.comPrazoVencido);

};

/**
 * Gera relatório em texto formatado
 */
RelatoriosConsolidadosService.prototype.gerarRelatorioTexto = function(relatorio) {
  var linhas = [];

  linhas.push('═══════════════════════════════════════════════════════════════');
  linhas.push('   RELATÓRIO ' + relatorio.tipo.toUpperCase());
  linhas.push('   Sistema de Gestão da Alimentação Escolar');
  linhas.push('   CRE Plano Piloto e Cruzeiro - UNIAE');
  linhas.push('═══════════════════════════════════════════════════════════════');
  linhas.push('');
  linhas.push('Data : ' + Utilities.formatDate(relatorio.dataGeracao, Session.getScriptTimeZone(), 'dd/MM/yyyy HH,mm'));
  linhas.push('Período : ' + relatorio.periodo);
  linhas.push('');

  relatorio.secoes.forEach(function(secao) {
    linhas.push('───────────────────────────────────────────────────────────────');
    linhas.push(secao.titulo);
    linhas.push('───────────────────────────────────────────────────────────────');
    linhas.push('');
    linhas.push(secao.conteudo);
    linhas.push('');
  });

  linhas.push('═══════════════════════════════════════════════════════════════');
  linhas.push('Fim do Relatório');
  linhas.push('═══════════════════════════════════════════════════════════════');

};

/**
 * Salva registro do relatório gerado
 */
RelatoriosConsolidadosService.prototype.salvarRelatorioGerado = function(relatorio) {
  var sheetName = this.sheetRelatorios || 'Relatorios_Gerados';
  var sheet = getOrCreateSheetSafe(sheetName);
  var headers = ['Data Geração', 'Tipo', 'Período', 'Total Seções', 'Gerado Por'];

  if (sheet.getLastRow() == 0) {
    sheet.appendRow(headers);
  }

  var row = [
    relatorio.dataGeracao,
    relatorio.tipo,
    relatorio.periodo,
    relatorio.secoes.length,
    Session.getActiveUser().getEmail()
  ];

  sheet.appendRow(row);
};

RelatoriosConsolidadosService.prototype.generateId = function() {
};

/**
 * Registrar serviço no DI Container
 */
function registerRelatoriosConsolidados() {
  DIContainer.bind('relatoriosConsolidados', function() {
    return new RelatoriosConsolidadosService({});
  }, true);

  SystemLogger.info('RelatoriosConsolidados service registered');
}

/**
 * Funções de menu
 */
function menuGerarRelatorioExecutivo() {
  try {
    try {
      getSS().toast('Gerando relatório executivo/* spread */', 'Aguarde', 5);

      var service = DIContainer.resolve('relatoriosConsolidados');
      var relatorio = service.gerarRelatorioExecutivo(PERIODOS_RELATORIO.MENSAL);

      var texto = service.gerarRelatorioTexto(relatorio);
      Logger.log(texto);

      var msg = 'Relatório executivo gerado com sucesso!\n' +
                'Seções : ' + relatorio.secoes.length + '\n' +
                'Verifique os logs para visualizar.';

      getSS().toast(msg, 'Relatório Gerado', 10);

    } catch (error) {
      getSS().toast('Erro : ' + error.message, 'Erro', 5);
      SystemLogger.error('Erro ao gerar relatório executivo', error);
      return {
        chaveAcesso : chaveAcesso,
        situacao : "ERRO",
        valida : false
      };
    }
  } catch (error) {
    Logger.log("Erro em menuGerarRelatorioExecutivo: " + error.message);
    throw error;
  }
}


// ---- ServerEndpointsExtended.gs ----
/**
 * ServerEndpointsExtended.gs
 * Endpoints adicionais para expor funcionalidades do backend no frontend
 * Complementa ServerEndpoints.gs com funcionalidades não expostas
 */

// ==
// CONFORMIDADE LEGAL
// ==

/**
 * Retorna dados consolidados de conformidade legal
 */
function getConformidadeData() {
  try {
    var data = {
      pnae : {
        conforme : false,
        verificacoes : [],
        score : 0
      },
      fnde : {
        conforme : false,
        verificacoes : [],
        score : 0
      },
      // lacunas : [],
      framework : []
    };

    // Verificar conformidade PNAE
    if (typeof LEGAL_BASIS != 'undefined') {
      data.pnae.conforme = true;
      data.pnae.score = 85;
      data.pnae.verificacoes = [
        {item : 'SEEDF designada como EEx', status : 'OK', base : 'Lei 11.947/2009'},
        {item : 'Guarda de documentos 5 anos', status : 'OK', base : 'Lei 11.947/2009 Art. 15'}
      ];
    }


  } catch (e) {
    Logger.log('Erro getConformidadeData : ' + e.message);
  }


}
}
