'use strict';
// CMP 原型 - 公共工具函数与全局状态

// ===== 邮箱格式化 =====
function email(username) {
  if (!username) return '';
  return username + '@sohu.com';
}

// ===== 资源页 Tab 切换（供 init.js 暴露全局用） =====
function switchResTab(el, tab) {
  if (el && el.parentElement) {
    el.parentElement.querySelectorAll('.ant-tabs-tab').forEach(function (t) { t.classList.remove('active'); });
    el.classList.add('active');
  }
}

var pageCache = {};
var modalCache = {};
var currentPage = 'org';

// 页面状态
var state = {
  org: { selectedOrgId: 'dept-infra', memberKeyword: '', memberPage: 1 },
  cloud: { subStatusFilter: '', deptFilter: '', activeTab: 'main' },
  project: { keyword: '', deptFilter: '' },
  resource: { keyword: '', typeFilter: '', groupFilter: '', projectFilter: '', page: 1 },
  orphan: { keyword: '', typeFilter: '' },
  audit: { keyword: '', typeFilter: '', deptFilter: '', dateFrom: '2026-03-01', dateTo: '2026-03-16', page: 1 },
  user: { keyword: '', statusFilter: '', deptFilter: '', page: 1 },
  ticket: { keyword: '', typeFilter: '', statusFilter: '', deptFilter: '', activeTab: 'all', page: 1 },
  deptConfig: { selectedDept: 'dept-infra', activeTab: 'account', tplCollapsed: {}, approvalCollapsed: {} },
  resConfig: { activeTab: 'template', editingTemplate: null, tplCollapsed: {}, flowCollapsed: {} },
  catalogCollapsed: {},
  applyRecords: { keyword: '', statusFilter: '', typeFilter: '', page: 1 },
  reviewRecords: { keyword: '', statusFilter: '', page: 1 }
};

var PAGE_SIZE = 10;

// ===== 消息提示 =====
function showMessage(text, type) {
  type = type || 'success';
  var colors = { success: '#52c41a', error: '#ff4d4f', warning: '#faad14', info: '#1890ff' };
  var bgColors = { success: '#f6ffed', error: '#fff2f0', warning: '#fffbe6', info: '#e6f7ff' };
  var msg = document.createElement('div');
  msg.style.cssText = 'position:fixed;top:60px;left:50%;transform:translateX(-50%);z-index:9999;padding:8px 16px;border-radius:4px;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,0.15);transition:opacity 0.3s;border:1px solid ' + colors[type] + ';background:' + bgColors[type] + ';color:' + colors[type];
  msg.textContent = text;
  document.body.appendChild(msg);
  setTimeout(function () { msg.style.opacity = '0'; setTimeout(function () { msg.remove(); }, 300); }, 3000);
}

// ===== 通用分页渲染 =====
function renderPagination(container, total, currentPage, pageSize, onChange) {
  var totalPages = Math.ceil(total / pageSize) || 1;
  var html = '<div class="ant-pagination"><span class="ant-pagination-info">共 ' + total + ' 条</span>';
  html += '<div class="ant-pagination-item" data-page="prev">&lt;</div>';
  var startPage = Math.max(1, currentPage - 2);
  var endPage = Math.min(totalPages, startPage + 4);
  if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);
  for (var i = startPage; i <= endPage; i++) {
    html += '<div class="ant-pagination-item' + (i === currentPage ? ' active' : '') + '" data-page="' + i + '">' + i + '</div>';
  }
  if (endPage < totalPages) {
    html += '<div class="ant-pagination-item">...</div>';
    html += '<div class="ant-pagination-item" data-page="' + totalPages + '">' + totalPages + '</div>';
  }
  html += '<div class="ant-pagination-item" data-page="next">&gt;</div></div>';
  container.innerHTML = html;
  container.querySelectorAll('.ant-pagination-item[data-page]').forEach(function (el) {
    el.onclick = function () {
      var p = el.getAttribute('data-page');
      var newPage = currentPage;
      if (p === 'prev') newPage = Math.max(1, currentPage - 1);
      else if (p === 'next') newPage = Math.min(totalPages, currentPage + 1);
      else newPage = parseInt(p);
      if (newPage !== currentPage) onChange(newPage);
    };
  });
}

// ===== HTML 转义 =====
function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ===== 全局自定义下拉升级器 =====
// 将所有 select.ant-select 替换为自定义下拉，保留原生 select 在 DOM 中以兼容现有 JS 读写
(function () {
  function upgradeSelect(el) {
    if (el._csd || el.multiple || el.size > 1) return;
    el._csd = true;
    var disabled = el.disabled;

    // 外层包裹：有内联 min-width/width 时用 inline-block，否则 block 填满父容器
    var wrap = document.createElement('div');
    wrap.className = 'csd-wrap';
    if (el.style.minWidth || el.style.width) {
      wrap.style.cssText = 'position:relative;display:inline-block;vertical-align:middle;box-sizing:border-box;';
    } else {
      wrap.style.cssText = 'position:relative;display:block;width:100%;box-sizing:border-box;';
    }
    if (el.style.width) wrap.style.width = el.style.width;
    if (el.style.minWidth) wrap.style.minWidth = el.style.minWidth;
    if (el.style.maxWidth) wrap.style.maxWidth = el.style.maxWidth;
    el.parentNode.insertBefore(wrap, el);
    wrap.appendChild(el);

    // 隐藏原生 select，保留以供 JS 读写 .value / .options
    el.style.cssText = 'position:absolute;width:0;height:0;opacity:0;pointer-events:none;left:0;top:0;';

    // 触发框
    var trigger = document.createElement('div');
    trigger.className = 'csd-trigger';
    trigger.style.cssText = 'display:flex;align-items:center;width:100%;height:32px;padding:0 10px;border:1px solid #d9d9d9;border-radius:4px;background:' + (disabled ? '#f5f5f5' : '#fff') + ';cursor:' + (disabled ? 'not-allowed' : 'pointer') + ';font-size:14px;transition:border-color .2s;box-sizing:border-box;gap:6px;color:' + (disabled ? '#bfbfbf' : 'var(--text-color)') + ';user-select:none;';
    var trigLabel = document.createElement('span');
    trigLabel.style.cssText = 'flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
    var arrow = document.createElement('span');
    arrow.innerHTML = '&#9660;';
    arrow.style.cssText = 'font-size:10px;color:#bfbfbf;flex-shrink:0;transition:transform .2s;';
    trigger.appendChild(trigLabel);
    if (!disabled) trigger.appendChild(arrow);

    // 下拉面板
    var panel = document.createElement('div');
    panel.setAttribute('data-csd-panel', '1');
    panel.style.cssText = 'display:none;position:absolute;top:calc(100% + 2px);left:0;right:0;z-index:9999;background:#fff;border:1px solid #d9d9d9;border-radius:4px;box-shadow:0 4px 12px rgba(0,0,0,.12);max-height:260px;overflow-y:auto;';

    function updateTrigger() {
      var opt = el.options[el.selectedIndex];
      if (!opt) return;
      trigLabel.textContent = opt.textContent;
      trigLabel.style.color = (opt.value || !opt.disabled) ? (disabled ? '#bfbfbf' : 'var(--text-color)') : '#bfbfbf';
    }

    function buildPanel() {
      panel.innerHTML = '';
      Array.prototype.forEach.call(el.options, function (opt) {
        if (!opt.value && opt.disabled) return; // 占位符不展示
        var v = opt.value;
        var isSelected = el.value === v && v !== '';
        var isOptDisabled = opt.disabled;
        var item = document.createElement('div');
        item.style.cssText = 'padding:7px 12px;font-size:14px;cursor:' + (isOptDisabled ? 'not-allowed' : 'pointer') + ';color:' + (isOptDisabled ? '#bfbfbf' : (isSelected ? '#1890ff' : 'var(--text-color)')) + ';background:' + (isSelected ? '#e6f7ff' : '') + ';';
        item.textContent = opt.textContent;
        if (!isOptDisabled) {
          item.onmouseenter = function () { if (el.value !== v) item.style.background = '#f5f5f5'; };
          item.onmouseleave = function () { item.style.background = el.value === v ? '#e6f7ff' : ''; item.style.color = el.value === v ? '#1890ff' : 'var(--text-color)'; };
          item.onclick = function (e) {
            e.stopPropagation();
            el.value = v; // 触发我们的 setter → updateTrigger
            closePanel();
            el.dispatchEvent(new Event('change', { bubbles: true }));
          };
        }
        panel.appendChild(item);
      });
    }

    function openPanel() {
      document.querySelectorAll('[data-csd-panel]').forEach(function (p) { p.style.display = 'none'; });
      document.querySelectorAll('.csd-trigger[data-open]').forEach(function (t) { t.removeAttribute('data-open'); t.style.borderColor = '#d9d9d9'; });
      document.querySelectorAll('.csd-arrow-open').forEach(function (a) { a.classList.remove('csd-arrow-open'); a.style.transform = ''; });
      buildPanel();
      panel.style.display = 'block';
      trigger.style.borderColor = 'var(--primary-color)';
      trigger.setAttribute('data-open', '1');
      arrow.style.transform = 'rotate(180deg)';
      arrow.classList.add('csd-arrow-open');
    }

    function closePanel() {
      panel.style.display = 'none';
      trigger.style.borderColor = '#d9d9d9';
      trigger.removeAttribute('data-open');
      arrow.style.transform = '';
      arrow.classList.remove('csd-arrow-open');
    }

    if (!disabled) {
      trigger.onclick = function (e) {
        e.stopPropagation();
        if (panel.style.display !== 'none') closePanel(); else openPanel();
      };
      trigger.onmouseenter = function () { if (!trigger.getAttribute('data-open')) trigger.style.borderColor = 'var(--primary-color)'; };
      trigger.onmouseleave = function () { if (!trigger.getAttribute('data-open')) trigger.style.borderColor = '#d9d9d9'; };
    }

    wrap.appendChild(trigger);
    wrap.appendChild(panel);

    // 监听 options 变化（动态填充时重建）
    new MutationObserver(function () { updateTrigger(); }).observe(el, { childList: true, subtree: true });

    // 拦截 el.value = 'x'（JS 赋值时同步更新展示）
    try {
      var nativeDesc = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
      Object.defineProperty(el, 'value', {
        get: function () { return nativeDesc.get.call(el); },
        set: function (v) { nativeDesc.set.call(el, v); updateTrigger(); },
        configurable: true
      });
    } catch (e) {}

    updateTrigger();
  }

  function upgradeAll(root) {
    (root || document).querySelectorAll('select.ant-select').forEach(function (el) {
      if (!el._csd) upgradeSelect(el);
    });
  }

  // 点击其他区域关闭所有面板
  document.addEventListener('click', function () {
    document.querySelectorAll('[data-csd-panel]').forEach(function (p) { p.style.display = 'none'; });
    document.querySelectorAll('.csd-trigger[data-open]').forEach(function (t) { t.removeAttribute('data-open'); t.style.borderColor = '#d9d9d9'; });
    document.querySelectorAll('.csd-arrow-open').forEach(function (a) { a.classList.remove('csd-arrow-open'); a.style.transform = ''; });
  });

  // 监听 DOM 新增节点，自动升级
  new MutationObserver(function (mutations) {
    var added = false;
    mutations.forEach(function (m) { if (m.addedNodes.length) added = true; });
    if (added) upgradeAll(document.body);
  }).observe(document.body, { childList: true, subtree: true });

  document.addEventListener('DOMContentLoaded', function () { upgradeAll(); });

  window.upgradeAllSelects = upgradeAll;
})();

