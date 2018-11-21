import { pickBy } from 'ramda'
import { get, keys, resolve, contains, forEach, mapObjIndexed, pick } from '@serverless/utils'
import ramlValidate from 'raml-validate'

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
    let invalidInputs = ''
    forEach((obj) => {
      if (invalidInputs === '') {
        invalidInputs = `${obj.key}`
      } else {
        invalidInputs = `${invalidInputs}, ${obj.key}`
      }
    }, validation.errors)
    throw Error(`Invalid input(s) for the ${Type.props.name} type: ${invalidInputs}`)
  }

  // set defaults if any... (todo)
  // forEachObjIndexed((coreInputType, key) => {
  //   if (!coreInputs[key] && !coreInputType.required && coreInputType.default) {
  //     coreInputs[key] = coreInputType.default
  //   }
  // }, coreInputTypes)
  //
  // return merge(inputs, coreInputs)
}

export default validateInputs
