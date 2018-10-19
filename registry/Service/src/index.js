import { all, mapObjIndexed, resolve } from '@serverless/utils'

const Service = async (SuperClass, superContext) => {
  const Fn = await superContext.loadType('Function')

  return class extends SuperClass {
    async construct(inputs, context) {
      await super.construct(inputs, context)
      this.functions = await all(
        mapObjIndexed(
          async (func, alias) =>
            context.construct(Fn, {
              ...func,
              functionName: func.functionName || alias
            }),
          resolve(this.functions)
        )
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
