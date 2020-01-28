/*
 * SERVERLESS COMPONENTS: INSTANCE
 */

const path = require('path')
const fs = require('fs')
const { tmpdir } = require('os')
const axios = require('axios')
const util = require('util')
const exec = util.promisify(require('child_process').exec)
const { 
  pack,
  getDirSize,
  loadInstanceConfig,
  loadInstanceCredentials,
  resolveInputVariables,
} = require('../utils')

class Instance {

  constructor(client) {
    this.client = client

    // Config file properties
    this.name = null
    this.org = null
    this.app = null
    this.component = null
    this.stage = process.env.SERVERLESS_STAGE || 'dev'
    this.inputs = {}

    // Additional properties
    this.componentName = null
    this.componentVersion = null
    this.credentials = {}
  }

  /**
   * Validates the component instance properties
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

    // org is required
    if (typeof this.org !== 'string') {
      throw new Error(`Invalid component instance. Missing "org" property.`)
    }
  }

  /**
   * Sets and updates the component instance properties and validates them again
   * @param {*} props 
   */
  set(props = {}) {
    this.name = props.name ? props.name.trim() : this.name
    this.org = props.org ? props.org.trim() : this.org
    this.app = props.app ? props.app.trim() : this.app
    this.component = props.component ? props.component.trim() : this.component
    this.stage = process.env.SERVERLESS_STAGE || props.stage || this.stage // ENV var always takes precedence 
    this.stage = this.stage.trim()
    this.inputs = props.inputs || this.inputs
    this.credentials = props.credentials || this.credentials

    // parse the org/app string (ie. app: serverlessinc/myApp)
    if (this.app.includes('/')) {
      this.org = this.app.split('/')[0]
      this.app = this.app.split('/')[1]
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

    // Resolve Serverless Variables for environment variables only
    this.inputs = resolveInputVariables(this.inputs)

    this.validate()
  }

  /**
   * Gets a clean object of the component instance properties
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

  /**
   * Load an instance via serverless.yml/json given a directory where it should exist
   * @param {*} directoryPath 
   */
  load(directoryPath) {
    const serverlessInstanceFile = loadInstanceConfig(directoryPath)
    serverlessInstanceFile.credentials = loadInstanceCredentials(directoryPath)
    this.set(serverlessInstanceFile)
  }

  /**
   * Run a method. "inputs" override serverless.yml inputs and should only be provided when using custom methods.
   * @param {*} method 
   * @param {*} inputs 
   * @param {*} options 
   */
  async preRun(method, inputs = {}, options = {}) {
    // Validate and sanitize
    if (!method) {
      throw new Error(`A "method" argument is required`)
    }
    if (!this.org) {
      throw new Error(`This instance is missing an "org"`)
    }
    if (!this.app) {
      throw new Error(`This instance is missing an "app"`)
    }
    if (!this.name) {
      throw new Error(`This instance is missing an instance "name"`)
    }
    // Override inputs if "deploy" method
    if (method === 'deploy') inputs = this.inputs

    // Run source hook and upload source
    let size
    if (inputs.src) {
      // Check to ensure file size does not exceed 100MB
      size = await getDirSize(inputs.src)

      // lock deployment of code size greater than 200MB
      if (size > 200000000) {
        throw new Error('Your code size must be less than 200MB.  Try using Webpack, Parcel, AWS Lambda layers to reduce your code size.')
      }

      inputs.src = await this.runSrcHook(inputs.src)
      inputs.src = await this.uploadSource(inputs.src)
    }

    return {
      method,
      inputs,
      options,
      size,
    }
  }

  /**
   * Run a method. "inputs" override serverless.yml inputs and should only be provided when using custom methods.
   * @param {*} method 
   * @param {*} inputs 
   * @param {*} options 
   */
  async run(method, inputs = {}, options = {}, size, skipPreRun) {

    if (!skipPreRun) {
      const result = await this.preRun(method, inputs, options)
      method = result.method
      inputs = result.inputs
      options = result.options
      size = result.size
    }
    
    return await this.client.run(
      {
        instance: {
          org: this.org,
          stage: this.stage,
          app: this.app,
          component: this.component,
          name: this.name,
          inputs,
        },
        method,
        credentials: this.credentials,
        options,
        size,
      }
    )
  }

  /*
   * Run a "src" hook, if one is specified
   */
  async runSrcHook(src) {
    if (typeof src === 'object' && src.hook && src.dist) {
      // First run the build hook, if "hook" and "dist" are specified
      const options = { cwd: src.src }
      try {
        await exec(src.hook, options)
      } catch (err) {
        throw new Error(`Failed running "src.hook": "${src.hook}" due to the following error: "${err.stderr}"
        ${err.stdout}`)
      }
      src = path.resolve(path.join(process.cwd(), src.dist))
    } else if (typeof src === 'object' && src.src) {
      src = path.resolve(src.src)
    } else if (typeof src === 'string') {
      src = path.resolve(src)
    }
    return src
  }

  /*
   * Uploads the component instance src input reference if available
   */
  async uploadSource(src) {
    const packagePath = path.join(
      tmpdir(),
      `${Math.random()
        .toString(36)
        .substring(6)}.zip`
    )

    // Get the upload and download urls for the src input
    // and package the src input directory at the same time for speed
    const res = await Promise.all([
      this.client.getUploadUrls(this.org), 
      pack(this.inputs.src, packagePath)
    ])

    // Set the package signed urls. This is an object includes both the upload and downnload urls
    // the upload url is used to upload the package to s3
    // while the download url is passed to the component instannce to be downnloaded in the lambda runtime
    const packageUrls = res[0]

    // Create a new axios instance and make sure we clear the default axios headers
    // as they cause a mismatch with the signature provided by aws
    const request = axios.create()
    request.defaults.headers.common = {}
    request.defaults.headers.put = {}
    const body = fs.readFileSync(packagePath)

    // Make sure axios handles large packages
    const config = {
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    }

    let result
    try {
      result = await request.put(packageUrls.upload, body, config)
    } catch (e) {
      throw e
    }

    // replace the src input to point to the download url so that it's download in the lambda runtime
    src = packageUrls.download
    return src
  }
}

module.exports = Instance
