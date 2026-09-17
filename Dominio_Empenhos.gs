'use strict';

/**
 * DOMINIO_EMPENHOS
 * Consolidado de : Glosas.gs, Services.gs
 * @version 2.0.0
 * @created 2025-11-04
 */


// ---- Glosas.gs ----
/**
 * Glosas.gs
 * Módulo para gerenciamento de glosas em notas fiscais
 */

// Função para registrar nova glosa
function registrarNovaGlosa() {
  try {
    try {
      try {
        var ui = getSafeUi();
        var ss = getSS();
        var sheet = ss.getSheetByName('Glosas') || ss.insertSheet('Glosas');

        // Criar estrutura se não existir
        if (sheet.getLastRow() == 0) {
          var cabecalhos = [
            'Data Registro',
            'NF',
            'Fornecedor',
            'Produto/Item',
            'Quantidade Glosada',
            'Unidade',
            'Valor Unitário',
            'Valor Total Glosa',
            'Motivo',
            'Responsável',
            'Status',
            'Observações'
          ];
          sheet.getRange(1, 1, 1, cabecalhos.length).setValues([cabecalhos]);
          sheet.getRange(1, 1, 1, cabecalhos.length).setFontWeight('bold').setBackground('#E91E63').setFontColor('#FFFFFF');
        }

        // Formulário para registro
        var response = safePrompt(
          'Registrar Nova Glosa',
          'Motivo : \n' +
          '1 - Erro a mais no faturamento\n' +
          '2 - Baixa qualidade do alimento\n' +
          '3 - Solicitação do setor de monitoramento da GPAE\n' +
          '4 - Quantidade divergente\n' +
          '5 - Outro\n\n' +
          'Digite : Motivo|NF|Fornecedor|Produto|Qtd|Unidade|ValorUnit|Responsável\n' +
          'Exemplo : 2|16221|Contrigo|Arroz|50|kg|5.50|João Silva',
          ui.ButtonSet.OK_CANCEL
        );

        if (response.getSelectedButton() != ui.Button.OK) {
          return;
        }

        var dados = response.getResponseText().split('|');
        if (dados.length < 8) {
          safeAlert('Erro', 'Formato inválido. Forneça todos os campos.', ui.ButtonSet.OK);
          return;
        }

        var motivos = {
          '1' : 'Erro a mais no faturamento da Nota Fiscal',
          '2' : 'Baixa qualidade do alimento',
          '3' : 'Solicitação do setor de monitoramento da GPAE',
          '4' : 'Quantidade divergente da solicitada',
          '5' : 'Outro'
        };

        var qtd = Number(dados[4]);
        var valorUnit = Number(dados[6]);
        var valorTotal = qtd * valorUnit;

        var novaLinha = [
          new Date(),
          dados[1],                         // NF
          dados[2],                         // Fornecedor
          dados[3],                         // Produto
          qtd,                              // Quantidade
          dados[5],                         // Unidade
          valorUnit,                        // Valor Unitário
          valorTotal,                       // Valor Total
          motivos[dados[0]] || dados[0],   // Motivo
          dados[7],                         // Responsável
          'Pendente',                       // Status
          ''                                // Observações
        ];

        sheet.appendRow(novaLinha);

        // Formatar valor
        var lastRow = sheet.getLastRow();
        sheet.getRange(lastRow, 7).setNumberFormat('R$ #,##0.00');
        sheet.getRange(lastRow, 8).setNumberFormat('R$ #,##0.00');

        safeAlert('Sucesso',
          'Glosa registrada com sucesso!\n\n' +
          'Produto : ' + dados[3] + '\n' +
          'Valor : R$ ' + valorTotal.toFixed(2) + '\n' +
          'Motivo : ' + (motivos[dados[0]] || dados[0]),
          ui.ButtonSet.OK);
      } catch (error) {
        Logger.log("Erro em registrarNovaGlosa: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em registrarNovaGlosa: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em registrarNovaGlosa: " + error.message);
    throw error;
  }
}

// Função para listar glosas ativas
function listarGlosasAtivas() {
  try {
    try {
      try {
        var ui = getSafeUi();
        var ss = getSS();
        var sheet = ss.getSheetByName('Glosas');

        if (!sheet || sheet.getLastRow() <= 1) {
          ui.alert('Informação', 'Nenhuma glosa registrada no sistema.', ui.ButtonSet.OK);
          return;
        }

        var data = sheet.getDataRange().getValues();
        var headers = data[0];
        var statusIdx = headers.indexOf('Status');
        var nfIdx = headers.indexOf('NF');
        var fornecedorIdx = headers.indexOf('Fornecedor');
        var valorIdx = headers.indexOf('Valor Total Glosa');

        var glosasPendentes = [];
        var glosasAprovadas = [];
        var totalPendente = 0;
        var totalAprovado = 0;

        for (var i = 1; i < data.length; i++) {
          var status = data[i][statusIdx];
          var valor = Number(data[i][valorIdx]) || 0;

          if (status == 'Pendente' || status == 'Em Análise') {
            glosasPendentes.push(data[i]);
            totalPendente += valor;
          } else if (status == 'Aprovada') {
            glosasAprovadas.push(data[i]);
            totalAprovado += valor;
          }
        }

        // Criar relatório
        var resultSheet = ss.getSheetByName('Relatorio_Glosas') || ss.insertSheet('Relatorio_Glosas');
        resultSheet.clear();

        var output = [
          ['Relatório de Glosas Ativas'],
          ['Data : ', new Date()],
          [''],
          ['Resumo : '],
          ['Glosas Pendentes : ', glosasPendentes.length, 'Valor Total : ', 'R$ ' + totalPendente.toFixed(2)],
          ['Glosas Aprovadas : ', glosasAprovadas.length, 'Valor Total : ', 'R$ ' + totalAprovado.toFixed(2)],
          [''],
          ['Detalhamento - Glosas Pendentes : ']
        ];

        output.push(headers);
        glosasPendentes.forEach(function(glosa) {
          output.push(glosa);
        });

        resultSheet.getRange(1, 1, output.length, Math.max(headers.length, 4)).setValues(output);
        resultSheet.getRange(1, 1).setFontWeight('bold').setFontSize(12);

        ss.setActiveSheet(resultSheet);
        safeAlert('Relatório gerado',
          'Glosas Pendentes : ' + glosasPendentes.length + ' (R$ ' + totalPendente.toFixed(2) + ')\n' +
          'Glosas Aprovadas : ' + glosasAprovadas.length + ' (R$ ' + totalAprovado.toFixed(2) + ')',
          ui.ButtonSet.OK);
      } catch (error) {
        Logger.log("Erro em listarGlosasAtivas: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em listarGlosasAtivas: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em listarGlosasAtivas: " + error.message);
    throw error;
  }
}

// Função para calcular valores de glosas
function calcularValoresGlosas() {
  try {
    try {
      try {
        var ui = getSafeUi();
        var ss = getSS();
        var sheet = ss.getSheetByName('Glosas');

        if (!sheet || sheet.getLastRow() <= 1) {
          ui.alert('Informação', 'Nenhuma glosa registrada no sistema.', ui.ButtonSet.OK);
          return;
        }

        var data = sheet.getDataRange().getValues();
        var headers = data[0];
        var fornecedorIdx = headers.indexOf('Fornecedor');
        var valorIdx = headers.indexOf('Valor Total Glosa');
        var motivoIdx = headers.indexOf('Motivo');
        var statusIdx = headers.indexOf('Status');

        var porFornecedor = {};
        var porMotivo = {};
        var totalGeral = 0;

        for (var i = 1; i < data.length; i++) {
          var fornecedor = data[i][fornecedorIdx];
          var valor = Number(data[i][valorIdx]) || 0;
          var motivo = data[i][motivoIdx];
          var status = data[i][statusIdx];

          totalGeral += valor;

          // Agrupar por fornecedor
          if (!porFornecedor[fornecedor]) {
            porFornecedor[fornecedor] = {total : 0, quantidade : 0, pendentes : 0, aprovadas : 0};
          }
          porFornecedor[fornecedor].total += valor;
          porFornecedor[fornecedor].quantidade++
          if (status == 'Pendente' || status == 'Em Análise') {
            porFornecedor[fornecedor].pendentes++
          } else if (status == 'Aprovada') {
            porFornecedor[fornecedor].aprovadas++
          }

          // Agrupar por motivo
          if (!porMotivo[motivo]) {
            porMotivo[motivo] = {total : 0, quantidade : 0};
          }
          porMotivo[motivo].total += valor;
          porMotivo[motivo].quantidade++
        }

        // Criar relatório
        var resultSheet = ss.getSheetByName('Calculo_Glosas') || ss.insertSheet('Calculo_Glosas');
        resultSheet.clear();

        var output = [
          ['Cálculo de Valores de Glosas'],
          ['Data : ', new Date()],
          [''],
          ['Valor Total de Glosas : ', 'R$ ' + totalGeral.toFixed(2)],
          ['Quantidade de Glosas : ', data.length - 1],
          [''],
          ['Por Fornecedor : '],
          ['Fornecedor', 'Valor Total', 'Quantidade', 'Pendentes', 'Aprovadas']
        ];

        for (var f in porFornecedor) {
          output.push([
            f,
            'R$ ' + porFornecedor[f].total.toFixed(2),
            porFornecedor[f].quantidade,
            porFornecedor[f].pendentes,
            porFornecedor[f].aprovadas
          ]);
        }

        output.push(['']);
        output.push(['Por Motivo : ']);
        output.push(['Motivo', 'Valor Total', 'Quantidade']);

        for (var m in porMotivo) {
          output.push([
            m,
            'R$ ' + porMotivo[m].total.toFixed(2),
            porMotivo[m].quantidade
          ]);
        }

        resultSheet.getRange(1, 1, output.length, 5).setValues(output);
        resultSheet.getRange(1, 1).setFontWeight('bold').setFontSize(12);

        ss.setActiveSheet(resultSheet);
        safeAlert('Cálculo concluído',
          'Valor total de glosas : R$ ' + totalGeral.toFixed(2) + '\n' +
          'Quantidade : ' + (data.length - 1) + ' glosas',
          ui.ButtonSet.OK);
      } catch (error) {
        Logger.log("Erro em calcularValoresGlosas: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em calcularValoresGlosas: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em calcularValoresGlosas: " + error.message);
    throw error;
  }
}

// Função para justificar glosa
function justificarGlosa() {
  try {
    try {
      try {
        var ui = getSafeUi();
        var ss = getSS();
        var sheet = ss.getSheetByName('Glosas');

        if (!sheet || sheet.getLastRow() <= 1) {
          ui.alert('Informação', 'Nenhuma glosa registrada no sistema.', ui.ButtonSet.OK);
          return;
        }

        // Solicitar número da linha
        var response = safePrompt(
          'Justificar Glosa',
          'Digite o número da linha da glosa que deseja justificar : ',
          ui.ButtonSet.OK_CANCEL
        );

        if (response.getSelectedButton() != ui.Button.OK) {
          return;
        }

        var linha = Number(response.getResponseText());
        if (isNaN(linha) || linha <= 1 || linha > sheet.getLastRow()) {
          safeAlert('Erro', 'Número de linha inválido.', ui.ButtonSet.OK);
          return;
        }

        // Solicitar justificativa
        var justificativa = safePrompt(
          'Justificativa da Glosa',
          'Digite a justificativa detalhada para esta glosa : ',
          ui.ButtonSet.OK_CANCEL
        );

        if (justificativa.getSelectedButton() != ui.Button.OK) {
          return;
        }

        var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        var obsIdx = headers.indexOf('Observações');
        var statusIdx = headers.indexOf('Status');

        if (obsIdx >= 0) {
          sheet.getRange(linha, obsIdx + 1).setValue(justificativa.getResponseText());
        }

        if (statusIdx >= 0) {
          sheet.getRange(linha, statusIdx + 1).setValue('Justificada');
        }

        safeAlert('Sucesso', 'Justificativa registrada com sucesso!', ui.ButtonSet.OK);
      } catch (error) {
        Logger.log("Erro em justificarGlosa: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em justificarGlosa: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em justificarGlosa: " + error.message);
    throw error;
  }
}


// ---- Services.gs ----
/**
 * Services.gs - Serviços de Negócio seguindo SOLID
 * Implementa serviços específicos com responsabilidade única (SRP)
 * e baixo acoplamento (DIP)
 */

/**
 * NOTIFICATION SERVICE (SRP - Single Responsibility)
 * Responsável apenas por notificações ao usuário
 */
function UINotificationService() {
  this.ui = getSafeUi();
}

UINotificationService.prototype.notify = function(message, type, title) {
  type = type || 'info';
  title = title || 'Sistema UNIAE';

  try {
    switch (type) {
      case 'success' :
        this.ui.alert('✅ ' + title, message, this.ui.ButtonSet.OK);
        break;
      case 'error' :
        this.ui.alert('❌ ' + title, message, this.ui.ButtonSet.OK);
        break;
      case 'warning' :
        this.ui.alert('⚠️ ' + title, message, this.ui.ButtonSet.OK);
        break;
      case 'info' :
      default :
        this.safeAlert('ℹ️ ' + title, message, this.ui.ButtonSet.OK);
        break;
    }

    SystemLogger.info('Notification sent', { type : type, title, title });

  } catch (error) {
    SystemLogger.error('Failed to send notification', error);
    // Fallback para toast se alert falhar
    try {
      getSS().toast(message, title);
    } catch (toastError) {
      Logger.log('Notification failed : ' + message);
    }
      return {
        chaveAcesso : chaveAcesso,
        situacao : "ERRO",
        valida : false
      };
    };
  }


UINotificationService.prototype.confirm = function(message, title) {
  title = title || 'Confirmação';

  try {
    var response = this.ui.alert('❓ ' + title, message, this.ui.ButtonSet.YES_NO);
  } catch (error) {
    SystemLogger.error('Failed to show confirmation', error);
  }
};


UINotificationService.prototype.prompt = function(message, title, defaultValue) {
  title = title || 'Entrada de Dados';

  try {
    var response = this.ui.prompt('📝 ' + title, message, this.ui.ButtonSet.OK_CANCEL);

    if (response.getSelectedButton() == this.ui.Button.OK) {
      return {
        success : true,
        value : response.getResponseText().trim()
      };
    }


  } catch (error) {
    SystemLogger.error('Failed to show prompt', error);
  }
};


/**
 * LEGAL FRAMEWORK SERVICE (SRP - Single Responsibility)
 * Responsável apenas por operações relacionadas ao framework legal
 */
function LegalFrameworkService() {
  try {
    this.framework = LEGAL_BASIS;
    this.hierarchy = LEGAL_HIERARCHY;
    this.deadlines = LEGAL_DEADLINES;
  } catch (error) {
    Logger.log("Erro em LegalFrameworkService: " + error.message);
    throw error;
  }
}

LegalFrameworkService.prototype.validateLegalBasis = function(operation, responsible) {
  var responsibleData = this.hierarchy[responsible];

  if (!responsibleData) {
    return {
      valid : false,
      error : 'Responsável não encontrado na hierarquia legal : ' + responsible
    };
  }

  if (responsibleData.lacuna_critica || responsibleData.problema_critico) {
    return {
      valid : false,
      error : 'Responsável com lacuna legal crítica : ' + (responsibleData.lacuna_critica || responsibleData.problema_critico)
    };
  }

  return {
    valid : true,
    legalBasis : responsibleData.base_legal,
    responsibilities : responsibleData.responsabilidades
  };
};

LegalFrameworkService.prototype.checkDeadlineCompliance = function(operation, daysElapsed) {
  var deadline = this.deadlines[operation];

  if (!deadline) {
    return {
      compliant : true,
      warning : 'Prazo não definido para operação : ' + operation
    };
  }

  if (deadline.prazo == null) {
    return {
      compliant : false,
      error : 'Lacuna legal : ' + deadline.lacuna
    };


  var isCompliant = daysElapsed <= deadline.prazo;

  return {
    compliant : isCompliant,
    deadline : deadline.prazo,
    daysElapsed : daysElapsed,
    legalBasis : deadline.base_legal
  };
};
};


LegalFrameworkService.prototype.getRequiredProcedures = function(operation) {
  var procedures = MANDATORY_PROCEDURES;
  var required = [];

  for (var procedure in procedures) {
    var proc = procedures[procedure];
    if (proc.status_atual != 'IMPLEMENTADO') {
      required.push({
        procedure : procedure,
        legalBasis : proc.base_legal,
        requirement : proc.exigencia,
        action : proc.acao_necessaria,
        status : proc.status_atual
      });
    }
  }

};

/**
 * COMPLIANCE VALIDATOR SERVICE (SRP - Single Responsibility)
 * Responsável apenas por validações de conformidade
 */
function ComplianceValidatorService(dependencies) {
  try {
    BaseService.call(this, dependencies);
    this.legalFramework = dependencies.legalFramework || resolve('legalFramework');
  } catch (error) {
    Logger.log("Erro em ComplianceValidatorService: " + error.message);
    throw error;
  }
}

ComplianceValidatorService.prototype = Object.create(BaseService.prototype);
ComplianceValidatorService.prototype.constructor = ComplianceValidatorService;

ComplianceValidatorService.prototype._execute = function(params) {
  var operation = params.operation;
  var data = params.data;
  var responsible = params.responsible;

  var validation = {
    isCompliant : true,
    violations : [],
    warnings : [],
    score : 100,
    legalBasis : [],
    timestamp : new Date()
  };

  // Validar base legal
  var legalValidation = this.legalFramework.validateLegalBasis(operation, responsible);
  if (!legalValidation.valid) {
    validation.isCompliant = false;
    validation.violations.push({
      type : 'LEGAL_BASIS',
      message : legalValidation.error,
      severity : 'CRITICAL'
    });
    validation.score -= 30;
  } else {
    validation.legalBasis.push(legalValidation.legalBasis);
  }

  // Validar prazos
  if (data.daysElapsed != undefined) {
    var deadlineValidation = this.legalFramework.checkDeadlineCompliance(operation, data.daysElapsed);
    if (!deadlineValidation.compliant) {
      if (deadlineValidation.error) {
        validation.violations.push({
          type : 'LEGAL_GAP',
          message : deadlineValidation.error,
          severity : 'HIGH'
        });
        validation.score -= 20;
      } else {
        validation.warnings.push({
          type : 'DEADLINE_EXCEEDED',
          message : 'Prazo excedido : ' + data.daysElapsed + ' dias (limite : ' + deadlineValidation.deadline + ')',
          severity : 'MEDIUM'
        });
        validation.score -= 10;
      }
    }
  }

  // Validar procedimentos obrigatórios
  var requiredProcedures = this.legalFramework.getRequiredProcedures(operation);
  if (requiredProcedures.length > 0) {
    validation.warnings.push({
      type : 'MISSING_PROCEDURES',
      message : 'Procedimentos obrigatórios não implementados : ' + requiredProcedures.length,
      procedures : requiredProcedures,
      severity : 'HIGH'
    });
    validation.score -= (requiredProcedures.length * 5);
  }

  // Garantir score mínimo
  validation.score = Math.max(0, validation.score);

};

/**
 * NOTA FISCAL SERVICE (SRP - Single Responsibility)
 * Responsável apenas por operações de notas fiscais
 */
function DominioNotaFiscalService(dependencies) {
  try {
    try {
      BaseService.call(this, dependencies);
      this.repository = dependencies.repository || resolve('notaFiscalRepository');
      this.validator = dependencies.validator || resolve('complianceValidator');
      this.notificationService = dependencies.notificationService || resolve('notificationService');
    } catch (error) {
      Logger.log("Erro em DominioNotaFiscalService: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em DominioNotaFiscalService: " + error.message);
    throw error;
  }
}

DominioNotaFiscalService.prototype = Object.create(BaseService.prototype);
DominioNotaFiscalService.prototype.constructor = DominioNotaFiscalService;

DominioNotaFiscalService.prototype.validateParams = function(params) {
  validateRequired(params.numeroNF, 'Número da NF');
  validateRequired(params.fornecedor, 'Fornecedor');
  validateNumber(params.valorTotal, 'Valor Total');
};

DominioNotaFiscalService.prototype._execute = function(params) {
  var operation = params.operation || 'CREATE_NOTA_FISCAL';

  switch (operation) {
    case 'CREATE_NOTA_FISCAL' :
      return this.createNotaFiscal(params);
    case 'UPDATE_NOTA_FISCAL' :
      return this.updateNotaFiscal(params);
    case 'VALIDATE_NOTA_FISCAL' :
      return this.validateNotaFiscal(params);
    default :
      throw new Error('Operação não suportada : ' + operation);
  }
};

DominioNotaFiscalService.prototype.createNotaFiscal = function(params) {
  // Validar conformidade legal
  var complianceValidation = this.validator.execute({
    operation : 'NOTA_FISCAL_REGISTRATION',
    data : params,
    responsible : 'INDIVIDUAL'
  });

  // Preparar dados
  var notaFiscalData = {
    id : this.generateId(),
    numeroNF : params.numeroNF,
    fornecedor : params.fornecedor,
    valorTotal : params.valorTotal,
    dataRegistro : new Date(),
    statusConformidade : complianceValidation.isCompliant ? 'CONFORME' : 'NAO_CONFORME',
    scoreConformidade : complianceValidation.score,
    violacoes : JSON.stringify(complianceValidation.violations),
    baseLegal : JSON.stringify(complianceValidation.legalBasis)
  };

  // Salvar no repositório
  var savedId = this.repository.save(notaFiscalData);

  // Notificar resultado
  if (complianceValidation.isCompliant) {
    this.notificationService.notify(
      'Nota fiscal registrada com sucesso!\n\nID : ' + savedId + '\nScore de Conformidade : ' + complianceValidation.score + '%',
      'success',
      'Nota Fiscal Criada'
    );
  } else {
    this.notificationService.notify(
      'Nota fiscal registrada com violações de conformidade!\n\nID : ' + savedId + '\nViolações : ' + complianceValidation.violations.length,
      'warning',
      'Conformidade Comprometida'
    );
  }

  return {
    success : true,
    id : savedId,
    compliance : complianceValidation
  };
};

DominioNotaFiscalService.prototype.updateNotaFiscal = function(params) {
  validateRequired(params.id, 'ID da Nota Fiscal');

  var updated = this.repository.update(params.id, params);

  if (updated) {
    this.notificationService.notify('Nota fiscal atualizada com sucesso!', 'success');
  } else {
    this.notificationService.notify('Nota fiscal não encontrada!', 'error');
  }
};

DominioNotaFiscalService.prototype.validateNotaFiscal = function(params) {
  var notaFiscal = this.repository.findById(params.id);

  if (!notaFiscal) {}

  var complianceValidation = this.validator.execute({
    operation : 'NOTA_FISCAL_VALIDATION',
    data : notaFiscal,
    responsible : 'INDIVIDUAL'
  });

  return {
    success : true,
    notaFiscal : notaFiscal,
    compliance : complianceValidation
  };
};

DominioNotaFiscalService.prototype.generateId = function() {
};

/**
 * CONTROLE CONFERENCIA SERVICE (SRP - Single Responsibility)
 * Responsável apenas por operações de controle de conferência
 */
function ControleConferenciaService(dependencies) {
  try {
    try {
      BaseService.call(this, dependencies);
      this.repository = dependencies.repository || resolve('controleConferenciaRepository');
      this.validator = dependencies.validator || resolve('complianceValidator');
      this.notificationService = dependencies.notificationService || resolve('notificationService');
      this.legalFramework = dependencies.legalFramework || resolve('legalFramework');
    } catch (error) {
      Logger.log("Erro em ControleConferenciaService: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em ControleConferenciaService: " + error.message);
    throw error;
  }
}

ControleConferenciaService.prototype = Object.create(BaseService.prototype);
ControleConferenciaService.prototype.constructor = ControleConferenciaService;

ControleConferenciaService.prototype._execute = function(params) {
  var operation = params.operation || 'CREATE_CONTROLE';

  switch (operation) {
    case 'CREATE_CONTROLE' :
      return this.createControle(params);
    case 'UPDATE_ETAPA' :
      return this.updateEtapa(params);
    case 'REGISTER_OCORRENCIA' :
      return this.registerOcorrencia(params);
    case 'GENERATE_REPORT' :
      return this.generateReport(params);
    default :
      throw new Error('Operação não suportada : ' + operation);
  }
};

ControleConferenciaService.prototype.createControle = function(params) {
  // Validar conformidade legal
  var complianceValidation = this.validator.execute({
    operation : 'CONTROLE_CONFERENCIA_REGISTRATION',
    data : params,
    responsible : 'INDIVIDUAL'
  });

  // Determinar tipo de produto
  var tipoProduto = this.determineTipoProduto(params.produto);

  // Calcular prazo limite
  var prazoLimite = this.calculatePrazoLimite(tipoProduto);

  var controleData = {
    id : this.generateId(),
    numeroNF : params.numeroNF,
    fornecedor : params.fornecedor,
    valorTotal : params.valorTotal,
    tipoProduto : tipoProduto,
    dataControle : new Date(),
    prazoLimite : prazoLimite,
    statusGeral : 'EM_CONFERENCIA',
    statusConformidade : complianceValidation.isCompliant ? 'CONFORME' : 'NAO_CONFORME',
    scoreConformidade : complianceValidation.score,
    violacoes : JSON.stringify(complianceValidation.violations)
  };

  var savedId = this.repository.save(controleData);

  // Notificar com base na conformidade
  var message = 'Controle de conferência criado!\n\n' +
                'ID : ' + savedId + '\n' +
                'Tipo : ' + tipoProduto + '\n' +
                'Prazo : ' + formatDate(prazoLimite) + '\n' +
                'Conformidade : ' + complianceValidation.score + '%';

  var notificationType;
  if (complianceValidation.isCompliant) {
    notificationType = 'success';
  } else {
    notificationType = 'warning';
  }
  this.notificationService.notify(message, notificationType, 'Controle Criado');

  return {
    success : true,
    id : savedId,
    compliance : complianceValidation,
    tipoProduto : tipoProduto,
    prazoLimite : prazoLimite
  };
};

ControleConferenciaService.prototype.updateEtapa = function(params) {
  validateRequired(params.controleId, 'ID do Controle');
  validateRequired(params.etapa, 'Etapa');
  validateRequired(params.status, 'Status');
  validateRequired(params.responsavel, 'Responsável');

  // Validar se responsável tem base legal para a etapa
  var etapaConfig = CONFERENCIA_STRUCTURE.etapas[params.etapa];
  if (etapaConfig) {
    var legalValidation = this.legalFramework.validateLegalBasis(
      params.etapa,
      etapaConfig.responsavel_legal
    );

    if (!legalValidation.valid) {
      this.notificationService.notify(
        'Responsável sem base legal para esta etapa!\n\n' + legalValidation.error,
        'error',
        'Violação Legal'
      );
      return { success : false, error : legalValidation.error };
    }
  }

  var updateData = {
    ['status_' + params.etapa] : params.status,
    ['data_' + params.etapa] : new Date(),
    ['responsavel_' + params.etapa] : params.responsavel,
    ['observacoes_' + params.etapa] : params.observacoes || ''
  };

  var updated = this.repository.update(params.controleId, updateData);

  if (updated) {
    // Recalcular status geral
    this.recalculateStatus(params.controleId);

    this.notificationService.notify(
      'Etapa atualizada com sucesso!\n\n' +
      'Controle : ' + params.controleId + '\n' +
      'Etapa : ' + params.etapa + '\n' +
      'Status : ' + params.status,
      'success',
      'Etapa Atualizada'
    );

  } else {
    this.notificationService.notify('Controle não encontrado!', 'error');
  }
};

ControleConferenciaService.prototype.registerOcorrencia = function(params) {
  validateRequired(params.controleId, 'ID do Controle');
  validateRequired(params.tipo, 'Tipo de Ocorrência');
  validateRequired(params.motivo, 'Motivo');

  // Validar base legal para registro de ocorrências
  var legalValidation = this.legalFramework.validateLegalBasis('REGISTRO_OCORRENCIAS', 'INDIVIDUAL');

  if (!legalValidation.valid) {
    this.notificationService.notify(
      'Sem base legal para registrar ocorrências!\n\n' + legalValidation.error,
      'error',
      'Violação Legal'
    );
  }

  var ocorrenciaData = {
    ['tem_' + params.tipo.toLowerCase()] : 'SIM',
    detalhes_ocorrencias : params.tipo + ' : ' + params.motivo + ' (' + new Date().toLocaleString() + ')',
    registro_proprio_ocorrencias : 'Registrado conforme Lei 14.133/2021 Art. 117'
  };

  var updated = this.repository.update(params.controleId, ocorrenciaData);

  if (updated) {
    this.notificationService.notify(
      'Ocorrência registrada com sucesso!\n\n' +
      'Tipo : ' + params.tipo + '\n' +
      'Motivo : ' + params.motivo + '\n' +
      'Base Legal : Lei 14.133/2021 Art. 117',
      'success',
      'Ocorrência Registrada'
    );

  } else {}
};

ControleConferenciaService.prototype.determineTipoProduto = function(produto) {
  if (!produto) return 'NAO_PERECIVEL';

  var pereciveis = ['leite', 'iogurte', 'queijo', 'carne', 'frango', 'peixe', 'verdura', 'fruta', 'legume'];
  var produtoLower = produto.toLowerCase();

  for (var i = 0; i < pereciveis.length; i++) {
    if (produtoLower.indexOf(pereciveis[i]) >= 0) {
      return 'PERECIVEL';
    }
  }

};

ControleConferenciaService.prototype.calculatePrazoLimite = function(tipoProduto) {
  var hoje = new Date();
  var prazoLimite = new Date(hoje);

  if (tipoProduto == 'PERECIVEL') {
    // Protocolo específico : 24 horas para perecíveis
    prazoLimite.setHours(hoje.getHours() + 24);
  } else {
    // Lei 14.133 : 10 dias úteis
    prazoLimite.setDate(hoje.getDate() + 10);
  }

};

ControleConferenciaService.prototype.recalculateStatus = function(controleId) {
  // Implementar lógica de recálculo de status
  // Por simplicidade, apenas atualizar timestamp
  this.repository.update(controleId, {
    ultima_atualizacao : new Date()
  });
};

ControleConferenciaService.prototype.generateId = function() {
};

/**
 * REGISTRAR SERVIÇOS NO FACTORY
 */
function registerCoreServices() {
  ServiceFactory.register('NotaFiscalService', DominioNotaFiscalService);
  ServiceFactory.register('ControleConferenciaService', ControleConferenciaService);
  ServiceFactory.register('ComplianceValidatorService', ComplianceValidatorService);
  ServiceFactory.register('LegalFrameworkService', LegalFrameworkService);
  ServiceFactory.register('UINotificationService', UINotificationService);

  SystemLogger.info('Core services registered in factory');
}
