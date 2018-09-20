/* eslint-disable */

// ---------------------------------------------------------
// NOTE
// DON'T MODIFY THE FILES HERE!
// ALL THE CODE HERE WAS MOVED INTO THE CORE CODEBASE
// NOTE
// ---------------------------------------------------------

// Twilio -> AWSLambdaFunction
// # serverless.yml
//
// type: service
// name: example-service
//
// description: Using Twilio and the Event Gateway
//
// components:
//   twilioApp:
//     type: twilio-application
//     inputs:
//       accountSid: ${env.TWILIO_ACCOUNT_SID}
//       authToken: ${env.TWILIO_AUTH_TOKEN}
//       friendlyName: my-app
//       # smsUrl: "${myEventGateway.url}/sms"
//       # smsMethod: POST
//   phoneNumber:
//     type: twilio-phone-number
//     inputs:
//       accountSid: ${env.TWILIO_ACCOUNT_SID}
//       authToken: ${env.TWILIO_AUTH_TOKEN}
//       phoneNumber: "+1 123 456 7890"
//       smsApplicationSid: ${twilioApp.sid}
//   twilio:
//     type: twilio
//     inputs:
//       provider: TwilioProvider
//       phoneNumber: "+1 123 456 7890"

//   myLambdaFunction:
//     type: AWSLambdaFunction
//     inputs:
//       ...
//   myEventGateway:
//     type: ServerlessEventGateway
//     inputs:
//       ...
//   mySubscription:
//     type: Subscription
//     inputs:
//       source: ${twilioApp}
//       sink: ${myLambdaFunction}
//       gateway: ${myEventGateway}

// ---

// AWS --> GCF
// # serverless.yml
//
// type: service
// name: example-service
//
// description: Connects a S3 bucket to a Google Cloud Function function using a subscription and a gateway
//
// components:
//   myS3Bucket:
//     type: AWSS3Bucket
//     inputs:
//       ...
//   myCloudFunction:
//     type: GoogleCloudFunction
//     inputs:
//       ...
//   myEventGateway:
//     type: ServerlessEventGateway
//     inputs:
//       ...
//   mySubscription:
//     type: Subscription
//     inputs:
//       source: ${myS3Bucket}
//       sink: ${myCloudFunction}
//       gateway: ${myEventGateway}
//       config:
//         event: s3:ObjectCreated:*
//         filter:
//           - prefix: uploads/
//           - suffix: .jpg

// ---

// GCF --> AWS
// # serverless.yml
//
// type: service
// name: example-service
//
// description: Connects an Storage bucket to a Lambda function using a subscription and a gateway
//
// components:
//   myStorageBucket:
//     type: GoogleCloudStorageBucket
//     inputs:
//       ...
//   myLambdaFunction:
//     type: AWSLambdaFunction
//     inputs:
//       ...
//   myEventGateway:
//     type: ServerlessEventGateway
//     inputs:
//       ...
//   mySubscription:
//     type: Subscription
//     inputs:
//       source: ${myStorageBucket}
//       sink: ${myLambdaFunction}
//       gateway: ${myEventGateway}
//       config:
//         event: google.storage.object.finalize

class ServerlessEventGateway implements IGateway, ISource, ISink {
  // properties
  url: String

  async registerFunction({ functionId, type }) {
    // TODO BRN: How do we deal with cases where the function already exists?
    const EGFunction = await context.loadType('ServerlessEventGatewayFunction')
    const egFunction = context.construct(EGFunction, {
      functionId,
      type
    })
    return egFunction.deploy(context)
  }

  async createEventType({ name }) {
    const EGEventType = await context.loadType('ServerlessEventGatewayEventType')
    const egEventType = context.construct(EGEventType, {
      name
    })
    return egEventType.deploy(context)
  }

  async subscribe({ type, eventType, functionId }) {
    const EGSubscription = await context.loadType('ServerlessEventGatewaySubscription')
    const egSubscription = context.construct(EGSubscription, {
      type,
      eventType,
      functionId
    })
    return egSubscription.deploy(context)
  }

  async configureGateway(instance, subscription, context) {
    const source = subscription.getSource()
    const sink = subscription.getSink()
    const sourceConfig = source.getSourceConfig()
    const sinkConfig = sink.getConfig()

    const functionId = `${sinkConfig.uri.toLowerCase()}`
    const eventType = { name: 'http.request' }
    let func = { type: 'http', provider: { url: sinkConfig.uri }, functionId }
    const subscription = { type: 'sync', eventType: eventType.name, functionId } // TODO: what about `path` and `method`?!

    if (sinkConfig.protocol === 'AWSLambdaFunction') {
      // TODO: move provider access to sink.getConfig() rather than directly accessing it
      const provider = sink.provider
      func = {
        ...func,
        type: 'awslambda',
        provider: {
          arn: sinkConfig.uri,
          region: provider.region,
          awsAccessKeyId: provider.credentials.awsAccessKeyId,
          awsSecretAccessKey: provider.credentials.awsSecretAccessKey
        }
      }
    }

    await registerFunction(func)
    await createEventType(eventType)
    await subscribe(subscription)
  }

  getSourceConfig(instance: this): {
    // NOTE: uri could be enough here since we need the EG `url` and the `space`
    // (the `space` is part of the url)
    uri: instance.url
  }

  getSinkConfig(instance: this): {
    protocol: 'HTTP',
    uri: instance.url
  }
}
