/**
 * @fileoverview UI Standards - Padrões de Interface
 * @version 4.0.0
 *
 * Consolidado de: UXStandards.gs, InteractiveComponents.gs
 *
 * Dependências:
 * - Core_UI_Safe.gs (getSafeUi, safeAlert, safePrompt)
 */

'use strict';

// Usa funções de Core_UI_Safe.gs (getSafeUi, safeAlert, safePrompt)


// ---- UXStandards.gs ----
/**
 * UXStandards.gs - Biblioteca de Padrões UX
 *
 * Este arquivo implementa os 3 pilares da padronização UX :
 * 1. Feedback Visual Consistente
 * 2. Estrutura de Diálogo Padronizada
 * 3. Tratamento de Erros Unificado
 *
 * USO : Todas as funções do sistema devem usar estas utilidades
 */

// ==
// CONSTANTES PADRONIZADAS
// ==

/**
 * Ícones padronizados por tipo
 */
var ICONES_PADRAO = {
  // Status,
  sucesso : '✅',
  erro : '❌',
  aviso : '⚠️',
  info : 'ℹ️',
  carregando : '⏳',

  // Ações,
  registrar : '📝',
  buscar : '🔍',
  editar : '✏️',
  excluir : '🗑️',
  exportar : '📤',
  importar : '📥',
  salvar : '💾',
  cancelar : '🚫',

  // Documentos,
  nota_fiscal : '📋',
  relatorio : '📊',
  documento : '📄',
  pasta : '📁',
  planilha : '📑',

  // Legal,
  legal : '⚖️',
  conformidade : '🎯',
  violacao : '🚨',

  // Usuários,
  usuario : '👤',
  comissao : '👥',
  unidade : '🏫',
  regional : '🌐',
  federal : '🏛️',

  // Processos,
  etapa : '▶️',
  concluido : '✔️',
  pendente : '⭕',
  progresso : '📈',

  // Outros,
  ajuda : '💡',
  atencao : '⚡',
  novidade : '✨',
  configuracao : '⚙️'
};

// ==
// PILAR 1 : FEEDBACK VISUAL CONSISTENTE
// ==

/**
 * Notificar usuário com padrão consistente
 *
 * @param { string: string } tipo - Tipo da notificação (sucesso, erro, aviso, info, carregando)
 * @param { string: string } titulo - Título da notificação
 * @param { string: string } mensagem - Mensagem da notificação
 * @param { number: number } duracao - Duração em segundos (padrão : 3)
 */
function notificarUsuario(tipo, titulo, mensagem, duracao) {
  try {
    var icone = ICONES_PADRAO[tipo] || ICONES_PADRAO.info;
    var duracaoSegundos = duracao || 3;

    var ss = getSS();
    if (ss) {
      ss.toast(
        icone + mensagem,
        titulo,
        duracaoSegundos
      );
    }
  } catch (e) {
    Logger.log('Erro ao notificar usuário : ' + e.message);
  }
}


/**
 * Mostrar progresso de operação com múltiplas etapas
 *
 * @param { string: string } operacao - Nome da operação
 * @param { number: number } etapaAtual - Etapa atual (1-based)
 * @param { number: number } totalEtapas - Total de etapas
 * @param { string: string } descricao - Descrição da etapa atual
 */
function mostrarProgresso(operacao, etapaAtual, totalEtapas, descricao) {
  try {
    try {
      var percentual = Math.round((etapaAtual / totalEtapas) * 100);
      var barra = gerarBarraProgresso(percentual);

      var mensagem = descricao + '\n' + barra + percentual + '%';

      getSS().toast(
        mensagem,
        operacao + ' (' + etapaAtual + '/' + totalEtapas + ')',
        2
      );
    } catch (e) {
      Logger.log('Erro ao mostrar progresso : ' + e.message);
    }
  } catch (error) {
    Logger.log("Erro em mostrarProgresso: " + error.message);
    throw error;
  }
}

/**
 * Gerar barra de progresso visual
 *
 * @param { number: number } percentual - Percentual de progresso (0-100)
 * @return { string: string } Barra de progresso formatada
 */
function gerarBarraProgresso(percentual) {
  var tamanho = 20;
  var preenchido = Math.round((percentual / 100) * tamanho);
  var barra = '';

  for (var i = 0; i < tamanho; i++) {
    barra += i < preenchido ? '█' : '░';
  }
  return barra;
}

/**
 * Notificações rápidas pré-configuradas
 */
var Notificacoes = {
  sucesso: function(mensagem, duracao) {
    notificarUsuario('sucesso', 'Sucesso', mensagem, duracao || 3);
  },
  erro: function(mensagem, duracao) {
    notificarUsuario('erro', 'Erro', mensagem, duracao || 5);
  },
  aviso: function(mensagem, duracao) {
    notificarUsuario('aviso', 'Atenção', mensagem, duracao || 4);
  },
  info: function(mensagem, duracao) {
    notificarUsuario('info', 'Informação', mensagem, duracao || 3);
  },
  processando: function(mensagem, duracao) {
    notificarUsuario('carregando', 'Processando', mensagem, duracao || 2);
  }
};

// ==
// PILAR 2 : ESTRUTURA DE DIÁLOGO PADRONIZADA
// ==

/**
 * Mostrar diálogo com estrutura padronizada
 *
 * @param { Object: Object } config - Configuração do diálogo
 * @param { string: string } config.icone - Ícone do título
 * @param { string: string } config.titulo - Título do diálogo
 * @param { string: string } config.baseLegal - Base legal (opcional)
 * @param { string: string } config.conteudo - Conteúdo principal
 * @param { string: string } config.acao - Ação sugerida (opcional)
 * @param { ButtonSet: ButtonSet } config.botoes - Botões do diálogo (padrão : OK)
 * @return { Button: Button } Botão clicado pelo usuário
 */
function mostrarDialogoPadrao(config) {
  try {
    try {
      var ui = getUiSafely();
      if (!ui) {
        Logger.log('[DIALOGO] ' + config.titulo + ': ' + config.conteudo);
        return null;
      }

      // Construir mensagem
      var mensagem = '';

      // 1. Contexto Legal (opcional)
      if (config.baseLegal) {
        mensagem += '⚖️ BASE LEGAL : ' + config.baseLegal + '\n\n';
      }

      // 2. Conteúdo Principal
      mensagem += config.conteudo + '\n\n';

      // 3. Separador e Ação (se houver)
      if (config.acao) {
        mensagem += '━━━━━━━━━━━━━━━━━━━━\n\n';
        mensagem += '🎯 AÇÃO : ' + config.acao;
      }

      // 4. Mostrar diálogo
      var titulo = (config.icone || ICONES_PADRAO.info) + config.titulo;
      var response = ui.alert(titulo, mensagem, botoes);
      return response;

    } catch (e) {
      Logger.log('Erro ao mostrar diálogo : ' + e.message);
      return null;
    }
  } catch (error) {
    Logger.log("Erro em mostrarDialogoPadrao: " + error.message);
    throw error;
  }
}


/**
 * Solicitar dado do usuário com validação RIGOROSA
 *
 * @param { Object: Object } config - Configuração do prompt
 * @param { string: string } config.icone - Ícone do título
 * @param { string: string } config.titulo - Título do prompt
 * @param { string: string } config.descricao - Descrição do campo
 * @param { string: string } config.ajuda - Dica de preenchimento (opcional)
 * @param { string: string } config.exemplo - Exemplo de valor (opcional)
 * @param { string: string } config.padrao - Valor padrão (opcional)
 * @param { boolean: boolean } config.obrigatorio - Se o campo é obrigatório
 * @param { function: function } config.validador - Função de validação (opcional)
 * @param { string: string } config.mensagemErro - Mensagem de erro de validação
 * @param { number: number } config.maxTentativas - Máximo de tentativas (padrão : 3)
 * @param { function: function } config.sanitizador - Função para limpar/formatar valor (opcional)
 * @return { Object: Object } { sucesso : boolean, valor, string, cancelado : boolean }
 */
function solicitarDadoPadrao(config) {
  try {
    try {
      var ui = getUiSafely();
      if (!ui) {
        Logger.log('[PROMPT] ' + config.titulo + ': UI não disponível');
        return { sucesso: false, valor: null, cancelado: true };
      }
      var maxTentativas = config.maxTentativas || 3;
      var tentativasRestantes = maxTentativas;

      // Construir prompt
      var mensagem = config.descricao + '\n\n';

      // Adicionar ajuda (opcional)
      if (config.ajuda) {
        mensagem += '💡 DICA : ' + config.ajuda + '\n\n';
      }

      // Adicionar exemplo (opcional)
      if (config.exemplo) {
        mensagem += '📌 EXEMPLO : ' + config.exemplo + '\n\n';
      }

      // Adicionar valor padrão (opcional)
      if (config.padrao) {
        mensagem += '(Padrão : ' + config.padrao + ')';
      }

      // Adicionar contador de tentativas se não for primeira
      if (tentativasRestantes < maxTentativas) {
        mensagem += '\n\n⚠️ Tentativas restantes : ' + tentativasRestantes;
      }

      var titulo = (config.icone || ICONES_PADRAO.registrar) + config.titulo;

      var response = safePrompt(titulo, mensagem, ui.ButtonSet.OK_CANCEL);

      if (response.getSelectedButton() == ui.Button.OK) {
        var valor = response.getResponseText() || config.padrao || '';

        // Sanitizar valor se função fornecida
        if (config.sanitizador) {
          valor = config.sanitizador(valor);
        }

        // Validar se obrigatório
        if (config.obrigatorio && !valor.trim()) {
          tentativasRestantes--;
          if (tentativasRestantes > 0) {
            Notificacoes.erro('Este campo é obrigatório. Tentativas restantes : ' + tentativasRestantes);
            config.maxTentativas = tentativasRestantes;
            return solicitarDadoPadrao(config);
          } else {
            Notificacoes.erro('Número máximo de tentativas excedido');
            return { sucesso : false, tentativasExcedidas : true };
          }
        }

        // Validar formato (opcional)
        if (config.validador && !config.validador(valor)) {
          tentativasRestantes--;
          if (tentativasRestantes > 0) {
            var msgErro = (config.mensagemErro || 'Formato inválido') +
                          '. Tentativas restantes : ' + tentativasRestantes;
            Notificacoes.erro(msgErro);
            config.maxTentativas = tentativasRestantes;
            return solicitarDadoPadrao(config);
          } else {
            Notificacoes.erro('Número máximo de tentativas excedido');
            return { sucesso : false, tentativasExcedidas : true };
          }
        }

        // Validação bem-sucedida
      }


    } catch (e) {
      Logger.log('Erro ao solicitar dado : ' + e.message);
      return { sucesso: false, valor: null, cancelado: true };
    }
  } catch (error) {
    Logger.log("Erro em solicitarDadoPadrao: " + error.message);
    throw error;
  }
}


/**
 * Confirmar ação com o usuário
 *
 * @param { string: string } titulo - Título da confirmação
 * @param { string: string } mensagem - Mensagem de confirmação
 * @param { string: string } icone - Ícone (opcional, padrão : aviso)
 * @return { boolean: boolean } true se confirmado, false se cancelado
 */
function confirmarAcao(titulo, mensagem, icone) {
  var ui = getUiSafely();
  var botoes = ui ? ui.ButtonSet.YES_NO : null;

  var resposta = mostrarDialogoPadrao({
    icone : icone || ICONES_PADRAO.aviso,
    titulo : titulo,
    conteudo : mensagem,
    botoes : botoes
  });

  return resposta && ui && resposta === ui.Button.YES;
}

/**
 * Diálogos pré-configurados
 */
var Dialogos = {
  sucesso: function(titulo, mensagem, acao) {
    return mostrarDialogoPadrao({
      icone : ICONES_PADRAO.sucesso,
      titulo : titulo,
      conteudo : mensagem,
      acao : acao
    });
  },
  erro: function(titulo, mensagem, solucoes) {
    return mostrarDialogoPadrao({
      icone : ICONES_PADRAO.erro,
      titulo : titulo,
      conteudo : mensagem + (solucoes ? '\n\n💡 SOLUÇÕES : \n' + solucoes : '')
    });
  },
  aviso: function(titulo, mensagem, acao) {
    return mostrarDialogoPadrao({
      icone : ICONES_PADRAO.aviso,
      titulo : titulo,
      conteudo : mensagem,
      acao : acao
    });
  },
  info: function(titulo, mensagem, baseLegal) {
    return mostrarDialogoPadrao({
      icone : ICONES_PADRAO.info,
      titulo : titulo,
      baseLegal : baseLegal,
      conteudo : mensagem
    });
  },
  confirmar: function(titulo, mensagem) {
    return confirmarAcao(titulo, mensagem);
  }
};


// ==
// PILAR 3 : TRATAMENTO DE ERROS UNIFICADO
// ==

/**
 * Executar função com tratamento de erros padronizado
 *
 * @param { string: string } nomeFuncao - Nome da função para logs
 * @param { function: function } funcao - Função a ser executada
 * @param { boolean: boolean } notificarInicio - Se deve notificar início (padrão : true)
 * @return { Object: Object } { sucesso : boolean, resultado, any, erro : string, categoria : string }
 */
function executarComTratamentoErros(nomeFuncao, funcao, notificarInicio) {
  notificarInicio = notificarInicio != false;

  try {
    // Log de início
    Logger.log('[INÍCIO] ' + nomeFuncao);

    // Notificar início (se solicitado)
    if (notificarInicio) {
      Notificacoes.processando('Processando/* spread */', 2);
    }

    // Executar função
    var resultado = funcao();

    // Log de sucesso
    Logger.log('[SUCESSO] ' + nomeFuncao);

    // Notificar sucesso
    Notificacoes.sucesso('Operação concluída com sucesso!', 3);


  } catch (erro) {
    // Log de erro
    Logger.log('[ERRO] ' + nomeFuncao + ' : ' + erro.message);
    Logger.log(erro.stack);

    // Categorizar erro
    var categoria = categorizarErro(erro);

    // Mostrar erro ao usuário
    mostrarErroUsuario(nomeFuncao, erro, categoria);

    return {
      sucesso : false,
      erro : erro.message,
      categoria : categoria,
      stack : erro.stack
    };
  }
}


/**
 * Categorizar erro para tratamento apropriado
 *
 * @param { Error: Error } erro - Objeto de erro
 * @return { string: string } Categoria do erro
 */
function categorizarErro(erro) {
  var mensagem = erro.message.toLowerCase();

  if (mensagem.indexOf('permission') >= 0 || mensagem.indexOf('permissão') >= 0) {
    return 'PERMISSAO';
  }

  if (mensagem.indexOf('not found') >= 0 || mensagem.indexOf('não encontrado') >= 0) {
    return 'NAO_ENCONTRADO';
  }

  if (mensagem.indexOf('invalid') >= 0 || mensagem.indexOf('inválido') >= 0) {
    return 'VALIDACAO';
  }

  if (mensagem.indexOf('timeout') >= 0 || mensagem.indexOf('tempo') >= 0) {
    return 'TIMEOUT';
  }

  if (mensagem.indexOf('duplicate') >= 0 || mensagem.indexOf('duplicado') >= 0) {
    return 'DUPLICADO';
  }

}

/**
 * Mostrar erro ao usuário de forma amigável
 *
 * @param { string: string } operacao - Nome da operação
 * @param { Error: Error } erro - Objeto de erro
 * @param { string: string } categoria - Categoria do erro
 */
function mostrarErroUsuario(operacao, erro, categoria) {
  var mensagens = {
    'PERMISSAO' : {
      titulo : 'Permissão Negada',
      descricao : 'Você não tem permissão para executar esta operação.',
      solucao : '• Verifique suas permissões\n' +
               '• Contate o administrador\n' +
               '• Solicite acesso necessário'
    },
    'NAO_ENCONTRADO' : {
      titulo : 'Não Encontrado',
      descricao : 'O recurso solicitado não foi encontrado.',
      solucao : '• Verifique se o item existe\n' +
               '• Verifique o nome/ID\n' +
               '• Tente atualizar a página'
    },
    'VALIDACAO' : {
      titulo : 'Dados Inválidos',
      descricao : 'Os dados fornecidos são inválidos.',
      solucao : '• Verifique o formato dos dados\n' +
               '• Confira campos obrigatórios\n' +
               '• Consulte a ajuda (F1)'
    },
    'TIMEOUT' : {
      titulo : 'Tempo Esgotado',
      descricao : 'A operação demorou muito e foi cancelada.',
      solucao : '• Tente novamente\n' +
               '• Verifique sua conexão\n' +
               '• Reduza o volume de dados'
    },
    'DUPLICADO' : {
      titulo : 'Registro Duplicado',
      descricao : 'Este registro já existe no sistema.',
      solucao : '• Verifique se já foi cadastrado\n' +
               '• Use a busca para localizar\n' +
               '• Edite o registro existente'
    },
    'DESCONHECIDO' : {
      titulo : 'Erro Inesperado',
      descricao : 'Ocorreu um erro inesperado.',
      solucao : '• Tente novamente\n' +
               '• Recarregue a página\n' +
               '• Contate o suporte se persistir'
    }
  };

  var info = mensagens[categoria] || mensagens['DESCONHECIDO'];

  mostrarDialogoPadrao({
    icone : ICONES_PADRAO.erro,
    titulo : info.titulo + ' - ' + operacao,
    conteudo : info.descricao + '\n\n' +
              '🔍 DETALHES TÉCNICOS : \n' +
              erro.message + '\n\n' +
              '💡 SOLUÇÕES POSSÍVEIS : \n' +
              info.solucao
      // acao : 'Se o problema persistir, contate o suporte técnico'
  });

  // Notificação rápida também
  Notificacoes.erro(info.titulo, 5);
}

/**
 * Executar com retry automático
 *
 * @param { string: string } nomeFuncao - Nome da função
 * @param { function: function } funcao - Função a ser executada
 * @param { number: number } maxTentativas - Máximo de tentativas (padrão : 3)
 * @return { Object: Object } { sucesso : boolean, resultado, any, tentativas : number }
 */
function executarComRetry(nomeFuncao, funcao, maxTentativas) {
  maxTentativas = maxTentativas || 3;

  for (var tentativa = 1; tentativa <= maxTentativas; tentativa++) {
    try {
      Logger.log('[TENTATIVA ' + tentativa + '/' + maxTentativas + '] ' + nomeFuncao);

      var resultado = funcao();

      Logger.log('[SUCESSO NA TENTATIVA ' + tentativa + '] ' + nomeFuncao);
      return { sucesso : true, resultado : resultado, tentativas : tentativa };

    } catch (erro) {
      Logger.log('[FALHA NA TENTATIVA ' + tentativa + '] ' + nomeFuncao + ' : ' + erro.message);

      if (tentativa < maxTentativas) {
        // Aguardar antes de tentar novamente (backoff exponencial)
        var espera = Math.pow(2, tentativa) * 1000; // 2s, 4s, 8s
        Logger.log('[AGUARDANDO] ' + (espera / 1000) + 's antes da próxima tentativa');
        Utilities.sleep(espera);
      } else {
        // Última tentativa falhou
        Logger.log('[TODAS AS TENTATIVAS FALHARAM] ' + nomeFuncao);
        throw erro;
      }
    }
  }
}


// ==
// UTILITÁRIOS AUXILIARES
// ==

// Usa getSafeUi() de Core_UI_Safe.gs

/**
 * Mostra alerta apenas se UI disponível
 */
function showAlertSafe(title, message, buttonSet) {
  var ui = getSafeUi();
  if (!ui) {
    Logger.log('[ALERT] ' + title + ' : ' + message);
    return null;
  }
}

/**
 * Mostra toast apenas se UI disponível
 */
function showToastSafe(title, message, timeout) {
  try {
    getSS().toast(message, title, timeout || 3);
  } catch (e) {
    Logger.log('[TOAST] ' + title + ' : ' + message);
  }
}

/**
 * Mostra prompt apenas se UI disponível
 */
function showPromptSafe(title, message, buttonSet) {
  var ui = getSafeUi();
  if (!ui) {
    Logger.log('[PROMPT] ' + title + ' : ' + message);
    return null;
  }
}

/**
 * Formatar data para exibição
 *
 * @param { Date: Date } data - Data a ser formatada
 * @return { string: string } Data formatada (dd/mm/aaaa)
 */
function formatarData(data) {
  try {
    if (!(data instanceof Date)) {
      data = new Date(data);
    }

    var dia = data.getDate().toString().padStart(2, '0');
    var mes = (data.getMonth() + 1).toString().padStart(2, '0');
    var ano = data.getFullYear();
    return dia + '/' + mes + '/' + ano;
  } catch (error) {
    Logger.log("Erro em formatarData: " + error.message);
    throw error;
  }
}

/**
 * Formatar valor monetário
 *
 * @param { number: number } valor - Valor a ser formatado
 * @return { string: string } Valor formatado (R$ 1.234,56)
 */
function formatarValor(valor) {
  try {
    return 'R$ ' + Number(valor).toLocaleString('pt-BR', {
      minimumFractionDigits : 2,
      maximumFractionDigits : 2
    });
  } catch (error) {
    Logger.log("Erro em formatarValor: " + error.message);
    throw error;
  }
}

// ==
// EXEMPLOS DE USO
// ==

/**
 * EXEMPLO 1 : Função simples com tratamento de erros
 */
function exemploFuncaoSimples() {
  return executarComTratamentoErros('Exemplo Simples', function() {
    // Sua lógica aqui
    return { status : 'ok' };
  });
}

/**
 * EXEMPLO 2 : Função com entrada de dados
 */
function exemploComEntradaDados() {
  return executarComTratamentoErros('Exemplo com Dados', function() {

    var numero = solicitarDadoPadrao({
      icone : ICONES_PADRAO.nota_fiscal,
      titulo : 'Número da NF',
      descricao : 'Digite o número da nota fiscal : ',
      ajuda : 'Número de 6 a 9 dígitos',
      exemplo : '123456',
      obrigatorio : true,
      validador: function(v) { return /^\d{6,9}$/.test(v); },
      mensagemErro : 'Número deve ter 6-9 dígitos'
    });

    if (!numero.sucesso) {
      throw new Error('Operação cancelada pelo usuário');
    }

  });
}

/**
 * EXEMPLO 3 : Função com progresso
 */
function exemploComProgresso() {
  return executarComTratamentoErros('Exemplo com Progresso', function() {

    var etapas = ['Validando', 'Processando', 'Salvando', 'Finalizando'];

    for (var i = 0; i < etapas.length; i++) {
      mostrarProgresso('Operação', i + 1, etapas.length, etapas[i]);
      Utilities.sleep(1000); // Simular processamento
    }

  });
}

/**
 * EXEMPLO 4 : Função com confirmação
 */
function exemploComConfirmacao() {
  return executarComTratamentoErros('Exemplo com Confirmação', function() {

    var confirmado = confirmarAcao(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir este registro ? \n\n' +
      'Esta ação NÃO pode ser desfeita.'
    );

    if (!confirmado) {
      throw new Error('Operação cancelada pelo usuário');
    }

    // Executar exclusão
  });
}


// ==
// VALIDADORES PRÉ-CONFIGURADOS (Redução de Erros)
// ==

/**
 * Biblioteca de validadores comuns para reduzir erros
 */
var Validadores = {

  /**
   * Validar número de NF (6-9 dígitos)
   */
  numeroNF: function(valor) {
    try {
      var num = String(valor).replace(/[^\d]/g, '');
      return num.length >= 6 && num.length <= 9;
    } catch (error) {
      Logger.log("Erro em numeroNF: " + error.message);
      throw error;
    }
  },

  /**
   * Validar chave de acesso NF-e (44 dígitos)
   */
  chaveAcesso: function(valor) {
    try {
      var chave = String(valor).replace(/[^\d]/g, '');
      return chave.length === 44;
    } catch (error) {
      Logger.log("Erro em chaveAcesso: " + error.message);
      throw error;
    }
  },

  /**
   * Validar CNPJ (14 dígitos)
   */
  cnpj: function(valor) {
    try {
      var cnpj = String(valor).replace(/[^\d]/g, '');
      return cnpj.length === 14;
    } catch (error) {
      Logger.log("Erro em cnpj: " + error.message);
      throw error;
    }
  },

  /**
   * Validar CPF (11 dígitos)
   */
  cpf: function(valor) {
    try {
      var cpf = String(valor).replace(/[^\d]/g, '');
      return cpf.length === 11;
    } catch (error) {
      Logger.log("Erro em cpf: " + error.message);
      throw error;
    }
  },

  /**
   * Validar email
   */
  email: function(valor) {
    try {
      var regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return regex.test(String(valor));
    } catch (error) {
      Logger.log("Erro em email: " + error.message);
      throw error;
    }
  },

  /**
   * Validar data (dd/mm/aaaa)
   */
  data: function(valor) {
    try {
      if (!/^\d{2}\/\d{2}\/\d{4}$/.test(valor)) return false;
      var partes = valor.split('/');
      var dia = parseInt(partes[0]);
      var mes = parseInt(partes[1]);
      var ano = parseInt(partes[2]);
      if (mes < 1 || mes > 12) return false;
      if (dia < 1 || dia > 31) return false;
      if (ano < 1900 || ano > 2100) return false;
      return true;
    } catch (error) {
      Logger.log("Erro em data: " + error.message);
      throw error;
    }
  },

  /**
   * Validar valor monetário
   */
  valorMonetario: function(valor) {
    try {
      var num = parseFloat(String(valor).replace(',', '.'));
      return !isNaN(num) && num > 0;
    } catch (error) {
      Logger.log("Erro em valorMonetario: " + error.message);
      throw error;
    }
  },

  /**
   * Validar telefone (10-11 dígitos)
   */
  telefone: function(valor) {
    try {
      var tel = String(valor).replace(/[^\d]/g, '');
      return tel.length === 10 || tel.length === 11;
    } catch (error) {
      Logger.log("Erro em telefone: " + error.message);
      throw error;
    }
  },

  /**
   * Validar CEP (8 dígitos)
   */
  cep: function(valor) {
    try {
      var cep = String(valor).replace(/[^\d]/g, '');
      return cep.length === 8;
    } catch (error) {
      Logger.log("Erro em cep: " + error.message);
      throw error;
    }
  },

  /**
   * Validar número inteiro positivo
   */
  inteiroPositivo: function(valor) {
    try {
      var num = parseInt(valor);
      return !isNaN(num) && num > 0;
    } catch (error) {
      Logger.log("Erro em inteiroPositivo: " + error.message);
      throw error;
    }
  },

  /**
   * Validar texto não vazio (mínimo 3 caracteres)
   */
  textoMinimo: function(valor) {
    try {
      return String(valor).trim().length >= 3;
    } catch (error) {
      Logger.log("Erro em textoMinimo: " + error.message);
      throw error;
    }
  }
};

/**
 * Sanitizadores para limpar/formatar dados
 */
var Sanitizadores = {

  /**
   * Remover espaços extras
   */
  limparEspacos: function(valor) {
    try {
      return String(valor).trim().replace(/\s+/g, ' ');
    } catch (error) {
      Logger.log("Erro em limparEspacos: " + error.message);
      throw error;
    }
  },

  /**
   * Apenas números
   */
  apenasNumeros: function(valor) {
    try {
      return String(valor).replace(/[^\d]/g, '');
    } catch (error) {
      Logger.log("Erro em apenasNumeros: " + error.message);
      throw error;
    }
  },

  /**
   * Uppercase
   */
  maiusculas: function(valor) {
    try {
      return String(valor).toUpperCase();
    } catch (error) {
      Logger.log("Erro em maiusculas: " + error.message);
      throw error;
    }
  },

  /**
   * Lowercase
   */
  minusculas: function(valor) {
    try {
      return String(valor).toLowerCase();
    } catch (error) {
      Logger.log("Erro em minusculas: " + error.message);
      throw error;
    }
  },

  /**
   * Capitalizar primeira letra
   */
  capitalizar: function(valor) {
    try {
      var str = String(valor).toLowerCase();
      return str.charAt(0).toUpperCase() + str.slice(1);
    } catch (error) {
      Logger.log("Erro em capitalizar: " + error.message);
      throw error;
    }
  },

  /**
   * Formatar CNPJ
   */
  formatarCNPJ: function(valor) {
    try {
      var cnpj = String(valor).replace(/[^\d]/g, '');
      if (cnpj.length === 14) {
        return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
      }
      return valor;
    } catch (error) {
      Logger.log("Erro em formatarCNPJ: " + error.message);
      throw error;
    }
  },

  /**
   * Formatar CPF
   */
  formatarCPF: function(valor) {
    try {
      var cpf = String(valor).replace(/[^\d]/g, '');
      if (cpf.length === 11) {
        return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
      }
      return valor;
    } catch (error) {
      Logger.log("Erro em formatarCPF: " + error.message);
      throw error;
    }
  },

  /**
   * Formatar telefone
   */
  formatarTelefone: function(valor) {
    try {
      var tel = String(valor).replace(/[^\d]/g, '');
      if (tel.length === 11) {
        return tel.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
      } else if (tel.length === 10) {
        return tel.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
      }
      return valor;
    } catch (error) {
      Logger.log("Erro em formatarTelefone: " + error.message);
      throw error;
    }
  },

  /**
   * Formatar CEP
   */
  formatarCEP: function(valor) {
    try {
      var cep = String(valor).replace(/[^\d]/g, '');
      if (cep.length === 8) {
        return cep.replace(/^(\d{5})(\d{3})$/, '$1-$2');
      }
      return valor;
    } catch (error) {
      Logger.log("Erro em formatarCEP: " + error.message);
      throw error;
    }
  }
};

/**
 * Campos pré-configurados para uso rápido
 */
var CamposPadrao = {

  /**
   * Campo de número de NF
   */
  numeroNF: function() {
    return {
      icone : ICONES_PADRAO.nota_fiscal,
      titulo : 'Número da Nota Fiscal',
      descricao : 'Digite o número da nota fiscal : ',
      ajuda : 'Número de 6 a 9 dígitos',
      exemplo : '123456',
      obrigatorio : true,
      validador : Validadores.numeroNF,
      sanitizador : Sanitizadores.apenasNumeros,
      mensagemErro : 'O número deve ter entre 6 e 9 dígitos'
    };
  },

  /**
   * Campo de chave de acesso
   */
  chaveAcesso: function() {
    return {
      icone : ICONES_PADRAO.legal,
      titulo : 'Chave de Acesso NF-e',
      descricao : 'Digite a chave de acesso da NF-e : ',
      ajuda : 'Chave de 44 dígitos',
      exemplo : '12345678901234567890123456789012345678901234',
      obrigatorio : true,
      validador : Validadores.chaveAcesso,
      sanitizador : Sanitizadores.apenasNumeros,
      mensagemErro : 'A chave deve ter exatamente 44 dígitos'
    };
  },

  /**
   * Campo de CNPJ
   */
  cnpj: function() {
    return {
      icone : ICONES_PADRAO.usuario,
      titulo : 'CNPJ',
      descricao : 'Digite o CNPJ : ',
      ajuda : '14 dígitos (com ou sem formatação)',
      exemplo : '12.345.678/0001-90',
      obrigatorio : true,
      validador : Validadores.cnpj,
      sanitizador : Sanitizadores.formatarCNPJ,
      mensagemErro : 'CNPJ deve ter 14 dígitos'
    };
  },

  /**
   * Campo de valor monetário
   */
  valorMonetario: function(titulo) {
    return {
      icone : '💰',
      titulo : titulo || 'Valor',
      descricao : 'Digite o valor : ',
      ajuda : 'Use ponto ou vírgula para decimais',
      exemplo : '1234.56',
      obrigatorio : true,
      validador : Validadores.valorMonetario,
      mensagemErro : 'Valor deve ser numérico e maior que zero'
    };
  },

  /**
   * Campo de data
   */
  data: function(titulo) {
    return {
      icone : '📅',
      titulo : titulo || 'Data',
      descricao : 'Digite a data : ',
      ajuda : 'Formato, dd/mm/aaaa',
      exemplo : '31/10/2024',
      obrigatorio : true,
      validador : Validadores.data,
      mensagemErro : 'Data inválida. Use o formato dd/mm/aaaa'
    };
  },

  /**
   * Campo de email
   */
  email: function() {
    return {
      icone : '📧',
      titulo : 'Email',
      descricao : 'Digite o email : ',
      ajuda : 'Email válido',
      exemplo : 'usuario@exemplo.com',
      obrigatorio : true,
      validador : Validadores.email,
      sanitizador : Sanitizadores.minusculas,
      mensagemErro : 'Email inválido'
    };
  },

  /**
   * Campo de telefone
   */
  telefone: function() {
    return {
      icone : '📱',
      titulo : 'Telefone',
      descricao : 'Digite o telefone : ',
      ajuda : '10 ou 11 dígitos (com ou sem formatação)',
      exemplo : '(61) 98765-4321',
      obrigatorio : true,
      validador : Validadores.telefone,
      sanitizador : Sanitizadores.formatarTelefone,
      mensagemErro : 'Telefone deve ter 10 ou 11 dígitos'
    };
  },

  /**
   * Campo de texto genérico
   */
  texto: function(titulo, descricao) {
    return {
      icone : ICONES_PADRAO.registrar,
      titulo : titulo,
      descricao : descricao,
      ajuda : 'Mínimo 3 caracteres',
      obrigatorio : true,
      validador : Validadores.textoMinimo,
      sanitizador : Sanitizadores.limparEspacos,
      mensagemErro : 'Texto deve ter no mínimo 3 caracteres'
    };
  }
};

/**
 * Função auxiliar para solicitar campo pré-configurado
 */
function solicitarCampoPadrao(tipoCampo, parametros) {
  var config = CamposPadrao[tipoCampo];

  if (!config) {
    throw new Error('Tipo de campo não encontrado : ' + tipoCampo);
  }

  var campoConfig;
  if (typeof config == 'function') {
    campoConfig = config(parametros);
  } else {
    campoConfig = config;
  }

}

// ==
// VALIDAÇÃO EM LOTE (Redução de Erros)
// ==

/**
 * Validar múltiplos campos de uma vez
 *
 * @param { Object: Object } dados - Objeto com os dados a validar
 * @param { Object: Object } regras - Objeto com as regras de validação
 * @return { Object: Object } { valido : boolean, erros, Array }
 */
function validarDadosEmLote(dados, regras) {
  try {
    var erros = [];

    for (var campo in regras) {
      var regra = regras[campo];
      var valor = dados[campo];

      // Verificar obrigatório
      if (regra.obrigatorio && (!valor || valor.toString().trim() == '')) {
        erros.push({
          campo : campo,
          mensagem : regra.mensagemObrigatorio || 'Campo "' + campo + '" é obrigatório'
        });
        continue;
      }

      // Verificar validador
      if (valor && regra.validador && !regra.validador(valor)) {
        erros.push({
          campo : campo,
          mensagem : regra.mensagemErro || 'Campo "' + campo + '" é inválido'
        });
      }
    }

    return {
      valido : erros.length == 0,
      erros : erros
    };
  } catch (error) {
    Logger.log("Erro em validarDadosEmLote: " + error.message);
    throw error;
  }
}


/**
 * Mostrar erros de validação em lote
 */
function mostrarErrosValidacao(erros) {
  try {
    if (erros.length == 0) return;

    var mensagem = '❌ ERROS DE VALIDAÇÃO : \n\n';

    erros.forEach(function(erro, index) {
      mensagem += (index + 1) + '. ' + erro.mensagem + '\n';
    });

    mensagem += '\n💡 Corrija os erros e tente novamente.';

    Dialogos.erro('Validação Falhou', mensagem);
  } catch (error) {
    Logger.log("Erro em mostrarErrosValidacao: " + error.message);
    throw error;
  }
}


// ---- InteractiveComponents.gs ----
/**
 * InteractiveComponents.gs - Componentes Interativos Avançados
 * Componentes de UI interativos para melhor experiência do usuário
 */

/**
 * DATA TABLE COMPONENT
 * Componente de tabela de dados com paginação e filtros
 */
function DataTableComponent(config) {
  try {
    this.data = config.data || [];
    this.columns = config.columns || [];
    this.pageSize = config.pageSize || 10;
    this.currentPage = 0;
    this.filters = {};
    this.sortColumn = null;
    this.sortDirection = 'asc';
  } catch (error) {
    Logger.log("Erro em DataTableComponent: " + error.message);
    throw error;
  }
}

DataTableComponent.prototype.render = function() {
  var filteredData = this.applyFilters();
  var sortedData = this.applySort(filteredData);
  var pagedData = this.applyPagination(sortedData);

  var html = '<table border="1" style="border-collapse : collapse; width, 100%;">';

  // Header
  html += '<tr style="background-color : #f0f0f0;">';
  this.columns.forEach(function(col) {
    html += '<th style="padding : 8px;">' + col.label + '</th>';
  });
  html += '</tr>';

  // Data
  pagedData.forEach(function(row) {
    html += '<tr>';
    this.columns.forEach(function(col) {
      var value = row[col.field] || '';
      if (col.formatter) {
        value = col.formatter(value, row);
      }
      html += '<td style="padding : 8px;">' + value + '</td>';
    });
    html += '</tr>';
  }, this);

  html += '</table>';

  // Pagination info
  var totalPages = Math.ceil(filteredData.length / this.pageSize);
  html += '<p>Página ' + (this.currentPage + 1) + ' de ' + totalPages + '</p>';
  html += '<p>Total de registros : ' + filteredData.length + '</p>';

};

DataTableComponent.prototype.applyFilters = function() {
  var filtered = this.data;

  for (var field in this.filters) {
    var filterValue = this.filters[field].toLowerCase();
    filtered = filtered.filter(function(row) {
      var value = String(row[field] || '').toLowerCase();
    });
  }

};

DataTableComponent.prototype.applySort = function(data) {
  if (!this.sortColumn) {
    return data;
  }

  var column = this.sortColumn;
  var direction = this.sortDirection == 'asc' ? 1 : -1;

  return data.sort(function(a, b) {
    var aVal = a[column];
    var bVal = b[column];

    if (aVal < bVal) return -1 * direction;
    if (aVal > bVal) return 1 * direction;
    return 0;
  });
};

DataTableComponent.prototype.applyPagination = function(data) {
  var start = this.currentPage * this.pageSize;
  var end = start + this.pageSize;
};

/**
 * CHART COMPONENT
 * Componente para visualização de dados em gráficos
 */
function ChartComponent(config) {
  try {
    try {
      try {
        this.type = config.type || 'bar'; // bar, line, pie
        this.data = config.data || [];
        this.title = config.title || '';
        this.xLabel = config.xLabel || '';
        this.yLabel = config.yLabel || '';
      } catch (error) {
        Logger.log("Erro em ChartComponent: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em ChartComponent: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em ChartComponent: " + error.message);
    throw error;
  }
}

ChartComponent.prototype.render = function() {
  var ss = getSS();
  var tempSheet = ss.getSheetByName('_ChartTemp');

  if (!tempSheet) {
    tempSheet = ss.insertSheet('_ChartTemp');
  } else {
    tempSheet.clear();
  }

  // Escrever dados na planilha temporária
  var range = tempSheet.getRange(1, 1, this.data.length, this.data[0].length);
  range.setValues(this.data);

  // Criar gráfico
  var chartBuilder = tempSheet.newChart();

  if (this.type == 'bar') {
    chartBuilder.asColumnChart();
  } else if (this.type == 'line') {
    chartBuilder.asLineChart();
  } else if (this.type == 'pie') {
    chartBuilder.asPieChart();
  }

  chartBuilder
    .setTitle(this.title)
    .setPosition(5, 5, 0, 0)
    .addRange(range);

  var chart = chartBuilder.build();
  tempSheet.insertChart(chart);

      // success : true,
    message : 'Gráfico criado na aba _ChartTemp'
  };

/**
 * PROGRESS BAR COMPONENT
 * Componente de barra de progresso
 */
function ProgressBarComponent(config) {
  try {
    this.total = config.total || 100;
    this.current = config.current || 0;
    this.label = config.label || 'Progresso';
    this.showPercentage = config.showPercentage != false;
  } catch (error) {
    Logger.log("Erro em ProgressBarComponent: " + error.message);
    throw error;
  }
}

ProgressBarComponent.prototype.render = function() {
  var percentage = Math.round((this.current / this.total) * 100);
  var barLength = 20;
  var filledLength = Math.round((percentage / 100) * barLength);

  var bar = '';
  for (var i = 0; i < barLength; i++) {
    bar += i < filledLength ? '█' : '░';
  }

  var display = this.label + ' : [' + bar + ']';

  if (this.showPercentage) {
    display += ' ' + percentage + '%';
  }

  display += ' (' + this.current + '/' + this.total + ')';

};

ProgressBarComponent.prototype.update = function(current) {
  this.current = current;
  var display = this.render();

  getSS().toast(
    display,
    'Progresso',
    2
  );
};

/**
 * CARD COMPONENT
 * Componente de card para exibição de informações
 */
function CardComponent(config) {
  try {
    config = config || {};
    this.title = config.title || '';
    this.content = config.content || '';
    this.icon = config.icon || '📋';
    this.color = config.color || '#1c4587';
    this.actions = config.actions || [];
  } catch (error) {
    Logger.log("Erro em CardComponent: " + error.message);
    throw error;
  }
}

CardComponent.prototype.render = function() {
  var html = '<div style="border : 2px solid ' + this.color + '; border-radius, 8px; padding : 16px; margin : 8px 0;">';

  // Header
  html += '<div style="display : flex; align-items, center; margin-bottom : 12px;">';
  html += '<span style="font-size : 24px; margin-right, 8px;">' + this.icon + '</span>';
  html += '<h3 style="margin : 0; color : ' + this.color + ';">' + this.title + '</h3>';
  html += '</div>';

  // Content
  html += '<div style="margin-bottom : 12px;">' + this.content + '</div>';

  // Actions
  if (this.actions.length > 0) {
    html += '<div style="display : flex; gap, 8px;">';
    this.actions.forEach(function(action) {
      html += '<button style="padding : 8px 16px; background, ' + this.color + '; color : white; border : none; border-radius : 4px; cursor : pointer;">';
      html += action.label;
      html += '</button>';
    }, this);
    html += '</div>';
  }

  html += '</div>';

};

/**
 * TIMELINE COMPONENT
 * Componente de linha do tempo para histórico
 */
function TimelineComponent(config) {
  try {
    this.events = config.events || [];
    this.title = config.title || 'Linha do Tempo';
  } catch (error) {
    Logger.log("Erro em TimelineComponent: " + error.message);
    throw error;
  }
}

TimelineComponent.prototype.render = function() {
  var message = '📅 ' + this.title.toUpperCase() + '\n\n';

  this.events.forEach(function(event, index) {
    var icon;
    if (event.type == 'success') {
      icon = '✅';
    } else if (event.type == 'error') {
      icon = '❌';
    } else if (event.type == 'warning') {
      icon = '⚠️';
    } else {
      icon = '📌';
    }

    message += icon + event.date + '\n';
    message += '   ' + event.title + '\n';

    if (event.description) {
      message += '   ' + event.description + '\n';
    }

    if (index < this.events.length - 1) {
      message += '   |\n';
    }

    message += '\n';
  });

};

TimelineComponent.prototype.show = function() {
  var ui = getSafeUi();
    if (!ui) {
      Logger.log("⚠️ UI não disponível");
      return;
    }
  ui.alert(this.title, this.render(), ui.ButtonSet.OK);
};

/**
 * BADGE COMPONENT
 * Componente de badge para status
 */
function BadgeComponent(config) {
  this.label = config.label || '';
  this.type = config.type || 'default'; // success, warning, error, info, default
}

BadgeComponent.prototype.render = function() {
  var icons = {
    'success' : '✅',
    'warning' : '⚠️',
    'error' : '❌',
    'info' : 'ℹ️',
    'default' : '🏷️'
  };

  var icon = icons[this.type] || icons['default'];
};

/**
 * METRIC CARD COMPONENT
 * Componente de card de métrica
 */
function MetricCardComponent(config) {
  this.value = config.value || 0;
  this.label = config.label || '';
  this.icon = config.icon || '📊';
  this.trend = config.trend || null; // 'up', 'down', null
  this.trendValue = config.trendValue || null;
}

MetricCardComponent.prototype.render = function() {
  var message = this.icon + this.label.toUpperCase() + '\n\n';
  message += '━━━━━━━━━━━━━━━━━━━━\n\n';
  message += '   ' + this.formatValue(this.value) + '\n\n';

  if (this.trend) {
    var trendIcon;
    if (this.trend == 'up') {
      trendIcon = '📈';
    } else {
      trendIcon = '📉';
    }
    var trendText;
    if (this.trend == 'up') {
      trendText = 'Aumento';
    } else {
      trendText = 'Diminuição';
    }
    message += trendIcon + trendText;

    if (this.trendValue) {
      message += ' de ' + this.trendValue;
    }

    message += '\n';
  }

};

MetricCardComponent.prototype.formatValue = function(value) {
  if (typeof value == 'number') {
    if (value > 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    } else if (value > 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
  }
};

/**
 * ALERT COMPONENT
 * Componente de alerta customizado
 */
function AlertComponent(config) {
  try {
    this.title = config.title || 'Alerta';
    this.message = config.message || '';
    this.type = config.type || 'info'; // success, warning, error, info
    this.dismissible = config.dismissible != false;
  } catch (error) {
    Logger.log("Erro em AlertComponent: " + error.message);
    throw error;
  }
}

AlertComponent.prototype.show = function() {
  var ui = getUiSafely();

  var icons = {
    'success' : '✅',
    'warning' : '⚠️',
    'error' : '❌',
    'info' : 'ℹ️'
  };

  var icon = icons[this.type] || icons['info'];
  var title = icon + ' ' + this.title;

  if (ui) {
    ui.alert(title, this.message, ui.ButtonSet.OK);
  } else {
    Logger.log('[ALERT] ' + title + ': ' + this.message);
  }
};

/**
 * STEPPER COMPONENT
 * Componente de passos para processos multi-etapa
 */
function StepperComponent(config) {
  try {
    this.steps = config.steps || [];
    this.currentStep = config.currentStep || 0;
  } catch (error) {
    Logger.log("Erro em StepperComponent: " + error.message);
    throw error;
  }
}

StepperComponent.prototype.render = function() {
  var message = '';

  this.steps.forEach(function(step, index) {
    var isActive = index == this.currentStep;
    var isCompleted = index < this.currentStep;

    var icon;
    if (isCompleted) {
      icon = '✅';
    } else {
      var icon;
      if (isActive) {
        icon = '▶️';
      } else {
        icon = '⭕';
      }
    }
    var style;
    if (isActive) {
      style = ' [ATUAL]';
    } else {
      style = '';
    }

    message += icon + (index + 1) + '. ' + step.label + style + '\n';

    if (isActive && step.description) {
      message += '   ' + step.description + '\n';
    }

    if (index < this.steps.length - 1) {
      message += '   |\n';
    }
  }, this);

};

StepperComponent.prototype.show = function() {
  var ui = getUiSafely();
  var progress = Math.round(((this.currentStep + 1) / this.steps.length) * 100);

  if (ui) {
    ui.alert('Progresso: ' + progress + '%', this.render(), ui.ButtonSet.OK);
  } else {
    Logger.log('[STEPPER] Progresso: ' + progress + '%\n' + this.render());
  }
};

/**
 * FUNÇÕES PÚBLICAS PARA DEMONSTRAÇÃO
 */

function demoDataTable() {
  var table = new DataTableComponent({
    data : [
      { nf : '12345', fornecedor : 'Fornecedor A', valor : 1000.00, status : 'Aprovado' },
      { nf : '12346', fornecedor : 'Fornecedor B', valor : 2000.00, status : 'Pendente' },
      { nf : '12347', fornecedor : 'Fornecedor C', valor : 1500.00, status : 'Aprovado' },
      { nf : '12348', fornecedor : 'Fornecedor D', valor : 3000.00, status : 'Rejeitado' }
    ],
    columns : [
      { field : 'nf', label : 'NF' },
      { field : 'fornecedor', label : 'Fornecedor' },
      {
        field : 'valor',
        label : 'Valor',
        formatter: function(value) {
          return 'R$ ' + value.toFixed(2);
        }
      },
      { field : 'status', label : 'Status' }
    ],
    pageSize : 10
  });

  var html = table.render();
  Logger.log(html);

  safeUiAlert('Data Table', 'Tabela renderizada. Veja o log.');
}

function demoProgressBar() {
  var progress = new ProgressBarComponent({
    total : 100,
    current : 0,
    label : 'Processando'
  });

  for (var i = 0; i <= 100; i += 20) {
    progress.update(i);
    Utilities.sleep(1000);
  }
}

function demoTimeline() {
  var timeline = new TimelineComponent({
    title : 'Histórico da NF 12345',
    events : [
      {
        date : '01/10/2024',
        title : 'NF Registrada',
        description : 'Nota fiscal registrada no sistema',
        type : 'success'
      },
      {
        date : '05/10/2024',
        title : 'Conferência Iniciada',
        description : 'Processo de conferência iniciado',
        type : 'info'
      },
      {
        date : '10/10/2024',
        title : 'Divergência Encontrada',
        description : 'Quantidade divergente detectada',
        type : 'warning'
      },
      {
        date : '15/10/2024',
        title : 'Divergência Resolvida',
        description : 'Fornecedor corrigiu a entrega',
        type : 'success'
      },
      {
        date : '20/10/2024',
        title : 'NF Atestada',
        description : 'Nota fiscal atestada pela comissão',
        type : 'success'
      }
    ]
  });

  timeline.show();
}

function demoMetricCard() {
  var metric = new MetricCardComponent({
    value : 1250000,
    label : 'Valor Total de NFs',
    icon : '💰',
    trend : 'up',
    trendValue : '15%'
  });

  safeUiAlert('Métrica', metric.render());
}

function demoStepper() {
  var stepper = new StepperComponent({
    steps : [
      { label : 'Registro da NF', description : 'Registrar dados da nota fiscal' },
      { label : 'Conferência', description : 'Conferir produtos entregues' },
      { label : 'Validação', description : 'Validar conformidade legal' },
      { label : 'Atestação', description : 'Atestar recebimento' },
      { label : 'Finalização', description : 'Finalizar processo' }
    ]
      // currentStep : 2
  });

  stepper.show();
}

function demoAlert() {
  var alert = new AlertComponent({
    title : 'Atenção Necessária',
    message : 'Existem 3 notas fiscais pendentes de conferência.\n\n' +
             'Por favor, realize a conferência o mais breve possível.'
      // type : 'warning'
  });

  alert.show();
}

