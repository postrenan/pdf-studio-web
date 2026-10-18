// ==========================================================================
// Componente: Barra Superior de Ferramentas (App.Ribbon)
// ==========================================================================

window.App = window.App || {};

App.Ribbon = (function () {
  function init() {
    const btnScan = document.getElementById('btnScan');
    const btnImport = document.getElementById('btnImport');
    const hiddenFileInput = document.getElementById('hiddenFileInput');
    const btnEmptyScan = document.getElementById('btnEmptyScan');
    const btnEmptyBrowse = document.getElementById('btnEmptyBrowse');

    const btnSavePdf = document.getElementById('btnSavePdf');
    const btnConvertPdf = document.getElementById('btnConvertPdf');
    const btnSaveImages = document.getElementById('btnSaveImages');
    const btnPrint = document.getElementById('btnPrint');
    const btnShare = document.getElementById('btnShare');

    const btnImageAdjust = document.getElementById('btnImageAdjust');
    const btnOcr = document.getElementById('btnOcr');
    const btnBatchSplit = document.getElementById('btnBatchSplit');

    // Importação
    if (btnImport && hiddenFileInput) btnImport.addEventListener('click', () => hiddenFileInput.click());
    if (btnEmptyBrowse && hiddenFileInput) btnEmptyBrowse.addEventListener('click', () => hiddenFileInput.click());

    if (hiddenFileInput) {
      hiddenFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          handleIncomingFiles(Array.from(e.target.files));
          hiddenFileInput.value = '';
        }
      });
    }

    // Drag and drop global
    setupGlobalDrop();

    // Scanner
    if (btnScan) btnScan.addEventListener('click', () => App.ScannerModal.open());
    if (btnEmptyScan) btnEmptyScan.addEventListener('click', () => App.ScannerModal.open());

    // Exportação & Ações
    if (btnSavePdf) {
      btnSavePdf.addEventListener('click', () => {
        if (App.State.getPages().length === 0) return App.Utils.showToast('Nenhuma página para salvar.', 'error');
        App.SavePdfModal.open();
      });
    }

    if (btnConvertPdf) {
      btnConvertPdf.addEventListener('click', () => {
        if (App.State.getPages().length === 0) return App.Utils.showToast('Nenhum documento para converter.', 'error');
        App.ConverterModal.open();
      });
    }

    if (btnSaveImages) {
      btnSaveImages.addEventListener('click', async () => {
        const pages = App.State.getActivePages();
        if (pages.length === 0) return App.Utils.showToast('Nenhuma página para exportar.', 'error');
        App.Utils.updateProgress(10, 'Compactando páginas em imagens...');
        const progressEl = document.getElementById('progressContainer');
        if (progressEl) progressEl.style.display = 'flex';
        try {
          await App.ConversionService.convertToImagesZip(pages, 'paginas_exportadas', 'jpg', (i, total) => {
            App.Utils.updateProgress(Math.round(15 + ((i + 1) / total) * 80), `Processando imagem ${i + 1}...`);
          });
          App.Utils.showToast('Imagens exportadas em arquivo ZIP!', 'success');
        } catch (e) {
          App.Utils.showToast('Erro ao exportar imagens: ' + e.message, 'error');
        } finally {
          setTimeout(() => { if (progressEl) progressEl.style.display = 'none'; }, 1500);
        }
      });
    }

    if (btnPrint) btnPrint.addEventListener('click', printActivePages);
    if (btnShare) btnShare.addEventListener('click', shareActiveDocument);

    if (btnImageAdjust) {
      btnImageAdjust.addEventListener('click', () => {
        const selected = App.State.getSelectedPages();
        const all = App.State.getPages();
        if (all.length === 0) return App.Utils.showToast('Nenhuma página para ajuste.', 'error');
        const targetIdx = selected.length > 0 ? all.indexOf(selected[0]) : 0;
        App.ImageAdjustModal.open(targetIdx);
      });
    }

    if (btnOcr) {
      btnOcr.addEventListener('click', () => {
        if (App.State.getPages().length === 0) return App.Utils.showToast('Nenhum documento para OCR.', 'error');
        App.OcrModal.open();
      });
    }

    if (btnBatchSplit) {
      btnBatchSplit.addEventListener('click', () => {
        if (App.State.getPages().length === 0) return App.Utils.showToast('Nenhum documento para dividir.', 'error');
        App.BatchSplitModal.open();
      });
    }
  }

  async function handleIncomingFiles(fileList) {
    if (fileList.length === 0) return;
    const progressEl = document.getElementById('progressContainer');
    if (progressEl) progressEl.style.display = 'flex';
    App.Utils.updateProgress(5, `Importando ${fileList.length} arquivo(s)...`);

    const offscreen = document.getElementById('offscreenRenderer');

    try {
      for (let f = 0; f < fileList.length; f++) {
        const file = fileList[f];
        const name = file.name.toLowerCase();
        App.Utils.updateProgress(Math.round(10 + ((f + 1) / fileList.length) * 80), `Processando: ${file.name}...`);

        const onPage = (canvas, srcName, srcType, text) => {
          const id = 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
          const cloned = App.Utils.cloneCanvas(canvas);
          App.State.addPage({
            id,
            sourceName: srcName,
            sourceType: srcType,
            originalCanvas: canvas,
            processedCanvas: cloned,
            thumbUrl: App.Utils.generateThumbnailDataUrl(cloned),
            width: canvas.width,
            height: canvas.height,
            rotation: 0,
            flipH: false,
            flipV: false,
            colorMode: 'original',
            threshold: 128,
            brightness: 0,
            contrast: 0,
            deskew: 0,
            crop: { top: 0, bottom: 0, left: 0, right: 0 },
            selected: false,
            text: text || ''
          });
        };

        if (name.endsWith('.pdf') || file.type === 'application/pdf') {
          await App.PdfService.unpackPdfPages(file, onPage);
        } else if (name.endsWith('.docx') || name.endsWith('.doc')) {
          await App.PdfService.unpackDocxPages(file, offscreen, onPage);
        } else if (name.endsWith('.txt') || file.type === 'text/plain') {
          await App.PdfService.unpackTxtPages(file, offscreen, onPage);
        } else if (file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|bmp|gif)$/i.test(name)) {
          await App.PdfService.unpackImagePage(file, onPage);
        }
      }

      App.Utils.showToast(`${App.State.getPages().length} página(s) carregada(s) no total.`, 'success');
    } catch (err) {
      console.error(err);
      App.Utils.showToast('Erro ao importar arquivos: ' + err.message, 'error');
    } finally {
      setTimeout(() => { if (progressEl) progressEl.style.display = 'none'; }, 1500);
    }
  }

  function setupGlobalDrop() {
    const emptyState = document.getElementById('emptyState');
    ['dragenter', 'dragover'].forEach(name => {
      window.addEventListener(name, (e) => {
        e.preventDefault();
        if (emptyState) emptyState.classList.add('drag-over');
      }, false);
    });

    ['dragleave', 'drop'].forEach(name => {
      window.addEventListener(name, (e) => {
        e.preventDefault();
        if (emptyState) emptyState.classList.remove('drag-over');
      }, false);
    });

    window.addEventListener('drop', (e) => {
      e.preventDefault();
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleIncomingFiles(Array.from(e.dataTransfer.files));
      }
    });
  }

  function printActivePages() {
    const targetPages = App.State.getActivePages();
    if (targetPages.length === 0) return;

    let printContainer = document.getElementById('printContainer');
    if (!printContainer) {
      printContainer = document.createElement('div');
      printContainer.id = 'printContainer';
      document.body.appendChild(printContainer);
    }
    printContainer.innerHTML = '';

    targetPages.forEach(page => {
      const pageWrapper = document.createElement('div');
      pageWrapper.className = 'print-page';
      const img = document.createElement('img');
      img.src = page.processedCanvas.toDataURL('image/jpeg', 0.95);
      pageWrapper.appendChild(img);
      printContainer.appendChild(pageWrapper);
    });

    window.print();
  }

  async function shareActiveDocument() {
    const pages = App.State.getPages();
    if (pages.length === 0) return App.Utils.showToast('Nenhum documento para compartilhar.', 'error');

    if (navigator.share) {
      try {
        const pdfLib = window.PDFLib || self.PDFLib;
        const pdfDoc = await pdfLib.PDFDocument.create();
        for (const page of pages) {
          const imgBytes = await App.Utils.canvasToJpegBytes(page.processedCanvas, 0.9);
          const embedded = await pdfDoc.embedJpg(imgBytes);
          const p = pdfDoc.addPage([595.28, 841.89]);
          p.drawImage(embedded, { x: 0, y: 0, width: 595.28, height: 841.89 });
        }
        const bytes = await pdfDoc.save();
        const file = new File([bytes], 'documento_digitalizado.pdf', { type: 'application/pdf' });
        await navigator.share({ title: 'Documento Digitalizado', files: [file] });
        App.Utils.showToast('Compartilhado com sucesso!', 'success');
      } catch (e) {
        if (e.name !== 'AbortError') App.Utils.showToast('Não foi possível compartilhar: ' + e.message, 'error');
      }
    } else {
      window.location.href = `mailto:?subject=${encodeURIComponent('Documento PDF Studio Web')}`;
    }
  }

  return {
    init,
    handleIncomingFiles
  };
})();
