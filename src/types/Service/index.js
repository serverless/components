import { map } from '@serverless/utils'

const Service = async (SuperClass, context) => {
  const Fn = await context.loadType('Function')

  return {
    async define(context) {
      return Promise.all(
        map(async (func, name) => {
          const fn = await context.construct(
            Fn,
            {
              ...functionObj,
              name
            },
            context
          )
        }, this.functions)
      )
    }
  }
}

export default Service
