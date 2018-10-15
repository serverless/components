import { all, mapObjIndexed, resolve } from '@serverless/utils'

const Service = async (SuperClass, context) => {
  const Fn = await context.loadType('Function')

  return class extends SuperClass {
    async construct(inputs, context) {
      const fns = resolve(this.functions)
      this.functions = await all(
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
    }

    async define() {
      // TODO BRN: Change this once we support multiple layers here. This could cause collisions between functions and components that are named the same thing.
      return {
        ...this.functions,
        ...this.components
      }
    }
  }
}

export default Service
