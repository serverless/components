/* eslint-disable-next-line */
'use strict'

const AWS = require('aws-sdk')
const path = require('path')
const BbPromise = require('bluebird')
const fs = require('fs')
const { writeFile, readFile } = require('@serverless/utils')

const { getRegistryComponentsRoots, packageComponent } = require('../src/utils')

const trackingConfigFilePath = path.join(process.cwd(), 'tracking-config.json')

const {
  SENTRY_DSN,
  SEGMENT_WRITE_KEY,
  COMPONENTS_BUCKET,
  COMPONENTS_BUCKET_REGION,
  COMPONENTS_BUCKET_API_KEY,
  COMPONENTS_BUCKET_API_SECRET
} = process.env

const FORMAT = 'zip'

const excludedComponents = [
  'tests-invalid-variables-usage',
  'tests-core-version-compatibility',
  'tests-input-type-string',
  'tests-input-type-string-invalid-default',
  'tests-integration-function-mock',
  'tests-integration-iam-mock',
  'tests-integration-await-child-components'
]

const config = {
  apiVersion: '2006-03-01',
  region: COMPONENTS_BUCKET_REGION,
  accessKeyId: COMPONENTS_BUCKET_API_KEY,
  secretAccessKey: COMPONENTS_BUCKET_API_SECRET
}

const s3 = new AWS.S3(config)

if (!SENTRY_DSN) throw new Error('SENTRY_DSN env var not set')
if (!SEGMENT_WRITE_KEY) throw new Error('SEGMENT_WRITE_KEY env var not set')
if (!COMPONENTS_BUCKET) throw new Error('COMPONENTS_BUCKET env var not set')
if (!COMPONENTS_BUCKET_REGION) {
  throw new Error('COMPONENTS_BUCKET_REGION env var not set')
}
if (!COMPONENTS_BUCKET_API_KEY) {
  throw new Error('COMPONENTS_BUCKET_API_KEY env var not set')
}
if (!COMPONENTS_BUCKET_API_SECRET) {
  throw new Error('COMPONENTS_BUCKET_API_SECRET env var not set')
}

const trackingConfig = {
  sentryDSN: SENTRY_DSN,
  environment: 'production',
  segmentWriteKey: SEGMENT_WRITE_KEY
}

const uploadComponent = async (componentRoot) => {
  const options = {
    format: FORMAT,
    path: componentRoot
  }
  const packagePath = await packageComponent(options)

  const params = {
    Body: fs.createReadStream(packagePath),
    Bucket: COMPONENTS_BUCKET,
    Key: path.basename(packagePath),
    ACL: 'public-read'
  }

  return s3.putObject(params).promise()
}

const getUploadedComponents = async () =>
  (await s3.listObjectsV2({ Bucket: COMPONENTS_BUCKET }).promise()).Contents.map((obj) =>
    path.basename(obj.Key)
  )

const uploadComponents = async () => {
  const componentsRoots = await getRegistryComponentsRoots()
  const s3Components = await getUploadedComponents()

  const componentsToUpload = await componentsRoots.reduce(async (accum, componentRoot) => {
    accum = await BbPromise.resolve(accum)
    const slsYmlFilePath = path.join(componentRoot, 'serverless.yml')
    const slsYml = await readFile(slsYmlFilePath)
    const componentFileName = `${slsYml.type}@${slsYml.version}.${FORMAT}`
    if (
      !s3Components.includes(componentFileName) &&
      !excludedComponents.includes(path.basename(componentRoot))
    ) {
      accum.push(componentRoot)
    }
    return accum
  }, BbPromise.resolve([]))

  return BbPromise.map(componentsToUpload, uploadComponent)
}
;(async () => {
  // eslint-disable-line
  await writeFile(trackingConfigFilePath, trackingConfig)
  await uploadComponents()
})()
