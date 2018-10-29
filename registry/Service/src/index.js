import { append, map, or, reduce } from '@serverless/utils'

const Service = async (SuperClass, superContext) => {
  const Fn = await superContext.loadType('Function')

  return class extends SuperClass {
    async construct(inputs, context) {
      await super.construct(inputs, context)
      this.functions = map(async (func, alias) =>
        context.construct(
          Fn,
          {
            ...func,
            functionName: func.functionName || alias
          },
          this.functions
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

    async info() {
      const functions = await reduce(
        async (accum, func) => append(await func.info(), accum),
        [],
        or(this.functions, {})
      )
      const components = await reduce(
        async (accum, component) => append(await component.info(), accum),
        [],
        or(this.components, {})
      )

      return {
        title: this.name,
        type: this.extends,
        data: {},
        children: [...functions, ...components]
      }
    }
  }
}

export default Service
