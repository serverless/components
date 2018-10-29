import { isArray, isPlainObject } from '@serverless/utils'
import hasType from '../../type/hasType'

const isSerializableReferenceable = (value) =>
  isPlainObject(value) || isArray(value) || hasType(value)

export default isSerializableReferenceable
