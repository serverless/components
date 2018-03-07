// NOTE: extending the String prototype here
// TODO: update so that it can handle strings like SSESpecification
// eslint-disable-next-line no-extend-native
String.prototype.upperCaseFirstCharacter = function () {
  return this.charAt(0).toUpperCase() + this.slice(1)
}
// eslint-disable-next-line no-extend-native
String.prototype.lowerCaseFirstCharacter = function () {
  return this.charAt(0).toLowerCase() + this.slice(1)
}

function convertKeysToCase(obj, caseFunc) {
  const output = {}
  let i
  // eslint-disable-next-line no-restricted-syntax
  for (i in obj) {
    if (Object.prototype.toString.apply(obj[i]) === '[object Object]') {
      output[i[caseFunc]()] = convertKeysToCase(obj[i], caseFunc)
    } else if (Object.prototype.toString.apply(obj[i]) === '[object Array]') {
      output[i[caseFunc]()] = []
      output[i[caseFunc]()].push(convertKeysToCase(obj[i][0], caseFunc))
    } else {
      output[i[caseFunc]()] = obj[i]
    }
  }
  return output
}

module.exports = {
  convertKeysToCase
}
