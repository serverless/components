/* eslint-disable no-console */

const { subscribe, unsubscribe } = require('./lib')

const deploy = async (instance, context) => {
  const { SubscriptionArn } = await subscribe(instance, context)
  return { subscriptionArn: SubscriptionArn }
}

const remove = async (instance, context) => unsubscribe(instance, context)

module.exports = {
  deploy,
  remove,
  types: ['application']
}
