const AWS = require('aws-sdk')
const pack = require('./pack')

const lambda = new AWS.Lambda({ region: 'us-east-1' })

const createLambda = async ({
  name, handler, memory, timeout, env, description, root
}, role) => {
  const pkg = await pack(root)

  const params = {
    FunctionName: name,
    Code: {
      ZipFile: pkg
    },
    Description: description,
    Handler: handler,
    MemorySize: memory,
    Publish: true,
    Role: role.arn,
    Runtime: 'nodejs6.10',
    Timeout: timeout,
    Environment: {
      Variables: env
    }
  }

  const res = await lambda.createFunction(params).promise()
  return {
    arn: res.FunctionArn,
    roleArn: role.arn
  }
}

const updateLambda = async ({
  name, handler, memory, timeout, env, description, root
}, role) => {
  const pkg = await pack(root)
  const functionCodeParams = {
    FunctionName: name,
    ZipFile: pkg,
    Publish: true
  }

  const functionConfigParams = {
    FunctionName: name,
    Description: description,
    Handler: handler,
    MemorySize: memory,
    Role: role.arn,
    Runtime: 'nodejs6.10',
    Timeout: timeout,
    Environment: {
      Variables: env
    }
  }

  await lambda.updateFunctionCode(functionCodeParams).promise()
  const res = await lambda.updateFunctionConfiguration(functionConfigParams).promise()

  return {
    arn: res.FunctionArn,
    roleArn: role.arn
  }
}

const deleteLambda = async (name) => {
  const params = {
    FunctionName: name
  }

  await lambda.deleteFunction(params).promise()
  return {
    arn: null
  }
}

const deploy = async (inputs, context) => {
  const componentData = context.utils.compareInputsToState(inputs, context.state)
  const inputsChanged = !componentData.isEqual
  const defaultOutputs = { ...inputs, ...context.state }

  let outputs = {}
  const configuredRole = inputs.role
  let { defaultRole } = context.state

  const defaultRoleComponent = await context.load('aws-iam-role', 'defaultRole', {
    name: `${inputs.name}-execution-role`,
    service: 'lambda.amazonaws.com'
  })

  if (!configuredRole && !defaultRole) {
    defaultRole = await defaultRoleComponent.deploy()
  }

  const role = configuredRole || defaultRole

  // /* No state found, run create flow */
  if (!componentData.hasState) {
    context.log(`Creating Lambda: ${inputs.name}`)
    const lambdaOutput = await createLambda(inputs, role)
    const createOutputs = { ...inputs, ...lambdaOutput, defaultRole }
    context.saveState(createOutputs)
    return createOutputs
  }

  /* Has state, run update flow if inputsChanged */
  if (inputsChanged) {
    // If critical property 'name' changed, destroy and recreate new function
    if (componentData.keys.includes('name')) {
      context.log(`Removing Lambda: ${context.state.name}`)
      await deleteLambda(context.state.name)
      context.log(`Creating Lambda: ${inputs.name}`)
      const lambdaOutput = await createLambda(inputs, role)
      const createOutputs = { ...inputs, ...lambdaOutput, defaultRole }
      context.saveState(createOutputs)
      return outputs
    }

    // run normal update flow
    context.log(`Updating Lambda: ${inputs.name}`)
    outputs = await updateLambda(inputs, role)
  }

  if (configuredRole && defaultRole) {
    await defaultRoleComponent.remove()
    defaultRole = null
  }

  context.saveState({
    ...inputs,
    ...outputs,
    defaultRole
  })
  return outputs
}

const remove = async (inputs, context) => {
  if (!context.state.name) return { arn: null }

  if (context.state.defaultRole) {
    const defaultRoleComponent = await context.load('aws-iam-role', 'defaultRole', {
      name: context.state.defaultRole.name,
      service: context.state.defaultRole.service
    })
    await defaultRoleComponent.remove()
  }

  context.log(`Removing Lambda: ${context.state.name}`)
  const outputs = await deleteLambda(context.state.name)
  context.saveState()
  return outputs
}

module.exports = {
  deploy,
  remove
}
