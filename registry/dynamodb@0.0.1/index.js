const ServerlessComponentsEslam = require('serverless-components-eslam')
const { AWS } = ServerlessComponentsEslam

const dynamodb = new AWS.DynamoDB({ region: 'us-east-1' })

const create = (name) => {
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
    TableName: name
  }

  return dynamodb.createTable(params).promise()
}

const remove = (name) => {
  const params = {
    TableName: name
  }

  return dynamodb.deleteTable(params).promise()
}

module.exports = async (inputs, state) => {
  if (!state.name && inputs.name) {
    console.log(`Creating Table: ${inputs.name}`)
    await create(inputs.name)
  } else if (!inputs.name && state.name) {
    console.log(`Removing Table: ${state.name}`)
    await remove(state.name)
  } else if (state.name !== inputs.name) {
    console.log(`Removing Table: ${state.name}`)
    await remove(state.name)
    console.log(`Creating Table: ${inputs.name}`)
    await create(inputs.name)
  }
  console.log('')
  const outputs = {
    name: inputs.name
  }
  return outputs
}
