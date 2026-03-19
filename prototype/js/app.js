// CMP 原型 - 数据驱动交互逻辑
// 启动本地服务器: npx serve . 或 python -m http.server 8080

(function () {
  'use strict';

  var pageCache = {};
  var modalCache = {};
  var currentPage = 'org';

  // 页面状态
  var state = {
    org: { selectedOrgId: 'dept-infra', memberKeyword: '', memberPage: 1 },
    cloud: { subStatusFilter: '', deptFilter: '', activeTab: 'main' },
    project: { keyword: '', deptFilter: '' },
    resource: { keyword: '', typeFilter: '', groupFilter: '', projectFilter: '', page: 1 },
    orphan: { keyword: '', typeFilter: '' },
    audit: { keyword: '', typeFilter: '', deptFilter: '', dateFrom: '2026-03-01', dateTo: '2026-03-16', page: 1 },
    user: { keyword: '', statusFilter: '', deptFilter: '', page: 1 },
    ticket: { keyword: '', typeFilter: '', statusFilter: '', deptFilter: '', activeTab: 'all', page: 1 },
    deptConfig: { selectedDept: 'dept-infra', activeTab: 'account', tplCollapsed: {}, approvalCollapsed: {} },
    resConfig: { activeTab: 'template', editingTemplate: null, tplCollapsed: {}, flowCollapsed: {} },
    catalogCollapsed: {},
    applyRecords: { keyword: '', statusFilter: '', typeFilter: '', page: 1 },
    reviewRecords: { keyword: '', statusFilter: '', page: 1 }
  };

  var PAGE_SIZE = 10;

  // ===== 消息提示 =====
  function showMessage(text, type) {
    type = type || 'success';
    var colors = { success: '#52c41a', error: '#ff4d4f', warning: '#faad14', info: '#1890ff' };
    var bgColors = { success: '#f6ffed', error: '#fff2f0', warning: '#fffbe6', info: '#e6f7ff' };
    var msg = document.createElement('div');
    msg.style.cssText = 'position:fixed;top:60px;left:50%;transform:translateX(-50%);z-index:9999;padding:8px 16px;border-radius:4px;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,0.15);transition:opacity 0.3s;border:1px solid ' + colors[type] + ';background:' + bgColors[type] + ';color:' + colors[type];
    msg.textContent = text;
    document.body.appendChild(msg);
    setTimeout(function () { msg.style.opacity = '0'; setTimeout(function () { msg.remove(); }, 300); }, 3000);
  }

  // ===== 通用分页渲染 =====
  function renderPagination(container, total, currentPage, pageSize, onChange) {
    var totalPages = Math.ceil(total / pageSize) || 1;
    var html = '<div class="ant-pagination"><span class="ant-pagination-info">共 ' + total + ' 条</span>';
    html += '<div class="ant-pagination-item" data-page="prev">&lt;</div>';
    var startPage = Math.max(1, currentPage - 2);
    var endPage = Math.min(totalPages, startPage + 4);
    if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);
    for (var i = startPage; i <= endPage; i++) {
      html += '<div class="ant-pagination-item' + (i === currentPage ? ' active' : '') + '" data-page="' + i + '">' + i + '</div>';
    }
    if (endPage < totalPages) {
      html += '<div class="ant-pagination-item">...</div>';
      html += '<div class="ant-pagination-item" data-page="' + totalPages + '">' + totalPages + '</div>';
    }
    html += '<div class="ant-pagination-item" data-page="next">&gt;</div></div>';
    container.innerHTML = html;
    container.querySelectorAll('.ant-pagination-item[data-page]').forEach(function (el) {
      el.onclick = function () {
        var p = el.getAttribute('data-page');
        var newPage = currentPage;
        if (p === 'prev') newPage = Math.max(1, currentPage - 1);
        else if (p === 'next') newPage = Math.min(totalPages, currentPage + 1);
        else newPage = parseInt(p);
        if (newPage !== currentPage) onChange(newPage);
      };
    });
  }

  // ===== HTML 转义 =====
  function esc(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function email(username) {
    return username ? username + '@sohu-inc.com' : '';
  }

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
    // 未分配成员节点
    if (unassignedCount > 0) {
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
    var html = '<div class="ant-card"><div class="ant-card-head"><span id="org-detail-title">' + esc(org.name) + '</span>';
    var deleteTitle = org.type === 'dept' ? '仅超级管理员可删除部门' : '删除该组';
    html += '<div class="btn-group"><button class="ant-btn-link" id="btn-edit-org" data-org-id="' + org.id + '"' + (org.type === 'dept' ? ' title="仅超级管理员可编辑部门"' : '') + '>编辑</button>';
    html += '<button class="ant-btn-link" id="btn-delete-org" data-org-id="' + org.id + '" style="color:#ff4d4f;" title="' + deleteTitle + '">删除</button></div></div>';
    html += '<div class="ant-card-body" style="padding:0;"><div class="ant-descriptions">';
    html += '<div class="ant-descriptions-row"><div class="ant-descriptions-label">类型</div><div class="ant-descriptions-content"><span class="ant-tag ant-tag-blue">' + (typeLabel[org.type] || org.type) + '</span></div></div>';
    html += '<div class="ant-descriptions-row"><div class="ant-descriptions-label">负责人</div><div class="ant-descriptions-content">' + esc(org.leader.name) + ' (' + esc(email(org.leader.username)) + ')</div></div>';
    html += '<div class="ant-descriptions-row"><div class="ant-descriptions-label">成员数</div><div class="ant-descriptions-content">' + MockData.countMembers(org.id) + ' 人</div></div>';
    html += '<div class="ant-descriptions-row"><div class="ant-descriptions-label">下级组</div><div class="ant-descriptions-content">' + childLabel + '</div></div>';
    if (org.type !== 'dept') {
      html += '<div class="ant-descriptions-row"><div class="ant-descriptions-label">ERP匹配规则</div><div class="ant-descriptions-content">' + (org.matchRule ? '<code style="background:#f5f5f5;padding:2px 8px;border:1px solid #d9d9d9;border-radius:2px;font-size:13px;">' + esc(org.matchRule) + '</code>' : '<span style="color:var(--text-secondary);">未配置</span>') + '</div></div>';
    } else {
      html += '<div class="ant-descriptions-row"><div class="ant-descriptions-label">ERP匹配规则</div><div class="ant-descriptions-content">' + (org.matchRule ? '<code style="background:#f5f5f5;padding:2px 8px;border:1px solid #d9d9d9;border-radius:2px;font-size:13px;">' + esc(org.matchRule) + '</code>' : '<span style="color:var(--text-secondary);">未配置</span>') + '<div style="font-size:11px;color:#999;margin-top:2px;">格式：A-B-C，支持通配符 *，多条规则用逗号分隔</div></div></div>';
    }
    if (org.type === 'dept') {
      html += '<div class="ant-descriptions-row"><div class="ant-descriptions-label">关联云账号</div><div class="ant-descriptions-content">' + (org.cloudAccount ? '<span class="ant-tag ant-tag-blue">' + esc(org.cloudAccount) + '</span>' : '--') + '</div></div>';

      var projs = org.projects || [];
      var projsHtml = '';
      if (projs.length === 0) {
        projsHtml = '--';
      } else if (projs.length <= 2) {
        projsHtml = projs.map(function (p) { return '<span class="ant-tag ant-tag-cyan">' + esc(p) + '</span>'; }).join(' ');
      } else {
        projsHtml = projs.slice(0, 2).map(function (p) { return '<span class="ant-tag ant-tag-cyan">' + esc(p) + '</span>'; }).join(' ');
        projsHtml += ' <span class="org-overflow-trigger" data-overflow-type="projects" data-org-id="' + org.id + '">等 ' + projs.length + ' 个<span class="org-overflow-popover"><span class="org-overflow-popover-title">全部关联资源组（' + projs.length + '）</span>' + projs.map(function (p) { return '<span class="ant-tag ant-tag-cyan">' + esc(p) + '</span>'; }).join('') + '</span></span>';
      }
      html += '<div class="ant-descriptions-row"><div class="ant-descriptions-label">关联资源组</div><div class="ant-descriptions-content">' + projsHtml + '</div></div>';
    }
    html += '</div></div></div>';
    return html;
  }

  function renderOrgMembers(orgId, keyword, page) {
    var orgIds = MockData.getOrgAndChildIds(orgId);
    var isDeptSelected = orgId.indexOf('dept-') === 0;
    var filtered = MockData.members.filter(function (m) {
      if (m.orgId === 'unassigned') return false;
      if (orgIds.indexOf(m.orgId) === -1) return false;
      if (keyword) {
        var kw = keyword.toLowerCase();
        return m.name.toLowerCase().indexOf(kw) !== -1 || m.username.toLowerCase().indexOf(kw) !== -1;
      }
      return true;
    });
    var total = filtered.length;
    var start = (page - 1) * PAGE_SIZE;
    var pageData = filtered.slice(start, start + PAGE_SIZE);
    var roleColors = { '部门负责人': 'orange', '组长': 'cyan', '成员': 'default' };

    var html = '<div class="ant-card"><div class="ant-card-head"><span>成员列表</span>';
    html += '<div class="btn-group"><div class="ant-input-search"><input id="org-member-search" placeholder="搜索成员..." value="' + esc(keyword) + '" />';
    html += '<button class="ant-input-search-button">&#128269;</button></div>';
    html += '<button class="ant-btn ant-btn-primary ant-btn-sm" id="btn-add-member" data-org-id="' + esc(orgId) + '">+ 添加成员</button></div></div>';
    html += '<table class="ant-table"><thead><tr><th>姓名</th><th>邮箱</th><th>所属组</th><th>角色</th><th>加入时间</th><th>操作</th></tr></thead><tbody>';
    if (pageData.length === 0) {
      html += '<tr><td colspan="6" style="text-align:center;color:var(--text-secondary);padding:32px;">暂无数据</td></tr>';
    }
    for (var i = 0; i < pageData.length; i++) {
      var m = pageData[i];
      var roleColor = roleColors[m.role] || 'default';
      html += '<tr><td>' + esc(m.name) + '</td><td>' + esc(email(m.username)) + '</td>';
      html += '<td><span class="ant-tag ant-tag-blue">' + esc(MockData.getOrgPath(m.orgId, orgId)) + '</span></td>';
      html += '<td><span class="ant-tag ant-tag-' + roleColor + '">' + esc(m.role) + '</span></td>';
      html += '<td>' + esc(m.joinDate) + '</td>';
      var isDirectDeptMember = isDeptSelected && m.orgId === orgId && m.role !== '部门负责人';
      html += '<td>';
      if (m.role === '部门负责人') {
        html += '<span style="color:#999;">--</span>';
      } else if (isDirectDeptMember) {
        html += '<a class="ant-btn-link assign-to-group-btn" data-username="' + esc(m.username) + '" data-member-name="' + esc(m.name) + '" style="color:#faad14;">归组</a>';
        html += ' <a class="ant-btn-link remove-member-btn" data-username="' + esc(m.username) + '" data-member-name="' + esc(m.name) + '" data-org-type="dept" style="color:#ff4d4f;">移出部门</a>';
      } else {
        html += '<a class="ant-btn-link transfer-group-btn" data-username="' + esc(m.username) + '" data-member-name="' + esc(m.name) + '">调组</a>';
        html += ' <a class="ant-btn-link remove-member-btn" data-username="' + esc(m.username) + '" data-member-name="' + esc(m.name) + '" data-org-type="group" style="color:#ff4d4f;">移出组</a>';
      }
      html += '</td></tr>';
    }
    html += '</tbody></table><div id="org-members-pagination"></div></div>';
    return { html: html, total: total };
  }

  function initOrgPage() {
    var s = state.org;
    var container = document.getElementById('page-container');

    // Render tree
    var treeContainer = document.getElementById('org-tree-container');
    if (treeContainer) {
      treeContainer.innerHTML = renderOrgTree(MockData.orgs, s.selectedOrgId);
      // Update dept count
      var deptCount = container.querySelector('.org-dept-count');
      if (deptCount) deptCount.textContent = MockData.orgs.length + ' 个部门';
    }

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
          var nameEl = document.getElementById('assign-group-member-name');
          if (nameEl) nameEl.textContent = memberName;
          var sel = document.getElementById('assign-group-select');
          if (sel) {
            sel.innerHTML = '<option value="">请选择组...</option>';
            deptOrg.children.forEach(function (c) { sel.innerHTML += '<option value="' + esc(c.name) + '">' + esc(c.name) + '</option>'; });
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
          var nameEl = document.getElementById('transfer-group-member-name');
          if (nameEl) nameEl.textContent = memberName;
          var sel = document.getElementById('transfer-group-select');
          if (sel) {
            sel.innerHTML = '<option value="">请选择目标组...</option>';
            // 列出同部门下所有组（含子组），排除当前所在组
            function collectGroups(nodes, prefix) {
              for (var i = 0; i < nodes.length; i++) {
                var label = prefix ? prefix + ' - ' + nodes[i].name : nodes[i].name;
                if (nodes[i].id !== member.orgId) {
                  sel.innerHTML += '<option value="' + esc(nodes[i].id) + '">' + esc(label) + '</option>';
                }
                if (nodes[i].children) collectGroups(nodes[i].children, label);
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
            if (msgEl) msgEl.textContent = '确定将成员「' + memberName + '」移出当前部门吗？';
            if (extraEl) extraEl.textContent = '移出后该成员将变为未分配状态，需超级管理员重新分配。';
          } else {
            if (msgEl) msgEl.textContent = '确定将成员「' + memberName + '」移出当前组吗？';
            if (extraEl) extraEl.textContent = '移出后该成员将回到部门直属，可由部门负责人重新归组。';
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
        loadAndShowModal('org/add-member', function () {
          var tipEl = document.getElementById('add-member-tip');
          var sel = document.getElementById('add-member-select');
          if (isDept) {
            if (tipEl) tipEl.innerHTML = '&#9432; 仅展示未归属任何部门的成员，如需添加新用户请前往「用户管理」创建。';
            if (sel) {
              sel.innerHTML = '<option value="">请选择成员...</option>';
              MockData.members.forEach(function (m) {
                if (m.orgId === 'unassigned') {
                  sel.innerHTML += '<option value="' + esc(m.username) + '">' + esc(m.name) + ' (' + esc(email(m.username)) + ')</option>';
                }
              });
            }
          } else {
            // 组级：列出本部门内未归组的成员
            var parentDeptId = null;
            for (var i = 0; i < MockData.orgs.length; i++) {
              var ids = MockData.getOrgAndChildIds(MockData.orgs[i].id);
              if (ids.indexOf(orgId) !== -1) { parentDeptId = MockData.orgs[i].id; break; }
            }
            if (tipEl) tipEl.innerHTML = '&#9432; 仅展示本部门内未分配到任何组的成员。';
            if (sel) {
              sel.innerHTML = '<option value="">请选择成员...</option>';
              MockData.members.forEach(function (m) {
                if (m.orgId === parentDeptId && m.role !== '部门负责人') {
                  sel.innerHTML += '<option value="' + esc(m.username) + '">' + esc(m.name) + ' (' + esc(email(m.username)) + ')</option>';
                }
              });
            }
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
        var childCount = org.children ? org.children.length : 0;
        loadAndShowModal('org/confirm-delete', function () {
          var msgEl = document.getElementById('confirm-delete-msg');
          var extraEl = document.getElementById('confirm-delete-extra');
          if (msgEl) msgEl.textContent = '确定要删除' + label + '「' + org.name + '」吗？';
          if (extraEl) extraEl.textContent = childCount > 0 ? '该' + label + '下有 ' + childCount + ' 个子组，将一并删除。' : '此操作不可撤销。';
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
      if (isDept && matchRuleInput) {
        matchRuleInput.placeholder = '如：信息技术部-基础架构部-*,信息技术部-基础架构部-网络组';
      } else if (matchRuleInput) {
        matchRuleInput.placeholder = '如：*-容器平台组,*-docker组';
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

  // =============================================
  // 云账号页
  // =============================================

  // 渲染权限包选择（申请子账号弹窗）
  function renderPermPkgList() {
    var selectEl = document.getElementById('perm-pkg-select');
    var detailEl = document.getElementById('perm-pkg-detail');
    if (!selectEl || !detailEl) return;

    // 填充下拉选项
    selectEl.innerHTML = '<option value="">请选择权限包</option>';
    window.PermPackages.forEach(function (pkg) {
      selectEl.innerHTML += '<option value="' + esc(pkg.id) + '">' + esc(pkg.name) + '</option>';
    });

    function showPkgDetail(pkgId) {
      if (!pkgId) { detailEl.innerHTML = ''; return; }
      var pkg = getPermPackage(pkgId);
      var html = '<div style="padding:10px 12px;border:1px solid var(--border-color);border-radius:4px;background:#fafafa;">';
      html += '<div style="margin-bottom:6px;"><span class="ant-tag ant-tag-' + pkg.color + '">' + esc(pkg.name) + '</span></div>';
      html += '<div style="color:var(--text-secondary);font-size:13px;margin-bottom:8px;">' + esc(pkg.description) + '</div>';
      html += '<div><a class="ant-btn-link perm-pkg-toggle" style="font-size:12px;cursor:pointer;">展开策略明细（' + pkg.policies.length + ' 条） &#9660;</a>';
      html += '<div class="perm-pkg-policies" style="display:none;margin-top:6px;">';
      pkg.policies.forEach(function (p) {
        html += '<code style="display:inline-block;margin:2px 4px 2px 0;padding:1px 6px;background:#fff;border:1px solid #d9d9d9;border-radius:2px;font-size:11px;color:var(--text-secondary);">' + esc(p) + '</code>';
      });
      html += '</div></div></div>';
      detailEl.innerHTML = html;
      // 绑定折叠
      var toggle = detailEl.querySelector('.perm-pkg-toggle');
      if (toggle) {
        toggle.onclick = function () {
          var policies = toggle.nextElementSibling;
          if (policies.style.display === 'none') {
            policies.style.display = 'block';
            toggle.innerHTML = '收起策略明细 &#9650;';
          } else {
            policies.style.display = 'none';
            toggle.innerHTML = '展开策略明细（' + pkg.policies.length + ' 条） &#9660;';
          }
        };
      }
    }

    selectEl.onchange = function () { showPkgDetail(selectEl.value); };

    // 有效期类型切换：长期持有时隐藏有效期限
    var durationLimitItem = document.getElementById('sub-duration-limit-item');
    document.querySelectorAll('input[name="sub-duration"]').forEach(function (radio) {
      radio.onchange = function () {
        if (durationLimitItem) {
          durationLimitItem.style.display = radio.value === 'temp' ? '' : 'none';
        }
      };
    });
  }

  function initCloudPage() {
    var container = document.getElementById('page-container');

    // 恢复上次的 Tab 状态
    if (state.cloud.activeTab === 'sub') {
      var mainTab = document.getElementById('cloud-tab-main');
      var subTab = document.getElementById('cloud-tab-sub');
      if (mainTab) mainTab.style.display = 'none';
      if (subTab) subTab.style.display = '';
      var tabs = container.querySelectorAll('.ant-tabs-tab');
      if (tabs.length >= 2) { tabs[0].classList.remove('active'); tabs[1].classList.add('active'); }
    }

    // 记录 Tab 切换
    container.querySelectorAll('.ant-tabs-tab').forEach(function (tab) {
      var origOnclick = tab.onclick;
      tab.addEventListener('click', function () {
        state.cloud.activeTab = tab.getAttribute('data-tab-show') === 'cloud-tab-sub' ? 'sub' : 'main';
      });
    });

    // Main accounts
    var mainContainer = document.getElementById('cloud-main-container');
    if (mainContainer) {
      var html = '<table class="ant-table"><thead><tr><th>部门</th><th>云厂商</th><th>主账号 / AK别名</th><th>绑定人</th><th>绑定时间</th><th>状态</th><th>操作</th></tr></thead><tbody>';
      MockData.cloudAccounts.main.forEach(function (a) {
        html += '<tr><td>' + esc(a.dept) + '</td>';
        if (a.status === '未关联') {
          html += '<td colspan="4" style="color:var(--text-secondary);">--</td>';
          html += '<td><button class="ant-btn ant-btn-primary ant-btn-sm cloud-bind-main-btn" data-dept="' + esc(a.dept) + '">关联主账号</button></td></tr>';
        } else {
          html += '<td><span class="ant-tag ant-tag-blue">' + esc(a.vendor) + '</span></td>';
          html += '<td>' + esc(a.account) + '</td><td>' + esc(a.bindUser) + '</td><td>' + esc(a.bindTime) + '</td>';
          html += '<td><span class="ant-badge-status-dot ant-badge-status-success"></span>正常</td>';
          html += '<td><a class="ant-btn-link cloud-main-detail-btn" data-dept="' + esc(a.dept) + '">详情</a> <a class="ant-btn-link cloud-unbind-btn" data-dept="' + esc(a.dept) + '" style="color:#ff4d4f;">解绑</a></td></tr>';
        }
      });
      html += '</tbody></table>';
      mainContainer.innerHTML = html;

      // 绑定关联主账号按钮
      mainContainer.querySelectorAll('.cloud-bind-main-btn').forEach(function (btn) {
        btn.onclick = function () {
          var dept = btn.getAttribute('data-dept');
          window._bindCloudDept = dept;
          loadAndShowModal('cloud/bind-main');
        };
      });

      // 绑定解绑按钮
      mainContainer.querySelectorAll('.cloud-unbind-btn').forEach(function (btn) {
        btn.onclick = function () {
          var dept = btn.getAttribute('data-dept');
          window._cloudConfirmAction = 'unbind';
          window._cloudConfirmDept = dept;
          loadAndShowModal('cloud/confirm-action', function () {
            var titleEl = document.getElementById('cloud-confirm-title');
            var msgEl = document.getElementById('cloud-confirm-msg');
            var extraEl = document.getElementById('cloud-confirm-extra');
            if (titleEl) titleEl.textContent = '确认解绑';
            if (msgEl) msgEl.textContent = '确定要解绑「' + dept + '」的主账号吗？';
            if (extraEl) extraEl.textContent = '解绑后该部门将无法通过平台管理云上资源，已有资源不受影响。';
          });
        };
      });

      // 绑定主账号详情按钮
      mainContainer.querySelectorAll('.cloud-main-detail-btn').forEach(function (btn) {
        btn.onclick = function () {
          var dept = btn.getAttribute('data-dept');
          var account = null;
          for (var i = 0; i < MockData.cloudAccounts.main.length; i++) {
            if (MockData.cloudAccounts.main[i].dept === dept) { account = MockData.cloudAccounts.main[i]; break; }
          }
          if (!account) return;
          loadAndShowModal('cloud/view-detail', function () {
            var titleEl = document.getElementById('cloud-detail-title');
            if (titleEl) titleEl.textContent = '主账号详情 - ' + dept;
            var bodyEl = document.getElementById('cloud-detail-body');
            if (bodyEl) bodyEl.innerHTML =
              '<div class="ant-descriptions-row"><div class="ant-descriptions-label">所属部门</div><div class="ant-descriptions-content">' + esc(account.dept) + '</div></div>' +
              '<div class="ant-descriptions-row"><div class="ant-descriptions-label">云厂商</div><div class="ant-descriptions-content"><span class="ant-tag ant-tag-blue">' + esc(account.vendor) + '</span></div></div>' +
              '<div class="ant-descriptions-row"><div class="ant-descriptions-label">主账号 / AK</div><div class="ant-descriptions-content">' + esc(account.account) + '</div></div>' +
              '<div class="ant-descriptions-row"><div class="ant-descriptions-label">绑定人</div><div class="ant-descriptions-content">' + esc(account.bindUser) + '</div></div>' +
              '<div class="ant-descriptions-row"><div class="ant-descriptions-label">绑定时间</div><div class="ant-descriptions-content">' + esc(account.bindTime) + '</div></div>' +
              '<div class="ant-descriptions-row"><div class="ant-descriptions-label">状态</div><div class="ant-descriptions-content"><span class="ant-badge-status-dot ant-badge-status-success"></span>正常</div></div>';
          });
        };
      });
    }

    // Sub accounts
    renderCloudSub();

    // Bind filter
    var statusFilter = document.getElementById('cloud-sub-status');
    if (statusFilter) {
      statusFilter.onchange = function () {
        state.cloud.subStatusFilter = statusFilter.value;
        renderCloudSub();
      };
    }
    var deptFilterEl = document.getElementById('cloud-sub-dept');
    if (deptFilterEl) {
      deptFilterEl.onchange = function () {
        state.cloud.deptFilter = deptFilterEl.value;
        renderCloudSub();
      };
    }
  }

  function renderCloudSub() {
    var subContainer = document.getElementById('cloud-sub-container');
    if (!subContainer) return;
    var filter = state.cloud.subStatusFilter;
    var deptF = state.cloud.deptFilter;
    var data = MockData.cloudAccounts.sub;
    if (filter) {
      data = data.filter(function (s) { return s.status === filter; });
    }
    if (deptF) {
      data = data.filter(function (s) { return s.dept === deptF; });
    }
    var html = '<table class="ant-table"><thead><tr><th>子账号名称</th><th>归属人</th><th>所属部门</th><th>所属主账号</th><th>权限包</th><th>有效期类型</th><th>创建时间</th><th>状态</th><th>操作</th></tr></thead><tbody>';
    if (data.length === 0) {
      html += '<tr><td colspan="9" style="text-align:center;color:var(--text-secondary);padding:32px;">暂无数据</td></tr>';
    }
    data.forEach(function (s) {
      var pkg = getPermPackage(s.permPackageId);
      html += '<tr><td>' + esc(s.name) + '</td>';
      html += '<td>' + (s.owner ? esc(s.owner) : '<span style="color:var(--text-secondary);">--</span>') + '</td>';
      html += '<td>' + esc(s.dept || '--') + '</td>';
      html += '<td>' + esc(s.mainAccount || '--') + '</td>';
      html += '<td><span class="ant-tag ant-tag-' + pkg.color + '">' + esc(pkg.name) + '</span></td>';
      html += '<td>' + esc(s.durationType) + '</td>';
      html += '<td>' + esc(s.createTime) + '</td>';
      html += '<td><span class="ant-badge-status-dot ant-badge-status-' + s.statusClass + '"></span>' + esc(s.status) + '</td>';
      html += '<td><a class="ant-btn-link cloud-sub-detail-btn" data-name="' + esc(s.name) + '">详情</a>';
      if (s.status === '正常') html += ' <a class="ant-btn-link cloud-sub-reset-pwd-btn" data-name="' + esc(s.name) + '">重置密码</a>';
      if (s.status === '正常') html += ' <a class="ant-btn-link cloud-reclaim-btn" data-name="' + esc(s.name) + '">回收</a>';
      if (s.status === '已回收') html += ' <a class="ant-btn-link cloud-destroy-btn" data-name="' + esc(s.name) + '" style="color:#ff4d4f;">销毁</a>';
      html += '</td></tr>';
    });
    html += '</tbody></table>';
    subContainer.innerHTML = html;

    // 绑定回收按钮
    subContainer.querySelectorAll('.cloud-reclaim-btn').forEach(function (btn) {
      btn.onclick = function () {
        var name = btn.getAttribute('data-name');
        window._cloudConfirmAction = 'reclaim';
        window._cloudConfirmSubName = name;
        loadAndShowModal('cloud/confirm-action', function () {
          var titleEl = document.getElementById('cloud-confirm-title');
          var msgEl = document.getElementById('cloud-confirm-msg');
          var extraEl = document.getElementById('cloud-confirm-extra');
          if (titleEl) titleEl.textContent = '确认回收';
          if (msgEl) msgEl.textContent = '确定要回收子账号「' + name + '」吗？';
          if (extraEl) extraEl.textContent = '回收后该子账号将被禁用，相关权限立即失效。';
        });
      };
    });

    // 绑定销毁按钮
    subContainer.querySelectorAll('.cloud-destroy-btn').forEach(function (btn) {
      btn.onclick = function () {
        var name = btn.getAttribute('data-name');
        window._cloudConfirmAction = 'destroy';
        window._cloudConfirmSubName = name;
        loadAndShowModal('cloud/confirm-action', function () {
          var titleEl = document.getElementById('cloud-confirm-title');
          var msgEl = document.getElementById('cloud-confirm-msg');
          var extraEl = document.getElementById('cloud-confirm-extra');
          if (titleEl) titleEl.textContent = '确认销毁';
          if (msgEl) msgEl.textContent = '确定要销毁子账号「' + name + '」吗？';
          if (extraEl) extraEl.textContent = '销毁操作不可撤销，该子账号及相关权限将被永久删除。';
          var okBtn = document.getElementById('cloud-confirm-ok');
          if (okBtn) { okBtn.style.background = '#ff4d4f'; okBtn.style.borderColor = '#ff4d4f'; }
        });
      };
    });

    // 绑定子账号详情按钮
    subContainer.querySelectorAll('.cloud-sub-detail-btn').forEach(function (btn) {
      btn.onclick = function () {
        var name = btn.getAttribute('data-name');
        var sub = null;
        for (var i = 0; i < MockData.cloudAccounts.sub.length; i++) {
          if (MockData.cloudAccounts.sub[i].name === name) { sub = MockData.cloudAccounts.sub[i]; break; }
        }
        if (!sub) return;
        var subPkg = getPermPackage(sub.permPackageId);
        loadAndShowModal('cloud/view-detail', function () {
          var titleEl = document.getElementById('cloud-detail-title');
          if (titleEl) titleEl.textContent = '子账号详情 - ' + name;
          var bodyEl = document.getElementById('cloud-detail-body');
          if (!bodyEl) return;
          var html =
            '<div class="ant-descriptions-row"><div class="ant-descriptions-label">子账号名称</div><div class="ant-descriptions-content">' + esc(sub.name) + '</div></div>' +
            '<div class="ant-descriptions-row"><div class="ant-descriptions-label">归属人</div><div class="ant-descriptions-content">' + esc(sub.owner) + '</div></div>' +
            '<div class="ant-descriptions-row"><div class="ant-descriptions-label">所属部门</div><div class="ant-descriptions-content">' + esc(sub.dept || '--') + '</div></div>' +
            '<div class="ant-descriptions-row"><div class="ant-descriptions-label">所属主账号</div><div class="ant-descriptions-content">' + esc(sub.mainAccount || '--') + '</div></div>' +
            '<div class="ant-descriptions-row"><div class="ant-descriptions-label">云厂商</div><div class="ant-descriptions-content"><span class="ant-tag ant-tag-blue">' + esc(sub.vendor) + '</span></div></div>' +
            '<div class="ant-descriptions-row"><div class="ant-descriptions-label">RAM用户名</div><div class="ant-descriptions-content">' + esc(sub.ramUser) + '</div></div>' +
            '<div class="ant-descriptions-row"><div class="ant-descriptions-label">权限包</div><div class="ant-descriptions-content"><span class="ant-tag ant-tag-' + subPkg.color + '">' + esc(subPkg.name) + '</span><div style="color:var(--text-secondary);font-size:12px;margin-top:4px;">' + esc(subPkg.description) + '</div></div></div>' +
            '<div class="ant-descriptions-row"><div class="ant-descriptions-label">关联策略</div><div class="ant-descriptions-content">' + subPkg.policies.map(function (p) { return '<code style="display:inline-block;margin:0 4px 4px 0;padding:1px 6px;background:#f5f5f5;border:1px solid #d9d9d9;border-radius:2px;font-size:12px;">' + esc(p) + '</code>'; }).join('') + '</div></div>' +
            '<div class="ant-descriptions-row"><div class="ant-descriptions-label">有效期类型</div><div class="ant-descriptions-content">' + esc(sub.durationType) + '</div></div>' +
            '<div class="ant-descriptions-row"><div class="ant-descriptions-label">创建时间</div><div class="ant-descriptions-content">' + esc(sub.createTime) + '</div></div>' +
            '<div class="ant-descriptions-row"><div class="ant-descriptions-label">状态</div><div class="ant-descriptions-content"><span class="ant-badge-status-dot ant-badge-status-' + sub.statusClass + '"></span>' + esc(sub.status) + '</div></div>';
          if (sub.credential && sub.status === '正常') {
            html += '<div style="margin-top:16px;padding:12px;background:#f6ffed;border:1px solid #b7eb8f;border-radius:4px;">' +
              '<div style="font-weight:500;margin-bottom:8px;color:#52c41a;">登录凭证</div>' +
              '<div class="ant-descriptions-row"><div class="ant-descriptions-label">控制台登录地址</div><div class="ant-descriptions-content"><a href="javascript:void(0)" style="word-break:break-all;">' + esc(sub.credential.loginUrl) + '</a></div></div>' +
              '<div class="ant-descriptions-row"><div class="ant-descriptions-label">RAM用户名</div><div class="ant-descriptions-content"><code>' + esc(sub.credential.ramUser) + '</code></div></div>' +
              '<div class="ant-descriptions-row"><div class="ant-descriptions-label">登录密码</div><div class="ant-descriptions-content"><span style="color:var(--text-secondary);">初始密码仅创建时展示一次，可通过「重置密码」操作生成新密码</span></div></div>' +
              '<div class="ant-descriptions-row"><div class="ant-descriptions-label">AccessKey ID</div><div class="ant-descriptions-content"><code>' + esc(sub.credential.accessKeyId) + '</code></div></div>' +
              '<div class="ant-descriptions-row"><div class="ant-descriptions-label">AccessKey Secret</div><div class="ant-descriptions-content"><code>' + esc(sub.credential.accessKeySecret) + '</code></div></div>' +
              '</div>';
          }
          bodyEl.innerHTML = html;
        });
      };
    });

    // 绑定重置密码按钮
    subContainer.querySelectorAll('.cloud-sub-reset-pwd-btn').forEach(function (btn) {
      btn.onclick = function () {
        var name = btn.getAttribute('data-name');
        loadAndShowModal('cloud/confirm-action', function () {
          var titleEl = document.getElementById('cloud-confirm-title');
          var msgEl = document.getElementById('cloud-confirm-msg');
          var extraEl = document.getElementById('cloud-confirm-extra');
          if (titleEl) titleEl.textContent = '重置密码';
          if (msgEl) msgEl.textContent = '确定要重置子账号「' + name + '」的登录密码吗？';
          if (extraEl) extraEl.textContent = '重置后将生成新的随机密码，通过站内信发送给账号归属人。';
          window._cloudConfirmAction = 'reset-pwd';
          window._cloudConfirmSubName = name;
        });
      };
    });

  }

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
    var data = MockData.projects.filter(function (p) {
      if (s.keyword && p.name.toLowerCase().indexOf(s.keyword.toLowerCase()) === -1) return false;
      if (s.deptFilter && p.dept !== s.deptFilter) return false;
      return true;
    });

    // Stats
    var statsContainer = document.getElementById('project-stats');
    if (statsContainer) {
      var totalRes = 0; var depts = {};
      MockData.projects.forEach(function (p) { totalRes += p.resourceCount; depts[p.dept] = true; });
      statsContainer.innerHTML = '<div class="stat-card"><div class="stat-value">' + MockData.projects.length + '</div><div class="stat-label">资源组总数</div></div>' +
        '<div class="stat-card"><div class="stat-value">' + totalRes + '</div><div class="stat-label">关联资源总数</div></div>' +
        '<div class="stat-card"><div class="stat-value">' + Object.keys(depts).length + '</div><div class="stat-label">涉及部门数</div></div>';
    }

    // Table
    var tableContainer = document.getElementById('project-table-container');
    if (!tableContainer) return;
    var html = '<table class="ant-table"><thead><tr><th>资源组名称</th><th>描述</th><th>所属部门</th><th>创建人</th><th>可查看资源 / 总资源</th><th>创建时间</th><th>操作</th></tr></thead><tbody>';
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
      html += '<a class="ant-btn-link project-res-btn" data-project="' + esc(p.name) + '">查看资源</a> ';
      html += '<a class="ant-btn-link project-edit-btn" data-project="' + esc(p.name) + '">编辑</a> ';
      html += '<a class="ant-btn-link project-delete-btn" data-project="' + esc(p.name) + '" style="color:#ff4d4f;">删除</a>';
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
          if (titleEl) titleEl.textContent = '资源组详情 - ' + projName;
          var bodyEl = document.getElementById('project-detail-body');
          if (bodyEl) bodyEl.innerHTML =
            '<div class="ant-descriptions-row"><div class="ant-descriptions-label">资源组名称</div><div class="ant-descriptions-content">' + esc(proj.name) + '</div></div>' +
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
            resBodyEl.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-secondary);">您在该资源组下暂无可查看的资源</div>';
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
          if (msgEl) msgEl.textContent = '确定要删除资源组「' + projName + '」吗？';
          if (extraEl) extraEl.textContent = resCount > 0
            ? '该资源组下仍有 ' + resCount + ' 个可见资源，删除后这些资源将解除资源组绑定。此操作不可撤销。'
            : '此操作不可撤销。';
          if (okBtn) {
            okBtn.onclick = function () {
              MockData.projects = MockData.projects.filter(function (p) { return p.name !== projName; });
              MockData.auditLogs.unshift({ time: new Date().toLocaleString('zh-CN').replace(/\//g, '/'), operator: '张明远', dept: '基础架构部', opType: '资源组管理', opTypeColor: 'purple', target: projName, desc: '删除资源组', ip: '10.128.0.10' });
              hideModal();
              showMessage('资源组「' + projName + '」已删除', 'success');
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

  // =============================================
  // 资源目录页
  // =============================================
  function initResCatalogPage() {
    renderResCatalog();
    var addCatBtn = document.getElementById('catalog-add-category-btn');
    if (addCatBtn) {
      addCatBtn.onclick = function () {
        loadAndShowModal('res-catalog/add-category', function () {
          var nameInput = document.getElementById('catalog-category-name');
          if (nameInput) nameInput.value = '';
        });
      };
    }
  }

  function renderResCatalog() {
    var container = document.getElementById('catalog-container');
    if (!container) return;
    var catalog = MockData.resCatalog;
    var html = '';
    var allOps = ['申请', '变配', '扩容', '缩容', '重启', '销毁', '续费', '同步'];
    catalog.forEach(function (cat, catIdx) {
      var totalTypes = cat.types.length;
      var applyCount = cat.types.filter(function (t) { return t.allowApply; }).length;
      var isExpanded = !state.catalogCollapsed || !state.catalogCollapsed[catIdx];
      html += '<div class="catalog-category-section">';
      html += '<div class="catalog-category-header" data-cat-toggle="' + catIdx + '">';
      html += '<div class="catalog-category-left">';
      html += '<span class="catalog-category-arrow' + (isExpanded ? ' expanded' : '') + '">&#8250;</span>';
      html += '<span style="font-weight:500;font-size:14px;color:' + cat.color + ';">' + esc(cat.name) + '</span>';
      html += '<span style="font-weight:normal;font-size:12px;color:var(--text-secondary);margin-left:8px;">' + totalTypes + ' 种资源';
      if (applyCount < totalTypes) html += '，' + applyCount + ' 种可申请';
      html += '</span>';
      html += '</div>';
      html += '<div class="catalog-category-actions" onclick="event.stopPropagation();">';
      html += '<a class="ant-btn-link catalog-add-type-btn" data-cat="' + catIdx + '" style="margin-right:12px;">+ 新增资源类型</a>';
      html += '<a class="ant-btn-link catalog-del-cat-btn" data-cat="' + catIdx + '" style="color:#ff4d4f;">删除大类</a>';
      html += '</div></div>';
      html += '<div class="catalog-category-body' + (isExpanded ? '' : ' collapsed') + '" data-cat-body="' + catIdx + '">';
      html += '<table class="ant-table" style="table-layout:fixed;"><thead><tr><th style="width:18%;">资源类型</th><th style="width:8%;">云厂商</th><th style="width:16%;">云上查询接口</th><th style="width:22%;">需要审批的操作</th><th style="width:18%;">不需要审批的操作</th><th style="width:18%;">操作</th></tr></thead><tbody>';
      if (cat.types.length === 0) {
        html += '<tr><td colspan="6" style="text-align:center;color:var(--text-secondary);padding:20px;">该大类下暂无资源类型</td></tr>';
      }
      cat.types.forEach(function (t, typeIdx) {
        var aOps = t.approvalOps || [];
        var nOps = (t.operations || []).filter(function (op) { return aOps.indexOf(op) === -1; });
        // 父资源行
        html += '<tr>';
        html += '<td><strong>' + esc(t.name) + '</strong></td>';
        html += '<td><span class="ant-tag ant-tag-blue">' + esc(t.vendor) + '</span></td>';
        html += '<td><code style="font-size:12px;color:#1890ff;">' + esc(t.queryApi || '') + '</code></td>';
        html += '<td>' + (aOps.length ? aOps.map(function (op) { return '<span class="ant-tag ant-tag-orange">' + esc(op) + '</span>'; }).join(' ') : '<span style="color:var(--text-secondary);">无</span>') + '</td>';
        html += '<td>' + (nOps.length ? nOps.map(function (op) { return '<span class="ant-tag ant-tag-default">' + esc(op) + '</span>'; }).join(' ') : '<span style="color:var(--text-secondary);">无</span>') + '</td>';
        html += '<td><a class="ant-btn-link catalog-edit-type-btn" data-cat="' + catIdx + '" data-type="' + typeIdx + '">编辑</a> ';
        html += '<a class="ant-btn-link catalog-add-child-btn" data-cat="' + catIdx + '" data-type="' + typeIdx + '">添加子资源</a> ';
        html += '<a class="ant-btn-link catalog-del-type-btn" data-cat="' + catIdx + '" data-type="' + typeIdx + '" style="color:#ff4d4f;">删除</a></td>';
        html += '</tr>';
        // 子资源行
        var children = t.children || [];
        children.forEach(function (child, childIdx) {
          var connector = childIdx === children.length - 1 ? '└─' : '├─';
          var cAOps = child.approvalOps || [];
          var cNOps = (child.operations || []).filter(function (op) { return cAOps.indexOf(op) === -1; });
          html += '<tr class="catalog-child-row">';
          html += '<td style="padding-left:32px;color:var(--text-secondary);">' + connector + ' ' + esc(child.name) + '</td>';
          html += '<td></td>';
          html += '<td><code style="font-size:11px;color:#1890ff;">' + esc(child.queryApi || '') + '</code></td>';
          html += '<td>' + (cAOps.length ? cAOps.map(function (op) { return '<span class="ant-tag ant-tag-orange" style="font-size:11px;">' + esc(op) + '</span>'; }).join(' ') : '<span style="color:var(--text-secondary);">无</span>') + '</td>';
          html += '<td>' + (cNOps.length ? cNOps.map(function (op) { return '<span class="ant-tag ant-tag-default" style="font-size:11px;">' + esc(op) + '</span>'; }).join(' ') : '<span style="color:var(--text-secondary);">无</span>') + '</td>';
          html += '<td><a class="ant-btn-link catalog-edit-child-btn" data-cat="' + catIdx + '" data-type="' + typeIdx + '" data-child="' + childIdx + '">编辑</a> ';
          html += '<a class="ant-btn-link catalog-del-child-btn" data-cat="' + catIdx + '" data-type="' + typeIdx + '" data-child="' + childIdx + '" style="color:#ff4d4f;">删除</a></td>';
          html += '</tr>';
        });
      });
      html += '</tbody></table>';
      html += '</div></div>'; // close catalog-category-body and catalog-category-section
    });
    container.innerHTML = html;

    // 绑定大类折叠/展开
    container.querySelectorAll('.catalog-category-header').forEach(function (header) {
      header.onclick = function () {
        var catIdx = parseInt(header.getAttribute('data-cat-toggle'));
        if (!state.catalogCollapsed) state.catalogCollapsed = {};
        var body = container.querySelector('[data-cat-body="' + catIdx + '"]');
        var arrow = header.querySelector('.catalog-category-arrow');
        if (body.classList.contains('collapsed')) {
          body.classList.remove('collapsed');
          arrow.classList.add('expanded');
          state.catalogCollapsed[catIdx] = false;
        } else {
          body.classList.add('collapsed');
          arrow.classList.remove('expanded');
          state.catalogCollapsed[catIdx] = true;
        }
      };
    });

    // 绑定新增资源类型按钮
    container.querySelectorAll('.catalog-add-type-btn').forEach(function (btn) {
      btn.onclick = function () {
        var ci = parseInt(btn.getAttribute('data-cat'));
        var cat = MockData.resCatalog[ci];
        window._catalogEditMode = 'add';
        window._catalogEditCat = ci;
        window._catalogEditType = -1;
        loadAndShowModal('res-catalog/edit-type', function () {
          document.getElementById('catalog-type-title').textContent = '新增资源类型';
          document.getElementById('catalog-type-category').value = cat.name;
          document.getElementById('catalog-type-name').value = '';
          document.getElementById('catalog-type-vendor').value = '阿里云';
          document.getElementById('catalog-type-query-api').value = '';
          setCatalogOpsCheckboxes([]);
          refreshApprovalOpsFromSelected('catalog-type-approval-ops-group', 'catalog-type-ops-group', []);
          bindOpsToApprovalRefresh('catalog-type-ops-group', 'catalog-type-approval-ops-group');
        });
      };
    });

    // 绑定编辑按钮
    container.querySelectorAll('.catalog-edit-type-btn').forEach(function (btn) {
      btn.onclick = function () {
        var ci = parseInt(btn.getAttribute('data-cat'));
        var ti = parseInt(btn.getAttribute('data-type'));
        var cat = MockData.resCatalog[ci];
        var t = cat.types[ti];
        window._catalogEditMode = 'edit';
        window._catalogEditCat = ci;
        window._catalogEditType = ti;
        loadAndShowModal('res-catalog/edit-type', function () {
          document.getElementById('catalog-type-title').textContent = '编辑资源类型';
          document.getElementById('catalog-type-category').value = cat.name;
          document.getElementById('catalog-type-name').value = t.name;
          document.getElementById('catalog-type-vendor').value = t.vendor;
          document.getElementById('catalog-type-query-api').value = t.queryApi || '';
          setCatalogOpsCheckboxes(t.operations || []);
          refreshApprovalOpsFromSelected('catalog-type-approval-ops-group', 'catalog-type-ops-group', t.approvalOps || []);
          bindOpsToApprovalRefresh('catalog-type-ops-group', 'catalog-type-approval-ops-group');
        });
      };
    });

    // 绑定添加子资源按钮（表格行中的）
    container.querySelectorAll('.catalog-add-child-btn').forEach(function (btn) {
      btn.onclick = function () {
        var ci = parseInt(btn.getAttribute('data-cat'));
        var ti = parseInt(btn.getAttribute('data-type'));
        var t = MockData.resCatalog[ci].types[ti];
        window._catalogEditMode = 'add-child';
        window._catalogEditCat = ci;
        window._catalogEditType = ti;
        window._catalogEditChild = -1;
        loadAndShowModal('res-catalog/edit-child', function () {
          document.getElementById('catalog-child-title').textContent = '添加子资源 - ' + t.name;
          document.getElementById('catalog-child-parent').value = t.name;
          document.getElementById('catalog-child-name').value = '';
          document.getElementById('catalog-child-query-api').value = '';
          // reset child ops
          var childOpsGroup = document.getElementById('catalog-child-ops-group');
          if (childOpsGroup) childOpsGroup.querySelectorAll('input[type="checkbox"]').forEach(function (cb) { cb.checked = false; });
          refreshApprovalOpsFromSelected('catalog-child-approval-ops-group', 'catalog-child-ops-group', []);
          bindOpsToApprovalRefresh('catalog-child-ops-group', 'catalog-child-approval-ops-group');
        });
      };
    });

    // 绑定编辑子资源
    container.querySelectorAll('.catalog-edit-child-btn').forEach(function (btn) {
      btn.onclick = function () {
        var ci = parseInt(btn.getAttribute('data-cat'));
        var ti = parseInt(btn.getAttribute('data-type'));
        var chi = parseInt(btn.getAttribute('data-child'));
        var cat = MockData.resCatalog[ci];
        var t = cat.types[ti];
        var child = t.children[chi];
        window._catalogEditMode = 'edit-child';
        window._catalogEditCat = ci;
        window._catalogEditType = ti;
        window._catalogEditChild = chi;
        loadAndShowModal('res-catalog/edit-child', function () {
          document.getElementById('catalog-child-title').textContent = '编辑子资源 - ' + child.name;
          document.getElementById('catalog-child-parent').value = t.name;
          document.getElementById('catalog-child-name').value = child.name;
          document.getElementById('catalog-child-query-api').value = child.queryApi || '';
          // set child ops
          var childOpsGroup = document.getElementById('catalog-child-ops-group');
          if (childOpsGroup) {
            childOpsGroup.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
              cb.checked = (child.operations || []).indexOf(cb.value) !== -1;
            });
          }
          refreshApprovalOpsFromSelected('catalog-child-approval-ops-group', 'catalog-child-ops-group', child.approvalOps || []);
          bindOpsToApprovalRefresh('catalog-child-ops-group', 'catalog-child-approval-ops-group');
        });
      };
    });

    // 绑定删除子资源
    container.querySelectorAll('.catalog-del-child-btn').forEach(function (btn) {
      btn.onclick = function () {
        var ci = parseInt(btn.getAttribute('data-cat'));
        var ti = parseInt(btn.getAttribute('data-type'));
        var chi = parseInt(btn.getAttribute('data-child'));
        var childName = MockData.resCatalog[ci].types[ti].children[chi].name;
        MockData.resCatalog[ci].types[ti].children.splice(chi, 1);
        showMessage('子资源「' + childName + '」已删除', 'success');
        renderResCatalog();
      };
    });

    // 绑定删除资源类型
    container.querySelectorAll('.catalog-del-type-btn').forEach(function (btn) {
      btn.onclick = function () {
        var ci = parseInt(btn.getAttribute('data-cat'));
        var ti = parseInt(btn.getAttribute('data-type'));
        var typeName = MockData.resCatalog[ci].types[ti].name;
        window._catalogDelCat = ci;
        window._catalogDelType = ti;
        window._catalogDelName = typeName;
        loadAndShowModal('org/confirm-delete', function () {
          document.getElementById('confirm-delete-msg').textContent = '确定要删除资源类型「' + typeName + '」吗？';
          document.getElementById('confirm-delete-extra').textContent = '删除后该类型将从资源目录中移除。';
          var okBtn = document.getElementById('confirm-delete-ok');
          if (okBtn) {
            okBtn.onclick = function () {
              MockData.resCatalog[window._catalogDelCat].types.splice(window._catalogDelType, 1);
              hideModal();
              showMessage('资源类型「' + window._catalogDelName + '」已删除', 'success');
              renderResCatalog();
            };
          }
        });
      };
    });

    // 绑定删除大类
    container.querySelectorAll('.catalog-del-cat-btn').forEach(function (btn) {
      btn.onclick = function () {
        var ci = parseInt(btn.getAttribute('data-cat'));
        var catName = MockData.resCatalog[ci].name;
        var typeCount = MockData.resCatalog[ci].types.length;
        window._catalogDelCatIdx = ci;
        window._catalogDelCatName = catName;
        loadAndShowModal('org/confirm-delete', function () {
          document.getElementById('confirm-delete-msg').textContent = '确定要删除大类「' + catName + '」吗？';
          document.getElementById('confirm-delete-extra').textContent = typeCount > 0
            ? '该大类下有 ' + typeCount + ' 种资源类型，将一并删除。此操作不可撤销。'
            : '此操作不可撤销。';
          var okBtn = document.getElementById('confirm-delete-ok');
          if (okBtn) {
            okBtn.onclick = function () {
              MockData.resCatalog.splice(window._catalogDelCatIdx, 1);
              hideModal();
              showMessage('大类「' + window._catalogDelCatName + '」已删除', 'success');
              renderResCatalog();
            };
          }
        });
      };
    });
  }

  // 设置操作复选框
  function setCatalogOpsCheckboxes(ops) {
    var group = document.getElementById('catalog-type-ops-group');
    if (!group) return;
    group.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
      cb.checked = ops.indexOf(cb.value) !== -1;
    });
  }

  // 获取操作复选框的值
  function getCatalogOpsCheckboxes() {
    var group = document.getElementById('catalog-type-ops-group');
    if (!group) return [];
    var ops = [];
    group.querySelectorAll('input[type="checkbox"]:checked').forEach(function (cb) {
      ops.push(cb.value);
    });
    return ops;
  }

  // 设置审批操作复选框
  function setCatalogApprovalOpsCheckboxes(ops) {
    var group = document.getElementById('catalog-type-approval-ops-group');
    if (!group) return;
    group.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
      cb.checked = ops.indexOf(cb.value) !== -1;
    });
  }

  // 动态刷新审批操作区域（基于已选操作，排除同步）
  function refreshApprovalOpsFromSelected(containerId, opsGroupId, currentApprovalOps) {
    var opsGroup = document.getElementById(opsGroupId);
    var approvalGroup = document.getElementById(containerId);
    if (!opsGroup || !approvalGroup) return;
    var selectedOps = [];
    opsGroup.querySelectorAll('input[type="checkbox"]:checked').forEach(function (cb) {
      if (cb.value !== '同步') selectedOps.push(cb.value);
    });
    var html = '';
    if (selectedOps.length === 0) {
      html = '<span style="color:var(--text-secondary);font-size:13px;">请先在上方勾选支持操作</span>';
    } else {
      selectedOps.forEach(function (op) {
        var checked = currentApprovalOps.indexOf(op) !== -1 ? ' checked' : '';
        html += '<label class="ant-checkbox-wrapper"><input type="checkbox" value="' + op + '"' + checked + ' /> ' + op + '</label>';
      });
    }
    approvalGroup.innerHTML = html;
  }

  // 绑定操作checkbox联动审批区域
  function bindOpsToApprovalRefresh(opsGroupId, approvalContainerId) {
    var opsGroup = document.getElementById(opsGroupId);
    if (!opsGroup) return;
    opsGroup.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
      cb.addEventListener('change', function () {
        var currentApproval = [];
        var approvalGroup = document.getElementById(approvalContainerId);
        if (approvalGroup) {
          approvalGroup.querySelectorAll('input[type="checkbox"]:checked').forEach(function (acb) {
            currentApproval.push(acb.value);
          });
        }
        refreshApprovalOpsFromSelected(approvalContainerId, opsGroupId, currentApproval);
      });
    });
  }

  // 获取审批操作复选框的值
  function getCatalogApprovalOpsCheckboxes() {
    var group = document.getElementById('catalog-type-approval-ops-group');
    if (!group) return [];
    var ops = [];
    group.querySelectorAll('input[type="checkbox"]:checked').forEach(function (cb) {
      ops.push(cb.value);
    });
    return ops;
  }

  // 渲染子资源编辑区
  function renderCatalogChildrenEditor(children) {
    var container = document.getElementById('catalog-type-children-container');
    if (!container) return;
    var allOps = ['申请', '变配', '扩容', '缩容', '重启', '销毁', '续费', '同步'];
    var html = '';
    children.forEach(function (child, idx) {
      html += '<div class="catalog-child-edit-row" data-child-idx="' + idx + '">';
      html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">';
      html += '<input class="ant-input catalog-child-name" style="max-width:160px;" placeholder="子资源名称" value="' + esc(child.name) + '" />';
      html += '<input class="ant-input catalog-child-query-api" style="max-width:200px;" placeholder="查询接口" value="' + esc(child.queryApi || '') + '" />';
      html += '<button type="button" class="ant-btn ant-btn-sm ant-btn-danger catalog-child-remove" title="删除">&times;</button>';
      html += '</div>';
      html += '<div class="ant-checkbox-group catalog-child-ops" style="margin-bottom:12px;">';
      allOps.forEach(function (op) {
        var checked = (child.operations || []).indexOf(op) !== -1 ? ' checked' : '';
        html += '<label class="ant-checkbox-wrapper"><input type="checkbox" value="' + op + '"' + checked + ' /> ' + op + '</label>';
      });
      html += '</div></div>';
    });
    container.innerHTML = html;
    // 绑定删除按钮
    container.querySelectorAll('.catalog-child-remove').forEach(function (btn) {
      btn.onclick = function () {
        btn.closest('.catalog-child-edit-row').remove();
      };
    });
  }

  // 读取子资源编辑数据
  function getCatalogChildrenData() {
    var container = document.getElementById('catalog-type-children-container');
    if (!container) return [];
    var children = [];
    container.querySelectorAll('.catalog-child-edit-row').forEach(function (row) {
      var name = row.querySelector('.catalog-child-name').value.trim();
      if (!name) return;
      var ops = [];
      row.querySelectorAll('.catalog-child-ops input:checked').forEach(function (cb) { ops.push(cb.value); });
      var queryApiInput = row.querySelector('.catalog-child-query-api');
      var queryApi = queryApiInput ? queryApiInput.value.trim() : '';
      children.push({ name: name, operations: ops, queryApi: queryApi, allowApply: true, allowDisplay: true });
    });
    return children;
  }

  // 绑定"添加子资源"按钮
  function bindCatalogAddChildBtn() {
    var btn = document.getElementById('catalog-type-add-child');
    if (!btn) return;
    btn.onclick = function () {
      var container = document.getElementById('catalog-type-children-container');
      var currentChildren = getCatalogChildrenData();
      currentChildren.push({ name: '', operations: [], allowApply: true, allowDisplay: true });
      renderCatalogChildrenEditor(currentChildren);
    };
  }

  // =============================================
  // 资源管理页
  // =============================================
  function initResourcePage() {
    renderResources();
    var searchInput = document.getElementById('resource-search');
    if (searchInput) searchInput.oninput = function () { state.resource.keyword = searchInput.value; state.resource.page = 1; renderResources(); };
    var typeFilter = document.getElementById('resource-type-filter');
    if (typeFilter) typeFilter.onchange = function () { state.resource.typeFilter = typeFilter.value; state.resource.page = 1; renderResources(); };
    var groupFilter = document.getElementById('resource-group-filter');
    if (groupFilter) groupFilter.onchange = function () { state.resource.groupFilter = groupFilter.value; state.resource.page = 1; renderResources(); };
    var projectFilter = document.getElementById('resource-project-filter');
    if (projectFilter) projectFilter.onchange = function () { state.resource.projectFilter = projectFilter.value; state.resource.page = 1; renderResources(); };
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
      return true;
    });

    // Stats
    var statsContainer = document.getElementById('resource-stats');
    if (statsContainer) {
      var ecsCount = 0, dbCount = 0, ungroupedCount = 0;
      data.forEach(function (r) {
        if (r.type === 'ECS') ecsCount++;
        else if (r.type === 'RDS' || r.type === 'Redis') dbCount++;
      });
      ungroupedCount = (MockData.ungroupedResources || []).length;
      statsContainer.innerHTML =
        '<div class="stat-card"><div class="stat-value">' + data.length + '</div><div class="stat-label">资源总数</div></div>' +
        '<div class="stat-card"><div class="stat-value">' + ecsCount + '</div><div class="stat-label">ECS 云服务器</div></div>' +
        '<div class="stat-card"><div class="stat-value">' + dbCount + '</div><div class="stat-label">数据库 / 缓存</div></div>' +
        '<div class="stat-card" id="stat-ungrouped" style="cursor:pointer;"><div class="stat-value" style="color:#1890ff;">' + ungroupedCount + '</div><div class="stat-label">未分组资源</div></div>';
      var ungroupedCard = document.getElementById('stat-ungrouped');
      if (ungroupedCard) {
        ungroupedCard.onclick = function () {
          switchPage('orphan', null);
        };
      }
    }

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
        if (op === '申请') return; // 申请不显示在已有资源的操作中
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
    if (!tableContainer) return;
    var html = '<table class="ant-table"><thead><tr><th class="check-col"><input type="checkbox" id="resource-select-all" /></th><th>资源名称</th><th>资源类型</th><th>所属组</th><th>所属资源组</th><th>申请人</th><th>我的权限</th><th>状态</th><th>操作</th></tr></thead><tbody>';
    if (pageData.length === 0) {
      html += '<tr><td colspan="9" style="text-align:center;color:var(--text-secondary);padding:32px;">暂无数据</td></tr>';
    }
    var rowIdx = 0;
    pageData.forEach(function (r) {
      html += '<tr><td class="check-col"><input type="checkbox" class="resource-row-check" /></td>';
      html += '<td><a class="link">' + esc(r.name) + '</a><div style="font-size:12px;color:var(--text-secondary);">' + esc(r.resId) + '</div></td>';
      html += '<td><span class="ant-tag ant-tag-' + r.typeColor + '">' + esc(r.type) + '</span></td>';
      html += '<td>' + esc(r.group) + '</td><td>' + esc(r.project) + '</td>';
      html += '<td>' + (r.applicant ? esc(r.applicant) : '--') + '</td>';
      html += '<td><span class="ant-tag ant-tag-' + r.permColor + '"' +
        (r.perm === 'master' && (r.type === 'RDS' || r.type === 'Redis' || r.type === 'Kafka' || r.type === 'ES' || r.type === 'PG' || r.type === 'MongoDB') ? ' title="数据库/中间件 master 权限仅组长和部门负责人可持有" style="cursor:help;"' : '') +
        '>' + esc(r.perm) + '</span></td>';
      html += '<td><span class="ant-badge-status-dot ant-badge-status-' + r.statusClass + '"></span>' + esc(r.status) + '</td>';
      html += '<td>' + renderOpsCell(r, rowIdx) + '</td></tr>';
      rowIdx++;
      // 子资源行
      if (r.children && r.children.length) {
        r.children.forEach(function (child, childIdx) {
          var connector = childIdx === r.children.length - 1 ? '└─' : '├─';
          html += '<tr style="background:#fafafa;"><td class="check-col"></td>';
          html += '<td style="padding-left:28px;"><span style="color:var(--text-secondary);">' + connector + '</span> <a class="link">' + esc(child.name) + '</a><div style="font-size:12px;color:var(--text-secondary);padding-left:22px;">' + esc(child.resId) + '</div></td>';
          html += '<td><span class="ant-tag ant-tag-' + child.typeColor + '" style="font-size:11px;">' + esc(child.type) + '</span></td>';
          html += '<td style="color:var(--text-secondary);font-size:12px;">--</td>';
          html += '<td style="color:var(--text-secondary);font-size:12px;">--</td>';
          html += '<td style="color:var(--text-secondary);font-size:12px;">--</td>';
          html += '<td style="color:var(--text-secondary);font-size:12px;">--</td>';
          html += '<td><span class="ant-badge-status-dot ant-badge-status-' + child.statusClass + '"></span>' + esc(child.status) + '</td>';
          html += '<td><a class="ant-btn-link resource-detail-btn" data-res="' + esc(child.name) + '">详情</a></td></tr>';
          rowIdx++;
        });
      }
    });
    html += '</tbody></table><div id="resource-pagination"></div>';
    tableContainer.innerHTML = html;

    // Select all checkbox
    var selectAll = document.getElementById('resource-select-all');
    if (selectAll) {
      selectAll.onchange = function () {
        tableContainer.querySelectorAll('.resource-row-check').forEach(function (cb) { cb.checked = selectAll.checked; });
      };
    }

    // 绑定资源详情按钮
    tableContainer.querySelectorAll('.resource-detail-btn').forEach(function (btn) {
      btn.onclick = function () {
        var resName = btn.getAttribute('data-res');
        var res = null;
        for (var i = 0; i < MockData.resources.length; i++) {
          if (MockData.resources[i].name === resName) { res = MockData.resources[i]; break; }
        }
        if (!res) return;
        loadAndShowModal('resource/view-resource', function () {
          var titleEl = document.getElementById('resource-detail-title');
          if (titleEl) titleEl.textContent = '资源详情 - ' + resName;
          var bodyEl = document.getElementById('resource-detail-body');
          if (bodyEl) bodyEl.innerHTML =
            '<div class="ant-descriptions-row"><div class="ant-descriptions-label">资源名称</div><div class="ant-descriptions-content">' + esc(res.name) + '</div></div>' +
            '<div class="ant-descriptions-row"><div class="ant-descriptions-label">资源ID</div><div class="ant-descriptions-content" style="font-family:monospace;font-size:12px;">' + esc(res.resId) + '</div></div>' +
            '<div class="ant-descriptions-row"><div class="ant-descriptions-label">资源类型</div><div class="ant-descriptions-content"><span class="ant-tag ant-tag-' + res.typeColor + '">' + esc(res.type) + '</span></div></div>' +
            '<div class="ant-descriptions-row"><div class="ant-descriptions-label">所属组</div><div class="ant-descriptions-content">' + esc(res.group) + '</div></div>' +
            '<div class="ant-descriptions-row"><div class="ant-descriptions-label">所属资源组</div><div class="ant-descriptions-content">' + esc(res.project) + '</div></div>' +
            '<div class="ant-descriptions-row"><div class="ant-descriptions-label">我的权限</div><div class="ant-descriptions-content"><span class="ant-tag ant-tag-' + res.permColor + '">' + esc(res.perm) + '</span></div></div>' +
            '<div class="ant-descriptions-row"><div class="ant-descriptions-label">状态</div><div class="ant-descriptions-content"><span class="ant-badge-status-dot ant-badge-status-' + res.statusClass + '"></span>' + esc(res.status) + '</div></div>';
        });
      };
    });

    // 绑定资源操作按钮
    tableContainer.querySelectorAll('.resource-action-btn').forEach(function (btn) {
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
    tableContainer.querySelectorAll('.res-more-btn').forEach(function (btn) {
      btn.onclick = function (e) {
        e.stopPropagation();
        var rowId = btn.getAttribute('data-row');
        var dropdown = tableContainer.querySelector('.res-more-dropdown[data-row="' + rowId + '"]');
        if (!dropdown) return;
        var isVisible = dropdown.style.display !== 'none';
        // 先关闭所有
        tableContainer.querySelectorAll('.res-more-dropdown').forEach(function (d) { d.style.display = 'none'; });
        if (!isVisible) dropdown.style.display = 'block';
      };
    });
    // 点击页面其他地方关闭下拉
    document.addEventListener('click', function () {
      tableContainer.querySelectorAll('.res-more-dropdown').forEach(function (d) { d.style.display = 'none'; });
    });

    // Pagination
    var pagEl = document.getElementById('resource-pagination');
    if (pagEl) renderPagination(pagEl, total, s.page, PAGE_SIZE, function (p) { s.page = p; renderResources(); });
  }

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

  // =============================================
  // 角色管理页
  // =============================================
  function initRolePage() {
    renderRoleList();
  }

  function renderRoleList() {
    var container = document.getElementById('role-list-container');
    if (!container) return;
    // 超管角色置顶，其余按原序排列
    var allRoles = MockData.roles;
    var html = '<table class="ant-table"><thead><tr><th>角色名称</th><th>类型</th><th>角色描述</th><th>已授权人数</th><th>操作</th></tr></thead><tbody>';
    allRoles.forEach(function (r) {
      html += '<tr><td>' + esc(r.name);
      if (r.superOnly) html += ' <span class="ant-tag ant-tag-red" style="font-size:11px;">超管可见</span>';
      html += '</td>';
      html += '<td><span class="ant-tag ant-tag-' + r.typeColor + '">' + esc(r.type) + '</span></td>';
      html += '<td>' + esc(r.scope) + '</td>';
      html += '<td><a class="ant-btn-link role-view-users-btn" data-role-name="' + esc(r.name) + '" style="cursor:pointer;">' + r.userCount + ' 人</a></td>';
      html += '<td>';
      if (r.builtin && r.superOnly) {
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
    if (deptFilter) deptFilter.onchange = function () { state.audit.deptFilter = deptFilter.value; state.audit.page = 1; renderAuditLogs(); };
    var dateFrom = document.getElementById('audit-date-from');
    if (dateFrom) dateFrom.onchange = function () { state.audit.dateFrom = dateFrom.value; state.audit.page = 1; renderAuditLogs(); };
    var dateTo = document.getElementById('audit-date-to');
    if (dateTo) dateTo.onchange = function () { state.audit.dateTo = dateTo.value; state.audit.page = 1; renderAuditLogs(); };
    var exportBtn = document.getElementById('audit-export-btn');
    if (exportBtn) exportBtn.onclick = function () { showMessage('审计日志导出任务已提交，请稍后在下载中心查看', 'success'); };
  }

  function renderAuditLogs() {
    var s = state.audit;
    var data = MockData.auditLogs.filter(function (log) {
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

  // =============================================
  // 工单管理页
  // =============================================
  function initTicketPage() {
    // 统计卡片
    var statsEl = document.getElementById('ticket-stats');
    if (statsEl) {
      var pending = 0, processing = 0, done = 0;
      MockData.tickets.forEach(function (t) {
        if (t.status === '待处理') pending++;
        else if (t.status === '处理中') processing++;
        else if (t.status === '已完结') done++;
      });
      statsEl.innerHTML =
        '<div class="stat-card"><div class="stat-value" style="color:#faad14;">' + pending + '</div><div class="stat-label">待处理</div></div>' +
        '<div class="stat-card"><div class="stat-value" style="color:#1890ff;">' + processing + '</div><div class="stat-label">处理中</div></div>' +
        '<div class="stat-card"><div class="stat-value" style="color:#52c41a;">' + done + '</div><div class="stat-label">已完结</div></div>' +
        '<div class="stat-card"><div class="stat-value">' + MockData.tickets.length + '</div><div class="stat-label">总工单</div></div>';
      // 状态流程说明（避免重复插入）
      if (!document.getElementById('ticket-status-note')) {
        var flowNote = document.createElement('div');
        flowNote.id = 'ticket-status-note';
        flowNote.className = 'ant-alert ant-alert-info';
        flowNote.style.cssText = 'margin:8px 0;font-size:12px;';
        flowNote.innerHTML = '<b>状态说明：</b>【待处理】工单已提交，处理人尚未接单；【处理中】处理人已接单，正在处理；【已完结】问题已解决。工单转移操作会记录在处理记录中。';
        statsEl.parentNode.insertBefore(flowNote, statsEl.nextSibling);
      }
    }

    // 部门筛选下拉
    var deptFilter = document.getElementById('ticket-dept-filter');
    if (deptFilter && deptFilter.options.length <= 1) {
      MockData.getAllDepts().forEach(function (d) {
        deptFilter.innerHTML += '<option value="' + esc(d) + '">' + esc(d) + '</option>';
      });
    }

    // Tab切换
    document.querySelectorAll('#ticket-tabs .ant-tabs-tab').forEach(function (tab) {
      tab.onclick = function () {
        document.querySelectorAll('#ticket-tabs .ant-tabs-tab').forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        state.ticket.activeTab = tab.getAttribute('data-ticket-tab');
        state.ticket.page = 1;
        // 统计卡片仅"总览"时显示
        var statsEl = document.getElementById('ticket-stats');
        if (statsEl) statsEl.style.display = state.ticket.activeTab === 'all' ? '' : 'none';
        renderTickets();
      };
    });

    // 搜索绑定
    var searchEl = document.getElementById('ticket-search');
    if (searchEl) searchEl.oninput = function () { state.ticket.keyword = searchEl.value; state.ticket.page = 1; renderTickets(); };
    var typeFilter = document.getElementById('ticket-type-filter');
    if (typeFilter) typeFilter.onchange = function () { state.ticket.typeFilter = typeFilter.value; state.ticket.page = 1; renderTickets(); };
    var statusFilter = document.getElementById('ticket-status-filter');
    if (statusFilter) statusFilter.onchange = function () { state.ticket.statusFilter = statusFilter.value; state.ticket.page = 1; renderTickets(); };
    if (deptFilter) deptFilter.onchange = function () { state.ticket.deptFilter = deptFilter.value; state.ticket.page = 1; renderTickets(); };

    // 创建工单按钮
    var createBtn = document.getElementById('btn-create-ticket');
    if (createBtn) createBtn.onclick = function () {
      loadAndShowModal('ticket/create-ticket', function () {
        var categorySelect = document.getElementById('create-ticket-category');
        var handlerHint = document.getElementById('create-ticket-handler-hint');
        if (categorySelect && handlerHint) {
          categorySelect.onchange = function () {
            var cat = categorySelect.value;
            if (!cat) { handlerHint.textContent = '请先选择问题类别'; return; }
            // 查找当前用户所在部门的工单处理配置
            var deptId = 'dept-infra'; // 默认 admin 所在部门
            var cfg = MockData.deptConfig[deptId];
            var handler = '--';
            if (cfg && cfg.ticketHandlers) {
              for (var i = 0; i < cfg.ticketHandlers.length; i++) {
                if (cfg.ticketHandlers[i].categoryName === cat) { handler = cfg.ticketHandlers[i].handler; break; }
              }
            }
            handlerHint.textContent = handler;
          };
        }
      });
    };

    renderTickets();
  }

  function renderTickets() {
    var s = state.ticket;
    var filtered = MockData.tickets.filter(function (t) {
      // Tab过滤
      if (s.activeTab === 'mine' && t.applicant !== '王浩然') return false;
      if (s.activeTab === 'handle' && t.handler !== '张明远') return false;
      if (s.keyword) {
        var kw = s.keyword.toLowerCase();
        if (t.id.toLowerCase().indexOf(kw) === -1 && t.title.toLowerCase().indexOf(kw) === -1) return false;
      }
      if (s.typeFilter && t.category !== s.typeFilter) return false;
      if (s.statusFilter && t.status !== s.statusFilter) return false;
      if (s.deptFilter && t.applicantDept !== s.deptFilter) return false;
      return true;
    });
    var total = filtered.length;
    var start = (s.page - 1) * PAGE_SIZE;
    var pageData = filtered.slice(start, start + PAGE_SIZE);
    var statusColors = { '待处理': 'warning', '处理中': 'processing', '已完结': 'success' };
    var categoryColors = { '账号权限类': 'orange', '资源问题类': 'blue', '网络问题类': 'cyan', '安全合规类': 'red', '其他': 'default' };

    var tableContainer = document.getElementById('ticket-table-container');
    if (!tableContainer) return;
    var html = '<table class="ant-table"><thead><tr><th>工单号</th><th>标题</th><th>问题类别</th><th>状态</th><th>申请人</th><th>处理人</th><th>创建时间</th><th>操作</th></tr></thead><tbody>';
    if (pageData.length === 0) {
      html += '<tr><td colspan="8" style="text-align:center;color:var(--text-secondary);padding:32px;">暂无数据</td></tr>';
    }
    pageData.forEach(function (t) {
      html += '<tr><td style="white-space:nowrap;font-family:monospace;font-size:12px;">' + esc(t.id) + '</td>';
      html += '<td>' + esc(t.title) + '</td>';
      html += '<td><span class="ant-tag ant-tag-' + (categoryColors[t.category] || 'default') + '">' + esc(t.category) + '</span></td>';
      html += '<td><span class="ant-badge-status-dot ant-badge-status-' + (statusColors[t.status] || 'default') + '"></span>' + esc(t.status) + '</td>';
      html += '<td>' + esc(t.applicant) + '</td>';
      html += '<td>' + esc(t.handler) + '</td>';
      html += '<td style="white-space:nowrap;">' + esc(t.createTime) + '</td>';
      html += '<td><a class="ant-btn-link ticket-view-btn" data-ticket-id="' + esc(t.id) + '">查看</a>';
      if (t.status === '待处理') html += ' <a class="ant-btn-link ticket-handle-btn" data-ticket-id="' + esc(t.id) + '">接单处理</a>';
      if (t.status === '处理中') html += ' <a class="ant-btn-link ticket-close-btn" data-ticket-id="' + esc(t.id) + '">完结</a>';
      if (t.status !== '已完结') html += ' <a class="ant-btn-link ticket-transfer-btn" data-ticket-id="' + esc(t.id) + '">转移</a>';
      html += '</td></tr>';
    });
    html += '</tbody></table><div id="ticket-pagination"></div>';
    tableContainer.innerHTML = html;

    var pagEl = document.getElementById('ticket-pagination');
    if (pagEl) renderPagination(pagEl, total, s.page, PAGE_SIZE, function (p) { s.page = p; renderTickets(); });

    // 绑定查看按钮
    tableContainer.querySelectorAll('.ticket-view-btn').forEach(function (btn) {
      btn.onclick = function () {
        var ticketId = btn.getAttribute('data-ticket-id');
        var ticket = null;
        for (var i = 0; i < MockData.tickets.length; i++) {
          if (MockData.tickets[i].id === ticketId) { ticket = MockData.tickets[i]; break; }
        }
        if (!ticket) return;
        loadAndShowModal('ticket/view-ticket', function () {
          document.getElementById('view-ticket-title').textContent = '工单详情 - ' + ticket.id;
          document.getElementById('view-ticket-id').textContent = ticket.id;
          document.getElementById('view-ticket-type').innerHTML = '<span class="ant-tag ant-tag-' + (categoryColors[ticket.category] || 'default') + '">' + esc(ticket.category) + '</span>';
          document.getElementById('view-ticket-status').textContent = ticket.status;
          document.getElementById('view-ticket-applicant').textContent = ticket.applicant + '（' + ticket.applicantDept + '）';
          document.getElementById('view-ticket-handler').textContent = ticket.handler;
          document.getElementById('view-ticket-resource').textContent = ticket.relatedResource || '--';
          document.getElementById('view-ticket-desc').textContent = ticket.desc;
          // 时间线
          var tlEl = document.getElementById('view-ticket-timeline');
          if (tlEl && ticket.timeline) {
            var tlHtml = '';
            ticket.timeline.forEach(function (step) {
              tlHtml += '<div style="padding:8px 0 8px 16px;position:relative;">';
              tlHtml += '<div style="position:absolute;left:-8px;top:12px;width:12px;height:12px;border-radius:50%;background:#1890ff;border:2px solid #fff;"></div>';
              tlHtml += '<div style="font-weight:500;">' + esc(step.action) + '</div>';
              tlHtml += '<div style="font-size:12px;color:var(--text-secondary);">' + esc(step.time) + ' | ' + esc(step.operator) + '</div>';
              tlHtml += '<div style="font-size:13px;margin-top:2px;">' + esc(step.detail) + '</div>';
              tlHtml += '</div>';
            });
            tlEl.innerHTML = tlHtml;
          }
          // 转移/完结按钮（非已完结时显示）
          var drawerFooter = document.querySelector('#modal-container .ant-drawer-footer');
          if (drawerFooter && ticket.status !== '已完结') {
            var transferBtn = document.createElement('button');
            transferBtn.className = 'ant-btn ant-btn-primary';
            transferBtn.style.marginRight = '8px';
            transferBtn.textContent = '转移工单';
            drawerFooter.insertBefore(transferBtn, drawerFooter.firstChild);
            // 完结按钮（仅处理中）
            if (ticket.status === '处理中') {
              var closeBtn = document.createElement('button');
              closeBtn.className = 'ant-btn';
              closeBtn.style.cssText = 'margin-right:8px;background:#52c41a;color:#fff;border-color:#52c41a;';
              closeBtn.textContent = '完结工单';
              drawerFooter.insertBefore(closeBtn, drawerFooter.firstChild);
              closeBtn.onclick = function () {
                showTicketCloseDrawer(ticket, function () {
                  document.getElementById('view-ticket-status') && (document.getElementById('view-ticket-status').textContent = ticket.status);
                  renderTickets();
                });
              };
            }
            transferBtn.onclick = function () {
              showTicketTransferModal(ticket, function () {
                // 刷新处理人显示
                document.getElementById('view-ticket-handler').textContent = ticket.handler;
                document.getElementById('view-ticket-status').textContent = ticket.status;
                // 刷新时间线
                var tlEl2 = document.getElementById('view-ticket-timeline');
                if (tlEl2 && ticket.timeline) {
                  var tlHtml2 = '';
                  ticket.timeline.forEach(function (step) {
                    tlHtml2 += '<div style="padding:8px 0 8px 16px;position:relative;">';
                    tlHtml2 += '<div style="position:absolute;left:-8px;top:12px;width:12px;height:12px;border-radius:50%;background:#1890ff;border:2px solid #fff;"></div>';
                    tlHtml2 += '<div style="font-weight:500;">' + esc(step.action) + '</div>';
                    tlHtml2 += '<div style="font-size:12px;color:var(--text-secondary);">' + esc(step.time) + ' | ' + esc(step.operator) + '</div>';
                    tlHtml2 += '<div style="font-size:13px;margin-top:2px;">' + esc(step.detail) + '</div>';
                    tlHtml2 += '</div>';
                  });
                  tlEl2.innerHTML = tlHtml2;
                }
                renderTickets();
              });
            };
          }
        });
      };
    });

    // 绑定处理按钮
    tableContainer.querySelectorAll('.ticket-handle-btn').forEach(function (btn) {
      btn.onclick = function () {
        var ticketId = btn.getAttribute('data-ticket-id');
        var ticket = null;
        for (var i = 0; i < MockData.tickets.length; i++) {
          if (MockData.tickets[i].id === ticketId) { ticket = MockData.tickets[i]; break; }
        }
        if (!ticket) return;
        window._ticketHandleData = ticket;
        loadAndShowModal('ticket/handle-ticket', function () {
          var idEl = document.getElementById('ticket-handle-id');
          if (idEl) idEl.textContent = ticket.id;
          var nameEl = document.getElementById('ticket-handle-name');
          if (nameEl) nameEl.textContent = ticket.title;
        });
      };
    });

    // 绑定转移按钮
    tableContainer.querySelectorAll('.ticket-transfer-btn').forEach(function (btn) {
      btn.onclick = function () {
        var ticketId = btn.getAttribute('data-ticket-id');
        var ticket = null;
        for (var i = 0; i < MockData.tickets.length; i++) {
          if (MockData.tickets[i].id === ticketId) { ticket = MockData.tickets[i]; break; }
        }
        if (!ticket) return;
        showTicketTransferModal(ticket, function () { renderTickets(); });
      };
    });

    // 绑定完结按钮
    tableContainer.querySelectorAll('.ticket-close-btn').forEach(function (btn) {
      btn.onclick = function () {
        var ticketId = btn.getAttribute('data-ticket-id');
        var ticket = null;
        for (var i = 0; i < MockData.tickets.length; i++) {
          if (MockData.tickets[i].id === ticketId) { ticket = MockData.tickets[i]; break; }
        }
        if (!ticket) return;
        // 用侧边抽屉确认完结
        showTicketCloseDrawer(ticket, function () { renderTickets(); });
      };
    });
  }

  // 完结工单 - 使用侧边抽屉
  function showTicketCloseDrawer(ticket, onComplete) {
    var html = '<div class="ant-drawer-overlay" style="display:flex;">';
    html += '<div class="ant-drawer" style="width:520px;">';
    html += '<div class="ant-drawer-header">完结工单 <button class="ant-drawer-close" onclick="hideModal()">&times;</button></div>';
    html += '<div class="ant-drawer-body">';
    html += '<div class="ant-alert ant-alert-info" style="margin-bottom:16px;">工单完结后状态将变为「已完结」，不可再转移或处理。</div>';
    html += '<div style="margin-bottom:12px;color:var(--text-secondary);">工单：<b>' + esc(ticket.id) + '</b> - ' + esc(ticket.title) + '</div>';
    html += '<div class="ant-form-item"><div class="ant-form-label">解决方案 / 处理结果 <span style="color:red;">*</span></div>';
    html += '<div class="ant-form-control"><textarea class="ant-input" id="close-ticket-remark" rows="4" style="width:100%;resize:vertical;" placeholder="请填写解决方案或处理结果..."></textarea></div></div>';
    html += '</div>';
    html += '<div class="ant-drawer-footer">';
    html += '<button class="ant-btn" onclick="hideModal()">取消</button>';
    html += '<button class="ant-btn ant-btn-primary" id="close-ticket-confirm-btn" style="background:#52c41a;border-color:#52c41a;">确认完结</button>';
    html += '</div></div></div>';
    var mc = document.getElementById('modal-container');
    mc.innerHTML = html;
    var overlay = mc.querySelector('.ant-drawer-overlay');
    if (overlay) overlay.onclick = function (e) { if (e.target === overlay) hideModal(); };
    document.getElementById('close-ticket-confirm-btn').onclick = function () {
      var remark = (document.getElementById('close-ticket-remark').value || '').trim();
      if (!remark) { showMessage('请填写处理结果', 'error'); return; }
      var now = new Date();
      var timeStr = now.getFullYear() + '/' + String(now.getMonth() + 1).padStart(2, '0') + '/' + String(now.getDate()).padStart(2, '0') + ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0');
      ticket.status = '已完结';
      ticket.statusClass = 'success';
      ticket.updateTime = timeStr;
      if (!ticket.timeline) ticket.timeline = [];
      ticket.timeline.push({ time: timeStr, action: '已解决', operator: '当前用户', detail: remark });
      hideModal();
      showMessage('工单 ' + ticket.id + ' 已完结', 'success');
      if (onComplete) onComplete();
    };
  }
  function showTicketTransferModal(ticket, onComplete) {
    var members = MockData.members.filter(function (m) { return m.name !== ticket.handler; });
    var memberOpts = members.map(function (m) {
      return '<option value="' + esc(m.name) + '">' + esc(m.name) + '（' + esc(m.orgName) + ' · ' + esc(m.role) + '）</option>';
    }).join('');

    var html = '<div class="ant-drawer-overlay" style="display:flex;">';
    html += '<div class="ant-drawer" style="width:540px;">';
    html += '<div class="ant-drawer-header">转移工单 <button class="ant-drawer-close" onclick="hideModal()">&times;</button></div>';
    html += '<div class="ant-drawer-body">';
    html += '<div style="margin-bottom:12px;color:var(--text-secondary);font-size:13px;">当前工单：<b>' + esc(ticket.id) + '</b> - ' + esc(ticket.title) + '</div>';
    html += '<div style="margin-bottom:16px;color:var(--text-secondary);font-size:12px;">当前处理人：' + esc(ticket.handler) + ' &nbsp;|&nbsp; 状态：' + esc(ticket.status) + '</div>';
    html += '<div class="ant-alert ant-alert-warning" style="margin-bottom:16px;font-size:12px;">转移后工单状态保持不变，转移记录将追加到处理记录中。</div>';
    html += '<div class="ant-form-item"><div class="ant-form-label" style="font-weight:500;">转移给 <span style="color:red;">*</span></div>';
    html += '<div class="ant-form-control"><select class="ant-select" id="transfer-target-member" style="width:100%;"><option value="">— 请选择新处理人 —</option>' + memberOpts + '</select></div></div>';
    html += '<div class="ant-form-item"><div class="ant-form-label" style="font-weight:500;">转移原因 <span style="color:red;">*</span></div>';
    html += '<div class="ant-form-control"><textarea class="ant-input" id="transfer-reason" rows="4" style="width:100%;resize:vertical;" placeholder="请说明转移原因…"></textarea></div></div>';
    html += '</div>';
    html += '<div class="ant-drawer-footer">';
    html += '<button class="ant-btn" onclick="hideModal()">取消</button>';
    html += '<button class="ant-btn ant-btn-primary" id="transfer-confirm-btn">确认转移</button>';
    html += '</div></div></div>';

    var modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = html;
    var overlay = modalContainer.querySelector('.ant-drawer-overlay');
    if (overlay) overlay.onclick = function (e) { if (e.target === overlay) hideModal(); };

    var confirmBtn = document.getElementById('transfer-confirm-btn');
    if (confirmBtn) {
      confirmBtn.onclick = function () {
        var targetName = document.getElementById('transfer-target-member').value;
        var reason = (document.getElementById('transfer-reason').value || '').trim();
        if (!targetName) { showMessage('请选择新处理人', 'error'); return; }
        if (!reason) { showMessage('请填写转移原因', 'error'); return; }
        var now = new Date();
        var timeStr = now.getFullYear() + '/' +
          String(now.getMonth() + 1).padStart(2, '0') + '/' +
          String(now.getDate()).padStart(2, '0') + ' ' +
          String(now.getHours()).padStart(2, '0') + ':' +
          String(now.getMinutes()).padStart(2, '0') + ':' +
          String(now.getSeconds()).padStart(2, '0');
        var prevHandler = ticket.handler;
        ticket.handler = targetName;
        ticket.updateTime = timeStr;
        if (!ticket.timeline) ticket.timeline = [];
        ticket.timeline.push({ action: '工单转移', time: timeStr, operator: '张明远', detail: '由 ' + prevHandler + ' 转移给 ' + targetName + '，原因：' + reason });
        hideModal();
        showMessage('工单已转移给 ' + targetName, 'success');
        if (onComplete) onComplete();
      };
    }
  }

  // =============================================
  // 页面加载 & 切换
  // =============================================
  function loadPage(id) {
    var container = document.getElementById('page-container');
    if (pageCache[id]) {
      container.innerHTML = pageCache[id];
      bindPageEvents(id);
      return;
    }
    fetch('pages/' + id + '.html')
      .then(function (r) { return r.text(); })
      .then(function (html) {
        pageCache[id] = html;
        container.innerHTML = html;
        bindPageEvents(id);
      })
      .catch(function () {
        container.innerHTML = '<div class="ant-empty"><div class="ant-empty-icon">&#128466;</div>加载失败，请使用本地服务器启动<br><code>npx serve .</code></div>';
      });
  }

  function switchPage(id, el) {
    currentPage = id;
    document.querySelectorAll('.menu-item').forEach(function (i) { i.classList.remove('active'); });
    if (el) el.classList.add('active');
    loadPage(id);
  }

  // ===== 弹窗 =====
  function loadAndShowModal(name, onReady) {
    var container = document.getElementById('modal-container');
    if (modalCache[name]) {
      container.innerHTML = modalCache[name];
      var overlay = container.querySelector('.ant-modal-overlay, .ant-drawer-overlay');
      if (overlay) overlay.style.display = 'flex';
      bindModalEvents(name);
      if (onReady) onReady();
      return;
    }
    fetch('modals/' + name + '.html')
      .then(function (r) { return r.text(); })
      .then(function (html) {
        modalCache[name] = html;
        container.innerHTML = html;
        var overlay = container.querySelector('.ant-modal-overlay, .ant-drawer-overlay');
        if (overlay) overlay.style.display = 'flex';
        bindModalEvents(name);
        if (onReady) onReady();
      })
      .catch(function () {
        alert('弹窗加载失败，请使用本地服务器启动');
      });
  }

  function hideModal() {
    var container = document.getElementById('modal-container');
    var overlay = container.querySelector('.ant-modal-overlay, .ant-drawer-overlay');
    if (overlay) overlay.style.display = 'none';
  }

  // ===== Tab 切换 =====
  function switchTab(el, showId, hideId) {
    el.parentElement.querySelectorAll('.ant-tabs-tab').forEach(function (t) { t.classList.remove('active'); });
    el.classList.add('active');
    document.getElementById(showId).style.display = '';
    document.getElementById(hideId).style.display = 'none';
  }

  function switchCfgTab(el, tab) {
    // legacy, no longer used — res-config now uses initResConfigPage
    el.parentElement.querySelectorAll('.ant-tabs-tab').forEach(function (t) { t.classList.remove('active'); });
    el.classList.add('active');
  }

  // ===== 事件绑定 =====
  function bindPageEvents(id) {
    var container = document.getElementById('page-container');

    // Tab 切换
    container.querySelectorAll('[data-tab-show]').forEach(function (tab) {
      tab.onclick = function () {
        var showId = tab.getAttribute('data-tab-show');
        var hideId = tab.getAttribute('data-tab-hide');
        switchTab(tab, showId, hideId);
      };
    });

    // 资源配置多 Tab
    container.querySelectorAll('[data-cfg-tab]').forEach(function (tab) {
      tab.onclick = function () { switchCfgTab(tab, tab.getAttribute('data-cfg-tab')); };
    });

    // 弹窗触发
    container.querySelectorAll('[data-modal]').forEach(function (btn) {
      btn.onclick = function () {
        var modalName = btn.getAttribute('data-modal');
        if (modalName === 'role/add-role') {
          window._editRoleData = null;
          loadAndShowModal(modalName, function () { renderRolePermModules({}); });
        } else if (modalName === 'cloud/apply-sub') {
          loadAndShowModal(modalName, function () { renderPermPkgList(); });
        } else if (modalName === 'project/add-project') {
          loadAndShowModal(modalName, function () { renderAddProjectModal(); });
        } else if (modalName === 'resource/apply-resource') {
          loadAndShowModal(modalName, function () { initApplyResourceModal(); });
        } else {
          loadAndShowModal(modalName);
        }
      };
    });

    // 页面专属初始化
    if (id === 'org') initOrgPage();
    else if (id === 'cloud') initCloudPage();
    else if (id === 'project') initProjectPage();
    else if (id === 'res-catalog') initResCatalogPage();
    else if (id === 'resource') initResourcePage();
    else if (id === 'orphan') initOrphanPage();
    else if (id === 'role') initRolePage();
    else if (id === 'audit') initAuditPage();
    else if (id === 'ticket') initTicketPage();
    else if (id === 'user') initUserPage();
    else if (id === 'dept-config') initDeptConfigPage();
    else if (id === 'res-config') initResConfigPage();
    else if (id === 'apply-records') initApplyRecordsPage();
    else if (id === 'review-records') initReviewRecordsPage();
    else if (id === 'res-packages') initResPackagesPage();
  }

  function bindModalEvents(name) {
    var container = document.getElementById('modal-container');
    // 关闭按钮（模态框和抽屉通用）
    container.querySelectorAll('.ant-modal-close, .ant-drawer-close, [data-close-modal]').forEach(function (btn) {
      btn.onclick = function () { hideModal(); };
    });

    // 确定/提交按钮 - 带表单处理
    var submitBtn = container.querySelector('.ant-btn-primary') || container.querySelector('#confirm-delete-ok');
    if (submitBtn) {
      submitBtn.onclick = function (e) {
        e.preventDefault();
        handleModalSubmit(name);
      };
    }

    // 取消按钮（模态框 footer 和抽屉 footer）
    container.querySelectorAll('.ant-modal-footer .ant-btn:not(.ant-btn-primary), .ant-drawer-footer .ant-btn:not(.ant-btn-primary)').forEach(function (btn) {
      btn.onclick = function () { hideModal(); };
    });

    // 点击遮罩关闭
    var overlay = container.querySelector('.ant-modal-overlay, .ant-drawer-overlay');
    if (overlay) {
      overlay.onclick = function (e) { if (e.target === overlay) hideModal(); };
    }
  }

  function handleModalSubmit(name) {
    var container = document.getElementById('modal-container');
    if (name === 'org/edit-org') {
      var orgId = window._editingOrgId;
      var org = MockData.findOrg(orgId);
      if (!org) { hideModal(); return; }
      var nameInput = document.getElementById('edit-org-name');
      var leaderSelect = document.getElementById('edit-org-leader');
      if (!nameInput || !nameInput.value.trim()) { showMessage('请填写名称', 'warning'); return; }
      if (org.type === 'dept' && (!leaderSelect || !leaderSelect.value)) { showMessage('请选择部门负责人', 'warning'); return; }
      var oldName = org.name;
      org.name = nameInput.value.trim();
      if (leaderSelect && leaderSelect.value) {
        var selOpt = leaderSelect.options[leaderSelect.selectedIndex];
        org.leader = { name: selOpt.text.split(' (')[0], username: leaderSelect.value };
      } else if (leaderSelect && !leaderSelect.value && org.type !== 'dept') {
        org.leader = { name: '待指定', username: '' };
      }
      // 保存匹配规则（部门和组都支持）
      var matchRuleInput = document.getElementById('edit-org-matchrule');
      if (matchRuleInput) {
        org.matchRule = matchRuleInput.value.trim();
      }
      // 同步更新 members 中的 orgName
      if (oldName !== org.name) {
        MockData.members.forEach(function (m) { if (m.orgId === orgId) m.orgName = org.name; });
      }
      hideModal();
      var label = org.type === 'dept' ? '部门' : '组';
      showMessage('编辑' + label + '「' + org.name + '」成功', 'success');
      MockData.auditLogs.unshift({ time: new Date().toLocaleString('zh-CN').replace(/\//g, '/'), operator: org.type === 'dept' ? '管理员' : '张明远', dept: MockData.getParentDept(orgId) || '--', opType: '组织架构', opTypeColor: 'cyan', target: org.name, desc: '编辑' + label, ip: '10.128.0.10' });
      pageCache = {};
      if (currentPage === 'org') loadPage('org');
    } else if (name === 'org/add-dept') {
      var deptName = document.getElementById('modal-dept-name');
      var deptLeader = document.getElementById('modal-dept-leader');
      if (!deptName || !deptName.value.trim()) { showMessage('请填写部门名称', 'warning'); return; }
      if (!deptLeader || !deptLeader.value) { showMessage('请选择部门负责人', 'warning'); return; }
      var leaderText = deptLeader.options[deptLeader.selectedIndex].text;
      var leaderName = leaderText.split(' (')[0];
      var leaderUsername = deptLeader.value;
      MockData.orgs.push({
        id: 'dept-new-' + Date.now(), name: deptName.value.trim(), type: 'dept', icon: '&#128196;', memberCount: 0,
        leader: { name: leaderName, username: leaderUsername },
        cloudAccount: '', projects: [], children: []
      });
      hideModal();
      showMessage('创建部门「' + deptName.value.trim() + '」成功', 'success');
      MockData.auditLogs.unshift({ time: new Date().toLocaleString('zh-CN').replace(/\//g, '/'), operator: '管理员', dept: '--', opType: '组织架构', opTypeColor: 'cyan', target: deptName.value.trim(), desc: '创建部门', ip: '10.128.0.1' });
      pageCache = {};
      if (currentPage === 'org') loadPage('org');
    } else if (name === 'org/add-group') {
      var groupName = document.getElementById('modal-group-name');
      var parentDept = document.getElementById('modal-group-dept');
      var parentGroup = document.getElementById('modal-group-parent');
      var leader = document.getElementById('modal-group-leader');
      var matchRuleInput = document.getElementById('modal-group-matchrule');
      if (groupName && groupName.value.trim()) {
        var deptName = parentDept ? parentDept.value : '基础架构部';
        var dept = null;
        for (var i = 0; i < MockData.orgs.length; i++) {
          if (MockData.orgs[i].name === deptName) { dept = MockData.orgs[i]; break; }
        }
        if (dept) {
          var newGroup = {
            id: 'grp-new-' + Date.now(), name: groupName.value.trim(), type: 'group', icon: '&#128193;', memberCount: 0,
            leader: { name: (leader && leader.value) ? leader.options[leader.selectedIndex].text : '待指定', username: (leader && leader.value) || '' },
            matchRule: (matchRuleInput && matchRuleInput.value.trim()) || '', children: []
          };
          if (parentGroup && parentGroup.value !== '（直属部门）') {
            for (var j = 0; j < dept.children.length; j++) {
              if (dept.children[j].name === parentGroup.value) {
                newGroup.type = 'subgroup';
                newGroup.icon = '&#128101;';
                dept.children[j].children.push(newGroup);
                break;
              }
            }
          } else {
            dept.children.push(newGroup);
          }
          hideModal();
          showMessage('创建组「' + groupName.value.trim() + '」成功', 'success');
          // Add audit log
          MockData.auditLogs.unshift({ time: new Date().toLocaleString('zh-CN').replace(/\//g, '/'), operator: '张明远', dept: deptName, opType: '组织架构', opTypeColor: 'cyan', target: groupName.value.trim(), desc: '创建组', ip: '10.128.0.10' });
          pageCache = {};
          if (currentPage === 'org') loadPage('org');
        }
      } else {
        showMessage('请填写组名称', 'warning');
      }
    } else if (name === 'project/add-project') {
      var projName = document.getElementById('modal-project-name');
      var projDesc = document.getElementById('modal-project-desc');
      var projDept = document.getElementById('modal-project-dept');
      if (!projDept || !projDept.value) { showMessage('请选择所属部门', 'warning'); return; }
      if (projName && projName.value.trim()) {
        MockData.projects.push({
          name: projName.value.trim(), desc: projDesc ? projDesc.value : '', dept: projDept.value,
          creator: '张明远', resourceCount: 0,
          createTime: new Date().toLocaleString('zh-CN').replace(/\//g, '/')
        });
        hideModal();
        showMessage('创建资源组「' + projName.value.trim() + '」成功', 'success');
        MockData.auditLogs.unshift({ time: new Date().toLocaleString('zh-CN').replace(/\//g, '/'), operator: '张明远', dept: '基础架构部', opType: '资源组管理', opTypeColor: 'blue', target: projName.value.trim(), desc: '创建资源组', ip: '10.128.0.10' });
        if (currentPage === 'project') { pageCache.project = null; loadPage('project'); }
      } else {
        showMessage('请填写资源组名称', 'warning');
      }
    } else if (name === 'resource/apply-resource') {
      var resTypeSelect = document.getElementById('modal-apply-res-type');
      if (!resTypeSelect || !resTypeSelect.value) { showMessage('请选择资源类型', 'warning'); return; }
      var resGroupSelect = document.getElementById('modal-apply-res-group');
      if (!resGroupSelect || !resGroupSelect.value) { showMessage('请选择所属资源组', 'warning'); return; }
      var selectedTpl = null;
      for (var i = 0; i < MockData.platformTemplates.length; i++) {
        if (MockData.platformTemplates[i].id === resTypeSelect.value) { selectedTpl = MockData.platformTemplates[i]; break; }
      }
      if (!selectedTpl) { showMessage('请选择资源类型', 'warning'); return; }
      var resName = selectedTpl.resType + '-' + Date.now();
      // 从表单中尝试读取第一个string字段作为资源名
      var firstInput = document.querySelector('#modal-apply-dynamic-form .ant-input[type="text"], #modal-apply-dynamic-form .ant-input:not([type])');
      if (firstInput && firstInput.value.trim()) resName = firstInput.value.trim();
      var selectedGroup = resGroupSelect.options[resGroupSelect.selectedIndex].text;
      MockData.resources.push({
        name: resName, resId: 'i-new-' + Date.now(), type: selectedTpl.resType.split(' ')[0], typeColor: 'blue', shape: '实例型',
        group: '容器平台组', groupId: 'grp-container', project: selectedGroup,
        perm: 'master', permColor: 'green', status: '审批中', statusClass: 'processing'
      });
      hideModal();
      showMessage('资源申请已提交（' + selectedTpl.resType + '），等待审批', 'success');
      MockData.auditLogs.unshift({ time: new Date().toLocaleString('zh-CN').replace(/\//g, '/'), operator: '王浩然', dept: '基础架构部', opType: '资源操作', opTypeColor: 'blue', target: resName, desc: '申请 ' + selectedTpl.resType, ip: '10.128.0.55' });
      if (currentPage === 'resource') { pageCache.resource = null; loadPage('resource'); }
    } else if (name === 'cloud/apply-sub') {
      var subName = document.getElementById('modal-sub-name');
      if (subName && subName.value.trim()) {
        var selectedPkg = '';
        var pkgSelect = document.getElementById('perm-pkg-select');
        if (pkgSelect) selectedPkg = pkgSelect.value;
        if (!selectedPkg) { showMessage('请选择权限包', 'warning'); return; }
        MockData.cloudAccounts.sub.push({
          name: subName.value.trim(), vendor: '阿里云', ramUser: '--',
          permPackageId: selectedPkg,
          durationType: '长期持有', createTime: new Date().toLocaleString('zh-CN').replace(/\//g, '/'),
          status: '审批中', statusClass: 'warning'
        });
        hideModal();
        showMessage('子账号申请已提交，等待审批', 'success');
        MockData.auditLogs.unshift({ time: new Date().toLocaleString('zh-CN').replace(/\//g, '/'), operator: '王浩然', dept: '基础架构部', opType: '云账号', opTypeColor: 'green', target: '子账号: ' + subName.value.trim(), desc: '申请子账号', ip: '10.128.0.55' });
        if (currentPage === 'cloud') { pageCache.cloud = null; state.cloud.activeTab = 'sub'; loadPage('cloud'); }
      } else {
        showMessage('请填写账号名称', 'warning');
      }
    } else if (name === 'cloud/bind-main') {
      var alias = document.getElementById('bind-cloud-alias');
      var ak = document.getElementById('bind-cloud-ak');
      var sk = document.getElementById('bind-cloud-sk');
      if (!alias || !alias.value.trim()) { showMessage('请填写账号别名', 'warning'); return; }
      if (!ak || !ak.value.trim()) { showMessage('请填写 AccessKey ID', 'warning'); return; }
      if (!sk || !sk.value.trim()) { showMessage('请填写 AccessKey Secret', 'warning'); return; }
      var dept = window._bindCloudDept;
      // 更新 mock 数据
      for (var i = 0; i < MockData.cloudAccounts.main.length; i++) {
        if (MockData.cloudAccounts.main[i].dept === dept) {
          MockData.cloudAccounts.main[i].vendor = '阿里云';
          MockData.cloudAccounts.main[i].account = alias.value.trim() + ' (' + ak.value.trim().substring(0, 4) + '****)';
          MockData.cloudAccounts.main[i].bindUser = '部门负责人';
          MockData.cloudAccounts.main[i].bindTime = new Date().toLocaleString('zh-CN').replace(/\//g, '/');
          MockData.cloudAccounts.main[i].status = '正常';
          break;
        }
      }
      hideModal();
      showMessage('已成功关联「' + dept + '」的主账号', 'success');
      MockData.auditLogs.unshift({ time: new Date().toLocaleString('zh-CN').replace(/\//g, '/'), operator: '部门负责人', dept: dept, opType: '云账号', opTypeColor: 'green', target: alias.value.trim(), desc: '关联部门主账号', ip: '10.128.0.10' });
      pageCache = {};
      if (currentPage === 'cloud') loadPage('cloud');
    } else if (name === 'cloud/confirm-action') {
      var action = window._cloudConfirmAction;
      if (action === 'unbind') {
        var dept = window._cloudConfirmDept;
        for (var i = 0; i < MockData.cloudAccounts.main.length; i++) {
          if (MockData.cloudAccounts.main[i].dept === dept) {
            MockData.cloudAccounts.main[i].vendor = '';
            MockData.cloudAccounts.main[i].account = '';
            MockData.cloudAccounts.main[i].bindUser = '';
            MockData.cloudAccounts.main[i].bindTime = '';
            MockData.cloudAccounts.main[i].status = '未关联';
            break;
          }
        }
        hideModal();
        showMessage('已解绑「' + dept + '」的主账号', 'success');
        MockData.auditLogs.unshift({ time: new Date().toLocaleString('zh-CN').replace(/\//g, '/'), operator: '部门负责人', dept: dept, opType: '云账号', opTypeColor: 'green', target: dept, desc: '解绑主账号', ip: '10.128.0.10' });
        pageCache = {};
        if (currentPage === 'cloud') loadPage('cloud');
      } else if (action === 'reclaim') {
        var subName = window._cloudConfirmSubName;
        for (var i = 0; i < MockData.cloudAccounts.sub.length; i++) {
          if (MockData.cloudAccounts.sub[i].name === subName) {
            MockData.cloudAccounts.sub[i].status = '已回收';
            MockData.cloudAccounts.sub[i].statusClass = 'default';
            break;
          }
        }
        hideModal();
        showMessage('已回收子账号「' + subName + '」', 'success');
        MockData.auditLogs.unshift({ time: new Date().toLocaleString('zh-CN').replace(/\//g, '/'), operator: '部门负责人', dept: '基础架构部', opType: '云账号', opTypeColor: 'green', target: subName, desc: '回收子账号', ip: '10.128.0.10' });
        pageCache = {};
        if (currentPage === 'cloud') { state.cloud.activeTab = 'sub'; loadPage('cloud'); }
      } else if (action === 'destroy') {
        var subName = window._cloudConfirmSubName;
        MockData.cloudAccounts.sub = MockData.cloudAccounts.sub.filter(function (s) { return s.name !== subName; });
        hideModal();
        showMessage('已销毁子账号「' + subName + '」', 'success');
        MockData.auditLogs.unshift({ time: new Date().toLocaleString('zh-CN').replace(/\//g, '/'), operator: '部门负责人', dept: '基础架构部', opType: '云账号', opTypeColor: 'green', target: subName, desc: '销毁子账号', ip: '10.128.0.10' });
        pageCache = {};
        if (currentPage === 'cloud') { state.cloud.activeTab = 'sub'; loadPage('cloud'); }
      } else if (action === 'reset-pwd') {
        var subName = window._cloudConfirmSubName;
        hideModal();
        showMessage('已重置「' + subName + '」的密码，新密码已通过站内信发送给账号归属人', 'success');
        MockData.auditLogs.unshift({ time: new Date().toLocaleString('zh-CN').replace(/\//g, '/'), operator: '部门负责人', dept: '基础架构部', opType: '云账号', opTypeColor: 'green', target: subName, desc: '重置子账号密码', ip: '10.128.0.10' });
      } else {
        hideModal();
      }
    } else if (name === 'role/add-role') {
      var roleName = document.getElementById('modal-role-name');
      if (!roleName || !roleName.value.trim()) {
        showMessage('请输入角色名称', 'warning');
        return;
      }
      var roleType = '业务线级';
      var roleTypeColor = 'orange';
      var roleDesc = document.getElementById('modal-role-desc');
      // 收集权限配置
      var perms = {};
      document.querySelectorAll('.perm-module-group').forEach(function (group) {
        var moduleName = group.getAttribute('data-module');
        var checked = [];
        group.querySelectorAll('.perm-point-checkbox:checked').forEach(function (cb) {
          checked.push(cb.getAttribute('data-point'));
        });
        if (checked.length > 0) perms[moduleName] = checked;
      });
      if (window._editRoleData) {
        // 编辑模式
        var editRole = window._editRoleData;
        editRole.name = roleName.value.trim();
        editRole.type = roleType;
        editRole.typeColor = roleTypeColor;
        editRole.scope = roleDesc ? roleDesc.value.trim() : editRole.scope;
        editRole.permissions = perms;
        window._editRoleData = null;
        hideModal();
        showMessage('角色「' + editRole.name + '」已更新', 'success');
      } else {
        // 创建模式
        var newRole = {
          name: roleName.value.trim(),
          type: roleType,
          typeColor: roleTypeColor,
          scope: roleDesc ? roleDesc.value.trim() : '',
          userCount: 0,
          createTime: new Date().toLocaleString('zh-CN').replace(/\//g, '/'),
          builtin: false,
          superOnly: false,
          users: [],
          permissions: perms
        };
        MockData.roles.push(newRole);
        hideModal();
        showMessage('角色「' + newRole.name + '」创建成功', 'success');
      }
      renderRoleList();
    } else if (name === 'org/confirm-delete') {
      var orgId = window._deleteOrgId;
      var org = MockData.findOrg(orgId);
      if (!org) { hideModal(); return; }
      var label = org.type === 'dept' ? '部门' : '组';
      function removeFromTree(nodes) {
        for (var i = 0; i < nodes.length; i++) {
          if (nodes[i].id === orgId) { nodes.splice(i, 1); return true; }
          if (nodes[i].children && removeFromTree(nodes[i].children)) return true;
        }
        return false;
      }
      removeFromTree(MockData.orgs);
      hideModal();
      showMessage('已删除' + label + '「' + org.name + '」', 'success');
      MockData.auditLogs.unshift({ time: new Date().toLocaleString('zh-CN').replace(/\//g, '/'), operator: org.type === 'dept' ? '管理员' : '张明远', dept: MockData.getParentDept(orgId) || '--', opType: '组织架构', opTypeColor: 'cyan', target: org.name, desc: '删除' + label, ip: '10.128.0.10' });
      state.org.selectedOrgId = MockData.orgs.length > 0 ? MockData.orgs[0].id : '';
      pageCache = {};
      loadPage('org');
    } else if (name === 'org/assign-dept') {
      var sel = document.getElementById('assign-dept-select');
      if (!sel || !sel.value) { showMessage('请选择部门', 'warning'); return; }
      var choice = sel.value;
      var username = window._assignDeptUsername;
      var member = null;
      for (var i = 0; i < MockData.members.length; i++) {
        if (MockData.members[i].username === username) { member = MockData.members[i]; break; }
      }
      if (!member) { hideModal(); return; }
      var targetDept = null;
      for (var j = 0; j < MockData.orgs.length; j++) {
        if (MockData.orgs[j].name === choice) { targetDept = MockData.orgs[j]; break; }
      }
      if (!targetDept) { showMessage('未找到部门「' + choice + '」', 'warning'); return; }
      member.orgId = targetDept.id;
      member.orgName = targetDept.name;
      member.role = '成员';
      hideModal();
      showMessage('已将 ' + member.name + ' 分配到「' + targetDept.name + '」', 'success');
      MockData.auditLogs.unshift({ time: new Date().toLocaleString('zh-CN').replace(/\//g, '/'), operator: '管理员', dept: '--', opType: '组织架构', opTypeColor: 'cyan', target: member.name, desc: '分配到部门「' + targetDept.name + '」', ip: '10.128.0.1' });
      pageCache = {};
      initOrgPage();
    } else if (name === 'org/assign-group') {
      var sel = document.getElementById('assign-group-select');
      if (!sel || !sel.value) { showMessage('请选择组', 'warning'); return; }
      var choice = sel.value;
      var username = window._assignGroupUsername;
      var deptOrg = window._assignGroupDeptOrg;
      var member = null;
      for (var i = 0; i < MockData.members.length; i++) {
        if (MockData.members[i].username === username) { member = MockData.members[i]; break; }
      }
      if (!member) { hideModal(); return; }
      var targetGroup = null;
      for (var j = 0; j < deptOrg.children.length; j++) {
        if (deptOrg.children[j].name === choice) { targetGroup = deptOrg.children[j]; break; }
      }
      if (!targetGroup) { showMessage('未找到组「' + choice + '」', 'warning'); return; }
      member.orgId = targetGroup.id;
      member.orgName = targetGroup.name;
      hideModal();
      showMessage('已将 ' + member.name + ' 归入「' + targetGroup.name + '」', 'success');
      MockData.auditLogs.unshift({ time: new Date().toLocaleString('zh-CN').replace(/\//g, '/'), operator: deptOrg.leader.name, dept: deptOrg.name, opType: '组织架构', opTypeColor: 'cyan', target: member.name, desc: '归组到「' + targetGroup.name + '」', ip: '10.128.0.10' });
      pageCache = {};
      initOrgPage();
    } else if (name === 'org/transfer-group') {
      var sel = document.getElementById('transfer-group-select');
      if (!sel || !sel.value) { showMessage('请选择目标组', 'warning'); return; }
      var targetId = sel.value;
      var username = window._transferGroupUsername;
      var deptOrg = window._transferGroupDeptOrg;
      var member = null;
      for (var i = 0; i < MockData.members.length; i++) {
        if (MockData.members[i].username === username) { member = MockData.members[i]; break; }
      }
      if (!member) { hideModal(); return; }
      var targetGroup = MockData.findOrg(targetId);
      if (!targetGroup) { showMessage('未找到目标组', 'warning'); return; }
      var oldOrgName = member.orgName;
      member.orgId = targetGroup.id;
      member.orgName = targetGroup.name;
      hideModal();
      showMessage('已将 ' + member.name + ' 从「' + oldOrgName + '」调入「' + targetGroup.name + '」', 'success');
      MockData.auditLogs.unshift({ time: new Date().toLocaleString('zh-CN').replace(/\//g, '/'), operator: deptOrg.leader.name, dept: deptOrg.name, opType: '组织架构', opTypeColor: 'cyan', target: member.name, desc: '从「' + oldOrgName + '」调组到「' + targetGroup.name + '」', ip: '10.128.0.10' });
      pageCache = {};
      initOrgPage();
    } else if (name === 'org/remove-member') {
      var username = window._removeMemberUsername;
      var orgType = window._removeMemberOrgType;
      var member = null;
      for (var i = 0; i < MockData.members.length; i++) {
        if (MockData.members[i].username === username) { member = MockData.members[i]; break; }
      }
      if (!member) { hideModal(); return; }
      var oldOrgName = member.orgName;
      if (orgType === 'dept') {
        // 移出部门 → 变为未分配
        member.orgId = 'unassigned';
        member.orgName = '未分配';
        member.role = '待分配';
        hideModal();
        showMessage('已将 ' + member.name + ' 移出部门「' + oldOrgName + '」', 'success');
        MockData.auditLogs.unshift({ time: new Date().toLocaleString('zh-CN').replace(/\//g, '/'), operator: '管理员', dept: oldOrgName, opType: '组织架构', opTypeColor: 'cyan', target: member.name, desc: '移出部门「' + oldOrgName + '」', ip: '10.128.0.1' });
      } else {
        // 移出组 → 回到部门直属
        var parentDeptOrg = null;
        for (var j = 0; j < MockData.orgs.length; j++) {
          var ids = MockData.getOrgAndChildIds(MockData.orgs[j].id);
          if (ids.indexOf(member.orgId) !== -1) { parentDeptOrg = MockData.orgs[j]; break; }
        }
        if (parentDeptOrg) {
          member.orgId = parentDeptOrg.id;
          member.orgName = parentDeptOrg.name;
          member.role = '成员';
        }
        hideModal();
        showMessage('已将 ' + member.name + ' 移出组「' + oldOrgName + '」', 'success');
        MockData.auditLogs.unshift({ time: new Date().toLocaleString('zh-CN').replace(/\//g, '/'), operator: parentDeptOrg ? parentDeptOrg.leader.name : '管理员', dept: parentDeptOrg ? parentDeptOrg.name : '--', opType: '组织架构', opTypeColor: 'cyan', target: member.name, desc: '移出组「' + oldOrgName + '」', ip: '10.128.0.10' });
      }
      pageCache = {};
      initOrgPage();
    } else if (name === 'org/add-member') {
      var sel = document.getElementById('add-member-select');
      if (!sel || !sel.value) { showMessage('请选择成员', 'warning'); return; }
      var username = sel.value;
      var orgId = window._addMemberOrgId;
      var org = MockData.findOrg(orgId);
      var member = null;
      for (var i = 0; i < MockData.members.length; i++) {
        if (MockData.members[i].username === username) { member = MockData.members[i]; break; }
      }
      if (!member || !org) { hideModal(); return; }
      member.orgId = org.id;
      member.orgName = org.name;
      member.role = '成员';
      hideModal();
      showMessage('已将 ' + member.name + ' 添加到「' + org.name + '」', 'success');
      var deptName = org.type === 'dept' ? org.name : (MockData.getParentDept(orgId) || '--');
      var operator = org.type === 'dept' ? '管理员' : (org.leader ? org.leader.name : '管理员');
      MockData.auditLogs.unshift({ time: new Date().toLocaleString('zh-CN').replace(/\//g, '/'), operator: operator, dept: deptName, opType: '组织架构', opTypeColor: 'cyan', target: member.name, desc: '添加到「' + org.name + '」', ip: '10.128.0.10' });
      pageCache = {};
      initOrgPage();
    } else if (name === 'user/create-user') {
      var nameInput = document.getElementById('create-user-name');
      var usernameInput = document.getElementById('create-user-username');
      var phoneInput = document.getElementById('create-user-phone');
      var orgSelect = document.getElementById('create-user-org');
      if (!nameInput || !nameInput.value.trim()) { showMessage('请填写姓名', 'warning'); return; }
      if (!usernameInput || !usernameInput.value.trim()) { showMessage('请填写邮箱前缀', 'warning'); return; }
      if (!orgSelect || !orgSelect.value) { showMessage('请选择所属组织', 'warning'); return; }
      var uname = usernameInput.value.trim();
      // 检查用户名是否已存在
      for (var i = 0; i < MockData.members.length; i++) {
        if (MockData.members[i].username === uname) { showMessage('该邮箱前缀已存在', 'warning'); return; }
      }
      var selectedOrgId = orgSelect.value;
      var selectedOrg = MockData.findOrg(selectedOrgId);
      var orgName = selectedOrg ? selectedOrg.name : '未分配';
      var role = '成员';
      if (!selectedOrg) { selectedOrgId = 'unassigned'; orgName = '未分配'; role = '待分配'; }
      MockData.members.push({
        name: nameInput.value.trim(), username: uname,
        orgId: selectedOrgId, orgName: orgName, role: role,
        joinDate: new Date().toLocaleString('zh-CN').replace(/\//g, '/')
      });
      MockData.users.push({
        username: uname, phone: phoneInput ? phoneInput.value.trim() : '',
        status: '启用',
        createTime: new Date().toLocaleString('zh-CN').replace(/\//g, '/'),
        lastLogin: '--'
      });
      hideModal();
      showMessage('创建用户「' + nameInput.value.trim() + '」成功', 'success');
      MockData.auditLogs.unshift({ time: new Date().toLocaleString('zh-CN').replace(/\//g, '/'), operator: '管理员', dept: orgName, opType: '账号管理', opTypeColor: 'purple', target: nameInput.value.trim(), desc: '创建用户', ip: '10.128.0.1' });
      pageCache = {};
      if (currentPage === 'user') { renderUsers(); initUserPage(); }
    } else if (name === 'user/edit-user') {
      var nameInput = document.getElementById('edit-user-name');
      var phoneInput = document.getElementById('edit-user-phone');
      if (!nameInput || !nameInput.value.trim()) { showMessage('请填写姓名', 'warning'); return; }
      var username = window._editUserUsername;
      var member = null;
      for (var i = 0; i < MockData.members.length; i++) {
        if (MockData.members[i].username === username) { member = MockData.members[i]; break; }
      }
      var u = getUser(username);
      if (member) member.name = nameInput.value.trim();
      if (u && phoneInput) u.phone = phoneInput.value.trim();
      hideModal();
      showMessage('编辑用户「' + nameInput.value.trim() + '」成功', 'success');
      MockData.auditLogs.unshift({ time: new Date().toLocaleString('zh-CN').replace(/\//g, '/'), operator: '管理员', dept: '--', opType: '账号管理', opTypeColor: 'purple', target: nameInput.value.trim(), desc: '编辑用户信息', ip: '10.128.0.1' });
      pageCache = {};
      if (currentPage === 'user') renderUsers();
    } else if (name === 'user/confirm-toggle-user') {
      // 已移除启用/禁用功能
      hideModal();
    } else if (name === 'user/assign-role') {
      var sel = document.getElementById('assign-role-select');
      if (!sel || !sel.value) { showMessage('请选择角色', 'warning'); return; }
      var roleName = sel.value;
      var username = window._assignRoleUsername;
      var member = null;
      for (var i = 0; i < MockData.members.length; i++) {
        if (MockData.members[i].username === username) { member = MockData.members[i]; break; }
      }
      if (!member) { hideModal(); return; }
      // 查找角色并更新 users 列表
      var targetRole = null;
      for (var j = 0; j < MockData.roles.length; j++) {
        if (MockData.roles[j].name === roleName) { targetRole = MockData.roles[j]; break; }
      }
      if (targetRole) {
        if (!targetRole.users) targetRole.users = [];
        // 检查是否已存在
        var exists = false;
        for (var k = 0; k < targetRole.users.length; k++) {
          if (targetRole.users[k].username === username) { exists = true; break; }
        }
        if (!exists) {
          targetRole.users.push({ name: member.name, username: member.username, dept: getMemberDept(member) });
          targetRole.userCount = targetRole.users.length;
        }
      }
      hideModal();
      showMessage('已为「' + member.name + '」分配角色「' + roleName + '」', 'success');
      MockData.auditLogs.unshift({ time: new Date().toLocaleString('zh-CN').replace(/\//g, '/'), operator: '管理员', dept: getMemberDept(member), opType: '权限变更', opTypeColor: 'orange', target: member.name, desc: '分配角色「' + roleName + '」', ip: '10.128.0.1' });
      pageCache = {};
      if (currentPage === 'user') renderUsers();
    } else if (name === 'user/confirm-reset-pwd') {
      var username = window._resetPwdUsername;
      var member = null;
      for (var i = 0; i < MockData.members.length; i++) {
        if (MockData.members[i].username === username) { member = MockData.members[i]; break; }
      }
      hideModal();
      showMessage('已重置用户「' + (member ? member.name : username) + '」的密码', 'success');
      MockData.auditLogs.unshift({ time: new Date().toLocaleString('zh-CN').replace(/\//g, '/'), operator: '管理员', dept: '--', opType: '账号管理', opTypeColor: 'purple', target: member ? member.name : username, desc: '重置密码', ip: '10.128.0.1' });
    } else if (name === 'ticket/create-ticket') {
      var typeSelect = document.getElementById('create-ticket-type');
      var subtypeSelect = document.getElementById('create-ticket-subtype');
      var titleInput = document.getElementById('create-ticket-title');
      var descInput = document.getElementById('create-ticket-desc');
      var resourceInput = document.getElementById('create-ticket-resource');
      if (!typeSelect || !typeSelect.value) { showMessage('请选择工单类型', 'warning'); return; }
      if (!subtypeSelect || !subtypeSelect.value) { showMessage('请选择子类型', 'warning'); return; }
      if (!titleInput || !titleInput.value.trim()) { showMessage('请填写工单标题', 'warning'); return; }
      if (!descInput || !descInput.value.trim()) { showMessage('请填写描述', 'warning'); return; }
      var now = new Date();
      var dateStr = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
      var newId = 'TK-' + dateStr + '-' + String(MockData.tickets.length + 1).padStart(3, '0');
      MockData.tickets.unshift({
        id: newId, title: titleInput.value.trim(), type: typeSelect.value, subType: subtypeSelect.value,
        status: '待处理', statusClass: 'warning', applicant: '当前用户', applicantDept: '基础架构部',
        handler: '--', createTime: now.toLocaleString('zh-CN').replace(/\//g, '/'),
        updateTime: now.toLocaleString('zh-CN').replace(/\//g, '/'),
        relatedResource: resourceInput ? resourceInput.value.trim() : '--',
        desc: descInput.value.trim(),
        timeline: [{ time: now.toLocaleString('zh-CN').replace(/\//g, '/'), action: '创建工单', operator: '当前用户', detail: '提交' + subtypeSelect.value + '申请' }]
      });
      hideModal();
      showMessage('工单 ' + newId + ' 已创建', 'success');
      MockData.auditLogs.unshift({ time: now.toLocaleString('zh-CN').replace(/\//g, '/'), operator: '当前用户', dept: '基础架构部', opType: '工单操作', opTypeColor: 'purple', target: newId, desc: '创建工单: ' + titleInput.value.trim(), ip: '10.128.0.55' });
      pageCache = {};
      if (currentPage === 'ticket') loadPage('ticket');
    } else if (name === 'orphan/assign-group') {
      var deptSelect = document.getElementById('orphan-assign-dept');
      var groupSelect = document.getElementById('orphan-assign-group');
      if (!deptSelect || !deptSelect.value) { showMessage('请选择目标部门', 'warning'); return; }
      if (!groupSelect || !groupSelect.value) { showMessage('请选择目标组', 'warning'); return; }
      var assignData = window._orphanAssignData;
      if (!assignData) { hideModal(); return; }
      var groupOrg = MockData.findOrg(groupSelect.value);
      var groupName = groupOrg ? groupOrg.name : groupSelect.value;
      hideModal();
      showMessage('已将「' + assignData.resource.name + '」分配到「' + groupName + '」', 'success');
      if (assignData.type === 'orphan') {
        MockData.orphanResources.splice(assignData.idx, 1);
      } else {
        MockData.floatResources.splice(assignData.idx, 1);
      }
      MockData.auditLogs.unshift({ time: new Date().toLocaleString('zh-CN').replace(/\//g, '/'), operator: '当前用户', dept: '基础架构部', opType: '资源操作', opTypeColor: 'blue', target: assignData.resource.name, desc: '分配到组「' + groupName + '」', ip: '10.128.0.55' });
      pageCache = {};
      if (currentPage === 'orphan') loadPage('orphan');
    } else if (name === 'ticket/handle-ticket') {
      var remarkInput = document.getElementById('ticket-handle-remark');
      if (!remarkInput || !remarkInput.value.trim()) { showMessage('请输入处理备注', 'warning'); return; }
      var ticket = window._ticketHandleData;
      if (!ticket) { hideModal(); return; }
      ticket.status = '处理中';
      ticket.statusClass = 'processing';
      ticket.handler = '当前用户';
      ticket.updateTime = new Date().toLocaleString('zh-CN').replace(/\//g, '/');
      if (!ticket.timeline) ticket.timeline = [];
      ticket.timeline.push({ time: ticket.updateTime, action: '开始处理', operator: '当前用户', detail: remarkInput.value.trim() });
      hideModal();
      showMessage('已接单处理工单 ' + ticket.id, 'success');
      MockData.auditLogs.unshift({ time: ticket.updateTime, operator: '当前用户', dept: '基础架构部', opType: '工单操作', opTypeColor: 'purple', target: ticket.id, desc: '开始处理工单', ip: '10.128.0.55' });
      pageCache = {};
      if (currentPage === 'ticket') initTicketPage();
    } else if (name === 'project/edit-project') {
      var nameInput = document.getElementById('edit-project-name');
      var deptInput = document.getElementById('edit-project-dept');
      var descInput = document.getElementById('edit-project-desc');
      hideModal();
      showMessage('资源组信息已更新', 'success');
      pageCache = {};
      if (currentPage === 'project') loadPage('project');
    } else if (name === 'res-catalog/add-category') {
      var catName = document.getElementById('catalog-category-name');
      if (catName && catName.value.trim()) {
        MockData.resCatalog.push({ name: catName.value.trim(), color: '#1890ff', types: [] });
        hideModal();
        showMessage('大类「' + catName.value.trim() + '」已创建', 'success');
        renderResCatalog();
      } else {
        showMessage('请填写大类名称', 'warning');
      }
    } else if (name === 'res-catalog/edit-type') {
      var typeName = document.getElementById('catalog-type-name');
      if (!typeName || !typeName.value.trim()) { showMessage('请填写资源类型名称', 'warning'); return; }
      var vendorVal = document.getElementById('catalog-type-vendor').value;
      var queryApiVal = document.getElementById('catalog-type-query-api').value.trim();
      var opsVal = getCatalogOpsCheckboxes();
      var approvalOpsVal = getCatalogApprovalOpsCheckboxes();
      var ci = window._catalogEditCat;
      if (window._catalogEditMode === 'add') {
        MockData.resCatalog[ci].types.push({
          name: typeName.value.trim(), vendor: vendorVal, queryApi: queryApiVal,
          operations: opsVal, approvalOps: approvalOpsVal, children: [], allowApply: true, allowDisplay: true
        });
        hideModal();
        showMessage('资源类型「' + typeName.value.trim() + '」已添加', 'success');
      } else {
        var ti = window._catalogEditType;
        var t = MockData.resCatalog[ci].types[ti];
        t.name = typeName.value.trim();
        t.vendor = vendorVal;
        t.queryApi = queryApiVal;
        t.operations = opsVal;
        t.approvalOps = approvalOpsVal;
        hideModal();
        showMessage('资源类型「' + t.name + '」已更新', 'success');
      }
      renderResCatalog();
    } else if (name === 'res-catalog/edit-child') {
      var childName = document.getElementById('catalog-child-name');
      if (!childName || !childName.value.trim()) { showMessage('请填写子资源名称', 'warning'); return; }
      var childQueryApi = document.getElementById('catalog-child-query-api').value.trim();
      var childOps = [];
      var childOpsGroup = document.getElementById('catalog-child-ops-group');
      if (childOpsGroup) childOpsGroup.querySelectorAll('input[type="checkbox"]:checked').forEach(function (cb) { childOps.push(cb.value); });
      var childApprovalOps = [];
      var childApprovalGroup = document.getElementById('catalog-child-approval-ops-group');
      if (childApprovalGroup) childApprovalGroup.querySelectorAll('input[type="checkbox"]:checked').forEach(function (cb) { childApprovalOps.push(cb.value); });
      var ci = window._catalogEditCat;
      var ti = window._catalogEditType;
      var t = MockData.resCatalog[ci].types[ti];
      if (!t.children) t.children = [];
      if (window._catalogEditMode === 'add-child') {
        t.children.push({
          name: childName.value.trim(), queryApi: childQueryApi,
          operations: childOps, approvalOps: childApprovalOps, allowApply: true, allowDisplay: true
        });
        hideModal();
        showMessage('子资源「' + childName.value.trim() + '」已添加', 'success');
      } else {
        var chi = window._catalogEditChild;
        var child = t.children[chi];
        child.name = childName.value.trim();
        child.queryApi = childQueryApi;
        child.operations = childOps;
        child.approvalOps = childApprovalOps;
        hideModal();
        showMessage('子资源「' + child.name + '」已更新', 'success');
      }
      renderResCatalog();
    } else {
      hideModal();
    }
  }

  // =============================================
  // 资源配置页（平台级）
  // =============================================
  function initResConfigPage() {
    document.querySelectorAll('.res-cfg-tab').forEach(function (tab) {
      tab.onclick = function () {
        state.resConfig.activeTab = tab.getAttribute('data-rescfg-tab');
        state.resConfig.editingTemplate = null;
        document.querySelectorAll('.res-cfg-tab').forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        renderResConfig();
      };
    });
    renderResConfig();
  }

  function renderResConfig() {
    var container = document.getElementById('res-config-content');
    if (!container) return;
    var tab = state.resConfig.activeTab;
    if (state.resConfig.editingTemplate) {
      renderResConfigTemplateEdit(container, state.resConfig.editingTemplate);
    } else if (tab === 'template') {
      renderResConfigTemplates(container);
    } else if (tab === 'flow') {
      renderResConfigFlows(container);
    }
  }

  // 获取支持申请的资源（从资源目录拉取）
  function getApplyResources() {
    var result = [];
    MockData.resCatalog.forEach(function (cat) {
      cat.types.forEach(function (t) {
        if (t.allowApply) {
          var ops = (t.operations || []).filter(function (op) { return op !== '同步'; });
          result.push({ category: cat.name, resType: t.name, operations: ops, children: t.children || [] });
        }
        (t.children || []).forEach(function (child) {
          if (child.allowApply) {
            result.push({ category: cat.name, resType: t.name, subRes: child.name, operations: child.operations || [] });
          }
        });
      });
    });
    return result;
  }

  // ---- 平台级操作模板配置列表 ----
  function renderResConfigTemplates(container) {
    // 从资源目录树同步，展示每类资源的每个操作
    var html = '<div class="ant-alert ant-alert-info" style="margin-bottom:16px;">从资源目录按树状结构同步每类资源及支持的操作。平台统一配置操作模板，定义云上接口对应的表单字段。各部门可在此基础上进行简化定制。</div>';

    MockData.resCatalog.forEach(function (cat, catIdx) {
      // 统计该大类下的模板配置情况
      var totalOps = 0; var configuredOps = 0;
      cat.types.forEach(function (t) {
        if (!t.allowApply) return;
        var ops = (t.operations || []).filter(function (op) { return op !== '同步'; });
        ops.forEach(function (op) {
          totalOps++;
          if (findPlatformTemplate(t.name, op)) configuredOps++;
        });
        (t.children || []).forEach(function (child) {
          if (!child.allowApply) return;
          (child.operations || []).forEach(function (op) {
            totalOps++;
            if (findPlatformTemplate(t.name, op, child.name)) configuredOps++;
          });
        });
      });
      if (totalOps === 0) return;
      var isExpanded = !state.resConfig.tplCollapsed[catIdx];
      html += '<div class="catalog-category-section">';
      html += '<div class="catalog-category-header" data-cat-toggle="resConfigTpl-' + catIdx + '">';
      html += '<div class="catalog-category-left">';
      html += '<span class="catalog-category-arrow' + (isExpanded ? ' expanded' : '') + '">&#8250;</span>';
      html += '<span style="font-weight:500;font-size:14px;color:#1890ff;">' + esc(cat.name) + '</span>';
      html += '<span style="font-weight:normal;font-size:12px;color:var(--text-secondary);margin-left:8px;">' + configuredOps + '/' + totalOps + ' 已配置</span>';
      html += '</div></div>';
      html += '<div class="catalog-category-body' + (isExpanded ? '' : ' collapsed') + '" data-cat-body="resConfigTpl-' + catIdx + '">';
      html += '<table class="ant-table" style="table-layout:fixed;"><thead><tr>';
      html += '<th style="width:20%;">资源类型</th>';
      html += '<th style="width:14%;">操作类型</th>';
      html += '<th style="width:18%;">云上接口</th>';
      html += '<th style="width:10%;">字段数</th>';
      html += '<th style="width:12%;">状态</th>';
      html += '<th style="width:12%;">最后更新</th>';
      html += '<th style="width:14%;">操作</th>';
      html += '</tr></thead><tbody>';

      cat.types.forEach(function (t) {
        if (!t.allowApply) return;
        var ops = (t.operations || []).filter(function (op) { return op !== '同步'; });
        ops.forEach(function (op) {
          var tpl = findPlatformTemplate(t.name, op);
          var fieldCount = 0;
          if (tpl) (tpl.fieldGroups || []).forEach(function (g) { fieldCount += g.fields.length; });
          html += '<tr>';
          html += '<td style="padding-left:28px;">' + esc(t.name) + '</td>';
          html += '<td>' + esc(op) + '</td>';
          html += '<td>' + (tpl ? '<code style="font-size:12px;background:#f5f5f5;padding:2px 6px;border-radius:3px;">' + esc(tpl.apiEndpoint) + '</code>' : '<span style="color:var(--text-secondary);">--</span>') + '</td>';
          html += '<td>' + (tpl ? fieldCount + ' 个' : '--') + '</td>';
          html += '<td>' + (tpl ? '<span class="ant-tag ant-tag-green">已配置</span>' : '<span class="ant-tag ant-tag-default">未配置</span>') + '</td>';
          html += '<td>' + (tpl ? esc(tpl.updateTime) : '--') + '</td>';
          html += '<td>';
          if (tpl) {
            html += '<a class="ant-btn-link rescfg-edit-tpl" data-tpl-id="' + esc(tpl.id) + '">编辑</a> <a class="ant-btn-link rescfg-preview-tpl" data-tpl-id="' + esc(tpl.id) + '">预览</a>';
          } else {
            html += '<a class="ant-btn-link rescfg-create-tpl" data-res="' + esc(t.name) + '" data-op="' + esc(op) + '" data-cat="' + esc(cat.name) + '">配置</a>';
          }
          html += '</td></tr>';
        });
        // 子资源
        (t.children || []).forEach(function (child) {
          if (!child.allowApply) return;
          (child.operations || []).forEach(function (op) {
            var tpl = findPlatformTemplate(t.name, op, child.name);
            var fieldCount = 0;
            if (tpl) (tpl.fieldGroups || []).forEach(function (g) { fieldCount += g.fields.length; });
            html += '<tr>';
            html += '<td style="padding-left:44px;color:var(--text-secondary);">└─ ' + esc(child.name) + '</td>';
            html += '<td>' + esc(op) + '</td>';
            html += '<td>' + (tpl ? '<code style="font-size:12px;background:#f5f5f5;padding:2px 6px;border-radius:3px;">' + esc(tpl.apiEndpoint) + '</code>' : '<span style="color:var(--text-secondary);">--</span>') + '</td>';
            html += '<td>' + (tpl ? fieldCount + ' 个' : '--') + '</td>';
            html += '<td>' + (tpl ? '<span class="ant-tag ant-tag-green">已配置</span>' : '<span class="ant-tag ant-tag-default">未配置</span>') + '</td>';
            html += '<td>' + (tpl ? esc(tpl.updateTime) : '--') + '</td>';
            html += '<td>';
            if (tpl) {
              html += '<a class="ant-btn-link rescfg-edit-tpl" data-tpl-id="' + esc(tpl.id) + '">编辑</a> <a class="ant-btn-link rescfg-preview-tpl" data-tpl-id="' + esc(tpl.id) + '">预览</a>';
            } else {
              html += '<a class="ant-btn-link rescfg-create-tpl" data-res="' + esc(t.name) + '" data-op="' + esc(op) + '" data-sub="' + esc(child.name) + '" data-cat="' + esc(cat.name) + '">配置</a>';
            }
            html += '</td></tr>';
          });
        });
      });
      html += '</tbody></table>';
      html += '</div></div>'; // close catalog-category-body and catalog-category-section
    });
    container.innerHTML = html;

    // 绑定大类折叠/展开
    container.querySelectorAll('.catalog-category-header').forEach(function (header) {
      header.onclick = function () {
        var key = header.getAttribute('data-cat-toggle');
        var catIdx = parseInt(key.replace('resConfigTpl-', ''));
        var body = container.querySelector('[data-cat-body="' + key + '"]');
        var arrow = header.querySelector('.catalog-category-arrow');
        if (body.classList.contains('collapsed')) {
          body.classList.remove('collapsed');
          arrow.classList.add('expanded');
          delete state.resConfig.tplCollapsed[catIdx];
        } else {
          body.classList.add('collapsed');
          arrow.classList.remove('expanded');
          state.resConfig.tplCollapsed[catIdx] = true;
        }
      };
    });

    // 编辑按钮
    container.querySelectorAll('.rescfg-edit-tpl').forEach(function (btn) {
      btn.onclick = function () {
        var tplId = btn.getAttribute('data-tpl-id');
        var tpl = null;
        for (var i = 0; i < MockData.platformTemplates.length; i++) {
          if (MockData.platformTemplates[i].id === tplId) { tpl = MockData.platformTemplates[i]; break; }
        }
        if (tpl) {
          state.resConfig.editingTemplate = tpl;
          renderResConfig();
        }
      };
    });
    // 预览按钮
    container.querySelectorAll('.rescfg-preview-tpl').forEach(function (btn) {
      btn.onclick = function () {
        var tplId = btn.getAttribute('data-tpl-id');
        var tpl = null;
        for (var i = 0; i < MockData.platformTemplates.length; i++) {
          if (MockData.platformTemplates[i].id === tplId) { tpl = MockData.platformTemplates[i]; break; }
        }
        if (tpl) showTemplatePreview(tpl);
      };
    });
    // 配置（新建）按钮
    container.querySelectorAll('.rescfg-create-tpl').forEach(function (btn) {
      btn.onclick = function () {
        var resType = btn.getAttribute('data-res');
        var opType = btn.getAttribute('data-op');
        var subRes = btn.getAttribute('data-sub') || '';
        var category = btn.getAttribute('data-cat');
        var displayName = subRes ? resType + ' / ' + subRes : resType;
        var newTpl = {
          id: 'ptpl-new-' + Date.now(), templateName: '', resType: subRes || resType, category: category, opType: opType,
          apiEndpoint: '', updateTime: new Date().toLocaleDateString('zh-CN').replace(/\//g, '/'),
          fieldGroups: [{ groupName: '基础配置', fields: [] }]
        };
        MockData.platformTemplates.push(newTpl);
        state.resConfig.editingTemplate = newTpl;
        renderResConfig();
      };
    });
  }

  // 查找平台模板
  function findPlatformTemplate(resType, opType, subRes) {
    for (var i = 0; i < MockData.platformTemplates.length; i++) {
      var tpl = MockData.platformTemplates[i];
      if (subRes) {
        if (tpl.resType === subRes && tpl.opType === opType) return tpl;
      } else {
        if (tpl.resType === resType && tpl.opType === opType) return tpl;
      }
    }
    return null;
  }

  // ---- 平台级操作模板编辑页 ----
  function renderResConfigTemplateEdit(container, tpl) {
    var html = '<div style="margin-bottom:16px;">';
    html += '<a class="ant-btn-link rescfg-back-btn" style="font-size:14px;">&larr; 返回模板列表</a>';
    html += '</div>';
    html += '<div class="ant-card"><div class="ant-card-head"><span>编辑操作模板 - ' + esc(tpl.resType) + ' / ' + esc(tpl.opType) + '</span></div>';
    html += '<div class="ant-card-body">';
    html += '<div class="ant-alert ant-alert-info" style="margin-bottom:16px;"><b>字段约束说明：</b>① 必填（required）字段若设为不可见（visible=false），则只能是 <code>fixed</code> 类型；② <code>fixed</code> 类型字段必须在"字段设置"中填写固定值。</div>';
    // 基本信息
    html += '<div style="display:flex;gap:32px;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid #f0f0f0;flex-wrap:wrap;">';
    html += '<div class="ant-form-item" style="flex:1;min-width:200px;margin-bottom:0;"><div class="ant-form-label">模板名称</div><div class="ant-form-control"><input class="ant-input tpl-template-name" value="' + esc(tpl.templateName || '') + '" placeholder="请输入模板名称" style="height:32px;" /></div></div>';
    html += '<div class="ant-form-item" style="flex:1;min-width:200px;margin-bottom:0;"><div class="ant-form-label">资源类型</div><div class="ant-form-control"><span class="ant-tag ant-tag-blue">' + esc(tpl.category) + ' / ' + esc(tpl.resType) + '</span></div></div>';
    html += '<div class="ant-form-item" style="flex:1;min-width:200px;margin-bottom:0;"><div class="ant-form-label">操作类型</div><div class="ant-form-control"><span class="ant-tag ant-tag-cyan">' + esc(tpl.opType) + '</span></div></div>';
    html += '<div class="ant-form-item" style="flex:1;min-width:200px;margin-bottom:0;"><div class="ant-form-label">云上接口</div><div class="ant-form-control"><input class="ant-input tpl-api-endpoint" value="' + esc(tpl.apiEndpoint) + '" placeholder="请输入云上接口" style="height:32px;font-family:monospace;font-size:13px;" /></div></div>';
    html += '</div>';

    // 字段分组
    var groupCount = (tpl.fieldGroups || []).length;
    (tpl.fieldGroups || []).forEach(function (group, gIdx) {
      html += '<div class="tpl-field-group" style="margin-bottom:20px;border:1px solid #f0f0f0;border-radius:6px;">';
      html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 16px;background:#fafafa;border-bottom:1px solid #f0f0f0;border-radius:6px 6px 0 0;">';
      html += '<div style="font-weight:500;">&#128193; <input class="ant-input tpl-group-name-input" data-gidx="' + gIdx + '" value="' + esc(group.groupName) + '" style="width:180px;height:28px;margin-left:4px;" /></div>';
      html += '<div>';
      html += '<a class="ant-btn-link tpl-move-group-up" data-gidx="' + gIdx + '"' + (gIdx === 0 ? ' style="color:var(--text-secondary);cursor:not-allowed;"' : '') + '>上移分组</a> ';
      html += '<a class="ant-btn-link tpl-move-group-down" data-gidx="' + gIdx + '"' + (gIdx === groupCount - 1 ? ' style="color:var(--text-secondary);cursor:not-allowed;"' : '') + '>下移分组</a> ';
      html += '<a class="ant-btn-link tpl-add-field-btn" data-gidx="' + gIdx + '" style="margin-left:12px;">+ 添加字段</a> ';
      html += '<a class="ant-btn-link tpl-del-group-btn" data-gidx="' + gIdx + '" style="color:#ff4d4f;margin-left:8px;">删除分组</a></div>';
      html += '</div>';
      html += '<table class="ant-table" style="margin:0;"><thead><tr>';
      html += '<th style="width:14%;min-width:100px;">字段名称</th>';
      html += '<th style="width:14%;min-width:100px;">参数名</th>';
      html += '<th style="width:8%;min-width:70px;">必填</th>';
      html += '<th style="width:8%;min-width:70px;">可见</th>';
      html += '<th style="width:10%;min-width:90px;">参数类型</th>';
      html += '<th style="width:28%;min-width:200px;">补充配置</th>';
      html += '<th style="width:18%;min-width:120px;">操作</th>';
      html += '</tr></thead><tbody>';
      group.fields.forEach(function (field, fIdx) {
        // 检测约束违规：必填不可见必须是fixed；fixed必须有固定值
        var hasRequiredVisibleError = field.required && field.visible === false && field.type !== 'fixed';
        var hasFixedNoValueError = field.type === 'fixed' && !field.fixedValue;
        var rowStyle = (hasRequiredVisibleError || hasFixedNoValueError) ? ' style="background:#fff2f0;"' : '';
        html += '<tr' + rowStyle + '>';
        html += '<td><input class="ant-input tpl-field-name" data-gidx="' + gIdx + '" data-fidx="' + fIdx + '" value="' + esc(field.name) + '" style="height:28px;" /></td>';
        html += '<td><input class="ant-input tpl-field-param" data-gidx="' + gIdx + '" data-fidx="' + fIdx + '" value="' + esc(field.param) + '" style="height:28px;font-family:monospace;font-size:12px;" /></td>';
        // 必填列（在参数类型之前）
        html += '<td style="text-align:center;"><label class="toggle-switch"><input type="checkbox" class="tpl-field-required" data-gidx="' + gIdx + '" data-fidx="' + fIdx + '"' + (field.required ? ' checked' : '') + ' /><span class="toggle-slider"></span></label></td>';
        // 可见列
        html += '<td style="text-align:center;"><label class="toggle-switch"><input type="checkbox" class="tpl-field-visible" data-gidx="' + gIdx + '" data-fidx="' + fIdx + '"' + (field.visible ? ' checked' : '') + ' /><span class="toggle-slider"></span></label></td>';
        // 参数类型列：必填且不可见时仅允许 fixed
        var forceFixed = field.required && field.visible === false;
        html += '<td><select class="ant-select tpl-field-type" data-gidx="' + gIdx + '" data-fidx="' + fIdx + '" style="width:100%;">';
        ['string', 'number', 'select', 'textarea', 'fixed'].forEach(function (t) {
          if (forceFixed && t !== 'fixed') {
            html += '<option value="' + t + '" disabled style="color:#ccc;">' + t + '</option>';
          } else {
            html += '<option value="' + t + '"' + (field.type === t ? ' selected' : '') + '>' + t + '</option>';
          }
        });
        html += '</select></td>';
        // 补充配置列 - 显示摘要 + 设置按钮
        html += '<td style="vertical-align:middle;">';
        var summaryHtml = '';
        if (field.type === 'select') {
          var refCount = (field.referenceOptions || '').split(',').filter(function (o) { return o.trim(); }).length;
          summaryHtml = refCount > 0
            ? '<span style="color:#595959;">参考 ' + refCount + ' 个选项</span>'
            : '<span style="color:#bfbfbf;font-size:12px;">无参考选项</span>';
        } else if (field.type === 'string') {
          summaryHtml = '<span style="color:#bfbfbf;font-size:12px;">正则在部门配置</span>';
        } else if (field.type === 'number') {
          var np = [];
          if (field.min != null && field.min !== '') np.push('≥' + field.min);
          if (field.max != null && field.max !== '') np.push('≤' + field.max);
          summaryHtml = np.length ? '<span style="font-size:12px;">' + np.join(' ') + '</span>' : '<span style="color:#999;font-size:12px;">无限制</span>';
        } else if (field.type === 'fixed') {
          summaryHtml = field.fixedValue ? '<code style="font-size:11px;background:#f5f5f5;padding:1px 4px;">' + esc(field.fixedValue) + '</code>' : '<span style="color:#999;font-size:12px;">未设置</span>';
        } else {
          summaryHtml = '<span style="color:#999;font-size:12px;">--</span>';
        }
        html += '<div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">';
        html += summaryHtml;
        html += '<button class="ant-btn ant-btn-sm tpl-field-settings-btn" data-gidx="' + gIdx + '" data-fidx="' + fIdx + '" style="padding:0 8px;height:24px;font-size:12px;flex-shrink:0;">&#9881;</button>';
        html += '</div>';
        html += '</td>';
        html += '<td><a class="ant-btn-link tpl-move-field-up" data-gidx="' + gIdx + '" data-fidx="' + fIdx + '"' + (fIdx === 0 ? ' style="color:var(--text-secondary);cursor:not-allowed;"' : '') + '>上移</a> ';
        html += '<a class="ant-btn-link tpl-move-field-down" data-gidx="' + gIdx + '" data-fidx="' + fIdx + '"' + (fIdx === group.fields.length - 1 ? ' style="color:var(--text-secondary);cursor:not-allowed;"' : '') + '>下移</a> ';
        html += '<a class="ant-btn-link tpl-del-field-btn" data-gidx="' + gIdx + '" data-fidx="' + fIdx + '" style="color:#ff4d4f;">删除</a></td>';
        html += '</tr>';
      });
      if (group.fields.length === 0) {
        html += '<tr><td colspan="7" style="text-align:center;color:var(--text-secondary);padding:16px;">暂无字段，点击上方"添加字段"</td></tr>';
      }
      html += '</tbody></table></div>';
    });

    html += '<div style="margin-top:12px;margin-bottom:20px;"><button class="ant-btn tpl-add-group-btn">+ 添加字段分组</button></div>';

    // 操作按钮
    html += '<div style="padding-top:16px;border-top:1px solid #f0f0f0;display:flex;gap:12px;">';
    html += '<button class="ant-btn ant-btn-primary rescfg-save-tpl">保存模板</button>';
    html += '<button class="ant-btn rescfg-preview-from-edit">预览表单</button>';
    html += '<button class="ant-btn rescfg-back-btn">取消</button>';
    html += '</div>';
    html += '</div></div>';
    container.innerHTML = html;

    // 绑定返回
    container.querySelectorAll('.rescfg-back-btn').forEach(function (btn) {
      btn.onclick = function () { state.resConfig.editingTemplate = null; renderResConfig(); };
    });

    // 绑定保存
    var saveBtn = container.querySelector('.rescfg-save-tpl');
    if (saveBtn) {
      saveBtn.onclick = function () {
        syncTemplateInputs(container, tpl);
        // 校验：fixed类型必须填写固定值；必填但不可见的字段只能是fixed类型
        var errors = [];
        (tpl.fieldGroups || []).forEach(function (group) {
          group.fields.forEach(function (field) {
            if (field.type === 'fixed' && !field.fixedValue) {
              errors.push('字段「' + (field.name || field.param) + '」为 fixed 类型，必须在字段设置中填写固定值');
            }
            if (field.required && field.visible === false && field.type !== 'fixed') {
              errors.push('字段「' + (field.name || field.param) + '」设为必填但不可见，只能使用 fixed 类型（当前类型：' + field.type + '）');
            }
          });
        });
        if (errors.length) {
          showMessage(errors[0], 'error');
          return;
        }
        showMessage('模板「' + tpl.resType + ' / ' + tpl.opType + '」已保存', 'success');
      };
    }

    // 预览
    var previewBtn = container.querySelector('.rescfg-preview-from-edit');
    if (previewBtn) {
      previewBtn.onclick = function () {
        syncTemplateInputs(container, tpl);
        showTemplatePreview(tpl);
      };
    }

    // 添加字段分组
    var addGroupBtn = container.querySelector('.tpl-add-group-btn');
    if (addGroupBtn) {
      addGroupBtn.onclick = function () {
        syncTemplateInputs(container, tpl);
        tpl.fieldGroups.push({ groupName: '新分组', fields: [] });
        renderResConfigTemplateEdit(container, tpl);
      };
    }

    // 删除分组
    container.querySelectorAll('.tpl-del-group-btn').forEach(function (btn) {
      btn.onclick = function () {
        var gIdx = parseInt(btn.getAttribute('data-gidx'));
        syncTemplateInputs(container, tpl);
        tpl.fieldGroups.splice(gIdx, 1);
        renderResConfigTemplateEdit(container, tpl);
      };
    });

    // 上移分组
    container.querySelectorAll('.tpl-move-group-up').forEach(function (btn) {
      btn.onclick = function () {
        var gIdx = parseInt(btn.getAttribute('data-gidx'));
        if (gIdx === 0) return;
        syncTemplateInputs(container, tpl);
        var tmp = tpl.fieldGroups[gIdx]; tpl.fieldGroups[gIdx] = tpl.fieldGroups[gIdx - 1]; tpl.fieldGroups[gIdx - 1] = tmp;
        renderResConfigTemplateEdit(container, tpl);
      };
    });

    // 下移分组
    container.querySelectorAll('.tpl-move-group-down').forEach(function (btn) {
      btn.onclick = function () {
        var gIdx = parseInt(btn.getAttribute('data-gidx'));
        if (gIdx >= tpl.fieldGroups.length - 1) return;
        syncTemplateInputs(container, tpl);
        var tmp = tpl.fieldGroups[gIdx]; tpl.fieldGroups[gIdx] = tpl.fieldGroups[gIdx + 1]; tpl.fieldGroups[gIdx + 1] = tmp;
        renderResConfigTemplateEdit(container, tpl);
      };
    });

    // 添加字段
    container.querySelectorAll('.tpl-add-field-btn').forEach(function (btn) {
      btn.onclick = function () {
        var gIdx = parseInt(btn.getAttribute('data-gidx'));
        syncTemplateInputs(container, tpl);
        tpl.fieldGroups[gIdx].fields.push({ name: '', param: '', type: 'string', visible: true, required: false, regex: '' });
        renderResConfigTemplateEdit(container, tpl);
      };
    });

    // 删除字段
    container.querySelectorAll('.tpl-del-field-btn').forEach(function (btn) {
      btn.onclick = function () {
        var gIdx = parseInt(btn.getAttribute('data-gidx'));
        var fIdx = parseInt(btn.getAttribute('data-fidx'));
        syncTemplateInputs(container, tpl);
        tpl.fieldGroups[gIdx].fields.splice(fIdx, 1);
        renderResConfigTemplateEdit(container, tpl);
      };
    });

    // 上移字段
    container.querySelectorAll('.tpl-move-field-up').forEach(function (btn) {
      btn.onclick = function () {
        var gIdx = parseInt(btn.getAttribute('data-gidx'));
        var fIdx = parseInt(btn.getAttribute('data-fidx'));
        if (fIdx === 0) return;
        syncTemplateInputs(container, tpl);
        var fields = tpl.fieldGroups[gIdx].fields;
        var tmp = fields[fIdx]; fields[fIdx] = fields[fIdx - 1]; fields[fIdx - 1] = tmp;
        renderResConfigTemplateEdit(container, tpl);
      };
    });

    // 下移字段
    container.querySelectorAll('.tpl-move-field-down').forEach(function (btn) {
      btn.onclick = function () {
        var gIdx = parseInt(btn.getAttribute('data-gidx'));
        var fIdx = parseInt(btn.getAttribute('data-fidx'));
        var fields = tpl.fieldGroups[gIdx].fields;
        if (fIdx >= fields.length - 1) return;
        syncTemplateInputs(container, tpl);
        var tmp = fields[fIdx]; fields[fIdx] = fields[fIdx + 1]; fields[fIdx + 1] = tmp;
        renderResConfigTemplateEdit(container, tpl);
      };
    });

    // 字段类型切换时刷新页面以更新补充配置列
    container.querySelectorAll('.tpl-field-type').forEach(function (sel) {
      sel.onchange = function () {
        syncTemplateInputs(container, tpl);
        renderResConfigTemplateEdit(container, tpl);
      };
    });

    // 字段设置按钮
    container.querySelectorAll('.tpl-field-settings-btn').forEach(function (btn) {
      btn.onclick = function () {
        var gIdx = parseInt(btn.getAttribute('data-gidx'));
        var fIdx = parseInt(btn.getAttribute('data-fidx'));
        syncTemplateInputs(container, tpl);
        showFieldSettingsModal(tpl, gIdx, fIdx, container);
      };
    });
  }

  // 同步编辑页输入到模板数据
  function syncTemplateInputs(container, tpl) {
    // 模板名称
    var tplNameInput = container.querySelector('.tpl-template-name');
    if (tplNameInput) tpl.templateName = tplNameInput.value.trim();
    // 云上接口
    var apiInput = container.querySelector('.tpl-api-endpoint');
    if (apiInput) tpl.apiEndpoint = apiInput.value.trim();
    // 分组名称
    container.querySelectorAll('.tpl-group-name-input').forEach(function (input) {
      var gIdx = parseInt(input.getAttribute('data-gidx'));
      if (tpl.fieldGroups[gIdx]) tpl.fieldGroups[gIdx].groupName = input.value.trim() || '未命名分组';
    });
    container.querySelectorAll('.tpl-field-name').forEach(function (input) {
      var gIdx = parseInt(input.getAttribute('data-gidx'));
      var fIdx = parseInt(input.getAttribute('data-fidx'));
      if (tpl.fieldGroups[gIdx] && tpl.fieldGroups[gIdx].fields[fIdx]) tpl.fieldGroups[gIdx].fields[fIdx].name = input.value;
    });
    container.querySelectorAll('.tpl-field-param').forEach(function (input) {
      var gIdx = parseInt(input.getAttribute('data-gidx'));
      var fIdx = parseInt(input.getAttribute('data-fidx'));
      if (tpl.fieldGroups[gIdx] && tpl.fieldGroups[gIdx].fields[fIdx]) tpl.fieldGroups[gIdx].fields[fIdx].param = input.value;
    });
    container.querySelectorAll('.tpl-field-type').forEach(function (sel) {
      var gIdx = parseInt(sel.getAttribute('data-gidx'));
      var fIdx = parseInt(sel.getAttribute('data-fidx'));
      if (tpl.fieldGroups[gIdx] && tpl.fieldGroups[gIdx].fields[fIdx]) tpl.fieldGroups[gIdx].fields[fIdx].type = sel.value;
    });
    container.querySelectorAll('.tpl-field-visible').forEach(function (cb) {
      var gIdx = parseInt(cb.getAttribute('data-gidx'));
      var fIdx = parseInt(cb.getAttribute('data-fidx'));
      if (tpl.fieldGroups[gIdx] && tpl.fieldGroups[gIdx].fields[fIdx]) tpl.fieldGroups[gIdx].fields[fIdx].visible = cb.checked;
    });
    // 是否必填
    container.querySelectorAll('.tpl-field-required').forEach(function (cb) {
      var gIdx = parseInt(cb.getAttribute('data-gidx'));
      var fIdx = parseInt(cb.getAttribute('data-fidx'));
      if (tpl.fieldGroups[gIdx] && tpl.fieldGroups[gIdx].fields[fIdx]) tpl.fieldGroups[gIdx].fields[fIdx].required = cb.checked;
    });
  }

  // ---- 字段设置弹窗 ----
  function showFieldSettingsModal(tpl, gIdx, fIdx, editContainer) {
    var field = tpl.fieldGroups[gIdx].fields[fIdx];
    var group = tpl.fieldGroups[gIdx];
    var typeLabels = { string: '文本', number: '数字', select: '下拉选择', textarea: '多行文本', fixed: '固定值' };
    var otherSelects = group.fields.filter(function (f, fi) { return fi !== fIdx && f.type === 'select' && f.param; });

    var html = '<div class="ant-modal-overlay" style="display:flex;">';
    html += '<div class="ant-modal" style="width:620px;max-height:88vh;overflow-y:auto;">';
    html += '<div class="ant-modal-header">字段设置 <span style="font-size:13px;color:var(--text-secondary);margin-left:8px;">· ' + esc(field.name || '未命名') + ' (' + esc(typeLabels[field.type] || field.type) + ')</span><button class="ant-modal-close" onclick="hideModal()">&times;</button></div>';
    html += '<div class="ant-modal-body">';

    if (field.type === 'select') {
      // 平台层只配置参考选项（可选），实际选项和级联由部门配置
      html += '<div class="ant-form-item">';
      html += '<div class="ant-form-label">参考选项</div>';
      html += '<div class="ant-form-control">';
      html += '<div id="fset-options-list" style="margin-bottom:6px;"></div>';
      html += '<button type="button" class="ant-btn ant-btn-dashed" id="fset-add-option" style="display:flex;width:100%;border-style:dashed;justify-content:center;">+ 添加参考选项</button>';
      html += '<div class="ant-form-extra" style="margin-top:4px;">可选填。为各部门提供初始参考，部门负责人可在此基础上增删调整；不填则部门从零配置。</div>';
      html += '</div></div>';

    } else if (field.type === 'string') {
      html += '<div style="color:var(--text-secondary);padding:12px 0;font-size:13px;">&#8505; 文本字段的正则校验规则由各部门在部门配置中自行设置，平台层无需配置。</div>';

    } else if (field.type === 'number') {
      html += '<div style="display:flex;gap:16px;">';
      html += '<div class="ant-form-item" style="flex:1;"><div class="ant-form-label">最小值</div><div class="ant-form-control"><input class="ant-input" id="fset-min" type="number" value="' + (field.min != null ? field.min : '') + '" placeholder="不限" /></div></div>';
      html += '<div class="ant-form-item" style="flex:1;"><div class="ant-form-label">最大值</div><div class="ant-form-control"><input class="ant-input" id="fset-max" type="number" value="' + (field.max != null ? field.max : '') + '" placeholder="不限" /></div></div>';
      html += '<div class="ant-form-item" style="flex:0 0 100px;"><div class="ant-form-label">小数位数</div><div class="ant-form-control"><input class="ant-input" id="fset-decimals" type="number" value="' + (field.decimals != null ? field.decimals : '') + '" placeholder="0" min="0" max="10" /></div></div>';
      html += '</div>';

    } else if (field.type === 'fixed') {
      html += '<div class="ant-form-item">';
      html += '<div class="ant-form-label">固定值</div>';
      html += '<div class="ant-form-control">';
      html += '<input class="ant-input" id="fset-fixedvalue" value="' + esc(field.fixedValue || '') + '" placeholder="该字段在表单中显示为只读固定值，会直接传递给接口" />';
      html += '<div class="ant-form-extra">用于传递固定参数，用户不可修改</div>';
      html += '</div></div>';

    } else {
      html += '<div style="color:var(--text-secondary);padding:16px 0;">该字段类型暂无额外配置</div>';
    }

    html += '</div>'; // /modal-body
    html += '<div class="ant-modal-footer">';
    html += '<button class="ant-btn" onclick="hideModal()">取消</button>';
    html += '<button class="ant-btn ant-btn-primary" id="fset-save-btn">保存</button>';
    html += '</div>';
    html += '</div></div>';

    var mc = document.getElementById('modal-container');
    mc.innerHTML = html;
    var overlay = mc.querySelector('.ant-modal-overlay');
    if (overlay) overlay.onclick = function (e) { if (e.target === overlay) hideModal(); };

    // ---- 动态表单：参考选项列表（仅 select 类型） ----
    if (field.type === 'select') {
      var optsList = document.getElementById('fset-options-list');
      var addOptBtn = document.getElementById('fset-add-option');

      function createOptionRow(label, value) {
        var row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:6px;';
        var lIn = document.createElement('input');
        lIn.className = 'ant-input fset-opt-label';
        lIn.value = label;
        lIn.placeholder = '展示名';
        lIn.style.cssText = 'flex:1;min-width:0;max-width:none;';
        var eq = document.createElement('span');
        eq.textContent = '=';
        eq.style.cssText = 'color:#bbb;flex-shrink:0;font-size:14px;';
        var vIn = document.createElement('input');
        vIn.className = 'ant-input fset-opt-value';
        vIn.value = value;
        vIn.placeholder = '实际值';
        vIn.style.cssText = 'flex:1;min-width:0;max-width:none;';
        var delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.textContent = '×';
        delBtn.style.cssText = 'flex-shrink:0;width:28px;height:28px;border:1px solid #ffccc7;border-radius:3px;background:#fff2f0;color:#ff4d4f;cursor:pointer;font-size:16px;line-height:1;padding:0;';
        delBtn.onclick = function () { optsList.removeChild(row); };
        row.appendChild(lIn); row.appendChild(eq); row.appendChild(vIn); row.appendChild(delBtn);
        return row;
      }

      // 填充已有参考选项
      (field.referenceOptions || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean).forEach(function (opt) {
        var eqIdx = opt.indexOf('=');
        var lbl = eqIdx > 0 ? opt.slice(0, eqIdx).trim() : opt;
        var val = eqIdx > 0 ? opt.slice(eqIdx + 1).trim() : opt;
        optsList.appendChild(createOptionRow(lbl, val));
      });

      addOptBtn.onclick = function () { optsList.appendChild(createOptionRow('', '')); };
    }

    // 保存
    document.getElementById('fset-save-btn').onclick = function () {
      if (field.type === 'select') {
        var optsList2 = document.getElementById('fset-options-list');
        var opts = [];
        Array.prototype.forEach.call(optsList2.children, function (row) {
          var lIn = row.querySelector('.fset-opt-label');
          var vIn = row.querySelector('.fset-opt-value');
          if (lIn && vIn) {
            var l = lIn.value.trim(), v = vIn.value.trim();
            if (l || v) opts.push((l || v) + '=' + (v || l));
          }
        });
        field.referenceOptions = opts.join(',');
      } else if (field.type === 'number') {
        var minV = (document.getElementById('fset-min') || {}).value;
        var maxV = (document.getElementById('fset-max') || {}).value;
        var decV = (document.getElementById('fset-decimals') || {}).value;
        field.min = minV !== '' && minV != null ? Number(minV) : null;
        field.max = maxV !== '' && maxV != null ? Number(maxV) : null;
        field.decimals = decV !== '' && decV != null ? Number(decV) : null;
      } else if (field.type === 'fixed') {
        field.fixedValue = ((document.getElementById('fset-fixedvalue') || {}).value || '').trim();
      }
      hideModal();
      renderResConfigTemplateEdit(editContainer, tpl);
    };
  }

  // ---- 渲染模板表单字段（公共方法，用于预览和申请表单） ----
  function renderTemplateFormFields(tpl, options) {
    var disabled = options && options.disabled;
    var html = '';
    (tpl.fieldGroups || []).forEach(function (group) {
      html += '<div style="font-weight:500;font-size:14px;color:#1890ff;margin:16px 0 10px;padding-bottom:6px;border-bottom:1px solid #f0f0f0;">&#128193; ' + esc(group.groupName) + '</div>';
      group.fields.forEach(function (field) {
        if (!field.visible) return;
        html += '<div class="ant-form-item"><div class="ant-form-label">' + (field.required ? '<span class="required">*</span>' : '') + esc(field.name) + '</div>';
        html += '<div class="ant-form-control">';
        if (field.type === 'fixed') {
          html += '<input class="ant-input" value="' + esc(field.fixedValue || '') + '" disabled style="max-width:360px;background:#f5f5f5;" />';
          html += '<div class="ant-form-extra" style="font-size:11px;color:#999;">固定值（不可修改）</div>';
        } else if (field.type === 'select') {
          var opts = (field.options || '').split(',').filter(function (o) { return o.trim(); });
          var cascadeAttrs = ' data-param="' + esc(field.param) + '"';
          if (field.cascadeFrom) {
            cascadeAttrs += ' data-cascade-from="' + esc(field.cascadeFrom) + '"';
            if (field.cascadeData) cascadeAttrs += ' data-cascade-data="' + esc(field.cascadeData) + '"';
          }
          var cascadeHint = field.cascadeFrom ? '<div class="ant-form-extra" style="font-size:11px;color:#999;">&#8631; 级联依赖字段: ' + esc(field.cascadeFrom) + '（选择后自动筛选）</div>' : '';
          html += '<select class="ant-select tpl-cascade-child" style="width:100%;max-width:360px;"' + cascadeAttrs + (disabled ? ' disabled' : '') + '>';
          html += '<option value="">请选择' + esc(field.name) + '</option>';
          opts.forEach(function (opt) {
            opt = opt.trim();
            // 支持 "展示名=实际值" 格式
            var eqIdx = opt.indexOf('=');
            var label, value;
            if (eqIdx > 0) {
              label = opt.substring(0, eqIdx).trim();
              value = opt.substring(eqIdx + 1).trim();
            } else {
              label = opt;
              value = opt;
            }
            html += '<option value="' + esc(value) + '"' + (field.defaultValue === value ? ' selected' : '') + '>' + esc(label) + '</option>';
          });
          if (opts.length === 0) {
            html += '<option>请选择' + esc(field.name) + '</option>';
          }
          html += '</select>' + cascadeHint;
        } else if (field.type === 'textarea') {
          html += '<textarea class="ant-textarea"' + (disabled ? ' disabled' : '') + ' placeholder="请输入' + esc(field.name) + '">' + esc(field.defaultValue || '') + '</textarea>';
        } else if (field.type === 'number') {
          html += '<input class="ant-input" type="number"' + (disabled ? ' disabled' : '') + ' value="' + esc(field.defaultValue || '') + '" placeholder="请输入' + esc(field.name) + '"';
          if (field.min != null) html += ' min="' + field.min + '"';
          if (field.max != null) html += ' max="' + field.max + '"';
          html += ' style="max-width:200px;" />';
          var hints = [];
          if (field.min != null) hints.push('最小: ' + field.min);
          if (field.max != null) hints.push('最大: ' + field.max);
          if (field.decimals != null) hints.push('小数位: ' + field.decimals);
          if (hints.length) html += '<div class="ant-form-extra" style="font-size:11px;color:#999;">' + hints.join(' | ') + '</div>';
        } else {
          // string
          html += '<input class="ant-input"' + (disabled ? ' disabled' : '') + ' value="' + esc(field.defaultValue || '') + '" placeholder="请输入' + esc(field.name) + '" style="max-width:360px;" />';
          if (field.regex) {
            html += '<div class="ant-form-extra" style="font-size:11px;color:#999;">格式: ' + esc(field.regex) + '</div>';
          }
        }
        html += '<div class="ant-form-extra" style="font-size:11px;color:#999;">参数: ' + esc(field.param) + '</div>';
        html += '</div></div>';
      });
    });
    return html;
  }

  // ---- 初始化表单中的级联字段（渲染后调用） ----
  function initCascadeFields(container) {
    // 找所有有 data-cascade-from 的 select
    container.querySelectorAll('select[data-cascade-from]').forEach(function (childSel) {
      var parentParam = childSel.getAttribute('data-cascade-from');
      var cascadeDataRaw = childSel.getAttribute('data-cascade-data') || '';
      // 解析级联规则: "parentVal:opt1Label=opt1Val,opt2Label=opt2Val\n..."
      var cascadeMap = {};
      cascadeDataRaw.split('\n').forEach(function (line) {
        line = line.trim();
        if (!line) return;
        var colonIdx = line.indexOf(':');
        if (colonIdx < 0) return;
        var parentVal = line.substring(0, colonIdx).trim();
        var childOptsStr = line.substring(colonIdx + 1).trim();
        cascadeMap[parentVal] = childOptsStr;
      });
      // 找到同一表单中 name/param 匹配的父 select
      var parentSel = container.querySelector('select[data-param="' + parentParam + '"]');
      if (!parentSel) return;
      function applyOptions() {
        var parentVal = parentSel.value;
        var childOptsStr = cascadeMap[parentVal] || '';
        var prevVal = childSel.value;
        childSel.innerHTML = '<option value="">请选择...</option>';
        if (childOptsStr) {
          childOptsStr.split(',').forEach(function (opt) {
            opt = opt.trim();
            if (!opt) return;
            var eqIdx = opt.indexOf('=');
            var label = eqIdx > 0 ? opt.substring(0, eqIdx).trim() : opt;
            var val = eqIdx > 0 ? opt.substring(eqIdx + 1).trim() : opt;
            var option = document.createElement('option');
            option.value = val;
            option.textContent = label;
            if (val === prevVal) option.selected = true;
            childSel.appendChild(option);
          });
        }
      }
      parentSel.addEventListener('change', applyOptions);
      if (parentSel.value) applyOptions();
    });
  }

  // ---- 模板预览弹窗 ----
  function showTemplatePreview(tpl, deptTpl) {
    // 如果有部门模板，应用字段覆盖后预览
    var previewTpl = tpl;
    if (deptTpl && deptTpl.fieldOverrides) {
      previewTpl = JSON.parse(JSON.stringify(tpl));
      var overrides = deptTpl.fieldOverrides;
      (previewTpl.fieldGroups || []).forEach(function (group, gIdx) {
        group.fields.forEach(function (field) {
          var key = gIdx + '|' + field.param;
          var o = overrides[key];
          if (!o) return;
          if (o.show === false) field.visible = false;
          if (o.regex !== undefined) field.regex = o.regex;
          if (o.deptMin !== undefined) field.min = o.deptMin;
          if (o.deptMax !== undefined) field.max = o.deptMax;
          if (o.deptDecimals !== undefined) field.decimals = o.deptDecimals;
          if (o.defaultValue !== undefined) field.defaultValue = o.defaultValue;
          if (o.options !== undefined) field.options = o.options;
          if (o.cascadeFrom !== undefined) field.cascadeFrom = o.cascadeFrom;
          if (o.cascadeData !== undefined) field.cascadeData = o.cascadeData;
        });
      });
    }
    var title = '预览表单 - ' + esc(tpl.resType) + ' / ' + esc(tpl.opType);
    if (deptTpl) title += '（部门视图）';
    var html = '<div class="ant-modal-overlay" style="display:flex;">';
    html += '<div class="ant-modal" style="width:640px;max-height:80vh;overflow-y:auto;">';
    html += '<div class="ant-modal-header">' + title + ' <button class="ant-modal-close" onclick="hideModal()">&times;</button></div>';
    html += '<div class="ant-modal-body">';
    html += renderTemplateFormFields(previewTpl, { disabled: true });
    html += '</div>';
    html += '<div class="ant-modal-footer"><button class="ant-btn" onclick="hideModal()">关闭</button></div>';
    html += '</div></div>';
    var container = document.getElementById('modal-container');
    container.innerHTML = html;
    var overlay = container.querySelector('.ant-modal-overlay');
    if (overlay) overlay.onclick = function (e) { if (e.target === overlay) hideModal(); };
  }

  // ---- 平台级审批流程配置 ----
  function renderResConfigFlows(container) {
    var categoryOrder = getCatalogCategoryOrder();
    // 从资源目录拉取需要审批的操作，构建流程列表
    var flowItems = [];
    MockData.resCatalog.forEach(function (cat) {
      cat.types.forEach(function (t) {
        if (!t.allowApply) return;
        var ops = t.approvalOps || [];
        ops.forEach(function (op) {
          // 查找是否已有配置
          var existing = null;
          for (var i = 0; i < MockData.platformFlows.length; i++) {
            if (MockData.platformFlows[i].resType === t.name && MockData.platformFlows[i].opType === op) {
              existing = MockData.platformFlows[i]; break;
            }
          }
          flowItems.push({
            category: cat.name, resType: t.name, opType: op,
            flowTemplate: existing ? existing.flowTemplate : '',
            admin1: existing ? existing.admin1 : '',
            admin2: existing ? existing.admin2 : ''
          });
        });
        // 子资源的需要审批的操作
        (t.children || []).forEach(function (child) {
          if (!child.allowApply) return;
          var childOps = child.approvalOps || [];
          childOps.forEach(function (op) {
            var existing = null;
            for (var i = 0; i < MockData.platformFlows.length; i++) {
              if (MockData.platformFlows[i].resType === t.name && MockData.platformFlows[i].subRes === child.name && MockData.platformFlows[i].opType === op) {
                existing = MockData.platformFlows[i]; break;
              }
            }
            flowItems.push({
              category: cat.name, resType: t.name, subRes: child.name, opType: op,
              flowTemplate: existing ? existing.flowTemplate : '',
              admin1: existing ? existing.admin1 : '',
              admin2: existing ? existing.admin2 : ''
            });
          });
        });
      });
    });

    // 按大类分组
    var groups = {};
    flowItems.forEach(function (item) {
      var cat = item.category;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    var sortedKeys = [];
    categoryOrder.forEach(function (k) { if (groups[k]) sortedKeys.push(k); });

    var html = '<div class="ant-alert ant-alert-info" style="margin-bottom:16px;">审批流程对接 ERP 低代码平台。仅展示资源目录中标记为"需要审批"的操作，按操作类型配置审批流程。默认无审批流程，可选择预制模板。</div>';

    sortedKeys.forEach(function (catName, catIdx) {
      var items = groups[catName];
      var isExpanded = !state.resConfig.flowCollapsed[catIdx];
      html += '<div class="catalog-category-section">';
      html += '<div class="catalog-category-header" data-cat-toggle="resConfigFlow-' + catIdx + '">';
      html += '<div class="catalog-category-left">';
      html += '<span class="catalog-category-arrow' + (isExpanded ? ' expanded' : '') + '">&#8250;</span>';
      html += '<span style="font-weight:500;font-size:14px;color:#1890ff;">' + esc(catName) + '</span>';
      html += '<span style="font-weight:normal;font-size:12px;color:var(--text-secondary);margin-left:8px;">(' + items.length + ' 项)</span>';
      html += '</div></div>';
      html += '<div class="catalog-category-body' + (isExpanded ? '' : ' collapsed') + '" data-cat-body="resConfigFlow-' + catIdx + '">';
      html += '<table class="ant-table" style="table-layout:fixed;"><thead><tr>';
      html += '<th style="width:20%;">资源类型</th>';
      html += '<th style="width:14%;">操作类型</th>';
      html += '<th style="width:32%;">审批流程</th>';
      html += '<th style="width:16%;">状态</th>';
      html += '<th style="width:18%;">操作</th>';
      html += '</tr></thead><tbody>';
      items.forEach(function (item, idx) {
        var globalKey = (item.subRes ? item.resType + '/' + item.subRes : item.resType) + '|' + item.opType;
        var resLabel = item.subRes ? '<span style="color:var(--text-secondary);">└─ ' + esc(item.subRes) + '</span>' : esc(item.resType);
        html += '<tr>';
        html += '<td style="padding-left:28px;">' + resLabel + '</td>';
        html += '<td>' + esc(item.opType) + '</td>';
        html += '<td>';
        if (item.flowTemplate && item.flowTemplate !== 'none') {
          html += '<span style="color:var(--text-color);">' + esc(getFlowLabel(item.flowTemplate)) + '</span>';
        } else if (item.flowTemplate === 'none') {
          html += '<span style="color:var(--text-secondary);">无审批</span>';
        } else {
          html += '<span style="color:var(--text-secondary);">--</span>';
        }
        html += '</td>';
        html += '<td>';
        if (item.flowTemplate) {
          html += '<span class="ant-tag ant-tag-green">已配置</span>';
        } else {
          html += '<span class="ant-tag ant-tag-default">未配置</span>';
        }
        html += '</td>';
        html += '<td><a class="ant-btn-link rescfg-edit-flow" data-flow-key="' + esc(globalKey) + '">编辑</a></td>';
        html += '</tr>';
      });
      html += '</tbody></table>';
      html += '</div></div>'; // close catalog-category-body and catalog-category-section
    });
    container.innerHTML = html;

    // 绑定大类折叠/展开
    container.querySelectorAll('.catalog-category-header').forEach(function (header) {
      header.onclick = function () {
        var key = header.getAttribute('data-cat-toggle');
        var catIdx = parseInt(key.replace('resConfigFlow-', ''));
        var body = container.querySelector('[data-cat-body="' + key + '"]');
        var arrow = header.querySelector('.catalog-category-arrow');
        if (body.classList.contains('collapsed')) {
          body.classList.remove('collapsed');
          arrow.classList.add('expanded');
          delete state.resConfig.flowCollapsed[catIdx];
        } else {
          body.classList.add('collapsed');
          arrow.classList.remove('expanded');
          state.resConfig.flowCollapsed[catIdx] = true;
        }
      };
    });

    // 编辑审批流程
    container.querySelectorAll('.rescfg-edit-flow').forEach(function (btn) {
      btn.onclick = function () {
        var key = btn.getAttribute('data-flow-key');
        var parts = key.split('|');
        var resKey = parts[0];
        var opType = parts[1];
        var resParts = resKey.split('/');
        var resType = resParts[0];
        var subRes = resParts[1] || '';
        showFlowEditModal(resType, subRes, opType);
      };
    });
  }

  function getFlowLabel(template) {
    var labels = {
      'none': '无审批（提交即通过）',
      'leader': '直属领导审批',
      'leader+l5': '直属领导 + 部门负责人审批',
      'leader+l5+admin1': '直属领导 + 部门负责人 + 指定审批人',
      'leader+l5+admin2': '直属领导 + 部门负责人 + 指定审批人1 + 指定审批人2'
    };
    return labels[template] || template || '--';
  }

  function renderFlowStepsPreview(flowTemplate, admin1, admin2, deptLeader) {
    if (!flowTemplate || flowTemplate === 'none') return '<span style="color:var(--text-secondary);">无审批（提交即通过）</span>';
    var steps = ['<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;background:#e6f7ff;border:1px solid #91d5ff;border-radius:4px;font-size:12px;">申请人</span>'];
    steps.push('<span style="color:#1890ff;margin:0 4px;">&rarr;</span>');
    steps.push('<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;background:#f6ffed;border:1px solid #b7eb8f;border-radius:4px;font-size:12px;">直属领导（自动）</span>');
    if (flowTemplate.indexOf('l5') !== -1) {
      steps.push('<span style="color:#1890ff;margin:0 4px;">&rarr;</span>');
      steps.push('<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;background:#fff7e6;border:1px solid #ffd591;border-radius:4px;font-size:12px;">部门负责人' + (deptLeader ? '（' + esc(deptLeader) + '）' : '') + '</span>');
    }
    if (flowTemplate.indexOf('admin1') !== -1 || flowTemplate.indexOf('admin2') !== -1) {
      steps.push('<span style="color:#1890ff;margin:0 4px;">&rarr;</span>');
      steps.push('<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;background:#f9f0ff;border:1px solid #d3adf7;border-radius:4px;font-size:12px;">指定审批人' + (admin1 ? '（' + esc(admin1) + '）' : '') + '</span>');
    }
    if (flowTemplate.indexOf('admin2') !== -1) {
      steps.push('<span style="color:#1890ff;margin:0 4px;">&rarr;</span>');
      steps.push('<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;background:#fff0f6;border:1px solid #ffadd2;border-radius:4px;font-size:12px;">指定审批人2' + (admin2 ? '（' + esc(admin2) + '）' : '') + '</span>');
    }
    return '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:2px;">' + steps.join('') + '</div>';
  }

  function showFlowEditModal(resType, subRes, opType) {
    var resLabel = subRes ? resType + ' / ' + subRes : resType;
    // 查找已有配置
    var existing = null;
    for (var i = 0; i < MockData.platformFlows.length; i++) {
      var f = MockData.platformFlows[i];
      if (f.resType === resType && (f.subRes || '') === subRes && f.opType === opType) {
        existing = f; break;
      }
    }
    var curTemplate = existing ? existing.flowTemplate : '';
    var curAdmin1 = existing ? (existing.admin1 || '') : '';
    var curAdmin2 = existing ? (existing.admin2 || '') : '';

    var html = '<div class="ant-modal-overlay" style="display:flex;">';
    html += '<div class="ant-modal" style="width:600px;">';
    html += '<div class="ant-modal-header">编辑审批流程 <button class="ant-modal-close" onclick="hideModal()">&times;</button></div>';
    html += '<div class="ant-modal-body">';
    html += '<div class="ant-form-item"><div class="ant-form-label">资源类型</div><div class="ant-form-control"><span class="ant-tag ant-tag-blue">' + esc(resLabel) + '</span> <span class="ant-tag ant-tag-cyan">' + esc(opType) + '</span></div></div>';
    html += '<div class="ant-form-item"><div class="ant-form-label"><span class="required">*</span>审批流程模板</div><div class="ant-form-control">';
    html += '<select class="ant-select" id="flow-edit-template" style="width:100%;">';
    html += '<option value="none"' + (curTemplate === 'none' ? ' selected' : '') + '>无审批（提交即通过）</option>';
    html += '<option value="leader"' + (curTemplate === 'leader' ? ' selected' : '') + '>直属领导审批</option>';
    html += '<option value="leader+l5"' + (curTemplate === 'leader+l5' ? ' selected' : '') + '>直属领导 + 部门负责人审批</option>';
    html += '<option value="leader+l5+admin1"' + (curTemplate === 'leader+l5+admin1' ? ' selected' : '') + '>直属领导 + 部门负责人 + 指定审批人</option>';
    html += '<option value="leader+l5+admin2"' + (curTemplate === 'leader+l5+admin2' ? ' selected' : '') + '>直属领导 + 部门负责人 + 指定审批人1 + 指定审批人2</option>';
    html += '</select></div></div>';
    html += '<div class="ant-form-item" id="flow-edit-admin1-row" style="' + (curTemplate.indexOf('admin1') !== -1 || curTemplate.indexOf('admin2') !== -1 ? '' : 'display:none;') + '"><div class="ant-form-label">指定审批人</div><div class="ant-form-control">';
    html += '<input class="ant-input" id="flow-edit-admin1" placeholder="输入审批人姓名" value="' + esc(curAdmin1) + '" style="max-width:280px;" />';
    html += '<div class="ant-form-extra">部门配置时可覆盖此默认值</div>';
    html += '</div></div>';
    html += '<div class="ant-form-item" id="flow-edit-admin2-row" style="' + (curTemplate.indexOf('admin2') !== -1 ? '' : 'display:none;') + '"><div class="ant-form-label">指定审批人2</div><div class="ant-form-control">';
    html += '<input class="ant-input" id="flow-edit-admin2" placeholder="输入审批人2姓名" value="' + esc(curAdmin2) + '" style="max-width:280px;" />';
    html += '</div></div>';
    html += '<div style="margin-top:16px;padding:12px;background:#fafafa;border-radius:6px;border:1px solid #f0f0f0;"><div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;">流程预览</div><div id="flow-edit-preview"></div></div>';
    html += '</div>';
    html += '<div class="ant-modal-footer"><button class="ant-btn" onclick="hideModal()">取消</button><button class="ant-btn ant-btn-primary" id="flow-edit-save">确定</button></div>';
    html += '</div></div>';

    var container = document.getElementById('modal-container');
    container.innerHTML = html;
    var overlay = container.querySelector('.ant-modal-overlay');
    if (overlay) overlay.onclick = function (e) { if (e.target === overlay) hideModal(); };

    function updateFlowPreview() {
      var tmpl = document.getElementById('flow-edit-template').value;
      var a1 = document.getElementById('flow-edit-admin1').value;
      var a2 = document.getElementById('flow-edit-admin2').value;
      var previewEl = document.getElementById('flow-edit-preview');
      if (previewEl) previewEl.innerHTML = renderFlowStepsPreview(tmpl, a1, a2, '');
    }

    // 动态显示管理员输入
    var templateSel = document.getElementById('flow-edit-template');
    var admin1Row = document.getElementById('flow-edit-admin1-row');
    var admin2Row = document.getElementById('flow-edit-admin2-row');
    templateSel.onchange = function () {
      admin1Row.style.display = templateSel.value.indexOf('admin1') !== -1 || templateSel.value.indexOf('admin2') !== -1 ? '' : 'none';
      admin2Row.style.display = templateSel.value.indexOf('admin2') !== -1 ? '' : 'none';
      updateFlowPreview();
    };
    document.getElementById('flow-edit-admin1').oninput = updateFlowPreview;
    document.getElementById('flow-edit-admin2').oninput = updateFlowPreview;
    updateFlowPreview();

    // 保存
    document.getElementById('flow-edit-save').onclick = function () {
      var tmpl = templateSel.value;
      var admin1 = document.getElementById('flow-edit-admin1').value.trim();
      var admin2 = document.getElementById('flow-edit-admin2').value.trim();
      // 更新或新增
      var found = false;
      for (var i = 0; i < MockData.platformFlows.length; i++) {
        var f = MockData.platformFlows[i];
        if (f.resType === resType && (f.subRes || '') === subRes && f.opType === opType) {
          f.flowTemplate = tmpl;
          f.admin1 = admin1;
          f.admin2 = admin2;
          found = true;
          break;
        }
      }
      if (!found && tmpl) {
        MockData.platformFlows.push({ resType: resType, subRes: subRes, opType: opType, flowTemplate: tmpl, admin1: admin1, admin2: admin2 });
      }
      hideModal();
      showMessage(resLabel + ' / ' + opType + ' 审批流程已更新', 'success');
      renderResConfig();
    };
  }

  // =============================================
  // 部门配置页
  // =============================================
  function initDeptConfigPage() {
    var deptSelect = document.getElementById('dept-config-dept-select');
    if (deptSelect) {
      deptSelect.value = state.deptConfig.selectedDept;
      deptSelect.onchange = function () {
        state.deptConfig.selectedDept = deptSelect.value;
        renderDeptConfig();
      };
    }
    // Tab 切换
    document.querySelectorAll('.dept-cfg-tab').forEach(function (tab) {
      tab.onclick = function () {
        state.deptConfig.activeTab = tab.getAttribute('data-dept-tab');
        document.querySelectorAll('.dept-cfg-tab').forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        renderDeptConfig();
      };
    });
    renderDeptConfig();
  }

  function renderDeptConfig() {
    var deptId = state.deptConfig.selectedDept;
    var cfg = MockData.deptConfig[deptId];
    if (!cfg) return;
    var tab = state.deptConfig.activeTab;
    var container = document.getElementById('dept-config-content');
    if (!container) return;
    if (tab === 'account') renderDeptAccount(container, cfg, deptId);
    else if (tab === 'template') renderDeptTemplates(container, cfg, deptId);
    else if (tab === 'approval') renderDeptApproval(container, cfg, deptId);
    else if (tab === 'ticket-handler') renderDeptTicketHandlers(container, cfg, deptId);
  }

  function renderDeptAccount(container, cfg, deptId) {
    var html = '<div class="ant-card"><div class="ant-card-head"><span>主账号配置</span></div><div class="ant-card-body">';
    if (cfg.cloudAccountBound) {
      html += '<div class="ant-form-item"><div class="ant-form-label">当前关联主账号</div>';
      html += '<div class="ant-form-control"><span class="ant-tag ant-tag-blue" style="font-size:14px;padding:4px 12px;">' + esc(cfg.cloudAccount) + '</span>';
      html += '<span class="ant-tag ant-tag-green" style="margin-left:8px;">已关联</span></div></div>';
      html += '<div class="ant-form-item"><div class="ant-form-label"></div>';
      html += '<div class="ant-form-control"><button class="ant-btn" id="dept-config-rebind-btn">重新关联</button></div></div>';
    } else {
      html += '<div class="ant-form-item"><div class="ant-form-label">当前关联主账号</div>';
      html += '<div class="ant-form-control"><span class="ant-tag ant-tag-default" style="font-size:14px;padding:4px 12px;">未关联</span></div></div>';
      html += '<div class="ant-form-item"><div class="ant-form-label"></div>';
      html += '<div class="ant-form-control"><button class="ant-btn ant-btn-primary" id="dept-config-bind-btn">关联主账号</button></div></div>';
    }
    html += '</div></div>';
    container.innerHTML = html;
    var bindBtn = document.getElementById('dept-config-bind-btn');
    var rebindBtn = document.getElementById('dept-config-rebind-btn');
    var targetBtn = bindBtn || rebindBtn;
    if (targetBtn) {
      targetBtn.onclick = function () {
        loadAndShowModal('cloud/bind-main', function () {
          var header = document.querySelector('#modal-container .ant-modal-header');
          if (header) header.childNodes[0].textContent = cfg.cloudAccountBound ? '重新关联主账号 ' : '关联主账号 ';
          var confirmBtn = document.querySelector('#modal-container .ant-btn-primary');
          if (confirmBtn) {
            confirmBtn.onclick = function () {
              var alias = document.getElementById('bind-cloud-alias');
              var ak = document.getElementById('bind-cloud-ak');
              if (alias && alias.value.trim() && ak && ak.value.trim()) {
                cfg.cloudAccount = alias.value.trim() + ' (' + ak.value.trim().substring(0, 4) + '****)';
                cfg.cloudAccountBound = true;
                hideModal();
                showMessage('主账号已' + (cfg.cloudAccountBound ? '重新' : '') + '关联为「' + cfg.cloudAccount + '」', 'success');
                renderDeptConfig();
              } else {
                showMessage('请填写完整信息', 'error');
              }
            };
          }
        });
      };
    }
  }

  // 获取资源目录大类排序
  function getCatalogCategoryOrder() {
    var order = [];
    MockData.resCatalog.forEach(function (cat) { order.push(cat.name); });
    return order;
  }

  // 按大类分组并排序
  function groupByCategory(items, categoryOrder) {
    var groups = {};
    items.forEach(function (item) {
      var cat = item.category || '其他';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    var sortedKeys = [];
    categoryOrder.forEach(function (catName) {
      if (groups[catName]) sortedKeys.push(catName);
    });
    Object.keys(groups).forEach(function (k) {
      if (sortedKeys.indexOf(k) === -1) sortedKeys.push(k);
    });
    return { groups: groups, sortedKeys: sortedKeys };
  }

  function renderDeptTemplates(container, cfg) {
    // 如果正在编辑某个模板，渲染编辑视图
    if (state.deptConfig._editingTplIdx !== undefined && state.deptConfig._editingTplIdx !== null) {
      renderDeptTemplateEdit(container, cfg, state.deptConfig._editingTplIdx);
      return;
    }
    var categoryOrder = getCatalogCategoryOrder();
    var result = groupByCategory(cfg.templates, categoryOrder);
    var html = '<div class="ant-card"><div class="ant-card-head"><span>资源操作配置</span></div><div class="ant-card-body" style="padding:0;">';
    html += '<div class="ant-alert ant-alert-info" style="margin:16px 16px 0;">从资源目录中拉取已有系统配置的资源操作模板。部门可在系统默认模板基础上自定义（固化字段、设置默认值、限定选项），也可随时恢复默认。</div>';
    result.sortedKeys.forEach(function (catName, catIdx) {
      var items = result.groups[catName];
      var isExpanded = !state.deptConfig.tplCollapsed[catIdx];
      html += '<div class="catalog-category-section" style="margin:16px 16px 0;">';
      html += '<div class="catalog-category-header" data-cat-toggle="deptTpl-' + catIdx + '">';
      html += '<div class="catalog-category-left">';
      html += '<span class="catalog-category-arrow' + (isExpanded ? ' expanded' : '') + '">&#8250;</span>';
      html += '<span style="font-weight:500;font-size:14px;color:#1890ff;">' + esc(catName) + '</span>';
      html += '<span style="font-weight:normal;font-size:12px;color:var(--text-secondary);margin-left:8px;">(' + items.length + ' 项)</span>';
      html += '</div></div>';
      html += '<div class="catalog-category-body' + (isExpanded ? '' : ' collapsed') + '" data-cat-body="deptTpl-' + catIdx + '">';
      html += '<table class="ant-table" style="table-layout:fixed;"><thead><tr><th style="width:28%;">资源类型</th><th style="width:20%;">操作类型</th><th style="width:18%;">状态</th><th style="width:34%;">操作</th></tr></thead><tbody>';
      items.forEach(function (tpl) {
        var globalIdx = cfg.templates.indexOf(tpl);
        var resLabel = tpl.subRes ? '<span style="color:var(--text-secondary);padding-left:20px;">└─ ' + esc(tpl.subRes) + '</span>' : esc(tpl.resType);
        html += '<tr>';
        html += '<td style="padding-left:28px;">' + resLabel + '</td>';
        html += '<td>' + esc(tpl.opType) + '</td>';
        html += '<td>';
        if (tpl.customized) {
          html += '<span class="ant-tag ant-tag-orange">自定义</span>';
        } else {
          html += '<span class="ant-tag ant-tag-blue">系统默认</span>';
        }
        html += '</td>';
        html += '<td>';
        html += '<a class="ant-btn-link dept-tpl-edit-btn" data-idx="' + globalIdx + '">编辑</a>';
        if (tpl.customized) {
          html += ' <a class="ant-btn-link dept-tpl-restore-btn" data-idx="' + globalIdx + '" style="margin-left:8px;color:#faad14;">恢复默认</a>';
        }
        html += '</td>';
        html += '</tr>';
      });
      html += '</tbody></table>';
      html += '</div></div>'; // close catalog-category-body and catalog-category-section
    });
    html += '</div></div>';
    container.innerHTML = html;

    // 绑定大类折叠/展开
    container.querySelectorAll('.catalog-category-header').forEach(function (header) {
      header.onclick = function () {
        var key = header.getAttribute('data-cat-toggle');
        var catIdx = parseInt(key.replace('deptTpl-', ''));
        var body = container.querySelector('[data-cat-body="' + key + '"]');
        var arrow = header.querySelector('.catalog-category-arrow');
        if (body.classList.contains('collapsed')) {
          body.classList.remove('collapsed');
          arrow.classList.add('expanded');
          delete state.deptConfig.tplCollapsed[catIdx];
        } else {
          body.classList.add('collapsed');
          arrow.classList.remove('expanded');
          state.deptConfig.tplCollapsed[catIdx] = true;
        }
      };
    });
    container.querySelectorAll('.dept-tpl-edit-btn').forEach(function (btn) {
      btn.onclick = function () {
        var idx = parseInt(btn.getAttribute('data-idx'));
        state.deptConfig._editingTplIdx = idx;
        renderDeptTemplates(container, cfg);
      };
    });
    container.querySelectorAll('.dept-tpl-restore-btn').forEach(function (btn) {
      btn.onclick = function () {
        var idx = parseInt(btn.getAttribute('data-idx'));
        cfg.templates[idx].customized = false;
        cfg.templates[idx].fieldOverrides = {};
        showMessage(cfg.templates[idx].resType + ' / ' + cfg.templates[idx].opType + ' 模板已恢复为系统默认', 'success');
        renderDeptTemplates(container, cfg);
      };
    });
  }

  // 部门级模板编辑视图 - 受限编辑规则
  function renderDeptTemplateEdit(container, cfg, tplIdx) {
    var deptTpl = cfg.templates[tplIdx];
    // 查找对应的平台模板（按 resType + opType 匹配）
    var platformTpl = null;
    for (var i = 0; i < MockData.platformTemplates.length; i++) {
      var pt = MockData.platformTemplates[i];
      if (pt.resType === deptTpl.resType && pt.opType === deptTpl.opType) {
        platformTpl = pt; break;
      }
    }
    // fallback: 只按 resType 匹配
    if (!platformTpl) {
      for (var i = 0; i < MockData.platformTemplates.length; i++) {
        if (MockData.platformTemplates[i].resType === deptTpl.resType) {
          platformTpl = MockData.platformTemplates[i]; break;
        }
      }
    }
    if (!platformTpl) {
      container.innerHTML = '<div class="ant-empty">未找到对应的平台模板</div>';
      return;
    }
    // 初始化部门级覆盖配置
    if (!deptTpl.fieldOverrides) deptTpl.fieldOverrides = {};

    var resLabel = deptTpl.subRes ? deptTpl.resType + ' / ' + deptTpl.subRes : deptTpl.resType;
    var html = '<div style="margin-bottom:16px;">';
    html += '<a class="ant-btn-link dept-tpl-back-btn" style="font-size:14px;">&larr; 返回模板列表</a>';
    html += '</div>';
    html += '<div class="ant-card"><div class="ant-card-head"><span>编辑部门模板 - ' + esc(resLabel) + ' / ' + esc(deptTpl.opType) + '</span></div>';
    html += '<div class="ant-card-body">';
    html += '<div class="ant-alert ant-alert-info" style="margin-bottom:16px;">';
    html += '<b>部门配置规则：</b>仅显示平台配置为「可见」的字段。各字段可配置范围：<br>';
    html += '• <b>fixed</b>：只能决定是否展示；<br>';
    html += '• <b>string</b>：可配置正则表达式校验及默认值；<br>';
    html += '• <b>number</b>：可在平台范围内缩小 min/max，配置小数位数及默认值；<br>';
    html += '• <b>select</b>：可配置选项 kv 及级联约束；<br>';
    html += '• <b>textarea</b>：可配置默认值。';
    html += '</div>';

    (platformTpl.fieldGroups || []).forEach(function (group, gIdx) {
      html += '<div style="margin-bottom:16px;border:1px solid #f0f0f0;border-radius:6px;">';
      html += '<div style="padding:8px 16px;background:#fafafa;border-bottom:1px solid #f0f0f0;font-weight:500;border-radius:6px 6px 0 0;">&#128193; ' + esc(group.groupName) + '</div>';
      html += '<table class="ant-table" style="margin:0;table-layout:fixed;"><thead><tr>';
      html += '<th style="width:13%;">字段名称</th>';
      html += '<th style="width:11%;">参数名</th>';
      html += '<th style="width:7%;">类型</th>';
      html += '<th style="width:6%;">必填</th>';
      html += '<th style="width:7%;">展示</th>';
      html += '<th style="width:30%;">部门配置</th>';
      html += '<th style="width:26%;">平台原始值</th>';
      html += '</tr></thead><tbody>';
      group.fields.forEach(function (field) {
        var key = gIdx + '|' + field.param;
        var override = deptTpl.fieldOverrides[key] || {};
        var show = override.show !== undefined ? override.show : true;
        html += '<tr' + (!show ? ' style="background:#fafafa;opacity:0.6;"' : '') + '>';
        html += '<td>' + esc(field.name) + '</td>';
        html += '<td><code style="font-size:11px;">' + esc(field.param) + '</code></td>';
        html += '<td><span class="ant-tag ant-tag-default" style="font-size:11px;">' + esc(field.type) + '</span></td>';
        html += '<td style="text-align:center;">' + (field.required ? '<span class="ant-tag ant-tag-red" style="font-size:10px;">必填</span>' : '<span style="color:#999;font-size:11px;">选填</span>') + '</td>';
        html += '<td style="text-align:center;"><label class="toggle-switch"><input type="checkbox" class="dept-tpl-field-show" data-key="' + esc(key) + '"' + (show ? ' checked' : '') + ' /><span class="toggle-slider"></span></label></td>';
        html += '<td>';
        // 根据字段类型渲染不同的编辑控件
        if (field.type === 'fixed') {
          html += '<span style="color:#999;font-size:12px;">不可编辑: ' + esc(field.fixedValue || '') + '</span>';
        } else if (field.type === 'select') {
          // 部门负责人配置选项或级联——显示摘要 + ⚙ 按钮
          var hasOpts = !!(override.options && override.options.trim());
          var hasCascade = !!(override.cascadeFrom);
          var isUnconfigured = !hasOpts && !hasCascade;
          var summaryText = '';
          if (hasCascade) {
            var ruleLines = (override.cascadeData || '').split('\n').filter(Boolean).length;
            summaryText = '级联 ← ' + esc(override.cascadeFrom) + '，' + ruleLines + ' 条规则';
          } else if (hasOpts) {
            var optCount2 = override.options.split(',').filter(Boolean).length;
            summaryText = optCount2 + ' 个选项';
          } else {
            summaryText = (field.required ? '⚠ 必填未配置' : '未配置');
          }
          var summaryStyle = (isUnconfigured && field.required)
            ? 'font-size:12px;color:#ff4d4f;'
            : (isUnconfigured ? 'font-size:12px;color:#bfbfbf;' : 'font-size:12px;color:#595959;');
          html += '<div style="display:flex;align-items:center;gap:6px;">';
          html += '<span style="' + summaryStyle + '">' + summaryText + '</span>';
          html += '<button class="ant-btn ant-btn-sm dept-tpl-select-settings-btn" data-key="' + esc(key) + '" style="padding:0 8px;height:22px;font-size:11px;flex-shrink:0;">&#9881; 配置</button>';
          html += '</div>';
        } else if (field.type === 'string') {
          var regexVal = override.regex || '';
          var strDefault = override.defaultValue || '';
          html += '<div style="display:flex;flex-direction:column;gap:4px;">';
          html += '<input class="ant-input dept-tpl-string-regex" data-key="' + esc(key) + '" value="' + esc(regexVal) + '" placeholder="正则校验（留空不限制）" style="height:26px;font-size:12px;max-width:240px;font-family:monospace;" />';
          html += '<input class="ant-input dept-tpl-field-default" data-key="' + esc(key) + '" value="' + esc(strDefault) + '" placeholder="默认值（选填）" style="height:26px;font-size:12px;max-width:240px;" />';
          html += '</div>';
        } else if (field.type === 'number') {
          var deptMin = override.deptMin !== undefined ? override.deptMin : '';
          var deptMax = override.deptMax !== undefined ? override.deptMax : '';
          var deptDecimals = override.deptDecimals !== undefined ? override.deptDecimals : '';
          var numDefault = override.defaultValue !== undefined ? override.defaultValue : '';
          html += '<div style="font-size:12px;">';
          html += '<div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin-bottom:4px;">';
          html += '下限: <input class="ant-input dept-tpl-num-min" data-key="' + esc(key) + '" type="number" value="' + esc(deptMin) + '" placeholder="' + (field.min != null ? field.min : '无') + '" style="height:26px;width:60px;font-size:12px;" />';
          html += '上限: <input class="ant-input dept-tpl-num-max" data-key="' + esc(key) + '" type="number" value="' + esc(deptMax) + '" placeholder="' + (field.max != null ? field.max : '无') + '" style="height:26px;width:60px;font-size:12px;" />';
          html += '小数位: <input class="ant-input dept-tpl-num-decimals" data-key="' + esc(key) + '" type="number" value="' + esc(deptDecimals) + '" placeholder="' + (field.decimals != null ? field.decimals : '0') + '" min="0" max="10" style="height:26px;width:50px;font-size:12px;" />';
          html += '</div>';
          html += '<div style="display:flex;align-items:center;gap:4px;">';
          html += '默认值: <input class="ant-input dept-tpl-num-default" data-key="' + esc(key) + '" type="number" value="' + esc(numDefault) + '" placeholder="不填则无默认" style="height:26px;width:100px;font-size:12px;" />';
          html += '</div>';
          html += '</div>';
        } else if (field.type === 'textarea') {
          var defVal = override.defaultValue || '';
          html += '<input class="ant-input dept-tpl-field-default" data-key="' + esc(key) + '" value="' + esc(defVal) + '" placeholder="默认值" style="height:28px;font-size:12px;max-width:240px;" />';
        } else {
          var defVal = override.defaultValue || '';
          html += '<input class="ant-input dept-tpl-field-default" data-key="' + esc(key) + '" value="' + esc(defVal) + '" placeholder="默认值" style="height:28px;font-size:12px;max-width:240px;" />';
        }
        html += '</td>';
        // 平台原始值
        html += '<td style="font-size:11px;color:#999;">';
        if (field.type === 'select') {
          var refOpts = (field.referenceOptions || '').split(',').filter(Boolean).map(function (o) {
            var eq = o.indexOf('='); return eq > 0 ? o.slice(0, eq).trim() : o.trim();
          });
          html += refOpts.length ? ('参考: ' + esc(refOpts.join(', '))) : '<span style="color:#bfbfbf;">无参考选项</span>';
        }
        else if (field.type === 'number') html += 'min:' + (field.min != null ? field.min : '--') + ' max:' + (field.max != null ? field.max : '--');
        else if (field.type === 'fixed') html += esc(field.fixedValue || '');
        else html += '--';
        html += '</td>';
        html += '</tr>';
      });
      html += '</tbody></table></div>';
    });

    html += '<div style="padding-top:16px;border-top:1px solid #f0f0f0;display:flex;gap:12px;">';
    html += '<button class="ant-btn ant-btn-primary dept-tpl-save-btn">保存</button>';
    html += '<button class="ant-btn dept-tpl-preview-btn">预览表单</button>';
    html += '<button class="ant-btn dept-tpl-back-btn">取消</button>';
    html += '</div>';
    html += '</div></div>';
    container.innerHTML = html;

    // 绑定 select 字段的 ⚙ 配置按钮
    container.querySelectorAll('.dept-tpl-select-settings-btn').forEach(function (btn) {
      btn.onclick = function () {
        var key = btn.getAttribute('data-key');
        var parts = key.split('|');
        var gIdx = parseInt(parts[0]);
        var param = parts[1];
        var pField = (platformTpl.fieldGroups[gIdx] || { fields: [] }).fields.find(function (f) { return f.param === param; });
        var pGroup = platformTpl.fieldGroups[gIdx];
        if (!pField) return;
        if (!deptTpl.fieldOverrides) deptTpl.fieldOverrides = {};
        if (!deptTpl.fieldOverrides[key]) deptTpl.fieldOverrides[key] = {};
        showDeptFieldSettingsModal(pField, pGroup, key, deptTpl.fieldOverrides[key], function () {
          renderDeptTemplateEdit(container, cfg, state.deptConfig._editingTplIdx);
        });
      };
    });

    // 返回
    container.querySelectorAll('.dept-tpl-back-btn').forEach(function (btn) {
      btn.onclick = function () {
        state.deptConfig._editingTplIdx = null;
        renderDeptTemplates(container, cfg);
      };
    });

    // 预览
    var previewBtn = container.querySelector('.dept-tpl-preview-btn');
    if (previewBtn) {
      previewBtn.onclick = function () {
        showTemplatePreview(platformTpl, deptTpl);
      };
    }

    // 保存
    var saveBtn = container.querySelector('.dept-tpl-save-btn');
    if (saveBtn) {
      saveBtn.onclick = function () {
        var overrides = {};
        var hasError = false;
        // 收集展示状态
        container.querySelectorAll('.dept-tpl-field-show').forEach(function (cb) {
          var key = cb.getAttribute('data-key');
          if (!overrides[key]) overrides[key] = {};
          overrides[key].show = cb.checked;
        });
        // 收集 select 配置（已由 showDeptFieldSettingsModal 直接写入 deptTpl.fieldOverrides，
        // 这里只需把它们合并进本次 overrides，防止与其他字段的收集冲突）
        (platformTpl.fieldGroups || []).forEach(function (g, gi) {
          g.fields.forEach(function (f) {
            if (f.type !== 'select') return;
            var k = gi + '|' + f.param;
            var saved = deptTpl.fieldOverrides && deptTpl.fieldOverrides[k];
            if (saved) {
              if (!overrides[k]) overrides[k] = {};
              if (saved.options !== undefined) overrides[k].options = saved.options;
              if (saved.cascadeFrom !== undefined) overrides[k].cascadeFrom = saved.cascadeFrom;
              if (saved.cascadeData !== undefined) overrides[k].cascadeData = saved.cascadeData;
            }
          });
        });
        // 收集 string 正则
        container.querySelectorAll('.dept-tpl-string-regex').forEach(function (input) {
          var key = input.getAttribute('data-key');
          if (!overrides[key]) overrides[key] = {};
          overrides[key].regex = input.value.trim();
        });
        // 收集 string 固定值
        container.querySelectorAll('.dept-tpl-fixed-value').forEach(function (input) {
          var key = input.getAttribute('data-key');
          if (!overrides[key]) overrides[key] = {};
          overrides[key].fixedValue = input.value.trim();
        });
        // 收集 number min/max
        container.querySelectorAll('.dept-tpl-num-min').forEach(function (input) {
          var key = input.getAttribute('data-key');
          if (!overrides[key]) overrides[key] = {};
          overrides[key].deptMin = input.value.trim() !== '' ? parseFloat(input.value) : undefined;
        });
        container.querySelectorAll('.dept-tpl-num-max').forEach(function (input) {
          var key = input.getAttribute('data-key');
          if (!overrides[key]) overrides[key] = {};
          overrides[key].deptMax = input.value.trim() !== '' ? parseFloat(input.value) : undefined;
        });
        container.querySelectorAll('.dept-tpl-num-decimals').forEach(function (input) {
          var key = input.getAttribute('data-key');
          if (!overrides[key]) overrides[key] = {};
          overrides[key].deptDecimals = input.value.trim() !== '' ? parseInt(input.value) : undefined;
        });
        container.querySelectorAll('.dept-tpl-num-default').forEach(function (input) {
          var key = input.getAttribute('data-key');
          if (!overrides[key]) overrides[key] = {};
          if (input.value.trim() !== '') overrides[key].defaultValue = input.value.trim();
        });
        // 收集 textarea/string 默认值
        container.querySelectorAll('.dept-tpl-field-default').forEach(function (input) {
          var key = input.getAttribute('data-key');
          if (!overrides[key]) overrides[key] = {};
          overrides[key].defaultValue = input.value.trim();
        });
        // 验证: 必填字段不展示时必须给默认值
        (platformTpl.fieldGroups || []).forEach(function (group, gIdx) {
          group.fields.forEach(function (field) {
            var key = gIdx + '|' + field.param;
            var o = overrides[key] || {};
            if (field.required && o.show === false && !o.defaultValue && !o.fixedValue) {
              hasError = true;
            }
          });
        });
        if (hasError) {
          showMessage('必填字段关闭"展示"时必须提供默认值', 'warning');
          return;
        }
        deptTpl.fieldOverrides = overrides;
        var hasCustom = false;
        Object.keys(overrides).forEach(function (k) {
          var o = overrides[k];
          if (o.show === false || o.defaultValue || o.fixedValue || o.options || o.cascadeFrom || o.regex || o.deptMin !== undefined || o.deptMax !== undefined || o.deptDecimals !== undefined) hasCustom = true;
        });
        deptTpl.customized = hasCustom;
        state.deptConfig._editingTplIdx = null;
        showMessage(resLabel + ' / ' + deptTpl.opType + ' 部门模板已保存' + (hasCustom ? '（自定义）' : '（无变更）'), 'success');
        renderDeptTemplates(container, cfg);
      };
    }
  }

  // 部门级 select 字段设置弹窗
  function showDeptFieldSettingsModal(platformField, platformGroup, key, override, onSave) {
    var otherSelects = platformGroup.fields.filter(function (f) {
      return f !== platformField && f.type === 'select' && f.param;
    });
    var cascadeEnabled = !!override.cascadeFrom;

    var html = '<div class="ant-modal-overlay" style="display:flex;">';
    html += '<div class="ant-modal" style="width:620px;max-height:88vh;overflow-y:auto;">';
    html += '<div class="ant-modal-header">字段选项配置 <span style="font-size:13px;color:var(--text-secondary);margin-left:8px;">· ' + esc(platformField.name) + '</span><button class="ant-modal-close" onclick="hideModal()">&times;</button></div>';
    html += '<div class="ant-modal-body">';

    // 平台参考选项提示
    if (platformField.referenceOptions) {
      var refLabels = platformField.referenceOptions.split(',').map(function (o) {
        var eq = o.indexOf('='); return esc(eq > 0 ? o.slice(0, eq).trim() : o.trim());
      }).join('，');
      html += '<div style="background:#f6ffed;border:1px solid #b7eb8f;border-radius:4px;padding:8px 12px;margin-bottom:16px;font-size:12px;">';
      html += '&#128161; 平台参考选项：' + refLabels;
      html += '<div style="color:#888;margin-top:2px;">可直接采用，也可自行增删调整</div>';
      html += '</div>';
    }

    // 级联开关
    html += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">';
    html += '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:14px;font-weight:500;">';
    html += '<input type="checkbox" id="dfset-cascade-enable"' + (cascadeEnabled ? ' checked' : '') + ' />';
    html += '<span>开启级联</span>';
    html += '</label>';
    html += '<span style="font-size:12px;color:var(--text-secondary);">开启后此字段的选项由父字段的值决定</span>';
    html += '</div>';

    // 区域A：普通选项
    html += '<div id="dfset-options-section"' + (cascadeEnabled ? ' style="display:none;"' : '') + '>';
    html += '<div class="ant-form-item"><div class="ant-form-label">选项配置</div><div class="ant-form-control">';
    html += '<div id="dfset-options-list" style="margin-bottom:6px;"></div>';
    html += '<button type="button" class="ant-btn ant-btn-dashed" id="dfset-add-option" style="display:flex;width:100%;border-style:dashed;justify-content:center;">+ 添加选项</button>';
    html += '<div class="ant-form-extra" style="margin-top:4px;">展示名 = 实际传参值，如：华北2（北京）= cn-beijing</div>';
    html += '</div></div></div>';

    // 区域B：级联配置
    html += '<div id="dfset-cascade-section"' + (cascadeEnabled ? '' : ' style="display:none;"') + '>';
    html += '<div class="ant-form-item"><div class="ant-form-label">级联父字段</div><div class="ant-form-control">';
    if (otherSelects.length === 0) {
      html += '<div class="ant-alert ant-alert-info" style="margin:0;">当前分组中没有其他 select 字段，请先添加父字段</div>';
    } else {
      html += '<select class="ant-select" id="dfset-cascade-from" style="width:100%;">';
      html += '<option value="">请选择父字段（必须是 select 类型）...</option>';
      otherSelects.forEach(function (pf) {
        html += '<option value="' + esc(pf.param) + '"' + (override.cascadeFrom === pf.param ? ' selected' : '') + '>' + esc(pf.name || pf.param) + ' &lt;' + esc(pf.param) + '&gt;</option>';
      });
      html += '</select>';
      html += '<div class="ant-form-extra">父字段值变化时，自动筛选本字段的可用选项</div>';
    }
    html += '</div></div>';
    html += '<div class="ant-form-item"><div class="ant-form-label">级联规则</div><div class="ant-form-control">';
    html += '<div id="dfset-cascade-rules-list" style="margin-bottom:6px;"></div>';
    html += '<button type="button" class="ant-btn ant-btn-dashed" id="dfset-add-rule" style="display:flex;width:100%;border-style:dashed;justify-content:center;">+ 添加规则</button>';
    html += '<div class="ant-form-extra" style="margin-top:4px;">每条规则：父字段的某个值 → 本字段对应的子选项列表</div>';
    html += '</div></div>';
    html += '</div>';

    html += '</div>';
    html += '<div class="ant-modal-footer"><button class="ant-btn" onclick="hideModal()">取消</button><button class="ant-btn ant-btn-primary" id="dfset-save-btn">保存</button></div>';
    html += '</div></div>';

    var mc = document.getElementById('modal-container');
    mc.innerHTML = html;
    var overlay = mc.querySelector('.ant-modal-overlay');
    if (overlay) overlay.onclick = function (e) { if (e.target === overlay) hideModal(); };

    // 工具函数：创建选项行
    function makeOptRow(lbl, val, parentList) {
      var row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:6px;';
      var lIn = document.createElement('input'); lIn.className = 'ant-input dfset-opt-label'; lIn.value = lbl; lIn.placeholder = '展示名'; lIn.style.cssText = 'flex:1;min-width:0;max-width:none;';
      var eq = document.createElement('span'); eq.textContent = '='; eq.style.cssText = 'color:#bbb;flex-shrink:0;';
      var vIn = document.createElement('input'); vIn.className = 'ant-input dfset-opt-value'; vIn.value = val; vIn.placeholder = '实际值'; vIn.style.cssText = 'flex:1;min-width:0;max-width:none;';
      var del = document.createElement('button'); del.type = 'button'; del.textContent = '×'; del.style.cssText = 'flex-shrink:0;width:28px;height:28px;border:1px solid #ffccc7;border-radius:3px;background:#fff2f0;color:#ff4d4f;cursor:pointer;font-size:16px;line-height:1;padding:0;';
      del.onclick = function () { parentList.removeChild(row); };
      row.appendChild(lIn); row.appendChild(eq); row.appendChild(vIn); row.appendChild(del);
      return row;
    }

    // 工具函数：创建子选项行
    function makeChildRow(cLbl, cVal, parentDiv) {
      var row = document.createElement('div'); row.style.cssText = 'display:flex;align-items:center;gap:6px;margin-bottom:4px;';
      var lIn = document.createElement('input'); lIn.className = 'ant-input dfset-child-label'; lIn.value = cLbl; lIn.placeholder = '子展示名'; lIn.style.cssText = 'flex:1;min-width:0;max-width:none;height:28px;font-size:12px;';
      var eq = document.createElement('span'); eq.textContent = '='; eq.style.cssText = 'color:#bbb;flex-shrink:0;font-size:13px;';
      var vIn = document.createElement('input'); vIn.className = 'ant-input dfset-child-value'; vIn.value = cVal; vIn.placeholder = '子实际值'; vIn.style.cssText = 'flex:1;min-width:0;max-width:none;height:28px;font-size:12px;';
      var del = document.createElement('button'); del.type = 'button'; del.textContent = '×'; del.style.cssText = 'flex-shrink:0;width:22px;height:22px;border:none;background:none;color:#ff7875;cursor:pointer;font-size:15px;line-height:1;padding:0;';
      del.onclick = function () { if (row.parentElement) row.parentElement.removeChild(row); };
      row.appendChild(lIn); row.appendChild(eq); row.appendChild(vIn); row.appendChild(del);
      return row;
    }

    // 工具函数：创建级联规则行
    function makeRuleRow(pVal, children, rulesList) {
      var ruleDiv = document.createElement('div'); ruleDiv.style.cssText = 'border:1px solid #e8e8e8;border-radius:4px;padding:10px 12px;margin-bottom:8px;background:#fafafa;';
      var headerRow = document.createElement('div'); headerRow.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:8px;';
      var pLbl = document.createElement('span'); pLbl.textContent = '父字段值'; pLbl.style.cssText = 'font-size:12px;color:#888;flex-shrink:0;width:52px;';
      var pIn = document.createElement('input'); pIn.className = 'ant-input dfset-rule-parent'; pIn.value = pVal; pIn.placeholder = '父字段的实际传参值'; pIn.style.cssText = 'flex:1;min-width:0;max-width:none;height:28px;font-size:12px;';
      var delBtn = document.createElement('button'); delBtn.type = 'button'; delBtn.textContent = '删除规则'; delBtn.style.cssText = 'flex-shrink:0;padding:0 8px;height:24px;border:1px solid #ffccc7;border-radius:3px;background:#fff2f0;color:#ff4d4f;cursor:pointer;font-size:12px;';
      delBtn.onclick = function () { rulesList.removeChild(ruleDiv); };
      headerRow.appendChild(pLbl); headerRow.appendChild(pIn); headerRow.appendChild(delBtn);
      var childLbl = document.createElement('div'); childLbl.textContent = '↳ 子选项'; childLbl.style.cssText = 'font-size:12px;color:#888;margin-bottom:4px;';
      var childrenDiv = document.createElement('div'); childrenDiv.className = 'dfset-rule-children'; childrenDiv.style.cssText = 'padding-left:8px;';
      var addChildBtn = document.createElement('button'); addChildBtn.type = 'button'; addChildBtn.textContent = '+ 添加子选项'; addChildBtn.style.cssText = 'display:flex;justify-content:center;margin-top:4px;padding:0 8px;height:24px;font-size:12px;border:1px dashed #d9d9d9;border-radius:3px;background:#fff;cursor:pointer;width:100%;';
      addChildBtn.onclick = function () { childrenDiv.appendChild(makeChildRow('', '', childrenDiv)); };
      (children || []).forEach(function (c) { childrenDiv.appendChild(makeChildRow(c.label, c.value, childrenDiv)); });
      ruleDiv.appendChild(headerRow); ruleDiv.appendChild(childLbl); ruleDiv.appendChild(childrenDiv); ruleDiv.appendChild(addChildBtn);
      return ruleDiv;
    }

    // 填充选项
    var optsList = document.getElementById('dfset-options-list');
    (override.options || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean).forEach(function (opt) {
      var eq = opt.indexOf('=');
      optsList.appendChild(makeOptRow(eq > 0 ? opt.slice(0, eq).trim() : opt, eq > 0 ? opt.slice(eq + 1).trim() : opt, optsList));
    });
    document.getElementById('dfset-add-option').onclick = function () { optsList.appendChild(makeOptRow('', '', optsList)); };

    // 填充级联规则
    var rulesList = document.getElementById('dfset-cascade-rules-list');
    if (rulesList) {
      (override.cascadeData || '').split('\n').filter(Boolean).forEach(function (line) {
        var ci = line.indexOf(':');
        var pVal = ci >= 0 ? line.slice(0, ci).trim() : line.trim();
        var children = (ci >= 0 ? line.slice(ci + 1) : '').split(',').map(function (s) {
          s = s.trim(); var eq = s.indexOf('=');
          return eq > 0 ? { label: s.slice(0, eq).trim(), value: s.slice(eq + 1).trim() } : { label: s, value: s };
        }).filter(function (c) { return c.label || c.value; });
        rulesList.appendChild(makeRuleRow(pVal, children, rulesList));
      });
      var addRuleBtn = document.getElementById('dfset-add-rule');
      if (addRuleBtn) addRuleBtn.onclick = function () { rulesList.appendChild(makeRuleRow('', [], rulesList)); };
    }

    // 级联开关联动
    var cascadeChk = document.getElementById('dfset-cascade-enable');
    var optSec = document.getElementById('dfset-options-section');
    var cascSec = document.getElementById('dfset-cascade-section');
    if (cascadeChk) {
      cascadeChk.onchange = function () {
        var on = cascadeChk.checked;
        if (optSec) optSec.style.display = on ? 'none' : '';
        if (cascSec) cascSec.style.display = on ? '' : 'none';
      };
    }

    // 保存
    document.getElementById('dfset-save-btn').onclick = function () {
      if (cascadeChk && cascadeChk.checked) {
        override.cascadeFrom = ((document.getElementById('dfset-cascade-from') || {}).value || '').trim();
        var rules = [];
        Array.prototype.forEach.call(rulesList.children, function (ruleDiv) {
          var pIn = ruleDiv.querySelector('.dfset-rule-parent');
          var childrenDiv = ruleDiv.querySelector('.dfset-rule-children');
          if (!pIn) return;
          var pVal = pIn.value.trim();
          var childParts = [];
          Array.prototype.forEach.call(childrenDiv.children, function (childRow) {
            var cl = childRow.querySelector('.dfset-child-label'), cv = childRow.querySelector('.dfset-child-value');
            if (cl && cv) { var cL = cl.value.trim(), cV = cv.value.trim(); if (cL || cV) childParts.push((cL || cV) + '=' + (cV || cL)); }
          });
          if (pVal) rules.push(pVal + ':' + childParts.join(','));
        });
        override.cascadeData = rules.join('\n');
        override.options = '';
      } else {
        override.cascadeFrom = '';
        override.cascadeData = '';
        var opts = [];
        Array.prototype.forEach.call(optsList.children, function (row) {
          var lIn = row.querySelector('.dfset-opt-label'), vIn = row.querySelector('.dfset-opt-value');
          if (lIn && vIn) { var l = lIn.value.trim(), v = vIn.value.trim(); if (l || v) opts.push((l || v) + '=' + (v || l)); }
        });
        override.options = opts.join(',');
      }
      hideModal();
      onSave();
    };
  }

  function renderDeptApproval(container, cfg, deptId) {
    // 从资源目录 + 平台流程构建树状审批流程列表
    var categoryOrder = getCatalogCategoryOrder();
    // 查找平台流程配置
    function findPlatformFlow(resType, opType, subRes) {
      for (var i = 0; i < MockData.platformFlows.length; i++) {
        var f = MockData.platformFlows[i];
        if (f.resType === resType && f.opType === opType && (f.subRes || '') === (subRes || '')) return f;
      }
      return null;
    }
    // 查找部门配置
    function findDeptFlow(resType, opType, subRes) {
      for (var i = 0; i < cfg.approvalFlows.length; i++) {
        var f = cfg.approvalFlows[i];
        if (f.resType === resType && f.opType === opType && (f.subRes || '') === (subRes || '')) return f;
      }
      return null;
    }
    // 构建树状数据：按大类 → 资源类型 → 操作（含子资源）
    var treeItems = [];
    MockData.resCatalog.forEach(function (cat) {
      cat.types.forEach(function (t) {
        var ops = t.approvalOps || [];
        ops.forEach(function (op) {
          var pf = findPlatformFlow(t.name, op, '');
          var df = findDeptFlow(t.name, op, '');
          treeItems.push({
            category: cat.name, resType: t.name, opType: op, subRes: '',
            flowTemplate: pf ? pf.flowTemplate : '',
            admin1: df ? df.admin1 : '', admin2: df ? df.admin2 : '',
            customized: df ? df.customized : false,
            deptFlow: df
          });
        });
        (t.children || []).forEach(function (child) {
          var childOps = child.approvalOps || [];
          childOps.forEach(function (op) {
            var pf = findPlatformFlow(t.name, op, child.name);
            var df = findDeptFlow(t.name, op, child.name);
            treeItems.push({
              category: cat.name, resType: t.name, opType: op, subRes: child.name,
              flowTemplate: pf ? pf.flowTemplate : '',
              admin1: df ? df.admin1 : '', admin2: df ? df.admin2 : '',
              customized: df ? df.customized : false,
              deptFlow: df
            });
          });
        });
      });
    });

    var result = groupByCategory(treeItems, categoryOrder);
    var html = '<div class="ant-card"><div class="ant-card-head"><span>资源审批配置</span></div><div class="ant-card-body" style="padding:0;">';
    html += '<div class="ant-alert ant-alert-info" style="margin:16px 16px 0;">部门只能修改审批流程中的"指定审批人"节点，审批流程模板由平台统一配置。</div>';

    result.sortedKeys.forEach(function (catName, catIdx) {
      var items = result.groups[catName];
      var isExpanded = !state.deptConfig.approvalCollapsed[catIdx];
      html += '<div class="catalog-category-section" style="margin:16px 16px 0;">';
      html += '<div class="catalog-category-header" data-cat-toggle="deptApproval-' + catIdx + '">';
      html += '<div class="catalog-category-left">';
      html += '<span class="catalog-category-arrow' + (isExpanded ? ' expanded' : '') + '">&#8250;</span>';
      html += '<span style="font-weight:500;font-size:14px;color:#1890ff;">' + esc(catName) + '</span>';
      html += '<span style="font-weight:normal;font-size:12px;color:var(--text-secondary);margin-left:8px;">(' + items.length + ' 项)</span>';
      html += '</div></div>';
      html += '<div class="catalog-category-body' + (isExpanded ? '' : ' collapsed') + '" data-cat-body="deptApproval-' + catIdx + '">';
      html += '<table class="ant-table" style="table-layout:fixed;"><thead><tr>';
      html += '<th style="width:18%;">资源类型</th>';
      html += '<th style="width:12%;">操作类型</th>';
      html += '<th style="width:22%;">审批流程</th>';
      html += '<th style="width:12%;">指定人员1</th>';
      html += '<th style="width:12%;">指定人员2</th>';
      html += '<th style="width:10%;">状态</th>';
      html += '<th style="width:14%;">操作</th>';
      html += '</tr></thead><tbody>';
      items.forEach(function (item, idx) {
        var isChild = !!item.subRes;
        html += '<tr>';
        html += '<td style="padding-left:' + (isChild ? '44px' : '28px') + ';">';
        if (isChild) html += '<span style="color:#ccc;margin-right:4px;">└─</span>';
        html += esc(isChild ? item.subRes : item.resType);
        html += '</td>';
        html += '<td>' + esc(item.opType) + '</td>';
        html += '<td style="font-size:12px;">';
        if (item.flowTemplate) {
          html += esc(getFlowLabel(item.flowTemplate));
        } else {
          html += '<span style="color:var(--text-secondary);">--</span>';
        }
        html += '</td>';
        html += '<td>' + (item.admin1 ? esc(item.admin1) : '<span style="color:var(--text-secondary);">--</span>') + '</td>';
        html += '<td>' + (item.admin2 ? esc(item.admin2) : '<span style="color:var(--text-secondary);">--</span>') + '</td>';
        html += '<td>';
        if (item.customized) {
          html += '<span class="ant-tag ant-tag-orange">自定义</span>';
        } else {
          html += '<span class="ant-tag ant-tag-blue">系统默认</span>';
        }
        html += '</td>';
        html += '<td>';
        if (item.flowTemplate) {
          html += '<a class="ant-btn-link dept-approval-preview-btn" data-flow="' + esc(item.flowTemplate) + '" data-admin1="' + esc(item.admin1) + '" data-admin2="' + esc(item.admin2) + '">预览</a>';
        }
        if (item.flowTemplate && (item.flowTemplate.indexOf('admin1') !== -1 || item.flowTemplate.indexOf('admin2') !== -1)) {
          html += ' <a class="ant-btn-link dept-approval-edit-btn" data-res="' + esc(item.resType) + '" data-op="' + esc(item.opType) + '" data-sub="' + esc(item.subRes) + '" data-flow="' + esc(item.flowTemplate) + '" data-cat="' + esc(item.category) + '" style="margin-left:6px;">编辑</a>';
          if (item.customized) {
            html += ' <a class="ant-btn-link dept-approval-restore-btn" data-res="' + esc(item.resType) + '" data-op="' + esc(item.opType) + '" data-sub="' + esc(item.subRes) + '" style="margin-left:6px;color:#faad14;">恢复默认</a>';
          }
        } else if (!item.flowTemplate) {
          html += '<span style="color:var(--text-secondary);">--</span>';
        }
        html += '</td>';
        html += '</tr>';
      });
      html += '</tbody></table>';
      html += '</div></div>'; // close catalog-category-body and catalog-category-section
    });
    html += '</div></div>';
    container.innerHTML = html;

    // 绑定大类折叠/展开
    container.querySelectorAll('.catalog-category-header').forEach(function (header) {
      header.onclick = function () {
        var key = header.getAttribute('data-cat-toggle');
        var catIdx = parseInt(key.replace('deptApproval-', ''));
        var body = container.querySelector('[data-cat-body="' + key + '"]');
        var arrow = header.querySelector('.catalog-category-arrow');
        if (body.classList.contains('collapsed')) {
          body.classList.remove('collapsed');
          arrow.classList.add('expanded');
          delete state.deptConfig.approvalCollapsed[catIdx];
        } else {
          body.classList.add('collapsed');
          arrow.classList.remove('expanded');
          state.deptConfig.approvalCollapsed[catIdx] = true;
        }
      };
    });

    // 编辑按钮
    container.querySelectorAll('.dept-approval-edit-btn').forEach(function (btn) {
      btn.onclick = function () {
        var resType = btn.getAttribute('data-res');
        var opType = btn.getAttribute('data-op');
        var subRes = btn.getAttribute('data-sub');
        var flowTemplate = btn.getAttribute('data-flow');
        var category = btn.getAttribute('data-cat');
        var df = findDeptFlow(resType, opType, subRes);
        showDeptFlowEditModal({
          resType: resType, opType: opType, subRes: subRes, category: category,
          flowTemplate: flowTemplate,
          admin1: df ? df.admin1 : '', admin2: df ? df.admin2 : '',
          customized: df ? df.customized : false,
          deptFlow: df
        }, cfg, deptId, function () {
          renderDeptApproval(container, cfg, deptId);
        });
      };
    });

    // 恢复默认按钮
    container.querySelectorAll('.dept-approval-restore-btn').forEach(function (btn) {
      btn.onclick = function () {
        var resType = btn.getAttribute('data-res');
        var opType = btn.getAttribute('data-op');
        var subRes = btn.getAttribute('data-sub');
        var df = findDeptFlow(resType, opType, subRes);
        if (df) {
          // 找部门负责人作为默认
          var deptLeader = '';
          var deptName = cfg.deptName || '';
          MockData.members.forEach(function (m) {
            if (m.role === '部门负责人' && m.orgName === deptName) deptLeader = m.name;
          });
          df.admin1 = deptLeader;
          df.admin2 = '';
          df.customized = false;
        }
        showMessage(resType + (subRes ? ' / ' + subRes : '') + ' ' + opType + ' 审批流程已恢复为系统默认', 'success');
        renderDeptApproval(container, cfg, deptId);
      };
    });

    // 预览按钮
    var deptLeaderForPreview = '';
    MockData.members.forEach(function (m) {
      if (m.role === '部门负责人' && m.orgName === (cfg.deptName || '')) deptLeaderForPreview = m.name;
    });
    container.querySelectorAll('.dept-approval-preview-btn').forEach(function (btn) {
      btn.onclick = function () {
        var flowTpl = btn.getAttribute('data-flow');
        var a1 = btn.getAttribute('data-admin1');
        var a2 = btn.getAttribute('data-admin2');
        var previewHtml = '<div class="ant-modal-overlay" style="display:flex;">';
        previewHtml += '<div class="ant-modal" style="width:640px;">';
        previewHtml += '<div class="ant-modal-header">审批流程预览 <button class="ant-modal-close" onclick="hideModal()">&times;</button></div>';
        previewHtml += '<div class="ant-modal-body" style="padding:24px;">';
        previewHtml += '<div style="margin-bottom:12px;"><span class="ant-tag ant-tag-blue" style="font-size:13px;padding:4px 10px;">' + esc(getFlowLabel(flowTpl)) + '</span></div>';
        previewHtml += renderFlowStepsPreview(flowTpl, a1, a2, deptLeaderForPreview);
        previewHtml += '</div>';
        previewHtml += '<div class="ant-modal-footer"><button class="ant-btn" onclick="hideModal()">关闭</button></div>';
        previewHtml += '</div></div>';
        var modalContainer = document.getElementById('modal-container');
        modalContainer.innerHTML = previewHtml;
        var overlay = modalContainer.querySelector('.ant-modal-overlay');
        if (overlay) overlay.onclick = function (e) { if (e.target === overlay) hideModal(); };
      };
    });
  }

  function showDeptFlowEditModal(item, cfg, deptId, onSave) {
    var resLabel = item.subRes ? item.resType + ' / ' + item.subRes : item.resType;
    var flowTemplate = item.flowTemplate || '';
    var curAdmin1 = item.admin1 || '';
    var curAdmin2 = item.admin2 || '';
    // 找部门负责人
    var deptName = cfg.deptName || '';
    var deptLeader = '';
    MockData.members.forEach(function (m) {
      if (m.role === '部门负责人' && m.orgName === deptName) deptLeader = m.name;
    });
    if (!curAdmin1) curAdmin1 = deptLeader;
    // 筛选可选人员：部门负责人 + 组长
    var candidates = [];
    MockData.members.forEach(function (m) {
      if (m.role === '部门负责人' || m.role === '组长') {
        candidates.push(m);
      }
    });

    var needAdmin2 = flowTemplate.indexOf('admin2') !== -1;
    var needAdmin1 = flowTemplate.indexOf('admin1') !== -1 || needAdmin2;

    var html = '<div class="ant-modal-overlay" style="display:flex;">';
    html += '<div class="ant-modal" style="width:600px;">';
    html += '<div class="ant-modal-header">编辑审批人员 - ' + esc(resLabel) + ' / ' + esc(item.opType) + ' <button class="ant-modal-close" onclick="hideModal()">&times;</button></div>';
    html += '<div class="ant-modal-body">';

    // 平台审批流程（只读）
    html += '<div class="ant-form-item"><div class="ant-form-label">审批流程模板</div>';
    html += '<div class="ant-form-control"><span class="ant-tag ant-tag-blue" style="font-size:13px;padding:4px 10px;">' + esc(getFlowLabel(flowTemplate)) + '</span>';
    html += '<span style="font-size:12px;color:var(--text-secondary);margin-left:8px;">（由平台配置，不可修改）</span></div></div>';

    // 指定人员1
    if (needAdmin1) {
      html += '<div class="ant-form-item"><div class="ant-form-label"><span class="required">*</span>指定审批人1</div>';
      html += '<div class="ant-form-control"><select class="ant-select" id="dept-flow-admin1" style="width:100%;max-width:280px;">';
      html += '<option value="">请选择</option>';
      candidates.forEach(function (m) {
        html += '<option value="' + esc(m.name) + '"' + (m.name === curAdmin1 ? ' selected' : '') + '>' + esc(m.name) + '（' + esc(m.role) + ' - ' + esc(m.orgName) + '）</option>';
      });
      html += '</select></div></div>';
    }

    // 指定人员2
    if (needAdmin2) {
      html += '<div class="ant-form-item"><div class="ant-form-label"><span class="required">*</span>指定审批人2</div>';
      html += '<div class="ant-form-control"><select class="ant-select" id="dept-flow-admin2" style="width:100%;max-width:280px;">';
      html += '<option value="">请选择</option>';
      candidates.forEach(function (m) {
        html += '<option value="' + esc(m.name) + '"' + (m.name === curAdmin2 ? ' selected' : '') + '>' + esc(m.name) + '（' + esc(m.role) + ' - ' + esc(m.orgName) + '）</option>';
      });
      html += '</select></div></div>';
    }

    // 实时预览区域
    html += '<div class="ant-form-item" style="align-items:flex-start;"><div class="ant-form-label" style="line-height:32px;">流程预览</div>';
    html += '<div class="ant-form-control"><div id="dept-flow-preview" style="padding:12px;background:#fafafa;border:1px solid #f0f0f0;border-radius:4px;">';
    html += renderFlowStepsPreview(flowTemplate, curAdmin1, curAdmin2, deptLeader);
    html += '</div></div></div>';

    html += '</div>';
    html += '<div class="ant-modal-footer"><button class="ant-btn" onclick="hideModal()">取消</button><button class="ant-btn ant-btn-primary" id="dept-flow-save">确定</button></div>';
    html += '</div></div>';

    var modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = html;
    var overlay = modalContainer.querySelector('.ant-modal-overlay');
    if (overlay) overlay.onclick = function (e) { if (e.target === overlay) hideModal(); };

    // 实时更新预览
    function updatePreview() {
      var a1 = needAdmin1 && document.getElementById('dept-flow-admin1') ? document.getElementById('dept-flow-admin1').value : '';
      var a2 = needAdmin2 && document.getElementById('dept-flow-admin2') ? document.getElementById('dept-flow-admin2').value : '';
      var previewEl = document.getElementById('dept-flow-preview');
      if (previewEl) previewEl.innerHTML = renderFlowStepsPreview(flowTemplate, a1, a2, deptLeader);
    }
    if (needAdmin1 && document.getElementById('dept-flow-admin1')) {
      document.getElementById('dept-flow-admin1').onchange = updatePreview;
    }
    if (needAdmin2 && document.getElementById('dept-flow-admin2')) {
      document.getElementById('dept-flow-admin2').onchange = updatePreview;
    }

    // 保存
    document.getElementById('dept-flow-save').onclick = function () {
      var newAdmin1 = needAdmin1 && document.getElementById('dept-flow-admin1') ? document.getElementById('dept-flow-admin1').value : '';
      var newAdmin2 = needAdmin2 && document.getElementById('dept-flow-admin2') ? document.getElementById('dept-flow-admin2').value : '';
      if (needAdmin1 && !newAdmin1) { showMessage('请选择指定审批人1', 'warning'); return; }
      if (needAdmin2 && !newAdmin2) { showMessage('请选择指定审批人2', 'warning'); return; }
      // 更新或创建部门流程配置
      var df = item.deptFlow;
      if (df) {
        df.admin1 = newAdmin1;
        df.admin2 = newAdmin2;
        df.customized = true;
      } else {
        cfg.approvalFlows.push({
          id: 'flow-new-' + Date.now(),
          resType: item.resType, opType: item.opType, category: item.category || '',
          subRes: item.subRes || '',
          customized: true, admin1: newAdmin1, admin2: newAdmin2
        });
      }
      hideModal();
      showMessage(resLabel + ' ' + item.opType + ' 审批人员已更新', 'success');
      if (onSave) onSave();
    };
  }

  // ===== 侧边栏 =====
  function collapseAllMenuGroups() {
    document.querySelectorAll('.menu-submenu').forEach(function (body) {
      body.classList.add('collapsed');
    });
    document.querySelectorAll('.menu-group-toggle').forEach(function (toggle) {
      toggle.classList.remove('expanded');
    });
  }

  function expandMenuGroup(groupId) {
    var body = document.querySelector('.menu-submenu[data-menu-group-body="' + groupId + '"]');
    var toggle = document.querySelector('.menu-group-toggle[data-menu-group="' + groupId + '"]');
    if (body) body.classList.remove('collapsed');
    if (toggle) toggle.classList.add('expanded');
  }

  function expandMenuGroupOf(menuItem) {
    var parent = menuItem.closest('.menu-submenu');
    if (parent) {
      var groupId = parent.getAttribute('data-menu-group-body');
      expandMenuGroup(groupId);
    }
  }

  function initSidebar() {
    document.querySelectorAll('.menu-item[data-page]').forEach(function (item) {
      item.onclick = function () {
        collapseAllMenuGroups();
        expandMenuGroupOf(item);
        switchPage(item.getAttribute('data-page'), item);
      };
    });
    // 折叠/展开菜单组（允许多组同时展开）
    document.querySelectorAll('.menu-group-toggle[data-menu-group]').forEach(function (toggle) {
      toggle.onclick = function () {
        var groupId = toggle.getAttribute('data-menu-group');
        var body = document.querySelector('.menu-submenu[data-menu-group-body="' + groupId + '"]');
        if (!body) return;
        var isCollapsed = body.classList.contains('collapsed');
        if (isCollapsed) {
          body.classList.remove('collapsed');
          toggle.classList.add('expanded');
        } else {
          body.classList.add('collapsed');
          toggle.classList.remove('expanded');
        }
      };
    });
    // 初始化时自动展开 active 菜单所在的组
    var activeItem = document.querySelector('.menu-item.active');
    if (activeItem) expandMenuGroupOf(activeItem);
  }

  // ===== 申请资源动态表单 =====
  function initApplyResourceModal() {
    var sel = document.getElementById('modal-apply-res-type');
    var formContainer = document.getElementById('modal-apply-dynamic-form');
    var pricingContainer = document.getElementById('modal-apply-pricing');
    if (!sel || !formContainer) return;

    // 填充资源组下拉
    var resGroupSel = document.getElementById('modal-apply-res-group');
    if (resGroupSel) {
      MockData.projects.forEach(function (p) {
        var opt = document.createElement('option');
        opt.value = p.name;
        opt.textContent = p.name + '（' + p.dept + '）';
        resGroupSel.appendChild(opt);
      });
    }

    // 筛选有已配置申请操作模板的资源
    var applyTemplates = MockData.platformTemplates.filter(function (tpl) {
      return tpl.opType === '申请';
    });
    // 去重资源类型
    var seen = {};
    applyTemplates.forEach(function (tpl) {
      if (!seen[tpl.resType]) {
        seen[tpl.resType] = tpl;
        var opt = document.createElement('option');
        opt.value = tpl.id;
        opt.textContent = tpl.resType + '（' + tpl.category + '）';
        sel.appendChild(opt);
      }
    });

    // 价格参考数据（模拟单价，元/月）
    var unitPrices = {
      'ECS 云服务器': 760, 'K8S 集群': 2400, 'RDS 云数据库': 980,
      'PolarDB PostgreSQL': 1200, 'MongoDB': 680, 'Redis 缓存': 340,
      'SLB 负载均衡': 120, 'ALB 应用负载均衡': 180, 'NLB 网络负载均衡': 150,
      'Kafka 消息队列': 880, 'Elasticsearch': 960, 'MaxCompute': 1500,
      'Flink 实时计算': 1200, 'OSS 对象存储': 200, 'CDN 流量包': 300,
      '块存储 ESSD': 80, '文件存储 NAS': 160, '云原生网关': 400, '实时数仓 Hologres': 1800
    };
    var periodMonths = { '1m': 1, '3m': 3, '6m': 6, '1y': 12, '2y': 24, '3y': 36 };

    function updatePricing() {
      var unitPriceEl = document.getElementById('modal-apply-unit-price');
      var totalPriceEl = document.getElementById('modal-apply-total-price');
      var quantityEl = document.getElementById('modal-apply-quantity');
      var payTypeEl = document.getElementById('modal-apply-pay-type');
      var periodEl = document.getElementById('modal-apply-period');
      var periodItem = document.getElementById('modal-apply-period-item');
      if (!unitPriceEl || !totalPriceEl) return;

      var isPostpaid = payTypeEl && payTypeEl.value === 'postpaid';
      if (periodItem) periodItem.style.display = isPostpaid ? 'none' : '';

      var tplId = sel.value;
      var tpl = null;
      for (var i = 0; i < MockData.platformTemplates.length; i++) {
        if (MockData.platformTemplates[i].id === tplId) { tpl = MockData.platformTemplates[i]; break; }
      }
      if (!tpl) { unitPriceEl.textContent = '--'; totalPriceEl.textContent = '--'; return; }

      var basePrice = unitPrices[tpl.resType] || 0;
      var qty = parseInt(quantityEl ? quantityEl.value : 1) || 1;

      if (isPostpaid) {
        var hourly = (basePrice / 720).toFixed(4);
        unitPriceEl.textContent = '¥' + hourly + ' /小时（按量）';
        totalPriceEl.textContent = '按量计费';
      } else {
        var months = periodEl ? (periodMonths[periodEl.value] || 1) : 1;
        var unitTotal = basePrice;
        var grandTotal = basePrice * qty * months;
        unitPriceEl.textContent = '¥' + unitTotal.toLocaleString() + ' /月/实例';
        totalPriceEl.textContent = '¥' + grandTotal.toLocaleString() + ' 元';
      }
    }

    sel.onchange = function () {
      var tplId = sel.value;
      if (!tplId) {
        formContainer.innerHTML = '';
        if (pricingContainer) pricingContainer.style.display = 'none';
        return;
      }
      var tpl = null;
      for (var i = 0; i < MockData.platformTemplates.length; i++) {
        if (MockData.platformTemplates[i].id === tplId) { tpl = MockData.platformTemplates[i]; break; }
      }
      if (!tpl) { formContainer.innerHTML = ''; return; }

      // 合并当前部门的 fieldOverrides 到模板副本
      var mergedTpl = JSON.parse(JSON.stringify(tpl));
      var deptCfg = MockData.deptConfig['dept-infra']; // 原型中固定为 dept-infra
      var deptTplEntry = deptCfg && (deptCfg.templates || []).find(function (t) { return t.id === tplId; });
      var deptOverrides = (deptTplEntry && deptTplEntry.fieldOverrides) || {};
      var unconfiguredRequired = [];

      (mergedTpl.fieldGroups || []).forEach(function (group, gIdx) {
        group.fields.forEach(function (field) {
          var key = gIdx + '|' + field.param;
          var ov = deptOverrides[key] || {};
          if (ov.show === false) { field.visible = false; return; }
          if (field.type === 'select') {
            if (ov.cascadeFrom) {
              field.cascadeFrom = ov.cascadeFrom;
              field.cascadeData = ov.cascadeData || '';
              field.options = '';
            } else if (ov.options) {
              field.options = ov.options;
              field.cascadeFrom = '';
              field.cascadeData = '';
            } else {
              // 使用参考选项作为兜底（如果有）
              field.options = field.referenceOptions || '';
              field.cascadeFrom = '';
              field.cascadeData = '';
              if (field.required && field.visible !== false) {
                unconfiguredRequired.push(field.name);
              }
            }
          }
          if (ov.fixedValue) { field.type = 'fixed'; field.fixedValue = ov.fixedValue; }
          if (ov.defaultValue) field.defaultValue = ov.defaultValue;
          if (ov.regex) field.regex = ov.regex;
          if (ov.deptMin !== undefined) field.min = ov.deptMin;
          if (ov.deptMax !== undefined) field.max = ov.deptMax;
        });
      });

      var html = '<div class="ant-divider"></div>';
      if (unconfiguredRequired.length > 0) {
        html += '<div style="background:#fff7e6;border:1px solid #ffd591;border-radius:4px;padding:10px 14px;margin-bottom:12px;font-size:13px;color:#874d00;">';
        html += '&#9888; 以下必填字段尚未配置选项，申请可能无法完成，请联系部门负责人在"部门配置"中完善：';
        html += '<strong>' + esc(unconfiguredRequired.join('、')) + '</strong>';
        html += '</div>';
      }
      html += '<div style="font-size:14px;font-weight:500;margin-bottom:16px;color:var(--text-color);">' + esc(tpl.resType) + ' - 申请参数</div>';
      html += renderTemplateFormFields(mergedTpl, { disabled: false });
      formContainer.innerHTML = html;
      initCascadeFields(formContainer);
      if (pricingContainer) pricingContainer.style.display = '';
      updatePricing();
    };

    // 绑定计费配置变化
    ['modal-apply-quantity', 'modal-apply-pay-type', 'modal-apply-period'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.oninput = el.onchange = updatePricing;
    });
  }

  // =============================================
  // 申请记录页
  // =============================================
  function initApplyRecordsPage() {
    var searchEl = document.getElementById('apply-record-search');
    if (searchEl) searchEl.oninput = function () { state.applyRecords.keyword = searchEl.value; state.applyRecords.page = 1; renderApplyRecords(); };
    var statusFilter = document.getElementById('apply-record-status-filter');
    if (statusFilter) statusFilter.onchange = function () { state.applyRecords.statusFilter = statusFilter.value; state.applyRecords.page = 1; renderApplyRecords(); };
    var typeFilter = document.getElementById('apply-record-type-filter');
    if (typeFilter) typeFilter.onchange = function () { state.applyRecords.typeFilter = typeFilter.value; state.applyRecords.page = 1; renderApplyRecords(); };
    renderApplyRecords();
  }

  function renderApplyRecords() {
    var s = state.applyRecords;
    var filtered = MockData.applicationRecords.filter(function (r) {
      if (s.keyword) {
        var kw = s.keyword.toLowerCase();
        if (r.id.toLowerCase().indexOf(kw) === -1 && r.title.toLowerCase().indexOf(kw) === -1) return false;
      }
      if (s.statusFilter && r.status !== s.statusFilter) return false;
      if (s.typeFilter && r.type !== s.typeFilter) return false;
      return true;
    });
    var total = filtered.length;
    var start = (s.page - 1) * PAGE_SIZE;
    var pageData = filtered.slice(start, start + PAGE_SIZE);
    var statusColors = { '审批中': 'processing', '已通过': 'success', '已驳回': 'error', '已撤回': 'default' };
    var typeLabels = { 'resource': '资源操作', 'subaccount': '子账号申请' };
    var typeColors = { 'resource': 'blue', 'subaccount': 'purple' };

    var tableContainer = document.getElementById('apply-record-table-container');
    if (!tableContainer) return;
    var html = '<table class="ant-table"><thead><tr><th>申请单号</th><th>标题</th><th>类型</th><th>操作类型</th><th>状态</th><th>申请人</th><th>申请时间</th><th>操作</th></tr></thead><tbody>';
    if (pageData.length === 0) {
      html += '<tr><td colspan="8" style="text-align:center;color:var(--text-secondary);padding:32px;">暂无数据</td></tr>';
    }
    pageData.forEach(function (r) {
      html += '<tr><td style="white-space:nowrap;font-family:monospace;font-size:12px;">' + esc(r.id) + '</td>';
      html += '<td>' + esc(r.title) + '</td>';
      html += '<td><span class="ant-tag ant-tag-' + (typeColors[r.type] || 'default') + '">' + esc(typeLabels[r.type] || r.type) + '</span></td>';
      html += '<td>' + esc(r.opType) + '</td>';
      html += '<td><span class="ant-badge-status-dot ant-badge-status-' + (statusColors[r.status] || 'default') + '"></span>' + esc(r.status) + '</td>';
      html += '<td>' + esc(r.applicant) + '</td>';
      html += '<td style="white-space:nowrap;">' + esc(r.createTime) + '</td>';
      html += '<td><a class="ant-btn-link apply-record-view-btn" data-record-id="' + esc(r.id) + '">查看</a></td></tr>';
    });
    html += '</tbody></table><div id="apply-record-pagination"></div>';
    tableContainer.innerHTML = html;
    var pagEl = document.getElementById('apply-record-pagination');
    if (pagEl) renderPagination(pagEl, total, s.page, PAGE_SIZE, function (p) { s.page = p; renderApplyRecords(); });

    tableContainer.querySelectorAll('.apply-record-view-btn').forEach(function (btn) {
      btn.onclick = function () {
        var recordId = btn.getAttribute('data-record-id');
        var record = null;
        for (var i = 0; i < MockData.applicationRecords.length; i++) {
          if (MockData.applicationRecords[i].id === recordId) { record = MockData.applicationRecords[i]; break; }
        }
        if (record) showApplyDetailModal(record);
      };
    });
  }

  // =============================================
  // 审核记录页
  // =============================================
  function initReviewRecordsPage() {
    var searchEl = document.getElementById('review-record-search');
    if (searchEl) searchEl.oninput = function () { state.reviewRecords.keyword = searchEl.value; state.reviewRecords.page = 1; renderReviewRecords(); };
    var statusFilter = document.getElementById('review-record-status-filter');
    if (statusFilter) statusFilter.onchange = function () { state.reviewRecords.statusFilter = statusFilter.value; state.reviewRecords.page = 1; renderReviewRecords(); };
    renderReviewRecords();
  }

  function getReviewRecords() {
    // 获取当前用户（admin）需要审核或已审核的记录
    var currentUser = 'admin'; // 模拟当前用户
    var reviewerNames = ['张明远', '李思远', '刘佳琪', '周文博']; // admin 可能对应的审核人身份
    var results = [];
    MockData.applicationRecords.forEach(function (r) {
      var isReviewer = false;
      var currentNode = '';
      var myStatus = ''; // pending | done | rejected
      for (var i = 0; i < r.flowNodes.length; i++) {
        var node = r.flowNodes[i];
        if (node.role === '申请人') continue;
        if (reviewerNames.indexOf(node.name) !== -1) {
          isReviewer = true;
          if (node.status === 'pending') { myStatus = 'pending'; }
          else if (node.status === 'done') { if (!myStatus) myStatus = 'done'; }
          else if (node.status === 'rejected') { myStatus = 'rejected'; }
        }
      }
      // 找当前节点
      for (var j = 0; j < r.flowNodes.length; j++) {
        if (r.flowNodes[j].status === 'pending') { currentNode = r.flowNodes[j].role + '（' + r.flowNodes[j].name + '）'; break; }
      }
      if (!currentNode) {
        if (r.status === '已通过') currentNode = '已完成';
        else if (r.status === '已驳回') currentNode = '已驳回';
        else if (r.status === '已撤回') currentNode = '已撤回';
      }
      if (isReviewer) {
        results.push({ record: r, currentNode: currentNode, myStatus: myStatus });
      }
    });
    return results;
  }

  function renderReviewRecords() {
    var s = state.reviewRecords;
    var allReviews = getReviewRecords();
    var filtered = allReviews.filter(function (item) {
      if (s.keyword) {
        var kw = s.keyword.toLowerCase();
        if (item.record.id.toLowerCase().indexOf(kw) === -1 && item.record.title.toLowerCase().indexOf(kw) === -1) return false;
      }
      if (s.statusFilter === 'pending' && item.myStatus !== 'pending') return false;
      if (s.statusFilter === 'done' && item.myStatus === 'pending') return false;
      return true;
    });
    var total = filtered.length;
    var start = (s.page - 1) * PAGE_SIZE;
    var pageData = filtered.slice(start, start + PAGE_SIZE);
    var statusColors = { '审批中': 'processing', '已通过': 'success', '已驳回': 'error', '已撤回': 'default' };

    var tableContainer = document.getElementById('review-record-table-container');
    if (!tableContainer) return;
    var html = '<table class="ant-table"><thead><tr><th>申请单号</th><th>标题</th><th>申请人</th><th>申请部门</th><th>当前节点</th><th>状态</th><th>申请时间</th><th>操作</th></tr></thead><tbody>';
    if (pageData.length === 0) {
      html += '<tr><td colspan="8" style="text-align:center;color:var(--text-secondary);padding:32px;">暂无数据</td></tr>';
    }
    pageData.forEach(function (item) {
      var r = item.record;
      html += '<tr><td style="white-space:nowrap;font-family:monospace;font-size:12px;">' + esc(r.id) + '</td>';
      html += '<td>' + esc(r.title) + '</td>';
      html += '<td>' + esc(r.applicant) + '</td>';
      html += '<td>' + esc(r.applicantDept) + '</td>';
      html += '<td>' + esc(item.currentNode) + '</td>';
      html += '<td><span class="ant-badge-status-dot ant-badge-status-' + (statusColors[r.status] || 'default') + '"></span>' + esc(r.status) + '</td>';
      html += '<td style="white-space:nowrap;">' + esc(r.createTime) + '</td>';
      html += '<td>';
      if (item.myStatus === 'pending') {
        html += '<a class="ant-btn-link review-record-action-btn" data-record-id="' + esc(r.id) + '">审核</a>';
      } else {
        html += '<a class="ant-btn-link review-record-view-btn" data-record-id="' + esc(r.id) + '">查看</a>';
      }
      html += '</td></tr>';
    });
    html += '</tbody></table><div id="review-record-pagination"></div>';
    tableContainer.innerHTML = html;
    var pagEl = document.getElementById('review-record-pagination');
    if (pagEl) renderPagination(pagEl, total, s.page, PAGE_SIZE, function (p) { s.page = p; renderReviewRecords(); });

    tableContainer.querySelectorAll('.review-record-view-btn').forEach(function (btn) {
      btn.onclick = function () {
        var recordId = btn.getAttribute('data-record-id');
        var record = null;
        for (var i = 0; i < MockData.applicationRecords.length; i++) {
          if (MockData.applicationRecords[i].id === recordId) { record = MockData.applicationRecords[i]; break; }
        }
        if (record) showApplyDetailModal(record);
      };
    });

    tableContainer.querySelectorAll('.review-record-action-btn').forEach(function (btn) {
      btn.onclick = function () {
        var recordId = btn.getAttribute('data-record-id');
        var record = null;
        for (var i = 0; i < MockData.applicationRecords.length; i++) {
          if (MockData.applicationRecords[i].id === recordId) { record = MockData.applicationRecords[i]; break; }
        }
        if (record) showReviewDetailModal(record, function () { renderReviewRecords(); });
      };
    });
  }

  // =============================================
  // 流程节点状态条
  // =============================================
  function renderFlowNodesStatus(flowNodes) {
    if (!flowNodes || !flowNodes.length) return '<span style="color:var(--text-secondary);">无流程信息</span>';
    var statusStyles = {
      'done': { bg: '#f6ffed', border: '#b7eb8f', color: '#52c41a', icon: '&#10003;', label: '已完成' },
      'pending': { bg: '#e6f7ff', border: '#91d5ff', color: '#1890ff', icon: '&#9998;', label: '审核中' },
      'waiting': { bg: '#f5f5f5', border: '#d9d9d9', color: '#999', icon: '&#9203;', label: '等待中' },
      'rejected': { bg: '#fff2f0', border: '#ffa39e', color: '#ff4d4f', icon: '&#10007;', label: '已驳回' }
    };
    var html = '<div style="display:flex;align-items:flex-start;gap:0;overflow-x:auto;padding:8px 0;">';
    flowNodes.forEach(function (node, idx) {
      var s = statusStyles[node.status] || statusStyles['waiting'];
      html += '<div style="display:flex;align-items:center;">';
      html += '<div style="text-align:center;min-width:100px;max-width:140px;">';
      html += '<div style="width:36px;height:36px;border-radius:50%;background:' + s.bg + ';border:2px solid ' + s.border + ';display:inline-flex;align-items:center;justify-content:center;color:' + s.color + ';font-size:16px;font-weight:bold;">' + s.icon + '</div>';
      html += '<div style="font-size:12px;font-weight:500;margin-top:4px;color:' + s.color + ';">' + esc(node.role) + '</div>';
      html += '<div style="font-size:11px;color:var(--text-secondary);">' + esc(node.name) + '</div>';
      if (node.time) html += '<div style="font-size:10px;color:var(--text-secondary);">' + esc(node.time) + '</div>';
      if (node.remark) html += '<div style="font-size:10px;color:' + s.color + ';max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="' + esc(node.remark) + '">' + esc(node.remark) + '</div>';
      html += '</div>';
      if (idx < flowNodes.length - 1) {
        html += '<div style="width:40px;height:2px;background:#d9d9d9;margin:18px 4px 0;flex-shrink:0;"></div>';
      }
      html += '</div>';
    });
    html += '</div>';
    return html;
  }

  // =============================================
  // 申请详情弹窗
  // =============================================
  function showApplyDetailModal(record) {
    var html = '<div class="ant-drawer-overlay" style="display:flex;">';
    html += '<div class="ant-drawer">';
    html += '<div class="ant-drawer-header">申请详情 - ' + esc(record.id) + ' <button class="ant-drawer-close" onclick="hideModal()">&times;</button></div>';
    html += '<div class="ant-drawer-body">';
    // 流程节点状态条
    html += '<div style="margin-bottom:20px;padding:16px;background:#fafafa;border-radius:8px;border:1px solid #f0f0f0;">';
    html += '<div style="font-size:13px;font-weight:500;margin-bottom:8px;color:var(--text-color);">审批流程</div>';
    html += renderFlowNodesStatus(record.flowNodes);
    html += '</div>';
    // 申请人信息
    html += '<div style="margin-bottom:20px;">';
    html += '<div style="font-size:13px;font-weight:500;margin-bottom:8px;color:var(--text-color);">申请信息</div>';
    html += '<div class="ant-descriptions" style="display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;">';
    html += '<div><span style="color:var(--text-secondary);font-size:12px;">申请单号</span><div>' + esc(record.id) + '</div></div>';
    html += '<div><span style="color:var(--text-secondary);font-size:12px;">申请人</span><div>' + esc(record.applicant) + '</div></div>';
    html += '<div><span style="color:var(--text-secondary);font-size:12px;">部门 / 组</span><div>' + esc(record.applicantDept) + ' / ' + esc(record.applicantGroup) + '</div></div>';
    html += '<div><span style="color:var(--text-secondary);font-size:12px;">申请时间</span><div>' + esc(record.createTime) + '</div></div>';
    html += '<div><span style="color:var(--text-secondary);font-size:12px;">状态</span><div>' + esc(record.status) + '</div></div>';
    html += '<div><span style="color:var(--text-secondary);font-size:12px;">审批流程</span><div>' + esc(getFlowLabel(record.flowTemplate)) + '</div></div>';
    html += '</div></div>';
    // 申请表单
    if (record.formData) {
      html += '<div>';
      html += '<div style="font-size:13px;font-weight:500;margin-bottom:8px;color:var(--text-color);">申请表单</div>';
      html += '<table class="ant-table" style="font-size:13px;"><tbody>';
      var keys = Object.keys(record.formData);
      for (var i = 0; i < keys.length; i++) {
        html += '<tr><td style="width:140px;color:var(--text-secondary);background:#fafafa;font-weight:500;">' + esc(keys[i]) + '</td><td>' + esc(record.formData[keys[i]]) + '</td></tr>';
      }
      html += '</tbody></table></div>';
    }
    html += '</div>';
    html += '<div class="ant-drawer-footer"><button class="ant-btn" onclick="hideModal()">关闭</button></div>';
    html += '</div></div>';

    var container = document.getElementById('modal-container');
    container.innerHTML = html;
    var overlay = container.querySelector('.ant-drawer-overlay');
    if (overlay) overlay.onclick = function (e) { if (e.target === overlay) hideModal(); };
  }

  // =============================================
  // 审核详情弹窗（含通过/驳回）
  // =============================================
  function showReviewDetailModal(record, onAction) {
    var html = '<div class="ant-drawer-overlay" style="display:flex;">';
    html += '<div class="ant-drawer">';
    html += '<div class="ant-drawer-header">审核详情 - ' + esc(record.id) + ' <button class="ant-drawer-close" onclick="hideModal()">&times;</button></div>';
    html += '<div class="ant-drawer-body">';
    // 流程节点状态条
    html += '<div style="margin-bottom:20px;padding:16px;background:#fafafa;border-radius:8px;border:1px solid #f0f0f0;">';
    html += '<div style="font-size:13px;font-weight:500;margin-bottom:8px;color:var(--text-color);">审批流程</div>';
    html += renderFlowNodesStatus(record.flowNodes);
    html += '</div>';
    // 申请人信息
    html += '<div style="margin-bottom:20px;">';
    html += '<div style="font-size:13px;font-weight:500;margin-bottom:8px;color:var(--text-color);">申请信息</div>';
    html += '<div class="ant-descriptions" style="display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;">';
    html += '<div><span style="color:var(--text-secondary);font-size:12px;">申请单号</span><div>' + esc(record.id) + '</div></div>';
    html += '<div><span style="color:var(--text-secondary);font-size:12px;">申请人</span><div>' + esc(record.applicant) + '</div></div>';
    html += '<div><span style="color:var(--text-secondary);font-size:12px;">部门 / 组</span><div>' + esc(record.applicantDept) + ' / ' + esc(record.applicantGroup) + '</div></div>';
    html += '<div><span style="color:var(--text-secondary);font-size:12px;">申请时间</span><div>' + esc(record.createTime) + '</div></div>';
    html += '</div></div>';
    // 申请表单
    if (record.formData) {
      html += '<div style="margin-bottom:20px;">';
      html += '<div style="font-size:13px;font-weight:500;margin-bottom:8px;color:var(--text-color);">申请表单</div>';
      html += '<table class="ant-table" style="font-size:13px;"><tbody>';
      var keys = Object.keys(record.formData);
      for (var i = 0; i < keys.length; i++) {
        html += '<tr><td style="width:140px;color:var(--text-secondary);background:#fafafa;font-weight:500;">' + esc(keys[i]) + '</td><td>' + esc(record.formData[keys[i]]) + '</td></tr>';
      }
      html += '</tbody></table></div>';
    }
    // 审批操作区（仅当有 pending 节点时）
    var hasPending = false;
    for (var j = 0; j < record.flowNodes.length; j++) {
      if (record.flowNodes[j].status === 'pending') { hasPending = true; break; }
    }
    if (hasPending && record.status === '审批中') {
      html += '<div style="margin-top:16px;padding:16px;background:#e6f7ff;border:1px solid #91d5ff;border-radius:6px;">';
      html += '<div style="font-size:13px;font-weight:500;margin-bottom:8px;color:#1890ff;">审批操作</div>';
      html += '<div class="ant-form-item"><div class="ant-form-label">审批意见</div>';
      html += '<div class="ant-form-control"><textarea class="ant-textarea" id="review-remark" placeholder="请输入审批意见..." rows="3"></textarea></div></div>';
      html += '<div style="display:flex;gap:8px;justify-content:flex-end;">';
      html += '<button class="ant-btn" id="review-reject-btn" style="color:#ff4d4f;border-color:#ff4d4f;">驳回</button>';
      html += '<button class="ant-btn ant-btn-primary" id="review-approve-btn">通过</button>';
      html += '</div></div>';
    }
    html += '</div>';
    html += '<div class="ant-drawer-footer"><button class="ant-btn" onclick="hideModal()">关闭</button></div>';
    html += '</div></div>';

    var container = document.getElementById('modal-container');
    container.innerHTML = html;
    var overlay = container.querySelector('.ant-drawer-overlay');
    if (overlay) overlay.onclick = function (e) { if (e.target === overlay) hideModal(); };

    // 绑定通过/驳回按钮
    var approveBtn = document.getElementById('review-approve-btn');
    var rejectBtn = document.getElementById('review-reject-btn');
    if (approveBtn) {
      approveBtn.onclick = function () {
        var remark = (document.getElementById('review-remark') || {}).value || '';
        var now = new Date();
        var timeStr = now.getFullYear() + '/' + String(now.getMonth() + 1).padStart(2, '0') + '/' + String(now.getDate()).padStart(2, '0') + ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':00';
        // 当前 pending 节点 → done
        var allDone = true;
        var moved = false;
        for (var k = 0; k < record.flowNodes.length; k++) {
          if (record.flowNodes[k].status === 'pending' && !moved) {
            record.flowNodes[k].status = 'done';
            record.flowNodes[k].time = timeStr;
            record.flowNodes[k].remark = remark || '同意';
            moved = true;
            // 下一个 waiting → pending
            if (k + 1 < record.flowNodes.length && record.flowNodes[k + 1].status === 'waiting') {
              record.flowNodes[k + 1].status = 'pending';
              allDone = false;
            }
          } else if (record.flowNodes[k].status === 'waiting' || record.flowNodes[k].status === 'pending') {
            allDone = false;
          }
        }
        if (allDone) record.status = '已通过';
        record.updateTime = timeStr;
        hideModal();
        showMessage('审批通过', 'success');
        if (onAction) onAction();
      };
    }
    if (rejectBtn) {
      rejectBtn.onclick = function () {
        var remark = (document.getElementById('review-remark') || {}).value || '';
        if (!remark) { showMessage('请输入驳回原因', 'warning'); return; }
        var now = new Date();
        var timeStr = now.getFullYear() + '/' + String(now.getMonth() + 1).padStart(2, '0') + '/' + String(now.getDate()).padStart(2, '0') + ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':00';
        for (var k = 0; k < record.flowNodes.length; k++) {
          if (record.flowNodes[k].status === 'pending') {
            record.flowNodes[k].status = 'rejected';
            record.flowNodes[k].time = timeStr;
            record.flowNodes[k].remark = remark;
            break;
          }
        }
        record.status = '已驳回';
        record.statusClass = 'error';
        record.updateTime = timeStr;
        hideModal();
        showMessage('已驳回', 'info');
        if (onAction) onAction();
      };
    }
  }

  // =============================================
  // 部门配置 — 工单处理配置
  // =============================================
  function renderDeptTicketHandlers(container, cfg, deptId) {
    if (!cfg.ticketHandlers) {
      cfg.ticketHandlers = MockData.ticketCategories.map(function (cat) {
        var dept = MockData.findOrg(deptId);
        return { categoryId: cat.id, categoryName: cat.name, handler: dept ? dept.leader.name : '--', isDefault: true };
      });
    }
    var html = '<div class="ant-card"><div class="ant-card-head"><span>工单处理配置</span></div><div class="ant-card-body">';
    html += '<div class="ant-alert ant-alert-info" style="margin-bottom:16px;">每类工单默认由部门负责人处理，可为不同问题类别指定其他处理人。</div>';
    html += '<table class="ant-table"><thead><tr><th>问题类别</th><th>当前处理人</th><th>状态</th><th>操作</th></tr></thead><tbody>';
    cfg.ticketHandlers.forEach(function (th, idx) {
      html += '<tr>';
      html += '<td>' + esc(th.categoryName) + '</td>';
      html += '<td>' + esc(th.handler) + '</td>';
      html += '<td>';
      if (th.isDefault) {
        html += '<span class="ant-tag ant-tag-blue">默认</span>';
      } else {
        html += '<span class="ant-tag ant-tag-orange">自定义</span>';
      }
      html += '</td>';
      html += '<td><a class="ant-btn-link ticket-handler-edit-btn" data-idx="' + idx + '">编辑</a>';
      if (!th.isDefault) {
        html += ' <a class="ant-btn-link ticket-handler-restore-btn" data-idx="' + idx + '" style="margin-left:8px;color:#faad14;">恢复默认</a>';
      }
      html += '</td>';
      html += '</tr>';
    });
    html += '</tbody></table></div></div>';
    container.innerHTML = html;

    container.querySelectorAll('.ticket-handler-restore-btn').forEach(function (btn) {
      btn.onclick = function () {
        var idx = parseInt(btn.getAttribute('data-idx'));
        var th = cfg.ticketHandlers[idx];
        var dept = MockData.findOrg(deptId);
        var defaultHandler = dept && dept.leader ? dept.leader.name : '--';
        th.handler = defaultHandler;
        th.isDefault = true;
        showMessage(th.categoryName + ' 处理人已恢复为默认（' + defaultHandler + '）', 'success');
        renderDeptTicketHandlers(container, cfg, deptId);
      };
    });

    container.querySelectorAll('.ticket-handler-edit-btn').forEach(function (btn) {
      btn.onclick = function () {
        var idx = parseInt(btn.getAttribute('data-idx'));
        var th = cfg.ticketHandlers[idx];
        // 获取部门成员列表
        var deptOrg = MockData.findOrg(deptId);
        var memberIds = deptOrg ? MockData.getOrgAndChildIds(deptId) : [];
        var members = MockData.members.filter(function (m) { return memberIds.indexOf(m.orgId) !== -1; });

        var modalHtml = '<div class="ant-modal-overlay" style="display:flex;">';
        modalHtml += '<div class="ant-modal" style="width:480px;">';
        modalHtml += '<div class="ant-modal-header">编辑处理人 - ' + esc(th.categoryName) + ' <button class="ant-modal-close" onclick="hideModal()">&times;</button></div>';
        modalHtml += '<div class="ant-modal-body">';
        modalHtml += '<div class="ant-form-item"><div class="ant-form-label"><span class="required">*</span>处理人</div>';
        modalHtml += '<div class="ant-form-control"><select class="ant-select" id="ticket-handler-select" style="width:100%;">';
        members.forEach(function (m) {
          modalHtml += '<option value="' + esc(m.name) + '"' + (m.name === th.handler ? ' selected' : '') + '>' + esc(m.name) + '（' + esc(m.orgName) + '）</option>';
        });
        modalHtml += '</select></div></div>';
        modalHtml += '</div>';
        modalHtml += '<div class="ant-modal-footer"><button class="ant-btn" onclick="hideModal()">取消</button><button class="ant-btn ant-btn-primary" id="ticket-handler-save-btn">保存</button></div>';
        modalHtml += '</div></div>';

        var modalContainer = document.getElementById('modal-container');
        modalContainer.innerHTML = modalHtml;
        var overlay = modalContainer.querySelector('.ant-modal-overlay');
        if (overlay) overlay.onclick = function (e) { if (e.target === overlay) hideModal(); };

        document.getElementById('ticket-handler-save-btn').onclick = function () {
          var sel = document.getElementById('ticket-handler-select');
          var newHandler = sel.value;
          th.handler = newHandler;
          // 判断是否为部门负责人（默认）
          var dept = MockData.findOrg(deptId);
          th.isDefault = dept && dept.leader && dept.leader.name === newHandler;
          hideModal();
          showMessage(th.categoryName + ' 处理人已更新为「' + newHandler + '」', 'success');
          renderDeptTicketHandlers(container, cfg, deptId);
        };
      };
    });
  }

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

  // ===== 初始化 =====
  function init() {
    initSidebar();
    loadPage('org');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 暴露全局函数
  window.switchPage = switchPage;
  window.switchTab = switchTab;
  window.switchResTab = switchResTab;
  window.showModal = loadAndShowModal;
  window.hideModal = hideModal;
  window.showMessage = showMessage;
})();
