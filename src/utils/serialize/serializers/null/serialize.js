import { isNull } from '@serverless/utils'

const serialize = (data) => {
  if (!isNull(data)) {
    throw new TypeError(`null.serialize expected a null value, instead received ${data}`)
  }
  return {
    type: 'null'
  }
}

export default serialize
