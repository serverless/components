import { is, map } from '@serverless/utils'

const Function = async (SuperClass, context) => {
  const ICompute = await context.loadType('ICompute')

  return {
    define(context) {
      let children = {}
      if (is(ICompute, this.compute)) {
        children = {
          [this.compute.name]: this.compute.defineFunction(this, context)
        }
      } else {
        children = map((compute) => compute.defineFunction(this, context), this.compute)
      }
      return children
    }
  }
}

export default Function
