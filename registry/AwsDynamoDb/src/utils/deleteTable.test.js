import path from 'path'
import deleteTable from './deleteTable'
import { createTestContext } from '../../../../test'

beforeEach(() => {
  jest.clearAllMocks()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('#deleteTable()', () => {
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

  it('should delete the table', async () => {
    const properties = {
      provider,
      tableName: 'delete-table'
    }

    const res = await deleteTable(properties)

    expect(res).toEqual({
      TableDescription: {
        TableArn: 'arn:aws:dynamodb:region:XXXXX:table/delete-table',
        TableName: 'delete-table',
        TableStatus: 'DELETING'
      }
    })
  })

  it('should skip removal if table was already removed', async () => {
    const properties = {
      provider,
      tableName: 'already-removed-table'
    }

    const res = await deleteTable(properties)

    expect(res).toEqual(true)
  })
})
