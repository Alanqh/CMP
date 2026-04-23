'use strict';
// CMP 原型 - 角色切换模块（功能权限 + 数据权限联动）

// ===== 当前角色（全局状态） =====
var currentRole = 'superadmin';

// ===== 角色配置 =====
var ROLE_CONFIG = {
  superadmin: {
    label: '平台超管',
    avatarText: '超',
    avatarBg: '#cf1322',
    username: 'admin',
    name: '管理员',
    dataScope: '全平台（所有部门）',
    // 可访问的页面 id（data-page 属性值）
    pages: ['org', 'role', 'user', 'dept-account', 'dept-res-create', 'dept-approval', 'dept-ticket', 'cloud', 'project',
            'res-catalog', 'resource', 'res-packages', 'orphan',
            'apply-records', 'verification-records', 'review-records', 'ticket', 'audit']
  },
  dept_head: {
    label: '部门负责人',
    avatarText: '负',
    avatarBg: '#d46b08',
    username: 'zhangmy',
    name: '张明远',
    dataScope: '本部门（基础架构部）',
    pages: ['org', 'user', 'dept-account', 'dept-res-create', 'dept-approval', 'dept-ticket', 'cloud', 'project',
            'res-catalog', 'resource', 'res-packages', 'orphan',
            'apply-records', 'verification-records', 'review-records', 'ticket']
  },
  group_leader1: {
    label: '一级组组长',
    avatarText: '组',
    avatarBg: '#389e0d',
    username: 'lisy',
    name: '李思远',
    dataScope: '本组（容器平台组）',
    pages: ['org', 'cloud', 'project', 'res-catalog', 'resource', 'res-packages',
            'apply-records', 'verification-records', 'review-records', 'ticket']
  },
  group_leader2: {
    label: '二级组组长',
    avatarText: '二',
    avatarBg: '#08979c',
    username: 'chenty',
    name: '陈天宇',
    dataScope: '本组（K8s运维小组）',
    pages: ['org', 'cloud', 'project', 'res-catalog', 'resource', 'res-packages',
            'apply-records', 'verification-records', 'review-records', 'ticket']
  },
  member: {
    label: '普通成员',
    avatarText: '员',
    avatarBg: '#096dd9',
    username: 'wanghr',
    name: '王浩然',
    dataScope: '仅个人数据',
    pages: ['cloud', 'project', 'res-catalog', 'resource', 'res-packages',
            'apply-records', 'ticket']
  }
};

// ===== 应用角色权限 =====
function applyRolePermissions(roleKey) {
  var role = ROLE_CONFIG[roleKey];
  if (!role) return;
  currentRole = roleKey;

  // 1. 更新顶栏 badge
  var badge = document.getElementById('role-badge');
  if (badge) {
    badge.textContent = role.label;
    badge.className = 'role-badge role-badge--' + roleKey;
  }

  // 2. 更新顶栏用户信息
  var avatar = document.querySelector('.panther-avatar');
  if (avatar) {
    avatar.textContent = role.avatarText;
    avatar.style.background = role.avatarBg;
  }
  var usernameEl = document.querySelector('.panther-username');
  if (usernameEl) usernameEl.textContent = role.name;

  // 3. 菜单可见性：按角色显示 / 隐藏菜单项
  var allowedPages = role.pages;
  document.querySelectorAll('.menu-item[data-page]').forEach(function (item) {
    var page = item.getAttribute('data-page');
    var visible = allowedPages.indexOf(page) !== -1;
    item.style.display = visible ? '' : 'none';
  });

  // 4. 如果所有菜单组内项目都隐藏，则隐藏组标题
  document.querySelectorAll('.menu-group-toggle[data-menu-group]').forEach(function (toggle) {
    var groupId = toggle.getAttribute('data-menu-group');
    var body = document.querySelector('.menu-submenu[data-menu-group-body="' + groupId + '"]');
    if (!body) return;
    var allHidden = true;
    body.querySelectorAll('.menu-item[data-page]').forEach(function (item) {
      if (item.style.display !== 'none') allHidden = false;
    });
    toggle.style.display = allHidden ? 'none' : '';
  });

  // 5. 如果当前页面不在允许列表中，跳转到第一个允许页面
  if (allowedPages.indexOf(currentPage) === -1) {
    var firstPage = allowedPages[0];
    var firstMenuItem = document.querySelector('.menu-item[data-page="' + firstPage + '"]');
    pageCache = {};
    switchPage(firstPage, firstMenuItem);
  } else {
    // 刷新当前页以应用数据权限变化
    pageCache[currentPage] = null;
    loadPage(currentPage);
  }

  // 6. 更新数据权限提示栏（如果当前页面容器存在）
  updateDataScopeBanner(role);
}

// ===== 数据权限提示栏 =====
function updateDataScopeBanner(role) {
  // 移除旧 banner
  var old = document.getElementById('role-data-scope-banner');
  if (old) old.remove();

  if (currentRole === 'superadmin') return; // 超管不显示

  var banner = document.createElement('div');
  banner.id = 'role-data-scope-banner';
  banner.className = 'role-data-scope-banner';
  banner.innerHTML =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0;opacity:.8">' +
    '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>' +
    '</svg>' +
    '<span>当前身份：<strong>' + role.label + '</strong>（' + role.name + '）· 数据范围：' + role.dataScope + '</span>';

  // 插入到 page-container 之前
  var wrapper = document.querySelector('.ant-layout-content-wrapper');
  if (wrapper) wrapper.insertBefore(banner, wrapper.firstChild);
}

// ===== 初始化角色切换器 =====
function initRoleSwitcher() {
  var trigger = document.getElementById('role-switcher-trigger');
  var panel = document.getElementById('role-switcher-panel');
  if (!trigger || !panel) return;

  // 渲染选项
  var optionsHtml = '';
  var roleOrder = ['superadmin', 'dept_head', 'group_leader1', 'group_leader2', 'member'];
  roleOrder.forEach(function (key) {
    var r = ROLE_CONFIG[key];
    optionsHtml +=
      '<div class="role-option" data-role="' + key + '">' +
      '  <div class="role-option-info">' +
      '    <span class="role-option-name">' + r.label + '</span>' +
      '    <span class="role-option-user">' + r.name + '</span>' +
      '  </div>' +
      '  <span class="role-option-scope">' + r.dataScope + '</span>' +
      '</div>';
  });
  panel.innerHTML = optionsHtml;

  // 打开/关闭面板
  trigger.onclick = function (e) {
    e.stopPropagation();
    var isOpen = panel.style.display !== 'none';
    // 关闭所有其他下拉
    document.querySelectorAll('[data-csd-panel]').forEach(function (p) { p.style.display = 'none'; });
    panel.style.display = isOpen ? 'none' : 'block';
    // 标记选中项
    panel.querySelectorAll('.role-option').forEach(function (opt) {
      opt.classList.toggle('active', opt.getAttribute('data-role') === currentRole);
    });
  };

  // 点击选项切换角色
  panel.addEventListener('click', function (e) {
    var opt = e.target.closest('.role-option');
    if (!opt) return;
    var roleKey = opt.getAttribute('data-role');
    panel.style.display = 'none';
    if (roleKey === currentRole) return;
    applyRolePermissions(roleKey);
    showMessage('已切换为「' + ROLE_CONFIG[roleKey].label + '」视角', 'info');
  });

  // 点击外部关闭
  document.addEventListener('click', function () {
    panel.style.display = 'none';
  });
  panel.addEventListener('click', function (e) { e.stopPropagation(); });
}

// ===== 当前角色的数据权限范围 =====
// 返回 { username, name, deptId, deptName, orgIds, rootOrgId, isMember }
// orgIds=null 表示全平台可见（超管）
function getRoleContext() {
  switch (currentRole) {
    case 'dept_head':
      return {
        username: 'zhangmy', name: '张明远',
        deptId: 'dept-infra', deptName: '基础架构部',
        orgIds: MockData.getOrgAndChildIds('dept-infra'),
        rootOrgId: 'dept-infra', isMember: false
      };
    case 'group_leader1':
      return {
        username: 'lisy', name: '李思远',
        deptId: 'dept-infra', deptName: '基础架构部',
        orgIds: MockData.getOrgAndChildIds('grp-container'),
        rootOrgId: 'grp-container', isMember: false
      };
    case 'group_leader2':
      return {
        username: 'chenty', name: '陈天宇',
        deptId: 'dept-infra', deptName: '基础架构部',
        orgIds: MockData.getOrgAndChildIds('grp-k8s'),
        rootOrgId: 'grp-k8s', isMember: false
      };
    case 'member':
      return {
        username: 'wanghr', name: '王浩然',
        deptId: 'dept-infra', deptName: '基础架构部',
        orgIds: ['grp-container'],
        rootOrgId: 'grp-container', isMember: true
      };
    default: // superadmin
      return {
        username: 'admin', name: '管理员',
        deptId: null, deptName: null, orgIds: null, rootOrgId: null, isMember: false
      };
  }
}

// ===== 暴露全局 =====
window.currentRole = currentRole;
window.ROLE_CONFIG = ROLE_CONFIG;
window.getRoleContext = getRoleContext;
window.applyRolePermissions = applyRolePermissions;
window.initRoleSwitcher = initRoleSwitcher;
