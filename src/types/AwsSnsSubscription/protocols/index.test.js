import { types, getProtocol } from './index'

describe('SNS Subscription - Protocol index tests', () => {
  it('should return correct types', () => {
    expect(types).toEqual([
      'application',
      'email',
      'email-json',
      'http',
      'https',
      'lambda',
      'sms',
      'sqs'
    ])
  })

  it('should return correct protocol', () => {
    expect(getProtocol('application').types).toEqual(['application'])
    expect(getProtocol('email').types).toEqual(['email', 'email-json'])
    expect(getProtocol('email-json').types).toEqual(['email', 'email-json'])
    expect(getProtocol('http').types).toEqual(['http', 'https'])
    expect(getProtocol('https').types).toEqual(['http', 'https'])
    expect(getProtocol('lambda').types).toEqual(['lambda'])
    expect(getProtocol('sms').types).toEqual(['sms'])
    expect(getProtocol('sqs').types).toEqual(['sqs'])
  })

  it('should throw error when fetching incorrect protocol', () => {
    let protocol
    try {
      protocol = getProtocol('incorrect')
    } catch (exception) {
      expect(exception.message).toEqual('Invalid protocol "incorrect"')
    }
    expect(protocol).toBeUndefined()
  })
})
