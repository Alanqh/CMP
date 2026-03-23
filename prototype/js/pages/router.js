'use strict';
// CMP 原型 - 页面路由、弹窗加载、事件绑定

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

// ===== 关联主账号弹窗 步骤切换 =====
window.bindMainStep = function (step) {
  var s1 = document.getElementById('bind-step-1');
  var s2 = document.getElementById('bind-step-2');
  var btnNext = document.getElementById('bind-btn-next');
  var btnBack = document.getElementById('bind-btn-back');
  var btnConfirm = document.getElementById('bind-btn-confirm');
  var tab1 = document.getElementById('bind-tab-1');
  var tab2 = document.getElementById('bind-tab-2');
  var tab2Num = document.getElementById('bind-tab-2-num');
  var tab1Num = document.getElementById('bind-tab-1-num');
  if (!s1) return;
  if (step === 2) {
    s1.style.display = 'none'; s2.style.display = '';
    if (btnNext) btnNext.style.display = 'none';
    if (btnBack) btnBack.style.display = '';
    if (btnConfirm) btnConfirm.style.display = '';
    if (tab1) { tab1.style.borderBottomColor = 'transparent'; tab1.style.color = '#8c8c8c'; }
    if (tab1Num) { tab1Num.style.background = '#52c41a'; tab1Num.innerHTML = '&#10003;'; }
    if (tab2) { tab2.style.borderBottomColor = '#1890ff'; tab2.style.color = '#1890ff'; }
    if (tab2Num) { tab2Num.style.background = '#1890ff'; tab2Num.style.color = '#fff'; }
  } else {
    s1.style.display = ''; s2.style.display = 'none';
    if (btnNext) btnNext.style.display = '';
    if (btnBack) btnBack.style.display = 'none';
    if (btnConfirm) btnConfirm.style.display = 'none';
    if (tab1) { tab1.style.borderBottomColor = '#1890ff'; tab1.style.color = '#1890ff'; }
    if (tab1Num) { tab1Num.style.background = '#1890ff'; tab1Num.innerHTML = '1'; }
    if (tab2) { tab2.style.borderBottomColor = 'transparent'; tab2.style.color = '#bfbfbf'; }
    if (tab2Num) { tab2Num.style.background = '#e8e8e8'; tab2Num.style.color = '#999'; }
  }
};

window.bindMainCopyPolicy = function () {
  var el = document.getElementById('bind-policy-json');
  if (!el) return;
  var text = el.textContent;
  var btn = document.getElementById('bind-copy-btn');
  var done = function () {
    if (btn) { btn.textContent = '✓ 已复制'; btn.style.color = '#52c41a'; setTimeout(function () { btn.textContent = '复制'; btn.style.color = ''; }, 2000); }
  };
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(done);
  } else {
    var ta = document.createElement('textarea');
    ta.value = text; ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0;';
    document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    done();
  }
};

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
  else if (id === 'create-ticket') initCreateTicketPage();
  else if (id === 'user') initUserPage();
  else if (id === 'dept-config') initDeptConfigPage();
  else if (id === 'apply-records') initApplyRecordsPage();
  else if (id === 'apply-resource') initApplyResourcePage();
  else if (id === 'review-records') initReviewRecordsPage();
  else if (id === 'resource-detail') initResourceDetailPage();
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

  // 取消按钮（模态框 footer 和抽屉 footer），data-no-close 的按钮不自动关闭
  container.querySelectorAll('.ant-modal-footer .ant-btn:not(.ant-btn-primary):not([data-no-close]), .ant-drawer-footer .ant-btn:not(.ant-btn-primary):not([data-no-close])').forEach(function (btn) {
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
