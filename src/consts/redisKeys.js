/**
 * @description redis key名称集合
 * @author yq
 * @date 2017/6/26 下午4:51
 */

module.exports = {
  // 缓存key
  // thrift token key
  tTokenKey: 'zl:t:token:$key',
  // 用户token
  uTokenKey: 'zl:u:token:$key',
  // 用户token
  tokenKey: 'zl:token:$key',
  apiKey: 'zl:api',
  thriftKey: 'zl:thrift',
  thriftFileKey: 'zl:thrift:file',
  restartApiLogKey: 'zl:api:restart:log',
  // 发布订阅
  apiEventChange: 'zl:api:event:change',
  apiChange: 'zl:api:change',
  thriftChange: 'zl:thrift:change',
  restartApi: 'zl:api:restart',
};
