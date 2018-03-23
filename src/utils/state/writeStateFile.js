const path = require('path')
const { assoc, not, has } = require('ramda')
const writeFile = require('../fs/writeFile')
const generateServiceId = require('./generateServiceId')

module.exports = async (content) => {
  const stateFilePath = path.join(process.cwd(), 'state.json')
  let contentToSave = { ...content }
  if (not(has('serviceId', content))) {
    contentToSave = assoc('serviceId', generateServiceId(), contentToSave)
  }
  return writeFile(stateFilePath, contentToSave)
}
