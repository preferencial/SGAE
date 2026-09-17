/**
 * @fileoverview Workflow do Nutricionista - UNIAE CRE
 * 
 * Responsabilidades do Nutricionista:
 * - Avaliar e aprovar cardápios especiais (alergias, restrições)
 * - Monitorar qualidade nutricional dos alimentos recebidos
 * - Aprovar substituições de alimentos
 * - Acompanhar alunos com necessidades alimentares especiais
 * - Emitir pareceres técnicos sobre produtos
 * 
 * @version 1.0.0
 * @author UNIAE CRE Team
 */

'use strict';

// ============================================================================
// CONSTANTES
// ============================================================================

var SHEET_CARDAPIOS_ESPECIAIS = 'Cardapios_Especiais';
var SHEET_AVALIACOES_NUTRI = 'Avaliacoes_Nutricionista';
var SHEET_SUBSTITUICOES = 'Substituicoes_Alimentos';
var SHEET_PARECERES = 'Pareceres_Tecnicos';
var SHEET_OCORRENCIAS_DESCARTE = 'Ocorrencias_Descarte';

var TIPOS_RESTRICAO = [
  'DIABETES', 'DOENCA_CELIACA', 'INTOLERANCIA_LACTOSE', 'APLV',
  'ALERGIA_AMENDOIM', 'ALERGIA_FRUTOS_MAR', 'ALERGIA_OVO', 'ALERGIA_SOJA',
  'VEGANO', 'VEGETARIANO', 'OVOLACTOVEGETARIANO', 'OUTRA'
];

var STATUS_CARDAPIO = ['PENDENTE', 'EM_ANALISE', 'APROVADO', 'REPROVADO', 'REVISAO'];
var STATUS_PARECER = ['RASCUNHO', 'EMITIDO', 'ARQUIVADO'];

// ============================================================================
// DEFINIÇÃO SEMÂNTICA DO WORKFLOW
// ============================================================================

var WORKFLOW_NUTRICIONISTA = {
  id: 'WF_NUTRICIONISTA',
  nome: 'Gestão Nutricional pelo Nutricionista',
  ator: 'NUTRICIONISTA',
  descricao: 'Nutricionista avalia cardápios especiais, aprova substituições e emite pareceres técnicos',
  
  entidades: {
    principal: 'AvaliacaoNutricional',
    relacionadas: ['CardapioEspecial', 'Aluno', 'Substituicao', 'ParecerTecnico', 'Produto']
  },
  
  camposObrigatorios: {
    cardapioEspecial: {
      alunoId: { tipo: 'string', descricao: 'ID do aluno' },
      nomeAluno: { tipo: 'string', descricao: 'Nome do aluno' },
      escola: { tipo: 'string', descricao: 'Unidade escolar' },
      tipoRestricao: { tipo: 'enum', valores: TIPOS_RESTRICAO, descricao: 'Tipo de restrição alimentar' },
      cid: { tipo: 'string', descricao: 'CID da condição (se aplicável)' },
      laudoMedico: { tipo: 'boolean', descricao: 'Possui laudo médico anexado' },
      observacoes: { tipo: 'string', descricao: 'Observações clínicas' }
    },
    avaliacao: {
      nutricionistaResponsavel: { tipo: 'string', descricao: 'Nome do nutricionista' },
      crn: { tipo: 'string', descricao: 'Registro no CRN' },
      dataAvaliacao: { tipo: 'date', descricao: 'Data da avaliação' },
      parecer: { tipo: 'string', descricao: 'Parecer técnico' },
      recomendacoes: { tipo: 'array', descricao: 'Lista de recomendações' }
    }
  },
  
  regras: [
    { id: 'R1', descricao: 'Cardápio especial requer laudo médico válido', tipo: 'OBRIGATORIO' },
    { id: 'R2', descricao: 'Nutricionista deve ter CRN ativo', tipo: 'VALIDACAO' },
    { id: 'R3', descricao: 'Substituições devem manter equivalência nutricional', tipo: 'VALIDACAO' },
    { id: 'R4', descricao: 'Parecer técnico obrigatório para aprovação', tipo: 'OBRIGATORIO' },
    { id: 'R5', descricao: 'Reavaliação semestral obrigatória', tipo: 'PRAZO' }
  ],
  
  status: STATUS_CARDAPIO,
  
  transicoes: {
    'PENDENTE': ['EM_ANALISE'],
    'EM_ANALISE': ['APROVADO', 'REPROVADO', 'REVISAO'],
    'REVISAO': ['EM_ANALISE', 'REPROVADO'],
    'APROVADO': ['REVISAO'],
    'REPROVADO': ['PENDENTE']
  }
};

// ============================================================================
// FUNÇÕES DE CARDÁPIOS ESPECIAIS
// ============================================================================

/**
 * Lista alunos com cardápios especiais pendentes de avaliação
 * Usa CRUDService para aderência ao padrão CRUD
 * @param {string} [escola] - Filtrar por escola (opcional)
 * @returns {Array} Lista de cardápios pendentes
 */
function listarCardapiosEspeciaisPendentes(escola) {
  try {
    try {
      try {
        // Usa CRUDService se disponível
        if (typeof CRUDService !== 'undefined') {
          var filters = {};
          if (escola) {
            filters.Escola = escola;
          }
      
          var result = CRUDService.read(SHEET_CARDAPIOS_ESPECIAIS, { filters: filters, limit: 500 });
      
          if (!result.success) return [];
      
          return result.data.filter(function(row) {
            var status = row.Status || 'PENDENTE';
            return status === 'PENDENTE' || status === 'EM_ANALISE' || status === 'ATIVO';
          }).map(function(row) {
            return {
              id: row.ID,
              alunoId: row.Aluno_ID || '',
              nomeAluno: row.Nome_Cardapio || row.Nome_Aluno || '',
              escola: row.Escola || '',
              tipoRestricao: row.Patologia_Dieta || row.Tipo_Restricao || '',
              cid: row.CID || '',
              laudoMedico: row.Laudo_Medico === 'SIM',
              dataSolicitacao: row.Data_Criacao || row.Data_Solicitacao,
              observacoes: row.Observacoes || '',
              status: row.Status || 'PENDENTE',
              rowIndex: row._rowIndex
            };
          });
        }
    
        // Fallback para método direto
        var sheet = getSS().getSheetByName(SHEET_CARDAPIOS_ESPECIAIS);
        if (!sheet || sheet.getLastRow() <= 1) return [];
    
        var data = sheet.getDataRange().getValues();
        var headers = data[0];
        var cardapios = [];
    
        for (var i = 1; i < data.length; i++) {
          var row = data[i];
          var status = row[headers.indexOf('Status')] || 'PENDENTE';
          var escolaRow = row[headers.indexOf('Escola')] || '';
      
          if (status === 'PENDENTE' || status === 'EM_ANALISE' || status === 'ATIVO') {
            if (!escola || escolaRow === escola) {
              cardapios.push({
                id: row[0],
                alunoId: row[headers.indexOf('Aluno_ID')] || '',
                nomeAluno: row[headers.indexOf('Nome_Cardapio')] || row[headers.indexOf('Nome_Aluno')] || '',
                escola: escolaRow,
                tipoRestricao: row[headers.indexOf('Patologia_Dieta')] || row[headers.indexOf('Tipo_Restricao')] || '',
                cid: row[headers.indexOf('CID')] || '',
                laudoMedico: row[headers.indexOf('Laudo_Medico')] === 'SIM',
                dataSolicitacao: row[headers.indexOf('Data_Criacao')] || row[headers.indexOf('Data_Solicitacao')],
                observacoes: row[headers.indexOf('Observacoes')] || '',
                status: status,
                rowIndex: i + 1
              });
            }
          }
        }
    
        return cardapios;
      } catch (e) {
        Logger.log('Erro listarCardapiosEspeciaisPendentes: ' + e.message);
        return [];
      }
    } catch (error) {
      Logger.log("Erro em listarCardapiosEspeciaisPendentes: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em listarCardapiosEspeciaisPendentes: " + error.message);
    throw error;
  }
}

/**
 * Registra avaliação nutricional de um cardápio especial
 * Usa CRUDService para aderência ao padrão CRUD
 * @param {Object} dados - Dados da avaliação
 * @returns {Object} Resultado da operação
 */
function registrarAvaliacaoNutricional(dados) {
  try {
    try {
      try {
        try {
          // Validações
          if (!dados.cardapioId) return { success: false, error: 'Cardápio não selecionado' };
          if (!dados.nutricionista) return { success: false, error: 'Nutricionista é obrigatório' };
          if (!dados.crn) return { success: false, error: 'CRN é obrigatório' };
          if (!dados.parecer) return { success: false, error: 'Parecer técnico é obrigatório' };
          if (!dados.decisao) return { success: false, error: 'Decisão é obrigatória' };
    
          var id = 'AVAL_' + new Date().getTime();
          var proximaReavaliacao = new Date();
          proximaReavaliacao.setMonth(proximaReavaliacao.getMonth() + 6);
    
          var registro = {
            ID: id,
            Data_Avaliacao: new Date(),
            Cardapio_ID: dados.cardapioId,
            Aluno: dados.nomeAluno || '',
            Escola: dados.escola || '',
            Tipo_Restricao: dados.tipoRestricao || '',
            Nutricionista: dados.nutricionista,
            CRN: dados.crn,
            Parecer: dados.parecer,
            Recomendacoes: (dados.recomendacoes || []).join('; '),
            Decisao: dados.decisao,
            Proxima_Reavaliacao: proximaReavaliacao,
            Observacoes: dados.observacoes || '',
            Status: 'EMITIDO'
          };
    
          // Usa CRUDService se disponível
          if (typeof CRUDService !== 'undefined') {
            var result = CRUDService.create(SHEET_AVALIACOES_NUTRI, registro);
            if (!result.success) {
              return { success: false, error: result.error || 'Erro ao criar avaliação' };
            }
          } else {
            // Fallback para método direto
            var sheet = getOrCreateWorkflowSheet(SHEET_AVALIACOES_NUTRI);
      
            if (sheet.getLastRow() === 0) {
              sheet.appendRow([
                'ID', 'Data_Avaliacao', 'Cardapio_ID', 'Aluno', 'Escola', 'Tipo_Restricao',
                'Nutricionista', 'CRN', 'Parecer', 'Recomendacoes', 'Decisao',
                'Proxima_Reavaliacao', 'Observacoes', 'Status', 'dataCriacao', 'dataAtualizacao'
              ]);
            }
      
            sheet.appendRow([
              id, new Date(), dados.cardapioId, dados.nomeAluno || '', dados.escola || '',
              dados.tipoRestricao || '', dados.nutricionista, dados.crn, dados.parecer,
              (dados.recomendacoes || []).join('; '), dados.decisao, proximaReavaliacao,
              dados.observacoes || '', 'EMITIDO', new Date(), new Date()
            ]);
          }
    
          // Atualizar status do cardápio original
          atualizarStatusCardapio(dados.cardapioId, dados.decisao === 'APROVADO' ? 'APROVADO' : 
                                 dados.decisao === 'REPROVADO' ? 'REPROVADO' : 'EM_REVISAO');
    
          Logger.log('Avaliação nutricional registrada: ' + id);
          return { 
            success: true, 
            id: id, 
            proximaReavaliacao: proximaReavaliacao,
            mensagem: 'Avaliação registrada com sucesso'
          };
    
        } catch (e) {
          Logger.log('Erro registrarAvaliacaoNutricional: ' + e.message);
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em registrarAvaliacaoNutricional: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em registrarAvaliacaoNutricional: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em registrarAvaliacaoNutricional: " + error.message);
    throw error;
  }
}

/**
 * Atualiza status de um cardápio especial
 */
function atualizarStatusCardapio(cardapioId, novoStatus) {
  try {
    try {
      try {
        var sheet = getSS().getSheetByName(SHEET_CARDAPIOS_ESPECIAIS);
        if (!sheet) return;
    
        var data = sheet.getDataRange().getValues();
        var statusIdx = data[0].indexOf('Status');
    
        for (var i = 1; i < data.length; i++) {
          if (data[i][0] === cardapioId) {
            sheet.getRange(i + 1, statusIdx + 1).setValue(novoStatus);
            break;
          }
        }
      } catch (e) {
        Logger.log('Erro atualizarStatusCardapio: ' + e.message);
      }
    } catch (error) {
      Logger.log("Erro em atualizarStatusCardapio: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em atualizarStatusCardapio: " + error.message);
    throw error;
  }
}

// ============================================================================
// FUNÇÕES DE SUBSTITUIÇÕES DE ALIMENTOS
// ============================================================================

/**
 * Lista substituições pendentes de aprovação
 * Usa CRUDService para aderência ao padrão CRUD
 * @returns {Array} Lista de substituições
 */
function listarSubstituicoesPendentes() {
  try {
    try {
      try {
        // Usa CRUDService se disponível
        if (typeof CRUDService !== 'undefined') {
          var result = CRUDService.read(SHEET_SUBSTITUICOES, { 
            filters: { Status: 'PENDENTE' },
            limit: 500 
          });
      
          if (!result.success) return [];
      
          return result.data.map(function(row) {
            return {
              id: row.ID,
              dataSolicitacao: row.Data_Solicitacao,
              escola: row.Escola,
              produtoOriginal: row.Produto_Original,
              produtoSubstituto: row.Produto_Substituto,
              motivo: row.Motivo,
              solicitante: row.Solicitante,
              status: row.Status || 'PENDENTE',
              rowIndex: row._rowIndex
            };
          });
        }
    
        // Fallback para método direto
        var sheet = getSS().getSheetByName(SHEET_SUBSTITUICOES);
        if (!sheet || sheet.getLastRow() <= 1) return [];
    
        var data = sheet.getDataRange().getValues();
        var headers = data[0];
        var substituicoes = [];
    
        for (var i = 1; i < data.length; i++) {
          var row = data[i];
          var status = row[headers.indexOf('Status')] || 'PENDENTE';
      
          if (status === 'PENDENTE') {
            substituicoes.push({
              id: row[0],
              dataSolicitacao: row[headers.indexOf('Data_Solicitacao')],
              escola: row[headers.indexOf('Escola')],
              produtoOriginal: row[headers.indexOf('Produto_Original')],
              produtoSubstituto: row[headers.indexOf('Produto_Substituto')],
              motivo: row[headers.indexOf('Motivo')],
              solicitante: row[headers.indexOf('Solicitante')],
              status: status,
              rowIndex: i + 1
            });
          }
        }
    
        return substituicoes;
      } catch (e) {
        Logger.log('Erro listarSubstituicoesPendentes: ' + e.message);
        return [];
      }
    } catch (error) {
      Logger.log("Erro em listarSubstituicoesPendentes: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em listarSubstituicoesPendentes: " + error.message);
    throw error;
  }
}

/**
 * Aprova ou rejeita substituição de alimento
 * Usa CRUDService para aderência ao padrão CRUD
 * @param {Object} dados - Dados da decisão
 * @returns {Object} Resultado da operação
 */
function avaliarSubstituicao(dados) {
  try {
    try {
      try {
        try {
          if (!dados.substituicaoId) return { success: false, error: 'Substituição não selecionada' };
          if (!dados.decisao) return { success: false, error: 'Decisão é obrigatória' };
          if (!dados.nutricionista) return { success: false, error: 'Nutricionista é obrigatório' };
    
          // Usa CRUDService se disponível
          if (typeof CRUDService !== 'undefined') {
            // Busca a substituição pelo ID
            var result = CRUDService.read(SHEET_SUBSTITUICOES, { 
              filters: { ID: dados.substituicaoId },
              limit: 1 
            });
      
            if (!result.success || result.data.length === 0) {
              return { success: false, error: 'Substituição não encontrada' };
            }
      
            var rowIndex = result.data[0]._rowIndex;
      
            var updateResult = CRUDService.update(SHEET_SUBSTITUICOES, rowIndex, {
              Status: dados.decisao,
              Nutricionista_Avaliador: dados.nutricionista,
              Data_Avaliacao: new Date(),
              Parecer_Nutricional: dados.parecer || ''
            });
      
            if (updateResult.success) {
              Logger.log('Substituição avaliada via CRUD: ' + dados.substituicaoId + ' - ' + dados.decisao);
              return { 
                success: true, 
                mensagem: 'Substituição ' + (dados.decisao === 'APROVADO' ? 'aprovada' : 'rejeitada')
              };
            }
            return { success: false, error: updateResult.error || 'Erro ao atualizar' };
          }
    
          // Fallback para método direto
          var sheet = getSS().getSheetByName(SHEET_SUBSTITUICOES);
          if (!sheet) return { success: false, error: 'Sheet não encontrada' };
    
          var data = sheet.getDataRange().getValues();
          var headers = data[0];
    
          for (var i = 1; i < data.length; i++) {
            if (data[i][0] === dados.substituicaoId) {
              var statusIdx = headers.indexOf('Status');
              var nutriIdx = headers.indexOf('Nutricionista_Avaliador');
              var dataAvalIdx = headers.indexOf('Data_Avaliacao');
              var parecerIdx = headers.indexOf('Parecer_Nutricional');
        
              sheet.getRange(i + 1, statusIdx + 1).setValue(dados.decisao);
              if (nutriIdx >= 0) sheet.getRange(i + 1, nutriIdx + 1).setValue(dados.nutricionista);
              if (dataAvalIdx >= 0) sheet.getRange(i + 1, dataAvalIdx + 1).setValue(new Date());
              if (parecerIdx >= 0) sheet.getRange(i + 1, parecerIdx + 1).setValue(dados.parecer || '');
        
              Logger.log('Substituição avaliada: ' + dados.substituicaoId + ' - ' + dados.decisao);
              return { 
                success: true, 
                mensagem: 'Substituição ' + (dados.decisao === 'APROVADO' ? 'aprovada' : 'rejeitada')
              };
            }
          }
    
          return { success: false, error: 'Substituição não encontrada' };
        } catch (e) {
          Logger.log('Erro avaliarSubstituicao: ' + e.message);
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em avaliarSubstituicao: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em avaliarSubstituicao: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em avaliarSubstituicao: " + error.message);
    throw error;
  }
}

// ============================================================================
// FUNÇÕES DE PARECERES TÉCNICOS
// ============================================================================

/**
 * Emite parecer técnico sobre produto ou fornecedor
 * Usa CRUDService para aderência ao padrão CRUD
 * @param {Object} dados - Dados do parecer
 * @returns {Object} Resultado da operação
 */
function emitirParecerTecnico(dados) {
  try {
    try {
      try {
        try {
          if (!dados.tipo) return { success: false, error: 'Tipo de parecer é obrigatório' };
          if (!dados.assunto) return { success: false, error: 'Assunto é obrigatório' };
          if (!dados.parecer) return { success: false, error: 'Parecer é obrigatório' };
          if (!dados.nutricionista) return { success: false, error: 'Nutricionista é obrigatório' };
          if (!dados.crn) return { success: false, error: 'CRN é obrigatório' };
    
          var id = 'PAR_' + new Date().getTime();
    
          var registro = {
            ID: id,
            Data_Emissao: new Date(),
            Tipo: dados.tipo,
            Assunto: dados.assunto,
            Referencia: dados.referencia || '',
            Parecer: dados.parecer,
            Conclusao: dados.conclusao || '',
            Recomendacoes: (dados.recomendacoes || []).join('; '),
            Nutricionista: dados.nutricionista,
            CRN: dados.crn,
            Status: 'EMITIDO'
          };
    
          // Usa CRUDService se disponível
          if (typeof CRUDService !== 'undefined') {
            var result = CRUDService.create(SHEET_PARECERES, registro);
            if (!result.success) {
              return { success: false, error: result.error || 'Erro ao criar parecer' };
            }
            Logger.log('Parecer técnico emitido via CRUD: ' + id);
            return { success: true, id: id, mensagem: 'Parecer emitido com sucesso' };
          }
    
          // Fallback para método direto
          var sheet = getOrCreateWorkflowSheet(SHEET_PARECERES);
    
          if (sheet.getLastRow() === 0) {
            sheet.appendRow([
              'ID', 'Data_Emissao', 'Tipo', 'Assunto', 'Referencia',
              'Parecer', 'Conclusao', 'Recomendacoes',
              'Nutricionista', 'CRN', 'Status', 'dataCriacao', 'dataAtualizacao'
            ]);
          }
    
          sheet.appendRow([
            id, new Date(), dados.tipo, dados.assunto, dados.referencia || '',
            dados.parecer, dados.conclusao || '', (dados.recomendacoes || []).join('; '),
            dados.nutricionista, dados.crn, 'EMITIDO', new Date(), new Date()
          ]);
    
          Logger.log('Parecer técnico emitido: ' + id);
          return { success: true, id: id, mensagem: 'Parecer emitido com sucesso' };
    
        } catch (e) {
          Logger.log('Erro emitirParecerTecnico: ' + e.message);
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em emitirParecerTecnico: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em emitirParecerTecnico: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em emitirParecerTecnico: " + error.message);
    throw error;
  }
}

/**
 * Lista pareceres técnicos emitidos
 * Usa CRUDService para aderência ao padrão CRUD
 * @param {number} [limite] - Limite de resultados
 * @returns {Array} Lista de pareceres
 */
function listarPareceresTecnicos(limite) {
  try {
    try {
      try {
        var max = limite || 50;
    
        // Usa CRUDService se disponível
        if (typeof CRUDService !== 'undefined') {
          var result = CRUDService.read(SHEET_PARECERES, { 
            limit: max,
            orderBy: { field: 'Data_Emissao', direction: 'desc' }
          });
      
          if (!result.success) return [];
      
          return result.data.map(function(row) {
            return {
              id: row.ID,
              dataEmissao: row.Data_Emissao,
              tipo: row.Tipo,
              assunto: row.Assunto,
              conclusao: row.Conclusao,
              nutricionista: row.Nutricionista,
              status: row.Status
            };
          });
        }
    
        // Fallback para método direto
        var sheet = getSS().getSheetByName(SHEET_PARECERES);
        if (!sheet || sheet.getLastRow() <= 1) return [];
    
        var data = sheet.getDataRange().getValues();
        var headers = data[0];
        var pareceres = [];
    
        for (var i = 1; i < Math.min(data.length, max + 1); i++) {
          var row = data[i];
          pareceres.push({
            id: row[0],
            dataEmissao: row[headers.indexOf('Data_Emissao')],
            tipo: row[headers.indexOf('Tipo')],
            assunto: row[headers.indexOf('Assunto')],
            conclusao: row[headers.indexOf('Conclusao')],
            nutricionista: row[headers.indexOf('Nutricionista')],
            status: row[headers.indexOf('Status')]
          });
        }
    
        return pareceres.reverse();
      } catch (e) {
        Logger.log('Erro listarPareceresTecnicos: ' + e.message);
        return [];
      }
    } catch (error) {
      Logger.log("Erro em listarPareceresTecnicos: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em listarPareceresTecnicos: " + error.message);
    throw error;
  }
}

// ============================================================================
// FUNÇÕES DE QUALIDADE NUTRICIONAL
// ============================================================================

/**
 * Avalia qualidade nutricional de produtos recebidos
 * @param {Object} dados - Dados da avaliação
 * @returns {Object} Resultado da operação
 */
function avaliarQualidadeNutricional(dados) {
  try {
    try {
      if (!dados.nfId) return { success: false, error: 'NF não selecionada' };
      if (!dados.produto) return { success: false, error: 'Produto é obrigatório' };
      if (!dados.nutricionista) return { success: false, error: 'Nutricionista é obrigatório' };
    
      var sheet = getOrCreateWorkflowSheet(SHEET_AVALIACOES_NUTRI);
    
      var id = 'QUAL_' + new Date().getTime();
    
      // Calcular score de qualidade
      var score = calcularScoreQualidade(dados);
    
      sheet.appendRow([
        id,
        new Date(),
        dados.nfId,
        dados.produto,
        dados.escola || '',
        'QUALIDADE_PRODUTO',
        dados.nutricionista,
        dados.crn || '',
        dados.observacoes || '',
        JSON.stringify({
          aparencia: dados.aparencia,
          textura: dados.textura,
          odor: dados.odor,
          temperatura: dados.temperatura,
          embalagem: dados.embalagem,
          rotulagem: dados.rotulagem
        }),
        score >= 70 ? 'APROVADO' : score >= 50 ? 'CONDICIONAL' : 'REPROVADO',
        null,
        'Score: ' + score + '%',
        'EMITIDO'
      ]);
    
      Logger.log('Avaliação de qualidade registrada: ' + id + ' - Score: ' + score);
      return { 
        success: true, 
        id: id, 
        score: score,
        resultado: score >= 70 ? 'APROVADO' : score >= 50 ? 'CONDICIONAL' : 'REPROVADO'
      };
    
    } catch (e) {
      Logger.log('Erro avaliarQualidadeNutricional: ' + e.message);
      return { success: false, error: e.message };
    }
  } catch (error) {
    Logger.log("Erro em avaliarQualidadeNutricional: " + error.message);
    throw error;
  }
}

/**
 * Calcula score de qualidade nutricional
 */
function calcularScoreQualidade(dados) {
  var criterios = {
    aparencia: { peso: 20, valor: dados.aparencia || 0 },
    textura: { peso: 15, valor: dados.textura || 0 },
    odor: { peso: 20, valor: dados.odor || 0 },
    temperatura: { peso: 20, valor: dados.temperatura || 0 },
    embalagem: { peso: 15, valor: dados.embalagem || 0 },
    rotulagem: { peso: 10, valor: dados.rotulagem || 0 }
  };
  
  var totalPeso = 0;
  var totalScore = 0;
  
  for (var c in criterios) {
    totalPeso += criterios[c].peso;
    totalScore += (criterios[c].valor / 5) * criterios[c].peso; // Escala 1-5
  }
  
  return Math.round((totalScore / totalPeso) * 100);
}

// ============================================================================
// DASHBOARD E MÉTRICAS DO NUTRICIONISTA
// ============================================================================

/**
 * Obtém métricas do dashboard do nutricionista
 * @returns {Object} Métricas consolidadas
 */
function obterMetricasNutricionista() {
  try {
    try {
      try {
        var metricas = {
          cardapiosEspeciais: { pendentes: 0, aprovados: 0, total: 0 },
          substituicoes: { pendentes: 0, aprovadas: 0, rejeitadas: 0 },
          pareceres: { emitidos: 0, mesAtual: 0 },
          avaliacoes: { realizadas: 0, scoreMedia: 0 },
          alertas: []
        };
    
        var ss = getSS();
        var hoje = new Date();
        var inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    
        // Cardápios Especiais
        var sheetCard = ss.getSheetByName(SHEET_CARDAPIOS_ESPECIAIS);
        if (sheetCard && sheetCard.getLastRow() > 1) {
          var dataCard = sheetCard.getDataRange().getValues();
          var statusIdx = dataCard[0].indexOf('Status');
      
          for (var i = 1; i < dataCard.length; i++) {
            metricas.cardapiosEspeciais.total++;
            var status = dataCard[i][statusIdx];
            if (status === 'PENDENTE' || status === 'EM_ANALISE') metricas.cardapiosEspeciais.pendentes++;
            if (status === 'APROVADO') metricas.cardapiosEspeciais.aprovados++;
          }
        }
    
        // Substituições
        var sheetSub = ss.getSheetByName(SHEET_SUBSTITUICOES);
        if (sheetSub && sheetSub.getLastRow() > 1) {
          var dataSub = sheetSub.getDataRange().getValues();
          var statusSubIdx = dataSub[0].indexOf('Status');
      
          for (var j = 1; j < dataSub.length; j++) {
            var statusSub = dataSub[j][statusSubIdx];
            if (statusSub === 'PENDENTE') metricas.substituicoes.pendentes++;
            else if (statusSub === 'APROVADO') metricas.substituicoes.aprovadas++;
            else if (statusSub === 'REJEITADO') metricas.substituicoes.rejeitadas++;
          }
        }
    
        // Pareceres
        var sheetPar = ss.getSheetByName(SHEET_PARECERES);
        if (sheetPar && sheetPar.getLastRow() > 1) {
          var dataPar = sheetPar.getDataRange().getValues();
          var dataEmIdx = dataPar[0].indexOf('Data_Emissao');
      
          for (var k = 1; k < dataPar.length; k++) {
            metricas.pareceres.emitidos++;
            var dataEmissao = new Date(dataPar[k][dataEmIdx]);
            if (dataEmissao >= inicioMes) metricas.pareceres.mesAtual++;
          }
        }
    
        // Gerar alertas
        if (metricas.cardapiosEspeciais.pendentes > 5) {
          metricas.alertas.push({
            tipo: 'warning',
            mensagem: metricas.cardapiosEspeciais.pendentes + ' cardápios especiais aguardando avaliação'
          });
        }
        if (metricas.substituicoes.pendentes > 3) {
          metricas.alertas.push({
            tipo: 'info',
            mensagem: metricas.substituicoes.pendentes + ' substituições pendentes de aprovação'
          });
        }
    
        return { success: true, metricas: metricas };
      } catch (e) {
        Logger.log('Erro obterMetricasNutricionista: ' + e.message);
        return { success: false, error: e.message };
      }
    } catch (error) {
      Logger.log("Erro em obterMetricasNutricionista: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em obterMetricasNutricionista: " + error.message);
    throw error;
  }
}

// ============================================================================
// FUNÇÕES DE MENU E INTERFACE
// ============================================================================

/**
 * Abre interface do Nutricionista
 */
function abrirWorkflowNutricionista() {
  try {
    try {
      var html = HtmlService.createTemplateFromFile('UI_Workflow_Nutricionista').evaluate()
        .setWidth(420).setHeight(700).setTitle('Nutricionista - Gestão Nutricional');
      SpreadsheetApp.getUi().showSidebar(html);
    } catch (e) {
      Logger.log('Erro ao abrir Workflow Nutricionista: ' + e.message);
    }
  } catch (error) {
    Logger.log("Erro em abrirWorkflowNutricionista: " + error.message);
    throw error;
  }
}

/**
 * Abre dashboard do nutricionista em modal
 */
function abrirDashboardNutricionista() {
  try {
    var html = HtmlService.createHtmlOutputFromFile('UI_Dashboard_Nutricionista')
      .setWidth(900).setHeight(650).setTitle('Dashboard Nutricionista');
    SpreadsheetApp.getUi().showModalDialog(html, 'Dashboard Nutricionista - UNIAE');
  } catch (e) {
    Logger.log('Erro ao abrir Dashboard Nutricionista: ' + e.message);
  }
}

/**
 * Adiciona menu do nutricionista
 */
function adicionarMenuNutricionista() {
  try {
    try {
      var ui = SpreadsheetApp.getUi();
      ui.createMenu('🥗 Nutricionista')
        .addItem('📊 Dashboard', 'abrirDashboardNutricionista')
        .addSeparator()
        .addItem('🍽️ Cardápios Especiais', 'abrirWorkflowNutricionista')
        .addItem('🔄 Substituições', 'abrirSubstituicoesNutricionista')
        .addItem('📝 Emitir Parecer', 'abrirParecerTecnico')
        .addSeparator()
        .addItem('📋 Relatório Mensal', 'gerarRelatorioMensalNutri')
        .addToUi();
    } catch (e) {
      Logger.log('Menu Nutricionista não criado - UI não disponível');
    }
  } catch (error) {
    Logger.log("Erro em adicionarMenuNutricionista: " + error.message);
    throw error;
  }
}

function abrirSubstituicoesNutricionista() {
  try {
    try {
      var html = HtmlService.createTemplateFromFile('UI_Workflow_Nutricionista').evaluate()
        .setWidth(420).setHeight(650).setTitle('Substituições de Alimentos');
      SpreadsheetApp.getUi().showSidebar(html);
    } catch (e) {
      Logger.log('Erro: ' + e.message);
    }
  } catch (error) {
    Logger.log("Erro em abrirSubstituicoesNutricionista: " + error.message);
    throw error;
  }
}

function abrirParecerTecnico() {
  try {
    try {
      var html = HtmlService.createTemplateFromFile('UI_Workflow_Nutricionista').evaluate()
        .setWidth(420).setHeight(650).setTitle('Parecer Técnico');
      SpreadsheetApp.getUi().showSidebar(html);
    } catch (e) {
      Logger.log('Erro: ' + e.message);
    }
  } catch (error) {
    Logger.log("Erro em abrirParecerTecnico: " + error.message);
    throw error;
  }
}

// ============================================================================
// RELATÓRIOS
// ============================================================================

/**
 * Gera relatório mensal do nutricionista
 * @returns {Object} Dados do relatório
 */
function gerarRelatorioMensalNutri() {
  try {
    try {
      var metricas = obterMetricasNutricionista();
      if (!metricas.success) return metricas;
    
      var m = metricas.metricas;
      var relatorio = {
        periodo: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'MMMM/yyyy'),
        geradoEm: new Date(),
        resumo: {
          cardapiosAvaliados: m.cardapiosEspeciais.total - m.cardapiosEspeciais.pendentes,
          cardapiosPendentes: m.cardapiosEspeciais.pendentes,
          substituicoesAvaliadas: m.substituicoes.aprovadas + m.substituicoes.rejeitadas,
          pareceresEmitidos: m.pareceres.mesAtual
        },
        indicadores: {
          taxaAprovacaoCardapios: m.cardapiosEspeciais.total > 0 
            ? Math.round((m.cardapiosEspeciais.aprovados / m.cardapiosEspeciais.total) * 100) : 0,
          taxaAprovacaoSubstituicoes: (m.substituicoes.aprovadas + m.substituicoes.rejeitadas) > 0
            ? Math.round((m.substituicoes.aprovadas / (m.substituicoes.aprovadas + m.substituicoes.rejeitadas)) * 100) : 0
        }
      };
    
      // Mostrar relatório
      var ui = SpreadsheetApp.getUi();
      var msg = '📊 RELATÓRIO MENSAL - NUTRICIONISTA\n\n';
      msg += '📅 Período: ' + relatorio.periodo + '\n\n';
      msg += '🍽️ CARDÁPIOS ESPECIAIS:\n';
      msg += '   • Avaliados: ' + relatorio.resumo.cardapiosAvaliados + '\n';
      msg += '   • Pendentes: ' + relatorio.resumo.cardapiosPendentes + '\n';
      msg += '   • Taxa de aprovação: ' + relatorio.indicadores.taxaAprovacaoCardapios + '%\n\n';
      msg += '🔄 SUBSTITUIÇÕES:\n';
      msg += '   • Avaliadas: ' + relatorio.resumo.substituicoesAvaliadas + '\n';
      msg += '   • Taxa de aprovação: ' + relatorio.indicadores.taxaAprovacaoSubstituicoes + '%\n\n';
      msg += '📝 PARECERES:\n';
      msg += '   • Emitidos no mês: ' + relatorio.resumo.pareceresEmitidos + '\n';
    
      ui.alert('Relatório Mensal', msg, ui.ButtonSet.OK);
    
      return { success: true, relatorio: relatorio };
    } catch (e) {
      Logger.log('Erro gerarRelatorioMensalNutri: ' + e.message);
      return { success: false, error: e.message };
    }
  } catch (error) {
    Logger.log("Erro em gerarRelatorioMensalNutri: " + error.message);
    throw error;
  }
}

// ============================================================================
// FUNÇÕES DE OCORRÊNCIAS DE DESCARTE
// ============================================================================

/**
 * Lista ocorrências de descarte pendentes de validação
 * Usa CRUDService para aderência ao padrão CRUD
 * @returns {Array} Lista de ocorrências pendentes
 */
function listarOcorrenciasDescartePendentes() {
  try {
    try {
      try {
        if (typeof CRUDService !== 'undefined') {
          var result = CRUDService.read(SHEET_OCORRENCIAS_DESCARTE, { 
            filters: { Status: 'PENDENTE' },
            limit: 500 
          });
      
          if (!result.success) return [];
      
          return result.data.map(function(row) {
            return {
              id: row.ID,
              dataOcorrencia: row.Data_Ocorrencia,
              escola: row.Escola,
              produto: row.Produto,
              quantidade: row.Quantidade,
              unidade: row.Unidade,
              motivoDescarte: row.Motivo_Descarte,
              lote: row.Lote,
              validade: row.Validade,
              fornecedor: row.Fornecedor,
              responsavelRegistro: row.Responsavel_Registro,
              observacoes: row.Observacoes,
              status: row.Status,
              rowIndex: row._rowIndex
            };
          });
        }
    
        // Fallback
        var sheet = getSS().getSheetByName(SHEET_OCORRENCIAS_DESCARTE);
        if (!sheet || sheet.getLastRow() <= 1) return [];
    
        var data = sheet.getDataRange().getValues();
        var headers = data[0];
        var ocorrencias = [];
    
        for (var i = 1; i < data.length; i++) {
          var row = data[i];
          if (row[headers.indexOf('Status')] === 'PENDENTE') {
            ocorrencias.push({
              id: row[0],
              dataOcorrencia: row[headers.indexOf('Data_Ocorrencia')],
              escola: row[headers.indexOf('Escola')],
              produto: row[headers.indexOf('Produto')],
              quantidade: row[headers.indexOf('Quantidade')],
              unidade: row[headers.indexOf('Unidade')],
              motivoDescarte: row[headers.indexOf('Motivo_Descarte')],
              lote: row[headers.indexOf('Lote')],
              validade: row[headers.indexOf('Validade')],
              fornecedor: row[headers.indexOf('Fornecedor')],
              responsavelRegistro: row[headers.indexOf('Responsavel_Registro')],
              observacoes: row[headers.indexOf('Observacoes')],
              status: 'PENDENTE',
              rowIndex: i + 1
            });
          }
        }
    
        return ocorrencias;
      } catch (e) {
        Logger.log('Erro listarOcorrenciasDescartePendentes: ' + e.message);
        return [];
      }
    } catch (error) {
      Logger.log("Erro em listarOcorrenciasDescartePendentes: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em listarOcorrenciasDescartePendentes: " + error.message);
    throw error;
  }
}

/**
 * Valida ocorrência de descarte
 * Usa CRUDService para aderência ao padrão CRUD
 * @param {Object} dados - Dados da validação
 * @returns {Object} Resultado da operação
 */
function validarOcorrenciaDescarte(dados) {
  try {
    try {
      try {
        try {
          if (!dados.ocorrenciaId) return { success: false, error: 'Ocorrência não selecionada' };
          if (!dados.nutricionista) return { success: false, error: 'Nutricionista é obrigatório' };
          if (!dados.decisao) return { success: false, error: 'Decisão é obrigatória' };
    
          if (typeof CRUDService !== 'undefined') {
            var result = CRUDService.read(SHEET_OCORRENCIAS_DESCARTE, { 
              filters: { ID: dados.ocorrenciaId },
              limit: 1 
            });
      
            if (!result.success || result.data.length === 0) {
              return { success: false, error: 'Ocorrência não encontrada' };
            }
      
            var rowIndex = result.data[0]._rowIndex;
      
            var updateResult = CRUDService.update(SHEET_OCORRENCIAS_DESCARTE, rowIndex, {
              Status: dados.decisao,
              Nutricionista_Validacao: dados.nutricionista,
              Data_Validacao: new Date(),
              Parecer_Nutricional: dados.parecer || '',
              Acao_Corretiva: dados.acaoCorretiva || ''
            });
      
            if (updateResult.success) {
              Logger.log('Ocorrência de descarte validada: ' + dados.ocorrenciaId);
              return { 
                success: true, 
                mensagem: 'Ocorrência ' + (dados.decisao === 'VALIDADO' ? 'validada' : 'rejeitada')
              };
            }
            return { success: false, error: updateResult.error || 'Erro ao atualizar' };
          }
    
          // Fallback
          var sheet = getSS().getSheetByName(SHEET_OCORRENCIAS_DESCARTE);
          if (!sheet) return { success: false, error: 'Sheet não encontrada' };
    
          var data = sheet.getDataRange().getValues();
          var headers = data[0];
    
          for (var i = 1; i < data.length; i++) {
            if (data[i][0] === dados.ocorrenciaId) {
              sheet.getRange(i + 1, headers.indexOf('Status') + 1).setValue(dados.decisao);
              sheet.getRange(i + 1, headers.indexOf('Nutricionista_Validacao') + 1).setValue(dados.nutricionista);
              sheet.getRange(i + 1, headers.indexOf('Data_Validacao') + 1).setValue(new Date());
              sheet.getRange(i + 1, headers.indexOf('Parecer_Nutricional') + 1).setValue(dados.parecer || '');
              sheet.getRange(i + 1, headers.indexOf('Acao_Corretiva') + 1).setValue(dados.acaoCorretiva || '');
        
              return { 
                success: true, 
                mensagem: 'Ocorrência ' + (dados.decisao === 'VALIDADO' ? 'validada' : 'rejeitada')
              };
            }
          }
    
          return { success: false, error: 'Ocorrência não encontrada' };
        } catch (e) {
          Logger.log('Erro validarOcorrenciaDescarte: ' + e.message);
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em validarOcorrenciaDescarte: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em validarOcorrenciaDescarte: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em validarOcorrenciaDescarte: " + error.message);
    throw error;
  }
}

/**
 * Registra nova ocorrência de descarte
 * Usa CRUDService para aderência ao padrão CRUD
 * @param {Object} dados - Dados da ocorrência
 * @returns {Object} Resultado da operação
 */
function registrarOcorrenciaDescarte(dados) {
  try {
    try {
      try {
        try {
          if (!dados.escola) return { success: false, error: 'Escola é obrigatória' };
          if (!dados.produto) return { success: false, error: 'Produto é obrigatório' };
          if (!dados.quantidade) return { success: false, error: 'Quantidade é obrigatória' };
          if (!dados.motivoDescarte) return { success: false, error: 'Motivo do descarte é obrigatório' };
    
          var id = 'DESC_' + new Date().getTime();
    
          var registro = {
            ID: id,
            Data_Ocorrencia: new Date(),
            Escola: dados.escola,
            Produto: dados.produto,
            Quantidade: dados.quantidade,
            Unidade: dados.unidade || 'UN',
            Motivo_Descarte: dados.motivoDescarte,
            Lote: dados.lote || '',
            Validade: dados.validade || '',
            Fornecedor: dados.fornecedor || '',
            NF_Referencia: dados.nfReferencia || '',
            Responsavel_Registro: dados.responsavel || '',
            Nutricionista_Validacao: '',
            Data_Validacao: '',
            Parecer_Nutricional: '',
            Acao_Corretiva: '',
            Status: 'PENDENTE',
            Observacoes: dados.observacoes || ''
          };
    
          if (typeof CRUDService !== 'undefined') {
            var result = CRUDService.create(SHEET_OCORRENCIAS_DESCARTE, registro);
            if (!result.success) {
              return { success: false, error: result.error || 'Erro ao registrar ocorrência' };
            }
            Logger.log('Ocorrência de descarte registrada via CRUD: ' + id);
            return { success: true, id: id, mensagem: 'Ocorrência registrada com sucesso' };
          }
    
          // Fallback
          var sheet = getOrCreateWorkflowSheet(SHEET_OCORRENCIAS_DESCARTE);
    
          if (sheet.getLastRow() === 0) {
            var headers = Object.keys(registro);
            headers.push('dataCriacao', 'dataAtualizacao');
            sheet.appendRow(headers);
          }
    
          var values = Object.values(registro);
          values.push(new Date(), new Date());
          sheet.appendRow(values);
    
          Logger.log('Ocorrência de descarte registrada: ' + id);
          return { success: true, id: id, mensagem: 'Ocorrência registrada com sucesso' };
    
        } catch (e) {
          Logger.log('Erro registrarOcorrenciaDescarte: ' + e.message);
          return { success: false, error: e.message };
        }
      } catch (error) {
        Logger.log("Erro em registrarOcorrenciaDescarte: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em registrarOcorrenciaDescarte: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em registrarOcorrenciaDescarte: " + error.message);
    throw error;
  }
}

// ============================================================================
// REGISTRO DO MÓDULO
// ============================================================================

Logger.log('✅ Core_Workflow_Nutricionista.gs carregado');
