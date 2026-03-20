'use strict';
// CMP 原型 - 未归组资源页

// =============================================
// 孤儿资源页
// =============================================
function initOrphanPage() {
  var backBtn = document.getElementById('orphan-back-btn');
  if (backBtn) backBtn.onclick = function () { switchPage('resource', null); };
  renderUngroupedResources();
  var searchInput = document.getElementById('orphan-search');
  if (searchInput) searchInput.oninput = function () { state.orphan.keyword = searchInput.value; renderUngroupedResources(); };
  var typeFilter = document.getElementById('orphan-type-filter');
  if (typeFilter) typeFilter.onchange = function () { state.orphan.typeFilter = typeFilter.value; renderUngroupedResources(); };
}

function renderUngroupedResources() {
  var s = state.orphan;
  var data = MockData.ungroupedResources.filter(function (r) {
    if (s.keyword) {
      var kw = s.keyword.toLowerCase();
      if (r.name.toLowerCase().indexOf(kw) === -1 && r.resId.toLowerCase().indexOf(kw) === -1) return false;
    }
    if (s.typeFilter && r.type !== s.typeFilter) return false;
    return true;
  });

  var tableContainer = document.getElementById('orphan-table-container');
  if (!tableContainer) return;
  var html = '<table class="ant-table"><thead><tr><th class="check-col"><input type="checkbox" id="orphan-select-all" /></th><th>资源名称</th><th>资源ID</th><th>资源类型</th><th>来源</th><th>归属主账号</th><th>归属部门</th><th>发现时间</th><th>操作</th></tr></thead><tbody>';
  if (data.length === 0) {
    html += '<tr><td colspan="9" style="text-align:center;color:var(--text-secondary);padding:32px;">暂无数据</td></tr>';
  }
  data.forEach(function (r, idx) {
    html += '<tr><td class="check-col"><input type="checkbox" class="orphan-row-check" /></td>';
    html += '<td>' + esc(r.name) + '</td>';
    html += '<td style="font-size:12px;color:var(--text-secondary);">' + esc(r.resId) + '</td>';
    html += '<td><span class="ant-tag ant-tag-' + r.typeColor + '">' + esc(r.type) + '</span></td>';
    html += '<td>' + esc(r.source) + '</td>';
    html += '<td><span style="font-size:12px;">' + esc(r.mainAccount || '--') + '</span></td>';
    html += '<td>' + esc(r.dept || '--') + '</td>';
    html += '<td>' + esc(r.discoverTime) + '</td>';
    html += '<td><a class="ant-btn-link orphan-assign-btn" data-idx="' + idx + '">分配到组</a> <a class="ant-btn-link orphan-detail-btn" data-idx="' + idx + '">详情</a></td></tr>';
  });
  html += '</tbody></table><div id="orphan-pagination"></div>';
  tableContainer.innerHTML = html;

  // Select all
  var selectAll = document.getElementById('orphan-select-all');
  if (selectAll) {
    selectAll.onchange = function () {
      tableContainer.querySelectorAll('.orphan-row-check').forEach(function (cb) { cb.checked = selectAll.checked; });
    };
  }

  // Assign buttons
  tableContainer.querySelectorAll('.orphan-assign-btn').forEach(function (btn) {
    btn.onclick = function () {
      var idx = parseInt(btn.getAttribute('data-idx'));
      var r = data[idx];
      if (!r) return;
      window._orphanAssignData = { idx: idx, resource: r, type: 'ungrouped' };
      loadAndShowModal('orphan/assign-group', function () {
        var nameEl = document.getElementById('orphan-assign-resource');
        if (nameEl) nameEl.textContent = r.name;
        var deptSelect = document.getElementById('orphan-assign-dept');
        var groupSelect = document.getElementById('orphan-assign-group');
        if (deptSelect) {
          deptSelect.innerHTML = '<option value="">请选择部门</option>';
          MockData.orgs.forEach(function (d) {
            deptSelect.innerHTML += '<option value="' + esc(d.id) + '">' + esc(d.name) + '</option>';
          });
          deptSelect.onchange = function () {
            groupSelect.innerHTML = '<option value="">请选择组</option>';
            var dept = MockData.findOrg(deptSelect.value);
            if (dept && dept.children) {
              dept.children.forEach(function (g) {
                groupSelect.innerHTML += '<option value="' + esc(g.id) + '">' + esc(g.name) + '</option>';
                if (g.children) g.children.forEach(function (sg) {
                  groupSelect.innerHTML += '<option value="' + esc(sg.id) + '">  ' + esc(sg.name) + '</option>';
                });
              });
            }
          };
        }
      });
    };
  });

  // Detail buttons
  tableContainer.querySelectorAll('.orphan-detail-btn').forEach(function (btn) {
    btn.onclick = function () {
      var idx = parseInt(btn.getAttribute('data-idx'));
      var r = data[idx];
      if (!r) return;
      loadAndShowModal('resource/view-resource', function () {
        var titleEl = document.getElementById('resource-detail-title');
        if (titleEl) titleEl.textContent = '未归组资源详情';
        var bodyEl = document.getElementById('resource-detail-body');
        if (bodyEl) {
          bodyEl.innerHTML =
            '<div class="ant-descriptions-row"><div class="ant-descriptions-label">资源名称</div><div class="ant-descriptions-content">' + esc(r.name) + '</div></div>' +
            '<div class="ant-descriptions-row"><div class="ant-descriptions-label">资源ID</div><div class="ant-descriptions-content"><code>' + esc(r.resId) + '</code></div></div>' +
            '<div class="ant-descriptions-row"><div class="ant-descriptions-label">资源类型</div><div class="ant-descriptions-content"><span class="ant-tag ant-tag-' + r.typeColor + '">' + esc(r.type) + '</span></div></div>' +
            '<div class="ant-descriptions-row"><div class="ant-descriptions-label">来源</div><div class="ant-descriptions-content">' + esc(r.source) + '</div></div>' +
            '<div class="ant-descriptions-row"><div class="ant-descriptions-label">归属主账号</div><div class="ant-descriptions-content">' + esc(r.mainAccount || '--') + '</div></div>' +
            '<div class="ant-descriptions-row"><div class="ant-descriptions-label">归属部门</div><div class="ant-descriptions-content">' + esc(r.dept || '--') + '</div></div>' +
            '<div class="ant-descriptions-row"><div class="ant-descriptions-label">发现时间</div><div class="ant-descriptions-content">' + esc(r.discoverTime) + '</div></div>';
        }
      });
    };
  });

  var pagEl = document.getElementById('orphan-pagination');
  if (pagEl) renderPagination(pagEl, data.length, 1, PAGE_SIZE, function () {});
}
