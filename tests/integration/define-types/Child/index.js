import { all, map } from '@serverless/utils'

const Child = async (SuperClass, superContext) => {
  const GrandChild = await superContext.load('./GrandChild')

  return {
    async define(context) {
      return all(
        map({
          grandChildA: context.construct(GrandChild, { bar: '' }),
          grandChildB: context.construct(GrandChild, { bar: '' })
        })
      )
    }
  }
}

export default Child
