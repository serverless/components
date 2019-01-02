import { regex } from './regexTypeName'

const isTypeName = (value) => regex.test(value)

export default isTypeName
