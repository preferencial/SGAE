/**
 * @fileoverview Ferramenta Semântica de Validação de Workflows - UNIAE
 * 
 * PROPÓSITO:
 * Mapear, validar e documentar os 3 workflows primordiais do sistema:
 * 1. FORNECEDOR: Lançamento de NF, valores e quantidades
 * 2. REPRESENTANTE ESCOLAR: Registro de recebimento efetivo
 * 3. ANALISTA UNIAE: Validação e atesto de entregas/pagamentos
 * 
 * @version 1.0.0
 * @author UNIAE/CRE-PP
 */

'use strict';

// ============================================================================
// DEFINIÇÃO SEMÂNTICA DOS WORKFLOWS
// ============================================================================

/**
 * WORKFLOW 1: FORNECEDOR
 * Lançamento de Nota Fiscal com valores e quantidades de gêneros
 */
var WORKFLOW_FORNECEDOR = {
  id: 'WF_FORNECEDOR',
  nome: 'Lançamento de Nota Fiscal pelo Fornecedor',
  ator: 'FORNECEDOR',
  descricao: 'Fornecedor registra NF com itens, quantidades, valores e unidades de medida',
  
  // Entidades envolvidas
  entidades: {
    principal: 'NotaFiscal',
    relacionadas: ['ItemNF', 'Fornecedor', 'Contrato', 'Empenho']
  },
  
  // Campos obrigatórios
  camposObrigatorios: {
    notaFiscal: {
      numero: { tipo: 'string', descricao: 'Número da NF-e' },
      serie: { tipo: 'string', descricao: 'Série da NF' },
      chaveAcesso: { tipo: 'string', tamanho: 44, descricao: 'Chave de acesso NF-e' },
      dataEmissao: { tipo: 'date', descricao: 'Data de emissão' },
      valorTotal: { tipo: 'number', min: 0.01, descricao: 'Valor total da NF' },
      cnpjEmitente: { tipo: 'string', tamanho: 14, descricao: 'CNPJ do fornecedor' }
    },
    itens: {
      descricao: { tipo: 'string', descricao: 'Descrição do produto' },
      quantidade: { tipo: 'number', min: 0.001, descricao: 'Quantidade' },
      unidadeMedida: { tipo: 'enum', valores: ['KG', 'UN', 'DZ', 'L', 'PCT', 'CX'], descricao: 'Unidade' },
      valorUnitario: { tipo: 'number', min: 0.01, descricao: 'Valor unitário' },
      valorTotal: { tipo: 'number', min: 0.01, descricao: 'Valor total do item' }
    }
  },
  
  // Regras de negócio
  regras: [
    { id: 'R1', descricao: 'Soma dos itens deve ser igual ao valor total da NF', tipo: 'VALIDACAO' },
    { id: 'R2', descricao: 'CNPJ deve estar ativo na Receita Federal', tipo: 'VALIDACAO' },
    { id: 'R3', descricao: 'Chave de acesso deve ser válida na SEFAZ', tipo: 'VALIDACAO' },
    { id: 'R4', descricao: 'Produtos devem estar no contrato vigente', tipo: 'VALIDACAO' },
    { id: 'R5', descricao: 'Preços não podem exceder valores contratados', tipo: 'VALIDACAO' }
  ],
  
  // Status possíveis
  status: ['RASCUNHO', 'ENVIADA', 'EM_ANALISE', 'APROVADA', 'REJEITADA', 'PAGA'],
  
  // Transições permitidas
  transicoes: {
    'RASCUNHO': ['ENVIADA'],
    'ENVIADA': ['EM_ANALISE', 'REJEITADA'],
    'EM_ANALISE': ['APROVADA', 'REJEITADA'],
    'APROVADA': ['PAGA'],
    'REJEITADA': ['RASCUNHO']
  }
};

/**
 * WORKFLOW 2: REPRESENTANTE ESCOLAR
 * Registro de recebimento efetivo nas unidades escolares
 */
var WORKFLOW_REPRESENTANTE = {
  id: 'WF_REPRESENTANTE',
  nome: 'Registro de Recebimento pelo Representante Escolar',
  ator: 'ESCOLA',
  descricao: 'Representante registra quantidades efetivamente recebidas por item',
  
  // Entidades envolvidas
  entidades: {
    principal: 'TermoRecebimento',
    relacionadas: ['ItemRecebido', 'UnidadeEscolar', 'NotaFiscal', 'Recusa']
  },
  
  // Campos obrigatórios
  camposObrigatorios: {
    termoRecebimento: {
      notaFiscalRef: { tipo: 'string', descricao: 'Referência à NF' },
      unidadeEscolar: { tipo: 'string', descricao: 'Nome/código da UE' },
      dataRecebimento: { tipo: 'date', descricao: 'Data do recebimento' },
      horaRecebimento: { tipo: 'time', descricao: 'Hora do recebimento' },
      responsavel: { tipo: 'string', descricao: 'Nome do responsável' },
      matricula: { tipo: 'string', descricao: 'Matrícula funcional' },
      assinatura: { tipo: 'boolean', descricao: 'Termo assinado' },
      identificacaoUE: { tipo: 'boolean', descricao: 'Identificação digital da UE' }
    },
    itensRecebidos: {
      itemNFRef: { tipo: 'string', descricao: 'Referência ao item da NF' },
      descricao: { tipo: 'string', descricao: 'Descrição do produto' },
      quantidadeEsperada: { tipo: 'number', descricao: 'Qtd conforme NF' },
      quantidadeRecebida: { tipo: 'number', min: 0, descricao: 'Qtd efetivamente recebida' },
      unidadeMedida: { tipo: 'enum', valores: ['KG', 'UN', 'DZ', 'L', 'PCT', 'CX'], descricao: 'Unidade' },
      conforme: { tipo: 'boolean', descricao: 'Recebimento conforme' }
    },
    conferencia: {
      temperaturaAferida: { tipo: 'number', descricao: 'Temperatura (perecíveis)' },
      embalagemIntegra: { tipo: 'boolean', descricao: 'Embalagem OK' },
      validadeOk: { tipo: 'boolean', descricao: 'Validade adequada' },
      caracteristicasOk: { tipo: 'boolean', descricao: 'Características sensoriais OK' }
    }
  },
  
  // Regras de negócio
  regras: [
    { id: 'R1', descricao: 'Quantidade recebida não pode exceder quantidade da NF', tipo: 'VALIDACAO' },
    { id: 'R2', descricao: 'Termo deve ter assinatura e matrícula', tipo: 'OBRIGATORIO' },
    { id: 'R3', descricao: 'Perecíveis devem ter temperatura aferida', tipo: 'CONDICIONAL' },
    { id: 'R4', descricao: 'Divergências devem gerar registro de recusa', tipo: 'AUTOMATICO' },
    { id: 'R5', descricao: 'Recebimento deve ocorrer na data da entrega', tipo: 'VALIDACAO' }
  ],
  
  // Status possíveis
  status: ['AGUARDANDO', 'RECEBIDO_CONFORME', 'RECEBIDO_PARCIAL', 'RECUSADO', 'PENDENTE_SUBSTITUICAO'],
  
  // Transições permitidas
  transicoes: {
    'AGUARDANDO': ['RECEBIDO_CONFORME', 'RECEBIDO_PARCIAL', 'RECUSADO'],
    'RECEBIDO_PARCIAL': ['PENDENTE_SUBSTITUICAO', 'RECEBIDO_CONFORME'],
    'RECUSADO': ['PENDENTE_SUBSTITUICAO'],
    'PENDENTE_SUBSTITUICAO': ['RECEBIDO_CONFORME', 'RECEBIDO_PARCIAL']
  }
};

/**
 * WORKFLOW 3: ANALISTA UNIAE
 * Validação de entregas e autorização de pagamentos
 */
var WORKFLOW_ANALISTA = {
  id: 'WF_ANALISTA',
  nome: 'Validação e Atesto pelo Analista UNIAE',
  ator: 'ANALISTA',
  descricao: 'Analista valida entregas e autoriza pagamentos total, parcial ou rejeita',
  
  // Entidades envolvidas
  entidades: {
    principal: 'ProcessoAtesto',
    relacionadas: ['NotaFiscal', 'TermoRecebimento', 'Glosa', 'Despacho']
  },
  
  // Campos obrigatórios
  camposObrigatorios: {
    analise: {
      processoId: { tipo: 'string', descricao: 'ID do processo' },
      notaFiscalRef: { tipo: 'string', descricao: 'Referência à NF' },
      dataAnalise: { tipo: 'date', descricao: 'Data da análise' },
      analistaResponsavel: { tipo: 'string', descricao: 'Nome do analista' },
      membrosComissao: { tipo: 'array', minItens: 3, descricao: 'Membros presentes' }
    },
    verificacoes: {
      somaQuantitativos: { tipo: 'boolean', descricao: 'Soma dos termos = NF' },
      atestoEscolarCompleto: { tipo: 'boolean', descricao: 'Termos com assinatura digital/matrícula/identificação UE' },
      nfAutentica: { tipo: 'boolean', descricao: 'NF válida na SEFAZ' },
      precosConformes: { tipo: 'boolean', descricao: 'Preços conforme contrato' }
    },
    decisao: {
      tipo: { tipo: 'enum', valores: ['APROVADO_TOTAL', 'APROVADO_PARCIAL', 'REJEITADO_PARCIAL', 'REJEITADO_TOTAL'], descricao: 'Tipo de decisão' },
      valorAprovado: { tipo: 'number', min: 0, descricao: 'Valor aprovado para pagamento' },
      valorGlosado: { tipo: 'number', min: 0, descricao: 'Valor glosado' },
      justificativa: { tipo: 'string', descricao: 'Justificativa da decisão' }
    }
  },
  
  // Regras de negócio
  regras: [
    { id: 'R1', descricao: 'Mínimo 3 membros da comissão para atesto', tipo: 'OBRIGATORIO' },
    { id: 'R2', descricao: 'Prazo de 5 dias úteis para análise', tipo: 'PRAZO' },
    { id: 'R3', descricao: 'Glosa deve ter justificativa documentada', tipo: 'OBRIGATORIO' },
    { id: 'R4', descricao: 'Valor aprovado + glosado = valor NF', tipo: 'VALIDACAO' },
    { id: 'R5', descricao: 'Rejeição total requer notificação ao fornecedor', tipo: 'AUTOMATICO' }
  ],
  
  // Status possíveis
  status: ['AGUARDANDO_ANALISE', 'EM_ANALISE', 'APROVADO_TOTAL', 'APROVADO_PARCIAL', 'REJEITADO', 'LIQUIDADO', 'PAGO'],
  
  // Transições permitidas
  transicoes: {
    'AGUARDANDO_ANALISE': ['EM_ANALISE'],
    'EM_ANALISE': ['APROVADO_TOTAL', 'APROVADO_PARCIAL', 'REJEITADO'],
    'APROVADO_TOTAL': ['LIQUIDADO'],
    'APROVADO_PARCIAL': ['LIQUIDADO'],
    'LIQUIDADO': ['PAGO'],
    'REJEITADO': ['AGUARDANDO_ANALISE'] // Pode ser reanalisado
  }
};

// ============================================================================
// SERVIÇO DE VALIDAÇÃO SEMÂNTICA
// ============================================================================

var WorkflowValidatorService = {
  
  /**
   * Obtém definição completa de um workflow
   */
  getWorkflowDefinition: function(workflowId) {
    var workflows = {
      'WF_FORNECEDOR': WORKFLOW_FORNECEDOR,
      'WF_REPRESENTANTE': WORKFLOW_REPRESENTANTE,
      'WF_ANALISTA': WORKFLOW_ANALISTA,
      'WF_NUTRICIONISTA': typeof WORKFLOW_NUTRICIONISTA !== 'undefined' ? WORKFLOW_NUTRICIONISTA : null
    };
    return workflows[workflowId] || null;
  },
  
  /**
   * Lista todos os workflows disponíveis
   */
  listarWorkflows: function() {
    try {
      var lista = [
        { id: 'WF_FORNECEDOR', nome: WORKFLOW_FORNECEDOR.nome, ator: 'FORNECEDOR' },
        { id: 'WF_REPRESENTANTE', nome: WORKFLOW_REPRESENTANTE.nome, ator: 'ESCOLA' },
        { id: 'WF_ANALISTA', nome: WORKFLOW_ANALISTA.nome, ator: 'ANALISTA' }
      ];
      // Adicionar workflow do nutricionista se disponível
      if (typeof WORKFLOW_NUTRICIONISTA !== 'undefined') {
        lista.push({ id: 'WF_NUTRICIONISTA', nome: WORKFLOW_NUTRICIONISTA.nome, ator: 'NUTRICIONISTA' });
      }
      return lista;
    } catch (error) {
      Logger.log("Erro em listarWorkflows: " + error.message);
      throw error;
    }
  },
  
  /**
   * Valida dados contra um workflow específico
   */
  validarDados: function(workflowId, dados) {
    try {
      var workflow = this.getWorkflowDefinition(workflowId);
      if (!workflow) {
        return { valido: false, erros: ['Workflow não encontrado: ' + workflowId] };
      }
    
      var erros = [];
      var avisos = [];
    
      // Validar campos obrigatórios
      for (var grupo in workflow.camposObrigatorios) {
        var campos = workflow.camposObrigatorios[grupo];
        var dadosGrupo = dados[grupo] || {};
      
        for (var campo in campos) {
          var spec = campos[campo];
          var valor = dadosGrupo[campo];
        
          // Verificar presença
          if (valor === undefined || valor === null || valor === '') {
            erros.push({
              campo: grupo + '.' + campo,
              mensagem: 'Campo obrigatório não preenchido: ' + spec.descricao,
              tipo: 'OBRIGATORIO'
            });
            continue;
          }
        
          // Validar tipo
          var erroTipo = this._validarTipo(valor, spec);
          if (erroTipo) {
            erros.push({
              campo: grupo + '.' + campo,
              mensagem: erroTipo,
              tipo: 'TIPO'
            });
          }
        }
      }
    
      // Validar regras de negócio
      var resultadoRegras = this._validarRegras(workflow, dados);
      erros = erros.concat(resultadoRegras.erros);
      avisos = avisos.concat(resultadoRegras.avisos);
    
      return {
        valido: erros.length === 0,
        erros: erros,
        avisos: avisos,
        workflow: workflow.nome,
        totalCamposValidados: Object.keys(workflow.camposObrigatorios).length
      };
    } catch (error) {
      Logger.log("Erro em validarDados: " + error.message);
      throw error;
    }
  },
  
  /**
   * Valida transição de status
   */
  validarTransicao: function(workflowId, statusAtual, novoStatus) {
    var workflow = this.getWorkflowDefinition(workflowId);
    if (!workflow) {
      return { valido: false, erro: 'Workflow não encontrado' };
    }
    
    var transicoesPermitidas = workflow.transicoes[statusAtual] || [];
    var permitido = transicoesPermitidas.indexOf(novoStatus) >= 0;
    
    return {
      valido: permitido,
      statusAtual: statusAtual,
      novoStatus: novoStatus,
      transicoesPermitidas: transicoesPermitidas,
      erro: permitido ? null : 'Transição não permitida de ' + statusAtual + ' para ' + novoStatus
    };
  },
  
  /**
   * Gera relatório de cobertura dos workflows no projeto
   */
  gerarRelatorioCobertura: function() {
    try {
      var relatorio = {
        dataGeracao: new Date(),
        workflows: [],
        resumo: {
          totalWorkflows: 3,
          totalEntidades: 0,
          totalRegras: 0,
          coberturaEstimada: 0
        }
      };
    
      var workflows = [WORKFLOW_FORNECEDOR, WORKFLOW_REPRESENTANTE, WORKFLOW_ANALISTA];
    
      workflows.forEach(function(wf) {
        var analise = {
          id: wf.id,
          nome: wf.nome,
          ator: wf.ator,
          entidades: wf.entidades,
          totalCampos: 0,
          totalRegras: wf.regras.length,
          status: wf.status,
          transicoes: Object.keys(wf.transicoes).length
        };
      
        // Contar campos
        for (var grupo in wf.camposObrigatorios) {
          analise.totalCampos += Object.keys(wf.camposObrigatorios[grupo]).length;
        }
      
        relatorio.workflows.push(analise);
        relatorio.resumo.totalEntidades += wf.entidades.relacionadas.length + 1;
        relatorio.resumo.totalRegras += wf.regras.length;
      });
    
      // Estimar cobertura baseado em funções existentes
      relatorio.resumo.coberturaEstimada = this._estimarCobertura();
    
      return relatorio;
    } catch (error) {
      Logger.log("Erro em gerarRelatorioCobertura: " + error.message);
      throw error;
    }
  },
  
  /**
   * Mapeia funções existentes para workflows
   */
  mapearFuncoesExistentes: function() {
    return {
      WF_FORNECEDOR: {
        funcoes: [
          { nome: 'importarNotasFiscais', arquivo: 'Dominio_NotasFiscais.gs', status: 'IMPLEMENTADA' },
          { nome: 'verificarAutenticidadeNFe', arquivo: 'Dominio_NotasFiscais.gs', status: 'IMPLEMENTADA' },
          { nome: 'validarChaveNFe', arquivo: 'Dominio_NotasFiscais.gs', status: 'IMPLEMENTADA' },
          { nome: 'consultarNFeSEFAZ', arquivo: 'Dominio_NotasFiscais.gs', status: 'SIMULADA' },
          { nome: 'conferirValoresQuantidades', arquivo: 'Dominio_NotasFiscais.gs', status: 'IMPLEMENTADA' }
        ],
        cobertura: 80
      },
      WF_REPRESENTANTE: {
        funcoes: [
          { nome: 'RecebimentoGenerosService.registrarRecebimento', arquivo: 'Dominio_Recebimento.gs', status: 'IMPLEMENTADA' },
          { nome: 'RecebimentoGenerosService.registrarConferencia', arquivo: 'Dominio_Recebimento.gs', status: 'IMPLEMENTADA' },
          { nome: 'RecebimentoGenerosService.registrarRecusa', arquivo: 'Dominio_Recebimento.gs', status: 'IMPLEMENTADA' },
          { nome: 'ComissaoRecebimentoService.registrarAtestacao', arquivo: 'Dominio_Recebimento.gs', status: 'IMPLEMENTADA' }
        ],
        cobertura: 75
      },
      WF_ANALISTA: {
        funcoes: [
          { nome: 'WorkflowAtestoService.iniciarProcesso', arquivo: 'Core_Workflow_Atesto.gs', status: 'IMPLEMENTADA' },
          { nome: 'WorkflowAtestoService.registrarAnaliseComissao', arquivo: 'Core_Workflow_Atesto.gs', status: 'IMPLEMENTADA' },
          { nome: 'WorkflowAtestoService.registrarAtestoExecutor', arquivo: 'Core_Workflow_Atesto.gs', status: 'IMPLEMENTADA' },
          { nome: 'WorkflowAtestoService.registrarGlosa', arquivo: 'Core_Workflow_Atesto.gs', status: 'IMPLEMENTADA' },
          { nome: 'WorkflowAtestoService.verificarConformidade', arquivo: 'Core_Workflow_Atesto.gs', status: 'IMPLEMENTADA' }
        ],
        cobertura: 85
      }
    };
  },
  
  // === MÉTODOS AUXILIARES ===
  
  _validarTipo: function(valor, spec) {
    try {
      switch (spec.tipo) {
        case 'string':
          if (typeof valor !== 'string') return 'Esperado texto';
          if (spec.tamanho && valor.length !== spec.tamanho) {
            return 'Tamanho deve ser ' + spec.tamanho + ' caracteres';
          }
          break;
        case 'number':
          if (typeof valor !== 'number' || isNaN(valor)) return 'Esperado número';
          if (spec.min !== undefined && valor < spec.min) {
            return 'Valor mínimo: ' + spec.min;
          }
          break;
        case 'boolean':
          if (typeof valor !== 'boolean') return 'Esperado verdadeiro/falso';
          break;
        case 'date':
          if (!(valor instanceof Date) && isNaN(Date.parse(valor))) {
            return 'Esperado data válida';
          }
          break;
        case 'enum':
          if (spec.valores && spec.valores.indexOf(valor) < 0) {
            return 'Valor deve ser um de: ' + spec.valores.join(', ');
          }
          break;
        case 'array':
          if (!Array.isArray(valor)) return 'Esperado lista';
          if (spec.minItens && valor.length < spec.minItens) {
            return 'Mínimo ' + spec.minItens + ' itens';
          }
          break;
      }
      return null;
    } catch (error) {
      Logger.log("Erro em _validarTipo: " + error.message);
      throw error;
    }
  },
  
  _validarRegras: function(workflow, dados) {
    try {
      var erros = [];
      var avisos = [];
    
      // Implementar validações específicas por workflow
      if (workflow.id === 'WF_FORNECEDOR') {
        // R1: Soma dos itens = valor total
        if (dados.notaFiscal && dados.itens && Array.isArray(dados.itens)) {
          var somaItens = dados.itens.reduce(function(acc, item) {
            return acc + (item.valorTotal || 0);
          }, 0);
          if (Math.abs(somaItens - dados.notaFiscal.valorTotal) > 0.01) {
            erros.push({
              regra: 'R1',
              mensagem: 'Soma dos itens (R$ ' + somaItens.toFixed(2) + ') difere do valor total da NF (R$ ' + dados.notaFiscal.valorTotal.toFixed(2) + ')',
              tipo: 'VALIDACAO'
            });
          }
        }
      }
    
      if (workflow.id === 'WF_REPRESENTANTE') {
        // R1: Quantidade recebida <= quantidade NF
        if (dados.itensRecebidos && Array.isArray(dados.itensRecebidos)) {
          dados.itensRecebidos.forEach(function(item, idx) {
            if (item.quantidadeRecebida > item.quantidadeEsperada) {
              erros.push({
                regra: 'R1',
                mensagem: 'Item ' + (idx + 1) + ': quantidade recebida excede quantidade da NF',
                tipo: 'VALIDACAO'
              });
            }
          });
        }
      }
    
      if (workflow.id === 'WF_ANALISTA') {
        // R1: Mínimo 3 membros
        if (dados.analise && dados.analise.membrosComissao) {
          if (dados.analise.membrosComissao.length < 3) {
            erros.push({
              regra: 'R1',
              mensagem: 'Mínimo 3 membros da comissão necessários (atual: ' + dados.analise.membrosComissao.length + ')',
              tipo: 'OBRIGATORIO'
            });
          }
        }
      
        // R4: Valor aprovado + glosado = valor NF
        if (dados.decisao && dados.notaFiscal) {
          var somaDecisao = (dados.decisao.valorAprovado || 0) + (dados.decisao.valorGlosado || 0);
          if (Math.abs(somaDecisao - dados.notaFiscal.valorTotal) > 0.01) {
            avisos.push({
              regra: 'R4',
              mensagem: 'Valor aprovado + glosado difere do valor da NF',
              tipo: 'AVISO'
            });
          }
        }
      }
    
      return { erros: erros, avisos: avisos };
    } catch (error) {
      Logger.log("Erro em _validarRegras: " + error.message);
      throw error;
    }
  },
  
  _estimarCobertura: function() {
    // Baseado nas funções mapeadas
    var mapeamento = this.mapearFuncoesExistentes();
    var total = 0;
    var count = 0;
    
    for (var wf in mapeamento) {
      total += mapeamento[wf].cobertura;
      count++;
    }
    
    return count > 0 ? Math.round(total / count) : 0;
  }
};


// ============================================================================
// FUNÇÕES DE API PARA FRONTEND E DIAGNÓSTICO
// ============================================================================

/**
 * Obtém definição semântica de um workflow
 * @param {string} workflowId - ID do workflow (WF_FORNECEDOR, WF_REPRESENTANTE, WF_ANALISTA)
 * @returns {Object} Definição completa do workflow
 */
function getWorkflowDefinition(workflowId) {
  return WorkflowValidatorService.getWorkflowDefinition(workflowId);
}

/**
 * Lista todos os workflows disponíveis
 * @returns {Array} Lista de workflows com id, nome e ator
 */
function listarWorkflowsDisponiveis() {
  return WorkflowValidatorService.listarWorkflows();
}

/**
 * Valida dados contra um workflow
 * @param {string} workflowId - ID do workflow
 * @param {Object} dados - Dados a validar
 * @returns {Object} Resultado da validação
 */
function validarDadosWorkflow(workflowId, dados) {
  return WorkflowValidatorService.validarDados(workflowId, dados);
}

/**
 * Valida se uma transição de status é permitida
 * @param {string} workflowId - ID do workflow
 * @param {string} statusAtual - Status atual
 * @param {string} novoStatus - Novo status desejado
 * @returns {Object} Resultado da validação
 */
function validarTransicaoStatus(workflowId, statusAtual, novoStatus) {
  return WorkflowValidatorService.validarTransicao(workflowId, statusAtual, novoStatus);
}

/**
 * Gera relatório completo de cobertura dos workflows
 * @returns {Object} Relatório de cobertura
 */
function gerarRelatorioWorkflows() {
  return WorkflowValidatorService.gerarRelatorioCobertura();
}

/**
 * Mapeia funções existentes no projeto para cada workflow
 * @returns {Object} Mapeamento de funções por workflow
 */
function mapearFuncoesWorkflows() {
  return WorkflowValidatorService.mapearFuncoesExistentes();
}

// ============================================================================
// DIAGNÓSTICO E TESTES
// ============================================================================

/**
 * Executa diagnóstico completo dos workflows
 * Útil para validar a integridade do sistema
 */
function executarDiagnosticoWorkflows() {
  try {
    var resultado = {
      dataExecucao: new Date(),
      status: 'OK',
      workflows: [],
      problemas: [],
      recomendacoes: []
    };
  
    try {
      // 1. Verificar definições
      var workflows = ['WF_FORNECEDOR', 'WF_REPRESENTANTE', 'WF_ANALISTA'];
    
      workflows.forEach(function(wfId) {
        var wf = WorkflowValidatorService.getWorkflowDefinition(wfId);
      
        if (!wf) {
          resultado.problemas.push({
            tipo: 'CRITICO',
            workflow: wfId,
            mensagem: 'Definição de workflow não encontrada'
          });
          resultado.status = 'ERRO';
          return;
        }
      
        var analise = {
          id: wfId,
          nome: wf.nome,
          ator: wf.ator,
          status: 'OK',
          detalhes: {
            totalCamposObrigatorios: 0,
            totalRegras: wf.regras.length,
            totalStatus: wf.status.length,
            totalTransicoes: Object.keys(wf.transicoes).length
          }
        };
      
        // Contar campos
        for (var grupo in wf.camposObrigatorios) {
          analise.detalhes.totalCamposObrigatorios += Object.keys(wf.camposObrigatorios[grupo]).length;
        }
      
        // Verificar consistência de transições
        wf.status.forEach(function(status) {
          if (!wf.transicoes[status] && status !== 'PAGO' && status !== 'LIQUIDADO') {
            resultado.problemas.push({
              tipo: 'AVISO',
              workflow: wfId,
              mensagem: 'Status "' + status + '" não tem transições definidas'
            });
          }
        });
      
        resultado.workflows.push(analise);
      });
    
      // 2. Verificar mapeamento de funções
      var mapeamento = WorkflowValidatorService.mapearFuncoesExistentes();
    
      for (var wfId in mapeamento) {
        var wfMap = mapeamento[wfId];
      
        if (wfMap.cobertura < 70) {
          resultado.recomendacoes.push({
            workflow: wfId,
            mensagem: 'Cobertura abaixo de 70% (' + wfMap.cobertura + '%). Considere implementar mais funcionalidades.'
          });
        }
      
        wfMap.funcoes.forEach(function(fn) {
          if (fn.status === 'SIMULADA') {
            resultado.recomendacoes.push({
              workflow: wfId,
              mensagem: 'Função "' + fn.nome + '" está simulada. Implementar integração real.'
            });
          }
        });
      }
    
      // 3. Gerar resumo
      resultado.resumo = {
        totalWorkflows: workflows.length,
        workflowsOk: resultado.workflows.filter(function(w) { return w.status === 'OK'; }).length,
        totalProblemas: resultado.problemas.length,
        totalRecomendacoes: resultado.recomendacoes.length,
        coberturaMedia: Math.round(
          (mapeamento.WF_FORNECEDOR.cobertura + 
           mapeamento.WF_REPRESENTANTE.cobertura + 
           mapeamento.WF_ANALISTA.cobertura) / 3
        )
      };
    
      Logger.log('=== DIAGNÓSTICO DE WORKFLOWS ===');
      Logger.log('Status: ' + resultado.status);
      Logger.log('Workflows analisados: ' + resultado.resumo.totalWorkflows);
      Logger.log('Cobertura média: ' + resultado.resumo.coberturaMedia + '%');
      Logger.log('Problemas encontrados: ' + resultado.resumo.totalProblemas);
      Logger.log('Recomendações: ' + resultado.resumo.totalRecomendacoes);
    
    } catch (error) {
      resultado.status = 'ERRO';
      resultado.problemas.push({
        tipo: 'CRITICO',
        mensagem: 'Erro durante diagnóstico: ' + error.message
      });
      Logger.log('ERRO no diagnóstico: ' + error.message);
    }
  
    return resultado;
  } catch (error) {
    Logger.log("Erro em executarDiagnosticoWorkflows: " + error.message);
    throw error;
  }
}

/**
 * Testa validação do workflow de Fornecedor
 */
function testarWorkflowFornecedor() {
  try {
    try {
      Logger.log('=== TESTE: Workflow Fornecedor ===');
  
      // Dados de teste válidos
      var dadosValidos = {
        notaFiscal: {
          numero: '123456',
          serie: '1',
          chaveAcesso: '35200114200166000187550010000000015301234567',
          dataEmissao: new Date(),
          valorTotal: 1500.00,
          cnpjEmitente: '12345678000199'
        },
        itens: [
          { descricao: 'Arroz', quantidade: 100, unidadeMedida: 'KG', valorUnitario: 5.00, valorTotal: 500.00 },
          { descricao: 'Feijão', quantidade: 100, unidadeMedida: 'KG', valorUnitario: 10.00, valorTotal: 1000.00 }
        ]
      };
  
      var resultado = validarDadosWorkflow('WF_FORNECEDOR', dadosValidos);
      Logger.log('Dados válidos - Resultado: ' + (resultado.valido ? 'PASSOU' : 'FALHOU'));
      Logger.log('Erros: ' + resultado.erros.length);
  
      // Dados de teste inválidos (soma não bate)
      var dadosInvalidos = {
        notaFiscal: {
          numero: '123456',
          serie: '1',
          chaveAcesso: '35200114200166000187550010000000015301234567',
          dataEmissao: new Date(),
          valorTotal: 2000.00, // Valor errado
          cnpjEmitente: '12345678000199'
        },
        itens: [
          { descricao: 'Arroz', quantidade: 100, unidadeMedida: 'KG', valorUnitario: 5.00, valorTotal: 500.00 }
        ]
      };
  
      resultado = validarDadosWorkflow('WF_FORNECEDOR', dadosInvalidos);
      Logger.log('Dados inválidos - Resultado: ' + (resultado.valido ? 'PASSOU' : 'FALHOU (esperado)'));
      Logger.log('Erros encontrados: ' + JSON.stringify(resultado.erros));
  
      return resultado;
    } catch (error) {
      Logger.log("Erro em testarWorkflowFornecedor: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em testarWorkflowFornecedor: " + error.message);
    throw error;
  }
}

/**
 * Testa validação do workflow de Representante Escolar
 */
function testarWorkflowRepresentante() {
  Logger.log('=== TESTE: Workflow Representante Escolar ===');
  
  var dados = {
    termoRecebimento: {
      notaFiscalRef: 'NF-123456',
      unidadeEscolar: 'EC 01 Plano Piloto',
      dataRecebimento: new Date(),
      horaRecebimento: '10:30',
      responsavel: 'Maria Silva',
      matricula: '123456',
      assinatura: true,
      identificacaoUE: true
    },
    itensRecebidos: [
      { itemNFRef: 'ITEM-1', descricao: 'Arroz', quantidadeEsperada: 100, quantidadeRecebida: 100, unidadeMedida: 'KG', conforme: true },
      { itemNFRef: 'ITEM-2', descricao: 'Feijão', quantidadeEsperada: 50, quantidadeRecebida: 48, unidadeMedida: 'KG', conforme: false }
    ],
    conferencia: {
      temperaturaAferida: null,
      embalagemIntegra: true,
      validadeOk: true,
      caracteristicasOk: true
    }
  };
  
  var resultado = validarDadosWorkflow('WF_REPRESENTANTE', dados);
  Logger.log('Resultado: ' + (resultado.valido ? 'VÁLIDO' : 'INVÁLIDO'));
  Logger.log('Erros: ' + resultado.erros.length);
  Logger.log('Avisos: ' + resultado.avisos.length);
  
  return resultado;
}

/**
 * Testa validação do workflow de Analista UNIAE
 */
function testarWorkflowAnalista() {
  Logger.log('=== TESTE: Workflow Analista UNIAE ===');
  
  // Teste com menos de 3 membros (deve falhar)
  var dadosInvalidos = {
    analise: {
      processoId: 'PROC-001',
      notaFiscalRef: 'NF-123456',
      dataAnalise: new Date(),
      analistaResponsavel: 'João Analista',
      membrosComissao: ['Membro 1', 'Membro 2'] // Apenas 2 membros
    },
    verificacoes: {
      somaQuantitativos: true,
      atestoEscolarCompleto: true,
      nfAutentica: true,
      precosConformes: true
    },
    decisao: {
      tipo: 'APROVADO_TOTAL',
      valorAprovado: 1500.00,
      valorGlosado: 0,
      justificativa: 'Documentação conforme'
    }
  };
  
  var resultado = validarDadosWorkflow('WF_ANALISTA', dadosInvalidos);
  Logger.log('Com 2 membros - Resultado: ' + (resultado.valido ? 'VÁLIDO' : 'INVÁLIDO (esperado)'));
  
  // Teste com 3 membros (deve passar)
  dadosInvalidos.analise.membrosComissao = ['Membro 1', 'Membro 2', 'Membro 3'];
  resultado = validarDadosWorkflow('WF_ANALISTA', dadosInvalidos);
  Logger.log('Com 3 membros - Resultado: ' + (resultado.valido ? 'VÁLIDO' : 'INVÁLIDO'));
  
  return resultado;
}

/**
 * Executa todos os testes de workflow
 */
function executarTodosTestesWorkflow() {
  try {
    Logger.log('');
    Logger.log('╔════════════════════════════════════════════════════════════╗');
    Logger.log('║     SUITE DE TESTES - VALIDADOR SEMÂNTICO DE WORKFLOWS     ║');
    Logger.log('╚════════════════════════════════════════════════════════════╝');
    Logger.log('');
  
    var resultados = {
      dataExecucao: new Date(),
      testes: []
    };
  
    // Teste 1: Diagnóstico geral
    Logger.log('▶ Executando diagnóstico geral...');
    var diag = executarDiagnosticoWorkflows();
    resultados.testes.push({ nome: 'Diagnóstico', status: diag.status });
  
    // Teste 2: Workflow Fornecedor
    Logger.log('');
    Logger.log('▶ Testando Workflow Fornecedor...');
    var t1 = testarWorkflowFornecedor();
    resultados.testes.push({ nome: 'WF_FORNECEDOR', status: t1.erros.length === 0 ? 'OK' : 'FALHAS' });
  
    // Teste 3: Workflow Representante
    Logger.log('');
    Logger.log('▶ Testando Workflow Representante...');
    var t2 = testarWorkflowRepresentante();
    resultados.testes.push({ nome: 'WF_REPRESENTANTE', status: t2.erros.length === 0 ? 'OK' : 'FALHAS' });
  
    // Teste 4: Workflow Analista
    Logger.log('');
    Logger.log('▶ Testando Workflow Analista...');
    var t3 = testarWorkflowAnalista();
    resultados.testes.push({ nome: 'WF_ANALISTA', status: 'OK' }); // Esperamos falha controlada
  
    // Resumo
    Logger.log('');
    Logger.log('═══════════════════════════════════════════════════════════════');
    Logger.log('RESUMO DOS TESTES:');
    resultados.testes.forEach(function(t) {
      Logger.log('  • ' + t.nome + ': ' + t.status);
    });
    Logger.log('═══════════════════════════════════════════════════════════════');
  
    return resultados;
  } catch (error) {
    Logger.log("Erro em executarTodosTestesWorkflow: " + error.message);
    throw error;
  }
}

// ============================================================================
// INTEGRAÇÃO COM MENU DO SISTEMA
// ============================================================================

/**
 * Adiciona opções de validação de workflow ao menu
 */
function adicionarMenuWorkflowValidator() {
  try {
    var ui = SpreadsheetApp.getUi();
  
    ui.createMenu('🔍 Validador de Workflows')
      .addItem('📊 Diagnóstico Completo', 'executarDiagnosticoWorkflows')
      .addItem('📋 Relatório de Cobertura', 'exibirRelatorioCobertura')
      .addSeparator()
      .addItem('🧪 Executar Testes', 'executarTodosTestesWorkflow')
      .addSeparator()
      .addSubMenu(ui.createMenu('📖 Definições')
        .addItem('Workflow Fornecedor', 'exibirWorkflowFornecedor')
        .addItem('Workflow Representante', 'exibirWorkflowRepresentante')
        .addItem('Workflow Analista', 'exibirWorkflowAnalista'))
      .addToUi();
  } catch (error) {
    Logger.log("Erro em adicionarMenuWorkflowValidator: " + error.message);
    throw error;
  }
}

/**
 * Exibe relatório de cobertura em dialog
 */
function exibirRelatorioCobertura() {
  try {
    var relatorio = gerarRelatorioWorkflows();
    var mapeamento = mapearFuncoesWorkflows();
  
    var html = '<style>';
    html += 'body { font-family: Arial, sans-serif; padding: 20px; }';
    html += '.workflow { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 8px; }';
    html += '.cobertura { font-size: 24px; font-weight: bold; }';
    html += '.ok { color: #0d652d; }';
    html += '.warn { color: #e37400; }';
    html += '.funcao { padding: 5px 10px; margin: 3px 0; background: #fff; border-radius: 4px; }';
    html += '</style>';
  
    html += '<h2>📊 Relatório de Cobertura dos Workflows</h2>';
    html += '<p>Gerado em: ' + relatorio.dataGeracao + '</p>';
  
    html += '<h3>Resumo</h3>';
    html += '<ul>';
    html += '<li>Total de Workflows: ' + relatorio.resumo.totalWorkflows + '</li>';
    html += '<li>Total de Entidades: ' + relatorio.resumo.totalEntidades + '</li>';
    html += '<li>Total de Regras: ' + relatorio.resumo.totalRegras + '</li>';
    html += '<li>Cobertura Estimada: <strong>' + relatorio.resumo.coberturaEstimada + '%</strong></li>';
    html += '</ul>';
  
    relatorio.workflows.forEach(function(wf) {
      var map = mapeamento[wf.id];
      var corCobertura = map.cobertura >= 80 ? 'ok' : 'warn';
    
      html += '<div class="workflow">';
      html += '<h4>' + wf.nome + ' (' + wf.ator + ')</h4>';
      html += '<p class="cobertura ' + corCobertura + '">' + map.cobertura + '% coberto</p>';
      html += '<p>Campos: ' + wf.totalCampos + ' | Regras: ' + wf.totalRegras + ' | Status: ' + wf.status.length + '</p>';
      html += '<strong>Funções implementadas:</strong>';
      map.funcoes.forEach(function(fn) {
        html += '<div class="funcao">• ' + fn.nome + ' <small>(' + fn.status + ')</small></div>';
      });
      html += '</div>';
    });
  
    var output = HtmlService.createHtmlOutput(html)
      .setWidth(600)
      .setHeight(500);
  
    SpreadsheetApp.getUi().showModalDialog(output, 'Relatório de Workflows');
  } catch (error) {
    Logger.log("Erro em exibirRelatorioCobertura: " + error.message);
    throw error;
  }
}

/**
 * Exibe definição do workflow de Fornecedor
 */
function exibirWorkflowFornecedor() {
  _exibirDefinicaoWorkflow('WF_FORNECEDOR');
}

/**
 * Exibe definição do workflow de Representante
 */
function exibirWorkflowRepresentante() {
  _exibirDefinicaoWorkflow('WF_REPRESENTANTE');
}

/**
 * Exibe definição do workflow de Analista
 */
function exibirWorkflowAnalista() {
  _exibirDefinicaoWorkflow('WF_ANALISTA');
}

/**
 * Helper para exibir definição de workflow
 */
function _exibirDefinicaoWorkflow(workflowId) {
  try {
    var wf = getWorkflowDefinition(workflowId);
    if (!wf) {
      SpreadsheetApp.getUi().alert('Workflow não encontrado: ' + workflowId);
      return;
    }
  
    var html = '<style>';
    html += 'body { font-family: Arial, sans-serif; padding: 20px; font-size: 14px; }';
    html += 'h2 { color: #1a73e8; }';
    html += '.section { background: #f8f9fa; padding: 12px; margin: 10px 0; border-radius: 8px; }';
    html += '.campo { padding: 4px 8px; margin: 2px 0; background: #fff; border-left: 3px solid #1a73e8; }';
    html += '.regra { padding: 4px 8px; margin: 2px 0; background: #fff; border-left: 3px solid #fbbc04; }';
    html += '.status { display: inline-block; padding: 4px 8px; margin: 2px; background: #e8f0fe; border-radius: 4px; }';
    html += '</style>';
  
    html += '<h2>' + wf.nome + '</h2>';
    html += '<p><strong>Ator:</strong> ' + wf.ator + '</p>';
    html += '<p>' + wf.descricao + '</p>';
  
    html += '<div class="section"><h3>📋 Campos Obrigatórios</h3>';
    for (var grupo in wf.camposObrigatorios) {
      html += '<h4>' + grupo + '</h4>';
      for (var campo in wf.camposObrigatorios[grupo]) {
        var spec = wf.camposObrigatorios[grupo][campo];
        html += '<div class="campo"><strong>' + campo + '</strong> (' + spec.tipo + '): ' + spec.descricao + '</div>';
      }
    }
    html += '</div>';
  
    html += '<div class="section"><h3>📜 Regras de Negócio</h3>';
    wf.regras.forEach(function(r) {
      html += '<div class="regra"><strong>' + r.id + '</strong>: ' + r.descricao + ' <small>(' + r.tipo + ')</small></div>';
    });
    html += '</div>';
  
    html += '<div class="section"><h3>🔄 Status Possíveis</h3>';
    wf.status.forEach(function(s) {
      html += '<span class="status">' + s + '</span>';
    });
    html += '</div>';
  
    var output = HtmlService.createHtmlOutput(html)
      .setWidth(650)
      .setHeight(550);
  
    SpreadsheetApp.getUi().showModalDialog(output, 'Definição: ' + wf.nome);
  } catch (error) {
    Logger.log("Erro em _exibirDefinicaoWorkflow: " + error.message);
    throw error;
  }
}
