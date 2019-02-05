/*
 * Component – RealtimeApp
 */

const { mergeDeepRight, getCli } = require('../../src/utils')
const Component = require('../Component/serverless')
const Socket = require('../Socket/serverless')
const Website = require('../Website/serverless')

/*
 * Get Config
 * - Merges configuration with defaults
 */

const getConfig = (inputs) => {
  const defaults = {
    name: 'realtimeApp',
    stage: 'dev',
    description: 'Realtime App',
    region: 'us-east-1',
    frontend: {
      path: './frontend',
      assets: './frontend/build',
      envFile: './frontend/src/env.js',
      env: {},
      buildCmd: null,
      localCmd: null
    },
    backend: {
      code: './backend',
      memory: 512,
      timeout: 10,
      env: {}
    }
  }

  const config = mergeDeepRight(defaults, inputs)

  config.backend.name = `${config.name}-${config.stage}`
  config.backend.description = config.description
  config.backend.credentials = config.credentials
  config.backend.region = config.region

  config.frontend.name = `${config.name}-${config.stage}`
  config.frontend.credentials = config.credentials
  config.frontend.region = config.region

  return config
}

/*
 * Class – RealtimeApp
 */

class RealtimeApp extends Component {
  /*
   * Default
   */

  async default(inputs = {}) {
    this.cli.status('Deploying Realtime App')

    // Get config from inputs and defaults
    if (!inputs.name) inputs.name = this.id
    const config = getConfig(inputs)

    const website = new Website(`${this.id}.website`)
    const socket = new Socket(`${this.id}.socket`)

    const socketOutputs = await socket(config.backend)
    config.frontend.env.urlWebsocketApi = socketOutputs.websockets.url // pass backend url to frontend
    const websiteOutputs = await website(config.frontend)

    // this high level component doesn't need to save any state!

    this.cli.success('Realtime App Deployed')
    this.cli.log('')
    this.cli.output('Socket URL', ` ${socketOutputs.websockets.url}`)
    this.cli.output('Website URL', `${websiteOutputs.url}`)

    return { website: websiteOutputs, socket: socketOutputs }
  }

  /*
   * Remove
   */

  async remove() {
    // this remove function just calls remove on the child components
    // it doesn't even need any inputs at all since all is available in children state!
    this.cli.status('Removing Realtime App')

    const website = new Website(`${this.id}.website`)
    const socket = new Socket(`${this.id}.socket`)

    const outputs = await Promise.all([website.remove(), socket.remove()])

    const websiteOutputs = outputs[0]
    const socketOutputs = outputs[1]

    this.cli.success('Realtime App Removed')

    return { website: websiteOutputs, socket: socketOutputs }
  }

  /*
   * Connect
   */

  connect(inputs = {}) {
    const socket = new Socket(`${this.id}.socket`, getCli(true)) // todo find a better way to config the cli
    return socket.connect(inputs)
  }
}

module.exports = RealtimeApp
