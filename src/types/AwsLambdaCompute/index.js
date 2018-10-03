import { append, isString } from '@serverless/utils'
import path from 'path'

const convertRuntime = (runtime) => {
  if (runtime === 'nodejs') {
    return 'nodejs8.10'
  }
  // TODO: other runtimes
  throw new Error(`unknown runtime value in compute ${runtime}`)
}

const getShimFile = (runtime) => {
  let shimFile
  if (runtime === 'nodejs8.10') {
    shimFile = 'shim.js'
  } // todo other runtimes
  return path.join(__dirname, 'shims', shimFile)
}

const AwsLambdaCompute = async (SuperClass, superContext) => {
  const AwsLambdaFunction = await superContext.loadType('AwsLambdaFunction')

  return {
    async defineFunction(functionInstance, context) {
      const runtime = convertRuntime(functionInstance.runtime || this.runtime)
      let { code } = functionInstance
      if (isString(code)) {
        code = [code]
      }
      code = append(getShimFile(runtime), code)

      const inputs = {
        provider: functionInstance.provider || this.provider,
        functionName: functionInstance.functionName,
        functionDescription: functionInstance.functionDescription,
        memorySize: functionInstance.memory || this.memory,
        timeout: functionInstance.timeout || this.timeout,
        runtime,
        handler: 'shim.handler',
        environment: {
          ...this.environment,
          ...functionInstance.environment,
          SERVERLESS_HANDLER: functionInstance.handler
        },
        code: this.code,
        tags: {
          ...this.tags,
          ...functionInstance.tags
        }
      }

      return context.construct(AwsLambdaFunction, inputs)
    }
  }
}

export default AwsLambdaCompute
