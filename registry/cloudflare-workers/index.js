const fetch = require('node-fetch')
const fs = require('fs')

const _cfApiCall = async ({ url, method, contentType = null, body = null }) => {
  const AUTH_KEY = process.env.CLOUDFLARE_AUTH_KEY
  const EMAIL = process.env.CLOUDFLARE_EMAIL
  let options = {
    headers: {
      'X-Auth-Email': EMAIL,
      'X-Auth-Key': AUTH_KEY
    },
    method: method
  }
  if (contentType) {
    options['headers']['Content-Type'] = contentType
  }
  if (body) {
    options['body'] = body
  }
  const resp = await fetch(url, options)
  return resp
}

// Cloudflare's script name for single script customers is their domain name
const _getDefaultScriptName = async (zoneId) => {
  const response = await _cfApiCall({
    url: `https://api.cloudflare.com/client/v4/zones/${zoneId}`,
    method: `GET`,
    contentType: `application/json`
  })
  if (response.status === 200) {
    const responseJson = await response.json()
    return responseJson['result']['name'].replace('.', '-')
  }
  throw new Error(
    'Something went wrong getting a default script name, try specifying scriptName in the serverless.yaml file'
  )
}

const _getAccountId = async () => {
  const response = await _cfApiCall({
    url: `https://api.cloudflare.com/client/v4/accounts`,
    method: `GET`
  })
  if (response.status === 200) {
    const jsonResponse = await response.json()
    return jsonResponse['result'][0]['id']
  }
  throw new Error(`Something went wrong getting your Cloudflare account ID`)
}

const removeWorker = async ({ accountId, scriptName }, context) => {
  if (!context.state.routeId) {
    context.log('You must deploy a script to a route before you can remove it')
    return {}
  }
  const response = await _cfApiCall({
    url: `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${scriptName}`,
    method: `DELETE`,
    contentType: `application/javascript`
  })
  if (response.status === 200) {
    context.log(`✅  Script Removed Successfully: ${scriptName}`)
  } else {
    context.log(`❌  Script Removal Failed`)
  }
  return response
}

const removeRoute = async ({ route, zoneId }, context) => {
  if (!context.state.routeId) {
    context.log('You must deploy a script to a route before you can remove it')
    return {}
  }

  const response = await _cfApiCall({
    url: `https://api.cloudflare.com/client/v4/zones/${zoneId}/workers/routes/${
      context.state.routeId
    }`,
    method: `DELETE`
  })

  if (response.status === 200) {
    context.log(`✅  Route Disabled Successfully: ${route}`)
  } else {
    context.log(`❌  Route Removal Failed`)
  }
  return response
}

const deployRoutes = async ({ route, scriptName, zoneId }, context) => {
  context.log('Assigning Script to Routes')
  const payload = { pattern: route, script: scriptName }
  const response = await _cfApiCall({
    url: `https://api.cloudflare.com/client/v4/zones/${zoneId}/workers/routes`,
    method: `POST`,
    contentType: `application/json`,
    body: JSON.stringify(payload)
  })
  const responseJson = await response.json()

  let { success: routeSuccess, result: routeResult, errors: routeErrors } = responseJson

  if (routeSuccess || !routeContainsFatalErorrs(routeErrors)) {
    context.log(`✅  Routes Deployed ${route}`)
  } else {
    context.log(`❌  Fatal Error, Routes Not Deployed!`)
    routeErrors.forEach((err) => {
      let { code, message } = err
      context.log(`--> Error Code:${code}\n--> Error Message: "${message}"`)
    })
  }

  return { routeSuccess, routeResult, routeErrors }
}

const deployWorker = async ({ accountId, scriptName, scriptPath }, context) => {
  const workerScript = fs.readFileSync(scriptPath).toString()

  const response = await _cfApiCall({
    url: `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${scriptName}`,
    contentType: `application/javascript`,
    body: workerScript,
    method: `PUT`
  }).then((body) => body.json())

  let { success: workerDeploySuccess, result: workerResult, errors: workerErrors } = response

  if (workerDeploySuccess) {
    context.log(`✅  Script Deployed ${scriptName}`)
  } else {
    context.log(`❌  Fatal Error, Script Not Deployed!`)
    workerErrors.forEach((err) => {
      let { code, message } = err
      context.log(`--> Error Code:${code}\n--> Error Message: "${message}"`)
    })
  }

  return { workerDeploySuccess, workerResult, workerErrors }
}

const routeContainsFatalErorrs = (errors) => {
  // suppress 10020 duplicate routes error
  // no need to show error when they are simply updating their script
  return errors.some((e) => e.code !== 10020)
}

const deploy = async (input, context) => {
  if (!input.scriptName) {
    input.scriptName = await _getDefaultScriptName(input.zoneId)
  }
  if (!input.accountId) {
    input.accountId = await _getAccountId()
  }

  context.log(`Deploying Worker Script`)
  const workerScriptResponse = await deployWorker(input, context)
  const routeResponse = await deployRoutes(input, context)

  const outputs = { ...workerScriptResponse, ...routeResponse }

  let { routeResult, routeErrors, routeSuccess } = outputs

  let updatedState = {
    ...outputs,
    routeSuccess: routeSuccess || !routeContainsFatalErorrs(routeErrors),
    routeId: routeResult ? routeResult.id : context.state.routeId
  }

  context.saveState(updatedState)
  return outputs
}

const remove = async (input, context) => {
  context.log(`Removing script`)
  const { state } = context

  if (!context || !Object.keys(state).length) {
    throw new Error(`No state data found`)
  }
  if (state.workerDeploySuccess) {
    await removeWorker(input, context)
  }

  if (state.routeSuccess) {
    await removeRoute(input, context)
  }
  context.saveState()

  return {}
}

module.exports = {
  deploy,
  remove
}
