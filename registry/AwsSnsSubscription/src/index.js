import { getProtocol } from './protocols'
import { setSubscriptionAttributes } from './protocols/lib'
import {
  concat,
  contains,
  equals,
  head,
  keys,
  map,
  reduce,
  slice,
  values,
  resolvable,
  or,
  pick,
  not,
  get
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
    inputs.subscriptionAttributes || {},
    context.state.subscriptionAttributes || {}
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

const AwsSnsSubscription = (SuperClass) =>
  class extends SuperClass {
    async construct(inputs, context) {
      await super.construct(inputs, context)

      this.provider = resolvable(() => or(inputs.provider, context.get('provider')))
      this.topic = inputs.topic
      this.protocol = resolvable(() => or(inputs.protocol, 'https'))
      this.endpoint = inputs.endpoint
      this.subscriptionAttributes = inputs.subscriptionAttributes
    }

    shouldDeploy(prevInstance) {
      if (!prevInstance) {
        return 'deploy'
      }
      const inputs = {
        topic: this.topic,
        protocol: this.protocol,
        endpoint: this.endpoint,
        subscriptionAttributes: this.subscriptionAttributes
      }
      const prevInputs = prevInstance ? pick(keys(inputs), prevInstance) : {}
      const configChanged = not(equals(inputs, prevInputs))
      if (
        not(equals(prevInstance.protocol, inputs.protocol)) ||
        not(equals(prevInstance.topic, inputs.topic))
      ) {
        return 'replace'
      } else if (configChanged) {
        return 'deploy'
      }

      return undefined
    }

    hydrate(prevInstance = {}) {
      super.hydrate(prevInstance)
      this.subscriptionArn = get('subscriptionArn', prevInstance)
      this.statement = get('statement', prevInstance)
    }

    async deploy(prevInstance, context) {
      const outputs = await getProtocol(this.protocol).deploy(this, context)
      await setAllSubscriptionAttributes(outputs.subscriptionArn, this, context)
      Object.assign(this, outputs)
    }

    async remove(context) {
      try {
        const res = await getProtocol(this.protocol).remove(this, context)
        return res
      } catch (error) {
        if (error.code !== 'NotFound') {
          throw error.message
        }
      }
    }

    async info() {
      return {
        title: this.protocol,
        type: this.name,
        data: {
          arn: this.subscriptionArn,
          topic: this.topic,
          protocol: this.protocol,
          endpoint: this.endpoint
        }
      }
    }
  }

export default AwsSnsSubscription
