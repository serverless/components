import { isNull } from '@serverless/utils'
import isComponent from '../component/isComponent'
import { createContext, generateReferenceKey, walkSerializeReferenceables } from './utils'

// NOTE BRN: This method belongs here and not in utils because the core has to have an understanding of how it serialized things and has to deal with backward compatability of older versions of serialized data. Will need a way of determining which serialization version was used. Later, this would probably be something that belongs in an SDK.
const serialize = (value, context) => {
  context = createContext(context)
  if (isNull(value)) {
    return null
  }
  if (!isComponent(value)) {
    throw new TypeError(
      `serialize method expects a Component instance. Instead it received ${value}`
    )
  }
  return {
    entryKey: generateReferenceKey(context, value),
    referenceables: walkSerializeReferenceables(context, value)
  }
}

export default serialize
