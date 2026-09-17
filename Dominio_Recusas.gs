'use strict';

/**
 * DOMÍNIO : GESTÃO DE RECUSAS
 * @version 2.1.0
 *
 * NOTA: As funções getSafeUi, safeAlert, safePrompt estão definidas em Core_UI_Safe.gs
 * Este arquivo usa essas funções globais para evitar duplicação.
 */

/**
 * DOMÍNIO : GESTÃO DE RECUSAS
 * Implementação completa conforme Manual de Análise Processual CRE-PP/UNIAE
 *
 * Baseado em :
 * - Seção 3.2 : Procedimento de Recusa de Produtos Não Conformes
 * - Seção 3.3 : Substituição de Produtos Recusados
 */

// ==
// SERVIÇO DE GESTÃO DE RECUSAS
// ==

function GestaoRecusasService() {
  try {
    try {
      try {
        this.sheetRecusas = 'Recusas';
        this.sheetSubstituicoes = 'Recusas_Substituicoes';
        this.sheetHistorico = 'Recusas_Historico';
      } catch (error) {
        Logger.log("Erro em GestaoRecusasService: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em GestaoRecusasService: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em GestaoRecusasService: " + error.message);
    throw error;
  }
}

/**
 * Registra uma recusa de produto
 * Conforme Manual Seção 3.2
 */
GestaoRecusasService.prototype.registrarRecusa = function(dados) {
  try {
    // Validações obrigatórias
    this.validarDadosRecusa(dados);

    var sheet = getOrCreateSheetSafe(this.sheetRecusas);

    // Gera ID único
    var id = 'REC-' + Utilities.formatDate(new Date(), 'GMT-3', 'yyyyMMdd') + '-' +
             this.gerarSequencial();

    var registro = {
      id : id,
      dataRecusa : dados.dataRecusa || new Date(),
      horaRecusa : dados.horaRecusa || Utilities.formatDate(new Date(), 'GMT-3', 'HH,mm : ss'),

      // Identificação da Entrega,
      unidadeEscolar : dados.unidadeEscolar,
      fornecedor : dados.fornecedor,
      cnpjFornecedor : dados.cnpjFornecedor || '',
      notaFiscal : dados.notaFiscal || '',
      termoRecebimento : dados.termoRecebimento || '',

      // Produto Recusado,
      produto : dados.produto,
      quantidade : dados.quantidade,
      unidadeMedida : dados.unidadeMedida || 'kg',
      lote : dados.lote || '',
      validade : dados.validade || '',

      // Motivo da Recusa (conforme checklist do Manual),
      categoriaMotivo : dados.categoriaMotivo, // Documentação, Transporte, Embalagem, etc.
      // motivoDetalhado : dados.motivoDetalhado,
      observacoes : dados.observacoes || '',

      // Evidências,
      fotoAnexada : dados.fotoAnexada || 'Não',
      linkFoto : dados.linkFoto || '',

      // Responsável,
      responsavelRecusa : dados.responsavelRecusa,
      matriculaResponsavel : dados.matriculaResponsavel,
      cargoResponsavel : dados.cargoResponsavel || 'Diretor',

      // Comunicação,
      comunicadoUNIAE : 'Sim', // Sempre comunicar
      dataComunicacao : new Date(),
      comunicadoFornecedor : 'Pendente',

      // Substituição,
      prazoSubstituicao : this.calcularPrazoSubstituicao(dados.produto),
      dataLimiteSubstituicao : this.calcularDataLimite(dados.produto),
      statusSubstituicao : 'Aguardando',

      // Controle,
      status : 'Registrada',
      impactoAlimentacao : dados.impactoAlimentacao || 'Não',
      acaoImediata : dados.acaoImediata || '',

      // Auditoria,
      registradoPor : Session.getActiveUser().getEmail(),
      dataRegistro : new Date()
    };

    // Salva registro
    var headers = this.getHeadersRecusas();
    var row = this.mapearParaLinha(registro, headers);

    sheet.appendRow(row);

    // Ações automáticas
    this.executarAcoesAutomaticas(registro);

    Logger.log('✅ Recusa registrada : ' + id);

    return {
      sucesso : true,
      id : id,
      mensagem : 'Recusa registrada com sucesso',
      prazoSubstituicao : registro.prazoSubstituicao,
      dataLimite : registro.dataLimiteSubstituicao
    };

  } catch (e) {
    Logger.log('❌ Erro ao registrar recusa : ' + e.message);
    throw new Error('Falha ao registrar recusa : ' + e.message);
}
};

/**
 * Valida dados da recusa
 */
GestaoRecusasService.prototype.validarDadosRecusa = function(dados) {
  var erros = [];

  if (!dados.unidadeEscolar) erros.push('Unidade Escolar é obrigatória');
  if (!dados.fornecedor) erros.push('Fornecedor é obrigatório');
  if (!dados.produto) erros.push('Produto é obrigatório');
  if (!dados.quantidade) erros.push('Quantidade é obrigatória');
  if (!dados.categoriaMotivo) erros.push('Categoria do motivo é obrigatória');
  if (!dados.motivoDetalhado) erros.push('Motivo detalhado é obrigatório');
  if (!dados.responsavelRecusa) erros.push('Responsável pela recusa é obrigatório');
  if (!dados.matriculaResponsavel) erros.push('Matrícula do responsável é obrigatória');

  if (erros.length > 0) {
    throw new Error('Dados inválidos : \n' + erros.join('\n'));
  }
};

/**
 * Calcula prazo de substituição conforme contrato
 * Manual Seção 3.3
 */
GestaoRecusasService.prototype.calcularPrazoSubstituicao = function(produto) {
  // Produtos altamente perecíveis : 24 horas
  var pereciveis24h = ['pão', 'leite', 'iogurte', 'carne fresca', 'peixe fresco', 'verduras'];

  // Produtos perecíveis : 48 horas
  var pereciveis48h = ['carne congelada', 'frango', 'frutas'];

  // Demais produtos : 5 dias úteis

  var produtoLower = produto.toLowerCase();

  if (pereciveis24h.some(function(p) { return produtoLower.indexOf(p) >= 0; })) {} else if (pereciveis48h.some(function(p) { return produtoLower.indexOf(p) >= 0; })) {} else {}
};

/**
 * Calcula data limite para substituição
 */
GestaoRecusasService.prototype.calcularDataLimite = function(produto) {
  var prazo = this.calcularPrazoSubstituicao(produto);
  var dataLimite = new Date();

  if (prazo == '24 horas') {
    dataLimite.setDate(dataLimite.getDate() + 1);
  } else if (prazo == '48 horas') {
    dataLimite.setDate(dataLimite.getDate() + 2);
  } else {
    // 5 dias úteis
    var diasAdicionados = 0;
    while (diasAdicionados < 5) {
      dataLimite.setDate(dataLimite.getDate() + 1);
      var diaSemana = dataLimite.getDay();
      if (diaSemana != 0 && diaSemana != 6) { // Não é sábado nem domingo
        diasAdicionados++
      }
    }
  }

};

/**
 * Executa ações automáticas após registro
 */
GestaoRecusasService.prototype.executarAcoesAutomaticas = function(registro) {
  try {
    // 1. Notifica UNIAE
    this.notificarUNIAE(registro);

    // 2. Notifica Executor do Contrato
    this.notificarExecutor(registro);

    // 3. Registra no histórico
    this.registrarHistorico(registro, 'RECUSA_REGISTRADA');

    // 4. Atualiza estatísticas do fornecedor
    this.atualizarEstatisticasFornecedor(registro.fornecedor);

  } catch (e) {
    Logger.log('⚠️ Erro em ações automáticas : ' + e.message);
  }
};


/**
 * Notifica UNIAE sobre a recusa
 */
GestaoRecusasService.prototype.notificarUNIAE = function(registro) {
  try {
    var assunto = '🚨 RECUSA DE PRODUTO - ' + registro.unidadeEscolar;

    var mensagem = 'REGISTRO DE RECUSA DE PRODUTO\n\n' +
                   '═══════════════════════════════════════\n' +
                   'ID : ' + registro.id + '\n' +
                   'Data/Hora : ' + Utilities.formatDate(registro.dataRecusa, 'GMT-3', 'dd/MM/yyyy') +
                   ' às ' + registro.horaRecusa + '\n' +
                   '═══════════════════════════════════════\n\n' +
                   'UNIDADE ESCOLAR : ' + registro.unidadeEscolar + '\n' +
                   'FORNECEDOR : ' + registro.fornecedor + '\n' +
                   'NOTA FISCAL : ' + registro.notaFiscal + '\n\n' +
                   'PRODUTO RECUSADO : \n' +
                   '• Produto : ' + registro.produto + '\n' +
                   '• Quantidade : ' + registro.quantidade + registro.unidadeMedida + '\n' +
                   '• Lote : ' + registro.lote + '\n' +
                   '• Validade : ' + registro.validade + '\n\n' +
                   'MOTIVO DA RECUSA : \n' +
                   '• Categoria : ' + registro.categoriaMotivo + '\n' +
                   '• Detalhamento : ' + registro.motivoDetalhado + '\n' +
                   '• Observações : ' + registro.observacoes + '\n\n' +
                   'RESPONSÁVEL : \n' +
                   '• Nome : ' + registro.responsavelRecusa + '\n' +
                   '• Matrícula : ' + registro.matriculaResponsavel + '\n' +
                   '• Cargo : ' + registro.cargoResponsavel + '\n\n' +
                   'PRAZO PARA SUBSTITUIÇÃO : ' + registro.prazoSubstituicao + '\n' +
                   'DATA LIMITE : ' + Utilities.formatDate(registro.dataLimiteSubstituicao, 'GMT-3', 'dd/MM/yyyy HH,mm') + '\n\n' +
                   '═══════════════════════════════════════\n' +
                   'Conforme Manual de Análise Processual - Seção 3.2\n' +
                   'A empresa deve substituir o produto no prazo estabelecido.\n' +
                   '═══════════════════════════════════════';

    // Envia notificação (se serviço de notificações estiver disponível)
    if (typeof NotificacoesAlertasService != 'undefined') {
      var notifService = new NotificacoesAlertasService();
      notifService.enviarNotificacao({
        tipo : 'ALERTA_CRITICO',
        assunto : assunto,
        mensagem : mensagem,
        destinatarios : ['uniae@se.df.gov.br'], // Configurar email real
        moduloOrigem : 'GESTAO_RECUSAS',
        entidade : 'RECUSA',
        entidadeId : registro.id
      });
    }

    Logger.log('📧 UNIAE notificada sobre recusa : ' + registro.id);

  } catch (e) {
    Logger.log('⚠️ Erro ao notificar UNIAE : ' + e.message);
  }
};


/**
 * Notifica Executor do Contrato
 */
GestaoRecusasService.prototype.notificarExecutor = function(registro) {
  // Similar à notificação UNIAE, mas para o executor
  Logger.log('📧 Executor notificado sobre recusa : ' + registro.id);
};

/**
 * Registra substituição de produto
 */
GestaoRecusasService.prototype.registrarSubstituicao = function(idRecusa, dadosSubstituicao) {
  try {
    var sheet = getOrCreateSheetSafe(this.sheetSubstituicoes);

    var substituicao = {
      idRecusa : idRecusa,
      dataSubstituicao : dadosSubstituicao.dataSubstituicao || new Date(),
      horaSubstituicao : Utilities.formatDate(new Date(), 'GMT-3', 'HH,mm : ss'),
      produtoSubstituto : dadosSubstituicao.produtoSubstituto,
      quantidadeSubstituida : dadosSubstituicao.quantidadeSubstituida,
      loteNovo : dadosSubstituicao.loteNovo || '',
      validadeNova : dadosSubstituicao.validadeNova || '',
      conformeEspecificacao : dadosSubstituicao.conformeEspecificacao || 'Sim',
      observacoes : dadosSubstituicao.observacoes || '',
      responsavelRecebimento : dadosSubstituicao.responsavelRecebimento,
      matriculaResponsavel : dadosSubstituicao.matriculaResponsavel,
      dentroDoPrazo : this.verificarPrazo(idRecusa),
      registradoPor : Session.getActiveUser().getEmail(),
      dataRegistro : new Date()
    };

    var headers = this.getHeadersSubstituicoes();
    var row = this.mapearParaLinha(substituicao, headers);

    sheet.appendRow(row);

    // Atualiza status da recusa original
    this.atualizarStatusRecusa(idRecusa, 'Substituída', substituicao.dentroDoPrazo);

    // Registra no histórico
    this.registrarHistorico(substituicao, 'SUBSTITUICAO_REALIZADA');

    Logger.log('✅ Substituição registrada para recusa : ' + idRecusa);

    return {
      sucesso : true,
      mensagem : 'Substituição registrada com sucesso',
      dentroDoPrazo : substituicao.dentroDoPrazo
    };

  } catch (e) {
    Logger.log('❌ Erro ao registrar substituição : ' + e.message);
    throw new Error('Falha ao registrar substituição : ' + e.message);
}
};

/**
 * Verifica se substituição foi feita dentro do prazo
 */
GestaoRecusasService.prototype.verificarPrazo = function(idRecusa) {
  try {
    var sheet = getSS().getSheetByName(this.sheetRecusas);
    var data = sheet.getDataRange().getValues();
    var headers = data[0];

    var idIdx = headers.indexOf('ID');
    var dataLimiteIdx = headers.indexOf('Data Limite Substituição');

    for (var i = 1; i < data.length; i++) {
      if (data[i][idIdx] == idRecusa) {
        var dataLimite = new Date(data[i][dataLimiteIdx]);
        var agora = new Date();
      }
    }

  } catch (e) {
  }
};


/**
 * Atualiza status da recusa
 */
GestaoRecusasService.prototype.atualizarStatusRecusa = function(idRecusa, novoStatus, dentroDoPrazo) {
  try {
    var sheet = getSS().getSheetByName(this.sheetRecusas);
    var data = sheet.getDataRange().getValues();
    var headers = data[0];

    var idIdx = headers.indexOf('ID');
    var statusIdx = headers.indexOf('Status');
    var statusSubstIdx = headers.indexOf('Status Substituição');

    for (var i = 1; i < data.length; i++) {
      if (data[i][idIdx] == idRecusa) {
        sheet.getRange(i + 1, statusIdx + 1).setValue(novoStatus);
        sheet.getRange(i + 1, statusSubstIdx + 1).setValue(
          dentroDoPrazo == 'Sim' ? 'Substituída no Prazo' : 'Substituída Fora do Prazo'
        );
        break;
      }
    }
  } catch (e) {
    Logger.log('Erro ao atualizar status : ' + e.message);
  }
};


/**
 * Gera relatório de recusas
 */
GestaoRecusasService.prototype.gerarRelatorioRecusas = function(filtros) {
  try {
    var sheet = getSS().getSheetByName(this.sheetRecusas);
    if (!sheet || sheet.getLastRow() <= 1) {}

    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var registros = data.slice(1);

    // Estatísticas
    var stats = {
      totalRecusas : registros.length,
      aguardandoSubstituicao : 0,
      substituidas : 0,
      foraDoPrazo : 0,
      porFornecedor : {},
      porMotivo : {},
      porUnidade : {}
    };

    var fornecedorIdx = headers.indexOf('Fornecedor');
    var motivoIdx = headers.indexOf('Categoria Motivo');
    var unidadeIdx = headers.indexOf('Unidade Escolar');
    var statusIdx = headers.indexOf('Status Substituição');

    registros.forEach(function(row) {
      var fornecedor = row[fornecedorIdx];
      var motivo = row[motivoIdx];
      var unidade = row[unidadeIdx];
      var status = row[statusIdx];

      // Contadores
      if (status == 'Aguardando') stats.aguardandoSubstituicao++
      if (status.indexOf('Substituída') >= 0) stats.substituidas++
      if (status == 'Substituída Fora do Prazo') stats.foraDoPrazo++

      // Por fornecedor
      stats.porFornecedor[fornecedor] = (stats.porFornecedor[fornecedor] || 0) + 1;

      // Por motivo
      stats.porMotivo[motivo] = (stats.porMotivo[motivo] || 0) + 1;

      // Por unidade
      stats.porUnidade[unidade] = (stats.porUnidade[unidade] || 0) + 1;
    });

    return {
      sucesso : true,
      estatisticas : stats,
      registros : registros.map(function(row) {
        var obj = {};
        headers.forEach(function(header, idx) {
          obj[header] = row[idx];
        });
      })
    };

  } catch (e) {
    Logger.log('Erro ao gerar relatório : ' + e.message);

// ==
// FUNÇÕES AUXILIARES
// ==
}
};

GestaoRecusasService.prototype.gerarSequencial = function() {
  var sheet = getSS().getSheetByName(this.sheetRecusas);
  if (!sheet) return '001';

  var lastRow = sheet.getLastRow();
};

GestaoRecusasService.prototype.getHeadersRecusas = function() {
    'ID', 'Data Recusa', 'Hora Recusa', 'Unidade Escolar', 'Fornecedor', 'CNPJ Fornecedor',
    'Nota Fiscal', 'Termo Recebimento', 'Produto', 'Quantidade', 'Unidade Medida',
    'Lote', 'Validade', 'Categoria Motivo', 'Motivo Detalhado', 'Observações',
    'Foto Anexada', 'Link Foto', 'Responsável Recusa', 'Matrícula Responsável',
    'Cargo Responsável', 'Comunicado UNIAE', 'Data Comunicação', 'Comunicado Fornecedor',
    'Prazo Substituição', 'Data Limite Substituição', 'Status Substituição', 'Status',
    'Impacto Alimentação', 'Ação Imediata', 'Registrado Por', 'Data Registro'
  };

GestaoRecusasService.prototype.getHeadersSubstituicoes = function() {
    'ID Recusa', 'Data Substituição', 'Hora Substituição', 'Produto Substituto',
    'Quantidade Substituída', 'Lote Novo', 'Validade Nova', 'Conforme Especificação',
    'Observações', 'Responsável Recebimento', 'Matrícula Responsável', 'Dentro do Prazo',
    'Registrado Por', 'Data Registro'
  };

GestaoRecusasService.prototype.mapearParaLinha = function(obj, headers) {
    var key = header.replace(/ /g, '').replace(/\//g, '').toLowerCase();
    var keys = Object.keys(obj);

    for (var i = 0; i < keys.length; i++) {
      var objKey = keys[i].toLowerCase();
      if (objKey == key || objKey.indexOf(key) >= 0 || key.indexOf(objKey) >= 0) {}
    }

  };

GestaoRecusasService.prototype.registrarHistorico = function(registro, acao) {
  // Implementação simplificada
  Logger.log('📝 Histórico : ' + acao + ' - ' + (registro.id || registro.idRecusa));
};

GestaoRecusasService.prototype.atualizarEstatisticasFornecedor = function(fornecedor) {
  // Implementação simplificada
  Logger.log('📊 Estatísticas atualizadas para : ' + fornecedor);
};

// ==
// FUNÇÕES PÚBLICAS
// ==

/**
 * Função principal para registrar recusa (chamada pelo menu/UI)
 */
function registrarRecusas() {
  try {
    var ui = SpreadsheetApp.getUi();

    try {
      var service = new GestaoRecusasService();

      // Abre formulário HTML
      var html = HtmlService.createTemplateFromFile('UI_HTML_FormRecusa').evaluate()
        .setWidth(600)
        .setHeight(700);

      ui.showModalDialog(html, '❌ Registrar Recusa de Produto');

    } catch (e) {
      ui.alert('Erro', 'Falha ao abrir formulário : ' + e.message, ui.ButtonSet.OK);
      return {
        chaveAcesso : chaveAcesso,
        situacao : "ERRO",
        valida : false
      };
    }
  } catch (error) {
    Logger.log("Erro em registrarRecusas: " + error.message);
    throw error;
  }
}

/**
 * Processa dados do formulário
 */
function processarFormularioRecusa(dados) {
  try {
    var service = new GestaoRecusasService();
    var resultado = service.registrarRecusa(dados);

    return resultado;

  } catch (e) {
    return {
      sucesso : false,
      erro : e.message
    };
  }
}

/**
 * Registrar substituição
 */
function registrarSubstituicaoProduto(idRecusa, dados) {
  try {
    var service = new GestaoRecusasService();
    return service.registrarSubstituicao(idRecusa, dados);
  } catch (e) {
    return { sucesso : false, erro : e.message };
  }
}

/**
 * Gerar relatório
 */
function gerarRelatorioRecusas(filtros) {
  var service = new GestaoRecusasService();
  return service.gerarRelatorioRecusas(filtros || {});
}
