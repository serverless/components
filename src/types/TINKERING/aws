// ---------------------------------------------------------
// NOTE
// DON'T MODIFY THE FILES HERE!
// ALL THE CODE HERE WAS MOVED INTO THE CORE CODEBASE
// NOTE
// ---------------------------------------------------------

/* eslint-disable */

// # serverless.yml
//
// type: service
// name: example-service
//
// description: Connects a S3 bucket to a Lambda function using a subscription
//
// components:
//   myS3Bucket:
//     type: AWSS3Bucket
//     inputs:
//       name: ${inputs.name}-bucket
//   myLambdaFunction:
//     type: AWSLambdaFunction
//     inputs:
//       ...
//   mySubscription:
//     type: Subscription
//     inputs:
//       source: ${myS3Bucket}
//       sink: ${myLambdaFunction}
//       config:
//         event: s3:ObjectCreated:*
//         filter:
//           - prefix: uploads/
//           - suffix: .jpg

// ---

// # serverless.yml
//
// type: service
// name: example-service
//
// description: Connects a Lambda function to an SNS topic using a subscription
//
// components:
//   myS3Bucket:
//     type: AWSS3Bucket
//     inputs:
//       ...
//   mySNSTopic:
//     type: AWSSNSTopic
//     inputs:
//       ...
//   mySubscription:
//     type: Subscription
//     inputs:
//       source: ${myS3Bucket}
//       sink: ${mySNSTopic}
//       config:
//         event: s3:ObjectCreated:*
//         filter:
//           - prefix: avatars/
//           - suffix: .png

class AWSS3Bucket implements ISource {
  // properties
  arn: String

  const provider: AWSProvider = inputs.provider || context.get('providers.aws')

  async deploy(instance, context) {
    const provider = instance.provider
    // ... deployment logic
    instance.arn = await deploy()
  }

  async updateS3Configuration(instance, { event, filter, function }) {
    // change the inputs here
    // OR we change the properties of this component
    instance.someProp = someVal
    await instance.deploy({event, filter, function})
  }

  async deploySource(instance, subscription, context) {
    const sink = subscription.getSink()
    const config = subscription.getConfig()
    const sinkConfig = sink.getSinkConfig()

    if (sinkConfig.protocol === 'AWSLambdaFunction') {
      await instance.updateS3Configuration({
        event: config.event,
        filter: config.filter,
        function: sinkConfig.uri // the `uri` will be the Lambda arn
      })
    } else if (sinkConfig.protocol === 'AWSSNSTopic') {
      await instance.updateS3Configuration({
        event: config.event,
        filter: config.filter,
        topic: sinkConfig.uri // the `uri` will be the Topic arn
      })
    }
  }

  async getSourceConfig(instance) {
    return {
      uri: instance.arn // TODO: how do we ensure that this is set?
    }
  }
}

class AWSSNSTopic implements ISource, ISink {
  // properties
  arn: String

  // using it as an ISource
  async createSNSSubscription({ protocol, endpoint }) {
    const AWSSNSSubscription = await context.loadType('AWSSNSSubscription')
    const awsSNSSubscription = context.construct(AWSSNSSubscription, {
      protocol,
      endpoint
    })
    await awsSNSSubscription.deploy(context)
  }

  async deploySource(instance, subscription, context) {
    const gateway = subscription.getGateway()
    const sink = subscription.getSink()
    let sinkConfig = sink.getSinkConfig()

    if (gateway) {
      sinkConfig = gateway.getSinkConfig()
    }

    if (sinkConfig.protocol === 'AWSLambdaFunction') {
      //create AWSSnsSubscription that uses the lambda protocol and lambda arn as the uri
      await this.createSNSSubscription({
        protocol: sinkConfig.protocol,
        endpoint: sinkConfig.uri
      })
    } else if (sinkConfig.protocol === 'http') {
      // TODO BRN: This requires either registering a transform with the EG so
      // that we can convert an SNS http call into an SNS event OR...
      // it requires first routing through
      await this.createSNSSubscription({
        protocol: sinkConfig.protocol,
        endpoint: sinkConfig.uri // this is the EG endpoint
      })
    }
  }

  getSinkConfig(instance) {
    return {
      uri: instance.arn,
      protocol: 'AWSSNSTopic'
    }
  }
}

class AWSLambdaFunction implements ISink {
  // properties
  arn: String

  getSinkConfig(instance) {
    return {
      uri: instance.arn,
      protocol: 'AWSLambdaFunction'
    }
  }
}
