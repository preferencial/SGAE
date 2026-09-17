/**
 * @fileoverview Bridge CRUD-Frontend - Garante aderência completa entre planilha e UI
 * @version 1.0.0
 * @author UNIAE CRE Team
 * @created 2025-12-19
 * 
 * @description
 * Este módulo resolve a desconexão entre o CRUD da planilha e o frontend,
 * garantindo que os dados sejam lidos e escritos de forma consistente.
 * 
 * PROBLEMA RESOLVIDO:
 * - Múltiplas funções listNotasFiscais em arquivos diferentes
 * - Mapeamento de headers inconsistente
 * - Frontend esperando campos que não existem
 */

'use strict';

// ============================================================================
// MAPEAMENTO DE CAMPOS - FONTE ÚNICA DE VERDADE
// ============================================================================

/**
 * Mapeamento canônico de campos para cada entidade
 * Mapeia: nome_no_frontend -> possíveis_nomes_na_planilha
 */
var FIELD_MAPPINGS = {
  NOTAS_FISCAIS: {
    // Campo frontend: [possíveis nomes na planilha, em ordem de prioridade]
    id: ['ID', 'id', 'Id'],
    numero_nf: ['Numero_NF', 'numero_nf', 'Numero', 'numero', 'Nota Fiscal'],
    serie: ['Serie', 'serie'],
    chave_acesso: ['Chave_Acesso', 'chave_acesso', 'ChaveAcesso'],
    fornecedor: ['Fornecedor_Nome', 'Fornecedor', 'fornecedor'],
    cnpj: ['CNPJ', 'cnpj', 'CNPJ_Fornecedor'],
    valor_total: ['Valor_Total', 'valor_total', 'ValorTotal', 'Valor Total'],
    valor_liquido: ['Valor_Liquido', 'valor_liquido'],
    valor_glosa: ['Valor_Glosa', 'valor_glosa'],
    data_emissao: ['Data_Emissao', 'data_emissao', 'DataEmissao', 'Data Emissão'],
    data_cadastro: ['Data_Registro', 'Data_Cadastro', 'data_cadastro', 'dataCriacao'],
    status: ['Status_NF', 'Status', 'status'],
    usuario_cadastro: ['Registrado_Por', 'Usuario_Cadastro', 'usuario_cadastro', 'Responsavel_Conferencia'],
    nota_empenho: ['Nota_Empenho', 'nota_empenho', 'Nota de Empenho'],
    observacoes: ['Observacoes', 'observacoes']
  },
  
  ENTREGAS: {
    id: ['ID', 'id'],
    data_entrega: ['Data_Entrega', 'data_entrega', 'Data Entrega'],
    unidade_escolar: ['Unidade_Escolar', 'unidade_escolar', 'Escola'],
    fornecedor: ['Fornecedor', 'fornecedor'],
    produto: ['Produto_Descricao', 'Produto', 'produto'],
    quantidade: ['Quantidade_Entregue', 'Quantidade', 'quantidade'],
    status: ['Status_Entrega', 'Status', 'status'],
    responsavel: ['Responsavel_Recebimento', 'Responsavel', 'responsavel'],
    observacoes: ['Observacoes', 'observacoes']
  },
  
  RECUSAS: {
    id: ['ID', 'id'],
    data_recusa: ['Data_Recusa', 'data_recusa', 'Data'],
    escola: ['Escola', 'escola', 'Unidade_Escolar'],
    fornecedor: ['Fornecedor', 'fornecedor'],
    produto: ['Produto', 'produto'],
    motivo: ['Motivo', 'motivo'],
    quantidade: ['Quantidade_Recusada', 'Quantidade', 'quantidade'],
    status: ['Status', 'status'],
    responsavel: ['Responsavel', 'responsavel']
  },
  
  GLOSAS: {
    id: ['ID', 'id'],
    nota_fiscal_id: ['Nota_Fiscal_ID', 'NF_ID', 'nf_id'],
    data_glosa: ['Data_Glosa', 'data_glosa', 'Data'],
    fornecedor: ['Fornecedor', 'fornecedor'],
    valor: ['Valor_Glosado', 'Valor', 'valor'],
    motivo: ['Motivo', 'motivo'],
    tipo: ['Tipo_Glosa', 'Tipo', 'tipo'],
    status: ['Status', 'status']
  },
  
  ALUNOS: {
    id: ['ID', 'id'],
    nome: ['Nome_Completo', 'Nome', 'nome'],
    escola: ['Unidade_Escolar', 'Escola', 'escola'],
    patologia: ['Patologia_Dieta', 'Tipo_Necessidade', 'patologia'],
    validade_laudo: ['Validade_Laudo', 'validade_laudo'],
    status: ['Status', 'status']
  }
};

// ============================================================================
// FUNÇÕES DE TRANSFORMAÇÃO E NORMALIZAÇÃO
// ============================================================================

/**
 * Obtém a planilha de forma robusta - funciona tanto no contexto de planilha quanto de webapp
 * @returns {Spreadsheet|null} A planilha ou null se não encontrada
 */
function _getSpreadsheetRobust() {
  // Primeiro, tentar getActiveSpreadsheet (funciona quando executado da planilha)
  try {
    var ss = getSS();
    if (ss) {
      return ss;
    }
  } catch (e) {
    Logger.log('_getSpreadsheetRobust: getActiveSpreadsheet falhou: ' + e.message);
  }
  
  // Se não funcionou, tentar obter pelo ID salvo nas propriedades
  try {
    var props = PropertiesService.getScriptProperties();
    var spreadsheetId = props.getProperty('SPREADSHEET_ID');
    
    if (spreadsheetId) {
      Logger.log('_getSpreadsheetRobust: Usando SPREADSHEET_ID das propriedades: ' + spreadsheetId);
      return SpreadsheetApp.openById(spreadsheetId);
    }
  } catch (e) {
    Logger.log('_getSpreadsheetRobust: openById falhou: ' + e.message);
  }
  
  Logger.log('_getSpreadsheetRobust: Não foi possível encontrar a planilha');
  return null;
}

/**
 * Formata uma data para o formato DD/MM/YYYY
 * @param {string|Date} dateValue - Valor da data
 * @returns {string} Data formatada como DD/MM/YYYY
 */
function formatDateToDDMMYYYY(dateValue) {
  try {
    if (!dateValue) return '';
  
    var date;
    if (dateValue instanceof Date) {
      date = dateValue;
    } else {
      // Tenta parsear a string de data
      var dateStr = String(dateValue);
      // Se já está no formato DD/MM/YYYY, retorna como está
      if (/^\d{2}\/\d{2}\/\d{4}/.test(dateStr)) {
        return dateStr.substring(0, 10);
      }
      // Se está no formato YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
        date = new Date(dateStr + 'T00:00:00');
      } else {
        date = new Date(dateStr);
      }
    }
  
    // Verifica se a data é válida
    if (isNaN(date.getTime())) {
      return String(dateValue);
    }
  
    var day = date.getDate();
    var month = date.getMonth() + 1;
    var year = date.getFullYear();
  
    // Adicionar zero à esquerda manualmente (padStart não existe em GAS antigo)
    var dayStr = day < 10 ? '0' + day : String(day);
    var monthStr = month < 10 ? '0' + month : String(month);
  
    return dayStr + '/' + monthStr + '/' + year;
  } catch (error) {
    Logger.log("Erro em formatDateToDDMMYYYY: " + error.message);
    throw error;
  }
}

/**
 * Transforma dados brutos de Nota Fiscal para formato normalizado
 * @param {Object} dadosBrutos - Objeto de dados brutos da planilha
 * @returns {Object} Objeto de Nota Fiscal transformado
 */
function transformarNotaFiscal(dadosBrutos) {
  try {
    if (!dadosBrutos || typeof dadosBrutos !== 'object') {
      Logger.log('transformarNotaFiscal: dados inválidos');
      return {};
    }
  
    // Extrai valores com fallback para múltiplos nomes de campo
    var id = dadosBrutos.ID || dadosBrutos.id || dadosBrutos.rowIndex || null;
    var numeroNF = dadosBrutos.Numero_NF || dadosBrutos.numero_nf || dadosBrutos['Nota Fiscal'] || '';
    var dataEmissao = dadosBrutos.Data_Emissao || dadosBrutos.data_emissao || dadosBrutos['Data Emissão'] || '';
    var fornecedor = dadosBrutos.Fornecedor_Nome || dadosBrutos.Fornecedor || dadosBrutos.fornecedor || '';
    var valorTotal = dadosBrutos.Valor_Total || dadosBrutos.valor_total || dadosBrutos['Valor Total'] || 0;
    var notaEmpenho = dadosBrutos.Nota_Empenho || dadosBrutos.nota_empenho || '';
    var status = dadosBrutos.Status_NF || dadosBrutos.Status || dadosBrutos.status || 'Pendente';
    var registradoPor = dadosBrutos.Registrado_Por || dadosBrutos.Usuario_Cadastro || dadosBrutos.usuario_cadastro || '';
    var dataRegistro = dadosBrutos.Data_Registro || dadosBrutos.Data_Cadastro || dadosBrutos.data_cadastro || '';
  
    // Normaliza valor total para número
    var valorTotalNum = 0;
    if (valorTotal) {
      valorTotalNum = parseFloat(String(valorTotal).replace(',', '.')) || 0;
    }
  
    return {
      // Campos normalizados (snake_case para frontend)
      id: id,
      numero_nf: String(numeroNF),
      data_emissao: dataEmissao,
      data_emissao_formatada: formatDateToDDMMYYYY(dataEmissao),
      fornecedor: String(fornecedor),
      valor_total: valorTotalNum,
      nota_empenho: notaEmpenho && String(notaEmpenho).trim() !== '' ? String(notaEmpenho).trim() : 'N/A',
      status: String(status),
      usuario_cadastro: String(registradoPor),
      data_cadastro: dataRegistro,
    
      // Campos com nomes alternativos (compatibilidade)
      Numero_NF: String(numeroNF),
      Fornecedor_Nome: String(fornecedor),
      Valor_Total: valorTotalNum,
      Status_NF: String(status),
      Data_Emissao: dataEmissao,
    
      // Metadados
      rowIndex: dadosBrutos.rowIndex,
      _source: dadosBrutos._source || 'NotasFiscais'
    };
  } catch (error) {
    Logger.log("Erro em transformarNotaFiscal: " + error.message);
    throw error;
  }
}

// ============================================================================
// FUNÇÕES DE LEITURA UNIFICADAS
// ============================================================================

/**
 * Lê dados de uma sheet e normaliza para o formato esperado pelo frontend
 * @param {string} sheetName - Nome da sheet
 * @param {string} entityType - Tipo da entidade (NOTAS_FISCAIS, ENTREGAS, etc)
 * @param {Object} options - Opções (limit, filters)
 * @returns {Object} Resposta padronizada {success, data, total}
 */
function readSheetNormalized(sheetName, entityType, options) {
  try {
    try {
      if (!sheetName) {
        Logger.log('readSheetNormalized called with missing sheetName');
        return { success: false, error: 'Nome da aba não fornecido' };
      }
      options = options || {};
      var limit = options.limit || 100;
      var filters = options.filters || {};
  
      try {
        var ss = _getSpreadsheetRobust();
    
        if (!ss) {
          return { success: false, error: 'Planilha não encontrada', data: [] };
        }
    
        var sheet = ss.getSheetByName(sheetName);
    
        // Fallback: tentar variações do nome da aba
        if (!sheet) {
          var alternativeNames = {
            'NotasFiscais': ['Notas_Fiscais', 'notas_fiscais', 'NotasFiscais'],
            'Notas_Fiscais': ['NotasFiscais', 'notas_fiscais', 'Notas_Fiscais'],
            'Entregas': ['entregas', 'ENTREGAS'],
            'Recusas': ['recusas', 'RECUSAS'],
            'Glosas': ['glosas', 'GLOSAS']
          };
      
          var alternatives = alternativeNames[sheetName] || [];
          for (var a = 0; a < alternatives.length; a++) {
            sheet = ss.getSheetByName(alternatives[a]);
            if (sheet) {
              Logger.log('readSheetNormalized: Usando aba alternativa "' + alternatives[a] + '" para "' + sheetName + '"');
              break;
            }
          }
        }
    
        if (!sheet) {
          Logger.log('readSheetNormalized: Sheet ' + sheetName + ' não encontrada');
          return { success: true, data: [], total: 0 };
        }
    
        var lastRow = sheet.getLastRow();
        if (lastRow < 2) {
          return { success: true, data: [], total: 0 };
        }
    
        var data = sheet.getDataRange().getValues();
        var headers = data[0];
        var mapping = FIELD_MAPPINGS[entityType] || {};
    
        // Criar índice de headers
        var headerIndex = {};
        headers.forEach(function(h, i) {
          headerIndex[h] = i;
          headerIndex[h.toLowerCase()] = i;
          headerIndex[h.toLowerCase().replace(/[_\s]/g, '')] = i;
        });
    
        var results = [];
    
        for (var i = 1; i < data.length && results.length < limit; i++) {
          var row = data[i];
          var obj = { rowIndex: i + 1, _source: sheetName };
      
          // Mapear campos usando o mapeamento definido
          for (var frontendField in mapping) {
            var possibleNames = mapping[frontendField];
            var value = null;
        
            for (var j = 0; j < possibleNames.length; j++) {
              var name = possibleNames[j];
              var idx = headerIndex[name] !== undefined ? headerIndex[name] : 
                        headerIndex[name.toLowerCase()] !== undefined ? headerIndex[name.toLowerCase()] :
                        headerIndex[name.toLowerCase().replace(/[_\s]/g, '')];
          
              if (idx !== undefined && row[idx] !== undefined && row[idx] !== '') {
                value = row[idx];
                break;
              }
            }
        
            obj[frontendField] = value;
        
            // Também adicionar com nomes alternativos para compatibilidade
            if (frontendField === 'numero_nf') {
              obj['Numero_NF'] = value;
              obj['Nota Fiscal'] = value;
            }
            if (frontendField === 'fornecedor') {
              obj['Fornecedor'] = value;
              obj['Fornecedor_Nome'] = value;
            }
            if (frontendField === 'valor_total') {
              obj['Valor_Total'] = value;
              obj['Valor Total'] = value;
            }
            if (frontendField === 'data_emissao') {
              obj['Data_Emissao'] = value;
              obj['Data Emissão'] = value;
            }
            if (frontendField === 'status') {
              obj['Status'] = value;
              obj['Status_NF'] = value;
            }
          }
      
          // Aplicar filtros
          var passFilter = true;
          for (var filterKey in filters) {
            var filterValue = filters[filterKey];
            if (filterValue && obj[filterKey] !== filterValue) {
              passFilter = false;
              break;
            }
          }

          // Incluir linha se tiver qualquer dado não-vazio (não exige ID)
          var rowHasData = row.some(function(cell) {
            return cell !== null && cell !== undefined && cell !== '';
          });

          if (passFilter && rowHasData) {
            results.push(obj);
          }
        }
    
        return {
          success: true,
          data: results,
          total: results.length
        };
    
      } catch (e) {
        Logger.log('Erro readSheetNormalized: ' + e.message);
        return { success: false, error: e.message, data: [] };
      }
    } catch (error) {
      Logger.log("Erro em readSheetNormalized: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em readSheetNormalized: " + error.message);
    throw error;
  }
}

// ============================================================================
// APIs PÚBLICAS PARA O FRONTEND
// ============================================================================


/**
 * Lista Notas Fiscais - API unificada para o frontend
 * Lê diretamente da aba NotasFiscais com mapeamento robusto
 * @param {number} limit - Limite de registros
 * @returns {Object} Resposta padronizada
 */
function listNotasFiscaisUnificado(limit) {
  try {
    try {
      Logger.log('listNotasFiscaisUnificado: INICIANDO com limit=' + limit);
      limit = limit || 100;
  
      try {
        var ss = _getSpreadsheetRobust();
    
        if (!ss) {
          Logger.log('listNotasFiscaisUnificado: ERRO - Não foi possível obter a planilha');
          return { success: false, error: 'Planilha não encontrada. Execute o setup inicial.', data: [] };
        }
    
        var sheet = null;
    
        // Busca inteligente: encontrar TODAS as abas candidatas
        var candidates = [];
        var sheets = ss.getSheets();
    
        Logger.log('listNotasFiscaisUnificado: Total de abas = ' + sheets.length);
    
        for (var i = 0; i < sheets.length; i++) {
          var s = sheets[i];
          var sheetName = s.getName();
          var normalizedName = sheetName.toLowerCase().replace(/[^a-z0-9]/g, '');
      
          Logger.log('listNotasFiscaisUnificado: Verificando aba "' + sheetName + '" -> "' + normalizedName + '"');
      
          // Aceita 'notasfiscais', 'workflownotasfiscais', etc.
          if (normalizedName === 'notasfiscais' || normalizedName === 'workflownotasfiscais') {
            candidates.push({
              sheet: s,
              rows: s.getLastRow(),
              name: sheetName,
              // Priorizar Workflow_NotasFiscais (estrutura nova com campos de produto)
              priority: normalizedName === 'workflownotasfiscais' ? 1 : 0
            });
          }
        }
    
        // Ordenar candidatos: primeiro por prioridade (Workflow primeiro), depois por linhas
        candidates.sort(function(a, b) {
          if (a.priority !== b.priority) {
            return b.priority - a.priority; // Workflow primeiro
          }
          return b.rows - a.rows; // Depois por número de linhas
        });
    
        if (candidates.length > 0) {
          sheet = candidates[0].sheet;
          Logger.log('listNotasFiscaisUnificado: Usando aba "' + sheet.getName() + '" com ' + candidates[0].rows + ' linhas (de ' + candidates.length + ' candidatas)');
        }
    
        if (!sheet) {
          Logger.log('listNotasFiscaisUnificado: Nenhuma aba de NFs encontrada (buscado por variantes de "notasfiscais" ou "workflownotasfiscais")');
          return { success: true, data: [], total: 0 };
        }
    
        var lastRow = sheet.getLastRow();
    
        if (lastRow < 2) {
          return { success: true, data: [], total: 0 };
        }
    
        // Ler todos os dados
        var data = sheet.getDataRange().getValues();
        var headers = data[0];
    
        Logger.log('listNotasFiscaisUnificado: Headers = ' + JSON.stringify(headers));
    
        // Criar índice de headers (case-insensitive e sem caracteres especiais)
        var idxMap = {};
        for (var h = 0; h < headers.length; h++) {
          if (headers[h]) {
            var key = String(headers[h]).toLowerCase().replace(/_/g, '').replace(/\s/g, '');
            idxMap[key] = h;
          }
        }
    
        var results = [];
    
        // Processar cada linha de dados
        for (var i = 1; i < data.length; i++) {
          var row = data[i];
      
          // Pular linhas completamente vazias
          var temDados = false;
          for (var j = 0; j < row.length; j++) {
            if (row[j] !== null && row[j] !== undefined && row[j] !== '') {
              temDados = true;
              break;
            }
          }
          if (!temDados) continue;
      
          // Mapeamento flexível baseado nos headers do usuário
          // ID, Numero_NF, Data_Emissao, Fornecedor_Nome, Valor_Total, Nota_Empenho, Status_NF, Registrado_Por, Data_Registro
      
          var idIdx = idxMap['id'];
          var id = (idIdx !== undefined) ? row[idIdx] : row[0];
      
          var numIdx = idxMap['numeronf'] !== undefined ? idxMap['numeronf'] : (idxMap['numero'] !== undefined ? idxMap['numero'] : 1);
          var numeroNF = row[numIdx];
      
          var emissaoIdx = idxMap['dataemissao'] !== undefined ? idxMap['dataemissao'] : 2;
          var dataEmissao = row[emissaoIdx];
      
          var fornIdx = idxMap['fornecedornome'] !== undefined ? idxMap['fornecedornome'] : (idxMap['fornecedor'] !== undefined ? idxMap['fornecedor'] : 3);
          var fornecedor = row[fornIdx];
      
          // Campos de produto (gênero alimentício)
          var produtoIdx = idxMap['produto'] !== undefined ? idxMap['produto'] : 8;
          var produto = row[produtoIdx];
      
          var quantidadeIdx = idxMap['quantidade'] !== undefined ? idxMap['quantidade'] : 9;
          var quantidade = row[quantidadeIdx];
      
          var unidadeIdx = idxMap['unidade'] !== undefined ? idxMap['unidade'] : 10;
          var unidade = row[unidadeIdx];
      
          var valorUnitarioIdx = idxMap['valorunitario'] !== undefined ? idxMap['valorunitario'] : 11;
          var valorUnitario = row[valorUnitarioIdx];
      
          var valorIdx = idxMap['valortotal'] !== undefined ? idxMap['valortotal'] : 12;
          var valorTotal = row[valorIdx];
      
          var empenhoIdx = idxMap['notaempenho'] !== undefined ? idxMap['notaempenho'] : 13;
          var notaEmpenho = row[empenhoIdx];
      
          var statusIdx = idxMap['statusnf'] !== undefined ? idxMap['statusnf'] : (idxMap['status'] !== undefined ? idxMap['status'] : 14);
          var status = row[statusIdx];
      
          var userIdx = idxMap['registradopor'] !== undefined ? idxMap['registradopor'] : (idxMap['usuario'] !== undefined ? idxMap['usuario'] : 15);
          var registradoPor = row[userIdx];
      
          var dataRegIdx = idxMap['dataregistro'] !== undefined ? idxMap['dataregistro'] : (idxMap['datacadastro'] !== undefined ? idxMap['datacadastro'] : (idxMap['datacriacao'] !== undefined ? idxMap['datacriacao'] : 1));
          var dataRegistro = row[dataRegIdx];
      
          // Normalizar valor total
          var valorTotalNum = 0;
          if (valorTotal) {
            if (typeof valorTotal === 'number') {
              valorTotalNum = valorTotal;
            } else {
              valorTotalNum = parseFloat(String(valorTotal).replace(',', '.')) || 0;
            }
          }
      
          // Normalizar valor unitário
          var valorUnitarioNum = 0;
          if (valorUnitario) {
            if (typeof valorUnitario === 'number') {
              valorUnitarioNum = valorUnitario;
            } else {
              valorUnitarioNum = parseFloat(String(valorUnitario).replace(',', '.')) || 0;
            }
          }
      
          // Normalizar quantidade
          var quantidadeNum = 0;
          if (quantidade) {
            if (typeof quantidade === 'number') {
              quantidadeNum = quantidade;
            } else {
              quantidadeNum = parseFloat(String(quantidade).replace(',', '.')) || 0;
            }
          }
      
          // Converter datas para string (objetos Date não são serializáveis)
          var dataEmissaoStr = '';
          if (dataEmissao) {
            if (dataEmissao instanceof Date) {
              dataEmissaoStr = dataEmissao.toISOString();
            } else {
              dataEmissaoStr = String(dataEmissao);
            }
          }
      
          var dataRegistroStr = '';
          if (dataRegistro) {
            if (dataRegistro instanceof Date) {
              dataRegistroStr = dataRegistro.toISOString();
            } else {
              dataRegistroStr = String(dataRegistro);
            }
          }
      
          // Converter ID para string se necessário
          var idStr = '';
          if (id) {
            if (id instanceof Date) {
              idStr = id.toISOString();
            } else {
              idStr = String(id);
            }
          }
      
          var obj = {
            // Campos normalizados (snake_case) - TUDO COMO STRING
            id: idStr,
            numero_nf: String(numeroNF || ''),
            data_emissao: dataEmissaoStr,
            data_emissao_formatada: formatDateToDDMMYYYY(dataEmissao),
            fornecedor: String(fornecedor || ''),
            produto: String(produto || ''),
            quantidade: quantidadeNum,
            unidade: String(unidade || ''),
            valor_unitario: valorUnitarioNum,
            valor_total: valorTotalNum,
            nota_empenho: notaEmpenho && String(notaEmpenho).trim() !== '' ? String(notaEmpenho).trim() : 'N/A',
            status: String(status || 'Pendente'),
            usuario_cadastro: String(registradoPor || ''),
            data_cadastro: dataRegistroStr,
        
            // Campos com nomes alternativos (compatibilidade com frontend)
            Numero_NF: String(numeroNF || ''),
            Fornecedor_Nome: String(fornecedor || ''),
            Produto: String(produto || ''),
            Quantidade: quantidadeNum,
            Unidade: String(unidade || ''),
            Valor_Unitario: valorUnitarioNum,
            Valor_Total: valorTotalNum,
            Status_NF: String(status || 'Pendente'),
            Data_Emissao: dataEmissaoStr,
        
            // Metadados
            rowIndex: i + 1,
            _source: sheet.getName()
          };
      
          results.push(obj);
        }
    
        // Ordenar por data (mais recentes primeiro) - usando strings ISO
        results.sort(function(a, b) {
          var dateA = a.data_cadastro || a.data_emissao || '';
          var dateB = b.data_cadastro || b.data_emissao || '';
          // Comparação de strings ISO funciona para ordenação
          if (dateB > dateA) return 1;
          if (dateB < dateA) return -1;
          return 0;
        });
    
        // Aplicar limite
        if (limit && results.length > limit) {
          results = results.slice(0, limit);
        }
    
        Logger.log('listNotasFiscaisUnificado: ' + results.length + ' registros retornados');
    
        // Garantir que o retorno seja serializável usando JSON
        var retorno = {
          success: true,
          data: results,
          total: results.length
        };
    
        // Testar serialização
        try {
          var teste = JSON.stringify(retorno);
          Logger.log('listNotasFiscaisUnificado: Serialização OK, tamanho: ' + teste.length);
        } catch (serErr) {
          Logger.log('listNotasFiscaisUnificado: ERRO de serialização: ' + serErr.message);
        }
    
        return retorno;
    
      } catch (e) {
        Logger.log('Erro listNotasFiscaisUnificado: ' + e.message + ' - Stack: ' + e.stack);
        return { success: false, error: e.message, data: [] };
      }
    } catch (error) {
      Logger.log("Erro em listNotasFiscaisUnificado: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em listNotasFiscaisUnificado: " + error.message);
    throw error;
  }
}

/**
 * Lista Entregas - API unificada
 */
function listEntregasUnificado(limit) {
  return readSheetNormalized('Entregas', 'ENTREGAS', { limit: limit || 100 });
}

/**
 * Lista Recusas - API unificada
 */
function listRecusasUnificado(limit) {
  return readSheetNormalized('Recusas', 'RECUSAS', { limit: limit || 100 });
}

/**
 * Lista Glosas - API unificada
 */
function listGlosasUnificado(limit) {
  return readSheetNormalized('Glosas', 'GLOSAS', { limit: limit || 100 });
}

/**
 * Lista Alunos com Necessidades Especiais - API unificada
 */
function listAlunosEspeciaisUnificado(limit) {
  return readSheetNormalized('Alunos_Necessidades_Especiais', 'ALUNOS', { limit: limit || 100 });
}

/**
 * Busca laudos vencendo nos próximos N dias
 */
function listLaudosVencendoUnificado(dias) {
  try {
    dias = dias || 30;
    var result = readSheetNormalized('Alunos_Necessidades_Especiais', 'ALUNOS', { limit: 500 });
  
    if (!result.success) return result;
  
    var hoje = new Date();
    var limite = new Date();
    limite.setDate(limite.getDate() + dias);
  
    var vencendo = result.data.filter(function(aluno) {
      if (!aluno.validade_laudo) return false;
      var validade = new Date(aluno.validade_laudo);
      return validade >= hoje && validade <= limite;
    });
  
    return {
      success: true,
      data: vencendo,
      total: vencendo.length
    };
  } catch (error) {
    Logger.log("Erro em listLaudosVencendoUnificado: " + error.message);
    throw error;
  }
}

// ============================================================================
// MÉTRICAS PARA DASHBOARD
// ============================================================================

/**
 * Retorna métricas consolidadas para o dashboard
 */
function getDashboardMetricsUnificado() {
  try {
    var nfs = listNotasFiscaisUnificado(1000);
    var entregas = listEntregasUnificado(1000);
    var recusas = listRecusasUnificado(1000);
    var glosas = listGlosasUnificado(1000);
    
    var totalNFs = nfs.data ? nfs.data.length : 0;
    var totalEntregas = entregas.data ? entregas.data.length : 0;
    var totalRecusas = recusas.data ? recusas.data.length : 0;
    var totalGlosas = glosas.data ? glosas.data.length : 0;
    
    // Contar pendentes (NFs que ainda não foram atestadas/liquidadas)
    var pendentes = 0;
    var problemas = 0;
    
    if (nfs.data) {
      nfs.data.forEach(function(nf) {
        // Garantir que status seja string antes de chamar toUpperCase
        var rawStatus = nf.status || nf.Status_NF || '';
        var status = String(rawStatus).toUpperCase();
        
        // Pendentes = NFs que ainda precisam de ação
        if (status === 'PENDENTE' || status === 'RECEBIDA' || status === 'EM_RECEBIMENTO' || status === 'CONFERIDA') {
          pendentes++;
        }
        // Problemas = NFs com issues
        if (status === 'REJEITADO' || status === 'GLOSADO' || status === 'CANCELADA') {
          problemas++;
        }
      });
    }
    
    problemas += totalRecusas + totalGlosas;
    
    return {
      success: true,
      data: {
        nfs: totalNFs,
        entregas: totalEntregas,
        pendentes: pendentes,
        problemas: problemas,
        recusas: totalRecusas,
        glosas: totalGlosas
      }
    };
    
  } catch (e) {
    Logger.log('Erro getDashboardMetricsUnificado: ' + e.message);
    return { success: false, error: e.message };
  }
}

// ============================================================================
// REGISTRO DO MÓDULO
// ============================================================================

Logger.log('✅ Core_CRUD_Frontend_Bridge carregado - APIs unificadas disponíveis');


// ============================================================================
// ALIASES PARA COMPATIBILIDADE COM CÓDIGO EXISTENTE
// ============================================================================

/**
 * Alias para listNotasFiscais (compatibilidade)
 * @deprecated Use listNotasFiscaisUnificado
 */
function listNotasFiscais(limit) {
  return listNotasFiscaisUnificado(limit);
}

/**
 * Alias para listEntregas (compatibilidade)
 * @deprecated Use listEntregasUnificado
 */
function listEntregas(limit) {
  return listEntregasUnificado(limit);
}

/**
 * Alias para listRecusas (compatibilidade)
 * @deprecated Use listRecusasUnificado
 */
function listRecusas(limit) {
  return listRecusasUnificado(limit);
}

/**
 * Alias para listGlosas (compatibilidade)
 * @deprecated Use listGlosasUnificado
 */
function listGlosas(limit) {
  return listGlosasUnificado(limit);
}

/**
 * Alias para getDashboardMetrics (compatibilidade)
 * @deprecated Use getDashboardMetricsUnificado
 */
function getDashboardMetrics() {
  return getDashboardMetricsUnificado();
}

/**
 * Alias para listarAlunosNecessidadeEspecial (compatibilidade)
 * @deprecated Use listAlunosEspeciaisUnificado
 */
function listarAlunosNecessidadeEspecial(filtros) {
  return listAlunosEspeciaisUnificado(100);
}

/**
 * Alias para listarAlunosLaudoVencendo (compatibilidade)
 * @deprecated Use listLaudosVencendoUnificado
 */
function listarAlunosLaudoVencendo(dias) {
  return listLaudosVencendoUnificado(dias);
}

// ============================================================================
// FUNÇÕES DE CRIAÇÃO UNIFICADAS
// ============================================================================

/**
 * Cria uma nova Nota Fiscal
 * @param {Object} data - Dados da NF
 * @returns {Object} Resultado
 */
function createNotaFiscalUnificado(data) {
  try {
    try {
      try {
        // Validar entrada
        if (!data || typeof data !== 'object') {
          Logger.log('Erro createNotaFiscalUnificado: dados inválidos');
          return { success: false, error: 'Dados da nota fiscal não fornecidos' };
        }
  
        try {
          var ss = _getSpreadsheetRobust();
    
          if (!ss) {
            return { success: false, error: 'Planilha não encontrada' };
          }
    
          // Usar preferencialmente Workflow_NotasFiscais que tem a estrutura completa
          var sheet = ss.getSheetByName('Workflow_NotasFiscais') || ss.getSheetByName('NotasFiscais') || ss.getSheetByName('Notas_Fiscais');
    
          if (!sheet) {
            // Criar sheet com headers completos do workflow
            sheet = ss.insertSheet('Workflow_NotasFiscais');
            var headers = ['ID', 'Data_Criacao', 'Numero', 'Serie', 'Chave_Acesso', 'Data_Emissao', 'CNPJ', 'Fornecedor', 'Produto', 'Quantidade', 'Unidade', 'Valor_Unitario', 'Valor_Total', 'Nota_Empenho', 'Status', 'Usuario'];
            sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
            sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1a73e8').setFontColor('white');
          }
    
          var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
          var now = new Date();
          var id = 'NF_' + now.getTime();
    
          // Log dos dados recebidos
          Logger.log('createNotaFiscalUnificado: Dados recebidos = ' + JSON.stringify(data));
    
          var rowData = headers.map(function(h) {
            var key = String(h).toLowerCase().replace(/[_\s]/g, '');
            switch(key) {
              case 'id': return id;
              case 'datacriacao': return now;
              case 'numero': 
              case 'numeronf': return data.numero || data.numero_nf || data.notaFiscal || '';
              case 'serie': return data.serie || '1';
              case 'chaveacesso': return data.chave_acesso || data.chaveAcesso || '';
              case 'dataemissao': return data.dataEmissao || data.data_emissao || now;
              case 'cnpj': return data.cnpj || '';
              case 'fornecedor': 
              case 'fornecedornome': return data.fornecedor || '';
              case 'produto': return data.produto || '';
              case 'quantidade': return data.quantidade || 0;
              case 'unidade': return data.unidade || 'UN';
              case 'valorunitario': return data.valorUnitario || data.valor_unitario || 0;
              case 'valortotal': return data.valorTotal || data.valor_total || 0;
              case 'notaempenho': return data.notaEmpenho || data.nota_empenho || '';
              case 'status': 
              case 'statusnf': return data.status || 'Recebida';
              case 'usuario': 
              case 'registradopor': return data.usuario || '';
              case 'datacadastro': 
              case 'dataregistro': return now;
              case 'observacoes': return data.observacoes || '';
              default: return '';
            }
          });
    
          sheet.appendRow(rowData);
    
          Logger.log('createNotaFiscalUnificado: NF criada com ID = ' + id);
    
          return {
            success: true,
            id: id,
            message: 'Nota Fiscal criada com sucesso'
          };
    
        } catch (e) {
          Logger.log('Erro createNotaFiscalUnificado: ' + e.message);
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em createNotaFiscalUnificado: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em createNotaFiscalUnificado: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em createNotaFiscalUnificado: " + error.message);
    throw error;
  }
}

/**
 * Cria uma nova Entrega
 */
function createEntregaUnificado(data) {
  try {
    try {
      try {
        // Validar entrada
        if (!data || typeof data !== 'object') {
          Logger.log('Erro createEntregaUnificado: dados inválidos');
          return { success: false, error: 'Dados da entrega não fornecidos' };
        }
  
        try {
          var ss = _getSpreadsheetRobust();
    
          if (!ss) {
            return { success: false, error: 'Planilha não encontrada' };
          }
    
          var sheet = ss.getSheetByName('Entregas');
    
          if (!sheet) {
            sheet = ss.insertSheet('Entregas');
            var headers = ['ID', 'Data_Entrega', 'Unidade_Escolar', 'Fornecedor', 'Produto_Descricao',
                           'Quantidade_Entregue', 'Unidade_Medida', 'Valor_Total', 'Status_Entrega',
                           'Responsavel_Recebimento', 'Observacoes', 'Data_Cadastro'];
            sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
            sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#4a86e8').setFontColor('white');
          }
    
          var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
          var now = new Date();
          var id = 'ENT_' + now.getTime();
    
          var rowData = headers.map(function(h) {
            var key = h.toLowerCase().replace(/[_\s]/g, '');
            switch(key) {
              case 'id': return id;
              case 'dataentrega': return data.data_entrega || data.dataEntrega || now;
              case 'unidadeescolar': return data.unidade_escolar || data.escola || '';
              case 'fornecedor': return data.fornecedor || '';
              case 'produtodescricao': return data.produto || '';
              case 'quantidadeentregue': return data.quantidade || 0;
              case 'unidademedida': return data.unidade || 'UN';
              case 'valortotal': return data.valor_total || 0;
              case 'statusentrega': return data.status || 'ENTREGUE';
              case 'responsavelrecebimento': return data.responsavel || '';
              case 'observacoes': return data.observacoes || '';
              case 'datacadastro': return now;
              default: return '';
            }
          });
    
          sheet.appendRow(rowData);
    
          return {
            success: true,
            id: id,
            message: 'Entrega registrada com sucesso'
          };
    
        } catch (e) {
          Logger.log('Erro createEntregaUnificado: ' + e.message);
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em createEntregaUnificado: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em createEntregaUnificado: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em createEntregaUnificado: " + error.message);
    throw error;
  }
}

/**
 * Cria uma nova Recusa
 */
function createRecusaUnificado(data) {
  try {
    try {
      try {
        // Validar entrada
        if (!data || typeof data !== 'object') {
          Logger.log('Erro createRecusaUnificado: dados inválidos');
          return { success: false, error: 'Dados da recusa não fornecidos' };
        }
  
        try {
          var ss = _getSpreadsheetRobust();
    
          if (!ss) {
            return { success: false, error: 'Planilha não encontrada' };
          }
    
          var sheet = ss.getSheetByName('Recusas');
    
          if (!sheet) {
            sheet = ss.insertSheet('Recusas');
            var headers = ['ID', 'Data_Recusa', 'Unidade_Escolar', 'Fornecedor', 'Produto',
                           'Quantidade_Recusada', 'Motivo', 'Descricao', 'Responsavel', 
                           'Status', 'Data_Cadastro'];
            sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
            sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#4a86e8').setFontColor('white');
          }
    
          var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
          var now = new Date();
          var id = 'REC_' + now.getTime();
    
          var rowData = headers.map(function(h) {
            var key = h.toLowerCase().replace(/[_\s]/g, '');
            switch(key) {
              case 'id': return id;
              case 'datarecusa': return data.data_recusa || now;
              case 'unidadeescolar': return data.escola || '';
              case 'fornecedor': return data.fornecedor || '';
              case 'produto': return data.produto || '';
              case 'quantidaderecusada': return data.quantidade || 0;
              case 'motivo': return data.motivo || '';
              case 'descricao': return data.descricao || '';
              case 'responsavel': return data.responsavel || '';
              case 'status': return 'PENDENTE';
              case 'datacadastro': return now;
              default: return '';
            }
          });
    
          sheet.appendRow(rowData);
    
          return {
            success: true,
            id: id,
            message: 'Recusa registrada com sucesso'
          };
    
        } catch (e) {
          Logger.log('Erro createRecusaUnificado: ' + e.message);
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em createRecusaUnificado: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em createRecusaUnificado: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em createRecusaUnificado: " + error.message);
    throw error;
  }
}

/**
 * Cria uma nova Glosa
 */
function createGlosaUnificado(data) {
  try {
    try {
      try {
        // Validar entrada
        if (!data || typeof data !== 'object') {
          Logger.log('Erro createGlosaUnificado: dados inválidos');
          return { success: false, error: 'Dados da glosa não fornecidos' };
        }
  
        try {
          var ss = _getSpreadsheetRobust();
    
          if (!ss) {
            return { success: false, error: 'Planilha não encontrada' };
          }
    
          var sheet = ss.getSheetByName('Glosas');
    
          if (!sheet) {
            sheet = ss.insertSheet('Glosas');
            var headers = ['ID', 'Nota_Fiscal_ID', 'Data_Glosa', 'Fornecedor', 'Tipo_Glosa',
                           'Motivo', 'Valor_Glosado', 'Responsavel', 'Status', 'Justificativa',
                           'Data_Cadastro'];
            sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
            sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#4a86e8').setFontColor('white');
          }
    
          var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
          var now = new Date();
          var id = 'GLO_' + now.getTime();
    
          var rowData = headers.map(function(h) {
            var key = h.toLowerCase().replace(/[_\s]/g, '');
            switch(key) {
              case 'id': return id;
              case 'notafiscalid': return data.nf_id || '';
              case 'dataglosa': return data.data_glosa || now;
              case 'fornecedor': return data.fornecedor || '';
              case 'tipoglosa': return data.tipo || 'OUTROS';
              case 'motivo': return data.motivo || '';
              case 'valorglosado': return data.valor || 0;
              case 'responsavel': return data.responsavel || '';
              case 'status': return 'APLICADA';
              case 'justificativa': return data.justificativa || '';
              case 'datacadastro': return now;
              default: return '';
            }
          });
    
          sheet.appendRow(rowData);
    
          return {
            success: true,
            id: id,
            message: 'Glosa registrada com sucesso'
          };
    
        } catch (e) {
          Logger.log('Erro createGlosaUnificado: ' + e.message);
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em createGlosaUnificado: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em createGlosaUnificado: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em createGlosaUnificado: " + error.message);
    throw error;
  }
}

// Aliases para criação
function createNotaFiscal(data) { return createNotaFiscalUnificado(data); }
function createEntrega(data) { return createEntregaUnificado(data); }
function createRecusa(data) { return createRecusaUnificado(data); }
function createGlosa(data) { return createGlosaUnificado(data); }

// ============================================================================
// FUNÇÕES DE UPDATE UNIFICADAS
// ============================================================================

/**
 * Atualiza uma Nota Fiscal
 * @param {number} rowIndex - Índice da linha
 * @param {Object} data - Dados atualizados
 * @returns {Object} Resultado
 */
function updateNotaFiscalUnificado(rowIndex, data) {
  return _updateSheetRow('Notas_Fiscais', rowIndex, data);
}

/**
 * Atualiza uma Entrega
 */
function updateEntregaUnificado(rowIndex, data) {
  return _updateSheetRow('Entregas', rowIndex, data);
}

/**
 * Atualiza uma Recusa
 */
function updateRecusaUnificado(rowIndex, data) {
  return _updateSheetRow('Recusas', rowIndex, data);
}

/**
 * Atualiza uma Glosa
 */
function updateGlosaUnificado(rowIndex, data) {
  return _updateSheetRow('Glosas', rowIndex, data);
}

/**
 * Helper genérico para atualizar linha
 * @private
 */
function _updateSheetRow(sheetName, rowIndex, data) {
  try {
    try {
      try {
        try {
          // Validar parâmetros antes de qualquer operação
          if (rowIndex === null || rowIndex === undefined) {
            Logger.log('Erro _updateSheetRow: rowIndex é null ou undefined');
            return { success: false, error: 'Índice de linha não fornecido' };
          }
    
          // Converter para número se necessário
          var rowNum = parseInt(rowIndex, 10);
          if (isNaN(rowNum)) {
            Logger.log('Erro _updateSheetRow: rowIndex não é um número válido: ' + rowIndex);
            return { success: false, error: 'Índice de linha inválido: ' + rowIndex };
          }
    
          var ss = _getSpreadsheetRobust();
    
          if (!ss) {
            return { success: false, error: 'Planilha não encontrada' };
          }
    
          var sheet = ss.getSheetByName(sheetName);
    
          if (!sheet) {
            return { success: false, error: 'Sheet ' + sheetName + ' não encontrada' };
          }

          if (rowNum < 2 || rowNum > sheet.getLastRow()) {
            return { success: false, error: 'Índice de linha fora dos limites: ' + rowNum };
          }
    
          // Usar rowNum a partir daqui
          rowIndex = rowNum;
    
          var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
          var currentRow = sheet.getRange(rowIndex, 1, 1, headers.length).getValues()[0];
    
          // Atualizar campos
          for (var i = 0; i < headers.length; i++) {
            var h = headers[i];
            var key = h.toLowerCase().replace(/[_\s]/g, '');
      
            // Verificar se o campo existe nos dados de atualização
            if (data[h] !== undefined) {
              currentRow[i] = data[h];
            } else if (data[key] !== undefined) {
              currentRow[i] = data[key];
            }
      
            // Atualizar timestamp
            if (key === 'dataatualizacao') {
              currentRow[i] = new Date();
            }
          }
    
          sheet.getRange(rowIndex, 1, 1, headers.length).setValues([currentRow]);
    
          return { success: true, message: 'Registro atualizado com sucesso' };
    
        } catch (e) {
          Logger.log('Erro _updateSheetRow: ' + e.message);
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em _updateSheetRow: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em _updateSheetRow: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em _updateSheetRow: " + error.message);
    throw error;
  }
}

// ============================================================================
// FUNÇÕES DE DELETE UNIFICADAS
// ============================================================================

/**
 * Deleta uma Nota Fiscal
 */
function deleteNotaFiscalUnificado(rowIndex) {
  // Tentar deletar de NotasFiscais primeiro, depois fallback
  var result = _deleteSheetRow('NotasFiscais', rowIndex);
  if (!result.success) {
    result = _deleteSheetRow('Notas_Fiscais', rowIndex);
  }
  return result;
}

/**
 * Deleta uma Entrega
 */
function deleteEntregaUnificado(rowIndex) {
  return _deleteSheetRow('Entregas', rowIndex);
}

/**
 * Deleta uma Recusa
 */
function deleteRecusaUnificado(rowIndex) {
  return _deleteSheetRow('Recusas', rowIndex);
}

/**
 * Deleta uma Glosa
 */
function deleteGlosaUnificado(rowIndex) {
  return _deleteSheetRow('Glosas', rowIndex);
}

/**
 * Helper genérico para deletar linha
 * @private
 */
function _deleteSheetRow(sheetName, rowIndex) {
  try {
    var ss = _getSpreadsheetRobust();
    
    if (!ss) {
      return { success: false, error: 'Planilha não encontrada' };
    }
    
    var sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      return { success: false, error: 'Sheet ' + sheetName + ' não encontrada' };
    }
    
    if (rowIndex < 2 || rowIndex > sheet.getLastRow()) {
      return { success: false, error: 'Índice de linha inválido' };
    }
    
    sheet.deleteRow(rowIndex);
    
    return { success: true, message: 'Registro excluído com sucesso' };
    
  } catch (e) {
    Logger.log('Erro _deleteSheetRow: ' + e.message);
    return { success: false, error: e.message };
  }
}

// Aliases para update (delegam para UI_WebApp que já tem implementação)
// Mantidos para compatibilidade - as funções existem em UI_WebApp.gs
// Se quiser usar as versões Unificadas, descomente abaixo:
// function updateNotaFiscal(rowIndex, data) { return updateNotaFiscalUnificado(rowIndex, data); }
// function updateEntrega(rowIndex, data) { return updateEntregaUnificado(rowIndex, data); }

// Aliases para delete (delegam para UI_WebApp que já tem implementação)
// function deleteNotaFiscal(rowIndex) { return deleteNotaFiscalUnificado(rowIndex); }
// function deleteEntrega(rowIndex) { return deleteEntregaUnificado(rowIndex); }
// function deleteRecusa(rowIndex) { return deleteRecusaUnificado(rowIndex); }
// function deleteGlosa(rowIndex) { return deleteGlosaUnificado(rowIndex); }

// ============================================================================
// REGISTRO FINAL
// ============================================================================

Logger.log('✅ Core_CRUD_Frontend_Bridge: CRUD completo (Create, Read, Update, Delete) disponível');


// ============================================================================
// FUNÇÃO DE DIAGNÓSTICO - CHAMÁVEL DO FRONTEND
// ============================================================================

/**
 * Diagnóstico completo das sheets de NFs - pode ser chamado do frontend
 * @returns {Object} Diagnóstico detalhado
 */
function diagnosticarNotasFiscais() {
  try {
    try {
      var resultado = {
        timestamp: new Date().toISOString(),
        sheets: [],
        sheetsEncontradas: 0,
        totalLinhas: 0,
        problema: null,
        recomendacao: null,
        erro: null
      };
  
      try {
        var ss = _getSpreadsheetRobust();
    
        if (!ss) {
          resultado.erro = 'Não foi possível acessar a planilha. Execute o setup inicial ou verifique as permissões.';
          return resultado;
        }
    
        var allSheets = ss.getSheets();
    
        Logger.log('=== DIAGNÓSTICO DE NOTAS FISCAIS ===');
        Logger.log('Total de abas na planilha: ' + allSheets.length);
    
        // Listar TODAS as abas e seus nomes normalizados
        for (var i = 0; i < allSheets.length; i++) {
          var s = allSheets[i];
          var nome = s.getName();
          var normalizado = nome.toLowerCase().replace(/[^a-z0-9]/g, '');
          var linhas = s.getLastRow();
      
          // Verificar se é candidata a NF
          var ehCandidataNF = (normalizado === 'notasfiscais' || normalizado === 'workflownotasfiscais');
      
          // Verificar se contém 'nota' ou 'nf' no nome
          var contemNota = normalizado.indexOf('nota') >= 0;
          var contemNF = normalizado.indexOf('nf') >= 0;
      
          if (ehCandidataNF || contemNota || contemNF) {
            var info = {
              nome: nome,
              normalizado: normalizado,
              linhas: linhas,
              ehCandidataNF: ehCandidataNF,
              headers: []
            };
        
            if (linhas > 0 && s.getLastColumn() > 0) {
              try {
                info.headers = s.getRange(1, 1, 1, Math.min(s.getLastColumn(), 10)).getValues()[0];
              } catch (e) {
                info.headers = ['Erro ao ler headers'];
              }
            }
        
            resultado.sheets.push(info);
            Logger.log('Aba: "' + nome + '" -> normalizado: "' + normalizado + '" | linhas: ' + linhas + ' | candidata: ' + ehCandidataNF);
        
            if (ehCandidataNF) {
              resultado.sheetsEncontradas = resultado.sheetsEncontradas + 1;
              resultado.totalLinhas = resultado.totalLinhas + Math.max(0, linhas - 1);
            }
          }
        }
    
        // Testar a função listNotasFiscaisUnificado
        Logger.log('');
        Logger.log('Testando listNotasFiscaisUnificado(10)...');
    
        try {
          var testResult = listNotasFiscaisUnificado(10);
      
          if (testResult) {
            resultado.apiTest = {
              success: testResult.success || false,
              dataLength: (testResult.data && testResult.data.length) ? testResult.data.length : 0,
              error: testResult.error || null
            };
        
            if (testResult.data && testResult.data.length > 0) {
              Logger.log('✅ API retornou ' + testResult.data.length + ' registros');
            } else {
              Logger.log('❌ API retornou 0 registros');
            }
          } else {
            resultado.apiTest = {
              success: false,
              dataLength: 0,
              error: 'listNotasFiscaisUnificado retornou null'
            };
          }
        } catch (apiError) {
          resultado.apiTest = {
            success: false,
            dataLength: 0,
            error: 'Erro ao chamar API: ' + apiError.message
          };
        }
    
        // Diagnóstico
        if (resultado.sheetsEncontradas === 0) {
          resultado.problema = 'Nenhuma aba de NFs encontrada';
          resultado.recomendacao = 'Crie uma aba chamada "Workflow_NotasFiscais" ou "Notas_Fiscais"';
        } else if (resultado.totalLinhas === 0) {
          resultado.problema = 'Abas encontradas mas sem dados';
          resultado.recomendacao = 'Adicione dados às abas de NFs';
        } else if (resultado.apiTest && !resultado.apiTest.success) {
          resultado.problema = 'Erro na API: ' + (resultado.apiTest.error || 'desconhecido');
          resultado.recomendacao = 'Verifique os logs do Apps Script';
        } else if (resultado.apiTest && resultado.apiTest.dataLength === 0) {
          resultado.problema = 'API executou mas não retornou dados';
          resultado.recomendacao = 'Verifique se as linhas não estão sendo filtradas';
        }
    
        Logger.log('');
        Logger.log('=== RESULTADO ===');
        Logger.log('Sheets candidatas: ' + resultado.sheetsEncontradas);
        Logger.log('Total linhas de dados: ' + resultado.totalLinhas);
        Logger.log('Problema: ' + (resultado.problema || 'Nenhum'));
    
        return resultado;
    
      } catch (e) {
        Logger.log('ERRO no diagnóstico: ' + e.message);
        resultado.erro = e.message;
        return resultado;
      }
    } catch (error) {
      Logger.log("Erro em diagnosticarNotasFiscais: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em diagnosticarNotasFiscais: " + error.message);
    throw error;
  }
}


// ============================================================================
// FUNÇÃO PARA DETALHES DE NF COM RECEBIMENTOS
// ============================================================================

/**
 * Busca detalhes completos de uma NF incluindo seus recebimentos
 * @param {string} nfId - ID da NF ou rowIndex
 * @returns {Object} Detalhes da NF com recebimentos
 */
function getDetalhesNFCompleto(nfId) {
  try {
    try {
      Logger.log('getDetalhesNFCompleto: Buscando NF ' + nfId);
  
      try {
        var ss = _getSpreadsheetRobust();
        if (!ss) {
          return { success: false, error: 'Planilha não encontrada' };
        }
    
        // Buscar a NF
        var nfSheet = ss.getSheetByName('Workflow_NotasFiscais') || ss.getSheetByName('NotasFiscais') || ss.getSheetByName('Notas_Fiscais');
        if (!nfSheet) {
          return { success: false, error: 'Aba de NFs não encontrada' };
        }
    
        var nfData = nfSheet.getDataRange().getValues();
        var nfHeaders = nfData[0];
        var nf = null;
    
        // Criar mapa de colunas
        var nfColMap = {};
        for (var c = 0; c < nfHeaders.length; c++) {
          nfColMap[String(nfHeaders[c]).toLowerCase().replace(/[_\s]/g, '')] = c;
        }
    
        // Buscar NF por ID ou rowIndex
        for (var i = 1; i < nfData.length; i++) {
          var row = nfData[i];
          var rowId = row[nfColMap['id'] || 0];
      
          // Comparar como string
          if (String(rowId) === String(nfId) || (i + 1) === parseInt(nfId)) {
            nf = {
              id: String(rowId || ''),
              numero: String(row[nfColMap['numero'] || 2] || ''),
              serie: String(row[nfColMap['serie'] || 3] || ''),
              chaveAcesso: String(row[nfColMap['chaveacesso'] || 4] || ''),
              dataEmissao: row[nfColMap['dataemissao'] || 5],
              cnpj: String(row[nfColMap['cnpj'] || 6] || ''),
              fornecedor: String(row[nfColMap['fornecedor'] || 7] || ''),
              produto: String(row[nfColMap['produto'] || 8] || ''),
              quantidade: row[nfColMap['quantidade'] || 9] || 0,
              unidade: String(row[nfColMap['unidade'] || 10] || ''),
              valorUnitario: row[nfColMap['valorunitario'] || 11] || 0,
              valorTotal: row[nfColMap['valortotal'] || 12] || 0,
              notaEmpenho: String(row[nfColMap['notaempenho'] || 13] || ''),
              status: String(row[nfColMap['status'] || 14] || ''),
              rowIndex: i + 1
            };
        
            // Converter datas para string
            if (nf.dataEmissao instanceof Date) {
              nf.dataEmissao = nf.dataEmissao.toISOString();
            }
        
            break;
          }
        }
    
        if (!nf) {
          return { success: false, error: 'NF não encontrada: ' + nfId };
        }
    
        // Buscar recebimentos desta NF
        var recSheet = ss.getSheetByName('Workflow_Recebimentos');
        var recebimentos = [];
    
        if (recSheet && recSheet.getLastRow() > 1) {
          var recData = recSheet.getDataRange().getValues();
          var recHeaders = recData[0];
      
          // Criar mapa de colunas
          var recColMap = {};
          for (var c = 0; c < recHeaders.length; c++) {
            recColMap[String(recHeaders[c]).toLowerCase().replace(/[_\s]/g, '')] = c;
          }
      
          for (var i = 1; i < recData.length; i++) {
            var row = recData[i];
            var recNfId = row[recColMap['nfid'] || 1];
        
            // Verificar se pertence a esta NF
            if (String(recNfId) === String(nf.id)) {
              var rec = {
                id: String(row[recColMap['id'] || 0] || ''),
                escola: String(row[recColMap['escola'] || 3] || ''),
                produto: String(row[recColMap['produto'] || 4] || ''),
                qtdEsperada: row[recColMap['qtdesperada'] || 5] || 0,
                qtdRecebida: row[recColMap['qtdrecebida'] || 6] || 0,
                unidade: String(row[recColMap['unidade'] || 7] || ''),
                valorUnitario: row[recColMap['valorunitario'] || 8] || 0,
                valorParcial: row[recColMap['valorparcial'] || 9] || 0,
                responsavel: String(row[recColMap['responsavel'] || 10] || ''),
                dataRecebimento: row[recColMap['datarecebimento'] || 12],
                embalagemOK: String(row[recColMap['embalagemok'] || 14] || ''),
                validadeOK: String(row[recColMap['validadeok'] || 15] || ''),
                caracteristicasOK: String(row[recColMap['caracteristicasok'] || 16] || ''),
                observacoes: String(row[recColMap['observacoes'] || 18] || ''),
                status: String(row[recColMap['status'] || 19] || '')
              };
          
              // Converter data
              if (rec.dataRecebimento instanceof Date) {
                rec.dataRecebimento = rec.dataRecebimento.toISOString();
              }
          
              recebimentos.push(rec);
            }
          }
        }
    
        // Calcular totais
        var totalRecebido = 0;
        var totalValorRecebido = 0;
        for (var r = 0; r < recebimentos.length; r++) {
          totalRecebido += recebimentos[r].qtdRecebida || 0;
          totalValorRecebido += recebimentos[r].valorParcial || 0;
        }
    
        var resultado = {
          success: true,
          nf: nf,
          recebimentos: recebimentos,
          resumo: {
            qtdNF: nf.quantidade,
            qtdRecebida: totalRecebido,
            qtdPendente: nf.quantidade - totalRecebido,
            valorNF: nf.valorTotal,
            valorRecebido: totalValorRecebido,
            valorPendente: nf.valorTotal - totalValorRecebido,
            percentualRecebido: nf.quantidade > 0 ? Math.round((totalRecebido / nf.quantidade) * 100) : 0,
            totalEscolas: recebimentos.length
          }
        };
    
        Logger.log('getDetalhesNFCompleto: Encontrados ' + recebimentos.length + ' recebimentos');
    
        return resultado;
    
      } catch (e) {
        Logger.log('Erro getDetalhesNFCompleto: ' + e.message);
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em getDetalhesNFCompleto: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em getDetalhesNFCompleto: " + error.message);
    throw error;
  }
}
