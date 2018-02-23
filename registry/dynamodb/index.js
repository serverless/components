const AWS = require('aws-sdk')

const createTable = (inputs) => {

  const dynamodb = new AWS.DynamoDB({ region: inputs.TableRegion })

  let params = {
    TableName: inputs.TableName,
    AttributeDefinitions: inputs.AttributeDefinitions,
    KeySchema: inputs.KeySchema,
    ProvisionedThroughput: {
      ReadCapacityUnits: inputs.ProvisionedThroughput.ReadCapacityUnits,
      WriteCapacityUnits: inputs.ProvisionedThroughput.WriteCapacityUnits
    }
  }

  // validate params values against allowed values

  if (inputs.GlobalSecondaryIndexes) {
    // validate inputs.GlobalSecondaryIndexes
    // if valid add to params
    params.GlobalSecondaryIndexes = inputs.GlobalSecondaryIndexes
  }

  if (inputs.LocalSecondaryIndexes) {
    // validate inputs.GlobalSecondaryIndexes
    // if valid add to params
    params.LocalSecondaryIndexes = inputs.LocalSecondaryIndexes
  }

  if (inputs.StreamSpecification) {
    // validate inputs.StreamSpecification
    // if valid add to params
    params.StreamSpecification = inputs.StreamSpecification
  }

  const createPromise = dynamodb.createTable(params).promise()

  if (!inputs.TimeToLiveSpecification) {
    // no TTL create table and return promise
    return createPromise
  }

  // validate inputs.TimeToLiveSpecification

  // Has TTL specification add it to table
  const TTLparams = {
    TableName: inputs.TableName,
    TimeToLiveSpecification: inputs.TimeToLiveSpecification
  }
  return createPromise.then(() => {
    return dynamodb.updateTimeToLive(TTLparams).promise()
  })
}

// Need update table for changes in inputs
const updateTable = (inputs, state) => {

  // Validate input against allowed SDK params

  // If changed or removed, Logic for updating ProvisionedThroughput

  // If changed or removed, Logic for updating StreamSpecification

  // If changed or removed, Logic for updating OR deleting GlobalSecondaryIndexes

  // If changed or removed, Logic for updating OR deleting TimeToLiveSpecification
}


const deleteTable = (state) => {

  const dynamodb = new AWS.DynamoDB({ region: state.TableRegion })

  const params = {
    TableName: state.TableName
  }

  if (state.DeletionPolicy === "Retain") {
    // return error?
    return null
  }

  return dynamodb.deleteTable(params).promise()
}

const deploy = async (inputs, options, state, context) => {
  if (!state.name && inputs.name) {
    context.log(`Creating Table: ${inputs.name}`)
    await createTable(inputs)
  } else if (!inputs.name && state.name) {
    context.log(`Removing Table: ${state.name}`)
    await deleteTable(state)
  } else if (state.name !== inputs.name) {
    context.log(`Removing Table: ${state.name}`)
    await deleteTable(state)
    context.log(`Creating Table: ${inputs.name}`)
    await createTable(inputs)
  }
  // Add all inputs to outputs?
  const outputs = {
    name: inputs.name
  }
  return outputs
}

const remove = async (inputs, options, state, context) => {
  context.log(`Removing Table: ${state.name}`)
  await deleteTable(state)
  const outputs = {
    name: null
  }
  return outputs
}

module.exports = {
  deploy,
  remove
}
