const aws = require('aws-sdk')
const fs = require('fs')
const path = require('path')
const klawSync = require('klaw-sync')
const mime = require('mime-types')
const UploadStream = require('s3-stream-upload')
const { isEmpty } = require('ramda')
const { createReadStream } = require('fs-extra')
const archiver = require('archiver')

const { readFileIfExists } = require('../../src/utils')

const getClients = (credentials, region) => {
  const params = {
    region,
    credentials
  }

  // we need two S3 clients because creating/deleting buckets
  // is not available with the acceleration feature.
  return {
    regular: new aws.S3(params),
    accelerated: new aws.S3({ ...params, endpoint: `s3-accelerate.amazonaws.com` })
  }
}

const configureWebsite = async (s3, bucketName) => {
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

const uploadDir = async (s3, bucketName, dirPath) => {
  const items = await new Promise((resolve, reject) => {
    try {
      resolve(klawSync(dirPath))
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
      Key: path.relative(dirPath, item.path),
      Body: fs.readFileSync(item.path)
    }
    const file = path.basename(item.path)

    itemParams.ContentType = mime.lookup(file) || 'application/octet-stream'

    uploadItems.push(s3.upload(itemParams).promise())
  })

  await Promise.all(uploadItems)
}

const packAndUploadDir = async ({ s3, bucketName, dirPath, key, append = [] }) => {
  const ignore = (await readFileIfExists(path.join(dirPath, '.slsignore'))) || []
  return new Promise((resolve, reject) => {
    const archive = archiver('zip', {
      zlib: { level: 9 }
    })

    if (!isEmpty(append)) {
      append.forEach((file) => {
        const fileStream = createReadStream(file)
        archive.append(fileStream, { name: path.basename(file) })
      })
    }

    archive.glob(
      '**/*',
      {
        cwd: dirPath,
        ignore
      },
      {}
    )

    archive
      .pipe(
        UploadStream(s3, {
          Bucket: bucketName,
          Key: key
        })
      )
      .on('error', function(err) {
        return reject(err)
      })
      .on('finish', function() {
        return resolve()
      })

    archive.finalize()
  })
}

const uploadFile = async ({ s3, bucketName, filePath, key }) => {
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(
        UploadStream(s3, {
          Bucket: bucketName,
          Key: key
        })
      )
      .on('error', function(err) {
        return reject(err)
      })
      .on('finish', function() {
        return resolve()
      })
  })
}

/*
 * Delete Website Bucket
 */

const clearBucket = async (s3, bucketName) => {
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
  } catch (error) {
    if (error.code !== 'NoSuchBucket') {
      throw error
    }
  }
}

const deleteBucket = async (s3, bucketName) => {
  try {
    await s3.deleteBucket({ Bucket: bucketName }).promise()
  } catch (error) {
    if (error.code !== 'NoSuchBucket') {
      throw error
    }
  }
}

module.exports = {
  configureWebsite,
  getClients,
  uploadDir,
  packAndUploadDir,
  uploadFile,
  clearBucket,
  deleteBucket
}
