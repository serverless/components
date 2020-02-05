/*
 * SERVERLESS COMPONENTS: COMPONENTS
 */

const path = require('path')
const fs = require('fs')
const { tmpdir } = require('os')
const axios = require('axios')
const utils = require('../utils')

class Component {
  constructor(client) {
    this.name = null
    this.version = null
    this.org = null
    this.author = null
    this.description = null
    this.keywords = null
    this.repo = null
    this.readme = null
    this.license = 'MIT'
    this.main = './src'

    this.client = client
  }

  /**
   * Validates the component's properties
   */
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

  /*
   * Sets and updates the component properties and validates them
   */
  set(props = {}) {
    this.name = props.name ? props.name.trim() : this.name
    this.version = props.version ? props.version.trim() : this.version
    this.org = props.org ? props.org.trim() : this.org
    this.author = props.author ? props.author.trim() : this.author
    this.description = props.description ? props.description.trim() : this.description
    this.keywords = props.keywords ? props.keywords.trim() : this.keywords
    this.repo = props.repo ? props.repo.trim() : this.repo
    this.readme = props.readme ? props.readme.trim() : this.readme
    this.license = props.license ? props.license.trim() : this.license
    this.main = props.main ? props.main.trim() : this.main

    this.validate()
  }

  /**
   * Get
   */
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

  /*
   * Load a component via serverless.component.yml/json given a directory where it should exist
   */
  load(directoryPath) {
    const serverlessComponentFile = utils.loadComponentConfig(directoryPath)
    this.set(serverlessComponentFile)
  }

  /**
   * Publish to the Registry
   */
  async publish() {
    const props = this.get()

    // Get Component path and temporary path for packaging
    const componentPackagePath = path.join(
      tmpdir(),
      `${Math.random()
        .toString(36)
        .substring(6)}.zip`
    )

    // Ensure "dev" version is translated correctly
    if (this.version === 'dev') { this.version = '0.0.0-dev' }

    // Package the component and get an upload url at the same time
    const res = await Promise.all([
      this.prePublish(),
      utils.pack(this.main, componentPackagePath, [ path.join(__dirname, '_handler.js') ])
    ])

    // Upload Component to AWS S3
    const componentUploadUrl = res[0].url

    // Axios auto-adds headers that causes signature mismatch
    // So we remove them manually
    const request = axios.create()
    request.defaults.headers.common = {}
    request.defaults.headers.put = {}
    const file = fs.readFileSync(componentPackagePath)

    // Make sure axios handles large packages
    const config = {
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    }

    try {
      await request.put(componentUploadUrl, file, config)
    } catch (e) {
      throw e
    }
  }

  /**
   * Gets temporary upload URLs
   */
  async prePublish() {
    return await this.client.prePublish(this.get())
  }
}

module.exports = Component
