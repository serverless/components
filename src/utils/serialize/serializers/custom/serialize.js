import hasType from '../../../type/hasType'
import getType from '../../utils/getType'
import serializeObject from '../../utils/serializeObject'

const serialize = (instance, context) => {
  if (!hasType(instance)) {
    throw new TypeError(
      `type.serialize expected an object with a type, instead received ${instance}`
    )
  }
  return {
    ...serializeObject(context, instance),
    type: getType(instance)
  }
}

export default serialize
