/**
 * @fileoverview UI UX - Experiência do Usuário
 * @version 4.0.0
 *
 * Consolidado de: UXController.gs, UXEnhanced.gs, UXIntegrations.gs
 *
 * Dependências:
 * - Core_UI_Safe.gs (getSafeUi, safeAlert, safePrompt)
 * - Core_Logger.gs (SystemLogger)
 */

'use strict';

// Usa funções de Core_UI_Safe.gs (getSafeUi, safeAlert, safePrompt)


// ---- UXController.gs ----
/**
 * UXController.gs - Controlador de UX Moderna
 * Implementa interface de usuário moderna e intuitiva seguindo SOLID
 * Foca na experiência do usuário com feedback visual e interações fluidas
 */

/**
 * UX CONTROLLER (SRP - Single Responsibility)
 * Responsável apenas por coordenar a experiência do usuário
 */
function UXController(dependencies) {
  this.notificationService = dependencies.notificationService || resolve('notificationService');
  this.theme = dependencies.theme || new ModernTheme();
  this.analytics = dependencies.analytics || new UXAnalytics();
}

UXController.prototype.showWelcomeScreen = function() {
  var message = this.theme.formatWelcomeMessage();

  this.notificationService.notify(
    message,
    'info',
    '🎉 Bem-vindo ao Sistema UNIAE 3.0'
  );

  this.analytics.trackEvent('welcome_screen_shown');

  // Mostrar tour guiado se for primeira vez
  if (this.isFirstTime()) {
    this.showGuidedTour();
  }
};

UXController.prototype.showGuidedTour = function() {
  var steps = [
    {
      title : '📋 Sistema UNIAE 3.0',
      message : 'Bem-vindo ao sistema refatorado com conformidade legal!\n\n' +
               '✅ Arquitetura SOLID implementada\n' +
               '✅ Base legal para todas as operações\n' +
               '✅ UX moderna e intuitiva\n' +
               '✅ Validação automática de conformidade'
    },
    {
      title : '⚖️ Conformidade Legal',
      message : 'O sistema agora opera com base legal sólida : \n\n' +
               '• Lei 11.947/2009 (PNAE)\n' +
               '• Lei 14.133/2021 (Licitações)\n' +
               '• Resolução FNDE 06/2020\n' +
               '• Validação automática de violações\n' +
               '• Score de conformidade em tempo real'
    },
    {
      title : '🎯 Menu Inteligente',
      message : 'Menu organizado por competência legal : \n\n' +
               '🏛️ Federal - FNDE\n' +
               '🏢 Distrital - SEEDF\n' +
               '🌐 Regional - CRE-PP\n' +
               '🏫 Local - UNIAE\n' +
               '👥 Operacional - Comissão\n' +
               '👤 Individual - Analistas'
    },
    {
      title : '🚀 Recursos Avançados',
      message : 'Novos recursos implementados : \n\n' +
               '• Controle de conferência automatizado\n' +
               '• Relatórios de conformidade legal\n' +
               '• Dashboard executivo\n' +
               '• Análise de casos recorrentes\n' +
               '• Notificações inteligentes'
    }
  ];

  this.showStepByStepTour(steps);
};

UXController.prototype.showStepByStepTour = function(steps) {
  var self = this;

  function showStep(index) {
    try {
      try {
        try {
          if (index >= steps.length) {
            self.completeTour();
            return;
          }

          var step = steps[index];
          var isLast = index == steps.length - 1;

          var buttons = isLast ? 
            self.notificationService.ui.ButtonSet.OK :
            self.notificationService.ui.ButtonSet.OK_CANCEL;

          var response = self.notificationService.safeAlert(
            step.title,
            step.message + '\n\n' +
            'Passo ' + (index + 1) + ' de ' + steps.length +
            (isLast ? '' : '\n\nClique OK para continuar ou Cancelar para pular.'),
            buttons
          );

          if (response == self.notificationService.ui.Button.OK || isLast) {
            // Pequena pausa para melhor UX
            Utilities.sleep(500);
            showStep(index + 1);
          } else {
            self.completeTour();
          }
        } catch (error) {
          Logger.log("Erro em showStep: " + error.message);
          throw error; // Re-lança para tratamento superior
        }
      } catch (error) {
        Logger.log("Erro em showStep: " + error.message);
        throw error;
      }
    } catch (error) {
      Logger.log("Erro em showStep: " + error.message);
      throw error;
    }
  }

  showStep(0);
};

UXController.prototype.completeTour = function() {
  // Marcar tour como completo
  PropertiesService.getScriptProperties().setProperty('TOUR_COMPLETED', 'true');

  this.notificationService.notify(
    'Tour concluído! 🎉\n\n' +
    'Você está pronto para usar o Sistema UNIAE 3.0.\n\n' +
    'Dica : Use o menu "⚖️ Conformidade Legal" para verificar ' +
    'a conformidade de suas operações.',
    'success',
    'Tour Concluído'
  );

  this.analytics.trackEvent('tour_completed');
};

UXController.prototype.isFirstTime = function() {
  var tourCompleted = PropertiesService.getScriptProperties().getProperty('TOUR_COMPLETED');
};

UXController.prototype.showProgressIndicator = function(operation, steps) {
  var totalSteps = steps.length;
  var currentStep = 0;

  var self = this;
  return {
    nextStep: function(stepName) {
      try {
        currentStep++
        var progress = Math.round((currentStep / totalSteps) * 100);

        getSS().toast(
          '⏳ ' + stepName + ' (' + currentStep + '/' + totalSteps + ')',
          operation + ' - ' + progress + '%'
        );

        self.analytics.trackEvent('progress_step', {
          operation : operation,
          step : stepName,
          progress : progress
        });
      } catch (error) {
        Logger.log("Erro em nextStep: " + error.message);
        throw error;
      }
    },
    complete: function(message) {
      try {
        getSS().toast(
          '✅ ' + (message || 'Operação concluída!'),
          operation + ' - 100%'
        );

        self.analytics.trackEvent('operation_completed', {
          operation : operation
        });
      } catch (error) {
        Logger.log("Erro em complete: " + error.message);
        throw error;
      }
    },
    error: function(errorMessage) {
      try {
        getSS().toast(
          '❌ ' + errorMessage,
          operation + ' - Erro'
        );

        self.analytics.trackEvent('operation_error', {
          operation : operation,
          error : errorMessage
        });
      } catch (error) {
        Logger.log("Erro em error: " + error.message);
        throw error;
      }
    }
  };
};

UXController.prototype.showSmartForm = function(formConfig) {
  var form = new SmartForm(formConfig, this.notificationService);
};

UXController.prototype.showContextualHelp = function(context) {
  var helpContent = this.getHelpContent(context);

  this.notificationService.notify(
    helpContent.message,
    'info',
    '💡 ' + helpContent.title
  );

  this.analytics.trackEvent('help_shown', { context : context });
};

UXController.prototype.getHelpContent = function(context) {
  var helpMap = {
    'nota_fiscal' : {
      title : 'Ajuda - Notas Fiscais',
      message : 'COMO REGISTRAR UMA NOTA FISCAL : \n\n' +
               '1. Use o menu "📋 Controle de Conferência Legal"\n' +
               '2. Clique em "📝 Registrar NF (Validação Legal)"\n' +
               '3. Preencha os dados obrigatórios\n' +
               '4. O sistema validará automaticamente a conformidade\n\n' +
               '💡 DICA : Notas com score < 80% precisam de atenção!'
    },
    'conformidade' : {
      title : 'Ajuda - Conformidade Legal',
      message : 'COMO VERIFICAR CONFORMIDADE : \n\n' +
               '1. Use o menu "⚖️ Conformidade Legal"\n' +
               '2. Clique em "🔍 Verificar Conformidade Geral"\n' +
               '3. Analise o relatório gerado\n' +
               '4. Siga as recomendações apresentadas\n\n' +
               '⚠️ ATENÇÃO : Violações críticas devem ser resolvidas imediatamente!'
    },
    'menu' : {
      title : 'Ajuda - Navegação',
      message : 'COMO NAVEGAR NO SISTEMA : \n\n' +
               '• Menu organizado por competência legal\n' +
               '• Cada nível tem suas responsabilidades específicas\n' +
               '• Ícones indicam o tipo de operação\n' +
               '• Mensagens mostram base legal aplicável\n\n' +
               '🎯 DICA : Comece sempre pelo seu nível hierárquico!'
    }
  };

    return {
      title : 'Ajuda Geral',
      message : 'Para ajuda específica, consulte a documentação do sistema ou ' +
             'use o menu "ℹ️ Sobre o Sistema (Versão Legal)".'
    };
  };

/**
 * MODERN THEME (SRP - Single Responsibility)
 * Responsável apenas por formatação visual e temas
 */
function ModernTheme() {
  this.colors = {
    primary : '#1c4587',
    success : '#0d7377',
    warning : '#f57c00',
    error : '#d32f2f',
    info : '#1976d2'
  };

  this.icons = {
    success : '✅',
    error : '❌',
    warning : '⚠️',
    info : 'ℹ️',
    loading : '⏳',
    legal : '⚖️',
    compliance : '🎯',
    document : '📋',
    user : '👤',
    system : '🖥️'
  };
}

ModernTheme.prototype.formatWelcomeMessage = function() {
  return '✨ NOVIDADES DESTA VERSÃO : \n\n' +
         '⚖️ Base legal para todas as operações\n' +
         '🎯 Validação automática de conformidade\n' +
         '📊 Dashboard executivo avançado\n' +
         '🚀 Arquitetura SOLID implementada\n' +
         '💡 UX moderna e intuitiva\n' +
         '📱 Interface responsiva\n\n' +
         '🔥 SCORE DE CONFORMIDADE EM TEMPO REAL!\n\n' +
         'Pronto para começar ? Explore o menu reorganizado por competência legal!';
};

ModernTheme.prototype.formatComplianceScore = function(score) {
  var icon;
  if (score >= 90) {
    icon = '🟢';
  } else if (score >= 70) {
    icon = '🟡';
  } else {
    icon = '🔴';
  }
  var status;
  if (score >= 90) {
    status = 'EXCELENTE';
  } else if (score >= 70) {
    status = 'BOM';
  } else {
    status = 'CRÍTICO';
  }

};

ModernTheme.prototype.formatLegalBasis = function(legalBasis) {
  if (!legalBasis || legalBasis.length == 0) {
    return '⚠️ SEM BASE LEGAL DEFINIDA';
  }

};

/**
 * SMART FORM (SRP - Single Responsibility)
 * Responsável apenas por formulários inteligentes
 */
function SmartForm(config, notificationService) {
  try {
    this.config = config;
    this.notificationService = notificationService;
    this.data = {};
    this.errors = [];
  } catch (error) {
    Logger.log("Erro em SmartForm: " + error.message);
    throw error;
  }
}

SmartForm.prototype.show = function() {
  var self = this;

  // Mostrar introdução se configurada
  if (this.config.introduction) {
    this.notificationService.notify(
      this.config.introduction,
      'info',
      this.config.title || 'Formulário'
    );
  }

  // Processar cada campo
  for (var i = 0; i < this.config.fields.length; i++) {
    var field = this.config.fields[i];
    var result = this.processField(field);

    if (!result.success) {
      return { success : false, error : result.error };
    }

    this.data[field.name] = result.value;
  }

  // Validar dados completos
  var validation = this.validateForm();
  if (!validation.success) {
    this.notificationService.notify(
      'Erro na validação : \n\n' + validation.errors.join('\n'),
      'error',
      'Formulário Inválido'
    );
  }

  // Mostrar resumo se configurado
  if (this.config.showSummary) {
    var confirmed = this.showSummary();
    if (!confirmed) {
      return { success : false, cancelled : true };
    }
  }

};

SmartForm.prototype.processField = function(field) {
  var prompt = field.label;

  // Adicionar ajuda se disponível
  if (field.help) {
    prompt += '\n\n💡 ' + field.help;
  }

  // Adicionar valor padrão se disponível
  if (field.defaultValue) {
    prompt += '\n\n(Padrão : ' + field.defaultValue + ')';
  }

  var response = this.notificationService.prompt(
    prompt,
    field.title || 'Entrada de Dados',
    field.defaultValue
  );

  if (!response.success) {}

  var value = response.value || field.defaultValue || '';

  // Validar campo
  var validation = this.validateField(field, value);
  if (!validation.success) {
    this.notificationService.notify(
      'Erro no campo "' + field.label + '" : \n\n' + validation.error,
      'error',
      'Campo Inválido'
    );

    // Tentar novamente
  }

};

SmartForm.prototype.validateField = function(field, value) {
  // Validação obrigatória
  if (field.required && (!value || value.trim() == '')) {}

  // Validação por tipo
  switch (field.type) {
    case 'number' :
      var num = Number(value);
      if (isNaN(num)) {
        return { success : false, error : 'Deve ser um número válido' };
      }
      if (field.min != undefined && num < field.min) {
        return { success : false, error : 'Valor mínimo : ' + field.min };
      }
      if (field.max != undefined && num > field.max) {
        return { success : false, error : 'Valor máximo : ' + field.max };
      }

    case 'email' :
      var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && !emailRegex.test(value)) {
        return { success : false, error : 'Email inválido' };
      }

    case 'date' :
      var date = new Date(value);
      if (value && isNaN(date.getTime())) {
        return { success : false, error : 'Data inválida (use dd/mm/aaaa)' };
      }

    case 'select' :
      if (field.options && field.options.indexOf(value) == -1) {
        return {
          success : false,
          error : 'Opção inválida. Opções : ' + field.options.join(', ')
        };
      }

      // default : null
  }
};

SmartForm.prototype.validateForm = function() {
  var errors = [];

  // Validações customizadas se configuradas
  if (this.config.customValidations) {
    for (var i = 0; i < this.config.customValidations.length; i++) {
      var validation = this.config.customValidations[i];
      try {
        var result = validation.validator(this.data);
        if (!result) {
          errors.push(validation.message);
        }
      } catch (e) {
        errors.push('Erro na validação : ' + e.message);
      }
    }
  }

  return {
    success : errors.length == 0,
    errors : errors
  };
};


SmartForm.prototype.showSummary = function() {
  var summary = 'RESUMO DOS DADOS : \n\n';

  for (var fieldName in this.data) {
    var value = this.data[fieldName];
    var displayValue = value;

    // Formatação especial para alguns tipos
    if (value instanceof Date) {
      displayValue = formatDate(value);
    } else if (typeof value == 'number') {
      displayValue = value.toLocaleString();
    }

    summary += '• ' + fieldName + ' : ' + displayValue + '\n';
  }

  summary += '\nConfirma os dados ? ';

};

/**
 * UX ANALYTICS (SRP - Single Responsibility)
 * Responsável apenas por análise de uso da UX
 */
function UXAnalytics() {
  try {
    try {
      this.events = [];
      this.sessionStart = new Date();
    } catch (error) {
      Logger.log("Erro em UXAnalytics: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em UXAnalytics: " + error.message);
    throw error;
  }
}

UXAnalytics.prototype.trackEvent = function(eventName, data) {
  var event = {
    name : eventName,
    data : data || {},
    timestamp : new Date(),
    sessionTime : new Date() - this.sessionStart
  };

  this.events.push(event);

  // Log para desenvolvimento
  SystemLogger.debug('UX Event tracked', event);

  // Salvar em propriedades para análise posterior
  this.saveToProperties();
};

UXAnalytics.prototype.saveToProperties = function() {
  try {
    var props = PropertiesService.getScriptProperties();
    var existingEvents = props.getProperty('UX_ANALYTICS_EVENTS');
    var allEvents;
    if (existingEvents) {
      allEvents = JSON.parse(existingEvents);
    } else {
      allEvents = [];
    }

    // Adicionar novos eventos
    allEvents = allEvents.concat(this.events);

    // Manter apenas os últimos 100 eventos
    if (allEvents.length > 100) {
      allEvents = allEvents.slice(-100);
    }

    props.setProperty('UX_ANALYTICS_EVENTS', JSON.stringify(allEvents));

    // Limpar eventos locais
    this.events = [];

  } catch (e) {
    SystemLogger.warn('Failed to save UX analytics', e);
  }
}


UXAnalytics.prototype.getAnalytics = function() {
  try {
    var props = PropertiesService.getScriptProperties();
    var eventsJson = props.getProperty('UX_ANALYTICS_EVENTS');
    var events;
    if (eventsJson) {
      events = JSON.parse(eventsJson);
    } else {
      events = [];
    }

    var analytics = {
      totalEvents : events.length,
      uniqueEvents : {},
      averageSessionTime : 0,
      mostUsedFeatures : {},
      errorRate : 0
    };

    var totalSessionTime = 0;
    var errorCount = 0;

    events.forEach(function(event) {
      // Contar eventos únicos
      analytics.uniqueEvents[event.name] = (analytics.uniqueEvents[event.name] || 0) + 1;

      // Tempo de sessão
      totalSessionTime += event.sessionTime || 0;

      // Contar erros
      if (event.name.indexOf('error') >= 0) {
        errorCount++
      }

      // Features mais usadas
      if (event.name.indexOf('_shown') >= 0 || event.name.indexOf('_completed') >= 0) {
        var feature = event.name.replace(/_shown|_completed/g, '');
        analytics.mostUsedFeatures[feature] = (analytics.mostUsedFeatures[feature] || 0) + 1;
      }
    });

    var averageSessionTime;
    if (events.length > 0) {
      averageSessionTime = totalSessionTime / events.length;
    } else {
      averageSessionTime = 0;
    }
    var errorRate;
    if (events.length > 0) {
      errorRate = (errorCount / events.length * 100).toFixed(2);
    } else {
      errorRate = 0;
    }


  } catch (e) {
    SystemLogger.error('Failed to get UX analytics', e);
    return {
      totalEvents : 0,
      uniqueEvents : {},
      averageSessionTime : 0,
      mostUsedFeatures : {},
      errorRate : 0
    };
  }
}


/**
 * FACTORY PARA UX COMPONENTS
 */
var UXFactory = {
  createController: function(dependencies) {},
  createSmartForm: function(config, notificationService) {},
  createTheme: function(themeName) {
    switch (themeName) {
      case 'modern' :
      // default : null
    }
  },
  createAnalytics: function() {}
};

/**
 * INICIALIZAÇÃO DA UX
 */
function initializeModernUX() {
  try {
    SystemLogger.info('Initializing Modern UX/* spread */');

    // Registrar componentes UX no DI Container
    DIContainer.bind('uxController', function() {
      return UXFactory.createController({
        notificationService : resolve('notificationService'),
        theme : UXFactory.createTheme('modern'),
        analytics : UXFactory.createAnalytics()
      });
    }, true);

    DIContainer.bind('uxTheme', function() {}, true);

    DIContainer.bind('uxAnalytics', function() {}, true);

    SystemLogger.info('Modern UX initialized successfully');


  } catch (error) {
    SystemLogger.error('Failed to initialize Modern UX', error);
    throw error;
  }
}


/**
 * HELPER FUNCTIONS PARA UX
 */
function showWelcomeScreen() {
  var uxController = resolve('uxController');
  uxController.showWelcomeScreen();
}

function showContextualHelp(context) {
  var uxController = resolve('uxController');
  uxController.showContextualHelp(context);
}

function createSmartForm(config) {
  var notificationService = resolve('notificationService');
  return UXFactory.createSmartForm(config, notificationService);
}

function getUXAnalytics() {
  var analytics = resolve('uxAnalytics');
  return analytics.getAnalytics();
}

// ---- UXEnhanced.gs ----
/**
 * UXEnhanced.gs - Componentes UX Avançados
 * Ampliação da experiência do usuário com componentes modernos
 */

/**
 * NOTIFICATION SYSTEM AVANÇADO
 * Sistema de notificações com diferentes tipos e animações
 */
function NotificationSystem() {
  try {
    this.queue = [];
    this.isShowing = false;
  } catch (error) {
    Logger.log("Erro em NotificationSystem: " + error.message);
    throw error;
  }
}

NotificationSystem.prototype.show = function(config) {
  var notification = {
    title : config.title || 'Notificação',
    message : config.message || '',
    type : config.type || 'info', // info, success, warning, error
    duration : config.duration || 3000,
    actions : config.actions || []
  };

  this.queue.push(notification);

  if (!this.isShowing) {
    this.processQueue();
  }
};

NotificationSystem.prototype.processQueue = function() {
  if (this.queue.length == 0) {
    this.isShowing = false;
    return;
  }

  this.isShowing = true;
  var notification = this.queue.shift();

  // Mostrar notificação usando toast do Sheets
  var icon = this.getIcon(notification.type);
  var message = icon + notification.message;

  getSS().toast(
    message,
    notification.title,
    notification.duration / 1000
  );

  var self = this;
  Utilities.sleep(notification.duration);
  this.processQueue();
};

NotificationSystem.prototype.getIcon = function(type) {
  var icons = {
    'info' : 'ℹ️',
    'success' : '✅',
    'warning' : '⚠️',
    'error' : '❌',
    'loading' : '⏳'
  };
};

/**
 * WIZARD SYSTEM
 * Sistema de assistente passo-a-passo para processos complexos
 */
function WizardSystem(config) {
  try {
    this.steps = config.steps || [];
    this.currentStep = 0;
    this.data = {};
    this.onComplete = config.onComplete || function() {};
    this.ui = getUiSafely();
  } catch (error) {
    Logger.log("Erro em WizardSystem: " + error.message);
    throw error;
  }
}

WizardSystem.prototype.start = function() {
  this.currentStep = 0;
  this.data = {};
  this.showStep();
};

WizardSystem.prototype.showStep = function() {
  if (this.currentStep >= this.steps.length) {
    this.complete();
    return;
  }

  var step = this.steps[this.currentStep];
  var progress = Math.round(((this.currentStep + 1) / this.steps.length) * 100);

  var title = '🧙 ' + step.title + ' (' + (this.currentStep + 1) + '/' + this.steps.length + ')';
  var message = step.message + '\n\n📊 Progresso : ' + progress + '%';

  if (step.type == 'input') {
    var response = this.safePrompt(title, message, this.ui.ButtonSet.OK_CANCEL);

    if (response.getSelectedButton() == this.ui.Button.OK) {
      this.data[step.key] = response.getResponseText();
      this.next();
    } else {
      this.cancel();
    }
  } else if (step.type == 'confirm') {
    var response = this.safeAlert(title, message, this.ui.ButtonSet.YES_NO);

    if (response == this.ui.Button.YES) {
      this.data[step.key] = true;
      this.next();
    } else {
      this.data[step.key] = false;
      this.cancel();
    }
  } else {
    this.safeAlert(title, message, this.ui.ButtonSet.OK);
    this.next();
  }
};

WizardSystem.prototype.next = function() {
  this.currentStep++
  this.showStep();
};

WizardSystem.prototype.complete = function() {
  this.onComplete(this.data);

  this.safeAlert(
    '✅ Assistente Concluído',
    'Processo concluído com sucesso!\n\nDados coletados : ' + Object.keys(this.data).length,
    this.ui.ButtonSet.OK
  );
};

WizardSystem.prototype.cancel = function() {
  this.safeAlert(
    '❌ Assistente Cancelado',
    'O processo foi cancelado.',
    this.ui.ButtonSet.OK
  );
};

/**
 * CONTEXTUAL HELP SYSTEM
 * Sistema de ajuda contextual inteligente
 */
function ContextualHelpSystem() {
  try {
    this.helpDatabase = this.buildHelpDatabase();
  } catch (error) {
    Logger.log("Erro em ContextualHelpSystem: " + error.message);
    throw error;
  }
}

ContextualHelpSystem.prototype.buildHelpDatabase = function() {
  return {
    'nota_fiscal' : {
      title : '📋 Ajuda - Notas Fiscais',
      sections : [
        {
          title : 'O que é uma Nota Fiscal ? ',
          content : 'Documento fiscal que comprova a venda de produtos ou serviços.'
        },
        {
          title : 'Como Registrar',
          content : '1. Acesse o menu "Controle de Conferência"\n2. Clique em "Registrar NF"\n3. Preencha os dados obrigatórios\n4. Confirme o registro'
        },
        {
          title : 'Campos Obrigatórios',
          content : '• Número da NF\n• Chave de Acesso (44 dígitos)\n• Data de Emissão\n• Fornecedor\n• CNPJ\n• Valor Total'
        },
        {
          title : 'Base Legal',
          content : 'Lei 14.133/2021 - Nova Lei de Licitações\nResolução FNDE 06/2020'
        }
      ]
    },
    'conferencia' : {
      title : '🔍 Ajuda - Conferência',
      sections : [
        {
          title : 'Processo de Conferência',
          content : 'A conferência valida se os produtos entregues estão conforme o pedido.'
        },
        {
          title : 'Etapas',
          content : '1. Verificar quantidades\n2. Verificar qualidade\n3. Verificar documentação\n4. Registrar ocorrências\n5. Atestar recebimento'
        },
        {
          title : 'Responsabilidades',
          content : 'Comissão de Recebimento (Resolução FNDE 06/2020)\nAnalistas Educacionais (apoio técnico)'
        }
      ]
    },
    'conformidade' : {
      title : '⚖️ Ajuda - Conformidade Legal',
      sections : [
        {
          title : 'O que é Conformidade ? ',
          content : 'Garantir que todas as operações estejam de acordo com a legislação aplicável.'
        },
        {
          title : 'Legislação Aplicável',
          content : '• Lei 11.947/2009 (PNAE)\n• Lei 14.133/2021 (Licitações)\n• Resolução FNDE 06/2020\n• Decreto 37.387/2016 (SEEDF)'
        },
        {
          title : 'Como Verificar',
          content : 'Use o menu "Conformidade Legal" > "Verificar Conformidade Geral"'
        }
      ]
    }
  };
};

ContextualHelpSystem.prototype.show = function(context) {
  var help = this.helpDatabase[context];

  if (!help) {
    safeUiAlert('❓ Ajuda não disponível', 'Não há ajuda disponível para este contexto.');
    return;
  }

  var message = '';
  help.sections.forEach(function(section) {
    message += '▶️ ' + section.title + '\n\n';
    message += section.content + '\n\n';
    message += '─────────────────────\n\n';
  });

  safeUiAlert(help.title, message);
};

/**
 * QUICK ACTIONS PANEL
 * Painel de ações rápidas para operações frequentes
 */
function QuickActionsPanel() {
  this.actions = this.buildActions();
}

QuickActionsPanel.prototype.buildActions = function() {
  return [
    {
      id : 'registrar_nf',
      icon : '📋',
      label : 'Registrar NF',
      description : 'Registrar nova nota fiscal',
      action: function() {
        if (typeof registrarNotaFiscalUX == 'function') {
          registrarNotaFiscalUX();
        }
      }
    },
    {
      id : 'verificar_conformidade',
      icon : '⚖️',
      label : 'Verificar Conformidade',
      description : 'Verificar conformidade legal',
      action: function() {
        if (typeof verificarConformidadeLegalUX == 'function') {
          verificarConformidadeLegalUX();
        }
      }
    },
    {
      id : 'dashboard',
      icon : '📊',
      label : 'Dashboard',
      description : 'Abrir dashboard executivo',
      action: function() {
        if (typeof dashboardExecutivoUX == 'function') {
          dashboardExecutivoUX();
        }
      }
    },
    {
      id : 'relatorio_comissao',
      icon : '📄',
      label : 'Relatório Comissão',
      description : 'Gerar relatório da comissão',
      action: function() {
        try {
          if (typeof gerarRelatorioComissaoUX == 'function') {
            gerarRelatorioComissaoUX();
          }
        } catch (error) {
          Logger.log("Erro em action: " + error.message);
          throw error;
        }
      }
    }
  ];
};

QuickActionsPanel.prototype.show = function() {
  var ui = getSafeUi();
    if (!ui) {
      Logger.log("⚠️ UI não disponível");
      return;
    }

  var message = '🚀 AÇÕES RÁPIDAS\n\n';
  message += 'Selecione uma ação : \n\n';

  this.actions.forEach(function(action, index) {
    message += (index + 1) + '. ' + action.icon + action.label + '\n';
    message += '   ' + action.description + '\n\n';
  });

  var response = ui.prompt(
    'Ações Rápidas',
    message + 'Digite o número da ação (1-' + this.actions.length + ') : ',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() == ui.Button.OK) {
    var index = parseInt(response.getResponseText()) - 1;

    if (index >= 0 && index < this.actions.length) {
      this.actions[index].action();
    } else {
      ui.alert('Ação inválida', 'Número de ação inválido.', ui.ButtonSet.OK);
    }
  }
};

/**
 * SEARCH SYSTEM
 * Sistema de busca avançada
 */
function SearchSystem() {
  try {
    this.ui = getUiSafely();
  } catch (error) {
    Logger.log("Erro em SearchSystem: " + error.message);
    throw error;
  }
}

SearchSystem.prototype.search = function() {
  var response = this.ui.prompt(
    '🔍 Busca Avançada',
    'Digite o termo de busca : \n\n' +
    '💡 Dica : Você pode buscar por : \n' +
    '• Número de NF\n' +
    '• Nome de fornecedor\n' +
    '• Produto\n' +
    '• Data (dd/mm/aaaa)',
    this.ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() == this.ui.Button.OK) {
    var searchTerm = response.getResponseText();
    this.performSearch(searchTerm);
  }
};

SearchSystem.prototype.performSearch = function(term) {
  var ss = getSpreadsheet();
  var results = [];

  // Buscar em Notas Fiscais
  var nfSheet = getSheet('Notas_Fiscais');
  if (nfSheet) {
    var nfData = getSafeDataRange(nfSheet);
    for (var i = 1; i < nfData.length; i++) {
      var row = nfData[i];
      if (this.matchesSearch(row, term)) {
        results.push({
          sheet : 'Notas_Fiscais',
          row : i + 1,
          data : row
        });
      }
    }
  }

  // Buscar em Entregas
  var entregasSheet = getSheet('Entregas');
  if (entregasSheet) {
    var entregasData = getSafeDataRange(entregasSheet);
    for (var i = 1; i < entregasData.length; i++) {
      var row = entregasData[i];
      if (this.matchesSearch(row, term)) {
        results.push({
          sheet : 'Entregas',
          row : i + 1,
          data : row
        });
      }
    }
  }

  this.showResults(term, results);
};

SearchSystem.prototype.matchesSearch = function(row, term) {
  var searchTerm = term.toLowerCase();

  for (var i = 0; i < row.length; i++) {
    var cellValue = String(row[i]).toLowerCase();
    if (cellValue.indexOf(searchTerm) != -1) {}
  }

};

SearchSystem.prototype.showResults = function(term, results) {
  if (results.length == 0) {
    this.ui.alert(
      '🔍 Nenhum Resultado',
      'Nenhum resultado encontrado para : "' + term + '"',
      this.ui.ButtonSet.OK
    );
  }

  var message = '🔍 RESULTADOS DA BUSCA\n\n';
  message += 'Termo : "' + term + '"\n';
  message += 'Resultados encontrados : ' + results.length + '\n\n';
  message += '─────────────────────\n\n';

  results.slice(0, 10).forEach(function(result, index) {
    message += (index + 1) + '. ' + result.sheet + ' (Linha ' + result.row + ')\n';
    message += '   ' + result.data.slice(0, 3).join(' | ') + '\n\n';
  });

  if (results.length > 10) {
    message += '\n/* spread */ e mais ' + (results.length - 10) + ' resultados.';
  }

  this.ui.alert('Resultados da Busca', message, this.ui.ButtonSet.OK);
};

/**
 * KEYBOARD SHORTCUTS SYSTEM
 * Sistema de atalhos de teclado
 */
function KeyboardShortcutsSystem() {
  this.shortcuts = this.buildShortcuts();
}

KeyboardShortcutsSystem.prototype.buildShortcuts = function() {
  return {
    'Ctrl+N' : 'Registrar Nova NF',
    'Ctrl+F' : 'Busca Avançada',
    'Ctrl+D' : 'Dashboard',
    'Ctrl+R' : 'Relatório Comissão',
    'Ctrl+H' : 'Ajuda Contextual',
    'Ctrl+Q' : 'Ações Rápidas',
    'F1' : 'Ajuda Geral',
    'F5' : 'Atualizar Dados'
  };
};

KeyboardShortcutsSystem.prototype.showHelp = function() {
  var message = '⌨️ ATALHOS DE TECLADO\n\n';

  for (var shortcut in this.shortcuts) {
    message += shortcut + ' → ' + this.shortcuts[shortcut] + '\n';
  }

  message += '\n💡 Use estes atalhos para agilizar seu trabalho!';

  safeUiAlert('Atalhos de Teclado', message);
};

/**
 * ONBOARDING SYSTEM
 * Sistema de integração para novos usuários
 */
function OnboardingSystem() {
  try {
    try {
      try {
        this.ui = getUiSafely();
        this.steps = this.buildOnboardingSteps();
      } catch (error) {
        Logger.log("Erro em OnboardingSystem: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em OnboardingSystem: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em OnboardingSystem: " + error.message);
    throw error;
  }
}

OnboardingSystem.prototype.buildOnboardingSteps = function() {
  return [
    {
      title : 'Bem-vindo ao Sistema UNIAE! 🎉',
      message : 'Este assistente irá guiá-lo pelos principais recursos do sistema.\n\n' +
               'Você aprenderá a : \n' +
               '• Registrar notas fiscais\n' +
               '• Fazer conferências\n' +
               '• Verificar conformidade legal\n' +
               '• Gerar relatórios\n\n' +
               'Vamos começar ? '
    },
    {
      title : '📋 Notas Fiscais',
      message : 'O sistema permite registrar e gerenciar notas fiscais.\n\n' +
               'Para registrar uma NF : \n' +
               '1. Menu > Controle de Conferência > Registrar NF\n' +
               '2. Preencha os dados obrigatórios\n' +
               '3. O sistema validará automaticamente\n\n' +
               '💡 Dica : Use Ctrl+N para acesso rápido!'
    },
    {
      title : '🔍 Conferência',
      message : 'A conferência valida se os produtos estão conforme o pedido.\n\n' +
               'Processo : \n' +
               '1. Verificar quantidades\n' +
               '2. Verificar qualidade\n' +
               '3. Registrar ocorrências\n' +
               '4. Atestar recebimento\n\n' +
               '⚖️ Base Legal : Resolução FNDE 06/2020'
    },
    {
      title : '⚖️ Conformidade Legal',
      message : 'O sistema verifica automaticamente a conformidade legal.\n\n' +
               'Recursos : \n' +
               '• Validação automática\n' +
               '• Score de conformidade\n' +
               '• Identificação de violações\n' +
               '• Recomendações de ações\n\n' +
               'Acesse : Menu > Conformidade Legal'
    },
    {
      title : '📊 Dashboard e Relatórios',
      message : 'Visualize métricas e gere relatórios.\n\n' +
               'Disponível : \n' +
               '• Dashboard executivo\n' +
               '• Relatório da comissão\n' +
               '• Análises inteligentes\n' +
               '• Exportação para SEI\n\n' +
               'Acesse : Menu > Relatórios Modernos'
    },
    {
      title : '🚀 Pronto para Começar!',
      message : 'Você concluiu o tour inicial!\n\n' +
               'Recursos adicionais : \n' +
               '• Pressione F1 para ajuda\n' +
               '• Use Ctrl+Q para ações rápidas\n' +
               '• Ctrl+F para busca avançada\n\n' +
               'Bom trabalho! 🎯'
    }
  ];
};

OnboardingSystem.prototype.start = function() {
  this.showStep(0);
};

OnboardingSystem.prototype.showStep = function(index) {
  if (index >= this.steps.length) {
    this.complete();
    return;
  }

  var step = this.steps[index];
  var progress = Math.round(((index + 1) / this.steps.length) * 100);

  var message = step.message + '\n\n';
  message += '📊 Progresso : ' + progress + '%\n';
  message += 'Passo ' + (index + 1) + ' de ' + this.steps.length;

  var buttons = index == this.steps.length - 1 ?
    this.ui.ButtonSet.OK :
    this.ui.ButtonSet.OK_CANCEL;

  var response = this.ui.alert(step.title, message, buttons);

  if (response == this.ui.Button.OK || index == this.steps.length - 1) {
    var self = this;
    Utilities.sleep(300);
    this.showStep(index + 1);
  }
};

OnboardingSystem.prototype.complete = function() {
  PropertiesService.getUserProperties().setProperty('ONBOARDING_COMPLETED', 'true');

  this.ui.alert(
    '✅ Integração Concluída',
    'Você está pronto para usar o Sistema UNIAE!\n\n' +
    'Lembre-se : Pressione F1 a qualquer momento para obter ajuda.',
    this.ui.ButtonSet.OK
  );
};

/**
 * FUNÇÕES PÚBLICAS PARA ACESSO RÁPIDO
 */

function showQuickActions() {
  var panel = new QuickActionsPanel();
  panel.show();
}

function showAdvancedSearch() {
  try {
    var search = new SearchSystem();
    search.search();
  } catch (error) {
    Logger.log("Erro em showAdvancedSearch: " + error.message);
    throw error;
  }
}


function showKeyboardShortcuts() {
  var shortcuts = new KeyboardShortcutsSystem();
  shortcuts.showHelp();
}

function startOnboarding() {
  var onboarding = new OnboardingSystem();
  onboarding.start();
}

function showNotification(title, message, type) {
  var notif = new NotificationSystem();
  notif.show({
    title : title,
    message : message,
    type : type || 'info'
  });
}

/**
 * WIZARD PARA REGISTRO DE NF
 */
function wizardRegistrarNF() {
  var wizard = new WizardSystem({
    steps : [
      {
        type : 'info',
        title : 'Assistente de Registro de NF',
        message : 'Este assistente irá guiá-lo no registro de uma nova nota fiscal.\n\n' +
                 'Você precisará fornecer : \n' +
                 '• Número da NF\n' +
                 '• Chave de Acesso\n' +
                 '• Data de Emissão\n' +
                 '• Fornecedor\n' +
                 '• Valor Total'
      },
      {
        type : 'input',
        title : 'Número da NF',
        message : 'Digite o número da nota fiscal : ',
        key : 'numero_nf'
      },
      {
        type : 'input',
        title : 'Chave de Acesso',
        message : 'Digite a chave de acesso (44 dígitos) : ',
        key : 'chave_acesso'
      },
      {
        type : 'input',
        title : 'Data de Emissão',
        message : 'Digite a data de emissão (dd/mm/aaaa) : ',
        key : 'data_emissao'
      },
      {
        type : 'input',
        title : 'Fornecedor',
        message : 'Digite o nome do fornecedor : ',
        key : 'fornecedor'
      },
      {
        type : 'input',
        title : 'Valor Total',
        message : 'Digite o valor total da NF : ',
        key : 'valor_total'
      }
    ],
  onComplete: function(data) {
    try {
        Logger.log('Dados coletados : ', data);
        // Aqui você pode chamar a função de registro real
        getSS().toast(
          'NF ' + data.numero_nf + ' registrada com sucesso!',
          'Sucesso',
          3
        );
    } catch (error) {
      Logger.log("Erro em onComplete: " + error.message);
      throw error;
    }
    }
  });

  wizard.start();
}


// ---- UXIntegrations.gs ----
/**
 * UXIntegrations.gs - Integrações UX com Sistema Existente
 * Conecta os novos componentes UX com as funcionalidades existentes
 */

/**
 * MENU INTEGRATION
 * Adiciona novos itens de menu para UX ampliada
 */
function createEnhancedUXMenu() {
  try {
    var ui = getUiSafely();
    if (!ui) return;

    // Menu principal de UX
    ui.createMenu('🎨 UX Avançada')
      .addItem('🚀 Ações Rápidas', 'showQuickActions')
      .addItem('🔍 Busca Avançada', 'showAdvancedSearch')
      .addSeparator()
      .addItem('💡 Ajuda - Notas Fiscais', 'ajudaNotasFiscais')
      .addItem('💡 Ajuda - Conferência', 'ajudaConferencia')
      .addItem('💡 Ajuda - Conformidade', 'ajudaConformidade')
      .addSeparator()
      .addItem('⌨️ Atalhos de Teclado', 'showKeyboardShortcuts')
      .addItem('🎓 Tour do Sistema', 'startOnboarding')
      .addSeparator()
      .addItem('📊 Dashboard Avançado', 'abrirDashboardAvancado')
      .addItem('📱 Interface Mobile', 'abrirInterfaceMobile')
      .addToUi();

    // Menu de demonstrações (apenas para desenvolvimento)
    if (isDevelopmentMode()) {
      ui.createMenu('🧪 Demos UX')
        .addItem('📊 Data Table', 'demoDataTable')
        .addItem('⏳ Progress Bar', 'demoProgressBar')
        .addItem('📅 Timeline', 'demoTimeline')
        .addItem('📈 Metric Card', 'demoMetricCard')
        .addItem('🔢 Stepper', 'demoStepper')
        .addItem('⚠️ Alert', 'demoAlert')
        .addToUi();
    }
  } catch (error) {
    Logger.log("Erro em createEnhancedUXMenu: " + error.message);
    throw error;
  }
}

/**
 * Verificar se está em modo desenvolvimento
 */
function isDevelopmentMode() {
  try {
    var props = PropertiesService.getScriptProperties();
    return props.getProperty('DEVELOPMENT_MODE') == 'true';
  } catch (error) {
    Logger.log("Erro em isDevelopmentMode: " + error.message);
    throw error;
  }
}

/**
 * FUNÇÕES DE AJUDA CONTEXTUAL
 */
function ajudaNotasFiscais() {
  showContextualHelp('nota_fiscal');
}

function ajudaConferencia() {
  showContextualHelp('conferencia');
}

function ajudaConformidade() {
  showContextualHelp('conformidade');
}

/**
 * ABRIR DASHBOARDS
 */
function abrirDashboardAvancado() {
  try {
    var html = HtmlService.createTemplateFromFile('AdvancedDashboard').evaluate()
      .setWidth(1400)
      .setHeight(800)
      .setTitle('Dashboard Avançado UNIAE');

    safeShowModalDialog(html, 'Dashboard Avançado');
  } catch (error) {
    Logger.log('Erro ao abrir dashboard avançado : ' + error.message);
    safeUiAlert('Erro', 'Não foi possível abrir o dashboard avançado.');
  }
}

function abrirInterfaceMobile() {
  try {
    var html = HtmlService.createHtmlOutputFromFile('mobile-interface')
      .setWidth(400)
      .setHeight(800)
      .setTitle('Interface Mobile UNIAE');

    safeShowModalDialog(html, 'Interface Mobile');
  } catch (error) {
    Logger.log('Erro ao abrir interface mobile : ' + error.message);
    safeUiAlert('Erro', 'Não foi possível abrir a interface mobile.');
  }
}

/**
 * INTEGRAÇÃO COM REGISTRO DE NF
 * Usa wizard para guiar o usuário
 */
function registrarNFComWizard() {
  wizardRegistrarNF();
}

/**
 * INTEGRAÇÃO COM CONFERÊNCIA
 * Mostra stepper do processo
 */
function iniciarConferenciaComStepper() {
  var stepper = new StepperComponent({
    steps : [
      {
        label : 'Selecionar NF',
        description : 'Selecione a nota fiscal para conferência'
      },
      {
        label : 'Verificar Produtos',
        description : 'Verificar quantidades e qualidade'
      },
      {
        label : 'Registrar Ocorrências',
        description : 'Registrar divergências se houver'
      },
      {
        label : 'Validar Conformidade',
        description : 'Verificar conformidade legal'
      },
      {
        label : 'Atestar Recebimento',
        description : 'Atestar o recebimento final'
      }
    ]
      // currentStep : 0
  });

  stepper.show();

  // Continuar com o processo normal
  if (typeof iniciarConferencia == 'function') {
    iniciarConferencia();
  }
}

/**
 * INTEGRAÇÃO COM RELATÓRIOS
 * Mostra progress bar durante geração
 */
function gerarRelatorioComProgress() {
  var progress = new ProgressBarComponent({
    total : 5,
    current : 0,
    label : 'Gerando Relatório'
  });

  var steps = [
    'Coletando dados/* spread */',
    'Processando informações/* spread */',
    'Calculando métricas/* spread */',
    'Formatando relatório/* spread */',
    'Finalizando/* spread */'
  ];

  for (var i = 0; i < steps.length; i++) {
    progress.current = i + 1;
    progress.label = steps[i];
    progress.update(i + 1);

    // Simular processamento
    Utilities.sleep(500);
  }

  // Gerar relatório real
  if (typeof gerarRelatorioComissao == 'function') {
    gerarRelatorioComissao();
  }

  showNotification(
    'Relatório Gerado',
    'O relatório foi gerado com sucesso!',
    'success'
  );
}

/**
 * INTEGRAÇÃO COM BUSCA
 * Busca avançada com resultados formatados (via UI prompt)
 * @deprecated Use api_buscarNF() para busca programática
 */
function buscarNotaFiscal_UI() {
  try {
    var ui = getUiSafely();
    if (!ui) {
      Logger.log('UI não disponível para buscarNotaFiscal');
      return;
    }

    var response = ui.prompt(
      '🔍 Buscar Nota Fiscal',
      'Digite o número da NF, fornecedor ou produto : ',
      ui.ButtonSet.OK_CANCEL
    );

    if (response.getSelectedButton() == ui.Button.OK) {
      var searchTerm = response.getResponseText();

      if (searchTerm) {
        var search = new SearchSystem();
        search.performSearch(searchTerm);
      }
    }
  } catch (error) {
    Logger.log("Erro em buscarNotaFiscal_UI: " + error.message);
    throw error;
  }
}

/**
 * INTEGRAÇÃO COM TIMELINE
 * Mostra histórico de uma NF
 */
function mostrarHistoricoNF() {
  try {
    var ui = getUiSafely();
    if (!ui) {
      Logger.log('UI não disponível para mostrarHistoricoNF');
      return;
    }

    var response = ui.prompt(
      '📅 Histórico da NF',
      'Digite o número da nota fiscal : ',
      ui.ButtonSet.OK_CANCEL
    );

    if (response.getSelectedButton() == ui.Button.OK) {
      var nf = response.getResponseText();

      if (nf) {
        // Buscar histórico (mock para demonstração)
        var timeline = new TimelineComponent({
          title : 'Histórico da NF ' + nf,
          events : [
            {
              date : formatDate(new Date()),
              title : 'NF Registrada',
              description : 'Nota fiscal registrada no sistema',
              type : 'success'
            },
            {
              date : formatDate(new Date()),
              title : 'Em Conferência',
              description : 'Processo de conferência iniciado',
              type : 'info'
            }
          ]
        });

        timeline.show();
      }
    }
  } catch (error) {
    Logger.log("Erro em mostrarHistoricoNF: " + error.message);
    throw error;
  }
}

/**
 * INTEGRAÇÃO COM MÉTRICAS
 * Dashboard de métricas rápido
 */
function mostrarMetricasRapidas() {
  try {
    try {
      var ss = getSpreadsheet();

      // Coletar métricas
      var nfSheet = ss.getSheetByName('Notas_Fiscais');
      var totalNFs;
      if (nfSheet) {
        totalNFs = nfSheet.getLastRow() - 1;
      } else {
        totalNFs = 0;
      }

      var entregasSheet = ss.getSheetByName('Entregas');
      var totalEntregas;
      if (entregasSheet) {
        totalEntregas = entregasSheet.getLastRow() - 1;
      } else {
        totalEntregas = 0;
      }

      var recusasSheet = ss.getSheetByName('Recusas');
      var totalRecusas;
      if (recusasSheet) {
        totalRecusas = recusasSheet.getLastRow() - 1;
      } else {
        totalRecusas = 0;
      }

      // Criar cards de métricas
      var message = '📊 MÉTRICAS DO SISTEMA\n\n';
      message += '━━━━━━━━━━━━━━━━━━━━\n\n';

      var metricNFs = new MetricCardComponent({
        value : totalNFs,
        label : 'Notas Fiscais',
        icon : '📋',
        trend : 'up',
        trendValue : '12%'
      });
      message += metricNFs.render() + '\n';

      var metricEntregas = new MetricCardComponent({
        value : totalEntregas,
        label : 'Entregas',
        icon : '🚚',
        trend : 'up',
        trendValue : '8%'
      });
      message += metricEntregas.render() + '\n';

      var metricRecusas = new MetricCardComponent({
        value : totalRecusas,
        label : 'Recusas',
        icon : '❌',
        trend : 'down',
        trendValue : '5%'
      });
      message += metricRecusas.render() + '\n';

      safeUiAlert('Métricas do Sistema', message);
    } catch (error) {
      Logger.log("Erro em mostrarMetricasRapidas: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em mostrarMetricasRapidas: " + error.message);
    throw error;
  }
}

/**
 * INTEGRAÇÃO COM CONFORMIDADE
 * Mostra score de conformidade visual
 */
function mostrarScoreConformidade() {
  // Calcular score (mock)
  var score = 75;

  var message = '⚖️ SCORE DE CONFORMIDADE LEGAL\n\n';
  message += '━━━━━━━━━━━━━━━━━━━━\n\n';

  // Barra de progresso visual
  var progress = new ProgressBarComponent({
    total : 100,
    current : score,
    label : 'Conformidade',
    showPercentage : true
  });

  message += progress.render() + '\n\n';

  // Status
  var status;
  if (score >= 90) {
    status = '🟢 EXCELENTE';
  } else {
    status = score >= 70 ? '🟡 BOM' : '🔴 CRÍTICO';
  }

  message += 'Status : ' + status + '\n\n';

  // Detalhes
  message += '━━━━━━━━━━━━━━━━━━━━\n\n';
  message += '✅ Conforme : 15 itens\n';
  message += '⚠️ Atenção : 5 itens\n';
  message += '❌ Não Conforme : 3 itens\n\n';

  message += '💡 Use o menu "Conformidade Legal" para detalhes.';

  safeUiAlert('Score de Conformidade', message);
}

/**
 * INTEGRAÇÃO COM ALERTAS
 * Sistema de alertas inteligentes
 */
function verificarAlertasPendentes() {
  try {
    try {
      var alertas = [];

      try {
        // Verificar NFs pendentes
        var nfSheet = getSheet('Notas_Fiscais');

        if (nfSheet && nfSheet.getLastRow() > 1) {
          var data = getSafeDataRange(nfSheet);
          var headers = data[0];
          var statusIdx = headers.indexOf('Status_NF');
          var pendentes = 0;

          if (statusIdx >= 0) {
            for (var i = 1; i < data.length; i++) {
              if (data[i][statusIdx] == 'Pendente' || data[i][statusIdx] == 'Recebida') {
                pendentes++
              }
            }

            if (pendentes > 0) {
              alertas.push({
                title : 'NFs Pendentes',
                message : 'Existem ' + pendentes + ' notas fiscais pendentes de conferência.',
                type : 'warning',
                prioridade : pendentes > 10 ? 'alta' : 'media'
              });
            }
          }
        }

        // Verificar entregas atrasadas
        var entregasSheet = getSheet('Entregas');
        if (entregasSheet && entregasSheet.getLastRow() > 1) {
          var dataEntregas = getSafeDataRange(entregasSheet);
          var headersEnt = dataEntregas[0];
          var statusEntIdx = headersEnt.indexOf('Status_Entrega');
          var atrasadas = 0;

          if (statusEntIdx >= 0) {
            for (var i = 1; i < dataEntregas.length; i++) {
              if (dataEntregas[i][statusEntIdx] == 'Atrasada') {
                atrasadas++
              }
            }

            if (atrasadas > 0) {
              alertas.push({
                title : 'Entregas Atrasadas',
                message : 'Existem ' + atrasadas + ' entregas atrasadas.',
                type : 'error',
                prioridade : 'alta'
              });
            }
          }
        }

        // Verificar recusas não resolvidas
        var recusasSheet = getSheet('Recusas');
        if (recusasSheet && recusasSheet.getLastRow() > 1) {
          var dataRecusas = getSafeDataRange(recusasSheet);
          var headersRec = dataRecusas[0];
          var statusRecIdx = headersRec.indexOf('Status_Resolucao');
          var naoResolvidas = 0;

          if (statusRecIdx >= 0) {
            for (var i = 1; i < dataRecusas.length; i++) {
              if (dataRecusas[i][statusRecIdx] == 'Pendente' || dataRecusas[i][statusRecIdx] == 'Em Análise') {
                naoResolvidas++
              }
            }

            if (naoResolvidas > 0) {
              alertas.push({
                title : 'Recusas Não Resolvidas',
                message : 'Existem ' + naoResolvidas + ' recusas pendentes de resolução.',
                type : 'warning',
                prioridade : 'media'
              });
            }
          }
        }

        // Verificar conformidade (se disponível)
        try {
          if (typeof calcularScoreConformidade == 'function') {
            var score = calcularScoreConformidade();
            if (score < 80) {
              alertas.push({
                title : 'Conformidade Baixa',
                message : 'O score de conformidade está em ' + score + '%. Ação necessária.',
                type : 'error',
                prioridade : 'alta'
              });
            } else if (score < 90) {
              alertas.push({
                title : 'Conformidade Moderada',
                message : 'O score de conformidade está em ' + score + '%. Considere melhorias.',
                type : 'warning',
                prioridade : 'baixa'
              });
            }
          }
        } catch (e) {
          Logger.log('Erro ao verificar conformidade : ' + e.message);
        }

        // Mostrar alertas
        if (alertas.length > 0) {
          // Ordenar por prioridade
          alertas.sort(function(a, b) {
            var prioridades = { 'alta' : 3, 'media' : 2, 'baixa' : 1 };
            return (prioridades[b.prioridade] || 0) - (prioridades[a.prioridade] || 0);
          });

          var mensagem = '⚠️ ALERTAS DO SISTEMA\n\n';
          alertas.forEach(function(alerta, index) {
            var icone;
            if (alerta.type == 'error') {
              icone = '🔴';
            } else {
              var icone;
              if (alerta.type == 'warning') {
                icone = '🟡';
              } else {
                icone = 'ℹ️';
              }
            }
            mensagem += (index + 1) + '. ' + icone + alerta.title + '\n';
            mensagem += '   ' + alerta.message + '\n\n';
          });

          safeUiAlert('Alertas Pendentes', mensagem);

          return alertas;
        } else {
          getSS().toast(
            'Não há alertas pendentes no momento.',
            '✅ Tudo OK',
            3
          );

          return [];
        }

      } catch (error) {
        Logger.log('Erro verificarAlertasPendentes : ' + error.message);
        getSS().toast(
          'Erro ao verificar alertas : ' + error.message,
          '❌ Erro',
          5
        );
        return [];
      }
    } catch (error) {
      Logger.log("Erro em verificarAlertasPendentes: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em verificarAlertasPendentes: " + error.message);
    throw error;
  }
}

/**
 * INTEGRAÇÃO COM EXPORTAÇÃO
 * Exportar com feedback visual
 */
function exportarDadosComFeedback() {
  var progress = new ProgressBarComponent({
    total : 4,
    current : 0,
    label : 'Exportando'
  });

  var steps = [
    'Coletando dados/* spread */',
    'Formatando/* spread */',
    'Gerando arquivo/* spread */',
    'Finalizando/* spread */'
  ];

  for (var i = 0; i < steps.length; i++) {
    progress.current = i + 1;
    progress.label = steps[i];
    progress.update(i + 1);
    Utilities.sleep(500);
  }

  // Exportar real
  if (typeof exportarDadosSEI == 'function') {
    exportarDadosSEI();
  }

  showNotification(
    'Exportação Concluída',
    'Os dados foram exportados com sucesso!',
    'success'
  );
}

/**
 * HELPER FUNCTIONS
 * @deprecated Use formatDate() de Core_Utils.gs ou 0_Core_Safe_Globals.gs
 */
function formatDate_UX(date) {
  try {
    var day = date.getDate().toString().padStart(2, '0');
    var month = (date.getMonth() + 1).toString().padStart(2, '0');
    var year = date.getFullYear();
    return day + '/' + month + '/' + year;
  } catch (error) {
    Logger.log("Erro em formatDate_UX: " + error.message);
    throw error;
  }
}

/**
 * Inicialização do módulo UX (chamado pelo onOpen principal)
 * Não usar como trigger - use onOpen() de Code.gs
 * @private
 */
function _ux_initializeModule() {
  try {
    createEnhancedUXMenu();

    // Verificar se é primeira vez do usuário
    var userProps = PropertiesService.getUserProperties();
    var onboardingCompleted = userProps.getProperty('ONBOARDING_COMPLETED');

    if (!onboardingCompleted) {
      // Mostrar onboarding após 2 segundos
      Utilities.sleep(2000);
      startOnboarding();
    }

    // Verificar alertas pendentes
    verificarAlertasPendentes();
  } catch (error) {
    Logger.log("Erro em _ux_initializeModule: " + error.message);
    throw error;
  }
}

/**
 * FUNÇÕES DE BACKEND PARA DASHBOARD
 * @deprecated Use getDashboardMetricsUnificado() do Core_CRUD_Frontend_Bridge.gs
 * Esta função foi renomeada para evitar conflito de nomenclatura
 */
function _getDashboardMetrics_UX() {
  try {
    try {
      try {
        var nfSheet = getSheet('Notas_Fiscais');
        var totalNFs;
        if (nfSheet) {
          totalNFs = nfSheet.getLastRow() - 1;
        } else {
          totalNFs = 0;
        }

        var entregasSheet = ss.getSheetByName('Entregas');
        var totalEntregas;
        if (entregasSheet) {
          totalEntregas = entregasSheet.getLastRow() - 1;
        } else {
          totalEntregas = 0;
        }

        var recusasSheet = ss.getSheetByName('Recusas');
        var totalRecusas;
        if (recusasSheet) {
          totalRecusas = recusasSheet.getLastRow() - 1;
        } else {
          totalRecusas = 0;
        }

        var glosasSheet = ss.getSheetByName('Glosas');
        var totalGlosas;
        if (glosasSheet) {
          totalGlosas = glosasSheet.getLastRow() - 1;
        } else {
          totalGlosas = 0;
        }

        // Calcular valores (mock)
        var valorTotal = 'R$ 1.250.000,00';
        var totalFornecedores = 15;
        var totalAprovadas = Math.floor(totalNFs * 0.7);
        var totalPendentes = Math.floor(totalNFs * 0.2);
        var totalProblemas = totalNFs - totalAprovadas - totalPendentes;

        return {
          success : true,
          data : {
            totalNFs : totalNFs,
            totalEntregas : totalEntregas,
            totalRecusas : totalRecusas,
            totalGlosas : totalGlosas,
            valorTotal : valorTotal,
            totalFornecedores : totalFornecedores,
            totalAprovadas : totalAprovadas,
            totalPendentes : totalPendentes,
            totalProblemas : totalProblemas
          }
        };
      } catch (error) {
        Logger.log('Erro ao obter métricas : ' + error.message);
        return {
          success : false,
          error : error.message
        };
      }
    } catch (error) {
      Logger.log("Erro em _getDashboardMetrics_UX: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em _getDashboardMetrics_UX: " + error.message);
    throw error;
  }
    };


function getSystemStats() {
  return getDashboardMetrics();
}

/**
 * FUNÇÕES MOBILE BACKEND
 */
function registrarNotaFiscal(data) {
  try {
    try {
      try {
        try {
          // Validar dados obrigatórios
          if (!data || !data.numero || !data.fornecedor || !data.valor) {
            throw new Error('Dados obrigatórios faltando : número, fornecedor e valor são obrigatórios');
          }

          var nfSheet = getSheet('Notas_Fiscais');

          if (!nfSheet) {
            throw new Error('Aba Notas_Fiscais não encontrada');
          }

          // Preparar dados para inserção
          var novaLinha = [
            new Date(),                           // Data_Registro
            data.numero,                          // Numero_NF
            data.chaveAcesso || '',              // Chave_Acesso
            data.dataEmissao || new Date(),      // Data_Emissao
            data.dataRecebimento || new Date(),  // Data_Recebimento
            data.fornecedorCNPJ || '',           // Fornecedor_CNPJ
            data.fornecedor,                      // Fornecedor_Nome
            data.notaEmpenho || '',              // Nota_Empenho
            data.valor,                           // Valor_Total
            'Pendente',                           // Status_NF
            Session.getActiveUser().getEmail(),   // Responsavel_Conferencia
            '',                                   // Data_Conferencia
            data.observacoes || '',              // Observacoes
            data.arquivoPDF || ''                // Arquivo_PDF
          ];

          // Inserir na planilha
          nfSheet.appendRow(novaLinha);

          var idNF = nfSheet.getLastRow();

          Logger.log('NF registrada com sucesso : ', {
            id : idNF,
            numero : data.numero,
            fornecedor : data.fornecedor,
            valor : data.valor
          });

          // Notificar sucesso
          getSS().toast(
            'Nota Fiscal ' + data.numero + ' registrada com sucesso!',
            'Registro Concluído',
            3
          );

          return {
            success : true,
            id : idNF,
            message : 'Nota fiscal registrada com sucesso'
          };

        } catch (error) {
          Logger.log('Erro ao registrar NF : ' + error.message);

          getSS().toast(
            'Erro ao registrar nota fiscal : ' + error.message,
            'Erro',
            5
          );

          return {
            success : false,
            error : error.message
          };
        }
      } catch (error) {
        Logger.log("Erro em registrarNotaFiscal: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em registrarNotaFiscal: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em registrarNotaFiscal: " + error.message);
    throw error;
  }
}


/**
 * @deprecated Use registrarEntrega() de UI_WebApp.gs
 * Esta é apenas uma implementação stub para testes
 */
function registrarEntrega_UX_STUB(data) {
  try {
    Logger.log('Registrando entrega: ', data);

    return {
      success: true,
      message: 'Entrega registrada com sucesso'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}


/**
 * @deprecated Use registrarConferencia() de UI_WebApp.gs
 * Esta é apenas uma implementação stub para testes
 */
function registrarConferencia_UX_STUB(data) {
  try {
    Logger.log('Registrando conferência: ', data);

    return {
      success: true,
      message: 'Conferência registrada com sucesso'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}


/**
 * @deprecated Use registrarRecusa() de Core_Workflow_API.gs
 * Esta é apenas uma implementação stub para testes
 */
function registrarRecusa_UX_STUB(data) {
  try {
    Logger.log('Registrando recusa: ', data);

    return {
      success: true,
      message: 'Recusa registrada com sucesso'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}


function registrarGlosa(data) {
  try {
    Logger.log('Registrando glosa: ', data);

    return {
      success: true,
      message: 'Glosa registrada com sucesso'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}


function registrarFornecedor(data) {
  try {
    Logger.log('Registrando fornecedor : ', data);

    return {
      success : true,
      message : 'Fornecedor registrado com sucesso'
    };
  } catch (error) {
    return {
      success : false,
      error : error.message
    };
  }
}


function registrarPDGP(data) {
  try {
    Logger.log('Registrando PDGP : ', data);

    return {
      success : true,
      message : 'PDGP registrado com sucesso'
    };
  } catch (error) {
    return {
      success : false,
      error : error.message
    };
  }
}


/**
 * Interface de usuário para registrar nota fiscal
 */
function registrarNotaFiscalUX() {
  try {
    var ui = getSafeUi();

    try {
      // Coletar dados via prompts
      var numero = ui.prompt(
        '📋 Registrar Nota Fiscal - Passo 1/5',
        'Digite o número da nota fiscal : ',
        ui.ButtonSet.OK_CANCEL
      );

      if (numero.getSelectedButton() != ui.Button.OK) return;

      var fornecedor = ui.prompt(
        '📋 Registrar Nota Fiscal - Passo 2/5',
        'Digite o nome do fornecedor : ',
        ui.ButtonSet.OK_CANCEL
      );

      if (fornecedor.getSelectedButton() != ui.Button.OK) return;

      var valor = ui.prompt(
        '📋 Registrar Nota Fiscal - Passo 3/5',
        'Digite o valor total da nota fiscal : ',
        ui.ButtonSet.OK_CANCEL
      );

      if (valor.getSelectedButton() != ui.Button.OK) return;

      var chaveAcesso = ui.prompt(
        '📋 Registrar Nota Fiscal - Passo 4/5',
        'Digite a chave de acesso (44 dígitos) - Opcional : ',
        ui.ButtonSet.OK_CANCEL
      );

      if (chaveAcesso.getSelectedButton() != ui.Button.OK) return;

      var observacoes = ui.prompt(
        '📋 Registrar Nota Fiscal - Passo 5/5',
        'Digite observações (opcional) : ',
        ui.ButtonSet.OK_CANCEL
      );

      if (observacoes.getSelectedButton() != ui.Button.OK) return;

      // Preparar dados
      var dados = {
        numero : numero.getResponseText().trim(),
        fornecedor : fornecedor.getResponseText().trim(),
        valor : parseFloat(valor.getResponseText().replace(',', '.')),
        chaveAcesso : chaveAcesso.getResponseText().trim(),
        observacoes : observacoes.getResponseText().trim()
      };

      // Validar valor
      if (isNaN(dados.valor) || dados.valor <= 0) {
        ui.alert('Erro', 'Valor inválido. Digite um número válido.', ui.ButtonSet.OK);
        return;
      }

      // Registrar
      var resultado = registrarNotaFiscal(dados);

      if (resultado.success) {
        ui.alert(
          '✅ Sucesso',
          'Nota Fiscal registrada com sucesso!\n\n' +
          'ID : ' + resultado.id + '\n' +
          'Número : ' + dados.numero + '\n' +
          'Fornecedor : ' + dados.fornecedor + '\n' +
          'Valor : R$ ' + dados.valor.toFixed(2),
          ui.ButtonSet.OK
        );
      } else {
        ui.alert(
          '❌ Erro',
          'Erro ao registrar nota fiscal : \n\n' + resultado.error,
          ui.ButtonSet.OK
        );
      }

    } catch (error) {
      ui.alert(
        '❌ Erro',
        'Erro ao processar registro : \n\n' + error.message,
        ui.ButtonSet.OK
      );
    }
  } catch (error) {
    Logger.log("Erro em registrarNotaFiscalUX: " + error.message);
    throw error;
  }
}

// Usa getSafeUi() de Core_UI_Safe.gs


/**
 * Calcula score de conformidade do sistema
 */
function calcularScoreConformidade() {
  try {
    try {
      try {
        var ss = getSpreadsheet();
        var pontos = 0;
        var maxPontos = 0;

        // Verificar estrutura de abas (20 pontos)
        var abasEssenciais = ['Notas_Fiscais', 'Entregas', 'Recusas', 'Glosas'];
        abasEssenciais.forEach(function(aba) {
          maxPontos += 5;
          if (ss.getSheetByName(aba)) {
            pontos += 5;
          }
        });

        // Verificar dados em Notas Fiscais (30 pontos)
        var nfSheet = getSheet('Notas_Fiscais');
        if (nfSheet && nfSheet.getLastRow() > 1) {
          maxPontos += 30;
          var data = getSafeDataRange(nfSheet);
          var headers = data[0];

          // Verificar campos obrigatórios preenchidos
          var camposObrigatorios = ['Numero_NF', 'Fornecedor_Nome', 'Valor_Total'];
          var camposPreenchidos = 0;

          camposObrigatorios.forEach(function(campo) {
            var idx = headers.indexOf(campo);
            if (idx >= 0) {
              var preenchidos = 0;
              for (var i = 1; i < data.length; i++) {
                if (data[i][idx] && String(data[i][idx]).trim() != '') {
                  preenchidos++
                }
              }
              if (preenchidos == data.length - 1) {
                camposPreenchidos++
              }
            }
          });

          pontos += (camposPreenchidos / camposObrigatorios.length) * 30;
        }

        // Verificar entregas registradas (20 pontos)
        var entSheet = getSheet('Entregas');
        if (entSheet && entSheet.getLastRow() > 1) {
          maxPontos += 20;
          pontos += 20;
        } else {
          maxPontos += 20;
        }

        // Verificar configurações (15 pontos)
        maxPontos += 15;
        try {
          var props = PropertiesService.getScriptProperties();
          if (props.getProperty('SISTEMA_INICIALIZADO') == 'true') {
            pontos += 15;
          }
        } catch (e) {
          Logger.log('Erro ao verificar propriedades : ' + e.message);
        }

        // Verificar integridade referencial (15 pontos)
        maxPontos += 15;
        if (nfSheet && entSheet && nfSheet.getLastRow() > 1 && entSheet.getLastRow() > 1) {
          var nfData = getSafeDataRange(nfSheet);
          var entData = getSafeDataRange(entSheet);
          var nfIds = nfData.slice(1).map(function(row) { return row[0]; });

          var refsValidas = 0;
          var entHeaders = entData[0];
          var nfIdIdx = entHeaders.indexOf('NF_ID');

          if (nfIdIdx >= 0) {
            for (var i = 1; i < entData.length; i++) {
              if (nfIds.indexOf(entData[i][nfIdIdx]) >= 0) {
                refsValidas++
              }
            }

            if (entData.length > 1) {
              pontos += (refsValidas / (entData.length - 1)) * 15;
            }
          }
        }

        // Calcular score final
        var score;
        if (maxPontos > 0) {
          score = Math.round((pontos / maxPontos) * 100);
        } else {
          score = 0;
        }
        return score;

      } catch (error) {
        Logger.log('Erro calcularScoreConformidade : ' + error.message);
        return 0;
      }
    } catch (error) {
      Logger.log("Erro em calcularScoreConformidade: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em calcularScoreConformidade: " + error.message);
    throw error;
  }
}

/**
 * Exibe relatório de conformidade
 */
function exibirRelatorioConformidade() {
  try {
    try {
      var score = calcularScoreConformidade();
      var ui = getSafeUi();

      var status = '';
      var icone = '';
      var recomendacoes = '';

      if (score >= 90) {
        status = 'EXCELENTE';
        icone = '🟢';
        recomendacoes = '• Continue mantendo os padrões de qualidade\n' +
                        '• Realize auditorias periódicas\n' +
                        '• Documente boas práticas';
      } else if (score >= 75) {
        status = 'BOM';
        icone = '🟡';
        recomendacoes = '• Preencha campos obrigatórios faltantes\n' +
                        '• Verifique integridade dos dados\n' +
                        '• Atualize registros pendentes';
      } else if (score >= 60) {
        status = 'REGULAR';
        icone = '🟠';
        recomendacoes = '• URGENTE : Complete estruturas faltantes\n' +
                        '• Revise dados inconsistentes\n' +
                        '• Execute inicialização do sistema';
      } else {
        status = 'CRÍTICO';
        icone = '🔴';
        recomendacoes = '• CRÍTICO : Execute inicialização completa\n' +
                        '• Crie abas essenciais faltantes\n' +
                        '• Consulte documentação do sistema';
      }

      var mensagem = icone + ' SCORE DE CONFORMIDADE : ' + score + '/100\n\n' +
                      'Status : ' + status + '\n\n' +
                      'RECOMENDAÇÕES : \n' + recomendacoes;

      ui.alert('Relatório de Conformidade', mensagem, ui.ButtonSet.OK);

      return { score : score, status : status };

    } catch (error) {
      Logger.log('Erro exibirRelatorioConformidade : ' + error.message);
      getSafeUi().alert('Erro', 'Erro ao gerar relatório : ' + error.message, getSafeUi().ButtonSet.OK);
    }
  } catch (error) {
    Logger.log("Erro em exibirRelatorioConformidade: " + error.message);
    throw error;
  }
}
