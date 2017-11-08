/**
 * @description zk客户端管理类（自动重连）
 * @author yq
 * @date 2017/7/7 下午4:04
 */

const ZooKeeper = require('zookeeper');
const { EventEmitter } = require('events');
const Logger = require('log4js').getLogger('zk');
const Promise = require('bluebird');

// 连接状态
const CONNECT_STATUS = {
  // 未连接
  unconnected: 0,
  // 连接中
  connecting: 1,
  // 已连接
  connected: 10
};

class ZKClient extends EventEmitter {
  /**
   *
   * @param hosts 主机地址
   * @param timeout 超时时间，单位毫秒
   */
  constructor({ hosts = '127.0.0.1:2181', timeout = 200000 }) {
    super();
    this.state = 0;// 未连接，1已连接，-1断开连接
    this.zkConfig = {
      connect: hosts,
      timeout,
      /**
       *  Log Levels:
       *  ZOO_LOG_LEVEL_ERROR        =  1
       *  ZOO_LOG_LEVEL_WARN         =  2
       *  ZOO_LOG_LEVEL_INFO         =  3
       *  ZOO_LOG_LEVEL_DEBUG        =  4
       */
      debug_level: ZooKeeper.ZOO_LOG_LEVEL_WARN,
      // host_order_deterministic: false,
      data_as_buffer: false
    };
    this.zk = null; // ZK实例
    // 启动zk
    this.createConnect();
  }

  /**
   * 重建连接
   */
  connectListener() {
    const that = this;
    this.removeAllListeners();
    this.once('connectCreated', () => {
      Logger.info(`ZK Server : [${that.zkConfig.connect}] connect has created.`);
    });
    // 监听重建连接事件
    this.once('retryConnect', () => {
      Logger.info('--- 尝试重新建立ZK连接 ---');
      if (that.state === CONNECT_STATUS.connecting) {
        Logger.info('--- ZK连接中...忽略此次重连 ---');
      } else {
        that.state = CONNECT_STATUS.connecting;
        Promise.delay(10000)
          .then(() => {
            that.createConnect();
          });
      }
    });
  }

  /**
   * 连接监听器
   */
  connectMonitor() {
    const that = this;
    this.zk.once('close', (err) => {
      that.zk = false;
      Logger.error(`zk close Event [${that.zkConfig.connect}] 连接关闭，message:`, err.stack || err);
      that.emit('retryConnect');
    });
    this.zk.once('error', (err) => {
      that.zk = false;
      Logger.error(`zk error Event [${that.zkConfig.connect}] 连接关闭，message:`, err.stack || err);
      that.emit('retryConnect');
    });
  }

  /**
   * 创建 zookeeper connect
   */
  createConnect() {
    const that = this;
    if (that.state === CONNECT_STATUS.connected) {
      Logger.info('zk连接已建立，忽略此次执行');
      return;
    }
    // 启动事件监听
    this.connectListener();
    try {
      // 创建zk客户端
      this.zk = new ZooKeeper();
      this.zk.init(this.zkConfig);
    } catch (err) {
      that.zk = false;
      that.state = CONNECT_STATUS.unconnected;
      Logger.error(`zk error 初始化错误，message:${err.message}`, err.stack || err);
      that.emit('retryConnect');
    }
    // 连接
    this.zk.on('error', (err) => {
      that.zk = false;
      that.state = CONNECT_STATUS.unconnected;
      Logger.error(`zk error 连接错误，message:${err.message}`, err.stack || err);
      that.emit('retryConnect');
    });
    this.zk.on(ZooKeeper.on_closed, (err) => {
      that.zk = false;
      that.state = CONNECT_STATUS.unconnected;
      const error = err || { message: '无', stack: '无' };
      Logger.error(`zk error 连接关闭，message:${error.message}`, error.stack || error);
      that.emit('retryConnect');
    });
    this.zk.on(ZooKeeper.on_connected, () => {
      that.state = CONNECT_STATUS.connected;
      Logger.info(`zk [${that.zkConfig.connect}] 建立连接成功`);
      that.connectMonitor();
      that.emit('connectCreated');
    });
  }

  /**
   * 获取zk客户端
   *
   * @returns {*}
   */
  getClient() {
    if (!this.zk) {
      this.createConnect();
    }
    return this.zk;
  }

  /**
   * 创建路径
   * @param path
   */
  createPath(path) {
    const that = this;
    return new Promise((resolve, reject) => {
      that.zk.mkdirp(path, (err) => {
        if (err) {
          Logger.error('zk node create path error: ', err);
          return reject(err);
        }
        return resolve();
      });
    });
  }

  /**
   * 删除节点
   * @param path
   */
  delete(path, opts = { version: 0, count: 1 }) {
    const that = this;
    return new Promise((resolve, reject) => {
      opts.count -= 1;
      // eslint-disable-next-line
      that.zk.a_delete_(path, opts.version, (rc, err) => {
        if (rc !== 0) {
          if (opts.count <= 0) {
            return Promise.reject({
              code: rc || -99,
              info: '删除节点失败，且超过最大尝试次数',
              error: err
            });
          }
          Logger.error('zk node create path rc: %d, error: %s', rc, err);
          return Promise.delay(3000)
            .then(() => that.delete(path, opts))
            .then(resolve)
            .catch(reject);
        }
        return resolve();
      });
    });
  }

  /**
   * [get zookeeper blackList]
   * @return {[type]}            [description]
   */
  exist(path, watch = false) {
    const that = this;
    return new Promise((resolve, reject) => {
      that.zk.a_exists(path, watch, (rc, error, stat) => {
        // -101 no node
        if (rc !== 0) {
          Logger.error('zk node get rc: %d, error: %s, stat=%s, data=%s', rc, error, stat);
          return reject({
            rc,
            error,
            stat
          });
        }
        return resolve({
          rc,
          error,
          stat,
        });
      });
    });
  }

  /**
   * [get zookeeper blackList]
   * @return {[type]}            [description]
   */
  get(path) {
    const that = this;
    return new Promise((resolve, reject) => {
      that.zk.a_get(path, null, (rc, error, stat, data) => {
        if (rc !== 0) {
          Logger.error('zk node get rc: %d, error: %s, stat=%s, data=%s', rc, error, stat, data);
          return reject({
            rc,
            error,
            stat,
            data
          });
        }
        return resolve({
          rc,
          error,
          stat,
          data
        });
      });
    });
  }

  /**
   * get zk node and watch
   * @return {[type]}            [description]
   */
  awGet(path, watch) {
    const that = this;
    return new Promise((resolve, reject) => {
      that.zk.aw_get(path, (type, state, path1) => {
        watch({ type, state, path: path1 });
      }, (rc, error, stat, data) => {
        if (rc !== 0) {
          Logger.error('zk node get rc: %d, error: %s, stat=%s, data=%s', rc, error, stat, data);
          return reject({
            rc,
            error,
            stat,
            data
          });
        }
        return resolve({
          rc,
          error,
          stat,
          data
        });
      });
    });
  }

  /**
   * get children
   * @return {[type]}            [description]
   */
  getChildren(path, watch = false) {
    const that = this;
    return new Promise((resolve, reject) => {
      that.zk.a_get_children(path, watch, (rc, err, data) => {
        if (rc !== 0) {
          Logger.error('getChildren  rc= ', rc, 'err= ', err, 'nodes= ', data);
          return reject(err);
        }
        return resolve(data);
      });
    });
  }

  /**
   * 获取子节点，并监控节点变化
   * @return {[type]}            [description]
   */
  awGetChildren(path, watch) {
    const that = this;
    return new Promise((resolve, reject) => {
      that.zk.aw_get_children(path, (type, state, path1) => {
        watch({ type, state, path1 });
      }, (rc, error, children) => {
        if (rc !== 0) {
          Logger.error('zk node get rc: ', rc, 'error: ', error, 'children=', children);
          return reject(error);
        }
        return resolve(children);
      });
    });
  }

  /**
   * [set zookeeper black_list]
   * @param {object}   opt:
   * {
     *     380533076: {
     *         'anchor_uin': 380533076,
     *         'expired_time': 1462876279
     *     },
     *     380533077: {
     *         'anchor_uin': 380533077,
     *         'expired_time': 1462876279
     *     },
     * }
   */
  set({ path, version, data }) {
    const that = this;
    return new Promise((resolve, reject) => {
      that.zk.a_set(path, data, version, (rc, error, stat) => {
        if (rc !== 0) {
          Logger.error('zk node set rc: %d, error: %s, stat=%s', rc, error, stat);
          return reject(error);
        }
        return resolve(stat);
      });
    });
  }

  /**
   * 创建临时有序节点
   *
   * @param path
   * @param data
   */
  createLock({ path, data = 0 }) {
    const that = this;
    return new Promise((resolve, reject) => {
      // eslint-disable-next-line
      that.zk.a_create(path, data, ZooKeeper.ZOO_SEQUENCE | ZooKeeper.ZOO_EPHEMERAL, (rc, error, path1) => {
        if (rc !== 0) {
          Logger.error('zk node create rc: %d, error: %s, stat=%s', rc, error, path1);
          return reject(error);
        }
        return resolve(path1);
      });
    });
  }

  /**
   * 创建节点
   *
   * @param path
   * @param data
   */
  // eslint-disable-next-line
  create({ path, data = 0, flags = ZooKeeper.ZOO_SEQUENCE | ZooKeeper.ZOO_EPHEMERAL }) {
    const that = this;
    return new Promise((resolve, reject) => {
      console.log('开始创建');
      that.zk.a_create(path, data, flags, (rc, error, path1) => {
        if (rc !== 0) {
          console.error('zk node create rc: %d, error: %s, stat=%s', rc, error, path1);
          Logger.error('zk node create rc: %d, error: %s, stat=%s', rc, error, path1);
          return reject(error);
        }
        console.log('创建成功');
        return resolve(path1);
      });
    });
  }
}

module.exports = ZKClient;
