const logConfig = require('./log/log4j_config_pro.js');

module.exports = {
  logConfig,
  zk: {
    hosts: '10.169.153.250:2181,10.169.154.51:2181,10.169.154.52:2181,10.29.113.78:2181',
    timeout: 120000 // 超时时间，单位毫秒
  },
};
