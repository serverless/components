import { get, isFunction, or, resolve, clone, set, walkReduce } from '@serverless/utils'
// import appendKey from './appendKey'
// import getKey from './getKey'
import isTypeConstruct from '../type/isTypeConstruct'
import hydrateComponent from './hydrateComponent'
import isComponent from './isComponent'
import { SYMBOL_STATE } from '../constants'
// import setKey from './setKey'

/**
 *
 */
const defineComponent = async (component, state, context) => {
  // TODO BRN: If we ever need to retrigger define (redefine) hydrating state here may be an issue
  if (!isComponent(component)) {
    throw new TypeError(
      `defineComponent expected component parameter to be a component. Instead received ${component}`
    )
  }

  // if this is the first deployment
  // confirm that the resource does not exist on the provider
  // otherwise, sync the state
  if (state === undefined) {
    const componentClone = clone(component)
    const status = await componentClone.sync(context)

    if (status !== 'removed' && status !== 'unknown') {
      state = componentClone
      component[SYMBOL_STATE] = state
    }
  }

  component = hydrateComponent(component, state, context)

  if (isFunction(component.define)) {
    let children = await or(component.define(context), {})

    let insideOfComponent = false
    let depthOfFirstComponent = 0
    children = await walkReduce(
      async (accum, value, pathParts) => {
        if (pathParts.length <= depthOfFirstComponent) {
          insideOfComponent = false
        }
        if (!insideOfComponent) {
          if (isTypeConstruct(value) || isComponent(value)) {
            let instance
            insideOfComponent = true
            depthOfFirstComponent = pathParts.length
            if (isTypeConstruct(value)) {
              const child = await context.import(value.type)
              instance = context.construct(child, value.inputs)
            } else if (isComponent(value)) {
              instance = resolve(value)
            }
            // TODO BRN: Look for children that already have parents. If this is the case then someone has returned a child from define that was defined by another component (possibly passed along as a variable)
            instance.parent = component
            instance = await defineComponent(
              instance,
              get([...pathParts, 'children'], state),
              context
            )
            return set(pathParts, instance, accum)
          }
        }
        return accum
      },
      {},
      children
    )
    component.children = children
  }

  return component
}

export default defineComponent
