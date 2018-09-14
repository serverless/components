function haveInputsChanged(componentData, inputFields) {
  const hasChanged = inputFields.map((k) => componentData.keys.includes(k))
  return !componentData.isEqual && hasChanged.includes(true)
}

module.exports = haveInputsChanged
