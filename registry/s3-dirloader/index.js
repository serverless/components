/* eslint-disable no-console */

const { walkDirSync } = require('@serverless/utils')
const AWS = require('aws-sdk')
const mime = require('mime-types')
const fs = require('fs')

const S3 = new AWS.S3({ region: 'us-east-1' })

const uploadFiles = async ({ contentPath, bucketName }) => {
  const filePaths = await walkDirSync(contentPath)
  const uploadedFiles = filePaths.map(async (file) => {
    const cleanedFilePath = file.replace(`${contentPath.replace('./', '')}/`, '')

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

const deploy = async (inputs, context) => {
  let outputs = context.state

  if (!context.state.contentPath && inputs.contentPath) {
    context.log(`Uploading files to Bucket: '${inputs.bucketName}'`)
    outputs = await uploadFiles(inputs)
  } else if (!inputs.contentPath && context.state.contentPath) {
    // context.log(`Removing files from Bucket: '${inputs.bucketName}'`)
    // outputs = await removeFiles(context.state.contentPath)
  } else if (context.state.contentPath !== inputs.contentPath) {
    // context.log(`Removing old files from Bucket: '${context.state.contentPath}'`)
    // outputs = await removeFiles(context.state.contentPath)
    context.log(`Uploading new files to Bucket: '${inputs.bucketName}'`)
    outputs = await uploadFiles(inputs)
  }
  context.saveState({ ...inputs, ...outputs })
  return outputs
}

const remove = async (inputs, context) => {
  if (!context.state.contentPath) return {}

  // context.log(`Removing files from Bucket: '${context.state.contentPath}'`)
  // outputs = await removeFiles(context.state.contentPath)
  context.saveState({})
  return {}
}

module.exports = {
  deploy,
  remove
}
