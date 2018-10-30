import { isPlainObject } from '@serverless/utils'
import serializeObject from '../../utils/serializeObject'

const serialize = (object, context) => {
  if (!isPlainObject(object)) {
    throw new TypeError(`object.serialize expected an object, instead received ${object}`)
  }
  return {
    ...serializeObject(context, object),
    type: 'object'
  }
}

export default serialize
