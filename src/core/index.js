/*
 * Core Component Functions - Exported to anyone using componnets programatically
 */

const path = require('path')
const fs = require('fs')
const { tmpdir } = require('os')
const axios = require('axios')
const WebSocket = require('ws')
const util = require('util')
const exec = util.promisify(require('child_process').exec)

const {
  pack,
  getEndpoints,
  validateComponent,
  validateInstance,
  getComponentUploadUrl,
  putComponentPackage,
  runComponent,
  getPackageUrls
} = require('./utils')

const connect = async (inputs, context) => {
  if (!context.debugMode) {
    return
  }

  context.debug('Establishing streaming connection')

  const endpoints = getEndpoints()

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(endpoints.socket)
    ws.on('open', () => {
      ws.send(
        JSON.stringify({
          action: '$default'
        })
      )
    })

    ws.on('message', (message) => {
      const msg = JSON.parse(message)
      if (msg.event === 'echo') {
        resolve(msg.data)
      } else if (msg.event === 'debug') {
        context.debug(msg.data)
      } else if (msg.event === 'log') {
        context.log(msg.data)
      } else if (msg.event === 'status') {
        context.status(msg.data)
      }
    })

    ws.on('error', (e) => reject(e))
  })
}

const validate = async (inputs, context) => {
  context.status(`Validating`)

  if (inputs.component) {
    return validateComponent(inputs.component)
  }
  return validateInstance(inputs.instance)
}

const build = async (inputs, context) => {
  if (typeof inputs.inputs.src === 'object' && inputs.inputs.src.hook && inputs.inputs.src.dist) {
    // First run the build hook, if "hook" and "dist" are specified
    context.status('Building')
    const options = { cwd: inputs.inputs.src.src }
    try {
      await exec(inputs.inputs.src.hook, options)
    } catch (err) {
      context.error(
        `Failed building website via "${inputs.inputs.src.hook}" due to the following error: "${err.stderr}"
        ${err.stdout}`
      )
    }
    inputs.inputs.src = path.resolve(path.join(inputs.inputs.src.src, inputs.inputs.src.dist))
  } else if (typeof inputs.inputs.src === 'object' && inputs.inputs.src.src) {
    inputs.inputs.src = path.resolve(inputs.inputs.src.src)
  } else if (typeof inputs.inputs.src === 'string') {
    inputs.inputs.src = path.resolve(inputs.inputs.src)
  }

  return inputs
}

const upload = async (inputs, context) => {
  // remove inputs if not deploying
  if (context.method !== 'deploy') {
    inputs.inputs = {}
    return inputs
  }

  const packagePath = path.join(
    tmpdir(),
    `${Math.random()
      .toString(36)
      .substring(6)}.zip`
  )

  context.debug(`Packaging from ${inputs.inputs.src} into ${packagePath}`)
  context.status('Packaging')

  const res = await Promise.all([
    getPackageUrls({ org: inputs.org, accessKey: context.accessKey }),
    pack(inputs.inputs.src, packagePath)
  ])

  const packageUrls = res[0]

  context.status('Uploading')
  context.debug(`Uploading ${packagePath} to ${packageUrls.upload.split('?')[0]}`)

  const instance = axios.create()
  instance.defaults.headers.common = {}
  instance.defaults.headers.put = {}
  const body = fs.readFileSync(packagePath)
  // todo handle errors
  try {
    await instance.put(packageUrls.upload, body)
  } catch (e) {
    throw e
  }

  context.debug(`Upload completed`)

  inputs.inputs.src = packageUrls.download

  return inputs
}

const run = async (inputs, context) => {
  inputs = await validate({ instance: inputs }, context)

  context.status(`Running`, inputs.name)

  const data = {
    ...inputs,
    credentials: context.credentials,
    accessKey: context.accessKey, // required
    debugMode: context.debugMode,
    socket: context.socket || {},
    method: context.method
  }

  const outputs = await runComponent(data)

  return outputs
}

const publish = async (inputs, context) => {
  inputs = await validate({ component: inputs }, context)

  if (!context.accessKey) {
    throw new Error(`Unable to publish. Missing accessKey.`)
  }

  const entity = `${inputs.name}@${inputs.version}`

  context.status(`Publishing`, entity)

  // Get Component path and temporary path for packaging
  const componentPackagePath = path.join(
    tmpdir(),
    `${Math.random()
      .toString(36)
      .substring(6)}.zip`
  )

  context.debug(`Packaging component from ${inputs.main}`)

  const res = await Promise.all([
    getComponentUploadUrl(inputs, context.accessKey),
    pack(inputs.main, componentPackagePath)
  ])

  const componentUploadUrl = res[0]

  context.debug(`Component packaged into ${componentPackagePath}`)

  context.debug(`Uploading component package`)

  await putComponentPackage(componentPackagePath, componentUploadUrl)

  context.debug(`Component package uploaded`)
}

module.exports = {
  connect,
  validate,
  build,
  upload,
  run,
  publish
}
