import { subscribe, unsubscribe } from './lib'

const deploy = async (instance, context) => {
  const { SubscriptionArn } = await subscribe(instance, context)
  return { subscriptionArn: SubscriptionArn }
}

const remove = async (instance, context) => unsubscribe(instance, context)
const types = ['application']

module.exports = {
  deploy,
  remove,
  types
}
