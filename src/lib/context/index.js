class Context {
  constructor(config, rootFile = 'serverless.js') {
    this.stage = config.stage
    this.root = config.root
    this.rootFile = rootFile
    this.credentials = config.credentials
    this.verbose = config.verbose
    this.debug = config.debug
    this.watch = config.watch
  }
}

module.exports = Context
