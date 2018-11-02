import { isFunction } from '@serverless/utils'

const isEvaluable = (value) => value != null && isFunction(value.resolve)

export default isEvaluable
