import { get, pipe } from '@serverless/utils'
import { createContext, deserializeReferenceables, reconstructReferences } from './utils'

const deserialize = async (state, context) => {
  if (!state) {
    return null
  }
  context = createContext(context)

  const { entryKey, referenceables } = state
  if (!entryKey || !referenceables) {
    return null
  }

  return pipe(
    deserializeReferenceables(context),
    // (result) => {
    //   console.log('result:', result)
    //   return result
    // },
    reconstructReferences(context),
    // (reconstructed) => {
    //   console.log('reconstructed:', reconstructed)
    //   return reconstructed
    // },
    get(entryKey)
  )(referenceables)
}

export default deserialize
