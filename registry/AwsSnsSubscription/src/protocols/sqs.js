import { subscribe, unsubscribe, splitArn } from './lib'

const deploy = async ({ provider, topic, protocol, endpoint }, context) => {
  const SDK = provider.getSdk()
  const sqs = new SDK.SQS()
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
  return {
    subscriptionArn: SubscriptionArn,
    permission
  }
}

const remove = async ({ permission, provider, subscriptionArn }, context) => {
  const SDK = provider.getSdk()
  const sqs = new SDK.SQS()
  const { QueueUrl } = permission
  const response = Promise.all([
    unsubscribe({ provider, subscriptionArn }, context),
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

const types = ['sqs']

export { deploy, remove, types }
