'use strict';
// CMP 原型 - Mock 数据层 - 云账号数据

MockData.cloudAccounts = {
  main: [
    { dept: '基础架构部', vendor: '阿里云', account: 'infra-main (LTAI****7F2Q)',
      region: 'cn-hangzhou', regionName: '华东1（杭州）',
      bindUser: '张明远', bindTime: '2025/08/20 15:30:00', status: '正常' },
    { dept: '业务研发部', vendor: '阿里云', account: 'biz-prod (LTAI****k9Xm)',
      region: 'cn-shanghai', regionName: '华东2（上海）',
      bindUser: '刘佳琪', bindTime: '2025/09/05 10:00:00', status: '正常' },
    { dept: '数据平台部', vendor: '', account: '', bindUser: '', bindTime: '',
      region: '', regionName: '', status: '未绑定' }
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
};

MockData.cloudResources = {
  syncTime: '2026-03-27 10:30:00',
  // accountAlias matches cloudAccounts.main[].account.split(' ')[0]
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
