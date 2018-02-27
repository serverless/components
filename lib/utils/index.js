const fs = require('./fs')
const log = require('./log')
const readStateFile = require('./readStateFile')
const writeStateFile = require('./writeStateFile')

module.exports = {
  ...fs,
  log,
  readStateFile,
  writeStateFile
}
