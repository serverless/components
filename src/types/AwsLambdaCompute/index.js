import path from 'path'
import { createReadStream } from 'fs'

const packFunction = async (instance, context) => {
  const AwsLambdaFunctionInputs = {
    Provider: instance.provider,
    FunctionName: instance.name,
    MemorySize: instance.memory,
    Timeout: instance.timeout,
    Handler: 'shim.handler',
    Code: instance.code
  }

  // env
  const defaultEnv = { SERVERLESS_HANDLER: instance.handler }
  const environment = { ...instance.environment, ...defaultEnv }
  AwsLambdaFunctionInputs.Environment = environment

  // runtime
  if (instance.runtime === 'nodejs') {
    AwsLambdaFunctionInputs.Runtime = 'nodejs8.10'
  } // todo other runtimes

  if (typeof AwsLambdaFunctionInputs.Code === String) {
    let shimFile
    if (AwsLambdaFunctionInputs.Runtime === 'nodejs8.10') {
      shimFile = 'shim.js'
    } // todo other runtimes
    const shimFilePath = path.join(__dirname, 'shims', shimFile)
    const shimStream = createReadStream(shimFilePath, { name: shimFile })
    AwsLambdaFunctionInputs.Code = [AwsLambdaFunctionInputs.Code, shimStream]
  }

  const AwsLambdaFunction = await context.loadType('AwsLambdaFunction')
  const awsLambdaFunction = await context.construct(AwsLambdaFunction, AwsLambdaFunctionInputs)
  return awsLambdaFunction.pack(context)
}

const deployFunction = async (instance, functionInstance, context) => {
  const awsLambdaFunctionInputs = await instance.packFunction(context)
  const AwsLambdaFunction = await context.loadType('AwsLambdaFunction')
  const awsLambdaFunction = await context.construct(AwsLambdaFunction, awsLambdaFunctionInputs)
  return awsLambdaFunction.deploy(context)
}

module.exports = {
  packFunction,
  deployFunction
}
