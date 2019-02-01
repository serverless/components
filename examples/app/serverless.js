const Component = require('../../components/Component/serverless')
const RealtimeApp = require('../../components/RealtimeApp/serverless')

class App extends Component {
  async default() {
    this.cli.status('Deploying My App')

    // 1. define your inputs
    const inputs = {
      name: 'my-app',
      stage: 'dev',
      description: 'My App',
      frontend: {
        code: './frontend',
        assets: '.',
        envFileLocation: './src/env.js',
        env: {},
        buildCmd: null
      },
      backend: {
        code: './backend',
        memory: 512,
        timeout: 10,
        env: {}
      }
    }

    // 2. Init the component(s)
    const realtimeApp = new RealtimeApp(`${this.id}.realtimeApp`)

    // 3. Run the component(s)
    const outputs = await realtimeApp(inputs)

    // 4. Customize your CLI experience
    this.cli.success('My App Deployed')
    this.cli.log('')
    this.cli.output('Socket URL', ` ${outputs.socket.websockets.url}`)
    this.cli.output('Website URL', `${outputs.website.url}`)

    return outputs
  }

  async remove() {
    this.cli.status('Removing My App')

    const realtimeApp = new RealtimeApp(`${this.id}.realtimeApp`)
    const outputs = await realtimeApp.remove()

    this.cli.success('My App Removed')

    return outputs
  }

  async connect(inputs = {}) {
    const realtimeApp = new RealtimeApp(`${this.id}.realtimeApp`)
    return realtimeApp.connect(inputs)
  }
}

module.exports = App
