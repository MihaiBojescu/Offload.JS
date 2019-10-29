# Offload.JS

Offloads your functions to separate worker threads/processes.

## Purpose

This library's purpose is to maximize NodeJs's throughput by giving the developer the option to run CPU-heavy tasks in parallel and in the background.

## Compatibility

| Node version | Worker processes | Worker threads |
| - | - | - |
| `x.x.x - 12.x` | Usable | Usable |
| `11.x` | Usable | Experimental, usable without flag|
| `10.x` | Usable | Experimental, usable with `--experimental-worker` flag | 
| `0.10.x - 10.x` | Usable | Can't use |

## Usage

A basic example would be:

```js
const process = require('process')
const { use, lock, run, isMaster } = require('offload')()
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
    await run('sayHello')()

    process.exit()
  }
}
```

## Examples

For further usage reference, use the examples provided inside the `examples` folder.