import { get } from '@serverless/utils'
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
      return twilio(get('credentials.accountSid', this), get('credentials.authToken', this))
    }
  }

export default TwilioProvider
