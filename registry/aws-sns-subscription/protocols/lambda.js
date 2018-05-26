/* eslint-disable no-console */

const AWS = require('aws-sdk')
const { subscribe, unsubscribe } = require('./lib')

const lambda = new AWS.Lambda({ region: 'us-east-1' })

const deploy = async ({ topic, protocol, endpoint = '' }, context) => {
  const response = Promise.all([
    subscribe({ topic, protocol, endpoint }, context),
    lambda
      .addPermission({
        Action: 'lambda:InvokeFunction',
        FunctionName: endpoint,
        Principal: 'sns.amazonaws.com',
        SourceArn: topic,
        StatementId: `InvokeLamda${Date.now()}`
      })
      .promise()
  ]).then(([subscription, permission]) => ({
    subscriptionArn: subscription.SubscriptionArn,
    statement: JSON.parse(permission.Statement)
  }))
  return response
}

const remove = async (
  { subscriptionArn, functionName, statementId, qualifier, revisionId },
  context
) => {
  const response = Promise.all([
    unsubscribe({ subscriptionArn }, context),
    lambda
      .removePermission({
        FunctionName: functionName,
        StatementId: statementId,
        Qualifier: qualifier,
        RevisionId: revisionId
      })
      .promise()
  ])
  return response
}

module.exports = {
  deploy,
  remove,
  types: ['lambda']
}
