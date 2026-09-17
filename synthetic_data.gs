/**
 * Dados sintéticos — Preferencial - SGAE
 * Gerado em 2026-06-21 01:10:44 por generate_synthetic_data_all_projects.py
 *
 * Execute populateSyntheticData() PELO EDITOR do Apps Script para popular
 * as abas de domínio com ~30 registros cada (valida os gráficos do notebook).
 * Idempotente: limpa as linhas de dados antes de reinserir.
 *
 * NÃO define onOpen() — para não colidir com o menu real do projeto.
 */

function populateSyntheticData() {
  try {
    try {
      try {
        var ss = SpreadsheetApp.getActiveSpreadsheet();
        var results = [];

        // Alunos_Nae
        try {
          var sheet_ALUNOS_NAE = ss.getSheetByName('Alunos_Nae') || ss.insertSheet('Alunos_Nae');
          if (sheet_ALUNOS_NAE.getLastRow() > 1) {
            sheet_ALUNOS_NAE.deleteRows(2, sheet_ALUNOS_NAE.getLastRow() - 1);
          }
          var h_sheet_ALUNOS_NAE = ["ID", "Name", "Email", "Phone", "Class", "GuardianName", "GuardianPhone", "Status", "CreatedAt", "UpdatedAt"];
          sheet_ALUNOS_NAE.getRange(1, 1, 1, h_sheet_ALUNOS_NAE.length).setValues([h_sheet_ALUNOS_NAE]);
          var d_sheet_ALUNOS_NAE = [
            ["ALU-0001", "Diego Souza", "usuario1@escola.edu.br", "(61) 93788-2442", "2B", "Felipe Costa", "(61) 99807-1080", "ativo", "2026-05-18 01:10:44", "2026-05-24 01:10:44"],
            ["ALU-0002", "Ana Silva", "usuario2@escola.edu.br", "(61) 92815-1786", "3C", "Bruno Santos", "(61) 95320-6395", "inativo", "2026-05-17 01:10:44", "2026-05-30 01:10:44"],
            ["ALU-0003", "Carla Oliveira", "usuario3@escola.edu.br", "(61) 93257-8548", "1A", "Carla Oliveira", "(61) 96231-3424", "inativo", "2026-03-31 01:10:44", "2026-06-07 01:10:44"],
            ["ALU-0004", "Bruno Santos", "usuario4@escola.edu.br", "(61) 99548-9644", "2B", "Henrique Alves", "(61) 99029-5596", "ativo", "2026-04-20 01:10:44", "2026-06-14 01:10:44"],
            ["ALU-0005", "Bruno Santos", "usuario5@escola.edu.br", "(61) 95322-5853", "1A", "Felipe Costa", "(61) 94971-4373", "ativo", "2026-06-11 01:10:44", "2026-06-06 01:10:44"],
            ["ALU-0006", "Ana Silva", "usuario6@escola.edu.br", "(61) 94481-1215", "2B", "Henrique Alves", "(61) 97308-4078", "inativo", "2026-06-07 01:10:44", "2026-06-11 01:10:44"],
            ["ALU-0007", "Diego Souza", "usuario7@escola.edu.br", "(61) 99644-9420", "3C", "Eduarda Lima", "(61) 98438-3523", "ativo", "2026-06-04 01:10:44", "2026-06-14 01:10:44"],
            ["ALU-0008", "Felipe Costa", "usuario8@escola.edu.br", "(61) 97317-8412", "5B", "Diego Souza", "(61) 97556-4079", "ativo", "2026-05-16 01:10:44", "2026-06-08 01:10:44"],
            ["ALU-0009", "Carla Oliveira", "usuario9@escola.edu.br", "(61) 96032-2672", "2B", "Henrique Alves", "(61) 92755-2805", "ativo", "2026-06-18 01:10:44", "2026-05-24 01:10:44"],
            ["ALU-0010", "Henrique Alves", "usuario10@escola.edu.br", "(61) 94064-5370", "1A", "Henrique Alves", "(61) 99698-8416", "ativo", "2026-05-18 01:10:44", "2026-06-18 01:10:44"],
            ["ALU-0011", "Bruno Santos", "usuario11@escola.edu.br", "(61) 96806-8069", "2B", "Carla Oliveira", "(61) 97503-9227", "inativo", "2026-04-16 01:10:44", "2026-06-11 01:10:44"],
            ["ALU-0012", "Ana Silva", "usuario12@escola.edu.br", "(61) 98230-5466", "3C", "Bruno Santos", "(61) 91805-7267", "inativo", "2026-05-27 01:10:44", "2026-06-12 01:10:44"],
            ["ALU-0013", "Diego Souza", "usuario13@escola.edu.br", "(61) 97597-3894", "5B", "Eduarda Lima", "(61) 99676-9087", "inativo", "2026-06-07 01:10:44", "2026-05-31 01:10:44"],
            ["ALU-0014", "Ana Silva", "usuario14@escola.edu.br", "(61) 95078-2819", "2B", "Bruno Santos", "(61) 91870-1584", "ativo", "2026-05-21 01:10:44", "2026-06-19 01:10:44"],
            ["ALU-0015", "Bruno Santos", "usuario15@escola.edu.br", "(61) 95513-4710", "5B", "Gabriela Rocha", "(61) 97421-7437", "ativo", "2026-05-23 01:10:44", "2026-05-29 01:10:44"],
            ["ALU-0016", "Eduarda Lima", "usuario16@escola.edu.br", "(61) 99112-4370", "2B", "Diego Souza", "(61) 96695-5718", "ativo", "2026-06-20 01:10:44", "2026-06-18 01:10:44"],
            ["ALU-0017", "Carla Oliveira", "usuario17@escola.edu.br", "(61) 99245-8811", "3C", "Diego Souza", "(61) 93789-6162", "ativo", "2026-05-30 01:10:44", "2026-06-16 01:10:44"],
            ["ALU-0018", "Felipe Costa", "usuario18@escola.edu.br", "(61) 98458-3323", "1A", "Henrique Alves", "(61) 98011-6473", "ativo", "2026-05-29 01:10:44", "2026-06-13 01:10:44"],
            ["ALU-0019", "Bruno Santos", "usuario19@escola.edu.br", "(61) 93797-1159", "5B", "Felipe Costa", "(61) 98763-1016", "inativo", "2026-05-20 01:10:44", "2026-06-06 01:10:44"],
            ["ALU-0020", "Bruno Santos", "usuario20@escola.edu.br", "(61) 91740-1284", "5B", "Eduarda Lima", "(61) 94740-9606", "ativo", "2026-06-02 01:10:44", "2026-05-28 01:10:44"],
            ["ALU-0021", "Bruno Santos", "usuario21@escola.edu.br", "(61) 92638-5990", "3C", "Henrique Alves", "(61) 99039-6747", "ativo", "2026-03-28 01:10:44", "2026-06-06 01:10:44"],
            ["ALU-0022", "Eduarda Lima", "usuario22@escola.edu.br", "(61) 96968-8516", "1A", "Felipe Costa", "(61) 95933-6467", "inativo", "2026-06-06 01:10:44", "2026-06-13 01:10:44"],
            ["ALU-0023", "Ana Silva", "usuario23@escola.edu.br", "(61) 93423-7722", "2B", "Carla Oliveira", "(61) 96852-9156", "ativo", "2026-05-20 01:10:44", "2026-06-03 01:10:44"],
            ["ALU-0024", "Gabriela Rocha", "usuario24@escola.edu.br", "(61) 96888-4380", "1A", "Diego Souza", "(61) 97189-2768", "ativo", "2026-04-01 01:10:44", "2026-05-31 01:10:44"],
            ["ALU-0025", "Henrique Alves", "usuario25@escola.edu.br", "(61) 99632-3866", "3C", "Felipe Costa", "(61) 96426-7406", "inativo", "2026-05-16 01:10:44", "2026-06-12 01:10:44"],
            ["ALU-0026", "Diego Souza", "usuario26@escola.edu.br", "(61) 91673-9520", "3C", "Bruno Santos", "(61) 98101-8455", "ativo", "2026-05-15 01:10:44", "2026-06-18 01:10:44"],
            ["ALU-0027", "Ana Silva", "usuario27@escola.edu.br", "(61) 99174-3410", "4A", "Carla Oliveira", "(61) 99571-5747", "ativo", "2026-05-13 01:10:44", "2026-06-06 01:10:44"],
            ["ALU-0028", "Eduarda Lima", "usuario28@escola.edu.br", "(61) 92058-5828", "1A", "Henrique Alves", "(61) 91670-4560", "ativo", "2026-04-06 01:10:44", "2026-06-18 01:10:44"],
            ["ALU-0029", "Ana Silva", "usuario29@escola.edu.br", "(61) 99001-6010", "1A", "Gabriela Rocha", "(61) 96771-1010", "ativo", "2026-05-19 01:10:44", "2026-06-17 01:10:44"],
            ["ALU-0030", "Felipe Costa", "usuario30@escola.edu.br", "(61) 95641-9224", "5B", "Carla Oliveira", "(61) 92409-5434", "ativo", "2026-05-26 01:10:44", "2026-06-08 01:10:44"]
          ];
          sheet_ALUNOS_NAE.getRange(2, 1, d_sheet_ALUNOS_NAE.length, h_sheet_ALUNOS_NAE.length).setValues(d_sheet_ALUNOS_NAE);
          results.push('OK Alunos_Nae: ' + d_sheet_ALUNOS_NAE.length + ' registros');
        } catch (e) {
          results.push('ERRO Alunos_Nae: ' + e.message);
        }

        // Controle_Conferencia
        try {
          var sheet_CONTROLE_CONFERENCIA = ss.getSheetByName('Controle_Conferencia') || ss.insertSheet('Controle_Conferencia');
          if (sheet_CONTROLE_CONFERENCIA.getLastRow() > 1) {
            sheet_CONTROLE_CONFERENCIA.deleteRows(2, sheet_CONTROLE_CONFERENCIA.getLastRow() - 1);
          }
          var h_sheet_CONTROLE_CONFERENCIA = ["ID", "Name", "Email", "Username", "PasswordHash", "Role", "Status", "LastLoginAt", "CreatedAt", "UpdatedAt"];
          sheet_CONTROLE_CONFERENCIA.getRange(1, 1, 1, h_sheet_CONTROLE_CONFERENCIA.length).setValues([h_sheet_CONTROLE_CONFERENCIA]);
          var d_sheet_CONTROLE_CONFERENCIA = [
            ["CON-0001", "Bruno Santos", "usuario1@escola.edu.br", "USR-397", "B", "aluno", "inativo", "C", "2026-05-20 01:10:44", "2026-05-27 01:10:44"],
            ["CON-0002", "Gabriela Rocha", "usuario2@escola.edu.br", "USR-532", "D", "aluno", "ativo", "C", "2026-04-05 01:10:44", "2026-06-12 01:10:44"],
            ["CON-0003", "Carla Oliveira", "usuario3@escola.edu.br", "USR-677", "D", "coordenador", "ativo", "B", "2026-03-25 01:10:44", "2026-05-28 01:10:44"],
            ["CON-0004", "Diego Souza", "usuario4@escola.edu.br", "USR-356", "B", "professor", "ativo", "C", "2026-05-12 01:10:44", "2026-06-19 01:10:44"],
            ["CON-0005", "Eduarda Lima", "usuario5@escola.edu.br", "USR-680", "D", "coordenador", "ativo", "D", "2026-04-26 01:10:44", "2026-06-18 01:10:44"],
            ["CON-0006", "Carla Oliveira", "usuario6@escola.edu.br", "USR-639", "D", "coordenador", "ativo", "C", "2026-04-22 01:10:44", "2026-06-10 01:10:44"],
            ["CON-0007", "Gabriela Rocha", "usuario7@escola.edu.br", "USR-577", "D", "professor", "inativo", "A", "2026-04-10 01:10:44", "2026-06-21 01:10:44"],
            ["CON-0008", "Gabriela Rocha", "usuario8@escola.edu.br", "USR-190", "B", "coordenador", "ativo", "B", "2026-04-07 01:10:44", "2026-06-05 01:10:44"],
            ["CON-0009", "Felipe Costa", "usuario9@escola.edu.br", "USR-230", "C", "aluno", "inativo", "B", "2026-04-30 01:10:44", "2026-05-31 01:10:44"],
            ["CON-0010", "Ana Silva", "usuario10@escola.edu.br", "USR-573", "D", "aluno", "ativo", "A", "2026-05-17 01:10:44", "2026-05-26 01:10:44"],
            ["CON-0011", "Bruno Santos", "usuario11@escola.edu.br", "USR-441", "A", "professor", "inativo", "C", "2026-06-13 01:10:44", "2026-06-18 01:10:44"],
            ["CON-0012", "Ana Silva", "usuario12@escola.edu.br", "USR-818", "B", "coordenador", "ativo", "D", "2026-06-03 01:10:44", "2026-06-14 01:10:44"],
            ["CON-0013", "Carla Oliveira", "usuario13@escola.edu.br", "USR-408", "C", "coordenador", "ativo", "D", "2026-04-02 01:10:44", "2026-05-30 01:10:44"],
            ["CON-0014", "Diego Souza", "usuario14@escola.edu.br", "USR-217", "A", "aluno", "ativo", "A", "2026-04-15 01:10:44", "2026-06-18 01:10:44"],
            ["CON-0015", "Diego Souza", "usuario15@escola.edu.br", "USR-309", "A", "professor", "ativo", "D", "2026-05-01 01:10:44", "2026-06-20 01:10:44"],
            ["CON-0016", "Bruno Santos", "usuario16@escola.edu.br", "USR-407", "D", "professor", "ativo", "B", "2026-04-12 01:10:44", "2026-06-13 01:10:44"],
            ["CON-0017", "Henrique Alves", "usuario17@escola.edu.br", "USR-979", "A", "professor", "ativo", "A", "2026-05-28 01:10:44", "2026-06-17 01:10:44"],
            ["CON-0018", "Diego Souza", "usuario18@escola.edu.br", "USR-274", "B", "professor", "inativo", "C", "2026-05-14 01:10:44", "2026-05-31 01:10:44"],
            ["CON-0019", "Bruno Santos", "usuario19@escola.edu.br", "USR-702", "D", "professor", "ativo", "D", "2026-05-02 01:10:44", "2026-05-30 01:10:44"],
            ["CON-0020", "Bruno Santos", "usuario20@escola.edu.br", "USR-575", "D", "professor", "ativo", "A", "2026-05-15 01:10:44", "2026-06-07 01:10:44"],
            ["CON-0021", "Bruno Santos", "usuario21@escola.edu.br", "USR-677", "D", "aluno", "ativo", "A", "2026-03-30 01:10:44", "2026-06-01 01:10:44"],
            ["CON-0022", "Henrique Alves", "usuario22@escola.edu.br", "USR-143", "C", "aluno", "inativo", "D", "2026-05-16 01:10:44", "2026-06-21 01:10:44"],
            ["CON-0023", "Carla Oliveira", "usuario23@escola.edu.br", "USR-466", "B", "professor", "inativo", "A", "2026-05-29 01:10:44", "2026-06-01 01:10:44"],
            ["CON-0024", "Carla Oliveira", "usuario24@escola.edu.br", "USR-460", "C", "professor", "ativo", "C", "2026-03-28 01:10:44", "2026-06-12 01:10:44"],
            ["CON-0025", "Gabriela Rocha", "usuario25@escola.edu.br", "USR-169", "D", "professor", "inativo", "B", "2026-04-08 01:10:44", "2026-05-30 01:10:44"],
            ["CON-0026", "Eduarda Lima", "usuario26@escola.edu.br", "USR-232", "C", "coordenador", "ativo", "D", "2026-06-12 01:10:44", "2026-06-20 01:10:44"],
            ["CON-0027", "Ana Silva", "usuario27@escola.edu.br", "USR-972", "B", "aluno", "ativo", "A", "2026-04-18 01:10:44", "2026-05-23 01:10:44"],
            ["CON-0028", "Henrique Alves", "usuario28@escola.edu.br", "USR-431", "B", "coordenador", "ativo", "A", "2026-05-29 01:10:44", "2026-05-29 01:10:44"],
            ["CON-0029", "Gabriela Rocha", "usuario29@escola.edu.br", "USR-873", "D", "aluno", "ativo", "C", "2026-06-06 01:10:44", "2026-06-20 01:10:44"],
            ["CON-0030", "Bruno Santos", "usuario30@escola.edu.br", "USR-552", "C", "coordenador", "ativo", "B", "2026-05-10 01:10:44", "2026-06-18 01:10:44"]
          ];
          sheet_CONTROLE_CONFERENCIA.getRange(2, 1, d_sheet_CONTROLE_CONFERENCIA.length, h_sheet_CONTROLE_CONFERENCIA.length).setValues(d_sheet_CONTROLE_CONFERENCIA);
          results.push('OK Controle_Conferencia: ' + d_sheet_CONTROLE_CONFERENCIA.length + ' registros');
        } catch (e) {
          results.push('ERRO Controle_Conferencia: ' + e.message);
        }

        // Relatorio_Glosas
        try {
          var sheet_RELATORIO_GLOSAS = ss.getSheetByName('Relatorio_Glosas') || ss.insertSheet('Relatorio_Glosas');
          if (sheet_RELATORIO_GLOSAS.getLastRow() > 1) {
            sheet_RELATORIO_GLOSAS.deleteRows(2, sheet_RELATORIO_GLOSAS.getLastRow() - 1);
          }
          var h_sheet_RELATORIO_GLOSAS = ["ID", "Title", "Type", "Period", "Status", "GeneratedAt", "GeneratedBy", "Url", "CreatedAt", "UpdatedAt"];
          sheet_RELATORIO_GLOSAS.getRange(1, 1, 1, h_sheet_RELATORIO_GLOSAS.length).setValues([h_sheet_RELATORIO_GLOSAS]);
          var d_sheet_RELATORIO_GLOSAS = [
            ["REL-0001", "Avaliação", "tipo_b", "B", "ativo", "B", "C", "recurso_001.png", "2026-04-19 01:10:44", "2026-06-07 01:10:44"],
            ["REL-0002", "Prática", "tipo_a", "B", "ativo", "D", "B", "recurso_002.png", "2026-06-09 01:10:44", "2026-06-03 01:10:44"],
            ["REL-0003", "Introdução", "tipo_c", "A", "ativo", "A", "B", "recurso_003.png", "2026-06-20 01:10:44", "2026-06-10 01:10:44"],
            ["REL-0004", "Avaliação", "tipo_c", "A", "ativo", "B", "D", "recurso_004.png", "2026-05-27 01:10:44", "2026-05-26 01:10:44"],
            ["REL-0005", "Conceitos", "tipo_c", "D", "ativo", "C", "B", "recurso_005.png", "2026-06-12 01:10:44", "2026-06-07 01:10:44"],
            ["REL-0006", "Avaliação", "tipo_c", "D", "ativo", "A", "B", "recurso_006.png", "2026-04-15 01:10:44", "2026-06-12 01:10:44"],
            ["REL-0007", "Introdução", "tipo_a", "D", "ativo", "A", "C", "recurso_007.png", "2026-06-18 01:10:44", "2026-06-14 01:10:44"],
            ["REL-0008", "Prática", "tipo_b", "D", "ativo", "A", "B", "recurso_008.png", "2026-05-15 01:10:44", "2026-06-19 01:10:44"],
            ["REL-0009", "Revisão", "tipo_c", "B", "ativo", "D", "A", "recurso_009.png", "2026-04-12 01:10:44", "2026-05-30 01:10:44"],
            ["REL-0010", "Introdução", "tipo_c", "D", "ativo", "A", "A", "recurso_010.png", "2026-05-08 01:10:44", "2026-06-08 01:10:44"],
            ["REL-0011", "Prática", "tipo_a", "C", "ativo", "B", "B", "recurso_011.png", "2026-04-11 01:10:44", "2026-05-26 01:10:44"],
            ["REL-0012", "Prática", "tipo_c", "A", "ativo", "D", "A", "recurso_012.png", "2026-04-09 01:10:44", "2026-05-24 01:10:44"],
            ["REL-0013", "Revisão", "tipo_c", "A", "ativo", "A", "D", "recurso_013.png", "2026-04-05 01:10:44", "2026-05-29 01:10:44"],
            ["REL-0014", "Revisão", "tipo_a", "D", "ativo", "C", "A", "recurso_014.png", "2026-06-07 01:10:44", "2026-06-20 01:10:44"],
            ["REL-0015", "Avaliação", "tipo_c", "B", "ativo", "D", "D", "recurso_015.png", "2026-05-13 01:10:44", "2026-05-27 01:10:44"],
            ["REL-0016", "Conceitos", "tipo_a", "A", "ativo", "B", "D", "recurso_016.png", "2026-03-25 01:10:44", "2026-05-31 01:10:44"],
            ["REL-0017", "Introdução", "tipo_c", "D", "ativo", "D", "D", "recurso_017.png", "2026-03-23 01:10:44", "2026-06-17 01:10:44"],
            ["REL-0018", "Avaliação", "tipo_c", "D", "ativo", "A", "D", "recurso_018.png", "2026-06-05 01:10:44", "2026-05-24 01:10:44"],
            ["REL-0019", "Revisão", "tipo_b", "C", "ativo", "C", "D", "recurso_019.png", "2026-06-13 01:10:44", "2026-06-14 01:10:44"],
            ["REL-0020", "Conceitos", "tipo_a", "A", "ativo", "D", "A", "recurso_020.png", "2026-06-19 01:10:44", "2026-05-25 01:10:44"],
            ["REL-0021", "Conceitos", "tipo_a", "A", "ativo", "B", "D", "recurso_021.png", "2026-05-28 01:10:44", "2026-06-12 01:10:44"],
            ["REL-0022", "Introdução", "tipo_b", "C", "ativo", "C", "B", "recurso_022.png", "2026-04-04 01:10:44", "2026-06-09 01:10:44"],
            ["REL-0023", "Avaliação", "tipo_c", "A", "ativo", "A", "C", "recurso_023.png", "2026-04-12 01:10:44", "2026-06-15 01:10:44"],
            ["REL-0024", "Avaliação", "tipo_c", "C", "ativo", "D", "C", "recurso_024.png", "2026-05-05 01:10:44", "2026-05-28 01:10:44"],
            ["REL-0025", "Revisão", "tipo_b", "B", "ativo", "C", "A", "recurso_025.png", "2026-06-14 01:10:44", "2026-06-10 01:10:44"],
            ["REL-0026", "Avaliação", "tipo_c", "D", "ativo", "A", "B", "recurso_026.png", "2026-06-03 01:10:44", "2026-05-26 01:10:44"],
            ["REL-0027", "Revisão", "tipo_a", "C", "ativo", "A", "C", "recurso_027.png", "2026-06-02 01:10:44", "2026-06-20 01:10:44"],
            ["REL-0028", "Conceitos", "tipo_c", "D", "inativo", "A", "A", "recurso_028.png", "2026-04-18 01:10:44", "2026-05-26 01:10:44"],
            ["REL-0029", "Introdução", "tipo_b", "C", "inativo", "C", "A", "recurso_029.png", "2026-06-13 01:10:44", "2026-06-13 01:10:44"],
            ["REL-0030", "Revisão", "tipo_b", "D", "ativo", "D", "D", "recurso_030.png", "2026-04-25 01:10:44", "2026-06-20 01:10:44"]
          ];
          sheet_RELATORIO_GLOSAS.getRange(2, 1, d_sheet_RELATORIO_GLOSAS.length, h_sheet_RELATORIO_GLOSAS.length).setValues(d_sheet_RELATORIO_GLOSAS);
          results.push('OK Relatorio_Glosas: ' + d_sheet_RELATORIO_GLOSAS.length + ' registros');
        } catch (e) {
          results.push('ERRO Relatorio_Glosas: ' + e.message);
        }

        // ESC_Escolas
        try {
          var sheet_ESC_ESCOLAS = ss.getSheetByName('ESC_Escolas') || ss.insertSheet('ESC_Escolas');
          if (sheet_ESC_ESCOLAS.getLastRow() > 1) {
            sheet_ESC_ESCOLAS.deleteRows(2, sheet_ESC_ESCOLAS.getLastRow() - 1);
          }
          var h_sheet_ESC_ESCOLAS = ["ID", "Name", "Code", "Address", "City", "State", "Status", "CreatedAt", "UpdatedAt"];
          sheet_ESC_ESCOLAS.getRange(1, 1, 1, h_sheet_ESC_ESCOLAS.length).setValues([h_sheet_ESC_ESCOLAS]);
          var d_sheet_ESC_ESCOLAS = [
            ["ESC-0001", "Diego Souza", "B", "D", "B", "D", "ativo", "2026-03-28 01:10:44", "2026-06-12 01:10:44"],
            ["ESC-0002", "Ana Silva", "C", "A", "C", "C", "ativo", "2026-06-17 01:10:44", "2026-06-11 01:10:44"],
            ["ESC-0003", "Gabriela Rocha", "D", "A", "A", "D", "ativo", "2026-04-13 01:10:44", "2026-06-07 01:10:44"],
            ["ESC-0004", "Gabriela Rocha", "C", "B", "D", "D", "ativo", "2026-06-04 01:10:44", "2026-05-23 01:10:44"],
            ["ESC-0005", "Ana Silva", "C", "C", "A", "B", "ativo", "2026-05-08 01:10:44", "2026-06-03 01:10:44"],
            ["ESC-0006", "Gabriela Rocha", "A", "C", "C", "C", "ativo", "2026-03-29 01:10:44", "2026-05-27 01:10:44"],
            ["ESC-0007", "Ana Silva", "A", "C", "C", "C", "ativo", "2026-04-25 01:10:44", "2026-06-07 01:10:44"],
            ["ESC-0008", "Ana Silva", "D", "A", "D", "A", "ativo", "2026-04-20 01:10:44", "2026-06-01 01:10:44"],
            ["ESC-0009", "Diego Souza", "D", "A", "A", "C", "ativo", "2026-06-12 01:10:44", "2026-06-07 01:10:44"],
            ["ESC-0010", "Carla Oliveira", "C", "C", "C", "D", "ativo", "2026-05-22 01:10:44", "2026-06-01 01:10:44"],
            ["ESC-0011", "Carla Oliveira", "B", "A", "B", "A", "ativo", "2026-05-28 01:10:44", "2026-05-31 01:10:44"],
            ["ESC-0012", "Henrique Alves", "C", "A", "B", "A", "ativo", "2026-05-19 01:10:44", "2026-06-21 01:10:44"],
            ["ESC-0013", "Felipe Costa", "A", "B", "C", "A", "ativo", "2026-04-17 01:10:44", "2026-06-07 01:10:44"],
            ["ESC-0014", "Bruno Santos", "A", "B", "B", "C", "ativo", "2026-03-25 01:10:44", "2026-06-08 01:10:44"],
            ["ESC-0015", "Bruno Santos", "D", "C", "B", "A", "ativo", "2026-04-04 01:10:44", "2026-05-27 01:10:44"],
            ["ESC-0016", "Felipe Costa", "C", "D", "C", "D", "ativo", "2026-04-02 01:10:44", "2026-06-21 01:10:44"],
            ["ESC-0017", "Carla Oliveira", "C", "A", "C", "B", "ativo", "2026-06-07 01:10:44", "2026-06-02 01:10:44"],
            ["ESC-0018", "Diego Souza", "C", "C", "B", "D", "ativo", "2026-03-28 01:10:44", "2026-05-29 01:10:44"],
            ["ESC-0019", "Carla Oliveira", "D", "A", "A", "B", "inativo", "2026-04-13 01:10:44", "2026-05-29 01:10:44"],
            ["ESC-0020", "Bruno Santos", "A", "D", "D", "C", "ativo", "2026-05-27 01:10:44", "2026-05-26 01:10:44"],
            ["ESC-0021", "Eduarda Lima", "B", "C", "B", "C", "ativo", "2026-04-23 01:10:44", "2026-06-11 01:10:44"],
            ["ESC-0022", "Bruno Santos", "B", "D", "D", "C", "ativo", "2026-05-06 01:10:44", "2026-06-04 01:10:44"],
            ["ESC-0023", "Bruno Santos", "C", "D", "B", "D", "inativo", "2026-05-22 01:10:44", "2026-06-03 01:10:44"],
            ["ESC-0024", "Carla Oliveira", "B", "D", "B", "C", "ativo", "2026-05-08 01:10:44", "2026-06-11 01:10:44"],
            ["ESC-0025", "Bruno Santos", "A", "D", "D", "B", "inativo", "2026-04-01 01:10:44", "2026-05-24 01:10:44"],
            ["ESC-0026", "Diego Souza", "B", "D", "A", "B", "ativo", "2026-04-28 01:10:44", "2026-06-13 01:10:44"],
            ["ESC-0027", "Henrique Alves", "A", "B", "A", "D", "ativo", "2026-03-24 01:10:44", "2026-06-16 01:10:44"],
            ["ESC-0028", "Bruno Santos", "B", "D", "D", "C", "ativo", "2026-04-30 01:10:44", "2026-05-30 01:10:44"],
            ["ESC-0029", "Diego Souza", "C", "A", "C", "C", "ativo", "2026-06-15 01:10:44", "2026-06-19 01:10:44"],
            ["ESC-0030", "Felipe Costa", "D", "D", "D", "D", "ativo", "2026-04-20 01:10:44", "2026-05-30 01:10:44"]
          ];
          sheet_ESC_ESCOLAS.getRange(2, 1, d_sheet_ESC_ESCOLAS.length, h_sheet_ESC_ESCOLAS.length).setValues(d_sheet_ESC_ESCOLAS);
          results.push('OK ESC_Escolas: ' + d_sheet_ESC_ESCOLAS.length + ' registros');
        } catch (e) {
          results.push('ERRO ESC_Escolas: ' + e.message);
        }

        Logger.log(results.join('\n'));
        return results;
      } catch (error) {
        Logger.log("Erro em populateSyntheticData: " + error.message);
        throw error; // Re-lança para tratamento superior
      }
    } catch (error) {
      Logger.log("Erro em populateSyntheticData: " + error.message);
      throw error;
    }
  } catch (error) {
    Logger.log("Erro em populateSyntheticData: " + error.message);
    throw error;
  }
}
