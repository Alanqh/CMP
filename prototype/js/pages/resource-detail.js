'use strict';
// CMP 原型 - 资源详情页

function initResourceDetailPage() {
  var res = state.currentResourceDetail;

  var backBtn = document.getElementById('btn-back-to-resource-list');
  if (backBtn) backBtn.onclick = function () { loadPage('resource'); };

  if (!res) {
    document.getElementById('resource-detail-content').innerHTML =
      '<div class="ant-empty"><div class="ant-empty-icon">&#128466;</div>未找到资源信息，请从资源列表进入</div>';
    return;
  }

  var titleEl = document.getElementById('resource-detail-page-title');
  if (titleEl) titleEl.textContent = '资源详情 - ' + res.name;

  var html = '';

  // ---- 基本信息 ----
  html += '<div class="ant-card" style="margin-bottom:16px;">';
  html += '<div class="ant-card-head">基本信息</div>';
  html += '<div class="ant-card-body"><div class="ant-descriptions">';
  html += descRow('资源名称', '<strong>' + esc(res.name) + '</strong>');
  html += descRow('资源 ID', '<code style="font-family:monospace;font-size:12px;">' + esc(res.resId) + '</code>');
  html += descRow('资源类型', '<span class="ant-tag ant-tag-' + res.typeColor + '">' + esc(res.type) + '</span>');
  html += descRow('形态', esc(res.shape || '--'));
  html += descRow('所属组', esc(res.group));
  html += descRow('所属资源组', esc(res.project));
  html += descRow('云厂商', esc(res.vendor || '--'));
  html += descRow('申请人', esc(res.applicant || '--'));
  html += descRow('我的权限', '<span class="ant-tag ant-tag-' + res.permColor + '">' + esc(res.perm) + '</span>');
  html += descRow('状态', '<span class="ant-badge-status-dot ant-badge-status-' + res.statusClass + '"></span> ' + esc(res.status));
  html += '</div></div></div>';

  // ---- 连接 / 使用信息 ----
  var connHtml = buildConnInfo(res);
  if (connHtml) {
    html += '<div class="ant-card" style="margin-bottom:16px;">';
    html += '<div class="ant-card-head">连接 &amp; 使用信息</div>';
    html += '<div class="ant-card-body"><div class="ant-descriptions">' + connHtml + '</div></div></div>';
  }

  // ---- 授权列表（master 可见） ----
  if (res.perm === 'master') {
    html += '<div class="ant-card">';
    html += '<div class="ant-card-head" style="display:flex;align-items:center;justify-content:space-between;">';
    html += '<span>授权列表</span>';
    html += '<button class="ant-btn" id="rd-authorize-btn" style="padding:2px 10px;font-size:12px;">+ 添加授权</button>';
    html += '</div>';
    html += '<div class="ant-card-body">';
    html += '<table class="ant-table"><thead><tr><th>用户</th><th>权限</th><th>授权时间</th><th>操作</th></tr></thead>';
    html += '<tbody id="rd-auth-tbody"></tbody></table></div></div>';
  }

  document.getElementById('resource-detail-content').innerHTML = html;

  // 绑定授权相关逻辑
  if (res.perm === 'master') {
    renderRdAuthList(res);
    var authBtn = document.getElementById('rd-authorize-btn');
    if (authBtn) {
      authBtn.onclick = function () {
        if (!res.authorizations) res.authorizations = [];
        loadAndShowModal('resource/authorize', function () {
          document.getElementById('authorize-title').textContent = '资源授权 - ' + res.name;
          renderAuthorizeList(res);
          var addBtn = document.getElementById('authorize-add-btn');
          if (addBtn) {
            addBtn.onclick = function () {
              var userSel = document.getElementById('authorize-user-select');
              var permSel = document.getElementById('authorize-perm-select');
              if (!userSel.value) { showMessage('请选择用户', 'warning'); return; }
              for (var j = 0; j < res.authorizations.length; j++) {
                if (res.authorizations[j].user === userSel.value) { showMessage('该用户已授权', 'warning'); return; }
              }
              var now = new Date();
              var timeStr = now.getFullYear() + '/' + String(now.getMonth() + 1).padStart(2, '0') + '/' + String(now.getDate()).padStart(2, '0') + ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
              res.authorizations.push({ user: userSel.value, perm: permSel.value, time: timeStr });
              renderAuthorizeList(res);
              renderRdAuthList(res);
              userSel.value = '';
              showMessage('已授权「' + res.authorizations[res.authorizations.length - 1].user + '」', 'success');
            };
          }
        });
      };
    }
  }
}

function renderRdAuthList(res) {
  var tbody = document.getElementById('rd-auth-tbody');
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
    html += '<td><a class="ant-btn-link rd-remove-btn" data-idx="' + idx + '" style="color:#ff4d4f;">移除</a></td></tr>';
  });
  tbody.innerHTML = html;
  tbody.querySelectorAll('.rd-remove-btn').forEach(function (btn) {
    btn.onclick = function () {
      var idx = parseInt(btn.getAttribute('data-idx'));
      var removed = res.authorizations[idx].user;
      res.authorizations.splice(idx, 1);
      renderRdAuthList(res);
      showMessage('已移除「' + removed + '」的授权', 'success');
    };
  });
}

function descRow(label, valueHtml) {
  return '<div class="ant-descriptions-row"><div class="ant-descriptions-label">' + label + '</div><div class="ant-descriptions-content">' + valueHtml + '</div></div>';
}

function buildConnInfo(res) {
  var c = res.connInfo;
  if (!c) return '';
  var html = '';
  var type = res.type;

  if (type === 'ECS') {
    if (c.privateIp) html += descRow('私网 IP', '<code>' + esc(c.privateIp) + '</code>');
    if (c.publicIp && c.publicIp !== '--') html += descRow('公网 IP', '<code>' + esc(c.publicIp) + '</code>');
    if (c.spec) html += descRow('实例规格', esc(c.spec));
    if (c.os) html += descRow('操作系统', esc(c.os));
    if (c.vpc) html += descRow('所属 VPC', esc(c.vpc));
    if (c.zone) html += descRow('可用区', esc(c.zone));
    if (c.loginUser) html += descRow('登录用户', '<code>' + esc(c.loginUser) + '</code>');
  } else if (type === 'RDS' || type === 'PG' || type === 'MongoDB') {
    if (c.endpoint) html += descRow('连接地址（内网）', '<code>' + esc(c.endpoint) + '</code>');
    if (c.port) html += descRow('端口', '<code>' + c.port + '</code>');
    if (c.version) html += descRow('引擎版本', esc(c.version));
    if (c.spec) html += descRow('实例规格', esc(c.spec));
    if (c.maxConn) html += descRow('最大连接数', '' + c.maxConn);
    if (c.charset) html += descRow('默认字符集', esc(c.charset));
  } else if (type === 'Redis') {
    if (c.endpoint) html += descRow('连接地址（内网）', '<code>' + esc(c.endpoint) + '</code>');
    if (c.port) html += descRow('端口', '<code>' + c.port + '</code>');
    if (c.version) html += descRow('版本', esc(c.version));
    if (c.spec) html += descRow('内存规格', esc(c.spec));
    if (c.passwd) html += descRow('密码', '<span style="color:var(--text-secondary);">' + esc(c.passwd) + '</span>');
  } else if (type === 'SLB' || type === 'ALB' || type === 'NLB') {
    if (c.publicIp && c.publicIp !== '--') html += descRow('公网 IP', '<code>' + esc(c.publicIp) + '</code>');
    if (c.privateIp) html += descRow('私网 IP', '<code>' + esc(c.privateIp) + '</code>');
    if (c.listeners) html += descRow('监听端口', esc(c.listeners));
    if (c.bandwidth) html += descRow('带宽', esc(c.bandwidth));
    if (c.region) html += descRow('地域', esc(c.region));
  } else if (type === 'Kafka') {
    if (c.bootstrapServers) html += descRow('内网接入点（Bootstrap）', '<code style="word-break:break-all;">' + esc(c.bootstrapServers) + '</code>');
    if (c.saslEndpoint) html += descRow('公网接入点（SASL）', '<code style="word-break:break-all;">' + esc(c.saslEndpoint) + '</code>');
    if (c.version) html += descRow('版本', esc(c.version));
    if (c.region) html += descRow('地域', esc(c.region));
  } else if (type === 'ES') {
    if (c.httpEndpoint) html += descRow('HTTP 接入地址', '<code style="word-break:break-all;">' + esc(c.httpEndpoint) + '</code>');
    if (c.kibanaUrl) html += descRow('Kibana 地址', '<code style="word-break:break-all;">' + esc(c.kibanaUrl) + '</code>');
    if (c.version) html += descRow('版本', esc(c.version));
    if (c.spec) html += descRow('集群规格', esc(c.spec));
  } else if (type === 'OSS') {
    if (c.bucket) html += descRow('Bucket 名称', '<code>' + esc(c.bucket) + '</code>');
    if (c.region) html += descRow('地域', esc(c.region));
    if (c.endpoint) html += descRow('外网 Endpoint', '<code>' + esc(c.endpoint) + '</code>');
    if (c.internalEndpoint) html += descRow('内网 Endpoint', '<code>' + esc(c.internalEndpoint) + '</code>');
    if (c.acl) html += descRow('访问控制（ACL）', esc(c.acl));
  } else if (type === 'CDN') {
    if (c.domain) html += descRow('加速域名', '<code>' + esc(c.domain) + '</code>');
    if (c.cname) html += descRow('CNAME', '<code>' + esc(c.cname) + '</code>');
    if (c.packType) html += descRow('套餐类型', esc(c.packType));
    if (c.expire) html += descRow('到期时间', esc(c.expire));
    if (c.remaining) html += descRow('剩余流量', esc(c.remaining));
    if (c.region) html += descRow('适用范围', esc(c.region));
  } else if (type === 'MaxCompute') {
    if (c.project) html += descRow('Project 名称', '<code>' + esc(c.project) + '</code>');
    if (c.endpoint) html += descRow('Endpoint', '<code>' + esc(c.endpoint) + '</code>');
    if (c.region) html += descRow('地域', esc(c.region));
    if (c.expire) html += descRow('到期时间', esc(c.expire));
  } else {
    // 通用：直接遍历 connInfo 字段
    Object.keys(c).forEach(function (k) {
      html += descRow(k, '<code>' + esc(String(c[k])) + '</code>');
    });
  }
  return html;
}
