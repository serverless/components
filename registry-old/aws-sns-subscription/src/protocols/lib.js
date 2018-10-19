/* eslint-disable no-console */

const AWS = require('aws-sdk')
const { find, isEmpty, isNil, whereEq } = require('ramda')

const sns = new AWS.SNS({ region: process.env.AWS_DEFAULT_REGION || 'us-east-1' })

const subscribe = async ({ topic, protocol, endpoint }, context) => {
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

const unsubscribe = async (context) => {
  const { state } = context
  context.log(`Removing the SNS Subscription '${state.subscriptionArn}'`)
  const response = await sns
    .unsubscribe({
      SubscriptionArn: state.subscriptionArn
    })
    .promise()
  context.log(`SNS subcription '${state.subscriptionArn}' removed`)
  return response
}

const setSubscriptionAttributes = async (
  { subscriptionArn, attributeName, attributeValue },
  context
) => {
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
  { topic, protocol, endpoint },
  interval = 5000,
  timeout = 60000
) =>
  new Promise((resolve, reject) => {
    const startTime = Date.now()
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

module.exports = {
  subscribe,
  unsubscribe,
  setSubscriptionAttributes,
  waitForConfirmation,
  splitArn
}
