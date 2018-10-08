import { all, forEach, isArray, isFunction, isObject, map } from '@serverless/utils'

/**
 *
 */
const defineComponent = async (component, context) => {

  // TODO BRN: If we ever need to retrigger define (redefine) hydrating state here may be an issue
  if (isFunction(component.hydrate)) {
    component = hydrateState(component)
  }
  if (isFunction(component.define)) {
    const children = await component.define(context)
    if (child)
    forEach((child) => child.parent = component, children)
    component.children = await all(map((child) => define(child, context), children))
  }
  return component
}

export default defineComponent
