const path = require('path')
const os = require('os')

function getCredentials(keyFilePath) {
  const credParts = keyFilePath.split(path.sep)
  if (credParts[0] === '~') {
    credParts[0] = os.homedir()
  } else if (credParts[0] === '') {
    credParts[0] = path.sep
  }
  return credParts.reduce((memo, part) => path.join(memo, part), '')
}

module.exports = getCredentials
