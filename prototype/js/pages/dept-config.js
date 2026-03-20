'use strict';
// CMP 原型 - 部门配置页

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
