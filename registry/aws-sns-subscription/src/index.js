/* eslint-disable no-console */

const { getProtocol } = require('./protocols')
const { setSubscriptionAttributes } = require('./protocols/lib')
const { concat, contains, equals, head, keys, map, merge, reduce, slice, values } = require('ramda')

const capitalize = (string) => `${head(string).toUpperCase()}${slice(1, Infinity, string)}`

const concatSubscriptionAttributes = (inputs, state = {}) =>
  concat(
    // inputs subscriptionAttributes as array
    map((key) => ({ [key]: inputs[key] }), keys(inputs)),
    // state subscriptionAttributes as array with removed items
    reduce(
      (attributes, key) => {
        if (!contains(key, keys(inputs))) {
          // return empty object to "unset" removed value
          return concat(attributes, [{ [key]: {} }])
        }
        return attributes
      },
      [],
      keys(state)
    )
  )

const setAllSubscriptionAttributes = async (subscriptionArn, inputs, context) => {
  const inputsAndState = concatSubscriptionAttributes(
    inputs.subscriptionAttributes,
    context.state.subscriptionAttributes
  )

  return Promise.all(
    map((item) => {
      const key = head(keys(item))
      const value = head(values(item))
      const params = {
        subscriptionArn: subscriptionArn,
        attributeName: capitalize(key),
        attributeValue: value
      }
      const stateAttribute = context.state.subscriptionAttributes
        ? context.state.subscriptionAttributes[key]
        : {}
      if (equals(value, stateAttribute)) {
        return Promise.resolve()
      }
      return setSubscriptionAttributes(params, context)
    }, inputsAndState)
  )
}

const deploy = async (inputs, context) => {
  const { state } = context
  if (
    (state.topic && inputs.topic !== state.topic) ||
    (state.protocol && inputs.protocol !== state.protocol)
  ) {
    await remove(inputs, context)
  }

  let newState = state
  if (
    !state ||
    !state.topic ||
    ((state.topic && inputs.topic !== state.topic) ||
      (state.protocol && inputs.protocol !== state.protocol))
  ) {
    newState = await getProtocol(inputs.protocol).deploy(inputs, context)
  }

  await setAllSubscriptionAttributes(newState.subscriptionArn, inputs, context)

  context.saveState(merge(newState, inputs))

  context.setOutputs({
    arn: newState.subscriptionArn
  })
  return {
    arn: newState.subscriptionArn
  }
}

const remove = async (inputs, context) => {
  const { state } = context
  await getProtocol(state.protocol).remove(context)
  context.saveState({})
  context.setOutputs({})
  return {}
}

module.exports = {
  deploy,
  remove
}
