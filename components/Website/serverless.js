const aws = require('aws-sdk')
const path = require('path')
const util = require('util')
const exec = util.promisify(require('child_process').exec)
const { pick, isEmpty, mergeDeepRight, writeFile } = require('../../src/utils')
const { getBucketName, uploadDir, deleteWebsiteBucket, configureWebsite } = require('./utils')
const Component = require('../../src/lib/Component/serverless') // TODO: Change to { Component } = require('serverless')

let outputs = ['name', 'url']
const defaults = {
  name: 'serverless',
  path: process.cwd(),
  assets: process.cwd(),
  envFile: path.join(process.cwd(), 'src', 'env.js'),
  env: {},
  buildCmd: null,
  region: 'us-east-1'
}

/*
 * Website
 */

class Website extends Component {

  /*
   * Default
   */

  async default(inputs = {}) {
    const config = mergeDeepRight(defaults, inputs)
    const s3 = new aws.S3({ region: config.region, credentials: this.context.credentials.aws })

    // Ensure paths are resolved
    config.path = path.resolve(config.path)
    config.assets = path.resolve(config.assets)
    config.envFile = path.resolve(config.envFile)

    const nameChanged = this.state.name && this.state.name !== config.name

    // get a globally unique bucket name
    // based on the passed in name
    config.bucketName =
      this.state.bucketName && !nameChanged ? this.state.bucketName : getBucketName(config.name)

    this.cli.status(`Deploying`)

    // if bucket already exists in my account, this call still succeeds!
    // if bucket name is unavailable, an error is thrown
    await s3.createBucket({ Bucket: config.bucketName }).promise()

    await configureWebsite({ s3, ...config }) // put policies

    if (!isEmpty(config.env) && config.buildCmd) {
      let script = 'window.env = {};\n'
      for (const e in config.env) {
        // eslint-disable-line
        script += `window.env.${e} = ${JSON.stringify(config.env[e])};\n` // eslint-disable-line
      }
      await writeFile(config.envFile, script)
    }

    // If a build command is provided, build the website...
    if (config.buildCmd) {
      this.cli.status('Building')

      let result
      let options = { cwd: config.path }
      try {
        result = await exec(config.buildCmd, options)
      } catch (err) {
        console.error(err.stderr)
        throw new Error(
          `Failed building website via "${
            config.buildCmd
          }".  View the output above for more information.`
        )
      }
    }

    this.cli.status('Uploading')
    await uploadDir({ s3, ...config })

    config.url = `http://${config.bucketName}.s3-website-${config.region}.amazonaws.com`

    if (nameChanged) {
      this.cli.status(`Replacing`)
      await deleteWebsiteBucket({ s3, ...this.state })
    }

    this.state.name = config.name
    this.state.bucketName = config.bucketName
    this.state.url = config.url
    await this.save()

    outputs = {}
    outputs.url = this.state.url
    outputs.env = Object.keys(config.env) || []
    this.cli.outputs(outputs)
    return outputs
  }

  async remove(inputs = {}) {
    const config = mergeDeepRight(defaults, inputs)
    if (!this.state.bucketName) {
      this.cli.log('no website bucket name found in state.')
      return
    }

    const s3 = new aws.S3({ region: config.region, credentials: this.context.credentials.aws })

    this.cli.status(`Removing`)

    await deleteWebsiteBucket({ s3, ...this.state })

    this.state = {}
    await this.save()
    return {}
  }
}

module.exports = Website
