/**
 * @description zk选举测试类
 * @author      yq
 * @date        2017-11-08 21:22:31
 */
const Election = require('../../lib/zk/election');
const { electionPath } = require('../../config');

// 竞选leader，多个窗口执行此文件  node electionTest.js, 杀死leader所在进程，查看效果
new Election(electionPath).electLeader(() => {
  console.log('执行相关任务');
});
