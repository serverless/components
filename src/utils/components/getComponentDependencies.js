const {
  is, replace, match, forEachObjIndexed, test
} = require('ramda')

module.exports = (inputs) => {
  console.log(inputs)
  const dependencies = []
  const regex = RegExp('\\${([ ~:a-zA-Z0-9._\'",\\-\\/\\(\\)]+?)}', 'g') // eslint-disable-line

  const iterate = (value) => {
    if (is(Object, value) || is(Array, value)) {
      return forEachObjIndexed(iterate, value)
    }
    if (is(String, value) && test(regex, value)) {
      const referencedVariable = replace(/[${}]/g, '', match(regex, value)[0]).split('.')
      // console.log(referencedVariable)
      if (referencedVariable[1] === 'outputs' || referencedVariable[1] === 'state') {
        dependencies.push(referencedVariable[0])
      }
    }
    return value
  }
  forEachObjIndexed(iterate, inputs)
  return dependencies
}
