const { curryN } = require('ramda')
const fileExists = require('./fileExists')
const readFile = require('./readFile')

const readFileIfExists = curryN(1, async (filePath, options = {}) => {
  if (await fileExists(filePath)) {
    return readFile(filePath, options)
  }
  return false
})

module.exports = readFileIfExists
