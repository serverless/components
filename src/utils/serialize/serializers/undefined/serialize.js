import { isUndefined } from '@serverless/utils'

const serialize = (data) => {
  if (!isUndefined(data)) {
    throw new TypeError(`undefined.serialize expected undefined, instead received ${data}`)
  }
  return {
    type: 'undefined'
  }
}

export default serialize
