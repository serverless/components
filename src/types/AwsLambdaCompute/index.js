import { append, isString } from '@serverless/utils'
import path from 'path'

const parseRate = (rate) => {
  const unit = rate.substr(rate.length - 1)
  if (['s', 'm', 'h', 'd', 'week'].includes(unit)) {
    let awsUnit
    const period = rate.substr(0, rate.length - 1)
    if (unit === 's') awsUnit = 'seconds'
    if (unit === 'm') awsUnit = 'minutes'
    if (unit === 'h') awsUnit = 'hours'
    if (unit === 'd') awsUnit = 'days'
    if (unit === 'w') awsUnit = 'weeks'
    return `rate(${period} ${awsUnit})`
  } else {
    return `cron(${rate})`
  }
}
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
    },
    async defineSchedule(functionInstance, rate, context) {
      return functionInstance.defineSchedule(parseRate(rate), context)
    }
  }
}

export default AwsLambdaCompute
