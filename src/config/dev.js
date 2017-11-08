const logConfig = require('./log/log4j_config_dev.js');

module.exports = {
  logConfig,
  zk: {
    hosts: '192.168.16.195:2181,192.168.16.196:2181,192.168.16.189:2181',
    timeout: 120000 // 超时时间，单位毫秒
  },
};
