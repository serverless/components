function getProvider(instance) {
  return instance.provider
}

function getCredentials(instance) {
  return instance.credentials
}

function getSDK(instance) {
  return instance.sdk
}

module.exports = {
  getProvider,
  getCredentials,
  getSDK
}
