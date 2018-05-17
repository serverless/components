/* eslint-disable no-console */

const AWS = require('aws-sdk')

const sns = new AWS.SNS({ region: 'us-east-1' })

const capitalize = (string) => `${string.charAt(0).toUpperCase()}${string.slice(1)}`

const createSNSTopic = async ({ name, displayName, policy, deliveryPolicy }, context) => {
  context.log(`Creating SNS topic: '${name}'`)
  const { TopicArn: topicArn } = await sns.createTopic({ Name: name }).promise()
  // save topic if attribute update fails
  context.saveState({ name, topicArn })
  const topicAttributes = await updateTopicAttributes({
    displayName,
    policy,
    deliveryPolicy,
    topicArn
  })
  return Object.assign({ topicArn, name }, topicAttributes)
}

const updateTopicAttributes = async ({ displayName, policy, deliveryPolicy, topicArn }) => {
  const topicAttributes = [{ displayName }, { policy }, { deliveryPolicy }].reduce(
    (result, value) => {
      if (Object.values(value)[0]) return [].concat(result, value)
      return result
    },
    []
  )
  await Promise.all(
    topicAttributes.map((topicAttribute) => {
      const value = Object.values(topicAttribute)[0]
      return sns
        .setTopicAttributes({
          TopicArn: topicArn,
          AttributeName: capitalize(Object.keys(topicAttribute)[0]),
          AttributeValue: typeof value !== 'string' ? JSON.stringify(value) : value
        })
        .promise()
    })
  )
  return topicAttributes.reduce((result, value) => {
    return Object.assign({ [Object.keys(value)[0]]: Object.values(value)[0] }, result)
  }, {})
}

const removeSNSTopic = async ({ topicArn }) =>
  sns
    .deleteTopic({
      TopicArn: topicArn
    })
    .promise()

const remove = async (inputs, context) => {
  context.log(`Removing SNS topic: '${context.state.name}'`)
  await removeSNSTopic(context.state)
  context.saveState({})
  return {
    arn: null
  }
}

const deploy = async (inputs, context) => {
  const { state } = context
  let newState
  if (!state.name && inputs.name) {
    // if no name stored to state, create a new topic
    newState = await createSNSTopic(inputs, context)
  } else if (state.name && state.name === inputs.name) {
    // if input name and state name is same, update only topic attributes
    context.log(`Updating SNS topic: '${inputs.name}'`)
    newState = Object.assign(
      await updateTopicAttributes(Object.assign({ topicArn: state.topicArn }, inputs)),
      { name: inputs.name, topicArn: state.topicArn }
    )
  } else {
    // topic name is changes, first remove the old topic then create a new one
    await remove(state, context)
    newState = await createSNSTopic(inputs, context)
  }

  context.saveState(newState)

  return {
    arn: newState.topicArn
  }
}

module.exports = {
  deploy,
  remove
}
