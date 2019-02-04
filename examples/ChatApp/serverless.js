/*
* Component – ChatApp
*/

const { execSync } = require('child_process')
const Component = require('../../components/Component/serverless')
const RealtimeApp = require('../../components/RealtimeApp/serverless')

class ChatApp extends Component {

  /*
  * Default
  */

  async default() {

    this.cli.status(`Deploying ChatApp`)

    // 1. define your inputs
    const inputs = {
      name: 'my-app',
      stage: 'dev',
      description: 'My App',
      frontend: {
        code: './frontend/build',
        assets: '.',
        envFileLocation: './src/env.js',
        env: {},
        buildCmd: 'npm run build',
        localCmd: 'npm run start',
      },
      backend: {
        code: './backend',
        memory: 512,
        timeout: 10,
        env: {}
      }
    }

    const realtimeApp = new RealtimeApp(`${this.id}.realtimeApp`)
    const outputs = await realtimeApp(inputs)

    // 4. Customize your CLI experience
    this.cli.success('ChatApp Deployed')
    this.cli.log('')
    this.cli.output('URL', `${outputs.website.url}`)
    this.cli.output('Websocket URL', ` ${outputs.socket.websockets.url}`)

    return outputs
  }

  /*
  * Remove
  */

  async remove() {
    this.cli.status('Removing ChatApp')

    const realtimeApp = new RealtimeApp(`${this.id}.realtimeApp`)
    const outputs = await realtimeApp.remove()

    this.cli.success('ChatApp Removed')

    return outputs
  }

  async connect(inputs = {}) {
    const realtimeApp = new RealtimeApp(`${this.id}.realtimeApp`)
    return realtimeApp.connect({ code: './backend', ...inputs })
  }

  /*
  * Local
  * TODO: Finish
  */

  async local(inputs = {}) {
    const realtimeApp = new RealtimeApp(`${this.id}.realtimeApp`)
    return realtimeApp.local({
      assets: './frontend',
      cmdLocal: 'npm run start',
    })
  }
}

module.exports = ChatApp
