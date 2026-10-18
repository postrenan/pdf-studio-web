// ==========================================================================
// Componente: Modal de Salvamento de PDF Unificado (App.SavePdfModal)
// ==========================================================================

window.App = window.App || {};

App.SavePdfModal = (function () {
  let modalEl = null;
  let btnConfirm = null;
  let pdfExportScope = null;
  let pdfPageLayout = null;
  let pdfFileName = null;
  let pdfMetaTitle = null;
  let pdfMetaAuthor = null;
  let pdfMetaSubject = null;

  function init() {
    modalEl = document.getElementById('modalSavePdf');
    btnConfirm = document.getElementById('btnConfirmSavePdf');
    pdfExportScope = document.getElementById('pdfExportScope');
    pdfPageLayout = document.getElementById('pdfPageLayout');
    pdfFileName = document.getElementById('pdfFileName');
    pdfMetaTitle = document.getElementById('pdfMetaTitle');
    pdfMetaAuthor = document.getElementById('pdfMetaAuthor');
    pdfMetaSubject = document.getElementById('pdfMetaSubject');

    if (btnConfirm) {
      btnConfirm.addEventListener('click', executeSave);
    }
  }

  function open() {
    if (modalEl) modalEl.style.display = 'flex';
  }

  function close() {
    if (modalEl) modalEl.style.display = 'none';
  }

  async function executeSave() {
    const scope = pdfExportScope ? pdfExportScope.value : 'all';
    const layout = pdfPageLayout ? pdfPageLayout.value : 'a4';
    let filename = pdfFileName ? pdfFileName.value.trim() : 'documento_unificado';
    if (!filename) filename = 'documento_unificado';
    if (!filename.toLowerCase().endsWith('.pdf')) filename += '.pdf';

    const targetPages = scope === 'selected' ? App.State.getSelectedPages() : App.State.getPages();
    if (targetPages.length === 0) {
      App.Utils.showToast('Nenhuma página para exportar com o filtro selecionado.', 'error');
      return;
    }

    close();
    const progressEl = document.getElementById('progressContainer');
    if (progressEl) progressEl.style.display = 'flex';
    App.Utils.updateProgress(10, 'Iniciando criação do PDF unificado...');

    try {
      await App.PdfService.saveToPdf(targetPages, {
        filename,
        layout,
        metaTitle: pdfMetaTitle ? pdfMetaTitle.value.trim() : '',
        metaAuthor: pdfMetaAuthor ? pdfMetaAuthor.value.trim() : '',
        metaSubject: pdfMetaSubject ? pdfMetaSubject.value.trim() : ''
      }, (i, total) => {
        const percent = Math.round(15 + ((i + 1) / total) * 75);
        App.Utils.updateProgress(percent, `Renderizando página ${i + 1} de ${total}...`);
      });

      App.Utils.updateProgress(100, 'PDF concluído!');
      App.Utils.showToast('PDF gerado e baixado com sucesso!', 'success');
    } catch (err) {
      console.error('Erro ao salvar PDF:', err);
      App.Utils.showToast('Erro ao salvar PDF: ' + err.message, 'error');
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
    executeSave
  };
})();
