const { mergeDeepRight, dirExists } = require('../../src/utils')
const Component = require('../../src/lib/Component/serverless')
const { getClients, configureWebsite, clearBucket, deleteBucket, uploadDir } = require('./utils')

const defaults = {
  name: 'serverless-testing-acceleration',
  website: true,
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

    await clients.regular.createBucket({ Bucket: config.name }).promise()

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

  async remove(inputs) {
    // todo what if there's no region in state
    if (!inputs.name && !this.state.name) {
      this.cli.log('no bucket name found in state.')
      return
    }

    const name = inputs.name || this.state.name

    this.cli.status(`Removing`)

    const clients = getClients(this.context.credentials.aws, this.state.region)

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
