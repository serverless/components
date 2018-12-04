// TODO BRN: import this from 'serverless'
import { SYMBOL_TYPE } from '../../..'
import create from '../../../dist/utils/type/create'

const _Object = {
  async construct(inputs) {
    // NOTE BRN: This method is here as a catch all to avoid errors when a type does not implement a construct method.
    this.inputs = inputs
    return this
  },
  clone() {
    return create(this.getType(), this)
  },
  getType() {
    return this[SYMBOL_TYPE]
  }
}

export default _Object
