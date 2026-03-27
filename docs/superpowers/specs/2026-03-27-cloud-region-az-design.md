# 云账号地域与可用区功能设计

**日期：** 2026-03-27
**状态：** 已确认

---

## 背景

当前关联主账号弹窗仅采集 AccessKey 信息，未记录地域；平台也没有可用区和 ECS 规格族的查询入口。需要补充两项功能：

1. 关联云账号时指定默认地域
2. 查询云账号下指定地域的可用区列表及每个可用区的 ECS 规格族

---

## 改动一：关联主账号弹窗新增「默认地域」字段

### 位置

`modals/cloud/bind-main.html` — Step 2「填写 AccessKey」

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| 默认地域 | 下拉选择 | 是 | 列表为对应云厂商的地域列表（阿里云：华东1/华东2/华北2/华南1 等） |

- 放在 AccessKey Secret 字段下方
- 辅助说明文字：「平台将从该地域自动同步可用区及 ECS 规格族信息」
- 用蓝色边框高亮该字段区域（与现有字段区分）

### Mock 数据变更

`js/mock/cloud.js` — 主账号对象新增 `region` 字段，例如：

```js
{ dept: '基础架构部', vendor: '阿里云', account: 'infra-main (LTAI****7F2Q)',
  region: 'cn-hangzhou', regionName: '华东1（杭州）',
  bindUser: '张明远', bindTime: '2025/08/20 15:30:00', status: '正常' }
```

### 地域枚举（阿里云）

```js
[
  { code: 'cn-hangzhou',  name: '华东1（杭州）' },
  { code: 'cn-shanghai',  name: '华东2（上海）' },
  { code: 'cn-beijing',   name: '华北2（北京）' },
  { code: 'cn-shenzhen',  name: '华南1（深圳）' },
  { code: 'cn-chengdu',   name: '西南1（成都）' },
  { code: 'cn-zhangjiakou', name: '华北3（张家口）' }
]
```

---

## 改动二：云账号页新增「资源信息」Tab

### 位置

`pages/cloud.html` — 在「主账号管理 / 子账号管理」Tab 后新增第三个 Tab「资源信息」

### 页面结构

#### 筛选栏
- 云账号下拉（列出已关联的主账号，格式：「部门 — 账号别名」）
- 地域下拉（根据所选云账号的 vendor 列出对应地域列表，默认选中该账号的 `region`）
- 右侧：「上次同步：YYYY-MM-DD HH:mm:ss」文字 + 「↻ 手动刷新」按钮

#### 可用区表格

| 列 | 说明 |
|----|------|
| 可用区名称 | 如「杭州 可用区G」 |
| 可用区 Code | 如 `cn-hangzhou-g`，等宽字体显示 |
| ECS 规格族 | 显示「N 个规格族」 |
| 操作 | 「查看规格族」链接 |

#### 规格族弹窗

点击「查看规格族」后弹出 `modals/cloud/az-spec-families.html`（新建）：
- 标题：`ECS 规格族 — {可用区名称}（{可用区Code}）`
- 顶部上下文：云账号 | 地域 | 可用区
- 内容：按规格族分组，每组显示规格族名称（如 `ecs.g8a — 通用型 g8a`）及该族下的具体规格标签
- 底部：「关闭」按钮

### Mock 数据

新增 `MockData.cloudResources`（在 `js/mock/cloud.js` 中追加）：

```js
MockData.cloudResources = {
  syncTime: '2026-03-27 10:30:00',
  zones: [
    {
      accountAlias: 'infra-main',
      region: 'cn-hangzhou',
      azName: '杭州 可用区G',
      azCode: 'cn-hangzhou-g',
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
      accountAlias: 'infra-main',
      region: 'cn-hangzhou',
      azName: '杭州 可用区H',
      azCode: 'cn-hangzhou-h',
      specFamilies: [
        { family: 'ecs.g8a', desc: '通用型 g8a',
          specs: ['ecs.g8a.large', 'ecs.g8a.xlarge', 'ecs.g8a.2xlarge'] },
        { family: 'ecs.c8a', desc: '计算型 c8a',
          specs: ['ecs.c8a.large', 'ecs.c8a.xlarge'] }
      ]
    },
    {
      accountAlias: 'infra-main',
      region: 'cn-hangzhou',
      azName: '杭州 可用区I',
      azCode: 'cn-hangzhou-i',
      specFamilies: [
        { family: 'ecs.g8a', desc: '通用型 g8a',
          specs: ['ecs.g8a.large', 'ecs.g8a.xlarge'] },
        { family: 'ecs.r8a', desc: '内存型 r8a',
          specs: ['ecs.r8a.large', 'ecs.r8a.xlarge'] }
      ]
    },
    {
      accountAlias: 'biz-prod',
      region: 'cn-shanghai',
      azName: '上海 可用区B',
      azCode: 'cn-shanghai-b',
      specFamilies: [
        { family: 'ecs.g8a', desc: '通用型 g8a',
          specs: ['ecs.g8a.large', 'ecs.g8a.xlarge', 'ecs.g8a.2xlarge'] },
        { family: 'ecs.c8a', desc: '计算型 c8a',
          specs: ['ecs.c8a.large', 'ecs.c8a.xlarge'] }
      ]
    }
  ]
};
```

### JS 逻辑

`js/pages/cloud.js` 新增：
- `initCloudResourceTab()` — 初始化资源信息 Tab，绑定筛选器 change 事件
- `renderAzTable(accountAlias, region)` — 根据筛选条件渲染可用区表格
- `showSpecFamiliesModal(azCode)` — 弹出规格族弹窗

---

## 文件变更清单

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `modals/cloud/bind-main.html` | 修改 | Step 2 新增「默认地域」字段 |
| `js/mock/cloud.js` | 修改 | 主账号数据加 region/regionName；追加 cloudResources mock 数据 |
| `js/pages/cloud.js` | 修改 | 新增资源信息 Tab 初始化和渲染逻辑；bind-main 弹窗加地域下拉渲染 |
| `pages/cloud.html` | 修改 | 新增资源信息 Tab 的 HTML 结构 |
| `modals/cloud/az-spec-families.html` | 新建 | 规格族弹窗 |
