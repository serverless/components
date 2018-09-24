import { getProp, isObject, isString } from '@serverless/utils'

//TODO BRN: What happens if no inputs are required? Should we always require at least an empty object? We won't be able to tell the difference between a type identifier for a prop vs a type instantiation

const isTypeConstruct = (value) =>
  isString(getProp('type', value)) && isObject(getProp('inputs', value))

export default isTypeConstruct
