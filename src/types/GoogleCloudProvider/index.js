const google = require('googleapis').google

const GoogleCloudProvider = {
  construct(inputs) {
    this.clientEmail = inputs.clientEmail
    this.privateKey = inputs.privateKey
    this.locationId = inputs.locationId
    this.projectId = inputs.projectId
    this.SDK = google
  },

  async request() {
    const authClient = new google.auth.JWT(this.clientEmail, null, this.privateKey, [
      'https://www.googleapis.com/auth/cloud-platform'
    ])
    await authClient.authorize()

    // extract necessary information from arguments array
    const lastArg = arguments[Object.keys(arguments).pop()]
    const hasParams = typeof lastArg === 'object'
    const filteredArgs = Array.from(arguments).filter((v) => typeof v === 'string')
    const params = hasParams ? lastArg : {}

    const service = filteredArgs[0]
    const version = filteredArgs[1]
    const serviceInstance = google[service](version)

    const requestParams = { auth: authClient, ...params }

    return filteredArgs
      .slice(2)
      .reduce((p, c) => p[c], serviceInstance)
      .bind(serviceInstance)(requestParams)
      .then((result) => result.data)
      .catch((error) => {
        if (error) {
          throw error
        }
      })
  },

  getSDK() {
    return this.SDK
  }
}

module.exports = GoogleCloudProvider
