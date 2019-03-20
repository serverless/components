const { is, replace, map, forEachObjIndexed } = require('ramda')

const regex = require('./getVariableSyntax')()
const reservedNames = require('./reservedNames')

module.exports = (slsYml) => {
  const transformValue = (value) => {
    if (is(Object, value) || is(Array, value)) {
      return map(transformValue, value)
    }
    if (is(String, value)) {
      const r = value.replace(regex, (reference) => {
        const referencedVariable = replace(/[${}]/g, '', reference).split('.')
        const referencedComponentAlias = referencedVariable[0]
        if (slsYml.components && !reservedNames.includes(referencedComponentAlias)) {
          if (true || !slsYml.components[referencedComponentAlias]) {
            forEachObjIndexed((v, k) => {
              if (reference == '${custom.' + k + '}') {
                value = replace(/[${}]/g, '', v)
                  .split('.')[1]
                  .split(',')[1]
                const len = value.length
                value = value.substring(2, len - 1)
                reference = value
              }
            }, slsYml.custom)
            return reference
            /* eslint-enable */
          }
        }
        return reference
      })
      return r
    }
    return value
  }
  return map(transformValue, slsYml)
}
