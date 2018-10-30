import { isString } from '@serverless/utils'

const serialize = (data) => {
  if (!isString(data)) {
    throw new TypeError(`string.serialize expected a string, instead received ${data}`)
  }
  return {
    data,
    type: 'string'
  }
}

export default serialize
