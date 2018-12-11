import { getProp } from '@serverless/utils'
import { resolve } from 'path'
import errorUnknownTypeName from './errorUnknownTypeName'
import loadTypeMetaFromPath from './loadTypeMetaFromPath'

const componentsFromRegistryByName = (names) =>
  names.reduce(
    (obj, name) => ({
      ...obj,
      [name]: resolve(__dirname, '..', '..', '..', 'registry', name)
    }),
    {}
  )

// TODO BRN: Replace this with something more configurable
export const NATIVE_NAMES = componentsFromRegistryByName([
  'App',
  'Function',
  'Service',
  'Cron',
  'AwsIamPolicy',
  'AwsIamRole',
  'AwsLambdaCompute',
  'Component',
  'Compute',
  'Object',
  'EnvironmentBasedConfiguration',
  'Plugin',
  'Provider',
  'AwsApiGateway',
  'RestApi',
  'AwsS3Website',
  'AwsProvider',
  'AwsS3Bucket',
  'DockerImage',
  'AwsLambdaFunction',
  'TwilioProvider',
  'TwilioApplication',
  'AwsCloudWatchEventsRule',
  'TwilioPhoneNumber',
  'AwsSnsTopic',
  'AwsSnsSubscription',
  'AwsDynamoDb',
  'AwsLambdaLayerVersion'
])

/**
 * @param {string} typeName the name to use to load a type
 * @param {*} context
 * @returns {{
 *   root: string,
 *   props: string
 * }}
 */
const loadTypeMetaFromName = async (typeName, context) => {
  const absoluteTypePath = getProp(typeName, NATIVE_NAMES)
  if (!absoluteTypePath) {
    throw errorUnknownTypeName(typeName)
  }
  const typeMeta = await loadTypeMetaFromPath(absoluteTypePath, context)
  return {
    ...typeMeta,
    query: typeName
  }
}

export default loadTypeMetaFromName
