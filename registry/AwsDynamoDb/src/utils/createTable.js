const createTable = async (properties) => {
  const {
    provider,
    tableName,
    attributeDefinitions,
    keySchema,
    provisionedThroughput,
    globalSecondaryIndexes,
    localSecondaryIndexes,
    sseSpecification,
    streamSpecification
  } = properties

  const SDK = provider.getSdk()
  const ddb = new SDK.DynamoDB()

  return ddb
    .createTable({
      TableName: tableName,
      AttributeDefinitions: attributeDefinitions,
      KeySchema: keySchema,
      ProvisionedThroughput: provisionedThroughput,
      GlobalSecondaryIndexes: globalSecondaryIndexes,
      LocalSecondaryIndexes: localSecondaryIndexes,
      SSESpecification: sseSpecification,
      StreamSpecification: streamSpecification
    })
    .promise()
}

export default createTable
