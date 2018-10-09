import isVariable from './isVariable'

const resolve = (value) => {
  if (isVariable(value)) {
    console.log(`Detected variable - ${value.toVariableString()}`)
    console.log(value.valueOf())
    return value.valueOf()
  }
  return value
}

export default resolve
