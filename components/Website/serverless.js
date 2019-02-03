const aws = require('aws-sdk')
const path = require('path')
const { execSync } = require('child_process')
const { pick, isEmpty, mergeDeepRight, writeFile } = require('../../src/utils')

const { getBucketName, uploadDir, deleteWebsiteBucket, configureWebsite } = require('./utils')

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
    const config = mergeDeepRight(defaults, inputs)
    const s3 = new aws.S3(config)

    const nameChanged = this.state.name && this.state.name !== config.name

    // get a globally unique bucket name
    // based on the passed in name
    config.bucketName =
      this.state.bucketName && !nameChanged ? this.state.bucketName : getBucketName(config.name)
    config.assets = path.resolve(config.code, config.assets)

    this.cli.status(`Deploying Website`)

    // if bucket already exists in my account, this call still succeeds!
    // if bucket name is unavailable, an error is thrown
    await s3.createBucket({ Bucket: config.bucketName }).promise()

    await configureWebsite({ s3, ...config }) // put policies

    // Include Environment Variables if they exist
    const envFileLocation = path.resolve(config.code, config.envFileLocation)

    if (!isEmpty(config.env) && config.buildCmd) {
      let script = 'export const env = {\n'
      for (const e in config.env) {
        // eslint-disable-line
        script += `${e}: ${JSON.stringify(config.env[e])}\n` // eslint-disable-line
      }
      script += '}'

      await writeFile(envFileLocation, script)
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

    config.url = `http://${config.bucketName}.s3-website-${config.region}.amazonaws.com`

    if (nameChanged) {
      this.cli.status(`Removing Previous Website`)
      await deleteWebsiteBucket({ s3, ...this.state })
    }

    this.state.name = config.name
    this.state.bucketName = config.bucketName
    this.state.url = config.url
    this.save()

    this.cli.success(`Website Deployed`)
    this.cli.output('URL', `    ${config.url}`)

    return pick(outputs, config)
  }

  async remove(inputs) {
    if (!this.state.bucketName) {
      this.cli.log('no website bucket name found in state.')
      return
    }

    const s3 = new aws.S3(inputs)

    this.cli.status(`Removing Website`)

    await deleteWebsiteBucket({ s3, ...this.state })

    this.state = {}
    this.save()

    this.cli.success(`Website Removed`)
  }
}

module.exports = Website
