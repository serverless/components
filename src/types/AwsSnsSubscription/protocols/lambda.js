import { subscribe, unsubscribe } from './lib'

const deploy = async ({ provider, topic, protocol, endpoint }, context) => {
  const SDK = provider.getSdk()
  const lambda = new SDK.Lambda()
  const [subscription, permission] = await Promise.all([
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
  ])
  return {
    subscriptionArn: subscription.SubscriptionArn,
    statement: JSON.parse(permission.Statement)
  }
}

const remove = async ({ provider, statement, subscriptionArn }, context) => {
  const SDK = provider.getSdk()
  const lambda = new SDK.Lambda()
  const response = Promise.all([
    unsubscribe({ provider, subscriptionArn }, context),
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

const types = ['lambda']

export { deploy, remove, types }
