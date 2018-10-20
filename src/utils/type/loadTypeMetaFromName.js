import { getProp } from '@serverless/utils'
import { resolve } from 'path'
import errorUnknownTypeName from './errorUnknownTypeName'
import loadTypeMetaFromPath from './loadTypeMetaFromPath'

// TODO BRN: Replace this with something more configurable
const NATIVE_NAMES = {
  App: resolve(__dirname, '..', '..', '..', 'registry', 'App'),
  Function: resolve(__dirname, '..', '..', '..', 'registry', 'Function'),
  Service: resolve(__dirname, '..', '..', '..', 'registry', 'Service'),
  Cron: resolve(__dirname, '..', '..', '..', 'registry', 'Cron'),
  AwsIamPolicy: resolve(__dirname, '..', '..', '..', 'registry', 'AwsIamPolicy'),
  AwsIamRole: resolve(__dirname, '..', '..', '..', 'registry', 'AwsIamRole'),
  AwsLambdaCompute: resolve(__dirname, '..', '..', '..', 'registry', 'AwsLambdaCompute'),
  Component: resolve(__dirname, '..', '..', '..', 'registry', 'Component'),
  Compute: resolve(__dirname, '..', '..', '..', 'registry', 'Compute'),
  Object: resolve(__dirname, '..', '..', '..', 'registry', 'Object'),
  Plugin: resolve(__dirname, '..', '..', '..', 'registry', 'Plugin'),
  Provider: resolve(__dirname, '..', '..', '..', 'registry', 'Provider'),
  AwsS3Website: resolve(__dirname, '..', '..', '..', 'registry', 'AwsS3Website'),
  AwsProvider: resolve(__dirname, '..', '..', '...', 'registry', 'AwsProvider'),
  AwsDynamoDB: resolve(__dirname, '..', '..', 'types', 'AwsDynamoDB'),
  AwsLambdaFunction: resolve(__dirname, '..', '..', 'types', 'AwsLambdaFunction'),
  AwsEventsRule: resolve(__dirname, '..', '..', 'types', 'AwsEventsRule'),
  AwsS3Bucket: resolve(__dirname, '..', '..', 'types', 'AwsS3Bucket'),
  AwsSnsSubscription: resolve(__dirname, '..', '..', 'types', 'AwsSnsSubscription'),
  TwilioApplication: resolve(__dirname, '..', '..', 'types', 'TwilioApplication'),
  TwilioPhoneNumber: resolve(__dirname, '..', '..', 'types', 'TwilioPhoneNumber'),
  TwilioProvider: resolve(__dirname, '..', '..', 'types', 'TwilioProvider'),
  AwsSnsTopic: resolve(__dirname, '..', '..', 'types', 'AwsSnsTopic')
}

/**
 * @param {string} typeName the name to use to load a type
 * @param {*} context
 * @returns {{
 *   root: string,
 *   props: string
 * }}
 */
const loadTypeMetaFromName = async (typeName, context) => {
  // console.log('loadTypeMetaFromName - typeName:', typeName)
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
