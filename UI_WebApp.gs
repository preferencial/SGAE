'use strict';

/**
 * UI_WEBAPP
 * Consolidado de : WebApp.gs, ServerEndpoints.gs
 * @version 2.0.0
 * @created 2025-11-04
 */


// ---- WebApp.gs ----
/**
 * WebApp.gs
 * Configuração do Web App - Interface Mobile como padrão
 * Sistema UNIAE CRE PP/Cruzeiro
 */

/**
 * ATENÇÃO: Esta função doGet foi DESATIVADA
 * 
 * Motivo: Conflito com a função doGet principal em _INIT_Bootstrap.gs
 * 
 * A função doGet principal está em _INIT_Bootstrap.gs e inclui:
 * - Roteamento de páginas
 * - Verificação de autenticação
 * - Tratamento de erros
 * - Fallbacks automáticos
 * 
 * Se precisar modificar o comportamento do doGet, edite _INIT_Bootstrap.gs
 */

// COMENTADO - Usando doGet do _INIT_Bootstrap.gs
/*
// RENOMEADO: doGet canonico fica em _INIT_Main.gs (evita colisao global).
function _uiMobile_legacy_doGet(e) {
  try {
    // Tentar carregar interface mobile corrigida
    return HtmlService.createTemplateFromFile('UI_HTML_Mobile_FIXED')
      .evaluate()
      .setTitle('UNIAE Mobile - Sistema de Gestão')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (error) {
    // Fallback : retornar página simples se mobile não existir
    logWarn('Erro ao carregar UI_HTML_Mobile_FIXED, usando fallback', {error : error.message});

    return createBasicHtmlPage();
  }
}
*/

// NOTA: Função include() movida para Core_HTML_Includes.gs para evitar duplicação

/**
 * FUNÇÕES BACKEND PARA MOBILE INTERFACE
 */

/**
 * Obter estatísticas do sistema
 */
function getSystemStats() {
  try {
    var stats = {};

    // Notas Fiscais
    var nfData = getSheetData('Notas_Fiscais', 1000);
    stats.notas_fiscais = nfData.count || 0;

    // Entregas
    var entregasData = getSheetData('Entregas', 1000);
    stats.entregas = entregasData.count || 0;

    // Pendentes (NFs com status Pendente ou Recebida)
    var pendentes = 0;
    if (nfData.data && nfData.data.length > 0) {
      var statusIdx = nfData.headers.indexOf('Status_NF');
      if (statusIdx >= 0) {
        var pendentes = nfData.data.filter(function(row) {
          var status = row[statusIdx];
          return status == 'Recebida' || status == 'Pendente';
        }).length;
      }
    }
    stats.pendentes = pendentes;

    // Glosas
    var glosasData = getSheetData('Glosas', 1000);
    stats.glosas = glosasData.count || 0;


  } catch (e) {
    Logger.log('Erro getSystemStats : ' + e.message);
    return {
      notas_fiscais : 0,
      entregas : 0,
      pendentes : 0,
      glosas : 0
    };
  }
}


/**
 * Registrar Nota Fiscal
 */
function registrarNotaFiscal(dados) {
  try {
    try {
      var rowData = [
        generateId(),
        dados.numero_nf,
        dados.chave_acesso,
        dados.data_emissao,
        new Date(), // Data_Recebimento
        dados.cnpj,
        dados.fornecedor,
        dados.nota_empenho,
        Number(dados.valor_total),
        'Recebida', // Status_NF
        '', // Responsavel_Conferencia
        '', // Data_Conferencia
        '', // Observacoes
        '', // Arquivo_PDF
      ];

      return addSheetRow('Notas_Fiscais', rowData);

    } catch (e) {
      return {success : false, error : e.message};
    }
  } catch (error) {
    Logger.log("Erro em registrarNotaFiscal: " + error.message);
    throw error;
  }
}

/**
 * Registrar Entrega
 */
function registrarEntrega(dados) {
  try {
    try {
      var rowData = [
        generateId(),
        dados.data_entrega,
        dados.unidade_escolar,
        dados.fornecedor,
        '', // Produto_Codigo
        dados.produto,
        '', // Quantidade_Solicitada
        Number(dados.quantidade),
        dados.unidade_medida,
        '', // Valor_Unitario
        '', // Valor_Total
        'Entregue', // Status_Entrega
        dados.qualidade_ok,
        Session.getActiveUser().getEmail(), // Responsavel_Recebimento
        '', // Observacoes
      ];

      return addSheetRow('Entregas', rowData);

    } catch (e) {
      return {success : false, error : e.message};
    }
  } catch (error) {
    Logger.log("Erro em registrarEntrega: " + error.message);
    throw error;
  }
}

/**
 * Registrar Conferência
 */
function registrarConferencia(dados) {
  try {
    var rowData = [
      generateId(),
      new Date(), // Data_Controle
      '', // Empresa_Fornecedor
      dados.numero_nf,
      '', // Valor_Total
      dados.status_soma,
      new Date(), // Data_Soma
      dados.responsavel,
      dados.observacoes || '',
      dados.status_pdgp,
      new Date(), // Data_PDGP
      dados.responsavel,
      '',
      dados.status_consulta_nf,
      new Date(), // Data_Consulta_NF
      dados.responsavel,
      '',
      'PENDENTE', // Status_Atesto
      '', // Data_Atesto
      '', // Responsavel_Atesto
      '', // Numero_Despacho
      'EM_CONFERENCIA', // Status_Geral
      50, // Percentual_Conclusao
      '', // Prazo_Limite
      0, // Dias_Pendente
      'NAO', // Tem_Cancelamento
      'NAO', // Tem_Devolucao
      '', // Detalhes_Ocorrencias
    ];

    return addSheetRow('Controle_Conferencia', rowData);

  } catch (e) {
    return {success : false, error : e.message};
  }
}

/**
 * Registrar Recusa (versão simplificada)
 * @deprecated Use registrarRecusa() de Core_Workflow_API.gs para fluxo completo
 */
function registrarRecusa_WebApp(dados) {
  try {
    try {
      var rowData = [
        generateId(),
        new Date(), // Data_Recusa
        dados.fornecedor,
        dados.produto,
        Number(dados.quantidade),
        '', // Unidade_Medida
        dados.motivo,
        dados.motivo, // Categoria_Problema
        dados.responsavel,
        'Pendente', // Status_Resolucao
        '', // Data_Resolucao
        '', // Acao_Tomada
        0, // Valor_Impacto
        '', // Observacoes
      ];

      return addSheetRow('Recusas', rowData);

    } catch (e) {
      return {success : false, error : e.message};
    }
  } catch (error) {
    Logger.log("Erro em registrarRecusa_WebApp: " + error.message);
    throw error;
  }
}

/**
 * Registrar Glosa
 */
function registrarGlosa(dados) {
  try {
    try {
      var rowData = [
        generateId(),
        new Date(), // Data_Glosa
        dados.numero_nf,
        dados.fornecedor,
        dados.produto,
        '', // Quantidade_Glosada
        '', // Valor_Unitario
        Number(dados.valor_glosa),
        dados.motivo,
        dados.motivo, // Categoria_Glosa
        'Aplicada', // Status_Glosa
        dados.responsavel,
        '', // Data_Contestacao
        '', // Justificativa_Fornecedor
        '', // Decisao_Final
        '', // Observacoes
      ];

      return addSheetRow('Glosas', rowData);

    } catch (e) {
      return {success : false, error : e.message};
    }
  } catch (error) {
    Logger.log("Erro em registrarGlosa: " + error.message);
    throw error;
  }
}

/**
 * Registrar Fornecedor
 */
function registrarFornecedor(dados) {
  try {
    var rowData = [
      generateId(),
      dados.cnpj,
      dados.razao_social,
      dados.nome_fantasia || '',
      dados.email || '',
      dados.telefone || '',
      '', // Endereco_Completo
      '', // Responsavel_Comercial
      'Ativo', // Status_Fornecedor
      0, // Avaliacao_Geral
      0, // Total_Entregas
      0, // Total_Recusas
      0, // Total_Glosas
      100, // Percentual_Conformidade
      new Date(), // Data_Ultima_Avaliacao
      '', // Observacoes
    ];

    return addSheetRow('Fornecedores', rowData);

  } catch (e) {
    return {success : false, error : e.message};
  }
}

/**
 * Registrar PDGP
 */
function registrarPDGP(dados) {
  try {
    try {
      var rowData = [
        generateId(),
        dados.ano,
        dados.periodo,
        dados.unidade_escolar,
        dados.produto,
        '', // Categoria_Produto
        Number(dados.quantidade),
        '', // Unidade_Medida
        0, // Valor_Estimado
        '', // Fornecedor_Previsto
        'Planejado', // Status_Planejamento
        '', // Data_Inicio_Prevista
        '', // Data_Fim_Prevista
        '', // Observacoes
      ];

      return addSheetRow('PDGP', rowData);

    } catch (e) {
      return {success : false, error : e.message};
    }
  } catch (error) {
    Logger.log("Erro em registrarPDGP: " + error.message);
    throw error;
  }
}

/**
 * Função de login para mobile
 */
function loginMobile(email, senha) {
  try {
    // Verificar se função fazerLogin existe
    if (typeof fazerLogin == 'function') {
      return fazerLogin(email, senha);
    }

    // Fallback : autenticação básica

  } catch (e) {
    logError('Erro ao fazer login', {error : e.message, email : email});
    return {
      success : false,
      error : 'Erro ao fazer login : ' + e.message
    };
  }
}


/**
 * Obter dados do dashboard
 */
function getDashboardData() {
  try {
    return {
      stats : getSystemStats(),
      recentActivity : getRecentActivity()
    };
  } catch (e) {
      return null;
    }
  }


/**
 * Obter atividade recente
 */
function getRecentActivity() {
  try {
    var activities = [];

    // Últimas 5 notas fiscais
    var nfData = getSheetData('Notas_Fiscais', 5);
    if (nfData.data && nfData.data.length > 0) {
      nfData.data.forEach(function(row) {
        activities.push({
          type : 'nota_fiscal',
          description : 'NF ' + row[1] + ' - ' + row[6],
          date : row[4]
        });
      });
    }


  } catch (e) {
      return null;
    }
  }


// ---- ServerEndpoints.gs ----
/**
 * ServerEndpoints.gs
 * Endpoints completos para o CRUD de todas as entidades do sistema
 * Retorna JSON para integração com interface web
 */

// == UTILITÁRIOS ==

/**
 * Resposta padrão para endpoints
 */
function apiResponse(success, data, message) {
  try {
    return {
      success : success,
      data : data || null,
      message : message || '',
      timestamp : new Date().toISOString()
    };
  } catch (error) {
    Logger.log("Erro em apiResponse: " + error.message);
    throw error;
  }
}

/**
 * Obter índice de coluna por nome de header
 */
function getColIndex(headers, names) {
  try {
    // Validação de entrada
    if (!headers || !Array.isArray(headers)) {
      Logger.log('getColIndex: headers inválidos ou não fornecidos');
      return -1;
    }
    if (!names || !Array.isArray(names)) {
      Logger.log('getColIndex: names inválidos ou não fornecidos');
      return -1;
    }
  
    var normalized = headers.map(function(h){ return String(h||'').toLowerCase().trim(); });
    for (var i = 0; i < names.length; i++) {
      var idx = normalized.indexOf(names[i].toLowerCase());
      if (idx >= 0) return idx;
    }
    return -1; // Retornar -1 se não encontrar
  } catch (error) {
    Logger.log("Erro em getColIndex: " + error.message);
    throw error;
  }
}

// == MÉTRICAS / DASHBOARD ==

/**
 * Retorna métricas consolidadas para o dashboard
 * @deprecated Use getDashboardMetricsUnificado() do Core_CRUD_Frontend_Bridge.gs
 * Esta função foi renomeada para evitar conflito de nomenclatura
 */
function _getDashboardMetrics_WebApp() {
  try {
    try {
      try {
        var metrics = {
          notasFiscais : 0,
          entregas : 0,
          recusas : 0,
          glosas : 0,
          valorTotalNFs : 0,
          valorTotalGlosas : 0,
          fornecedores : 0
        };

        // Contar Notas Fiscais
        var nfSheet = getSheet('Notas_Fiscais');
        if (nfSheet && nfSheet.getLastRow() > 1) {
          metrics.notasFiscais = nfSheet.getLastRow() - 1;
          var nfData = getSafeDataRange(nfSheet);
          var valorIdx = getColIndex(nfData[0], ['valor', 'valor total', 'total']);
          for (var i = 1; i < nfData.length; i++) {
            metrics.valorTotalNFs += Number(nfData[i][valorIdx]) || 0;
          }
        }

        // Contar Entregas
        var entSheet = getSheet('Entregas');
        if (entSheet && entSheet.getLastRow() > 1) {
          metrics.entregas = entSheet.getLastRow() - 1;
        }

        // Contar Recusas
        var recSheet = getSheet('Recusas');
        if (recSheet && recSheet.getLastRow() > 1) {
          metrics.recusas = recSheet.getLastRow() - 1;
        }

        // Contar Glosas
        var glosasSheet = getSheet('Glosas');
        if (glosasSheet && glosasSheet.getLastRow() > 1) {
          metrics.glosas = glosasSheet.getLastRow() - 1;
          var gData = getSafeDataRange(glosasSheet);
          var gValIdx = gData[0].indexOf('Valor Total Glosa');
          for (var j = 1; j < gData.length; j++) {
            metrics.valorTotalGlosas += Number(gData[j][gValIdx]) || 0;
          }
        }

        // Contar Fornecedores únicos
        var fornSet = {};
        if (nfSheet && nfSheet.getLastRow() > 1) {
          var nfData2 = getSafeDataRange(nfSheet);
          var fornIdx = getColIndex(nfData2[0], ['fornecedor', 'supplier']);
          for (var k = 1; k < nfData2.length; k++) {
            var forn = String(nfData2[k][fornIdx] || '').trim();
            if (forn) fornSet[forn] = true;
          }
        }
        metrics.fornecedores = Object.keys(fornSet).length;

      } catch (e) {
          return null;
        }
    } catch (error) {
      Logger.log("Erro em _getDashboardMetrics_WebApp: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em _getDashboardMetrics_WebApp: " + error.message);
    throw error;
  }
  }


// == NOTAS FISCAIS - CRUD ==

/**
 * Listar todas as notas fiscais (READ)
 * Sincroniza dados de múltiplas fontes: Notas_Fiscais e Workflow_NotasFiscais
 * @deprecated Use listNotasFiscaisUnificado() do Core_CRUD_Frontend_Bridge.gs
 * Esta função foi renomeada para evitar conflito de nomenclatura
 */
function _listNotasFiscais_WebApp(limit) {
  try {
    try {
      try {
        var maxLimit = limit || 100;
        var allRows = [];
        var ss = getSS();
        var idsProcessados = {};
    
        Logger.log('listNotasFiscais: Iniciando busca sincronizada...');
    
        // 1. Ler da sheet principal (Notas_Fiscais) se existir
        var sheetPrincipal = ss.getSheetByName('Notas_Fiscais');
        if (sheetPrincipal && sheetPrincipal.getLastRow() > 1) {
          Logger.log('listNotasFiscais: Sheet Notas_Fiscais encontrada com ' + sheetPrincipal.getLastRow() + ' linhas');
          var dataPrincipal = sheetPrincipal.getDataRange().getValues();
          var headersPrincipal = dataPrincipal[0];
      
          // Mapear índices dos headers
          var idxMap = {};
          headersPrincipal.forEach(function(h, i) { idxMap[h.toLowerCase().replace(/[_\s]/g, '')] = i; });
      
          for (var j = 1; j < dataPrincipal.length; j++) {
            var row = dataPrincipal[j];
            var id = row[idxMap['id'] !== undefined ? idxMap['id'] : 0];
        
            // Pular linhas vazias
            if (!id && !row[idxMap['numeronf'] !== undefined ? idxMap['numeronf'] : 1]) continue;
        
            var nfObj = {
              rowIndex: j + 1,
              source: 'Notas_Fiscais',
              id: id,
              Numero_NF: row[idxMap['numeronf'] !== undefined ? idxMap['numeronf'] : 1],
              'Nota Fiscal': row[idxMap['numeronf'] !== undefined ? idxMap['numeronf'] : 1],
              Serie: row[idxMap['serie'] !== undefined ? idxMap['serie'] : 2],
              Chave_Acesso: row[idxMap['chaveacesso'] !== undefined ? idxMap['chaveacesso'] : 3],
              Fornecedor: row[idxMap['fornecedor'] !== undefined ? idxMap['fornecedor'] : 4],
              Fornecedor_Nome: row[idxMap['fornecedor'] !== undefined ? idxMap['fornecedor'] : 4],
              CNPJ: row[idxMap['cnpj'] !== undefined ? idxMap['cnpj'] : 5],
              Valor_Total: row[idxMap['valortotal'] !== undefined ? idxMap['valortotal'] : 6],
              'Valor Total': row[idxMap['valortotal'] !== undefined ? idxMap['valortotal'] : 6],
              Valor_Liquido: row[idxMap['valorliquido'] !== undefined ? idxMap['valorliquido'] : 7],
              Valor_Glosa: row[idxMap['valorglosa'] !== undefined ? idxMap['valorglosa'] : 8],
              Data_Emissao: row[idxMap['dataemissao'] !== undefined ? idxMap['dataemissao'] : 9],
              'Data Emissão': row[idxMap['dataemissao'] !== undefined ? idxMap['dataemissao'] : 9],
              Data_Cadastro: row[idxMap['datacadastro'] !== undefined ? idxMap['datacadastro'] : 10],
              Status: row[idxMap['status'] !== undefined ? idxMap['status'] : 11],
              Status_NF: row[idxMap['status'] !== undefined ? idxMap['status'] : 11],
              Usuario_Cadastro: row[idxMap['usuariocadastro'] !== undefined ? idxMap['usuariocadastro'] : 12],
              Nota_Empenho: row[idxMap['notaempenho'] !== undefined ? idxMap['notaempenho'] : 13],
              'Nota de Empenho': row[idxMap['notaempenho'] !== undefined ? idxMap['notaempenho'] : 13],
              Itens_Quantidade: row[idxMap['itensquantidade'] !== undefined ? idxMap['itensquantidade'] : 14],
              Observacoes: row[idxMap['observacoes'] !== undefined ? idxMap['observacoes'] : 15]
            };
        
            allRows.push(nfObj);
            if (id) idsProcessados[id] = true;
          }
        } else {
          Logger.log('listNotasFiscais: Sheet Notas_Fiscais não encontrada ou vazia');
        }
    
        // 2. Ler da sheet de workflows (Workflow_NotasFiscais) se existir
        var sheetWorkflow = ss.getSheetByName('Workflow_NotasFiscais');
        if (sheetWorkflow && sheetWorkflow.getLastRow() > 1) {
          Logger.log('listNotasFiscais: Sheet Workflow_NotasFiscais encontrada com ' + sheetWorkflow.getLastRow() + ' linhas');
          var dataWF = sheetWorkflow.getDataRange().getValues();
          var headersWF = dataWF[0];
      
          // Mapear índices dos headers do workflow
          var wfIdxMap = {};
          headersWF.forEach(function(h, i) { wfIdxMap[h.toLowerCase().replace(/[_\s]/g, '')] = i; });
      
          for (var i = 1; i < dataWF.length; i++) {
            var row = dataWF[i];
            var id = row[wfIdxMap['id'] !== undefined ? wfIdxMap['id'] : 0];
        
            // Pular linhas vazias ou já processadas
            if (!id) continue;
            if (idsProcessados[id]) continue;
        
            // Mapear campos do workflow para o formato esperado
            allRows.push({
              rowIndex: i + 1,
              source: 'Workflow_NotasFiscais',
              id: id,
              Numero_NF: row[wfIdxMap['numero'] !== undefined ? wfIdxMap['numero'] : 2],
              'Nota Fiscal': row[wfIdxMap['numero'] !== undefined ? wfIdxMap['numero'] : 2],
              Serie: row[wfIdxMap['serie'] !== undefined ? wfIdxMap['serie'] : 3],
              Chave_Acesso: row[wfIdxMap['chaveacesso'] !== undefined ? wfIdxMap['chaveacesso'] : 4],
              Data_Emissao: row[wfIdxMap['dataemissao'] !== undefined ? wfIdxMap['dataemissao'] : 5],
              'Data Emissão': row[wfIdxMap['dataemissao'] !== undefined ? wfIdxMap['dataemissao'] : 5],
              CNPJ: row[wfIdxMap['cnpj'] !== undefined ? wfIdxMap['cnpj'] : 6],
              Fornecedor: row[wfIdxMap['fornecedor'] !== undefined ? wfIdxMap['fornecedor'] : 7],
              Fornecedor_Nome: row[wfIdxMap['fornecedor'] !== undefined ? wfIdxMap['fornecedor'] : 7],
              Produto: row[wfIdxMap['produto'] !== undefined ? wfIdxMap['produto'] : 8],
              Quantidade: row[wfIdxMap['quantidade'] !== undefined ? wfIdxMap['quantidade'] : 9],
              Unidade: row[wfIdxMap['unidade'] !== undefined ? wfIdxMap['unidade'] : 10],
              Valor_Unitario: row[wfIdxMap['valorunitario'] !== undefined ? wfIdxMap['valorunitario'] : 11],
              Valor_Total: row[wfIdxMap['valortotal'] !== undefined ? wfIdxMap['valortotal'] : 12],
              'Valor Total': row[wfIdxMap['valortotal'] !== undefined ? wfIdxMap['valortotal'] : 12],
              Nota_Empenho: row[wfIdxMap['notaempenho'] !== undefined ? wfIdxMap['notaempenho'] : 13],
              'Nota de Empenho': row[wfIdxMap['notaempenho'] !== undefined ? wfIdxMap['notaempenho'] : 13],
              Status: row[wfIdxMap['status'] !== undefined ? wfIdxMap['status'] : 14],
              Status_NF: row[wfIdxMap['status'] !== undefined ? wfIdxMap['status'] : 14],
              Usuario_Cadastro: row[wfIdxMap['usuario'] !== undefined ? wfIdxMap['usuario'] : 15]
            });
          }
        } else {
          Logger.log('listNotasFiscais: Sheet Workflow_NotasFiscais não encontrada ou vazia');
        }
    
        Logger.log('listNotasFiscais: Total de NFs encontradas: ' + allRows.length);
    
        // Ordenar por data de cadastro/criação (mais recentes primeiro)
        allRows.sort(function(a, b) {
          var dateA = a.Data_Cadastro || a.Data_Emissao || a['Data Emissão'] || 0;
          var dateB = b.Data_Cadastro || b.Data_Emissao || b['Data Emissão'] || 0;
          return new Date(dateB) - new Date(dateA);
        });

        return apiResponse(true, allRows.slice(0, maxLimit));
      } catch (e) {
        Logger.log('Erro listNotasFiscais: ' + e.message + ' - Stack: ' + e.stack);
        return apiResponse(false, null, 'Erro: ' + e.message);
      }
    } catch (error) {
      Logger.log("Erro em _listNotasFiscais_WebApp: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em _listNotasFiscais_WebApp: " + error.message);
    throw error;
  }
}


/**
 * Criar nota fiscal (CREATE) com validação
 * Salva na sheet Notas_Fiscais com os headers corretos do schema
 */
function createNotaFiscal(nfData) {
  try {
    try {
      try {
        try {
          // Validação de entrada
          if (!nfData || typeof nfData !== 'object') {
            logWarn('createNotaFiscal: Dados não fornecidos');
            return apiResponse(false, null, 'Dados da nota fiscal não fornecidos');
          }
    
          // Validar dados antes de inserir
          var validation = validateNotaFiscal(nfData);
          if (!validation.valid) {
            logWarn('Tentativa de criar NF com dados inválidos', {validation : validation, data : nfData});
            return apiResponse(false, null, validation.message);
          }

          var ss = getSS();
          if (!ss) return apiResponse(false, null, 'Planilha não encontrada');
          var sheet = ss.getSheetByName('Notas_Fiscais');
    
          // Se a sheet não existir, criar com headers corretos
          if (!sheet) {
            sheet = ss.insertSheet('Notas_Fiscais');
            var headers = ['id', 'numero_nf', 'serie', 'chave_acesso', 'fornecedor', 'cnpj', 'valor_total', 'valor_liquido', 'valor_glosa', 'data_emissao', 'data_cadastro', 'status', 'usuario_cadastro', 'nota_empenho', 'itens_quantidade', 'observacoes', 'data_recebimento', 'usuario_recebimento', 'data_atesto', 'usuario_atesto', 'parecer_atesto'];
            sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
            sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#4a86e8').setFontColor('white');
          }
    
          // Obter headers existentes
          var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
          // Gerar ID único
          var id = 'NF_' + new Date().getTime();
    
          // Criar objeto com valores mapeados para os headers
          var rowData = {};
          rowData['id'] = id;
          rowData['numero_nf'] = sanitizeString(nfData.notaFiscal || nfData.numero_nf || nfData.Numero_NF, 100);
          rowData['serie'] = sanitizeString(nfData.serie || '1', 10);
          rowData['chave_acesso'] = sanitizeString(nfData.chaveAcesso || nfData.chave_acesso || '', 50);
          rowData['fornecedor'] = sanitizeString(nfData.fornecedor || nfData.Fornecedor, 200);
          rowData['cnpj'] = sanitizeString(nfData.cnpj || nfData.CNPJ || '', 20);
          rowData['valor_total'] = sanitizeNumber(nfData.valorTotal || nfData.valor_total || nfData.Valor_Total, 0);
          rowData['valor_liquido'] = sanitizeNumber(nfData.valorLiquido || nfData.valor_liquido || nfData.valorTotal || 0, 0);
          rowData['valor_glosa'] = sanitizeNumber(nfData.valorGlosa || nfData.valor_glosa || 0, 0);
          rowData['data_emissao'] = nfData.dataEmissao || nfData.data_emissao || new Date();
          rowData['data_cadastro'] = new Date();
          rowData['status'] = sanitizeString(nfData.status || 'PENDENTE', 50);
          rowData['usuario_cadastro'] = nfData.usuarioCadastro || nfData.usuario_cadastro || Session.getActiveUser().getEmail() || '';
          rowData['nota_empenho'] = sanitizeString(nfData.notaEmpenho || nfData.nota_empenho || '', 100);
          rowData['itens_quantidade'] = sanitizeNumber(nfData.itensQuantidade || nfData.itens_quantidade || 0, 0);
          rowData['observacoes'] = sanitizeString(nfData.observacoes || '', 500);
          rowData['data_recebimento'] = nfData.dataRecebimento || '';
          rowData['usuario_recebimento'] = nfData.usuarioRecebimento || '';
          rowData['data_atesto'] = nfData.dataAtesto || '';
          rowData['usuario_atesto'] = nfData.usuarioAtesto || '';
          rowData['parecer_atesto'] = nfData.parecerAtesto || '';
    
          // Criar array de valores na ordem dos headers
          var row = headers.map(function(h) {
            var key = h.toLowerCase().replace(/\s/g, '_');
            return rowData[key] !== undefined ? rowData[key] : '';
          });

          sheet.appendRow(row);
          var newRowIndex = sheet.getLastRow();

          logInfo('Nota fiscal criada', {rowIndex: newRowIndex, id: id, nf: rowData['numero_nf']});
    
          return apiResponse(true, {id: id, rowIndex: newRowIndex}, 'Nota fiscal criada com sucesso');
        } catch (e) {
          logError('Erro ao criar nota fiscal', {error: e.message, stack: e.stack, data: nfData});
          return apiResponse(false, null, 'Erro ao criar nota fiscal: ' + e.message);
        }
      } catch (error) {
        Logger.log("Erro em createNotaFiscal: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em createNotaFiscal: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em createNotaFiscal: " + error.message);
    throw error;
  }
}


/**
 * Atualizar nota fiscal (UPDATE)
 * @deprecated MOVIDO para Core_Sync_Backend_Frontend.gs
 * Use updateNotaFiscal() do módulo de sincronização
 */
function updateNotaFiscal_WebApp(rowIndex, nfData) {
  try {
    try {
      // Redireciona para a função centralizada
      if (typeof updateNotaFiscal === 'function') {
        return updateNotaFiscal(rowIndex, nfData);
      }
  
      try {
        var sheet = getSheet('Notas_Fiscais');
        if (!sheet) return apiResponse(false, null, 'Aba Notas_Fiscais não encontrada');

        var headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
        var nfIdx = getColIndex(headers, ['nota fiscal', 'nf-e', 'numero']);
        var dataIdx = getColIndex(headers, ['data', 'data emissão']);
        var fornIdx = getColIndex(headers, ['fornecedor', 'supplier']);
        var empIdx = getColIndex(headers, ['empenho', 'nota de empenho']);
        var valorIdx = getColIndex(headers, ['valor', 'valor total']);
        var statusIdx = getColIndex(headers, ['status']);

        if (nfData.notaFiscal != undefined && nfIdx >= 0) sheet.getRange(rowIndex, nfIdx + 1).setValue(nfData.notaFiscal);
        if (nfData.dataEmissao != undefined && dataIdx >= 0) sheet.getRange(rowIndex, dataIdx + 1).setValue(nfData.dataEmissao);
        if (nfData.fornecedor != undefined && fornIdx >= 0) sheet.getRange(rowIndex, fornIdx + 1).setValue(nfData.fornecedor);
        if (nfData.notaEmpenho != undefined && empIdx >= 0) sheet.getRange(rowIndex, empIdx + 1).setValue(nfData.notaEmpenho);
        if (nfData.valorTotal != undefined && valorIdx >= 0) sheet.getRange(rowIndex, valorIdx + 1).setValue(Number(nfData.valorTotal));
        if (nfData.status != undefined && statusIdx >= 0) sheet.getRange(rowIndex, statusIdx + 1).setValue(nfData.status);

        return apiResponse(true, {rowIndex : rowIndex}, 'Nota fiscal atualizada');
      } catch (e) {
        return apiResponse(false, null, 'Erro ao atualizar NF : ' + e.message);
      }
    } catch (error) {
      Logger.log("Erro em updateNotaFiscal_WebApp: " + error.message);
      throw error; // Re-lança para tratamento superior
    }
  } catch (error) {
    Logger.log("Erro em updateNotaFiscal_WebApp: " + error.message);
    throw error;
  }
}

/**
 * Deletar nota fiscal (DELETE)
 * @deprecated MOVIDO para Core_Sync_Backend_Frontend.gs
 */
function deleteNotaFiscal_WebApp(rowIndex) {
  try {
    try {
      // Redireciona para a função centralizada
      if (typeof deleteNotaFiscal === 'function') {
        return deleteNotaFiscal(rowIndex);
      }
  
      try {
        var sheet = getSheet('Notas_Fiscais');
        if (!sheet) return apiResponse(false, null, 'Aba não encontrada');
        if (rowIndex <= 1) return apiResponse(false, null, 'Não é possível deletar o cabeçalho');

        sheet.deleteRow(rowIndex);
        return apiResponse(true, null, 'Nota fiscal deletada');
      } catch (e) {
        return apiResponse(false, null, 'Erro ao deletar NF : ' + e.message);
      }
    } catch (error) {
      Logger.log("Erro em deleteNotaFiscal_WebApp: " + error.message);
      throw error; // Re-lança para tratamento superior
    }
  } catch (error) {
    Logger.log("Erro em deleteNotaFiscal_WebApp: " + error.message);
    throw error;
  }
}

// == ENTREGAS - CRUD ==

/**
 * Listar entregas (READ)
 */
function listEntregas(limit) {
  try {
    try {
      try {
        limit = limit || 100;
        var sheet = getSheet('Entregas');
        if (!sheet || sheet.getLastRow() <= 1) {
          return apiResponse(true, []);
        }

        var data = getSafeDataRange(sheet, limit + 1);
        var headers = data[0];
        var rows = data.slice(1, limit + 1).map(function(row, idx) {
          var obj = { rowIndex: idx + 2 };
          headers.forEach(function(h, i) {
            obj[h] = row[i];
          });
          return obj;
        });

        return apiResponse(true, rows);
      } catch (e) {
        return apiResponse(false, null, 'Erro: ' + e.message);
      }
    } catch (error) {
      Logger.log("Erro em listEntregas: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em listEntregas: " + error.message);
    throw error;
  }
}


/**
 * Criar entrega (CREATE)
 */
function createEntrega(entregaData) {
  try {
    try {
      try {
        try {
          var sheet = getOrCreateSheetSafe('Entregas');

          if (sheet.getLastRow() == 0) {
            var headers = ['Data Entrega','Nota Fiscal','Fornecedor','Unidade Escolar','Produto','Quantidade Solicitada','Quantidade Entregue','Unidade','Status','Responsável Recebimento','Observações'];
            sheet.getRange(1,1,1,headers.length).setValues([headers]);
          }

          var qtdSolic = Number(entregaData.quantidadeSolicitada) || 0;
          var qtdEntr = Number(entregaData.quantidadeEntregue) || 0;
          var status;
          if (qtdSolic == qtdEntr) {
            status = 'Entregue Completo';
          } else {
            status = qtdEntr > 0 ? 'Entregue Parcial' : 'Não Entregue';
          }

          var row = [
            entregaData.dataEntrega || new Date(),
            entregaData.notaFiscal || '',
            entregaData.fornecedor || '',
            entregaData.unidadeEscolar || '',
            entregaData.produto || '',
            qtdSolic,
            qtdEntr,
            entregaData.unidade || 'kg',
            status,
            entregaData.responsavel || '',
            entregaData.observacoes || ''
          ];

          sheet.appendRow(row);
          return { success: true, message: 'Entrega registrada com sucesso' };
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em createEntrega: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em createEntrega: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em createEntrega: " + error.message);
    throw error;
  }
}


/**
 * Atualizar entrega (UPDATE)
 */
function updateEntrega(rowIndex, entregaData) {
  try {
    try {
      try {
        try {
          var sheet = getSheet('Entregas');
          if (!sheet) return apiResponse(false, null, 'Aba Entregas não encontrada');

          var headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];

          if (entregaData.dataEntrega != undefined) {
            var idx = getColIndex(headers, ['data entrega', 'data']);
            if (idx >= 0) sheet.getRange(rowIndex, idx + 1).setValue(entregaData.dataEntrega);
          }
          if (entregaData.quantidadeEntregue != undefined) {
            var qIdx = getColIndex(headers, ['quantidade entregue']);
            if (qIdx >= 0) {
              sheet.getRange(rowIndex, qIdx + 1).setValue(Number(entregaData.quantidadeEntregue));
              // Recalcular status
              var qSolIdx = getColIndex(headers, ['quantidade solicitada']);
              var statusIdx = getColIndex(headers, ['status']);
              if (qSolIdx >= 0 && statusIdx >= 0) {
                var qSol = sheet.getRange(rowIndex, qSolIdx + 1).getValue();
                var qEnt = Number(entregaData.quantidadeEntregue);
                var newStatus;
                if (qSol == qEnt) {
                  newStatus = 'Entregue Completo';
                } else {
                  var newStatus;
                  if (qEnt > 0) {
                    newStatus = 'Entregue Parcial';
                  } else {
                    newStatus = 'Não Entregue';
                  }
                }
                sheet.getRange(rowIndex, statusIdx + 1).setValue(newStatus);
              }
            }
          }
          if (entregaData.observacoes != undefined) {
            var obsIdx = getColIndex(headers, ['observações', 'observacoes', 'obs']);
            if (obsIdx >= 0) sheet.getRange(rowIndex, obsIdx + 1).setValue(entregaData.observacoes);
          }

        } catch (e) {
            return null;
          }
      } catch (error) {
        Logger.log("Erro em updateEntrega: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em updateEntrega: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em updateEntrega: " + error.message);
    throw error;
  }
  }


/**
 * Deletar entrega (DELETE)
 */
function deleteEntrega(rowIndex) {
  try {
    try {
      try {
        try {
          var sheet = getSheet('Entregas');
          if (!sheet) return apiResponse(false, null, 'Aba não encontrada');
          if (rowIndex <= 1) return apiResponse(false, null, 'Não é possível deletar o cabeçalho');

          sheet.deleteRow(rowIndex);
          return apiResponse(true, null, 'Entrega deletada');
        } catch (e) {
          return apiResponse(false, null, 'Erro ao deletar entrega : ' + e.message);
        }
      } catch (error) {
        Logger.log("Erro em deleteEntrega: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em deleteEntrega: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em deleteEntrega: " + error.message);
    throw error;
  }
}

// == RECUSAS - CRUD ==

/**
 * Listar recusas (READ)
 */
function listRecusas(limit) {
  try {
    try {
      try {
        limit = limit || 100;
        var sheet = getSheet('Recusas');
        if (!sheet || sheet.getLastRow() <= 1) {
          return apiResponse(true, []);
        }

        var data = getSafeDataRange(sheet, limit + 1);
        var headers = data[0];
        var rows = data.slice(1, limit + 1).map(function(row, idx) {
          var obj = {rowIndex : idx + 2};
          headers.forEach(function(h, i) {
            obj[h] = row[i];
          });
          return obj;
        });
        return apiResponse(true, rows);
      } catch (e) {
        return apiResponse(false, null, 'Erro: ' + e.message);
      }
    } catch (error) {
      Logger.log("Erro em listRecusas: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em listRecusas: " + error.message);
    throw error;
  }
}


/**
 * Criar recusa (CREATE)
 */
function createRecusa(recusaData) {
  try {
    try {
      try {
        try {
          var sheet = getOrCreateSheetSafe('Recusas');

          if (sheet.getLastRow() == 0) {
            var headers = ['Data Recusa','Unidade Escolar','Fornecedor','Produto','Quantidade Recusada','Motivo','NF','Responsável','Ação Tomada','Status'];
            sheet.getRange(1,1,1,headers.length).setValues([headers]);
          }

          var row = [
            recusaData.dataRecusa || new Date(),
            recusaData.unidadeEscolar || '',
            recusaData.fornecedor || '',
            recusaData.produto || '',
            recusaData.quantidadeRecusada || '',
            recusaData.motivo || '',
            recusaData.nf || '',
            recusaData.responsavel || '',
            recusaData.acaoTomada || 'Pendente',
            recusaData.status || 'Aguardando Providências'
          ];

          sheet.appendRow(row);
          return { success: true, message: 'Recusa registrada com sucesso' };
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em createRecusa: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em createRecusa: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em createRecusa: " + error.message);
    throw error;
  }
}


/**
 * Atualizar recusa (UPDATE)
 */
function updateRecusa(rowIndex, recusaData) {
  try {
    try {
      try {
        var sheet = getSheet('Recusas');
        if (!sheet) return apiResponse(false, null, 'Aba Recusas não encontrada');

        var headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];

        if (recusaData.acaoTomada != undefined) {
          var idx = getColIndex(headers, ['ação tomada', 'acao tomada']);
          if (idx >= 0) sheet.getRange(rowIndex, idx + 1).setValue(recusaData.acaoTomada);
        }
        if (recusaData.status != undefined) {
          var sIdx = getColIndex(headers, ['status']);
          if (sIdx >= 0) sheet.getRange(rowIndex, sIdx + 1).setValue(recusaData.status);
        }

      } catch (e) {
          return null;
        }
    } catch (error) {
      Logger.log("Erro em updateRecusa: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em updateRecusa: " + error.message);
    throw error;
  }
  }


/**
 * Deletar recusa (DELETE)
 */
function deleteRecusa(rowIndex) {
  try {
    try {
      try {
        try {
          var sheet = getSheet('Recusas');
          if (!sheet) return apiResponse(false, null, 'Aba não encontrada');
          if (rowIndex <= 1) return apiResponse(false, null, 'Não é possível deletar o cabeçalho');

          sheet.deleteRow(rowIndex);
          return apiResponse(true, null, 'Recusa deletada');
        } catch (e) {
          return apiResponse(false, null, 'Erro ao deletar recusa : ' + e.message);
        }
      } catch (error) {
        Logger.log("Erro em deleteRecusa: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em deleteRecusa: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em deleteRecusa: " + error.message);
    throw error;
  }
}

// == GLOSAS - CRUD ==

/**
 * Listar glosas (READ)
 */
function listGlosas(limit) {
  try {
    try {
      try {
        limit = limit || 100;
        var sheet = getSheet('Glosas');
        if (!sheet || sheet.getLastRow() <= 1) {
          return apiResponse(true, []);
        }

        var data = getSafeDataRange(sheet, limit + 1);
        var headers = data[0];
        var rows = data.slice(1, limit + 1).map(function(row, idx) {
          var obj = {rowIndex : idx + 2};
          headers.forEach(function(h, i) {
            obj[h] = row[i];
          });
          return obj;
        });
        return apiResponse(true, rows);
      } catch (e) {
        return apiResponse(false, null, 'Erro: ' + e.message);
      }
    } catch (error) {
      Logger.log("Erro em listGlosas: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em listGlosas: " + error.message);
    throw error;
  }
}


/**
 * Criar glosa (CREATE)
 */
function createGlosa(glosaData) {
  try {
    try {
      try {
        try {
          var sheet = getOrCreateSheetSafe('Glosas');

          if (sheet.getLastRow() == 0) {
            var headers = ['Data Registro','NF','Fornecedor','Produto/Item','Quantidade Glosada','Unidade','Valor Unitário','Valor Total Glosa','Motivo','Responsável','Status','Observações'];
            sheet.getRange(1,1,1,headers.length).setValues([headers]);
          }

          var qtd = Number(glosaData.quantidadeGlosada) || 0;
          var valorUnit = Number(glosaData.valorUnitario) || 0;
          var valorTotal = qtd * valorUnit;

          var row = [
            glosaData.dataRegistro || new Date(),
            glosaData.nf || '',
            glosaData.fornecedor || '',
            glosaData.produto || '',
            qtd,
            glosaData.unidade || 'kg',
            valorUnit,
            valorTotal,
            glosaData.motivo || '',
            glosaData.responsavel || '',
            glosaData.status || 'Pendente',
            glosaData.observacoes || ''
          ];

          sheet.appendRow(row);
          return { success: true, message: 'Glosa registrada com sucesso' };
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em createGlosa: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em createGlosa: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em createGlosa: " + error.message);
    throw error;
  }
}


/**
 * Atualizar glosa (UPDATE)
 */
function updateGlosa(rowIndex, glosaData) {
  try {
    try {
      try {
        var sheet = getSheet('Glosas');
        if (!sheet) return apiResponse(false, null, 'Aba Glosas não encontrada');

        var headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];

        if (glosaData.status != undefined) {
          var idx = getColIndex(headers, ['status']);
          if (idx >= 0) sheet.getRange(rowIndex, idx + 1).setValue(glosaData.status);
        }
        if (glosaData.observacoes != undefined) {
          var obsIdx = getColIndex(headers, ['observações', 'observacoes']);
          if (obsIdx >= 0) sheet.getRange(rowIndex, obsIdx + 1).setValue(glosaData.observacoes);
        }

      } catch (e) {
          return null;
        }
    } catch (error) {
      Logger.log("Erro em updateGlosa: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em updateGlosa: " + error.message);
    throw error;
  }
  }


/**
 * Deletar glosa (DELETE)
 */
function deleteGlosa(rowIndex) {
  try {
    try {
      try {
        try {
          var sheet = getSheet('Glosas');
          if (!sheet) return apiResponse(false, null, 'Aba não encontrada');
          if (rowIndex <= 1) return apiResponse(false, null, 'Não é possível deletar o cabeçalho');

          sheet.deleteRow(rowIndex);
          return apiResponse(true, null, 'Glosa deletada');
        } catch (e) {
          return apiResponse(false, null, 'Erro ao deletar glosa : ' + e.message);
        }
      } catch (error) {
        Logger.log("Erro em deleteGlosa: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em deleteGlosa: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em deleteGlosa: " + error.message);
    throw error;
  }
}

// == GRÁFICOS E RELATÓRIOS ==

/**
 * Obter dados para gráficos (entregas por fornecedor, glosas por motivo, etc)
 */
function getChartData(chartType) {
  try {
    try {
      try {
        var data = {};

        if (chartType == 'entregas_por_fornecedor') {
          var sheet = getSheet('Entregas');
          if (sheet && sheet.getLastRow() > 1) {
            var values = getSafeDataRange(sheet);
            var headers = values[0];
            var fornIdx = getColIndex(headers, ['fornecedor', 'supplier']);
            var countMap = {};

            for (var i = 1; i < values.length; i++) {
              var forn = String(values[i][fornIdx] || '').trim();
              if (forn) countMap[forn] = (countMap[forn] || 0) + 1;
            }

            data = {
              labels : Object.keys(countMap),
              values : Object.keys(countMap).map(function(k){ return countMap[k]; })
            };
          }
        }

        else if (chartType == 'glosas_por_motivo') {
          var gSheet = getSheet('Glosas');
          if (gSheet && gSheet.getLastRow() > 1) {
            var gValues = getSafeDataRange(gSheet);
            var gHeaders = gValues[0];
            var motIdx = gHeaders.indexOf('Motivo');
            var valIdx = gHeaders.indexOf('Valor Total Glosa');
            var motivoMap = {};

            for (var j = 1; j < gValues.length; j++) {
              var motivo = String(gValues[j][motIdx] || 'Sem motivo').trim();
              var valor = Number(gValues[j][valIdx]) || 0;
              motivoMap[motivo] = (motivoMap[motivo] || 0) + valor;
            }

            data = {
              labels : Object.keys(motivoMap),
              values : Object.keys(motivoMap).map(function(k){ return motivoMap[k]; })
            };
          }
        }

        else if (chartType == 'recusas_por_mes') {
          var rSheet = getSheet('Recusas');
          if (rSheet && rSheet.getLastRow() > 1) {
            var rValues = getSafeDataRange(rSheet);
            var rHeaders = rValues[0];
            var dataIdx = getColIndex(rHeaders, ['data recusa', 'data']);
            var mesMap = {};

            for (var k = 1; k < rValues.length; k++) {
              var dt = rValues[k][dataIdx];
              if (dt) {
                var d = new Date(dt);
                var mes = Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM');
                mesMap[mes] = (mesMap[mes] || 0) + 1;
              }
            }

            data = {
              labels : Object.keys(mesMap).sort(),
              values : Object.keys(mesMap).sort().map(function(k){ return mesMap[k]; })
            };
          }
        }

      } catch (e) {
          return null;
        }
    } catch (error) {
      Logger.log("Erro em getChartData: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em getChartData: " + error.message);
    throw error;
  }
  }


// ==
// HANDLERS PARA INTERFACE WEB
// ==


/**
 * Handler para importação do Gmail (chamado do index.html)
 */
function importarNotasFiscaisGmailHandler() {
  try {
    if (typeof importarNotasFiscaisGmail == 'function') {
      importarNotasFiscaisGmail();
      return apiResponse(true, { mensagem : 'Importação iniciada' });
    }
  } catch (e) {
      return null;
    }
  }

/**
 * Wrapper para importação do Gmail (chamado diretamente pelo frontend)
 */
function importNotasFiscaisFromGmail() {
  return importarNotasFiscaisGmailHandler();
}


/**
 * Handler para verificações (chamado do index.html)
 */
function runVerificacoesServer(options) {
  try {
    try {
      var ss = getSS();
      if (!ss) return apiResponse(false, null, 'Planilha não encontrada');

      var irregularidades = [];
      var sheetNames = ['Notas_Fiscais', 'Workflow_NotasFiscais'];
      var fornMap = {};
      var valorTotal = 0;

      sheetNames.forEach(function(sn) {
        var sheet = ss.getSheetByName(sn);
        if (!sheet || sheet.getLastRow() <= 1) return;
        var data = sheet.getDataRange().getValues();
        var headers = data[0];
        var idx = {};
        headers.forEach(function(h, i) { idx[String(h).toLowerCase().replace(/[^a-z0-9]/g, '_')] = i; });

        for (var r = 1; r < data.length; r++) {
          var row = data[r];
          if (!row[0]) continue;
          var fornecedor = String(row[idx['fornecedor'] !== undefined ? idx['fornecedor'] : (idx['fornecedor_nome'] !== undefined ? idx['fornecedor_nome'] : 0)] || '').trim();
          var valor = Number(row[idx['valor_total'] !== undefined ? idx['valor_total'] : -1] || 0);
          var status = String(row[idx['status'] !== undefined ? idx['status'] : (idx['status_nf'] !== undefined ? idx['status_nf'] : -1)] || '').trim();
          var nfNum = String(row[idx['numero_nf'] !== undefined ? idx['numero_nf'] : (idx['numero'] !== undefined ? idx['numero'] : 0)] || '').trim();
          var escola = String(row[idx['unidade_escolar'] !== undefined ? idx['unidade_escolar'] : (idx['escola'] !== undefined ? idx['escola'] : -1)] || '').trim();

          if (valor === 0 && fornecedor) {
            irregularidades.push({ tipo: 'VALOR_ZERO', severidade: 'ALERTA', descricao: 'NF ' + nfNum + ' com valor zero', nf: nfNum, escola: escola });
          }
          if (fornecedor) {
            fornMap[fornecedor] = (fornMap[fornecedor] || 0) + valor;
            valorTotal += valor;
          }
          if ((status === 'Recebida' || status === 'PENDENTE') ) {
            var dataRec = row[idx['data_emissao'] !== undefined ? idx['data_emissao'] : (idx['timestamp_criacao'] !== undefined ? idx['timestamp_criacao'] : -1)];
            if (dataRec) {
              var dt = new Date(dataRec);
              var diasPendente = (new Date() - dt) / (1000 * 60 * 60 * 24);
              if (diasPendente > 30) {
                irregularidades.push({ tipo: 'NF_PENDENTE_LONGA', severidade: 'ALERTA', descricao: 'NF ' + nfNum + ' pendente há ' + Math.floor(diasPendente) + ' dias', nf: nfNum, escola: escola });
              }
            }
          }
        }
      });

      for (var f in fornMap) {
        if (valorTotal > 0 && fornMap[f] / valorTotal > 0.5) {
          irregularidades.push({ tipo: 'CONCENTRACAO_FORNECEDOR', severidade: 'CRITICA', descricao: 'Fornecedor "' + f + '" representa ' + (fornMap[f] / valorTotal * 100).toFixed(1) + '% do valor total movimentado', escola: '' });
        }
      }

      var criticas = irregularidades.filter(function(i) { return i.severidade === 'CRITICA'; }).length;
      var alertas = irregularidades.filter(function(i) { return i.severidade === 'ALERTA'; }).length;

      return apiResponse(true, {
        resumo: { total: irregularidades.length, criticas: criticas, alertas: alertas },
        irregularidades: irregularidades
      });
    } catch (e) {
      return apiResponse(false, null, 'Erro: ' + e.message);
    }
  } catch (error) {
    Logger.log("Erro em runVerificacoesServer: " + error.message);
    throw error;
  }
}

/**
 * Wrapper para análise determinística
 */
function runDeterministicAnalysis(options) {
  return runVerificacoesServer(options);
}


/**
 * Handler para tendências (chamado do index.html)
 */
function runTrendsServer(options) {
  try {
    try {
      var ss = getSS();
      if (!ss) return apiResponse(false, null, 'Planilha não encontrada');

      var fornMap = {};
      var escolaSet = {};
      var valorTotal = 0;
      var sheetNames = ['Notas_Fiscais', 'Workflow_NotasFiscais'];

      sheetNames.forEach(function(sn) {
        var sheet = ss.getSheetByName(sn);
        if (!sheet || sheet.getLastRow() <= 1) return;
        var data = sheet.getDataRange().getValues();
        var headers = data[0];
        var idx = {};
        headers.forEach(function(h, i) { idx[String(h).toLowerCase().replace(/[^a-z0-9]/g, '_')] = i; });

        // Filtro por fornecedor se especificado
        var filtroFornecedor = options && options.fornecedor ? options.fornecedor.toLowerCase() : null;

        for (var r = 1; r < data.length; r++) {
          var row = data[r];
          if (!row[0]) continue;
          var fornecedor = String(row[idx['fornecedor'] !== undefined ? idx['fornecedor'] : (idx['fornecedor_nome'] !== undefined ? idx['fornecedor_nome'] : 0)] || '').trim();
          var valor = Number(row[idx['valor_total'] !== undefined ? idx['valor_total'] : -1] || 0);
          var escola = String(row[idx['unidade_escolar'] !== undefined ? idx['unidade_escolar'] : (idx['escola'] !== undefined ? idx['escola'] : -1)] || '').trim();

          if (filtroFornecedor && fornecedor.toLowerCase().indexOf(filtroFornecedor) === -1) continue;

          if (fornecedor) {
            if (!fornMap[fornecedor]) fornMap[fornecedor] = { total: 0, qtd: 0 };
            fornMap[fornecedor].total += valor;
            fornMap[fornecedor].qtd++;
          }
          if (escola) escolaSet[escola] = true;
          valorTotal += valor;
        }
      });

      var fornArray = Object.keys(fornMap).map(function(f) {
        return { fornecedor: f, total: fornMap[f].total, qtd: fornMap[f].qtd };
      }).sort(function(a, b) { return b.total - a.total; });

      return apiResponse(true, {
        resumo: {
          totalFornecedores: fornArray.length,
          totalEscolas: Object.keys(escolaSet).length,
          valorTotalNFs: valorTotal
        },
        tendencias: { fornecedores: fornArray }
      });
    } catch (e) {
      return apiResponse(false, null, 'Erro: ' + e.message);
    }
  } catch (error) {
    Logger.log("Erro em runTrendsServer: " + error.message);
    throw error;
  }
}

/**
 * Wrapper para análise de tendências
 */
function runTrendAnalysis(options) {
  return runTrendsServer(options);
}


/**
 * Handler para gerar relatório da comissão
 */
function runGenerateCommissionReport() {
  try {
    if (typeof gerarRelatorioComissao == 'function') {
      gerarRelatorioComissao();
      return apiResponse(true, { sheetName : 'Relatório gerado' });
    }
    return apiResponse(false, null, 'Função gerarRelatorioComissao não encontrada');
  } catch (e) {
      return apiResponse(false, null, 'Erro: ' + e.message);
    }
  }


/**
 * Retorna orientações resumidas para o painel
 */
function getOrientacoesSummary() {
  try {
    var orientacoes = [
      '📋 ORIENTAÇÕES RESUMIDAS - PORTARIA 244/2006',
      '',
      '1. RECEBIMENTO',
      '   • Conferir quantidade, qualidade e especificações',
      '   • Verificar prazo de validade',
      '   • Registrar temperatura de produtos perecíveis',
      '',
      '2. DOCUMENTAÇÃO',
      '   • Nota fiscal deve corresponder à nota de empenho',
      '   • Verificar CNPJ e dados do fornecedor',
      '   • Conferir cálculos e valores',
      '',
      '3. GLOSAS',
      '   • Aplicar glosa em caso de não conformidade',
      '   • Documentar motivo detalhadamente',
      '   • Notificar fornecedor formalmente',
      '',
      '4. ATESTO',
      '   • Atestar apenas após conferência completa',
      '   • Responsabilidade da comissão de recebimento',
      '   • Prazo : até 5 dias úteis após recebimento'
    ];
    return orientacoes.join('\n');
  } catch (error) {
    Logger.log("Erro em getOrientacoesSummary: " + error.message);
    throw error;
  }
}

/**
 * Configurar labels do Gmail
 */
function configurarLabelsGmail() {
  try {
    if (typeof criarLabelsGmail == 'function') {
      criarLabelsGmail();
      return apiResponse(true, { mensagem : 'Labels configuradas' });
    }
  } catch (e) {
      return null;
    }
  }

// ============================================================================
// NOVAS FUNÇÕES DE SINCRONIZAÇÃO (ADICIONADAS PARA COMPATIBILIDADE FRONTEND)
// ============================================================================

/**
 * Obter métricas completas do dashboard
 * @deprecated Use getDashboardMetricsUnificado() do Core_CRUD_Frontend_Bridge.gs
 * Esta função foi renomeada para evitar conflito de nomenclatura
 */
function _getDashboardMetricsComplete_WebApp() {
  try {
    var metrics = _getDashboardMetrics_WebApp();
    if (!metrics) {
      return apiResponse(false, null, 'Erro ao obter métricas básicas');
    }
    
    // Adicionar campos extras esperados pelo frontend
    var data = {
      notasFiscais: metrics.notasFiscais || 0,
      entregas: metrics.entregas || 0,
      recusas: metrics.recusas || 0,
      glosas: metrics.glosas || 0,
      valorTotalNFs: metrics.valorTotalNFs || 0,
      valorTotalGlosas: metrics.valorTotalGlosas || 0,
      fornecedores: metrics.fornecedores || 0,
      alertas: [], // Preenchido via dashboardAnalytics abaixo
      resumoExecutivo: {
        statusGeral: 'REGULAR',
        pontuacaoGeral: 70,
        alertasCriticos: 0,
        alertasAltos: 0,
        destaques: []
      }
    };
    
    // Tentar obter alertas reais se o serviço estiver disponível
    try {
      if (typeof DIContainer !== 'undefined' && DIContainer.resolve) {
         var service = DIContainer.resolve('dashboardAnalytics');
         if (service) {
           var dashboard = service.gerarDashboardCompleto(null);
           if (dashboard) {
             data.alertas = dashboard.alertas || [];
             data.resumoExecutivo = dashboard.resumoExecutivo || data.resumoExecutivo;
           }
         }
      }
    } catch (e) {
      // Ignorar erro no serviço avançado e retornar dados básicos
      logWarn('Erro ao carregar dashboard analytics completo', {error: e.message});
    }

    return apiResponse(true, data);
  } catch (e) {
    return apiResponse(false, null, 'Erro: ' + e.message);
  }
}

/**
 * Registrar entrega com qualidade (Wrapper)
 */
function registerEntregaWithQuality(data) {
  return createEntrega(data);
}

/**
 * Buscar notas fiscais com filtros
 */
function searchNotasFiscais(filtros) {
  try {
    try {
      try {
        var sheet = getSheet('Notas_Fiscais');
        if (!sheet || sheet.getLastRow() <= 1) {
          return apiResponse(true, []);
        }

        var data = getSafeDataRange(sheet);
        var headers = data[0].map(function(h) { return String(h).toLowerCase(); });
        var rows = data.slice(1);
    
        var nfIdx = getColIndex(data[0], ['nota fiscal', 'nf-e', 'numero']);
        var fornIdx = getColIndex(data[0], ['fornecedor', 'supplier']);
        var statusIdx = getColIndex(data[0], ['status']);
        var dataIdx = getColIndex(data[0], ['data', 'data emissão']);
        var valorIdx = getColIndex(data[0], ['valor', 'valor total']);

        var resultados = rows.map(function(row, idx) {
          return {
            rowIndex: idx + 2,
            Numero_NF: nfIdx >= 0 ? row[nfIdx] : '',
            Fornecedor_Nome: fornIdx >= 0 ? row[fornIdx] : '',
            Status_NF: statusIdx >= 0 ? row[statusIdx] : '',
            Data_Emissao: dataIdx >= 0 ? row[dataIdx] : '',
            Valor_Total: valorIdx >= 0 ? row[valorIdx] : 0
          };
        }).filter(function(item) {
          var match = true;
          if (filtros.fornecedor && item.Fornecedor_Nome.toLowerCase().indexOf(filtros.fornecedor.toLowerCase()) === -1) match = false;
          if (filtros.status && item.Status_NF !== filtros.status) match = false;
          if (filtros.dataInicio) {
            var dt = new Date(item.Data_Emissao);
            var dtInicio = new Date(filtros.dataInicio);
            if (dt < dtInicio) match = false;
          }
          if (filtros.dataFim) {
            var dt = new Date(item.Data_Emissao);
            var dtFim = new Date(filtros.dataFim);
            if (dt > dtFim) match = false;
          }
          return match;
        });

        return apiResponse(true, resultados);
      } catch (e) {
        return apiResponse(false, null, 'Erro na busca: ' + e.message);
      }
    } catch (error) {
      Logger.log("Erro em searchNotasFiscais: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em searchNotasFiscais: " + error.message);
    throw error;
  }
}

/**
 * Gerar relatório consolidado
 */
function generateConsolidatedReport(type, options) {
  try {
    if (type === 'comissao') {
      return runGenerateCommissionReport();
    } else if (type === 'atesto') {
      // Stub para atesto
      return apiResponse(true, { message: 'Relatório de atesto gerado (simulação)' });
    } else if (type === 'consumo') {
      // Stub para consumo
      return apiResponse(true, { message: 'Relatório de consumo gerado (simulação)' });
    }
    return apiResponse(false, null, 'Tipo de relatório desconhecido');
  } catch (e) {
    return apiResponse(false, null, 'Erro: ' + e.message);
  }
}

// ============================================================================
// FUNÇÕES DE TESTE E DIAGNÓSTICO
// ============================================================================

/**
 * Testa a função listNotasFiscais e retorna diagnóstico detalhado
 * Execute esta função no Apps Script para verificar se as NFs estão sendo lidas
 */
function testeListNotasFiscais() {
  try {
    try {
      Logger.log('=== TESTE listNotasFiscais ===');
  
      var ss = getSS();
      var resultado = {
        sheets: {},
        dados: {},
        apiResponse: null
      };
  
      // 1. Verificar sheet Notas_Fiscais (legado)
      var sheetLegado = ss.getSheetByName('Notas_Fiscais');
      if (sheetLegado) {
        resultado.sheets.Notas_Fiscais = {
          existe: true,
          linhas: sheetLegado.getLastRow(),
          colunas: sheetLegado.getLastColumn()
        };
        if (sheetLegado.getLastRow() > 1) {
          var headers = sheetLegado.getRange(1, 1, 1, sheetLegado.getLastColumn()).getValues()[0];
          resultado.sheets.Notas_Fiscais.headers = headers;
        }
      } else {
        resultado.sheets.Notas_Fiscais = { existe: false };
      }
      Logger.log('Sheet Notas_Fiscais: ' + JSON.stringify(resultado.sheets.Notas_Fiscais));
  
      // 2. Verificar sheet Workflow_NotasFiscais
      var sheetWorkflow = ss.getSheetByName('Workflow_NotasFiscais');
      if (sheetWorkflow) {
        resultado.sheets.Workflow_NotasFiscais = {
          existe: true,
          linhas: sheetWorkflow.getLastRow(),
          colunas: sheetWorkflow.getLastColumn()
        };
        if (sheetWorkflow.getLastRow() > 1) {
          var headersWF = sheetWorkflow.getRange(1, 1, 1, sheetWorkflow.getLastColumn()).getValues()[0];
          resultado.sheets.Workflow_NotasFiscais.headers = headersWF;
      
          // Mostrar primeira linha de dados
          var primeiraLinha = sheetWorkflow.getRange(2, 1, 1, sheetWorkflow.getLastColumn()).getValues()[0];
          resultado.sheets.Workflow_NotasFiscais.primeiraLinha = primeiraLinha;
        }
      } else {
        resultado.sheets.Workflow_NotasFiscais = { existe: false };
      }
      Logger.log('Sheet Workflow_NotasFiscais: ' + JSON.stringify(resultado.sheets.Workflow_NotasFiscais));
  
      // 3. Chamar listNotasFiscais e verificar resultado
      Logger.log('Chamando listNotasFiscais(100)...');
      var response = listNotasFiscais(100);
      resultado.apiResponse = {
        success: response.success,
        dataLength: response.data ? response.data.length : 0,
        message: response.message
      };
  
      if (response.data && response.data.length > 0) {
        resultado.apiResponse.primeiroItem = response.data[0];
        Logger.log('Primeiro item: ' + JSON.stringify(response.data[0]));
      }
  
      Logger.log('API Response: success=' + response.success + ', items=' + (response.data ? response.data.length : 0));
  
      // 4. Resumo
      Logger.log('');
      Logger.log('=== RESUMO ===');
      Logger.log('Notas_Fiscais: ' + (resultado.sheets.Notas_Fiscais.existe ? resultado.sheets.Notas_Fiscais.linhas + ' linhas' : 'NÃO EXISTE'));
      Logger.log('Workflow_NotasFiscais: ' + (resultado.sheets.Workflow_NotasFiscais.existe ? resultado.sheets.Workflow_NotasFiscais.linhas + ' linhas' : 'NÃO EXISTE'));
      Logger.log('Total NFs retornadas: ' + (response.data ? response.data.length : 0));
  
      if (response.data && response.data.length > 0) {
        Logger.log('✅ NFs encontradas! O frontend deveria exibir.');
      } else {
        Logger.log('❌ Nenhuma NF encontrada. Verifique se as sheets têm dados.');
      }
  
      return resultado;
    } catch (error) {
      Logger.log("Erro em testeListNotasFiscais: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em testeListNotasFiscais: " + error.message);
    throw error;
  }
}

/**
 * Cria dados de teste na sheet Workflow_NotasFiscais
 */
function criarDadosTesteWorkflow() {
  try {
    try {
      try {
        Logger.log('=== CRIANDO DADOS DE TESTE ===');
  
        var ss = getSS();
        var sheet = ss.getSheetByName('Workflow_NotasFiscais');
  
        if (!sheet) {
          sheet = ss.insertSheet('Workflow_NotasFiscais');
          Logger.log('Sheet Workflow_NotasFiscais criada');
        }
  
        // Limpar e criar headers
        sheet.clear();
        var headers = [
          'ID', 'Data_Criacao', 'Numero', 'Serie', 'Chave_Acesso', 'Data_Emissao',
          'CNPJ', 'Fornecedor', 'Produto', 'Quantidade', 'Unidade', 
          'Valor_Unitario', 'Valor_Total', 'Nota_Empenho', 'Status', 'Usuario'
        ];
        sheet.appendRow(headers);
  
        // Criar 3 NFs de teste
        var nfsTeste = [
          ['NF_TEST_001', new Date(), '12345', '1', '12345678901234567890123456789012345678901234', new Date(), '12345678000199', 'Fornecedor ABC Ltda', 'Arroz Tipo 1 - 5kg', 100, 'KG', 5.50, 550.00, 'EMP-2024-001', 'ENVIADA', 'teste@email.com'],
          ['NF_TEST_002', new Date(), '12346', '1', '12345678901234567890123456789012345678901235', new Date(), '98765432000188', 'Distribuidora XYZ', 'Feijão Carioca - 1kg', 200, 'KG', 8.00, 1600.00, 'EMP-2024-002', 'ENVIADA', 'teste@email.com'],
          ['NF_TEST_003', new Date(), '12347', '1', '12345678901234567890123456789012345678901236', new Date(), '11223344000177', 'Hortifruti Verde', 'Banana Prata - Dúzia', 50, 'DZ', 6.00, 300.00, 'EMP-2024-003', 'EM_RECEBIMENTO', 'teste@email.com']
        ];
  
        nfsTeste.forEach(function(nf) {
          sheet.appendRow(nf);
        });
  
        Logger.log('✅ 3 NFs de teste criadas');
        Logger.log('Execute testeListNotasFiscais() para verificar');
  
        return { success: true, message: '3 NFs de teste criadas na sheet Workflow_NotasFiscais' };
      } catch (error) {
        Logger.log("Erro em criarDadosTesteWorkflow: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em criarDadosTesteWorkflow: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em criarDadosTesteWorkflow: " + error.message);
    throw error;
  }
}



// ============================================================================
// LOG DE CARREGAMENTO
// ============================================================================

Logger.log('✅ UI_WebApp.gs carregado');
