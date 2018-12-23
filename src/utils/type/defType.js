import { isObject, isString } from '@serverless/utils'
import loadTypeDef from './utils/loadTypeDef'

/**
 * Define a type using the given root path and property declarations
 *
 * @param {{ root: string, props: Object }} def The type definition
 * @param {Context} context The context object
 * @returns {Type}
 */
const defType = async ({ root, props, query }, context) => {
  if (!isObject(props)) {
    throw new Error('defType expects an object with a props property that is an object')
  }
  if (!isString(props.name)) {
    throw new Error(
      `Type declarations are expected to have a name. The type located at ${root} did not have one.`
    )
  }

  return loadTypeDef({ root, props, query }, context)
}

export default defType
