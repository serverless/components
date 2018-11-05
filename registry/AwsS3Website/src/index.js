import { equals, keys, lowerCase, not, pick, resolve } from '@serverless/utils'
import fs from 'fs'
import path from 'path'
import klawSync from 'klaw-sync'
import mime from 'mime-types'
const { execSync } = require('child_process')
import { hashElement } from 'folder-hash'

/*
* Create Website Bucket
*/

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

  // TODO BRN: This set of async calls is a trap for failures. If the bucket gets created but we have a failure immediately after that before the other calls are made, we can no longer reach the code that is responsible for setting up the bucket policy, cors, etc. because the createBucket call will fail since the bucket already exists. Each of these steps should be broken out into a separate component so that the core can manage each call independently and allow for resuming the set of calls from where it left off in the event of failure.
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

/*
* Upload Directory
* - Uploads folder to S3 Bucket
*/

const uploadDir = async (s3, bucketName, assets) => {
  const items = await new Promise((res, rej) => {
    try {
      res(klawSync(assets))
    } catch (error) {
      rej(error)
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

const hashProjectDir = async (projectDir) => {
  const options = {
    folders: { exclude: ['node_modules', '.serverless'] }
  }

  const hashObj = await hashElement(projectDir, options)
  return hashObj.hash
}

/*
* Component: AWS S3 Website
*/

const AwsS3Website = (SuperClass) =>
  class extends SuperClass {
    async construct(inputs, context) {
      await super.construct(inputs, context)

      this.buildCmd = inputs.buildCmd
      this.env = inputs.env
      this.projectDir = resolve(inputs.projectDir)
      this.assets = resolve(inputs.assets) || resolve(inputs.projectDir)

      // TODO BRN: Move this to a validate step (maybe on a per property basis that validates when set)
      if (!path.isAbsolute(this.projectDir)) {
        throw new Error('projectDir must be an absolute path. Construct local paths using ${path}.')
      }

      this.envFileLocation = path.resolve(this.projectDir, resolve(inputs.envFileLocation))
      this.assets = path.resolve(this.projectDir, resolve(inputs.assets))
    }

    async shouldDeploy(prevInstance) {
      this.bucket = lowerCase(this.bucket)
      this.hash = await hashProjectDir(this.projectDir)
      const inputs = {
        bucket: this.bucket,
        projectDir: this.projectDir,
        assets: this.assets,
        envFileLocation: this.envFileLocation,
        hash: this.hash,
        env: this.env,
        buildCmd: this.buildCmd
      }

      // set the domain so that it's accessible in the `info` function
      this.domain = `${this.bucket}.s3-website-${this.provider.region}.amazonaws.com`

      const prevInputs = prevInstance ? pick(keys(inputs), prevInstance) : {}
      const configChanged = not(equals(prevInputs, inputs))
      if (prevInstance && prevInstance.bucket !== this.bucket) {
        return 'replace'
      } else if (!prevInstance || configChanged) {
        return 'deploy'
      }
    }

    async deploy(prevInstance, context) {
      // Include Environment Variables if they exist
      let script = 'export const env = {\n'
      if (this.env) {
        for (const e in this.env) {
        // eslint-disable-line
        script += `${e}: ${JSON.stringify(resolve(this.env[e]))}\n` // eslint-disable-line
        }
      }
      script += '}'

      fs.writeFileSync(this.envFileLocation, script)

      if (this.buildCmd) {
        console.log('Building website...') // eslint-disable-line no-console
        execSync(
          this.buildCmd,
          {
            cwd: this.projectDir
          },
          (error, stdErr) => {
            if (error) {
              console.error(stdErr) // eslint-disable-line no-console
              throw new Error(error)
            }
          }
        )
      }

      const provider = this.provider
      const AWS = provider.getSdk()
      const s3 = new AWS.S3()

      // Ensure bucket is lowercase
      this.bucket = lowerCase(this.bucket)

      if (!prevInstance || this.bucket !== prevInstance.bucket) {
        await createWebsiteBucket(s3, this.bucket)
      }
      // this.assets = assets
      await uploadDir(s3, this.bucket, this.assets)

      this.domain = `${this.bucket}.s3-website-${this.provider.region}.amazonaws.com`
      context.log('Website Successfully Deployed:')
      context.log(`  http://${this.domain}`)
    }

    async remove(context) {
      const provider = this.provider
      const AWS = provider.getSdk()
      const s3 = new AWS.S3()

      await deleteWebsiteBucket(s3, this.bucket)

      const domain = `${this.bucket}.s3-website-${this.provider.region}.amazonaws.com`
      context.log('Website Successfully Removed:')
      context.log(`  http://${domain}`)
    }

    async info() {
      return {
        title: this.domain,
        type: this.name,
        data: {
          domain: this.domain
        }
      }
    }
  }

export default AwsS3Website
