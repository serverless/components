const AWS = require('aws-sdk')
const lambda = new AWS.Lambda({ region: 'us-east-1' })

const createLambda = async ({ name, handler, memory, timeout, env, description, role }, pack) => {
  const pkg = await pack()

  const params = {
    FunctionName: name,
    Code: {
      ZipFile: pkg
    },
    Description: description,
    Handler: handler,
    MemorySize: memory,
    Publish: true,
    Role: role,
    Runtime: 'nodejs6.10',
    Timeout: timeout,
    Environment: {
      Variables: env
    }
  }

  const res = await lambda.createFunction(params).promise()
  return {
    arn: res.FunctionArn
  }
}

const updateLambda = async ({ name, handler, memory, timeout, env, description }, pack) => {
  const pkg = await pack()
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
    Runtime: 'nodejs6.10',
    Timeout: timeout,
    Environment: {
      Variables: env
    }
  }

  await lambda.updateFunctionCode(functionCodeParams).promise()
  const res = await lambda.updateFunctionConfiguration(functionConfigParams).promise()

  return {
    arn: res.FunctionArn
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

const deploy = async (inputs, state, context) => {
  let outputs
  if (inputs.name && !state.name) {
    context.cli.log(`Creating Lambda: ${inputs.name}`)
    outputs = await createLambda(inputs, context.pack)
  } else if (state.name && !inputs.name) {
    context.cli.log(`Removing Lambda: ${state.name}`)
    outputs = await deleteLambda(state.name)
  } else if (inputs.name !== state.name) {
    context.cli.log(`Removing Lambda: ${state.name}`)
    await deleteLambda(state.name)
    context.cli.log(`Creating Lambda: ${inputs.name}`)
    outputs = await createLambda(inputs, context.pack)
  } else {
    context.cli.log(`Updating Lambda: ${inputs.name}`)
    outputs = await updateLambda(inputs, context.pack)
  }
  return outputs
}

const remove = async (inputs, state, context) => {
  context.cli.log(`Removing Lambda: ${state.name}`)
  const outputs = await deleteLambda(state.name)
  return outputs
}

module.exports = {
  deploy,
  remove
}
