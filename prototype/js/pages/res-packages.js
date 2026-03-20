'use strict';
// CMP 原型 - 资源包管理页

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

  var html = '<table class="ant-table"><thead><tr><th>资源包名称</th><th>描述</th><th>创建人 / 时间</th><th>可见范围</th><th>包含资源</th><th>已授权用户</th><th>操作</th></tr></thead><tbody>';
  var visibilityLabels = { all: '全员可见', dept: '本部门', admin: '仅管理员' };
  var visibilityColors = { all: 'green', dept: 'blue', admin: 'orange' };
  filtered.forEach(function (pkg) {
    var resTags = (pkg.resources || []).slice(0, 2).map(function (r) {
      return '<span class="ant-tag ant-tag-' + esc(r.typeColor || 'default') + '">' + esc(r.name) + '</span>';
    }).join('');
    var resCount = (pkg.resources || []).length;
    if (resCount > 2) resTags += '<span style="font-size:12px;color:var(--text-secondary);">等 ' + resCount + ' 个</span>';

    var userTags = (pkg.users || []).slice(0, 2).map(function (u) {
      return '<span class="ant-tag">' + esc(u.name) + '</span>';
    }).join('');
    var userCount = (pkg.users || []).length;
    if (userCount > 2) userTags += '<span style="font-size:12px;color:var(--text-secondary);">等 ' + userCount + ' 人</span>';

    var vis = pkg.visibility || 'all';
    var visLabel = visibilityLabels[vis] || vis;
    if (vis === 'dept' && pkg.visibilityDept) visLabel = pkg.visibilityDept;
    var visColor = visibilityColors[vis] || 'default';

    html += '<tr>';
    html += '<td><strong>' + esc(pkg.name) + '</strong></td>';
    html += '<td style="color:var(--text-secondary);font-size:13px;max-width:200px;">' + esc(pkg.description || '--') + '</td>';
    html += '<td style="font-size:12px;white-space:nowrap;">' + esc(pkg.creator || '--') + '<br><span style="color:var(--text-secondary);">' + esc(pkg.createTime || '') + '</span></td>';
    html += '<td><span class="ant-tag ant-tag-' + visColor + '">' + esc(visLabel) + '</span></td>';
    html += '<td>' + (resTags || '<span style="color:var(--text-secondary);">暂无</span>') + '</td>';
    html += '<td>' + (userTags || '<span style="color:var(--text-secondary);">暂无</span>') + '</td>';
    html += '<td style="white-space:nowrap;">';
    html += '<a class="ant-btn-link res-pkg-edit" data-pkg-id="' + esc(pkg.id) + '">编辑</a> ';
    html += '<a class="ant-btn-link res-pkg-auth" data-pkg-id="' + esc(pkg.id) + '">用户授权</a> ';
    html += '<a class="ant-btn-link res-pkg-delete" data-pkg-id="' + esc(pkg.id) + '" style="color:#ff4d4f;">删除</a>';
    html += '</td></tr>';
  });
  html += '</tbody></table>';
  tableContainer.innerHTML = html;

  tableContainer.querySelectorAll('.res-pkg-edit').forEach(function (btn) {
    btn.onclick = function () {
      var pkgId = btn.getAttribute('data-pkg-id');
      var pkg = packages.find(function (p) { return p.id === pkgId; });
      if (pkg) showResPackageEditModal(pkg);
    };
  });

  tableContainer.querySelectorAll('.res-pkg-auth').forEach(function (btn) {
    btn.onclick = function () {
      var pkgId = btn.getAttribute('data-pkg-id');
      var pkg = packages.find(function (p) { return p.id === pkgId; });
      if (pkg) showResPackageAuthDrawer(pkg);
    };
  });

  tableContainer.querySelectorAll('.res-pkg-delete').forEach(function (btn) {
    btn.onclick = function () {
      var pkgId = btn.getAttribute('data-pkg-id');
      var pkg = packages.find(function (p) { return p.id === pkgId; });
      if (pkg) showResPackageDeleteConfirm(pkg);
    };
  });
}

function showNewResPackageModal() {
  var html = '<div class="ant-drawer-overlay" style="display:flex;">';
  html += '<div class="ant-drawer" style="width:760px;">';
  html += '<div class="ant-drawer-header">新建资源包 <button class="ant-drawer-close" onclick="hideModal()">&times;</button></div>';
  html += '<div class="ant-drawer-body">';
  // 基本信息区
  html += '<div style="display:flex;gap:24px;margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid #f0f0f0;flex-wrap:wrap;">';
  html += '<div class="ant-form-item" style="flex:1;min-width:220px;"><div class="ant-form-label"><span class="required">*</span>资源包名称</div>';
  html += '<div class="ant-form-control"><input class="ant-input" id="new-pkg-name" placeholder="请输入资源包名称" style="width:100%;"></div></div>';
  html += '<div class="ant-form-item" style="flex:2;min-width:300px;"><div class="ant-form-label">描述</div>';
  html += '<div class="ant-form-control"><input class="ant-input" id="new-pkg-desc" placeholder="请输入描述（选填）" style="width:100%;"></div></div>';
  html += '<div class="ant-form-item" style="flex:1;min-width:160px;"><div class="ant-form-label">可见范围</div>';
  html += '<div class="ant-form-control"><select class="ant-select" id="new-pkg-visibility" style="width:100%;"><option value="all">全员可见</option><option value="dept" selected>本部门可见</option><option value="admin">仅管理员</option></select></div></div>';
  html += '</div>';
  // 资源选择区
  html += '<div style="font-weight:500;font-size:14px;margin-bottom:12px;">添加资源</div>';
  html += '<div style="display:flex;gap:8px;align-items:center;margin-bottom:12px;">';
  html += '<select class="ant-select" id="new-pkg-res-select" style="flex:1;"><option value="">— 从有权限资源中搜索选择 —</option>';
  MockData.resources.forEach(function (r) {
    html += '<option value="' + esc(r.resId) + '" data-name="' + esc(r.name) + '" data-type="' + esc(r.type) + '" data-typecolor="' + esc(r.typeColor || 'default') + '">' + esc(r.name) + ' (' + esc(r.type) + ')</option>';
  });
  html += '</select>';
  html += '<select class="ant-select" id="new-pkg-res-perm" style="width:100px;"><option value="reporter">只读</option><option value="developer">开发者</option><option value="master">管理员</option></select>';
  html += '<button class="ant-btn ant-btn-primary" id="new-pkg-res-add-btn" style="flex-shrink:0;">+ 添加</button>';
  html += '</div>';
  // 已选资源列表
  html += '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:6px;">已选资源：</div>';
  html += '<div id="new-pkg-res-list" style="min-height:80px;border:1px dashed #d9d9d9;border-radius:6px;padding:10px;background:#fafafa;">';
  html += '<span style="color:#bfbfbf;font-size:13px;">暂未添加资源</span></div>';
  html += '</div>';
  html += '<div class="ant-drawer-footer">';
  html += '<button class="ant-btn" onclick="hideModal()">取消</button>';
  html += '<button class="ant-btn ant-btn-primary" id="new-pkg-confirm-btn">创建资源包</button>';
  html += '</div>';
  html += '</div></div>';
  var mc = document.getElementById('modal-container');
  mc.innerHTML = html;
  var overlay = mc.querySelector('.ant-drawer-overlay');
  if (overlay) overlay.onclick = function (e) { if (e.target === overlay) hideModal(); };

  var pendingResources = [];

  function renderPendingRes() {
    var listEl = document.getElementById('new-pkg-res-list');
    if (!listEl) return;
    if (pendingResources.length === 0) {
      listEl.innerHTML = '<span style="color:#bfbfbf;font-size:13px;">暂未添加资源</span>';
      return;
    }
    var lHtml = '<table style="width:100%;border-collapse:collapse;font-size:13px;">';
    lHtml += '<thead><tr style="color:var(--text-secondary);border-bottom:1px solid #f0f0f0;">';
    lHtml += '<th style="text-align:left;padding:4px 8px;font-weight:500;">资源名称</th>';
    lHtml += '<th style="text-align:left;padding:4px 8px;font-weight:500;">类型</th>';
    lHtml += '<th style="text-align:left;padding:4px 8px;font-weight:500;">权限</th>';
    lHtml += '<th style="width:50px;"></th></tr></thead><tbody>';
    pendingResources.forEach(function (r, i) {
      lHtml += '<tr style="border-bottom:1px solid #f5f5f5;">';
      lHtml += '<td style="padding:6px 8px;">' + esc(r.name) + '</td>';
      lHtml += '<td style="padding:6px 8px;"><span class="ant-tag">' + esc(r.type) + '</span></td>';
      lHtml += '<td style="padding:6px 8px;color:#1890ff;">' + esc(r.perm) + '</td>';
      lHtml += '<td style="padding:6px 8px;text-align:center;"><a style="color:#ff4d4f;cursor:pointer;" data-remove-idx="' + i + '">删除</a></td>';
      lHtml += '</tr>';
    });
    lHtml += '</tbody></table>';
    listEl.innerHTML = lHtml;
    listEl.querySelectorAll('[data-remove-idx]').forEach(function (a) {
      a.onclick = function () { pendingResources.splice(parseInt(a.getAttribute('data-remove-idx')), 1); renderPendingRes(); };
    });
  }

  document.getElementById('new-pkg-res-add-btn').onclick = function () {
    var sel = document.getElementById('new-pkg-res-select');
    if (!sel || !sel.value) return;
    var opt = sel.options[sel.selectedIndex];
    var perm = document.getElementById('new-pkg-res-perm').value;
    pendingResources.push({ resId: sel.value, name: opt.getAttribute('data-name'), type: opt.getAttribute('data-type'), typeColor: opt.getAttribute('data-typecolor') || 'default', perm: perm });
    sel.value = '';
    renderPendingRes();
  };

  document.getElementById('new-pkg-confirm-btn').onclick = function () {
    var name = (document.getElementById('new-pkg-name').value || '').trim();
    var desc = (document.getElementById('new-pkg-desc').value || '').trim();
    if (!name) { showMessage('请输入资源包名称', 'error'); return; }
    var newId = 'rp-' + String(Date.now()).slice(-6);
    var now = new Date();
    var nowStr = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0') + ' ' + String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
    var vis = (document.getElementById('new-pkg-visibility') || {}).value || 'dept';
    MockData.resourcePackages.push({ id: newId, name: name, description: desc, creator: '当前用户', creatorUsername: 'current', createTime: nowStr, visibility: vis, resources: pendingResources.slice(), users: [] });
    hideModal();
    showMessage('资源包「' + name + '」已创建', 'success');
    renderResPackages(document.getElementById('res-pkg-search') ? document.getElementById('res-pkg-search').value : '');
  };
}

function showResPackageAuthDrawer(pkg) {
  function getKeyword() {
    var s = document.getElementById('res-pkg-search');
    return s ? s.value : '';
  }

  function renderAuthBody() {
    var addedUsernames = (pkg.users || []).map(function (u) { return u.username; });
    var availableMembers = MockData.members.filter(function (m) { return addedUsernames.indexOf(m.username) === -1; });
    var html = '<div style="margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid #f0f0f0;">';
    html += '<div style="font-size:13px;color:var(--text-secondary);">资源包：<b style="color:inherit;">' + esc(pkg.name) + '</b>　创建人：' + esc(pkg.creator || '--') + '　创建时间：' + esc(pkg.createTime || '--') + '</div>';
    html += '</div>';
    html += '<div style="display:flex;gap:8px;align-items:center;margin-bottom:16px;background:#fafafa;border:1px solid #f0f0f0;border-radius:6px;padding:12px;">';
    html += '<select class="ant-select" id="user-add-select" style="flex:1;"><option value="">— 搜索选择成员 —</option>';
    availableMembers.forEach(function (m) {
      html += '<option value="' + esc(m.username) + '" data-name="' + esc(m.name) + '" data-dept="' + esc(m.orgName) + '">' + esc(m.name) + '（' + esc(m.orgName) + '）</option>';
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
        html += '<tr><td>' + esc(u.name) + '</td>';
        html += '<td style="font-size:12px;color:var(--text-secondary);font-family:monospace;">' + esc(u.username) + '@sohu-inc.com</td>';
        html += '<td>' + esc(u.dept || '') + '</td>';
        html += '<td><a class="ant-btn-link user-remove-btn" data-user-idx="' + idx + '" style="color:#ff4d4f;">撤销授权</a></td></tr>';
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

function showResPackageEditModal(pkg) {
  function getKeyword() {
    var s = document.getElementById('res-pkg-search');
    return s ? s.value : '';
  }

  function renderEditBody() {
    var permLabels = { master: '管理员', developer: '开发者', reporter: '只读' };
    var alreadyAddedIds = (pkg.resources || []).map(function (r) { return r.resId; });
    var availableRes = MockData.resources.filter(function (r) {
      return alreadyAddedIds.indexOf(r.resId) === -1;
    });
    var html = '';
    // 基本信息
    html += '<div style="padding-bottom:20px;margin-bottom:20px;border-bottom:1px solid #f0f0f0;">';
    html += '<div style="font-weight:500;font-size:14px;margin-bottom:14px;color:#1890ff;">基本信息</div>';
    html += '<div style="display:flex;gap:24px;flex-wrap:wrap;">';
    html += '<div class="ant-form-item" style="flex:1;min-width:200px;"><div class="ant-form-label"><span class="required">*</span>资源包名称</div>';
    html += '<div class="ant-form-control"><input class="ant-input" id="res-pkg-edit-name" value="' + esc(pkg.name) + '" style="width:100%;"></div></div>';
    html += '<div class="ant-form-item" style="flex:2;min-width:280px;"><div class="ant-form-label">描述</div>';
    html += '<div class="ant-form-control"><input class="ant-input" id="res-pkg-edit-desc" value="' + esc(pkg.description || '') + '" placeholder="请输入描述" style="width:100%;"></div></div>';
    html += '</div>';
    html += '<div style="display:flex;gap:24px;flex-wrap:wrap;margin-top:12px;">';
    html += '<div class="ant-form-item" style="flex:1;min-width:200px;"><div class="ant-form-label">可见范围</div>';
    html += '<div class="ant-form-control"><select class="ant-select" id="res-pkg-edit-visibility" style="width:100%;">';
    [['all','全员可见'],['dept','本部门可见'],['admin','仅管理员']].forEach(function(v) {
      html += '<option value="' + v[0] + '"' + (pkg.visibility === v[0] ? ' selected' : '') + '>' + v[1] + '</option>';
    });
    html += '</select></div></div>';
    html += '<div style="flex:2;min-width:280px;display:flex;align-items:flex-end;padding-bottom:4px;font-size:12px;color:var(--text-secondary);">';
    html += '创建人：<b>' + esc(pkg.creator || '--') + '</b>&nbsp;&nbsp;创建时间：' + esc(pkg.createTime || '--');
    html += '</div>';
    html += '</div></div>';
    // 资源管理
    html += '<div>';
    html += '<div style="font-weight:500;font-size:14px;margin-bottom:12px;color:#1890ff;">资源管理</div>';
    html += '<div style="display:flex;gap:8px;align-items:center;margin-bottom:12px;background:#fafafa;border:1px solid #f0f0f0;border-radius:6px;padding:12px;">';
    html += '<select class="ant-select" id="res-search-select" style="flex:1;"><option value="">— 从有权限资源中选择 —</option>';
    availableRes.forEach(function (r) {
      html += '<option value="' + esc(r.resId) + '" data-name="' + esc(r.name) + '" data-type="' + esc(r.type) + '" data-typecolor="' + esc(r.typeColor || 'default') + '">' + esc(r.name) + ' (' + esc(r.type) + ')</option>';
    });
    html += '</select>';
    html += '<select class="ant-select" id="res-add-perm" style="width:100px;"><option value="reporter">只读</option><option value="developer">开发者</option><option value="master">管理员</option></select>';
    html += '<button class="ant-btn ant-btn-primary" id="res-add-confirm-btn" style="flex-shrink:0;">+ 添加</button>';
    html += '</div>';
    if (!pkg.resources || pkg.resources.length === 0) {
      html += '<div style="text-align:center;color:var(--text-secondary);padding:24px;border:1px dashed #d9d9d9;border-radius:6px;">暂无资源，请添加</div>';
    } else {
      html += '<table class="ant-table"><thead><tr><th>资源名称</th><th>资源ID</th><th>类型</th><th>权限</th><th>操作</th></tr></thead><tbody>';
      pkg.resources.forEach(function (r, idx) {
        html += '<tr><td>' + esc(r.name) + '</td>';
        html += '<td style="font-size:12px;color:var(--text-secondary);font-family:monospace;">' + esc(r.resId) + '</td>';
        html += '<td><span class="ant-tag ant-tag-' + esc(r.typeColor || 'default') + '">' + esc(r.type) + '</span></td>';
        html += '<td><select class="ant-select res-perm-select" data-res-idx="' + idx + '" style="width:100px;">';
        ['reporter', 'developer', 'master'].forEach(function (p) {
          html += '<option value="' + p + '"' + (r.perm === p ? ' selected' : '') + '>' + permLabels[p] + '</option>';
        });
        html += '</select></td>';
        html += '<td><a class="ant-btn-link res-remove-btn" data-res-idx="' + idx + '" style="color:#ff4d4f;">移除</a></td></tr>';
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
        pkg.resources.push({ resId: sel.value, name: opt.getAttribute('data-name'), type: opt.getAttribute('data-type'), typeColor: opt.getAttribute('data-typecolor') || 'default', perm: perm });
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
    pkg.visibility = document.getElementById('res-pkg-edit-visibility').value;
    showMessage('资源包已保存', 'success');
    renderResPackages(getKeyword());
  };
}
