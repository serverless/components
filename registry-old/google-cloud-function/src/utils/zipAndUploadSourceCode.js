/* eslint-disable no-console */

const getStorageClient = require('./getStorageClient')
const pack = require('./pack')

async function zipAndUploadSourceCode(
  projectId,
  keyFilename,
  sourceCodePath,
  deploymentBucket,
  state
) {
  const packRes = await pack(sourceCodePath)

  const hasSourceCodeChanged = state && state.sourceArchiveHash !== packRes.hash
  if (!state || !state.sourceArchiveHash || hasSourceCodeChanged) {
    const storage = getStorageClient(keyFilename, projectId)
    if (hasSourceCodeChanged) {
      console.log('Source code changes detected. Uploading source archive file...')
    } else {
      console.log('Uploading source archive file...')
    }
    await storage.createBucket(deploymentBucket).catch((err) => {
      if (err.code != 409) {
        throw err
      }
    })
    if (state && hasSourceCodeChanged) {
      try {
        await storage
          .bucket(deploymentBucket)
          .file(state.sourceArchiveFilename)
          .delete()
      } catch (err) {
        if (!err.message.startsWith('No such object')) {
          console.error('Error in deleting source code archive object file: ', err.message)
        }
      }
    }
    await storage.bucket(deploymentBucket).upload(packRes.filePath)
    await storage
      .bucket(deploymentBucket)
      .file(packRes.fileName)
      .makePublic()

    return {
      sourceArchiveFilename: packRes.fileName,
      sourceArchiveUrl: `gs://${deploymentBucket}/${packRes.fileName}`,
      sourceArchiveHash: packRes.hash
    }
  }
  return {
    sourceArchiveFilename: state.sourceArchiveFilename,
    sourceArchiveUrl: state.sourceArchiveUrl,
    sourceArchiveHash: state.sourceArchiveHash
  }
}

module.exports = zipAndUploadSourceCode
