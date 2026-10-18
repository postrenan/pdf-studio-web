// ==========================================================================
// Componente: Modal de Digitalização por Câmera (App.ScannerModal)
// ==========================================================================

window.App = window.App || {};

App.ScannerModal = (function () {
  let modalScan = null;
  let scanVideo = null;
  let scanCameraSelect = null;
  let scanProfileSelect = null;
  let scanCaptureCanvas = null;
  let btnCaptureScan = null;
  let activeCameraStream = null;

  function init() {
    modalScan = document.getElementById('modalScan');
    scanVideo = document.getElementById('scanVideo');
    scanCameraSelect = document.getElementById('scanCameraSelect');
    scanProfileSelect = document.getElementById('scanProfileSelect');
    scanCaptureCanvas = document.getElementById('scanCaptureCanvas');
    btnCaptureScan = document.getElementById('btnCaptureScan');

    if (scanCameraSelect) {
      scanCameraSelect.addEventListener('change', startCameraStream);
    }

    if (btnCaptureScan) {
      btnCaptureScan.addEventListener('click', captureFrame);
    }
  }

  async function open() {
    if (!modalScan) return;
    modalScan.style.display = 'flex';

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');

      if (scanCameraSelect) {
        scanCameraSelect.innerHTML = '';
        videoDevices.forEach((device, i) => {
          const opt = document.createElement('option');
          opt.value = device.deviceId;
          opt.textContent = device.label || `Câmera ${i + 1}`;
          scanCameraSelect.appendChild(opt);
        });
      }

      await startCameraStream();
    } catch (err) {
      console.warn('Erro ao listar câmeras:', err);
      await startCameraStream();
    }
  }

  function close() {
    if (modalScan) modalScan.style.display = 'none';
    stopCameraStream();
  }

  async function startCameraStream() {
    stopCameraStream();

    const deviceId = scanCameraSelect ? scanCameraSelect.value : undefined;
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
      if (scanVideo) scanVideo.srcObject = activeCameraStream;
    } catch (err) {
      console.error('Falha ao acessar câmera:', err);
      App.Utils.showToast('Não foi possível acessar a câmera. Verifique as permissões.', 'error');
    }
  }

  function stopCameraStream() {
    if (activeCameraStream) {
      activeCameraStream.getTracks().forEach(t => t.stop());
      activeCameraStream = null;
    }
  }

  function captureFrame() {
    if (!activeCameraStream || !scanVideo) return;

    const canvas = scanCaptureCanvas || document.createElement('canvas');
    canvas.width = scanVideo.videoWidth || 1280;
    canvas.height = scanVideo.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(scanVideo, 0, 0, canvas.width, canvas.height);

    const profile = scanProfileSelect ? scanProfileSelect.value : 'color';
    const processed = App.Utils.cloneCanvas(canvas);

    if (profile === 'bw') {
      App.ImageService.applyPixelFilters(processed, { colorMode: 'bw', threshold: 120, brightness: 10, contrast: 20 });
    } else if (profile === 'gray') {
      App.ImageService.applyPixelFilters(processed, { colorMode: 'grayscale', threshold: 128, brightness: 0, contrast: 0 });
    }

    const pageRecord = {
      id: 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8),
      sourceName: `Digitalização_${Date.now()}`,
      sourceType: 'scan',
      originalCanvas: canvas,
      processedCanvas: processed,
      thumbUrl: App.Utils.generateThumbnailDataUrl(processed),
      width: canvas.width,
      height: canvas.height,
      rotation: 0,
      flipH: false,
      flipV: false,
      colorMode: profile === 'bw' ? 'bw' : (profile === 'gray' ? 'grayscale' : 'original'),
      threshold: 120,
      brightness: profile === 'bw' ? 10 : 0,
      contrast: profile === 'bw' ? 20 : 0,
      deskew: 0,
      crop: { top: 0, bottom: 0, left: 0, right: 0 },
      selected: false,
      text: ''
    };

    App.State.addPage(pageRecord);
    App.Utils.showToast('Página capturada e adicionada!', 'success');
  }

  return {
    init,
    open,
    close,
    captureFrame
  };
})();
