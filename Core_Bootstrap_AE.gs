/**
 * @fileoverview Bootstrap e Inicialização - Alimentação Escolar CRE-PP
 * @version 1.0.0
 * 
 * Intervenção 10/38: Bootstrap conforme Prompt 10
 * 
 * Script de inicialização que:
 * - Verifica existência de todas as planilhas necessárias
 * - Cria planilhas automaticamente se faltarem
 * - Aplica proteções de abas
 * - Configura formatações condicionais padrão
 * 
 * @author UNIAE CRE Team
 * @created 2025-12-25
 */

'use strict';

// ============================================================================
// BOOTSTRAP - Sistema de Inicialização
// ============================================================================

var Bootstrap = (function() {
  
  // =========================================================================
  // CONFIGURAÇÃO DE PLANILHAS
  // =========================================================================
  
  var SHEETS_CONFIG = {
    // -----------------------------------------------------------------------
    // CARDÁPIOS E NUTRIÇÃO
    // -----------------------------------------------------------------------
    'Cardapios_Base': {
      headers: ['ID', 'Nome', 'Tipo_Refeicao', 'Faixa_Etaria', 'Calorias_Total', 
                'Custo_Estimado', 'Status', 'Criado_Por', 'Data_Criacao', 'Ativo'],
      cor: '#2E7D32',
      protegida: false
    },
    'Cardapios_Semanais': {
      headers: ['ID', 'Cardapio_Base_ID', 'Semana', 'Ano', 'Escola_ID', 
                'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta',
                'Status', 'Nutricionista_Responsavel', 'Data_Aprovacao', 'Parecer'],
      cor: '#2E7D32',
      protegida: false
    },
    'Itens_Cardapio': {
      headers: ['ID', 'Cardapio_ID', 'Item_ID', 'Quantidade_g', 'Dia_Semana',
                'Tipo_Preparacao', 'Observacoes'],
      cor: '#43A047',
      protegida: false
    },

    'Itens_Alimentares': {
      headers: ['ID', 'Nome', 'Grupo_Alimentar', 'Unidade_Medida', 'Calorias_100g',
                'Proteinas_g', 'Carboidratos_g', 'Gorduras_g', 'Fibras_g',
                'Contem_Gluten', 'Contem_Lactose', 'Alergenos', 'Ativo'],
      cor: '#66BB6A',
      protegida: false
    },
    'Cardapios_Especiais': {
      headers: ['ID', 'Aluno_ID', 'Cardapio_Base_ID', 'Patologia', 'Restricoes',
                'Substituicoes_JSON', 'Nutricionista_Responsavel', 'Data_Criacao', 'Ativo'],
      cor: '#81C784',
      protegida: false
    },
    'Alunos_NAE': {
      headers: ['ID', 'Nome', 'Escola_ID', 'Turma', 'Patologia', 'CID',
                'Laudo_Medico', 'Restricoes_Alimentares', 'Responsavel', 'Contato', 'Ativo'],
      cor: '#A5D6A7',
      protegida: true
    },
    
    // -----------------------------------------------------------------------
    // FORNECEDORES E PAGAMENTOS
    // -----------------------------------------------------------------------
    'Fornecedores': {
      headers: ['ID', 'CNPJ', 'Razao_Social', 'Nome_Fantasia', 'Email', 'Telefone',
                'Endereco', 'Cidade', 'UF', 'CEP', 'Responsavel',
                'CND_Federal_Validade', 'CND_Estadual_Validade', 'CND_Municipal_Validade',
                'FGTS_Validade', 'CNDT_Validade', 'Status', 'Data_Cadastro', 'Ativo'],
      cor: '#EF6C00',
      protegida: false
    },
    'Contratos_Empenho': {
      headers: ['ID', 'Numero_Contrato', 'Fornecedor_ID', 'Numero_Empenho', 'Ano',
                'Valor_Total', 'Valor_Utilizado', 'Saldo', 'Objeto',
                'Data_Inicio', 'Data_Fim', 'Status', 'Observacoes'],
      cor: '#F57C00',
      protegida: true
    },
    'Notas_Fiscais': {
      headers: ['ID', 'Numero_NF', 'Serie', 'Chave_Acesso', 'Fornecedor_ID', 'Empenho_ID',
                'Data_Emissao', 'Data_Entrada', 'Valor_Total', 'Valor_Liquido',
                'Status', 'Atestado_Por', 'Data_Atesto', 'Observacoes', 'Arquivo_PDF'],
      cor: '#FF9800',
      protegida: true
    },
    'Pagamentos': {
      headers: ['ID', 'NF_ID', 'Fornecedor_ID', 'Valor', 'Data_Ordem_Pagamento',
                'Data_Liquidacao', 'Numero_Documento_Bancario', 'Status', 'Observacoes'],
      cor: '#FFB74D',
      protegida: true
    },
    'Glosas': {
      headers: ['ID', 'NF_ID', 'Motivo', 'Valor_Glosa', 'Percentual', 'Item_Afetado',
                'Justificativa', 'Aplicado_Por', 'Data_Aplicacao', 'Status'],
      cor: '#FFCC80',
      protegida: true
    },

    // -----------------------------------------------------------------------
    // OPERACIONAL - ENTREGAS E RECEBIMENTO
    // -----------------------------------------------------------------------
    'Entregas': {
      headers: ['ID', 'Fornecedor_ID', 'Escola_ID', 'NF_ID', 'Data_Prevista', 'Data_Entrega',
                'Status', 'Conferido_Por', 'Observacoes'],
      cor: '#1976D2',
      protegida: false
    },
    'Recebimento_Generos': {
      headers: ['ID', 'Entrega_ID', 'Item_ID', 'Quantidade_Esperada', 'Quantidade_Recebida',
                'Unidade', 'Lote', 'Data_Validade', 'Temperatura', 'Integridade_Embalagem',
                'Aspecto_Visual', 'Status', 'Responsavel', 'Data_Registro', 'Observacoes'],
      cor: '#1E88E5',
      protegida: false
    },
    'Recusas': {
      headers: ['ID', 'Entrega_ID', 'Item_ID', 'Motivo', 'Quantidade_Recusada',
                'Evidencia_Foto', 'Responsavel', 'Data_Recusa', 'Status', 'Resolucao'],
      cor: '#D32F2F',
      protegida: false
    },
    'Ocorrencias_Descarte': {
      headers: ['ID', 'Escola_ID', 'Item_ID', 'Produto', 'Quantidade', 'Unidade',
                'Motivo_Descarte', 'Data_Ocorrencia', 'Responsavel_Registro', 'Status', 'Observacoes'],
      cor: '#E53935',
      protegida: false
    },
    'Estoque_Escolar': {
      headers: ['ID', 'Escola_ID', 'Item_ID', 'Quantidade_Atual', 'Unidade',
                'Lote', 'Data_Validade', 'Data_Ultima_Atualizacao', 'Responsavel_Atualizacao',
                'Origem_Horta_Propria', 'Quantidade_Horta_Entrada', 'Data_Ultima_Colheita'],
      cor: '#42A5F5',
      protegida: false
    },
    'Horta_Escolar': {
      headers: ['ID', 'Escola_ID', 'Produto_Nome', 'Item_ID', 'Quantidade_Colhida', 'Unidade',
                'Data_Colheita', 'Responsavel_Colheita', 'Destino_Producao',
                'Status_Aprovacao', 'Responsavel_Aprovacao', 'Data_Aprovacao',
                'Lote_Estoque_ID', 'Observacoes'],
      cor: '#66BB6A',
      protegida: false
    },
    
    // -----------------------------------------------------------------------
    // ESCOLAS E USUÁRIOS
    // -----------------------------------------------------------------------
    'Escolas': {
      headers: ['ID', 'Nome', 'Codigo_INEP', 'Endereco', 'Bairro', 'CEP', 'Telefone',
                'Email', 'Diretor', 'Tipo', 'Modalidades', 'Num_Alunos', 'Ativo'],
      cor: '#7B1FA2',
      protegida: true
    },
    'Usuarios': {
      headers: ['ID', 'Nome', 'Email', 'Senha', 'Perfil', 'Escola_ID', 'Telefone',
                'Status', 'Ultimo_Acesso', 'Data_Cadastro', 'Ativo'],
      cor: '#9C27B0',
      protegida: true
    },
    'Sessoes': {
      headers: ['ID', 'Usuario_ID', 'Token', 'IP', 'User_Agent', 'Fingerprint',
                'Data_Inicio', 'Data_Expiracao', 'Ativo'],
      cor: '#BA68C8',
      protegida: true
    },

    // -----------------------------------------------------------------------
    // SISTEMA E AUDITORIA
    // -----------------------------------------------------------------------
    'Auditoria': {
      headers: ['ID', 'Timestamp', 'Usuario', 'Acao', 'Entidade', 'Entidade_ID',
                'Valor_Anterior', 'Valor_Novo', 'IP', 'Severidade', 'Detalhes'],
      cor: '#455A64',
      protegida: true
    },
    'Logs': {
      headers: ['ID', 'Timestamp', 'Nivel', 'Modulo', 'Mensagem', 'Stack_Trace', 'Usuario'],
      cor: '#607D8B',
      protegida: true
    },
    'Notificacoes': {
      headers: ['ID', 'Tipo', 'Titulo', 'Mensagem', 'Destinatario_Email',
                'Destinatario_Nome', 'Canal', 'Prioridade', 'Status',
                'Data_Criacao', 'Data_Envio', 'Data_Leitura', 'Erro', 'Dados_Extras', 'Criado_Por'],
      cor: '#78909C',
      protegida: false
    },
    'Sync_Queue': {
      headers: ['ID', 'Entidade', 'Operacao', 'Dados_JSON', 'ID_Local', 'ID_Servidor',
                'Usuario', 'Dispositivo', 'Data_Criacao_Local', 'Data_Sync', 'Status',
                'Tentativas', 'Erro', 'Checksum'],
      cor: '#90A4AE',
      protegida: false
    },
    'Config': {
      headers: ['Chave', 'Valor', 'Tipo', 'Descricao', 'Ultima_Atualizacao', 'Atualizado_Por'],
      cor: '#B0BEC5',
      protegida: true
    },
    
    // -----------------------------------------------------------------------
    // PARECERES E WORKFLOW
    // -----------------------------------------------------------------------
    'Pareceres_Tecnicos': {
      headers: ['ID', 'Tipo', 'Referencia_ID', 'Parecer', 'Resultado', 'Responsavel',
                'Data_Parecer', 'Assinatura_Digital', 'Observacoes'],
      cor: '#00796B',
      protegida: true
    },
    'Workflow_Historico': {
      headers: ['ID', 'Entidade', 'Entidade_ID', 'Status_Anterior', 'Status_Novo',
                'Responsavel', 'Data_Transicao', 'Comentario'],
      cor: '#00897B',
      protegida: true
    }
  };

  // =========================================================================
  // FORMATAÇÕES CONDICIONAIS
  // =========================================================================
  
  var FORMATACOES_CONDICIONAIS = {
    'Status': {
      'ATIVO': { background: '#C8E6C9', fontColor: '#1B5E20' },
      'INATIVO': { background: '#FFCDD2', fontColor: '#B71C1C' },
      'PENDENTE': { background: '#FFF9C4', fontColor: '#F57F17' },
      'APROVADO': { background: '#C8E6C9', fontColor: '#1B5E20' },
      'REPROVADO': { background: '#FFCDD2', fontColor: '#B71C1C' },
      'PAGO': { background: '#C8E6C9', fontColor: '#1B5E20' },
      'CANCELADO': { background: '#CFD8DC', fontColor: '#37474F' }
    },
    'Prioridade': {
      '1': { background: '#FFCDD2', fontColor: '#B71C1C' },  // Urgente
      '2': { background: '#FFE0B2', fontColor: '#E65100' },  // Alta
      '3': { background: '#FFF9C4', fontColor: '#F57F17' },  // Normal
      '4': { background: '#E3F2FD', fontColor: '#1565C0' }   // Baixa
    }
  };
  
  // =========================================================================
  // FUNÇÕES PRIVADAS
  // =========================================================================
  
  /**
   * Obtém spreadsheet ativa
   * @private
   */
  function _getSpreadsheet() {
    return getSS();
  }
  
  /**
   * Cria uma planilha com configuração
   * @private
   */
  function _createSheet(ss, nome, config) {
    try {
      try {
        var sheet = ss.insertSheet(nome);
      
        // Define headers
        if (config.headers && config.headers.length > 0) {
          sheet.getRange(1, 1, 1, config.headers.length).setValues([config.headers]);
        
          // Formata header
          sheet.getRange(1, 1, 1, config.headers.length)
            .setBackground(config.cor || '#2E7D32')
            .setFontColor('white')
            .setFontWeight('bold')
            .setHorizontalAlignment('center');
        
          // Congela primeira linha
          sheet.setFrozenRows(1);
        
          // Ajusta largura das colunas
          for (var i = 1; i <= config.headers.length; i++) {
            sheet.setColumnWidth(i, 120);
          }
        
          // Coluna ID mais estreita
          if (config.headers[0] === 'ID') {
            sheet.setColumnWidth(1, 80);
          }
        }
      
        // Define cor da aba
        if (config.cor) {
          sheet.setTabColor(config.cor);
        }
      
        return { success: true, sheet: sheet };
      
      } catch (e) {
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em _createSheet: " + error.message);
      throw error;
    }
  }
  
  /**
   * Aplica proteção a uma planilha
   * @private
   */
  function _protectSheet(sheet, descricao) {
    try {
      try {
        var protection = sheet.protect().setDescription(descricao || 'Proteção automática');
      
        // Remove todos os editores exceto o proprietário
        var me = Session.getEffectiveUser();
        protection.addEditor(me);
        protection.removeEditors(protection.getEditors());
        if (protection.canDomainEdit()) {
          protection.setDomainEdit(false);
        }
      
        return { success: true };
      } catch (e) {
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em _protectSheet: " + error.message);
      throw error;
    }
  }

  /**
   * Aplica formatação condicional
   * @private
   */
  function _applyConditionalFormatting(sheet, coluna, regras) {
    try {
      try {
        var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        var colIndex = headers.indexOf(coluna);
      
        if (colIndex === -1) return;
      
        var range = sheet.getRange(2, colIndex + 1, sheet.getMaxRows() - 1, 1);
        var rules = [];
      
        for (var valor in regras) {
          var estilo = regras[valor];
          var rule = SpreadsheetApp.newConditionalFormatRule()
            .whenTextEqualTo(valor)
            .setBackground(estilo.background)
            .setFontColor(estilo.fontColor)
            .setRanges([range])
            .build();
          rules.push(rule);
        }
      
        var existingRules = sheet.getConditionalFormatRules();
        sheet.setConditionalFormatRules(existingRules.concat(rules));
      
      } catch (e) {
        console.error('Erro ao aplicar formatação: ' + e.message);
      }
    } catch (error) {
      Logger.log("Erro em _applyConditionalFormatting: " + error.message);
      throw error;
    }
  }
  
  // =========================================================================
  // API PÚBLICA
  // =========================================================================
  
  return {
    SHEETS_CONFIG: SHEETS_CONFIG,
    
    /**
     * Verifica e cria todas as planilhas necessárias
     * @returns {Object} Resultado da verificação
     */
    verificarECriarPlanilhas: function() {
      try {
        var resultado = {
          verificadas: 0,
          criadas: 0,
          existentes: 0,
          erros: [],
          detalhes: []
        };
      
        try {
          var ss = _getSpreadsheet();
          if (!ss) {
            return { success: false, error: 'Spreadsheet não encontrada' };
          }
        
          for (var nome in SHEETS_CONFIG) {
            resultado.verificadas++;
            var config = SHEETS_CONFIG[nome];
            var sheet = ss.getSheetByName(nome);
          
            if (sheet) {
              resultado.existentes++;
              resultado.detalhes.push({ nome: nome, status: 'existente' });
            } else {
              var createResult = _createSheet(ss, nome, config);
            
              if (createResult.success) {
                resultado.criadas++;
                resultado.detalhes.push({ nome: nome, status: 'criada' });
              
                // Aplica proteção se configurado
                if (config.protegida) {
                  _protectSheet(createResult.sheet, 'Planilha protegida: ' + nome);
                }
              
                // Aplica formatação condicional para Status
                if (config.headers.indexOf('Status') !== -1) {
                  _applyConditionalFormatting(createResult.sheet, 'Status', FORMATACOES_CONDICIONAIS.Status);
                }
              
              } else {
                resultado.erros.push({ nome: nome, erro: createResult.error });
                resultado.detalhes.push({ nome: nome, status: 'erro', erro: createResult.error });
              }
            }
          }
        
          resultado.success = resultado.erros.length === 0;
          resultado.message = 'Verificadas: ' + resultado.verificadas + 
                            ', Criadas: ' + resultado.criadas + 
                            ', Existentes: ' + resultado.existentes;
        
        } catch (e) {
          resultado.success = false;
          resultado.error = e.message;
        }
      
        return resultado;
      } catch (error) {
        Logger.log("Erro em verificarECriarPlanilhas: " + error.message);
        throw error;
      }
    },

    /**
     * Verifica integridade das planilhas existentes
     * @returns {Object} Resultado da verificação
     */
    verificarIntegridade: function() {
      try {
        var resultado = {
          verificadas: 0,
          ok: 0,
          problemas: [],
          detalhes: []
        };
      
        try {
          var ss = _getSpreadsheet();
        
          for (var nome in SHEETS_CONFIG) {
            resultado.verificadas++;
            var config = SHEETS_CONFIG[nome];
            var sheet = ss.getSheetByName(nome);
          
            if (!sheet) {
              resultado.problemas.push({ nome: nome, problema: 'Planilha não existe' });
              continue;
            }
          
            // Verifica headers
            var headersAtuais = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
            var headersEsperados = config.headers;
          
            var headersFaltando = [];
            headersEsperados.forEach(function(h) {
              if (headersAtuais.indexOf(h) === -1) {
                headersFaltando.push(h);
              }
            });
          
            if (headersFaltando.length > 0) {
              resultado.problemas.push({
                nome: nome,
                problema: 'Headers faltando: ' + headersFaltando.join(', ')
              });
            } else {
              resultado.ok++;
            }
          
            resultado.detalhes.push({
              nome: nome,
              linhas: sheet.getLastRow(),
              colunas: sheet.getLastColumn(),
              headersOk: headersFaltando.length === 0
            });
          }
        
          resultado.success = true;
        
        } catch (e) {
          resultado.success = false;
          resultado.error = e.message;
        }
      
        return resultado;
      } catch (error) {
        Logger.log("Erro em verificarIntegridade: " + error.message);
        throw error;
      }
    },
    
    /**
     * Repara headers faltantes
     * @param {string} nomePlanilha - Nome da planilha
     * @returns {Object} Resultado
     */
    repararHeaders: function(nomePlanilha) {
      try {
        try {
          var ss = _getSpreadsheet();
          var sheet = ss.getSheetByName(nomePlanilha);
          var config = SHEETS_CONFIG[nomePlanilha];
        
          if (!sheet) return { success: false, error: 'Planilha não encontrada' };
          if (!config) return { success: false, error: 'Configuração não encontrada' };
        
          var headersAtuais = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
          var headersEsperados = config.headers;
          var adicionados = [];
        
          headersEsperados.forEach(function(h) {
            if (headersAtuais.indexOf(h) === -1) {
              var novaCol = sheet.getLastColumn() + 1;
              sheet.getRange(1, novaCol).setValue(h)
                .setBackground(config.cor || '#2E7D32')
                .setFontColor('white')
                .setFontWeight('bold');
              adicionados.push(h);
            }
          });
        
          return {
            success: true,
            adicionados: adicionados,
            message: adicionados.length + ' headers adicionados'
          };
        
        } catch (e) {
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em repararHeaders: " + error.message);
        throw error;
      }
    },
    
    /**
     * Aplica formatações condicionais em todas as planilhas
     * @returns {Object} Resultado
     */
    aplicarFormatacoes: function() {
      try {
        var resultado = { aplicadas: 0, erros: [] };
      
        try {
          var ss = _getSpreadsheet();
        
          for (var nome in SHEETS_CONFIG) {
            var sheet = ss.getSheetByName(nome);
            if (!sheet) continue;
          
            var config = SHEETS_CONFIG[nome];
          
            // Aplica formatação de Status
            if (config.headers.indexOf('Status') !== -1) {
              _applyConditionalFormatting(sheet, 'Status', FORMATACOES_CONDICIONAIS.Status);
              resultado.aplicadas++;
            }
          
            // Aplica formatação de Prioridade
            if (config.headers.indexOf('Prioridade') !== -1) {
              _applyConditionalFormatting(sheet, 'Prioridade', FORMATACOES_CONDICIONAIS.Prioridade);
              resultado.aplicadas++;
            }
          }
        
          resultado.success = true;
        
        } catch (e) {
          resultado.success = false;
          resultado.error = e.message;
        }
      
        return resultado;
      } catch (error) {
        Logger.log("Erro em aplicarFormatacoes: " + error.message);
        throw error;
      }
    },

    /**
     * Aplica proteções nas planilhas configuradas
     * @returns {Object} Resultado
     */
    aplicarProtecoes: function() {
      var resultado = { protegidas: 0, erros: [] };
      
      try {
        var ss = _getSpreadsheet();
        
        for (var nome in SHEETS_CONFIG) {
          var config = SHEETS_CONFIG[nome];
          if (!config.protegida) continue;
          
          var sheet = ss.getSheetByName(nome);
          if (!sheet) continue;
          
          var protectResult = _protectSheet(sheet, 'Proteção: ' + nome);
          if (protectResult.success) {
            resultado.protegidas++;
          } else {
            resultado.erros.push({ nome: nome, erro: protectResult.error });
          }
        }
        
        resultado.success = resultado.erros.length === 0;
        
      } catch (e) {
        resultado.success = false;
        resultado.error = e.message;
      }
      
      return resultado;
    },
    
    /**
     * Inicialização completa do sistema
     * @returns {Object} Resultado
     */
    inicializar: function() {
      try {
        var resultado = {
          etapas: [],
          success: true
        };
      
        // Etapa 1: Verificar e criar planilhas
        var etapa1 = this.verificarECriarPlanilhas();
        resultado.etapas.push({ nome: 'Planilhas', resultado: etapa1 });
        if (!etapa1.success) resultado.success = false;
      
        // Etapa 2: Verificar integridade
        var etapa2 = this.verificarIntegridade();
        resultado.etapas.push({ nome: 'Integridade', resultado: etapa2 });
      
        // Etapa 3: Aplicar formatações
        var etapa3 = this.aplicarFormatacoes();
        resultado.etapas.push({ nome: 'Formatações', resultado: etapa3 });
      
        // Etapa 4: Aplicar proteções
        var etapa4 = this.aplicarProtecoes();
        resultado.etapas.push({ nome: 'Proteções', resultado: etapa4 });
      
        // Registra inicialização
        try {
          var configSheet = getSS().getSheetByName('Config');
          if (configSheet) {
            configSheet.appendRow([
              'ULTIMA_INICIALIZACAO',
              new Date().toISOString(),
              'datetime',
              'Data da última inicialização do sistema',
              new Date(),
              Session.getActiveUser().getEmail()
            ]);
          }
        } catch (e) {
          // Ignora erro de registro
        }
      
        resultado.message = resultado.success 
          ? 'Sistema inicializado com sucesso' 
          : 'Inicialização concluída com erros';
      
        return resultado;
      } catch (error) {
        Logger.log("Erro em inicializar: " + error.message);
        throw error;
      }
    },
    
    /**
     * Obtém status do sistema
     * @returns {Object} Status
     */
    getStatus: function() {
      try {
        var ss = _getSpreadsheet();
        var planilhasExistentes = [];
        var planilhasFaltando = [];
      
        for (var nome in SHEETS_CONFIG) {
          if (ss.getSheetByName(nome)) {
            planilhasExistentes.push(nome);
          } else {
            planilhasFaltando.push(nome);
          }
        }
      
        return {
          totalConfiguradas: Object.keys(SHEETS_CONFIG).length,
          existentes: planilhasExistentes.length,
          faltando: planilhasFaltando.length,
          planilhasFaltando: planilhasFaltando,
          inicializado: planilhasFaltando.length === 0
        };
      } catch (error) {
        Logger.log("Erro em getStatus: " + error.message);
        throw error;
      }
    }
  };
})();


// ============================================================================
// FUNÇÕES GLOBAIS
// ============================================================================

/**
 * Inicializa o sistema (criar planilhas, formatações, proteções)
 * Executar uma vez ao configurar o sistema
 */
function inicializarSistemaAE() {
  try {
    try {
      var resultado = Bootstrap.inicializar();
      Logger.log('Inicialização: ' + JSON.stringify(resultado));
  
      // Mostra resultado ao usuário
      var ui = SpreadsheetApp.getUi();
      if (resultado.success) {
        ui.alert('✅ Sistema Inicializado', 
                 'Todas as planilhas foram verificadas/criadas com sucesso.\n\n' +
                 resultado.etapas.map(function(e) { 
                   return e.nome + ': ' + (e.resultado.success ? '✓' : '✗'); 
                 }).join('\n'),
                 ui.ButtonSet.OK);
      } else {
        ui.alert('⚠️ Inicialização com Alertas', 
                 'Algumas etapas tiveram problemas. Verifique os logs.',
                 ui.ButtonSet.OK);
      }
  
      return resultado;
    } catch (error) {
      Logger.log("Erro em inicializarSistemaAE: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em inicializarSistemaAE: " + error.message);
    throw error;
  }
}

/**
 * Verifica status do sistema
 */
function verificarStatusSistema() {
  try {
    try {
      var status = Bootstrap.getStatus();
      Logger.log('Status: ' + JSON.stringify(status));
  
      var ui = SpreadsheetApp.getUi();
      var msg = 'Planilhas configuradas: ' + status.totalConfiguradas + '\n' +
                'Existentes: ' + status.existentes + '\n' +
                'Faltando: ' + status.faltando;
  
      if (status.planilhasFaltando.length > 0) {
        msg += '\n\nPlanilhas faltando:\n- ' + status.planilhasFaltando.join('\n- ');
      }
  
      ui.alert('📊 Status do Sistema', msg, ui.ButtonSet.OK);
      return status;
    } catch (error) {
      Logger.log("Erro em verificarStatusSistema: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em verificarStatusSistema: " + error.message);
    throw error;
  }
}

/**
 * Repara planilhas com problemas
 */
function repararPlanilhas() {
  try {
    var integridade = Bootstrap.verificarIntegridade();
  
    if (integridade.problemas.length === 0) {
      SpreadsheetApp.getUi().alert('✅ Tudo OK', 'Nenhum problema encontrado.', SpreadsheetApp.getUi().ButtonSet.OK);
      return;
    }
  
    integridade.problemas.forEach(function(p) {
      if (p.problema.indexOf('Headers faltando') !== -1) {
        Bootstrap.repararHeaders(p.nome);
      }
    });
  
    SpreadsheetApp.getUi().alert('🔧 Reparos Aplicados', 
                                 integridade.problemas.length + ' problemas corrigidos.',
                                 SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (error) {
    Logger.log("Erro em repararPlanilhas: " + error.message);
    throw error;
  }
}

// ============================================================================
// MENU PERSONALIZADO
// ============================================================================

/**
 * Adiciona o menu de administração ao UI já obtido pelo onOpen principal.
 *
 * Este helper substitui o antigo onOpen local. Handlers com o mesmo nome em
 * arquivos diferentes colidem no namespace global do Apps Script.
 *
 * @param {GoogleAppsScript.Base.Ui} ui interface da planilha em contexto de UI
 * @private
 */
function _addMenuAdministracaoAE_(ui) {
  ui.createMenu('🍽️ Alimentação Escolar')
    .addItem('📊 Verificar Status', 'verificarStatusSistema')
    .addItem('🚀 Inicializar Sistema', 'inicializarSistemaAE')
    .addItem('🔧 Reparar Planilhas', 'repararPlanilhas')
    .addSeparator()
    .addItem('📋 Verificar Integridade', 'verificarIntegridadeUI')
    .addItem('🎨 Aplicar Formatações', 'aplicarFormatacoesUI')
    .addItem('🔒 Aplicar Proteções', 'aplicarProtecoesUI')
    .addToUi();
}

function verificarIntegridadeUI() {
  try {
    var result = Bootstrap.verificarIntegridade();
    Logger.log(JSON.stringify(result));
    SpreadsheetApp.getUi().alert('Integridade', 
      'OK: ' + result.ok + '/' + result.verificadas + '\nProblemas: ' + result.problemas.length,
      SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (error) {
    Logger.log("Erro em verificarIntegridadeUI: " + error.message);
    throw error;
  }
}

function aplicarFormatacoesUI() {
  var result = Bootstrap.aplicarFormatacoes();
  SpreadsheetApp.getUi().alert('Formatações', 
    'Aplicadas: ' + result.aplicadas,
    SpreadsheetApp.getUi().ButtonSet.OK);
}

function aplicarProtecoesUI() {
  var result = Bootstrap.aplicarProtecoes();
  SpreadsheetApp.getUi().alert('Proteções', 
    'Protegidas: ' + result.protegidas,
    SpreadsheetApp.getUi().ButtonSet.OK);
}

// ============================================================================
// REGISTRO DO MÓDULO
// ============================================================================

Logger.log('✅ Core_Bootstrap_AE.gs carregado - Bootstrap disponível');
