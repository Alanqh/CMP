'use strict';
// CMP 原型 - 资源管理页

// =============================================
// 资源管理页
// =============================================
function updateTypeFilterOptions() {
  var typeFilter = document.getElementById('resource-type-filter');
  if (!typeFilter) return;
  
  var currentTab = state.resource.currentTab;
  var options = [];
  
  switch (currentTab) {
    case 'ECS':
      options = [
        { value: '', label: '全部计算资源' },
        { value: 'ECS', label: 'ECS 云服务器' },
        { value: 'K8S', label: 'K8S 集群' }
      ];
      break;
    case 'RDS':
      options = [
        { value: '', label: '全部数据库' },
        { value: 'RDS', label: 'RDS 云数据库' },
        { value: 'PG', label: 'PolarDB PostgreSQL' },
        { value: 'MongoDB', label: 'MongoDB' },
        { value: 'Redis', label: 'Redis 缓存' }
      ];
      break;
    case 'SLB':
      options = [
        { value: '', label: '全部网络资源' },
        { value: 'SLB', label: 'SLB 负载均衡' },
        { value: 'ALB', label: 'ALB 应用负载均衡' },
        { value: 'NLB', label: 'NLB 网络负载均衡' }
      ];
      break;
    case 'Kafka':
      options = [
        { value: '', label: '全部中间件' },
        { value: 'Kafka', label: 'Kafka 消息队列' },
        { value: 'ES', label: 'Elasticsearch' }
      ];
      break;
    case 'MaxCompute':
      options = [
        { value: '', label: '全部大数据' },
        { value: 'MaxCompute', label: 'MaxCompute' },
        { value: 'Flink', label: 'Flink' }
      ];
      break;
    case 'OSS':
      options = [
        { value: '', label: '全部存储' },
        { value: 'OSS', label: 'OSS 对象存储' },
        { value: 'CDN', label: 'CDN 流量包' }
      ];
      break;
  }
  
  typeFilter.innerHTML = '';
  options.forEach(function (opt) {
    var option = document.createElement('option');
    option.value = opt.value;
    option.textContent = opt.label;
    typeFilter.appendChild(option);
  });
}

function initResourcePage() {
  if (!state.resource) state.resource = {};
  if (!state.resource.currentTab) state.resource.currentTab = 'ECS';
  if (!state.resource.viewMode) state.resource.viewMode = 'table';
  
  updateTypeFilterOptions();
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
  
  var tabs = document.querySelectorAll('#resource-tabs .ant-tabs-tab');
  tabs.forEach(function (tab) {
    tab.onclick = function () {
      tabs.forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      state.resource.currentTab = tab.getAttribute('data-type');
      state.resource.page = 1;
      state.resource.typeFilter = '';
      updateTypeFilterOptions();
      renderResources();
    };
  });
  
  // 仅保留表格视图
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

function getResourceGroup(type) {
  switch (type) {
    case 'ECS':
    case 'K8S':
      return '计算资源';
    case 'RDS':
    case 'PG':
    case 'MongoDB':
    case 'Redis':
      return '数据库';
    case 'SLB':
    case 'ALB':
    case 'NLB':
      return '网络';
    case 'Kafka':
    case 'ES':
      return '中间件';
    case 'MaxCompute':
    case 'Flink':
      return '大数据';
    case 'OSS':
    case 'CDN':
      return '存储';
    default:
      return '其他';
  }
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
    
    if (s.currentTab !== 'all') {
      var group = getResourceGroup(r.type);
      switch (s.currentTab) {
        case 'ECS': if (group !== '计算资源') return false; break;
        case 'RDS': if (group !== '数据库') return false; break;
        case 'SLB': if (group !== '网络') return false; break;
        case 'Kafka': if (group !== '中间件') return false; break;
        case 'MaxCompute': if (group !== '大数据') return false; break;
        case 'OSS': if (group !== '存储') return false; break;
      }
    }
    return true;
  });



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
      if (op === '创建') return; // 创建不显示在已有资源的操作中
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
  
  if (tableContainer) {
    var html = '<table class="ant-table"><thead><tr><th class="check-col"><input type="checkbox" id="resource-select-all" /></th><th>资源名称</th><th>云厂商</th><th>资源类型</th><th>所属组</th><th>所属项目</th><th>申请人</th><th>我的权限</th><th>状态</th><th>操作</th></tr></thead><tbody>';
    if (pageData.length === 0) {
      html += '<tr><td colspan="10" style="text-align:center;color:var(--text-secondary);padding:32px;">暂无数据</td></tr>';
    }
    var rowIdx = 0;
    pageData.forEach(function (r) {
      html += '<tr><td class="check-col"><input type="checkbox" class="resource-row-check" /></td>';
      html += '<td><a class="link">' + esc(r.name) + '</a><div style="font-size:12px;color:var(--text-secondary);">' + esc(r.resId) + '</div></td>';
      html += '<td>' + (r.vendor ? esc(r.vendor) : '--') + '</td>';
      html += '<td><span class="ant-tag ant-tag-' + r.typeColor + '">' + esc(r.type) + '</span></td>';
      html += '<td>' + esc(r.group) + '</td><td>' + esc(r.project) + '</td>';
      html += '<td>' + (r.applicant ? esc(r.applicant) : '--') + '</td>';
      html += '<td><span class="ant-tag ant-tag-' + r.permColor + '"' +
        (r.perm === 'master' && (r.type === 'RDS' || r.type === 'Redis' || r.type === 'Kafka' || r.type === 'ES' || r.type === 'PG' || r.type === 'MongoDB') ? ' title="数据库/中间件 master 权限仅组长和部门负责人可持有" style="cursor:help;"' : '') +
        '>' + esc(r.perm) + '</span></td>';
      html += '<td><span class="ant-badge-status-dot ant-badge-status-' + r.statusClass + '"></span>' + esc(r.status) + '</td>';
      html += '<td>' + renderOpsCell(r, rowIdx) + '</td></tr>';
      rowIdx++;
    });
    html += '</tbody></table><div id="resource-pagination"></div>';
    tableContainer.innerHTML = html;
  }

  // Select all checkbox
  var selectAll = document.getElementById('resource-select-all');
  if (selectAll) {
    selectAll.onchange = function () {
      var checkboxes = document.querySelectorAll('.resource-row-check');
      checkboxes.forEach(function (cb) { cb.checked = selectAll.checked; });
    };
  }

  // 绑定资源详情按钮
  var detailBtns = document.querySelectorAll('.resource-detail-btn');
  detailBtns.forEach(function (btn) {
    btn.onclick = function () {
      var resName = btn.getAttribute('data-res');
      var res = null;
      for (var i = 0; i < MockData.resources.length; i++) {
        if (MockData.resources[i].name === resName) { res = MockData.resources[i]; break; }
      }
      if (!res) return;
      state.currentResourceDetail = res;
      pageCache['resource-detail'] = null;
      loadPage('resource-detail');
    };
  });

  // 绑定资源操作按钮
  var actionBtns = document.querySelectorAll('.resource-action-btn');
  actionBtns.forEach(function (btn) {
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
  var moreBtns = document.querySelectorAll('.res-more-btn');
  moreBtns.forEach(function (btn) {
    btn.onclick = function (e) {
      e.stopPropagation();
      var rowId = btn.getAttribute('data-row');
      var dropdown = document.querySelector('.res-more-dropdown[data-row="' + rowId + '"]');
      if (!dropdown) return;
      var isVisible = dropdown.style.display !== 'none';
      // 先关闭所有
      document.querySelectorAll('.res-more-dropdown').forEach(function (d) { d.style.display = 'none'; });
      if (!isVisible) dropdown.style.display = 'block';
    };
  });
  // 点击页面其他地方关闭下拉
  document.addEventListener('click', function () {
    document.querySelectorAll('.res-more-dropdown').forEach(function (d) { d.style.display = 'none'; });
  });

  // Pagination
  var pagEl = document.getElementById('resource-pagination');
  if (pagEl) renderPagination(pagEl, total, s.page, PAGE_SIZE, function (p) { s.page = p; renderResources(); });
}
