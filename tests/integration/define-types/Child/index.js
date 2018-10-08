import { mapAll } from '@serverless/utils'

const Child = (SuperClass, context) => {
  const GrandChild = await context.load('./GrandChild')

  return {
    async define(context) {
      return mapAll({
        grandChildA: context.construct(GrandChild, { bar: '' }),
        GrandChildB: context.construct()
      })
    }
  }
}

export default Child
