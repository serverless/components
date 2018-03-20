const validate = require('raml-validate')()
const chalk = require('chalk')
const {
  assoc,
  prop,
  isEmpty,
  has,
  forEachObjIndexed,
  isNil
} = require('ramda')

function validateInputs(componentId, inputTypes, inputs) {
  let errorMessages = []
  if (inputTypes && inputs) {
    const schema = validate({ ...inputTypes }, 'RAML10')
    const validation = schema({ ...inputs })
    if (!validation.valid) {
      const component = componentId.split(':').pop()
      errorMessages = validation.errors.map((error, i) => {
        const componentName = chalk.white(`"${component}"`)
        const header = (i !== 0) ? '' : chalk.redBright.bold(`\nType error in component ${componentName}`)
        const value = chalk.cyanBright(`"${error.value}"`)
        const key = `${chalk.yellowBright(error.key)}`
        const suppliedType = typeof error.value
        const newLine = (i === 0) ? '\n' : ''
        return `${header}${newLine} - Input ${key} has \`${suppliedType}\` value of ${value} but expected the following: ${chalk.yellowBright(error.rule)} ${chalk.yellowBright(error.attr)}.\n`
      })
    }
  }

  if (errorMessages.length) {
    const message = errorMessages.join('')
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
