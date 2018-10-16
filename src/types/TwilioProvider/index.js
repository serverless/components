import { resolve } from '@serverless/utils'
import twilio from 'twilio'

const TwilioProvider = (SuperClass) =>
  class extends SuperClass {
    constructor(inputs, context) {
      super(
        {
          credentials: {
            accountSid: inputs.accountSid,
            authToken: inputs.authToken
          }
        },
        context
      )
    }
    getSdk() {
      return twilio(resolve(this.credentials.accountSid), resolve(this.credentials.authToken))
    }
  }

export default TwilioProvider
