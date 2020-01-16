const Context = require('./Context')
const path = require('path')
const fs = require('fs')
const { tmpdir } = require('os')
const chokidar = require('chokidar')
const axios = require('axios')
const { Registry, WebSockets } = require('@serverless/client')
const { pack } = require('./utils')

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

    const registry = new Registry({ accessKey: this.context.accessKey })

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

    // package the component and get an upload url at the same time
    const res = await Promise.all([
      registry.prePublish(props),
      pack(this.main, componentPackagePath)
    ])

    const componentUploadUrl = res[0].url

    this.context.debug(`Component packaged into ${componentPackagePath}`)
    this.context.debug(`Uploading component package`)

    // axios auto adds headers that causes signature mismatch
    // so we gotta remove them manually
    const instance = axios.create()
    instance.defaults.headers.common = {}
    instance.defaults.headers.put = {}
    const file = fs.readFileSync(componentPackagePath)

    // make sure axios handles large packages
    const config = {
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    }

    try {
      await instance.put(componentUploadUrl, file, config)
    } catch (e) {
      throw e
    }

    this.context.debug(`Component package uploaded`)
  }

  async connect() {
    const websockets = new WebSockets({ accessKey: this.context.accessKey })

    // connect to that component channel to receive console.logs from component lambda
    const data = {
      connectionId: this.context.connectionId,
      channelId: `component/${this.name}`
    }

    await websockets.connectToChannel(data)
  }

  async dev() {
    await this.connect()

    let isProcessing = false
    let queuedOperation = false
    const entity = `${this.name}@${this.version}`

    const watcher = chokidar.watch(this.main, { ignored: /\.serverless/ })

    watcher.on('ready', async () => {
      this.context.status('Watching', entity)
    })

    watcher.on('change', async () => {
      try {
        if (isProcessing && !queuedOperation) {
          queuedOperation = true
        } else if (!isProcessing) {
          isProcessing = true

          await this.publish()
          if (queuedOperation) {
            queuedOperation = false
            await this.publish()
          }

          isProcessing = false
          this.context.status('Watching', entity)
        }
      } catch (e) {
        isProcessing = false
        queuedOperation = false
        this.context.error(e)
        this.context.status('Watching', entity)
      }
    })
  }
}

module.exports = Component
