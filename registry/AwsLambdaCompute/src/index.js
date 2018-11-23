import { resolve } from '@serverless/utils'
import path from 'path'

const parseRate = (rate) => {
  const unit = rate.substr(rate.length - 1)
  if (['m', 'h', 'd'].includes(unit)) {
    let awsUnit
    const period = rate.substr(0, rate.length - 1)
    if (period === '1') {
      if (unit === 'm') {
        awsUnit = 'minute'
      }
      if (unit === 'h') {
        awsUnit = 'hour'
      }
      if (unit === 'd') {
        awsUnit = 'day'
      }
    } else {
      if (unit === 'm') {
        awsUnit = 'minutes'
      }
      if (unit === 'h') {
        awsUnit = 'hours'
      }
      if (unit === 'd') {
        awsUnit = 'days'
      }
    }
    return `rate(${period} ${awsUnit})`
  }
  return `cron(${rate})`
}
const convertRuntime = (runtime) => {
  // default runtime
  if (runtime === undefined || runtime === 'nodejs') {
    return 'nodejs8.10'
  }

  if (runtime === 'java') {
    return 'java8'
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
  const AwsLambdaFunction = await superContext.import('AwsLambdaFunction')

  return {
    async defineFunction(functionInstance, context) {
      const funcInstance = resolve(functionInstance)
      // need to resolve these two variables now to convert values
      const ufs = resolve(funcInstance.ufs) || resolve(this.ufs) || false
      const runtime = convertRuntime(resolve(funcInstance.runtime) || resolve(this.runtime))
      let code = resolve(funcInstance.code)

      const inputs = {
        provider: this.provider,
        role: this.role,
        functionName: funcInstance.functionName,
        functionDescription: funcInstance.functionDescription,
        memorySize: resolve(funcInstance.memory) || resolve(this.memory),
        timeout: resolve(funcInstance.timeout) || resolve(this.timeout),
        runtime,
        handler: resolve(funcInstance.handler),
        environment: {
          ...resolve(this.environment),
          ...resolve(funcInstance.environment)
        },
        code,
        tags: {
          ...resolve(this.tags),
          ...resolve(funcInstance.tags)
        }
      }

      if (ufs) {
        code = [code, getShimFile(runtime)]
        inputs.code = code
        inputs.handler = 'shim.handler'
        inputs.environment.SERVERLESS_HANDLER = functionInstance.handler
      }

      return context.construct(AwsLambdaFunction, inputs)
    },

    async defineSchedule(functionInstance, rate, context) {
      const AwsCloudWatchEventsRule = await context.import('AwsCloudWatchEventsRule')
      const inputs = {
        provider: this.provider,
        lambda: functionInstance,
        schedule: parseRate(rate),
        enabled: true
      }
      return context.construct(AwsCloudWatchEventsRule, inputs)
    }
  }
}

export default AwsLambdaCompute
