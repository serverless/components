import { append, castPath, get, has, toString, walkReducePath } from '@serverless/utils'
import { SYMBOL_VARIABLE } from '../constants'
import matchVariable from './matchVariable'
import resolveVariable from './resolveVariable'

const newVariable = (variableString, data) => ({
  [SYMBOL_VARIABLE]: true,
  findInstances() {
    const pathParts = castPath(matchVariable(variableString).expression)
    return walkReducePath(
      (instances, value, keys) => {
        if (has('instanceId', value)) {
          return append(value, instances)
        }
        return instances
      },
      pathParts,
      [],
      data
    )
  },
  get(path) {
    return get(path, resolveVariable(variableString, data))
  },
  valueOf() {
    return resolveVariable(variableString, data)
  }
})

export default newVariable

//
//
// variable = {
//   isVariable: true,
//   get() {
//     const propPath = value.match(regex)[1]
//     return value.replace(regex, get(propPath, data))
//     // propPath = this.components.lambda.arn
//   },
//   findInstances() {
//     // ${this.components.lambda.prop.someOtherComponent}
//     // this.instanceId -> this.instanceId -> lambda.instanceId -> someOtherComponent.instanceId
//
//     const propPath = value.match(regex)[1]
//
//     return [
//       this,
//       lambda,
//       someOtherComponent
//     ]
//   }
// }
//
//
// self -> self
//
// self -> componentChild -> self
//
// forEachObjIndexed((prop) => {
//   if (isObject(prop) && prop.isVariable) {
//     const value = prop.get()
//     if (isObject(value) && value.instanceId) {
//       // we have an instance id!
//
//       if (instance.instanceId === value.instanceId) {
//         // ignore dependency
//       }
//       //build a graph edge from
//       instance.instanceId -> value.instanceId
//     }
//   }
// }, instance)
//
// ${this.someProp}
//
//
//
//
//
//
//
// componentInstanceA -> componentInstanceB
