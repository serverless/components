import { isNil } from '@serverless/utils'
import AWS from 'aws-sdk'

const createLockAndFetch = async (config, context) => {
  const dynamo = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' })

  context.log('Checking if state is locked')
  let locked = false
  const { Item } = await dynamo
    .get({
      TableName: config.state.table,
      Key: {
        service: config.state.service
      }
    })
    .promise()

  if (!isNil(Item) && Item.lock === true) {
    locked = true
  }

  if (locked) {
    throw new Error('State is locked')
  }

  await dynamo
    .update({
      TableName: config.state.table,
      Key: {
        service: config.state.service
      },
      UpdateExpression: 'set #lock = :lock',
      ExpressionAttributeNames: { '#lock': 'lock' },
      ExpressionAttributeValues: {
        ':lock': true
      }
    })
    .promise()
  return Item && Item.state ? Item.state : {}
}

const read = async (config, context) => {
  const content = await createLockAndFetch(config, context)
  return content
}

export default read
