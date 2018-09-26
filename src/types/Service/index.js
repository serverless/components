import { forEachObjIndexed } from 'ramda'

const Service = {
  async deploy(context) {
    forEachObjIndexed(async (functionObj, functionName) => {
      console.log(functionObj.compute.aws)
      functionObj.name = functionName
      const Fn = await context.loadType('Function')
      const fn = await context.construct(Fn, functionObj, context)
      fn.deploy(context)
    }, this.functions)
  },
  async remove(context) {
    forEachObjIndexed((c) => c.remove(context), this.compute)
  }
}

export default Service







// import { map } from '@serverless/utils'
// const Service = async (SuperClass, context) => {
//   const Fn = await context.loadType('Function')
//
//   return {
//     async define(context) {
//       return Promise.all(
//         map(async (func, name) => {
//           return await context.construct(
//             Fn,
//             {
//               ...func,
//               name
//             },
//             context
//           )
//         }, this.functions)
//       )
//     }
//     // => {
//     //  someFunction: new Function({ ...inputs }),
//     //  myDatabase: new DyanamoDb({ ...inputs })
//     // }
//   }
// }
