const AWS = require('aws-sdk')
const stepfunctions = new AWS.StepFunctions({
  region: process.env.AWS_DEFAULT_REGION || 'us-east-1'
})

const updateStateMachine = async (inputs, { stateMachineArn }) => {
  const params = {
    stateMachineArn,
    definition: JSON.stringify(inputs.definition, null, 2),
    roleArn: inputs.roleArn
  }
  const data = await stepfunctions.updateStateMachine(params).promise()
  return data
}

const updateComponent = async (inputs, context) => {
  try {
    const { state } = context
    await updateStateMachine(inputs, state)
    context.log(`Step function state machine: '${inputs.name}' updated`)
    const output = { stateMachineArn: state.stateMachineArn, name: inputs.name }
    context.saveState(output)
    return output
  } catch (e) {
    throw new Error(e)
  }
}

const createStateMachine = async (inputs) => {
  const params = {
    name: inputs.name,
    definition: JSON.stringify(inputs.definition, null, 2),
    roleArn: inputs.roleArn
  }
  return stepfunctions.createStateMachine(params).promise()
}

const createComponent = async (inputs, context) => {
  context.log(`Creating step function state machine: '${inputs.name}'`)
  const { stateMachineArn } = await createStateMachine(inputs)
  context.log(`Step function state machine: '${inputs.name}' created`)
  const output = { stateMachineArn, name: inputs.name }
  context.saveState(output)
  return output
}

const deploy = async (inputs, context) => {
  const { state } = context
  const isNewComponent = (!state.name && inputs.name) || state.name !== inputs.name
  const isTheSameName = state.name && inputs.name && inputs.name === state.name
  if (isNewComponent) {
    return createComponent(inputs, context)
  }
  if (isTheSameName) {
    //if input and state name is the same - update only state machine
    return updateComponent(inputs, context)
  }
}

const deleteStateMachine = async ({ stateMachineArn }) => {
  try {
    await stepfunctions.deleteStateMachine({ stateMachineArn }).promise()
  } catch (e) {
    throw new Error(e)
  }
}

const remove = async (inputs, context) => {
  context.log(`Deleting state machine: '${context.state.name}'`)
  await deleteStateMachine(context.state)
  context.log(`State Machine '${context.state.name}' deleted.`)
  context.saveState({})
  return {
    stateMachineArn: null,
    name: null
  }
}

module.exports = {
  deploy,
  remove
}
