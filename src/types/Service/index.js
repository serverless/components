import { map } from '@serverless/utils'
import Promise from 'bluebird'

const Service = async (SuperClass, superContext) => {
  const Fn = await superContext.loadType('Function')

  return {
    async define(context) {
      const fns = await Promise.props(
        map(async (func, functionName) => {
          return await context.construct(
            Fn,
            {
              ...func,
              functionName
            },
            context
          )
        }, this.functions)
      )

      return {
        ...fns,
        ...this.components // this define overwrites Component.define!
      }
    }
  }
}

export default Service
