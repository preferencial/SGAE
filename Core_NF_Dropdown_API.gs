/**
 * @fileoverview API Unificada para Dropdowns de Notas Fiscais
 * @version 1.0.0
 * @description Fornece funções otimizadas para popular dropdowns/selects
 * com as últimas 30 NFs em todas as interfaces do sistema.
 * 
 * Integra os 3 workflows:
 * - Fornecedor: Lançamento de NF
 * - Representante Escolar: Recebimento
 * - Analista UNIAE: Validação e Pagamento
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-18
 */

'use strict';

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

var NF_DROPDOWN_CONFIG = {
  /** Quantidade máxima de NFs a retornar */
  MAX_NFS: 30,
  
  /** Nome da sheet de NFs */
  SHEET_NFS: 'Workflow_NotasFiscais',
  
  /** Nome da sheet de Recebimentos */
  SHEET_RECEBIMENTOS: 'Workflow_Recebimentos',
  
  /** Cache TTL em segundos */
  CACHE_TTL: 60
};

// ============================================================================
// API PRINCIPAL PARA DROPDOWNS
// ============================================================================

/**
 * Retorna as últimas 30 NFs formatadas para dropdown
 * Usado em todas as interfaces que precisam listar NFs
 * 
 * @param {Object} [opcoes] - Opções de filtro
 * @param {string} [opcoes.status] - Filtrar por status (ENVIADA, EM_RECEBIMENTO, APROVADO, etc)
 * @param {boolean} [opcoes.apenasComRecebimento] - Apenas NFs com recebimentos
 * @param {boolean} [opcoes.apenasPendentes] - Apenas NFs pendentes de análise
 * @returns {Array} Lista de NFs formatadas para dropdown
 */
function obterNFsParaDropdown(opcoes) {
  try {
    opcoes = opcoes || {};
  
    try {
      var ss = getSS();
      var sheetNF = ss.getSheetByName(NF_DROPDOWN_CONFIG.SHEET_NFS);
    
      if (!sheetNF || sheetNF.getLastRow() <= 1) {
        Logger.log('obterNFsParaDropdown: Nenhuma NF encontrada');
        return [];
      }
    
      var data = sheetNF.getDataRange().getValues();
      var nfs = [];
    
      // Headers: ID[0], Data_Criacao[1], Numero[2], Serie[3], Chave_Acesso[4], Data_Emissao[5],
      //          CNPJ[6], Fornecedor[7], Produto[8], Quantidade[9], Unidade[10], 
      //          Valor_Unitario[11], Valor_Total[12], Nota_Empenho[13], Status[14], Usuario[15]
    
      for (var i = 1; i < data.length; i++) {
        var row = data[i];
        var status = row[14] || 'ENVIADA';
      
        // Aplicar filtros
        if (opcoes.status && status !== opcoes.status) continue;
        if (opcoes.apenasPendentes && ['APROVADO', 'REJEITADO', 'PAGO'].indexOf(status) >= 0) continue;
      
        nfs.push({
          id: row[0],
          numero: row[2],
          serie: row[3],
          chaveAcesso: row[4],
          dataEmissao: row[5],
          cnpj: row[6],
          fornecedor: row[7] || row[6],
          produto: row[8],
          quantidade: row[9],
          unidade: row[10],
          valorUnitario: row[11],
          valorTotal: row[12],
          notaEmpenho: row[13],
          status: status,
          // Campos formatados para exibição
          label: 'NF ' + row[2] + ' - ' + row[8],
          labelCompleto: 'NF ' + row[2] + ' | ' + row[8] + ' | R$ ' + (row[12] || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2}),
          valorFormatado: 'R$ ' + (row[12] || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})
        });
      }
    
      // Ordenar por data de criação (mais recentes primeiro) e limitar
      nfs.reverse();
      nfs = nfs.slice(0, NF_DROPDOWN_CONFIG.MAX_NFS);
    
      // Filtrar por recebimento se necessário
      if (opcoes.apenasComRecebimento) {
        var recebimentos = _obterRecebimentosPorNF();
        nfs = nfs.filter(function(nf) {
          return recebimentos[nf.id] && recebimentos[nf.id].length > 0;
        });
      }
    
      Logger.log('obterNFsParaDropdown: Retornando ' + nfs.length + ' NFs');
      return nfs;
    
    } catch (e) {
      Logger.log('Erro obterNFsParaDropdown: ' + e.message);
      return [];
    }
  } catch (error) {
    Logger.log("Erro em obterNFsParaDropdown: " + error.message);
    throw error;
  }
}

/**
 * Retorna NFs formatadas para o dropdown de Atestar
 * Inclui informações de recebimento e valores calculados
 * 
 * @returns {Array} Lista de NFs para atesto
 */
function obterNFsParaAtestar() {
  try {
    try {
      var nfs = obterNFsParaDropdown({ apenasPendentes: true });
      var recebimentos = _obterRecebimentosPorNF();
    
      return nfs.map(function(nf) {
        var recs = recebimentos[nf.id] || [];
        var totalRecebido = recs.reduce(function(acc, r) { return acc + (r.quantidadeRecebida || 0); }, 0);
        var diferenca = Math.max(0, nf.quantidade - totalRecebido);
        var valorGlosa = diferenca * nf.valorUnitario;
      
        return {
          id: nf.id,
          numero: nf.numero,
          produto: nf.produto,
          fornecedor: nf.fornecedor,
          quantidade: nf.quantidade,
          unidade: nf.unidade,
          valorTotal: nf.valorTotal,
          valorFormatado: nf.valorFormatado,
          status: nf.status,
          // Dados de recebimento
          qtdEscolas: recs.length,
          totalRecebido: totalRecebido,
          diferenca: diferenca,
          valorGlosa: valorGlosa,
          temGlosa: diferenca > 0,
          // Labels para dropdown
          label: nf.label,
          labelCompleto: 'NF ' + nf.numero + ' | ' + nf.produto + ' | ' + recs.length + ' escola(s) | ' + nf.valorFormatado
        };
      });
    
    } catch (e) {
      Logger.log('Erro obterNFsParaAtestar: ' + e.message);
      return [];
    }
  } catch (error) {
    Logger.log("Erro em obterNFsParaAtestar: " + error.message);
    throw error;
  }
}

/**
 * Retorna NFs formatadas para o dropdown de Registrar Entrega
 * Filtra apenas NFs que ainda podem receber entregas
 * 
 * @param {string} [escola] - Nome da escola para verificar se já recebeu
 * @returns {Array} Lista de NFs para entrega
 */
function obterNFsParaEntrega(escola) {
  try {
    try {
      var nfs = obterNFsParaDropdown({ 
        apenasPendentes: true 
      });
    
      var recebimentos = _obterRecebimentosPorNF();
    
      return nfs.map(function(nf) {
        var recs = recebimentos[nf.id] || [];
        var escolasQueReceberam = recs.map(function(r) { return r.escola; });
        var jaRecebeu = escola ? escolasQueReceberam.indexOf(escola) >= 0 : false;
        var totalRecebido = recs.reduce(function(acc, r) { return acc + (r.quantidadeRecebida || 0); }, 0);
      
        return {
          id: nf.id,
          numero: nf.numero,
          produto: nf.produto,
          fornecedor: nf.fornecedor,
          quantidade: nf.quantidade,
          unidade: nf.unidade,
          valorUnitario: nf.valorUnitario,
          valorTotal: nf.valorTotal,
          valorFormatado: nf.valorFormatado,
          status: nf.status,
          // Dados de recebimento
          escolasQueReceberam: escolasQueReceberam,
          totalRecebido: totalRecebido,
          saldoRestante: Math.max(0, nf.quantidade - totalRecebido),
          jaRecebeu: jaRecebeu,
          // Labels para dropdown
          label: nf.label,
          labelCompleto: 'NF ' + nf.numero + ' | ' + nf.produto + ' | Saldo: ' + Math.max(0, nf.quantidade - totalRecebido).toFixed(2) + ' ' + nf.unidade
        };
      }).filter(function(nf) {
        // Remover NFs que a escola já recebeu (se escola informada)
        return !nf.jaRecebeu;
      });
    
    } catch (e) {
      Logger.log('Erro obterNFsParaEntrega: ' + e.message);
      return [];
    }
  } catch (error) {
    Logger.log("Erro em obterNFsParaEntrega: " + error.message);
    throw error;
  }
}

/**
 * Retorna NFs formatadas para o dropdown de Registrar Problema
 * Inclui todas as NFs recentes para registro de recusa/glosa
 * 
 * @returns {Array} Lista de NFs para problema
 */
function obterNFsParaProblema() {
  try {
    try {
      var nfs = obterNFsParaDropdown();
    
      return nfs.map(function(nf) {
        return {
          id: nf.id,
          numero: nf.numero,
          produto: nf.produto,
          fornecedor: nf.fornecedor,
          quantidade: nf.quantidade,
          unidade: nf.unidade,
          valorTotal: nf.valorTotal,
          valorFormatado: nf.valorFormatado,
          status: nf.status,
          // Labels para dropdown
          label: nf.label,
          labelCompleto: 'NF ' + nf.numero + ' | ' + nf.produto + ' | ' + (nf.fornecedor || 'Fornecedor') + ' | ' + nf.valorFormatado
        };
      });
    
    } catch (e) {
      Logger.log('Erro obterNFsParaProblema: ' + e.message);
      return [];
    }
  } catch (error) {
    Logger.log("Erro em obterNFsParaProblema: " + error.message);
    throw error;
  }
}

/**
 * Retorna lista de fornecedores únicos das últimas NFs
 * 
 * @returns {Array} Lista de fornecedores
 */
function obterFornecedoresParaDropdown() {
  try {
    try {
      var nfs = obterNFsParaDropdown();
      var fornecedores = {};
    
      nfs.forEach(function(nf) {
        var nome = nf.fornecedor || nf.cnpj;
        if (nome && !fornecedores[nome]) {
          fornecedores[nome] = {
            nome: nome,
            cnpj: nf.cnpj,
            qtdNFs: 0,
            valorTotal: 0
          };
        }
        if (nome) {
          fornecedores[nome].qtdNFs++;
          fornecedores[nome].valorTotal += nf.valorTotal || 0;
        }
      });
    
      return Object.values(fornecedores).sort(function(a, b) {
        return b.qtdNFs - a.qtdNFs;
      });
    
    } catch (e) {
      Logger.log('Erro obterFornecedoresParaDropdown: ' + e.message);
      return [];
    }
  } catch (error) {
    Logger.log("Erro em obterFornecedoresParaDropdown: " + error.message);
    throw error;
  }
}

// ============================================================================
// FUNÇÕES AUXILIARES PRIVADAS
// ============================================================================

/**
 * Obtém recebimentos agrupados por NF
 * @private
 * @returns {Object} Mapa de NF_ID -> Array de recebimentos
 */
function _obterRecebimentosPorNF() {
  try {
    try {
      try {
        var ss = getSS();
        var sheetRec = ss.getSheetByName(NF_DROPDOWN_CONFIG.SHEET_RECEBIMENTOS);
    
        if (!sheetRec || sheetRec.getLastRow() <= 1) {
          return {};
        }
    
        var data = sheetRec.getDataRange().getValues();
        var recebimentos = {};
    
        // Headers: ID[0], NF_ID[1], NF_Numero[2], Escola[3], Produto[4],
        //          Qtd_Esperada[5], Qtd_Recebida[6], Unidade[7], Valor_Unitario[8],
        //          Valor_Parcial[9], Responsavel[10], Matricula[11], Data_Recebimento[12], ...
    
        for (var i = 1; i < data.length; i++) {
          var row = data[i];
          var nfId = row[1];
      
          if (!recebimentos[nfId]) {
            recebimentos[nfId] = [];
          }
      
          recebimentos[nfId].push({
            id: row[0],
            escola: row[3],
            quantidadeEsperada: row[5],
            quantidadeRecebida: row[6],
            unidade: row[7],
            valorParcial: row[9],
            responsavel: row[10],
            dataRecebimento: row[12],
            status: row[19]
          });
        }
    
        return recebimentos;
    
      } catch (e) {
        Logger.log('Erro _obterRecebimentosPorNF: ' + e.message);
        return {};
      }
    } catch (error) {
      Logger.log("Erro em _obterRecebimentosPorNF: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em _obterRecebimentosPorNF: " + error.message);
    throw error;
  }
}

// ============================================================================
// FUNÇÕES DE ATUALIZAÇÃO (REFRESH)
// ============================================================================

/**
 * Força atualização dos dados de NFs
 * Útil para botões de "Atualizar" nas interfaces
 * 
 * @returns {Object} Resultado com contagens
 */
function atualizarDadosNFs() {
  try {
    // Limpar cache se existir
    if (typeof CacheManager !== 'undefined') {
      CacheManager.Management.clearSheet(NF_DROPDOWN_CONFIG.SHEET_NFS);
      CacheManager.Management.clearSheet(NF_DROPDOWN_CONFIG.SHEET_RECEBIMENTOS);
    }
    
    var nfs = obterNFsParaDropdown();
    var recebimentos = _obterRecebimentosPorNF();
    
    var totalRecebimentos = 0;
    for (var key in recebimentos) {
      totalRecebimentos += recebimentos[key].length;
    }
    
    return {
      success: true,
      totalNFs: nfs.length,
      totalRecebimentos: totalRecebimentos,
      timestamp: new Date().toISOString()
    };
    
  } catch (e) {
    Logger.log('Erro atualizarDadosNFs: ' + e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Busca uma NF específica por ID
 * 
 * @param {string} nfId - ID da NF
 * @returns {Object|null} Dados da NF ou null
 */
function buscarNFPorId(nfId) {
  try {
    try {
      try {
        if (!nfId) return null;
    
        var ss = getSS();
        var sheetNF = ss.getSheetByName(NF_DROPDOWN_CONFIG.SHEET_NFS);
    
        if (!sheetNF || sheetNF.getLastRow() <= 1) return null;
    
        var data = sheetNF.getDataRange().getValues();
    
        for (var i = 1; i < data.length; i++) {
          if (data[i][0] === nfId) {
            var row = data[i];
            return {
              id: row[0],
              numero: row[2],
              serie: row[3],
              chaveAcesso: row[4],
              dataEmissao: row[5],
              cnpj: row[6],
              fornecedor: row[7] || row[6],
              produto: row[8],
              quantidade: row[9],
              unidade: row[10],
              valorUnitario: row[11],
              valorTotal: row[12],
              notaEmpenho: row[13],
              status: row[14]
            };
          }
        }
    
        return null;
    
      } catch (e) {
        Logger.log('Erro buscarNFPorId: ' + e.message);
        return null;
      }
    } catch (error) {
      Logger.log("Erro em buscarNFPorId: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em buscarNFPorId: " + error.message);
    throw error;
  }
}

/**
 * Busca uma NF por número
 * 
 * @param {string} numero - Número da NF
 * @returns {Object|null} Dados da NF ou null
 */
function buscarNFPorNumero(numero) {
  try {
    try {
      try {
        if (!numero) return null;
    
        var ss = getSS();
        var sheetNF = ss.getSheetByName(NF_DROPDOWN_CONFIG.SHEET_NFS);
    
        if (!sheetNF || sheetNF.getLastRow() <= 1) return null;
    
        var data = sheetNF.getDataRange().getValues();
    
        for (var i = 1; i < data.length; i++) {
          if (String(data[i][2]) === String(numero)) {
            var row = data[i];
            return {
              id: row[0],
              numero: row[2],
              serie: row[3],
              chaveAcesso: row[4],
              dataEmissao: row[5],
              cnpj: row[6],
              fornecedor: row[7] || row[6],
              produto: row[8],
              quantidade: row[9],
              unidade: row[10],
              valorUnitario: row[11],
              valorTotal: row[12],
              notaEmpenho: row[13],
              status: row[14]
            };
          }
        }
    
        return null;
    
      } catch (e) {
        Logger.log('Erro buscarNFPorNumero: ' + e.message);
        return null;
      }
    } catch (error) {
      Logger.log("Erro em buscarNFPorNumero: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em buscarNFPorNumero: " + error.message);
    throw error;
  }
}

// ============================================================================
// REGISTRO DO MÓDULO
// ============================================================================

Logger.log('✅ Core_NF_Dropdown_API.gs carregado - API de dropdowns disponível');


// ============================================================================
// FUNÇÕES DE COMPATIBILIDADE PARA INTERFACES EXISTENTES
// ============================================================================

/**
 * Retorna NFs aguardando entrega (para dropdown de Registrar Entrega)
 * Compatível com UI_Dashboard_Intuitivo.html
 * 
 * @returns {Object} Resposta padronizada com lista de NFs
 */
function getNFsAguardandoEntrega() {
  try {
    var nfs = obterNFsParaEntrega();
    
    return {
      success: true,
      data: nfs.map(function(nf) {
        return {
          id: nf.id,
          numero: nf.numero,
          fornecedor: nf.fornecedor,
          produto: nf.produto,
          valor: nf.valorTotal || 0,
          quantidade: nf.quantidade,
          unidade: nf.unidade,
          status: nf.status
        };
      })
    };
    
  } catch (e) {
    Logger.log('Erro getNFsAguardandoEntrega: ' + e.message);
    return { success: false, data: [], message: e.message };
  }
}

/**
 * Retorna NFs prontas para atestar (para dropdown de Atestar)
 * Compatível com UI_Dashboard_Intuitivo.html
 * 
 * @returns {Object} Resposta padronizada com lista de NFs
 */
function getNFsProntasParaAtestar() {
  try {
    try {
      var nfs = obterNFsParaAtestar();
    
      // Filtrar apenas NFs com recebimentos
      var nfsComRecebimento = nfs.filter(function(nf) {
        return nf.qtdEscolas > 0;
      });
    
      return {
        success: true,
        data: nfsComRecebimento.map(function(nf) {
          return {
            id: nf.id,
            numero: nf.numero,
            fornecedor: nf.fornecedor,
            produto: nf.produto,
            valor: nf.valorTotal || 0,
            quantidade: nf.quantidade,
            unidade: nf.unidade,
            qtdEscolas: nf.qtdEscolas,
            totalRecebido: nf.totalRecebido,
            temGlosa: nf.temGlosa,
            valorGlosa: nf.valorGlosa
          };
        })
      };
    
    } catch (e) {
      Logger.log('Erro getNFsProntasParaAtestar: ' + e.message);
      return { success: false, data: [], message: e.message };
    }
  } catch (error) {
    Logger.log("Erro em getNFsProntasParaAtestar: " + error.message);
    throw error;
  }
}

/**
 * Lista todas as NFs (para dropdown de Problema)
 * Compatível com UI_Dashboard_Intuitivo.html
 * 
 * @param {number} [limite] - Limite de NFs (default 30)
 * @returns {Object} Resposta padronizada com lista de NFs
 * @deprecated Use listNotasFiscaisUnificado() do Core_CRUD_Frontend_Bridge.gs
 * Esta função foi renomeada para evitar conflito de nomenclatura
 */
function _listNotasFiscais_Dropdown(limite) {
  try {
    try {
      var nfs = obterNFsParaProblema();
    
      if (limite && limite > 0) {
        nfs = nfs.slice(0, limite);
      }
    
      return {
        success: true,
        data: nfs.map(function(nf) {
          return {
            id: nf.id,
            numero: nf.numero,
            fornecedor: nf.fornecedor,
            produto: nf.produto,
            valor: nf.valorTotal || 0,
            status: nf.status
          };
        })
      };
    
    } catch (e) {
      Logger.log('Erro _listNotasFiscais_Dropdown: ' + e.message);
      return { success: false, data: [], message: e.message };
    }
  } catch (error) {
    Logger.log("Erro em _listNotasFiscais_Dropdown: " + error.message);
    throw error;
  }
}

/**
 * Lista fornecedores ativos (para datalist)
 * 
 * @returns {Object} Resposta padronizada com lista de fornecedores
 */
function listarFornecedoresAtivos() {
  try {
    try {
      var fornecedores = obterFornecedoresParaDropdown();
    
      return {
        success: true,
        data: fornecedores.map(function(f) {
          return {
            nome: f.nome,
            cnpj: f.cnpj,
            qtdNFs: f.qtdNFs
          };
        })
      };
    
    } catch (e) {
      Logger.log('Erro listarFornecedoresAtivos: ' + e.message);
      return { success: false, data: [], message: e.message };
    }
  } catch (error) {
    Logger.log("Erro em listarFornecedoresAtivos: " + error.message);
    throw error;
  }
}

/**
 * Lista escolas ativas (para datalist)
 * 
 * @returns {Object} Resposta padronizada com lista de escolas
 */
function listarEscolasAtivas() {
  try {
    try {
      // Usar função existente se disponível
      if (typeof listarEscolasDisponiveis === 'function') {
        var escolas = listarEscolasDisponiveis();
        return {
          success: true,
          data: escolas.map(function(e) {
            return { nome: e };
          })
        };
      }
    
      // Fallback para lista padrão
      var escolasPadrao = [
        'EC 01 Plano Piloto',
        'EC 02 Plano Piloto',
        'EC 03 Plano Piloto',
        'EC 04 Cruzeiro',
        'EC 05 Cruzeiro',
        'CEF 01 Plano Piloto',
        'CEF 02 Plano Piloto',
        'CEF 01 Cruzeiro',
        'CED 01 Plano Piloto',
        'CED 02 Cruzeiro'
      ];
    
      return {
        success: true,
        data: escolasPadrao.map(function(e) {
          return { nome: e };
        })
      };
    
    } catch (e) {
      Logger.log('Erro listarEscolasAtivas: ' + e.message);
      return { success: false, data: [], message: e.message };
    }
  } catch (error) {
    Logger.log("Erro em listarEscolasAtivas: " + error.message);
    throw error;
  }
}

// ============================================================================
// FUNÇÕES DE AÇÃO SIMPLIFICADAS
// ============================================================================

/**
 * Registra entrega de forma simplificada
 * 
 * @param {Object} dados - Dados da entrega
 * @returns {Object} Resultado da operação
 */
function registrarEntregaSimplificada(dados) {
  try {
    try {
      if (!dados.notaFiscalId) {
        return { success: false, message: 'Selecione uma NF' };
      }
      if (!dados.unidadeEscolar) {
        return { success: false, message: 'Informe a escola' };
      }
    
      // Buscar dados da NF
      var nf = buscarNFPorId(dados.notaFiscalId);
      if (!nf) {
        return { success: false, message: 'NF não encontrada' };
      }
    
      // Usar função de recebimento existente se disponível
      if (typeof salvarRecebimento === 'function') {
        var resultado = salvarRecebimento({
          nfId: dados.notaFiscalId,
          nfNumero: nf.numero,
          escola: dados.unidadeEscolar,
          produto: nf.produto,
          quantidadeEsperada: nf.quantidade,
          quantidadeRecebida: dados.conforme ? nf.quantidade : 0,
          unidade: nf.unidade,
          valorUnitario: nf.valorUnitario,
          responsavel: Session.getActiveUser().getEmail(),
          matricula: 'AUTO',
          dataRecebimento: dados.dataEntrega || new Date().toISOString().split('T')[0],
          horaRecebimento: new Date().toTimeString().slice(0, 5),
          embalagemOk: dados.conforme,
          validadeOk: dados.conforme,
          caracteristicasOk: dados.conforme,
          observacoes: dados.observacoes || ''
        });
      
        return {
          success: resultado.success,
          message: resultado.success ? 'Entrega registrada com sucesso!' : resultado.error,
          id: resultado.id
        };
      }
    
      return { success: false, message: 'Função de recebimento não disponível' };
    
    } catch (e) {
      Logger.log('Erro registrarEntregaSimplificada: ' + e.message);
      return { success: false, message: e.message };
    }
  } catch (error) {
    Logger.log("Erro em registrarEntregaSimplificada: " + error.message);
    throw error;
  }
}

/**
 * Atesta NFs em lote
 * 
 * @param {Array} ids - IDs das NFs a atestar
 * @returns {Object} Resultado da operação
 */
function atestarNFsEmLote(ids) {
  try {
    try {
      if (!ids || ids.length === 0) {
        return { success: false, message: 'Nenhuma NF selecionada' };
      }
    
      var atestadas = 0;
      var erros = [];
    
      ids.forEach(function(nfId) {
        try {
          // Buscar dados da NF
          var nf = buscarNFPorId(nfId);
          if (!nf) {
            erros.push('NF ' + nfId + ' não encontrada');
            return;
          }
        
          // Usar função de análise existente se disponível
          if (typeof salvarAnalise === 'function') {
            var nfsAnalise = listarNFsParaAnalise();
            var nfCompleta = nfsAnalise.find(function(n) { return n.id === nfId; });
          
            if (nfCompleta) {
              var resultado = salvarAnalise({
                nfId: nfId,
                nfNumero: nf.numero,
                fornecedor: nf.fornecedor,
                produto: nf.produto,
                quantidadeNF: nf.quantidade,
                quantidadeRecebida: nfCompleta.totalRecebido || nf.quantidade,
                unidade: nf.unidade,
                valorUnitario: nf.valorUnitario,
                valorNF: nf.valorTotal,
                valorGlosa: nfCompleta.valorGlosaCalculado || 0,
                valorAprovado: nfCompleta.valorAprovadoCalculado || nf.valorTotal,
                membrosComissao: ['Sistema Automático', 'Atesto em Lote', 'UNIAE'],
                decisao: (nfCompleta.valorGlosaCalculado || 0) > 0 ? 'APROVADO_PARCIAL' : 'APROVADO_TOTAL',
                justificativa: 'Atesto em lote via dashboard'
              });
            
              if (resultado.success) {
                atestadas++;
              } else {
                erros.push('NF ' + nf.numero + ': ' + resultado.error);
              }
            } else {
              // Atesto direto sem recebimentos
              atualizarStatusNF(nfId, 'APROVADO');
              atestadas++;
            }
          } else {
            // Fallback: apenas atualizar status
            atualizarStatusNF(nfId, 'APROVADO');
            atestadas++;
          }
        
        } catch (err) {
          erros.push('NF ' + nfId + ': ' + err.message);
        }
      });
    
      return {
        success: atestadas > 0,
        message: atestadas + ' NF(s) atestada(s)' + (erros.length > 0 ? '. Erros: ' + erros.length : ''),
        atestadas: atestadas,
        erros: erros
      };
    
    } catch (e) {
      Logger.log('Erro atestarNFsEmLote: ' + e.message);
      return { success: false, message: e.message };
    }
  } catch (error) {
    Logger.log("Erro em atestarNFsEmLote: " + error.message);
    throw error;
  }
}

/**
 * Registra recusa de forma simplificada
 * 
 * @param {Object} dados - Dados da recusa
 * @returns {Object} Resultado da operação
 */
function registrarRecusaSimplificada(dados) {
  try {
    if (!dados.notaFiscalId) {
      return { success: false, message: 'Selecione uma NF' };
    }
    
    var nf = buscarNFPorId(dados.notaFiscalId);
    if (!nf) {
      return { success: false, message: 'NF não encontrada' };
    }
    
    // Atualizar status da NF para REJEITADO
    atualizarStatusNF(dados.notaFiscalId, 'REJEITADO');
    
    // Registrar na auditoria se disponível
    if (typeof registrarAuditoria === 'function') {
      registrarAuditoria({
        acao: 'RECUSA_NF',
        entidade: 'NotaFiscal',
        entidadeId: dados.notaFiscalId,
        detalhes: {
          motivo: dados.motivo,
          observacoes: dados.observacoes
        }
      });
    }
    
    return {
      success: true,
      message: 'Recusa registrada para NF ' + nf.numero
    };
    
  } catch (e) {
    Logger.log('Erro registrarRecusaSimplificada: ' + e.message);
    return { success: false, message: e.message };
  }
}

/**
 * Registra glosa de forma simplificada
 * 
 * @param {Object} dados - Dados da glosa
 * @returns {Object} Resultado da operação
 */
function registrarGlosaSimplificada(dados) {
  try {
    if (!dados.notaFiscalId) {
      return { success: false, message: 'Selecione uma NF' };
    }
    
    var nf = buscarNFPorId(dados.notaFiscalId);
    if (!nf) {
      return { success: false, message: 'NF não encontrada' };
    }
    
    // Usar função de análise existente se disponível
    if (typeof salvarAnalise === 'function') {
      var valorGlosa = dados.valorGlosa || 0;
      var valorAprovado = nf.valorTotal - valorGlosa;
      
      var resultado = salvarAnalise({
        nfId: dados.notaFiscalId,
        nfNumero: nf.numero,
        fornecedor: nf.fornecedor,
        produto: nf.produto,
        quantidadeNF: nf.quantidade,
        quantidadeRecebida: nf.quantidade - (valorGlosa / nf.valorUnitario),
        unidade: nf.unidade,
        valorUnitario: nf.valorUnitario,
        valorNF: nf.valorTotal,
        valorGlosa: valorGlosa,
        valorAprovado: valorAprovado,
        membrosComissao: ['Sistema', 'Glosa Manual', 'UNIAE'],
        decisao: 'GLOSADO',
        justificativa: dados.motivo + (dados.observacoes ? ' - ' + dados.observacoes : '')
      });
      
      return {
        success: resultado.success,
        message: resultado.success ? 'Glosa de R$ ' + valorGlosa.toFixed(2) + ' registrada' : resultado.error
      };
    }
    
    // Fallback: apenas atualizar status
    atualizarStatusNF(dados.notaFiscalId, 'GLOSADO');
    
    return {
      success: true,
      message: 'Glosa registrada para NF ' + nf.numero
    };
    
  } catch (e) {
    Logger.log('Erro registrarGlosaSimplificada: ' + e.message);
    return { success: false, message: e.message };
  }
}

// ============================================================================
// FUNÇÃO DE ATUALIZAÇÃO DE STATUS (se não existir)
// ============================================================================

if (typeof atualizarStatusNF !== 'function') {
  /**
   * Atualiza status de uma NF
   * @param {string} nfId - ID da NF
   * @param {string} novoStatus - Novo status
   */
  function atualizarStatusNF(nfId, novoStatus) {
    try {
      try {
        var ss = getSS();
        var sheet = ss.getSheetByName(NF_DROPDOWN_CONFIG.SHEET_NFS);
        if (!sheet) return;
      
        var data = sheet.getDataRange().getValues();
        for (var i = 1; i < data.length; i++) {
          if (data[i][0] === nfId) {
            sheet.getRange(i + 1, 15).setValue(novoStatus); // Coluna Status
            Logger.log('Status da NF ' + nfId + ' atualizado para ' + novoStatus);
            break;
          }
        }
      } catch (e) {
        Logger.log('Erro atualizarStatusNF: ' + e.message);
      }
    } catch (error) {
      Logger.log("Erro em atualizarStatusNF: " + error.message);
      throw error;
    }
  }
}

Logger.log('✅ Funções de compatibilidade para dropdowns carregadas');
