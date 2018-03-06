const fse = require('./fse')

module.exports = (filePath) => fse.lstatAsync(filePath)
  .then((stats) => stats.isFile())
  .catch(() => false)
