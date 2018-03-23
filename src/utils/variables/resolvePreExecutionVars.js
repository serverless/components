const {
  is, not, replace, contains, keys, map, reduce, match
} = require('ramda')

const regex = require('./getVariableSyntax')()

module.exports = (selfProperties, slsYml) => {
  const resolveValue = (value) => {
    if (is(Object, value) || is(Array, value)) {
      return map(resolveValue, value)
    }

    if (is(String, value)) {
      const resolveReferenceToValue = (reference) => {
        const referencedVariable = replace(/[${}]/g, '', reference).split('.')

        if (referencedVariable[0] === 'env') {
          if (referencedVariable.length !== 2) {
            throw new Error(`Invalid environment reference: ${value}`)
          }
          return process.env[referencedVariable[1]]
        }

        if (referencedVariable[0] === 'self') {
          switch (referencedVariable.join('.')) {
            case 'self.path':
              return selfProperties.path
            case 'self.serviceId':
              return selfProperties.serviceId
            case 'self.instanceId':
              return selfProperties.instanceId
            default:
              throw new Error(`No such property of self: ${reference}`)
          }
        }

        if (referencedVariable[0] === 'input') {
          const referencedInput = referencedVariable[1]
          const inputs = slsYml.inputs // eslint-disable-line

          if (not(contains(referencedInput, keys(inputs)))) {
            throw new Error(`Referenced input does not exist for variable ${referencedVariable.join('.')}`)
          }
          referencedVariable.splice(0, 1)
          const resolvedValue = reduce((accum, key) => accum[key], inputs, referencedVariable)
          return resolvedValue
        }

        return reference
      }

      if (match(regex, value)[0] === value) {
        // If the value is a single reference, just return it directly
        // This is necessary for nested or object references
        return resolveReferenceToValue(value)
      }

      return value.replace(regex, (reference) => {
        const resolvedValue = resolveReferenceToValue(reference)
        if (is(Object, resolvedValue)) {
          throw new Error(`Cannot concatenate object reference ${reference} with string`)
        }
        return resolvedValue
      })
    }
    return value
  }
  return map(resolveValue, slsYml)
}
