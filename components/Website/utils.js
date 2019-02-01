const fs = require('fs')
const path = require('path')
const klawSync = require('klaw-sync')
const mime = require('mime-types')
const shortid = require('shortid')

const getBucketName = (websiteName) => {
  websiteName = websiteName.toLowerCase()
  const bucketId = shortid.generate().toLowerCase()
  websiteName = `${websiteName}-${bucketId}`
  return websiteName
}

const bucketExists = async ({ s3, bucketName }) => {
  try {
    await s3.getBucketLocation({ Bucket: bucketName }).promise()
  } catch (e) {
    if (e.code === 'NoSuchBucket') {
      return false
    }
    throw e
  }
  return true
}

const configureWebsite = async ({ s3, bucketName }) => {
  const s3BucketPolicy = {
    Version: '2012-10-17',
    Statement: [
      {
        Sid: 'PublicReadGetObject',
        Effect: 'Allow',
        Principal: {
          AWS: '*'
        },
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${bucketName}/*`]
      }
    ]
  }
  const staticHostParams = {
    Bucket: bucketName,
    WebsiteConfiguration: {
      ErrorDocument: {
        Key: 'error.html'
      },
      IndexDocument: {
        Suffix: 'index.html'
      }
    }
  }

  const putPostDeleteHeadRule = {
    AllowedMethods: ['PUT', 'POST', 'DELETE', 'HEAD'],
    AllowedOrigins: ['https://*.amazonaws.com'],
    AllowedHeaders: ['*'],
    MaxAgeSeconds: 0
  }
  const getRule = {
    AllowedMethods: ['GET'],
    AllowedOrigins: ['*'],
    AllowedHeaders: ['*'],
    MaxAgeSeconds: 0
  }

  await s3
    .putBucketPolicy({
      Bucket: bucketName,
      Policy: JSON.stringify(s3BucketPolicy)
    })
    .promise()

  await s3
    .putBucketCors({
      Bucket: bucketName,
      CORSConfiguration: {
        CORSRules: [putPostDeleteHeadRule, getRule]
      }
    })
    .promise()

  await s3.putBucketWebsite(staticHostParams).promise()
}

const uploadDir = async ({ s3, bucketName, assets }) => {
  const items = await new Promise((resolve, reject) => {
    try {
      resolve(klawSync(assets))
    } catch (error) {
      reject(error)
    }
  })

  const uploadItems = []
  items.forEach((item) => {
    if (item.stats.isDirectory()) {
      return
    }

    const itemParams = {
      Bucket: bucketName,
      Key: path.relative(assets, item.path),
      Body: fs.readFileSync(item.path)
    }
    const file = path.basename(item.path)

    itemParams.ContentType = mime.lookup(file) || 'application/octet-stream'

    uploadItems.push(s3.upload(itemParams).promise())
  })

  await Promise.all(uploadItems)
}

/*
 * Delete Website Bucket
 */

const deleteWebsiteBucket = async ({ s3, bucketName }) => {
  try {
    const data = await s3.listObjects({ Bucket: bucketName }).promise()

    const items = data.Contents
    const promises = []

    for (var i = 0; i < items.length; i += 1) {
      var deleteParams = { Bucket: bucketName, Key: items[i].Key }
      const delObj = s3.deleteObject(deleteParams).promise()
      promises.push(delObj)
    }

    await Promise.all(promises)
    await s3.deleteBucket({ Bucket: bucketName }).promise()
  } catch (error) {
    if (error.code !== 'NoSuchBucket') {
      throw error
    }
  }
}

module.exports = {
  getBucketName,
  bucketExists,
  configureWebsite,
  uploadDir,
  deleteWebsiteBucket
}
