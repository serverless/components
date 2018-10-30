import {
  get,
  isArray,
  isBoolean,
  isDate,
  isInfinity,
  isNaN,
  isNull,
  isNumber,
  isPlainObject,
  isString,
  isUndefined
} from '@serverless/utils'
import hasType from '../../type/hasType'

const getType = (value) => {
  if (hasType(value)) {
    return get('query', value.getType())
  }
  if (isArray(value)) {
    return 'array'
  }
  if (isNull(value)) {
    return 'null'
  }
  if (isUndefined(value)) {
    return 'undefined'
  }
  if (isBoolean(value)) {
    return 'boolean'
  }
  if (isNaN(value)) {
    return 'nan'
  }
  if (isInfinity(value)) {
    return 'infinity'
  }
  if (isNumber(value)) {
    return 'number'
  }
  if (isDate(value)) {
    return 'date'
  }
  if (isString(value)) {
    return 'string'
  }
  if (isPlainObject(value)) {
    return 'object'
  }
  return null
}

export default getType
