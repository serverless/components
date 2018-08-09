const getComponentsFromServerlessFile = require('../components/getComponentsFromServerlessFile')
const { keys, last } = require('ramda')

const getConfig = async (projectPath) => {
  // @todo find a way to get the main inputs better
  const components = await getComponentsFromServerlessFile({ $: {} }, projectPath)
  const { inputs } = components[last(keys(components))]
  const { credentials, state } = inputs
  return { credentials, state, projectPath }
}

module.exports = getConfig
