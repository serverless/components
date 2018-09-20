// ---------------------------------------------------------
// NOTE
// THIS CODE WAS NOT YET MOVED INTO THE CORE CODEBASE
// NOTE
// ---------------------------------------------------------

/* eslint-disable */

// AWS --> Generic function
// # serverless.yml
//
// type: service
// name: example-service
//
// description: Connects a Storage bucket to a generic (provider-agnostic) function using a subscription
//
// provider:
//   aws:
//     type: AWS
//     inputs:
//       ...credentials
//
// compute:
//   awsLambda:
//     type: AWSLambdaCompute
//     inputs:
//       provider: ${inputs.provider.aws}
//       runtime: nodejs
//
// functions:
//   hello:
//     compute: ${input.compute.awsLambda}
//     memory: 512
//     ...
//
// components:
//   myS3Bucket:
//     type: AWSS3Bucket
//     inputs:
//       ...
//   myFunction:
//     type: Function
//     inputs:
//       ...
//   mySubscription:
//     type: Subscription
//     inputs:
//       source: ${myS3Bucket}
//       sink: ${myFunction}
//       config:
//         event: s3:ObjectCreated:*

// ----------------------------------------
// NOTE: waiting on the final design decisions here...
// ----------------------------------------

class Function {
  // the function doesn't need to implement `getSinkConfig`
  // since the AWSLambdaFunction implements this
}

class AWSLambdaFunction extends Function implements ISink {
  getSinkConfig(instance) {
    return {
      uri: instance.arn,
      protocol: 'AWSLambdaFunction'
    }
  }
}
