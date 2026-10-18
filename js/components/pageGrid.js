// ==========================================================================
// Componente: Grade Visual de Miniaturas por Página (App.PageGrid)
// ==========================================================================

window.App = window.App || {};

App.PageGrid = (function () {
  let gridEl = null;
  let emptyStateEl = null;
  let sortableInstance = null;

  function init() {
    gridEl = document.getElementById('pageGrid');
    emptyStateEl = document.getElementById('emptyState');

    if (window.Sortable && gridEl) {
      sortableInstance = new Sortable(gridEl, {
        animation: 200,
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        delay: 200,
        delayOnTouchOnly: true,
        touchStartThreshold: 5,
        onEnd: () => syncOrderFromDOM()
      });
    }

    App.State.on('pagesChanged', () => render());
    App.State.on('selectionChanged', () => updateSelectionVisuals());

    render();
  }

  function syncOrderFromDOM() {
    const cards = gridEl.querySelectorAll('.naps-page-card');
    const pages = App.State.getPages();
    const newOrder = [];
    cards.forEach(card => {
      const id = card.dataset.id;
      const item = pages.find(p => p.id === id);
      if (item) newOrder.push(item);
    });
    App.State.setPages(newOrder);
  }

  function render() {
    const pages = App.State.getPages();

    if (!gridEl || !emptyStateEl) return;

    if (pages.length === 0) {
      emptyStateEl.style.display = 'flex';
      gridEl.style.display = 'none';
      return;
    }

    emptyStateEl.style.display = 'none';
    gridEl.style.display = 'grid';
    gridEl.innerHTML = '';

    pages.forEach((page, index) => {
      const card = document.createElement('div');
      card.className = `naps-page-card ${page.selected ? 'selected' : ''}`;
      card.dataset.id = page.id;

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
          <span class="page-source-name" title="${App.Utils.escapeHtml(page.sourceName)}">${App.Utils.escapeHtml(page.sourceName)}</span>
          <span class="page-dims">${page.width}x${page.height} px</span>
        </div>
      `;

      card.addEventListener('click', (e) => {
        if (e.target.classList.contains('page-select-checkbox')) return;
        App.State.togglePageSelection(page, e.shiftKey || e.ctrlKey);
      });

      const checkbox = card.querySelector('.page-select-checkbox');
      checkbox.addEventListener('change', (e) => {
        page.selected = e.target.checked;
        card.classList.toggle('selected', page.selected);
        App.State.emit('selectionChanged', App.State.getSelectedPages());
      });

      card.addEventListener('dblclick', () => {
        if (App.ImageAdjustModal) App.ImageAdjustModal.open(index);
      });

      gridEl.appendChild(card);
    });

    updateSelectionVisuals();
  }

  function updateSelectionVisuals() {
    const pages = App.State.getPages();
    const selected = App.State.getSelectedPages();

    if (gridEl) {
      const cards = gridEl.querySelectorAll('.naps-page-card');
      cards.forEach((card, idx) => {
        const page = pages[idx];
        if (page) {
          card.classList.toggle('selected', !!page.selected);
          const cb = card.querySelector('.page-select-checkbox');
          if (cb) cb.checked = !!page.selected;
        }
      });
    }

    const countText = document.getElementById('pageCountText');
    const selText = document.getElementById('selectionCountText');
    if (countText) countText.innerHTML = `<strong>${pages.length}</strong> página(s) no documento`;
    if (selText) selText.textContent = selected.length === 0 ? 'Nenhuma selecionada' : `${selected.length} selecionada(s)`;
  }

  return {
    init,
    render
  };
})();
