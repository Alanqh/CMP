'use strict';
// CMP 原型 - Mock 数据层 - 配置数据（平台模板、审批流程、部门配置）

MockData.platformTemplates = [
  { id: 'ptpl-1', templateName: 'ECS申请模板', resType: 'ECS 云服务器', category: '计算类', opType: '创建', apiEndpoint: 'RunInstances', updateTime: '2025/11/20', fieldGroups: [
    { groupName: '基础配置', fields: [
      { name: '实例名称', param: 'InstanceName', type: 'string', visible: true, required: true },
      { name: '地域', param: 'RegionId', type: 'select', visible: true, required: true, referenceOptions: '华北2（北京）=cn-beijing,华东1（杭州）=cn-hangzhou,华东2（上海）=cn-shanghai,华南1（深圳）=cn-shenzhen' },
      { name: '可用区', param: 'ZoneId', type: 'select', visible: true, required: true, referenceOptions: '' },
      { name: '实例规格', param: 'InstanceType', type: 'select', visible: true, required: true, referenceOptions: 'ecs.c7.large,ecs.c7.xlarge,ecs.c7.2xlarge,ecs.g7.2xlarge' }
    ]},
    { groupName: '存储配置', fields: [
      { name: '系统盘类型', param: 'SystemDisk.Category', type: 'select', visible: true, required: true, referenceOptions: 'ESSD 云盘,高效云盘,SSD 云盘' },
      { name: '系统盘大小(GB)', param: 'SystemDisk.Size', type: 'number', visible: true, required: true, min: 20, max: 500, decimals: 0 },
      { name: '数据盘类型', param: 'DataDisk.1.Category', type: 'select', visible: true, required: false, referenceOptions: 'ESSD 云盘,高效云盘,SSD 云盘' },
      { name: '数据盘大小(GB)', param: 'DataDisk.1.Size', type: 'number', visible: true, required: false, min: 20, max: 32768, decimals: 0 }
    ]},
    { groupName: '网络配置', fields: [
      { name: 'VPC', param: 'VpcId', type: 'select', visible: true, required: true, referenceOptions: '' },
      { name: '交换机', param: 'VSwitchId', type: 'select', visible: true, required: true, referenceOptions: '' },
      { name: '安全组', param: 'SecurityGroupId', type: 'select', visible: true, required: true, referenceOptions: '' }
    ]},
    { groupName: '其他', fields: [
      { name: '镜像', param: 'ImageId', type: 'select', visible: true, required: true, referenceOptions: 'CentOS 7.9 64位,Alibaba Cloud Linux 3,Ubuntu 22.04 64位' },
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
  { id: 'ptpl-4', templateName: 'K8S集群申请模板', resType: 'K8S 集群', category: '计算类', opType: '创建', apiEndpoint: 'CreateCluster', updateTime: '2025/12/15', fieldGroups: [
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
  { id: 'ptpl-5', templateName: 'RDS申请模板', resType: 'RDS 云数据库', category: '数据库类', opType: '创建', apiEndpoint: 'CreateDBInstance', updateTime: '2025/12/01', fieldGroups: [
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
  { id: 'ptpl-7', templateName: 'PolarDB申请模板', resType: 'PolarDB PostgreSQL', category: '数据库类', opType: '创建', apiEndpoint: 'CreateDBCluster', updateTime: '2025/12/10', fieldGroups: [
    { groupName: '集群配置', fields: [
      { name: '集群名称', param: 'DBClusterDescription', type: 'string', visible: true, required: true, regex: '' },
      { name: '地域', param: 'RegionId', type: 'select', visible: true, required: true, options: '华北2（北京）,华东1（杭州）,华东2（上海）' },
      { name: '节点规格', param: 'DBNodeClass', type: 'select', visible: true, required: true, options: 'polar.pg.x4.medium,polar.pg.x4.large,polar.pg.x8.xlarge' },
      { name: '节点数量', param: 'Amount', type: 'number', visible: true, required: true, min: 1, max: 16, decimals: 0 }
    ]}
  ]},
  { id: 'ptpl-8', templateName: 'MongoDB申请模板', resType: 'MongoDB', category: '数据库类', opType: '创建', apiEndpoint: 'CreateDBInstance', updateTime: '2025/12/10', fieldGroups: [
    { groupName: '实例配置', fields: [
      { name: '实例名称', param: 'DBInstanceDescription', type: 'string', visible: true, required: true, regex: '' },
      { name: '地域', param: 'RegionId', type: 'select', visible: true, required: true, options: '华北2（北京）,华东1（杭州）,华东2（上海）' },
      { name: '实例规格', param: 'DBInstanceClass', type: 'select', visible: true, required: true, options: 'dds.mongo.mid,dds.mongo.standard,dds.mongo.large' },
      { name: '存储空间(GB)', param: 'DBInstanceStorage', type: 'number', visible: true, required: true, min: 10, max: 3000, decimals: 0 }
    ]}
  ]},
  { id: 'ptpl-9', templateName: 'Redis申请模板', resType: 'Redis 缓存', category: '数据库类', opType: '创建', apiEndpoint: 'CreateInstance', updateTime: '2025/12/05', fieldGroups: [
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
  { id: 'ptpl-10', templateName: 'SLB申请模板', resType: 'SLB 负载均衡', category: '网络与负载均衡类', opType: '创建', apiEndpoint: 'CreateLoadBalancer', updateTime: '2025/12/08', fieldGroups: [
    { groupName: '基础配置', fields: [
      { name: '实例名称', param: 'LoadBalancerName', type: 'string', visible: true, required: true, regex: '' },
      { name: '地域', param: 'RegionId', type: 'select', visible: true, required: true, options: '华北2（北京）,华东1（杭州）,华东2（上海）' },
      { name: '网络类型', param: 'AddressType', type: 'select', visible: true, required: true, options: 'internet,intranet' },
      { name: '规格', param: 'LoadBalancerSpec', type: 'select', visible: true, required: true, options: 'slb.s1.small,slb.s2.small,slb.s3.small' }
    ]}
  ]},
  { id: 'ptpl-11', templateName: 'ALB申请模板', resType: 'ALB 应用负载均衡', category: '网络与负载均衡类', opType: '创建', apiEndpoint: 'CreateLoadBalancer', updateTime: '2025/12/08', fieldGroups: [
    { groupName: '基础配置', fields: [
      { name: '实例名称', param: 'LoadBalancerName', type: 'string', visible: true, required: true, regex: '' },
      { name: '地域', param: 'RegionId', type: 'select', visible: true, required: true, options: '华北2（北京）,华东1（杭州）,华东2（上海）' },
      { name: 'VPC', param: 'VpcId', type: 'select', visible: true, required: true, options: 'vpc-prod-beijing,vpc-prod-hangzhou' }
    ]}
  ]},
  { id: 'ptpl-12', templateName: 'NLB申请模板', resType: 'NLB 网络负载均衡', category: '网络与负载均衡类', opType: '创建', apiEndpoint: 'CreateLoadBalancer', updateTime: '2025/12/08', fieldGroups: [
    { groupName: '基础配置', fields: [
      { name: '实例名称', param: 'LoadBalancerName', type: 'string', visible: true, required: true, regex: '' },
      { name: '地域', param: 'RegionId', type: 'select', visible: true, required: true, options: '华北2（北京）,华东1（杭州）,华东2（上海）' },
      { name: 'VPC', param: 'VpcId', type: 'select', visible: true, required: true, options: 'vpc-prod-beijing,vpc-prod-hangzhou' }
    ]}
  ]},
  { id: 'ptpl-13', templateName: '云原生网关申请模板', resType: '云原生网关', category: '网络与负载均衡类', opType: '创建', apiEndpoint: 'CreateGateway', updateTime: '2025/12/08', fieldGroups: [
    { groupName: '基础配置', fields: [
      { name: '网关名称', param: 'GatewayName', type: 'string', visible: true, required: true, regex: '' },
      { name: '地域', param: 'RegionId', type: 'select', visible: true, required: true, options: '华北2（北京）,华东1（杭州）,华东2（上海）' },
      { name: '规格', param: 'Spec', type: 'select', visible: true, required: true, options: '基础版,专业版,企业版' }
    ]}
  ]},
  { id: 'ptpl-14', templateName: 'Kafka申请模板', resType: 'Kafka 消息队列', category: '中间件类', opType: '创建', apiEndpoint: 'CreatePostPayOrder', updateTime: '2025/12/10', fieldGroups: [
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
  { id: 'ptpl-16', templateName: 'ES申请模板', resType: 'Elasticsearch', category: '大数据与搜索分析类', opType: '创建', apiEndpoint: 'createInstance', updateTime: '2026/01/05', fieldGroups: [
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
  { id: 'ptpl-18', templateName: 'MaxCompute申请模板', resType: 'MaxCompute', category: '大数据与搜索分析类', opType: '创建', apiEndpoint: 'CreateProject', updateTime: '2026/01/10', fieldGroups: [
    { groupName: '项目配置', fields: [
      { name: '项目名称', param: 'projectName', type: 'string', visible: true, required: true, regex: '^[a-zA-Z][a-zA-Z0-9_]*$' },
      { name: '地域', param: 'RegionId', type: 'select', visible: true, required: true, options: '华北2（北京）,华东1（杭州）,华东2（上海）' },
      { name: '计算资源规格', param: 'defaultQuota', type: 'select', visible: true, required: true, options: '标准版,开发者版' }
    ]}
  ]},
  { id: 'ptpl-19', templateName: 'Flink申请模板', resType: 'Flink 实时计算', category: '大数据与搜索分析类', opType: '创建', apiEndpoint: 'CreateNamespace', updateTime: '2026/01/10', fieldGroups: [
    { groupName: '空间配置', fields: [
      { name: '空间名称', param: 'Namespace', type: 'string', visible: true, required: true, regex: '' },
      { name: '地域', param: 'RegionId', type: 'select', visible: true, required: true, options: '华北2（北京）,华东1（杭州）,华东2（上海）' },
      { name: 'CU 数量', param: 'ResourceSpec', type: 'number', visible: true, required: true, min: 1, max: 100, decimals: 0 }
    ]}
  ]},
  { id: 'ptpl-20', templateName: 'Hologres申请模板', resType: '实时数仓 Hologres', category: '大数据与搜索分析类', opType: '创建', apiEndpoint: 'CreateInstance', updateTime: '2026/01/10', fieldGroups: [
    { groupName: '实例配置', fields: [
      { name: '实例名称', param: 'InstanceName', type: 'string', visible: true, required: true, regex: '' },
      { name: '地域', param: 'RegionId', type: 'select', visible: true, required: true, options: '华北2（北京）,华东1（杭州）,华东2（上海）' },
      { name: '计算规格(CU)', param: 'CpuLimit', type: 'number', visible: true, required: true, min: 8, max: 512, decimals: 0 },
      { name: '存储规格(GB)', param: 'StorageLimit', type: 'number', visible: true, required: true, min: 50, max: 10000, decimals: 0 }
    ]}
  ]},
  { id: 'ptpl-21', templateName: 'OSS申请模板', resType: 'OSS 对象存储', category: '存储类', opType: '创建', apiEndpoint: 'PutBucket', updateTime: '2026/01/15', fieldGroups: [
    { groupName: 'Bucket 配置', fields: [
      { name: 'Bucket 名称', param: 'BucketName', type: 'string', visible: true, required: true, regex: '^[a-z0-9][a-z0-9-]*$' },
      { name: '地域', param: 'RegionId', type: 'select', visible: true, required: true, options: '华北2（北京）,华东1（杭州）,华东2（上海）' },
      { name: '存储类型', param: 'StorageClass', type: 'select', visible: true, required: true, options: '标准存储,低频存储,归档存储' },
      { name: '读写权限', param: 'ACL', type: 'select', visible: true, required: true, options: '私有,公共读,公共读写' }
    ]}
  ]},
  { id: 'ptpl-22', templateName: 'ESSD块存储申请模板', resType: '块存储 ESSD', category: '存储类', opType: '创建', apiEndpoint: 'CreateDisk', updateTime: '2026/01/15', fieldGroups: [
    { groupName: '磁盘配置', fields: [
      { name: '磁盘名称', param: 'DiskName', type: 'string', visible: true, required: true, regex: '' },
      { name: '地域', param: 'RegionId', type: 'select', visible: true, required: true, options: '华北2（北京）,华东1（杭州）,华东2（上海）' },
      { name: '磁盘大小(GB)', param: 'Size', type: 'number', visible: true, required: true, min: 20, max: 32768, decimals: 0 },
      { name: '性能等级', param: 'PerformanceLevel', type: 'select', visible: true, required: true, options: 'PL0,PL1,PL2,PL3' }
    ]}
  ]},
  { id: 'ptpl-23', templateName: 'NAS申请模板', resType: '文件存储 NAS', category: '存储类', opType: '创建', apiEndpoint: 'CreateFileSystem', updateTime: '2026/01/15', fieldGroups: [
    { groupName: '文件系统配置', fields: [
      { name: '文件系统名称', param: 'FileSystemType', type: 'string', visible: true, required: true, regex: '' },
      { name: '地域', param: 'RegionId', type: 'select', visible: true, required: true, options: '华北2（北京）,华东1（杭州）,华东2（上海）' },
      { name: '存储类型', param: 'StorageType', type: 'select', visible: true, required: true, options: '性能型,容量型,极速型' },
      { name: '协议类型', param: 'ProtocolType', type: 'select', visible: true, required: true, options: 'NFS,SMB' }
    ]}
  ]},
  { id: 'ptpl-24', templateName: 'CDN流量包申请模板', resType: 'CDN 流量包', category: '存储类', opType: '创建', apiEndpoint: 'CreateCdnPackage', updateTime: '2026/01/20', fieldGroups: [
    { groupName: '流量包配置', fields: [
      { name: '流量包规格', param: 'PackageSpec', type: 'select', visible: true, required: true, options: '100GB,500GB,1TB,5TB,10TB' },
      { name: '有效期', param: 'Duration', type: 'select', visible: true, required: true, options: '1个月,3个月,6个月,1年' },
      { name: '用途说明', param: '_description', type: 'textarea', visible: true, required: false }
    ]}
  ]}
];

MockData.platformFlows = [
  { resType: 'ECS 云服务器', opType: '创建', subRes: '', flowTemplate: 'leader+l5+admin1', admin1: '', admin2: '' },
  { resType: 'ECS 云服务器', opType: '变配', subRes: '', flowTemplate: 'leader+l5', admin1: '', admin2: '' },
  { resType: 'ECS 云服务器', opType: '扩容', subRes: '', flowTemplate: 'leader', admin1: '', admin2: '' },
  { resType: 'ECS 云服务器', opType: '销毁', subRes: '', flowTemplate: 'leader+l5+admin1', admin1: '', admin2: '' },
  { resType: 'K8S 集群', opType: '创建', subRes: '', flowTemplate: 'leader+l5+admin2', admin1: '', admin2: '' },
  { resType: 'K8S 集群', opType: '变配', subRes: '', flowTemplate: 'leader+l5', admin1: '', admin2: '' },
  { resType: 'RDS 云数据库', opType: '创建', subRes: '', flowTemplate: 'leader+l5+admin1', admin1: '', admin2: '' },
  { resType: 'RDS 云数据库', opType: '变配', subRes: '', flowTemplate: 'leader+l5', admin1: '', admin2: '' },
  { resType: 'RDS 云数据库', opType: '销毁', subRes: '', flowTemplate: 'leader+l5+admin1', admin1: '', admin2: '' },
  { resType: 'Redis 缓存', opType: '创建', subRes: '', flowTemplate: 'leader+l5', admin1: '', admin2: '' },
  { resType: 'Redis 缓存', opType: '销毁', subRes: '', flowTemplate: 'leader+l5+admin1', admin1: '', admin2: '' },
  { resType: 'SLB 负载均衡', opType: '创建', subRes: '', flowTemplate: 'leader+l5', admin1: '', admin2: '' },
  { resType: 'Kafka 消息队列', opType: '创建', subRes: '', flowTemplate: 'leader+l5+admin1', admin1: '', admin2: '' },
  { resType: 'Elasticsearch', opType: '创建', subRes: '', flowTemplate: 'leader+l5+admin1', admin1: '', admin2: '' },
  { resType: 'MaxCompute', opType: '创建', subRes: '', flowTemplate: 'leader+l5', admin1: '', admin2: '' },
  { resType: 'OSS 对象存储', opType: '创建', subRes: '', flowTemplate: 'leader', admin1: '', admin2: '' },
  { resType: 'OSS 对象存储', opType: '销毁', subRes: '', flowTemplate: 'leader+l5+admin1', admin1: '', admin2: '' }
];

MockData.deptConfig = {
  'dept-infra': {
    deptName: '基础架构部',
    cloudAccount: 'infra-main (LTAI****7F2Q)',
    cloudAccountBound: true,
    cloudAccountOptions: ['infra-main', 'infra-dev', 'shared-services'],
    templates: [
      { id: 'tpl-1', resType: 'ECS 云服务器', opType: '创建', category: '计算类', customized: true, fieldOverrides: {
        '0|RegionId': { show: true, options: '华北2（北京）=cn-beijing,华东1（杭州）=cn-hangzhou' },
        '0|ZoneId': { show: true, cascadeFrom: 'RegionId', cascadeData: 'cn-beijing:可用区B=cn-beijing-b,可用区C=cn-beijing-c,可用区H=cn-beijing-h\ncn-hangzhou:可用区G=cn-hangzhou-g,可用区H=cn-hangzhou-h' },
        '0|InstanceType': { show: true, options: 'ecs.c7.large=ecs.c7.large,ecs.c7.xlarge=ecs.c7.xlarge,ecs.c7.2xlarge=ecs.c7.2xlarge' },
        '1|SystemDisk.Category': { show: true, options: 'ESSD 云盘=cloud_essd,高效云盘=cloud_efficiency' },
        '2|VpcId': { show: true, options: 'prod-beijing-vpc=vpc-prod-beijing,prod-hangzhou-vpc=vpc-prod-hangzhou' },
        '2|VSwitchId': { show: true, options: 'prod-app-vsw=vsw-prod-app,prod-db-vsw=vsw-prod-db' },
        '2|SecurityGroupId': { show: true, options: 'app安全组=sg-prod-app,内部安全组=sg-prod-internal' }
      } },
      { id: 'tpl-1a', resType: 'ECS 云服务器', opType: '变配', category: '计算类', customized: false, fieldOverrides: {} },
      { id: 'tpl-1b', resType: 'ECS 云服务器', opType: '扩容', category: '计算类', customized: false, fieldOverrides: {} },
      { id: 'tpl-1c', resType: 'ECS 云服务器', opType: '销毁', category: '计算类', customized: false, fieldOverrides: {} },
      { id: 'tpl-2', resType: 'K8S 集群', opType: '创建', category: '计算类', customized: false, fieldOverrides: {} },
      { id: 'tpl-3', resType: 'RDS 云数据库', opType: '创建', category: '数据库类', customized: false, fieldOverrides: {} },
      { id: 'tpl-3a', resType: 'RDS 云数据库', opType: '变配', category: '数据库类', customized: false, fieldOverrides: {} },
      { id: 'tpl-4', resType: 'PolarDB PostgreSQL', opType: '创建', category: '数据库类', customized: false, fieldOverrides: {} },
      { id: 'tpl-5', resType: 'MongoDB', opType: '创建', category: '数据库类', customized: false, fieldOverrides: {} },
      { id: 'tpl-6', resType: 'Redis 缓存', opType: '创建', category: '数据库类', customized: true, fieldOverrides: {} },
      { id: 'tpl-7', resType: 'SLB 负载均衡', opType: '创建', category: '网络与负载均衡类', customized: false, fieldOverrides: {} },
      { id: 'tpl-8', resType: 'Kafka 消息队列', opType: '创建', category: '中间件类', customized: true, fieldOverrides: {} },
      { id: 'tpl-9', resType: 'Elasticsearch', opType: '创建', category: '大数据与搜索分析类', customized: false, fieldOverrides: {} },
      { id: 'tpl-10', resType: 'OSS 对象存储', opType: '创建', category: '存储类', customized: false, fieldOverrides: {} }
    ],
    ticketHandlers: [
      { categoryId: 'cat-auth', categoryName: '账号权限类', handler: '张明远', isDefault: true },
      { categoryId: 'cat-resource', categoryName: '资源问题类', handler: '张明远', isDefault: true },
      { categoryId: 'cat-network', categoryName: '网络问题类', handler: '赵雪晴', isDefault: false },
      { categoryId: 'cat-security', categoryName: '安全合规类', handler: '张明远', isDefault: true }
    ],
    approvalFlows: [
      { id: 'flow-1', resType: 'ECS 云服务器', opType: '创建', category: '计算类', flowTemplate: 'leader+l5+admin1', admin1: '张明远', admin2: '' },
      { id: 'flow-1a', resType: 'ECS 云服务器', opType: '变配', category: '计算类', flowTemplate: 'leader+l5', admin1: '', admin2: '' },
      { id: 'flow-1b', resType: 'ECS 云服务器', opType: '扩容', category: '计算类', flowTemplate: 'leader', admin1: '', admin2: '' },
      { id: 'flow-1c', resType: 'ECS 云服务器', opType: '销毁', category: '计算类', flowTemplate: 'leader+l5+admin1', admin1: '张明远', admin2: '' },
      { id: 'flow-2', resType: 'K8S 集群', opType: '创建', category: '计算类', flowTemplate: 'leader+l5+admin1', admin1: '张明远', admin2: '' },
      { id: 'flow-3', resType: 'RDS 云数据库', opType: '创建', category: '数据库类', flowTemplate: 'leader+l5+admin1', admin1: '张明远', admin2: '' },
      { id: 'flow-3a', resType: 'RDS 云数据库', opType: '变配', category: '数据库类', flowTemplate: 'leader+l5', admin1: '', admin2: '' },
      { id: 'flow-4', resType: 'Redis 缓存', opType: '创建', category: '数据库类', flowTemplate: 'leader+l5', admin1: '', admin2: '' },
      { id: 'flow-5', resType: 'Kafka 消息队列', opType: '创建', category: '中间件类', flowTemplate: 'leader+l5', admin1: '', admin2: '' },
      { id: 'flow-6', resType: 'Elasticsearch', opType: '创建', category: '大数据与搜索分析类', flowTemplate: 'leader+l5', admin1: '', admin2: '' },
      { id: 'flow-7', resType: 'OSS 对象存储', opType: '创建', category: '存储类', flowTemplate: 'leader+l5', admin1: '', admin2: '' }
    ]
  },
  'dept-biz': {
    deptName: '业务研发部',
    cloudAccount: 'biz-prod (AKID****8X9K)',
    cloudAccountBound: true,
    cloudAccountOptions: ['biz-prod', 'biz-staging', 'shared-services'],
    templates: [
      { id: 'tpl-20', resType: 'ECS 云服务器', opType: '创建', category: '计算类', customized: true, fieldOverrides: {} },
      { id: 'tpl-21', resType: 'RDS 云数据库', opType: '创建', category: '数据库类', customized: false, fieldOverrides: {} },
      { id: 'tpl-22', resType: 'Redis 缓存', opType: '创建', category: '数据库类', customized: false, fieldOverrides: {} },
      { id: 'tpl-23', resType: 'SLB 负载均衡', opType: '创建', category: '网络与负载均衡类', customized: false, fieldOverrides: {} },
      { id: 'tpl-24', resType: 'Kafka 消息队列', opType: '创建', category: '中间件类', customized: false, fieldOverrides: {} },
      { id: 'tpl-25', resType: 'OSS 对象存储', opType: '创建', category: '存储类', customized: false, fieldOverrides: {} }
    ],
    ticketHandlers: [
      { categoryId: 'cat-auth', categoryName: '账号权限类', handler: '刘佳琪', isDefault: true },
      { categoryId: 'cat-resource', categoryName: '资源问题类', handler: '刘佳琪', isDefault: true },
      { categoryId: 'cat-network', categoryName: '网络问题类', handler: '刘佳琪', isDefault: true },
      { categoryId: 'cat-security', categoryName: '安全合规类', handler: '刘佳琪', isDefault: true }
    ],
    approvalFlows: [
      { id: 'flow-10', resType: 'ECS 云服务器', opType: '创建', category: '计算类', flowTemplate: 'leader+l5+admin1', admin1: '刘佳琪', admin2: '' },
      { id: 'flow-11', resType: 'RDS 云数据库', opType: '创建', category: '数据库类', flowTemplate: 'leader+l5+admin1', admin1: '刘佳琪', admin2: '' },
      { id: 'flow-12', resType: 'Redis 缓存', opType: '创建', category: '数据库类', flowTemplate: 'leader+l5', admin1: '', admin2: '' },
      { id: 'flow-13', resType: 'OSS 对象存储', opType: '创建', category: '存储类', flowTemplate: 'leader', admin1: '', admin2: '' }
    ]
  },
  'dept-data': {
    deptName: '数据平台部',
    cloudAccount: '',
    cloudAccountBound: false,
    cloudAccountOptions: ['data-prod', 'data-dev', 'shared-services'],
    templates: [
      { id: 'tpl-30', resType: 'Elasticsearch', opType: '创建', category: '大数据与搜索分析类', customized: false, fieldOverrides: {} },
      { id: 'tpl-31', resType: 'MaxCompute', opType: '创建', category: '大数据与搜索分析类', customized: false, fieldOverrides: {} },
      { id: 'tpl-32', resType: 'Flink 实时计算', opType: '创建', category: '大数据与搜索分析类', customized: true, fieldOverrides: {} },
      { id: 'tpl-33', resType: 'ECS 云服务器', opType: '创建', category: '计算类', customized: false, fieldOverrides: {} },
      { id: 'tpl-34', resType: 'OSS 对象存储', opType: '创建', category: '存储类', customized: false, fieldOverrides: {} }
    ],
    ticketHandlers: [
      { categoryId: 'cat-auth', categoryName: '账号权限类', handler: '周文博', isDefault: true },
      { categoryId: 'cat-resource', categoryName: '资源问题类', handler: '吴海波', isDefault: false },
      { categoryId: 'cat-network', categoryName: '网络问题类', handler: '周文博', isDefault: true },
      { categoryId: 'cat-security', categoryName: '安全合规类', handler: '周文博', isDefault: true }
    ],
    approvalFlows: [
      { id: 'flow-20', resType: 'Elasticsearch', opType: '创建', category: '大数据与搜索分析类', flowTemplate: 'leader+l5', admin1: '', admin2: '' },
      { id: 'flow-21', resType: 'MaxCompute', opType: '创建', category: '大数据与搜索分析类', flowTemplate: 'leader+l5', admin1: '', admin2: '' },
      { id: 'flow-22', resType: 'ECS 云服务器', opType: '创建', category: '计算类', flowTemplate: 'leader+l5+admin1', admin1: '周文博', admin2: '' }
    ]
  }
};
