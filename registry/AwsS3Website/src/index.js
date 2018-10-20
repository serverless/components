import fs from 'fs'
import path from 'path'
import klawSync from 'klaw-sync'

const createWebsiteBucket = async (s3, bucketName) => {
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

  await s3.createBucket({ Bucket: bucketName }).promise()

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

const uploadDir = async (s3, bucketName, assets, env = {}) => {
  return new Promise((resolve, reject) => {
    let items
    try {
      items = klawSync(assets)
    } catch (error) {
      reject(error)
    }

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

      if (file.slice(-5) == '.html') {
        itemParams.ContentType = 'text/html'
      }
      if (file.slice(-4) == '.css') {
        itemParams.ContentType = 'text/css'
      }
      if (file.slice(-3) == '.js') {
        itemParams.ContentType = 'application/javascript'
      }
      if (file.slice(-5) == '.json') {
        itemParams.ContentType = 'application/json'
      }
      if (file.slice(-4) == '.zip') {
        itemParams.ContentType = 'application/zip'
      }
      if (file.slice(-4) == '.png') {
        itemParams.ContentType = 'text/png'
      }
      if (file.slice(-4) == '.jpg') {
        itemParams.ContentType = 'text/jpeg'
      }
      if (file.slice(-5) == '.jpeg') {
        itemParams.ContentType = 'text/jpeg'
      }
      if (file.slice(-4) == '.gif') {
        itemParams.ContentType = 'text/gif'
      }
      if (file.slice(-4) == '.svg') {
        itemParams.ContentType = 'image/svg+xml'
      }
      if (file.slice(-5) == '.woff') {
        itemParams.ContentType = 'font/woff'
      }
      if (file.slice(-6) == '.woff2') {
        itemParams.ContentType = 'font/woff2'
      }

      uploadItems.push(s3.upload(itemParams).promise())
    })

    return Promise.all(uploadItems)
      .then(() => {
        // Include Environment Variables if they exist
        let script = 'env = {};'
        if (env) {
          for (const e in env) {
            // eslint-disable-line
            script = script + `env.${e}="${env[e]}";` // eslint-disable-line
          }
        }

        return s3
          .upload({
            Bucket: bucketName,
            Key: 'env.js',
            Body: Buffer.from(script, 'utf8')
          })
          .promise()
          .catch((error) => {
            console.log(error) // eslint-disable-line
          })
      })
      .then(resolve)
  })
}

const deleteWebsiteBucket = async (s3, bucketName) => {
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
}

const AwsS3Website = {
  shouldDeploy(prevInstance) {
    if (!prevInstance) {
      return 'deploy'
    }
    if (prevInstance.domain !== this.domain) {
      return 'replace'
    }
  },
  async deploy(prevInstance, context) {
    const provider = this.provider
    const AWS = provider.getSdk()
    const s3 = new AWS.S3()

    await createWebsiteBucket(s3, this.domain)
    await uploadDir(s3, this.domain, this.assets, this.env)

    const s3Domain = `http://${this.domain}.s3-website-${this.provider.region}.amazonaws.com`
    context.log('Website Successfully Deployed:')
    context.log(`  ${s3Domain}`)
  },
  async remove(context) {
    const provider = this.provider
    const AWS = provider.getSdk()
    const s3 = new AWS.S3()

    await deleteWebsiteBucket(s3, this.domain)

    const s3Domain = `http://${this.domain}.s3-website-${this.provider.region}.amazonaws.com`
    context.log('Website Successfully Removed:')
    context.log(`  ${s3Domain}`)
  }
}

export default AwsS3Website
