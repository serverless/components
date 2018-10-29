import { isDate } from '@serverless/utils'

const serialize = (data) => {
  if (!isDate(data)) {
    throw new TypeError(`date.serialize expected a Date object, instead received ${data}`)
  }
  return {
    data: data.toString(),
    type: 'date'
  }
}

export default serialize
