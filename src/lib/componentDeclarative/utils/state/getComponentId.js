// this is the `componentId` the declarative component uses internally
function getComponentId(fileName) {
  return fileName
    .split('.')
    .slice(-2)
    .shift()
}

module.exports = getComponentId
