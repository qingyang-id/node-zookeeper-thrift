/**
 * @description 全局配置
 * @author yq
 * @date 2017/4/27 上午8:59
 */

let config;

switch (process.env.NODE_ENV) {
  case 'production':
    config = require('./prod');
    break;
  case 'test':
    config = require('./test');
    break;
  default:
    config = require('./dev');
}

// 以下不区分生产测试环境的变量
Object.assign(config, {
  // zk选举节点路径
  electionPath: '/election',
});

module.exports = config;
