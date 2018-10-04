/* eslint-disable no-console */

const { subscribe, unsubscribe, splitArn } = require('./lib')

const deploy = async ({ provider, topic, protocol, endpoint }, context) => {
  const sqs = new provider.getSdk().SQS()
  const { region, accountId, resource } = splitArn(endpoint)
  const queueUrl = `https://sqs.${region}.amazonaws.com/${accountId}/${resource}`
  const { SubscriptionArn } = await subscribe({ provider, topic, protocol, endpoint }, context)
  const permission = {
    QueueUrl: queueUrl,
    Attributes: {
      Policy: JSON.stringify({
        Version: '2012-10-17',
        Id: `SQSQueuePolicy${Date.now()}`,
        Statement: [
          {
            Sid: `SQSStatement${Date.now()}`,
            Effect: 'Allow',
            Principal: '*',
            Action: ['sqs:SendMessage'],
            Resource: endpoint,
            Condition: {
              ArnEquals: {
                'aws:SourceArn': topic
              }
            }
          }
        ]
      })
    }
  }
  await sqs.setQueueAttributes(permission).promise()
  return { subscriptionArn: SubscriptionArn, permission }
}

const remove = async (instance, context) => {
  const sqs = new instance.provider.getSdk().SQS()
  const { permission } = context.state
  const { QueueUrl } = permission
  const response = Promise.all([
    unsubscribe(instance, context),
    sqs
      .setQueueAttributes({
        QueueUrl,
        Attributes: {
          Policy: ''
        }
      })
      .promise()
  ])
  return response
}
module.exports = {
  deploy,
  remove,
  types: ['sqs']
}
