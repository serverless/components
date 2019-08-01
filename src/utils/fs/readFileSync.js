const fse = require('fs-extra')
const { curryN } = require('ramda')
const parseFile = require('./parseFile')

const readFileSync = curryN(1, (filePath, options = {}) => {
  const contents = fse.readFileSync(filePath, 'utf8')
  return parseFile(filePath, contents, options)
})

module.exports = readFileSync
