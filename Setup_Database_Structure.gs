/**
 * @fileoverview Estrutura unificada do banco de dados (Google Sheets)
 *
 * Cria e mantém a estrutura completa da planilha única que gerencia
 * todo o sistema de notas fiscais de alimentação escolar.
 *
 * @author UNIAE CRE Team
 * @version 2.0.0
 */

'use strict';

// ============================================================================
// CONFIGURAÇÃO DA ESTRUTURA
// ============================================================================

/**
 * Estrutura completa das abas da planilha
 */
const DATABASE_STRUCTURE = {
  // Usuários e Autenticação
  USUARIOS: {
    nome: 'USR_Usuarios',
    colunas: [
      'ID',
      'Email',
      'Nome_Completo',
      'Senha', // Texto plano - arquitetura 100% digital
      'Tipo_Usuario',        // ANALISTA, ESCOLA, FORNECEDOR, NUTRICIONISTA
      'Unidade_Vinculada',   // Nome da escola ou fornecedor
      'Status',              // ATIVO, INATIVO, BLOQUEADO
      'Data_Cadastro',
      'Ultimo_Acesso',
      'Telefone',
      'CPF',
      'Criado_Por',
      'Data_Atualizacao'
    ],
    validacoes: {
      Tipo_Usuario: ['ANALISTA', 'ESCOLA', 'FORNECEDOR', 'NUTRICIONISTA'],
      Status: ['ATIVO', 'INATIVO', 'BLOQUEADO']
    }
  },

  // Notas Fiscais
  NOTAS_FISCAIS: {
    nome: 'NF_NotasFiscais',
    colunas: [
      'ID',
      'Numero_NF',
      'Serie',
      'Fornecedor_ID',
      'Fornecedor_Nome',
      'Escola_ID',
      'Escola_Nome',
      'Data_Emissao',
      'Data_Recebimento',
      'Valor_Total',
      'Valor_Produtos',
      'Valor_Impostos',
      'Status',              // PENDENTE, RECEBIDA, CONFERIDA, APROVADA, REJEITADA
      'Observacoes',
      'Arquivo_PDF_URL',
      'Cadastrado_Por',
      'Data_Cadastro',
      'Atualizado_Por',
      'Data_Atualizacao'
    ],
    validacoes: {
      Status: ['PENDENTE', 'RECEBIDA', 'CONFERIDA', 'APROVADA', 'REJEITADA']
    }
  },

  // Itens das Notas Fiscais
  ITENS_NF: {
    nome: 'NF_Itens',
    colunas: [
      'ID',
      'Nota_Fiscal_ID',
      'Produto_Nome',
      'Produto_Codigo',
      'Quantidade',
      'Unidade_Medida',
      'Valor_Unitario',
      'Valor_Total',
      'Lote',
      'Data_Validade',
      'Status_Conferencia',  // PENDENTE, CONFORME, NAO_CONFORME
      'Observacoes'
    ],
    validacoes: {
      Status_Conferencia: ['PENDENTE', 'CONFORME', 'NAO_CONFORME'],
      Unidade_Medida: ['KG', 'G', 'L', 'ML', 'UN', 'CX', 'PCT']
    }
  },

  // Escolas
  ESCOLAS: {
    nome: 'ESC_Escolas',
    colunas: [
      'ID',
      'Nome',
      'Codigo_INEP',
      'Endereco',
      'Bairro',
      'CEP',
      'Telefone',
      'Email',
      'Diretor_Nome',
      'Diretor_Email',
      'Numero_Alunos',
      'Status',              // ATIVA, INATIVA
      'Data_Cadastro'
    ],
    validacoes: {
      Status: ['ATIVA', 'INATIVA']
    }
  },

  // Fornecedores
  FORNECEDORES: {
    nome: 'FORN_Fornecedores',
    colunas: [
      'ID',
      'Razao_Social',
      'Nome_Fantasia',
      'CNPJ',
      'Inscricao_Estadual',
      'Endereco',
      'Bairro',
      'Cidade',
      'Estado',
      'CEP',
      'Telefone',
      'Email',
      'Contato_Nome',
      'Contato_Telefone',
      'Status',              // ATIVO, INATIVO, BLOQUEADO
      'Data_Cadastro'
    ],
    validacoes: {
      Status: ['ATIVO', 'INATIVO', 'BLOQUEADO']
    }
  },

  // Conferências
  CONFERENCIAS: {
    nome: 'CONF_Conferencias',
    colunas: [
      'ID',
      'Nota_Fiscal_ID',
      'Escola_ID',
      'Conferido_Por',
      'Data_Conferencia',
      'Status_Geral',        // CONFORME, PARCIAL, NAO_CONFORME
      'Observacoes',
      'Assinatura_Digital',
      'Fotos_URLs'
    ],
    validacoes: {
      Status_Geral: ['CONFORME', 'PARCIAL', 'NAO_CONFORME']
    }
  },

  // Recusas
  RECUSAS: {
    nome: 'REC_Recusas',
    colunas: [
      'ID',
      'Nota_Fiscal_ID',
      'Item_ID',
      'Escola_ID',
      'Motivo',
      'Descricao_Detalhada',
      'Quantidade_Recusada',
      'Valor_Recusado',
      'Data_Recusa',
      'Recusado_Por',
      'Status',              // PENDENTE, ACEITA, CONTESTADA
      'Fotos_URLs',
      'Resolucao',
      'Data_Resolucao'
    ],
    validacoes: {
      Status: ['PENDENTE', 'ACEITA', 'CONTESTADA'],
      Motivo: [
        'VALIDADE_VENCIDA',
        'PRODUTO_AVARIADO',
        'QUANTIDADE_INCORRETA',
        'PRODUTO_INCORRETO',
        'QUALIDADE_INADEQUADA',
        'EMBALAGEM_DANIFICADA',
        'OUTROS'
      ]
    }
  },

  // Avaliações Nutricionais
  AVALIACOES_NUTRICIONAIS: {
    nome: 'NUT_Avaliacoes',
    colunas: [
      'ID',
      'Nota_Fiscal_ID',
      'Nutricionista_ID',
      'Data_Avaliacao',
      'Status_Nutricional',  // APROVADO, REPROVADO, PENDENTE
      'Observacoes',
      'Recomendacoes',
      'Produtos_Aprovados',
      'Produtos_Reprovados'
    ],
    validacoes: {
      Status_Nutricional: ['APROVADO', 'REPROVADO', 'PENDENTE']
    }
  },

  // Log de Auditoria
  AUDITORIA: {
    nome: 'AUD_Auditoria',
    colunas: [
      'ID',
      'Data_Hora',
      'Usuario_ID',
      'Usuario_Email',
      'Acao',
      'Tabela',
      'Registro_ID',
      'Dados_Anteriores',
      'Dados_Novos',
      'IP_Address',
      'User_Agent'
    ]
  }
};

// ============================================================================
// FUNÇÕES DE CRIAÇÃO
// ============================================================================

/**
 * Cria ou atualiza a estrutura completa do banco de dados
 *
 * @returns {Object} Resultado da operação
 */
function criarEstruturaBancoDados() {
  try {
    Logger.log('Iniciando criação da estrutura do banco de dados...');

    const ss = getSS();
    const resultado = {
      success: true,
      abasCriadas: [],
      abasAtualizadas: [],
      erros: []
    };

    // Criar cada aba
    Object.keys(DATABASE_STRUCTURE).forEach(key => {
      const config = DATABASE_STRUCTURE[key];

      try {
        const aba = _criarOuAtualizarAba(ss, config);

        if (aba.criada) {
          resultado.abasCriadas.push(config.nome);
        } else {
          resultado.abasAtualizadas.push(config.nome);
        }

        Logger.log(`✓ Aba ${config.nome} processada`);

      } catch (erro) {
        resultado.erros.push({
          aba: config.nome,
          erro: erro.message
        });
        Logger.log(`✗ Erro na aba ${config.nome}: ${erro.message}`);
      }
    });

    // Criar usuário admin padrão se não existir
    _criarUsuarioAdminPadrao();

    Logger.log('Estrutura do banco de dados criada com sucesso!');
    return resultado;

  } catch (erro) {
    Logger.log(`Erro ao criar estrutura: ${erro.message}`);
    throw erro;
  }
}

/**
 * Cria ou atualiza uma aba específica
 * @private
 */
function _criarOuAtualizarAba(ss, config) {
  try {
    try {
      let sheet = ss.getSheetByName(config.nome);
      let criada = false;

      // Criar aba se não existir
      if (!sheet) {
        sheet = ss.insertSheet(config.nome);
        criada = true;
      }

      // Configurar headers
      const headers = config.colunas;
      const primeiraLinha = sheet.getRange(1, 1, 1, headers.length);

      primeiraLinha.setValues([headers]);
      primeiraLinha.setFontWeight('bold');
      primeiraLinha.setBackground('#4285f4');
      primeiraLinha.setFontColor('#ffffff');

      // Congelar primeira linha
      sheet.setFrozenRows(1);

      // Auto-resize colunas
      for (let i = 1; i <= headers.length; i++) {
        sheet.autoResizeColumn(i);
      }

      // Aplicar validações se existirem
      if (config.validacoes) {
        _aplicarValidacoes(sheet, config);
      }

      return { sheet, criada };
    } catch (error) {
      Logger.log("Erro em _criarOuAtualizarAba: " + error.message);
      throw error; // Re-lança para tratamento superior
    }
  } catch (error) {
    Logger.log("Erro em _criarOuAtualizarAba: " + error.message);
    throw error;
  }
}

/**
 * Aplica validações de dados nas colunas
 * @private
 */
function _aplicarValidacoes(sheet, config) {
  try {
    try {
      const headers = config.colunas;

      Object.keys(config.validacoes).forEach(coluna => {
        const valores = config.validacoes[coluna];
        const colunaIndex = headers.indexOf(coluna) + 1;

        if (colunaIndex > 0) {
          const rule = SpreadsheetApp.newDataValidation()
            .requireValueInList(valores, true)
            .setAllowInvalid(false)
            .build();

          // Aplicar da linha 2 até 1000
          const range = sheet.getRange(2, colunaIndex, 999, 1);
          range.setDataValidation(rule);
        }
      });
    } catch (error) {
      Logger.log("Erro em _aplicarValidacoes: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em _aplicarValidacoes: " + error.message);
    throw error;
  }
}

/**
 * Cria usuário administrador padrão
 * @private
 */
function _criarUsuarioAdminPadrao() {
  try {
    try {
      try {
        const sheet = getSS()
          .getSheetByName('USR_Usuarios');

        // Verificar se já existe usuário
        if (sheet.getLastRow() > 1) {
          Logger.log('Usuários já existem, pulando criação do admin padrão');
          return;
        }

        // Criar admin padrão - senha deve ser alterada no primeiro login
        // Arquitetura 100% digital: senha em texto plano
        var props = PropertiesService.getScriptProperties();
        var senhaInicial = props.getProperty('ADMIN_INITIAL_PASSWORD') || 'Admin@2025';
        Logger.log('⚠️ Senha inicial do admin: [PROTEGIDA] (ver Script Property ADMIN_INITIAL_PASSWORD)');
        const dados = [
          'USR-001',
          'admin@uniae.edu.br',
          'Administrador Sistema',
          senhaInicial, // Texto plano - arquitetura 100% digital
          'ANALISTA',
          'CRE-PP',
          'ATIVO',
          new Date(),
          null,
          '',
          '',
          'SISTEMA',
          new Date()
        ];

        sheet.appendRow(dados);
        Logger.log('✓ Usuário admin padrão criado');
        Logger.log('⚠️ IMPORTANTE: alterar a credencial padrão!');
      } catch (error) {
        Logger.log("Erro em _criarUsuarioAdminPadrao: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em _criarUsuarioAdminPadrao: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em _criarUsuarioAdminPadrao: " + error.message);
    throw error;
  }
}

/**
 * Retorna senha em texto plano (arquitetura 100% digital)
 * Sistema usa autenticação digital - usuário autenticado = identidade confirmada
 * @private
 * @deprecated Mantido apenas para compatibilidade - não usar hash
 */
function _hashSenha(senha) {
  return senha; // Texto plano - arquitetura 100% digital
}

// ============================================================================
// FUNÇÕES DE MANUTENÇÃO
// ============================================================================

/**
 * Verifica integridade da estrutura
 */
function verificarIntegridadeEstrutura() {
  try {
    const ss = getSS();
    const resultado = {
      success: true,
      abasOK: [],
      abasFaltando: [],
      abasComProblemas: []
    };

    Object.keys(DATABASE_STRUCTURE).forEach(key => {
      const config = DATABASE_STRUCTURE[key];
      const sheet = ss.getSheetByName(config.nome);

      if (!sheet) {
        resultado.abasFaltando.push(config.nome);
        resultado.success = false;
      } else {
        // Verificar headers
        const headers = sheet.getRange(1, 1, 1, config.colunas.length).getValues()[0];
        const headersOK = config.colunas.every((col, i) => headers[i] === col);

        if (headersOK) {
          resultado.abasOK.push(config.nome);
        } else {
          resultado.abasComProblemas.push(config.nome);
          resultado.success = false;
        }
      }
    });

    return resultado;
  } catch (error) {
    Logger.log("Erro em verificarIntegridadeEstrutura: " + error.message);
    throw error;
  }
}

/**
 * Atualiza estrutura existente SEM apagar dados
 *
 * Esta função é SEGURA - adiciona colunas/abas faltantes
 * mas PRESERVA todos os dados existentes
 *
 * @returns {Object} Resultado da atualização
 */
function atualizarEstruturaSemPerderDados() {
  try {
    try {
      try {
        try {
          Logger.log('Iniciando atualização segura da estrutura...');

          const ss = getSS();
          const resultado = {
            success: true,
            abasCriadas: [],
            colunasAdicionadas: [],
            abasAtualizadas: [],
            erros: []
          };

          // Processar cada aba
          Object.keys(DATABASE_STRUCTURE).forEach(key => {
            const config = DATABASE_STRUCTURE[key];

            try {
              let sheet = ss.getSheetByName(config.nome);

              // Se aba não existe, criar
              if (!sheet) {
                const aba = _criarOuAtualizarAba(ss, config);
                resultado.abasCriadas.push(config.nome);
                Logger.log(`✓ Aba ${config.nome} criada`);
                return;
              }

              // Aba existe - verificar e adicionar colunas faltantes
              const headersAtuais = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
              const headersNovos = config.colunas;

              // Encontrar colunas faltantes
              const colunasFaltantes = headersNovos.filter(col => !headersAtuais.includes(col));

              if (colunasFaltantes.length > 0) {
                // Adicionar colunas faltantes
                const proximaColuna = sheet.getLastColumn() + 1;

                colunasFaltantes.forEach((coluna, index) => {
                  const colunaIndex = proximaColuna + index;

                  // Adicionar header
                  sheet.getRange(1, colunaIndex).setValue(coluna);
                  sheet.getRange(1, colunaIndex).setFontWeight('bold');
                  sheet.getRange(1, colunaIndex).setBackground('#4285f4');
                  sheet.getRange(1, colunaIndex).setFontColor('#ffffff');

                  // Auto-resize
                  sheet.autoResizeColumn(colunaIndex);

                  resultado.colunasAdicionadas.push(`${config.nome}.${coluna}`);
                  Logger.log(`  + Coluna ${coluna} adicionada em ${config.nome}`);
                });

                resultado.abasAtualizadas.push(config.nome);
              }

              // Aplicar/atualizar validações
              if (config.validacoes) {
                _aplicarValidacoes(sheet, config);
              }

              Logger.log(`✓ Aba ${config.nome} verificada`);

            } catch (erro) {
              resultado.erros.push({
                aba: config.nome,
                erro: erro.message
              });
              Logger.log(`✗ Erro na aba ${config.nome}: ${erro.message}`);
            }
          });

          // Verificar se usuário admin existe
          _verificarUsuarioAdmin();

          Logger.log('Atualização concluída com sucesso!');
          return resultado;

        } catch (erro) {
          Logger.log(`Erro ao atualizar estrutura: ${erro.message}`);
          throw erro;
        }
      } catch (error) {
        Logger.log("Erro em atualizarEstruturaSemPerderDados: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em atualizarEstruturaSemPerderDados: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em atualizarEstruturaSemPerderDados: " + error.message);
    throw error;
  }
}

/**
 * Verifica e cria usuário admin se não existir
 * @private
 */
function _verificarUsuarioAdmin() {
  try {
    try {
      const sheet = getSS()
        .getSheetByName('USR_Usuarios');

      if (!sheet) {
        Logger.log('Aba de usuários não existe ainda');
        return;
      }

      // Verificar se já existe algum usuário admin
      const dados = sheet.getDataRange().getValues();
      const temAdmin = dados.slice(1).some(row => row[4] === 'ANALISTA');

      if (!temAdmin) {
        Logger.log('Nenhum admin encontrado, criando admin padrão...');
        _criarUsuarioAdminPadrao();
      } else {
        Logger.log('Admin já existe, pulando criação');
      }
    } catch (error) {
      Logger.log("Erro em _verificarUsuarioAdmin: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em _verificarUsuarioAdmin: " + error.message);
    throw error;
  }
}

/**
 * Migra dados de estrutura antiga para nova (se necessário)
 *
 * @returns {Object} Resultado da migração
 */
function migrarDadosAntigos() {
  try {
    try {
      const ss = getSS();
      const resultado = {
        success: true,
        registrosMigrados: 0,
        erros: []
      };

      // Verificar se existe aba antiga de usuários
      const abaAntiga = ss.getSheetByName('Usuarios') || ss.getSheetByName('Users');
      const abaNova = ss.getSheetByName('USR_Usuarios');

      if (abaAntiga && abaNova) {
        Logger.log('Migrando usuários da estrutura antiga...');

        const dadosAntigos = abaAntiga.getDataRange().getValues();
        const headersAntigos = dadosAntigos[0];

        // Migrar cada usuário (pulando header)
        for (let i = 1; i < dadosAntigos.length; i++) {
          try {
            const usuarioAntigo = dadosAntigos[i];

            // Mapear dados antigos para nova estrutura
            const usuarioNovo = [
              usuarioAntigo[0] || `USR-${String(i).padStart(3, '0')}`, // ID
              usuarioAntigo[1] || '', // Email
              usuarioAntigo[2] || '', // Nome
              usuarioAntigo[3] || '', // Senha (texto plano)
              usuarioAntigo[4] || 'ESCOLA', // Tipo (padrão ESCOLA se não especificado)
              usuarioAntigo[5] || '', // Unidade
              usuarioAntigo[6] || 'ATIVO', // Status
              usuarioAntigo[7] || new Date(), // Data_Cadastro
              null, // Ultimo_Acesso
              usuarioAntigo[8] || '', // Telefone
              usuarioAntigo[9] || '', // CPF
              'MIGRACAO', // Criado_Por
              new Date() // Data_Atualizacao
            ];

            abaNova.appendRow(usuarioNovo);
            resultado.registrosMigrados++;

          } catch (erro) {
            resultado.erros.push({
              linha: i,
              erro: erro.message
            });
          }
        }

        Logger.log(`${resultado.registrosMigrados} usuários migrados`);

        // Renomear aba antiga
        abaAntiga.setName('_OLD_' + abaAntiga.getName());
        Logger.log('Aba antiga renomeada para backup');
      }

      return resultado;

    } catch (erro) {
      Logger.log(`Erro na migração: ${erro.message}`);
      return {
        success: false,
        erro: erro.message
      };
    }
  } catch (error) {
    Logger.log("Erro em migrarDadosAntigos: " + error.message);
    throw error;
  }
}

/**
 * Limpa dados de teste (CUIDADO!)
 */
function limparDadosTeste() {
  try {
    try {
      const confirmacao = Browser.msgBox(
        'ATENÇÃO',
        'Isso vai apagar TODOS os dados exceto headers. Continuar?',
        Browser.Buttons.YES_NO
      );

      if (confirmacao !== 'yes') {
        return { success: false, message: 'Operação cancelada' };
      }

      const ss = getSS();
      let abasLimpas = 0;

      Object.keys(DATABASE_STRUCTURE).forEach(key => {
        const config = DATABASE_STRUCTURE[key];
        const sheet = ss.getSheetByName(config.nome);

        if (sheet && sheet.getLastRow() > 1) {
          sheet.deleteRows(2, sheet.getLastRow() - 1);
          abasLimpas++;
        }
      });

      // Recriar admin
      _criarUsuarioAdminPadrao();

      return {
        success: true,
        message: `${abasLimpas} abas limpas. Admin padrão recriado.`
      };
    } catch (error) {
      Logger.log("Erro em limparDadosTeste: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em limparDadosTeste: " + error.message);
    throw error;
  }
}

/**
 * Exporta estrutura para JSON
 */
function exportarEstrutura() {
  try {
    try {
      return JSON.stringify(DATABASE_STRUCTURE, null, 2);
    } catch (error) {
      Logger.log("Erro em exportarEstrutura: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em exportarEstrutura: " + error.message);
    throw error;
  }
}
