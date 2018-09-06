const fetch = require('node-fetch')

async function deleteImage(token, tag, registryUrl) {
  let [username, image] = tag.split('/').slice(-2) // eslint-disable-line
  // remove appendix like ":latest"
  image = image.split(':').shift()

  const resource = [username, image].join('/')

  return fetch(`${registryUrl}/v2/repositories/${resource}`, {
    method: 'DELETE',
    headers: {
      Authorization: `JWT ${token}`
    }
  })
}

module.exports = deleteImage
