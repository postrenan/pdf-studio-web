// ==========================================================================
// Componente: Banner Flutuante & Modal de Privacidade / LGPD (App.LgpdModal)
// ==========================================================================

window.App = window.App || {};

App.LgpdModal = (function () {
  let modalLgpd = null;
  let lgpdFloatingBanner = null;
  let btnDismiss = null;
  let btnCloseFloating = null;
  let btnDetails = null;
  let btnOpen = null;
  let btnFooter = null;

  function init() {
    modalLgpd = document.getElementById('modalLgpd');
    lgpdFloatingBanner = document.getElementById('lgpdFloatingBanner');
    btnDismiss = document.getElementById('btnDismissLgpd');
    btnCloseFloating = document.getElementById('btnCloseLgpdFloating');
    btnDetails = document.getElementById('btnDetailsLgpd');
    btnOpen = document.getElementById('btnOpenLgpd');
    btnFooter = document.getElementById('btnFooterLgpd');

    if (lgpdFloatingBanner) {
      if (localStorage.getItem('lgpd_modal_dismissed') === 'true') {
        lgpdFloatingBanner.classList.add('hidden');
      }
    }

    const dismissBanner = () => {
      if (lgpdFloatingBanner) lgpdFloatingBanner.classList.add('hidden');
      localStorage.setItem('lgpd_modal_dismissed', 'true');
      App.Utils.showToast('Preferência salva. Privacidade e LGPD respeitadas!', 'success');
    };

    if (btnDismiss) btnDismiss.addEventListener('click', dismissBanner);
    if (btnCloseFloating) btnCloseFloating.addEventListener('click', dismissBanner);

    if (btnDetails) btnDetails.addEventListener('click', open);
    if (btnOpen) btnOpen.addEventListener('click', open);
    if (btnFooter) btnFooter.addEventListener('click', open);
  }

  function open() {
    if (modalLgpd) modalLgpd.style.display = 'flex';
  }

  function close() {
    if (modalLgpd) modalLgpd.style.display = 'none';
  }

  return {
    init,
    open,
    close
  };
})();
