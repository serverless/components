const Context = require('./Context')
const path = require('path')
const fs = require('fs')
const { tmpdir } = require('os')
const axios = require('axios')
const util = require('util')
const { Engine, WebSockets } = require('@serverless/client')
const exec = util.promisify(require('child_process').exec)
const { pack } = require('./utils')

class Instance {
  constructor(props = {}, context = {}) {
    this.name = props.name
    this.org = props.org
    this.app = props.app
    this.component = props.component
    this.stage = props.stage || 'dev'
    this.inputs = props.inputs || {}

    // use the provided context instance, or create a new basic context available in core
    this.context = typeof context.log === 'function' ? context : new Context(context)

    // validate the provided config
    this.validate()
  }

  /*
   * validates the component instance properties
   */
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

    // parse the org/app string (ie. app: serverlessinc/myApp)
    if (this.app.includes('/')) {
      this.org = this.app.split('/')[0]
      this.app = this.app.split('/')[1]
    }

    // org is required
    if (typeof this.org !== 'string') {
      throw new Error(`Invalid component instance. Missing "org" property.`)
    }

    // set the specified component name and version (ie. component: express@0.1.0)
    if (this.component.split('@').length === 2) {
      this.componentName = this.component.split('@')[0]
      this.componentVersion = this.component.split('@')[1]
    } else {
      // if only the component name is specified, use the dev version of that componetn by default
      this.componentName = this.component
      this.componentVersion = 'dev'
    }
  }

  /*
   * sets and updates the component instance properties and validates them again
   */
  set(props = {}) {
    this.name = props.name || this.name
    this.org = props.org || this.org
    this.app = props.app || this.app
    this.component = props.component || this.component
    this.stage = props.stage || this.stage
    this.inputs = props.inputs || this.inputs

    this.validate()
  }

  /*
   * gets a clean object of the component instance properties
   */
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

  /*
   * build and resolve the component instance src input if provided
   */
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

  /*
   * uploads the component instance src input reference if available
   */
  async upload() {
    // Skip packaging if no "src" input
    if (!this.inputs.src) {
      return
    }

    // initialize the engine service
    const engine = new Engine({ accessKey: this.context.accessKey })

    const packagePath = path.join(
      tmpdir(),
      `${Math.random()
        .toString(36)
        .substring(6)}.zip`
    )

    this.context.debug(`Packaging from ${this.inputs.src} into ${packagePath}`)
    this.context.status('Packaging')

    // get the upload and download urls for the src input
    // and package the src input directory at the same time for speed
    const res = await Promise.all([engine.getPackageUrls(), pack(this.inputs.src, packagePath)])

    // set the package signed urls. This is an object includes both the upload and downnload urls
    // the upload url is used to upload the package to s3
    // while the download url is passed to the component instannce to be downnloaded in the lambda runtime
    const packageUrls = res[0]

    this.context.status('Uploading')
    this.context.debug(`Uploading ${packagePath} to ${packageUrls.upload.split('?')[0]}`)

    // create a new axios instance and make sure we clear the default axios headers
    // as they cause a mismatch with the signature provided by aws
    const instance = axios.create()
    instance.defaults.headers.common = {}
    instance.defaults.headers.put = {}
    const body = fs.readFileSync(packagePath)

    // make sure axios handles large packages
    const config = {
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    }

    try {
      await instance.put(packageUrls.upload, body, config)
    } catch (e) {
      throw e
    }

    this.context.debug(`Upload completed`)

    // replace the src input to point to the download url so that it's download in the lambda runtime
    this.inputs.src = packageUrls.download
  }

  /*
   * run the component instance via websockets with the provided method and properties
   */
  async run(method = 'deploy') {
    const { accessKey, credentials, connectionId, debugMode } = this.context

    const runComponentInputs = {
      ...this.get(),
      accessKey,
      credentials,
      connectionId,
      debugMode,
      method
    }

    // send a websockets request to run the component instance based on the provided inputs
    this.context.ws.send(
      JSON.stringify({
        action: '$default',
        body: { method: 'runComponent', inputs: runComponentInputs }
      })
    )
  }

  /*
   * connect to the component instnace channel to receive console.log statements whenever it runs
   */
  async connect() {
    // initialize a new instance of the WebSockets service of the platform
    const websockets = new WebSockets({ accessKey: this.context.accessKey })
    const instanceId = `${this.org}.${this.app}.${this.stage}.${this.name}`

    const data = {
      ...this.get(),
      connectionId: this.context.connectionId, // the connection id of this CLI session
      channelId: `instance/${instanceId}`
    }

    await websockets.connectToChannel(data)
  }
}

module.exports = Instance
