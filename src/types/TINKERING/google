/* eslint-disable */

// ---------------------------------------------------------
// NOTE
// DON'T MODIFY THE FILES HERE!
// ALL THE CODE HERE WAS MOVED INTO THE CORE CODEBASE
// NOTE
// ---------------------------------------------------------

// # serverless.yml
//
// type: service
// name: example-service
//
// description: Connects a Google Cloud Storage bucket to a Google Cloud Function using a subscription
//
// components:
//   myStorageBucket:
//     type: GoogleCloudStorageBucket
//     inputs:
//       name: ${inputs.name}-bucket
//   myCloudFunction:
//     type: GoogleCloudFunction
//     inputs:
//       ...
//   mySubscription:
//     type: Subscription
//     inputs:
//       source: ${myStorageBucket}
//       sink: ${myCloudFunction}
//       config:
//         event: google.storage.object.finalize

// ----------------

// # serverless.yml
//
// type: service
// name: example-service
//
// description: Connects a Google Cloud PubSub Topic to a Google Cloud Function using a subscription
//
// components:
//   myPubSubTopic:
//     type: GoogleCloudPubSubTopic
//     inputs:
//       ...
//   myCloudFunction:
//     type: GoogleCloudFunction
//     inputs:
//       ...
//   mySubscription:
//     type: Subscription
//     inputs:
//       source: ${myPubSubTopic}
//       sink: ${myCloudFunction}
//       config:
//         event: google.pubsub.topic.publish

class GoogleCloudPubSubTopic implements ISource, ISink {
  // properties
  name: String  // see: https://cloud.google.com/pubsub/docs/reference/rest/v1/projects.topics/create

  async deploySource(instance, subscription, context) {
    const source = subscription.getSource()
    const sink = subscription.getSink()
    const config = subscription.getConfig()
    const sourceConfig = subscription.getSourceConfig()
    const sinkConfig = sink.getSinkConfig()

    if (sinkConfig.protocol === 'GoogleCloudFunction') {
      // avoid mutation here?!
      // TODO BRN: What do we do in the event that this function is attached
      // to both a http event AND an async event? Maybe create two instances
      // of the function?
      sink.httpsTrigger = null
      sink.eventTrigger = {
        resource: sourceConfig.uri
        type: config.event
      }
      await sink.deploy()
    }
  }

  getSourceConfig(instance) {
    return {
      uri: instance.name
    }
  }
}

class GoogleCloudStorageBucket implements ISource {
  // properties
  name: String // see: https://cloud.google.com/storage/docs/json_api/v1/buckets/insert

  async deploySource(instance, subscription, context) {
    const source = subscription.getSource()
    const sink = subscription.getSink()
    const config = subscription.getConfig()
    const sinkConfig = sink.getSinkConfig()

    if (sinkConfig.protocol === 'GoogleCloudFunction') {
      // avoid mutation here?!
      sink.httpsTrigger = null
      sink.eventTrigger = {
        resource: sourceConfig.uri,
        type: config.event
      }
      await sink.deploy()
    }

    getSourceConfig(instance) {
      return {
        uri: instance.name
      }
    }
  }
}

class GoogleCloudFunction implements ISink {
  // properties
  name: String // see: https://cloud.google.com/functions/docs/reference/rest/v1/projects.locations.functions#CloudFunction

  getSinkConfig(instance) {
    return {
      uri: instance.name
      protocol: 'GoogleCloudFunction'
    }
  }
}
