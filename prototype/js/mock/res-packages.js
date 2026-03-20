'use strict';
// CMP 原型 - Mock 数据层 - 资源包数据 + 工具函数

// ===== 资源包数据 =====
MockData.resourcePackages = [
  {
    id: 'rp-001',
    name: '容器平台资源包',
    description: '容器平台组日常使用的核心资源集合，涵盖 K8s 集群、ECS 节点及负载均衡',
    creator: '陈天宇', creatorUsername: 'chenty', createTime: '2025-03-10 14:22',
    visibility: 'dept', visibilityDept: '基础架构部',
    resources: [
      { resId: 'i-cs-001', name: 'k8s-prod-cluster', type: 'K8S 集群', typeColor: 'purple', perm: 'master' },
      { resId: 'i-ecs-001', name: 'k8s-node-01', type: 'ECS 云服务器', typeColor: 'blue', perm: 'developer' },
      { resId: 'i-ecs-002', name: 'k8s-node-02', type: 'ECS 云服务器', typeColor: 'blue', perm: 'developer' },
      { resId: 'i-slb-001', name: 'prod-slb', type: 'SLB 负载均衡', typeColor: 'cyan', perm: 'reporter' }
    ],
    users: [
      { name: '陈天宇', username: 'chenty', dept: '基础架构部' },
      { name: '李思远', username: 'lisy', dept: '基础架构部' }
    ]
  },
  {
    id: 'rp-002',
    name: '业务数据库资源包',
    description: '业务研发部使用的数据库资源，含主从 RDS 及 Redis 缓存',
    creator: '林志强', creatorUsername: 'linzq', createTime: '2025-04-02 10:05',
    visibility: 'dept', visibilityDept: '业务研发部',
    resources: [
      { resId: 'i-rds-001', name: 'mysql-biz-master', type: 'RDS 云数据库', typeColor: 'orange', perm: 'master' },
      { resId: 'i-rds-002', name: 'mysql-biz-slave', type: 'RDS 云数据库', typeColor: 'orange', perm: 'reporter' },
      { resId: 'i-redis-001', name: 'redis-session', type: 'Redis 缓存', typeColor: 'red', perm: 'developer' }
    ],
    users: [
      { name: '林志强', username: 'linzq', dept: '业务研发部' },
      { name: '王浩然', username: 'wanghr', dept: '基础架构部' },
      { name: '马丽华', username: 'malh', dept: '业务研发部' }
    ]
  },
  {
    id: 'rp-003',
    name: '数据平台资源包',
    description: '大数据平台资源集合，供数据平台组日常开发和分析使用',
    creator: '吴海波', creatorUsername: 'wuhb', createTime: '2025-05-18 09:30',
    visibility: 'all',
    resources: [
      { resId: 'i-mc-001', name: 'maxcompute-prod', type: 'MaxCompute', typeColor: 'geekblue', perm: 'master' },
      { resId: 'i-flink-001', name: 'flink-streaming', type: 'Flink 实时计算', typeColor: 'geekblue', perm: 'developer' },
      { resId: 'i-es-001', name: 'es-search-cluster', type: 'Elasticsearch', typeColor: 'gold', perm: 'developer' },
      { resId: 'i-oss-001', name: 'data-lake-bucket', type: 'OSS 对象存储', typeColor: 'lime', perm: 'reporter' }
    ],
    users: [
      { name: '吴海波', username: 'wuhb', dept: '数据平台部' }
    ]
  },
  {
    id: 'rp-004',
    name: '运维监控资源包',
    description: '运维团队只读监控资源包，供值班人员查看所有生产资源状态',
    creator: '张明远', creatorUsername: 'zhangmy', createTime: '2025-06-01 16:40',
    visibility: 'admin',
    resources: [
      { resId: 'i-cs-001', name: 'k8s-prod-cluster', type: 'K8S 集群', typeColor: 'purple', perm: 'reporter' },
      { resId: 'i-rds-001', name: 'mysql-biz-master', type: 'RDS 云数据库', typeColor: 'orange', perm: 'reporter' },
      { resId: 'i-slb-001', name: 'prod-slb', type: 'SLB 负载均衡', typeColor: 'cyan', perm: 'reporter' }
    ],
    users: [
      { name: '张明远', username: 'zhangmy', dept: '基础架构部' }
    ]
  }
];

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
