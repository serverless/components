const aws = require('aws-sdk')
const { mergeDeepRight, pick } = require('../../src/utils')
const {
  createLambda,
  updateLambda,
  getLambda,
  deleteLambda,
  configChanged,
  pack,
  hash
} = require('./utils')
const Component = require('../../src/lib/Component/serverless') // TODO: Change to { Component } = require('serverless')


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
  description: 'AWS Lambda Component',
  memory: 128,
  timeout: 10,
  code: process.cwd(),
  shim: null,
  handler: 'handler.hello',
  runtime: 'nodejs8.10',
  env: {},
  region: 'us-east-1'
}

class AwsLambda extends Component {
  async default(inputs = {}) {
    const config = mergeDeepRight(defaults, inputs)

    this.cli.status(`Deploying`)

    const lambda = new aws.Lambda({ region: config.region, credentials: this.context.credentials.aws })

    const awsIamRole = this.load('AwsIamRole')

    config.role = config.role || (await awsIamRole(config))

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
    const lambda = new aws.Lambda({ region: config.region, credentials: this.context.credentials.aws })

    this.cli.status(`Removing`)

    const awsIamRole = this.load('AwsIamRole')

    // there's no need to pass role name as input
    // since it's saved in the Role component state
    await awsIamRole.remove()

    await deleteLambda({ lambda, name: config.name })

    this.state = {}
    this.save()

    this.cli.output('Name', ` ${config.name}`)

    return pick(outputs, config)
  }
}

module.exports = AwsLambda
