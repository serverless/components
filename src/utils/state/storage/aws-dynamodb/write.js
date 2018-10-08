import AWS from 'aws-sdk'

// TODO BRN: Add configuration of AWS creds (perhaps StateStorage should be a type?)
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

const write = async (config, content) => writeObject(config, content)

export default write
