const { readFile } = require('../../../../utils')
const { META_FILE_PATH } = require('./constants')

async function load() {
  let content = {}
  try {
    content = await readFile(META_FILE_PATH)
  } catch (error) {
    // meta file doesn't exist yet...
  }
  return content
}

module.exports = load
