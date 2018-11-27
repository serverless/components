const updateTable = async (properties) => {
  const {
    provider,
    tableName,
    attributeDefinitions,
    provisionedThroughput,
    sseSpecification,
    streamSpecification
  } = properties

  const SDK = provider.getSdk()
  const ddb = new SDK.DynamoDB()

  return ddb
    .updateTable({
      TableName: tableName,
      AttributeDefinitions: attributeDefinitions,
      // TODO: update support for GlobalSecondaryIndexeUpdates
      // GlobalSecondaryIndexeUpdates
      ProvisionedThroughput: provisionedThroughput,
      SSESpecification: sseSpecification,
      StreamSpecification: streamSpecification
    })
    .promise()
}

export default updateTable
