import { curry, get } from '@serverless/utils'

const getSymbolString = curry(({ symbolMap }, symbol) => get(symbol, symbolMap))

export default getSymbolString
