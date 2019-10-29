/*
 * @author Mihai Bojescu <bojescu.mihai@gmail.com>
 * @date 29.10.2019
 *
 * Includes worker thread logic. Used in order to avoid cyclic dependencies
 */

const threads = require('worker_threads')
const offload = require('./offload')()
const validTypes = ['threads', 'processes']

setup()

function setup () {
  if (!offload.isMaster) {
    init()
  }

  function init () {
    if (offload.type === validTypes[0]) {
      threads.workerData.files.forEach(use)
      threads.parentPort.on('message', doWork)
      threads.parentPort.postMessage('up')
    } else {
      process.on('message', doWork)
    }

    function use (file) {
      require(file)
    }

    async function doWork ({ title, promiseId, args }) {
      const result = await offload.offloadMapRef()[title](...args)
      threads.parentPort.postMessage({ promiseId, result })
    }
  }
}
