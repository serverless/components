const validate = require('raml-validate')()
const chalk = require('chalk')
const { forEach, prop, append } = require('ramda')

function validateTypes(componentId, propTypes, props, opts = { prefix: 'Type' }) {
  let errorMessages = []
  if (propTypes && props) {
    const schema = validate({ ...propTypes }, 'RAML10')
    const validation = schema({ ...props })
    if (!validation.valid) {
      const component = componentId.split(':').pop()
      const componentName = chalk.white(`"${component}"`)
      const header = chalk.redBright.bold(`\nType error(s) in component ${componentName}:\n`)
      errorMessages = append(header, errorMessages)
      forEach((error) => {
        const value = chalk.cyanBright(`"${error.value}"`)
        const key = `${chalk.yellowBright(error.key)}`
        const suppliedType = typeof error.value
        const msg = `  - ${
          opts.prefix
        } ${key} has \`${suppliedType}\` value of ${value} but expected the following: ${chalk.yellowBright(
          error.rule
        )} ${chalk.yellowBright(error.attr)}.\n`
        errorMessages = append(msg, errorMessages)
      }, prop('errors', validation))
    }
  }

  if (errorMessages.length) {
    const message = errorMessages.join('')
    throw new Error(message)
  }
}

module.exports = validateTypes
