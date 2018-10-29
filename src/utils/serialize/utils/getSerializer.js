import { has } from '@serverless/utils'
import * as serializers from '../serializers'

const getSerializer = (type) => {
  if (has(type, serializers)) {
    return serializers[type]
  }
  return serializers['custom']
}

export default getSerializer
