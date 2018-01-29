const Serverless = require('framework')
const pack = require('./utils/pack')
const createRole = require('./utils/createRole')
const removeRole = require('./utils/removeRole')

const { AWS, BbPromise } = Serverless

const lambda = new AWS.Lambda({ region: 'us-east-1' })

const create = async ({ name, handler, memory, timeout, description }) => {
  const lambdaRoleArn = await createRole(name)
  const pkg = await pack()
  await BbPromise.delay(10000)

  const params = {
    FunctionName: name,
    Code: {
      ZipFile: pkg
    },
    Description: description,
    Handler: handler,
    MemorySize: memory,
    Publish: true,
    Role: lambdaRoleArn,
    Runtime: 'nodejs6.10',
    Timeout: timeout
  }

  const res = await lambda.createFunction(params).promise()
  return {
    arn: res.FunctionArn,
    roleArn: res.Role
  }
}

const update = async ({ name, handler, memory, timeout, description }) => {
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
    Timeout: timeout
  }

  await lambda.updateFunctionCode(functionCodeParams).promise()
  const res = await lambda.updateFunctionConfiguration(functionConfigParams).promise()

  return {
    arn: res.FunctionArn,
    roleArn: res.Role
  }
}

const remove = async (name) => {
  await removeRole(name)
  const params = {
    FunctionName: name
  }

  await lambda.deleteFunction(params).promise()
  return {
    arn: null,
    roleArn: null
  }
}

module.exports = async (inputs, state) => {
  let outputs
  if (inputs.name && !state.name) {
    console.log(`Creating Lambda: ${inputs.name}`)
    outputs = await create(inputs)
  } else if (state.name && !inputs.name) {
    console.log(`Removing Lambda: ${state.name}`)
    outputs = await remove(state.name)
  } else if (inputs.name !== state.name) {
    console.log(`Removing Lambda: ${state.name}`)
    await remove(state.name)
    console.log(`Creating Lambda: ${inputs.name}`)
    outputs = await create(inputs)
  } else {
    console.log(`Updating Lambda: ${inputs.name}`)
    outputs = await update(inputs)
  }
  return outputs
}
