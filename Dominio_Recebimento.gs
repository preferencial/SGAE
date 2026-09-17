'use strict';

/**
 * DOMINIO_RECEBIMENTO
 * Consolidado de : RecebimentoGeneros.gs, ComissaoRecebimento.gs, ArmazenamentoGeneros.gs
 * @version 2.0.0
 * @created 2025-11-04
 */


// ---- RecebimentoGeneros.gs ----
/**
 * RecebimentoGeneros.gs - Recebimento de Gêneros Alimentícios
 * Implementação do Manual da Alimentação Escolar do DF (Itens 12 e 13)
 *
 * BASE LEGAL :
 * - Manual da Alimentação Escolar DF : Critérios de recebimento
 * - Resolução FNDE 06/2020 : Comissão de Recebimento
 * - Lei 14.133/2021 : Fiscalização de contratos
 * - RDC ANVISA 216/2004 : Boas práticas
 *
 * ESCOPO :
 * - Critérios gerais de recebimento
 * - Recebimento de perecíveis
 * - Recebimento de não perecíveis
 * - Controle de qualidade
 * - Registro de conformidades/não conformidades
 */

/**
 * TIPOS DE GÊNEROS (Manual Item 11.3)
 */
var TIPOS_GENEROS = {
  PERECIVEIS : {
    codigo : 'PERECIVEL',
    exemplos : ['Carnes', 'Hortifrutis', 'Laticínios', 'Ovos', 'Pães'],
    exigem_refrigeracao : true
  },
  NAO_PERECIVEIS : {
    codigo : 'NAO_PERECIVEL',
    exemplos : ['Arroz', 'Feijão', 'Óleo', 'Açúcar', 'Enlatados'],
    exigem_refrigeracao : false
  }
};

/**
 * CRITÉRIOS DE RECEBIMENTO PERECÍVEIS (Manual Item 12.1)
 */
var CRITERIOS_PERECIVEIS = {
  TEMPERATURA : {
    RESFRIADOS : { min: 0, max : 10, unidade : '°C' },
    CONGELADOS : { min : -18, max : -12, unidade : '°C' },
    AMBIENTE : { min: 20, max : 26, unidade : '°C' }
  },
  EMBALAGEM : {
    integra : true,
    limpa : true,
    identificada : true,
    sem_violacao : true
  },
  CARACTERISTICAS_ORGANOLEPTICAS : [
    'Cor característica',
    'Odor característico',
    'Textura adequada',
    'Ausência de deterioração'
  ]
};

/**
 * CRITÉRIOS DE RECEBIMENTO NÃO PERECÍVEIS (Manual Item 12.2)
 */
var CRITERIOS_NAO_PERECIVEIS = {
  EMBALAGEM : {
    integra : true,
    limpa : true,
    sem_umidade : true,
    sem_pragas : true,
    rotulagem_completa : true
  },
  VALIDADE : {
    minimo_dias : 30,
    verificar_lote : true
  },
  ARMAZENAMENTO : {
    local_seco : true,
    ventilado : true,
    protegido_luz : true
  }
};

/**
 * STATUS DE RECEBIMENTO
 */
var STATUS_RECEBIMENTO = {
  AGUARDANDO : 'Aguardando Entrega',
  RECEBIDO_CONFORME : 'Recebido Conforme',
  RECEBIDO_PARCIAL : 'Recebido Parcial',
  RECUSADO : 'Recusado',
  RECEBIDO_COM_RESSALVAS : 'Recebido com Ressalvas',
  AGUARDANDO_ANALISE : 'Aguardando Análise'
};

/**
 * MOTIVOS DE RECUSA (Manual Item 12)
 */
var MOTIVOS_RECUSA = (typeof CONSTANTS !== 'undefined' && CONSTANTS && CONSTANTS.MOTIVOS_RECUSA) ? CONSTANTS.MOTIVOS_RECUSA : {
  TEMPERATURA_INADEQUADA : 'Temperatura inadequada',
  EMBALAGEM_VIOLADA : 'Embalagem violada ou danificada',
  PRODUTO_VENCIDO : 'Produto vencido',
  VALIDADE_INSUFICIENTE : 'Validade insuficiente (<30 dias)',
  CARACTERISTICAS_ALTERADAS : 'Características organolépticas alteradas',
  QUANTIDADE_DIVERGENTE : 'Quantidade divergente da nota fiscal',
  PRODUTO_ERRADO : 'Produto diferente do solicitado'
};
/*
var MOTIVOS_RECUSA = {
  TEMPERATURA_INADEQUADA : 'Temperatura inadequada',
  EMBALAGEM_VIOLADA : 'Embalagem violada ou danificada',
  PRODUTO_VENCIDO : 'Produto vencido',
  VALIDADE_INSUFICIENTE : 'Validade insuficiente (<30 dias)',
  CARACTERISTICAS_ALTERADAS : 'Características organolépticas alteradas',
  QUANTIDADE_DIVERGENTE : 'Quantidade divergente da nota fiscal',
  PRODUTO_ERRADO : 'Produto diferente do solicitado',
  PRESENCA_PRAGAS : 'Presença de pragas ou sujidades',
  SEM_ROTULAGEM : 'Sem rotulagem ou rotulagem incompleta',
  TRANSPORTE_INADEQUADO : 'Transporte inadequado'
};
*/

/**
 * Service : Recebimento de Gêneros
 */
function RecebimentoGenerosService(dependencies) {
  try {
    try {
      BaseService.call(this, dependencies);
      this.sheetName = 'Recebimento_Generos';
    } catch (error) {
      Logger.log("Erro em RecebimentoGenerosService: " + error.message);
      throw error; // Re-lança para tratamento superior
    }
  } catch (error) {
    Logger.log("Erro em RecebimentoGenerosService: " + error.message);
    throw error;
  }
}

RecebimentoGenerosService.prototype = Object.create(BaseService.prototype);
RecebimentoGenerosService.prototype.constructor = RecebimentoGenerosService;

/**
 * Registra recebimento de gêneros (Manual Item 12)
 */
RecebimentoGenerosService.prototype.registrarRecebimento = function(dados) {
  validateRequired(dados.notaFiscal, 'Nota Fiscal');
  validateRequired(dados.fornecedor, 'Fornecedor');
  validateRequired(dados.dataEntrega, 'Data de Entrega');
  validateRequired(dados.unidadeEscolar, 'Unidade Escolar');
  validateRequired(dados.tipoGenero, 'Tipo de Gênero');

  var sheet = getOrCreateSheetSafe(this.sheetName);
  var registro = {
    id : this.generateId(),
    dataRegistro : new Date(),
    notaFiscal : dados.notaFiscal,
    fornecedor : dados.fornecedor,
    cnpjFornecedor : dados.cnpjFornecedor || '',
    dataEntrega : dados.dataEntrega,
    horaEntrega : dados.horaEntrega || '',
    unidadeEscolar : dados.unidadeEscolar,
    cre : dados.cre || '',
    tipoGenero : dados.tipoGenero,
    produtos : dados.produtos || [],
    valorTotal : dados.valorTotal || 0,
    responsavelRecebimento : dados.responsavelRecebimento || '',
    comissaoRecebimento : dados.comissaoRecebimento || [],
    status : STATUS_RECEBIMENTO.AGUARDANDO,
    observacoes : dados.observacoes || '',
    baseLegal : 'Manual Alimentação Escolar DF Item 12',
    pdgp : dados.pdgp || '',
    distribuicao : dados.distribuicao || ''
  };

  this.salvarRegistro(registro);

  SystemLogger.info('Recebimento registrado', {
    id : registro.id,
    nf : dados.notaFiscal,
    fornecedor : dados.fornecedor,
    unidade : dados.unidadeEscolar
  });

  return registro;

};

/**
 * Registra conferência de recebimento (Manual Item 12.1 e 12.2)
 * @param {string} idRecebimento - ID do recebimento
 * @param {Object} dadosConferencia - Dados da conferência
 * @param {string} token - Token de autenticação
 * @returns {Object} Registro atualizado
 */
RecebimentoGenerosService.prototype.registrarConferencia = function(idRecebimento, dadosConferencia, token) {
  // Autenticação: requer papel adequado
  if (typeof checkPermission === 'function') {
    var authResult = checkPermission('user', token);
    if (!authResult || !authResult.ok) {
      throw new Error('FORBIDDEN: Autenticação necessária para registrar conferência');
    }
  }
  
  validateRequired(dadosConferencia.produtosConferidos, 'Produtos Conferidos');
  validateRequired(dadosConferencia.responsavelConferencia, 'Responsável pela Conferência');

  var registro = this.buscarPorId(idRecebimento);
  if (!registro) {
    throw new Error('Recebimento não encontrado : ' + idRecebimento);
  }

  var resultadoConferencia = this.avaliarConformidade(dadosConferencia.produtosConferidos, registro.tipoGenero);

  registro.dataConferencia = new Date();
  registro.responsavelConferencia = dadosConferencia.responsavelConferencia;
  registro.produtosConferidos = dadosConferencia.produtosConferidos;
  registro.conformidades = resultadoConferencia.conformidades;
  registro.naoConformidades = resultadoConferencia.naoConformidades;
  registro.totalItensConferidos = dadosConferencia.produtosConferidos.length;
  registro.itensConformes = resultadoConferencia.conformidades.length;
  registro.itensNaoConformes = resultadoConferencia.naoConformidades.length;
  registro.temperaturaAferida = dadosConferencia.temperaturaAferida || null;
  registro.observacoesConferencia = dadosConferencia.observacoes || '';

  // Determinar status final
  if (resultadoConferencia.naoConformidades.length == 0) {
    registro.status = STATUS_RECEBIMENTO.RECEBIDO_CONFORME;
  } else if (resultadoConferencia.naoConformidades.length == dadosConferencia.produtosConferidos.length) {
    registro.status = STATUS_RECEBIMENTO.RECUSADO;
  } else {
    registro.status = STATUS_RECEBIMENTO.RECEBIDO_PARCIAL;
  }

  this.atualizarRegistro(registro);

  SystemLogger.info('Conferência registrada', {
    id : idRecebimento,
    status : registro.status,
    conformes : registro.itensConformes,
    naoConformes : registro.itensNaoConformes
  });

  return registro;
};

/**
 * Avalia conformidade dos produtos (Manual Item 12.1 e 12.2)
 */
RecebimentoGenerosService.prototype.avaliarConformidade = function(produtos, tipoGenero) {
  var conformidades = [];
  var naoConformidades = [];

  produtos.forEach(function(produto) {
    var conforme = true;
    var motivos = [];

    if (tipoGenero == TIPOS_GENEROS.PERECIVEIS.codigo) {
      // Verificar temperatura
      if (produto.temperatura) {
        var criterioTemp = this.getCriterioTemperatura(produto.tipoConservacao);
        if (produto.temperatura < criterioTemp.min || produto.temperatura > criterioTemp.max) {
          conforme = false;
          motivos.push(MOTIVOS_RECUSA.TEMPERATURA_INADEQUADA);
        }
      }

      // Verificar características organolépticas
      if (produto.caracteristicasAlteradas) {
        conforme = false;
        motivos.push(MOTIVOS_RECUSA.CARACTERISTICAS_ALTERADAS);
      }
    }

    // Verificações comuns
    if (produto.embalagemViolada) {
      conforme = false;
      motivos.push(MOTIVOS_RECUSA.EMBALAGEM_VIOLADA);
    }

    if (produto.vencido) {
      conforme = false;
      motivos.push(MOTIVOS_RECUSA.PRODUTO_VENCIDO);
    }

    if (produto.validadeInsuficiente) {
      conforme = false;
      motivos.push(MOTIVOS_RECUSA.VALIDADE_INSUFICIENTE);
    }

    if (produto.quantidadeDivergente) {
      conforme = false;
      motivos.push(MOTIVOS_RECUSA.QUANTIDADE_DIVERGENTE);
    }

    if (produto.presencaPragas) {
      conforme = false;
      motivos.push(MOTIVOS_RECUSA.PRESENCA_PRAGAS);
    }

    if (conforme) {
      conformidades.push(produto);
    } else {
      naoConformidades.push({
        produto : produto,
        motivos : motivos
      });
    }
  }.bind(this));

  return {
    conformidades : conformidades,
    naoConformidades : naoConformidades
  };
};

/**
 * Obtém critério de temperatura (Manual Item 12.1)
 */
RecebimentoGenerosService.prototype.getCriterioTemperatura = function(tipoConservacao) {
  switch(tipoConservacao) {
    case 'RESFRIADO' :
      return CRITERIOS_PERECIVEIS.TEMPERATURA.RESFRIADOS;
    case 'CONGELADO' :
      return CRITERIOS_PERECIVEIS.TEMPERATURA.CONGELADOS;
    default :
      return CRITERIOS_PERECIVEIS.TEMPERATURA.AMBIENTE;
  }
};

/**
 * Registra recusa de recebimento
 * @param {string} idRecebimento - ID do recebimento
 * @param {Object} dadosRecusa - Dados da recusa
 * @param {string} token - Token de autenticação
 * @returns {Object} Registro atualizado
 */
RecebimentoGenerosService.prototype.registrarRecusa = function(idRecebimento, dadosRecusa, token) {
  // Autenticação: requer papel adequado
  if (typeof checkPermission === 'function') {
    var authResult = checkPermission('user', token);
    if (!authResult || !authResult.ok) {
      throw new Error('FORBIDDEN: Autenticação necessária para registrar recusa');
    }
  }
  
  validateRequired(dadosRecusa.motivos, 'Motivos da Recusa');
  validateRequired(dadosRecusa.responsavel, 'Responsável pela Recusa');

  var registro = this.buscarPorId(idRecebimento);
  if (!registro) {
    throw new Error('Recebimento não encontrado : ' + idRecebimento);
  }

  registro.dataRecusa = new Date();
  registro.motivosRecusa = dadosRecusa.motivos;
  registro.responsavelRecusa = dadosRecusa.responsavel;
  registro.observacoesRecusa = dadosRecusa.observacoes || '';
  registro.status = STATUS_RECEBIMENTO.RECUSADO;
  registro.registradoReciboEntrega = dadosRecusa.registradoRecibo || false;
  registro.fotografiasRecusa = dadosRecusa.fotografias || [];

  this.atualizarRegistro(registro);

  SystemLogger.info('Recusa registrada', {
    id : idRecebimento,
    motivos : dadosRecusa.motivos.length
  });

  return registro;
};

/**
 * Lista recebimentos por unidade escolar
 */
RecebimentoGenerosService.prototype.listarPorUnidadeEscolar = function(unidadeEscolar, periodo) {
  var todosRegistros = this.listarTodos();

  return todosRegistros.filter(function(reg) {
    var matchUnidade = reg.unidadeEscolar == unidadeEscolar;

    if (periodo) {
      var dataInicio = new Date(periodo.inicio);
      var dataFim = new Date(periodo.fim);
      var dataEntrega = new Date(reg.dataEntrega);
      return matchUnidade && dataEntrega >= dataInicio && dataEntrega <= dataFim;
    }

    return matchUnidade;
  });
};

/**
 * Gera relatório de conformidade
 */
RecebimentoGenerosService.prototype.gerarRelatorioConformidade = function(filtros) {
  var registros = this.listarTodos();

  if (filtros) {
    if (filtros.cre) {
      registros = registros.filter(function(r) { return r.cre == filtros.cre; });
    }
    if (filtros.periodo) {
      var dataInicio = new Date(filtros.periodo.inicio);
      var dataFim = new Date(filtros.periodo.fim);
      registros = registros.filter(function(r) {
        var data = new Date(r.dataEntrega);
        return data >= dataInicio && data <= dataFim;
      });
    }
  }

  var relatorio = {
    totalRecebimentos : registros.length,
    recebidosConformes : 0,
    recebidosParciais : 0,
    recusados : 0,
    taxaConformidade : 0,
    porFornecedor : {},
    motivosRecusaMaisFrequentes : {}
  };

  registros.forEach(function(reg) {
    if (reg.status == STATUS_RECEBIMENTO.RECEBIDO_CONFORME) {
      relatorio.recebidosConformes++
    } else if (reg.status == STATUS_RECEBIMENTO.RECEBIDO_PARCIAL) {
      relatorio.recebidosParciais++
    } else if (reg.status == STATUS_RECEBIMENTO.RECUSADO) {
      relatorio.recusados++

      if (reg.motivosRecusa) {
        reg.motivosRecusa.forEach(function(motivo) {
          relatorio.motivosRecusaMaisFrequentes[motivo] =
            (relatorio.motivosRecusaMaisFrequentes[motivo] || 0) + 1;
        });
      }
    }

    if (!relatorio.porFornecedor[reg.fornecedor]) {
      relatorio.porFornecedor[reg.fornecedor] = {
        total : 0,
        conformes : 0,
        recusados : 0
      };
    }
    relatorio.porFornecedor[reg.fornecedor].total++
    if (reg.status == STATUS_RECEBIMENTO.RECEBIDO_CONFORME) {
      relatorio.porFornecedor[reg.fornecedor].conformes++
    } else if (reg.status == STATUS_RECEBIMENTO.RECUSADO) {
      relatorio.porFornecedor[reg.fornecedor].recusados++
    }
  });

  if (registros.length > 0) {
    relatorio.taxaConformidade = Math.round((relatorio.recebidosConformes / registros.length) * 100 * 10) / 10;
  }

  return relatorio;
};

/**
 * Métodos auxiliares
 */
RecebimentoGenerosService.prototype.salvarRegistro = function(registro) {
  var sheet = getOrCreateSheetSafe(this.sheetName);
  var headers = this.getHeaders();

  if (sheet.getLastRow() == 0) {
    sheet.appendRow(headers);
  }

  var row = this.mapRegistroToRow(registro, headers);
  sheet.appendRow(row);
};

RecebimentoGenerosService.prototype.atualizarRegistro = function(registro) {
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

/**
 * Busca recebimento por ID
 * @param {string} id - ID do recebimento
 * @returns {Object|null} Registro encontrado ou null
 */
RecebimentoGenerosService.prototype.buscarPorId = function(id) {
  if (!id) {
    return null;
  }
  
  var registros = this.listarTodos();
  
  for (var i = 0; i < registros.length; i++) {
    if (String(registros[i].id) === String(id)) {
      return registros[i];
    }
  }
  
  return null;
};

RecebimentoGenerosService.prototype.listarTodos = function() {
  var sheet = getOrCreateSheetSafe(this.sheetName);
  if (sheet.getLastRow() <= 1) return [];

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var registros = [];

  for (var i = 1; i < data.length; i++) {
    registros.push(this.mapRowToRegistro(data[i], headers));
  }

  return registros;
};

RecebimentoGenerosService.prototype.getHeaders = function() {
  return ['ID', 'Data Registro', 'Nota Fiscal', 'Fornecedor', 'CNPJ Fornecedor', 'Data Entrega', 'Hora Entrega',
          'Unidade Escolar', 'CRE', 'Tipo Gênero', 'Valor Total', 'Responsável Recebimento',
          'Status', 'Data Conferência', 'Responsável Conferência', 'Total Itens', 'Itens Conformes',
          'Itens Não Conformes', 'Temperatura Aferida', 'Motivos Recusa', 'Observações', 'Base Legal'];
};

RecebimentoGenerosService.prototype.mapRegistroToRow = function(reg, headers) {
  return [
    reg.id, reg.dataRegistro, reg.notaFiscal, reg.fornecedor, reg.cnpjFornecedor || '',
    reg.dataEntrega, reg.horaEntrega || '', reg.unidadeEscolar, reg.cre || '', reg.tipoGenero,
    reg.valorTotal || '', reg.responsavelRecebimento || '', reg.status, reg.dataConferencia || '',
    reg.responsavelConferencia || '', reg.totalItensConferidos || '', reg.itensConformes || '',
    reg.itensNaoConformes || '', reg.temperaturaAferida || '',
    reg.motivosRecusa ? reg.motivosRecusa.join('; ') : '', reg.observacoes || '', reg.baseLegal || ''
  ];
};

RecebimentoGenerosService.prototype.mapRowToRegistro = function(row, headers) {
  return {
    id : row[0], dataRegistro : row[1], notaFiscal : row[2], fornecedor : row[3], cnpjFornecedor : row[4],
    dataEntrega : row[5], horaEntrega : row[6], unidadeEscolar : row[7], cre : row[8], tipoGenero : row[9],
    valorTotal : row[10], responsavelRecebimento : row[11], status : row[12], dataConferencia : row[13],
    responsavelConferencia : row[14], totalItensConferidos : row[15], itensConformes : row[16],
    itensNaoConformes : row[17], temperaturaAferida : row[18],
    motivosRecusa : row[19] ? row[19].split('; ') : [], observacoes : row[20], baseLegal : row[21]
  };
};

RecebimentoGenerosService.prototype.generateId = function() {
  return 'REC_' + new Date().getTime();
};

/**
 * Registrar serviço no DI Container
 */
function registerRecebimentoGeneros() {
  DIContainer.bind('recebimentoGeneros', function() {
    return new RecebimentoGenerosService({});
  }, true);

  SystemLogger.info('RecebimentoGeneros service registered');
}


// ---- ComissaoRecebimento.gs ----
/**
 * ComissaoRecebimento.gs - Comissão de Recebimento de Gêneros Alimentícios
 * Implementação conforme Resolução FNDE 06/2020 e Portaria 244/2006
 *
 * BASE LEGAL :
 * - Resolução CD/FNDE 06/2020 : Atestação por Comissão de Recebimento
 * - Portaria 244/2006 : Base histórica do sistema
 * - Lei 14.133/2021 : Fiscalização de contratos
 * - Manual da Alimentação Escolar DF : Procedimentos operacionais
 *
 * ESCOPO :
 * - Constituição da Comissão de Recebimento
 * - Designação de membros
 * - Atestação de notas fiscais
 * - Registro de ocorrências
 * - Relatórios de atividades
 */

/**
 * COMPOSIÇÃO DA COMISSÃO (Resolução FNDE 06/2020)
 */
var COMPOSICAO_COMISSAO = {
  MINIMO_MEMBROS : 3,
  MAXIMO_MEMBROS : 5,
  EXIGE_NUTRICIONISTA : true,
  EXIGE_DESIGNACAO_FORMAL : true
};

/**
 * CARGOS NA COMISSÃO
 */
var CARGOS_COMISSAO = {
  PRESIDENTE : 'Presidente',
  VICE_PRESIDENTE : 'Vice-Presidente',
  MEMBRO : 'Membro',
  SECRETARIO : 'Secretário',
  NUTRICIONISTA_RT : 'Nutricionista Responsável Técnico'
};

/**
 * STATUS DE MEMBRO
 */
var STATUS_MEMBRO = {
  ATIVO : 'Ativo',
  AFASTADO : 'Afastado',
  SUBSTITUIDO : 'Substituído',
  DESLIGADO : 'Desligado'
};

/**
 * TIPOS DE ATESTAÇÃO
 */
var TIPOS_ATESTACAO = {
  RECEBIMENTO_CONFORME : 'Recebimento Conforme',
  RECEBIMENTO_PARCIAL : 'Recebimento Parcial',
  RECEBIMENTO_COM_RESSALVAS : 'Recebimento com Ressalvas',
  RECUSA_TOTAL : 'Recusa Total'
};

/**
 * STATUS DE ATESTAÇÃO
 */
var STATUS_ATESTACAO = {
  PENDENTE : 'Pendente de Atestação',
  ATESTADO : 'Atestado',
  REJEITADO : 'Rejeitado',
  EM_ANALISE : 'Em Análise',
  AGUARDANDO_CORRECAO : 'Aguardando Correção'
};

/**
 * Service : Comissão de Recebimento
 */
function ComissaoRecebimentoService(dependencies) {
  try {
    try {
      try {
        BaseService.call(this, dependencies);
        this.sheetMembros = 'Comissao_Membros';
        this.sheetAtestacoes = 'Comissao_Atestacoes';
        this.sheetOcorrencias = 'Comissao_Ocorrencias';
      } catch (error) {
        Logger.log("Erro em ComissaoRecebimentoService: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em ComissaoRecebimentoService: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em ComissaoRecebimentoService: " + error.message);
    throw error;
  }
}

ComissaoRecebimentoService.prototype = Object.create(BaseService.prototype);
ComissaoRecebimentoService.prototype.constructor = ComissaoRecebimentoService;

/**
 * Constitui a Comissão de Recebimento (Resolução FNDE 06/2020)
 */
ComissaoRecebimentoService.prototype.constituirComissao = function(dados) {
  validateRequired(dados.unidadeEscolar, 'Unidade Escolar');
  validateRequired(dados.membros, 'Membros da Comissão');
  validateRequired(dados.portariaDesignacao, 'Portaria de Designação');
  validateRequired(dados.dataDesignacao, 'Data de Designação');

  // Validar composição mínima
  if (dados.membros.length < COMPOSICAO_COMISSAO.MINIMO_MEMBROS) {
    throw new Error('Comissão deve ter no mínimo ' + COMPOSICAO_COMISSAO.MINIMO_MEMBROS + ' membros');
  }

  if (dados.membros.length > COMPOSICAO_COMISSAO.MAXIMO_MEMBROS) {
    throw new Error('Comissão deve ter no máximo ' + COMPOSICAO_COMISSAO.MAXIMO_MEMBROS + ' membros');
  }

  // Validar presença de nutricionista
  var temNutricionista = dados.membros.some(function(m) {
    return m.cargo == CARGOS_COMISSAO.NUTRICIONISTA_RT || m.isNutricionista;
  });

  if (!temNutricionista && COMPOSICAO_COMISSAO.EXIGE_NUTRICIONISTA) {
    throw new Error('Comissão deve ter pelo menos um Nutricionista Responsável Técnico');
  }

  var comissao = {
    id : this.generateId(),
    dataConstituicao : new Date(),
    unidadeEscolar : dados.unidadeEscolar,
    cre : dados.cre || '',
    portariaDesignacao : dados.portariaDesignacao,
    dataDesignacao : dados.dataDesignacao,
    vigenciaInicio : dados.vigenciaInicio || dados.dataDesignacao,
    vigenciaFim : dados.vigenciaFim || null,
    ativa : true,
    observacoes : dados.observacoes || '',
    baseLegal : 'Resolução CD/FNDE 06/2020'
  };

  // Salvar membros
  dados.membros.forEach(function(membro) {
    this.adicionarMembro({
      comissaoId : comissao.id,
      nome : membro.nome,
      cpf : membro.cpf || '',
      cargo : membro.cargo,
      matricula : membro.matricula || '',
      email : membro.email || '',
      telefone : membro.telefone || '',
      isNutricionista : membro.isNutricionista || false,
      crn : membro.crn || '',
      dataDesignacao : dados.dataDesignacao,
      unidadeEscolar : dados.unidadeEscolar
    });
  }.bind(this));

  SystemLogger.info('Comissão de Recebimento constituída', {
    id : comissao.id,
    unidade : dados.unidadeEscolar,
    membros : dados.membros.length
  });

};

/**
 * Adiciona membro à comissão
 */
ComissaoRecebimentoService.prototype.adicionarMembro = function(dados) {
  validateRequired(dados.comissaoId, 'ID da Comissão');
  validateRequired(dados.nome, 'Nome do Membro');
  validateRequired(dados.cargo, 'Cargo');

  var sheet = getOrCreateSheetSafe(this.sheetMembros);

  var membro = {
    id : this.generateId(),
    comissaoId : dados.comissaoId,
    dataRegistro : new Date(),
    nome : dados.nome,
    cpf : dados.cpf || '',
    cargo : dados.cargo,
    matricula : dados.matricula || '',
    email : dados.email || '',
    telefone : dados.telefone || '',
    isNutricionista : dados.isNutricionista || false,
    crn : dados.crn || '',
    dataDesignacao : dados.dataDesignacao,
    dataDesligamento : null,
    status : STATUS_MEMBRO.ATIVO,
    unidadeEscolar : dados.unidadeEscolar,
    observacoes : dados.observacoes || ''
  };

  this.salvarMembro(membro);

};

/**
 * Registra atestação de nota fiscal (Resolução FNDE 06/2020)
 */
ComissaoRecebimentoService.prototype.registrarAtestacao = function(dados) {
  validateRequired(dados.notaFiscal, 'Nota Fiscal');
  validateRequired(dados.fornecedor, 'Fornecedor');
  validateRequired(dados.valorTotal, 'Valor Total');
  validateRequired(dados.dataRecebimento, 'Data de Recebimento');
  validateRequired(dados.tipoAtestacao, 'Tipo de Atestação');
  validateRequired(dados.membrosPresentes, 'Membros Presentes');

  // Validar quórum mínimo (maioria simples)
  var comissao = this.buscarComissaoAtiva(dados.unidadeEscolar);
  if (!comissao) {
    throw new Error('Comissão não encontrada ou inativa para : ' + dados.unidadeEscolar);
  }

  var totalMembros = this.listarMembrosAtivos(comissao.id).length;
  var quorumMinimo = Math.ceil(totalMembros / 2);

  if (dados.membrosPresentes.length < quorumMinimo) {
    throw new Error('Quórum insuficiente. Mínimo : ' + quorumMinimo + ' membros');
  }

  var sheet = getOrCreateSheetSafe(this.sheetAtestacoes);

  var atestacao = {
    id : this.generateId(),
    dataAtestacao : new Date(),
    comissaoId : comissao.id,
    notaFiscal : dados.notaFiscal,
    fornecedor : dados.fornecedor,
    cnpjFornecedor : dados.cnpjFornecedor || '',
    valorTotal : dados.valorTotal,
    dataEmissaoNF : dados.dataEmissaoNF || null,
    dataRecebimento : dados.dataRecebimento,
    unidadeEscolar : dados.unidadeEscolar,
    cre : dados.cre || '',
    tipoAtestacao : dados.tipoAtestacao,
    membrosPresentes : dados.membrosPresentes,
    produtosRecebidos : dados.produtosRecebidos || [],
    quantidadeItens : dados.produtosRecebidos ? dados.produtosRecebidos.length : 0,
    conformidades : dados.conformidades || [],
    naoConformidades : dados.naoConformidades || [],
    observacoes : dados.observacoes || '',
    status : STATUS_ATESTACAO.ATESTADO,
    baseLegal : 'Resolução CD/FNDE 06/2020',
    pdgp : dados.pdgp || '',
    distribuicao : dados.distribuicao || ''
  };

  this.salvarAtestacao(atestacao);

  SystemLogger.info('Atestação registrada pela Comissão', {
    id : atestacao.id,
    nf : dados.notaFiscal,
    tipo : dados.tipoAtestacao,
    membros : dados.membrosPresentes.length
  });

};

/**
 * Registra ocorrência durante recebimento (Lei 14.133/2021 Art. 117)
 */
ComissaoRecebimentoService.prototype.registrarOcorrencia = function(dados) {
  validateRequired(dados.notaFiscal, 'Nota Fiscal');
  validateRequired(dados.tipoOcorrencia, 'Tipo de Ocorrência');
  validateRequired(dados.descricao, 'Descrição da Ocorrência');
  validateRequired(dados.responsavelRegistro, 'Responsável pelo Registro');

  var sheet = getOrCreateSheetSafe(this.sheetOcorrencias);

  var ocorrencia = {
    id : this.generateId(),
    dataOcorrencia : new Date(),
    notaFiscal : dados.notaFiscal,
    fornecedor : dados.fornecedor || '',
    unidadeEscolar : dados.unidadeEscolar || '',
    tipoOcorrencia : dados.tipoOcorrencia,
    descricao : dados.descricao,
    produtosAfetados : dados.produtosAfetados || [],
    valorAfetado : dados.valorAfetado || 0,
    responsavelRegistro : dados.responsavelRegistro,
    providenciasAdotadas : dados.providenciasAdotadas || '',
    dataResolucao : dados.dataResolucao || null,
    resolvido : false,
    observacoes : dados.observacoes || '',
    baseLegal : 'Lei 14.133/2021 Art. 117'
  };

  this.salvarOcorrencia(ocorrencia);

  SystemLogger.info('Ocorrência registrada', {
    id : ocorrencia.id,
    nf : dados.notaFiscal,
    tipo : dados.tipoOcorrencia
  });

};

/**
 * Busca comissão ativa por unidade escolar
 */
ComissaoRecebimentoService.prototype.buscarComissaoAtiva = function(unidadeEscolar) {
  var membros = this.listarTodosMembros();

  var membrosAtivos = membros.filter(function(m) {});

  if (membrosAtivos.length == 0) return null;

  // Retornar dados da comissão baseado nos membros ativos
  return {
    id : membrosAtivos[0].comissaoId,
    unidadeEscolar : unidadeEscolar,
    totalMembros : membrosAtivos.length
  };
};

/**
 * Lista membros ativos de uma comissão
 */
ComissaoRecebimentoService.prototype.listarMembrosAtivos = function(comissaoId) {
  var todosMembros = this.listarTodosMembros();

  };

/**
 * Gera relatório de atividades da comissão
 */
ComissaoRecebimentoService.prototype.gerarRelatorioAtividades = function(filtros) {
  var atestacoes = this.listarTodasAtestacoes();
  var ocorrencias = this.listarTodasOcorrencias();

  if (filtros) {
    if (filtros.unidadeEscolar) {
      atestacoes = atestacoes.filter(function(a) { return a.unidadeEscolar == filtros.unidadeEscolar; });
      ocorrencias = ocorrencias.filter(function(o) { return o.unidadeEscolar == filtros.unidadeEscolar; });
    }
    if (filtros.periodo) {
      var dataInicio = new Date(filtros.periodo.inicio);
      var dataFim = new Date(filtros.periodo.fim);
      atestacoes = atestacoes.filter(function(a) {
        var data = new Date(a.dataAtestacao);
      });
      ocorrencias = ocorrencias.filter(function(o) {
        var data = new Date(o.dataOcorrencia);
      });
    }
  }

  var relatorio = {
    totalAtestacoes : atestacoes.length,
    porTipoAtestacao : {},
    valorTotalAtestado : 0,
    totalOcorrencias : ocorrencias.length,
    ocorrenciasResolvidas : 0,
    ocorrenciasPendentes : 0,
    porFornecedor : {}
  };

  atestacoes.forEach(function(a) {
    relatorio.porTipoAtestacao[a.tipoAtestacao] = (relatorio.porTipoAtestacao[a.tipoAtestacao] || 0) + 1;
    relatorio.valorTotalAtestado += Number(a.valorTotal) || 0;

    if (!relatorio.porFornecedor[a.fornecedor]) {
      relatorio.porFornecedor[a.fornecedor] = { atestacoes : 0, valorTotal : 0, ocorrencias : 0 };
    }
    relatorio.porFornecedor[a.fornecedor].atestacoes++
    relatorio.porFornecedor[a.fornecedor].valorTotal += Number(a.valorTotal) || 0;
  });

  ocorrencias.forEach(function(o) {
    if (o.resolvido) {
      relatorio.ocorrenciasResolvidas++
    } else {
      relatorio.ocorrenciasPendentes++
    }
    if (o.fornecedor && relatorio.porFornecedor[o.fornecedor]) {
      relatorio.porFornecedor[o.fornecedor].ocorrencias++
    }
  });

};

/**
 * Verifica conformidade da comissão
 */
ComissaoRecebimentoService.prototype.verificarConformidadeComissao = function(unidadeEscolar) {
  var comissao = this.buscarComissaoAtiva(unidadeEscolar);

  if (!comissao) {
    return {
      conforme : false,
      problemas : ['Comissão não encontrada ou inativa'],
      totalMembros : 0,
      temNutricionista : false
    };
  }

  var membrosAtivos = this.listarMembrosAtivos(comissao.id);
  var problemas = [];

  if (membrosAtivos.length < COMPOSICAO_COMISSAO.MINIMO_MEMBROS) {
    problemas.push('Número insuficiente de membros (mínimo : ' + COMPOSICAO_COMISSAO.MINIMO_MEMBROS + ')');
  }

  var temNutricionista = membrosAtivos.some(function(m) {});

  if (!temNutricionista && COMPOSICAO_COMISSAO.EXIGE_NUTRICIONISTA) {
    problemas.push('Ausência de Nutricionista Responsável Técnico');
  }

  var temDesignacao = membrosAtivos.every(function(m) {});

  if (!temDesignacao) {
    problemas.push('Membros sem designação formal');
  }

  return {
    conforme : problemas.length == 0,
    problemas : problemas,
    totalMembros : membrosAtivos.length,
    temNutricionista : temNutricionista
  };
};


/**
 * Métodos auxiliares - Membros
 */
ComissaoRecebimentoService.prototype.salvarMembro = function(membro) {
  var sheet = getOrCreateSheetSafe(this.sheetMembros);
  var headers = this.getHeadersMembros();

  if (sheet.getLastRow() == 0) {
    sheet.appendRow(headers);
  }

  var row = this.mapMembroToRow(membro, headers);
  sheet.appendRow(row);
};

ComissaoRecebimentoService.prototype.listarTodosMembros = function() {
  var sheet = getOrCreateSheetSafe(this.sheetMembros);
  if (sheet.getLastRow() <= 1) return [];

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var membros = [];

  for (var i = 1; i < data.length; i++) {
    membros.push(this.mapRowToMembro(data[i], headers));
  }

};

ComissaoRecebimentoService.prototype.getHeadersMembros = function() {
          'Email', 'Telefone', 'É Nutricionista', 'CRN', 'Data Designação', 'Data Desligamento',
          'Status', 'Unidade Escolar', 'Observações'};

ComissaoRecebimentoService.prototype.mapMembroToRow = function(m, headers) {
    m.id, m.comissaoId, m.dataRegistro, m.nome, m.cpf || '', m.cargo, m.matricula || '',
    m.email || '', m.telefone || '', m.isNutricionista ? 'SIM' : 'NAO', m.crn || '',
    m.dataDesignacao, m.dataDesligamento || '', m.status, m.unidadeEscolar, m.observacoes || ''
  };

ComissaoRecebimentoService.prototype.mapRowToMembro = function(row, headers) {
  return {
    id : row[0], comissaoId : row[1], dataRegistro : row[2], nome : row[3], cpf : row[4],
    cargo : row[5], matricula : row[6], email : row[7], telefone : row[8],
    isNutricionista : row[9] == 'SIM', crn : row[10], dataDesignacao : row[11],
    dataDesligamento : row[12], status : row[13], unidadeEscolar : row[14], observacoes : row[15]
  };
};

/**
 * Métodos auxiliares - Atestações
 */
ComissaoRecebimentoService.prototype.salvarAtestacao = function(atestacao) {
  var sheet = getOrCreateSheetSafe(this.sheetAtestacoes);
  var headers = this.getHeadersAtestacoes();

  if (sheet.getLastRow() == 0) {
    sheet.appendRow(headers);
  }

  var row = this.mapAtestacaoToRow(atestacao, headers);
  sheet.appendRow(row);
};

ComissaoRecebimentoService.prototype.listarTodasAtestacoes = function() {
  var sheet = getOrCreateSheetSafe(this.sheetAtestacoes);
  if (sheet.getLastRow() <= 1) return [];

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var atestacoes = [];

  for (var i = 1; i < data.length; i++) {
    atestacoes.push(this.mapRowToAtestacao(data[i], headers));
  }

};

ComissaoRecebimentoService.prototype.getHeadersAtestacoes = function() {
          'Valor Total', 'Data Emissão NF', 'Data Recebimento', 'Unidade Escolar', 'CRE',
          'Tipo Atestação', 'Qtd Itens', 'Status', 'Base Legal'};

ComissaoRecebimentoService.prototype.mapAtestacaoToRow = function(a, headers) {
    a.id, a.dataAtestacao, a.comissaoId, a.notaFiscal, a.fornecedor, a.cnpjFornecedor || '',
    a.valorTotal, a.dataEmissaoNF || '', a.dataRecebimento, a.unidadeEscolar, a.cre || '',
    a.tipoAtestacao, a.quantidadeItens || 0, a.status, a.baseLegal || ''
  };

ComissaoRecebimentoService.prototype.mapRowToAtestacao = function(row, headers) {
  return {
    id : row[0], dataAtestacao : row[1], comissaoId : row[2], notaFiscal : row[3],
    fornecedor : row[4], cnpjFornecedor : row[5], valorTotal : row[6], dataEmissaoNF : row[7],
    dataRecebimento : row[8], unidadeEscolar : row[9], cre : row[10], tipoAtestacao : row[11],
    quantidadeItens : row[12], status : row[13], baseLegal : row[14]
  };
};

/**
 * Métodos auxiliares - Ocorrências
 */
ComissaoRecebimentoService.prototype.salvarOcorrencia = function(ocorrencia) {
  var sheet = getOrCreateSheetSafe(this.sheetOcorrencias);
  var headers = this.getHeadersOcorrencias();

  if (sheet.getLastRow() == 0) {
    sheet.appendRow(headers);
  }

  var row = this.mapOcorrenciaToRow(ocorrencia, headers);
  sheet.appendRow(row);
};

ComissaoRecebimentoService.prototype.listarTodasOcorrencias = function() {
  var sheet = getOrCreateSheetSafe(this.sheetOcorrencias);
  if (sheet.getLastRow() <= 1) return [];

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var ocorrencias = [];

  for (var i = 1; i < data.length; i++) {
    ocorrencias.push(this.mapRowToOcorrencia(data[i], headers));
  }

};

ComissaoRecebimentoService.prototype.getHeadersOcorrencias = function() {
          'Tipo Ocorrência', 'Descrição', 'Valor Afetado', 'Responsável Registro',
          'Providências Adotadas', 'Data Resolução', 'Resolvido', 'Observações', 'Base Legal'};

ComissaoRecebimentoService.prototype.mapOcorrenciaToRow = function(o, headers) {
    o.id, o.dataOcorrencia, o.notaFiscal, o.fornecedor || '', o.unidadeEscolar || '',
    o.tipoOcorrencia, o.descricao, o.valorAfetado || 0, o.responsavelRegistro,
    o.providenciasAdotadas || '', o.dataResolucao || '', o.resolvido ? 'SIM' : 'NAO',
    o.observacoes || '', o.baseLegal || ''
  };

ComissaoRecebimentoService.prototype.mapRowToOcorrencia = function(row, headers) {
  return {
    id : row[0], dataOcorrencia : row[1], notaFiscal : row[2], fornecedor : row[3],
    unidadeEscolar : row[4], tipoOcorrencia : row[5], descricao : row[6], valorAfetado : row[7],
    responsavelRegistro : row[8], providenciasAdotadas : row[9], dataResolucao : row[10],
    resolvido : row[11] == 'SIM', observacoes : row[12], baseLegal : row[13]
  };
};

ComissaoRecebimentoService.prototype.generateId = function() {
};

function registerComissaoRecebimento() {
  DIContainer.bind('comissaoRecebimento', function() {
    return new ComissaoRecebimentoService({});
  }, true);
  SystemLogger.info('ComissaoRecebimento service registered');
}

// ---- ArmazenamentoGeneros.gs ----
function ArmazenamentoGenerosService(dependencies) {
  BaseService.call(this, dependencies);
  this.sheetName = 'Armazenamento_Generos';
}

ArmazenamentoGenerosService.prototype = Object.create(BaseService.prototype);
ArmazenamentoGenerosService.prototype.constructor = ArmazenamentoGenerosService;

ArmazenamentoGenerosService.prototype.listarEstoque = function() {
  try {
    var sheet = getOrCreateSheetSafe(this.sheetName);
    if (sheet.getLastRow() <= 1) return [];

    var data = sheet.getDataRange().getValues();
    var itens = [];

    for (var i = 1; i < data.length; i++) {
      itens.push({
        id : data[i][0],
        unidadeEscolar : data[i][1],
        produto : data[i][2],
        quantidade : data[i][3],
        unidade : data[i][4]
      });
    }
  } catch (e) {
    Logger.log('Erro ao listar estoque : ' + e.message);
  }
};


function registerArmazenamentoGeneros() {
  DIContainer.bind('armazenamentoGeneros', function() {
    return new ArmazenamentoGenerosService({});
  }, true);
  SystemLogger.info('ArmazenamentoGeneros service registered');
}

function testDominioRecebimentoSyntax() {
  try {
    Logger.log('✅ Dominio_Recebimento.gs - Sintaxe válida');
    return { success : true, file : 'Dominio_Recebimento.gs', message : 'Sintaxe OK' };
  } catch (e) {
    Logger.log('❌ Erro : ' + e.message);
    return { success : false, error : e.message };
  }
}

function endOfDominioRecebimento() {
  try {
    try {
      try {
        Logger.log('✅ Dominio_Recebimento.gs carregado completamente');
        return true;
      } catch (error) {
        Logger.log("Erro em endOfDominioRecebimento: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em endOfDominioRecebimento: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em endOfDominioRecebimento: " + error.message);
    throw error;
  }
}


/**
 * Registra entrada de gênero no estoque (Manual Item 14 - PVPS)
 */
ArmazenamentoGenerosService.prototype.registrarEntrada = function(dados) {
  validateRequired(dados.produto, 'Produto');
  validateRequired(dados.quantidade, 'Quantidade');
  validateRequired(dados.unidadeEscolar, 'Unidade Escolar');

  // Verificar se o item já existe no estoque
  var itemExistente = this.buscarProdutoEstoque(dados.produto, dados.lote, dados.unidadeEscolar);

  if (itemExistente) {
    // Atualizar quantidade de um item existente
    itemExistente.quantidade += dados.quantidade;
    itemExistente.dataUltimaMovimentacao = new Date();
    itemExistente.status = this.determinarStatus(itemExistente.dataValidade);
    this.atualizarEstoque(itemExistente);
  } else {
    // Cadastrar novo item no estoque
    var itemEstoque = {
      id : this.generateId(),
      produto : dados.produto,
      categoria : dados.categoria || '',
      quantidade : dados.quantidade,
      unidade : dados.unidade,
      lote : dados.lote || '',
      dataValidade : dados.dataValidade || '',
      dataEntrada : new Date(),
      fornecedor : dados.fornecedor || '',
      notaFiscal : dados.notaFiscal || '',
      unidadeEscolar : dados.unidadeEscolar,
      cre : dados.cre || '',
      tipoConservacao : dados.tipoConservacao || 'AMBIENTE',
      localizacao : dados.localizacao || '',
      status : this.determinarStatus(dados.dataValidade),
      dataUltimaMovimentacao : new Date(),
      baseLegal : 'Manual Alimentação Escolar DF Item 14'
    };
    this.salvarEstoque(itemEstoque);
  }

  // Registrar movimentação
  this.registrarMovimentacao({
    tipo : TIPOS_MOVIMENTACAO.ENTRADA,
    produto : dados.produto,
    quantidade : dados.quantidade,
    unidade : dados.unidade,
    lote : dados.lote || '',
    unidadeEscolar : dados.unidadeEscolar,
    notaFiscal : dados.notaFiscal || '',
    responsavel : dados.responsavel || Session.getActiveUser().getEmail(),
    observacoes : dados.observacoes || ''
  });

  SystemLogger.info('Entrada registrada no estoque', {
    produto : dados.produto,
    quantidade : dados.quantidade,
    unidade : dados.unidadeEscolar
  });

};

/**
 * Registra saída de gênero do estoque (Manual Item 14 - PVPS)
 */
ArmazenamentoGenerosService.prototype.registrarSaida = function(dados) {
  validateRequired(dados.produto, 'Produto');
  validateRequired(dados.quantidade, 'Quantidade');
  validateRequired(dados.unidadeEscolar, 'Unidade Escolar');

  // Buscar itens do produto ordenados por PVPS
  var itensDisponiveis = this.buscarItensPVPS(dados.produto, dados.unidadeEscolar);

  if (itensDisponiveis.length == 0) {
    throw new Error('Produto não disponível no estoque : ' + dados.produto);
  }

  var quantidadeRestante = dados.quantidade;
  var itensBaixados = [];

  // Aplicar PVPS : usar primeiro os que vencem primeiro
  for (var i = 0; i < itensDisponiveis.length && quantidadeRestante > 0; i++) {
    var item = itensDisponiveis[i];

    if (item.quantidade >= quantidadeRestante) {
      // Item tem quantidade suficiente
      item.quantidade -= quantidadeRestante;
      itensBaixados.push({
        id : item.id,
        lote : item.lote,
        quantidadeBaixada : quantidadeRestante
      });
      quantidadeRestante = 0;
    } else {
      // Item não tem quantidade suficiente, usar tudo
      quantidadeRestante -= item.quantidade;
      itensBaixados.push({
        id : item.id,
        lote : item.lote,
        quantidadeBaixada : item.quantidade
      });
      item.quantidade = 0;
      item.status = 'ESGOTADO';
    }

    item.dataUltimaMovimentacao = new Date();
    this.atualizarEstoque(item);
  }

  if (quantidadeRestante > 0) {
    throw new Error('Quantidade insuficiente no estoque. Faltam : ' + quantidadeRestante + dados.unidade);
  }

  // Registrar movimentação
  this.registrarMovimentacao({
    tipo : TIPOS_MOVIMENTACAO.SAIDA,
    produto : dados.produto,
    quantidade : dados.quantidade,
    unidade : dados.unidade || itensDisponiveis[0].unidade,
    unidadeEscolar : dados.unidadeEscolar,
    itensBaixados : itensBaixados,
    responsavel : dados.responsavel || Session.getActiveUser().getEmail(),
    observacoes : dados.observacoes || '',
    metodoPVPS : true
  });

  SystemLogger.info('Saída registrada do estoque (PVPS)', {
    produto : dados.produto,
    quantidade : dados.quantidade,
    lotesBaixados : itensBaixados.length
  });

};

/**
 * Busca itens ordenados por PVPS (Primeiro que Vence é o Primeiro que Sai)
 */
ArmazenamentoGenerosService.prototype.buscarItensPVPS = function(produto, unidadeEscolar) {
  var todosItens = this.listarEstoque();

  var itensDisponiveis = todosItens.filter(function(item) {
           item.unidadeEscolar == unidadeEscolar &&
           item.quantidade > 0 &&
           item.status == STATUS_ESTOQUE.DISPONIVEL;
  });

  // Ordenar por data de validade (PVPS)
  itensDisponiveis.sort(function(a, b) {});

};

/**
 * Determina status baseado na validade
 */
ArmazenamentoGenerosService.prototype.determinarStatus = function(dataValidade) {
  var hoje = new Date();
  var validade = new Date(dataValidade);
  var diasParaVencer = Math.floor((validade - hoje) / (1000 * 60 * 60 * 24));

  if (diasParaVencer < 0) {} else if (diasParaVencer <= 30) {} else {}
};

/**
 * Verifica produtos próximos ao vencimento
 */
ArmazenamentoGenerosService.prototype.verificarProximosVencimento = function(unidadeEscolar, diasAlerta) {
  diasAlerta = diasAlerta || 30;
  var todosItens = this.listarEstoque();
  var hoje = new Date();
  var dataLimite = new Date();
  dataLimite.setDate(hoje.getDate() + diasAlerta);

  var proximosVencer = todosItens.filter(function(item) {
    if (unidadeEscolar && item.unidadeEscolar != unidadeEscolar) return false;

    var validade = new Date(item.dataValidade);
  });

  // Ordenar por data de validade
  proximosVencer.sort(function(a, b) {});

};

/**
 * Verifica produtos vencidos
 */
ArmazenamentoGenerosService.prototype.verificarVencidos = function(unidadeEscolar) {
  var todosItens = this.listarEstoque();
  var hoje = new Date();

  var vencidos = todosItens.filter(function(item) {
    if (unidadeEscolar && item.unidadeEscolar != unidadeEscolar) return false;

    var validade = new Date(item.dataValidade);
  });

};

/**
 * Realiza inventário de estoque - VALIDAÇÃO APRIMORADA
 */
ArmazenamentoGenerosService.prototype.realizarInventario = function(dados) {
  // Validações robustas
  if (!dados || typeof dados != 'object') {
    throw new Error('Dados do inventário são obrigatórios');
  }

  validateRequired(dados.unidadeEscolar, 'Unidade Escolar');
  validateRequired(dados.responsavel, 'Responsável');

  if (!dados.itensInventariados || !Array.isArray(dados.itensInventariados)) {
    throw new Error('Itens inventariados devem ser um array');
  }

  if (dados.itensInventariados.length == 0) {
    throw new Error('Nenhum item para inventariar');
  }

  var ajustes = [];
  var erros = [];

  dados.itensInventariados.forEach((function(itemInventario, index) {
    try {
      if (!itemInventario || typeof itemInventario != 'object') {
        erros.push('Item ' + (index + 1) + ' : dados inválidos');
        return;
      }

      var itemEstoque = this.buscarProdutoEstoque(
        itemInventario.produto,
        itemInventario.lote,
        dados.unidadeEscolar
      );

      if (itemEstoque) {
        var diferenca = (itemInventario.quantidadeContada || 0) - (itemEstoque.quantidade || 0);

        if (diferenca != 0) {
          ajustes.push({
            produto : itemEstoque.produto,
            lote : itemEstoque.lote,
            quantidadeAnterior : itemEstoque.quantidade,
            quantidadeContada : itemInventario.quantidadeContada,
            diferenca : diferenca,
            motivo : itemInventario.motivo || 'Ajuste de inventário'
          });

          itemEstoque.quantidade = itemInventario.quantidadeContada;
          itemEstoque.dataUltimaMovimentacao = new Date();
          itemEstoque.status = this.determinarStatus(itemEstoque.dataValidade);
          this.atualizarEstoque(itemEstoque);

          this.registrarMovimentacao({
            tipo : TIPOS_MOVIMENTACAO.AJUSTE_INVENTARIO,
            produto : itemEstoque.produto,
            quantidade : Math.abs(diferenca),
            unidade : itemEstoque.unidade,
            lote : itemEstoque.lote,
            unidadeEscolar : dados.unidadeEscolar,
            responsavel : dados.responsavel,
            observacoes : 'Inventário : ' + (itemInventario.motivo || 'Ajuste')
          });
        }
      } else {
        erros.push('Item ' + (index + 1) + ' : produto não encontrado no estoque');
      }
    } catch (itemError) {
      erros.push('Item ' + (index + 1) + ' : ' + itemError.message);
    }
  }).bind(this));

  SystemLogger.info('Inventário realizado', {
    unidade : dados.unidadeEscolar,
    itensInventariados : dados.itensInventariados.length,
    ajustes : ajustes.length,
    erros : erros.length
  });

  return {
    dataInventario : new Date(),
    unidadeEscolar : dados.unidadeEscolar,
    responsavel : dados.responsavel,
    totalItens : dados.itensInventariados.length,
    ajustes : ajustes,
    erros : erros,
    sucesso : erros.length == 0
  };
};


/**
 * Avalia estrutura física do depósito (Manual Item 15)
 */
ArmazenamentoGenerosService.prototype.avaliarEstruturaFisica = function(dados) {
  validateRequired(dados.unidadeEscolar, 'Unidade Escolar');
  validateRequired(dados.avaliador, 'Avaliador');

  var sheet = getOrCreateSheetSafe(this.sheetEstrutura);

  var avaliacao = {
    id : this.generateId(),
    dataAvaliacao : new Date(),
    unidadeEscolar : dados.unidadeEscolar,
    cre : dados.cre || '',
    avaliador : dados.avaliador,

    // Piso (Manual Item 15.1),
    pisoConforme : dados.pisoConforme || false,
    pisoObservacoes : dados.pisoObservacoes || '',

    // Parede (Manual Item 15.1),
    paredeConforme : dados.paredeConforme || false,
    paredeObservacoes : dados.paredeObservacoes || '',

    // Teto (Manual Item 15.1),
    tetoConforme : dados.tetoConforme || false,
    tetoObservacoes : dados.tetoObservacoes || '',

    // Portas (Manual Item 15.2),
    portasConformes : dados.portasConformes || false,
    portasObservacoes : dados.portasObservacoes || '',

    // Janelas (Manual Item 15.2),
    janelasConformes : dados.janelasConformes || false,
    janelasObservacoes : dados.janelasObservacoes || '',

    // Iluminação,
    iluminacaoConforme : dados.iluminacaoConforme || false,
    iluminacaoObservacoes : dados.iluminacaoObservacoes || '',

    // Ventilação,
    ventilacaoConforme : dados.ventilacaoConforme || false,
    ventilacaoObservacoes : dados.ventilacaoObservacoes || '',

    // Organização,
    organizacaoConforme : dados.organizacaoConforme || false,
    organizacaoObservacoes : dados.organizacaoObservacoes || '',

    // Limpeza,
    limpezaConforme : dados.limpezaConforme || false,
    limpezaObservacoes : dados.limpezaObservacoes || ''

      // observacoesGerais : dados.observacoesGerais || ''
  }};

/**
 * Métodos auxiliares - Estoque
 */
ArmazenamentoGenerosService.prototype.buscarProdutoEstoque = function(produto, lote, unidadeEscolar) {
  var itens = this.listarEstoque();
           item.lote == lote &&
           item.unidadeEscolar == unidadeEscolar;
  };

ArmazenamentoGenerosService.prototype.salvarEstoque = function(item) {
  var sheet = getOrCreateSheetSafe(this.sheetEstoque);
  var headers = this.getHeadersEstoque();

  if (sheet.getLastRow() == 0) {
    sheet.appendRow(headers);
  }

  var row = this.mapEstoqueToRow(item, headers);
  sheet.appendRow(row);
};

ArmazenamentoGenerosService.prototype.atualizarEstoque = function(item) {
  var sheet = getOrCreateSheetSafe(this.sheetEstoque);
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == item.id) {
      var headers = data[0];
      var row = this.mapEstoqueToRow(item, headers);
      sheet.getRange(i + 1, 1, 1, row.length).setValues([row]);
    }
  }
};

ArmazenamentoGenerosService.prototype.listarEstoque = function() {
  var sheet = getOrCreateSheetSafe(this.sheetEstoque);
  if (sheet.getLastRow() <= 1) return [];

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var itens = [];

  for (var i = 1; i < data.length; i++) {
    itens.push(this.mapRowToEstoque(data[i], headers));
  }

};

ArmazenamentoGenerosService.prototype.getHeadersEstoque = function() {
          'Data Entrada', 'Fornecedor', 'Nota Fiscal', 'Unidade Escolar', 'CRE',
          'Tipo Conservação', 'Localização', 'Status', 'Data Última Movimentação', 'Base Legal'};

ArmazenamentoGenerosService.prototype.mapEstoqueToRow = function(item, headers) {
    item.id, item.produto, item.categoria || '', item.quantidade, item.unidade,
    item.lote || '', item.dataValidade, item.dataEntrada, item.fornecedor || '',
    item.notaFiscal || '', item.unidadeEscolar, item.cre || '', item.tipoConservacao || '',
    item.localizacao || '', item.status, item.dataUltimaMovimentacao, item.baseLegal || ''
  };

ArmazenamentoGenerosService.prototype.mapRowToEstoque = function(row, headers) {
  return {
    id : row[0], produto : row[1], categoria : row[2], quantidade : row[3], unidade : row[4],
    lote : row[5], dataValidade : row[6], dataEntrada : row[7], fornecedor : row[8],
    notaFiscal : row[9], unidadeEscolar : row[10], cre : row[11], tipoConservacao : row[12],
    localizacao : row[13], status : row[14], dataUltimaMovimentacao : row[15], baseLegal : row[16]
  };
};

/**
 * Métodos auxiliares - Movimentação
 */
ArmazenamentoGenerosService.prototype.registrarMovimentacao = function(dados) {
  var sheet = getOrCreateSheetSafe(this.sheetMovimentacao);
  var headers = this.getHeadersMovimentacao();

  if (sheet.getLastRow() == 0) {
    sheet.appendRow(headers);
  }

  var movimentacao = {
    id : this.generateId(),
    dataMovimentacao : new Date(),
    tipo : dados.tipo,
    produto : dados.produto,
    quantidade : dados.quantidade,
    unidade : dados.unidade,
    lote : dados.lote || '',
    unidadeEscolar : dados.unidadeEscolar,
    notaFiscal : dados.notaFiscal || '',
    responsavel : dados.responsavel,
    observacoes : dados.observacoes || '',
    metodoPVPS : dados.metodoPVPS || false
  };

  var row = this.mapMovimentacaoToRow(movimentacao, headers);
  sheet.appendRow(row);
};

ArmazenamentoGenerosService.prototype.getHeadersMovimentacao = function() {
          'Unidade Escolar', 'Nota Fiscal', 'Responsável', 'Método PVPS', 'Observações'};

ArmazenamentoGenerosService.prototype.mapMovimentacaoToRow = function(mov, headers) {
    mov.id, mov.dataMovimentacao, mov.tipo, mov.produto, mov.quantidade, mov.unidade,
    mov.lote || '', mov.unidadeEscolar, mov.notaFiscal || '', mov.responsavel,
    mov.metodoPVPS || false, mov.observacoes || ''
  };

/**
 * Métodos auxiliares - Estrutura
 */
ArmazenamentoGenerosService.prototype.salvarAvaliacaoEstrutura = function(avaliacao) {
  var sheet = getOrCreateSheetSafe(this.sheetEstrutura);
  var headers = this.getHeadersEstrutura();

  if (sheet.getLastRow() == 0) {
    sheet.appendRow(headers);
  }

  var row = this.mapEstruturaToRow(avaliacao, headers);
  sheet.appendRow(row);
};

ArmazenamentoGenerosService.prototype.getHeadersEstrutura = function() {
  return [
    'ID', 'Data Avaliação', 'Unidade Escolar', 'CRE', 'Avaliador',
    'Piso Conforme', 'Piso Obs', 'Parede Conforme', 'Parede Obs',
    'Teto Conforme', 'Teto Obs', 'Portas Conformes', 'Portas Obs',
    'Janelas Conformes', 'Janelas Obs', 'Iluminação Conforme', 'Iluminação Obs',
    'Ventilação Conforme', 'Ventilação Obs', 'Organização Conforme', 'Organização Obs',
    'Limpeza Conforme', 'Limpeza Obs', '% Conformidade', 'Status Geral',
    'Observações Gerais', 'Base Legal'
  ];
};

ArmazenamentoGenerosService.prototype.mapEstruturaToRow = function(aval, headers) {
  return [
    aval.id, aval.dataAvaliacao, aval.unidadeEscolar, aval.cre || '', aval.avaliador,
    aval.pisoConforme, aval.pisoObservacoes || '', aval.paredeConforme, aval.paredeObservacoes || '',
    aval.tetoConforme, aval.tetoObservacoes || '', aval.portasConformes, aval.portasObservacoes || '',
    aval.janelasConformes, aval.janelasObservacoes || '', aval.iluminacaoConforme, aval.iluminacaoObservacoes || '',
    aval.ventilacaoConforme, aval.ventilacaoObservacoes || '', aval.organizacaoConforme, aval.organizacaoObservacoes || '',
    aval.limpezaConforme, aval.limpezaObservacoes || '', aval.percentualConformidade, aval.statusGeral,
    aval.observacoesGerais || '', aval.baseLegal || ''
  ];
};

ArmazenamentoGenerosService.prototype.salvarMovimentacaoEstoque = function(dados) {
  var sheet = getOrCreateSheetSafe(this.sheetMovimentacao || 'Movimentacao_Estoque');
  var headers = this.getHeadersMovimentacao();

  if (sheet.getLastRow() == 0) {
    sheet.appendRow(headers);
  }

  var movimentacao = {
    id : this.generateId(),
    dataMovimentacao : new Date(),
    tipo : dados.tipo,
    produto : dados.produto,
    quantidade : dados.quantidade,
    unidade : dados.unidade,
    lote : dados.lote || '',
    unidadeEscolar : dados.unidadeEscolar,
    notaFiscal : dados.notaFiscal || '',
    responsavel : dados.responsavel,
    observacoes : dados.observacoes || '',
    metodoPVPS : dados.metodoPVPS || false
  };

  var row = this.mapMovimentacaoToRow(movimentacao, headers);
  sheet.appendRow(row);
};

ArmazenamentoGenerosService.prototype.getHeadersMovimentacao = function() {
  return [
    'ID', 'Data Movimentação', 'Tipo', 'Produto', 'Quantidade', 'Unidade', 'Lote',
    'Unidade Escolar', 'Nota Fiscal', 'Responsável', 'Método PVPS', 'Observações'
  ];
};

ArmazenamentoGenerosService.prototype.mapMovimentacaoToRow = function(mov, headers) {
  return [
    mov.id, mov.dataMovimentacao, mov.tipo, mov.produto, mov.quantidade, mov.unidade,
    mov.lote || '', mov.unidadeEscolar, mov.notaFiscal || '', mov.responsavel,
    mov.metodoPVPS || false, mov.observacoes || ''
  ];
};

ArmazenamentoGenerosService.prototype.generateId = function() {
  return Utilities.getUuid();
};

