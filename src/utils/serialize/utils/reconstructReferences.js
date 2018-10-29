import { curry, forEach, get, map } from '@serverless/utils'
import isReference from './isReference'

const reconstructReferences = curry((context, referenceables) =>
  map(
    (referenceable) =>
      forEach((value, key) => {
        if (isReference(value)) {
          const referenceKey = get('@@ref', value)
          const reference = get(referenceKey, referenceables)
          if (!reference) {
            throw new Error(
              `Could not find reference for reference key ${referenceKey}. Your state file could be corrupted.`
            )
          }
          referenceable[key] = reference
        }
      }, referenceable),
    referenceables
  )
)

export default reconstructReferences
