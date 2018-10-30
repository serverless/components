import { assign, objectCreate } from '@serverless/utils'
import { SYMBOL_TYPE } from '../constants'

const create = (Type, props) => {
  const instance = assign(objectCreate(Type.constructor.prototype), props)
  instance[SYMBOL_TYPE] = Type
  return instance
}

export default create
