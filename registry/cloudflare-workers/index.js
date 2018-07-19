const fetch = require('node-fetch')
const fs = require('fs')

const removeWorker = async ({ account_id, script_name }) => {
  const AUTH_KEY = process.env.CLOUDFLARE_AUTH_KEY
  const EMAIL = process.env.CLOUDFLARE_EMAIL

  const url = `https://api.cloudflare.com/client/v4/accounts/${account_id}/workers/scripts/${script_name}`

  const headers = {
    'X-Auth-Email': `${EMAIL}`,
    'X-Auth-Key': `${AUTH_KEY}`,
    'Content-Type': 'application/javascript'
  }

  const response = await fetch(url, { headers, method: `DELETE` })
  return response
}

const removeRoute = async ({ zone_id }, context) => {
  const AUTH_KEY = process.env.CLOUDFLARE_AUTH_KEY
  const EMAIL = process.env.CLOUDFLARE_EMAIL

  if (!context.state.routeId) return {}
  const url = `https://api.cloudflare.com/client/v4/zones/${zone_id}/workers/routes/${
    context.state.routeId
  }`
  const headers = {
    'X-Auth-Email': `${EMAIL}`,
    'X-Auth-Key': `${AUTH_KEY}`
  }

  const response = await fetch(url, { headers, method: `DELETE` })
  return response
}

const doRoutesDeploy = async ({ zone_id, script_name, routes }) => {
  const AUTH_KEY = process.env.CLOUDFLARE_AUTH_KEY
  const EMAIL = process.env.CLOUDFLARE_EMAIL
  const url = `https://api.cloudflare.com/client/v4/zones/${zone_id}/workers/routes`
  const headers = {
    'X-Auth-Email': `${EMAIL}`,
    'X-Auth-Key': `${AUTH_KEY}`,
    'Content-Type': 'application/json'
  }
  const payload = { pattern: `${routes}`, script: `${script_name}` }

  const response = await fetch(url, {
    headers,
    method: 'POST',
    body: JSON.stringify(payload)
  }).then((body) => body.json())

  return response
}

const doWorkerDeploy = async ({ script_path, script_name, account_id }) => {
  const AUTH_KEY = process.env.CLOUDFLARE_AUTH_KEY
  const EMAIL = process.env.CLOUDFLARE_EMAIL

  const url = `https://api.cloudflare.com/client/v4/accounts/${account_id}/workers/scripts/${script_name}`

  const headers = {
    'X-Auth-Email': `${EMAIL}`,
    'X-Auth-Key': `${AUTH_KEY}`,
    'Content-Type': 'application/javascript'
  }
  const workerScript = fs.readFileSync(script_path).toString()

  const response = await fetch(url, { headers, body: workerScript, method: `PUT` }).then((body) =>
    body.json()
  )
  return response
}

const deploy = async (input, context) => {
  context.log('Deploying worker script')
  let outputs = context.state
  const workerScriptResponse = await doWorkerDeploy(input)
  const routerResponse = await doRoutesDeploy(input)

  let {
    success: workerDeploySuccess,
    result: workerResult,
    errors: workerErrors
  } = workerScriptResponse
  let { success: routerSuccess, result, errors: routerErrors } = routerResponse
  if (workerDeploySuccess && routerSuccess) {
    let { id: routeId } = result
    let { id: scriptID } = workerResult
    context.saveState({
      routeId,
      scriptName: scriptID,
      workerDeploySuccess,
      routerSuccess
    })
  } else {
    context.saveState({ routerErrors, workerErrors })
    context.log('Error, script not saved!')
  }
  return outputs
}

const info = (inputs, context) => {
  if (!context.state.workerDeploySuccess) return {}
  let outputs = context.state
  context.log(`Scipt deployed to zoneID:  '${inputs.zone_id}'`)
  return outputs
}

const remove = async (input, context) => {
  context.log('Removing script')
  if (!context.state.workerDeploySuccess) return {}
  const response = await removeWorker(input)
  if (response.status != 200) {
    context.save({ error: 'script not removed !' })
  } else {
    context.log(`removed:${response.url}`)
    if (!context.state.routerSuccess) return {}
    const routesRemovalResponse = await removeRoute(input, context)
    context.log(`removed route: ${routesRemovalResponse.statusText}`)
    context.saveState()
  }
  return {}
}
module.exports = {
  deploy,
  remove,
  info
}
