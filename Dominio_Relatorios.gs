// Requer V8 runtime habilitado no Apps Script
'use strict';

/**
 * DOMINIO_RELATORIOS
 * Consolidado de : Reports.gs, ReportGenerator.gs, ReportExporter.gs
 * @version 2.0.0
 * @created 2025-11-04
 */


// ---- Reports.gs ----
function gerarRelatorioEstatistico() {
  // delegar para implementação determinística para manter compatibilidade
  return gerarRelatorioEstatisticoImpl();
}

// implementação privada (padrão já presente no sistema)
function gerarRelatorioEstatisticoImpl() {
  try {
    var dados = coletarDadosPlanilhasDrive();
    var prices = [];
    var quantities = [];
    dados.forEach(function(sheetRec) {
      var headers = sheetRec.headers;
      var idxQuantidade = (function(h){ return _findHeaderIndex(h, ['quantidade','qty','quant']); })(headers);
      var idxPreco = (function(h){ return _findHeaderIndex(h, ['preco','preço','preco_unitario','preco unitario','price','valor']); })(headers);
      sheetRec.rows.forEach(function(row) {
        if (idxQuantidade >= 0) {
          var q = Number(row[idxQuantidade]);
          if (!isNaN(q) && isFinite(q)) quantities.push(q);
        }
        if (idxPreco >= 0) {
          var p = Number(row[idxPreco]);
          if (!isNaN(p) && isFinite(p)) prices.push(p);
        }
      });
    });
    var statsFor = function(arr) {
      arr = arr.slice().sort(function(a,b){return a-b;});
      var n = arr.length;
      if (n == 0) return {count : 0};
      var sum = arr.reduce(function(a,b){return a+b;},0);
      var mean = sum/n;
      var median;
      if ((n%2==1)) {
        median = arr[(n-1)/2];
      } else {
        median = (arr[n/2-1]+arr[n/2])/2;
      }
      var sq = arr.reduce(function(a,b){return a + Math.pow(b - mean,2);},0);
      var std;
      if (n>1) {
        std = Math.sqrt(sq/(n-1));
      } else {
        std = 0;
      }
    };
    var report = {quantidade : statsFor(quantities), preco : statsFor(prices)};

    // Preparar dados para exportação
    var output = [['Métrica','Valor']];
    Object.keys(report).forEach(function(k) {
      var r = report[k];
      output.push([k + '.count', r.count || 0]);
      output.push([k + '.mean', r.mean || 0]);
      output.push([k + '.median', r.median || 0]);
      output.push([k + '.std', r.std || 0]);
      output.push([k + '.min', r.min || 0]);
      output.push([k + '.max', r.max || 0]);
    });

    // Exportar como arquivo
    createAndNotifyReport('Relatorio_Estatistico', output, {
      tabColor : '#4CAF50'
    });
  } catch (error) {
    Logger.log("Erro em gerarRelatorioEstatisticoImpl: " + error.message);
    throw error;
  }
}

// Gera relatórios agregados e gráficos por gênero, período e fornecedor
function gerarRelatoriosEGraficos() {
  try {
    try {
      try {
        var dados = coletarDadosPlanilhasDrive();
        // Agregar por genero (campo 'genero' ou 'produto'), por fornecedor e por mês
        var byGenero = {};
        var byFornecedorMonth = {};
        dados.forEach(function(sheetRec) {
          var headers = sheetRec.headers;
          var idxGenero = _findHeaderIndex(headers, ['genero','produto','item']);
          var idxFornecedor = _findHeaderIndex(headers, ['fornecedor','supplier','provedor']);
          var idxQuantidade = _findHeaderIndex(headers, ['quantidade','qty','quant']);
          var idxData = _findHeaderIndex(headers, ['data','date']);
          sheetRec.rows.forEach(function(row) {
            var genero;
            if (idxGenero>=0) {
              genero = String(row[idxGenero]).trim();
            } else {
              genero = '';
            }
            var fornecedor;
            if (idxFornecedor>=0) {
              fornecedor = String(row[idxFornecedor]).trim();
            } else {
              fornecedor = '';
            }
            var quantidade;
            if (idxQuantidade>=0) {
              quantidade = Number(row[idxQuantidade]) || 0;
            } else {
              quantidade = 0;
            }
            var rawDate;
            if (idxData>=0) {
              rawDate = row[idxData];
            } else {
              rawDate = null;
            }
            var month;
            if (rawDate) {
              month = Utilities.formatDate(new Date(rawDate), Session.getScriptTimeZone(), 'yyyy-MM');
            } else {
              month = '';
            }
            if (genero) {
              byGenero[genero] = (byGenero[genero] || 0) + quantidade;
            }
            if (fornecedor && month) {
              byFornecedorMonth[fornecedor] = byFornecedorMonth[fornecedor] || {};
              byFornecedorMonth[fornecedor][month] = (byFornecedorMonth[fornecedor][month] || 0) + quantidade;
            }
          });
        });
        // Criar aba resumo e preencher dados
        var ss = getSS();
        var sheetName = 'Resumo_Relatorios_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmmss');
        var sheet = createTemporarySheet('Resumo_Relatorios', ['Gênero / Produto', 'Quantidade Total']);
        sheet.getRange(1,1).setValue('Gênero / Produto');
        sheet.getRange(1,2).setValue('Quantidade Total');
        var r = 2;
        Object.keys(byGenero).sort().forEach(function(g) {
          sheet.getRange(r,1).setValue(g);
          sheet.getRange(r,2).setValue(byGenero[g]);
          r++
        });
        // Criar gráfico de barras por gênero
        try {
          var chart = sheet.newChart()
            .asColumnChart()
            .addRange(sheet.getRange(1,1,r-1,2))
            .setPosition(1,4,0,0)
            .setOption('title', 'Quantidade por Gênero/Produto')
            .build();
          sheet.insertChart(chart);
        } catch (e) {
          // Ignorar se falhar inserção de gráfico
        }
        // Criar aba por fornecedor/mes (tabela pivot simples)
        var sheetF = createTemporarySheet(sheetName + '_Fornecedor_Mes', ['Fornecedor', 'Mes', 'Quantidade']);
        sheetF.getRange(1,1).setValue('Fornecedor');
        sheetF.getRange(1,2).setValue('Mes');
        sheetF.getRange(1,3).setValue('Quantidade');
        var rr = 2;
        Object.keys(byFornecedorMonth).sort().forEach(function(f) {
          Object.keys(byFornecedorMonth[f]).sort().forEach(function(month) {
            sheetF.getRange(rr,1).setValue(f);
            sheetF.getRange(rr,2).setValue(month);
            sheetF.getRange(rr,3).setValue(byFornecedorMonth[f][month]);
            rr++;
          });
        });
        // gráfico de série temporal exemplo (primeiro fornecedor com dados)
        var firstSupplier = Object.keys(byFornecedorMonth)[0];
        if (firstSupplier) {
          var tempRows = [];
          var months = Object.keys(byFornecedorMonth[firstSupplier]).sort();
          var headerRow = ['Mês'].concat(months);
          var valueRow = [firstSupplier].concat(months.map(function(m){ return byFornecedorMonth[firstSupplier][m] || 0; }));
          var chartSheet = createTemporarySheet(sheetName + '_Chart_' + firstSupplier.substring(0,10), ['Mês']);
          chartSheet.getRange(1,1,1,headerRow.length).setValues([headerRow]);
          chartSheet.getRange(2,1,1,valueRow.length).setValues([valueRow]);
          try {
            var c = chartSheet.newChart()
              .asLineChart()
              .addRange(chartSheet.getRange(1,1,2,headerRow.length))
              .setPosition(1,headerRow.length+2,0,0)
              .setOption('title', 'Série Mensal - ' + firstSupplier)
              .build();
            chartSheet.insertChart(c);
          } catch (e) {
            Logger.log('Erro ao inserir gráfico : ' + e.message);
          }
        }

        getSafeUi().alert('Relatórios e gráficos gerados nas abas : ' + sheetName + ' e variações.');
      } catch (error) {
        Logger.log("Erro em gerarRelatoriosEGraficos: " + error.message);
        throw error;
      }
    } catch (error) {
      Logger.log("Erro em gerarRelatoriosEGraficos: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em gerarRelatoriosEGraficos: " + error.message);
    throw error;
  }
}

// ---- ReportGenerator.gs ----
/**
 * ReportGenerator.gs - Gerador de Relatórios Inteligentes
 * Sistema UNIAE CRE PP/Cruzeiro - Portaria 244/2006
 *
 * Funcionalidades :
 * - Geração de relatórios com Gemini Flash 2.0
 * - Exportação para Google Drive
 * - Formatação profissional com tabelas
 * - Integração com dados do sistema e Gmail
 */

/**
 * CONFIGURAÇÕES DO GERADOR DE RELATÓRIOS
 */
var REPORT_CONFIG = {
  // Pasta padrão no Drive,
  driveFolderName : 'UNIAE - Relatórios Automáticos',

  // Formatos de exportação,
  exportFormats : ['DOCX', 'PDF'],

  // Templates de relatório,
  templates : {
    EMAIL_ANALYSIS : 'Análise de Emails - Casos Recorrentes',
    SYSTEM_OVERVIEW : 'Visão Geral do Sistema',
    SUPPLIER_ANALYSIS : 'Análise de Fornecedores',
    COMPLIANCE_REPORT : 'Relatório de Conformidade',
    SPECIAL_STUDENTS_ANALYSIS : 'Análise de Alunos com Necessidades Especiais',
    MENU_CREATION_SUGGESTIONS : 'Sugestões de Cardápios e Substituições'
  },

  // Configurações de formatação,
  formatting : {
    pageSize : 'A4',
    margins : '2.5cm',
    fontSize : '11pt',
    fontFamily : 'Arial'
  }
};

/**
 * Gera relatório completo de análise de emails
 */
function generateEmailAnalysisReport(analysis, processedEmails) {
  try {
    Logger.log('Iniciando geração de relatório de análise de emails/* spread */');

    // Preparar dados para o relatório
    var reportData = prepareEmailReportData(analysis, processedEmails);

    // Gerar conteúdo com Gemini
    var reportContent = generateIntelligentReport(reportData, 'EMAIL_ANALYSIS');

    // Criar documento formatado
    var formattedReport = formatReportContent(reportContent, 'EMAIL_ANALYSIS');

    // Adicionar tabelas e gráficos
    var finalReport = addTablesAndCharts(formattedReport, reportData);

    return {
      content : finalReport,
      data : reportData,
      generated_at : new Date().toISOString(),
      type : 'EMAIL_ANALYSIS'
    };

  } catch (error) {
    Logger.log('Erro na geração do relatório : ' + error.message);
    throw error;
  }
}


/**
 * Prepara dados para o relatório de emails
 */
function prepareEmailReportData(analysis, processedEmails) {
  try {
    var data = {
      summary : {
        total_emails : processedEmails.length,
        relevant_emails : processedEmails.filter(function(e) { return e.relevance_score > 0.7; }).length,
        categories : analysis.summary.categories || {},
        period : GMAIL_SCRAPER_CONFIG.searchPeriodDays + ' dias',
        generated_date : new Date().toLocaleDateString('pt-BR')
      },

      detailed_findings : {
        high_priority_cases : processedEmails.filter(function(e) {
          return e.relevance_score > 0.8 && e.needs_action;
        })

        // recurring_issues : extractRecurringIssues(processedEmails)

        // supplier_mentions : consolidateSupplierMentions(processedEmails)

        // system_recommendations : generateSystemRecommendations(processedEmails)
      },

      tables : {
        email_categories : createCategoryTable(analysis.summary.categories),
        high_relevance_emails : createHighRelevanceTable(processedEmails),
        action_items : createActionItemsTable(processedEmails)
      }

        // gemini_insights : analysis.gemini_analysis
    };

  } catch (error) {
    Logger.log("Erro em prepareEmailReportData: " + error.message);
    throw error;
  }
}

/**
 * Extrai problemas recorrentes dos emails
 */
function extractRecurringIssues(processedEmails) {
  var issues = {};

  for (var i = 0; i < processedEmails.length; i++) {
    var email = processedEmails[i];

    for (var j = 0; j < email.extracted_data.problemas.length; j++) {
      var problem = email.extracted_data.problemas[j];
      issues[problem] = (issues[problem] || 0) + 1;
    }
  }

  // Retornar apenas problemas que aparecem mais de uma vez
  var recurring = {};
  for (var issue in issues) {
    if (issues[issue] > 1) {
      recurring[issue] = issues[issue];
    }
  }

}

/**
 * Consolida menções de fornecedores
 */
function consolidateSupplierMentions(processedEmails) {
  var suppliers = {};

  for (var i = 0; i < processedEmails.length; i++) {
    var email = processedEmails[i];

    for (var j = 0; j < email.extracted_data.fornecedores.length; j++) {
      var supplier = email.extracted_data.fornecedores[j];
      if (supplier && supplier.length > 2) {
        suppliers[supplier] = (suppliers[supplier] || 0) + 1;
      }
    }
  }

}

/**
 * Gerar recomendações do sistema
 */
function generateSystemRecommendations(data) {
  try {
    var recommendations = [];

    try {
      // Validação segura de dados
      if (!data || typeof data != 'object') {
        Logger.log('Dados inválidos fornecidos para recomendações');
        return [{
          priority : 'low',
          title : 'Dados insuficientes',
          description : 'Não há dados suficientes para gerar recomendações'
        }];
      }

      // Validar se data tem array ou propriedades esperadas
      var items = data.items || data.data || [];
      if (!Array.isArray(items)) {
        Logger.log('Formato de dados inesperado');
        items = [];
      }

      // Recomendações baseadas em quantidade
      if (items.length == 0) {
        recommendations.push({
          priority : 'medium',
          title : 'Nenhum registro encontrado',
          description : 'Comece cadastrando notas fiscais no sistema'
        });
      }

      // Filtrar itens pendentes (se houver)
      var pendentes;
      if (items.filter) {
        pendentes = items.filter(function(item) {});
      } else {
        pendentes = [];
      }

      if (pendentes.length > 0) {
        recommendations.push({
          priority : 'high',
          title : 'Itens pendentes de conferência',
          description : 'Existem ' + pendentes.length + ' itens aguardando conferência'
        });
      }

      // Recomendação geral
      if (recommendations.length == 0) {
        recommendations.push({
          priority : 'low',
          title : 'Sistema operando normalmente',
          description : 'Todos os itens estão em conformidade'
        });
      }

    } catch (e) {
      Logger.log('Erro ao gerar recomendações : ' + e.message);
      recommendations.push({
        priority : 'low',
        title : 'Erro ao processar',
        description : e.message
      });
    }
  } catch (error) {
    Logger.log("Erro em generateSystemRecommendations: " + error.message);
    throw error;
  }
  }


/**
 * Cria tabela de categorias de email
 */
function createCategoryTable(categories) {
  try {
    var table = {
      headers : ['Categoria', 'Quantidade', 'Percentual'],
      rows : []
    };

    var total = Object.values(categories).reduce(function(sum, count) { return sum + count; }, 0);

    for (var category in categories) {
      var count = categories[category];
      var percentage;
      if (total > 0) {
        percentage = ((count / total) * 100).toFixed(1) + '%';
      } else {
        percentage = '0%';
      }

      table.rows.push([
        translateCategory(category),
        count.toString(),
        percentage
      ]);
    }

  } catch (error) {
    Logger.log("Erro em createCategoryTable: " + error.message);
    throw error;
  }
}

/**
 * Cria tabela de emails de alta relevância
 */
function createHighRelevanceTable(processedEmails) {
  try {
    var table = {
      headers : ['Data', 'Remetente', 'Assunto', 'Categoria', 'Score', 'Ação Sugerida'],
      rows : []
    };

    var highRelevanceEmails = processedEmails
      .filter(function(e) { return e.relevance_score > 0.7; })
      .sort(function(a, b) { return b.relevance_score - a.relevance_score; })
      .slice(0, 10); // Top 10

    for (var i = 0; i < highRelevanceEmails.length; i++) {
      var email = highRelevanceEmails[i];

      table.rows.push([
        new Date(email.original.date).toLocaleDateString('pt-BR'),
        email.original.sender.split('<')[0].trim(),
        email.original.subject.substring(0, 50) + (email.original.subject.length > 50 ? '/* spread */' : ''),
        translateCategory(email.category),
        (email.relevance_score * 100).toFixed(0) + '%',
        email.needs_action ? 'Revisar' : 'Monitorar'
      ]);
    }

  } catch (error) {
    Logger.log("Erro em createHighRelevanceTable: " + error.message);
    throw error;
  }
}

/**
 * Cria tabela de itens de ação
 */
function createActionItemsTable(processedEmails) {
  try {
    var table = {
      headers : ['Prioridade', 'Descrição', 'Aba Sugerida', 'Prazo'],
      rows : []
    };

    var actionEmails = processedEmails.filter(function(e) { return e.needs_action; });

    for (var i = 0; i < actionEmails.length; i++) {
      var email = actionEmails[i];

      var priority;
      if (email.relevance_score > 0.9) {
        priority = 'CRÍTICA';
      } else {
        priority = email.relevance_score > 0.8 ? 'ALTA' : 'MÉDIA';
      }

      var description = 'Email de ' + email.original.sender.split('<')[0].trim() +
                       ' sobre ' + email.category.toLowerCase();

      table.rows.push([
        priority,
        description,
        email.suggested_sheet,
        priority == 'CRÍTICA' ? '24h' : priority == 'ALTA' ? '48h' : '1 semana'
      ]);
    }

  } catch (error) {
    Logger.log("Erro em createActionItemsTable: " + error.message);
    throw error;
  }
}

/**
 * Traduz categoria para português
 */
function translateCategory(category) {
  var translations = {
    'NOTA_FISCAL' : 'Nota Fiscal',
    'ENTREGA' : 'Entrega',
    'PROBLEMA' : 'Problema',
    'ORIENTACAO' : 'Orientação',
    'FORNECEDOR' : 'Fornecedor',
    'GERAL' : 'Geral'
  };

}

/**
 * Formata conteúdo do relatório
 */
function formatReportContent(reportContent, reportType) {
  try {
    var template = REPORT_CONFIG.templates[reportType] || 'Relatório Personalizado';

    var formattedContent = '';

    // Cabeçalho
    formattedContent += '# ' + template + '\n';
    formattedContent += '**Sistema UNIAE CRE PP/Cruzeiro**\n';
    formattedContent += '**Portaria 244/2006 - Comissão de Recebimento**\n';
    formattedContent += '**Data de Geração : ** ' + new Date().toLocaleDateString('pt-BR') + '\n\n';
    formattedContent += '---\n\n';

    // Conteúdo principal
    if (reportContent.content) {
      formattedContent += reportContent.content;
    } else if (typeof reportContent == 'string') {
      formattedContent += reportContent;
    } else {
      formattedContent += JSON.stringify(reportContent, null, 2);
    }

    // Rodapé
    formattedContent += '\n\n---\n';
    formattedContent += '*Relatório gerado automaticamente pelo Sistema UNIAE*\n';
    formattedContent += '*Gemini Flash 2.0 - ' + new Date().toISOString() + '*';

  } catch (error) {
    Logger.log("Erro em formatReportContent: " + error.message);
    throw error;
  }
}

/**
 * Adiciona tabelas e gráficos ao relatório
 */
function addTablesAndCharts(reportContent, reportData) {
  var enhancedContent = reportContent;

  // Adicionar tabelas
  if (reportData.tables) {
    enhancedContent += '\n\n## TABELAS DETALHADAS\n\n';

    for (var tableName in reportData.tables) {
      var table = reportData.tables[tableName];

      enhancedContent += '### ' + formatTableName(tableName) + '\n\n';
      enhancedContent += formatMarkdownTable(table);
      enhancedContent += '\n\n';
    }
  }

  // Adicionar gráficos em texto
  if (reportData.summary && reportData.summary.categories) {
    enhancedContent += '## DISTRIBUIÇÃO POR CATEGORIA\n\n';
    enhancedContent += createTextChart(reportData.summary.categories);
    enhancedContent += '\n\n';
  }

}

/**
 * Formata nome da tabela
 */
function formatTableName(tableName) {
  var names = {
    'email_categories' : 'Categorias de Email',
    'high_relevance_emails' : 'Emails de Alta Relevância',
    'action_items' : 'Itens de Ação'
  };

}

/**
 * Formata tabela em Markdown
 */
function formatMarkdownTable(table) {
  try {
    if (!table.headers || !table.rows) {
      return 'Tabela vazia';
    }

    var markdown = '';

    // Cabeçalhos
    markdown += '| ' + table.headers.join(' | ') + ' |\n';
    markdown += '|' + table.headers.map(function() { return ' --- '; }).join('|') + '|\n';

    // Linhas
    for (var i = 0; i < table.rows.length; i++) {
      markdown += '| ' + table.rows[i].join(' | ') + ' |\n';
    }

  } catch (error) {
    Logger.log("Erro em formatMarkdownTable: " + error.message);
    throw error;
  }
}

/**
 * Cria gráfico em texto
 */
function createTextChart(data) {
  try {
    var chart = '';
    var total = Object.values(data).reduce(function(sum, count) { return sum + count; }, 0);

    for (var category in data) {
      var count = data[category];
      var percentage;
      if (total > 0) {
        percentage = (count / total) * 100;
      } else {
        percentage = 0;
      }
      var barLength = Math.round(percentage / 2); // Escala para 50 caracteres max;

      var bar = '█'.repeat(barLength) + '░'.repeat(Math.max(0, 25 - barLength));

      chart += translateCategory(category).padEnd(15) + ' | ' + bar + ' | ' +
               count.toString().padStart(3) + ' (' + percentage.toFixed(1) + '%)\n';
    }

  } catch (error) {
    Logger.log("Erro em createTextChart: " + error.message);
    throw error;
  }
}

/**
 * Salva relatório no Google Drive
 */
function saveReportToDrive(report) {
  try {
    try {
      // Obter ou criar pasta de relatórios
      var folder = getOrCreateReportsFolder();

      // Gerar nome do arquivo
      var fileName = generateReportFileName(report.type);

      // Criar documento Google Docs
      var doc = DocumentApp.create(fileName);
      var body = doc.getBody();

      // Limpar conteúdo padrão
      body.clear();

      // Adicionar conteúdo formatado
      addFormattedContentToDoc(body, report.content);

      // Mover para pasta correta
      var file = DriveApp.getFileById(doc.getId());
      folder.addFile(file);
      DriveApp.getRootFolder().removeFile(file);

      // Gerar versão PDF
      var pdfBlob = doc.getAs('application/pdf');
      var pdfFile = folder.createFile(pdfBlob.setName(fileName + '.pdf'));

      Logger.log('Relatório salvo : ' + fileName);

      return {
        name : fileName,
        docId : doc.getId(),
        pdfId : pdfFile.getId(),
        folderId : folder.getId(),
        url : doc.getUrl()
      };

    } catch (error) {
      Logger.log('Erro ao salvar relatório : ' + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em saveReportToDrive: " + error.message);
    throw error; // Re-lança para tratamento superior
  }
  }


/**
 * Obtém ou cria pasta de relatórios no Drive - APENAS PASTA RAIZ
 */
function getOrCreateReportsFolder() {
  try {
    var folderName = REPORT_CONFIG.driveFolderName;

    try {
      // Buscar APENAS na pasta raiz do Drive (sem subpastas)
      var rootFolder = DriveApp.getRootFolder();
      var folders = rootFolder.getFolders();

      while (folders.hasNext()) {
        var folder = folders.next();
        if (folder.getName() == folderName) {
          return folder;
        }
      }

      // Se não encontrou, criar na pasta raiz

    } catch (error) {
      Logger.log('Erro ao acessar pasta do Drive : ' + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em getOrCreateReportsFolder: " + error.message);
    throw error;
  }
  }


/**
 * Gera nome do arquivo do relatório
 */
function generateReportFileName(reportType) {
  try {
    var date = new Date();
    var dateStr = date.getFullYear() + '-' +
                  String(date.getMonth() + 1).padStart(2, '0') + '-' +
                  String(date.getDate()).padStart(2, '0');

    var timeStr = String(date.getHours()).padStart(2, '0') +
                  String(date.getMinutes()).padStart(2, '0');

    var typeStr = reportType || 'GERAL';

    return 'UNIAE_Relatorio_' + typeStr + '_' + dateStr + '_' + timeStr;
  } catch (error) {
    Logger.log("Erro em generateReportFileName: " + error.message);
    throw error;
  }
}

/**
 * Adiciona conteúdo formatado ao documento
 */
function addFormattedContentToDoc(body, content) {
  try {
    // Dividir conteúdo em linhas
    var lines = content.split('\n');

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];

      if (line.startsWith('# ')) {
        // Título principal
        var title = body.appendParagraph(line.substring(2));
      }
    }
  } catch (e) {
    Logger.log('Erro : ' + e.message);
  }
}

function generateSystemOverviewReport() {
  try {
    // Coletar dados do sistema
    var systemData = collectSystemData();

    // Gerar relatório com Gemini
    var reportContent = generateIntelligentReport(systemData, 'SYSTEM_OVERVIEW');

    // Formatar e salvar
    var formattedReport = formatReportContent(reportContent, 'SYSTEM_OVERVIEW');
    var finalReport = addTablesAndCharts(formattedReport, systemData);

    var report = {
      content : finalReport,
      data : systemData,
      generated_at : new Date().toISOString(),
      type : 'SYSTEM_OVERVIEW'
    };

    var driveFile = saveReportToDrive(report);

    var ui = getSafeUi();
    ui.alert(
      'Relatório Gerado',
      'Relatório de visão geral do sistema salvo no Drive : \n\n' + driveFile.name,
      ui.ButtonSet.OK
    );


  } catch (error) {
    Logger.log('Erro ao gerar relatório do sistema : ' + error.message);
    throw error;
  }
}

/**
 * Coleta dados do sistema para relatório
 */
function collectSystemData() {
  try {
    var data = {
      summary : {},
      tables : {},
      timestamp : new Date().toISOString()
    };

    try {
      // Dados das principais abas
      var sheets = ['Notas_Fiscais', 'Entregas', 'Recusas', 'Glosas', 'Fornecedores'];

      for (var i = 0; i < sheets.length; i++) {
        var sheetName = sheets[i];
        var sheetData = getSheetData(sheetName, 100);

        data.summary[sheetName] = {
          total_records : sheetData.count,
          last_update : new Date().toLocaleDateString('pt-BR')
        };
      }


    } catch (error) {
      Logger.log('Erro ao coletar dados do sistema : ' + error.message);
    }
  } catch (error) {
    Logger.log("Erro em collectSystemData: " + error.message);
    throw error;
  }
}

// ---- ReportExporter.gs ----
/**
 * ReportExporter.gs
 * Componente para exportar relatórios como arquivos na pasta do Drive
 * Em vez de criar abas, os relatórios são salvos como planilhas separadas
 */

/**
 * Exporta dados como nova planilha na pasta de relatórios
 * @param { string: string } reportName - Nome do relatório
 * @param { Array: Array } data - Dados em formato de array 2D
 * @param { Object: Object } options - Opções de formatação (opcional)
 * @return { Object: Object } Informações do arquivo criado
 */
function exportReportToFile(reportName, data, options) {
  try {
    try {
      try {
        options = options || {};

        try {
          // Obter pasta de relatórios
          var folderId = getReportsFolderId();
          var folder;

          try {
            folder = DriveApp.getFolderById(folderId);
          } catch (e) {
            Logger.log('Pasta de relatórios não encontrada. Criando nova pasta/* spread */');
            folder = DriveApp.createFolder('Relatórios - Sistema Notas Fiscais');
            setReportsFolderId(folder.getId());
            return {
              chaveAcesso : chaveAcesso,
              situacao : "ERRO",
              valida : false
            };
          }

          // Adicionar timestamp ao nome
          var timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmmss');
          var fileName = reportName + '_' + timestamp;

          // Criar nova planilha
          var newSs = SpreadsheetApp.create(fileName);
          var sheet = newSs.getActiveSheet();

          // Escrever dados
          if (data && data.length > 0) {
            sheet.getRange(1, 1, data.length, data[0].length).setValues(data);

            // Aplicar formatação básica
            if (options.headerRow != false) {
              var headerRange = sheet.getRange(1, 1, 1, data[0].length);
              headerRange
                .setBackground(options.headerColor || '#263238')
                .setFontColor('#FFFFFF')
                .setFontWeight('bold')
                .setHorizontalAlignment('center');

              sheet.setFrozenRows(1);
            }

            // Auto-ajustar colunas
            for (var i = 1; i <= data[0].length; i++) {
              sheet.autoResizeColumn(i);
              var width = sheet.getColumnWidth(i);
              if (width < 80) sheet.setColumnWidth(i, 80);
              if (width > 400) sheet.setColumnWidth(i, 400);
            }

            // Aplicar cor da aba se especificada
            if (options.tabColor) {
              sheet.setTabColor(options.tabColor);
            }

            // Renomear aba se especificado
            if (options.sheetName) {
              sheet.setName(options.sheetName);
            }
          }

          // Mover arquivo para pasta de relatórios
          var file = DriveApp.getFileById(newSs.getId());
          file.moveTo(folder);

          var result = {
            success : true,
            fileName : fileName,
            fileId : newSs.getId(),
            url : newSs.getUrl(),
            folderId : folder.getId(),
            folderUrl : folder.getUrl(),
            rowCount : data.length
          };

          Logger.log('Relatório exportado : ' + fileName + ' (' + data.length + ' linhas)');

        } catch (e) {
          Logger.log('Erro ao exportar relatório : ' + e.message);
          return {
            success : false,
            error : e.message
          };
        }
      } catch (error) {
        Logger.log("Erro em exportReportToFile: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em exportReportToFile: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em exportReportToFile: " + error.message);
    throw error;
  }
}

/**
 * Exporta múltiplas abas para um único arquivo
 * @param { string: string } reportName - Nome do relatório
 * @param { Array: Array } sheets - Array de objetos { name: name, data, options}
 * @return { Object: Object } Informações do arquivo criado
 */
function exportMultiSheetReport(reportName, sheets) {
  try {
    try {
      try {
        try {
          var folderId = getReportsFolderId();
          var folder;

          try {
            folder = DriveApp.getFolderById(folderId);
          } catch (e) {
            folder = DriveApp.createFolder('Relatórios - Sistema Notas Fiscais');
            setReportsFolderId(folder.getId());
            return {
              chaveAcesso : chaveAcesso,
              situacao : "ERRO",
              valida : false
            };
          }

          var timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmmss');
          var fileName = reportName + '_' + timestamp;

          // Criar planilha
          var newSs = SpreadsheetApp.create(fileName);

          // Remover aba padrão se houver mais de uma aba
          if (sheets.length > 1) {
            var defaultSheet = newSs.getSheets()[0];
          }

          // Criar cada aba
          sheets.forEach(function(sheetInfo, index) {
            var sheet;

            if (index == 0 && sheets.length == 1) {
              sheet = newSs.getActiveSheet();
              sheet.setName(sheetInfo.name);
            } else {
              sheet = newSs.insertSheet(sheetInfo.name);
            }

            // Escrever dados
            if (sheetInfo.data && sheetInfo.data.length > 0) {
              sheet.getRange(1, 1, sheetInfo.data.length, sheetInfo.data[0].length).setValues(sheetInfo.data);

              // Aplicar formatação
              var opts = sheetInfo.options || {};
              if (opts.headerRow != false) {
                var headerRange = sheet.getRange(1, 1, 1, sheetInfo.data[0].length);
                headerRange
                  .setBackground(opts.headerColor || '#263238')
                  .setFontColor('#FFFFFF')
                  .setFontWeight('bold')
                  .setHorizontalAlignment('center');

                sheet.setFrozenRows(1);
              }

              // Auto-ajustar colunas
              for (var i = 1; i <= sheetInfo.data[0].length; i++) {
                sheet.autoResizeColumn(i);
              }

              if (opts.tabColor) {
                sheet.setTabColor(opts.tabColor);
              }
            }
          });

          // Remover aba padrão se não foi usada
          if (sheets.length > 1) {
            newSs.deleteSheet(defaultSheet);
          }

          // Mover para pasta
          var file = DriveApp.getFileById(newSs.getId());
          file.moveTo(folder);

          return {
            success : true,
            fileName : fileName,
            fileId : newSs.getId(),
            url : newSs.getUrl(),
            folderId : folder.getId(),
            folderUrl : folder.getUrl(),
            sheetCount : sheets.length
          };

        } catch (e) {
          Logger.log('Erro ao exportar relatório multi-aba : ' + e.message);
          return {
            success : false,
            error : e.message
          };
        }
      } catch (error) {
        Logger.log("Erro em exportMultiSheetReport: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em exportMultiSheetReport: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em exportMultiSheetReport: " + error.message);
    throw error;
  }

}


/**
 * Cria relatório simples e exibe mensagem ao usuário
 */
function createAndNotifyReport(reportName, data, options) {
  try {
    options = options || {};

    var result = exportReportToFile(reportName, data, options);

    if (result.success) {
      var ui = getSafeUi();
      ui.alert('Relatório Criado!',
        'Relatório : ' + result.fileName + '\n' +
        'Linhas : ' + result.rowCount + '\n\n' +
        'Arquivo salvo na pasta de relatórios.\n' +
        'URL : ' + result.url,
        ui.ButtonSet.OK);
    } else {
      getSafeUi().alert('Erro', 'Não foi possível criar o relatório : ' + result.error, getSafeUi().ButtonSet.OK);
    }

  } catch (error) {
    Logger.log("Erro em createAndNotifyReport: " + error.message);
    throw error;
  }
}

/**
 * Lista relatórios na pasta
 */
function listReportsInFolder() {
  try {
    var folderId = getReportsFolderId();
    var folder = DriveApp.getFolderById(folderId);
    var files = folder.getFilesByType(MimeType.GOOGLE_SHEETS);

    var reports = [];
    while (files.hasNext()) {
      var file = files.next();
      reports.push({
        name : file.getName(),
        id : file.getId(),
        url : file.getUrl(),
        created : file.getDateCreated(),
        modified : file.getLastUpdated()
      });
    }

    reports.sort(function(a, b) {});


  } catch (e) {
    Logger.log('Erro ao listar relatórios : ' + e.message);
  }
}


/**
 * Exibe lista de relatórios ao usuário
 */
function showReportsList() {
  try {
    var reports = listReportsInFolder();
    var ui = getSafeUi();

    if (reports.length == 0) {
      ui.alert('Nenhum Relatório', 'Ainda não há relatórios na pasta.', ui.ButtonSet.OK);
      return;
    }

    var msg = 'RELATÓRIOS GERADOS (' + reports.length + ') : \n\n';

    reports.slice(0, 10).forEach(function(report, index) {
      var date = Utilities.formatDate(report.created, Session.getScriptTimeZone(), 'dd/MM/yyyy HH : mm');
      msg += (index + 1) + '. ' + report.name + '\n   Criado : ' + date + '\n\n';
    });

    if (reports.length > 10) {
      msg += '\n/* spread */ e mais ' + (reports.length - 10) + ' relatórios.\n';
    }

    msg += '\nAcesse a pasta completa de relatórios no Drive.';

    safeAlert('Relatórios Disponíveis', msg, ui.ButtonSet.OK);
  } catch (error) {
    Logger.log("Erro em showReportsList: " + error.message);
    throw error;
  }
}

/**
 * Limpa relatórios antigos (mais de X dias)
 */
function cleanOldReports(daysOld) {
  daysOld = daysOld || 90; // Padrão : 90 dias

  try {
    var folderId = getReportsFolderId();
    var folder = DriveApp.getFolderById(folderId);
    var files = folder.getFilesByType(MimeType.GOOGLE_SHEETS);

    var now = new Date();
    var cutoffDate = new Date(now.getTime() - (daysOld * 24 * 60 * 60 * 1000));
    var deleted = 0;

    while (files.hasNext()) {
      var file = files.next();
      if (file.getDateCreated() < cutoffDate) {
        file.setTrashed(true);
        deleted++
      }
    }

    getSafeUi().alert('Limpeza Concluída',
      'Relatórios movidos para lixeira : ' + deleted + '\n' +
      'Critério : mais de ' + daysOld + ' dias',
      getSafeUi().ButtonSet.OK);

    Logger.log('Limpeza de relatórios : ' + deleted + ' arquivos removidos');

  } catch (e) {
    Logger.log('Erro ao limpar relatórios : ' + e.message);
  }
}


/**
 * Abre a pasta de relatórios no navegador
 */
function openReportsFolder() {
  try {
    try {
      var folderId = getReportsFolderId();
      var folder = DriveApp.getFolderById(folderId);
      var url = folder.getUrl();

      var html = '<script>window.open("' + url + '", "_blank"); google.script.host.close();</script>';
      var ui = HtmlService.createHtmlOutput(html);
      SpreadsheetApp.getUi().showModalDialog(ui, 'Abrindo pasta/* spread */');

    } catch (e) {
      getSafeUi().alert('Erro', 'Não foi possível abrir a pasta : ' + e.message, getSafeUi().ButtonSet.OK);
      return {
        chaveAcesso : chaveAcesso,
        situacao : "ERRO",
        valida : false
      };
    }
  } catch (error) {
    Logger.log("Erro em openReportsFolder: " + error.message);
    throw error;
  }
}


/**
 * Gera relatório de análise de alunos com necessidades especiais
 */
function generateSpecialStudentsReport() {
  try {
    try {
      Logger.log('Iniciando geração de relatório de alunos especiais');

      // Coletar dados
      var studentsData = listarAlunosNecessidadeEspecial({}).data;
      var reportData = prepareSpecialStudentsData(studentsData);

      // Gerar conteúdo com Gemini
      var reportContent = generateIntelligentReport(reportData, 'SPECIAL_STUDENTS_ANALYSIS');

      // Formatar e salvar
      var formattedReport = formatReportContent(reportContent, 'SPECIAL_STUDENTS_ANALYSIS');
      var finalReport = addTablesAndCharts(formattedReport, reportData);

      var report = {
        content: finalReport,
        data: reportData,
        generated_at: new Date().toISOString(),
        type: 'SPECIAL_STUDENTS_ANALYSIS'
      };

      var driveFile = saveReportToDrive(report);

      getSafeUi().alert(
        'Relatório Gerado',
        'Análise de Alunos Especiais salva no Drive:\n\n' + driveFile.name,
        getSafeUi().ButtonSet.OK
      );

    } catch (error) {
      Logger.log('Erro ao gerar relatório de alunos especiais: ' + error.message);
      getSafeUi().alert('Erro', error.message, getSafeUi().ButtonSet.OK);
    }
  } catch (error) {
    Logger.log("Erro em generateSpecialStudentsReport: " + error.message);
    throw error;
  }
}

/**
 * Prepara dados para o relatório de alunos especiais
 */
function prepareSpecialStudentsData(students) {
  try {
    var stats = {
      total: students.length,
      byPathology: {},
      bySchool: {},
      expiredLaudos: 0
    };

    students.forEach(function(s) {
      // Patologia
      var pat = s.patologiaPrincipal || 'Não informada';
      stats.byPathology[pat] = (stats.byPathology[pat] || 0) + 1;

      // Escola
      var school = s.unidadeEscolar || 'Não informada';
      stats.bySchool[school] = (stats.bySchool[school] || 0) + 1;

      // Laudo vencido
      if (s.status === 'LAUDO_VENCIDO') {
        stats.expiredLaudos++
      }
    });

    return {
      summary: {
        total_students: stats.total,
        pathologies_count: Object.keys(stats.byPathology).length,
        schools_affected: Object.keys(stats.bySchool).length,
        expired_laudos: stats.expiredLaudos
      },
      tables: {
        pathology_distribution: createDistributionTable(stats.byPathology, 'Patologia'),
        school_distribution: createDistributionTable(stats.bySchool, 'Escola')
      },
      raw_data: students.map(function(s) {
        return {
          patologia: s.patologiaPrincipal,
          escola: s.unidadeEscolar,
          status: s.status
        };
      })
    };
  } catch (error) {
    Logger.log("Erro em prepareSpecialStudentsData: " + error.message);
    throw error;
  }
}

/**
 * Gera relatório de sugestão de cardápios
 */
function generateMenuCreationReport() {
  try {
    try {
      Logger.log('Iniciando geração de sugestão de cardápios');

      // Coletar dados (Alunos e Patologias)
      var studentsData = listarAlunosNecessidadeEspecial({}).data;
    
      // Agrupar patologias ativas
      var activePathologies = {};
      studentsData.forEach(function(s) {
        if (s.status === 'ATIVO') {
          activePathologies[s.patologiaPrincipal] = true;
        }
      });

      var reportData = {
        active_pathologies: Object.keys(activePathologies),
        period: 'Próxima Semana',
        requirements: 'Considerar sazonalidade e disponibilidade de estoque.'
      };

      // Gerar conteúdo com Gemini
      var reportContent = generateIntelligentReport(reportData, 'MENU_CREATION_SUGGESTIONS');

      // Formatar e salvar
      var formattedReport = formatReportContent(reportContent, 'MENU_CREATION_SUGGESTIONS');
    
      var report = {
        content: formattedReport,
        data: reportData,
        generated_at: new Date().toISOString(),
        type: 'MENU_CREATION_SUGGESTIONS'
      };

      var driveFile = saveReportToDrive(report);

      getSafeUi().alert(
        'Relatório Gerado',
        'Sugestão de Cardápios salva no Drive:\n\n' + driveFile.name,
        getSafeUi().ButtonSet.OK
      );

    } catch (error) {
      Logger.log('Erro ao gerar sugestão de cardápios: ' + error.message);
      getSafeUi().alert('Erro', error.message, getSafeUi().ButtonSet.OK);
    }
  } catch (error) {
    Logger.log("Erro em generateMenuCreationReport: " + error.message);
    throw error;
  }
}

/**
 * Cria tabela de distribuição genérica
 */
function createDistributionTable(data, label) {
  try {
    var table = {
      headers: [label, 'Quantidade', '%'],
      rows: []
    };

    var total = Object.values(data).reduce(function(a, b) { return a + b; }, 0);

    for (var key in data) {
      var count = data[key];
      var pct = ((count / total) * 100).toFixed(1) + '%';
      table.rows.push([key, count, pct]);
    }
  
    // Ordenar por quantidade decrescente
    table.rows.sort(function(a, b) { return b[1] - a[1]; });

    return table;
  } catch (error) {
    Logger.log("Erro em createDistributionTable: " + error.message);
    throw error;
  }
}

/**
 * Gera relatório inteligente usando Gemini
 * @param {Object} data - Dados para análise
 * @param {string} reportType - Tipo do relatório
 */
function generateIntelligentReport(data, reportType) {
  try {
    try {
      if (!isGeminiConfigured()) {
        return "Erro: API do Gemini não configurada. Por favor, configure a chave API.";
      }

      var prompt = "";

      switch (reportType) {
        case 'SPECIAL_STUDENTS_ANALYSIS':
          prompt = 
            "Atue como um nutricionista especialista em alimentação escolar e saúde pública.\n" +
            "Analise os seguintes dados sobre alunos com necessidades alimentares especiais:\n" +
            JSON.stringify(data.summary) + "\n" +
            "Distribuição por Patologia: " + JSON.stringify(data.tables.pathology_distribution) + "\n\n" +
            "Gere um relatório técnico contendo:\n" +
            "1. Análise do cenário atual e riscos identificados.\n" +
            "2. Recomendações para gestão de estoque de alimentos especiais.\n" +
            "3. Pontos de atenção para a equipe de nutrição e merendeiras.\n" +
            "4. Sugestões de capacitação baseadas nas patologias mais frequentes.\n";
          break;

        case 'MENU_CREATION_SUGGESTIONS':
          prompt = 
            "Atue como um chef e nutricionista escolar.\n" +
            "Crie uma sugestão de cardápio semanal adaptado para as seguintes patologias presentes na rede:\n" +
            JSON.stringify(data.active_pathologies) + "\n\n" +
            "Considere:\n" +
            "- Substituições seguras e nutritivas.\n" +
            "- Evitar contaminação cruzada.\n" +
            "- Aproveitamento integral dos alimentos.\n" +
            "Gere o cardápio em formato de lista estruturada (Segunda a Sexta), indicando as adaptações para cada patologia.";
          break;

        case 'SYSTEM_OVERVIEW':
          prompt = 
            "Analise os seguintes dados do sistema de gestão de alimentação escolar:\n" +
            JSON.stringify(data.summary) + "\n\n" +
            "Gere um resumo executivo destacando:\n" +
            "1. Volume de dados e atividade recente.\n" +
            "2. Áreas que podem precisar de atenção (baseado em recusas ou glosas, se houver).\n" +
            "3. Saúde geral do sistema.";
          break;
      
        case 'EMAIL_ANALYSIS':
           prompt = 
            "Analise o seguinte resumo de emails recebidos:\n" +
            JSON.stringify(data.summary) + "\n\n" +
            "Identifique padrões, problemas recorrentes e sugira melhorias no processo de comunicação.";
          break;

        default:
          prompt = "Analise os seguintes dados: " + JSON.stringify(data);
      }

      var response = sendMessageToGemini(prompt);

      if (response.success) {
        return response.message;
      } else {
        throw new Error("Falha na geração com Gemini: " + response.error);
      }
    } catch (error) {
      Logger.log("Erro em generateIntelligentReport: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em generateIntelligentReport: " + error.message);
    throw error;
  }
}
