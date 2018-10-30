import { isArray } from '@serverless/utils'
import serializeArray from '../../utils/serializeArray'

const serialize = (array, context) => {
  if (!isArray(array)) {
    throw new TypeError(`array.serialize expected an array, instead received ${array}`)
  }
  return {
    ...serializeArray(context, array),
    type: 'array'
  }
}

export default serialize
