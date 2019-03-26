const { reduce, assoc, keys } = require('../../../utils')

function getComponents(fileContent) {
  return reduce(
    (accum, key) => {
      const value = fileContent[key]
      // component definitions start with an uppercase letter
      if (key[0] === key[0].toUpperCase()) {
        return assoc(key, value, accum)
      }
      return accum
    },
    {},
    keys(fileContent)
  )
}

module.exports = getComponents
