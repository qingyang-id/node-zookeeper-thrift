/**
 * @description zk锁生成工具类
 * @author yq
 * @date 2017/7/18 下午2:30
 */
const Logger = require('log4js').getLogger('zk');

class ZKLock {
  constructor(zk) {
    this.zk = zk;
  }

  /**
   * 新建锁
   * @param lockPath
   */
  getLock(lockPath, data = 0) {
    const that = this;
    // 新建锁节点
    that.zk.exist(lockPath)
      .catch((err) => {
        // 根节点不存在，新建根节点
        Logger.info('path err', err);
        return that.zk.createPath(lockPath);
      })
      .then(() => that.zk.createLock({ path: `${lockPath}/1`, data }))
      .catch((err) => {
        Logger.error('新建zk分布式锁失败', err.stack || err);
      });
  }
}

module.exports = ZKLock;
