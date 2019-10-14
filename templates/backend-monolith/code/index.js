/**
 * Handler & Router
 */

module.exports = async (event = {}, ctx) => {

  const path = event.path.toLowerCase()
  const method = event.httpMethod.toLowerCase()
  const body = event.body

  console.log(path, method, body)

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: {
      message: `Response received at "${path}" path via a "${method}" method!!!`
    }
  }
}
