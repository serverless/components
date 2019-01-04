import path from 'path'
import describeTimeToLive from './describeTimeToLive'
import { createTestContext } from '../../../../test'

beforeEach(() => {
  jest.clearAllMocks()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('#describeTimeToLive()', () => {
  const cwd = path.resolve(__dirname, '..', '..')
  let context
  let provider

  beforeEach(async () => {
    context = await createTestContext({ cwd })
    const AwsProvider = await context.import('AwsProvider')
    provider = context.construct(AwsProvider, {
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'abc',
        secretAccessKey: 'xyz'
      }
    })
  })

  it('should return TTL information', async () => {
    const properties = {
      provider,
      tableName: 'describe-ttl-table'
    }

    const res = await describeTimeToLive(properties)

    expect(res).toEqual({
      TimeToLiveDescription: {
        TimeToLiveStatus: 'ENABLED',
        AttributeName: 'ttl'
      }
    })
  })
})
