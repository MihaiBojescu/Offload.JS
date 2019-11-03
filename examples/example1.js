/*
 * @author Mihai Bojescu <bojescu.mihai@gmail.com>
 * @date 29.10.2019
 *
 * A basic "hello world" example.
 *
 * By default, this example uses processes as backend.
 */

const process = require('process')
const { use, lock, run, isMaster } = require('../index')()
const load = use(__filename)
load('sayHello')(sayHello)

main()

function sayHello () {
  console.log(`Hello from ${isMaster ? 'main' : 'worker'}`)
}

async function main () {
  if (isMaster) {
    await lock()

    sayHello()
    await run('sayHello')([])

    process.exit()
  }
}
