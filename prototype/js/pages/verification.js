'use strict';
// CMP 原型 - 核验记录页（V1.0.2 新增功能）
// 展示当前用户作为核验人相关的申请记录，用于处理待核验的资源创建申请

// =============================================
// 核验记录页
// =============================================
function initVerificationRecordsPage() {
  var searchEl = document.getElementById('verification-record-search');
  if (searchEl) searchEl.oninput = function () {
    if (!state.verificationRecords) state.verificationRecords = { keyword: '', statusFilter: '', page: 1 };
    state.verificationRecords.keyword = searchEl.value;
    state.verificationRecords.page = 1;
    renderVerificationRecords();
  };
  var statusFilter = document.getElementById('verification-record-status-filter');
  if (statusFilter) statusFilter.onchange = function () {
    if (!state.verificationRecords) state.verificationRecords = { keyword: '', statusFilter: '', page: 1 };
    state.verificationRecords.statusFilter = statusFilter.value;
    state.verificationRecords.page = 1;
    renderVerificationRecords();
  };
  if (!state.verificationRecords) state.verificationRecords = { keyword: '', statusFilter: '', page: 1 };
  renderVerificationRecords();
}

function getVerificationRecords() {
  var ctx = getRoleContext();
  var verifierNames = [];

  // 确定当前角色作为核验人的姓名
  if (currentRole === 'superadmin') {
    // 超管可看到所有部门的核验记录
    verifierNames = ['李思远', '刘佳琪', '周文博'];
  } else if (currentRole === 'dept_head') {
    verifierNames = [ctx.name];
  } else if (currentRole === 'group_leader1' || currentRole === 'group_leader2') {
    verifierNames = [ctx.name];
  } else {
    return []; // 普通成员无核验权限
  }

  var results = [];
  MockData.applicationRecords.forEach(function (r) {
    // 只处理有核验节点的记录
    if (!r.verificationNodes || r.verificationNodes.length === 0) return;
    // 只处理与申请"创建"操作相关的记录（核验只在资源创建时发生）
    if (r.opType !== '创建') return;

    var isVerifier = false;
    var myVerifStatus = '';

    r.verificationNodes.forEach(function (node) {
      if (node.role === '申请人') return;
      if (verifierNames.indexOf(node.name) !== -1) {
        isVerifier = true;
        if (node.status === 'pending') myVerifStatus = 'pending';
        else if (node.status === 'done') { if (!myVerifStatus) myVerifStatus = 'done'; }
        else if (node.status === 'rejected') { if (!myVerifStatus) myVerifStatus = 'rejected'; }
      }
    });

    if (isVerifier) {
      results.push({ record: r, myVerifStatus: myVerifStatus });
    }
  });
  return results;
}

function renderVerificationRecords() {
  if (!state.verificationRecords) state.verificationRecords = { keyword: '', statusFilter: '', page: 1 };
  var s = state.verificationRecords;
  var allItems = getVerificationRecords();

  // 如果当前角色无核验权限
  var ctx = getRoleContext();
  if (currentRole === 'member') {
    var tc = document.getElementById('verification-record-table-container');
    if (tc) tc.innerHTML = '<div class="ant-empty" style="padding:40px;text-align:center;color:var(--text-secondary);">您暂无核验权限，核验记录仅对核验人可见</div>';
    return;
  }

  var filtered = allItems.filter(function (item) {
    if (s.keyword) {
      var kw = s.keyword.toLowerCase();
      if (item.record.id.toLowerCase().indexOf(kw) === -1 && item.record.title.toLowerCase().indexOf(kw) === -1) return false;
    }
    if (s.statusFilter) {
      if (s.statusFilter === '核验中' && item.record.status !== '核验中') return false;
      if (s.statusFilter === '核验不通过' && item.record.status !== '核验不通过') return false;
      if (s.statusFilter === '审批中' && item.record.status !== '审批中') return false;
      if (s.statusFilter === '已通过' && item.record.status !== '已通过') return false;
    }
    return true;
  });

  var total = filtered.length;
  var start = (s.page - 1) * PAGE_SIZE;
  var pageData = filtered.slice(start, start + PAGE_SIZE);

  var statusColors = {
    '核验中': 'processing', '核验不通过': 'error',
    '审批中': 'processing', '已通过': 'success', '已驳回': 'error', '已撤回': 'default'
  };

  var tableContainer = document.getElementById('verification-record-table-container');
  if (!tableContainer) return;

  if (filtered.length === 0) {
    tableContainer.innerHTML = '<div class="ant-empty" style="padding:40px;text-align:center;color:var(--text-secondary);">暂无核验记录</div>';
    return;
  }

  var html = '<table class="ant-table"><thead><tr>' +
    '<th>申请单号</th><th>申请标题</th><th>申请人</th><th>所属部门</th>' +
    '<th>申请时间</th><th>状态</th><th>操作</th>' +
    '</tr></thead><tbody>';

  pageData.forEach(function (item) {
    var r = item.record;
    var statusColor = statusColors[r.status] || 'default';
    html += '<tr>';
    html += '<td style="white-space:nowrap;font-family:monospace;font-size:12px;">' + esc(r.id) + '</td>';
    html += '<td>' + esc(r.title) + '</td>';
    html += '<td>' + esc(r.applicant) + '</td>';
    html += '<td>' + esc(r.applicantDept) + '</td>';
    html += '<td style="white-space:nowrap;">' + esc(r.createTime) + '</td>';
    html += '<td><span class="ant-badge-status-dot ant-badge-status-' + statusColor + '"></span>' + esc(r.status) + '</td>';
    html += '<td>';
    if (item.myVerifStatus === 'pending') {
      html += '<a class="ant-btn-link verif-record-action-btn" data-record-id="' + esc(r.id) + '">核验</a>';
    } else {
      html += '<a class="ant-btn-link verif-record-view-btn" data-record-id="' + esc(r.id) + '">查看</a>';
    }
    html += '</td></tr>';
  });
  html += '</tbody></table><div id="verification-record-pagination"></div>';
  tableContainer.innerHTML = html;

  var pagEl = document.getElementById('verification-record-pagination');
  if (pagEl) renderPagination(pagEl, total, s.page, PAGE_SIZE, function (p) { s.page = p; renderVerificationRecords(); });

  // 查看按钮
  tableContainer.querySelectorAll('.verif-record-view-btn').forEach(function (btn) {
    btn.onclick = function () {
      var recordId = btn.getAttribute('data-record-id');
      var record = MockData.applicationRecords.find(function (r) { return r.id === recordId; });
      if (record) showVerifDetailModal(record, false);
    };
  });

  // 核验按钮
  tableContainer.querySelectorAll('.verif-record-action-btn').forEach(function (btn) {
    btn.onclick = function () {
      var recordId = btn.getAttribute('data-record-id');
      var record = MockData.applicationRecords.find(function (r) { return r.id === recordId; });
      if (record) showVerifDetailModal(record, true);
    };
  });
}

// =============================================
// 核验详情弹窗（含核验通过/不通过操作）
// =============================================
function showVerifDetailModal(record, canVerify) {
  var statusStyles = {
    'done': { bg: '#f6ffed', border: '#b7eb8f', color: '#52c41a', icon: '&#10003;', label: '已完成' },
    'pending': { bg: '#e6f7ff', border: '#91d5ff', color: '#1890ff', icon: '&#9998;', label: '核验中' },
    'waiting': { bg: '#f5f5f5', border: '#d9d9d9', color: '#999', icon: '&#9203;', label: '等待中' },
    'rejected': { bg: '#fff2f0', border: '#ffa39e', color: '#ff4d4f', icon: '&#10007;', label: '不通过' }
  };

  function renderVerifNodes(nodes) {
    if (!nodes || !nodes.length) return '<span style="color:var(--text-secondary);">无核验流程信息</span>';
    var html = '<div style="display:flex;align-items:flex-start;gap:0;overflow-x:auto;padding:8px 0;">';
    nodes.forEach(function (node, idx) {
      var s = statusStyles[node.status] || statusStyles['waiting'];
      html += '<div style="display:flex;align-items:center;">';
      html += '<div style="text-align:center;min-width:100px;max-width:140px;">';
      html += '<div style="width:36px;height:36px;border-radius:50%;background:' + s.bg + ';border:2px solid ' + s.border + ';display:inline-flex;align-items:center;justify-content:center;color:' + s.color + ';font-size:16px;font-weight:bold;">' + s.icon + '</div>';
      html += '<div style="font-size:12px;font-weight:500;margin-top:4px;color:' + s.color + ';">' + esc(node.role) + '</div>';
      html += '<div style="font-size:11px;color:var(--text-secondary);">' + esc(node.name) + '</div>';
      if (node.time) html += '<div style="font-size:10px;color:var(--text-secondary);">' + esc(node.time) + '</div>';
      if (node.remark) html += '<div style="font-size:10px;color:' + s.color + ';max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="' + esc(node.remark) + '">' + esc(node.remark) + '</div>';
      html += '</div>';
      if (idx < nodes.length - 1) {
        html += '<div style="width:40px;height:2px;background:#d9d9d9;margin:18px 4px 0;flex-shrink:0;"></div>';
      }
      html += '</div>';
    });
    html += '</div>';
    return html;
  }

  var html = '<div class="ant-drawer-overlay" style="display:flex;">';
  html += '<div class="ant-drawer">';
  html += '<div class="ant-drawer-header">' + (canVerify ? '核验操作' : '核验详情') + ' - ' + esc(record.id) + ' <button class="ant-drawer-close" onclick="hideModal()">&times;</button></div>';
  html += '<div class="ant-drawer-body">';

  // 核验流程进度
  html += '<div style="margin-bottom:20px;padding:16px;background:#fafafa;border-radius:8px;border:1px solid #f0f0f0;">';
  html += '<div style="font-size:13px;font-weight:500;margin-bottom:8px;color:var(--text-color);">核验流程</div>';
  html += renderVerifNodes(record.verificationNodes);
  html += '</div>';

  // 申请信息
  html += '<div style="margin-bottom:20px;">';
  html += '<div style="font-size:13px;font-weight:500;margin-bottom:8px;color:var(--text-color);">申请信息</div>';
  html += '<div class="ant-descriptions" style="display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;">';
  html += '<div><span style="color:var(--text-secondary);font-size:12px;">申请单号</span><div>' + esc(record.id) + '</div></div>';
  html += '<div><span style="color:var(--text-secondary);font-size:12px;">申请人</span><div>' + esc(record.applicant) + '</div></div>';
  html += '<div><span style="color:var(--text-secondary);font-size:12px;">部门 / 组</span><div>' + esc(record.applicantDept) + ' / ' + esc(record.applicantGroup) + '</div></div>';
  html += '<div><span style="color:var(--text-secondary);font-size:12px;">申请时间</span><div>' + esc(record.createTime) + '</div></div>';
  html += '<div><span style="color:var(--text-secondary);font-size:12px;">当前状态</span><div>' + esc(record.status) + '</div></div>';
  html += '</div></div>';

  // 申请人填写的字段（核验前只展示用户填写字段）
  if (record.userFormData) {
    html += '<div style="margin-bottom:20px;">';
    html += '<div style="font-size:13px;font-weight:500;margin-bottom:8px;color:var(--text-color);">申请人填写内容</div>';
    html += '<div style="background:#f0f7ff;border:1px solid #bae0ff;border-radius:4px;padding:8px 12px;margin-bottom:12px;font-size:12px;color:#0958d9;">以下为申请人填写的字段，其余参数由模板填充。核验人需确认完整表单后方可通过。</div>';
    html += '<table class="ant-table" style="font-size:13px;"><tbody>';
    var userKeys = Object.keys(record.userFormData);
    for (var i = 0; i < userKeys.length; i++) {
      html += '<tr><td style="width:140px;color:var(--text-secondary);background:#fafafa;font-weight:500;">' + esc(userKeys[i]) + '</td><td>' + esc(record.userFormData[userKeys[i]]) + '</td></tr>';
    }
    html += '</tbody></table></div>';
  }

  // 核验操作区（仅核验人可操作，且状态为核验中）
  if (canVerify && record.status === '核验中') {
    html += '<div style="margin-top:16px;padding:16px;background:#e6fffb;border:1px solid #87e8de;border-radius:6px;">';
    html += '<div style="font-size:13px;font-weight:500;margin-bottom:12px;color:#008080;">核验操作</div>';
    html += '<div style="background:#fffbe6;border:1px solid #ffe58f;border-radius:4px;padding:8px 12px;margin-bottom:12px;font-size:12px;color:#874d00;">&#9888; 核验人需确认并完善完整的资源创建表单，确保所有参数正确后方可通过核验。</div>';

    // 模拟完整表单（申请人填写字段 + 模板填充字段的组合）
    html += '<div style="font-size:12px;font-weight:500;margin-bottom:8px;color:var(--text-color);">完整创建表单（请确认以下所有字段）</div>';
    html += '<div style="background:#fafafa;border:1px solid #d9d9d9;border-radius:4px;padding:12px;margin-bottom:16px;">';
    html += '<table class="ant-table" style="font-size:13px;margin:0;"><tbody>';
    // 用户填写字段（来自 userFormData）
    if (record.userFormData) {
      Object.keys(record.userFormData).forEach(function (k) {
        html += '<tr><td style="width:140px;color:#1890ff;background:#f0f7ff;font-weight:500;">✏ ' + esc(k) + '<br><span style="font-size:10px;font-weight:400;color:#91caff;">申请人填写</span></td><td>' + esc(record.userFormData[k]) + '</td></tr>';
      });
    }
    // 模板自动填充字段（模拟，示例为ECS常见参数）
    var autoFillFields = [
      { key: '可用区', val: 'cn-hangzhou-h（模板默认）' },
      { key: '实例规格', val: 'ecs.c6.xlarge 4C8G（模板默认）' },
      { key: '镜像', val: 'Alibaba Cloud Linux 3.2104 LTS 64位（模板默认）' },
      { key: '系统盘类型', val: 'ESSD PL1 40GB（模板默认）' },
      { key: '网络类型', val: 'VPC（模板默认）' },
      { key: '安全组', val: 'sg-dept-default（模板默认）' },
      { key: '付费类型', val: '按量付费（模板默认）' }
    ];
    autoFillFields.forEach(function (f) {
      html += '<tr><td style="width:140px;color:var(--text-secondary);background:#f5f5f5;font-weight:500;">⚙ ' + esc(f.key) + '<br><span style="font-size:10px;font-weight:400;color:#bfbfbf;">模板填充</span></td><td style="color:var(--text-secondary);">' + esc(f.val) + '</td></tr>';
    });
    html += '</tbody></table></div>';

    html += '<div class="ant-form-item"><div class="ant-form-label">核验意见</div>';
    html += '<div class="ant-form-control"><textarea class="ant-textarea" id="verif-remark" placeholder="请输入核验意见（通过时选填，不通过时必填）..." rows="3"></textarea></div></div>';
    html += '<div style="display:flex;gap:8px;justify-content:flex-end;">';
    html += '<button class="ant-btn" id="verif-reject-btn" style="color:#ff4d4f;border-color:#ff4d4f;">核验不通过</button>';
    html += '<button class="ant-btn ant-btn-primary" id="verif-approve-btn" style="background:#13c2c2;border-color:#13c2c2;">核验通过</button>';
    html += '</div></div>';
  }

  html += '</div>';
  html += '<div class="ant-drawer-footer"><button class="ant-btn" onclick="hideModal()">关闭</button></div>';
  html += '</div></div>';

  var container = document.getElementById('modal-container');
  container.innerHTML = html;
  var overlay = container.querySelector('.ant-drawer-overlay');
  if (overlay) overlay.onclick = function (e) { if (e.target === overlay) hideModal(); };

  // 核验通过操作
  var approveBtn = document.getElementById('verif-approve-btn');
  if (approveBtn) {
    approveBtn.onclick = function () {
      var remark = (document.getElementById('verif-remark') || {}).value || '';
      // 更新核验节点状态
      if (record.verificationNodes) {
        record.verificationNodes.forEach(function (node) {
          if (node.role === '核验人' && node.status === 'pending') {
            node.status = 'done';
            node.time = new Date().toLocaleString('zh-CN').replace(/\//g, '/');
            node.remark = remark || '核验通过';
          }
        });
      }
      // 进入审批流程
      record.status = '审批中';
      record.statusClass = 'processing';
      // 生成审批节点（从审批流程模板）
      record.flowNodes = [
        { role: '申请人', name: record.applicant, status: 'done', time: record.createTime, remark: '提交申请' },
        { role: '直属领导', name: '待确认', status: 'pending', time: '', remark: '' },
        { role: '部门负责人', name: '待确认', status: 'waiting', time: '', remark: '' }
      ];
      // 生成完整表单数据
      record.formData = Object.assign({}, record.userFormData, {
        '可用区': 'cn-hangzhou-h', '实例规格': 'ecs.c6.xlarge 4C8G',
        '镜像': 'Alibaba Cloud Linux 3.2104 LTS 64位', '系统盘类型': 'ESSD PL1 40GB',
        '网络类型': 'VPC', '安全组': 'sg-dept-default', '付费类型': '按量付费'
      });
      hideModal();
      showMessage('核验通过，申请已进入 ERP 审批流程', 'success');
      renderVerificationRecords();
    };
  }

  // 核验不通过操作
  var rejectBtn = document.getElementById('verif-reject-btn');
  if (rejectBtn) {
    rejectBtn.onclick = function () {
      var remark = (document.getElementById('verif-remark') || {}).value || '';
      if (!remark.trim()) { showMessage('核验不通过时需填写核验意见', 'warning'); return; }
      // 更新核验节点状态
      if (record.verificationNodes) {
        record.verificationNodes.forEach(function (node) {
          if (node.role === '核验人' && node.status === 'pending') {
            node.status = 'rejected';
            node.time = new Date().toLocaleString('zh-CN').replace(/\//g, '/');
            node.remark = remark;
          }
        });
      }
      record.status = '核验不通过';
      record.statusClass = 'error';
      hideModal();
      showMessage('已标记为核验不通过，申请人将收到通知', 'warning');
      renderVerificationRecords();
    };
  }
}
