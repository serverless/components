import path from 'path'
import { createReadStream } from 'fs'

const pack = async (instance, context) => {
  const AwsLambdaFunctionInputs = {
    FunctionName: instance.name,
    MemorySize: instance.memory, // todo validate
    Timeout: instance.timeout,
    Handler: 'shim.handler',
    Description: 'Serverless Function'
  }

  // env
  const defaultEnv = { SERVERLESS_HANDLER: instance.handler }
  const environment = { ...instance.environment, ...defaultEnv }
  AwsLambdaFunctionInputs.Environment = environment

  // runtime
  if (instance.runtime === 'nodejs') {
    AwsLambdaFunctionInputs.Runtime = 'nodejs8.10'
  } // todo other runtimes

  if (typeof instance.code === String) {
    let shimFile
    if (AwsLambdaFunctionInputs.Runtime === 'nodejs8.10') {
      shimFile = 'shim.js'
    } // todo other runtimes
    const shimFilePath = path.join(__dirname, 'shims', shimFile)
    const shimStream = createReadStream(shimFilePath, { name: shimFile })
    AwsLambdaFunctionInputs.Code = [instance.code, shimStream]
  } else {
    AwsLambdaFunctionInputs.Code = instance.code
  }

  const AwsLambdaFunction = context.loadType('AwsLambdaFunction')
  const awsLambdaFunction = context.construct(AwsLambdaFunction, AwsLambdaFunctionInputs)
  return awsLambdaFunction.pack(context)
}

const deploy = async (instance, context) => {
  const AwsLambdaFunctionInputs = await instance.pack(instance, context)
  const AwsLambdaFunction = context.loadType('AwsLambdaFunction')
  const awsLambdaFunction = context.construct(AwsLambdaFunction, AwsLambdaFunctionInputs)
  return awsLambdaFunction.deploy(context)
}

module.exports = {
  pack,
  deploy
}
