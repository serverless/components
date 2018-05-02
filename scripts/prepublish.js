const AWS = require('aws-sdk')
const path = require('path')
const BbPromise = require('bluebird')
const os = require('os')
const crypto = require('crypto')
const { writeFile, readFile, fse } = require('@serverless/utils')

const { getRegistryComponentsRoots, packageComponent } = require('../src/utils')

const trackingConfigFilePath = path.join(process.cwd(), 'tracking-config.json')

const SENTRY_DSN = process.env.SENTRY_DSN
const SEGMENT_WRITE_KEY = process.env.SEGMENT_WRITE_KEY

const COMPONENTS_BUCKET = process.env.COMPONENTS_BUCKET
const COMPONENTS_BUCKET_REGION = process.env.COMPONENTS_BUCKET_REGION
const COMPONENTS_BUCKET_API_KEY = process.env.COMPONENTS_BUCKET_API_KEY
const COMPONENTS_BUCKET_API_SECRET = process.env.COMPONENTS_BUCKET_API_SECRET

const FORMAT = 'zip'

const excludedComponents = [
  'tests-invalid-variables-usage',
  'tests-core-version-compatibility',
  'tests-input-type-string',
  'tests-input-type-string-invalid-default',
  'tests-integration-function-mock',
  'tests-integration-iam-mock'
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
if (!COMPONENTS_BUCKET_REGION) throw new Error('COMPONENTS_BUCKET_REGION env var not set')
if (!COMPONENTS_BUCKET_API_KEY) throw new Error('COMPONENTS_BUCKET_API_KEY env var not set')
if (!COMPONENTS_BUCKET_API_SECRET) throw new Error('COMPONENTS_BUCKET_API_SECRET env var not set')


const trackingConfig = {
  sentryDSN: SENTRY_DSN,
  environment: 'production',
  segmentWriteKey: SEGMENT_WRITE_KEY
}

const uploadComponent = async (componentRoot) => {
  const packageTempDirPath = path.join(os.tmpdir(), crypto.randomBytes(3).toString('hex'))
  await fse.ensureDirAsync(packageTempDirPath)
  const options = {
    format: FORMAT,
    path: packageTempDirPath,
    componentRoot
  }
  const packagePath = await packageComponent(options)
  const componentPackage = await fse.readFileAsync(packagePath)
  const componentFileName = path.basename(packagePath)

  const params = {
    Body: componentPackage,
    Bucket: COMPONENTS_BUCKET,
    Key: componentFileName
  }

  return s3.putObject(params).promise()
}

const getUploadedComponents = async () => (await s3.listObjectsV2({ Bucket: COMPONENTS_BUCKET })
  .promise()).Contents.map((obj) => path.basename(obj.Key))

const uploadComponents = async () => {
  const componentsRoots = await getRegistryComponentsRoots()
  const s3Components = await getUploadedComponents()

  const componentsToUpload = await componentsRoots.reduce(async (accum, componentRoot) => {
    accum = await Promise.resolve(accum)
    const slsYmlFilePath = path.join(componentRoot, 'serverless.yml')
    const slsYml = await readFile(slsYmlFilePath)
    const componentFileName = `${slsYml.type}@${slsYml.version}.${FORMAT}`
    if (!s3Components.includes(componentFileName)
      && !excludedComponents.includes(path.basename(componentRoot))) {
      accum.push(componentRoot)
    }
    return accum
  }, Promise.resolve([]))

  return BbPromise.all(componentsToUpload.map(uploadComponent))
}

;(async () => { // eslint-disable-line
  await writeFile(trackingConfigFilePath, trackingConfig)
  await uploadComponents()
})()
