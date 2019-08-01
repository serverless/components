const download = require('./download')

const load = async (type, id, context) => {
  const componentPath = (await download([type]))[type]

  const Component = require(componentPath)

  const component = new Component(id, context)

  await component.init()

  return component
}

module.exports = load
