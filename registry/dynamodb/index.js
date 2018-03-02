/* eslint-disable no-console */
const AWS = require('aws-sdk')

const createTable = (inputs) => {
  const dynamodb = new AWS.DynamoDB({ region: inputs.region })
  const properties = inputs.Properties
  const tableName = properties.TableName

  let params = { // eslint-disable-line
    TableName: tableName,
    AttributeDefinitions: properties.AttributeDefinitions,
    KeySchema: properties.KeySchema,
    ProvisionedThroughput: {
      ReadCapacityUnits: properties.ProvisionedThroughput.ReadCapacityUnits,
      WriteCapacityUnits: properties.ProvisionedThroughput.WriteCapacityUnits
    }
  }

  // validate params values against allowed values

  if (properties.GlobalSecondaryIndexes) {
    // validate inputs.GlobalSecondaryIndexes
    // if valid add to params
    params.GlobalSecondaryIndexes = properties.GlobalSecondaryIndexes
  }

  if (properties.LocalSecondaryIndexes) {
    // validate inputs.GlobalSecondaryIndexes
    // if valid add to params
    params.LocalSecondaryIndexes = properties.LocalSecondaryIndexes
  }

  if (properties.StreamSpecification) {
    // validate inputs.StreamSpecification
    // if valid add to params
    params.StreamSpecification = properties.StreamSpecification
  }

  const createPromise = dynamodb.createTable(params).promise()

  if (!properties.TimeToLiveSpecification) {
    // no TTL create table and return promise
    return createPromise.then((tableData) => { // eslint-disable-line
      return tableData
    })
  }

  // validate inputs.TimeToLiveSpecification

  // Has TTL specification add it to table
  const TTLparams = {
    TableName: tableName,
    TimeToLiveSpecification: properties.TimeToLiveSpecification
  }

  return createPromise.then((tableData) => { // eslint-disable-line
    const waitForPromise = dynamodb.waitFor('tableExists', {
      TableName: tableName
    }).promise()
    return waitForPromise.then(() => { // eslint-disable-line
      return dynamodb.updateTimeToLive(TTLparams).promise().then(() => { // eslint-disable-line
        return tableData
      })
    })
  })
}

// Need update table for changes in inputs
const updateTable = (inputs, options, state, context) => { // eslint-disable-line

  // Validate input against allowed SDK params

  // If changed or removed, Logic for updating ProvisionedThroughput

  // If changed or removed, Logic for updating StreamSpecification

  // If changed or removed, Logic for updating OR deleting GlobalSecondaryIndexes

  // If changed or removed, Logic for updating OR deleting TimeToLiveSpecification
}


const deleteTable = (state) => {
  const dynamodb = new AWS.DynamoDB({ region: state.region })

  const params = {
    TableName: state.Properties.TableName
  }

  if (state.DeletionPolicy === 'Retain') {
    // return error or state? ¯\_(ツ)_/¯
    return Promise.resolve(state)
  }

  return dynamodb.deleteTable(params).promise().then((data) => data)
}

const deploy = async (inputs, options, state, context) => {
  let tableData
  // No state, create table
  if (!Object.keys(state).length) {
    console.log(`Creating Table: ${inputs.Properties.TableName}`)
    tableData = await createTable(inputs)
    console.log(`Created Table: ${inputs.Properties.TableName}`)
  }

  /*
  TODO update logic diffing needs https://serverlessteam.atlassian.net/browse/SC-55
  } else if (!inputs.name && state.name) {
     context.log(`Removing Table: ${state.Properties.TableName}`)
     // await deleteTable(state)
  } else if (state.name !== inputs.name) {
    context.log(`Removing Table: ${state.Properties.TableName}`)
    // await deleteTable(state)
    context.log(`Creating Table: ${inputs.Properties.TableName}`)
    // await createTable(inputs)
  }
  */

  // Add all inputs to outputs?
  const outputs = {
    name: inputs.name,
    tableData: tableData // eslint-disable-line
  }
  return outputs
}

const remove = async (inputs, options, state, context) => {
  console.log(`Removing Table: ${inputs.Properties.TableName}`)
  const newState = await deleteTable(state)
  console.log(`Removed Table: ${inputs.Properties.TableName}`)
  const outputs = newState
  return outputs
}

module.exports = {
  deploy,
  remove
}
