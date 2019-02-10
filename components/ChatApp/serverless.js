/*
 * Component – ChatApp
 */

const path = require('path')
const Component = require('../../components/Component/serverless')

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
    // const dynamoDb = this.load('DynamoDb')

    // Deploy the RealtimeApp...
    const realtimeApp = this.load('RealtimeApp')
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
      url: outputs.website.url
    }

    this.cli.output('URL', `${outputs.url}`)

    return outputs
  }

  /*
   * Remove
   */

  async remove() {
    this.cli.status('Removing')

    const realtimeApp = this.load('RealtimeApp')
    const outputs = await realtimeApp.remove()

    return outputs
  }

  async connect(inputs = {}) {
    const realtimeApp = this.load('RealtimeApp')
    return realtimeApp.connect({ code: './backend', ...inputs })
  }
}

module.exports = ChatApp
