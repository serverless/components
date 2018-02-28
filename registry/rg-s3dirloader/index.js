const AWS = require('aws-sdk')
const utils = require('../../lib/utils')
const mime = require('mime-types')
const fs = require('fs')

const S3 = new AWS.S3({ region: 'us-east-1' })

const uploadFiles = async ({contentPath, bucketName}) => {

  const filePaths = await utils.walkDirSync(contentPath)
  const uploadedFiles = filePaths.map(async (file) => {
    const cleanedFilePath = file.replace(contentPath.replace('./', '')+'/', '')

    return S3.upload({
      Bucket: bucketName,
      Key: cleanedFilePath,
      Body: fs.createReadStream(file),
      ACL: 'public-read',
      ContentType: mime.lookup(cleanedFilePath)
    }).promise()
  })

  return Promise.all(uploadedFiles).then((results) => {
    const outputs = {
      files: results
    }
    return outputs
  })

}

const deploy = async (inputs, state, context) => {
  let outputs = state
  if (!state.contentPath && inputs.contentPath) {
    context.log(`Uploading files to Bucket: ${inputs.bucketName}.`)
    outputs = await uploadFiles(inputs)
  } else if (!inputs.contentPath && state.contentPath) {
    context.log(`Re-uploading files to Bucket: ${inputs.bucketName}.`)
    outputs = await uploadFiles(inputs)
  } else if (state.contentPath !== inputs.contentPath) {
    context.log(`Re-uploading files to Bucket: ${inputs.bucketName}.`)
    outputs = await uploadFiles(inputs)
  }
  return outputs
}

module.exports = {
  deploy
}
