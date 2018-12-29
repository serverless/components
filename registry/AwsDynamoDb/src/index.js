import { get, keys, pick, resolve, equals, not } from '@serverless/utils'
import {
  createTable,
  updateTable,
  deleteTable,
  describeTable,
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
    const prevInputs = prevInstance ? pick(keys(inputs), prevInstance) : {}
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
      const res = await describeTable({ provider, tableName })
      this.tableName = res.Table.TableName
      this.attributeDefinitions = res.Table.AttributeDefinitions
      this.keySchema = res.Table.KeySchema
      this.provisionedThroughput = {}
      this.provisionedThroughput.ReadCapacityUnits =
        res.Table.ProvisionedThroughput.ReadCapacityUnits
      this.provisionedThroughput.WriteCapacityUnits =
        res.Table.ProvisionedThroughput.WriteCapacityUnits
      this.globalSecondaryIndexes = res.Table.GlobalSecondaryIndexes
      this.localSecondaryIndexes = res.Table.LocalSecondaryIndexes
      if (res.Table.SSEDescription) {
        this.sseSpecification = {}
        this.sseSpecification.Enabled = res.Table.SSEDescription.Status === 'ENABLED'
        this.sseSpecification.SSEType = res.Table.SSEDescription.SSEType
        this.sseSpecification.KMSMasterKeyId = res.Table.SSEDescription.KMSMasterKeyArn
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
