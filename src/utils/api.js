// this is a CLI mock for programatic usage.
class API {
  constructor() {
    // Defaults
    this._ = {}
    this._.stage = null
    this._.parentComponent = null
    this._.useTimer = true
    this._.seconds = 0
    // Status defaults
    this._.status = {}
    this._.status.running = false
    this._.status.message = 'Running'
    this._.status.loadingDots = ''
    this._.status.loadingDotCount = 0
  }

  config(config) {
    this._.stage = config.stage
    this._.parentComponent = config.parentComponent
  }

  close() {
    return
  }

  log() {
    return
  }

  status() {
    return
  }

  warn() {
    return
  }

  error(error) {
    if (typeof error === 'string') {
      error = new Error(error)
    }
    throw error
  }

  outputs() {
    return
  }

  output() {
    return
  }
}

module.exports = new API()
