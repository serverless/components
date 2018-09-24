import { SYMBOL_TYPE } from '../../utils'

const _Object = {
  construct() {
    return this
  },
  getType() {
    return this[SYMBOL_TYPE]
  }
}

export default _Object
