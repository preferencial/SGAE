// AiContractTestAdapter.gs — FROTA-08 (Preferencial - SGAE)
function _AiContractSubject_() {
  return typeof CoreGeminiService !== 'undefined' && typeof CoreGeminiService.generate === 'function'
    ? CoreGeminiService.generate('smoke test')
    : (typeof Core_Gemini_Service !== 'undefined'
        ? Core_Gemini_Service.generate('smoke test')
        : { ok: false, source: 'no-gemini-service' });
}