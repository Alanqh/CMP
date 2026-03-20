'use strict';
// CMP 原型 - 资源配置页（平台级）

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
      // 必填列
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
      // 补充配置列
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
      // 校验
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

  // 字段类型切换时刷新页面
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
  var tplNameInput = container.querySelector('.tpl-template-name');
  if (tplNameInput) tpl.templateName = tplNameInput.value.trim();
  var apiInput = container.querySelector('.tpl-api-endpoint');
  if (apiInput) tpl.apiEndpoint = apiInput.value.trim();
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

  html += '</div>';
  html += '<div class="ant-modal-footer">';
  html += '<button class="ant-btn" onclick="hideModal()">取消</button>';
  html += '<button class="ant-btn ant-btn-primary" id="fset-save-btn">保存</button>';
  html += '</div>';
  html += '</div></div>';

  var mc = document.getElementById('modal-container');
  mc.innerHTML = html;
  var overlay = mc.querySelector('.ant-modal-overlay');
  if (overlay) overlay.onclick = function (e) { if (e.target === overlay) hideModal(); };

  // 动态表单：参考选项列表（仅 select 类型）
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
  container.querySelectorAll('select[data-cascade-from]').forEach(function (childSel) {
    var parentParam = childSel.getAttribute('data-cascade-from');
    var cascadeDataRaw = childSel.getAttribute('data-cascade-data') || '';
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

// ---- 平台级审批流程配置 ----
function renderResConfigFlows(container) {
  var categoryOrder = getCatalogCategoryOrder();
  var flowItems = [];
  MockData.resCatalog.forEach(function (cat) {
    cat.types.forEach(function (t) {
      if (!t.allowApply) return;
      var ops = t.approvalOps || [];
      ops.forEach(function (op) {
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
    items.forEach(function (item) {
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
    html += '</div></div>';
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

  document.getElementById('flow-edit-save').onclick = function () {
    var tmpl = templateSel.value;
    var admin1 = document.getElementById('flow-edit-admin1').value.trim();
    var admin2 = document.getElementById('flow-edit-admin2').value.trim();
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
