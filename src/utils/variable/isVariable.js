import { SYMBOL_VARIABLE } from '../constants'

const isVariable = (value) => !!value && !!value[SYMBOL_VARIABLE]

export default isVariable
