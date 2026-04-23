'use strict';
// CMP 原型 - Mock 数据层 - 工作流数据（角色、工单、申请记录、审计日志）

MockData.roles = [
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
];

MockData.roleModules = [
  { name: '组织架构管理', points: ['查看', '创建', '编辑', '删除'] },
  { name: '角色管理', points: ['查看', '创建', '编辑', '删除'] },
  { name: '云账号管理', points: ['查看', '创建', '编辑', '删除', '审批'] },
  { name: '项目管理', points: ['查看', '创建', '编辑', '删除'] },
  { name: '资源管理', points: ['查看', '创建', '编辑', '删除', '审批'] },
  { name: '工单管理', points: ['查看', '创建', '审批', '处理', '转移'] },
  { name: '操作审计', points: ['查看'] }
];

MockData.ticketCategories = [
  { id: 'cat-auth', name: '账号权限类' },
  { id: 'cat-resource', name: '资源问题类' },
  { id: 'cat-network', name: '网络问题类' },
  { id: 'cat-security', name: '安全合规类' },
  { id: 'cat-other', name: '其他' }
];

MockData.tickets = [
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
];

MockData.applicationRecords = [
  {
    id: 'APP-20260422-011', title: '创建 ECS 云服务器（测试环境）', type: 'resource', opType: '创建',
    resType: 'ECS 云服务器', subRes: '', status: '核验中', statusClass: 'processing',
    applicant: '陈天宇', applicantDept: '基础架构部', applicantGroup: '容器平台组',
    createTime: '2026/04/22 09:30:00', updateTime: '2026/04/22 09:30:00',
    flowTemplate: 'leader+l5',
    verificationNodes: [
      { role: '申请人', name: '陈天宇', status: 'done', time: '2026/04/22 09:30:00', remark: '提交申请' },
      { role: '核验人', name: '李思远', status: 'pending', time: '', remark: '' }
    ],
    flowNodes: [],
    userFormData: { '实例名称': 'ecs-test-app-01', '实例个数': '1', '用途说明': '测试环境应用服务器' },
    formData: null
  },
  {
    id: 'APP-20260421-010', title: '创建 RDS MySQL 数据库（测试）', type: 'resource', opType: '创建',
    resType: 'RDS 云数据库', subRes: '', status: '核验失败', statusClass: 'error',
    applicant: '黄晓燕', applicantDept: '业务研发部', applicantGroup: '前端组',
    createTime: '2026/04/21 14:00:00', updateTime: '2026/04/21 16:30:00',
    flowTemplate: 'leader+l5',
    verificationNodes: [
      { role: '申请人', name: '黄晓燕', status: 'done', time: '2026/04/21 14:00:00', remark: '提交申请' },
      { role: '核验人', name: '刘佳琪', status: 'rejected', time: '2026/04/21 16:30:00', remark: '所选规格不符合部门规范，请改为 rds.mysql.s2.large 规格' }
    ],
    flowNodes: [],
    userFormData: { '实例名称': 'rds-test-frontend-01', '实例个数': '1', '用途说明': '前端测试数据库' },
    formData: null
  },

  {
    id: 'APP-20260316-001', title: '创建 ECS 云服务器（生产环境）', type: 'resource', opType: '创建',
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
    formData: { '资源类型': 'ECS 云服务器', '操作类型': '创建', '规格': 'ecs.c6.2xlarge (8C16G)', '实例个数': '2', '付费类型': '包年包月', '付费周期': '1年', '单价（元/月）': '1,520.00', '总价（元）': '36,480.00', '系统盘': '40GB ESSD PL1', '数据盘': '200GB ESSD PL1', '所属项目': '核心基础设施', '用途说明': '生产环境 Web 服务扩容' }
  },
  {
    id: 'APP-20260315-002', title: '创建 RDS 云数据库实例', type: 'resource', opType: '创建',
    resType: 'RDS 云数据库', subRes: '', status: '审批中', statusClass: 'processing',
    applicant: '林志强', applicantDept: '业务研发部', applicantGroup: '订单交易组',
    createTime: '2026/03/15 09:00:00', updateTime: '2026/03/15 11:00:00',
    flowTemplate: 'leader+l5',
    flowNodes: [
      { role: '申请人', name: '林志强', status: 'done', time: '2026/03/15 09:00:00', remark: '提交申请' },
      { role: '直属领导', name: '刘佳琪', status: 'pending', time: '', remark: '' },
      { role: '部门负责人', name: '刘佳琪', status: 'waiting', time: '', remark: '' }
    ],
    formData: { '资源类型': 'RDS 云数据库', '操作类型': '创建', '引擎版本': 'MySQL 8.0', '规格': 'rds.mysql.s3.large (4C8G)', '存储空间': '100GB', '实例个数': '1', '付费类型': '包年包月', '付费周期': '1年', '单价（元/月）': '980.00', '总价（元）': '11,760.00', '高可用方案': '双机热备', '所属项目': '订单系统', '用途说明': '订单数据读写分离-从库' }
  },
  {
    id: 'APP-20260314-003', title: 'Kafka Topic 创建: user-events', type: 'resource', opType: '创建',
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
    formData: { '资源类型': 'Kafka 消息队列 / Topic', '操作类型': '创建', 'Topic 名称': 'user-events', '分区数': '6', '副本数': '2', '实例个数': '1', '付费类型': '按量付费', '单价（元/时）': '0.00', '总价（元）': '0.00（按量）', '数据保留': '72小时', '所属项目': '用户中心', '用途说明': '用户行为事件流' }
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
    id: 'APP-20260312-005', title: '创建 Redis 缓存实例', type: 'resource', opType: '创建',
    resType: 'Redis 缓存', subRes: '', status: '已通过', statusClass: 'success',
    applicant: '马丽华', applicantDept: '业务研发部', applicantGroup: '用户服务组',
    createTime: '2026/03/12 14:20:00', updateTime: '2026/03/12 17:00:00',
    flowTemplate: 'leader+l5',
    flowNodes: [
      { role: '申请人', name: '马丽华', status: 'done', time: '2026/03/12 14:20:00', remark: '提交申请' },
      { role: '直属领导', name: '刘佳琪', status: 'done', time: '2026/03/12 15:00:00', remark: '同意' },
      { role: '部门负责人', name: '刘佳琪', status: 'done', time: '2026/03/12 16:00:00', remark: '同意' }
    ],
    formData: { '资源类型': 'Redis 缓存', '操作类型': '创建', '规格': '4GB 主从版', '版本': 'Redis 6.0', '实例个数': '1', '付费类型': '包年包月', '付费周期': '1年', '单价（元/月）': '340.00', '总价（元）': '4,080.00', '所属项目': '用户中心', '用途说明': '用户 Session 缓存' }
  },
  {
    id: 'APP-20260311-006', title: '创建 OSS 存储桶', type: 'resource', opType: '创建',
    resType: 'OSS 对象存储', subRes: '', status: '已通过', statusClass: 'success',
    applicant: '黄晓燕', applicantDept: '业务研发部', applicantGroup: '前端组',
    createTime: '2026/03/11 09:00:00', updateTime: '2026/03/11 14:00:00',
    flowTemplate: 'leader+l5',
    flowNodes: [
      { role: '申请人', name: '黄晓燕', status: 'done', time: '2026/03/11 09:00:00', remark: '提交申请' },
      { role: '直属领导', name: '刘佳琪', status: 'done', time: '2026/03/11 10:30:00', remark: '同意' },
      { role: '部门负责人', name: '刘佳琪', status: 'done', time: '2026/03/11 10:30:00', remark: '同意' }
    ],
    formData: { '资源类型': 'OSS 对象存储', '操作类型': '创建', 'Bucket 名称': 'oss-frontend-static', '存储类型': '标准存储', '读写权限': '公共读', '实例个数': '1', '付费类型': '按量付费', '单价（元/月）': '约200.00（按实际用量）', '总价（元）': '按量计费', '所属项目': '前端资源池', '用途说明': '前端静态资源CDN回源' }
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
    id: 'APP-20260309-008', title: '回收临时测试 Redis 实例', type: 'resource', opType: '回收',
    resType: 'Redis 缓存', subRes: '', status: '已通过', statusClass: 'success',
    applicant: '王浩然', applicantDept: '基础架构部', applicantGroup: '容器平台组',
    createTime: '2026/03/09 09:00:00', updateTime: '2026/03/09 16:00:00',
    flowTemplate: 'leader+l5',
    flowNodes: [
      { role: '申请人', name: '王浩然', status: 'done', time: '2026/03/09 09:00:00', remark: '提交申请' },
      { role: '直属领导', name: '李思远', status: 'done', time: '2026/03/09 10:30:00', remark: '确认可以销毁' },
      { role: '部门负责人', name: '张明远', status: 'done', time: '2026/03/09 15:00:00', remark: '同意销毁' }
    ],
    formData: { '资源类型': 'Redis 缓存', '操作类型': '回收', '目标实例': 'redis-temp-test', '回收原因': '临时测试已完成，资源不再需要' }
  },
  {
    id: 'APP-20260308-009', title: 'Elasticsearch 集群创建', type: 'resource', opType: '创建',
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
    formData: { '资源类型': 'Elasticsearch', '操作类型': '创建', '规格': '3节点 4C16G', '存储': '500GB SSD', '实例个数': '1（3节点集群）', '付费类型': '包年包月', '付费周期': '1年', '单价（元/月）': '2,880.00', '总价（元）': '34,560.00', '所属项目': '数据管道', '用途说明': '数据分析日志检索（申请人已撤回，改为使用现有集群）' }
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
    formData: { '申请类型': '子账号申请', '权限包': 'ECS 运维（ecs-ops）', '有效期': '长期持有', '绑定主账号': 'biz-prod (LTAI****k9Xm)', '用途说明': '前端构建部署使用' }
  }
];

MockData.auditLogs = [
  { time: '2026/03/12 10:23:45', operator: '王浩然', dept: '基础架构部', opType: '资源操作', opTypeColor: 'blue', target: 'ecs-prod-web-01', desc: '申请 ECS 云服务器', ip: '10.128.0.55', before: '--', after: '审批中' },
  { time: '2026/03/12 09:15:30', operator: '李思远', dept: '基础架构部', opType: '权限变更', opTypeColor: 'orange', target: '用户: 陈天宇', desc: '分配角色「部门运维」', ip: '10.128.0.42', before: '无角色', after: '部门运维' },
  { time: '2026/03/11 16:40:12', operator: '张明远', dept: '基础架构部', opType: '组织架构', opTypeColor: 'cyan', target: 'K8s运维小组', desc: '创建二级组', ip: '10.128.0.10', before: '--', after: '已创建' },
  { time: '2026/03/11 14:22:08', operator: '赵雪晴', dept: '基础架构部', opType: '资源操作', opTypeColor: 'blue', target: 'slb-prod-api-gw', desc: '变更 SLB 负载均衡配置', ip: '10.128.0.67', before: '4C8G', after: '8C16G' },
  { time: '2026/03/11 11:05:33', operator: '张明远', dept: '基础架构部', opType: '云账号', opTypeColor: 'green', target: '阿里云 - infra-main', desc: '绑定部门主账号', ip: '10.128.0.10', before: '未绑定', after: '已绑定' },
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
];

// 各部门核验人配置（对应"资源创建设置"中的"自动填充模板配置"里的表单核验人）
MockData.verifiers = {
  'dept-infra': { name: '李思远', username: 'lisy' },   // 基础架构部核验人
  'dept-biz': { name: '刘佳琪', username: 'liujq' },    // 业务研发部核验人
  'dept-data': { name: '周文博', username: 'zhouwb' }   // 数据平台部核验人
};

