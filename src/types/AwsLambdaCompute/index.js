import { append, isString } from '@serverless/utils'
import path from 'path'
import { resolve } from '../../utils/variable'

const parseRate = (rate) => {
  const unit = rate.substr(rate.length - 1)
  if (['m', 'h', 'd'].includes(unit)) {
    let awsUnit
    const period = rate.substr(0, rate.length - 1)
    if (period === '1') {
      if (unit === 'm') awsUnit = 'minute'
      if (unit === 'h') awsUnit = 'hour'
      if (unit === 'd') awsUnit = 'day'
    } else {
      if (unit === 'm') awsUnit = 'minutes'
      if (unit === 'h') awsUnit = 'hours'
      if (unit === 'd') awsUnit = 'days'
    }

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
      const funcInstance = resolve(functionInstance)
      // need to resolve these two variables now to convert values
      const runtime = convertRuntime(this.runtime.get())
      let code = functionInstance.code.get()
      if (isString(code)) {
        code = [code]
      }
      code = append(getShimFile(runtime), code)

      const inputs = {
        provider: this.provider,
        functionName: funcInstance.functionName,
        functionDescription: funcInstance.functionDescription,
        memorySize: funcInstance.memory,
        timeout: funcInstance.timeout,
        runtime,
        handler: 'shim.handler',
        environment: {
          ...resolve(this.environment),
          ...resolve(funcInstance.environment),
          SERVERLESS_HANDLER: funcInstance.handler
        },
        code,
        tags: {
          ...resolve(this.tags),
          ...funcInstance.tags
        }
      }

      return context.construct(AwsLambdaFunction, inputs)
    },
    async defineSchedule(functionInstance, rate, context) {
      const AwsEventsRule = await context.loadType('AwsEventsRule')
      const inputs = {
        provider: this.provider,
        lambda: functionInstance,
        schedule: parseRate(rate),
        enabled: true
      }
      return context.construct(AwsEventsRule, inputs)
    }
  }
}

export default AwsLambdaCompute
