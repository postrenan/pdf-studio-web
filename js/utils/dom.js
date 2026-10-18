// ==========================================================================
// Módulo: Utilitários DOM e Canvas (App.Utils)
// ==========================================================================

window.App = window.App || {};

App.Utils = (function () {
  let toastTimeout = null;

  function showToast(message, type = 'default') {
    const toastEl = document.getElementById('toast');
    if (!toastEl) return;
    clearTimeout(toastTimeout);
    toastEl.textContent = message;
    toastEl.className = 'toast show';
    if (type === 'error') toastEl.classList.add('toast-error');
    if (type === 'success') toastEl.classList.add('toast-success');
    toastTimeout = setTimeout(() => toastEl.classList.remove('show'), 3500);
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
    const bar = document.getElementById('progressBar');
    const status = document.getElementById('progressStatus');
    if (bar) bar.style.width = `${percent}%`;
    if (status) status.textContent = text;
  }

  function escapeHtml(text) {
    if (!text) return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
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
        reader.onloadend = () => resolve(new Uint8Array(reader.result));
        reader.readAsArrayBuffer(blob);
      }, 'image/jpeg', quality);
    });
  }

  return {
    showToast,
    downloadBlob,
    updateProgress,
    escapeHtml,
    formatFileSize,
    cloneCanvas,
    generateThumbnailDataUrl,
    fileToCanvas,
    canvasToJpegBytes
  };
})();
