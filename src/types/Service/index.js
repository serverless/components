import { mapObjIndexed } from 'ramda'
import Promise from 'bluebird'

const Service = (SuperClass) =>
  class extends SuperClass {
    async define(context) {
      super.define(context)
      const Fn = await context.loadType('Function')
      const functionInstances = await Promise.props(
        mapObjIndexed(async (func, alias) => {
          return await context.construct(
            Fn,
            {
              ...func,
              functionName: func.functionName || alias
            },
            context
          )
        }, this.functions)
      )
      this.functions = functionInstances
      return {
        ...this.functions,
        ...this.components
      }
    }
  }

export default Service
