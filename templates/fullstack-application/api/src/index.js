const lib = require('./lib')

/**
 * Handler / Router
 */

module.exports = async (event = {}, ctx) => {
  const path = event.path.toLowerCase()
  const method = event.httpMethod.toLowerCase()
  const body = event.body

  console.log(path, method, body)

  let response

  try {
    if (path === '/v1/votes' && method === 'post') response = await lib.saveVote()
    if (path === '/v1/votes' && method === 'get') response = await lib.getVotes()
  } catch (error) {
    console.log(error)
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: error
    }
  }

  return response
}
