import AWS from 'aws-sdk'
import path from 'path'
import { createTestContext } from '../../../test'

jest.mock('aws-sdk', () => {
  const mocks = {
    update: jest.fn()
  }
  return {
    mocks,
    config: {
      update: (obj) => mocks.update(obj)
    }
  }
})

describe('AwsProvider', () => {
  let context
  let AwsProvider

  beforeEach(async () => {
    context = await createTestContext({ cwd: path.join(__dirname, '..') })
    context = await context.loadProject()
    context = await context.loadApp()
    AwsProvider = await context.import('./')
  })

  describe('#construct()', async () => {
    it('should default the region to us-east-1 if it is not set', async () => {
      const inputs = {
        credentials: {
          accessKeyId: 'abc',
          secretAccessKey: 'xyz'
        },
        region: null
      }

      const awsProvider = await context.construct(AwsProvider, inputs)

      expect(awsProvider.region).toEqual('us-east-1')
    })
  })

  describe('#getSdk()', () => {
    it('should return an AWS SDK instance', async () => {
      const inputs = {
        credentials: {
          accessKeyId: 'abc',
          secretAccessKey: 'zxc'
        },
        region: 'us-east-1'
      }

      const awsProvider = await context.construct(AwsProvider, inputs)
      const AwsSdk = awsProvider.getSdk()

      expect(AwsSdk).toEqual(AWS)
      expect(AWS.mocks.update).toBeCalledWith(inputs)
    })
  })

  describe('#getCredentials()', () => {
    it('should return the credentials', async () => {
      const inputs = {
        credentials: {
          accessKeyId: 'abc',
          secretAccessKey: 'zxc'
        },
        region: 'us-east-1'
      }

      const awsProvider = await context.construct(AwsProvider, inputs)
      const credentials = awsProvider.getCredentials()

      expect(credentials).toEqual(inputs)
    })
  })

  describe('#validate()', () => {
    it('should throw if region does not follow naming schema', async () => {
      const inputs = {
        credentials: {
          accessKeyId: 'abc',
          secretAccessKey: 'xyz'
        },
        region: 'us-east' // correct would be 'us-east-1'
      }

      const awsProvider = await context.construct(AwsProvider, inputs)

      expect(() => awsProvider.validate()).toThrow('Invalid region')
    })

    it('should throw if credentials are not set', async () => {
      const inputs = {
        credentials: null,
        region: 'us-east-1'
      }

      const awsProvider = await context.construct(AwsProvider, inputs)

      expect(() => awsProvider.validate()).toThrow('Credentials not set')
    })

    it('should throw if credentials is an empty object', async () => {
      const inputs = {
        credentials: {},
        region: 'us-east-1'
      }

      const awsProvider = await context.construct(AwsProvider, inputs)

      expect(() => awsProvider.validate()).toThrow('Credentials not set')
    })
  })
})
