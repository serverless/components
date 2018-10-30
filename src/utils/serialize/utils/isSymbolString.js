const SYMBOL_REGEX = /^@@.*$/

const isSymbolString = (value) => SYMBOL_REGEX.test(value)

export default isSymbolString
