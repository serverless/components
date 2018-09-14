const { intersection } = require('ramda')

function generateUpdateMask(keys = []) {
  // see: Schema$CloudFunction in https://github.com/google/google-api-nodejs-client
  const whitelistedKeys = [
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
  ]
  const validKeys = intersection(keys, whitelistedKeys)
  return validKeys.join(',')
}

module.exports = generateUpdateMask
