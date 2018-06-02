/* eslint-disable no-console */

const AWS = require('aws-sdk')
const { subscribe, unsubscribe, splitArn } = require('./lib')

const sqs = new AWS.SQS({ region: 'us-east-1' })

const deploy = async ({ topic, protocol, endpoint }, context) => {
  const { region, accountId, resource } = splitArn(endpoint)
  const queueUrl = `https://sqs.${region}.amazonaws.com/${accountId}/${resource}`
  const { SubscriptionArn } = await subscribe({ topic, protocol, endpoint }, context)
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

const remove = async (context) => {
  const { permission } = context.state
  const { QueueUrl } = permission
  const response = Promise.all([
    unsubscribe(context),
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
