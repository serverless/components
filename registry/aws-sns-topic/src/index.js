/* eslint-disable no-console */

const AWS = require('aws-sdk')
const {
  concat,
  contains,
  equals,
  filter,
  find,
  head,
  isNil,
  keys,
  map,
  merge,
  reduce,
  values
} = require('ramda')

const sns = new AWS.SNS({ region: process.env.AWS_DEFAULT_REGION || 'us-east-1' })

const capitalize = (string) => `${string.charAt(0).toUpperCase()}${string.slice(1)}`
const resolveInSequence = async (functionsToExecute) =>
  reduce(
    (promise, functionToExecute) =>
      promise.then((result) => functionToExecute().then(Array.prototype.concat.bind(result))),
    Promise.resolve([]),
    functionsToExecute
  )

const createSNSTopic = async (
  { name, displayName, policy, deliveryPolicy, deliveryStatusAttributes },
  context
) => {
  context.log(`Creating SNS topic: '${name}'`)
  const { TopicArn: topicArn } = await sns.createTopic({ Name: name }).promise()
  // save topic if attribute update fails
  context.saveState({ name, topicArn })
  const topicAttributes = await updateAttributes(
    {
      displayName,
      policy,
      deliveryPolicy,
      deliveryStatusAttributes,
      topicArn
    },
    {}
  )
  return merge({ topicArn, name }, topicAttributes)
}

const concatInputsAndState = (inputs, state = []) => {
  const attributeKeys = map((item) => head(keys(item)), inputs)
  return filter((item) => isNil(find(equals(item))(state)))(
    concat(
      inputs,
      reduce(
        (attributes, attribute) => {
          const key = head(keys(attribute))
          if (!contains(key, attributeKeys)) {
            // return empty string to "unset" removed value
            return concat(attributes, [{ [key]: '' }])
          }
          return attributes
        },
        [],
        state
      )
    )
  )
}

const updateAttributes = async (
  { displayName, policy, deliveryPolicy, deliveryStatusAttributes = [], topicArn },
  state
) => {
  const topicAttributes = reduce(
    (result, value) => {
      if (head(values(value))) return concat(result, [value])
      return result
    },
    [],
    [{ displayName }, { policy }, { deliveryPolicy }]
  )

  const stateTopicAttributes = filter((item) => !isNil(head(values(item))))([
    { displayName: state.displayName },
    { policy: state.policy },
    { deliveryPolicy: state.deliveryPolicy }
  ])

  // combine inputs and check if something is removed
  const topicAttributesToUpdate = concatInputsAndState(topicAttributes, stateTopicAttributes)

  await updateTopicAttributes({ topicAttributes: topicAttributesToUpdate, topicArn })

  // flatten delivery status attributes array
  const flatDeliveryStatusAttributes = reduce(
    (result, attribute) =>
      concat(result, map((key) => ({ [key]: attribute[key] }), keys(attribute))),
    [],
    deliveryStatusAttributes
  )

  // combine inputs and check if something is removed and select only ones that differs in state and inputs
  const deliveryStatusAttributesToUpdate = concatInputsAndState(
    flatDeliveryStatusAttributes,
    state.deliveryStatusAttributes
  )

  // update delivery status attributes
  await updateDeliveryStatusAttributes({
    deliveryStatusAttributes: deliveryStatusAttributesToUpdate,
    topicArn
  })

  return merge(
    reduce(
      (result, value) => merge({ [head(keys(value))]: head(values(value)) }, result),
      {},
      topicAttributes
    ),
    { deliveryStatusAttributes: flatDeliveryStatusAttributes }
  )
}

const updateTopicAttributes = async ({ topicAttributes, topicArn }) =>
  Promise.all(
    map((topicAttribute) => {
      const value = head(values(topicAttribute))
      const params = {
        TopicArn: topicArn,
        AttributeName: capitalize(head(keys(topicAttribute))),
        AttributeValue: typeof value !== 'string' ? JSON.stringify(value) : value
      }
      return sns.setTopicAttributes(params).promise()
    }, topicAttributes)
  )

const updateDeliveryStatusAttributes = async ({ deliveryStatusAttributes, topicArn }) =>
  // run update requests sequentially because setTopicAttributes
  // fails to update when rate exceeds https://github.com/serverless/components/issues/174#issuecomment-390463523
  resolveInSequence(
    map(
      (topicAttribute) => () => {
        const value = head(values(topicAttribute))
        const params = {
          TopicArn: topicArn,
          AttributeName: capitalize(head(keys(topicAttribute))),
          AttributeValue: typeof value !== 'string' ? JSON.stringify(value) : value
        }
        return sns.setTopicAttributes(params).promise()
      },
      deliveryStatusAttributes
    )
  )

const removeSNSTopic = async ({ topicArn }) =>
  sns
    .deleteTopic({
      TopicArn: topicArn
    })
    .promise()

const remove = async (inputs, context) => {
  context.log(`Removing SNS topic: '${context.state.name}'`)
  await removeSNSTopic(context.state)
  context.log(`SNS topic '${context.state.name}' removed.`)
  context.saveState({})
  return {
    arn: null
  }
}

const deploy = async (inputs, context) => {
  const { state } = context
  let newState
  context.setOutputs({
    arn: null
  })

  if (!state.name && inputs.name) {
    // if no name stored to state, create a new topic
    newState = await createSNSTopic(inputs, context)
    context.log(`SNS topic '${newState.name}' created with arn: '${newState.topicArn}'`)
  } else if (state.name && state.name === inputs.name) {
    // if input name and state name is same, update only topic attributes
    if (state.policy && !inputs.policy) {
      context.log(`To remove the SNS topic '${inputs.name}' policy, the topic has to be recreated`)
      await remove(state, context)
      newState = await createSNSTopic(inputs, context)
    } else {
      context.log(`Updating SNS topic: '${inputs.name}'`)
      newState = merge(await updateAttributes(merge({ topicArn: state.topicArn }, inputs), state), {
        name: inputs.name,
        topicArn: state.topicArn
      })
    }
    context.log(`SNS topic '${newState.name}' updated`)
  } else {
    // topic name is changes, first remove the old topic then create a new one
    await remove(state, context)
    newState = await createSNSTopic(inputs, context)
    context.log(`SNS topic '${state.name} renamed to '${newState.name}'`)
  }

  context.saveState(newState)

  return context.setOutputs({
    arn: newState.topicArn
  })
}

module.exports = {
  deploy,
  remove
}
