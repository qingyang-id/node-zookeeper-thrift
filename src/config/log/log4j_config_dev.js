module.exports = {
  appenders: {
    console: { type: 'console' },
    out: {
      type: 'file',
      filename: './logs/out.log',
      maxLogSize: 10 * 1024 * 1024,
      layout: {
        type: 'basic'
      },
      backups: 5,
    },
    error: {
      type: 'file',
      filename: './logs/error.log',
      maxLogSize: 10 * 1024 * 1024,
      layout: {
        type: 'basic'
      },
      backups: 5,
    },
    zk: {
      type: 'file',
      filename: './logs/zk.log',
      // 1M 单文件大小，单位字节
      maxLogSize: 10 * 1024 * 1024,
      backups: 5
    },
    monitor: {
      type: 'file',
      filename: './logs/monitor.log',
      // 1M 单文件大小，单位字节
      maxLogSize: 10 * 1024 * 1024,
      backups: 5
    },
    cron: {
      type: 'dateFile',
      filename: './logs/cron.log',
      pattern: '-yyyy-MM-dd.log',
    },
  },
  categories: {
    default: { appenders: ['console', 'out'], level: 'info' },
    error: { appenders: ['error'], level: 'debug' },
    zk: { appenders: ['zk'], level: 'info' },
    monitor: { appenders: ['monitor'], level: 'info' },
    cron: { appenders: ['cron'], level: 'info' },
  }
};
