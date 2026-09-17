/**
 * @fileoverview Service Layer - Lógica de Negócio Centralizada
 * @version 1.0.0
 * @description Implementa a camada de serviço com lógica de negócio
 */

'use strict';

/**
 * @typedef {Object} ServiceResponse
 * @property {boolean} success - Indica se a operação foi bem-sucedida
 * @property {*} data - Dados retornados
 * @property {string} [message] - Mensagem de sucesso/erro
 * @property {Array<string>} [errors] - Lista de erros
 * @property {Object} [metadata] - Metadados adicionais
 */

/**
 * Base Service - Classe abstrata para todos os serviços Core
 */
class CoreBaseService {
  /**
   * @param {BaseRepository} repository - Repository para acesso a dados
   */
  constructor(repository) {
    this.repository = repository;
    this.logger = new EnterpriseLogger(this.constructor.name);
    this.validator = new ValidationService();
    this.auditLogger = new AuditLogger();
  }

  /**
   * Cria resposta de sucesso padronizada
   * @param {*} data - Dados da resposta
   * @param {string} [message] - Mensagem de sucesso
   * @param {Object} [metadata] - Metadados adicionais
   * @returns {ServiceResponse}
   * @protected
   */
  successResponse(data, message = null, metadata = {}) {
    return {
      success: true,
      data: data,
      message: message,
      metadata: {
        timestamp: new Date().toISOString(),
        ...metadata
      }
    };
  }

  /**
   * Cria resposta de erro padronizada
   * @param {string|Array<string>} errors - Erro(s) ocorrido(s)
   * @param {*} [data] - Dados parciais (opcional)
   * @returns {ServiceResponse}
   * @protected
   */
  errorResponse(errors, data = null) {
    const errorArray = Array.isArray(errors) ? errors : [errors];

    return {
      success: false,
      data: data,
      errors: errorArray,
      metadata: {
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Executa operação com tratamento de erros
   * @param {Function} operation - Operação a executar
   * @param {string} operationName - Nome da operação para logs
   * @returns {ServiceResponse}
   * @protected
   */
  executeOperation(operation, operationName) {
    const startTime = Date.now();

    try {
      this.logger.info(`Starting ${operationName}`);

      const result = operation();

      const duration = Date.now() - startTime;
      this.logger.info(`Completed ${operationName}`, { duration });

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Failed ${operationName}`, {
        error: error.message,
        stack: error.stack,
        duration
      });

      return this.errorResponse(error.message);
    }
  }
}

/**
 * Serviço de Notas Fiscais
 */
class NotaFiscalService extends CoreBaseService {
  constructor() {
    super(new NotaFiscalRepository());
  }

  /**
   * Cria nova nota fiscal
   * @param {Object} dados - Dados da nota fiscal
   * @returns {ServiceResponse}
   */
  criar(dados) {
    return this.executeOperation(() => {
      // Validar dados
      const validation = this.validator.validateNotaFiscal(dados);
      if (!validation.valid) {
        return this.errorResponse(validation.errors);
      }

      // Verificar duplicidade
      const existente = this.repository.findByChaveAcesso(dados.Chave_Acesso);
      if (existente) {
        return this.errorResponse('Nota fiscal já cadastrada');
      }

      // Enriquecer dados
      const dadosCompletos = {
        ...dados,
        Data_Cadastro: new Date(),
        Usuario_Cadastro: Session.getActiveUser().getEmail(),
        Status_NF: dados.Status_NF || 'PENDENTE'
      };

      // Criar registro
      const nota = this.repository.create(dadosCompletos);

      // Auditoria
      this.auditLogger.logAction('NOTA_FISCAL_CRIADA', Session.getActiveUser().getEmail(), {
        notaId: nota._rowIndex,
        numero: nota.Numero_NF
      });

      return this.successResponse(nota, 'Nota fiscal criada com sucesso');

    }, 'criar_nota_fiscal');
  }

  /**
   * Busca notas fiscais com filtros
   * @param {Object} filtros - Filtros de busca
   * @returns {ServiceResponse}
   */
  buscar(filtros = {}) {
    return this.executeOperation(() => {
      let notas = [];

      if (filtros.fornecedor) {
        notas = this.repository.findByFornecedor(filtros.fornecedor);
      } else if (filtros.status) {
        notas = this.repository.findByStatus(filtros.status);
      } else if (filtros.dataInicio && filtros.dataFim) {
        notas = this.repository.findByPeriodo(
          new Date(filtros.dataInicio),
          new Date(filtros.dataFim)
        );
      } else {
        notas = this.repository.findAll({
          limit: filtros.limit || 100,
          offset: filtros.offset || 0,
          orderBy: filtros.orderBy || 'Data_Emissao',
          order: filtros.order || 'DESC'
        });
      }

      return this.successResponse(notas, null, {
        total: notas.length,
        filtros: filtros
      });

    }, 'buscar_notas_fiscais');
  }

  /**
   * Atualiza nota fiscal
   * @param {number} rowIndex - Índice da linha
   * @param {Object} dados - Dados para atualizar
   * @returns {ServiceResponse}
   */
  atualizar(rowIndex, dados) {
    return this.executeOperation(() => {
      // Verificar se existe
      const notaAtual = this.repository.findByRowIndex(rowIndex);
      if (!notaAtual) {
        return this.errorResponse('Nota fiscal não encontrada');
      }

      // Validar alterações
      const validation = this.validator.validateNotaFiscal({ ...notaAtual, ...dados });
      if (!validation.valid) {
        return this.errorResponse(validation.errors);
      }

      // Adicionar metadados de atualização
      const dadosAtualizacao = {
        ...dados,
        Data_Atualizacao: new Date(),
        Usuario_Atualizacao: Session.getActiveUser().getEmail()
      };

      // Atualizar
      const notaAtualizada = this.repository.update(rowIndex, dadosAtualizacao);

      // Auditoria
      this.auditLogger.logAction('NOTA_FISCAL_ATUALIZADA', Session.getActiveUser().getEmail(), {
        notaId: rowIndex,
        alteracoes: Object.keys(dados)
      });

      return this.successResponse(notaAtualizada, 'Nota fiscal atualizada com sucesso');

    }, 'atualizar_nota_fiscal');
  }

  /**
   * Aprova nota fiscal
   * @param {number} rowIndex - Índice da linha
   * @param {string} [observacao] - Observação da aprovação
   * @returns {ServiceResponse}
   */
  aprovar(rowIndex, observacao = '') {
    return this.executeOperation(() => {
      const nota = this.repository.findByRowIndex(rowIndex);
      if (!nota) {
        return this.errorResponse('Nota fiscal não encontrada');
      }

      if (nota.Status_NF === 'APROVADA') {
        return this.errorResponse('Nota fiscal já está aprovada');
      }

      const dadosAprovacao = {
        Status_NF: 'APROVADA',
        Data_Aprovacao: new Date(),
        Usuario_Aprovacao: Session.getActiveUser().getEmail(),
        Observacao_Aprovacao: observacao
      };

      const notaAprovada = this.repository.update(rowIndex, dadosAprovacao);

      // Auditoria
      this.auditLogger.logAction('NOTA_FISCAL_APROVADA', Session.getActiveUser().getEmail(), {
        notaId: rowIndex,
        numero: nota.Numero_NF
      });

      // Notificar stakeholders
      this.notificarAprovacao(notaAprovada);

      return this.successResponse(notaAprovada, 'Nota fiscal aprovada com sucesso');

    }, 'aprovar_nota_fiscal');
  }

  /**
   * Recusa nota fiscal
   * @param {number} rowIndex - Índice da linha
   * @param {string} motivo - Motivo da recusa
   * @returns {ServiceResponse}
   */
  recusar(rowIndex, motivo) {
    return this.executeOperation(() => {
      if (!motivo || motivo.trim() === '') {
        return this.errorResponse('Motivo da recusa é obrigatório');
      }

      const nota = this.repository.findByRowIndex(rowIndex);
      if (!nota) {
        return this.errorResponse('Nota fiscal não encontrada');
      }

      const dadosRecusa = {
        Status_NF: 'RECUSADA',
        Data_Recusa: new Date(),
        Usuario_Recusa: Session.getActiveUser().getEmail(),
        Motivo_Recusa: motivo
      };

      const notaRecusada = this.repository.update(rowIndex, dadosRecusa);

      // Auditoria
      this.auditLogger.logAction('NOTA_FISCAL_RECUSADA', Session.getActiveUser().getEmail(), {
        notaId: rowIndex,
        numero: nota.Numero_NF,
        motivo: motivo
      });

      // Notificar fornecedor
      this.notificarRecusa(notaRecusada);

      return this.successResponse(notaRecusada, 'Nota fiscal recusada');

    }, 'recusar_nota_fiscal');
  }

  /**
   * Obtém estatísticas de notas fiscais
   * @param {Object} [filtros] - Filtros opcionais
   * @returns {ServiceResponse}
   */
  obterEstatisticas(filtros = {}) {
    return this.executeOperation(() => {
      const todasNotas = this.repository.findAll();

      const stats = {
        total: todasNotas.length,
        porStatus: {},
        valorTotal: 0,
        valorMedio: 0,
        porFornecedor: {}
      };

      todasNotas.forEach(nota => {
        // Contar por status
        const status = nota.Status_NF || 'INDEFINIDO';
        stats.porStatus[status] = (stats.porStatus[status] || 0) + 1;

        // Somar valores
        const valor = parseFloat(nota.Valor_Total) || 0;
        stats.valorTotal += valor;

        // Contar por fornecedor
        const fornecedor = nota.Fornecedor || 'INDEFINIDO';
        if (!stats.porFornecedor[fornecedor]) {
          stats.porFornecedor[fornecedor] = { quantidade: 0, valorTotal: 0 };
        }
        stats.porFornecedor[fornecedor].quantidade++;
        stats.porFornecedor[fornecedor].valorTotal += valor;
      });

      stats.valorMedio = stats.total > 0 ? stats.valorTotal / stats.total : 0;

      return this.successResponse(stats);

    }, 'obter_estatisticas');
  }

  /**
   * Notifica aprovação de nota
   * @param {Object} nota - Nota aprovada
   * @private
   */
  notificarAprovacao(nota) {
    try {
      // Implementar notificação por email, etc
      this.logger.info('Notificação de aprovação enviada', { notaId: nota._rowIndex });
    } catch (error) {
      this.logger.warn('Falha ao enviar notificação', { error: error.message });
    }
  }

  /**
   * Notifica recusa de nota
   * @param {Object} nota - Nota recusada
   * @private
   */
  notificarRecusa(nota) {
    try {
      // Implementar notificação por email, etc
      this.logger.info('Notificação de recusa enviada', { notaId: nota._rowIndex });
    } catch (error) {
      this.logger.warn('Falha ao enviar notificação', { error: error.message });
    }
  }
}

/**
 * Serviço de Entregas
 */
class EntregaService extends CoreBaseService {
  constructor() {
    super(new EntregaRepository());
    this.notaFiscalService = new NotaFiscalService();
  }

  /**
   * Registra nova entrega
   * @param {Object} dados - Dados da entrega
   * @returns {ServiceResponse}
   */
  registrar(dados) {
    return this.executeOperation(() => {
      // Validar dados
      const validation = this.validator.validateEntrega(dados);
      if (!validation.valid) {
        return this.errorResponse(validation.errors);
      }

      // Verificar se nota fiscal existe
      const notaFiscalRepo = new NotaFiscalRepository();
      const nota = notaFiscalRepo.findByFilters({ Numero_NF: dados.Numero_NF });

      if (nota.length === 0) {
        return this.errorResponse('Nota fiscal não encontrada');
      }

      // Enriquecer dados
      const dadosCompletos = {
        ...dados,
        Data_Registro: new Date(),
        Usuario_Registro: Session.getActiveUser().getEmail(),
        Status_Entrega: dados.Status_Entrega || 'PENDENTE'
      };

      // Criar registro
      const entrega = this.repository.create(dadosCompletos);

      // Auditoria
      this.auditLogger.logAction('ENTREGA_REGISTRADA', Session.getActiveUser().getEmail(), {
        entregaId: entrega._rowIndex,
        numeroNF: dados.Numero_NF
      });

      return this.successResponse(entrega, 'Entrega registrada com sucesso');

    }, 'registrar_entrega');
  }

  /**
   * Confirma entrega
   * @param {number} rowIndex - Índice da linha
   * @param {Object} dadosConfirmacao - Dados da confirmação
   * @returns {ServiceResponse}
   */
  confirmar(rowIndex, dadosConfirmacao) {
    return this.executeOperation(() => {
      const entrega = this.repository.findByRowIndex(rowIndex);
      if (!entrega) {
        return this.errorResponse('Entrega não encontrada');
      }

      const dadosAtualizacao = {
        Status_Entrega: 'CONFIRMADA',
        Data_Confirmacao: new Date(),
        Usuario_Confirmacao: Session.getActiveUser().getEmail(),
        ...dadosConfirmacao
      };

      const entregaConfirmada = this.repository.update(rowIndex, dadosAtualizacao);

      // Auditoria
      this.auditLogger.logAction('ENTREGA_CONFIRMADA', Session.getActiveUser().getEmail(), {
        entregaId: rowIndex
      });

      return this.successResponse(entregaConfirmada, 'Entrega confirmada com sucesso');

    }, 'confirmar_entrega');
  }
}

/**
 * Serviço de Validação
 */
class ValidationService {
  /**
   * Valida dados de nota fiscal
   * @param {Object} dados - Dados para validar
   * @returns {{valid: boolean, errors: Array<string>}}
   */
  validateNotaFiscal(dados) {
    const errors = [];

    if (!dados.Numero_NF) {
      errors.push('Número da nota fiscal é obrigatório');
    }

    if (!dados.Chave_Acesso) {
      errors.push('Chave de acesso é obrigatória');
    } else if (!/^\d{44}$/.test(String(dados.Chave_Acesso).replace(/\D/g, ''))) {
      errors.push('Chave de acesso deve ter 44 dígitos');
    }

    if (!dados.Fornecedor) {
      errors.push('Fornecedor é obrigatório');
    }

    if (!dados.Valor_Total || parseFloat(dados.Valor_Total) <= 0) {
      errors.push('Valor total deve ser maior que zero');
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Valida dados de entrega
   * @param {Object} dados - Dados para validar
   * @returns {{valid: boolean, errors: Array<string>}}
   */
  validateEntrega(dados) {
    const errors = [];

    if (!dados.Numero_NF) {
      errors.push('Número da nota fiscal é obrigatório');
    }

    if (!dados.Data_Entrega) {
      errors.push('Data de entrega é obrigatória');
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }
}

// Exportar para uso global
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CoreBaseService,
    BaseService: CoreBaseService,
    NotaFiscalService,
    EntregaService,
    ValidationService
  };
}
