const AWS = require('aws-sdk')
const { convertKeysToCase } = require('./utils')

function getDynamoDbInstance(region) {
  return new AWS.DynamoDB({ region })
}

const createTable = (inputs) => {
  const ddb = getDynamoDbInstance(inputs.region)
  const { properties } = inputs
  const { tableName } = properties.tableName

  const params = {
    TableName: tableName,
    AttributeDefinitions: properties.attributeDefinitions,
    KeySchema: properties.keySchema,
    ProvisionedThroughput: {
      ReadCapacityUnits: properties.provisionedThroughput.readCapacityUnits,
      WriteCapacityUnits: properties.provisionedThroughput.writeCapacityUnits
    }
  }

  // TODO: implement validation logic here
  if (properties.globalSecondaryIndexes) {
    // if valid add to params
    params.GlobalSecondaryIndexes = properties.globalSecondaryIndexes
  }

  if (properties.localSecondaryIndexes) {
    // if valid add to params
    params.LocalSecondaryIndexes = properties.localSecondaryIndexes
  }

  if (properties.streamSpecification) {
    // if valid add to params
    params.StreamSpecification = properties.streamSpecification
  }

  const createPromise = ddb.createTable(params).promise()

  if (!properties.timeToLiveSpecification) {
    // no TTL create table and return promise
    return createPromise.then((tableData) => tableData)
  }

  // validate inputs.TimeToLiveSpecification

  // Has TTL specification add it to table
  const TTLparams = {
    TableName: tableName,
    TimeToLiveSpecification: properties.timeToLiveSpecification
  }

  return createPromise.then((tableData) => {
    const waitForPromise = ddb
      .waitFor('tableExists', {
        TableName: tableName
      })
      .promise()
    return waitForPromise.then(() =>
      ddb
        .updateTimeToLive(TTLparams)
        .promise()
        .then(() => tableData))
  })
}

// TODO: implement
const updateTable = (inputs, context) => {} // eslint-disable-line

const deleteTable = (state) => {
  const ddb = getDynamoDbInstance(state.region)

  const params = {
    TableName: state.properties.tableName
  }

  if (state.deletionPolicy === 'Retain') {
    // return error or state? ¯\_(ツ)_/¯
    return Promise.resolve(state)
  }

  return ddb
    .deleteTable(params)
    .promise()
    .then((data) => data)
}

const deploy = async (inputs, context) => {
  inputs = convertKeysToCase(inputs, 'lowerCaseFirstCharacter') // eslint-disable-line no-param-reassign

  let res
  // no state --> create table
  if (!Object.keys(context.state).length) {
    context.log(`Creating Table: ${inputs.properties.tableName}`)
    res = await createTable(inputs)
    context.log(`Created Table: ${inputs.properties.tableName}`)
  }
  // TODO: update logic diffing needs https://serverlessteam.atlassian.net/browse/SC-55

  res = convertKeysToCase(res, 'lowerCaseFirstCharacter')

  const updatedState = {
    ...context.state,
    ...res
  }
  context.saveState(updatedState)

  return updatedState
}

const remove = async (inputs, context) => {
  inputs = convertKeysToCase(inputs, 'lowerCaseFirstCharacter') // eslint-disable-line no-param-reassign
  context.log(`Removing Table: ${inputs.properties.tableName}`)
  await deleteTable(context.state)
}

module.exports = {
  deploy,
  remove
}
