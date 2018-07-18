const fetch = require('node-fetch')
const fs = require('fs')

const doWorkerDeploy = async ({ zone_id, script_path }) => {
  const AUTH_KEY = process.env.CLOUDFLARE_AUTH_KEY
  const EMAIL = process.env.CLOUDFLARE_EMAIL
  const url = `https://api.cloudflare.com/client/v4/zones/${zone_id}/workers/script`

  const headers = {
    'X-Auth-Email': `${EMAIL}`,
    'X-Auth-Key': `${AUTH_KEY}`,
    Accept: 'application/javascript',
    'Content-Type': 'text/javascript'
  }
  const workerScript = fs.readFileSync(script_path).toString()

  const response = await fetch(url, { headers, body: workerScript, method: `PUT` }).then((body) =>
    body.json()
  )
  let { result, success, errors, messages } = response

  return {
    success,
    errors,
    messages,
    result
  }
}
/*
const removeWorker =  ({zone_id}) => {
	
	const AUTH_KEY = process.env.CLOUDFLARE_AUTH_KEY
	const EMAIL = process.env.CLOUDFLARE_EMAIL
	const url = `https://api.cloudflare.com/client/v4/zones/${zone_id}/workers/script`

	const headers = {
		"X-Auth-Email": `${EMAIL}`,
		"X-Auth-Key": `${AUTH_KEY}`,
		"Content-Type": "application/json"
	}

	return fetch(url, { headers, method: `DELETE` }).then(body => body.json())
	
}
*/
async function deploy(input, context) {
  context.log('Deploying worker script')
  const { success, errors, messages, result } = await doWorkerDeploy(input)
  if (errors.length != 0) {
    context.log(errors, messages, result)
  } else {
    let { script } = result
    context.log('successfully deployed worker script\n', script)
  }

  return {
    success
  }
}
/*
const remove = (input, context) => {
	context.log('Removing worker script ')
	await removeWorker(input)
	context.log('awesome ')
}
*/
module.exports = {
  deploy
}
