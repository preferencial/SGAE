/**
 * @fileoverview Casos de Uso Básicos - Sistema UNIAE CRE
 * @version 1.0.0
 * @description Implementação dos casos de uso principais do sistema
 * de gestão de alimentação escolar.
 * 
 * CASOS DE USO:
 * 1. UC01 - Login e Autenticação
 * 2. UC02 - Cadastro de Nota Fiscal
 * 3. UC03 - Registro de Entrega
 * 4. UC04 - Conferência e Atesto
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-08
 */

'use strict';

// ============================================================================
// CONFIGURAÇÃO DO MÓDULO
// ============================================================================

var UseCases = (function() {
  
  var USUARIOS_SHEET = 'Usuarios';
  var NOTAS_FISCAIS_SHEET = 'Notas_Fiscais';
  var ENTREGAS_SHEET = 'Entregas';
  var CONFERENCIAS_SHEET = 'Controle_Conferencia';
  
  // ============================================================================
  // HELPERS INTERNOS
  // ============================================================================
  
  /**
   * Obtém planilha por nome
   */
  function getSheet(sheetName) {
    try {
      var ss = getSS();
      var sheet = ss.getSheetByName(sheetName);
    
      if (!sheet) {
        // Tenta criar a planilha se não existir
        sheet = ss.insertSheet(sheetName);
        Logger.log('Planilha criada: ' + sheetName);
      }
    
      return sheet;
    } catch (error) {
      Logger.log("Erro em getSheet: " + error.message);
      throw error;
    }
  }
  
  /**
   * Obtém dados de uma planilha como array de objetos
   */
  function getSheetData(sheetName) {
    try {
      var sheet = getSheet(sheetName);
      var lastRow = sheet.getLastRow();
    
      if (lastRow < 2) return [];
    
      var data = sheet.getDataRange().getValues();
      var headers = data[0];
      var records = [];
    
      for (var i = 1; i < data.length; i++) {
        var record = { _rowIndex: i + 1 };
        for (var j = 0; j < headers.length; j++) {
          record[headers[j]] = data[i][j];
        }
        records.push(record);
      }
    
      return records;
    } catch (error) {
      Logger.log("Erro em getSheetData: " + error.message);
      throw error;
    }
  }
  
  /**
   * Adiciona registro em planilha
   */
  function addRecord(sheetName, data) {
    try {
      try {
        var sheet = getSheet(sheetName);
        var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
        if (headers.length === 0 || headers[0] === '') {
          // Planilha vazia, criar headers baseado nos dados
          headers = Object.keys(data);
          sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        }
    
        var row = headers.map(function(h) {
          return data[h] !== undefined ? data[h] : '';
        });
    
        sheet.appendRow(row);
        return sheet.getLastRow();
      } catch (error) {
        Logger.log("Erro em addRecord: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em addRecord: " + error.message);
      throw error;
    }
  }
  
  /**
   * Atualiza registro em planilha
   */
  function updateRecord(sheetName, rowIndex, data) {
    try {
      try {
        try {
          var sheet = getSheet(sheetName);
          var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
          Object.keys(data).forEach(function(key) {
            var colIndex = headers.indexOf(key);
            if (colIndex !== -1) {
              sheet.getRange(rowIndex, colIndex + 1).setValue(data[key]);
            }
          });
    
          return true;
        } catch (error) {
          Logger.log("Erro em updateRecord: " + error.message);
          throw error; // Re-lança para tratamento superior
        }
      } catch (error) {
        Logger.log("Erro em updateRecord: " + error.message);
        throw error;
      }
    } catch (error) {
      Logger.log("Erro em updateRecord: " + error.message);
      throw error;
    }
  }
  
  /**
   * Gera ID único
   */
  function gerarId(prefixo) {
    return (prefixo || 'ID') + '_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
  }
  
  /**
   * Formata data para exibição
   */
  function formatarData(date) {
    try {
      try {
        if (!date) return '';
        var d = date instanceof Date ? date : new Date(date);
        return Utilities.formatDate(d, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');
      } catch (error) {
        Logger.log("Erro em formatarData: " + error.message);
        throw error;
      }
    } catch (error) {
      Logger.log("Erro em formatarData: " + error.message);
      throw error;
    }
  }

  // ============================================================================
  // UC01 - LOGIN E AUTENTICAÇÃO (Senha em Texto Plano)
  // ============================================================================
  
  var UC01_Autenticacao = {
    
    /**
     * Realiza login do usuário
     * @param {string} email - Email do usuário
     * @param {string} senha - Senha em texto plano
     * @returns {Object} Resultado do login
     */
    login: function(email, senha) {
      try {
        // Validação de entrada
        if (!email || !senha) {
          Logger.log('UC01: Tentativa de login sem credenciais completas');
          return {
            success: false,
            error: 'Email e senha são obrigatórios'
          };
        }
      
        Logger.log('[LGPD] Evento registrado; detalhes sensíveis omitidos.');
      
        email = String(email).trim().toLowerCase();
        senha = String(senha).trim();
      
        // Busca usuário
        var usuarios = getSheetData(USUARIOS_SHEET);
        var usuario = null;
      
        for (var i = 0; i < usuarios.length; i++) {
          var u = usuarios[i];
          var emailUsuario = String(u.email || u.Email || '').toLowerCase();
        
          if (emailUsuario === email) {
            usuario = u;
            break;
          }
        }
      
        if (!usuario) {
          Logger.log('[LGPD] Evento registrado; detalhes sensíveis omitidos.');
          return {
            success: false,
            error: 'Email ou senha incorretos'
          };
        }
      
        // Verifica senha (texto plano)
        var senhaArmazenada = String(usuario.senha || usuario.Senha || '').trim();
      
        if (senhaArmazenada !== senha) {
          Logger.log('[LGPD] Evento registrado; detalhes sensíveis omitidos.');
          return {
            success: false,
            error: 'Email ou senha incorretos'
          };
        }
      
        // Verifica se usuário está ativo
        var status = usuario.status || usuario.Status || usuario.ativo || 'ATIVO';
        if (status === 'INATIVO' || status === 'BLOQUEADO' || status === false) {
          return {
            success: false,
            error: 'Usuário inativo ou bloqueado'
          };
        }
      
        // Gera sessão
        var sessaoId = Utilities.getUuid();
        var sessao = {
          id: sessaoId,
          email: email,
          nome: usuario.nome || usuario.Nome || email,
          tipo: usuario.tipo || usuario.Tipo || 'OPERADOR',
          perfil: usuario.perfil || usuario.Perfil || 'CONSULTA',
          loginTime: new Date(),
          expira: Date.now() + (8 * 60 * 60 * 1000) // 8 horas
        };
      
        // Salva sessão no cache
        try {
          var cache = CacheService.getUserCache();
          cache.put('sessao_' + sessaoId, JSON.stringify(sessao), 28800); // 8 horas
          cache.put('usuario_sessao', JSON.stringify(sessao), 28800);
        } catch (e) {
          Logger.log('UC01: Erro ao salvar sessão no cache - ' + e.message);
        }
      
        // Atualiza último acesso
        try {
          updateRecord(USUARIOS_SHEET, usuario._rowIndex, {
            ultimo_acesso: new Date(),
            Ultimo_Acesso: new Date()
          });
        } catch (e) {
          // Ignora erro de atualização
        }
      
        Logger.log('[LGPD] Evento registrado; detalhes sensíveis omitidos.');
      
        return {
          success: true,
          message: 'Login realizado com sucesso',
          sessao: sessaoId,
          usuario: {
            email: sessao.email,
            nome: sessao.nome,
            tipo: sessao.tipo,
            perfil: sessao.perfil
          }
        };
      } catch (error) {
        Logger.log("Erro em login: " + error.message);
        throw error;
      }
    },
    
    /**
     * Realiza logout do usuário
     * @param {string} sessaoId - ID da sessão
     * @returns {Object} Resultado do logout
     */
    logout: function(sessaoId) {
      try {
        try {
          var cache = CacheService.getUserCache();
          if (sessaoId) {
            cache.remove('sessao_' + sessaoId);
          }
          cache.remove('usuario_sessao');
        
          Logger.log('UC01: Logout realizado');
        
          return {
            success: true,
            message: 'Logout realizado com sucesso'
          };
        } catch (e) {
          return {
            success: false,
            error: e.message
          };
        }
      } catch (error) {
        Logger.log("Erro em logout: " + error.message);
        throw error;
      }
    },
    
    /**
     * Verifica se sessão é válida
     * @param {string} sessaoId - ID da sessão (opcional)
     * @returns {Object} Dados da sessão ou null
     */
    verificarSessao: function(sessaoId) {
      try {
        try {
          var cache = CacheService.getUserCache();
          var sessaoData = sessaoId ? 
            cache.get('sessao_' + sessaoId) : 
            cache.get('usuario_sessao');
        
          if (!sessaoData) return null;
        
          var sessao = JSON.parse(sessaoData);
        
          // Verifica expiração
          if (sessao.expira && Date.now() > sessao.expira) {
            this.logout(sessaoId);
            return null;
          }
        
          return sessao;
        } catch (e) {
          return null;
        }
      } catch (error) {
        Logger.log("Erro em verificarSessao: " + error.message);
        throw error;
      }
    },
    
    /**
     * Cadastra novo usuário
     * @param {Object} dados - Dados do usuário
     * @returns {Object} Resultado do cadastro
     */
    cadastrarUsuario: function(dados) {
      try {
        // Validações
        if (!dados.email || !dados.nome || !dados.senha) {
          return {
            success: false,
            error: 'Email, nome e senha são obrigatórios'
          };
        }
      
        var email = String(dados.email).trim().toLowerCase();
      
        // Verifica se email já existe
        var usuarios = getSheetData(USUARIOS_SHEET);
        for (var i = 0; i < usuarios.length; i++) {
          if (String(usuarios[i].email || '').toLowerCase() === email) {
            return {
              success: false,
              error: 'Email já cadastrado'
            };
          }
        }
      
        // Prepara dados do usuário
        var novoUsuario = {
          id: gerarId('USR'),
          email: email,
          nome: dados.nome,
          senha: dados.senha, // Texto plano conforme solicitado
          tipo: dados.tipo || 'OPERADOR',
          perfil: dados.perfil || 'CONSULTA',
          instituicao: dados.instituicao || '',
          telefone: dados.telefone || '',
          status: 'ATIVO',
          data_cadastro: new Date(),
          ultimo_acesso: ''
        };
      
        var rowId = addRecord(USUARIOS_SHEET, novoUsuario);
      
        Logger.log('[LGPD] Evento registrado; detalhes sensíveis omitidos.');
      
        return {
          success: true,
          message: 'Usuário cadastrado com sucesso',
          id: novoUsuario.id,
          rowIndex: rowId
        };
      } catch (error) {
        Logger.log("Erro em cadastrarUsuario: " + error.message);
        throw error;
      }
    }
  };


  // ============================================================================
  // UC02 - CADASTRO DE NOTA FISCAL
  // ============================================================================
  
  var UC02_NotaFiscal = {
    
    /**
     * Cadastra nova nota fiscal
     * @param {Object} dados - Dados da nota fiscal
     * @param {string} sessaoId - ID da sessão do usuário
     * @returns {Object} Resultado do cadastro
     */
    cadastrar: function(dados, sessaoId) {
      try {
        Logger.log('UC02: Cadastro de Nota Fiscal');
      
        // Verifica autenticação
        var sessao = UC01_Autenticacao.verificarSessao(sessaoId);
        if (!sessao) {
          return {
            success: false,
            error: 'Usuário não autenticado. Faça login novamente.'
          };
        }
      
        // Validações obrigatórias
        var erros = [];
      
        if (!dados.numero_nf) erros.push('Número da NF é obrigatório');
        if (!dados.fornecedor) erros.push('Fornecedor é obrigatório');
        if (!dados.cnpj) erros.push('CNPJ é obrigatório');
        if (!dados.valor_total || dados.valor_total <= 0) erros.push('Valor total deve ser maior que zero');
      
        if (erros.length > 0) {
          return {
            success: false,
            error: 'Dados inválidos',
            erros: erros
          };
        }
      
        // Verifica duplicidade
        var notas = getSheetData(NOTAS_FISCAIS_SHEET);
        for (var i = 0; i < notas.length; i++) {
          if (notas[i].numero_nf === dados.numero_nf && 
              notas[i].cnpj === dados.cnpj) {
            return {
              success: false,
              error: 'Nota fiscal já cadastrada para este fornecedor'
            };
          }
        }
      
        // Prepara dados da NF
        var novaNF = {
          id: gerarId('NF'),
          numero_nf: dados.numero_nf,
          serie: dados.serie || '1',
          chave_acesso: dados.chave_acesso || '',
          fornecedor: dados.fornecedor,
          cnpj: dados.cnpj,
          valor_total: parseFloat(dados.valor_total),
          valor_liquido: parseFloat(dados.valor_total),
          data_emissao: dados.data_emissao || new Date(),
          data_cadastro: new Date(),
          status: 'PENDENTE',
          usuario_cadastro: sessao.email,
          observacoes: dados.observacoes || '',
          nota_empenho: dados.nota_empenho || '',
          itens_quantidade: dados.itens_quantidade || 0
        };
      
        var rowId = addRecord(NOTAS_FISCAIS_SHEET, novaNF);
      
        Logger.log('[LGPD] Evento registrado; detalhes sensíveis omitidos.');
      
        return {
          success: true,
          message: 'Nota fiscal cadastrada com sucesso',
          id: novaNF.id,
          numero_nf: novaNF.numero_nf,
          status: novaNF.status,
          rowIndex: rowId
        };
      } catch (error) {
        Logger.log("Erro em cadastrar: " + error.message);
        throw error;
      }
    },
    
    /**
     * Lista notas fiscais com filtros
     * @param {Object} filtros - Filtros de busca
     * @param {string} sessaoId - ID da sessão
     * @returns {Object} Lista de notas fiscais
     */
    listar: function(filtros, sessaoId) {
      try {
        // Verifica autenticação
        var sessao = UC01_Autenticacao.verificarSessao(sessaoId);
        if (!sessao) {
          return {
            success: false,
            error: 'Usuário não autenticado'
          };
        }
      
        filtros = filtros || {};
        var notas = getSheetData(NOTAS_FISCAIS_SHEET);
      
        // Aplica filtros
        if (filtros.status) {
          notas = notas.filter(function(nf) {
            return nf.status === filtros.status;
          });
        }
      
        if (filtros.fornecedor) {
          var termo = filtros.fornecedor.toLowerCase();
          notas = notas.filter(function(nf) {
            return (nf.fornecedor || '').toLowerCase().indexOf(termo) !== -1;
          });
        }
      
        if (filtros.data_inicio && filtros.data_fim) {
          var inicio = new Date(filtros.data_inicio);
          var fim = new Date(filtros.data_fim);
          notas = notas.filter(function(nf) {
            var data = new Date(nf.data_emissao);
            return data >= inicio && data <= fim;
          });
        }
      
        // Ordena por data de cadastro (mais recente primeiro)
        notas.sort(function(a, b) {
          return new Date(b.data_cadastro) - new Date(a.data_cadastro);
        });
      
        return {
          success: true,
          data: notas,
          total: notas.length
        };
      } catch (error) {
        Logger.log("Erro em listar: " + error.message);
        throw error;
      }
    },
    
    /**
     * Busca nota fiscal por ID
     * @param {string} id - ID da nota fiscal
     * @param {string} sessaoId - ID da sessão
     * @returns {Object} Dados da nota fiscal
     */
    buscarPorId: function(id, sessaoId) {
      try {
        var sessao = UC01_Autenticacao.verificarSessao(sessaoId);
        if (!sessao) {
          return { success: false, error: 'Usuário não autenticado' };
        }
      
        var notas = getSheetData(NOTAS_FISCAIS_SHEET);
        var nota = notas.find(function(nf) {
          return nf.id === id;
        });
      
        if (!nota) {
          return { success: false, error: 'Nota fiscal não encontrada' };
        }
      
        return { success: true, data: nota };
      } catch (error) {
        Logger.log("Erro em buscarPorId: " + error.message);
        throw error;
      }
    }
  };

  // ============================================================================
  // UC03 - REGISTRO DE ENTREGA
  // ============================================================================
  
  var UC03_Entrega = {
    
    /**
     * Registra entrega de nota fiscal
     * @param {Object} dados - Dados da entrega
     * @param {string} sessaoId - ID da sessão
     * @returns {Object} Resultado do registro
     */
    registrar: function(dados, sessaoId) {
      try {
        Logger.log('UC03: Registro de Entrega');
      
        // Verifica autenticação
        var sessao = UC01_Autenticacao.verificarSessao(sessaoId);
        if (!sessao) {
          return {
            success: false,
            error: 'Usuário não autenticado'
          };
        }
      
        // Validações
        if (!dados.nota_fiscal_id) {
          return {
            success: false,
            error: 'ID da nota fiscal é obrigatório'
          };
        }
      
        if (!dados.unidade_escolar) {
          return {
            success: false,
            error: 'Unidade escolar é obrigatória'
          };
        }
      
        // Busca nota fiscal
        var notas = getSheetData(NOTAS_FISCAIS_SHEET);
        var notaFiscal = null;
        var notaRowIndex = -1;
      
        for (var i = 0; i < notas.length; i++) {
          if (notas[i].id === dados.nota_fiscal_id) {
            notaFiscal = notas[i];
            notaRowIndex = notas[i]._rowIndex;
            break;
          }
        }
      
        if (!notaFiscal) {
          return {
            success: false,
            error: 'Nota fiscal não encontrada'
          };
        }
      
        // Verifica se NF pode receber entrega
        if (notaFiscal.status !== 'PENDENTE' && notaFiscal.status !== 'RECEBIDA') {
          return {
            success: false,
            error: 'Nota fiscal não está em status válido para entrega. Status atual: ' + notaFiscal.status
          };
        }
      
        // Prepara dados da entrega
        var novaEntrega = {
          id: gerarId('ENT'),
          nota_fiscal_id: dados.nota_fiscal_id,
          numero_nf: notaFiscal.numero_nf,
          fornecedor: notaFiscal.fornecedor,
          unidade_escolar: dados.unidade_escolar,
          data_entrega: dados.data_entrega || new Date(),
          hora_entrega: dados.hora_entrega || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'HH:mm'),
          responsavel_recebimento: dados.responsavel_recebimento || sessao.nome,
          matricula_responsavel: dados.matricula_responsavel || '',
          quantidade_volumes: dados.quantidade_volumes || 1,
          temperatura_adequada: dados.temperatura_adequada !== false,
          embalagem_integra: dados.embalagem_integra !== false,
          documentacao_ok: dados.documentacao_ok !== false,
          status: 'ENTREGUE',
          observacoes: dados.observacoes || '',
          usuario_registro: sessao.email,
          data_registro: new Date()
        };
      
        var rowId = addRecord(ENTREGAS_SHEET, novaEntrega);
      
        // Atualiza status da NF
        updateRecord(NOTAS_FISCAIS_SHEET, notaRowIndex, {
          status: 'RECEBIDA',
          data_recebimento: new Date(),
          usuario_recebimento: sessao.email
        });
      
        Logger.log('UC03: Entrega registrada - NF ' + notaFiscal.numero_nf + ' em ' + dados.unidade_escolar);
      
        return {
          success: true,
          message: 'Entrega registrada com sucesso',
          id: novaEntrega.id,
          entrega: novaEntrega
        };
      } catch (error) {
        Logger.log("Erro em registrar: " + error.message);
        throw error;
      }
    },
    
    /**
     * Lista entregas
     * @param {Object} filtros - Filtros
     * @param {string} sessaoId - ID da sessão
     * @returns {Object} Lista de entregas
     */
    listar: function(filtros, sessaoId) {
      try {
        var sessao = UC01_Autenticacao.verificarSessao(sessaoId);
        if (!sessao) {
          return { success: false, error: 'Usuário não autenticado' };
        }
      
        filtros = filtros || {};
        var entregas = getSheetData(ENTREGAS_SHEET);
      
        if (filtros.unidade_escolar) {
          entregas = entregas.filter(function(e) {
            return e.unidade_escolar === filtros.unidade_escolar;
          });
        }
      
        if (filtros.nota_fiscal_id) {
          entregas = entregas.filter(function(e) {
            return e.nota_fiscal_id === filtros.nota_fiscal_id;
          });
        }
      
        return {
          success: true,
          data: entregas,
          total: entregas.length
        };
      } catch (error) {
        Logger.log("Erro em listar: " + error.message);
        throw error;
      }
    }
  };


  // ============================================================================
  // UC04 - CONFERÊNCIA E ATESTO
  // ============================================================================
  
  var UC04_Conferencia = {
    
    /**
     * Inicia conferência de nota fiscal
     * @param {string} notaFiscalId - ID da nota fiscal
     * @param {string} sessaoId - ID da sessão
     * @returns {Object} Resultado
     */
    iniciarConferencia: function(notaFiscalId, sessaoId) {
      Logger.log('UC04: Iniciando conferência');
      
      // Verifica autenticação
      var sessao = UC01_Autenticacao.verificarSessao(sessaoId);
      if (!sessao) {
        return { success: false, error: 'Usuário não autenticado' };
      }
      
      // Busca nota fiscal
      var notas = getSheetData(NOTAS_FISCAIS_SHEET);
      var notaFiscal = null;
      var notaRowIndex = -1;
      
      for (var i = 0; i < notas.length; i++) {
        if (notas[i].id === notaFiscalId) {
          notaFiscal = notas[i];
          notaRowIndex = notas[i]._rowIndex;
          break;
        }
      }
      
      if (!notaFiscal) {
        return { success: false, error: 'Nota fiscal não encontrada' };
      }
      
      // Verifica status
      if (notaFiscal.status !== 'RECEBIDA') {
        return {
          success: false,
          error: 'Nota fiscal deve estar com status RECEBIDA para iniciar conferência. Status atual: ' + notaFiscal.status
        };
      }
      
      // Cria registro de conferência
      var conferencia = {
        id: gerarId('CONF'),
        nota_fiscal_id: notaFiscalId,
        numero_nf: notaFiscal.numero_nf,
        fornecedor: notaFiscal.fornecedor,
        valor_nf: notaFiscal.valor_total,
        data_inicio: new Date(),
        usuario_conferencia: sessao.email,
        status: 'EM_CONFERENCIA',
        itens_conferidos: 0,
        itens_total: notaFiscal.itens_quantidade || 0,
        valor_conferido: 0,
        valor_glosa: 0,
        observacoes: ''
      };
      
      var rowId = addRecord(CONFERENCIAS_SHEET, conferencia);
      
      // Atualiza status da NF
      updateRecord(NOTAS_FISCAIS_SHEET, notaRowIndex, {
        status: 'EM_CONFERENCIA',
        data_inicio_conferencia: new Date(),
        usuario_conferencia: sessao.email
      });
      
      Logger.log('UC04: Conferência iniciada - NF ' + notaFiscal.numero_nf);
      
      return {
        success: true,
        message: 'Conferência iniciada',
        conferencia_id: conferencia.id,
        nota_fiscal: notaFiscal.numero_nf
      };
    },
    
    /**
     * Registra item conferido
     * @param {Object} dados - Dados do item
     * @param {string} sessaoId - ID da sessão
     * @returns {Object} Resultado
     */
    registrarItemConferido: function(dados, sessaoId) {
      try {
        var sessao = UC01_Autenticacao.verificarSessao(sessaoId);
        if (!sessao) {
          return { success: false, error: 'Usuário não autenticado' };
        }
      
        if (!dados.conferencia_id) {
          return { success: false, error: 'ID da conferência é obrigatório' };
        }
      
        // Busca conferência
        var conferencias = getSheetData(CONFERENCIAS_SHEET);
        var conferencia = null;
        var confRowIndex = -1;
      
        for (var i = 0; i < conferencias.length; i++) {
          if (conferencias[i].id === dados.conferencia_id) {
            conferencia = conferencias[i];
            confRowIndex = conferencias[i]._rowIndex;
            break;
          }
        }
      
        if (!conferencia) {
          return { success: false, error: 'Conferência não encontrada' };
        }
      
        // Atualiza contadores
        var itensConferidos = (parseInt(conferencia.itens_conferidos) || 0) + 1;
        var valorConferido = (parseFloat(conferencia.valor_conferido) || 0) + (parseFloat(dados.valor_item) || 0);
        var valorGlosa = (parseFloat(conferencia.valor_glosa) || 0) + (parseFloat(dados.valor_glosa) || 0);
      
        updateRecord(CONFERENCIAS_SHEET, confRowIndex, {
          itens_conferidos: itensConferidos,
          valor_conferido: valorConferido,
          valor_glosa: valorGlosa
        });
      
        return {
          success: true,
          message: 'Item conferido registrado',
          itens_conferidos: itensConferidos,
          valor_conferido: valorConferido,
          valor_glosa: valorGlosa
        };
      } catch (error) {
        Logger.log("Erro em registrarItemConferido: " + error.message);
        throw error;
      }
    },
    
    /**
     * Finaliza conferência e realiza atesto
     * @param {string} conferenciaId - ID da conferência
     * @param {Object} dados - Dados do atesto
     * @param {string} sessaoId - ID da sessão
     * @returns {Object} Resultado
     */
    finalizarAtesto: function(conferenciaId, dados, sessaoId) {
      try {
        Logger.log('UC04: Finalizando atesto');
      
        var sessao = UC01_Autenticacao.verificarSessao(sessaoId);
        if (!sessao) {
          return { success: false, error: 'Usuário não autenticado' };
        }
      
        // Verifica permissão (apenas FISCAL, GESTOR ou ADMIN podem atestar)
        var perfisPermitidos = ['FISCAL', 'GESTOR', 'ADMIN', 'ANALISTA'];
        if (perfisPermitidos.indexOf(sessao.perfil) === -1 && 
            perfisPermitidos.indexOf(sessao.tipo) === -1) {
          return {
            success: false,
            error: 'Usuário não tem permissão para realizar atesto. Perfil necessário: FISCAL, GESTOR ou ADMIN'
          };
        }
      
        // Busca conferência
        var conferencias = getSheetData(CONFERENCIAS_SHEET);
        var conferencia = null;
        var confRowIndex = -1;
      
        for (var i = 0; i < conferencias.length; i++) {
          if (conferencias[i].id === conferenciaId) {
            conferencia = conferencias[i];
            confRowIndex = conferencias[i]._rowIndex;
            break;
          }
        }
      
        if (!conferencia) {
          return { success: false, error: 'Conferência não encontrada' };
        }
      
        if (conferencia.status !== 'EM_CONFERENCIA') {
          return {
            success: false,
            error: 'Conferência não está em andamento. Status: ' + conferencia.status
          };
        }
      
        // Busca nota fiscal
        var notas = getSheetData(NOTAS_FISCAIS_SHEET);
        var notaFiscal = null;
        var notaRowIndex = -1;
      
        for (var i = 0; i < notas.length; i++) {
          if (notas[i].id === conferencia.nota_fiscal_id) {
            notaFiscal = notas[i];
            notaRowIndex = notas[i]._rowIndex;
            break;
          }
        }
      
        if (!notaFiscal) {
          return { success: false, error: 'Nota fiscal da conferência não encontrada' };
        }
      
        // Calcula valores finais
        var valorGlosa = parseFloat(conferencia.valor_glosa) || 0;
        var valorLiquido = parseFloat(notaFiscal.valor_total) - valorGlosa;
        var statusFinal = valorGlosa > 0 ? 'ATESTADA_COM_GLOSA' : 'ATESTADA';
      
        // Atualiza conferência
        updateRecord(CONFERENCIAS_SHEET, confRowIndex, {
          status: 'CONCLUIDA',
          data_conclusao: new Date(),
          usuario_atesto: sessao.email,
          parecer: dados.parecer || 'Conferência realizada conforme documentação',
          valor_liquido_final: valorLiquido
        });
      
        // Atualiza nota fiscal
        updateRecord(NOTAS_FISCAIS_SHEET, notaRowIndex, {
          status: statusFinal,
          valor_liquido: valorLiquido,
          valor_glosa: valorGlosa,
          data_atesto: new Date(),
          usuario_atesto: sessao.email,
          parecer_atesto: dados.parecer || ''
        });
      
        Logger.log('UC04: Atesto finalizado - NF ' + notaFiscal.numero_nf + ' - Status: ' + statusFinal);
      
        return {
          success: true,
          message: 'Atesto realizado com sucesso',
          nota_fiscal: notaFiscal.numero_nf,
          status: statusFinal,
          valor_original: notaFiscal.valor_total,
          valor_glosa: valorGlosa,
          valor_liquido: valorLiquido,
          data_atesto: formatarData(new Date()),
          usuario_atesto: sessao.email
        };
      } catch (error) {
        Logger.log("Erro em finalizarAtesto: " + error.message);
        throw error;
      }
    },
    
    /**
     * Lista conferências
     * @param {Object} filtros - Filtros
     * @param {string} sessaoId - ID da sessão
     * @returns {Object} Lista de conferências
     */
    listar: function(filtros, sessaoId) {
      try {
        var sessao = UC01_Autenticacao.verificarSessao(sessaoId);
        if (!sessao) {
          return { success: false, error: 'Usuário não autenticado' };
        }
      
        filtros = filtros || {};
        var conferencias = getSheetData(CONFERENCIAS_SHEET);
      
        if (filtros.status) {
          conferencias = conferencias.filter(function(c) {
            return c.status === filtros.status;
          });
        }
      
        return {
          success: true,
          data: conferencias,
          total: conferencias.length
        };
      } catch (error) {
        Logger.log("Erro em listar: " + error.message);
        throw error;
      }
    }
  };

  // ============================================================================
  // API PÚBLICA
  // ============================================================================
  
  return {
    // UC01 - Autenticação
    login: UC01_Autenticacao.login,
    logout: UC01_Autenticacao.logout,
    verificarSessao: UC01_Autenticacao.verificarSessao,
    cadastrarUsuario: UC01_Autenticacao.cadastrarUsuario,
    
    // UC02 - Nota Fiscal
    cadastrarNotaFiscal: UC02_NotaFiscal.cadastrar,
    listarNotasFiscais: UC02_NotaFiscal.listar,
    buscarNotaFiscal: UC02_NotaFiscal.buscarPorId,
    
    // UC03 - Entrega
    registrarEntrega: UC03_Entrega.registrar,
    listarEntregas: UC03_Entrega.listar,
    
    // UC04 - Conferência e Atesto
    iniciarConferencia: UC04_Conferencia.iniciarConferencia,
    registrarItemConferido: UC04_Conferencia.registrarItemConferido,
    finalizarAtesto: UC04_Conferencia.finalizarAtesto,
    listarConferencias: UC04_Conferencia.listar
  };
  
})();

// ============================================================================
// FUNÇÕES GLOBAIS PARA API (Google.script.run)
// ============================================================================

/**
 * UC01 - Login
 */
function uc_login(email, senha) {
  return UseCases.login(email, senha);
}

/**
 * UC01 - Logout
 */
function uc_logout(sessaoId) {
  return UseCases.logout(sessaoId);
}

/**
 * UC01 - Verificar Sessão
 */
function uc_verificarSessao(sessaoId) {
  var sessao = UseCases.verificarSessao(sessaoId);
  return {
    success: sessao !== null,
    sessao: sessao
  };
}

/**
 * UC01 - Cadastrar Usuário
 * @param {Object} dados - Dados do usuário (email, nome, senha, tipo)
 * @returns {Object} Resultado do cadastro
 */
function uc_cadastrarUsuario(dados) {
  if (!dados) {
    return { success: false, error: 'Dados do usuário não fornecidos' };
  }
  return UseCases.cadastrarUsuario(dados);
}

/**
 * UC02 - Cadastrar Nota Fiscal
 */
function uc_cadastrarNotaFiscal(dados, sessaoId) {
  return UseCases.cadastrarNotaFiscal(dados, sessaoId);
}

/**
 * UC02 - Listar Notas Fiscais
 */
function uc_listarNotasFiscais(filtros, sessaoId) {
  return UseCases.listarNotasFiscais(filtros, sessaoId);
}

/**
 * UC03 - Registrar Entrega
 */
function uc_registrarEntrega(dados, sessaoId) {
  return UseCases.registrarEntrega(dados, sessaoId);
}

/**
 * UC03 - Listar Entregas
 */
function uc_listarEntregas(filtros, sessaoId) {
  return UseCases.listarEntregas(filtros, sessaoId);
}

/**
 * UC04 - Iniciar Conferência
 */
function uc_iniciarConferencia(notaFiscalId, sessaoId) {
  return UseCases.iniciarConferencia(notaFiscalId, sessaoId);
}

/**
 * UC04 - Finalizar Atesto
 */
function uc_finalizarAtesto(conferenciaId, dados, sessaoId) {
  return UseCases.finalizarAtesto(conferenciaId, dados, sessaoId);
}

/**
 * UC04 - Listar Conferências
 */
function uc_listarConferencias(filtros, sessaoId) {
  return UseCases.listarConferencias(filtros, sessaoId);
}

// Log de carregamento
Logger.log('✅ Core_UseCases.gs carregado - 4 casos de uso implementados');
