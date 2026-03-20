'use strict';
// CMP 原型 - 资源目录页

// =============================================
// 资源目录页
// =============================================
function initResCatalogPage() {
  renderResCatalog();
  var addCatBtn = document.getElementById('catalog-add-category-btn');
  if (addCatBtn) {
    addCatBtn.onclick = function () {
      loadAndShowModal('res-catalog/add-category', function () {
        var nameInput = document.getElementById('catalog-category-name');
        if (nameInput) nameInput.value = '';
      });
    };
  }
}

function renderResCatalog() {
  var container = document.getElementById('catalog-container');
  if (!container) return;
  var catalog = MockData.resCatalog;
  var html = '';
  var allOps = ['申请', '变配', '扩容', '缩容', '重启', '销毁', '续费', '同步'];
  catalog.forEach(function (cat, catIdx) {
    var totalTypes = cat.types.length;
    var applyCount = cat.types.filter(function (t) { return t.allowApply; }).length;
    var isExpanded = !state.catalogCollapsed || !state.catalogCollapsed[catIdx];
    html += '<div class="catalog-category-section">';
    html += '<div class="catalog-category-header" data-cat-toggle="' + catIdx + '">';
    html += '<div class="catalog-category-left">';
    html += '<span class="catalog-category-arrow' + (isExpanded ? ' expanded' : '') + '">&#8250;</span>';
    html += '<span style="font-weight:500;font-size:14px;color:' + cat.color + ';">' + esc(cat.name) + '</span>';
    html += '<span style="font-weight:normal;font-size:12px;color:var(--text-secondary);margin-left:8px;">' + totalTypes + ' 种资源';
    if (applyCount < totalTypes) html += '，' + applyCount + ' 种可申请';
    html += '</span>';
    html += '</div>';
    html += '<div class="catalog-category-actions" onclick="event.stopPropagation();">';
    html += '<a class="ant-btn-link catalog-add-type-btn" data-cat="' + catIdx + '" style="margin-right:12px;">+ 新增资源类型</a>';
    html += '<a class="ant-btn-link catalog-del-cat-btn" data-cat="' + catIdx + '" style="color:#ff4d4f;">删除大类</a>';
    html += '</div></div>';
    html += '<div class="catalog-category-body' + (isExpanded ? '' : ' collapsed') + '" data-cat-body="' + catIdx + '">';
    html += '<table class="ant-table" style="table-layout:fixed;"><thead><tr><th style="width:18%;">资源类型</th><th style="width:8%;">云厂商</th><th style="width:16%;">云上查询接口</th><th style="width:22%;">需要审批的操作</th><th style="width:18%;">不需要审批的操作</th><th style="width:18%;">操作</th></tr></thead><tbody>';
    if (cat.types.length === 0) {
      html += '<tr><td colspan="6" style="text-align:center;color:var(--text-secondary);padding:20px;">该大类下暂无资源类型</td></tr>';
    }
    cat.types.forEach(function (t, typeIdx) {
      var aOps = t.approvalOps || [];
      var nOps = (t.operations || []).filter(function (op) { return aOps.indexOf(op) === -1; });
      // 父资源行
      html += '<tr>';
      html += '<td><strong>' + esc(t.name) + '</strong></td>';
      html += '<td><span class="ant-tag ant-tag-blue">' + esc(t.vendor) + '</span></td>';
      html += '<td><code style="font-size:12px;color:#1890ff;">' + esc(t.queryApi || '') + '</code></td>';
      html += '<td>' + (aOps.length ? aOps.map(function (op) { return '<span class="ant-tag ant-tag-orange">' + esc(op) + '</span>'; }).join(' ') : '<span style="color:var(--text-secondary);">无</span>') + '</td>';
      html += '<td>' + (nOps.length ? nOps.map(function (op) { return '<span class="ant-tag ant-tag-default">' + esc(op) + '</span>'; }).join(' ') : '<span style="color:var(--text-secondary);">无</span>') + '</td>';
      html += '<td><a class="ant-btn-link catalog-edit-type-btn" data-cat="' + catIdx + '" data-type="' + typeIdx + '">编辑</a> ';
      html += '<a class="ant-btn-link catalog-add-child-btn" data-cat="' + catIdx + '" data-type="' + typeIdx + '">添加子资源</a> ';
      html += '<a class="ant-btn-link catalog-del-type-btn" data-cat="' + catIdx + '" data-type="' + typeIdx + '" style="color:#ff4d4f;">删除</a></td>';
      html += '</tr>';
      // 子资源行
      var children = t.children || [];
      children.forEach(function (child, childIdx) {
        var connector = childIdx === children.length - 1 ? '└─' : '├─';
        var cAOps = child.approvalOps || [];
        var cNOps = (child.operations || []).filter(function (op) { return cAOps.indexOf(op) === -1; });
        html += '<tr class="catalog-child-row">';
        html += '<td style="padding-left:32px;color:var(--text-secondary);">' + connector + ' ' + esc(child.name) + '</td>';
        html += '<td></td>';
        html += '<td><code style="font-size:11px;color:#1890ff;">' + esc(child.queryApi || '') + '</code></td>';
        html += '<td>' + (cAOps.length ? cAOps.map(function (op) { return '<span class="ant-tag ant-tag-orange" style="font-size:11px;">' + esc(op) + '</span>'; }).join(' ') : '<span style="color:var(--text-secondary);">无</span>') + '</td>';
        html += '<td>' + (cNOps.length ? cNOps.map(function (op) { return '<span class="ant-tag ant-tag-default" style="font-size:11px;">' + esc(op) + '</span>'; }).join(' ') : '<span style="color:var(--text-secondary);">无</span>') + '</td>';
        html += '<td><a class="ant-btn-link catalog-edit-child-btn" data-cat="' + catIdx + '" data-type="' + typeIdx + '" data-child="' + childIdx + '">编辑</a> ';
        html += '<a class="ant-btn-link catalog-del-child-btn" data-cat="' + catIdx + '" data-type="' + typeIdx + '" data-child="' + childIdx + '" style="color:#ff4d4f;">删除</a></td>';
        html += '</tr>';
      });
    });
    html += '</tbody></table>';
    html += '</div></div>'; // close catalog-category-body and catalog-category-section
  });
  container.innerHTML = html;

  // 绑定大类折叠/展开
  container.querySelectorAll('.catalog-category-header').forEach(function (header) {
    header.onclick = function () {
      var catIdx = parseInt(header.getAttribute('data-cat-toggle'));
      if (!state.catalogCollapsed) state.catalogCollapsed = {};
      var body = container.querySelector('[data-cat-body="' + catIdx + '"]');
      var arrow = header.querySelector('.catalog-category-arrow');
      if (body.classList.contains('collapsed')) {
        body.classList.remove('collapsed');
        arrow.classList.add('expanded');
        state.catalogCollapsed[catIdx] = false;
      } else {
        body.classList.add('collapsed');
        arrow.classList.remove('expanded');
        state.catalogCollapsed[catIdx] = true;
      }
    };
  });

  // 绑定新增资源类型按钮
  container.querySelectorAll('.catalog-add-type-btn').forEach(function (btn) {
    btn.onclick = function () {
      var ci = parseInt(btn.getAttribute('data-cat'));
      var cat = MockData.resCatalog[ci];
      window._catalogEditMode = 'add';
      window._catalogEditCat = ci;
      window._catalogEditType = -1;
      loadAndShowModal('res-catalog/edit-type', function () {
        document.getElementById('catalog-type-title').textContent = '新增资源类型';
        document.getElementById('catalog-type-category').value = cat.name;
        document.getElementById('catalog-type-name').value = '';
        document.getElementById('catalog-type-vendor').value = '阿里云';
        document.getElementById('catalog-type-query-api').value = '';
        setCatalogOpsCheckboxes([]);
        refreshApprovalOpsFromSelected('catalog-type-approval-ops-group', 'catalog-type-ops-group', []);
        bindOpsToApprovalRefresh('catalog-type-ops-group', 'catalog-type-approval-ops-group');
      });
    };
  });

  // 绑定编辑按钮
  container.querySelectorAll('.catalog-edit-type-btn').forEach(function (btn) {
    btn.onclick = function () {
      var ci = parseInt(btn.getAttribute('data-cat'));
      var ti = parseInt(btn.getAttribute('data-type'));
      var cat = MockData.resCatalog[ci];
      var t = cat.types[ti];
      window._catalogEditMode = 'edit';
      window._catalogEditCat = ci;
      window._catalogEditType = ti;
      loadAndShowModal('res-catalog/edit-type', function () {
        document.getElementById('catalog-type-title').textContent = '编辑资源类型';
        document.getElementById('catalog-type-category').value = cat.name;
        document.getElementById('catalog-type-name').value = t.name;
        document.getElementById('catalog-type-vendor').value = t.vendor;
        document.getElementById('catalog-type-query-api').value = t.queryApi || '';
        setCatalogOpsCheckboxes(t.operations || []);
        refreshApprovalOpsFromSelected('catalog-type-approval-ops-group', 'catalog-type-ops-group', t.approvalOps || []);
        bindOpsToApprovalRefresh('catalog-type-ops-group', 'catalog-type-approval-ops-group');
      });
    };
  });

  // 绑定添加子资源按钮（表格行中的）
  container.querySelectorAll('.catalog-add-child-btn').forEach(function (btn) {
    btn.onclick = function () {
      var ci = parseInt(btn.getAttribute('data-cat'));
      var ti = parseInt(btn.getAttribute('data-type'));
      var t = MockData.resCatalog[ci].types[ti];
      window._catalogEditMode = 'add-child';
      window._catalogEditCat = ci;
      window._catalogEditType = ti;
      window._catalogEditChild = -1;
      loadAndShowModal('res-catalog/edit-child', function () {
        document.getElementById('catalog-child-title').textContent = '添加子资源 - ' + t.name;
        document.getElementById('catalog-child-parent').value = t.name;
        document.getElementById('catalog-child-name').value = '';
        document.getElementById('catalog-child-query-api').value = '';
        // reset child ops
        var childOpsGroup = document.getElementById('catalog-child-ops-group');
        if (childOpsGroup) childOpsGroup.querySelectorAll('input[type="checkbox"]').forEach(function (cb) { cb.checked = false; });
        refreshApprovalOpsFromSelected('catalog-child-approval-ops-group', 'catalog-child-ops-group', []);
        bindOpsToApprovalRefresh('catalog-child-ops-group', 'catalog-child-approval-ops-group');
      });
    };
  });

  // 绑定编辑子资源
  container.querySelectorAll('.catalog-edit-child-btn').forEach(function (btn) {
    btn.onclick = function () {
      var ci = parseInt(btn.getAttribute('data-cat'));
      var ti = parseInt(btn.getAttribute('data-type'));
      var chi = parseInt(btn.getAttribute('data-child'));
      var cat = MockData.resCatalog[ci];
      var t = cat.types[ti];
      var child = t.children[chi];
      window._catalogEditMode = 'edit-child';
      window._catalogEditCat = ci;
      window._catalogEditType = ti;
      window._catalogEditChild = chi;
      loadAndShowModal('res-catalog/edit-child', function () {
        document.getElementById('catalog-child-title').textContent = '编辑子资源 - ' + child.name;
        document.getElementById('catalog-child-parent').value = t.name;
        document.getElementById('catalog-child-name').value = child.name;
        document.getElementById('catalog-child-query-api').value = child.queryApi || '';
        // set child ops
        var childOpsGroup = document.getElementById('catalog-child-ops-group');
        if (childOpsGroup) {
          childOpsGroup.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
            cb.checked = (child.operations || []).indexOf(cb.value) !== -1;
          });
        }
        refreshApprovalOpsFromSelected('catalog-child-approval-ops-group', 'catalog-child-ops-group', child.approvalOps || []);
        bindOpsToApprovalRefresh('catalog-child-ops-group', 'catalog-child-approval-ops-group');
      });
    };
  });

  // 绑定删除子资源
  container.querySelectorAll('.catalog-del-child-btn').forEach(function (btn) {
    btn.onclick = function () {
      var ci = parseInt(btn.getAttribute('data-cat'));
      var ti = parseInt(btn.getAttribute('data-type'));
      var chi = parseInt(btn.getAttribute('data-child'));
      var childName = MockData.resCatalog[ci].types[ti].children[chi].name;
      MockData.resCatalog[ci].types[ti].children.splice(chi, 1);
      showMessage('子资源「' + childName + '」已删除', 'success');
      renderResCatalog();
    };
  });

  // 绑定删除资源类型
  container.querySelectorAll('.catalog-del-type-btn').forEach(function (btn) {
    btn.onclick = function () {
      var ci = parseInt(btn.getAttribute('data-cat'));
      var ti = parseInt(btn.getAttribute('data-type'));
      var typeName = MockData.resCatalog[ci].types[ti].name;
      window._catalogDelCat = ci;
      window._catalogDelType = ti;
      window._catalogDelName = typeName;
      loadAndShowModal('org/confirm-delete', function () {
        document.getElementById('confirm-delete-msg').textContent = '确定要删除资源类型「' + typeName + '」吗？';
        document.getElementById('confirm-delete-extra').textContent = '删除后该类型将从资源目录中移除。';
        var okBtn = document.getElementById('confirm-delete-ok');
        if (okBtn) {
          okBtn.onclick = function () {
            MockData.resCatalog[window._catalogDelCat].types.splice(window._catalogDelType, 1);
            hideModal();
            showMessage('资源类型「' + window._catalogDelName + '」已删除', 'success');
            renderResCatalog();
          };
        }
      });
    };
  });

  // 绑定删除大类
  container.querySelectorAll('.catalog-del-cat-btn').forEach(function (btn) {
    btn.onclick = function () {
      var ci = parseInt(btn.getAttribute('data-cat'));
      var catName = MockData.resCatalog[ci].name;
      var typeCount = MockData.resCatalog[ci].types.length;
      window._catalogDelCatIdx = ci;
      window._catalogDelCatName = catName;
      loadAndShowModal('org/confirm-delete', function () {
        document.getElementById('confirm-delete-msg').textContent = '确定要删除大类「' + catName + '」吗？';
        document.getElementById('confirm-delete-extra').textContent = typeCount > 0
          ? '该大类下有 ' + typeCount + ' 种资源类型，将一并删除。此操作不可撤销。'
          : '此操作不可撤销。';
        var okBtn = document.getElementById('confirm-delete-ok');
        if (okBtn) {
          okBtn.onclick = function () {
            MockData.resCatalog.splice(window._catalogDelCatIdx, 1);
            hideModal();
            showMessage('大类「' + window._catalogDelCatName + '」已删除', 'success');
            renderResCatalog();
          };
        }
      });
    };
  });
}

// 设置操作复选框
function setCatalogOpsCheckboxes(ops) {
  var group = document.getElementById('catalog-type-ops-group');
  if (!group) return;
  group.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
    cb.checked = ops.indexOf(cb.value) !== -1;
  });
}

// 获取操作复选框的值
function getCatalogOpsCheckboxes() {
  var group = document.getElementById('catalog-type-ops-group');
  if (!group) return [];
  var ops = [];
  group.querySelectorAll('input[type="checkbox"]:checked').forEach(function (cb) {
    ops.push(cb.value);
  });
  return ops;
}

// 设置审批操作复选框
function setCatalogApprovalOpsCheckboxes(ops) {
  var group = document.getElementById('catalog-type-approval-ops-group');
  if (!group) return;
  group.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
    cb.checked = ops.indexOf(cb.value) !== -1;
  });
}

// 动态刷新审批操作区域（基于已选操作，排除同步）
function refreshApprovalOpsFromSelected(containerId, opsGroupId, currentApprovalOps) {
  var opsGroup = document.getElementById(opsGroupId);
  var approvalGroup = document.getElementById(containerId);
  if (!opsGroup || !approvalGroup) return;
  var selectedOps = [];
  opsGroup.querySelectorAll('input[type="checkbox"]:checked').forEach(function (cb) {
    if (cb.value !== '同步') selectedOps.push(cb.value);
  });
  var html = '';
  if (selectedOps.length === 0) {
    html = '<span style="color:var(--text-secondary);font-size:13px;">请先在上方勾选支持操作</span>';
  } else {
    selectedOps.forEach(function (op) {
      var checked = currentApprovalOps.indexOf(op) !== -1 ? ' checked' : '';
      html += '<label class="ant-checkbox-wrapper"><input type="checkbox" value="' + op + '"' + checked + ' /> ' + op + '</label>';
    });
  }
  approvalGroup.innerHTML = html;
}

// 绑定操作checkbox联动审批区域
function bindOpsToApprovalRefresh(opsGroupId, approvalContainerId) {
  var opsGroup = document.getElementById(opsGroupId);
  if (!opsGroup) return;
  opsGroup.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
    cb.addEventListener('change', function () {
      var currentApproval = [];
      var approvalGroup = document.getElementById(approvalContainerId);
      if (approvalGroup) {
        approvalGroup.querySelectorAll('input[type="checkbox"]:checked').forEach(function (acb) {
          currentApproval.push(acb.value);
        });
      }
      refreshApprovalOpsFromSelected(approvalContainerId, opsGroupId, currentApproval);
    });
  });
}

// 获取审批操作复选框的值
function getCatalogApprovalOpsCheckboxes() {
  var group = document.getElementById('catalog-type-approval-ops-group');
  if (!group) return [];
  var ops = [];
  group.querySelectorAll('input[type="checkbox"]:checked').forEach(function (cb) {
    ops.push(cb.value);
  });
  return ops;
}

// 渲染子资源编辑区
function renderCatalogChildrenEditor(children) {
  var container = document.getElementById('catalog-type-children-container');
  if (!container) return;
  var allOps = ['申请', '变配', '扩容', '缩容', '重启', '销毁', '续费', '同步'];
  var html = '';
  children.forEach(function (child, idx) {
    html += '<div class="catalog-child-edit-row" data-child-idx="' + idx + '">';
    html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">';
    html += '<input class="ant-input catalog-child-name" style="max-width:160px;" placeholder="子资源名称" value="' + esc(child.name) + '" />';
    html += '<input class="ant-input catalog-child-query-api" style="max-width:200px;" placeholder="查询接口" value="' + esc(child.queryApi || '') + '" />';
    html += '<button type="button" class="ant-btn ant-btn-sm ant-btn-danger catalog-child-remove" title="删除">&times;</button>';
    html += '</div>';
    html += '<div class="ant-checkbox-group catalog-child-ops" style="margin-bottom:12px;">';
    allOps.forEach(function (op) {
      var checked = (child.operations || []).indexOf(op) !== -1 ? ' checked' : '';
      html += '<label class="ant-checkbox-wrapper"><input type="checkbox" value="' + op + '"' + checked + ' /> ' + op + '</label>';
    });
    html += '</div></div>';
  });
  container.innerHTML = html;
  // 绑定删除按钮
  container.querySelectorAll('.catalog-child-remove').forEach(function (btn) {
    btn.onclick = function () {
      btn.closest('.catalog-child-edit-row').remove();
    };
  });
}

// 读取子资源编辑数据
function getCatalogChildrenData() {
  var container = document.getElementById('catalog-type-children-container');
  if (!container) return [];
  var children = [];
  container.querySelectorAll('.catalog-child-edit-row').forEach(function (row) {
    var name = row.querySelector('.catalog-child-name').value.trim();
    if (!name) return;
    var ops = [];
    row.querySelectorAll('.catalog-child-ops input:checked').forEach(function (cb) { ops.push(cb.value); });
    var queryApiInput = row.querySelector('.catalog-child-query-api');
    var queryApi = queryApiInput ? queryApiInput.value.trim() : '';
    children.push({ name: name, operations: ops, queryApi: queryApi, allowApply: true, allowDisplay: true });
  });
  return children;
}

// 绑定"添加子资源"按钮
function bindCatalogAddChildBtn() {
  var btn = document.getElementById('catalog-type-add-child');
  if (!btn) return;
  btn.onclick = function () {
    var container = document.getElementById('catalog-type-children-container');
    var currentChildren = getCatalogChildrenData();
    currentChildren.push({ name: '', operations: [], allowApply: true, allowDisplay: true });
    renderCatalogChildrenEditor(currentChildren);
  };
}
