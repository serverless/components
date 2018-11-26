import { get } from '@serverless/utils'
import create from '../../../type/create'
import deserializeObject from '../../utils/deserializeObject'

const deserialize = async (serialized, context) => {
  const type = get('type', serialized)
  if (!type) {
    throw new TypeError(
      `type.deserialize expected a serialized type. Instead was given ${serialized}`
    )
  }
  const Type = await context.import(type)
  if (!Type) {
    throw new Error(`Could not load type for serialized instance. ${type}`)
  }
  const data = await deserializeObject(context, serialized)
  return create(Type, data)
}

export default deserialize
