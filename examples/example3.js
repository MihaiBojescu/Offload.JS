/*
 * @author Mihai Bojescu <bojescu.mihai@gmail.com>
 * @date 29.10.2019
 *
 * Shows how to use this library when attempting to do use currying
 * Curried functions can be either async or normal functions
 *
 * By default, this example uses processes as backend.
 */

const process = require('process')
const { use, lock, run, isMaster } = require('../index')({ type: 'threads' })
const load = use(__filename)
load('say')(say)

main()

function say (firstname) {
  return lastname => title => console.log(`Hello ${title} ${firstname} ${lastname}!`)
}

async function main () {
  if (isMaster) {
    await lock();

    (await say('Mihai')('Bojescu'))('mr.')
    await run('say')(['Mihai'], ['Bojescu'], ['mr.'])

    process.exit()
  }
}
