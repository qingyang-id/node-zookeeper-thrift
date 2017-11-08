/**
 * @description zk选举
 * @author      yq
 * @date        2017-11-08 15:45:01
 */
const ZKClinet = require('./zkClient');
const Logger = require('log4js').getLogger('monitor');
const { zk } = require('../../config');

/**
 * 递归法实现二分查找，此法在节点较多的情况下效率较好
 * @param  {Array} arr  要查找的数组
 * @param  {Number} low  左节点
 * @param  {Number} high 右节点
 * @param  {String} search  要查找的节点值
 * @return {Number}      目标元素坐标
 */
function binarySearch(arr, low, high, search) {
  if (low > high) {
    return -1;
  }
  const mid = parseInt((high + low) / 2, 10);
  if (arr[mid] === search) {
    return mid;
  } else if (arr[mid] > search) {
    high = mid - 1;
    return binarySearch(arr, low, high, search);
  } else if (arr[mid] < search) {
    low = mid + 1;
    return binarySearch(arr, low, high, search);
  }
  return -1;
}

class Election {
  constructor(path) {
    this.zk = new ZKClinet(zk);
    this.electionId = null;
    this.path = path;
  }

  init() {
    // 新建临时节点
    return this.zk.createPath(this.path)
      .then(() => this.zk.create({ path: `${this.path}/sid` }))
      .then((result) => {
        this.electionId = result.replace(`${this.path}/`, '');
        Logger.info('进程(%s)当前sid(%s)', process.pid, this.electionId);
      });
  }

  async electLeader(cb) {
    if (!this.electionId) {
      console.log('初始化election');
      await this.init();
    }
    await this.zk.getChildren(this.path)
      .then((result) => {
        // 对数组进行字典排序
        result = result.sort();
        // 通过二分查找，查找到当前节点的下标
        const key = binarySearch(result, 0, result.length - 1, this.electionId);
        if (key === -1) {
          // 找不到对应节点，抛出异常
        } else if (key > 0) {
          // 监听前一个节点变化
          console.log('进程(%s)监听(%s)成为leader事件', process.pid, this.electionId);
          this.zk.awGet(`${this.path}/${result[key - 1]}`, this.electLeader.bind(this, cb));
        } else {
          // 当前节点是leader
          console.log('进程(%s):%s成为了leader节点，开始执行任务', process.pid, this.electionId);
          Logger.info('进程(%s):%s成为了leader，开始执行任务', process.pid, this.electionId);
          // 启动定时任务
          cb();
        }
      });
  }
}

module.exports = Election;
