import { forEachObjIndexed } from 'ramda'

const Function = {
  construct(inputs) {
    this.name = inputs.name
    this.handler = inputs.handler
    this.code = inputs.code
    this.compute = inputs.compute
    this.runtime = inputs.runtime
    this.description = inputs.description
    this.memory = inputs.memory
    this.timeout = inputs.timeout
    this.environment = inputs.environment
  },
  deploy(context) {
    const { name, handler, code, runtime, memory, timeout } = this
    const functionInputs = { name, handler, code, runtime, memory, timeout }
    forEachObjIndexed((c) => c.deployFunction(functionInputs, context), this.compute)
  }
}

export default Function








// import { is, map } from '@serverless/utils'
//
// const Function = async (SuperClass, context) => {
//   const ICompute = await context.loadType('ICompute')
//
//   return {
//     define(context) {
//       let children = {}
//       if (is(ICompute, this.compute)) {
//         children = {
//           [this.compute.name]: this.compute.defineFunction(this, context)
//         }
//       } else {
//         children = map((compute) => compute.defineFunction(this, context), this.compute)
//       }
//       return children
//     }
//   }
// }
//
// export default Function
