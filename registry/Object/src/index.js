// TODO BRN: import this from 'serverless'
import { SYMBOL_TYPE } from '../../../dist/utils'

const _Object = {
  async construct(inputs) {
    // NOTE BRN: This method is here as a catch all to avoid errors when a type does not implement a construct method.
    this.inputs = inputs
    return this
  },
  getType() {
    return this[SYMBOL_TYPE]
  }
}

export default _Object
