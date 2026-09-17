/**
 * @fileoverview Validação Especializada - Alimentação Escolar CRE-PP
 * @version 1.0.0
 * 
 * Intervenção 8/38: Utilitários de Formatação e Validação (Prompt 8)
 * 
 * Funções utilitárias especializadas para:
 * - Validação de validade de produtos alimentícios
 * - Cálculos nutricionais básicos (PNAE)
 * - Validação de documentos fiscais
 * - Regras específicas da alimentação escolar
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-25
 */

'use strict';

// ============================================================================
// VALIDAÇÃO ALIMENTAÇÃO ESCOLAR
// ============================================================================

var ValidacaoAE = (function() {
  
  // =========================================================================
  // CONFIGURAÇÃO - REGRAS PNAE
  // =========================================================================
  
  var REGRAS_PNAE = {
    // Percentuais mínimos por grupo alimentar (semanal)
    PERCENTUAIS_MINIMOS: {
      frutas: 0.15,           // 15% mínimo de frutas
      hortalicas: 0.15,       // 15% mínimo de hortaliças
      proteinas: 0.20,        // 20% mínimo de proteínas
      cereais: 0.25           // 25% mínimo de cereais/grãos
    },
    
    // Limites máximos
    LIMITES_MAXIMOS: {
      acucar_adicionado: 0.10,    // Máx 10% de açúcar adicionado
      sodio_mg_refeicao: 400,     // Máx 400mg sódio por refeição
      gordura_saturada: 0.10,     // Máx 10% gordura saturada
      ultraprocessados: 0.00      // 0% ultraprocessados (proibido)
    },

    // Calorias por faixa etária (kcal/refeição)
    CALORIAS_REFERENCIA: {
      creche_0_11m: 200,
      creche_1_3a: 300,
      creche_4_5a: 270,
      fundamental_6_10a: 300,
      fundamental_11_15a: 435,
      medio_16_18a: 435,
      eja_adulto: 435,
      integral_creche: 700,
      integral_fundamental: 1000
    },
    
    // Dias mínimos de validade para aceitar produto
    VALIDADE_MINIMA_DIAS: {
      leite_uht: 30,
      leite_pasteurizado: 5,
      iogurte: 15,
      queijo_fresco: 7,
      queijo_maturado: 30,
      carnes_congeladas: 60,
      carnes_resfriadas: 3,
      ovos: 21,
      frutas_frescas: 3,
      hortalicas_frescas: 2,
      graos_secos: 180,
      enlatados: 365,
      farinaceos: 180,
      oleos: 365,
      congelados: 90,
      default: 30
    },
    
    // Temperaturas de recebimento (°C)
    TEMPERATURAS: {
      congelados: { min: -18, max: -12 },
      resfriados: { min: 0, max: 5 },
      carnes_resfriadas: { min: 0, max: 4 },
      laticinios: { min: 0, max: 7 },
      hortifruti: { min: 5, max: 12 },
      ambiente: { min: 15, max: 25 }
    }
  };

  // =========================================================================
  // GRUPOS ALIMENTARES
  // =========================================================================
  
  var GRUPOS_ALIMENTARES = {
    FRUTAS: ['banana', 'maçã', 'laranja', 'mamão', 'melancia', 'manga', 'abacaxi', 'uva', 'morango', 'pera', 'melão', 'goiaba', 'acerola', 'tangerina'],
    HORTALICAS: ['alface', 'tomate', 'cenoura', 'beterraba', 'chuchu', 'abobrinha', 'pepino', 'repolho', 'couve', 'brócolis', 'espinafre', 'abóbora', 'batata', 'mandioca', 'inhame'],
    PROTEINAS: ['carne bovina', 'frango', 'peixe', 'ovo', 'feijão', 'lentilha', 'grão de bico', 'soja', 'carne suína', 'fígado'],
    CEREAIS: ['arroz', 'macarrão', 'pão', 'farinha', 'aveia', 'milho', 'fubá', 'trigo', 'cuscuz', 'tapioca'],
    LATICINIOS: ['leite', 'queijo', 'iogurte', 'requeijão', 'manteiga', 'creme de leite'],
    ULTRAPROCESSADOS: ['biscoito recheado', 'salgadinho', 'refrigerante', 'suco artificial', 'embutido', 'salsicha', 'nuggets', 'macarrão instantâneo', 'sorvete industrial']
  };
  
  // =========================================================================
  // VALIDAÇÃO DE VALIDADE DE PRODUTOS
  // =========================================================================
  
  /**
   * Valida se produto está dentro da validade mínima aceitável
   * @param {Date|string} dataValidade - Data de validade do produto
   * @param {string} tipoProduto - Tipo do produto
   * @param {Date} [dataReferencia] - Data de referência (default: hoje)
   * @returns {Object} Resultado da validação
   */
  function validarValidade(dataValidade, tipoProduto, dataReferencia) {
    try {
      dataReferencia = dataReferencia || new Date();
    
      if (!dataValidade) {
        return {
          valido: false,
          erro: 'Data de validade não informada',
          codigo: 'VALIDADE_AUSENTE'
        };
      }
    
      var validade = new Date(dataValidade);
      var hoje = new Date(dataReferencia);
      hoje.setHours(0, 0, 0, 0);
      validade.setHours(0, 0, 0, 0);
    
      // Verifica se já venceu
      if (validade < hoje) {
        return {
          valido: false,
          erro: 'Produto VENCIDO',
          codigo: 'PRODUTO_VENCIDO',
          diasVencido: Math.ceil((hoje - validade) / (1000 * 60 * 60 * 24))
        };
      }

      // Calcula dias até vencer
      var diasAteVencer = Math.ceil((validade - hoje) / (1000 * 60 * 60 * 24));
    
      // Obtém validade mínima para o tipo de produto
      var tipoNormalizado = (tipoProduto || 'default').toLowerCase().replace(/\s+/g, '_');
      var validadeMinima = REGRAS_PNAE.VALIDADE_MINIMA_DIAS[tipoNormalizado] 
                        || REGRAS_PNAE.VALIDADE_MINIMA_DIAS.default;
    
      if (diasAteVencer < validadeMinima) {
        return {
          valido: false,
          erro: 'Validade insuficiente. Mínimo: ' + validadeMinima + ' dias. Atual: ' + diasAteVencer + ' dias',
          codigo: 'VALIDADE_INSUFICIENTE',
          diasAteVencer: diasAteVencer,
          minimoExigido: validadeMinima
        };
      }
    
      // Alerta se próximo do limite
      var alertaProximidade = diasAteVencer <= (validadeMinima * 1.5);
    
      return {
        valido: true,
        diasAteVencer: diasAteVencer,
        minimoExigido: validadeMinima,
        alerta: alertaProximidade ? 'Produto próximo da validade mínima' : null,
        codigo: alertaProximidade ? 'VALIDADE_ALERTA' : 'VALIDADE_OK'
      };
    } catch (error) {
      Logger.log("Erro em validarValidade: " + error.message);
      throw error;
    }
  }
  
  // =========================================================================
  // VALIDAÇÃO DE TEMPERATURA
  // =========================================================================
  
  /**
   * Valida temperatura de recebimento do produto
   * @param {number} temperatura - Temperatura medida (°C)
   * @param {string} categoriaProduto - Categoria do produto
   * @returns {Object} Resultado da validação
   */
  function validarTemperatura(temperatura, categoriaProduto) {
    try {
      if (temperatura === undefined || temperatura === null) {
        return {
          valido: false,
          erro: 'Temperatura não informada',
          codigo: 'TEMP_AUSENTE'
        };
      }
    
      var temp = Number(temperatura);
      if (isNaN(temp)) {
        return {
          valido: false,
          erro: 'Temperatura inválida',
          codigo: 'TEMP_INVALIDA'
        };
      }
    
      var categoria = (categoriaProduto || 'ambiente').toLowerCase();
      var faixa = REGRAS_PNAE.TEMPERATURAS[categoria] || REGRAS_PNAE.TEMPERATURAS.ambiente;
    
      if (temp < faixa.min) {
        return {
          valido: false,
          erro: 'Temperatura muito baixa. Mínimo: ' + faixa.min + '°C. Medido: ' + temp + '°C',
          codigo: 'TEMP_BAIXA',
          temperatura: temp,
          faixaEsperada: faixa
        };
      }
    
      if (temp > faixa.max) {
        return {
          valido: false,
          erro: 'Temperatura muito alta. Máximo: ' + faixa.max + '°C. Medido: ' + temp + '°C',
          codigo: 'TEMP_ALTA',
          temperatura: temp,
          faixaEsperada: faixa
        };
      }
    
      return {
        valido: true,
        temperatura: temp,
        faixaEsperada: faixa,
        codigo: 'TEMP_OK'
      };
    } catch (error) {
      Logger.log("Erro em validarTemperatura: " + error.message);
      throw error;
    }
  }

  // =========================================================================
  // CÁLCULOS NUTRICIONAIS BÁSICOS
  // =========================================================================
  
  /**
   * Calcula valor calórico total de uma refeição
   * @param {Array} itens - Lista de itens [{nome, quantidade_g, calorias_100g}]
   * @returns {Object} Resultado com calorias totais
   */
  function calcularCalorias(itens) {
    try {
      if (!itens || !Array.isArray(itens) || itens.length === 0) {
        return { total: 0, itens: [] };
      }
    
      var total = 0;
      var detalhes = [];
    
      itens.forEach(function(item) {
        var quantidade = Number(item.quantidade_g) || 0;
        var calorias100g = Number(item.calorias_100g) || 0;
        var caloriasItem = (quantidade / 100) * calorias100g;
      
        total += caloriasItem;
        detalhes.push({
          nome: item.nome,
          quantidade_g: quantidade,
          calorias: Math.round(caloriasItem)
        });
      });
    
      return {
        total: Math.round(total),
        itens: detalhes
      };
    } catch (error) {
      Logger.log("Erro em calcularCalorias: " + error.message);
      throw error;
    }
  }
  
  /**
   * Valida se cardápio atende requisitos calóricos por faixa etária
   * @param {number} caloriasRefeicao - Calorias da refeição
   * @param {string} faixaEtaria - Faixa etária dos alunos
   * @param {string} [tipoRefeicao] - Tipo: 'parcial' ou 'integral'
   * @returns {Object} Resultado da validação
   */
  function validarCaloriasPorFaixa(caloriasRefeicao, faixaEtaria, tipoRefeicao) {
    try {
      tipoRefeicao = tipoRefeicao || 'parcial';
    
      var faixaNormalizada = (faixaEtaria || '').toLowerCase().replace(/\s+/g, '_');
    
      // Mapeia faixa etária para chave de referência
      var chaveReferencia = faixaNormalizada;
      if (tipoRefeicao === 'integral') {
        if (faixaNormalizada.indexOf('creche') !== -1) {
          chaveReferencia = 'integral_creche';
        } else {
          chaveReferencia = 'integral_fundamental';
        }
      }
    
      var referencia = REGRAS_PNAE.CALORIAS_REFERENCIA[chaveReferencia];
      if (!referencia) {
        // Tenta encontrar correspondência parcial
        for (var key in REGRAS_PNAE.CALORIAS_REFERENCIA) {
          if (key.indexOf(faixaNormalizada) !== -1 || faixaNormalizada.indexOf(key) !== -1) {
            referencia = REGRAS_PNAE.CALORIAS_REFERENCIA[key];
            break;
          }
        }
      }
    
      if (!referencia) {
        referencia = 300; // Default
      }
    
      var percentual = (caloriasRefeicao / referencia) * 100;
      var toleranciaMin = 0.85; // 85% do mínimo
      var toleranciaMax = 1.15; // 115% do máximo
    
      var resultado = {
        calorias: caloriasRefeicao,
        referencia: referencia,
        percentual: Math.round(percentual),
        faixaEtaria: faixaEtaria
      };
    
      if (caloriasRefeicao < referencia * toleranciaMin) {
        resultado.valido = false;
        resultado.erro = 'Calorias abaixo do mínimo (' + Math.round(referencia * toleranciaMin) + ' kcal)';
        resultado.codigo = 'CALORIAS_INSUFICIENTES';
      } else if (caloriasRefeicao > referencia * toleranciaMax) {
        resultado.valido = false;
        resultado.erro = 'Calorias acima do máximo (' + Math.round(referencia * toleranciaMax) + ' kcal)';
        resultado.codigo = 'CALORIAS_EXCESSIVAS';
      } else {
        resultado.valido = true;
        resultado.codigo = 'CALORIAS_OK';
      }
    
      return resultado;
    } catch (error) {
      Logger.log("Erro em validarCaloriasPorFaixa: " + error.message);
      throw error;
    }
  }

  // =========================================================================
  // VALIDAÇÃO DE COMPOSIÇÃO DO CARDÁPIO (PNAE)
  // =========================================================================
  
  /**
   * Identifica grupo alimentar de um item
   * @param {string} nomeItem - Nome do item
   * @returns {string} Grupo alimentar
   */
  function identificarGrupoAlimentar(nomeItem) {
    if (!nomeItem) return 'outros';
    
    var nome = nomeItem.toLowerCase();
    
    for (var grupo in GRUPOS_ALIMENTARES) {
      var itens = GRUPOS_ALIMENTARES[grupo];
      for (var i = 0; i < itens.length; i++) {
        if (nome.indexOf(itens[i]) !== -1) {
          return grupo.toLowerCase();
        }
      }
    }
    
    return 'outros';
  }
  
  /**
   * Valida composição do cardápio semanal conforme PNAE
   * @param {Array} cardapioSemanal - Array de refeições da semana
   * @returns {Object} Resultado da validação
   */
  function validarComposicaoCardapio(cardapioSemanal) {
    try {
      if (!cardapioSemanal || !Array.isArray(cardapioSemanal)) {
        return {
          valido: false,
          erro: 'Cardápio não informado',
          codigo: 'CARDAPIO_AUSENTE'
        };
      }
    
      // Conta itens por grupo
      var contagem = {
        frutas: 0,
        hortalicas: 0,
        proteinas: 0,
        cereais: 0,
        laticinios: 0,
        ultraprocessados: 0,
        outros: 0,
        total: 0
      };
    
      cardapioSemanal.forEach(function(refeicao) {
        var itens = refeicao.itens || refeicao;
        if (!Array.isArray(itens)) itens = [itens];
      
        itens.forEach(function(item) {
          var nome = typeof item === 'string' ? item : (item.nome || item.item);
          var grupo = identificarGrupoAlimentar(nome);
          contagem[grupo] = (contagem[grupo] || 0) + 1;
          contagem.total++;
        });
      });
    
      // Calcula percentuais
      var percentuais = {};
      for (var grupo in contagem) {
        if (grupo !== 'total') {
          percentuais[grupo] = contagem.total > 0 ? contagem[grupo] / contagem.total : 0;
        }
      }
    
      // Valida contra regras PNAE
      var alertas = [];
      var erros = [];
    
      // Verifica mínimos
      for (var grupoMin in REGRAS_PNAE.PERCENTUAIS_MINIMOS) {
        var minimo = REGRAS_PNAE.PERCENTUAIS_MINIMOS[grupoMin];
        var atual = percentuais[grupoMin] || 0;
      
        if (atual < minimo) {
          alertas.push({
            grupo: grupoMin,
            atual: Math.round(atual * 100) + '%',
            minimo: Math.round(minimo * 100) + '%',
            mensagem: grupoMin.charAt(0).toUpperCase() + grupoMin.slice(1) + ' abaixo do mínimo PNAE'
          });
        }
      }
    
      // Verifica ultraprocessados (proibido)
      if (contagem.ultraprocessados > 0) {
        erros.push({
          grupo: 'ultraprocessados',
          quantidade: contagem.ultraprocessados,
          mensagem: 'PROIBIDO: Ultraprocessados detectados no cardápio'
        });
      }
    
      return {
        valido: erros.length === 0,
        contagem: contagem,
        percentuais: percentuais,
        alertas: alertas,
        erros: erros,
        codigo: erros.length > 0 ? 'CARDAPIO_INVALIDO' : (alertas.length > 0 ? 'CARDAPIO_ALERTA' : 'CARDAPIO_OK')
      };
    } catch (error) {
      Logger.log("Erro em validarComposicaoCardapio: " + error.message);
      throw error;
    }
  }

  // =========================================================================
  // VALIDAÇÃO DE DOCUMENTOS FISCAIS
  // =========================================================================
  
  /**
   * Valida chave de acesso da NF-e (44 dígitos)
   * @param {string} chave - Chave de acesso
   * @returns {Object} Resultado da validação
   */
  function validarChaveNFe(chave) {
    try {
      if (!chave) {
        return { valido: false, erro: 'Chave não informada', codigo: 'CHAVE_AUSENTE' };
      }
    
      var chaveNumerica = String(chave).replace(/\D/g, '');
    
      if (chaveNumerica.length !== 44) {
        return {
          valido: false,
          erro: 'Chave deve ter 44 dígitos. Informado: ' + chaveNumerica.length,
          codigo: 'CHAVE_TAMANHO_INVALIDO'
        };
      }
    
      // Extrai informações da chave
      var info = {
        uf: chaveNumerica.substring(0, 2),
        anoMes: chaveNumerica.substring(2, 6),
        cnpj: chaveNumerica.substring(6, 20),
        modelo: chaveNumerica.substring(20, 22),
        serie: chaveNumerica.substring(22, 25),
        numero: chaveNumerica.substring(25, 34),
        tipoEmissao: chaveNumerica.substring(34, 35),
        codigoNumerico: chaveNumerica.substring(35, 43),
        digitoVerificador: chaveNumerica.substring(43, 44)
      };
    
      // Valida dígito verificador (módulo 11)
      var soma = 0;
      var peso = 2;
      for (var i = 42; i >= 0; i--) {
        soma += parseInt(chaveNumerica.charAt(i)) * peso;
        peso = peso === 9 ? 2 : peso + 1;
      }
      var resto = soma % 11;
      var dvCalculado = resto < 2 ? 0 : 11 - resto;
    
      if (dvCalculado !== parseInt(info.digitoVerificador)) {
        return {
          valido: false,
          erro: 'Dígito verificador inválido',
          codigo: 'CHAVE_DV_INVALIDO',
          info: info
        };
      }
    
      // Valida modelo (55 = NF-e, 65 = NFC-e)
      if (info.modelo !== '55' && info.modelo !== '65') {
        return {
          valido: false,
          erro: 'Modelo de documento inválido: ' + info.modelo,
          codigo: 'CHAVE_MODELO_INVALIDO',
          info: info
        };
      }
    
      return {
        valido: true,
        info: info,
        chaveFormatada: chaveNumerica.replace(/(\d{4})/g, '$1 ').trim(),
        codigo: 'CHAVE_OK'
      };
    } catch (error) {
      Logger.log("Erro em validarChaveNFe: " + error.message);
      throw error;
    }
  }
  
  /**
   * Valida CNPJ
   * @param {string} cnpj - CNPJ a validar
   * @returns {Object} Resultado da validação
   */
  function validarCNPJ(cnpj) {
    try {
      if (!cnpj) {
        return { valido: false, erro: 'CNPJ não informado', codigo: 'CNPJ_AUSENTE' };
      }
    
      var cnpjNumerico = String(cnpj).replace(/\D/g, '');
    
      if (cnpjNumerico.length !== 14) {
        return {
          valido: false,
          erro: 'CNPJ deve ter 14 dígitos',
          codigo: 'CNPJ_TAMANHO_INVALIDO'
        };
      }
    
      // Verifica se todos os dígitos são iguais
      if (/^(\d)\1+$/.test(cnpjNumerico)) {
        return { valido: false, erro: 'CNPJ inválido', codigo: 'CNPJ_INVALIDO' };
      }
    
      // Calcula dígitos verificadores
      var tamanho = cnpjNumerico.length - 2;
      var numeros = cnpjNumerico.substring(0, tamanho);
      var digitos = cnpjNumerico.substring(tamanho);
      var soma = 0;
      var pos = tamanho - 7;
    
      for (var i = tamanho; i >= 1; i--) {
        soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
        if (pos < 2) pos = 9;
      }
    
      var resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
      if (resultado !== parseInt(digitos.charAt(0))) {
        return { valido: false, erro: 'CNPJ inválido', codigo: 'CNPJ_DV1_INVALIDO' };
      }
    
      tamanho = tamanho + 1;
      numeros = cnpjNumerico.substring(0, tamanho);
      soma = 0;
      pos = tamanho - 7;
    
      for (var j = tamanho; j >= 1; j--) {
        soma += parseInt(numeros.charAt(tamanho - j)) * pos--;
        if (pos < 2) pos = 9;
      }
    
      resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
      if (resultado !== parseInt(digitos.charAt(1))) {
        return { valido: false, erro: 'CNPJ inválido', codigo: 'CNPJ_DV2_INVALIDO' };
      }
    
      return {
        valido: true,
        cnpjFormatado: cnpjNumerico.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5'),
        codigo: 'CNPJ_OK'
      };
    } catch (error) {
      Logger.log("Erro em validarCNPJ: " + error.message);
      throw error;
    }
  }

  /**
   * Valida CPF
   * @param {string} cpf - CPF a validar
   * @returns {Object} Resultado da validação
   */
  function validarCPF(cpf) {
    try {
      if (!cpf) {
        return { valido: false, erro: 'CPF não informado', codigo: 'CPF_AUSENTE' };
      }
    
      var cpfNumerico = String(cpf).replace(/\D/g, '');
    
      if (cpfNumerico.length !== 11) {
        return {
          valido: false,
          erro: 'CPF deve ter 11 dígitos',
          codigo: 'CPF_TAMANHO_INVALIDO'
        };
      }
    
      // Verifica se todos os dígitos são iguais
      if (/^(\d)\1+$/.test(cpfNumerico)) {
        return { valido: false, erro: 'CPF inválido', codigo: 'CPF_INVALIDO' };
      }
    
      // Calcula primeiro dígito verificador
      var soma = 0;
      for (var i = 0; i < 9; i++) {
        soma += parseInt(cpfNumerico.charAt(i)) * (10 - i);
      }
      var resto = (soma * 10) % 11;
      if (resto === 10 || resto === 11) resto = 0;
      if (resto !== parseInt(cpfNumerico.charAt(9))) {
        return { valido: false, erro: 'CPF inválido', codigo: 'CPF_DV1_INVALIDO' };
      }
    
      // Calcula segundo dígito verificador
      soma = 0;
      for (var j = 0; j < 10; j++) {
        soma += parseInt(cpfNumerico.charAt(j)) * (11 - j);
      }
      resto = (soma * 10) % 11;
      if (resto === 10 || resto === 11) resto = 0;
      if (resto !== parseInt(cpfNumerico.charAt(10))) {
        return { valido: false, erro: 'CPF inválido', codigo: 'CPF_DV2_INVALIDO' };
      }
    
      return {
        valido: true,
        cpfFormatado: cpfNumerico.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4'),
        codigo: 'CPF_OK'
      };
    } catch (error) {
      Logger.log("Erro em validarCPF: " + error.message);
      throw error;
    }
  }
  
  // =========================================================================
  // VALIDAÇÃO DE RECEBIMENTO DE ALIMENTOS
  // =========================================================================
  
  /**
   * Valida dados completos de recebimento de alimentos
   * @param {Object} dados - Dados do recebimento
   * @returns {Object} Resultado consolidado
   */
  function validarRecebimento(dados) {
    try {
      var resultado = {
        valido: true,
        validacoes: [],
        erros: [],
        alertas: []
      };
    
      // Valida validade do produto
      if (dados.dataValidade && dados.tipoProduto) {
        var validadeResult = validarValidade(dados.dataValidade, dados.tipoProduto);
        resultado.validacoes.push({ campo: 'validade', resultado: validadeResult });
      
        if (!validadeResult.valido) {
          resultado.valido = false;
          resultado.erros.push(validadeResult.erro);
        } else if (validadeResult.alerta) {
          resultado.alertas.push(validadeResult.alerta);
        }
      }
    
      // Valida temperatura
      if (dados.temperatura !== undefined && dados.categoriaProduto) {
        var tempResult = validarTemperatura(dados.temperatura, dados.categoriaProduto);
        resultado.validacoes.push({ campo: 'temperatura', resultado: tempResult });
      
        if (!tempResult.valido) {
          resultado.valido = false;
          resultado.erros.push(tempResult.erro);
        }
      }
    
      // Valida quantidade
      if (dados.quantidadeRecebida !== undefined && dados.quantidadeEsperada !== undefined) {
        var qtdRecebida = Number(dados.quantidadeRecebida);
        var qtdEsperada = Number(dados.quantidadeEsperada);
        var tolerancia = 0.05; // 5% de tolerância
      
        if (qtdRecebida < qtdEsperada * (1 - tolerancia)) {
          resultado.alertas.push('Quantidade recebida abaixo do esperado: ' + qtdRecebida + ' de ' + qtdEsperada);
        } else if (qtdRecebida > qtdEsperada * (1 + tolerancia)) {
          resultado.alertas.push('Quantidade recebida acima do esperado: ' + qtdRecebida + ' de ' + qtdEsperada);
        }
      }
    
      // Valida integridade da embalagem
      if (dados.integridadeEmbalagem === false || dados.integridadeEmbalagem === 'NAO') {
        resultado.valido = false;
        resultado.erros.push('Embalagem com integridade comprometida');
      }
    
      // Valida aspecto visual
      if (dados.aspectoVisual === 'REPROVADO' || dados.aspectoVisual === false) {
        resultado.valido = false;
        resultado.erros.push('Aspecto visual reprovado');
      }
    
      resultado.codigo = resultado.valido 
        ? (resultado.alertas.length > 0 ? 'RECEBIMENTO_ALERTA' : 'RECEBIMENTO_OK')
        : 'RECEBIMENTO_REPROVADO';
    
      return resultado;
    } catch (error) {
      Logger.log("Erro em validarRecebimento: " + error.message);
      throw error;
    }
  }

  // =========================================================================
  // FORMATAÇÃO ESPECIALIZADA
  // =========================================================================
  
  /**
   * Formata valor em Reais (BRL)
   * @param {number} valor - Valor numérico
   * @param {boolean} [comSimbolo=true] - Incluir R$
   * @returns {string} Valor formatado
   */
  function formatarMoeda(valor, comSimbolo) {
    try {
      if (valor === undefined || valor === null) return comSimbolo !== false ? 'R$ 0,00' : '0,00';
    
      var num = Number(valor);
      if (isNaN(num)) return comSimbolo !== false ? 'R$ 0,00' : '0,00';
    
      var formatado = num.toFixed(2)
        .replace('.', ',')
        .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    
      return comSimbolo !== false ? 'R$ ' + formatado : formatado;
    } catch (error) {
      Logger.log("Erro em formatarMoeda: " + error.message);
      throw error;
    }
  }
  
  /**
   * Formata peso em kg ou g
   * @param {number} gramas - Peso em gramas
   * @returns {string} Peso formatado
   */
  function formatarPeso(gramas) {
    try {
      if (!gramas) return '0 g';
    
      var g = Number(gramas);
      if (isNaN(g)) return '0 g';
    
      if (g >= 1000) {
        return (g / 1000).toFixed(2).replace('.', ',') + ' kg';
      }
      return g.toFixed(0) + ' g';
    } catch (error) {
      Logger.log("Erro em formatarPeso: " + error.message);
      throw error;
    }
  }
  
  /**
   * Formata data para exibição
   * @param {Date|string} data - Data
   * @param {string} [formato='dd/MM/yyyy'] - Formato desejado
   * @returns {string} Data formatada
   */
  function formatarData(data, formato) {
    try {
      if (!data) return '';
    
      var d = new Date(data);
      if (isNaN(d.getTime())) return '';
    
      formato = formato || 'dd/MM/yyyy';
    
      var dia = String(d.getDate()).padStart(2, '0');
      var mes = String(d.getMonth() + 1).padStart(2, '0');
      var ano = d.getFullYear();
      var hora = String(d.getHours()).padStart(2, '0');
      var min = String(d.getMinutes()).padStart(2, '0');
    
      return formato
        .replace('dd', dia)
        .replace('MM', mes)
        .replace('yyyy', ano)
        .replace('HH', hora)
        .replace('mm', min);
    } catch (error) {
      Logger.log("Erro em formatarData: " + error.message);
      throw error;
    }
  }
  
  /**
   * Formata número de NF
   * @param {string|number} numero - Número da NF
   * @param {string|number} serie - Série da NF
   * @returns {string} NF formatada
   */
  function formatarNumeroNF(numero, serie) {
    try {
      var num = String(numero || '').padStart(9, '0');
      var ser = String(serie || '1').padStart(3, '0');
      return 'NF ' + num + ' - Série ' + ser;
    } catch (error) {
      Logger.log("Erro em formatarNumeroNF: " + error.message);
      throw error;
    }
  }
  
  // =========================================================================
  // EXPORTAÇÃO PÚBLICA
  // =========================================================================
  
  return {
    // Configuração
    REGRAS_PNAE: REGRAS_PNAE,
    GRUPOS_ALIMENTARES: GRUPOS_ALIMENTARES,
    
    // Validação de produtos
    validarValidade: validarValidade,
    validarTemperatura: validarTemperatura,
    validarRecebimento: validarRecebimento,
    
    // Cálculos nutricionais
    calcularCalorias: calcularCalorias,
    validarCaloriasPorFaixa: validarCaloriasPorFaixa,
    validarComposicaoCardapio: validarComposicaoCardapio,
    identificarGrupoAlimentar: identificarGrupoAlimentar,
    
    // Validação de documentos
    validarChaveNFe: validarChaveNFe,
    validarCNPJ: validarCNPJ,
    validarCPF: validarCPF,
    
    // Formatação
    formatarMoeda: formatarMoeda,
    formatarPeso: formatarPeso,
    formatarData: formatarData,
    formatarNumeroNF: formatarNumeroNF
  };
  
})();


// ============================================================================
// FUNÇÕES GLOBAIS DE API
// ============================================================================

/**
 * API: Valida validade de produto
 */
function api_validar_validade(dataValidade, tipoProduto) {
  return ValidacaoAE.validarValidade(dataValidade, tipoProduto);
}

/**
 * API: Valida temperatura de recebimento
 */
function api_validar_temperatura(temperatura, categoriaProduto) {
  return ValidacaoAE.validarTemperatura(temperatura, categoriaProduto);
}

/**
 * API: Valida recebimento completo
 */
function api_validar_recebimento(dados) {
  return ValidacaoAE.validarRecebimento(dados);
}

/**
 * API: Calcula calorias de refeição
 */
function api_calcular_calorias(itens) {
  return ValidacaoAE.calcularCalorias(itens);
}

/**
 * API: Valida calorias por faixa etária
 */
function api_validar_calorias(calorias, faixaEtaria, tipoRefeicao) {
  return ValidacaoAE.validarCaloriasPorFaixa(calorias, faixaEtaria, tipoRefeicao);
}

/**
 * API: Valida composição do cardápio PNAE
 */
function api_validar_cardapio_pnae(cardapioSemanal) {
  return ValidacaoAE.validarComposicaoCardapio(cardapioSemanal);
}

/**
 * API: Valida chave de acesso NF-e
 */
function api_validar_chave_nfe(chave) {
  return ValidacaoAE.validarChaveNFe(chave);
}

/**
 * API: Valida CNPJ
 */
function api_validar_cnpj(cnpj) {
  return ValidacaoAE.validarCNPJ(cnpj);
}

/**
 * API: Valida CPF
 */
function api_validar_cpf(cpf) {
  return ValidacaoAE.validarCPF(cpf);
}

/**
 * API: Identifica grupo alimentar
 */
function api_identificar_grupo_alimentar(nomeItem) {
  return ValidacaoAE.identificarGrupoAlimentar(nomeItem);
}

/**
 * API: Obtém regras PNAE
 */
function api_obter_regras_pnae() {
  return ValidacaoAE.REGRAS_PNAE;
}

/**
 * API: Obtém grupos alimentares
 */
function api_obter_grupos_alimentares() {
  return ValidacaoAE.GRUPOS_ALIMENTARES;
}

// ============================================================================
// REGISTRO DO MÓDULO
// ============================================================================

Logger.log('✅ Core_Validation_AE.gs carregado - ValidacaoAE disponível');
