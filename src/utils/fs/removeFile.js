const fse = require('./fse')

module.exports = (filePath) => fse.removeAsync(filePath)
