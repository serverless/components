import { find, isEmpty, isNil, whereEq } from '@serverless/utils'

const subscribe = async ({ provider, topic, protocol, endpoint }, context) => {
  const SDK = provider.getSdk()
  const sns = new SDK.SNS()
  context.log(`Creating a SNS subcription to topic '${topic}'`)
  const response = await sns
    .subscribe({
      TopicArn: topic,
      Protocol: protocol,
      Endpoint: endpoint
    })
    .promise()
  context.log(`SNS subcription '${response.SubscriptionArn}' to topic '${topic}' created`)
  return response
}

const unsubscribe = async ({ provider, subscriptionArn }, context) => {
  const SDK = provider.getSdk()
  const sns = new SDK.SNS()
  context.log(`Removing the SNS Subscription '${subscriptionArn}'`)
  const response = await sns
    .unsubscribe({
      SubscriptionArn: subscriptionArn
    })
    .promise()
  context.log(`SNS subcription '${subscriptionArn}' removed`)
  return response
}

const setSubscriptionAttributes = async (
  { provider, subscriptionArn, attributeName, attributeValue },
  context
) => {
  const SDK = provider.getSdk()
  const sns = new SDK.SNS()
  if (isEmpty(attributeValue)) {
    context.log(
      `Removing SNS Subscription Attribute '${attributeName}' from subscription ${subscriptionArn}`
    )
  } else {
    context.log(
      `Setting SNS Subscription Attribute '${attributeName}' to subscription ${subscriptionArn}`
    )
  }
  try {
    const response = await sns
      .setSubscriptionAttributes({
        AttributeName: attributeName,
        SubscriptionArn: subscriptionArn,
        AttributeValue:
          typeof attributeValue === 'string' ? attributeValue : JSON.stringify(attributeValue)
      })
      .promise()
    return response
  } catch (error) {
    if (!error.message.includes('does not support raw message delivery')) {
      // raw message delivery is only supported in http/s and SQS protocols
      // this will suppress the error if RawMessageDelivery is defined
      throw error
    }
  }
}

const waitForConfirmation = async (
  { provider, topic, protocol, endpoint },
  interval = 5000,
  timeout = 60000
) =>
  new Promise((resolve, reject) => {
    const SDK = provider.getSdk()
    const sns = SDK.SNS()
    const startTime = Date.now()
    // TODO BRN: Move this poller functionality to utils.
    // TODO BRN: This poller has a flaw where the duration of the call to the API could last longer than the interval. It should instead wait until the previous call is complete before executing the next call.
    const pollInterval = setInterval(async () => {
      if (Date.now() - startTime > timeout) {
        clearInterval(pollInterval)
        return reject('Confirmation timed out')
      }
      const subscriptions = await sns
        .listSubscriptionsByTopic({
          TopicArn: topic
        })
        .promise()
      // topic can have only one subscription with same protocol and endpoint
      const created = find(whereEq({ Protocol: protocol, Endpoint: endpoint }))(
        subscriptions.Subscriptions
      )
      if (
        !isNil(created) &&
        (created.SubscriptionArn !== 'pending confirmation' &&
          created.SubscriptionArn !== 'PendingConfirmation')
      ) {
        clearInterval(pollInterval)
        return resolve({ subscriptionArn: created.SubscriptionArn })
      }
    }, interval)
  })

function splitArn(arnToSplit) {
  const [arn, partition, service, region, accountId, ...resources] = arnToSplit.split(':')
  let resourceType
  let resource

  if (resources.length === 1 && resources[0].includes('/')) {
    const split = resources[0].split('/')
    resourceType = split[0]
    resource = split[1]
  } else if (resources.length === 1) {
    resource = resources[0]
  } else {
    resourceType = resources[0]
    resource = resources[1]
  }
  return {
    arn,
    partition,
    service,
    region,
    accountId,
    resourceType,
    resource
  }
}

export { subscribe, unsubscribe, setSubscriptionAttributes, waitForConfirmation, splitArn }
