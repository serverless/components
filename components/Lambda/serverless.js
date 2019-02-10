const aws = require('aws-sdk')
const { mergeDeepRight, pick } = require('../../src/utils')
const Component = require('../Component/serverless')
const {
  createLambda,
  updateLambda,
  getLambda,
  deleteLambda,
  configChanged,
  pack,
  hash
} = require('./utils')

const outputs = [
  'name',
  'description',
  'memory',
  'timeout',
  'code',
  'shim',
  'handler',
  'runtime',
  'env',
  'role',
  'arn'
]

const defaults = {
  name: 'serverless',
  description: 'Serverless Lambda Component',
  memory: 128,
  timeout: 10,
  code: process.cwd(),
  shim: null,
  handler: 'handler.hello',
  runtime: 'nodejs8.10',
  env: {},
  region: 'us-east-1'
}

class Lambda extends Component {
  async default(inputs = {}) {
    const config = mergeDeepRight(defaults, inputs)

    this.cli.status(`Deploying`)

    const lambda = new aws.Lambda({ region: config.region, credentials: this.credentials.aws })

    const role = this.load('Role')

    config.role = config.role || (await role(config))

    this.cli.status(`Packaging`)

    config.zip = await pack({ code: config.code, shim: config.shim })
    config.hash = hash(config.zip)

    const prevLambda = await getLambda({ lambda, ...config })

    if (!prevLambda) {
      this.cli.status(`Creating`)
      config.arn = await createLambda({ lambda, ...config })
    } else {
      config.arn = prevLambda.arn
      if (configChanged(prevLambda, config)) {
        this.cli.status(`Updating`)
        await updateLambda({ lambda, ...config })
      }
    }

    if (this.state.name && this.state.name !== config.name) {
      this.cli.status(`Replacing`)
      await deleteLambda({ lambda, name: this.state.name })
    }

    this.state.name = config.name
    this.state.arn = config.arn
    this.save()

    this.cli.output('Name', `    ${config.name}`)
    this.cli.output('Memory', `  ${config.memory}`)
    this.cli.output('Timeout', ` ${config.timeout}`)
    this.cli.output('Runtime', ` ${config.runtime}`)
    this.cli.output('Handler', ` ${config.handler}`)
    this.cli.output('ARN', `     ${config.arn}`)

    return pick(outputs, config)
  }

  async remove(inputs = {}) {
    const config = mergeDeepRight(defaults, inputs)
    config.name = inputs.name || this.state.name || defaults.name
    const lambda = new aws.Lambda({ region: config.region, credentials: this.credentials.aws })

    this.cli.status(`Removing`)

    const role = this.load('Role')

    // there's no need to pass role name as input
    // since it's saved in the Role component state
    await role.remove()

    await deleteLambda({ lambda, name: config.name })

    this.state = {}
    this.save()

    this.cli.output('Name', ` ${config.name}`)

    return pick(outputs, config)
  }
}

module.exports = Lambda
