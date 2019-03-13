/*
 * Component – ChatApp
 */

const path = require('path')
const Component = require('../../src/lib/Component/serverless') // TODO: Change to { Component } = require('serverless')

/*
 * Class – ChatApp
 */

class ChatApp extends Component {
  /*
   * Default
   */

  async default(inputs = {}) {
    this.cli.status(`Deploying`)

    // Merge inputs with defaults
    const defaults = {
      colorBackground: '#000000',
      colorInputText: '#FFFFFF',
      logoUrl: null
    }
    inputs = Object.assign(defaults, inputs)

    // Deploy the DynamoDB table...
    // const dynamoDb = await this.load('DynamoDb')

    // Deploy the RealtimeApp...
    const realtimeApp = await this.load('RealtimeApp')
    let outputs = await realtimeApp({
      name: this.constructor.name,
      description: 'A real-time chat application.',
      frontend: {
        path: path.join(__dirname, 'frontend'),
        assets: path.join(__dirname, 'frontend', 'build'),
        envFile: path.join(__dirname, 'frontend', 'src', 'env.js'),
        buildCmd: 'npm run build',
        localCmd: 'npm run start',
        env: {
          colorBackground: inputs.colorBackground,
          colorInputText: inputs.colorInputText,
          logoUrl: inputs.logoUrl
        }
      },
      backend: {
        code: path.join(__dirname, 'backend')
      }
    })

    outputs = {
      url: outputs.frontend.url
    }

    this.cli.outputs(outputs)
    return outputs
  }

  /*
   * Remove
   */

  async remove() {
    this.cli.status('Removing')

    const realtimeApp = await this.load('RealtimeApp')
    const outputs = await realtimeApp.remove()

    this.state = {}
    await this.save()
    return {}
  }

  async connect(inputs = {}) {
    const realtimeApp = await this.load('RealtimeApp')
    return realtimeApp.connect({ code: './backend', ...inputs })
  }
}

module.exports = ChatApp
