/**
 * @fileoverview Core_Validator_Compliance.gs
 * Módulo de validação de conformidade legal.
 * @version 1.0.0
 */

'use strict';

var ComplianceValidator = (function() {

  /**
   * VALIDADOR PRINCIPAL DE CONFORMIDADE
   */

  /**
   * Calcula score de conformidade
   */
  function calculateComplianceScore(validation) {
    var score = 100;

    // Penalidades por violações
    score -= validation.violations.length * 20;

    // Penalidades menores por warnings
    score -= validation.warnings.length * 5;

    // Não penalizar por recomendações (são melhorias)

    return Math.max(0, score);
  }

  /**
   * Valida formato de nota de empenho
   */
  function validateEmpenhoFormat(nota_empenho) {
    // Formatos típicos : AAAA/NNNNN ou NNNNNNNN
    var formato1 = /^\d{4}\/\d{4,6}$/; // 2024/001234;
    var formato2 = /^\d{6,10}$/;       // 20240001234;

    return formato1.test(nota_empenho) || formato2.test(nota_empenho);
  }

  /**
   * Valida registro de nota fiscal
   */
  function validateNotaFiscalRegistration(data) {
    try {
      var validation = {
        isCompliant: true,
        violations: [],
        warnings: [],
        recommendations: [],
        legalBasis: ['LEI_11947_2009', 'RESOLUCAO_FNDE_06_2020'],
        score: 100
      };

      // Validação 1 : Responsável pela conferência
      if (!data.responsavel_conferencia) {
        validation.isCompliant = false;
        validation.violations.push({
          codigo: 'RESP_001',
          descricao: 'Responsável pela conferência não designado',
          base_legal: 'Lei 14.133/2021 Art. 117',
          acao_corretiva: 'Designar fiscal de contrato responsável'
        });
      }

      // Validação 2 : Comissão de Recebimento
      if (!data.comissao_designada) {
        validation.isCompliant = false;
        validation.violations.push({
          codigo: 'COM_001',
          descricao: 'Comissão de Recebimento não designada',
          base_legal: 'Resolução FNDE 06/2020',
          acao_corretiva: 'Constituir Comissão de Recebimento de Gêneros Alimentícios'
        });
      }

      // Validação 3 : Documentação obrigatória
      var documentos_obrigatorios = ['numero_nf', 'chave_acesso', 'nota_empenho'];
      documentos_obrigatorios.forEach(function(doc) {
        if (!data[doc]) {
          validation.violations.push({
            codigo: 'DOC_001',
            descricao: 'Documento obrigatório ausente : ' + doc,
            base_legal: 'Resolução FNDE 06/2020',
            acao_corretiva: 'Solicitar documento ao fornecedor'
          });
        }
      });

      // Validação 4 : Prazo para perecíveis
      if (data.tipo_produto == 'PERECIVEL') {
        var horas_desde_recebimento = data.horas_desde_recebimento || 0;
        if (horas_desde_recebimento > 24) {
          validation.warnings.push({
            codigo: 'PRAZO_001',
            descricao: 'Produto perecível não conferido em 24h',
            recomendacao: 'Conferir produtos perecíveis imediatamente'
          });
        }
      }

      // Calcular score
      validation.score = calculateComplianceScore(validation);

      return validation;
    } catch (error) {
      Logger.log("Erro em validateNotaFiscalRegistration: " + error.message);
      throw error;
    }
  }

  /**
   * Valida processo de conferência
   */
  function validateConferenciaProcesso(data) {
    try {
      var validation = {
        isCompliant: true,
        violations: [],
        warnings: [],
        recommendations: [],
        legalBasis: ['RESOLUCAO_FNDE_06_2020', 'LEI_14133_2021', 'PORTARIA_244_2006'],
        score: 100
      };

      // Validação das etapas obrigatórias
      var etapas_obrigatorias = ['SOMA', 'PDGP', 'CONSULTA_NF', 'ATESTO'];

      etapas_obrigatorias.forEach(function(etapa) {
        var status_etapa = data['status_' + etapa.toLowerCase()];
        var responsavel_etapa = data['responsavel_' + etapa.toLowerCase()];

        if (!status_etapa || status_etapa == 'PENDENTE') {
          validation.warnings.push({
            codigo: 'ETAPA_001',
            descricao: 'Etapa ' + etapa + ' pendente',
            recomendacao: 'Concluir etapa conforme fluxo estabelecido'
          });
        }

        if (status_etapa == 'CONCLUIDO' && !responsavel_etapa) {
          validation.violations.push({
            codigo: 'RESP_002',
            descricao: 'Etapa ' + etapa + ' sem responsável identificado',
            base_legal: 'Lei 14.133/2021 Art. 117',
            acao_corretiva: 'Identificar responsável pela etapa'
          });
        }
      });

      // Validação de prazos
      var dias_em_conferencia = data.dias_em_conferencia || 0;
      if (dias_em_conferencia > 5) {
        validation.warnings.push({
          codigo: 'PRAZO_002',
          descricao: 'Processo de conferência excede 5 dias úteis',
          recomendacao: 'Acelerar processo de conferência'
        });
      }

      // Validação de ocorrências
      if (data.tem_cancelamento == 'SIM' || data.tem_devolucao == 'SIM') {
        if (!data.detalhes_ocorrencias) {
          validation.violations.push({
            codigo: 'OCO_001',
            descricao: 'Ocorrências registradas sem detalhamento',
            base_legal: 'Lei 14.133/2021 Art. 117',
            acao_corretiva: 'Detalhar ocorrências no registro próprio'
          });
        }
      }

      validation.score = calculateComplianceScore(validation);
      return validation;
    } catch (error) {
      Logger.log("Erro em validateConferenciaProcesso: " + error.message);
      throw error;
    }
  }

  /**
   * Valida atestação por comissão
   */
  function validateAtestacaoComissao(data) {
    try {
      var validation = {
        isCompliant: true,
        violations: [],
        warnings: [],
        recommendations: [],
        legalBasis: ['RESOLUCAO_FNDE_06_2020', 'LEI_14133_2021'],
        score: 100
      };

      // Validação 1 : Composição da comissão
      if (!data.membros_comissao || data.membros_comissao.length < 3) {
        validation.violations.push({
          codigo: 'COM_002',
          descricao: 'Comissão deve ter no mínimo 3 membros',
          base_legal: 'Resolução FNDE 06/2020',
          acao_corretiva: 'Constituir comissão com número adequado de membros'
        });
      }

      // Validação 2 : Recebimento completo vs. perecíveis
      if (data.tipo_produto != 'PERECIVEL' && !data.recebimento_completo) {
        validation.violations.push({
          codigo: 'REC_001',
          descricao: 'Atestação antes de recebimento completo',
          base_legal: 'Lei 14.133/2021',
          acao_corretiva: 'Aguardar recebimento completo antes de atestar'
        });
      }

      // Validação 3 : Exceção para perecíveis
      if (data.tipo_produto == 'PERECIVEL' && !data.justificativa_atestacao_imediata) {
        validation.recommendations.push({
          codigo: 'REC_002',
          descricao: 'Documentar justificativa para atestação imediata de perecíveis',
          recomendacao: 'Incluir justificativa sobre natureza perecível do produto'
        });
      }

      // Validação 4 : Autenticidade da NF-e
      if (!data.nfe_verificada) {
        validation.violations.push({
          codigo: 'NFE_001',
          descricao: 'Autenticidade da NF-e não verificada',
          base_legal: 'Resolução FNDE 06/2020',
          acao_corretiva: 'Consultar autenticidade no site da SEFAZ'
        });
      }

      validation.score = calculateComplianceScore(validation);
      return validation;
    } catch (error) {
      Logger.log("Erro em validateAtestacaoComissao: " + error.message);
      throw error;
    }
  }

  /**
   * Valida validação de nota de empenho
   */
  function validateValidacaoEmpenho(data) {
    try {
      var validation = {
        isCompliant: true,
        violations: [],
        warnings: [],
        recommendations: [],
        legalBasis: ['LEI_14133_2021'],
        score: 100
      };

      // Lacuna legal identificada
      validation.warnings.push({
        codigo: 'LACUNA_001',
        descricao: 'Lei 11.947/2009 não menciona "nota de empenho" especificamente',
        recomendacao: 'Estabelecer procedimento específico para validação de empenhos'
      });

      // Validação 1 : Formato da nota de empenho
      if (data.nota_empenho && !validateEmpenhoFormat(data.nota_empenho)) {
        validation.violations.push({
          codigo: 'EMP_001',
          descricao: 'Formato da nota de empenho inválido',
          acao_corretiva: 'Verificar formato padrão da nota de empenho'
        });
      }

      // Validação 2 : Saldo disponível
      if (data.valor_nf > data.saldo_empenho) {
        validation.violations.push({
          codigo: 'EMP_002',
          descricao: 'Valor da NF excede saldo disponível no empenho',
          base_legal: 'Lei 14.133/2021',
          acao_corretiva: 'Verificar saldo disponível no empenho'
        });
      }

      // Validação 3 : Vigência do empenho
      if (data.empenho_vencido) {
        validation.violations.push({
          codigo: 'EMP_003',
          descricao: 'Nota de empenho vencida',
          base_legal: 'Lei 14.133/2021',
          acao_corretiva: 'Renovar ou reempenhar valor'
        });
      }

      validation.score = calculateComplianceScore(validation);
      return validation;
    } catch (error) {
      Logger.log("Erro em validateValidacaoEmpenho: " + error.message);
      throw error;
    }
  }

  /**
   * Valida registro de ocorrências
   */
  function validateRegistroOcorrencia(data) {
    try {
      var validation = {
        isCompliant: true,
        violations: [],
        warnings: [],
        recommendations: [],
        legalBasis: ['LEI_14133_2021_ART_117'],
        score: 100
      };

      // Validação 1 : Registro próprio obrigatório
      if (!data.registro_proprio) {
        validation.violations.push({
          codigo: 'REG_001',
          descricao: 'Ocorrência não registrada em registro próprio',
          base_legal: 'Lei 14.133/2021 Art. 117',
          acao_corretiva: 'Registrar ocorrência conforme exigência legal'
        });
      }

      // Validação 2 : Detalhamento da ocorrência
      var campos_obrigatorios = ['tipo_ocorrencia', 'motivo', 'responsavel', 'data_ocorrencia'];
      campos_obrigatorios.forEach(function(campo) {
        if (!data[campo]) {
          validation.violations.push({
            codigo: 'REG_002',
            descricao: 'Campo obrigatório ausente : ' + campo,
            acao_corretiva: 'Preencher todos os campos obrigatórios'
          });
        }
      });

      // Validação 3 : Ação corretiva para problemas
      if (data.tipo_ocorrencia == 'PROBLEMA' && !data.acao_corretiva) {
        validation.warnings.push({
          codigo: 'REG_003',
          descricao: 'Problema registrado sem ação corretiva definida',
          recomendacao: 'Definir ação corretiva para resolver o problema'
        });
      }

      validation.score = calculateComplianceScore(validation);
      return validation;
    } catch (error) {
      Logger.log("Erro em validateRegistroOcorrencia: " + error.message);
      throw error;
    }
  }

  /**
   * Valida guarda de documentos
   */
  function validateGuardaDocumentos(data) {
    try {
      var validation = {
        isCompliant: true,
        violations: [],
        warnings: [],
        recommendations: [],
        legalBasis: ['LEI_11947_2009_ART_15_PAR_2'],
        score: 100
      };

      // Validação 1 : Prazo de guarda (5 anos)
      var anos_desde_criacao = (data.dias_desde_criacao || 0) / 365;
      if (anos_desde_criacao > 5 && data.status != 'ARQUIVADO') {
        validation.recommendations.push({
          codigo: 'GUARD_001',
          descricao: 'Documento pode ser arquivado (prazo legal cumprido)',
          recomendacao: 'Arquivar documento conforme prazo legal de 5 anos'
        });
      }

      // Validação 2 : Local de guarda definido
      if (!data.local_guarda) {
        validation.violations.push({
          codigo: 'GUARD_002',
          descricao: 'Local de guarda não definido',
          base_legal: 'Lei 11.947/2009 Art. 15 § 2º',
          acao_corretiva: 'Definir se arquivos ficam na SEEDF central ou CRE regional'
        });
      }

      // Validação 3 : Organização dos arquivos
      if (!data.organizacao_adequada) {
        validation.warnings.push({
          codigo: 'GUARD_003',
          descricao: 'Organização dos arquivos pode ser melhorada',
          recomendacao: 'Manter arquivos em "boa guarda e organização" conforme lei'
        });
      }

      validation.score = calculateComplianceScore(validation);
      return validation;
    } catch (error) {
      Logger.log("Erro em validateGuardaDocumentos: " + error.message);
      throw error;
    }
  }

  /**
   * Valida conformidade de uma operação completa
   */
  function validateOperation(operationType, data) {
    var validation = {
      isCompliant: true,
      violations: [],
      warnings: [],
      recommendations: [],
      legalBasis: [],
      score: 100,
      timestamp: new Date()
    };

    try {
      switch (operationType) {
        case 'NOTA_FISCAL_REGISTRATION':
          return validateNotaFiscalRegistration(data);
        case 'CONFERENCIA_PROCESSO':
          return validateConferenciaProcesso(data);
        case 'ATESTACAO_COMISSAO':
          return validateAtestacaoComissao(data);
        case 'VALIDACAO_EMPENHO':
          return validateValidacaoEmpenho(data);
        case 'REGISTRO_OCORRENCIA':
          return validateRegistroOcorrencia(data);
        case 'GUARDA_DOCUMENTOS':
          return validateGuardaDocumentos(data);
        default:
          validation.isCompliant = false;
          validation.violations.push('Tipo de operação não reconhecido : ' + operationType);
      }
    } catch (error) {
      validation.isCompliant = false;
      validation.violations.push('Erro na validação : ' + error.message);
    }

    return validation;
  }

  // Public API
  return {
    validateOperation: validateOperation,
    validateNotaFiscalRegistration: validateNotaFiscalRegistration,
    validateConferenciaProcesso: validateConferenciaProcesso,
    validateAtestacaoComissao: validateAtestacaoComissao,
    validateValidacaoEmpenho: validateValidacaoEmpenho,
    validateRegistroOcorrencia: validateRegistroOcorrencia,
    validateGuardaDocumentos: validateGuardaDocumentos,
    calculateComplianceScore: calculateComplianceScore,
    validateEmpenhoFormat: validateEmpenhoFormat
  };

})();
