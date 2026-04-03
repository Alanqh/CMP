'use strict';
// CMP 原型 - 组织架构页

// =============================================
// 组织架构页
// =============================================
function renderOrgTree(orgs, selectedId) {
  function buildNode(node, expanded) {
    var hasChildren = node.children && node.children.length > 0;
    var isSelected = node.id === selectedId;
    var html = '<div class="ant-tree-node">';
    html += '<div class="ant-tree-node-content' + (isSelected ? ' selected' : '') + '" data-org-id="' + node.id + '">';
    if (hasChildren) {
      html += '<span class="ant-tree-switcher">' + (expanded ? '&#9660;' : '&#9654;') + '</span>';
    } else {
      html += '<span class="ant-tree-switcher" style="visibility:hidden;">&#9654;</span>';
    }
    html += '<span class="ant-tree-icon">' + node.icon + '</span>';
    html += '<span class="ant-tree-title">' + esc(node.name) + '</span>';
    html += '<span class="ant-tree-extra">' + MockData.countMembers(node.id) + '人</span>';
    html += '</div>';
    if (hasChildren) {
      var shouldExpand = expanded || isAncestorOf(node, selectedId);
      html += '<div class="ant-tree-children"' + (shouldExpand ? '' : ' style="display:none;"') + '>';
      for (var i = 0; i < node.children.length; i++) {
        html += buildNode(node.children[i], shouldExpand);
      }
      html += '</div>';
    }
    html += '</div>';
    return html;
  }
  // 未分配成员数量
  var unassignedCount = MockData.members.filter(function (m) { return m.orgId === 'unassigned'; }).length;
  var html = '<div class="ant-tree">';
  // 未分配成员节点（仅超管可见）
  if (unassignedCount > 0 && currentRole === 'superadmin') {
    var isUnassignedSelected = selectedId === 'unassigned';
    html += '<div class="ant-tree-node"><div class="ant-tree-node-content' + (isUnassignedSelected ? ' selected' : '') + '" data-org-id="unassigned" title="仅超级管理员可管理未分配成员">';
    html += '<span class="ant-tree-switcher" style="visibility:hidden;">&#9654;</span>';
    html += '<span class="ant-tree-icon" style="color:#faad14;">&#9888;</span>';
    html += '<span class="ant-tree-title" style="color:#faad14;">未分配成员</span>';
    html += '<span class="ant-tree-extra">' + unassignedCount + '人</span>';
    html += '</div></div>';
  }
  for (var i = 0; i < orgs.length; i++) {
    html += buildNode(orgs[i], orgs[i].id === selectedId || isAncestorOf(orgs[i], selectedId));
  }
  html += '</div>';
  return html;
}

function isAncestorOf(node, targetId) {
  if (!node.children) return false;
  for (var i = 0; i < node.children.length; i++) {
    if (node.children[i].id === targetId) return true;
    if (isAncestorOf(node.children[i], targetId)) return true;
  }
  return false;
}

function renderOrgDetail(org) {
  if (!org) return '';
  var typeLabel = { dept: '部门', group: '一级组', subgroup: '二级组' };
  var childCount = org.children ? org.children.length : 0;
  var childLabel = org.type === 'dept' ? (childCount + ' 个一级组') : (childCount > 0 ? (childCount + ' 个下级组') : '无');
  // 编辑权限：超管可操作所有；部门负责人可编辑组（不能编辑部门）；组长无权
  // 删除权限：部门仅超管可删除，组仅部门负责人及以上可删除
  var canEdit = currentRole === 'superadmin' || (currentRole === 'dept_head' && org.type !== 'dept');
  var canDelete = org.type === 'dept'
    ? (currentRole === 'superadmin')
    : (currentRole === 'superadmin' || currentRole === 'dept_head');
  var html = '<div class="ant-card"><div class="ant-card-head"><span id="org-detail-title">' + esc(org.name) + '</span>';
  if (canEdit || canDelete) {
    html += '<div class="btn-group">';
    if (canEdit) html += '<button class="ant-btn-link" id="btn-edit-org" data-org-id="' + org.id + '">编辑</button>';
    if (canDelete) html += '<button class="ant-btn-link" id="btn-delete-org" data-org-id="' + org.id + '" style="color:#ff4d4f;">删除</button>';
    html += '</div>';
  }
  html += '</div>';
  html += '<div class="ant-card-body" style="padding:0;"><div class="ant-descriptions">';
  html += '<div class="ant-descriptions-row"><div class="ant-descriptions-label">类型</div><div class="ant-descriptions-content"><span class="ant-tag ant-tag-blue">' + (typeLabel[org.type] || org.type) + '</span></div></div>';
  html += '<div class="ant-descriptions-row"><div class="ant-descriptions-label">负责人</div><div class="ant-descriptions-content">' + esc(org.leader.name) + ' (' + esc(email(org.leader.username)) + ')</div></div>';
  html += '<div class="ant-descriptions-row"><div class="ant-descriptions-label">成员数</div><div class="ant-descriptions-content">' + MockData.countMembers(org.id) + ' 人</div></div>';
  html += '<div class="ant-descriptions-row"><div class="ant-descriptions-label">下级组</div><div class="ant-descriptions-content">' + childLabel + '</div></div>';
  if (org.type !== 'dept') {
    html += '<div class="ant-descriptions-row"><div class="ant-descriptions-label">成员匹配规则</div><div class="ant-descriptions-content">' + (org.matchRule ? '<code style="background:#f5f5f5;padding:2px 8px;border:1px solid #d9d9d9;border-radius:2px;font-size:13px;">' + esc(org.matchRule) + '</code>' : '<span style="color:var(--text-secondary);">未配置</span>') + '</div></div>';
  } else {
    html += '<div class="ant-descriptions-row"><div class="ant-descriptions-label">成员匹配规则</div><div class="ant-descriptions-content">' + (org.matchRule ? '<code style="background:#f5f5f5;padding:2px 8px;border:1px solid #d9d9d9;border-radius:2px;font-size:13px;">' + esc(org.matchRule) + '</code>' : '<span style="color:var(--text-secondary);">未配置</span>') + '<div style="font-size:11px;color:#999;margin-top:2px;">提示：填写成员在ERP系统中的部门，支持通配符*，多条规则用英文逗号分隔，匹配后自动归组，优先归到下级组</div></div></div>';
  }
  if (org.type === 'dept') {
    html += '<div class="ant-descriptions-row"><div class="ant-descriptions-label">绑定云账号</div><div class="ant-descriptions-content">' + (org.cloudAccount ? '<span class="ant-tag ant-tag-blue">' + esc(org.cloudAccount) + '</span>' : '--') + '</div></div>';

    var projs = org.projects || [];
    var projsHtml = '';
    if (projs.length === 0) {
      projsHtml = '--';
    } else if (projs.length <= 2) {
      projsHtml = projs.map(function (p) { return '<span class="ant-tag ant-tag-cyan">' + esc(p) + '</span>'; }).join(' ');
    } else {
      projsHtml = projs.slice(0, 2).map(function (p) { return '<span class="ant-tag ant-tag-cyan">' + esc(p) + '</span>'; }).join(' ');
      projsHtml += ' <span class="org-overflow-trigger" data-overflow-type="projects" data-org-id="' + org.id + '">等 ' + projs.length + ' 个<span class="org-overflow-popover"><span class="org-overflow-popover-title">全部关联项目（' + projs.length + '）</span>' + projs.map(function (p) { return '<span class="ant-tag ant-tag-cyan">' + esc(p) + '</span>'; }).join('') + '</span></span>';
    }
    html += '<div class="ant-descriptions-row"><div class="ant-descriptions-label">关联项目</div><div class="ant-descriptions-content">' + projsHtml + '</div></div>';
  }
  html += '</div></div></div>';
  return html;
}

function renderOrgMembers(orgId, keyword, page) {
  var orgIds = MockData.getOrgAndChildIds(orgId);
  var isDeptSelected = orgId.indexOf('dept-') === 0;
  var isGroupSelected = !isDeptSelected;
  // 添加/移除成员按钮权限:
  // - 为部门添加/移除成员: 仅部门负责人及以上权限可操作
  // - 为一级组或二级组添加/移除成员: 部门负责人可操作;一级组组长只能操作自己组以及自己组的下级组;二级组组长只能操作自己组
  var canManageMember = false;
  var ctx = getRoleContext();
  if (isDeptSelected) {
    // 部门添加/移除成员: 超管或部门负责人
    canManageMember = currentRole === 'superadmin' || currentRole === 'dept_head';
  } else {
    // 组添加/移除成员
    if (currentRole === 'superadmin' || currentRole === 'dept_head') {
      // 超管和部门负责人可以为任何组添加/移除成员
      canManageMember = true;
    } else if (currentRole === 'group_leader1' || currentRole === 'group_leader2') {
      // 一级组组长: 可以操作自己组以及自己组的下级组
      // 二级组组长: 只能操作自己组
      var selectedOrg = MockData.findOrg(orgId);
      if (selectedOrg && ctx.rootOrgId) {
        var rootAndChildIds = MockData.getOrgAndChildIds(ctx.rootOrgId);
        if (rootAndChildIds.indexOf(orgId) !== -1) {
          canManageMember = true;
        }
      }
    }
  }
  var filtered = MockData.members.filter(function (m) {
    if (m.orgId === 'unassigned') return false;
    if (orgIds.indexOf(m.orgId) === -1) return false;
    if (keyword) {
      var kw = keyword.toLowerCase();
      return m.name.toLowerCase().indexOf(kw) !== -1 || m.username.toLowerCase().indexOf(kw) !== -1;
    }
    return true;
  });

  // 排序：按加入时间顺序排列，但部门负责人始终在第一个
  filtered.sort(function(a, b) {
    if (a.role === '部门负责人' && b.role !== '部门负责人') return -1;
    if (a.role !== '部门负责人' && b.role === '部门负责人') return 1;
    return a.joinDate.localeCompare(b.joinDate);
  });

  var total = filtered.length;
  var start = (page - 1) * PAGE_SIZE;
  var pageData = filtered.slice(start, start + PAGE_SIZE);
  var roleColors = { '部门负责人': 'orange', '组长': 'cyan', '成员': 'default' };

  var html = '<div class="ant-card"><div class="ant-card-head"><span>成员列表</span>';
  html += '<div class="btn-group"><div class="ant-input-search"><input id="org-member-search" placeholder="搜索姓名/邮箱..." value="' + esc(keyword) + '" />';
  html += '<button class="ant-input-search-button">&#128269;</button></div>';
  if (canManageMember) html += '<button class="ant-btn ant-btn-primary ant-btn-sm" id="btn-add-member" data-org-id="' + esc(orgId) + '">+ 添加成员</button>';
  html += '</div></div>';
  html += '<table class="ant-table"><thead><tr><th>姓名</th><th>邮箱</th><th>所属组</th><th>角色</th><th>加入时间</th><th>操作</th></tr></thead><tbody>';
  if (pageData.length === 0) {
    html += '<tr><td colspan="6" style="text-align:center;color:var(--text-secondary);padding:32px;">暂无数据</td></tr>';
  }
  for (var i = 0; i < pageData.length; i++) {
    var m = pageData[i];
    var roleColor = roleColors[m.role] || 'default';
    var memberOrgId = m.orgId;
    var isMemberInSelectedDeptNoGroup = isDeptSelected && memberOrgId === orgId;
    var isMemberInSelectedDeptHasGroup = isDeptSelected && memberOrgId !== orgId;
    var isMemberInSelectedGroup = isGroupSelected;

    html += '<tr><td>' + esc(m.name) + '</td><td>' + esc(email(m.username)) + '</td>';
    html += '<td><span class="ant-tag ant-tag-blue">' + esc(MockData.getOrgPath(m.orgId, orgId)) + '</span></td>';
    html += '<td><span class="ant-tag ant-tag-' + roleColor + '">' + esc(m.role) + '</span></td>';
    html += '<td>' + esc(m.joinDate) + '</td>';
    html += '<td>';

    if (isDeptSelected) {
      // 部门成员列表
      if (m.role === '部门负责人') {
        // 角色为部门负责人：无任何操作
        html += '<span style="color:#999;">--</span>';
      } else if (isMemberInSelectedDeptNoGroup) {
        // 在部门但没有组的普通成员：归组、移出部门
        if (canManageMember) {
          html += '<a class="ant-btn-link assign-to-group-btn" data-username="' + esc(m.username) + '" data-member-name="' + esc(m.name) + '" style="color:#faad14;">归组</a>';
          html += ' <a class="ant-btn-link remove-member-btn" data-username="' + esc(m.username) + '" data-member-name="' + esc(m.name) + '" data-org-type="dept" style="color:#ff4d4f;">移出部门</a>';
        }
      } else if (isMemberInSelectedDeptHasGroup) {
        // 在部门有组的成员：调组、移出组
        if (canManageMember) {
          html += '<a class="ant-btn-link transfer-group-btn" data-username="' + esc(m.username) + '" data-member-name="' + esc(m.name) + '">调组</a>';
          html += ' <a class="ant-btn-link remove-member-btn" data-username="' + esc(m.username) + '" data-member-name="' + esc(m.name) + '" data-org-type="group" style="color:#ff4d4f;">移出组</a>';
        }
      }
    } else {
      // 一级组、二级组成员列表
      if (m.role === '组长') {
        // 组长：无任何操作
        html += '<span style="color:#999;">--</span>';
      } else {
        // 成员：移出组
        if (canManageMember) {
          html += '<a class="ant-btn-link remove-member-btn" data-username="' + esc(m.username) + '" data-member-name="' + esc(m.name) + '" data-org-type="group" style="color:#ff4d4f;">移出组</a>';
        }
      }
    }

    html += '</td></tr>';
  }
  html += '</tbody></table><div id="org-members-pagination"></div></div>';
  return { html: html, total: total };
}

function initOrgPage() {
  var s = state.org;
  var container = document.getElementById('page-container');

  // 根据角色计算可见的组织树范围
  var ctx = getRoleContext();
  var visibleOrgs;
  if (!ctx.deptId) {
    // 超管：全部
    visibleOrgs = MockData.orgs;
  } else if (currentRole === 'dept_head') {
    // 部门负责人：只看自己部门
    visibleOrgs = MockData.orgs.filter(function (o) { return o.id === ctx.deptId; });
  } else {
    // 组长：只看自己组的子树
    var rootOrg = MockData.findOrg(ctx.rootOrgId);
    visibleOrgs = rootOrg ? [rootOrg] : [];
  }

  // 如果当前选中节点不在可见范围内，自动跳到角色根节点
  if (ctx.orgIds && ctx.orgIds.indexOf(s.selectedOrgId) === -1 && s.selectedOrgId !== 'unassigned') {
    s.selectedOrgId = ctx.rootOrgId || (visibleOrgs.length > 0 ? visibleOrgs[0].id : '');
    s.memberPage = 1;
  }

  // Render tree
  var treeContainer = document.getElementById('org-tree-container');
  if (treeContainer) {
    treeContainer.innerHTML = renderOrgTree(visibleOrgs, s.selectedOrgId);
    // Update dept count（超管显示总部门数，其他显示本组织名称）
    var deptCount = container.querySelector('.org-dept-count');
    if (deptCount) {
      deptCount.textContent = currentRole === 'superadmin'
        ? (MockData.orgs.length + ' 个部门')
        : ctx.deptName || '';
    }
  }

  // 隐藏超管专属按钮
  var addDeptBtn = document.getElementById('btn-add-dept');
  if (addDeptBtn) addDeptBtn.style.display = (currentRole === 'superadmin') ? '' : 'none';

  // 组长不能新建/删除组
  var addGroupBtn = document.getElementById('btn-add-group');
  if (addGroupBtn) addGroupBtn.style.display = (currentRole === 'superadmin' || currentRole === 'dept_head') ? '' : 'none';

  // Render detail
  var detailContainer = document.getElementById('org-detail-container');
  var membersContainer = document.getElementById('org-members-container');

  if (s.selectedOrgId === 'unassigned') {
    // 未分配成员专用视图
    if (detailContainer) {
      detailContainer.innerHTML = '<div class="ant-card"><div class="ant-card-head"><span>未分配成员</span></div>' +
        '<div class="ant-card-body"><div class="ant-alert ant-alert-info" style="background:#e6f7ff;border:1px solid #91d5ff;border-radius:4px;padding:8px 12px;color:#1890ff;font-size:13px;">&#9432; 以下成员尚未归属任何部门，需要由超级管理员手动分配到对应部门。</div></div></div>';
    }
    if (membersContainer) {
      var result = renderUnassignedMembers(s.memberKeyword, s.memberPage);
      membersContainer.innerHTML = result.html;
      var pagEl = document.getElementById('org-members-pagination');
      if (pagEl) renderPagination(pagEl, result.total, s.memberPage, PAGE_SIZE, function (p) { s.memberPage = p; initOrgPage(); });
      bindUnassignedActions();
    }
  } else {
    var org = MockData.findOrg(s.selectedOrgId);
    if (detailContainer && org) {
      detailContainer.innerHTML = renderOrgDetail(org);
      bindEditOrgBtn();
    }
    // Render members
    if (membersContainer) {
      var result = renderOrgMembers(s.selectedOrgId, s.memberKeyword, s.memberPage);
      membersContainer.innerHTML = result.html;
      var pagEl = document.getElementById('org-members-pagination');
      if (pagEl) {
        renderPagination(pagEl, result.total, s.memberPage, PAGE_SIZE, function (p) {
          s.memberPage = p;
          initOrgPage();
        });
      }
    }
  }

  // Bind tree events
  bindTreeEvents();
  // Bind member search (非 unassigned 时)
  if (s.selectedOrgId !== 'unassigned') {
    var searchInput = document.getElementById('org-member-search');
    if (searchInput) {
      function handleMemberSearch() {
        var currentInput = document.getElementById('org-member-search');
        if (!currentInput) return;
        s.memberKeyword = currentInput.value;
        s.memberPage = 1;
        var mc = document.getElementById('org-members-container');
        if (mc) {
          var r = renderOrgMembers(s.selectedOrgId, s.memberKeyword, s.memberPage);
          mc.innerHTML = r.html;
          var pe = document.getElementById('org-members-pagination');
          if (pe) renderPagination(pe, r.total, s.memberPage, PAGE_SIZE, function (p) { s.memberPage = p; initOrgPage(); });
          var si = document.getElementById('org-member-search');
          if (si) { si.value = s.memberKeyword; si.focus(); si.oninput = handleMemberSearch; }
          bindMemberActions();
        }
      }
      searchInput.oninput = handleMemberSearch;
    }
    bindMemberActions();
  }
}

// 未分配成员列表渲染
function renderUnassignedMembers(keyword, page) {
  var filtered = MockData.members.filter(function (m) {
    if (m.orgId !== 'unassigned') return false;
    if (keyword) {
      var kw = keyword.toLowerCase();
      return m.name.toLowerCase().indexOf(kw) !== -1 || m.username.toLowerCase().indexOf(kw) !== -1;
    }
    return true;
  });
  var total = filtered.length;
  var start = (page - 1) * PAGE_SIZE;
  var pageData = filtered.slice(start, start + PAGE_SIZE);
  var html = '<div class="ant-card"><div class="ant-card-head"><span>成员列表</span>';
  html += '<div class="btn-group"><div class="ant-input-search"><input id="org-member-search" placeholder="搜索成员..." value="' + esc(keyword) + '" />';
  html += '<button class="ant-input-search-button">&#128269;</button></div></div></div>';
  html += '<table class="ant-table"><thead><tr><th>姓名</th><th>邮箱</th><th>注册时间</th><th>操作</th></tr></thead><tbody>';
  if (pageData.length === 0) {
    html += '<tr><td colspan="4" style="text-align:center;color:var(--text-secondary);padding:32px;">暂无数据</td></tr>';
  }
  pageData.forEach(function (m) {
    html += '<tr><td>' + esc(m.name) + '</td><td>' + esc(email(m.username)) + '</td>';
    html += '<td>' + esc(m.joinDate) + '</td>';
    html += '<td><a class="ant-btn-link assign-to-dept-btn" data-username="' + esc(m.username) + '" data-member-name="' + esc(m.name) + '">分配到部门</a></td></tr>';
  });
  html += '</tbody></table><div id="org-members-pagination"></div></div>';
  return { html: html, total: total };
}

function bindUnassignedActions() {
  // 搜索绑定
  var si = document.getElementById('org-member-search');
  if (si) {
    function handleUnassignedSearch() {
      var currentInput = document.getElementById('org-member-search');
      if (!currentInput) return;
      state.org.memberKeyword = currentInput.value;
      state.org.memberPage = 1;
      var mc = document.getElementById('org-members-container');
      if (mc) {
        var r = renderUnassignedMembers(state.org.memberKeyword, state.org.memberPage);
        mc.innerHTML = r.html;
        var pe = document.getElementById('org-members-pagination');
        if (pe) renderPagination(pe, r.total, state.org.memberPage, PAGE_SIZE, function (p) { state.org.memberPage = p; initOrgPage(); });
        var newSi = document.getElementById('org-member-search');
        if (newSi) { newSi.value = state.org.memberKeyword; newSi.focus(); newSi.oninput = handleUnassignedSearch; }
        bindUnassignedActions();
      }
    }
    si.oninput = handleUnassignedSearch;
  }
  // 分配到部门
  document.querySelectorAll('.assign-to-dept-btn').forEach(function (btn) {
    btn.onclick = function () {
      var username = btn.getAttribute('data-username');
      var memberName = btn.getAttribute('data-member-name') || username;
      window._assignDeptUsername = username;
      loadAndShowModal('org/assign-dept', function () {
        var nameEl = document.getElementById('assign-dept-member-name');
        if (nameEl) nameEl.textContent = memberName;
        var sel = document.getElementById('assign-dept-select');
        if (sel) {
          var depts = MockData.getAllDepts();
          sel.innerHTML = '<option value="">请选择部门...</option>';
          depts.forEach(function (d) { sel.innerHTML += '<option value="' + esc(d) + '">' + esc(d) + '</option>'; });
        }
      });
    };
  });
}

// 成员操作按钮统一绑定（归组、调组、移出、添加成员）
function bindMemberActions() {
  var selectedOrgId = state.org.selectedOrgId;

  // 归组
  document.querySelectorAll('.assign-to-group-btn').forEach(function (btn) {
    btn.onclick = function () {
      var username = btn.getAttribute('data-username');
      var memberName = btn.getAttribute('data-member-name') || username;
      var member = null;
      for (var i = 0; i < MockData.members.length; i++) {
        if (MockData.members[i].username === username) { member = MockData.members[i]; break; }
      }
      if (!member) return;
      var deptOrg = MockData.findOrg(member.orgId);
      if (!deptOrg || !deptOrg.children || !deptOrg.children.length) { showMessage('该部门下暂无组可分配', 'warning'); return; }
      window._assignGroupUsername = username;
      window._assignGroupDeptOrg = deptOrg;
      loadAndShowModal('org/assign-group', function () {
        var msgEl = document.getElementById('assign-group-msg');
        if (msgEl) msgEl.innerHTML = '将成员【<strong>' + esc(memberName) + '</strong>】归入以下组：';
        var sel = document.getElementById('assign-group-select');
        if (sel) {
          sel.innerHTML = '<option value="">请选择目标组...</option>';
          // 从当前部门下的一级组、二级组中选择，二级组选项展示为：一级组-二级组
          function collectGroups(nodes, parentName) {
            for (var i = 0; i < nodes.length; i++) {
              var label = parentName ? parentName + '-' + nodes[i].name : nodes[i].name;
              sel.innerHTML += '<option value="' + esc(nodes[i].id) + '">' + esc(label) + '</option>';
              if (nodes[i].children) collectGroups(nodes[i].children, parentName ? parentName + '-' + nodes[i].name : nodes[i].name);
            }
          }
          collectGroups(deptOrg.children, '');
        }
      });
    };
  });

  // 调组
  document.querySelectorAll('.transfer-group-btn').forEach(function (btn) {
    btn.onclick = function () {
      var username = btn.getAttribute('data-username');
      var memberName = btn.getAttribute('data-member-name') || username;
      var member = null;
      for (var i = 0; i < MockData.members.length; i++) {
        if (MockData.members[i].username === username) { member = MockData.members[i]; break; }
      }
      if (!member) return;
      // 获取成员当前所在组名称
      var currentGroupName = MockData.getOrgPath(member.orgId, '');
      // 找到成员所在部门
      var deptOrg = null;
      function findParentDept(nodes) {
        for (var i = 0; i < nodes.length; i++) {
          if (nodes[i].type === 'dept') {
            var ids = MockData.getOrgAndChildIds(nodes[i].id);
            if (ids.indexOf(member.orgId) !== -1) { deptOrg = nodes[i]; return; }
          }
        }
      }
      findParentDept(MockData.orgs);
      if (!deptOrg || !deptOrg.children || !deptOrg.children.length) { showMessage('该部门下暂无其他组', 'warning'); return; }
      window._transferGroupUsername = username;
      window._transferGroupDeptOrg = deptOrg;
      loadAndShowModal('org/transfer-group', function () {
        var msgEl = document.getElementById('transfer-group-msg');
        if (msgEl) msgEl.innerHTML = '将成员【<strong>' + esc(memberName) + '</strong>】从【<strong>' + esc(currentGroupName) + '</strong>】调入以下组：';
        var sel = document.getElementById('transfer-group-select');
        if (sel) {
          sel.innerHTML = '<option value="">请选择目标组...</option>';
          // 列出同部门下所有组（含子组），排除当前所在组
          // 二级组选项展示为：一级组-二级组
          function collectGroups(nodes, parentName) {
            for (var i = 0; i < nodes.length; i++) {
              var label = parentName ? parentName + '-' + nodes[i].name : nodes[i].name;
              if (nodes[i].id !== member.orgId) {
                sel.innerHTML += '<option value="' + esc(nodes[i].id) + '">' + esc(label) + '</option>';
              }
              if (nodes[i].children) collectGroups(nodes[i].children, parentName ? parentName + '-' + nodes[i].name : nodes[i].name);
            }
          }
          collectGroups(deptOrg.children, '');
        }
      });
    };
  });

  // 移出
  document.querySelectorAll('.remove-member-btn').forEach(function (btn) {
    btn.onclick = function () {
      var username = btn.getAttribute('data-username');
      var memberName = btn.getAttribute('data-member-name') || username;
      var orgType = btn.getAttribute('data-org-type');
      window._removeMemberUsername = username;
      window._removeMemberOrgType = orgType;
      loadAndShowModal('org/remove-member', function () {
        var msgEl = document.getElementById('remove-member-msg');
        var extraEl = document.getElementById('remove-member-extra');
        if (orgType === 'dept') {
          if (msgEl) msgEl.textContent = '确定将成员【' + memberName + '】移出当前部门吗？';
          if (extraEl) extraEl.textContent = '移出后该成员将变为未分配状态。';
        } else {
          if (msgEl) msgEl.textContent = '确定将成员【' + memberName + '】移出当前组吗？';
          if (extraEl) extraEl.textContent = '移出后该成员将回到部门直属。';
        }
      });
    };
  });

  // 添加成员
  var addBtn = document.getElementById('btn-add-member');
  if (addBtn) {
    addBtn.onclick = function () {
      var orgId = addBtn.getAttribute('data-org-id');
      var org = MockData.findOrg(orgId);
      if (!org) return;
      var isDept = org.type === 'dept';
      window._addMemberOrgId = orgId;
      window._addMemberIsDept = isDept;
      loadAndShowModal('org/add-member', function () {
        var tipEl = document.getElementById('add-member-tip');
        var sel = document.getElementById('add-member-select');
        var searchInput = document.getElementById('add-member-search');

        function renderMemberList(keyword) {
          if (!sel) return;
          var html = '<option value="">请选择成员...</option>';
          if (isDept) {
            // 为部门添加成员: 平台非分配成员
            MockData.members.forEach(function (m) {
              if (m.orgId === 'unassigned') {
                if (keyword) {
                  var kw = keyword.toLowerCase();
                  if (m.name.toLowerCase().indexOf(kw) === -1 && m.username.toLowerCase().indexOf(kw) === -1) {
                    return;
                  }
                }
                html += '<option value="' + esc(m.username) + '">' + esc(m.name) + ' (' + esc(email(m.username)) + ')</option>';
              }
            });
          } else {
            // 为组添加成员: 当前部门内未分组用户
            var parentDeptId = null;
            for (var i = 0; i < MockData.orgs.length; i++) {
              var ids = MockData.getOrgAndChildIds(MockData.orgs[i].id);
              if (ids.indexOf(orgId) !== -1) { parentDeptId = MockData.orgs[i].id; break; }
            }
            MockData.members.forEach(function (m) {
              if (m.orgId === parentDeptId && m.role !== '部门负责人') {
                if (keyword) {
                  var kw = keyword.toLowerCase();
                  if (m.name.toLowerCase().indexOf(kw) === -1 && m.username.toLowerCase().indexOf(kw) === -1) {
                    return;
                  }
                }
                html += '<option value="' + esc(m.username) + '">' + esc(m.name) + ' (' + esc(email(m.username)) + ')</option>';
              }
            });
          }
          sel.innerHTML = html;
        }

        if (isDept) {
          if (tipEl) tipEl.innerHTML = '&#9432; 仅展示平台非分配成员，选择用户后添加至当前部门。同一用户只能属于一个部门。';
        } else {
          if (tipEl) tipEl.innerHTML = '&#9432; 仅展示当前部门内未分组用户列表，选择用户后添加至当前组。同一用户只能属于一个组。';
        }

        renderMemberList('');

        if (searchInput) {
          searchInput.value = '';
          searchInput.oninput = function () {
            renderMemberList(searchInput.value.trim());
          };
        }
      });
    };
  }
}

// 编辑 + 删除按钮绑定
function bindEditOrgBtn() {
  var btn = document.getElementById('btn-edit-org');
  if (btn) {
    btn.onclick = function () {
      var orgId = btn.getAttribute('data-org-id');
      var org = MockData.findOrg(orgId);
      if (!org) return;
      window._editingOrgId = orgId;
      loadAndShowModal('org/edit-org', function () {
        initEditOrgModal(org);
      });
    };
  }
  var delBtn = document.getElementById('btn-delete-org');
  if (delBtn) {
    delBtn.onclick = function () {
      var orgId = delBtn.getAttribute('data-org-id');
      var org = MockData.findOrg(orgId);
      if (!org) return;
      window._deleteOrgId = orgId;
      var label = org.type === 'dept' ? '部门' : '组';
      var memberCount = MockData.countMembers(orgId);
      var childCount = org.children ? org.children.length : 0;
      loadAndShowModal('org/confirm-delete', function () {
        var msgEl = document.getElementById('confirm-delete-msg');
        var extraEl = document.getElementById('confirm-delete-extra');
        if (msgEl) msgEl.textContent = '确定要删除' + label + '「' + org.name + '」吗？';
        if (extraEl) {
          var extraText = '该' + label + '下有 ' + memberCount + ' 名成员，删除后成员将上浮至父级';
          if (childCount > 0) {
            extraText += '，下级组也会同步删除';
          }
          extraText += '。若' + label + '下有资源，则资源转为"未归组资源"由部门负责人统一处理。';
          extraEl.textContent = extraText;
        }
      });
    };
  }
}

function initEditOrgModal(org) {
  var isDept = org.type === 'dept';
  // 标题
  var title = document.getElementById('edit-org-title');
  if (title) {
    title.textContent = isDept ? '编辑部门' : '编辑组';
    title.title = isDept ? '仅超级管理员可编辑部门' : '';
  }
  // 名称
  var nameLabel = document.getElementById('edit-org-name-label');
  if (nameLabel) nameLabel.textContent = isDept ? '部门名称' : '组名称';
  var nameInput = document.getElementById('edit-org-name');
  if (nameInput) nameInput.value = org.name;
  // 负责人/组长
  var leaderLabel = document.getElementById('edit-org-leader-label');
  if (leaderLabel) leaderLabel.textContent = isDept ? '部门负责人' : '组长';
  var leaderReq = document.getElementById('edit-org-leader-required');
  if (leaderReq) leaderReq.innerHTML = isDept ? '<span class="required">*</span>' : '';
  var leaderExtra = document.getElementById('edit-org-leader-extra');
  if (leaderExtra) leaderExtra.textContent = isDept ? '' : '可选，留空表示暂不指定';
  // 构建负责人下拉选项
  var leaderSelect = document.getElementById('edit-org-leader');
  if (leaderSelect) {
    var options = isDept ? '' : '<option value="">（暂不指定）</option>';
    MockData.members.forEach(function (m) {
      var selected = (m.username === org.leader.username) ? ' selected' : '';
      options += '<option value="' + esc(m.username) + '"' + selected + '>' + esc(m.name) + ' (' + esc(email(m.username)) + ')</option>';
    });
    leaderSelect.innerHTML = options;
  }
  // 所属（组才显示）
  var parentItem = document.getElementById('edit-org-parent-item');
  var parentInput = document.getElementById('edit-org-parent');
  if (parentItem) {
    if (isDept) {
      parentItem.style.display = 'none';
    } else {
      parentItem.style.display = '';
      if (parentInput) parentInput.value = MockData.getParentDept(org.id) || '';
    }
  }
  // 匹配规则（部门和组都显示，但说明文字不同）
  var matchRuleItem = document.getElementById('edit-org-matchrule-item');
  var matchRuleInput = document.getElementById('edit-org-matchrule');
  var matchRuleExtra = document.getElementById('edit-org-matchrule-extra');
  if (matchRuleItem) {
    matchRuleItem.style.display = '';
    if (matchRuleInput) matchRuleInput.value = org.matchRule || '';
    if (matchRuleInput) {
      matchRuleInput.placeholder = '请输入成员匹配规则';
    }
  }
}

function bindTreeEvents() {
  var container = document.getElementById('page-container');
  // Tree toggle
  container.querySelectorAll('.ant-tree-switcher').forEach(function (sw) {
    if (sw.style.visibility !== 'hidden') {
      sw.onclick = function (e) {
        e.stopPropagation();
        var node = e.target.closest('.ant-tree-node');
        var children = node.querySelector('.ant-tree-children');
        if (!children) return;
        if (children.style.display === 'none') {
          children.style.display = '';
          sw.innerHTML = '&#9660;';
        } else {
          children.style.display = 'none';
          sw.innerHTML = '&#9654;';
        }
      };
    }
  });
  // Tree node selection
  container.querySelectorAll('.ant-tree-node-content[data-org-id]').forEach(function (nc) {
    nc.onclick = function (e) {
      if (e.target.closest('.ant-tree-switcher')) return;
      var orgId = nc.getAttribute('data-org-id');
      state.org.selectedOrgId = orgId;
      state.org.memberKeyword = '';
      state.org.memberPage = 1;
      // Update selection visually
      container.querySelectorAll('.ant-tree-node-content').forEach(function (n) { n.classList.remove('selected'); });
      nc.classList.add('selected');
      // Re-render detail + members via initOrgPage (handles unassigned too)
      var detailContainer = document.getElementById('org-detail-container');
      var membersContainer = document.getElementById('org-members-container');
      if (orgId === 'unassigned') {
        if (detailContainer) {
          detailContainer.innerHTML = '<div class="ant-card"><div class="ant-card-head"><span>未分配成员</span></div>' +
            '<div class="ant-card-body"><div class="ant-alert ant-alert-info" style="background:#e6f7ff;border:1px solid #91d5ff;border-radius:4px;padding:8px 12px;color:#1890ff;font-size:13px;">&#9432; 以下成员尚未归属任何部门，需要由超级管理员手动分配到对应部门。</div></div></div>';
        }
        if (membersContainer) {
          var result = renderUnassignedMembers('', 1);
          membersContainer.innerHTML = result.html;
          var pagEl = document.getElementById('org-members-pagination');
          if (pagEl) renderPagination(pagEl, result.total, 1, PAGE_SIZE, function (p) { state.org.memberPage = p; initOrgPage(); });
          bindUnassignedActions();
        }
      } else {
        var org = MockData.findOrg(orgId);
        if (detailContainer && org) { detailContainer.innerHTML = renderOrgDetail(org); bindEditOrgBtn(); }
        if (membersContainer) {
          var result = renderOrgMembers(orgId, '', 1);
          membersContainer.innerHTML = result.html;
          var pagEl = document.getElementById('org-members-pagination');
          if (pagEl) renderPagination(pagEl, result.total, 1, PAGE_SIZE, function (p) { state.org.memberPage = p; initOrgPage(); });
          var si = document.getElementById('org-member-search');
          if (si) si.oninput = function () { state.org.memberKeyword = si.value; state.org.memberPage = 1; initOrgPage(); };
          bindMemberActions();
        }
      }
    };
  });
}
