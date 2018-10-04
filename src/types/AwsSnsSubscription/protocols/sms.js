/* eslint-disable no-console */

const { subscribe, unsubscribe } = require('./lib')

const deploy = async ({ provider, topic, protocol, endpoint }, context) => {
  const { SubscriptionArn } = await subscribe({ provider, topic, protocol, endpoint }, context)
  return { subscriptionArn: SubscriptionArn }
}

const remove = async (instance, context) => unsubscribe(instance, context)

module.exports = {
  deploy,
  remove,
  types: ['sms']
}
