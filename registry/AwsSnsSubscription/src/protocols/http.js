import { subscribe, unsubscribe, waitForConfirmation } from './lib'

const deploy = async ({ provider, topic, protocol, endpoint }, context) =>
  new Promise((resolve) => {
    subscribe({ provider, topic, protocol, endpoint }, context).then(async (response) => {
      if (response.SubscriptionArn === 'pending confirmation') {
        context.log(
          `SNS subscription to topic '${topic}' is pending confirmation, more info https://docs.aws.amazon.com/sns/latest/dg/SendMessageToHttp.html`
        )
        const confirmationResponse = await waitForConfirmation(
          { provider, topic, protocol, endpoint },
          2000
        )
        context.log(
          `SNS subscription to the topic '${topic}' with '${
            confirmationResponse.subscriptionArn
          }' confirmed`
        )
        resolve(confirmationResponse)
      } else {
        resolve({ subscriptionArn: response.SubscriptionArn })
      }
    })
  })

const remove = async (instance, context) => unsubscribe(instance, context)
const types = ['http', 'https']

export { deploy, remove, types }
