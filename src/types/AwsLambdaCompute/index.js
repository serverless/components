import path from 'path'
import { createReadStream } from 'fs'
import { mergeDeepRight } from '@serverless/utils'

const getRuntimeShim = (runtime) => {
  let shimFile

  if (runtime === 'nodejs8.10') shimFile = 'shim.js' // todo other runtimes

  const shimFilePath = path.join(__dirname, 'shims', shimFile)
  return createReadStream(shimFilePath, { name: shimFile })
}

const getAwsLambdaFunctionInputs = (instance, context) => {
  const AwsLambdaFunctionInputs = {
    FunctionName: instance.name,
    memory: instance.memory, // todo validate
    timeout: instance.timeout,
    handler: 'shim.handler',
    description: 'Serverless Function'
  }

  // env
  const defaultEnv = { SERVERLESS_HANDLER: inputs.handler}
  const environment = { ...instance.environment, ...defaultEnv }
  AwsLambdaFunctionInputs.environment = environment

  // runtime
  let shimFile
  if (instance.runtime === 'nodejs') {
    AwsLambdaFunctionInputs.runtime = 'nodejs8.10'
    shimFile = 'shim.js'
  } // todo other runtimes
  const shimFilePath = path.join(__dirname, 'shims', shimFile)
  const shimStream = createReadStream(shimFilePath, { name: shimFile })
  AwsLambdaFunctionInputs.code = [AwsLambdaFunctionInputs.code, shimStream]

  return AwsLambdaFunctionInputs
}

const packFunction = (instance, context) => {
  const AwsLambdaFunctionInputs = getAwsLambdaFunctionInputs()
  const AwsLambdaFunction = context.loadType('AwsLambdaFunction')
  const awsLambdaFunction = context.construct(AwsLambdaFunction, AwsLambdaFunctionInputs)
  return awsLambdaFunction.pack(context)
}

const deployFunction = (instance, inputs, context) => {
  const awsLambdaFunction = instance.awsLambdaFunction || context.get('awsLambdaFunction')
  const defaultEnv = { SERVERLESS_HANDLER: inputs.handler || instance.handler }
  const environment = { ...instance.environment, ...inputs.environment, ...defaultEnv }
  const inputs = {
    code: inputs.code, // binary
    handler: 'shim.handler',
    memory: instance.memory || inputs.memory,
    timeout: instance.timeout || inputs.timeout,
    runtime: instance.runtime || inputs.runtime,
    memory: instance.memory || inputs.memory,
    environment
  }
  return awsLambdaFunction.deploy(inputs, context)
}

module.exports = {
  packFunction,
  deployFunction
}
