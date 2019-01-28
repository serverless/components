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

const outputProps = [
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

class Lambda extends Component {
  async default() {
    this.defaults = {
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

    const config = mergeDeep(this.defaults, this.inputs)

    const lambda = new aws.Lambda()
    const role = new Role(`${this.id}.lambdaRole`, config)

    config.role = config.role || (await role())

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

    this.cli.success(`Lambda Deployed`)

    this.cli.log('')
    this.cli.output('Name', `    ${config.name}`)
    this.cli.output('Memory', `  ${config.memory}`)
    this.cli.output('Timeout', ` ${config.timeout}`)
    this.cli.output('Runtime', ` ${config.runtime}`)
    this.cli.output('Handler', ` ${config.handler}`)
    this.cli.output('ARN', `     ${config.arn}`)

    return pick(outputProps, config)
  }
}

module.exports = Lambda
