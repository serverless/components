const readline = require('readline')

function handleSignalEvents() {
  let count = 0
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
    count += 1
    const msg = [
      'Waiting for current operations to finish... Press CTRL + C again to force an exit',
      'NOTE: Doing so might corrupt the applications state information!'
    ].join('\n')
    if (count < 2) {
      console.log(msg) // eslint-disable-line no-console
    } else {
      process.exit()
    }
  })
}

module.exports = handleSignalEvents
