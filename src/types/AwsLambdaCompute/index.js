import path from 'path'
import { is, forEachObjIndexed } from 'ramda'

const AwsLambdaCompute = {
  construct(inputs) {
    this.provider = inputs.provider
    this.runtime = inputs.runtime
    this.name = inputs.name
    this.handler = inputs.handler
    this.memory = inputs.memory
    this.timeout = inputs.timeout
    this.code = inputs.code
    this.environment = inputs.environment
  },
  async packFunction(context) {
    const AwsLambdaFunctionInputs = {
      provider: this.provider,
      name: this.name,
      memory: this.memory,
      timeout: this.timeout,
      handler: 'shim.handler',
      environment: this.environment || {},
      description: this.description,
      handler: 'shim.handler',
      code: this.code
    }

    // env
    const defaultEnv = { SERVERLESS_HANDLER: this.handler }
    const environment = { ...this.environment, ...defaultEnv }
    AwsLambdaFunctionInputs.environment = environment

    // runtime
    if (this.runtime === 'nodejs') {
      AwsLambdaFunctionInputs.runtime = 'nodejs8.10'
    } // todo other runtimes

    if (is(String, AwsLambdaFunctionInputs.code)) {
      let shimFile
      if (AwsLambdaFunctionInputs.runtime === 'nodejs8.10') {
        shimFile = 'shim.js'
      } // todo other runtimes
      const shimFilePath = path.join(__dirname, 'shims', shimFile)
      AwsLambdaFunctionInputs.code = [AwsLambdaFunctionInputs.code, shimFilePath]
    }

    const AwsLambdaFunction = await context.loadType('AwsLambdaFunction')
    const awsLambdaFunction = await context.construct(
      AwsLambdaFunction,
      AwsLambdaFunctionInputs,
      context
    )
    return awsLambdaFunction.pack(context)
  },
  async deployFunction(functionObj, context) {
    forEachObjIndexed((v, k) => (this[k] = v), functionObj) // merge
    const awsLambdaFunctionInputs = await this.packFunction(context)
    const AwsLambdaFunction = await context.loadType('AwsLambdaFunction')
    const awsLambdaFunction = await context.construct(AwsLambdaFunction, awsLambdaFunctionInputs)
    return awsLambdaFunction.deploy(context)
  }
}

export default AwsLambdaCompute
