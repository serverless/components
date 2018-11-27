import AWS from 'aws-sdk'
import path from 'path'
import createTable from './createTable'
import updateTable from './updateTable'
import ensureTable from './ensureTable'
import { createTestContext } from '../../../../test'

beforeEach(() => {
  jest.clearAllMocks()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('#ensureTable()', () => {
  const cwd = path.resolve(__dirname, '..', '..')
  let context
  let provider

  beforeEach(async () => {
    context = await createTestContext({ cwd })
    const AwsProvider = await context.import('AwsProvider')
    provider = await context.construct(AwsProvider, {
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'abc',
        secretAccessKey: 'xyz'
      }
    })
  })

  it('should create the table if everything is fine', async () => {
    const properties = {
      provider,
      tableName: 'test-table'
    }

    await ensureTable(createTable, properties)

    expect(AWS.mocks.createTableMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.updateTableMock).not.toHaveBeenCalled()
  })

  it('should update the table if everything is fine', async () => {
    const properties = {
      provider,
      tableName: 'test-table'
    }

    await ensureTable(updateTable, properties)

    expect(AWS.mocks.createTableMock).not.toHaveBeenCalled()
    expect(AWS.mocks.updateTableMock).toHaveBeenCalledTimes(1)
  })

  it('should update the table if we try to create it but it already exists', async () => {
    const properties = {
      provider,
      tableName: 'already-created-table'
    }

    await ensureTable(createTable, properties)

    expect(AWS.mocks.createTableMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.updateTableMock).toHaveBeenCalledTimes(1)
  })

  it('should create the table if we try to update it but it does not exist', async () => {
    const properties = {
      provider,
      tableName: 'non-existent-table'
    }

    await ensureTable(updateTable, properties)

    expect(AWS.mocks.createTableMock).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.updateTableMock).toHaveBeenCalledTimes(1)
  })
})
