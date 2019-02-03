const aws = require('aws-sdk')
const { mergeDeep, pick } = require('../../src/utils')
const Component = require('../Component/serverless')
const Role = require('../Role/serverless')
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
  env: {}
}

class Lambda extends Component {
  async default(inputs = {}) {
    const config = mergeDeep(defaults, inputs)

    const lambda = new aws.Lambda(config)
    const role = new Role(`${this.id}.role`)

    config.role = config.role || (await role(config))

    this.cli.status(`Packaging Lambda`)

    config.zip = await pack({ code: config.code, shim: config.shim })
    config.hash = hash(config.zip)

    const prevLambda = await getLambda({ lambda, ...config })

    if (!prevLambda) {
      this.cli.status(`Creating Lambda`)
      config.arn = await createLambda({ lambda, ...config })
    } else {
      config.arn = prevLambda.arn
      if (configChanged(prevLambda, config)) {
        this.cli.status(`Updating Lambda`)
        await updateLambda({ lambda, ...config })
      }
    }

    if (this.state.name && this.state.name !== config.name) {
      this.cli.status(`Removing Previous Lambda`)
      await deleteLambda({ lambda, name: this.state.name })
    }

    this.state.name = config.name
    this.state.arn = config.arn
    this.save()

    this.cli.success(`Lambda Deployed`)

    this.cli.log('')
    this.cli.output('Name', `    ${config.name}`)
    this.cli.output('Memory', `  ${config.memory}`)
    this.cli.output('Timeout', ` ${config.timeout}`)
    this.cli.output('Runtime', ` ${config.runtime}`)
    this.cli.output('Handler', ` ${config.handler}`)
    this.cli.output('ARN', `     ${config.arn}`)

    return pick(outputs, config)
  }

  async remove(inputs = {}) {
    const config = mergeDeep(defaults, inputs)
    config.name = inputs.name || this.state.name || defaults.name
    const lambda = new aws.Lambda(config)

    this.cli.status(`Removing Lambda`)

    const role = new Role(`${this.id}.role`)

    // there's no need to pass role name as input
    // since it's saved in the Role component state
    await role.remove()

    await deleteLambda({ lambda, name: config.name })

    this.state = {}
    this.save()

    this.cli.success(`Lambda Removed`)
    this.cli.output('Name', `   ${config.name}`)

    return pick(outputs, config)
  }
}

module.exports = Lambda
