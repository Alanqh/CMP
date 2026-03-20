'use strict';
// CMP 原型 - 公共工具函数与全局状态

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

function email(username) {
  return username ? username + '@sohu-inc.com' : '';
}
