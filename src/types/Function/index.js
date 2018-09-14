import { forEach } from '@serverless/utils'

const Function = {
  deploy: async (instance, context) => {
    forEach(async (c) => {
      const computeInputs = await c.pack(context.inputs)
      c.deploy(computeInputs)
    }, context.compute)
  },
  remove: (instance, context) => {
    forEach(async (c) => {
      const computeInputs = await c.pack(context.inputs)
      c.remove(computeInputs)
    }, context.compute)
  }
}

export default Function
