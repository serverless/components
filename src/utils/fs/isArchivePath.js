const { endsWith, is } = require('ramda')

const isArchivePath = (filePath) => {
  if (!is(String, filePath)) {
    return false
  }

  return endsWith('.zip', filePath) || endsWith('.tar', filePath)
}

module.exports = isArchivePath
