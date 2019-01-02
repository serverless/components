import { resolve } from 'path'

const componentsFromRegistryByName = (names) =>
  names.reduce(
    (obj, name) => ({
      ...obj,
      [name]: resolve(__dirname, '..', '..', '..', 'registry', name)
    }),
    {}
  )

// TODO BRN: Replace this with something more configurable
export const NATIVE_TYPES = componentsFromRegistryByName([
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

export default NATIVE_TYPES
