const { endsWith } = require('ramda')

const isYamlPath = (filePath) => endsWith('.yml', filePath) || endsWith('.yaml', filePath)

module.exports = isYamlPath
