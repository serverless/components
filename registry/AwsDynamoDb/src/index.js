import { get, keys, pick, omit, resolve, equals, not } from '@serverless/utils'
import {
  createTable,
  updateTable,
  deleteTable,
  describeTable,
  describeTimeToLive,
  ensureTable,
  updateTimeToLive
} from './utils'

const AwsDynamoDb = {
  shouldDeploy(prevInstance) {
    const inputs = {
      attributeDefinitions: this.attributeDefinitions,
      provisionedThroughput: this.provisionedThroughput,
      globalSecondaryIndexes: this.globalSecondaryIndexes,
      sseSpecification: this.sseSpecification,
      streamSpecification: this.streamSpecification,
      timeToLiveSpecification: this.timeToLiveSpecification
    }
    let prevInputs = prevInstance ? pick(keys(inputs), prevInstance) : {}

    // remove the TTL inputs since TTL is managed via separate AWS SDK calls
    if (prevInputs.timeToLiveSpecification) {
      prevInputs = omit(['timeToLiveSpecification'], prevInputs)
    }

    const configChanged = not(equals(inputs, prevInputs))

    if (!prevInstance || configChanged) {
      return 'deploy'
    } else if (
      prevInstance.tableName !== this.tableName ||
      not(equals(prevInstance.keySchema, this.keySchema))
    ) {
      return 'replace'
    }
  },

  async sync() {
    let { provider, tableName } = this
    provider = resolve(provider)
    tableName = resolve(tableName)

    try {
      // sync the main table properties
      const describeTableRes = await describeTable({ provider, tableName })
      this.tableName = describeTableRes.Table.TableName
      this.attributeDefinitions = describeTableRes.Table.AttributeDefinitions
      this.keySchema = describeTableRes.Table.KeySchema
      this.provisionedThroughput = {}
      this.provisionedThroughput.ReadCapacityUnits =
        describeTableRes.Table.ProvisionedThroughput.ReadCapacityUnits
      this.provisionedThroughput.WriteCapacityUnits =
        describeTableRes.Table.ProvisionedThroughput.WriteCapacityUnits
      this.globalSecondaryIndexes = describeTableRes.Table.GlobalSecondaryIndexes
      this.localSecondaryIndexes = describeTableRes.Table.LocalSecondaryIndexes
      if (describeTableRes.Table.SSEDescription) {
        this.sseSpecification = {}
        this.sseSpecification.Enabled = describeTableRes.Table.SSEDescription.Status === 'ENABLED'
        this.sseSpecification.SSEType = describeTableRes.Table.SSEDescription.SSEType
        this.sseSpecification.KMSMasterKeyId = describeTableRes.Table.SSEDescription.KMSMasterKeyArn
      }
      // sync the TTL properties
      const describeTimeToLiveRes = await describeTimeToLive({ provider, tableName })
      if (describeTimeToLiveRes.TimeToLiveDescription) {
        this.timeToLiveSpecification = {}
        this.timeToLiveSpecification.AttributeName =
          describeTimeToLiveRes.TimeToLiveDescription.AttributeName
        this.timeToLiveSpecification.Enabled =
          describeTimeToLiveRes.TimeToLiveDescription.TimeToLiveStatus === 'ENABLED'
      }
    } catch (error) {
      if (error.code === 'ResourceNotFoundException') {
        return 'removed'
      }
      throw error
    }
  },

  async deploy(prevInstance, context) {
    const tableName = get('tableName', this)
    if (
      (prevInstance &&
        not(equals(prevInstance.provisionedThroughput, this.provisionedThroughput))) ||
      (prevInstance &&
        (not(equals(prevInstance.attributeDefinitions, this.attributeDefinitions)) ||
          not(equals(prevInstance.globalSecondaryIndexes, this.globalSecondaryIndexes)) ||
          not(equals(prevInstance.sseSpecification, this.sseSpecification)) ||
          not(equals(prevInstance.streamSpecification, this.streamSpecification))))
    ) {
      context.log(`Updating table: '${tableName}'`)
      if (not(equals(prevInstance.globalSecondaryIndexes, this.globalSecondaryIndexes))) {
        context.log(
          `Skipping GlobalSecondaryIndex updates for table '${tableName}' (currently not supported)`
        )
      }
      await ensureTable(updateTable, this)
      context.log(`Table updated: '${tableName}'`)
    } else if (
      prevInstance &&
      not(equals(prevInstance.timeToLiveSpecification, this.timeToLiveSpecification))
    ) {
      context.log(`Updating time to live of the table: '${tableName}'`)
      await updateTimeToLive(this)
      context.log(`Time to live of the table updated: '${tableName}'`)
    } else {
      context.log(`Creating table: '${tableName}'`)
      await ensureTable(createTable, this)
      context.log(`Table created: '${tableName}'`)

      if (this.timeToLiveSpecification) {
        context.log(`Updating time to live of the table: '${tableName}'`)
        await updateTimeToLive(this)
        context.log(`Time to live of the table updated: '${tableName}'`)
      }
    }
  },

  async remove(context) {
    context.log(`Removing table: '${this.tableName}'`)
    await deleteTable(this)
  },

  async info() {
    return {
      title: this.name,
      type: this.name,
      data: pick(['name', 'license', 'version', 'tableName'], this)
    }
  }
}

export default AwsDynamoDb
