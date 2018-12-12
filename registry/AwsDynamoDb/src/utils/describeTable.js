async function describeTable(properties) {
  const { provider, tableName } = properties

  const SDK = provider.getSdk()
  const ddb = new SDK.DynamoDB()

  return ddb.describeTable({ TableName: tableName }).promise()
}

export default describeTable
