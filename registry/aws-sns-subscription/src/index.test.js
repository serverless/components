const { deploy, remove } = require('./index')
const protocols = require('./protocols/index')

jest.mock('./protocols/index', () => ({
  getProtocol: jest.fn((value) => ({
    deploy: jest.fn(() => ({
      subscriptionArn: 'subscriptionArn',
      statement: 'statement'
    })),
    remove: jest.fn(),
    types: [value]
  }))
}))

afterEach(() => {
  protocols.getProtocol.mockClear()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('protocol index tests', () => {
  it('should deploy subscription', async () => {
    const inputs = { topic: 'topic-arn', protocol: 'lambda', endpoint: 'lambda-arn' }
    const contextMock = {
      log: () => {},
      saveState: jest.fn(),
      setOutputs: jest.fn(),
      state: {
        topic: 'topic-arn',
        protocol: 'lambda',
        endpoint: 'lambda-arn',
        subscriptionArn: `arn:aws:sns:us-east-1:000000000000:${
          inputs.topic
        }:00000000-0000-0000-0000-000000000000`
      }
    }
    await deploy(inputs, contextMock)
    expect(protocols.getProtocol).toHaveBeenCalledTimes(1)
    expect(contextMock.saveState).toHaveBeenCalledTimes(1)
    expect(contextMock.setOutputs).toHaveBeenCalledTimes(1)
    expect(contextMock.setOutputs.mock.calls[0][0]).toEqual(
      expect.objectContaining({ arn: 'subscriptionArn' })
    )
  })

  it('should remove subscription when protocol changes and then deploy new', async () => {
    const inputs = { topic: 'topic-arn', protocol: 'http', endpoint: 'http://serverless.com' }
    const contextMock = {
      log: () => {},
      saveState: jest.fn(),
      setOutputs: jest.fn(),
      state: {
        topic: 'topic-arn',
        protocol: 'lambda',
        endpoint: 'lambda-arn',
        subscriptionArn: `arn:aws:sns:us-east-1:000000000000:${
          inputs.topic
        }:00000000-0000-0000-0000-000000000000`
      }
    }
    await deploy(inputs, contextMock)
    expect(protocols.getProtocol).toHaveBeenCalledTimes(2)
    expect(contextMock.saveState).toHaveBeenCalledTimes(2)
    expect(contextMock.setOutputs).toHaveBeenCalledTimes(2)
    expect(contextMock.setOutputs.mock.calls[0][0]).toEqual({})
    expect(contextMock.setOutputs.mock.calls[1][0]).toEqual(
      expect.objectContaining({ arn: 'subscriptionArn' })
    )
  })

  it('should remove subscription', async () => {
    const inputs = { topic: 'topic-arn', protocol: 'lambda', endpoint: 'lambda-arn' }
    const contextMock = {
      log: () => {},
      saveState: jest.fn(),
      setOutputs: jest.fn(),
      state: {
        topic: 'topic-arn',
        protocol: 'lambda',
        endpoint: 'lambda-arn',
        subscriptionArn: `arn:aws:sns:us-east-1:000000000000:${
          inputs.topic
        }:00000000-0000-0000-0000-000000000000`
      }
    }
    await remove(inputs, contextMock)
    expect(protocols.getProtocol).toHaveBeenCalledTimes(1)
    expect(contextMock.saveState).toHaveBeenCalledTimes(1)
    expect(contextMock.setOutputs).toHaveBeenCalledTimes(1)
    expect(contextMock.setOutputs.mock.calls[0][0]).toEqual({})
  })
})
