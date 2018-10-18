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

const DEPLOY = 'deploy'
const REPLACE = 'replace'

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
      if (head(values(value))) {
        return concat(result, [value])
      }
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
  shouldDeploy(prevInstance) {
    if (!prevInstance) {
      return DEPLOY
    }
    if (prevInstance.name !== this.name || prevInstance.policy !== this.policy) {
      return REPLACE
    }
  },

  async deploy(prevInstance, context) {
    const sns = new this.provider.getSdk().SNS()

    if (prevInstance && prevInstance.name === this.name) {
      return merge(
        await updateAttributes(merge({ topicArn: prevInstance.topicArn }, this), prevInstance),
        {
          name: this.name,
          topicArn: prevInstance.topicArn
        }
      )
    }
    return createSNSTopic(sns, this, context)
  },

  async remove(prevInstance, context) {
    const sns = new this.provider.getSdk().SNS()
    context.log(`Removing SNS topic: '${this.name}'`)
    await removeSNSTopic(sns, this)
    context.log(`SNS topic '${this.name}' removed.`)
  }
}

export default AwsSnsTopic
