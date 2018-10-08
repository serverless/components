import readline from 'readline'

const handleSignalEvents = (context) => {
  // NOTE: instantiating this global variable here to keep track of the state
  // usually global variables should be "considered harmful" but are a good fit in this case
  global.signalEventHandling = {
    SIGINTCount: 0,
    shouldExitGracefully: false
  }

  let msg = 'Waiting for current operation to gracefully finish (this might take some time)...'

  if (process.platform === 'win32') {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    rl.on('SIGINT', () => {
      process.emit('SIGINT')
    })
    rl.on('SIGTERM', () => {
      process.emit('SIGTERM')
    })
    rl.on('SIGBREAK', () => {
      process.emit('SIGBREAK')
    })
  }

  process.on('SIGINT', () => {
    global.signalEventHandling.SIGINTCount += 1
    global.signalEventHandling.shouldExitGracefully = true
    if (global.signalEventHandling.SIGINTCount < 2) {
      msg = `${msg} Press CTRL + C again to force an exit\nNOTE: Doing so might corrupt the applications state information!`
      context.log(msg)
    } else {
      process.exit(1)
    }
  })

  process.on('SIGTERM', () => {
    global.signalEventHandling.shouldExitGracefully = true
    context.log(msg)
  })

  process.on('SIGBREAK', () => {
    global.signalEventHandling.shouldExitGracefully = true
    context.log(msg)
  })
}

export default handleSignalEvents
