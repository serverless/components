import path from 'path'
import updateTimeToLive from './updateTimeToLive'
import { createTestContext } from '../../../../test'

beforeEach(() => {
  jest.clearAllMocks()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('#updateTimeToLive()', () => {
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

  it('should update a time to live attribute of a table', async () => {
    const properties = {
      provider,
      tableName: 'update-ttl-table',
      timeToLiveSpecification: {
        AttributeName: 'ttl',
        Enabled: true
      }
    }

    const res = await updateTimeToLive(properties)

    expect(res).toEqual({
      TimeToLiveSpecification: {
        AttributeName: 'ttl',
        Enabled: true
      }
    })
  })
})
