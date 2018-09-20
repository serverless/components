import { forEachObjIndexed } from 'ramda'

const Function = {
  deploy: async (instance, context) => {
    forEachObjIndexed((functionObj, functionName) => {
      functionObj.name = functionName
      const Fn = context.loadType('Function')
      const fn = context.construct(Fn, functionObj, context)
      fn.deploy(context)
    }, instance.functions)
  },
  remove: (instance, context) => {
    forEachObjIndexed((c) => c.remove(context), instance.compute)
  }
}

export default Function
