import { get } from '@serverless/utils'
import twilio from 'twilio'

const TwilioProvider = {
  getSdk() {
    return twilio(get('credentials.accountSid', this), get('credentials.authToken', this))
  }
}

export default TwilioProvider
