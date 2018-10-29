import { isInfinity } from '@serverless/utils'

const serialize = (data) => {
  if (!isInfinity(data)) {
    throw new TypeError(`infinity.serialize expected Infinity, instead received ${data}`)
  }
  return {
    negative: -Infinity === +data,
    type: 'infinity'
  }
}

export default serialize
