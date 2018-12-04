import { pickBy } from 'ramda'
import {
  get,
  keys,
  resolve,
  contains,
  forEach,
  mapObjIndexed,
  forEachObjIndexed,
  merge,
  pick,
  append,
  prop
} from '@serverless/utils'
import ramlValidate from 'raml-validate'
import chalk from 'chalk'

const validate = ramlValidate()

const validateInputs = (Type, inputs) => {
  const inputTypes = get('props.inputTypes', Type)
  if (!inputTypes) {
    return inputs
  }

  // we currently only support validating core types, not registry types
  const coreInputTypes = pickBy(
    (value) =>
      contains(value.type, [
        'boolean',
        'string',
        'number',
        'integer',
        'object',
        'nil',
        'datetime',
        'date-only',
        'time-only',
        'datetime-only',
        'file'
      ]),
    inputTypes
  )

  const coreInputs = mapObjIndexed((value) => resolve(value), pick(keys(coreInputTypes), inputs))

  const schema = validate({ ...coreInputTypes }, 'RAML10')
  const validation = schema({ ...coreInputs })

  if (!validation.valid) {
    let errorMessages = []
    const typeName = chalk.white(`"${Type.props.name}"`)
    const header = chalk.redBright.bold(`\ninputType error(s) in Type ${typeName}:\n`)
    errorMessages = append(header, errorMessages)

    forEach((error) => {
      const value = chalk.cyanBright(`"${error.value}"`)
      const key = `${chalk.yellowBright(error.key)}`
      const suppliedInputType = typeof error.value
      const msg = `  - inputType ${key} has invalid \`${suppliedInputType}\` value of ${value} according to the rule: ${chalk.yellowBright(
        error.rule
      )} ${chalk.yellowBright(error.attr)}.\n`
      errorMessages = append(msg, errorMessages)
    }, prop('errors', validation))

    const message = errorMessages.join('')
    throw Error(message)
  }
  // set defaults if any...
  forEachObjIndexed((coreInputType, key) => {
    if (!coreInputs[key] && !coreInputType.required && coreInputType.default !== undefined) {
      coreInputs[key] = coreInputType.default
    }
  }, coreInputTypes)
  return merge(inputs, coreInputs)
}

export default validateInputs
