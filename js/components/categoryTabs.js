// ==========================================================================
// Componente: Seletor de Categorias Estilo Docs/Excel para Mobile
// (App.CategoryTabs)
// ==========================================================================

window.App = window.App || {};

App.CategoryTabs = (function () {
  let tabsBar = null;
  let tabButtons = [];
  let currentTab = 'pages';

  function init() {
    tabsBar = document.getElementById('categoryTabsBar');
    if (!tabsBar) return;

    tabButtons = Array.from(tabsBar.querySelectorAll('.cat-tab-btn'));
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;
        if (targetTab) {
          switchTab(targetTab);
        }
      });
    });

    // Se estiver em tela mobile, aplica o painel inicial
    applyTabVisibility();
    window.addEventListener('resize', applyTabVisibility);
  }

  function switchTab(tabName) {
    currentTab = tabName;
    tabButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    applyTabVisibility();
  }

  function applyTabVisibility() {
    const isMobile = window.innerWidth <= 768;
    const categoryElements = document.querySelectorAll('[data-category]');

    categoryElements.forEach(el => {
      if (!isMobile) {
        // Desktop: remove overrides para restaurar layout natural da Ribbon e Action Bar
        el.style.display = '';
        el.classList.remove('mobile-active-category', 'mobile-hidden-category');
      } else {
        // Mobile: exibe apenas o elemento correspondente à aba ativa
        const elCategory = el.dataset.category;
        const isActive = elCategory === currentTab;
        
        if (isActive) {
          el.style.display = el.dataset.displayType || (el.tagName === 'NAV' || el.tagName === 'SECTION' ? 'flex' : 'flex');
          el.classList.add('mobile-active-category');
          el.classList.remove('mobile-hidden-category');
        } else {
          el.style.display = 'none';
          el.classList.add('mobile-hidden-category');
          el.classList.remove('mobile-active-category');
        }
      }
    });

    // Ajusta o wrapper .naps-ribbon se a aba selecionada for da ribbon ou da action bar
    const ribbon = document.querySelector('.naps-ribbon');
    if (ribbon && isMobile) {
      const isRibbonTab = ['import', 'export', 'tools'].includes(currentTab);
      ribbon.style.display = isRibbonTab ? 'flex' : 'none';
    } else if (ribbon && !isMobile) {
      ribbon.style.display = 'flex';
    }

    const actionBar = document.querySelector('.page-action-bar');
    if (actionBar && isMobile) {
      actionBar.style.display = currentTab === 'pages' ? 'flex' : 'none';
    } else if (actionBar && !isMobile) {
      actionBar.style.display = 'flex';
    }
  }

  return {
    init,
    switchTab,
    getCurrentTab: () => currentTab
  };
})();
