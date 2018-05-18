/* eslint-disable no-console */

const AWS = require('aws-sdk')
const S3 = require('s3-client')

const awsS3 = new AWS.S3({ region: 'us-east-1' })
const client = S3.createClient({
  s3Client: awsS3
})

const syncDirFiles = async ({ contentPath, bucketName }) => {
  const params = {
    localDir: contentPath,
    deleteRemoved: true,
    followSymlinks: false,
    s3Params: {
      Bucket: bucketName,
      Prefix: ''
    }
  }
  const uploader = client.uploadDir(params)
  uploader.on('fileUploadEnd', (localFilePath) => {
    // eslint-disable-line no-unused-vars
    console.log(`Uploading file: '${localFilePath}' ...`)
  })
  uploader.on('error', (err) => {
    console.error('Error syncing files:', err.stack)
  })
  uploader.on('end', () => {
    console.log(
      'Objects Found:',
      uploader.objectsFound,
      ', Files Found:',
      uploader.filesFound,
      ', Files Deleted:',
      uploader.deleteTotal
    )
  })
  return {}
}

const deploy = async (inputs, context) => {
  context.log(`Syncing files from '${inputs.contentPath}' to bucket: '${inputs.bucketName}'`)
  await syncDirFiles(inputs)

  const outputs = {
    contentPath: inputs.contentPath,
    bucketName: inputs.bucketName
  }
  context.saveState({ ...inputs, ...outputs })
  return outputs
}

const remove = async (inputs, context) => {
  if (!context.state.contentPath) return {}

  context.saveState({})
  return {}
}

module.exports = {
  deploy,
  remove
}
