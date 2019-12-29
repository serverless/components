class Context {
  constructor(config = {}) {
    this.socket = config.socket || {}
    this.accessKey = config.accessKey
    this.credentials = config.credentials
    this.debugMode = config.debug || false
  }

  log() {}

  debug() {}

  status() {}

  outputs() {}

  close() {}

  error(e) {
    throw e
  }
}

module.exports = Context
