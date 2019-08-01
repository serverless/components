const path = require('path')
const os = require('os')
const { readFile, writeFile, fileExists, randomId } = require('./utils')

class Context {
  constructor(config = {}) {
    this.stateRoot = config.stateRoot
      ? path.resolve(config.stateRoot)
      : path.join(os.homedir(), '.serverless', 'components', 'state')
    this.credentials = config.credentials || {}
    this.debugMode = config.debug || false
    this.state = { id: randomId() }
    this.id = this.state.id
  }

  async init() {
    const contextStatePath = path.join(this.stateRoot, `_.json`)

    if (await fileExists(contextStatePath)) {
      this.state = await readFile(contextStatePath)
    } else {
      await writeFile(contextStatePath, this.state)
    }
    this.id = this.state.id
  }

  resourceId() {
    return `${this.id}-${randomId()}`
  }

  async readState(id) {
    const stateFilePath = path.join(this.stateRoot, `${id}.json`)
    if (await fileExists(stateFilePath)) {
      return readFile(stateFilePath)
    }
    return {}
  }

  async writeState(id, state) {
    const stateFilePath = path.join(this.stateRoot, `${id}.json`)
    await writeFile(stateFilePath, state)
    return state
  }

  log() {
    return
  }

  // debug is useful and available even in programatic mode
  debug(msg) {
    if (!this.debugMode || !msg || msg == '') {
      return
    }

    console.log(`  DEBUG: ${msg}`) // eslint-disable-line
  }

  status() {
    return
  }
}

module.exports = Context
