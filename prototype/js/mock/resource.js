'use strict';
// CMP 原型 - Mock 数据层 - 资源数据（项目、资源、资源目录、未归组资源）

MockData.projects = [
  { name: '核心基础设施', desc: '基础架构核心服务资源集合', dept: '基础架构部', creator: '张明远', resourceCount: 42, createTime: '2025/08/10 09:00:00' },
  { name: '网络基础设施', desc: '网络层核心资源', dept: '基础架构部', creator: '张明远', resourceCount: 18, createTime: '2025/08/10 09:30:00' },
  { name: '用户中心', desc: '用户服务全链路资源', dept: '业务研发部', creator: '刘佳琪', resourceCount: 35, createTime: '2025/09/01 10:00:00' },
  { name: '订单系统', desc: '订单交易核心服务', dept: '业务研发部', creator: '刘佳琪', resourceCount: 22, createTime: '2025/09/15 11:00:00' },
  { name: '数据管道', desc: '数据采集与处理管道', dept: '数据平台部', creator: '周文博', resourceCount: 11, createTime: '2025/10/01 09:00:00' },
  { name: '前端资源池', desc: '前端静态资源与CDN', dept: '业务研发部', creator: '刘佳琪', resourceCount: 5, createTime: '2025/11/01 14:00:00' }
];

MockData.resources = [
  { name: 'ecs-prod-web-01', resId: 'i-bp1a2b3c4d5e6f', type: 'ECS', typeColor: 'blue', shape: '实例型', group: '容器平台组', groupId: 'grp-container', project: '核心基础设施', vendor: '阿里云', perm: 'master', permColor: 'green', status: '运行中', statusClass: 'success', applicant: '王浩然', authorizations: [
    { user: '张明远', perm: 'developer', time: '2025/10/12 14:30' },
    { user: '李思涵', perm: 'reporter', time: '2025/11/05 09:15' }
  ], connInfo: { privateIp: '172.16.10.10', publicIp: '47.96.21.31', spec: '4 vCPU / 8 GB', os: 'CentOS 7.9 64位', vpc: 'vpc-prod-hangzhou (172.16.0.0/16)', zone: '华东1（杭州）可用区G', loginUser: 'root' } },
  { name: 'rds-prod-mysql-01', resId: 'rm-bp1x2y3z4w5v', type: 'RDS', typeColor: 'orange', shape: '实例型', group: '容器平台组', groupId: 'grp-container', project: '核心基础设施', vendor: '阿里云', perm: 'master', permColor: 'green', status: '运行中', statusClass: 'success', applicant: '王浩然', authorizations: [
    { user: '赵天宇', perm: 'developer', time: '2025/10/20 16:00' }
  ], connInfo: { endpoint: 'rm-bp1x2y3z4w5v.mysql.rds.aliyuncs.com', port: 3306, version: 'MySQL 8.0', spec: '2核4GB RDS通用型', maxConn: 800, charset: 'utf8mb4' } },
  { name: 'redis-prod-cache-01', resId: 'r-bp6a7b8c9d0e', type: 'Redis', typeColor: 'red', shape: '实例型', group: '容器平台组', groupId: 'grp-container', project: '核心基础设施', vendor: '阿里云', perm: 'developer', permColor: 'cyan', status: '运行中', statusClass: 'success',
    connInfo: { endpoint: 'r-bp6a7b8c9d0e.redis.rds.aliyuncs.com', port: 6379, version: 'Redis 7.0', spec: '4 GB 标准版', passwd: '（联系 master 获取）' } },
  { name: 'slb-prod-api-gw', resId: 'lb-bp1m2n3o4p5q', type: 'SLB', typeColor: 'cyan', shape: '实例型', group: '网络组', groupId: 'grp-network', project: '网络基础设施', vendor: '阿里云', perm: 'reporter', permColor: 'default', status: '运行中', statusClass: 'success',
    connInfo: { publicIp: '39.108.55.123', privateIp: '172.16.100.1', listeners: 'HTTPS:443, HTTP:80', region: '华东1（杭州）', bandwidth: '100 Mbps' } },
  { name: 'kafka-prod-msg-01', resId: 'alikafka_post-cn-v0h1a2b3', type: 'Kafka', typeColor: 'purple', shape: '实例型', group: '容器平台组', groupId: 'grp-container', project: '核心基础设施', vendor: '阿里云', perm: 'developer', permColor: 'cyan', status: '运行中', statusClass: 'success',
    connInfo: { bootstrapServers: '172.16.10.20:9092,172.16.10.21:9092,172.16.10.22:9092', saslEndpoint: 'alikafka_post-cn-v0h1a2b3.alikafka.aliyuncs.com:9093', version: 'Kafka 2.8.0', region: '华东1（杭州）' } },
  { name: 'es-prod-log-cluster', resId: 'es-cn-x1y2z3a4b5', type: 'ES', typeColor: 'green', shape: '集群型', group: '存储组', groupId: 'grp-storage', project: '核心基础设施', vendor: '阿里云', perm: 'developer', permColor: 'cyan', status: '运行中', statusClass: 'success',
    connInfo: { httpEndpoint: 'https://es-cn-x1y2z3a4b5.elasticsearch.aliyuncs.com:9200', kibanaUrl: 'https://es-cn-x1y2z3a4b5.kibana.aliyuncs.com:5601', version: 'Elasticsearch 7.10', spec: '3节点 × 4核16GB' } },
  { name: 'oss-prod-static', resId: 'infra-static-assets', type: 'OSS', typeColor: 'default', shape: '实例型', group: '容器平台组', groupId: 'grp-container', project: '核心基础设施', vendor: '阿里云', perm: 'master', permColor: 'green', status: '正常', statusClass: 'success',
    connInfo: { bucket: 'infra-static-assets', region: 'oss-cn-hangzhou', endpoint: 'infra-static-assets.oss-cn-hangzhou.aliyuncs.com', internalEndpoint: 'infra-static-assets.oss-cn-hangzhou-internal.aliyuncs.com', acl: '私有' } },
  { name: 'ecs-staging-app-01', resId: 'i-bp9x8y7z6w5v', type: 'ECS', typeColor: 'blue', shape: '实例型', group: '容器平台组', groupId: 'grp-container', project: '核心基础设施', vendor: '阿里云', perm: 'developer', permColor: 'cyan', status: '变配中', statusClass: 'processing',
    connInfo: { privateIp: '172.16.10.11', publicIp: '--', spec: '2 vCPU / 4 GB（变配中）', os: 'Ubuntu 22.04 LTS 64位', vpc: 'vpc-prod-hangzhou (172.16.0.0/16)', zone: '华东1（杭州）可用区G', loginUser: 'ubuntu' } },
  { name: 'ecs-prod-web-02', resId: 'i-bp2c3d4e5f6g', type: 'ECS', typeColor: 'blue', shape: '实例型', group: '容器平台组', groupId: 'grp-container', project: '核心基础设施', vendor: '阿里云', perm: 'master', permColor: 'green', status: '运行中', statusClass: 'success',
    connInfo: { privateIp: '172.16.10.12', publicIp: '47.96.21.32', spec: '4 vCPU / 8 GB', os: 'CentOS 7.9 64位', vpc: 'vpc-prod-hangzhou (172.16.0.0/16)', zone: '华东1（杭州）可用区G', loginUser: 'root' } },
  { name: 'ecs-prod-web-03', resId: 'i-bp3d4e5f6g7h', type: 'ECS', typeColor: 'blue', shape: '实例型', group: '容器平台组', groupId: 'grp-container', project: '核心基础设施', vendor: '阿里云', perm: 'developer', permColor: 'cyan', status: '运行中', statusClass: 'success',
    connInfo: { privateIp: '172.16.10.13', publicIp: '47.96.21.33', spec: '4 vCPU / 8 GB', os: 'CentOS 7.9 64位', vpc: 'vpc-prod-hangzhou (172.16.0.0/16)', zone: '华东1（杭州）可用区H', loginUser: 'root' } },
  { name: 'rds-prod-mysql-02', resId: 'rm-bp2y3z4w5v6x', type: 'RDS', typeColor: 'orange', shape: '实例型', group: '容器平台组', groupId: 'grp-container', project: '核心基础设施', vendor: '阿里云', perm: 'developer', permColor: 'cyan', status: '运行中', statusClass: 'success',
    connInfo: { endpoint: 'rm-bp2y3z4w5v6x.mysql.rds.aliyuncs.com', port: 3306, version: 'MySQL 8.0', spec: '4核8GB RDS通用型', maxConn: 1600, charset: 'utf8mb4' } },
  { name: 'slb-prod-internal', resId: 'lb-bp2n3o4p5q6r', type: 'SLB', typeColor: 'cyan', shape: '实例型', group: '网络组', groupId: 'grp-network', project: '网络基础设施', vendor: '阿里云', perm: 'developer', permColor: 'cyan', status: '运行中', statusClass: 'success',
    connInfo: { publicIp: '--', privateIp: '172.16.100.2', listeners: 'TCP:8080, TCP:8443', region: '华东1（杭州）', bandwidth: '内网不限带宽' } },
  { name: 'ecs-user-api-01', resId: 'i-bp4e5f6g7h8i', type: 'ECS', typeColor: 'blue', shape: '实例型', group: '用户服务组', groupId: 'grp-user', project: '用户中心', vendor: '阿里云', perm: 'master', permColor: 'green', status: '运行中', statusClass: 'success', applicant: '刘佳琪', authorizations: [
    { user: '王浩然', perm: 'developer', time: '2025/12/01 10:30' }
  ], connInfo: { privateIp: '172.16.20.10', publicIp: '47.97.18.50', spec: '8 vCPU / 16 GB', os: 'CentOS 7.9 64位', vpc: 'vpc-biz-hangzhou (172.16.0.0/16)', zone: '华东1（杭州）可用区F', loginUser: 'root' } },
  { name: 'rds-user-mysql', resId: 'rm-bp3z4w5v6x7y', type: 'RDS', typeColor: 'orange', shape: '实例型', group: '用户服务组', groupId: 'grp-user', project: '用户中心', vendor: '阿里云', perm: 'master', permColor: 'green', status: '运行中', statusClass: 'success', applicant: '刘佳琪', authorizations: [],
    connInfo: { endpoint: 'rm-bp3z4w5v6x7y.mysql.rds.aliyuncs.com', port: 3306, version: 'MySQL 8.0', spec: '4核16GB RDS高可用版', maxConn: 3200, charset: 'utf8mb4' } },
  { name: 'redis-user-session', resId: 'r-bp7b8c9d0e1f', type: 'Redis', typeColor: 'red', shape: '实例型', group: '用户服务组', groupId: 'grp-user', project: '用户中心', vendor: '阿里云', perm: 'developer', permColor: 'cyan', status: '运行中', statusClass: 'success',
    connInfo: { endpoint: 'r-bp7b8c9d0e1f.redis.rds.aliyuncs.com', port: 6379, version: 'Redis 7.0', spec: '8 GB 集群版', passwd: '（联系 master 获取）' } },
  { name: 'ecs-order-api-01', resId: 'i-bp5f6g7h8i9j', type: 'ECS', typeColor: 'blue', shape: '实例型', group: '订单交易组', groupId: 'grp-order', project: '订单系统', vendor: '阿里云', perm: 'master', permColor: 'green', status: '运行中', statusClass: 'success', applicant: '陈晓峰', authorizations: [
    { user: '李思涵', perm: 'developer', time: '2026/01/15 11:00' }
  ], connInfo: { privateIp: '172.16.30.10', publicIp: '47.97.20.60', spec: '8 vCPU / 16 GB', os: 'CentOS 7.9 64位', vpc: 'vpc-biz-hangzhou (172.16.0.0/16)', zone: '华东1（杭州）可用区F', loginUser: 'root' } },
  { name: 'rds-order-mysql', resId: 'rm-bp4w5v6x7y8z', type: 'RDS', typeColor: 'orange', shape: '实例型', group: '订单交易组', groupId: 'grp-order', project: '订单系统', vendor: '阿里云', perm: 'master', permColor: 'green', status: '运行中', statusClass: 'success',
    connInfo: { endpoint: 'rm-bp4w5v6x7y8z.mysql.rds.aliyuncs.com', port: 3306, version: 'MySQL 8.0', spec: '8核32GB RDS高可用版', maxConn: 6400, charset: 'utf8mb4' } },
  { name: 'kafka-order-msg', resId: 'alikafka_post-cn-w1h2a3b4', type: 'Kafka', typeColor: 'purple', shape: '实例型', group: '订单交易组', groupId: 'grp-order', project: '订单系统', vendor: '阿里云', perm: 'developer', permColor: 'cyan', status: '运行中', statusClass: 'success',
    connInfo: { bootstrapServers: '172.16.30.20:9092,172.16.30.21:9092,172.16.30.22:9092', saslEndpoint: 'alikafka_post-cn-w1h2a3b4.alikafka.aliyuncs.com:9093', version: 'Kafka 2.8.0', region: '华东1（杭州）' } },
  { name: 'es-data-analytics', resId: 'es-cn-y2z3a4b5c6', type: 'ES', typeColor: 'green', shape: '集群型', group: '大数据组', groupId: 'grp-bigdata', project: '数据管道', vendor: '阿里云', perm: 'master', permColor: 'green', status: '运行中', statusClass: 'success',
    connInfo: { httpEndpoint: 'https://es-cn-y2z3a4b5c6.elasticsearch.aliyuncs.com:9200', kibanaUrl: 'https://es-cn-y2z3a4b5c6.kibana.aliyuncs.com:5601', version: 'Elasticsearch 7.10', spec: '5节点 × 8核32GB' } },
  { name: 'kafka-data-pipeline', resId: 'alikafka_post-cn-x2h3a4b5', type: 'Kafka', typeColor: 'purple', shape: '实例型', group: '大数据组', groupId: 'grp-bigdata', project: '数据管道', vendor: '阿里云', perm: 'developer', permColor: 'cyan', status: '运行中', statusClass: 'success',
    connInfo: { bootstrapServers: '172.16.40.20:9092,172.16.40.21:9092,172.16.40.22:9092', saslEndpoint: 'alikafka_post-cn-x2h3a4b5.alikafka.aliyuncs.com:9093', version: 'Kafka 2.8.0', region: '华东1（杭州）' } },
  { name: 'oss-data-lake', resId: 'data-lake-prod', type: 'OSS', typeColor: 'default', shape: '实例型', group: '大数据组', groupId: 'grp-bigdata', project: '数据管道', vendor: '阿里云', perm: 'master', permColor: 'green', status: '正常', statusClass: 'success',
    connInfo: { bucket: 'data-lake-prod', region: 'oss-cn-hangzhou', endpoint: 'data-lake-prod.oss-cn-hangzhou.aliyuncs.com', internalEndpoint: 'data-lake-prod.oss-cn-hangzhou-internal.aliyuncs.com', acl: '私��' } },
  { name: 'ecs-frontend-cdn', resId: 'i-bp6g7h8i9j0k', type: 'ECS', typeColor: 'blue', shape: '实例型', group: '前端组', groupId: 'grp-frontend', project: '前端资源池', vendor: '阿里云', perm: 'developer', permColor: 'cyan', status: '运行中', statusClass: 'success',
    connInfo: { privateIp: '172.16.50.10', publicIp: '121.40.88.20', spec: '2 vCPU / 4 GB', os: 'Ubuntu 22.04 LTS 64位', vpc: 'vpc-biz-hangzhou (172.16.0.0/16)', zone: '华东1（杭州）可用区E', loginUser: 'ubuntu' } },
  { name: 'oss-frontend-static', resId: 'frontend-static-prod', type: 'OSS', typeColor: 'default', shape: '实例型', group: '前端组', groupId: 'grp-frontend', project: '前端资源池', vendor: '阿里云', perm: 'master', permColor: 'green', status: '正常', statusClass: 'success',
    connInfo: { bucket: 'frontend-static-prod', region: 'oss-cn-hangzhou', endpoint: 'frontend-static-prod.oss-cn-hangzhou.aliyuncs.com', internalEndpoint: 'frontend-static-prod.oss-cn-hangzhou-internal.aliyuncs.com', acl: '公共读' } },
  { name: 'cdn-frontend-pack', resId: 'cdnpack-2026-q1', type: 'CDN', typeColor: 'purple', shape: '资源包', group: '前端组', groupId: 'grp-frontend', project: '前端资源池', vendor: '阿里云', perm: 'reporter', permColor: 'default', status: '使用中', statusClass: 'success', monthlyCost: '3,200.00', packExpire: '2026/06/30',
    connInfo: { domain: 'static.example.com', cname: 'static.example.com.w.kunluncan.com', packType: 'CDN 流量包', expire: '2026/06/30', remaining: '约 2.1 TB', region: '全球（不含中国大陆）' } },
  { name: 'maxcompute-data-pack', resId: 'mcpack-2026-annual', type: 'MaxCompute', typeColor: 'green', shape: '资源包', group: '大数据组', groupId: 'grp-bigdata', project: '数据管道', vendor: '阿里云', perm: 'developer', permColor: 'cyan', status: '使用中', statusClass: 'success', monthlyCost: '8,500.00', packExpire: '2026/12/31',
    connInfo: { project: 'data-pipeline-prod', endpoint: 'http://service.cn-hangzhou.maxcompute.aliyun-inc.com/api', region: '华东1（杭州）', expire: '2026/12/31' } }
];

MockData.resCatalog = [
  { name: '计算类', color: '#1890ff', types: [
    { name: 'ECS 云服务器', code: 'ECS', vendor: '阿里云', queryApi: 'DescribeInstances', operations: ['创建', '变配', '回收'], approvalOps: ['创建', '变配', '回收'], allowApply: true, allowDisplay: true,
      permOps: { master: ['创建', '变配', '回收', '授权管理'], developer: ['查看详情'], reporter: ['查看详情'] } },
    { name: 'K8S 集群', code: 'K8S', vendor: '阿里云', queryApi: 'DescribeClusters', operations: ['创建', '变配', '回收'], approvalOps: ['创建', '变配', '回收'], allowApply: true, allowDisplay: true,
      permOps: { master: ['创建', '变配', '回收', '授权管理'], developer: ['查看详情'], reporter: ['查看详情'] } }
  ]},
  { name: '数据库类', color: '#1890ff', types: [
    { name: 'RDS 云数据库', code: 'RDS', vendor: '阿里云', queryApi: 'DescribeDBInstances', operations: ['创建', '变配', '回收'], approvalOps: ['创建', '变配', '回收'], allowApply: true, allowDisplay: true,
      permOps: { master: ['创建', '变配', '回收', '授权管理'], developer: ['查看详情', '数据库账号管理'], reporter: ['查看详情'] } },
    { name: 'PolarDB PostgreSQL', code: 'POLARDB_PG', vendor: '阿里云', queryApi: 'DescribeDBClusters', operations: ['创建', '变配', '回收'], approvalOps: ['创建', '变配', '回收'], allowApply: true, allowDisplay: true,
      permOps: { master: ['创建', '变配', '回收', '授权管理'], developer: ['查看详情', '数据库账号管理'], reporter: ['查看详情'] } },
    { name: 'MongoDB', code: 'MONGODB', vendor: '阿里云', queryApi: 'DescribeDBInstances', operations: ['创建', '变配', '回收'], approvalOps: ['创建', '变配', '回收'], allowApply: true, allowDisplay: true,
      permOps: { master: ['创建', '变配', '回收', '授权管理'], developer: ['查看详情', '数据库账号管理'], reporter: ['查看详情'] } },
    { name: 'Redis 缓存', code: 'REDIS', vendor: '阿里云', queryApi: 'DescribeInstances', operations: ['创建', '变配', '回收'], approvalOps: ['创建', '变配', '回收'], allowApply: true, allowDisplay: true,
      permOps: { master: ['创建', '变配', '回收', '授权管理'], developer: ['查看详情', '查看连接信息'], reporter: ['查看详情'] } }
  ]},
  { name: '网络与负载均衡类', color: '#1890ff', types: [
    { name: 'SLB 负载均衡', code: 'SLB', vendor: '阿里云', queryApi: 'DescribeLoadBalancers', operations: ['创建', '变配', '回收'], approvalOps: ['创建', '变配', '回收'], allowApply: true, allowDisplay: true,
      permOps: { master: ['创建', '变配', '回收', '授权管理'], developer: ['查看详情'], reporter: ['查看详情'] } },
    { name: 'ALB 应用负载均衡', code: 'ALB', vendor: '阿里云', queryApi: 'DescribeLoadBalancers', operations: ['创建', '变配', '回收'], approvalOps: ['创建', '变配', '回收'], allowApply: true, allowDisplay: true,
      permOps: { master: ['创建', '变配', '回收', '授权管理'], developer: ['查看详情'], reporter: ['查看详情'] } },
    { name: 'NLB 网络负载均衡', code: 'NLB', vendor: '阿里云', queryApi: 'DescribeLoadBalancers', operations: ['创建', '变配', '回收'], approvalOps: ['创建', '变配', '回收'], allowApply: true, allowDisplay: true,
      permOps: { master: ['创建', '变配', '回收', '授权管理'], developer: ['查看详情'], reporter: ['查看详情'] } },
    { name: '云原生网关', code: 'CNG', vendor: '阿里云', queryApi: 'DescribeGateways', operations: ['创建', '变配', '回收'], approvalOps: ['创建', '变配', '回收'], allowApply: true, allowDisplay: true,
      permOps: { master: ['创建', '变配', '回收', '授权管理'], developer: ['查看详情'], reporter: ['查看详情'] } }
  ]},
  { name: '中间件类', color: '#1890ff', types: [
    { name: 'Kafka 消息队列', code: 'KAFKA', vendor: '阿里云', queryApi: 'GetInstanceList', operations: ['创建', '变配', '回收'], approvalOps: ['创建', '变配', '回收'], allowApply: true, allowDisplay: true,
      permOps: { master: ['创建', '变配', '回收', '授权管理'], developer: ['查看详情', '查看接入信息'], reporter: ['查看详情'] } }
  ]},
  { name: '大数据与搜索分析类', color: '#1890ff', types: [
    { name: 'Elasticsearch', code: 'ES', vendor: '阿里云', queryApi: 'ListInstance', operations: ['创建', '变配', '回收'], approvalOps: ['创建', '变配', '回收'], allowApply: true, allowDisplay: true,
      permOps: { master: ['创建', '变配', '回收', '授权管理'], developer: ['查看详情', '查看接入地址'], reporter: ['查看详情'] } },
    { name: 'MaxCompute', code: 'MAXCOMPUTE', vendor: '阿里云', queryApi: 'ListProjects', operations: ['创建', '回收'], approvalOps: ['创建', '回收'], allowApply: true, allowDisplay: true,
      permOps: { master: ['创建', '回收', '授权管理'], developer: ['查看详情', '提交作业'], reporter: ['查看详情'] } },
    { name: 'Flink 实时计算', code: 'FLINK', vendor: '阿里云', queryApi: 'ListWorkspaces', operations: ['创建', '变配', '回收'], approvalOps: ['创建', '变配', '回收'], allowApply: true, allowDisplay: true,
      permOps: { master: ['创建', '变配', '回收', '授权管理'], developer: ['查看详情', '提交作业'], reporter: ['查看详情'] } },
    { name: '实时数仓 Hologres', code: 'HOLOGRES', vendor: '阿里云', queryApi: 'ListInstances', operations: ['创建', '变配', '回收'], approvalOps: ['创建', '变配', '回收'], allowApply: true, allowDisplay: true,
      permOps: { master: ['创建', '变配', '回收', '授权管理'], developer: ['查看详情', '数据库账号管理'], reporter: ['查看详情'] } }
  ]},
  { name: '存储类', color: '#1890ff', types: [
    { name: 'OSS 对象存储', code: 'OSS', vendor: '阿里云', queryApi: 'ListBuckets', operations: ['创建', '回收'], approvalOps: ['创建', '回收'], allowApply: true, allowDisplay: true,
      permOps: { master: ['创建', '回收', '授权管理'], developer: ['查看详情', '读写 Bucket'], reporter: ['查看详情', '只读 Bucket'] } },
    { name: '块存储 ESSD', code: 'ESSD', vendor: '阿里云', queryApi: 'DescribeDisks', operations: ['创建', '变配', '回收'], approvalOps: ['创建', '变配', '回收'], allowApply: true, allowDisplay: true,
      permOps: { master: ['创建', '变配', '回收', '授权管理'], developer: ['查看详情'], reporter: ['查看详情'] } },
    { name: '文件存储 NAS', code: 'NAS', vendor: '阿里云', queryApi: 'DescribeFileSystems', operations: ['创建', '变配', '回收'], approvalOps: ['创建', '变配', '回收'], allowApply: true, allowDisplay: true,
      permOps: { master: ['创建', '变配', '回收', '授权管理'], developer: ['查看详情', '读写文件系统'], reporter: ['查看详情', '只读文件系统'] } },
    { name: 'CDN 流量包', code: 'CDN', vendor: '阿里云', queryApi: 'DescribeUserDomains', operations: ['创建', '回收'], approvalOps: ['创建', '回收'], allowApply: true, allowDisplay: true,
      permOps: { master: ['创建', '回收', '授权管理'], developer: ['查看详情'], reporter: ['查看详情'] } }
  ]},
  { name: '网络基础类', color: '#faad14', types: [
    { name: 'VPC 专有网络', code: 'VPC', vendor: '阿里云', queryApi: 'DescribeVpcs', operations: ['同步'], approvalOps: [], allowApply: false, allowDisplay: true,
      permOps: { master: ['查看详情'], developer: ['查看详情'], reporter: ['查看详情'] } },
    { name: 'NAT 网关', code: 'NAT', vendor: '阿里云', queryApi: 'DescribeNatGateways', operations: ['同步'], approvalOps: [], allowApply: false, allowDisplay: true,
      permOps: { master: ['查看详情'], developer: ['查看详情'], reporter: ['查看详情'] } },
    { name: '交换机 VSwitch', code: 'VSWITCH', vendor: '阿里云', queryApi: 'DescribeVSwitches', operations: ['同步'], approvalOps: [], allowApply: false, allowDisplay: true,
      permOps: { master: ['查看详情'], developer: ['查看详情'], reporter: ['查看详情'] } },
    { name: '安全组', code: 'SG', vendor: '阿里云', queryApi: 'DescribeSecurityGroups', operations: ['同步'], approvalOps: [], allowApply: false, allowDisplay: true,
      permOps: { master: ['查看详情'], developer: ['查看详情'], reporter: ['查看详情'] } }
  ]}
];

MockData.ungroupedResources = [
  { name: 'ecs-temp-debug-01', resId: 'i-bp3k4l5m6n7o', type: 'ECS', typeColor: 'blue', source: '子账号创建 (wanghr-dev)', discoverTime: '2026/02/28 09:00:00', mainAccount: 'infra-main (LTAI****7F2Q)', dept: '基础架构部' },
  { name: 'rds-test-pg-01', resId: 'rm-bp8x9y0z1w2v', type: 'RDS', typeColor: 'orange', source: '子账号创建 (chenty-dev)', discoverTime: '2026/03/05 14:00:00', mainAccount: 'infra-main (LTAI****7F2Q)', dept: '基础架构部' },
  { name: 'oss-backup-temp', resId: 'backup-temp-202603', type: 'OSS', typeColor: 'default', source: '存量子账号资源', discoverTime: '2026/03/10 11:00:00', mainAccount: 'biz-prod (LTAI****k9Xm)', dept: '业务研发部' },
  { name: 'ecs-dev-test-02', resId: 'i-bp4l5m6n7o8p', type: 'ECS', typeColor: 'blue', source: '子账号创建 (lisy-admin)', discoverTime: '2026/03/12 08:30:00', mainAccount: 'infra-main (LTAI****7F2Q)', dept: '基础架构部' },
  { name: 'redis-temp-test', resId: 'r-bp8c9d0e1f2g', type: 'Redis', typeColor: 'red', source: '子账号创建 (wanghr-dev)', discoverTime: '2026/03/14 16:00:00', mainAccount: 'infra-main (LTAI****7F2Q)', dept: '基础架构部' },
  { name: 'ecs-legacy-01', resId: 'i-bp5m6n7o8p9q', type: 'ECS', typeColor: 'blue', source: '组解散上浮（旧测试组）', discoverTime: '2026/01/15 10:00:00', mainAccount: 'infra-main (LTAI****7F2Q)', dept: '基础架构部' },
  { name: 'redis-legacy-cache', resId: 'r-bp9d0e1f2g3h', type: 'Redis', typeColor: 'red', source: '组解散上浮（旧测试组）', discoverTime: '2026/01/15 10:00:00', mainAccount: 'infra-main (LTAI****7F2Q)', dept: '基础架构部' },
  { name: 'rds-legacy-mysql', resId: 'rm-bp5w6v7x8y9z', type: 'RDS', typeColor: 'orange', source: '组解散上浮（旧测试组）', discoverTime: '2026/01/15 10:00:00', mainAccount: 'biz-prod (LTAI****k9Xm)', dept: '业务研发部' }
];
