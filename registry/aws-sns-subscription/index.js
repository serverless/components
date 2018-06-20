/* eslint-disable no-console */

const { getProtocol } = require('./protocols')
const { merge } = require('ramda')

const contextSetOutputs = (context) => {
  context.setOutputs = (output) => {
    console.warn('*** temp setout', output)
    return output // dummy output remove after PR #223
  }
}

const deploy = async (inputs, context) => {
  contextSetOutputs(context) // REMOVE
  const { state } = context
  if (
    (state.topic && inputs.topic !== state.topic) ||
    (state.protocol && inputs.protocol !== state.protocol)
  ) {
    await remove(inputs, context)
  }
  const newState = await getProtocol(inputs.protocol).deploy(inputs, context)
  context.saveState(merge(newState, inputs))
  return context.setOutputs({
    arn: newState.subscriptionArn
  })
}

const remove = async (inputs, context) => {
  const { state } = context
  // pass context to remove lambda subscription instead vars
  await getProtocol(state.protocol).remove(context)
  context.saveState({})
  return context.setOutputs({})
}

module.exports = {
  deploy,
  remove
}
