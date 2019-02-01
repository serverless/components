const { mergeDeep, all, getCli } = require('../../src/utils')

const Component = require('../Component/serverless')
const Socket = require('../Socket/serverless')
const Website = require('../Website/serverless')

// private helper functionn
const getConfig = (inputs) => {
  const defaults = {
    name: 'realtimeApp',
    stage: 'dev',
    description: 'Realtime App',
    region: 'us-east-1',
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

  const config = mergeDeep(defaults, inputs)

  config.backend.name = `${config.name}-${config.stage}`
  config.backend.description = config.description
  config.backend.credentials = config.credentials
  config.backend.region = config.region

  config.frontend.name = `${config.name}-${config.stage}`
  config.frontend.credentials = config.credentials
  config.frontend.region = config.region

  return config
}

class RealtimeApp extends Component {
  async default(inputs = {}) {
    this.cli.status('Deploying Realtime App')
    const config = getConfig(inputs)

    const website = new Website(`${this.id}.website`)
    const socket = new Socket(`${this.id}.socket`)

    // deploy in parallel like a boss!
    const outputs = await all([website(config.frontend), socket(config.backend)])
    const websiteOutputs = outputs[0]
    const socketOutputs = outputs[1]

    this.cli.success('Realtime App Deployed')
    this.cli.log('')
    this.cli.output('Socket URL', ` ${socketOutputs.websockets.url}`)
    this.cli.output('Website URL', `${websiteOutputs.url}`)

    // this high level component doesn't need to save any state!

    return { website: websiteOutputs, socket: socketOutputs }
  }

  async remove() {
    // this remove function just calls remove on the child components
    // it doesn't even need any inputs at all since all is available in children state!
    this.cli.status('Removing Realtime App')

    const website = new Website(`${this.id}.website`)
    const socket = new Socket(`${this.id}.socket`)

    const outputs = await all([website.remove(), socket.remove()])

    const websiteOutputs = outputs[0]
    const socketOutputs = outputs[1]

    this.cli.success('Realtime App Removed')

    return { website: websiteOutputs, socket: socketOutputs }
  }

  connect(inputs = {}) {
    const socket = new Socket(`${this.id}.socket`, getCli(true)) // todo find a better way to config the cli
    return socket.connect(inputs)
  }
}

module.exports = RealtimeApp