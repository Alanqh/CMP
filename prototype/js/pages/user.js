'use strict';
// CMP 原型 - 用户管理页

// =============================================
// 用户管理页
// =============================================
function initUserPage() {
  // 统计卡片
  var statsEl = document.getElementById('user-stats');
  if (statsEl) {
    var totalUsers = MockData.members.length;
    var unassignedCount = 0;
    var roleAssignedCount = 0;
    MockData.members.forEach(function (m) {
      if (m.orgId === 'unassigned') unassignedCount++;
    });
    // 计算已分配角色的人数
    var roleUsernames = {};
    MockData.roles.forEach(function (r) {
      if (r.users) r.users.forEach(function (u) { roleUsernames[u.username] = true; });
    });
    roleAssignedCount = Object.keys(roleUsernames).length;
    var deptCount = MockData.orgs.length;
    statsEl.innerHTML =
      '<div class="stat-card"><div class="stat-value">' + totalUsers + '</div><div class="stat-label">总用户数</div></div>' +
      '<div class="stat-card"><div class="stat-value">' + deptCount + '</div><div class="stat-label">部门数</div></div>' +
      '<div class="stat-card"><div class="stat-value" style="color:#1890ff;">' + roleAssignedCount + '</div><div class="stat-label">已分配角色</div></div>' +
      '<div class="stat-card"><div class="stat-value" style="color:#faad14;">' + unassignedCount + '</div><div class="stat-label">未分配部门</div></div>';
  }

  // 部门筛选下拉
  var deptFilter = document.getElementById('user-dept-filter');
  if (deptFilter && deptFilter.options.length <= 1) {
    MockData.getAllDepts().forEach(function (d) {
      deptFilter.innerHTML += '<option value="' + esc(d) + '">' + esc(d) + '</option>';
    });
  }

  // 搜索绑定
  var searchEl = document.getElementById('user-search');
  if (searchEl) searchEl.oninput = function () { state.user.keyword = searchEl.value; state.user.page = 1; renderUsers(); };
  if (deptFilter) deptFilter.onchange = function () { state.user.deptFilter = deptFilter.value; state.user.page = 1; renderUsers(); };

  // 创建用户按钮
  var createBtn = document.getElementById('btn-create-user');
  if (createBtn) createBtn.onclick = function () {
    loadAndShowModal('user/create-user', function () {
      var orgSelect = document.getElementById('create-user-org');
      if (orgSelect) {
        var opts = '';
        function buildOrgOptions(nodes, indent) {
          for (var i = 0; i < nodes.length; i++) {
            opts += '<option value="' + esc(nodes[i].id) + '">' + indent + esc(nodes[i].name) + '</option>';
            if (nodes[i].children) buildOrgOptions(nodes[i].children, indent + '　　');
          }
        }
        buildOrgOptions(MockData.orgs, '');
        orgSelect.innerHTML = opts;
      }
    });
  };

  renderUsers();
}

function getUser(username) {
  for (var i = 0; i < MockData.users.length; i++) {
    if (MockData.users[i].username === username) return MockData.users[i];
  }
  return null;
}

function getMemberDept(member) {
  if (member.orgId === 'unassigned') return '未分配';
  // 返回完整组织路径：部门 - 一级组 - 二级组
  function findPath(nodes, trail) {
    for (var i = 0; i < nodes.length; i++) {
      var newTrail = trail.concat(nodes[i].name);
      if (nodes[i].id === member.orgId) return newTrail.join(' - ');
      if (nodes[i].children && nodes[i].children.length) {
        var found = findPath(nodes[i].children, newTrail);
        if (found) return found;
      }
    }
    return null;
  }
  return findPath(MockData.orgs, []) || member.orgName || '--';
}

function renderUsers() {
  var s = state.user;
  var filtered = MockData.members.filter(function (m) {
    if (s.keyword) {
      var kw = s.keyword.toLowerCase();
      if (m.name.toLowerCase().indexOf(kw) === -1 && m.username.toLowerCase().indexOf(kw) === -1) return false;
    }
    if (s.deptFilter) {
      var dept = getMemberDept(m);
      if (dept.indexOf(s.deptFilter) !== 0) return false;
    }
    return true;
  });
  var total = filtered.length;
  var start = (s.page - 1) * PAGE_SIZE;
  var pageData = filtered.slice(start, start + PAGE_SIZE);

  var tableContainer = document.getElementById('user-table-container');
  if (!tableContainer) return;

  var html = '<table class="ant-table"><thead><tr><th>姓名</th><th>邮箱</th><th>手机号</th><th>所属部门</th><th>角色</th><th>创建时间</th><th>最后登录</th><th>操作</th></tr></thead><tbody>';
  if (pageData.length === 0) {
    html += '<tr><td colspan="8" style="text-align:center;color:var(--text-secondary);padding:32px;">暂无数据</td></tr>';
  }
  for (var i = 0; i < pageData.length; i++) {
    var m = pageData[i];
    var u = getUser(m.username) || {};
    var dept = getMemberDept(m);
    // 查找用户的角色
    var userRoles = [];
    MockData.roles.forEach(function (r) {
      if (r.users) r.users.forEach(function (ru) { if (ru.username === m.username) userRoles.push(r.name); });
    });
    html += '<tr><td>' + esc(m.name) + '</td>';
    html += '<td>' + esc(email(m.username)) + '</td>';
    html += '<td>' + esc(u.phone || '--') + '</td>';
    html += '<td>' + (dept === '未分配' ? '<span class="ant-tag ant-tag-orange">未分配</span>' : esc(dept)) + '</td>';
    html += '<td>';
    if (userRoles.length > 0) {
      userRoles.forEach(function (rn) { html += '<span class="ant-tag ant-tag-blue" style="margin-right:4px;">' + esc(rn) + '</span>'; });
    } else {
      html += '<span style="color:var(--text-secondary);">--</span>';
    }
    html += '</td>';
    html += '<td>' + esc(u.createTime || m.joinDate) + '</td>';
    html += '<td>' + esc(u.lastLogin || '--') + '</td>';
    html += '<td>';
    html += '<a class="ant-btn-link edit-user-btn" data-username="' + esc(m.username) + '">编辑</a> ';
    html += '<a class="ant-btn-link assign-role-btn" data-username="' + esc(m.username) + '">分配角色</a>';
    html += '</td></tr>';
  }
  html += '</tbody></table><div id="user-pagination"></div>';
  tableContainer.innerHTML = html;

  var pagEl = document.getElementById('user-pagination');
  if (pagEl) renderPagination(pagEl, total, s.page, PAGE_SIZE, function (p) { s.page = p; renderUsers(); });

  bindUserActions();
}

function bindUserActions() {
  // 编辑用户
  document.querySelectorAll('.edit-user-btn').forEach(function (btn) {
    btn.onclick = function () {
      var username = btn.getAttribute('data-username');
      window._editUserUsername = username;
      loadAndShowModal('user/edit-user', function () {
        var member = null;
        for (var i = 0; i < MockData.members.length; i++) {
          if (MockData.members[i].username === username) { member = MockData.members[i]; break; }
        }
        var u = getUser(username) || {};
        var nameInput = document.getElementById('edit-user-name');
        var phoneInput = document.getElementById('edit-user-phone');
        if (nameInput && member) nameInput.value = member.name;
        if (phoneInput) phoneInput.value = u.phone || '';
      });
    };
  });
  // 分配角色
  document.querySelectorAll('.assign-role-btn').forEach(function (btn) {
    btn.onclick = function () {
      var username = btn.getAttribute('data-username');
      window._assignRoleUsername = username;
      var member = null;
      for (var i = 0; i < MockData.members.length; i++) {
        if (MockData.members[i].username === username) { member = MockData.members[i]; break; }
      }
      loadAndShowModal('user/assign-role', function () {
        var nameEl = document.getElementById('assign-role-user-name');
        if (nameEl && member) nameEl.textContent = member.name + ' (' + email(member.username) + ')';
        var sel = document.getElementById('assign-role-select');
        if (sel) {
          sel.innerHTML = '<option value="">请选择角色...</option>';
          MockData.roles.filter(function (r) { return !r.superOnly; }).forEach(function (r) {
            sel.innerHTML += '<option value="' + esc(r.name) + '">' + esc(r.name) + ' - ' + esc(r.scope) + '</option>';
          });
        }
      });
    };
  });
  // 重置密码
  document.querySelectorAll('.reset-pwd-btn').forEach(function (btn) {
    btn.onclick = function () {
      var username = btn.getAttribute('data-username');
      window._resetPwdUsername = username;
      var member = null;
      for (var i = 0; i < MockData.members.length; i++) {
        if (MockData.members[i].username === username) { member = MockData.members[i]; break; }
      }
      loadAndShowModal('user/confirm-reset-pwd', function () {
        var msgEl = document.getElementById('reset-pwd-msg');
        if (msgEl) msgEl.textContent = '确定要重置用户「' + (member ? member.name : username) + '」的密码吗？';
      });
    };
  });
}
