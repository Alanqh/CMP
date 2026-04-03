'use strict';
// CMP 原型 - 角色管理页

// =============================================
// 角色管理页
// =============================================
function initRolePage() {
  renderRoleList();
}

function renderRoleList() {
  var container = document.getElementById('role-list-container');
  if (!container) return;

  // 排序：角色名称字母顺序排序，但保持超管始终在第一个
  var allRoles = MockData.roles.slice();
  allRoles.sort(function(a, b) {
    // 超管始终在第一个
    if (a.superOnly && !b.superOnly) return -1;
    if (!a.superOnly && b.superOnly) return 1;
    // 其他按角色名称字母顺序
    return a.name.localeCompare(b.name);
  });

  var html = '<table class="ant-table"><thead><tr><th>角色名称</th><th>角色类型</th><th>角色描述</th><th>已授权人数</th><th>操作</th></tr></thead><tbody>';
  allRoles.forEach(function (r) {
    html += '<tr><td>' + esc(r.name);
    if (r.superOnly) html += ' <span class="ant-tag ant-tag-red" style="font-size:11px;">超管可见</span>';
    html += '</td>';
    html += '<td><span class="ant-tag ant-tag-' + r.typeColor + '">' + esc(r.type) + '</span></td>';
    html += '<td>' + esc(r.scope) + '</td>';
    html += '<td><a class="ant-btn-link role-view-users-btn" data-role-name="' + esc(r.name) + '" style="cursor:pointer;">' + r.userCount + ' 人</a></td>';
    html += '<td>';
    if (r.builtin && r.superOnly) {
      // 超管角色无任何操作
      html += '<span style="color:#999;">--</span>';
    } else {
      html += '<a class="ant-btn-link role-edit-btn" data-role-name="' + esc(r.name) + '" title="仅超级管理员可编辑">编辑</a> ';
      html += '<a class="ant-btn-link role-delete-btn" data-role-name="' + esc(r.name) + '" style="color:#ff4d4f;" title="仅超级管理员可删除">删除</a>';
    }
    html += '</td></tr>';
  });
  html += '</tbody></table>';
  container.innerHTML = html;
  bindRoleViewBtns(container);
  bindRoleActionBtns(container);
}

function bindRoleActionBtns(container) {
  container.querySelectorAll('.role-edit-btn').forEach(function (btn) {
    btn.onclick = function () {
      var roleName = btn.getAttribute('data-role-name');
      var role = null;
      for (var i = 0; i < MockData.roles.length; i++) {
        if (MockData.roles[i].name === roleName) { role = MockData.roles[i]; break; }
      }
      if (!role) return;
      window._editRoleData = role;
      loadAndShowModal('role/add-role', function () {
        var titleEl = document.querySelector('#modal-container .ant-modal-header');
        if (titleEl) titleEl.innerHTML = '编辑角色 <button class="ant-modal-close">&times;</button>';
        var nameInput = document.getElementById('modal-role-name');
        if (nameInput) nameInput.value = role.name;
        var descInput = document.getElementById('modal-role-desc');
        if (descInput) descInput.value = role.scope;
        // 渲染权限模块
        renderRolePermModules(role.permissions || {});
      });
    };
  });
  container.querySelectorAll('.role-delete-btn').forEach(function (btn) {
    btn.onclick = function () {
      var roleName = btn.getAttribute('data-role-name');
      if (confirm('确定删除角色「' + roleName + '」吗？删除后已分配该角色的成员将失去对应权限。')) {
        for (var i = 0; i < MockData.roles.length; i++) {
          if (MockData.roles[i].name === roleName) {
            MockData.roles.splice(i, 1);
            break;
          }
        }
        showMessage('角色「' + roleName + '」已删除', 'success');
        renderRoleList();
      }
    };
  });
}

function bindRoleViewBtns(container) {
  container.querySelectorAll('.role-view-users-btn').forEach(function (btn) {
    btn.onclick = function () {
      var roleName = btn.getAttribute('data-role-name');
      var role = null;
      for (var i = 0; i < MockData.roles.length; i++) {
        if (MockData.roles[i].name === roleName) { role = MockData.roles[i]; break; }
      }
      if (!role) return;
      window._viewRoleData = role;
      loadAndShowModal('role/view-role', function () {
        var nameEl = document.getElementById('role-detail-name');
        var typeEl = document.getElementById('role-detail-type');
        var scopeEl = document.getElementById('role-detail-scope');
        var countEl = document.getElementById('role-detail-count');
        var usersEl = document.getElementById('role-detail-users');
        if (nameEl) nameEl.textContent = role.name;
        if (typeEl) typeEl.innerHTML = '<span class="ant-tag ant-tag-' + role.typeColor + '">' + esc(role.type) + '</span>';
        if (scopeEl) scopeEl.textContent = role.scope;
        if (countEl) countEl.textContent = role.users ? role.users.length : 0;
        if (usersEl) {
          var uhtml = '';
          if (role.users && role.users.length > 0) {
            role.users.forEach(function (u) {
              uhtml += '<tr><td>' + esc(u.name) + '</td><td>' + esc(email(u.username)) + '</td><td>' + esc(u.dept) + '</td></tr>';
            });
          } else {
            uhtml = '<tr><td colspan="3" style="text-align:center;color:var(--text-secondary);padding:16px;">暂无授权成员</td></tr>';
          }
          usersEl.innerHTML = uhtml;
        }
      });
    };
  });
}

// 渲染角色权限模块配置（用于创建/编辑角色弹窗）
function renderRolePermModules(selectedPerms) {
  var permContainer = document.getElementById('role-perm-modules');
  if (!permContainer) return;
  var modules = MockData.roleModules;
  var html = '';
  modules.forEach(function (mod) {
    var checkedPoints = (selectedPerms && selectedPerms[mod.name]) || [];
    var allChecked = checkedPoints.length === mod.points.length;
    html += '<div class="perm-module-group" data-module="' + esc(mod.name) + '">';
    html += '<div class="perm-module-header"><label class="ant-checkbox-wrapper"><input type="checkbox" class="perm-module-checkbox"' + (allChecked ? ' checked' : '') + ' /> <strong>' + esc(mod.name) + '</strong></label></div>';
    html += '<div class="perm-module-points">';
    mod.points.forEach(function (pt) {
      var isChecked = checkedPoints.indexOf(pt) !== -1;
      html += '<label class="ant-checkbox-wrapper"><input type="checkbox" class="perm-point-checkbox" data-point="' + esc(pt) + '"' + (isChecked ? ' checked' : '') + ' /> ' + esc(pt) + '</label>';
    });
    html += '</div></div>';
  });
  permContainer.innerHTML = html;
  // 绑定模块全选
  permContainer.querySelectorAll('.perm-module-checkbox').forEach(function (cb) {
    cb.onchange = function () {
      var group = cb.closest('.perm-module-group');
      group.querySelectorAll('.perm-point-checkbox').forEach(function (pt) { pt.checked = cb.checked; });
    };
  });
  // 绑定功能点勾选同步模块全选状态
  permContainer.querySelectorAll('.perm-point-checkbox').forEach(function (cb) {
    cb.onchange = function () {
      var group = cb.closest('.perm-module-group');
      var all = group.querySelectorAll('.perm-point-checkbox');
      var checked = group.querySelectorAll('.perm-point-checkbox:checked');
      group.querySelector('.perm-module-checkbox').checked = all.length === checked.length;
    };
  });
}
