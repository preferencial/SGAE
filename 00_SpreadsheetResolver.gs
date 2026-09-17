/**
 * 00_SpreadsheetResolver.gs — Preferencial - SGAE
 *
 * Alias compatível para resolucao robusta de planilha em contexto webapp.
 * O acessor canonico do SGAE e getSS() (0_Core_Safe_Globals.gs). Este helper
 * apenas delega para getSS() quando disponivel e, como rede de seguranca extra,
 * tambem aceita a Script Property SPREADSHEETS_ID (plural) alem de SPREADSHEET_ID.
 *
 * Motivo: em deployment de web app, SpreadsheetApp.getActiveSpreadsheet()
 * retorna null e null.getSheetByName(...) derruba seed/login.
 */
function getBoundSpreadsheet_() {
  try {
    if (typeof getSS === 'function') {
      var ss = getSS();
      if (ss) return ss;
    }
    var props = PropertiesService.getScriptProperties();
    var id = props.getProperty('SPREADSHEETS_ID') || props.getProperty('SPREADSHEET_ID');
    if (id) return SpreadsheetApp.openById(id);
    var active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
    throw new Error('Planilha indisponivel: defina a Script Property SPREADSHEET_ID.');
  } catch (error) {
    Logger.log("Erro em getBoundSpreadsheet_: " + error.message);
    throw error;
  }
}
