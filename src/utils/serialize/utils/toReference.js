import { curry } from '@serverless/utils'
import generateReferenceKey from './generateReferenceKey'

const toReference = curry((context, value) => ({
  '@@ref': generateReferenceKey(context, value)
}))

export default toReference
