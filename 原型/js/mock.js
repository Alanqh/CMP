// CMP 原型 - Mock 数据层

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

  // ===== 用户管理数据（扩展字段） =====
  users: [
    { username: 'zhangmy', phone: '138****1001', status: '启用', createTime: '2025/07/10 10:00:00', lastLogin: '2026/03/16 09:15:00' },
    { username: 'xuwb', phone: '139****1002', status: '启用', createTime: '2026/02/18 14:00:00', lastLogin: '2026/03/15 17:30:00' },
    { username: 'chengxd', phone: '136****1003', status: '启用', createTime: '2026/02/28 09:00:00', lastLogin: '2026/03/14 11:20:00' },
    { username: 'lisy', phone: '137****1004', status: '启用', createTime: '2025/07/18 11:00:00', lastLogin: '2026/03/16 08:45:00' },
    { username: 'wanghr', phone: '135****1005', status: '启用', createTime: '2025/07/30 09:00:00', lastLogin: '2026/03/16 10:00:00' },
    { username: 'zhaoxq', phone: '138****1006', status: '启用', createTime: '2025/07/20 10:00:00', lastLogin: '2026/03/15 16:00:00' },
    { username: 'chenty', phone: '139****1007', status: '启用', createTime: '2025/09/08 09:00:00', lastLogin: '2026/03/16 09:30:00' },
    { username: 'sunlei', phone: '136****1008', status: '启用', createTime: '2025/07/23 10:00:00', lastLogin: '2026/03/14 14:20:00' },
    { username: 'zhouj', phone: '137****1009', status: '启用', createTime: '2025/08/13 09:00:00', lastLogin: '2026/03/13 18:00:00' },
    { username: 'wumh', phone: '135****1010', status: '启用', createTime: '2025/08/30 09:00:00', lastLogin: '2026/03/15 09:00:00' },
    { username: 'zhengw', phone: '138****1011', status: '启用', createTime: '2025/09/13 10:00:00', lastLogin: '2026/03/12 15:00:00' },
    { username: 'fengsq', phone: '139****1012', status: '启用', createTime: '2025/09/18 09:00:00', lastLogin: '2026/03/14 10:30:00' },
    { username: 'jiangt', phone: '136****1013', status: '启用', createTime: '2025/08/08 10:00:00', lastLogin: '2026/03/15 11:00:00' },
    { username: 'hanxf', phone: '137****1014', status: '启用', createTime: '2025/08/18 09:00:00', lastLogin: '2026/03/13 09:30:00' },
    { username: 'caoy', phone: '135****1015', status: '启用', createTime: '2025/09/03 10:00:00', lastLogin: '2026/03/11 17:00:00' },
    { username: 'dengj', phone: '138****1016', status: '禁用', createTime: '2025/09/29 09:00:00', lastLogin: '2026/01/15 10:00:00' },
    { username: 'pengbw', phone: '139****1017', status: '启用', createTime: '2025/08/03 10:00:00', lastLogin: '2026/03/15 14:00:00' },
    { username: 'songyj', phone: '136****1018', status: '启用', createTime: '2025/08/16 09:00:00', lastLogin: '2026/03/14 16:30:00' },
    { username: 'tangl', phone: '137****1019', status: '启用', createTime: '2025/09/10 10:00:00', lastLogin: '2026/03/12 11:00:00' },
    { username: 'xum', phone: '135****1020', status: '启用', createTime: '2025/10/03 09:00:00', lastLogin: '2026/03/15 08:30:00' },
    { username: 'hej', phone: '138****1021', status: '启用', createTime: '2025/10/08 10:00:00', lastLogin: '2026/03/13 14:00:00' },
    { username: 'gongzy', phone: '139****1022', status: '启用', createTime: '2025/10/13 09:00:00', lastLogin: '2026/03/11 09:00:00' },
    { username: 'liujq', phone: '136****2001', status: '启用', createTime: '2025/07/10 11:00:00', lastLogin: '2026/03/16 09:00:00' },
    { username: 'gaozy', phone: '137****2002', status: '启用', createTime: '2026/02/08 09:00:00', lastLogin: '2026/03/15 15:00:00' },
    { username: 'suxt', phone: '135****2003', status: '启用', createTime: '2026/02/23 10:00:00', lastLogin: '2026/03/14 09:00:00' },
    { username: 'malh', phone: '138****2004', status: '启用', createTime: '2025/07/18 09:00:00', lastLogin: '2026/03/16 08:30:00' },
    { username: 'linzq', phone: '139****2005', status: '启用', createTime: '2025/07/20 10:00:00', lastLogin: '2026/03/15 10:00:00' },
    { username: 'huangxy', phone: '136****2006', status: '启用', createTime: '2025/07/30 09:00:00', lastLogin: '2026/03/14 17:00:00' },
    { username: 'qianwt', phone: '137****2007', status: '启用', createTime: '2025/08/08 10:00:00', lastLogin: '2026/03/13 11:30:00' },
    { username: 'kongm', phone: '135****2008', status: '禁用', createTime: '2025/08/13 09:00:00', lastLogin: '2026/02/20 14:00:00' },
    { username: 'yec', phone: '138****2009', status: '启用', createTime: '2025/08/18 10:00:00', lastLogin: '2026/03/15 13:00:00' },
    { username: 'renj', phone: '139****2010', status: '启用', createTime: '2025/08/30 09:00:00', lastLogin: '2026/03/12 16:00:00' },
    { username: 'tiany', phone: '136****2011', status: '启用', createTime: '2025/09/03 10:00:00', lastLogin: '2026/03/14 10:00:00' },
    { username: 'luoh', phone: '137****2012', status: '启用', createTime: '2025/09/08 09:00:00', lastLogin: '2026/03/11 15:30:00' },
    { username: 'zhouwb', phone: '135****3001', status: '启用', createTime: '2025/07/15 10:00:00', lastLogin: '2026/03/16 08:00:00' },
    { username: 'lum', phone: '138****3002', status: '启用', createTime: '2026/03/03 09:00:00', lastLogin: '2026/03/15 12:00:00' },
    { username: 'wuhb', phone: '139****3003', status: '启用', createTime: '2025/07/23 10:00:00', lastLogin: '2026/03/15 09:30:00' },
    { username: 'zhenglj', phone: '136****3004', status: '启用', createTime: '2025/07/30 09:00:00', lastLogin: '2026/03/14 14:30:00' },
    { username: 'fanxm', phone: '137****3005', status: '启用', createTime: '2025/08/08 10:00:00', lastLogin: '2026/03/13 10:00:00' },
    { username: 'zengy', phone: '135****3006', status: '启用', createTime: '2025/08/18 09:00:00', lastLogin: '2026/03/12 16:30:00' },
    { username: 'xietc', phone: '138****3007', status: '启用', createTime: '2025/08/30 10:00:00', lastLogin: '2026/03/11 11:00:00' },
    { username: 'panh', phone: '139****3008', status: '启用', createTime: '2025/09/13 09:00:00', lastLogin: '2026/03/10 15:00:00' },
    { username: 'yangf', phone: '136****4001', status: '启用', createTime: '2026/02/28 10:00:00', lastLogin: '2026/03/15 14:30:00' },
    { username: 'shensq', phone: '137****4002', status: '启用', createTime: '2026/03/03 09:00:00', lastLogin: '2026/03/14 09:30:00' },
    { username: 'hewl', phone: '135****4003', status: '禁用', createTime: '2026/03/06 10:00:00', lastLogin: '2026/03/08 11:00:00' },
    { username: 'fangr', phone: '138****4004', status: '启用', createTime: '2026/03/08 09:00:00', lastLogin: '2026/03/15 16:00:00' }
  ],

  // ===== 云账号 =====
  cloudAccounts: {
    main: [
      { dept: '基础架构部', vendor: '阿里云', account: 'infra-main (LTAI****7F2Q)', bindUser: '张明远', bindTime: '2025/08/20 15:30:00', status: '正常' },
      { dept: '业务研发部', vendor: '阿里云', account: 'biz-prod (LTAI****k9Xm)', bindUser: '刘佳琪', bindTime: '2025/09/05 10:00:00', status: '正常' },
      { dept: '数据平台部', vendor: '', account: '', bindUser: '', bindTime: '', status: '未关联' }
    ],
    sub: [
      { name: 'wanghr-dev', vendor: '阿里云', ramUser: 'ram-wanghr-dev@1234567890.onaliyun.com', permPackageId: 'ecs-ops', durationType: '长期持有', createTime: '2025/10/01 09:00:00', status: '正常', statusClass: 'success', owner: '王浩然', ownerUsername: 'wanghr', mainAccount: 'infra-main (LTAI****7F2Q)', dept: '基础架构部',
        credential: { loginUrl: 'https://signin.aliyun.com/1234567890/login.htm', ramUser: 'ram-wanghr-dev@1234567890.onaliyun.com', accessKeyId: 'LTAI5t8K****wVq3', accessKeySecret: 'HxGP****9dR7' } },
      { name: 'wanghr-staging', vendor: '阿里云', ramUser: '--', permPackageId: 'mysql-manage', durationType: '临时有效（7天）', createTime: '2025/11/15 14:00:00', status: '审批中', statusClass: 'warning', owner: '王浩然', ownerUsername: 'wanghr', mainAccount: 'infra-main (LTAI****7F2Q)', dept: '基础架构部' },
      { name: 'wanghr-ops', vendor: '阿里云', ramUser: 'ram-wanghr-ops@1234567890.onaliyun.com', permPackageId: 'admin', durationType: '临时有效（30天）', createTime: '2025/12/01 10:00:00', status: '已回收', statusClass: 'default', owner: '王浩然', ownerUsername: 'wanghr', mainAccount: 'infra-main (LTAI****7F2Q)', dept: '基础架构部',
        credential: { loginUrl: 'https://signin.aliyun.com/1234567890/login.htm', ramUser: 'ram-wanghr-ops@1234567890.onaliyun.com', accessKeyId: 'LTAI5tNR****pZ8e', accessKeySecret: 'Jk3m****7xQ2' } },
      { name: 'chenty-dev', vendor: '阿里云', ramUser: 'ram-chenty-dev@1234567890.onaliyun.com', permPackageId: 'k8s-manage', durationType: '长期持有', createTime: '2025/11/01 10:00:00', status: '正常', statusClass: 'success', owner: '陈天宇', ownerUsername: 'chenty', mainAccount: 'infra-main (LTAI****7F2Q)', dept: '基础架构部',
        credential: { loginUrl: 'https://signin.aliyun.com/1234567890/login.htm', ramUser: 'ram-chenty-dev@1234567890.onaliyun.com', accessKeyId: 'LTAI5tBM****kY6w', accessKeySecret: 'Rp9x****3mNf' } },
      { name: 'lisy-admin', vendor: '阿里云', ramUser: 'ram-lisy-admin@1234567890.onaliyun.com', permPackageId: 'admin', durationType: '长期持有', createTime: '2025/09/20 08:00:00', status: '正常', statusClass: 'success', owner: '李思远', ownerUsername: 'lisy', mainAccount: 'infra-main (LTAI****7F2Q)', dept: '基础架构部',
        credential: { loginUrl: 'https://signin.aliyun.com/1234567890/login.htm', ramUser: 'ram-lisy-admin@1234567890.onaliyun.com', accessKeyId: 'LTAI5tGH****nW4d', accessKeySecret: 'Vy7k****2pLs' } },
      { name: 'linh-order', vendor: '阿里云', ramUser: 'ram-linh-order@0987654321.onaliyun.com', permPackageId: 'mysql-manage', durationType: '长期持有', createTime: '2026/01/10 10:00:00', status: '正常', statusClass: 'success', owner: '林志强', ownerUsername: 'linzq', mainAccount: 'biz-prod (LTAI****k9Xm)', dept: '业务研发部',
        credential: { loginUrl: 'https://signin.aliyun.com/0987654321/login.htm', ramUser: 'ram-linh-order@0987654321.onaliyun.com', accessKeyId: 'LTAI5tXP****rK2j', accessKeySecret: 'Nm8w****4bYc' } },
      { name: 'malh-user', vendor: '阿里云', ramUser: 'ram-malh-user@0987654321.onaliyun.com', permPackageId: 'ecs-ops', durationType: '临时有效（90天）', createTime: '2026/02/05 14:00:00', status: '已回收', statusClass: 'default', owner: '马丽华', ownerUsername: 'malh', mainAccount: 'biz-prod (LTAI****k9Xm)', dept: '业务研发部',
        credential: { loginUrl: 'https://signin.aliyun.com/0987654321/login.htm', ramUser: 'ram-malh-user@0987654321.onaliyun.com', accessKeyId: 'LTAI5tWQ****sJ3n', accessKeySecret: 'Pb6v****2cZd' } }
    ]
  },

  // ===== 项目 =====
  projects: [
    { name: '核心基础设施', desc: '基础架构核心服务资源集合', dept: '基础架构部', creator: '张明远', resourceCount: 42, createTime: '2025/08/10 09:00:00' },
    { name: '网络基础设施', desc: '网络层核心资源', dept: '基础架构部', creator: '张明远', resourceCount: 18, createTime: '2025/08/10 09:30:00' },
    { name: '用户中心', desc: '用户服务全链路资源', dept: '业务研发部', creator: '刘佳琪', resourceCount: 35, createTime: '2025/09/01 10:00:00' },
    { name: '订单系统', desc: '订单交易核心服务', dept: '业务研发部', creator: '刘佳琪', resourceCount: 22, createTime: '2025/09/15 11:00:00' },
    { name: '数据管道', desc: '数据采集与处理管道', dept: '数据平台部', creator: '周文博', resourceCount: 11, createTime: '2025/10/01 09:00:00' },
    { name: '前端资源池', desc: '前端静态资源与CDN', dept: '业务研发部', creator: '刘佳琪', resourceCount: 5, createTime: '2025/11/01 14:00:00' }
  ],

  // ===== 资源 =====
  resources: [
    { name: 'ecs-prod-web-01', resId: 'i-bp1a2b3c4d5e6f', type: 'ECS', typeColor: 'blue', shape: '实例型', group: '容器平台组', groupId: 'grp-container', project: '核心基础设施', perm: 'master', permColor: 'green', status: '运行中', statusClass: 'success', applicant: '王浩然', authorizations: [
      { user: '张明远', perm: 'developer', time: '2025/10/12 14:30' },
      { user: '李思涵', perm: 'reporter', time: '2025/11/05 09:15' }
    ], children: [
      { name: 'disk-prod-web-01-sys', resId: 'd-bp1a2b3c4d', type: '云硬盘', typeColor: 'blue', shape: '子资源', parentRes: 'ecs-prod-web-01', status: '使用中', statusClass: 'success' },
      { name: 'eip-prod-web-01', resId: 'eip-bp1x2y3z4w', type: '弹性IP', typeColor: 'blue', shape: '子资源', parentRes: 'ecs-prod-web-01', status: '已绑定', statusClass: 'success' }
    ] },
    { name: 'rds-prod-mysql-01', resId: 'rm-bp1x2y3z4w5v', type: 'RDS', typeColor: 'orange', shape: '实例型', group: '容器平台组', groupId: 'grp-container', project: '核心基础设施', perm: 'master', permColor: 'green', status: '运行中', statusClass: 'success', applicant: '王浩然', authorizations: [
      { user: '赵天宇', perm: 'developer', time: '2025/10/20 16:00' }
    ], children: [
      { name: 'db_production', resId: 'db-prod-01', type: '数据库', typeColor: 'orange', shape: '子资源', parentRes: 'rds-prod-mysql-01', status: '正常', statusClass: 'success' },
      { name: 'rds_admin', resId: 'acc-rds-admin', type: '账号', typeColor: 'orange', shape: '子资源', parentRes: 'rds-prod-mysql-01', status: '正常', statusClass: 'success' }
    ] },
    { name: 'redis-prod-cache-01', resId: 'r-bp6a7b8c9d0e', type: 'Redis', typeColor: 'red', shape: '实例型', group: '容器平台组', groupId: 'grp-container', project: '核心基础设施', perm: 'developer', permColor: 'cyan', status: '运行中', statusClass: 'success' },
    { name: 'slb-prod-api-gw', resId: 'lb-bp1m2n3o4p5q', type: 'SLB', typeColor: 'cyan', shape: '实例型', group: '网络组', groupId: 'grp-network', project: '网络基础设施', perm: 'reporter', permColor: 'default', status: '运行中', statusClass: 'success' },
    { name: 'kafka-prod-msg-01', resId: 'alikafka_post-cn-v0h1a2b3', type: 'Kafka', typeColor: 'purple', shape: '实例型', group: '容器平台组', groupId: 'grp-container', project: '核心基础设施', perm: 'developer', permColor: 'cyan', status: '运行中', statusClass: 'success', children: [
      { name: 'topic-order-events', resId: 'topic-order-evt', type: 'Topic', typeColor: 'purple', shape: '子资源', parentRes: 'kafka-prod-msg-01', status: '正常', statusClass: 'success' },
      { name: 'topic-user-logs', resId: 'topic-user-log', type: 'Topic', typeColor: 'purple', shape: '子资源', parentRes: 'kafka-prod-msg-01', status: '正常', statusClass: 'success' }
    ] },
    { name: 'es-prod-log-cluster', resId: 'es-cn-x1y2z3a4b5', type: 'ES', typeColor: 'green', shape: '集群型', group: '存储组', groupId: 'grp-storage', project: '核心基础设施', perm: 'developer', permColor: 'cyan', status: '运行中', statusClass: 'success' },
    { name: 'oss-prod-static', resId: 'infra-static-assets', type: 'OSS', typeColor: 'default', shape: '实例型', group: '容器平台组', groupId: 'grp-container', project: '核心基础设施', perm: 'master', permColor: 'green', status: '正常', statusClass: 'success' },
    { name: 'ecs-staging-app-01', resId: 'i-bp9x8y7z6w5v', type: 'ECS', typeColor: 'blue', shape: '实例型', group: '容器平台组', groupId: 'grp-container', project: '核心基础设施', perm: 'developer', permColor: 'cyan', status: '变配中', statusClass: 'processing' },
    { name: 'ecs-prod-web-02', resId: 'i-bp2c3d4e5f6g', type: 'ECS', typeColor: 'blue', shape: '实例型', group: '容器平台组', groupId: 'grp-container', project: '核心基础设施', perm: 'master', permColor: 'green', status: '运行中', statusClass: 'success' },
    { name: 'ecs-prod-web-03', resId: 'i-bp3d4e5f6g7h', type: 'ECS', typeColor: 'blue', shape: '实例型', group: '容器平台组', groupId: 'grp-container', project: '核心基础设施', perm: 'developer', permColor: 'cyan', status: '运行中', statusClass: 'success' },
    { name: 'rds-prod-mysql-02', resId: 'rm-bp2y3z4w5v6x', type: 'RDS', typeColor: 'orange', shape: '实例型', group: '容器平台组', groupId: 'grp-container', project: '核心基础设施', perm: 'developer', permColor: 'cyan', status: '运行中', statusClass: 'success' },
    { name: 'slb-prod-internal', resId: 'lb-bp2n3o4p5q6r', type: 'SLB', typeColor: 'cyan', shape: '实例型', group: '网络组', groupId: 'grp-network', project: '网络基础设施', perm: 'developer', permColor: 'cyan', status: '运行中', statusClass: 'success' },
    { name: 'ecs-user-api-01', resId: 'i-bp4e5f6g7h8i', type: 'ECS', typeColor: 'blue', shape: '实例型', group: '用户服务组', groupId: 'grp-user', project: '用户中心', perm: 'master', permColor: 'green', status: '运行中', statusClass: 'success', applicant: '刘佳琪', authorizations: [
      { user: '王浩然', perm: 'developer', time: '2025/12/01 10:30' }
    ] },
    { name: 'rds-user-mysql', resId: 'rm-bp3z4w5v6x7y', type: 'RDS', typeColor: 'orange', shape: '实例型', group: '用户服务组', groupId: 'grp-user', project: '用户中心', perm: 'master', permColor: 'green', status: '运行中', statusClass: 'success', applicant: '刘佳琪', authorizations: [] },
    { name: 'redis-user-session', resId: 'r-bp7b8c9d0e1f', type: 'Redis', typeColor: 'red', shape: '实例型', group: '用户服务组', groupId: 'grp-user', project: '用户中心', perm: 'developer', permColor: 'cyan', status: '运行中', statusClass: 'success' },
    { name: 'ecs-order-api-01', resId: 'i-bp5f6g7h8i9j', type: 'ECS', typeColor: 'blue', shape: '实例型', group: '订单交易组', groupId: 'grp-order', project: '订单系统', perm: 'master', permColor: 'green', status: '运行中', statusClass: 'success', applicant: '陈晓峰', authorizations: [
      { user: '李思涵', perm: 'developer', time: '2026/01/15 11:00' }
    ] },
    { name: 'rds-order-mysql', resId: 'rm-bp4w5v6x7y8z', type: 'RDS', typeColor: 'orange', shape: '实例型', group: '订单交易组', groupId: 'grp-order', project: '订单系统', perm: 'master', permColor: 'green', status: '运行中', statusClass: 'success' },
    { name: 'kafka-order-msg', resId: 'alikafka_post-cn-w1h2a3b4', type: 'Kafka', typeColor: 'purple', shape: '实例型', group: '订单交易组', groupId: 'grp-order', project: '订单系统', perm: 'developer', permColor: 'cyan', status: '运行中', statusClass: 'success' },
    { name: 'es-data-analytics', resId: 'es-cn-y2z3a4b5c6', type: 'ES', typeColor: 'green', shape: '集群型', group: '大数据组', groupId: 'grp-bigdata', project: '数据管道', perm: 'master', permColor: 'green', status: '运行中', statusClass: 'success' },
    { name: 'kafka-data-pipeline', resId: 'alikafka_post-cn-x2h3a4b5', type: 'Kafka', typeColor: 'purple', shape: '实例型', group: '大数据组', groupId: 'grp-bigdata', project: '数据管道', perm: 'developer', permColor: 'cyan', status: '运行中', statusClass: 'success' },
    { name: 'oss-data-lake', resId: 'data-lake-prod', type: 'OSS', typeColor: 'default', shape: '实例型', group: '大数据组', groupId: 'grp-bigdata', project: '数据管道', perm: 'master', permColor: 'green', status: '正常', statusClass: 'success' },
    { name: 'ecs-frontend-cdn', resId: 'i-bp6g7h8i9j0k', type: 'ECS', typeColor: 'blue', shape: '实例型', group: '前端组', groupId: 'grp-frontend', project: '前端资源池', perm: 'developer', permColor: 'cyan', status: '运行中', statusClass: 'success' },
    { name: 'oss-frontend-static', resId: 'frontend-static-prod', type: 'OSS', typeColor: 'default', shape: '实例型', group: '前端组', groupId: 'grp-frontend', project: '前端资源池', perm: 'master', permColor: 'green', status: '正常', statusClass: 'success' },
    { name: 'cdn-frontend-pack', resId: 'cdnpack-2026-q1', type: 'CDN', typeColor: 'purple', shape: '资源包', group: '前端组', groupId: 'grp-frontend', project: '前端资源池', perm: 'reporter', permColor: 'default', status: '使用中', statusClass: 'success', monthlyCost: '3,200.00', packExpire: '2026/06/30' },
    { name: 'maxcompute-data-pack', resId: 'mcpack-2026-annual', type: 'MaxCompute', typeColor: 'green', shape: '资源包', group: '大数据组', groupId: 'grp-bigdata', project: '数据管道', perm: 'developer', permColor: 'cyan', status: '使用中', statusClass: 'success', monthlyCost: '8,500.00', packExpire: '2026/12/31' }
  ],

  // ===== 资源目录 =====
  resCatalog: [
    { name: '计算类', color: '#1890ff', types: [
      { name: 'ECS 云服务器', vendor: '阿里云', queryApi: 'DescribeInstances', operations: ['申请', '变配', '扩容', '重启', '销毁'], approvalOps: ['申请', '变配', '扩容', '销毁'], allowApply: true, allowDisplay: true, children: [
        { name: '云硬盘', queryApi: 'DescribeDisks', operations: ['申请', '扩容'], approvalOps: ['申请', '扩容'], allowApply: true, allowDisplay: true },
        { name: '弹性IP', queryApi: 'DescribeEipAddresses', operations: ['申请', '销毁'], approvalOps: ['申请', '销毁'], allowApply: true, allowDisplay: true }
      ]},
      { name: 'K8S 集群', vendor: '阿里云', queryApi: 'DescribeClusters', operations: ['同步', '申请', '扩容', '缩容', '销毁'], approvalOps: ['申请', '扩容', '缩容', '销毁'], allowApply: true, allowDisplay: true, children: [
        { name: 'Namespace', queryApi: 'DescribeNamespaces', operations: ['申请', '销毁'], approvalOps: ['申请'], allowApply: true, allowDisplay: true }
      ]}
    ]},
    { name: '数据库类', color: '#1890ff', types: [
      { name: 'RDS 云数据库', vendor: '阿里云', queryApi: 'DescribeDBInstances', operations: ['申请', '变配', '销毁'], approvalOps: ['申请', '变配', '销毁'], allowApply: true, allowDisplay: true, children: [
        { name: '数据库', queryApi: 'DescribeDatabases', operations: ['申请', '销毁'], approvalOps: ['申请'], allowApply: true, allowDisplay: true },
        { name: '账号', queryApi: 'DescribeAccounts', operations: ['申请', '销毁'], approvalOps: ['申请'], allowApply: true, allowDisplay: true }
      ]},
      { name: 'PolarDB PostgreSQL', vendor: '阿里云', queryApi: 'DescribeDBClusters', operations: ['申请', '变配', '销毁'], approvalOps: ['申请', '变配', '销毁'], allowApply: true, allowDisplay: true, children: [
        { name: '数据库', queryApi: 'DescribeDatabases', operations: ['申请', '销毁'], approvalOps: ['申请'], allowApply: true, allowDisplay: true },
        { name: '账号', queryApi: 'DescribeAccounts', operations: ['申请', '销毁'], approvalOps: ['申请'], allowApply: true, allowDisplay: true }
      ]},
      { name: 'MongoDB', vendor: '阿里云', queryApi: 'DescribeDBInstances', operations: ['申请', '变配', '销毁'], approvalOps: ['申请', '变配', '销毁'], allowApply: true, allowDisplay: true, children: [
        { name: '数据库', queryApi: 'DescribeDatabases', operations: ['申请', '销毁'], approvalOps: ['申请'], allowApply: true, allowDisplay: true }
      ]},
      { name: 'Redis 缓存', vendor: '阿里云', queryApi: 'DescribeInstances', operations: ['申请', '变配', '销毁'], approvalOps: ['申请', '变配', '销毁'], allowApply: true, allowDisplay: true, children: [] }
    ]},
    { name: '网络与负载均衡类', color: '#1890ff', types: [
      { name: 'SLB 负载均衡', vendor: '阿里云', queryApi: 'DescribeLoadBalancers', operations: ['申请', '变配', '销毁'], approvalOps: ['申请', '变配', '销毁'], allowApply: true, allowDisplay: true, children: [] },
      { name: 'ALB 应用负载均衡', vendor: '阿里云', queryApi: 'DescribeLoadBalancers', operations: ['申请', '变配', '销毁'], approvalOps: ['申请', '变配', '销毁'], allowApply: true, allowDisplay: true, children: [] },
      { name: 'NLB 网络负载均衡', vendor: '阿里云', queryApi: 'DescribeLoadBalancers', operations: ['申请', '变配', '销毁'], approvalOps: ['申请', '变配', '销毁'], allowApply: true, allowDisplay: true, children: [] },
      { name: '云原生网关', vendor: '阿里云', queryApi: 'DescribeGateways', operations: ['申请', '变配', '销毁'], approvalOps: ['申请', '变配', '销毁'], allowApply: true, allowDisplay: true, children: [] }
    ]},
    { name: '中间件类', color: '#1890ff', types: [
      { name: 'Kafka 消息队列', vendor: '阿里云', queryApi: 'GetInstanceList', operations: ['申请', '变配', '销毁'], approvalOps: ['申请', '变配', '销毁'], allowApply: true, allowDisplay: true, children: [
        { name: 'Topic', queryApi: 'GetTopicList', operations: ['申请', '销毁'], approvalOps: ['申请'], allowApply: true, allowDisplay: true }
      ]}
    ]},
    { name: '大数据与搜索分析类', color: '#1890ff', types: [
      { name: 'Elasticsearch', vendor: '阿里云', queryApi: 'ListInstance', operations: ['申请', '扩容', '缩容', '销毁'], approvalOps: ['申请', '扩容', '缩容', '销毁'], allowApply: true, allowDisplay: true, children: [
        { name: '索引', queryApi: 'ListSearchIndex', operations: ['申请', '销毁'], approvalOps: ['申请'], allowApply: true, allowDisplay: true }
      ]},
      { name: 'MaxCompute', vendor: '阿里云', queryApi: 'ListProjects', operations: ['申请', '续费'], approvalOps: ['申请', '续费'], allowApply: true, allowDisplay: true, children: [] },
      { name: 'Flink 实时计算', vendor: '阿里云', queryApi: 'ListWorkspaces', operations: ['申请', '变配', '销毁'], approvalOps: ['申请', '变配', '销毁'], allowApply: true, allowDisplay: true, children: [] },
      { name: '实时数仓 Hologres', vendor: '阿里云', queryApi: 'ListInstances', operations: ['申请', '变配', '销毁'], approvalOps: ['申请', '变配', '销毁'], allowApply: true, allowDisplay: true, children: [] }
    ]},
    { name: '存储类', color: '#1890ff', types: [
      { name: 'OSS 对象存储', vendor: '阿里云', queryApi: 'ListBuckets', operations: ['申请', '销毁'], approvalOps: ['申请', '销毁'], allowApply: true, allowDisplay: true, children: [] },
      { name: '块存储 ESSD', vendor: '阿里云', queryApi: 'DescribeDisks', operations: ['申请', '扩容', '销毁'], approvalOps: ['申请', '扩容', '销毁'], allowApply: true, allowDisplay: true, children: [] },
      { name: '文件存储 NAS', vendor: '阿里云', queryApi: 'DescribeFileSystems', operations: ['申请', '扩容', '销毁'], approvalOps: ['申请', '扩容', '销毁'], allowApply: true, allowDisplay: true, children: [] },
      { name: 'CDN 流量包', vendor: '阿里云', queryApi: 'DescribeUserDomains', operations: ['申请', '续费'], approvalOps: ['申请', '续费'], allowApply: true, allowDisplay: true, children: [] }
    ]},
    { name: '网络基础类', color: '#faad14', types: [
      { name: 'VPC 专有网络', vendor: '阿里云', queryApi: 'DescribeVpcs', operations: ['同步'], approvalOps: [], allowApply: false, allowDisplay: true, children: [] },
      { name: 'NAT 网关', vendor: '阿里云', queryApi: 'DescribeNatGateways', operations: ['同步'], approvalOps: [], allowApply: false, allowDisplay: true, children: [] },
      { name: '交换机 VSwitch', vendor: '阿里云', queryApi: 'DescribeVSwitches', operations: ['同步'], approvalOps: [], allowApply: false, allowDisplay: true, children: [] },
      { name: '安全组', vendor: '阿里云', queryApi: 'DescribeSecurityGroups', operations: ['同步'], approvalOps: [], allowApply: false, allowDisplay: true, children: [] }
    ]}
  ],

  // ===== 平台级申请表单模板 =====
  platformTemplates: [
    { id: 'ptpl-1', templateName: 'ECS申请模板', resType: 'ECS 云服务器', category: '计算类', opType: '申请', apiEndpoint: 'RunInstances', updateTime: '2025/11/20', fieldGroups: [
      { groupName: '基础配置', fields: [
        { name: '实例名称', param: 'InstanceName', type: 'string', visible: true, required: true, regex: '' },
        { name: '地域', param: 'RegionId', type: 'select', visible: true, required: true, options: '华北2（北京）,华东1（杭州）,华东2（上海）,华南1（深圳）' },
        { name: '可用区', param: 'ZoneId', type: 'select', visible: true, required: true, options: '可用区A,可用区B,可用区C,可用区H' },
        { name: '实例规格', param: 'InstanceType', type: 'select', visible: true, required: true, options: 'ecs.c7.large,ecs.c7.xlarge,ecs.c7.2xlarge,ecs.g7.2xlarge' }
      ]},
      { groupName: '存储配置', fields: [
        { name: '系统盘类型', param: 'SystemDisk.Category', type: 'select', visible: true, required: true, options: 'ESSD 云盘,高效云盘,SSD 云盘' },
        { name: '系统盘大小(GB)', param: 'SystemDisk.Size', type: 'number', visible: true, required: true, min: 20, max: 500, decimals: 0 },
        { name: '数据盘类型', param: 'DataDisk.1.Category', type: 'select', visible: true, required: false, options: 'ESSD 云盘,高效云盘,SSD 云盘' },
        { name: '数据盘大小(GB)', param: 'DataDisk.1.Size', type: 'number', visible: true, required: false, min: 20, max: 32768, decimals: 0 }
      ]},
      { groupName: '网络配置', fields: [
        { name: 'VPC', param: 'VpcId', type: 'select', visible: true, required: true, options: 'vpc-prod-beijing,vpc-prod-hangzhou' },
        { name: '交换机', param: 'VSwitchId', type: 'select', visible: true, required: true, options: 'vsw-prod-app,vsw-prod-db' },
        { name: '安全组', param: 'SecurityGroupId', type: 'select', visible: true, required: true, options: 'sg-prod-web,sg-prod-app,sg-prod-internal' }
      ]},
      { groupName: '其他', fields: [
        { name: '镜像', param: 'ImageId', type: 'select', visible: true, required: true, options: 'CentOS 7.9 64位,Alibaba Cloud Linux 3,Ubuntu 22.04 64位' },
        { name: '计费方式', param: 'InstanceChargeType', type: 'select', visible: true, required: true, options: '包年包月,按量付费' },
        { name: '购买数量', param: 'Amount', type: 'number', visible: true, required: true, min: 1, max: 100, decimals: 0 },
        { name: '用途说明', param: '_description', type: 'textarea', visible: true, required: false }
      ]}
    ]},
    { id: 'ptpl-2', templateName: 'ECS变配模板', resType: 'ECS 云服务器', category: '计算类', opType: '变配', apiEndpoint: 'ModifyInstanceSpec', updateTime: '2025/11/20', fieldGroups: [
      { groupName: '变配参数', fields: [
        { name: '目标实例规格', param: 'InstanceType', type: 'select', visible: true, required: true, options: 'ecs.c7.large,ecs.c7.xlarge,ecs.c7.2xlarge,ecs.g7.2xlarge' },
        { name: '变配原因', param: '_description', type: 'textarea', visible: true, required: false }
      ]}
    ]},
    { id: 'ptpl-3', templateName: 'ECS扩容模板', resType: 'ECS 云服务器', category: '计算类', opType: '扩容', apiEndpoint: 'ResizeDisk', updateTime: '2025/12/01', fieldGroups: [
      { groupName: '扩容参数', fields: [
        { name: '磁盘类型', param: 'DiskCategory', type: 'select', visible: true, required: true, options: 'ESSD 云盘,高效云盘,SSD 云盘' },
        { name: '目标大小(GB)', param: 'NewSize', type: 'number', visible: true, required: true, min: 20, max: 32768, decimals: 0 },
        { name: '扩容原因', param: '_description', type: 'textarea', visible: true, required: false }
      ]}
    ]},
    { id: 'ptpl-4', templateName: 'K8S集群申请模板', resType: 'K8S 集群', category: '计算类', opType: '申请', apiEndpoint: 'CreateCluster', updateTime: '2025/12/15', fieldGroups: [
      { groupName: '集群配置', fields: [
        { name: '集群名称', param: 'ClusterName', type: 'string', visible: true, required: true, regex: '^[a-zA-Z][a-zA-Z0-9_-]*$' },
        { name: '地域', param: 'RegionId', type: 'select', visible: true, required: true, options: '华北2（北京）,华东1（杭州）,华东2（上海）' },
        { name: 'K8S版本', param: 'KubernetesVersion', type: 'select', visible: true, required: true, options: '1.26,1.28,1.30' },
        { name: '节点规格', param: 'WorkerInstanceType', type: 'select', visible: true, required: true, options: 'ecs.c7.xlarge,ecs.c7.2xlarge,ecs.g7.2xlarge' },
        { name: '节点数量', param: 'NumOfNodes', type: 'number', visible: true, required: true, min: 1, max: 100, decimals: 0 }
      ]},
      { groupName: '网络配置', fields: [
        { name: 'VPC', param: 'VpcId', type: 'select', visible: true, required: true, options: 'vpc-prod-beijing,vpc-prod-hangzhou' },
        { name: 'Pod CIDR', param: 'ContainerCidr', type: 'string', visible: true, required: true, regex: '^\\d+\\.\\d+\\.\\d+\\.\\d+/\\d+$' },
        { name: 'Service CIDR', param: 'ServiceCidr', type: 'string', visible: true, required: true, regex: '^\\d+\\.\\d+\\.\\d+\\.\\d+/\\d+$' }
      ]}
    ]},
    { id: 'ptpl-5', templateName: 'RDS申请模板', resType: 'RDS 云数据库', category: '数据库类', opType: '申请', apiEndpoint: 'CreateDBInstance', updateTime: '2025/12/01', fieldGroups: [
      { groupName: '实例配置', fields: [
        { name: '实例名称', param: 'DBInstanceDescription', type: 'string', visible: true, required: true, regex: '' },
        { name: '数据库引擎', param: 'Engine', type: 'select', visible: true, required: true, options: 'MySQL,PostgreSQL,SQL Server,MariaDB' },
        { name: '引擎版本', param: 'EngineVersion', type: 'select', visible: true, required: true, options: '5.7,8.0,8.4' },
        { name: '实例规格', param: 'DBInstanceClass', type: 'select', visible: true, required: true, options: 'rds.mysql.s2.large,rds.mysql.s3.large,rds.mysql.m1.medium' },
        { name: '存储空间(GB)', param: 'DBInstanceStorage', type: 'number', visible: true, required: true, min: 20, max: 6000, decimals: 0 }
      ]},
      { groupName: '网络与安全', fields: [
        { name: '地域', param: 'RegionId', type: 'select', visible: true, required: true, options: '华北2（北京）,华东1（杭州）,华东2（上海）' },
        { name: 'VPC', param: 'VPCId', type: 'select', visible: true, required: true, options: 'vpc-prod-beijing,vpc-prod-hangzhou' },
        { name: '交换机', param: 'VSwitchId', type: 'select', visible: true, required: true, options: 'vsw-prod-db,vsw-prod-app' }
      ]},
      { groupName: '其他', fields: [
        { name: '计费方式', param: 'PayType', type: 'select', visible: true, required: true, options: '包年包月,按量付费' },
        { name: '用途说明', param: '_description', type: 'textarea', visible: true, required: false }
      ]}
    ]},
    { id: 'ptpl-6', templateName: 'RDS二次申请模板', resType: 'RDS 云数据库', category: '数据库类', opType: '二次申请（数据库/账号）', apiEndpoint: 'CreateDatabase / CreateAccount', updateTime: '2025/12/05', fieldGroups: [
      { groupName: '申请参数', fields: [
        { name: '操作类型', param: '_subOpType', type: 'select', visible: true, required: true, options: '创建数据库,创建账号' },
        { name: '数据库/账号名称', param: 'DBName', type: 'string', visible: true, required: true, regex: '^[a-zA-Z][a-zA-Z0-9_]*$' },
        { name: '字符集', param: 'CharacterSetName', type: 'select', visible: true, required: true, options: 'utf8,utf8mb4,latin1,gbk' },
        { name: '账号权限', param: 'AccountPrivilege', type: 'select', visible: true, required: true, options: 'ReadOnly,ReadWrite,DDLOnly,DMLOnly' }
      ]}
    ]},
    { id: 'ptpl-7', templateName: 'PolarDB申请模板', resType: 'PolarDB PostgreSQL', category: '数据库类', opType: '申请', apiEndpoint: 'CreateDBCluster', updateTime: '2025/12/10', fieldGroups: [
      { groupName: '集群配置', fields: [
        { name: '集群名称', param: 'DBClusterDescription', type: 'string', visible: true, required: true, regex: '' },
        { name: '地域', param: 'RegionId', type: 'select', visible: true, required: true, options: '华北2（北京）,华东1（杭州）,华东2（上海）' },
        { name: '节点规格', param: 'DBNodeClass', type: 'select', visible: true, required: true, options: 'polar.pg.x4.medium,polar.pg.x4.large,polar.pg.x8.xlarge' },
        { name: '节点数量', param: 'Amount', type: 'number', visible: true, required: true, min: 1, max: 16, decimals: 0 }
      ]}
    ]},
    { id: 'ptpl-8', templateName: 'MongoDB申请模板', resType: 'MongoDB', category: '数据库类', opType: '申请', apiEndpoint: 'CreateDBInstance', updateTime: '2025/12/10', fieldGroups: [
      { groupName: '实例配置', fields: [
        { name: '实例名称', param: 'DBInstanceDescription', type: 'string', visible: true, required: true, regex: '' },
        { name: '地域', param: 'RegionId', type: 'select', visible: true, required: true, options: '华北2（北京）,华东1（杭州）,华东2（上海）' },
        { name: '实例规格', param: 'DBInstanceClass', type: 'select', visible: true, required: true, options: 'dds.mongo.mid,dds.mongo.standard,dds.mongo.large' },
        { name: '存储空间(GB)', param: 'DBInstanceStorage', type: 'number', visible: true, required: true, min: 10, max: 3000, decimals: 0 }
      ]}
    ]},
    { id: 'ptpl-9', templateName: 'Redis申请模板', resType: 'Redis 缓存', category: '数据库类', opType: '申请', apiEndpoint: 'CreateInstance', updateTime: '2025/12/05', fieldGroups: [
      { groupName: '实例配置', fields: [
        { name: '实例名称', param: 'InstanceName', type: 'string', visible: true, required: true, regex: '' },
        { name: '地域', param: 'RegionId', type: 'select', visible: true, required: true, options: '华北2（北京）,华东1（杭州）,华东2（上海）' },
        { name: '引擎版本', param: 'EngineVersion', type: 'select', visible: true, required: true, options: '5.0,6.0,7.0' },
        { name: '实例规格', param: 'InstanceClass', type: 'select', visible: true, required: true, options: 'redis.master.small,redis.master.mid,redis.master.large' }
      ]},
      { groupName: '网络', fields: [
        { name: 'VPC', param: 'VpcId', type: 'select', visible: true, required: true, options: 'vpc-prod-beijing,vpc-prod-hangzhou' },
        { name: '交换机', param: 'VSwitchId', type: 'select', visible: true, required: true, options: 'vsw-prod-app,vsw-prod-db' }
      ]}
    ]},
    { id: 'ptpl-10', templateName: 'SLB申请模板', resType: 'SLB 负载均衡', category: '网络与负载均衡类', opType: '申请', apiEndpoint: 'CreateLoadBalancer', updateTime: '2025/12/08', fieldGroups: [
      { groupName: '基础配置', fields: [
        { name: '实例名称', param: 'LoadBalancerName', type: 'string', visible: true, required: true, regex: '' },
        { name: '地域', param: 'RegionId', type: 'select', visible: true, required: true, options: '华北2（北京）,华东1（杭州）,华东2（上海）' },
        { name: '网络类型', param: 'AddressType', type: 'select', visible: true, required: true, options: 'internet,intranet' },
        { name: '规格', param: 'LoadBalancerSpec', type: 'select', visible: true, required: true, options: 'slb.s1.small,slb.s2.small,slb.s3.small' }
      ]}
    ]},
    { id: 'ptpl-11', templateName: 'ALB申请模板', resType: 'ALB 应用负载均衡', category: '网络与负载均衡类', opType: '申请', apiEndpoint: 'CreateLoadBalancer', updateTime: '2025/12/08', fieldGroups: [
      { groupName: '基础配置', fields: [
        { name: '实例名称', param: 'LoadBalancerName', type: 'string', visible: true, required: true, regex: '' },
        { name: '地域', param: 'RegionId', type: 'select', visible: true, required: true, options: '华北2（北京）,华东1（杭州）,华东2（上海）' },
        { name: 'VPC', param: 'VpcId', type: 'select', visible: true, required: true, options: 'vpc-prod-beijing,vpc-prod-hangzhou' }
      ]}
    ]},
    { id: 'ptpl-12', templateName: 'NLB申请模板', resType: 'NLB 网络负载均衡', category: '网络与负载均衡类', opType: '申请', apiEndpoint: 'CreateLoadBalancer', updateTime: '2025/12/08', fieldGroups: [
      { groupName: '基础配置', fields: [
        { name: '实例名称', param: 'LoadBalancerName', type: 'string', visible: true, required: true, regex: '' },
        { name: '地域', param: 'RegionId', type: 'select', visible: true, required: true, options: '华北2（北京）,华东1（杭州）,华东2（上海）' },
        { name: 'VPC', param: 'VpcId', type: 'select', visible: true, required: true, options: 'vpc-prod-beijing,vpc-prod-hangzhou' }
      ]}
    ]},
    { id: 'ptpl-13', templateName: '云原生网关申请模板', resType: '云原生网关', category: '网络与负载均衡类', opType: '申请', apiEndpoint: 'CreateGateway', updateTime: '2025/12/08', fieldGroups: [
      { groupName: '基础配置', fields: [
        { name: '网关名称', param: 'GatewayName', type: 'string', visible: true, required: true, regex: '' },
        { name: '地域', param: 'RegionId', type: 'select', visible: true, required: true, options: '华北2（北京）,华东1（杭州）,华东2（上海）' },
        { name: '规格', param: 'Spec', type: 'select', visible: true, required: true, options: '基础版,专业版,企业版' }
      ]}
    ]},
    { id: 'ptpl-14', templateName: 'Kafka申请模板', resType: 'Kafka 消息队列', category: '中间件类', opType: '申请', apiEndpoint: 'CreatePostPayOrder', updateTime: '2025/12/10', fieldGroups: [
      { groupName: '实例配置', fields: [
        { name: '实例名称', param: 'InstanceName', type: 'string', visible: true, required: true, regex: '' },
        { name: '地域', param: 'RegionId', type: 'select', visible: true, required: true, options: '华北2（北京）,华东1（杭州）,华东2（上海）' },
        { name: '规格', param: 'SpecType', type: 'select', visible: true, required: true, options: '标准版,专业版,铂金版' },
        { name: '磁盘大小(GB)', param: 'DiskSize', type: 'number', visible: true, required: true, min: 100, max: 32000, decimals: 0 }
      ]}
    ]},
    { id: 'ptpl-15', templateName: 'Kafka Topic申请模板', resType: 'Kafka 消息队列', category: '中间件类', opType: '二次申请（Topic）', apiEndpoint: 'CreateTopic', updateTime: '2025/12/10', fieldGroups: [
      { groupName: 'Topic 配置', fields: [
        { name: 'Topic 名称', param: 'Topic', type: 'string', visible: true, required: true, regex: '^[a-zA-Z][a-zA-Z0-9._-]*$' },
        { name: '分区数', param: 'PartitionNum', type: 'number', visible: true, required: true, min: 1, max: 360, decimals: 0 },
        { name: '备注', param: 'Remark', type: 'textarea', visible: true, required: false }
      ]}
    ]},
    { id: 'ptpl-16', templateName: 'ES申请模板', resType: 'Elasticsearch', category: '大数据与搜索分析类', opType: '申请', apiEndpoint: 'createInstance', updateTime: '2026/01/05', fieldGroups: [
      { groupName: '集群配置', fields: [
        { name: '实例名称', param: 'description', type: 'string', visible: true, required: true, regex: '' },
        { name: '版本', param: 'esVersion', type: 'select', visible: true, required: true, options: '7.10,7.16,8.5,8.9' },
        { name: '节点规格', param: 'nodeSpec', type: 'select', visible: true, required: true, options: 'elasticsearch.sn2ne.large,elasticsearch.sn2ne.xlarge' },
        { name: '节点数量', param: 'nodeAmount', type: 'number', visible: true, required: true, min: 2, max: 50, decimals: 0 },
        { name: '存储大小(GB)', param: 'diskSize', type: 'number', visible: true, required: true, min: 20, max: 5120, decimals: 0 }
      ]}
    ]},
    { id: 'ptpl-17', templateName: 'ES索引申请模板', resType: 'Elasticsearch', category: '大数据与搜索分析类', opType: '二次申请（索引）', apiEndpoint: 'PUT /{index}', updateTime: '2026/01/05', fieldGroups: [
      { groupName: '索引配置', fields: [
        { name: '索引名称', param: 'index', type: 'string', visible: true, required: true, regex: '^[a-z][a-z0-9_-]*$' },
        { name: '分片数', param: 'number_of_shards', type: 'number', visible: true, required: true, min: 1, max: 50, decimals: 0 },
        { name: '副本数', param: 'number_of_replicas', type: 'number', visible: true, required: true, min: 0, max: 5, decimals: 0 }
      ]}
    ]},
    { id: 'ptpl-18', templateName: 'MaxCompute申请模板', resType: 'MaxCompute', category: '大数据与搜索分析类', opType: '申请', apiEndpoint: 'CreateProject', updateTime: '2026/01/10', fieldGroups: [
      { groupName: '项目配置', fields: [
        { name: '项目名称', param: 'projectName', type: 'string', visible: true, required: true, regex: '^[a-zA-Z][a-zA-Z0-9_]*$' },
        { name: '地域', param: 'RegionId', type: 'select', visible: true, required: true, options: '华北2（北京）,华东1（杭州）,华东2（上海）' },
        { name: '计算资源规格', param: 'defaultQuota', type: 'select', visible: true, required: true, options: '标准版,开发者版' }
      ]}
    ]},
    { id: 'ptpl-19', templateName: 'Flink申请模板', resType: 'Flink 实时计算', category: '大数据与搜索分析类', opType: '申请', apiEndpoint: 'CreateNamespace', updateTime: '2026/01/10', fieldGroups: [
      { groupName: '空间配置', fields: [
        { name: '空间名称', param: 'Namespace', type: 'string', visible: true, required: true, regex: '' },
        { name: '地域', param: 'RegionId', type: 'select', visible: true, required: true, options: '华北2（北京）,华东1（杭州）,华东2（上海）' },
        { name: 'CU 数量', param: 'ResourceSpec', type: 'number', visible: true, required: true, min: 1, max: 100, decimals: 0 }
      ]}
    ]},
    { id: 'ptpl-20', templateName: 'Hologres申请模板', resType: '实时数仓 Hologres', category: '大数据与搜索分析类', opType: '申请', apiEndpoint: 'CreateInstance', updateTime: '2026/01/10', fieldGroups: [
      { groupName: '实例配置', fields: [
        { name: '实例名称', param: 'InstanceName', type: 'string', visible: true, required: true, regex: '' },
        { name: '地域', param: 'RegionId', type: 'select', visible: true, required: true, options: '华北2（北京）,华东1（杭州）,华东2（上海）' },
        { name: '计算规格(CU)', param: 'CpuLimit', type: 'number', visible: true, required: true, min: 8, max: 512, decimals: 0 },
        { name: '存储规格(GB)', param: 'StorageLimit', type: 'number', visible: true, required: true, min: 50, max: 10000, decimals: 0 }
      ]}
    ]},
    { id: 'ptpl-21', templateName: 'OSS申请模板', resType: 'OSS 对象存储', category: '存储类', opType: '申请', apiEndpoint: 'PutBucket', updateTime: '2026/01/15', fieldGroups: [
      { groupName: 'Bucket 配置', fields: [
        { name: 'Bucket 名称', param: 'BucketName', type: 'string', visible: true, required: true, regex: '^[a-z0-9][a-z0-9-]*$' },
        { name: '地域', param: 'RegionId', type: 'select', visible: true, required: true, options: '华北2（北京）,华东1（杭州）,华东2（上海）' },
        { name: '存储类型', param: 'StorageClass', type: 'select', visible: true, required: true, options: '标准存储,低频存储,归档存储' },
        { name: '读写权限', param: 'ACL', type: 'select', visible: true, required: true, options: '私有,公共读,公共读写' }
      ]}
    ]},
    { id: 'ptpl-22', templateName: 'ESSD块存储申请模板', resType: '块存储 ESSD', category: '存储类', opType: '申请', apiEndpoint: 'CreateDisk', updateTime: '2026/01/15', fieldGroups: [
      { groupName: '磁盘配置', fields: [
        { name: '磁盘名称', param: 'DiskName', type: 'string', visible: true, required: true, regex: '' },
        { name: '地域', param: 'RegionId', type: 'select', visible: true, required: true, options: '华北2（北京）,华东1（杭州）,华东2（上海）' },
        { name: '磁盘大小(GB)', param: 'Size', type: 'number', visible: true, required: true, min: 20, max: 32768, decimals: 0 },
        { name: '性能等级', param: 'PerformanceLevel', type: 'select', visible: true, required: true, options: 'PL0,PL1,PL2,PL3' }
      ]}
    ]},
    { id: 'ptpl-23', templateName: 'NAS申请模板', resType: '文件存储 NAS', category: '存储类', opType: '申请', apiEndpoint: 'CreateFileSystem', updateTime: '2026/01/15', fieldGroups: [
      { groupName: '文件系统配置', fields: [
        { name: '文件系统名称', param: 'FileSystemType', type: 'string', visible: true, required: true, regex: '' },
        { name: '地域', param: 'RegionId', type: 'select', visible: true, required: true, options: '华北2（北京）,华东1（杭州）,华东2（上海）' },
        { name: '存储类型', param: 'StorageType', type: 'select', visible: true, required: true, options: '性能型,容量型,极速型' },
        { name: '协议类型', param: 'ProtocolType', type: 'select', visible: true, required: true, options: 'NFS,SMB' }
      ]}
    ]},
    { id: 'ptpl-24', templateName: 'CDN流量包申请模板', resType: 'CDN 流量包', category: '存储类', opType: '申请', apiEndpoint: 'CreateCdnPackage', updateTime: '2026/01/20', fieldGroups: [
      { groupName: '流量包配置', fields: [
        { name: '流量包规格', param: 'PackageSpec', type: 'select', visible: true, required: true, options: '100GB,500GB,1TB,5TB,10TB' },
        { name: '有效期', param: 'Duration', type: 'select', visible: true, required: true, options: '1个月,3个月,6个月,1年' },
        { name: '用途说明', param: '_description', type: 'textarea', visible: true, required: false }
      ]}
    ]}
  ],

  // ===== 平台级审批流程配置 =====
  platformFlows: [
    { resType: 'ECS 云服务器', opType: '申请', subRes: '', flowTemplate: 'leader+l5+admin1', admin1: '', admin2: '' },
    { resType: 'ECS 云服务器', opType: '变配', subRes: '', flowTemplate: 'leader+l5', admin1: '', admin2: '' },
    { resType: 'ECS 云服务器', opType: '扩容', subRes: '', flowTemplate: 'leader', admin1: '', admin2: '' },
    { resType: 'ECS 云服务器', opType: '销毁', subRes: '', flowTemplate: 'leader+l5+admin1', admin1: '', admin2: '' },
    { resType: 'ECS 云服务器', opType: '申请', subRes: '云硬盘', flowTemplate: 'leader+l5', admin1: '', admin2: '' },
    { resType: 'ECS 云服务器', opType: '申请', subRes: '弹性IP', flowTemplate: 'leader', admin1: '', admin2: '' },
    { resType: 'K8S 集群', opType: '申请', subRes: '', flowTemplate: 'leader+l5+admin2', admin1: '', admin2: '' },
    { resType: 'K8S 集群', opType: '变配', subRes: '', flowTemplate: 'leader+l5', admin1: '', admin2: '' },
    { resType: 'RDS 云数据库', opType: '申请', subRes: '', flowTemplate: 'leader+l5+admin1', admin1: '', admin2: '' },
    { resType: 'RDS 云数据库', opType: '变配', subRes: '', flowTemplate: 'leader+l5', admin1: '', admin2: '' },
    { resType: 'RDS 云数据库', opType: '销毁', subRes: '', flowTemplate: 'leader+l5+admin1', admin1: '', admin2: '' },
    { resType: 'RDS 云数据库', opType: '申请', subRes: '数据库', flowTemplate: 'leader', admin1: '', admin2: '' },
    { resType: 'RDS 云数据库', opType: '申请', subRes: '账号', flowTemplate: 'leader', admin1: '', admin2: '' },
    { resType: 'Redis 缓存', opType: '申请', subRes: '', flowTemplate: 'leader+l5', admin1: '', admin2: '' },
    { resType: 'Redis 缓存', opType: '销毁', subRes: '', flowTemplate: 'leader+l5+admin1', admin1: '', admin2: '' },
    { resType: 'SLB 负载均衡', opType: '申请', subRes: '', flowTemplate: 'leader+l5', admin1: '', admin2: '' },
    { resType: 'Kafka 消息队列', opType: '申请', subRes: '', flowTemplate: 'leader+l5+admin1', admin1: '', admin2: '' },
    { resType: 'Kafka 消息队列', opType: '申请', subRes: 'Topic', flowTemplate: 'leader', admin1: '', admin2: '' },
    { resType: 'Elasticsearch', opType: '申请', subRes: '', flowTemplate: 'leader+l5+admin1', admin1: '', admin2: '' },
    { resType: 'MaxCompute', opType: '申请', subRes: '', flowTemplate: 'leader+l5', admin1: '', admin2: '' },
    { resType: 'OSS 对象存储', opType: '申请', subRes: '', flowTemplate: 'leader', admin1: '', admin2: '' },
    { resType: 'OSS 对象存储', opType: '销毁', subRes: '', flowTemplate: 'leader+l5+admin1', admin1: '', admin2: '' }
  ],

  // ===== 未归组资源 =====
  ungroupedResources: [
    { name: 'ecs-temp-debug-01', resId: 'i-bp3k4l5m6n7o', type: 'ECS', typeColor: 'blue', source: '子账号创建 (wanghr-dev)', discoverTime: '2026/02/28 09:00:00', mainAccount: 'infra-main (LTAI****7F2Q)', dept: '基础架构部' },
    { name: 'rds-test-pg-01', resId: 'rm-bp8x9y0z1w2v', type: 'RDS', typeColor: 'orange', source: '子账号创建 (chenty-dev)', discoverTime: '2026/03/05 14:00:00', mainAccount: 'infra-main (LTAI****7F2Q)', dept: '基础架构部' },
    { name: 'oss-backup-temp', resId: 'backup-temp-202603', type: 'OSS', typeColor: 'default', source: '存量子账号资源', discoverTime: '2026/03/10 11:00:00', mainAccount: 'biz-prod (LTAI****k9Xm)', dept: '业务研发部' },
    { name: 'ecs-dev-test-02', resId: 'i-bp4l5m6n7o8p', type: 'ECS', typeColor: 'blue', source: '子账号创建 (lisy-admin)', discoverTime: '2026/03/12 08:30:00', mainAccount: 'infra-main (LTAI****7F2Q)', dept: '基础架构部' },
    { name: 'redis-temp-test', resId: 'r-bp8c9d0e1f2g', type: 'Redis', typeColor: 'red', source: '子账号创建 (wanghr-dev)', discoverTime: '2026/03/14 16:00:00', mainAccount: 'infra-main (LTAI****7F2Q)', dept: '基础架构部' },
    { name: 'ecs-legacy-01', resId: 'i-bp5m6n7o8p9q', type: 'ECS', typeColor: 'blue', source: '组解散上浮（旧测试组）', discoverTime: '2026/01/15 10:00:00', mainAccount: 'infra-main (LTAI****7F2Q)', dept: '基础架构部' },
    { name: 'redis-legacy-cache', resId: 'r-bp9d0e1f2g3h', type: 'Redis', typeColor: 'red', source: '组解散上浮（旧测试组）', discoverTime: '2026/01/15 10:00:00', mainAccount: 'infra-main (LTAI****7F2Q)', dept: '基础架构部' },
    { name: 'rds-legacy-mysql', resId: 'rm-bp5w6v7x8y9z', type: 'RDS', typeColor: 'orange', source: '组解散上浮（旧测试组）', discoverTime: '2026/01/15 10:00:00', mainAccount: 'biz-prod (LTAI****k9Xm)', dept: '业务研发部' }
  ],

  // ===== 角色 =====
  roles: [
    { name: '超级管理员', type: '平台级', typeColor: 'red', scope: '所有功能模块 - 全部权限', userCount: 2, createTime: '--', builtin: true, superOnly: true,
      users: [
        { name: '张明远', username: 'zhangmy', dept: '基础架构部' },
        { name: '刘佳琪', username: 'liujq', dept: '业务研发部' }
      ],
      permissions: {}
    },
    { name: '运维负责人', type: '业务线级', typeColor: 'orange', scope: '资源管理 - 目录配置、表单模板、审核流程管理（仅所在部门）', userCount: 3, createTime: '--', builtin: true, superOnly: false,
      users: [
        { name: '李思远', username: 'lisy', dept: '基础架构部' },
        { name: '马丽华', username: 'malh', dept: '业务研发部' },
        { name: '吴海波', username: 'wuhb', dept: '数据平台部' }
      ],
      permissions: {
        '资源管理': ['查看', '创建', '编辑', '删除'],
        '项目管理': ['查看', '编辑'],
        '工单管理': ['查看', '创建']
      }
    },
    { name: '审核人', type: '业务线级', typeColor: 'orange', scope: '工单审核、资源申请审批（仅所在部门）', userCount: 3, createTime: '--', builtin: true, superOnly: false,
      users: [
        { name: '赵雪晴', username: 'zhaoxq', dept: '基础架构部' },
        { name: '林志强', username: 'linzq', dept: '业务研发部' },
        { name: '郑丽娟', username: 'zhenglj', dept: '数据平台部' }
      ],
      permissions: {
        '工单管理': ['查看', '审批'],
        '资源管理': ['查看', '审批']
      }
    },
    { name: '工单处理人', type: '业务线级', typeColor: 'orange', scope: '工单处理、工单转移（仅所在部门）', userCount: 4, createTime: '--', builtin: true, superOnly: false,
      users: [
        { name: '孙磊', username: 'sunlei', dept: '基础架构部' },
        { name: '陈天宇', username: 'chenty', dept: '基础架构部' },
        { name: '黄晓燕', username: 'huangxy', dept: '业务研发部' },
        { name: '郑丽娟', username: 'zhenglj', dept: '数据平台部' }
      ],
      permissions: {
        '工单管理': ['查看', '处理', '转移']
      }
    }
  ],

  // 功能模块与功能点定义（用于创建角色时的权限配置）
  roleModules: [
    { name: '组织架构管理', points: ['查看', '创建', '编辑', '删除'] },
    { name: '角色管理', points: ['查看', '创建', '编辑', '删除'] },
    { name: '云账号管理', points: ['查看', '创建', '编辑', '删除', '审批'] },
    { name: '项目管理', points: ['查看', '创建', '编辑', '删除'] },
    { name: '资源管理', points: ['查看', '创建', '编辑', '删除', '审批'] },
    { name: '工单管理', points: ['查看', '创建', '审批', '处理', '转移'] },
    { name: '操作审计', points: ['查看'] }
  ],

  // ===== 工单 =====
  // ===== 工单问题类别 =====
  ticketCategories: [
    { id: 'cat-auth', name: '账号权限类' },
    { id: 'cat-resource', name: '资源问题类' },
    { id: 'cat-network', name: '网络问题类' },
    { id: 'cat-security', name: '安全合规类' },
    { id: 'cat-other', name: '其他' }
  ],

  // ===== 工单（问题反馈类） =====
  tickets: [
    { id: 'TK-20260316-001', title: '子账号无法登录阿里云控制台', category: '账号权限类', status: '待处理', statusClass: 'warning', applicant: '王浩然', applicantDept: '基础架构部', handler: '张明远', createTime: '2026/03/16 10:23:45', updateTime: '2026/03/16 10:23:45', desc: '子账号 wanghr-dev 今天早上开始无法登录阿里云控制台，提示"账号已被禁用"',
      timeline: [
        { time: '2026/03/16 10:23:45', action: '提交工单', operator: '王浩然', detail: '子账号无法登录，怀疑权限策略变更导致' }
      ]
    },
    { id: 'TK-20260315-002', title: 'ECS 实例磁盘空间告警', category: '资源问题类', status: '处理中', statusClass: 'processing', applicant: '李思远', applicantDept: '基础架构部', handler: '张明远', createTime: '2026/03/15 09:15:30', updateTime: '2026/03/15 14:00:00', desc: 'ecs-prod-web-01 系统盘使用率已达 92%，需要紧急扩容或清理',
      timeline: [
        { time: '2026/03/15 09:15:30', action: '提交工单', operator: '李思远', detail: '生产环境 ECS 磁盘告警' },
        { time: '2026/03/15 14:00:00', action: '处理中', operator: '张明远', detail: '已排查，正在清理临时日志文件' }
      ]
    },
    { id: 'TK-20260314-003', title: 'VPC 之间网络不通', category: '网络问题类', status: '已完结', statusClass: 'success', applicant: '赵雪晴', applicantDept: '基础架构部', handler: '张明远', createTime: '2026/03/14 14:05:00', updateTime: '2026/03/14 17:30:00', desc: '基础架构部 VPC 与业务研发部 VPC 之间的网络连通性异常，ping 不通',
      timeline: [
        { time: '2026/03/14 14:05:00', action: '提交工单', operator: '赵雪晴', detail: '跨 VPC 网络不通，影响服务间调用' },
        { time: '2026/03/14 15:30:00', action: '处理中', operator: '张明远', detail: '检查路由表和安全组配置' },
        { time: '2026/03/14 17:30:00', action: '已解决', operator: '张明远', detail: '安全组入站规则缺少对端 VPC CIDR，已添加' }
      ]
    },
    { id: 'TK-20260313-004', title: 'RAM 策略配置不当导致越权访问', category: '安全合规类', status: '处理中', statusClass: 'processing', applicant: '陈天宇', applicantDept: '基础架构部', handler: '张明远', createTime: '2026/03/13 16:45:33', updateTime: '2026/03/14 10:00:00', desc: '发现 ram-wanghr-dev 子账号能访问非授权的 RDS 实例，疑似 RAM 策略过宽',
      timeline: [
        { time: '2026/03/13 16:45:33', action: '提交工单', operator: '陈天宇', detail: '发现子账号权限越界问题' },
        { time: '2026/03/14 10:00:00', action: '处理中', operator: '张明远', detail: '正在排查 RAM 策略，临时收紧权限' }
      ]
    },
    { id: 'TK-20260312-005', title: 'RDS 连接数超限导致服务异常', category: '资源问题类', status: '已完结', statusClass: 'success', applicant: '林志强', applicantDept: '业务研发部', handler: '刘佳琪', createTime: '2026/03/12 11:25:18', updateTime: '2026/03/12 15:00:00', desc: '订单系统 RDS 实例连接数达到上限，应用报"too many connections"错误',
      timeline: [
        { time: '2026/03/12 11:25:18', action: '提交工单', operator: '林志强', detail: 'RDS 连接数爆满，订单服务受影响' },
        { time: '2026/03/12 13:00:00', action: '处理中', operator: '刘佳琪', detail: '已联系运维调整连接数上限' },
        { time: '2026/03/12 15:00:00', action: '已解决', operator: '刘佳琪', detail: '连接数上限从 500 提升至 1000，同时优化应用连接池配置' }
      ]
    },
    { id: 'TK-20260311-006', title: 'SLB 健康检查误报不健康', category: '网络问题类', status: '已完结', statusClass: 'success', applicant: '马丽华', applicantDept: '业务研发部', handler: '刘佳琪', createTime: '2026/03/11 17:30:45', updateTime: '2026/03/12 10:00:00', desc: 'SLB 后端服务器健康检查频繁误报，导致流量被摘除',
      timeline: [
        { time: '2026/03/11 17:30:45', action: '提交工单', operator: '马丽华', detail: 'SLB 健康检查异常，服务间歇性不可用' },
        { time: '2026/03/12 09:00:00', action: '处理中', operator: '刘佳琪', detail: '调整健康检查间隔和阈值' },
        { time: '2026/03/12 10:00:00', action: '已解决', operator: '刘佳琪', detail: '将健康检查间隔从 2s 调整为 5s，连续失败阈值从 2 改为 3' }
      ]
    },
    { id: 'TK-20260310-007', title: '申请开通 OSS 防盗链功能', category: '安全合规类', status: '已完结', statusClass: 'success', applicant: '黄晓燕', applicantDept: '业务研发部', handler: '刘佳琪', createTime: '2026/03/10 15:15:30', updateTime: '2026/03/11 11:00:00', desc: '前端静态资源 OSS Bucket 需要配置防盗链（Referer白名单）',
      timeline: [
        { time: '2026/03/10 15:15:30', action: '提交工单', operator: '黄晓燕', detail: '需要为 oss-frontend-static 配置防盗链' },
        { time: '2026/03/11 10:00:00', action: '处理中', operator: '刘佳琪', detail: '已配置 Referer 白名单' },
        { time: '2026/03/11 11:00:00', action: '已解决', operator: '刘佳琪', detail: '防盗链已生效，仅允许 *.sohu.com 访问' }
      ]
    },
    { id: 'TK-20260309-008', title: 'Kafka 消费延迟过高', category: '资源问题类', status: '待处理', statusClass: 'warning', applicant: '吴海波', applicantDept: '数据平台部', handler: '周文博', createTime: '2026/03/09 14:00:00', updateTime: '2026/03/09 14:00:00', desc: 'data-pipeline Topic 消费者 lag 持续增长，已积压 50 万条消息',
      timeline: [
        { time: '2026/03/09 14:00:00', action: '提交工单', operator: '吴海波', detail: 'Kafka 消费延迟告警，数据管道积压严重' }
      ]
    },
    { id: 'TK-20260308-009', title: '咨询云账号安全基线配置标准', category: '其他', status: '已完结', statusClass: 'success', applicant: '范学明', applicantDept: '数据平台部', handler: '周文博', createTime: '2026/03/08 11:00:00', updateTime: '2026/03/08 16:00:00', desc: '想了解公司关于阿里云账号的安全基线配置要求，如 MFA、密码策略等',
      timeline: [
        { time: '2026/03/08 11:00:00', action: '提交工单', operator: '范学明', detail: '咨询安全基线标准' },
        { time: '2026/03/08 15:00:00', action: '回复', operator: '周文博', detail: '已整理安全基线文档并发送' },
        { time: '2026/03/08 16:00:00', action: '已解决', operator: '范学明', detail: '已收到，问题解决' }
      ]
    },
    { id: 'TK-20260307-010', title: 'ES 集群索引写入变慢', category: '资源问题类', status: '处理中', statusClass: 'processing', applicant: '孙磊', applicantDept: '基础架构部', handler: '张明远', createTime: '2026/03/07 10:30:00', updateTime: '2026/03/08 09:00:00', desc: 'es-prod-log-cluster 近两天写入延迟从 50ms 飙升到 500ms+',
      timeline: [
        { time: '2026/03/07 10:30:00', action: '提交工单', operator: '孙磊', detail: 'ES 写入性能劣化严重' },
        { time: '2026/03/08 09:00:00', action: '处理中', operator: '张明远', detail: '已定位到是分片不均匀导致，正在重新分配' }
      ]
    }
  ],

  // ===== 申请记录 =====
  applicationRecords: [
    {
      id: 'APP-20260316-001', title: '申请 ECS 云服务器（生产环境）', type: 'resource', opType: '申请',
      resType: 'ECS 云服务器', subRes: '', status: '审批中', statusClass: 'processing',
      applicant: '王浩然', applicantDept: '基础架构部', applicantGroup: '容器平台组',
      createTime: '2026/03/16 10:00:00', updateTime: '2026/03/16 14:00:00',
      flowTemplate: 'leader+l5+admin1',
      flowNodes: [
        { role: '申请人', name: '王浩然', status: 'done', time: '2026/03/16 10:00:00', remark: '提交申请' },
        { role: '直属领导', name: '李思远', status: 'done', time: '2026/03/16 11:30:00', remark: '同意，生产环境确需扩容' },
        { role: '部门负责人', name: '张明远', status: 'pending', time: '', remark: '' },
        { role: '指定审批人', name: '张明远', status: 'waiting', time: '', remark: '' }
      ],
      formData: { '资源类型': 'ECS 云服务器', '操作类型': '申请', '规格': 'ecs.c6.2xlarge (8C16G)', '数量': '2', '系统盘': '40GB ESSD PL1', '数据盘': '200GB ESSD PL1', '所属项目': '核心基础设施', '用途说明': '生产环境 Web 服务扩容' }
    },
    {
      id: 'APP-20260315-002', title: '申请 RDS 云数据库实例', type: 'resource', opType: '申请',
      resType: 'RDS 云数据库', subRes: '', status: '审批中', statusClass: 'processing',
      applicant: '林志强', applicantDept: '业务研发部', applicantGroup: '订单交易组',
      createTime: '2026/03/15 09:00:00', updateTime: '2026/03/15 11:00:00',
      flowTemplate: 'leader+l5',
      flowNodes: [
        { role: '申请人', name: '林志强', status: 'done', time: '2026/03/15 09:00:00', remark: '提交申请' },
        { role: '直属领导', name: '刘佳琪', status: 'pending', time: '', remark: '' },
        { role: '部门负责人', name: '刘佳琪', status: 'waiting', time: '', remark: '' }
      ],
      formData: { '资源类型': 'RDS 云数据库', '操作类型': '申请', '引擎版本': 'MySQL 8.0', '规格': 'rds.mysql.s3.large (4C8G)', '存储空间': '100GB', '高可用方案': '双机热备', '所属项目': '订单系统', '用途说明': '订单数据读写分离-从库' }
    },
    {
      id: 'APP-20260314-003', title: 'Kafka Topic 申请: user-events', type: 'resource', opType: '申请',
      resType: 'Kafka 消息队列', subRes: 'Topic', status: '审批中', statusClass: 'processing',
      applicant: '马丽华', applicantDept: '业务研发部', applicantGroup: '用户服务组',
      createTime: '2026/03/14 14:30:00', updateTime: '2026/03/14 16:00:00',
      flowTemplate: 'leader+l5+admin1',
      flowNodes: [
        { role: '申请人', name: '马丽华', status: 'done', time: '2026/03/14 14:30:00', remark: '提交申请' },
        { role: '直属领导', name: '刘佳琪', status: 'done', time: '2026/03/14 15:00:00', remark: '同意' },
        { role: '部门负责人', name: '刘佳琪', status: 'done', time: '2026/03/14 15:00:00', remark: '同意（与直属领导为同一人）' },
        { role: '指定审批人', name: '马丽华', status: 'pending', time: '', remark: '' }
      ],
      formData: { '资源类型': 'Kafka 消息队列 / Topic', '操作类型': '申请', 'Topic 名称': 'user-events', '分区数': '6', '副本数': '2', '数据保留': '72小时', '所属项目': '用户中心', '用途说明': '用户行为事件流' }
    },
    {
      id: 'APP-20260313-004', title: 'ECS 变配升级（8C16G→16C32G）', type: 'resource', opType: '变配',
      resType: 'ECS 云服务器', subRes: '', status: '已通过', statusClass: 'success',
      applicant: '赵雪晴', applicantDept: '基础架构部', applicantGroup: '网络组',
      createTime: '2026/03/13 10:00:00', updateTime: '2026/03/13 16:00:00',
      flowTemplate: 'leader+l5',
      flowNodes: [
        { role: '申请人', name: '赵雪晴', status: 'done', time: '2026/03/13 10:00:00', remark: '提交申请' },
        { role: '直属领导', name: '张明远', status: 'done', time: '2026/03/13 11:00:00', remark: '同意' },
        { role: '部门负责人', name: '张明远', status: 'done', time: '2026/03/13 11:00:00', remark: '同意（与直属领导为同一人）' }
      ],
      formData: { '资源类型': 'ECS 云服务器', '操作类型': '变配', '目标实例': 'ecs-staging-app-01', '当前规格': '8C16G', '目标规格': '16C32G', '变配原因': '压测发现 CPU 瓶颈，需要升配' }
    },
    {
      id: 'APP-20260312-005', title: '申请 Redis 缓存实例', type: 'resource', opType: '申请',
      resType: 'Redis 缓存', subRes: '', status: '已通过', statusClass: 'success',
      applicant: '马丽华', applicantDept: '业务研发部', applicantGroup: '用户服务组',
      createTime: '2026/03/12 14:20:00', updateTime: '2026/03/12 17:00:00',
      flowTemplate: 'leader+l5',
      flowNodes: [
        { role: '申请人', name: '马丽华', status: 'done', time: '2026/03/12 14:20:00', remark: '提交申请' },
        { role: '直属领导', name: '刘佳琪', status: 'done', time: '2026/03/12 15:00:00', remark: '同意' },
        { role: '部门负责人', name: '刘佳琪', status: 'done', time: '2026/03/12 16:00:00', remark: '同意' }
      ],
      formData: { '资源类型': 'Redis 缓存', '操作类型': '申请', '规格': '4GB 主从版', '版本': 'Redis 6.0', '所属项目': '用户中心', '用途说明': '用户 Session 缓存' }
    },
    {
      id: 'APP-20260311-006', title: '申请 OSS 存储桶', type: 'resource', opType: '申请',
      resType: 'OSS 对象存储', subRes: '', status: '已通过', statusClass: 'success',
      applicant: '黄晓燕', applicantDept: '业务研发部', applicantGroup: '前端组',
      createTime: '2026/03/11 09:00:00', updateTime: '2026/03/11 14:00:00',
      flowTemplate: 'leader+l5',
      flowNodes: [
        { role: '申请人', name: '黄晓燕', status: 'done', time: '2026/03/11 09:00:00', remark: '提交申请' },
        { role: '直属领导', name: '刘佳琪', status: 'done', time: '2026/03/11 10:30:00', remark: '同意' },
        { role: '部门负责人', name: '刘佳琪', status: 'done', time: '2026/03/11 10:30:00', remark: '同意' }
      ],
      formData: { '资源类型': 'OSS 对象存储', '操作类型': '申请', 'Bucket 名称': 'oss-frontend-static', '存储类型': '标准存储', '读写权限': '公共读', '所属项目': '前端资源池', '用途说明': '前端静态资源CDN回源' }
    },
    {
      id: 'APP-20260310-007', title: 'ECS 云服务器扩容磁盘', type: 'resource', opType: '扩容',
      resType: 'ECS 云服务器', subRes: '', status: '已驳回', statusClass: 'error',
      applicant: '孙磊', applicantDept: '基础架构部', applicantGroup: '存储组',
      createTime: '2026/03/10 11:00:00', updateTime: '2026/03/10 15:00:00',
      flowTemplate: 'leader+l5',
      flowNodes: [
        { role: '申请人', name: '孙磊', status: 'done', time: '2026/03/10 11:00:00', remark: '提交申请' },
        { role: '直属领导', name: '张明远', status: 'rejected', time: '2026/03/10 15:00:00', remark: '建议先清理无用数据再考虑扩容' },
        { role: '部门负责人', name: '张明远', status: 'waiting', time: '', remark: '' }
      ],
      formData: { '资源类型': 'ECS 云服务器', '操作类型': '扩容', '目标实例': 'ecs-storage-backup', '当前磁盘': '500GB', '扩容至': '1TB', '扩容原因': '备份数据增长较快' }
    },
    {
      id: 'APP-20260309-008', title: '销毁临时测试 Redis 实例', type: 'resource', opType: '销毁',
      resType: 'Redis 缓存', subRes: '', status: '已通过', statusClass: 'success',
      applicant: '王浩然', applicantDept: '基础架构部', applicantGroup: '容器平台组',
      createTime: '2026/03/09 09:00:00', updateTime: '2026/03/09 16:00:00',
      flowTemplate: 'leader+l5',
      flowNodes: [
        { role: '申请人', name: '王浩然', status: 'done', time: '2026/03/09 09:00:00', remark: '提交申请' },
        { role: '直属领导', name: '李思远', status: 'done', time: '2026/03/09 10:30:00', remark: '确认可以销毁' },
        { role: '部门负责人', name: '张明远', status: 'done', time: '2026/03/09 15:00:00', remark: '同意销毁' }
      ],
      formData: { '资源类型': 'Redis 缓存', '操作类型': '销毁', '目标实例': 'redis-temp-test', '销毁原因': '临时测试已完成，资源不再需要' }
    },
    {
      id: 'APP-20260308-009', title: 'Elasticsearch 集群申请', type: 'resource', opType: '申请',
      resType: 'Elasticsearch', subRes: '', status: '已撤回', statusClass: 'default',
      applicant: '吴海波', applicantDept: '数据平台部', applicantGroup: '大数据组',
      createTime: '2026/03/08 10:00:00', updateTime: '2026/03/08 14:00:00',
      flowTemplate: 'leader+l5+admin1',
      flowNodes: [
        { role: '申请人', name: '吴海波', status: 'done', time: '2026/03/08 10:00:00', remark: '提交申请' },
        { role: '直属领导', name: '周文博', status: 'done', time: '2026/03/08 11:00:00', remark: '同意' },
        { role: '部门负责人', name: '周文博', status: 'waiting', time: '', remark: '' },
        { role: '指定审批人', name: '吴海波', status: 'waiting', time: '', remark: '' }
      ],
      formData: { '资源类型': 'Elasticsearch', '操作类型': '申请', '规格': '3节点 4C16G', '存储': '500GB SSD', '所属项目': '数据管道', '用途说明': '数据分析日志检索（申请人已撤回，改为使用现有集群）' }
    },
    {
      id: 'APP-20260307-010', title: '申请子账号 developer 权限', type: 'subaccount', opType: '申请',
      resType: '子账号', subRes: '', status: '已驳回', statusClass: 'error',
      applicant: '田雨', applicantDept: '业务研发部', applicantGroup: '前端组',
      createTime: '2026/03/07 14:00:00', updateTime: '2026/03/07 17:00:00',
      flowTemplate: 'leader+l5',
      flowNodes: [
        { role: '申请人', name: '田雨', status: 'done', time: '2026/03/07 14:00:00', remark: '提交子账号申请' },
        { role: '直属领导', name: '黄晓燕', status: 'done', time: '2026/03/07 15:30:00', remark: '同意' },
        { role: '部门负责人', name: '刘佳琪', status: 'rejected', time: '2026/03/07 17:00:00', remark: '前端组暂不需要独立子账号，使用组共享账号即可' }
      ],
      formData: { '申请类型': '子账号申请', '权限包': 'ECS 运维（ecs-ops）', '有效期': '长期持有', '关联主账号': 'biz-prod (LTAI****k9Xm)', '用途说明': '前端构建部署使用' }
    }
  ],

  // ===== 审计日志 =====
  auditLogs: [
    { time: '2026/03/12 10:23:45', operator: '王浩然', dept: '基础架构部', opType: '资源操作', opTypeColor: 'blue', target: 'ecs-prod-web-01', desc: '申请 ECS 云服务器', ip: '10.128.0.55', before: '--', after: '审批中' },
    { time: '2026/03/12 09:15:30', operator: '李思远', dept: '基础架构部', opType: '权限变更', opTypeColor: 'orange', target: '用户: 陈天宇', desc: '分配角色「部门运维」', ip: '10.128.0.42', before: '无角色', after: '部门运维' },
    { time: '2026/03/11 16:40:12', operator: '张明远', dept: '基础架构部', opType: '组织架构', opTypeColor: 'cyan', target: 'K8s运维小组', desc: '创建二级组', ip: '10.128.0.10', before: '--', after: '已创建' },
    { time: '2026/03/11 14:22:08', operator: '赵雪晴', dept: '基础架构部', opType: '资源操作', opTypeColor: 'blue', target: 'slb-prod-api-gw', desc: '变更 SLB 负载均衡配置', ip: '10.128.0.67', before: '4C8G', after: '8C16G' },
    { time: '2026/03/11 11:05:33', operator: '张明远', dept: '基础架构部', opType: '云账号', opTypeColor: 'green', target: '阿里云 - infra-main', desc: '关联部门主账号', ip: '10.128.0.10', before: '未关联', after: '已关联' },
    { time: '2026/03/10 17:30:00', operator: '系统', dept: '--', opType: '审核流程', opTypeColor: 'red', target: 'ERP-FLOW-001', desc: '审核通过 - 王浩然的 ECS 申请', ip: '--', before: '审核中', after: '已通过' },
    { time: '2026/03/10 15:20:11', operator: '刘佳琪', dept: '业务研发部', opType: '组织架构', opTypeColor: 'cyan', target: '前端组', desc: '指定黄晓燕为组长', ip: '10.128.1.20', before: '待指定', after: '黄晓燕' },
    { time: '2026/03/10 14:05:00', operator: '马丽华', dept: '业务研发部', opType: '工单操作', opTypeColor: 'purple', target: 'TK-20260310-003', desc: '创建权限类工单', ip: '10.128.1.35', before: '--', after: '待处理' },
    { time: '2026/03/10 10:30:22', operator: '林志强', dept: '业务研发部', opType: '资源操作', opTypeColor: 'blue', target: 'rds-order-mysql', desc: '申请 RDS 云数据库', ip: '10.128.1.48', before: '--', after: '审批中' },
    { time: '2026/03/09 16:45:33', operator: '张明远', dept: '基础架构部', opType: '权限变更', opTypeColor: 'orange', target: '用户: 王浩然', desc: '授予 ecs-prod-web-01 master 权限', ip: '10.128.0.10', before: 'developer', after: 'master' },
    { time: '2026/03/09 14:10:00', operator: '系统', dept: '--', opType: '审核流程', opTypeColor: 'red', target: 'ERP-FLOW-004', desc: '审核通过 - 林志强的 RDS 申请', ip: '--', before: '审核中', after: '已通过' },
    { time: '2026/03/09 11:25:18', operator: '周文博', dept: '数据平台部', opType: '工单操作', opTypeColor: 'purple', target: 'TK-20260309-005', desc: '创建服务类工单（技术咨询）', ip: '10.128.2.15', before: '--', after: '待处理' },
    { time: '2026/03/09 09:00:00', operator: '吴海波', dept: '数据平台部', opType: '资源操作', opTypeColor: 'blue', target: 'es-data-analytics', desc: '申请 Elasticsearch 集群', ip: '10.128.2.22', before: '--', after: '审批中' },
    { time: '2026/03/08 17:30:45', operator: '李思远', dept: '基础架构部', opType: '工单操作', opTypeColor: 'purple', target: 'TK-20260308-006', desc: '创建工单：申请 Kafka Topic', ip: '10.128.0.42', before: '--', after: '待处理' },
    { time: '2026/03/08 15:15:30', operator: '孙磊', dept: '基础架构部', opType: '资源操作', opTypeColor: 'blue', target: 'es-prod-log-cluster', desc: '创建索引: app-logs-2026', ip: '10.128.0.78', before: '--', after: '已创建' },
    { time: '2026/03/08 11:40:00', operator: '赵雪晴', dept: '基础架构部', opType: '资源操作', opTypeColor: 'blue', target: 'slb-prod-internal', desc: '变更 SLB 监听器配置', ip: '10.128.0.67', before: '端口80', after: '端口80+443' },
    { time: '2026/03/07 16:20:15', operator: '黄晓燕', dept: '业务研发部', opType: '资源操作', opTypeColor: 'blue', target: 'oss-frontend-static', desc: '申请 OSS 存储桶', ip: '10.128.1.60', before: '--', after: '审批中' },
    { time: '2026/03/07 14:00:00', operator: '刘佳琪', dept: '业务研发部', opType: '权限变更', opTypeColor: 'orange', target: '用户: 田雨', desc: '分配角色「部门运维」', ip: '10.128.1.20', before: '无角色', after: '部门运维' },
    { time: '2026/03/07 10:30:00', operator: '张明远', dept: '基础架构部', opType: '云账号', opTypeColor: 'green', target: '子账号: wanghr-dev', desc: '审批通过子账号申请', ip: '10.128.0.10', before: '审批中', after: '正常' },
    { time: '2026/03/06 17:15:22', operator: '系统', dept: '--', opType: '审核流程', opTypeColor: 'red', target: 'ERP-FLOW-007', desc: '审核通过 - 周文博的 Kafka 申请', ip: '--', before: '审核中', after: '已通过' },
    { time: '2026/03/06 15:30:00', operator: '周文博', dept: '数据平台部', opType: '组织架构', opTypeColor: 'cyan', target: 'AI算法组', desc: '创建一级组', ip: '10.128.2.15', before: '--', after: '已创建' },
    { time: '2026/03/06 11:00:00', operator: '王浩然', dept: '基础架构部', opType: '云账号', opTypeColor: 'green', target: '子账号: wanghr-ops', desc: '申请 master 权限子账号', ip: '10.128.0.55', before: '--', after: '审批中' },
    { time: '2026/03/05 16:40:33', operator: '陈天宇', dept: '基础架构部', opType: '资源操作', opTypeColor: 'blue', target: 'ecs-staging-app-01', desc: '申请变配 ECS（升级配置）', ip: '10.128.0.88', before: '4C8G', after: '8C16G（申请中）' },
    { time: '2026/03/05 14:20:00', operator: '马丽华', dept: '业务研发部', opType: '资源操作', opTypeColor: 'blue', target: 'redis-user-session', desc: '申请 Redis 缓存', ip: '10.128.1.35', before: '--', after: '审批中' },
    { time: '2026/03/05 10:00:00', operator: '林志强', dept: '业务研发部', opType: '资源操作', opTypeColor: 'blue', target: 'kafka-order-msg', desc: '申请 Kafka 消息队列', ip: '10.128.1.48', before: '--', after: '审批中' },
    { time: '2026/03/04 17:00:00', operator: '张明远', dept: '基础架构部', opType: '组织架构', opTypeColor: 'cyan', target: '存储组', desc: '指定孙磊为组长', ip: '10.128.0.10', before: '待指定', after: '孙磊' },
    { time: '2026/03/04 14:30:00', operator: '李思远', dept: '基础架构部', opType: '权限变更', opTypeColor: 'orange', target: '用户: 周杰', desc: '授予 rds-prod-mysql-01 developer 权限', ip: '10.128.0.42', before: 'reporter', after: 'developer' },
    { time: '2026/03/04 10:15:00', operator: '系统', dept: '--', opType: '审核流程', opTypeColor: 'red', target: 'ERP-FLOW-006', desc: '审核通过 - 马丽华的 Redis 申请', ip: '--', before: '审核中', after: '已通过' },
    { time: '2026/03/03 16:00:00', operator: '范学明', dept: '数据平台部', opType: '资源操作', opTypeColor: 'blue', target: 'oss-data-lake', desc: '申请 OSS 存储桶', ip: '10.128.2.30', before: '--', after: '审批中' },
    { time: '2026/03/03 11:30:00', operator: '刘佳琪', dept: '业务研发部', opType: '组织架构', opTypeColor: 'cyan', target: '订单交易组', desc: '调整成员: 任静转入', ip: '10.128.1.20', before: '用户服务组', after: '订单交易组' },
    { time: '2026/03/02 15:20:00', operator: '张明远', dept: '基础架构部', opType: '账号管理', opTypeColor: 'volcano', target: '用户: 新入职-赵强', desc: '创建账号并分配至容器平台组', ip: '10.128.0.10', before: '--', after: '已创建' },
    { time: '2026/03/01 10:45:00', operator: '刘佳琪', dept: '业务研发部', opType: '账号管理', opTypeColor: 'volcano', target: '用户: 田雨', desc: '重置密码', ip: '10.128.1.20', before: '--', after: '已重置' }
  ],

  // ===== 部门配置 =====
  deptConfig: {
    'dept-infra': {
      deptName: '基础架构部',
      cloudAccount: 'infra-main (LTAI****7F2Q)',
      cloudAccountBound: true,
      cloudAccountOptions: ['infra-main', 'infra-dev', 'shared-services'],
      templates: [
        { id: 'tpl-1', resType: 'ECS 云服务器', opType: '申请', category: '计算类', customized: false, fieldOverrides: {} },
        { id: 'tpl-1a', resType: 'ECS 云服务器', opType: '变配', category: '计算类', customized: false, fieldOverrides: {} },
        { id: 'tpl-1b', resType: 'ECS 云服务器', opType: '扩容', category: '计算类', customized: false, fieldOverrides: {} },
        { id: 'tpl-1c', resType: 'ECS 云服务器', opType: '销毁', category: '计算类', customized: false, fieldOverrides: {} },
        { id: 'tpl-1d', resType: 'ECS 云服务器', opType: '申请', category: '计算类', subRes: '云硬盘', customized: false, fieldOverrides: {} },
        { id: 'tpl-1e', resType: 'ECS 云服务器', opType: '申请', category: '计算类', subRes: '弹性IP', customized: false, fieldOverrides: {} },
        { id: 'tpl-2', resType: 'K8S 集群', opType: '申请', category: '计算类', customized: false, fieldOverrides: {} },
        { id: 'tpl-3', resType: 'RDS 云数据库', opType: '申请', category: '数据库类', customized: false, fieldOverrides: {} },
        { id: 'tpl-3a', resType: 'RDS 云数据库', opType: '变配', category: '数据库类', customized: false, fieldOverrides: {} },
        { id: 'tpl-3b', resType: 'RDS 云数据库', opType: '申请', category: '数据库类', subRes: '数据库', customized: false, fieldOverrides: {} },
        { id: 'tpl-3c', resType: 'RDS 云数据库', opType: '申请', category: '数据库类', subRes: '账号', customized: false, fieldOverrides: {} },
        { id: 'tpl-4', resType: 'PolarDB PostgreSQL', opType: '申请', category: '数据库类', customized: false, fieldOverrides: {} },
        { id: 'tpl-5', resType: 'MongoDB', opType: '申请', category: '数据库类', customized: false, fieldOverrides: {} },
        { id: 'tpl-6', resType: 'Redis 缓存', opType: '申请', category: '数据库类', customized: true, fieldOverrides: {} },
        { id: 'tpl-7', resType: 'SLB 负载均衡', opType: '申请', category: '网络与负载均衡类', customized: false, fieldOverrides: {} },
        { id: 'tpl-8', resType: 'Kafka 消息队列', opType: '申请', category: '中间件类', customized: true, fieldOverrides: {} },
        { id: 'tpl-8a', resType: 'Kafka 消息队列', opType: '申请', category: '中间件类', subRes: 'Topic', customized: false, fieldOverrides: {} },
        { id: 'tpl-9', resType: 'Elasticsearch', opType: '申请', category: '大数据与搜索分析类', customized: false, fieldOverrides: {} },
        { id: 'tpl-9a', resType: 'Elasticsearch', opType: '申请', category: '大数据与搜索分析类', subRes: '索引', customized: false, fieldOverrides: {} },
        { id: 'tpl-10', resType: 'OSS 对象存储', opType: '申请', category: '存储类', customized: false, fieldOverrides: {} }
      ],
      ticketHandlers: [
        { categoryId: 'cat-auth', categoryName: '账号权限类', handler: '张明远', isDefault: true },
        { categoryId: 'cat-resource', categoryName: '资源问题类', handler: '张明远', isDefault: true },
        { categoryId: 'cat-network', categoryName: '网络问题类', handler: '赵雪晴', isDefault: false },
        { categoryId: 'cat-security', categoryName: '安全合规类', handler: '张明远', isDefault: true },
        { categoryId: 'cat-other', categoryName: '其他', handler: '张明远', isDefault: true }
      ],
      approvalFlows: [
        { id: 'flow-1', resType: 'ECS 云服务器', opType: '申请', category: '计算类', customized: false, admin1: '张明远', admin2: '' },
        { id: 'flow-1a', resType: 'ECS 云服务器', opType: '变配', category: '计算类', customized: false, admin1: '李思远', admin2: '' },
        { id: 'flow-1b', resType: 'ECS 云服务器', opType: '扩容', category: '计算类', customized: false, admin1: '张明远', admin2: '' },
        { id: 'flow-1c', resType: 'ECS 云服务器', opType: '销毁', category: '计算类', customized: false, admin1: '张明远', admin2: '' },
        { id: 'flow-1d', resType: 'ECS 云服务器', opType: '申请', category: '计算类', subRes: '云硬盘', customized: false, admin1: '张明远', admin2: '' },
        { id: 'flow-1e', resType: 'ECS 云服务器', opType: '申请', category: '计算类', subRes: '弹性IP', customized: false, admin1: '张明远', admin2: '' },
        { id: 'flow-2', resType: 'K8S 集群', opType: '申请', category: '计算类', customized: false, admin1: '张明远', admin2: '' },
        { id: 'flow-3', resType: 'RDS 云数据库', opType: '申请', category: '数据库类', customized: true, admin1: '张明远', admin2: '' },
        { id: 'flow-3a', resType: 'RDS 云数据库', opType: '变配', category: '数据库类', customized: false, admin1: '张明远', admin2: '' },
        { id: 'flow-4', resType: 'Redis 缓存', opType: '申请', category: '数据库类', customized: false, admin1: '张明远', admin2: '' },
        { id: 'flow-5', resType: 'Kafka 消息队列', opType: '申请', category: '中间件类', customized: false, admin1: '张明远', admin2: '' },
        { id: 'flow-5a', resType: 'Kafka 消息队列', opType: '申请', category: '中间件类', subRes: 'Topic', customized: false, admin1: '张明远', admin2: '' },
        { id: 'flow-6', resType: 'Elasticsearch', opType: '申请', category: '大数据与搜索分析类', customized: false, admin1: '张明远', admin2: '' },
        { id: 'flow-7', resType: 'OSS 对象存储', opType: '申请', category: '存储类', customized: false, admin1: '李思远', admin2: '' }
      ]
    },
    'dept-biz': {
      deptName: '业务研发部',
      cloudAccount: 'biz-prod (LTAI****k9Xm)',
      cloudAccountBound: true,
      cloudAccountOptions: ['biz-prod', 'biz-staging', 'shared-services'],
      templates: [
        { id: 'tpl-20', resType: 'ECS 云服务器', opType: '申请', category: '计算类', customized: true, fieldOverrides: {} },
        { id: 'tpl-21', resType: 'RDS 云数据库', opType: '申请', category: '数据库类', customized: false, fieldOverrides: {} },
        { id: 'tpl-22', resType: 'Redis 缓存', opType: '申请', category: '数据库类', customized: false, fieldOverrides: {} },
        { id: 'tpl-23', resType: 'SLB 负载均衡', opType: '申请', category: '网络与负载均衡类', customized: false, fieldOverrides: {} },
        { id: 'tpl-24', resType: 'Kafka 消息队列', opType: '申请', category: '中间件类', customized: false, fieldOverrides: {} },
        { id: 'tpl-25', resType: 'OSS 对象存储', opType: '申请', category: '存储类', customized: false, fieldOverrides: {} }
      ],
      ticketHandlers: [
        { categoryId: 'cat-auth', categoryName: '账号权限类', handler: '刘佳琪', isDefault: true },
        { categoryId: 'cat-resource', categoryName: '资源问题类', handler: '刘佳琪', isDefault: true },
        { categoryId: 'cat-network', categoryName: '网络问题类', handler: '刘佳琪', isDefault: true },
        { categoryId: 'cat-security', categoryName: '安全合规类', handler: '刘佳琪', isDefault: true },
        { categoryId: 'cat-other', categoryName: '其他', handler: '刘佳琪', isDefault: true }
      ],
      approvalFlows: [
        { id: 'flow-10', resType: 'ECS 云服务器', opType: '申请', category: '计算类', customized: true, admin1: '刘佳琪', admin2: '' },
        { id: 'flow-11', resType: 'RDS 云数据库', opType: '申请', category: '数据库类', customized: false, admin1: '刘佳琪', admin2: '' },
        { id: 'flow-12', resType: 'Redis 缓存', opType: '申请', category: '数据库类', customized: false, admin1: '马丽华', admin2: '' },
        { id: 'flow-13', resType: 'OSS 对象存储', opType: '申请', category: '存储类', customized: false, admin1: '马丽华', admin2: '' }
      ]
    },
    'dept-data': {
      deptName: '数据平台部',
      cloudAccount: '',
      cloudAccountBound: false,
      cloudAccountOptions: ['data-prod', 'data-dev', 'shared-services'],
      templates: [
        { id: 'tpl-30', resType: 'Elasticsearch', opType: '申请', category: '大数据与搜索分析类', customized: false, fieldOverrides: {} },
        { id: 'tpl-31', resType: 'MaxCompute', opType: '申请', category: '大数据与搜索分析类', customized: false, fieldOverrides: {} },
        { id: 'tpl-32', resType: 'Flink 实时计算', opType: '申请', category: '大数据与搜索分析类', customized: true, fieldOverrides: {} },
        { id: 'tpl-33', resType: 'ECS 云服务器', opType: '申请', category: '计算类', customized: false, fieldOverrides: {} },
        { id: 'tpl-34', resType: 'OSS 对象存储', opType: '申请', category: '存储类', customized: false, fieldOverrides: {} }
      ],
      ticketHandlers: [
        { categoryId: 'cat-auth', categoryName: '账号权限类', handler: '周文博', isDefault: true },
        { categoryId: 'cat-resource', categoryName: '资源问题类', handler: '吴海波', isDefault: false },
        { categoryId: 'cat-network', categoryName: '网络问题类', handler: '周文博', isDefault: true },
        { categoryId: 'cat-security', categoryName: '安全合规类', handler: '周文博', isDefault: true },
        { categoryId: 'cat-other', categoryName: '其他', handler: '周文博', isDefault: true }
      ],
      approvalFlows: [
        { id: 'flow-20', resType: 'Elasticsearch', opType: '申请', category: '大数据与搜索分析类', customized: false, admin1: '吴海波', admin2: '' },
        { id: 'flow-21', resType: 'MaxCompute', opType: '申请', category: '大数据与搜索分析类', customized: false, admin1: '吴海波', admin2: '' },
        { id: 'flow-22', resType: 'ECS 云服务器', opType: '申请', category: '计算类', customized: false, admin1: '周文博', admin2: '' }
      ]
    }
  }
};

// ===== 工具函数 =====

// 根据 id 查找权限包
window.getPermPackage = function (pkgId) {
  for (var i = 0; i < window.PermPackages.length; i++) {
    if (window.PermPackages[i].id === pkgId) return window.PermPackages[i];
  }
  return { id: pkgId, name: pkgId, color: 'default', description: '--', policies: [] };
};

// 根据 orgId 找到组织节点
window.MockData.findOrg = function (orgId) {
  function search(nodes) {
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].id === orgId) return nodes[i];
      if (nodes[i].children && nodes[i].children.length) {
        var found = search(nodes[i].children);
        if (found) return found;
      }
    }
    return null;
  }
  return search(this.orgs);
};

// 获取某个 org 及其所有子 org 的 id 列表
window.MockData.getOrgAndChildIds = function (orgId) {
  var ids = [];
  function collect(node) {
    ids.push(node.id);
    if (node.children) {
      for (var i = 0; i < node.children.length; i++) {
        collect(node.children[i]);
      }
    }
  }
  var org = this.findOrg(orgId);
  if (org) collect(org);
  return ids;
};

// 获取某 org 的父部门名称
window.MockData.getParentDept = function (orgId) {
  function search(nodes, parentDept) {
    for (var i = 0; i < nodes.length; i++) {
      var dept = nodes[i].type === 'dept' ? nodes[i].name : parentDept;
      if (nodes[i].id === orgId) return dept;
      if (nodes[i].children && nodes[i].children.length) {
        var found = search(nodes[i].children, dept);
        if (found) return found;
      }
    }
    return null;
  }
  return search(this.orgs, '');
};

// 动态计算某 org 及其所有子节点的成员总数
window.MockData.countMembers = function (orgId) {
  var ids = this.getOrgAndChildIds(orgId);
  var count = 0;
  for (var i = 0; i < this.members.length; i++) {
    if (ids.indexOf(this.members[i].orgId) !== -1) count++;
  }
  return count;
};

// 获取所有组名列表（用于资源筛选下拉）
window.MockData.getAllGroups = function () {
  var groups = [];
  function collect(nodes) {
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].type !== 'dept') groups.push(nodes[i].name);
      if (nodes[i].children) collect(nodes[i].children);
    }
  }
  collect(this.orgs);
  return groups;
};

// 获取所有项目名列表
window.MockData.getAllProjectNames = function () {
  return this.projects.map(function (p) { return p.name; });
};

// 获取所有部门名列表
window.MockData.getAllDepts = function () {
  return this.orgs.map(function (o) { return o.name; });
};

// 获取成员相对于选中节点的组织路径（用 - 连接）
// 选中部门：显示 "部门 - 一级组 - 二级组"
// 选中一级组：显示 "一级组 - 二级组"
// 选中二级组：显示 "二级组"
window.MockData.getOrgPath = function (memberOrgId, selectedOrgId) {
  var org = this.findOrg(memberOrgId);
  if (!org) return memberOrgId;
  var selectedOrg = this.findOrg(selectedOrgId);
  if (!selectedOrg) return org.name;
  var path = [];
  function findPath(node, trail) {
    trail.push(node.name);
    if (node.id === memberOrgId) { path = trail.slice(); return true; }
    if (node.children) {
      for (var i = 0; i < node.children.length; i++) {
        if (findPath(node.children[i], trail)) return true;
      }
    }
    trail.pop();
    return false;
  }
  findPath(selectedOrg, []);
  if (path.length > 0) return path.join(' - ');
  return org.name;
};
