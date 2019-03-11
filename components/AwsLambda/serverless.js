const aws = require('aws-sdk')
const { mergeDeepRight, pick, hashFile } = require('../../src/utils')
const {
  createLambda,
  updateLambda,
  getLambda,
  deleteLambda,
  configChanged,
  pack
} = require('./utils')
const Component = require('../../src/lib/Component/serverless') // TODO: Change to { Component } = require('serverless')

const outputMask = [
  'name',
  'description',
  'memory',
  'timeout',
  'code',
  'bucket',
  'shims',
  'handler',
  'runtime',
  'env',
  'role',
  'arn'
]

const defaults = {
  name: 'serverless',
  description: 'AWS Lambda Component',
  memory: 512,
  timeout: 10,
  code: process.cwd(),
  bucket: null,
  shims: [],
  handler: 'handler.hello',
  runtime: 'nodejs8.10',
  env: {},
  region: 'us-east-1'
}

class AwsLambda extends Component {
  async default(inputs = {}) {
    const config = mergeDeepRight(defaults, inputs)

    this.cli.status(`Deploying`)

    const lambda = new aws.Lambda({
      region: config.region,
      credentials: this.context.credentials.aws
    })

    const awsIamRole = this.load('AwsIamRole')

    config.role = config.role || (await awsIamRole(config))

    this.cli.status(`Packaging`)

    config.zipPath = await pack(config.code, config.shims)
    config.hash = await hashFile(config.zipPath)

    let deploymentBucket
    if (config.bucket) {
      deploymentBucket = this.load('AwsS3')
      await deploymentBucket({ name: config.bucket })
    }

    const prevLambda = await getLambda({ lambda, ...config })

    if (!prevLambda) {
      if (config.bucket) {
        this.cli.status(`Uploading`)
        await deploymentBucket.upload({ file: config.zipPath })
      }

      this.cli.status(`Creating`)
      config.arn = await createLambda({ lambda, ...config })
    } else {
      config.arn = prevLambda.arn
      if (configChanged(prevLambda, config)) {
        if (config.bucket) {
          this.cli.status(`Uploading`)
          await deploymentBucket.upload({ file: config.zipPath })
        }

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
    await this.save()

    const outputs = pick(outputMask, config)
    this.cli.outputs(outputs)
    return outputs
  }

  async remove(inputs = {}) {
    const config = mergeDeepRight(defaults, inputs)
    config.name = inputs.name || this.state.name || defaults.name
    const lambda = new aws.Lambda({
      region: config.region,
      credentials: this.context.credentials.aws
    })

    this.cli.status(`Removing`)

    const awsIamRole = this.load('AwsIamRole')
    const deploymentBucket = this.load('AwsS3')

    // there's no need to pass names as input
    // since it's saved in the child component state
    await awsIamRole.remove()
    await deploymentBucket.remove()

    await deleteLambda({ lambda, name: config.name })

    this.state = {}
    await this.save()

    return {}
  }
}

module.exports = AwsLambda
