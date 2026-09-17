/**
 * Core_Conformidade_Auditoria.gs
 * Sistema de Conformidade e Controle para Auditoria
 * Baseado no Relatório de Auditoria N.º 02/2014 - DISED/CONAS/CONT/STC
 *
 * Implementa controles para:
 * - Verificação de certidões de regularidade fiscal
 * - Controle de datas de atesto vs emissão de NF
 * - Validação de documentação para pagamento
 * - Rastreabilidade de processos
 */

// ============================================================================
// CONSTANTES E CONFIGURAÇÕES
// ============================================================================

const CONFORMIDADE_CONFIG = {
  // Certidões obrigatórias (Lei 8.666/93, Art. 29)
  CERTIDOES_OBRIGATORIAS: [
    { codigo: 'CND_FEDERAL', nome: 'Certidão Conjunta de Débitos Federais e Dívida Ativa', prazoValidadeDias: 180 },
    { codigo: 'CRF_FGTS', nome: 'Certificado de Regularidade do FGTS', prazoValidadeDias: 30 },
    { codigo: 'CND_TRABALHISTA', nome: 'Certidão Negativa de Débitos Trabalhistas', prazoValidadeDias: 180 },
    { codigo: 'CND_DF', nome: 'Certidão de Regularidade Fiscal com a Fazenda do DF', prazoValidadeDias: 90 },
    { codigo: 'CND_INSS', nome: 'Certidão de Regularidade com a Seguridade Social', prazoValidadeDias: 180 }
  ],

  // Documentos obrigatórios para liquidação (Lei 4.320/64, Arts. 62-63)
  DOCUMENTOS_LIQUIDACAO: [
    'Nota Fiscal/Fatura',
    'Termo de Recebimento Definitivo',
    'Atesto do Executor',
    'Certidões de Regularidade Fiscal',
    'Medição de Serviços (se aplicável)'
  ],

  // Tipos de não conformidade
  TIPOS_NAO_CONFORMIDADE: {
    ATESTO_ANTECIPADO: 'Atesto anterior à emissão da NF',
    CERTIDAO_VENCIDA: 'Certidão vencida na data do pagamento',
    CERTIDAO_AUSENTE: 'Certidão obrigatória ausente',
    NF_DESCRICAO_GENERICA: 'Descrição genérica na Nota Fiscal',
    DOCUMENTACAO_INCOMPLETA: 'Documentação incompleta para liquidação',
    DIVERGENCIA_VALORES: 'Divergência entre valores contratados e faturados'
  },

  // Status de verificação
  STATUS_VERIFICACAO: {
    PENDENTE: 'PENDENTE',
    CONFORME: 'CONFORME',
    NAO_CONFORME: 'NAO_CONFORME',
    REGULARIZADO: 'REGULARIZADO'
  }
};

// ============================================================================
// FUNÇÕES DE VERIFICAÇÃO DE CERTIDÕES
// ============================================================================

/**
 * Verifica regularidade fiscal do fornecedor
 * Conforme Lei 8.666/93, Arts. 29 e 55
 *
 * @param {Object} dados - Dados do fornecedor e certidões
 * @returns {Object} Resultado da verificação
 */
function verificarRegularidadeFiscal(dados) {
  try {
    try {
      const resultado = {
        fornecedor: dados.fornecedor,
        cnpj: dados.cnpj,
        dataVerificacao: new Date().toISOString(),
        certidoes: [],
        statusGeral: CONFORMIDADE_CONFIG.STATUS_VERIFICACAO.CONFORME,
        naoConformidades: []
      };

      const hoje = new Date();

      CONFORMIDADE_CONFIG.CERTIDOES_OBRIGATORIAS.forEach(certidaoConfig => {
        const certidaoFornecida = (dados.certidoes || []).find(function(c) { return c.tipo === certidaoConfig.codigo; });

        const verificacao = {
          tipo: certidaoConfig.codigo,
          nome: certidaoConfig.nome,
          obrigatoria: true
        };

        if (!certidaoFornecida) {
          verificacao.status = 'AUSENTE';
          verificacao.conforme = false;
          resultado.naoConformidades.push({
            tipo: CONFORMIDADE_CONFIG.TIPOS_NAO_CONFORMIDADE.CERTIDAO_AUSENTE,
            descricao: `Certidão não apresentada: ${certidaoConfig.nome}`,
            gravidade: 'ALTA'
          });
          resultado.statusGeral = CONFORMIDADE_CONFIG.STATUS_VERIFICACAO.NAO_CONFORME;
        } else {
          verificacao.numero = certidaoFornecida.numero;
          verificacao.dataEmissao = certidaoFornecida.dataEmissao;
          verificacao.dataValidade = certidaoFornecida.dataValidade;

          const dataValidade = new Date(certidaoFornecida.dataValidade);

          if (dataValidade < hoje) {
            verificacao.status = 'VENCIDA';
            verificacao.conforme = false;
            resultado.naoConformidades.push({
              tipo: CONFORMIDADE_CONFIG.TIPOS_NAO_CONFORMIDADE.CERTIDAO_VENCIDA,
              descricao: `Certidão vencida: ${certidaoConfig.nome} (validade: ${certidaoFornecida.dataValidade})`,
              gravidade: 'ALTA'
            });
            resultado.statusGeral = CONFORMIDADE_CONFIG.STATUS_VERIFICACAO.NAO_CONFORME;
          } else {
            verificacao.status = 'VÁLIDA';
            verificacao.conforme = true;

            // Alertar se próxima do vencimento (menos de 15 dias)
            const diasRestantes = Math.ceil((dataValidade - hoje) / (1000 * 60 * 60 * 24));
            if (diasRestantes <= 15) {
              verificacao.alerta = `Vence em ${diasRestantes} dias`;
            }
          }
        }

        resultado.certidoes.push(verificacao);
      });

      // Salvar verificação
      salvarVerificacaoConformidade(resultado);

      return { success: true, data: resultado };

    } catch (error) {
      Logger.log('Erro em verificarRegularidadeFiscal: ' + error);
      return { success: false, error: error.message };
    }
  } catch (error) {
    Logger.log("Erro em verificarRegularidadeFiscal: " + error.message);
    throw error;
  }
}

/**
 * Verifica consistência de datas (atesto vs emissão NF)
 * Conforme recomendação do Relatório de Auditoria - Seção 2.1
 *
 * @param {Object} dados - Dados do processo
 * @returns {Object} Resultado da verificação
 */
function verificarConsistenciaDatas(dados) {
  try {
    try {
      const resultado = {
        processoId: dados.processoId,
        notaFiscal: dados.notaFiscal,
        dataVerificacao: new Date().toISOString(),
        verificacoes: [],
        conforme: true,
        naoConformidades: []
      };

      const dataEmissaoNF = new Date(dados.dataEmissaoNF);
      const dataAtesto = new Date(dados.dataAtesto);
      const dataRecebimento = dados.dataRecebimento ? new Date(dados.dataRecebimento) : null;

      // Verificação 1: Atesto não pode ser anterior à emissão da NF
      if (dataAtesto < dataEmissaoNF) {
        resultado.conforme = false;
        resultado.naoConformidades.push({
          tipo: CONFORMIDADE_CONFIG.TIPOS_NAO_CONFORMIDADE.ATESTO_ANTECIPADO,
          descricao: `Data de atesto (${formatarData(dataAtesto)}) anterior à emissão da NF (${formatarData(dataEmissaoNF)})`,
          gravidade: 'ALTA',
          recomendacao: 'Verificar se houve substituição de NF e documentar justificativa nos autos'
        });
      }

      resultado.verificacoes.push({
        item: 'Data Atesto vs Emissão NF',
        dataAtesto: formatarData(dataAtesto),
        dataEmissaoNF: formatarData(dataEmissaoNF),
        conforme: dataAtesto >= dataEmissaoNF
      });

      // Verificação 2: Recebimento deve ser posterior ou igual à emissão
      if (dataRecebimento && dataRecebimento < dataEmissaoNF) {
        resultado.conforme = false;
        resultado.naoConformidades.push({
          tipo: CONFORMIDADE_CONFIG.TIPOS_NAO_CONFORMIDADE.ATESTO_ANTECIPADO,
          descricao: `Data de recebimento (${formatarData(dataRecebimento)}) anterior à emissão da NF`,
          gravidade: 'MÉDIA',
          recomendacao: 'Verificar cronologia dos eventos e documentar'
        });
      }

      if (dataRecebimento) {
        resultado.verificacoes.push({
          item: 'Data Recebimento vs Emissão NF',
          dataRecebimento: formatarData(dataRecebimento),
          dataEmissaoNF: formatarData(dataEmissaoNF),
          conforme: dataRecebimento >= dataEmissaoNF
        });
      }

      return { success: true, data: resultado };

    } catch (error) {
      Logger.log('Erro em verificarConsistenciaDatas: ' + error);
      return { success: false, error: error.message };
    }
  } catch (error) {
    Logger.log("Erro em verificarConsistenciaDatas: " + error.message);
    throw error;
  }
}


// ============================================================================
// FUNÇÕES DE VERIFICAÇÃO DE DOCUMENTAÇÃO
// ============================================================================

/**
 * Verifica documentação para liquidação de despesa
 * Conforme Lei 4.320/64, Arts. 62-63
 *
 * @param {Object} dados - Dados do processo de pagamento
 * @returns {Object} Resultado da verificação
 */
function verificarDocumentacaoLiquidacao(dados) {
  try {
    try {
      const resultado = {
        processoId: dados.processoId,
        dataVerificacao: new Date().toISOString(),
        documentos: [],
        statusGeral: CONFORMIDADE_CONFIG.STATUS_VERIFICACAO.CONFORME,
        naoConformidades: [],
        recomendacoes: []
      };

      // Verificar cada documento obrigatório
      const documentosVerificados = {
        'Nota Fiscal/Fatura': {
          presente: !!dados.notaFiscal,
          numero: (dados.notaFiscal && dados.notaFiscal.numero),
          valor: (dados.notaFiscal && dados.notaFiscal.valor),
          descricaoDetalhada: (dados.notaFiscal && dados.notaFiscal.descricaoDetalhada)
        },
        'Termo de Recebimento Definitivo': {
          presente: !!dados.termoRecebimento,
          assinado: (dados.termoRecebimento && dados.termoRecebimento.assinado),
          dataAssinatura: (dados.termoRecebimento && dados.termoRecebimento.dataAssinatura)
        },
        'Atesto do Executor': {
          presente: !!dados.atestoExecutor,
          executor: (dados.atestoExecutor && dados.atestoExecutor.nome),
          matricula: (dados.atestoExecutor && dados.atestoExecutor.matricula),
          data: (dados.atestoExecutor && dados.atestoExecutor.data)
        },
        'Certidões de Regularidade Fiscal': {
          presente: ((dados.certidoes || []).length > 0),
          quantidade: ((dados.certidoes || []).length)
        }
      };

      for (const [doc, info] of Object.entries(documentosVerificados)) {
        const verificacao = {
          documento: doc,
          presente: info.presente,
          detalhes: info
        };

        if (!info.presente) {
          verificacao.conforme = false;
          resultado.statusGeral = CONFORMIDADE_CONFIG.STATUS_VERIFICACAO.NAO_CONFORME;
          resultado.naoConformidades.push({
            tipo: CONFORMIDADE_CONFIG.TIPOS_NAO_CONFORMIDADE.DOCUMENTACAO_INCOMPLETA,
            descricao: `Documento ausente: ${doc}`,
            gravidade: 'ALTA'
          });
        } else {
          verificacao.conforme = true;
        }

        resultado.documentos.push(verificacao);
      }

      // Verificar descrição detalhada na NF (Seção 2.2 do Relatório)
      if (dados.notaFiscal && !dados.notaFiscal.descricaoDetalhada) {
        resultado.naoConformidades.push({
          tipo: CONFORMIDADE_CONFIG.TIPOS_NAO_CONFORMIDADE.NF_DESCRICAO_GENERICA,
          descricao: 'Nota Fiscal com descrição genérica dos serviços/produtos',
          gravidade: 'MÉDIA',
          recomendacao: 'Exigir do fornecedor NF com descrição detalhada conforme Lei 4.320/64, Art. 63, §2º, III'
        });
      }

      // Verificar valores
      if (dados.notaFiscal && dados.valorContratado) {
        const diferenca = Math.abs(dados.notaFiscal.valor - dados.valorContratado);
        const percentualDiferenca = (diferenca / dados.valorContratado) * 100;

        if (percentualDiferenca > 0.01) { // Tolerância de 0.01%
          resultado.naoConformidades.push({
            tipo: CONFORMIDADE_CONFIG.TIPOS_NAO_CONFORMIDADE.DIVERGENCIA_VALORES,
            descricao: `Divergência de valores: NF R$ ${dados.notaFiscal.valor} vs Contratado R$ ${dados.valorContratado}`,
            gravidade: percentualDiferenca > 5 ? 'ALTA' : 'MÉDIA'
          });
        }
      }

      // Gerar recomendações
      if (resultado.naoConformidades.length > 0) {
        resultado.recomendacoes.push('Regularizar pendências antes de prosseguir com o pagamento');
        resultado.recomendacoes.push('Documentar justificativas nos autos do processo');
      }

      return { success: true, data: resultado };

    } catch (error) {
      Logger.log('Erro em verificarDocumentacaoLiquidacao: ' + error);
      return { success: false, error: error.message };
    }
  } catch (error) {
    Logger.log("Erro em verificarDocumentacaoLiquidacao: " + error.message);
    throw error;
  }
}

/**
 * Realiza verificação completa de conformidade para pagamento
 * @param {Object} dados - Dados completos do processo
 * @returns {Object} Resultado consolidado
 */
function verificacaoCompletaConformidade(dados) {
  try {
    try {
      const resultado = {
        processoId: dados.processoId,
        fornecedor: dados.fornecedor,
        dataVerificacao: new Date().toISOString(),
        verificacoes: {},
        statusGeral: CONFORMIDADE_CONFIG.STATUS_VERIFICACAO.CONFORME,
        totalNaoConformidades: 0,
        aptoParaPagamento: true
      };

      // 1. Verificar regularidade fiscal
      const regFiscal = verificarRegularidadeFiscal({
        fornecedor: dados.fornecedor,
        cnpj: dados.cnpj,
        certidoes: dados.certidoes
      });
      resultado.verificacoes.regularidadeFiscal = regFiscal.data;

      // 2. Verificar consistência de datas
      const consistenciaDatas = verificarConsistenciaDatas({
        processoId: dados.processoId,
        notaFiscal: (dados.notaFiscal && dados.notaFiscal.numero),
        dataEmissaoNF: (dados.notaFiscal && dados.notaFiscal.dataEmissao),
        dataAtesto: dados.dataAtesto,
        dataRecebimento: dados.dataRecebimento
      });
      resultado.verificacoes.consistenciaDatas = consistenciaDatas.data;

      // 3. Verificar documentação
      const documentacao = verificarDocumentacaoLiquidacao(dados);
      resultado.verificacoes.documentacao = documentacao.data;

      // Consolidar resultado
      const todasNaoConformidades = [
        ...((regFiscal.data && regFiscal.data.naoConformidades) || []),
        ...((consistenciaDatas.data && consistenciaDatas.data.naoConformidades) || []),
        ...((documentacao.data && documentacao.data.naoConformidades) || [])
      ];

      resultado.totalNaoConformidades = todasNaoConformidades.length;
      resultado.naoConformidades = todasNaoConformidades;

      if (todasNaoConformidades.length > 0) {
        resultado.statusGeral = CONFORMIDADE_CONFIG.STATUS_VERIFICACAO.NAO_CONFORME;

        // Verificar se há não conformidades de alta gravidade
        const altaGravidade = todasNaoConformidades.filter(nc => nc.gravidade === 'ALTA');
        resultado.aptoParaPagamento = altaGravidade.length === 0;
      }

      // Salvar verificação
      salvarVerificacaoCompleta(resultado);

      return { success: true, data: resultado };

    } catch (error) {
      Logger.log('Erro em verificacaoCompletaConformidade: ' + error);
      return { success: false, error: error.message };
    }
  } catch (error) {
    Logger.log("Erro em verificacaoCompletaConformidade: " + error.message);
    throw error;
  }
}

// ============================================================================
// FUNÇÕES DE RASTREABILIDADE
// ============================================================================

/**
 * Registra evento de rastreabilidade no processo
 * @param {string} processoId - ID do processo
 * @param {Object} evento - Dados do evento
 * @returns {Object} Resultado
 */
function registrarEventoRastreabilidade(processoId, evento) {
  try {
    try {
      try {
        try {
          const registro = {
            id: gerarIdEvento(),
            processoId: processoId,
            dataHora: new Date().toISOString(),
            tipo: evento.tipo,
            descricao: evento.descricao,
            responsavel: evento.responsavel,
            matricula: evento.matricula,
            documentosAnexados: evento.documentos || [],
            observacoes: evento.observacoes || ''
          };

          const ss = getSS();
          let sheet = ss.getSheetByName('Rastreabilidade_Processos');

          if (!sheet) {
            sheet = criarAbaRastreabilidade(ss);
          }

          const linha = [
            registro.id,
            registro.processoId,
            registro.dataHora,
            registro.tipo,
            registro.descricao,
            registro.responsavel,
            registro.matricula,
            JSON.stringify(registro.documentosAnexados),
            registro.observacoes
          ];

          sheet.appendRow(linha);

          return { success: true, id: registro.id };

        } catch (error) {
          Logger.log('Erro em registrarEventoRastreabilidade: ' + error);
          return { success: false, error: error.message };
        }
      } catch (error) {
        Logger.log("Erro em registrarEventoRastreabilidade: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em registrarEventoRastreabilidade: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em registrarEventoRastreabilidade: " + error.message);
    throw error;
  }
}

/**
 * Obtém histórico de rastreabilidade de um processo
 * @param {string} processoId - ID do processo
 * @returns {Object} Histórico do processo
 */
function obterHistoricoProcesso(processoId) {
  try {
    try {
      const ss = getSS();
      const sheet = ss.getSheetByName('Rastreabilidade_Processos');

      if (!sheet) {
        return { success: true, data: [] };
      }

      const dados = sheet.getDataRange().getValues();
      const historico = [];

      for (let i = 1; i < dados.length; i++) {
        if (dados[i][1] === processoId) {
          historico.push({
            id: dados[i][0],
            dataHora: dados[i][2],
            tipo: dados[i][3],
            descricao: dados[i][4],
            responsavel: dados[i][5],
            matricula: dados[i][6],
            documentos: JSON.parse(dados[i][7] || '[]'),
            observacoes: dados[i][8]
          });
        }
      }

      // Ordenar por data
      historico.sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora));

      return { success: true, data: historico };

    } catch (error) {
      Logger.log('Erro em obterHistoricoProcesso: ' + error);
      return { success: false, error: error.message };
    }
  } catch (error) {
    Logger.log("Erro em obterHistoricoProcesso: " + error.message);
    throw error;
  }
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Formata data para exibição
 * @param {Date} data - Data a formatar
 * @returns {string} Data formatada
 */
function formatarData(data) {
  try {
    if (!data) return '';
    return data.toLocaleDateString('pt-BR');
  } catch (error) {
    Logger.log("Erro em formatarData: " + error.message);
    throw error;
  }
}

/**
 * Gera ID único para evento
 * @returns {string} ID gerado
 */
function gerarIdEvento() {
  try {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `EVT-${timestamp}-${random}`.toUpperCase();
  } catch (error) {
    Logger.log("Erro em gerarIdEvento: " + error.message);
    throw error;
  }
}

/**
 * Salva verificação de conformidade
 * @param {Object} verificacao - Dados da verificação
 */
function salvarVerificacaoConformidade(verificacao) {
  try {
    try {
      try {
        const ss = getSS();
        let sheet = ss.getSheetByName('Verificacoes_Conformidade');

        if (!sheet) {
          sheet = ss.insertSheet('Verificacoes_Conformidade');
          const cabecalhos = ['ID', 'Data', 'Fornecedor', 'CNPJ', 'Status', 'Não Conformidades', 'Detalhes'];
          sheet.getRange(1, 1, 1, cabecalhos.length).setValues([cabecalhos]);
          sheet.getRange(1, 1, 1, cabecalhos.length).setBackground('#f59e0b').setFontColor('white').setFontWeight('bold');
        }

        const id = `VER-${Date.now().toString(36)}`.toUpperCase();

        const linha = [
          id,
          verificacao.dataVerificacao,
          verificacao.fornecedor,
          verificacao.cnpj,
          verificacao.statusGeral,
          ((verificacao.naoConformidades || []).length),
          JSON.stringify(verificacao)
        ];

        sheet.appendRow(linha);

      } catch (error) {
        Logger.log('Erro ao salvar verificação: ' + error);
      }
    } catch (error) {
      Logger.log("Erro em salvarVerificacaoConformidade: " + error.message);
      throw error; // Re-lança para tratamento superior
    }
  } catch (error) {
    Logger.log("Erro em salvarVerificacaoConformidade: " + error.message);
    throw error;
  }
}

/**
 * Salva verificação completa
 * @param {Object} verificacao - Dados da verificação
 */
function salvarVerificacaoCompleta(verificacao) {
  try {
    try {
      try {
        try {
          const ss = getSS();
          let sheet = ss.getSheetByName('Verificacoes_Completas');

          if (!sheet) {
            sheet = ss.insertSheet('Verificacoes_Completas');
            const cabecalhos = ['ID', 'Processo', 'Data', 'Fornecedor', 'Status', 'Apto Pagamento', 'Total NC', 'Detalhes'];
            sheet.getRange(1, 1, 1, cabecalhos.length).setValues([cabecalhos]);
            sheet.getRange(1, 1, 1, cabecalhos.length).setBackground('#ef4444').setFontColor('white').setFontWeight('bold');
          }

          const id = `VERC-${Date.now().toString(36)}`.toUpperCase();

          const linha = [
            id,
            verificacao.processoId,
            verificacao.dataVerificacao,
            verificacao.fornecedor,
            verificacao.statusGeral,
            verificacao.aptoParaPagamento ? 'SIM' : 'NÃO',
            verificacao.totalNaoConformidades,
            JSON.stringify(verificacao)
          ];

          sheet.appendRow(linha);

        } catch (error) {
          Logger.log('Erro ao salvar verificação completa: ' + error);
        }
      } catch (error) {
        Logger.log("Erro em salvarVerificacaoCompleta: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em salvarVerificacaoCompleta: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em salvarVerificacaoCompleta: " + error.message);
    throw error;
  }
}

/**
 * Cria aba de rastreabilidade
 * @param {Spreadsheet} ss - Planilha
 * @returns {Sheet} Aba criada
 */
function criarAbaRastreabilidade(ss) {
  try {
    try {
      try {
        const sheet = ss.insertSheet('Rastreabilidade_Processos');

        const cabecalhos = [
          'ID Evento', 'ID Processo', 'Data/Hora', 'Tipo', 'Descrição',
          'Responsável', 'Matrícula', 'Documentos', 'Observações'
        ];

        sheet.getRange(1, 1, 1, cabecalhos.length).setValues([cabecalhos]);
        sheet.getRange(1, 1, 1, cabecalhos.length)
          .setBackground('#3b82f6')
          .setFontColor('white')
          .setFontWeight('bold');

        sheet.setFrozenRows(1);

        return sheet;
      } catch (error) {
        Logger.log("Erro em criarAbaRastreabilidade: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em criarAbaRastreabilidade: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em criarAbaRastreabilidade: " + error.message);
    throw error;
  }
}

// ============================================================================
// FUNÇÕES DE RELATÓRIO DE AUDITORIA
// ============================================================================

/**
 * Gera relatório de não conformidades
 * @param {Object} filtros - Filtros para o relatório
 * @returns {Object} Relatório
 */
function gerarRelatorioNaoConformidades(filtros = {}) {
  try {
    try {
      const ss = getSS();
      const sheet = ss.getSheetByName('Verificacoes_Completas');

      if (!sheet) {
        return { success: true, data: { total: 0, verificacoes: [] } };
      }

      const dados = sheet.getDataRange().getValues();
      const verificacoes = [];

      for (let i = 1; i < dados.length; i++) {
        const detalhes = JSON.parse(dados[i][7] || '{}');

        if (detalhes.naoConformidades && detalhes.naoConformidades.length > 0) {
          verificacoes.push({
            id: dados[i][0],
            processo: dados[i][1],
            data: dados[i][2],
            fornecedor: dados[i][3],
            totalNC: dados[i][6],
            naoConformidades: detalhes.naoConformidades
          });
        }
      }

      // Consolidar por tipo de não conformidade
      const porTipo = {};
      verificacoes.forEach(v => {
        v.naoConformidades.forEach(nc => {
          if (!porTipo[nc.tipo]) {
            porTipo[nc.tipo] = { quantidade: 0, processos: [] };
          }
          porTipo[nc.tipo].quantidade++;
          porTipo[nc.tipo].processos.push(v.processo);
        });
      });

      return {
        success: true,
        data: {
          dataGeracao: new Date().toISOString(),
          totalVerificacoes: verificacoes.length,
          totalNaoConformidades: verificacoes.reduce((acc, v) => acc + v.totalNC, 0),
          porTipo: porTipo,
          detalhes: verificacoes
        }
      };

    } catch (error) {
      Logger.log('Erro em gerarRelatorioNaoConformidades: ' + error);
      return { success: false, error: error.message };
    }
  } catch (error) {
    Logger.log("Erro em gerarRelatorioNaoConformidades: " + error.message);
    throw error;
  }
}

/**
 * Verifica processos pendentes de regularização
 * @returns {Object} Lista de processos pendentes
 */
function listarProcessosPendentesRegularizacao() {
  try {
    try {
      const ss = getSS();
      const sheet = ss.getSheetByName('Verificacoes_Completas');

      if (!sheet) {
        return { success: true, data: [] };
      }

      const dados = sheet.getDataRange().getValues();
      const pendentes = [];

      for (let i = 1; i < dados.length; i++) {
        if (dados[i][5] === 'NÃO') { // Não apto para pagamento
          pendentes.push({
            id: dados[i][0],
            processo: dados[i][1],
            data: dados[i][2],
            fornecedor: dados[i][3],
            totalNC: dados[i][6]
          });
        }
      }

      return { success: true, data: pendentes };

    } catch (error) {
      Logger.log('Erro em listarProcessosPendentesRegularizacao: ' + error);
      return { success: false, error: error.message };
    }
  } catch (error) {
    Logger.log("Erro em listarProcessosPendentesRegularizacao: " + error.message);
    throw error;
  }
}
