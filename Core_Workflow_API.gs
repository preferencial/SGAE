/**
 * @fileoverview API Backend Integrada para os 3 Workflows (REFATORADO)
 * 
 * INTERVENÇÃO 4/4: Orquestração (Service Layer)
 * 
 * Agora atua como um FACADE/ORCHESTRATOR que delega para:
 * - Core_Workflow_Calculator (Domínio/Lógica Pura)
 * - Core_Workflow_Repository (Dados/Persistência)
 * 
 * Compatibilidade mantida com versões anteriores.
 * 
 * @version 3.0.0 (Refatorado)
 */

'use strict';

// ============================================================================
// FACADE PARA CÁLCULOS (Delegation)
// ============================================================================

/**
 * Calcula valores contábeis de uma NF com base nos recebimentos
 * @delegate WorkflowCalculator.calculateAccountingValues
 */
function calcularValoresContabeis(qtdNF, qtdRecebida, valorUnitario) {
  return WorkflowCalculator.calculateAccountingValues(qtdNF, qtdRecebida, valorUnitario);
}

/**
 * Valida integridade contábil de uma análise
 * @delegate WorkflowCalculator.validateAccountingIntegrity
 */
function validarIntegridadeContabil(dados) {
  var result = WorkflowCalculator.validateAccountingIntegrity(dados);
  // Adaptador de retorno para manter compatibilidade exata com o código antigo se necessário
  return {
    valido: result.valid,
    erros: result.errors,
    calculado: result.calculated
  };
}


// ============================================================================
// WORKFLOW 1: FORNECEDOR
// ============================================================================

function salvarNotaFiscal_Workflow(dados) {
  try {
    // Validação básica
    if (!dados.numero) return { success: false, error: 'Número da NF é obrigatório' };
    
    // Delega ao Repositório
    var id = WorkflowRepository.Invoices.save(dados);
    
    Logger.log('Facade: NF salva via Repository - ' + id);
    return { success: true, id: id };
    
  } catch (e) {
    Logger.log('Erro salvarNotaFiscal_Workflow: ' + e.message);
    return { success: false, error: e.message };
  }
}

function listarNotasFiscais_Workflow() {
  try {
    return WorkflowRepository.Invoices.listAll();
  } catch (e) {
    Logger.log('Erro listarNotasFiscais: ' + e.message);
    return [];
  }
}

// ============================================================================
// WORKFLOW 2: REPRESENTANTE ESCOLAR
// ============================================================================

function salvarRecebimento(dados) {
  try {
    try {
      // Orquestração: Valida -> Salva Recebimento -> Atualiza NF -> (Opcional) Registra Recusa
    
      // 1. Validação Contábil/Regra de Negócios (Calculadora)
      var status = 'CONFORME';
      if (dados.quantidadeRecebida < dados.quantidadeEsperada) {
        status = dados.quantidadeRecebida > 0 ? 'PARCIAL' : 'RECUSADO';
      }
      dados.status = status;
    
      // 2. Persistência (Repositório)
      var id = WorkflowRepository.Receipts.save(dados);
    
      // 3. Atualização de Estado (Repositório)
      WorkflowRepository.Invoices.updateStatus(dados.nfId, 'EM_RECEBIMENTO');
    
      // 4. Fluxo de Exceção (Recusa)
      var qtdRecusada = dados.quantidadeRecusada || Math.max(0, (dados.quantidadeEsperada || 0) - dados.quantidadeRecebida);
      if (qtdRecusada > 0) {
        WorkflowRepository.Occurrences.save({
          prefixo: 'OCOR_',
          tipo: dados.quantidadeRecebida > 0 ? 'RECUSA_PARCIAL' : 'RECUSA_TOTAL',
          nfId: dados.nfId,
          escola: dados.escola,
          produto: dados.produto,
          motivo: dados.motivoRecusa,
          acaoTomada: 'Registrado no Recebimento',
          status: 'REGISTRADO'
        });
      }

      // 5. Horta Escolar — persiste itens colhidos quando informados pela escola
      var hortaIds = [];
      if (dados.hortaEscolar && dados.hortaEscolar.temHorta) {
        hortaIds = _salvarItensHorta(dados.hortaEscolar, dados.escola || '', id);
        if (hortaIds.length > 0) {
          Logger.log('[salvarRecebimento] ' + hortaIds.length + ' item(ns) de horta registrado(s): ' + hortaIds.join(', '));
        }
      }
    
      return {
        success: true,
        id: id,
        status: status,
        hortaIds: hortaIds,
        mensagem: 'Recebimento registrado com sucesso' + (hortaIds.length > 0 ? ' (' + hortaIds.length + ' item(ns) de horta escolar registrado(s))' : '')
      };
    
    } catch (e) {
      Logger.log('Erro salvarRecebimento: ' + e.message);
      return { success: false, error: e.message };
    }
  } catch (error) {
    Logger.log("Erro em salvarRecebimento: " + error.message);
    throw error;
  }
}

function listarNFsPendentesParaEscola(escola) {
  try {
    // Lógica complexa de filtro mantida no Facade ou movida para um Service específico?
    // Por simplicidade na refatoração, vamos reconstruir usando os métodos do Repositório.
  
    try {
      var allNFs = WorkflowRepository.Invoices.listAll();
      var resultado = [];
    
      // Filtrar apenas ENVIADA ou EM_RECEBIMENTO
      allNFs.forEach(function(nf) {
        if (nf.status === 'ENVIADA' || nf.status === 'EM_RECEBIMENTO') {
          // Verificar se escola já recebeu
          var recibos = WorkflowRepository.Receipts.findByNfId(nf.id);
          var jaRecebeu = recibos.some(function(r) { return r.escola === escola; });
        
          var totalRecebido = recibos.reduce(function(acc, r) { return acc + (Number(r.qtdRecebida) || 0); }, 0);
        
          nf.recebimentos = recibos.map(function(r) { return r.escola; });
          nf.totalRecebido = totalRecebido;
          nf.jaRecebeuEscola = jaRecebeu;
        
          resultado.push(nf);
        }
      });
    
      return resultado.reverse();
    } catch (e) {
      Logger.log('Erro listarNFsPendentesParaEscola: ' + e.message);
      return [];
    }
  } catch (error) {
    Logger.log("Erro em listarNFsPendentesParaEscola: " + error.message);
    throw error;
  }
}

function registrarRecusa(dados) {
  try {
    var id = WorkflowRepository.Occurrences.save({
      prefixo: 'RECUSA_',
      tipo: 'RECUSA_RECEBIMENTO',
      nfId: dados.nfId,
      escola: dados.escola,
      produto: dados.produto,
      motivo: dados.motivo,
      acaoTomada: 'Notificação de Qualidade',
      status: 'AGUARDANDO_REPOSICAO'
    });
    
    // Atualizar NF
    WorkflowRepository.Invoices.updateStatus(dados.nfId, 'REJEITADO');
    
    return { success: true, id: id, mensagem: 'Recusa registrada.' };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ============================================================================
// WORKFLOW 3: ANALISTA
// ============================================================================

function listarNFsParaAnalise() {
  try {
    try {
      var allNFs = WorkflowRepository.Invoices.listAll();
      var resultado = [];
    
      allNFs.forEach(function(nf) {
        if (nf.status === 'ENVIADA' || nf.status === 'EM_RECEBIMENTO') {
          var recibos = WorkflowRepository.Receipts.findByNfId(nf);
          var totalRecebido = recibos.reduce(function(acc, r) { return acc + (Number(r.qtdRecebida) || 0); }, 0);
        
          // Uso da Calculadora para enriquecer o objeto
          var calc = WorkflowCalculator.calculateAccountingValues(nf.quantidade, totalRecebido, nf.valorUnitario);
        
          // Merge de propriedades
          nf.recebimentos = recibos; // Detalhes completos
          nf.totalRecebido = totalRecebido;
          nf.diferenca = calc.diferenca;
          nf.valorGlosaCalculado = calc.valorGlosa;
          nf.valorAprovadoCalculado = calc.valorAprovado;
          nf.percentualGlosa = calc.percentualGlosa;
          nf.qtdEscolas = recibos.length;
        
          resultado.push(nf);
        }
      });
    
      return resultado.reverse();
    } catch (e) {
      return [];
    }
  } catch (error) {
    Logger.log("Erro em listarNFsParaAnalise: " + error.message);
    throw error;
  }
}

function salvarAnalise(dados) {
  try {
    // 1. Validação de Domínio
    var validacao = WorkflowCalculator.validateAccountingIntegrity(dados);
    if (!validacao.valid) {
      Logger.log('Correção automática de análise baseada na calculadora');
      dados.valorGlosa = validacao.calculated.valorGlosa;
      dados.valorAprovado = validacao.calculated.valorAprovado;
      dados.percentualGlosa = validacao.calculated.percentualGlosa;
      dados.validacaoContabil = 'CORRIGIDO_AUTO';
    } else {
      dados.validacaoContabil = 'OK';
    }
    
    // 2. Determinar Status Final
    var statusFinal = 'APROVADO';
    if (dados.decisao === 'GLOSADO') statusFinal = 'GLOSADO';
    if (dados.decisao === 'REJEITADO') statusFinal = 'REJEITADO';
    if (dados.decisao === 'APROVADO_PARCIAL') statusFinal = 'APROVADO_PARCIAL';
    
    dados.status = statusFinal;
    
    // 3. Persistência
    var id = WorkflowRepository.Analyses.save(dados);
    WorkflowRepository.Invoices.updateStatus(dados.nfId, statusFinal);
    
    return { success: true, id: id, status: statusFinal };
    
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ============================================================================
// HORTA ESCOLAR — persistência de colheitas no fluxo de recebimento
// ============================================================================

/**
 * Salva cada item colhido da horta na aba Horta_Escolar.
 * Chamado internamente por salvarRecebimento() e api_entrega_confirmarRecebimento().
 *
 * @param {Object} hortaPayload  Objeto coletarDadosHorta() / coletarDadosHortaReceiving()
 * @param {string} unidadeEscolar Nome da escola (vem do payload principal)
 * @param {string} recebimentoId  ID do recebimento pai (para rastreabilidade)
 * @returns {string[]} Array de IDs gerados
 */
function _salvarItensHorta(hortaPayload, unidadeEscolar, recebimentoId) {
  try {
    try {
      try {
        var ids = [];
        if (!hortaPayload || !hortaPayload.temHorta) return ids;

        var itens = hortaPayload.itens || [];
        if (!itens.length) return ids;

        var ss = getSS();
        var sheet = ss.getSheetByName('Horta_Escolar');
        if (!sheet) {
          Logger.log('[_salvarItensHorta] Aba Horta_Escolar não encontrada — execute initializeSheets() primeiro');
          return ids;
        }

        // Descobre posição dos headers para mapeamento seguro
        var headersRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        var now = new Date();
        var usuario = '';
        try { usuario = Session.getActiveUser().getEmail(); } catch(e) {}

        itens.forEach(function(item) {
          if (!item.produto || !item.produto.trim()) return; // ignora linha vazia

          var id = 'HRT-' + Utilities.formatDate(now, 'America/Sao_Paulo', 'yyyyMMdd') +
                   '-' + now.getTime().toString().slice(-6);
          var dataColheita = hortaPayload.dataColheita ? new Date(hortaPayload.dataColheita) : now;

          var rec = {
            ID_Horta:              id,
            Unidade_Escolar:       unidadeEscolar || '',
            Produto_Nome:          (item.produto || '').trim(),
            Item_ID:               item.itemId || '',
            Quantidade_Colhida:    parseFloat(item.quantidade) || 0,
            Unidade_Medida:        item.unidade || 'kg',
            Data_Colheita:         Utilities.formatDate(dataColheita, 'America/Sao_Paulo', 'dd/MM/yyyy'),
            Responsavel_Colheita:  hortaPayload.responsavelColheita || '',
            Destino_Producao:      item.destino || hortaPayload.destinoPadrao || 'Cardapio_Dia',
            Status_Aprovacao:      'Pendente',
            Responsavel_Aprovacao: '',
            Data_Aprovacao:        '',
            Lote_Estoque_ID:       '',
            Criado_Por:            usuario,
            Timestamp_Criacao:     now.toISOString(),
            Timestamp_Modificacao: now.toISOString(),
            Observacoes:           'Registrado via recebimento ' + recebimentoId +
                                   (hortaPayload.observacoes ? ' — ' + hortaPayload.observacoes : '')
          };

          var row = headersRow.map(function(h) {
            var val = rec[h];
            return (val !== undefined && val !== null) ? val : '';
          });
          sheet.appendRow(row);
          ids.push(id);
        });

        return ids;
      } catch (error) {
        Logger.log("Erro em _salvarItensHorta: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em _salvarItensHorta: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em _salvarItensHorta: " + error.message);
    throw error;
  }
}

// ============================================================================
// api_entrega_confirmarRecebimento — chamado por UI_Receiving.html
// ============================================================================

/**
 * Confirma recebimento de entrega (formulário desktop de conferência).
 * Persiste a conferência e, se informada, os itens de horta escolar.
 *
 * Payload esperado:
 *   entrega_id, status, checks, itens, temperatura, observacoes,
 *   responsavel {nome, matricula}, assinatura, hortaEscolar (opcional)
 */
function api_entrega_confirmarRecebimento(dados) {
  try {
    try {
      if (!dados) return { success: false, error: 'Payload ausente' };

      var ss = getSS();
      var now = new Date();
      var usuario = '';
      try { usuario = Session.getActiveUser().getEmail(); } catch(e) {}

      // ── Salva conferência na aba Controle_Conferencia (se existir) ──────────
      var sheetConf = ss.getSheetByName('Controle_Conferencia');
      var confId = 'CONF-' + Utilities.formatDate(now, 'America/Sao_Paulo', 'yyyyMMdd') +
                   '-' + now.getTime().toString().slice(-6);
      if (sheetConf) {
        sheetConf.appendRow([
          confId,
          dados.entrega_id || '',
          dados.status || 'ACEITO',
          JSON.stringify(dados.checks || {}),
          dados.temperatura || '',
          dados.observacoes || '',
          (dados.responsavel || {}).nome || '',
          (dados.responsavel || {}).matricula || '',
          now.toISOString(),
          usuario
        ]);
      }

      // ── Horta Escolar — salva colheitas informadas ────────────────────────────
      var hortaIds = [];
      if (dados.hortaEscolar && dados.hortaEscolar.temHorta) {
        // unidadeEscolar vem do payload de entrega ou do hortaPayload
        var ue = (dados.hortaEscolar.unidadeEscolar) || '';
        hortaIds = _salvarItensHorta(dados.hortaEscolar, ue, confId);
        if (hortaIds.length > 0) {
          Logger.log('[api_entrega_confirmarRecebimento] ' + hortaIds.length + ' item(ns) de horta registrado(s)');
        }
      }

      return {
        success: true,
        id: confId,
        hortaIds: hortaIds,
        mensagem: 'Recebimento confirmado' + (hortaIds.length > 0
          ? ' com ' + hortaIds.length + ' item(ns) de horta registrado(s)'
          : '')
      };

    } catch (e) {
      Logger.log('Erro api_entrega_confirmarRecebimento: ' + e.message);
      return { success: false, error: e.message };
    }
  } catch (error) {
    Logger.log("Erro em api_entrega_confirmarRecebimento: " + error.message);
    throw error;
  }
}

// ============================================================================
// APIs DE DOMÍNIO PARA TELAS OPERACIONAIS
// ============================================================================

function _sgae_nowIso() {
  try {
    return new Date().toISOString();
  } catch (error) {
    Logger.log("Erro em _sgae_nowIso: " + error.message);
    throw error;
  }
}

function _sgae_getActiveEmail() {
  try {
    try {
      return String(Session.getActiveUser().getEmail() || '').toLowerCase();
    } catch (e) {
      return '';
    }
  } catch (error) {
    Logger.log("Erro em _sgae_getActiveEmail: " + error.message);
    throw error;
  }
}

function _sgae_normKey(value) {
  try {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  } catch (error) {
    Logger.log("Erro em _sgae_normKey: " + error.message);
    throw error;
  }
}

function _sgae_number(value) {
  if (typeof value === 'number') return value;
  if (value === null || value === undefined || value === '') return 0;
  var text = String(value).trim();
  if (text.indexOf(',') >= 0) text = text.replace(/\./g, '').replace(',', '.');
  return parseFloat(text) || 0;
}

function _sgae_pick(obj, names, fallback) {
  if (!obj) return fallback;
  for (var i = 0; i < names.length; i++) {
    if (obj[names[i]] !== undefined && obj[names[i]] !== null && obj[names[i]] !== '') return obj[names[i]];
  }
  var wanted = names.map(_sgae_normKey);
  for (var key in obj) {
    if (wanted.indexOf(_sgae_normKey(key)) >= 0 && obj[key] !== undefined && obj[key] !== null && obj[key] !== '') return obj[key];
  }
  return fallback;
}

function _sgae_readObjects(sheetNames) {
  try {
    var ss = getSS();
    for (var s = 0; s < sheetNames.length; s++) {
      var sheet = ss.getSheetByName(sheetNames[s]);
      if (!sheet || sheet.getLastRow() < 2) continue;
      var values = sheet.getDataRange().getValues();
      var headers = values[0];
      var rows = [];
      for (var r = 1; r < values.length; r++) {
        var hasData = false;
        var obj = { rowIndex: r + 1, _sheetName: sheet.getName() };
        for (var c = 0; c < headers.length; c++) {
          if (values[r][c] !== '' && values[r][c] !== null && values[r][c] !== undefined) hasData = true;
          obj[headers[c]] = values[r][c];
        }
        if (hasData) rows.push(obj);
      }
      return rows;
    }
    return [];
  } catch (error) {
    Logger.log("Erro em _sgae_readObjects: " + error.message);
    throw error;
  }
}

function _sgae_updateRowById(sheetNames, id, updates) {
  try {
    try {
      try {
        if (!id) return false;
        var ss = getSS();
        for (var s = 0; s < sheetNames.length; s++) {
          var sheet = ss.getSheetByName(sheetNames[s]);
          if (!sheet || sheet.getLastRow() < 2) continue;
          var values = sheet.getDataRange().getValues();
          var headers = values[0];
          var idIdx = -1;
          var headerMap = {};
          for (var h = 0; h < headers.length; h++) {
            var key = _sgae_normKey(headers[h]);
            headerMap[key] = h;
            if (['id', 'idnf', 'identrega', 'notafiscalid'].indexOf(key) >= 0 && idIdx < 0) idIdx = h;
          }
          if (idIdx < 0) idIdx = 0;
          for (var r = 1; r < values.length; r++) {
            if (String(values[r][idIdx]) !== String(id)) continue;
            for (var name in updates) {
              var idx = headerMap[_sgae_normKey(name)];
              if (idx !== undefined) sheet.getRange(r + 1, idx + 1).setValue(updates[name]);
            }
            return true;
          }
        }
        return false;
      } catch (error) {
        Logger.log("Erro em _sgae_updateRowById: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em _sgae_updateRowById: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em _sgae_updateRowById: " + error.message);
    throw error;
  }
}

function _sgae_userContext() {
  try {
    var email = _sgae_getActiveEmail();
    var usuarios = _sgae_readObjects(['USR_Usuarios', 'Usuarios']);
    var user = null;
    for (var i = 0; i < usuarios.length; i++) {
      var rowEmail = String(_sgae_pick(usuarios[i], ['email', 'Email'], '')).toLowerCase();
      if (rowEmail && rowEmail === email) {
        user = usuarios[i];
        break;
      }
    }
    return {
      email: email,
      user: user,
      tipo: String(_sgae_pick(user, ['tipo', 'perfil', 'Tipo', 'Perfil'], '')).toUpperCase(),
      instituicao: String(_sgae_pick(user, ['instituicao', 'Instituicao', 'escola', 'Escola'], ''))
    };
  } catch (error) {
    Logger.log("Erro em _sgae_userContext: " + error.message);
    throw error;
  }
}

function _sgae_fornecedorAtual() {
  try {
    var ctx = _sgae_userContext();
    var fornecedores = _sgae_readObjects(['Fornecedores', 'FORN_Fornecedores']);
    var userCnpj = String(_sgae_pick(ctx.user, ['cnpj', 'CNPJ'], '')).replace(/\D/g, '');
    var userInstituicao = _sgae_normKey(ctx.instituicao);

    for (var i = 0; i < fornecedores.length; i++) {
      var cnpj = String(_sgae_pick(fornecedores[i], ['cnpj', 'CNPJ'], '')).replace(/\D/g, '');
      var email = String(_sgae_pick(fornecedores[i], ['email', 'Email'], '')).toLowerCase();
      var nome = _sgae_normKey(_sgae_pick(fornecedores[i], ['razao_social', 'Razao_Social', 'Fornecedor', 'fornecedor', 'nome'], ''));
      if ((userCnpj && cnpj === userCnpj) || (ctx.email && email === ctx.email) || (userInstituicao && nome === userInstituicao)) {
        return fornecedores[i];
      }
    }

    for (var j = 0; j < fornecedores.length; j++) {
      var status = String(_sgae_pick(fornecedores[j], ['status', 'Status', 'Status_Fornecedor'], 'ATIVO')).toUpperCase();
      if (status === 'ATIVO' || status === 'VIGENTE') return fornecedores[j];
    }
    return fornecedores[0] || null;
  } catch (error) {
    Logger.log("Erro em _sgae_fornecedorAtual: " + error.message);
    throw error;
  }
}

function _sgae_mapEmpenho(emp) {
  try {
    var valorAtual = _sgae_number(_sgae_pick(emp, ['valor_atual', 'valor_total', 'Valor_Total', 'valor'], 0));
    var saldo = _sgae_number(_sgae_pick(emp, ['saldo_disponivel', 'saldo', 'Saldo'], valorAtual));
    var utilizado = _sgae_number(_sgae_pick(emp, ['valor_liquidado', 'valor_utilizado', 'Valor_Utilizado'], valorAtual - saldo));
    var percentual = valorAtual > 0 ? Math.round((utilizado / valorAtual) * 100) : 0;
    return {
      id: String(_sgae_pick(emp, ['id', 'ID'], '')),
      numero: String(_sgae_pick(emp, ['numero', 'numero_empenho', 'Numero_Empenho'], '')),
      contrato: String(_sgae_pick(emp, ['contrato_numero', 'contrato', 'contrato_id'], '')),
      fornecedor_id: String(_sgae_pick(emp, ['fornecedor_id', 'Fornecedor_ID'], '')),
      fornecedor_nome: String(_sgae_pick(emp, ['fornecedor_nome', 'Fornecedor', 'fornecedor'], '')),
      valor_atual: valorAtual,
      saldo_disponivel: saldo,
      percentual_utilizado: Math.max(0, Math.min(100, _sgae_number(_sgae_pick(emp, ['percentual_utilizado'], percentual)))),
      status: saldo <= 0 ? 'Esgotado' : String(_sgae_pick(emp, ['status', 'Status'], 'Ativo'))
    };
  } catch (error) {
    Logger.log("Erro em _sgae_mapEmpenho: " + error.message);
    throw error;
  }
}

function _sgae_listarEmpenhosFornecedor(fornecedor) {
  try {
    var fornecedorId = String(_sgae_pick(fornecedor, ['id', 'ID'], ''));
    var fornecedorNome = String(_sgae_pick(fornecedor, ['razao_social', 'fornecedor', 'Fornecedor', 'nome'], ''));
    var empenhos = [];

    if (typeof ContractService !== 'undefined') {
      var result = ContractService.listarEmpenhos({ fornecedor_id: fornecedorId, comSaldo: false });
      if (result && result.success && result.data && result.data.empenhos) empenhos = result.data.empenhos;
    }

    if (!empenhos.length) {
      empenhos = _sgae_readObjects(['Contratos_Empenho', 'Empenhos']).filter(function(emp) {
        var empFornecedorId = String(_sgae_pick(emp, ['fornecedor_id', 'Fornecedor_ID'], ''));
        var empFornecedorNome = String(_sgae_pick(emp, ['fornecedor_nome', 'Fornecedor', 'fornecedor'], ''));
        return (!fornecedorId || empFornecedorId === fornecedorId) &&
               (!fornecedorNome || _sgae_normKey(empFornecedorNome) === _sgae_normKey(fornecedorNome));
      });
    }

    return empenhos.map(_sgae_mapEmpenho).sort(function(a, b) {
      return b.saldo_disponivel - a.saldo_disponivel;
    });
  } catch (error) {
    Logger.log("Erro em _sgae_listarEmpenhosFornecedor: " + error.message);
    throw error;
  }
}

function _sgae_nfToConferencia(nf) {
  try {
    var numero = String(_sgae_pick(nf, ['numero', 'numero_nf', 'Numero_NF'], ''));
    var produto = String(_sgae_pick(nf, ['produto', 'Produto', 'Produto_Descricao'], 'Item da NF ' + numero));
    var quantidade = _sgae_number(_sgae_pick(nf, ['quantidade', 'itens_quantidade', 'Quantidade'], 1)) || 1;
    var unidade = String(_sgae_pick(nf, ['unidade', 'Unidade'], 'un'));
    return {
      escola: _sgae_userContext().instituicao || 'Unidade escolar',
      entrega: {
        id: String(_sgae_pick(nf, ['id', 'ID'], numero)),
        fornecedor: String(_sgae_pick(nf, ['fornecedor_nome', 'fornecedor', 'Fornecedor'], 'Fornecedor')),
        nf_numero: numero,
        data: _sgae_pick(nf, ['data_emissao', 'Data_Emissao', 'data_lancamento'], _sgae_nowIso()),
        valor: _sgae_number(_sgae_pick(nf, ['valor_total', 'valor_bruto', 'Valor_Total'], 0))
      },
      itens: [{
        id: String(_sgae_pick(nf, ['id', 'ID'], numero)) + '-1',
        nome: produto,
        esperado: quantidade,
        unidade: unidade
      }]
    };
  } catch (error) {
    Logger.log("Erro em _sgae_nfToConferencia: " + error.message);
    throw error;
  }
}

function api_entrega_getDadosConferencia() {
  try {
    try {
      var ctx = _sgae_userContext();
      var entregas = _sgae_readObjects(['Entregas']).filter(function(ent) {
        var status = String(_sgae_pick(ent, ['status', 'Status', 'Status_Entrega'], '')).toUpperCase();
        var escola = String(_sgae_pick(ent, ['Unidade_Escolar', 'unidade_escolar', 'Escola'], ''));
        return ['RECUSADO', 'RECUSADA', 'ACEITO', 'CONCLUIDO', 'CONCLUIDA'].indexOf(status) < 0 &&
               (!ctx.instituicao || !escola || _sgae_normKey(escola) === _sgae_normKey(ctx.instituicao));
      });

      if (entregas.length) {
        var entrega = entregas[0];
        return {
          success: true,
          data: {
            escola: String(_sgae_pick(entrega, ['Unidade_Escolar', 'unidade_escolar', 'Escola'], ctx.instituicao || 'Unidade escolar')),
            entrega: {
              id: String(_sgae_pick(entrega, ['id', 'ID'], '')),
              fornecedor: String(_sgae_pick(entrega, ['Fornecedor', 'fornecedor'], 'Fornecedor')),
              nf_numero: String(_sgae_pick(entrega, ['Numero_NF', 'Nota Fiscal', 'NF'], '')),
              data: _sgae_pick(entrega, ['Data_Entrega', 'Data Entrega', 'data_entrega'], _sgae_nowIso()),
              valor: _sgae_number(_sgae_pick(entrega, ['Valor_Total', 'valor_total'], 0))
            },
            itens: [{
              id: String(_sgae_pick(entrega, ['id', 'ID'], '')) + '-1',
              nome: String(_sgae_pick(entrega, ['Produto', 'Produto_Descricao', 'produto'], 'Item da entrega')),
              esperado: _sgae_number(_sgae_pick(entrega, ['Quantidade_Solicitada', 'Quantidade', 'quantidade'], 1)) || 1,
              unidade: String(_sgae_pick(entrega, ['Unidade', 'unidade'], 'un'))
            }]
          }
        };
      }

      var nfs = _sgae_readObjects(['Notas_Fiscais', 'Workflow_NotasFiscais']).filter(function(nf) {
        var status = String(_sgae_pick(nf, ['status', 'Status', 'Status_NF'], '')).toUpperCase();
        return ['PENDENTE', 'LANCADA', 'ENVIADA', 'EM_RECEBIMENTO', 'RECEBIDA_UE', ''].indexOf(status) >= 0;
      });
      if (!nfs.length) return { success: false, error: 'Nenhuma entrega ou NF pendente de conferência encontrada' };
      return { success: true, data: _sgae_nfToConferencia(nfs[0]) };
    } catch (e) {
      Logger.log('Erro api_entrega_getDadosConferencia: ' + e.message);
      return { success: false, error: e.message };
    }
  } catch (error) {
    Logger.log("Erro em api_entrega_getDadosConferencia: " + error.message);
    throw error;
  }
}

function api_entrega_recusar(dados) {
  try {
    try {
      try {
        if (!dados || !dados.entrega_id) return { success: false, error: 'Entrega é obrigatória para registrar recusa' };
        if (!dados.motivo) return { success: false, error: 'Motivo da recusa é obrigatório' };

        var detalhes = [];
        if (dados.detalhe) detalhes.push(dados.detalhe);
        if (dados.problemas) detalhes.push(JSON.stringify(dados.problemas));

        var recusa = {
          data_recusa: new Date(),
          escola: _sgae_userContext().instituicao || '',
          fornecedor: '',
          produto: '',
          quantidade: 0,
          motivo: dados.motivo,
          descricao: detalhes.join(' | '),
          responsavel: _sgae_getActiveEmail(),
          entrega_id: dados.entrega_id,
          status: 'AGUARDANDO_REPOSICAO'
        };

        var entregaRows = _sgae_readObjects(['Entregas']);
        for (var i = 0; i < entregaRows.length; i++) {
          if (String(_sgae_pick(entregaRows[i], ['id', 'ID'], '')) === String(dados.entrega_id)) {
            recusa.fornecedor = String(_sgae_pick(entregaRows[i], ['Fornecedor', 'fornecedor'], ''));
            recusa.produto = String(_sgae_pick(entregaRows[i], ['Produto', 'produto'], ''));
            recusa.quantidade = _sgae_number(_sgae_pick(entregaRows[i], ['Quantidade', 'Quantidade_Entregue'], 0));
            break;
          }
        }

        var result = typeof createRecusaUnificado === 'function'
          ? createRecusaUnificado(recusa)
          : api_create('Recusas', recusa);

        _sgae_updateRowById(['Entregas'], dados.entrega_id, {
          Status: 'RECUSADO',
          Status_Entrega: 'RECUSADO',
          Observacoes: recusa.descricao
        });
        _sgae_updateRowById(['Notas_Fiscais', 'Workflow_NotasFiscais'], dados.entrega_id, {
          status: 'RECUSADA',
          Status: 'RECUSADA',
          Status_NF: 'RECUSADA',
          observacoes: recusa.descricao
        });

        if (typeof InvoiceWorkflow !== 'undefined') {
          try { InvoiceWorkflow.recusarNF(dados.entrega_id, { motivo: dados.motivo, detalhes: recusa.descricao }); } catch (ignored) {}
        }

        return {
          success: result && result.success !== false,
          id: (result && (result.id || (result.data && result.data.id))) || '',
          status: 'AGUARDANDO_REPOSICAO',
          mensagem: 'Recusa registrada e entrega marcada para reposição'
        };
      } catch (e) {
        Logger.log('Erro api_entrega_recusar: ' + e.message);
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em api_entrega_recusar: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em api_entrega_recusar: " + error.message);
    throw error;
  }
}

function api_fornecedor_getDadosPortal() {
  try {
    var fornecedor = _sgae_fornecedorAtual();
    if (!fornecedor) return { success: false, error: 'Fornecedor não localizado para o usuário atual' };
    var empenhos = _sgae_listarEmpenhosFornecedor(fornecedor);
    return {
      success: true,
      data: {
        fornecedor: {
          id: String(_sgae_pick(fornecedor, ['id', 'ID'], '')),
          razao_social: String(_sgae_pick(fornecedor, ['razao_social', 'Fornecedor', 'fornecedor', 'nome'], 'Fornecedor')),
          documento: String(_sgae_pick(fornecedor, ['cnpj', 'CNPJ', 'documento'], '')),
          email: String(_sgae_pick(fornecedor, ['email', 'Email'], ''))
        },
        empenhos: empenhos
      }
    };
  } catch (e) {
    Logger.log('Erro api_fornecedor_getDadosPortal: ' + e.message);
    return { success: false, error: e.message };
  }
}

function _sgae_mesCurto(idx) {
  return ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][idx - 1] || '';
}

function _sgae_inPeriod(dateValue, filtros) {
  try {
    if (!filtros || (!filtros.ano && !filtros.mes)) return true;
    if (!dateValue) return true;
    var date = dateValue instanceof Date ? dateValue : new Date(dateValue);
    if (isNaN(date.getTime())) return true;
    if (filtros.ano && date.getFullYear() !== Number(filtros.ano)) return false;
    if (filtros.mes && (date.getMonth() + 1) !== Number(filtros.mes)) return false;
    return true;
  } catch (error) {
    Logger.log("Erro em _sgae_inPeriod: " + error.message);
    throw error;
  }
}

function api_dashboard_financeiro(filtros) {
  try {
    try {
      filtros = filtros || {};
      var contratos = _sgae_readObjects(['Contratos']);
      var empenhos = _sgae_readObjects(['Contratos_Empenho', 'Empenhos']);
      var nfs = _sgae_readObjects(['Notas_Fiscais', 'Workflow_NotasFiscais']);
      var glosas = _sgae_readObjects(['Glosas']);

      contratos = contratos.filter(function(c) { return _sgae_inPeriod(_sgae_pick(c, ['data_inicio', 'data_emissao', 'Data_Emissao'], null), filtros); });
      empenhos = empenhos.filter(function(e) { return _sgae_inPeriod(_sgae_pick(e, ['data_emissao', 'Data_Emissao'], null), filtros); });
      nfs = nfs.filter(function(nf) { return _sgae_inPeriod(_sgae_pick(nf, ['data_emissao', 'Data_Emissao', 'data_lancamento', 'data_cadastro'], null), filtros); });

      var totalContratado = contratos.reduce(function(sum, c) { return sum + _sgae_number(_sgae_pick(c, ['valor_total', 'Valor_Total'], 0)); }, 0);
      var totalEmpenhado = empenhos.reduce(function(sum, e) { return sum + _sgae_number(_sgae_pick(e, ['valor_atual', 'valor_total', 'Valor_Total'], 0)); }, 0);
      var totalLiquidado = empenhos.reduce(function(sum, e) { return sum + _sgae_number(_sgae_pick(e, ['valor_liquidado', 'valor_utilizado', 'Valor_Utilizado'], 0)); }, 0);
      var totalPago = nfs.reduce(function(sum, nf) {
        var status = String(_sgae_pick(nf, ['status', 'Status', 'Status_NF'], '')).toUpperCase();
        return sum + (status === 'PAGA' ? _sgae_number(_sgae_pick(nf, ['valor_pago', 'valor_liquido', 'valor_total', 'Valor_Total'], 0)) : 0);
      }, 0);
      if (!totalContratado) totalContratado = totalEmpenhado;

      var fornecedoresMap = {};
      empenhos.forEach(function(e) {
        var nome = String(_sgae_pick(e, ['fornecedor_nome', 'Fornecedor', 'fornecedor'], 'Fornecedor'));
        var key = _sgae_normKey(nome) || 'fornecedor';
        if (!fornecedoresMap[key]) fornecedoresMap[key] = { nome: nome, cnpj: '', empenhado: 0, pago: 0 };
        fornecedoresMap[key].empenhado += _sgae_number(_sgae_pick(e, ['valor_atual', 'valor_total', 'Valor_Total'], 0));
      });
      nfs.forEach(function(nf) {
        var nome = String(_sgae_pick(nf, ['fornecedor_nome', 'fornecedor', 'Fornecedor'], 'Fornecedor'));
        var key = _sgae_normKey(nome) || 'fornecedor';
        if (!fornecedoresMap[key]) fornecedoresMap[key] = { nome: nome, cnpj: String(_sgae_pick(nf, ['cnpj', 'CNPJ', 'fornecedor_cnpj'], '')), empenhado: 0, pago: 0 };
        fornecedoresMap[key].cnpj = fornecedoresMap[key].cnpj || String(_sgae_pick(nf, ['cnpj', 'CNPJ', 'fornecedor_cnpj'], ''));
        var status = String(_sgae_pick(nf, ['status', 'Status', 'Status_NF'], '')).toUpperCase();
        if (status === 'PAGA') fornecedoresMap[key].pago += _sgae_number(_sgae_pick(nf, ['valor_pago', 'valor_liquido', 'valor_total', 'Valor_Total'], 0));
      });
      var fornecedores = Object.keys(fornecedoresMap).map(function(k) { return fornecedoresMap[k]; }).sort(function(a, b) { return b.pago - a.pago; });

      var grupoMap = {};
      nfs.forEach(function(nf) {
        var produto = String(_sgae_pick(nf, ['produto', 'Produto', 'Produto_Descricao'], 'Outros'));
        var grupo = /fruta|hort|verd|legume|ma..|banana|cenoura/i.test(produto) ? 'Hortifruti' :
          /carne|frango|peixe|bovina|suina/i.test(produto) ? 'Carnes' :
          /leite|queijo|iogurte|latic/i.test(produto) ? 'Laticinios' :
          /arroz|feij|grao|cereal|milho/i.test(produto) ? 'Graos e Cereais' :
          /pao|panif|biscoito/i.test(produto) ? 'Panificacao' : 'Outros';
        if (!grupoMap[grupo]) grupoMap[grupo] = { nome: grupo, empenhado: 0, pago: 0 };
        var valor = _sgae_number(_sgae_pick(nf, ['valor_total', 'valor_bruto', 'Valor_Total'], 0));
        grupoMap[grupo].empenhado += valor;
        var status = String(_sgae_pick(nf, ['status', 'Status', 'Status_NF'], '')).toUpperCase();
        if (status === 'PAGA') grupoMap[grupo].pago += valor;
      });
      var grupos = Object.keys(grupoMap).map(function(k) { return grupoMap[k]; });
      if (!grupos.length) grupos = [{ nome: 'Outros', empenhado: totalEmpenhado, pago: totalPago }];

      var mensalMap = {};
      for (var m = 1; m <= 12; m++) mensalMap[m] = { mes: _sgae_mesCurto(m), empenhado: 0, liquidado: 0, pago: 0 };
      empenhos.forEach(function(e) {
        var d = new Date(_sgae_pick(e, ['data_emissao', 'Data_Emissao'], new Date()));
        var m = isNaN(d.getTime()) ? 1 : d.getMonth() + 1;
        mensalMap[m].empenhado += _sgae_number(_sgae_pick(e, ['valor_atual', 'valor_total', 'Valor_Total'], 0));
        mensalMap[m].liquidado += _sgae_number(_sgae_pick(e, ['valor_liquidado', 'valor_utilizado', 'Valor_Utilizado'], 0));
      });
      nfs.forEach(function(nf) {
        var status = String(_sgae_pick(nf, ['status', 'Status', 'Status_NF'], '')).toUpperCase();
        if (status !== 'PAGA') return;
        var d = new Date(_sgae_pick(nf, ['data_pagamento', 'data_atesto', 'data_emissao', 'Data_Emissao'], new Date()));
        var m = isNaN(d.getTime()) ? 1 : d.getMonth() + 1;
        mensalMap[m].pago += _sgae_number(_sgae_pick(nf, ['valor_pago', 'valor_liquido', 'valor_total', 'Valor_Total'], 0));
      });
      var mensal = Object.keys(mensalMap).map(function(k) { return mensalMap[k]; });

      var statusNFs = { lancadas: 0, conferencia: 0, atestadas: 0, pagas: 0, recusadas: 0 };
      nfs.forEach(function(nf) {
        var s = String(_sgae_pick(nf, ['status', 'Status', 'Status_NF'], '')).toUpperCase();
        if (['PAGA', 'PAGO'].indexOf(s) >= 0) statusNFs.pagas++;
        else if (s.indexOf('ATEST') >= 0) statusNFs.atestadas++;
        else if (s.indexOf('RECUS') >= 0 || s.indexOf('REJEIT') >= 0) statusNFs.recusadas++;
        else if (s.indexOf('CONFER') >= 0 || s.indexOf('RECEB') >= 0) statusNFs.conferencia++;
        else statusNFs.lancadas++;
      });

      var totalGlosas = glosas.reduce(function(sum, g) { return sum + _sgae_number(_sgae_pick(g, ['Valor_Glosado', 'Valor_Total_Glosa', 'valor', 'Valor'], 0)); }, 0);

      return {
        success: true,
        data: {
          resumo: {
            totalContratado: totalContratado,
            totalEmpenhado: totalEmpenhado,
            totalLiquidado: totalLiquidado,
            totalPago: totalPago,
            totalGlosas: totalGlosas,
            contratosAtivos: contratos.filter(function(c) {
              var status = String(_sgae_pick(c, ['status', 'Status'], 'Vigente')).toUpperCase();
              return status !== 'ENCERRADO' && status !== 'CANCELADO';
            }).length
          },
          grupos: grupos,
          fornecedores: fornecedores,
          mensal: mensal,
          statusNFs: statusNFs
        }
      };
    } catch (e) {
      Logger.log('Erro api_dashboard_financeiro: ' + e.message);
      return { success: false, error: e.message };
    }
  } catch (error) {
    Logger.log("Erro em api_dashboard_financeiro: " + error.message);
    throw error;
  }
}

// ============================================================================
// COMPATIBILIDADE / LEGADO / MENUS
// ============================================================================

// Mantém funções de menu originais para não quebrar a UI
function abrirWorkflowFornecedor() { _abrirSidebar('UI_Workflow_Fornecedor', 'Fornecedor'); }
function abrirWorkflowRepresentante() { _abrirSidebar('UI_Workflow_Representante', 'Escola'); }
function abrirWorkflowAnalista() { _abrirSidebar('UI_Workflow_Analista', 'Analista'); }
function abrirWorkflowNutricionista() { _abrirSidebar('UI_Workflow_Nutricionista', 'Nutricionista'); }

function _abrirSidebar(arquivo, titulo) {
  try {
    try {
      var html = HtmlService.createHtmlOutputFromFile(arquivo).setWidth(420).setHeight(650).setTitle(titulo);
      SpreadsheetApp.getUi().showSidebar(html);
    } catch (e) {
      Logger.log('Erro sidebar: ' + e.message);
    }
  } catch (error) {
    Logger.log("Erro em _abrirSidebar: " + error.message);
    throw error;
  }
}
