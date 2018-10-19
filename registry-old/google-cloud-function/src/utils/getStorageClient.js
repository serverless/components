const googleStorage = require('@google-cloud/storage')
const getCredentialsPath = require('./getCredentialsPath')

function getStorageClient(keyFilePath, projectId) {
  const credentials = getCredentialsPath(keyFilePath)

  const storage = new googleStorage({
    projectId: projectId,
    keyFilename: credentials
  })
  return storage
}

module.exports = getStorageClient
