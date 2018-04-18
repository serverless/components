const winston = require('winston')

class ComponentsLogger extends winston.Transport {

  constructor(options) {
    super()
    this.name = 'ComponentsLogger'
    this.level = options.level || 'info'
    this.context = options.context
  }

  log (level, msg, meta, callback) {
    this.context.log(msg)
    callback(null, true)
  }
}

module.exports = ComponentsLogger
