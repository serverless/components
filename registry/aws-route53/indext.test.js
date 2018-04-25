const AWS = require('aws-sdk') // eslint-disable-line
const route53Component = require('./index')

jest.mock('aws-sdk', () => {
  const mocks = {
    changeResourceRecordSetsMock: jest.fn().mockImplementation((params) => {
      if (params.HostedZoneId === 'doesNotExist') {
        return Promise.reject(new Error('No hosted zone found with ID'))
      }
      return Promise.resolve()
    })
  }

  const Route53 = {
    changeResourceRecordSets: (obj) => ({
      promise: () => mocks.changeResourceRecordSetsMock(obj)
    })
  }
  return {
    mocks,
    Route53: jest.fn().mockImplementation(() => Route53)
  }
})

afterEach(() => {
  AWS.mocks.changeResourceRecordSetsMock.mockClear()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('Route53 Component Unit Tests', () => {
  it('should NOT throw an error if distribution does not exist', async () => {
    const route53ContextMock = {
      state: {
        name: 'abc',
        hostedZone: {
          name: 'abc',
          id: 'doesNotExist'
        }
      },
      archive: {},
      log: () => {},
      saveState: () => {}
    }

    const inputs = {
      domainName: 'abc',
      dnsName: 'abc'
    }

    await expect(route53Component.remove(inputs, route53ContextMock)).resolves.toEqual({})
    expect(AWS.Route53).toHaveBeenCalledTimes(1)
    expect(AWS.mocks.changeResourceRecordSetsMock).toHaveBeenCalledTimes(1)
  })
})
