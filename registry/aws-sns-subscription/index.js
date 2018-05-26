/* eslint-disable no-console */

const { getProtocol } = require('./protocols')
const { merge } = require('ramda')

const deploy = async (inputs, context) => {
  const { state } = context
  if (
    (state.topic && inputs.topic !== state.topic) ||
    (state.protocol && inputs.protocol !== state.protocol)
  ) {
    await remove(inputs, context)
  }
  const newState = await getProtocol(inputs.protocol).deploy(inputs, context)
  context.saveState(merge(newState, inputs))
  return {
    arn: newState.subscriptionArn
  }
}

const remove = async (inputs, context) => {
  const { state } = context
  // pass context to remove lambda subscription instead vars
  await getProtocol(context.state.protocol).remove(
    {
      subscriptionArn: state.subscriptionArn,
      functionName: state.statement ? state.statement.Resource : '',
      statementId: state.statement ? state.statement.Sid : ''
    },
    context
  )

  context.saveState({})
  return {}
}

module.exports = {
  deploy,
  remove
}
