const validate = require('raml-validate')()
const {
  assoc, prop, isEmpty, has, forEachObjIndexed, isNil
} = require('ramda')

function validateInputs(componentId, inputTypes, inputs) {
  let errorMessages = []
  if (inputTypes && inputs) {
    const schema = validate({ ...inputTypes }, 'RAML10')
    const validation = schema({ ...inputs })
    if (!validation.valid) {
      const component = componentId.split(':').pop()
      errorMessages = validation.errors.map((error) =>
        `Type error in component "${component}" --> Input "${error.key}" has value ${
          error.value
        } but expected the following: ${error.rule} ${error.attr}.`)
    }
  }
  if (errorMessages.length) {
    const message = errorMessages.join(' ')
    throw new Error(message)
  }

  // update the inputs with e.g. default values
  let updatedInputs = { ...inputs }
  forEachObjIndexed((value, key) => {
    if (has('default', value) && (isEmpty(prop(key, inputs)) || isNil(prop(key, inputs)))) {
      updatedInputs = assoc(key, prop('default', value), inputs)
    }
  }, inputTypes)

  return updatedInputs
}

module.exports = validateInputs
