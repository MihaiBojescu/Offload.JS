/*
 * @author Mihai Bojescu <bojescu.mihai@gmail.com>
 * @date 29.10.2019
 *
 * Includes worker thread logic. Used in order to avoid cyclic dependencies
 */

const threads = require('worker_threads')
const offload = require('./offload')({ type: 'threads' })

setup()

function setup () {
  if (!threads.isMainThread) {
    init()
  }

  function init () {
    threads.workerData.files.forEach(use)
    threads.parentPort.on('message', doWork)
    threads.parentPort.postMessage('up')

    function use (file) {
      require(file)
    }

    async function doWork ({ title, promiseId, args }) {
      const fn = await offload.offloadMapRef()[title]
      const result = await args.reduce(async (previousResult, nextArgs) => (await previousResult)(...nextArgs), fn)

      threads.parentPort.postMessage({ promiseId, result })
    }
  }
}
