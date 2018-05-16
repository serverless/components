const AWS = require('aws-sdk')
const pack = require('./pack')

const lambda = new AWS.Lambda({ region: 'us-east-1' })

async function createLambda(
  { name, handler, memory, timeout, runtime, env, description, root },
  role
) {
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
    Runtime: runtime,
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

async function updateLambda(
  { name, handler, memory, timeout, runtime, env, description, root },
  role
) {
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
    Runtime: runtime,
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

async function deleteLambda(name) {
  const params = {
    FunctionName: name
  }

  await lambda.deleteFunction(params).promise()
  return {
    arn: null
  }
}

async function deploy(inputs, context) {
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

  if (inputs.name && !context.state.name) {
    context.log(`Creating Lambda: ${inputs.name}`)
    outputs = await createLambda(inputs, role)
  } else if (context.state.name && !inputs.name) {
    context.log(`Removing Lambda: ${context.state.name}`)
    outputs = await deleteLambda(context.state.name)
  } else if (inputs.name !== context.state.name) {
    context.log(`Removing Lambda: ${context.state.name}`)
    await deleteLambda(context.state.name)
    context.log(`Creating Lambda: ${inputs.name}`)
    outputs = await createLambda(inputs, role)
  } else {
    context.log(`Updating Lambda: ${inputs.name}`)
    outputs = await updateLambda(inputs, role)
  }

  if (configuredRole && defaultRole) {
    await defaultRoleComponent.remove()
    defaultRole = null
  }

  context.saveState({ ...inputs, ...outputs, defaultRole })
  return outputs
}

async function remove(inputs, context) {
  if (!context.state.name) return { arn: null }

  if (context.state.defaultRole) {
    const defaultRoleComponent = await context.load('aws-iam-role', 'defaultRole', {
      name: context.state.defaultRole.name,
      service: context.state.defaultRole.service
    })
    await defaultRoleComponent.remove()
  }

  context.log(`Removing Lambda: ${context.state.name}`)
  const outputs = {
    arn: null
  }
  try {
    await deleteLambda(context.state.name)
  } catch (error) {
    if (!error.message.includes('Function not found')) {
      throw new Error(error)
    }
  }
  context.saveState(outputs)
  return outputs
}

module.exports = {
  deploy,
  remove
}
