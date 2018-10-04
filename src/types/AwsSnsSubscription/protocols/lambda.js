/* eslint-disable no-console */

const { subscribe, unsubscribe } = require('./lib')

const deploy = async ({ provider, topic, protocol, endpoint }, context) => {
  const lambda = new provider.getSdk().Lambda()
  const response = Promise.all([
    subscribe({ provider, topic, protocol, endpoint }, context),
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

const remove = async (instance, context) => {
  const lambda = new instance.provider.getSdk().Lambda()
  const { statement } = context.getState(instance)
  const response = Promise.all([
    unsubscribe(instance, context),
    lambda
      .removePermission({
        FunctionName: statement ? statement.Resource : '',
        StatementId: statement ? statement.Sid : '',
        Qualifier: undefined, // todo
        RevisionId: undefined // todo
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
