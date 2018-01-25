const ServerlessComponentsEslam = require('serverless-components-eslam')
const pack = require('./utils/pack')
const createRole = require('./utils/createRole')
const removeRole = require('./utils/removeRole')

const { AWS, BbPromise } = ServerlessComponentsEslam

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

  return lambda.createFunction(params).promise()
}

const update = async ({ name, handler, memory, timeout, description }, lambdaRoleArn) => {
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
    Role: lambdaRoleArn,
    Runtime: 'nodejs6.10',
    Timeout: timeout
  }

  await lambda.updateFunctionConfiguration(functionConfigParams).promise()
  return lambda.updateFunctionCode(functionCodeParams).promise()
}

const remove = async (name) => {
  await removeRole(name)
  const params = {
    FunctionName: name
  }

  return lambda.deleteFunction(params).promise()
}

module.exports = async (config, state) => {
  let outputs = {
    lambdaArn: null,
    lambdaRoleArn: null
  }
  if (!config.name && !state.name) {
    console.log('Skipping Lambda: no function name provided')
  } else if (config.name && !state.name) {
    console.log(`Creating Lambda: ${config.name}`)
    const res = await create(config)
    outputs.lambdaArn = res.FunctionArn
    outputs.lambdaRoleArn = res.Role
  } else if (state.name && !config.name) {
    console.log(`Removing Lambda: ${state.name}`)
    await remove(state.name)
  } else if (config.name !== state.name) {
    console.log(`Removing Lambda: ${state.name}`)
    await remove(state.name)
    console.log(`Creating Lambda: ${config.name}`)
    const res = await create(config)
    outputs.lambdaArn = res.FunctionArn
    outputs.lambdaRoleArn = res.Role
  } else {
    console.log(`Updating Lambda: ${config.name}`)
    await update(config, state.lambdaRoleArn)
    outputs.lambdaRoleArn = state.lambdaRoleArn
    outputs.lambdaArn = state.lambdaArn
  }
  console.log('Done')
  return outputs
}
