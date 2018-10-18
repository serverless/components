import { resolve } from '@serverless/utils'
import isComponent from './isComponent'

const reduceChildren = (iteratee, accum, component) => {
  component = resolve(component)
  if (!isComponent(component)) {
    throw new Error(
      `reduceChildren expected to receive a component. Instead was given ${component}`
    )
  }
  // TODO
}

export default reduceChildren
