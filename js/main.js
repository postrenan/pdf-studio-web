// ==========================================================================
// Ponto de Entrada Principal (Main Application Entry Point)
// ==========================================================================

window.App = window.App || {};

// Configuração do Worker do PDF.js
if (window.pdfjsLib) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdf.worker.min.js';
  } catch (e) {
    console.warn('PDF.js worker setup:', e);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Inicialização dos Componentes
  if (App.PageGrid) App.PageGrid.init();
  if (App.Ribbon) App.Ribbon.init();
  if (App.ActionBar) App.ActionBar.init();
  if (App.ScannerModal) App.ScannerModal.init();
  if (App.ImageAdjustModal) App.ImageAdjustModal.init();
  if (App.SavePdfModal) App.SavePdfModal.init();
  if (App.ConverterModal) App.ConverterModal.init();
  if (App.OcrModal) App.OcrModal.init();
  if (App.BatchSplitModal) App.BatchSplitModal.init();
  if (App.LgpdModal) App.LgpdModal.init();

  setupModalDismissals();
  setupKeyboardShortcuts();
});

function setupModalDismissals() {
  document.querySelectorAll('.modal-close, [data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.close || (btn.closest('.modal-overlay') && btn.closest('.modal-overlay').id);
      if (targetId) {
        closeModalById(targetId);
      }
    });
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModalById(overlay.id);
      }
    });
  });
}

function closeModalById(id) {
  const modal = document.getElementById(id);
  if (!modal) return;

  if (id === 'modalScan' && App.ScannerModal) {
    App.ScannerModal.close();
  } else if (id === 'modalImageAdjust' && App.ImageAdjustModal) {
    App.ImageAdjustModal.close();
  } else if (id === 'modalSavePdf' && App.SavePdfModal) {
    App.SavePdfModal.close();
  } else if (id === 'modalConvertPdf' && App.ConverterModal) {
    App.ConverterModal.close();
  } else if (id === 'modalOcr' && App.OcrModal) {
    App.OcrModal.close();
  } else if (id === 'modalBatchSplit' && App.BatchSplitModal) {
    App.BatchSplitModal.close();
  } else if (id === 'modalLgpd' && App.LgpdModal) {
    App.LgpdModal.close();
  } else {
    modal.style.display = 'none';
  }
}

function setupKeyboardShortcuts() {
  window.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

    if (e.key === 'Delete' || e.key === 'Del') {
      if (App.ActionBar) App.ActionBar.deletePages();
    } else if (e.ctrlKey && e.key.toLowerCase() === 'a') {
      e.preventDefault();
      App.State.selectAll(true);
    } else if (e.ctrlKey && e.key.toLowerCase() === 's') {
      e.preventDefault();
      if (App.State.getPages().length > 0 && App.SavePdfModal) {
        App.SavePdfModal.open();
      }
    } else if (e.ctrlKey && e.key.toLowerCase() === 'p') {
      e.preventDefault();
      if (App.State.getPages().length > 0 && App.Ribbon) {
        App.Ribbon.printActivePages();
      }
    }
  });
}
