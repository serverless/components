/*
 * Component – RealtimeApp
 */

const { mergeDeepRight } = require('../../src/utils')
const { Component } = require('../../src')

/*
 * Get Config
 * - Merges configuration with defaults
 */

const getConfig = (inputs) => {
  const defaults = {
    name: 'realtimeApp',
    description: 'Realtime App',
    region: 'us-east-1',
    frontend: {
      path: './frontend',
      assets: './frontend',
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

  config.backend.name = `${config.name}`
  config.backend.description = config.description
  config.backend.region = config.region
  config.frontend.name = `${config.name}`
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
    this.cli.status('Deploying')
    inputs = inputs || {}
    // Get config from inputs and defaults
    if (!inputs.name) {
      inputs.name = this.constructor.name
    }
    const config = getConfig(inputs)

    const website = await this.load('Website')
    const socket = await this.load('Socket')

    const socketOutputs = await socket(config.backend)
    config.frontend.env.urlWebsocketApi = socketOutputs.url // pass backend url to frontend
    const websiteOutputs = await website(config.frontend)

    // this high level component doesn't need to save any state!

    let outputs = {
      frontend: {
        url: websiteOutputs.url,
        env: websiteOutputs.env
      },
      backend: {
        url: socketOutputs.url,
        env: socketOutputs.code.env
      }
    }
    this.cli.outputs(outputs)
    return outputs
  }

  /*
   * Remove
   */

  async remove() {
    // this remove function just calls remove on the child components
    // it doesn't even need any inputs at all since all is available in children state!
    this.cli.status('Removing')

    const website = await this.load('Website')
    const socket = await this.load('Socket')

    const outputs = await Promise.all([website.remove(), socket.remove()])

    return {}
  }

  /*
   * Connect
   */

  async connect(inputs = {}) {
    // in this particular case, we want to load the Socket component
    // AND turn on its cli, which is turned off by default since it's a child
    // that's why the last argument is false
    //
    // the second (componentAlias) argument is undefined because we
    // only have a single instance, so the default behavor of using
    // the child component class name as an alias is fine
    const socket = await this.load('Socket', undefined, false)
    return socket.connect(inputs)
  }
}

module.exports = RealtimeApp
