const SDK = require('aws-sdk')

function getSdk(inputs) {
  const sdkProxy = new Proxy(SDK, {
    get(sdk, prop) {
      if (prop === 'toJSON') {
        return null
      }

      if (sdk[prop] && sdk[prop].prototype instanceof SDK.Service) {
        return new Proxy(sdk[prop], {
          construct(Service, [ options ]) {
            const regionOption = inputs.region ? { region: inputs.region } : null
            const credentialsOption = { credentials: inputs.credentials }
            return new Service({ ...regionOption, ...credentialsOption, ...options })
          }
        })
      }

      return sdk[prop]
    }
  })

  return { sdk: sdkProxy, region: inputs.region }
}

module.exports = new Proxy(
  { getSdk },
  {
    get() {
      return getSdk
    }
  }
)
