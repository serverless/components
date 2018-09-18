import { forEach } from '@serverless/utils'

const Function = {
  deploy: async (instance, context) => {
    forEach((c) => c.deploy(context), instance.compute)
  },
  remove: (instance, context) => {
    forEach((c) => c.remove(context), instance.compute)
  }
}

export default Function
