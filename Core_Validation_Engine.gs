/**
 * @fileoverview Core Validation Engine - Sistema de Validação Unificado
 * @version 1.0.0
 * @author UNIAE CRE Team
 * @created 2026-01-05
 * 
 * Intervenção 1/4: Sistema de Validação Unificado
 * 
 * Inspirado nas boas práticas de backend.txt:
 * - Validação estruturada por tipo (como validateMetaTags, validateKeyboardAccessibility)
 * - Categorização de problemas por severidade (CRITICA, ALTA, MEDIA, BAIXA)
 * - Recomendações automáticas para correção
 * - Integração com sistema de auditoria
 * 
 * @requires V8 Runtime
 */

'use strict';

// ============================================================================
// VALIDATION ENGINE - Sistema de Validação Unificado
// ============================================================================

var ValidationEngine = (function() {
  
  // =========================================================================
  // CONFIGURAÇÃO DE SEVERIDADES
  // =========================================================================
  
  var SEVERIDADES = {
    CRITICA: { peso: 100, cor: '#D32F2F', label: 'Crítica' },
    ALTA: { peso: 75, cor: '#F57C00', label: 'Alta' },
    MEDIA: { peso: 50, cor: '#FBC02D', label: 'Média' },
    BAIXA: { peso: 25, cor: '#388E3C', label: 'Baixa' }
  };
  
  // =========================================================================
  // REGRAS DE VALIDAÇÃO POR ENTIDADE
  // =========================================================================
  
  var REGRAS = {
    // -----------------------------------------------------------------------
    // NOTAS FISCAIS
    // -----------------------------------------------------------------------
    NotasFiscais: {
      numero_nf: {
        obrigatorio: true,
        tipo: 'string',
        minLength: 1,
        maxLength: 20,
        pattern: /^\d+$/,
        severidade: 'CRITICA',
        mensagem: 'Número da NF é obrigatório e deve conter apenas dígitos',
        recomendacao: 'Informe o número da nota fiscal sem caracteres especiais'
      },
      chave_acesso: {
        obrigatorio: false,
        tipo: 'string',
        length: 44,
        pattern: /^\d{44}$/,
        severidade: 'ALTA',
        mensagem: 'Chave de acesso deve ter exatamente 44 dígitos',
        recomendacao: 'Verifique a chave de acesso no DANFE da nota fiscal'
      },
      valor_total: {
        obrigatorio: true,
        tipo: 'number',
        min: 0.01,
        severidade: 'CRITICA',
        mensagem: 'Valor total deve ser maior que zero',
        recomendacao: 'Informe o valor total da nota fiscal'
      },
      data_emissao: {
        obrigatorio: true,
        tipo: 'date',
        maxDate: 'hoje',
        severidade: 'ALTA',
        mensagem: 'Data de emissão é obrigatória e não pode ser futura',
        recomendacao: 'Verifique a data de emissão no documento fiscal'
      },
      fornecedor_id: {
        obrigatorio: true,
        tipo: 'reference',
        referencia: 'Fornecedores',
        severidade: 'CRITICA',
        mensagem: 'Fornecedor é obrigatório',
        recomendacao: 'Selecione um fornecedor cadastrado no sistema'
      },
      cnpj_emitente: {
        obrigatorio: true,
        tipo: 'cnpj',
        severidade: 'CRITICA',
        mensagem: 'CNPJ do emitente é obrigatório e deve ser válido',
        recomendacao: 'Informe o CNPJ completo com 14 dígitos'
      }
    },
    
    // -----------------------------------------------------------------------
    // FORNECEDORES
    // -----------------------------------------------------------------------
    Fornecedores: {
      cnpj: {
        obrigatorio: true,
        tipo: 'cnpj',
        unico: true,
        severidade: 'CRITICA',
        mensagem: 'CNPJ é obrigatório, deve ser válido e único',
        recomendacao: 'Verifique o CNPJ na Receita Federal'
      },
      razao_social: {
        obrigatorio: true,
        tipo: 'string',
        minLength: 3,
        maxLength: 200,
        severidade: 'CRITICA',
        mensagem: 'Razão social é obrigatória',
        recomendacao: 'Informe a razão social conforme cadastro na Receita'
      },
      email: {
        obrigatorio: true,
        tipo: 'email',
        severidade: 'ALTA',
        mensagem: 'Email é obrigatório e deve ser válido',
        recomendacao: 'Informe um email válido para contato'
      },
      telefone: {
        obrigatorio: false,
        tipo: 'telefone',
        severidade: 'MEDIA',
        mensagem: 'Telefone deve estar em formato válido',
        recomendacao: 'Use formato (XX) XXXXX-XXXX ou (XX) XXXX-XXXX'
      }
    },
    
    // -----------------------------------------------------------------------
    // ENTREGAS
    // -----------------------------------------------------------------------
    Entregas: {
      fornecedor_id: {
        obrigatorio: true,
        tipo: 'reference',
        referencia: 'Fornecedores',
        severidade: 'CRITICA',
        mensagem: 'Fornecedor é obrigatório',
        recomendacao: 'Selecione o fornecedor responsável pela entrega'
      },
      escola_id: {
        obrigatorio: true,
        tipo: 'reference',
        referencia: 'Escolas',
        severidade: 'CRITICA',
        mensagem: 'Escola é obrigatória',
        recomendacao: 'Selecione a escola de destino'
      },
      data_prevista: {
        obrigatorio: true,
        tipo: 'date',
        severidade: 'ALTA',
        mensagem: 'Data prevista é obrigatória',
        recomendacao: 'Informe a data prevista para entrega'
      },
      status: {
        obrigatorio: true,
        tipo: 'enum',
        valores: ['Agendada', 'Em Trânsito', 'Entregue', 'Entregue Parcial', 'Recusada', 'Cancelada'],
        severidade: 'ALTA',
        mensagem: 'Status deve ser um valor válido',
        recomendacao: 'Selecione um status válido da lista'
      }
    },
    
    // -----------------------------------------------------------------------
    // USUÁRIOS
    // -----------------------------------------------------------------------
    Usuarios: {
      nome: {
        obrigatorio: true,
        tipo: 'string',
        minLength: 3,
        maxLength: 100,
        severidade: 'CRITICA',
        mensagem: 'Nome é obrigatório (mínimo 3 caracteres)',
        recomendacao: 'Informe o nome completo do usuário'
      },
      email: {
        obrigatorio: true,
        tipo: 'email',
        unico: true,
        severidade: 'CRITICA',
        mensagem: 'Email é obrigatório, deve ser válido e único',
        recomendacao: 'Use um email institucional válido'
      },
      perfil: {
        obrigatorio: true,
        tipo: 'enum',
        valores: ['ADMIN', 'GESTOR', 'FISCAL', 'OPERADOR', 'CONSULTA'],
        severidade: 'CRITICA',
        mensagem: 'Perfil deve ser um valor válido',
        recomendacao: 'Selecione o perfil de acesso adequado'
      },
      senha: {
        obrigatorio: true,
        tipo: 'senha',
        minLength: 8,
        severidade: 'CRITICA',
        mensagem: 'Senha deve ter no mínimo 8 caracteres',
        recomendacao: 'Use letras, números e caracteres especiais'
      }
    },
    
    // -----------------------------------------------------------------------
    // EMPENHOS
    // -----------------------------------------------------------------------
    Empenhos: {
      numero_empenho: {
        obrigatorio: true,
        tipo: 'string',
        pattern: /^\d{4}NE\d{6}$/,
        severidade: 'CRITICA',
        mensagem: 'Número do empenho deve seguir formato AAAANEXXXXXX',
        recomendacao: 'Ex: 2025NE000123'
      },
      valor_total: {
        obrigatorio: true,
        tipo: 'number',
        min: 0.01,
        severidade: 'CRITICA',
        mensagem: 'Valor do empenho deve ser maior que zero',
        recomendacao: 'Informe o valor total empenhado'
      },
      fornecedor_id: {
        obrigatorio: true,
        tipo: 'reference',
        referencia: 'Fornecedores',
        severidade: 'CRITICA',
        mensagem: 'Fornecedor é obrigatório',
        recomendacao: 'Selecione o fornecedor do empenho'
      },
      data_empenho: {
        obrigatorio: true,
        tipo: 'date',
        maxDate: 'hoje',
        severidade: 'ALTA',
        mensagem: 'Data do empenho não pode ser futura',
        recomendacao: 'Verifique a data no documento de empenho'
      }
    }
  };
  
  // =========================================================================
  // VALIDADORES DE TIPO
  // =========================================================================
  
  var Validadores = {
    
    string: function(valor, regra) {
      if (typeof valor !== 'string') return false;
      if (regra.minLength && valor.length < regra.minLength) return false;
      if (regra.maxLength && valor.length > regra.maxLength) return false;
      if (regra.length && valor.length !== regra.length) return false;
      if (regra.pattern && !regra.pattern.test(valor)) return false;
      return true;
    },
    
    number: function(valor, regra) {
      try {
        if (valor === null || valor === undefined) return false;
        if (typeof valor !== 'number' && typeof valor !== 'string') return false;
        if (typeof valor === 'string' && valor.trim() === '') return false;
        var num = typeof valor === 'number' ? valor : Number(valor.trim());
        if (!isFinite(num)) return false;
        if (regra.min !== undefined && num < regra.min) return false;
        if (regra.max !== undefined && num > regra.max) return false;
        return true;
      } catch (error) {
        Logger.log("Erro em number: " + error.message);
        throw error;
      }
    },
    
    date: function(valor, regra) {
      var data = valor instanceof Date ? valor : new Date(valor);
      if (isNaN(data.getTime())) return false;
      
      var hoje = new Date();
      hoje.setHours(23, 59, 59, 999);
      
      if (regra.maxDate === 'hoje' && data > hoje) return false;
      if (regra.minDate === 'hoje' && data < new Date().setHours(0, 0, 0, 0)) return false;
      
      return true;
    },
    
    email: function(valor) {
      if (!valor || typeof valor !== 'string') return false;
      var pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return pattern.test(valor);
    },
    
    cnpj: function(valor) {
      try {
        if (!valor) return false;
        var cnpj = String(valor).replace(/[^\d]/g, '');
        if (cnpj.length !== 14) return false;
      
        // Validação de dígitos verificadores
        if (/^(\d)\1+$/.test(cnpj)) return false;
      
        var tamanho = cnpj.length - 2;
        var numeros = cnpj.substring(0, tamanho);
        var digitos = cnpj.substring(tamanho);
        var soma = 0;
        var pos = tamanho - 7;
      
        for (var i = tamanho; i >= 1; i--) {
          soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
          if (pos < 2) pos = 9;
        }
      
        var resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
        if (resultado !== parseInt(digitos.charAt(0))) return false;
      
        tamanho = tamanho + 1;
        numeros = cnpj.substring(0, tamanho);
        soma = 0;
        pos = tamanho - 7;
      
        for (var j = tamanho; j >= 1; j--) {
          soma += parseInt(numeros.charAt(tamanho - j)) * pos--;
          if (pos < 2) pos = 9;
        }
      
        resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
        return resultado === parseInt(digitos.charAt(1));
      } catch (error) {
        Logger.log("Erro em cnpj: " + error.message);
        throw error;
      }
    },
    
    telefone: function(valor) {
      try {
        if (!valor) return true; // Opcional
        var tel = String(valor).replace(/[^\d]/g, '');
        return tel.length >= 10 && tel.length <= 11;
      } catch (error) {
        Logger.log("Erro em telefone: " + error.message);
        throw error;
      }
    },
    
    enum: function(valor, regra) {
      if (!regra.valores || !Array.isArray(regra.valores)) return false;
      return regra.valores.indexOf(valor) !== -1;
    },
    
    reference: function(valor, regra) {
      // Validação básica - verificar se existe
      return valor !== null && valor !== undefined && valor !== '';
    },
    
    senha: function(valor, regra) {
      if (!valor || typeof valor !== 'string') return false;
      if (regra.minLength && valor.length < regra.minLength) return false;
      return true;
    }
  };
  
  // =========================================================================
  // FUNÇÕES PRIVADAS
  // =========================================================================
  
  /**
   * Valida um campo específico
   * @private
   */
  function _validarCampo(valor, regra, campo) {
    try {
      var problemas = [];
    
      // Verifica obrigatoriedade
      var vazio = valor === null || valor === undefined || valor === '';
      if (regra.obrigatorio && vazio) {
        problemas.push({
          campo: campo,
          severidade: regra.severidade || 'ALTA',
          tipo: 'CAMPO_OBRIGATORIO',
          mensagem: regra.mensagem || 'Campo ' + campo + ' é obrigatório',
          recomendacao: regra.recomendacao || 'Preencha o campo ' + campo
        });
        return problemas;
      }
    
      // Se vazio e não obrigatório, OK
      if (vazio) return problemas;
    
      // Valida tipo
      var validador = Validadores[regra.tipo];
      if (validador && !validador(valor, regra)) {
        problemas.push({
          campo: campo,
          severidade: regra.severidade || 'MEDIA',
          tipo: 'VALOR_INVALIDO',
          mensagem: regra.mensagem || 'Valor inválido para ' + campo,
          recomendacao: regra.recomendacao || 'Verifique o formato do campo ' + campo,
          valorAtual: valor
        });
      }
    
      return problemas;
    } catch (error) {
      Logger.log("Erro em _validarCampo: " + error.message);
      throw error;
    }
  }
  
  // =========================================================================
  // API PÚBLICA
  // =========================================================================
  
  return {
    
    SEVERIDADES: SEVERIDADES,
    REGRAS: REGRAS,
    
    /**
     * Valida dados de uma entidade
     * @param {string} entidade - Nome da entidade (ex: 'NotasFiscais')
     * @param {Object} dados - Dados a validar
     * @param {Object} [opcoes] - Opções de validação
     * @returns {Object} Resultado da validação
     */
    validar: function(entidade, dados, opcoes) {
      try {
        opcoes = opcoes || {};
      
        var resultado = {
          valido: true,
          entidade: entidade,
          timestamp: new Date().toISOString(),
          problemas: [],
          resumo: {
            total: 0,
            por_severidade: { CRITICA: 0, ALTA: 0, MEDIA: 0, BAIXA: 0 }
          }
        };
      
        try {
          var regras = REGRAS[entidade];
          if (!regras) {
            return {
              valido: false,
              erro: 'Entidade "' + entidade + '" não possui regras de validação definidas'
            };
          }
        
          // Valida cada campo com regra definida
          for (var campo in regras) {
            if (regras.hasOwnProperty(campo)) {
              var valor = dados[campo];
              var regra = regras[campo];
            
              // Pula campos se modo parcial e campo não fornecido
              if (opcoes.parcial && !dados.hasOwnProperty(campo)) continue;
            
              var problemasCampo = _validarCampo(valor, regra, campo);
            
              problemasCampo.forEach(function(p) {
                resultado.problemas.push(p);
                resultado.resumo.total++;
                resultado.resumo.por_severidade[p.severidade]++;
              
                if (p.severidade === 'CRITICA') {
                  resultado.valido = false;
                }
              });
            }
          }
        
          // Validações customizadas
          if (opcoes.validacoesCustom && Array.isArray(opcoes.validacoesCustom)) {
            opcoes.validacoesCustom.forEach(function(validacao) {
              if (typeof validacao === 'function') {
                var problemaCustom = validacao(dados);
                if (problemaCustom) {
                  resultado.problemas.push(problemaCustom);
                  resultado.resumo.total++;
                  resultado.resumo.por_severidade[problemaCustom.severidade || 'MEDIA']++;
                }
              }
            });
          }
        
          // Score de qualidade (0-100)
          var pesoTotal = 0;
          resultado.problemas.forEach(function(p) {
            pesoTotal += SEVERIDADES[p.severidade].peso;
          });
          resultado.score = Math.max(0, 100 - pesoTotal);
        
        } catch (error) {
          resultado.valido = false;
          resultado.erro = error.message;
        }
      
        return resultado;
      } catch (error) {
        Logger.log("Erro em validar: " + error.message);
        throw error;
      }
    },
    
    /**
     * Valida múltiplos registros
     * @param {string} entidade - Nome da entidade
     * @param {Array} registros - Array de registros
     * @returns {Object} Resultado consolidado
     */
    validarLote: function(entidade, registros) {
      try {
        var resultado = {
          total: registros.length,
          validos: 0,
          invalidos: 0,
          detalhes: []
        };
      
        for (var i = 0; i < registros.length; i++) {
          var validacao = this.validar(entidade, registros[i]);
        
          if (validacao.valido) {
            resultado.validos++;
          } else {
            resultado.invalidos++;
          }
        
          resultado.detalhes.push({
            indice: i,
            valido: validacao.valido,
            problemas: validacao.problemas
          });
        }
      
        resultado.percentualValido = Math.round((resultado.validos / resultado.total) * 100);
      
        return resultado;
      } catch (error) {
        Logger.log("Erro em validarLote: " + error.message);
        throw error;
      }
    },
    
    /**
     * Obtém regras de uma entidade
     * @param {string} entidade - Nome da entidade
     * @returns {Object} Regras da entidade
     */
    getRegras: function(entidade) {
      return REGRAS[entidade] || null;
    },
    
    /**
     * Adiciona regra customizada
     * @param {string} entidade - Nome da entidade
     * @param {string} campo - Nome do campo
     * @param {Object} regra - Configuração da regra
     */
    adicionarRegra: function(entidade, campo, regra) {
      if (!REGRAS[entidade]) {
        REGRAS[entidade] = {};
      }
      REGRAS[entidade][campo] = regra;
    },
    
    /**
     * Valida CNPJ isoladamente
     * @param {string} cnpj - CNPJ a validar
     * @returns {boolean} True se válido
     */
    validarCNPJ: function(cnpj) {
      return Validadores.cnpj(cnpj);
    },
    
    /**
     * Valida email isoladamente
     * @param {string} email - Email a validar
     * @returns {boolean} True se válido
     */
    validarEmail: function(email) {
      return Validadores.email(email);
    }
  };
})();

// ============================================================================
// REGISTRO DO MÓDULO
// ============================================================================

Logger.log('✅ Core_Validation_Engine.gs carregado - ValidationEngine disponível');
