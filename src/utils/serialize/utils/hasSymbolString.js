import { curry, has } from '@serverless/utils'

const hasSymbolString = curry(({ symbolMap }, symbol) => has(symbol, symbolMap))

export default hasSymbolString
