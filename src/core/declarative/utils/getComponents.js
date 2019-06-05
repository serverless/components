const { reduce, assoc, keys } = require('../../../utils')

function getComponents(fileContent) {
  return reduce(
    (accum, key) => {
      const value = fileContent[key]

      if (value.component) {
        return assoc(key, value, accum)
      }

      return accum
    },
    {},
    keys(fileContent)
  )
}

module.exports = getComponents
