const aws = require('aws-sdk')
const Component = require('../../src/lib/Component/serverless')
const { mergeDeepRight, pick, hashFile } = require('../../src/utils')
const { pack, publishLayer, deleteLayer, getLayer, configChanged } = require('./utils')

const outputMask = ['name', 'description', 'arn']

const defaults = {
  name: 'serverless',
  description: 'Serverless Layer',
  code: process.cwd(),
  runtimes: ['nodejs8.10'],
  prefix: undefined,
  include: [],
  // bucket: 'serverless-layers-deployment-bucket',
  region: 'us-east-1'
}

class AwsLambdaLayer extends Component {
  async default(inputs = {}) {
    const config = mergeDeepRight(defaults, inputs)

    const lambda = new aws.Lambda({
      region: config.region,
      credentials: this.context.credentials.aws
    })

    if (this.state.name && this.state.name !== config.name) {
      this.cli.status('Replacing')
      await deleteLayer(lambda, this.state.arn)
      delete this.state.arn
    }

    config.arn = this.state.arn

    this.cli.status('Packaging')

    config.zipPath = await pack(config.code, config.prefix, config.include)
    config.hash = await hashFile(config.zipPath)

    const prevLayer = await getLayer(lambda, config.arn)

    if (this.state.bucket) {
      prevLayer.bucket = this.state.bucket
    }

    if (configChanged(prevLayer, config)) {
      this.cli.status('Uploading')
      if (config.bucket) {
        const bucket = this.load('AwsS3')
        await bucket.upload({ name: config.bucket, file: config.zipPath })
      }
      config.arn = await publishLayer({ lambda, ...config })
    }

    this.state.name = config.name
    this.state.arn = config.arn
    this.state.bucket = config.bucket || undefined

    await this.save()

    const outputs = pick(outputMask, config)
    this.cli.outputs(outputs)
    return outputs
  }

  // todo remove all versions?
  async remove(inputs = {}) {
    if (!inputs.arn && !this.state.arn) {
      return
    }
    this.cli.status('Removing')

    const lambda = new aws.Lambda({
      region: inputs.region || defaults.region,
      credentials: this.context.credentials.aws
    })
    const arn = inputs.arn || this.state.arn

    await deleteLayer(lambda, arn)

    this.state = {}

    await this.save()

    return { arn }
  }
}

module.exports = AwsLambdaLayer
