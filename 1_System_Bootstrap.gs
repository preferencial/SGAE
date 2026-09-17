/**
 * @fileoverview Bootstrap Consolidado do Sistema
 * @version 6.0.0
 *
 * Inicializa o sistema de forma ordenada, garantindo que todas
 * as dependências estejam carregadas corretamente.
 *
 * @author UNIAE CRE Team
 * @created 2025-12-04
 */

'use strict';

/**
 * Estado do sistema
 */
var SystemState = {
  initialized: false,
  initTime: null,
  version: '6.0.0',
  modules: {},
  errors: [],
  warnings: []
};

/**
 * Inicializa o sistema completo
 * @param {Object} [options] - Opções de inicialização
 * @returns {Object} Resultado da inicialização
 */
function initializeSystem(options) {
  options = options || {};

  if (SystemState.initialized && !options.force) {
    return {
      success: true,
      message: 'Sistema já inicializado',
      version: SystemState.version,
      state: SystemState
    };
  }

  var startTime = new Date().getTime();
  SystemState.errors = [];
  SystemState.warnings = [];

  // Log silencioso se solicitado
  var log = options.silent ? function() {} : Logger.log;

  log('═══════════════════════════════════════════════════════════');
  log('   INICIALIZANDO SISTEMA UNIAE CRE v' + SystemState.version);
  log('═══════════════════════════════════════════════════════════');
  log('');

  // 1. Inicializa monitoramento de cotas
  _initModule('QuotaManager', function() {
    if (typeof initQuotaMonitoring === 'function') {
      initQuotaMonitoring();
      return true;
    }
    return false;
  });

  // 2. Verifica módulos essenciais
  _initModule('SafeGlobals', function() {
    return typeof safeGet === 'function' &&
           typeof getSafeUi === 'function' &&
           typeof AppLogger !== 'undefined';
  });

  // 3. Verifica Schema
  _initModule('Schema', function() {
    return typeof SCHEMA !== 'undefined' &&
           typeof SCHEMA.getSheetName === 'function';
  });

  // 4. Verifica acesso a planilhas
  _initModule('SheetAccessor', function() {
    return typeof getSheet === 'function' &&
           typeof getSheetHeaders === 'function';
  });

  // 5. Verifica autenticação
  _initModule('Auth', function() {
    return typeof AUTH !== 'undefined' ||
           typeof AuthService !== 'undefined' ||
           typeof authLogin === 'function';
  });

  // 6. Verifica validação
  _initModule('Validation', function() {
    return typeof ValidationUtils !== 'undefined' ||
           typeof validateRequired === 'function';
  });

  // 7. Verifica operações em lote
  _initModule('BatchOperations', function() {
    return typeof BatchOperations !== 'undefined';
  });

  // 8. Verifica CRUD
  _initModule('CRUD', function() {
    return typeof CRUD !== 'undefined' ||
           typeof appendToSheet === 'function';
  });

  // 9. Verifica ErrorHandler
  _initModule('ErrorHandler', function() {
    return typeof ErrorHandler !== 'undefined' &&
           typeof ErrorHandler.handle === 'function';
  });

  // 10. Inicializa índices (se disponível)
  _initModule('QueryOptimizer', function() {
    if (typeof QueryOptimizer !== 'undefined' &&
        typeof QueryOptimizer.initializeCommonIndices === 'function') {
      try {
        QueryOptimizer.initializeCommonIndices();
        return true;
      } catch (e) {
        SystemState.warnings.push('Índices não inicializados: ' + e.message);
        return true; // Não é crítico
      }
    }
    return true; // Opcional
  });

  // Calcula tempo de inicialização
  var elapsed = new Date().getTime() - startTime;
  SystemState.initTime = elapsed;
  SystemState.initialized = SystemState.errors.length === 0;

  // Log do resultado
  Logger.log('');
  Logger.log('═══════════════════════════════════════════════════════════');
  Logger.log('   RESULTADO DA INICIALIZAÇÃO');
  Logger.log('═══════════════════════════════════════════════════════════');
  Logger.log('');

  var moduleCount = Object.keys(SystemState.modules).length;
  var loadedCount = Object.values(SystemState.modules).filter(function(m) { return m; }).length;

  Logger.log('📦 Módulos: ' + loadedCount + '/' + moduleCount + ' carregados');
  Logger.log('⏱️ Tempo: ' + elapsed + 'ms');

  if (SystemState.errors.length > 0) {
    Logger.log('❌ Erros: ' + SystemState.errors.length);
    SystemState.errors.forEach(function(e) {
      Logger.log('   - ' + e);
    });
  }

  if (SystemState.warnings.length > 0) {
    Logger.log('⚠️ Avisos: ' + SystemState.warnings.length);
    SystemState.warnings.forEach(function(w) {
      Logger.log('   - ' + w);
    });
  }

  if (SystemState.initialized) {
    Logger.log('');
    Logger.log('✅ SISTEMA INICIALIZADO COM SUCESSO!');
  } else {
    Logger.log('');
    Logger.log('❌ FALHA NA INICIALIZAÇÃO');
  }

  Logger.log('═══════════════════════════════════════════════════════════');

  return {
    success: SystemState.initialized,
    state: SystemState,
    elapsed: elapsed
  };
}

/**
 * Inicializa um módulo específico
 * @private
 */
function _initModule(name, checkFn) {
  try {
    var loaded = checkFn();
    SystemState.modules[name] = loaded;

    if (loaded) {
      Logger.log('✅ ' + name);
    } else {
      Logger.log('⚠️ ' + name + ' (não disponível)');
      SystemState.warnings.push(name + ' não carregado');
    }

    return loaded;
  } catch (e) {
    SystemState.modules[name] = false;
    SystemState.errors.push(name + ': ' + e.message);
    Logger.log('❌ ' + name + ' - ' + e.message);
    return false;
  }
}

/**
 * Verifica se o sistema está inicializado
 * @returns {boolean}
 */
function isSystemInitialized() {
  return SystemState.initialized;
}

/**
 * Obtém estado do sistema
 * @returns {Object}
 */
function getSystemState() {
  try {
    return Object.assign({}, SystemState);
  } catch (error) {
    Logger.log("Erro em getSystemState: " + error.message);
    throw error;
  }
}

/**
 * Reseta o estado do sistema
 */
function resetSystemState() {
  SystemState.initialized = false;
  SystemState.initTime = null;
  SystemState.modules = {};
  SystemState.errors = [];
  SystemState.warnings = [];
}

/**
 * Executa diagnóstico completo do sistema
 * @returns {Object}
 */
function runSystemDiagnostics() {
  try {
    Logger.log('═══════════════════════════════════════════════════════════');
    Logger.log('   DIAGNÓSTICO DO SISTEMA UNIAE CRE');
    Logger.log('═══════════════════════════════════════════════════════════');
    Logger.log('');

    var diagnostics = {
      timestamp: new Date().toISOString(),
      initialized: SystemState.initialized,
      modules: {},
      spreadsheet: null,
      sheets: [],
      quotas: null,
      health: 'UNKNOWN'
    };

    // 1. Verifica módulos
    Logger.log('📦 MÓDULOS:');
    var modulesToCheck = [
      { name: 'AppLogger', check: function() { return typeof AppLogger !== 'undefined'; } },
      { name: 'SCHEMA', check: function() { return typeof SCHEMA !== 'undefined'; } },
      { name: 'AUTH', check: function() { return typeof AUTH !== 'undefined'; } },
      { name: 'CRUD', check: function() { return typeof CRUD !== 'undefined'; } },
      { name: 'ValidationUtils', check: function() { return typeof ValidationUtils !== 'undefined'; } },
      { name: 'QuotaManager', check: function() { return typeof QuotaManager !== 'undefined'; } },
      { name: 'BatchOperations', check: function() { return typeof BatchOperations !== 'undefined'; } },
      { name: 'getSheet', check: function() { return typeof getSheet === 'function'; } },
      { name: 'safeGet', check: function() { return typeof safeGet === 'function'; } },
      { name: 'getSafeUi', check: function() { return typeof getSafeUi === 'function'; } }
    ];

    modulesToCheck.forEach(function(m) {
      var loaded = false;
      try {
        loaded = m.check();
      } catch (e) {
        // Módulo falhou na verificação - registra para diagnóstico
        Logger.log('   ⚠️ Erro ao verificar ' + m.name + ': ' + e.message);
      }
      diagnostics.modules[m.name] = loaded;
      Logger.log('   ' + (loaded ? '✅' : '❌') + ' ' + m.name);
    });

    // 2. Verifica planilha
    Logger.log('');
    Logger.log('📊 PLANILHA:');
    try {
      var ss = getSS();
      if (ss) {
        diagnostics.spreadsheet = {
          id: ss.getId(),
          name: ss.getName(),
          sheets: ss.getSheets().length
        };
        Logger.log('   ✅ ID: ' + ss.getId());
        Logger.log('   ✅ Nome: ' + ss.getName());
        Logger.log('   ✅ Abas: ' + ss.getSheets().length);

        // Lista algumas abas
        var sheets = ss.getSheets().slice(0, 5);
        sheets.forEach(function(s) {
          diagnostics.sheets.push(s.getName());
        });
      } else {
        Logger.log('   ❌ Planilha não disponível');
      }
    } catch (e) {
      Logger.log('   ❌ Erro: ' + e.message);
    }

    // 3. Verifica cotas
    Logger.log('');
    Logger.log('📈 COTAS:');
    try {
      if (typeof QuotaManager !== 'undefined') {
        var emailQuota = QuotaManager.getRemainingEmailQuota();
        diagnostics.quotas = {
          emailsRemaining: emailQuota
        };
        Logger.log('[LGPD] Evento registrado; detalhes sensíveis omitidos.');
      } else {
        Logger.log('   ⚠️ QuotaManager não disponível');
      }
    } catch (e) {
      Logger.log('   ❌ Erro: ' + e.message);
    }

    // 4. Determina saúde geral
    var loadedModules = Object.values(diagnostics.modules).filter(function(v) { return v; }).length;
    var totalModules = Object.keys(diagnostics.modules).length;
    var healthPercent = (loadedModules / totalModules) * 100;

    if (healthPercent >= 90) {
      diagnostics.health = 'HEALTHY';
    } else if (healthPercent >= 70) {
      diagnostics.health = 'DEGRADED';
    } else if (healthPercent >= 50) {
      diagnostics.health = 'UNHEALTHY';
    } else {
      diagnostics.health = 'CRITICAL';
    }

    Logger.log('');
    Logger.log('═══════════════════════════════════════════════════════════');
    Logger.log('   SAÚDE DO SISTEMA: ' + diagnostics.health + ' (' + Math.round(healthPercent) + '%)');
    Logger.log('═══════════════════════════════════════════════════════════');

    return diagnostics;
  } catch (error) {
    Logger.log("Erro em runSystemDiagnostics: " + error.message);
    throw error;
  }
}

/**
 * Função de teste rápido do sistema
 */
function quickSystemTest() {
  Logger.log('🧪 TESTE RÁPIDO DO SISTEMA');
  Logger.log('');

  var tests = [
    { name: 'safeGet', fn: function() { return safeGet({a:1}, 'a') === 1; } },
    { name: 'validarEmail', fn: function() { return validarEmail('test@test.com'); } },
    { name: 'generateUniqueId', fn: function() { return generateUniqueId('TEST').startsWith('TEST-'); } },
    { name: 'formatDate', fn: function() { return formatDate(new Date()).length > 0; } },
    { name: 'getSafeUi', fn: function() { getSafeUi(); return true; } }
  ];

  var passed = 0;
  tests.forEach(function(t) {
    try {
      if (t.fn()) {
        Logger.log('✅ ' + t.name);
        passed++;
      } else {
        Logger.log('❌ ' + t.name);
      }
    } catch (e) {
      Logger.log('❌ ' + t.name + ': ' + e.message);
    }
  });

  Logger.log('');
  Logger.log('Resultado: ' + passed + '/' + tests.length + ' testes passaram');

  return passed === tests.length;
}

// ============================================================================
// AUTO-INICIALIZAÇÃO (comentado para não executar automaticamente)
// ============================================================================

// Descomente a linha abaixo para inicializar automaticamente ao carregar
// initializeSystem();

Logger.log('✅ 1_System_Bootstrap.gs carregado (v' + SystemState.version + ')');
