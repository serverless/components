const AWS = require('aws-sdk')

const dynamo = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' })

const writeObject = async (config, content) =>
  dynamo
    .update({
      TableName: config.state.table,
      Key: {
        service: config.state.service
      },
      UpdateExpression: 'set #lock = :lock, #state = :state',
      ExpressionAttributeNames: { '#lock': 'lock', '#state': 'state' },
      ExpressionAttributeValues: {
        ':lock': false,
        ':state': content
      }
    })
    .promise()

module.exports = async (config, content) => {
  return writeObject(config, content)
}
