// ==========================================================================
// Módulo: Serviço de Conversão para Outros Formatos (App.ConversionService)
// ==========================================================================

window.App = window.App || {};

App.ConversionService = (function () {
  async function convertToDocx(targetPages, baseName, onProgress) {
    const docxLib = window.docx;
    if (!docxLib || !docxLib.Document) {
      throw new Error('A biblioteca docx não foi carregada.');
    }

    const { Document, Packer, Paragraph, TextRun, ImageRun } = docxLib;
    const children = [];

    for (let i = 0; i < targetPages.length; i++) {
      const page = targetPages[i];
      if (onProgress) onProgress(i, targetPages.length);

      children.push(new Paragraph({
        children: [
          new TextRun({ text: `Página ${i + 1} (${page.sourceName})`, bold: true, size: 28, color: '2563EB' })
        ],
        spacing: { after: 200 }
      }));

      const imgBytes = await App.Utils.canvasToJpegBytes(page.processedCanvas, 0.9);
      const maxW = 550;
      const scale = Math.min(maxW / page.processedCanvas.width, 1);
      const renderW = Math.round(page.processedCanvas.width * scale);
      const renderH = Math.round(page.processedCanvas.height * scale);

      children.push(new Paragraph({
        children: [
          new ImageRun({
            data: imgBytes,
            transformation: { width: renderW, height: renderH }
          })
        ],
        spacing: { after: 250 }
      }));

      if (page.text && page.text.trim()) {
        children.push(new Paragraph({
          children: [
            new TextRun({ text: 'Texto do Documento:', bold: true, size: 22, color: '334155' })
          ],
          spacing: { before: 100, after: 100 }
        }));

        const paragraphs = page.text.split('\n');
        paragraphs.forEach(p => {
          if (p.trim()) {
            children.push(new Paragraph({
              children: [new TextRun({ text: p, size: 20 })],
              spacing: { after: 100 }
            }));
          }
        });
      }

      if (i < targetPages.length - 1) {
        children.push(new Paragraph({ pageBreakBefore: true }));
      }
    }

    const doc = new Document({
      sections: [{ properties: {}, children }]
    });

    const blob = await Packer.toBlob(doc);
    App.Utils.downloadBlob(blob, baseName + '.docx');
  }

  async function convertToPptx(targetPages, baseName, onProgress) {
    const pptxClass = window.PptxGenJS;
    if (!pptxClass) throw new Error('A biblioteca PptxGenJS não foi carregada.');
    const pptx = new pptxClass();

    for (let i = 0; i < targetPages.length; i++) {
      const page = targetPages[i];
      if (onProgress) onProgress(i, targetPages.length);
      const slide = pptx.addSlide();
      const dataUrl = page.processedCanvas.toDataURL('image/jpeg', 0.95);
      slide.addImage({ data: dataUrl, x: 0, y: 0, w: '100%', h: '100%' });
    }

    await pptx.writeFile({ fileName: baseName + '.pptx' });
  }

  async function convertToXlsx(targetPages, baseName) {
    const xlsxLib = window.XLSX;
    if (!xlsxLib) throw new Error('A biblioteca XLSX não foi carregada.');

    const rows = [];

    for (let i = 0; i < targetPages.length; i++) {
      const page = targetPages[i];
      rows.push([`=== PÁGINA ${i + 1} (${page.sourceName}) ===`]);

      const lines = (page.text || '').split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length > 0) {
        lines.forEach(line => {
          const cols = line.includes('\t')
            ? line.split('\t')
            : (line.includes(';') ? line.split(';') : [line]);
          rows.push(cols);
        });
      } else {
        rows.push(['[Imagem/Página sem texto vetorial extraído. Dica: execute o OCR primeiro para reconhecer tabelas e dados.]']);
      }
      rows.push([]);
    }

    const ws = xlsxLib.utils.aoa_to_sheet(rows);
    const wb = xlsxLib.utils.book_new();
    xlsxLib.utils.book_append_sheet(wb, ws, 'Dados do Documento');
    xlsxLib.writeFile(wb, baseName + '.xlsx');
  }

  async function convertToImagesZip(targetPages, baseName, format, onProgress) {
    const zip = new JSZip();
    const ext = format === 'png' ? 'png' : 'jpg';
    const mime = format === 'png' ? 'image/png' : 'image/jpeg';

    for (let i = 0; i < targetPages.length; i++) {
      const page = targetPages[i];
      if (onProgress) onProgress(i, targetPages.length);
      const dataUrl = page.processedCanvas.toDataURL(mime, 0.95);
      const b64 = dataUrl.split(',')[1];
      zip.file(`pagina_${String(i + 1).padStart(3, '0')}.${ext}`, b64, { base64: true });
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    App.Utils.downloadBlob(zipBlob, baseName + `_${ext}.zip`);
  }

  function convertToTxt(targetPages, baseName) {
    let fullText = '';
    targetPages.forEach((p, idx) => {
      fullText += `=========================================\n`;
      fullText += `PÁGINA ${idx + 1} (${p.sourceName})\n`;
      fullText += `=========================================\n\n`;
      fullText += (p.text || '[Página sem texto detectado]').trim() + '\n\n\n';
    });
    App.Utils.downloadBlob(new Blob([fullText], { type: 'text/plain;charset=utf-8' }), baseName + '.txt');
  }

  function convertToMarkdown(targetPages, baseName) {
    let md = `# ${baseName}\n\n`;
    targetPages.forEach((p, idx) => {
      md += `## Página ${idx + 1}\n\n`;
      md += `> **Arquivo de Origem:** \`${App.Utils.escapeHtml(p.sourceName)}\` &bull; **Dimensões:** ${p.width}x${p.height} px\n\n`;
      if (p.text && p.text.trim()) {
        md += p.text.trim() + '\n\n';
      } else {
        md += `*(Conteúdo escaneado / gráfico sem camada de texto direta)*\n\n`;
      }
      md += `---\n\n`;
    });
    App.Utils.downloadBlob(new Blob([md], { type: 'text/markdown;charset=utf-8' }), baseName + '.md');
  }

  function convertToHtml(targetPages, baseName) {
    let html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${App.Utils.escapeHtml(baseName)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 32px 16px; display: flex; flex-direction: column; align-items: center; gap: 24px; }
    h1 { margin-bottom: 8px; }
    .page-box { background: white; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.08); max-width: 820px; width: 100%; padding: 20px; box-sizing: border-box; }
    .page-box img { width: 100%; height: auto; border: 1px solid #cbd5e1; border-radius: 4px; display: block; }
    .page-text { margin-top: 16px; white-space: pre-wrap; font-size: 14px; color: #334155; background: #f1f5f9; padding: 14px; border-radius: 6px; }
  </style>
</head>
<body>
  <h1>${App.Utils.escapeHtml(baseName)}</h1>`;

    targetPages.forEach((p, idx) => {
      html += `
  <div class="page-box">
    <h3>Página ${idx + 1} (${App.Utils.escapeHtml(p.sourceName)})</h3>
    <img src="${p.processedCanvas.toDataURL('image/jpeg', 0.92)}" alt="Página ${idx + 1}">`;
      if (p.text && p.text.trim()) {
        html += `
    <div class="page-text">${App.Utils.escapeHtml(p.text.trim())}</div>`;
      }
      html += `
  </div>`;
    });

    html += `
</body>
</html>`;
    App.Utils.downloadBlob(new Blob([html], { type: 'text/html;charset=utf-8' }), baseName + '.html');
  }

  return {
    convertToDocx,
    convertToPptx,
    convertToXlsx,
    convertToImagesZip,
    convertToTxt,
    convertToMarkdown,
    convertToHtml
  };
})();
