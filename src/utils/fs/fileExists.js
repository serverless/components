const { curry } = require('ramda')
const fse = require('fs-extra')

const fileExists = curry(async (filePath) => {
  try {
    const stats = await fse.lstat(filePath)
    return stats.isFile()
  } catch (error) {
    return false
  }
})

module.exports = fileExists
