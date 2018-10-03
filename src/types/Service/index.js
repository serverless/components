import { map } from '@serverless/utils'
import Promise from 'bluebird'

const Service = async (SuperClass, superContext) => {
  const Fn = await superContext.loadType('Function')

  return {
    async define(context) {
      return Promise.props(
        map(async (func, name) => {
          return await context.construct(
            Fn,
            {
              ...func,
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
