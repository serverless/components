import { isNaN } from '@serverless/utils'

const serialize = (data) => {
  if (!isNaN(data)) {
    throw new TypeError(`nan.serialize expected NaN, instead received ${data}`)
  }
  return {
    type: 'nan'
  }
}

export default serialize
