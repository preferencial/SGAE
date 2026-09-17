/**
 * @fileoverview Constantes do Sistema de Atesto de Gêneros Alimentícios
 * @version 4.0.0
 *
 * Sistema UNIAE/CRE-PP - Conferência e Atesto de Notas Fiscais
 *
 * FONTE NORMATIVA:
 * - Manual de Análise Processual: Recebimento e Atesto de Gêneros Alimentícios
 * - Manual da Alimentação Escolar do Distrito Federal
 * - Nota Técnica Nº 1/2025 - SEE/SUAPE/DIAE/GPAE
 *
 * BASE LEGAL:
 * - Lei nº 4.320/1964 (Arts. 62 e 63) - Liquidação da despesa
 * - Lei nº 11.947/2009 - PNAE
 * - Lei nº 14.133/2021 (Art. 117) - Fiscalização de contratos
 * - Resolução CD/FNDE nº 06/2020 - Atestação por Comissão
 */

var CONSTANTS = (function() {
  'use strict';

  return {
    /**
     * Versão do sistema
     */
    VERSION: '4.0.0',

    /**
     * Informações do Sistema
     */
    SISTEMA: {
      NOME: 'Sistema de Atesto de Gêneros Alimentícios',
      SIGLA: 'SAGA',
      ORGAO: 'UNIAE/CRE-PP',
      REGIONAL: 'Coordenação Regional de Ensino de Planaltina',
      SECRETARIA: 'Secretaria de Estado de Educação do Distrito Federal - SEEDF',
      PROGRAMA: 'Programa de Alimentação Escolar do Distrito Federal - PAE/DF'
    },

    /**
     * Status do Processo de Atesto (Fluxo Principal)
     */
    STATUS_PROCESSO: {
      // Etapa 1 - Recebimento na UE
      AGUARDANDO_ENTREGA: 'Aguardando Entrega',
      ENTREGA_REALIZADA: 'Entrega Realizada',
      RECEBIDO_CONFORME: 'Recebido Conforme',
      RECEBIDO_PARCIAL: 'Recebido Parcial',
      RECUSADO_TOTAL: 'Recusado Total',

      // Etapa 2 - Consolidação
      AGUARDANDO_DOCS: 'Aguardando Documentação',
      DOCS_RECEBIDOS: 'Documentação Recebida',

      // Etapa 3 - Análise UNIAE
      EM_ANALISE: 'Em Análise pela Comissão',
      SOMA_VERIFICADA: 'Soma Verificada',
      PDGP_CONFERIDO: 'PDGP Conferido',
      NF_CONSULTADA: 'NF-e Consultada',
      ATESTO_COMISSAO: 'Atestado pela Comissão',
      PENDENCIA_DOCUMENTAL: 'Pendência Documental',

      // Etapa 4 - Liquidação
      AGUARDANDO_EXECUTOR: 'Aguardando Atesto Executor',
      ATESTADO_EXECUTOR: 'Atestado pelo Executor',
      EM_LIQUIDACAO: 'Em Liquidação',
      LIQUIDADO: 'Liquidado',
      PAGO: 'Pago'
    },

    /**
     * Status de Notas Fiscais
     */
    STATUS_NF: {
      RECEBIDA: 'Recebida',
      EM_CONFERENCIA: 'Em Conferência',
      CONFERIDA: 'Conferida',
      ATESTADA: 'Atestada',
      PENDENTE: 'Pendente',
      APROVADA: 'Aprovada',
      REJEITADA: 'Rejeitada',
      CANCELADA: 'Cancelada'
    },

    /**
     * Status de Entregas/Recebimentos
     */
    STATUS_ENTREGA: {
      AGENDADA: 'Agendada',
      EM_TRANSITO: 'Em Trânsito',
      ENTREGUE_CONFORME: 'Entregue Conforme',
      ENTREGUE_PARCIAL: 'Entregue Parcial',
      RECUSADA: 'Recusada',
      CANCELADA: 'Cancelada'
    },

    /**
     * Motivos de Recusa (Manual Alimentação Escolar DF - Item 12)
     */
    MOTIVOS_RECUSA: {
      TEMPERATURA_INADEQUADA: 'Temperatura inadequada',
      EMBALAGEM_VIOLADA: 'Embalagem violada ou danificada',
      PRODUTO_VENCIDO: 'Produto vencido',
      VALIDADE_INSUFICIENTE: 'Validade insuficiente (< mínimo contratual)',
      CARACTERISTICAS_ALTERADAS: 'Características organolépticas alteradas',
      QUANTIDADE_DIVERGENTE: 'Quantidade divergente da NF/Termo',
      PRODUTO_DIFERENTE: 'Produto diferente do solicitado/contratado',
      PRESENCA_PRAGAS: 'Presença de pragas ou sujidades',
      SEM_ROTULAGEM: 'Sem rotulagem ou rotulagem incompleta',
      TRANSPORTE_INADEQUADO: 'Transporte inadequado',
      SEM_INSCRICAO_INSTITUCIONAL: 'Sem inscrição PRODUTO INSTITUCIONAL',
      MARCA_DIVERGENTE: 'Marca diferente da contratada'
    },

    /**
     * Tipos de Recusa (categorias)
     */
    TIPO_RECUSA: {
      QUALIDADE: 'Qualidade',
      QUANTIDADE: 'Quantidade',
      VALIDADE: 'Validade',
      TEMPERATURA: 'Temperatura',
      EMBALAGEM: 'Embalagem',
      DOCUMENTACAO: 'Documentação',
      TRANSPORTE: 'Transporte'
    },

    /**
     * Tipos de Glosa
     */
    TIPO_GLOSA: {
      PRECO: 'Preço',
      QUANTIDADE: 'Quantidade',
      QUALIDADE: 'Qualidade',
      CONTRATUAL: 'Contratual',
      FISCAL: 'Fiscal',
      RECUSA_NAO_SUBSTITUIDA: 'Recusa não substituída'
    },

    /**
     * Tipos de Gêneros Alimentícios
     */
    TIPO_GENERO: {
      PERECIVEL: 'Perecível',
      NAO_PERECIVEL: 'Não Perecível'
    },

    /**
     * Critérios de Temperatura (Manual Item 12.1)
     * Conforme Tabela 1 do Manual de Análise Processual
     */
    TEMPERATURA: {
      CONGELADOS: { min: -18, max: -12, unidade: '°C', descricao: 'Produtos congelados' },
      RESFRIADOS: { min: 0, max: 10, unidade: '°C', descricao: 'Produtos resfriados em geral' },
      CARNES_RESFRIADAS: { min: 0, max: 7, unidade: '°C', descricao: 'Carnes resfriadas' },
      PESCADO_RESFRIADO: { min: 0, max: 3, unidade: '°C', descricao: 'Pescado resfriado' }
    },

    /**
     * Prazos Legais (em dias úteis, exceto quando especificado)
     * Conforme Manual de Análise Processual e Nota Técnica 1/2025
     */
    PRAZOS: {
      ANALISE_COMISSAO: 5,              // 5 dias úteis para análise pela Comissão
      SUBSTITUICAO_PERECIVEL_HORAS: 24, // 24 horas para perecíveis urgentes
      SUBSTITUICAO_NAO_PERECIVEL: 5,    // 5 dias úteis para não perecíveis
      PAGAMENTO_CONTRATUAL: 30,         // 30 dias para pagamento (evitar multas)
      GUARDA_DOCUMENTOS: 1825,          // 5 anos (Lei 11.947/2009 Art. 15 § 2º)
      VALIDADE_MINIMA_PERECIVEL: 4,     // 4-7 dias mínimo conforme contrato
      VALIDADE_MINIMA_NAO_PERECIVEL: 30 // 30 dias mínimo
    },

    /**
     * Horários de Entrega Contratual (Seção 4.3 do Manual)
     */
    HORARIO_ENTREGA: {
      MANHA: { inicio: '08:00', fim: '12:00' },
      TARDE: { inicio: '14:00', fim: '18:00' }
    },

    /**
     * Base Legal Completa
     */
    BASE_LEGAL: {
      // Leis Federais
      LEI_4320_1964: {
        nome: 'Lei nº 4.320/1964',
        artigos: 'Arts. 62 e 63',
        assunto: 'Liquidação da despesa pública',
        aplicacao: 'Atesto como verificação do direito adquirido pelo credor'
      },
      LEI_11947_2009: {
        nome: 'Lei nº 11.947/2009',
        assunto: 'Programa Nacional de Alimentação Escolar - PNAE',
        aplicacao: 'Diretrizes da alimentação escolar'
      },
      LEI_14133_2021: {
        nome: 'Lei nº 14.133/2021',
        artigos: 'Art. 117',
        assunto: 'Nova Lei de Licitações - Fiscalização de contratos',
        aplicacao: 'Designação de fiscal, registro de ocorrências'
      },
      // Resoluções
      RESOLUCAO_FNDE_06_2020: {
        nome: 'Resolução CD/FNDE nº 06/2020',
        assunto: 'Atendimento da alimentação escolar',
        aplicacao: 'Atestação por Comissão de Recebimento'
      },
      // Normas Sanitárias
      RDC_ANVISA_216_2004: {
        nome: 'RDC ANVISA 216/2004',
        assunto: 'Boas práticas para serviços de alimentação',
        aplicacao: 'Controle de qualidade, temperatura, higiene'
      },
      // Documentos Locais
      MANUAL_ALIMENTACAO_DF: {
        nome: 'Manual da Alimentação Escolar do DF',
        assunto: 'Procedimentos operacionais PAE/DF',
        aplicacao: 'Critérios de recebimento, armazenamento, distribuição'
      },
      NOTA_TECNICA_1_2025: {
        nome: 'Nota Técnica Nº 1/2025 - SEE/SUAPE/DIAE/GPAE',
        assunto: 'Alimentos Perecíveis',
        aplicacao: 'Procedimentos de notificação e monitoramento de qualidade'
      }
    },

    /**
     * Estrutura Organizacional
     */
    ESTRUTURA: {
      DIAE: 'Diretoria de Alimentação Escolar',
      GPAE: 'Gerência de Planejamento, Acompanhamento e Oferta da Alimentação Escolar',
      GEVMON: 'Gerência de Vigilância e Monitoramento da Qualidade Alimentar',
      GCONAE: 'Gerência de Contas e Controle da Distribuição, Aquisição e Fornecimento',
      UNIAE: 'Unidade de Infraestrutura e Apoio Educacional',
      CRE: 'Coordenação Regional de Ensino',
      UE: 'Unidade Escolar'
    },

    /**
     * Níveis de usuário
     */
    USER_ROLES: {
      ADMIN: 'Administrador',
      GESTOR: 'Gestor',
      OPERADOR: 'Operador',
      VISUALIZADOR: 'Visualizador'
    },

    /**
     * Formatos de data
     */
    DATE_FORMATS: {
      BR: 'dd/MM/yyyy',
      BR_TIME: 'dd/MM/yyyy HH:mm:ss',
      ISO: 'yyyy-MM-dd',
      ISO_TIME: 'yyyy-MM-dd HH:mm:ss'
    },

    /**
     * Limites de performance
     */
    LIMITS: {
      CACHE_DURATION: 300,
      MAX_ROWS_PER_READ: 1000,
      BATCH_SIZE: 100,
      PAGE_SIZE: 50,
      MAX_EXECUTION_TIME: 300000,
      DAILY_QUOTA: 20000
    },

    /**
     * Mensagens padrão
     */
    MESSAGES: {
      SUCCESS_CREATE: 'Registro criado com sucesso',
      SUCCESS_UPDATE: 'Registro atualizado com sucesso',
      SUCCESS_DELETE: 'Registro excluído com sucesso',
      ERROR_NOT_FOUND: 'Registro não encontrado',
      ERROR_PERMISSION: 'Permissão negada',
      ERROR_VALIDATION: 'Dados inválidos',
      ERROR_QUOTA: 'Limite de uso excedido'
    },

    /**
     * Regex patterns
     */
    PATTERNS: {
      CNPJ: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
      CPF: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
      EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      PHONE: /^\(\d{2}\)\s?\d{4,5}-?\d{4}$/,
      CEP: /^\d{5}-?\d{3}$/
    },

    /**
     * Cores para status
     */
    COLORS: {
      SUCCESS: '#d4edda',
      WARNING: '#fff3cd',
      ERROR: '#f8d7da',
      INFO: '#d1ecf1',
      NEUTRAL: '#f8f9fa'
    }
  };
})();
