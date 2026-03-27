# 云账号地域与可用区功能 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在关联主账号时新增默认地域字段，并在云账号页新增「资源信息」Tab 展示可用区及 ECS 规格族。

**Architecture:** 纯前端 HTML/JS 原型，无构建工具。改动分 6 个文件：Mock 数据层提供数据基础，HTML 层增加表单字段和 Tab 结构，JS 层处理交互逻辑。弹窗延续 `loadAndShowModal` + callback 模式；Tab 切换在 `initCloudPage` 内完整接管三个 Tab 的 onclick，避免依赖 router.js `switchTab` 的双 ID 限制。

**Tech Stack:** Vanilla JS (ES5)，无框架，无测试框架。验证方式为浏览器手动操作。

---

## 文件变更总览

| 文件 | 类型 | 职责 |
|------|------|------|
| `prototype/js/mock/cloud.js` | 修改 | 主账号加 region/regionName；新增 cloudResources（可用区 + 规格族数据） |
| `prototype/modals/cloud/bind-main.html` | 修改 | Step 2 加「默认地域」select 字段 |
| `prototype/js/pages/router.js` | 修改 | `handleModalSubmit('cloud/bind-main')` 保存 region/regionName |
| `prototype/pages/cloud.html` | 修改 | 加第三个 Tab 导航 + 内容容器 |
| `prototype/js/pages/cloud.js` | 修改 | 地域常量；bind-main 回调；三 Tab 切换；资源 Tab 初始化/渲染/弹窗 |
| `prototype/modals/cloud/az-spec-families.html` | 新建 | 规格族弹窗骨架 HTML |

---

## Task 1：更新 Mock 数据

**Files:**
- Modify: `prototype/js/mock/cloud.js`

- [ ] **Step 1：在主账号数据中加 region/regionName 字段**

打开 `prototype/js/mock/cloud.js`，将 `MockData.cloudAccounts.main` 的三条记录改为：

```js
MockData.cloudAccounts = {
  main: [
    { dept: '基础架构部', vendor: '阿里云', account: 'infra-main (LTAI****7F2Q)',
      region: 'cn-hangzhou', regionName: '华东1（杭州）',
      bindUser: '张明远', bindTime: '2025/08/20 15:30:00', status: '正常' },
    { dept: '业务研发部', vendor: '阿里云', account: 'biz-prod (LTAI****k9Xm)',
      region: 'cn-shanghai', regionName: '华东2（上海）',
      bindUser: '刘佳琪', bindTime: '2025/09/05 10:00:00', status: '正常' },
    { dept: '数据平台部', vendor: '', account: '', bindUser: '', bindTime: '',
      region: '', regionName: '', status: '未关联' }
  ],
  sub: [ /* 保持不变 */ ]
};
```

- [ ] **Step 2：在文件末尾追加 cloudResources mock 数据**

在 `cloud.js` 末尾（`MockData.cloudAccounts` 赋值语句之后）追加：

```js
MockData.cloudResources = {
  syncTime: '2026-03-27 10:30:00',
  zones: [
    {
      accountAlias: 'infra-main', region: 'cn-hangzhou',
      azName: '杭州 可用区G', azCode: 'cn-hangzhou-g',
      specFamilies: [
        { family: 'ecs.g8a', desc: '通用型 g8a',
          specs: ['ecs.g8a.large', 'ecs.g8a.xlarge', 'ecs.g8a.2xlarge', 'ecs.g8a.4xlarge', 'ecs.g8a.8xlarge'] },
        { family: 'ecs.c8a', desc: '计算型 c8a',
          specs: ['ecs.c8a.large', 'ecs.c8a.xlarge', 'ecs.c8a.2xlarge'] },
        { family: 'ecs.r8a', desc: '内存型 r8a',
          specs: ['ecs.r8a.large', 'ecs.r8a.xlarge', 'ecs.r8a.2xlarge'] }
      ]
    },
    {
      accountAlias: 'infra-main', region: 'cn-hangzhou',
      azName: '杭州 可用区H', azCode: 'cn-hangzhou-h',
      specFamilies: [
        { family: 'ecs.g8a', desc: '通用型 g8a',
          specs: ['ecs.g8a.large', 'ecs.g8a.xlarge', 'ecs.g8a.2xlarge'] },
        { family: 'ecs.c8a', desc: '计算型 c8a',
          specs: ['ecs.c8a.large', 'ecs.c8a.xlarge'] }
      ]
    },
    {
      accountAlias: 'infra-main', region: 'cn-hangzhou',
      azName: '杭州 可用区I', azCode: 'cn-hangzhou-i',
      specFamilies: [
        { family: 'ecs.g8a', desc: '通用型 g8a',
          specs: ['ecs.g8a.large', 'ecs.g8a.xlarge'] },
        { family: 'ecs.r8a', desc: '内存型 r8a',
          specs: ['ecs.r8a.large', 'ecs.r8a.xlarge'] }
      ]
    },
    {
      accountAlias: 'biz-prod', region: 'cn-shanghai',
      azName: '上海 可用区B', azCode: 'cn-shanghai-b',
      specFamilies: [
        { family: 'ecs.g8a', desc: '通用型 g8a',
          specs: ['ecs.g8a.large', 'ecs.g8a.xlarge', 'ecs.g8a.2xlarge'] },
        { family: 'ecs.c8a', desc: '计算型 c8a',
          specs: ['ecs.c8a.large', 'ecs.c8a.xlarge'] }
      ]
    },
    {
      accountAlias: 'biz-prod', region: 'cn-shanghai',
      azName: '上海 可用区D', azCode: 'cn-shanghai-d',
      specFamilies: [
        { family: 'ecs.g8a', desc: '通用型 g8a',
          specs: ['ecs.g8a.large', 'ecs.g8a.xlarge'] },
        { family: 'ecs.r8a', desc: '内存型 r8a',
          specs: ['ecs.r8a.large', 'ecs.r8a.xlarge', 'ecs.r8a.2xlarge'] }
      ]
    }
  ]
};
```

- [ ] **Step 3：浏览器验证**

打开原型首页，打开 DevTools Console，输入：
```js
MockData.cloudAccounts.main[0].region
// 期望输出: "cn-hangzhou"
MockData.cloudResources.zones.length
// 期望输出: 5
```

- [ ] **Step 4：提交**

```bash
git add prototype/js/mock/cloud.js
git commit -m "feat(mock): add region field to main accounts and cloudResources data"
```

---

## Task 2：bind-main 弹窗新增地域字段

**Files:**
- Modify: `prototype/modals/cloud/bind-main.html`

- [ ] **Step 1：在 Step 2 的 AK Secret 表单项后插入地域字段**

在 `bind-step-2` 内，`bind-cloud-sk` 所在的 `.ant-form-item` 结束标签 `</div>` 之后、`</div><!-- end bind-step-2 -->` 之前插入：

```html
<div class="ant-form-item" style="border:1px solid #91caff;border-radius:6px;padding:10px 12px;background:#f0f7ff;">
  <div class="ant-form-label"><span class="required">*</span>默认地域</div>
  <div style="flex:1;display:flex;flex-direction:column;">
    <div class="ant-form-control">
      <select class="ant-select" id="bind-cloud-region" style="width:100%;"></select>
    </div>
    <div class="ant-form-extra">平台将从该地域自动同步可用区及 ECS 规格族信息</div>
  </div>
</div>
```

- [ ] **Step 2：浏览器验证**

进入云账号管理页，点击「关联主账号」→「下一步」，确认 Step 2 表单末尾出现蓝色边框的「默认地域」字段（此时下拉为空，下一个 Task 填充）。

- [ ] **Step 3：提交**

```bash
git add prototype/modals/cloud/bind-main.html
git commit -m "feat(modal): add region select field to bind-main step 2"
```

---

## Task 3：router.js 保存地域数据

**Files:**
- Modify: `prototype/js/pages/router.js`（`handleModalSubmit` 函数中 `cloud/bind-main` 分支）

- [ ] **Step 1：在 bind-main 提交校验中加地域校验**

找到 `handleModalSubmit` 中处理 `cloud/bind-main` 的代码段（约第 366–389 行）。

在 `if (!sk || !sk.value.trim()) { ... return; }` 之后插入：

```js
var regionSelect = document.getElementById('bind-cloud-region');
if (!regionSelect || !regionSelect.value) { showMessage('请选择默认地域', 'warning'); return; }
```

- [ ] **Step 2：在 mock 数据更新循环中保存地域**

在同一段循环体内，找到 `MockData.cloudAccounts.main[i].status = '正常';` 这一行，在其之后插入：

```js
MockData.cloudAccounts.main[i].region = regionSelect.value;
MockData.cloudAccounts.main[i].regionName = regionSelect.options[regionSelect.selectedIndex]
  ? regionSelect.options[regionSelect.selectedIndex].textContent.split(' ')[0] + '（' +
    regionSelect.options[regionSelect.selectedIndex].textContent.split('（')[1]
  : regionSelect.value;
```

注意：地域 option 的 textContent 格式为 `华东1（杭州） cn-hangzhou`，取括号前的部分会不完整。更简单的做法是直接存 option 的完整 textContent，然后 trim：

```js
MockData.cloudAccounts.main[i].region = regionSelect.value;
MockData.cloudAccounts.main[i].regionName = regionSelect.options[regionSelect.selectedIndex]
  ? regionSelect.options[regionSelect.selectedIndex].textContent.trim()
  : regionSelect.value;
```

- [ ] **Step 3：浏览器验证**

对「数据平台部」（未关联状态）操作：点击「关联主账号」→ 填入别名 `test-main`、AK ID `LTAI123`、AK Secret `secret123`、选择地域「华北2（北京）cn-beijing」→ 点击「确认关联」。

在 Console 中检查：
```js
MockData.cloudAccounts.main[2].region    // "cn-beijing"
MockData.cloudAccounts.main[2].regionName // 包含"华北2"
```

- [ ] **Step 4：提交**

```bash
git add prototype/js/pages/router.js
git commit -m "feat(router): save region when binding main cloud account"
```

---

## Task 4：cloud.html 新增「资源信息」Tab

**Files:**
- Modify: `prototype/pages/cloud.html`

- [ ] **Step 1：在 Tab 导航栏加第三个 Tab**

找到：
```html
<span class="ant-tabs-tab" data-tab-show="cloud-tab-sub" data-tab-hide="cloud-tab-main">子账号管理</span>
```
在其后插入：
```html
<span class="ant-tabs-tab" data-tab-show="cloud-tab-resource">资源信息</span>
```

（不加 `data-tab-hide`，Tab 切换逻辑完全由 cloud.js 接管）

- [ ] **Step 2：在 page-content-inner 中加第三个 Tab 内容块**

找到 `<div id="cloud-tab-sub" style="display:none;">` 对应的整个 div 结束标签 `</div>` 之后，在 `</div><!-- end page-content-inner -->` 之前插入：

```html
<div id="cloud-tab-resource" style="display:none;">
  <div class="filter-bar" style="margin-bottom:12px;align-items:center;">
    <select class="ant-select" id="cloud-res-account" style="min-width:220px;"></select>
    <select class="ant-select" id="cloud-res-region" style="min-width:190px;"></select>
    <div style="flex:1;"></div>
    <span id="cloud-res-sync-time" style="font-size:13px;color:var(--text-secondary);margin-right:8px;"></span>
    <button class="ant-btn ant-btn-sm" id="cloud-res-refresh-btn">↻ 手动刷新</button>
  </div>
  <div id="cloud-res-az-container"></div>
</div>
```

- [ ] **Step 3：浏览器验证**

刷新页面进入云账号管理，确认导航栏出现「资源信息」Tab，点击后内容区变空（filter-bar 不可见因为 JS 还未初始化），无报错。

- [ ] **Step 4：提交**

```bash
git add prototype/pages/cloud.html
git commit -m "feat(page): add resource info tab structure to cloud page"
```

---

## Task 5：cloud.js 地域常量、bind-main 回调、三 Tab 切换

**Files:**
- Modify: `prototype/js/pages/cloud.js`

- [ ] **Step 1：在文件顶部加地域常量和 initBindMainRegion 函数**

在 `'use strict';` 行之后、第一个函数定义之前插入：

```js
var ALIYUN_REGIONS = [
  { code: 'cn-hangzhou',    name: '华东1（杭州）' },
  { code: 'cn-shanghai',    name: '华东2（上海）' },
  { code: 'cn-beijing',     name: '华北2（北京）' },
  { code: 'cn-shenzhen',    name: '华南1（深圳）' },
  { code: 'cn-chengdu',     name: '西南1（成都）' },
  { code: 'cn-zhangjiakou', name: '华北3（张家口）' }
];

function initBindMainRegion() {
  var sel = document.getElementById('bind-cloud-region');
  if (!sel) return;
  sel.innerHTML = '<option value="">请选择地域</option>';
  ALIYUN_REGIONS.forEach(function (r) {
    sel.innerHTML += '<option value="' + esc(r.code) + '">' +
      esc(r.name) + ' ' + esc(r.code) + '</option>';
  });
}
```

- [ ] **Step 2：给 bind-main 按钮的 loadAndShowModal 调用加回调**

在 `initCloudPage` 中找到：
```js
mainContainer.querySelectorAll('.cloud-bind-main-btn').forEach(function (btn) {
  btn.onclick = function () {
    var dept = btn.getAttribute('data-dept');
    window._bindCloudDept = dept;
    loadAndShowModal('cloud/bind-main');
  };
});
```
改为：
```js
mainContainer.querySelectorAll('.cloud-bind-main-btn').forEach(function (btn) {
  btn.onclick = function () {
    var dept = btn.getAttribute('data-dept');
    window._bindCloudDept = dept;
    loadAndShowModal('cloud/bind-main', function () {
      initBindMainRegion();
    });
  };
});
```

- [ ] **Step 3：接管三 Tab 切换逻辑**

在 `initCloudPage` 函数中，找到以下旧的 Tab 恢复和记录代码段：
```js
// 恢复上次的 Tab 状态
if (state.cloud.activeTab === 'sub') {
  ...
}
// 记录 Tab 切换
container.querySelectorAll('.ant-tabs-tab').forEach(function (tab) {
  ...
});
```
将这整段替换为：

```js
var ALL_CLOUD_TAB_PANELS = ['cloud-tab-main', 'cloud-tab-sub', 'cloud-tab-resource'];

function showCloudTab(showId) {
  ALL_CLOUD_TAB_PANELS.forEach(function (panelId) {
    var el = document.getElementById(panelId);
    if (el) el.style.display = panelId === showId ? '' : 'none';
  });
  container.querySelectorAll('.ant-tabs-tab').forEach(function (t) {
    t.classList.toggle('active', t.getAttribute('data-tab-show') === showId);
  });
  if (showId === 'cloud-tab-sub') state.cloud.activeTab = 'sub';
  else if (showId === 'cloud-tab-resource') { state.cloud.activeTab = 'resource'; initCloudResourceTab(); }
  else state.cloud.activeTab = 'main';
}

// 恢复上次 Tab 状态
if (state.cloud.activeTab === 'sub') showCloudTab('cloud-tab-sub');
else if (state.cloud.activeTab === 'resource') showCloudTab('cloud-tab-resource');

// 接管三 Tab 切换
container.querySelectorAll('.ant-tabs-tab').forEach(function (tab) {
  tab.onclick = function () {
    showCloudTab(tab.getAttribute('data-tab-show'));
  };
});
```

> **注意：** `showCloudTab` 中调用了 `initCloudResourceTab()`，该函数在 Task 7 中添加。Task 5 完成后如点击「资源信息」Tab 会报 `initCloudResourceTab is not defined`，完成 Task 7 后恢复正常，按顺序执行任务即可。

- [ ] **Step 4：浏览器验证**

1. 进入「云账号管理」，点击「主账号管理」和「子账号管理」来回切换，确认内容区正确切换无报错。
2. 点击「资源信息」Tab，filter-bar 出现（account/region select 为空，下一个 Task 填充）。
3. 切换到「子账号管理」再切回「主账号管理」，数据正常显示。
4. 点击「关联主账号」→「下一步」，Step 2 中「默认地域」下拉已有 6 个地域选项。

- [ ] **Step 5：提交**

```bash
git add prototype/js/pages/cloud.js
git commit -m "feat(cloud): add region init for bind-main, take over 3-tab switching"
```

---

## Task 6：新建规格族弹窗 HTML

**Files:**
- Create: `prototype/modals/cloud/az-spec-families.html`

- [ ] **Step 1：创建弹窗骨架文件**

创建 `prototype/modals/cloud/az-spec-families.html`，内容：

```html
<div class="ant-modal-overlay" style="display:none;">
  <div class="ant-modal" style="width:700px;max-height:80vh;overflow-y:auto;">
    <div class="ant-modal-header">
      <span id="az-spec-title">ECS 规格族</span>
      <button class="ant-modal-close">&times;</button>
    </div>
    <div class="ant-modal-body">
      <div id="az-spec-context"
        style="background:#f5f5f5;padding:6px 12px;border-radius:4px;margin-bottom:16px;font-size:13px;color:#666;"></div>
      <div id="az-spec-body"></div>
    </div>
    <div class="ant-modal-footer">
      <button class="ant-btn" data-close-modal>关闭</button>
    </div>
  </div>
</div>
```

- [ ] **Step 2：浏览器验证（静态）**

在 DevTools Console 中执行：
```js
loadAndShowModal('cloud/az-spec-families');
```
期望：弹出空弹窗，标题「ECS 规格族」，有关闭按钮，点击关闭正常。

- [ ] **Step 3：提交**

```bash
git add prototype/modals/cloud/az-spec-families.html
git commit -m "feat(modal): add az-spec-families modal skeleton"
```

---

## Task 7：cloud.js 资源 Tab 完整逻辑

**Files:**
- Modify: `prototype/js/pages/cloud.js`

- [ ] **Step 1：在文件末尾追加三个函数**

在 `cloud.js` 文件末尾追加：

```js
// =============================================
// 资源信息 Tab
// =============================================

function initCloudResourceTab() {
  var accountSelect = document.getElementById('cloud-res-account');
  var regionSelect  = document.getElementById('cloud-res-region');
  var refreshBtn    = document.getElementById('cloud-res-refresh-btn');
  var syncTimeEl    = document.getElementById('cloud-res-sync-time');
  if (!accountSelect || !regionSelect) return;

  // 填充云账号下拉（仅已关联账号）
  accountSelect.innerHTML = '';
  var boundAccounts = MockData.cloudAccounts.main.filter(function (a) { return a.status === '正常'; });
  boundAccounts.forEach(function (a) {
    var alias = a.account.split(' ')[0];
    accountSelect.innerHTML += '<option value="' + esc(alias) + '">' +
      esc(a.dept) + ' — ' + esc(alias) + '</option>';
  });

  // 根据所选账号填充地域下拉，并默认选中该账号的 region
  function updateRegionSelect() {
    var alias = accountSelect.value;
    var acct  = null;
    for (var i = 0; i < MockData.cloudAccounts.main.length; i++) {
      if (MockData.cloudAccounts.main[i].account.split(' ')[0] === alias) {
        acct = MockData.cloudAccounts.main[i]; break;
      }
    }
    regionSelect.innerHTML = '';
    ALIYUN_REGIONS.forEach(function (r) {
      regionSelect.innerHTML += '<option value="' + esc(r.code) + '">' +
        esc(r.name) + '</option>';
    });
    if (acct && acct.region) regionSelect.value = acct.region;
    renderAzTable(alias, regionSelect.value);
  }

  accountSelect.onchange = function () { updateRegionSelect(); };
  regionSelect.onchange  = function () { renderAzTable(accountSelect.value, regionSelect.value); };

  if (refreshBtn) {
    refreshBtn.onclick = function () {
      renderAzTable(accountSelect.value, regionSelect.value);
      showMessage('可用区数据已刷新', 'success');
    };
  }

  if (syncTimeEl && MockData.cloudResources) {
    syncTimeEl.textContent = '上次同步：' + MockData.cloudResources.syncTime;
  }

  if (boundAccounts.length > 0) updateRegionSelect();
}

function renderAzTable(accountAlias, region) {
  var container = document.getElementById('cloud-res-az-container');
  if (!container) return;

  var zones = [];
  if (MockData.cloudResources && MockData.cloudResources.zones) {
    zones = MockData.cloudResources.zones.filter(function (z) {
      return z.accountAlias === accountAlias && z.region === region;
    });
  }

  if (zones.length === 0) {
    container.innerHTML = '<table class="ant-table"><thead><tr><th>可用区名称</th><th>可用区 Code</th><th>ECS 规格族</th><th>操作</th></tr></thead><tbody>' +
      '<tr><td colspan="4" style="text-align:center;color:var(--text-secondary);padding:32px;">暂无可用区数据</td></tr>' +
      '</tbody></table>';
    return;
  }

  var html = '<table class="ant-table"><thead><tr>' +
    '<th>可用区名称</th><th>可用区 Code</th><th>ECS 规格族</th><th>操作</th>' +
    '</tr></thead><tbody>';
  zones.forEach(function (z) {
    html += '<tr>';
    html += '<td>' + esc(z.azName) + '</td>';
    html += '<td><code style="background:#f5f5f5;padding:2px 6px;border-radius:3px;font-size:12px;">' +
      esc(z.azCode) + '</code></td>';
    html += '<td>' + z.specFamilies.length + ' 个规格族</td>';
    html += '<td><a class="ant-btn-link cloud-az-spec-btn" data-azcode="' + esc(z.azCode) + '"' +
      ' data-account="' + esc(accountAlias) + '" data-region="' + esc(region) + '">查看规格族</a></td>';
    html += '</tr>';
  });
  html += '</tbody></table>';
  container.innerHTML = html;

  container.querySelectorAll('.cloud-az-spec-btn').forEach(function (btn) {
    btn.onclick = function () {
      showSpecFamiliesModal(
        btn.getAttribute('data-azcode'),
        btn.getAttribute('data-account'),
        btn.getAttribute('data-region')
      );
    };
  });
}

function showSpecFamiliesModal(azCode, accountAlias, region) {
  var zone = null;
  if (MockData.cloudResources && MockData.cloudResources.zones) {
    for (var i = 0; i < MockData.cloudResources.zones.length; i++) {
      if (MockData.cloudResources.zones[i].azCode === azCode) {
        zone = MockData.cloudResources.zones[i]; break;
      }
    }
  }
  if (!zone) return;

  loadAndShowModal('cloud/az-spec-families', function () {
    var titleEl   = document.getElementById('az-spec-title');
    var contextEl = document.getElementById('az-spec-context');
    var bodyEl    = document.getElementById('az-spec-body');

    if (titleEl) titleEl.textContent = 'ECS 规格族 — ' + zone.azName + '（' + zone.azCode + '）';

    if (contextEl) {
      var regionName = region;
      ALIYUN_REGIONS.forEach(function (r) { if (r.code === region) regionName = r.name; });
      contextEl.textContent = '云账号：' + accountAlias +
        '  |  地域：' + regionName + '  |  可用区：' + azCode;
    }

    if (!bodyEl) return;
    var familyColors  = ['#e6f7ff', '#f6ffed', '#fff7e6', '#f9f0ff', '#fff1f0'];
    var borderColors  = ['#91d5ff', '#b7eb8f', '#ffd591', '#d3adf7', '#ffa39e'];
    var textColors    = ['#1890ff', '#52c41a', '#fa8c16', '#722ed1', '#f5222d'];
    var html = '';
    zone.specFamilies.forEach(function (sf, idx) {
      var ci = idx % familyColors.length;
      html += '<div style="margin-bottom:16px;">';
      html += '<div style="font-weight:500;color:#333;margin-bottom:8px;">' +
        esc(sf.family) + ' — ' + esc(sf.desc) + '</div>';
      html += '<div style="display:flex;flex-wrap:wrap;gap:6px;">';
      sf.specs.forEach(function (spec) {
        html += '<span style="background:' + familyColors[ci] +
          ';border:1px solid ' + borderColors[ci] +
          ';padding:3px 10px;border-radius:3px;font-size:12px;color:' +
          textColors[ci] + ';">' + esc(spec) + '</span>';
      });
      html += '</div></div>';
    });
    bodyEl.innerHTML = html;
  });
}
```

- [ ] **Step 2：浏览器验证 — 资源信息 Tab 完整流程**

1. 进入云账号管理 → 点击「资源信息」Tab
2. 云账号下拉显示「基础架构部 — infra-main」和「业务研发部 — biz-prod」
3. 默认选中 infra-main，地域自动选中「华东1（杭州）」
4. 表格显示 3 行可用区：cn-hangzhou-g / cn-hangzhou-h / cn-hangzhou-i
5. 右上角显示「上次同步：2026-03-27 10:30:00」
6. 点击 cn-hangzhou-g 的「查看规格族」→ 弹窗弹出，标题包含「杭州 可用区G」，显示 3 个规格族（ecs.g8a / ecs.c8a / ecs.r8a）
7. 切换云账号为 biz-prod → 地域自动切换为「华东2（上海）」→ 表格变为 2 行
8. 点击「↻ 手动刷新」→ 显示「可用区数据已刷新」成功提示

- [ ] **Step 3：浏览器验证 — bind-main 完整流程（回归）**

1. 对「数据平台部」点击「关联主账号」→「下一步」
2. Step 2 中：填写别名、AK ID、AK Secret，选择地域「华南1（深圳）cn-shenzhen」
3. 点击「确认关联」→ 成功提示，页面刷新，主账号表格显示新账号
4. 在 Console 确认：`MockData.cloudAccounts.main[2].region === 'cn-shenzhen'`

- [ ] **Step 4：提交**

```bash
git add prototype/js/pages/cloud.js
git commit -m "feat(cloud): implement resource info tab with AZ table and spec families modal"
```
