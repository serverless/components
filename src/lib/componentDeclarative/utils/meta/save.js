const { writeFile } = require('../../../../utils')
const { META_FILE_PATH } = require('./constants')

async function save({ components }) {
  const data = {
    components
  }
  return writeFile(META_FILE_PATH, data)
}

module.exports = save
