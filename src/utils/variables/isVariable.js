import { regex } from './regexVariable'

const isVariable = (value) => regex.test(value)

export default isVariable
