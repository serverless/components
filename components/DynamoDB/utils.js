const { not, equals, pick } = require('../../src/utils')

async function createTable({
  dynamodb,
  name,
  attributeDefinitions,
  keySchema,
  provisionedThroughput
}) {
  const res = await dynamodb
    .createTable({
      TableName: name,
      AttributeDefinitions: attributeDefinitions,
      KeySchema: keySchema,
      ProvisionedThroughput: provisionedThroughput
    })
    .promise()
  return res.TableDescription.TableArn
}

async function describeTable({ dynamodb, name }) {
  let res

  try {
    const data = await dynamodb.describeTable({ TableName: name }).promise()
    const table = data.Table
    res = {
      arn: table.TableArn,
      name: table.TableName,
      attributeDefinitions: table.AttributeDefinitions,
      keySchema: table.KeySchema,
      provisionedThroughput: table.ProvisionedThroughput
    }
  } catch (error) {
    if (error.code === 'ResourceNotFoundException') {
      res = null
    }
  } finally {
    return res
  }
}

async function updateTable({ dynamodb, name, attributeDefinitions, provisionedThroughput }) {
  const res = await dynamodb
    .updateTable({
      TableName: name,
      AttributeDefinitions: attributeDefinitions,
      ProvisionedThroughput: provisionedThroughput
    })
    .promise()
  return res.TableDescription.TableArn
}

async function deleteTable({ dynamodb, name }) {
  let res = false
  try {
    res = await dynamodb
      .deleteTable({
        TableName: name
      })
      .promise()
  } catch (error) {
    if (error.code !== 'ResourceNotFoundException') {
      throw error
    }
  }
  return !!res
}

function configChanged(prevTable, table) {
  const prevInputs = pick(['name', 'attributeDefinitions', 'provisionedThroughput'], prevTable)
  const inputs = pick(['name', 'attributeDefinitions', 'provisionedThroughput'], table)

  delete prevInputs.provisionedThroughput.NumberOfDecreasesToday

  return not(equals(inputs, prevInputs))
}

module.exports = {
  createTable,
  describeTable,
  updateTable,
  deleteTable,
  configChanged
}
