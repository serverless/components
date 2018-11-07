import AWS from 'aws-sdk'
import path from 'path'
import { deserialize, resolveComponentEvaluables, serialize } from '../../../src/utils'
import { createTestContext } from '../../../test'

beforeEach(async () => {
  jest.clearAllMocks()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('AwsDynamoDb', () => {
  const cwd = path.resolve(__dirname, '..')
  let context
  let provider
  let logSpy
  let AwsProvider
  let AwsDynamoDb

  beforeEach(async () => {
    context = await createTestContext({ cwd })
    logSpy = jest.spyOn(context, 'log')
    AwsProvider = await context.import('AwsProvider')
    AwsDynamoDb = await context.import('./')
    provider = await context.construct(AwsProvider, {
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'abc',
        secretAccessKey: 'xyz'
      }
    })
  })

  it('should deploy the table when none exists', async () => {
    let awsDynamoDb = await context.construct(AwsDynamoDb, {
      provider,
      tableName: 'test-table'
    })
    awsDynamoDb = await context.defineComponent(awsDynamoDb)
    awsDynamoDb = resolveComponentEvaluables(awsDynamoDb)

    await awsDynamoDb.deploy(null, context)

    expect(AWS.mocks.createTableMock).toBeCalledWith({ TableName: 'test-table' })
  })

  it('should update the table if we try to create it and it already exists', async () => {
    let awsDynamoDb = await context.construct(AwsDynamoDb, {
      provider,
      tableName: 'already-created-table'
    })
    awsDynamoDb = await context.defineComponent(awsDynamoDb)
    awsDynamoDb = resolveComponentEvaluables(awsDynamoDb)

    await awsDynamoDb.deploy(null, context)

    expect(AWS.mocks.createTableMock).toBeCalledWith({ TableName: 'already-created-table' })
    expect(AWS.mocks.updateTableMock).toBeCalledWith({ TableName: 'already-created-table' })
  })

  it('should create the table if we try to update but it does not exist', async () => {
    let awsDynamoDb = await context.construct(AwsDynamoDb, {
      provider,
      tableName: 'non-existent-table'
    })
    awsDynamoDb = await context.defineComponent(awsDynamoDb)
    awsDynamoDb = resolveComponentEvaluables(awsDynamoDb)
    await awsDynamoDb.deploy(null, context)

    const prevAwsDynamoDb = await deserialize(serialize(awsDynamoDb, context), context)

    let nextAwsDynamoDb = await context.construct(AwsDynamoDb, {
      provider,
      tableName: 'non-existent-table',
      provisionedThroughput: {
        ReadCapacityUnits: 10,
        WriteCapacityUnits: 10
      }
    })
    nextAwsDynamoDb = await context.defineComponent(nextAwsDynamoDb, prevAwsDynamoDb)
    nextAwsDynamoDb = resolveComponentEvaluables(nextAwsDynamoDb)

    await nextAwsDynamoDb.deploy(prevAwsDynamoDb, context)

    expect(AWS.mocks.updateTableMock).toBeCalledWith({
      TableName: 'non-existent-table',
      ProvisionedThroughput: {
        ReadCapacityUnits: 10,
        WriteCapacityUnits: 10
      }
    })
    expect(AWS.mocks.createTableMock).toBeCalledWith({ TableName: 'non-existent-table' })
  })

  it('should replace the table when the table name has changed', async () => {
    let awsDynamoDb = await context.construct(AwsDynamoDb, {
      provider,
      tableName: 'test-table'
    })
    awsDynamoDb = await context.defineComponent(awsDynamoDb)
    awsDynamoDb = resolveComponentEvaluables(awsDynamoDb)
    await awsDynamoDb.deploy(null, context)

    const prevAwsDynamoDb = await deserialize(serialize(awsDynamoDb, context), context)

    let nextAwsDynamoDb = await context.construct(AwsDynamoDb, {
      provider,
      tableName: 'updated-test-table'
    })
    nextAwsDynamoDb = await context.defineComponent(nextAwsDynamoDb, prevAwsDynamoDb)
    nextAwsDynamoDb = resolveComponentEvaluables(nextAwsDynamoDb)

    await nextAwsDynamoDb.deploy(prevAwsDynamoDb, context)

    expect(AWS.mocks.createTableMock).toBeCalledWith({ TableName: 'updated-test-table' })
  })

  it('should update the table when table attributes are changed', async () => {
    let awsDynamoDb = await context.construct(AwsDynamoDb, {
      provider,
      tableName: 'test-table'
    })
    awsDynamoDb = await context.defineComponent(awsDynamoDb)
    awsDynamoDb = resolveComponentEvaluables(awsDynamoDb)
    await awsDynamoDb.deploy(null, context)

    const prevAwsDynamoDb = await deserialize(serialize(awsDynamoDb, context), context)

    let nextAwsDynamoDb = await context.construct(AwsDynamoDb, {
      provider,
      tableName: 'test-table',
      provisionedThroughput: {
        ReadCapacityUnits: 10,
        WriteCapacityUnits: 10
      },
      // NOTE: this is not supported right now
      globalSecondaryIndexes: [
        {
          IndexName: 'index-one',
          KeySchema: [{ AttributeName: 'id', KeyType: 'Hash' }],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
          }
        }
      ]
    })
    nextAwsDynamoDb = await context.defineComponent(nextAwsDynamoDb, prevAwsDynamoDb)
    nextAwsDynamoDb = resolveComponentEvaluables(nextAwsDynamoDb)

    await nextAwsDynamoDb.deploy(prevAwsDynamoDb, context)

    const gsiSupportLog = !!logSpy.mock.calls
      .filter((msg) => msg[0].includes('Skipping GlobalSecondaryIndex updates'))
      .shift()

    expect(AWS.mocks.updateTableMock).toBeCalledWith({
      TableName: 'test-table',
      ProvisionedThroughput: {
        ReadCapacityUnits: 10,
        WriteCapacityUnits: 10
      }
    })
    expect(gsiSupportLog).toEqual(true)
  })

  it('should preserve props if nothing changed', async () => {
    let awsDynamoDb = await context.construct(AwsDynamoDb, {
      provider,
      tableName: 'test-table'
    })

    awsDynamoDb = await context.defineComponent(awsDynamoDb)
    awsDynamoDb = resolveComponentEvaluables(awsDynamoDb)
    await awsDynamoDb.deploy(null, context)

    const prevAwsDynamoDb = await deserialize(serialize(awsDynamoDb, context), context)

    let nextAwsDynamoDb = await context.construct(AwsDynamoDb, {
      provider,
      tableName: 'test-table'
    })
    nextAwsDynamoDb = await context.defineComponent(nextAwsDynamoDb, prevAwsDynamoDb)
    nextAwsDynamoDb = resolveComponentEvaluables(nextAwsDynamoDb)
    expect(nextAwsDynamoDb).toEqual(prevAwsDynamoDb)
  })

  it('should remove the table', async () => {
    let awsDynamoDb = await context.construct(AwsDynamoDb, {
      provider,
      tableName: 'test-table'
    })
    awsDynamoDb = await context.defineComponent(awsDynamoDb)
    awsDynamoDb = resolveComponentEvaluables(awsDynamoDb)
    await awsDynamoDb.deploy(null, context)

    const prevAwsDynamoDb = await deserialize(serialize(awsDynamoDb, context), context)
    await prevAwsDynamoDb.remove(context)

    expect(AWS.mocks.deleteTableMock).toBeCalledWith({ TableName: 'test-table' })
  })

  it('should remove the table even if it does not exist anymore', async () => {
    let awsDynamoDb = await context.construct(AwsDynamoDb, {
      provider,
      tableName: 'already-removed-table'
    })
    awsDynamoDb = await context.defineComponent(awsDynamoDb)
    awsDynamoDb = resolveComponentEvaluables(awsDynamoDb)
    await awsDynamoDb.deploy(null, context)

    const prevAwsDynamoDb = await deserialize(serialize(awsDynamoDb, context), context)
    await prevAwsDynamoDb.remove(context)

    expect(AWS.mocks.deleteTableMock).toBeCalledWith({ TableName: 'already-removed-table' })
  })

  it('shouldDeploy should return undefined when no changes have occurred', async () => {
    let awsDynamoDb = await context.construct(AwsDynamoDb, {
      provider,
      tableName: 'test-table'
    })
    awsDynamoDb = await context.defineComponent(awsDynamoDb)
    awsDynamoDb = resolveComponentEvaluables(awsDynamoDb)
    await awsDynamoDb.deploy(null, context)

    const prevAwsDynamoDb = await deserialize(serialize(awsDynamoDb, context), context)

    let nextAwsDynamoDb = await context.construct(AwsDynamoDb, {
      provider: await context.construct(AwsProvider, {}),
      tableName: 'test-table'
    })
    nextAwsDynamoDb = await context.defineComponent(nextAwsDynamoDb, prevAwsDynamoDb)
    nextAwsDynamoDb = resolveComponentEvaluables(awsDynamoDb)

    const result = nextAwsDynamoDb.shouldDeploy(prevAwsDynamoDb, context)

    expect(result).toBe(undefined)
  })

  it('shouldDeploy should returns "replace" when table name has changed', async () => {
    let awsDynamoDb = await context.construct(AwsDynamoDb, {
      provider,
      tableName: 'test-table'
    })
    awsDynamoDb = await context.defineComponent(awsDynamoDb)
    awsDynamoDb = resolveComponentEvaluables(awsDynamoDb)
    await awsDynamoDb.deploy(null, context)

    const prevAwsDynamoDb = await deserialize(serialize(awsDynamoDb, context), context)

    let nextAwsDynamoDb = await context.construct(AwsDynamoDb, {
      provider,
      tableName: 'updated-test-table'
    })
    nextAwsDynamoDb = await context.defineComponent(nextAwsDynamoDb, prevAwsDynamoDb)
    nextAwsDynamoDb = resolveComponentEvaluables(nextAwsDynamoDb)

    const result = nextAwsDynamoDb.shouldDeploy(prevAwsDynamoDb, context)

    expect(result).toBe('replace')
  })
})
