// Requer V8 runtime habilitado no Apps Script
'use strict';

/**
 * DOMINIO_LEGAL
 * Consolidado de : LegalReports.gs, ConformidadeAuditoria.gs
 * @version 2.0.0
 * @created 2025-11-04
 */


// ---- LegalReports.gs ----
/**
 * LegalReports.gs - Relat�rios de Conformidade Legal
 * Sistema UNIAE CRE PP/Cruzeiro - Conformidade Legal
 *
 * Gera relat�rios espec�ficos de conformidade legal, identificando lacunas,
 * viola��es e recomenda��es baseadas na an�lise cr�tica da legisla��o aplic�vel.
 */

/**
 * GERADOR DE RELAT�RIOS DE CONFORMIDADE LEGAL
 */
var LEGAL_REPORTS = {

  /**
   * Gera relat�rio completo de conformidade legal
   */
  generateComprehensiveComplianceReport: function() {
    var report = {
      metadata : {
        title : 'Relat�rio de Conformidade Legal - Sistema UNIAE',
        subtitle : 'An�lise Cr�tica da Legisla��o de Confer�ncia de Notas Fiscais e Notas de Empenho',
        generated_at : new Date(),
        version : '3.0.0-legal-compliance',
        scope : 'SEEDF/CRE-PPA - Fornecedores de G�neros Aliment�cios'
      },

      // executive_summary : this.generateExecutiveSummary(),
      legal_framework_analysis : this.analyzeLegalFramework(),
      responsibility_matrix : this.generateResponsibilityMatrix(),
      critical_gaps : this.identifyCriticalGaps(),
      compliance_violations : this.identifyComplianceViolations(),
      recommendations : this.generateCriticalRecommendations(),
      implementation_roadmap : this.generateImplementationRoadmap()
    };
  },

  /**
   * Gera resumo executivo
   */
  generateExecutiveSummary: function() {
    return {
      overview : 'A legisla��o que rege a confer�ncia de notas fiscais e notas de empenho na CRE-PP � dispersa, incoerente e inadequada � realidade operacional local.',

      key_findings : [
        'Analistas educacionais trabalham em V�CUO LEGAL',
        'UNIAE sem base legal clara para confer�ncia',
        'Conflito entre Lei 14.133/2021 e necessidades operacionais',
        'Responsabilidades pulverizadas sem designa��o formal',
        'Procedimentos baseados em interpreta��es customizadas'
      ]

  //  critical_impact : 'O trabalho dos analistas educacionais ocorre em v�cuo legal, fundamentando-se em interpreta��es customizadas de normativas gen�ricas em vez de atribui��es formalmente designadas.'

  //  urgency_level : 'CR�TICA'

      // primary_recommendation : 'Revis�o abrangente em cascata (federal ? distrital ? regional) � essencial para coer�ncia e seguran�a jur�dica operacional.'
    };
  },

  /**
   * Analisa framework legal aplic�vel
   */
  analyzeLegalFramework: function() {
    return {
      federal_legislation : {
        'LEI_11947_2009' : {
          status : 'APLIC�VEL_COM_LACUNAS',
          strengths : ['Designa SEEDF como EEx', 'Define prazo de guarda (5 anos)'],
          gaps : ['N�o especifica mecanismos detalhados de confer�ncia', 'N�o clarifica responsabilidades regionais'],
          impact : 'ALTO'
        },

        'LEI_14133_2021' : {
          status : 'CONFLITO_OPERACIONAL',
          strengths : ['Define fiscal de contrato', 'Exige registro pr�prio'],
          conflicts : ['Atesta��o ap�s recebimento completo vs. perec�veis imediatos'],
          impact : 'M�DIO'
        },

        'RESOLUCAO_FNDE_06_2020' : {
          status : 'VAGA_OPERACIONALIZACAO',
          strengths : ['Exige Comiss�o de Recebimento', 'Define atesta��o obrigat�ria'],
          gaps : ['Vaga na operacionaliza��o regional', 'N�o detalha procedimentos'],
          impact : 'ALTO'
        }
      },

      distrital_legislation : {
        'DECRETO_37387_2016' : {
          status : 'LACUNA_UNIAE',
          gaps : ['N�o menciona atribui��es da UNIAE'],
          recommendation : 'Decreto regulamentador necess�rio'
        },

        'PORTARIA_192_2019' : {
          status : 'INSUFICIENTE',
          gaps : ['Apenas tangencia compet�ncias da UNIAE'],
          recommendation : 'Portaria detalhada necess�ria'
        }
      },

      overall_assessment : {
        coherence_score : 35, // 0-100
        coverage_score : 45,   // 0-100
        operability_score : 25, // 0-100
        overall_score : 35,     // 0-100
        classification : 'INADEQUADO_PARA_OPERACAO'
      }
    };
  },

  /**
   * Gera matriz de responsabilidades
   */
  generateResponsibilityMatrix: function() {
    return {
      hierarchy_levels : {
        'FEDERAL' : {
          entity : 'FNDE',
          legal_basis : 'LEI_11947_2009',
          responsibilities : ['Normatiza��o PNAE', 'Diretrizes nacionais'],
          current_status : 'ADEQUADO',
          system_mapping : 'N�O_MAPEADO'
        },

        'DISTRITAL' : {
          entity : 'SEEDF (EEx)',
          legal_basis : 'LEI_11947_2009',
          responsibilities : ['Execu��o PNAE', 'Guarda documentos 5 anos'],
          current_status : 'GEN�RICO',
          gaps : ['N�o especifica atribui��es operacionais']
        },

        'REGIONAL' : {
          entity : 'CRE-PP',
          legal_basis : 'INDEFINIDO',
          responsibilities : ['Coordena��o regional'],
          current_status : 'INDEFINIDO',
          critical_gap : 'Compet�ncias n�o formalizadas'
        },

        'LOCAL' : {
          entity : 'UNIAE',
          legal_basis : 'LACUNA_LEGAL',
          responsibilities : ['Infraestrutura', 'Apoio educacional'],
          current_status : 'V�CUO_LEGAL',
          critical_impact : 'SEM BASE LEGAL CLARA'
        },

        'OPERACIONAL' : {
          entity : 'Comiss�o de Recebimento',
          legal_basis : 'RESOLUCAO_FNDE_06_2020',
          responsibilities : ['Recebimento', 'Atesta��o'],
          current_status : 'VAGO',
          gaps : ['Operacionaliza��o n�o detalhada']
        },

        'INDIVIDUAL' : {
          entity : 'Analistas Educacionais',
          legal_basis : 'V�CUO_LEGAL',
          responsibilities : ['Confer�ncia', 'An�lise'],
          current_status : 'CR�TICO',
          critical_problem : 'Trabalham sem designa��o formal'
        }
      },

      responsibility_gaps : {
        total_levels : 6,
        levels_with_clear_basis : 2,
        levels_with_gaps : 4,
        critical_gaps : 2,
        compliance_percentage : 33.33
      }
    };
  },

  /**
   * Identifica lacunas cr�ticas
   */
  identifyCriticalGaps: function() {
    return {
      primary_gaps : [
        {
          id : 'GAP_001',
          title : 'V�cuo Legal dos Analistas Educacionais',
          description : 'Analistas educacionais trabalham em v�cuo legal, fundamentando-se em interpreta��es customizadas',
          legal_basis_missing : 'Designa��o formal em instrumento legal',
          impact : 'CR�TICO',
          affected_operations : ['Confer�ncia de NF', 'Valida��o de empenhos', 'Registro de ocorr�ncias'],
          urgency : 'IMEDIATA'
        },

        {
          id : 'GAP_002',
          title : 'Atribui��es da UNIAE N�o Formalizadas',
          description : 'UNIAE sem base legal clara para confer�ncia de notas fiscais',
          legal_basis_missing : 'Decreto regulamentador das atribui��es',
          impact : 'ALTO',
          affected_operations : ['Apoio � Comiss�o', 'Infraestrutura de recebimento'],
          urgency : 'ALTA'
        },

        {
          id : 'GAP_003',
          title : 'Procedimentos de Confer�ncia Vagos',
          description : 'Resolu��o FNDE vaga na operacionaliza��o regional',
          legal_basis_missing : 'Manual de procedimentos com base legal',
          impact : 'ALTO',
          affected_operations : ['Processo de confer�ncia', 'Atesta��o'],
          urgency : 'ALTA'
        },

        {
          id : 'GAP_004',
          title : 'Conflito Normativo Lei 14.133 vs. Perec�veis',
          description : 'Lei exige recebimento completo antes de atesta��o, conflitando com perec�veis',
          legal_basis_missing : 'Protocolo espec�fico para g�neros perec�veis',
          impact : 'M�DIO',
          affected_operations : ['Atesta��o de perec�veis'],
          urgency : 'M�DIA'
        }
      ],

      gap_analysis : {
        total_gaps : 4,
        critical_gaps : 1,
        high_priority_gaps : 2,
        medium_priority_gaps : 1,
        estimated_resolution_time : '90 dias',
        legal_risk_level : 'ALTO'
      }
    };
  },

  /**
   * Identifica viola��es de conformidade
   */
  identifyComplianceViolations: function() {
    return {
      current_violations : [
        {
          id : 'VIO_001',
          type : 'RESPONS�VEL_N�O_DESIGNADO',
          description : 'Fiscal de contrato n�o designado conforme Lei 14.133/2021 Art. 117',
          legal_basis : 'LEI_14133_2021_ART_117',
          severity : 'CR�TICA',
          current_status : 'ATIVO',
          corrective_action : 'Designar fiscal de contrato formalmente'
        },

        {
          id : 'VIO_002',
          type : 'COMISS�O_N�O_CONSTITU�DA',
          description : 'Comiss�o de Recebimento n�o adequadamente constitu�da',
          legal_basis : 'RESOLUCAO_FNDE_06_2020',
          severity : 'ALTA',
          current_status : 'ATIVO',
          corrective_action : 'Constituir Comiss�o conforme Resolu��o FNDE'
        },

        {
          id : 'VIO_003',
          type : 'REGISTRO_PR�PRIO_AUSENTE',
          description : 'Registro pr�prio de ocorr�ncias n�o implementado',
          legal_basis : 'LEI_14133_2021_ART_117',
          severity : 'M�DIA',
          current_status : 'PARCIAL',
          corrective_action : 'Implementar registro pr�prio completo'
        }
      ],

      violation_summary : {
        total_violations : 3,
        critical_violations : 1,
        high_severity_violations : 1,
        medium_severity_violations : 1,
        compliance_score : 25, // 0-100
        legal_risk_assessment : 'ALTO'
      }
    };
  },

  /**
   * Gera recomenda��es cr�ticas
   */
  generateCriticalRecommendations: function() {
    return {
      immediate_actions : [
        {
          priority : 'CR�TICA',
          timeline : 'IMEDIATO',
          action : 'Designar formalmente analistas educacionais',
          legal_basis : 'LEI_14133_2021_ART_117',
          responsible : 'SEEDF',
          expected_outcome : 'Eliminar v�cuo legal dos analistas'
        },

        {
          priority : 'CR�TICA',
          timeline : '15 dias',
          action : 'Designar fiscal de contrato',
          legal_basis : 'LEI_14133_2021_ART_117',
          responsible : 'SEEDF',
          expected_outcome : 'Conformidade com Lei de Licita��es'
        }
      ],

      short_term_actions : [
        {
          priority : 'ALTA',
          timeline : '30 dias',
          action : 'Constituir Comiss�o de Recebimento adequada',
          legal_basis : 'RESOLUCAO_FNDE_06_2020',
          responsible : 'CRE-PP',
          expected_outcome : 'Atesta��o conforme Resolu��o FNDE'
        },

        {
          priority : 'ALTA',
          timeline : '60 dias',
          action : 'Criar decreto regulamentador das atribui��es da UNIAE',
          legal_basis : 'LEI_11947_2009',
          responsible : 'SEEDF',
          expected_outcome : 'Formalizar base legal da UNIAE'
        }
      ],

      medium_term_actions : [
        {
          priority : 'M�DIA',
          timeline : '90 dias',
          action : 'Desenvolver manual de procedimentos com base legal',
          legal_basis : 'RESOLUCAO_FNDE_06_2020',
          responsible : 'SEEDF/CRE-PP',
          expected_outcome : 'Procedimentos padronizados e legais'
        },

        {
          priority : 'M�DIA',
          timeline : '90 dias',
          action : 'Criar protocolo espec�fico para g�neros perec�veis',
          legal_basis : 'LEI_14133_2021',
          responsible : 'SEEDF',
          expected_outcome : 'Resolver conflito normativo'
        }
      ]
    };
  },

  /**
   * Gera roadmap de implementa��o
   */
  generateImplementationRoadmap: function() {
    return {
      phases : {
        'FASE_1_EMERGENCIAL' : {
          duration : '15 dias',
          objective : 'Resolver quest�es cr�ticas imediatas',
          actions : [
            'Designar fiscal de contrato',
            'Designar formalmente analistas educacionais',
            'Implementar registro pr�prio de ocorr�ncias'
          ]
      // success_criteria : 'Elimina��o de viola��es cr�ticas'
        },

        'FASE_2_ESTRUTURAL' : {
          duration : '30-60 dias',
          objective : 'Estabelecer estruturas legais adequadas',
          actions : [
            'Constituir Comiss�o de Recebimento',
            'Criar decreto regulamentador UNIAE',
            'Formalizar matriz de responsabilidades'
          ]
      // success_criteria : 'Base legal clara para todas as entidades'
        },

        'FASE_3_OPERACIONAL' : {
          duration : '60-90 dias',
          objective : 'Implementar procedimentos padronizados',
          actions : [
            'Manual de procedimentos legal',
            'Protocolo para perec�veis',
            'Sistema de monitoramento de conformidade'
          ]
      // success_criteria : 'Opera��o totalmente conforme'
        },

        'FASE_4_CONSOLIDACAO' : {
          duration : '90+ dias',
          objective : 'Consolidar e monitorar conformidade',
          actions : [
            'Treinamento em conformidade legal',
            'Auditoria de conformidade',
            'Melhoria cont�nua'
          ]
      // success_criteria : 'Conformidade sustent�vel'
        }
      },

      success_metrics : {
        compliance_score_target : 95, // %
      // legal_violations_target : 0,
        gap_resolution_target : 100 // %
      // timeline_target : '90 dias'
      }
    };
}
}

/**
 * FUN��ES DE INTERFACE PARA RELAT�RIOS
 */

/**
 * Gera e exibe relat�rio de conformidade legal
 */
function generateLegalComplianceReport() {
  try {
    var ui = getSafeUi();

    try {
      ui.alert('Gerando Relat�rio de Conformidade Legal',
        'Iniciando an�lise abrangente da conformidade legal/* spread */\n\n' +
        'Este relat�rio incluir� : \n' +
        '� An�lise do framework legal\n' +
        '� Identifica��o de lacunas cr�ticas\n' +
        '� Matriz de responsabilidades\n' +
        '� Viola��es de conformidade\n' +
        '� Recomenda��es cr�ticas\n' +
        '� Roadmap de implementa��o',
        ui.ButtonSet.OK
      );

      var report = LEGAL_REPORTS.generateComprehensiveComplianceReport();

      // Salvar relat�rio
      var savedReport = saveLegalReportToDrive(report);

      // Exibir resumo
      var summary = report.executive_summary;
      var gaps = report.critical_gaps;

      var message = 'RELAT�RIO DE CONFORMIDADE LEGAL GERADO\n\n';
      message += '?? RESUMO EXECUTIVO : \n';
      message += '� N�vel de Urg�ncia : ' + summary.urgency_level + '\n';
      message += '� Lacunas Cr�ticas : ' + gaps.gap_analysis.critical_gaps + '\n';
      message += '� Lacunas Alta Prioridade : ' + gaps.gap_analysis.high_priority_gaps + '\n';
      message += '� Risco Legal : ' + gaps.gap_analysis.legal_risk_level + '\n\n';

      message += '?? PRINCIPAIS ACHADOS : \n';
      summary.key_findings.slice(0, 3).forEach(function(finding) {
        message += '� ' + finding + '\n';
      });

      message += '\n?? RELAT�RIO SALVO : \n';
      message += '� Nome : ' + savedReport.name + '\n';
      message += '� Local : Google Drive\n';
      message += '� URL : ' + savedReport.url;

      safeAlert('Relat�rio Gerado', message, ui.ButtonSet.OK);


    } catch (error) {
      safeAlert('Erro', 'Erro ao gerar relat�rio : ' + error.message, ui.ButtonSet.OK);
      Logger.log('Erro generateLegalComplianceReport : ' + error.message);
    }
  } catch (error) {
    Logger.log("Erro em generateLegalComplianceReport: " + error.message);
    throw error;
  }
  }


/**
 * Salva relat�rio legal no Google Drive
 */
function saveLegalReportToDrive(report) {
  try {
    try {
      // Gerar nome do arquivo
      var timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd_HHmm');
      var fileName = 'UNIAE_Relatorio_Conformidade_Legal_' + timestamp;

      // Converter relat�rio para formato leg�vel
      var content = formatLegalReportContent(report);

      // Criar documento
      var doc = DocumentApp.create(fileName);
      var body = doc.getBody();
      body.clear();

      // Adicionar conte�do
      addLegalReportContent(body, content);

      // Obter pasta de relat�rios
      var folder = getOrCreateReportsFolder();

      // Mover arquivo
      var file = DriveApp.getFileById(doc.getId());
      folder.addFile(file);
      DriveApp.getRootFolder().removeFile(file);

      return {
        name : fileName,
        docId : doc.getId(),
        url : doc.getUrl(),
        folderId : folder.getId()
      };

    } catch (error) {
      Logger.log('Erro ao salvar relat�rio legal : ' + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em saveLegalReportToDrive: " + error.message);
    throw error; // Re-lança para tratamento superior
  }
  }


/**
 * Formata conte�do do relat�rio legal
 */
function formatLegalReportContent(report) {
  try {
    var content = '';

    // Cabe�alho
    content += report.metadata.title + '\n';
    content += report.metadata.subtitle + '\n';
    content += 'Gerado em : ' + report.metadata.generated_at.toLocaleDateString('pt-BR') + '\n';
    content += 'Vers�o : ' + report.metadata.version + '\n\n';

    // Resumo Executivo
    content += 'RESUMO EXECUTIVO\n\n';
    content += report.executive_summary.overview + '\n\n';
    content += 'PRINCIPAIS ACHADOS : \n';
    report.executive_summary.key_findings.forEach(function(finding) {
      content += '� ' + finding + '\n';
    });
    content += '\n';

    // Lacunas Cr�ticas
    content += 'LACUNAS CR�TICAS IDENTIFICADAS\n\n';
    report.critical_gaps.primary_gaps.forEach(function(gap) {
      content += gap.id + ' - ' + gap.title + '\n';
      content += 'Descri��o : ' + gap.description + '\n';
      content += 'Impacto : ' + gap.impact + '\n';
      content += 'Urg�ncia : ' + gap.urgency + '\n\n';
    });

    // Recomenda��es
    content += 'RECOMENDA��ES CR�TICAS\n\n';
    content += 'A��ES IMEDIATAS : \n';
    report.recommendations.immediate_actions.forEach(function(action) {
      content += '� ' + action.action + ' (' + action.timeline + ')\n';
    });
    content += '\n';

  } catch (error) {
    Logger.log("Erro em formatLegalReportContent: " + error.message);
    throw error;
  }
}

/**
 * Adiciona conte�do formatado ao documento
 */
function addLegalReportContent(body, content) {
  try {
    var lines = content.split('\n');

    lines.forEach(function(line) {
      if (line.trim() == '') {
        body.appendParagraph('');
      } else if (line == line.toUpperCase() && line.length > 10) {
        // T�tulo
        var title = body.appendParagraph(line);
        title.setHeading(DocumentApp.ParagraphHeading.HEADING1);
      } else {
        body.appendParagraph(line);
      }
    });
  } catch (error) {
    Logger.log("Erro em addLegalReportContent: " + error.message);
    throw error;
  }
}

/**
 * Interface para menu - Relat�rio de Lacunas Legais
 */
function relatorioLacunasLegaisDetalhado() {
  try {
    generateLegalComplianceReport();
  } catch (error) {
    var ui = getSafeUi();
    ui.alert('Erro', 'Erro ao gerar relat�rio detalhado : ' + error.message, ui.ButtonSet.OK);
    return {
      chaveAcesso : chaveAcesso,
      situacao : "ERRO",
      valida : false
    };
  }
}

// ---- ConformidadeAuditoria.gs ----
/**
 * ConformidadeAuditoria.gs
 * Sistema de Verifica��o de Conformidade e Auditoria
 * Opera sobre NotasFiscais.xlsx sem criar abas externas
 * Registra resultados em aba fixa Auditoria_Log
 * Sistema UNIAE CRE PP/Cruzeiro - Portaria 244/2006
 */

/**
 * ==
 * ESTRUTURA DA ABA AUDITORIA_LOG
 * ==
 */

var AUDITORIA_HEADERS = [
  'ID_Auditoria',           // Identificador �nico
  'Data_Auditoria',         // Data/hora da verifica��o
  'Tipo_Verificacao',       // Tipo de verifica��o realizada
  'NF_Numero',              // N�mero da NF verificada
  'Fornecedor_Nome',        // Nome do fornecedor
  'Resultado',              // Conforme|NaoConforme|Alerta|Critico
  'Score',                  // Pontua��o (0-100)
  'Detalhes',               // Detalhes do resultado
  'Observacoes',            // Observa��es adicionais
  'Usuario',                // Usu�rio que executou
  'Acao_Recomendada',       // A��o recomendada
  'Status_Resolucao',        // Pendente|EmAnalise|Resolvido
];

/**
 * ==
 * TIPOS DE VERIFICA��O
 * ==
 */

var TIPOS_VERIFICACAO = {
  MATEMATICA : 'Verificacao_Matematica',
  PDGP : 'Verificacao_PDGP',
  NFE_SEFAZ : 'Consulta_NFe_SEFAZ',
  PRAZO_ATESTO : 'Verificacao_Prazo_Atesto',
  INTEGRIDADE_DADOS : 'Integridade_Dados',
  DUPLICIDADE : 'Verificacao_Duplicidade',
  FORNECEDOR : 'Validacao_Fornecedor',
  VALORES : 'Validacao_Valores',
  DOCUMENTACAO : 'Verificacao_Documentacao',
  CONFORMIDADE_GERAL : 'Conformidade_Geral'
};

/**
 * ==
 * FUN��O PRINCIPAL DE AUDITORIA
 * ==
 */

/**
 * Executa auditoria completa do sistema
 * @param { Object: Object } options - Op��es : { tipos: tipos, maxRecords, autoFix}
 * @returns { Object: Object } Resultado da auditoria
 */
function executarAuditoriaCompleta(options) {
  try {
    try {
      options = options || {};
      var tipos = options.tipos || Object.values(TIPOS_VERIFICACAO);
      var maxRecords = options.maxRecords || 1000;
      var autoFix = options.autoFix || false;

      try {
        var resultados = {
          timestamp : new Date(),
          tipos : tipos,
          verificacoes : [],
          resumo : {
            total : 0,
            conforme : 0,
            naoConforme : 0,
            alertas : 0,
            criticos : 0
          }
        };

        // Executar cada tipo de verifica��o
        tipos.forEach(function(tipo) {
          var resultado = executarVerificacao(tipo, {maxRecords : maxRecords, autoFix, autoFix});
          resultados.verificacoes.push(resultado);

          // Atualizar resumo
          resultados.resumo.total += resultado.total;
          resultados.resumo.conforme += resultado.conforme;
          resultados.resumo.naoConforme += resultado.naoConforme;
          resultados.resumo.alertas += resultado.alertas;
          resultados.resumo.criticos += resultado.criticos;
        });

        // Calcular score geral
        resultados.resumo.score = calcularScoreGeral(resultados.resumo);

        // Registrar auditoria completa
        registrarAuditoria({
          tipo : 'AUDITORIA_COMPLETA',
          resultado : resultados.resumo.score >= 80 ? 'Conforme' : 'NaoConforme',
          score : resultados.resumo.score,
          detalhes : JSON.stringify(resultados.resumo),
          observacoes : tipos.length + ' verifica��es executadas'
        });


      } catch (error) {
        Logger.log('Erro executarAuditoriaCompleta : ' + error.message);
        throw error;
      }
    } catch (error) {
      Logger.log("Erro em executarAuditoriaCompleta: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em executarAuditoriaCompleta: " + error.message);
    throw error;
  }
  }


/**
 * Executa uma verifica��o espec�fica
 */
function executarVerificacao(tipo, options) {
  switch (tipo) {
    case TIPOS_VERIFICACAO.MATEMATICA :
      return verificarCalculosMatematicos(options);
    case TIPOS_VERIFICACAO.PDGP :
      return verificarConformidadePDGP(options);
    case TIPOS_VERIFICACAO.NFE_SEFAZ :
      return verificarNFesSEFAZ(options);
    case TIPOS_VERIFICACAO.PRAZO_ATESTO :
      return verificarPrazosAtesto(options);
    case TIPOS_VERIFICACAO.INTEGRIDADE_DADOS :
      return verificarIntegridadeDados(options);
    case TIPOS_VERIFICACAO.DUPLICIDADE :
      return verificarDuplicidades(options);
    case TIPOS_VERIFICACAO.FORNECEDOR :
      return verificarFornecedores(options);
    case TIPOS_VERIFICACAO.VALORES :
      return verificarValores(options);
    case TIPOS_VERIFICACAO.DOCUMENTACAO :
      return verificarDocumentacao(options);
    case TIPOS_VERIFICACAO.CONFORMIDADE_GERAL :
      return verificarConformidadeGeral(options);
    default :
      throw new Error('Tipo de verifica��o desconhecido : ' + tipo);
  }
}

/**
 * ==
 * VERIFICA��ES ESPEC�FICAS
 * ==
 */

/**
 * 1. Verifica��o Matem�tica (soma de valores)
 */
function verificarCalculosMatematicos(options) {
  try {
    var nfData = readSheetData('Notas_Fiscais', options);
    var resultado = {
      tipo : TIPOS_VERIFICACAO.MATEMATICA,
      total : 0,
      conforme : 0,
      naoConforme : 0,
      alertas : 0,
      criticos : 0,
      detalhes : []
    };

    nfData.data.forEach(function(row, index) {
      var nfNumero = row[1];
      var valorTotal = safeNumber(row[8]);
      var fornecedor = row[6];

      if (isNaN(valorTotal) || valorTotal <= 0) {
        resultado.naoConforme++
        resultado.criticos++

        registrarAuditoria({
          tipo : TIPOS_VERIFICACAO.MATEMATICA,
          referencia : fornecedor,
          resultado : 'Critico',
          score : 0,
          detalhes : 'Valor total inv�lido : ' + row[8],
          observacoes : 'Linha ' + (index + 2),
          acaoRecomendada : 'Corrigir valor da NF'
        });
      } else {
        resultado.conforme++
      }

      resultado.total++
    });

  } catch (error) {
    Logger.log("Erro em verificarCalculosMatematicos: " + error.message);
    throw error;
  }
}

/**
 * 2. Verifica��o de Conformidade com PDGP
 */
function verificarConformidadePDGP(options) {
  try {
    var nfData = readSheetData('Notas_Fiscais', options);
    var pdgpData = readSheetData('PDGP', options);

    var resultado = {
      tipo : TIPOS_VERIFICACAO.PDGP,
      total : 0,
      conforme : 0,
      naoConforme : 0,
      alertas : 0,
      criticos : 0
    };

    // Criar mapa de fornecedores planejados
    var fornecedoresPrevistos = {};
    pdgpData.data.forEach(function(row) {
      var fornecedor = row[9]; // Fornecedor_Previsto;
      if (fornecedor) {
        fornecedoresPrevistos[fornecedor] = true;
      }
    });

    nfData.data.forEach(function(row, index) {
      var nfNumero = row[1];
      var fornecedor = row[6];

      if (fornecedoresPrevistos[fornecedor]) {
        resultado.conforme++
      } else {
        resultado.alertas++

        registrarAuditoria({
          tipo : TIPOS_VERIFICACAO.PDGP,
          referencia : fornecedor,
          resultado : 'Alerta',
          score : 50,
          detalhes : 'Fornecedor n�o previsto no PDGP',
          observacoes : 'Verificar se h� justificativa',
          acaoRecomendada : 'Validar com planejamento'
        });
      }

      resultado.total++
    });

  } catch (error) {
    Logger.log("Erro em verificarConformidadePDGP: " + error.message);
    throw error;
  }
}

/**
 * 3. Verifica��o de NF-e na SEFAZ
 */
function verificarNFesSEFAZ(options) {
  try {
    var nfData = readSheetData('Notas_Fiscais', options);
    var resultado = {
      tipo : TIPOS_VERIFICACAO.NFE_SEFAZ,
      total : 0,
      conforme : 0,
      naoConforme : 0,
      alertas : 0,
      criticos : 0
    };

    nfData.data.forEach(function(row, index) {
      var nfNumero = row[1];
      var chaveAcesso = String(row[2] || '').trim();
      var fornecedor = row[6];

      if (!chaveAcesso || chaveAcesso.length != 44) {
        resultado.naoConforme++
        resultado.criticos++

        registrarAuditoria({
          tipo : TIPOS_VERIFICACAO.NFE_SEFAZ,
          referencia : fornecedor,
          resultado : 'Critico',
          score : 0,
          detalhes : 'Chave de acesso inv�lida ou ausente',
          observacoes : 'Chave : ' + chaveAcesso,
          acaoRecomendada : 'Solicitar chave v�lida ao fornecedor'
        });
      } else {
        // Validar formato da chave
        if (/^\d{ 44: 44 }$/.test(chaveAcesso)) {
          resultado.conforme++
        } else {
          resultado.naoConforme++

          registrarAuditoria({
            tipo : TIPOS_VERIFICACAO.NFE_SEFAZ,
          referencia : fornecedor,
            resultado : 'NaoConforme',
            score : 30,
            detalhes : 'Formato de chave inv�lido',
            observacoes : 'Deve conter apenas n�meros',
            acaoRecomendada : 'Corrigir formato da chave'
          });
        }
      }

      resultado.total++
    });

  } catch (error) {
    Logger.log("Erro em verificarNFesSEFAZ: " + error.message);
    throw error;
  }
}

/**
 * 4. Verifica��o de Prazos de Atesto
 */
function verificarPrazosAtesto(options) {
  try {
    var nfData = readSheetData('Notas_Fiscais', options);
    var resultado = {
      tipo : TIPOS_VERIFICACAO.PRAZO_ATESTO,
      total : 0,
      conforme : 0,
      naoConforme : 0,
      alertas : 0,
      criticos : 0
    };

    var hoje = new Date();
    var PRAZO_DIAS = 5;

    nfData.data.forEach(function(row, index) {
      var nfNumero = row[1];
      var dataRecebimento = row[4];
      var status = row[9];
      var fornecedor = row[6];

      if (!dataRecebimento) {
        resultado.alertas++
        return;
      }

      var diasDesde = Math.floor((hoje - new Date(dataRecebimento)) / (1000 * 60 * 60 * 24));

      if (status != 'Atestada' && diasDesde > PRAZO_DIAS) {
        resultado.naoConforme++

        var gravidade;
        if (diasDesde > 10) {
          gravidade = 'Critico';
        } else {
          gravidade = 'Alerta';
        }
        if (diasDesde > 10) resultado.criticos++
        else resultado.alertas++

        registrarAuditoria({
          tipo : TIPOS_VERIFICACAO.PRAZO_ATESTO,
          referencia : fornecedor,
          resultado : gravidade,
          score : Math.max(0, 100 - (diasDesde * 5)),
          detalhes : 'Atesto atrasado : ' + diasDesde + ' dias',
          observacoes : 'Prazo : ' + PRAZO_DIAS + ' dias',
          acaoRecomendada : 'Atestar NF urgentemente'
        });
      } else {
        resultado.conforme++
      }

      resultado.total++
    });

  } catch (error) {
    Logger.log("Erro em verificarPrazosAtesto: " + error.message);
    throw error;
  }
}

/**
 * 5. Verifica��o de Integridade de Dados
 */
function verificarIntegridadeDados(options) {
  try {
    var nfData = readSheetData('Notas_Fiscais', options);
    var resultado = {
      tipo : TIPOS_VERIFICACAO.INTEGRIDADE_DADOS,
      total : 0,
      conforme : 0,
      naoConforme : 0,
      alertas : 0,
      criticos : 0
    };

    var camposObrigatorios = [1, 2, 3, 5, 6, 8]; // Indices dos campos obrigat�rios;

    nfData.data.forEach(function(row, index) {
      var nfNumero = row[1];
      var fornecedor = row[6];
      var camposFaltando = [];

      camposObrigatorios.forEach(function(colIndex) {
        if (!row[colIndex] || String(row[colIndex]).trim() == '') {
          camposFaltando.push(nfData.headers[colIndex]);
        }
      });

      if (camposFaltando.length > 0) {
        resultado.naoConforme++
        resultado.criticos++

        registrarAuditoria({
          tipo : TIPOS_VERIFICACAO.INTEGRIDADE_DADOS,
          referencia : fornecedor,
          resultado : 'Critico',
          score : 0,
          detalhes : 'Campos obrigat�rios faltando : ' + camposFaltando.join(', '),
          observacoes : 'Linha ' + (index + 2),
          acaoRecomendada : 'Preencher campos obrigat�rios'
        });
      } else {
        resultado.conforme++
      }

      resultado.total++
    });

  } catch (error) {
    Logger.log("Erro em verificarIntegridadeDados: " + error.message);
    throw error;
  }
}

/**
 * 6. Verifica��o de Duplicidades
 */
function verificarDuplicidades(options) {
  try {
    var nfData = readSheetData('Notas_Fiscais', options);
    var resultado = {
      tipo : TIPOS_VERIFICACAO.DUPLICIDADE,
      total : 0,
      conforme : 0,
      naoConforme : 0,
      alertas : 0,
      criticos : 0
    };

    var chavesVistas = {};
    var numerosVistos = {};

    nfData.data.forEach(function(row, index) {
      var nfNumero = row[1];
      var chaveAcesso = row[2];
      var fornecedor = row[6];

      // Verificar duplicidade de chave
      if (chaveAcesso) {
        if (chavesVistas[chaveAcesso]) {
          resultado.naoConforme++
          resultado.criticos++

          registrarAuditoria({
            tipo : TIPOS_VERIFICACAO.DUPLICIDADE,
          referencia : fornecedor,
            resultado : 'Critico',
            score : 0,
            detalhes : 'Chave de acesso duplicada',
            observacoes : 'J� existe na linha ' + chavesVistas[chaveAcesso],
            acaoRecomendada : 'Remover duplicata'
          });
        } else {
          chavesVistas[chaveAcesso] = index + 2;
        }
      }

      // Verificar duplicidade de n�mero
      if (nfNumero) {
        var chave = fornecedor + '|' + nfNumero;
        if (numerosVistos[chave]) {
          resultado.alertas++

          registrarAuditoria({
            tipo : TIPOS_VERIFICACAO.DUPLICIDADE,
          referencia : fornecedor,
            resultado : 'Alerta',
            score : 50,
            detalhes : 'N�mero de NF duplicado para mesmo fornecedor',
            observacoes : 'J� existe na linha ' + numerosVistos[chave],
            acaoRecomendada : 'Verificar se s�o NFs diferentes'
          });
        } else {
          numerosVistos[chave] = index + 2;
          resultado.conforme++
        }
      }

      resultado.total++
    });

  } catch (error) {
    Logger.log("Erro em verificarDuplicidades: " + error.message);
    throw error;
  }
}

/**
 * 7. Verifica��o de Fornecedores
 */
function verificarFornecedores(options) {
  try {
    var nfData = readSheetData('Notas_Fiscais', options);
    var fornData = readSheetData('Ref_Fornecedores', options);

    var resultado = {
      tipo : TIPOS_VERIFICACAO.FORNECEDOR,
      total : 0,
      conforme : 0,
      naoConforme : 0,
      alertas : 0,
      criticos : 0
    };

    // Criar mapa de fornecedores cadastrados
    var fornecedoresCadastrados = {};
    fornData.data.forEach(function(row) {
      var cnpj = String(row[1] || '').replace(/\D/g, '');
      if (cnpj) {
        fornecedoresCadastrados[cnpj] = {
          nome : row[2],
          status : row[10]
        };
      }
    });

    nfData.data.forEach(function(row, index) {
      var nfNumero = row[1];
      var cnpj = String(row[5] || '').replace(/\D/g, '');
      var fornecedor = row[6];

      if (!cnpj) {
        resultado.naoConforme++
        resultado.criticos++

        registrarAuditoria({
          tipo : TIPOS_VERIFICACAO.FORNECEDOR,
          referencia : fornecedor,
          resultado : 'Critico',
          score : 0,
          detalhes : 'CNPJ do fornecedor ausente',
          observacoes : 'Linha ' + (index + 2),
          acaoRecomendada : 'Preencher CNPJ do fornecedor'
        });
      } else if (!fornecedoresCadastrados[cnpj]) {
        resultado.alertas++

        registrarAuditoria({
          tipo : TIPOS_VERIFICACAO.FORNECEDOR,
          referencia : fornecedor,
          resultado : 'Alerta',
          score : 60,
          detalhes : 'Fornecedor n�o cadastrado',
          observacoes : 'CNPJ : ' + cnpj,
          acaoRecomendada : 'Cadastrar fornecedor em Ref_Fornecedores'
        });
      } else if (fornecedoresCadastrados[cnpj].status != 'Ativo') {
        resultado.alertas++

        registrarAuditoria({
          tipo : TIPOS_VERIFICACAO.FORNECEDOR,
          referencia : fornecedor,
          resultado : 'Alerta',
          score : 70,
          detalhes : 'Fornecedor com status : ' + fornecedoresCadastrados[cnpj].status,
          observacoes : 'Verificar situa��o cadastral',
          acaoRecomendada : 'Validar status do fornecedor'
        });
      } else {
        resultado.conforme++
      }

      resultado.total++
    });

  } catch (error) {
    Logger.log("Erro em verificarFornecedores: " + error.message);
    throw error;
  }
}

/**
 * 8. Verifica��o de Valores
 */
function verificarValores(options) {
  try {
    var nfData = readSheetData('Notas_Fiscais', options);
    var glosasData = readSheetData('Glosas', options);

    var resultado = {
      tipo : TIPOS_VERIFICACAO.VALORES,
      total : 0,
      conforme : 0,
      naoConforme : 0,
      alertas : 0,
      criticos : 0
    };

    // Criar mapa de glosas por NF
    var glosasPorNF = {};
    glosasData.data.forEach(function(row) {
      var nfNumero = row[2];
      var valorGlosa = safeNumber(row[7]);
      if (nfNumero && !isNaN(valorGlosa)) {
        glosasPorNF[nfNumero] = (glosasPorNF[nfNumero] || 0) + valorGlosa;
      }
    });

    nfData.data.forEach(function(row, index) {
      var nfNumero = row[1];
      var valorTotal = safeNumber(row[8]);
      var fornecedor = row[6];
      var valorGlosado = glosasPorNF[nfNumero] || 0;

      // Verificar se valor � razo�vel
      if (valorTotal > 1000000) {
        resultado.alertas++

        registrarAuditoria({
          tipo : TIPOS_VERIFICACAO.VALORES,
          referencia : fornecedor,
          resultado : 'Alerta',
          score : 80,
          detalhes : 'Valor muito alto, R$ ' + valorTotal.toFixed(2),
          observacoes : 'Verificar se valor est� correto',
          acaoRecomendada : 'Validar valor com fornecedor'
        });
      }

      // Verificar se glosa excede valor total
      if (valorGlosado > valorTotal) {
        resultado.naoConforme++
        resultado.criticos++

        registrarAuditoria({
          tipo : TIPOS_VERIFICACAO.VALORES,
          referencia : fornecedor,
          resultado : 'Critico',
          score : 0,
          detalhes : 'Glosa excede valor total da NF',
          observacoes : 'Glosa, R$ ' + valorGlosado.toFixed(2) + ' | Total : R$ ' + valorTotal.toFixed(2),
          acaoRecomendada : 'Revisar valores de glosa'
        });
      } else {
        resultado.conforme++
      }

      resultado.total++
    });

  } catch (error) {
    Logger.log("Erro em verificarValores: " + error.message);
    throw error;
  }
}

/**
 * 9. Verifica��o de Documenta��o
 */
function verificarDocumentacao(options) {
  try {
    var nfData = readSheetData('Notas_Fiscais', options);
    var resultado = {
      tipo : TIPOS_VERIFICACAO.DOCUMENTACAO,
      total : 0,
      conforme : 0,
      naoConforme : 0,
      alertas : 0,
      criticos : 0
    };

    nfData.data.forEach(function(row, index) {
      var nfNumero = row[1];
      var fornecedor = row[6];
      var arquivoPDF = row[13];
      var notaEmpenho = row[7];

      var problemas = [];

      if (!arquivoPDF || String(arquivoPDF).trim() == '') {
        problemas.push('PDF da NF ausente');
      }

      if (!notaEmpenho || String(notaEmpenho).trim() == '') {
        problemas.push('Nota de Empenho ausente');
      }

      if (problemas.length > 0) {
        resultado.naoConforme++
        resultado.alertas++

        registrarAuditoria({
          tipo : TIPOS_VERIFICACAO.DOCUMENTACAO,
          referencia : fornecedor,
          resultado : 'Alerta',
          score : 50,
          detalhes : problemas.join('; '),
          observacoes : 'Documenta��o incompleta',
          acaoRecomendada : 'Solicitar documentos faltantes'
        });
      } else {
        resultado.conforme++
      }

      resultado.total++
    });

  } catch (error) {
    Logger.log("Erro em verificarDocumentacao: " + error.message);
    throw error;
  }
}

/**
 * 10. Verifica��o de Conformidade Geral
 */
function verificarConformidadeGeral(options) {
  try {
    var resultado = {
      tipo : TIPOS_VERIFICACAO.CONFORMIDADE_GERAL,
      total : 0,
      conforme : 0,
      naoConforme : 0,
      alertas : 0,
      criticos : 0
    };

    // Executar verifica��es b�sicas
    var verificacoes = [
      verificarCalculosMatematicos(options),
      verificarPrazosAtesto(options),
      verificarIntegridadeDados(options)
    ];

    verificacoes.forEach(function(v) {
      resultado.total += v.total;
      resultado.conforme += v.conforme;
      resultado.naoConforme += v.naoConforme;
      resultado.alertas += v.alertas;
      resultado.criticos += v.criticos;
    });

    var score = calcularScoreGeral(resultado);

    registrarAuditoria({
      tipo : TIPOS_VERIFICACAO.CONFORMIDADE_GERAL,
      resultado : score >= 80 ? 'Conforme' : 'NaoConforme',
      score : score,
      detalhes : 'Score geral : ' + score + '/100',
      observacoes : resultado.total + ' registros verificados',
      acaoRecomendada : score < 80 ? 'Corrigir n�o conformidades' : 'Manter padr�o'
    });

  } catch (error) {
    Logger.log("Erro em verificarConformidadeGeral: " + error.message);
    throw error;
  }
}

/**
 * ==
 * FUN��ES DE REGISTRO
 * ==
 */

/**
 * Registra resultado de auditoria na aba Auditoria_Log
 */
function registrarAuditoria(dados) {
  try {
    try {
      var rowData = [
        'AUD_' + new Date().getTime(),
        new Date(),
        dados.tipo || '',
        dados.nfNumero || '',
        dados.fornecedor || '',
        dados.resultado || '',
        dados.score || 0,
        dados.detalhes || '',
        dados.observacoes || '',
        Session.getActiveUser().getEmail(),
        dados.acaoRecomendada || '',
        dados.statusResolucao || 'Pendente'
      ];

      writeSheetRow('Auditoria_Log', rowData, {validate : false});

    } catch (error) {
      Logger.log('Erro registrarAuditoria : ' + error.message);
      return {
        chaveAcesso : chaveAcesso,
        situacao : "ERRO",
        valida : false
      };
    }
  } catch (error) {
    Logger.log("Erro em registrarAuditoria: " + error.message);
    throw error;
  }
}

/**
 * Calcula score geral baseado nos resultados
 */
function calcularScoreGeral(resumo) {
  if (resumo.total == 0) return 100;

  var peso = {
    conforme : 100,
    alerta : 50,
    naoConforme : 0,
    critico : -50
  };

  var pontos = (resumo.conforme * peso.conforme) +
                (resumo.alertas * peso.alerta) +
                (resumo.naoConforme * peso.naoConforme) +
                (resumo.criticos * peso.critico);

  var maxPontos = resumo.total * peso.conforme;
  var score = Math.max(0, Math.min(100, (pontos / maxPontos) * 100));

}

