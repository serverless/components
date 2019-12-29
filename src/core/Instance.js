const Context = require('./Context')
const path = require('path')
const fs = require('fs')
const { tmpdir } = require('os')
const axios = require('axios')
const util = require('util')
const exec = util.promisify(require('child_process').exec)
const WebSocket = require('ws')
const {
  getEndpoints,
  pack,
  runComponent,
  getPackageUrls,
  addConnectionToInstance
} = require('./utils')

class Instance {
  constructor(props = {}, context = {}) {
    this.name = props.name
    this.org = props.org
    this.app = props.app
    this.component = props.component
    this.stage = props.stage || 'dev'
    this.inputs = props.inputs || {}

    this.context = typeof context.log === 'function' ? context : new Context(context)

    this.validate()
  }

  validate() {
    if (typeof this.component !== 'string') {
      throw new Error(`Invalid component instance. Missing "component" property.`)
    }

    if (typeof this.name !== 'string') {
      throw new Error(`Invalid component instance. Missing "name" property.`)
    }

    if (typeof this.app !== 'string') {
      throw new Error(`Invalid component instance. Missing "app" property.`)
    }

    if (this.app.includes('/')) {
      this.org = this.app.split('/')[0]
      this.app = this.app.split('/')[1]
    }

    if (typeof this.org !== 'string') {
      throw new Error(`Invalid component instance. Missing "org" property.`)
    }

    if (this.component.split('@').length === 2) {
      this.componentName = this.component.split('@')[0]
      this.componentVersion = this.component.split('@')[1]
    } else {
      this.componentName = this.component
      this.componentVersion = 'dev'
    }
  }

  set(props = {}) {
    this.name = props.name || this.name
    this.org = props.org || this.org
    this.app = props.app || this.app
    this.component = props.component || this.component
    this.stage = props.stage || this.stage
    this.inputs = props.inputs || this.inputs

    this.validate()
  }

  get() {
    return {
      name: this.name,
      org: this.org,
      app: this.app,
      component: this.component,
      componentName: this.componentName,
      componentVersion: this.componentVersion,
      stage: this.stage,
      inputs: this.inputs
    }
  }

  async connect() {
    this.context.debug('Establishing streaming connection')

    const endpoints = getEndpoints()

    return new Promise((resolve, reject) => {
      const ws = new WebSocket(endpoints.socket)

      ws.on('open', () => {
        ws.send(
          JSON.stringify({
            action: '$default'
          })
        )
      })

      ws.on('message', (message) => {
        const { event, data } = JSON.parse(message)
        if (event === 'echo') {
          this.context.socket = data
          resolve(data)
        } else if (event === 'status') {
          this.context.status(data)
        } else if (event === 'log') {
          this.context.log(data)
        } else if (event === 'debug') {
          this.context.debug(data)
        } else if (event === 'outputs') {
          this.context.outputs(data)
        } else if (event === 'error') {
          this.context.error(data)
        } else {
          this.context.log(data)
        }
      })

      ws.on('error', (e) => reject(e))
    })
  }

  async build() {
    if (typeof this.inputs.src === 'object' && this.inputs.src.hook && this.inputs.src.dist) {
      // First run the build hook, if "hook" and "dist" are specified
      this.context.status('Building')
      const options = { cwd: this.inputs.src.src }
      try {
        await exec(this.inputs.src.hook, options)
      } catch (err) {
        throw new Error(`Failed building website via "${this.inputs.src.hook}" due to the following error: "${err.stderr}"
        ${err.stdout}`)
      }
      this.inputs.src = path.resolve(path.join(process.cwd(), this.inputs.src.dist))
    } else if (typeof this.inputs.src === 'object' && this.inputs.src.src) {
      this.inputs.src = path.resolve(this.inputs.src.src)
    } else if (typeof this.inputs.src === 'string') {
      this.inputs.src = path.resolve(this.inputs.src)
    }

    return this.get()
  }

  async upload() {
    // Skip packaging if no "src" input
    if (!this.inputs.src) {
      return
    }

    const packagePath = path.join(
      tmpdir(),
      `${Math.random()
        .toString(36)
        .substring(6)}.zip`
    )

    this.context.debug(`Packaging from ${this.inputs.src} into ${packagePath}`)
    this.context.status('Packaging')

    const res = await Promise.all([
      getPackageUrls({ org: this.org, accessKey: this.context.accessKey }),
      pack(this.inputs.src, packagePath)
    ])

    const packageUrls = res[0]

    this.context.status('Uploading')
    this.context.debug(`Uploading ${packagePath} to ${packageUrls.upload.split('?')[0]}`)

    const instance = axios.create()
    instance.defaults.headers.common = {}
    instance.defaults.headers.put = {}
    const body = fs.readFileSync(packagePath)

    try {
      await instance.put(packageUrls.upload, body)
    } catch (e) {
      throw e
    }

    this.context.debug(`Upload completed`)

    this.inputs.src = packageUrls.download
  }

  async run(method = 'deploy') {
    const { accessKey, credentials, socket, debugMode } = this.context

    const runComponentInputs = {
      ...this.get(),
      accessKey,
      credentials,
      socket,
      debugMode,
      method
    }

    return runComponent(runComponentInputs)
  }

  async dev() {
    const data = {
      ...this.get(),
      accessKey: this.context.accessKey,
      socket: this.context.socket
    }

    await addConnectionToInstance(data)
  }
}

module.exports = Instance
