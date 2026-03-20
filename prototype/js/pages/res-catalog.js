'use strict';
// CMP 原型 - 资源目录页（只读，数据从后端接口同步）

// =============================================
// 资源目录页
// =============================================
function initResCatalogPage() {
  renderResCatalog();
  var syncBtn = document.getElementById('catalog-sync-btn');
  if (syncBtn) {
    syncBtn.onclick = function () {
      syncBtn.disabled = true;
      syncBtn.textContent = '同步中...';
      setTimeout(function () {
        syncBtn.disabled = false;
        syncBtn.textContent = '同步刷新';
        showMessage('资源目录已与后端同步', 'success');
        renderResCatalog();
      }, 800);
    };
  }
}

function renderResCatalog() {
  var container = document.getElementById('catalog-container');
  if (!container) return;
  var catalog = MockData.resCatalog;
  var html = '';
  catalog.forEach(function (cat, catIdx) {
    var totalTypes = cat.types.length;
    var applyCount = cat.types.filter(function (t) { return t.allowApply; }).length;
    var isExpanded = !state.catalogCollapsed || !state.catalogCollapsed[catIdx];
    html += '<div class="catalog-category-section">';
    html += '<div class="catalog-category-header" data-cat-toggle="' + catIdx + '">';
    html += '<div class="catalog-category-left">';
    html += '<span class="catalog-category-arrow' + (isExpanded ? ' expanded' : '') + '">&#8250;</span>';
    html += '<span style="font-weight:500;font-size:14px;color:' + cat.color + ';">' + esc(cat.name) + '</span>';
    html += '<span style="font-weight:normal;font-size:12px;color:var(--text-secondary);margin-left:8px;">' + totalTypes + ' 种资源';
    if (applyCount < totalTypes) html += '，' + applyCount + ' 种可申请';
    html += '</span>';
    html += '</div>';
    html += '</div>';
    html += '<div class="catalog-category-body' + (isExpanded ? '' : ' collapsed') + '" data-cat-body="' + catIdx + '">';
    html += '<table class="ant-table" style="table-layout:fixed;"><thead><tr>';
    html += '<th style="width:22%;">资源类型</th>';
    html += '<th style="width:10%;">云厂商</th>';
    html += '<th style="width:20%;">云上查询接口</th>';
    html += '<th style="width:24%;">需要审批的操作</th>';
    html += '<th style="width:24%;">不需要审批的操作</th>';
    html += '</tr></thead><tbody>';
    if (cat.types.length === 0) {
      html += '<tr><td colspan="5" style="text-align:center;color:var(--text-secondary);padding:20px;">该大类下暂无资源类型</td></tr>';
    }
    cat.types.forEach(function (t) {
      var aOps = t.approvalOps || [];
      var nOps = (t.operations || []).filter(function (op) { return aOps.indexOf(op) === -1; });
      html += '<tr>';
      html += '<td><strong>' + esc(t.name) + '</strong></td>';
      html += '<td><span class="ant-tag ant-tag-blue">' + esc(t.vendor) + '</span></td>';
      html += '<td><code style="font-size:12px;color:#1890ff;">' + esc(t.queryApi || '') + '</code></td>';
      html += '<td>' + (aOps.length ? aOps.map(function (op) { return '<span class="ant-tag ant-tag-orange">' + esc(op) + '</span>'; }).join(' ') : '<span style="color:var(--text-secondary);">无</span>') + '</td>';
      html += '<td>' + (nOps.length ? nOps.map(function (op) { return '<span class="ant-tag ant-tag-default">' + esc(op) + '</span>'; }).join(' ') : '<span style="color:var(--text-secondary);">无</span>') + '</td>';
      html += '</tr>';
      // 子资源行
      var children = t.children || [];
      children.forEach(function (child, childIdx) {
        var connector = childIdx === children.length - 1 ? '└─' : '├─';
        var cAOps = child.approvalOps || [];
        var cNOps = (child.operations || []).filter(function (op) { return cAOps.indexOf(op) === -1; });
        html += '<tr class="catalog-child-row">';
        html += '<td style="padding-left:32px;color:var(--text-secondary);">' + connector + ' ' + esc(child.name) + '</td>';
        html += '<td></td>';
        html += '<td><code style="font-size:11px;color:#1890ff;">' + esc(child.queryApi || '') + '</code></td>';
        html += '<td>' + (cAOps.length ? cAOps.map(function (op) { return '<span class="ant-tag ant-tag-orange" style="font-size:11px;">' + esc(op) + '</span>'; }).join(' ') : '<span style="color:var(--text-secondary);">无</span>') + '</td>';
        html += '<td>' + (cNOps.length ? cNOps.map(function (op) { return '<span class="ant-tag ant-tag-default" style="font-size:11px;">' + esc(op) + '</span>'; }).join(' ') : '<span style="color:var(--text-secondary);">无</span>') + '</td>';
        html += '</tr>';
      });
    });
    html += '</tbody></table>';
    html += '</div></div>';
  });
  container.innerHTML = html;

  // 绑定大类折叠/展开
  container.querySelectorAll('.catalog-category-header').forEach(function (header) {
    header.onclick = function () {
      var catIdx = parseInt(header.getAttribute('data-cat-toggle'));
      if (!state.catalogCollapsed) state.catalogCollapsed = {};
      var body = container.querySelector('[data-cat-body="' + catIdx + '"]');
      var arrow = header.querySelector('.catalog-category-arrow');
      if (body.classList.contains('collapsed')) {
        body.classList.remove('collapsed');
        arrow.classList.add('expanded');
        state.catalogCollapsed[catIdx] = false;
      } else {
        body.classList.add('collapsed');
        arrow.classList.remove('expanded');
        state.catalogCollapsed[catIdx] = true;
      }
    };
  });
}
