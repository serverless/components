import { forEachObjIndexed } from '@serverless/utils'

const Function = {
  async define(context) {
    return { fn: await this.compute.defineFunction(this, context) }
  },
  async defineSchedule(rate, context) {
    if (this.compute.type === 'Compute') {
      await this.compute.defineSchedule(this.children.fn, rate, context)
    } else {
      forEachObjIndexed(async (c) => await c.defineSchedule(rate, context), this.compute)
    }
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
