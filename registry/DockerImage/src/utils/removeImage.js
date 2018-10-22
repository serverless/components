const execa = require('execa')

async function removeImage(tag) {
  await execa('docker', ['rmi', '--force', true, tag])
  return tag
}

module.exports = removeImage
