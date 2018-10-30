import { isNumber } from '@serverless/utils'

const serialize = (data) => {
  if (!isNumber(data)) {
    throw new TypeError(`number.serialize expected a number, instead received ${data}`)
  }
  return {
    data,
    type: 'number'
  }
}

export default serialize
