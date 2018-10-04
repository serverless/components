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
} = require('@serverless/utils')

const capitalize = (string) => `${string.charAt(0).toUpperCase()}${string.slice(1)}`
const resolveInSequence = async (functionsToExecute) =>
  reduce(
    (promise, functionToExecute) =>
      promise.then((result) => functionToExecute().then(Array.prototype.concat.bind(result))),
    Promise.resolve([]),
    functionsToExecute
  )

const createSNSTopic = async (
  sns,
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

const updateTopicAttributes = async (sns, { topicAttributes, topicArn }) =>
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

const updateDeliveryStatusAttributes = async (sns, { deliveryStatusAttributes, topicArn }) =>
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

const removeSNSTopic = async (sns, topicArn) =>
  sns
    .deleteTopic({
      TopicArn: topicArn
    })
    .promise()

const AwsSnsTopic = {
  async deploy(prevInstance, context) {
    const sns = new this.provider.getSdk().SNS()
    const state = context.getState(this)
    let newState

    if (!state.name && this.name) {
      // if no name stored to state, create a new topic
      newState = await createSNSTopic(sns, this, context)
      context.log(`SNS topic '${newState.name}' created with arn: '${newState.topicArn}'`)
    } else if (state.name && state.name === this.name) {
      // if input name and state name is same, update only topic attributes
      if (state.policy && !this.policy) {
        context.log(`To remove the SNS topic '${this.name}' policy, the topic has to be recreated`)
        await this.remove(prevInstance, context)
        newState = await createSNSTopic(sns, this, context)
      } else {
        context.log(`Updating SNS topic: '${this.name}'`)
        newState = merge(await updateAttributes(merge({ topicArn: state.topicArn }, this), state), {
          name: this.name,
          topicArn: state.topicArn
        })
      }
      context.log(`SNS topic '${newState.name}' updated`)
    } else {
      // topic name is changes, first remove the old topic then create a new one
      await this.remove(prevInstance, context)
      newState = await createSNSTopic(sns, this, context)
      context.log(`SNS topic '${prevInstance.name} renamed to '${newState.name}'`)
    }

    context.saveState(this, newState)
  },
  async remove(prevInstance, context) {
    const sns = new this.provider.getSdk().SNS()
    const state = context.getState(this)
    context.log(`Removing SNS topic: '${state.name}'`)
    await removeSNSTopic(sns, state)
    context.log(`SNS topic '${state.name}' removed.`)
    context.saveState(this, {})
  }
}

export default AwsSnsTopic
