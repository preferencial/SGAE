'use strict';

/**
 * INFRA_NOTIFICACOES
 * Consolidado de : NotificacoesAlertas.gs
 * @version 2.0.0
 * @created 2025-11-04
 */


// ---- NotificacoesAlertas.gs ----
/**
 * NotificacoesAlertas.gs - Sistema de Notificações e Alertas
 * Notificações automáticas por email e alertas no sistema
 *
 * BASE LEGAL :
 * - Transparência e comunicação efetiva
 * - Prevenção de não conformidades
 *
 * ESCOPO :
 * - Notificações por email
 * - Alertas no sistema
 * - Agendamento de notificações
 * - Templates de email
 * - Destinatários configuráveis
 * - Histórico de notificações
 */

/**
 * TIPOS DE NOTIFICAÇÃO
 */
var TIPOS_NOTIFICACAO = {
  ALERTA_CRITICO : {
    codigo : 'ALERTA_CRITICO',
    nome : 'Alerta Crítico',
    prioridade : 1,
    cor : '#D32F2F'
  },
  ALERTA_IMPORTANTE : {
    codigo : 'ALERTA_IMPORTANTE',
    nome : 'Alerta Importante',
    prioridade : 2,
    cor : '#F57C00'
  },
  LEMBRETE : {
    codigo : 'LEMBRETE',
    nome : 'Lembrete',
    prioridade : 3,
    cor : '#FBC02D'
  },
  INFORMATIVO : {
    codigo : 'INFORMATIVO',
    nome : 'Informativo',
    prioridade : 4,
    cor : '#388E3C'
  }
};

/**
 * FREQUÊNCIA DE NOTIFICAÇÃO
 */
var FREQUENCIA_NOTIFICACAO = {
  IMEDIATA : 'Imediata',
  DIARIA : 'Diária',
  SEMANAL : 'Semanal',
  MENSAL : 'Mensal'
};

/**
 * STATUS DE NOTIFICAÇÃO
 */
var STATUS_NOTIFICACAO = {
  PENDENTE : 'Pendente',
  ENVIADA : 'Enviada',
  ERRO : 'Erro',
  CANCELADA : 'Cancelada'
};

/**
 * Service : Notificações e Alertas
 */
function NotificacoesAlertasService(dependencies) {
  try {
    try {
      try {
        BaseService.call(this, dependencies);
        this.sheetNotificacoes = 'Notificacoes_Historico';
        this.sheetDestinatarios = 'Notificacoes_Destinatarios';
        this.sheetAgendamentos = 'Notificacoes_Agendamentos';
      } catch (error) {
        Logger.log("Erro em NotificacoesAlertasService: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em NotificacoesAlertasService: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em NotificacoesAlertasService: " + error.message);
    throw error;
  }
}

NotificacoesAlertasService.prototype = Object.create(BaseService.prototype);
NotificacoesAlertasService.prototype.constructor = NotificacoesAlertasService;

/**
 * Envia notificação por email
 */
NotificacoesAlertasService.prototype.enviarNotificacao = function(dados) {
  validateRequired(dados.destinatarios, 'Destinatários');
  validateRequired(dados.assunto, 'Assunto');
  validateRequired(dados.mensagem, 'Mensagem');

  var notificacao = {
    id : this.generateId(),
    dataEnvio : new Date(),
    tipo : dados.tipo || TIPOS_NOTIFICACAO.INFORMATIVO.codigo,
    destinatarios : dados.destinatarios,
    assunto : dados.assunto,
    mensagem : dados.mensagem,
    moduloOrigem : dados.moduloOrigem || '',
    entidadeVinculada : dados.entidadeVinculada || '',
    entidadeId : dados.entidadeId || '',
    status : STATUS_NOTIFICACAO.PENDENTE,
    tentativas : 0,
    mensagemErro : ''
  };

  try {
    // Enviar email
    var htmlBody = this.formatarEmailHTML(notificacao);

    MailApp.sendEmail({
      to : dados.destinatarios.join(','),
      subject : notificacao.assunto,
      htmlBody : htmlBody,
      name : 'Sistema PNAE - CRE PP/Cruzeiro'
    });

    notificacao.status = STATUS_NOTIFICACAO.ENVIADA;
    notificacao.tentativas = 1;

    SystemLogger.info('Notificação enviada', {
      id : notificacao.id,
      destinatarios : dados.destinatarios.length,
      tipo : notificacao.tipo
    });

  } catch (error) {
    notificacao.status = STATUS_NOTIFICACAO.ERRO;
    notificacao.mensagemErro = error.message;
    notificacao.tentativas = 1;

    SystemLogger.error('Erro ao enviar notificação', error);
  }

  this.salvarNotificacao(notificacao);
};

/**
 * Formata email em HTML
 */
NotificacoesAlertasService.prototype.formatarEmailHTML = function(notificacao) {
  var tipoInfo = TIPOS_NOTIFICACAO[notificacao.tipo] || TIPOS_NOTIFICACAO.INFORMATIVO;

  var html = [];
  html.push('<!DOCTYPE html>');
  html.push('<html>');
  html.push('<head>');
  html.push('<meta charset="UTF-8">');
  html.push('<style>');
  html.push('body { font-family : Arial, sans-serif; line-height : 1.6; color : #333; }');
  html.push('.container { max-width : 600px; margin : 0 auto; padding : 20px; }');
  html.push('.header { background-color : ' + tipoInfo.cor + '; color : white; padding : 20px; text-align : center; }');
  html.push('.content { background-color : #f9f9f9; padding, 20px; margin-top : 20px; }');
  html.push('.footer { text-align : center; margin-top, 20px; font-size : 12px; color : #666; }');
  html.push('</style>');
  html.push('</head>');
  html.push('<body>');
  html.push('<div class="container">');
  html.push('<div class="header">');
  html.push('<h2>🍎 Sistema PNAE - Alimentação Escolar</h2>');
  html.push('<p>' + tipoInfo.nome + '</p>');
  html.push('</div>');
  html.push('<div class="content">');
  html.push('<p>' + notificacao.mensagem.replace(/\n/g, '<br>') + '</p>');
  html.push('</div>');
  html.push('<div class="footer">');
  html.push('<p>CRE Plano Piloto e Cruzeiro - UNIAE</p>');
  html.push('<p>Data : ' + Utilities.formatDate(notificacao.dataEnvio, Session.getScriptTimeZone(), 'dd/MM/yyyy HH,mm') + '</p>');
  html.push('<p><small>Esta é uma mensagem automática. Não responda este email.</small></p>');
  html.push('</div>');
  html.push('</div>');
  html.push('</body>');
  html.push('</html>');

};

/**
 * Agenda notificação recorrente
 */
NotificacoesAlertasService.prototype.agendarNotificacao = function(dados) {
  validateRequired(dados.nome, 'Nome do Agendamento');
  validateRequired(dados.frequencia, 'Frequência');
  validateRequired(dados.destinatarios, 'Destinatários');
  validateRequired(dados.assunto, 'Assunto');
  validateRequired(dados.mensagem, 'Mensagem');

  var sheet = getOrCreateSheetSafe(this.sheetAgendamentos);

  var agendamento = {
    id : this.generateId(),
    dataAgendamento : new Date(),
    nome : dados.nome,
    frequencia : dados.frequencia,
    tipo : dados.tipo || TIPOS_NOTIFICACAO.LEMBRETE.codigo,
    destinatarios : dados.destinatarios,
    assunto : dados.assunto,
    mensagem : dados.mensagem,
    moduloOrigem : dados.moduloOrigem || '',
    ativo : true,
    proximaExecucao : this.calcularProximaExecucao(dados.frequencia),
    ultimaExecucao : null,
    totalEnvios : 0,
    observacoes : dados.observacoes || ''
  };

  this.salvarAgendamento(agendamento);

  SystemLogger.info('Notificação agendada', {
    id : agendamento.id,
    nome : dados.nome,
    frequencia : dados.frequencia
  });

};

/**
 * Calcula próxima execução baseada na frequência
 */
NotificacoesAlertasService.prototype.calcularProximaExecucao = function(frequencia) {
  var proxima = new Date();

  switch(frequencia) {
    case FREQUENCIA_NOTIFICACAO.DIARIA :
      proxima.setDate(proxima.getDate() + 1);
      break;
    case FREQUENCIA_NOTIFICACAO.SEMANAL :
      proxima.setDate(proxima.getDate() + 7);
      break;
    case FREQUENCIA_NOTIFICACAO.MENSAL :
      proxima.setMonth(proxima.getMonth() + 1);
      break;
    default :
      proxima = null;
  }

};

/**
 * Executa notificações agendadas
 */
NotificacoesAlertasService.prototype.executarNotificacoesAgendadas = function() {
  var agendamentos = this.listarAgendamentosAtivos();
  var hoje = new Date();
  var executados = 0;

  agendamentos.forEach((function(agend) {
    if (agend.proximaExecucao && new Date(agend.proximaExecucao) <= hoje) {
      try {
        // Enviar notificação
        this.enviarNotificacao({
          destinatarios : agend.destinatarios,
          assunto : agend.assunto,
          mensagem : agend.mensagem,
          tipo : agend.tipo,
          moduloOrigem : agend.moduloOrigem
        });

        // Atualizar agendamento
        agend.ultimaExecucao = new Date();
        agend.totalEnvios++
        agend.proximaExecucao = this.calcularProximaExecucao(agend.frequencia);

        this.atualizarAgendamento(agend);
        executados++

      } catch (error) {
        SystemLogger.error('Erro ao executar notificação agendada', error);
      }
    }
  }).bind(this));

  SystemLogger.info('Notificações agendadas executadas', {
    total : executados
  });
};

/**
 * Envia alertas críticos do sistema
 */
NotificacoesAlertasService.prototype.enviarAlertasCriticosSistema = function() {
  var destinatarios = this.obterDestinatariosAlertas();

  if (destinatarios.length == 0) {
    SystemLogger.warn('Nenhum destinatário configurado para alertas críticos');
  }

  var alertas = [];

  try {
    // Verificar produtos vencidos
    var armazenamentoService = DIContainer.resolve('armazenamentoGeneros');
    var vencidos = armazenamentoService.verificarVencidos(null);

    if (vencidos.length > 0) {
      alertas.push({
        titulo : '🔴 PRODUTOS VENCIDOS NO ESTOQUE',
        descricao : vencidos.length + ' produto(s) vencido(s) identificado(s)',
        acao : 'Realizar descarte imediato conforme NT 1/2025 Item 7'
      });
    }

    // Verificar não conformidades vencidas
    var supervisaoService = DIContainer.resolve('supervisaoNutricao');
    var ncVencidas = supervisaoService.verificarNaoConformidadesVencidas(null);

    if (ncVencidas.length > 0) {
      alertas.push({
        titulo : '🔴 NÃO CONFORMIDADES COM PRAZO VENCIDO',
        descricao : ncVencidas.length + ' não conformidade(s) não corrigida(s) no prazo',
        acao : 'Providenciar correção urgente'
      });
    }

    // Verificar processos SEI vencidos
    var seiService = DIContainer.resolve('integracaoSEI');
    var processosVencidos = seiService.verificarPrazosVencidos();

    if (processosVencidos.length > 0) {
      alertas.push({
        titulo : '⏰ PROCESSOS SEI COM PRAZO VENCIDO',
        descricao : processosVencidos.length + ' processo(s) com prazo expirado',
        acao : 'Verificar e dar andamento aos processos'
      });
    }

  } catch (error) {
    SystemLogger.error('Erro ao verificar alertas críticos', error);
  }

  // Enviar notificação se houver alertas
  if (alertas.length > 0) {
    var mensagem = this.formatarMensagemAlertas(alertas);

    this.enviarNotificacao({
      destinatarios : destinatarios,
      assunto : '🚨 ALERTAS CRÍTICOS - Sistema PNAE',
      mensagem : mensagem,
      tipo : TIPOS_NOTIFICACAO.ALERTA_CRITICO.codigo,
      moduloOrigem : 'SISTEMA'
    });
  }
};


/**
 * Formata mensagem de alertas
 */
NotificacoesAlertasService.prototype.formatarMensagemAlertas = function(alertas) {
  var linhas = [];
  linhas.push('ATENÇÃO : Foram identificados alertas críticos no sistema que requerem ação imediata.\n');

  alertas.forEach(function(alerta, index) {
    linhas.push((index + 1) + '. ' + alerta.titulo);
    linhas.push('   ' + alerta.descricao);
    linhas.push('   Ação necessária : ' + alerta.acao);
    linhas.push('');
  });

  linhas.push('Por favor, acesse o sistema para mais detalhes e tome as providências necessárias.');

};

/**
 * Obtém destinatários configurados para alertas
 */
NotificacoesAlertasService.prototype.obterDestinatariosAlertas = function() {
  var destinatarios = this.listarDestinatarios()

    .filter(function(dest) {})
    .map(function(dest) {});
};

/**
 * Cadastra destinatário de notificações
 */
NotificacoesAlertasService.prototype.cadastrarDestinatario = function(dados) {
  validateRequired(dados.nome, 'Nome');
  validateRequired(dados.email, 'Email');
  validateEmail(dados.email);

  var sheet = getOrCreateSheetSafe(this.sheetDestinatarios);

  var destinatario = {
    id : this.generateId(),
    dataCadastro : new Date(),
    nome : dados.nome,
    email : dados.email,
    cargo : dados.cargo || '',
    unidade : dados.unidade || '',
    receberAlertas : dados.receberAlertas != false,
    receberRelatorios : dados.receberRelatorios != false,
    receberLembretes : dados.receberLembretes != false,
    ativo : true,
    observacoes : dados.observacoes || ''
  };

  this.salvarDestinatario(destinatario);

};

/**
 * Lista destinatários
 */
NotificacoesAlertasService.prototype.listarDestinatarios = function() {
  var sheet = getOrCreateSheetSafe(this.sheetDestinatarios);
  if (sheet.getLastRow() <= 1) return [];

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var destinatarios = [];

  for (var i = 1; i < data.length; i++) {
    destinatarios.push(this.mapRowToDestinatario(data[i], headers));
  }

};

/**
 * Lista agendamentos ativos
 */
NotificacoesAlertasService.prototype.listarAgendamentosAtivos = function() {
  var sheet = getOrCreateSheetSafe(this.sheetAgendamentos);
  if (sheet.getLastRow() <= 1) return [];

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var agendamentos = [];

  for (var i = 1; i < data.length; i++) {
    var agend = this.mapRowToAgendamento(data[i], headers);
    if (agend.ativo) {
      agendamentos.push(agend);
    }
  }

};

/**
 * Métodos auxiliares - Notificações
 */
NotificacoesAlertasService.prototype.salvarNotificacao = function(notificacao) {
  var sheet = getOrCreateSheetSafe(this.sheetNotificacoes);
  var headers = ['ID', 'Data Envio', 'Tipo', 'Destinatários', 'Assunto', 'Mensagem',
                 'Módulo Origem', 'Entidade', 'Entidade ID', 'Status', 'Tentativas', 'Mensagem Erro'];

  if (sheet.getLastRow() == 0) {
    sheet.appendRow(headers);
  }

  var row = [
    notificacao.id, notificacao.dataEnvio, notificacao.tipo,
    notificacao.destinatarios.join('; '), notificacao.assunto, notificacao.mensagem,
    notificacao.moduloOrigem || '', notificacao.entidadeVinculada || '',
    notificacao.entidadeId || '', notificacao.status, notificacao.tentativas,
    notificacao.mensagemErro || ''
  ];

  sheet.appendRow(row);
};

/**
 * Métodos auxiliares - Destinatários
 */
NotificacoesAlertasService.prototype.salvarDestinatario = function(destinatario) {
  var sheet = getOrCreateSheetSafe(this.sheetDestinatarios);
  var headers = ['ID', 'Data Cadastro', 'Nome', 'Email', 'Cargo', 'Unidade',
                 'Receber Alertas', 'Receber Relatórios', 'Receber Lembretes', 'Ativo', 'Observações'];

  if (sheet.getLastRow() == 0) {
    sheet.appendRow(headers);
  }

  var row = [
    destinatario.id, destinatario.dataCadastro, destinatario.nome, destinatario.email,
    destinatario.cargo || '', destinatario.unidade || '', destinatario.receberAlertas,
    destinatario.receberRelatorios, destinatario.receberLembretes, destinatario.ativo,
    destinatario.observacoes || ''
  ];

  sheet.appendRow(row);
};

NotificacoesAlertasService.prototype.mapRowToDestinatario = function(row, headers) {
  return {
    id : row[0], dataCadastro : row[1], nome : row[2], email : row[3], cargo : row[4],
    unidade : row[5], receberAlertas : row[6], receberRelatorios : row[7],
    receberLembretes : row[8], ativo : row[9], observacoes : row[10]
  };
};

/**
 * Métodos auxiliares - Agendamentos
 */
NotificacoesAlertasService.prototype.salvarAgendamento = function(agendamento) {
  var sheet = getOrCreateSheetSafe(this.sheetAgendamentos);
  var headers = ['ID', 'Data Agendamento', 'Nome', 'Frequência', 'Tipo', 'Destinatários',
                 'Assunto', 'Mensagem', 'Módulo Origem', 'Ativo', 'Próxima Execução',
                 'Última Execução', 'Total Envios', 'Observações'];

  if (sheet.getLastRow() == 0) {
    sheet.appendRow(headers);
  }

  var row = this.mapAgendamentoToRow(agendamento, headers);
  sheet.appendRow(row);
};

NotificacoesAlertasService.prototype.atualizarAgendamento = function(agendamento) {
  var sheet = getOrCreateSheetSafe(this.sheetAgendamentos);
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == agendamento.id) {
      var headers = data[0];
      var row = this.mapAgendamentoToRow(agendamento, headers);
      sheet.getRange(i + 1, 1, 1, row.length).setValues([row]);
    }
  }
};

NotificacoesAlertasService.prototype.mapAgendamentoToRow = function(agend, headers) {
    agend.id, agend.dataAgendamento, agend.nome, agend.frequencia, agend.tipo,
    agend.destinatarios.join('; '), agend.assunto, agend.mensagem, agend.moduloOrigem || '',
    agend.ativo, agend.proximaExecucao || '', agend.ultimaExecucao || '',
    agend.totalEnvios, agend.observacoes || ''
  };

NotificacoesAlertasService.prototype.mapRowToAgendamento = function(row, headers) {
  return {
    id : row[0], dataAgendamento : row[1], nome : row[2], frequencia : row[3], tipo : row[4],
    destinatarios : row[5] ? row[5].split('; ') : [], assunto : row[6], mensagem : row[7],
    moduloOrigem : row[8], ativo : row[9], proximaExecucao : row[10], ultimaExecucao : row[11],
    totalEnvios : row[12], observacoes : row[13]
  };
};

NotificacoesAlertasService.prototype.generateId = function() {
};

/**
 * Registrar serviço no DI Container
 */
function registerNotificacoesAlertas() {
  DIContainer.bind('notificacoesAlertas', function() {
    return new NotificacoesAlertasService({});
  }, true);

  SystemLogger.info('NotificacoesAlertas service registered');
}

/**
 * Funções de menu
 */
function menuEnviarAlertasCriticos() {
  try {
    getSS().toast('Verificando alertas críticos/* spread */', 'Aguarde', 3);

    var service = DIContainer.resolve('notificacoesAlertas');
    service.enviarAlertasCriticosSistema();

    getSS().toast('Alertas críticos verificados e enviados (se houver)', 'Concluído', 5);

  } catch (error) {
    getSS().toast('Erro : ' + error.message, 'Erro', 5);
    SystemLogger.error('Erro ao enviar alertas críticos', error);
    return {
      chaveAcesso : chaveAcesso,
      situacao : "ERRO",
      valida : false
    };
  }
}

function menuExecutarNotificacoesAgendadas() {
  try {
    try {
      getSS().toast('Executando notificações agendadas/* spread */', 'Aguarde', 3);

      var service = DIContainer.resolve('notificacoesAlertas');
      var executados = service.executarNotificacoesAgendadas();

      var msg = executados + ' notificação(ões) agendada(s) executada(s)';
      getSS().toast(msg, 'Concluído', 5);

    } catch (error) {
      getSS().toast('Erro : ' + error.message, 'Erro', 5);
      SystemLogger.error('Erro ao executar notificações agendadas', error);
      return {
        chaveAcesso : chaveAcesso,
        situacao : "ERRO",
        valida : false
      };
    }
  } catch (error) {
    Logger.log("Erro em menuExecutarNotificacoesAgendadas: " + error.message);
    throw error;
  }
}

/**
 * Trigger diário para notificações automáticas
 */
function triggerNotificacoesDiarias() {
  try {
    var service = DIContainer.resolve('notificacoesAlertas');

    // Enviar alertas críticos
    service.enviarAlertasCriticosSistema();

    // Executar notificações agendadas
    service.executarNotificacoesAgendadas();

    SystemLogger.info('Trigger diário de notificações executado');

  } catch (error) {
    SystemLogger.error('Erro no trigger diário de notificações', error);
    return {
      chaveAcesso : chaveAcesso,
      situacao : "ERRO",
      valida : false
    };
  }
}

