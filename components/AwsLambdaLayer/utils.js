const archiver = require('archiver')
const globby = require('globby')
const path = require('path')
const { tmpdir } = require('os')
const crypto = require('crypto')
const { readFileSync, createWriteStream, createReadStream } = require('fs-extra')
const { equals, not, pick } = require('../../src/utils')

const pack = async (dir, prefix) => {
  const outputFileName = `${Math.random()
    .toString(36)
    .substring(6)}.zip`
  const outputFilePath = path.join(tmpdir(), outputFileName)

  const files = (await globby(['**'], { cwd: dir }))
    .sort() // we must sort to ensure correct hash
    .map((file) => ({
      input: path.join(dir, file),
      output: prefix ? path.join(prefix, file) : file
    }))

  return new Promise((resolve, reject) => {
    const output = createWriteStream(outputFilePath)
    const archive = archiver('zip', {
      zlib: { level: 9 }
    })

    output.on('open', () => {
      archive.pipe(output)

      // we must set the date to ensure correct hash
      files.forEach((file) =>
        archive.append(createReadStream(file.input), { name: file.output, date: new Date(0) })
      )

      archive.finalize()
    })

    archive.on('error', (err) => reject(err))
    output.on('close', () => resolve(outputFilePath))
  })
}

const hash = (zipPath) =>
  crypto
    .createHash('sha256')
    .update(readFileSync(zipPath))
    .digest('base64')

const publishLayer = async ({ lambda, name, description, runtimes, zipPath, bucket }) => {
  const params = {
    Content: {},
    LayerName: name,
    CompatibleRuntimes: runtimes,
    Description: description
  }

  if (bucket) {
    params.Content.S3Bucket = bucket
    params.Content.S3Key = path.basename(zipPath)
  } else {
    params.Content.ZipFile = readFileSync(zipPath)
  }

  const res = await lambda.publishLayerVersion(params).promise()

  return res.LayerVersionArn
}

const getLayer = async (lambda, arn) => {
  if (!arn) {
    return undefined
  }
  const name = arn.split(':')[arn.split(':').length - 2]
  const version = Number(arn.split(':')[arn.split(':').length - 1])

  const params = {
    LayerName: name,
    VersionNumber: version
  }

  try {
    const res = await lambda.getLayerVersion(params).promise()

    return {
      name,
      description: res.Description,
      hash: res.Content.CodeSha256,
      runtimes: res.CompatibleRuntimes,
      arn: res.LayerVersionArn
    }
  } catch (e) {
    if (e.code === 'ResourceNotFoundException') {
      return undefined
    }
    throw e
  }
}

const deleteLayer = async (lambda, arn) => {
  const name = arn.split(':')[arn.split(':').length - 2]
  const version = Number(arn.split(':')[arn.split(':').length - 1])

  const params = {
    LayerName: name,
    VersionNumber: version
  }

  await lambda.deleteLayerVersion(params).promise()
}

const configChanged = (prevLayer = {}, layer) => {
  const keys = ['description', 'hash', 'runtimes'] // bucket?
  const inputs = pick(keys, layer)
  const prevInputs = pick(keys, prevLayer)
  return not(equals(inputs, prevInputs))
}

module.exports = {
  pack,
  hash,
  publishLayer,
  deleteLayer,
  getLayer,
  configChanged
}
