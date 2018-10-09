import { all, forEach, isFunction, map } from '@serverless/utils'

/**
 *
 */
const defineComponentFromState = async (component, context) => {
  // NOTE BRN: We only define children based on what was recorded in state here since we need this capability to determine changes in component tree from deployment to deployment
  // TODO BRN (priority high): Need to save children by instanceId in state
  // TODO BRN: load component state by instance
  // TODO BRN: define each child by state value
  // TODO BRN: Figure out how the hell we deal with changes in code from one version to another
  // if (isFunction(component.define)) {
  //   const children = await component.define(context)
  //   forEach((child) => child.parent = component, children)
  //   component.children = await all(map((child) => define(child, context), children))
  // }
  return component
}

export default defineComponentFromState
