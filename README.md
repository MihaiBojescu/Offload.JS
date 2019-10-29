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

After importing the library, a function is returned. Use the function (`setup` function) with your configuration as parameter. After calling the `setup` function, the following functions are available: `use`, `lock`, `run`, and a parameter called `isMaster`. Call the `use` function with the file you want to use. Use the function provided by the `use` function call to select the functions to offload. **Remember to use the `lock` function after finishing selecting the functions, as it creates the workers and sets them up!**

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

For further usage reference, use the examples provided inside the [examples](examples/) folder.