/**
 * @fileoverview Backend Services - Serviços Integrados do Sistema
 * @version 1.0.0
 * @author UNIAE CRE Team
 * @created 2025-12-18
 * 
 * @description
 * Módulo central de backend que explora todos os serviços avançados
 * configurados no appsscript.json:
 * - Drive API v3 (gestão de arquivos)
 * - Sheets API v4 (operações avançadas)
 * - Gmail (envio de emails)
 * - Calendar (agendamentos)
 * - Documents (geração de relatórios)
 * - Forms (formulários dinâmicos)
 * - External Requests (APIs externas)
 * 
 * @requires appsscript.json com Advanced Services habilitados
 */

'use strict';

// ============================================================================
// CONFIGURAÇÃO DO BACKEND
// ============================================================================

/**
 * Configuração dos serviços de backend
 * @constant {Object}
 */
var BACKEND_CONFIG = {
  /** ID da pasta raiz no Drive */
  ROOT_FOLDER_ID: null,
  
  /** Prefixo para arquivos gerados */
  FILE_PREFIX: 'UNIAE_CRE_',
  
  /** Email do sistema */
  SYSTEM_EMAIL: PropertiesService.getScriptProperties().getProperty('SYSTEM_EMAIL') || '',
  
  /** Timeout para requisições externas (ms) */
  FETCH_TIMEOUT: 30000,
  
  /** Máximo de tentativas para operações */
  MAX_RETRIES: 3
};

// ============================================================================
// MÓDULO DE SERVIÇOS DE BACKEND
// ============================================================================

/**
 * Serviços de Backend Integrados
 * @namespace BackendServices
 */
var BackendServices = (function() {
  
  // --------------------------------------------------------------------------
  // DRIVE SERVICE - Gestão de Arquivos
  // --------------------------------------------------------------------------
  
  var DriveService = {
    
    /**
     * Obtém ou cria pasta do sistema
     * @param {string} folderName - Nome da pasta
     * @param {string} [parentId] - ID da pasta pai
     * @returns {string} ID da pasta
     */
    getOrCreateFolder: function(folderName, parentId) {
      try {
        var query = "name = '" + folderName + "' and mimeType = 'application/vnd.google-apps.folder' and trashed = false";
        if (parentId) {
          query += " and '" + parentId + "' in parents";
        }
        
        var response = Drive.Files.list({
          q: query,
          fields: 'files(id, name)',
          pageSize: 1
        });
        
        if (response.files && response.files.length > 0) {
          return response.files[0].id;
        }
        
        // Cria pasta
        var metadata = {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder'
        };
        
        if (parentId) {
          metadata.parents = [parentId];
        }
        
        var folder = Drive.Files.create(metadata);
        return folder.id;
        
      } catch (e) {
        AppLogger.error('Erro ao obter/criar pasta', e);
        return null;
      }
    },
    
    /**
     * Faz upload de arquivo para o Drive
     * @param {Blob} blob - Conteúdo do arquivo
     * @param {string} fileName - Nome do arquivo
     * @param {string} [folderId] - ID da pasta destino
     * @param {string} [mimeType] - Tipo MIME
     * @returns {Object} Informações do arquivo criado
     */
    uploadFile: function(blob, fileName, folderId, mimeType) {
      try {
        var metadata = {
          name: BACKEND_CONFIG.FILE_PREFIX + fileName,
          mimeType: mimeType || blob.getContentType()
        };
        
        if (folderId) {
          metadata.parents = [folderId];
        }
        
        var file = Drive.Files.create(metadata, blob, {
          fields: 'id, name, webViewLink, webContentLink'
        });
        
        AppLogger.info('Arquivo enviado ao Drive', { 
          fileId: file.id, 
          name: file.name 
        });
        
        return {
          success: true,
          fileId: file.id,
          fileName: file.name,
          viewLink: file.webViewLink,
          downloadLink: file.webContentLink
        };
        
      } catch (e) {
        AppLogger.error('Erro ao fazer upload', e);
        return { success: false, error: e.message };
      }
    },
    
    /**
     * Gera PDF a partir de uma planilha
     * @param {string} spreadsheetId - ID da planilha
     * @param {string} [sheetId] - ID da aba específica
     * @param {string} [fileName] - Nome do arquivo
     * @returns {Object} Resultado com link do PDF
     */
    exportSheetToPDF: function(spreadsheetId, sheetId, fileName) {
      try {
        spreadsheetId = spreadsheetId || getSS().getId();
        
        var url = 'https://docs.google.com/spreadsheets/d/' + spreadsheetId + '/export?';
        var params = [
          'format=pdf',
          'size=A4',
          'portrait=true',
          'fitw=true',
          'gridlines=false',
          'printtitle=false',
          'sheetnames=false',
          'pagenum=CENTER',
          'fzr=true'
        ];
        
        if (sheetId) {
          params.push('gid=' + sheetId);
        }
        
        var response = UrlFetchApp.fetch(url + params.join('&'), {
          headers: {
            Authorization: 'Bearer ' + ScriptApp.getOAuthToken()
          },
          muteHttpExceptions: true
        });
        
        if (response.getResponseCode() !== 200) {
          throw new Error('Falha ao gerar PDF: ' + response.getResponseCode());
        }
        
        var blob = response.getBlob().setName((fileName || 'export') + '.pdf');
        var folderId = this.getOrCreateFolder('Relatorios_PDF');
        
        return this.uploadFile(blob, (fileName || 'export') + '.pdf', folderId, 'application/pdf');
        
      } catch (e) {
        AppLogger.error('Erro ao exportar PDF', e);
        return { success: false, error: e.message };
      }
    },
    
    /**
     * Lista arquivos em uma pasta
     * @param {string} folderId - ID da pasta
     * @param {Object} [options] - Opções de listagem
     * @returns {Array} Lista de arquivos
     */
    listFiles: function(folderId, options) {
      options = options || {};
      
      try {
        var query = "'" + folderId + "' in parents and trashed = false";
        if (options.mimeType) {
          query += " and mimeType = '" + options.mimeType + "'";
        }
        
        var response = Drive.Files.list({
          q: query,
          fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink)',
          pageSize: options.limit || 100,
          orderBy: options.orderBy || 'modifiedTime desc'
        });
        
        return response.files || [];
        
      } catch (e) {
        AppLogger.error('Erro ao listar arquivos', e);
        return [];
      }
    },
    
    /**
     * Compartilha arquivo com usuário
     * @param {string} fileId - ID do arquivo
     * @param {string} email - Email do usuário
     * @param {string} [role='reader'] - Papel: reader, writer, commenter
     * @returns {boolean} Sucesso
     */
    shareFile: function(fileId, email, role) {
      try {
        Drive.Permissions.create({
          type: 'user',
          role: role || 'reader',
          emailAddress: email
        }, fileId, {
          sendNotificationEmail: true
        });
        
        return true;
      } catch (e) {
        AppLogger.error('Erro ao compartilhar arquivo', e);
        return false;
      }
    }
  };
  
  // --------------------------------------------------------------------------
  // SHEETS SERVICE - Operações Avançadas
  // --------------------------------------------------------------------------
  
  var SheetsService = {
    
    /**
     * Lê dados usando Sheets API v4 (mais rápido para grandes volumes)
     * @param {string} spreadsheetId - ID da planilha
     * @param {string} range - Range no formato A1
     * @returns {Array} Dados
     */
    batchGet: function(spreadsheetId, range) {
      try {
        spreadsheetId = spreadsheetId || getSS().getId();
        
        var response = Sheets.Spreadsheets.Values.get(spreadsheetId, range);
        return response.values || [];
        
      } catch (e) {
        AppLogger.error('Erro ao ler dados via Sheets API', e);
        return [];
      }
    },
    
    /**
     * Escreve dados usando Sheets API v4
     * @param {string} spreadsheetId - ID da planilha
     * @param {string} range - Range no formato A1
     * @param {Array} values - Dados a escrever
     * @returns {Object} Resultado
     */
    batchUpdate: function(spreadsheetId, range, values) {
      try {
        spreadsheetId = spreadsheetId || getSS().getId();
        
        var response = Sheets.Spreadsheets.Values.update(
          { values: values },
          spreadsheetId,
          range,
          { valueInputOption: 'USER_ENTERED' }
        );
        
        return {
          success: true,
          updatedCells: response.updatedCells,
          updatedRows: response.updatedRows
        };
        
      } catch (e) {
        AppLogger.error('Erro ao escrever dados via Sheets API', e);
        return { success: false, error: e.message };
      }
    },
    
    /**
     * Adiciona linhas usando Sheets API v4
     * @param {string} spreadsheetId - ID da planilha
     * @param {string} range - Range (ex: 'Sheet1!A:Z')
     * @param {Array} values - Linhas a adicionar
     * @returns {Object} Resultado
     */
    appendRows: function(spreadsheetId, range, values) {
      try {
        spreadsheetId = spreadsheetId || getSS().getId();
        
        var response = Sheets.Spreadsheets.Values.append(
          { values: values },
          spreadsheetId,
          range,
          {
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS'
          }
        );
        
        return {
          success: true,
          updatedRange: response.updates.updatedRange,
          updatedRows: response.updates.updatedRows
        };
        
      } catch (e) {
        AppLogger.error('Erro ao adicionar linhas via Sheets API', e);
        return { success: false, error: e.message };
      }
    },
    
    /**
     * Cria nova planilha
     * @param {string} title - Título da planilha
     * @param {Array<string>} [sheetNames] - Nomes das abas
     * @returns {Object} Informações da planilha criada
     */
    createSpreadsheet: function(title, sheetNames) {
      try {
        var resource = {
          properties: {
            title: BACKEND_CONFIG.FILE_PREFIX + title
          }
        };
        
        if (sheetNames && sheetNames.length > 0) {
          resource.sheets = sheetNames.map(function(name, index) {
            return {
              properties: {
                sheetId: index,
                title: name
              }
            };
          });
        }
        
        var spreadsheet = Sheets.Spreadsheets.create(resource);
        
        return {
          success: true,
          spreadsheetId: spreadsheet.spreadsheetId,
          spreadsheetUrl: spreadsheet.spreadsheetUrl
        };
        
      } catch (e) {
        AppLogger.error('Erro ao criar planilha', e);
        return { success: false, error: e.message };
      }
    }
  };
  
  // --------------------------------------------------------------------------
  // EMAIL SERVICE - Envio de Emails
  // --------------------------------------------------------------------------
  
  var EmailService = {
    
    /**
     * Envia email com suporte a HTML e anexos
     * @param {Object} options - Opções do email
     * @param {string} options.to - Destinatário
     * @param {string} options.subject - Assunto
     * @param {string} [options.body] - Corpo texto
     * @param {string} [options.htmlBody] - Corpo HTML
     * @param {Array} [options.attachments] - Anexos
     * @param {Array<string>} [options.cc] - Cópias
     * @param {Array<string>} [options.bcc] - Cópias ocultas
     * @param {string} [options.replyTo] - Email para resposta
     * @returns {Object} Resultado
     */
    send: function(options) {
      try {
        if (!options.to || !options.subject) {
          return { success: false, error: 'Destinatário e assunto são obrigatórios' };
        }
        
        var emailOptions = {
          to: options.to,
          subject: options.subject,
          htmlBody: options.htmlBody || options.body || '',
          name: 'Sistema UNIAE CRE'
        };
        
        if (options.cc) {
          emailOptions.cc = Array.isArray(options.cc) ? options.cc.join(',') : options.cc;
        }
        
        if (options.bcc) {
          emailOptions.bcc = Array.isArray(options.bcc) ? options.bcc.join(',') : options.bcc;
        }
        
        if (options.replyTo) {
          emailOptions.replyTo = options.replyTo;
        }
        
        if (options.attachments && options.attachments.length > 0) {
          emailOptions.attachments = options.attachments;
        }
        
        GmailApp.sendEmail(options.to, options.subject, options.body || '', emailOptions);
        
        AppLogger.info('Email enviado', { to: options.to, subject: options.subject });
        
        return { success: true };
        
      } catch (e) {
        AppLogger.error('Erro ao enviar email', e);
        return { success: false, error: e.message };
      }
    },
    
    /**
     * Envia email usando template HTML
     * @param {string} templateName - Nome do template (arquivo HTML)
     * @param {Object} data - Dados para substituição
     * @param {Object} emailOptions - Opções do email
     * @returns {Object} Resultado
     */
    sendWithTemplate: function(templateName, data, emailOptions) {
      try {
        var template = HtmlService.createTemplateFromFile(templateName);
        
        // Injeta dados no template
        var keys = Object.keys(data);
        for (var i = 0; i < keys.length; i++) {
          template[keys[i]] = data[keys[i]];
        }
        
        var htmlBody = template.evaluate().getContent();
        emailOptions.htmlBody = htmlBody;
        
        return this.send(emailOptions);
        
      } catch (e) {
        AppLogger.error('Erro ao enviar email com template', e);
        return { success: false, error: e.message };
      }
    },
    
    /**
     * Obtém quota de emails restante
     * @returns {number} Emails restantes
     */
    getRemainingQuota: function() {
      try {
        return MailApp.getRemainingDailyQuota();
      } catch (e) {
        return 0;
      }
    }
  };
  
  // --------------------------------------------------------------------------
  // CALENDAR SERVICE - Agendamentos
  // --------------------------------------------------------------------------
  
  var CalendarService = {
    
    /**
     * Cria evento no calendário
     * @param {Object} options - Opções do evento
     * @param {string} options.title - Título
     * @param {Date} options.startTime - Início
     * @param {Date} options.endTime - Fim
     * @param {string} [options.description] - Descrição
     * @param {string} [options.location] - Local
     * @param {Array<string>} [options.guests] - Convidados
     * @param {string} [options.calendarId] - ID do calendário
     * @returns {Object} Resultado
     */
    createEvent: function(options) {
      try {
        var calendar = options.calendarId 
          ? CalendarApp.getCalendarById(options.calendarId)
          : CalendarApp.getDefaultCalendar();
        
        if (!calendar) {
          return { success: false, error: 'Calendário não encontrado' };
        }
        
        var event = calendar.createEvent(
          options.title,
          options.startTime,
          options.endTime,
          {
            description: options.description || '',
            location: options.location || '',
            guests: options.guests ? options.guests.join(',') : '',
            sendInvites: true
          }
        );
        
        AppLogger.info('Evento criado', { 
          eventId: event.getId(), 
          title: options.title 
        });
        
        return {
          success: true,
          eventId: event.getId(),
          eventUrl: event.getGuestList().length > 0 ? event.getGuestList()[0].getGuestStatus() : null
        };
        
      } catch (e) {
        AppLogger.error('Erro ao criar evento', e);
        return { success: false, error: e.message };
      }
    },
    
    /**
     * Lista eventos em um período
     * @param {Date} startDate - Data inicial
     * @param {Date} endDate - Data final
     * @param {string} [calendarId] - ID do calendário
     * @returns {Array} Eventos
     */
    listEvents: function(startDate, endDate, calendarId) {
      try {
        var calendar = calendarId 
          ? CalendarApp.getCalendarById(calendarId)
          : CalendarApp.getDefaultCalendar();
        
        if (!calendar) {
          return [];
        }
        
        var events = calendar.getEvents(startDate, endDate);
        
        return events.map(function(event) {
          return {
            id: event.getId(),
            title: event.getTitle(),
            startTime: event.getStartTime(),
            endTime: event.getEndTime(),
            description: event.getDescription(),
            location: event.getLocation()
          };
        });
        
      } catch (e) {
        AppLogger.error('Erro ao listar eventos', e);
        return [];
      }
    }
  };
  
  // --------------------------------------------------------------------------
  // DOCUMENT SERVICE - Geração de Documentos
  // --------------------------------------------------------------------------
  
  var DocumentService = {
    
    /**
     * Cria documento a partir de template
     * @param {string} templateId - ID do documento template
     * @param {Object} data - Dados para substituição
     * @param {string} [fileName] - Nome do arquivo
     * @returns {Object} Resultado
     */
    createFromTemplate: function(templateId, data, fileName) {
      try {
        // Copia o template
        var templateFile = DriveApp.getFileById(templateId);
        var newFile = templateFile.makeCopy(BACKEND_CONFIG.FILE_PREFIX + (fileName || 'documento'));
        var doc = DocumentApp.openById(newFile.getId());
        var body = doc.getBody();
        
        // Substitui placeholders
        var keys = Object.keys(data);
        for (var i = 0; i < keys.length; i++) {
          var placeholder = '{{' + keys[i] + '}}';
          body.replaceText(placeholder, String(data[keys[i]] || ''));
        }
        
        doc.saveAndClose();
        
        return {
          success: true,
          documentId: newFile.getId(),
          documentUrl: newFile.getUrl()
        };
        
      } catch (e) {
        AppLogger.error('Erro ao criar documento', e);
        return { success: false, error: e.message };
      }
    },
    
    /**
     * Converte documento para PDF
     * @param {string} documentId - ID do documento
     * @param {string} [folderId] - Pasta destino
     * @returns {Object} Resultado
     */
    convertToPDF: function(documentId, folderId) {
      try {
        var doc = DriveApp.getFileById(documentId);
        var blob = doc.getAs('application/pdf');
        blob.setName(doc.getName() + '.pdf');
        
        var folder = folderId 
          ? DriveApp.getFolderById(folderId)
          : DriveApp.getRootFolder();
        
        var pdfFile = folder.createFile(blob);
        
        return {
          success: true,
          pdfId: pdfFile.getId(),
          pdfUrl: pdfFile.getUrl()
        };
        
      } catch (e) {
        AppLogger.error('Erro ao converter para PDF', e);
        return { success: false, error: e.message };
      }
    }
  };
  
  // --------------------------------------------------------------------------
  // EXTERNAL API SERVICE - Requisições Externas
  // --------------------------------------------------------------------------
  
  var ExternalAPIService = {
    
    /**
     * Faz requisição HTTP GET
     * @param {string} url - URL
     * @param {Object} [headers] - Headers adicionais
     * @returns {Object} Resposta
     */
    get: function(url, headers) {
      return this.request('GET', url, null, headers);
    },
    
    /**
     * Faz requisição HTTP POST
     * @param {string} url - URL
     * @param {Object} payload - Dados
     * @param {Object} [headers] - Headers
     * @returns {Object} Resposta
     */
    post: function(url, payload, headers) {
      return this.request('POST', url, payload, headers);
    },
    
    /**
     * Faz requisição HTTP genérica
     * @param {string} method - Método HTTP
     * @param {string} url - URL
     * @param {Object} [payload] - Dados
     * @param {Object} [headers] - Headers
     * @returns {Object} Resposta
     */
    request: function(method, url, payload, headers) {
      try {
        var options = {
          method: method,
          muteHttpExceptions: true,
          headers: headers || {},
          contentType: 'application/json'
        };
        
        if (payload && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
          options.payload = JSON.stringify(payload);
        }
        
        var response = UrlFetchApp.fetch(url, options);
        var responseCode = response.getResponseCode();
        var responseText = response.getContentText();
        
        var data = null;
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          data = responseText;
        }
        
        return {
          success: responseCode >= 200 && responseCode < 300,
          statusCode: responseCode,
          data: data,
          headers: response.getAllHeaders()
        };
        
      } catch (e) {
        AppLogger.error('Erro na requisição externa', e);
        return { success: false, error: e.message };
      }
    },
    
    /**
     * Consulta NFe na SEFAZ (exemplo)
     * @param {string} chaveAcesso - Chave de acesso da NFe
     * @returns {Object} Dados da NFe
     */
    consultarNFe: function(chaveAcesso) {
      // Implementação depende da API específica
      // Este é um exemplo de estrutura
      var url = 'https://api.exemplo.com/nfe/' + chaveAcesso;
      return this.get(url, {
        'Authorization': 'Bearer ' + this.getAPIToken()
      });
    },
    
    /**
     * Obtém token de API (das propriedades do script)
     * @returns {string} Token
     */
    getAPIToken: function() {
      try {
        return PropertiesService.getScriptProperties().getProperty('API_TOKEN') || '';
      } catch (e) {
        return '';
      }
    }
  };
  
  // --------------------------------------------------------------------------
  // API PÚBLICA
  // --------------------------------------------------------------------------
  
  return {
    /** Serviço de Drive */
    Drive: DriveService,
    
    /** Serviço de Sheets */
    Sheets: SheetsService,
    
    /** Serviço de Email */
    Email: EmailService,
    
    /** Serviço de Calendário */
    Calendar: CalendarService,
    
    /** Serviço de Documentos */
    Document: DocumentService,
    
    /** Serviço de APIs Externas */
    API: ExternalAPIService,
    
    /** Configuração */
    CONFIG: BACKEND_CONFIG
  };
})();

// ============================================================================
// FUNÇÕES GLOBAIS PARA WEB APP
// ============================================================================

/**
 * DESATIVADO: Handler GET movido para _INIT_Main.gs
 * 
 * A implementação canônica do doGet está em _INIT_Main.gs
 * Esta versão foi mantida como referência mas comentada.
 * 
 * @deprecated Use _INIT_Main.gs como ponto de entrada principal
 * @param {Object} e - Evento (pode ser undefined se chamado diretamente)
 * @returns {HtmlOutput|TextOutput} Resposta
 */
/*
// RENOMEADO: doGet canonico fica em _INIT_Main.gs (evita colisao global).
function _coreBackend_legacy_doGet(e) {
  // Proteção contra e undefined
  e = e || { parameter: {} };
  var params = e.parameter || {};
  var page = params.page || 'index';
  
  try {
    // Tenta carregar a página solicitada
    var template = HtmlService.createTemplateFromFile(page);
    template.params = params;
    
    return template.evaluate()
      .setTitle('UNIAE CRE - Sistema de Gestão')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
      
  } catch (error) {
    // Se a página não existir, mostra página inicial padrão
    Logger.log('Página não encontrada: ' + page + ' - ' + error.message);
    return criarPaginaInicial();
  }
}
*/

/**
 * Cria página inicial padrão do sistema
 * @returns {HtmlOutput} Página HTML
 */
function criarPaginaInicial() {
  var html = '<!DOCTYPE html>' +
    '<html><head>' +
    '<meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>UNIAE CRE - Sistema de Gestão</title>' +
    '<style>' +
    ':root{--primary:#1a73e8;--success:#0d652d;--purple:#7c3aed;--bg:#f8f9fa;--text:#202124}' +
    '*{margin:0;padding:0;box-sizing:border-box}' +
    'body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:var(--bg);min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:20px}' +
    '.header{text-align:center;margin-bottom:30px}' +
    '.header h1{font-size:28px;color:var(--text);margin-bottom:8px}' +
    '.header p{color:#5f6368;font-size:14px}' +
    '.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;max-width:900px;width:100%}' +
    '.card{background:white;border-radius:16px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,0.1);transition:transform 0.2s,box-shadow 0.2s;cursor:pointer;text-decoration:none;color:inherit}' +
    '.card:hover{transform:translateY(-4px);box-shadow:0 8px 24px rgba(0,0,0,0.15)}' +
    '.card-icon{font-size:48px;margin-bottom:16px}' +
    '.card-title{font-size:18px;font-weight:600;margin-bottom:8px}' +
    '.card-desc{font-size:14px;color:#5f6368;line-height:1.5}' +
    '.card-fornecedor{border-left:4px solid var(--primary)}' +
    '.card-escola{border-left:4px solid var(--success)}' +
    '.card-analista{border-left:4px solid var(--purple)}' +
    '.footer{margin-top:40px;text-align:center;color:#5f6368;font-size:12px}' +
    '</style></head><body>' +
    '<div class="header">' +
    '<h1>🍎 UNIAE CRE</h1>' +
    '<p>Sistema de Gestão de Gêneros Alimentícios</p>' +
    '</div>' +
    '<div class="cards">' +
    '<div class="card card-fornecedor" onclick="abrirWorkflow(\'fornecedor\')">' +
    '<div class="card-icon">📋</div>' +
    '<div class="card-title">Fornecedor</div>' +
    '<div class="card-desc">Lançar Notas Fiscais de gêneros alimentícios para distribuição nas escolas.</div>' +
    '</div>' +
    '<div class="card card-escola" onclick="abrirWorkflow(\'representante\')">' +
    '<div class="card-icon">📦</div>' +
    '<div class="card-title">Representante Escolar</div>' +
    '<div class="card-desc">Registrar recebimento de gêneros alimentícios e conferir quantidades.</div>' +
    '</div>' +
    '<div class="card card-analista" onclick="abrirWorkflow(\'analista\')">' +
    '<div class="card-icon">⚖️</div>' +
    '<div class="card-title">Analista UNIAE</div>' +
    '<div class="card-desc">Validar recebimentos, calcular glosas e autorizar pagamentos.</div>' +
    '</div>' +
    '</div>' +
    '<div class="footer">' +
    '<p>📊 Para acessar o Dashboard, use o menu <strong>📱 Workflows</strong> na planilha</p>' +
    '<p style="margin-top:8px">Secretaria de Estado de Educação do Distrito Federal</p>' +
    '</div>' +
    '<script>' +
    'function abrirWorkflow(tipo){' +
    'google.script.run.abrirWorkflow' + 'PorTipo(tipo);' +
    'alert("Abrindo interface do " + tipo + "...\\n\\nUse o menu 📱 Workflows na planilha para acesso completo.");' +
    '}' +
    '</script>' +
    '</body></html>';
  
  return HtmlService.createHtmlOutput(html)
    .setTitle('UNIAE CRE - Sistema de Gestão')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Handler POST para Web App (API REST)
 * @param {Object} e - Evento
 * @returns {TextOutput} Resposta JSON
 */
function backendServicesHandlePost_(e) {
  try {
    var response = { success: false, error: 'Ação não especificada' };
  
    try {
      var data = JSON.parse(e.postData.contents);
      var action = data.action;

      // Este dispatcher executa operações com os escopos do proprietário do
      // deployment. Mesmo sendo um helper interno, nunca confie apenas no
      // chamador: exija uma sessão administrativa válida antes do switch.
      var token = String(data.token || '').trim();
      var principal = token && typeof getSessionUser === 'function'
        ? getSessionUser(token)
        : null;
      var role = principal ? String(principal.role || principal.perfil || '').toLowerCase() : '';
      if (!principal || role !== 'admin') {
        return ContentService
          .createTextOutput(JSON.stringify({ success: false, code: 'FORBIDDEN', error: 'Sessão administrativa inválida.' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    
      switch (action) {
        case 'create':
          response = CRUD.create(data.sheet, data.record, { silent: true });
          break;
        
        case 'read':
          response = CRUD.read(data.sheet, data.options);
          break;
        
        case 'update':
          response = CRUD.update(data.sheet, data.rowIndex, data.record, { silent: true });
          break;
        
        case 'delete':
          response = CRUD.delete(data.sheet, data.rowIndex, data.hard, { silent: true });
          break;
        
        case 'sendEmail':
          response = BackendServices.Email.send(data.options);
          break;
        
        case 'uploadFile':
          var blob = Utilities.newBlob(
            Utilities.base64Decode(data.content),
            data.mimeType,
            data.fileName
          );
          response = BackendServices.Drive.uploadFile(blob, data.fileName, data.folderId);
          break;
        
        case 'exportPDF':
          response = BackendServices.Drive.exportSheetToPDF(data.spreadsheetId, data.sheetId, data.fileName);
          break;
        
        default:
          response = { success: false, error: 'Ação desconhecida: ' + action };
      }
    
    } catch (error) {
      response = { success: false, error: error.message };
      AppLogger.error('Erro no doPost', error);
    }
  
    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    Logger.log("Erro em doPost: " + error.message);
    throw error;
  }
}

// ============================================================================
// REGISTRO DO MÓDULO
// ============================================================================

Logger.log('✅ Core_Backend_Services carregado - Serviços integrados disponíveis');
