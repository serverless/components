import { isFunction } from '@serverless/utils'

const isComponent = (value) =>
  !!(
    value != null &&
    isFunction(value.construct) &&
    isFunction(value.define) &&
    isFunction(value.deploy) &&
    isFunction(value.remove)
  )

export default isComponent
