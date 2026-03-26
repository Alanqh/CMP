'use strict';
// CMP 原型 - 工单管理页

// =============================================
// 工单管理页
// =============================================
function initTicketPage() {
  // 角色数据范围：计算当前角色可见的工单
  var ctx = getRoleContext();
  var visibleTickets = MockData.tickets.filter(function (t) {
    if (currentRole === 'member') return t.applicant === ctx.name;
    // 组长只看自己创建的工单和被指派给自己处理的工单
    if (currentRole === 'group_leader1' || currentRole === 'group_leader2') return t.applicant === ctx.name || t.handler === ctx.name;
    if (currentRole === 'dept_head') return t.applicantDept === ctx.deptName;
    return true; // 超管
  });

  // 统计卡片
  var statsEl = document.getElementById('ticket-stats');
  if (statsEl) {
    var pending = 0, processing = 0, done = 0;
    visibleTickets.forEach(function (t) {
      if (t.status === '待处理') pending++;
      else if (t.status === '处理中') processing++;
      else if (t.status === '已完结') done++;
    });
    statsEl.innerHTML =
      '<div class="stat-card"><div class="stat-value" style="color:#faad14;">' + pending + '</div><div class="stat-label">待处理</div></div>' +
      '<div class="stat-card"><div class="stat-value" style="color:#1890ff;">' + processing + '</div><div class="stat-label">处理中</div></div>' +
      '<div class="stat-card"><div class="stat-value" style="color:#52c41a;">' + done + '</div><div class="stat-label">已完结</div></div>' +
      '<div class="stat-card"><div class="stat-value">' + visibleTickets.length + '</div><div class="stat-label">总工单</div></div>';
    if (!document.getElementById('ticket-status-note')) {
      var flowNote = document.createElement('div');
      flowNote.id = 'ticket-status-note';
      flowNote.className = 'ant-alert ant-alert-info';
      flowNote.style.cssText = 'margin:8px 0;font-size:12px;';
      flowNote.innerHTML = '<b>状态说明：</b>【待处理】工单已提交，处理人尚未接单；【处理中】处理人已接单，正在处理；【已完结】问题已解决。工单转移操作会记录在处理记录中。';
      statsEl.parentNode.insertBefore(flowNote, statsEl.nextSibling);
    }
  }

  // 部门筛选下拉（仅超管显示全部，其他角色隐藏）
  var deptFilter = document.getElementById('ticket-dept-filter');
  if (deptFilter) {
    if (currentRole !== 'superadmin') {
      // 非超管：隐藏部门筛选
      var deptFilterWrap = deptFilter.closest('.csd-wrap') || deptFilter.parentElement;
      if (deptFilterWrap) deptFilterWrap.style.display = 'none';
    } else if (deptFilter.options.length <= 1) {
      MockData.getAllDepts().forEach(function (d) {
        deptFilter.innerHTML += '<option value="' + esc(d) + '">' + esc(d) + '</option>';
      });
    }
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
  if (typeFilter) {
    var allCats = {};
    Object.keys(MockData.deptConfig).forEach(function (deptId) {
      var cfg = MockData.deptConfig[deptId];
      if (cfg && cfg.ticketHandlers) {
        cfg.ticketHandlers.forEach(function (th) { allCats[th.categoryName] = true; });
      }
    });
    Object.keys(allCats).forEach(function (catName) {
      typeFilter.innerHTML += '<option value="' + esc(catName) + '">' + esc(catName) + '</option>';
    });
    typeFilter.onchange = function () { state.ticket.typeFilter = typeFilter.value; state.ticket.page = 1; renderTickets(); };
  }
  var statusFilter = document.getElementById('ticket-status-filter');
  if (statusFilter) statusFilter.onchange = function () { state.ticket.statusFilter = statusFilter.value; state.ticket.page = 1; renderTickets(); };
  if (deptFilter) deptFilter.onchange = function () { state.ticket.deptFilter = deptFilter.value; state.ticket.page = 1; renderTickets(); };

  // 创建工单按钮 → 跳转到创建页
  var createBtn = document.getElementById('btn-create-ticket');
  if (createBtn) createBtn.onclick = function () {
    pageCache['create-ticket'] = null;
    loadPage('create-ticket');
  };

  renderTickets();
}

function renderTickets() {
  var s = state.ticket;
  var ctx = getRoleContext();
  var filtered = MockData.tickets.filter(function (t) {
    // 数据权限基础过滤
    if (currentRole === 'member' && t.applicant !== ctx.name) return false;
    // 组长只看自己创建或自己处理的工单
    if ((currentRole === 'group_leader1' || currentRole === 'group_leader2') && t.applicant !== ctx.name && t.handler !== ctx.name) return false;
    if (currentRole === 'dept_head' && t.applicantDept && t.applicantDept !== ctx.deptName) return false;
    // Tab过滤
    if (s.activeTab === 'mine' && t.applicant !== ctx.name) return false;
    if (s.activeTab === 'handle' && t.handler !== ctx.name) return false;
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
  var categoryColors = { '账号权限类': 'orange', '资源问题类': 'blue', '网络问题类': 'cyan', '安全合规类': 'red' };

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
    // 接单/完结/转移：仅工单处理人、部门负责人、超管可操作
    var isHandler = t.handler === ctx.name;
    var canManageTicket = currentRole === 'superadmin' || currentRole === 'dept_head' || isHandler;
    if (t.status === '待处理' && canManageTicket) html += ' <a class="ant-btn-link ticket-handle-btn" data-ticket-id="' + esc(t.id) + '">接单处理</a>';
    if (t.status === '处理中' && canManageTicket) html += ' <a class="ant-btn-link ticket-close-btn" data-ticket-id="' + esc(t.id) + '">完结</a>';
    if (t.status !== '已完结' && canManageTicket) html += ' <a class="ant-btn-link ticket-transfer-btn" data-ticket-id="' + esc(t.id) + '">转移</a>';
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
// 创建工单页
// =============================================
function initCreateTicketPage() {
  var selectedCat = null;
  var attachFiles = [];
  var deptId = 'dept-infra';
  var cfg = MockData.deptConfig[deptId];

  // 返回 / 取消
  var backBtn = document.getElementById('btn-back-to-ticket');
  if (backBtn) backBtn.onclick = function () { loadPage('ticket'); };
  var cancelBtn = document.getElementById('btn-cancel-create-ticket');
  if (cancelBtn) cancelBtn.onclick = function () { loadPage('ticket'); };

  // 类别卡片
  var catGrid = document.getElementById('create-ticket-cat-grid');
  if (catGrid && cfg && cfg.ticketHandlers) {
    cfg.ticketHandlers.forEach(function (th) {
      var card = document.createElement('div');
      card.setAttribute('data-cat-name', th.categoryName);
      card.style.cssText = 'border:1px solid #d9d9d9;padding:12px 16px;cursor:pointer;transition:border-color .15s,background .15s;user-select:none;';
      card.innerHTML =
        '<div style="font-weight:500;font-size:14px;line-height:1.5;">' + esc(th.categoryName) + '</div>' +
        '<div style="font-size:12px;color:var(--text-secondary);margin-top:6px;">处理人：' + esc(th.handler) + '</div>';
      card.onmouseover = function () { if (selectedCat !== th.categoryName) card.style.borderColor = '#40a9ff'; };
      card.onmouseout = function () { if (selectedCat !== th.categoryName) card.style.borderColor = '#d9d9d9'; };
      card.onclick = function () {
        catGrid.querySelectorAll('[data-cat-name]').forEach(function (c) {
          c.style.borderColor = '#d9d9d9';
          c.style.background = '';
        });
        card.style.borderColor = '#1890ff';
        card.style.background = '#e6f7ff';
        selectedCat = th.categoryName;
        var handlerRow = document.getElementById('create-ticket-handler-row');
        var handlerDisplay = document.getElementById('create-ticket-handler-display');
        if (handlerRow) handlerRow.style.display = '';
        if (handlerDisplay) handlerDisplay.textContent = th.handler;
      };
      catGrid.appendChild(card);
    });
  }

  // 附件上传
  var attachArea = document.getElementById('create-ticket-attach-area');
  var fileInput = document.getElementById('create-ticket-file-input');
  if (attachArea && fileInput) {
    attachArea.onclick = function () { fileInput.click(); };
    attachArea.onmouseover = function () { attachArea.style.borderColor = '#1890ff'; attachArea.style.color = '#1890ff'; };
    attachArea.onmouseout = function () { attachArea.style.borderColor = '#d9d9d9'; attachArea.style.color = 'var(--text-secondary)'; };
    attachArea.ondragover = function (e) { e.preventDefault(); attachArea.style.borderColor = '#1890ff'; };
    attachArea.ondragleave = function () { attachArea.style.borderColor = '#d9d9d9'; attachArea.style.color = 'var(--text-secondary)'; };
    attachArea.ondrop = function (e) {
      e.preventDefault();
      attachArea.style.borderColor = '#d9d9d9';
      addFiles(Array.from(e.dataTransfer.files));
    };
    fileInput.onchange = function () { addFiles(Array.from(fileInput.files)); fileInput.value = ''; };
  }

  function addFiles(files) {
    var list = document.getElementById('create-ticket-attach-list');
    files.forEach(function (f) {
      if (f.size > 10 * 1024 * 1024) { showMessage(f.name + ' 超过 10MB 限制', 'error'); return; }
      attachFiles.push(f.name);
      if (list) {
        var tag = document.createElement('span');
        tag.style.cssText = 'display:inline-flex;align-items:center;background:#f5f5f5;border:1px solid #d9d9d9;border-radius:4px;padding:2px 8px;font-size:12px;gap:4px;';
        tag.innerHTML = '&#128206; ' + esc(f.name) + ' <span style="cursor:pointer;color:#aaa;font-size:14px;">&times;</span>';
        tag.querySelector('span').onclick = function (e) {
          e.stopPropagation();
          attachFiles = attachFiles.filter(function (n) { return n !== f.name; });
          list.removeChild(tag);
        };
        list.appendChild(tag);
      }
    });
  }

  // 提交
  var submitBtn = document.getElementById('btn-submit-create-ticket');
  if (submitBtn) submitBtn.onclick = function () {
    if (!selectedCat) { showMessage('请选择问题类别', 'error'); return; }
    var title = (document.getElementById('create-ticket-title').value || '').trim();
    var desc = (document.getElementById('create-ticket-desc').value || '').trim();
    if (!title) { showMessage('请填写工单标题', 'error'); return; }
    if (!desc) { showMessage('请填写问题描述', 'error'); return; }
    var handler = '--';
    if (cfg && cfg.ticketHandlers) {
      for (var i = 0; i < cfg.ticketHandlers.length; i++) {
        if (cfg.ticketHandlers[i].categoryName === selectedCat) { handler = cfg.ticketHandlers[i].handler; break; }
      }
    }
    var now = new Date();
    var dateStr = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
    var newId = 'TK-' + dateStr + '-' + String(MockData.tickets.length + 1).padStart(3, '0');
    var timeStr = now.getFullYear() + '/' + String(now.getMonth() + 1).padStart(2, '0') + '/' + String(now.getDate()).padStart(2, '0') + ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0');
    MockData.tickets.unshift({
      id: newId, title: title, category: selectedCat,
      status: '待处理', statusClass: 'warning',
      applicant: '王浩然', applicantDept: '基础架构部',
      handler: handler, createTime: timeStr, updateTime: timeStr,
      relatedResource: '--', desc: desc, attachments: attachFiles.slice(),
      timeline: [{ time: timeStr, action: '创建工单', operator: '王浩然', detail: '提交 ' + selectedCat + ' 工单' }]
    });
    MockData.auditLogs.unshift({ time: timeStr, operator: '王浩然', dept: '基础架构部', opType: '工单操作', opTypeColor: 'purple', target: newId, desc: '创建工单: ' + title, ip: '10.128.0.55' });
    pageCache['ticket'] = null;
    showMessage('工单 ' + newId + ' 已创建', 'success');
    loadPage('ticket');
  };
}
