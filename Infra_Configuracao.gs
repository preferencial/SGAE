'use strict';

/**
 * INFRA_CONFIGURACAO
 * Consolidado de : Configuracoes.gs, PerformanceConfig.gs, Architecture.gs
 * @version 2.0.0
 * @created 2025-11-04
 */


// ---- Configuracoes.gs ----
/**
 * Configuracoes.gs
 * Módulo para configurações do sistema
 */

// Função para configurar chave API do Gemini
function configurarChaveGemini() {
  var ui = getSafeUi();
  var props = PropertiesService.getScriptProperties();

  var chaveAtual = props.getProperty('GEMINI_API_KEY');
  var mensagem = chaveAtual ?
    'Chave API já configurada. Digite a nova chave ou deixe em branco para manter a atual : ' :
    'Digite a chave API do Gemini : ';

  var response = ui.prompt(
    'Configurar Chave API Gemini',
    mensagem,
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() != ui.Button.OK) {
    return;
  }

  var novaChave = response.getResponseText().trim();
  if (novaChave) {
    props.setProperty('GEMINI_API_KEY', novaChave);
    safeAlert('Sucesso', 'Chave API configurada com sucesso!', ui.ButtonSet.OK);
  } else if (!chaveAtual) {
    safeAlert('Aviso', 'Nenhuma chave foi configurada.', ui.ButtonSet.OK);
  }
}

// Função para configurar membros da comissão
function configurarMembrosComissao() {
  try {
    var ui = getSafeUi();
    var props = PropertiesService.getScriptProperties();

    var membrosAtual = props.getProperty('MEMBROS_COMISSAO');
    var membros;
    if (membrosAtual) {
      membros = JSON.parse(membrosAtual);
    } else {
      membros = [
        {nome : 'PATRICIA BENITES SANTOS', cargo : 'TITULAR'},
        {nome : 'MÁRCIA APARECIDA MARTINS DE GODOY', cargo : 'TITULAR'},
        {nome : 'ANTÔNIO CARLOS COSTA DE SOUZA', cargo : 'TITULAR'}
      ];
    }

    var ss = getSS();
    var configSheet = ss.getSheetByName('Config_Comissao') || ss.insertSheet('Config_Comissao');
    configSheet.clear();

    var output = [
      ['CONFIGURAÇÃO - MEMBROS DA COMISSÃO'],
      [''],
      ['Edite os membros abaixo e clique em "Salvar Configuração"'],
      [''],
      ['Nome Completo', 'Cargo']
    ];

    membros.forEach(function(m) {
      output.push([m.nome, m.cargo]);
    });

    // Adicionar linhas vazias para novos membros
    for (var i = 0; i < 3; i++) {
      output.push(['', '']);
    }

    configSheet.getRange(1, 1, output.length, 2).setValues(output);
    configSheet.getRange(1, 1).setFontWeight('bold').setFontSize(14);
    configSheet.getRange(5, 1, 1, 2).setFontWeight('bold').setBackground('#673AB7').setFontColor('#FFFFFF');

    ss.setActiveSheet(configSheet);

    safeAlert('Configuração de Membros',
      'Edite a aba "Config_Comissao" com os dados dos membros.\n\n' +
      'Depois, use a opção "Salvar Configuração" no menu Configurações.',
      ui.ButtonSet.OK);
  } catch (error) {
    Logger.log("Erro em configurarMembrosComissao: " + error.message);
    throw error; // Re-lança para tratamento superior
  }
}

// Função para salvar configuração de membros
function salvarConfiguracaoMembros() {
  var ui = getSafeUi();
  var ss = getSS();
  var configSheet = ss.getSheetByName('Config_Comissao');

  if (!configSheet) {
    ui.alert('Erro', 'Aba de configuração não encontrada. Execute primeiro "Configurar Membros da Comissão".', ui.ButtonSet.OK);
    return;
  }

  var data = configSheet.getDataRange().getValues();
  var membros = [];

  for (var i = 5; i < data.length; i++) {
    var nome = String(data[i][0]).trim();
    var cargo = String(data[i][1]).trim();

    if (nome && cargo) {
      membros.push({nome : nome, cargo: cargo});
    }
  }

  if (membros.length == 0) {
    safeAlert('Erro', 'Nenhum membro válido encontrado.', ui.ButtonSet.OK);
  }

  var props = PropertiesService.getScriptProperties();
  props.setProperty('MEMBROS_COMISSAO', JSON.stringify(membros));

  safeAlert('Sucesso',
    'Configuração salva com sucesso!\n\n' +
    'Membros cadastrados : ' + membros.length,
    ui.ButtonSet.OK);
}

// Função para configurar textos padrão
function configurarTextosPadrao() {
  try {
    var ui = getSafeUi();
    var ss = getSS();

    var configSheet = ss.getSheetByName('Config_Textos_Padrao') || ss.insertSheet('Config_Textos_Padrao');
    configSheet.clear();

    var props = PropertiesService.getScriptProperties();

    var textoPadraoAtesto = props.getProperty('TEXTO_PADRAO_ATESTO') ||
      'A Comissão de Recebimento de Gêneros Alimentícios, constituída por meio da Ordem de Serviço nº 03 de 16 de junho de 2025, ' +
      'publicada no DODF Nº 114, DE 23 DE JUNHO DE 2025, atesta o recebimento dos materiais descritos nos documentos fiscais ' +
      'discriminados no quadro abaixo. Atesta, ainda, a autenticidade da fatura por meio de consulta realizada no site da nota fiscal ' +
      'eletrônica em [DATA].';

    var textoPadraoGEVMON = props.getProperty('TEXTO_PADRAO_GEVMON') ||
      'À GEVMON,\n\nEncaminhamos as notas fiscais da [FORNECEDOR], devidamente atestadas pela comissão de recebimento de ' +
      'gêneros alimentícios desta unidade constantes no atesto n°[NUMERO] realizada no período de [PERIODO].';

    var output = [
      ['CONFIGURAÇÃO - TEXTOS PADRÃO'],
      [''],
      ['Edite os textos abaixo conforme necessário'],
      ['Use os marcadores : [DATA], [FORNECEDOR], [NUMERO], [PERIODO]'],
      [''],
      ['Texto Padrão para Atesto : '],
      [textoPadraoAtesto],
      [''],
      ['Texto Padrão para GEVMON : '],
      [textoPadraoGEVMON],
      [''],
      ['Para salvar, edite os textos acima e execute "Salvar Textos Padrão"']
    ];

    configSheet.getRange(1, 1, output.length, 1).setValues(output);
    configSheet.getRange(1, 1).setFontWeight('bold').setFontSize(14);
    configSheet.setColumnWidth(1, 800);

    ss.setActiveSheet(configSheet);
    safeAlert('Configuração de Textos',
      'Edite os textos padrão na aba criada.',
      ui.ButtonSet.OK);
  } catch (error) {
    Logger.log("Erro em configurarTextosPadrao: " + error.message);
    throw error; // Re-lança para tratamento superior
  }
}

/**
 * Configurar restrições de processamento para reduzir tempo de execução.
 * Opções : período (mes, trimestre, semestre, ano, tudo), max registros por execução e mapeamento de grupos de produtos.
 */
function configurarRestricoesProcessamento() {
  var ui = getSafeUi();
  var props = PropertiesService.getScriptProperties();
  var currentPeriod = props.getProperty('PROCESS_PERIOD') || 'trimestre';
  var currentMax = props.getProperty('PROCESS_MAX_RECORDS') || '200';
  var currentGroups = props.getProperty('PRODUCT_GROUPS_JSON') || JSON.stringify({
    "graos" : ["arroz","feijão","feijao","milho"],
    "laticinios" : ["leite","queijo","iogurte"],
    "oleaginosas" : ["soja","óleo","oleo"],
    "hortifruti" : ["tomate","alface","cenoura","batata"]
  }, null, 2);

  var form = safePrompt(
    'Configurar Restrições de Processamento',
    'Período (mes|trimestre|semestre|ano|tudo) : [' + currentPeriod + ']\n' +
    'Máx registros por execução (número) : [' + currentMax + ']\n\n' +
    'Mapeamento de grupos (JSON) - cada chave -> lista de keywords (ex : {"graos" : ["arroz","feijao"]}) : \n' + currentGroups,
    ui.ButtonSet.OK_CANCEL
  );

  if (form.getSelectedButton() != ui.Button.OK) return;

  var txt = form.getResponseText();
  // Tentativa simples de ler 3 seções separadas por linhas - se usuário colar JSON longo, espera-se editar manualmente via propriedade
  var lines = txt.split(/\r ? \n/).filter(Boolean);
  var period = currentPeriod, maxRecords = currentMax, groupsJson = currentGroups;
  // heurística : se input contém " : " assume JSON -> substituir grupos apenas
  if (txt.indexOf('{') >= 0) {
    try {
      JSON.parse(txt); // se só JSON foi colado
      groupsJson = txt;
    } catch (e) {
      // se não for JSON, tentar extrair period & max do inicio
      if (lines.length >= 1) {
        var first = lines[0].trim();
        if (first.match(/^(mes|trimestre|semestre|ano|tudo)$/i)) period = first;
      }
      if (lines.length >= 2) {
        var second = lines[1].trim();
        if (!isNaN(Number(second))) maxRecords = second;
      }
    }
  } else {
    // parse linha por linha
    if (lines.length >= 1 && lines[0].match(/^(mes|trimestre|semestre|ano|tudo)$/i)) period = lines[0].trim();
    if (lines.length >= 2 && !isNaN(Number(lines[1].trim()))) maxRecords = lines[1].trim();
    if (lines.length >= 3) {
      // resta : juntar restante como JSON
      try {
        var rest = lines.slice(2).join('\n');
        JSON.parse(rest);
        groupsJson = rest;
      } catch (e) {
        // manter atual
      }
    }
  }

  props.setProperty('PROCESS_PERIOD', period.toLowerCase());
  props.setProperty('PROCESS_MAX_RECORDS', String(Number(maxRecords) || 200));
  props.setProperty('PRODUCT_GROUPS_JSON', groupsJson);

  safeAlert('Configurações salvas', 'Período : ' + period + '\nMáx registros : ' + maxRecords + '\nMapeamento de grupos atualizado.', ui.ButtonSet.OK);
}

// Função sobre o sistema
function sobreSistema() {
  var ui = getSafeUi();

  var mensagem = '═══════════════════════════════════════════════\n' +
    '    SISTEMA DE ANÁLISE DE NOTAS FISCAIS\n' +
    '    E CONTROLE DE ENTREGAS\n' +
    '═══════════════════════════════════════════════\n\n' +

    '📋 Unidade : CRE Plano Piloto e Cruzeiro - UNIAE\n\n' +

    '📜 Base Legal : \n' +
    '   • Portaria nº 244, de 31/07/2006\n' +
    '   • Lei nº 8.666/93\n' +
    '   • Lei Federal nº 11.947/09\n\n' +

    '🎯 Finalidade : \n' +
    '   Auxiliar a Comissão de Recebimento de Gêneros\n' +
    '   Alimentícios na conferência de produtos e atesto\n' +
    '   de Notas Fiscais referentes às entregas nas\n' +
    '   Unidades Escolares.\n\n' +

    '⚙️ Funcionalidades Principais : \n' +
    '   ✓ Verificação de Notas Fiscais\n' +
    '   ✓ Controle de Entregas por Unidade\n' +
    '   ✓ Gestão de Recusas e Glosas\n' +
    '   ✓ Análises e Auditorias\n' +
    '   ✓ Geração de Relatórios Oficiais\n' +
    '   ✓ Avaliação de Fornecedores\n' +
    '   ✓ Verificação de Conformidade\n\n' +

    '📊 Análises Disponíveis : \n' +
    '   • Detecção de Irregularidades\n' +
    '   • Identificação de Tendências\n' +
    '   • Preços Antieconômicos\n' +
    '   • Análise Generativa (Gemini AI)\n\n' +

    '📄 Relatórios : \n' +
    '   • Atesto para GEVMON\n' +
    '   • Relatório da Comissão\n' +
    '   • Demonstrativo de Consumo\n' +
    '   • Exportação para SEI\n\n' +

    '💾 Backup : \n' +
    '   • Manual ou Automático (diário)\n' +
    '   • Armazenado no Google Drive\n\n' +

    '═══════════════════════════════════════════════\n' +
    'Versão : 1.0\n' +
    'Desenvolvido para atender a rotina da UNIAE\n' +
    'e da Comissão de Recebimento de Gêneros\n' +
    '═══════════════════════════════════════════════';

  safeAlert('Sobre o Sistema', mensagem, ui.ButtonSet.OK);
}


// ---- PerformanceConfig.gs ----
/**
 * PerformanceConfig.gs
 * Configurações e helpers para otimização de performance e prevenção de timeouts
 */

// Limites de processamento padrão
var PERFORMANCE_LIMITS = {
  MAX_ROWS_PER_EXECUTION : 500,        // Máximo de linhas processadas por execução
  MAX_EXECUTION_TIME_MS : 240000,      // 4 minutos (Apps Script tem timeout de ~5-6 min)
  BATCH_SIZE : 100,                     // Tamanho do lote para processamento
  CACHE_DURATION_SECONDS : 300,         // 5 minutos de cache
  MAX_SHEETS_TO_PROCESS : 5             // Máximo de abas processadas por vez
};

/**
 * Obtém dados de uma planilha com limite de linhas
 */
function getSheetDataSafe(sheet, maxRows) {
  if (!sheet) return [];

  maxRows = maxRows || PERFORMANCE_LIMITS.MAX_ROWS_PER_EXECUTION;
  var lastRow = Math.min(sheet.getLastRow(), maxRows + 1); // +1 para incluir header;

  if (lastRow <= 1) return [];

  try {
    return sheet.getRange(1, 1, lastRow, sheet.getLastColumn()).getValues();
  } catch (e) {
    Logger.log('getSheetDataSafe : erro ao carregar dados : ' + e.message);
    return [];
  }
}

/**
 * Verifica se ainda há tempo de execução disponível
 */
function hasExecutionTimeRemaining(startTime, bufferMs) {
  bufferMs = bufferMs || 30000; // Buffer de 30 segundos
  var elapsed = new Date().getTime() - startTime;
  return elapsed < (PERFORMANCE_LIMITS.MAX_EXECUTION_TIME_MS - bufferMs);
}

/**
 * Processa dados em lotes para evitar timeout
 */
function processBatches(data, processFn, batchSize) {
  batchSize = batchSize || PERFORMANCE_LIMITS.BATCH_SIZE;
  var startTime = new Date().getTime();
  var results = [];

  for (var i = 0; i < data.length; i += batchSize) {
    // Verifica se ainda há tempo
    if (!hasExecutionTimeRemaining(startTime)) {
      Logger.log('processBatches : timeout iminente. Processados ' + i + ' de ' + data.length + ' itens.');
      break;
    }

    var batch = data.slice(i, Math.min(i + batchSize, data.length));
    var batchResults = processFn(batch);

    if (batchResults && batchResults.length > 0) {
      results = results.concat(batchResults);
    }

    // Pequena pausa para evitar rate limits
    if (i % (batchSize * 3) == 0) {
      Utilities.sleep(100);
    }
  }

  return results;
}

/**
 * Cache simples usando CacheService
 */
function getCachedData(key, fetchFn, expirationSeconds) {
  var cache = CacheService.getScriptCache();
  expirationSeconds = expirationSeconds || PERFORMANCE_LIMITS.CACHE_DURATION_SECONDS;

  var cached = cache.get(key);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      Logger.log('getCachedData : erro ao parsear cache : ' + e.message);
      return null;
    }
  }

  // Buscar dados frescos
  var data = fetchFn();

  // Cachear (com limite de tamanho)
  try {
    var serialized = JSON.stringify(data);
    if (serialized.length < 90000) { // CacheService tem limite de ~100KB
      cache.put(key, serialized, expirationSeconds);
    }
  } catch (e) {
    Logger.log('getCachedData : erro ao cachear : ' + e.message);
  }

  return data;
}

/**
 * Limpa todo o cache
 */
function clearPerformanceCache() {
  CacheService.getScriptCache().removeAll(['dashboard_metrics', 'nf_summary', 'glosas_summary']);
  Logger.log('Cache limpo com sucesso');
}

/**
 * Obter configuração de limite personalizado
 */
function getPerformanceLimit(key) {
  var props = PropertiesService.getScriptProperties();
  var customLimit = props.getProperty('PERF_' + key);
  return customLimit ? Number(customLimit) : PERFORMANCE_LIMITS[key];
}

/**
 * Definir limite personalizado
 */
function setPerformanceLimit(key, value) {
  var props = PropertiesService.getScriptProperties();
  props.setProperty('PERF_' + key, String(value));
  Logger.log('Limite ' + key + ' definido para : ' + value);
}


// ---- Architecture.gs ----
/**
 * Architecture.gs - Arquitetura SOLID para Sistema UNIAE
 * Implementa os 5 princípios SOLID para melhor manutenibilidade e extensibilidade
 *
 * SOLID PRINCIPLES :
 * S - Single Responsibility Principle (SRP)
 * O - Open/Closed Principle (OCP)
 * L - Liskov Substitution Principle (LSP)
 * I - Interface Segregation Principle (ISP)
 * D - Dependency Inversion Principle (DIP)
 */

/**
 * INTERFACES (ISP - Interface Segregation Principle)
 * Interfaces pequenas e específicas para cada responsabilidade
 */

// Interface para validação
var IValidator = {
  validate: function(data) { throw new Error('Method must be implemented'); }
};

// Interface para repositório de dados
var IRepository = {
  save: function(data) { throw new Error('Method must be implemented'); },
  findById: function(id) { throw new Error('Method must be implemented'); },
  findAll: function() { throw new Error('Method must be implemented'); },
  update: function(id, data) { throw new Error('Method must be implemented'); },
  delete: function(id) { throw new Error('Method must be implemented'); }
};

// Interface para serviços de negócio
var IBusinessService = {
  execute: function(params) { throw new Error('Method must be implemented'); }
};

// Interface para notificações
var INotificationService = {
  notify: function(message, type) { throw new Error('Method must be implemented'); }
};

// Interface para relatórios
var IReportGenerator = {
  generate: function(data) { throw new Error('Method must be implemented'); },
  export: function(report, format) { throw new Error('Method must be implemented'); }
};

/**
 * FACTORY PATTERN (OCP - Open/Closed Principle)
 * Permite extensão sem modificação do código existente
 */
var ServiceFactory = {

  // Registry de serviços
  _services : {},

  // Registra um serviço
  register: function(name, serviceClass) {
    this._services[name] = serviceClass;
  },

  // Cria instância de um serviço
  create: function(name, dependencies) {
    var ServiceClass = this._services[name];
    if (!ServiceClass) {
      throw new Error('Service not found : ' + name);
    }
    return new ServiceClass(dependencies);
  },

  // Lista serviços disponíveis
  list: function() {
    return Object.keys(this._services);
  }
};

/**
 * DEPENDENCY INJECTION CONTAINER (DIP - Dependency Inversion Principle)
 * Inverte dependências para facilitar testes e manutenção
 */
var DIContainer = {

  // Container de dependências
  _dependencies : {},
  _singletons : {},

  // Registra uma dependência
  bind: function(name, factory, singleton) {
    this._dependencies[name] = {
      factory : factory,
      singleton : singleton || false
    };
  },

  // Resolve uma dependência
  resolve: function(name) {
    var dependency = this._dependencies[name];
    if (!dependency) {
      throw new Error('Dependency not found : ' + name);
    }

    // Se é singleton e já foi criado, retorna a instância
    if (dependency.singleton && this._singletons[name]) {
      return this._singletons[name];
    }

    // Cria nova instância
    var instance = dependency.factory();

    // Se é singleton, armazena para reutilização
    if (dependency.singleton) {
      this._singletons[name] = instance;
    }

    return instance;
  },

  // Limpa singletons (útil para testes)
  clearSingletons: function() {
    this._singletons = {};
  }
};

/**
 * BASE CLASSES (LSP - Liskov Substitution Principle)
 * Classes base que podem ser substituídas por suas implementações
 */

/**
 * Classe base para validadores (SRP - Single Responsibility)
 */
function BaseValidator() {
  this.errors = [];
}

BaseValidator.prototype.validate = function(data) {
  this.errors = [];
  return this._doValidate(data);
};

BaseValidator.prototype._doValidate = function(data) {
  throw new Error('Method must be implemented by subclass');
};

BaseValidator.prototype.addError = function(field, message) {
  this.errors.push({ field : field, message : message });
};

BaseValidator.prototype.hasErrors = function() {
  return this.errors.length > 0;
};

BaseValidator.prototype.getErrors = function() {
  return this.errors;
};

/**
 * Classe base para repositórios legados (SRP - Single Responsibility)
 */
function LegacyBaseRepository(sheetName) {
  try {
    if (!sheetName || typeof sheetName != 'string') {
      throw new Error('LegacyBaseRepository requer um sheetName válido. Recebido : ' + sheetName);
    }
    this.sheetName = sheetName;
    this.sheet = null;
  } catch (error) {
    Logger.log("Erro em LegacyBaseRepository: " + error.message);
    throw error; // Re-lança para tratamento superior
  }
}

LegacyBaseRepository.prototype.getSheet = function() {
  if (!this.sheetName) {
    throw new Error('sheetName não definido no repositório');
  }
  if (!this.sheet) {
    var sheetName = this.sheetName || 'Configuracoes';
    this.sheet = getOrCreateSheetSafe(sheetName);
  }
};

LegacyBaseRepository.prototype.save = function(data) {
  var sheet = this.getSheet();
  var headers = this.getHeaders();
  var row = this.mapDataToRow(data, headers);

  var lastRow = sheet.getLastRow();
  sheet.getRange(lastRow + 1, 1, 1, row.length).setValues([row]);

};

LegacyBaseRepository.prototype.findById = function(id) {
  var data = this.findAll();
  return data.find(function(item) { return item.id == id; });
};

LegacyBaseRepository.prototype.findAll = function() {
  var sheet = this.getSheet();
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var rows = data.slice(1);

  var self = this;
  return rows.map(function(row) {
    return self.mapRowToData(row, headers);
  });
};

LegacyBaseRepository.prototype.update = function(id, data) {
  var sheet = this.getSheet();
  var allData = sheet.getDataRange().getValues();
  var headers = allData[0];

  for (var i = 1; i < allData.length; i++) {
    var rowData = this.mapRowToData(allData[i], headers);
    if (rowData.id == id) {
      var updatedRow = this.mapDataToRow(Object.assign(rowData, data), headers);
      sheet.getRange(i + 1, 1, 1, updatedRow.length).setValues([updatedRow]);
    }
  }

};

LegacyBaseRepository.prototype.delete = function(id) {
  var sheet = this.getSheet();
  var allData = sheet.getDataRange().getValues();
  var headers = allData[0];

  for (var i = 1; i < allData.length; i++) {
    var rowData = this.mapRowToData(allData[i], headers);
    if (rowData.id == id) {
      sheet.deleteRow(i + 1);
    }
  }

};

LegacyBaseRepository.prototype.getHeaders = function() {
  throw new Error('Method must be implemented by subclass');
};

LegacyBaseRepository.prototype.mapDataToRow = function(data, headers) {
  throw new Error('Method must be implemented by subclass');
};

LegacyBaseRepository.prototype.mapRowToData = function(row, headers) {
  throw new Error('Method must be implemented by subclass');
};

LegacyBaseRepository.prototype.generateId = function() {
  return Utilities.getUuid();
};

/**
 * CONFIGURAÇÃO INICIAL DO CONTAINER DI
 */
function initializeDIContainer() {

  // Registrar serviços básicos
  DIContainer.bind('notificationService', function() {
    return new UINotificationService();
  }, true);

  DIContainer.bind('legalFramework', function() {
    return new LegalFrameworkService();
  }, true);

  DIContainer.bind('complianceValidator', function() {
    return new ComplianceValidatorService();
  }, true);

  // Registrar repositórios
  DIContainer.bind('notaFiscalRepository', function() {
    return new NotaFiscalRepository();
  });

  DIContainer.bind('controleConferenciaRepository', function() {
    return new ControleConferenciaRepository();
  });

  DIContainer.bind('recusaRepository', function() {
    return new RecusaRepository();
  });

  DIContainer.bind('glosaRepository', function() {
    return new GlosaRepository();
  });

  Logger.log('DI Container initialized with ' + Object.keys(DIContainer._dependencies).length + ' dependencies');
}

/**
 * HELPER FUNCTIONS PARA SOLID
 */

/**
 * Cria uma instância seguindo o padrão Factory
 */
function createService(serviceName, dependencies) {
  // Validar parâmetros
  if (!serviceName || typeof serviceName != 'string') {
    throw new Error('Nome do serviço inválido : ' + serviceName);
  }
  return ServiceFactory.create(serviceName, dependencies);
}

/**
 * Resolve dependências usando DI Container
 */
function resolve(dependencyName) {
  return DIContainer.resolve(dependencyName);
}

/**
 * Registra um novo serviço no factory
 */
function registerService(name, serviceClass) {
  ServiceFactory.register(name, serviceClass);
}

/**
 * Executa uma operação com injeção de dependências
 */
function executeWithDI(serviceClass, dependencies, method, params) {
  var service = new serviceClass(dependencies);
  return service[method](params);
}

/**
 * VALIDATION HELPERS (SRP)
 */
function validateRequired(value, fieldName) {
  if (!value || (typeof value == 'string' && value.trim() == '')) {
    throw new Error(fieldName + ' é obrigatório');
  }
}

function validateEmail(email) {
  var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Email inválido');
  }
}

function validateNumber(value, fieldName) {
  if (isNaN(Number(value))) {
    throw new Error(fieldName + ' deve ser um número válido');
  }
}

function validateDate(date, fieldName) {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error(fieldName + ' deve ser uma data válida');
  }
}

/**
 * LOGGING HELPER (SRP)
 */
var SystemLogger = {

  //   logLevel : 'INFO'
  setLogLevel: function(level) {
    this.logLevel = level;
  },
  debug: function(message, data) {
    if (this.shouldLog('DEBUG')) {
      this._log('DEBUG', message, data);
    }
  },
  info: function(message, data) {
    if (this.shouldLog('INFO')) {
      this._log('INFO', message, data);
    }
  },
  warn: function(message, data) {
    if (this.shouldLog('WARN')) {
      this._log('WARN', message, data);
    }
  },
  error: function(message, error) {
    if (this.shouldLog('ERROR')) {
      this._log('ERROR', message, error);
    }
  },
  shouldLog: function(level) {
    var levels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    var currentLevelIndex = levels.indexOf(this.logLevel);
    var messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  },
  _log: function(level, message, data) {
    var timestamp = new Date().toISOString();
    var logMessage = '[' + timestamp + '] [' + level + '] ' + message;

    if (data) {
      logMessage += ' | Data : ' + JSON.stringify(data);
    }

    Logger.log(logMessage);
  }
};

/**
 * INICIALIZAÇÃO DA ARQUITETURA
 */
function initializeSOLIDArchitecture() {
  try {
    SystemLogger.info('Initializing SOLID Architecture/* spread */');

    // Inicializar DI Container
    initializeDIContainer();

    // Registrar serviços no factory
    registerCoreServices();

    // Configurar logging
    SystemLogger.setLogLevel('INFO');

    SystemLogger.info('SOLID Architecture initialized successfully');

    return {
      success : true,
      services : ServiceFactory.list(),
      dependencies : Object.keys(DIContainer._dependencies)
    };

  } catch (error) {
    SystemLogger.error('Failed to initialize SOLID Architecture', error);
    throw error;
  }
}


/**
 * Registra serviços principais no factory
 */
function registerCoreServices() {
  // Será implementado nas próximas classes específicas
  SystemLogger.info('Core services registration completed');
}

/**
 * HEALTH CHECK DA ARQUITETURA
 */
function checkArchitectureHealth() {
  var health = {
    diContainer : {
      dependencies : Object.keys(DIContainer._dependencies).length,
      singletons : Object.keys(DIContainer._singletons).length
    },
    serviceFactory : {
      services : ServiceFactory.list().length
    },
    status : 'HEALTHY'
  };

  SystemLogger.info('Architecture health check', health);
  return health;
}
