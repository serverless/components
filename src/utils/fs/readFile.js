const fse = require('./fse')
const parse = require('./parse')

module.exports = async (filePath) => fse.readFileAsync(filePath, 'utf8')
  .then((contents) => parse(filePath, contents))
