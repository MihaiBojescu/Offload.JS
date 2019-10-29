/*
 * @author Mihai Bojescu <bojescu.mihai@gmail.com>
 * @date 29.10.2019
 *
 * Shows how to use this library when attempting to do a lot of calculations,
 * and how to improve the performance of the calculations by running them in
 * parallel.
 *
 * By default, this example uses processes as backend.
 */

const process = require('process')
const { use, lock, run, isMaster } = require('../index')()
const load = use(__filename)
load('add')(add)

main()

function add () {
  let result = 0

  for (let i = 0; i < 100000000; ++i) {
    result += i
  }

  return result
}

async function main () {
  if (isMaster) {
    await lock()

    await noParallel('When not in parallel')
    await parallel('When in parallel')

    process.exit()
  }

  async function noParallel (label) {
    console.time(label)

    const [
      result1,
      result2,
      result3,
      result4
    ] = await Promise.all([
      add(),
      add(),
      add(),
      add()
    ])

    console.timeEnd(label)

    console.log(`Result 1 is: ${result1}`)
    console.log(`Result 2 is: ${result2}`)
    console.log(`Result 3 is: ${result3}`)
    console.log(`Result 4 is: ${result4}`)
  }

  async function parallel (label) {
    console.time(label)

    const [
      result1,
      result2,
      result3,
      result4
    ] = await Promise.all([
      run('add')(),
      run('add')(),
      run('add')(),
      run('add')()
    ])

    console.timeEnd(label)

    console.log(`Result 1 is: ${result1}`)
    console.log(`Result 2 is: ${result2}`)
    console.log(`Result 3 is: ${result3}`)
    console.log(`Result 4 is: ${result4}`)
  }
}
