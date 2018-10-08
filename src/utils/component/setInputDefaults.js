const { prop, isEmpty, has, forEachObjIndexed, isNil } = require('ramda')

function setInputDefaults(inputTypes, inputs) {
  // TODO: make code immutable / functional
  forEachObjIndexed((value, key) => {
    if (has('default', value) && (isEmpty(prop(key, inputs)) || isNil(prop(key, inputs)))) {
      inputs[key] = prop('default', value)
    }
  }, inputTypes)

  return inputs
}

module.exports = setInputDefaults
