/**
 * @fileoverview Gerenciamento de Processos SEI
 * @version 5.0.0
 *
 * Backend para inserção e gerenciamento de números de processo SEI.
 * O número do processo SEI é criado no próprio sistema SEI e inserido
 * manualmente por um analista da UNIAE neste sistema.
 *
 * @author UNIAE CRE Team
 * @created 2025-12-04
 */

'use strict';

/**
 * Configurações de Processo SEI
 */
var PROCESSO_SEI_CONFIG = {
  // Padrão de número de processo SEI do GDF
  // Formato: 00000-00000000/AAAA-00 ou similar
  REGEX_PROCESSO: /^\d{5}-\d{8}\/\d{4}-\d{2}$/,

  // Formato alternativo aceito
  REGEX_ALTERNATIVO: /^\d{5}\.\d{6}\/\d{4}-\d{2}$/,

  // Status possíveis do processo
  STATUS: {
    ABERTO: 'ABERTO',
    EM_ANALISE: 'EM_ANALISE',
    ATESTADO: 'ATESTADO',
    LIQUIDADO: 'LIQUIDADO',
    PAGO: 'PAGO',
    CANCELADO: 'CANCELADO'
  }
};

// ============================================================================
// FUNÇÕES DE CRUD - PROCESSO SEI
// ============================================================================

/**
 * Cria um novo processo de atesto
 * @param {Object} dados - Dados do processo
 * @param {string} dados.numeroProcessoSEI - Número do processo SEI (obrigatório)
 * @param {Array} [dados.notasFiscaisIds] - IDs das notas fiscais vinculadas
 * @param {string} [dados.observacoes] - Observações
 * @returns {Object} Resultado da operação
 */
function criarProcessoAtesto(dados) {
  try {
    try {
      try {
        try {
          // Validações
          if (!dados || !dados.numeroProcessoSEI) {
            return { success: false, error: 'Número do processo SEI é obrigatório' };
          }

          // Valida formato do número
          var validacao = validarNumeroProcessoSEI(dados.numeroProcessoSEI);
          if (!validacao.valido) {
            return { success: false, error: validacao.erro };
          }

          // Verifica se já existe
          var existente = buscarProcessoPorNumeroSEI(dados.numeroProcessoSEI);
          if (existente) {
            return { success: false, error: 'Processo SEI já cadastrado no sistema', processoExistente: existente };
          }

          // Verifica permissão
          if (!authHasPermission('write', 'Processos_Atesto')) {
            return { success: false, error: 'Sem permissão para criar processos' };
          }

          // Obtém sessão para registrar responsável
          var session = authGetSession();
          var responsavel = session ? session.email : 'Sistema';

          // Calcula valor total das NFs vinculadas
          var valorTotal = 0;
          if (dados.notasFiscaisIds && dados.notasFiscaisIds.length > 0) {
            valorTotal = _calcularValorTotalNFs(dados.notasFiscaisIds);
          }

          // Prepara dados do processo
          var processo = {
            ID: generateUniqueId('PROC'),
            Numero_Processo_SEI: dados.numeroProcessoSEI.trim().toUpperCase(),
            Data_Abertura: new Date(),
            Status: PROCESSO_SEI_CONFIG.STATUS.ABERTO,
            Notas_Fiscais_IDs: dados.notasFiscaisIds ? dados.notasFiscaisIds.join(',') : '',
            Valor_Total: valorTotal,
            Responsavel_UNIAE: responsavel,
            Data_Atesto: '',
            Observacoes: dados.observacoes || '',
            Data_Criacao: new Date(),
            Data_Atualizacao: new Date()
          };

          // Salva na planilha
          var sheet = getSheet('Processos_Atesto', true);
          var headers = getSheetHeaders('Processos_Atesto');

          var row = headers.map(function(h) {
            return processo[h] !== undefined ? processo[h] : '';
          });

          sheet.appendRow(row);

          // Atualiza as NFs vinculadas
          if (dados.notasFiscaisIds && dados.notasFiscaisIds.length > 0) {
            _vincularNFsAoProcesso(dados.notasFiscaisIds, processo.ID);
          }

          // Registra auditoria
          _registrarAuditoriaProcesso('PROCESSO_CRIADO', processo);

          // Envia notificação por email
          if (session && session.email) {
            notificarProcessoSEI(processo, session.email);
          }

          AppLogger.log('Processo SEI criado: ' + processo.Numero_Processo_SEI);

          return {
            success: true,
            message: 'Processo criado com sucesso',
            processo: processo
          };

        } catch (e) {
          AppLogger.error('Erro ao criar processo', e);
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em criarProcessoAtesto: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em criarProcessoAtesto: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em criarProcessoAtesto: " + error.message);
    throw error;
  }
}

/**
 * Busca processo por número SEI
 * @param {string} numeroSEI - Número do processo SEI
 * @returns {Object|null} Processo encontrado ou null
 */
function buscarProcessoPorNumeroSEI(numeroSEI) {
  try {
    try {
      try {
        if (!numeroSEI) return null;

        var sheet = getSheet('Processos_Atesto');
        var data = sheet.getDataRange().getValues();
        var headers = data[0];

        var colNumero = headers.indexOf('Numero_Processo_SEI');
        if (colNumero === -1) return null;

        var numeroNormalizado = numeroSEI.trim().toUpperCase();

        for (var i = 1; i < data.length; i++) {
          if (data[i][colNumero] && data[i][colNumero].toString().toUpperCase() === numeroNormalizado) {
            var processo = {};
            headers.forEach(function(h, idx) {
              processo[h] = data[i][idx];
            });
            processo.rowIndex = i + 1;
            return processo;
          }
        }

        return null;
      } catch (e) {
        AppLogger.error('Erro ao buscar processo', e);
        return null;
      }
    } catch (error) {
      Logger.log("Erro em buscarProcessoPorNumeroSEI: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em buscarProcessoPorNumeroSEI: " + error.message);
    throw error;
  }
}

/**
 * Busca processo por ID
 * @param {string} processoId - ID do processo
 * @returns {Object|null} Processo encontrado ou null
 */
function buscarProcessoPorId(processoId) {
  try {
    try {
      try {
        if (!processoId) return null;

        var sheet = getSheet('Processos_Atesto');
        var data = sheet.getDataRange().getValues();
        var headers = data[0];

        var colId = headers.indexOf('ID');
        if (colId === -1) colId = 0;

        for (var i = 1; i < data.length; i++) {
          if (data[i][colId] === processoId) {
            var processo = {};
            headers.forEach(function(h, idx) {
              processo[h] = data[i][idx];
            });
            processo.rowIndex = i + 1;
            return processo;
          }
        }

        return null;
      } catch (e) {
        AppLogger.error('Erro ao buscar processo por ID', e);
        return null;
      }
    } catch (error) {
      Logger.log("Erro em buscarProcessoPorId: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em buscarProcessoPorId: " + error.message);
    throw error;
  }
}

/**
 * Lista todos os processos
 * @param {Object} [filtros] - Filtros opcionais
 * @param {string} [filtros.status] - Filtrar por status
 * @param {Date} [filtros.dataInicio] - Data inicial
 * @param {Date} [filtros.dataFim] - Data final
 * @returns {Object} Lista de processos
 */
function listarProcessos(filtros) {
  try {
    try {
      filtros = filtros || {};

      var dados = getSheetData('Processos_Atesto');

      // Aplica filtros
      if (filtros.status) {
        dados = dados.filter(function(p) {
          return p.Status === filtros.status;
        });
      }

      if (filtros.dataInicio) {
        var inicio = new Date(filtros.dataInicio);
        dados = dados.filter(function(p) {
          return new Date(p.Data_Abertura) >= inicio;
        });
      }

      if (filtros.dataFim) {
        var fim = new Date(filtros.dataFim);
        dados = dados.filter(function(p) {
          return new Date(p.Data_Abertura) <= fim;
        });
      }

      // Ordena por data (mais recente primeiro)
      dados.sort(function(a, b) {
        return new Date(b.Data_Abertura) - new Date(a.Data_Abertura);
      });

      return {
        success: true,
        data: dados,
        total: dados.length
      };

    } catch (e) {
      AppLogger.error('Erro ao listar processos', e);
      return { success: false, error: e.message };
    }
  } catch (error) {
    Logger.log("Erro em listarProcessos: " + error.message);
    throw error;
  }
}

/**
 * Atualiza processo existente
 * @param {string} processoId - ID do processo
 * @param {Object} dados - Dados a atualizar
 * @returns {Object} Resultado da operação
 */
function atualizarProcesso(processoId, dados) {
  try {
    try {
      if (!processoId) {
        return { success: false, error: 'ID do processo é obrigatório' };
      }

      var processo = buscarProcessoPorId(processoId);
      if (!processo) {
        return { success: false, error: 'Processo não encontrado' };
      }

      // Verifica permissão
      if (!authHasPermission('write', 'Processos_Atesto')) {
        return { success: false, error: 'Sem permissão para atualizar processos' };
      }

      // Atualiza campos permitidos
      var camposPermitidos = ['Status', 'Observacoes', 'Notas_Fiscais_IDs', 'Data_Atesto'];
      var dadosAnteriores = JSON.stringify(processo);

      camposPermitidos.forEach(function(campo) {
        if (dados[campo] !== undefined) {
          processo[campo] = dados[campo];
        }
      });

      processo.Data_Atualizacao = new Date();

      // Recalcula valor total se NFs mudaram
      if (dados.Notas_Fiscais_IDs) {
        var nfIds = dados.Notas_Fiscais_IDs.split(',').filter(function(id) { return id; });
        processo.Valor_Total = _calcularValorTotalNFs(nfIds);
      }

      // Salva na planilha
      updateSheetRow('Processos_Atesto', processo.rowIndex, processo);

      // Registra auditoria
      _registrarAuditoriaProcesso('PROCESSO_ATUALIZADO', processo, dadosAnteriores);

      AppLogger.log('Processo atualizado: ' + processo.Numero_Processo_SEI);

      return {
        success: true,
        message: 'Processo atualizado com sucesso',
        processo: processo
      };

    } catch (e) {
      AppLogger.error('Erro ao atualizar processo', e);
      return { success: false, error: e.message };
    }
  } catch (error) {
    Logger.log("Erro em atualizarProcesso: " + error.message);
    throw error;
  }
}

/**
 * Vincula notas fiscais a um processo
 * @param {string} processoId - ID do processo
 * @param {Array} notasFiscaisIds - IDs das notas fiscais
 * @returns {Object} Resultado da operação
 */
function vincularNFsAoProcesso(processoId, notasFiscaisIds) {
  try {
    if (!processoId || !notasFiscaisIds || notasFiscaisIds.length === 0) {
      return { success: false, error: 'Processo e notas fiscais são obrigatórios' };
    }

    var processo = buscarProcessoPorId(processoId);
    if (!processo) {
      return { success: false, error: 'Processo não encontrado' };
    }

    // Adiciona novas NFs às existentes
    var nfsAtuais = processo.Notas_Fiscais_IDs ? processo.Notas_Fiscais_IDs.split(',') : [];
    var nfsNovas = notasFiscaisIds.filter(function(id) {
      return nfsAtuais.indexOf(id) === -1;
    });

    var todasNFs = nfsAtuais.concat(nfsNovas).filter(function(id) { return id; });

    return atualizarProcesso(processoId, {
      Notas_Fiscais_IDs: todasNFs.join(',')
    });

  } catch (e) {
    AppLogger.error('Erro ao vincular NFs', e);
    return { success: false, error: e.message };
  }
}

// ============================================================================
// VALIDAÇÕES
// ============================================================================

/**
 * Valida formato do número de processo SEI
 * @param {string} numero - Número do processo
 * @returns {Object} Resultado da validação
 */
function validarNumeroProcessoSEI(numero) {
  try {
    if (!numero) {
      return { valido: false, erro: 'Número do processo é obrigatório' };
    }

    var numeroLimpo = numero.trim();

    // Verifica se está vazio
    if (numeroLimpo.length === 0) {
      return { valido: false, erro: 'Número do processo não pode estar vazio' };
    }

    // Verifica tamanho mínimo
    if (numeroLimpo.length < 10) {
      return { valido: false, erro: 'Número do processo muito curto' };
    }

    // Verifica formato padrão SEI-GDF
    if (PROCESSO_SEI_CONFIG.REGEX_PROCESSO.test(numeroLimpo)) {
      return { valido: true, formato: 'SEI-GDF' };
    }

    // Verifica formato alternativo
    if (PROCESSO_SEI_CONFIG.REGEX_ALTERNATIVO.test(numeroLimpo)) {
      return { valido: true, formato: 'ALTERNATIVO' };
    }

    // Aceita outros formatos com aviso
    if (/^\d{5,}[\.\-\/]\d+/.test(numeroLimpo)) {
      return {
        valido: true,
        formato: 'OUTRO',
        aviso: 'Formato não padrão, mas aceito'
      };
    }

    return {
      valido: false,
      erro: 'Formato inválido. Use o formato: 00000-00000000/AAAA-00'
    };
  } catch (error) {
    Logger.log("Erro em validarNumeroProcessoSEI: " + error.message);
    throw error;
  }
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Calcula valor total das NFs
 * @private
 */
function _calcularValorTotalNFs(nfIds) {
  try {
    try {
      if (!nfIds || nfIds.length === 0) return 0;

      var sheet = getSheet('Notas_Fiscais');
      var data = sheet.getDataRange().getValues();
      var headers = data[0];

      var colId = headers.indexOf('ID');
      var colValor = headers.indexOf('Valor_Total');

      if (colId === -1) colId = 0;
      if (colValor === -1) return 0;

      var total = 0;
      for (var i = 1; i < data.length; i++) {
        if (nfIds.indexOf(data[i][colId]) !== -1) {
          var valor = parseFloat(data[i][colValor]) || 0;
          total += valor;
        }
      }

      return total;
    } catch (e) {
      return 0;
    }
  } catch (error) {
    Logger.log("Erro em _calcularValorTotalNFs: " + error.message);
    throw error;
  }
}

/**
 * Vincula NFs ao processo (atualiza coluna Processo_Atesto_ID nas NFs)
 * @private
 */
function _vincularNFsAoProcesso(nfIds, processoId) {
  try {
    try {
      var sheet = getSheet('Notas_Fiscais');
      var data = sheet.getDataRange().getValues();
      var headers = data[0];

      var colId = headers.indexOf('ID');
      var colProcesso = headers.indexOf('Processo_Atesto_ID');

      if (colId === -1 || colProcesso === -1) return;

      for (var i = 1; i < data.length; i++) {
        if (nfIds.indexOf(data[i][colId]) !== -1) {
          sheet.getRange(i + 1, colProcesso + 1).setValue(processoId);
        }
      }
    } catch (e) {
      AppLogger.warn('Erro ao vincular NFs ao processo', e);
    }
  } catch (error) {
    Logger.log("Erro em _vincularNFsAoProcesso: " + error.message);
    throw error;
  }
}

/**
 * Registra auditoria de processo
 * @private
 */
function _registrarAuditoriaProcesso(acao, processo, dadosAnteriores) {
  try {
    try {
      var session = authGetSession();

      var registro = {
        ID: generateUniqueId('AUD'),
        Data_Hora: new Date(),
        Usuario: session ? session.email : 'Sistema',
        Acao: acao,
        Tabela: 'Processos_Atesto',
        Registro_ID: processo.ID,
        Dados_Anteriores: dadosAnteriores || '',
        Dados_Novos: JSON.stringify(processo),
        IP: ''
      };

      appendToSheet('Auditoria_Log', registro);
    } catch (e) {
      // Ignora erros de auditoria
    }
  } catch (error) {
    Logger.log("Erro em _registrarAuditoriaProcesso: " + error.message);
    throw error;
  }
}

// ============================================================================
// API PARA FRONTEND
// ============================================================================

/**
 * API: Criar processo (chamada do frontend)
 */
function api_criarProcessoSEI(dados) {
  return criarProcessoAtesto(dados);
}

/**
 * API: Buscar processo por número SEI
 */
function api_buscarProcessoSEI(numeroSEI) {
  var processo = buscarProcessoPorNumeroSEI(numeroSEI);
  return {
    success: !!processo,
    processo: processo
  };
}

/**
 * API: Listar processos
 */
function api_listarProcessos(filtros) {
  return listarProcessos(filtros);
}

/**
 * API: Atualizar processo
 */
function api_atualizarProcesso(processoId, dados) {
  return atualizarProcesso(processoId, dados);
}

/**
 * API: Validar número SEI
 */
function api_validarNumeroSEI(numero) {
  return validarNumeroProcessoSEI(numero);
}

/**
 * API: Vincular NFs ao processo
 */
function api_vincularNFsProcesso(processoId, nfIds) {
  return vincularNFsAoProcesso(processoId, nfIds);
}

// Registro do módulo
if (typeof AppLogger !== 'undefined') {
  AppLogger.debug('Core_Processo_SEI carregado');
}
