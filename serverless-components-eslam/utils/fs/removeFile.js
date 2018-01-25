const fse = require('./fse')

module.exports = (filePath) => {
  return fse.removeAsync(filePath)
}
