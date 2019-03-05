const path = require('path')
const util = require('util')
const exec = util.promisify(require('child_process').exec)
const { isEmpty, mergeDeepRight, writeFile } = require('../../src/utils')
const Component = require('../../src/lib/Component/serverless') // TODO: Change to { Component } = require('serverless')

let outputMask = ['name', 'url']

const defaults = {
  name: 'serverless-website-test-again',
  path: process.cwd(),
  assets: process.cwd(),
  envFile: path.join(process.cwd(), 'src', 'env.js'),
  env: {},
  buildCmd: null,
  region: 'us-east-1'
}

const getBucketName = (websiteName) => {
  websiteName = websiteName.toLowerCase()
  const bucketId = Math.random()
    .toString(36)
    .substring(6)
  websiteName = `${websiteName}-${bucketId}`
  return websiteName
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

    const bucket = this.load('AwsS3')

    await bucket({ name: config.bucketName, website: true })

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

      const options = { cwd: config.path }
      try {
        await exec(config.buildCmd, options)
      } catch (err) {
        console.error(err.stderr) // eslint-disable-line
        throw new Error(
          `Failed building website via "${
            config.buildCmd
          }".  View the output above for more information.`
        )
      }
    }

    this.cli.status('Uploading')
    await bucket.upload({ dir: config.assets })

    config.url = `http://${config.bucketName}.s3-website-${config.region}.amazonaws.com`

    this.state.name = config.name
    this.state.bucketName = config.bucketName
    this.state.url = config.url
    await this.save()

    const outputs = {}
    outputs.url = this.state.url
    outputs.env = Object.keys(config.env) || []
    this.cli.outputs(outputs)
    return outputs
  }

  async remove() {
    this.cli.status(`Removing`)

    const bucket = this.load('AwsS3')

    await bucket.remove()

    this.state = {}
    await this.save()
    return {}
  }
}

module.exports = Website
