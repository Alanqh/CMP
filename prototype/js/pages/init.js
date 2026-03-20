'use strict';
// CMP 原型 - 初始化入口

// ===== 初始化 =====
function init() {
  initSidebar();
  loadPage('org');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// 暴露全局函数
window.switchPage = switchPage;
window.switchTab = switchTab;
window.switchResTab = switchResTab;
window.showModal = loadAndShowModal;
window.hideModal = hideModal;
window.showMessage = showMessage;
