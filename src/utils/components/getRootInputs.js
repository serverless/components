const getComponentsFromServerlessFile = require('../components/getComponentsFromServerlessFile')
const { keys, last } = require('ramda')

const getRootInputs = async (projectPath, serverlessFileObject) => {
  // @todo find a way to get the main inputs better
  const components = await getComponentsFromServerlessFile(
    { $: {} },
    projectPath,
    serverlessFileObject
  )
  const { inputs } = components[last(keys(components))]
  const { credentials, state } = inputs
  return { credentials, state, projectPath }
}

module.exports = getRootInputs
