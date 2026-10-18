// ==========================================================================
// Componente: Modal de Conversão Multiformato (App.ConverterModal)
// ==========================================================================

window.App = window.App || {};

App.ConverterModal = (function () {
  let modalEl = null;
  let convertTargetFormat = null;
  let convertScope = null;
  let convertOutputName = null;
  let btnExecute = null;
  let convertStatusWrapper = null;
  let convertProgressBar = null;
  let convertProgressStatus = null;

  function init() {
    modalEl = document.getElementById('modalConvertPdf');
    convertTargetFormat = document.getElementById('convertTargetFormat');
    convertScope = document.getElementById('convertScope');
    convertOutputName = document.getElementById('convertOutputName');
    btnExecute = document.getElementById('btnExecuteConversion');
    convertStatusWrapper = document.getElementById('convertStatusWrapper');
    convertProgressBar = document.getElementById('convertProgressBar');
    convertProgressStatus = document.getElementById('convertProgressStatus');

    if (btnExecute) {
      btnExecute.addEventListener('click', executeConversion);
    }
  }

  function open() {
    if (modalEl) modalEl.style.display = 'flex';
  }

  function close() {
    if (modalEl) modalEl.style.display = 'none';
  }

  function updateStatus(percent, text) {
    if (convertProgressBar) convertProgressBar.style.width = `${percent}%`;
    if (convertProgressStatus) convertProgressStatus.textContent = text;
  }

  async function executeConversion() {
    const format = convertTargetFormat ? convertTargetFormat.value : 'docx';
    const scope = convertScope ? convertScope.value : 'all';
    let baseName = convertOutputName ? convertOutputName.value.trim() : 'documento_convertido';
    if (!baseName) baseName = 'documento_convertido';
    baseName = baseName.replace(/\.[a-zA-Z0-9]+$/, '');

    const targetPages = scope === 'selected' ? App.State.getSelectedPages() : App.State.getPages();
    if (targetPages.length === 0) {
      App.Utils.showToast('Nenhuma página para converter com o filtro selecionado.', 'error');
      return;
    }

    if (convertStatusWrapper) convertStatusWrapper.style.display = 'block';
    updateStatus(15, 'Iniciando conversão para ' + format.toUpperCase() + '...');

    try {
      switch (format) {
        case 'docx':
          updateStatus(30, 'Estruturando documento Word (.docx)...');
          await App.ConversionService.convertToDocx(targetPages, baseName, (i, total) => {
            updateStatus(Math.round(30 + ((i + 1) / total) * 60), `Word: processando página ${i + 1} de ${total}...`);
          });
          break;

        case 'pptx':
          updateStatus(30, 'Gerando slides PowerPoint (.pptx)...');
          await App.ConversionService.convertToPptx(targetPages, baseName, (i, total) => {
            updateStatus(Math.round(30 + ((i + 1) / total) * 60), `PowerPoint: slide ${i + 1} de ${total}...`);
          });
          break;

        case 'xlsx':
          updateStatus(40, 'Processando dados para Excel (.xlsx)...');
          await App.ConversionService.convertToXlsx(targetPages, baseName);
          break;

        case 'images-png':
          updateStatus(30, 'Extraindo imagens PNG de alta resolução...');
          await App.ConversionService.convertToImagesZip(targetPages, baseName, 'png', (i, total) => {
            updateStatus(Math.round(30 + ((i + 1) / total) * 60), `PNG: página ${i + 1} de ${total}...`);
          });
          break;

        case 'images-jpg':
          updateStatus(30, 'Compactando imagens JPEG...');
          await App.ConversionService.convertToImagesZip(targetPages, baseName, 'jpg', (i, total) => {
            updateStatus(Math.round(30 + ((i + 1) / total) * 60), `JPG: página ${i + 1} de ${total}...`);
          });
          break;

        case 'txt':
          App.ConversionService.convertToTxt(targetPages, baseName);
          break;

        case 'md':
          App.ConversionService.convertToMarkdown(targetPages, baseName);
          break;

        case 'html':
          App.ConversionService.convertToHtml(targetPages, baseName);
          break;

        default:
          throw new Error('Formato não suportado: ' + format);
      }

      updateStatus(100, 'Conversão concluída!');
      App.Utils.showToast(`Conversão para ${format.toUpperCase()} concluída com sucesso!`, 'success');
      close();
    } catch (err) {
      console.error('Erro na conversão:', err);
      App.Utils.showToast('Erro ao converter documento: ' + err.message, 'error');
    } finally {
      setTimeout(() => {
        if (convertStatusWrapper) convertStatusWrapper.style.display = 'none';
        updateStatus(0, '');
      }, 1500);
    }
  }

  return {
    init,
    open,
    close,
    executeConversion
  };
})();
