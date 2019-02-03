const { mergeDeepRight, pick, equals } = require('../../src/utils')
const AWS = require('aws-sdk')

const { createTable, deleteTable, describeTable, updateTable, configChanged } = require('./utils')

const Component = require('../Component/serverless')

const outputs = ['name', 'arn']

const defaults = {
  name: 'serverless',
  attributeDefinitions: [
    {
      AttributeName: 'id',
      AttributeType: 'S'
    }
  ],
  keySchema: [
    {
      AttributeName: 'id',
      KeyType: 'HASH'
    }
  ],
  provisionedThroughput: {
    ReadCapacityUnits: 1,
    WriteCapacityUnits: 1
  }
}

class DynamoDB extends Component {
  async default(inputs = {}) {
    const config = mergeDeepRight(defaults, inputs)
    const dynamodb = new AWS.DynamoDB()

    const prevTable = await describeTable({ dynamodb, name: this.state.name || null })

    if (!prevTable) {
      this.cli.status('Creating Table')
      config.arn = await createTable({ dynamodb, ...config })
    } else {
      config.arn = prevTable.arn

      if (configChanged(prevTable, config)) {
        this.cli.status('Updating Table')
        if (!equals(prevTable.name, config.name)) {
          await deleteTable({ dynamodb, name: prevTable.name })
          config.arn = await createTable({ dynamodb, ...config })
        } else {
          await updateTable({ dynamodb, ...config })
        }
      }
    }

    this.state.arn = config.arn
    this.state.name = config.name
    this.save()

    this.cli.success('Table Deployed')

    this.cli.log('')
    this.cli.output('Name', `${config.name}`)
    this.cli.output('ARN', ` ${config.arn}`)

    return pick(outputs, config)
  }

  async remove(inputs = {}) {
    const config = mergeDeepRight(defaults, inputs)
    config.name = inputs.name || this.state.name || defaults.name

    const dynamodb = new AWS.DynamoDB()
    this.cli.status('Removing Table')
    await deleteTable({ dynamodb, ...config })

    this.state = {}
    this.save()

    this.cli.success('Table Removed')
    this.cli.output('Name', `   ${config.name}`)

    return pick(outputs, config)
  }
}

module.exports = DynamoDB
