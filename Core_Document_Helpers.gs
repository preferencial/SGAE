/**
 * @fileoverview Helpers para Geração de Documentos - Refatoração de God Functions
 * @version 1.0.0
 * @description Funções utilitárias extraídas das god functions de Dominio_Documentos.gs
 * 
 * INTERVENÇÃO 10/16: Refatoração de God Functions
 * - Extração de funções reutilizáveis
 * - Redução de complexidade ciclomática
 * - Melhoria de testabilidade
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-26
 */

'use strict';

var DocumentHelpers = (function() {
  
  // =========================================================================
  // CONFIGURAÇÃO
  // =========================================================================
  
  var CONFIG = {
    TIMEZONE: Session.getScriptTimeZone(),
    DATE_FORMAT: 'dd/MM/yyyy',
    CURRENCY_LOCALE: 'pt-BR'
  };
  
  // =========================================================================
  // BUSCA DE DADOS
  // =========================================================================
  
  /**
   * Busca dados de Notas Fiscais por números
   * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss - Spreadsheet
   * @param {string[]} nfNumbers - Números das NFs
   * @returns {Object} { nfs: Array, valorTotal: number, error: string|null }
   */
  function buscarDadosNFs(ss, nfNumbers) {
    try {
      var nfSheet = ss.getSheetByName('Notas_Fiscais');
      if (!nfSheet) {
        return { nfs: [], valorTotal: 0, error: 'Aba "Notas_Fiscais" não encontrada.' };
      }
    
      var data = nfSheet.getDataRange().getValues();
      var headers = data[0];
    
      var indices = {
        nf: _findHeaderIndex(headers, ['nota fiscal', 'nf-e', 'numero']),
        data: _findHeaderIndex(headers, ['data', 'data emissão']),
        empenho: _findHeaderIndex(headers, ['empenho', 'nota de empenho']),
        valor: _findHeaderIndex(headers, ['valor', 'valor total'])
      };
    
      var nfsEncontradas = [];
      var valorTotal = 0;
    
      for (var i = 1; i < data.length; i++) {
        var nf = String(data[i][indices.nf]).trim();
        if (nfNumbers.indexOf(nf) >= 0) {
          var valor = Number(data[i][indices.valor]) || 0;
          valorTotal += valor;
          nfsEncontradas.push({
            nf: nf,
            data: data[i][indices.data],
            empenho: data[i][indices.empenho],
            valor: valor
          });
        }
      }
    
      return { nfs: nfsEncontradas, valorTotal: valorTotal, error: null };
    } catch (error) {
      Logger.log("Erro em buscarDadosNFs: " + error.message);
      throw error;
    }
  }
  
  /**
   * Busca dados de Glosas por NFs
   * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss - Spreadsheet
   * @param {string[]} nfNumbers - Números das NFs
   * @returns {Object} { totalGlosas: number, glosasPorNF: Object }
   */
  function buscarDadosGlosas(ss, nfNumbers) {
    try {
      try {
        var glosasSheet = ss.getSheetByName('Glosas');
        var totalGlosas = 0;
        var glosasPorNF = {};
    
        if (!glosasSheet || glosasSheet.getLastRow() <= 1) {
          return { totalGlosas: 0, glosasPorNF: {} };
        }
    
        var glosasData = glosasSheet.getDataRange().getValues();
        var glosasHeaders = glosasData[0];
        var glosaNfIdx = glosasHeaders.indexOf('NF');
        var glosaValorIdx = glosasHeaders.indexOf('Valor Total Glosa');
    
        for (var i = 1; i < glosasData.length; i++) {
          var glosaNf = String(glosasData[i][glosaNfIdx]).trim();
          if (nfNumbers.indexOf(glosaNf) >= 0) {
            var glosaValor = Number(glosasData[i][glosaValorIdx]) || 0;
            totalGlosas += glosaValor;
            glosasPorNF[glosaNf] = (glosasPorNF[glosaNf] || 0) + glosaValor;
          }
        }
    
        return { totalGlosas: totalGlosas, glosasPorNF: glosasPorNF };
      } catch (error) {
        Logger.log("Erro em buscarDadosGlosas: " + error.message);
        throw error;
      }
    } catch (error) {
      Logger.log("Erro em buscarDadosGlosas: " + error.message);
      throw error;
    }
  }
  
  /**
   * Busca dados de Recusas por NFs
   * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss - Spreadsheet
   * @param {string[]} nfNumbers - Números das NFs
   * @returns {Object} { houveRecusa: boolean, escolasRecusa: string[] }
   */
  function buscarDadosRecusas(ss, nfNumbers) {
    try {
      try {
        var recusasSheet = ss.getSheetByName('Recusas');
        var houveRecusa = false;
        var escolasRecusa = [];
    
        if (!recusasSheet || recusasSheet.getLastRow() <= 1) {
          return { houveRecusa: false, escolasRecusa: [] };
        }
    
        var recusasData = recusasSheet.getDataRange().getValues();
        var recusasHeaders = recusasData[0];
        var recusaNfIdx = recusasHeaders.indexOf('NF');
        var recusaUnidadeIdx = recusasHeaders.indexOf('Unidade Escolar');
    
        for (var i = 1; i < recusasData.length; i++) {
          var recusaNf = String(recusasData[i][recusaNfIdx]).trim();
          if (nfNumbers.indexOf(recusaNf) >= 0) {
            houveRecusa = true;
            var unidade = recusasData[i][recusaUnidadeIdx];
            if (escolasRecusa.indexOf(unidade) < 0) {
              escolasRecusa.push(unidade);
            }
          }
        }
    
        return { houveRecusa: houveRecusa, escolasRecusa: escolasRecusa };
      } catch (error) {
        Logger.log("Erro em buscarDadosRecusas: " + error.message);
        throw error;
      }
    } catch (error) {
      Logger.log("Erro em buscarDadosRecusas: " + error.message);
      throw error;
    }
  }
  
  // =========================================================================
  // MEMBROS DA COMISSÃO
  // =========================================================================
  
  /**
   * Obtém membros da comissão
   * @returns {Array} Lista de membros
   */
  function getMembrosComissao() {
    try {
      try {
        var comissaoData = PropertiesService.getScriptProperties().getProperty('MEMBROS_COMISSAO');
    
        if (comissaoData) {
          try {
            return JSON.parse(comissaoData);
          } catch (e) {
            // Retorna padrão se JSON inválido
          }
        }
    
        // Membros padrão
        return [
          { nome: 'PATRICIA BENITES SANTOS', cargo: 'TITULAR' },
          { nome: 'MÁRCIA APARECIDA MARTINS DE GODOY', cargo: 'TITULAR' },
          { nome: 'ANTÔNIO CARLOS COSTA DE SOUZA', cargo: 'TITULAR' }
        ];
      } catch (error) {
        Logger.log("Erro em getMembrosComissao: " + error.message);
        throw error;
      }
    } catch (error) {
      Logger.log("Erro em getMembrosComissao: " + error.message);
      throw error;
    }
  }
  
  // =========================================================================
  // FORMATAÇÃO
  // =========================================================================
  
  /**
   * Formata valor como moeda brasileira
   * @param {number} valor - Valor numérico
   * @returns {string} Valor formatado
   */
  function formatarMoeda(valor) {
    try {
      if (typeof valor !== 'number' || isNaN(valor)) {
        return 'R$ 0,00';
      }
      return 'R$ ' + valor.toFixed(2).replace('.', ',');
    } catch (error) {
      Logger.log("Erro em formatarMoeda: " + error.message);
      throw error;
    }
  }
  
  /**
   * Formata data no padrão brasileiro
   * @param {Date|string} data - Data a formatar
   * @returns {string} Data formatada
   */
  function formatarData(data) {
    try {
      if (!data) return '';
    
      var dateObj = data instanceof Date ? data : new Date(data);
      if (isNaN(dateObj.getTime())) return '';
    
      return Utilities.formatDate(dateObj, CONFIG.TIMEZONE, CONFIG.DATE_FORMAT);
    } catch (error) {
      Logger.log("Erro em formatarData: " + error.message);
      throw error;
    }
  }
  
  /**
   * Formata checkbox para documento
   * @param {boolean} marcado - Se está marcado
   * @returns {string} Checkbox formatado
   */
  function formatarCheckbox(marcado) {
    return '( ' + (marcado ? 'X' : ' ') + ' )';
  }
  
  // =========================================================================
  // CABEÇALHO PADRÃO
  // =========================================================================
  
  /**
   * Gera cabeçalho padrão de documento oficial
   * @returns {Array} Linhas do cabeçalho
   */
  function gerarCabecalhoPadrao() {
    return [
      ['GOVERNO DO DISTRITO FEDERAL'],
      ['SECRETARIA DE ESTADO DE EDUCAÇÃO'],
      ['COORDENAÇÃO REGIONAL DE ENSINO DO PLANO PILOTO E CRUZEIRO'],
      ['UNIDADE DE INFRAESTRUTURA, ALIMENTAÇÃO E ATENDIMENTO ESCOLAR - UNIAE'],
      ['']
    ];
  }
  
  /**
   * Gera rodapé padrão de documento oficial
   * @returns {Array} Linhas do rodapé
   */
  function gerarRodapePadrao() {
    return [
      [''],
      ['"Brasília Patrimônio Público da Humanidade"'],
      ['SGAN 607 Norte, Módulo D - Asa Norte - CEP 70297-400 - DF'],
      ['Telefone(s): (61)3318-2680'],
      ['www.se.df.gov.br']
    ];
  }
  
  // =========================================================================
  // CRIAÇÃO DE ABAS
  // =========================================================================
  
  /**
   * Cria aba temporária para documento
   * @param {string} nome - Nome da aba
   * @param {string[]} [headers] - Cabeçalhos opcionais
   * @returns {GoogleAppsScript.Spreadsheet.Sheet}
   */
  function criarAbaDocumento(nome, headers) {
    try {
      var ss = getSS();
    
      // Remove aba existente se houver
      var existente = ss.getSheetByName(nome);
      if (existente) {
        ss.deleteSheet(existente);
      }
    
      var sheet = ss.insertSheet(nome);
    
      if (headers && headers.length > 0) {
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        sheet.getRange(1, 1, 1, headers.length)
          .setFontWeight('bold')
          .setBackground('#2E7D32')
          .setFontColor('white');
        sheet.setFrozenRows(1);
      }
    
      return sheet;
    } catch (error) {
      Logger.log("Erro em criarAbaDocumento: " + error.message);
      throw error; // Re-lança para tratamento superior
    }
  }
  
  /**
   * Aplica formatação padrão de documento
   * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - Aba
   * @param {Object} [options] - Opções de formatação
   */
  function aplicarFormatacaoDocumento(sheet, options) {
    try {
      try {
        options = options || {};
    
        // Larguras de coluna padrão
        var larguras = options.larguras || [150, 120, 150, 120, 100, 200];
        larguras.forEach(function(largura, idx) {
          sheet.setColumnWidth(idx + 1, largura);
        });
    
        // Cabeçalho em negrito e centralizado
        if (options.linhasCabecalho) {
          sheet.getRange(1, 1, options.linhasCabecalho, 1)
            .setFontWeight('bold')
            .setHorizontalAlignment('center');
        }
    
        // Título destacado
        if (options.linhaTitulo) {
          sheet.getRange(options.linhaTitulo, 1)
            .setFontWeight('bold')
            .setFontSize(14)
            .setHorizontalAlignment('center');
        }
      } catch (error) {
        Logger.log("Erro em aplicarFormatacaoDocumento: " + error.message);
        throw error;
      }
    } catch (error) {
      Logger.log("Erro em aplicarFormatacaoDocumento: " + error.message);
      throw error;
    }
  }
  
  // =========================================================================
  // VALIDAÇÃO
  // =========================================================================
  
  /**
   * Valida lista de NFs
   * @param {string} input - Input do usuário
   * @returns {Object} { valid: boolean, nfs: string[], error: string|null }
   */
  function validarInputNFs(input) {
    try {
      if (!input || input.trim() === '') {
        return { valid: false, nfs: [], error: 'Nenhuma NF informada.' };
      }
    
      var nfs = input.split(',').map(function(nf) {
        return nf.trim();
      }).filter(function(nf) {
        return nf !== '';
      });
    
      if (nfs.length === 0) {
        return { valid: false, nfs: [], error: 'Nenhuma NF válida informada.' };
      }
    
      return { valid: true, nfs: nfs, error: null };
    } catch (error) {
      Logger.log("Erro em validarInputNFs: " + error.message);
      throw error;
    }
  }
  
  // =========================================================================
  // API PÚBLICA
  // =========================================================================
  
  return {
    // Busca de dados
    buscarDadosNFs: buscarDadosNFs,
    buscarDadosGlosas: buscarDadosGlosas,
    buscarDadosRecusas: buscarDadosRecusas,
    
    // Comissão
    getMembrosComissao: getMembrosComissao,
    
    // Formatação
    formatarMoeda: formatarMoeda,
    formatarData: formatarData,
    formatarCheckbox: formatarCheckbox,
    
    // Documento
    gerarCabecalhoPadrao: gerarCabecalhoPadrao,
    gerarRodapePadrao: gerarRodapePadrao,
    criarAbaDocumento: criarAbaDocumento,
    aplicarFormatacaoDocumento: aplicarFormatacaoDocumento,
    
    // Validação
    validarInputNFs: validarInputNFs,
    
    // Configuração
    CONFIG: CONFIG
  };
})();

// ============================================================================
// ALIASES GLOBAIS PARA COMPATIBILIDADE
// ============================================================================

/**
 * Busca dados de NFs (alias global)
 */
function buscarDadosNFs(ss, nfNumbers) {
  return DocumentHelpers.buscarDadosNFs(ss, nfNumbers);
}

/**
 * Busca dados de glosas (alias global)
 */
function buscarDadosGlosas(ss, nfNumbers) {
  return DocumentHelpers.buscarDadosGlosas(ss, nfNumbers);
}

/**
 * Busca dados de recusas (alias global)
 */
function buscarDadosRecusas(ss, nfNumbers) {
  return DocumentHelpers.buscarDadosRecusas(ss, nfNumbers);
}

/**
 * Formata valor como moeda (alias global)
 */
function formatarMoedaBR(valor) {
  return DocumentHelpers.formatarMoeda(valor);
}

/**
 * Formata data no padrão BR (alias global)
 */
function formatarDataBR(data) {
  return DocumentHelpers.formatarData(data);
}
