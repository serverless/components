import { subscribe, unsubscribe } from './lib'

const deploy = async ({ provider, topic, protocol, endpoint }, context) => {
  const { SubscriptionArn } = await subscribe({ provider, topic, protocol, endpoint }, context)
  return { subscriptionArn: SubscriptionArn }
}

const remove = async (instance, context) => unsubscribe(instance, context)

const types = ['sms']

export { deploy, remove, types }
