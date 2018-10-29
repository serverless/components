import { isFunction } from '@serverless/utils'

const hasType = (value) => value != null && isFunction(value.getType)

export default hasType
