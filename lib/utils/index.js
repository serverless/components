const fs = require('./fs')
const pack = require('./pack')
const log = require('./log')
const cli = require('./cli')
const loadComponent = require('./loadComponent')
const readStateFile = require('./readStateFile')
const writeStateFile = require('./writeStateFile')
const getSwaggerDefinition = require('./getSwaggerDefinition')

let utils = {
  ...fs,
  pack,
  log,
  readStateFile,
  writeStateFile,
  loadComponent,
  getSwaggerDefinition
}
utils.cli = cli

module.exports = utils
