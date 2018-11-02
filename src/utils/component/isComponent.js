import { isFunction } from '@serverless/utils'

const isComponent = (value) =>
  !!(value != null && isFunction(value.deploy) && isFunction(value.remove))

export default isComponent
