import { curry, findKdx } from '@serverless/utils'

const findSymbol = curry((context, symbolString) =>
  findKdx((value) => value === symbolString, context.symbolMap)
)

export default findSymbol
