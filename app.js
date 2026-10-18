// ==========================================================================
// PDF Studio Web - Motor NAPS2 Completo (Client-Side & Offline)
// ==========================================================================

// Configuração do Worker do PDF.js
if (window.pdfjsLib) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdf.worker.min.js';
  } catch (e) {
    console.warn('PDF.js worker setup:', e);
  }
}

// ==========================================================================
// Estado Global da Aplicação (Páginas Individuais no estilo NAPS2)
// ==========================================================================
let pages = []; 
// Estrutura de cada página:
// {
//   id: string,
//   sourceName: string,
//   sourceType: string,
//   originalCanvas: HTMLCanvasElement,
//   processedCanvas: HTMLCanvasElement,
//   thumbUrl: string,
//   width: number,
//   height: number,
//   rotation: number,      // 0, 90, 180, 270
//   flipH: boolean,
//   flipV: boolean,
//   colorMode: string,     // 'original', 'grayscale', 'bw', 'invert'
//   threshold: number,     // 30..220
//   brightness: number,    // -100..100
//   contrast: number,      // -100..100
//   deskew: number,        // -25..25 deg
//   crop: { top: 0, bottom: 0, left: 0, right: 0 },
//   selected: boolean,
//   text: string
// }

let sortableGrid = null;
let activeCameraStream = null;
let editingPageIndex = -1;

// ==========================================================================
// Elementos do DOM
// ==========================================================================
// Ribbon
const btnScan = document.getElementById('btnScan');
const btnImport = document.getElementById('btnImport');
const hiddenFileInput = document.getElementById('hiddenFileInput');
const btnSavePdf = document.getElementById('btnSavePdf');
const btnSaveImages = document.getElementById('btnSaveImages');
const btnPrint = document.getElementById('btnPrint');
const btnShare = document.getElementById('btnShare');
const btnImageAdjust = document.getElementById('btnImageAdjust');
const btnOcr = document.getElementById('btnOcr');
const btnBatchSplit = document.getElementById('btnBatchSplit');

// Barra secundária
const btnRotateRight = document.getElementById('btnRotateRight');
const btnRotateLeft = document.getElementById('btnRotateLeft');
const btnRotate180 = document.getElementById('btnRotate180');
const btnFlipH = document.getElementById('btnFlipH');
const btnFlipV = document.getElementById('btnFlipV');
const btnInterleave = document.getElementById('btnInterleave');
const btnDeinterleave = document.getElementById('btnDeinterleave');
const btnReverse = document.getElementById('btnReverse');
const btnMoveUp = document.getElementById('btnMoveUp');
const btnMoveDown = document.getElementById('btnMoveDown');
const btnDuplicate = document.getElementById('btnDuplicate');
const btnDeleteSelected = document.getElementById('btnDeleteSelected');
const zoomRange = document.getElementById('zoomRange');

// Seleção e Status
const pageCountText = document.getElementById('pageCountText');
const selectionCountText = document.getElementById('selectionCountText');
const btnSelectAll = document.getElementById('btnSelectAll');
const btnDeselectAll = document.getElementById('btnDeselectAll');
const btnInvertSelection = document.getElementById('btnInvertSelection');
const btnClearAllPages = document.getElementById('btnClearAllPages');

// Grade e Estados
const emptyState = document.getElementById('emptyState');
const pageGrid = document.getElementById('pageGrid');
const btnEmptyScan = document.getElementById('btnEmptyScan');
const btnEmptyBrowse = document.getElementById('btnEmptyBrowse');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const progressStatus = document.getElementById('progressStatus');
const toastEl = document.getElementById('toast');
const offscreenRenderer = document.getElementById('offscreenRenderer');

// Modais
const modalScan = document.getElementById('modalScan');
const modalImageAdjust = document.getElementById('modalImageAdjust');
const modalSavePdf = document.getElementById('modalSavePdf');
const modalOcr = document.getElementById('modalOcr');
const modalBatchSplit = document.getElementById('modalBatchSplit');

// Câmera / Scanner
const scanVideo = document.getElementById('scanVideo');
const scanCameraSelect = document.getElementById('scanCameraSelect');
const scanProfileSelect = document.getElementById('scanProfileSelect');
const btnCaptureScan = document.getElementById('btnCaptureScan');

// Ajuste de Imagem
const adjustPreviewCanvas = document.getElementById('adjustPreviewCanvas');
const colorModeRadios = document.querySelectorAll('input[name="colorMode"]');
const thresholdSection = document.getElementById('thresholdSection');
const thresholdSlider = document.getElementById('thresholdSlider');
const thresholdVal = document.getElementById('thresholdVal');
const brightnessSlider = document.getElementById('brightnessSlider');
const brightnessVal = document.getElementById('brightnessVal');
const contrastSlider = document.getElementById('contrastSlider');
const contrastVal = document.getElementById('contrastVal');
const deskewSlider = document.getElementById('deskewSlider');
const deskewVal = document.getElementById('deskewVal');
const cropTop = document.getElementById('cropTop');
const cropBottom = document.getElementById('cropBottom');
const cropLeft = document.getElementById('cropLeft');
const cropRight = document.getElementById('cropRight');
const btnResetAdjust = document.getElementById('btnResetAdjust');
const btnApplyAdjust = document.getElementById('btnApplyAdjust');

// ==========================================================================
// Inicialização
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  setupRibbonEvents();
  setupPageActionEvents();
  setupDragAndDrop();
  setupModalDismissals();
  setupKeyboardShortcuts();
  initGridSortable();
  setupZoomControl();
});

// ==========================================================================
// Configuração de Eventos da Ribbon Principal
// ==========================================================================
function setupRibbonEvents() {
  btnImport.addEventListener('click', () => hiddenFileInput.click());
  btnEmptyBrowse.addEventListener('click', () => hiddenFileInput.click());

  hiddenFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      importFiles(Array.from(e.target.files));
      hiddenFileInput.value = '';
    }
  });

  btnScan.addEventListener('click', openScannerModal);
  btnEmptyScan.addEventListener('click', openScannerModal);
  btnCaptureScan.addEventListener('click', captureScanFrame);

  btnSavePdf.addEventListener('click', () => {
    if (pages.length === 0) {
      showToast('Nenhuma página para salvar.', 'error');
      return;
    }
    openModal(modalSavePdf);
  });

  document.getElementById('btnConfirmSavePdf').addEventListener('click', executeSavePdf);

  btnSaveImages.addEventListener('click', executeSaveImages);
  btnPrint.addEventListener('click', executePrintPages);
  btnShare.addEventListener('click', executeShareDocument);

  btnImageAdjust.addEventListener('click', () => {
    const selected = getSelectedPages();
    if (selected.length === 0 && pages.length === 0) {
      showToast('Nenhuma página selecionada para ajuste.', 'error');
      return;
    }
    const targetIndex = selected.length > 0 ? pages.indexOf(selected[0]) : 0;
    openImageAdjustModal(targetIndex);
  });

  btnOcr.addEventListener('click', () => {
    if (pages.length === 0) {
      showToast('Importe documentos ou fotos para realizar OCR.', 'error');
      return;
    }
    openModal(modalOcr);
  });

  btnBatchSplit.addEventListener('click', () => {
    if (pages.length === 0) {
      showToast('Nenhuma página disponível para divisão.', 'error');
      return;
    }
    openModal(modalBatchSplit);
  });

  document.getElementById('btnConfirmBatchSplit').addEventListener('click', executeBatchSplit);
  document.getElementById('btnStartOcr').addEventListener('click', executeOcr);
  document.getElementById('btnCopyOcrText').addEventListener('click', () => {
    const text = document.getElementById('ocrResultText').value;
    navigator.clipboard.writeText(text);
    showToast('Texto copiado para a área de transferência!', 'success');
  });
  document.getElementById('btnDownloadOcrTxt').addEventListener('click', () => {
    const text = document.getElementById('ocrResultText').value;
    downloadBlob(new Blob([text], { type: 'text/plain;charset=utf-8' }), 'ocr_texto.txt');
  });
}

// ==========================================================================
// Configuração da Barra Secundária de Operações com Páginas
// ==========================================================================
function setupPageActionEvents() {
  btnRotateRight.addEventListener('click', () => rotateSelectedPages(90));
  btnRotateLeft.addEventListener('click', () => rotateSelectedPages(-90));
  btnRotate180.addEventListener('click', () => rotateSelectedPages(180));
  btnFlipH.addEventListener('click', () => flipSelectedPages('H'));
  btnFlipV.addEventListener('click', () => flipSelectedPages('V'));

  btnInterleave.addEventListener('click', executeInterleave);
  btnDeinterleave.addEventListener('click', executeDeinterleave);
  btnReverse.addEventListener('click', executeReverseOrder);

  btnMoveUp.addEventListener('click', () => moveSelectedPages(-1));
  btnMoveDown.addEventListener('click', () => moveSelectedPages(1));
  btnDuplicate.addEventListener('click', duplicateSelectedPages);
  btnDeleteSelected.addEventListener('click', deleteSelectedPages);

  btnSelectAll.addEventListener('click', () => selectAllPages(true));
  btnDeselectAll.addEventListener('click', () => selectAllPages(false));
  btnInvertSelection.addEventListener('click', invertPageSelection);
  btnClearAllPages.addEventListener('click', clearAllPages);
}

// Zoom da Grade de Miniaturas
function setupZoomControl() {
  zoomRange.addEventListener('input', (e) => {
    const size = e.target.value + 'px';
    document.documentElement.style.setProperty('--thumb-size', size);
  });
}

// Drag & Drop na Janela e no EmptyState
function setupDragAndDrop() {
  ['dragenter', 'dragover'].forEach(name => {
    window.addEventListener(name, (e) => {
      e.preventDefault();
      emptyState.classList.add('drag-over');
    }, false);
  });

  ['dragleave', 'drop'].forEach(name => {
    window.addEventListener(name, (e) => {
      e.preventDefault();
      emptyState.classList.remove('drag-over');
    }, false);
  });

  window.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      importFiles(Array.from(e.dataTransfer.files));
    }
  });
}

// Atalhos de Teclado NAPS2
function setupKeyboardShortcuts() {
  window.addEventListener('keydown', (e) => {
    // Não interferir se estiver digitando em um input
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

    if (e.key === 'Delete' || e.key === 'Del') {
      deleteSelectedPages();
    } else if (e.ctrlKey && e.key.toLowerCase() === 'a') {
      e.preventDefault();
      selectAllPages(true);
    } else if (e.ctrlKey && e.key.toLowerCase() === 's') {
      e.preventDefault();
      if (pages.length > 0) openModal(modalSavePdf);
    } else if (e.ctrlKey && e.key.toLowerCase() === 'p') {
      e.preventDefault();
      if (pages.length > 0) executePrintPages();
    }
  });
}

// Inicializa SortableJS para a grade de páginas
function initGridSortable() {
  if (!window.Sortable) return;
  sortableGrid = new Sortable(pageGrid, {
    animation: 200,
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    onEnd: () => syncPagesFromDOM()
  });
}

function syncPagesFromDOM() {
  const cards = pageGrid.querySelectorAll('.naps-page-card');
  const newOrder = [];
  cards.forEach(card => {
    const id = card.dataset.id;
    const item = pages.find(p => p.id === id);
    if (item) newOrder.push(item);
  });
  pages = newOrder;
  updatePageNumbers();
}

// ==========================================================================
// IMPORTAÇÃO DE ARQUIVOS (Desempacotamento por Páginas)
// ==========================================================================
async function importFiles(fileList) {
  if (fileList.length === 0) return;

  progressContainer.style.display = 'flex';
  updateProgress(5, `Importando ${fileList.length} arquivo(s)...`);

  try {
    for (let f = 0; f < fileList.length; f++) {
      const file = fileList[f];
      const name = file.name.toLowerCase();
      const progressPercent = Math.round(10 + ((f + 1) / fileList.length) * 80);
      updateProgress(progressPercent, `Processando: ${file.name}...`);

      if (name.endsWith('.pdf') || file.type === 'application/pdf') {
        await unpackPdfPages(file);
      } else if (name.endsWith('.docx') || name.endsWith('.doc')) {
        await unpackDocxPages(file);
      } else if (name.endsWith('.txt') || file.type === 'text/plain') {
        await unpackTxtPages(file);
      } else if (file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|bmp|gif)$/i.test(name)) {
        await unpackImagePage(file);
      }
    }

    renderGrid();
    updateUIState();
    showToast(`${pages.length} página(s) carregada(s) no total.`, 'success');
  } catch (err) {
    console.error('Falha na importação:', err);
    showToast('Erro ao importar arquivos: ' + err.message, 'error');
  } finally {
    setTimeout(() => {
      progressContainer.style.display = 'none';
      progressBar.style.width = '0%';
    }, 1500);
  }
}

// Desempacota cada página do PDF em um canvas independente
async function unpackPdfPages(file) {
  const buffer = await file.arrayBuffer();
  const pdfDoc = await pdfjsLib.getDocument({ data: buffer.slice(0) }).promise;

  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale: 1.5 }); // Escala nítida
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');

    await page.render({ canvasContext: ctx, viewport }).promise;

    // Tentar extrair texto da página
    let text = '';
    try {
      const textContent = await page.getTextContent();
      text = textContent.items.map(item => item.str).join(' ');
    } catch (e) {}

    addPageRecord(canvas, file.name, 'pdf', text);
  }
}

// Desempacota imagem individual
async function unpackImagePage(file) {
  const canvas = await fileToCanvas(file);
  addPageRecord(canvas, file.name, 'img', '');
}

// Desempacota documento DOCX renderizando em páginas A4
async function unpackDocxPages(file) {
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

  // Paginação A4 proporcional (1 : 1.414)
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

    addPageRecord(pageCanvas, file.name, 'docx', '');
  }
}

// Desempacota arquivo TXT formatado em páginas A4
async function unpackTxtPages(file) {
  const text = await file.text();
  offscreenRenderer.innerHTML = `
    <div style="font-family: 'Courier New', monospace; font-size: 13pt; line-height: 1.5; white-space: pre-wrap; color: #111;">
      ${escapeHtml(text)}
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

    addPageRecord(pageCanvas, file.name, 'txt', text);
  }
}

// Cria e registra o objeto da página na lista principal
function addPageRecord(canvas, sourceName, sourceType, text = '') {
  const id = 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
  const clonedCanvas = cloneCanvas(canvas);

  const page = {
    id,
    sourceName,
    sourceType,
    originalCanvas: canvas,
    processedCanvas: clonedCanvas,
    thumbUrl: generateThumbnailDataUrl(clonedCanvas),
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
    text
  };

  pages.push(page);
}

// ==========================================================================
// RENDERIZAÇÃO DA GRADE VISUAL DE PÁGINAS (NAPS2 PAGE GRID)
// ==========================================================================
function renderGrid() {
  pageGrid.innerHTML = '';

  if (pages.length === 0) {
    emptyState.style.display = 'flex';
    pageGrid.style.display = 'none';
  } else {
    emptyState.style.display = 'none';
    pageGrid.style.display = 'grid';
  }

  pages.forEach((page, index) => {
    const card = document.createElement('div');
    card.className = `naps-page-card ${page.selected ? 'selected' : ''}`;
    card.dataset.id = page.id;

    // Transformação CSS para rotação e espelhamento
    const scaleX = page.flipH ? -1 : 1;
    const scaleY = page.flipV ? -1 : 1;
    const transformStyle = `transform: rotate(${page.rotation}deg) scale(${scaleX}, ${scaleY});`;

    card.innerHTML = `
      <div class="page-card-header">
        <span class="page-num-badge">#${index + 1}</span>
        <input type="checkbox" class="page-select-checkbox" ${page.selected ? 'checked' : ''}>
      </div>
      <div class="page-thumb-container" title="Clique duplo para editar imagem e filtros">
        <img src="${page.thumbUrl}" alt="Página ${index + 1}" style="${transformStyle}">
      </div>
      <div class="page-card-footer">
        <span class="page-source-name" title="${escapeHtml(page.sourceName)}">${escapeHtml(page.sourceName)}</span>
        <span class="page-dims">${page.width}x${page.height} px</span>
      </div>
    `;

    // Seleção com clique ou Shift+Click
    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('page-select-checkbox')) return;
      togglePageSelection(page, e.shiftKey || e.ctrlKey);
    });

    // Checkbox de seleção
    const checkbox = card.querySelector('.page-select-checkbox');
    checkbox.addEventListener('change', (e) => {
      page.selected = e.target.checked;
      card.classList.toggle('selected', page.selected);
      updateSelectionStats();
    });

    // Clique duplo para abrir editor de imagem da página
    card.addEventListener('dblclick', () => {
      openImageAdjustModal(index);
    });

    pageGrid.appendChild(card);
  });

  updateSelectionStats();
}

function updatePageNumbers() {
  const cards = pageGrid.querySelectorAll('.naps-page-card');
  cards.forEach((card, index) => {
    const badge = card.querySelector('.page-num-badge');
    if (badge) badge.textContent = `#${index + 1}`;
  });
  updateSelectionStats();
}

function togglePageSelection(page, isMulti) {
  if (!isMulti) {
    pages.forEach(p => p.selected = false);
    page.selected = true;
  } else {
    page.selected = !page.selected;
  }
  renderGrid();
}

function selectAllPages(isSelected) {
  pages.forEach(p => p.selected = isSelected);
  renderGrid();
}

function invertPageSelection() {
  pages.forEach(p => p.selected = !p.selected);
  renderGrid();
}

function clearAllPages() {
  if (pages.length === 0) return;
  if (confirm('Deseja realmente remover todas as páginas do projeto?')) {
    pages = [];
    renderGrid();
    updateUIState();
    showToast('Todas as páginas foram removidas.', 'default');
  }
}

function getSelectedPages() {
  return pages.filter(p => p.selected);
}

function getActivePages() {
  const selected = getSelectedPages();
  return selected.length > 0 ? selected : pages;
}

function updateSelectionStats() {
  const total = pages.length;
  const selected = getSelectedPages().length;

  pageCountText.innerHTML = `<strong>${total}</strong> página(s) no documento`;
  selectionCountText.textContent = selected === 0 ? 'Nenhuma selecionada' : `${selected} selecionada(s)`;
}

function updateUIState() {
  updateSelectionStats();
}

// ==========================================================================
// OPERAÇÕES COM PÁGINAS (Girar, Espelhar, Intercalar, Mover, Duplicar, Excluir)
// ==========================================================================
function rotateSelectedPages(degrees) {
  const targets = getActivePages();
  if (targets.length === 0) return;

  targets.forEach(p => {
    p.rotation = (p.rotation + degrees + 360) % 360;
  });
  renderGrid();
  showToast(`Páginas rotacionadas em ${degrees > 0 ? '+' : ''}${degrees}°.`, 'default');
}

function flipSelectedPages(direction) {
  const targets = getActivePages();
  if (targets.length === 0) return;

  targets.forEach(p => {
    if (direction === 'H') p.flipH = !p.flipH;
    if (direction === 'V') p.flipV = !p.flipV;
  });
  renderGrid();
  showToast(`Espelhado ${direction === 'H' ? 'horizontalmente' : 'verticalmente'}.`, 'default');
}

function moveSelectedPages(direction) {
  const selected = getSelectedPages();
  if (selected.length === 0) return;

  if (direction < 0) {
    // Mover para cima/esquerda
    for (let i = 0; i < pages.length; i++) {
      if (pages[i].selected && i > 0 && !pages[i - 1].selected) {
        const temp = pages[i];
        pages[i] = pages[i - 1];
        pages[i - 1] = temp;
      }
    }
  } else {
    // Mover para baixo/direita
    for (let i = pages.length - 1; i >= 0; i--) {
      if (pages[i].selected && i < pages.length - 1 && !pages[i + 1].selected) {
        const temp = pages[i];
        pages[i] = pages[i + 1];
        pages[i + 1] = temp;
      }
    }
  }
  renderGrid();
}

function duplicateSelectedPages() {
  const selected = getSelectedPages();
  if (selected.length === 0) {
    showToast('Selecione as páginas que deseja duplicar.', 'error');
    return;
  }

  const newPages = [];
  pages.forEach(page => {
    newPages.push(page);
    if (page.selected) {
      const cloned = {
        ...page,
        id: 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8),
        originalCanvas: cloneCanvas(page.originalCanvas),
        processedCanvas: cloneCanvas(page.processedCanvas),
        selected: false
      };
      newPages.push(cloned);
    }
  });

  pages = newPages;
  renderGrid();
  showToast(`${selected.length} página(s) duplicada(s).`, 'success');
}

function deleteSelectedPages() {
  const selected = getSelectedPages();
  if (selected.length === 0) {
    showToast('Selecione as páginas que deseja excluir.', 'error');
    return;
  }

  if (confirm(`Excluir as ${selected.length} página(s) selecionada(s)?`)) {
    pages = pages.filter(p => !p.selected);
    renderGrid();
    updateUIState();
    showToast('Páginas excluídas.', 'default');
  }
}

function executeReverseOrder() {
  const selected = getSelectedPages();
  if (selected.length > 1) {
    // Inverter apenas as selecionadas mantendo as posições
    const indices = [];
    pages.forEach((p, idx) => { if (p.selected) indices.push(idx); });
    const reversed = indices.slice().reverse();
    const clonedPages = pages.slice();
    indices.forEach((origIdx, i) => {
      pages[origIdx] = clonedPages[reversed[i]];
    });
  } else {
    // Inverter todas
    pages.reverse();
  }
  renderGrid();
  showToast('Ordem das páginas invertida!', 'default');
}

// Recurso Assinatura NAPS2: Intercalar Duplex Manual
// Combina pilha 1 (frente: 1, 3, 5) com pilha 2 (verso: 2, 4, 6 ou 6, 4, 2)
function executeInterleave() {
  if (pages.length < 2) {
    showToast('São necessárias pelo menos 2 páginas para intercalar.', 'error');
    return;
  }

  const isReverseBack = confirm(
    'A segunda metade das páginas foi digitalizada na ordem inversa (ex: última página primeiro)?\n\n' +
    'Clique em "OK" para inverter o verso automaticamente, ou "Cancelar" se já estiver na ordem direta.'
  );

  const half = Math.ceil(pages.length / 2);
  const frontStack = pages.slice(0, half);
  let backStack = pages.slice(half);

  if (isReverseBack) {
    backStack.reverse();
  }

  const interleaved = [];
  const maxLen = Math.max(frontStack.length, backStack.length);

  for (let i = 0; i < maxLen; i++) {
    if (i < frontStack.length) interleaved.push(frontStack[i]);
    if (i < backStack.length) interleaved.push(backStack[i]);
  }

  pages = interleaved;
  renderGrid();
  showToast('Páginas duplex intercaladas com sucesso!', 'success');
}

// Desintercalar: Separa páginas ímpares e pares (1, 3, 5... depois 2, 4, 6...)
function executeDeinterleave() {
  if (pages.length < 2) return;

  const odds = [];
  const evens = [];

  pages.forEach((p, idx) => {
    if (idx % 2 === 0) odds.push(p);
    else evens.push(p);
  });

  pages = odds.concat(evens);
  renderGrid();
  showToast('Páginas desintercaladas (ímpares e pares separadas).', 'default');
}

// ==========================================================================
// DIGITALIZADOR COM A CÂMERA (SCANNER)
// ==========================================================================
async function openScannerModal() {
  openModal(modalScan);

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(d => d.kind === 'videoinput');

    scanCameraSelect.innerHTML = '';
    videoDevices.forEach((device, i) => {
      const opt = document.createElement('option');
      opt.value = device.deviceId;
      opt.textContent = device.label || `Câmera ${i + 1}`;
      scanCameraSelect.appendChild(opt);
    });

    startCameraStream();
  } catch (err) {
    console.warn('Erro ao listar câmeras:', err);
    startCameraStream();
  }
}

async function startCameraStream() {
  if (activeCameraStream) {
    activeCameraStream.getTracks().forEach(t => t.stop());
  }

  const deviceId = scanCameraSelect.value;
  const constraints = {
    video: {
      deviceId: deviceId ? { exact: deviceId } : undefined,
      facingMode: deviceId ? undefined : 'environment',
      width: { ideal: 1920 },
      height: { ideal: 1080 }
    }
  };

  try {
    activeCameraStream = await navigator.mediaDevices.getUserMedia(constraints);
    scanVideo.srcObject = activeCameraStream;
  } catch (err) {
    console.error('Falha ao acessar câmera:', err);
    showToast('Não foi possível acessar a câmera. Verifique as permissões.', 'error');
  }
}

scanCameraSelect.addEventListener('change', startCameraStream);

function captureScanFrame() {
  if (!activeCameraStream) return;

  const canvas = document.getElementById('scanCaptureCanvas');
  canvas.width = scanVideo.videoWidth || 1280;
  canvas.height = scanVideo.videoHeight || 720;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(scanVideo, 0, 0, canvas.width, canvas.height);

  // Aplicar perfil selecionado
  const profile = scanProfileSelect.value;
  const processed = cloneCanvas(canvas);

  if (profile === 'bw') {
    applyPixelFilters(processed, { colorMode: 'bw', threshold: 120, brightness: 10, contrast: 20 });
  } else if (profile === 'gray') {
    applyPixelFilters(processed, { colorMode: 'grayscale', threshold: 128, brightness: 0, contrast: 0 });
  }

  addPageRecord(processed, `Digitalização_${Date.now()}`, 'scan', '');
  renderGrid();
  updateUIState();
  showToast('Página capturada e adicionada!', 'success');
}

function stopCameraStream() {
  if (activeCameraStream) {
    activeCameraStream.getTracks().forEach(t => t.stop());
    activeCameraStream = null;
  }
}

// ==========================================================================
// EDITOR DE IMAGEM & TRATAMENTO NAPS2 (Brilho, Contraste, P&B Threshold, Deskew, Crop)
// ==========================================================================
function openImageAdjustModal(pageIndex) {
  if (pageIndex < 0 || pageIndex >= pages.length) return;
  editingPageIndex = pageIndex;
  const page = pages[pageIndex];

  // Carregar valores da página nos inputs
  document.querySelector(`input[name="colorMode"][value="${page.colorMode}"]`).checked = true;
  thresholdSection.style.display = page.colorMode === 'bw' ? 'block' : 'none';
  thresholdSlider.value = page.threshold;
  thresholdVal.textContent = page.threshold;

  brightnessSlider.value = page.brightness;
  brightnessVal.textContent = page.brightness + '%';

  contrastSlider.value = page.contrast;
  contrastVal.textContent = page.contrast + '%';

  deskewSlider.value = page.deskew;
  deskewVal.textContent = page.deskew + '°';

  cropTop.value = page.crop.top;
  cropBottom.value = page.crop.bottom;
  cropLeft.value = page.crop.left;
  cropRight.value = page.crop.right;

  updateAdjustPreview();
  openModal(modalImageAdjust);
}

function updateAdjustPreview() {
  if (editingPageIndex < 0 || editingPageIndex >= pages.length) return;
  const page = pages[editingPageIndex];

  const colorMode = document.querySelector('input[name="colorMode"]:checked').value;
  const threshold = parseInt(thresholdSlider.value, 10);
  const brightness = parseInt(brightnessSlider.value, 10);
  const contrast = parseInt(contrastSlider.value, 10);
  const deskew = parseFloat(deskewSlider.value);
  const crop = {
    top: parseInt(cropTop.value, 10) || 0,
    bottom: parseInt(cropBottom.value, 10) || 0,
    left: parseInt(cropLeft.value, 10) || 0,
    right: parseInt(cropRight.value, 10) || 0
  };

  // Renderiza prévia a partir do originalCanvas
  renderFilteredCanvas(page.originalCanvas, adjustPreviewCanvas, {
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

// Eventos dos sliders do editor de imagem
colorModeRadios.forEach(radio => {
  radio.addEventListener('change', (e) => {
    thresholdSection.style.display = e.target.value === 'bw' ? 'block' : 'none';
    updateAdjustPreview();
  });
});

thresholdSlider.addEventListener('input', (e) => {
  thresholdVal.textContent = e.target.value;
  updateAdjustPreview();
});

brightnessSlider.addEventListener('input', (e) => {
  brightnessVal.textContent = e.target.value + '%';
  updateAdjustPreview();
});

contrastSlider.addEventListener('input', (e) => {
  contrastVal.textContent = e.target.value + '%';
  updateAdjustPreview();
});

deskewSlider.addEventListener('input', (e) => {
  deskewVal.textContent = e.target.value + '°';
  updateAdjustPreview();
});

[cropTop, cropBottom, cropLeft, cropRight].forEach(input => {
  input.addEventListener('input', updateAdjustPreview);
});

btnResetAdjust.addEventListener('click', () => {
  document.querySelector('input[name="colorMode"][value="original"]').checked = true;
  thresholdSection.style.display = 'none';
  thresholdSlider.value = 128;
  thresholdVal.textContent = '128';
  brightnessSlider.value = 0;
  brightnessVal.textContent = '0%';
  contrastSlider.value = 0;
  contrastVal.textContent = '0%';
  deskewSlider.value = 0;
  deskewVal.textContent = '0°';
  cropTop.value = 0;
  cropBottom.value = 0;
  cropLeft.value = 0;
  cropRight.value = 0;
  updateAdjustPreview();
});

btnApplyAdjust.addEventListener('click', () => {
  if (editingPageIndex < 0 || editingPageIndex >= pages.length) return;

  const colorMode = document.querySelector('input[name="colorMode"]:checked').value;
  const threshold = parseInt(thresholdSlider.value, 10);
  const brightness = parseInt(brightnessSlider.value, 10);
  const contrast = parseInt(contrastSlider.value, 10);
  const deskew = parseFloat(deskewSlider.value);
  const crop = {
    top: parseInt(cropTop.value, 10) || 0,
    bottom: parseInt(cropBottom.value, 10) || 0,
    left: parseInt(cropLeft.value, 10) || 0,
    right: parseInt(cropRight.value, 10) || 0
  };

  // Se houver mais de uma página selecionada, aplica a todas as selecionadas!
  const selected = getSelectedPages();
  const targets = selected.length > 1 && selected.includes(pages[editingPageIndex]) ? selected : [pages[editingPageIndex]];

  targets.forEach(p => {
    p.colorMode = colorMode;
    p.threshold = threshold;
    p.brightness = brightness;
    p.contrast = contrast;
    p.deskew = deskew;
    p.crop = { ...crop };

    // Regenera processedCanvas
    renderFilteredCanvas(p.originalCanvas, p.processedCanvas, {
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

    p.thumbUrl = generateThumbnailDataUrl(p.processedCanvas);
  });

  renderGrid();
  closeModal(modalImageAdjust);
  showToast(`Ajustes aplicados em ${targets.length} página(s)!`, 'success');
});

// Algoritmo de Filtros e Renderização em Canvas (Pixel-Level Processing)
function renderFilteredCanvas(sourceCanvas, targetCanvas, options) {
  const { colorMode, threshold, brightness, contrast, deskew, crop, flipH, flipV, rotation } = options;

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

  // Dimensiona o canvas final
  targetCanvas.width = cropW;
  targetCanvas.height = cropH;
  const ctx = targetCanvas.getContext('2d');
  ctx.drawImage(intermediate, 0, 0);

  // 2. Manipulação de Pixels (Brilho, Contraste, P&B Threshold, Tons de Cinza)
  applyPixelFilters(targetCanvas, { colorMode, threshold, brightness, contrast });
}

function applyPixelFilters(canvas, { colorMode, threshold, brightness, contrast }) {
  if (colorMode === 'original' && brightness === 0 && contrast === 0) return;

  const ctx = canvas.getContext('2d');
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = imgData.data;

  // Pré-cálculo do fator de contraste
  const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  const brightnessOffset = brightness * 2.55;

  for (let i = 0; i < d.length; i += 4) {
    let r = d[i];
    let g = d[i + 1];
    let b = d[i + 2];

    // Brilho
    if (brightness !== 0) {
      r += brightnessOffset;
      g += brightnessOffset;
      b += brightnessOffset;
    }

    // Contraste
    if (contrast !== 0) {
      r = contrastFactor * (r - 128) + 128;
      g = contrastFactor * (g - 128) + 128;
      b = contrastFactor * (b - 128) + 128;
    }

    // Modo de Cor
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

// ==========================================================================
// SALVAR PDF (OPÇÕES, METADADOS & EXPORTAÇÃO)
// ==========================================================================
async function executeSavePdf() {
  const scope = document.getElementById('pdfExportScope').value;
  const layout = document.getElementById('pdfPageLayout').value;
  let filename = document.getElementById('pdfFileName').value.trim() || 'documento_naps2';
  if (!filename.toLowerCase().endsWith('.pdf')) filename += '.pdf';

  const targetPages = scope === 'selected' ? getSelectedPages() : pages;
  if (targetPages.length === 0) {
    showToast('Nenhuma página para exportar com o filtro selecionado.', 'error');
    return;
  }

  closeModal(modalSavePdf);
  progressContainer.style.display = 'flex';
  updateProgress(10, 'Iniciando criação do PDF unificado...');

  try {
    const pdfLib = window.PDFLib || self.PDFLib;
    const { PDFDocument, degrees } = pdfLib;
    const pdfDoc = await PDFDocument.create();

    // Metadados NAPS2
    const metaTitle = document.getElementById('pdfMetaTitle').value.trim();
    const metaAuthor = document.getElementById('pdfMetaAuthor').value.trim();
    const metaSubject = document.getElementById('pdfMetaSubject').value.trim();
    if (metaTitle) pdfDoc.setTitle(metaTitle);
    if (metaAuthor) pdfDoc.setAuthor(metaAuthor);
    if (metaSubject) pdfDoc.setSubject(metaSubject);
    pdfDoc.setCreator('PDF Studio Web (NAPS2 Edition)');

    const a4Width = 595.28;
    const a4Height = 841.89;

    for (let i = 0; i < targetPages.length; i++) {
      const page = targetPages[i];
      const percent = Math.round(15 + ((i + 1) / targetPages.length) * 75);
      updateProgress(percent, `Renderizando página ${i + 1} de ${targetPages.length}...`);

      const imgBytes = await canvasToJpegBytes(page.processedCanvas, 0.92);
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

    updateProgress(95, 'Compactando documento...');
    const pdfBytes = await pdfDoc.save();
    downloadBlob(new Blob([pdfBytes], { type: 'application/pdf' }), filename);
    showToast('PDF gerado e baixado com sucesso!', 'success');
  } catch (err) {
    console.error('Erro ao salvar PDF:', err);
    showToast('Erro ao salvar PDF: ' + err.message, 'error');
  } finally {
    setTimeout(() => {
      progressContainer.style.display = 'none';
      progressBar.style.width = '0%';
    }, 1500);
  }
}

// ==========================================================================
// SALVAR IMAGENS (ZIP) & IMPRIMIR
// ==========================================================================
async function executeSaveImages() {
  const targetPages = getActivePages();
  if (targetPages.length === 0) return;

  progressContainer.style.display = 'flex';
  updateProgress(10, 'Compactando páginas em imagens...');

  try {
    const zip = new JSZip();

    for (let i = 0; i < targetPages.length; i++) {
      const page = targetPages[i];
      updateProgress(Math.round(15 + ((i + 1) / targetPages.length) * 80), `Processando imagem ${i + 1}...`);

      const dataUrl = page.processedCanvas.toDataURL('image/jpeg', 0.95);
      const b64 = dataUrl.split(',')[1];
      const filename = `pagina_${String(i + 1).padStart(3, '0')}.jpg`;
      zip.file(filename, b64, { base64: true });
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipBlob, 'paginas_exportadas.zip');
    showToast('Imagens exportadas em arquivo ZIP!', 'success');
  } catch (err) {
    console.error(err);
    showToast('Erro ao exportar imagens: ' + err.message, 'error');
  } finally {
    setTimeout(() => {
      progressContainer.style.display = 'none';
      progressBar.style.width = '0%';
    }, 1500);
  }
}

function executePrintPages() {
  const targetPages = getActivePages();
  if (targetPages.length === 0) return;

  // Cria um container invisível temporário no body para impressão nativa
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

async function executeShareDocument() {
  if (pages.length === 0) {
    showToast('Nenhum documento aberto para compartilhar.', 'error');
    return;
  }

  if (navigator.share) {
    try {
      const pdfLib = window.PDFLib || self.PDFLib;
      const pdfDoc = await pdfLib.PDFDocument.create();
      for (const page of pages) {
        const imgBytes = await canvasToJpegBytes(page.processedCanvas, 0.9);
        const embedded = await pdfDoc.embedJpg(imgBytes);
        const p = pdfDoc.addPage([595.28, 841.89]);
        p.drawImage(embedded, { x: 0, y: 0, width: 595.28, height: 841.89 });
      }
      const bytes = await pdfDoc.save();
      const file = new File([bytes], 'documento_naps2.pdf', { type: 'application/pdf' });
      await navigator.share({
        title: 'Documento Digitalizado',
        files: [file]
      });
      showToast('Compartilhado com sucesso!', 'success');
    } catch (e) {
      if (e.name !== 'AbortError') showToast('Não foi possível compartilhar: ' + e.message, 'error');
    }
  } else {
    window.location.href = `mailto:?subject=${encodeURIComponent('Documento PDF Studio Web')}`;
  }
}

// ==========================================================================
// OCR (RECONHECIMENTO ÓPTICO DE CARACTERES COM TESSERACT)
// ==========================================================================
async function executeOcr() {
  const targetPages = document.getElementById('ocrScope').value === 'selected' ? getSelectedPages() : pages;
  if (targetPages.length === 0) {
    showToast('Nenhuma página para processar no escopo selecionado.', 'error');
    return;
  }

  const lang = document.getElementById('ocrLanguage').value;
  const progressWrapper = document.getElementById('ocrProgressWrapper');
  const ocrBar = document.getElementById('ocrProgressBar');
  const ocrStatus = document.getElementById('ocrProgressStatus');
  const resultWrapper = document.getElementById('ocrResultWrapper');
  const resultTextarea = document.getElementById('ocrResultText');

  progressWrapper.style.display = 'block';
  resultWrapper.style.display = 'none';
  ocrStatus.textContent = 'Inicializando motor Tesseract OCR...';
  ocrBar.style.width = '10%';

  try {
    let fullText = '';

    for (let i = 0; i < targetPages.length; i++) {
      const page = targetPages[i];
      ocrStatus.textContent = `Reconhecendo texto na página ${i + 1} de ${targetPages.length}...`;
      ocrBar.style.width = `${Math.round(20 + ((i + 1) / targetPages.length) * 75)}%`;

      if (page.text && page.text.trim().length > 20) {
        // Se a página já possui texto vetorial nativo
        fullText += `--- PÁGINA ${i + 1} ---\n\n${page.text}\n\n`;
      } else if (window.Tesseract) {
        // Executar Tesseract OCR no canvas processado
        const dataUrl = page.processedCanvas.toDataURL('image/png');
        const result = await Tesseract.recognize(dataUrl, lang, {
          logger: m => {
            if (m.status === 'recognizing text') {
              ocrStatus.textContent = `Página ${i + 1}: ${Math.round((m.progress || 0) * 100)}% concluído...`;
            }
          }
        });
        const ocrString = result.data.text || '';
        page.text = ocrString;
        fullText += `--- PÁGINA ${i + 1} (OCR) ---\n\n${ocrString}\n\n`;
      }
    }

    ocrBar.style.width = '100%';
    ocrStatus.textContent = 'OCR finalizado!';
    resultWrapper.style.display = 'block';
    resultTextarea.value = fullText;
    showToast('Reconhecimento de texto concluído!', 'success');
  } catch (err) {
    console.error('Erro no OCR:', err);
    showToast('Erro no OCR: ' + err.message, 'error');
  }
}

// ==========================================================================
// DIVIDIR EM LOTES (BATCH SPLIT)
// ==========================================================================
async function executeBatchSplit() {
  const method = document.getElementById('batchSplitType').value;
  const pagesPerDoc = method === 'single-pages' ? 1 : (parseInt(document.getElementById('batchPagesPerDoc').value, 10) || 1);

  closeModal(modalBatchSplit);
  progressContainer.style.display = 'flex';
  updateProgress(10, 'Dividindo documentos em lotes...');

  try {
    const pdfLib = window.PDFLib || self.PDFLib;
    const { PDFDocument } = pdfLib;
    const zip = new JSZip();

    const totalBatches = Math.ceil(pages.length / pagesPerDoc);

    for (let b = 0; b < totalBatches; b++) {
      const batchDoc = await PDFDocument.create();
      const start = b * pagesPerDoc;
      const end = Math.min(start + pagesPerDoc, pages.length);

      updateProgress(Math.round(15 + ((b + 1) / totalBatches) * 80), `Gerando lote ${b + 1} de ${totalBatches}...`);

      for (let i = start; i < end; i++) {
        const page = pages[i];
        const imgBytes = await canvasToJpegBytes(page.processedCanvas, 0.92);
        const embedded = await batchDoc.embedJpg(imgBytes);
        const p = batchDoc.addPage([595.28, 841.89]);
        p.drawImage(embedded, { x: 0, y: 0, width: 595.28, height: 841.89 });
      }

      const batchBytes = await batchDoc.save();
      const filename = `documento_lote_${String(b + 1).padStart(3, '0')}.pdf`;
      zip.file(filename, batchBytes);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipBlob, 'lotes_divididos.zip');
    showToast('Documentos divididos com sucesso!', 'success');
  } catch (err) {
    console.error(err);
    showToast('Erro ao dividir em lotes: ' + err.message, 'error');
  } finally {
    setTimeout(() => {
      progressContainer.style.display = 'none';
      progressBar.style.width = '0%';
    }, 1500);
  }
}

// ==========================================================================
// FUNÇÕES UTILITÁRIAS
// ==========================================================================
function openModal(modal) {
  modal.style.display = 'flex';
}

function closeModal(modal) {
  modal.style.display = 'none';
  if (modal === modalScan) stopCameraStream();
}

function setupModalDismissals() {
  document.querySelectorAll('.modal-close, [data-close]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetId = btn.dataset.close || btn.closest('.modal-overlay').id;
      const modal = document.getElementById(targetId);
      if (modal) closeModal(modal);
    });
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(overlay);
    });
  });
}

function cloneCanvas(oldCanvas) {
  const newCanvas = document.createElement('canvas');
  newCanvas.width = oldCanvas.width;
  newCanvas.height = oldCanvas.height;
  const ctx = newCanvas.getContext('2d');
  ctx.drawImage(oldCanvas, 0, 0);
  return newCanvas;
}

function generateThumbnailDataUrl(canvas, maxDim = 320) {
  const scale = Math.min(maxDim / canvas.width, maxDim / canvas.height, 1);
  const thumb = document.createElement('canvas');
  thumb.width = Math.round(canvas.width * scale);
  thumb.height = Math.round(canvas.height * scale);
  const ctx = thumb.getContext('2d');
  ctx.drawImage(canvas, 0, 0, thumb.width, thumb.height);
  return thumb.toDataURL('image/jpeg', 0.85);
}

async function fileToCanvas(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const cvs = document.createElement('canvas');
        cvs.width = img.width;
        cvs.height = img.height;
        const ctx = cvs.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(cvs);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function canvasToJpegBytes(canvas, quality = 0.92) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(new Uint8Array(reader.result));
      };
      reader.readAsArrayBuffer(blob);
    }, 'image/jpeg', quality);
  });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function updateProgress(percent, text) {
  progressBar.style.width = `${percent}%`;
  progressStatus.textContent = text;
}

function escapeHtml(text) {
  if (!text) return '';
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, m => map[m]);
}

let toastTimeout = null;
function showToast(message, type = 'default') {
  clearTimeout(toastTimeout);
  toastEl.textContent = message;
  toastEl.className = 'toast show';
  if (type === 'error') toastEl.classList.add('toast-error');
  if (type === 'success') toastEl.classList.add('toast-success');
  toastTimeout = setTimeout(() => toastEl.classList.remove('show'), 3500);
}
