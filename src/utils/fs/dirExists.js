const { curry } = require('ramda')
const fse = require('fs-extra')

const dirExists = curry(async (dirPath) => {
  try {
    const stats = await fse.lstat(dirPath)
    return stats.isDirectory()
  } catch (error) {
    return false
  }
})

module.exports = dirExists
