'use strict';
// CMP 原型 - 资源包管理页
// 资源包是个人维度的概念：
//   - 只能将自己有 master 权限的资源放入包中
//   - 包内每个资源可指定授权给他人的权限等级（master / developer / reporter）
//   - 创建后可授权给其他用户

var PERM_COLORS = { master: 'red', developer: 'blue', reporter: 'default' };
var PERM_LABELS = { master: 'master', developer: 'developer', reporter: 'reporter' };

// =============================================
// 资源包管理页
// =============================================
function initResPackagesPage() {
  var searchEl = document.getElementById('res-pkg-search');
  if (searchEl) searchEl.oninput = function () { renderResPackages(searchEl.value); };
  var addBtn = document.getElementById('res-pkg-add-btn');
  if (addBtn) addBtn.onclick = function () { showNewResPackageModal(); };
  renderResPackages('');
}

function renderResPackages(keyword) {
  var tableContainer = document.getElementById('res-pkg-table-container');
  if (!tableContainer) return;

  var packages = MockData.resourcePackages || [];
  // 数据权限：非超管只看自己创建的包或被授权的包
  if (currentRole !== 'superadmin') {
    var ctx = getRoleContext();
    packages = packages.filter(function (pkg) {
      if (pkg.creatorUsername === ctx.username) return true;
      if ((pkg.users || []).some(function (u) { return u.username === ctx.username; })) return true;
      return false;
    });
  }

  var filtered = packages.filter(function (pkg) {
    if (keyword) {
      var kw = keyword.toLowerCase();
      return pkg.name.toLowerCase().indexOf(kw) !== -1 || (pkg.description || '').toLowerCase().indexOf(kw) !== -1;
    }
    return true;
  });

  if (filtered.length === 0) {
    tableContainer.innerHTML = '<div style="text-align:center;color:var(--text-secondary);padding:40px;">暂无资源包数据</div>';
    return;
  }

  var html = '<table class="ant-table"><thead><tr><th>资源包名称</th><th>描述</th><th>创建人 / 时间</th><th>包含资源</th><th>已授权用户</th><th>操作</th></tr></thead><tbody>';
  filtered.forEach(function (pkg) {
    var resources = pkg.resources || [];
    var resTags = resources.slice(0, 2).map(function (r) {
      return '<span class="ant-tag ant-tag-' + esc(r.typeColor || 'default') + '" style="margin-bottom:2px;">'
        + esc(r.name) + ' <span class="ant-tag ant-tag-' + esc(PERM_COLORS[r.perm] || 'default') + '" style="font-size:10px;padding:0 4px;margin:0 0 0 2px;">' + esc(r.perm) + '</span></span>';
    }).join('');
    if (resources.length > 2) resTags += '<span style="font-size:12px;color:var(--text-secondary);">等 ' + resources.length + ' 个</span>';
    if (!resTags) resTags = '<span style="color:var(--text-secondary);">暂无</span>';

    var users = pkg.users || [];
    var userTags = users.slice(0, 2).map(function (u) {
      return '<span class="ant-tag">' + esc(u.name) + '</span>';
    }).join('');
    if (users.length > 2) userTags += '<span style="font-size:12px;color:var(--text-secondary);">等 ' + users.length + ' 人</span>';
    if (!userTags) userTags = '<span style="color:var(--text-secondary);">暂无</span>';

    html += '<tr>';
    html += '<td><strong>' + esc(pkg.name) + '</strong></td>';
    html += '<td style="color:var(--text-secondary);font-size:13px;max-width:200px;">' + esc(pkg.description || '--') + '</td>';
    html += '<td style="font-size:12px;white-space:nowrap;">' + esc(pkg.creator || '--') + '<br><span style="color:var(--text-secondary);">' + esc(pkg.createTime || '') + '</span></td>';
    html += '<td>' + resTags + '</td>';
    html += '<td>' + userTags + '</td>';
    html += '<td style="white-space:nowrap;">';
    html += '<a class="ant-btn-link res-pkg-edit" data-pkg-id="' + esc(pkg.id) + '">编辑</a> ';
    html += '<a class="ant-btn-link res-pkg-auth" data-pkg-id="' + esc(pkg.id) + '">授权</a> ';
    html += '<a class="ant-btn-link res-pkg-delete" data-pkg-id="' + esc(pkg.id) + '" style="color:#ff4d4f;">删除</a>';
    html += '</td></tr>';
  });
  html += '</tbody></table>';
  tableContainer.innerHTML = html;

  tableContainer.querySelectorAll('.res-pkg-edit').forEach(function (btn) {
    btn.onclick = function () {
      var pkg = packages.find(function (p) { return p.id === btn.getAttribute('data-pkg-id'); });
      if (pkg) showResPackageEditModal(pkg);
    };
  });
  tableContainer.querySelectorAll('.res-pkg-auth').forEach(function (btn) {
    btn.onclick = function () {
      var pkg = packages.find(function (p) { return p.id === btn.getAttribute('data-pkg-id'); });
      if (pkg) showResPackageAuthDrawer(pkg);
    };
  });
  tableContainer.querySelectorAll('.res-pkg-delete').forEach(function (btn) {
    btn.onclick = function () {
      var pkg = packages.find(function (p) { return p.id === btn.getAttribute('data-pkg-id'); });
      if (pkg) showResPackageDeleteConfirm(pkg);
    };
  });
}

// 获取当前用户有 master 权限的资源列表（排除已选的）
function getMasterResources(excludeIds) {
  excludeIds = excludeIds || [];
  var ctx = getRoleContext();
  return (MockData.resources || []).filter(function (r) {
    // 先应用角色数据权限
    if (ctx.orgIds && ctx.orgIds.indexOf(r.groupId) === -1) return false;
    return r.perm === 'master' && excludeIds.indexOf(r.resId) === -1;
  });
}

function buildResSelectOptions(excludeIds) {
  var available = getMasterResources(excludeIds);
  var html = '<option value="">— 从我有 master 权限的资源中选择 —</option>';
  available.forEach(function (r) {
    html += '<option value="' + esc(r.resId) + '" data-name="' + esc(r.name) + '" data-type="' + esc(r.type) + '" data-typecolor="' + esc(r.typeColor || 'default') + '">'
      + esc(r.name) + ' (' + esc(r.type) + ')</option>';
  });
  return html;
}

// =============================================
// 新建资源包
// =============================================
function showNewResPackageModal() {
  var pendingResources = [];

  function renderPendingRes() {
    var listEl = document.getElementById('new-pkg-res-list');
    if (!listEl) return;
    if (pendingResources.length === 0) {
      listEl.innerHTML = '<div style="text-align:center;color:#bfbfbf;padding:24px;font-size:13px;">暂未添加资源</div>';
      return;
    }
    var lHtml = '<table class="ant-table" style="margin:0;"><thead><tr><th>资源名称</th><th>类型</th><th>授权权限</th><th style="width:50px;"></th></tr></thead><tbody>';
    pendingResources.forEach(function (r, i) {
      lHtml += '<tr>';
      lHtml += '<td>' + esc(r.name) + '</td>';
      lHtml += '<td><span class="ant-tag ant-tag-' + esc(r.typeColor) + '">' + esc(r.type) + '</span></td>';
      lHtml += '<td><span class="ant-tag ant-tag-' + esc(PERM_COLORS[r.perm] || 'default') + '">' + esc(r.perm) + '</span></td>';
      lHtml += '<td><a style="color:#ff4d4f;cursor:pointer;" data-remove-idx="' + i + '">移除</a></td>';
      lHtml += '</tr>';
    });
    lHtml += '</tbody></table>';
    listEl.innerHTML = lHtml;
    listEl.querySelectorAll('[data-remove-idx]').forEach(function (a) {
      a.onclick = function () {
        pendingResources.splice(parseInt(a.getAttribute('data-remove-idx')), 1);
        refreshResSelect();
        renderPendingRes();
      };
    });
  }

  function refreshResSelect() {
    var sel = document.getElementById('new-pkg-res-select');
    if (sel) sel.innerHTML = buildResSelectOptions(pendingResources.map(function (r) { return r.resId; }));
  }

  var html = '<div class="ant-drawer-overlay" style="display:flex;">';
  html += '<div class="ant-drawer" style="width:720px;">';
  html += '<div class="ant-drawer-header">新建资源包 <button class="ant-drawer-close" onclick="hideModal()">&times;</button></div>';
  html += '<div class="ant-drawer-body">';
  html += '<div style="display:flex;gap:24px;margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid #f0f0f0;flex-wrap:wrap;">';
  html += '<div class="ant-form-item" style="flex:1;min-width:200px;"><div class="ant-form-label"><span class="required">*</span>资源包名称</div>';
  html += '<div class="ant-form-control"><input class="ant-input" id="new-pkg-name" placeholder="请输入资源包名称" style="width:100%;"></div></div>';
  html += '<div class="ant-form-item" style="flex:2;min-width:300px;"><div class="ant-form-label">描述</div>';
  html += '<div class="ant-form-control"><input class="ant-input" id="new-pkg-desc" placeholder="请输入描述（选填）" style="width:100%;"></div></div>';
  html += '</div>';
  html += '<div style="font-weight:500;font-size:14px;margin-bottom:4px;">添加资源</div>';
  html += '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:12px;">仅显示您有 master 权限的资源，可选择授权给他人的权限级别</div>';
  html += '<div style="display:flex;gap:8px;align-items:center;margin-bottom:12px;background:#fafafa;border:1px solid #f0f0f0;border-radius:6px;padding:12px;">';
  html += '<select class="ant-select" id="new-pkg-res-select" style="flex:1;">' + buildResSelectOptions([]) + '</select>';
  html += '<select class="ant-select" id="new-pkg-res-perm" style="width:120px;">';
  html += '<option value="reporter">reporter</option><option value="developer">developer</option><option value="master">master</option>';
  html += '</select>';
  html += '<button class="ant-btn ant-btn-primary" id="new-pkg-res-add-btn" style="flex-shrink:0;">+ 添加</button>';
  html += '</div>';
  html += '<div id="new-pkg-res-list" style="min-height:80px;border:1px dashed #d9d9d9;border-radius:6px;overflow:hidden;">';
  html += '<div style="text-align:center;color:#bfbfbf;padding:24px;font-size:13px;">暂未添加资源</div></div>';
  html += '</div>';
  html += '<div class="ant-drawer-footer">';
  html += '<button class="ant-btn" onclick="hideModal()">取消</button>';
  html += '<button class="ant-btn ant-btn-primary" id="new-pkg-confirm-btn">创建资源包</button>';
  html += '</div></div></div>';

  var mc = document.getElementById('modal-container');
  mc.innerHTML = html;
  var overlay = mc.querySelector('.ant-drawer-overlay');
  if (overlay) overlay.onclick = function (e) { if (e.target === overlay) hideModal(); };

  document.getElementById('new-pkg-res-add-btn').onclick = function () {
    var sel = document.getElementById('new-pkg-res-select');
    if (!sel || !sel.value) return;
    var opt = sel.options[sel.selectedIndex];
    var perm = document.getElementById('new-pkg-res-perm').value;
    pendingResources.push({
      resId: sel.value,
      name: opt.getAttribute('data-name'),
      type: opt.getAttribute('data-type'),
      typeColor: opt.getAttribute('data-typecolor') || 'default',
      perm: perm
    });
    refreshResSelect();
    renderPendingRes();
  };

  document.getElementById('new-pkg-confirm-btn').onclick = function () {
    var name = (document.getElementById('new-pkg-name').value || '').trim();
    if (!name) { showMessage('请输入资源包名称', 'error'); return; }
    var desc = (document.getElementById('new-pkg-desc').value || '').trim();
    var now = new Date();
    var nowStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0')
      + ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    MockData.resourcePackages.push({
      id: 'rp-' + String(Date.now()).slice(-6),
      name: name, description: desc,
      creator: '当前用户', creatorUsername: 'current', createTime: nowStr,
      resources: pendingResources.slice(), users: []
    });
    hideModal();
    showMessage('资源包「' + name + '」已创建', 'success');
    renderResPackages(document.getElementById('res-pkg-search') ? document.getElementById('res-pkg-search').value : '');
  };
}

// =============================================
// 编辑资源包
// =============================================
function showResPackageEditModal(pkg) {
  function getKeyword() {
    var s = document.getElementById('res-pkg-search'); return s ? s.value : '';
  }

  function renderEditBody() {
    var addedIds = (pkg.resources || []).map(function (r) { return r.resId; });
    var html = '';
    html += '<div style="padding-bottom:20px;margin-bottom:20px;border-bottom:1px solid #f0f0f0;">';
    html += '<div style="font-weight:500;font-size:14px;margin-bottom:14px;color:#1890ff;">基本信息</div>';
    html += '<div style="display:flex;gap:24px;flex-wrap:wrap;">';
    html += '<div class="ant-form-item" style="flex:1;min-width:200px;"><div class="ant-form-label"><span class="required">*</span>资源包名称</div>';
    html += '<div class="ant-form-control"><input class="ant-input" id="res-pkg-edit-name" value="' + esc(pkg.name) + '" style="width:100%;"></div></div>';
    html += '<div class="ant-form-item" style="flex:2;min-width:280px;"><div class="ant-form-label">描述</div>';
    html += '<div class="ant-form-control"><input class="ant-input" id="res-pkg-edit-desc" value="' + esc(pkg.description || '') + '" placeholder="请输入描述" style="width:100%;"></div></div>';
    html += '</div>';
    html += '<div style="font-size:12px;color:var(--text-secondary);margin-top:8px;">创建人：<b>' + esc(pkg.creator || '--') + '</b>&nbsp;&nbsp;创建时间：' + esc(pkg.createTime || '--') + '</div>';
    html += '</div>';

    html += '<div>';
    html += '<div style="font-weight:500;font-size:14px;margin-bottom:4px;color:#1890ff;">资源管理</div>';
    html += '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:12px;">仅显示您有 master 权限的资源</div>';
    html += '<div style="display:flex;gap:8px;align-items:center;margin-bottom:12px;background:#fafafa;border:1px solid #f0f0f0;border-radius:6px;padding:12px;">';
    html += '<select class="ant-select" id="res-search-select" style="flex:1;"><option value="">— 从我有 master 权限的资源中选择 —</option>';
    getMasterResources(addedIds).forEach(function (r) {
      html += '<option value="' + esc(r.resId) + '" data-name="' + esc(r.name) + '" data-type="' + esc(r.type) + '" data-typecolor="' + esc(r.typeColor || 'default') + '">'
        + esc(r.name) + ' (' + esc(r.type) + ')</option>';
    });
    html += '</select>';
    html += '<select class="ant-select" id="res-add-perm" style="width:120px;">';
    html += '<option value="reporter">reporter</option><option value="developer">developer</option><option value="master">master</option>';
    html += '</select>';
    html += '<button class="ant-btn ant-btn-primary" id="res-add-confirm-btn" style="flex-shrink:0;">+ 添加</button>';
    html += '</div>';

    if (!pkg.resources || pkg.resources.length === 0) {
      html += '<div style="text-align:center;color:var(--text-secondary);padding:24px;border:1px dashed #d9d9d9;border-radius:6px;">暂无资源，请添加</div>';
    } else {
      html += '<table class="ant-table"><thead><tr><th>资源名称</th><th>资源ID</th><th>类型</th><th>授权权限</th><th>操作</th></tr></thead><tbody>';
      pkg.resources.forEach(function (r, idx) {
        html += '<tr>';
        html += '<td>' + esc(r.name) + '</td>';
        html += '<td style="font-size:12px;color:var(--text-secondary);font-family:monospace;">' + esc(r.resId) + '</td>';
        html += '<td><span class="ant-tag ant-tag-' + esc(r.typeColor || 'default') + '">' + esc(r.type) + '</span></td>';
        html += '<td><select class="ant-select res-perm-select" data-res-idx="' + idx + '" style="width:120px;">';
        ['reporter', 'developer', 'master'].forEach(function (p) {
          html += '<option value="' + p + '"' + (r.perm === p ? ' selected' : '') + '>' + p + '</option>';
        });
        html += '</select></td>';
        html += '<td><a class="ant-btn-link res-remove-btn" data-res-idx="' + idx + '" style="color:#ff4d4f;">移除</a></td>';
        html += '</tr>';
      });
      html += '</tbody></table>';
    }
    html += '</div>';
    return html;
  }

  function bindEditEvents() {
    var body = document.getElementById('res-pkg-edit-body');
    if (!body) return;
    body.querySelectorAll('.res-perm-select').forEach(function (sel) {
      sel.onchange = function () {
        var idx = parseInt(sel.getAttribute('data-res-idx'));
        if (pkg.resources[idx]) pkg.resources[idx].perm = sel.value;
      };
    });
    body.querySelectorAll('.res-remove-btn').forEach(function (btn) {
      btn.onclick = function () {
        pkg.resources.splice(parseInt(btn.getAttribute('data-res-idx')), 1);
        body.innerHTML = renderEditBody();
        bindEditEvents();
        renderResPackages(getKeyword());
        showMessage('资源已移除', 'success');
      };
    });
    var addBtn = document.getElementById('res-add-confirm-btn');
    if (addBtn) {
      addBtn.onclick = function () {
        var sel = document.getElementById('res-search-select');
        if (!sel || !sel.value) { showMessage('请选择要添加的资源', 'error'); return; }
        var opt = sel.options[sel.selectedIndex];
        var perm = document.getElementById('res-add-perm').value;
        if (!pkg.resources) pkg.resources = [];
        pkg.resources.push({
          resId: sel.value,
          name: opt.getAttribute('data-name'),
          type: opt.getAttribute('data-type'),
          typeColor: opt.getAttribute('data-typecolor') || 'default',
          perm: perm
        });
        body.innerHTML = renderEditBody();
        bindEditEvents();
        renderResPackages(getKeyword());
        showMessage('资源已添加', 'success');
      };
    }
  }

  var html = '<div class="ant-drawer-overlay" style="display:flex;">';
  html += '<div class="ant-drawer" style="width:900px;">';
  html += '<div class="ant-drawer-header">编辑资源包 - ' + esc(pkg.name) + ' <button class="ant-drawer-close" onclick="hideModal()">&times;</button></div>';
  html += '<div class="ant-drawer-body" id="res-pkg-edit-body">' + renderEditBody() + '</div>';
  html += '<div class="ant-drawer-footer">';
  html += '<button class="ant-btn ant-btn-primary" id="res-pkg-save-btn">保存</button>';
  html += '<button class="ant-btn" onclick="hideModal()">关闭</button>';
  html += '</div></div></div>';

  var mc = document.getElementById('modal-container');
  mc.innerHTML = html;
  var overlay = mc.querySelector('.ant-drawer-overlay');
  if (overlay) overlay.onclick = function (e) { if (e.target === overlay) hideModal(); };
  bindEditEvents();

  document.getElementById('res-pkg-save-btn').onclick = function () {
    var name = (document.getElementById('res-pkg-edit-name').value || '').trim();
    if (!name) { showMessage('请输入资源包名称', 'error'); return; }
    pkg.name = name;
    pkg.description = (document.getElementById('res-pkg-edit-desc').value || '').trim();
    showMessage('资源包已保存', 'success');
    renderResPackages(getKeyword());
  };
}

// =============================================
// 用户授权
// =============================================
function showResPackageAuthDrawer(pkg) {
  function getKeyword() {
    var s = document.getElementById('res-pkg-search'); return s ? s.value : '';
  }

  function renderAuthBody() {
    var addedUsernames = (pkg.users || []).map(function (u) { return u.username; });
    var availableMembers = MockData.members.filter(function (m) { return addedUsernames.indexOf(m.username) === -1; });

    var html = '<div style="margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid #f0f0f0;">';
    html += '<div style="font-size:13px;color:var(--text-secondary);">资源包：<b style="color:var(--text-color);">' + esc(pkg.name) + '</b>&nbsp;&nbsp;创建人：' + esc(pkg.creator || '--') + '&nbsp;&nbsp;创建时间：' + esc(pkg.createTime || '--') + '</div>';
    if (pkg.resources && pkg.resources.length > 0) {
      html += '<div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:4px;">';
      pkg.resources.forEach(function (r) {
        html += '<span class="ant-tag ant-tag-' + esc(r.typeColor || 'default') + '" style="margin:0;">'
          + esc(r.name) + ' <span class="ant-tag ant-tag-' + esc(PERM_COLORS[r.perm] || 'default') + '" style="font-size:10px;padding:0 4px;margin:0 0 0 2px;">' + esc(r.perm) + '</span></span>';
      });
      html += '</div>';
    }
    html += '</div>';

    html += '<div style="display:flex;gap:8px;align-items:center;margin-bottom:16px;background:#fafafa;border:1px solid #f0f0f0;border-radius:6px;padding:12px;">';
    html += '<select class="ant-select" id="user-add-select" style="flex:1;"><option value="">— 搜索选择成员 —</option>';
    availableMembers.forEach(function (m) {
      html += '<option value="' + esc(m.username) + '" data-name="' + esc(m.name) + '" data-dept="' + esc(m.orgName) + '">'
        + esc(m.name) + '（' + esc(m.orgName) + '）</option>';
    });
    html += '</select>';
    html += '<button class="ant-btn ant-btn-primary" id="user-add-confirm-btn" style="flex-shrink:0;">+ 添加授权</button>';
    html += '</div>';

    var users = pkg.users || [];
    if (users.length === 0) {
      html += '<div style="text-align:center;color:var(--text-secondary);padding:32px;border:1px dashed #d9d9d9;border-radius:6px;">暂无授权用户，请添加</div>';
    } else {
      html += '<table class="ant-table"><thead><tr><th>姓名</th><th>账号</th><th>部门</th><th>操作</th></tr></thead><tbody>';
      users.forEach(function (u, idx) {
        html += '<tr>';
        html += '<td>' + esc(u.name) + '</td>';
        html += '<td style="font-size:12px;color:var(--text-secondary);font-family:monospace;">' + esc(u.username) + '@sohu-inc.com</td>';
        html += '<td>' + esc(u.dept || '') + '</td>';
        html += '<td><a class="ant-btn-link user-remove-btn" data-user-idx="' + idx + '" style="color:#ff4d4f;">撤销授权</a></td>';
        html += '</tr>';
      });
      html += '</tbody></table>';
    }
    return html;
  }

  function bindAuthEvents() {
    var body = document.getElementById('res-pkg-auth-body');
    if (!body) return;
    body.querySelectorAll('.user-remove-btn').forEach(function (btn) {
      btn.onclick = function () {
        pkg.users.splice(parseInt(btn.getAttribute('data-user-idx')), 1);
        body.innerHTML = renderAuthBody();
        bindAuthEvents();
        renderResPackages(getKeyword());
        showMessage('已撤销用户授权', 'success');
      };
    });
    var addBtn = document.getElementById('user-add-confirm-btn');
    if (addBtn) {
      addBtn.onclick = function () {
        var sel = document.getElementById('user-add-select');
        if (!sel || !sel.value) { showMessage('请选择成员', 'error'); return; }
        var opt = sel.options[sel.selectedIndex];
        if (!pkg.users) pkg.users = [];
        pkg.users.push({ name: opt.getAttribute('data-name'), username: sel.value, dept: opt.getAttribute('data-dept') });
        body.innerHTML = renderAuthBody();
        bindAuthEvents();
        renderResPackages(getKeyword());
        showMessage('授权成功', 'success');
      };
    }
  }

  var html = '<div class="ant-drawer-overlay" style="display:flex;">';
  html += '<div class="ant-drawer" style="width:640px;">';
  html += '<div class="ant-drawer-header">用户授权 - ' + esc(pkg.name) + ' <button class="ant-drawer-close" onclick="hideModal()">&times;</button></div>';
  html += '<div class="ant-drawer-body" id="res-pkg-auth-body">' + renderAuthBody() + '</div>';
  html += '<div class="ant-drawer-footer"><button class="ant-btn" onclick="hideModal()">关闭</button></div>';
  html += '</div></div>';

  var mc = document.getElementById('modal-container');
  mc.innerHTML = html;
  var overlay = mc.querySelector('.ant-drawer-overlay');
  if (overlay) overlay.onclick = function (e) { if (e.target === overlay) hideModal(); };
  bindAuthEvents();
}

// =============================================
// 删除确认
// =============================================
function showResPackageDeleteConfirm(pkg) {
  var html = '<div class="ant-modal-overlay" style="display:flex;">';
  html += '<div class="ant-modal" style="width:400px;">';
  html += '<div class="ant-modal-header">删除资源包 <button class="ant-modal-close" onclick="hideModal()">&times;</button></div>';
  html += '<div class="ant-modal-body">';
  html += '<div class="ant-alert ant-alert-error" style="margin-bottom:16px;">此操作不可恢复，请确认！</div>';
  html += '<p>确定删除资源包 <b>' + esc(pkg.name) + '</b>？</p>';
  html += '<p style="font-size:12px;color:var(--text-secondary);">包含 ' + (pkg.resources || []).length + ' 个资源，已授权 ' + (pkg.users || []).length + ' 名用户。</p>';
  html += '</div>';
  html += '<div class="ant-modal-footer"><button class="ant-btn" onclick="hideModal()">取消</button>';
  html += '<button class="ant-btn" id="pkg-delete-confirm-btn" style="background:#ff4d4f;color:#fff;border-color:#ff4d4f;">确认删除</button></div>';
  html += '</div></div>';

  var mc = document.getElementById('modal-container');
  mc.innerHTML = html;
  var overlay = mc.querySelector('.ant-modal-overlay');
  if (overlay) overlay.onclick = function (e) { if (e.target === overlay) hideModal(); };
  document.getElementById('pkg-delete-confirm-btn').onclick = function () {
    var idx = MockData.resourcePackages.indexOf(pkg);
    if (idx !== -1) MockData.resourcePackages.splice(idx, 1);
    hideModal();
    showMessage('资源包「' + pkg.name + '」已删除', 'success');
    renderResPackages(document.getElementById('res-pkg-search') ? document.getElementById('res-pkg-search').value : '');
  };
}
