import { isBoolean, isDate, isNull, isNumber, isString, isUndefined } from '@serverless/utils'
import isSerializableReferenceable from './isSerializableReferenceable'

const isSerializable = (value) =>
  isSerializableReferenceable(value) ||
  isBoolean(value) ||
  isDate(value) ||
  isNumber(value) || // number, NaN and Infinity
  isString(value) ||
  isUndefined(value) ||
  isNull(value)

export default isSerializable
