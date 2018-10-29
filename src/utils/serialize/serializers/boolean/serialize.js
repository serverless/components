import { isBoolean } from '@serverless/utils'

const serialize = (data) => {
  if (!isBoolean(data)) {
    throw new TypeError(`boolean.serialize expected a boolean, instead received ${data}`)
  }
  return {
    data,
    type: 'boolean'
  }
}

export default serialize
