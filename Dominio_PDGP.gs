/**
 * DOMINIO_PDGP
 * Módulo de Planejamento e Gestão (PDGP)
 * @version 1.0.0
 * @created 2025-11-10
 */

'use strict';

/**
 * Cria estrutura da aba PDGP
 */
function criarEstruturaPDGP() {
  try {
    try {
      try {
        var ss = getSS();
        var pdgpSheet = ss.getSheetByName('PDGP');

        if (!pdgpSheet) {
          pdgpSheet = ss.insertSheet('PDGP');
        } else {
          pdgpSheet.clear();
        }

        // Definir cabeçalhos
        var headers = [
          'ID_Planejamento',
          'Data_Criacao',
          'Periodo_Referencia',
          'Tipo_Planejamento',
          'Unidade_Escolar',
          'Responsavel',
          'Meta_Entregas',
          'Meta_Conformidade',
          'Meta_Prazo_Medio',
          'Realizado_Entregas',
          'Realizado_Conformidade',
          'Realizado_Prazo_Medio',
          'Status_Planejamento',
          'Observacoes',
          'Data_Atualizacao'
        ];

        pdgpSheet.getRange(1, 1, 1, headers.length).setValues([headers]);

        // Formatar cabeçalho
        var headerRange = pdgpSheet.getRange(1, 1, 1, headers.length);
        headerRange.setBackground('#1c4587');
        headerRange.setFontColor('#ffffff');
        headerRange.setFontWeight('bold');
        headerRange.setHorizontalAlignment('center');

        // Ajustar larguras
        pdgpSheet.setColumnWidths(1, headers.length, 150);

        // Congelar primeira linha
        pdgpSheet.setFrozenRows(1);

        // Adicionar dados de exemplo
        var dadosExemplo = [
          [
            'PDGP-001',
            new Date(),
            'Novembro/2025',
            'Mensal',
            'Todas',
            Session.getActiveUser().getEmail(),
            100,
            95,
            5,
            0,
            0,
            0,
            'Em Andamento',
            'Planejamento inicial',
            new Date()
          ]
        ];

        pdgpSheet.getRange(2, 1, dadosExemplo.length, headers.length).setValues(dadosExemplo);

        return pdgpSheet;
      } catch (error) {
        Logger.log("Erro em criarEstruturaPDGP: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em criarEstruturaPDGP: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em criarEstruturaPDGP: " + error.message);
    throw error;
  }
}

/**
 * Gera dashboard PDGP com métricas e indicadores
 */
function gerarDashboardPDGP() {
  try {
    try {
      var ss = getSS();
      var pdgpSheet = ss.getSheetByName('PDGP');

      if (!pdgpSheet) {
        return {
          html : '<h2>Aba PDGP não encontrada</h2><p>Por favor, crie a estrutura primeiro.</p>'
        };
      }

      // Coletar dados
      var data = pdgpSheet.getDataRange().getValues();
      var headers = data[0];
      var rows = data.slice(1);

      // Calcular métricas
      var metricas = calcularMetricasPDGP(rows);

      // Gerar HTML do dashboard
      var html = `
    <!DOCTYPE html>
    <html>
    <head>
      <base target="_top">
      <style>
        body {
          font-family : 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin : 0;
          padding : 20px;
          background : linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
          max-width : 1200px;
          margin : 0 auto;
          background : white;
          border-radius : 15px;
          padding : 30px;
          box-shadow : 0 10px 40px rgba(0,0,0,0.2);
        }
        h1 {
          color : #1c4587;
          text-align : center;
          margin-bottom : 30px;
          font-size : 2em;
        }
        .metrics-grid {
          display : grid;
          grid-template-columns : repeat(auto-fit, minmax(250px, 1fr));
          gap : 20px;
          margin-bottom : 30px;
        }
        .metric-card {
          background : linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color : white;
          padding : 25px;
          border-radius : 10px;
          box-shadow : 0 4px 15px rgba(0,0,0,0.1);
          transition : transform 0.3s;
        }
        .metric-card : hover {
          transform : translateY(-5px);
        }
        .metric-value {
          font-size : 2.5em;
          font-weight : bold;
          margin : 10px 0;
        }
        .metric-label {
          font-size : 0.9em;
          opacity : 0.9;
        }
        .progress-bar {
          background : rgba(255,255,255,0.3);
          height : 8px;
          border-radius : 4px;
          margin-top : 15px;
          overflow : hidden;
        }
        .progress-fill {
          background : white;
          height : 100%;
          border-radius : 4px;
          transition : width 0.5s;
        }
        .chart-container {
          background : #f8f9fa;
          padding : 20px;
          border-radius : 10px;
          margin-top : 20px;
        }
        .status-badge {
          display : inline-block;
          padding : 5px 15px;
          border-radius : 20px;
          font-size : 0.85em;
          font-weight : bold;
          margin-top : 10px;
        }
        .status-success { background : #28a745; color : white; }
        .status-warning { background : #ffc107; color : #333; }
        .status-danger { background : #dc3545; color : white; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>📊 Dashboard PDGP - Planejamento e Gestão</h1>

        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">Total de Planejamentos</div>
            <div class="metric-value">${metricas.metricas.totalPlanejamentos}</div>
            <div class="progress-bar">
              <div class="progress-fill" style="width : 100%"></div>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-label">Meta de Entregas</div>
            <div class="metric-value">${metricas.metricas.metaEntregas}</div>
            <div class="progress-bar">
              <div class="progress-fill" style="width : ${metricas.metricas.percEntregas}%"></div>
            </div>
            <span class="status-badge ${metricas.metricas.statusEntregas}">${metricas.metricas.percEntregas}%</span>
          </div>

          <div class="metric-card">
            <div class="metric-label">Conformidade Média</div>
            <div class="metric-value">${metricas.metricas.conformidadeMedia}%</div>
            <div class="progress-bar">
              <div class="progress-fill" style="width : ${metricas.metricas.conformidadeMedia}%"></div>
            </div>
            <span class="status-badge ${metricas.metricas.statusConformidade}">Meta : ${metricas.metricas.metaConformidade}%</span>
          </div>

          <div class="metric-card">
            <div class="metric-label">Prazo Médio (dias)</div>
            <div class="metric-value">${metricas.metricas.prazoMedio}</div>
            <div class="progress-bar">
              <div class="progress-fill" style="width : ' + 100 - (metricas.prazoMedio * 10) + '%"></div>
            </div>
            <span class="status-badge ${metricas.metricas.statusPrazo}">Meta : ${metricas.metricas.metaPrazo} dias</span>
          </div>
        </div>

        <div class="chart-container">
          <h3>📈 Evolução dos Indicadores</h3>
          <p><strong>Planejamentos Ativos : </strong> ${metricas.metricas.planejamentosAtivos}</p>
          <p><strong>Planejamentos Concluídos : </strong> ${metricas.metricas.planejamentosConcluidos}</p>
          <p><strong>Taxa de Sucesso : </strong> ${metricas.metricas.taxaSucesso}%</p>
        </div>

        <div style="text-align : center; margin-top : 30px; color : #666;">
          <p>Última atualização : ${new Date().toLocaleString("pt-BR")}</p>
        </div>
      </div>
    </body>
    </html>
      `;

      return { html : html };
    } catch (error) {
      Logger.log("Erro em gerarDashboardPDGP: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em gerarDashboardPDGP: " + error.message);
    throw error;
  }
}

/**
 * Calcula métricas do PDGP
 */
function calcularMetricasPDGP(rows) {
  try {
    if (!rows || rows.length == 0) {
      return {
        totalPlanejamentos : 0,
        metaEntregas : 0,
        percEntregas : 0,
        conformidadeMedia : 0,
        metaConformidade : 0,
        prazoMedio : 0,
        metaPrazo : 0,
        planejamentosAtivos : 0,
        planejamentosConcluidos : 0,
        taxaSucesso : 0,
        statusEntregas : 'status-warning',
        statusConformidade : 'status-warning',
        statusPrazo : 'status-warning'
      };
    }

    var totalMetaEntregas = 0;
    var totalRealizadoEntregas = 0;
    var somaConformidade = 0;
    var somaMetaConformidade = 0;
    var somaPrazo = 0;
    var somaMetaPrazo = 0;
    var ativos = 0;
    var concluidos = 0;

    rows.forEach(function(row) {
      totalMetaEntregas += Number(row[6]) || 0;
      totalRealizadoEntregas += Number(row[9]) || 0;
      somaConformidade += Number(row[10]) || 0;
      somaMetaConformidade += Number(row[7]) || 0;
      somaPrazo += Number(row[11]) || 0;
      somaMetaPrazo += Number(row[8]) || 0;

      if (row[12] == 'Em Andamento') ativos++;
      if (row[12] == 'Concluído') concluidos++;
    });

    var conformidadeMedia;
    if (rows.length > 0) {
      conformidadeMedia = Math.round(somaConformidade / rows.length);
    } else {
      conformidadeMedia = 0;
    }
    var metaConformidade;
    if (rows.length > 0) {
      metaConformidade = Math.round(somaMetaConformidade / rows.length);
    } else {
      metaConformidade = 0;
    }
    var prazoMedio;
    if (rows.length > 0) {
      prazoMedio = Math.round(somaPrazo / rows.length);
    } else {
      prazoMedio = 0;
    }
    var metaPrazo;
    if (rows.length > 0) {
      metaPrazo = Math.round(somaMetaPrazo / rows.length);
    } else {
      metaPrazo = 0;
    }
    var percEntregas;
    if (totalMetaEntregas > 0) {
      percEntregas = Math.round((totalRealizadoEntregas / totalMetaEntregas) * 100);
    } else {
      percEntregas = 0;
    }
    var taxaSucesso;
    if (rows.length > 0) {
      taxaSucesso = Math.round((concluidos / rows.length) * 100);
    } else {
      taxaSucesso = 0;
    }

    return {
      totalPlanejamentos : rows.length,
      metaEntregas : totalMetaEntregas,
      percEntregas : percEntregas,
      conformidadeMedia : conformidadeMedia,
      metaConformidade : metaConformidade,
      prazoMedio : prazoMedio,
      metaPrazo : metaPrazo,
      planejamentosAtivos : ativos,
      planejamentosConcluidos : concluidos,
      taxaSucesso : taxaSucesso,
      statusEntregas : percEntregas >= 90 ? 'status-success' : percEntregas >= 70 ? 'status-warning' : 'status-danger',
      statusConformidade : conformidadeMedia >= 90 ? 'status-success' : conformidadeMedia >= 70 ? 'status-warning' : 'status-danger',
      statusPrazo : prazoMedio <= metaPrazo ? 'status-success' : prazoMedio <= metaPrazo * 1.2 ? 'status-warning' : 'status-danger'
    };
  } catch (error) {
    Logger.log("Erro em calcularMetricasPDGP: " + error.message);
    throw error;
  }
}

/**
 * Adiciona novo planejamento PDGP
 */
function adicionarPlanejamentoPDGP(dados) {
  try {
    try {
      try {
        try {
          var ss = getSS();
          var pdgpSheet = ss.getSheetByName('PDGP');

          if (!pdgpSheet) {
            pdgpSheet = criarEstruturaPDGP();
          }

          // Gerar ID único
          var lastRow = pdgpSheet.getLastRow();
          var novoId = 'PDGP-' + String(lastRow).padStart(3, '0');

          var novaLinha = [
            novoId,
            new Date(),
            dados.periodo || '',
            dados.tipo || 'Mensal',
            dados.unidade || 'Todas',
            Session.getActiveUser().getEmail(),
            dados.metaEntregas || 0,
            dados.metaConformidade || 95,
            dados.metaPrazo || 5,
            0,
            0,
            0,
            'Em Andamento',
            dados.observacoes || '',
            new Date()
          ];

          pdgpSheet.appendRow(novaLinha);

          return {
            success : true,
            id : novoId,
            message : 'Planejamento criado com sucesso'
          };

        } catch (error) {
          Logger.log('Erro adicionarPlanejamentoPDGP : ' + error.message);
          return {
            success : false,
            error : error.message
          };
        }
      } catch (error) {
        Logger.log("Erro em adicionarPlanejamentoPDGP: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em adicionarPlanejamentoPDGP: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em adicionarPlanejamentoPDGP: " + error.message);
    throw error;
  }
}

/**
 * Atualiza realizado do planejamento PDGP
 */
function atualizarRealizadoPDGP(idPlanejamento, realizados) {
  try {
    try {
      try {
        try {
          var ss = getSS();
          var pdgpSheet = ss.getSheetByName('PDGP');

          if (!pdgpSheet) {
            throw new Error('Aba PDGP não encontrada');
          }

          var data = pdgpSheet.getDataRange().getValues();

          for (var i = 1; i < data.length; i++) {
            if (data[i][0] == idPlanejamento) {
              // Atualizar realizados
              if (realizados.entregas != undefined) {
                pdgpSheet.getRange(i + 1, 10).setValue(realizados.entregas);
              }
              if (realizados.conformidade != undefined) {
                pdgpSheet.getRange(i + 1, 11).setValue(realizados.conformidade);
              }
              if (realizados.prazo != undefined) {
                pdgpSheet.getRange(i + 1, 12).setValue(realizados.prazo);
              }

              // Atualizar data de atualização
              pdgpSheet.getRange(i + 1, 15).setValue(new Date());

              return {
                success : true,
                message : 'Planejamento atualizado com sucesso'
              };
            }
          }

          return {
            success : false,
            error : 'Planejamento não encontrado'
          };

        } catch (error) {
          Logger.log('Erro atualizarRealizadoPDGP : ' + error.message);
          return {
            success : false,
            error : error.message
          };
        }
      } catch (error) {
        Logger.log("Erro em atualizarRealizadoPDGP: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em atualizarRealizadoPDGP: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em atualizarRealizadoPDGP: " + error.message);
    throw error;
  }
}
