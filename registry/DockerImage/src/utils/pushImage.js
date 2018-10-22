const execa = require('execa')

async function pushImage(tag) {
  await execa('docker', ['push', tag])
  return tag
}

module.exports = pushImage
