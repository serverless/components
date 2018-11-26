import isType from './isType'
import { getProp, isObject, isString } from '@serverless/utils'

// TODO BRN: What happens if no inputs are required? Should we always require at least an empty object? We won't be able to tell the difference between a type identifier for a prop vs a type instantiation

const isTypeConstruct = (value) => {
  const type = getProp('type', value)
  const inputs = getProp('inputs', value)
  return (isString(type) || isType(type)) && isObject(inputs)
}

export default isTypeConstruct
