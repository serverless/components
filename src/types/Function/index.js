import { forEachObjIndexed } from '@serverless/utils'

const Function = {
  // construct(inputs) {
  //   this.functionName = inputs.functionName
  //   this.functionDesription = inputs.functionDesription
  //   this.memory = inputs.memory
  //   this.timeout = inputs.timeout
  //   this.runtime = inputs.runtime
  //   this.code = inputs.code
  //   this.handler = inputs.handler
  //   this.compute = inputs.compute
  //   this.environment = inputs.environment
  //   this.tags = inputs.tags
  // },
  async define(context) {
    const compute = this.compute.get()
    return { fn: await compute.defineFunction(this, context) }
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

// import { is, map } from '@serverless/utils'
//
// const Function = async (SuperClass, context) => {
//   const Compute = await context.loadType('Compute')
//
//   return {
//     define(context) {
//       let children = {}
//       if (is(Compute, this.compute)) {
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
