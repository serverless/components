/* eslint-disable no-console */

const { subscribe, unsubscribe, waitForConfirmation } = require('./lib')

const deploy = async ({ topic, protocol, endpoint }, context) =>
  new Promise((resolve) => {
    subscribe({ topic, protocol, endpoint }, context).then(async (response) => {
      if (response.SubscriptionArn === 'pending confirmation') {
        context.log(
          `SNS subscription to topic '${topic}' is pending confirmation, more info https://docs.aws.amazon.com/sns/latest/dg/SendMessageToHttp.html`
        )
        const confirmationResponse = await waitForConfirmation({ topic, protocol, endpoint }, 2000)
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

const remove = async (context) => unsubscribe(context)

module.exports = {
  deploy,
  remove,
  types: ['http', 'https']
}
