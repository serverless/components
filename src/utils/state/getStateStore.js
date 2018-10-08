import { get, has } from '@serverless/utils'
// TODO BRN: Make this configurable. Perhaps StateStore should be a type?

const STATE_STORES = {
  local: require('./storage/local'),
  awsS3: require('./storage/aws-s3'),
  awsDynamoDB: require('./storage/aws-dynamodb')
}

const getStateStore = (type) => {
  if (!has(type, STATE_STORES)) {
    throw new Error(`Unknown state store type ${type}`)
  }
  return get(type, STATE_STORES)
}

export default getStateStore
