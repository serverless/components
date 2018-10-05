const EventGateway = require('@serverless/event-gateway-sdk')

const AwsProvider = {
  construct({ apiUrl, configurationUrl, apiKey, space }) {
    this.sdk = new EventGateway({
      url: apiUrl,
      configurationUrl,
      apiKey,
      space
    })
  },
  getSdk() {
    return this.sdk
  }
}

export default AwsProvider
