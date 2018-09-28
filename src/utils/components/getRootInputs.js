const getComponentsFromServerlessFile = require('../components/getComponentsFromServerlessFile')
const { keys, last } = require('ramda')

const getRootInputs = async (projectPath, serverlessFileObject) => {
  const components = await getComponentsFromServerlessFile(
    { $: {} },
    projectPath,
    serverlessFileObject
  )
  const { inputs } = components[last(keys(components))]
  return inputs || {}
}

module.exports = getRootInputs
