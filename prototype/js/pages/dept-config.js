'use strict';
// CMP 原型 - 部门配置页

// =============================================
// 部门配置页
// =============================================
function initDeptConfigPage() {
  var ctx = getRoleContext();

  // 部门负责人：锁定到自己部门，隐藏选择器，显示标签
  if (currentRole === 'dept_head' && ctx.deptId) {
    state.deptConfig.selectedDept = ctx.deptId;
    var selectorWrap = document.getElementById('dept-config-selector-wrap');
    if (selectorWrap) selectorWrap.style.display = 'none';
    var deptLabel = document.getElementById('dept-config-dept-label');
    if (deptLabel) {
      deptLabel.style.display = '';
      deptLabel.textContent = ctx.deptName;
    }
  }

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
  var tab = state.deptConfig.activeTab;
  var container = document.getElementById('dept-config-content');
  if (!container) return;
  if (tab === 'member-roles') { renderDeptMemberRoles(container, deptId); return; }
  var cfg = MockData.deptConfig[deptId];
  if (!cfg) return;
  if (tab === 'account') renderDeptAccount(container, cfg, deptId);
  else if (tab === 'template') renderDeptTemplates(container, cfg, deptId);
  else if (tab === 'approval') renderDeptApproval(container, cfg, deptId);
  else if (tab === 'ticket-handler') renderDeptTicketHandlers(container, cfg, deptId);
}

function renderDeptAccount(container, cfg, deptId) {
  var html = '<div class="ant-card"><div class="ant-card-head"><span>主账号配置</span></div><div class="ant-card-body">';
  // 根据云厂商获取标签颜色
  function getVendorTagColor(vendor) {
    if (!vendor) return 'ant-tag-cyan';
    var v = vendor.toLowerCase();
    if (v.indexOf('aliyun') !== -1 || v.indexOf('阿里云') !== -1) return 'ant-tag-orange';
    if (v.indexOf('tencent') !== -1 || v.indexOf('腾讯云') !== -1) return 'ant-tag-blue';
    if (v.indexOf('aws') !== -1) return 'ant-tag-purple';
    if (v.indexOf('azure') !== -1) return 'ant-tag-cyan';
    if (v.indexOf('huawei') !== -1 || v.indexOf('华为云') !== -1) return 'ant-tag-red';
    return 'ant-tag-cyan';
  }
  // 查找当前部门的所有云账号
  var deptName = cfg.deptName || '';
  var deptAccounts = MockData.cloudAccounts.main.filter(function (a) { return a.dept === deptName; });

  deptAccounts.forEach(function (acct) {
    var vendorColor = getVendorTagColor(acct.vendor);
    html += '<div class="ant-form-item"><div class="ant-form-label">' + esc(acct.vendor) + '</div>';
    html += '<div class="ant-form-control" style="display:flex;align-items:center;gap:12px;">';
    if (acct.status === '正常') {
      html += '<span class="ant-tag ' + vendorColor + '" style="font-size:14px;padding:4px 12px;">' + esc(acct.vendor) + '</span>';
      html += '<span class="ant-tag ant-tag-blue" style="font-size:14px;padding:4px 12px;">' + esc(acct.account) + '</span>';
      html += '<span class="ant-tag ant-tag-green">已绑定</span>';
      html += '<button class="ant-btn ant-btn-danger dept-config-unbind-btn" data-vendor="' + esc(acct.vendor) + '" style="margin-left:auto;">解绑</button>';
    } else {
      html += '<span class="ant-tag ' + vendorColor + '" style="font-size:14px;padding:4px 12px;opacity:0.6;">' + esc(acct.vendor) + '</span>';
      html += '<span class="ant-tag ant-tag-default" style="font-size:14px;padding:4px 12px;">未绑定</span>';
      html += '<button class="ant-btn ant-btn-primary dept-config-bind-btn" data-vendor="' + esc(acct.vendor) + '" style="margin-left:auto;">绑定</button>';
    }
    html += '</div></div>';
  });

  html += '</div></div>';
  container.innerHTML = html;

  // 绑定按钮
  container.querySelectorAll('.dept-config-bind-btn').forEach(function (btn) {
    btn.onclick = function () {
      var vendor = btn.getAttribute('data-vendor');
      window._bindCloudDept = cfg.deptName || '';
      window._bindCloudVendor = vendor;
      loadAndShowModal('cloud/bind-main', function () {
        var header = document.querySelector('#modal-container .ant-modal-header');
        if (header) header.childNodes[0].textContent = '绑定' + vendor + '主账号 ';
        initBindMainRegion();
        // 预设云厂商并禁用选择
        var vendorSelect = document.getElementById('bind-cloud-vendor');
        if (vendorSelect) {
          vendorSelect.value = vendor.toLowerCase() === '阿里云' ? 'aliyun' :
                                vendor.toLowerCase() === '腾讯云' ? 'tencent' :
                                vendor.toLowerCase() === 'aws' ? 'aws' :
                                vendor.toLowerCase() === 'azure' ? 'azure' :
                                vendor.toLowerCase() === '华为云' ? 'huawei' : 'aliyun';
          vendorSelect.disabled = true;
          // 添加提示
          var hint = document.createElement('div');
          hint.style.cssText = 'font-size:12px;color:#888;margin-top:4px;';
          hint.textContent = '当前部门仅可绑定一个 ' + vendor + ' 账号';
          vendorSelect.parentNode.appendChild(hint);
        }
        var confirmBtn = document.querySelector('#modal-container .ant-btn-primary');
        if (confirmBtn) {
          confirmBtn.onclick = function () {
            var alias = document.getElementById('bind-cloud-alias');
            var ak = document.getElementById('bind-cloud-ak');
            var regionSelect = document.getElementById('bind-cloud-region');
            if (alias && alias.value.trim() && ak && ak.value.trim() && regionSelect && regionSelect.value) {
              // 更新 mock 数据
              for (var i = 0; i < MockData.cloudAccounts.main.length; i++) {
                if (MockData.cloudAccounts.main[i].dept === cfg.deptName && MockData.cloudAccounts.main[i].vendor === vendor) {
                  MockData.cloudAccounts.main[i].account = alias.value.trim() + ' (' + ak.value.trim().substring(0, 4) + '****)';
                  MockData.cloudAccounts.main[i].bindUser = '部门负责人';
                  MockData.cloudAccounts.main[i].bindTime = new Date().toLocaleString('zh-CN').replace(/\//g, '/');
                  MockData.cloudAccounts.main[i].status = '正常';
                  MockData.cloudAccounts.main[i].region = regionSelect.value;
                  var optText = regionSelect.options[regionSelect.selectedIndex]
                    ? regionSelect.options[regionSelect.selectedIndex].textContent.trim()
                    : '';
                  MockData.cloudAccounts.main[i].regionName = optText.replace(' ' + regionSelect.value, '').trim();
                  break;
                }
              }
              cfg.cloudAccount = alias.value.trim() + ' (' + ak.value.trim().substring(0, 4) + '****)';
              cfg.cloudAccountBound = true;
              hideModal();
              showMessage(vendor + '主账号已绑定为「' + cfg.cloudAccount + '」', 'success');
              renderDeptConfig();
            } else {
              showMessage('请填写完整信息', 'error');
            }
          };
        }
      });
    };
  });

  // 解绑按钮
  container.querySelectorAll('.dept-config-unbind-btn').forEach(function (btn) {
    btn.onclick = function () {
      var vendor = btn.getAttribute('data-vendor');
      window._cloudConfirmAction = 'unbind';
      window._cloudConfirmDept = cfg.deptName || '';
      window._cloudConfirmVendor = vendor;
      loadAndShowModal('cloud/confirm-action', function () {
        var titleEl = document.getElementById('cloud-confirm-title');
        var msgEl = document.getElementById('cloud-confirm-msg');
        var extraEl = document.getElementById('cloud-confirm-extra');
        if (titleEl) titleEl.textContent = '确认解绑';
        if (msgEl) msgEl.textContent = '确定要解绑' + vendor + '主账号吗？';
        if (extraEl) extraEl.textContent = '解绑后该部门将无法通过平台管理' + vendor + '云上资源，已有资源不受影响。';
        var okBtn = document.getElementById('cloud-confirm-ok');
        if (okBtn) okBtn.style.background = '#ff4d4f';
        // 绑定确认按钮
        var confirmBtn = document.querySelector('#modal-container .ant-btn-primary:not([id])') || document.getElementById('cloud-confirm-ok');
        if (confirmBtn) {
          confirmBtn.onclick = function () {
            // 更新 mock 数据
            for (var k = 0; k < MockData.cloudAccounts.main.length; k++) {
              if (MockData.cloudAccounts.main[k].dept === cfg.deptName && MockData.cloudAccounts.main[k].vendor === vendor) {
                MockData.cloudAccounts.main[k].account = '';
                MockData.cloudAccounts.main[k].bindUser = '';
                MockData.cloudAccounts.main[k].bindTime = '';
                MockData.cloudAccounts.main[k].status = '未绑定';
                MockData.cloudAccounts.main[k].region = '';
                MockData.cloudAccounts.main[k].regionName = '';
                break;
              }
            }
            cfg.cloudAccount = '';
            cfg.cloudAccountBound = false;
            hideModal();
            showMessage('已解绑' + vendor + '主账号', 'success');
            renderDeptConfig();
          };
        }
      });
    };
  });
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
      html += '<tr>';
      html += '<td style="padding-left:28px;">' + esc(tpl.resType) + '</td>';
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

  // 查找部门云账号绑定的地域（用于固化 RegionId 字段）
  var deptRegion = '';
  var deptRegionName = '';
  if (cfg.cloudAccount) {
    for (var ri = 0; ri < MockData.cloudAccounts.main.length; ri++) {
      if (MockData.cloudAccounts.main[ri].account === cfg.cloudAccount) {
        deptRegion = MockData.cloudAccounts.main[ri].region || '';
        deptRegionName = MockData.cloudAccounts.main[ri].regionName || deptRegion;
        break;
      }
    }
  }

  var resLabel = deptTpl.subRes ? deptTpl.resType + ' / ' + deptTpl.subRes : deptTpl.resType;
  var html = '<div style="margin-bottom:16px;">';
  html += '<a class="ant-btn-link dept-tpl-back-btn" style="font-size:14px;">&larr; 返回模板列表</a>';
  html += '</div>';
  html += '<div class="ant-card"><div class="ant-card-head"><span>编辑部门模板 - ' + esc(resLabel) + ' / ' + esc(deptTpl.opType) + '</span></div>';
  html += '<div class="ant-card-body">';
  html += '<div class="ant-alert ant-alert-info" style="margin-bottom:16px;">';
  html += '<div style="font-weight:500;margin-bottom:8px;">部门配置说明</div>';
  html += '<div style="font-size:12px;color:#595959;line-height:2;">';
  html += '<b style="display:inline-block;width:60px;">仅显示</b>平台模板中标记为「可见」的字段，部门在此基础上进行二次限制。<br>';
  html += '<b style="display:inline-block;width:60px;">是否可见</b>可隐藏字段；<span style="color:#d46b08;font-weight:500;">若字段为必填且设为不可见，则必须在「部门配置」中填写传参值（默认值）。</span><br>';
  html += '<b style="display:inline-block;width:60px;">部门配置</b>';
  html += '<span class="ant-tag" style="font-size:11px;margin:0 2px 0 0;">select</span>默认值；接口型：限定/级联；固定型：子集筛选&emsp;';
  html += '<span class="ant-tag" style="font-size:11px;margin:0 2px 0 0;">string</span>正则校验 + 默认值&emsp;';
  html += '<span class="ant-tag" style="font-size:11px;margin:0 2px 0 0;">number</span>缩小范围 + 默认值&emsp;';
  html += '<span class="ant-tag" style="font-size:11px;margin:0 2px 0 0;">textarea</span>默认值&emsp;';
  html += '<span class="ant-tag" style="font-size:11px;margin:0 2px 0 0;">boolean</span>默认值&emsp;';
  html += '<span class="ant-tag" style="font-size:11px;margin:0 2px 0 0;">fixed</span>不可配置';
  html += '</div>';
  html += '</div>';

  (platformTpl.fieldGroups || []).forEach(function (group, gIdx) {
    html += '<div style="margin-bottom:16px;border:1px solid #f0f0f0;border-radius:6px;">';
    html += '<div style="padding:8px 16px;background:#fafafa;border-bottom:1px solid #f0f0f0;font-weight:500;border-radius:6px 6px 0 0;">&#128193; ' + esc(group.groupName) + '</div>';
    html += '<table class="ant-table" style="margin:0;table-layout:fixed;"><thead><tr>';
    html += '<th style="width:11%;">字段参数名</th>';
    html += '<th style="width:9%;">字段名称</th>';
    html += '<th style="width:6%;">是否必填</th>';
    html += '<th style="width:6%;">字段类型</th>';
    html += '<th style="width:16%;">平台默认规范</th>';
    html += '<th style="width:7%;">是否可见</th>';
    html += '<th style="width:15%;">默认值</th>';
    html += '<th style="width:30%;">部门配置</th>';
    html += '</tr></thead><tbody>';
    group.fields.forEach(function (field) {
      var key = gIdx + '|' + field.param;

      // RegionId 固化为云账号地域，不允许部门修改
      if (field.param === 'RegionId') {
        html += '<tr style="background:#f0f7ff;">';
        html += '<td><code style="font-size:11px;word-break:break-all;color:#722ed1;">RegionId</code></td>';
        html += '<td style="font-size:13px;">地域</td>';
        html += '<td style="text-align:center;"><span class="ant-tag ant-tag-red" style="font-size:10px;">必填</span></td>';
        html += '<td style="text-align:center;"><span class="ant-tag ant-tag-default" style="font-size:11px;">select</span></td>';
        html += '<td style="font-size:11px;"><span style="color:#595959;">接口获取</span></td>';
        html += '<td style="text-align:center;"><label class="toggle-switch"><input type="checkbox" disabled checked /><span class="toggle-slider"></span></label></td>';
        html += '<td style="font-size:12px;color:#1890ff;">' + (deptRegionName ? esc(deptRegionName) : '<span style="color:#bfbfbf;font-size:11px;">未绑定账号</span>') + '</td>';
        html += '<td><div style="display:flex;align-items:center;gap:6px;">';
        html += '<span class="ant-tag" style="font-size:11px;background:#e6f7ff;border-color:#91caff;color:#0958d9;">云账号地域</span>';
        html += '<span style="font-size:12px;color:#888;">固定，不可修改</span>';
        html += '</div></td>';
        html += '</tr>';
        return;
      }
      var override = deptTpl.fieldOverrides[key] || {};
      var show = override.show !== undefined ? override.show : true;
      var isRequired = !!field.required;
      var hiddenRequired = isRequired && !show && !override.defaultValue && !override.fixedValue && field.type !== 'fixed';
      var rowStyle = hiddenRequired ? 'background:#fff7e6;' : (!show ? 'background:#fafafa;opacity:0.6;' : '');
      html += '<tr data-row-key="' + esc(key) + '"' + (rowStyle ? ' style="' + rowStyle + '"' : '') + '>';

      // 字段参数名
      html += '<td><code style="font-size:11px;word-break:break-all;color:#722ed1;">' + esc(field.param) + '</code></td>';

      // 字段名称
      html += '<td style="font-size:13px;">' + esc(field.name) + '</td>';

      // 是否必填
      html += '<td style="text-align:center;">';
      html += isRequired ? '<span class="ant-tag ant-tag-red" style="font-size:10px;">必填</span>' : '<span style="color:#bfbfbf;font-size:11px;">选填</span>';
      html += '</td>';

      // 字段类型
      html += '<td style="text-align:center;"><span class="ant-tag ant-tag-default" style="font-size:11px;">' + esc(field.type) + '</span></td>';

      // 平台默认规范
      html += '<td style="font-size:11px;">';
      if (field.type === 'fixed') {
        html += '<span style="color:#888;">固定值：<code style="font-size:10px;">' + esc(field.fixedValue || '—') + '</code></span>';
      } else if (field.type === 'select') {
        var hasRefOpts = field.referenceOptions !== undefined;
        var refOptStr = field.referenceOptions || '';
        var staticOptStr = field.options || '';
        if (hasRefOpts) {
          html += '<div style="display:flex;align-items:center;gap:4px;">';
          html += '<span style="color:#595959;">接口获取</span>';
          html += '<button class="ant-btn ant-btn-sm dept-tpl-view-api-btn" data-key="' + esc(key) + '" data-field="' + esc(field.param) + '" style="padding:0 6px;height:20px;font-size:10px;flex-shrink:0;">查看</button>';
          html += '</div>';
        } else if (staticOptStr) {
          var optList = staticOptStr.split(',').filter(Boolean);
          html += '<div style="display:flex;align-items:center;gap:4px;">';
          html += '<span style="color:#595959;">固定选项，' + optList.length + ' 项</span>';
          html += '<button class="ant-btn ant-btn-sm dept-tpl-view-static-btn" data-key="' + esc(key) + '" data-field="' + esc(field.param) + '" style="padding:0 6px;height:20px;font-size:10px;flex-shrink:0;">查看</button>';
          html += '</div>';
        } else {
          html += '<span style="color:#bfbfbf;">未定义</span>';
        }
      } else if (field.type === 'number') {
        var rangeStr = '';
        if (field.min != null && field.max != null) rangeStr = field.min + ' ~ ' + field.max;
        else if (field.min != null) rangeStr = '≥ ' + field.min;
        else if (field.max != null) rangeStr = '≤ ' + field.max;
        else rangeStr = '无范围限制';
        html += '<span style="color:#595959;">' + esc(rangeStr) + '</span>';
        if (field.decimals != null) html += '，<span style="color:#888;">小数位 ' + field.decimals + '</span>';
      } else if (field.type === 'string') {
        if (field.regex) {
          html += '<code style="font-size:10px;word-break:break-all;color:#722ed1;">' + esc(field.regex) + '</code>';
        } else {
          html += '<span style="color:#bfbfbf;">无约束</span>';
        }
      } else if (field.type === 'textarea') {
        html += '<span style="color:#bfbfbf;">多行文本</span>';
      } else if (field.type === 'boolean') {
        html += '<span style="color:#595959;">true / false</span>';
      } else {
        html += '<span style="color:#bfbfbf;">—</span>';
      }
      html += '</td>';

      // 是否可见
      html += '<td style="text-align:center;">';
      html += '<label class="toggle-switch"><input type="checkbox" class="dept-tpl-field-show" data-key="' + esc(key) + '"' + (show ? ' checked' : '') + ' /><span class="toggle-slider"></span></label>';
      html += '<div class="dept-tpl-hidden-req-warning" style="font-size:10px;color:#d46b08;margin-top:2px;white-space:nowrap;' + (hiddenRequired ? '' : 'display:none;') + '">⚠ 需传参值</div>';
      html += '</td>';

      // 默认值
      html += '<td style="vertical-align:middle;">';
      if (field.type === 'fixed') {
        html += '<span style="color:#bfbfbf;font-size:11px;">—</span>';
      } else if (field.type === 'select') {
        var selectDefault = override.defaultValue || '';
        var defRequired = isRequired && !show;
        html += '<input class="ant-input dept-tpl-select-default" data-key="' + esc(key) + '" value="' + esc(selectDefault) + '" placeholder="' + (defRequired ? '必填' : '选填') + '" style="height:22px;font-size:11px;width:100%;' + (defRequired ? 'border-color:#faad14;' : '') + '" />';
      } else if (field.type === 'string' || field.type === 'textarea') {
        var strDefault = override.defaultValue || '';
        var strDefRequired = isRequired && !show;
        html += '<input class="ant-input dept-tpl-field-default" data-key="' + esc(key) + '" value="' + esc(strDefault) + '" placeholder="' + (strDefRequired ? '必填' : '选填') + '" style="height:22px;font-size:11px;width:100%;' + (strDefRequired ? 'border-color:#faad14;' : '') + '" />';
      } else if (field.type === 'number') {
        var numDefault = override.defaultValue !== undefined ? override.defaultValue : '';
        var numDefRequired = isRequired && !show;
        html += '<input class="ant-input dept-tpl-num-default" data-key="' + esc(key) + '" type="number" value="' + esc(numDefault) + '" placeholder="' + (numDefRequired ? '必填' : '选填') + '" style="height:22px;font-size:11px;width:100%;' + (numDefRequired ? 'border-color:#faad14;' : '') + '" />';
      } else if (field.type === 'boolean') {
        var boolDefault = override.defaultValue || '';
        html += '<select class="ant-select dept-tpl-bool-default" data-key="' + esc(key) + '" style="height:26px;font-size:12px;width:100%;">';
        html += '<option value="">不设置</option>';
        html += '<option value="true"' + (boolDefault === 'true' ? ' selected' : '') + '>true</option>';
        html += '<option value="false"' + (boolDefault === 'false' ? ' selected' : '') + '>false</option>';
        html += '</select>';
      } else {
        var defVal2 = override.defaultValue || '';
        html += '<input class="ant-input dept-tpl-field-default" data-key="' + esc(key) + '" value="' + esc(defVal2) + '" placeholder="默认值" style="height:22px;font-size:11px;width:100%;" />';
      }
      html += '</td>';

      // 部门配置
      var extraDisabled = !show && field.type !== 'fixed';
      html += '<td class="dept-cfg-extra-cell"' + (extraDisabled ? ' style="opacity:0.4;pointer-events:none;"' : '') + '>';
      if (field.type === 'fixed') {
        html += '<span style="color:#bfbfbf;font-size:12px;">不可配置</span>';
      } else if (field.type === 'select') {
        var isStaticField = !!(field.options && !field.referenceOptions);
        var hasOpts = !!(override.options && override.options.trim());
        var hasCascade = !!(override.cascadeFrom);
        var isUnconfigured = !hasOpts && !hasCascade;
        var summaryText = '';
        if (hasCascade) {
          var ruleLines = (override.cascadeData || '').split('\n').filter(Boolean).length;
          summaryText = '级联 ← ' + esc(override.cascadeFrom) + '，' + ruleLines + ' 条规则';
        } else if (hasOpts) {
          var optCount2 = override.options.split(',').filter(Boolean).length;
          summaryText = optCount2 + ' 个选项' + (isStaticField ? '（已筛选）' : '');
        } else {
          summaryText = isStaticField ? '未筛选（使用全部）' : (isRequired ? '⚠ 必填未配置' : '未配置');
        }
        var summaryStyle = (isUnconfigured && isRequired && !isStaticField)
          ? 'font-size:12px;color:#ff4d4f;'
          : (isUnconfigured ? 'font-size:12px;color:#bfbfbf;' : 'font-size:12px;color:#595959;');
        html += '<div style="display:flex;align-items:center;gap:6px;">';
        html += '<span style="' + summaryStyle + '">' + summaryText + '</span>';
        var configBtnLabel = isStaticField ? '&#9881; 筛选' : '&#9881; 配置';
        html += '<button class="ant-btn ant-btn-sm dept-tpl-select-settings-btn" data-key="' + esc(key) + '" style="padding:0 8px;height:22px;font-size:11px;flex-shrink:0;">' + configBtnLabel + '</button>';
        html += '</div>';
      } else if (field.type === 'string') {
        var regexVal = override.regex || '';
        html += '<input class="ant-input dept-tpl-string-regex" data-key="' + esc(key) + '" value="' + esc(regexVal) + '" placeholder="正则校验（留空不限制）" style="height:22px;font-size:11px;font-family:monospace;width:100%;" />';
      } else if (field.type === 'number') {
        var deptMin = override.deptMin !== undefined ? override.deptMin : '';
        var deptMax = override.deptMax !== undefined ? override.deptMax : '';
        html += '<div style="display:flex;align-items:center;gap:4px;font-size:11px;">';
        html += '<span style="color:#888;">下限:</span><input class="ant-input dept-tpl-num-min" data-key="' + esc(key) + '" type="number" value="' + esc(deptMin) + '" placeholder="' + (field.min != null ? field.min : '无') + '" style="height:22px;width:56px;font-size:11px;" />';
        html += '<span style="color:#888;">上限:</span><input class="ant-input dept-tpl-num-max" data-key="' + esc(key) + '" type="number" value="' + esc(deptMax) + '" placeholder="' + (field.max != null ? field.max : '无') + '" style="height:22px;width:56px;font-size:11px;" />';
        html += '</div>';
      } else {
        html += '<span style="color:#bfbfbf;font-size:11px;">—</span>';
      }
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

  // 绑定 平台默认规范「查看」按钮（接口数据结构）
  container.querySelectorAll('.dept-tpl-view-api-btn').forEach(function (btn) {
    btn.onclick = function () {
      var key = btn.getAttribute('data-key');
      var fieldParam = btn.getAttribute('data-field');
      var parts = key.split('|');
      var gIdxV = parseInt(parts[0]);
      var pGroupV = platformTpl.fieldGroups[gIdxV];
      var pFieldV = pGroupV && pGroupV.fields.find(function (f) { return f.param === fieldParam; });
      if (!pFieldV) return;
      showFieldApiInfoModal(fieldParam, pFieldV.name, pFieldV.referenceOptions || '');
    };
  });

  // 绑定 平台默认规范「查看」按钮（固定选项）
  container.querySelectorAll('.dept-tpl-view-static-btn').forEach(function (btn) {
    btn.onclick = function () {
      var key = btn.getAttribute('data-key');
      var fieldParam = btn.getAttribute('data-field');
      var parts = key.split('|');
      var gIdxS = parseInt(parts[0]);
      var pGroupS = platformTpl.fieldGroups[gIdxS];
      var pFieldS = pGroupS && pGroupS.fields.find(function (f) { return f.param === fieldParam; });
      if (!pFieldS) return;
      showStaticOptionsModal(fieldParam, pFieldS.name, pFieldS.options || '');
    };
  });

  // 动态联动：切换「是否可见」时实时更新行样式和传参值状态
  container.querySelectorAll('.dept-tpl-field-show').forEach(function (toggle) {
    toggle.onchange = function () {
      var key = toggle.getAttribute('data-key');
      var parts = key.split('|');
      var gIdx = parseInt(parts[0]);
      var param = parts[1];
      var pGroup = platformTpl.fieldGroups[gIdx];
      var field = pGroup && pGroup.fields.find(function (f) { return f.param === param; });
      var isRequired = !!(field && field.required);
      var show = toggle.checked;
      var hiddenRequired = isRequired && !show;
      var row = toggle.closest('tr');
      if (!row) return;

      // 行背景
      if (hiddenRequired) {
        row.style.background = '#fff7e6'; row.style.opacity = '';
      } else if (!show) {
        row.style.background = '#fafafa'; row.style.opacity = '0.6';
      } else {
        row.style.background = ''; row.style.opacity = '';
      }

      // 警告提示
      var warning = row.querySelector('.dept-tpl-hidden-req-warning');
      if (warning) warning.style.display = hiddenRequired ? '' : 'none';

      // 默认值输入框
      ['.dept-tpl-select-default', '.dept-tpl-field-default', '.dept-tpl-num-default'].forEach(function (sel) {
        var inp = row.querySelector(sel);
        if (inp) {
          inp.style.borderColor = hiddenRequired ? '#faad14' : '';
          inp.placeholder = hiddenRequired ? '必填' : '选填';
        }
      });

      // 部门配置列：不可见时禁用额外配置
      var extraCell = row.querySelector('.dept-cfg-extra-cell');
      if (extraCell) {
        extraCell.style.opacity = (!show) ? '0.4' : '';
        extraCell.style.pointerEvents = (!show) ? 'none' : '';
      }
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
      // 收集 select 传参值（隐藏必填时的默认传参值）
      container.querySelectorAll('.dept-tpl-select-default').forEach(function (input) {
        var key = input.getAttribute('data-key');
        if (!overrides[key]) overrides[key] = {};
        if (input.value.trim()) overrides[key].defaultValue = input.value.trim();
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
            if (saved.defaultValue !== undefined && !overrides[k].defaultValue) overrides[k].defaultValue = saved.defaultValue;
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
      // 收集 boolean 默认值
      container.querySelectorAll('.dept-tpl-bool-default').forEach(function (sel) {
        var key = sel.getAttribute('data-key');
        if (!overrides[key]) overrides[key] = {};
        if (sel.value) overrides[key].defaultValue = sel.value;
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
        if (o.show === false || o.defaultValue || o.fixedValue || o.options || o.cascadeFrom || o.regex || o.deptMin !== undefined || o.deptMax !== undefined) hasCustom = true;
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
  if (!platformField.referenceOptions && !!platformField.options) {
    showStaticSelectSettingsModal(platformField, key, override, onSave);
    return;
  }
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
    html += '<div id="dfset-cascade-from-wrap"></div>';
    html += '<div class="ant-form-extra" style="margin-top:4px;">父字段值变化时，自动筛选本字段的可用选项</div>';
  }
  html += '</div></div>';
  html += '<div class="ant-form-item"><div class="ant-form-label">级联规则</div><div class="ant-form-control">';
  html += '<div id="dfset-cascade-rules-list" style="margin-bottom:6px;"></div>';
  html += '<button type="button" class="ant-btn ant-btn-dashed" id="dfset-add-rule" style="display:flex;width:100%;border-style:dashed;justify-content:center;">+ 添加规则</button>';
  html += '<div class="ant-form-extra" style="margin-top:4px;">每条规则：从父字段选项中选取一个或多个值（可多选）→ 对应本字段的子选项；同一父字段值不可用于多条规则。</div>';
  html += '</div></div>';
  html += '</div>';

  html += '</div>';
  html += '<div class="ant-modal-footer"><button class="ant-btn" onclick="hideModal()">取消</button><button class="ant-btn ant-btn-primary" id="dfset-save-btn">保存</button></div>';
  html += '</div></div>';

  var mc = document.getElementById('modal-container');
  mc.innerHTML = html;
  var overlay = mc.querySelector('.ant-modal-overlay');
  if (overlay) overlay.onclick = function (e) { if (e.target === overlay) hideModal(); };

  // ---- 自定义下拉工具 ----
  function closeAllDropdowns() {
    mc.querySelectorAll('[data-csd-panel]').forEach(function (p) { p.style.display = 'none'; });
  }
  mc.addEventListener('click', function () { closeAllDropdowns(); });

  // 自定义单选下拉
  function makeCSD(opts, selectedVal, placeholder, onChange) {
    var currentVal = selectedVal || '';
    var wrap = document.createElement('div'); wrap.style.cssText = 'position:relative;width:100%;user-select:none;';
    var trigger = document.createElement('div');
    trigger.style.cssText = 'display:flex;align-items:center;height:32px;padding:0 10px;border:1px solid #d9d9d9;border-radius:4px;background:#fff;cursor:pointer;font-size:14px;transition:border-color .2s;gap:6px;';
    var trigLabel = document.createElement('span'); trigLabel.style.cssText = 'flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
    var arrow = document.createElement('span'); arrow.innerHTML = '&#9660;'; arrow.style.cssText = 'font-size:10px;color:#bfbfbf;flex-shrink:0;transition:transform .2s;';
    trigger.appendChild(trigLabel); trigger.appendChild(arrow);
    var panel = document.createElement('div'); panel.setAttribute('data-csd-panel', '1');
    panel.style.cssText = 'display:none;position:absolute;top:calc(100% + 2px);left:0;right:0;z-index:2000;background:#fff;border:1px solid #d9d9d9;border-radius:4px;box-shadow:0 4px 12px rgba(0,0,0,.12);max-height:220px;overflow-y:auto;';
    function updateDisplay() {
      var found = null; for (var i = 0; i < opts.length; i++) { if (opts[i].value === currentVal) { found = opts[i]; break; } }
      trigLabel.textContent = found ? found.label : (placeholder || '请选择...');
      trigLabel.style.color = found ? 'var(--text-color)' : '#bfbfbf';
      wrap.dataset.value = currentVal;
      panel.querySelectorAll('[data-v]').forEach(function (item) {
        item.style.background = item.getAttribute('data-v') === currentVal ? '#e6f7ff' : '';
        item.style.color = item.getAttribute('data-v') === currentVal ? '#1890ff' : '';
      });
    }
    opts.forEach(function (opt) {
      var item = document.createElement('div'); item.setAttribute('data-v', opt.value);
      item.style.cssText = 'padding:7px 12px;cursor:pointer;font-size:14px;' + (opt.value === currentVal ? 'background:#e6f7ff;color:#1890ff;' : '');
      item.textContent = opt.label;
      item.onmouseenter = function () { if (opt.value !== currentVal) item.style.background = '#f5f5f5'; };
      item.onmouseleave = function () { item.style.background = (opt.value === currentVal) ? '#e6f7ff' : ''; item.style.color = (opt.value === currentVal) ? '#1890ff' : ''; };
      item.onclick = function (e) {
        e.stopPropagation(); currentVal = opt.value; updateDisplay();
        panel.style.display = 'none'; arrow.style.transform = ''; trigger.style.borderColor = '#d9d9d9';
        if (onChange) onChange(currentVal);
      };
      panel.appendChild(item);
    });
    trigger.onclick = function (e) {
      e.stopPropagation(); var isOpen = panel.style.display !== 'none'; closeAllDropdowns();
      if (!isOpen) { panel.style.display = 'block'; trigger.style.borderColor = 'var(--primary-color)'; arrow.style.transform = 'rotate(180deg)'; }
      else { trigger.style.borderColor = '#d9d9d9'; arrow.style.transform = ''; }
    };
    trigger.onmouseenter = function () { trigger.style.borderColor = 'var(--primary-color)'; };
    trigger.onmouseleave = function () { if (panel.style.display === 'none') trigger.style.borderColor = '#d9d9d9'; };
    wrap.appendChild(trigger); wrap.appendChild(panel); updateDisplay();
    return wrap;
  }

  // 自定义多选下拉（复选框 + 选后标签平铺）
  function makeCSDMulti(initialOpts, initialSel, placeholder) {
    var sel = (initialSel || []).slice();
    var currentOpts = (initialOpts || []).slice();
    var wrap = document.createElement('div'); wrap.className = 'dfset-rule-parent-wrap'; wrap.style.cssText = 'position:relative;width:100%;user-select:none;';
    var trigger = document.createElement('div');
    trigger.style.cssText = 'min-height:32px;padding:3px 8px 3px 6px;border:1px solid #d9d9d9;border-radius:4px;background:#fff;cursor:pointer;display:flex;flex-wrap:wrap;gap:4px;align-items:center;transition:border-color .2s;';
    var panel = document.createElement('div'); panel.setAttribute('data-csd-panel', '1');
    panel.style.cssText = 'display:none;position:absolute;top:calc(100% + 2px);left:0;right:0;z-index:2000;background:#fff;border:1px solid #d9d9d9;border-radius:4px;box-shadow:0 4px 12px rgba(0,0,0,.12);max-height:220px;overflow-y:auto;';
    function getOptByVal(v) { for (var i = 0; i < currentOpts.length; i++) { if (currentOpts[i].value === v) return currentOpts[i]; } return null; }
    function renderTags() {
      trigger.innerHTML = '';
      if (sel.length === 0) {
        var ph = document.createElement('span'); ph.textContent = placeholder || '请选择（可多选）...'; ph.style.cssText = 'color:#bfbfbf;font-size:13px;line-height:22px;flex:1;'; trigger.appendChild(ph);
      } else {
        sel.forEach(function (v) {
          var opt = getOptByVal(v);
          var tag = document.createElement('span');
          tag.style.cssText = 'display:inline-flex;align-items:center;gap:2px;background:#e6f7ff;border:1px solid #91d5ff;border-radius:3px;padding:0 4px 0 7px;height:22px;font-size:12px;color:#096dd9;max-width:140px;';
          var tagText = document.createElement('span'); tagText.textContent = opt ? opt.label : v; tagText.style.cssText = 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
          var x = document.createElement('span'); x.innerHTML = '&times;'; x.style.cssText = 'cursor:pointer;margin-left:3px;font-size:14px;line-height:1;color:#4096ff;flex-shrink:0;';
          x.onclick = function (e) { e.stopPropagation(); sel = sel.filter(function (s) { return s !== v; }); renderTags(); rebuildPanel(); };
          tag.appendChild(tagText); tag.appendChild(x); trigger.appendChild(tag);
        });
      }
      var arr = document.createElement('span'); arr.innerHTML = '&#9660;'; arr.style.cssText = 'font-size:10px;color:#bfbfbf;margin-left:auto;flex-shrink:0;padding-left:4px;'; trigger.appendChild(arr);
    }
    function rebuildPanel() {
      panel.innerHTML = '';
      if (currentOpts.length === 0) {
        var empty = document.createElement('div'); empty.style.cssText = 'padding:12px;text-align:center;color:#bfbfbf;font-size:13px;'; empty.textContent = '请先选择父字段'; panel.appendChild(empty); return;
      }
      currentOpts.forEach(function (opt) {
        var checked = sel.indexOf(opt.value) >= 0;
        var item = document.createElement('div');
        item.style.cssText = 'display:flex;align-items:center;gap:8px;padding:7px 12px;cursor:pointer;font-size:13px;' + (checked ? 'background:#e6f7ff;' : '');
        var cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = checked;
        cb.style.cssText = 'flex-shrink:0;width:14px;height:14px;accent-color:var(--primary-color);pointer-events:none;';
        var lbl = document.createElement('span'); lbl.textContent = opt.label;
        item.appendChild(cb); item.appendChild(lbl);
        item.onmouseenter = function () { item.style.background = '#f0f5ff'; };
        item.onmouseleave = function () { item.style.background = sel.indexOf(opt.value) >= 0 ? '#e6f7ff' : ''; };
        item.onclick = function (e) {
          e.stopPropagation(); var idx = sel.indexOf(opt.value);
          if (idx >= 0) sel.splice(idx, 1); else sel.push(opt.value);
          renderTags(); rebuildPanel();
        };
        panel.appendChild(item);
      });
    }
    trigger.onclick = function (e) {
      e.stopPropagation(); var isOpen = panel.style.display !== 'none'; closeAllDropdowns();
      if (!isOpen) { panel.style.display = 'block'; trigger.style.borderColor = 'var(--primary-color)'; }
    };
    trigger.onmouseenter = function () { trigger.style.borderColor = 'var(--primary-color)'; };
    trigger.onmouseleave = function () { if (panel.style.display === 'none') trigger.style.borderColor = '#d9d9d9'; };
    wrap._getSelected = function () { return sel.slice(); };
    wrap._refreshOpts = function (newOpts) {
      currentOpts = (newOpts || []).slice();
      sel = sel.filter(function (v) { return currentOpts.some(function (o) { return o.value === v; }); });
      renderTags(); rebuildPanel();
    };
    wrap.appendChild(trigger); wrap.appendChild(panel);
    rebuildPanel(); renderTags();
    return wrap;
  }

  // ---- 工具函数 ----
  function makeOptRow(lbl, val, parentList) {
    var row = document.createElement('div'); row.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:6px;';
    var lIn = document.createElement('input'); lIn.className = 'ant-input dfset-opt-label'; lIn.value = lbl; lIn.placeholder = '展示名'; lIn.style.cssText = 'flex:1;min-width:0;max-width:none;';
    var eq = document.createElement('span'); eq.textContent = '='; eq.style.cssText = 'color:#bbb;flex-shrink:0;';
    var vIn = document.createElement('input'); vIn.className = 'ant-input dfset-opt-value'; vIn.value = val; vIn.placeholder = '实际值'; vIn.style.cssText = 'flex:1;min-width:0;max-width:none;';
    var del = document.createElement('button'); del.type = 'button'; del.textContent = '×'; del.style.cssText = 'flex-shrink:0;width:28px;height:28px;border:1px solid #ffccc7;border-radius:3px;background:#fff2f0;color:#ff4d4f;cursor:pointer;font-size:16px;line-height:1;padding:0;';
    del.onclick = function () { parentList.removeChild(row); };
    row.appendChild(lIn); row.appendChild(eq); row.appendChild(vIn); row.appendChild(del);
    return row;
  }

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

  function getParentFieldOpts() {
    var cfw = document.getElementById('dfset-cascade-from-wrap');
    var val = cfw ? (cfw.dataset.value || '') : '';
    if (!val) return [];
    var pf = null; for (var i = 0; i < otherSelects.length; i++) { if (otherSelects[i].param === val) { pf = otherSelects[i]; break; } }
    if (!pf) return [];
    return (pf.referenceOptions || '').split(',').map(function (o) {
      o = o.trim(); var eq = o.indexOf('=');
      return eq > 0 ? { label: o.slice(0, eq).trim(), value: o.slice(eq + 1).trim() } : { label: o, value: o };
    }).filter(function (o) { return o.label; });
  }

  function refreshRuleParentSelects(rulesListEl) {
    var opts = getParentFieldOpts();
    rulesListEl.querySelectorAll('.dfset-rule-parent-wrap').forEach(function (w) { w._refreshOpts(opts); });
  }

  function makeRuleRow(pVals, children, rulesList) {
    var ruleDiv = document.createElement('div'); ruleDiv.style.cssText = 'border:1px solid #e8e8e8;border-radius:4px;padding:10px 12px;margin-bottom:8px;background:#fafafa;';
    var headerRow = document.createElement('div'); headerRow.style.cssText = 'display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;';
    var pLblWrap = document.createElement('div'); pLblWrap.style.cssText = 'flex-shrink:0;width:56px;padding-top:7px;';
    var pLbl = document.createElement('div'); pLbl.textContent = '父字段值'; pLbl.style.cssText = 'font-size:12px;color:#888;';
    pLblWrap.appendChild(pLbl);
    var pMultiWrap = makeCSDMulti(getParentFieldOpts(), pVals, '请选择父字段值（可多选）...');
    pMultiWrap.style.flex = '1'; pMultiWrap.style.minWidth = '0';
    var delBtn = document.createElement('button'); delBtn.type = 'button'; delBtn.textContent = '删除规则';
    delBtn.style.cssText = 'flex-shrink:0;padding:0 8px;height:28px;border:1px solid #ffccc7;border-radius:3px;background:#fff2f0;color:#ff4d4f;cursor:pointer;font-size:12px;margin-top:2px;';
    delBtn.onclick = function () { rulesList.removeChild(ruleDiv); };
    headerRow.appendChild(pLblWrap); headerRow.appendChild(pMultiWrap); headerRow.appendChild(delBtn);
    var childLbl = document.createElement('div'); childLbl.textContent = '↳ 子选项'; childLbl.style.cssText = 'font-size:12px;color:#888;margin-bottom:4px;';
    var childrenDiv = document.createElement('div'); childrenDiv.className = 'dfset-rule-children'; childrenDiv.style.cssText = 'padding-left:8px;';
    var addChildBtn = document.createElement('button'); addChildBtn.type = 'button'; addChildBtn.textContent = '+ 添加子选项';
    addChildBtn.style.cssText = 'display:flex;justify-content:center;margin-top:4px;padding:0 8px;height:24px;font-size:12px;border:1px dashed #d9d9d9;border-radius:3px;background:#fff;cursor:pointer;width:100%;';
    addChildBtn.onclick = function () { childrenDiv.appendChild(makeChildRow('', '', childrenDiv)); };
    (children || []).forEach(function (c) { childrenDiv.appendChild(makeChildRow(c.label, c.value, childrenDiv)); });
    ruleDiv.appendChild(headerRow); ruleDiv.appendChild(childLbl); ruleDiv.appendChild(childrenDiv); ruleDiv.appendChild(addChildBtn);
    return ruleDiv;
  }

  // ---- 初始化父字段自定义单选 ----
  var cascFromWrap = document.getElementById('dfset-cascade-from-wrap');
  if (cascFromWrap) {
    cascFromWrap.dataset.value = override.cascadeFrom || '';
    var cascFromOpts = otherSelects.map(function (pf) { return { label: pf.name || pf.param, value: pf.param }; });
    cascFromWrap.appendChild(makeCSD(cascFromOpts, override.cascadeFrom || '', '请选择父字段（必须是 select 类型）...', function (val) {
      cascFromWrap.dataset.value = val;
      var rl = document.getElementById('dfset-cascade-rules-list');
      if (rl) refreshRuleParentSelects(rl);
    }));
  }

  // ---- 填充选项 ----
  var optsList = document.getElementById('dfset-options-list');
  (override.options || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean).forEach(function (opt) {
    var eq = opt.indexOf('=');
    optsList.appendChild(makeOptRow(eq > 0 ? opt.slice(0, eq).trim() : opt, eq > 0 ? opt.slice(eq + 1).trim() : opt, optsList));
  });
  document.getElementById('dfset-add-option').onclick = function () { optsList.appendChild(makeOptRow('', '', optsList)); };

  // ---- 填充级联规则 ----
  var rulesList = document.getElementById('dfset-cascade-rules-list');
  if (rulesList) {
    (override.cascadeData || '').split('\n').filter(Boolean).forEach(function (line) {
      var ci = line.indexOf(':');
      var pValsStr = ci >= 0 ? line.slice(0, ci).trim() : line.trim();
      var pVals = pValsStr.split('|').map(function (s) { return s.trim(); }).filter(Boolean);
      var children = (ci >= 0 ? line.slice(ci + 1) : '').split(',').map(function (s) {
        s = s.trim(); var eq = s.indexOf('=');
        return eq > 0 ? { label: s.slice(0, eq).trim(), value: s.slice(eq + 1).trim() } : { label: s, value: s };
      }).filter(function (c) { return c.label || c.value; });
      rulesList.appendChild(makeRuleRow(pVals, children, rulesList));
    });
    var addRuleBtn = document.getElementById('dfset-add-rule');
    if (addRuleBtn) addRuleBtn.onclick = function () { rulesList.appendChild(makeRuleRow([], [], rulesList)); };
  }

  // ---- 级联开关联动 ----
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

  // ---- 保存 ----
  document.getElementById('dfset-save-btn').onclick = function () {
    if (cascadeChk && cascadeChk.checked) {
      var cfwEl = document.getElementById('dfset-cascade-from-wrap');
      override.cascadeFrom = cfwEl ? (cfwEl.dataset.value || '').trim() : '';
      var rules = [];
      var usedVals = {};
      var dupError = null;
      Array.prototype.forEach.call(rulesList.children, function (ruleDiv) {
        var pWrap = ruleDiv.querySelector('.dfset-rule-parent-wrap');
        var childrenDiv = ruleDiv.querySelector('.dfset-rule-children');
        if (!pWrap) return;
        var pVals = pWrap._getSelected();
        pVals.forEach(function (v) {
          if (usedVals[v]) dupError = dupError || ('父字段值「' + v + '」在多条规则中重复，每个值只能用于一条规则');
          usedVals[v] = true;
        });
        var childParts = [];
        Array.prototype.forEach.call(childrenDiv.children, function (childRow) {
          var cl = childRow.querySelector('.dfset-child-label'), cv = childRow.querySelector('.dfset-child-value');
          if (cl && cv) { var cL = cl.value.trim(), cV = cv.value.trim(); if (cL || cV) childParts.push((cL || cV) + '=' + (cV || cL)); }
        });
        if (pVals.length) rules.push(pVals.join('|') + ':' + childParts.join(','));
      });
      if (dupError) { showMessage(dupError, 'error'); return; }
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

// 固定选项子集筛选弹窗（部门配置 ⚙ 筛选按钮）
function showStaticSelectSettingsModal(platformField, key, override, onSave) {
  var staticOpts = (platformField.options || '').split(',').filter(Boolean).map(function (o) {
    o = o.trim(); var eq = o.indexOf('=');
    return eq > 0 ? { label: o.slice(0, eq).trim(), value: o.slice(eq + 1).trim(), raw: o } : { label: o, value: o, raw: o };
  }).filter(function (o) { return o.label; });

  var savedRaws = (override.options || '').split(',').filter(Boolean).map(function (s) { return s.trim(); });
  var allSelected = savedRaws.length === 0;

  var html = '<div class="ant-modal-overlay" style="display:flex;">';
  html += '<div class="ant-modal" style="width:500px;max-height:88vh;overflow-y:auto;">';
  html += '<div class="ant-modal-header">字段选项筛选';
  html += '<span style="font-size:13px;color:var(--text-secondary);margin-left:8px;">· ' + esc(platformField.name) + '</span>';
  html += '<button class="ant-modal-close" onclick="hideModal()">&times;</button></div>';
  html += '<div class="ant-modal-body">';
  html += '<div style="background:#fffbe6;border:1px solid #ffe58f;border-radius:4px;padding:8px 12px;margin-bottom:12px;font-size:12px;color:#876800;">';
  html += '只能从平台固定选项中删减，不可添加或修改选项名称和值。';
  html += '</div>';
  html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">';
  html += '<span style="font-size:13px;font-weight:500;">选项列表</span>';
  html += '<div style="display:flex;gap:12px;">';
  html += '<a id="dfset-static-select-all" style="font-size:12px;color:#1890ff;cursor:pointer;">全选</a>';
  html += '<a id="dfset-static-deselect-all" style="font-size:12px;color:#1890ff;cursor:pointer;">全不选</a>';
  html += '</div></div>';
  html += '<div id="dfset-static-opts-list" style="border:1px solid #f0f0f0;border-radius:4px;overflow:hidden;">';
  staticOpts.forEach(function (opt, i) {
    var checked = allSelected || savedRaws.some(function (r) {
      var eq = r.indexOf('='); var rv = eq > 0 ? r.slice(eq + 1).trim() : r;
      return rv === opt.value || r === opt.raw;
    });
    html += '<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;' + (i < staticOpts.length - 1 ? 'border-bottom:1px solid #f0f0f0;' : '') + '">';
    html += '<input type="checkbox" class="dfset-static-opt-cb" data-raw="' + esc(opt.raw) + '"' + (checked ? ' checked' : '') + ' style="width:14px;height:14px;cursor:pointer;accent-color:var(--primary-color);" />';
    html += '<span style="flex:1;font-size:13px;">' + esc(opt.label) + '</span>';
    html += '<code style="font-size:11px;color:#722ed1;background:#f9f0ff;border-radius:3px;padding:1px 5px;">' + esc(opt.value) + '</code>';
    html += '</div>';
  });
  html += '</div>';
  html += '</div>';
  html += '<div class="ant-modal-footer">';
  html += '<button class="ant-btn" onclick="hideModal()">取消</button>';
  html += '<button class="ant-btn ant-btn-primary" id="dfset-static-save-btn">保存</button>';
  html += '</div></div></div>';

  var mc = document.getElementById('modal-container');
  mc.innerHTML = html;
  var overlay = mc.querySelector('.ant-modal-overlay');
  if (overlay) overlay.onclick = function (e) { if (e.target === overlay) hideModal(); };

  document.getElementById('dfset-static-select-all').onclick = function () {
    mc.querySelectorAll('.dfset-static-opt-cb').forEach(function (cb) { cb.checked = true; });
  };
  document.getElementById('dfset-static-deselect-all').onclick = function () {
    mc.querySelectorAll('.dfset-static-opt-cb').forEach(function (cb) { cb.checked = false; });
  };

  document.getElementById('dfset-static-save-btn').onclick = function () {
    var checkedRaws = [];
    mc.querySelectorAll('.dfset-static-opt-cb').forEach(function (cb) {
      if (cb.checked) checkedRaws.push(cb.getAttribute('data-raw'));
    });
    if (checkedRaws.length === 0) { showMessage('至少需要保留一个选项', 'warning'); return; }
    override.options = (checkedRaws.length === staticOpts.length) ? '' : checkedRaws.join(',');
    hideModal();
    onSave();
  };
}

// 查看固定选项弹窗（平台默认规范「查看」按钮）
function showStaticOptionsModal(fieldParam, fieldName, optionsStr) {
  var opts = (optionsStr || '').split(',').filter(Boolean).map(function (o) {
    o = o.trim(); var eq = o.indexOf('=');
    return eq > 0 ? { label: o.slice(0, eq).trim(), value: o.slice(eq + 1).trim() } : { label: o, value: o };
  }).filter(function (o) { return o.label; });

  var html = '<div class="ant-modal-overlay" style="display:flex;">';
  html += '<div class="ant-modal" style="width:420px;max-height:80vh;overflow-y:auto;">';
  html += '<div class="ant-modal-header">固定选项';
  html += '<span style="font-size:12px;color:var(--text-secondary);font-weight:normal;margin-left:8px;">· ' + esc(fieldName) + ' (' + esc(fieldParam) + ')</span>';
  html += '<button class="ant-modal-close" onclick="hideModal()">&times;</button></div>';
  html += '<div class="ant-modal-body" style="padding:0;">';
  html += '<table class="ant-table"><thead><tr><th>展示名</th><th>传参值</th></tr></thead><tbody>';
  if (opts.length === 0) {
    html += '<tr><td colspan="2" style="text-align:center;color:#bfbfbf;padding:24px;">暂无选项</td></tr>';
  } else {
    opts.forEach(function (o) {
      html += '<tr>';
      html += '<td>' + esc(o.label) + '</td>';
      html += '<td><code style="font-size:12px;color:#722ed1;">' + esc(o.value) + '</code></td>';
      html += '</tr>';
    });
  }
  html += '</tbody></table>';
  html += '</div>';
  html += '<div class="ant-modal-footer"><button class="ant-btn" onclick="hideModal()">关闭</button></div>';
  html += '</div></div>';

  var mc = document.getElementById('modal-container');
  mc.innerHTML = html;
  var overlay = mc.querySelector('.ant-modal-overlay');
  if (overlay) overlay.onclick = function (e) { if (e.target === overlay) hideModal(); };
}

// 查看接口数据结构弹窗（select 字段平台默认规范）
function showFieldApiInfoModal(fieldParam, fieldName, referenceOptions) {
  var apiMocks = {
    'RegionId':        { sample: [{ RegionId: 'cn-beijing', LocalName: '华北2（北京）' }, { RegionId: 'cn-hangzhou', LocalName: '华东1（杭州）' }, { RegionId: 'cn-shanghai', LocalName: '华东2（上海）' }] },
    'ZoneId':          { sample: [{ ZoneId: 'cn-beijing-b', LocalName: '华北2可用区B' }, { ZoneId: 'cn-beijing-c', LocalName: '华北2可用区C' }] },
    'InstanceType':    { sample: [{ InstanceTypeId: 'ecs.c7.large', CpuCoreCount: 2, MemorySize: 4, InstanceTypeFamily: 'ecs.c7' }] },
    'VpcId':           { sample: [{ VpcId: 'vpc-bp1xxxxx', VpcName: 'vpc-prod', CidrBlock: '10.0.0.0/8', Status: 'Available' }] },
    'VSwitchId':       { sample: [{ VSwitchId: 'vsw-bp1xxxxx', VSwitchName: 'vsw-prod-app', ZoneId: 'cn-beijing-b', CidrBlock: '10.0.1.0/24' }] },
    'SecurityGroupId': { sample: [{ SecurityGroupId: 'sg-bp1xxxxx', SecurityGroupName: 'sg-web', Description: 'Web 服务安全组' }] },
    'ImageId':         { sample: [{ ImageId: 'aliyun_3_x64_20G_alibase_20240819.vhd', ImageName: 'Alibaba Cloud Linux 3', OSName: 'Alibaba Cloud Linux  3.2104 LTS 64位' }] }
  };
  var mock = apiMocks[fieldParam];
  var sampleData = mock ? mock.sample : [{}];
  var jsonStr = JSON.stringify({ RequestId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', TotalCount: sampleData.length, PageSize: 50, PageNumber: 1, Data: sampleData }, null, 2);

  var html = '<div class="ant-modal-overlay" style="display:flex;">';
  html += '<div class="ant-modal" style="width:660px;max-height:88vh;overflow-y:auto;">';
  html += '<div class="ant-modal-header">接口数据规范';
  html += '<span style="font-size:12px;color:var(--text-secondary);font-weight:normal;margin-left:8px;">· ' + esc(fieldName) + ' (' + esc(fieldParam) + ')</span>';
  html += '<button class="ant-modal-close" onclick="hideModal()">&times;</button></div>';
  html += '<div class="ant-modal-body">';
  html += '<pre style="background:#1e2127;color:#abb2bf;padding:14px 16px;border-radius:6px;font-size:12px;line-height:1.6;overflow-x:auto;margin:0;">' + esc(jsonStr) + '</pre>';
  html += '</div>';
  html += '<div class="ant-modal-footer"><button class="ant-btn" onclick="hideModal()">关闭</button></div>';
  html += '</div></div>';

  var mc = document.getElementById('modal-container');
  mc.innerHTML = html;
  var overlay = mc.querySelector('.ant-modal-overlay');
  if (overlay) overlay.onclick = function (e) { if (e.target === overlay) hideModal(); };
}

function renderDeptApproval(container, cfg, deptId) {
  // 从资源目录构建树状审批流程列表（部门自行配置审批模板）
  var categoryOrder = getCatalogCategoryOrder();
  // 查找部门配置
  function findDeptFlow(resType, opType, subRes) {
    for (var i = 0; i < cfg.approvalFlows.length; i++) {
      var f = cfg.approvalFlows[i];
      if (f.resType === resType && f.opType === opType && (f.subRes || '') === (subRes || '')) return f;
    }
    return null;
  }
  // 获取部门负责人姓名（用于流程节点显示）
  var deptLeader = '';
  MockData.members.forEach(function (m) {
    if (m.role === '部门负责人' && m.orgName === (cfg.deptName || '')) deptLeader = m.name;
  });
  // 构建树状数据：按大类 → 资源类型 → 操作，未配置默认 leader+l5
  var treeItems = [];
  MockData.resCatalog.forEach(function (cat) {
    cat.types.forEach(function (t) {
      var ops = t.approvalOps || [];
      ops.forEach(function (op) {
        var df = findDeptFlow(t.name, op, '');
        treeItems.push({
          category: cat.name, resType: t.name, opType: op, subRes: '',
          flowTemplate: df ? (df.flowTemplate || 'leader+l5') : 'leader+l5',
          admin1: df ? (df.admin1 || '') : '',
          admin2: df ? (df.admin2 || '') : '',
          configured: !!df,
          deptFlow: df
        });
      });
    });
  });

  var result = groupByCategory(treeItems, categoryOrder);
  var html = '<div class="ant-card"><div class="ant-card-head"><span>资源审批配置</span></div><div class="ant-card-body" style="padding:0;">';
  html += '<div class="ant-alert ant-alert-info" style="margin:16px 16px 0;">各部门可为每类资源操作独立配置审批流程，默认为「直属领导 + 部门负责人」审批。</div>';

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
    html += '<th style="width:54%;">审批流程</th>';
    html += '<th style="width:16%;">操作</th>';
    html += '</tr></thead><tbody>';
    items.forEach(function (item) {
      html += '<tr>';
      html += '<td style="padding-left:28px;">' + esc(item.resType) + '</td>';
      html += '<td>' + esc(item.opType) + '</td>';
      html += '<td>' + renderFlowStepsPreview(item.flowTemplate, item.admin1, item.admin2, deptLeader) + '</td>';
      html += '<td>';
      html += '<a class="ant-btn-link dept-approval-edit-btn" data-res="' + esc(item.resType) + '" data-op="' + esc(item.opType) + '" data-flow="' + esc(item.flowTemplate) + '" data-cat="' + esc(item.category) + '">配置</a>';
      if (item.configured) {
        html += ' <a class="ant-btn-link dept-approval-restore-btn" data-res="' + esc(item.resType) + '" data-op="' + esc(item.opType) + '" style="margin-left:6px;color:#faad14;">重置</a>';
      }
      html += '</td>';
      html += '</tr>';
    });
    html += '</tbody></table>';
    html += '</div></div>';
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
      var flowTemplate = btn.getAttribute('data-flow');
      var category = btn.getAttribute('data-cat');
      var df = findDeptFlow(resType, opType, '');
      showDeptFlowEditModal({
        resType: resType, opType: opType, subRes: '', category: category,
        flowTemplate: flowTemplate || 'leader+l5',
        admin1: df ? df.admin1 : '', admin2: df ? df.admin2 : '',
        deptFlow: df
      }, cfg, deptId, function () {
        renderDeptApproval(container, cfg, deptId);
      });
    };
  });

  // 重置按钮（恢复默认 leader+l5）
  container.querySelectorAll('.dept-approval-restore-btn').forEach(function (btn) {
    btn.onclick = function () {
      var resType = btn.getAttribute('data-res');
      var opType = btn.getAttribute('data-op');
      var idx = -1;
      for (var i = 0; i < cfg.approvalFlows.length; i++) {
        var f = cfg.approvalFlows[i];
        if (f.resType === resType && f.opType === opType && (f.subRes || '') === '') { idx = i; break; }
      }
      if (idx !== -1) cfg.approvalFlows.splice(idx, 1);
      showMessage(resType + ' ' + opType + ' 审批配置已重置为默认（直属领导 + 部门负责人）', 'success');
      renderDeptApproval(container, cfg, deptId);
    };
  });
}

function showDeptFlowEditModal(item, cfg, deptId, onSave) {
  var resLabel = item.subRes ? item.resType + ' / ' + item.subRes : item.resType;
  var flowTemplate = item.flowTemplate || 'leader+l5';
  var curAdmin1 = item.admin1 || '';
  var curAdmin2 = item.admin2 || '';
  // 找部门负责人
  var deptName = cfg.deptName || '';
  var deptLeader = '';
  MockData.members.forEach(function (m) {
    if (m.role === '部门负责人' && m.orgName === deptName) deptLeader = m.name;
  });
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
  html += '<div class="ant-modal-header">配置审批流程 - ' + esc(resLabel) + ' / ' + esc(item.opType) + ' <button class="ant-modal-close" onclick="hideModal()">&times;</button></div>';
  html += '<div class="ant-modal-body">';

  // 审批流程模板选择
  html += '<div class="ant-form-item"><div class="ant-form-label"><span class="required">*</span>审批流程模板</div>';
  html += '<div class="ant-form-control"><select class="ant-select" id="dept-flow-template" style="width:100%;">';
  var flowOptions = [
    { value: 'none', label: '无审批（提交即通过）' },
    { value: 'leader', label: '直属领导审批' },
    { value: 'leader+l5', label: '直属领导 + 部门负责人审批' },
    { value: 'leader+l5+admin1', label: '直属领导 + 部门负责人 + 指定审批人' },
    { value: 'leader+l5+admin2', label: '直属领导 + 部门负责人 + 指定审批人1 + 指定审批人2' }
  ];
  flowOptions.forEach(function (opt) {
    html += '<option value="' + esc(opt.value) + '"' + (flowTemplate === opt.value ? ' selected' : '') + '>' + esc(opt.label) + '</option>';
  });
  html += '</select></div></div>';

  // 指定人员1
  html += '<div class="ant-form-item" id="dept-flow-admin1-row" style="' + (needAdmin1 ? '' : 'display:none;') + '">';
  html += '<div class="ant-form-label"><span class="required">*</span>指定审批人1</div>';
  html += '<div class="ant-form-control"><select class="ant-select" id="dept-flow-admin1" style="width:100%;max-width:280px;">';
  html += '<option value="">请选择</option>';
  candidates.forEach(function (m) {
    html += '<option value="' + esc(m.name) + '"' + (m.name === curAdmin1 ? ' selected' : '') + '>' + esc(m.name) + '（' + esc(m.role) + ' - ' + esc(m.orgName) + '）</option>';
  });
  html += '</select></div></div>';

  // 指定人员2
  html += '<div class="ant-form-item" id="dept-flow-admin2-row" style="' + (needAdmin2 ? '' : 'display:none;') + '">';
  html += '<div class="ant-form-label"><span class="required">*</span>指定审批人2</div>';
  html += '<div class="ant-form-control"><select class="ant-select" id="dept-flow-admin2" style="width:100%;max-width:280px;">';
  html += '<option value="">请选择</option>';
  candidates.forEach(function (m) {
    html += '<option value="' + esc(m.name) + '"' + (m.name === curAdmin2 ? ' selected' : '') + '>' + esc(m.name) + '（' + esc(m.role) + ' - ' + esc(m.orgName) + '）</option>';
  });
  html += '</select></div></div>';

  html += '</div>';
  html += '<div class="ant-modal-footer"><button class="ant-btn" onclick="hideModal()">取消</button><button class="ant-btn ant-btn-primary" id="dept-flow-save">确定</button></div>';
  html += '</div></div>';

  var modalContainer = document.getElementById('modal-container');
  modalContainer.innerHTML = html;
  var overlay = modalContainer.querySelector('.ant-modal-overlay');
  if (overlay) overlay.onclick = function (e) { if (e.target === overlay) hideModal(); };

  // 模板切换时更新显隐和预览
  var templateSel = document.getElementById('dept-flow-template');
  var admin1Row = document.getElementById('dept-flow-admin1-row');
  var admin2Row = document.getElementById('dept-flow-admin2-row');

  templateSel.onchange = function () {
    var tmpl = templateSel.value;
    admin1Row.style.display = (tmpl.indexOf('admin1') !== -1 || tmpl.indexOf('admin2') !== -1) ? '' : 'none';
    admin2Row.style.display = tmpl.indexOf('admin2') !== -1 ? '' : 'none';
  };

  // 保存
  document.getElementById('dept-flow-save').onclick = function () {
    var newTemplate = templateSel.value;
    var needA2 = newTemplate.indexOf('admin2') !== -1;
    var needA1 = newTemplate.indexOf('admin1') !== -1 || needA2;
    var newAdmin1 = needA1 && document.getElementById('dept-flow-admin1') ? document.getElementById('dept-flow-admin1').value : '';
    var newAdmin2 = needA2 && document.getElementById('dept-flow-admin2') ? document.getElementById('dept-flow-admin2').value : '';
    if (needA1 && !newAdmin1) { showMessage('请选择指定审批人1', 'warning'); return; }
    if (needA2 && !newAdmin2) { showMessage('请选择指定审批人2', 'warning'); return; }
    // 更新或创建部门流程配置
    var df = item.deptFlow;
    if (df) {
      df.flowTemplate = newTemplate;
      df.admin1 = newAdmin1;
      df.admin2 = newAdmin2;
    } else {
      cfg.approvalFlows.push({
        id: 'flow-new-' + Date.now(),
        resType: item.resType, opType: item.opType, category: item.category || '',
        subRes: item.subRes || '',
        flowTemplate: newTemplate, admin1: newAdmin1, admin2: newAdmin2
      });
    }
    hideModal();
    showMessage(resLabel + ' ' + item.opType + ' 审批配置已更新', 'success');
    if (onSave) onSave();
  };
}

// =============================================
// 部门配置 — 工单处理配置
// =============================================
function renderDeptTicketHandlers(container, cfg, deptId) {
  var SYSTEM_CAT_IDS = ['cat-auth', 'cat-resource', 'cat-network', 'cat-security'];
  if (!cfg.ticketHandlers) {
    cfg.ticketHandlers = MockData.ticketCategories.map(function (cat) {
      var dept = MockData.findOrg(deptId);
      return { categoryId: cat.id, categoryName: cat.name, handler: dept ? dept.leader.name : '--', isDefault: true };
    });
  }
  var html = '<div class="ant-card"><div class="ant-card-head" style="display:flex;align-items:center;justify-content:space-between;"><span>工单处理配置</span><button class="ant-btn ant-btn-primary" id="ticket-category-add-btn">+ 新增工单类别</button></div><div class="ant-card-body">';
  html += '<div class="ant-alert ant-alert-info" style="margin-bottom:16px;">每类工单默认由部门负责人处理，可为不同问题类别指定处理人。支持新增部门自定义工单类别，自定义类别可删除。</div>';
  html += '<table class="ant-table"><thead><tr><th>问题类别</th><th>类别类型</th><th>当前处理人</th><th>处理人设置</th><th>操作</th></tr></thead><tbody>';
  cfg.ticketHandlers.forEach(function (th, idx) {
    var isSystem = SYSTEM_CAT_IDS.indexOf(th.categoryId) !== -1;
    html += '<tr>';
    html += '<td>' + esc(th.categoryName) + '</td>';
    html += '<td>' + (isSystem ? '<span class="ant-tag">系统内置</span>' : '<span class="ant-tag ant-tag-purple">部门自定义</span>') + '</td>';
    html += '<td>' + esc(th.handler) + '</td>';
    html += '<td>';
    if (th.isDefault) {
      html += '<span class="ant-tag ant-tag-blue">默认</span>';
    } else {
      html += '<span class="ant-tag ant-tag-orange">已自定义</span>';
    }
    html += '</td>';
    html += '<td><a class="ant-btn-link ticket-handler-edit-btn" data-idx="' + idx + '">编辑处理人</a>';
    if (!th.isDefault) {
      html += ' <a class="ant-btn-link ticket-handler-restore-btn" data-idx="' + idx + '" style="margin-left:8px;color:#faad14;">恢复默认</a>';
    }
    if (!isSystem) {
      html += ' <a class="ant-btn-link ticket-handler-delete-btn" data-idx="' + idx + '" style="margin-left:8px;color:#ff4d4f;">删除</a>';
    }
    html += '</td>';
    html += '</tr>';
  });
  html += '</tbody></table></div></div>';
  container.innerHTML = html;

  // 新增工单类别
  var addBtn = document.getElementById('ticket-category-add-btn');
  if (addBtn) {
    addBtn.onclick = function () {
      var deptOrg = MockData.findOrg(deptId);
      var memberIds = deptOrg ? MockData.getOrgAndChildIds(deptId) : [];
      var members = MockData.members.filter(function (m) { return memberIds.indexOf(m.orgId) !== -1; });
      var defaultHandler = deptOrg && deptOrg.leader ? deptOrg.leader.name : '';
      var modalHtml = '<div class="ant-modal-overlay" style="display:flex;">';
      modalHtml += '<div class="ant-modal" style="width:480px;">';
      modalHtml += '<div class="ant-modal-header">新增工单类别 <button class="ant-modal-close" onclick="hideModal()">&times;</button></div>';
      modalHtml += '<div class="ant-modal-body">';
      modalHtml += '<div class="ant-form-item"><div class="ant-form-label"><span class="required">*</span>类别名称</div>';
      modalHtml += '<div class="ant-form-control"><input class="ant-input" id="new-cat-name" placeholder="请输入工单类别名称，如：数据访问类" /></div></div>';
      modalHtml += '<div class="ant-form-item"><div class="ant-form-label"><span class="required">*</span>默认处理人</div>';
      modalHtml += '<div class="ant-form-control"><select class="ant-select" id="new-cat-handler" style="width:100%;">';
      members.forEach(function (m) {
        modalHtml += '<option value="' + esc(m.name) + '"' + (m.name === defaultHandler ? ' selected' : '') + '>' + esc(m.name) + '（' + esc(m.orgName) + '）</option>';
      });
      modalHtml += '</select></div></div>';
      modalHtml += '</div>';
      modalHtml += '<div class="ant-modal-footer"><button class="ant-btn" onclick="hideModal()">取消</button><button class="ant-btn ant-btn-primary" id="new-cat-save-btn">保存</button></div>';
      modalHtml += '</div></div>';
      var mc = document.getElementById('modal-container');
      mc.innerHTML = modalHtml;
      var overlay = mc.querySelector('.ant-modal-overlay');
      if (overlay) overlay.onclick = function (e) { if (e.target === overlay) hideModal(); };
      document.getElementById('new-cat-save-btn').onclick = function () {
        var catName = (document.getElementById('new-cat-name').value || '').trim();
        var handler = document.getElementById('new-cat-handler').value;
        if (!catName) { showMessage('请输入类别名称', 'error'); return; }
        for (var i = 0; i < cfg.ticketHandlers.length; i++) {
          if (cfg.ticketHandlers[i].categoryName === catName) { showMessage('已存在同名类别，请更换名称', 'error'); return; }
        }
        var dept = MockData.findOrg(deptId);
        cfg.ticketHandlers.push({
          categoryId: 'cat-custom-' + Date.now(),
          categoryName: catName,
          handler: handler,
          isDefault: !!(dept && dept.leader && dept.leader.name === handler)
        });
        hideModal();
        showMessage('工单类别「' + catName + '」已添加', 'success');
        renderDeptTicketHandlers(container, cfg, deptId);
      };
    };
  }

  // 恢复默认处理人
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

  // 编辑处理人
  container.querySelectorAll('.ticket-handler-edit-btn').forEach(function (btn) {
    btn.onclick = function () {
      var idx = parseInt(btn.getAttribute('data-idx'));
      var th = cfg.ticketHandlers[idx];
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
        var dept = MockData.findOrg(deptId);
        th.isDefault = dept && dept.leader && dept.leader.name === newHandler;
        hideModal();
        showMessage(th.categoryName + ' 处理人已更新为「' + newHandler + '」', 'success');
        renderDeptTicketHandlers(container, cfg, deptId);
      };
    };
  });

  // 删除自定义类别
  container.querySelectorAll('.ticket-handler-delete-btn').forEach(function (btn) {
    btn.onclick = function () {
      var idx = parseInt(btn.getAttribute('data-idx'));
      var th = cfg.ticketHandlers[idx];
      var mc = document.getElementById('modal-container');
      var confirmHtml = '<div class="ant-modal-overlay" style="display:flex;">';
      confirmHtml += '<div class="ant-modal" style="width:400px;">';
      confirmHtml += '<div class="ant-modal-header">确认删除 <button class="ant-modal-close" onclick="hideModal()">&times;</button></div>';
      confirmHtml += '<div class="ant-modal-body"><p>确认删除工单类别「<b>' + esc(th.categoryName) + '</b>」？删除后该类别将不可用。</p></div>';
      confirmHtml += '<div class="ant-modal-footer"><button class="ant-btn" onclick="hideModal()">取消</button><button class="ant-btn" id="confirm-delete-cat-btn" style="background:#ff4d4f;color:#fff;border-color:#ff4d4f;">确认删除</button></div>';
      confirmHtml += '</div></div>';
      mc.innerHTML = confirmHtml;
      var overlay = mc.querySelector('.ant-modal-overlay');
      if (overlay) overlay.onclick = function (e) { if (e.target === overlay) hideModal(); };
      document.getElementById('confirm-delete-cat-btn').onclick = function () {
        cfg.ticketHandlers.splice(idx, 1);
        hideModal();
        showMessage('工单类别「' + th.categoryName + '」已删除', 'success');
        renderDeptTicketHandlers(container, cfg, deptId);
      };
    };
  });
}

// =============================================
// 部门配置 — 成员角色分配（部门负责人专属）
// =============================================
function renderDeptMemberRoles(container, deptId) {
  var orgIds = MockData.getOrgAndChildIds(deptId);
  var deptMembers = MockData.members.filter(function (m) {
    return orgIds.indexOf(m.orgId) !== -1;
  });

  // 获取成员当前角色列表
  function getMemberRoles(username) {
    var roles = [];
    MockData.roles.forEach(function (r) {
      if (r.users) r.users.forEach(function (ru) {
        if (ru.username === username) roles.push(r);
      });
    });
    return roles;
  }

  // 构建表格
  var html = '<div class="ant-card"><div class="ant-card-head" style="display:flex;align-items:center;justify-content:space-between;">';
  html += '<span>成员角色分配</span>';
  html += '<span style="font-size:13px;font-weight:normal;color:var(--text-secondary);">共 ' + deptMembers.length + ' 名成员</span>';
  html += '</div><div class="ant-card-body">';
  html += '<div class="ant-alert ant-alert-info" style="margin-bottom:16px;">为本部门成员分配功能角色，控制成员在平台上可访问的功能模块和数据范围。角色由超级管理员创建和维护。</div>';
  html += '<table class="ant-table"><thead><tr><th>姓名</th><th>账号</th><th>所属组/职位</th><th>已分配角色</th><th>操作</th></tr></thead><tbody>';

  if (deptMembers.length === 0) {
    html += '<tr><td colspan="5" style="text-align:center;color:var(--text-secondary);padding:32px;">暂无成员数据</td></tr>';
  }

  deptMembers.forEach(function (m) {
    var roles = getMemberRoles(m.username);
    html += '<tr>';
    html += '<td><span style="font-weight:500;">' + esc(m.name) + '</span></td>';
    html += '<td style="color:var(--text-secondary);font-size:13px;">' + esc(m.username) + '@sohu-inc.com</td>';
    html += '<td><span class="ant-tag ant-tag-' + (m.role === '部门负责人' ? 'red' : m.role === '组长' ? 'orange' : 'default') + '">' + esc(m.role) + '</span>';
    html += ' <span style="font-size:12px;color:var(--text-secondary);">' + esc(m.orgName) + '</span></td>';
    html += '<td>';
    if (roles.length === 0) {
      html += '<span style="color:var(--text-secondary);font-size:13px;">未分配角色</span>';
    } else {
      roles.slice(0, 3).forEach(function (r) {
        html += '<span class="ant-tag ant-tag-blue" style="margin-bottom:2px;">' + esc(r.name) + '</span> ';
      });
      if (roles.length > 3) {
        html += '<span class="ant-tag ant-tag-default" title="' + esc(roles.slice(3).map(function(r){return r.name;}).join('、')) + '">+' + (roles.length - 3) + '</span>';
      }
    }
    html += '</td>';
    html += '<td><a class="ant-btn-link dept-member-assign-role-btn" data-username="' + esc(m.username) + '">分配角色</a></td>';
    html += '</tr>';
  });

  html += '</tbody></table></div></div>';
  container.innerHTML = html;

  // 绑定分配角色按钮
  container.querySelectorAll('.dept-member-assign-role-btn').forEach(function (btn) {
    btn.onclick = function () {
      var username = btn.getAttribute('data-username');
      var member = null;
      for (var i = 0; i < MockData.members.length; i++) {
        if (MockData.members[i].username === username) { member = MockData.members[i]; break; }
      }
      if (!member) return;

      loadAndShowModal('user/assign-role', function () {
        var nameEl = document.getElementById('assign-role-user-name');
        if (nameEl) nameEl.textContent = member.name + ' (' + member.username + '@sohu-inc.com)';

        // 获取该用户当前已有角色
        var currentRoles = {};
        MockData.roles.forEach(function (r) {
          if (r.users) r.users.forEach(function (ru) {
            if (ru.username === username) currentRoles[r.name] = true;
          });
        });

        function renderRoleList(keyword) {
          var listEl = document.getElementById('assign-role-list');
          if (!listEl) return;
          // 部门负责人只能分配非超管专属角色
          var roles = MockData.roles.filter(function (r) {
            if (r.superOnly) return false;
            if (keyword) return r.name.indexOf(keyword) !== -1;
            return true;
          });
          if (roles.length === 0) {
            listEl.innerHTML = '<div style="text-align:center;color:var(--text-secondary);padding:24px 0;">暂无匹配角色</div>';
            return;
          }
          var html = '';
          roles.forEach(function (r) {
            var checked = currentRoles[r.name] ? ' checked' : '';
            var typeClass = r.typeColor === 'red' ? 'ant-tag-red' : r.typeColor === 'orange' ? 'ant-tag-orange' : 'ant-tag-blue';
            html += '<label class="assign-role-item' + (currentRoles[r.name] ? ' is-checked' : '') + '">';
            html += '<input type="checkbox" name="assign-role-cb" value="' + esc(r.name) + '"' + checked + ' style="margin-right:8px;accent-color:var(--primary-color);">';
            html += '<span class="assign-role-item-name">' + esc(r.name) + '</span>';
            html += '<span class="ant-tag ' + typeClass + '" style="margin-left:6px;flex-shrink:0;">' + esc(r.type) + '</span>';
            html += '<span class="assign-role-item-scope">' + esc(r.scope) + '</span>';
            html += '</label>';
          });
          listEl.innerHTML = html;
          listEl.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
            cb.onchange = function () {
              if (cb.checked) currentRoles[cb.value] = true;
              else delete currentRoles[cb.value];
              var countEl = document.getElementById('assign-role-count');
              if (countEl) countEl.textContent = Object.keys(currentRoles).length;
              cb.closest('label').classList.toggle('is-checked', cb.checked);
            };
          });
        }

        var countEl = document.getElementById('assign-role-count');
        if (countEl) countEl.textContent = Object.keys(currentRoles).length;

        var searchEl = document.getElementById('assign-role-search');
        if (searchEl) {
          searchEl.value = '';
          searchEl.oninput = function () { renderRoleList(searchEl.value.trim()); };
        }
        renderRoleList('');

        var confirmBtn = document.getElementById('assign-role-confirm-btn');
        if (confirmBtn) {
          confirmBtn.onclick = function () {
            // 从所有非超管角色中移除该用户（超管角色由超管自行管理）
            MockData.roles.forEach(function (r) {
              if (!r.superOnly && r.users) {
                r.users = r.users.filter(function (ru) { return ru.username !== username; });
              }
            });
            // 添加到选中的角色
            MockData.roles.forEach(function (r) {
              if (!r.superOnly && currentRoles[r.name]) {
                if (!r.users) r.users = [];
                r.users.push({ name: member.name, username: username, dept: member.orgName });
                r.userCount = r.users.length;
              }
            });
            hideModal();
            showMessage('已为「' + member.name + '」更新角色分配', 'success');
            renderDeptMemberRoles(container, deptId);
          };
        }
      });
    };
  });
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
