import path from 'path'
import updateTable from './updateTable'
import { createTestContext } from '../../../../test'

beforeEach(() => {
  jest.clearAllMocks()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('#updateTable()', () => {
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

  it('should update an existing table table', async () => {
    const properties = {
      provider,
      tableName: 'update-table',
      provisionedThroughput: {
        ReadCapacityUnits: 10,
        WriteCapacityUnits: 10
      }
    }

    const res = await updateTable(properties)

    expect(res).toEqual({
      TableDescription: {
        TableArn: 'arn:aws:dynamodb:region:XXXXX:table/update-table',
        TableName: 'update-table',
        TableStatus: 'UPDATING',
        ProvisionedThroughput: {
          ReadCapacityUnits: 10,
          WriteCapacityUnits: 10
        }
      }
    })
  })
})
