// ==========================================================================
// Componente: Barra Secundária de Ações em Páginas (App.ActionBar)
// ==========================================================================

window.App = window.App || {};

App.ActionBar = (function () {
  function init() {
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

    const btnSelectAll = document.getElementById('btnSelectAll');
    const btnDeselectAll = document.getElementById('btnDeselectAll');
    const btnInvertSelection = document.getElementById('btnInvertSelection');
    const btnClearAllPages = document.getElementById('btnClearAllPages');

    const zoomRange = document.getElementById('zoomRange');

    // Rotação & Espelhamento
    if (btnRotateRight) btnRotateRight.addEventListener('click', () => rotatePages(90));
    if (btnRotateLeft) btnRotateLeft.addEventListener('click', () => rotatePages(-90));
    if (btnRotate180) btnRotate180.addEventListener('click', () => rotatePages(180));
    if (btnFlipH) btnFlipH.addEventListener('click', () => flipPages('H'));
    if (btnFlipV) btnFlipV.addEventListener('click', () => flipPages('V'));

    // Ordenação e Duplex
    if (btnInterleave) btnInterleave.addEventListener('click', executeInterleave);
    if (btnDeinterleave) btnDeinterleave.addEventListener('click', executeDeinterleave);
    if (btnReverse) btnReverse.addEventListener('click', executeReverseOrder);

    // Movimentação, Duplicação, Exclusão
    if (btnMoveUp) btnMoveUp.addEventListener('click', () => movePages(-1));
    if (btnMoveDown) btnMoveDown.addEventListener('click', () => movePages(1));
    if (btnDuplicate) btnDuplicate.addEventListener('click', duplicatePages);
    if (btnDeleteSelected) btnDeleteSelected.addEventListener('click', deletePages);

    // Seleção
    if (btnSelectAll) btnSelectAll.addEventListener('click', () => App.State.selectAll(true));
    if (btnDeselectAll) btnDeselectAll.addEventListener('click', () => App.State.selectAll(false));
    if (btnInvertSelection) btnInvertSelection.addEventListener('click', () => App.State.invertSelection());
    if (btnClearAllPages) {
      btnClearAllPages.addEventListener('click', () => {
        if (App.State.getPages().length === 0) return;
        if (confirm('Deseja realmente remover todas as páginas do projeto?')) {
          App.State.clearAll();
          App.Utils.showToast('Todas as páginas foram removidas.', 'default');
        }
      });
    }

    // Zoom
    if (zoomRange) {
      zoomRange.addEventListener('input', (e) => {
        document.documentElement.style.setProperty('--thumb-size', e.target.value + 'px');
      });
    }

    // Atualização de contadores reativos
    App.State.on('pagesChanged', updateStats);
    App.State.on('selectionChanged', updateStats);
    updateStats();
  }

  function updateStats() {
    const pageCountText = document.getElementById('pageCountText');
    const selectionCountText = document.getElementById('selectionCountText');
    const total = App.State.getPages().length;
    const selected = App.State.getSelectedPages().length;

    if (pageCountText) {
      pageCountText.innerHTML = `<strong>${total}</strong> página(s) no documento`;
    }
    if (selectionCountText) {
      selectionCountText.textContent = selected === 0 ? 'Nenhuma selecionada' : `${selected} selecionada(s)`;
    }
  }

  function rotatePages(degrees) {
    const targets = App.State.getActivePages();
    if (targets.length === 0) return;

    targets.forEach(p => {
      p.rotation = (p.rotation + degrees + 360) % 360;
    });
    App.State.emit('pagesChanged', App.State.getPages());
    App.Utils.showToast(`Páginas rotacionadas em ${degrees > 0 ? '+' : ''}${degrees}°.`, 'default');
  }

  function flipPages(direction) {
    const targets = App.State.getActivePages();
    if (targets.length === 0) return;

    targets.forEach(p => {
      if (direction === 'H') p.flipH = !p.flipH;
      if (direction === 'V') p.flipV = !p.flipV;
    });
    App.State.emit('pagesChanged', App.State.getPages());
    App.Utils.showToast(`Espelhado ${direction === 'H' ? 'horizontalmente' : 'verticalmente'}.`, 'default');
  }

  function movePages(direction) {
    const pages = App.State.getPages().slice();
    const selected = App.State.getSelectedPages();
    if (selected.length === 0) return;

    if (direction < 0) {
      for (let i = 0; i < pages.length; i++) {
        if (pages[i].selected && i > 0 && !pages[i - 1].selected) {
          const temp = pages[i];
          pages[i] = pages[i - 1];
          pages[i - 1] = temp;
        }
      }
    } else {
      for (let i = pages.length - 1; i >= 0; i--) {
        if (pages[i].selected && i < pages.length - 1 && !pages[i + 1].selected) {
          const temp = pages[i];
          pages[i] = pages[i + 1];
          pages[i + 1] = temp;
        }
      }
    }

    App.State.setPages(pages);
  }

  function duplicatePages() {
    const selected = App.State.getSelectedPages();
    if (selected.length === 0) {
      App.Utils.showToast('Selecione as páginas que deseja duplicar.', 'error');
      return;
    }

    const pages = App.State.getPages();
    const newPages = [];
    pages.forEach(page => {
      newPages.push(page);
      if (page.selected) {
        const cloned = {
          ...page,
          id: 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8),
          originalCanvas: App.Utils.cloneCanvas(page.originalCanvas),
          processedCanvas: App.Utils.cloneCanvas(page.processedCanvas),
          selected: false
        };
        newPages.push(cloned);
      }
    });

    App.State.setPages(newPages);
    App.Utils.showToast(`${selected.length} página(s) duplicada(s).`, 'success');
  }

  function deletePages() {
    const selected = App.State.getSelectedPages();
    if (selected.length === 0) {
      App.Utils.showToast('Selecione as páginas que deseja excluir.', 'error');
      return;
    }

    if (confirm(`Excluir as ${selected.length} página(s) selecionada(s)?`)) {
      App.State.deleteSelected();
      App.Utils.showToast('Páginas excluídas.', 'default');
    }
  }

  function executeReverseOrder() {
    const pages = App.State.getPages().slice();
    const selected = App.State.getSelectedPages();

    if (selected.length > 1) {
      const indices = [];
      pages.forEach((p, idx) => { if (p.selected) indices.push(idx); });
      const reversed = indices.slice().reverse();
      const clonedPages = pages.slice();
      indices.forEach((origIdx, i) => {
        pages[origIdx] = clonedPages[reversed[i]];
      });
    } else {
      pages.reverse();
    }

    App.State.setPages(pages);
    App.Utils.showToast('Ordem das páginas invertida!', 'default');
  }

  function executeInterleave() {
    const pages = App.State.getPages();
    if (pages.length < 2) {
      App.Utils.showToast('São necessárias pelo menos 2 páginas para intercalar.', 'error');
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

    App.State.setPages(interleaved);
    App.Utils.showToast('Páginas duplex intercaladas com sucesso!', 'success');
  }

  function executeDeinterleave() {
    const pages = App.State.getPages();
    if (pages.length < 2) return;

    const odds = [];
    const evens = [];

    pages.forEach((p, idx) => {
      if (idx % 2 === 0) odds.push(p);
      else evens.push(p);
    });

    App.State.setPages(odds.concat(evens));
    App.Utils.showToast('Páginas desintercaladas (ímpares e pares separadas).', 'default');
  }

  return {
    init,
    rotatePages,
    flipPages,
    movePages,
    duplicatePages,
    deletePages,
    executeReverseOrder,
    executeInterleave,
    executeDeinterleave
  };
})();
