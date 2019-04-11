const process = require('process')
const path = require('path')

const META_FILE_NAME = '.meta.json'
const META_FILE_PATH = path.join(process.cwd(), '.serverless', META_FILE_NAME)

module.exports = {
  META_FILE_NAME,
  META_FILE_PATH
}
