const fse = require('./fse')

module.exports = (filePath) => {
  return fse.lstatAsync(filePath)
    .then((stats) => stats.isFile())
    .catch(() => false)
}
