const BbPromise = require('bluebird')
const fileExists = require('./fileExists')
const readFile = require('./readFile')

module.exports = (filePath) => fileExists(filePath)
  .then((exists) => {
    if (!exists) {
      return BbPromise.resolve(false)
    }
    return readFile(filePath)
  })
