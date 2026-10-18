// ==========================================================================
// Componente: Modal de OCR com Tesseract.js (App.OcrModal)
// ==========================================================================

window.App = window.App || {};

App.OcrModal = (function () {
  let modalEl = null;
  let ocrScope = null;
  let ocrLanguage = null;
  let btnStartOcr = null;
  let progressWrapper = null;
  let ocrBar = null;
  let ocrStatus = null;
  let resultWrapper = null;
  let resultTextarea = null;
  let btnCopyText = null;
  let btnDownloadTxt = null;

  function init() {
    modalEl = document.getElementById('modalOcr');
    ocrScope = document.getElementById('ocrScope');
    ocrLanguage = document.getElementById('ocrLanguage');
    btnStartOcr = document.getElementById('btnStartOcr');
    progressWrapper = document.getElementById('ocrProgressWrapper');
    ocrBar = document.getElementById('ocrProgressBar');
    ocrStatus = document.getElementById('ocrProgressStatus');
    resultWrapper = document.getElementById('ocrResultWrapper');
    resultTextarea = document.getElementById('ocrResultText');
    btnCopyText = document.getElementById('btnCopyOcrText');
    btnDownloadTxt = document.getElementById('btnDownloadOcrTxt');

    if (btnStartOcr) btnStartOcr.addEventListener('click', executeOcr);

    if (btnCopyText) {
      btnCopyText.addEventListener('click', () => {
        if (!resultTextarea) return;
        navigator.clipboard.writeText(resultTextarea.value);
        App.Utils.showToast('Texto copiado para a área de transferência!', 'success');
      });
    }

    if (btnDownloadTxt) {
      btnDownloadTxt.addEventListener('click', () => {
        if (!resultTextarea) return;
        App.Utils.downloadBlob(new Blob([resultTextarea.value], { type: 'text/plain;charset=utf-8' }), 'ocr_texto.txt');
      });
    }
  }

  function open() {
    if (modalEl) modalEl.style.display = 'flex';
  }

  function close() {
    if (modalEl) modalEl.style.display = 'none';
  }

  async function executeOcr() {
    const scope = ocrScope ? ocrScope.value : 'all';
    const targetPages = scope === 'selected' ? App.State.getSelectedPages() : App.State.getPages();

    if (targetPages.length === 0) {
      App.Utils.showToast('Nenhuma página para processar no escopo selecionado.', 'error');
      return;
    }

    const lang = ocrLanguage ? ocrLanguage.value : 'por';

    if (progressWrapper) progressWrapper.style.display = 'block';
    if (resultWrapper) resultWrapper.style.display = 'none';
    if (ocrStatus) ocrStatus.textContent = 'Inicializando motor Tesseract OCR...';
    if (ocrBar) ocrBar.style.width = '10%';

    try {
      let fullText = '';

      for (let i = 0; i < targetPages.length; i++) {
        const page = targetPages[i];
        if (ocrStatus) ocrStatus.textContent = `Reconhecendo texto na página ${i + 1} de ${targetPages.length}...`;
        if (ocrBar) ocrBar.style.width = `${Math.round(20 + ((i + 1) / targetPages.length) * 75)}%`;

        if (page.text && page.text.trim().length > 20) {
          fullText += `--- PÁGINA ${i + 1} ---\n\n${page.text}\n\n`;
        } else if (window.Tesseract) {
          const dataUrl = page.processedCanvas.toDataURL('image/png');
          const result = await Tesseract.recognize(dataUrl, lang, {
            logger: m => {
              if (m.status === 'recognizing text' && ocrStatus) {
                ocrStatus.textContent = `Página ${i + 1}: ${Math.round((m.progress || 0) * 100)}% concluído...`;
              }
            }
          });
          const ocrString = result.data.text || '';
          page.text = ocrString;
          fullText += `--- PÁGINA ${i + 1} (OCR) ---\n\n${ocrString}\n\n`;
        }
      }

      if (ocrBar) ocrBar.style.width = '100%';
      if (ocrStatus) ocrStatus.textContent = 'OCR finalizado!';
      if (resultWrapper) resultWrapper.style.display = 'block';
      if (resultTextarea) resultTextarea.value = fullText;
      App.Utils.showToast('Reconhecimento de texto concluído!', 'success');
    } catch (err) {
      console.error('Erro no OCR:', err);
      App.Utils.showToast('Erro no OCR: ' + err.message, 'error');
    }
  }

  return {
    init,
    open,
    close,
    executeOcr
  };
})();
