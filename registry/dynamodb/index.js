/* eslint-disable no-console */

const AWS = require('aws-sdk')
const utils = require('./utils')

// Helper functions
const hasTableNameChanged = (inputs, state) => { // eslint-disable-line arrow-body-style
  return !(inputs.properties.tableName === state.tableDescription.tableName)
}

const hasAttributeDefinitionsChanged = (inputs, state) => { // eslint-disable-line arrow-body-style
  return !utils.isArrayEqual(
    inputs.properties.attributeDefinitions,
    state.tableDescription.attributeDefinitions
  )
}

const hasKeySchemaChanged = (inputs, state) => { // eslint-disable-line arrow-body-style
  const res = utils.isArrayEqual(
    inputs.properties.keySchema,
    state.tableDescription.keySchema
  )
  return !res
}

const hasProvisionedThroughputChanged = (inputs, state) => { // eslint-disable-line arrow-body-style
  // There are some extra keys in the ProvisionedThroughput hash structure
  // that is returned by the AWS calls. To truly detect if input params
  // have changed we need to weed out any extra keys that are not present in the user input
  const objInput = inputs.properties.provisionedThroughput
  const objState = state.tableDescription.provisionedThroughput

  const objNewState = utils.keepCommonItems(objInput, objState)
  return !utils.isJsonEqual(objInput, objNewState)
}

const getDynamoDbInstance = (region) => { // eslint-disable-line arrow-body-style
  return new AWS.DynamoDB({ apiVersion: '2012-08-10', region })
}

const createTable = (inputs) => {
  const ddb = getDynamoDbInstance(inputs.region)
  const { properties } = inputs
  const { tableName } = properties.tableName

  let params = { ...inputs.properties }
  params = utils.convertKeysToCase(params, 'upperCaseFirstCharacter') // eslint-disable-line no-param-reassign

  // TODO: implement validation logic here
  // if (properties.globalSecondaryIndexes) {
  //   // if valid add to params
  //   params.GlobalSecondaryIndexes = properties.globalSecondaryIndexes
  // }

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

const updateProvisionedThroughput = async (inputs) => {
  const ddb = getDynamoDbInstance(inputs.region)
  inputs = utils.convertKeysToCase(inputs, 'upperCaseFirstCharacter') // eslint-disable-line no-param-reassign

  // update provisionedThroughput
  const params = {
    TableName: inputs.Properties.TableName,
    ProvisionedThroughput: inputs.Properties.ProvisionedThroughput
  }
  const res = await ddb.updateTable(params).promise()

  return res
}

const updateAttributeDefinitions = async (inputs) => { // eslint-disable-line no-unused-vars
  const ddb = getDynamoDbInstance(inputs.region)
  inputs = utils.convertKeysToCase(inputs, 'upperCaseFirstCharacter') // eslint-disable-line no-param-reassign

  // update attributeDefinitions
  const params = {
    TableName: inputs.Properties.TableName,
    AttributeDefinitions: inputs.Properties.AttributeDefinitions
  }
  const res = await ddb.updateTable(params).promise()

  return res
}

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

const describeTable = async (inputs) => {
  const ddb = getDynamoDbInstance(inputs.region)

  const res = await ddb.describeTable({
    TableName: inputs.properties.tableName
  }).promise()

  return res
}

const getStatus = async (inputs) => {
  const res = await describeTable(inputs)

  return res.Table.TableStatus
}

const deploy = async (inputs, context) => {
  let res
  let updatedState
  try {
    // no state --> create table
    if (!Object.keys(context.state).length) {
      try {
        context.log(`Creating Table: '${inputs.properties.tableName}'`)
        res = await createTable(inputs)
      } catch (err) {
        console.log(`Error creating table: '${err}'`)
        return {}
      }
    } else if (hasTableNameChanged(inputs, context.state) ||
        hasKeySchemaChanged(inputs, context.state) ||
        hasAttributeDefinitionsChanged(inputs, context.state)) {
      // re-create table
      try {
        context.log(`Deleting Table: '${context.state.properties.tableName}'`)
        res = await deleteTable(context.state)
        context.saveState({})
      } catch (err) {
        console.log(`Error deleting table: '${err}'`)
        return {}
      }
      try {
        context.log(`Re-creating Table: '${inputs.properties.tableName}'`)
        res = await createTable(inputs)
      } catch (err) {
        console.log(`Error re-creating table: '${err}'`)
        return {}
      }
    } else {
      // check if an update is already underway
      const resStatus = await getStatus(inputs)
      if (resStatus === 'ACTIVE') { // eslint-disable-line no-lonely-if
        // provisionedThroughput changed -> update table
        if (hasProvisionedThroughputChanged(inputs, context.state)) {
          try {
            console.log(`Detected ProvisionedThroughput changes. Update initiated for Table: '${inputs.properties.tableName}'`)
            res = await updateProvisionedThroughput(inputs)
          } catch (err) {
            console.log(`Error updating table with provisionedThroughput changes: '${err}'`)
            return {}
          }
        }
        // TODO: GlobalSecondaryIndex changed -> update table
      } else {
        console.log(`Previous updates underway. Cannot update Table: '${inputs.properties.tableName}'. Please try again later.`)
        return {}
      }
    }

    res = utils.convertKeysToCase(res, 'lowerCaseFirstCharacter')

    updatedState = {
      ...context.state,
      ...inputs,
      ...res
    }
    context.saveState(updatedState)
  } catch (err) {
    console.log(`Unhandled Exception: ${err.stack}`)
  }

  return updatedState
}

const remove = async (inputs, context) => {
  if (!context.state.tableDescription ||
      !context.state.tableDescription.tableName) return {}

  inputs = utils.convertKeysToCase(inputs, 'lowerCaseFirstCharacter') // eslint-disable-line no-param-reassign
  try {
    context.log(`Removing Table: '${context.state.properties.tableName}'`)
    await deleteTable(context.state)
    context.saveState({})
  } catch (err) {
    console.log(`Error removing table: '${err}'`)
  }
  return {}
}

const status = async (inputs, context) => {
  if (!context.state.tableDescription ||
      !context.state.tableDescription.tableName) return {}

  const resStatus = await getStatus(inputs)
  context.log(`Status for Table: '${inputs.properties.tableName}' - '${resStatus}'`)

  const updatedState = {
    ...inputs,
    ...context.state
  }
  updatedState.tableDescription.tableStatus = resStatus
  context.saveState(updatedState)

  return updatedState
}

module.exports = {
  deploy,
  remove,
  status
}
