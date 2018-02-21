const path = require('path')

module.exports = async (type) => {
  const registeryRoot = path.join(__dirname, '..', '..', 'registry')
  const component = require(path.join(registeryRoot, type))
  return component
}
