const aws = require('aws-sdk')
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const { pick, isEmpty, mergeDeep } = require('../../src/utils')

const { getBucketName, uploadDir, deleteWebsiteBucket } = require('./utils')

const Component = require('../Component/serverless')

const outputs = ['name', 'url']

const defaults = {
  name: 'serverless',
  code: process.cwd(),
  assets: '.',
  envFileLocation: './src/env.js',
  env: {},
  buildCmd: null,
  region: 'us-east-1'
}

class Website extends Component {
  async default(inputs = {}) {
    const config = mergeDeep(defaults, inputs)
    const s3 = new aws.S3()

    const originalName = config.name // we need to save it to state later

    // get a globally unique bucket name
    // based on the passed in name
    config.name = getBucketName(config.name)
    config.assets = path.resolve(config.code, config.assets)

    this.cli.status(`Deploying Website`)

    // if bucket already exists in my account, this call still succeeds!
    // if bucket name is unavailable, an error is thrown
    await s3.createBucket({ Bucket: config.name }).promise()

    // Include Environment Variables if they exist
    const envFileLocation = path.resolve(config.code, config.envFileLocation)

    if (!isEmpty(config.env)) {
      let script = 'export const env = {\n'
      for (const e in config.env) {
        // eslint-disable-line
        script += `${e}: ${JSON.stringify(config.env[e])}\n` // eslint-disable-line
      }
      script += '}'

      fs.writeFileSync(envFileLocation, script)
    }

    if (config.buildCmd) {
      this.cli.status('Building Website')
      execSync(
        config.buildCmd,
        {
          cwd: config.code
        },
        (error, stdErr) => {
          if (error) {
            console.error(stdErr) // eslint-disable-line no-console
            throw new Error(error)
          }
        }
      )
    }

    this.cli.status('Uploading Files')
    await uploadDir({ s3, ...config })

    config.url = `http://${config.name}.s3-website-${config.region}.amazonaws.com`

    if (this.state.name && this.state.name !== originalName) {
      this.cli.status(`Removing Previous Website`)
      await deleteWebsiteBucket({ s3, name: this.state.name })
    }

    this.state.name = originalName
    this.state.url = config.url
    this.save()

    this.cli.success(`Website Deployed`)
    this.cli.output('URL', `    ${config.url}`)

    return pick(outputs, config)
  }

  async remove(inputs = {}) {
    const config = mergeDeep(defaults, inputs)
    config.name = inputs.name || this.state.name || defaults.name

    config.name = getBucketName(config.name)

    const s3 = new aws.S3()

    this.cli.status(`Removing Website`)

    await deleteWebsiteBucket({ s3, ...config })

    this.state = {}
    this.save()

    this.cli.success(`Website Removed`)

    return pick(outputs, config)
  }
}

module.exports = Website
