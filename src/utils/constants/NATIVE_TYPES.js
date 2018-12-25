import { resolve } from 'path'

const NATIVE_TYPES = {
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
  EnvironmentBasedConfiguration: resolve(
    __dirname,
    '..',
    '..',
    '..',
    'registry',
    'EnvironmentBasedConfiguration'
  ),
  Plugin: resolve(__dirname, '..', '..', '..', 'registry', 'Plugin'),
  Provider: resolve(__dirname, '..', '..', '..', 'registry', 'Provider'),
  AwsApiGateway: resolve(__dirname, '..', '..', '..', 'registry', 'AwsApiGateway'),
  RestApi: resolve(__dirname, '..', '..', '..', 'registry', 'RestApi'),
  AwsS3Website: resolve(__dirname, '..', '..', '..', 'registry', 'AwsS3Website'),
  AwsProvider: resolve(__dirname, '..', '..', '..', 'registry', 'AwsProvider'),
  AwsS3Bucket: resolve(__dirname, '..', '..', '..', 'registry', 'AwsS3Bucket'),
  DockerImage: resolve(__dirname, '..', '..', '..', 'registry', 'DockerImage'),
  AwsLambdaFunction: resolve(__dirname, '..', '..', '..', 'registry', 'AwsLambdaFunction'),
  TwilioProvider: resolve(__dirname, '..', '..', '..', 'registry', 'TwilioProvider'),
  TwilioApplication: resolve(__dirname, '..', '..', '..', 'registry', 'TwilioApplication'),
  AwsCloudWatchEventsRule: resolve(
    __dirname,
    '..',
    '..',
    '..',
    'registry',
    'AwsCloudWatchEventsRule'
  ),
  TwilioPhoneNumber: resolve(__dirname, '..', '..', '..', 'registry', 'TwilioPhoneNumber'),
  AwsSnsTopic: resolve(__dirname, '..', '..', '..', 'registry', 'AwsSnsTopic'),
  AwsSnsSubscription: resolve(__dirname, '..', '..', '..', 'registry', 'AwsSnsSubscription'),
  AwsDynamoDb: resolve(__dirname, '..', '..', '..', 'registry', 'AwsDynamoDb')
}

export default NATIVE_TYPES
