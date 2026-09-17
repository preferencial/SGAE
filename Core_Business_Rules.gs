/**
 * @fileoverview Regras de Negócio Consolidadas - Sistema de Atesto de Gêneros Alimentícios
 *
 * FONTE NORMATIVA:
 * - Manual de Análise Processual: Recebimento e Atesto de Gêneros Alimentícios (UNIAE/CRE-PP)
 * - Manual da Alimentação Escolar do Distrito Federal (SEEDF)
 * - Nota Técnica Nº 1/2025 - SEE/SUAPE/DIAE/GPAE (Alimentos Perecíveis)
 * - Relatório de Auditoria Nº 02/2014 - DISED/CONAS/CONT/STC
 *
 * BASE LEGAL:
 * - Lei nº 4.320/1964 (Arts. 62 e 63) - Liquidação da despesa
 * - Lei nº 11.947/2009 - PNAE
 * - Lei nº 14.133/2021 (Art. 117) - Fiscalização de contratos
 * - Resolução CD/FNDE nº 06/2020 - Atestação por Comissão
 * - RDC ANVISA 216/2004 - Boas práticas
 *
 * @version 4.0.0
 * @author UNIAE/CRE-PP
 */

'use strict';

/**
 * REGRAS DE NEGÓCIO - MÓDULO PRINCIPAL
 */
var BusinessRules = (function() {

  // ============================================================================
  // SEÇÃO 1: FLUXO PROCESSUAL DO RECEBIMENTO AO ATESTO
  // Conforme Manual de Análise Processual - Seção 2
  // ============================================================================

  var FLUXO_PROCESSUAL = {
    /**
     * ETAPA 1: Entrega e Recebimento Físico
     * Local: Unidade Escolar
     * Responsável: Servidor Designado (Diretor, Vice-Diretor, Supervisor, Secretário)
     */
    ETAPA_1: {
      codigo: 'RECEBIMENTO_UE',
      nome: 'Recebimento na Unidade Escolar',
      descricao: 'Conferência quantitativa e qualitativa dos produtos',
      local: 'Unidade Escolar',
      responsaveis: ['Diretor', 'Vice-Diretor', 'Supervisor', 'Secretário Escolar'],

      // Procedimento de Conferência Física (Manual Seção 2.2)
      procedimentos: {
        verificacaoQuantitativa: {
          descricao: 'Conferir quantidades, pesos e unidades do Termo de Recebimento',
          obrigatorio: true,
          exigencias: [
            'Uso de balança aferida para produtos pesáveis',
            'Pesagem sem embalagem secundária (caixas)',
            'Comparação com Termo de Recebimento'
          ]
        },
        verificacaoQualitativa: {
          descricao: 'Inspeção detalhada conforme checklist de qualidade',
          obrigatorio: true,
          itens: [
            'Integridade das embalagens',
            'Data de validade',
            'Características sensoriais (aparência, cor, odor)',
            'Temperatura (produtos refrigerados/congelados)',
            'Marca conforme contrato',
            'Inscrição "PRODUTO INSTITUCIONAL - PROIBIDA A VENDA"'
          ]
        },
        conformidadeContratual: {
          descricao: 'Verificar conformidade com especificações do contrato',
          obrigatorio: true
        }
      },

      // Formalidade do Atesto Digital (Arquitetura 100% Digital)
      atestoObrigatorio: {
        elementos: [
          { campo: 'assinatura', descricao: 'Assinatura digital do servidor autenticado', obrigatorio: true },
          { campo: 'matricula', descricao: 'Número da matrícula funcional', obrigatorio: true },
          { campo: 'data', descricao: 'Data exata do recebimento', obrigatorio: true },
          { campo: 'identificacaoUE', descricao: 'Identificação digital da Unidade Escolar', obrigatorio: true }
        ],
        vias: 1, // Digital - registro único no sistema
        proibicoes: [
          'Atestar sem autenticação no sistema',
          'Atestar com dados incompletos',
          'Atestar antes da conclusão da conferência'
        ]
      },

      prazo: 0 // Imediato - no ato da entrega
    },

    /**
     * ETAPA 2: Consolidação e Envio Documental
     * Responsável: Fornecedor (Empresa Contratada)
     */
    ETAPA_2: {
      codigo: 'CONSOLIDACAO_DOCS',
      nome: 'Consolidação Documental',
      descricao: 'Agrupamento dos Termos de Recebimento com Nota Fiscal',
      responsavel: 'Fornecedor (Empresa Contratada)',

      procedimentos: {
        coleta: 'Coletar via do Termo de Recebimento atestado pela UE',
        agrupamento: 'Agrupar Termos de todas as entregas cobertas pela NF',
        envio: 'Encaminhar por e-mail para UNIAE'
      },

      documentosNecessarios: [
        'Termos de Recebimento (atestados)',
        'Nota Fiscal correspondente'
      ]
    },

    /**
     * ETAPA 3: Análise Documental e Atesto da Comissão
     * Local: UNIAE
     * Responsável: Comissão Regional de Recebimento de Gêneros
     */
    ETAPA_3: {
      codigo: 'ANALISE_COMISSAO',
      nome: 'Análise e Atesto pela Comissão Regional',
      descricao: 'Verificação da consistência entre documentos',
      local: 'UNIAE',
      responsavel: 'Comissão Regional de Recebimento de Gêneros',
      minimoMembros: 3,

      // Checklist de Análise (Manual Seção 2.3)
      checklistAnalise: {
        conferenciaQuantitativa: {
          descricao: 'Soma dos quantitativos dos Termos = Quantidade da NF',
          obrigatorio: true,
          criterio: 'Qualquer discrepância impede o atesto'
        },
        conferenciaAtestoEscolar: {
          descricao: 'Verificar atesto completo em cada Termo',
          obrigatorio: true,
          elementos: ['Assinatura Digital', 'Matrícula', 'Data', 'Identificação UE']
        },
        conformidadeNF: {
          descricao: 'Checar dados da NF com contrato vigente',
          obrigatorio: true,
          itens: ['CNPJ do fornecedor', 'Descrição dos produtos', 'Preços unitários']
        },
        analiseObservacoes: {
          descricao: 'Analisar campo de Observações dos Termos',
          obrigatorio: true,
          objetivo: 'Identificar recusas ou ocorrências que impactem o valor'
        }
      },

      prazo: 5, // 5 dias úteis após recebimento da documentação
      documentoSaida: 'Despacho de Atesto no SEI',
      baseLegal: 'Resolução CD/FNDE nº 06/2020'
    },

    /**
     * ETAPA 4: Atesto do Executor e Liquidação
     * Responsável: Executor do Contrato / Setor Financeiro
     */
    ETAPA_4: {
      codigo: 'LIQUIDACAO',
      nome: 'Atesto do Executor e Liquidação',
      descricao: 'Confirmação da regularidade da execução contratual',

      procedimentos: {
        atestoExecutor: {
          responsavel: 'Executor do Contrato',
          acoes: [
            'Analisar processo SEI',
            'Verificar atesto da Comissão',
            'Realizar atesto próprio'
          ]
        },
        liquidacao: {
          responsavel: 'Setor Financeiro/Administrativo',
          acoes: [
            'Proceder trâmites de liquidação',
            'Encaminhar para pagamento'
          ]
        }
      },

      baseLegal: 'Lei nº 4.320/1964 - Arts. 62 e 63'
    }
  };

  // ============================================================================
  // SEÇÃO 2: CONTROLE DE QUALIDADE NO RECEBIMENTO
  // Conforme Manual da Alimentação Escolar DF - Item 12
  // ============================================================================

  var CONTROLE_QUALIDADE = {
    /**
     * Checklist de Verificação de Qualidade
     * Tabela 1 do Manual de Análise Processual - Seção 3.1
     */
    checklist: {
      documentacao: {
        categoria: '1. Documentação',
        pontoControle: 'Nota Fiscal / Termo de Recebimento',
        criterio: 'Produtos listados correspondem aos entregues? Quantidade, unidade e marca corretas?'
      },
      transporte: {
        categoria: '2. Transporte',
        itens: [
          {
            pontoControle: 'Veículo de Entrega',
            criterio: 'Baú fechado, limpo, bom estado. Refrigerado para produtos que exigem.'
          },
          {
            pontoControle: 'Entregador',
            criterio: 'Uniforme limpo, boas práticas de higiene.'
          }
        ]
      },
      embalagens: {
        categoria: '3. Embalagens',
        pontoControle: 'Embalagem Primária e Secundária',
        criterio: 'Íntegras, limpas, secas, sem violação, amassados, ferrugem ou estufamento.'
      },
      rotulagem: {
        categoria: '4. Rotulagem',
        itens: [
          {
            pontoControle: 'Informações do Rótulo',
            criterio: 'Legível, com validade, lote, fabricante, selo SIF quando aplicável.'
          },
          {
            pontoControle: 'Prazo de Validade',
            criterio: 'Dentro do prazo. Perecíveis: mínimo 4-7 dias conforme contrato.'
          },
          {
            pontoControle: 'Inscrição Obrigatória',
            criterio: '"PRODUTO INSTITUCIONAL - PROIBIDA A VENDA" clara e indelével.'
          }
        ]
      },
      caracteristicasSensoriais: {
        categoria: '5. Características Sensoriais',
        itens: [
          {
            pontoControle: 'Aparência, Cor, Odor, Textura',
            criterio: 'Características próprias. Ausência de mofo, manchas, odor alterado.'
          },
          {
            pontoControle: 'Hortifrúti',
            criterio: 'Frescos, íntegros, maturação adequada, sem deterioração ou pragas.'
          }
        ]
      },
      temperatura: {
        categoria: '6. Temperatura (CRÍTICO)',
        pontoControle: 'Medição com Termômetro',
        criterio: 'Temperaturas dentro dos limites no ato da entrega.',
        limites: {
          congelados: { max: -12, unidade: '°C' },
          carnesResfriadas: { max: 7, unidade: '°C' },
          pescadoResfriado: { max: 3, unidade: '°C' },
          outrosRefrigerados: { max: 10, unidade: '°C' }
        }
      }
    },

    /**
     * Critérios de Temperatura
     * Manual Item 12.1 e Nota Técnica 1/2025
     */
    temperaturas: {
      CONGELADOS: { min: -18, max: -12, unidade: '°C', descricao: 'Produtos congelados' },
      RESFRIADOS: { min: 0, max: 10, unidade: '°C', descricao: 'Produtos resfriados em geral' },
      CARNES_RESFRIADAS: { min: 0, max: 7, unidade: '°C', descricao: 'Carnes resfriadas' },
      PESCADO_RESFRIADO: { min: 0, max: 3, unidade: '°C', descricao: 'Pescado resfriado' }
    },

    /**
     * Validade Mínima
     */
    validadeMinima: {
      pereciveis: { dias: 4, descricao: 'Mínimo 4-7 dias conforme contrato' },
      naoPerecíveis: { dias: 30, descricao: 'Mínimo 30 dias' }
    }
  };

  // ============================================================================
  // SEÇÃO 3: GESTÃO DE NÃO CONFORMIDADES E RECUSAS
  // Conforme Manual de Análise Processual - Seção 3.2 e 3.3
  // ============================================================================

  var GESTAO_RECUSAS = {
    /**
     * Motivos de Recusa Padronizados
     * Qualquer item que não atenda aos critérios do checklist
     */
    motivosRecusa: {
      TEMPERATURA_INADEQUADA: {
        codigo: 'TEMP_001',
        descricao: 'Temperatura inadequada',
        categoria: 'Temperatura',
        criticidade: 'ALTA'
      },
      EMBALAGEM_VIOLADA: {
        codigo: 'EMB_001',
        descricao: 'Embalagem violada ou danificada',
        categoria: 'Embalagem',
        criticidade: 'ALTA'
      },
      PRODUTO_VENCIDO: {
        codigo: 'VAL_001',
        descricao: 'Produto vencido',
        categoria: 'Validade',
        criticidade: 'CRITICA'
      },
      VALIDADE_INSUFICIENTE: {
        codigo: 'VAL_002',
        descricao: 'Validade insuficiente (< mínimo contratual)',
        categoria: 'Validade',
        criticidade: 'MEDIA'
      },
      CARACTERISTICAS_ALTERADAS: {
        codigo: 'QUAL_001',
        descricao: 'Características organolépticas alteradas (mofo, odor, cor)',
        categoria: 'Qualidade',
        criticidade: 'ALTA'
      },
      QUANTIDADE_DIVERGENTE: {
        codigo: 'QTD_001',
        descricao: 'Quantidade divergente da NF/Termo',
        categoria: 'Quantidade',
        criticidade: 'MEDIA'
      },
      PRODUTO_DIFERENTE: {
        codigo: 'PROD_001',
        descricao: 'Produto diferente do solicitado/contratado',
        categoria: 'Produto',
        criticidade: 'ALTA'
      },
      PRESENCA_PRAGAS: {
        codigo: 'QUAL_002',
        descricao: 'Presença de pragas ou sujidades',
        categoria: 'Qualidade',
        criticidade: 'CRITICA'
      },
      SEM_ROTULAGEM: {
        codigo: 'ROT_001',
        descricao: 'Sem rotulagem ou rotulagem incompleta',
        categoria: 'Rotulagem',
        criticidade: 'MEDIA'
      },
      TRANSPORTE_INADEQUADO: {
        codigo: 'TRANS_001',
        descricao: 'Transporte inadequado',
        categoria: 'Transporte',
        criticidade: 'MEDIA'
      },
      SEM_INSCRICAO_INSTITUCIONAL: {
        codigo: 'ROT_002',
        descricao: 'Sem inscrição "PRODUTO INSTITUCIONAL - PROIBIDA A VENDA"',
        categoria: 'Rotulagem',
        criticidade: 'MEDIA'
      },
      MARCA_DIVERGENTE: {
        codigo: 'PROD_002',
        descricao: 'Marca diferente da contratada',
        categoria: 'Produto',
        criticidade: 'MEDIA'
      }
    },

    /**
     * Procedimento de Recusa (Manual Seção 3.2)
     */
    procedimentoRecusa: {
      passo1: {
        acao: 'NÃO ACEITAR E DEVOLVER',
        descricao: 'Separar produto não conforme e devolver ao entregador no ato',
        obrigatorio: true
      },
      passo2: {
        acao: 'ANOTAR NO TERMO DE RECEBIMENTO',
        descricao: 'Registrar no campo Observações de ambas as vias',
        campos: [
          'Nome do produto recusado',
          'Quantidade exata recusada',
          'Motivo detalhado da recusa'
        ],
        obrigatorio: true
      },
      passo3: {
        acao: 'INFORMAR A GESTÃO DO CONTRATO',
        descricao: 'Comunicar imediatamente à UNIAE e ao Executor do Contrato',
        meio: 'E-mail ou outro meio formal',
        obrigatorio: true
      }
    },

    /**
     * Prazos de Substituição (Manual Seção 3.3 e Nota Técnica 1/2025)
     */
    prazosSubstituicao: {
      PERECIVEL_URGENTE: {
        prazo: 24,
        unidade: 'horas',
        produtos: ['pão', 'leite', 'iogurte', 'carne fresca', 'peixe fresco', 'verduras', 'frutas'],
        descricao: 'Produtos altamente perecíveis'
      },
      NAO_PERECIVEL: {
        prazo: 5,
        unidade: 'dias úteis',
        descricao: 'Produtos não perecíveis ou de maior durabilidade'
      }
    },

    /**
     * Consequências da Não Substituição
     */
    consequenciasNaoSubstituicao: [
      'Registro formal pelo executor do contrato',
      'Aplicação de penalidades contratuais',
      'Glosa do valor correspondente na fatura',
      'Responsabilização por inexecução de cláusula contratual'
    ]
  };


  // ============================================================================
  // SEÇÃO 4: PONTOS CRÍTICOS DE CONTROLE (AUDITORIA)
  // Conforme Relatório de Auditoria Nº 02/2014 - Seção 4
  // ============================================================================

  var PONTOS_CRITICOS = {
    /**
     * Cronologia Documental (Seção 4.1)
     * REGRA CARDINAL: Atesto SEMPRE após o fato gerador
     */
    cronologiaDocumental: {
      regra: 'O ato de atestar deve ocorrer em data igual ou posterior ao evento que comprova',
      aplicacao: {
        termoRecebimento: 'Data do atesto = Data da entrega física',
        notaFiscal: 'Data do atesto >= Data de emissão da NF e >= Data de recebimento dos Termos'
      },
      procedimentoCorrecao: {
        identificacao: 'Ao constatar erro na NF, notificar empresa imediatamente',
        cancelamento: 'Empresa deve cancelar NF original e emitir nova correta',
        alternativa: 'Carta de Correção Eletrônica (CC-e) para erros que não alterem valor do imposto',
        instrucaoProcessual: [
          'NF original com anotação "CANCELADA" ou "SUBSTITUÍDA PELA NF Nº XXX"',
          'Nova NF ou Carta de Correção',
          'Despacho explicando o ocorrido'
        ]
      },
      violacao: {
        descricao: 'Atesto com data anterior à emissão do documento fiscal',
        consequencia: 'Invalida fidedignidade do processo - irregularidade administrativa grave'
      }
    },

    /**
     * Tempestividade do Atesto (Seção 4.2)
     * Prazo de 5 dias úteis para análise pela Comissão
     */
    tempestividadeAtesto: {
      prazo: 5,
      unidade: 'dias úteis',
      importancia: [
        'Garantir fluxo de pagamento dentro do vencimento contratual (30 dias)',
        'Evitar multas e juros por atraso',
        'Manter fidedignidade dos controles'
      ],
      mecanismoControle: {
        planilha: {
          colunas: [
            'Nº do Processo SEI',
            'Fornecedor',
            'Nº da Nota Fiscal',
            'Data de Recebimento na UNIAE',
            'Prazo Final para Atesto',
            'Data do Atesto',
            'Status'
          ]
        },
        gestaoVisual: 'Quadros ou sistemas digitais (Kanban) para visualizar fluxo'
      }
    },

    /**
     * Conformidade da Entrega - Horário (Seção 4.3)
     */
    horarioEntrega: {
      horarioContratual: {
        manha: { inicio: '08:00', fim: '12:00' },
        tarde: { inicio: '14:00', fim: '18:00' }
      },
      procedimentoForaHorario: {
        passo1: 'Registrar no campo Observações do Termo: "Recebido às HH:MM, fora do horário contratual"',
        passo2: 'Comunicar no mesmo dia à Comissão da UNIAE e ao Executor',
        passo3: 'UNIAE compila ocorrências e envia relatório mensal ao Executor',
        passo4: 'Executor notifica empresa e alerta para sanções em caso de reincidência'
      }
    },

    /**
     * Registro Formal de Irregularidades (Seção 4.4)
     */
    registroIrregularidades: {
      principio: 'Gestão e fiscalização baseiam-se em evidências documentais',
      exigencia: 'Todo problema identificado deve ser formalmente registrado',
      consequenciaNaoRegistro: 'Impossibilidade de cobrar correções ou aplicar penalidades'
    }
  };

  // ============================================================================
  // SEÇÃO 5: ALIMENTOS PERECÍVEIS - PROCEDIMENTOS ESPECIAIS
  // Conforme Nota Técnica Nº 1/2025 - SEE/SUAPE/DIAE/GPAE
  // ============================================================================

  var PERECIVEIS = {
    /**
     * Definição de Alimentos Perecíveis
     */
    definicao: 'Pães, hortifrútis, carnes in natura, ovo, queijos, iogurte e todos que não sejam não perecíveis',

    /**
     * Alimentos Vencidos na UE (Item 4)
     */
    alimentosVencidos: {
      responsabilidade: 'Unidade Escolar é responsável pela estocagem e armazenamento',
      procedimento: {
        comunicacao: 'Comunicar equipe técnica de nutricionistas',
        documentos: [
          'Cópia do recibo de entrega',
          'Registro fotográfico',
          'Formulário de Registro e Descarte de Alimento Vencido (ANEXO IV)'
        ],
        encaminhamento: 'Via SEI, por memorando, à UNIAE',
        acondicionamento: {
          semRefrigeracao: 'Sacos pretos identificados "IMPRÓPRIOS PARA O CONSUMO" até visita do nutricionista',
          congelados: 'Separar no estoque, sacos pretos identificados, sob congelamento até visita'
        }
      }
    },

    /**
     * Alimentos Impróprios (Item 5)
     */
    alimentosImproprios: {
      definicao: 'Visivelmente deteriorados, alterações organolépticas, contaminados, risco à saúde',
      origens: {
        recebimentoInadequado: [
          'Temperaturas inadequadas',
          'Já em descongelamento',
          'Visivelmente deteriorados',
          'Vícios ocultos (identificados na manipulação)',
          'Presença de pragas urbanas'
        ],
        falhaEstoque: [
          'Manutenção incorreta de temperatura',
          'Falhas em freezers/geladeiras',
          'Descongelamento sem controle',
          'Más condições estruturais/higiene'
        ]
      },
      documentosObrigatorios: [
        'Cópia do recibo de entrega',
        'Registro fotográfico da inconformidade (problema, lote, validade)',
        'Formulário de Notificação de Qualidade de Alimento Perecível (ANEXO II)'
      ]
    },

    /**
     * Descarte de Alimentos (Item 7)
     */
    descarte: {
      presencaObrigatoria: 'Diretor e/ou vice ou responsável pela alimentação + nutricionista',
      procedimentos: {
        liquidos: {
          tipos: 'Sucos, iogurtes (exceto óleo)',
          procedimento: 'Abrir embalagens, descartar na pia, embalagens em sacos de lixo'
        },
        ovos: {
          procedimento: 'Descartar em sacos pretos com outros lixos orgânicos, identificar "IMPRÓPRIO"',
          coleta: 'Colocar em contêineres próximo ao horário de coleta SLU'
        },
        carneos: {
          tipos: 'Carne bovina, pescados, frango, suína',
          procedimento: 'Sacos pretos resistentes com lixos orgânicos, identificar "IMPRÓPRIO"',
          horario: 'Até 2h antes da coleta diurna ou a partir das 21h para coleta noturna',
          proibicao: 'TERMINANTEMENTE PROIBIDO o aterramento (risco ambiental)'
        }
      }
    },

    /**
     * Reposição de Alimentos (Itens 8 e 9)
     */
    reposicao: {
      pelaUnidadeEscolar: {
        responsabilidade: 'Equipe gestora repõe alimento vencido',
        criterios: [
          'Qualidade igual ou superior',
          'Quantidade igual',
          'Equivalência nutricional',
          'Respeitar especificidades do alimento'
        ],
        comprovacao: 'Nota fiscal original atestada pelo nutricionista',
        prazo: 'Prioritariamente para distribuição subsequente'
      },
      peloFornecedor: {
        situacoes: [
          'Recusa no recebimento (registrada no recibo)',
          'Identificação posterior de inconformidade (vício oculto)',
          'Falhas nos parâmetros de qualidade do edital'
        ],
        prazoAposRecusa: 24, // horas
        prazoOutrosCasos: 5, // dias úteis
        documentosSeNaoRepor: [
          'Cópia do recibo (com registro da recusa)',
          'Registro fotográfico',
          'Formulário de Notificação de Qualidade'
        ]
      }
    }
  };

  // ============================================================================
  // SEÇÃO 6: VALIDAÇÕES DE NEGÓCIO
  // ============================================================================

  /**
   * Valida dados de recebimento conforme regras de negócio
   */
  function validarRecebimento(dados) {
    try {
      var erros = [];
      var avisos = [];

      // Validações obrigatórias
      if (!dados.unidadeEscolar) erros.push('Unidade Escolar é obrigatória');
      if (!dados.dataEntrega) erros.push('Data de Entrega é obrigatória');
      if (!dados.responsavel) erros.push('Responsável pelo recebimento é obrigatório');
      if (!dados.matriculaResponsavel) erros.push('Matrícula do responsável é obrigatória');

      // Validar elementos do atesto digital
      if (!dados.assinatura && !dados.assinaturaDigital) erros.push('Assinatura digital é obrigatória no Termo de Recebimento');
      if (!dados.identificacaoUE && !dados.carimboUE) avisos.push('Identificação digital da UE é obrigatória no Termo de Recebimento'); // carimboUE mantido para compatibilidade

      // Validar cronologia
      if (dados.dataAtesto && dados.dataEntrega) {
        var dataAtesto = new Date(dados.dataAtesto);
        var dataEntrega = new Date(dados.dataEntrega);
        if (dataAtesto < dataEntrega) {
          erros.push('Data do atesto não pode ser anterior à data de entrega (Regra de Cronologia Documental)');
        }
      }

      // Validar temperatura para perecíveis
      if (dados.tipoGenero === 'PERECIVEL' && dados.temperaturaAferida !== undefined) {
        var limites = CONTROLE_QUALIDADE.temperaturas[dados.tipoConservacao];
        if (limites) {
          if (dados.temperaturaAferida > limites.max) {
            erros.push('Temperatura (' + dados.temperaturaAferida + '°C) acima do limite máximo (' + limites.max + '°C)');
          }
          if (dados.temperaturaAferida < limites.min) {
            avisos.push('Temperatura (' + dados.temperaturaAferida + '°C) abaixo do limite mínimo (' + limites.min + '°C)');
          }
        }
      }

      return {
        valido: erros.length === 0,
        erros: erros,
        avisos: avisos
      };
    } catch (error) {
      Logger.log("Erro em validarRecebimento: " + error.message);
      throw error;
    }
  }

  /**
   * Valida dados de análise da Comissão
   */
  function validarAnaliseComissao(dados) {
    try {
      var erros = [];
      var avisos = [];

      // Validar composição da comissão
      if (!dados.membrosPresentes || dados.membrosPresentes.length < FLUXO_PROCESSUAL.ETAPA_3.minimoMembros) {
        erros.push('Mínimo de ' + FLUXO_PROCESSUAL.ETAPA_3.minimoMembros + ' membros da Comissão necessários');
      }

      // Validar checklist de análise
      if (!dados.somaVerificada) {
        erros.push('Verificação da soma dos quantitativos é obrigatória');
      }
      if (!dados.atestoEscolarVerificado) {
        erros.push('Verificação do atesto escolar é obrigatória');
      }
      if (!dados.conformidadeNFVerificada) {
        erros.push('Verificação da conformidade da NF é obrigatória');
      }

      // Validar prazo
      if (dados.diasDesdeRecebimento > FLUXO_PROCESSUAL.ETAPA_3.prazo) {
        avisos.push('Prazo de ' + FLUXO_PROCESSUAL.ETAPA_3.prazo + ' dias úteis excedido');
      }

      // Validar cronologia
      if (dados.dataAtestoComissao && dados.dataEmissaoNF) {
        var dataAtesto = new Date(dados.dataAtestoComissao);
        var dataEmissao = new Date(dados.dataEmissaoNF);
        if (dataAtesto < dataEmissao) {
          erros.push('Data do atesto da Comissão não pode ser anterior à emissão da NF');
        }
      }

      return {
        valido: erros.length === 0,
        erros: erros,
        avisos: avisos
      };
    } catch (error) {
      Logger.log("Erro em validarAnaliseComissao: " + error.message);
      throw error;
    }
  }

  /**
   * Calcula prazo de substituição baseado no tipo de produto
   */
  function calcularPrazoSubstituicao(produto, tipoGenero) {
    try {
      if (tipoGenero === 'NAO_PERECIVEL') {
        return {
          prazo: GESTAO_RECUSAS.prazosSubstituicao.NAO_PERECIVEL.prazo,
          unidade: GESTAO_RECUSAS.prazosSubstituicao.NAO_PERECIVEL.unidade,
          dataLimite: calcularDataLimite(5, 'dias_uteis')
        };
      }

      // Verificar se é perecível urgente
      var produtoLower = (produto || '').toLowerCase();
      var produtosUrgentes = GESTAO_RECUSAS.prazosSubstituicao.PERECIVEL_URGENTE.produtos;

      var isUrgente = produtosUrgentes.some(function(p) {
        return produtoLower.indexOf(p) >= 0;
      });

      if (isUrgente) {
        return {
          prazo: GESTAO_RECUSAS.prazosSubstituicao.PERECIVEL_URGENTE.prazo,
          unidade: GESTAO_RECUSAS.prazosSubstituicao.PERECIVEL_URGENTE.unidade,
          dataLimite: calcularDataLimite(24, 'horas')
        };
      }

      // Padrão para outros perecíveis
      return {
        prazo: 24,
        unidade: 'horas',
        dataLimite: calcularDataLimite(24, 'horas')
      };
    } catch (error) {
      Logger.log("Erro em calcularPrazoSubstituicao: " + error.message);
      throw error;
    }
  }

  /**
   * Calcula data limite considerando dias úteis ou horas
   */
  function calcularDataLimite(quantidade, unidade) {
    var dataLimite = new Date();

    if (unidade === 'horas') {
      dataLimite.setHours(dataLimite.getHours() + quantidade);
    } else if (unidade === 'dias_uteis') {
      var diasAdicionados = 0;
      while (diasAdicionados < quantidade) {
        dataLimite.setDate(dataLimite.getDate() + 1);
        var diaSemana = dataLimite.getDay();
        if (diaSemana !== 0 && diaSemana !== 6) { // Não é sábado nem domingo
          diasAdicionados++;
        }
      }
    } else {
      dataLimite.setDate(dataLimite.getDate() + quantidade);
    }

    return dataLimite;
  }

  /**
   * Verifica se entrega está dentro do horário contratual
   */
  function verificarHorarioEntrega(horaEntrega) {
    try {
      if (!horaEntrega) return { dentroHorario: true, mensagem: '' };

      var hora = parseInt(horaEntrega.split(':')[0], 10);
      var minuto = parseInt(horaEntrega.split(':')[1], 10);
      var totalMinutos = hora * 60 + minuto;

      var horarios = PONTOS_CRITICOS.horarioEntrega.horarioContratual;

      // Manhã: 08:00 - 12:00
      var inicioManha = 8 * 60;
      var fimManha = 12 * 60;

      // Tarde: 14:00 - 18:00
      var inicioTarde = 14 * 60;
      var fimTarde = 18 * 60;

      var dentroHorario = (totalMinutos >= inicioManha && totalMinutos <= fimManha) ||
                          (totalMinutos >= inicioTarde && totalMinutos <= fimTarde);

      return {
        dentroHorario: dentroHorario,
        mensagem: dentroHorario ? '' : 'Entrega fora do horário contratual (08:00-12:00 / 14:00-18:00)'
      };
    } catch (error) {
      Logger.log("Erro em verificarHorarioEntrega: " + error.message);
      throw error;
    }
  }

  /**
   * Gera score de conformidade do processo
   */
  function calcularScoreConformidade(processo) {
    try {
      var score = 100;
      var pendencias = [];

      // Verificar Etapa 1 - Recebimento
      if (!processo.entregas || processo.entregas.length === 0) {
        score -= 25;
        pendencias.push({ etapa: 'RECEBIMENTO', descricao: 'Nenhum recebimento registrado', criticidade: 'ALTA' });
      } else {
        processo.entregas.forEach(function(entrega) {
          if (!entrega.atesto || !entrega.atesto.assinatura) {
            score -= 10;
            pendencias.push({ etapa: 'RECEBIMENTO', descricao: 'Termo sem assinatura - ' + entrega.unidadeEscolar, criticidade: 'ALTA' });
          }
          if (!entrega.atesto || !entrega.atesto.matricula) {
            score -= 5;
            pendencias.push({ etapa: 'RECEBIMENTO', descricao: 'Termo sem matrícula - ' + entrega.unidadeEscolar, criticidade: 'MEDIA' });
          }
          if (!entrega.atesto || !entrega.atesto.identificacaoUE) {
            score -= 5;
            pendencias.push({ etapa: 'RECEBIMENTO', descricao: 'Termo sem identificação digital da UE - ' + entrega.unidadeEscolar, criticidade: 'MEDIA' });
          }
        });
      }

      // Verificar Etapa 3 - Análise Comissão
      if (!processo.analiseComissao || processo.analiseComissao.status !== 'CONCLUIDO') {
        score -= 25;
        pendencias.push({ etapa: 'ANALISE_COMISSAO', descricao: 'Análise da Comissão pendente', criticidade: 'ALTA' });
      }

      // Verificar prazos
      if (processo.dataAbertura) {
        var diasDesdeAbertura = Math.floor((new Date() - new Date(processo.dataAbertura)) / (1000 * 60 * 60 * 24));
        if (diasDesdeAbertura > 5 && (!processo.analiseComissao || processo.analiseComissao.status !== 'CONCLUIDO')) {
          score -= 15;
          pendencias.push({ etapa: 'PRAZO', descricao: 'Prazo de 5 dias úteis excedido', criticidade: 'ALTA' });
        }
      }

      // Verificar recusas pendentes
      if (processo.recusas) {
        var recusasPendentes = processo.recusas.filter(function(r) {
          return r.aguardandoSubstituicao && !r.substituicaoRealizada;
        });
        if (recusasPendentes.length > 0) {
          score -= 5 * recusasPendentes.length;
          pendencias.push({ etapa: 'RECUSAS', descricao: recusasPendentes.length + ' recusa(s) aguardando substituição', criticidade: 'MEDIA' });
        }
      }

      return {
        score: Math.max(0, score),
        conforme: score >= 80,
        pendencias: pendencias
      };
    } catch (error) {
      Logger.log("Erro em calcularScoreConformidade: " + error.message);
      throw error;
    }
  }

  // ============================================================================
  // INTERFACE PÚBLICA
  // ============================================================================

  return {
    // Constantes
    FLUXO_PROCESSUAL: FLUXO_PROCESSUAL,
    CONTROLE_QUALIDADE: CONTROLE_QUALIDADE,
    GESTAO_RECUSAS: GESTAO_RECUSAS,
    PONTOS_CRITICOS: PONTOS_CRITICOS,
    PERECIVEIS: PERECIVEIS,

    // Funções de validação
    validarRecebimento: validarRecebimento,
    validarAnaliseComissao: validarAnaliseComissao,

    // Funções utilitárias
    calcularPrazoSubstituicao: calcularPrazoSubstituicao,
    calcularDataLimite: calcularDataLimite,
    verificarHorarioEntrega: verificarHorarioEntrega,
    calcularScoreConformidade: calcularScoreConformidade,

    // Versão
    VERSION: '4.0.0'
  };

})();

// Alias global para compatibilidade
var BUSINESS_RULES = BusinessRules;
var WORKFLOW_ATESTO = BusinessRules.FLUXO_PROCESSUAL;
