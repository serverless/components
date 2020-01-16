const WS = require('ws')
const { WebSockets } = require('@serverless/client')

class Context {
  constructor(config = {}) {
    this.accessKey = config.accessKey
    this.credentials = config.credentials
    this.debugMode = config.debug || false
  }

  async connect() {
    this.debug('Establishing streaming connection')

    const websockets = new WebSockets({ accessKey: this.accessKey })

    return new Promise((resolve, reject) => {
      const ws = new WS(websockets.socketRoot)

      this.ws = ws

      ws.on('open', () => {
        ws.send(
          JSON.stringify({
            action: '$default'
          })
        )
      })

      ws.on('message', (message) => {
        const { event, data } = JSON.parse(message)

        if (event === 'echo') {
          this.connectionId = data.connectionId
          resolve(data)
        } else if (event === 'status') {
          this.status(data)
        } else if (event === 'log') {
          this.log(data)
        } else if (event === 'debug') {
          this.debug(data)
        } else if (event === 'outputs') {
          this.outputs(data)
          // this.close('done', 'Done')
        } else if (event === 'error') {
          this.error(data)
        } else {
          this.log(data)
        }
      })

      ws.on('error', (e) => reject(e))
    })
  }

  log() {}

  debug() {}

  status() {}

  outputs() {}

  close() {}

  error(e) {
    throw e
  }
}

module.exports = Context
