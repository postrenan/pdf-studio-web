// ==========================================================================
// PDF Studio Web - Aplicação Completa Offline
// ==========================================================================

// Configuração do Worker do PDF.js
if (window.pdfjsLib) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdf.worker.min.js';
  } catch (e) {
    console.warn('PDF.js worker setup:', e);
  }
}

// Estado global do Mesclador
let filesData = []; // Array: { id, file, name, size, type, pageCount, thumbUrl, rotation, docxHtml, rawText }
let sortableInstance = null;

// Elementos do DOM - Navegação
const tabBtnMerger = document.getElementById('tabBtnMerger');
const tabBtnTools = document.getElementById('tabBtnTools');
const tabMerger = document.getElementById('tabMerger');
const tabTools = document.getElementById('tabTools');

// Elementos do DOM - Mesclador
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const fileList = document.getElementById('fileList');
const toolbar = document.getElementById('toolbar');
const tipBanner = document.getElementById('tipBanner');
const exportCard = document.getElementById('exportCard');
const fileCountBadge = document.getElementById('fileCountBadge');
const totalSizeText = document.getElementById('totalSizeText');
const addMoreBtn = document.getElementById('addMoreBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const mergeBtn = document.getElementById('mergeBtn');
const mergeBtnText = document.getElementById('mergeBtnText');
const outputFileName = document.getElementById('outputFileName');
const pageLayoutSelect = document.getElementById('pageLayoutSelect');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const progressStatus = document.getElementById('progressStatus');
const docxOffscreen = document.getElementById('docxOffscreenContainer');
const toastEl = document.getElementById('toast');

// Elementos do DOM - Modal de Ferramentas
const toolModal = document.getElementById('toolModal');
const toolModalBackdrop = document.getElementById('toolModalBackdrop');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalToolTitle = document.getElementById('modalToolTitle');
const modalToolBody = document.getElementById('modalToolBody');

// ==========================================================================
// Inicialização
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  setupMergerEvents();
  setupToolsEvents();
  initSortable();
});

// ==========================================================================
// Navegação por Abas
// ==========================================================================
function setupTabs() {
  const tabs = [
    { btn: tabBtnMerger, content: tabMerger },
    { btn: tabBtnTools, content: tabTools }
  ];

  tabs.forEach(t => {
    t.btn.addEventListener('click', () => {
      tabs.forEach(item => {
        item.btn.classList.remove('active');
        item.content.style.display = 'none';
      });
      t.btn.classList.add('active');
      t.content.style.display = 'block';
    });
  });
}

// ==========================================================================
// Eventos do Mesclador Multi-Formato
// ==========================================================================
function setupMergerEvents() {
  browseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
  });

  dropZone.addEventListener('click', () => {
    fileInput.click();
  });

  addMoreBtn.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleIncomingFiles(Array.from(e.target.files));
      fileInput.value = '';
    }
  });

  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('drag-over');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('drag-over');
    }, false);
  });

  dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    if (dt && dt.files && dt.files.length > 0) {
      handleIncomingFiles(Array.from(dt.files));
    }
  });

  window.addEventListener('dragover', (e) => e.preventDefault(), false);
  window.addEventListener('drop', (e) => {
    if (tabMerger.style.display !== 'none' && !dropZone.contains(e.target) && e.dataTransfer.files.length > 0) {
      e.preventDefault();
      handleIncomingFiles(Array.from(e.dataTransfer.files));
    }
  }, false);

  clearAllBtn.addEventListener('click', () => {
    if (filesData.length === 0) return;
    if (confirm('Tem certeza que deseja limpar todos os arquivos da lista?')) {
      filesData = [];
      renderFileList();
      updateUIState();
      showToast('Lista limpa com sucesso', 'default');
    }
  });

  mergeBtn.addEventListener('click', executeUnifiedMerge);
}

// Inicializa SortableJS para reordenação
function initSortable() {
  if (!window.Sortable) return;
  sortableInstance = new Sortable(fileList, {
    animation: 200,
    handle: '.drag-handle',
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    onEnd: () => syncOrderFromDOM()
  });
}

function syncOrderFromDOM() {
  const cardElements = fileList.querySelectorAll('.file-card');
  const newOrder = [];
  cardElements.forEach((el) => {
    const id = el.dataset.id;
    const item = filesData.find(f => f.id === id);
    if (item) newOrder.push(item);
  });
  filesData = newOrder;
  updateOrderBadges();
}

// ==========================================================================
// Detecção e Processamento de Arquivos
// ==========================================================================
function getFileType(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf') || file.type === 'application/pdf') return 'pdf';
  if (name.endsWith('.docx') || name.endsWith('.doc')) return 'docx';
  if (name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png') || name.endsWith('.webp') || name.endsWith('.bmp') || file.type.startsWith('image/')) return 'img';
  if (name.endsWith('.txt') || file.type === 'text/plain') return 'txt';
  return 'unknown';
}

async function handleIncomingFiles(newFiles) {
  const supportedFiles = newFiles.filter(f => getFileType(f) !== 'unknown');

  if (supportedFiles.length === 0) {
    showToast('Formato não suportado. Use arquivos PDF, DOCX, Imagens (JPG, PNG) ou TXT.', 'error');
    return;
  }

  showToast(`Carregando ${supportedFiles.length} arquivo(s)...`, 'default');

  for (const file of supportedFiles) {
    const type = getFileType(file);
    const id = 'f_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
    const fileItem = {
      id,
      file,
      name: file.name,
      size: formatFileSize(file.size),
      type,
      pageCount: 'Carregando...',
      thumbUrl: null,
      rotation: 0,
      docxHtml: null,
      rawText: null
    };

    filesData.push(fileItem);
    renderFileList();
    updateUIState();

    // Inspeciona e gera miniatura em background
    processFileInspection(fileItem);
  }
}

async function processFileInspection(item) {
  try {
    if (item.type === 'pdf') {
      const buffer = await item.file.arrayBuffer();
      if (window.pdfjsLib) {
        try {
          const pdfDoc = await pdfjsLib.getDocument({ data: buffer.slice(0) }).promise;
          item.pageCount = `${pdfDoc.numPages} ${pdfDoc.numPages === 1 ? 'pág' : 'págs'}`;
          const page = await pdfDoc.getPage(1);
          const viewport = page.getViewport({ scale: 0.35 });
          const canvas = document.createElement('canvas');
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
          item.thumbUrl = canvas.toDataURL();
        } catch (e) {
          const pdfLib = window.PDFLib || self.PDFLib;
          if (pdfLib) {
            const doc = await pdfLib.PDFDocument.load(buffer, { ignoreEncryption: true });
            item.pageCount = `${doc.getPageCount()} págs`;
          }
        }
      }
    } else if (item.type === 'img') {
      const reader = new FileReader();
      reader.onload = (e) => {
        item.thumbUrl = e.target.result;
        const img = new Image();
        img.onload = () => {
          item.pageCount = `${img.width}x${img.height} px`;
          updateCardDOM(item);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(item.file);
    } else if (item.type === 'docx') {
      const buffer = await item.file.arrayBuffer();
      if (window.mammoth) {
        const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
        item.docxHtml = result.value;
        item.pageCount = 'Doc Word';
      }
    } else if (item.type === 'txt') {
      const text = await item.file.text();
      item.rawText = text;
      const lines = text.split('\n').length;
      item.pageCount = `${lines} ${lines === 1 ? 'linha' : 'linhas'}`;
    }
  } catch (err) {
    console.error('Erro na inspeção do arquivo:', item.name, err);
    item.pageCount = 'Arquivo carregado';
  }

  updateCardDOM(item);
}

function updateCardDOM(item) {
  const card = fileList.querySelector(`[data-id="${item.id}"]`);
  if (!card) return;

  const pageCountEl = card.querySelector('.file-pages');
  if (pageCountEl) pageCountEl.textContent = item.pageCount;

  const thumbContainer = card.querySelector('.thumb-preview');
  if (thumbContainer && item.thumbUrl) {
    thumbContainer.innerHTML = `<img src="${item.thumbUrl}" alt="Miniatura" style="transform: rotate(${item.rotation}deg); transition: transform 0.2s;">`;
  }
}

// ==========================================================================
// Renderização da Lista de Cards
// ==========================================================================
function renderFileList() {
  fileList.innerHTML = '';

  filesData.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'file-card';
    card.dataset.id = item.id;

    let badgeClass = 'type-pdf';
    let badgeText = 'PDF';
    if (item.type === 'docx') { badgeClass = 'type-docx'; badgeText = 'DOCX'; }
    else if (item.type === 'img') { badgeClass = 'type-img'; badgeText = 'IMG'; }
    else if (item.type === 'txt') { badgeClass = 'type-txt'; badgeText = 'TXT'; }

    let defaultIconSvg = `
      <div class="thumb-preview-icon" style="color: #4f46e5;">
        <span>${badgeText}</span>
      </div>`;

    card.innerHTML = `
      <div class="drag-handle" title="Arraste para reposicionar">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="9" cy="5" r="1"></circle>
          <circle cx="9" cy="12" r="1"></circle>
          <circle cx="9" cy="19" r="1"></circle>
          <circle cx="15" cy="5" r="1"></circle>
          <circle cx="15" cy="12" r="1"></circle>
          <circle cx="15" cy="19" r="1"></circle>
        </svg>
      </div>
      <div class="order-badge">#${index + 1}</div>
      <div class="thumb-preview">
        ${item.thumbUrl 
          ? `<img src="${item.thumbUrl}" alt="Prévia" style="transform: rotate(${item.rotation}deg); transition: transform 0.2s;">` 
          : defaultIconSvg}
      </div>
      <div class="file-info">
        <div class="file-title-row">
          <span class="file-name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</span>
          <span class="file-type-badge ${badgeClass}">${badgeText}</span>
        </div>
        <div class="file-meta">
          <span class="file-size">${item.size}</span>
          <span class="file-pages">${item.pageCount}</span>
          ${item.rotation ? `<span class="text-primary font-bold">Giro: ${item.rotation}°</span>` : ''}
        </div>
      </div>
      <div class="file-actions">
        <button type="button" class="btn-icon btn-rotate" title="Girar 90° no sentido horário">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"></polyline>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
          </svg>
        </button>
        <button type="button" class="btn-icon btn-move-up" title="Mover para cima" ${index === 0 ? 'disabled' : ''}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="18 15 12 9 6 15"></polyline>
          </svg>
        </button>
        <button type="button" class="btn-icon btn-move-down" title="Mover para baixo" ${index === filesData.length - 1 ? 'disabled' : ''}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
        <button type="button" class="btn-icon btn-delete" title="Remover">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    `;

    card.querySelector('.btn-rotate').addEventListener('click', () => rotateItem(item.id));
    card.querySelector('.btn-move-up').addEventListener('click', () => moveItem(index, -1));
    card.querySelector('.btn-move-down').addEventListener('click', () => moveItem(index, 1));
    card.querySelector('.btn-delete').addEventListener('click', () => removeItem(item.id));

    fileList.appendChild(card);
  });
}

function rotateItem(id) {
  const item = filesData.find(f => f.id === id);
  if (!item) return;
  item.rotation = (item.rotation + 90) % 360;
  renderFileList();
}

function moveItem(index, direction) {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= filesData.length) return;
  const item = filesData.splice(index, 1)[0];
  filesData.splice(targetIndex, 0, item);
  renderFileList();
}

function removeItem(id) {
  filesData = filesData.filter(item => item.id !== id);
  renderFileList();
  updateUIState();
  showToast('Arquivo removido', 'default');
}

function updateOrderBadges() {
  const cards = fileList.querySelectorAll('.file-card');
  cards.forEach((card, index) => {
    const badge = card.querySelector('.order-badge');
    if (badge) badge.textContent = `#${index + 1}`;
    const upBtn = card.querySelector('.btn-move-up');
    const downBtn = card.querySelector('.btn-move-down');
    if (upBtn) upBtn.disabled = (index === 0);
    if (downBtn) downBtn.disabled = (index === cards.length - 1);
  });
}

function updateUIState() {
  const count = filesData.length;
  if (count > 0) {
    toolbar.style.display = 'flex';
    tipBanner.style.display = 'flex';
    exportCard.style.display = 'flex';
    fileCountBadge.textContent = `${count} ${count === 1 ? 'arquivo' : 'arquivos'}`;
    const totalBytes = filesData.reduce((acc, cur) => acc + (cur.file ? cur.file.size : 0), 0);
    totalSizeText.textContent = `Tamanho total: ${formatFileSize(totalBytes)}`;
  } else {
    toolbar.style.display = 'none';
    tipBanner.style.display = 'none';
    exportCard.style.display = 'none';
  }
}

// ==========================================================================
// Mesclador Multi-Formato Unificado (PDF + DOCX + IMG + TXT)
// ==========================================================================
async function executeUnifiedMerge() {
  if (filesData.length === 0) {
    showToast('Adicione pelo menos um arquivo.', 'error');
    return;
  }

  mergeBtn.disabled = true;
  mergeBtnText.textContent = 'Processando arquivos...';
  progressContainer.style.display = 'flex';
  updateProgress(5, 'Iniciando criação do documento final...');

  try {
    const pdfLib = window.PDFLib || self.PDFLib;
    if (!pdfLib || !pdfLib.PDFDocument) {
      throw new Error('A biblioteca PDF-Lib não foi encontrada.');
    }

    const { PDFDocument, degrees } = pdfLib;
    const mergedPdf = await PDFDocument.create();
    const isA4Layout = pageLayoutSelect.value === 'a4';
    const totalFiles = filesData.length;

    for (let i = 0; i < totalFiles; i++) {
      const item = filesData[i];
      const percent = Math.round(10 + ((i + 1) / totalFiles) * 75);
      updateProgress(percent, `Processando (${i + 1}/${totalFiles}): ${item.name}...`);

      if (item.type === 'pdf') {
        const buffer = await item.file.arrayBuffer();
        const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
        const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
        copiedPages.forEach(page => {
          if (item.rotation) {
            const currentAngle = page.getRotation().angle;
            page.setRotation(degrees(currentAngle + item.rotation));
          }
          mergedPdf.addPage(page);
        });
      } else if (item.type === 'img') {
        await appendImageToPdf(mergedPdf, item, isA4Layout);
      } else if (item.type === 'docx') {
        await appendDocxToPdf(mergedPdf, item);
      } else if (item.type === 'txt') {
        await appendTextToPdf(mergedPdf, item);
      }
    }

    updateProgress(90, 'Compactando e finalizando PDF...');
    const mergedPdfBytes = await mergedPdf.save();
    updateProgress(100, 'Download pronto!');

    let fileName = outputFileName.value.trim() || 'documento_unificado';
    if (!fileName.toLowerCase().endsWith('.pdf')) fileName += '.pdf';

    downloadBlob(new Blob([mergedPdfBytes], { type: 'application/pdf' }), fileName);
    showToast('Documento mesclado com sucesso! Download iniciado.', 'success');
  } catch (err) {
    console.error('Falha na mesclagem:', err);
    showToast(err.message || 'Erro ao gerar o documento unificado.', 'error');
  } finally {
    mergeBtn.disabled = false;
    mergeBtnText.textContent = 'Juntar Tudo e Baixar PDF';
    setTimeout(() => {
      progressContainer.style.display = 'none';
      progressBar.style.width = '0%';
    }, 2000);
  }
}

// Anexa imagem ao PDF (A4 ou tamanho original)
async function appendImageToPdf(pdfDoc, item, isA4) {
  const { degrees } = window.PDFLib || self.PDFLib;
  const imageBytes = await item.file.arrayBuffer();
  let embeddedImage;

  try {
    if (item.name.toLowerCase().endsWith('.png')) {
      embeddedImage = await pdfDoc.embedPng(imageBytes);
    } else {
      embeddedImage = await pdfDoc.embedJpg(imageBytes);
    }
  } catch (e) {
    // Fallback: renderizar via canvas para obter JPEG padrão
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const cvs = document.createElement('canvas');
          cvs.width = img.width;
          cvs.height = img.height;
          const ctx = cvs.getContext('2d');
          ctx.drawImage(img, 0, 0);
          resolve(cvs.toDataURL('image/jpeg', 0.92));
        };
        img.onerror = reject;
        img.src = reader.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(item.file);
    });

    const b64 = dataUrl.split(',')[1];
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    embeddedImage = await pdfDoc.embedJpg(bytes);
  }

  const imgDims = embeddedImage.scale(1);

  if (isA4) {
    // Página padrão A4 em pontos (595.28 x 841.89)
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 36;
    const maxWidth = pageWidth - margin * 2;
    const maxHeight = pageHeight - margin * 2;

    const scale = Math.min(maxWidth / imgDims.width, maxHeight / imgDims.height, 1);
    const renderWidth = imgDims.width * scale;
    const renderHeight = imgDims.height * scale;

    const x = (pageWidth - renderWidth) / 2;
    const y = (pageHeight - renderHeight) / 2;

    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    page.drawImage(embeddedImage, {
      x,
      y,
      width: renderWidth,
      height: renderHeight
    });

    if (item.rotation) {
      page.setRotation(degrees(item.rotation));
    }
  } else {
    const page = pdfDoc.addPage([imgDims.width, imgDims.height]);
    page.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: imgDims.width,
      height: imgDims.height
    });
    if (item.rotation) {
      page.setRotation(degrees(item.rotation));
    }
  }
}

// Converte e anexa DOCX ao PDF renderizando em páginas A4 de alta fidelidade
async function appendDocxToPdf(pdfDoc, item) {
  let html = item.docxHtml;
  if (!html) {
    const buffer = await item.file.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
    html = result.value;
  }

  docxOffscreen.innerHTML = `
    <div style="padding: 20px 10px;">
      ${html}
    </div>
  `;

  // Renderiza com html2canvas
  const fullCanvas = await html2canvas(docxOffscreen, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff'
  });

  docxOffscreen.innerHTML = '';

  // Paginação inteligente para páginas A4
  const a4WidthPt = 595.28;
  const a4HeightPt = 841.89;
  const aspectRatio = a4HeightPt / a4WidthPt;

  const canvasPageHeight = fullCanvas.width * aspectRatio;
  const totalPages = Math.ceil(fullCanvas.height / canvasPageHeight);

  for (let p = 0; p < totalPages; p++) {
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = fullCanvas.width;
    pageCanvas.height = canvasPageHeight;
    const ctx = pageCanvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

    const sourceY = p * canvasPageHeight;
    const sourceHeight = Math.min(canvasPageHeight, fullCanvas.height - sourceY);

    ctx.drawImage(
      fullCanvas,
      0, sourceY, fullCanvas.width, sourceHeight,
      0, 0, fullCanvas.width, sourceHeight
    );

    const imgDataUrl = pageCanvas.toDataURL('image/jpeg', 0.92);
    const b64 = imgDataUrl.split(',')[1];
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let k = 0; k < binary.length; k++) bytes[k] = binary.charCodeAt(k);

    const embeddedPageImg = await pdfDoc.embedJpg(bytes);
    const page = pdfDoc.addPage([a4WidthPt, a4HeightPt]);
    page.drawImage(embeddedPageImg, {
      x: 0,
      y: 0,
      width: a4WidthPt,
      height: a4HeightPt
    });
  }
}

// Anexa arquivo TXT ao PDF com formatação limpa
async function appendTextToPdf(pdfDoc, item) {
  const text = item.rawText || await item.file.text();
  docxOffscreen.innerHTML = `
    <div style="font-family: 'Courier New', monospace; font-size: 13pt; line-height: 1.5; white-space: pre-wrap; color: #111;">
      ${escapeHtml(text)}
    </div>
  `;

  const fullCanvas = await html2canvas(docxOffscreen, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff'
  });
  docxOffscreen.innerHTML = '';

  const a4WidthPt = 595.28;
  const a4HeightPt = 841.89;
  const aspectRatio = a4HeightPt / a4WidthPt;
  const canvasPageHeight = fullCanvas.width * aspectRatio;
  const totalPages = Math.ceil(fullCanvas.height / canvasPageHeight);

  for (let p = 0; p < totalPages; p++) {
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = fullCanvas.width;
    pageCanvas.height = canvasPageHeight;
    const ctx = pageCanvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

    const sourceY = p * canvasPageHeight;
    const sourceHeight = Math.min(canvasPageHeight, fullCanvas.height - sourceY);
    ctx.drawImage(fullCanvas, 0, sourceY, fullCanvas.width, sourceHeight, 0, 0, fullCanvas.width, sourceHeight);

    const imgDataUrl = pageCanvas.toDataURL('image/jpeg', 0.92);
    const b64 = imgDataUrl.split(',')[1];
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let k = 0; k < binary.length; k++) bytes[k] = binary.charCodeAt(k);

    const embeddedPageImg = await pdfDoc.embedJpg(bytes);
    const page = pdfDoc.addPage([a4WidthPt, a4HeightPt]);
    page.drawImage(embeddedPageImg, {
      x: 0,
      y: 0,
      width: a4WidthPt,
      height: a4HeightPt
    });
  }
}

// ==========================================================================
// Central de Ferramentas & Conversões (Aba 2)
// ==========================================================================
function setupToolsEvents() {
  document.querySelectorAll('.tool-open-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const toolType = btn.dataset.tool;
      openToolModal(toolType);
    });
  });

  closeModalBtn.addEventListener('click', closeToolModal);
  toolModalBackdrop.addEventListener('click', closeToolModal);
}

function openToolModal(toolType) {
  modalToolBody.innerHTML = '';

  switch (toolType) {
    case 'docx-pdf':
      renderToolDocxToPdf();
      break;
    case 'pdf-images':
      renderToolPdfToImages();
      break;
    case 'split-pdf':
      renderToolSplitPdf();
      break;
    case 'rotate-pdf':
      renderToolRotatePdf();
      break;
    case 'pdf-txt':
      renderToolPdfToTxt();
      break;
    case 'img-pdf':
      renderToolImagesToPdf();
      break;
    default:
      modalToolBody.innerHTML = '<p>Ferramenta em desenvolvimento.</p>';
  }

  toolModal.style.display = 'flex';
}

function closeToolModal() {
  toolModal.style.display = 'none';
  modalToolBody.innerHTML = '';
}

// Ferramenta: DOCX para PDF
function renderToolDocxToPdf() {
  modalToolTitle.textContent = 'Word (DOCX) para PDF';
  modalToolBody.innerHTML = `
    <p class="text-muted">Selecione um documento Word (.docx) para convertê-lo instantaneamente em PDF.</p>
    <div class="form-group">
      <input type="file" id="toolDocxInput" accept=".docx" class="select-input">
    </div>
    <div id="toolDocxStatus" style="display: none;" class="progress-status"></div>
    <button type="button" class="btn btn-primary" id="btnExecuteDocxToPdf">
      Converter para PDF
    </button>
  `;

  document.getElementById('btnExecuteDocxToPdf').addEventListener('click', async () => {
    const input = document.getElementById('toolDocxInput');
    const status = document.getElementById('toolDocxStatus');
    if (!input.files || input.files.length === 0) {
      showToast('Selecione um arquivo .docx primeiro.', 'error');
      return;
    }

    const file = input.files[0];
    status.style.display = 'block';
    status.textContent = 'Convertendo documento...';

    try {
      const pdfLib = window.PDFLib || self.PDFLib;
      const pdfDoc = await pdfLib.PDFDocument.create();
      await appendDocxToPdf(pdfDoc, { file, name: file.name });
      const pdfBytes = await pdfDoc.save();

      const outName = file.name.replace(/\.docx$/i, '') + '.pdf';
      downloadBlob(new Blob([pdfBytes], { type: 'application/pdf' }), outName);
      showToast('DOCX convertido com sucesso!', 'success');
      closeToolModal();
    } catch (e) {
      console.error(e);
      showToast('Erro ao converter DOCX: ' + e.message, 'error');
    }
  });
}

// Ferramenta: PDF para Imagens (ZIP)
function renderToolPdfToImages() {
  modalToolTitle.textContent = 'Extrair Páginas do PDF em Imagens (ZIP)';
  modalToolBody.innerHTML = `
    <p class="text-muted">Todas as páginas do PDF serão convertidas em imagens e baixadas em um arquivo .zip.</p>
    <div class="form-group">
      <label>Arquivo PDF:</label>
      <input type="file" id="toolPdfImgInput" accept="application/pdf" class="select-input">
    </div>
    <div class="form-group">
      <label>Formato da Imagem:</label>
      <select id="toolImgFormat" class="select-input">
        <option value="image/png" selected>PNG (Alta fidelidade)</option>
        <option value="image/jpeg">JPG (Mais leve)</option>
      </select>
    </div>
    <div id="toolPdfImgStatus" style="display: none;" class="progress-status"></div>
    <button type="button" class="btn btn-primary" id="btnExecutePdfToImages">Extrair Imagens e Baixar ZIP</button>
  `;

  document.getElementById('btnExecutePdfToImages').addEventListener('click', async () => {
    const input = document.getElementById('toolPdfImgInput');
    const status = document.getElementById('toolPdfImgStatus');
    const format = document.getElementById('toolImgFormat').value;

    if (!input.files || input.files.length === 0) {
      showToast('Selecione um arquivo PDF primeiro.', 'error');
      return;
    }

    const file = input.files[0];
    status.style.display = 'block';
    status.textContent = 'Lendo páginas do PDF...';

    try {
      const buffer = await file.arrayBuffer();
      const pdfDoc = await pdfjsLib.getDocument({ data: buffer }).promise;
      const zip = new JSZip();
      const ext = format === 'image/png' ? 'png' : 'jpg';

      for (let i = 1; i <= pdfDoc.numPages; i++) {
        status.textContent = `Renderizando página ${i} de ${pdfDoc.numPages}...`;
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;

        const dataUrl = canvas.toDataURL(format, 0.95);
        const b64 = dataUrl.split(',')[1];
        zip.file(`pagina_${String(i).padStart(3, '0')}.${ext}`, b64, { base64: true });
      }

      status.textContent = 'Criando arquivo ZIP...';
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(zipBlob, file.name.replace(/\.pdf$/i, '') + '_imagens.zip');
      showToast('Páginas extraídas com sucesso!', 'success');
      closeToolModal();
    } catch (e) {
      console.error(e);
      showToast('Erro ao extrair imagens: ' + e.message, 'error');
    }
  });
}

// Ferramenta: Dividir / Extrair PDF
function renderToolSplitPdf() {
  modalToolTitle.textContent = 'Dividir / Extrair Páginas do PDF';
  modalToolBody.innerHTML = `
    <p class="text-muted">Extraia apenas as páginas que você deseja salvar em um novo PDF.</p>
    <div class="form-group">
      <label>Arquivo PDF:</label>
      <input type="file" id="toolSplitInput" accept="application/pdf" class="select-input">
    </div>
    <div class="form-group">
      <label>Páginas desejadas (ex: 1-3, 5, 8-10):</label>
      <input type="text" id="toolSplitPages" placeholder="Ex: 1-3, 5" class="select-input">
    </div>
    <div id="toolSplitStatus" style="display: none;" class="progress-status"></div>
    <button type="button" class="btn btn-primary" id="btnExecuteSplit">Extrair Páginas Selecionadas</button>
  `;

  document.getElementById('btnExecuteSplit').addEventListener('click', async () => {
    const input = document.getElementById('toolSplitInput');
    const rangeText = document.getElementById('toolSplitPages').value.trim();
    const status = document.getElementById('toolSplitStatus');

    if (!input.files || input.files.length === 0) {
      showToast('Selecione um arquivo PDF primeiro.', 'error');
      return;
    }
    if (!rangeText) {
      showToast('Informe as páginas que deseja extrair.', 'error');
      return;
    }

    const file = input.files[0];
    status.style.display = 'block';
    status.textContent = 'Processando...';

    try {
      const pdfLib = window.PDFLib || self.PDFLib;
      const buffer = await file.arrayBuffer();
      const srcDoc = await pdfLib.PDFDocument.load(buffer, { ignoreEncryption: true });
      const totalPages = srcDoc.getPageCount();

      // Analisa o intervalo (ex: "1-3, 5")
      const pagesToExtract = parsePageRanges(rangeText, totalPages);
      if (pagesToExtract.length === 0) {
        throw new Error('Nenhuma página válida encontrada no intervalo.');
      }

      const newDoc = await pdfLib.PDFDocument.create();
      const copied = await newDoc.copyPages(srcDoc, pagesToExtract.map(p => p - 1));
      copied.forEach(p => newDoc.addPage(p));

      const newBytes = await newDoc.save();
      downloadBlob(new Blob([newBytes], { type: 'application/pdf' }), file.name.replace(/\.pdf$/i, '') + '_extraido.pdf');
      showToast('Páginas extraídas com sucesso!', 'success');
      closeToolModal();
    } catch (e) {
      console.error(e);
      showToast(e.message || 'Erro ao extrair páginas.', 'error');
    }
  });
}

// Ferramenta: Girar PDF
function renderToolRotatePdf() {
  modalToolTitle.textContent = 'Girar Páginas do PDF';
  modalToolBody.innerHTML = `
    <p class="text-muted">Altere a orientação de todas as páginas do PDF com facilidade.</p>
    <div class="form-group">
      <label>Arquivo PDF:</label>
      <input type="file" id="toolRotateInput" accept="application/pdf" class="select-input">
    </div>
    <div class="form-group">
      <label>Ângulo de Rotação:</label>
      <select id="toolRotateAngle" class="select-input">
        <option value="90">90° no sentido horário</option>
        <option value="180">180° (de cabeça para baixo)</option>
        <option value="270">270° (90° anti-horário)</option>
      </select>
    </div>
    <div id="toolRotateStatus" style="display: none;" class="progress-status"></div>
    <button type="button" class="btn btn-primary" id="btnExecuteRotate">Girar e Baixar PDF</button>
  `;

  document.getElementById('btnExecuteRotate').addEventListener('click', async () => {
    const input = document.getElementById('toolRotateInput');
    const angle = parseInt(document.getElementById('toolRotateAngle').value, 10);
    const status = document.getElementById('toolRotateStatus');

    if (!input.files || input.files.length === 0) {
      showToast('Selecione um arquivo PDF primeiro.', 'error');
      return;
    }

    const file = input.files[0];
    status.style.display = 'block';
    status.textContent = 'Rotacionando páginas...';

    try {
      const pdfLib = window.PDFLib || self.PDFLib;
      const { degrees } = pdfLib;
      const buffer = await file.arrayBuffer();
      const doc = await pdfLib.PDFDocument.load(buffer, { ignoreEncryption: true });
      
      const pages = doc.getPages();
      pages.forEach(p => {
        p.setRotation(degrees(p.getRotation().angle + angle));
      });

      const rotatedBytes = await doc.save();
      downloadBlob(new Blob([rotatedBytes], { type: 'application/pdf' }), file.name.replace(/\.pdf$/i, '') + '_girado.pdf');
      showToast('PDF rotacionado com sucesso!', 'success');
      closeToolModal();
    } catch (e) {
      console.error(e);
      showToast('Erro ao girar PDF: ' + e.message, 'error');
    }
  });
}

// Ferramenta: PDF para Texto (TXT)
function renderToolPdfToTxt() {
  modalToolTitle.textContent = 'Extrair Texto do PDF (.txt)';
  modalToolBody.innerHTML = `
    <p class="text-muted">Extraia o texto contido no documento PDF para um arquivo de texto limpo.</p>
    <div class="form-group">
      <label>Arquivo PDF:</label>
      <input type="file" id="toolTxtInput" accept="application/pdf" class="select-input">
    </div>
    <div id="toolTxtStatus" style="display: none;" class="progress-status"></div>
    <button type="button" class="btn btn-primary" id="btnExecuteTxt">Extrair Texto</button>
  `;

  document.getElementById('btnExecuteTxt').addEventListener('click', async () => {
    const input = document.getElementById('toolTxtInput');
    const status = document.getElementById('toolTxtStatus');

    if (!input.files || input.files.length === 0) {
      showToast('Selecione um arquivo PDF primeiro.', 'error');
      return;
    }

    const file = input.files[0];
    status.style.display = 'block';
    status.textContent = 'Extraindo texto das páginas...';

    try {
      const buffer = await file.arrayBuffer();
      const pdfDoc = await pdfjsLib.getDocument({ data: buffer }).promise;
      let fullText = '';

      for (let i = 1; i <= pdfDoc.numPages; i++) {
        status.textContent = `Lendo página ${i} de ${pdfDoc.numPages}...`;
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += `--- PÁGINA ${i} ---\n\n` + pageText + '\n\n';
      }

      downloadBlob(new Blob([fullText], { type: 'text/plain;charset=utf-8' }), file.name.replace(/\.pdf$/i, '') + '_texto.txt');
      showToast('Texto extraído com sucesso!', 'success');
      closeToolModal();
    } catch (e) {
      console.error(e);
      showToast('Erro ao extrair texto: ' + e.message, 'error');
    }
  });
}

// Ferramenta: Imagens para PDF
function renderToolImagesToPdf() {
  modalToolTitle.textContent = 'Imagens para PDF';
  modalToolBody.innerHTML = `
    <p class="text-muted">Selecione uma ou mais fotos para agrupá-las em um único PDF.</p>
    <div class="form-group">
      <label>Imagens (JPG, PNG, WEBP):</label>
      <input type="file" id="toolImgInput" accept="image/*" multiple class="select-input">
    </div>
    <div id="toolImgStatus" style="display: none;" class="progress-status"></div>
    <button type="button" class="btn btn-primary" id="btnExecuteImagesToPdf">Gerar PDF com Imagens</button>
  `;

  document.getElementById('btnExecuteImagesToPdf').addEventListener('click', async () => {
    const input = document.getElementById('toolImgInput');
    const status = document.getElementById('toolImgStatus');

    if (!input.files || input.files.length === 0) {
      showToast('Selecione ao menos uma imagem.', 'error');
      return;
    }

    status.style.display = 'block';
    status.textContent = 'Convertendo imagens...';

    try {
      const pdfLib = window.PDFLib || self.PDFLib;
      const pdfDoc = await pdfLib.PDFDocument.create();

      for (const file of Array.from(input.files)) {
        await appendImageToPdf(pdfDoc, { file, name: file.name, rotation: 0 }, true);
      }

      const pdfBytes = await pdfDoc.save();
      downloadBlob(new Blob([pdfBytes], { type: 'application/pdf' }), 'imagens_unificadas.pdf');
      showToast('PDF gerado com sucesso!', 'success');
      closeToolModal();
    } catch (e) {
      console.error(e);
      showToast('Erro ao converter imagens: ' + e.message, 'error');
    }
  });
}

// ==========================================================================
// Funções Utilitárias
// ==========================================================================
function parsePageRanges(rangeStr, maxPages) {
  const pages = new Set();
  const parts = rangeStr.split(',');

  parts.forEach(part => {
    const trimmed = part.trim();
    if (trimmed.includes('-')) {
      const [start, end] = trimmed.split('-').map(n => parseInt(n.trim(), 10));
      if (!isNaN(start) && !isNaN(end)) {
        const from = Math.max(1, Math.min(start, end));
        const to = Math.min(maxPages, Math.max(start, end));
        for (let i = from; i <= to; i++) pages.add(i);
      }
    } else {
      const num = parseInt(trimmed, 10);
      if (!isNaN(num) && num >= 1 && num <= maxPages) {
        pages.add(num);
      }
    }
  });

  return Array.from(pages).sort((a, b) => a - b);
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

function updateProgress(percent, statusText) {
  progressBar.style.width = `${percent}%`;
  progressStatus.textContent = statusText;
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
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
