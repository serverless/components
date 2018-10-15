import { resolve } from '../../utils/variable'

const Function = {
  construct(inputs) {
    this.functionName = inputs.functionName
    this.functionDescription = inputs.functionDescription
    this.memory = inputs.memory
    this.timeout = inputs.timeout
    this.runtime = inputs.runtime
    this.code = inputs.code
    this.handler = inputs.handler
    this.compute = inputs.compute
    this.environment = inputs.environment
    this.tags = inputs.tags
  },
  async define(context) {
    const compute = resolve(this.compute)
    return { fn: await compute.defineFunction(this, context) }
  }
}

export default Function
