// ==========================================================================
// Módulo: Serviço de Tratamento e Filtros de Imagem (App.ImageService)
// ==========================================================================

window.App = window.App || {};

App.ImageService = (function () {
  function renderFilteredCanvas(sourceCanvas, targetCanvas, options) {
    const { colorMode, threshold, brightness, contrast, deskew, crop } = options;

    // 1. Recorte de Margens (Crop)
    const cropX = Math.round(sourceCanvas.width * (crop.left / 100));
    const cropY = Math.round(sourceCanvas.height * (crop.top / 100));
    const cropW = Math.max(10, sourceCanvas.width - cropX - Math.round(sourceCanvas.width * (crop.right / 100)));
    const cropH = Math.max(10, sourceCanvas.height - cropY - Math.round(sourceCanvas.height * (crop.bottom / 100)));

    // Canvas intermediário para rotação fina (deskew)
    const intermediate = document.createElement('canvas');
    intermediate.width = cropW;
    intermediate.height = cropH;
    const ctxInter = intermediate.getContext('2d');

    if (deskew !== 0) {
      ctxInter.save();
      ctxInter.translate(cropW / 2, cropH / 2);
      ctxInter.rotate((deskew * Math.PI) / 180);
      ctxInter.drawImage(sourceCanvas, cropX, cropY, cropW, cropH, -cropW / 2, -cropH / 2, cropW, cropH);
      ctxInter.restore();
    } else {
      ctxInter.drawImage(sourceCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
    }

    targetCanvas.width = cropW;
    targetCanvas.height = cropH;
    const ctx = targetCanvas.getContext('2d');
    ctx.drawImage(intermediate, 0, 0);

    // 2. Manipulação de Pixels
    applyPixelFilters(targetCanvas, { colorMode, threshold, brightness, contrast });
  }

  function applyPixelFilters(canvas, { colorMode, threshold, brightness, contrast }) {
    if (colorMode === 'original' && brightness === 0 && contrast === 0) return;

    const ctx = canvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;

    const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    const brightnessOffset = brightness * 2.55;

    for (let i = 0; i < d.length; i += 4) {
      let r = d[i];
      let g = d[i + 1];
      let b = d[i + 2];

      if (brightness !== 0) {
        r += brightnessOffset;
        g += brightnessOffset;
        b += brightnessOffset;
      }

      if (contrast !== 0) {
        r = contrastFactor * (r - 128) + 128;
        g = contrastFactor * (g - 128) + 128;
        b = contrastFactor * (b - 128) + 128;
      }

      if (colorMode === 'grayscale') {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        r = g = b = gray;
      } else if (colorMode === 'bw') {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        const bw = gray < threshold ? 0 : 255;
        r = g = b = bw;
      } else if (colorMode === 'invert') {
        r = 255 - r;
        g = 255 - g;
        b = 255 - b;
      }

      d[i] = Math.min(255, Math.max(0, r));
      d[i + 1] = Math.min(255, Math.max(0, g));
      d[i + 2] = Math.min(255, Math.max(0, b));
    }

    ctx.putImageData(imgData, 0, 0);
  }

  return {
    renderFilteredCanvas,
    applyPixelFilters
  };
})();
