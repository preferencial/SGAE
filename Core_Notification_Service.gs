/**
 * @fileoverview Sistema de Notificações - Alimentação Escolar CRE-PP
 * @version 1.0.0
 * 
 * Intervenção 9/38: NotificationService conforme Prompt 9
 * 
 * Serviço de notificações para:
 * - E-mails para fornecedores sobre pagamentos liberados
 * - Alertas para nutricionistas sobre cardápios pendentes
 * - Notificações internas no sistema
 * - Lembretes de vencimento de certidões
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-25
 */

'use strict';

// ============================================================================
// NOTIFICATION SERVICE - Serviço de Notificações
// ============================================================================

var NotificationService = (function() {
  
  // =========================================================================
  // CONFIGURAÇÃO
  // =========================================================================
  
  var CONFIG = {
    // Aba para notificações internas
    NOTIFICATIONS_SHEET: 'Notificacoes',
    
    // Remetente padrão
    SENDER_NAME: 'Sistema AE - CRE-PP',
    
    // Limites diários (quota GAS)
    MAX_EMAILS_DIA: 100,
    MAX_NOTIFICACOES_BATCH: 50,
    
    // Prioridades
    PRIORIDADE: {
      URGENTE: 1,
      ALTA: 2,
      NORMAL: 3,
      BAIXA: 4
    },
    
    // Tipos de notificação
    TIPOS: {
      PAGAMENTO_LIBERADO: 'PAGAMENTO_LIBERADO',
      CARDAPIO_PENDENTE: 'CARDAPIO_PENDENTE',
      CERTIDAO_VENCENDO: 'CERTIDAO_VENCENDO',
      ENTREGA_AGENDADA: 'ENTREGA_AGENDADA',
      NF_ATESTADA: 'NF_ATESTADA',
      GLOSA_APLICADA: 'GLOSA_APLICADA',
      RECUSA_REGISTRADA: 'RECUSA_REGISTRADA',
      ALERTA_ESTOQUE: 'ALERTA_ESTOQUE',
      SISTEMA: 'SISTEMA'
    },

    // Status
    STATUS: {
      PENDENTE: 'PENDENTE',
      ENVIADA: 'ENVIADA',
      LIDA: 'LIDA',
      ERRO: 'ERRO',
      CANCELADA: 'CANCELADA'
    },
    
    // Canais
    CANAIS: {
      EMAIL: 'EMAIL',
      INTERNO: 'INTERNO',
      AMBOS: 'AMBOS'
    },
    
    // Cores por tipo (para UI)
    CORES: {
      PAGAMENTO_LIBERADO: '#2E7D32',   // Verde
      CARDAPIO_PENDENTE: '#EF6C00',    // Laranja
      CERTIDAO_VENCENDO: '#D32F2F',    // Vermelho
      ENTREGA_AGENDADA: '#1976D2',     // Azul
      NF_ATESTADA: '#2E7D32',          // Verde
      GLOSA_APLICADA: '#F57C00',       // Laranja escuro
      RECUSA_REGISTRADA: '#D32F2F',    // Vermelho
      ALERTA_ESTOQUE: '#FFA000',       // Âmbar
      SISTEMA: '#757575'               // Cinza
    },
    
    // Ícones Material Symbols
    ICONES: {
      PAGAMENTO_LIBERADO: 'payments',
      CARDAPIO_PENDENTE: 'restaurant_menu',
      CERTIDAO_VENCENDO: 'warning',
      ENTREGA_AGENDADA: 'local_shipping',
      NF_ATESTADA: 'task_alt',
      GLOSA_APLICADA: 'money_off',
      RECUSA_REGISTRADA: 'cancel',
      ALERTA_ESTOQUE: 'inventory_2',
      SISTEMA: 'info'
    }
  };
  
  // =========================================================================
  // TEMPLATES DE E-MAIL
  // =========================================================================
  
  var TEMPLATES = {
    
    PAGAMENTO_LIBERADO: {
      assunto: '[CRE-PP] Pagamento Liberado - NF {{numero_nf}}',
      corpo: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #2E7D32; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">💰 Pagamento Liberado</h1>
          </div>
          <div style="padding: 20px; background: #f5f5f5;">
            <p>Prezado(a) <strong>{{fornecedor}}</strong>,</p>
            <p>Informamos que o pagamento referente à Nota Fiscal abaixo foi liberado:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr style="background: #e8f5e9;">
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Nota Fiscal:</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">{{numero_nf}}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Valor:</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">{{valor}}</td>
              </tr>
              <tr style="background: #e8f5e9;">
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Data Liberação:</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">{{data_liberacao}}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Empenho:</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">{{empenho}}</td>
              </tr>
            </table>
            <p>O crédito será efetuado em até 5 dias úteis.</p>
          </div>
          <div style="background: #2E7D32; color: white; padding: 10px; text-align: center; font-size: 12px;">
            Sistema de Alimentação Escolar - CRE Plano Piloto
          </div>
        </div>
      `
    },

    CARDAPIO_PENDENTE: {
      assunto: '[CRE-PP] Cardápio Pendente de Aprovação - {{periodo}}',
      corpo: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #EF6C00; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">🍽️ Cardápio Aguardando Aprovação</h1>
          </div>
          <div style="padding: 20px; background: #f5f5f5;">
            <p>Prezado(a) <strong>{{nutricionista}}</strong>,</p>
            <p>Há cardápios aguardando sua análise e aprovação:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr style="background: #fff3e0;">
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Período:</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">{{periodo}}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Escolas:</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">{{escolas}}</td>
              </tr>
              <tr style="background: #fff3e0;">
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Elaborado por:</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">{{elaborador}}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Data Limite:</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">{{data_limite}}</td>
              </tr>
            </table>
            <p style="text-align: center;">
              <a href="{{link_sistema}}" style="background: #EF6C00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Acessar Sistema
              </a>
            </p>
          </div>
          <div style="background: #EF6C00; color: white; padding: 10px; text-align: center; font-size: 12px;">
            Sistema de Alimentação Escolar - CRE Plano Piloto
          </div>
        </div>
      `
    },
    
    CERTIDAO_VENCENDO: {
      assunto: '[CRE-PP] ⚠️ URGENTE: Certidão Vencendo - {{fornecedor}}',
      corpo: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #D32F2F; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">⚠️ Certidão Próxima do Vencimento</h1>
          </div>
          <div style="padding: 20px; background: #f5f5f5;">
            <p>Prezado(a) <strong>{{fornecedor}}</strong>,</p>
            <p style="color: #D32F2F; font-weight: bold;">
              Sua certidão está próxima do vencimento. Providencie a renovação para evitar bloqueio de novos empenhos.
            </p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr style="background: #ffebee;">
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Tipo Certidão:</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">{{tipo_certidao}}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Vencimento:</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd; color: #D32F2F; font-weight: bold;">{{data_vencimento}}</td>
              </tr>
              <tr style="background: #ffebee;">
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Dias Restantes:</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">{{dias_restantes}} dias</td>
              </tr>
            </table>
            <p>Após o vencimento, novos empenhos serão automaticamente bloqueados até a regularização.</p>
          </div>
          <div style="background: #D32F2F; color: white; padding: 10px; text-align: center; font-size: 12px;">
            Sistema de Alimentação Escolar - CRE Plano Piloto
          </div>
        </div>
      `
    },

    ENTREGA_AGENDADA: {
      assunto: '[CRE-PP] Entrega Agendada - {{data_entrega}}',
      corpo: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1976D2; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">🚚 Entrega Agendada</h1>
          </div>
          <div style="padding: 20px; background: #f5f5f5;">
            <p>Prezado(a) responsável,</p>
            <p>Uma entrega foi agendada para sua unidade escolar:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr style="background: #e3f2fd;">
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Data:</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">{{data_entrega}}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Fornecedor:</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">{{fornecedor}}</td>
              </tr>
              <tr style="background: #e3f2fd;">
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Itens:</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">{{itens}}</td>
              </tr>
            </table>
            <p>Prepare-se para conferir a entrega utilizando o checklist do sistema.</p>
          </div>
          <div style="background: #1976D2; color: white; padding: 10px; text-align: center; font-size: 12px;">
            Sistema de Alimentação Escolar - CRE Plano Piloto
          </div>
        </div>
      `
    },
    
    GENERICO: {
      assunto: '[CRE-PP] {{titulo}}',
      corpo: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #757575; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">{{titulo}}</h1>
          </div>
          <div style="padding: 20px; background: #f5f5f5;">
            {{conteudo}}
          </div>
          <div style="background: #757575; color: white; padding: 10px; text-align: center; font-size: 12px;">
            Sistema de Alimentação Escolar - CRE Plano Piloto
          </div>
        </div>
      `
    }
  };

  // =========================================================================
  // FUNÇÕES PRIVADAS
  // =========================================================================
  
  /**
   * Obtém ou cria aba de notificações
   * @private
   */
  function _getNotificationsSheet() {
    try {
      try {
        var ss = getSS();
        if (!ss) return null;
      
        var sheet = ss.getSheetByName(CONFIG.NOTIFICATIONS_SHEET);
      
        if (!sheet) {
          sheet = ss.insertSheet(CONFIG.NOTIFICATIONS_SHEET);
        
          var headers = [
            'ID', 'Tipo', 'Titulo', 'Mensagem', 'Destinatario_Email',
            'Destinatario_Nome', 'Canal', 'Prioridade', 'Status',
            'Data_Criacao', 'Data_Envio', 'Data_Leitura', 'Erro',
            'Dados_Extras', 'Criado_Por'
          ];
        
          sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
          sheet.getRange(1, 1, 1, headers.length)
            .setBackground('#2E7D32')
            .setFontColor('white')
            .setFontWeight('bold');
        
          sheet.setFrozenRows(1);
          sheet.setTabColor('#2E7D32');
        }
      
        return sheet;
      } catch (e) {
        console.error('Erro ao obter sheet de notificações: ' + e.message);
        return null;
      }
    } catch (error) {
      Logger.log("Erro em _getNotificationsSheet: " + error.message);
      throw error;
    }
  }
  
  /**
   * Substitui placeholders no template
   * @private
   */
  function _processTemplate(template, dados) {
    try {
      var resultado = template;
    
      for (var chave in dados) {
        var placeholder = '{{' + chave + '}}';
        resultado = resultado.split(placeholder).join(dados[chave] || '');
      }
    
      return resultado;
    } catch (error) {
      Logger.log("Erro em _processTemplate: " + error.message);
      throw error;
    }
  }
  
  /**
   * Verifica quota de e-mails disponível
   * @private
   */
  function _checkEmailQuota() {
    try {
      var remaining = MailApp.getRemainingDailyQuota();
      return remaining > 0;
    } catch (e) {
      return false;
    }
  }
  
  /**
   * Obtém usuário atual
   * @private
   */
  function _getCurrentUser() {
    try {
      try {
        try {
          return Session.getActiveUser().getEmail() || 'sistema';
        } catch (e) {
          return 'sistema';
        }
      } catch (error) {
        Logger.log("Erro em _getCurrentUser: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em _getCurrentUser: " + error.message);
      throw error;
    }
  }

  // =========================================================================
  // API PÚBLICA
  // =========================================================================
  
  return {
    CONFIG: CONFIG,
    TEMPLATES: TEMPLATES,
    
    // -----------------------------------------------------------------------
    // CRIAÇÃO DE NOTIFICAÇÕES
    // -----------------------------------------------------------------------
    
    /**
     * Cria uma notificação
     * @param {Object} params - Parâmetros da notificação
     * @returns {Object} Resultado
     */
    criar: function(params) {
      try {
        try {
          var sheet = _getNotificationsSheet();
          if (!sheet) {
            return { success: false, error: 'Não foi possível acessar planilha de notificações' };
          }
        
          var id = Utilities.getUuid();
          var now = new Date();
        
          var notificacao = [
            id,
            params.tipo || CONFIG.TIPOS.SISTEMA,
            params.titulo || 'Notificação',
            params.mensagem || '',
            params.email || '',
            params.nome || '',
            params.canal || CONFIG.CANAIS.INTERNO,
            params.prioridade || CONFIG.PRIORIDADE.NORMAL,
            CONFIG.STATUS.PENDENTE,
            now,
            '',  // Data envio
            '',  // Data leitura
            '',  // Erro
            JSON.stringify(params.dados || {}),
            _getCurrentUser()
          ];
        
          sheet.appendRow(notificacao);
        
          // Se canal inclui e-mail, tenta enviar imediatamente
          if (params.canal === CONFIG.CANAIS.EMAIL || params.canal === CONFIG.CANAIS.AMBOS) {
            if (params.email) {
              this.enviarEmail(id);
            }
          }
        
          return {
            success: true,
            id: id,
            message: 'Notificação criada com sucesso'
          };
        
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em criar: " + error.message);
        throw error;
      }
    },
    
    // -----------------------------------------------------------------------
    // NOTIFICAÇÕES ESPECÍFICAS
    // -----------------------------------------------------------------------
    
    /**
     * Notifica fornecedor sobre pagamento liberado
     */
    notificarPagamentoLiberado: function(dados) {
      var template = TEMPLATES.PAGAMENTO_LIBERADO;
      
      return this.criar({
        tipo: CONFIG.TIPOS.PAGAMENTO_LIBERADO,
        titulo: _processTemplate(template.assunto, dados),
        mensagem: _processTemplate(template.corpo, dados),
        email: dados.email_fornecedor,
        nome: dados.fornecedor,
        canal: CONFIG.CANAIS.AMBOS,
        prioridade: CONFIG.PRIORIDADE.ALTA,
        dados: dados
      });
    },
    
    /**
     * Notifica nutricionista sobre cardápio pendente
     */
    notificarCardapioPendente: function(dados) {
      try {
        var template = TEMPLATES.CARDAPIO_PENDENTE;
      
        // Adiciona link do sistema
        dados.link_sistema = dados.link_sistema || ScriptApp.getService().getUrl();
      
        return this.criar({
          tipo: CONFIG.TIPOS.CARDAPIO_PENDENTE,
          titulo: _processTemplate(template.assunto, dados),
          mensagem: _processTemplate(template.corpo, dados),
          email: dados.email_nutricionista,
          nome: dados.nutricionista,
          canal: CONFIG.CANAIS.AMBOS,
          prioridade: CONFIG.PRIORIDADE.ALTA,
          dados: dados
        });
      } catch (error) {
        Logger.log("Erro em notificarCardapioPendente: " + error.message);
        throw error;
      }
    },
    
    /**
     * Notifica fornecedor sobre certidão vencendo
     */
    notificarCertidaoVencendo: function(dados) {
      var template = TEMPLATES.CERTIDAO_VENCENDO;
      
      return this.criar({
        tipo: CONFIG.TIPOS.CERTIDAO_VENCENDO,
        titulo: _processTemplate(template.assunto, dados),
        mensagem: _processTemplate(template.corpo, dados),
        email: dados.email_fornecedor,
        nome: dados.fornecedor,
        canal: CONFIG.CANAIS.AMBOS,
        prioridade: CONFIG.PRIORIDADE.URGENTE,
        dados: dados
      });
    },
    
    /**
     * Notifica escola sobre entrega agendada
     */
    notificarEntregaAgendada: function(dados) {
      var template = TEMPLATES.ENTREGA_AGENDADA;
      
      return this.criar({
        tipo: CONFIG.TIPOS.ENTREGA_AGENDADA,
        titulo: _processTemplate(template.assunto, dados),
        mensagem: _processTemplate(template.corpo, dados),
        email: dados.email_escola,
        nome: dados.escola,
        canal: CONFIG.CANAIS.AMBOS,
        prioridade: CONFIG.PRIORIDADE.NORMAL,
        dados: dados
      });
    },

    // -----------------------------------------------------------------------
    // ENVIO DE E-MAIL
    // -----------------------------------------------------------------------
    
    /**
     * Envia e-mail de uma notificação
     * @param {string} notificacaoId - ID da notificação
     * @returns {Object} Resultado
     */
    enviarEmail: function(notificacaoId) {
      try {
        if (!_checkEmailQuota()) {
          return { success: false, error: 'Quota de e-mails esgotada' };
        }
        
        var sheet = _getNotificationsSheet();
        if (!sheet) return { success: false, error: 'Sheet não encontrada' };
        
        var data = sheet.getDataRange().getValues();
        var headers = data[0];
        var idCol = headers.indexOf('ID');
        var emailCol = headers.indexOf('Destinatario_Email');
        var tituloCol = headers.indexOf('Titulo');
        var mensagemCol = headers.indexOf('Mensagem');
        var statusCol = headers.indexOf('Status');
        var dataEnvioCol = headers.indexOf('Data_Envio');
        var erroCol = headers.indexOf('Erro');
        
        for (var i = 1; i < data.length; i++) {
          if (data[i][idCol] === notificacaoId) {
            var email = data[i][emailCol];
            var titulo = data[i][tituloCol];
            var mensagem = data[i][mensagemCol];
            
            if (!email) {
              sheet.getRange(i + 1, erroCol + 1).setValue('E-mail não informado');
              return { success: false, error: 'E-mail não informado' };
            }
            
            try {
              MailApp.sendEmail({
                to: email,
                subject: titulo,
                htmlBody: mensagem,
                name: CONFIG.SENDER_NAME
              });
              
              sheet.getRange(i + 1, statusCol + 1).setValue(CONFIG.STATUS.ENVIADA);
              sheet.getRange(i + 1, dataEnvioCol + 1).setValue(new Date());
              
              return { success: true, message: 'E-mail enviado com sucesso' };
              
            } catch (e) {
              sheet.getRange(i + 1, statusCol + 1).setValue(CONFIG.STATUS.ERRO);
              sheet.getRange(i + 1, erroCol + 1).setValue(e.message);
              return { success: false, error: e.message };
            }
          }
        }
        
        return { success: false, error: 'Notificação não encontrada' };
        
      } catch (e) {
        return { success: false, error: e.message };
      }
    },
    
    /**
     * Processa fila de e-mails pendentes
     * @param {number} [limite] - Limite de e-mails a processar
     * @returns {Object} Resultado
     */
    processarFilaEmails: function(limite) {
      try {
        limite = limite || CONFIG.MAX_NOTIFICACOES_BATCH;
      
        var resultado = {
          processados: 0,
          enviados: 0,
          erros: 0,
          detalhes: []
        };
      
        try {
          var sheet = _getNotificationsSheet();
          if (!sheet) return { success: false, error: 'Sheet não encontrada' };
        
          var data = sheet.getDataRange().getValues();
          var headers = data[0];
          var idCol = headers.indexOf('ID');
          var canalCol = headers.indexOf('Canal');
          var statusCol = headers.indexOf('Status');
        
          for (var i = 1; i < data.length && resultado.processados < limite; i++) {
            var canal = data[i][canalCol];
            var status = data[i][statusCol];
          
            if ((canal === CONFIG.CANAIS.EMAIL || canal === CONFIG.CANAIS.AMBOS) && 
                status === CONFIG.STATUS.PENDENTE) {
            
              resultado.processados++;
              var envioResult = this.enviarEmail(data[i][idCol]);
            
              if (envioResult.success) {
                resultado.enviados++;
              } else {
                resultado.erros++;
              }
            
              resultado.detalhes.push({
                id: data[i][idCol],
                sucesso: envioResult.success,
                erro: envioResult.error
              });
            }
          }
        
          resultado.success = true;
          resultado.message = 'Processados: ' + resultado.processados + ', Enviados: ' + resultado.enviados;
        
        } catch (e) {
          resultado.success = false;
          resultado.error = e.message;
        }
      
        return resultado;
      } catch (error) {
        Logger.log("Erro em processarFilaEmails: " + error.message);
        throw error;
      }
    },

    // -----------------------------------------------------------------------
    // CONSULTA DE NOTIFICAÇÕES
    // -----------------------------------------------------------------------
    
    /**
     * Obtém notificações de um usuário
     * @param {string} email - E-mail do usuário
     * @param {Object} [filtros] - Filtros { status, tipo, limite }
     * @returns {Object} Resultado com notificações
     */
    obterPorUsuario: function(email, filtros) {
      try {
        filtros = filtros || {};
      
        try {
          var sheet = _getNotificationsSheet();
          if (!sheet || sheet.getLastRow() <= 1) {
            return { success: true, notificacoes: [], count: 0 };
          }
        
          var data = sheet.getDataRange().getValues();
          var headers = data[0];
          var notificacoes = [];
        
          for (var i = 1; i < data.length; i++) {
            var row = {};
            headers.forEach(function(h, idx) {
              row[h] = data[i][idx];
            });
            row._rowIndex = i + 1;
          
            // Filtra por e-mail
            if (row.Destinatario_Email !== email) continue;
          
            // Aplica filtros
            if (filtros.status && row.Status !== filtros.status) continue;
            if (filtros.tipo && row.Tipo !== filtros.tipo) continue;
          
            // Adiciona metadados visuais
            row.cor = CONFIG.CORES[row.Tipo] || CONFIG.CORES.SISTEMA;
            row.icone = CONFIG.ICONES[row.Tipo] || CONFIG.ICONES.SISTEMA;
          
            notificacoes.push(row);
          }
        
          // Ordena por prioridade e data
          notificacoes.sort(function(a, b) {
            if (a.Prioridade !== b.Prioridade) {
              return a.Prioridade - b.Prioridade;
            }
            return new Date(b.Data_Criacao) - new Date(a.Data_Criacao);
          });
        
          // Aplica limite
          if (filtros.limite && notificacoes.length > filtros.limite) {
            notificacoes = notificacoes.slice(0, filtros.limite);
          }
        
          return {
            success: true,
            notificacoes: notificacoes,
            count: notificacoes.length,
            naoLidas: notificacoes.filter(function(n) { 
              return n.Status !== CONFIG.STATUS.LIDA; 
            }).length
          };
        
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em obterPorUsuario: " + error.message);
        throw error;
      }
    },
    
    /**
     * Marca notificação como lida
     * @param {string} notificacaoId - ID da notificação
     * @returns {Object} Resultado
     */
    marcarComoLida: function(notificacaoId) {
      try {
        try {
          var sheet = _getNotificationsSheet();
          if (!sheet) return { success: false, error: 'Sheet não encontrada' };
        
          var data = sheet.getDataRange().getValues();
          var headers = data[0];
          var idCol = headers.indexOf('ID');
          var statusCol = headers.indexOf('Status');
          var dataLeituraCol = headers.indexOf('Data_Leitura');
        
          for (var i = 1; i < data.length; i++) {
            if (data[i][idCol] === notificacaoId) {
              sheet.getRange(i + 1, statusCol + 1).setValue(CONFIG.STATUS.LIDA);
              sheet.getRange(i + 1, dataLeituraCol + 1).setValue(new Date());
              return { success: true, message: 'Notificação marcada como lida' };
            }
          }
        
          return { success: false, error: 'Notificação não encontrada' };
        
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em marcarComoLida: " + error.message);
        throw error;
      }
    },
    
    /**
     * Marca todas as notificações de um usuário como lidas
     * @param {string} email - E-mail do usuário
     * @returns {Object} Resultado
     */
    marcarTodasComoLidas: function(email) {
      try {
        try {
          var sheet = _getNotificationsSheet();
          if (!sheet) return { success: false, error: 'Sheet não encontrada' };
        
          var data = sheet.getDataRange().getValues();
          var headers = data[0];
          var emailCol = headers.indexOf('Destinatario_Email');
          var statusCol = headers.indexOf('Status');
          var dataLeituraCol = headers.indexOf('Data_Leitura');
          var now = new Date();
          var count = 0;
        
          for (var i = 1; i < data.length; i++) {
            if (data[i][emailCol] === email && data[i][statusCol] !== CONFIG.STATUS.LIDA) {
              sheet.getRange(i + 1, statusCol + 1).setValue(CONFIG.STATUS.LIDA);
              sheet.getRange(i + 1, dataLeituraCol + 1).setValue(now);
              count++;
            }
          }
        
          return { success: true, marcadas: count };
        
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em marcarTodasComoLidas: " + error.message);
        throw error;
      }
    },

    // -----------------------------------------------------------------------
    // VERIFICAÇÕES AUTOMÁTICAS
    // -----------------------------------------------------------------------
    
    /**
     * Verifica certidões próximas do vencimento e notifica
     * @param {number} [diasAntecedencia=15] - Dias de antecedência para alertar
     * @returns {Object} Resultado
     */
    verificarCertidoesVencendo: function(diasAntecedencia) {
      try {
        diasAntecedencia = diasAntecedencia || 15;
        var resultado = { notificados: 0, fornecedores: [] };
      
        try {
          var ss = getSS();
          var sheetFornecedores = ss.getSheetByName('Fornecedores');
        
          if (!sheetFornecedores || sheetFornecedores.getLastRow() <= 1) {
            return { success: true, notificados: 0, message: 'Nenhum fornecedor cadastrado' };
          }
        
          var data = sheetFornecedores.getDataRange().getValues();
          var headers = data[0];
          var hoje = new Date();
          var limite = new Date();
          limite.setDate(limite.getDate() + diasAntecedencia);
        
          // Campos de certidões a verificar
          var camposCertidao = [
            { campo: 'CND_Federal_Validade', tipo: 'CND Federal' },
            { campo: 'CND_Estadual_Validade', tipo: 'CND Estadual' },
            { campo: 'CND_Municipal_Validade', tipo: 'CND Municipal' },
            { campo: 'FGTS_Validade', tipo: 'CRF FGTS' },
            { campo: 'CNDT_Validade', tipo: 'CNDT Trabalhista' }
          ];
        
          for (var i = 1; i < data.length; i++) {
            var row = {};
            headers.forEach(function(h, idx) { row[h] = data[i][idx]; });
          
            camposCertidao.forEach(function(cert) {
              var colIdx = headers.indexOf(cert.campo);
              if (colIdx === -1) return;
            
              var validade = data[i][colIdx];
              if (!validade) return;
            
              var dataValidade = new Date(validade);
              if (dataValidade > hoje && dataValidade <= limite) {
                var diasRestantes = Math.ceil((dataValidade - hoje) / (1000 * 60 * 60 * 24));
              
                this.notificarCertidaoVencendo({
                  fornecedor: row.Razao_Social || row.Nome,
                  email_fornecedor: row.Email,
                  tipo_certidao: cert.tipo,
                  data_vencimento: dataValidade.toLocaleDateString('pt-BR'),
                  dias_restantes: diasRestantes
                });
              
                resultado.notificados++;
                resultado.fornecedores.push({
                  fornecedor: row.Razao_Social || row.Nome,
                  certidao: cert.tipo,
                  vencimento: dataValidade
                });
              }
            }.bind(this));
          }
        
          resultado.success = true;
          return resultado;
        
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em verificarCertidoesVencendo: " + error.message);
        throw error;
      }
    },
    
    /**
     * Verifica cardápios pendentes de aprovação e notifica
     * @returns {Object} Resultado
     */
    verificarCardapiosPendentes: function() {
      try {
        var resultado = { notificados: 0, cardapios: [] };
      
        try {
          var ss = getSS();
          var sheetCardapios = ss.getSheetByName('Cardapios_Semanais');
        
          if (!sheetCardapios || sheetCardapios.getLastRow() <= 1) {
            return { success: true, notificados: 0 };
          }
        
          var data = sheetCardapios.getDataRange().getValues();
          var headers = data[0];
          var statusCol = headers.indexOf('Status');
        
          var pendentes = [];
          for (var i = 1; i < data.length; i++) {
            if (data[i][statusCol] === 'PENDENTE_APROVACAO') {
              var row = {};
              headers.forEach(function(h, idx) { row[h] = data[i][idx]; });
              pendentes.push(row);
            }
          }
        
          if (pendentes.length > 0) {
            // Agrupa por nutricionista responsável
            var porNutricionista = {};
            pendentes.forEach(function(c) {
              var nutri = c.Nutricionista_Responsavel || 'nutricionista@crepp.edu.br';
              if (!porNutricionista[nutri]) porNutricionista[nutri] = [];
              porNutricionista[nutri].push(c);
            });
          
            for (var email in porNutricionista) {
              var cardapios = porNutricionista[email];
              this.notificarCardapioPendente({
                nutricionista: email.split('@')[0],
                email_nutricionista: email,
                periodo: cardapios.map(function(c) { return c.Periodo || c.Semana; }).join(', '),
                escolas: cardapios.length + ' cardápio(s)',
                elaborador: cardapios[0].Elaborado_Por || 'Sistema',
                data_limite: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')
              });
              resultado.notificados++;
            }
          }
        
          resultado.success = true;
          resultado.cardapios = pendentes;
          return resultado;
        
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em verificarCardapiosPendentes: " + error.message);
        throw error;
      }
    },
    
    /**
     * Obtém contagem de notificações não lidas
     * @param {string} email - E-mail do usuário
     * @returns {Object} Contagem
     */
    contarNaoLidas: function(email) {
      var result = this.obterPorUsuario(email, { status: CONFIG.STATUS.PENDENTE });
      return {
        success: true,
        count: result.naoLidas || 0
      };
    }
  };
})();


// ============================================================================
// FUNÇÕES GLOBAIS DE API
// ============================================================================

/**
 * API: Cria notificação
 */
function api_notificacao_criar(params) {
  return NotificationService.criar(params);
}

/**
 * API: Notifica pagamento liberado
 */
function api_notificar_pagamento(dados) {
  return NotificationService.notificarPagamentoLiberado(dados);
}

/**
 * API: Notifica cardápio pendente
 */
function api_notificar_cardapio_pendente(dados) {
  return NotificationService.notificarCardapioPendente(dados);
}

/**
 * API: Notifica certidão vencendo
 */
function api_notificar_certidao(dados) {
  return NotificationService.notificarCertidaoVencendo(dados);
}

/**
 * API: Notifica entrega agendada
 */
function api_notificar_entrega(dados) {
  return NotificationService.notificarEntregaAgendada(dados);
}

/**
 * API: Obtém notificações do usuário
 */
function api_notificacoes_usuario(email, filtros) {
  return NotificationService.obterPorUsuario(email, filtros);
}

/**
 * API: Marca notificação como lida
 */
function api_notificacao_lida(notificacaoId) {
  return NotificationService.marcarComoLida(notificacaoId);
}

/**
 * API: Marca todas como lidas
 */
function api_notificacoes_todas_lidas(email) {
  return NotificationService.marcarTodasComoLidas(email);
}

/**
 * API: Conta não lidas
 */
function api_notificacoes_nao_lidas(email) {
  return NotificationService.contarNaoLidas(email);
}

/**
 * API: Processa fila de e-mails
 */
function api_processar_emails() {
  return NotificationService.processarFilaEmails();
}

// ============================================================================
// TRIGGERS AUTOMÁTICOS
// ============================================================================

/**
 * Trigger diário: Verifica certidões vencendo
 */
function triggerVerificarCertidoes() {
  try {
    var result = NotificationService.verificarCertidoesVencendo(15);
    Logger.log('Verificação de certidões: ' + JSON.stringify(result));
    return result;
  } catch (error) {
    Logger.log("Erro em triggerVerificarCertidoes: " + error.message);
    throw error;
  }
}

/**
 * Trigger diário: Verifica cardápios pendentes
 */
function triggerVerificarCardapios() {
  try {
    var result = NotificationService.verificarCardapiosPendentes();
    Logger.log('Verificação de cardápios: ' + JSON.stringify(result));
    return result;
  } catch (error) {
    Logger.log("Erro em triggerVerificarCardapios: " + error.message);
    throw error;
  }
}

/**
 * Trigger horário: Processa fila de e-mails
 */
function triggerProcessarEmails() {
  try {
    try {
      var result = NotificationService.processarFilaEmails(20);
      Logger.log('Processamento de e-mails: ' + JSON.stringify(result));
      return result;
    } catch (error) {
      Logger.log("Erro em triggerProcessarEmails: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em triggerProcessarEmails: " + error.message);
    throw error;
  }
}

// ============================================================================
// REGISTRO DO MÓDULO
// ============================================================================

Logger.log('✅ Core_Notification_Service.gs carregado - NotificationService disponível');
