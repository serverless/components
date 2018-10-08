import { SYMBOL_KEY } from '../constants'

const setKey = (key, value) => {
  value[SYMBOL_KEY] = key
  return value
}

export default setKey
