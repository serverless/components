const fse = require('./fse')

async function dirExists(dirPath) {
  return fse
    .lstatAsync(dirPath)
    .then((stats) => stats.isDirectory())
    .catch(() => false)
}

module.exports = dirExists
