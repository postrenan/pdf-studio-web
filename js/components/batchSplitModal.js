// ==========================================================================
// Componente: Modal de Divisão em Lotes (App.BatchSplitModal)
// ==========================================================================

window.App = window.App || {};

App.BatchSplitModal = (function () {
  let modalEl = null;
  let batchSplitType = null;
  let batchPagesPerDoc = null;
  let btnConfirm = null;

  function init() {
    modalEl = document.getElementById('modalBatchSplit');
    batchSplitType = document.getElementById('batchSplitType');
    batchPagesPerDoc = document.getElementById('batchPagesPerDoc');
    btnConfirm = document.getElementById('btnConfirmBatchSplit');

    if (btnConfirm) {
      btnConfirm.addEventListener('click', executeBatchSplit);
    }
  }

  function open() {
    if (modalEl) modalEl.style.display = 'flex';
  }

  function close() {
    if (modalEl) modalEl.style.display = 'none';
  }

  async function executeBatchSplit() {
    const pages = App.State.getPages();
    if (pages.length === 0) {
      App.Utils.showToast('Nenhuma página disponível para divisão.', 'error');
      return;
    }

    const method = batchSplitType ? batchSplitType.value : 'every-n';
    const pagesPerDoc = method === 'single-pages' ? 1 : (parseInt(batchPagesPerDoc ? batchPagesPerDoc.value : '1', 10) || 1);

    close();
    const progressEl = document.getElementById('progressContainer');
    if (progressEl) progressEl.style.display = 'flex';
    App.Utils.updateProgress(10, 'Dividindo documentos em lotes...');

    try {
      const pdfLib = window.PDFLib || self.PDFLib;
      const { PDFDocument } = pdfLib;
      const zip = new JSZip();

      const totalBatches = Math.ceil(pages.length / pagesPerDoc);

      for (let b = 0; b < totalBatches; b++) {
        const batchDoc = await PDFDocument.create();
        const start = b * pagesPerDoc;
        const end = Math.min(start + pagesPerDoc, pages.length);

        App.Utils.updateProgress(Math.round(15 + ((b + 1) / totalBatches) * 80), `Gerando lote ${b + 1} de ${totalBatches}...`);

        for (let i = start; i < end; i++) {
          const page = pages[i];
          const imgBytes = await App.Utils.canvasToJpegBytes(page.processedCanvas, 0.92);
          const embedded = await batchDoc.embedJpg(imgBytes);
          const p = batchDoc.addPage([595.28, 841.89]);
          p.drawImage(embedded, { x: 0, y: 0, width: 595.28, height: 841.89 });
        }

        const batchBytes = await batchDoc.save();
        const filename = `documento_lote_${String(b + 1).padStart(3, '0')}.pdf`;
        zip.file(filename, batchBytes);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      App.Utils.downloadBlob(zipBlob, 'lotes_divididos.zip');
      App.Utils.showToast('Documentos divididos com sucesso!', 'success');
    } catch (err) {
      console.error('Erro ao dividir em lotes:', err);
      App.Utils.showToast('Erro ao dividir em lotes: ' + err.message, 'error');
    } finally {
      setTimeout(() => {
        if (progressEl) progressEl.style.display = 'none';
        App.Utils.updateProgress(0, '');
      }, 1500);
    }
  }

  return {
    init,
    open,
    close,
    executeBatchSplit
  };
})();
