import { regex } from './regexRegistryQuery'

const isTypeRegistryQuery = (value) => regex.test(value)

export default isTypeRegistryQuery
