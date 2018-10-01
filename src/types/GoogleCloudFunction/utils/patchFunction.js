async function patchFunction(provider, name, params) {
  // see: Schema$CloudFunction in https://github.com/google/google-api-nodejs-client
  const updateMask = [
    'availableMemoryMb',
    'description',
    'entryPoint',
    'environmentVariables',
    'eventTrigger',
    'httpsTrigger',
    'labels',
    'maxInstances',
    'name',
    'network',
    'runtime',
    'serviceAccountEmail',
    'sourceArchiveUrl',
    'sourceRepository',
    'sourceUploadUrl',
    'status',
    'timeout',
    'updateTime',
    'versionId'
  ].join(',')
  return provider.request('cloudfunctions', 'v1', 'projects', 'locations', 'functions', 'patch', {
    name,
    updateMask,
    resource: params
  })
}

module.exports = patchFunction
