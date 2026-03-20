'use strict';
// CMP 原型 - Mock 数据层 - 基础数据（权限包 + 组织架构 + 成员）

// 权限包（从 perm-packages.json 加载，这里内联一份作为 fallback）
window.PermPackages = [];
(function () {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', 'js/perm-packages.json', false); // 同步加载保证后续引用可用
  try {
    xhr.send();
    if (xhr.status === 200) window.PermPackages = JSON.parse(xhr.responseText);
  } catch (e) { /* fallback 保持空数组 */ }
})();

window.MockData = {

  // ===== 组织架构 - 树形数据 =====
  orgs: [
    {
      id: 'dept-infra', name: '基础架构部', type: 'dept', icon: '&#128196;', memberCount: 26,
      leader: { name: '张明远', username: 'zhangmy' },
      cloudAccount: '阿里云 - infra-main (主账号)',
      matchRule: '信息技术部-基础架构部-*',
      projects: ['核心基础设施', '网络基础设施', '容灾备份系统', '监控告警平台', 'CI/CD 流水线'],
      children: [
        {
          id: 'grp-container', name: '容器平台组', type: 'group', icon: '&#128193;', memberCount: 8,
          leader: { name: '李思远', username: 'lisy' }, matchRule: '容器|docker|k8s',
          children: [
            { id: 'grp-k8s', name: 'K8s运维小组', type: 'subgroup', icon: '&#128101;', memberCount: 4, leader: { name: '陈天宇', username: 'chenty' }, matchRule: 'k8s运维', children: [] }
          ]
        },
        { id: 'grp-network', name: '网络组', type: 'group', icon: '&#128193;', memberCount: 6, leader: { name: '赵雪晴', username: 'zhaoxq' }, matchRule: '网络', children: [] },
        { id: 'grp-storage', name: '存储组', type: 'group', icon: '&#128193;', memberCount: 5, leader: { name: '孙磊', username: 'sunlei' }, matchRule: '存储', children: [] }
      ]
    },
    {
      id: 'dept-biz', name: '业务研发部', type: 'dept', icon: '&#128196;', memberCount: 42,
      leader: { name: '刘佳琪', username: 'liujq' },
      cloudAccount: '阿里云 - biz-prod (主账号)',
      matchRule: '信息技术部-业务研发部-*',
      projects: ['用户中心', '订单系统', '前端资源池'],
      children: [
        { id: 'grp-user', name: '用户服务组', type: 'group', icon: '&#128193;', memberCount: 15, leader: { name: '马丽华', username: 'malh' }, matchRule: '用户服务|用户中心', children: [] },
        { id: 'grp-order', name: '订单交易组', type: 'group', icon: '&#128193;', memberCount: 18, leader: { name: '林志强', username: 'linzq' }, matchRule: '订单|交易', children: [] },
        { id: 'grp-frontend', name: '前端组', type: 'group', icon: '&#128193;', memberCount: 9, leader: { name: '黄晓燕', username: 'huangxy' }, matchRule: '前端|frontend', children: [] }
      ]
    },
    {
      id: 'dept-data', name: '数据平台部', type: 'dept', icon: '&#128196;', memberCount: 18,
      leader: { name: '周文博', username: 'zhouwb' },
      cloudAccount: '',
      matchRule: '信息技术部-数据平台部-*',
      projects: ['数据管道'],
      children: [
        { id: 'grp-bigdata', name: '大数据组', type: 'group', icon: '&#128193;', memberCount: 10, leader: { name: '吴海波', username: 'wuhb' }, matchRule: '大数据|bigdata', children: [] },
        { id: 'grp-ai', name: 'AI算法组', type: 'group', icon: '&#128193;', memberCount: 8, leader: { name: '郑丽娟', username: 'zhenglj' }, matchRule: 'AI|算法|机器学习', children: [] }
      ]
    }
  ],

  // ===== 成员数据 =====
  members: [
    // 基础架构部
    { name: '张明远', username: 'zhangmy', orgId: 'dept-infra', orgName: '基础架构部', role: '部门负责人', joinDate: '2025/07/15 00:00:00' },
    { name: '徐文斌', username: 'xuwb', orgId: 'dept-infra', orgName: '基础架构部', role: '成员', joinDate: '2026/02/20 00:00:00' },
    { name: '程晓丹', username: 'chengxd', orgId: 'dept-infra', orgName: '基础架构部', role: '成员', joinDate: '2026/03/01 00:00:00' },
    { name: '李思远', username: 'lisy', orgId: 'grp-container', orgName: '容器平台组', role: '组长', joinDate: '2025/07/20 00:00:00' },
    { name: '王浩然', username: 'wanghr', orgId: 'grp-container', orgName: '容器平台组', role: '成员', joinDate: '2025/08/01 00:00:00' },
    { name: '赵雪晴', username: 'zhaoxq', orgId: 'grp-network', orgName: '网络组', role: '组长', joinDate: '2025/07/22 00:00:00' },
    { name: '陈天宇', username: 'chenty', orgId: 'grp-k8s', orgName: 'K8s运维小组', role: '组长', joinDate: '2025/09/10 00:00:00' },
    { name: '孙磊', username: 'sunlei', orgId: 'grp-storage', orgName: '存储组', role: '组长', joinDate: '2025/07/25 00:00:00' },
    { name: '周杰', username: 'zhouj', orgId: 'grp-container', orgName: '容器平台组', role: '成员', joinDate: '2025/08/15 00:00:00' },
    { name: '吴明辉', username: 'wumh', orgId: 'grp-container', orgName: '容器平台组', role: '成员', joinDate: '2025/09/01 00:00:00' },
    { name: '郑伟', username: 'zhengw', orgId: 'grp-k8s', orgName: 'K8s运维小组', role: '成员', joinDate: '2025/09/15 00:00:00' },
    { name: '冯思琪', username: 'fengsq', orgId: 'grp-k8s', orgName: 'K8s运维小组', role: '成员', joinDate: '2025/09/20 00:00:00' },
    { name: '蒋涛', username: 'jiangt', orgId: 'grp-network', orgName: '网络组', role: '成员', joinDate: '2025/08/10 00:00:00' },
    { name: '韩晓峰', username: 'hanxf', orgId: 'grp-network', orgName: '网络组', role: '成员', joinDate: '2025/08/20 00:00:00' },
    { name: '曹雨', username: 'caoy', orgId: 'grp-network', orgName: '网络组', role: '成员', joinDate: '2025/09/05 00:00:00' },
    { name: '邓洁', username: 'dengj', orgId: 'grp-network', orgName: '网络组', role: '成员', joinDate: '2025/10/01 00:00:00' },
    { name: '彭博文', username: 'pengbw', orgId: 'grp-storage', orgName: '存储组', role: '成员', joinDate: '2025/08/05 00:00:00' },
    { name: '宋雅静', username: 'songyj', orgId: 'grp-storage', orgName: '存储组', role: '成员', joinDate: '2025/08/18 00:00:00' },
    { name: '唐磊', username: 'tangl', orgId: 'grp-storage', orgName: '存储组', role: '成员', joinDate: '2025/09/12 00:00:00' },
    { name: '许明', username: 'xum', orgId: 'grp-container', orgName: '容器平台组', role: '成员', joinDate: '2025/10/05 00:00:00' },
    { name: '何佳', username: 'hej', orgId: 'grp-container', orgName: '容器平台组', role: '成员', joinDate: '2025/10/10 00:00:00' },
    { name: '龚志远', username: 'gongzy', orgId: 'grp-k8s', orgName: 'K8s运维小组', role: '成员', joinDate: '2025/10/15 00:00:00' },
    // 业务研发部
    { name: '刘佳琪', username: 'liujq', orgId: 'dept-biz', orgName: '业务研发部', role: '部门负责人', joinDate: '2025/07/15 00:00:00' },
    { name: '高志远', username: 'gaozy', orgId: 'dept-biz', orgName: '业务研发部', role: '成员', joinDate: '2026/02/10 00:00:00' },
    { name: '苏晓婷', username: 'suxt', orgId: 'dept-biz', orgName: '业务研发部', role: '成员', joinDate: '2026/02/25 00:00:00' },
    { name: '马丽华', username: 'malh', orgId: 'grp-user', orgName: '用户服务组', role: '组长', joinDate: '2025/07/20 00:00:00' },
    { name: '林志强', username: 'linzq', orgId: 'grp-order', orgName: '订单交易组', role: '组长', joinDate: '2025/07/22 00:00:00' },
    { name: '黄晓燕', username: 'huangxy', orgId: 'grp-frontend', orgName: '前端组', role: '组长', joinDate: '2025/08/01 00:00:00' },
    { name: '钱文涛', username: 'qianwt', orgId: 'grp-user', orgName: '用户服务组', role: '成员', joinDate: '2025/08/10 00:00:00' },
    { name: '孔明', username: 'kongm', orgId: 'grp-user', orgName: '用户服务组', role: '成员', joinDate: '2025/08/15 00:00:00' },
    { name: '叶晨', username: 'yec', orgId: 'grp-order', orgName: '订单交易组', role: '成员', joinDate: '2025/08/20 00:00:00' },
    { name: '任静', username: 'renj', orgId: 'grp-order', orgName: '订单交易组', role: '成员', joinDate: '2025/09/01 00:00:00' },
    { name: '田雨', username: 'tiany', orgId: 'grp-frontend', orgName: '前端组', role: '成员', joinDate: '2025/09/05 00:00:00' },
    { name: '罗浩', username: 'luoh', orgId: 'grp-frontend', orgName: '前端组', role: '成员', joinDate: '2025/09/10 00:00:00' },
    // 数据平台部
    { name: '周文博', username: 'zhouwb', orgId: 'dept-data', orgName: '数据平台部', role: '部门负责人', joinDate: '2025/07/18 00:00:00' },
    { name: '陆明', username: 'lum', orgId: 'dept-data', orgName: '数据平台部', role: '成员', joinDate: '2026/03/05 00:00:00' },
    { name: '吴海波', username: 'wuhb', orgId: 'grp-bigdata', orgName: '大数据组', role: '组长', joinDate: '2025/07/25 00:00:00' },
    { name: '郑丽娟', username: 'zhenglj', orgId: 'grp-ai', orgName: 'AI算法组', role: '组长', joinDate: '2025/08/01 00:00:00' },
    { name: '范学明', username: 'fanxm', orgId: 'grp-bigdata', orgName: '大数据组', role: '成员', joinDate: '2025/08/10 00:00:00' },
    { name: '曾毅', username: 'zengy', orgId: 'grp-bigdata', orgName: '大数据组', role: '成员', joinDate: '2025/08/20 00:00:00' },
    { name: '谢天赐', username: 'xietc', orgId: 'grp-ai', orgName: 'AI算法组', role: '成员', joinDate: '2025/09/01 00:00:00' },
    { name: '潘虹', username: 'panh', orgId: 'grp-ai', orgName: 'AI算法组', role: '成员', joinDate: '2025/09/15 00:00:00' },
    // 未分配部门的成员
    { name: '杨帆', username: 'yangf', orgId: 'unassigned', orgName: '未分配', role: '待分配', joinDate: '2026/03/01 00:00:00' },
    { name: '沈思琦', username: 'shensq', orgId: 'unassigned', orgName: '未分配', role: '待分配', joinDate: '2026/03/05 00:00:00' },
    { name: '贺文龙', username: 'hewl', orgId: 'unassigned', orgName: '未分配', role: '待分配', joinDate: '2026/03/08 00:00:00' },
    { name: '方瑞', username: 'fangr', orgId: 'unassigned', orgName: '未分配', role: '待分配', joinDate: '2026/03/10 00:00:00' }
  ],

  // Placeholder for data added by other files
  users: [],
  cloudAccounts: { main: [], sub: [] },
  projects: [],
  resources: [],
  resCatalog: [],
  platformTemplates: [],
  platformFlows: [],
  ungroupedResources: [],
  roles: [],
  roleModules: [],
  ticketCategories: [],
  tickets: [],
  applicationRecords: [],
  auditLogs: [],
  deptConfig: {}
};
