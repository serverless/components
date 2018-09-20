import { forEachObjIndexed } from 'ramda'

const Function = {
  deploy: async (instance, context) => {
    const { name, handler, code, runtime, memory, timeout } = instance
    const functionInputs = { name, handler, code, runtime, memory, timeout }
    forEachObjIndexed((c) => c.deploy(context, functionInputs), instance.compute)
  },
  remove: (instance, context) => {
    forEachObjIndexed((c) => c.remove(context), instance.compute)
  }
}

export default Function
