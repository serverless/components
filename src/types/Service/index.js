import { map } from '@serverless/utils'

const Service = async (SuperClass, context) => {
  const Fn = await context.loadType('Function')

  return {
    async define(context) {
      return Promise.all(
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
    // => {
    //  someFunction: new Function({ ...inputs }),
    //  myDatabase: new DyanamoDb({ ...inputs })
    // }

  }
}

export default Service
