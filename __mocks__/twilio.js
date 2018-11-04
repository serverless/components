import crypto from 'crypto'

const mocks = {
  incomingPhoneNumbersCreate: jest.fn((params) => ({
    ...params,
    sid: crypto
      .createHash('md5')
      .update(params.phoneNumber)
      .digest('hex')
  })),
  incomingPhoneNumbersList: jest.fn().mockReturnValue([]),
  incomingPhoneNumbersRemove: jest.fn(),
  incomingPhoneNumbersUpdate: jest.fn((params) => ({
    ...params,
    sid: crypto
      .createHash('md5')
      .update(params.phoneNumber)
      .digest('hex')
  })),
  incomingPhoneNumbers: jest.fn(() => {
    return {
      remove: mocks.incomingPhoneNumbersRemove,
      update: mocks.incomingPhoneNumbersUpdate
    }
  })
}

const mockSdk = {
  incomingPhoneNumbers: mocks.incomingPhoneNumbers
}

mockSdk.incomingPhoneNumbers.create = mocks.incomingPhoneNumbersCreate
mockSdk.incomingPhoneNumbers.list = mocks.incomingPhoneNumbersList

const twilio = function() {
  return mockSdk
}
twilio.mocks = mocks

export default twilio
