async function updateTimeToLive(properties) {
  const { provider, tableName, timeToLiveSpecification } = properties

  const SDK = provider.getSdk()
  const ddb = new SDK.DynamoDB()

  await ddb.waitFor('tableExists', { TableName: tableName }).promise()

  return ddb
    .updateTimeToLive({
      TableName: tableName,
      TimeToLiveSpecification: timeToLiveSpecification
    })
    .promise()
}

export default updateTimeToLive
