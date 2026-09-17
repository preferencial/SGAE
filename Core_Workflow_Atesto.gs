/**
 * @fileoverview Workflow de Atesto de Gêneros Alimentícios - CRE-PP/UNIAE
 *
 * PROPÓSITO FUNDAMENTAL:
 * Facilitar a análise processual sobre a conferência dos recebimentos de gêneros
 * alimentícios nas Unidades Escolares vinculadas à CRE-PP, assim como o atesto
 * das Notas Fiscais emitidas em favor dos diferentes fornecedores.
 *
 * BASE LEGAL:
 * - Lei nº 4.320/1964 (Arts. 62 e 63) - Liquidação da despesa
 * - Lei nº 11.947/2009 - PNAE
 * - Lei nº 14.133/2021 (Art. 117) - Fiscalização de contratos
 * - Resolução CD/FNDE nº 06/2020 - Atestação por Comissão
 * - Manual da Alimentação Escolar do DF
 *
 * @version 3.0.0
 * @author UNIAE/CRE-PP
 */

'use strict';

/**
 * FLUXO PROCESSUAL DO RECEBIMENTO AO ATESTO
 * Conforme Manual de Análise Processual - UNIAE/CRE-PP
 */
var FLUXO_ATESTO = {

  /**
   * ETAPA 1: Entrega e Recebimento Físico (Unidade Escolar)
   */
  ETAPA_1_RECEBIMENTO: {
    codigo: 'RECEBIMENTO_UE',
    nome: 'Recebimento na Unidade Escolar',
    descricao: 'Conferência quantitativa e qualitativa dos produtos',
    responsavel: 'Servidor Designado (Diretor, Vice-Diretor, etc.)',
    local: 'Unidade Escolar',
    documentos: ['Termo de Recebimento (2 vias)'],
    verificacoes: [
      'Quantidade conforme Termo de Recebimento',
      'Pesagem de produtos (balança aferida)',
      'Integridade das embalagens',
      'Data de validade',
      'Características sensoriais (aparência, cor, odor)',
      'Temperatura (produtos refrigerados/congelados)',
      'Marca conforme contrato',
      'Inscrição "PRODUTO INSTITUCIONAL - PROIBIDA A VENDA"'
    ],
    atesto_obrigatorio: [
      'Assinatura digital do servidor autenticado',
      'Número da matrícula funcional',
      'Data exata do recebimento',
      'Identificação digital da Unidade Escolar'
    ],
    prazo_dias: 0, // Imediato
    base_legal: 'Manual Alimentação Escolar DF - Item 12'
  },

  /**
   * ETAPA 2: Consolidação e Envio Documental (Fornecedor)
   */
  ETAPA_2_CONSOLIDACAO: {
    codigo: 'CONSOLIDACAO_DOCS',
    nome: 'Consolidação Documental',
    descricao: 'Agrupamento dos Termos de Recebimento com Nota Fiscal',
    responsavel: 'Fornecedor (Empresa Contratada)',
    local: 'Fornecedor',
    documentos: ['Termos de Recebimento atestados', 'Nota Fiscal'],
    envio: 'E-mail para UNIAE',
    prazo_dias: 5 // Após última entrega do período
  },

  /**
   * ETAPA 3: Análise Documental e Atesto da Comissão (UNIAE)
   */
  ETAPA_3_ANALISE_UNIAE: {
    codigo: 'ANALISE_COMISSAO',
    nome: 'Análise e Atesto pela Comissão Regional',
    descricao: 'Verificação da consistência entre documentos',
    responsavel: 'Comissão Regional de Recebimento (UNIAE)',
    local: 'UNIAE/CRE-PP',
    minimo_membros: 3,
    verificacoes: [
      'Soma dos quantitativos dos Termos = Quantidade da NF',
      'Atesto escolar completo (assinatura digital, matrícula, data, identificação UE)',
      'Conformidade da NF com contrato (CNPJ, descrição, preços)',
      'Análise de observações/recusas nos Termos'
    ],
    prazo_dias: 5, // 5 dias úteis após recebimento
    documento_saida: 'Despacho de Atesto no SEI',
    base_legal: 'Resolução CD/FNDE nº 06/2020'
  },

  /**
   * ETAPA 4: Atesto do Executor e Liquidação
   */
  ETAPA_4_LIQUIDACAO: {
    codigo: 'ATESTO_EXECUTOR',
    nome: 'Atesto do Executor e Liquidação',
    descricao: 'Confirmação da regularidade da execução contratual',
    responsavel: 'Executor do Contrato',
    local: 'SEEDF',
    verificacoes: [
      'Verificar atesto da Comissão',
      'Confirmar regularidade da execução',
      'Encaminhar para liquidação'
    ],
    documento_saida: 'Atesto do Executor no SEI',
    base_legal: 'Lei nº 4.320/1964 - Arts. 62 e 63'
  }
};

/**
 * STATUS DO PROCESSO DE ATESTO
 */
var STATUS_ATESTO = {
  // Etapa 1 - Recebimento
  AGUARDANDO_ENTREGA: 'Aguardando Entrega',
  ENTREGA_REALIZADA: 'Entrega Realizada',
  RECEBIDO_CONFORME: 'Recebido Conforme',
  RECEBIDO_PARCIAL: 'Recebido Parcial',
  RECUSADO_TOTAL: 'Recusado Total',

  // Etapa 2 - Consolidação
  AGUARDANDO_DOCS: 'Aguardando Documentação',
  DOCS_RECEBIDOS: 'Documentação Recebida',

  // Etapa 3 - Análise UNIAE
  EM_ANALISE: 'Em Análise pela Comissão',
  SOMA_VERIFICADA: 'Soma Verificada',
  PDGP_CONFERIDO: 'PDGP Conferido',
  NF_CONSULTADA: 'NF-e Consultada',
  ATESTO_COMISSAO: 'Atestado pela Comissão',
  PENDENCIA_DOCUMENTAL: 'Pendência Documental',

  // Etapa 4 - Liquidação
  AGUARDANDO_EXECUTOR: 'Aguardando Atesto Executor',
  ATESTADO_EXECUTOR: 'Atestado pelo Executor',
  EM_LIQUIDACAO: 'Em Liquidação',
  LIQUIDADO: 'Liquidado',
  PAGO: 'Pago'
};

/**
 * CRITÉRIOS DE QUALIDADE NO RECEBIMENTO
 * Conforme Manual da Alimentação Escolar DF - Item 12
 */
var CRITERIOS_QUALIDADE = {
  TEMPERATURA: {
    CONGELADOS: { min: -18, max: -12, unidade: '°C' },
    RESFRIADOS: { min: 0, max: 10, unidade: '°C' },
    CARNES_RESFRIADAS: { min: 0, max: 7, unidade: '°C' },
    PESCADO_RESFRIADO: { min: 0, max: 3, unidade: '°C' }
  },
  VALIDADE_MINIMA: {
    PERECIVEIS: 4, // dias mínimos
    NAO_PERECIVEIS: 30 // dias mínimos
  },
  EMBALAGEM: [
    'Íntegra',
    'Limpa',
    'Seca',
    'Sem violação',
    'Sem amassados',
    'Sem ferrugem (latas)',
    'Sem estufamento'
  ],
  ROTULAGEM: [
    'Data de validade legível',
    'Lote identificado',
    'Informações do fabricante',
    'Selo de inspeção (SIF) quando aplicável',
    'Inscrição PRODUTO INSTITUCIONAL'
  ]
};

/**
 * MOTIVOS DE RECUSA PADRONIZADOS
 * Conforme Manual - Item 12
 */
var MOTIVOS_RECUSA_PADRAO = {
  TEMPERATURA: 'Temperatura inadequada',
  EMBALAGEM_VIOLADA: 'Embalagem violada ou danificada',
  PRODUTO_VENCIDO: 'Produto vencido',
  VALIDADE_INSUFICIENTE: 'Validade insuficiente (< mínimo contratual)',
  CARACTERISTICAS_ALTERADAS: 'Características organolépticas alteradas',
  QUANTIDADE_DIVERGENTE: 'Quantidade divergente da NF/Termo',
  PRODUTO_DIFERENTE: 'Produto diferente do solicitado/contratado',
  PRESENCA_PRAGAS: 'Presença de pragas ou sujidades',
  SEM_ROTULAGEM: 'Sem rotulagem ou rotulagem incompleta',
  TRANSPORTE_INADEQUADO: 'Transporte inadequado',
  SEM_INSCRICAO_INSTITUCIONAL: 'Sem inscrição "PRODUTO INSTITUCIONAL"',
  MARCA_DIVERGENTE: 'Marca diferente da contratada'
};

/**
 * Service: Workflow de Atesto
 */
var WorkflowAtestoService = {

  /**
   * Inicia novo processo de atesto
   */
  iniciarProcesso: function(dados) {
    try {
      try {
        if (!dados) {
          throw new Error('Dados não fornecidos');
        }
        validateRequired(dados.notaFiscal, 'Nota Fiscal');
        validateRequired(dados.fornecedor, 'Fornecedor');
        validateRequired(dados.valorTotal, 'Valor Total');

        var processo = {
          id: this._gerarIdProcesso(),
          dataAbertura: new Date(),
          notaFiscal: dados.notaFiscal,
          chaveAcessoNFe: dados.chaveAcessoNFe || '',
          dataEmissaoNF: dados.dataEmissaoNF || null,
          fornecedor: dados.fornecedor,
          cnpjFornecedor: dados.cnpjFornecedor || '',
          valorTotal: dados.valorTotal,
          contrato: dados.contrato || '',
          notaEmpenho: dados.notaEmpenho || '',
          pdgp: dados.pdgp || '',
          distribuicao: dados.distribuicao || '',
          tipoGenero: dados.tipoGenero || 'PERECIVEL',

          // Status do fluxo
          etapaAtual: 'ETAPA_1_RECEBIMENTO',
          status: STATUS_ATESTO.AGUARDANDO_ENTREGA,

          // Controle de etapas
          etapas: {
            recebimento: { status: 'PENDENTE', data: null, responsavel: null },
            consolidacao: { status: 'PENDENTE', data: null },
            analiseComissao: { status: 'PENDENTE', data: null, membros: [] },
            atestoExecutor: { status: 'PENDENTE', data: null, responsavel: null }
          },

          // Entregas vinculadas
          entregas: [],

          // Ocorrências
          recusas: [],
          glosas: [],

          // Conformidade
          conformidadeLegal: {
            verificada: false,
            score: 0,
            pendencias: []
          },

          // Auditoria
          historico: [{
            data: new Date(),
            acao: 'PROCESSO_INICIADO',
            usuario: Session.getActiveUser().getEmail(),
            detalhes: 'Processo de atesto iniciado'
          }],

          observacoes: dados.observacoes || ''
        };

        this._salvarProcesso(processo);

        SystemLogger.info('Processo de atesto iniciado', {
          id: processo.id,
          nf: dados.notaFiscal,
          fornecedor: dados.fornecedor
        });

        return { success: true, data: processo };

      } catch (error) {
        SystemLogger.error('Erro ao iniciar processo de atesto', error);
        return { success: false, error: error.message };
      }
    } catch (error) {
      Logger.log("Erro em iniciarProcesso: " + error.message);
      throw error;
    }
  },

  /**
   * Registra recebimento na Unidade Escolar (Etapa 1)
   */
  registrarRecebimento: function(idProcesso, dadosRecebimento) {
    try {
      try {
        var processo = this._buscarProcesso(idProcesso);
        if (!processo) {
          throw new Error('Processo não encontrado: ' + idProcesso);
        }

        validateRequired(dadosRecebimento.unidadeEscolar, 'Unidade Escolar');
        validateRequired(dadosRecebimento.dataEntrega, 'Data de Entrega');
        validateRequired(dadosRecebimento.responsavel, 'Responsável pelo Recebimento');

        var entrega = {
          id: 'ENT_' + new Date().getTime(),
          unidadeEscolar: dadosRecebimento.unidadeEscolar,
          dataEntrega: dadosRecebimento.dataEntrega,
          horaEntrega: dadosRecebimento.horaEntrega || '',
          responsavel: dadosRecebimento.responsavel,
          matriculaResponsavel: dadosRecebimento.matriculaResponsavel || '',

          // Produtos recebidos
          produtos: dadosRecebimento.produtos || [],
          quantidadeTotal: dadosRecebimento.quantidadeTotal || 0,

          // Conferência
          conferencia: {
            quantitativaOk: dadosRecebimento.quantitativaOk || false,
            qualitativaOk: dadosRecebimento.qualitativaOk || false,
            temperaturaAferida: dadosRecebimento.temperaturaAferida || null,
            embalagemOk: dadosRecebimento.embalagemOk || false,
            rotulagemOk: dadosRecebimento.rotulagemOk || false,
            validadeOk: dadosRecebimento.validadeOk || false
          },

          // Atesto
          atesto: {
            assinatura: dadosRecebimento.assinatura || false,
            matricula: dadosRecebimento.matriculaResponsavel || '',
            data: dadosRecebimento.dataEntrega,
            identificacaoUE: dadosRecebimento.identificacaoUE || dadosRecebimento.carimboUE || false // Arquitetura 100% digital: identificação eletrônica da UE (carimboUE mantido para compatibilidade)
          },

          // Recusas (se houver)
          recusas: dadosRecebimento.recusas || [],

          // Status
          status: this._determinarStatusRecebimento(dadosRecebimento),

          observacoes: dadosRecebimento.observacoes || ''
        };

        processo.entregas.push(entrega);

        // Atualizar status do processo
        if (entrega.recusas.length === 0) {
          processo.status = STATUS_ATESTO.RECEBIDO_CONFORME;
        } else if (entrega.recusas.length < (dadosRecebimento.produtos || []).length) {
          processo.status = STATUS_ATESTO.RECEBIDO_PARCIAL;
        } else {
          processo.status = STATUS_ATESTO.RECUSADO_TOTAL;
        }

        processo.etapas.recebimento = {
          status: 'CONCLUIDO',
          data: new Date(),
          responsavel: dadosRecebimento.responsavel
        };

        // Registrar no histórico
        processo.historico.push({
          data: new Date(),
          acao: 'RECEBIMENTO_REGISTRADO',
          usuario: Session.getActiveUser().getEmail(),
          detalhes: 'Recebimento em ' + dadosRecebimento.unidadeEscolar + ' - Status: ' + entrega.status
        });

        this._atualizarProcesso(processo);

        return { success: true, data: entrega };

      } catch (error) {
        SystemLogger.error('Erro ao registrar recebimento', error);
        return { success: false, error: error.message };
      }
    } catch (error) {
      Logger.log("Erro em registrarRecebimento: " + error.message);
      throw error;
    }
  },

  /**
   * Registra análise da Comissão (Etapa 3)
   */
  registrarAnaliseComissao: function(idProcesso, dadosAnalise) {
    try {
      try {
        var processo = this._buscarProcesso(idProcesso);
        if (!processo) {
          throw new Error('Processo não encontrado: ' + idProcesso);
        }

        validateRequired(dadosAnalise.membrosPresentes, 'Membros Presentes');

        if (dadosAnalise.membrosPresentes.length < 3) {
          throw new Error('Mínimo de 3 membros da Comissão necessários para atesto');
        }

        var analise = {
          dataAnalise: new Date(),
          membrosPresentes: dadosAnalise.membrosPresentes,

          // Verificações realizadas
          verificacoes: {
            somaQuantitativos: {
              realizada: dadosAnalise.somaVerificada || false,
              conforme: dadosAnalise.somaConforme || false,
              observacao: dadosAnalise.obsSoma || ''
            },
            atestoEscolar: {
              realizada: dadosAnalise.atestoVerificado || false,
              conforme: dadosAnalise.atestoConforme || false,
              observacao: dadosAnalise.obsAtesto || ''
            },
            conformidadeNF: {
              realizada: dadosAnalise.nfVerificada || false,
              conforme: dadosAnalise.nfConforme || false,
              observacao: dadosAnalise.obsNF || ''
            },
            consultaSEFAZ: {
              realizada: dadosAnalise.sefazConsultada || false,
              resultado: dadosAnalise.resultadoSEFAZ || '',
              observacao: dadosAnalise.obsSEFAZ || ''
            }
          },

          // Resultado
          resultado: dadosAnalise.resultado || 'PENDENTE',
          numeroDespacho: dadosAnalise.numeroDespacho || '',
          processoSEI: dadosAnalise.processoSEI || '',

          observacoes: dadosAnalise.observacoes || ''
        };

        processo.etapas.analiseComissao = {
          status: analise.resultado === 'APROVADO' ? 'CONCLUIDO' : 'PENDENTE',
          data: new Date(),
          membros: dadosAnalise.membrosPresentes
        };

        if (analise.resultado === 'APROVADO') {
          processo.status = STATUS_ATESTO.ATESTO_COMISSAO;
          processo.etapaAtual = 'ETAPA_4_LIQUIDACAO';
        } else {
          processo.status = STATUS_ATESTO.PENDENCIA_DOCUMENTAL;
        }

        // Registrar no histórico
        processo.historico.push({
          data: new Date(),
          acao: 'ANALISE_COMISSAO',
          usuario: Session.getActiveUser().getEmail(),
          detalhes: 'Análise pela Comissão - Resultado: ' + analise.resultado
        });

        this._atualizarProcesso(processo);

        return { success: true, data: analise };

      } catch (error) {
        SystemLogger.error('Erro ao registrar análise da Comissão', error);
        return { success: false, error: error.message };
      }
    } catch (error) {
      Logger.log("Erro em registrarAnaliseComissao: " + error.message);
      throw error;
    }
  },


  /**
   * Registra atesto do Executor (Etapa 4)
   */
  registrarAtestoExecutor: function(idProcesso, dadosAtesto) {
    try {
      var processo = this._buscarProcesso(idProcesso);
      if (!processo) {
        throw new Error('Processo não encontrado: ' + idProcesso);
      }

      validateRequired(dadosAtesto.executor, 'Executor do Contrato');

      processo.etapas.atestoExecutor = {
        status: 'CONCLUIDO',
        data: new Date(),
        responsavel: dadosAtesto.executor
      };

      processo.status = STATUS_ATESTO.ATESTADO_EXECUTOR;

      // Registrar no histórico
      processo.historico.push({
        data: new Date(),
        acao: 'ATESTO_EXECUTOR',
        usuario: Session.getActiveUser().getEmail(),
        detalhes: 'Atesto do Executor - ' + dadosAtesto.executor
      });

      this._atualizarProcesso(processo);

      return { success: true, data: processo };

    } catch (error) {
      SystemLogger.error('Erro ao registrar atesto do executor', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Registra recusa de produto
   */
  registrarRecusa: function(idProcesso, dadosRecusa) {
    try {
      try {
        var processo = this._buscarProcesso(idProcesso);
        if (!processo) {
          throw new Error('Processo não encontrado: ' + idProcesso);
        }

        validateRequired(dadosRecusa.produto, 'Produto');
        validateRequired(dadosRecusa.quantidade, 'Quantidade Recusada');
        validateRequired(dadosRecusa.motivo, 'Motivo da Recusa');
        validateRequired(dadosRecusa.responsavel, 'Responsável');

        var recusa = {
          id: 'REC_' + new Date().getTime(),
          dataRecusa: new Date(),
          unidadeEscolar: dadosRecusa.unidadeEscolar || '',
          produto: dadosRecusa.produto,
          quantidade: dadosRecusa.quantidade,
          unidadeMedida: dadosRecusa.unidadeMedida || 'kg',
          motivo: dadosRecusa.motivo,
          motivoDetalhado: dadosRecusa.motivoDetalhado || '',
          responsavel: dadosRecusa.responsavel,
          registradoNoTermo: dadosRecusa.registradoNoTermo || false,
          fotografias: dadosRecusa.fotografias || [],

          // Substituição
          aguardandoSubstituicao: true,
          prazoSubstituicao: this._calcularPrazoSubstituicao(processo.tipoGenero),
          dataSubstituicao: null,
          substituicaoRealizada: false,

          observacoes: dadosRecusa.observacoes || ''
        };

        processo.recusas.push(recusa);

        // Registrar no histórico
        processo.historico.push({
          data: new Date(),
          acao: 'RECUSA_REGISTRADA',
          usuario: Session.getActiveUser().getEmail(),
          detalhes: 'Recusa: ' + dadosRecusa.produto + ' - ' + dadosRecusa.motivo
        });

        this._atualizarProcesso(processo);

        return { success: true, data: recusa };

      } catch (error) {
        SystemLogger.error('Erro ao registrar recusa', error);
        return { success: false, error: error.message };
      }
    } catch (error) {
      Logger.log("Erro em registrarRecusa: " + error.message);
      throw error;
    }
  },

  /**
   * Registra glosa
   */
  registrarGlosa: function(idProcesso, dadosGlosa) {
    try {
      try {
        var processo = this._buscarProcesso(idProcesso);
        if (!processo) {
          throw new Error('Processo não encontrado: ' + idProcesso);
        }

        validateRequired(dadosGlosa.motivo, 'Motivo da Glosa');
        validateRequired(dadosGlosa.valor, 'Valor da Glosa');

        var glosa = {
          id: 'GLO_' + new Date().getTime(),
          dataGlosa: new Date(),
          produto: dadosGlosa.produto || '',
          quantidade: dadosGlosa.quantidade || 0,
          valorUnitario: dadosGlosa.valorUnitario || 0,
          valorTotal: dadosGlosa.valor,
          motivo: dadosGlosa.motivo,
          tipoGlosa: dadosGlosa.tipoGlosa || 'QUANTIDADE',
          responsavel: dadosGlosa.responsavel || Session.getActiveUser().getEmail(),
          status: 'APLICADA',
          observacoes: dadosGlosa.observacoes || ''
        };

        processo.glosas.push(glosa);

        // Registrar no histórico
        processo.historico.push({
          data: new Date(),
          acao: 'GLOSA_REGISTRADA',
          usuario: Session.getActiveUser().getEmail(),
          detalhes: 'Glosa: R$ ' + dadosGlosa.valor + ' - ' + dadosGlosa.motivo
        });

        this._atualizarProcesso(processo);

        return { success: true, data: glosa };

      } catch (error) {
        SystemLogger.error('Erro ao registrar glosa', error);
        return { success: false, error: error.message };
      }
    } catch (error) {
      Logger.log("Erro em registrarGlosa: " + error.message);
      throw error;
    }
  },

  /**
   * Verifica conformidade do processo
   */
  verificarConformidade: function(idProcesso) {
    try {
      try {
        var processo = this._buscarProcesso(idProcesso);
        if (!processo) {
          throw new Error('Processo não encontrado: ' + idProcesso);
        }

        var pendencias = [];
        var score = 100;

        // Verificar Etapa 1 - Recebimento
        if (processo.entregas.length === 0) {
          pendencias.push({
            etapa: 'RECEBIMENTO',
            descricao: 'Nenhum recebimento registrado',
            criticidade: 'ALTA'
          });
          score -= 25;
        } else {
          processo.entregas.forEach(function(entrega) {
            if (!entrega.atesto.assinatura) {
              pendencias.push({
                etapa: 'RECEBIMENTO',
                descricao: 'Termo sem assinatura - ' + entrega.unidadeEscolar,
                criticidade: 'ALTA'
              });
              score -= 10;
            }
            if (!entrega.atesto.matricula) {
              pendencias.push({
                etapa: 'RECEBIMENTO',
                descricao: 'Termo sem matrícula - ' + entrega.unidadeEscolar,
                criticidade: 'MEDIA'
              });
              score -= 5;
            }
            if (!entrega.atesto.identificacaoUE) {
              pendencias.push({
                etapa: 'RECEBIMENTO',
                descricao: 'Termo sem identificação digital da UE - ' + entrega.unidadeEscolar,
                criticidade: 'MEDIA'
              });
              score -= 5;
            }
          });
        }

        // Verificar Etapa 3 - Análise Comissão
        if (processo.etapas.analiseComissao.status !== 'CONCLUIDO') {
          pendencias.push({
            etapa: 'ANALISE_COMISSAO',
            descricao: 'Análise da Comissão pendente',
            criticidade: 'ALTA'
          });
          score -= 25;
        }

        // Verificar prazos
        var diasDesdeAbertura = Math.floor((new Date() - new Date(processo.dataAbertura)) / (1000 * 60 * 60 * 24));
        if (diasDesdeAbertura > 5 && processo.etapas.analiseComissao.status !== 'CONCLUIDO') {
          pendencias.push({
            etapa: 'PRAZO',
            descricao: 'Prazo de 5 dias úteis para análise excedido',
            criticidade: 'ALTA'
          });
          score -= 15;
        }

        // Verificar recusas pendentes
        var recusasPendentes = processo.recusas.filter(function(r) {
          return r.aguardandoSubstituicao && !r.substituicaoRealizada;
        });
        if (recusasPendentes.length > 0) {
          pendencias.push({
            etapa: 'RECUSAS',
            descricao: recusasPendentes.length + ' recusa(s) aguardando substituição',
            criticidade: 'MEDIA'
          });
          score -= 5 * recusasPendentes.length;
        }

        processo.conformidadeLegal = {
          verificada: true,
          dataVerificacao: new Date(),
          score: Math.max(0, score),
          pendencias: pendencias
        };

        this._atualizarProcesso(processo);

        return {
          success: true,
          data: {
            score: Math.max(0, score),
            conforme: score >= 80,
            pendencias: pendencias,
            totalPendencias: pendencias.length
          }
        };

      } catch (error) {
        SystemLogger.error('Erro ao verificar conformidade', error);
        return { success: false, error: error.message };
      }
    } catch (error) {
      Logger.log("Erro em verificarConformidade: " + error.message);
      throw error;
    }
  },

  /**
   * Gera relatório do processo para SEI
   */
  gerarRelatorioSEI: function(idProcesso) {
    try {
      try {
        var processo = this._buscarProcesso(idProcesso);
        if (!processo) {
          throw new Error('Processo não encontrado: ' + idProcesso);
        }

        var relatorio = [];
        relatorio.push('RELATÓRIO DE CONFERÊNCIA E ATESTO');
        relatorio.push('UNIAE/CRE-PP - Sistema de Gestão de Gêneros Alimentícios');
        relatorio.push('');
        relatorio.push('=' .repeat(60));
        relatorio.push('');
        relatorio.push('1. IDENTIFICAÇÃO DO PROCESSO');
        relatorio.push('   ID do Processo: ' + processo.id);
        relatorio.push('   Data de Abertura: ' + Utilities.formatDate(new Date(processo.dataAbertura), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm'));
        relatorio.push('   Nota Fiscal: ' + processo.notaFiscal);
        relatorio.push('   Fornecedor: ' + processo.fornecedor);
        relatorio.push('   CNPJ: ' + processo.cnpjFornecedor);
        relatorio.push('   Valor Total: R$ ' + Number(processo.valorTotal).toFixed(2));
        relatorio.push('   Contrato: ' + processo.contrato);
        relatorio.push('   Nota de Empenho: ' + processo.notaEmpenho);
        relatorio.push('');
        relatorio.push('2. ENTREGAS REALIZADAS');

        processo.entregas.forEach(function(entrega, idx) {
          relatorio.push('   ' + (idx + 1) + '. ' + entrega.unidadeEscolar);
          relatorio.push('      Data: ' + Utilities.formatDate(new Date(entrega.dataEntrega), 'America/Sao_Paulo', 'dd/MM/yyyy'));
          relatorio.push('      Responsável: ' + entrega.responsavel);
          relatorio.push('      Status: ' + entrega.status);
        });

        relatorio.push('');
        relatorio.push('3. RECUSAS REGISTRADAS');
        if (processo.recusas.length === 0) {
          relatorio.push('   Nenhuma recusa registrada.');
        } else {
          processo.recusas.forEach(function(recusa, idx) {
            relatorio.push('   ' + (idx + 1) + '. ' + recusa.produto);
            relatorio.push('      Quantidade: ' + recusa.quantidade + ' ' + recusa.unidadeMedida);
            relatorio.push('      Motivo: ' + recusa.motivo);
            relatorio.push('      Substituição: ' + (recusa.substituicaoRealizada ? 'Realizada' : 'Pendente'));
          });
        }

        relatorio.push('');
        relatorio.push('4. GLOSAS APLICADAS');
        if (processo.glosas.length === 0) {
          relatorio.push('   Nenhuma glosa aplicada.');
        } else {
          var totalGlosas = 0;
          processo.glosas.forEach(function(glosa, idx) {
            relatorio.push('   ' + (idx + 1) + '. ' + glosa.motivo);
            relatorio.push('      Valor: R$ ' + Number(glosa.valorTotal).toFixed(2));
            totalGlosas += Number(glosa.valorTotal);
          });
          relatorio.push('   TOTAL DE GLOSAS: R$ ' + totalGlosas.toFixed(2));
        }

        relatorio.push('');
        relatorio.push('5. STATUS DO PROCESSO');
        relatorio.push('   Status Atual: ' + processo.status);
        relatorio.push('   Etapa Atual: ' + processo.etapaAtual);
        relatorio.push('');
        relatorio.push('6. CONFORMIDADE LEGAL');
        relatorio.push('   Score: ' + processo.conformidadeLegal.score + '%');
        relatorio.push('   Pendências: ' + processo.conformidadeLegal.pendencias.length);

        relatorio.push('');
        relatorio.push('=' .repeat(60));
        relatorio.push('Relatório gerado em: ' + Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm:ss'));
        relatorio.push('Sistema UNIAE/CRE-PP v3.0.0');

        return {
          success: true,
          data: {
            texto: relatorio.join('\n'),
            processo: processo
          }
        };

      } catch (error) {
        SystemLogger.error('Erro ao gerar relatório SEI', error);
        return { success: false, error: error.message };
      }
    } catch (error) {
      Logger.log("Erro em gerarRelatorioSEI: " + error.message);
      throw error;
    }
  },

  /**
   * Lista processos com filtros
   */
  listarProcessos: function(filtros) {
    try {
      try {
        var sheet = getOrCreateSheetSafe('Processos_Atesto');
        if (sheet.getLastRow() <= 1) {
          return { success: true, data: [], total: 0 };
        }

        var data = sheet.getDataRange().getValues();
        var headers = data[0];
        var processos = [];

        for (var i = 1; i < data.length; i++) {
          var processo = JSON.parse(data[i][1] || '{}');

          // Aplicar filtros
          var incluir = true;
          if (filtros) {
            if (filtros.status && processo.status !== filtros.status) incluir = false;
            if (filtros.fornecedor && processo.fornecedor !== filtros.fornecedor) incluir = false;
            if (filtros.dataInicio && new Date(processo.dataAbertura) < new Date(filtros.dataInicio)) incluir = false;
            if (filtros.dataFim && new Date(processo.dataAbertura) > new Date(filtros.dataFim)) incluir = false;
          }

          if (incluir) {
            processos.push(processo);
          }
        }

        return { success: true, data: processos, total: processos.length };

      } catch (error) {
        SystemLogger.error('Erro ao listar processos', error);
        return { success: false, error: error.message };
      }
    } catch (error) {
      Logger.log("Erro em listarProcessos: " + error.message);
      throw error;
    }
  },

  // === MÉTODOS AUXILIARES ===

  _gerarIdProcesso: function() {
    try {
      return 'PROC_' + new Date().getTime() + '_' + Math.random().toString(36).substr(2, 5).toUpperCase();
    } catch (error) {
      Logger.log("Erro em _gerarIdProcesso: " + error.message);
      throw error;
    }
  },

  _determinarStatusRecebimento: function(dados) {
    if (dados.recusas && dados.recusas.length > 0) {
      if (dados.recusas.length === (dados.produtos || []).length) {
        return STATUS_ATESTO.RECUSADO_TOTAL;
      }
      return STATUS_ATESTO.RECEBIDO_PARCIAL;
    }
    return STATUS_ATESTO.RECEBIDO_CONFORME;
  },

  _calcularPrazoSubstituicao: function(tipoGenero) {
    // Perecíveis: 24 horas; Não perecíveis: 5 dias úteis
    var prazo = new Date();
    if (tipoGenero === 'PERECIVEL') {
      prazo.setHours(prazo.getHours() + 24);
    } else {
      prazo.setDate(prazo.getDate() + 5);
    }
    return prazo;
  },

  _salvarProcesso: function(processo) {
    try {
      var sheet = getOrCreateSheetSafe('Processos_Atesto');

      if (sheet.getLastRow() === 0) {
        sheet.appendRow(['ID', 'Dados_JSON', 'Data_Criacao', 'Ultima_Atualizacao']);
      }

      sheet.appendRow([
        processo.id,
        JSON.stringify(processo),
        new Date(),
        new Date()
      ]);
    } catch (error) {
      Logger.log("Erro em _salvarProcesso: " + error.message);
      throw error;
    }
  },

  _atualizarProcesso: function(processo) {
    try {
      var sheet = getOrCreateSheetSafe('Processos_Atesto');
      var data = sheet.getDataRange().getValues();

      for (var i = 1; i < data.length; i++) {
        if (data[i][0] === processo.id) {
          sheet.getRange(i + 1, 2).setValue(JSON.stringify(processo));
          sheet.getRange(i + 1, 4).setValue(new Date());
          return;
        }
      }
    } catch (error) {
      Logger.log("Erro em _atualizarProcesso: " + error.message);
      throw error;
    }
  },

  _buscarProcesso: function(id) {
    try {
      var sheet = getOrCreateSheetSafe('Processos_Atesto');
      if (sheet.getLastRow() <= 1) return null;

      var data = sheet.getDataRange().getValues();

      for (var i = 1; i < data.length; i++) {
        if (data[i][0] === id) {
          return JSON.parse(data[i][1] || '{}');
        }
      }

      return null;
    } catch (error) {
      Logger.log("Erro em _buscarProcesso: " + error.message);
      throw error;
    }
  }
};

/**
 * Funções de API para o Frontend
 */
function iniciarProcessoAtesto(dados) {
  return WorkflowAtestoService.iniciarProcesso(dados);
}

function registrarRecebimentoUE(idProcesso, dados) {
  return WorkflowAtestoService.registrarRecebimento(idProcesso, dados);
}

function registrarAnaliseComissaoUNIAE(idProcesso, dados) {
  return WorkflowAtestoService.registrarAnaliseComissao(idProcesso, dados);
}

function registrarAtestoExecutorContrato(idProcesso, dados) {
  return WorkflowAtestoService.registrarAtestoExecutor(idProcesso, dados);
}

function registrarRecusaProduto(idProcesso, dados) {
  return WorkflowAtestoService.registrarRecusa(idProcesso, dados);
}

function registrarGlosaNF(idProcesso, dados) {
  return WorkflowAtestoService.registrarGlosa(idProcesso, dados);
}

function verificarConformidadeProcesso(idProcesso) {
  return WorkflowAtestoService.verificarConformidade(idProcesso);
}

function gerarRelatorioProcessoSEI(idProcesso) {
  return WorkflowAtestoService.gerarRelatorioSEI(idProcesso);
}

function listarProcessosAtesto(filtros) {
  return WorkflowAtestoService.listarProcessos(filtros);
}

/**
 * Função auxiliar de validação
 * @param {*} value - Valor a validar
 * @param {string} fieldName - Nome do campo (opcional)
 * @returns {boolean} true se válido
 * @throws {Error} Se valor for vazio e fieldName fornecido
 */
function validateRequired(value, fieldName) {
  var isEmpty = value === undefined || value === null || value === '';
  
  // Se fieldName não foi fornecido, apenas retorna boolean
  if (!fieldName) {
    return !isEmpty;
  }
  
  // Se fieldName foi fornecido e valor está vazio, lança erro
  if (isEmpty) {
    throw new Error('Campo obrigatório: ' + fieldName);
  }
  
  return true;
}
