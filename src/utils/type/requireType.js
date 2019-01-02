import { isPromise } from '@serverless/utils'
import requireTypeDef from './utils/requireTypeDef'
import requireTypeMeta from './utils/requireTypeMeta'

/**
 * Requires a type from the cache. If a type has not already been loaded you will get an error. You MUST first load a type before you can require it.
 *
 * @function
 * @param {string} query The query string to identify the type to require
 * @param {Context} context The context object
 * @returns {Type} The type object that was required
 * @example
 *
 *  const Component = requireType('Component')
 *  const AWSLambdaFunction = requireType('AWSLambdaFunction@1.0.0')
 *  const MyComponent = requireType('./some/path/MyComponent')
 *  const AwesomeComponent = requireType('git@github.com:serverless/AwesomeComponent.git')
 *  const OtherComponent = requireType('https://example.com/OtherComponent.zip')
 */
const requireType = (query, context) => {
  const typeMeta = requireTypeMeta(query.trim(), context)
  if (!typeMeta) {
    throw new Error(`Could not find type ${query}`)
  }
  if (isPromise(typeMeta)) {
    throw new Error(
      `type '${query}' was not finished loading before it was required. This has likely happened because a call to loadType() was not properly awaited before calling requireType()`
    )
  }

  const typeDef = requireTypeDef(typeMeta, context)
  if (!typeDef) {
    throw new Error(
      `Found type meta information but no defintion. This should not happen. This is likely a bug in the core of serverless ${typeDef}`
    )
  }
  if (isPromise(typeDef)) {
    throw new Error(
      `type '${query}' was not finished loading before it was required. This has likely happened because a call to loadType() was not properly awaited before calling requireType()`
    )
  }
  return typeDef
}

export default requireType
