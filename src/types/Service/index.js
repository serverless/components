import { map } from '@serverless/utils'
import Promise from 'bluebird'

const Service = (SuperClass) =>
  class extends SuperClass {
    async construct(inputs, context) {
      const Fn = await context.loadType('Function')
      const fns = this.functions
      this.functions = await Promise.props(
        map(async (func, alias) => {
          return await context.construct(
            Fn,
            {
              ...func,
              functionName: func.functionName || alias
            },
            context
          )
        }, fns)
      )
    }

    async define(context) {
      super.define(context)
      console.log(this.functions)
      return {
        ...this.functions,
        ...this.components
      }
    }
  }

export default Service
