// ==========================================================================
// Componente: Modal de Ajuste e Filtros de Imagem (App.ImageAdjustModal)
// ==========================================================================

window.App = window.App || {};

App.ImageAdjustModal = (function () {
  let modalEl = null;
  let adjustPreviewCanvas = null;
  let colorModeRadios = null;
  let thresholdSection = null;
  let thresholdSlider = null;
  let thresholdVal = null;
  let brightnessSlider = null;
  let brightnessVal = null;
  let contrastSlider = null;
  let contrastVal = null;
  let deskewSlider = null;
  let deskewVal = null;
  let cropTop = null;
  let cropBottom = null;
  let cropLeft = null;
  let cropRight = null;
  let btnResetAdjust = null;
  let btnApplyAdjust = null;

  let editingPageIndex = -1;

  function init() {
    modalEl = document.getElementById('modalImageAdjust');
    adjustPreviewCanvas = document.getElementById('adjustPreviewCanvas');
    colorModeRadios = document.querySelectorAll('input[name="colorMode"]');
    thresholdSection = document.getElementById('thresholdSection');
    thresholdSlider = document.getElementById('thresholdSlider');
    thresholdVal = document.getElementById('thresholdVal');
    brightnessSlider = document.getElementById('brightnessSlider');
    brightnessVal = document.getElementById('brightnessVal');
    contrastSlider = document.getElementById('contrastSlider');
    contrastVal = document.getElementById('contrastVal');
    deskewSlider = document.getElementById('deskewSlider');
    deskewVal = document.getElementById('deskewVal');
    cropTop = document.getElementById('cropTop');
    cropBottom = document.getElementById('cropBottom');
    cropLeft = document.getElementById('cropLeft');
    cropRight = document.getElementById('cropRight');
    btnResetAdjust = document.getElementById('btnResetAdjust');
    btnApplyAdjust = document.getElementById('btnApplyAdjust');

    // Eventos dos controles
    if (colorModeRadios) {
      colorModeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
          if (thresholdSection) {
            thresholdSection.style.display = e.target.value === 'bw' ? 'block' : 'none';
          }
          updatePreview();
        });
      });
    }

    if (thresholdSlider) {
      thresholdSlider.addEventListener('input', (e) => {
        if (thresholdVal) thresholdVal.textContent = e.target.value;
        updatePreview();
      });
    }

    if (brightnessSlider) {
      brightnessSlider.addEventListener('input', (e) => {
        if (brightnessVal) brightnessVal.textContent = e.target.value + '%';
        updatePreview();
      });
    }

    if (contrastSlider) {
      contrastSlider.addEventListener('input', (e) => {
        if (contrastVal) contrastVal.textContent = e.target.value + '%';
        updatePreview();
      });
    }

    if (deskewSlider) {
      deskewSlider.addEventListener('input', (e) => {
        if (deskewVal) deskewVal.textContent = e.target.value + '°';
        updatePreview();
      });
    }

    [cropTop, cropBottom, cropLeft, cropRight].forEach(input => {
      if (input) input.addEventListener('input', updatePreview);
    });

    if (btnResetAdjust) btnResetAdjust.addEventListener('click', resetValues);
    if (btnApplyAdjust) btnApplyAdjust.addEventListener('click', applyAdjustments);
  }

  function open(pageIndex) {
    const pages = App.State.getPages();
    if (pageIndex < 0 || pageIndex >= pages.length) return;
    editingPageIndex = pageIndex;
    const page = pages[pageIndex];

    const targetRadio = document.querySelector(`input[name="colorMode"][value="${page.colorMode}"]`);
    if (targetRadio) targetRadio.checked = true;

    if (thresholdSection) thresholdSection.style.display = page.colorMode === 'bw' ? 'block' : 'none';
    if (thresholdSlider) thresholdSlider.value = page.threshold;
    if (thresholdVal) thresholdVal.textContent = page.threshold;

    if (brightnessSlider) brightnessSlider.value = page.brightness;
    if (brightnessVal) brightnessVal.textContent = page.brightness + '%';

    if (contrastSlider) contrastSlider.value = page.contrast;
    if (contrastVal) contrastVal.textContent = page.contrast + '%';

    if (deskewSlider) deskewSlider.value = page.deskew;
    if (deskewVal) deskewVal.textContent = page.deskew + '°';

    if (cropTop) cropTop.value = page.crop.top;
    if (cropBottom) cropBottom.value = page.crop.bottom;
    if (cropLeft) cropLeft.value = page.crop.left;
    if (cropRight) cropRight.value = page.crop.right;

    updatePreview();
    if (modalEl) modalEl.style.display = 'flex';
  }

  function close() {
    if (modalEl) modalEl.style.display = 'none';
  }

  function updatePreview() {
    const pages = App.State.getPages();
    if (editingPageIndex < 0 || editingPageIndex >= pages.length) return;
    const page = pages[editingPageIndex];

    const checkedColor = document.querySelector('input[name="colorMode"]:checked');
    const colorMode = checkedColor ? checkedColor.value : 'original';
    const threshold = thresholdSlider ? parseInt(thresholdSlider.value, 10) : 128;
    const brightness = brightnessSlider ? parseInt(brightnessSlider.value, 10) : 0;
    const contrast = contrastSlider ? parseInt(contrastSlider.value, 10) : 0;
    const deskew = deskewSlider ? parseFloat(deskewSlider.value) : 0;
    const crop = {
      top: cropTop ? parseInt(cropTop.value, 10) || 0 : 0,
      bottom: cropBottom ? parseInt(cropBottom.value, 10) || 0 : 0,
      left: cropLeft ? parseInt(cropLeft.value, 10) || 0 : 0,
      right: cropRight ? parseInt(cropRight.value, 10) || 0 : 0
    };

    if (adjustPreviewCanvas && page.originalCanvas) {
      App.ImageService.renderFilteredCanvas(page.originalCanvas, adjustPreviewCanvas, {
        colorMode,
        threshold,
        brightness,
        contrast,
        deskew,
        crop,
        flipH: page.flipH,
        flipV: page.flipV,
        rotation: page.rotation
      });
    }
  }

  function resetValues() {
    const origRadio = document.querySelector('input[name="colorMode"][value="original"]');
    if (origRadio) origRadio.checked = true;

    if (thresholdSection) thresholdSection.style.display = 'none';
    if (thresholdSlider) thresholdSlider.value = 128;
    if (thresholdVal) thresholdVal.textContent = '128';

    if (brightnessSlider) brightnessSlider.value = 0;
    if (brightnessVal) brightnessVal.textContent = '0%';

    if (contrastSlider) contrastSlider.value = 0;
    if (contrastVal) contrastVal.textContent = '0%';

    if (deskewSlider) deskewSlider.value = 0;
    if (deskewVal) deskewVal.textContent = '0°';

    if (cropTop) cropTop.value = 0;
    if (cropBottom) cropBottom.value = 0;
    if (cropLeft) cropLeft.value = 0;
    if (cropRight) cropRight.value = 0;

    updatePreview();
  }

  function applyAdjustments() {
    const pages = App.State.getPages();
    if (editingPageIndex < 0 || editingPageIndex >= pages.length) return;

    const checkedColor = document.querySelector('input[name="colorMode"]:checked');
    const colorMode = checkedColor ? checkedColor.value : 'original';
    const threshold = thresholdSlider ? parseInt(thresholdSlider.value, 10) : 128;
    const brightness = brightnessSlider ? parseInt(brightnessSlider.value, 10) : 0;
    const contrast = contrastSlider ? parseInt(contrastSlider.value, 10) : 0;
    const deskew = deskewSlider ? parseFloat(deskewSlider.value) : 0;
    const crop = {
      top: cropTop ? parseInt(cropTop.value, 10) || 0 : 0,
      bottom: cropBottom ? parseInt(cropBottom.value, 10) || 0 : 0,
      left: cropLeft ? parseInt(cropLeft.value, 10) || 0 : 0,
      right: cropRight ? parseInt(cropRight.value, 10) || 0 : 0
    };

    const selected = App.State.getSelectedPages();
    const currentPage = pages[editingPageIndex];
    const targets = selected.length > 1 && selected.includes(currentPage) ? selected : [currentPage];

    targets.forEach(p => {
      p.colorMode = colorMode;
      p.threshold = threshold;
      p.brightness = brightness;
      p.contrast = contrast;
      p.deskew = deskew;
      p.crop = { ...crop };

      App.ImageService.renderFilteredCanvas(p.originalCanvas, p.processedCanvas, {
        colorMode,
        threshold,
        brightness,
        contrast,
        deskew,
        crop,
        flipH: p.flipH,
        flipV: p.flipV,
        rotation: p.rotation
      });

      p.thumbUrl = App.Utils.generateThumbnailDataUrl(p.processedCanvas);
    });

    App.State.emit('pagesChanged', pages);
    close();
    App.Utils.showToast(`Ajustes aplicados em ${targets.length} página(s)!`, 'success');
  }

  return {
    init,
    open,
    close,
    updatePreview
  };
})();
