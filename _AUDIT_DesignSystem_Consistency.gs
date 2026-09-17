/**
 * ============================================================================
 * FERRAMENTA DE AUDITORIA - CONSISTÊNCIA DO DESIGN SYSTEM
 * ============================================================================
 * 
 * Esta ferramenta analisa arquivos HTML do projeto para verificar:
 * 1. Inclusão correta do DesignSystem
 * 2. Uso de cores hardcoded vs variáveis CSS
 * 3. Fontes duplicadas ou hardcoded
 * 4. Estilos redundantes
 * 5. Variáveis CSS não definidas
 * 
 * @author Kiro - Ferramenta de Auditoria
 * @version 1.0.0
 */

// ============================================================================
// CONFIGURAÇÃO - TOKENS DO DESIGN SYSTEM
// ============================================================================

const DS_TOKENS = {
  // Cores que devem usar variáveis
  colors: {
    hardcoded: [
      '#1c4587', '#4a6fa5', '#0d2847', '#2d5a9e',  // primary
      '#4CAF50', '#66BB6A', '#388E3C', '#43A047',  // secondary/success
      '#FF9800', '#FFB74D', '#F57C00',              // accent/warning
      '#10b981', '#d1fae5', '#065f46',              // success
      '#f59e0b', '#fef3c7', '#92400e',              // warning
      '#ef4444', '#fee2e2', '#991b1b',              // error
      '#3b82f6', '#dbeafe', '#1e40af',              // info
      '#1f2937', '#6b7280', '#9ca3af', '#d1d5db',  // text
      '#f9fafb', '#f3f4f6', '#e5e7eb',              // backgrounds
      '#1a73e8', '#4285f4', '#ea4335', '#34a853',  // Google colors (legacy)
      '#667eea', '#764ba2',                         // gradients
    ],
    variables: [
      '--primary', '--primary-light', '--primary-dark', '--primary-hover',
      '--secondary', '--secondary-light', '--secondary-dark',
      '--success', '--success-light', '--success-dark',
      '--warning', '--warning-light', '--warning-dark',
      '--error', '--error-light', '--error-dark',
      '--info', '--info-light', '--info-dark',
      '--text-primary', '--text-secondary', '--text-tertiary', '--text-inverse',
      '--bg-primary', '--bg-secondary', '--bg-tertiary', '--bg-surface',
    ]
  },
  
  // Fontes que devem usar variáveis
  fonts: {
    hardcoded: [
      'Arial', 'Helvetica', 'sans-serif', 'Segoe UI', 'Tahoma', 'Geneva', 'Verdana',
      'Roboto', '-apple-system', 'BlinkMacSystemFont'
    ],
    variable: '--font-family-base'
  },
  
  // Espaçamentos
  spacing: ['--space-0', '--space-1', '--space-2', '--space-3', '--space-4', 
            '--space-5', '--space-6', '--space-8', '--space-10', '--space-12'],
  
  // Border radius
  borderRadius: ['--border-radius-sm', '--border-radius-md', '--border-radius-lg', 
                 '--border-radius-xl', '--border-radius-2xl', '--border-radius-full'],
  
  // Shadows
  shadows: ['--shadow-xs', '--shadow-sm', '--shadow-md', '--shadow-lg', '--shadow-xl', '--shadow-2xl'],
  
  // Transitions
  transitions: ['--transition-fast', '--transition-base', '--transition-slow']
};

// Arquivos HTML a serem auditados
const HTML_FILES_TO_AUDIT = [
  'UI_Dashboard_Intuitivo.html',
  'UI_Components_Modern.html',
  'UI_Atesto_Principal.html',
  'UI_Checklist_Recebimento.html',
  'UI_Processo_SEI.html',
  'UI_CRUD_Page.html',
  'index.html',
  'UI_Login.html'
];

// ============================================================================
// FUNÇÕES DE AUDITORIA
// ============================================================================

/**
 * Executa auditoria completa de consistência do DesignSystem
 * @returns {Object} Relatório completo da auditoria
 */
function auditDesignSystemConsistency() {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: 0,
      filesWithIssues: 0,
      totalIssues: 0,
      criticalIssues: 0,
      warningIssues: 0,
      infoIssues: 0
    },
    files: {},
    recommendations: []
  };
  
  HTML_FILES_TO_AUDIT.forEach(filename => {
    try {
      const fileReport = auditSingleFile_(filename);
      report.files[filename] = fileReport;
      report.summary.totalFiles++;
      
      if (fileReport.issues.length > 0) {
        report.summary.filesWithIssues++;
        report.summary.totalIssues += fileReport.issues.length;
        
        fileReport.issues.forEach(issue => {
          if (issue.severity === 'critical') report.summary.criticalIssues++;
          else if (issue.severity === 'warning') report.summary.warningIssues++;
          else report.summary.infoIssues++;
        });
      }
    } catch (e) {
      report.files[filename] = {
        error: e.message,
        issues: []
      };
    }
  });
  
  // Gerar recomendações
  report.recommendations = generateRecommendations_(report);
  
  return report;
}

/**
 * Audita um único arquivo HTML
 * @private
 */
function auditSingleFile_(filename) {
  const fileReport = {
    filename: filename,
    issues: [],
    stats: {
      hasDesignSystemInclude: false,
      hardcodedColorsCount: 0,
      hardcodedFontsCount: 0,
      redundantStylesCount: 0,
      undefinedVariablesCount: 0
    }
  };
  
  // Simular leitura do arquivo (em produção, usar HtmlService ou DriveApp)
  const content = getFileContent_(filename);
  if (!content) {
    fileReport.issues.push({
      type: 'FILE_NOT_FOUND',
      severity: 'critical',
      message: `Arquivo ${filename} não encontrado`
    });
    return fileReport;
  }
  
  // 1. Verificar inclusão do DesignSystem
  checkDesignSystemInclude_(content, fileReport);
  
  // 2. Verificar cores hardcoded
  checkHardcodedColors_(content, fileReport);
  
  // 3. Verificar fontes hardcoded
  checkHardcodedFonts_(content, fileReport);
  
  // 4. Verificar estilos redundantes
  checkRedundantStyles_(content, fileReport);
  
  // 5. Verificar variáveis CSS não definidas
  checkUndefinedVariables_(content, fileReport);
  
  // 6. Verificar reset CSS duplicado
  checkDuplicateReset_(content, fileReport);
  
  return fileReport;
}

/**
 * Verifica se o DesignSystem está incluído corretamente
 * @private
 */
function checkDesignSystemInclude_(content, report) {
  const includePattern = /\<\?\!= include\(['"]DesignSystem['"]\); \?\>/;
  const hasInclude = includePattern.test(content);
  
  report.stats.hasDesignSystemInclude = hasInclude;
  
  if (!hasInclude) {
    report.issues.push({
      type: 'MISSING_DESIGN_SYSTEM',
      severity: 'critical',
      message: 'DesignSystem não está incluído. Adicione: <?!= include(\'DesignSystem\'); ?>',
      fix: 'Adicionar <?!= include(\'DesignSystem\'); ?> no <head>'
    });
  }
  
  // Verificar se está usando @import ao invés de include
  if (content.includes('@import') && content.includes('DesignSystem')) {
    report.issues.push({
      type: 'WRONG_INCLUDE_METHOD',
      severity: 'critical',
      message: 'Usando @import ao invés de include() para DesignSystem',
      fix: 'Substituir @import por <?!= include(\'DesignSystem\'); ?>'
    });
  }
}

/**
 * Verifica cores hardcoded que deveriam usar variáveis
 * @private
 */
function checkHardcodedColors_(content, report) {
  const styleContent = extractStyleContent_(content);
  
  DS_TOKENS.colors.hardcoded.forEach(color => {
    const regex = new RegExp(color.replace('#', '\\#'), 'gi');
    const matches = styleContent.match(regex);
    
    if (matches && matches.length > 0) {
      report.stats.hardcodedColorsCount += matches.length;
      report.issues.push({
        type: 'HARDCODED_COLOR',
        severity: 'warning',
        message: `Cor hardcoded encontrada: ${color} (${matches.length}x)`,
        fix: `Substituir por variável CSS apropriada (ex: var(--primary))`
      });
    }
  });
}

/**
 * Verifica fontes hardcoded
 * @private
 */
function checkHardcodedFonts_(content, report) {
  const styleContent = extractStyleContent_(content);
  
  // Verificar font-family sem usar variável
  const fontFamilyRegex = /font-family:\s*([^;]+);/gi;
  let match;
  
  while ((match = fontFamilyRegex.exec(styleContent)) !== null) {
    const fontValue = match[1];
    
    // Se não usa var(--font-family-base)
    if (!fontValue.includes('var(--font-family')) {
      // Verificar se tem fontes hardcoded conhecidas
      const hasHardcodedFont = DS_TOKENS.fonts.hardcoded.some(font => 
        fontValue.toLowerCase().includes(font.toLowerCase())
      );
      
      if (hasHardcodedFont) {
        report.stats.hardcodedFontsCount++;
        report.issues.push({
          type: 'HARDCODED_FONT',
          severity: 'info',
          message: `Fonte hardcoded: ${fontValue.substring(0, 50)}...`,
          fix: 'Usar var(--font-family-base) do DesignSystem'
        });
      }
    }
  }
}

/**
 * Verifica estilos redundantes que já existem no DesignSystem
 * @private
 */
function checkRedundantStyles_(content, report) {
  const redundantPatterns = [
    { pattern: /\.btn\s*\{[^}]*background:[^}]*\}/gi, name: 'Estilo .btn' },
    { pattern: /\.card\s*\{[^}]*background:[^}]*\}/gi, name: 'Estilo .card' },
    { pattern: /\.badge\s*\{[^}]*display:[^}]*\}/gi, name: 'Estilo .badge' },
    { pattern: /\.alert\s*\{[^}]*padding:[^}]*\}/gi, name: 'Estilo .alert' },
    { pattern: /\.form-group\s*\{[^}]*margin:[^}]*\}/gi, name: 'Estilo .form-group' },
    { pattern: /\.spinner\s*\{[^}]*animation:[^}]*\}/gi, name: 'Estilo .spinner' },
  ];
  
  const styleContent = extractStyleContent_(content);
  
  redundantPatterns.forEach(({ pattern, name }) => {
    if (pattern.test(styleContent)) {
      // Verificar se é uma extensão válida ou duplicação
      report.stats.redundantStylesCount++;
      report.issues.push({
        type: 'POTENTIALLY_REDUNDANT_STYLE',
        severity: 'info',
        message: `${name} pode estar duplicando estilos do DesignSystem`,
        fix: 'Verificar se os estilos são extensões necessárias ou duplicações'
      });
    }
  });
}

/**
 * Verifica variáveis CSS usadas mas não definidas no DesignSystem
 * @private
 */
function checkUndefinedVariables_(content, report) {
  const styleContent = extractStyleContent_(content);
  
  // Encontrar todas as variáveis CSS usadas
  const varRegex = /var\(--([a-zA-Z0-9-]+)\)/g;
  const usedVariables = new Set();
  let match;
  
  while ((match = varRegex.exec(styleContent)) !== null) {
    usedVariables.add('--' + match[1]);
  }
  
  // Lista de variáveis definidas no DesignSystem
  const definedVariables = new Set([
    ...DS_TOKENS.colors.variables,
    ...DS_TOKENS.spacing,
    ...DS_TOKENS.borderRadius,
    ...DS_TOKENS.shadows,
    ...DS_TOKENS.transitions,
    '--font-family-base', '--font-family-mono',
    '--font-xs', '--font-sm', '--font-base', '--font-lg', '--font-xl', '--font-2xl', '--font-3xl', '--font-4xl',
    '--font-weight-light', '--font-weight-normal', '--font-weight-medium', '--font-weight-semibold', '--font-weight-bold',
    '--line-height-tight', '--line-height-normal', '--line-height-relaxed',
    '--border-width-thin', '--border-width-medium', '--border-width-thick',
    '--glass-bg', '--glass-border', '--glass-blur',
    '--gradient-primary', '--gradient-secondary', '--gradient-accent', '--gradient-success', '--gradient-warning', '--gradient-error', '--gradient-info'
  ]);
  
  // Verificar variáveis não definidas
  usedVariables.forEach(variable => {
    if (!definedVariables.has(variable)) {
      // Verificar se é uma variável local definida no próprio arquivo
      const localVarRegex = new RegExp(variable + '\\s*:', 'g');
      if (!localVarRegex.test(styleContent)) {
        report.stats.undefinedVariablesCount++;
        report.issues.push({
          type: 'UNDEFINED_VARIABLE',
          severity: 'warning',
          message: `Variável CSS não definida no DesignSystem: ${variable}`,
          fix: 'Definir localmente ou usar variável equivalente do DesignSystem'
        });
      }
    }
  });
}

/**
 * Verifica reset CSS duplicado
 * @private
 */
function checkDuplicateReset_(content, report) {
  const styleContent = extractStyleContent_(content);
  
  // Padrões de reset que já existem no DesignSystem
  const resetPatterns = [
    { pattern: /\*\s*\{\s*margin:\s*0/gi, name: 'Reset de margin' },
    { pattern: /\*\s*\{\s*padding:\s*0/gi, name: 'Reset de padding' },
    { pattern: /\*\s*\{\s*box-sizing:\s*border-box/gi, name: 'Reset de box-sizing' },
  ];
  
  resetPatterns.forEach(({ pattern, name }) => {
    if (pattern.test(styleContent)) {
      // Verificar se está comentado (indicando que foi removido intencionalmente)
      const commentedPattern = new RegExp('/\\*.*' + pattern.source.replace(/\\/g, '\\\\') + '.*\\*/', 'gi');
      if (!commentedPattern.test(styleContent)) {
        report.issues.push({
          type: 'DUPLICATE_RESET',
          severity: 'info',
          message: `${name} duplicado - já existe no DesignSystem`,
          fix: 'Remover ou comentar, pois o DesignSystem já inclui este reset'
        });
      }
    }
  });
}

/**
 * Extrai conteúdo de tags <style> do HTML
 * @private
 */
function extractStyleContent_(content) {
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let styles = '';
  let match;
  
  while ((match = styleRegex.exec(content)) !== null) {
    styles += match[1] + '\n';
  }
  
  return styles;
}

/**
 * Obtém conteúdo do arquivo (simulado para teste)
 * @private
 */
function getFileContent_(filename) {
  try {
    // Em produção, usar HtmlService.createHtmlOutputFromFile ou similar
    const template = HtmlService.createTemplateFromFile(filename.replace('.html', ''));
    return template.getRawContent();
  } catch (e) {
    // Fallback: tentar ler como arquivo de texto
    try {
      const files = DriveApp.getFilesByName(filename);
      if (files.hasNext()) {
        return files.next().getBlob().getDataAsString();
      }
    } catch (e2) {
      // Ignorar erro
    }
    return null;
  }
}

/**
 * Gera recomendações baseadas no relatório
 * @private
 */
function generateRecommendations_(report) {
  const recommendations = [];
  
  if (report.summary.criticalIssues > 0) {
    recommendations.push({
      priority: 'ALTA',
      message: `${report.summary.criticalIssues} problema(s) crítico(s) encontrado(s). Corrija imediatamente.`
    });
  }
  
  if (report.summary.warningIssues > 5) {
    recommendations.push({
      priority: 'MÉDIA',
      message: 'Muitas cores hardcoded detectadas. Considere uma refatoração para usar variáveis CSS.'
    });
  }
  
  // Verificar arquivos sem DesignSystem
  const filesWithoutDS = Object.entries(report.files)
    .filter(([_, data]) => !(data.stats && data.stats.hasDesignSystemInclude))
    .map(([name]) => name);
  
  if (filesWithoutDS.length > 0) {
    recommendations.push({
      priority: 'ALTA',
      message: `Arquivos sem DesignSystem: ${filesWithoutDS.join(', ')}`
    });
  }
  
  if (report.summary.totalIssues === 0) {
    recommendations.push({
      priority: 'INFO',
      message: '✅ Todos os arquivos estão consistentes com o DesignSystem!'
    });
  }
  
  return recommendations;
}

// ============================================================================
// FUNÇÕES DE INTERFACE
// ============================================================================

/**
 * Executa auditoria e exibe resultado formatado no Logger
 */
function runDesignSystemAudit() {
  const report = auditDesignSystemConsistency();
  
  Logger.log('═══════════════════════════════════════════════════════════════');
  Logger.log('       RELATÓRIO DE AUDITORIA - DESIGN SYSTEM CONSISTENCY      ');
  Logger.log('═══════════════════════════════════════════════════════════════');
  Logger.log('');
  Logger.log('📊 RESUMO:');
  Logger.log(`   Total de arquivos: ${report.summary.totalFiles}`);
  Logger.log(`   Arquivos com problemas: ${report.summary.filesWithIssues}`);
  Logger.log(`   Total de issues: ${report.summary.totalIssues}`);
  Logger.log(`   🔴 Críticos: ${report.summary.criticalIssues}`);
  Logger.log(`   🟡 Avisos: ${report.summary.warningIssues}`);
  Logger.log(`   🔵 Info: ${report.summary.infoIssues}`);
  Logger.log('');
  
  Logger.log('📁 DETALHES POR ARQUIVO:');
  Logger.log('───────────────────────────────────────────────────────────────');
  
  Object.entries(report.files).forEach(([filename, data]) => {
    const status = data.issues.length === 0 ? '✅' : '⚠️';
    Logger.log(`\n${status} ${filename}`);
    
    if (data.stats) {
      Logger.log(`   DesignSystem incluído: ${data.stats.hasDesignSystemInclude ? 'Sim' : 'NÃO'}`);
      Logger.log(`   Cores hardcoded: ${data.stats.hardcodedColorsCount}`);
      Logger.log(`   Fontes hardcoded: ${data.stats.hardcodedFontsCount}`);
      Logger.log(`   Variáveis indefinidas: ${data.stats.undefinedVariablesCount}`);
    }
    
    if (data.issues.length > 0) {
      Logger.log('   Issues:');
      data.issues.forEach(issue => {
        const icon = issue.severity === 'critical' ? '🔴' : 
                     issue.severity === 'warning' ? '🟡' : '🔵';
        Logger.log(`   ${icon} [${issue.type}] ${issue.message}`);
      });
    }
  });
  
  Logger.log('\n');
  Logger.log('💡 RECOMENDAÇÕES:');
  Logger.log('───────────────────────────────────────────────────────────────');
  report.recommendations.forEach(rec => {
    Logger.log(`   [${rec.priority}] ${rec.message}`);
  });
  
  Logger.log('\n═══════════════════════════════════════════════════════════════');
  Logger.log(`Auditoria concluída em: ${report.timestamp}`);
  
  return report;
}

/**
 * Gera relatório em formato HTML para visualização
 */
function generateAuditReportHTML() {
  const report = auditDesignSystemConsistency();
  
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Inter', sans-serif; padding: 20px; background: #f5f5f5; }
        .container { max-width: 900px; margin: 0 auto; background: white; padding: 24px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        h1 { color: #1c4587; }
        .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 20px 0; }
        .stat { background: #f8f9fa; padding: 16px; border-radius: 8px; text-align: center; }
        .stat-value { font-size: 32px; font-weight: bold; }
        .stat-label { color: #666; font-size: 14px; }
        .critical { color: #ef4444; }
        .warning { color: #f59e0b; }
        .info { color: #3b82f6; }
        .success { color: #10b981; }
        .file-card { border: 1px solid #e5e7eb; border-radius: 8px; margin: 16px 0; overflow: hidden; }
        .file-header { background: #f8f9fa; padding: 12px 16px; font-weight: 600; display: flex; justify-content: space-between; }
        .file-body { padding: 16px; }
        .issue { padding: 8px 12px; margin: 4px 0; border-radius: 4px; font-size: 14px; }
        .issue.critical { background: #fee2e2; }
        .issue.warning { background: #fef3c7; }
        .issue.info { background: #dbeafe; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600; }
        .badge.ok { background: #d1fae5; color: #065f46; }
        .badge.issues { background: #fee2e2; color: #991b1b; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🎨 Auditoria de Consistência - DesignSystem</h1>
        <p>Gerado em: ${report.timestamp}</p>
        
        <div class="summary">
          <div class="stat">
            <div class="stat-value">${report.summary.totalFiles}</div>
            <div class="stat-label">Arquivos</div>
          </div>
          <div class="stat">
            <div class="stat-value critical">${report.summary.criticalIssues}</div>
            <div class="stat-label">Críticos</div>
          </div>
          <div class="stat">
            <div class="stat-value warning">${report.summary.warningIssues}</div>
            <div class="stat-label">Avisos</div>
          </div>
          <div class="stat">
            <div class="stat-value info">${report.summary.infoIssues}</div>
            <div class="stat-label">Info</div>
          </div>
        </div>
        
        <h2>📁 Arquivos Analisados</h2>
  `;
  
  Object.entries(report.files).forEach(([filename, data]) => {
    const badgeClass = data.issues.length === 0 ? 'ok' : 'issues';
    const badgeText = data.issues.length === 0 ? '✓ OK' : `${data.issues.length} issues`;
    
    html += `
      <div class="file-card">
        <div class="file-header">
          <span>${filename}</span>
          <span class="badge ${badgeClass}">${badgeText}</span>
        </div>
        <div class="file-body">
    `;
    
    if (data.issues.length === 0) {
      html += '<p class="success">✅ Nenhum problema encontrado</p>';
    } else {
      data.issues.forEach(issue => {
        html += `<div class="issue ${issue.severity}">[${issue.type}] ${issue.message}</div>`;
      });
    }
    
    html += '</div></div>';
  });
  
  html += `
        <h2>💡 Recomendações</h2>
        <ul>
  `;
  
  report.recommendations.forEach(rec => {
    html += `<li><strong>[${rec.priority}]</strong> ${rec.message}</li>`;
  });
  
  html += `
        </ul>
      </div>
    </body>
    </html>
  `;
  
  return HtmlService.createHtmlOutput(html)
    .setTitle('Auditoria DesignSystem')
    .setWidth(950)
    .setHeight(700);
}

/**
 * Abre o relatório de auditoria em uma sidebar
 */
function showAuditReport() {
  const html = generateAuditReportHTML();
  SpreadsheetApp.getUi().showModalDialog(html, 'Auditoria de Consistência - DesignSystem');
}

/**
 * Adiciona menu de auditoria
 */
function addAuditMenu() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🔍 Auditoria')
    .addItem('Executar Auditoria DesignSystem', 'showAuditReport')
    .addItem('Ver Log da Auditoria', 'runDesignSystemAudit')
    .addToUi();
}
