const fs = require('./fs')
const pack = require('./pack')
const getSwaggerDefinition = require('./getSwaggerDefinition')

module.exports = {
  ...fs,
  pack,
  getSwaggerDefinition
}
