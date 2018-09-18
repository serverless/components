import { forEach } from '@serverless/utils'

const Function = {
  deploy: async (instance, inputs, context) => {
    const compute = instance.compute || context.get('compute')

    const pkg = compute.packFunction(
      {
        runtime: instance.runtime,
        code: instance.code
      },
      context
    )

    compute.deployFunction(
      {
        pkg,
        memory: instance.memory,
        timeout: instance.timeout,
        environment: instance.environment,
        tags: instance.tags
      },
      context
    )
  },
  remove: (instance, context) => {
    forEach(async (c) => {
      const computeInputs = await c.pack(context.inputs)
      c.remove(computeInputs)
    }, context.compute)
  }
}

export default Function
