/**
 * @fileoverview Sincronização Backend-Frontend - Ponto Único de Verdade
 * @version 1.0.0
 * @author UNIAE CRE Team
 * @created 2025-12-22
 * 
 * @description
 * Este módulo resolve DEFINITIVAMENTE a desconexão entre backend e frontend.
 * TODAS as chamadas do frontend devem passar por aqui.
 * 
 * PROBLEMA RESOLVIDO:
 * - Múltiplas funções listarNotasFiscais em arquivos diferentes
 * - Badge mostrando "3" mas tabela mostrando 7 registros
 * - Mapeamento de campos inconsistente
 * - Funções duplicadas competindo entre si
 * 
 * FUNÇÕES PRINCIPAIS (chamadas pelo frontend via google.script.run):
 * - listarNotasFiscais() - Lista todas as NFs consolidadas
 * - salvarNotaFiscal(dados) - Salva nova NF
 * - contarNFsPendentes() - Retorna contagem para badge
 * - getMetricasDashboard() - Retorna métricas consolidadas
 * 
 * ARQUIVOS MODIFICADOS:
 * - Core_Workflow_API.gs: funções renomeadas para _Workflow suffix
 * - Core_Legacy_Aliases.gs: função salvarNotaFiscal comentada
 * - Core_CRUD_Frontend_Bridge.gs: mantido como fallback (listNotasFiscais com 't')
 */

'use strict';

// ============================================================================
// CONFIGURAÇÃO CENTRAL - FONTE ÚNICA DE VERDADE
// ============================================================================

/**
 * Configuração das abas e seus campos
 */
var SYNC_CONFIG = {
  // Aba principal de Notas Fiscais (workflow)
  SHEET_NFS_WORKFLOW: 'Workflow_NotasFiscais',
  // Aba legada de Notas Fiscais
  SHEET_NFS_LEGACY: 'NotasFiscais',
  
  // Headers esperados na aba Workflow_NotasFiscais
  HEADERS_NFS: [
    'ID', 'Data_Criacao', 'Numero', 'Serie', 'Chave_Acesso', 'Data_Emissao',
    'CNPJ', 'Fornecedor', 'Produto', 'Quantidade', 'Unidade', 
    'Valor_Unitario', 'Valor_Total', 'Nota_Empenho', 'Status', 'Usuario'
  ],
  
  // Status que contam como "pendentes" para o badge
  STATUS_PENDENTES: ['ENVIADA', 'EM_RECEBIMENTO', 'PENDENTE', 'Pendente', 'Recebida'],
  
  // Status que contam como "problemas"
  STATUS_PROBLEMAS: ['REJEITADO', 'GLOSADO', 'CANCELADA', 'Rejeitado', 'Glosado']
};

// ============================================================================
// FUNÇÕES PRINCIPAIS - CHAMADAS PELO FRONTEND
// ============================================================================

/**
 * Lista Notas Fiscais - FUNÇÃO PRINCIPAL para o frontend
 * Esta é a função que UI_Workflow_Fornecedor.html chama via google.script.run
 * 
 * @returns {Array} Array de objetos NF no formato esperado pelo frontend
 */
function listarNotasFiscais() {
  try {
    try {
      Logger.log('=== listarNotasFiscais (SYNC) INICIANDO ===');
  
      try {
        var ss = getSS();
        if (!ss) {
          Logger.log('ERRO: Spreadsheet não encontrada');
          return [];
        }
    
        var allNFs = [];
        var idsProcessados = {};
    
        // 1. PRIORIDADE: Ler da aba Workflow_NotasFiscais (estrutura completa)
        var sheetWorkflow = ss.getSheetByName(SYNC_CONFIG.SHEET_NFS_WORKFLOW);
        if (sheetWorkflow && sheetWorkflow.getLastRow() > 1) {
          var dataWF = sheetWorkflow.getDataRange().getValues();
          var headersWF = dataWF[0];
      
          Logger.log('Workflow_NotasFiscais: ' + (dataWF.length - 1) + ' registros, headers: ' + headersWF.join(', '));
      
          // Criar mapa de índices
          var idxWF = _criarMapaIndices(headersWF);
      
          for (var i = 1; i < dataWF.length; i++) {
            var row = dataWF[i];
            var id = row[idxWF.id] || row[0];
        
            if (!id || idsProcessados[id]) continue;
            idsProcessados[id] = true;
        
            var nf = _extrairNFWorkflow(row, idxWF, i + 1);
            if (nf) allNFs.push(nf);
          }
        }
    
        // 2. FALLBACK: Ler da aba NotasFiscais (legada)
        var sheetLegacy = ss.getSheetByName(SYNC_CONFIG.SHEET_NFS_LEGACY);
        if (sheetLegacy && sheetLegacy.getLastRow() > 1) {
          var dataLegacy = sheetLegacy.getDataRange().getValues();
          var headersLegacy = dataLegacy[0];
      
          Logger.log('NotasFiscais (legacy): ' + (dataLegacy.length - 1) + ' registros');
      
          var idxLegacy = _criarMapaIndices(headersLegacy);
      
          for (var j = 1; j < dataLegacy.length; j++) {
            var rowL = dataLegacy[j];
            var idL = rowL[idxLegacy.id] || rowL[0];
        
            if (!idL || idsProcessados[idL]) continue;
            idsProcessados[idL] = true;
        
            var nfL = _extrairNFLegacy(rowL, idxLegacy, j + 1);
            if (nfL) allNFs.push(nfL);
          }
        }
    
        // 3. Ordenar por data (mais recentes primeiro)
        allNFs.sort(function(a, b) {
          var dateA = a.dataCriacao || a.dataEmissao || new Date(0);
          var dateB = b.dataCriacao || b.dataEmissao || new Date(0);
          return new Date(dateB) - new Date(dateA);
        });
    
        Logger.log('=== listarNotasFiscais: Retornando ' + allNFs.length + ' NFs ===');
        return allNFs;
    
      } catch (e) {
        Logger.log('ERRO listarNotasFiscais: ' + e.message + '\n' + e.stack);
        return [];
      }
    } catch (error) {
      Logger.log("Erro em listarNotasFiscais: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em listarNotasFiscais: " + error.message);
    throw error;
  }
}

/**
 * Salva nova Nota Fiscal - FUNÇÃO PRINCIPAL para o frontend
 * Esta é a função que UI_Workflow_Fornecedor.html chama via google.script.run
 * 
 * @param {Object} dados - Dados da NF do formulário
 * @returns {Object} {success: boolean, id?: string, valorTotal?: number, error?: string}
 */
function salvarNotaFiscal(dados) {
  try {
    try {
      try {
        Logger.log('=== salvarNotaFiscal (SYNC) INICIANDO ===');
        Logger.log('Dados recebidos: ' + JSON.stringify(dados));
  
        try {
          // Validações
          if (!dados) {
            return { success: false, error: 'Dados não fornecidos' };
          }
          if (!dados.numero) {
            return { success: false, error: 'Número da NF é obrigatório' };
          }
          if (!dados.chaveAcesso || dados.chaveAcesso.length !== 44) {
            return { success: false, error: 'Chave de acesso deve ter 44 dígitos' };
          }
          if (!dados.produto) {
            return { success: false, error: 'Produto é obrigatório' };
          }
          if (!dados.quantidade || dados.quantidade <= 0) {
            return { success: false, error: 'Quantidade deve ser maior que zero' };
          }
          if (!dados.valorUnitario || dados.valorUnitario <= 0) {
            return { success: false, error: 'Valor unitário deve ser maior que zero' };
          }
    
          var ss = getSS();
          var sheet = ss.getSheetByName(SYNC_CONFIG.SHEET_NFS_WORKFLOW);
    
          // Criar aba se não existir
          if (!sheet) {
            sheet = ss.insertSheet(SYNC_CONFIG.SHEET_NFS_WORKFLOW);
            sheet.appendRow(SYNC_CONFIG.HEADERS_NFS);
            sheet.getRange(1, 1, 1, SYNC_CONFIG.HEADERS_NFS.length).setFontWeight('bold');
            Logger.log('Aba ' + SYNC_CONFIG.SHEET_NFS_WORKFLOW + ' criada');
          }
    
          // Criar headers se aba vazia
          if (sheet.getLastRow() === 0) {
            sheet.appendRow(SYNC_CONFIG.HEADERS_NFS);
            sheet.getRange(1, 1, 1, SYNC_CONFIG.HEADERS_NFS.length).setFontWeight('bold');
          }
    
          // Gerar ID único
          var id = 'NF_' + new Date().getTime();
          var valorTotal = Math.round(dados.quantidade * dados.valorUnitario * 100) / 100;
    
          // Preparar linha
          var novaLinha = [
            id,                                    // ID
            new Date(),                            // Data_Criacao
            dados.numero,                          // Numero
            dados.serie || '1',                    // Serie
            dados.chaveAcesso,                     // Chave_Acesso
            dados.dataEmissao || new Date(),       // Data_Emissao
            dados.cnpj || '',                      // CNPJ
            dados.fornecedor || '',                // Fornecedor
            dados.produto,                         // Produto
            dados.quantidade,                      // Quantidade
            dados.unidade || 'KG',                 // Unidade
            dados.valorUnitario,                   // Valor_Unitario
            valorTotal,                            // Valor_Total
            dados.notaEmpenho || '',               // Nota_Empenho
            'ENVIADA',                             // Status
            Session.getActiveUser().getEmail()     // Usuario
          ];
    
          sheet.appendRow(novaLinha);
    
          Logger.log('NF salva com sucesso: ' + id + ' - R$ ' + valorTotal);
    
          return {
            success: true,
            id: id,
            valorTotal: valorTotal
          };
    
        } catch (e) {
          Logger.log('ERRO salvarNotaFiscal: ' + e.message);
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em salvarNotaFiscal: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em salvarNotaFiscal: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em salvarNotaFiscal: " + error.message);
    throw error;
  }
}

/**
 * Retorna contagem de NFs pendentes para o badge
 * @returns {number} Quantidade de NFs pendentes
 */
function contarNFsPendentes() {
  try {
    try {
      var nfs = listarNotasFiscais();
      var pendentes = 0;
    
      for (var i = 0; i < nfs.length; i++) {
        var status = String(nfs[i].status || '').toUpperCase();
        if (SYNC_CONFIG.STATUS_PENDENTES.some(function(s) { 
          return status === s.toUpperCase(); 
        })) {
          pendentes++;
        }
      }
    
      return pendentes;
    } catch (e) {
      Logger.log('Erro contarNFsPendentes: ' + e.message);
      return 0;
    }
  } catch (error) {
    Logger.log("Erro em contarNFsPendentes: " + error.message);
    throw error;
  }
}

/**
 * Retorna métricas para o dashboard
 * @returns {Object} Métricas consolidadas
 */
function getMetricasDashboard() {
  try {
    try {
      var nfs = listarNotasFiscais();
    
      var total = nfs.length;
      var pendentes = 0;
      var problemas = 0;
      var valorTotal = 0;
    
      for (var i = 0; i < nfs.length; i++) {
        var nf = nfs[i];
        var status = String(nf.status || '').toUpperCase();
      
        // Somar valor
        valorTotal += parseFloat(nf.valorTotal) || 0;
      
        // Contar pendentes
        if (SYNC_CONFIG.STATUS_PENDENTES.some(function(s) { 
          return status === s.toUpperCase(); 
        })) {
          pendentes++;
        }
      
        // Contar problemas
        if (SYNC_CONFIG.STATUS_PROBLEMAS.some(function(s) { 
          return status === s.toUpperCase(); 
        })) {
          problemas++;
        }
      }
    
      return {
        success: true,
        data: {
          totalNFs: total,
          pendentes: pendentes,
          problemas: problemas,
          valorTotal: Math.round(valorTotal * 100) / 100
        }
      };
    
    } catch (e) {
      Logger.log('Erro getMetricasDashboard: ' + e.message);
      return { success: false, error: e.message };
    }
  } catch (error) {
    Logger.log("Erro em getMetricasDashboard: " + error.message);
    throw error;
  }
}

// ============================================================================
// FUNÇÕES AUXILIARES PRIVADAS
// ============================================================================

/**
 * Cria mapa de índices dos headers (case-insensitive)
 * @private
 */
function _criarMapaIndices(headers) {
  try {
    var map = {
      id: -1, dataCriacao: -1, numero: -1, serie: -1, chaveAcesso: -1,
      dataEmissao: -1, cnpj: -1, fornecedor: -1, produto: -1, quantidade: -1,
      unidade: -1, valorUnitario: -1, valorTotal: -1, notaEmpenho: -1, status: -1, usuario: -1
    };
  
    for (var i = 0; i < headers.length; i++) {
      var h = String(headers[i] || '').toLowerCase().replace(/[_\s]/g, '');
    
      if (h === 'id') map.id = i;
      else if (h === 'datacriacao' || h === 'dataregistro' || h === 'datacadastro') map.dataCriacao = i;
      else if (h === 'numero' || h === 'numeronf' || h === 'notafiscal') map.numero = i;
      else if (h === 'serie') map.serie = i;
      else if (h === 'chaveacesso') map.chaveAcesso = i;
      else if (h === 'dataemissao') map.dataEmissao = i;
      else if (h === 'cnpj') map.cnpj = i;
      else if (h === 'fornecedor' || h === 'fornecedornome') map.fornecedor = i;
      else if (h === 'produto' || h === 'produtodescricao') map.produto = i;
      else if (h === 'quantidade' || h === 'quantidadeentregue') map.quantidade = i;
      else if (h === 'unidade') map.unidade = i;
      else if (h === 'valorunitario') map.valorUnitario = i;
      else if (h === 'valortotal') map.valorTotal = i;
      else if (h === 'notaempenho') map.notaEmpenho = i;
      else if (h === 'status' || h === 'statusnf') map.status = i;
      else if (h === 'usuario' || h === 'registradopor') map.usuario = i;
    }
  
    return map;
  } catch (error) {
    Logger.log("Erro em _criarMapaIndices: " + error.message);
    throw error;
  }
}

/**
 * Extrai NF da aba Workflow (estrutura completa)
 * @private
 */
function _extrairNFWorkflow(row, idx, rowNum) {
  try {
    var id = row[idx.id !== -1 ? idx.id : 0];
    if (!id) return null;
  
    return {
      id: String(id),
      dataCriacao: _formatarData(row[idx.dataCriacao !== -1 ? idx.dataCriacao : 1]),
      numero: String(row[idx.numero !== -1 ? idx.numero : 2] || ''),
      serie: String(row[idx.serie !== -1 ? idx.serie : 3] || '1'),
      chaveAcesso: String(row[idx.chaveAcesso !== -1 ? idx.chaveAcesso : 4] || ''),
      dataEmissao: _formatarData(row[idx.dataEmissao !== -1 ? idx.dataEmissao : 5]),
      cnpj: String(row[idx.cnpj !== -1 ? idx.cnpj : 6] || ''),
      fornecedor: String(row[idx.fornecedor !== -1 ? idx.fornecedor : 7] || ''),
      produto: String(row[idx.produto !== -1 ? idx.produto : 8] || ''),
      quantidade: parseFloat(row[idx.quantidade !== -1 ? idx.quantidade : 9]) || 0,
      unidade: String(row[idx.unidade !== -1 ? idx.unidade : 10] || 'KG'),
      valorUnitario: parseFloat(row[idx.valorUnitario !== -1 ? idx.valorUnitario : 11]) || 0,
      valorTotal: parseFloat(row[idx.valorTotal !== -1 ? idx.valorTotal : 12]) || 0,
      notaEmpenho: String(row[idx.notaEmpenho !== -1 ? idx.notaEmpenho : 13] || ''),
      status: String(row[idx.status !== -1 ? idx.status : 14] || 'ENVIADA'),
      usuario: String(row[idx.usuario !== -1 ? idx.usuario : 15] || ''),
      rowIndex: rowNum,
      source: 'Workflow_NotasFiscais'
    };
  } catch (error) {
    Logger.log("Erro em _extrairNFWorkflow: " + error.message);
    throw error;
  }
}

/**
 * Extrai NF da aba Legacy (estrutura simplificada)
 * @private
 */
function _extrairNFLegacy(row, idx, rowNum) {
  try {
    var id = row[idx.id !== -1 ? idx.id : 0];
    if (!id) return null;
  
    return {
      id: String(id),
      dataCriacao: _formatarData(row[idx.dataCriacao !== -1 ? idx.dataCriacao : 8]),
      numero: String(row[idx.numero !== -1 ? idx.numero : 1] || ''),
      serie: '',
      chaveAcesso: String(row[idx.chaveAcesso !== -1 ? idx.chaveAcesso : ''] || ''),
      dataEmissao: _formatarData(row[idx.dataEmissao !== -1 ? idx.dataEmissao : 2]),
      cnpj: '',
      fornecedor: String(row[idx.fornecedor !== -1 ? idx.fornecedor : 3] || ''),
      produto: '',
      quantidade: 0,
      unidade: '',
      valorUnitario: 0,
      valorTotal: parseFloat(row[idx.valorTotal !== -1 ? idx.valorTotal : 4]) || 0,
      notaEmpenho: String(row[idx.notaEmpenho !== -1 ? idx.notaEmpenho : 5] || ''),
      status: String(row[idx.status !== -1 ? idx.status : 6] || 'Pendente'),
      usuario: String(row[idx.usuario !== -1 ? idx.usuario : 7] || ''),
      rowIndex: rowNum,
      source: 'NotasFiscais'
    };
  } catch (error) {
    Logger.log("Erro em _extrairNFLegacy: " + error.message);
    throw error;
  }
}

/**
 * Formata data para string ISO
 * @private
 */
function _formatarData(valor) {
  try {
    if (!valor) return '';
    if (valor instanceof Date) {
      return valor.toISOString();
    }
    return String(valor);
  } catch (error) {
    Logger.log("Erro em _formatarData: " + error.message);
    throw error;
  }
}

// ============================================================================
// REGISTRO DO MÓDULO
// ============================================================================

Logger.log('✅ Core_Sync_Backend_Frontend carregado - Sincronização unificada ativa');


// ============================================================================
// FUNÇÕES DE DIAGNÓSTICO
// ============================================================================

/**
 * Diagnóstico completo da sincronização
 * @returns {Object} Relatório de diagnóstico
 */
function diagnosticoSincronizacao() {
  try {
    try {
      var resultado = {
        timestamp: new Date().toISOString(),
        status: 'OK',
        problemas: [],
        estatisticas: {}
      };
  
      try {
        var ss = getSS();
    
        // Verificar abas
        var abaWorkflow = ss.getSheetByName(SYNC_CONFIG.SHEET_NFS_WORKFLOW);
        var abaLegacy = ss.getSheetByName(SYNC_CONFIG.SHEET_NFS_LEGACY);
    
        resultado.estatisticas.abaWorkflowExiste = !!abaWorkflow;
        resultado.estatisticas.abaLegacyExiste = !!abaLegacy;
    
        if (abaWorkflow) {
          resultado.estatisticas.registrosWorkflow = Math.max(0, abaWorkflow.getLastRow() - 1);
        }
        if (abaLegacy) {
          resultado.estatisticas.registrosLegacy = Math.max(0, abaLegacy.getLastRow() - 1);
        }
    
        // Testar listagem
        var nfs = listarNotasFiscais();
        resultado.estatisticas.totalNFsConsolidadas = nfs.length;
    
        // Testar contagem
        var pendentes = contarNFsPendentes();
        resultado.estatisticas.nfsPendentes = pendentes;
    
        // Verificar consistência
        var contManual = 0;
        nfs.forEach(function(nf) {
          var status = String(nf.status || '').toUpperCase();
          if (SYNC_CONFIG.STATUS_PENDENTES.some(function(s) { return status === s.toUpperCase(); })) {
            contManual++;
          }
        });
    
        if (pendentes !== contManual) {
          resultado.problemas.push('Inconsistência: contarNFsPendentes=' + pendentes + ' vs contagem manual=' + contManual);
          resultado.status = 'AVISO';
        }
    
        // Verificar estrutura dos dados
        if (nfs.length > 0) {
          var camposObrigatorios = ['id', 'numero', 'fornecedor', 'valorTotal', 'status'];
          var nf = nfs[0];
          camposObrigatorios.forEach(function(campo) {
            if (nf[campo] === undefined) {
              resultado.problemas.push('Campo obrigatório ausente: ' + campo);
              resultado.status = 'ERRO';
            }
          });
        }
    
      } catch (e) {
        resultado.status = 'ERRO';
        resultado.problemas.push('Erro no diagnóstico: ' + e.message);
      }
  
      Logger.log('=== DIAGNÓSTICO DE SINCRONIZAÇÃO ===');
      Logger.log(JSON.stringify(resultado, null, 2));
  
      return resultado;
    } catch (error) {
      Logger.log("Erro em diagnosticoSincronizacao: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em diagnosticoSincronizacao: " + error.message);
    throw error;
  }
}

/**
 * Verifica se há funções duplicadas no projeto
 * @returns {Object} Relatório de duplicações
 */
function verificarFuncoesDuplicadas() {
  var funcoes = {
    listarNotasFiscais: [],
    salvarNotaFiscal: [],
    listNotasFiscais: []
  };
  
  // Esta função é informativa - não consegue detectar automaticamente
  // mas documenta onde as funções devem estar
  
  return {
    info: 'Funções centralizadas em Core_Sync_Backend_Frontend.gs',
    funcoesPrincipais: {
      listarNotasFiscais: 'Core_Sync_Backend_Frontend.gs (ATIVA)',
      salvarNotaFiscal: 'Core_Sync_Backend_Frontend.gs (ATIVA)',
      listarNotasFiscais_Workflow: 'Core_Workflow_API.gs (DEPRECATED)',
      salvarNotaFiscal_Workflow: 'Core_Workflow_API.gs (DEPRECATED)',
      listNotasFiscais: 'Core_CRUD_Frontend_Bridge.gs (alias para listNotasFiscaisUnificado)',
      listNotasFiscaisUnificado: 'Core_CRUD_Frontend_Bridge.gs (ATIVA)'
    },
    recomendacao: 'Frontend deve chamar listarNotasFiscais() e salvarNotaFiscal()'
  };
}


// ============================================================================
// FUNÇÕES DE ATUALIZAÇÃO - ATESTO E STATUS
// ============================================================================

/**
 * Atualiza uma Nota Fiscal por rowIndex
 * Compatível com o frontend que chama updateNotaFiscal(rowIndex, data)
 * 
 * @param {number} rowIndex - Índice da linha na planilha
 * @param {Object} data - Dados a atualizar (ex: {status: 'Atestada'})
 * @returns {Object} Resultado da operação
 */
function updateNotaFiscal(rowIndex, data) {
  try {
    try {
      Logger.log('=== updateNotaFiscal (SYNC) ===');
      Logger.log('rowIndex: ' + rowIndex + ', data: ' + JSON.stringify(data));
  
      try {
        if (!rowIndex || rowIndex < 2) {
          return { success: false, error: 'Índice de linha inválido' };
        }
    
        if (!data || typeof data !== 'object') {
          return { success: false, error: 'Dados inválidos' };
        }
    
        var ss = getSS();
    
        // Tentar atualizar em Workflow_NotasFiscais primeiro
        var sheetWorkflow = ss.getSheetByName(SYNC_CONFIG.SHEET_NFS_WORKFLOW);
        if (sheetWorkflow && rowIndex <= sheetWorkflow.getLastRow()) {
          return _atualizarNFNaSheet(sheetWorkflow, rowIndex, data);
        }
    
        // Fallback para NotasFiscais
        var sheetLegacy = ss.getSheetByName(SYNC_CONFIG.SHEET_NFS_LEGACY);
        if (sheetLegacy && rowIndex <= sheetLegacy.getLastRow()) {
          return _atualizarNFNaSheet(sheetLegacy, rowIndex, data);
        }
    
        // Tentar também Notas_Fiscais (com underscore)
        var sheetAlt = ss.getSheetByName('Notas_Fiscais');
        if (sheetAlt && rowIndex <= sheetAlt.getLastRow()) {
          return _atualizarNFNaSheet(sheetAlt, rowIndex, data);
        }
    
        return { success: false, error: 'Linha não encontrada em nenhuma aba de NFs' };
    
      } catch (e) {
        Logger.log('ERRO updateNotaFiscal: ' + e.message);
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em updateNotaFiscal: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em updateNotaFiscal: " + error.message);
    throw error;
  }
}

/**
 * Atualiza NF em uma sheet específica
 * @private
 */
function _atualizarNFNaSheet(sheet, rowIndex, data) {
  try {
    try {
      try {
        var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        var idxMap = _criarMapaIndices(headers);
  
        // Atualizar campos fornecidos
        if (data.status !== undefined) {
          var statusCol = idxMap.status !== -1 ? idxMap.status : _encontrarColuna(headers, ['Status', 'Status_NF', 'status']);
          if (statusCol >= 0) {
            sheet.getRange(rowIndex, statusCol + 1).setValue(data.status);
            Logger.log('Status atualizado para: ' + data.status + ' na coluna ' + (statusCol + 1));
          }
        }
  
        if (data.valorTotal !== undefined) {
          var valorCol = idxMap.valorTotal !== -1 ? idxMap.valorTotal : _encontrarColuna(headers, ['Valor_Total', 'ValorTotal', 'valor_total']);
          if (valorCol >= 0) {
            sheet.getRange(rowIndex, valorCol + 1).setValue(Number(data.valorTotal));
          }
        }
  
        if (data.fornecedor !== undefined) {
          var fornCol = idxMap.fornecedor !== -1 ? idxMap.fornecedor : _encontrarColuna(headers, ['Fornecedor', 'Fornecedor_Nome']);
          if (fornCol >= 0) {
            sheet.getRange(rowIndex, fornCol + 1).setValue(data.fornecedor);
          }
        }
  
        if (data.notaEmpenho !== undefined) {
          var empCol = idxMap.notaEmpenho !== -1 ? idxMap.notaEmpenho : _encontrarColuna(headers, ['Nota_Empenho', 'notaEmpenho']);
          if (empCol >= 0) {
            sheet.getRange(rowIndex, empCol + 1).setValue(data.notaEmpenho);
          }
        }
  
        // Adicionar data de atualização se existir coluna
        var updateCol = _encontrarColuna(headers, ['Data_Atualizacao', 'dataAtualizacao', 'Ultima_Atualizacao']);
        if (updateCol >= 0) {
          sheet.getRange(rowIndex, updateCol + 1).setValue(new Date());
        }
  
        return { 
          success: true, 
          rowIndex: rowIndex,
          message: 'Nota fiscal atualizada com sucesso'
        };
      } catch (error) {
        Logger.log("Erro em _atualizarNFNaSheet: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em _atualizarNFNaSheet: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em _atualizarNFNaSheet: " + error.message);
    throw error;
  }
}

/**
 * Encontra índice de coluna por nome
 * @private
 */
function _encontrarColuna(headers, nomesPossiveis) {
  try {
    for (var i = 0; i < headers.length; i++) {
      var h = String(headers[i] || '').toLowerCase().replace(/[_\s]/g, '');
      for (var j = 0; j < nomesPossiveis.length; j++) {
        if (h === nomesPossiveis[j].toLowerCase().replace(/[_\s]/g, '')) {
          return i;
        }
      }
    }
    return -1;
  } catch (error) {
    Logger.log("Erro em _encontrarColuna: " + error.message);
    throw error;
  }
}

/**
 * Atesta múltiplas NFs de uma vez
 * @param {Array<number>} rowIndexes - Array de índices de linha
 * @param {string} novoStatus - Novo status (default: 'Atestada')
 * @returns {Object} Resultado com contagem de sucesso/falha
 */
function atestarMultiplasNFs(rowIndexes, novoStatus) {
  try {
    Logger.log('=== atestarMultiplasNFs ===');
    Logger.log('rowIndexes: ' + JSON.stringify(rowIndexes));
  
    novoStatus = novoStatus || 'Atestada';
  
    if (!Array.isArray(rowIndexes) || rowIndexes.length === 0) {
      return { success: false, error: 'Nenhuma NF selecionada' };
    }
  
    var sucesso = 0;
    var falha = 0;
    var erros = [];
  
    for (var i = 0; i < rowIndexes.length; i++) {
      var resultado = updateNotaFiscal(rowIndexes[i], { status: novoStatus });
      if (resultado.success) {
        sucesso++;
      } else {
        falha++;
        erros.push('Linha ' + rowIndexes[i] + ': ' + resultado.error);
      }
    }
  
    return {
      success: falha === 0,
      total: rowIndexes.length,
      sucesso: sucesso,
      falha: falha,
      erros: erros.length > 0 ? erros : undefined,
      message: sucesso + ' NF(s) atestada(s) com sucesso' + (falha > 0 ? ', ' + falha + ' falha(s)' : '')
    };
  } catch (error) {
    Logger.log("Erro em atestarMultiplasNFs: " + error.message);
    throw error;
  }
}

/**
 * Deleta uma Nota Fiscal por rowIndex
 * @param {number} rowIndex - Índice da linha
 * @returns {Object} Resultado da operação
 */
function deleteNotaFiscal(rowIndex) {
  try {
    try {
      Logger.log('=== deleteNotaFiscal (SYNC) ===');
      Logger.log('rowIndex: ' + rowIndex);
  
      try {
        if (!rowIndex || rowIndex < 2) {
          return { success: false, error: 'Índice de linha inválido' };
        }
    
        var ss = getSS();
    
        // Tentar deletar de Workflow_NotasFiscais primeiro
        var sheetWorkflow = ss.getSheetByName(SYNC_CONFIG.SHEET_NFS_WORKFLOW);
        if (sheetWorkflow && rowIndex <= sheetWorkflow.getLastRow()) {
          sheetWorkflow.deleteRow(rowIndex);
          return { success: true, message: 'Nota fiscal deletada' };
        }
    
        // Fallback para NotasFiscais
        var sheetLegacy = ss.getSheetByName(SYNC_CONFIG.SHEET_NFS_LEGACY);
        if (sheetLegacy && rowIndex <= sheetLegacy.getLastRow()) {
          sheetLegacy.deleteRow(rowIndex);
          return { success: true, message: 'Nota fiscal deletada' };
        }
    
        // Tentar também Notas_Fiscais
        var sheetAlt = ss.getSheetByName('Notas_Fiscais');
        if (sheetAlt && rowIndex <= sheetAlt.getLastRow()) {
          sheetAlt.deleteRow(rowIndex);
          return { success: true, message: 'Nota fiscal deletada' };
        }
    
        return { success: false, error: 'Linha não encontrada' };
    
      } catch (e) {
        Logger.log('ERRO deleteNotaFiscal: ' + e.message);
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em deleteNotaFiscal: " + error.message);
      throw error; // Re-lança para tratamento superior
    }
  } catch (error) {
    Logger.log("Erro em deleteNotaFiscal: " + error.message);
    throw error;
  }
}

Logger.log('✅ Funções de atualização (updateNotaFiscal, deleteNotaFiscal, atestarMultiplasNFs) carregadas');
