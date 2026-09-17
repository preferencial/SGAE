/**
 * CORE_FRONTEND_SIMPLIFICADO
 * Funções de backend otimizadas para o dashboard intuitivo
 * Menos dados, mais velocidade, respostas diretas
 * @version 1.0.0
 */

// ============================================
// MÉTRICAS SIMPLIFICADAS
// ============================================

/**
 * Retorna métricas essenciais para o dashboard
 * Otimizado para carregar rápido
 */
function getDashboardMetricsSimplified() {
  try {
    const ss = getSS();

    // Contagens rápidas
    const nfs = getSheetData_('Notas_Fiscais');
    const entregas = getSheetData_('Entregas');
    const recusas = getSheetData_('Recusas');
    const glosas = getSheetData_('Glosas');

    const totalNFs = nfs.length;
    const pendentes = nfs.filter(n => !n.Status_NF || n.Status_NF === 'Recebida' || n.Status_NF === 'Conferida').length;
    const atestadas = nfs.filter(n => n.Status_NF === 'Atestada' || n.Status_NF === 'Liquidada').length;
    const aguardandoEntrega = nfs.filter(n => n.Status_NF === 'Recebida').length;
    const prontoAtestar = nfs.filter(n => n.Status_NF === 'Conferida').length;

    return {
      success: true,
      data: {
        notasFiscais: totalNFs,
        pendentes: pendentes,
        atestadas: atestadas,
        recusas: recusas.length,
        glosas: glosas.length,
        aguardandoEntrega: aguardandoEntrega,
        prontoAtestar: prontoAtestar
      }
    };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Retorna itens que precisam de atenção
 */
function getItensPendentes(filtro) {
  try {
    try {
      const nfs = getSheetData_('Notas_Fiscais');
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      let itens = [];

      // NFs pendentes
      nfs.forEach((nf, idx) => {
        if (!nf.Status_NF || nf.Status_NF === 'Recebida' || nf.Status_NF === 'Conferida') {
          const dataNF = nf.Data_Emissao ? new Date(nf.Data_Emissao) : null;
          const diasPendente = dataNF ? Math.floor((hoje - dataNF) / (1000 * 60 * 60 * 24)) : 0;

          itens.push({
            id: nf.ID || idx + 2,
            tipo: 'nf',
            titulo: `NF ${nf.Numero_NF || '-'} - ${nf.Fornecedor_Nome || 'Sem fornecedor'}`,
            subtitulo: `R$ ${Number(nf.Valor_Total || 0).toFixed(2)} • ${nf.Status_NF || 'Pendente'}`,
            urgente: diasPendente > 5,
            acao: nf.Status_NF === 'Conferida' ? 'atestar' : 'conferir',
            acaoLabel: nf.Status_NF === 'Conferida' ? 'Atestar' : 'Conferir'
          });
        }
      });

      // Aplicar filtro
      if (filtro === 'urgente') {
        itens = itens.filter(i => i.urgente);
      } else if (filtro === 'hoje') {
        // Filtrar por itens de hoje (simplificado)
        itens = itens.slice(0, 10);
      }

      // Ordenar: urgentes primeiro
      itens.sort((a, b) => (b.urgente ? 1 : 0) - (a.urgente ? 1 : 0));

      return { success: true, data: itens.slice(0, 20) };
    } catch (e) {
      return { success: false, message: e.message, data: [] };
    }
  } catch (error) {
    Logger.log("Erro em getItensPendentes: " + error.message);
    throw error;
  }
}

// ============================================
// AÇÕES SIMPLIFICADAS
// ============================================

/**
 * Registra entrega de forma simplificada
 */
function registrarEntregaSimplificada(dados) {
  try {
    try {
      const ss = getSS();
      let sheet = ss.getSheetByName('Entregas');

      if (!sheet) {
        sheet = ss.insertSheet('Entregas');
        sheet.appendRow(['ID', 'Data_Entrega', 'NF_ID', 'Unidade_Escolar', 'Conforme', 'Observacoes', 'Registrado_Por', 'Data_Registro']);
      }

      const id = Utilities.getUuid().substring(0, 8);
      const agora = new Date();
      const usuario = Session.getActiveUser().getEmail();

      sheet.appendRow([
        id,
        dados.dataEntrega || agora.toISOString().split('T')[0],
        dados.notaFiscalId,
        dados.unidadeEscolar,
        dados.conforme ? 'Sim' : 'Não',
        dados.observacoes || '',
        usuario,
        agora
      ]);

      // Atualizar status da NF se conforme
      if (dados.conforme) {
        atualizarStatusNF_(dados.notaFiscalId, 'Conferida');
      }

      return { success: true, message: 'Entrega registrada!' };
    } catch (e) {
      return { success: false, message: e.message };
    }
  } catch (error) {
    Logger.log("Erro em registrarEntregaSimplificada: " + error.message);
    throw error;
  }
}

/**
 * Atesta NFs em lote
 */
function atestarNFsEmLote(ids) {
  try {
    try {
      let count = 0;
      ids.forEach(id => {
        if (atualizarStatusNF_(id, 'Atestada')) {
          count++;
        }
      });
      return { success: true, message: `${count} NF(s) atestada(s)` };
    } catch (e) {
      return { success: false, message: e.message };
    }
  } catch (error) {
    Logger.log("Erro em atestarNFsEmLote: " + error.message);
    throw error;
  }
}

/**
 * Registra recusa simplificada
 */
function registrarRecusaSimplificada(dados) {
  try {
    try {
      try {
        const ss = getSS();
        let sheet = ss.getSheetByName('Recusas');

        if (!sheet) {
          sheet = ss.insertSheet('Recusas');
          sheet.appendRow(['ID', 'Data_Recusa', 'NF_ID', 'Motivo', 'Observacoes', 'Registrado_Por', 'Data_Registro']);
        }

        const id = Utilities.getUuid().substring(0, 8);
        const agora = new Date();

        sheet.appendRow([
          id,
          agora.toISOString().split('T')[0],
          dados.notaFiscalId,
          dados.motivo,
          dados.observacoes || '',
          Session.getActiveUser().getEmail(),
          agora
        ]);

        atualizarStatusNF_(dados.notaFiscalId, 'Recusada');

        return { success: true, message: 'Recusa registrada!' };
      } catch (e) {
        return { success: false, message: e.message };
      }
    } catch (error) {
      Logger.log("Erro em registrarRecusaSimplificada: " + error.message);
      throw error; // Re-lança para tratamento superior
    }
  } catch (error) {
    Logger.log("Erro em registrarRecusaSimplificada: " + error.message);
    throw error;
  }
}

/**
 * Registra glosa simplificada
 */
function registrarGlosaSimplificada(dados) {
  try {
    try {
      try {
        const ss = getSS();
        let sheet = ss.getSheetByName('Glosas');

        if (!sheet) {
          sheet = ss.insertSheet('Glosas');
          sheet.appendRow(['ID', 'Data_Glosa', 'NF_ID', 'Motivo', 'Valor_Glosa', 'Observacoes', 'Registrado_Por', 'Data_Registro']);
        }

        const id = Utilities.getUuid().substring(0, 8);
        const agora = new Date();

        sheet.appendRow([
          id,
          agora.toISOString().split('T')[0],
          dados.notaFiscalId,
          dados.motivo,
          dados.valorGlosa || 0,
          dados.observacoes || '',
          Session.getActiveUser().getEmail(),
          agora
        ]);

        atualizarStatusNF_(dados.notaFiscalId, 'Glosada');

        return { success: true, message: 'Glosa registrada!' };
      } catch (e) {
        return { success: false, message: e.message };
      }
    } catch (error) {
      Logger.log("Erro em registrarGlosaSimplificada: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em registrarGlosaSimplificada: " + error.message);
    throw error;
  }
}

// ============================================
// CONSULTAS PARA SELECTS
// ============================================

/**
 * Lista NFs aguardando entrega
 */
function getNFsAguardandoEntrega() {
  try {
    try {
      const nfs = getSheetData_('Notas_Fiscais');
      const pendentes = nfs
        .filter(n => !n.Status_NF || n.Status_NF === 'Recebida')
        .map(n => ({
          id: n.ID || n.rowIndex,
          numero: n.Numero_NF || '-',
          fornecedor: n.Fornecedor_Nome || '-',
          valor: Number(n.Valor_Total || 0)
        }));
      return { success: true, data: pendentes };
    } catch (e) {
      return { success: false, data: [], message: e.message };
    }
  } catch (error) {
    Logger.log("Erro em getNFsAguardandoEntrega: " + error.message);
    throw error;
  }
}

/**
 * Lista NFs prontas para atestar
 */
function getNFsProntasParaAtestar() {
  try {
    const nfs = getSheetData_('Notas_Fiscais');
    const prontas = nfs
      .filter(n => n.Status_NF === 'Conferida')
      .map(n => ({
        id: n.ID || n.rowIndex,
        numero: n.Numero_NF || '-',
        fornecedor: n.Fornecedor_Nome || '-',
        valor: Number(n.Valor_Total || 0)
      }));
    return { success: true, data: prontas };
  } catch (e) {
    return { success: false, data: [], message: e.message };
  }
}

/**
 * Lista fornecedores ativos
 */
function listarFornecedoresAtivos() {
  try {
    try {
      const fornecedores = getSheetData_('Fornecedores');
      const ativos = fornecedores
        .filter(f => f.Status !== 'Inativo')
        .map(f => ({ nome: f.Nome || f.Razao_Social || '-' }));
      return { success: true, data: ativos };
    } catch (e) {
      // Fallback: pegar fornecedores das NFs
      const nfs = getSheetData_('Notas_Fiscais');
      const nomes = [...new Set(nfs.map(n => n.Fornecedor_Nome).filter(Boolean))];
      return { success: true, data: nomes.map(n => ({ nome: n })) };
    }
  } catch (error) {
    Logger.log("Erro em listarFornecedoresAtivos: " + error.message);
    throw error;
  }
}

/**
 * Lista escolas ativas
 */
function listarEscolasAtivas() {
  try {
    try {
      const escolas = getSheetData_('Escolas');
      const ativas = escolas
        .filter(e => e.Status !== 'Inativa')
        .map(e => ({ nome: e.Nome || '-' }));
      return { success: true, data: ativas };
    } catch (e) {
      // Fallback: pegar escolas das entregas
      const entregas = getSheetData_('Entregas');
      const nomes = [...new Set(entregas.map(e => e.Unidade_Escolar).filter(Boolean))];
      return { success: true, data: nomes.map(n => ({ nome: n })) };
    }
  } catch (error) {
    Logger.log("Erro em listarEscolasAtivas: " + error.message);
    throw error;
  }
}

// ============================================
// HELPERS INTERNOS
// ============================================

/**
 * Lê dados de uma aba como array de objetos
 */
function getSheetData_(sheetName) {
  try {
    try {
      const ss = getSS();
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) return [];

      const data = sheet.getDataRange().getValues();
      if (data.length < 2) return [];

      const headers = data[0];
      return data.slice(1).map((row, idx) => {
        const obj = { rowIndex: idx + 2 };
        headers.forEach((h, i) => {
          obj[h.toString().replace(/\s+/g, '_')] = row[i];
        });
        return obj;
      });
    } catch (e) {
      return [];
    }
  } catch (error) {
    Logger.log("Erro em getSheetData_: " + error.message);
    throw error;
  }
}

/**
 * Atualiza status de uma NF
 */
function atualizarStatusNF_(nfId, novoStatus) {
  try {
    try {
      try {
        const ss = getSS();
        const sheet = ss.getSheetByName('Notas_Fiscais');
        if (!sheet) return false;

        const data = sheet.getDataRange().getValues();
        const headers = data[0];
        const idCol = headers.indexOf('ID');
        const statusCol = headers.indexOf('Status_NF');

        if (statusCol === -1) return false;

        for (let i = 1; i < data.length; i++) {
          if (data[i][idCol] == nfId || i + 1 == nfId) {
            sheet.getRange(i + 1, statusCol + 1).setValue(novoStatus);
            return true;
          }
        }
        return false;
      } catch (e) {
        return false;
      }
    } catch (error) {
      Logger.log("Erro em atualizarStatusNF_: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em atualizarStatusNF_: " + error.message);
    throw error;
  }
}

/**
 * Abre o dashboard intuitivo
 */
function abrirDashboardIntuitivo() {
  try {
    const html = HtmlService.createTemplateFromFile('UI_Dashboard_Intuitivo').evaluate()
      .setWidth(1200)
      .setHeight(800)
      .setTitle('UNIAE - Dashboard');
    SpreadsheetApp.getUi().showModalDialog(html, 'UNIAE - Sistema Simplificado');
  } catch (error) {
    Logger.log("Erro em abrirDashboardIntuitivo: " + error.message);
    throw error;
  }
}

/**
 * Adiciona menu para o dashboard intuitivo
 */
function adicionarMenuIntuitivo() {
  try {
    const ui = SpreadsheetApp.getUi();
    ui.createMenu('🚀 UNIAE Rápido')
      .addItem('📊 Abrir Dashboard', 'abrirDashboardIntuitivo')
      .addSeparator()
      .addItem('➕ Nova NF', 'abrirNovaNFRapido')
      .addItem('🚚 Registrar Entrega', 'abrirEntregaRapido')
      .addItem('✅ Atestar NFs', 'abrirAtestarRapido')
      .addToUi();
  } catch (error) {
    Logger.log("Erro em adicionarMenuIntuitivo: " + error.message);
    throw error;
  }
}

function abrirNovaNFRapido() {
  try {
    const html = HtmlService.createHtmlOutput(`
      <script>
        google.script.run.withSuccessHandler(function() {
          google.script.host.close();
        }).abrirDashboardIntuitivo();
        setTimeout(function() {
          if (window.opener) window.opener.acaoRapida('nova-nf');
        }, 500);
      </script>
    `).setWidth(100).setHeight(50);
    SpreadsheetApp.getUi().showModelessDialog(html, 'Abrindo...');
  } catch (error) {
    Logger.log("Erro em abrirNovaNFRapido: " + error.message);
    throw error;
  }
}

function abrirEntregaRapido() {
  abrirDashboardIntuitivo();
}

function abrirAtestarRapido() {
  abrirDashboardIntuitivo();
}


// ============================================
// ATALHOS DIRETOS - ABRIR JÁ NA AÇÃO
// ============================================

/**
 * Abre dashboard direto na ação de Nova NF
 */
function abrirNovaNFDireto() {
  try {
    const html = HtmlService.createHtmlOutput(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, sans-serif; padding: 40px; text-align: center; background: #f5f7fa; }
          .spinner { width: 40px; height: 40px; border: 4px solid #eee; border-top-color: #667eea; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px; }
          @keyframes spin { to { transform: rotate(360deg); } }
          p { color: #666; }
        </style>
      </head>
      <body>
        <div class="spinner"></div>
        <p>Abrindo formulário...</p>
        <script>
          setTimeout(function() {
            google.script.run.abrirDashboardIntuitivo();
            // Sinaliza para abrir modal de nova NF
            sessionStorage.setItem('abrirAcao', 'nova-nf');
          }, 100);
        </script>
      </body>
      </html>
    `).setWidth(300).setHeight(200);
    SpreadsheetApp.getUi().showModelessDialog(html, 'Carregando...');
  } catch (error) {
    Logger.log("Erro em abrirNovaNFDireto: " + error.message);
    throw error;
  }
}

/**
 * Abre dashboard direto na ação de Entrega
 */
function abrirEntregaDireto() {
  abrirDashboardIntuitivo();
}

/**
 * Abre dashboard direto na ação de Atestar
 */
function abrirAtestarDireto() {
  abrirDashboardIntuitivo();
}

/**
 * Abre dashboard direto na ação de Problema
 */
function abrirProblemaDireto() {
  abrirDashboardIntuitivo();
}

// ============================================
// CRIAR NOTA FISCAL SIMPLIFICADA
// ============================================

/**
 * Cria nota fiscal de forma simplificada
 */
function createNotaFiscalSimplificado(dados) {
  try {
    const ss = getSS();
    let sheet = ss.getSheetByName('Notas_Fiscais');

    // Criar aba se não existir
    if (!sheet) {
      sheet = ss.insertSheet('Notas_Fiscais');
      sheet.appendRow([
        'ID', 'Numero_NF', 'Data_Emissao', 'Fornecedor_Nome',
        'Valor_Total', 'Nota_Empenho', 'Status_NF',
        'Registrado_Por', 'Data_Registro'
      ]);
    }

    const id = Utilities.getUuid().substring(0, 8);
    const agora = new Date();
    const usuario = Session.getActiveUser().getEmail();

    sheet.appendRow([
      id,
      dados.notaFiscal,
      dados.dataEmissao,
      dados.fornecedor,
      dados.valorTotal,
      dados.notaEmpenho || '',
      dados.status || 'Recebida',
      usuario,
      agora
    ]);

    return { success: true, message: 'NF cadastrada!', id: id };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Lista notas fiscais (versão simplificada)
 * @deprecated Use listNotasFiscais() do UI_WebApp.gs que consolida todas as fontes
 */
function listNotasFiscais_Simplificado(limite) {
  try {
    try {
      const nfs = getSheetData_('Notas_Fiscais');
      const resultado = nfs.slice(0, limite || 100).map(nf => ({
        id: nf.ID || nf.rowIndex,
        numero: nf.Numero_NF,
        fornecedor: nf.Fornecedor_Nome,
        valor: Number(nf.Valor_Total || 0),
        status: nf.Status_NF,
        data: nf.Data_Emissao
      }));
      return { success: true, data: resultado };
    } catch (e) {
      return { success: false, data: [], message: e.message };
    }
  } catch (error) {
    Logger.log("Erro em listNotasFiscais_Simplificado: " + error.message);
    throw error;
  }
}
