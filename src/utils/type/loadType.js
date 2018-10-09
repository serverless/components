import defType from './defType'
import loadTypeMeta from './loadTypeMeta'

/**
 * Loads a type from any of the following sources
 * 1) type name (built into core)
 * 2) type name + semver range
 * 3) file path
 * 4) git url
 * 5) http(s) url
 *
 * @func
 * @param {string} query The query string to identify the type to load
 * @param {Context} context The context object
 * @returns {Promise<Type>} The type object that was loaded
 * @example
 *
 *  const Component = await loadType('Component')
 *  const AWSLambdaFunction = await loadType('AWSLambdaFunction@1.0.0')
 *  const MyComponent = await loadType('./some/path/MyComponent')
 *  const AwesomeComponent = await loadType('git@github.com:serverless/AwesomeComponent.git')
 *  const OtherComponent = await loadType('https://example.com/OtherComponent.zip')
 */
const loadType = async (query, context) => {
  const typeMeta = await loadTypeMeta(query.trim(), context)
  return defType(typeMeta, context)
}

export default loadType
