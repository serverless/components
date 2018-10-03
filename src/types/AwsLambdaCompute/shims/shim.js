function getS3Type(s3EventType) {
  const splittedS3Event = s3EventType.split(':')
  if (splittedS3Event[0] === 'ReducedRedundancyLostObject') {
    return 'aws.s3.ReducedRedundancyLostObject'
  } else if (splittedS3Event[0] === 'ObjectCreated' || splittedS3Event[0] === 'ObjectRemoved') {
    if (splittedS3Event[1] === '*') {
      return `aws.s3.${splittedS3Event[0]}`
    } else if (typeof splittedS3Event[1] === 'string') {
      return `aws.s3.${splittedS3Event[0]}.${splittedS3Event[1]}`
    }
  }
  return `aws.s3.${splittedS3Event[0]}`
}

const transformAsyncEvent = (event) => {
  const cloudEvent = {
    eventTime: new Date().getTime()
  }
  if (event.eventSource === 'aws:s3') {
    cloudEvent.eventID = event.eventID || new Date().getTime()
    cloudEvent.eventType = getS3Type(event.eventName)
    cloudEvent.source = event.s3.bucket.arn
    cloudEvent.data = {
      ...event.s3.object,
      bucket: event.s3.bucket.name
    }
  } else if (event.eventSource === 'aws:sqs') {
    cloudEvent.eventID = event.messageId
    cloudEvent.eventType = 'aws.sqs'
    cloudEvent.source = event.eventSourceARN
    cloudEvent.data = JSON.parse(event.body)
  } else if (event.eventSource === 'aws:ses') {
    cloudEvent.eventID = event.ses.mail.messageId
    cloudEvent.eventType = 'aws.ses'
    cloudEvent.source = 'aws.ses'
    cloudEvent.data = event.ses
  } else if (event.EventSource === 'aws:sns') {
    // it's EventSource (capital) in Sns case -_-
    cloudEvent.eventID = event.Sns.MessageId
    cloudEvent.eventType = 'aws.sns'
    cloudEvent.source = event.Sns.TopicArn
    cloudEvent.data = {
      message: event.Sns.Message,
      messageId: event.Sns.MessageId,
      type: event.Sns.Type,
      subject: event.Sns.Subject
    }
  } else if (event.eventSource === 'aws:dynamodb') {
    cloudEvent.eventID = event.eventID || new Date().getTime()
    cloudEvent.eventType = `aws.dynamodb.${event.eventName.toLowerCase()}`
    cloudEvent.source = event.eventSourceARN
    cloudEvent.data = event.dynamodb
  }
  return cloudEvent
}

const transformSyncEvent = (event) => {}

const transformResponse = (res) => {
  // there are two types of responses: http, or custom
  //   - our EG standard http response is currently identical to AWS APIG
  //   - custom response is any data returned from our universal function
  //     which we pass to the cb as is.
  return res
}

module.exports.handler = (e, ctx, cb) => {
  delete require.cache[require.resolve('./index')]
  const context = {
    name: ctx.functionName,
    invocationId: ctx.awsRequestId
  }
  try {
    // console.log(typeof e.Records)
    const filePath = `./${process.env.SERVERLESS_HANDLER.split('.')[0]}.js`
    const library = require(filePath)
    const functionName = process.env.SERVERLESS_HANDLER.split('.')[1]
    if (e.Records) {
      // aws async events
      e.Records.forEach((event) => {
        library[functionName](transformAsyncEvent(event), context)
      })
      cb(null, {})
    } else {
      // sync events: http or invoke
      const returnValue = library[functionName](transformSyncEvent(e), context)
      return Promise.resolve(returnValue)
        .then((res) => cb(null, transformResponse(res)))
        .catch((err) => cb(err))
    }
  } catch (err) {
    return cb(err)
  }
}
