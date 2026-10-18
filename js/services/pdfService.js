// ==========================================================================
// Módulo: Serviço de Manipulação e Criação de PDF (App.PdfService)
// ==========================================================================

window.App = window.App || {};

App.PdfService = (function () {
  async function unpackPdfPages(file, onPageUnpacked) {
    const buffer = await file.arrayBuffer();
    const pdfDoc = await pdfjsLib.getDocument({ data: buffer.slice(0) }).promise;

    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');

      await page.render({ canvasContext: ctx, viewport }).promise;

      let text = '';
      try {
        const textContent = await page.getTextContent();
        text = textContent.items.map(item => item.str).join(' ');
      } catch (e) {}

      onPageUnpacked(canvas, file.name, 'pdf', text);
    }
  }

  async function unpackImagePage(file, onPageUnpacked) {
    const canvas = await App.Utils.fileToCanvas(file);
    onPageUnpacked(canvas, file.name, 'img', '');
  }

  async function unpackDocxPages(file, offscreenRenderer, onPageUnpacked) {
    const buffer = await file.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer: buffer });

    offscreenRenderer.innerHTML = `
      <div style="font-family: 'Times New Roman', serif; font-size: 14pt; line-height: 1.6; color: #111;">
        ${result.value}
      </div>
    `;

    const fullCanvas = await html2canvas(offscreenRenderer, {
      scale: 1.8,
      useCORS: true,
      backgroundColor: '#ffffff'
    });
    offscreenRenderer.innerHTML = '';

    const a4Ratio = 1.414;
    const pageHeight = fullCanvas.width * a4Ratio;
    const numPages = Math.ceil(fullCanvas.height / pageHeight);

    for (let p = 0; p < numPages; p++) {
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = fullCanvas.width;
      pageCanvas.height = pageHeight;
      const ctx = pageCanvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

      const srcY = p * pageHeight;
      const srcH = Math.min(pageHeight, fullCanvas.height - srcY);
      ctx.drawImage(fullCanvas, 0, srcY, fullCanvas.width, srcH, 0, 0, fullCanvas.width, srcH);

      onPageUnpacked(pageCanvas, file.name, 'docx', '');
    }
  }

  async function unpackTxtPages(file, offscreenRenderer, onPageUnpacked) {
    const text = await file.text();
    offscreenRenderer.innerHTML = `
      <div style="font-family: 'Courier New', monospace; font-size: 13pt; line-height: 1.5; white-space: pre-wrap; color: #111;">
        ${App.Utils.escapeHtml(text)}
      </div>
    `;

    const fullCanvas = await html2canvas(offscreenRenderer, { scale: 1.8, backgroundColor: '#ffffff' });
    offscreenRenderer.innerHTML = '';

    const a4Ratio = 1.414;
    const pageHeight = fullCanvas.width * a4Ratio;
    const numPages = Math.ceil(fullCanvas.height / pageHeight);

    for (let p = 0; p < numPages; p++) {
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = fullCanvas.width;
      pageCanvas.height = pageHeight;
      const ctx = pageCanvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

      const srcY = p * pageHeight;
      const srcH = Math.min(pageHeight, fullCanvas.height - srcY);
      ctx.drawImage(fullCanvas, 0, srcY, fullCanvas.width, srcH, 0, 0, fullCanvas.width, srcH);

      onPageUnpacked(pageCanvas, file.name, 'txt', text);
    }
  }

  async function saveToPdf(targetPages, options, onProgress) {
    const { filename, layout, metaTitle, metaAuthor, metaSubject } = options;
    const pdfLib = window.PDFLib || self.PDFLib;
    const { PDFDocument, degrees } = pdfLib;
    const pdfDoc = await PDFDocument.create();

    if (metaTitle) pdfDoc.setTitle(metaTitle);
    if (metaAuthor) pdfDoc.setAuthor(metaAuthor);
    if (metaSubject) pdfDoc.setSubject(metaSubject);
    pdfDoc.setCreator('PDF Studio Web (NAPS2 Edition)');

    const a4Width = 595.28;
    const a4Height = 841.89;

    for (let i = 0; i < targetPages.length; i++) {
      const page = targetPages[i];
      if (onProgress) onProgress(i, targetPages.length);

      const imgBytes = await App.Utils.canvasToJpegBytes(page.processedCanvas, 0.92);
      const embedded = await pdfDoc.embedJpg(imgBytes);

      if (layout === 'a4') {
        const p = pdfDoc.addPage([a4Width, a4Height]);
        const margin = 24;
        const maxW = a4Width - margin * 2;
        const maxH = a4Height - margin * 2;
        const scale = Math.min(maxW / page.processedCanvas.width, maxH / page.processedCanvas.height, 1);
        const w = page.processedCanvas.width * scale;
        const h = page.processedCanvas.height * scale;
        const x = (a4Width - w) / 2;
        const y = (a4Height - h) / 2;

        p.drawImage(embedded, { x, y, width: w, height: h });
        if (page.rotation) p.setRotation(degrees(page.rotation));
      } else {
        const p = pdfDoc.addPage([page.processedCanvas.width, page.processedCanvas.height]);
        p.drawImage(embedded, { x: 0, y: 0, width: page.processedCanvas.width, height: page.processedCanvas.height });
        if (page.rotation) p.setRotation(degrees(page.rotation));
      }
    }

    const pdfBytes = await pdfDoc.save();
    App.Utils.downloadBlob(new Blob([pdfBytes], { type: 'application/pdf' }), filename);
  }

  return {
    unpackPdfPages,
    unpackImagePage,
    unpackDocxPages,
    unpackTxtPages,
    saveToPdf
  };
})();
