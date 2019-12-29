const Context = require('./Context')
const path = require('path')
const { tmpdir } = require('os')
const { pack, getComponentUploadUrl, putComponentPackage } = require('./utils')

class Component {
  constructor(props = {}, context = {}) {
    this.name = props.name
    this.version = props.version
    this.org = props.org
    this.author = props.author
    this.description = props.description || 'This is a Serverless Component'
    this.keywords = props.keywords || 'aws, serverless'
    this.repo = props.repo
    this.readme = props.readme
    this.license = props.license || 'MIT'
    this.main = props.main || './src'

    this.context = typeof context.log === 'function' ? context : new Context(context)

    this.validate()
  }

  validate() {
    if (!this.name) {
      throw new Error('Invalid component. Missing name.')
    }
    if (!this.org) {
      throw new Error('Invalid component. Missing org.')
    }
    if (!this.author) {
      throw new Error('Invalid component. Missing author.')
    }

    if (!this.version) {
      this.version = 'dev'
    }

    if (this.main) {
      this.main = path.resolve(process.cwd(), this.main)
    } else {
      this.main = process.cwd()
    }
  }

  get() {
    return {
      name: this.name,
      version: this.version,
      org: this.org,
      author: this.author,
      description: this.description,
      keywords: this.keywords,
      repo: this.repo,
      readme: this.readme,
      license: this.license,
      main: this.main
    }
  }

  async publish() {
    const props = this.get()

    if (!this.context.accessKey) {
      throw new Error(`Unable to publish. Missing accessKey.`)
    }

    const entity = `${this.name}@${this.version}`

    this.context.status(`Publishing`, entity)

    // Get Component path and temporary path for packaging
    const componentPackagePath = path.join(
      tmpdir(),
      `${Math.random()
        .toString(36)
        .substring(6)}.zip`
    )

    this.context.debug(`Packaging component from ${this.main}`)

    const res = await Promise.all([
      getComponentUploadUrl(props, this.context.accessKey),
      pack(this.main, componentPackagePath)
    ])

    const componentUploadUrl = res[0]

    this.context.debug(`Component packaged into ${componentPackagePath}`)

    this.context.debug(`Uploading component package`)

    await putComponentPackage(componentPackagePath, componentUploadUrl)

    this.context.debug(`Component package uploaded`)
  }
}

module.exports = Component
