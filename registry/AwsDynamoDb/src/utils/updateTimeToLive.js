const updateTimeToLive = async (properties) => {
  const { provider, tableName, timeToLiveSpecification } = properties

  const SDK = provider.getSdk()
  const ddb = new SDK.DynamoDB()

  return ddb
    .waitFor('tableExists', { TableName: tableName })
    .promise()
    .then(function() {
      return ddb
        .updateTimeToLive({
          TableName: tableName,
          TimeToLiveSpecification: timeToLiveSpecification
        })
        .promise()
    })
}

export default updateTimeToLive
