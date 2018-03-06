const AWS = require('aws-sdk')
const pack = require('./pack')

const lambda = new AWS.Lambda({ region: 'us-east-1' })

const createLambda = async ({
  name, handler, memory, timeout, env, description, role
}) => {
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

const updateLambda = async ({
  name, handler, memory, timeout, env, description
}) => {
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

const deploy = async (inputs, context) => {
  let outputs
  if (inputs.name && !context.state.name) {
    context.log(`Creating Lambda: ${inputs.name}`)
    outputs = await createLambda(inputs)
  } else if (context.state.name && !inputs.name) {
    context.log(`Removing Lambda: ${context.state.name}`)
    outputs = await deleteLambda(context.state.name)
  } else if (inputs.name !== context.state.name) {
    context.log(`Removing Lambda: ${context.state.name}`)
    await deleteLambda(context.state.name)
    context.log(`Creating Lambda: ${inputs.name}`)
    outputs = await createLambda(inputs)
  } else {
    context.log(`Updating Lambda: ${inputs.name}`)
    outputs = await updateLambda(inputs)
  }
  context.saveState({ ...inputs, ...outputs })
  return outputs
}

const remove = async (inputs, context) => {
  context.log(`Removing Lambda: ${context.state.name}`)
  const outputs = await deleteLambda(context.state.name)
  context.saveState({ ...inputs, ...outputs })
  return outputs
}

module.exports = {
  deploy,
  remove
}
