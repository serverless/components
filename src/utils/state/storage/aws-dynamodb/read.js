const AWS = require('aws-sdk')
const { isNil } = require('ramda')
const dynamo = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' })

const { log } = require('../../../../utils/logging')
const createLockAndFetch = async (config) => {
  log('Checking if state is locked')
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

module.exports = async (config) => {
  const content = await createLockAndFetch(config)
  return content
}
