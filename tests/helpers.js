const fse = require('fs-extra')
const BbPromise = require('bluebird')

const fsp = BbPromise.promisifyAll(fse)

async function removeFiles(files) {
  return BbPromise.map(files, (file) => fsp.removeAsync(file))
}

module.exports = {
  removeFiles
}
