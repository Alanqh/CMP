'use strict';
// CMP 原型 - 用户管理页

// =============================================
// 用户管理页
// =============================================
function initUserPage() {
  var ctx = getRoleContext();

  // 统计卡片（部门负责人显示本部门统计，超管显示全平台）
  var statsEl = document.getElementById('user-stats');
  if (statsEl) {
    var scopedMembers = currentRole === 'dept_head'
      ? MockData.members.filter(function (m) { return getMemberDeptId(m) === ctx.deptId; })
      : MockData.members;
    var totalUsers = scopedMembers.length;
    var unassignedCount = currentRole === 'dept_head' ? 0 : MockData.members.filter(function (m) { return m.orgId === 'unassigned'; }).length;
    var roleUsernames = {};
    MockData.roles.forEach(function (r) {
      if (r.users) r.users.forEach(function (u) {
        if (currentRole !== 'dept_head' || getMemberDeptId(u) === ctx.deptId) roleUsernames[u.username] = true;
      });
    });
    var roleAssignedCount = Object.keys(roleUsernames).length;
    var deptCount = currentRole === 'dept_head' ? 1 : MockData.orgs.length;
    statsEl.innerHTML =
      '<div class="stat-card"><div class="stat-value">' + totalUsers + '</div><div class="stat-label">' + (currentRole === 'dept_head' ? '本部门用户' : '总用户数') + '</div></div>' +
      '<div class="stat-card"><div class="stat-value">' + deptCount + '</div><div class="stat-label">' + (currentRole === 'dept_head' ? '部门' : '部门数') + '</div></div>' +
      '<div class="stat-card"><div class="stat-value" style="color:#1890ff;">' + roleAssignedCount + '</div><div class="stat-label">已分配角色</div></div>' +
      (currentRole !== 'dept_head' ? '<div class="stat-card"><div class="stat-value" style="color:#faad14;">' + unassignedCount + '</div><div class="stat-label">未分配部门</div></div>' : '');
  }

  // 部门筛选下拉：超管可切换所有部门；部门负责人固定本部门（隐藏下拉）
  var deptFilter = document.getElementById('user-dept-filter');
  if (deptFilter) {
    if (currentRole === 'dept_head') {
      var deptFilterWrap = deptFilter.closest('.csd-wrap') || deptFilter.parentElement;
      if (deptFilterWrap) deptFilterWrap.style.display = 'none';
    } else if (deptFilter.options.length <= 1) {
      MockData.getAllDepts().forEach(function (d) {
        deptFilter.innerHTML += '<option value="' + esc(d) + '">' + esc(d) + '</option>';
      });
    }
  }

  // 创建用户按钮：仅超管可见
  var createBtn = document.getElementById('btn-create-user');
  if (createBtn) {
    if (currentRole !== 'superadmin') {
      createBtn.style.display = 'none';
    } else {
      createBtn.style.display = '';
      createBtn.onclick = function () {
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
    }
  }

  // 搜索绑定
  var searchEl = document.getElementById('user-search');
  if (searchEl) searchEl.oninput = function () { state.user.keyword = searchEl.value; state.user.page = 1; renderUsers(); };
  if (deptFilter) deptFilter.onchange = function () { state.user.deptFilter = deptFilter.value; state.user.page = 1; renderUsers(); };

  renderUsers();
}

function getMemberDeptId(m) {
  if (!m || m.orgId === 'unassigned') return null;
  for (var i = 0; i < MockData.orgs.length; i++) {
    var ids = MockData.getOrgAndChildIds(MockData.orgs[i].id);
    if (ids.indexOf(m.orgId) !== -1) return MockData.orgs[i].id;
  }
  return null;
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
  var ctx = getRoleContext();
  var filtered = MockData.members.filter(function (m) {
    // 数据权限：部门负责人只看本部门成员
    if (currentRole === 'dept_head' && getMemberDeptId(m) !== ctx.deptId) return false;
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

  var html = '<table class="ant-table"><thead><tr><th>姓名</th><th>邮箱</th><th>所属部门</th><th>角色</th><th>创建时间</th><th>最后登录</th><th>操作</th></tr></thead><tbody>';
  if (pageData.length === 0) {
    html += '<tr><td colspan="7" style="text-align:center;color:var(--text-secondary);padding:32px;">暂无数据</td></tr>';
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
    html += '<td>' + (dept === '未分配' ? '<span class="ant-tag ant-tag-orange">未分配</span>' : esc(dept)) + '</td>';
    html += '<td>';
    if (userRoles.length === 0) {
      html += '<span style="color:var(--text-secondary);">--</span>';
    } else if (userRoles.length <= 2) {
      userRoles.forEach(function (rn) { html += '<span class="ant-tag ant-tag-blue" style="margin-right:4px;">' + esc(rn) + '</span>'; });
    } else {
      html += '<span class="ant-tag ant-tag-blue" style="margin-right:4px;">' + esc(userRoles[0]) + '</span>';
      html += '<span class="ant-tag ant-tag-blue" style="margin-right:4px;">' + esc(userRoles[1]) + '</span>';
      html += '<span class="ant-tag ant-tag-default role-overflow-tag" style="cursor:default;" title="' + esc(userRoles.slice(2).join('、')) + '">+' + (userRoles.length - 2) + '</span>';
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

        // 获取该用户当前已有角色
        var currentRoles = {};
        MockData.roles.forEach(function (r) {
          if (r.users) r.users.forEach(function (ru) {
            if (ru.username === username) currentRoles[r.name] = true;
          });
        });

        function renderRoleList(keyword) {
          var listEl = document.getElementById('assign-role-list');
          if (!listEl) return;
          var roles = MockData.roles.filter(function (r) {
            if (r.superOnly) return false;
            if (keyword) return r.name.indexOf(keyword) !== -1;
            return true;
          });
          if (roles.length === 0) {
            listEl.innerHTML = '<div style="text-align:center;color:var(--text-secondary);padding:24px 0;">暂无匹配角色</div>';
            return;
          }
          var html = '';
          roles.forEach(function (r) {
            var checked = currentRoles[r.name] ? ' checked' : '';
            var typeClass = r.typeColor === 'red' ? 'ant-tag-red' : r.typeColor === 'orange' ? 'ant-tag-orange' : 'ant-tag-blue';
            html += '<label class="assign-role-item' + (currentRoles[r.name] ? ' is-checked' : '') + '">';
            html += '<input type="checkbox" name="assign-role-cb" value="' + esc(r.name) + '"' + checked + ' style="margin-right:8px;accent-color:var(--primary-color);">';
            html += '<span class="assign-role-item-name">' + esc(r.name) + '</span>';
            html += '<span class="ant-tag ' + typeClass + '" style="margin-left:6px;flex-shrink:0;">' + esc(r.type) + '</span>';
            html += '<span class="assign-role-item-scope">' + esc(r.scope) + '</span>';
            html += '</label>';
          });
          listEl.innerHTML = html;
          // 绑定 checkbox 变化更新计数
          listEl.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
            cb.onchange = function () {
              if (cb.checked) currentRoles[cb.value] = true;
              else delete currentRoles[cb.value];
              var countEl = document.getElementById('assign-role-count');
              if (countEl) countEl.textContent = Object.keys(currentRoles).length;
              // 更新 label 样式
              cb.closest('label').classList.toggle('is-checked', cb.checked);
            };
          });
        }

        // 初始化计数
        var countEl = document.getElementById('assign-role-count');
        if (countEl) countEl.textContent = Object.keys(currentRoles).length;

        // 搜索
        var searchEl = document.getElementById('assign-role-search');
        if (searchEl) {
          searchEl.value = '';
          searchEl.oninput = function () { renderRoleList(searchEl.value.trim()); };
        }
        renderRoleList('');

        // 确定按钮：同步更新 MockData.roles
        var confirmBtn = document.getElementById('assign-role-confirm-btn');
        if (confirmBtn) {
          confirmBtn.onclick = function () {
            // 从所有角色中移除该用户
            MockData.roles.forEach(function (r) {
              if (r.users) r.users = r.users.filter(function (ru) { return ru.username !== username; });
            });
            // 将用户添加到选中的角色
            var dept = getMemberDept(member);
            MockData.roles.forEach(function (r) {
              if (currentRoles[r.name]) {
                if (!r.users) r.users = [];
                r.users.push({ name: member.name, username: username, dept: dept });
                r.userCount = r.users.length;
              }
            });
            // 关闭弹窗并刷新
            var overlay = confirmBtn.closest('.ant-modal-overlay');
            if (overlay) overlay.style.display = 'none';
            renderUsers();
          };
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
