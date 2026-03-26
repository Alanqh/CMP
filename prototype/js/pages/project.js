'use strict';
// CMP 原型 - 项目管理页

// =============================================
// 项目管理页
// =============================================
function initProjectPage() {
  renderProjects();
  var searchInput = document.getElementById('project-search');
  if (searchInput) {
    searchInput.oninput = function () { state.project.keyword = searchInput.value; renderProjects(); };
  }
  var deptFilter = document.getElementById('project-dept-filter');
  if (deptFilter) {
    deptFilter.onchange = function () { state.project.deptFilter = deptFilter.value; renderProjects(); };
  }
  // 创建项目按钮：仅超管和部门负责人可见
  var createBtn = document.querySelector('[data-modal="project/add-project"]');
  if (createBtn && currentRole !== 'superadmin' && currentRole !== 'dept_head') {
    createBtn.style.display = 'none';
  }
}

function renderAddProjectModal() {
  var deptSelect = document.getElementById('modal-project-dept');
  if (!deptSelect) return;
  // 超管可选全部部门，部门管理员只能选自己部门；原型模拟超管视角
  var depts = ['基础架构部', '业务研发部', '数据平台部'];
  deptSelect.innerHTML = '<option value="">请选择部门</option>' +
    depts.map(function (d) { return '<option value="' + d + '">' + d + '</option>'; }).join('');
  var nameInput = document.getElementById('modal-project-name');
  var descInput = document.getElementById('modal-project-desc');
  if (nameInput) nameInput.value = '';
  if (descInput) descInput.value = '';
}

function renderProjects() {
  var s = state.project;
  var ctx = getRoleContext();
  var data = MockData.projects.filter(function (p) {
    // 数据权限：非超管只看本部门项目
    if (ctx.deptName && p.dept !== ctx.deptName) return false;
    if (s.keyword && p.name.toLowerCase().indexOf(s.keyword.toLowerCase()) === -1) return false;
    if (s.deptFilter && p.dept !== s.deptFilter) return false;
    return true;
  });

  // 隐藏部门筛选（非超管只有一个部门）
  var deptFilterEl2 = document.getElementById('project-dept-filter');
  if (deptFilterEl2) deptFilterEl2.style.display = (currentRole === 'superadmin') ? '' : 'none';

  // Stats
  var statsContainer = document.getElementById('project-stats');
  if (statsContainer) {
    var totalRes = 0; var depts = {};
    data.forEach(function (p) { totalRes += p.resourceCount; depts[p.dept] = true; });
    statsContainer.innerHTML = '<div class="stat-card"><div class="stat-value">' + data.length + '</div><div class="stat-label">项目总数</div></div>' +
      '<div class="stat-card"><div class="stat-value">' + totalRes + '</div><div class="stat-label">关联资源总数</div></div>' +
      '<div class="stat-card"><div class="stat-value">' + Object.keys(depts).length + '</div><div class="stat-label">涉及部门数</div></div>';
  }

  // Table
  var tableContainer = document.getElementById('project-table-container');
  if (!tableContainer) return;
  var html = '<table class="ant-table"><thead><tr><th>项目名称</th><th>描述</th><th>所属部门</th><th>创建人</th><th>可查看资源 / 总资源</th><th>创建时间</th><th>操作</th></tr></thead><tbody>';
  if (data.length === 0) {
    html += '<tr><td colspan="7" style="text-align:center;color:var(--text-secondary);padding:32px;">暂无数据</td></tr>';
  }
  data.forEach(function (p) {
    var visibleCount = MockData.resources.filter(function (r) { return r.project === p.name; }).length;
    var totalCount = p.resourceCount;
    var resLabel = '<span style="font-weight:500;color:#1890ff;">' + visibleCount + '</span><span style="color:var(--text-secondary);"> / ' + totalCount + ' 个</span>';
    if (visibleCount < totalCount) {
      resLabel += ' <span style="font-size:11px;color:var(--text-secondary);">（部分可见）</span>';
    }
    html += '<tr>';
    html += '<td><span style="font-weight:500;">' + esc(p.name) + '</span></td>';
    html += '<td style="color:var(--text-secondary);">' + esc(p.desc) + '</td>';
    html += '<td>' + esc(p.dept) + '</td>';
    html += '<td>' + esc(p.creator) + '</td>';
    html += '<td>' + resLabel + '</td>';
    html += '<td>' + esc(p.createTime) + '</td>';
    html += '<td>';
    html += '<a class="ant-btn-link project-res-btn" data-project="' + esc(p.name) + '">查看资源</a>';
    if (currentRole === 'superadmin' || currentRole === 'dept_head') {
      html += ' <a class="ant-btn-link project-edit-btn" data-project="' + esc(p.name) + '">编辑</a> ';
      html += '<a class="ant-btn-link project-delete-btn" data-project="' + esc(p.name) + '" style="color:#ff4d4f;">删除</a>';
    }
    html += '</td></tr>';
  });
  html += '</tbody></table>';
  html += '<div id="project-pagination"></div>';
  tableContainer.innerHTML = html;

  // 绑定查看资源按钮
  tableContainer.querySelectorAll('.project-res-btn').forEach(function (btn) {
    btn.onclick = function () {
      var projName = btn.getAttribute('data-project');
      var proj = null;
      for (var i = 0; i < MockData.projects.length; i++) {
        if (MockData.projects[i].name === projName) { proj = MockData.projects[i]; break; }
      }
      if (!proj) return;
      var projRes = MockData.resources.filter(function (r) { return r.project === projName; });
      var visibleCount = projRes.length;
      var totalCount = proj.resourceCount;
      loadAndShowModal('project/view-project', function () {
        var titleEl = document.getElementById('project-detail-title');
        if (titleEl) titleEl.textContent = '项目详情 - ' + projName;
        var bodyEl = document.getElementById('project-detail-body');
        if (bodyEl) bodyEl.innerHTML =
          '<div class="ant-descriptions-row"><div class="ant-descriptions-label">项目名称</div><div class="ant-descriptions-content">' + esc(proj.name) + '</div></div>' +
          '<div class="ant-descriptions-row"><div class="ant-descriptions-label">所属部门</div><div class="ant-descriptions-content">' + esc(proj.dept) + '</div></div>' +
          '<div class="ant-descriptions-row"><div class="ant-descriptions-label">资源总数</div><div class="ant-descriptions-content">' + totalCount + ' 个（含您无权限查看的资源）</div></div>';
        var headerEl = document.getElementById('project-res-header');
        if (headerEl) {
          headerEl.innerHTML = '您可查看的资源（' + visibleCount + ' / ' + totalCount + ' 个）' +
            (visibleCount < totalCount ? '<span style="font-size:12px;font-weight:normal;color:var(--text-secondary);margin-left:8px;">仅展示您有权限的资源，如需查看全部请联系部门负责人</span>' : '');
        }
        var resBodyEl = document.getElementById('project-res-body');
        if (!resBodyEl) return;
        if (projRes.length === 0) {
          resBodyEl.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-secondary);">您在该项目下暂无可查看的资源</div>';
        } else {
          var resHtml = '<table class="ant-table"><thead><tr><th>资源名称</th><th>资源ID</th><th>类型</th><th>所属组</th><th>状态</th><th>我的权限</th></tr></thead><tbody>';
          projRes.forEach(function (r) {
            var permColor = { master: 'green', developer: 'cyan', reporter: 'default' }[r.perm] || 'default';
            var permLabel = { master: '管理员', developer: '开发者', reporter: '只读' }[r.perm] || r.perm;
            resHtml += '<tr>';
            resHtml += '<td>' + esc(r.name) + '</td>';
            resHtml += '<td style="font-size:12px;color:var(--text-secondary);">' + esc(r.resId) + '</td>';
            resHtml += '<td><span class="ant-tag ant-tag-' + r.typeColor + '">' + esc(r.type) + '</span></td>';
            resHtml += '<td>' + esc(r.group) + '</td>';
            resHtml += '<td><span class="ant-badge-status-dot ant-badge-status-' + r.statusClass + '"></span>' + esc(r.status) + '</td>';
            resHtml += '<td><span class="ant-tag ant-tag-' + permColor + '">' + permLabel + '</span></td>';
            resHtml += '</tr>';
          });
          resHtml += '</tbody></table>';
          resBodyEl.innerHTML = resHtml;
        }
      });
    };
  });

  // 绑定项目编辑按钮
  tableContainer.querySelectorAll('.project-edit-btn').forEach(function (btn) {
    btn.onclick = function () {
      var projName = btn.getAttribute('data-project');
      var proj = null;
      for (var i = 0; i < MockData.projects.length; i++) {
        if (MockData.projects[i].name === projName) { proj = MockData.projects[i]; break; }
      }
      if (!proj) return;
      window._editProjectName = projName;
      loadAndShowModal('project/edit-project', function () {
        var nameInput = document.getElementById('edit-project-name');
        var descInput = document.getElementById('edit-project-desc');
        var deptInput = document.getElementById('edit-project-dept');
        if (nameInput) nameInput.value = proj.name;
        if (descInput) descInput.value = proj.desc;
        if (deptInput) deptInput.value = proj.dept;
      });
    };
  });

  // 绑定删除按钮
  tableContainer.querySelectorAll('.project-delete-btn').forEach(function (btn) {
    btn.onclick = function () {
      var projName = btn.getAttribute('data-project');
      var resCount = MockData.resources.filter(function (r) { return r.project === projName; }).length;
      loadAndShowModal('project/confirm-delete', function () {
        var msgEl = document.getElementById('project-delete-msg');
        var extraEl = document.getElementById('project-delete-extra');
        var okBtn = document.getElementById('project-delete-ok');
        if (msgEl) msgEl.textContent = '确定要删除项目「' + projName + '」吗？';
        if (extraEl) extraEl.textContent = resCount > 0
          ? '该项目下仍有 ' + resCount + ' 个可见资源，删除后这些资源将解除项目绑定。此操作不可撤销。'
          : '此操作不可撤销。';
        if (okBtn) {
          okBtn.onclick = function () {
            MockData.projects = MockData.projects.filter(function (p) { return p.name !== projName; });
            MockData.auditLogs.unshift({ time: new Date().toLocaleString('zh-CN').replace(/\//g, '/'), operator: '张明远', dept: '基础架构部', opType: '项目管理', opTypeColor: 'purple', target: projName, desc: '删除项目', ip: '10.128.0.10' });
            hideModal();
            showMessage('项目「' + projName + '」已删除', 'success');
            pageCache = {};
            renderProjects();
          };
        }
      });
    };
  });

  var pagEl = document.getElementById('project-pagination');
  if (pagEl) renderPagination(pagEl, data.length, 1, 20, function () {});
}
