const fse = require('fs-extra')
const { curryN } = require('ramda')
const parseFile = require('./parseFile')

const readFile = curryN(1, async (filePath, options = {}) => {
  const contents = await fse.readFile(filePath, 'utf8')
  return parseFile(filePath, contents, options)
})

module.exports = readFile
