/**
 * @description API接口配置文件
 * @author        yq
 * @date          2017-09-18 14:12:40
 */
const { javaApiPrefix, apiHost } = require('../config');

module.exports = {
  apiHost,
  // 直播
  // 停止直播
  stopLiveApi: {
    url: `${apiHost}${javaApiPrefix}/l/live/finish`,
    method: 'POST',
  },
  // 同步播放地址
  syncLiveUrlApi: {
    url: `${apiHost}${javaApiPrefix}/l/live/record/sync`,
    method: 'POST',
  },
};
