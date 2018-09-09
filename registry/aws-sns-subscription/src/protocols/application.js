/* eslint-disable no-console */

const { subscribe, unsubscribe } = require('./lib')

const deploy = async ({ topic, protocol, endpoint }, context) => {
  const { SubscriptionArn } = await subscribe({ topic, protocol, endpoint }, context)
  return { subscriptionArn: SubscriptionArn }
}

const remove = async (context) => unsubscribe(context)

module.exports = {
  deploy,
  remove,
  types: ['application']
}
