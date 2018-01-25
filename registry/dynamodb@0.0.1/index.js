const AWS = require('aws-sdk')

const createTable = (tableName) => {
  // todo get api keys from inputs
  const dynamodb = new AWS.DynamoDB({ region: 'us-east-1' }) // todo move to inputs
  const params = {
    AttributeDefinitions: [
      {
        AttributeName: 'repo',
        AttributeType: 'S'
      }
    ],
    KeySchema: [
      {
        AttributeName: 'repo',
        KeyType: 'HASH'
      }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 1,
      WriteCapacityUnits: 1
    },
    TableName: tableName
  }

  return dynamodb.createTable(params).promise()
}

const deleteTable = (tableName) => {
  // todo get api keys from inputs
  const dynamodb = new AWS.DynamoDB({ region: 'us-east-1' }) // todo move to inputs
  const params = {
    TableName: tableName
  }

  return dynamodb.deleteTable(params).promise()
}

module.exports = async (inputs, state) => {
  if (state.tableName === inputs.tableName) {
    console.log('DynamoDB is up to date!')
  } else if (!state.tableName && inputs.tableName) {
    await createTable(inputs.tableName)
    console.log(`Table ${inputs.tableName} created`)
  } else if (!inputs.tableName && state.tableName) {
    await deleteTable(state.tableName)
    console.log(`Table ${state.tableName} deleted`)
  } else if (state.tableName !== inputs.tableName) {
    await deleteTable(state.tableName)
    console.log(`Table ${state.tableName} deleted`)
    await createTable(inputs.tableName)
    console.log(`Table ${inputs.tableName} created`)
  }
  const outputs = {
    table: inputs.tableName
  }
  return outputs
}
