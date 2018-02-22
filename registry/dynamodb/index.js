const AWS = require('aws-sdk')

const dynamodb = new AWS.DynamoDB({ region: 'us-east-1' })

const createTable = (name) => {
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

const deleteTable = (name) => {
  const params = {
    TableName: name
  }

  return dynamodb.deleteTable(params).promise()
}

const deploy = async (inputs, state, context) => {
  if (!state.name && inputs.name) {
    context.log(`Creating Table: ${inputs.name}`)
    await createTable(inputs.name)
  } else if (!inputs.name && state.name) {
    context.log(`Removing Table: ${state.name}`)
    await deleteTable(state.name)
  } else if (state.name !== inputs.name) {
    context.log(`Removing Table: ${state.name}`)
    await deleteTable(state.name)
    context.log(`Creating Table: ${inputs.name}`)
    await createTable(inputs.name)
  }
  const outputs = {
    name: inputs.name
  }
  return outputs
}

const remove = async (inputs, state, context) => {
  context.log(`Removing Table: ${state.name}`)
  await deleteTable(state.name)
  const outputs = {
    name: null
  }
  return outputs
}

module.exports = {
  deploy,
  remove
}
