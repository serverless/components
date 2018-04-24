const fse = require('./fse')

module.exports = (filePath) => {
  try {
    const stats = fse.lstatSync(filePath)
    return stats.isFile()
  } catch (e) {
    return false
  }
}
