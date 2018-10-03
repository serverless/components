import { forEachObjIndexed } from 'ramda'

const Function = {
  deploy(context) {
    const { functionName, handler, code, runtime, memory, timeout } = this
    const functionInputs = { functionName, handler, code, runtime, memory, timeout }
    forEachObjIndexed((c) => c.deployFunction(functionInputs, context), this.compute)
  }
}

export default Function

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
