/**
 * @fileoverview Sistema de Migrations para Schema da Planilha
 * @version 1.0.0
 * @description Gerencia versionamento e evolução do schema do banco de dados
 * (planilha Google Sheets).
 * 
 * FUNCIONALIDADES:
 * - Versionamento de schema
 * - Migrations incrementais
 * - Rollback de migrations
 * - Validação de integridade pós-migration
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-08
 */

'use strict';

var Migrations = (function() {

  // ============================================================================
  // CONFIGURAÇÃO
  // ============================================================================

  var CONFIG = {
    MIGRATIONS_SHEET: '_Migrations',
    VERSION_PROPERTY: 'SCHEMA_VERSION',
    CURRENT_VERSION: '6.0.0'
  };

  // ============================================================================
  // DEFINIÇÃO DE MIGRATIONS
  // ============================================================================

  /**
   * Lista de migrations em ordem cronológica
   * Cada migration deve ter: version, description, up, down
   */
  var MIGRATIONS = [
    {
      version: '5.0.0',
      description: 'Schema inicial v5',
      up: function(ss) {
        try {
          // Cria abas básicas se não existirem
          var sheets = ['Usuarios', 'Notas_Fiscais', 'Entregas', 'Fornecedores', 'Recusas', 'Glosas'];
          sheets.forEach(function(name) {
            if (!ss.getSheetByName(name)) {
              var sheet = ss.insertSheet(name);
              AppLogger.info('Aba criada: ' + name);
            }
          });
          return true;
        } catch (error) {
          Logger.log("Erro em up: " + error.message);
          throw error;
        }
      },
      down: function(ss) {
        // Não remove abas no rollback por segurança
        return true;
      }
    },
    {
      version: '5.1.0',
      description: 'Adiciona aba de Processos_Atesto',
      up: function(ss) {
        try {
          if (!ss.getSheetByName('Processos_Atesto')) {
            var sheet = ss.insertSheet('Processos_Atesto');
            sheet.appendRow([
              'ID', 'Numero_Processo_SEI', 'Data_Abertura', 'Status',
              'Notas_Fiscais_IDs', 'Valor_Total', 'Responsavel_UNIAE',
              'Data_Atesto', 'Observacoes', 'Data_Criacao', 'Data_Atualizacao'
            ]);
            sheet.getRange(1, 1, 1, 11).setFontWeight('bold');
          }
          return true;
        } catch (error) {
          Logger.log("Erro em up: " + error.message);
          throw error;
        }
      },
      down: function(ss) {
        try {
          var sheet = ss.getSheetByName('Processos_Atesto');
          if (sheet && sheet.getLastRow() <= 1) {
            ss.deleteSheet(sheet);
          }
          return true;
        } catch (error) {
          Logger.log("Erro em down: " + error.message);
          throw error;
        }
      }
    },
    {
      version: '5.2.0',
      description: 'Adiciona colunas de auditoria em Notas_Fiscais',
      up: function(ss) {
        try {
          var sheet = ss.getSheetByName('Notas_Fiscais');
          if (sheet) {
            var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
          
            // Adiciona colunas se não existirem
            var newColumns = ['Criado_Por', 'Data_Criacao', 'Atualizado_Por', 'Data_Atualizacao'];
            newColumns.forEach(function(col) {
              if (headers.indexOf(col) === -1) {
                var lastCol = sheet.getLastColumn() + 1;
                sheet.getRange(1, lastCol).setValue(col).setFontWeight('bold');
              }
            });
          }
          return true;
        } catch (error) {
          Logger.log("Erro em up: " + error.message);
          throw error;
        }
      },
      down: function(ss) {
        // Não remove colunas no rollback
        return true;
      }
    },
    {
      version: '5.3.0',
      description: 'Adiciona aba de Comissao_Membros',
      up: function(ss) {
        try {
          if (!ss.getSheetByName('Comissao_Membros')) {
            var sheet = ss.insertSheet('Comissao_Membros');
            sheet.appendRow([
              'ID', 'Nome', 'Matricula', 'Cargo', 'Funcao_Comissao',
              'Data_Inicio', 'Data_Fim', 'Status', 'Portaria'
            ]);
            sheet.getRange(1, 1, 1, 9).setFontWeight('bold');
          }
          return true;
        } catch (error) {
          Logger.log("Erro em up: " + error.message);
          throw error;
        }
      },
      down: function(ss) {
        try {
          var sheet = ss.getSheetByName('Comissao_Membros');
          if (sheet && sheet.getLastRow() <= 1) {
            ss.deleteSheet(sheet);
          }
          return true;
        } catch (error) {
          Logger.log("Erro em down: " + error.message);
          throw error;
        }
      }
    },
    {
      version: '6.0.0',
      description: 'Adiciona abas de sistema (Logs, Audit)',
      up: function(ss) {
        try {
          // System_Logs
          if (!ss.getSheetByName('System_Logs')) {
            var logsSheet = ss.insertSheet('System_Logs');
            logsSheet.appendRow([
              'Timestamp', 'Level', 'Context', 'Message', 'User', 'ExecutionId', 'Metadata'
            ]);
            logsSheet.getRange(1, 1, 1, 7).setFontWeight('bold');
          }

          // Audit_Log
          if (!ss.getSheetByName('Audit_Log')) {
            var auditSheet = ss.insertSheet('Audit_Log');
            auditSheet.appendRow([
              'Timestamp', 'Action', 'User', 'Details', 'ExecutionId', 'IP/Session'
            ]);
            auditSheet.getRange(1, 1, 1, 6).setFontWeight('bold');
            auditSheet.protect().setWarningOnly(true);
          }

          return true;
        } catch (error) {
          Logger.log("Erro em up: " + error.message);
          throw error;
        }
      },
      down: function(ss) {
        // Não remove abas de log
        return true;
      }
    }
  ];

  // ============================================================================
  // CORE
  // ============================================================================

  /**
   * Obtém versão atual do schema
   * @returns {string}
   */
  function getCurrentVersion() {
    try {
      try {
        var props = PropertiesService.getScriptProperties();
        return props.getProperty(CONFIG.VERSION_PROPERTY) || '0.0.0';
      } catch (e) {
        return '0.0.0';
      }
    } catch (error) {
      Logger.log("Erro em getCurrentVersion: " + error.message);
      throw error;
    }
  }

  /**
   * Define versão do schema
   * @param {string} version
   */
  function setVersion(version) {
    try {
      var props = PropertiesService.getScriptProperties();
      props.setProperty(CONFIG.VERSION_PROPERTY, version);
    } catch (e) {
      AppLogger.error('Erro ao definir versão do schema', e);
    }
  }

  /**
   * Compara versões semânticas
   * @returns {number} -1, 0, ou 1
   */
  function compareVersions(v1, v2) {
    try {
      var parts1 = v1.split('.').map(Number);
      var parts2 = v2.split('.').map(Number);

      for (var i = 0; i < 3; i++) {
        var p1 = parts1[i] || 0;
        var p2 = parts2[i] || 0;
        if (p1 < p2) return -1;
        if (p1 > p2) return 1;
      }
      return 0;
    } catch (error) {
      Logger.log("Erro em compareVersions: " + error.message);
      throw error;
    }
  }

  /**
   * Obtém migrations pendentes
   * @returns {Array}
   */
  function getPendingMigrations() {
    try {
      var currentVersion = getCurrentVersion();
    
      return MIGRATIONS.filter(function(m) {
        return compareVersions(m.version, currentVersion) > 0;
      }).sort(function(a, b) {
        return compareVersions(a.version, b.version);
      });
    } catch (error) {
      Logger.log("Erro em getPendingMigrations: " + error.message);
      throw error;
    }
  }

  /**
   * Executa migrations pendentes
   * @returns {Object} Resultado
   */
  function migrate() {
    try {
      var ss = getSS();
      var pending = getPendingMigrations();
    
      if (pending.length === 0) {
        return {
          success: true,
          message: 'Schema já está atualizado',
          currentVersion: getCurrentVersion()
        };
      }

      var results = {
        success: true,
        migrations: [],
        errors: []
      };

      AppLogger.info('Iniciando migrations: ' + pending.length + ' pendentes');

      pending.forEach(function(migration) {
        try {
          AppLogger.info('Executando migration ' + migration.version + ': ' + migration.description);
        
          var result = migration.up(ss);
        
          if (result) {
            setVersion(migration.version);
            recordMigration(ss, migration, 'UP', true);
            results.migrations.push({
              version: migration.version,
              description: migration.description,
              success: true
            });
          } else {
            throw new Error('Migration retornou false');
          }

        } catch (e) {
          results.success = false;
          results.errors.push({
            version: migration.version,
            error: e.message
          });
          recordMigration(ss, migration, 'UP', false, e.message);
          AppLogger.error('Erro na migration ' + migration.version, e);
        
          // Para execução em caso de erro
          return;
        }
      });

      results.currentVersion = getCurrentVersion();
    
      AppLogger.audit('MIGRATIONS_EXECUTED', {
        count: results.migrations.length,
        finalVersion: results.currentVersion
      });

      return results;
    } catch (error) {
      Logger.log("Erro em migrate: " + error.message);
      throw error;
    }
  }

  /**
   * Executa rollback de uma migration
   * @param {string} targetVersion - Versão alvo
   * @returns {Object} Resultado
   */
  function rollback(targetVersion) {
    try {
      var ss = getSS();
      var currentVersion = getCurrentVersion();

      if (compareVersions(targetVersion, currentVersion) >= 0) {
        return {
          success: false,
          error: 'Versão alvo deve ser menor que a atual'
        };
      }

      // Encontra migrations a reverter (em ordem reversa)
      var toRollback = MIGRATIONS.filter(function(m) {
        return compareVersions(m.version, targetVersion) > 0 &&
               compareVersions(m.version, currentVersion) <= 0;
      }).sort(function(a, b) {
        return compareVersions(b.version, a.version); // Ordem reversa
      });

      var results = {
        success: true,
        rollbacks: [],
        errors: []
      };

      toRollback.forEach(function(migration) {
        try {
          AppLogger.info('Revertendo migration ' + migration.version);
        
          if (migration.down) {
            var result = migration.down(ss);
          
            if (result) {
              recordMigration(ss, migration, 'DOWN', true);
              results.rollbacks.push({
                version: migration.version,
                success: true
              });
            }
          }

        } catch (e) {
          results.success = false;
          results.errors.push({
            version: migration.version,
            error: e.message
          });
          recordMigration(ss, migration, 'DOWN', false, e.message);
        }
      });

      if (results.success) {
        setVersion(targetVersion);
      }

      results.currentVersion = getCurrentVersion();

      AppLogger.audit('MIGRATIONS_ROLLBACK', {
        targetVersion: targetVersion,
        count: results.rollbacks.length
      });

      return results;
    } catch (error) {
      Logger.log("Erro em rollback: " + error.message);
      throw error;
    }
  }

  /**
   * Registra migration executada
   * @private
   */
  function recordMigration(ss, migration, direction, success, error) {
    try {
      try {
        var sheet = ss.getSheetByName(CONFIG.MIGRATIONS_SHEET);
      
        if (!sheet) {
          sheet = ss.insertSheet(CONFIG.MIGRATIONS_SHEET);
          sheet.appendRow(['Timestamp', 'Version', 'Description', 'Direction', 'Success', 'Error', 'User']);
          sheet.getRange(1, 1, 1, 7).setFontWeight('bold');
        }

        sheet.appendRow([
          new Date(),
          migration.version,
          migration.description,
          direction,
          success,
          error || '',
          Session.getActiveUser().getEmail()
        ]);

      } catch (e) {
        AppLogger.error('Erro ao registrar migration', e);
      }
    } catch (error) {
      Logger.log("Erro em recordMigration: " + error.message);
      throw error;
    }
  }

  /**
   * Obtém histórico de migrations
   * @returns {Array}
   */
  function getHistory() {
    try {
      try {
        try {
          var ss = getSS();
          var sheet = ss.getSheetByName(CONFIG.MIGRATIONS_SHEET);
      
          if (!sheet || sheet.getLastRow() <= 1) {
            return [];
          }

          var data = sheet.getDataRange().getValues();
          var headers = data[0];
      
          return data.slice(1).map(function(row) {
            var obj = {};
            headers.forEach(function(h, i) {
              obj[h] = row[i];
            });
            return obj;
          });

        } catch (e) {
          return [];
        }
      } catch (error) {
        Logger.log("Erro em getHistory: " + error.message);
        throw error;
      }
    } catch (error) {
      Logger.log("Erro em getHistory: " + error.message);
      throw error;
    }
  }

  /**
   * Verifica status das migrations
   * @returns {Object}
   */
  function status() {
    try {
      var currentVersion = getCurrentVersion();
      var pending = getPendingMigrations();
      var history = getHistory();

      return {
        currentVersion: currentVersion,
        targetVersion: CONFIG.CURRENT_VERSION,
        isUpToDate: compareVersions(currentVersion, CONFIG.CURRENT_VERSION) >= 0,
        pendingCount: pending.length,
        pendingMigrations: pending.map(function(m) {
          return { version: m.version, description: m.description };
        }),
        history: history.slice(-10) // Últimas 10
      };
    } catch (error) {
      Logger.log("Erro em status: " + error.message);
      throw error;
    }
  }

  // ============================================================================
  // API PÚBLICA
  // ============================================================================

  return {
    // Core
    migrate: migrate,
    rollback: rollback,
    status: status,

    // Consulta
    getCurrentVersion: getCurrentVersion,
    getPendingMigrations: getPendingMigrations,
    getHistory: getHistory,

    // Configuração
    CONFIG: CONFIG,
    MIGRATIONS: MIGRATIONS
  };
})();

// ============================================================================
// FUNÇÕES GLOBAIS
// ============================================================================

/**
 * Executa migrations pendentes
 */
function runMigrations() {
  try {
    try {
      var result = Migrations.migrate();
      Logger.log('Migrations: ' + JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      Logger.log("Erro em runMigrations: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em runMigrations: " + error.message);
    throw error;
  }
}

/**
 * Verifica status das migrations
 */
function checkMigrationStatus() {
  try {
    var status = Migrations.status();
    Logger.log('Status: ' + JSON.stringify(status, null, 2));
    return status;
  } catch (error) {
    Logger.log("Erro em checkMigrationStatus: " + error.message);
    throw error;
  }
}
