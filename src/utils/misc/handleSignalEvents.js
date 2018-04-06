const readline = require('readline')

function handleSignalEvents() {
  let gracefulExitStatus = false
  let SIGINTCount = 0

  if (process.platform === 'win32') {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    rl.on('SIGINT', () => {
      process.emit('SIGINT')
    })
  }

  process.on('SIGINT', () => {
    gracefulExitStatus = true
    SIGINTCount += 1
    const msg = [
      'Waiting for current operation to gracefully finish (this might take some seconds)... Press CTRL + C again to force an exit',
      'NOTE: Doing so might corrupt the applications state information!'
    ].join('\n')
    if (SIGINTCount < 2) {
      console.log(msg) // eslint-disable-line no-console
    } else {
      gracefulExitStatus = false
      process.exit()
    }
  })

  // "public" functions which expose the state variables
  function getGracefulExitStatus() {
    return gracefulExitStatus
  }

  function getSIGINTCount() {
    return SIGINTCount
  }

  return {
    getGracefulExitStatus,
    getSIGINTCount
  }
}

module.exports = handleSignalEvents
