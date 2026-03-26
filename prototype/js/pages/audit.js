'use strict';
// CMP 原型 - 审计日志页

// =============================================
// 审计日志页
// =============================================
function initAuditPage() {
  renderAuditLogs();
  var searchInput = document.getElementById('audit-search');
  if (searchInput) searchInput.oninput = function () { state.audit.keyword = searchInput.value; state.audit.page = 1; renderAuditLogs(); };
  var typeFilter = document.getElementById('audit-type-filter');
  if (typeFilter) typeFilter.onchange = function () { state.audit.typeFilter = typeFilter.value; state.audit.page = 1; renderAuditLogs(); };
  var deptFilter = document.getElementById('audit-dept-filter');
  if (deptFilter) {
    if (currentRole !== 'superadmin') {
      deptFilter.style.display = 'none';
    } else {
      deptFilter.onchange = function () { state.audit.deptFilter = deptFilter.value; state.audit.page = 1; renderAuditLogs(); };
    }
  }
  var dateFrom = document.getElementById('audit-date-from');
  if (dateFrom) dateFrom.onchange = function () { state.audit.dateFrom = dateFrom.value; state.audit.page = 1; renderAuditLogs(); };
  var dateTo = document.getElementById('audit-date-to');
  if (dateTo) dateTo.onchange = function () { state.audit.dateTo = dateTo.value; state.audit.page = 1; renderAuditLogs(); };
  var exportBtn = document.getElementById('audit-export-btn');
  if (exportBtn) exportBtn.onclick = function () { showMessage('审计日志导出任务已提交，请稍后在下载中心查看', 'success'); };
}

function renderAuditLogs() {
  var s = state.audit;
  var ctx = getRoleContext();
  var data = MockData.auditLogs.filter(function (log) {
    // 数据权限：部门负责人只看本部门，超管看全部
    if (ctx.deptName && log.dept !== ctx.deptName && log.dept !== '--') return false;
    if (s.keyword) {
      var kw = s.keyword.toLowerCase();
      if (log.operator.toLowerCase().indexOf(kw) === -1 && log.target.toLowerCase().indexOf(kw) === -1 && log.desc.toLowerCase().indexOf(kw) === -1) return false;
    }
    if (s.typeFilter && log.opType !== s.typeFilter) return false;
    if (s.deptFilter && log.dept !== s.deptFilter) return false;
    if (s.dateFrom) {
      var logDate = log.time.substring(0, 10).replace(/\//g, '-');
      if (logDate < s.dateFrom) return false;
    }
    if (s.dateTo) {
      var logDate2 = log.time.substring(0, 10).replace(/\//g, '-');
      if (logDate2 > s.dateTo) return false;
    }
    return true;
  });

  var total = data.length;
  var start = (s.page - 1) * PAGE_SIZE;
  var pageData = data.slice(start, start + PAGE_SIZE);

  var tableContainer = document.getElementById('audit-table-container');
  if (!tableContainer) return;
  var html = '<table class="ant-table"><thead><tr><th>操作时间</th><th>操作人</th><th>所属部门</th><th>操作类型</th><th>操作对象</th><th>操作描述</th><th>变更前</th><th>变更后</th><th>来源IP</th><th>详情</th></tr></thead><tbody>';
  if (pageData.length === 0) {
    html += '<tr><td colspan="10" style="text-align:center;color:var(--text-secondary);padding:32px;">暂无数据</td></tr>';
  }
  pageData.forEach(function (log) {
    html += '<tr><td style="white-space:nowrap;">' + esc(log.time) + '</td>';
    html += '<td>' + esc(log.operator) + '</td><td>' + esc(log.dept) + '</td>';
    html += '<td><span class="ant-tag ant-tag-' + log.opTypeColor + '">' + esc(log.opType) + '</span></td>';
    html += '<td>' + esc(log.target) + '</td><td>' + esc(log.desc) + '</td>';
    html += '<td style="color:var(--text-secondary);font-size:12px;">' + (log.before ? esc(log.before) : '-') + '</td>';
    html += '<td style="color:var(--text-secondary);font-size:12px;">' + (log.after ? esc(log.after) : '-') + '</td>';
    html += '<td>' + esc(log.ip) + '</td>';
    html += '<td><a class="ant-btn-link audit-detail-btn" data-idx="' + pageData.indexOf(log) + '">查看</a></td></tr>';
  });
  html += '</tbody></table><div id="audit-pagination"></div>';
  tableContainer.innerHTML = html;

  var pagEl = document.getElementById('audit-pagination');
  if (pagEl) renderPagination(pagEl, total, s.page, PAGE_SIZE, function (p) { s.page = p; renderAuditLogs(); });

  // 绑定查看详情按钮
  tableContainer.querySelectorAll('.audit-detail-btn').forEach(function (btn) {
    btn.onclick = function () {
      var idx = parseInt(btn.getAttribute('data-idx'));
      var log = pageData[idx];
      if (!log) return;
      loadAndShowModal('audit/view-detail', function () {
        var bodyEl = document.getElementById('audit-detail-body');
        if (bodyEl) {
          bodyEl.innerHTML =
            '<div class="ant-descriptions-row"><div class="ant-descriptions-label">操作时间</div><div class="ant-descriptions-content">' + esc(log.time) + '</div></div>' +
            '<div class="ant-descriptions-row"><div class="ant-descriptions-label">操作人</div><div class="ant-descriptions-content">' + esc(log.operator) + '</div></div>' +
            '<div class="ant-descriptions-row"><div class="ant-descriptions-label">所属部门</div><div class="ant-descriptions-content">' + esc(log.dept) + '</div></div>' +
            '<div class="ant-descriptions-row"><div class="ant-descriptions-label">操作类型</div><div class="ant-descriptions-content"><span class="ant-tag ant-tag-' + log.opTypeColor + '">' + esc(log.opType) + '</span></div></div>' +
            '<div class="ant-descriptions-row"><div class="ant-descriptions-label">操作对象</div><div class="ant-descriptions-content">' + esc(log.target) + '</div></div>' +
            '<div class="ant-descriptions-row"><div class="ant-descriptions-label">操作描述</div><div class="ant-descriptions-content">' + esc(log.desc) + '</div></div>' +
            '<div class="ant-descriptions-row"><div class="ant-descriptions-label">变更前</div><div class="ant-descriptions-content">' + (log.before ? esc(log.before) : '-') + '</div></div>' +
            '<div class="ant-descriptions-row"><div class="ant-descriptions-label">变更后</div><div class="ant-descriptions-content">' + (log.after ? esc(log.after) : '-') + '</div></div>' +
            '<div class="ant-descriptions-row"><div class="ant-descriptions-label">来源IP</div><div class="ant-descriptions-content"><code>' + esc(log.ip) + '</code></div></div>';
        }
      });
    };
  });

}
