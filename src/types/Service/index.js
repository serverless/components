import { map } from '@serverless/utils'
import Promise from 'bluebird'

const Service = (SuperClass) =>
  class extends SuperClass {
    async define(context) {
      super.define(context)
      const Fn = await context.loadType('Function')
      const fns = this.functions.get() // why?!
      this.functions = await Promise.props(
        map(async (func, functionName) => {
          return await context.construct(
            Fn,
            {
              ...func,
              functionName
            },
            context
          )
        }, fns)
      )
      console.log(this.functions)
      return {
        ...this.functions,
        ...this.components
      }
    }
  }

export default Service
