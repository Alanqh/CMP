'use strict';
// CMP 原型 - 申请资源动态表单 / 申请记录 / 审核记录

// ===== 申请资源页（独立页面版） =====
function initApplyResourcePage() {
  var formContainer = document.getElementById('page-apply-dynamic-form');
  var pricingContainer = document.getElementById('page-apply-pricing');
  if (!formContainer) return;

  // 返回 / 取消
  var backBtn = document.getElementById('btn-back-to-resource');
  if (backBtn) backBtn.onclick = function () { loadPage('resource'); };
  var cancelBtn = document.getElementById('btn-cancel-apply-res');
  if (cancelBtn) cancelBtn.onclick = function () { loadPage('resource'); };

  // 填充资源组下拉
  var resGroupSel = document.getElementById('page-apply-res-group');
  if (resGroupSel) {
    MockData.projects.forEach(function (p) {
      var opt = document.createElement('option');
      opt.value = p.name;
      opt.textContent = p.name + '（' + p.dept + '）';
      resGroupSel.appendChild(opt);
    });
  }
  
  // 填充云厂商（平铺显示）
  var vendorGrid = document.getElementById('page-apply-cloud-vendor-grid');
  var categoryGrid = document.getElementById('page-apply-res-category-grid');
  var typeGrid = document.getElementById('page-apply-res-type-grid');
  var selectedVendor = null;
  var selectedCategory = null;
  var selectedType = null;
  
  // 云厂商列表
  var cloudVendors = [
    { name: '阿里云', value: 'aliyun' },
    { name: '腾讯云', value: 'tencent' },
    { name: '华为云', value: 'huawei' },
    { name: 'AWS', value: 'aws' },
    { name: 'Azure', value: 'azure' }
  ];
  
  if (vendorGrid) {
    cloudVendors.forEach(function (vendor) {
      var card = document.createElement('div');
      card.style.cssText = 'border:1px solid #d9d9d9;padding:12px 16px;cursor:pointer;transition:border-color .15s,background .15s;user-select:none;';
      card.setAttribute('data-vendor', vendor.value);
      card.innerHTML = '<div style="font-weight:500;font-size:14px;line-height:1.5;">' + vendor.name + '</div>';
      
      card.onmouseover = function () { if (selectedVendor !== vendor.value) card.style.borderColor = '#40a9ff'; };
      card.onmouseout = function () { if (selectedVendor !== vendor.value) card.style.borderColor = '#d9d9d9'; };
      card.onclick = function () {
        vendorGrid.querySelectorAll('[data-vendor]').forEach(function (c) {
          c.style.borderColor = '#d9d9d9';
          c.style.background = '';
        });
        card.style.borderColor = '#1890ff';
        card.style.background = '#e6f7ff';
        selectedVendor = vendor.value;
        renderResourceCategories();
      };
      
      vendorGrid.appendChild(card);
    });
  }
  
  // 渲染资源大类函数
  function renderResourceCategories() {
    if (!categoryGrid) return;
    
    categoryGrid.innerHTML = '';
    selectedCategory = null;
    typeGrid.innerHTML = '';
    selectedType = null;
    
    if (!selectedVendor) {
      categoryGrid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text-secondary);padding:16px;">请先选择云厂商</div>';
      return;
    }
    
    var categories = [];
    MockData.platformTemplates.filter(function (t) { return t.opType === '申请'; }).forEach(function (tpl) {
      if (categories.indexOf(tpl.category) === -1) {
        categories.push(tpl.category);
      }
    });
    
    // 按大类顺序排序
    var categoryOrder = ['计算类', '数据库类', '网络与负载均衡类', '中间件类', '大数据与搜索分析类', '存储类'];
    var sortedCategories = [];
    
    categoryOrder.forEach(function (cat) {
      if (categories.indexOf(cat) !== -1) {
        sortedCategories.push(cat);
        categories.splice(categories.indexOf(cat), 1);
      }
    });
    
    sortedCategories = sortedCategories.concat(categories);
    
    // 渲染资源大类卡片
    sortedCategories.forEach(function (category) {
      var card = document.createElement('div');
      card.style.cssText = 'border:1px solid #d9d9d9;padding:12px 16px;cursor:pointer;transition:border-color .15s,background .15s;user-select:none;';
      card.setAttribute('data-category', category);
      card.innerHTML = '<div style="font-weight:500;font-size:14px;line-height:1.5;">' + category + '</div>';
      
      card.onmouseover = function () { if (selectedCategory !== category) card.style.borderColor = '#40a9ff'; };
      card.onmouseout = function () { if (selectedCategory !== category) card.style.borderColor = '#d9d9d9'; };
      card.onclick = function () {
        categoryGrid.querySelectorAll('[data-category]').forEach(function (c) {
          c.style.borderColor = '#d9d9d9';
          c.style.background = '';
        });
        card.style.borderColor = '#1890ff';
        card.style.background = '#e6f7ff';
        selectedCategory = category;
        renderResourceTypes(category);
      };
      
      categoryGrid.appendChild(card);
    });
  }
  
  // 渲染资源类型函数
  function renderResourceTypes(category) {
    if (!typeGrid) return;
    
    typeGrid.innerHTML = '';
    selectedType = null;
    
    if (!selectedVendor || !category) {
      typeGrid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text-secondary);padding:16px;">请先选择资源大类</div>';
      formContainer.innerHTML = '';
      document.getElementById('page-apply-dynamic-card').style.display = 'none';
      if (pricingContainer) pricingContainer.style.display = 'none';
      return;
    }
    
    var templates = MockData.platformTemplates.filter(function (t) { 
      return t.opType === '申请' && t.category === category; 
    });
    
    if (templates.length === 0) {
      typeGrid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text-secondary);padding:16px;">暂无资源类型</div>';
      formContainer.innerHTML = '';
      document.getElementById('page-apply-dynamic-card').style.display = 'none';
      if (pricingContainer) pricingContainer.style.display = 'none';
      return;
    }
    
    templates.forEach(function (tpl) {
      var card = document.createElement('div');
      card.style.cssText = 'border:1px solid #d9d9d9;padding:12px 16px;cursor:pointer;transition:border-color .15s,background .15s;user-select:none;';
      card.setAttribute('data-type-id', tpl.id);
      card.innerHTML = '<div style="font-weight:500;font-size:14px;line-height:1.5;">' + tpl.resType + '</div>';
      
      card.onmouseover = function () { if (selectedType !== tpl.id) card.style.borderColor = '#40a9ff'; };
      card.onmouseout = function () { if (selectedType !== tpl.id) card.style.borderColor = '#d9d9d9'; };
      card.onclick = function () {
        typeGrid.querySelectorAll('[data-type-id]').forEach(function (c) {
          c.style.borderColor = '#d9d9d9';
          c.style.background = '';
        });
        card.style.borderColor = '#1890ff';
        card.style.background = '#e6f7ff';
        selectedType = tpl.id;
        handleResourceTypeSelect(tpl.id);
      };
      
      typeGrid.appendChild(card);
    });
  }

  // 价格参考数据（元/月）
  var unitPrices = {
    'ECS 云服务器': 760, 'K8S 集群': 2400, 'RDS 云数据库': 980,
    'PolarDB PostgreSQL': 1200, 'MongoDB': 680, 'Redis 缓存': 340,
    'SLB 负载均衡': 120, 'ALB 应用负载均衡': 180, 'NLB 网络负载均衡': 150,
    'Kafka 消息队列': 880, 'Elasticsearch': 960, 'MaxCompute': 1500,
    'Flink 实时计算': 1200, 'OSS 对象存储': 200, 'CDN 流量包': 300,
    '块存储 ESSD': 80, '文件存储 NAS': 160, '云原生网关': 400, '实时数仓 Hologres': 1800
  };
  var periodMonths = { '1m': 1, '3m': 3, '6m': 6, '1y': 12, '2y': 24, '3y': 36 };

  function updatePricing() {
    var unitPriceEl = document.getElementById('page-apply-unit-price');
    var totalPriceEl = document.getElementById('page-apply-total-price');
    var quantityEl = document.getElementById('page-apply-quantity');
    var payTypeEl = document.getElementById('page-apply-pay-type');
    var periodEl = document.getElementById('page-apply-period');
    var periodItem = document.getElementById('page-apply-period-item');
    if (!unitPriceEl || !totalPriceEl) return;
    var isPostpaid = payTypeEl && payTypeEl.value === 'postpaid';
    if (periodItem) periodItem.style.display = isPostpaid ? 'none' : '';
    var tpl = null;
    for (var i = 0; i < MockData.platformTemplates.length; i++) {
      if (MockData.platformTemplates[i].id === selectedType) { tpl = MockData.platformTemplates[i]; break; }
    }
    if (!tpl) { unitPriceEl.textContent = '--'; totalPriceEl.textContent = '--'; return; }
    var basePrice = unitPrices[tpl.resType] || 0;
    var qty = parseInt(quantityEl ? quantityEl.value : 1) || 1;
    if (isPostpaid) {
      unitPriceEl.textContent = '¥' + (basePrice / 720).toFixed(4) + ' /小时（按量）';
      totalPriceEl.textContent = '按量计费';
    } else {
      var months = periodEl ? (periodMonths[periodEl.value] || 1) : 1;
      unitPriceEl.textContent = '¥' + basePrice.toLocaleString() + ' /月/实例';
      totalPriceEl.textContent = '¥' + (basePrice * qty * months).toLocaleString() + ' 元';
    }
  }



  // 处理资源类型选择的函数
  function handleResourceTypeSelect(tplId) {
    if (!tplId) {
      formContainer.innerHTML = '';
      document.getElementById('page-apply-dynamic-card').style.display = 'none';
      if (pricingContainer) pricingContainer.style.display = 'none';
      return;
    }
    var tpl = null;
    for (var i = 0; i < MockData.platformTemplates.length; i++) {
      if (MockData.platformTemplates[i].id === tplId) { tpl = MockData.platformTemplates[i]; break; }
    }
    if (!tpl) { formContainer.innerHTML = ''; return; }

    // 合并部门 fieldOverrides
    var mergedTpl = JSON.parse(JSON.stringify(tpl));
    var deptCfg = MockData.deptConfig['dept-infra'];
    var deptTplEntry = deptCfg && (deptCfg.templates || []).find(function (t) { return t.id === tplId; });
    var deptOverrides = (deptTplEntry && deptTplEntry.fieldOverrides) || {};
    var unconfiguredRequired = [];
    (mergedTpl.fieldGroups || []).forEach(function (group, gIdx) {
      group.fields.forEach(function (field) {
        var key = gIdx + '|' + field.param;
        var ov = deptOverrides[key] || {};
        if (ov.show === false) { field.visible = false; return; }
        if (field.type === 'select') {
          if (ov.cascadeFrom) {
            field.cascadeFrom = ov.cascadeFrom; field.cascadeData = ov.cascadeData || ''; field.options = '';
          } else if (ov.options) {
            field.options = ov.options; field.cascadeFrom = ''; field.cascadeData = '';
          } else {
            field.options = field.referenceOptions || ''; field.cascadeFrom = ''; field.cascadeData = '';
            if (field.required && field.visible !== false) unconfiguredRequired.push(field.name);
          }
        }
        if (ov.fixedValue) { field.type = 'fixed'; field.fixedValue = ov.fixedValue; }
        if (ov.defaultValue) field.defaultValue = ov.defaultValue;
        if (ov.regex) field.regex = ov.regex;
        if (ov.deptMin !== undefined) field.min = ov.deptMin;
        if (ov.deptMax !== undefined) field.max = ov.deptMax;
      });
    });

    var html = '';
    if (unconfiguredRequired.length > 0) {
      html += '<div class="ant-alert ant-alert-warning" style="margin-bottom:12px;">&#9888; 以下必填字段尚未配置选项，申请可能无法完成，请联系部门负责人在"部门配置"中完善：<strong>' + esc(unconfiguredRequired.join('、')) + '</strong></div>';
    }
    html += renderTemplateFormFields(mergedTpl, { disabled: false });
    formContainer.innerHTML = html;
    initCascadeFields(formContainer);

    var titleEl = document.getElementById('page-apply-dynamic-title');
    if (titleEl) titleEl.textContent = tpl.resType + ' — 申请参数';
    document.getElementById('page-apply-dynamic-card').style.display = '';
    if (pricingContainer) pricingContainer.style.display = '';
    updatePricing();
  }

  ['page-apply-quantity', 'page-apply-pay-type', 'page-apply-period'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.oninput = el.onchange = updatePricing;
  });

  // 提交
  var submitBtn = document.getElementById('btn-submit-apply-res');
  if (submitBtn) submitBtn.onclick = function () {
    if (!selectedVendor) { showMessage('请选择云厂商', 'warning'); return; }
    if (!selectedType) { showMessage('请选择资源类型', 'warning'); return; }
    if (!resGroupSel || !resGroupSel.value) { showMessage('请选择所属资源组', 'warning'); return; }
    var tpl = null;
    for (var i = 0; i < MockData.platformTemplates.length; i++) {
      if (MockData.platformTemplates[i].id === selectedType) { tpl = MockData.platformTemplates[i]; break; }
    }
    if (!tpl) return;
    var resName = tpl.resType + '-' + Date.now();
    var firstInput = formContainer.querySelector('.ant-input[type="text"], .ant-input:not([type])');
    if (firstInput && firstInput.value.trim()) resName = firstInput.value.trim();
    var selectedGroup = resGroupSel.options[resGroupSel.selectedIndex].text;
    MockData.resources.push({
      name: resName, resId: 'i-new-' + Date.now(), type: tpl.resType.split(' ')[0], typeColor: 'blue', shape: '实例型',
      group: '容器平台组', groupId: 'grp-container', project: selectedGroup,
      perm: 'master', permColor: 'green', status: '审批中', statusClass: 'processing'
    });
    var now = new Date();
    var timeStr = now.getFullYear() + '/' + String(now.getMonth() + 1).padStart(2, '0') + '/' + String(now.getDate()).padStart(2, '0') + ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0');
    MockData.auditLogs.unshift({ time: timeStr, operator: '王浩然', dept: '基础架构部', opType: '资源操作', opTypeColor: 'blue', target: resName, desc: '申请 ' + tpl.resType, ip: '10.128.0.55' });
    pageCache['resource'] = null;
    showMessage('资源申请已提交（' + tpl.resType + '），等待审批', 'success');
    loadPage('resource');
  };
}

// ===== 申请资源动态表单（弹窗版，保留兼容） =====
function initApplyResourceModal() {
  var sel = document.getElementById('modal-apply-res-type');
  var formContainer = document.getElementById('modal-apply-dynamic-form');
  var pricingContainer = document.getElementById('modal-apply-pricing');
  if (!sel || !formContainer) return;

  // 填充资源组下拉
  var resGroupSel = document.getElementById('modal-apply-res-group');
  if (resGroupSel) {
    MockData.projects.forEach(function (p) {
      var opt = document.createElement('option');
      opt.value = p.name;
      opt.textContent = p.name + '（' + p.dept + '）';
      resGroupSel.appendChild(opt);
    });
  }

  // 填充资源类型下拉（按大类分组）
  var groupedTemplates = {};
  MockData.platformTemplates.filter(function (t) { return t.opType === '申请'; }).forEach(function (tpl) {
    if (!groupedTemplates[tpl.category]) {
      groupedTemplates[tpl.category] = [];
    }
    groupedTemplates[tpl.category].push(tpl);
  });
  
  // 按大类顺序排序
  var categoryOrder = ['计算类', '数据库类', '网络与负载均衡类', '中间件类', '大数据与搜索分析类', '存储类'];
  
  categoryOrder.forEach(function (category) {
    if (groupedTemplates[category]) {
      var optgroup = document.createElement('optgroup');
      optgroup.label = category;
      sel.appendChild(optgroup);
      
      groupedTemplates[category].forEach(function (tpl) {
        var opt = document.createElement('option');
        opt.value = tpl.id;
        opt.textContent = tpl.resType;
        optgroup.appendChild(opt);
      });
    }
  });

  // 价格参考数据（模拟单价，元/月）
  var unitPrices = {
    'ECS 云服务器': 760, 'K8S 集群': 2400, 'RDS 云数据库': 980,
    'PolarDB PostgreSQL': 1200, 'MongoDB': 680, 'Redis 缓存': 340,
    'SLB 负载均衡': 120, 'ALB 应用负载均衡': 180, 'NLB 网络负载均衡': 150,
    'Kafka 消息队列': 880, 'Elasticsearch': 960, 'MaxCompute': 1500,
    'Flink 实时计算': 1200, 'OSS 对象存储': 200, 'CDN 流量包': 300,
    '块存储 ESSD': 80, '文件存储 NAS': 160, '云原生网关': 400, '实时数仓 Hologres': 1800
  };
  var periodMonths = { '1m': 1, '3m': 3, '6m': 6, '1y': 12, '2y': 24, '3y': 36 };

  function updatePricing() {
    var unitPriceEl = document.getElementById('modal-apply-unit-price');
    var totalPriceEl = document.getElementById('modal-apply-total-price');
    var quantityEl = document.getElementById('modal-apply-quantity');
    var payTypeEl = document.getElementById('modal-apply-pay-type');
    var periodEl = document.getElementById('modal-apply-period');
    var periodItem = document.getElementById('modal-apply-period-item');
    if (!unitPriceEl || !totalPriceEl) return;

    var isPostpaid = payTypeEl && payTypeEl.value === 'postpaid';
    if (periodItem) periodItem.style.display = isPostpaid ? 'none' : '';

    var tplId = sel.value;
    var tpl = null;
    for (var i = 0; i < MockData.platformTemplates.length; i++) {
      if (MockData.platformTemplates[i].id === tplId) { tpl = MockData.platformTemplates[i]; break; }
    }
    if (!tpl) { unitPriceEl.textContent = '--'; totalPriceEl.textContent = '--'; return; }

    var basePrice = unitPrices[tpl.resType] || 0;
    var qty = parseInt(quantityEl ? quantityEl.value : 1) || 1;

    if (isPostpaid) {
      var hourly = (basePrice / 720).toFixed(4);
      unitPriceEl.textContent = '¥' + hourly + ' /小时（按量）';
      totalPriceEl.textContent = '按量计费';
    } else {
      var months = periodEl ? (periodMonths[periodEl.value] || 1) : 1;
      var unitTotal = basePrice;
      var grandTotal = basePrice * qty * months;
      unitPriceEl.textContent = '¥' + unitTotal.toLocaleString() + ' /月/实例';
      totalPriceEl.textContent = '¥' + grandTotal.toLocaleString() + ' 元';
    }
  }

  sel.onchange = function () {
    var tplId = sel.value;
    if (!tplId) {
      formContainer.innerHTML = '';
      if (pricingContainer) pricingContainer.style.display = 'none';
      return;
    }
    var tpl = null;
    for (var i = 0; i < MockData.platformTemplates.length; i++) {
      if (MockData.platformTemplates[i].id === tplId) { tpl = MockData.platformTemplates[i]; break; }
    }
    if (!tpl) { formContainer.innerHTML = ''; return; }

    // 合并当前部门的 fieldOverrides 到模板副本
    var mergedTpl = JSON.parse(JSON.stringify(tpl));
    var deptCfg = MockData.deptConfig['dept-infra']; // 原型中固定为 dept-infra
    var deptTplEntry = deptCfg && (deptCfg.templates || []).find(function (t) { return t.id === tplId; });
    var deptOverrides = (deptTplEntry && deptTplEntry.fieldOverrides) || {};
    var unconfiguredRequired = [];

    (mergedTpl.fieldGroups || []).forEach(function (group, gIdx) {
      group.fields.forEach(function (field) {
        var key = gIdx + '|' + field.param;
        var ov = deptOverrides[key] || {};
        if (ov.show === false) { field.visible = false; return; }
        if (field.type === 'select') {
          if (ov.cascadeFrom) {
            field.cascadeFrom = ov.cascadeFrom;
            field.cascadeData = ov.cascadeData || '';
            field.options = '';
          } else if (ov.options) {
            field.options = ov.options;
            field.cascadeFrom = '';
            field.cascadeData = '';
          } else {
            // 使用参考选项作为兜底（如果有）
            field.options = field.referenceOptions || '';
            field.cascadeFrom = '';
            field.cascadeData = '';
            if (field.required && field.visible !== false) {
              unconfiguredRequired.push(field.name);
            }
          }
        }
        if (ov.fixedValue) { field.type = 'fixed'; field.fixedValue = ov.fixedValue; }
        if (ov.defaultValue) field.defaultValue = ov.defaultValue;
        if (ov.regex) field.regex = ov.regex;
        if (ov.deptMin !== undefined) field.min = ov.deptMin;
        if (ov.deptMax !== undefined) field.max = ov.deptMax;
      });
    });

    var html = '<div class="ant-divider"></div>';
    if (unconfiguredRequired.length > 0) {
      html += '<div style="background:#fff7e6;border:1px solid #ffd591;border-radius:4px;padding:10px 14px;margin-bottom:12px;font-size:13px;color:#874d00;">';
      html += '&#9888; 以下必填字段尚未配置选项，申请可能无法完成，请联系部门负责人在"部门配置"中完善：';
      html += '<strong>' + esc(unconfiguredRequired.join('、')) + '</strong>';
      html += '</div>';
    }
    html += '<div style="font-size:14px;font-weight:500;margin-bottom:16px;color:var(--text-color);">' + esc(tpl.resType) + ' - 申请参数</div>';
    html += renderTemplateFormFields(mergedTpl, { disabled: false });
    formContainer.innerHTML = html;
    initCascadeFields(formContainer);
    if (pricingContainer) pricingContainer.style.display = '';
    updatePricing();
  };

  // 绑定计费配置变化
  ['modal-apply-quantity', 'modal-apply-pay-type', 'modal-apply-period'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.oninput = el.onchange = updatePricing;
  });
}

// =============================================
// 申请记录页
// =============================================
function initApplyRecordsPage() {
  var searchEl = document.getElementById('apply-record-search');
  if (searchEl) searchEl.oninput = function () { state.applyRecords.keyword = searchEl.value; state.applyRecords.page = 1; renderApplyRecords(); };
  var statusFilter = document.getElementById('apply-record-status-filter');
  if (statusFilter) statusFilter.onchange = function () { state.applyRecords.statusFilter = statusFilter.value; state.applyRecords.page = 1; renderApplyRecords(); };
  var typeFilter = document.getElementById('apply-record-type-filter');
  if (typeFilter) typeFilter.onchange = function () { state.applyRecords.typeFilter = typeFilter.value; state.applyRecords.page = 1; renderApplyRecords(); };
  renderApplyRecords();
}

function renderApplyRecords() {
  var s = state.applyRecords;
  var filtered = MockData.applicationRecords.filter(function (r) {
    if (s.keyword) {
      var kw = s.keyword.toLowerCase();
      if (r.id.toLowerCase().indexOf(kw) === -1 && r.title.toLowerCase().indexOf(kw) === -1) return false;
    }
    if (s.statusFilter && r.status !== s.statusFilter) return false;
    if (s.typeFilter && r.type !== s.typeFilter) return false;
    return true;
  });
  var total = filtered.length;
  var start = (s.page - 1) * PAGE_SIZE;
  var pageData = filtered.slice(start, start + PAGE_SIZE);
  var statusColors = { '审批中': 'processing', '已通过': 'success', '已驳回': 'error', '已撤回': 'default' };
  var typeLabels = { 'resource': '资源操作', 'subaccount': '子账号申请' };
  var typeColors = { 'resource': 'blue', 'subaccount': 'purple' };

  var tableContainer = document.getElementById('apply-record-table-container');
  if (!tableContainer) return;
  var html = '<table class="ant-table"><thead><tr><th>申请单号</th><th>标题</th><th>类型</th><th>操作类型</th><th>状态</th><th>申请人</th><th>申请时间</th><th>操作</th></tr></thead><tbody>';
  if (pageData.length === 0) {
    html += '<tr><td colspan="8" style="text-align:center;color:var(--text-secondary);padding:32px;">暂无数据</td></tr>';
  }
  pageData.forEach(function (r) {
    html += '<tr><td style="white-space:nowrap;font-family:monospace;font-size:12px;">' + esc(r.id) + '</td>';
    html += '<td>' + esc(r.title) + '</td>';
    html += '<td><span class="ant-tag ant-tag-' + (typeColors[r.type] || 'default') + '">' + esc(typeLabels[r.type] || r.type) + '</span></td>';
    html += '<td>' + esc(r.opType) + '</td>';
    html += '<td><span class="ant-badge-status-dot ant-badge-status-' + (statusColors[r.status] || 'default') + '"></span>' + esc(r.status) + '</td>';
    html += '<td>' + esc(r.applicant) + '</td>';
    html += '<td style="white-space:nowrap;">' + esc(r.createTime) + '</td>';
    html += '<td><a class="ant-btn-link apply-record-view-btn" data-record-id="' + esc(r.id) + '">查看</a></td></tr>';
  });
  html += '</tbody></table><div id="apply-record-pagination"></div>';
  tableContainer.innerHTML = html;
  var pagEl = document.getElementById('apply-record-pagination');
  if (pagEl) renderPagination(pagEl, total, s.page, PAGE_SIZE, function (p) { s.page = p; renderApplyRecords(); });

  tableContainer.querySelectorAll('.apply-record-view-btn').forEach(function (btn) {
    btn.onclick = function () {
      var recordId = btn.getAttribute('data-record-id');
      var record = null;
      for (var i = 0; i < MockData.applicationRecords.length; i++) {
        if (MockData.applicationRecords[i].id === recordId) { record = MockData.applicationRecords[i]; break; }
      }
      if (record) showApplyDetailModal(record);
    };
  });
}

// =============================================
// 审核记录页
// =============================================
function initReviewRecordsPage() {
  var searchEl = document.getElementById('review-record-search');
  if (searchEl) searchEl.oninput = function () { state.reviewRecords.keyword = searchEl.value; state.reviewRecords.page = 1; renderReviewRecords(); };
  var statusFilter = document.getElementById('review-record-status-filter');
  if (statusFilter) statusFilter.onchange = function () { state.reviewRecords.statusFilter = statusFilter.value; state.reviewRecords.page = 1; renderReviewRecords(); };
  renderReviewRecords();
}

function getReviewRecords() {
  // 获取当前用户（admin）需要审核或已审核的记录
  var currentUser = 'admin'; // 模拟当前用户
  var reviewerNames = ['张明远', '李思远', '刘佳琪', '周文博']; // admin 可能对应的审核人身份
  var results = [];
  MockData.applicationRecords.forEach(function (r) {
    var isReviewer = false;
    var currentNode = '';
    var myStatus = ''; // pending | done | rejected
    for (var i = 0; i < r.flowNodes.length; i++) {
      var node = r.flowNodes[i];
      if (node.role === '申请人') continue;
      if (reviewerNames.indexOf(node.name) !== -1) {
        isReviewer = true;
        if (node.status === 'pending') { myStatus = 'pending'; }
        else if (node.status === 'done') { if (!myStatus) myStatus = 'done'; }
        else if (node.status === 'rejected') { myStatus = 'rejected'; }
      }
    }
    // 找当前节点
    for (var j = 0; j < r.flowNodes.length; j++) {
      if (r.flowNodes[j].status === 'pending') { currentNode = r.flowNodes[j].role + '（' + r.flowNodes[j].name + '）'; break; }
    }
    if (!currentNode) {
      if (r.status === '已通过') currentNode = '已完成';
      else if (r.status === '已驳回') currentNode = '已驳回';
      else if (r.status === '已撤回') currentNode = '已撤回';
    }
    if (isReviewer) {
      results.push({ record: r, currentNode: currentNode, myStatus: myStatus });
    }
  });
  return results;
}

function renderReviewRecords() {
  var s = state.reviewRecords;
  var allReviews = getReviewRecords();
  var filtered = allReviews.filter(function (item) {
    if (s.keyword) {
      var kw = s.keyword.toLowerCase();
      if (item.record.id.toLowerCase().indexOf(kw) === -1 && item.record.title.toLowerCase().indexOf(kw) === -1) return false;
    }
    if (s.statusFilter === 'pending' && item.myStatus !== 'pending') return false;
    if (s.statusFilter === 'done' && item.myStatus === 'pending') return false;
    return true;
  });
  var total = filtered.length;
  var start = (s.page - 1) * PAGE_SIZE;
  var pageData = filtered.slice(start, start + PAGE_SIZE);
  var statusColors = { '审批中': 'processing', '已通过': 'success', '已驳回': 'error', '已撤回': 'default' };

  var tableContainer = document.getElementById('review-record-table-container');
  if (!tableContainer) return;
  var html = '<table class="ant-table"><thead><tr><th>申请单号</th><th>标题</th><th>申请人</th><th>申请部门</th><th>当前节点</th><th>状态</th><th>申请时间</th><th>操作</th></tr></thead><tbody>';
  if (pageData.length === 0) {
    html += '<tr><td colspan="8" style="text-align:center;color:var(--text-secondary);padding:32px;">暂无数据</td></tr>';
  }
  pageData.forEach(function (item) {
    var r = item.record;
    html += '<tr><td style="white-space:nowrap;font-family:monospace;font-size:12px;">' + esc(r.id) + '</td>';
    html += '<td>' + esc(r.title) + '</td>';
    html += '<td>' + esc(r.applicant) + '</td>';
    html += '<td>' + esc(r.applicantDept) + '</td>';
    html += '<td>' + esc(item.currentNode) + '</td>';
    html += '<td><span class="ant-badge-status-dot ant-badge-status-' + (statusColors[r.status] || 'default') + '"></span>' + esc(r.status) + '</td>';
    html += '<td style="white-space:nowrap;">' + esc(r.createTime) + '</td>';
    html += '<td>';
    if (item.myStatus === 'pending') {
      html += '<a class="ant-btn-link review-record-action-btn" data-record-id="' + esc(r.id) + '">审核</a>';
    } else {
      html += '<a class="ant-btn-link review-record-view-btn" data-record-id="' + esc(r.id) + '">查看</a>';
    }
    html += '</td></tr>';
  });
  html += '</tbody></table><div id="review-record-pagination"></div>';
  tableContainer.innerHTML = html;
  var pagEl = document.getElementById('review-record-pagination');
  if (pagEl) renderPagination(pagEl, total, s.page, PAGE_SIZE, function (p) { s.page = p; renderReviewRecords(); });

  tableContainer.querySelectorAll('.review-record-view-btn').forEach(function (btn) {
    btn.onclick = function () {
      var recordId = btn.getAttribute('data-record-id');
      var record = null;
      for (var i = 0; i < MockData.applicationRecords.length; i++) {
        if (MockData.applicationRecords[i].id === recordId) { record = MockData.applicationRecords[i]; break; }
      }
      if (record) showApplyDetailModal(record);
    };
  });

  tableContainer.querySelectorAll('.review-record-action-btn').forEach(function (btn) {
    btn.onclick = function () {
      var recordId = btn.getAttribute('data-record-id');
      var record = null;
      for (var i = 0; i < MockData.applicationRecords.length; i++) {
        if (MockData.applicationRecords[i].id === recordId) { record = MockData.applicationRecords[i]; break; }
      }
      if (record) showReviewDetailModal(record, function () { renderReviewRecords(); });
    };
  });
}

// =============================================
// 流程节点状态条
// =============================================
function renderFlowNodesStatus(flowNodes) {
  if (!flowNodes || !flowNodes.length) return '<span style="color:var(--text-secondary);">无流程信息</span>';
  var statusStyles = {
    'done': { bg: '#f6ffed', border: '#b7eb8f', color: '#52c41a', icon: '&#10003;', label: '已完成' },
    'pending': { bg: '#e6f7ff', border: '#91d5ff', color: '#1890ff', icon: '&#9998;', label: '审核中' },
    'waiting': { bg: '#f5f5f5', border: '#d9d9d9', color: '#999', icon: '&#9203;', label: '等待中' },
    'rejected': { bg: '#fff2f0', border: '#ffa39e', color: '#ff4d4f', icon: '&#10007;', label: '已驳回' }
  };
  var html = '<div style="display:flex;align-items:flex-start;gap:0;overflow-x:auto;padding:8px 0;">';
  flowNodes.forEach(function (node, idx) {
    var s = statusStyles[node.status] || statusStyles['waiting'];
    html += '<div style="display:flex;align-items:center;">';
    html += '<div style="text-align:center;min-width:100px;max-width:140px;">';
    html += '<div style="width:36px;height:36px;border-radius:50%;background:' + s.bg + ';border:2px solid ' + s.border + ';display:inline-flex;align-items:center;justify-content:center;color:' + s.color + ';font-size:16px;font-weight:bold;">' + s.icon + '</div>';
    html += '<div style="font-size:12px;font-weight:500;margin-top:4px;color:' + s.color + ';">' + esc(node.role) + '</div>';
    html += '<div style="font-size:11px;color:var(--text-secondary);">' + esc(node.name) + '</div>';
    if (node.time) html += '<div style="font-size:10px;color:var(--text-secondary);">' + esc(node.time) + '</div>';
    if (node.remark) html += '<div style="font-size:10px;color:' + s.color + ';max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="' + esc(node.remark) + '">' + esc(node.remark) + '</div>';
    html += '</div>';
    if (idx < flowNodes.length - 1) {
      html += '<div style="width:40px;height:2px;background:#d9d9d9;margin:18px 4px 0;flex-shrink:0;"></div>';
    }
    html += '</div>';
  });
  html += '</div>';
  return html;
}

// =============================================
// 申请详情弹窗
// =============================================
function showApplyDetailModal(record) {
  var html = '<div class="ant-drawer-overlay" style="display:flex;">';
  html += '<div class="ant-drawer">';
  html += '<div class="ant-drawer-header">申请详情 - ' + esc(record.id) + ' <button class="ant-drawer-close" onclick="hideModal()">&times;</button></div>';
  html += '<div class="ant-drawer-body">';
  // 流程节点状态条
  html += '<div style="margin-bottom:20px;padding:16px;background:#fafafa;border-radius:8px;border:1px solid #f0f0f0;">';
  html += '<div style="font-size:13px;font-weight:500;margin-bottom:8px;color:var(--text-color);">审批流程</div>';
  html += renderFlowNodesStatus(record.flowNodes);
  html += '</div>';
  // 申请人信息
  html += '<div style="margin-bottom:20px;">';
  html += '<div style="font-size:13px;font-weight:500;margin-bottom:8px;color:var(--text-color);">申请信息</div>';
  html += '<div class="ant-descriptions" style="display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;">';
  html += '<div><span style="color:var(--text-secondary);font-size:12px;">申请单号</span><div>' + esc(record.id) + '</div></div>';
  html += '<div><span style="color:var(--text-secondary);font-size:12px;">申请人</span><div>' + esc(record.applicant) + '</div></div>';
  html += '<div><span style="color:var(--text-secondary);font-size:12px;">部门 / 组</span><div>' + esc(record.applicantDept) + ' / ' + esc(record.applicantGroup) + '</div></div>';
  html += '<div><span style="color:var(--text-secondary);font-size:12px;">申请时间</span><div>' + esc(record.createTime) + '</div></div>';
  html += '<div><span style="color:var(--text-secondary);font-size:12px;">状态</span><div>' + esc(record.status) + '</div></div>';
  html += '<div><span style="color:var(--text-secondary);font-size:12px;">审批流程</span><div>' + esc(getFlowLabel(record.flowTemplate)) + '</div></div>';
  html += '</div></div>';
  // 申请表单
  if (record.formData) {
    html += '<div>';
    html += '<div style="font-size:13px;font-weight:500;margin-bottom:8px;color:var(--text-color);">申请表单</div>';
    html += '<table class="ant-table" style="font-size:13px;"><tbody>';
    var keys = Object.keys(record.formData);
    for (var i = 0; i < keys.length; i++) {
      html += '<tr><td style="width:140px;color:var(--text-secondary);background:#fafafa;font-weight:500;">' + esc(keys[i]) + '</td><td>' + esc(record.formData[keys[i]]) + '</td></tr>';
    }
    html += '</tbody></table></div>';
  }
  html += '</div>';
  html += '<div class="ant-drawer-footer"><button class="ant-btn" onclick="hideModal()">关闭</button></div>';
  html += '</div></div>';

  var container = document.getElementById('modal-container');
  container.innerHTML = html;
  var overlay = container.querySelector('.ant-drawer-overlay');
  if (overlay) overlay.onclick = function (e) { if (e.target === overlay) hideModal(); };
}

// =============================================
// 审核详情弹窗（含通过/驳回）
// =============================================
function showReviewDetailModal(record, onAction) {
  var html = '<div class="ant-drawer-overlay" style="display:flex;">';
  html += '<div class="ant-drawer">';
  html += '<div class="ant-drawer-header">审核详情 - ' + esc(record.id) + ' <button class="ant-drawer-close" onclick="hideModal()">&times;</button></div>';
  html += '<div class="ant-drawer-body">';
  // 流程节点状态条
  html += '<div style="margin-bottom:20px;padding:16px;background:#fafafa;border-radius:8px;border:1px solid #f0f0f0;">';
  html += '<div style="font-size:13px;font-weight:500;margin-bottom:8px;color:var(--text-color);">审批流程</div>';
  html += renderFlowNodesStatus(record.flowNodes);
  html += '</div>';
  // 申请人信息
  html += '<div style="margin-bottom:20px;">';
  html += '<div style="font-size:13px;font-weight:500;margin-bottom:8px;color:var(--text-color);">申请信息</div>';
  html += '<div class="ant-descriptions" style="display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;">';
  html += '<div><span style="color:var(--text-secondary);font-size:12px;">申请单号</span><div>' + esc(record.id) + '</div></div>';
  html += '<div><span style="color:var(--text-secondary);font-size:12px;">申请人</span><div>' + esc(record.applicant) + '</div></div>';
  html += '<div><span style="color:var(--text-secondary);font-size:12px;">部门 / 组</span><div>' + esc(record.applicantDept) + ' / ' + esc(record.applicantGroup) + '</div></div>';
  html += '<div><span style="color:var(--text-secondary);font-size:12px;">申请时间</span><div>' + esc(record.createTime) + '</div></div>';
  html += '</div></div>';
  // 申请表单
  if (record.formData) {
    html += '<div style="margin-bottom:20px;">';
    html += '<div style="font-size:13px;font-weight:500;margin-bottom:8px;color:var(--text-color);">申请表单</div>';
    html += '<table class="ant-table" style="font-size:13px;"><tbody>';
    var keys = Object.keys(record.formData);
    for (var i = 0; i < keys.length; i++) {
      html += '<tr><td style="width:140px;color:var(--text-secondary);background:#fafafa;font-weight:500;">' + esc(keys[i]) + '</td><td>' + esc(record.formData[keys[i]]) + '</td></tr>';
    }
    html += '</tbody></table></div>';
  }
  // 审批操作区（仅当有 pending 节点时）
  var hasPending = false;
  for (var j = 0; j < record.flowNodes.length; j++) {
    if (record.flowNodes[j].status === 'pending') { hasPending = true; break; }
  }
  if (hasPending && record.status === '审批中') {
    html += '<div style="margin-top:16px;padding:16px;background:#e6f7ff;border:1px solid #91d5ff;border-radius:6px;">';
    html += '<div style="font-size:13px;font-weight:500;margin-bottom:8px;color:#1890ff;">审批操作</div>';
    html += '<div class="ant-form-item"><div class="ant-form-label">审批意见</div>';
    html += '<div class="ant-form-control"><textarea class="ant-textarea" id="review-remark" placeholder="请输入审批意见..." rows="3"></textarea></div></div>';
    html += '<div style="display:flex;gap:8px;justify-content:flex-end;">';
    html += '<button class="ant-btn" id="review-reject-btn" style="color:#ff4d4f;border-color:#ff4d4f;">驳回</button>';
    html += '<button class="ant-btn ant-btn-primary" id="review-approve-btn">通过</button>';
    html += '</div></div>';
  }
  html += '</div>';
  html += '<div class="ant-drawer-footer"><button class="ant-btn" onclick="hideModal()">关闭</button></div>';
  html += '</div></div>';

  var container = document.getElementById('modal-container');
  container.innerHTML = html;
  var overlay = container.querySelector('.ant-drawer-overlay');
  if (overlay) overlay.onclick = function (e) { if (e.target === overlay) hideModal(); };

  // 绑定通过/驳回按钮
  var approveBtn = document.getElementById('review-approve-btn');
  var rejectBtn = document.getElementById('review-reject-btn');
  if (approveBtn) {
    approveBtn.onclick = function () {
      var remark = (document.getElementById('review-remark') || {}).value || '';
      var now = new Date();
      var timeStr = now.getFullYear() + '/' + String(now.getMonth() + 1).padStart(2, '0') + '/' + String(now.getDate()).padStart(2, '0') + ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':00';
      // 当前 pending 节点 → done
      var allDone = true;
      var moved = false;
      for (var k = 0; k < record.flowNodes.length; k++) {
        if (record.flowNodes[k].status === 'pending' && !moved) {
          record.flowNodes[k].status = 'done';
          record.flowNodes[k].time = timeStr;
          record.flowNodes[k].remark = remark || '同意';
          moved = true;
          // 下一个 waiting → pending
          if (k + 1 < record.flowNodes.length && record.flowNodes[k + 1].status === 'waiting') {
            record.flowNodes[k + 1].status = 'pending';
            allDone = false;
          }
        } else if (record.flowNodes[k].status === 'waiting' || record.flowNodes[k].status === 'pending') {
          allDone = false;
        }
      }
      if (allDone) record.status = '已通过';
      record.updateTime = timeStr;
      hideModal();
      showMessage('审批通过', 'success');
      if (onAction) onAction();
    };
  }
  if (rejectBtn) {
    rejectBtn.onclick = function () {
      var remark = (document.getElementById('review-remark') || {}).value || '';
      if (!remark) { showMessage('请输入驳回原因', 'warning'); return; }
      var now = new Date();
      var timeStr = now.getFullYear() + '/' + String(now.getMonth() + 1).padStart(2, '0') + '/' + String(now.getDate()).padStart(2, '0') + ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':00';
      for (var k = 0; k < record.flowNodes.length; k++) {
        if (record.flowNodes[k].status === 'pending') {
          record.flowNodes[k].status = 'rejected';
          record.flowNodes[k].time = timeStr;
          record.flowNodes[k].remark = remark;
          break;
        }
      }
      record.status = '已驳回';
      record.statusClass = 'error';
      record.updateTime = timeStr;
      hideModal();
      showMessage('已驳回', 'info');
      if (onAction) onAction();
    };
  }
}
