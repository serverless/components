const { mergeDeepRight, dirExists } = require('../../src/utils')
const Component = require('../../src/lib/Component/serverless')
const { getClients, configureWebsite, clearBucket, deleteBucket, uploadDir } = require('./utils')

const defaults = {
  name: 'serverless',
  website: false,
  accelerated: true,
  region: 'us-east-1'
}

class AwsS3 extends Component {
  async default(inputs = {}) {
    const config = mergeDeepRight(defaults, inputs)

    if (config.accelerated && config.name.includes('.')) {
      throw new Error('Accelerated buckets must be DNS-compliant and must NOT contain periods')
    }

    this.cli.status(`Deploying`)

    const clients = getClients(this.context.credentials.aws, config.region)

    try {
      await clients.regular.headBucket({ Bucket: config.name }).promise()
    } catch (e) {
      if (e.code === 'NotFound') {
        await clients.regular.createBucket({ Bucket: config.name }).promise()
      } else if (e.code === 'Forbidden') {
        throw Error(`Bucket name "${config.name}" is already taken.`)
      } else {
        throw e
      }
    }

    await clients.regular
      .putBucketAccelerateConfiguration({
        AccelerateConfiguration: {
          Status: config.accelerated ? 'Enabled' : 'Suspended'
        },
        Bucket: config.name
      })
      .promise()

    if (config.website) {
      await configureWebsite(
        config.accelerated ? clients.accelerated : clients.regular,
        config.name
      )
    }

    const nameChanged = this.state.name && this.state.name !== config.name

    if (nameChanged) {
      await this.remove({ name: config.name })
    }

    this.state.name = config.name
    this.state.region = config.region
    this.state.accelerated = config.accelerated
    await this.save()

    this.cli.outputs(config)
    return config
  }

  async remove(inputs = {}) {
    if (!inputs.name && !this.state.name) {
      this.cli.log('no bucket name found in state.')
      return
    }

    const name = inputs.name || this.state.name
    const region = inputs.region || this.state.region || defaults.region

    this.cli.status(`Removing`)

    const clients = getClients(this.context.credentials.aws, region)

    await clearBucket(this.state.accelerated ? clients.accelerated : clients.regular, name)

    await deleteBucket(clients.regular, name)

    this.state = {}
    await this.save()
    return {}
  }

  async upload(inputs = { path: process.cwd() }) {
    if (!this.state.name) {
      this.cli.log('no bucket name found in state.')
      return
    }

    const clients = getClients(this.context.credentials.aws, this.state.region)

    if (await dirExists(inputs.path)) {
      await uploadDir(
        this.state.accelerated ? clients.accelerated : clients.regular,
        this.state.name,
        inputs.path
      )
    } else {
      // todo upload single file with multipart uploads
    }
  }
}

module.exports = AwsS3
