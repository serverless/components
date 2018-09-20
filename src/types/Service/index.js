import { forEach } from 'ramda'

const Function = {
  deploy: async (instance, context) => {
    forEach((f) => {
      const Fn = context.loadType('Function')
      const fn = context.construct(Fn, f, context)
      fn.deploy(context)
    }, instance.functions)
  },
  remove: (instance, context) => {
    forEach((c) => c.remove(context), instance.compute)
  }
}

export default Function
