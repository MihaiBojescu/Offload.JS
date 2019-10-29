/*
 * @author Mihai Bojescu <bojescu.mihai@gmail.com>
 * @date 29.10.2019
 *
 * Library entry point. Includes:
 *  - logic for setting up workers (processes and threads)
 *  - logic for loading files into memory
 *  - logic for selecting which functions to load
 *  - logic for communicating between workers
 *  - logic for synchronisations using promises
 *  - logic for logging
 *
 * Default config sets the worker type to `processes`
 */

const os = require('os')
const path = require('path')
const crypto = require('crypto')
const cluster = require('cluster')
const threads = require('worker_threads')

const validTypes = ['threads', 'processes']
const defaultConfig = {
  type: validTypes[1],
  debug: false,
  workers: os.cpus().length,
  cyclingStrategy: simpleCyclingStrategy
}

module.exports = setup()

function setup () {
  const offloadMap = {}

  return config => {
    const {
      type,
      debug,
      workers,
      cyclingStrategy
    } = { ...defaultConfig, ...config }

    const isMaster = checkIfMaster()
    const communicationFn = setCommunicationFn()

    const files = []
    const workersArray = []
    const promiseMap = {}
    let currentWorker = 0
    let locked = false

    if (type === validTypes[1] && !isMaster) {
      workerProcess()
    }

    return {
      isMaster,

      use,
      lock,
      run,

      ...(!isMaster && {
        type,
        offloadMapRef
      })
    }

    function workerProcess () {
      process.on('message', doWork)
      process.send('up')

      async function doWork ({ title, promiseId, args }) {
        const result = await offloadMapRef()[title](...args)
        process.send({ promiseId, result })
      }
    }

    function checkIfMaster () {
      switch (type) {
        case validTypes[0]: return threads.isMainThread
        case validTypes[1]: return cluster.isMaster
        default: throw new Error('Unknown type')
      }
    }

    function setCommunicationFn () {
      switch (type) {
        case validTypes[0]: return 'postMessage'
        case validTypes[1]: return 'send'
        default: throw new Error('Unknown type')
      }
    }

    function offloadMapRef () {
      return offloadMap
    }

    function use (file) {
      files.push(file)

      return offload

      function offload (title) {
        return fn => {
          if (!isMaster) {
            debug && log(`Loading ${title} on worker`)
            offloadMap[title] = fn
          } else {
            return null
          }
        }
      }
    }

    async function lock () {
      if (isMaster && !locked) {
        locked = true
        const initStrategy = {
          [validTypes[0]]: initThreads,
          [validTypes[1]]: initProcesses
        }[type]

        return initStrategy()
      }

      async function initThreads () {
        const options = { workerData: { files } }
        const codePath = path.resolve(`${path.dirname(__filename)}/worker.js`)

        for (let i = 0; i < workers; ++i) {
          const worker = await new Promise(resolve => {
            const worker = new threads.Worker(codePath, options)
            worker.once('message', message => message === 'up' && resolve(worker))
          })
          worker.on('message', doFinish)
          workersArray.push(worker)
        }

        debug && log(`Done with init (type: ${type})`)

        return true
      }

      async function initProcesses () {
        for (let i = 0; i < workers; ++i) {
          const worker = await new Promise(resolve => {
            const worker = cluster.fork()
            worker.once('message', message => message === 'up' && resolve(worker))
          })
          worker.on('message', doFinish)
          workersArray.push(worker)
        }

        debug && log(`Done with init (type: ${type})`)

        return true
      }

      async function doFinish ({ promiseId, result }) {
        promiseMap[promiseId](result)
      }
    }

    function run (title) {
      return (...args) => {
        if (isMaster) {
          debug && log(`Running ${title}`)

          const promiseId = crypto.randomBytes(4).toString('hex')
          const promise = new Promise(resolve => (promiseMap[promiseId] = resolve))

          workersArray[currentWorker][communicationFn]({ title, promiseId, args })
          currentWorker = cyclingStrategy(currentWorker, workersArray.length - 1)

          return promise
        } else {
          return null
        }
      }
    }
  }
}

function simpleCyclingStrategy (worker, max) {
  if (worker + 1 <= max) {
    return worker + 1
  } else {
    return 0
  }
}

function log (string) {
  console.log(`[${Date.now()} - Offload.JS] ${string}`)
}
