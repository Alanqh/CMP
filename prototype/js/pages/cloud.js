'use strict';
// CMP 原型 - 云账号页

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
    var ctx = getRoleContext();
    // 关联/解绑主账号：仅超管和部门负责人可操作
    var canManageMain = currentRole === 'superadmin' || currentRole === 'dept_head';
    var mainAccounts = MockData.cloudAccounts.main;
    if (ctx.deptId && currentRole !== 'superadmin') {
      mainAccounts = mainAccounts.filter(function (a) { return a.dept === ctx.deptName; });
    }
    var html = '<table class="ant-table"><thead><tr><th>部门</th><th>云厂商</th><th>主账号 / AK别名</th><th>绑定人</th><th>绑定时间</th><th>状态</th><th>操作</th></tr></thead><tbody>';
    mainAccounts.forEach(function (a) {
      html += '<tr><td>' + esc(a.dept) + '</td>';
      if (a.status === '未关联') {
        html += '<td colspan="4" style="color:var(--text-secondary);">--</td>';
        html += '<td>';
        if (canManageMain) {
          html += '<button class="ant-btn ant-btn-primary ant-btn-sm cloud-bind-main-btn" data-dept="' + esc(a.dept) + '">关联主账号</button>';
        } else {
          html += '<span style="color:var(--text-secondary);">未关联</span>';
        }
        html += '</td></tr>';
      } else {
        html += '<td><span class="ant-tag ant-tag-blue">' + esc(a.vendor) + '</span></td>';
        html += '<td>' + esc(a.account) + '</td><td>' + esc(a.bindUser) + '</td><td>' + esc(a.bindTime) + '</td>';
        html += '<td><span class="ant-badge-status-dot ant-badge-status-success"></span>正常</td>';
        html += '<td><a class="ant-btn-link cloud-main-detail-btn" data-dept="' + esc(a.dept) + '">详情</a>';
        if (canManageMain) {
          html += ' <a class="ant-btn-link cloud-unbind-btn" data-dept="' + esc(a.dept) + '" style="color:#ff4d4f;">解绑</a>';
        }
        html += '</td></tr>';
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
  // 角色数据过滤：普通成员和组长只看自己的子账号
  var ctx = getRoleContext();
  if (currentRole === 'member') {
    data = data.filter(function (s) { return s.owner === ctx.name || s.applicant === ctx.username; });
  } else if (currentRole === 'group_leader1' || currentRole === 'group_leader2') {
    // 组长只看自己的子账号
    data = data.filter(function (s) { return s.owner === ctx.name || s.applicant === ctx.username; });
  } else if (currentRole === 'dept_head') {
    data = data.filter(function (s) { return s.dept === ctx.deptName; });
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
    var canManageSub = currentRole === 'superadmin' || currentRole === 'dept_head' || s.owner === ctx.name || s.applicant === ctx.username;
    if (s.status === '正常' && canManageSub) html += ' <a class="ant-btn-link cloud-sub-reset-pwd-btn" data-name="' + esc(s.name) + '">重置密码</a>';
    if (s.status === '正常' && canManageSub) html += ' <a class="ant-btn-link cloud-reclaim-btn" data-name="' + esc(s.name) + '">回收</a>';
    if (s.status === '已回收' && canManageSub) html += ' <a class="ant-btn-link cloud-destroy-btn" data-name="' + esc(s.name) + '" style="color:#ff4d4f;">销毁</a>';
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
