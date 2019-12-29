/*
 * Internal Utils - Only exported for internal use
 */

const { contains, isNil, last, split } = require('ramda')
const path = require('path')
const globby = require('globby')
const AdmZip = require('adm-zip')
const axios = require('axios')
const fs = require('fs')

const getEndpoints = () => {
  let stage = 'prod'
  if (process.env.SERVERLESS_PLATFORM_STAGE && process.env.SERVERLESS_PLATFORM_STAGE !== 'prod') {
    stage = 'dev'
  }

  const stages = {
    dev: {
      http: `https://components-api.serverless-dev.com`,
      socket: `wss://kiexxv95i8.execute-api.us-east-1.amazonaws.com/dev`
    },
    prod: {
      http: `https://components-api.serverless.com`,
      socket: `wss://qtrusbzkq4.execute-api.us-east-1.amazonaws.com/prod`
    }
  }

  const endpoints = stages[stage]

  return endpoints
}

const engine = new Proxy(
  {},
  {
    get: (obj, functionName) => {
      const endpoints = getEndpoints()

      const callFunction = async (inputs = {}) => {
        const options = {
          url: `${endpoints.http}/engine/${functionName}`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          data: inputs
        }

        if (inputs.accessKey) {
          options.headers['Authorization'] = `Bearer ${inputs.accessKey}`
        }
        if (inputs.org) {
          options.headers['serverless-org-name'] = inputs.org
        }

        try {
          const res = await axios(options)
          return res.data
        } catch (requestError) {
          if (requestError.response) {
            // component level error that was reflected back to the CLI
            // with the message & stack
            if (requestError.response.data) {
              const { message, stack } = requestError.response.data
              const componentError = new Error(message)
              componentError.stack = stack
              throw componentError
            }

            // otherwise it's a generic backend error
            const { status, statusText } = requestError.response

            const backendError = new Error(`${status} - ${statusText}`)

            if (requestError.response.stack) {
              backendError.stack = requestError.response.stack
            }

            throw backendError
          }

          // any other uncaught error
          throw requestError
        }
      }

      return callFunction
    }
  }
)

const sleep = async (wait) => new Promise((resolve) => setTimeout(() => resolve(), wait))

const pack = async (inputDirPath, outputFilePath, include = [], exclude = []) => {
  const format = last(split('.', outputFilePath))

  if (!contains(format, ['zip', 'tar'])) {
    throw new Error('Please provide a valid format. Either a "zip" or a "tar"')
  }

  const patterns = ['**']

  if (!isNil(exclude)) {
    exclude.forEach((excludedItem) => patterns.push(`!${excludedItem}`))
  }

  const zip = new AdmZip()

  const files = (await globby(patterns, { cwd: inputDirPath })).sort()

  files.map((file) => {
    if (file === path.basename(file)) {
      zip.addLocalFile(path.join(inputDirPath, file))
    } else {
      zip.addLocalFile(path.join(inputDirPath, file), path.dirname(file))
    }
  })

  if (!isNil(include)) {
    include.forEach((file) => zip.addLocalFile(path.join(inputDirPath, file)))
  }

  zip.writeZip(outputFilePath)

  return outputFilePath
}

const validateComponent = (component) => {
  if (!component.name) {
    throw new Error('Unable to publish. Missing name.')
  }
  if (!component.org) {
    throw new Error('Unable to publish. Missing org.')
  }
  if (!component.author) {
    throw new Error('Unable to publish. Missing author.')
  }

  if (!component.version) {
    component.version = 'dev'
  }

  if (component.main) {
    component.main = path.resolve(process.cwd(), component.main)
  } else {
    component.main = process.cwd()
  }

  return component
}

const validateInstance = (instance) => {
  if (typeof instance.component === 'undefined' || !instance.component) {
    throw new Error(`Unable to run component. Missing "component" property.`)
  }

  if (typeof instance.name === 'undefined' || !instance.name) {
    throw new Error(`Unable to run component. Missing "name" property.`)
  }

  if (typeof instance.app === 'undefined' || !instance.app) {
    throw new Error(`Unable to run component. Missing "app" property.`)
  }

  instance.stage = instance.stage || 'dev'

  instance.inputs = instance.inputs || {}

  // Support for specifying "org" and "app" like: app: "myOrg/myApp"
  if (instance.app.includes('/')) {
    instance.org = instance.app.split('/')[0]
    instance.app = instance.app.split('/')[1]
  }

  if (typeof instance.org === 'undefined') {
    throw new Error(`Unable to run component. Missing "org" property.`)
  }

  if (instance.component.split('@').length === 2) {
    instance.componentName = instance.component.split('@')[0]
    instance.componentVersion = instance.component.split('@')[1]
  } else {
    instance.componentName = instance.component
    instance.componentVersion = 'dev'
  }
  return instance
}

const getComponentUploadUrl = async (componentDefinition, accessKey) => {
  const endpoints = getEndpoints()
  const url = `${endpoints.http}/component/${componentDefinition.name}`

  const data = JSON.stringify(componentDefinition)

  const headers = {
    Authorization: `Bearer ${accessKey}`,
    'serverless-org-name': componentDefinition.org,
    'content-type': 'application/json'
  }
  try {
    const res = await axios({
      method: 'put',
      url,
      data,
      headers
    })
    return res.data.url
  } catch (e) {
    if (e.response && e.response.status !== 200) {
      throw new Error(
        `${e.response.status} ${e.response.statusText || ''} ${e.response.data.message || ''}`
      )
    }
    throw e
  }
}

const putComponentPackage = async (componentPackagePath, componentUploadUrl) => {
  // axios auto adds headers that causes signature mismatch
  // so we gotta remove them manually
  const instance = axios.create()
  instance.defaults.headers.common = {}
  instance.defaults.headers.put = {}
  const file = fs.readFileSync(componentPackagePath)

  try {
    await instance.put(componentUploadUrl, file)
  } catch (e) {
    throw e
  }
}

const runComponent = async (inputs) => engine.runComponent(inputs)

const getPackageUrls = async (inputs) => engine.getPackageUrls(inputs)

const addConnectionToInstance = async (inputs) => engine.addConnectionToInstance(inputs)

module.exports = {
  sleep,
  pack,
  getEndpoints,
  validateComponent,
  validateInstance,
  getComponentUploadUrl,
  putComponentPackage,
  runComponent,
  getPackageUrls,
  addConnectionToInstance
}
