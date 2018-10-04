import { getProtocol } from './protocols'
import { setSubscriptionAttributes } from './protocols/lib'
import {
  concat,
  contains,
  equals,
  head,
  keys,
  map,
  merge,
  reduce,
  slice,
  values
} from '@serverless/utils'

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

const AwsSnsSubscription = {
  async deploy(prevInstance, context) {
    const state = context.getState(this)
    if (
      (state.topic && this.topic !== state.topic) ||
      (state.protocol && this.protocol !== state.protocol)
    ) {
      await this.remove(prevInstance, context)
    }

    let newState = state
    if (
      !state ||
      !state.topic ||
      ((state.topic && this.topic !== state.topic) ||
        (state.protocol && this.protocol !== state.protocol))
    ) {
      newState = await getProtocol(this.protocol).deploy(this, context)
    }

    await setAllSubscriptionAttributes(newState.subscriptionArn, this, context)

    context.saveState(this, merge(newState, this))
  },
  async remove(prevInstance, context) {
    const state = context.getState(this)
    await getProtocol(state.protocol).remove(context)
    context.saveState(this, {})
  }
}

export default AwsSnsSubscription
