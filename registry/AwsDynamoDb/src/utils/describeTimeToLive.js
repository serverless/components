async function describeTimeToLive(properties) {
  const { provider, tableName } = properties

  const SDK = provider.getSdk()
  const ddb = new SDK.DynamoDB()

  return ddb.describeTimeToLive({ TableName: tableName }).promise()
}

export default describeTimeToLive
