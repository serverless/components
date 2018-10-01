async function generateUploadUrl(provider, location) {
  return provider.request(
    'cloudfunctions',
    'v1',
    'projects',
    'locations',
    'functions',
    'generateUploadUrl',
    {
      parent: location
    }
  )
}

module.exports = generateUploadUrl
