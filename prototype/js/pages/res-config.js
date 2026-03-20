'use strict';
// CMP 原型 - 资源配置页（平台级）

// =============================================
// 资源配置页（平台级）
// =============================================
function initResConfigPage() {
  renderResConfig();
}

function renderResConfig() {
  var container = document.getElementById('res-config-content');
  if (!container) return;
  if (state.resConfig.editingTemplate) {
    renderResConfigTemplateEdit(container, state.resConfig.editingTemplate);
  } else {
    renderResConfigTemplates(container);
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
  var html = '<div class="ant-alert ant-alert-info" style="margin-bottom:16px;">从资源目录按树状结构同步每类资源及支持的操作。点击「编辑」以 JSON 方式配置操作模板，定义云上接口和表单字段。各部门可在此基础上进行简化定制。</div>';

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

// ---- 平台级操作模板编辑页（JSON 编辑器） ----
function renderResConfigTemplateEdit(container, tpl) {
  var jsonStr = JSON.stringify(tpl, null, 2);
  var html = '<div style="margin-bottom:16px;">';
  html += '<a class="ant-btn-link rescfg-back-btn" style="font-size:14px;">&larr; 返回模板列表</a>';
  html += '</div>';
  html += '<div class="ant-card"><div class="ant-card-head"><span>编辑操作模板 - ' + esc(tpl.resType) + ' / ' + esc(tpl.opType) + '</span></div>';
  html += '<div class="ant-card-body">';
  html += '<div class="ant-alert ant-alert-info" style="margin-bottom:16px;">';
  html += '直接编辑 JSON 配置，保存后生效。<code>fieldGroups</code> 定义表单字段分组，<code>apiEndpoint</code> 为调用的云上接口名。';
  html += '</div>';
  html += '<div class="ant-form-item"><div class="ant-form-label">JSON 配置</div>';
  html += '<div class="ant-form-control">';
  html += '<textarea id="rescfg-json-editor" style="width:100%;height:480px;font-family:monospace;font-size:13px;line-height:1.6;border:1px solid #d9d9d9;border-radius:4px;padding:12px;resize:vertical;box-sizing:border-box;" spellcheck="false">' + esc(jsonStr) + '</textarea>';
  html += '</div></div>';
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
      var editor = document.getElementById('rescfg-json-editor');
      if (!editor) return;
      try {
        var parsed = JSON.parse(editor.value.trim());
        // 将解析后的属性回写至模板对象（保持对象引用）
        Object.keys(tpl).forEach(function (k) { delete tpl[k]; });
        Object.keys(parsed).forEach(function (k) { tpl[k] = parsed[k]; });
        showMessage('模板「' + (tpl.resType || '') + ' / ' + (tpl.opType || '') + '」已保存', 'success');
      } catch (e) {
        showMessage('JSON 格式错误：' + e.message, 'error');
      }
    };
  }

  // 预览
  var previewBtn = container.querySelector('.rescfg-preview-from-edit');
  if (previewBtn) {
    previewBtn.onclick = function () {
      var editor = document.getElementById('rescfg-json-editor');
      if (!editor) return;
      try {
        var parsed = JSON.parse(editor.value.trim());
        showTemplatePreview(parsed);
      } catch (e) {
        showMessage('JSON 格式错误，无法预览：' + e.message, 'error');
      }
    };
  }
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
        html += '<textarea class="ant-textarea" rows="4"' + (disabled ? ' disabled' : '') + ' placeholder="请输入' + esc(field.name) + '" style="min-height:100px;">' + esc(field.defaultValue || '') + '</textarea>';
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
        html += '<input class="ant-input"' + (disabled ? ' disabled' : '') + ' value="' + esc(field.defaultValue || '') + '" placeholder="请输入' + esc(field.name) + '" style="max-width:480px;height:36px;" />';
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
  container.querySelectorAll('select[data-cascade-from]').forEach(function (childSel) {
    var parentParam = childSel.getAttribute('data-cascade-from');
    var cascadeDataRaw = childSel.getAttribute('data-cascade-data') || '';
    var cascadeMap = {};
    cascadeDataRaw.split('\n').forEach(function (line) {
      line = line.trim();
      if (!line) return;
      var colonIdx = line.indexOf(':');
      if (colonIdx < 0) return;
      var parentValsStr = line.substring(0, colonIdx).trim();
      var childOptsStr = line.substring(colonIdx + 1).trim();
      parentValsStr.split('|').forEach(function (pv) {
        pv = pv.trim();
        if (pv) cascadeMap[pv] = childOptsStr;
      });
    });
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

// ---- 审批流程标签与预览（供部门配置页使用） ----
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

