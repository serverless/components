const fetch = require('node-fetch')
const fs = require('fs')

const removeWorker = async ({ account_id, script_name }, context) => {
  const AUTH_KEY = process.env.CLOUDFLARE_AUTH_KEY
  const EMAIL = process.env.CLOUDFLARE_EMAIL

  const url = `https://api.cloudflare.com/client/v4/accounts/${account_id}/workers/scripts/${script_name}`

  const headers = {
    'X-Auth-Email': `${EMAIL}`,
    'X-Auth-Key': `${AUTH_KEY}`,
    'Content-Type': 'application/javascript'
  }

  const response = await fetch(url, { headers, method: `DELETE` })
  if (response.status == 200) {
    context.log(`✅ Script Removed: ${response.url}`)
  } else {
    context.log(`❌ Script Remove Failed `)
  }
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

  if (response.status == 200) {
    context.log(`✅ Route disbaled: ${response.statusText}`)
  } else {
    context.log(`❌ Script Remove Failed`)
  }
  return response
}

const doRoutesDeploy = async ({ zone_id, script_name, routes }, context) => {
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

  let { success: routeSuccess, result: routeResult, errors: routeErrors } = response

  if (routeSuccess || !routeContainsFatalErorrs(routeErrors)) {
    context.log(' ✅ Route enabled ', routes)
  } else {
    context.log(' ❌ Error, routes not deployed!')
    routeErrors.forEach((err) => {
      let { code, message } = err
      context.log(`--> Error Code:${code}\n--> Error Message: "${message}"`)
    })
  }

  return { routeSuccess, routeResult, routeErrors }
}

const doWorkerDeploy = async ({ script_path, script_name, account_id }, context) => {
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
  let { success: workerDeploySuccess, result: workerResult, errors: workerErrors } = response

  if (workerDeploySuccess) {
    context.log(' ✅ Script deployed ', script_name)
  } else {
    context.log(' ❌ Error, script not deployed!')
    workerErrors.forEach((err) => {
      let { code, message } = err
      context.log(`--> Error Code:${code}\n--> Error Message: "${message}"`)
    })
  }

  return { workerDeploySuccess, workerResult, workerErrors }
}

const routeContainsFatalErorrs = (errors) => {
  // print error if it is anything other than duplicate routes
  return errors.some((e) => e.code != 10020)

  //return errors.find(err => err.code != "10020")
}

const deploy = async (input, context) => {
  context.log('Deploying worker script')
  const workerScriptResponse = await doWorkerDeploy(input, context)
  const routeResponse = await doRoutesDeploy(input, context)

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
  context.log('Removing script')
  const { state } = context

  if (!context || !Object.keys(state).length) {
    throw new Error('No state data found')
  }
  if (state.workerDeploySuccess) {
    await removeWorker(input, context)
  }

  if (state.routeSuccess) {
    await removeRoute(input, context)
  }
  context.saveState()
  return {}
  /*
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
  */
  return {}
}
module.exports = {
  deploy,
  remove
}
