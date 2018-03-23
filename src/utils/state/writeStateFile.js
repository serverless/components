const path = require('path')
const { assoc, not, has } = require('ramda')
const writeFile = require('../fs/writeFile')
const getServiceId = require('./getServiceId')

module.exports = async (content) => {
  const stateFilePath = path.join(process.cwd(), 'state.json')
  let contentToSave = { ...content }
  if (not(has('serviceId', content))) {
    contentToSave = assoc('serviceId', getServiceId(), contentToSave)
  }
  return writeFile(stateFilePath, contentToSave)
}
