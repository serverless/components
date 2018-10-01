const mockAuthorize = jest.fn().mockResolvedValue()

jest.mock('googleapis', () => ({
  google: {
    auth: {
      JWT: jest.fn().mockImplementation(() => ({
        authorize: mockAuthorize
      }))
    },
    cloudfunctions: () => ({
      projects: {
        locations: {
          functions: {
            call: jest.fn().mockResolvedValue({ data: { hello: 'world' } })
          }
        }
      }
    })
  }
}))

afterAll(() => {
  jest.restoreAllMocks()
})

beforeEach(() => {
  jest.clearAllMocks()
})

describe('GoogleCloudProvider', () => {
  let googleCloudProvider
  const inputs = {
    clientEmail: 'acme@example-project.iam.gserviceaccount.com',
    privateKey: '-----BEGIN PRIVATE KEY-----\nPR1V4T3K3Y\n-----END PRIVATE KEY-----\n',
    locationId: 'us-east1',
    projectId: 'example-project'
  }

  beforeEach(async () => {
    googleCloudProvider = require('./index')
    await googleCloudProvider.construct(inputs)
  })

  describe('#construct()', () => {
    it('should set the instance parameters', async () => {
      expect(googleCloudProvider.clientEmail).toEqual(inputs.clientEmail)
      expect(googleCloudProvider.privateKey).toEqual(inputs.privateKey)
      expect(googleCloudProvider.locationId).toEqual(inputs.locationId)
      expect(googleCloudProvider.projectId).toEqual(inputs.projectId)
      expect(googleCloudProvider.SDK).not.toBeFalsy()
    })
  })

  describe('#request()', () => {
    it('should authorize and call the provided service with the given parameters', async () => {
      const params = { name: 'projects/example-project/locations/us-east1/functions/my-function' }
      const res = await googleCloudProvider.request(
        'cloudfunctions',
        'v1',
        'projects',
        'locations',
        'functions',
        'call',
        params
      )

      expect(mockAuthorize).toHaveBeenCalledTimes(1)
      expect(res).toEqual({ hello: 'world' })
    })
  })

  describe('#getSDK()', () => {
    it('should provide access to the providers SDK', () => {
      const SDK = googleCloudProvider.getSDK()

      expect(SDK).not.toBeFalsy()
    })
  })
})
