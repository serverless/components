import twilio from 'twilio'

const TwilioProvider = {
  construct({ accountSid, authToken }) {
    this.sdk = twilio(accountSid, authToken)
  },
  getSdk() {
    return this.sdk
  }
}

export default TwilioProvider
