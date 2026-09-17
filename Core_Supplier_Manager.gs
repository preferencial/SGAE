2/**
 * @fileoverview Gestão de Fornecedores e Certidões - Alimentação Escolar CRE-PP
 * @version 1.0.0
 * 
 * Intervenção 21/38: SupplierManager conforme Prompt 21
 * 
 * Funcionalidades:
 * - Cadastro completo de fornecedores
 * - Controle rigoroso de certidões negativas (CND)
 * - Bloqueio automático de empenhos com certidões vencidas
 * - Alertas de vencimento
 * - Histórico de documentação
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-25
 */

'use strict';

// ============================================================================
// SUPPLIER MANAGER - Gestão de Fornecedores
// ============================================================================

var SupplierManager = (function() {
  
  // =========================================================================
  // CONFIGURAÇÃO
  // =========================================================================
  
  var CONFIG = {
    // Planilha
    SHEET_NAME: 'Fornecedores',
    CERTIDOES_SHEET: 'Certidoes_Fornecedores',
    
    // Tipos de certidões obrigatórias
    CERTIDOES_OBRIGATORIAS: [
      { codigo: 'CND_FEDERAL', nome: 'CND Federal (Receita/PGFN)', validadeDias: 180 },
      { codigo: 'CND_ESTADUAL', nome: 'CND Estadual', validadeDias: 90 },
      { codigo: 'CND_MUNICIPAL', nome: 'CND Municipal', validadeDias: 90 },
      { codigo: 'CRF_FGTS', nome: 'CRF - FGTS', validadeDias: 30 },
      { codigo: 'CNDT', nome: 'CNDT - Trabalhista', validadeDias: 180 }
    ],
    
    // Certidões opcionais
    CERTIDOES_OPCIONAIS: [
      { codigo: 'ALVARA', nome: 'Alvará de Funcionamento', validadeDias: 365 },
      { codigo: 'LICENCA_SANITARIA', nome: 'Licença Sanitária', validadeDias: 365 },
      { codigo: 'DAP', nome: 'DAP - Agricultura Familiar', validadeDias: 365 }
    ],
    
    // Status do fornecedor
    STATUS: {
      ATIVO: 'Ativo',
      INATIVO: 'Inativo',
      BLOQUEADO: 'Bloqueado',
      PENDENTE: 'Pendente Documentação'
    },
    
    // Tipos de fornecedor
    TIPOS: {
      PESSOA_JURIDICA: 'Pessoa Jurídica',
      PESSOA_FISICA: 'Pessoa Física',
      AGRICULTURA_FAMILIAR: 'Agricultura Familiar',
      COOPERATIVA: 'Cooperativa'
    },
    
    // Alertas de vencimento (dias antes)
    ALERTA_VENCIMENTO: [30, 15, 7, 3, 1],
    
    // Cache
    CACHE_TTL: 300 // 5 minutos
  };
  
  // =========================================================================
  // FUNÇÕES PRIVADAS - UTILITÁRIOS
  // =========================================================================
  
  /**
   * Valida CNPJ
   * @private
   */
  function _validarCNPJ(cnpj) {
    try {
      cnpj = String(cnpj).replace(/[^\d]/g, '');
    
      if (cnpj.length !== 14) return false;
      if (/^(\d)\1+$/.test(cnpj)) return false;
    
      var tamanho = cnpj.length - 2;
      var numeros = cnpj.substring(0, tamanho);
      var digitos = cnpj.substring(tamanho);
      var soma = 0;
      var pos = tamanho - 7;
    
      for (var i = tamanho; i >= 1; i--) {
        soma += numeros.charAt(tamanho - i) * pos--;
        if (pos < 2) pos = 9;
      }
    
      var resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
      if (resultado != digitos.charAt(0)) return false;
    
      tamanho = tamanho + 1;
      numeros = cnpj.substring(0, tamanho);
      soma = 0;
      pos = tamanho - 7;
    
      for (var i = tamanho; i >= 1; i--) {
        soma += numeros.charAt(tamanho - i) * pos--;
        if (pos < 2) pos = 9;
      }
    
      resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
      return resultado == digitos.charAt(1);
    } catch (error) {
      Logger.log("Erro em _validarCNPJ: " + error.message);
      throw error;
    }
  }
  
  /**
   * Valida CPF
   * @private
   */
  function _validarCPF(cpf) {
    try {
      cpf = String(cpf).replace(/[^\d]/g, '');
    
      if (cpf.length !== 11) return false;
      if (/^(\d)\1+$/.test(cpf)) return false;
    
      var soma = 0;
      for (var i = 0; i < 9; i++) {
        soma += parseInt(cpf.charAt(i)) * (10 - i);
      }
      var resto = (soma * 10) % 11;
      if (resto === 10 || resto === 11) resto = 0;
      if (resto !== parseInt(cpf.charAt(9))) return false;
    
      soma = 0;
      for (var i = 0; i < 10; i++) {
        soma += parseInt(cpf.charAt(i)) * (11 - i);
      }
      resto = (soma * 10) % 11;
      if (resto === 10 || resto === 11) resto = 0;
    
      return resto === parseInt(cpf.charAt(10));
    } catch (error) {
      Logger.log("Erro em _validarCPF: " + error.message);
      throw error;
    }
  }
  
  /**
   * Formata CNPJ
   * @private
   */
  function _formatarCNPJ(cnpj) {
    try {
      cnpj = String(cnpj).replace(/[^\d]/g, '');
      return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    } catch (error) {
      Logger.log("Erro em _formatarCNPJ: " + error.message);
      throw error;
    }
  }
  
  /**
   * Formata CPF
   * @private
   */
  function _formatarCPF(cpf) {
    try {
      cpf = String(cpf).replace(/[^\d]/g, '');
      return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
    } catch (error) {
      Logger.log("Erro em _formatarCPF: " + error.message);
      throw error;
    }
  }
  
  /**
   * Calcula dias até vencimento
   * @private
   */
  function _diasAteVencimento(dataVencimento) {
    if (!dataVencimento) return -999;
    var hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    var venc = new Date(dataVencimento);
    venc.setHours(0, 0, 0, 0);
    return Math.ceil((venc - hoje) / (1000 * 60 * 60 * 24));
  }
  
  /**
   * Gera ID único
   * @private
   */
  function _gerarId() {
    try {
      return 'FORN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    } catch (error) {
      Logger.log("Erro em _gerarId: " + error.message);
      throw error;
    }
  }
  
  /**
   * Obtém dados do banco
   * @private
   */
  function _getData(sheetName, filtros) {
    if (typeof DatabaseEngine !== 'undefined') {
      return DatabaseEngine.read(sheetName, filtros);
    }
    // Fallback básico
    try {
      var ss = getSS();
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) return [];
      
      var data = sheet.getDataRange().getValues();
      if (data.length < 2) return [];
      
      var headers = data[0];
      var result = [];
      
      for (var i = 1; i < data.length; i++) {
        var row = {};
        for (var j = 0; j < headers.length; j++) {
          row[headers[j]] = data[i][j];
        }
        result.push(row);
      }
      
      return result;
    } catch (e) {
      console.error('Erro ao ler dados: ' + e.message);
      return [];
    }
  }
  
  /**
   * Salva dados no banco
   * @private
   */
  function _saveData(sheetName, dados) {
    try {
      try {
        if (typeof DatabaseEngine !== 'undefined') {
          return DatabaseEngine.create(sheetName, dados);
        }
        // Fallback básico
        try {
          var ss = getSS();
          var sheet = ss.getSheetByName(sheetName);
          if (!sheet) return null;
      
          var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
          var row = headers.map(function(h) { return dados[h] || ''; });
      
          sheet.appendRow(row);
          return dados;
        } catch (e) {
          console.error('Erro ao salvar: ' + e.message);
          return null;
        }
      } catch (error) {
        Logger.log("Erro em _saveData: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em _saveData: " + error.message);
      throw error;
    }
  }
  
  /**
   * Atualiza dados no banco
   * @private
   */
  function _updateData(sheetName, id, dados) {
    if (typeof DatabaseEngine !== 'undefined') {
      return DatabaseEngine.update(sheetName, id, dados);
    }
    return null;
  }
  
  // =========================================================================
  // FUNÇÕES PRIVADAS - CERTIDÕES
  // =========================================================================
  
  /**
   * Verifica status das certidões de um fornecedor
   * @private
   */
  function _verificarCertidoes(fornecedorId) {
    try {
      var certidoes = _getData(CONFIG.CERTIDOES_SHEET, { fornecedor_id: fornecedorId });
    
      var resultado = {
        regular: true,
        certidoesVencidas: [],
        certidoesPendentes: [],
        certidoesProximasVencer: [],
        detalhes: []
      };
    
      // Verifica cada certidão obrigatória
      CONFIG.CERTIDOES_OBRIGATORIAS.forEach(function(certObrig) {
        var certEncontrada = certidoes.find(function(c) {
          return c.tipo === certObrig.codigo && c.ativo;
        });
      
        if (!certEncontrada) {
          resultado.regular = false;
          resultado.certidoesPendentes.push(certObrig.nome);
          resultado.detalhes.push({
            tipo: certObrig.codigo,
            nome: certObrig.nome,
            status: 'PENDENTE',
            mensagem: 'Certidão não cadastrada'
          });
        } else {
          var diasVenc = _diasAteVencimento(certEncontrada.data_vencimento);
        
          if (diasVenc < 0) {
            resultado.regular = false;
            resultado.certidoesVencidas.push(certObrig.nome);
            resultado.detalhes.push({
              tipo: certObrig.codigo,
              nome: certObrig.nome,
              status: 'VENCIDA',
              vencimento: certEncontrada.data_vencimento,
              diasVencida: Math.abs(diasVenc),
              mensagem: 'Vencida há ' + Math.abs(diasVenc) + ' dias'
            });
          } else if (diasVenc <= 30) {
            resultado.certidoesProximasVencer.push({
              nome: certObrig.nome,
              diasRestantes: diasVenc
            });
            resultado.detalhes.push({
              tipo: certObrig.codigo,
              nome: certObrig.nome,
              status: 'PROXIMO_VENCER',
              vencimento: certEncontrada.data_vencimento,
              diasRestantes: diasVenc,
              mensagem: 'Vence em ' + diasVenc + ' dias'
            });
          } else {
            resultado.detalhes.push({
              tipo: certObrig.codigo,
              nome: certObrig.nome,
              status: 'REGULAR',
              vencimento: certEncontrada.data_vencimento,
              diasRestantes: diasVenc,
              mensagem: 'Regular'
            });
          }
        }
      });
    
      return resultado;
    } catch (error) {
      Logger.log("Erro em _verificarCertidoes: " + error.message);
      throw error;
    }
  }
  
  /**
   * Envia alertas de vencimento
   * @private
   */
  function _enviarAlertaVencimento(fornecedor, certidao, diasRestantes) {
    if (typeof NotificationService !== 'undefined') {
      NotificationService.enviar({
        tipo: 'ALERTA_CERTIDAO',
        titulo: 'Certidão próxima do vencimento',
        mensagem: 'A certidão ' + certidao.nome + ' do fornecedor ' + 
                  fornecedor.razao_social + ' vence em ' + diasRestantes + ' dias.',
        destinatarios: ['uniae@cre-pp.gov.br'],
        prioridade: diasRestantes <= 7 ? 'ALTA' : 'MEDIA',
        dados: {
          fornecedorId: fornecedor.id,
          certidaoTipo: certidao.tipo,
          vencimento: certidao.data_vencimento
        }
      });
    }
  }
  
  // =========================================================================
  // API PÚBLICA - CRUD FORNECEDORES
  // =========================================================================
  
  /**
   * Cadastra novo fornecedor
   * @param {Object} dados - Dados do fornecedor
   * @returns {Object} Resultado do cadastro
   */
  function cadastrar(dados) {
    try {
      if (!dados) {
        return { success: false, error: 'Dados são obrigatórios' };
      }
    
      // Validações
      var erros = [];
    
      // Documento (CNPJ ou CPF)
      if (!dados.documento) {
        erros.push('Documento (CNPJ/CPF) é obrigatório');
      } else {
        var doc = String(dados.documento).replace(/[^\d]/g, '');
        if (doc.length === 14) {
          if (!_validarCNPJ(doc)) {
            erros.push('CNPJ inválido');
          }
        } else if (doc.length === 11) {
          if (!_validarCPF(doc)) {
            erros.push('CPF inválido');
          }
        } else {
          erros.push('Documento deve ser CNPJ (14 dígitos) ou CPF (11 dígitos)');
        }
      }
    
      // Razão Social
      if (!dados.razao_social || dados.razao_social.trim().length < 3) {
        erros.push('Razão Social é obrigatória (mínimo 3 caracteres)');
      }
    
      // Email
      if (dados.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email)) {
        erros.push('Email inválido');
      }
    
      if (erros.length > 0) {
        return { success: false, errors: erros };
      }
    
      // Verifica duplicidade
      var existente = _getData(CONFIG.SHEET_NAME, { documento: dados.documento });
      if (existente && existente.length > 0) {
        return { success: false, error: 'Fornecedor já cadastrado com este documento' };
      }
    
      try {
        // Prepara dados
        var fornecedor = {
          id: _gerarId(),
          documento: String(dados.documento).replace(/[^\d]/g, ''),
          documento_formatado: dados.documento.length === 14 ? 
                               _formatarCNPJ(dados.documento) : _formatarCPF(dados.documento),
          tipo_documento: dados.documento.replace(/[^\d]/g, '').length === 14 ? 'CNPJ' : 'CPF',
          razao_social: dados.razao_social.trim().toUpperCase(),
          nome_fantasia: (dados.nome_fantasia || '').trim(),
          tipo: dados.tipo || CONFIG.TIPOS.PESSOA_JURIDICA,
        
          // Contato
          email: (dados.email || '').toLowerCase(),
          telefone: dados.telefone || '',
          celular: dados.celular || '',
        
          // Endereço
          cep: dados.cep || '',
          logradouro: dados.logradouro || '',
          numero: dados.numero || '',
          complemento: dados.complemento || '',
          bairro: dados.bairro || '',
          cidade: dados.cidade || '',
          uf: (dados.uf || '').toUpperCase(),
        
          // Bancário
          banco: dados.banco || '',
          agencia: dados.agencia || '',
          conta: dados.conta || '',
          tipo_conta: dados.tipo_conta || 'Corrente',
          pix: dados.pix || '',
        
          // Responsável
          responsavel_nome: dados.responsavel_nome || '',
          responsavel_cpf: dados.responsavel_cpf || '',
          responsavel_telefone: dados.responsavel_telefone || '',
        
          // Status
          status: CONFIG.STATUS.PENDENTE,
          ativo: true,
        
          // Metadados
          criado_em: new Date().toISOString(),
          criado_por: Session.getActiveUser().getEmail(),
          atualizado_em: new Date().toISOString()
        };
      
        // Salva
        var resultado = _saveData(CONFIG.SHEET_NAME, fornecedor);
      
        if (!resultado) {
          return { success: false, error: 'Erro ao salvar fornecedor' };
        }
      
        // Auditoria
        if (typeof AuditService !== 'undefined') {
          AuditService.log('FORNECEDOR_CADASTRADO', {
            fornecedorId: fornecedor.id,
            documento: fornecedor.documento_formatado,
            razaoSocial: fornecedor.razao_social
          });
        }
      
        return {
          success: true,
          data: fornecedor,
          message: 'Fornecedor cadastrado com sucesso. Aguardando documentação.'
        };
      
      } catch (e) {
        console.error('Erro ao cadastrar fornecedor: ' + e.message);
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em cadastrar: " + error.message);
      throw error;
    }
  }
  
  /**
   * Atualiza fornecedor
   * @param {string} id - ID do fornecedor
   * @param {Object} dados - Dados a atualizar
   * @returns {Object} Resultado
   */
  function atualizar(id, dados) {
    try {
      if (!id) {
        return { success: false, error: 'ID é obrigatório' };
      }
    
      try {
        // Busca fornecedor
        var fornecedores = _getData(CONFIG.SHEET_NAME, { id: id });
        if (!fornecedores || fornecedores.length === 0) {
          return { success: false, error: 'Fornecedor não encontrado' };
        }
      
        var fornecedor = fornecedores[0];
      
        // Campos que podem ser atualizados
        var camposPermitidos = [
          'nome_fantasia', 'email', 'telefone', 'celular',
          'cep', 'logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'uf',
          'banco', 'agencia', 'conta', 'tipo_conta', 'pix',
          'responsavel_nome', 'responsavel_cpf', 'responsavel_telefone'
        ];
      
        var atualizacoes = {};
        camposPermitidos.forEach(function(campo) {
          if (dados.hasOwnProperty(campo)) {
            atualizacoes[campo] = dados[campo];
          }
        });
      
        atualizacoes.atualizado_em = new Date().toISOString();
        atualizacoes.atualizado_por = Session.getActiveUser().getEmail();
      
        // Atualiza
        var resultado = _updateData(CONFIG.SHEET_NAME, id, atualizacoes);
      
        // Auditoria
        if (typeof AuditService !== 'undefined') {
          AuditService.log('FORNECEDOR_ATUALIZADO', {
            fornecedorId: id,
            campos: Object.keys(atualizacoes)
          });
        }
      
        return {
          success: true,
          data: Object.assign({}, fornecedor, atualizacoes),
          message: 'Fornecedor atualizado com sucesso'
        };
      
      } catch (e) {
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em atualizar: " + error.message);
      throw error;
    }
  }
  
  /**
   * Busca fornecedor por ID
   * @param {string} id - ID do fornecedor
   * @returns {Object} Fornecedor
   */
  function buscarPorId(id) {
    if (!id) {
      return { success: false, error: 'ID é obrigatório' };
    }
    
    try {
      var fornecedores = _getData(CONFIG.SHEET_NAME, { id: id });
      
      if (!fornecedores || fornecedores.length === 0) {
        return { success: false, error: 'Fornecedor não encontrado' };
      }
      
      var fornecedor = fornecedores[0];
      
      // Adiciona status das certidões
      fornecedor.certidoes = _verificarCertidoes(id);
      
      return { success: true, data: fornecedor };
      
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
  
  /**
   * Busca fornecedor por documento
   * @param {string} documento - CNPJ ou CPF
   * @returns {Object} Fornecedor
   */
  function buscarPorDocumento(documento) {
    try {
      if (!documento) {
        return { success: false, error: 'Documento é obrigatório' };
      }
    
      var doc = String(documento).replace(/[^\d]/g, '');
    
      try {
        var fornecedores = _getData(CONFIG.SHEET_NAME, { documento: doc });
      
        if (!fornecedores || fornecedores.length === 0) {
          return { success: false, error: 'Fornecedor não encontrado' };
        }
      
        var fornecedor = fornecedores[0];
        fornecedor.certidoes = _verificarCertidoes(fornecedor.id);
      
        return { success: true, data: fornecedor };
      
      } catch (e) {
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em buscarPorDocumento: " + error.message);
      throw error;
    }
  }
  
  /**
   * Lista fornecedores
   * @param {Object} filtros - Filtros de busca
   * @returns {Object} Lista de fornecedores
   */
  function listar(filtros) {
    try {
      filtros = filtros || {};
    
      try {
        var fornecedores = _getData(CONFIG.SHEET_NAME, filtros);
      
        // Filtra por status se especificado
        if (filtros.status) {
          fornecedores = fornecedores.filter(function(f) {
            return f.status === filtros.status;
          });
        }
      
        // Filtra apenas ativos se não especificado
        if (filtros.ativo === undefined) {
          fornecedores = fornecedores.filter(function(f) {
            return f.ativo !== false;
          });
        }
      
        // Adiciona status de certidões para cada fornecedor
        if (filtros.incluirCertidoes) {
          fornecedores = fornecedores.map(function(f) {
            f.certidoes = _verificarCertidoes(f.id);
            return f;
          });
        }
      
        // Ordenação
        if (filtros.ordenarPor) {
          var campo = filtros.ordenarPor;
          var ordem = filtros.ordem === 'desc' ? -1 : 1;
          fornecedores.sort(function(a, b) {
            if (a[campo] < b[campo]) return -1 * ordem;
            if (a[campo] > b[campo]) return 1 * ordem;
            return 0;
          });
        }
      
        return {
          success: true,
          data: {
            fornecedores: fornecedores,
            total: fornecedores.length
          }
        };
      
      } catch (e) {
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em listar: " + error.message);
      throw error;
    }
  }

  
  // =========================================================================
  // API PÚBLICA - CERTIDÕES
  // =========================================================================
  
  /**
   * Cadastra certidão para fornecedor
   * @param {Object} dados - Dados da certidão
   * @returns {Object} Resultado
   */
  function cadastrarCertidao(dados) {
    try {
      if (!dados || !dados.fornecedor_id) {
        return { success: false, error: 'Fornecedor é obrigatório' };
      }
    
      if (!dados.tipo) {
        return { success: false, error: 'Tipo de certidão é obrigatório' };
      }
    
      if (!dados.data_emissao || !dados.data_vencimento) {
        return { success: false, error: 'Datas de emissão e vencimento são obrigatórias' };
      }
    
      try {
        // Verifica se fornecedor existe
        var fornecedor = buscarPorId(dados.fornecedor_id);
        if (!fornecedor.success) {
          return { success: false, error: 'Fornecedor não encontrado' };
        }
      
        // Verifica tipo de certidão
        var tipoCertidao = CONFIG.CERTIDOES_OBRIGATORIAS.find(function(c) {
          return c.codigo === dados.tipo;
        }) || CONFIG.CERTIDOES_OPCIONAIS.find(function(c) {
          return c.codigo === dados.tipo;
        });
      
        if (!tipoCertidao) {
          return { success: false, error: 'Tipo de certidão inválido' };
        }
      
        // Desativa certidões anteriores do mesmo tipo
        var certidoesAnteriores = _getData(CONFIG.CERTIDOES_SHEET, {
          fornecedor_id: dados.fornecedor_id,
          tipo: dados.tipo,
          ativo: true
        });
      
        certidoesAnteriores.forEach(function(cert) {
          _updateData(CONFIG.CERTIDOES_SHEET, cert.id, { ativo: false });
        });
      
        // Prepara nova certidão
        var certidao = {
          id: 'CERT_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
          fornecedor_id: dados.fornecedor_id,
          tipo: dados.tipo,
          nome: tipoCertidao.nome,
          numero: dados.numero || '',
          data_emissao: new Date(dados.data_emissao).toISOString(),
          data_vencimento: new Date(dados.data_vencimento).toISOString(),
          arquivo_id: dados.arquivo_id || '',
          arquivo_url: dados.arquivo_url || '',
          observacoes: dados.observacoes || '',
          ativo: true,
          criado_em: new Date().toISOString(),
          criado_por: Session.getActiveUser().getEmail()
        };
      
        // Salva
        var resultado = _saveData(CONFIG.CERTIDOES_SHEET, certidao);
      
        if (!resultado) {
          return { success: false, error: 'Erro ao salvar certidão' };
        }
      
        // Verifica se todas as certidões estão em dia
        var statusCertidoes = _verificarCertidoes(dados.fornecedor_id);
      
        // Atualiza status do fornecedor
        if (statusCertidoes.regular) {
          _updateData(CONFIG.SHEET_NAME, dados.fornecedor_id, {
            status: CONFIG.STATUS.ATIVO,
            atualizado_em: new Date().toISOString()
          });
        }
      
        // Auditoria
        if (typeof AuditService !== 'undefined') {
          AuditService.log('CERTIDAO_CADASTRADA', {
            fornecedorId: dados.fornecedor_id,
            tipo: dados.tipo,
            vencimento: certidao.data_vencimento
          });
        }
      
        return {
          success: true,
          data: certidao,
          statusFornecedor: statusCertidoes,
          message: 'Certidão cadastrada com sucesso'
        };
      
      } catch (e) {
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em cadastrarCertidao: " + error.message);
      throw error;
    }
  }
  
  /**
   * Lista certidões de um fornecedor
   * @param {string} fornecedorId - ID do fornecedor
   * @returns {Object} Lista de certidões
   */
  function listarCertidoes(fornecedorId) {
    try {
      if (!fornecedorId) {
        return { success: false, error: 'Fornecedor é obrigatório' };
      }
    
      try {
        var certidoes = _getData(CONFIG.CERTIDOES_SHEET, { 
          fornecedor_id: fornecedorId,
          ativo: true 
        });
      
        // Adiciona status de cada certidão
        certidoes = certidoes.map(function(cert) {
          var dias = _diasAteVencimento(cert.data_vencimento);
          cert.dias_vencimento = dias;
          cert.status_vencimento = dias < 0 ? 'VENCIDA' : 
                                   dias <= 30 ? 'PROXIMO_VENCER' : 'REGULAR';
          return cert;
        });
      
        return {
          success: true,
          data: {
            certidoes: certidoes,
            total: certidoes.length,
            resumo: _verificarCertidoes(fornecedorId)
          }
        };
      
      } catch (e) {
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em listarCertidoes: " + error.message);
      throw error;
    }
  }
  
  /**
   * Verifica regularidade do fornecedor
   * @param {string} fornecedorId - ID do fornecedor
   * @returns {Object} Status de regularidade
   */
  function verificarRegularidade(fornecedorId) {
    if (!fornecedorId) {
      return { success: false, error: 'Fornecedor é obrigatório' };
    }
    
    try {
      var fornecedor = buscarPorId(fornecedorId);
      if (!fornecedor.success) {
        return fornecedor;
      }
      
      var statusCertidoes = _verificarCertidoes(fornecedorId);
      
      return {
        success: true,
        data: {
          fornecedor: {
            id: fornecedor.data.id,
            razao_social: fornecedor.data.razao_social,
            documento: fornecedor.data.documento_formatado,
            status: fornecedor.data.status
          },
          regular: statusCertidoes.regular,
          podeEmpenhar: statusCertidoes.regular && fornecedor.data.status === CONFIG.STATUS.ATIVO,
          certidoes: statusCertidoes
        }
      };
      
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
  
  /**
   * Verifica se fornecedor pode receber empenho
   * @param {string} fornecedorId - ID do fornecedor
   * @returns {Object} Resultado da verificação
   */
  function podeEmpenhar(fornecedorId) {
    try {
      var regularidade = verificarRegularidade(fornecedorId);
    
      if (!regularidade.success) {
        return regularidade;
      }
    
      if (!regularidade.data.podeEmpenhar) {
        var motivos = [];
      
        if (!regularidade.data.regular) {
          if (regularidade.data.certidoes.certidoesVencidas.length > 0) {
            motivos.push('Certidões vencidas: ' + regularidade.data.certidoes.certidoesVencidas.join(', '));
          }
          if (regularidade.data.certidoes.certidoesPendentes.length > 0) {
            motivos.push('Certidões pendentes: ' + regularidade.data.certidoes.certidoesPendentes.join(', '));
          }
        }
      
        if (regularidade.data.fornecedor.status !== CONFIG.STATUS.ATIVO) {
          motivos.push('Status do fornecedor: ' + regularidade.data.fornecedor.status);
        }
      
        return {
          success: true,
          data: {
            podeEmpenhar: false,
            motivos: motivos,
            fornecedor: regularidade.data.fornecedor
          }
        };
      }
    
      return {
        success: true,
        data: {
          podeEmpenhar: true,
          fornecedor: regularidade.data.fornecedor
        }
      };
    } catch (error) {
      Logger.log("Erro em podeEmpenhar: " + error.message);
      throw error;
    }
  }
  
  /**
   * Bloqueia fornecedor
   * @param {string} fornecedorId - ID do fornecedor
   * @param {string} motivo - Motivo do bloqueio
   * @returns {Object} Resultado
   */
  function bloquear(fornecedorId, motivo) {
    if (!fornecedorId) {
      return { success: false, error: 'Fornecedor é obrigatório' };
    }
    
    try {
      var resultado = _updateData(CONFIG.SHEET_NAME, fornecedorId, {
        status: CONFIG.STATUS.BLOQUEADO,
        motivo_bloqueio: motivo || 'Não informado',
        bloqueado_em: new Date().toISOString(),
        bloqueado_por: Session.getActiveUser().getEmail(),
        atualizado_em: new Date().toISOString()
      });
      
      // Auditoria
      if (typeof AuditService !== 'undefined') {
        AuditService.log('FORNECEDOR_BLOQUEADO', {
          fornecedorId: fornecedorId,
          motivo: motivo
        });
      }
      
      return {
        success: true,
        message: 'Fornecedor bloqueado com sucesso'
      };
      
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
  
  /**
   * Desbloqueia fornecedor
   * @param {string} fornecedorId - ID do fornecedor
   * @returns {Object} Resultado
   */
  function desbloquear(fornecedorId) {
    if (!fornecedorId) {
      return { success: false, error: 'Fornecedor é obrigatório' };
    }
    
    try {
      // Verifica certidões antes de desbloquear
      var statusCertidoes = _verificarCertidoes(fornecedorId);
      
      var novoStatus = statusCertidoes.regular ? 
                       CONFIG.STATUS.ATIVO : CONFIG.STATUS.PENDENTE;
      
      var resultado = _updateData(CONFIG.SHEET_NAME, fornecedorId, {
        status: novoStatus,
        motivo_bloqueio: '',
        desbloqueado_em: new Date().toISOString(),
        desbloqueado_por: Session.getActiveUser().getEmail(),
        atualizado_em: new Date().toISOString()
      });
      
      // Auditoria
      if (typeof AuditService !== 'undefined') {
        AuditService.log('FORNECEDOR_DESBLOQUEADO', {
          fornecedorId: fornecedorId,
          novoStatus: novoStatus
        });
      }
      
      return {
        success: true,
        data: { status: novoStatus },
        message: 'Fornecedor desbloqueado. Status: ' + novoStatus
      };
      
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
  
  /**
   * Verifica certidões próximas do vencimento (rotina diária)
   * @returns {Object} Alertas gerados
   */
  function verificarVencimentos() {
    try {
      try {
        var fornecedores = _getData(CONFIG.SHEET_NAME, { ativo: true });
        var alertas = [];
        var bloqueados = [];
      
        fornecedores.forEach(function(fornecedor) {
          var certidoes = _getData(CONFIG.CERTIDOES_SHEET, {
            fornecedor_id: fornecedor.id,
            ativo: true
          });
        
          certidoes.forEach(function(cert) {
            var dias = _diasAteVencimento(cert.data_vencimento);
          
            // Certidão vencida - bloqueia fornecedor
            if (dias < 0) {
              if (fornecedor.status === CONFIG.STATUS.ATIVO) {
                _updateData(CONFIG.SHEET_NAME, fornecedor.id, {
                  status: CONFIG.STATUS.BLOQUEADO,
                  motivo_bloqueio: 'Certidão vencida: ' + cert.nome,
                  atualizado_em: new Date().toISOString()
                });
              
                bloqueados.push({
                  fornecedor: fornecedor.razao_social,
                  certidao: cert.nome,
                  vencida_ha: Math.abs(dias) + ' dias'
                });
              }
            }
            // Alerta de vencimento próximo
            else if (CONFIG.ALERTA_VENCIMENTO.indexOf(dias) !== -1) {
              _enviarAlertaVencimento(fornecedor, cert, dias);
              alertas.push({
                fornecedor: fornecedor.razao_social,
                certidao: cert.nome,
                vence_em: dias + ' dias'
              });
            }
          });
        });
      
        return {
          success: true,
          data: {
            alertasEnviados: alertas.length,
            fornecedoresBloqueados: bloqueados.length,
            alertas: alertas,
            bloqueados: bloqueados,
            verificadoEm: new Date().toISOString()
          }
        };
      
      } catch (e) {
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em verificarVencimentos: " + error.message);
      throw error;
    }
  }
  
  /**
   * Obtém tipos de certidões
   * @returns {Object} Tipos disponíveis
   */
  function getTiposCertidoes() {
    return {
      success: true,
      data: {
        obrigatorias: CONFIG.CERTIDOES_OBRIGATORIAS,
        opcionais: CONFIG.CERTIDOES_OPCIONAIS
      }
    };
  }
  
  /**
   * Obtém tipos de fornecedor
   * @returns {Object} Tipos disponíveis
   */
  function getTiposFornecedor() {
    return {
      success: true,
      data: CONFIG.TIPOS
    };
  }
  
  /**
   * Obtém status possíveis
   * @returns {Object} Status disponíveis
   */
  function getStatusFornecedor() {
    return {
      success: true,
      data: CONFIG.STATUS
    };
  }
  
  // =========================================================================
  // API PÚBLICA DO MÓDULO
  // =========================================================================
  
  return {
    // CRUD Fornecedores
    cadastrar: cadastrar,
    atualizar: atualizar,
    buscarPorId: buscarPorId,
    buscarPorDocumento: buscarPorDocumento,
    listar: listar,
    
    // Certidões
    cadastrarCertidao: cadastrarCertidao,
    listarCertidoes: listarCertidoes,
    
    // Regularidade
    verificarRegularidade: verificarRegularidade,
    podeEmpenhar: podeEmpenhar,
    
    // Bloqueio
    bloquear: bloquear,
    desbloquear: desbloquear,
    
    // Rotinas
    verificarVencimentos: verificarVencimentos,
    
    // Utilitários
    getTiposCertidoes: getTiposCertidoes,
    getTiposFornecedor: getTiposFornecedor,
    getStatusFornecedor: getStatusFornecedor
  };
  
})();

// ============================================================================
// FUNÇÕES GLOBAIS - API para Frontend
// ============================================================================

function api_fornecedor_cadastrar(dados) {
  return SupplierManager.cadastrar(dados);
}

function api_fornecedor_atualizar(id, dados) {
  return SupplierManager.atualizar(id, dados);
}

function api_fornecedor_buscar(id) {
  return SupplierManager.buscarPorId(id);
}

function api_fornecedor_buscarPorDocumento(documento) {
  return SupplierManager.buscarPorDocumento(documento);
}

function api_fornecedor_listar(filtros) {
  return SupplierManager.listar(filtros);
}

function api_fornecedor_cadastrarCertidao(dados) {
  return SupplierManager.cadastrarCertidao(dados);
}

function api_fornecedor_listarCertidoes(fornecedorId) {
  return SupplierManager.listarCertidoes(fornecedorId);
}

function api_fornecedor_verificarRegularidade(fornecedorId) {
  return SupplierManager.verificarRegularidade(fornecedorId);
}

function api_fornecedor_podeEmpenhar(fornecedorId) {
  return SupplierManager.podeEmpenhar(fornecedorId);
}

function api_fornecedor_bloquear(fornecedorId, motivo) {
  return SupplierManager.bloquear(fornecedorId, motivo);
}

function api_fornecedor_desbloquear(fornecedorId) {
  return SupplierManager.desbloquear(fornecedorId);
}

function api_fornecedor_verificarVencimentos() {
  return SupplierManager.verificarVencimentos();
}

function api_fornecedor_getTiposCertidoes() {
  return SupplierManager.getTiposCertidoes();
}

// ============================================================================
// TRIGGER DIÁRIO - Verificação de Vencimentos
// ============================================================================

/**
 * Trigger para verificar vencimentos diariamente
 * Configurar via: Triggers > Adicionar Trigger > verificarVencimentosCertidoes
 */
function verificarVencimentosCertidoes() {
  try {
    var resultado = SupplierManager.verificarVencimentos();
    Logger.log('[SupplierManager] Verificação de vencimentos: ' + JSON.stringify(resultado));
    return resultado;
  } catch (error) {
    Logger.log("Erro em verificarVencimentosCertidoes: " + error.message);
    throw error;
  }
}

// ============================================================================
// REGISTRO DO MÓDULO
// ============================================================================

(function() {
  var moduleName = 'SupplierManager';
  var moduleVersion = '1.0.0';
  
  try {
    if (typeof ServiceContainer !== 'undefined') {
      // Usa registerValue para registrar objeto diretamente (não factory)
      if (typeof ServiceContainer.registerValue === 'function') {
        ServiceContainer.registerValue(moduleName, SupplierManager);
      } else {
        // Fallback: envolve em função factory
        ServiceContainer.register(moduleName, function() { return SupplierManager; }, { singleton: true });
      }
    }
    
    Logger.log('[' + moduleName + ' v' + moduleVersion + '] Módulo carregado');
    Logger.log('[' + moduleName + '] Certidões obrigatórias: CND Federal, Estadual, Municipal, CRF FGTS, CNDT');
    
  } catch (e) {
    console.error('[' + moduleName + '] Erro ao registrar: ' + e.message);
  }
})();
