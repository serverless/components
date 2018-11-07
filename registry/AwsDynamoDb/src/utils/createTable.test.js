import path from 'path'
import createTable from './createTable'
import { createTestContext } from '../../../../test'

beforeEach(() => {
  jest.clearAllMocks()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('#createTable()', () => {
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

  it('should create the table', async () => {
    const properties = {
      provider,
      tableName: 'create-table',
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

    const res = await createTable(properties)

    expect(res).toEqual({
      TableDescription: {
        TableArn: 'arn:aws:dynamodb:region:XXXXX:table/create-table',
        TableName: 'create-table',
        TableStatus: 'CREATING'
      }
    })
  })
})
