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
      for (let j = 0; j < obj[i].length; j++) { // eslint-disable-line no-plusplus
        output[i[caseFunc]()].push(convertKeysToCase(obj[i][j], caseFunc))
      }
    } else {
      output[i[caseFunc]()] = obj[i]
    }
  }
  return output
}

function isJsonEqual(obj1, obj2) {
  return JSON.stringify(obj1) === JSON.stringify(obj2)
}

function isArrayEqual(arr1, arr2) {
  return arr1.length === arr2.length && arr1.every((v, i) => isJsonEqual(v, arr2[i]))
}

function keepCommonItems(leftObj, rightObj) {
  let newObj = {} // eslint-disable-line prefer-const
  Object.keys(rightObj).forEach((k) => {
    if (Object.keys(leftObj).includes(k)) {
      newObj[`${k}`] = rightObj[k]
    }
  })
  return newObj
}

module.exports = {
  convertKeysToCase,
  isJsonEqual,
  isArrayEqual,
  keepCommonItems
}
