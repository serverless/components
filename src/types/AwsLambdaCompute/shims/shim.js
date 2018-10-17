const transformS3Event = (event) => {
  const getS3Type = (s3EventType) => {
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
  const cloudEvent = {
    eventTime: event.eventTime || new Date().getTime(),
    eventID: event.eventID || new Date().getTime(),
    eventType: getS3Type(event.eventName),
    source: event.s3.bucket.arn,
    data: {
      ...event.s3.object,
      bucket: event.s3.bucket.name
    }
  }
  return cloudEvent
}
const transformSqsEvent = (event) => {
  const cloudEvent = {
    eventTime: event.eventTime || new Date().getTime(),
    eventID: event.messageId,
    eventType: 'aws.sqs',
    source: event.eventSourceARN,
    data: JSON.parse(event.body)
  }
  return cloudEvent
}
const transformSesEvent = (event) => {
  const cloudEvent = {
    eventTime: event.eventTime || new Date().getTime(),
    eventID: event.ses.mail.messageId,
    eventType: 'aws.ses',
    source: 'aws.ses',
    data: event.ses
  }
  return cloudEvent
}
const transformSnsEvent = (event) => {
  const cloudEvent = {
    eventTime: event.eventTime || new Date().getTime(),
    eventID: event.Sns.MessageId,
    eventType: 'aws.sns',
    source: event.Sns.TopicArn,
    data: {
      message: event.Sns.Message,
      messageId: event.Sns.MessageId,
      type: event.Sns.Type,
      subject: event.Sns.Subject
    }
  }
  return cloudEvent
}
const transformDynamoEvent = (event) => {
  const cloudEvent = {
    eventTime: event.eventTime || new Date().getTime(),
    eventID: event.eventID || new Date().getTime(),
    eventType: `aws.dynamodb.${event.eventName.toLowerCase()}`,
    source: event.eventSourceARN,
    data: event.dynamodb
  }
  return cloudEvent
}
const transformAsyncEvent = (event) => {
  if (event.eventSource === 'aws:s3') return transformS3Event(event)
  if (event.eventSource === 'aws:sqs') return transformSqsEvent(event)
  if (event.eventSource === 'aws:ses') return transformSesEvent(event)
  // it's upper case in case of SNS -_-
  if (event.EventSource === 'aws:sns') return transformSnsEvent(event)
  if (event.eventSource === 'aws:dynamodb') return transformDynamoEvent(event)
  return event
}

const transformSyncEvent = (event) => {
  if (event.httpMethod) {
    const cloudEvent = {
      eventTime: event.eventTime || new Date().getTime(),
      eventID: event.requestContext.requestId,
      eventType: `aws.apigateway.http`,
      source: `https://${event.requestContext.apiId}.execute-api.${
        process.env.AWS_REGION
      }.amazonaws.com${event.requestContext.path}`,
      data: event
    }
    return cloudEvent
  } else {
    return event
  }
}

module.exports.handler = (e, ctx, cb) => {
  delete require.cache[require.resolve('./index')]
  const context = {
    name: ctx.functionName,
    invocationId: ctx.awsRequestId,
    provider: ctx
  }

  try {
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
        .then((res) => cb(null, res))
        .catch((err) => cb(err))
    }
  } catch (err) {
    return cb(err)
  }
}
