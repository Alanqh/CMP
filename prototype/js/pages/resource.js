'use strict';
// CMP 原型 - 资源管理页

// =============================================
// 资源管理页
// =============================================
function initResourcePage() {
  renderResources();
  var applyBtn = document.getElementById('btn-apply-resource');
  if (applyBtn) applyBtn.onclick = function () { pageCache['apply-resource'] = null; loadPage('apply-resource'); };
  var searchInput = document.getElementById('resource-search');
  if (searchInput) searchInput.oninput = function () { state.resource.keyword = searchInput.value; state.resource.page = 1; renderResources(); };
  var typeFilter = document.getElementById('resource-type-filter');
  if (typeFilter) typeFilter.onchange = function () { state.resource.typeFilter = typeFilter.value; state.resource.page = 1; renderResources(); };
  var groupFilter = document.getElementById('resource-group-filter');
  if (groupFilter) groupFilter.onchange = function () { state.resource.groupFilter = groupFilter.value; state.resource.page = 1; renderResources(); };
  var projectFilter = document.getElementById('resource-project-filter');
  if (projectFilter) projectFilter.onchange = function () { state.resource.projectFilter = projectFilter.value; state.resource.page = 1; renderResources(); };
}

function renderAuthorizeList(res) {
  var tbody = document.getElementById('authorize-table-body');
  if (!tbody) return;
  var auths = res.authorizations || [];
  if (auths.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-secondary);padding:16px;">暂无授权记录</td></tr>';
    return;
  }
  var html = '';
  auths.forEach(function (a, idx) {
    html += '<tr><td>' + esc(a.user) + '</td>';
    html += '<td><span class="ant-tag ant-tag-' + (a.perm === 'developer' ? 'cyan' : 'default') + '">' + esc(a.perm) + '</span></td>';
    html += '<td style="white-space:nowrap;">' + esc(a.time) + '</td>';
    html += '<td><a class="ant-btn-link authorize-remove-btn" data-idx="' + idx + '" style="color:#ff4d4f;">移除</a></td></tr>';
  });
  tbody.innerHTML = html;
  tbody.querySelectorAll('.authorize-remove-btn').forEach(function (btn) {
    btn.onclick = function () {
      var idx = parseInt(btn.getAttribute('data-idx'));
      var removedUser = res.authorizations[idx].user;
      res.authorizations.splice(idx, 1);
      renderAuthorizeList(res);
      showMessage('已移除「' + removedUser + '」的授权', 'success');
    };
  });
}

function renderResources() {
  var s = state.resource;
  var data = MockData.resources.filter(function (r) {
    if (s.keyword) {
      var kw = s.keyword.toLowerCase();
      if (r.name.toLowerCase().indexOf(kw) === -1 && r.resId.toLowerCase().indexOf(kw) === -1) return false;
    }
    if (s.typeFilter && r.type !== s.typeFilter) return false;
    if (s.groupFilter && r.group !== s.groupFilter) return false;
    if (s.projectFilter && r.project !== s.projectFilter) return false;
    return true;
  });

  // Stats
  var statsContainer = document.getElementById('resource-stats');
  if (statsContainer) {
    var ecsCount = 0, dbCount = 0, ungroupedCount = 0;
    data.forEach(function (r) {
      if (r.type === 'ECS') ecsCount++;
      else if (r.type === 'RDS' || r.type === 'Redis') dbCount++;
    });
    ungroupedCount = (MockData.ungroupedResources || []).length;
    statsContainer.innerHTML =
      '<div class="stat-card"><div class="stat-value">' + data.length + '</div><div class="stat-label">资源总数</div></div>' +
      '<div class="stat-card"><div class="stat-value">' + ecsCount + '</div><div class="stat-label">ECS 云服务器</div></div>' +
      '<div class="stat-card"><div class="stat-value">' + dbCount + '</div><div class="stat-label">数据库 / 缓存</div></div>' +
      '<div class="stat-card" id="stat-ungrouped" style="cursor:pointer;"><div class="stat-value" style="color:#1890ff;">' + ungroupedCount + '</div><div class="stat-label">未分组资源</div></div>';
    var ungroupedCard = document.getElementById('stat-ungrouped');
    if (ungroupedCard) {
      ungroupedCard.onclick = function () {
        switchPage('orphan', null);
      };
    }
  }

  var total = data.length;
  var start = (s.page - 1) * PAGE_SIZE;
  var pageData = data.slice(start, start + PAGE_SIZE);

  // 从 resCatalog 获取资源操作的辅助函数
  function getCatalogOps(resType) {
    var ops = [];
    MockData.resCatalog.forEach(function (cat) {
      cat.types.forEach(function (t) {
        if (t.name.indexOf(resType) !== -1 || resType.indexOf(t.name.split(' ')[0]) !== -1) {
          ops = (t.operations || []).filter(function (op) { return op !== '同步'; });
        }
      });
    });
    return ops;
  }

  // 渲染操作列（含"更多"折叠）
  function renderOpsCell(r, rowIdx) {
    var allOps = [];
    // 固定操作：详情始终显示
    allOps.push({ label: '详情', cls: 'resource-detail-btn', attrs: 'data-res="' + esc(r.name) + '"' });
    // 授权（master时）
    if (r.perm === 'master') allOps.push({ label: '授权', cls: 'resource-action-btn', attrs: 'data-res="' + esc(r.name) + '" data-action="授权"' });
    // 从资源目录获取操作
    var catalogOps = getCatalogOps(r.type);
    catalogOps.forEach(function (op) {
      if (op === '申请') return; // 申请不显示在已有资源的操作中
      allOps.push({ label: op, cls: 'resource-action-btn', attrs: 'data-res="' + esc(r.name) + '" data-action="' + esc(op) + '"' });
    });
    var html = '';
    if (allOps.length <= 3) {
      allOps.forEach(function (op) {
        html += '<a class="ant-btn-link ' + op.cls + '" ' + op.attrs + '>' + esc(op.label) + '</a> ';
      });
    } else {
      // 前3个直接显示
      for (var i = 0; i < 3; i++) {
        html += '<a class="ant-btn-link ' + allOps[i].cls + '" ' + allOps[i].attrs + '>' + esc(allOps[i].label) + '</a> ';
      }
      // 其余放入"更多"
      html += '<span style="position:relative;display:inline-block;"><a class="ant-btn-link res-more-btn" data-row="' + rowIdx + '" style="color:#1890ff;">更多 &#9660;</a>';
      html += '<div class="res-more-dropdown" data-row="' + rowIdx + '" style="display:none;position:absolute;top:100%;right:0;z-index:100;background:#fff;border:1px solid #e8e8e8;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,0.15);padding:4px 0;min-width:80px;">';
      for (var j = 3; j < allOps.length; j++) {
        html += '<a class="ant-btn-link ' + allOps[j].cls + '" ' + allOps[j].attrs + ' style="display:block;padding:4px 12px;white-space:nowrap;">' + esc(allOps[j].label) + '</a>';
      }
      html += '</div></span>';
    }
    return html;
  }

  var tableContainer = document.getElementById('resource-table-container');
  if (!tableContainer) return;
  var html = '<table class="ant-table"><thead><tr><th class="check-col"><input type="checkbox" id="resource-select-all" /></th><th>资源名称</th><th>资源类型</th><th>所属组</th><th>所属资源组</th><th>申请人</th><th>我的权限</th><th>状态</th><th>操作</th></tr></thead><tbody>';
  if (pageData.length === 0) {
    html += '<tr><td colspan="9" style="text-align:center;color:var(--text-secondary);padding:32px;">暂无数据</td></tr>';
  }
  var rowIdx = 0;
  pageData.forEach(function (r) {
    html += '<tr><td class="check-col"><input type="checkbox" class="resource-row-check" /></td>';
    html += '<td><a class="link">' + esc(r.name) + '</a><div style="font-size:12px;color:var(--text-secondary);">' + esc(r.resId) + '</div></td>';
    html += '<td><span class="ant-tag ant-tag-' + r.typeColor + '">' + esc(r.type) + '</span></td>';
    html += '<td>' + esc(r.group) + '</td><td>' + esc(r.project) + '</td>';
    html += '<td>' + (r.applicant ? esc(r.applicant) : '--') + '</td>';
    html += '<td><span class="ant-tag ant-tag-' + r.permColor + '"' +
      (r.perm === 'master' && (r.type === 'RDS' || r.type === 'Redis' || r.type === 'Kafka' || r.type === 'ES' || r.type === 'PG' || r.type === 'MongoDB') ? ' title="数据库/中间件 master 权限仅组长和部门负责人可持有" style="cursor:help;"' : '') +
      '>' + esc(r.perm) + '</span></td>';
    html += '<td><span class="ant-badge-status-dot ant-badge-status-' + r.statusClass + '"></span>' + esc(r.status) + '</td>';
    html += '<td>' + renderOpsCell(r, rowIdx) + '</td></tr>';
    rowIdx++;
    // 子资源行
    if (r.children && r.children.length) {
      r.children.forEach(function (child, childIdx) {
        var connector = childIdx === r.children.length - 1 ? '└─' : '├─';
        html += '<tr style="background:#fafafa;"><td class="check-col"></td>';
        html += '<td style="padding-left:28px;"><span style="color:var(--text-secondary);">' + connector + '</span> <a class="link">' + esc(child.name) + '</a><div style="font-size:12px;color:var(--text-secondary);padding-left:22px;">' + esc(child.resId) + '</div></td>';
        html += '<td><span class="ant-tag ant-tag-' + child.typeColor + '" style="font-size:11px;">' + esc(child.type) + '</span></td>';
        html += '<td style="color:var(--text-secondary);font-size:12px;">--</td>';
        html += '<td style="color:var(--text-secondary);font-size:12px;">--</td>';
        html += '<td style="color:var(--text-secondary);font-size:12px;">--</td>';
        html += '<td style="color:var(--text-secondary);font-size:12px;">--</td>';
        html += '<td><span class="ant-badge-status-dot ant-badge-status-' + child.statusClass + '"></span>' + esc(child.status) + '</td>';
        html += '<td><a class="ant-btn-link resource-detail-btn" data-res="' + esc(child.name) + '">详情</a></td></tr>';
        rowIdx++;
      });
    }
  });
  html += '</tbody></table><div id="resource-pagination"></div>';
  tableContainer.innerHTML = html;

  // Select all checkbox
  var selectAll = document.getElementById('resource-select-all');
  if (selectAll) {
    selectAll.onchange = function () {
      tableContainer.querySelectorAll('.resource-row-check').forEach(function (cb) { cb.checked = selectAll.checked; });
    };
  }

  // 绑定资源详情按钮
  tableContainer.querySelectorAll('.resource-detail-btn').forEach(function (btn) {
    btn.onclick = function () {
      var resName = btn.getAttribute('data-res');
      var res = null;
      for (var i = 0; i < MockData.resources.length; i++) {
        if (MockData.resources[i].name === resName) { res = MockData.resources[i]; break; }
      }
      if (!res) return;
      loadAndShowModal('resource/view-resource', function () {
        var titleEl = document.getElementById('resource-detail-title');
        if (titleEl) titleEl.textContent = '资源详情 - ' + resName;
        var bodyEl = document.getElementById('resource-detail-body');
        if (bodyEl) bodyEl.innerHTML =
          '<div class="ant-descriptions-row"><div class="ant-descriptions-label">资源名称</div><div class="ant-descriptions-content">' + esc(res.name) + '</div></div>' +
          '<div class="ant-descriptions-row"><div class="ant-descriptions-label">资源ID</div><div class="ant-descriptions-content" style="font-family:monospace;font-size:12px;">' + esc(res.resId) + '</div></div>' +
          '<div class="ant-descriptions-row"><div class="ant-descriptions-label">资源类型</div><div class="ant-descriptions-content"><span class="ant-tag ant-tag-' + res.typeColor + '">' + esc(res.type) + '</span></div></div>' +
          '<div class="ant-descriptions-row"><div class="ant-descriptions-label">所属组</div><div class="ant-descriptions-content">' + esc(res.group) + '</div></div>' +
          '<div class="ant-descriptions-row"><div class="ant-descriptions-label">所属资源组</div><div class="ant-descriptions-content">' + esc(res.project) + '</div></div>' +
          '<div class="ant-descriptions-row"><div class="ant-descriptions-label">我的权限</div><div class="ant-descriptions-content"><span class="ant-tag ant-tag-' + res.permColor + '">' + esc(res.perm) + '</span></div></div>' +
          '<div class="ant-descriptions-row"><div class="ant-descriptions-label">状态</div><div class="ant-descriptions-content"><span class="ant-badge-status-dot ant-badge-status-' + res.statusClass + '"></span>' + esc(res.status) + '</div></div>';
      });
    };
  });

  // 绑定资源操作按钮
  tableContainer.querySelectorAll('.resource-action-btn').forEach(function (btn) {
    btn.onclick = function () {
      var resName = btn.getAttribute('data-res');
      var action = btn.getAttribute('data-action');
      if (action === '授权') {
        var res = null;
        for (var i = 0; i < MockData.resources.length; i++) {
          if (MockData.resources[i].name === resName) { res = MockData.resources[i]; break; }
        }
        if (!res) return;
        if (!res.authorizations) res.authorizations = [];
        loadAndShowModal('resource/authorize', function () {
          document.getElementById('authorize-title').textContent = '资源授权 - ' + resName;
          renderAuthorizeList(res);
          var addBtn = document.getElementById('authorize-add-btn');
          if (addBtn) {
            addBtn.onclick = function () {
              var userSel = document.getElementById('authorize-user-select');
              var permSel = document.getElementById('authorize-perm-select');
              if (!userSel.value) { showMessage('请选择用户', 'warning'); return; }
              // check duplicate
              for (var j = 0; j < res.authorizations.length; j++) {
                if (res.authorizations[j].user === userSel.value) { showMessage('该用户已授权', 'warning'); return; }
              }
              var now = new Date();
              var timeStr = now.getFullYear() + '/' + String(now.getMonth() + 1).padStart(2, '0') + '/' + String(now.getDate()).padStart(2, '0') + ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
              res.authorizations.push({ user: userSel.value, perm: permSel.value, time: timeStr });
              renderAuthorizeList(res);
              userSel.value = '';
              showMessage('已授权「' + res.authorizations[res.authorizations.length - 1].user + '」', 'success');
            };
          }
        });
        return;
      }
      showMessage('「' + resName + '」' + action + ' - 功能开发中', 'info');
    };
  });

  // 绑定"更多"下拉菜单
  tableContainer.querySelectorAll('.res-more-btn').forEach(function (btn) {
    btn.onclick = function (e) {
      e.stopPropagation();
      var rowId = btn.getAttribute('data-row');
      var dropdown = tableContainer.querySelector('.res-more-dropdown[data-row="' + rowId + '"]');
      if (!dropdown) return;
      var isVisible = dropdown.style.display !== 'none';
      // 先关闭所有
      tableContainer.querySelectorAll('.res-more-dropdown').forEach(function (d) { d.style.display = 'none'; });
      if (!isVisible) dropdown.style.display = 'block';
    };
  });
  // 点击页面其他地方关闭下拉
  document.addEventListener('click', function () {
    tableContainer.querySelectorAll('.res-more-dropdown').forEach(function (d) { d.style.display = 'none'; });
  });

  // Pagination
  var pagEl = document.getElementById('resource-pagination');
  if (pagEl) renderPagination(pagEl, total, s.page, PAGE_SIZE, function (p) { s.page = p; renderResources(); });
}
