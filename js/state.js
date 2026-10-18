// ==========================================================================
// Módulo: Gerenciamento Centralizado de Estado (App.State)
// ==========================================================================

window.App = window.App || {};

App.State = (function () {
  let pages = [];
  const listeners = {};

  function on(event, callback) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(callback);
  }

  function emit(event, data) {
    if (listeners[event]) {
      listeners[event].forEach(fn => fn(data));
    }
  }

  function getPages() {
    return pages;
  }

  function setPages(newPages) {
    pages = newPages;
    emit('pagesChanged', pages);
  }

  function addPage(page) {
    pages.push(page);
    emit('pagesChanged', pages);
  }

  function getPageByIndex(index) {
    return pages[index];
  }

  function getSelectedPages() {
    return pages.filter(p => p.selected);
  }

  function getActivePages() {
    const selected = getSelectedPages();
    return selected.length > 0 ? selected : pages;
  }

  function togglePageSelection(page, isMulti) {
    if (!isMulti) {
      pages.forEach(p => p.selected = false);
      page.selected = true;
    } else {
      page.selected = !page.selected;
    }
    emit('selectionChanged', getSelectedPages());
  }

  function selectAll(isSelected) {
    pages.forEach(p => p.selected = isSelected);
    emit('selectionChanged', getSelectedPages());
  }

  function invertSelection() {
    pages.forEach(p => p.selected = !p.selected);
    emit('selectionChanged', getSelectedPages());
  }

  function deleteSelected() {
    const selected = getSelectedPages();
    if (selected.length === 0) return 0;
    pages = pages.filter(p => !p.selected);
    emit('pagesChanged', pages);
    return selected.length;
  }

  function clearAll() {
    pages = [];
    emit('pagesChanged', pages);
  }

  return {
    on,
    emit,
    getPages,
    setPages,
    addPage,
    getPageByIndex,
    getSelectedPages,
    getActivePages,
    togglePageSelection,
    selectAll,
    invertSelection,
    deleteSelected,
    clearAll
  };
})();
