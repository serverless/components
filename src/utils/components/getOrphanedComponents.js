const { difference, keys, pick } = require('ramda')

function getOrphanedComponents(serverlessFileComponents, stateFileComponents) {
  const componentIdsInServerlessFile = keys(serverlessFileComponents)
  const componentIdsInStateFile = keys(stateFileComponents)

  const orphanedComponentIds = difference(componentIdsInStateFile, componentIdsInServerlessFile)
  return pick(orphanedComponentIds, stateFileComponents)
}

module.exports = getOrphanedComponents
